import test from 'node:test';
import assert from 'node:assert/strict';
import { Matrix4, Vector3 } from 'three';
import { settings } from '../../packs/sandbox/src/config/settings.js';
import config from '../../packs/sandbox/src/abilities/expansion-2026/countermand-sigil/config.js';
import {
  Ability,
  ID,
  UID,
  buildEditor,
} from '../../packs/sandbox/src/abilities/expansion-2026/countermand-sigil/index.js';

settings[ID] = structuredClone(config.settings);
const C = settings[ID];
const lights = { acquire: () => ({}), release() {}, set() {} };
const STEP = 1 / 60;

/** Dummies on a field; findTargets returns alive ones nearest first. */
function field(points) {
  const kills = [];
  const dummies = points.map(([x, z], i) => ({
    i,
    alive: true,
    position: new Vector3(x, 0, z),
    kill(dx, dz, force) {
      if (!this.alive) return false;
      this.alive = false;
      kills.push({ i, dx, dz, ...force });
      return true;
    },
  }));
  const findTargets = (x, z, r, out) => {
    out.length = 0;
    for (const d of dummies) if (d.alive && Math.hypot(d.position.x - x, d.position.z - z) <= r) out.push(d);
    out.sort((a, b) => Math.hypot(a.position.x - x, a.position.z - z) - Math.hypot(b.position.x - x, b.position.z - z));
    return out;
  };
  return { dummies, kills, findTargets };
}

/** Cast at (10, 0) along +x; run until the given predicate or a frame cap. */
function run(ability, until, cap = 600) {
  for (let i = 0; i < cap && !until(); i++) ability.update(STEP);
}

test('spawns, plants, marks bounded targets and resolves exactly one verdict', () => {
  // Nine dummies inside the 3.6 m circle, one far outside.
  const pts = [[10, 0], [11, 0], [9, 1], [10, -2], [12, 1.5], [8.5, -1], [10, 2.5], [11.5, -2], [9, -2.6], [30, 0]];
  const f = field(pts);
  const ability = new Ability({ lights, dummies: { findTargets: f.findTargets } });
  ability.spawn(new Vector3(), new Vector3(1, 0, 0), 10);
  // Wind-up: the seal stays in the hand.
  for (let i = 0; i < 6; i++) ability.update(STEP);
  assert.equal(ability.phase, 'travel');
  assert.ok(ability.position.length() < 1e-6, 'held in the hand during the wind-up');
  run(ability, () => ability.phase === 'impact');
  assert.equal(ability._marked, C.maxMarks, 'marks are bounded by maxMarks');
  assert.equal(f.kills.length, 0, 'no hit before the verdict');
  run(ability, () => ability._verdicted);
  assert.equal(f.kills.length, C.maxMarks);
  assert.ok(f.kills.every((k) => k.i !== 9), 'the far dummy is never struck');
  for (const k of f.kills) {
    const d = f.dummies[k.i];
    const away = (d.position.x - 10) * k.dx + d.position.z * k.dz;
    assert.ok(away >= -1e-6, 'knockback points away from the seal');
    assert.equal(k.impulse, C.hitImpulse * settings.global.explosionIntensity);
  }
  run(ability, () => ability.isFinished);
  assert.equal(ability.isFinished, true);
  assert.equal(f.kills.length, C.maxMarks, 'one verdict only');
  ability.destroy();
  ability.dispose();
});

test('countermand: another spell landing inside answers with a writ, hastens and strengthens the verdict', () => {
  const f = field([[10, 0], [12, 2]]);
  const ability = new Ability({ lights, dummies: { findTargets: f.findTargets } });
  ability.spawn(new Vector3(), new Vector3(1, 0, 0), 10);
  assert.equal(ability.countermand(10, 0), false, 'nothing to countermand before the plant');
  run(ability, () => ability.phase === 'impact');
  ability.update(STEP);
  const before = ability._verdictTime();
  // Mark only the first dummy; the second becomes a countermand target.
  assert.equal(ability.countermand(30, 0), false, 'outside the jurisdiction');
  assert.equal(ability.countermand(12, 2), true);
  assert.equal(ability._countermands, 1);
  assert.ok(ability._verdictTime() < before, 'the verdict comes sooner');
  for (let i = 0; i < C.maxCountermands + 3; i++) ability.countermand(10.5, 0.5);
  assert.equal(ability._countermands, C.maxCountermands, 'bounded by maxCountermands');
  run(ability, () => ability._verdicted);
  assert.equal(f.kills.length, 2, 'marked and countermand targets both struck, each once');
  const bonus = 1 + C.countermandBonus * C.maxCountermands;
  assert.ok(Math.abs(f.kills[0].impulse - Math.min(24, C.hitImpulse * Math.min(3, bonus))) < 1e-9, 'heavier verdict');
  assert.equal(ability.countermand(10, 0), false, 'no countermand after the verdict');
  ability.destroy();
  ability.dispose();
});

test('pooled reuse resets every per-cast field and the writs', () => {
  const f = field([[10, 0], [11, 1]]);
  const ability = new Ability({ lights, dummies: { findTargets: f.findTargets } });
  ability.spawn(new Vector3(), new Vector3(1, 0, 0), 10);
  run(ability, () => ability._verdicted);
  ability.countermand(10, 0);
  run(ability, () => ability.isFinished);
  ability.destroy();
  assert.equal(ability.root.visible, false);
  for (const d of f.dummies) d.alive = true;
  ability.spawn(new Vector3(), new Vector3(1, 0, 0), 10);
  assert.equal(ability._verdicted, false);
  assert.equal(ability._planted, false);
  assert.equal(ability._countermands, 0);
  assert.equal(ability._marked, 0);
  assert.ok(ability._records.every((r) => !r.active && r.dummy === null));
  // Inactive writs are parked out of sight at zero scale.
  const m = new Matrix4();
  ability.writs.getMatrixAt(0, m);
  assert.ok(new Vector3().setFromMatrixScale(m).x < 1e-3);
  run(ability, () => ability.isFinished);
  assert.equal(f.kills.length, 4, 'second cast strikes again');
  ability.destroy();
  ability.dispose();
});

test('no throw with the combat binding and the dummy field absent; resources dispose once', () => {
  const ability = new Ability({ lights });
  ability.spawn(new Vector3(), new Vector3(0, 0, 1), 6);
  assert.doesNotThrow(() => run(ability, () => ability.isFinished));
  assert.equal(ability.isFinished, true);
  ability.destroy();
  let n = 0;
  for (const r of ability.resources) r.addEventListener('dispose', () => n++);
  ability.dispose();
  ability.dispose();
  assert.equal(n, ability.resources.length);
});

test('geometry is finite and the editor exposes every key', () => {
  const ability = new Ability({ lights });
  let meshes = 0;
  ability.group.traverse((o) => {
    if (!o.isMesh) return;
    meshes++;
    const p = o.geometry.attributes.position.array;
    for (let i = 0; i < p.length; i++) assert.ok(Number.isFinite(p[i]));
  });
  assert.ok(meshes >= 8);
  const seen = new Set();
  const ctl = { name() { return ctl; } };
  const gui = { addFolder: () => gui, add: (c, k) => (seen.add(k), ctl), addColor: (c, k) => (seen.add(k), ctl) };
  buildEditor(gui, C, null);
  const keys = Object.keys(config.settings);
  assert.ok(keys.length >= 60 && keys.length <= 150);
  assert.deepEqual(keys.filter((k) => !seen.has(k)), []);
  ability.dispose();
});

test('UCSM binding: marked enemies take one attributed hit; another cast inside is countermanded', async () => {
  const { CombatStateManager } = await import('../../packs/sandbox/src/combat/ucsm/CombatStateManager.js');
  const { ExpansionCombatAdapter } = await import('../../packs/sandbox/src/combat/ucsm/ExpansionCombatAdapter.js');
  const manager = new CombatStateManager();
  manager.upsertEntity({ id: 'caster', teamId: 'player', health: 5 });
  manager.upsertEntity({ id: 'enemy', teamId: 'enemy', position: [10, 0, 1], health: 5 });
  manager.upsertEntity({ id: 'ally', teamId: 'player', position: [10, 0, -1], health: 5 });
  manager.upsertEntity({ id: 'outside', teamId: 'enemy', position: [20, 0, 0], health: 5 });
  const bridge = new ExpansionCombatAdapter(manager);
  const ability = new Ability({ lights, expansionCombat: bridge });
  const seen = [];
  const watcher = bridge.bind('matrix-expansion/test-observer');
  const sub = watcher.on('hit', (e) => seen.push(e));
  ability.spawn(new Vector3(), new Vector3(1, 0, 0), 10);
  let frames = 0;
  while (ability.phase !== 'impact' && frames++ < 200) { ability.update(STEP); manager.advance(); }
  for (let i = 0; i < 6; i++) { ability.update(STEP); manager.advance(); }
  assert.equal(ability._marked, 1);
  // Another spell lands inside the circle: its committed hit is observed.
  watcher.emit({ type: 'hit', element: 'fire', targetIds: ['enemy'], position: [10, 0, 1], damage: 1 });
  manager.advance();
  ability.update(STEP);
  assert.equal(ability._countermands, 1, 'the seal answered the other cast');
  while (!ability._verdicted && frames++ < 600) { ability.update(STEP); manager.advance(); }
  manager.advance();
  const mine = seen.filter((e) => e.abilityUid === UID);
  assert.equal(mine.length, 1, 'one hit: the countermand writ does not strike the marked enemy twice');
  assert.equal(mine[0].element, 'arcane');
  assert.deepEqual(mine[0].targetIds, ['enemy']);
  assert.equal(manager.entities.get('ally').health, 5);
  assert.equal(manager.entities.get('outside').health, 5);
  sub.unsubscribe();
  ability.destroy();
  ability.dispose();
  bridge.dispose();
});
