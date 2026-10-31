import test from 'node:test';
import assert from 'node:assert/strict';
import { Matrix4, Vector3 } from 'three';
import { settings } from '../packs/sandbox/src/config/settings.js';

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
    position: new Vector3(x, 0, z),
    kills: 0,
    corrode() {},
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

function arena(Cls, bodies = []) {
  const counter = { emits: 0, decals: 0, bursts: 0, shakes: 0 };
  const ctx = {
    particles: mockParticles(counter),
    lights: { acquire: () => ({}), set() {}, release() {} },
    decals: { spawn: () => counter.decals++ },
    bursts: { spawn: () => counter.bursts++ },
    shake: { add: () => counter.shakes++, rumble() {} },
    flash: { trigger() {} },
    dummies: {
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

function finite(array) {
  for (let i = 0; i < array.length; i++) if (!Number.isFinite(array[i])) return false;
  return true;
}


import { FeintCageAbility, buildEditor as buildFeint } from '../packs/sandbox/src/abilities/codex/FeintCageAbility.js';
import feintcage from '../packs/sandbox/src/config/codex/feintcage.js';

function run(a, onFrame) {
  let frames = 0;
  while (a.isActive && frames < 900) {
    a.update(1 / 30);
    onFrame?.(frames);
    frames++;
  }
  return frames / 30;
}

function barTop(mesh, i, out = new Vector3()) {
  const m = new Matrix4();
  mesh.getMatrixAt(i, m);
  return out.set(0, 1, 0).applyMatrix4(m);
}

test('feintcage: two sheaves fly, plant as two rings, turn opposite ways, the feint breaks, the cage clenches and sinks', () => {
  settings.feintcage ??= structuredClone(feintcage.settings);
  const c = settings.feintcage;
  const bodies = [body(0, 10), body(1.5, 11), body(-2, 9.5), body(0, 20)];
  const { a, counter } = arena(FeintCageAbility, bodies);
  a.spawn(new Vector3(), new Vector3(0, 0, 1), 10);
  let flew = false;
  let maxFlightY = 0;
  let spinStart = null;
  let feintStart = null;
  let spinMid = null;
  let feintMid = null;
  let leaned = false;
  let feintGoneLater = false;
  let sankAfter = false;
  const top = new Vector3();
  const seconds = run(a, () => {
    if (a.phase === 'travel' && a.bars.visible) {
      flew = true;
      barTop(a.bars, 0, top);
      maxFlightY = Math.max(maxFlightY, top.y);
    }
    const k = a._cage;
    if (k.planted && spinStart === null) {
      spinStart = k.spin;
      feintStart = k.feintSpin;
    }
    if (k.planted && !k.cut) {
      spinMid = k.spin;
      feintMid = k.feintSpin;
    }
    if (k.cut) {
      barTop(a.bars, 0, top);
      const r = Math.hypot(top.x, top.z - 10);
      if (r < c.zoneRadius * c.cageFit - 1) leaned = true;
      if (k.gone && !a.feints.visible) feintGoneLater = true;
    }
    if (a.phase === 'fade' && !a.bars.visible) sankAfter = true;
    assert.ok(finite(a.bars.instanceMatrix.array) && finite(a.feints.instanceMatrix.array), 'bar poses finite');
  });
  assert.ok(seconds > 1.5 && seconds < 5, `screen time ${seconds}`);
  assert.ok(flew && maxFlightY > c.cageDrop, 'the sheaves are seen in flight, on an arc');
  assert.ok(spinMid - spinStart > 0.2 && feintMid - feintStart < -0.2, 'the two cages turn opposite ways');
  assert.ok(leaned, 'the real cage clenches in at the cut');
  assert.ok(feintGoneLater, 'the feint breaks apart');
  assert.ok(sankAfter, 'the bars sink before the cast ends');
  assert.ok(finite(a.barGeometry.getAttribute('position').array), 'bar geometry finite');
  assert.ok(a.barGeometry.getAttribute('position').count / 3 >= 60, 'the bar is an authored solid');
  assert.equal(bodies[3].kills, 0, 'outside the circle is untouched');
  assert.ok(bodies.slice(0, 3).every((b) => b.kills === 1), 'the bodies inside are taken once');
  assert.ok(counter.decals > 0 && counter.shakes > 2, 'the floor and camera answer');
  const keys = editorKeys(buildFeint, c);
  for (const k of Object.keys(feintcage.settings)) assert.ok(keys.has(k), `editor exposes ${k}`);
  a.destroy();
  assert.equal(a.bars.visible, false);
  assert.equal(a.feints.visible, false);
  assert.equal(a.floor.visible, false);
  a.spawn(new Vector3(), new Vector3(0, 0, 1), 10);
  assert.equal(a._cage.planted, false);
  assert.equal(a._cage.cut, false);
  a.destroy();
  a.dispose();
});

import { GeodeCageAbility, buildEditor as buildGeode } from '../packs/sandbox/src/abilities/codex/GeodeCageAbility.js';
import geodecage from '../packs/sandbox/src/config/codex/geodecage.js';

test('geodecage: the nodule flies, the shell tears up and seals, the points fire inward, it cracks open flat and sinks', () => {
  settings.geodecage ??= structuredClone(geodecage.settings);
  const c = settings.geodecage;
  const bodies = [body(0, 10), body(1.5, 11), body(-2, 9.5), body(0, 20)];
  const { a, counter } = arena(GeodeCageAbility, bodies);
  a.spawn(new Vector3(), new Vector3(0, 0, 1), 10);
  let flew = false;
  let sealedFirst = false;
  let firedAfterSeal = false;
  let opened = false;
  let sank = false;
  let pointsMet = false;
  const m = new Matrix4();
  const p = new Vector3();
  const seconds = run(a, () => {
    const k = a._geo;
    if (a.phase === 'travel' && a.nodule.visible) flew = true;
    if (k.sealed && !k.fired) sealedFirst = true;
    if (k.fired && sealedFirst) firedAfterSeal = true;
    if (k.landed) {
      // a fallen petal's hinge frame points its long axis outward and down
      a.petals.getMatrixAt(0, m);
      const e = m.elements;
      if (e[5] < 0.3 * c.zoneRadius * c.geodeFit * c.geodeSquash) opened = true;
    }
    if (k.fired) {
      a.spikes.getMatrixAt(0, m);
      p.set(0, 1, 0).applyMatrix4(m);
      if (Math.hypot(p.x, p.z - 10) < 1.2) pointsMet = true;
    }
    if (a.phase === 'fade' && !a.petals.visible) sank = true;
    assert.ok(finite(a.petals.instanceMatrix.array) && finite(a.spikes.instanceMatrix.array), 'poses finite');
  });
  assert.ok(seconds > 1.5 && seconds < 5, `screen time ${seconds}`);
  assert.ok(flew, 'the nodule is seen in flight');
  assert.ok(sealedFirst && firedAfterSeal, 'the shell seals before the points fire');
  assert.ok(pointsMet, 'the points meet in the middle');
  assert.ok(opened, 'the geode falls open flat');
  assert.ok(sank, 'it sinks before the cast ends');
  assert.equal(bodies[3].kills, 0, 'outside the circle is untouched');
  assert.ok(bodies.slice(0, 3).every((b) => b.kills === 1), 'the bodies inside are taken once');
  assert.ok(counter.shakes > 3, 'the camera answers each beat');
  const keys = editorKeys(buildGeode, c);
  for (const k of Object.keys(geodecage.settings)) assert.ok(keys.has(k), `editor exposes ${k}`);
  a.destroy();
  assert.equal(a.petals.visible || a.spikes.visible || a.nodule.visible || a.floor.visible, false);
  a.spawn(new Vector3(), new Vector3(0, 0, 1), 10);
  assert.equal(a._geo.sealed, false);
  a.destroy();
  a.dispose();
});

import { GimbalWhipAbility, buildEditor as buildGimbal } from '../packs/sandbox/src/abilities/codex/GimbalWhipAbility.js';
import gimbal from '../packs/sandbox/src/config/codex/gimbal.js';

test('gimbal: the cutter whips down the line, yawing and snaking, bites at the end, precesses down, folds and sinks', () => {
  settings.gimbal ??= structuredClone(gimbal.settings);
  const c = settings.gimbal;
  const bodies = [body(0.3, 4), body(-0.5, 8), body(0.2, 11), body(6, 8)];
  const { a, counter } = arena(GimbalWhipAbility, bodies);
  a.spawn(new Vector3(), new Vector3(0, 0, 1), 12);
  let flew = false;
  let maxLat = 0;
  let yawMin = Infinity;
  let yawMax = -Infinity;
  let bitLow = Infinity;
  let sank = false;
  let precessed = false;
  let yawAtBite = null;
  const seconds = run(a, () => {
    const p = a.cutter.position;
    if (a.phase === 'travel' && a.cutter.visible) {
      flew = true;
      maxLat = Math.max(maxLat, Math.abs(p.x));
      yawMin = Math.min(yawMin, a._cut.yaw);
      yawMax = Math.max(yawMax, a._cut.yaw);
    }
    if (a.phase !== 'travel') {
      if (yawAtBite === null) yawAtBite = a._cut.yaw;
      if (a._cut.yaw - yawAtBite > 1) precessed = true;
      if (a.cutter.visible) bitLow = Math.min(bitLow, p.y);
      if (a.phase === 'fade' && !a.cutter.visible) sank = true;
    }
    a.group.updateMatrixWorld(true);
    assert.ok(finite(a.blade.matrixWorld.elements) && finite(a.kerf.matrixWorld.elements), 'poses finite');
  });
  assert.ok(seconds > 1.5 && seconds < 5, `screen time ${seconds}`);
  assert.ok(flew, 'the cutter is seen running the line');
  assert.ok(maxLat > c.whipAmp * 0.6, `it whips side to side (${maxLat})`);
  assert.ok(yawMax - yawMin > c.whipYaw, 'it yaws into each swing');
  assert.ok(bitLow < c.cutterHeight - c.biteDepth * 0.8, 'it bites into the floor at the end');
  assert.ok(precessed, 'it keeps precessing after the bite');
  assert.ok(sank, 'it sinks before the cast ends');
  assert.equal(bodies[3].kills, 0, 'off the line is untouched');
  assert.ok(bodies.slice(0, 3).every((b) => b.kills === 1), 'the bodies on the line are cut once');
  assert.ok(counter.shakes > 1, 'the camera answers the bite');
  const keys = editorKeys(buildGimbal, c);
  for (const k of Object.keys(gimbal.settings)) assert.ok(keys.has(k), `editor exposes ${k}`);
  a.destroy();
  assert.equal(a.cutter.visible || a.kerf.visible, false);
  a.spawn(new Vector3(), new Vector3(0, 0, 1), 12);
  assert.equal(a._cut.bit, false);
  a.destroy();
  a.dispose();
});
