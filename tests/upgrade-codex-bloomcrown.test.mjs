import test from 'node:test';
import assert from 'node:assert/strict';
import { Vector3 } from 'three';
import { settings } from '../packs/sandbox/src/config/settings.js';
import { BloomCrownAbility, buildEditor } from '../packs/sandbox/src/abilities/codex/BloomCrownAbility.js';
import bloomcrown from '../packs/sandbox/src/config/codex/bloomcrown.js';

settings.bloomcrown ??= structuredClone(bloomcrown.settings);

const box = () => ({ value: { set() {}, copy() {} } });
function mockParticles(counter) {
  return {
    get() {
      const uniforms = new Proxy({}, { get: (t, k) => (t[k] ??= box()) });
      return { uniforms, setGradient() {}, emit: (n) => (counter.emits += n) };
    }
  };
}

function arena(bodies = []) {
  const counter = { emits: 0, decals: 0, bursts: 0 };
  const ctx = {
    particles: mockParticles(counter),
    lights: { acquire: () => ({}), set() {}, release() {} },
    decals: { spawn: () => counter.decals++ },
    bursts: { spawn: () => counter.bursts++ },
    shake: { add() {}, rumble() {} },
    flash: { trigger() {} },
    dummies: {
      findTargets(x, z, r, out) {
        out.length = 0;
        for (const b of bodies) if (b.alive && Math.hypot(b.position.x - x, b.position.z - z) <= r) out.push(b);
        return out;
      }
    }
  };
  return { a: new BloomCrownAbility(ctx), counter };
}

function body(x, z) {
  return {
    alive: true,
    position: new Vector3(x, 0, z),
    kills: 0,
    kill() {
      if (!this.alive) return false;
      this.alive = false;
      this.kills++;
      return true;
    }
  };
}

test('bloomcrown: crown descends, slams inside 2.4 s, garden grows from the floor and lingers, the cast ends', () => {
  const bodies = [body(0, 13), body(1.5, 13.5), body(-2, 12), body(9, 13)];
  const { a, counter } = arena(bodies);
  a.spawn(new Vector3(), new Vector3(0, 0, 1), 13.2);
  let frames = 0;
  let slamAt = -1;
  let maxRingY = 0;
  let ringYAtGather = Infinity;
  let gardenFrames = 0;
  let maxGarden = 0;
  let groundAfterSlam = 0;
  let maxEmit = 0;
  while (a.isActive && frames < 600) {
    const before = counter.emits;
    a.update(1 / 30);
    maxEmit = Math.max(maxEmit, counter.emits - before);
    frames++;
    if (a._clock >= 0 && !a._slammed) {
      maxRingY = Math.max(maxRingY, a._ringY);
      if (a._gather > 0 && a._gather < 0.05) ringYAtGather = Math.min(ringYAtGather, a._ringY);
    }
    if (a._slammed && slamAt < 0) slamAt = frames / 30;
    if (a.garden.visible) {
      gardenFrames++;
      maxGarden = Math.max(maxGarden, a.garden.count);
    }
    if (a._slammed && a.ground.visible) groundAfterSlam++;
  }
  const seconds = frames / 30;
  assert.ok(frames < 600);
  assert.ok(seconds > 1.5 && seconds < 4.8, `screen time ${seconds}`);
  assert.ok(slamAt > 1.2 && slamAt < 2.4, `slam at ${slamAt}`);
  const c = settings.bloomcrown;
  assert.ok(maxRingY <= c.crownHeight + 1e-6, 'crown no higher than its setting');
  assert.ok(ringYAtGather < c.crownHeight - 0.3, `crown sank before gathering (${ringYAtGather})`);
  assert.ok(gardenFrames / 30 > 1.0, `garden lingers ${gardenFrames / 30}s`);
  const np = Math.round(c.petalsPerWhorl);
  assert.equal(maxGarden, Math.round(c.gardenCount) * np * 2);
  assert.ok(groundAfterSlam > 30, 'ground field stays after the slam');
  assert.equal(bodies.slice(0, 3).reduce((n, b) => n + b.kills, 0), 3, 'bodies under the crown are thrown');
  assert.equal(bodies[3].kills, 0, 'outside the circle untouched');
  assert.ok(counter.decals >= 3 && counter.bursts >= 1);
  assert.ok(maxEmit < 2000);
  a.destroy();
  assert.ok(!a.garden.visible && !a.ground.visible && !a.petals.visible);
});

test('bloomcrown: reuse resets, editor exposes every key, dispose frees', () => {
  const { a } = arena();
  a.spawn(new Vector3(), new Vector3(0, 0, 1), 10);
  for (let i = 0; i < 90; i++) a.update(1 / 30);
  a.destroy();
  a.spawn(new Vector3(), new Vector3(0, 0, 1), 10);
  assert.equal(a._slammed, false);
  assert.equal(a.garden.count, 0);
  assert.equal(a.garden.visible, false);

  const keys = new Set();
  const folder = () => ({
    addFolder: () => folder(),
    add: (_c, k) => (keys.add(k), { name: () => ({}) }),
    addColor: (_c, k) => (keys.add(k), { name: () => ({}) }),
    close() {}
  });
  const Editor = {
    range: (_f, _c, k) => keys.add(k),
    castAnimation: () => keys.add('castAnim'),
    gradient: (_f, _c, prefix) => ['A', 'B', 'C', 'D'].forEach((s) => keys.add(prefix + s))
  };
  buildEditor(folder(), settings.bloomcrown, Editor);
  for (const k of Object.keys(bloomcrown.settings)) assert.ok(keys.has(k), `editor exposes ${k}`);

  let disposed = 0;
  for (const r of [a.groundMaterial, a.gardenHeartMaterial, a.gardenGeometry]) r.addEventListener('dispose', () => disposed++);
  a.destroy();
  a.dispose();
  assert.equal(disposed, 3);
});
