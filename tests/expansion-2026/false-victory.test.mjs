import test from 'node:test';
import assert from 'node:assert/strict';
import { Vector3 } from 'three';
import { settings } from '../../packs/sandbox/src/config/settings.js';
import config from '../../packs/sandbox/src/abilities/expansion-2026/false-victory/config.js';
import { Ability, ID } from '../../packs/sandbox/src/abilities/expansion-2026/false-victory/index.js';

settings[ID] = structuredClone(config.settings);
const c = settings[ID];
const lights = { acquire: () => ({}), release() {}, set() {} };

function dummyAt(x, z, hits) {
  return {
    alive: true,
    position: new Vector3(x, 0, z),
    kill(dx, dz, force) {
      if (!this.alive) return false;
      hits.push({ who: this, dx, dz, ...force });
      this.alive = false;
      return true;
    },
  };
}

function setup(dummies, extra = {}) {
  const decals = [];
  const ctx = {
    lights,
    decals: { spawn: (type) => decals.push(type) },
    dummies: {
      findTargets(x, z, r, out) {
        out.length = 0;
        const list = dummies
          .filter((d) => d.alive && Math.hypot(d.position.x - x, d.position.z - z) <= r)
          .sort((a, b) => Math.hypot(a.position.x - x, a.position.z - z) - Math.hypot(b.position.x - x, b.position.z - z));
        out.push(...list);
        return out;
      },
    },
    ...extra,
  };
  return { ability: new Ability(ctx), decals };
}

const cast = (ability) => ability.spawn(new Vector3(), new Vector3(1, 0, 0), 10);
const run = (ability, frames) => { for (let i = 0; i < frames; i++) ability.update(1 / 60); };
const landFrames = Math.ceil((10 / c.speed) * 60) + 6;

test('marks on landing, strikes only after the reveal, each body once, then finishes', () => {
  const hits = [];
  const inside = [dummyAt(11, 0, hits), dummyAt(10, 1.5, hits), dummyAt(9, -1, hits)];
  const outside = dummyAt(20, 0, hits);
  const { ability, decals } = setup([...inside, outside]);
  cast(ability);
  run(ability, landFrames);
  assert.equal(ability.phase, 'impact');
  assert.equal(ability._markCount, 3);
  assert.equal(hits.length, 0, 'the staged defeat is not yet real');
  run(ability, Math.floor(c.revealDelay * 60) - 10);
  assert.equal(hits.length, 0);
  assert.ok(decals.includes('crack') || decals.length > 0);
  run(ability, 20);
  assert.equal(hits.length, 3);
  assert.ok(hits.every((h) => h.who !== outside));
  assert.equal(hits[0].impulse, c.hitImpulse * settings.global.explosionIntensity);
  run(ability, 400);
  assert.equal(hits.length, 3);
  assert.equal(ability.isFinished, true);
  ability.destroy();
  ability.dispose();
});

test('signature: the knock follows the king, escapers and late arrivals are spared', () => {
  const hits = [];
  const stays = dummyAt(12, 0, hits);   // east of the centre → falls +x
  const north = dummyAt(10, 2, hits);   // falls +z
  const leaves = dummyAt(9, -2, hits);  // will walk out
  const late = dummyAt(30, 0, hits);    // will walk in after the crowning
  const { ability } = setup([stays, north, leaves, late]);
  cast(ability);
  run(ability, landFrames);
  assert.equal(ability._markCount, 3);
  leaves.position.set(9, 0, -9);
  late.position.set(10, 0, 0.2);
  run(ability, Math.ceil(c.revealDelay * 60) + 4);
  const byWho = new Map(hits.map((h) => [h.who, h]));
  assert.ok(byWho.has(stays) && byWho.has(north));
  assert.ok(!byWho.has(leaves), 'walked out of the staged defeat');
  assert.ok(!byWho.has(late), 'was never in it');
  const e = byWho.get(stays);
  assert.ok(e.dx > 0.99 && Math.abs(e.dz) < 0.05);
  const n = byWho.get(north);
  assert.ok(n.dz > 0.99 && Math.abs(n.dx) < 0.05);
  // The king of each struck enemy lies along that same bearing.
  assert.equal(ability.struckCount, 2);
  ability.destroy();
  ability.dispose();
});

test('marks are bounded by maxMarked and the bridge target cap', () => {
  const hits = [];
  const crowd = [];
  for (let i = 0; i < 14; i++) crowd.push(dummyAt(10 + Math.cos(i) * 1.5, Math.sin(i) * 1.5, hits));
  const { ability } = setup(crowd);
  cast(ability);
  run(ability, landFrames);
  assert.equal(ability._markCount, Math.min(8, c.maxMarked));
  run(ability, 400);
  assert.equal(hits.length, Math.min(8, c.maxMarked));
  ability.destroy();
  ability.dispose();
});

test('pooled reuse resets marks, reveal and geometry state', () => {
  const hits = [];
  const d = dummyAt(10.5, 0, hits);
  const { ability } = setup([d]);
  cast(ability);
  run(ability, 400);
  assert.equal(hits.length, 1);
  ability.destroy();
  assert.equal(ability.kings.count, 0);
  d.alive = true;
  cast(ability);
  assert.equal(ability._revealed, false);
  assert.equal(ability._markCount, 0);
  assert.equal(ability.struckCount, 0);
  run(ability, 400);
  assert.equal(hits.length, 2);
  // Every instance matrix is finite.
  for (const mesh of [ability.leaves, ability.stems, ability.kings]) {
    for (const v of mesh.instanceMatrix.array) assert.ok(Number.isFinite(v));
  }
  ability.destroy();
  ability.dispose();
});

test('no throw without dummies, particles, decals or combat binding', () => {
  const ability = new Ability({ lights });
  cast(ability);
  run(ability, 400);
  assert.equal(ability.isFinished, true);
  ability.destroy();
  ability.dispose();
  ability.dispose();
});

test('UCSM: staged enemies are deceived, then struck through the attributed bridge', async () => {
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
  cast(ability);
  for (let i = 0; i < landFrames + 20; i++) { ability.update(1 / 60); if (i % 2) manager.advance(); }
  assert.equal(ability._markCount, 1);
  assert.equal(manager.entities.get('enemy').health, 5, 'not struck before the reveal');
  for (let i = 0; i < 200; i++) { ability.update(1 / 60); if (i % 2) manager.advance(); }
  assert.equal(manager.entities.get('enemy').health, 5 - c.hitDamage);
  assert.equal(manager.entities.get('ally').health, 5);
  assert.equal(manager.entities.get('outside').health, 5);
  assert.equal(seen.length, 1);
  assert.equal(seen[0].abilityUid, 'matrix-expansion/false-victory');
  assert.equal(seen[0].element, 'illusion');
  assert.deepEqual(seen[0].targetIds, ['enemy']);
  assert.equal(ability.failure, null, 'the deceived status and the hit were both accepted');
  sub.unsubscribe();
  ability.destroy();
  ability.dispose();
  bridge.dispose();
});

test('standalone fallback: one knockdown per marked dummy through the bridge', async () => {
  const { CombatStateManager } = await import('../../packs/sandbox/src/combat/ucsm/CombatStateManager.js');
  const { ExpansionCombatAdapter } = await import('../../packs/sandbox/src/combat/ucsm/ExpansionCombatAdapter.js');
  const manager = new CombatStateManager();
  let kills = 0;
  const dummy = { alive: true, position: new Vector3(11, 0, 0), kill() { kills++; this.alive = false; return true; } };
  const bridge = new ExpansionCombatAdapter(manager, { enabled: () => false, modeVersion: () => 0 });
  const ability = new Ability({ lights, character: { position: new Vector3() }, dummies: { slots: [{ dummy }] }, expansionCombat: bridge });
  cast(ability);
  run(ability, 400);
  assert.equal(kills, 1);
  assert.equal(ability.failure, null);
  ability.destroy();
  ability.dispose();
  bridge.dispose();
});
