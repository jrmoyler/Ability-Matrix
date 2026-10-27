import test from 'node:test';
import assert from 'node:assert/strict';
import { Vector3 } from 'three';
import { settings } from '../../packs/sandbox/src/config/settings.js';
import config from '../../packs/sandbox/src/abilities/expansion-2026/refraction-tribunal/config.js';
import {
  Ability,
  ID,
  MAX_LEGS,
  buildEditor,
} from '../../packs/sandbox/src/abilities/expansion-2026/refraction-tribunal/index.js';

settings[ID] = structuredClone(config.settings);
const reset = () => { settings[ID] = structuredClone(config.settings); };
const lights = { acquire: () => ({}), release: () => {}, set: () => {} };
const STEP = 1 / 60;

/** Dummies at court-relative offsets; the cast aims 12 m down +X, so the court centre is (12, 0, 0). */
const dummyAt = (x, z, log) => ({
  alive: true,
  position: new Vector3(x, 0, z),
  kill(dx, dz, force) {
    if (!this.alive) return false;
    this.alive = false;
    log.push({ who: this, dx, dz, ...force });
    return true;
  },
});
const setup = (positions) => {
  const log = [];
  const bodies = positions.map(([x, z]) => dummyAt(x, z, log));
  const far = { alive: true, position: new Vector3(99, 0, 0), kill: () => { throw Error('outside the court'); } };
  const ctx = {
    lights,
    dummies: {
      findTargets(x, z, r, out) {
        out.length = 0;
        for (const b of [...bodies, far]) if (b.alive) out.push(b);
        out.sort((a, b) => Math.hypot(a.position.x - x, a.position.z - z) - Math.hypot(b.position.x - x, b.position.z - z));
        return out;
      },
    },
  };
  return { ability: new Ability(ctx), log, bodies };
};
const cast = (ability) => ability.spawn(new Vector3(), new Vector3(1, 0, 0), 12);
const runToEnd = (ability, limit = 600) => {
  let frames = 0;
  while (!ability.isFinished && frames++ < limit) ability.update(STEP);
  return frames;
};

test('config is data only with a full commented-size settings block and the required keys', () => {
  const keys = Object.keys(config.settings);
  assert.ok(keys.length >= 60 && keys.length <= 150, `settings keys: ${keys.length}`);
  for (const k of ['range', 'minRange', 'speed', 'cooldown', 'castAnim', 'lightColor', 'lightIntensity', 'lightRadius', 'lifetime', 'zoneRadius'])
    assert.ok(k in config.settings, k);
  assert.equal(config.meta.element, 'crystal');
  assert.equal(config.meta.cast, 'zone');
  assert.equal(ID, 'refractionTribunal');
});

test('spawn, update to completion: three refracted legs each strike a different enemy, then the verdict', () => {
  reset();
  // Three enemies spread round the court and one in its middle.
  const { ability, log, bodies } = setup([[13.5, 1.5], [11, -2], [10.8, 2], [12.1, 0.2]]);
  cast(ability);
  // Anticipation: the witness is held in the hand, nothing struck.
  for (let i = 0; i < 10; i++) ability.update(STEP);
  assert.equal(ability.u, 0, 'the witness is still condensing in the hand');
  assert.equal(log.length, 0);
  const frames = runToEnd(ability);
  assert.ok(ability.isFinished, `finished in ${frames} frames`);
  // Every body in the court struck exactly once, none twice, the far one never.
  assert.equal(log.length, 4);
  assert.equal(new Set(log.map((h) => h.who)).size, 4);
  assert.ok(bodies.every((b) => !b.alive));
  assert.equal(log[0].impulse, config.settings.hitImpulse);
  // Screen time within the standard's 1.5–4.5 s.
  const seconds = frames * STEP;
  assert.ok(seconds > 1.5 && seconds < 4.5, `screen time ${seconds.toFixed(2)} s`);
  ability.destroy();
  ability.dispose();
});

test('the signature rule: each leg bends onto the nearest unjudged enemy from its judge, knocked along the beam', () => {
  reset();
  // Two enemies; three legs. Third leg has no one left and runs straight.
  const { ability, log, bodies } = setup([[11.2, 1.8], [12.6, -2.2]]);
  cast(ability);
  const legStarts = [];
  for (let f = 0; f < 600 && !ability.isFinished; f++) {
    ability.update(STEP);
    for (let i = 0; i < MAX_LEGS; i++) if (ability.legs[i].started && legStarts.length === i) legStarts.push(ability.legs[i]);
  }
  assert.equal(legStarts.length, config.settings.refractions);
  const [l0, l1, l2] = legStarts;
  // Judge 0 faces the caster (west of the centre): its nearest enemy is chosen first.
  const seat0 = ability._seat(0, new Vector3());
  const d = (b) => Math.hypot(b.position.x - seat0.x, b.position.z - seat0.z);
  const nearest = d(bodies[0]) < d(bodies[1]) ? bodies[0] : bodies[1];
  assert.equal(l0.ref, nearest);
  assert.notEqual(l1.ref, l0.ref);
  assert.equal(l2.hasTarget, false, 'nobody left: the third leg runs straight to the next judge');
  assert.deepEqual(legStarts.map((l) => l.judge), [0, 1, 2]);
  assert.equal(log.length, 2);
  // Knocked along the bent beam: away from the refracting judge.
  assert.ok(log[0].dx * (nearest.position.x - seat0.x) + log[0].dz * (nearest.position.z - seat0.z) > 0);
  ability.destroy();
  ability.dispose();
});

test('hits are bounded: refractions + the verdict cap, never outside the court', () => {
  reset();
  settings[ID].refractions = 99; // clamps to MAX_LEGS
  const ring = [];
  for (let i = 0; i < 20; i++) ring.push([12 + Math.cos(i) * 1.2, Math.sin(i) * 1.2]);
  const { ability, log } = setup(ring);
  cast(ability);
  runToEnd(ability, 1200);
  assert.ok(ability.isFinished);
  assert.ok(log.length <= MAX_LEGS + 8, `${log.length} strikes`);
  assert.ok(log.length >= MAX_LEGS);
  assert.equal(new Set(log.map((h) => h.who)).size, log.length, 'no body struck twice');
  ability.destroy();
  ability.dispose();
  reset();
});

test('placement is derived: judges stand on the court ring and the bow puts their points over the centre', () => {
  reset();
  const { ability } = setup([]);
  cast(ability);
  for (const R of [2.5, 3.8, 6.5]) {
    settings[ID].zoneRadius = R;
    const tip = new Vector3();
    // Mid-hold: fully bowed.
    while (!ability._verdict && !ability.isFinished) ability.update(STEP);
    ability.update(STEP);
    for (let k = 0; k < 3; k++) {
      const seat = ability._seat(k, new Vector3());
      assert.ok(Math.abs(seat.distanceTo(ability.center) - R * config.settings.judgeRing) < 1e-6);
      ability._alongJudge(k, ability._height(), tip);
      const off = Math.hypot(tip.x - ability.center.x, tip.z - ability.center.z);
      // bowAmount 0.94 leaves a narrow gap: within 12 % of the ring, plus sway.
      assert.ok(off < R * config.settings.judgeRing * 0.12 + 0.2, `R=${R} tip off centre by ${off.toFixed(2)} m`);
    }
  }
  ability.destroy();
  ability.dispose();
  reset();
});

test('pooled reuse resets every record and the second cast strikes again', () => {
  reset();
  const { ability, log, bodies } = setup([[12.4, 0.6]]);
  cast(ability);
  runToEnd(ability);
  assert.equal(log.length, 1);
  ability.destroy();
  assert.equal(ability.root.visible, false);
  assert.equal(ability.struckCount, 0);
  bodies[0].alive = true;
  cast(ability);
  assert.equal(ability._arrived, false);
  assert.equal(ability._verdict, false);
  assert.equal(ability._legIndex, 0);
  assert.ok(ability.legs.every((l) => !l.started && l.ref === null && !l.struck));
  assert.ok(ability.beams.every((b) => !b.mesh.visible));
  runToEnd(ability);
  assert.equal(log.length, 2);
  ability.destroy();
  ability.dispose();
});

test('no throw with the combat binding and every optional system absent', () => {
  reset();
  const ability = new Ability({ lights });
  cast(ability);
  assert.doesNotThrow(() => runToEnd(ability));
  assert.ok(ability.isFinished);
  assert.equal(ability.hits, 0);
  ability.destroy();
  ability.dispose();
  ability.dispose();
});

test('geometry is finite, resources dispose exactly once, and the editor exposes every key', () => {
  reset();
  const { ability } = setup([]);
  let meshes = 0;
  ability.root.traverse((o) => {
    if (!o.isMesh) return;
    meshes++;
    const p = o.geometry.attributes.position;
    for (let i = 0; i < p.count; i++) assert.ok(Number.isFinite(p.getX(i) + p.getY(i) + p.getZ(i)));
  });
  assert.ok(meshes >= 10);
  // Editor shim: record every key bound.
  const bound = new Set();
  const folder = () => ({
    addFolder: () => folder(),
    add: (c, k) => { bound.add(k); return { name: () => {} }; },
    addColor: (c, k) => { bound.add(k); return { name: () => {} }; },
  });
  buildEditor(folder(), settings[ID], null);
  for (const k of Object.keys(config.settings)) assert.ok(bound.has(k), `editor misses ${k}`);
  let count = 0;
  for (const r of ability.resources) r.addEventListener('dispose', () => count++);
  ability.dispose();
  ability.dispose();
  assert.equal(count, ability.resources.length);
});

test('UCSM: legs and verdict damage enemies through the attributed binding, never allies', async () => {
  reset();
  const { CombatStateManager } = await import('../../packs/sandbox/src/combat/ucsm/CombatStateManager.js');
  const { ExpansionCombatAdapter } = await import('../../packs/sandbox/src/combat/ucsm/ExpansionCombatAdapter.js');
  const manager = new CombatStateManager();
  manager.upsertEntity({ id: 'caster', teamId: 'player', health: 5 });
  manager.upsertEntity({ id: 'e1', teamId: 'enemy', position: [10.5, 0, 1.5], health: 5 });
  manager.upsertEntity({ id: 'e2', teamId: 'enemy', position: [13, 0, -1.5], health: 5 });
  manager.upsertEntity({ id: 'ally', teamId: 'player', position: [12, 0, 0.5], health: 5 });
  manager.upsertEntity({ id: 'outside', teamId: 'enemy', position: [24, 0, 0], health: 5 });
  const bridge = new ExpansionCombatAdapter(manager);
  const ability = new Ability({ lights, expansionCombat: bridge });
  const seen = [];
  const sub = bridge.bind('matrix-expansion/test-observer').on('hit', (e) => seen.push(e));
  cast(ability);
  for (let i = 0; i < 600 && !ability.isFinished; i++) {
    ability.update(STEP);
    if (i % 2) manager.advance();
  }
  for (let i = 0; i < 4; i++) manager.advance();
  assert.equal(ability.failure, null);
  assert.equal(manager.entities.get('e1').health, 4);
  assert.equal(manager.entities.get('e2').health, 4);
  assert.equal(manager.entities.get('ally').health, 5);
  assert.equal(manager.entities.get('outside').health, 5);
  assert.equal(seen.length, 2);
  assert.ok(seen.every((e) => e.abilityUid === 'matrix-expansion/refraction-tribunal' && e.element === 'crystal'));
  sub.unsubscribe();
  ability.destroy();
  ability.dispose();
  bridge.dispose();
});
