import test from 'node:test';
import assert from 'node:assert/strict';
import { Vector3 } from 'three';
import { settings } from '../../packs/sandbox/src/config/settings.js';
import config from '../../packs/sandbox/src/abilities/expansion-2026/venom-mimicry/config.js';
import {
  Ability,
  ID,
  UID,
  buildEditor,
} from '../../packs/sandbox/src/abilities/expansion-2026/venom-mimicry/index.js';
import { spineTip } from '../../packs/sandbox/src/abilities/expansion-2026/venom-mimicry/geometry.js';

settings[ID] = structuredClone(config.settings);
const C = settings[ID];
const DT = 1 / 60;

/** A dummy field: a host at the landing point and a crowd around it. */
function field(points) {
  const kills = [];
  const stains = new Map();
  const dummies = points.map(([x, z], i) => ({
    name: `d${i}`,
    alive: true,
    position: new Vector3(x, 0, z),
    kill(dx, dz, force) {
      if (!this.alive) return false;
      this.alive = false;
      kills.push({ name: this.name, dx, dz, ...force });
      return true;
    },
    corrode(amount) {
      stains.set(this.name, Math.max(stains.get(this.name) ?? 0, amount));
      return amount;
    },
  }));
  const dummiesApi = {
    findTargets(x, z, r, out) {
      out.length = 0;
      for (const d of dummies) if (d.alive && Math.hypot(d.position.x - x, d.position.z - z) <= r) out.push(d);
      out.sort((a, b) => Math.hypot(a.position.x - x, a.position.z - z) - Math.hypot(b.position.x - x, b.position.z - z));
      return out;
    },
  };
  return { dummies, dummiesApi, kills, stains };
}
const lights = { acquire: () => ({}), release() {}, set() {} };
const run = (ability, frames) => { for (let i = 0; i < frames && ability.isActive; i++) ability.update(DT); };

test('the bite spreads in bounded waves and every carrier is struck exactly once, in unison', () => {
  // Host at the landing point (10,0); a chain of neighbours; one far away.
  const f = field([[10, 0], [12, 1], [12, -1.5], [14.5, 1], [15, -3], [40, 0]]);
  const ability = new Ability({ lights, dummies: f.dummiesApi });
  ability.spawn(new Vector3(), new Vector3(1, 0, 0), 10);
  let guard = 0;
  while (ability.phase === 'travel' && guard++ < 200) ability.update(DT);
  assert.equal(ability._count, 1, 'the host is chosen at landing');
  assert.equal(ability.carriers[0].dummy, f.dummies[0]);
  // Before the bite nothing is infected or struck.
  run(ability, Math.floor((ability.biteAt - 0.05) * 60));
  assert.equal(f.kills.length, 0);
  run(ability, 600);
  assert.equal(ability.isFinished, true);
  const struck = f.kills.map((k) => k.name).sort();
  assert.deepEqual(struck, ['d0', 'd1', 'd2', 'd3', 'd4'], 'every carrier in reach, none twice, never the far one');
  assert.ok(ability._count <= Math.min(8, C.maxInfected));
  for (const k of f.kills) assert.equal(k.impulse, C.hitImpulse * settings.global.explosionIntensity);
  // Carriers were stained by the venom before they fell.
  for (const name of struck) assert.ok((f.stains.get(name) ?? 0) > 0.2, `${name} stained`);
  // Waves are deterministic: the host's nearest neighbours come first.
  assert.deepEqual(ability.carriers.slice(0, 3).map((r) => r.wave), [0, 1, 1]);
  ability.destroy();
  ability.dispose();
});

test('the contagion respects maxInfected, fanout and waves', () => {
  const pts = [[10, 0]];
  for (let i = 0; i < 12; i++) pts.push([10 + Math.cos(i) * (1.5 + i * 0.3), Math.sin(i) * (1.5 + i * 0.3)]);
  const f = field(pts);
  const ability = new Ability({ lights, dummies: f.dummiesApi });
  ability.spawn(new Vector3(), new Vector3(1, 0, 0), 10);
  run(ability, 900);
  assert.equal(ability._count, C.maxInfected);
  assert.equal(f.kills.length, C.maxInfected);
  // fanout 2: the host infects exactly two in wave one.
  assert.equal(ability.carriers.filter((r, i) => i < ability._count && r.wave === 1).length, C.fanout);
  ability.destroy();
  ability.dispose();
});

test('the serpent is placed so its strike lands on its carrier (derived from the radius)', () => {
  const f = field([[10, 0]]);
  const ability = new Ability({ lights, dummies: f.dummiesApi });
  ability.spawn(new Vector3(), new Vector3(1, 0, 0), 10);
  run(ability, 60);
  const tip = spineTip(C.strikeLean, C.strikeCurl, { x: 0, y: 0 });
  for (const radius of [2, 3.2, 5]) {
    C.zoneRadius = radius;
    const base = new Vector3();
    const facing = ability._base(0, base);
    const L = radius * C.serpentLength;
    assert.ok(Math.abs(base.x + facing.x * tip.x * L - 10) < 1e-6, 'tip reaches the host');
    assert.ok(Math.abs(base.z + facing.z * tip.x * L) < 1e-6);
    assert.ok(Math.abs(Math.hypot(base.x - 10, base.z) - tip.x * L) < 1e-6);
  }
  C.zoneRadius = config.settings.zoneRadius;
  ability.destroy();
  ability.dispose();
});

test('pooled reuse fully resets the infection, and nothing is struck with no target', () => {
  const f = field([[10, 0], [12, 0]]);
  const ability = new Ability({ lights, dummies: f.dummiesApi });
  ability.spawn(new Vector3(), new Vector3(1, 0, 0), 10);
  run(ability, 900);
  assert.equal(f.kills.length, 2);
  ability.destroy();
  assert.equal(ability.serpents.count, 0);
  assert.equal(ability.root.visible, false);
  for (const d of f.dummies) d.alive = true;
  ability.spawn(new Vector3(), new Vector3(1, 0, 0), 10);
  assert.equal(ability._count, 0);
  assert.equal(ability._bitten, false);
  assert.equal(ability._venomed, false);
  run(ability, 900);
  assert.equal(f.kills.length, 4);
  ability.destroy();
  // A cast into empty ground runs to completion and strikes nothing.
  const empty = field([[40, 40]]);
  const lonely = new Ability({ lights, dummies: empty.dummiesApi });
  lonely.spawn(new Vector3(), new Vector3(1, 0, 0), 10);
  run(lonely, 900);
  assert.equal(lonely.isFinished, true);
  assert.equal(empty.kills.length, 0);
  lonely.destroy();
  lonely.dispose();
  ability.dispose();
});

test('no throw with no combat binding, no dummies, no particles', () => {
  const ability = new Ability({ lights });
  ability.spawn(new Vector3(), new Vector3(0, 0, 1), 6);
  run(ability, 900);
  assert.equal(ability.isFinished, true);
  assert.equal(ability.failure, null);
  ability.destroy();
  let disposed = 0;
  for (const r of ability.resources) r.addEventListener('dispose', () => disposed++);
  ability.dispose();
  ability.dispose();
  assert.equal(disposed, ability.resources.length);
});

test('serpent instances hold finite pose state and the editor exposes every key', () => {
  const f = field([[10, 0], [12, 1], [12, -1.5]]);
  const ability = new Ability({ lights, dummies: f.dummiesApi });
  ability.spawn(new Vector3(), new Vector3(1, 0, 0), 10);
  run(ability, 140);
  assert.ok(ability.serpents.count >= 2, 'mimics have risen');
  for (const name of ['aPose', 'aLife', 'aSize']) {
    const a = ability.serpents.geometry.attributes[name];
    for (let i = 0; i < ability.serpents.count * 4; i++) assert.ok(Number.isFinite(a.array[i]), name);
  }
  ability.destroy();
  ability.dispose();
  const keys = new Set();
  const folder = {
    addFolder: () => folder,
    add: (c, k) => { keys.add(k); return { name: () => {} }; },
    addColor: (c, k) => { keys.add(k); return { name: () => {} }; },
  };
  buildEditor(folder, C, null);
  const missing = Object.keys(C).filter((k) => !keys.has(k));
  assert.deepEqual(missing, []);
  const count = Object.keys(C).length;
  assert.ok(count >= 60 && count <= 150, `${count} keys`);
});

test('through the UCSM bridge: the host is bitten, its ailments are copied, carriers are hit once', async () => {
  const { CombatStateManager } = await import('../../packs/sandbox/src/combat/ucsm/CombatStateManager.js');
  const { ExpansionCombatAdapter } = await import('../../packs/sandbox/src/combat/ucsm/ExpansionCombatAdapter.js');
  const manager = new CombatStateManager();
  manager.upsertEntity({ id: 'caster', teamId: 'player', health: 5 });
  manager.upsertEntity({ id: 'host', teamId: 'enemy', position: [10, 0, 0], health: 5 });
  manager.upsertEntity({ id: 'near', teamId: 'enemy', position: [12, 0, 1], health: 5 });
  manager.upsertEntity({ id: 'ally', teamId: 'player', position: [11, 0, 0], health: 5 });
  manager.upsertEntity({ id: 'far', teamId: 'enemy', position: [40, 0, 0], health: 5 });
  // The host already burns: that is what the venom copies.
  manager.entities.get('host').statuses.push({ tag: 'burning', stacks: 1, intensity: 1, expiresTick: 1e9, sourceEventId: 'pre' });
  const bridge = new ExpansionCombatAdapter(manager);
  const seen = [];
  const watch = bridge.bind('matrix-expansion/test-observer');
  const subs = ['hit', 'status'].map((t) => watch.on(t, (e) => seen.push(e)));
  const ability = new Ability({ lights, expansionCombat: bridge });
  ability.spawn(new Vector3(), new Vector3(1, 0, 0), 10);
  for (let i = 0; i < 900 && ability.isActive; i++) { ability.update(DT); if (i % 2) manager.advance(); }
  for (let i = 0; i < 4; i++) manager.advance();
  assert.equal(ability.failure, null);
  assert.deepEqual(ability.carriers.slice(0, ability._count).map((r) => r.id), ['host', 'near']);
  assert.deepEqual(ability._mimicked.slice(0, ability._mimicCount), ['fire']);
  const near = manager.entities.get('near');
  assert.ok(near.health < 5, 'the carrier was struck');
  assert.equal(manager.entities.get('far').health, 5);
  assert.equal(manager.entities.get('ally').health, 5);
  const hits = seen.filter((e) => e.abilityUid === UID && e.type === 'hit');
  assert.ok(hits.length <= 2);
  subs.forEach((s) => s.unsubscribe?.());
  ability.destroy();
  ability.dispose();
  bridge.dispose();
});
