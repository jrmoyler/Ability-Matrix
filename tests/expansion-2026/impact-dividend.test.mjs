import test from 'node:test';
import assert from 'node:assert/strict';
import { Vector3 } from 'three';
import { settings } from '../../packs/sandbox/src/config/settings.js';
import config from '../../packs/sandbox/src/abilities/expansion-2026/impact-dividend/config.js';
import { Ability, ID, buildEditor } from '../../packs/sandbox/src/abilities/expansion-2026/impact-dividend/index.js';

settings[ID] = structuredClone(config.settings);
const S = config.settings;
const lights = { acquire: () => ({}), release: () => {}, set: () => {} };

function dummy(x, z) {
  return {
    alive: true,
    position: new Vector3(x, 0, z),
    hits: [],
    kill(dx, dz, force) {
      if (!this.alive) return false;
      this.hits.push({ dx, dz, ...force });
      this.alive = false;
      return true;
    },
  };
}

function setup(bodies) {
  const ability = new Ability({
    lights,
    dummies: {
      findTargets: (x, z, r, out) => {
        out.length = 0;
        for (const b of bodies) if (b.alive) out.push(b);
        return out;
      },
    },
  });
  return ability;
}

const run = (ability, seconds) => {
  for (let i = 0; i < Math.round(seconds * 60); i++) ability.update(1 / 60);
};

test('the landing is blocked: deposits are held, nothing is struck until the payout', () => {
  const near = [dummy(10.5, 0), dummy(9.5, 0.6), dummy(10, -1)];
  const far = dummy(30, 0);
  const ability = setup([...near, far]);
  ability.spawn(new Vector3(), new Vector3(1, 0, 0), 10);
  run(ability, 10 / S.speed + 0.1);
  assert.equal(ability.phase, 'impact');
  assert.equal(ability._depCount, 3, 'only bodies inside the circle are banked');
  assert.ok(near.every((d) => d.hits.length === 0), 'blocked: no hit at the landing');
  // Through the beats, still nothing.
  run(ability, ability._payoutTime() - 0.2);
  assert.equal(ability._beatsDone, S.compoundBeats);
  assert.ok(near.every((d) => d.hits.length === 0));
  run(ability, 0.3);
  assert.equal(ability._paid, true);
  // Each depositor paid exactly once, outward, with the compounded force.
  const mult = Math.min(S.maxMultiplier, (1 + S.depositBonus * 2) * Math.pow(1 + S.interestRate, S.compoundBeats));
  for (const d of near) {
    assert.equal(d.hits.length, 1);
    const h = d.hits[0];
    assert.ok(Math.abs(h.impulse - Math.min(24, S.hitImpulse * mult)) < 1e-9);
    assert.ok(Math.abs(h.lift - Math.min(20, S.hitLift * mult)) < 1e-9);
    const ox = d.position.x - 10, oz = d.position.z;
    assert.ok(h.dx * ox + h.dz * oz > 0, 'thrown outward from the bank');
  }
  assert.equal(far.hits.length, 0);
  run(ability, 5);
  assert.equal(ability.isFinished, true);
  assert.equal(ability._hitCount, 3);
});

test('the dividend compounds with beats and deposits and stays bounded', () => {
  const ability = setup([]);
  ability._depCount = 1;
  ability._beatsDone = 0;
  assert.equal(ability.multiplier, 1);
  ability._beatsDone = 3;
  assert.ok(Math.abs(ability.multiplier - Math.pow(1 + S.interestRate, 3)) < 1e-9);
  ability._depCount = 8;
  ability._beatsDone = 6;
  assert.equal(ability.multiplier, S.maxMultiplier);
  ability.dispose();
});

test('deposits are capped and a late arrival is banked on a beat', () => {
  const crowd = Array.from({ length: 12 }, (_, i) => dummy(10 + Math.cos(i) * 0.5, Math.sin(i) * 0.5));
  const late = dummy(10, 1.5);
  late.alive = false;
  const ability = setup([...crowd, late]);
  ability.spawn(new Vector3(), new Vector3(1, 0, 0), 10);
  run(ability, 10 / S.speed + 0.1);
  assert.equal(ability._depCount, 8);
  ability.destroy();
  // Fresh cast with room: one body arrives after the landing.
  const few = [dummy(10, 0)];
  const late2 = dummy(10.5, 1);
  late2.alive = false;
  const b = setup([...few, late2]);
  b.spawn(new Vector3(), new Vector3(1, 0, 0), 10);
  run(b, 10 / S.speed + 0.1);
  assert.equal(b._depCount, 1);
  late2.alive = true;
  run(b, b._payoutTime());
  assert.equal(b._depCount, 2);
  assert.equal(late2.hits.length, 1);
  b.destroy();
  b.dispose();
  ability.dispose();
});

test('pooled reuse resets the bank', () => {
  const bodies = [dummy(10, 0)];
  const ability = setup(bodies);
  ability.spawn(new Vector3(), new Vector3(1, 0, 0), 10);
  run(ability, 5);
  assert.equal(ability.isFinished, true);
  assert.equal(bodies[0].hits.length, 1);
  ability.destroy();
  assert.equal(ability.root.visible, false);
  bodies[0].alive = true;
  ability.spawn(new Vector3(), new Vector3(1, 0, 0), 10);
  assert.equal(ability._depCount, 0);
  assert.equal(ability._beatsDone, 0);
  assert.equal(ability._paid, false);
  assert.equal(ability._hitCount, 0);
  run(ability, 5);
  assert.equal(bodies[0].hits.length, 2);
  ability.destroy();
  ability.dispose();
});

test('no throw without a combat binding or dummy field; geometry finite; editor covers every key', () => {
  const bare = new Ability({ lights });
  bare.spawn(new Vector3(), new Vector3(0, 0, 1), 8);
  run(bare, 5);
  assert.equal(bare.isFinished, true);
  let meshes = 0;
  bare.group.traverse((o) => {
    if (!o.isMesh) return;
    meshes++;
    const p = o.geometry.attributes.position;
    for (let i = 0; i < p.count; i++) assert.ok(Number.isFinite(p.getX(i) + p.getY(i) + p.getZ(i)));
  });
  assert.ok(meshes >= 5);
  let disposed = 0;
  for (const r of bare.resources) r.addEventListener('dispose', () => disposed++);
  bare.destroy();
  bare.dispose();
  bare.dispose();
  assert.equal(disposed, bare.resources.length);

  const keys = new Set();
  const ctl = { name: () => ctl, onChange: () => ctl };
  const folder = {
    addFolder: () => folder,
    add: (_c, k) => (keys.add(k), ctl),
    addColor: (_c, k) => (keys.add(k), ctl),
  };
  buildEditor({ addFolder: () => folder }, settings[ID], null);
  for (const k of Object.keys(S)) assert.ok(keys.has(k), `editor exposes ${k}`);
});

test('payout routes through the attributed UCSM binding', async () => {
  const { CombatStateManager } = await import('../../packs/sandbox/src/combat/ucsm/CombatStateManager.js');
  const { ExpansionCombatAdapter } = await import('../../packs/sandbox/src/combat/ucsm/ExpansionCombatAdapter.js');
  const manager = new CombatStateManager();
  manager.upsertEntity({ id: 'caster', teamId: 'player', health: 5 });
  manager.upsertEntity({ id: 'enemy', teamId: 'enemy', position: [10, 0, 1], health: 5 });
  manager.upsertEntity({ id: 'ally', teamId: 'player', position: [10, 0, 1], health: 5 });
  manager.upsertEntity({ id: 'outside', teamId: 'enemy', position: [20, 0, 0], health: 5 });
  const bridge = new ExpansionCombatAdapter(manager);
  const ability = new Ability({ lights, expansionCombat: bridge });
  ability.spawn(new Vector3(), new Vector3(1, 0, 0), 10);
  const seen = [];
  const sub = bridge.bind('matrix-expansion/test-observer').on('hit', (e) => seen.push(e));
  for (let i = 0; i < 60; i++) { ability.update(1 / 60); if (i % 2) manager.advance(); }
  assert.equal(manager.entities.get('enemy').health, 5, 'blocked at the landing');
  for (let i = 0; i < 240; i++) { ability.update(1 / 60); if (i % 2) manager.advance(); }
  assert.ok(manager.entities.get('enemy').health < 5);
  assert.equal(manager.entities.get('ally').health, 5);
  assert.equal(manager.entities.get('outside').health, 5);
  assert.equal(seen.length, 1);
  assert.equal(seen[0].abilityUid, 'matrix-expansion/impact-dividend');
  assert.equal(seen[0].element, 'force');
  sub.unsubscribe();
  ability.destroy();
  ability.dispose();
  bridge.dispose();
});
