import test from 'node:test';
import assert from 'node:assert/strict';
import { Vector3 } from 'three';
import { settings } from '../../packs/sandbox/src/config/settings.js';
import config from '../../packs/sandbox/src/abilities/expansion-2026/symbiotic-exchange/config.js';
import {
  Ability,
  ID,
  MAX_LINKS,
  buildEditor,
  tendrilPoint,
} from '../../packs/sandbox/src/abilities/expansion-2026/symbiotic-exchange/index.js';

settings[ID] = structuredClone(config.settings);
const C = settings[ID];
const lights = { acquire: () => ({}), release() {}, set() {} };
const DT = 1 / 60;

/** A dummy that records its stain and the direction it was felled in. */
function dummy(x, z) {
  return {
    alive: true,
    position: new Vector3(x, 0, z),
    kills: [],
    stains: [],
    kill(dx, dz, force) {
      if (!this.alive) return false;
      this.alive = false;
      this.kills.push({ dx, dz, ...force });
      return true;
    },
    corrode(amount) { this.stains.push(amount); return amount; },
  };
}

function field(list) {
  return {
    findTargets(x, z, r, out) {
      out.length = 0;
      for (const d of list) if (d.alive && Math.hypot(d.position.x - x, d.position.z - z) <= r + 0.3) out.push(d);
      out.sort((a, b) => Math.hypot(a.position.x - x, a.position.z - z) - Math.hypot(b.position.x - x, b.position.z - z));
      return out;
    },
  };
}

function run(ability, frames = 600) {
  for (let i = 0; i < frames && !ability.isFinished; i++) ability.update(DT);
}

test('direct path: binds the prey in the zone, drains it every beat, fells it into the heart on the last', () => {
  const prey = [dummy(10, 1), dummy(11.5, -1), dummy(9, -2)];
  const outside = dummy(20, 0);
  const ability = new Ability({ lights, dummies: field([...prey, outside]) });
  ability.spawn(new Vector3(), new Vector3(1, 0, 0), 10);
  run(ability);
  assert.equal(ability.isFinished, true);
  assert.equal(ability.linkCount, 3);
  assert.equal(ability.hits, 3 * C.pulses, 'exactly links × pulses drains');
  for (const d of prey) {
    assert.equal(d.kills.length, 1, 'felled exactly once');
    assert.deepEqual(d.stains, [0.25, 0.5, 0.75, 1], 'stained a share per beat');
    // Hauled toward the heart (the cast landed at x = 10, z = 0).
    const toHeart = Math.atan2(0 - d.position.z, 10 - d.position.x);
    const dir = Math.atan2(d.kills[0].dz, d.kills[0].dx);
    if (Math.hypot(d.position.x - 10, d.position.z) > 0.1) assert.ok(Math.abs(Math.atan2(Math.sin(dir - toHeart), Math.cos(dir - toHeart))) < 1e-6);
    assert.equal(d.kills[0].impulse, C.hitImpulse);
  }
  assert.equal(outside.alive, true);
  assert.equal(outside.stains.length, 0);
  ability.destroy();
  ability.dispose();
});

test('the exchange: every drained share reaches the heart and then an ally, capped by regenCap', () => {
  const prey = [dummy(10, 1), dummy(11.5, -1), dummy(9, -2)];
  const ability = new Ability({ lights, dummies: field(prey) });
  ability.spawn(new Vector3(), new Vector3(1, 0, 0), 10);
  let fellBeforeLastBeat = false;
  for (let i = 0; i < 600 && !ability.isFinished; i++) {
    ability.update(DT);
    if (ability._beats < C.pulses && prey.some((d) => !d.alive)) fellBeforeLastBeat = true;
  }
  assert.equal(fellBeforeLastBeat, false, 'no body falls before the exchange completes');
  assert.equal(ability._taken, 3 * C.pulses, 'every amber bead reached the heart');
  assert.equal(ability._given, 3 * C.pulses, 'every green bead reached the ally');
  assert.equal(ability.allyVitality, Math.min(C.regenCap, 3 * C.pulses * C.regenPerShare));
  assert.equal(ability.allies[0].id, 'caster');
  ability.destroy();
  ability.dispose();
});

test('binding is bounded to maxLinks, nearest first, and hits never exceed links × pulses', () => {
  const crowd = [];
  for (let i = 0; i < 12; i++) crowd.push(dummy(10 + Math.cos(i) * (0.4 + i * 0.2), Math.sin(i) * (0.4 + i * 0.2)));
  const ability = new Ability({ lights, dummies: field(crowd) });
  ability.spawn(new Vector3(), new Vector3(1, 0, 0), 10);
  run(ability);
  assert.equal(ability.linkCount, Math.min(MAX_LINKS, C.maxLinks));
  assert.equal(ability.hits, ability.linkCount * C.pulses);
  const felled = crowd.filter((d) => !d.alive);
  assert.equal(felled.length, ability.linkCount);
  const nearest = [...crowd].sort((a, b) => Math.hypot(a.position.x - 10, a.position.z) - Math.hypot(b.position.x - 10, b.position.z)).slice(0, ability.linkCount);
  assert.deepEqual(new Set(felled), new Set(nearest));
  ability.destroy();
  ability.dispose();
});

test('pooled reuse resets the exchange; destroying mid-beat leaves nothing in flight', () => {
  const prey = [dummy(10, 0.5)];
  const ability = new Ability({ lights, dummies: field(prey) });
  ability.spawn(new Vector3(), new Vector3(1, 0, 0), 10);
  for (let i = 0; i < 95; i++) ability.update(DT);
  assert.ok(ability._beats > 0 && ability._beats < C.pulses, 'mid-exchange');
  assert.ok(ability._beads.some((b) => b.live));
  ability.destroy();
  assert.equal(ability.tendrils.count, 0);
  assert.equal(ability._beads.some((b) => b.live), false);
  prey[0].alive = true;
  prey[0].stains.length = 0;
  ability.spawn(new Vector3(), new Vector3(1, 0, 0), 10);
  assert.equal(ability._beats, 0);
  assert.equal(ability.hits, 0);
  assert.equal(ability.allyVitality, 0);
  assert.equal(ability.links.some((l) => l.active), false);
  run(ability);
  assert.equal(prey[0].kills.length, 1);
  assert.equal(ability.hits, C.pulses);
  ability.destroy();
  ability.dispose();
});

test('no throw with no combat binding, no dummies, no particles; finishes inside the standard window', () => {
  const ability = new Ability({ lights });
  ability.spawn(new Vector3(), new Vector3(0, 0, 1), 8);
  let frames = 0;
  while (!ability.isFinished && frames < 600) { ability.update(DT); frames++; }
  assert.equal(ability.isFinished, true);
  assert.equal(ability.hits, 0);
  const seconds = frames * DT;
  assert.ok(seconds >= 1.5 && seconds <= 4.5, `screen time ${seconds.toFixed(2)} s`);
  ability.destroy();
  ability.dispose();
  ability.dispose();
});

test('the CPU twin places the root: start at s = 0, the top of the coil at s = 1', () => {
  const t = { ax: 1, ay: 0.3, az: 2, ex: 5, ey: 0.04, ez: 2, arc: 1, wrap: 1, bow: 0.2, seed: 0.3 };
  const look = { amp: 0.1, freq: 3, speed: 2, wrapR: 0.36, wrapH: 1.35, turns: 2, portion: 0.3, clock: 0.7 };
  const out = new Vector3();
  tendrilPoint(t, look, 0, out);
  assert.ok(out.distanceTo(new Vector3(1, 0.3, 2)) < 1e-9);
  tendrilPoint(t, look, 1, out);
  assert.ok(Math.abs(out.y - (0.04 + 1.35)) < 1e-9);
  assert.ok(Math.abs(Math.hypot(out.x - 5, out.z - 2) - 0.36) < 1e-9);
});

test('editor exposes every settings key', () => {
  const seen = new Set();
  const folder = {
    addFolder() { return folder; },
    add(c, k) { seen.add(k); return { name() { return this; } }; },
    addColor(c, k) { seen.add(k); return { name() { return this; } }; },
  };
  buildEditor(folder, settings[ID], null);
  for (const key of Object.keys(config.settings)) assert.ok(seen.has(key), key);
  assert.ok(Object.keys(config.settings).length >= 60 && Object.keys(config.settings).length <= 150);
});

test('UCSM: drains bound enemies through the attributed bridge, entangles them, spares allies', async () => {
  const { CombatStateManager } = await import('../../packs/sandbox/src/combat/ucsm/CombatStateManager.js');
  const { ExpansionCombatAdapter } = await import('../../packs/sandbox/src/combat/ucsm/ExpansionCombatAdapter.js');
  const manager = new CombatStateManager();
  manager.upsertEntity({ id: 'caster', teamId: 'player', health: 5 });
  manager.upsertEntity({ id: 'enemy', teamId: 'enemy', position: [10, 0, 1], health: 5 });
  manager.upsertEntity({ id: 'friend', teamId: 'player', position: [6, 0, 0], health: 5 });
  manager.upsertEntity({ id: 'outside', teamId: 'enemy', position: [20, 0, 0], health: 5 });
  const bridge = new ExpansionCombatAdapter(manager);
  const seen = [];
  const sub = bridge.bind('matrix-expansion/test-observer').on('hit', (e) => seen.push(e));
  const ability = new Ability({ lights, expansionCombat: bridge });
  ability.spawn(new Vector3(), new Vector3(1, 0, 0), 10);
  let entangled = false;
  for (let i = 0; i < 600 && !ability.isFinished; i++) {
    ability.update(DT);
    if (i % 2) manager.advance();
    if (manager.entities.get('enemy').statuses.length) entangled = true;
  }
  for (let i = 0; i < 4; i++) manager.advance();
  assert.equal(ability.failure, null);
  assert.equal(manager.entities.get('enemy').health, 5 - C.pulses * C.drainDamage);
  assert.equal(manager.entities.get('friend').health, 5);
  assert.equal(manager.entities.get('outside').health, 5);
  assert.ok(entangled, 'the bind applies the nature status');
  assert.equal(seen.length, C.pulses);
  assert.ok(seen.every((e) => e.abilityUid === 'matrix-expansion/symbiotic-exchange' && e.element === 'nature'));
  assert.equal(ability.allies.filter((a) => a.active).length, 2, 'caster and the friendly actor are linked');
  assert.equal(ability._given, C.pulses);
  sub.unsubscribe();
  ability.destroy();
  ability.dispose();
  bridge.dispose();
});

test('standalone bridge: shares accumulate on the fallback pool and fell the dummy on the last beat only', async () => {
  const { CombatStateManager } = await import('../../packs/sandbox/src/combat/ucsm/CombatStateManager.js');
  const { ExpansionCombatAdapter } = await import('../../packs/sandbox/src/combat/ucsm/ExpansionCombatAdapter.js');
  const manager = new CombatStateManager();
  const d = dummy(11, 0.6);
  const bridge = new ExpansionCombatAdapter(manager, { enabled: () => false, modeVersion: () => 0 });
  const ability = new Ability({ lights, character: { position: new Vector3() }, dummies: { slots: [{ dummy: d }], ...field([d]) }, expansionCombat: bridge });
  ability.spawn(new Vector3(), new Vector3(1, 0, 0), 10);
  let beatsAtKill = -1;
  for (let i = 0; i < 600 && !ability.isFinished; i++) {
    ability.update(DT);
    if (beatsAtKill < 0 && !d.alive) beatsAtKill = ability._beats;
  }
  assert.equal(d.kills.length, 1);
  assert.equal(beatsAtKill, C.pulses);
  assert.ok(d.kills[0].dx < 0 && d.kills[0].dz < 0, 'hauled back toward the heart');
  ability.destroy();
  ability.dispose();
  bridge.dispose();
});
