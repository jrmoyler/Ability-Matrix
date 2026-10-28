import test from 'node:test';
import assert from 'node:assert/strict';
import { Vector3 } from 'three';
import { settings } from '../packs/sandbox/src/config/settings.js';
import { ZephyrShurikenAbility, buildEditor } from '../packs/sandbox/src/abilities/codex/ZephyrShurikenAbility.js';
import zephyr from '../packs/sandbox/src/config/codex/zephyr.js';

settings.zephyr ??= structuredClone(zephyr.settings);

/** A uniform box whose value can be set either way the abilities do it. */
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
  const counter = { emits: 0, decals: 0, bursts: 0, kills: 0 };
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
  return { a: new ZephyrShurikenAbility(ctx), counter };
}

function body(x, z) {
  return {
    alive: true,
    position: new Vector3(x, 0, z),
    kills: 0,
    carry() {},
    release() {},
    kill() {
      if (!this.alive) return false;
      this.alive = false;
      this.kills++;
      return true;
    }
  };
}


test('zephyr: discs have a lit body, the cyclone stands with its sheath, the eye is scoured, the cast ends', () => {
  const target = body(0.2, 12);
  const { a, counter } = arena([target]);
  a.spawn(new Vector3(), new Vector3(0, 0, 1), 12);
  assert.ok(a._discs.every((d) => d.body.visible && d.mesh.visible));
  let frames = 0;
  let sawCyclone = false;
  let maxEye = 0;
  let maxEmit = 0;
  while (a.isActive && frames < 900) {
    const before = counter.emits;
    a.update(1 / 30);
    maxEmit = Math.max(maxEmit, counter.emits - before);
    if (a.cyclone.visible && a.cycloneSheath.visible) sawCyclone = true;
    maxEye = Math.max(maxEye, a._scuffState.eyeR);
    frames++;
  }
  assert.ok(frames < 900);
  const seconds = frames / 30;
  assert.ok(seconds > 1.5 && seconds < 4.8, `screen time ${seconds}`);
  assert.ok(sawCyclone, 'cyclone core + sheath shown');
  const c = settings.zephyr;
  assert.ok(maxEye > 0 && maxEye <= c.eyeRadius * c.puffTopRadius + 1e-6, 'eye scoured, sized from settings');
  assert.ok(target.kills >= 1 && target.kills <= 1);
  assert.ok(maxEmit < 2000);
  a.destroy();
  assert.ok(a._discs.every((d) => !d.body.visible) && !a.cycloneSheath.visible);
});

test('zephyr: discs tip toward the thrower, reuse resets, editor exposes every key, dispose frees', () => {
  const { a } = arena();
  a.spawn(new Vector3(), new Vector3(0, 0, 1), 10);
  a.update(1 / 30);
  const axis = a._discs[0].state.axis;
  assert.ok(axis.z < -0.2, 'disc normal tipped back toward the caster');
  for (let i = 0; i < 40; i++) a.update(1 / 30);
  a.destroy();
  a.spawn(new Vector3(), new Vector3(0, 0, 1), 10);
  assert.equal(a._scuffState.eyeR, 0);
  assert.equal(a.cycloneSheath.visible, false);

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
  buildEditor(folder(), settings.zephyr, Editor);
  for (const k of Object.keys(zephyr.settings)) assert.ok(keys.has(k), `editor exposes ${k}`);

  let disposed = 0;
  for (const r of [a.cycloneSheathMaterial, ...a._discs.map((d) => d.bodyMaterial)]) r.addEventListener('dispose', () => disposed++);
  a.destroy();
  a.dispose();
  assert.equal(disposed, 4);
});
