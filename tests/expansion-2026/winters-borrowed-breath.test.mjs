import test from 'node:test';
import assert from 'node:assert/strict';
import { Matrix4, Vector3 } from 'three';
import { settings } from '../../packs/sandbox/src/config/settings.js';
import config from '../../packs/sandbox/src/abilities/expansion-2026/winters-borrowed-breath/config.js';
import { Ability, ID, UID, buildEditor } from '../../packs/sandbox/src/abilities/expansion-2026/winters-borrowed-breath/index.js';

settings[ID] = structuredClone(config.settings);
const c = settings[ID];
const DT = 1 / 60;
const lights = { acquire: () => ({}), release: () => {}, set: () => {} };

/** A thrown body the breath can hold: velocity eased toward the carrying field. */
function body(x, z, vx, vy, vz) {
  const v = new Vector3(vx, vy, vz);
  const p = new Vector3(x, 1, z);
  const tmp = new Vector3();
  return {
    alive: false, state: 'dead', position: new Vector3(x, 0, z), carried: 0, released: 0, shoved: null, corroded: 0,
    bodyVelocity: (out) => out.copy(v),
    bodyPoint: (out) => out.copy(p),
    carry(field, grab) { this.carried++; field(p.x, p.y, p.z, tmp); v.lerp(tmp, grab); p.addScaledVector(v, DT); },
    hold() {}, release() { this.released++; }, shove(x, y, z) { this.shoved = [x, y, z]; },
    corrode(a) { this.corroded = Math.max(this.corroded, a); },
    speed: () => v.length(),
  };
}

function setup({ bodies = [] } = {}) {
  const hits = [];
  const target = { alive: true, position: new Vector3(10, 0, 1), kill: (x, z, force) => { hits.push({ ...force, x, z }); return true; } };
  const far = { alive: true, position: new Vector3(99, 0, 0), kill: () => { throw Error('out of range'); } };
  const ability = new Ability({
    lights,
    dummies: {
      findTargets: (x, z, r, out) => { out.length = 0; out.push(target, far); return out; },
      findBodies: (x, z, r, out) => { out.length = 0; out.push(...bodies); return out; },
    },
  });
  return { ability, hits };
}
const run = (ability, frames) => { for (let i = 0; i < frames && !ability.isFinished; i++) ability.update(DT); };

test('the gust and the return each strike once, in range only, and the cast runs to completion', () => {
  const { ability, hits } = setup();
  ability.spawn(new Vector3(), new Vector3(1, 0, 0), 10);
  run(ability, 10);
  assert.equal(hits.length, 0, 'anticipation holds the front at the hand');
  assert.ok(ability.position.distanceTo(new Vector3()) < 1e-6);
  run(ability, 60);
  assert.equal(ability.phase, 'impact');
  assert.equal(hits.length, 1, 'the exhale');
  assert.equal(hits[0].impulse, c.hitImpulse);
  assert.ok(hits[0].z > 0, 'thrown outward from the zone centre');
  run(ability, 400);
  assert.equal(ability.isFinished, true);
  assert.equal(hits.length, 2, 'the return');
  const total = ability.age;
  assert.ok(total > 1.5 && total < 4.5, `screen time ${total}`);
  ability.destroy();
  ability.dispose();
});

test('velocity → armour: the spin mints its share, borrowed body speed mints more, and the return scales with it', () => {
  const plain = setup();
  plain.ability.spawn(new Vector3(), new Vector3(1, 0, 0), 10);
  run(plain.ability, 400);
  const baseArmor = plain.ability._armor;
  const expected = Math.floor(c.breathArmor * plain.ability.plates.instanceMatrix.count);
  assert.equal(plain.ability._minted, expected, 'the cyclone pays exactly breathArmor of the plates');

  const thrown = [body(10, 1, 6, 5, 0), body(11, -1, -4, 7, 2)];
  const speeds = thrown.map((b) => b.speed());
  const borrowed = setup({ bodies: thrown });
  borrowed.ability.spawn(new Vector3(), new Vector3(1, 0, 0), 10);
  let inhaling = false;
  for (let i = 0; i < 400 && !borrowed.ability.isFinished; i++) {
    borrowed.ability.update(DT);
    if (borrowed.ability.phase === 'impact') inhaling = true;
    if (borrowed.ability.phase === 'fade') break;
  }
  assert.ok(inhaling);
  for (let k = 0; k < 2; k++) {
    assert.ok(thrown[k].carried > 10, 'held in the breath');
    assert.ok(thrown[k].speed() < speeds[k] * 0.2, 'its flight was braked');
    assert.ok(thrown[k].corroded > 0.5, 'rimed');
  }
  const bank = borrowed.ability._armorBank;
  assert.ok(bank > 0 && bank <= speeds[0] + speeds[1] + 1e-6, `stolen speed ${bank} is bounded by the speed that existed`);
  assert.ok(borrowed.ability._armor > baseArmor, 'borrowed velocity bought extra armour');
  assert.equal(borrowed.ability._minted, Math.min(borrowed.ability.plates.instanceMatrix.count,
    Math.floor(c.breathArmor * borrowed.ability.plates.instanceMatrix.count) + Math.floor(bank / c.velocityPerPlate)));
  run(borrowed.ability, 400);
  assert.ok(thrown.every((b) => b.released > 0 && b.shoved), 'held bodies are released and thrown on the return');
  assert.ok(borrowed.hits[1].impulse > plain.hits[1].impulse, 'the return blow scales with armour');
  assert.ok(borrowed.hits[1].impulse <= 24 && borrowed.hits[1].lift <= 20);
  plain.ability.dispose();
  borrowed.ability.dispose();
});

test('plates fly in, seat and are thrown out on the return', () => {
  const { ability } = setup();
  ability.spawn(new Vector3(), new Vector3(1, 0, 0), 10);
  for (let i = 0; i < 400 && ability.phase !== 'fade'; i++) ability.update(DT);
  const m = new Matrix4();
  ability.plates.getMatrixAt(0, m);
  const seated = new Vector3().setFromMatrixPosition(m);
  assert.ok(Math.hypot(seated.x, seated.z) < c.zoneRadius * 1.1, 'seated on the carapace');
  for (let i = 0; i < 15; i++) ability.update(DT);
  ability.plates.getMatrixAt(0, m);
  const thrown = new Vector3().setFromMatrixPosition(m);
  assert.ok(Math.hypot(thrown.x, thrown.z) > Math.hypot(seated.x, seated.z) + 0.5, 'thrown outward');
  ability.destroy();
  ability.dispose();
});

test('pooled reuse resets armour, plates and held bodies', () => {
  const thrown = [body(10, 0, 3, 6, 0)];
  const { ability, hits } = setup({ bodies: thrown });
  ability.spawn(new Vector3(), new Vector3(1, 0, 0), 10);
  for (let i = 0; i < 80; i++) ability.update(DT);
  assert.ok(ability._heldCount > 0 && ability._minted > 0);
  ability.destroy();
  assert.equal(thrown[0].released > 0, true, 'destroy lets go of held bodies');
  assert.equal(ability.root.visible, false);
  ability.spawn(new Vector3(), new Vector3(1, 0, 0), 10);
  assert.equal(ability._minted, 0);
  assert.equal(ability._armorBank, 0);
  assert.equal(ability._heldCount, 0);
  assert.equal(ability.plates.count, 0);
  assert.equal(ability._exhaled, false);
  assert.equal(ability._returned, false);
  run(ability, 500);
  assert.equal(hits.length, 3, "one exhale from the destroyed cast, exhale + return from the reused one");
  ability.destroy();
  ability.dispose();
});

test('no throw with the combat binding, dummies and particles all absent; resources dispose once', () => {
  const ability = new Ability({ lights });
  ability.spawn(new Vector3(), new Vector3(0, 0, 1), 6);
  run(ability, 500);
  assert.equal(ability.isFinished, true);
  ability.destroy();
  let disposed = 0;
  for (const r of ability.resources) r.addEventListener('dispose', () => disposed++);
  ability.dispose();
  ability.dispose();
  assert.equal(disposed, ability.resources.length);
});

test('every settings key is exposed in the editor', () => {
  const seen = new Set();
  const ctrl = { name: () => ctrl };
  const folder = {
    addFolder: () => folder,
    add: (o, k) => { seen.add(k); return ctrl; },
    addColor: (o, k) => { seen.add(k); return ctrl; },
  };
  buildEditor(folder, settings[ID], null);
  const missing = Object.keys(config.settings).filter((k) => !seen.has(k));
  assert.deepEqual(missing, []);
});

test('live combat: the exhale and the return damage enemies through the attributed bridge', async () => {
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
  for (let i = 0; i < 600 && !ability.isFinished; i++) { ability.update(DT); if (i % 2) manager.advance(); }
  manager.advance();
  manager.advance();
  assert.equal(ability.failure, null);
  assert.equal(manager.entities.get('enemy').health, 3);
  assert.equal(manager.entities.get('ally').health, 5);
  assert.equal(manager.entities.get('outside').health, 5);
  assert.equal(seen.length, 2);
  assert.ok(seen.every((e) => e.abilityUid === UID && e.element === 'frost'));
  sub.unsubscribe();
  ability.destroy();
  ability.dispose();
  bridge.dispose();
});
