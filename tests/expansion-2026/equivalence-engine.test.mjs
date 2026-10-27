import test from 'node:test';
import assert from 'node:assert/strict';
import { Vector3 } from 'three';
import { settings } from '../../packs/sandbox/src/config/settings.js';
import config from '../../packs/sandbox/src/abilities/expansion-2026/equivalence-engine/config.js';
import {
  Ability,
  ID,
  MAX_TIPS,
  enginePose,
  slamTilt,
  weightRadius,
} from '../../packs/sandbox/src/abilities/expansion-2026/equivalence-engine/index.js';
import { WEIGHT_BOTTOM } from '../../packs/sandbox/src/abilities/expansion-2026/equivalence-engine/geometry.js';

settings[ID] = structuredClone(config.settings);
const c = () => settings[ID];
const lights = { acquire: () => ({}), release: () => {}, set: () => {} };

// Cast from the origin along +x, 10 m: the engine stands at (10, 0, 0) and its
// beam rests along the cast's lateral (side = direction × up = (0,0,1)), so
// A's end (local −x) points to world −z on the first slam and B's end, after
// one turn of the beam, toward +z on the second.
const setup = (extra = {}) => {
  const hits = [];
  const dummy = (name, x, z) => ({
    name, alive: true, position: new Vector3(x, 0, z),
    kill(dx, dz, force) { hits.push({ name, dx, dz, ...force }); this.alive = false; return true; },
  });
  const bodies = [dummy('northA', 10, 2), dummy('southB', 10, -2), dummy('far', 30, 0)];
  const ability = new Ability({
    lights,
    dummies: {
      findTargets(x, z, r, out) {
        out.length = 0;
        for (const b of bodies) if (b.alive && Math.hypot(b.position.x - x, b.position.z - z) <= r) out.push(b);
        return out;
      },
    },
    ...extra,
  });
  return { ability, hits, bodies };
};
const run = (ability, frames) => { for (let i = 0; i < frames; i++) ability.update(1 / 60); };

test('masses are inversely linked: mA + mB = 1 at every moment, and the pose is continuous across the impact', () => {
  const tiltMax = slamTilt(c());
  const out = {};
  let prev = null;
  for (let i = 0; i <= 200; i++) {
    const u = i / 200;
    enginePose(c(), -1, u, 0.7, tiltMax, out);
    assert.ok(out.massA >= 0 && out.massA <= 1);
    prev = { ...out };
  }
  assert.ok(Math.abs(prev.tilt - tiltMax) < 1e-9, 'flight ends with A slammed down');
  enginePose(c(), 0, 1, 0.7, tiltMax, out);
  assert.ok(Math.abs(out.tilt - prev.tilt) < 1e-9 && Math.abs(out.massA - prev.massA) < 1e-9);
  for (let t = 0; t < 3; t += 0.01) {
    enginePose(c(), t, 1, 0.7, tiltMax, out);
    assert.ok(out.massA >= -1e-9 && out.massA <= 1 + 1e-9);
  }
  // Just before slam 1 the beam has swung B down, all mass on B.
  enginePose(c(), 0.7 - 1e-6, 1, 0.7, tiltMax, out);
  assert.ok(out.tilt < -tiltMax * 0.99 && out.massA < 1e-3);
});

test('the slam tilt is derived: the heavy weight\'s point lands exactly on the floor at any radius', () => {
  const s = c();
  for (const zone of [2.5, 3.8, 6]) {
    const saved = s.zoneRadius;
    s.zoneRadius = zone;
    const t = slamTilt(s);
    const bottom = s.pivotHeight - s.zoneRadius * s.armReach * Math.sin(t) - weightRadius(s, 1) * WEIGHT_BOTTOM;
    assert.ok(Math.abs(bottom) < 1e-9, `zone ${zone}: point at ${bottom}`);
    s.zoneRadius = saved;
  }
});

test('signature rule: each slam strikes only the heavy half, alternating A then B, each body once', () => {
  const { ability, hits } = setup();
  ability.spawn(new Vector3(), new Vector3(1, 0, 0), 10);
  // Flight: nothing struck before the pair docks.
  let impactFrame = -1;
  for (let i = 0; i < 120 && ability.phase === 'travel'; i++) { ability.update(1 / 60); impactFrame = i; }
  assert.equal(ability.phase, 'impact');
  // Slam 0 lands on the impact frame: A heavy — exactly one side struck.
  assert.equal(ability.slams.length, 1);
  assert.equal(ability.slams[0].heavy, 'A');
  assert.equal(hits.length, 1);
  const firstSide = hits[0].name;
  // Thrown away from the strike point, i.e. outward on its own side.
  const dir = ability.heavyDirection(0, new Vector3());
  assert.ok(hits[0].dx * dir.x + hits[0].dz * dir.z > 0);
  run(ability, 400);
  assert.equal(ability.slams.length, config.settings.tips);
  assert.deepEqual(ability.slams.map((s) => s.heavy), ['A', 'B', 'A']);
  // The turned beam's second slam reaches the other body; nothing outside the circle.
  assert.equal(hits.length, 2);
  assert.notEqual(hits[1].name, firstSide);
  assert.ok(!hits.some((h) => h.name === 'far'));
  assert.equal(hits[0].impulse, config.settings.hitImpulse * settings.global.explosionIntensity);
  assert.ok(impactFrame > 0);
});

test('spawn → completion; pooled reuse resets slams, mass and visibility', () => {
  const { ability, hits, bodies } = setup();
  ability.spawn(new Vector3(), new Vector3(1, 0, 0), 10);
  run(ability, 600);
  assert.equal(ability.isFinished, true);
  assert.ok(hits.length <= MAX_TIPS * 8);
  ability.destroy();
  assert.equal(ability.root.visible, false);
  for (const b of bodies) b.alive = true;
  ability.spawn(new Vector3(), new Vector3(1, 0, 0), 10);
  assert.equal(ability.slams.length, 0);
  assert.equal(ability._tipsFired, 0);
  assert.ok(Math.abs(ability._pose.massA - 0.5) < 1e-9);
  run(ability, 600);
  assert.equal(ability.slams.length, config.settings.tips);
  assert.equal(hits.length, 4);
  ability.destroy();
  ability.dispose();
});

test('slam count and timing follow the live settings and are bounded', () => {
  const s = c();
  const saved = s.tips;
  s.tips = 99;
  const { ability } = setup();
  ability.spawn(new Vector3(), new Vector3(1, 0, 0), 10);
  run(ability, 1200);
  assert.equal(ability.slams.length, MAX_TIPS);
  s.tips = saved;
  ability.destroy(); ability.dispose();
});

test('no throw without combat binding, dummies, particles or decals; geometry finite; dispose once', () => {
  const ability = new Ability({ lights });
  ability.spawn(new Vector3(), new Vector3(0, 0, 1), 12);
  run(ability, 600);
  assert.equal(ability.isFinished, true);
  ability.destroy();
  ability.root.traverse((o) => {
    if (!o.isMesh) return;
    const p = o.geometry.attributes.position;
    for (let i = 0; i < p.count; i++) assert.ok(Number.isFinite(p.getX(i) + p.getY(i) + p.getZ(i)));
  });
  let count = 0;
  for (const r of ability.resources) r.addEventListener('dispose', () => count++);
  ability.dispose();
  ability.dispose();
  assert.equal(count, ability.resources.length);
});

test('slams route through the attributed combat bridge and spare the light half', async () => {
  const { CombatStateManager } = await import('../../packs/sandbox/src/combat/ucsm/CombatStateManager.js');
  const { ExpansionCombatAdapter } = await import('../../packs/sandbox/src/combat/ucsm/ExpansionCombatAdapter.js');
  const manager = new CombatStateManager();
  manager.upsertEntity({ id: 'caster', teamId: 'player', health: 5 });
  manager.upsertEntity({ id: 'onA', teamId: 'enemy', position: [10, 0, 2], health: 5 });
  manager.upsertEntity({ id: 'outside', teamId: 'enemy', position: [25, 0, 0], health: 5 });
  manager.upsertEntity({ id: 'ally', teamId: 'player', position: [10, 0, 2], health: 5 });
  const bridge = new ExpansionCombatAdapter(manager);
  const seen = [];
  const sub = bridge.bind('matrix-expansion/test-observer').on('hit', (e) => seen.push(e));
  const ability = new Ability({ lights, expansionCombat: bridge });
  ability.spawn(new Vector3(), new Vector3(1, 0, 0), 10);
  for (let i = 0; i < 600; i++) { ability.update(1 / 60); if (i % 2) manager.advance(); }
  manager.advance();
  assert.ok(seen.length >= 1);
  assert.ok(seen.every((e) => e.abilityUid === 'matrix-expansion/equivalence-engine' && e.element === 'gravity'));
  assert.ok(seen.every((e) => e.targetIds.length === 1 && e.targetIds[0] === 'onA'));
  // A slams A's half twice (slams 0 and 2) — but slam 2's beam has turned, so
  // only bodies still in the heavy half are struck again.
  assert.ok(manager.entities.get('onA').health < 5);
  assert.equal(manager.entities.get('outside').health, 5);
  assert.equal(manager.entities.get('ally').health, 5);
  sub.unsubscribe(); ability.destroy(); ability.dispose(); bridge.dispose();
});
