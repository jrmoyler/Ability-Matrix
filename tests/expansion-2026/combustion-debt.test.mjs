import test from 'node:test';
import assert from 'node:assert/strict';
import { Vector3 } from 'three';
import { settings } from '../../packs/sandbox/src/config/settings.js';
import config from '../../packs/sandbox/src/abilities/expansion-2026/combustion-debt/config.js';
import {
  Ability,
  ID,
  MAX_DEBTORS,
  buildEditor,
} from '../../packs/sandbox/src/abilities/expansion-2026/combustion-debt/index.js';

settings[ID] = structuredClone(config.settings);
const c = settings[ID];
const lights = { acquire: () => ({}), release: () => {}, set: () => {} };
const DT = 1 / 60;

/** A dummy that records the blows it takes and the char it wears. */
function dummy(x, z) {
  return {
    alive: true,
    position: new Vector3(x, 0, z),
    hits: [],
    char: 0,
    kill(dx, dz, force) {
      this.hits.push({ dx, dz, ...force });
      this.alive = false;
      return true;
    },
    corrode(amount) {
      this.char = Math.max(this.char, amount);
      return this.char;
    },
  };
}

/** `targets(tick)` returns who stands in the field on each findTargets call. */
function setup(targets) {
  let calls = 0;
  const ability = new Ability({
    lights,
    dummies: {
      findTargets: (x, z, r, out) => {
        out.length = 0;
        for (const d of targets(calls++)) if (d.alive) out.push(d);
        return out;
      },
    },
  });
  return ability;
}

const run = (ability, frames) => {
  for (let i = 0; i < frames && ability.isActive; i++) ability.update(DT);
};

test('spawns, runs every beat to completion and calls the debt in exactly once', () => {
  const inside = dummy(10, 0.5);
  const far = dummy(40, 0);
  const ability = setup(() => [inside, far]);
  ability.spawn(new Vector3(), new Vector3(1, 0, 0), 10);
  assert.equal(ability.phase, 'travel');
  run(ability, 10); // still charging at the hand
  assert.equal(ability.u, 0);
  assert.ok(ability.slug.visible);
  run(ability, 600);
  assert.equal(ability.isFinished, true);
  assert.equal(ability._ticksDone, c.ticks);
  assert.equal(ability._paid, true);
  assert.equal(inside.hits.length, 1);
  assert.equal(far.hits.length, 0);
  assert.ok(inside.char > 0.5, 'branded bodies are charred');
  // The blow points away from the coil and carries the full-debt force.
  assert.ok(inside.hits[0].dz > 0.99);
  assert.ok(Math.abs(inside.hits[0].impulse - c.hitImpulse) < 1e-9);
  ability.destroy();
  ability.dispose();
});

test('the signature rule: heat debt accrues per tick, only debtors past the threshold pay', () => {
  const veteran = dummy(10, 0); // in the zone for every tick
  const latecomer = dummy(11, 1); // only for the final tick: 1 stack < threshold
  const ability = setup((call) => (call >= c.ticks - 1 ? [veteran, latecomer] : [veteran]));
  ability.spawn(new Vector3(), new Vector3(1, 0, 0), 10);
  // Before the call no one is hit, but stacks are visible on the ledger.
  for (let i = 0; i < 600 && !ability._paid; i++) {
    ability.update(DT);
    if (!ability._paid) assert.equal(veteran.hits.length, 0, 'the strike is deferred to the call');
  }
  const ledger = ability._debtors.filter((d) => d.used);
  assert.equal(ledger.find((d) => d.dummy === veteran).stacks, c.ticks);
  assert.equal(ledger.find((d) => d.dummy === latecomer).stacks, 1);
  assert.equal(veteran.hits.length, 1);
  assert.equal(latecomer.hits.length, 0, 'debt under the threshold is forgiven');
  ability.destroy();
  ability.dispose();
});

test('force scales with the debt owed', () => {
  const twoTicks = dummy(10, 0);
  const ability = setup((call) => (call >= c.ticks - 2 ? [twoTicks] : []));
  ability.spawn(new Vector3(), new Vector3(1, 0, 0), 10);
  run(ability, 600);
  const expected = c.hitImpulse * (1 - c.stackForce + c.stackForce * (2 / c.ticks));
  assert.equal(twoTicks.hits.length, 1);
  assert.ok(Math.abs(twoTicks.hits[0].impulse - expected) < 1e-9);
  ability.destroy();
  ability.dispose();
});

test('foreclosure: total debt reaching debtCap calls it in early; the ledger is bounded', () => {
  const crowd = [];
  for (let i = 0; i < MAX_DEBTORS + 4; i++) crowd.push(dummy(10 + Math.cos(i) * 1.5, Math.sin(i) * 1.5));
  const ability = setup(() => crowd);
  ability.spawn(new Vector3(), new Vector3(1, 0, 0), 10);
  run(ability, 600);
  assert.ok(ability._ticksDone < c.ticks, `foreclosed after ${ability._ticksDone} ticks`);
  const debtors = ability._debtors.filter((d) => d.used);
  assert.equal(debtors.length, MAX_DEBTORS);
  const hit = crowd.filter((d) => d.hits.length);
  assert.equal(hit.length, MAX_DEBTORS);
  assert.ok(crowd.every((d) => d.hits.length <= 1));
  ability.destroy();
  ability.dispose();
});

test('pooled reuse resets the ledger, the clock and every layer', () => {
  const target = dummy(10, 0);
  const ability = setup(() => [target]);
  ability.spawn(new Vector3(), new Vector3(1, 0, 0), 10);
  run(ability, 160);
  assert.ok(ability._ticksDone > 0);
  ability.destroy();
  assert.equal(ability.root.visible, false);
  assert.equal(ability.plume.visible, false);
  target.alive = true;
  target.hits.length = 0;
  ability.spawn(new Vector3(), new Vector3(0, 0, 1), 6);
  assert.equal(ability._ticksDone, 0);
  assert.equal(ability._paid, false);
  assert.equal(ability._foreclosedAt, -1);
  assert.equal(ability._debtors.some((d) => d.used), false);
  assert.equal(ability.root.visible, false);
  run(ability, 600);
  assert.equal(ability.isFinished, true);
  ability.destroy();
  ability.dispose();
});

test('geometry is finite in every pose, buffers never reallocate, resources dispose once', () => {
  const ability = setup(() => [dummy(10, 0)]);
  const array = ability.coilGeometry.attributes.position.array;
  ability.spawn(new Vector3(), new Vector3(1, 0, 0), 10);
  for (let i = 0; i < 600 && ability.isActive; i++) {
    ability.update(DT);
    if (i % 15 === 0 && ability._landed) {
      for (const v of ability.coilGeometry.attributes.position.array) assert.ok(Number.isFinite(v));
    }
  }
  assert.equal(ability.coilGeometry.attributes.position.array, array);
  let count = 0;
  for (const r of ability.resources) r.addEventListener('dispose', () => count++);
  ability.destroy();
  ability.dispose();
  ability.dispose();
  assert.equal(count, ability.resources.length);
});

test('the coil winds down while loaded and springs back past rest at the call', () => {
  const ability = setup(() => [dummy(10, 0)]);
  ability.spawn(new Vector3(), new Vector3(1, 0, 0), 10);
  const H = c.zoneRadius * c.coilHeight;
  let minLoaded = Infinity;
  let maxAfter = 0;
  for (let i = 0; i < 600 && ability.isActive; i++) {
    ability.update(DT);
    if (!ability._landed) continue;
    if (!ability._paid && ability._ticksDone >= c.ticks) minLoaded = Math.min(minLoaded, ability._k.height);
    if (ability._paid && ability._since < 0.4) maxAfter = Math.max(maxAfter, ability._k.height);
  }
  assert.ok(minLoaded < H * 0.8, 'wound down');
  assert.ok(maxAfter > H, 'springs past rest');
  ability.destroy();
  ability.dispose();
});

test('no throw and no hits with neither combat binding nor dummies', () => {
  const ability = new Ability({ lights });
  ability.spawn(new Vector3(), new Vector3(1, 0, 0), 8);
  run(ability, 600);
  assert.equal(ability.isFinished, true);
  assert.equal(ability.totalDebt, 0);
  ability.destroy();
  ability.dispose();
});

test('UCSM: statuses accrue per tick and only the indebted enemy is hit, once, attributed', async () => {
  const { CombatStateManager } = await import('../../packs/sandbox/src/combat/ucsm/CombatStateManager.js');
  const { ExpansionCombatAdapter } = await import('../../packs/sandbox/src/combat/ucsm/ExpansionCombatAdapter.js');
  const manager = new CombatStateManager();
  manager.upsertEntity({ id: 'caster', teamId: 'player', health: 5 });
  manager.upsertEntity({ id: 'enemy', teamId: 'enemy', position: [10, 0, 1], health: 10 });
  manager.upsertEntity({ id: 'ally', teamId: 'player', position: [10, 0, 1], health: 5 });
  manager.upsertEntity({ id: 'outside', teamId: 'enemy', position: [20, 0, 0], health: 5 });
  const bridge = new ExpansionCombatAdapter(manager);
  const ability = new Ability({ lights, expansionCombat: bridge });
  const hits = [];
  const sub = bridge.bind('matrix-expansion/test-observer').on('hit', (e) => hits.push(e));
  ability.spawn(new Vector3(), new Vector3(1, 0, 0), 10);
  let sawBurning = false;
  for (let i = 0; i < 600 && ability.isActive; i++) {
    ability.update(DT);
    manager.advance();
    if (!ability._paid && manager.entities.get('enemy').statuses.some((s) => s.tag === 'burning')) sawBurning = true;
    if (!ability._paid) assert.equal(manager.entities.get('enemy').health, 10, 'deferred until the call');
  }
  assert.equal(ability.failure, null);
  assert.ok(sawBurning, 'heat debt is visible to combat as burning');
  assert.equal(hits.length, 1);
  assert.equal(hits[0].abilityUid, 'matrix-expansion/combustion-debt');
  assert.equal(hits[0].element, 'fire');
  assert.deepEqual(hits[0].targetIds, ['enemy']);
  assert.equal(manager.entities.get('enemy').health, 10 - Math.min(c.maxDamage, c.ticks * c.damagePerStack));
  assert.equal(manager.entities.get('ally').health, 5);
  assert.equal(manager.entities.get('outside').health, 5);
  sub.unsubscribe();
  ability.destroy();
  ability.dispose();
  bridge.dispose();
});

test('standalone bridge: a dummy debtor is knocked down once', async () => {
  const { CombatStateManager } = await import('../../packs/sandbox/src/combat/ucsm/CombatStateManager.js');
  const { ExpansionCombatAdapter } = await import('../../packs/sandbox/src/combat/ucsm/ExpansionCombatAdapter.js');
  const manager = new CombatStateManager();
  const target = dummy(10, 0);
  const bridge = new ExpansionCombatAdapter(manager, { enabled: () => false, modeVersion: () => 0 });
  const ability = new Ability({ lights, character: { position: new Vector3() }, dummies: { slots: [{ dummy: target }] }, expansionCombat: bridge });
  ability.spawn(new Vector3(), new Vector3(1, 0, 0), 10);
  run(ability, 600);
  assert.equal(target.hits.length, 1);
  assert.equal(ability.failure, null);
  ability.destroy();
  ability.dispose();
  bridge.dispose();
});

test('every settings key is exposed in the editor', () => {
  const seen = new Set();
  const folder = () => ({
    addFolder: () => folder(),
    add: (obj, key) => { seen.add(key); return { name: () => {} }; },
    addColor: (obj, key) => { seen.add(key); return { name: () => {} }; },
  });
  buildEditor(folder(), c, null);
  const keys = Object.keys(config.settings);
  assert.ok(keys.length >= 60 && keys.length <= 150, `${keys.length} keys`);
  assert.deepEqual(keys.filter((k) => !seen.has(k)), []);
});
