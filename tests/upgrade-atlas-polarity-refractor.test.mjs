import test from 'node:test';
import assert from 'node:assert/strict';
import { Vector3 } from 'three';
import { settings } from '../packs/sandbox/src/config/settings.js';
import polarityConfig from '../packs/sandbox/src/config/atlas/polarity.js';
import refractorConfig from '../packs/sandbox/src/config/atlas/refractor.js';
import { PolarityGardenAbility, ID as POLARITY } from '../packs/sandbox/src/abilities/atlas/PolarityGardenAbility.js';
import { PrismRefractorAbility, ID as REFRACTOR } from '../packs/sandbox/src/abilities/atlas/PrismRefractorAbility.js';

settings[POLARITY] ??= structuredClone(polarityConfig.settings);
settings[REFRACTOR] ??= structuredClone(refractorConfig.settings);

function uniformBag() {
  return new Proxy({}, {
    get(target, key) {
      if (!(key in target)) target[key] = { value: key === 'uGravity' ? new Vector3() : 0 };
      return target[key];
    },
  });
}

/** Seven bodies in a cluster round 9–11 m down +z, like the capture tool. */
function makeField() {
  const bodies = [];
  const spots = [[0, 9], [1.4, 9.6], [-1.4, 9.5], [0.6, 11], [-0.8, 11.2], [2.6, 10.6], [-2.7, 10.4]];
  for (const [x, z] of spots) {
    bodies.push({
      alive: true,
      position: new Vector3(x, 0, z),
      kills: 0,
      kill() { if (!this.alive) return false; this.alive = false; this.kills++; return true; },
    });
  }
  const near = (x, z, r, out) => {
    out.length = 0;
    for (const b of bodies) if (b.alive && Math.hypot(b.position.x - x, b.position.z - z) <= r) out.push(b);
    out.sort((a, b) => Math.hypot(a.position.x - x, a.position.z - z) - Math.hypot(b.position.x - x, b.position.z - z));
    return out;
  };
  return { bodies, field: { findTargets: near, findBodies: near } };
}

function makeCtx(field) {
  const systems = new Map();
  return {
    particles: {
      get(name) {
        if (!systems.has(name)) systems.set(name, { uniforms: uniformBag(), setGradient() {}, emit() {} });
        return systems.get(name);
      },
    },
    decals: { spawn() {} },
    bursts: { spawn() {} },
    shake: { add() {}, rumble() {} },
    flash: { trigger() {} },
    lights: { acquire: () => ({}), release() {}, set() {} },
    camera: { position: new Vector3(0, 6, -8) },
    dummies: field,
  };
}

function run(ability, seconds, each) {
  for (let t = 0; t < seconds; t += 1 / 30) {
    ability.update(1 / 30);
    each?.();
  }
}

test('polarity: pylons read at 8 m, flux pillars stand over every pole, the cascade lands in the capture window', () => {
  const c = settings.polarity;
  assert.ok(c.mineSize >= 0.8, 'the capsule is a knee-high pylon, not a speck');
  const { bodies, field } = makeField();
  const ability = new PolarityGardenAbility(makeCtx(field));
  ability.spawn(new Vector3(0, 0, 0), new Vector3(0, 0, 1), 10);

  let maxPillars = 0;
  let firstDet = Infinity;
  run(ability, 3.0, () => {
    maxPillars = Math.max(maxPillars, ability.pillarGeometry.instanceCount);
    if (firstDet === Infinity && ability._mines.some((m) => m.detonated)) firstDet = ability.age;
  });
  const total = Math.round(c.mineCount) + (c.centreMine > 0.5 ? 1 : 0);
  assert.equal(maxPillars, total, 'one flux pillar per planted capsule');
  assert.ok(firstDet < 2.33, `the first detonation lands before 2.33 s (${firstDet.toFixed(2)})`);
  assert.ok(bodies.some((b) => !b.alive), 'the cascade still throws bodies');
  for (const b of bodies) assert.ok(b.kills <= 1, 'killed once');

  run(ability, 6);
  ability.destroy?.();
  assert.equal(ability.pillars.visible, false, 'pillars hidden on destroy');
  ability.spawn(new Vector3(0, 0, 0), new Vector3(1, 0, 0), 10);
  run(ability, 0.05);
  assert.equal(ability.pillarGeometry.instanceCount, 0, 'spawn resets the pillars');
  ability.dispose();
});

test('refractor: the lance is in flight with a visible path, the prism is hero-sized, floor layers stay', () => {
  const c = settings.refractor;
  assert.ok(c.prismHeight + 2 * c.prismCap >= 3.5, 'prism stands taller than a body');
  const { bodies, field } = makeField();
  const ability = new PrismRefractorAbility(makeCtx(field));
  ability.spawn(new Vector3(0, 0, 0), new Vector3(0, 0, 1), 9.5);

  // Frame 20 of the capture (0.67 s): the lance is still flying, the path drawn.
  run(ability, 0.67);
  assert.ok(ability.lance.visible, 'lance in flight at 0.67 s');
  assert.ok(ability.path.visible && ability.scar.visible, 'path and floor scar drawn during the flight');

  // After the strike: the pool lies under the prism, the scar stays.
  let poolSeen = false;
  let scarAfterStrike = false;
  run(ability, 1.6, () => {
    if (ability.pool.visible) poolSeen = true;
    if (ability._stage >= 2 && ability.scar.visible) scarAfterStrike = true;
  });
  assert.ok(poolSeen, 'caustic pool under the prism');
  assert.ok(scarAfterStrike, 'the floor scar outlives the strike');
  assert.ok(bodies.some((b) => !b.alive), 'beams still kill');
  for (const b of bodies) assert.ok(b.kills <= 1, 'killed once');

  run(ability, 6);
  ability.destroy?.();
  assert.equal(ability.path.visible || ability.scar.visible || ability.pool.visible, false, 'hidden on destroy');
  ability.dispose();
});
