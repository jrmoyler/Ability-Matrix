import test from 'node:test';
import assert from 'node:assert/strict';
import { Vector3 } from 'three';
import { settings } from '../../packs/sandbox/src/config/settings.js';
import config from '../../packs/sandbox/src/abilities/expansion-2026/signal-jack/config.js';
import { Ability, ID } from '../../packs/sandbox/src/abilities/expansion-2026/signal-jack/index.js';

settings[ID] = structuredClone(config.settings);
const lights = { acquire: () => ({}), release: () => {}, set: () => {} };

function makeField(points) {
  const hits = [];
  const dummies = points.map(([x, z], i) => ({
    name: `d${i}`,
    alive: true,
    position: new Vector3(x, 0, z),
    kill(dx, dz, force) {
      if (!this.alive) return false;
      this.alive = false;
      hits.push({ name: this.name, dx, dz, ...force });
      return true;
    },
  }));
  const field = {
    findTargets(x, z, r, out) {
      out.length = 0;
      for (const d of dummies) if (d.alive && Math.hypot(d.position.x - x, d.position.z - z) <= r) out.push(d);
      out.sort((a, b) => Math.hypot(a.position.x - x, a.position.z - z) - Math.hypot(b.position.x - x, b.position.z - z));
      return out;
    },
  };
  return { dummies, field, hits };
}

// Landing point is (10, 0, 0). Three bodies inside the 4.5 m circle, one outside it
// but within turnRange of the jacked: the only legal turncoat victim.
const LAYOUT = [[10, 0], [11, 0], [10, 1.5], [16, 0]];
const run = (ability, frames) => { for (let i = 0; i < frames; i++) ability.update(1 / 60); };

test('Signal Jack cables the nearest enemies, turns one on the outsider, then overloads the jacked exactly once', () => {
  const { dummies, field, hits } = makeField(LAYOUT);
  const ability = new Ability({ lights, dummies: field });
  ability.spawn(new Vector3(), new Vector3(1, 0, 0), 10);
  run(ability, 30); // landed, before the jack
  assert.equal(ability.phase, 'impact');
  assert.equal(ability._jackCount, 0);
  run(ability, 45); // past jackAt
  assert.equal(ability._jackCount, 3);
  const jacked = new Set(ability.jacks.slice(0, 3).map((j) => j.dummy.name));
  assert.deepEqual([...jacked].sort(), ['d0', 'd1', 'd2']);
  assert.equal(hits.length, 0);
  run(ability, 70); // the first turncoat bolt has landed
  assert.equal(hits.length, 1);
  assert.equal(hits[0].name, 'd3', 'only a non-jacked enemy may be the victim');
  assert.ok(hits[0].dx > 0.9, 'the victim is thrown away from the traitor');
  assert.equal(hits[0].impulse, config.settings.hitImpulse);
  run(ability, 200);
  assert.equal(hits.length, 4, 'one turncoat hit + three overloads');
  assert.equal(new Set(hits.map((h) => h.name)).size, 4, 'no body is hit twice');
  assert.equal(ability._hits, 4);
  for (const h of hits.slice(1)) assert.equal(h.impulse, config.settings.overloadImpulse);
  assert.ok(dummies.every((d) => !d.alive));
  assert.equal(ability.isFinished, true);
  ability.destroy();
  ability.dispose();
});

test('a lone jacked body has nobody to turn on: only the overload lands', () => {
  const { field, hits } = makeField([[10.5, 0]]);
  const ability = new Ability({ lights, dummies: field });
  ability.spawn(new Vector3(), new Vector3(1, 0, 0), 10);
  run(ability, 320);
  assert.equal(hits.length, 1);
  assert.ok(hits[0].dx > 0.9, 'overload throws away from the spike');
  ability.destroy();
  ability.dispose();
});

test('pooled reuse fully resets the takeover and hides every per-cast mesh', () => {
  const { dummies, field, hits } = makeField(LAYOUT);
  const ability = new Ability({ lights, dummies: field });
  ability.spawn(new Vector3(), new Vector3(1, 0, 0), 10);
  run(ability, 320);
  assert.equal(hits.length, 4);
  ability.destroy();
  assert.equal(ability.root.visible, false);
  for (const j of ability.jacks) assert.ok(!j.cable.visible && !j.bolt.visible && !j.sheath.visible && j.dummy === null);
  for (const d of dummies) d.alive = true;
  ability.spawn(new Vector3(), new Vector3(1, 0, 0), 10);
  assert.equal(ability._jackCount, 0);
  assert.equal(ability._overloaded, false);
  assert.equal(ability._hits, 0);
  run(ability, 320);
  assert.equal(hits.length, 8);
  ability.destroy();
  ability.dispose();
});

test('no combat binding and no dummy field: the cast runs to completion without throwing', () => {
  const ability = new Ability({ lights });
  ability.spawn(new Vector3(), new Vector3(0, 0, 1), 8);
  run(ability, 320);
  assert.equal(ability.isFinished, true);
  assert.equal(ability._hits, 0);
  ability.destroy();
  ability.dispose();
});

test('geometry is finite, cables stay within bounds, resources dispose once', () => {
  const { field } = makeField(LAYOUT);
  const ability = new Ability({ lights, dummies: field });
  ability.spawn(new Vector3(), new Vector3(1, 0, 0), 10);
  run(ability, 100);
  const cable = ability.jacks[0].cable;
  assert.equal(cable.visible, true);
  const p = cable.geometry.attributes.position.array;
  for (let i = 0; i < p.length; i++) assert.ok(Number.isFinite(p[i]));
  for (let i = 1; i < p.length; i += 3) assert.ok(p[i] > -0.5 && p[i] < 6);
  let count = 0;
  for (const r of ability.resources) r.addEventListener('dispose', () => count++);
  ability.destroy();
  ability.dispose();
  ability.dispose();
  assert.equal(count, ability.resources.length);
});

test('through the combat bridge: turncoat and overload hits are attributed and never touch allies', async () => {
  const { CombatStateManager } = await import('../../packs/sandbox/src/combat/ucsm/CombatStateManager.js');
  const { ExpansionCombatAdapter } = await import('../../packs/sandbox/src/combat/ucsm/ExpansionCombatAdapter.js');
  const manager = new CombatStateManager();
  manager.upsertEntity({ id: 'caster', teamId: 'player', health: 5 });
  manager.upsertEntity({ id: 'e1', teamId: 'enemy', position: [10, 0, 0], health: 5 });
  manager.upsertEntity({ id: 'e2', teamId: 'enemy', position: [16, 0, 0], health: 5 });
  manager.upsertEntity({ id: 'ally', teamId: 'player', position: [10, 0, 1], health: 5 });
  const bridge = new ExpansionCombatAdapter(manager);
  const ability = new Ability({ lights, expansionCombat: bridge });
  const seen = [];
  const sub = bridge.bind('matrix-expansion/test-observer').on('hit', (e) => seen.push(e));
  ability.spawn(new Vector3(), new Vector3(1, 0, 0), 10);
  for (let i = 0; i < 320; i++) { ability.update(1 / 60); if (i % 2) manager.advance(); }
  manager.advance();
  assert.equal(manager.entities.get('ally').health, 5);
  assert.ok(manager.entities.get('e2').health < 5, 'the outsider took the turncoat bolt');
  assert.ok(manager.entities.get('e1').health < 5, 'the jacked took the overload');
  assert.ok(seen.length >= 2 && seen.length <= 2 * 4);
  for (const e of seen) assert.equal(e.abilityUid, 'matrix-expansion/signal-jack');
  sub.unsubscribe();
  ability.destroy();
  ability.dispose();
  bridge.dispose();
});
