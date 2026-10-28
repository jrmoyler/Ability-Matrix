import test from 'node:test';
import assert from 'node:assert/strict';
import { Vector3 } from 'three';
import { settings } from '../../packs/sandbox/src/config/settings.js';
import config from '../../packs/sandbox/src/abilities/expansion-2026/synaptic-override/config.js';
import {
  Ability,
  ID,
  UID,
  buildEditor,
} from '../../packs/sandbox/src/abilities/expansion-2026/synaptic-override/index.js';

settings[ID] = structuredClone(config.settings);
const DT = 1 / 60;

/** A dummy at (x, z) that records every blow. */
function body(x, z, log) {
  return {
    alive: true,
    position: new Vector3(x, 0, z),
    kill(dx, dz, force) {
      if (!this.alive) return false;
      this.alive = false;
      log.push({ who: this, dx, dz, ...force });
      return true;
    },
  };
}

function setup(bodies) {
  const hits = [];
  const list = bodies.map(([x, z]) => body(x, z, hits));
  const ctx = {
    lights: { acquire: () => ({}), release() {}, set() {} },
    dummies: {
      findTargets(x, z, r, out) {
        out.length = 0;
        // Nearest first, like DummyField; includes out-of-range bodies so the
        // cast's own radius check is exercised.
        const sorted = [...list].filter((d) => d.alive)
          .sort((a, b) => Math.hypot(a.position.x - x, a.position.z - z) - Math.hypot(b.position.x - x, b.position.z - z));
        out.push(...sorted);
        return out;
      },
    },
  };
  const ability = new Ability(ctx);
  return { ability, hits, list, ctx };
}

const cast = (ability) => ability.spawn(new Vector3(), new Vector3(1, 0, 0), 10);
const run = (ability, frames) => {
  for (let i = 0; i < frames && !ability.isFinished; i++) ability.update(DT);
};

test('config is data-only with a full commented settings block', () => {
  const keys = Object.keys(config.settings);
  assert.equal(config.id, 'synapticOverride');
  assert.equal(ID, config.id);
  assert.equal(UID, 'matrix-expansion/synaptic-override');
  assert.equal(config.meta.element, 'storm');
  assert.equal(config.meta.cast, 'zone');
  assert.ok(keys.length >= 60 && keys.length <= 150, `${keys.length} keys`);
  for (const k of ['range', 'minRange', 'speed', 'cooldown', 'castAnim', 'lightColor', 'lightIntensity', 'lightRadius', 'lifetime', 'zoneRadius'])
    assert.ok(k in config.settings, k);
});

test('spawn, run to completion: seize then divert — each seized body hit once, at the override', () => {
  // Three bodies inside the 3.6 m crown round the landing point (10, 0), one outside.
  const { ability, hits, list } = setup([[12, 0], [10, 2], [8.5, -1], [10, 9]]);
  cast(ability);
  let frames = 0;
  while (ability.phase === 'travel' && frames++ < 200) ability.update(DT);
  assert.equal(ability.phase, 'impact');
  // Nothing is struck while the override listens.
  run(ability, Math.floor(config.settings.overrideTime / DT) - 5);
  assert.equal(hits.length, 0);
  assert.equal(ability._seized, 3);
  run(ability, 10);
  assert.equal(hits.length, 3);
  assert.ok(!hits.some((h) => h.who === list[3]), 'outside body untouched');
  run(ability, 600);
  assert.equal(ability.isFinished, true);
  assert.equal(hits.length, 3, 'bounded: no second strike');
  ability.destroy();
  ability.dispose();
});

test('signature rule: each blow is diverted toward the next seized body round the soma', () => {
  const { ability, hits, list } = setup([[12, 0], [10, 2], [8, 0], [10, -2]]);
  cast(ability);
  run(ability, 400);
  assert.equal(hits.length, 4);
  // Bodies ordered by bearing round (10, 0): -90° (10,-2), 0° (12,0), 90° (10,2), 180° (8,0).
  const order = [list[3], list[0], list[1], list[2]];
  for (let i = 0; i < 4; i++) {
    const me = order[i],
      next = order[(i + 1) % 4];
    const h = hits.find((x) => x.who === me);
    const ex = next.position.x - me.position.x,
      ez = next.position.z - me.position.z,
      len = Math.hypot(ex, ez);
    assert.ok(Math.abs(h.dx - ex / len) < 1e-6 && Math.abs(h.dz - ez / len) < 1e-6, `body ${i} thrown at its neighbour`);
  }
  // A lone body is bent divertAngle off the radial instead.
  const lone = setup([[12, 0]]);
  cast(lone.ability);
  run(lone.ability, 400);
  assert.equal(lone.hits.length, 1);
  const a = (config.settings.divertAngle * Math.PI) / 180;
  assert.ok(Math.abs(lone.hits[0].dx - Math.cos(a)) < 1e-6 && Math.abs(lone.hits[0].dz - Math.sin(a)) < 1e-6);
  assert.equal(lone.hits[0].impulse, Math.min(24, config.settings.hitImpulse * settings.global.explosionIntensity));
  for (const x of [ability, lone.ability]) { x.destroy(); x.dispose(); }
});

test('seized bodies are capped by maxSeized and take the arms that plant on them', () => {
  const ring = [];
  for (let i = 0; i < 10; i++) ring.push([10 + Math.cos(i) * 2.5, Math.sin(i) * 2.5]);
  const { ability, hits } = setup(ring);
  cast(ability);
  run(ability, 30 + Math.ceil((config.settings.seizeDelay + config.settings.seizeTime + 0.1) / DT));
  assert.equal(ability._seized, config.settings.maxSeized);
  // Each seized arm's reach equals its body's distance (the derived plant).
  const A = ability.crownMat.uniforms.uArmA.value;
  for (let i = 0; i < ability._seized; i++) {
    const rec = ability._targets[i];
    assert.ok(rec.arm >= 0);
    assert.ok(Math.abs(A[rec.arm].y - Math.max(config.settings.somaRadius + 0.35, rec.dist)) < 1e-6);
  }
  run(ability, 600);
  assert.equal(hits.length, config.settings.maxSeized);
  ability.destroy();
  ability.dispose();
});

test('arm length is derived from the reach: a free arm plants its terminal on the zone rim', async () => {
  const { armPoint } = await import('../../packs/sandbox/src/abilities/expansion-2026/synaptic-override/crown.js');
  const { ability } = setup([]);
  cast(ability);
  run(ability, 80);
  const A = ability.crownMat.uniforms.uArmA.value[0];
  const B = ability.crownMat.uniforms.uArmB.value[0];
  const tip = armPoint(new Vector3(), A, B, ability._crownMirror, 1);
  assert.ok(Math.abs(Math.hypot(tip.x, tip.z) - A.y) < 1e-6, 'tip lands at the reach');
  assert.ok(Math.abs(tip.y) < 1e-6, 'tip on the floor');
  // Drag the radius mid-cast: the next frame plants on the new rim.
  settings[ID].zoneRadius = 5;
  ability.update(DT);
  const tip2 = armPoint(new Vector3(), A, B, ability._crownMirror, 1);
  assert.ok(Math.hypot(tip2.x, tip2.z) > 4.5);
  settings[ID].zoneRadius = config.settings.zoneRadius;
  ability.destroy();
  ability.dispose();
});

test('pooled reuse fully resets the seize and diversion state', () => {
  const { ability, hits, list } = setup([[12, 0], [10, 2]]);
  cast(ability);
  run(ability, 600);
  assert.equal(hits.length, 2);
  assert.equal(ability._discharged, true);
  ability.destroy();
  assert.equal(ability.root.visible, false);
  assert.equal(ability.axon.visible, false);
  for (const d of list) d.alive = true;
  cast(ability);
  assert.equal(ability._discharged, false);
  assert.equal(ability._seized, 0);
  assert.equal(ability._seizedDone, false);
  assert.ok(ability._armTarget.every((x) => x === -1));
  run(ability, 600);
  assert.equal(hits.length, 4);
  ability.destroy();
  ability.dispose();
});

test('no throw and no hits when the combat binding and dummies are absent', () => {
  const ability = new Ability({ lights: { acquire: () => ({}), release() {}, set() {} } });
  cast(ability);
  assert.doesNotThrow(() => run(ability, 600));
  assert.equal(ability.isFinished, true);
  assert.equal(ability._seized, 0);
  assert.equal(ability.failure, null);
  ability.destroy();
  ability.dispose();
  ability.dispose();
});

test('geometry is finite and every GPU resource is disposed once', () => {
  const { ability } = setup([]);
  let meshes = 0;
  ability.group.traverse((o) => {
    if (!o.isMesh) return;
    meshes++;
    const p = o.geometry.attributes.position;
    for (let i = 0; i < p.count; i++) assert.ok(Number.isFinite(p.getX(i) + p.getY(i) + p.getZ(i)));
  });
  assert.ok(meshes >= 8);
  let count = 0;
  for (const r of ability.resources) r.addEventListener('dispose', () => count++);
  ability.dispose();
  ability.dispose();
  assert.equal(count, ability.resources.length);
});

test('the editor exposes every settings key', () => {
  const seen = new Set();
  const folder = () => ({
    add(o, k) { seen.add(k); return { name() { return this; } }; },
    addColor(o, k) { seen.add(k); return { name() { return this; } }; },
    addFolder() { return folder(); },
  });
  buildEditor(folder(), structuredClone(config.settings), null);
  for (const k of Object.keys(config.settings)) assert.ok(seen.has(k), `editor misses ${k}`);
});

test('through the UCSM bridge: one interrupt status, then one diverted hit per seized enemy', async () => {
  const { CombatStateManager } = await import('../../packs/sandbox/src/combat/ucsm/CombatStateManager.js');
  const { ExpansionCombatAdapter } = await import('../../packs/sandbox/src/combat/ucsm/ExpansionCombatAdapter.js');
  const manager = new CombatStateManager();
  manager.upsertEntity({ id: 'caster', teamId: 'player', health: 5 });
  manager.upsertEntity({ id: 'e1', teamId: 'enemy', position: [12, 0, 0], health: 5 });
  manager.upsertEntity({ id: 'e2', teamId: 'enemy', position: [10, 0, 2], health: 5 });
  manager.upsertEntity({ id: 'ally', teamId: 'player', position: [11, 0, 0], health: 5 });
  manager.upsertEntity({ id: 'far', teamId: 'enemy', position: [25, 0, 0], health: 5 });
  const bridge = new ExpansionCombatAdapter(manager);
  const ability = new Ability({ lights: { acquire: () => ({}), set() {}, release() {} }, expansionCombat: bridge });
  const seen = [];
  const subs = ['hit', 'status'].map((t) => bridge.bind('matrix-expansion/test-observer').on(t, (e) => seen.push(e)));
  cast(ability);
  for (let i = 0; i < 400; i++) { ability.update(DT); if (i % 2) manager.advance(); }
  for (let i = 0; i < 4; i++) manager.advance();
  assert.equal(ability.failure, null);
  const status = seen.filter((e) => e.type === 'status' && e.abilityUid === UID);
  const hit = seen.filter((e) => e.type === 'hit' && e.abilityUid === UID);
  assert.equal(status.length, 1);
  assert.deepEqual([...status[0].targetIds].sort(), ['e1', 'e2']);
  assert.equal(hit.length, 2);
  assert.equal(manager.entities.get('e1').health, 5 - config.settings.hitDamage);
  assert.equal(manager.entities.get('e2').health, 5 - config.settings.hitDamage);
  assert.equal(manager.entities.get('ally').health, 5);
  assert.equal(manager.entities.get('far').health, 5);
  for (const s of subs) s.unsubscribe?.();
  ability.destroy();
  ability.dispose();
  bridge.dispose();
});
