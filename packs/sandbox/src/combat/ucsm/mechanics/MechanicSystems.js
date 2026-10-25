import { shapeContains, shapesOverlap } from '../CombatStateManager.js';
import { MECHANIC_PRESETS as P, MECHANIC_BUDGET } from './presets.js';
import { resolvePair, TIER } from '../reactions.js';
const dist = (a, b) => Math.hypot(a[0] - b[0], a[2] - b[2]);
const disc = (p, r) => ({ kind: 'disc', x: p[0], z: p[2], r });
const segment = (a, b, r = 0) => ({ kind: 'capsule', ax: a[0], az: a[2], bx: b[0], bz: b[2], r });
const sorted = (map) => [...map.values()].sort((a, b) => a.id.localeCompare(b.id));
const snap = (n) => Math.round(n * 1000) / 1000;

/** Three anchors per owner; live topology is rebuilt every tick, never cached. */
export class WeavingManager {
  constructor(s) {
    this.s = s;
    this.anchors = s.m.anchors;
    this.links = [];
    this.hitCooldowns = new Map();
  }
  activate(c) {
    const s = this.s,
      p = P.weave,
      own = sorted(this.anchors).filter((a) => a.ownerId === c.ownerId);
    if (own.length >= p.maxAnchors || this.anchors.size >= s.b.maxAnchors) return 'anchor limit';
    if (own.some((a) => dist(a.position, c.position) < 1.5)) return 'anchors too close';
    if (own.length && !own.some((a) => dist(a.position, c.position) <= p.maxLink)) return 'link exceeds 14 m';
    const a = { ...c, id: c.id, health: p.anchorHealth, expiresTick: s.m.tick + s.t(p.life) };
    this.anchors.set(a.id, a);
    s.cue('anchor', a);
    return null;
  }
  beforeEvent(e) {
    if (!['hit', 'terrain-impact'].includes(e.type)) return;
    for (const a of sorted(this.anchors)) {
      const owner = this.s.m.entities.get(a.ownerId);
      if (e.teamId === owner?.teamId) continue;
      if ((e.shape && shapeContains(e.shape, a.position[0], a.position[2])) || e.targetIds.includes(a.id)) {
        a.health -= Math.min(2, Math.max(0, e.intensity));
        if (a.health <= 0) {
          this.anchors.delete(a.id);
          this.s.cue('anchor-break', a);
        }
      }
    }
  }
  update() {
    const s = this.s,
      p = P.weave;
    for (const a of sorted(this.anchors))
      if (a.expiresTick <= s.m.tick || !s.alive(a.ownerId)) this.anchors.delete(a.id);
    this.links = [];
    for (const [id, until] of this.hitCooldowns) if (until <= s.m.tick) this.hitCooldowns.delete(id);
    const all = sorted(this.anchors);
    for (let i = 0; i < all.length; i++)
      for (let j = i + 1; j < all.length; j++) {
        const a = all[i],
          b = all[j];
        if (
          a.ownerId !== b.ownerId ||
          dist(a.position, b.position) > p.maxLink ||
          s.worldshape.blocked(a.position, b.position)
        )
          continue;
        const shape = segment(a.position, b.position, p.width);
        this.links.push({ id: `${a.id}:${b.id}`, ownerId: a.ownerId, shape });
        const c = { ...a, id: `${a.id}:${b.id}:${s.m.tick}` };
        const ids = s.targets(c, shape, true).filter((id) => !this.hitCooldowns.has(`${a.ownerId}:${id}`));
        if (ids.length && s.emit(c, { type: 'hit', targetIds: ids, shape, damage: p.damage })) {
          for (const id of ids) this.hitCooldowns.set(`${a.ownerId}:${id}`, s.m.tick + s.t(p.pulse));
        }
        if (s.m.tick % s.t(p.pulse) === 0)
          s.emit(c, { type: 'terrain-impact', shape, durationTicks: s.t(p.pulse) });
      }
  }
}

export class StanceManager {
  constructor(s) {
    this.s = s;
    this.active = s.m.activeStances;
  }
  activate(c) {
    if (this.active.has(c.ownerId)) return 'stance already active';
    this.active.set(c.ownerId, {
      ...c,
      bank: 0,
      attacks: 0,
      expiresTick: this.s.m.tick + this.s.t(P.stance.life)
    });
    this.s.cue('stance', c);
    return null;
  }
  finish(ownerId) {
    const a = this.active.get(ownerId);
    if (!a) return false;
    const s = this.s,
      e = s.m.entities.get(ownerId);
    this.active.delete(ownerId);
    const c = { ...a, id: `${a.id}:finish`, position: [...e.position] };
    s.area(c, disc(c.position, P.stance.finisherRadius), P.stance.damage + a.bank);
    s.emit(c, {
      type: 'terrain-impact',
      shape: disc(c.position, P.stance.finisherRadius),
      intensity: 1 + a.bank
    });
    s.cue('finisher', c);
    return true;
  }
  modify(e) {
    const s = this.s,
      a = this.active.get(e.ownerId);
    if (a && e.type === 'cast-start' && e.mechanic === 'standard') {
      a.attacks++;
      // Every third existing cast adds a local force wave, rather than mutating its geometry.
      if (a.attacks % 3 === 0) {
        const c = {
          ...a,
          id: `${a.id}:combo:${a.attacks}`,
          position: [...s.m.entities.get(a.ownerId).position]
        };
        s.area(c, disc(c.position, 3), 0.5);
        s.cue('finisher', c);
      }
    }
    if (e.type === 'hit') {
      if (a && e.mechanic === 'standard') e.intensity = Math.min(s.m.budget.maxIntensity, e.intensity * 1.25);
      for (const id of e.targetIds) {
        const guard = this.active.get(id);
        if (guard && e.teamId !== s.m.entities.get(id)?.teamId && e.damage > 0) {
          const amount = e.damage * P.stance.reduction;
          guard.bank = Math.min(P.stance.bankCap, guard.bank + amount);
          e.damageByTarget = { ...e.damageByTarget, [id]: e.damage - amount };
          s.cue('block', { ...guard, position: [...s.m.entities.get(id).position] });
        }
      }
    }
  }
  update() {
    const s = this.s;
    for (const [id, a] of this.active) {
      const state = s.actor(id);
      state.energy = Math.max(0, state.energy - P.stance.drain / s.m.budget.tickRate);
      if (!s.alive(id) || a.expiresTick <= s.m.tick || state.energy <= 0) this.active.delete(id);
    }
  }
}

export class CounterManager {
  constructor(s) {
    this.s = s;
    this.windows = s.m.counterWindows;
  }
  activate(c) {
    const s = this.s,
      p = P.counter;
    this.windows.set(c.ownerId, {
      ...c,
      perfectUntil: s.m.tick + s.t(p.perfect),
      expiresTick: s.m.tick + s.t(p.perfect + p.partial)
    });
    s.cue('counter', c);
    return null;
  }
  intercept(e) {
    if (e.type !== 'hit' || e.tags.includes('uncounterable') || e.tags.includes('counter-return')) return;
    const s = this.s;
    e.targetIds = e.targetIds.filter((id) => {
      const w = this.windows.get(id),
        target = s.m.entities.get(id),
        source = s.m.entities.get(e.ownerId);
      if (
        !w ||
        !source ||
        source.teamId === target?.teamId ||
        dist(source.position, target.position) > P.counter.range
      )
        return true;
      this.windows.delete(id);
      if (s.m.tick >= w.perfectUntil) {
        e.damageByTarget = {
          ...e.damageByTarget,
          [id]: (e.damageByTarget?.[id] ?? e.damage ?? 0) * P.counter.reduction
        };
        e.intensityByTarget = { ...e.intensityByTarget, [id]: e.intensity * P.counter.reduction };
        s.cue('partial', w);
        return true;
      }
      const c = { ...w, id: `${w.id}:return`, position: [...source.position] };
      s.emit(c, { type: 'hit', targetIds: [source.id], tags: ['counter-return'], damage: P.counter.damage });
      s.cue('reversal', { ...c, from: [...target.position] });
      return false;
    });
  }
  update() {
    for (const [id, w] of this.windows)
      if (!this.s.alive(id) || w.expiresTick <= this.s.m.tick) {
        this.windows.delete(id);
        this.s.cue('whiff', w);
        this.s.actor(id).recoveryUntil = this.s.m.tick + this.s.t(P.counter.recovery);
      }
  }
}

/** Combat-local ridges + walkable ramp patch. Queries are shared by movement, LOS and AI. */
export class WorldshapeManager {
  constructor(s) {
    this.s = s;
    this.regions = new Map();
  }
  activate(c) {
    const s = this.s,
      p = P.worldshape;
    if (this.regions.size >= s.b.maxWorldshapes) return 'terrain budget';
    if (Math.hypot(c.position[0], c.position[2]) + p.radius > s.b.arenaRadius) return 'terrain outside arena';
    if (sorted(this.regions).some((r) => dist(r.position, c.position) < p.radius * 2))
      return 'terrain overlap';
    const [dx, , dz] = c.direction;
    const ridges = [-2.6, 0, 2.6].map((n) =>
      disc([c.position[0] + dz * n, 0, c.position[2] - dx * n], p.ridgeRadius)
    );
    if (
      [...s.m.entities.values()].some(
        (e) =>
          e.alive && ridges.some((r) => shapeContains({ ...r, r: r.r + 0.55 }, e.position[0], e.position[2]))
      )
    )
      return 'terrain would trap an actor';
    const r = { ...c, ridges, expiresTick: s.m.tick + s.t(p.life) };
    this.regions.set(r.id, r);
    s.emit(c, { type: 'terrain-impact', shape: disc(c.position, p.radius), durationTicks: s.t(p.life) });
    s.cue('worldshape', r);
    return null;
  }
  blocked(a, b, radius = 0) {
    return sorted(this.regions).some((w) => w.ridges.some((r) => shapesOverlap(r, segment(a, b, radius))));
  }
  move(from, to, radius = 0.4) {
    // Swept segments prevent high-speed dashes tunnelling through cover.
    const out = [...to];
    if (this.blocked(from, to, radius)) {
      const x = [to[0], to[1], from[2]],
        z = [from[0], to[1], to[2]];
      if (!this.blocked(from, x, radius)) out.splice(0, 3, ...x);
      else if (!this.blocked(from, z, radius)) out.splice(0, 3, ...z);
      else out.splice(0, 3, ...from);
    }
    out[1] = this.heightAt(out);
    return out;
  }
  heightAt(p) {
    let h = 0;
    for (const r of this.regions.values())
      h = Math.max(h, P.worldshape.height * Math.max(0, 1 - dist(p, r.position) / P.worldshape.radius));
    return h;
  }
  update() {
    for (const [id, r] of this.regions)
      if (r.expiresTick <= this.s.m.tick || !this.s.alive(r.ownerId)) {
        this.regions.delete(id);
        this.s.m.regions.delete(`rg:${r.id}:terrain-impact`);
        this.s.cue('terrain-expire', r);
      }
  }
}

export class ConvergenceManager {
  constructor(s) {
    this.s = s;
  }
  activate(c) {
    const s = this.s,
      p = P.convergence,
      shape = disc(c.position, p.radius);
    const ingredients = sorted(s.m.regions)
      .filter(
        (r) =>
          r.expiresTick > s.m.tick &&
          r.element !== p.element &&
          shapesOverlap(shape, r.shape) &&
          resolvePair(r.element, p.element).tier <= TIER.RULE
      )
      .slice(0, p.maxIngredients);
    if (!ingredients.length) return 'needs a compatible active region (try water)';
    // Resolve through UCSM itself: reactions keep their normal caps/diminishing/ownership.
    // Consume only the selected spatial ingredients after this event has resolved.
    if (
      !s.emit(c, {
        type: 'terrain-impact',
        shape,
        intensity: Math.min(s.m.budget.maxIntensity, 1 + ingredients.length * 0.25),
        consumeRegions: ingredients.map((r) => r.id)
      })
    )
      return 'event budget';
    s.cue('convergence', {
      ...c,
      ingredients: ingredients.map((r) => ({ id: r.id, element: r.element, ownerId: r.ownerId }))
    });
    return null;
  }
}

/** Fixed-tick orchestration. No renderer, wall clock, randomness, or hidden timers. */
export class MechanicSystems {
  constructor(manager, budget = {}) {
    this.m = manager;
    this.b = { ...MECHANIC_BUDGET, ...budget };
    this.commands = [];
    this.pending = [];
    this.actors = new Map();
    this.sequence = 0;
    this.used = 0;
    this.results = [];
    this.seen = new Set();
    this.seenOrder = [];
    this.weave = new WeavingManager(this);
    this.stance = new StanceManager(this);
    this.counter = new CounterManager(this);
    this.worldshape = new WorldshapeManager(this);
    this.convergence = new ConvergenceManager(this);
    manager.mechanics = this;
  }
  t(seconds) {
    return this.m.ticksFor(seconds);
  }
  alive(id) {
    return !!this.m.entities.get(id)?.alive;
  }
  actor(id) {
    if (!this.actors.has(id)) this.actors.set(id, { energy: this.b.energy, cooldowns: {}, recoveryUntil: 0 });
    return this.actors.get(id);
  }
  command({ family, ownerId = 'caster', position, direction = [0, 0, 1], action = 'cast', commandId }) {
    if (!P[family]) return { ok: false, reason: 'unimplemented mechanic' };
    if (!this.alive(ownerId)) return { ok: false, reason: 'unknown or dead owner' };
    if (!this.actors.has(ownerId) && this.actors.size >= this.b.maxActors)
      return { ok: false, reason: 'actor budget' };
    position = position ?? this.m.entities.get(ownerId).position;
    if (
      !Array.isArray(position) ||
      position.length !== 3 ||
      !position.every(Number.isFinite) ||
      !Array.isArray(direction) ||
      direction.length !== 3 ||
      !direction.every(Number.isFinite)
    )
      return { ok: false, reason: 'invalid position/direction' };
    if (!['cast', 'finish', 'cancel'].includes(action)) return { ok: false, reason: 'unknown action' };
    if (this.commands.length >= this.b.maxCommands) return { ok: false, reason: 'command budget' };
    const id = commandId ?? `mc:${this.m.tick}:${this.sequence++}`;
    if (this.seen.has(id)) return { ok: false, reason: 'duplicate command' };
    this.seen.add(id);
    this.seenOrder.push(id);
    if (this.seenOrder.length > 4096) this.seen.delete(this.seenOrder.shift());
    if (Math.hypot(direction[0], direction[2]) < 1e-6) direction = [0, 0, 1];
    const length = Math.hypot(direction[0], direction[2]);
    this.commands.push({
      id,
      family,
      ownerId,
      position: position.map(snap),
      direction: [direction[0] / length, 0, direction[2] / length],
      action
    });
    return { ok: true, id };
  }
  cue(kind, c) {
    this.m.cues.push({ kind: 'mechanic', phase: kind, ...c, position: [...c.position], tick: this.m.tick });
  }
  emit(c, event) {
    if (this.used >= this.b.eventsPerTick || this.m.queue.length >= this.m.budget.maxQueue) return false;
    this.used++;
    const p = P[c.family],
      owner = this.m.entities.get(c.ownerId);
    this.m.submit({
      eventId: `${c.id}:${event.type}`,
      castId: c.id,
      ownerId: c.ownerId,
      teamId: owner?.teamId,
      abilityUid: p.uid,
      element: p.element,
      mechanic: c.family,
      position: c.position,
      ...event
    });
    return true;
  }
  targets(c, shape, swept = false) {
    const team = this.m.entities.get(c.ownerId)?.teamId;
    return sorted(this.m.entities)
      .filter((e) => {
        if (!e.alive || e.teamId === team || this.worldshape.blocked(c.position, e.position)) return false;
        if (shapeContains(shape, e.position[0], e.position[2])) return true;
        const prior = this.m.positionAt(e.id);
        return swept && prior && shapesOverlap(shape, segment(prior, e.position));
      })
      .slice(0, this.b.maxTargets)
      .map((e) => e.id);
  }
  area(c, shape, damage) {
    const ids = this.targets(c, shape);
    if (ids.length) this.emit(c, { type: 'hit', targetIds: ids, shape, damage });
  }
  result(c, reason) {
    this.results.push({ id: c.id, family: c.family, tick: this.m.tick, ok: !reason, reason: reason ?? null });
    if (this.results.length > 64) this.results.shift();
    if (reason) this.cue('refused', { ...c, reason });
  }
  beforeTick() {
    this.used = 0;
    this.worldshape.update();
    this.stance.update();
    this.counter.update();
    this.weave.update();
    for (const [id, a] of this.actors)
      if (!this.stance.active.has(id))
        a.energy = Math.min(this.b.energy, a.energy + this.b.regen / this.m.budget.tickRate);
    // Interrupted/dead casts cannot later materialize.
    const ready = this.pending.filter((c) => c.readyTick <= this.m.tick);
    this.pending = this.pending.filter((c) => c.readyTick > this.m.tick);
    for (const c of ready) {
      if (!this.alive(c.ownerId)) {
        this.result(c, 'owner died');
        continue;
      }
      const reason = this[c.family].activate(c);
      if (reason) {
        const a = this.actor(c.ownerId);
        a.energy = Math.min(this.b.energy, a.energy + P[c.family].cost);
        a.cooldowns[c.family] = this.m.tick;
      }
      this.result(c, reason);
    }
    for (const c of this.commands.splice(0, this.b.commandsPerTick)) {
      const a = this.actor(c.ownerId),
        p = P[c.family];
      if (c.action === 'cancel') {
        this.cancel(c.ownerId);
        this.result(c);
        continue;
      }
      if (c.action === 'finish') {
        this.result(c, c.family === 'stance' && this.stance.finish(c.ownerId) ? null : 'no active stance');
        continue;
      }
      let reason;
      if (!this.alive(c.ownerId)) reason = 'owner died';
      else if (a.recoveryUntil > this.m.tick) reason = 'recovering';
      else if ((a.cooldowns[c.family] ?? 0) > this.m.tick) reason = 'cooldown';
      else if (a.energy < p.cost) reason = 'insufficient sovereignty';
      else if (
        dist(this.m.entities.get(c.ownerId).position, c.position) > p.range ||
        Math.hypot(c.position[0], c.position[2]) > this.b.arenaRadius
      )
        reason = 'outside cast range';
      else if (this.pending.length >= this.b.maxPending) reason = 'pending budget';
      if (reason) {
        this.result(c, reason);
        continue;
      }
      a.energy -= p.cost;
      a.recoveryUntil = this.m.tick + this.t(p.anticipation + p.recovery);
      const ownAnchors = [...this.weave.anchors.values()].filter((x) => x.ownerId === c.ownerId).length;
      a.cooldowns[c.family] = this.m.tick + this.t(c.family === 'weave' && ownAnchors < 2 ? 0.8 : p.cooldown);
      this.pending.push({ ...c, readyTick: this.m.tick + this.t(p.anticipation) });
      this.emit(c, { type: 'cast-start' });
      this.cue('anticipation', c);
    }
  }
  beforeEvent(e) {
    if (e.type === 'interrupt') {
      for (const id of e.targetIds) this.cancel(id);
      return;
    }
    this.weave.beforeEvent(e);
    this.counter.intercept(e);
    this.stance.modify(e);
  }
  afterEvent(e) {
    for (const id of e.consumeRegions ?? []) this.m.regions.delete(id);
  }
  speed(id) {
    const tags = this.m.entities.get(id)?.statuses ?? [];
    const slow = tags.some((s) => ['rooted', 'chilled', 'entangled', 'heavy', 'delayed'].includes(s.tag))
      ? 0.65
      : 1;
    return slow * (this.stance.active.has(id) ? P.stance.speed : 1);
  }
  cancel(id) {
    this.commands = this.commands.filter((c) => c.ownerId !== id);
    this.m.queue = this.m.queue.filter((e) => e.ownerId !== id || e.mechanic === 'standard');
    this.pending = this.pending.filter((c) => c.ownerId !== id);
    this.stance.active.delete(id);
    this.counter.windows.delete(id);
    for (const [key, a] of this.weave.anchors) if (a.ownerId === id) this.weave.anchors.delete(key);
    for (const [key, r] of this.worldshape.regions)
      if (r.ownerId === id) {
        this.worldshape.regions.delete(key);
        this.m.regions.delete(`rg:${r.id}:terrain-impact`);
      }
  }
  reset() {
    for (const id of this.actors.keys()) this.cancel(id);
    this.commands = [];
    this.pending = [];
    this.actors.clear();
    this.weave.links = [];
    this.weave.hitCooldowns.clear();
    this.m.cues = this.m.cues.filter((c) => c.kind !== 'mechanic');
    this.m.effects = this.m.effects.filter((e) => !e.abilityUid?.startsWith('mechanics/'));
    for (const [id, r] of this.m.regions)
      if (r.sourceUid?.startsWith('mechanics/')) this.m.regions.delete(id);
    this.m.queue = this.m.queue.filter((e) => e.mechanic === 'standard');
  }
}
