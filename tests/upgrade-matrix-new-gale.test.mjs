import test from 'node:test';
import assert from 'node:assert/strict';
import { Vector3 } from 'three';
import { settings } from '../packs/sandbox/src/config/settings.js';
import { GaleSeverAbility, buildEditor } from '../packs/sandbox/src/abilities/matrix-new/GaleSeverAbility.js';
import gale from '../packs/sandbox/src/config/matrix-new/gale.js';

settings.gale ??= structuredClone(gale.settings);

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
      findTargets(x, z, r, out) {
        out.length = 0;
        for (const b of bodies) if (b.alive && Math.hypot(b.position.x - x, b.position.z - z) <= r) out.push(b);
        return out;
      }
    }
  };
  return { a: new GaleSeverAbility(ctx), counter };
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

test('gale: every layer is built, the linger stands two vortices, and the cast ends', () => {
  const target = body(0.3, 12);
  const { a, counter } = arena([target]);
  a.spawn(new Vector3(), new Vector3(0, 0, 1), 12);
  assert.equal(a.sheath.visible, true);
  assert.ok(a._vortices.every((v) => !v.core.visible));
  let frames = 0;
  let sawVortices = false;
  let maxEmitPerFrame = 0;
  while (a.isActive && frames < 600) {
    const before = counter.emits;
    a.update(1 / 30);
    maxEmitPerFrame = Math.max(maxEmitPerFrame, counter.emits - before);
    if (a._vortices.every((v) => v.core.visible && v.dust.visible)) sawVortices = true;
    frames++;
  }
  assert.ok(frames < 600, 'cast finishes');
  assert.ok(sawVortices, 'the severed vortices stand in the linger');
  assert.equal(target.kills, 1, 'the blade cuts the body once');
  assert.ok(maxEmitPerFrame < 2000, 'emission is bounded');
  assert.ok(counter.bursts >= 1 && counter.decals >= 2);
  // Screen time inside the 1.5–4.5 s standard.
  const seconds = frames / 30;
  assert.ok(seconds > 1.5 && seconds < 4.5, `screen time ${seconds}`);
  a.destroy();
  assert.ok(a._vortices.every((v) => !v.core.visible && !v.dust.visible));
  assert.equal(a.sheath.visible, false);
});

test('gale: the scar follows the low tip, the fan and feet are derived from settings', () => {
  const { a } = arena();
  const c = settings.gale;
  a.spawn(new Vector3(), new Vector3(0, 0, 1), 10);
  const x = a._contactX();
  assert.ok(Math.abs(x) > 0.5, 'a rolled blade cuts off-centre, where its low tip is');
  const roll = c.roll;
  c.roll = 0;
  c.bladeHeight = 1.3;
  assert.ok(Math.abs(a._contactX()) < 1e-6 || Math.abs(a._contactX()) < Math.abs(x), 'a flat blade cuts nearer the centre');
  c.roll = roll;
  for (let i = 0; i < 60 && a.isActive; i++) a.update(1 / 30);
  const sc = a._scarState;
  assert.ok(sc.fanR > 0, 'the blast fan has spread');
  assert.ok(sc.fanR <= c.fanRadius * Math.max(1, settings.global.explosionIntensity) + 1e-6);
  const seat = c.shearRadius * c.vortexSeat;
  assert.ok(sc.feet.x >= seat - 1e-6 && sc.feet.y <= -seat + 1e-6, 'feet sit either side of the line');
  // Live slider: a taller vortex is a taller uniform on the next frame.
  const h = c.vortexHeight;
  c.vortexHeight = h * 2;
  a.update(0);
  assert.equal(a._vortices[0].coreMaterial.uniforms.uHeight.value, h * 2);
  c.vortexHeight = h;
  a.destroy();
});

test('gale: reuse fully resets, the editor exposes the new keys, dispose frees everything', () => {
  const { a } = arena();
  a.spawn(new Vector3(), new Vector3(1, 0, 0), 8);
  for (let i = 0; i < 40 && a.isActive; i++) a.update(1 / 30);
  a.destroy();
  a.spawn(new Vector3(), new Vector3(1, 0, 0), 8);
  assert.equal(a._since, -1);
  assert.equal(a._scarState.fanR, 0);
  assert.ok(a._vortices.every((v) => !v.core.visible));

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
  buildEditor(folder(), settings.gale, Editor);
  for (const k of Object.keys(gale.settings)) assert.ok(keys.has(k), `editor exposes ${k}`);

  let disposed = 0;
  for (const r of [a.sheathGeometry, a.vortexGeometry, a.sheathMaterial, ...a._vortices.flatMap((v) => [v.coreMaterial, v.sheathMaterial])])
    r.addEventListener('dispose', () => disposed++);
  a.destroy();
  a.dispose();
  assert.equal(disposed, 7);
});
