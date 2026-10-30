import test from 'node:test';
import assert from 'node:assert/strict';
import { Vector3 } from 'three';
import { settings } from '../packs/sandbox/src/config/settings.js';
import { EmberveilLatticeAbility, buildEditor } from '../packs/sandbox/src/abilities/matrix-new/EmberveilLatticeAbility.js';
import emberveil from '../packs/sandbox/src/config/matrix-new/emberveil.js';

settings.emberveil ??= structuredClone(emberveil.settings);

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
  return { a: new EmberveilLatticeAbility(ctx), counter };
}

function body(x, z) {
  return {
    alive: true,
    position: new Vector3(x, 0, z),
    kills: 0,
    corrode() {},
    kill() {
      if (!this.alive) return false;
      this.alive = false;
      this.kills++;
      return true;
    }
  };
}

test('emberveil: the ember ball and its thread travel, the circle is marked before the cage, the collapse kills once', () => {
  const inside = body(0.5, 10.3);
  const outside = body(0, 20);
  const { a, counter } = arena([inside, outside]);
  a.spawn(new Vector3(), new Vector3(0, 0, 1), 10);
  assert.equal(counter.bursts, 1, 'a flare catches at the hand');
  let frames = 0;
  let sawBall = false;
  let sawThread = false;
  let markedBeforeLanding = false;
  let strandsInTravel = false;
  let maxEmit = 0;
  while (a.isActive && frames < 600) {
    const before = counter.emits;
    a.update(1 / 30);
    maxEmit = Math.max(maxEmit, counter.emits - before);
    if (a._clock < 0) {
      if (a.ballMeshes.every((m) => m.visible)) sawBall = true;
      if (a.thread.visible) sawThread = true;
      if (a.floor.visible) markedBeforeLanding = true;
      if (a.strands.visible) strandsInTravel = true;
    }
    frames++;
  }
  assert.ok(frames < 600, 'cast finishes');
  assert.ok(sawBall, 'the wound ember ball flies');
  assert.ok(sawThread, 'the burning thread lies on the path');
  assert.ok(markedBeforeLanding, 'the scorched ring is telegraphed before the landing');
  assert.ok(!strandsInTravel, 'the strands only rise after the landing');
  assert.equal(inside.kills, 1, 'the trapped body is thrown once');
  assert.equal(outside.kills, 0, 'bodies outside the cage are untouched');
  assert.ok(maxEmit < 2000, 'emission is bounded');
  assert.ok(counter.bursts >= 3, 'hand flare, landing and collapse');
  a.destroy();
  assert.ok(!a.thread.visible && a.ballMeshes.every((m) => !m.visible) && !a.strands.visible);
});

test('emberveil: the visible creep and breath never change who the trap reaches', () => {
  const { a } = arena();
  a.spawn(new Vector3(), new Vector3(0, 0, 1), 6);
  for (let i = 0; i < 90 && a.isActive; i++) a.update(1 / 30);
  assert.equal(a._hitShrink, 1, 'no contraction yet: the trap reaches the full cage');
  assert.ok(a._lattice.shrink < a._hitShrink, 'the drawn cage has crept inside the trap radius');
  assert.ok(a._strandState.burn > 0 && a._strandState.orbitAmount > 0, 'the burn heats and the heat wave runs');
  // Live slider: the cord's crack width is a uniform on the next frame.
  const w = settings.emberveil.crackWidth;
  settings.emberveil.crackWidth = w * 2;
  a.update(0);
  assert.ok(Math.abs(a.coreMaterial.uniforms.uCrackWidth.value - w * 2 * settings.global.noiseStrength) < 1e-9);
  settings.emberveil.crackWidth = w;
  a.destroy();
});

test('emberveil: reuse resets, the editor exposes the new keys, dispose frees everything', () => {
  const { a } = arena();
  a.spawn(new Vector3(), new Vector3(1, 0, 0), 8);
  for (let i = 0; i < 60 && a.isActive; i++) a.update(1 / 30);
  a.destroy();
  a.spawn(new Vector3(), new Vector3(1, 0, 0), 8);
  assert.equal(a._clock, -1);
  assert.equal(a._hitShrink, 1);
  assert.equal(a._threadState.burnBack, 0);
  assert.ok(!a.floor.visible && !a.thread.visible);

  const keys = new Set();
  const gui = {
    addFolder: () => gui,
    add: (o, k) => (keys.add(k), ctl),
    addColor: (o, k) => (keys.add(k), ctl)
  };
  const ctl = { name: () => ctl, onChange: () => ctl, step: () => ctl, listen: () => ctl };
  const Editor = { range: (f, c, k) => (keys.add(k), ctl), gradient: (f, c, p) => { for (const s of 'ABCD') keys.add(p + s); }, castAnimation: () => keys.add('castAnim') };
  buildEditor(gui, settings.emberveil, Editor);
  for (const key of Object.keys(emberveil.settings)) {
    if (key === 'look') continue;
    assert.ok(keys.has(key), `editor exposes ${key}`);
  }

  let disposed = 0;
  for (const m of [...a.ballMaterials, a.threadMaterial, a.threadGeometry]) m.addEventListener('dispose', () => disposed++);
  a.destroy();
  a.dispose();
  assert.equal(disposed, a.ballMaterials.length + 2);
});
