import test from 'node:test';
import assert from 'node:assert/strict';
import { Vector3 } from 'three';
import { settings } from '../../packs/sandbox/src/config/settings.js';
import config from '../../packs/sandbox/src/abilities/expansion-2026/resonance-theft/config.js';
import { Ability, ID, UID } from '../../packs/sandbox/src/abilities/expansion-2026/resonance-theft/index.js';

settings[ID] = structuredClone(config.settings);
const c = settings[ID];
const DT = 1 / 60;
const lights = { acquire: () => ({}), release: () => {}, set: () => {} };

/** A cast aimed 10 m down +X lands its horn at (10, 0, 0). */
const cast = (ability) => ability.spawn(new Vector3(), new Vector3(1, 0, 0), 10);
const run = (ability, frames, each) => {
  for (let i = 0; i < frames && !ability.isFinished; i++) { ability.update(DT); each?.(i); }
};
const toPlayback = (ability, each) => {
  for (let i = 0; i < 600 && !ability._played; i++) { ability.update(DT); each?.(i); }
};

const fieldWith = (bodies) => ({
  findTargets: (x, z, r, out) => {
    out.length = 0;
    for (const b of bodies) out.push(b);
    return out;
  },
});
const body = (x, z, hits) => ({
  alive: true,
  position: new Vector3(x, 0, z),
  kill(dx, dz, force) { hits.push({ dx, dz, ...force, body: this }); return true; },
});

test('one bounded playback: only tapped bodies in the circle, struck once, never before the listening ends', () => {
  const hits = [];
  const near = body(11, 0, hits);
  const far = body(30, 0, hits);
  far.kill = () => { throw Error('far body must never be struck'); };
  const ability = new Ability({ lights, dummies: fieldWith([near, far]) });
  cast(ability);
  // Charge + flight + most of the listening: nothing struck yet.
  run(ability, Math.floor((c.chargeTime + 10 / c.speed + c.listenTime * 0.8) * 60));
  assert.equal(ability._played, false);
  assert.equal(hits.length, 0);
  assert.equal(ability._tapCount, 1, 'the near body is tapped while listening');
  toPlayback(ability);
  assert.equal(hits.length, 1);
  assert.equal(hits[0].body, near);
  assert.ok(hits[0].dx > 0.99, 'thrown outward from the horn');
  run(ability, 600);
  assert.equal(ability.isFinished, true);
  assert.equal(hits.length, 1, 'struck exactly once');
  ability.destroy();
  ability.dispose();
});

test('signature: every captured frequency amplifies the playback (bounded)', () => {
  const single = [];
  const a = new Ability({ lights, dummies: fieldWith([body(11, 0, single)]) });
  cast(a);
  toPlayback(a);
  assert.equal(single.length, 1);
  assert.equal(single[0].impulse, c.hitImpulse, 'one frequency: base knockback');

  const many = [];
  const bodies = [];
  for (let i = 0; i < 9; i++) bodies.push(body(10 + Math.cos(i) * 2, Math.sin(i) * 2, many));
  const b = new Ability({ lights, dummies: fieldWith(bodies) });
  cast(b);
  toPlayback(b);
  // Bounded by maxTaps: nine bodies stand in the circle, six are tapped and struck.
  assert.equal(b._tapCount, c.maxTaps);
  assert.equal(many.length, c.maxTaps);
  const amp = Math.min(c.maxAmplify, 1 + c.amplifyPerFrequency * (c.maxTaps - 1));
  assert.ok(Math.abs(many[0].impulse - Math.min(24, c.hitImpulse * amp)) < 1e-9);
  assert.ok(many[0].impulse > single[0].impulse);
  assert.equal(b._lastDamage, Math.min(c.maxDamage, c.baseDamage + c.damagePerFrequency * (c.maxTaps - 1)));
  a.destroy(); a.dispose(); b.destroy(); b.dispose();
});

test('pooled reuse resets taps, playback and presentation', () => {
  const hits = [];
  const target = body(11, 0, hits);
  const ability = new Ability({ lights, dummies: fieldWith([target]) });
  cast(ability);
  run(ability, 900);
  assert.equal(ability.isFinished, true);
  ability.destroy();
  assert.equal(ability.horn.visible, false);
  assert.equal(ability.reeds.count, 0);
  cast(ability);
  assert.equal(ability._played, false);
  assert.equal(ability._tapCount, 0);
  assert.equal(ability._stolenCount, 0);
  assert.equal(ability.floor.visible, false);
  run(ability, 900);
  assert.equal(hits.length, 2, 'one strike per cast');
  ability.destroy();
  ability.dispose();
});

test('no throw with no combat binding, no dummies and no particles; geometry is finite', () => {
  const ability = new Ability({ lights });
  cast(ability);
  run(ability, 900);
  assert.equal(ability.isFinished, true);
  let meshes = 0;
  ability.group.traverse((o) => {
    if (!o.isMesh) return;
    meshes++;
    const p = o.geometry.attributes.position;
    for (let i = 0; i < p.array.length; i++) assert.ok(Number.isFinite(p.array[i]));
  });
  assert.ok(meshes >= 6);
  let disposed = 0;
  for (const r of ability.resources) r.addEventListener('dispose', () => disposed++);
  ability.destroy();
  ability.dispose();
  ability.dispose();
  assert.equal(disposed, ability.resources.length);
});

test('UCSM: taps mark enemies resonating, a foreign attack in the circle is captured and raises the playback damage', async () => {
  const { CombatStateManager } = await import('../../packs/sandbox/src/combat/ucsm/CombatStateManager.js');
  const { ExpansionCombatAdapter } = await import('../../packs/sandbox/src/combat/ucsm/ExpansionCombatAdapter.js');
  const manager = new CombatStateManager();
  manager.upsertEntity({ id: 'caster', teamId: 'player', health: 10 });
  manager.upsertEntity({ id: 'enemy', teamId: 'enemy', position: [10, 0, 1], health: 10 });
  manager.upsertEntity({ id: 'enemy2', teamId: 'enemy', position: [9, 0, -1], health: 10 });
  manager.upsertEntity({ id: 'ally', teamId: 'player', position: [10, 0, 0.5], health: 10 });
  manager.upsertEntity({ id: 'outside', teamId: 'enemy', position: [25, 0, 0], health: 10 });
  const bridge = new ExpansionCombatAdapter(manager);
  const other = bridge.bind('matrix-expansion/test-other', 'caster');
  const ability = new Ability({ lights, expansionCombat: bridge });
  cast(ability);
  let foreignSent = false;
  let resonating = false;
  toPlayback(ability, (i) => {
    if (i % 2) manager.advance();
    if (ability._tapCount === 2 && !foreignSent && ability.impactTime > 0.3) {
      foreignSent = other.emit({ type: 'hit', element: 'fire', targetIds: ['enemy2'], position: [9, 0, -1], damage: 0 }).ok;
    }
    if (manager.entities.get('enemy').statuses.some((s) => s.tag === 'resonating')) resonating = true;
  });
  for (let i = 0; i < 6; i++) { ability.update(DT); manager.advance(); }
  assert.ok(foreignSent);
  assert.ok(resonating, 'a tapped enemy is resonating while it is drained');
  assert.equal(ability._tapCount, 2);
  assert.equal(ability._stolenCount, 1, 'the foreign attack was swallowed');
  const expected = Math.min(c.maxDamage, c.baseDamage + c.damagePerFrequency * 2);
  assert.ok(Math.abs(manager.entities.get('enemy').health - (10 - expected)) < 1e-9);
  assert.equal(manager.entities.get('ally').health, 10);
  assert.equal(manager.entities.get('outside').health, 10);
  assert.equal(ability.failure, null);
  run(ability, 900, () => manager.advance());
  assert.ok(Math.abs(manager.entities.get('enemy').health - (10 - expected)) < 1e-9, 'never struck twice');
  ability.destroy();
  ability.dispose();
  bridge.dispose();
});

test('own hits are never captured as stolen frequencies', () => {
  const ability = new Ability({ lights });
  cast(ability);
  for (let i = 0; i < 60 && !ability._landed; i++) ability.update(DT);
  ability.update(DT);
  ability._capture({ abilityUid: UID, position: [10, 0, 0] });
  assert.equal(ability._stolenCount, 0);
  ability._capture({ abilityUid: 'matrix-expansion/x', position: [10, 0, 0] });
  assert.equal(ability._stolenCount, 1);
  ability._capture({ abilityUid: 'matrix-expansion/x', position: [40, 0, 0] });
  assert.equal(ability._stolenCount, 1, 'outside the circle');
  ability.destroy();
  ability.dispose();
});
