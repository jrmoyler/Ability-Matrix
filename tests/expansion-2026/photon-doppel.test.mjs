import test from 'node:test';
import assert from 'node:assert/strict';
import { Vector3 } from 'three';
import { settings } from '../../packs/sandbox/src/config/settings.js';
import config from '../../packs/sandbox/src/abilities/expansion-2026/photon-doppel/config.js';
import {
  Ability,
  ID,
  UID,
  EDITOR,
  buildEditor,
  MAX_MARKS,
} from '../../packs/sandbox/src/abilities/expansion-2026/photon-doppel/index.js';

settings[ID] = structuredClone(config.settings);
const c = settings[ID];
const lights = { acquire: () => ({}), release() {}, set() {} };
const dt = 1 / 60;

/** A dummy field: `near` inside the strike circle, `lured` only inside the lure, `far` outside both. */
const setup = (extra = []) => {
  const hits = [];
  const mk = (name, x) => ({
    name, alive: true, position: new Vector3(x, 0, 0),
    kill(dx, dz, force) { hits.push({ name, dx, dz, ...force }); this.alive = false; return true; },
  });
  const near = mk('near', 11);
  const lured = mk('lured', 10 + (c.zoneRadius + c.lureRadius) / 2);
  const far = mk('far', 40);
  far.kill = () => { throw Error('out of range'); };
  const all = [near, lured, far, ...extra.map((x, i) => mk(`extra${i}`, x))];
  const ability = new Ability({
    lights,
    dummies: {
      findTargets(x, z, r, out) {
        out.length = 0;
        for (const d of all) if (d.alive) out.push(d);
        return out;
      },
    },
  });
  return { ability, hits, near, lured, far };
};

const runToEnd = (ability, max = 600) => {
  let frames = 0;
  while (!ability.isFinished && frames++ < max) ability.update(dt);
  return frames;
};

test('decoy forms, drinks for absorbTime, then strikes once inside the circle and finishes', () => {
  const { ability, hits } = setup();
  ability.spawn(new Vector3(), new Vector3(1, 0, 0), 10);
  // Wind-up at the hand holds the packet still.
  ability.update(dt);
  assert.equal(ability.u, 0);
  for (let i = 0; i < 40 && ability.phase === 'travel'; i++) ability.update(dt);
  assert.equal(ability.phase, 'impact');
  assert.equal(ability.figure.visible, true);
  assert.equal(hits.length, 0, 'nothing is struck while the decoy drinks');
  for (let i = 0; i < 60; i++) ability.update(dt);
  assert.equal(hits.length, 0);
  assert.equal(ability.marks, 2, 'near and lured are exposed; far is not');
  while (!ability._exposed) ability.update(dt);
  assert.deepEqual(hits.map((h) => h.name), ['near'], 'only the enemy inside zoneRadius is struck');
  runToEnd(ability);
  assert.equal(ability.isFinished, true);
  assert.equal(hits.length, 1, 'exactly one strike');
  assert.ok(hits[0].dx > 0.99, 'thrown away from the decoy');
  ability.destroy();
  ability.dispose();
});

test('signature: every exposure charges the overexposure — more enemies, harder strike', () => {
  const strike = (extra) => {
    const { ability, hits } = setup(extra);
    ability.spawn(new Vector3(), new Vector3(1, 0, 0), 10);
    runToEnd(ability);
    const out = { charge: ability.charge, marks: ability.marks, damage: ability._damage, hit: hits.find((h) => h.name === 'near') };
    ability.destroy();
    ability.dispose();
    return out;
  };
  const two = strike([]);
  const four = strike([12, 8.5]);
  assert.equal(two.marks, 2);
  assert.equal(four.marks, 4);
  assert.ok(Math.abs(two.charge - 2 * c.chargePerMark) < 1e-9);
  assert.ok(four.charge > two.charge);
  assert.ok(four.hit.impulse > two.hit.impulse);
  assert.ok(four.hit.lift > two.hit.lift);
  assert.equal(four.damage, c.baseDamage + Math.round(four.charge * c.bonusDamage));
  assert.ok(four.hit.impulse <= 24 && four.hit.lift <= 20);
});

test('exposures are bounded by maxMarks and MAX_MARKS', () => {
  const crowd = Array.from({ length: 12 }, (_, i) => 8 + (i % 6) * 0.6);
  const { ability, hits } = setup(crowd);
  ability.spawn(new Vector3(), new Vector3(1, 0, 0), 10);
  runToEnd(ability);
  assert.equal(ability.marks, Math.min(c.maxMarks, MAX_MARKS));
  assert.ok(ability.charge <= 1);
  assert.ok(hits.length <= 8, 'strike is bounded');
  ability.destroy();
  ability.dispose();
});

test('pooled reuse resets marks, charge, overexposure and figure state', () => {
  const { ability, hits, near } = setup();
  ability.spawn(new Vector3(), new Vector3(1, 0, 0), 10);
  runToEnd(ability);
  assert.equal(hits.length, 1);
  ability.destroy();
  assert.equal(ability.root.visible, false);
  near.alive = true;
  ability.spawn(new Vector3(), new Vector3(1, 0, 0), 10);
  assert.equal(ability._exposed, false);
  assert.equal(ability.marks, 0);
  assert.equal(ability.charge, 0);
  assert.equal(ability.figure.visible, false);
  runToEnd(ability);
  assert.equal(hits.length, 2);
  ability.destroy();
  ability.dispose();
});

test('no throw with the combat binding and dummies absent', () => {
  const ability = new Ability({ lights });
  ability.spawn(new Vector3(), new Vector3(0, 0, 1), 8);
  assert.doesNotThrow(() => runToEnd(ability));
  assert.equal(ability.isFinished, true);
  assert.equal(ability.marks, 0);
  ability.destroy();
  ability.dispose();
});

test('geometry is finite and GPU resources dispose exactly once', () => {
  const { ability } = setup();
  let meshes = 0;
  ability.group.traverse((o) => {
    if (!o.isMesh) return;
    meshes++;
    const p = o.geometry.attributes.position;
    for (let i = 0; i < p.count; i++) assert.ok(Number.isFinite(p.getX(i) + p.getY(i) + p.getZ(i)));
  });
  assert.ok(meshes >= 8);
  assert.ok(ability.figure.geometry.attributes.position.count > 1000, 'the hero is an authored mesh');
  let count = 0;
  for (const r of ability.resources) r.addEventListener('dispose', () => count++);
  ability.dispose();
  ability.dispose();
  assert.equal(count, ability.resources.length);
});

test('editor exposes every settings key', () => {
  const seen = new Set();
  const folder = () => ({
    addFolder: () => folder(),
    add: (o, k) => { seen.add(k); return { name() { return this; } }; },
    addColor: (o, k) => { seen.add(k); return { name() { return this; } }; },
  });
  buildEditor(folder(), c, null);
  for (const key of Object.keys(config.settings)) assert.ok(seen.has(key), `editor misses ${key}`);
  assert.ok(Object.keys(config.settings).length >= 60 && Object.keys(config.settings).length <= 150);
  assert.ok(EDITOR.length >= 10);
});

test('combat: exposures lay light statuses, soaked hits charge it, strike is attributed and bounded', async () => {
  const { CombatStateManager } = await import('../../packs/sandbox/src/combat/ucsm/CombatStateManager.js');
  const { ExpansionCombatAdapter } = await import('../../packs/sandbox/src/combat/ucsm/ExpansionCombatAdapter.js');
  const manager = new CombatStateManager();
  manager.upsertEntity({ id: 'caster', teamId: 'player', health: 5 });
  manager.upsertEntity({ id: 'enemy', teamId: 'enemy', position: [10.5, 0, 0.5], health: 9 });
  manager.upsertEntity({ id: 'lured', teamId: 'enemy', position: [14.2, 0, 0], health: 9 });
  manager.upsertEntity({ id: 'ally', teamId: 'player', position: [10, 0, 1], health: 5 });
  manager.upsertEntity({ id: 'outside', teamId: 'enemy', position: [30, 0, 0], health: 9 });
  const bridge = new ExpansionCombatAdapter(manager);
  const ability = new Ability({ lights, expansionCombat: bridge });
  const other = bridge.bind('matrix-expansion/test-thrower');
  const seen = [];
  const watch = bridge.bind('matrix-expansion/test-observer').on('hit', (e) => seen.push(e));
  ability.spawn(new Vector3(), new Vector3(1, 0, 0), 10);
  let frame = 0;
  const step = () => { ability.update(dt); if (frame++ % 2) manager.advance(); };
  while (ability.phase === 'travel') step();
  for (let i = 0; i < 20; i++) step();
  assert.equal(ability.marks, 2, 'enemy and lured exposed; ally and outside not');
  assert.ok(manager.entities.get('lured').statuses.length > 0, 'exposure lays a status');
  assert.equal(manager.entities.get('enemy').health, 9);
  // Another cast's hit inside the circle is soaked up.
  const thrown = other.emit({ type: 'hit', element: 'fire', targetIds: ['enemy'], position: [10.5, 0, 0.5], damage: 1 });
  assert.equal(thrown.ok, true);
  for (let i = 0; i < 6; i++) step();
  assert.equal(ability.soaked, 1);
  const before = manager.entities.get('enemy').health;
  while (!ability.isFinished) step();
  for (let i = 0; i < 4; i++) manager.advance();
  const expected = c.baseDamage + Math.round(ability.charge * c.bonusDamage);
  assert.equal(before - manager.entities.get('enemy').health, expected);
  assert.equal(manager.entities.get('lured').health, 9, 'exposed but outside the strike circle');
  assert.equal(manager.entities.get('ally').health, 5);
  assert.equal(manager.entities.get('outside').health, 9);
  const mine = seen.filter((e) => e.abilityUid === UID);
  assert.equal(mine.length, 1);
  assert.equal(mine[0].element, 'light');
  assert.deepEqual(mine[0].targetIds, ['enemy']);
  watch.unsubscribe();
  ability.destroy();
  ability.dispose();
  bridge.dispose();
});

test('standalone fallback strikes a slotted dummy once', async () => {
  const { CombatStateManager } = await import('../../packs/sandbox/src/combat/ucsm/CombatStateManager.js');
  const { ExpansionCombatAdapter } = await import('../../packs/sandbox/src/combat/ucsm/ExpansionCombatAdapter.js');
  const manager = new CombatStateManager();
  let kills = 0;
  const dummy = { alive: true, position: new Vector3(10, 0, 0), kill() { kills++; this.alive = false; return true; } };
  const bridge = new ExpansionCombatAdapter(manager, { enabled: () => false, modeVersion: () => 0 });
  const ability = new Ability({ lights, character: { position: new Vector3() }, dummies: { slots: [{ dummy }] }, expansionCombat: bridge });
  ability.spawn(new Vector3(), new Vector3(1, 0, 0), 10);
  runToEnd(ability);
  assert.equal(kills, 1);
  assert.equal(ability.marks, 1);
  ability.destroy();
  ability.dispose();
  bridge.dispose();
});
