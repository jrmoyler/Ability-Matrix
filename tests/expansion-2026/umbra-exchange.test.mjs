import test from 'node:test';
import assert from 'node:assert/strict';
import { Vector3 } from 'three';
import { settings } from '../../packs/sandbox/src/config/settings.js';
import config from '../../packs/sandbox/src/abilities/expansion-2026/umbra-exchange/config.js';
import { Ability, ID, UID, buildEditor } from '../../packs/sandbox/src/abilities/expansion-2026/umbra-exchange/index.js';

settings[ID] = structuredClone(config.settings);
const c = settings[ID];
const lights = { acquire: () => ({}), release() {}, set() {} };
const DT = 1 / 60;

/** A standing dummy stand-in: position is the root position a real Dummy exposes. */
function body(x, z, name) {
  return {
    name,
    alive: true,
    position: new Vector3(x, 0, z),
    hits: [],
    kill(dx, dz, force) {
      if (!this.alive) return false;
      this.hits.push({ dx, dz, ...force, at: this.position.clone() });
      this.alive = false;
      return true;
    },
  };
}

function field(bodies) {
  return {
    generations: new Map(),
    standGeneration(d) { return this.generations.get(d) ?? 0; },
    findTargets(x, z, r, out) {
      out.length = 0;
      for (const d of bodies) if (d.alive && Math.hypot(d.position.x - x, d.position.z - z) <= r + 0.3) out.push(d);
      out.sort((a, b) => Math.hypot(a.position.x - x, a.position.z - z) - Math.hypot(b.position.x - x, b.position.z - z));
      return out;
    },
  };
}

/** Cast from the origin along +x to (10, 0, 0): the anchor lands at x = 10. */
function cast(ability) {
  ability.spawn(new Vector3(), new Vector3(1, 0, 0), 10);
}

function run(ability, frames) {
  for (let i = 0; i < frames && ability.isActive; i++) ability.update(DT);
}

const TOTAL = Math.ceil((c.chargeTime + 10 / c.speed + c.hookDelay + c.sinkTime + c.crawlTime + c.riseTime + c.holdTime + c.fade) * settings.global.lifetime * 60) + 30;

test('the anchor exchanges every enemy in reach with its mirror point and strikes it once on arrival', () => {
  const left = body(10, -2, 'left');
  const near = body(11, 1, 'near');
  const far = body(30, 0, 'far');
  const ability = new Ability({ lights, dummies: field([left, near, far]) });
  cast(ability);
  // Before the plunge nothing is touched.
  run(ability, Math.floor((c.chargeTime + 0.2) * 60));
  assert.equal(ability.hooked, 0);
  assert.equal(left.position.y, 0);
  run(ability, TOTAL);
  assert.equal(ability.isFinished, true);
  assert.equal(ability.hooked, 2);
  // P′ = 2A − P with A = (10, 0, 0).
  assert.equal(left.hits.length, 1);
  assert.ok(left.hits[0].at.distanceTo(new Vector3(10, 0, 2)) < 1e-6, `left arrived at ${left.hits[0].at.toArray()}`);
  assert.ok(near.hits[0].at.distanceTo(new Vector3(9, 0, -1)) < 1e-6);
  // Thrown away from the anchor, with the configured force.
  assert.ok(left.hits[0].dz > 0.99);
  assert.ok(near.hits[0].dx < 0 && near.hits[0].dz < 0);
  assert.equal(left.hits[0].impulse, c.hitImpulse * settings.global.explosionIntensity);
  assert.equal(far.hits.length, 0);
  assert.equal(far.position.x, 30);
  assert.equal(left.position.y, 0);
  ability.destroy();
  ability.dispose();
});

test('bodies sink under the floor, change sides while hidden, and rise before the strike', () => {
  const d = body(12, 0, 'd');
  const ability = new Ability({ lights, dummies: field([d]) });
  cast(ability);
  let deepest = 0;
  let movedWhileUnder = false;
  let struckAt = null;
  for (let i = 0; i < TOTAL && ability.isActive; i++) {
    const x = d.position.x;
    ability.update(DT);
    deepest = Math.min(deepest, d.position.y);
    if (x !== d.position.x) movedWhileUnder = d.position.y <= -c.sinkDepth + 1e-6;
    if (d.hits.length && struckAt === null) struckAt = d.hits[0].at.y;
  }
  assert.ok(Math.abs(deepest + c.sinkDepth) < 1e-6, `deepest ${deepest}`);
  assert.equal(movedWhileUnder, true);
  assert.equal(struckAt, 0);
  assert.equal(d.position.x, 8);
  ability.destroy();
  ability.dispose();
});

test('hits are bounded by maxTargets and nobody is struck twice', () => {
  const bodies = [];
  for (let i = 0; i < 10; i++) bodies.push(body(10 + Math.cos(i) * 2, Math.sin(i) * 2, `b${i}`));
  const ability = new Ability({ lights, dummies: field(bodies) });
  cast(ability);
  run(ability, TOTAL);
  const struck = bodies.filter((b) => b.hits.length);
  assert.equal(struck.length, c.maxTargets);
  assert.ok(struck.every((b) => b.hits.length === 1));
  c.maxTargets = 99; // clamped to the six the pool can draw
  for (const b of bodies) { b.alive = true; b.hits.length = 0; }
  ability.destroy();
  cast(ability);
  run(ability, TOTAL);
  assert.equal(bodies.filter((b) => b.hits.length).length, 6);
  c.maxTargets = config.settings.maxTargets;
  ability.destroy();
  ability.dispose();
});

test('a cast cleared mid-exchange leaves no body under the floor, and reuse resets every record', () => {
  const d = body(11, 0, 'd');
  const ability = new Ability({ lights, dummies: field([d]) });
  cast(ability);
  for (let i = 0; i < TOTAL && d.position.y > -1; i++) ability.update(DT);
  assert.ok(d.position.y < -1);
  ability.destroy();
  assert.equal(d.position.y, 0);
  assert.equal(d.hits.length, 0);
  assert.ok(ability.recs.every((r) => !r.active && !r.dummy && !r.moved && !r.struck));
  // Reuse: a fresh exchange from wherever the body now stands.
  const at = d.position.clone();
  cast(ability);
  assert.equal(ability.hooked, 0);
  assert.equal(ability._plunged, false);
  run(ability, TOTAL);
  assert.equal(d.hits.length, 1);
  assert.ok(d.hits[0].at.distanceTo(new Vector3(20 - at.x, 0, -at.z)) < 1e-6);
  ability.destroy();
  ability.dispose();
});

test('a body re-stood or felled by something else mid-exchange is let go untouched', () => {
  const d = body(11, 0, 'd');
  const dummies = field([d]);
  const ability = new Ability({ lights, dummies });
  cast(ability);
  for (let i = 0; i < TOTAL && d.position.y > -0.5; i++) ability.update(DT);
  // The field respawns it elsewhere: a new life.
  dummies.generations.set(d, 1);
  d.position.set(3, 0, 3);
  run(ability, TOTAL);
  assert.deepEqual(d.position.toArray(), [3, 0, 3]);
  assert.equal(d.hits.length, 0);
  ability.destroy();
  ability.dispose();
});

test('with nobody in reach spare chains bite the floor and nothing is hit', () => {
  const far = body(40, 0, 'far');
  const ability = new Ability({ lights, dummies: field([far]) });
  cast(ability);
  let chains = 0;
  for (let i = 0; i < TOTAL && ability.isActive; i++) {
    ability.update(DT);
    chains = Math.max(chains, ability.chains.slice(1).filter((m) => m.visible).length);
  }
  assert.equal(chains, c.floorChains);
  assert.equal(far.hits.length, 0);
  ability.destroy();
  ability.dispose();
});

test('no throw without dummies, particles or combat binding', () => {
  const ability = new Ability({ lights });
  cast(ability);
  run(ability, TOTAL);
  assert.equal(ability.isFinished, true);
  assert.equal(ability.struck, 0);
  ability.destroy();
  ability.dispose();
  ability.dispose();
});

test('through the combat bridge only enemies are exchanged, by attributed shadow hits', async () => {
  const { CombatStateManager } = await import('../../packs/sandbox/src/combat/ucsm/CombatStateManager.js');
  const { ExpansionCombatAdapter } = await import('../../packs/sandbox/src/combat/ucsm/ExpansionCombatAdapter.js');
  const manager = new CombatStateManager();
  manager.upsertEntity({ id: 'caster', teamId: 'player', health: 5 });
  manager.upsertEntity({ id: 'enemy', teamId: 'enemy', position: [11, 0, 1], health: 5 });
  manager.upsertEntity({ id: 'ally', teamId: 'player', position: [9, 0, -1], health: 5 });
  const enemyBody = body(11, 1, 'enemy');
  const allyBody = body(9, -1, 'ally');
  const bridge = new ExpansionCombatAdapter(manager);
  const seen = [];
  const sub = bridge.bind('matrix-expansion/test-observer').on('hit', (e) => seen.push(e));
  const ability = new Ability({ lights, dummies: field([enemyBody, allyBody]), expansionCombat: bridge });
  cast(ability);
  for (let i = 0; i < TOTAL && ability.isActive; i++) { ability.update(DT); if (i % 2) manager.advance(); }
  for (let i = 0; i < 4; i++) manager.advance();
  assert.equal(ability.hooked, 1);
  assert.equal(manager.entities.get('enemy').health, 5 - c.damage);
  assert.equal(manager.entities.get('ally').health, 5);
  assert.deepEqual(enemyBody.position.toArray(), [9, 0, -1]);
  assert.deepEqual(allyBody.position.toArray(), [9, 0, -1]);
  assert.equal(seen.length, 1);
  assert.equal(seen[0].abilityUid, UID);
  assert.equal(seen[0].element, 'shadow');
  assert.deepEqual(seen[0].targetIds, ['enemy']);
  sub.unsubscribe();
  ability.destroy();
  ability.dispose();
  bridge.dispose();
});

test('standalone mode knocks the exchanged dummy down through the fallback once', async () => {
  const { CombatStateManager } = await import('../../packs/sandbox/src/combat/ucsm/CombatStateManager.js');
  const { ExpansionCombatAdapter } = await import('../../packs/sandbox/src/combat/ucsm/ExpansionCombatAdapter.js');
  const manager = new CombatStateManager();
  const d = body(11, 0, 'd');
  const dummies = field([d]);
  dummies.slots = [{ dummy: d }];
  const bridge = new ExpansionCombatAdapter(manager, { enabled: () => false, modeVersion: () => 0 });
  const ability = new Ability({ lights, character: { position: new Vector3() }, dummies, expansionCombat: bridge });
  cast(ability);
  run(ability, TOTAL);
  assert.equal(d.hits.length, 1);
  assert.ok(d.hits[0].at.distanceTo(new Vector3(9, 0, 0)) < 1e-6);
  assert.equal(ability.failure, null);
  ability.destroy();
  ability.dispose();
  bridge.dispose();
});

test('every settings key is exposed in the editor and geometry is finite', () => {
  const seen = new Set();
  const folder = {
    addFolder: () => folder,
    add: (o, k) => { seen.add(k); return { name: () => {} }; },
    addColor: (o, k) => { seen.add(k); return { name: () => {} }; },
  };
  buildEditor({ addFolder: () => folder }, c, null);
  const missing = Object.keys(config.settings).filter((k) => !seen.has(k));
  assert.deepEqual(missing, []);
  const keys = Object.keys(config.settings).length;
  assert.ok(keys >= 60 && keys <= 150, `${keys} keys`);
  const ability = new Ability({ lights });
  const p = ability.anchor.geometry.attributes.position.array;
  assert.ok(p.length > 3000 && p.every(Number.isFinite));
  ability.dispose();
});
