import test from 'node:test';
import assert from 'node:assert/strict';
import { Vector3 } from 'three';
import { settings } from '../packs/sandbox/src/config/settings.js';
import { RiftPendulumAbility, buildEditor as buildRift } from '../packs/sandbox/src/abilities/codex/RiftPendulumAbility.js';
import riftpendulum from '../packs/sandbox/src/config/codex/riftpendulum.js';
import { ServoPylonAbility, buildEditor as buildServo } from '../packs/sandbox/src/abilities/codex/ServoPylonAbility.js';
import servopylon from '../packs/sandbox/src/config/codex/servopylon.js';
import { VectorHaloAbility, buildEditor as buildHalo } from '../packs/sandbox/src/abilities/codex/VectorHaloAbility.js';
import vectorhalo from '../packs/sandbox/src/config/codex/vectorhalo.js';

settings.riftpendulum ??= structuredClone(riftpendulum.settings);
settings.servopylon ??= structuredClone(servopylon.settings);
settings.vectorhalo ??= structuredClone(vectorhalo.settings);

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

test('riftpendulum: the blade is thrown, catches, swings through a tear, shatters; the cast ends and resets', () => {
  const c = settings.riftpendulum;
  const bodies = [body(0, 10), body(0.6, 10.3), body(-0.5, 9.8), body(0, 20)];
  const { a, counter } = arena(RiftPendulumAbility, bodies);
  for (let round = 0; round < 2; round++) {
    a.spawn(new Vector3(), new Vector3(0, 0, 1), 10);
    let frames = 0;
    let thrown = false;
    let swungLeft = false;
    let swungRight = false;
    let tear = 0;
    let wound = false;
    let shattered = false;
    let maxTop = 0;
    while (a.isActive && frames < 900) {
      a.update(1 / 30);
      if (a.phase === 'travel' && a.blade.visible) thrown = true;
      if (a.phase !== 'travel' && a.blade.visible) {
        const x = a.blade.position.x;
        if (x > 1) swungRight = true;
        if (x < -1) swungLeft = true;
        assert.ok(Number.isFinite(a.blade.position.y) && a.blade.position.y > 0.3, 'the blade stays above the floor');
      }
      if (a.knot.visible) maxTop = Math.max(maxTop, a.knot.position.y);
      tear = Math.max(tear, a._riftOpen);
      if (a.wound.visible) wound = true;
      if (a._bladeDissolve > 0.5) shattered = true;
      frames++;
    }
    const seconds = frames / 30;
    assert.ok(seconds > 1.5 && seconds < 5, `screen time ${seconds}`);
    assert.ok(thrown, 'the blade is seen travelling');
    assert.ok(swungLeft && swungRight, 'the blade swings across the cast line both ways');
    assert.ok(tear > 0.9, 'the tear opens');
    assert.ok(wound, 'the floor wound opens');
    assert.ok(shattered, 'the blade shatters on the exit');
    assert.ok(maxTop <= c.pendPivotHeight + 0.01 && maxTop < 6, 'the pivot stays inside the frame');
    assert.ok(a._passes >= 2, `passes ${a._passes}`);
    assert.ok(!a.blade.visible && !a.tear.visible && !a.knot.visible, 'everything is hidden at the end');
    assert.ok(finite(a.blade.matrixWorld.elements));
  }
  assert.ok(bodies[0].kills === 1, 'the near body is felled once');
  assert.equal(bodies[3].kills, 0, 'the far body is untouched');
  assert.ok(counter.shakes > 2);
  a.dispose();
});

test('riftpendulum: every new key is a live slider', () => {
  const keys = editorKeys(buildRift, settings.riftpendulum);
  for (const k of ['bladeSpan', 'pendPivotHeight', 'pendArm', 'armWidth', 'pendAmplitude', 'pendPeriod', 'pendDamping', 'pendExit', 'bladeTravelScale', 'bladeSpin', 'bladeArc', 'bladeSpecular', 'bladeFresnel', 'bladeAmbient', 'bladeEdgeGlow', 'bladeVeins', 'colorBladeCore', 'colorBladeTint', 'colorBladeBody', 'colorBladeDeep', 'pivotSize', 'pivotSpikes', 'pivotGlow', 'passShake', 'passLight', 'passDust', 'swingSparks', 'riftHeight', 'riftWidth', 'riftDepth', 'riftOpenTime', 'riftHold', 'riftCloseTime', 'riftLip', 'riftJag', 'riftSwirl', 'riftGlow', 'riftMotes', 'colorRiftDeep', 'colorRiftLip', 'woundLength', 'woundWidth', 'woundGlow', 'woundClose']) {
    assert.ok(k in settings.riftpendulum, `config has ${k}`);
    assert.ok(keys.has(k), `editor exposes ${k}`);
  }
});

test('servopylon: the core is thrown, pylons stamp up in a ring, rams hammer out and cycle, the ring sinks; reuse resets', () => {
  const c = settings.servopylon;
  const bodies = [body(0, 10), body(1.5, 11), body(-2, 9.5), body(0, 20)];
  const { a } = arena(ServoPylonAbility, bodies);
  for (let round = 0; round < 2; round++) {
    a.spawn(new Vector3(), new Vector3(0, 0, 1), 10);
    let frames = 0;
    let rose = false;
    let thrown = false;
    let maxExt = 0;
    let sank = false;
    let maxTop = 0;
    const m = new Float32Array(16);
    while (a.isActive && frames < 900) {
      a.update(1 / 30);
      if (a.phase === 'travel' && a.hub.visible) thrown = true;
      if (a.phase === 'travel' && a.columns.visible) rose = true;
      maxExt = Math.max(maxExt, a._maxExt);
      if (a._sink > 0.9) sank = true;
      if (a.columns.visible) {
        assert.ok(finite(a.columns.instanceMatrix.array) && finite(a.heads.instanceMatrix.array), 'matrices finite');
        for (let i = 0; i < a.columns.count; i++) {
          a.columns.instanceMatrix.array.slice(i * 16, i * 16 + 16).forEach((v, k) => (m[k] = v));
          maxTop = Math.max(maxTop, m[13] + m[5]);
        }
      }
      frames++;
    }
    const seconds = frames / 30;
    assert.ok(seconds > 1.5 && seconds < 5, `screen time ${seconds}`);
    assert.ok(thrown, 'the servo core is seen travelling');
    assert.ok(rose, 'the pylons stamp up as it lands');
    assert.ok(maxExt > 0.95, 'the rams hammer out');
    assert.ok(a._strokes >= c.pylonCount, `the servo cycles (${a._strokes} strokes)`);
    assert.ok(sank, 'the pylons sink on the exit');
    assert.ok(maxTop < c.pylonHeight * 1.2, `the pylons stay inside the frame (${maxTop})`);
    assert.ok(!a.columns.visible && !a.deck.visible && !a.hub.visible, 'all hidden at the end');
  }
  assert.equal(bodies[0].kills, 1);
  assert.equal(bodies[3].kills, 0);
  a.dispose();
});

test('servopylon: every new key is a live slider', () => {
  const keys = editorKeys(buildServo, settings.servopylon);
  const start = Object.keys(settings.servopylon).indexOf('pylonCount');
  const added = Object.keys(settings.servopylon).slice(start);
  assert.ok(added.length >= 45, `${added.length} new keys`);
  for (const k of added) assert.ok(keys.has(k), `editor exposes ${k}`);
});

test('vectorhalo: vectors stream from the hand into a walking ring, lock, release along their tangents, land and cool; reuse resets', () => {
  const c = settings.vectorhalo;
  const bodies = [body(0, 10), body(1.5, 11), body(-2, 9.5), body(0, 20)];
  const { a } = arena(VectorHaloAbility, bodies);
  for (let round = 0; round < 2; round++) {
    a.spawn(new Vector3(), new Vector3(0, 0, 1), 10);
    let frames = 0;
    let streamed = false;
    let flew = 0;
    let shattered = false;
    let maxOut = 0;
    while (a.isActive && frames < 900) {
      a.update(1 / 30);
      if (a.phase === 'travel' && a.arrows.visible) streamed = true;
      flew = Math.max(flew, a._inFlight);
      maxOut = Math.max(maxOut, a._maxOut);
      if (a._gone > 0.5) shattered = true;
      if (a.arrows.visible) assert.ok(finite(a.arrows.instanceMatrix.array), 'arrow matrices finite');
      frames++;
    }
    const seconds = frames / 30;
    assert.ok(seconds > 1.5 && seconds < 5, `screen time ${seconds}`);
    assert.ok(streamed, 'the vectors are seen leaving the hand');
    assert.ok(flew >= c.vectorCount - 1, 'the ring releases at once');
    assert.equal(a._landings, c.vectorCount, 'every vector lands');
    const R = c.zoneRadius * c.ringFit;
    assert.ok(maxOut > Math.hypot(R, c.flightReach) * 0.9, `they fly out along the tangent (${maxOut})`);
    assert.ok(shattered, 'they shatter on the exit');
    assert.ok(!a.arrows.visible && !a.sweep.visible, 'all hidden at the end');
  }
  assert.equal(bodies[0].kills, 1);
  assert.equal(bodies[3].kills, 0);
  a.dispose();
});

test('vectorhalo: every new key is a live slider', () => {
  const keys = editorKeys(buildHalo, settings.vectorhalo);
  const start = Object.keys(settings.vectorhalo).indexOf('vectorCount');
  const added = Object.keys(settings.vectorhalo).slice(start);
  assert.ok(added.length >= 40, `${added.length} new keys`);
  for (const k of added) assert.ok(keys.has(k), `editor exposes ${k}`);
});
