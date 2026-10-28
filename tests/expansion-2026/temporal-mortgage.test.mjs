import test from 'node:test';
import assert from 'node:assert/strict';
import { Vector3 } from 'three';
import { settings } from '../../packs/sandbox/src/config/settings.js';
import config from '../../packs/sandbox/src/abilities/expansion-2026/temporal-mortgage/config.js';
import { Ability, ID } from '../../packs/sandbox/src/abilities/expansion-2026/temporal-mortgage/index.js';

settings[ID] = structuredClone(config.settings);
const DT = 1 / 60;
const lights = { acquire: () => ({}), release: () => {}, set: () => {} };

/** Cast from the origin along +x for 10 m: the circle is centred on (10, 0, 0). */
const setup = () => {
  const hits = [];
  const make = (name, x, z) => ({
    name,
    alive: true,
    position: new Vector3(x, 0, z),
    kill(dx, dz, force) {
      hits.push({ name, dx, dz, ...force });
      return true;
    },
  });
  // The lash starts on the caster's side (−x of the centre) and sweeps +θ.
  const near = make('near', 8.5, 0); // bearing π   → swept first
  const beyond = make('beyond', 12, 0); // bearing 0 → half-way round
  const flank = make('flank', 10, 2); // bearing π/2 → three quarters round
  const far = make('far', 30, 0);
  far.kill = () => { throw Error('out of range'); };
  const ability = new Ability({
    lights,
    dummies: {
      findTargets: (x, z, r, out) => {
        out.length = 0;
        out.push(near, beyond, flank, far);
        return out;
      },
    },
  });
  return { ability, hits };
};

const run = (ability, frames) => { for (let i = 0; i < frames; i++) ability.update(DT); };

test('the lash strikes each body in the circle once, in sweep order, only while borrowing', () => {
  const { ability, hits } = setup();
  ability.spawn(new Vector3(), new Vector3(1, 0, 0), 10);
  const T = ability._terms();
  const hitTimes = [];
  for (let i = 0; i < 600 && !ability.isFinished; i++) {
    const before = hits.length;
    ability.update(DT);
    if (hits.length > before) hitTimes.push(ability.phase === 'impact' ? ability.impactTime : Infinity);
  }
  assert.equal(ability.isFinished, true);
  assert.deepEqual(hits.map((h) => h.name), ['near', 'beyond', 'flank']);
  for (const t of hitTimes) assert.ok(t <= T.B + DT, `hit at ${t} after the borrow (${T.B})`);
  assert.ok(hitTimes[1] > hitTimes[0] && hitTimes[2] > hitTimes[1]);
  // Knocked along the lash: 'beyond' sits at bearing 0, where the sweep runs toward +z.
  assert.ok(hits[1].dz > 0.5);
  assert.equal(hits[0].impulse, config.settings.hitImpulse * settings.global.explosionIntensity);
  ability.destroy();
  ability.dispose();
});

test('borrowed time is repaid exactly: τ − t returns to zero and the spring closes', () => {
  const { ability } = setup();
  ability.spawn(new Vector3(), new Vector3(1, 0, 0), 10);
  const T = ability._terms();
  assert.ok(Math.abs(T.R - ((T.k - 1) * T.B) / (1 - T.rho)) < 1e-12);
  let peak = 0;
  for (let i = 0; i < 600 && ability.phase !== 'fade'; i++) {
    ability.update(DT);
    peak = Math.max(peak, ability.clockDebt);
  }
  assert.ok(Math.abs(peak - (T.k - 1) * T.B) < (T.k - 1) * DT * 1.5, `peak debt ${peak}`);
  assert.equal(ability.phase, 'fade');
  assert.ok(Math.abs(ability.clockDebt) < 1e-9);
  assert.equal(ability.balance, 0);
  // Exact for any terms, not only the defaults.
  for (const [k, rho, B] of [[2.4, 0.35, 0.7], [4, 0.1, 0.3], [1.2, 0.8, 1.5]]) {
    const terms = { k, rho, B, R: ((k - 1) * B) / (1 - rho) };
    assert.ok(Math.abs(ability._tauAt(terms.B + terms.R, terms) - (terms.B + terms.R)) < 1e-12);
  }
  // The repayment is paid in `repayTicks` ratchet clicks.
  assert.equal(ability.clicks, config.settings.repayTicks);
  ability.destroy();
  ability.dispose();
});

test('pooled reuse resets the loan, the records and the hits', () => {
  const { ability, hits } = setup();
  ability.spawn(new Vector3(), new Vector3(1, 0, 0), 10);
  run(ability, 600);
  assert.equal(hits.length, 3);
  ability.destroy();
  assert.equal(ability.root.visible, false);
  assert.equal(ability._targetCount, 0);
  ability.spawn(new Vector3(), new Vector3(1, 0, 0), 10);
  assert.equal(ability._repaying, false);
  assert.equal(ability.struck, 0);
  assert.equal(ability.clicks, 0);
  run(ability, 600);
  assert.equal(hits.length, 6);
  assert.equal(ability.struck, 3);
  ability.destroy();
  ability.dispose();
});

test('no throw and no hits with neither dummies nor a combat binding', () => {
  const ability = new Ability({ lights });
  ability.spawn(new Vector3(), new Vector3(0, 0, 1), 6);
  run(ability, 600);
  assert.equal(ability.isFinished, true);
  assert.equal(ability.struck, 0);
  ability.destroy();
  ability.dispose();
});

test('geometry is finite, the spring is a real coil, resources dispose exactly once', () => {
  const { ability } = setup();
  ability.spawn(new Vector3(), new Vector3(1, 0, 0), 10);
  run(ability, 40);
  const p = ability.springGeom.attributes.position.array;
  for (let i = 0; i < p.length; i++) assert.ok(Number.isFinite(p[i]));
  let meshes = 0;
  ability.root.traverse((o) => { if (o.isMesh) meshes++; });
  assert.ok(meshes >= 8);
  let count = 0;
  for (const r of ability.resources) r.addEventListener('dispose', () => count++);
  ability.destroy();
  ability.dispose();
  ability.dispose();
  assert.equal(count, ability.resources.length);
});

test('the lash strikes UCSM enemies through the attributed combat bridge and charges the debt', async () => {
  const { CombatStateManager } = await import('../../packs/sandbox/src/combat/ucsm/CombatStateManager.js');
  const { ExpansionCombatAdapter } = await import('../../packs/sandbox/src/combat/ucsm/ExpansionCombatAdapter.js');
  const manager = new CombatStateManager();
  manager.upsertEntity({ id: 'caster', teamId: 'player', health: 5 });
  manager.upsertEntity({ id: 'enemy', teamId: 'enemy', position: [11, 0, 1], health: 5 });
  manager.upsertEntity({ id: 'ally', teamId: 'player', position: [10, 0, 1], health: 5 });
  manager.upsertEntity({ id: 'outside', teamId: 'enemy', position: [20, 0, 0], health: 5 });
  const bridge = new ExpansionCombatAdapter(manager);
  const ability = new Ability({ lights, expansionCombat: bridge });
  const seen = [];
  const subscription = bridge.bind('matrix-expansion/test-observer').on('hit', (event) => seen.push(event));
  ability.spawn(new Vector3(), new Vector3(1, 0, 0), 10);
  let delayed = false;
  for (let i = 0; i < 400; i++) {
    ability.update(DT);
    if (i % 2) manager.advance();
    if (ability._repaying && manager.entities.get('enemy').statuses.some((s) => s.tag === 'delayed' && s.sourceUid === 'matrix-expansion/temporal-mortgage')) delayed = true;
  }
  assert.equal(manager.entities.get('enemy').health, 4);
  assert.ok(delayed, 'the recovery debt is carried as the time status');
  assert.equal(manager.entities.get('ally').health, 5);
  assert.equal(manager.entities.get('outside').health, 5);
  assert.equal(seen.length, 1);
  assert.equal(seen[0].abilityUid, 'matrix-expansion/temporal-mortgage');
  assert.equal(seen[0].element, 'time');
  assert.equal(ability.failure, null);
  assert.equal(ability.statusFailure, undefined);
  subscription.unsubscribe();
  ability.destroy();
  ability.dispose();
  bridge.dispose();
});
