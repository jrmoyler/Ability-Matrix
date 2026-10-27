import test from 'node:test';
import assert from 'node:assert/strict';
import { Vector3 } from 'three';
import { settings } from '../../packs/sandbox/src/config/settings.js';
import config from '../../packs/sandbox/src/abilities/expansion-2026/hematite-arsenal/config.js';
import {
  Ability,
  ID,
  MAX_WEAPONS,
  buildEditor,
} from '../../packs/sandbox/src/abilities/expansion-2026/hematite-arsenal/index.js';

settings[ID] = structuredClone(config.settings);
const reset = () => { settings[ID] = structuredClone(config.settings); };
const lights = { acquire: () => ({}), release() {}, set() {} };

/** Dummies that take one-hit kills; wounds are recorded through corrode. */
function field(positions) {
  const dummies = positions.map(([x, z]) => ({
    alive: true, position: new Vector3(x, 0, z), kills: [], stains: [],
    kill(dx, dz, force) { this.kills.push({ dx, dz, ...force }); this.alive = false; return true; },
    corrode(amount) { this.stains.push(amount); return amount; },
  }));
  return {
    dummies,
    ctx: {
      lights,
      dummies: {
        findTargets(x, z, r, out) {
          out.length = 0;
          for (const d of dummies) if (d.alive && Math.hypot(d.position.x - x, d.position.z - z) <= r) out.push(d);
          return out;
        },
      },
    },
  };
}

const run = (ability, seconds) => { for (let i = 0; i < seconds * 60; i++) ability.update(1 / 60); };

test('spawn → completion: the arsenal forges, flies, lands and finishes', () => {
  reset();
  const { ctx } = field([[10, 0]]);
  const a = new Ability(ctx);
  a.spawn(new Vector3(), new Vector3(1, 0, 0), 10);
  run(a, config.settings.forgeTime * 0.9);
  assert.equal(a.phase, 'travel');
  assert.equal(a.u, 0, 'travel waits for the forge');
  assert.ok(a.knot.visible, 'the blood knot is at the hand during the forge');
  run(a, 1);
  assert.notEqual(a.phase, 'travel');
  assert.ok(a.pool.visible);
  run(a, 8);
  assert.equal(a.isFinished, true);
  a.destroy(); a.dispose();
});

test('vitality bounds every hit; two strikes fell a one-health dummy; wounds stain first', () => {
  reset();
  // Seven dummies in the zone, one outside it.
  const ring = [[10, 0], [10.8, 0.6], [9.3, -0.8], [10.4, -1.2], [9.6, 1.3], [11.2, -0.3], [8.9, 0.4], [20, 0]];
  const { ctx, dummies } = field(ring);
  const a = new Ability(ctx);
  a.spawn(new Vector3(), new Vector3(1, 0, 0), 10);
  run(a, 10);
  const c = config.settings;
  const strikes = Math.floor(c.vitality / c.weaponCount / c.strikeDamage) * c.weaponCount;
  assert.equal(a.hitsLanded, strikes);
  assert.ok(a.damageDealt <= c.vitality + 1e-9, 'never more damage than the vitality spent');
  const felled = dummies.filter((d) => !d.alive);
  assert.equal(felled.length, strikes / 2, 'each body takes exactly two half-strikes');
  for (const d of felled) {
    assert.equal(d.kills.length, 1);
    assert.equal(d.stains.length, 1, 'the first strike wounds, the second fells');
    assert.equal(d.kills[0].impulse, c.hitImpulse);
  }
  assert.ok(dummies[7].alive, 'a body outside zoneRadius is never struck');
  a.destroy(); a.dispose();
});

test('a strike with no enemy is withheld and spends nothing', () => {
  reset();
  const { ctx } = field([]);
  const a = new Ability(ctx);
  a.spawn(new Vector3(), new Vector3(1, 0, 0), 10);
  run(a, 10);
  assert.equal(a.hitsLanded, 0);
  assert.equal(a.damageDealt, 0);
  assert.equal(a.withheld, a.totalStrikes);
  a.destroy(); a.dispose();
});

test('the bound holds under extreme sliders', () => {
  reset();
  Object.assign(settings[ID], { weaponCount: 99, vitality: 100, strikeDamage: 0.05 });
  const { ctx } = field([[10, 0], [10.5, 0.5]]);
  const a = new Ability(ctx);
  a.spawn(new Vector3(), new Vector3(1, 0, 0), 10);
  assert.ok(a.instanceCount <= MAX_WEAPONS);
  assert.ok(a.totalStrikes <= MAX_WEAPONS * 4);
  run(a, 30);
  assert.ok(a.hitsLanded <= a.totalStrikes);
  a.destroy(); a.dispose();
  reset();
});

test('pooled reuse resets every record', () => {
  reset();
  const { ctx, dummies } = field([[10, 0], [10.5, 0.5]]);
  const a = new Ability(ctx);
  a.spawn(new Vector3(), new Vector3(1, 0, 0), 10);
  run(a, 10);
  assert.ok(a.hitsLanded > 0);
  a.destroy();
  assert.equal(a.root.visible, false);
  for (const d of dummies) { d.alive = true; d.kills.length = 0; d.stains.length = 0; }
  a.spawn(new Vector3(), new Vector3(1, 0, 0), 10);
  assert.equal(a.hitsLanded, 0);
  assert.equal(a.damageDealt, 0);
  for (const w of a.weapons) {
    assert.equal(w.landed, 0);
    assert.equal(w.spentAt, -1);
    assert.ok(w.strikes.every((s) => !s.launched && !s.landed && !s.skipped && s.key === null));
  }
  run(a, 10);
  assert.equal(dummies.filter((d) => !d.alive).length, 2, 'the second cast fells both again');
  a.destroy(); a.dispose();
});

test('no throw with no combat binding, no dummies and no particles', () => {
  reset();
  const a = new Ability({ lights });
  a.spawn(new Vector3(), new Vector3(0, 0, 1), 6);
  run(a, 10);
  assert.equal(a.isFinished, true);
  assert.equal(a.hitsLanded, 0);
  a.destroy(); a.dispose(); a.dispose();
});

test('geometry is finite and the editor exposes every settings key', () => {
  reset();
  const a = new Ability({ lights });
  for (const w of a.weapons) {
    const p = w.mesh.geometry.attributes.position.array, n = w.mesh.geometry.attributes.normal.array;
    assert.ok(p.length > 900);
    assert.ok([...p, ...n].every(Number.isFinite));
  }
  const keys = new Set();
  const folder = {
    addFolder: () => folder,
    add: (_c, k) => { keys.add(k); return { name: () => {} }; },
    addColor: (_c, k) => { keys.add(k); return { name: () => {} }; },
  };
  buildEditor({ addFolder: () => folder }, settings[ID], null);
  const all = Object.keys(config.settings);
  assert.ok(all.length >= 60 && all.length <= 150, `settings keys ${all.length}`);
  for (const k of all) assert.ok(keys.has(k), `editor misses ${k}`);
  a.dispose();
});

test('strikes route through the UCSM combat bridge with blood attribution', async () => {
  reset();
  const { CombatStateManager } = await import('../../packs/sandbox/src/combat/ucsm/CombatStateManager.js');
  const { ExpansionCombatAdapter } = await import('../../packs/sandbox/src/combat/ucsm/ExpansionCombatAdapter.js');
  const manager = new CombatStateManager();
  manager.upsertEntity({ id: 'caster', teamId: 'player', health: 5 });
  manager.upsertEntity({ id: 'enemy', teamId: 'enemy', position: [10, 0, 1], health: 5 });
  manager.upsertEntity({ id: 'ally', teamId: 'player', position: [10, 0, -1], health: 5 });
  manager.upsertEntity({ id: 'outside', teamId: 'enemy', position: [20, 0, 0], health: 5 });
  const bridge = new ExpansionCombatAdapter(manager);
  const a = new Ability({ lights, expansionCombat: bridge });
  const seen = [];
  const sub = bridge.bind('matrix-expansion/test-observer').on('hit', (e) => seen.push(e));
  a.spawn(new Vector3(), new Vector3(1, 0, 0), 10);
  for (let i = 0; i < 600; i++) { a.update(1 / 60); if (i % 2) manager.advance(); }
  const c = config.settings;
  assert.ok(seen.length > 0);
  assert.ok(seen.length <= a.totalStrikes);
  assert.ok(seen.every((e) => e.abilityUid === 'matrix-expansion/hematite-arsenal' && e.element === 'blood'));
  assert.ok(seen.every((e) => e.targetIds.length === 1 && e.targetIds[0] === 'enemy'));
  assert.ok(5 - manager.entities.get('enemy').health <= c.vitality + 1e-9);
  assert.equal(manager.entities.get('ally').health, 5);
  assert.equal(manager.entities.get('outside').health, 5);
  sub.unsubscribe(); a.destroy(); a.dispose(); bridge.dispose();
});
