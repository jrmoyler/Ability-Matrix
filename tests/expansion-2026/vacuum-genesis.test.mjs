import test from 'node:test';
import assert from 'node:assert/strict';
import { Vector3 } from 'three';
import { settings } from '../../packs/sandbox/src/config/settings.js';
import config from '../../packs/sandbox/src/abilities/expansion-2026/vacuum-genesis/config.js';
import { Ability, ID, UID, buildEditor } from '../../packs/sandbox/src/abilities/expansion-2026/vacuum-genesis/index.js';

settings[ID] = structuredClone(config.settings);
const lights = { acquire: () => ({}), release: () => {}, set: () => {} };
const step = (ability, n) => { for (let i = 0; i < n; i++) ability.update(1 / 60); };

/** A sandbox dummy that records every way the pocket touches it. */
function makeDummy(x, z) {
  const log = { kills: 0, carries: 0, holds: 0, shoves: [], releases: 0, buoyancy: 0 };
  const dummy = {
    alive: true,
    position: new Vector3(x, 0, z),
    log,
    kill(dx, dz, force) {
      if (!this.alive) return false;
      this.alive = false;
      log.kills++;
      log.force = { ...force, dx, dz };
      return true;
    },
    carry(field, grab, grabY, buoyancy) {
      log.carries++;
      log.buoyancy = buoyancy;
      log.sample = field(this.position.x, 0, this.position.z, new Vector3());
    },
    hold() { log.holds++; },
    bodyPoint(out) { return out.copy(this.position).setY(1); },
    shove(x, y, z) { log.shoves.push([x, y, z]); },
    release() { log.releases++; },
  };
  return dummy;
}

function setup(dummies) {
  const ability = new Ability({
    lights,
    dummies: {
      findTargets: (x, z, r, out) => {
        out.length = 0;
        for (const d of dummies) if (d.alive) out.push(d);
        return out;
      },
    },
  });
  return ability;
}

test('the pocket takes bodies off their feet at the birth, floats them, and throws them clear at the rupture', () => {
  const inside = makeDummy(10.5, 0.5);
  const far = makeDummy(40, 0);
  const ability = setup([inside, far]);
  ability.spawn(new Vector3(), new Vector3(1, 0, 0), 10);
  for (let i = 0; i < 120 && !ability._born; i++) ability.update(1 / 60);
  assert.equal(ability._born, true, 'the seed lands');
  assert.equal(inside.log.kills, 1, 'birth knocks the body inside down');
  assert.equal(far.log.kills, 0, 'a body outside the radius is untouched');
  assert.ok(inside.log.force.lift > 0 && inside.log.force.lift === config.settings.holdLift);
  step(ability, 30);
  assert.ok(inside.log.carries > 10, 'held through the linger');
  assert.equal(inside.log.buoyancy, config.settings.floatBuoyancy);
  assert.ok(inside.log.sample.y > 0, 'the vacuum lifts toward floatHeight');
  assert.equal(inside.log.shoves.length, 0, 'not thrown before the shell is born');
  for (let i = 0; i < 400 && !ability._ruptured; i++) ability.update(1 / 60);
  assert.equal(ability._ruptured, true);
  assert.equal(inside.log.shoves.length, 1, 'thrown once at the rupture');
  const [sx, sy] = inside.log.shoves[0];
  assert.ok(sx > 0 && sy > 0, 'thrown outward and up');
  assert.equal(inside.log.releases, 1, 'weight given back');
  const carries = inside.log.carries;
  step(ability, 400);
  assert.equal(ability.isFinished, true);
  assert.equal(inside.log.carries, carries, 'no carrying after the rupture');
  assert.equal(far.log.kills, 0);
  ability.destroy();
  ability.dispose();
});

test('the hold is bounded by maxTargets and the rule is deterministic', () => {
  const crowd = Array.from({ length: 14 }, (_, i) => makeDummy(10 + Math.cos(i) * 1.5, Math.sin(i) * 1.5));
  const ability = setup(crowd);
  ability.spawn(new Vector3(), new Vector3(1, 0, 0), 10);
  step(ability, 400);
  const killed = crowd.filter((d) => d.log.kills === 1);
  assert.equal(killed.length, config.settings.maxTargets);
  assert.equal(killed.reduce((n, d) => n + d.log.shoves.length, 0), config.settings.maxTargets);
  assert.ok(crowd.every((d) => d.log.kills <= 1 && d.log.shoves.length <= 1));
  // Same order every time: the first maxTargets found are the ones held.
  assert.deepEqual(crowd.map((d) => d.log.kills), crowd.map((_, i) => (i < config.settings.maxTargets ? 1 : 0)));
  ability.destroy();
  ability.dispose();
});

test('pooled reuse resets the birth, the rupture and the held bodies; destroy mid-hold lets go', () => {
  const a = makeDummy(10, 0);
  const ability = setup([a]);
  ability.spawn(new Vector3(), new Vector3(1, 0, 0), 10);
  step(ability, 400);
  assert.equal(ability.isFinished, true);
  ability.destroy();
  assert.equal(ability.root.visible, false);
  a.alive = true;
  ability.spawn(new Vector3(), new Vector3(1, 0, 0), 10);
  assert.equal(ability._born, false);
  assert.equal(ability._ruptured, false);
  assert.equal(ability._heldCount, 0);
  for (let i = 0; i < 120 && !ability._born; i++) ability.update(1 / 60);
  step(ability, 10);
  assert.equal(a.log.kills, 2);
  const released = a.log.releases;
  ability.destroy();
  assert.equal(a.log.releases, released + 1, 'a body is never left floating');
  assert.equal(ability._heldCount, 0);
  ability.dispose();
});

test('no throw with the combat binding and the dummy field absent; editor exposes every key', () => {
  const ability = new Ability({ lights });
  ability.spawn(new Vector3(), new Vector3(0, 0, 1), 8);
  step(ability, 400);
  assert.equal(ability.isFinished, true);
  assert.equal(ability.failure, null);
  ability.destroy();
  ability.dispose();

  const seen = new Set();
  const folder = {
    addFolder: () => folder,
    add: (c, k) => { seen.add(k); return { name: () => {} }; },
    addColor: (c, k) => { seen.add(k); return { name: () => {} }; },
  };
  buildEditor(folder, settings[ID], null);
  const missing = Object.keys(config.settings).filter((k) => !seen.has(k));
  assert.deepEqual(missing, []);
  const keys = Object.keys(config.settings).length;
  assert.ok(keys >= 60 && keys <= 150, `${keys} keys`);
});

test('geometry is finite, the hero skin follows zoneRadius mid-cast, and resources dispose once', () => {
  const ability = setup([]);
  ability.spawn(new Vector3(), new Vector3(1, 0, 0), 10);
  for (let i = 0; i < 120 && !ability._born; i++) ability.update(1 / 60);
  step(ability, 40);
  assert.equal(ability.skinMat.uniforms.uRadius.value, config.settings.zoneRadius);
  settings[ID].zoneRadius = 5;
  step(ability, 1);
  assert.equal(ability.skinMat.uniforms.uRadius.value, 5, 'live slider reaches the skin next frame');
  assert.equal(ability.webMat.uniforms.uRadius.value, 5);
  settings[ID].zoneRadius = config.settings.zoneRadius;
  let meshes = 0;
  ability.group.traverse((o) => {
    if (!o.isMesh) return;
    meshes++;
    const p = o.geometry.attributes.position;
    for (let i = 0; i < p.count; i++) assert.ok(Number.isFinite(p.getX(i) + p.getY(i) + p.getZ(i)));
  });
  assert.ok(meshes >= 9);
  assert.ok(ability.web.geometry.userData.edgeCount > 30);
  let count = 0;
  for (const r of ability.resources) r.addEventListener('dispose', () => count++);
  ability.destroy();
  ability.dispose();
  ability.dispose();
  assert.equal(count, ability.resources.length);
});

test('with UCSM combat on: birth damages and marks enemies inside, the rupture hits them again', async () => {
  const { CombatStateManager } = await import('../../packs/sandbox/src/combat/ucsm/CombatStateManager.js');
  const { ExpansionCombatAdapter } = await import('../../packs/sandbox/src/combat/ucsm/ExpansionCombatAdapter.js');
  const manager = new CombatStateManager();
  manager.upsertEntity({ id: 'caster', teamId: 'player', health: 5 });
  manager.upsertEntity({ id: 'enemy', teamId: 'enemy', position: [10, 0, 1], health: 5 });
  manager.upsertEntity({ id: 'ally', teamId: 'player', position: [10, 0, 1], health: 5 });
  manager.upsertEntity({ id: 'outside', teamId: 'enemy', position: [20, 0, 0], health: 5 });
  const bridge = new ExpansionCombatAdapter(manager);
  const ability = new Ability({ lights, expansionCombat: bridge });
  const seen = [];
  const sub = bridge.bind('matrix-expansion/test-observer').on('hit', (e) => seen.push(e));
  ability.spawn(new Vector3(), new Vector3(1, 0, 0), 10);
  for (let i = 0; i < 120 && !ability._born; i++) { ability.update(1 / 60); if (i % 2) manager.advance(); }
  manager.advance();
  manager.advance();
  assert.equal(manager.entities.get('enemy').health, 4, 'birth damage');
  assert.ok(manager.entities.get('enemy').statuses.length > 0, 'held enemy is marked');
  for (let i = 0; i < 400; i++) { ability.update(1 / 60); if (i % 2) manager.advance(); }
  manager.advance();
  assert.equal(manager.entities.get('enemy').health, 3, 'rupture damage');
  assert.equal(manager.entities.get('ally').health, 5);
  assert.equal(manager.entities.get('outside').health, 5);
  assert.equal(seen.length, 2);
  assert.ok(seen.every((e) => e.abilityUid === UID && e.element === 'cosmic'));
  assert.equal(ability.failure, null);
  sub.unsubscribe();
  ability.destroy();
  ability.dispose();
  bridge.dispose();
});
