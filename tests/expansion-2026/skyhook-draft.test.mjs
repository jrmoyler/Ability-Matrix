import test from 'node:test';
import assert from 'node:assert/strict';
import { Vector3 } from 'three';
import { settings } from '../../packs/sandbox/src/config/settings.js';
import config from '../../packs/sandbox/src/abilities/expansion-2026/skyhook-draft/config.js';
import { Ability, ID, UID, buildEditor } from '../../packs/sandbox/src/abilities/expansion-2026/skyhook-draft/index.js';
import { hookPoint } from '../../packs/sandbox/src/abilities/expansion-2026/skyhook-draft/geometry.js';

settings[ID] = structuredClone(config.settings);
const lights = { acquire: () => ({}), release() {}, set() {} };
const DT = 1 / 60;
const run = (ability, frames) => { for (let i = 0; i < frames && !ability.isFinished; i++) ability.update(DT); };

/** A sandbox-shaped dummy: kill knocks it down, then it is a body the draft may carry. */
function dummy(x, z) {
  return {
    alive: true, finished: false, position: new Vector3(x, 0, z), body: new Vector3(x, 0.3, z),
    kills: [], carries: 0, released: 0, lastVelocity: new Vector3(),
    kill(dx, dz, force) { if (!this.alive) return false; this.alive = false; this.kills.push({ dx, dz, ...force }); return true; },
    bodyPoint(out) { return out.copy(this.body); },
    carry(field, grab) { this.carries++; field(this.body.x, this.body.y, this.body.z, this.lastVelocity); this.body.addScaledVector(this.lastVelocity, grab * 0.05); },
    release() { this.released++; },
  };
}

function setup(bodies) {
  const field = {
    findTargets(x, z, r, out) { out.length = 0; for (const d of bodies) if (d.alive) out.push(d); return out; },
    findBodies(x, z, r, out) { out.length = 0; for (const d of bodies) out.push(d); return out; },
  };
  return new Ability({ lights, dummies: field });
}

test('one bounded strike at the eruption: only enemies in the lane, knocked downstream, once', () => {
  const inLane = dummy(6, 0.5), atHook = dummy(9.5, -0.4), wide = dummy(5, 4), behind = dummy(-2, 0), past = dummy(14, 0);
  const ability = setup([inLane, atHook, wide, behind, past]);
  ability.spawn(new Vector3(), new Vector3(1, 0, 0), 10);
  // The windup holds the front at the hand; nothing is struck before the eruption.
  run(ability, Math.floor(config.settings.windup / DT) - 2);
  assert.equal(ability.front, 0);
  assert.equal(ability.hits, 0);
  for (let i = 0; i < 120 && ability.phase === 'travel'; i++) ability.update(DT);
  assert.equal(ability.phase, 'impact');
  assert.equal(ability.hits, 2);
  assert.deepEqual([inLane, atHook].map((d) => d.kills.length), [1, 1]);
  assert.deepEqual([wide, behind, past].map((d) => d.kills.length), [0, 0, 0]);
  assert.equal(inLane.kills[0].dx, 1);
  assert.equal(inLane.kills[0].impulse, config.settings.hitImpulse * settings.global.explosionIntensity);
  run(ability, 600);
  assert.equal(ability.isFinished, true);
  assert.equal(ability.hits, 2, 'never strikes twice');
  ability.destroy();
  ability.dispose();
});

test('signature: the draft conveys downed bodies downstream onto the centreline, then hoists them onto the hook and lets go', () => {
  const caught = dummy(4, 1);
  const corpse = dummy(7, -0.8); // already down: the draft carries it too
  corpse.alive = false;
  const outside = dummy(5, 5);
  outside.alive = false;
  const ability = setup([caught, corpse, outside]);
  ability.spawn(new Vector3(), new Vector3(1, 0, 0), 10);
  for (let i = 0; i < 120 && ability.phase === 'travel'; i++) ability.update(DT);
  ability.update(DT);
  // Conveying: velocity is downstream (+x), toward the centreline, never past the lane.
  assert.ok(caught.carries > 0 && corpse.carries > 0);
  assert.equal(outside.carries, 0);
  assert.ok(caught.lastVelocity.x > 0, 'downstream');
  assert.ok(caught.lastVelocity.z < 0, 'drawn onto the centreline from +z');
  assert.ok(corpse.lastVelocity.z > 0, 'drawn onto the centreline from −z');
  // A body that reaches the stem is hoisted toward the barb's hanging point.
  corpse.body.set(9.6, 0.3, 0);
  ability.update(DT);
  const hang = ability._hang;
  assert.ok(hang.y > config.settings.hookHeight * 0.5);
  assert.ok(corpse.lastVelocity.y > 0, 'hoisted up the stem');
  assert.ok(hang.x < 10, 'the barb hangs back over the lane');
  const R = config.settings.hookCurl * config.settings.laneWidth;
  const yaw = ability.hook.rotation.y;
  assert.ok(Math.abs(hang.x - (10 - 2 * R * Math.cos(yaw))) < 1e-6, 'curl derived from the lane width');
  assert.ok(Math.abs(hang.z - 2 * R * Math.sin(yaw)) < 1e-6);
  // Released exactly once when the hook unravels.
  run(ability, 600);
  assert.equal(caught.released, 1);
  assert.equal(corpse.released, 1);
  assert.equal(outside.released, 0);
  ability.dispose();
});

test('placement is derived: the hook stands at the end of the line and its tip follows the lane width live', () => {
  const ability = setup([]);
  ability.spawn(new Vector3(2, 0, 3), new Vector3(0, 0, 1), 12);
  for (let i = 0; i < 120 && ability.phase === 'travel'; i++) ability.update(DT);
  ability.update(DT);
  assert.ok(Math.abs(ability._foot.x - 2) < 1e-6 && Math.abs(ability._foot.z - 15) < 1e-6);
  const reach = () => Math.hypot(ability._hang.x - ability._foot.x, ability._hang.z - ability._foot.z);
  const before = reach();
  settings[ID].laneWidth = config.settings.laneWidth * 1.5;
  ability.update(DT);
  assert.ok(reach() > before + 0.5, 'wider lane, wider curl, the barb reaches further');
  assert.equal(ability.coreMat.uniforms.uR.value, settings[ID].hookCurl * settings[ID].laneWidth);
  settings[ID].laneWidth = config.settings.laneWidth;
  const p = hookPoint(1, { height: 4, curl: 1, drop: 0.5, bow: 0 }, new Vector3());
  assert.ok(Math.abs(p.x + 2) < 1e-9 && Math.abs(p.y - 3.5) < 1e-9);
  ability.destroy();
  ability.dispose();
});

test('the catch is bounded by maxCaught and pooled reuse resets every record', () => {
  const crowd = [];
  for (let i = 0; i < 14; i++) crowd.push(dummy(2 + i * 0.5, (i % 3) * 0.3 - 0.3));
  const ability = setup(crowd);
  ability.spawn(new Vector3(), new Vector3(1, 0, 0), 10);
  run(ability, 600);
  assert.equal(ability.hits, config.settings.maxCaught);
  assert.ok(ability._held === 0);
  ability.destroy();
  for (const d of crowd) { d.alive = true; d.kills.length = 0; }
  ability.spawn(new Vector3(), new Vector3(1, 0, 0), 10);
  assert.equal(ability.hits, 0);
  assert.equal(ability._held, 0);
  assert.equal(ability._erupted, false);
  assert.equal(ability.plates.visible, false);
  assert.equal(ability.coreMat.uniforms.uUnravel.value, 0);
  run(ability, 600);
  assert.equal(ability.hits, config.settings.maxCaught);
  ability.destroy();
  ability.dispose();
});

test('no throw with the combat binding and the dummy field absent; resources finite and disposed once', () => {
  const ability = new Ability({ lights });
  ability.spawn(new Vector3(), new Vector3(0, 0, -1), 8);
  run(ability, 600);
  assert.equal(ability.isFinished, true);
  assert.equal(ability.hits, 0);
  ability.destroy();
  let meshes = 0;
  ability.root.traverse((o) => {
    if (!o.isMesh) return;
    meshes++;
    const p = o.geometry.attributes.position;
    for (let i = 0; i < p.count; i++) assert.ok(Number.isFinite(p.getX(i) + p.getY(i) + p.getZ(i)));
  });
  assert.ok(meshes >= 5);
  let disposed = 0;
  for (const r of ability.resources) r.addEventListener('dispose', () => disposed++);
  ability.dispose();
  ability.dispose();
  assert.equal(disposed, ability.resources.length);
});

test('every settings key is exposed in the editor', () => {
  const seen = new Set();
  const folder = () => ({
    addFolder: () => folder(),
    add: (c, k) => { seen.add(k); return { name() { return this; } }; },
    addColor: (c, k) => { seen.add(k); return { name() { return this; } }; },
  });
  buildEditor(folder(), settings[ID], null);
  const keys = Object.keys(config.settings);
  assert.ok(keys.length >= 60 && keys.length <= 150, `${keys.length} keys`);
  for (const k of keys) assert.ok(seen.has(k), `editor exposes ${k}`);
});

test('through the combat bridge: one attributed wind hit per enemy in the lane, plus buffeted', async () => {
  const { CombatStateManager } = await import('../../packs/sandbox/src/combat/ucsm/CombatStateManager.js');
  const { ExpansionCombatAdapter } = await import('../../packs/sandbox/src/combat/ucsm/ExpansionCombatAdapter.js');
  const manager = new CombatStateManager();
  manager.upsertEntity({ id: 'caster', teamId: 'player', health: 5 });
  manager.upsertEntity({ id: 'lane', teamId: 'enemy', position: [6, 0, 0.6], health: 5 });
  manager.upsertEntity({ id: 'wide', teamId: 'enemy', position: [6, 0, 4], health: 5 });
  manager.upsertEntity({ id: 'ally', teamId: 'player', position: [5, 0, 0], health: 5 });
  const bridge = new ExpansionCombatAdapter(manager);
  const ability = new Ability({ lights, expansionCombat: bridge });
  const seen = [];
  const sub = bridge.bind('matrix-expansion/test-observer').on('hit', (e) => seen.push(e));
  ability.spawn(new Vector3(), new Vector3(1, 0, 0), 10);
  for (let i = 0; i < 400 && !ability.isFinished; i++) { ability.update(DT); if (i % 2) manager.advance(); }
  manager.advance();
  assert.equal(ability.failure, null);
  assert.equal(manager.entities.get('lane').health, 4);
  assert.equal(manager.entities.get('wide').health, 5);
  assert.equal(manager.entities.get('ally').health, 5);
  assert.equal(seen.length, 1);
  assert.equal(seen[0].abilityUid, UID);
  assert.equal(seen[0].element, 'wind');
  sub.unsubscribe();
  ability.destroy();
  ability.dispose();
  bridge.dispose();
});
