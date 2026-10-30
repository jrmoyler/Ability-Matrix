import test from 'node:test';
import assert from 'node:assert/strict';
import { Vector3 } from 'three';
import { settings } from '../packs/sandbox/src/config/settings.js';
import { RailgunLanceAbility, buildEditor as buildRailgun } from '../packs/sandbox/src/abilities/codex/RailgunLanceAbility.js';
import { RewindSnareAbility, buildEditor as buildRewind } from '../packs/sandbox/src/abilities/codex/RewindSnareAbility.js';
import railgun from '../packs/sandbox/src/config/codex/railgun.js';
import rewindsnare from '../packs/sandbox/src/config/codex/rewindsnare.js';

settings.railgun ??= structuredClone(railgun.settings);
settings.rewindsnare ??= structuredClone(rewindsnare.settings);

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
    state: 'standing',
    finished: false,
    position: new Vector3(x, 0, z),
    kills: 0,
    kill() {
      if (!this.alive) return false;
      this.alive = false;
      this.kills++;
      return true;
    },
    corrode() {},
    hold() {},
    pin() {},
    unpin() {},
    shove() {}
  };
}

function arena(Ability, bodies = []) {
  const counter = { emits: 0, decals: 0, bursts: 0 };
  const near = (x, z, r, out) => {
    out.length = 0;
    for (const b of bodies) if (Math.hypot(b.position.x - x, b.position.z - z) <= r) out.push(b);
    return out;
  };
  const ctx = {
    particles: mockParticles(counter),
    lights: { acquire: () => ({}), set() {}, release() {} },
    decals: { spawn: () => counter.decals++ },
    bursts: { spawn: () => counter.bursts++ },
    shake: { add() {}, rumble() {} },
    flash: { trigger() {} },
    dummies: {
      findTargets: (x, z, r, out) => near(x, z, r, out).filter((b) => b.alive),
      findBodies: near
    }
  };
  return { a: new Ability(ctx), counter };
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

test('railgun: column with sheath + rifling holds, the end keeps pulsing, the line is pierced, the cast ends', () => {
  const bodies = [body(0, 14), body(0.4, 9), body(3, 12)];
  const { a, counter } = arena(RailgunLanceAbility, bodies);
  a.spawn(new Vector3(), new Vector3(0, 0, 1), 16);
  let frames = 0;
  let sheathFrames = 0;
  let helixFrames = 0;
  let maxSpread = 0;
  let maxEmit = 0;
  let fireAt = -1;
  while (a.isActive && frames < 900) {
    const before = counter.emits;
    a.update(1 / 30);
    maxEmit = Math.max(maxEmit, counter.emits - before);
    frames++;
    if (a._fired && fireAt < 0) fireAt = frames / 30;
    if (a.sheath.visible) sheathFrames++;
    if (a.helix.visible) helixFrames++;
    maxSpread = Math.max(maxSpread, a._helixState.spread);
  }
  const seconds = frames / 30;
  assert.ok(fireAt > 0.15 && fireAt <= 0.62, `charge reads in 0.15–0.6 s (${fireAt})`);
  assert.ok(seconds > 1.5 && seconds < 4.5, `screen time ${seconds}`);
  assert.ok(sheathFrames / 30 > 0.8, `the column holds ${sheathFrames / 30}s`);
  assert.ok(helixFrames / 30 > 1.0, `the rifling lives ${helixFrames / 30}s`);
  assert.ok(maxSpread > 0.5, 'the rifling unwinds outward');
  assert.equal(bodies[0].kills + bodies[1].kills, 2, 'everything on the line is pierced');
  assert.equal(bodies[2].kills, 0, 'nothing off the line');
  assert.ok(counter.bursts >= 3, `impact + end pulses (${counter.bursts})`);
  assert.ok(counter.decals >= 4, `scorch, shockwave and end rings (${counter.decals})`);
  assert.ok(maxEmit < 2500, `bounded emission ${maxEmit}`);
  a.destroy();
  assert.ok(!a.beam.visible && !a.sheath.visible && !a.helix.visible && !a.trench.visible);
});

test('railgun: reuse resets, editor exposes every key, dispose frees', () => {
  const { a } = arena(RailgunLanceAbility);
  a.spawn(new Vector3(), new Vector3(0, 0, 1), 12);
  for (let i = 0; i < 50; i++) a.update(1 / 30);
  a.destroy();
  a.spawn(new Vector3(), new Vector3(0, 0, 1), 12);
  assert.equal(a._fired, false);
  assert.equal(a.helix.visible, false);
  assert.equal(a._endPulseT, 0);

  const keys = editorKeys(buildRailgun, settings.railgun);
  for (const k of Object.keys(railgun.settings)) if (k !== 'look') assert.ok(keys.has(k), `editor exposes ${k}`);

  let disposed = 0;
  for (const r of [a.helixMaterial, a.sheathMaterial, a.helixGeometry]) r.addEventListener('dispose', () => disposed++);
  a.destroy();
  a.dispose();
  assert.equal(disposed, 3);
});

test('rewindsnare: the developed field follows the film, the cocoon keeps turning while locked, the cast ends', () => {
  const bodies = [body(0, 10.5), body(1.5, 9), body(-2, 10)];
  const { a } = arena(RewindSnareAbility, bodies);
  a.spawn(new Vector3(), new Vector3(0, 0, 1), 10);
  let frames = 0;
  let maxOut = 0;
  let lockedSpin = null;
  let lockedSpinEnd = null;
  let swirl0 = null;
  while (a.isActive && frames < 900) {
    a.update(1 / 30);
    frames++;
    maxOut = Math.max(maxOut, a.floorMaterial.uniforms.uOut.value);
    if (a._locked) {
      lockedSpin ??= a._spin;
      lockedSpinEnd = a._spin;
      swirl0 ??= a._swirl;
    }
  }
  const seconds = frames / 30;
  assert.ok(seconds > 2 && seconds < 6.5, `screen time ${seconds}`);
  assert.ok(maxOut > 10, `the field develops under the film (${maxOut} m)`);
  assert.ok(lockedSpin !== null && Math.abs(lockedSpinEnd - lockedSpin) > 0.5, 'the locked cocoon keeps turning');
  assert.ok(Math.abs(a._swirl - swirl0) > 0.1, 'the field keeps drifting while locked');
  assert.ok(bodies.every((b) => b.kills === 1), 'every body on the film is snared');
  a.destroy();
  assert.ok(!a.floor.visible && !a.spiral.visible);
});

test('rewindsnare: reuse resets, editor exposes every key', () => {
  const { a } = arena(RewindSnareAbility);
  a.spawn(new Vector3(), new Vector3(0, 0, 1), 10);
  for (let i = 0; i < 80; i++) a.update(1 / 30);
  a.destroy();
  a.spawn(new Vector3(), new Vector3(0, 0, 1), 10);
  assert.equal(a._swirl, 0);
  assert.equal(a._locked, false);
  const keys = editorKeys(buildRewind, settings.rewindsnare);
  for (const k of Object.keys(rewindsnare.settings)) assert.ok(keys.has(k), `editor exposes ${k}`);
});
