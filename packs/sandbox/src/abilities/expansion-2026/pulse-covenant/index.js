import { Color, Group, InstancedMesh, Mesh, Object3D, PlaneGeometry, Vector3 } from 'three';
import { Ability as BaseAbility, AbilityPhase } from '../../Ability.js';
import { CAST_ANIMATIONS, settings } from '../../../config/settings.js';
import { LAYER } from '../../../core/Layers.js';
import { frame } from '../../../core/FrameUniforms.js';
import { getColor } from '../../../utils/color.js';
import { Easing } from '../../../utils/math.js';
import { createExpansionFX, routeExpansionTransparency, expansionBurst, ParticleShape } from '../ExpansionFX.js';
import { bindExpansionCombat } from '../StandaloneCombat.js';
import config from './config.js';
import {
  heartGeometry,
  vesselCurves,
  taperedTube,
  bloodCellGeometry,
  gateRingGeometry,
  pulseRingGeometry
} from './PulseCovenantGeometry.js';
import {
  createHeartMaterial,
  createArteryMaterial,
  createCellMaterial,
  createCovenantFloorMaterial,
  createGateMaterial,
  createPulseRingMaterial,
  createPulseWarpMaterial
} from './PulseCovenantMaterials.js';

export { config };
export const ID = config.id;
const UID = 'matrix-expansion/pulse-covenant';

const TAU = Math.PI * 2;
/** Arteries in the network; three cells ride each. */
const ARTERIES = 6;
const CELLS_PER_ARTERY = 3;
/** Events remembered for de-duplication. Bounded so a long covenant cannot grow. */
const MAX_REMEMBERED = 128;
/** The combat bridge refuses more than eight targets per hit. */
const MAX_PULSE_TARGETS = 8;

const clamp = (x) => Math.max(0, Math.min(1, x));

/* Module scratch: no allocation per frame. */
const beadTransform = new Object3D();
const _emit = {};
const _up = new Vector3(0, 1, 0);
const _at = new Vector3();
const _heart = { time: 0, beat: 0, fade: 1, dissolve: 0 };
const _artery = { flow: 0, grow: 1, fade: 1, flare: 0 };
const _cell = { fade: 1, flare: 0 };
const _floor = { time: 0, beat: 0, pulse: 0, fade: 1, cue: 0, cueAlpha: 0, window: 0, gate: 0.5 };
const _gate = { sweep: 0, window: 0, beat: 0, fade: 1 };
const _ring = { progress: 0, alpha: 0 };
const _warp = { radius: 1, progress: 0 };

/**
 * A heartbeat as a doubled thump ("lub-dub") rather than a sine: a strong
 * contraction at the start of each beat and a weaker one a fifth later.
 */
function heartbeat(phase) {
  const p = phase - Math.floor(phase);
  const lub = Math.exp(-Math.pow(p / 0.07, 2)) + Math.exp(-Math.pow((1 - p) / 0.07, 2));
  const dub = 0.6 * Math.exp(-Math.pow((p - 0.22) / 0.06, 2));
  return Math.min(1, lub + dub);
}

/**
 * PULSE COVENANT — a heart bound above the caster that answers rhythm.
 *
 * A self cast that is a *reactive window* rather than an attack. It never
 * strikes on its own: it subscribes to the caster's committed hits on the
 * combat bridge and, whenever two **different** casts land hits one
 * `beatSeconds` apart (± `tolerance`), it sends a pulse of blood through up
 * to `maxTargets` enemies within `pulseRadius` of the second hit — never the
 * ones that hit already took. Its own hits, repeated events and later hits
 * from a cast it has already counted never count.
 *
 * ## Layers (each a folder in the editor)
 *
 *   1. **the heart** — authored, deep-bevelled two-lobed muscle hanging over
 *      the caster (`createHeartMaterial`: wrap-lit muscle, striations, veins
 *      that flare on the beat, a wet fresnel rim). It swells into being on the
 *      cast, beats lub-dub on the rhythm, kicks on a pulse, and burns away
 *      apex-up on the exit.
 *   2. **the arteries** — six tapered vessels draped to the floor, each with
 *      a capillary fork (`taperedTube`), growing out on the cast, a bolus of
 *      light running down them once per beat; instanced red cells
 *      (`bloodCellGeometry`) riding the six main curves.
 *   3. **the covenant floor** — the sigil round the caster: capillaries,
 *      breathing rings and the **timing cue**: after each owned hit a ring
 *      contracts from the rim to the gate over exactly one beat and burns
 *      while the next hit would land in the window, so the player can *see*
 *      the rhythm the mechanic wants. The gate (`gateRingGeometry`) flares in
 *      the same window.
 *   4. **the pulse** — thrown from the second hit, not from the caster: a
 *      ragged ring across `pulseRadius`, an outward warp on
 *      `LAYER.DISTORTION`, a burst of droplets, a second pooled light at the
 *      contact point, camera shake, flash and a light punch on the caster.
 *   5. **particles** — one pooled droplet system (`expansion.blood`): the
 *      burst a pulse throws, and beads of blood jumping off the sigil's rim
 *      on every heartbeat.
 *
 * ## Timing
 *
 * The rhythm is judged on the bridge's fixed ticks (`e.tick / tickRate`),
 * never on frame time, so it is deterministic. The visual cue uses the cast's
 * age at the moment the hit was observed, which is the same instant on screen.
 * The covenant lasts `life` seconds (gameplay; not scaled by the global
 * lifetime) and withdraws over `fade`.
 */
export class Ability extends BaseAbility {
  constructor(ctx) {
    super(ID, ctx);
  }

  /** It never strikes along a line; every hit it makes is its own pulse. */
  get handlesOwnHits() {
    return true;
  }

  get impactDuration() {
    return this.config.life;
  }

  get fadeDuration() {
    return Math.max(0.05, (this.config.fade ?? 0.6) * Math.max(0.1, settings.global.lifetime));
  }

  /** Cells riding the arteries plus the visible meshes. HUD readout only. */
  get instanceCount() {
    return this.vesselBeads.count + this.branches.length + 1;
  }

  /** The caster's light swells on every heartbeat. */
  lightShimmer() {
    const c = this.config;
    return 1 - c.lightThrob * 0.5 + c.lightThrob * heartbeat(this.age / Math.max(0.1, c.beatSeconds));
  }

  /* ------------------------------------------------------------------ */
  /* Construction                                                        */
  /* ------------------------------------------------------------------ */

  createShaders() {
    /** Every geometry and material this instance owns, for `dispose`. */
    this.resources = [];
    const own = (x) => (this.resources.push(x), x);

    this.root = new Group();
    this.group.add(this.root);

    /* ---- 1 · the heart ---- */
    this.heartMat = own(createHeartMaterial());
    this.core = new Mesh(own(heartGeometry()), this.heartMat);
    this.core.position.set(0, 1.5, 0);
    this.core.scale.setScalar(0.48);
    this.core.renderOrder = 2;
    this.root.add(this.core);

    /* ---- 2 · the arteries, forks and cells ---- */
    // One sub-group so `arteryReach` scales vessels and cells together.
    this.network = new Group();
    this.root.add(this.network);
    const { arteries, forks } = vesselCurves();
    this.vesselCurves = arteries;
    this.veinMat = own(createArteryMaterial());
    this.forkMat = own(createArteryMaterial());
    this.branches = [];
    for (let k = 0; k < ARTERIES; k++) {
      const vein = new Mesh(own(taperedTube(arteries[k], 56, 8, 0.045, 0.02)), this.veinMat);
      this.network.add(vein);
      this.branches.push(vein);
    }
    this.forks = [];
    for (let k = 0; k < ARTERIES; k++) {
      const fork = new Mesh(own(taperedTube(forks[k], 24, 6, 0.022, 0.008)), this.forkMat);
      this.network.add(fork);
      this.forks.push(fork);
    }
    this.cellMat = own(createCellMaterial());
    /** The shared cell material under its original name. */
    this.glow = this.cellMat;
    this.vesselBeads = new InstancedMesh(own(bloodCellGeometry()), this.cellMat, ARTERIES * CELLS_PER_ARTERY);
    this.vesselBeads.frustumCulled = false;
    this.network.add(this.vesselBeads);

    /* ---- 3 · the covenant floor and its gate ---- */
    this.membrane = own(createCovenantFloorMaterial());
    this.floor = new Mesh(own(new PlaneGeometry(1, 1)), this.membrane);
    this.floor.rotation.x = -Math.PI / 2;
    this.floor.position.y = 0.05;
    this.root.add(this.floor);
    this.gateMat = own(createGateMaterial());
    this.ring = new Mesh(own(gateRingGeometry()), this.gateMat);
    this.ring.position.y = 0.07;
    this.root.add(this.ring);

    /* ---- 4 · the pulse — lives in world space at the triggering hit ---- */
    this.waveMaterial = own(createPulseRingMaterial());
    this.pulseWave = new Mesh(own(pulseRingGeometry()), this.waveMaterial);
    this.pulseWave.visible = false;
    this.group.add(this.pulseWave);
    this.warpMat = own(createPulseWarpMaterial());
    this.pulseWarp = new Mesh(own(new PlaneGeometry(1, 1, 1, 1)), this.warpMat);
    this.pulseWarp.visible = false;
    this.group.add(this.pulseWarp);

    for (const mesh of [this.core, ...this.branches, ...this.forks, this.vesselBeads, this.floor, this.ring, this.pulseWave]) {
      mesh.layers.set(LAYER.VFX);
      mesh.frustumCulled = false;
    }
    routeExpansionTransparency(this.group);
    // The warp proxy is *not* a transparent effect (its material is opaque,
    // see createPulseWarpMaterial), so the sweep leaves it alone and it can
    // live on the distortion layer only.
    this.pulseWarp.layers.set(LAYER.DISTORTION);
    this.pulseWarp.frustumCulled = false;

    /* ---- per-cast state (reset in onSpawn) ---- */
    this._unsub = null;
    this._scope = null;
    this._lastTick = null;
    this._lastHitAge = -1;
    this.failure = null;
    this._pulseAge = 999;
    this._hasPulse = false;
    this._seen = new Set();
    this._seenOrder = [];
    this._casts = new Set();
    this._castOrder = [];
    this._pulseLight = null;
    this._fxPoint = new Vector3();
    this._pulseLightPosition = new Vector3();
    this._pulseLightColor = new Color();
    this._lastBeat = -1;
    this._disposed = false;
  }

  createParticles() {
    // One pooled droplet system, as every batch-C candidate is bound to (the
    // particle-engine integration test pins it). It carries two emissions:
    // the burst a pulse throws, and the beads of blood that jump off the
    // sigil's rim on every heartbeat. Non-additive: it is liquid.
    this.fx = createExpansionFX(this.ctx, 'blood', {
      shape: ParticleShape.DROPLET,
      colors: ['#fff1e7', '#ff8290', '#c11136', '#3d0717'],
      additive: false
    });
    this._gradient = [new Color(), new Color(), new Color(), new Color()];
  }

  /* ------------------------------------------------------------------ */
  /* Casting                                                             */
  /* ------------------------------------------------------------------ */

  onSpawn() {
    this._lastTick = null;
    this._lastHitAge = -1;
    this.failure = null;
    this._pulseAge = 999;
    this._hasPulse = false;
    this._lastBeat = -1;
    this._seen.clear();
    this._seenOrder.length = 0;
    this._casts.clear();
    this._castOrder.length = 0;
    this.root.visible = true;
    this.pulseWave.visible = false;
    this.pulseWarp.visible = false;
    this._bind();
    this._sync(0);
  }

  _bind() {
    const bridge = this.ctx.expansionCombat;
    if (!bridge?.bind) {
      this._bridgeUnavailable = true;
      this.failure = 'combat bridge unavailable';
      return;
    }
    const scope = bindExpansionCombat(this.ctx, UID);
    this._scope = scope;
    this._bridgeUnavailable = false;
    const sub = scope.on('hit', (e) => this._onHit(e));
    this._bridgeUnavailable = !sub?.ok;
    if (!sub?.ok) this.failure = sub?.reason ?? 'owned hit observation unavailable';
    this._unsub = sub?.ok ? sub.unsubscribe : null;
  }

  /** Remember `key` in a bounded set (oldest forgotten first). */
  _remember(set, order, key) {
    set.add(key);
    order.push(key);
    if (order.length > MAX_REMEMBERED) set.delete(order.shift());
  }

  /* ------------------------------------------------------------------ */
  /* The mechanic                                                        */
  /* ------------------------------------------------------------------ */

  /**
   * A committed owned hit. Counts only once per cast and per event, never for
   * this covenant's own pulses; judges the interval to the previous counted
   * hit on fixed ticks, and on a match emits one bounded pulse.
   */
  _onHit(e) {
    if (!this.isActive || e.ownerId !== 'caster' || e.abilityUid === UID || !e.targetIds?.length || this._seen.has(e.eventId)) return;
    const cast = e.castId ?? e.eventId;
    if (this._casts.has(cast)) return;
    this._remember(this._casts, this._castOrder, cast);
    this._remember(this._seen, this._seenOrder, e.eventId);

    const c = this.config;
    const tickRate = this._scope?.tickRate ?? 30;
    const interval = this._lastTick === null ? Infinity : (e.tick - this._lastTick) / tickRate;
    this._lastTick = e.tick;
    // The timing cue restarts from every counted hit.
    this._lastHitAge = this.age;
    if (Math.abs(interval - c.beatSeconds) > c.tolerance) return;

    const at = e.position;
    const result = this._scope.queryActors({ position: at, radius: c.pulseRadius, relation: 'enemy' });
    if (!result?.ok) return;
    // Fresh array: the event is handed to the combat queue and owns it.
    const ids = [];
    const cap = Math.min(MAX_PULSE_TARGETS, c.maxTargets);
    for (const actor of result.actors) {
      if (ids.length >= cap) break;
      if (actor.alive && !e.targetIds.includes(actor.id)) ids.push(actor.id);
    }
    if (!ids.length) return;
    const sent = this._scope.emit({ type: 'hit', element: 'blood', targetIds: ids, position: at, damage: c.damage, tags: ['pulse-covenant'] });
    if (sent?.ok) this._onPulse(at);
  }

  /** The beat of an accepted pulse, at the hit that completed the rhythm. */
  _onPulse(at) {
    const c = this.config;
    const g = settings.global;
    this._pulseAge = 0;
    this._hasPulse = true;
    this._fxPoint.fromArray(at);
    // The completing hit is also the first of the next pair, so the timing
    // cue keeps running from it (`_lastHitAge` was just set by `_onHit`).
    this.lightBoost = Math.max(this.lightBoost, c.lightPunch * g.lightIntensity);
    if (c.impactShake > 0) this.ctx.shake?.add?.(c.impactShake, 7, 20);
    const flash = c.impactFlash * g.explosionIntensity;
    if (flash > 0) this.ctx.flash?.trigger?.(getColor(c.bloodGlow), flash);
    if (!this._pulseLight) this._pulseLight = this.ctx.lights.acquire();
    this._syncParticles(c);
    expansionBurst(this.fx, this._fxPoint, {
      count: c.dropletCount,
      size: c.dropletSize,
      life: c.dropletLife,
      speed: c.dropletSpeed,
      radius: c.pulseRadius * 0.25
    });
  }

  /* ------------------------------------------------------------------ */
  /* Per frame                                                           */
  /* ------------------------------------------------------------------ */

  onTravel(dt) {
    this._pulseAge += dt;
    this._updatePulseLight(dt);
    this._sync(dt);
  }

  onImpact() {
    this._sync(0);
  }

  onFade(dt) {
    this._pulseAge += dt;
    this._updatePulseLight(dt);
    this._sync(dt);
  }

  _updatePulseLight(dt) {
    if (!this._pulseLight) return;
    const life = Math.max(0.05, this.config.pulseLife ?? 0.65);
    if (this._pulseAge >= life) {
      this.ctx.lights.release(this._pulseLight);
      this._pulseLight = null;
      return;
    }
    const strength = 1 - clamp(this._pulseAge / life);
    this._pulseLightPosition.copy(this._fxPoint).setY(1);
    this._pulseLightColor.copy(getColor(this.config.bloodGlow));
    // Same light globals as the cast's main light, so the editor's light
    // sliders reach the second heartbeat too.
    const g = settings.global;
    this.ctx.lights.set(this._pulseLight, this._pulseLightPosition, this._pulseLightColor,
      this.config.lightIntensity * g.lightIntensity * strength,
      this.config.pulseRadius * 1.5 * g.lightRadius, dt);
  }

  _syncParticles(c) {
    if (!this.fx) return;
    const k = this._gradient;
    k[0].copy(getColor(c.dropletColorA));
    k[1].copy(getColor(c.dropletColorB));
    k[2].copy(getColor(c.dropletColorC));
    k[3].copy(getColor(c.dropletColorD));
    this.fx.setGradient(k[0], k[1], k[2], k[3]);
    const u = this.fx.uniforms;
    u.uOpacity.value = settings.global.opacity;
    u.uGravity.value.set(0, -c.dropletGravity, 0);
  }

  /**
   * Beads of blood jumping off the sigil's rim on a heartbeat: a ring of slow
   * droplets thrown up and falling back. Globals are applied the way
   * `expansionBurst` applies them, since the two emissions share the system.
   */
  _breathe(c) {
    if (!this.fx) return;
    const g = settings.global;
    const count = Math.min(24, Math.round(c.beatDrops * g.particleCount));
    if (count <= 0) return;
    _at.copy(this.root.position).setY(0.1);
    _emit.position = _at;
    _emit.direction = _up;
    _emit.radius = Math.max(0.1, c.floorRadius * 0.85);
    _emit.spread = 0.35;
    _emit.speed = c.beatDropSpeed * g.particleSpeed;
    _emit.speedVariance = 0.4;
    _emit.inherit = null;
    _emit.anchor = null;
    _emit.size = c.beatDropSize * g.particleSize;
    _emit.sizeVariance = 0.4;
    _emit.life = c.beatDropLife * g.particleLifetime;
    _emit.lifeVariance = 0.3;
    _emit.spin = 0;
    _emit.tint = null;
    _emit.time = frame.uTime.value;
    this.fx.emit(count, _emit);
  }

  _sync(dt) {
    const c = this.config;
    const p = this.ctx.character?.position ?? this.origin;
    this.root.position.copy(p);
    this.position.copy(p);
    const beatSeconds = Math.max(0.1, c.beatSeconds);
    const phase = this.age / beatSeconds;
    const beat = heartbeat(phase);
    const fade = this.phase === AbilityPhase.FADE ? 1 - clamp(this.fadeTime / this.fadeDuration) : 1;
    const pulseLife = Math.max(0.05, c.pulseLife ?? 0.65);
    const kick = this._pulseAge < 0.35 ? 1 - this._pulseAge / 0.35 : 0;
    this._syncParticles(c);

    // A new beat: blood beads jump off the sigil.
    const whole = Math.floor(phase);
    if (whole !== this._lastBeat) {
      if (this._lastBeat >= 0 && dt > 0) this._breathe(c);
      this._lastBeat = whole;
    }

    /* ---- the whole covenant recedes together on the exit ---- */
    this.root.scale.setScalar(Math.max(0.001, fade));

    /* ---- 1 · the heart ---- */
    const form = Easing.outBack(clamp(this.age / Math.max(0.05, c.formTime)));
    this.core.position.y = c.heartHeight;
    this.core.scale.setScalar(Math.max(0.001, c.heartSize * form * (1 + beat * c.heartBeat + kick * 0.25)));
    this.core.rotation.y = Math.sin(this.age * 1.2) * 0.1;
    _heart.time = this.age;
    _heart.beat = Math.max(beat, kick);
    _heart.fade = 1;
    _heart.dissolve = clamp(1 - fade);
    this.heartMat.userData.sync(c, _heart);

    /* ---- 2 · arteries, forks, cells ---- */
    const grow = Easing.outCubic(clamp(this.age / Math.max(0.05, c.growTime))) * fade;
    this.network.scale.set(c.arteryReach, 1, c.arteryReach);
    _artery.flow = phase;
    _artery.grow = grow;
    _artery.fade = 1;
    _artery.flare = kick;
    this.veinMat.userData.sync(c, _artery);
    _artery.flow = phase - 0.35;
    this.forkMat.userData.sync(c, _artery);
    for (let i = 0; i < this.branches.length; i++) {
      for (let j = 0; j < CELLS_PER_ARTERY; j++) {
        const progress = (phase + j / CELLS_PER_ARTERY) % 1;
        this.vesselCurves[i].getPoint(progress, beadTransform.position);
        const flare = this._pulseAge < 0.35 ? 1.8 : 1;
        // Cells only show on the part of the vessel that has grown.
        const shown = progress <= grow ? 1 : 0;
        beadTransform.scale.setScalar(shown * c.cellSize * flare * (0.65 + 0.35 * Math.sin(progress * Math.PI)));
        beadTransform.rotation.set(progress * 9 + i, progress * 5, j);
        beadTransform.updateMatrix();
        this.vesselBeads.setMatrixAt(i * CELLS_PER_ARTERY + j, beadTransform.matrix);
      }
    }
    this.vesselBeads.instanceMatrix.needsUpdate = true;
    _cell.fade = fade;
    _cell.flare = kick;
    this.cellMat.userData.sync(c, _cell);

    /* ---- 3 · the floor, the timing cue and the gate ---- */
    const floorRadius = Math.max(0.1, c.floorRadius);
    this.floor.scale.set(floorRadius * 2, floorRadius * 2, 1);
    const gate = clamp(c.gateRadius / floorRadius);
    this.ring.scale.setScalar(Math.max(0.01, c.gateRadius));
    let cue = 0, cueAlpha = 0, window = 0;
    if (this._lastHitAge >= 0) {
      const since = this.age - this._lastHitAge;
      cue = since / beatSeconds;
      window = Math.abs(since - c.beatSeconds) <= c.tolerance ? 1 : 0;
      // Fades once the window has passed without a second hit.
      cueAlpha = 1 - clamp((since - (c.beatSeconds + c.tolerance)) / 0.25);
    }
    _floor.time = this.age;
    _floor.beat = beat;
    _floor.pulse = this._hasPulse && this._pulseAge < pulseLife ? clamp(this._pulseAge / pulseLife) : 0;
    _floor.fade = fade;
    _floor.cue = cue;
    _floor.cueAlpha = cueAlpha;
    _floor.window = window;
    _floor.gate = gate;
    this.membrane.userData.sync(c, _floor);
    _gate.sweep = phase;
    _gate.window = window;
    _gate.beat = beat;
    _gate.fade = fade;
    this.gateMat.userData.sync(c, _gate);

    /* ---- 4 · the pulse ---- */
    this.pulseWave.visible = this._pulseAge < pulseLife && this._hasPulse;
    this.pulseWarp.visible = this.pulseWave.visible;
    if (this.pulseWave.visible) {
      const progress = clamp(this._pulseAge / pulseLife);
      this.pulseWave.position.copy(this._fxPoint);
      this.pulseWave.position.y = 0.1;
      this.pulseWave.scale.setScalar(Math.max(0.01, c.pulseRadius * Easing.outCubic(progress)));
      _ring.progress = progress;
      _ring.alpha = (1 - progress) * fade;
      this.waveMaterial.userData.sync(c, _ring);
      this.pulseWarp.position.copy(this._fxPoint);
      _warp.radius = c.pulseRadius;
      _warp.progress = progress;
      this.warpMat.userData.sync(c, _warp);
    }
  }

  /* ------------------------------------------------------------------ */
  /* Lifecycle                                                           */
  /* ------------------------------------------------------------------ */

  onDestroy() {
    if (this._pulseLight) this.ctx.lights.release(this._pulseLight);
    this._pulseLight = null;
    this._unsub?.();
    this._unsub = null;
    this._scope = null;
    this.root.visible = false;
    this.pulseWave.visible = false;
    this.pulseWarp.visible = false;
    this._hasPulse = false;
    this._seen.clear();
    this._seenOrder.length = 0;
    this._casts.clear();
    this._castOrder.length = 0;
  }

  dispose() {
    if (this._disposed) return;
    this._disposed = true;
    this.onDestroy();
    for (const r of this.resources) r.dispose();
    super.dispose();
  }
}

/* -------------------------------------------------------------------- */
/* Editor                                                               */
/* -------------------------------------------------------------------- */

/**
 * The production `Editor` helpers when they are handed in, plain lil-gui calls
 * when they are not (the candidate harnesses pass a bare folder).
 */
function editorKit(c, Editor) {
  const named = (controller, label) => (label && typeof controller?.name === 'function' ? controller.name(label) : controller);
  const sub = (folder, title) => (typeof folder.addFolder === 'function' ? folder.addFolder(title) : folder);
  const range = (folder, key, min, max, step, label) =>
    Editor?.range ? Editor.range(folder, c, key, min, max, step, label) : named(folder.add(c, key, min, max, step), label);
  const color = (folder, key, label) => named(folder.addColor(c, key), label);
  const gradient = (folder, prefix, title) => {
    if (Editor?.gradient && typeof folder.addFolder === 'function') return Editor.gradient(folder, c, prefix, title);
    const group = sub(folder, title);
    color(group, `${prefix}A`, 'birth');
    color(group, `${prefix}B`, 'early');
    color(group, `${prefix}C`, 'late');
    color(group, `${prefix}D`, 'death');
    return group;
  };
  const cast = (folder) => (Editor?.castAnimation ? Editor.castAnimation(folder, c) : named(folder.add(c, 'castAnim', CAST_ANIMATIONS), 'cast animation'));
  return { sub, range, color, gradient, cast, named };
}

export function buildEditor(gui, c, Editor) {
  const { sub, range: R, color, gradient, cast: castAnimation, named } = editorKit(c, Editor);
  const f = gui.addFolder('♥  Pulse Covenant');

  const cast = sub(f, 'The cast');
  // A self cast by design; shown so the anchoring is visible, not a free choice.
  named(cast.add(c, 'aimStyle', ['self']), 'aim (anchored on caster)');
  R(cast, 'range', 1, 48, 0.1, 'reticle range');
  R(cast, 'minRange', 0, 20, 0.1, 'min range');
  R(cast, 'speed', 1, 200, 1, 'bind speed (m/s)');
  R(cast, 'zoneRadius', 0.5, 8, 0.1, 'reticle radius (m)');
  R(cast, 'cooldown', 0, 30, 0.1, 'cooldown');
  R(cast, 'life', 1, 20, 0.5, 'covenant duration');
  R(cast, 'lifetime', 1, 20, 0.5, 'catalog lifetime (mirror)');
  R(cast, 'fade', 0.05, 3, 0.05, 'withdraws over');
  castAnimation(cast);

  const rhythm = sub(f, 'The rhythm (gameplay)');
  R(rhythm, 'beatSeconds', 0.2, 1.5, 0.05, 'beat (s)');
  R(rhythm, 'tolerance', 0.03, 0.3, 0.01, 'timing window');
  R(rhythm, 'pulseRadius', 1, 8, 0.1, 'pulse radius');
  R(rhythm, 'damage', 0, 2, 0.05, 'pulse damage');
  R(rhythm, 'maxTargets', 1, 8, 1, 'secondary targets');

  const light = sub(f, 'Light & beat');
  color(light, 'lightColor', 'light');
  R(light, 'lightIntensity', 0, 30, 0.1, 'intensity');
  R(light, 'lightRadius', 1, 40, 0.1, 'radius');
  R(light, 'lightPunch', 0, 20, 0.1, 'punch per pulse');
  R(light, 'lightThrob', 0, 1, 0.01, 'heartbeat throb');
  R(light, 'impactShake', 0, 1, 0.01, 'impact shake');
  R(light, 'impactFlash', 0, 1, 0.01, 'impact flash');

  const palette = sub(f, 'Palette');
  color(palette, 'heartColor', 'heart');
  color(palette, 'arteryColor', 'arteries');
  color(palette, 'bloodGlow', 'pulse');

  const heart = sub(f, '1 · The heart');
  R(heart, 'heartSize', 0.1, 1.5, 0.01, 'size');
  R(heart, 'heartHeight', 0.5, 3, 0.05, 'height (m)');
  R(heart, 'formTime', 0.05, 2, 0.05, 'forms over');
  R(heart, 'heartBeat', 0, 0.6, 0.01, 'beat swell');
  R(heart, 'heartSquash', 0, 0.5, 0.01, 'contraction');
  R(heart, 'heartGlow', 0, 6, 0.05, 'glow');
  R(heart, 'heartFresnel', 0, 6, 0.05, 'wet rim');
  R(heart, 'heartVeins', 0, 2, 0.05, 'veins');

  const arteries = sub(f, '2 · The arteries');
  R(arteries, 'growTime', 0.05, 2, 0.05, 'grow out over');
  R(arteries, 'arteryReach', 0.3, 2, 0.05, 'reach');
  R(arteries, 'arteryGlow', 0, 6, 0.05, 'bolus glow');
  R(arteries, 'arterySwell', 0, 3, 0.05, 'wall swell');
  R(arteries, 'cellSize', 0, 3, 0.05, 'cell size');
  R(arteries, 'cellGlow', 0, 6, 0.05, 'cell glow');

  const floor = sub(f, '3 · The covenant floor');
  R(floor, 'floorRadius', 0.5, 4, 0.05, 'sigil radius (m)');
  R(floor, 'floorGlow', 0, 6, 0.05, 'sigil glow');
  R(floor, 'floorVeins', 0, 2, 0.05, 'capillaries');
  R(floor, 'gateRadius', 0.2, 3, 0.05, 'gate radius (m)');
  R(floor, 'cueGlow', 0, 6, 0.05, 'timing cue glow');

  const pulse = sub(f, '4 · The pulse');
  R(pulse, 'pulseLife', 0.1, 2, 0.05, 'crosses over');
  R(pulse, 'pulseWidth', 0.05, 0.8, 0.01, 'ring band');
  R(pulse, 'pulseGlow', 0, 6, 0.05, 'ring glow');
  R(pulse, 'warpStrength', 0, 3, 0.01, 'warp strength');

  const particles = sub(f, '5 · Particles');
  const drops = sub(particles, 'Droplets');
  R(drops, 'dropletCount', 0, 128, 1, 'per pulse');
  R(drops, 'dropletSize', 0.02, 0.5, 0.01, 'size');
  R(drops, 'dropletLife', 0.1, 3, 0.05, 'lifetime');
  R(drops, 'dropletSpeed', 0, 10, 0.1, 'speed');
  gradient(drops, 'dropletColor', 'Droplet colour');
  R(drops, 'dropletGravity', 0, 20, 0.1, 'gravity');
  const beads = sub(particles, 'Heartbeat beads');
  R(beads, 'beatDrops', 0, 24, 1, 'per heartbeat');
  R(beads, 'beatDropSize', 0.01, 0.3, 0.005, 'size');
  R(beads, 'beatDropSpeed', 0, 6, 0.05, 'jump speed');
  R(beads, 'beatDropLife', 0.1, 2, 0.05, 'lifetime');

  return f;
}
