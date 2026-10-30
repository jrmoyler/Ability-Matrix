import test from 'node:test';
import assert from 'node:assert/strict';
import { Vector3 } from 'three';
import { settings } from '../packs/sandbox/src/config/settings.js';
import { MindLatticeAbility, buildEditor as buildMind } from '../packs/sandbox/src/abilities/codex/MindLatticeAbility.js';
import { NebulaCollapseAbility, buildEditor as buildNebula } from '../packs/sandbox/src/abilities/codex/NebulaCollapseAbility.js';
import mindlattice from '../packs/sandbox/src/config/codex/mindlattice.js';
import nebula from '../packs/sandbox/src/config/codex/nebula.js';

settings.mindlattice ??= structuredClone(mindlattice.settings);
settings.nebula ??= structuredClone(nebula.settings);

const box = () => ({ value: { set() {}, copy() {} } });
function mockParticles(counter) {
  return {
    get() {
      const uniforms = new Proxy({}, { get: (t, k) => (t[k] ??= box()) });
      return { uniforms, setGradient() {}, emit: (n) => (counter.emits += n) };
    }
  };
}

function body(x, z) {
  return {
    alive: true,
    finished: false,
    position: new Vector3(x, 0, z),
    kills: 0,
    held: 0,
    carry() {},
    hold() {
      this.held++;
    },
    release() {},
    bodyPoint(out) {
      out.copy(this.position).setY(1);
      return true;
    },
    kill() {
      if (!this.alive) return false;
      this.alive = false;
      this.kills++;
      return true;
    }
  };
}

function arena(Cls, bodies = []) {
  const counter = { emits: 0, decals: 0, bursts: 0 };
  const ctx = {
    particles: mockParticles(counter),
    lights: { acquire: () => ({}), set() {}, release() {} },
    decals: { spawn: () => counter.decals++ },
    bursts: { spawn: () => counter.bursts++ },
    shake: { add() {}, rumble() {} },
    flash: { trigger() {} },
    dummies: {
      findBodies(x, z, r, out) {
        out.length = 0;
        for (const b of bodies) if (Math.hypot(b.position.x - x, b.position.z - z) <= r) out.push(b);
        return out;
      },
      findTargets(x, z, r, out) {
        out.length = 0;
        for (const b of bodies) if (b.alive && Math.hypot(b.position.x - x, b.position.z - z) <= r) out.push(b);
        return out;
      }
    }
  };
  return { a: new Cls(ctx), counter };
}

function editorKeys(build, c) {
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
  build(folder(), c, Editor);
  return keys;
}

/** Hex colour → relative luminance 0..1. */
function lum(hex) {
  const n = parseInt(hex.slice(1), 16);
  return (0.2126 * ((n >> 16) & 255) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255)) / 255;
}

test('mindlattice: a four-stop ramp with a dark deep stop, solid crystal bars, a cage that moves while it holds', () => {
  const c = settings.mindlattice;
  // The ramp descends: core > tint > body > deep, and the deep stop is truly dark.
  assert.ok(lum(c.colorCore) > lum(c.colorSecondary) && lum(c.colorSecondary) > lum(c.colorPrimary) && lum(c.colorPrimary) > lum(c.colorDeep));
  assert.ok(lum(c.colorDeep) < 0.08, 'deep tone is dark');
  const { a, counter } = arena(MindLatticeAbility);
  assert.equal(a.beamMaterial.blending, 1, 'bars are normal-blended, not additive');
  assert.equal(a.beamMaterial.depthWrite, true);
  a.spawn(new Vector3(), new Vector3(0, 0, 1), 8);
  let frames = 0;
  let maxEmit = 0;
  const twists = [];
  while (a.isActive && frames < 900) {
    const before = counter.emits;
    a.update(1 / 30);
    maxEmit = Math.max(maxEmit, counter.emits - before);
    if (a._locked && a.phase !== 'fade') twists.push(a._cageSpin + a._twistPh);
    frames++;
  }
  assert.ok(frames < 900);
  const seconds = frames / 30;
  assert.ok(seconds > 1.5 && seconds < 5, `screen time ${seconds}`);
  assert.ok(twists.length > 5 && twists[twists.length - 1] > twists[0], 'cage turns / twists while it holds');
  assert.ok(maxEmit < 2000);
  a.destroy();
  assert.equal(a.beams.visible, false);
  a.spawn(new Vector3(), new Vector3(0, 0, 1), 8);
  assert.equal(a._cageSpin, 0);
  assert.equal(a._lockClock, -1);
  const keys = editorKeys(buildMind, c);
  for (const k of Object.keys(mindlattice.settings)) assert.ok(keys.has(k), `editor exposes ${k}`);
  a.destroy();
  a.dispose();
});

test('nebula: cloud height and radius derive from the circle, dark lanes and a gravity well, hits bounded', () => {
  const c = settings.nebula;
  const bodies = [body(0.5, 8), body(-1, 9), body(1.2, 7.4)];
  const { a, counter } = arena(NebulaCollapseAbility, bodies);
  const saved = c.zoneRadius;
  c.zoneRadius = 4;
  const y4 = a._cloudY(c);
  c.zoneRadius = 6;
  assert.ok(a._cloudY(c) > y4 && a._cloudR(c) > 0, 'derived from zoneRadius');
  c.zoneRadius = saved;
  // Top of the cloud stays within an 8 m frame at the default circle.
  assert.ok(a._cloudY(c) + c.cloudThickness + c.puffSize * 0.5 < 5, 'cloud top reads in frame');
  assert.ok(lum(c.colorDeep) < 0.06, 'deep tone is dark');
  assert.equal(a.laneMaterial.blending, 1, 'dust lanes are normal-blended');

  a.spawn(new Vector3(), new Vector3(0, 0, 1), 8);
  let frames = 0;
  let sawWell = false;
  let sawLanes = false;
  let maxEmit = 0;
  while (a.isActive && frames < 1200) {
    const before = counter.emits;
    a.update(1 / 30);
    maxEmit = Math.max(maxEmit, counter.emits - before);
    if (a.well.visible) sawWell = true;
    if (a.lanes.visible) sawLanes = true;
    frames++;
  }
  assert.ok(frames < 1200);
  assert.ok(sawWell && sawLanes);
  assert.ok(maxEmit < 3000);
  for (const b of bodies) assert.ok(b.kills <= 1, 'each body dies at most once');
  assert.ok(bodies.some((b) => b.kills === 1), 'the collapse takes the bodies in the circle');
  a.destroy();
  assert.equal(a.well.visible, false);
  assert.equal(a.lanes.visible, false);
  a.spawn(new Vector3(), new Vector3(0, 0, 1), 8);
  assert.equal(a._wellPhase, 0);
  const keys = editorKeys(buildNebula, c);
  for (const k of Object.keys(nebula.settings)) assert.ok(keys.has(k), `editor exposes ${k}`);
  a.destroy();
  a.dispose();
});
