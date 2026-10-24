import { Color, Vector3 } from 'three';
import { Dummy } from '../Dummy.js';
import { DummyField } from '../DummyField.js';
import { DecalType } from '../../effects/GroundDecals.js';
import { BurstMode } from '../../effects/BurstSphere.js';
import { settings, CastShape, castShapeOf, zoneRadiusOf } from '../../config/settings.js';
import { elementOf, ELEMENT_GROUPS } from '../../config/elements.js';
import { CombatStateManager, DEFAULT_BUDGET } from './CombatStateManager.js';
import { resolvePair, pairTable, foldElements } from './reactions.js';
import { PROPOSED, MECHANIC_FAMILIES } from './registry.js';
import { CombatFeed } from './CombatFeed.js';

/**
 * Plugs the sandbox — every pack, all 230 castables — into the combat manager.
 *
 * Nothing vendored is edited. The adapter wraps the five places casts already
 * pass through:
 *
 *   - **cast** — `AbilityManager#cast` (native) and each hosted runtime's
 *     `cast`. The instance that appears in `active` is tagged with its uid,
 *     element and a cast id, and a `cast-start` goes in.
 *   - **update** — each tagged instance's `update` runs inside an attribution
 *     scope, so a cast that picks its own targets is known to be the one
 *     felling them.
 *   - **field hits** — `DummyField#applyHits` / `applyHitsWith` run one cast
 *     at a time under that cast's scope.
 *   - **Dummy#kill / #freeze** — a body going down inside a scope is a `hit`
 *     of that cast's element on that body.
 *   - **summons and buffs** — a hosted pack's `toggleSummon` tags the summon
 *     like a cast; its `action` (a buff switched on) is a `status` on the caster.
 *   - **landing** — the frame a cast's front reaches its end, its footprint
 *     (a disc for a far cast, a capsule for a line) becomes an element region.
 *
 * Each frame it hands positions and life to the manager, steps it, applies
 * the kills it issues (under the reaction's own scope, so a chain is counted
 * and capped) and turns its cues into a decal, a burst and a feed line.
 * Renderers never deal secondary damage: only the outbox does.
 */

const CASTER = 'caster';
const PLAYER = 'player';
const TARGETS = 'targets';

const ACCENT = Object.fromEntries(ELEMENT_GROUPS.map((g) => [g.id, g.accent]));
const _a = new Color();
const _b = new Color();
const _p = new Vector3();
const _q = new Vector3();

let castCounter = 0;

export class PackAdapter {
  constructor(app, budget = {}) {
    this.app = app;
    this.manager = new CombatStateManager(budget);
    this.enabled = true;
    this.cues = true;
    /** The cast (or reaction) a body going down right now belongs to. */
    this.scope = null;
    /** ability instance → { uid, element, castId, landed } for the current cast. */
    this._meta = new WeakMap();
    this._wrapped = new WeakSet();
    this._ids = new WeakMap();
    this._byId = new Map();
    this._tracked = new Set();
    this._nextDummy = 0;
    this.feed = new CombatFeed(document.body);
    this._install();
  }

  /* ------------------------------------------------------------------ */
  /* hooks                                                               */
  /* ------------------------------------------------------------------ */

  _install() {
    const adapter = this;
    const app = this.app;

    // Native casts.
    const nativeCast = app.abilities.cast.bind(app.abilities);
    app.abilities.cast = (origin, direction, distance, element = app.abilities.selected) => {
      const before = new Set(app.abilities.active);
      const result = nativeCast(origin, direction, distance, element);
      adapter._tagNew(app.abilities.active, before, (ability) => app.uidOf(ability.element));
      return result;
    };

    // Field hit passes: one cast at a time, under its scope.
    const field = app.dummies;
    const applyHits = DummyField.prototype.applyHits;
    const applyHitsWith = DummyField.prototype.applyHitsWith;
    field.applyHits = function (abilities) {
      for (const ability of abilities) adapter._within(ability, () => applyHits.call(this, [ability]));
    };
    field.applyHitsWith = function (abilities, shapeOf, radiusOf) {
      for (const ability of abilities) adapter._within(ability, () => applyHitsWith.call(this, [ability], shapeOf, radiusOf));
    };

    // A body going down is a hit of whatever is in scope.
    for (const name of ['kill', 'freeze']) {
      const original = Dummy.prototype[name];
      if (original.__ucsm) continue;
      const wrapped = function (...args) {
        const fell = original.apply(this, args);
        if (fell && adapter.enabled && adapter.scope) adapter._hit(this, adapter.scope);
        return fell;
      };
      wrapped.__ucsm = true;
      Dummy.prototype[name] = wrapped;
    }
  }

  /** Hosted runtimes load lazily; wrap each the first time it is seen. */
  _wrapRuntime(runtime) {
    if (runtime.__ucsm) return;
    runtime.__ucsm = true;
    const original = runtime.cast.bind(runtime);
    runtime.cast = (id, origin, direction, distance) => {
      const before = new Set(runtime.active);
      const result = original(id, origin, direction, distance);
      this._tagNew(runtime.active, before, () => `${runtime.pack}/${id}`, runtime);
      return result;
    };
    // Controllable summons deploy through the pack's own manager, not `cast`.
    if (runtime.toggleSummon) {
      const toggle = runtime.toggleSummon;
      runtime.toggleSummon = (id, cooldowns) => {
        const before = new Set(runtime.active);
        const line = toggle(id, cooldowns);
        this._tagNew(runtime.active, before, () => `${runtime.pack}/${id}`, runtime);
        return line;
      };
    }
    // Buffs: switching one on is a status on the caster, of the buff's element.
    if (runtime.action && runtime.buffs) {
      const action = runtime.action;
      runtime.action = (name) => {
        const line = action(name);
        const uid = `${runtime.pack}/${name}`;
        const element = elementOf(uid);
        if (this.enabled && element && runtime.buffs[name]?.buff.active) {
          const c = this.app.character.position;
          this.manager.submit({ type: 'status', element, abilityUid: uid, castId: `cast:${++castCounter}`, ownerId: CASTER, teamId: PLAYER, targetIds: [CASTER], position: [c.x, 0, c.z] });
        }
        return line;
      };
    }
  }

  /** Tag the instances a cast just added to `active`. */
  _tagNew(active, before, uidOf, runtime = null) {
    for (const ability of active) {
      if (before.has(ability)) continue;
      const uid = uidOf(ability);
      const element = elementOf(uid);
      if (!element) continue;
      const meta = { uid, element, castId: `cast:${++castCounter}`, landed: false, runtime, depth: 0 };
      this._meta.set(ability, meta);
      this._tracked.add(ability);
      this._wrapUpdate(ability);
      if (this.enabled) {
        const o = ability.origin;
        this.manager.submit({ type: 'cast-start', element, abilityUid: uid, castId: meta.castId, ownerId: CASTER, teamId: PLAYER, position: [o.x, 0, o.z] });
      }
    }
  }

  _wrapUpdate(ability) {
    if (this._wrapped.has(ability)) return;
    this._wrapped.add(ability);
    const original = ability.update.bind(ability);
    ability.update = (dt) => this._within(ability, () => original(dt));
  }

  _within(ability, run) {
    const meta = this._meta.get(ability);
    if (!meta) return run();
    const outer = this.scope;
    this.scope = meta;
    try {
      return run();
    } finally {
      this.scope = outer;
    }
  }

  /* ------------------------------------------------------------------ */
  /* the frame                                                           */
  /* ------------------------------------------------------------------ */

  _dummyId(dummy) {
    let id = this._ids.get(dummy);
    if (!id) {
      id = `dummy:${this._nextDummy++}`;
      this._ids.set(dummy, id);
      this._byId.set(id, dummy);
    }
    return id;
  }

  _hit(dummy, scope) {
    const id = this._dummyId(dummy);
    const p = dummy.position;
    this.manager.upsertEntity({ id, teamId: TARGETS, position: [p.x, 0, p.z] });
    this.manager.submit({
      type: 'hit',
      element: scope.element,
      abilityUid: scope.uid,
      castId: scope.castId,
      ownerId: CASTER,
      teamId: PLAYER,
      targetIds: [id],
      position: [p.x, 0, p.z],
      depth: scope.depth ?? 0,
      parentReactionId: scope.reactionId ?? null
    });
  }

  /** Every frame, after all hits have been read. */
  update(dt) {
    if (!this.enabled) return;
    const app = this.app;
    for (const runtime of app.runtimes.values()) this._wrapRuntime(runtime);

    const m = this.manager;
    const c = app.character.position;
    m.upsertEntity({ id: CASTER, teamId: PLAYER, position: [c.x, 0, c.z] });
    for (const slot of app.dummies.slots) {
      const d = slot.dummy;
      const id = this._dummyId(d);
      m.upsertEntity({ id, teamId: TARGETS, position: [d.position.x, 0, d.position.z], alive: d.alive });
    }

    // Landings and endings.
    for (const ability of this._tracked) {
      const meta = this._meta.get(ability);
      if (!ability.isActive) {
        this._tracked.delete(ability);
        continue;
      }
      if (!meta.landed && ability.u >= 1) {
        meta.landed = true;
        this._land(ability, meta);
      }
    }

    m.step(dt);
    const { effects, cues } = m.drain();
    for (const effect of effects) this._applyEffect(effect);
    if (this.cues) for (const cue of cues) this._present(cue);
    this.feed.update(dt, cues);
    this.feed.badges(app.camera, app.renderer.gl.domElement, m, this._byId);
  }

  /** The footprint a landed cast leaves: its element on the floor. */
  _land(ability, meta) {
    const shapeOf = meta.runtime ? meta.runtime.castShapeOf : castShapeOf;
    const id = ability.element;
    ability.pointAt(1, _p);
    let shape;
    if (shapeOf(id) === CastShape.ZONE) {
      const r = meta.runtime ? meta.runtime.meta(id).zoneRadius ?? 3 : zoneRadiusOf(id);
      shape = { kind: 'disc', x: _p.x, z: _p.z, r: Math.max(0.8, r || 3) };
    } else {
      const o = ability.origin;
      shape = { kind: 'capsule', ax: o.x, az: o.z, bx: _p.x, bz: _p.z, r: 1.1 };
    }
    this.manager.submit({ type: 'terrain-impact', element: meta.element, abilityUid: meta.uid, castId: meta.castId, ownerId: CASTER, teamId: PLAYER, position: [_p.x, 0, _p.z], shape });
  }

  _applyEffect(effect) {
    if (effect.kind !== 'kill') return;
    const dummy = this._byId.get(effect.targetId);
    if (!dummy || !dummy.alive) {
      this.manager.settle(effect.effectId, effect.targetId);
      return;
    }
    const reaction = this.manager.log.find((r) => r.reactionId === effect.reactionId);
    _q.set(dummy.position.x - effect.from[0], 0, dummy.position.z - effect.from[1]);
    if (_q.lengthSq() < 1e-6) _q.set(0, 0, 1);
    _q.normalize();
    const hit = settings.dummies.hit;
    const force = { impulse: hit.impulse * Math.min(1.5, effect.intensity), lift: effect.lift, spin: hit.spin };
    // A reaction's kill is a hit of the reaction itself, one generation deeper.
    const scope = { uid: `reaction/${reaction?.elements.join('|') ?? 'unknown'}`, element: reaction?.elements[1] ?? 'arcane', castId: effect.reactionId, depth: reaction?.depth ?? 1, reactionId: effect.reactionId };
    const outer = this.scope;
    this.scope = scope;
    try {
      dummy.kill(_q.x, _q.z, force);
    } finally {
      this.scope = outer;
    }
    this.manager.settle(effect.effectId, effect.targetId);
  }

  /** A cue becomes something you can see. Renderers never deal damage. */
  _present(cue) {
    const app = this.app;
    if (cue.kind === 'reaction') {
      const [a, b] = cue.elements;
      _a.set(ACCENT[a] ?? '#ffffff');
      _b.set(ACCENT[b] ?? '#ffffff');
      _p.set(cue.position[0], 0, cue.position[2]);
      app.decals.spawn(DecalType.SHOCKWAVE, _p, { radius: cue.radius * 1.2, life: 1.1, width: 0.1, intensity: 1.2, colorA: _a, colorB: _b, height: 0.04 });
      app.bursts.spawn(BurstMode.AIR, _p.setY(0.6), { radius: 0.2, endRadius: Math.min(3, cue.radius * 0.8), life: 0.5, intensity: 0.9, opacity: 0.35, squash: 0.4, colorA: _b, colorB: _a, colorC: _a.clone().multiplyScalar(0.3) });
      app.shake.add(0.15 * cue.intensity, 3, 14);
    } else if (cue.kind === 'region' && cue.depth > 0) {
      // A reaction's lingering field (steam, wildfire, ice …): mark it on the floor.
      _a.set(ACCENT[cue.element] ?? '#ffffff');
      const s = cue.shape;
      _p.set(s.x ?? (s.ax + s.bx) / 2, 0, s.z ?? (s.az + s.bz) / 2);
      app.decals.spawn(DecalType.DUSTRING, _p, { radius: s.r, life: 2.4, intensity: 0.8, colorA: _a, colorB: _a, height: 0.03 });
    }
  }

  /* ------------------------------------------------------------------ */
  /* console / bridge                                                    */
  /* ------------------------------------------------------------------ */

  api() {
    const m = this.manager;
    return {
      manager: m,
      preview: (a, b) => resolvePair(a, b),
      fold: (order) => foldElements(order),
      pairs: () => pairTable(),
      registry: PROPOSED,
      families: MECHANIC_FAMILIES,
      budget: m.budget,
      stats: () => ({ ...m.stats, tick: m.tick, regions: m.regions.size }),
      log: () => m.log.map((r) => ({ kind: r.kind, tier: r.tier, elements: r.elements, depth: r.depth, intensity: r.intensity }))
    };
  }

  /** Editor folder: switches and the budget. */
  buildEditor(gui) {
    const folder = gui.addFolder('Combat — unified state');
    folder.add(this, 'enabled').name('on');
    folder.add(this, 'cues').name('reaction VFX');
    folder.add(this.feed, 'visible').name('reaction feed');
    folder.add(this.feed, 'showBadges').name('status badges');
    const b = this.manager.budget;
    folder.add(b, 'maxDepth', 0, 6, 1).name('chain depth');
    folder.add(b, 'reactionsPerTick', 1, 32, 1).name('reactions / tick');
    folder.add(b, 'reactionsPerEntityPerTick', 1, 8, 1).name('per body / tick');
    folder.add(b, 'exposure', 0.5, 12, 0.1).name('status life (s)');
    folder.add(b, 'regionLife', 0.5, 12, 0.1).name('region life (s)');
    folder.add(b, 'diminish', 0, 2, 0.05).name('diminishing');
    folder.add(b, 'maxIntensity', 1, 6, 0.1).name('intensity cap');
    folder.close();
    return folder;
  }
}

export { DEFAULT_BUDGET };
