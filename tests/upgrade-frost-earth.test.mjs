import test from 'node:test';
import assert from 'node:assert/strict';
import { Vector3 } from 'three';
import { settings } from '../packs/sandbox/src/config/settings.js';
import { ObsidianWallAbility } from '../packs/sandbox/src/abilities/matrix-new/ObsidianWallAbility.js';
import { DuneScourgeAbility } from '../packs/sandbox/src/abilities/collective/DuneScourgeAbility.js';
import {
  AbsoluteZeroThreadAbility,
  CONFIG as AZT,
  ID as AZT_ID
} from '../packs/sandbox/src/abilities/expansion-2026/frost/AbsoluteZeroThread.js';
import obsidianConfig from '../packs/sandbox/src/config/matrix-new/obsidianwall.js';
import duneConfig from '../packs/sandbox/src/config/collective/dune.js';

settings.obsidianwall ??= structuredClone(obsidianConfig.settings);
settings.dune ??= structuredClone(duneConfig.settings);
settings[AZT_ID] ??= structuredClone(AZT.settings);

/** A context that records what the cast asks of the engine. */
function mockCtx(bodies = []) {
  const log = { emitted: 0, decals: 0, bursts: 0, kills: 0, flashes: 0 };
  const uniform = () => new Proxy({}, { get: (t, k) => (t[k] ??= { value: k === 'uGravity' ? new Vector3() : 0 }) });
  const system = () => ({
    uniforms: uniform(),
    setGradient() {},
    emit(n) {
      assert.ok(Number.isFinite(n) && n >= 0, 'emit count is finite');
      log.emitted += n;
    }
  });
  const ctx = {
    log,
    lights: { acquire: () => ({}), set() {}, release() {} },
    particles: { get: () => system() },
    decals: { spawn: () => log.decals++ },
    bursts: { spawn: () => log.bursts++ },
    shake: { add() {}, rumble() {} },
    flash: { trigger: () => log.flashes++ },
    dummies: {
      findTargets(x, z, r, out) {
        out.length = 0;
        for (const b of bodies) if (b.alive && Math.hypot(b.position.x - x, b.position.z - z) <= r) out.push(b);
        return out;
      },
      findBodies(x, z, r, out) {
        return this.findTargets(x, z, r, out);
      }
    }
  };
  for (const b of bodies) {
    b.alive = true;
    b.kill = () => {
      if (!b.alive) return false;
      b.alive = false;
      log.kills++;
      return true;
    };
  }
  return ctx;
}

function run(ability, maxSteps = 600, dt = 1 / 30) {
  let steps = 0;
  while (ability.isActive && steps < maxSteps) {
    ability.update(dt);
    steps++;
  }
  return steps;
}

test('obsidian wall: two rows, a crown, a landing beat, shards that hit, and a clean reuse', () => {
  const bodies = [0, 1, 2, 3].map((i) => ({ position: new Vector3(Math.cos(i) * 1.5, 0, 12 + Math.sin(i) * 1.5) }));
  const ctx = mockCtx(bodies);
  const a = new ObsidianWallAbility(ctx);
  a.spawn(new Vector3(), new Vector3(0, 0, 1), 12);
  let maxCount = 0;
  let sawCrown = false;
  let steps = 0;
  while (a.isActive && steps < 600) {
    a.update(1 / 30);
    maxCount = Math.max(maxCount, a.instanceCount);
    if (a._crownN > 0 && a.slabs[a._wallN].erupted) sawCrown = true;
    steps++;
  }
  assert.ok(!a.isActive, 'finishes');
  assert.ok(steps * (1 / 30) < 6, 'screen time is bounded');
  assert.ok(sawCrown, 'the crown erupts');
  assert.ok(maxCount > 20, 'a wall of mass stands');
  assert.ok(ctx.log.flashes >= 2 && ctx.log.bursts >= 1, 'landing + break beats');
  assert.ok(ctx.log.kills >= 1 && ctx.log.kills <= bodies.length, 'hits are bounded');
  // Rows sit either side of the rift and lean outward.
  a.spawn(new Vector3(), new Vector3(0, 0, 1), 12);
  a._layout();
  const foot = new Vector3();
  a._slabFoot(0, foot);
  const left = foot.x;
  a._slabFoot(1, foot);
  assert.ok(Math.sign(left) !== Math.sign(foot.x), 'two rows straddle the line');
  assert.equal(a.instanceCount, 0, 'spawn resets');
  a.destroy();
  a.dispose();
});

test('dune scourge: holds to gather, leaves a walking mound, and resets', () => {
  const ctx = mockCtx([]);
  const a = new DuneScourgeAbility(ctx);
  a.spawn(new Vector3(), new Vector3(0, 0, 1), 12);
  a.update(0.1);
  assert.equal(a.front, 0, 'the front waits out the gather');
  let maxMound = 0;
  let firstFront = -1;
  let lastFront = -1;
  let steps = 0;
  while (a.isActive && steps < 600) {
    a.update(1 / 30);
    if (a._moundHeight > 0.2) {
      if (firstFront < 0) firstFront = a._moundFront;
      lastFront = a._moundFront;
    }
    maxMound = Math.max(maxMound, a._moundHeight);
    steps++;
  }
  assert.ok(!a.isActive);
  assert.ok(maxMound > 0.5, 'a mound piles up');
  assert.ok(lastFront > firstFront + 0.3, 'the mound walks on');
  assert.equal(a.wave.layers.mask, 1 << 4, 'the wave is solid, on LAYER.SHAPED');
  assert.ok(a.wave.castShadow && a.wave.customDepthMaterial, 'and lays a shadow');
  a.spawn(new Vector3(), new Vector3(0, 0, 1), 12);
  assert.equal(a._moundHeight, 0);
  a.destroy();
  a.dispose();
});

test('absolute zero thread: the spine grows behind the needle, clusters at the end, and shatters out', () => {
  const ctx = mockCtx([]);
  const a = new AbsoluteZeroThreadAbility(ctx);
  a.spawn(new Vector3(), new Vector3(0, 0, 1), 12);
  let maxSpine = 0;
  let steps = 0;
  while (a.isActive && steps < 900) {
    a.update(1 / 30);
    maxSpine = Math.max(maxSpine, a.spine.count);
    steps++;
  }
  assert.ok(!a.isActive);
  assert.ok(maxSpine >= settings[AZT_ID].spineCount, 'spine and cluster stand');
  assert.equal(a.spine.count, 0, 'the exit sweep shattered every crystal');
  a.spawn(new Vector3(), new Vector3(0, 0, 1), 12);
  assert.equal(a.spine.count, 0);
  assert.ok(a.crystals.every((k) => !k.gone), 'spawn resets');
  a.destroy();
  a.dispose();
});
