import test from 'node:test';
import assert from 'node:assert/strict';
import { Vector3 } from 'three';
import { settings } from '../../packs/sandbox/src/config/settings.js';
import config from '../../packs/sandbox/src/abilities/expansion-2026/trajectory-hijack/config.js';
import { Ability, ID, buildEditor } from '../../packs/sandbox/src/abilities/expansion-2026/trajectory-hijack/index.js';

settings[ID] = structuredClone(config.settings);
const reset = () => Object.assign(settings[ID], structuredClone(config.settings));
const lights = { acquire: () => ({}), release() {}, set() {} };

/** Bodies round the landing point (10, 0, 0); one far outside the ring. */
function setup(points = [[10, 1], [11.5, -1.5], [8.5, 2], [12, 2.5]]) {
  const hits = [];
  const bodies = points.map(([x, z], i) => ({
    i, alive: true, position: new Vector3(x, 0, z),
    kill(dx, dz, force) { hits.push({ i, dx, dz, ...force }); this.alive = false; return true; },
  }));
  const far = { alive: true, position: new Vector3(40, 0, 0), kill() { throw Error('out of range'); } };
  const ctx = {
    lights,
    dummies: { findTargets(x, z, r, out) { out.length = 0; for (const b of bodies) if (b.alive) out.push(b); out.push(far); return out; } },
  };
  return { ability: new Ability(ctx), hits, bodies };
}
const run = (a, seconds) => { for (let i = 0; i < seconds * 60 && !a.isFinished; i++) a.update(1 / 60); };

test('volley is seized, redirected and hits each locked body exactly once, then finishes', () => {
  reset();
  const { ability, hits } = setup();
  ability.spawn(new Vector3(), new Vector3(1, 0, 0), 10);
  run(ability, 0.3);
  assert.equal(ability.phase, 'travel');
  assert.equal(hits.length, 0);
  run(ability, 12);
  assert.equal(ability.isFinished, true);
  assert.equal(hits.length, 4, 'one dart per body, never the far one');
  assert.deepEqual(hits.map((h) => h.i).sort(), [0, 1, 2, 3]);
  for (const h of hits) {
    assert.ok(Math.abs(Math.hypot(h.dx, h.dz) - 1) < 1e-6);
    assert.equal(h.impulse, config.settings.hitImpulse);
  }
  // Hijacked: at least one body is struck along a heading that is not the cast line.
  assert.ok(hits.some((h) => Math.abs(h.dz) > 0.3), 'blows land along redirected headings');
  ability.destroy();
  ability.dispose();
});

test('hits are capped by dartCount and untargeted darts never hit', () => {
  reset();
  settings[ID].dartCount = 2;
  const { ability, hits } = setup();
  ability.spawn(new Vector3(), new Vector3(1, 0, 0), 10);
  run(ability, 12);
  assert.equal(hits.length, 2);
  reset();
  const lone = setup([[10, 0.5]]);
  lone.ability.spawn(new Vector3(), new Vector3(1, 0, 0), 10);
  run(lone.ability, 12);
  assert.equal(lone.hits.length, 1);
  lone.ability.destroy(); lone.ability.dispose();
  ability.destroy(); ability.dispose();
});

test('signature: a seized dart circles at least minTurn and leaves on a tangent toward its target', () => {
  reset();
  const { ability } = setup([[10, 3]]);
  ability.spawn(new Vector3(), new Vector3(1, 0, 0), 10);
  run(ability, 1.2);
  const d = ability._darts[0];
  assert.equal(d.hasTarget, true);
  assert.ok(d.delta >= config.settings.minTurn * 2 * Math.PI - 1e-9);
  assert.ok(d.delta < (config.settings.minTurn + 1) * 2 * Math.PI);
  // The orbit position at release is the hook's start, and the hook ends on the body.
  const p = new Vector3(), t = new Vector3();
  ability._pathAt(d, d.tRel - 1e-6, p, t);
  assert.ok(p.distanceTo(d.p0) < 1e-3);
  ability._pathAt(d, d.tEnd, p, t);
  assert.ok(Math.hypot(p.x - 10, p.z - 3) < 1e-6);
  // Release tangent points at the target (target is outside the orbit).
  const toT = new Vector3(10 - d.p0.x, 0, 3 - d.p0.z).normalize();
  const tan = new Vector3().subVectors(d.p1, d.p0).setY(0).normalize();
  assert.ok(tan.dot(toT) > 0.97, `tangent aims at target (${tan.dot(toT)})`);
  // Live sliders re-route the flying volley.
  const before = d.tRel;
  settings[ID].orbitSpeed *= 2;
  ability.update(1 / 60);
  assert.ok(d.tRel < before);
  ability.destroy(); ability.dispose();
  reset();
});

test('pooled reuse resets every record; dispose frees each resource once', () => {
  reset();
  const { ability, hits, bodies } = setup();
  ability.spawn(new Vector3(), new Vector3(1, 0, 0), 10);
  run(ability, 12);
  assert.equal(hits.length, 4);
  ability.destroy();
  for (const b of bodies) b.alive = true;
  ability.spawn(new Vector3(), new Vector3(1, 0, 0), 10);
  assert.ok(ability._darts.every((d) => !d.captured && !d.released && !d.hit && !d.hasTarget));
  assert.equal(ability.hits, 0);
  run(ability, 12);
  assert.equal(hits.length, 8);
  let n = 0;
  for (const r of ability.resources) r.addEventListener('dispose', () => n++);
  ability.destroy();
  ability.dispose();
  ability.dispose();
  assert.equal(n, ability.resources.length);
});

test('no throw without combat binding, dummies, particles or decals; geometry finite', () => {
  reset();
  const ability = new Ability({ lights });
  ability.spawn(new Vector3(), new Vector3(0, 0, 1), 8);
  run(ability, 12);
  assert.equal(ability.isFinished, true);
  assert.equal(ability.hits, 0);
  const pos = ability.vaneGeo.attributes.position;
  for (let i = 0; i < pos.array.length; i++) assert.ok(Number.isFinite(pos.array[i]));
  const tr = ability.trailGeo.attributes.position.array;
  for (let i = 0; i < tr.length; i++) assert.ok(Number.isFinite(tr[i]));
  ability.destroy(); ability.dispose();
});

test('hits route through the attributed UCSM combat bridge', async () => {
  reset();
  const { CombatStateManager } = await import('../../packs/sandbox/src/combat/ucsm/CombatStateManager.js');
  const { ExpansionCombatAdapter } = await import('../../packs/sandbox/src/combat/ucsm/ExpansionCombatAdapter.js');
  const manager = new CombatStateManager();
  manager.upsertEntity({ id: 'caster', teamId: 'player', health: 5 });
  manager.upsertEntity({ id: 'enemy', teamId: 'enemy', position: [10, 0, 2], health: 5 });
  manager.upsertEntity({ id: 'ally', teamId: 'player', position: [10, 0, 1], health: 5 });
  manager.upsertEntity({ id: 'outside', teamId: 'enemy', position: [25, 0, 0], health: 5 });
  const bridge = new ExpansionCombatAdapter(manager);
  const ability = new Ability({ lights, expansionCombat: bridge });
  const seen = [];
  const sub = bridge.bind('matrix-expansion/test-observer').on('hit', (e) => seen.push(e));
  ability.spawn(new Vector3(), new Vector3(1, 0, 0), 10);
  for (let i = 0; i < 600 && !ability.isFinished; i++) { ability.update(1 / 60); if (i % 2) manager.advance(); }
  manager.advance();
  assert.equal(manager.entities.get('enemy').health, 4);
  assert.equal(manager.entities.get('ally').health, 5);
  assert.equal(manager.entities.get('outside').health, 5);
  assert.equal(seen.length, 1);
  assert.equal(seen[0].abilityUid, 'matrix-expansion/trajectory-hijack');
  assert.equal(seen[0].element, 'motion');
  sub.unsubscribe(); ability.destroy(); ability.dispose(); bridge.dispose();
});

test('editor exposes every settings key', () => {
  reset();
  const added = new Set();
  const folder = () => ({
    addFolder: () => folder(),
    add(c, k) { added.add(k); return { name() { return this; } }; },
    addColor(c, k) { added.add(k); return { name() { return this; } }; },
  });
  buildEditor(folder(), settings[ID], null);
  for (const key of Object.keys(config.settings)) assert.ok(added.has(key), `missing ${key}`);
});
