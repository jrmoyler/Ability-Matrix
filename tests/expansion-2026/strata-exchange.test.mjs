import test from 'node:test';
import assert from 'node:assert/strict';
import { Vector3 } from 'three';
import { settings } from '../../packs/sandbox/src/config/settings.js';
import config from '../../packs/sandbox/src/abilities/expansion-2026/strata-exchange/config.js';
import { Ability, ID, buildEditor } from '../../packs/sandbox/src/abilities/expansion-2026/strata-exchange/index.js';

settings[ID] = structuredClone(config.settings);
const c = settings[ID];
const DT = 1 / 60;
const lights = { acquire: () => ({}), release: () => {}, set: () => {} };

/** Where the twin socket lands for a cast from the origin along +x, 10 m. */
function twin() {
  const side = new Vector3(0, 0, 1); // direction × up for +x
  const off = side.clone().multiplyScalar(Math.cos(c.exchangeBearing)).addScaledVector(new Vector3(1, 0, 0), -Math.sin(c.exchangeBearing));
  return new Vector3(10, 0, 0).addScaledVector(off, 2 * c.zoneRadius + c.socketGap);
}

/** A dummy field whose bodies move when carried and remember what was done to them. */
function field(points) {
  const bodies = points.map((p) => ({
    alive: true,
    position: p.clone(),
    kills: 0, carries: 0, releases: 0, shoves: [],
    kill(x, z, force) {
      if (!this.alive) return false;
      this.alive = false;
      this.kills++;
      this.force = { ...force, x, z };
      return true;
    },
    carry(fn, grip) {
      this.carries++;
      const out = new Vector3();
      fn(this.position.x, this.position.y, this.position.z, out);
      this.position.addScaledVector(out, DT * Math.min(1, grip * 3));
    },
    hold() {},
    release() { this.releases++; },
    shove(x, y, z) { this.shoves.push([x, y, z]); },
    bodyPoint(out) { return out.copy(this.position); },
  }));
  const within = (b, x, z, r) => Math.hypot(b.position.x - x, b.position.z - z) <= r;
  return {
    bodies,
    findTargets(x, z, r, out) { out.length = 0; for (const b of bodies) if (b.alive && within(b, x, z, r)) out.push(b); return out; },
    findBodies(x, z, r, out) { out.length = 0; for (const b of bodies) if (within(b, x, z, r)) out.push(b); return out; },
  };
}

const run = (ability, frames) => { for (let i = 0; i < frames && !ability.isFinished; i++) ability.update(DT); };

test('spawns, runs every beat to completion within the standard screen time, and hides on destroy', () => {
  const ability = new Ability({ lights });
  ability.spawn(new Vector3(), new Vector3(1, 0, 0), 10);
  let frames = 0;
  while (!ability.isFinished && frames < 600) { ability.update(DT); frames++; }
  assert.equal(ability.isFinished, true);
  const seconds = frames * DT;
  assert.ok(seconds > 1.5 && seconds < 4.5, `screen time ${seconds}`);
  ability.destroy();
  assert.equal(ability.plugs.every((p) => !p.visible), true);
  ability.dispose();
});

test('the exchange is real: a body on the target plug rides it into the twin socket and is thrown out there', () => {
  const B = twin();
  const dummies = field([new Vector3(10.4, 0, 0.3), new Vector3(B.x, 0, B.z), new Vector3(40, 0, 0)]);
  const [onA, onB, far] = dummies.bodies;
  const ability = new Ability({ lights, dummies });
  ability.spawn(new Vector3(), new Vector3(1, 0, 0), 10);
  run(ability, 600);
  // Both seized exactly once; the far one never touched.
  assert.equal(onA.kills, 1);
  assert.equal(onB.kills, 1);
  assert.equal(far.kills, 0);
  assert.equal(ability.hitCount, 2);
  // Carried across: each ends in the *other* socket, released and thrown out of it.
  assert.ok(onA.carries > 20 && onB.carries > 20);
  assert.ok(Math.hypot(onA.position.x - B.x, onA.position.z - B.z) < c.zoneRadius, `A body ended at ${onA.position.toArray()}`);
  assert.ok(Math.hypot(onB.position.x - 10, onB.position.z) < c.zoneRadius, `B body ended at ${onB.position.toArray()}`);
  assert.equal(onA.releases, 1);
  assert.equal(onA.shoves.length, 1);
  assert.ok(onA.shoves[0][1] > 0);
  ability.destroy();
  ability.dispose();
});

test('both plugs land exactly in the other socket, derived from the live radius', () => {
  const ability = new Ability({ lights });
  c.zoneRadius = 3.1; // change mid-cast: the landing must follow
  ability.spawn(new Vector3(), new Vector3(1, 0, 0), 10);
  let slamFrame = -1;
  for (let i = 0; i < 600 && !ability.isFinished; i++) {
    ability.update(DT);
    if (ability._slammed && slamFrame < 0) slamFrame = i;
  }
  assert.ok(slamFrame > 0);
  const B = twin();
  ability.destroy();
  ability.spawn(new Vector3(), new Vector3(1, 0, 0), 10);
  while (!ability._slammed) ability.update(DT);
  const [p0, p1] = ability._crown;
  assert.ok(Math.hypot(p0.x - B.x, p0.z - B.z) < 0.05, 'target plug lands in the twin socket');
  assert.ok(Math.hypot(p1.x - 10, p1.z) < 0.05, 'twin plug lands in the target socket');
  c.zoneRadius = config.settings.zoneRadius;
  ability.destroy();
  ability.dispose();
});

test('hits are bounded: nobody is hit twice and a crowd is capped', () => {
  const pts = [];
  for (let i = 0; i < 30; i++) pts.push(new Vector3(10 + Math.cos(i) * 1.2, 0, Math.sin(i) * 1.2));
  const dummies = field(pts);
  const ability = new Ability({ lights, dummies });
  ability.spawn(new Vector3(), new Vector3(1, 0, 0), 10);
  run(ability, 600);
  assert.ok(ability.hitCount <= 12);
  assert.ok(dummies.bodies.every((b) => b.kills <= 1));
  assert.equal(dummies.bodies.filter((b) => b.kills).length, ability.hitCount);
  ability.destroy();
  ability.dispose();
});

test('pooled reuse resets every beat, the carried list and the hit memory', () => {
  const dummies = field([new Vector3(10, 0, 0)]);
  const ability = new Ability({ lights, dummies });
  ability.spawn(new Vector3(), new Vector3(1, 0, 0), 10);
  run(ability, 600);
  assert.equal(ability.hitCount, 1);
  ability.destroy();
  assert.equal(ability._carryCount, 0);
  const body = dummies.bodies[0];
  body.alive = true;
  body.position.set(10, 0, 0);
  ability.spawn(new Vector3(), new Vector3(1, 0, 0), 10);
  assert.equal(ability._seized, false);
  assert.equal(ability._slammed, false);
  assert.equal(ability.hitCount, 0);
  assert.equal(ability.plugs[0].visible, false);
  assert.equal(ability.stone.visible, true);
  run(ability, 600);
  assert.equal(body.kills, 2);
  ability.destroy();
  ability.dispose();
});

test('runs without a combat binding, dummies, particles or decals and never throws', () => {
  const ability = new Ability({ lights });
  for (let n = 0; n < 2; n++) {
    ability.spawn(new Vector3(), new Vector3(0, 0, 1), 6);
    assert.doesNotThrow(() => run(ability, 600));
    assert.equal(ability.isFinished, true);
    assert.equal(ability.failure, null);
    ability.destroy();
  }
  let disposed = 0;
  for (const r of ability.resources) r.addEventListener('dispose', () => disposed++);
  ability.dispose();
  ability.dispose();
  assert.equal(disposed, ability.resources.length);
});

test('the editor exposes every settings key', () => {
  const seen = new Set();
  const folder = { addFolder: () => folder, add: (o, k) => { seen.add(k); return { name: () => {} }; }, addColor: (o, k) => { seen.add(k); return { name: () => {} }; } };
  buildEditor(folder, structuredClone(config.settings), null);
  const missing = Object.keys(config.settings).filter((k) => !seen.has(k));
  assert.deepEqual(missing, []);
  const keys = Object.keys(config.settings).length;
  assert.ok(keys >= 60 && keys <= 150, `${keys} keys`);
});

test('through the UCSM bridge: seize and crush hit enemies once and the slam writes two terrain imprints', async () => {
  const { CombatStateManager } = await import('../../packs/sandbox/src/combat/ucsm/CombatStateManager.js');
  const { ExpansionCombatAdapter } = await import('../../packs/sandbox/src/combat/ucsm/ExpansionCombatAdapter.js');
  const B = twin();
  const manager = new CombatStateManager();
  manager.upsertEntity({ id: 'caster', teamId: 'player', health: 5 });
  manager.upsertEntity({ id: 'onA', teamId: 'enemy', position: [10, 0, 0.5], health: 5 });
  manager.upsertEntity({ id: 'onB', teamId: 'enemy', position: [B.x, 0, B.z], health: 5 });
  manager.upsertEntity({ id: 'ally', teamId: 'player', position: [10, 0, 0], health: 5 });
  manager.upsertEntity({ id: 'outside', teamId: 'enemy', position: [30, 0, 0], health: 5 });
  const bridge = new ExpansionCombatAdapter(manager);
  const ability = new Ability({ lights, expansionCombat: bridge });
  const hits = [];
  const terrain = [];
  const observer = bridge.bind('matrix-expansion/test-observer');
  const s1 = observer.on('hit', (e) => hits.push(e));
  const s2 = observer.on('terrain-impact', (e) => terrain.push(e));
  ability.spawn(new Vector3(), new Vector3(1, 0, 0), 10);
  for (let i = 0; i < 600 && !ability.isFinished; i++) { ability.update(DT); if (i % 2) manager.advance(); }
  for (let i = 0; i < 4; i++) manager.advance();
  assert.equal(manager.entities.get('onA').health, 5 - c.crushDamage);
  assert.equal(manager.entities.get('onB').health, 5 - c.crushDamage);
  assert.equal(manager.entities.get('ally').health, 5);
  assert.equal(manager.entities.get('outside').health, 5);
  assert.equal(hits.length, 2);
  assert.ok(hits.every((e) => e.abilityUid === 'matrix-expansion/strata-exchange' && e.element === 'earth'));
  assert.equal(terrain.length, 2);
  assert.equal(ability.failure, null);
  s1.unsubscribe(); s2.unsubscribe();
  ability.destroy(); ability.dispose(); bridge.dispose();
});
