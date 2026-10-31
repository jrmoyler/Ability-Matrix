import test from 'node:test';
import assert from 'node:assert/strict';
import { Vector3 } from 'three';
import { settings } from '../packs/sandbox/src/config/settings.js';
import { VenturiGateAbility, buildEditor as buildVenturi } from '../packs/sandbox/src/abilities/codex/VenturiGateAbility.js';
import venturi from '../packs/sandbox/src/config/codex/venturi.js';
import { AbsenceLanceAbility, buildEditor as buildAbsence } from '../packs/sandbox/src/abilities/codex/AbsenceLanceAbility.js';
import absence from '../packs/sandbox/src/config/codex/absence.js';
import { AureoleRingAbility, buildEditor as buildAureole } from '../packs/sandbox/src/abilities/codex/AureoleRingAbility.js';
import aureole from '../packs/sandbox/src/config/codex/aureole.js';

settings.venturi ??= structuredClone(venturi.settings);
settings.absence ??= structuredClone(absence.settings);
settings.aureole ??= structuredClone(aureole.settings);

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

test('venturi: a gust flies, the gate slams up, the throat squeezes, the cough blows it open, the scour stays, the cast ends', () => {
  const c = settings.venturi;
  const bodies = [body(0, 10), body(1.5, 11), body(-2, 9.5), body(0, 22)];
  const { a } = arena(VenturiGateAbility, bodies);
  a.spawn(new Vector3(), new Vector3(0, 0, 1), 10);
  let frames = 0;
  let gustFlew = false;
  let wallInTravel = false;
  let minThroat = Infinity;
  let maxFlare = 0;
  let scourAfterCough = false;
  let killedBeforeCough = false;
  while (a.isActive && frames < 900) {
    a.update(1 / 30);
    if (a.gust.visible) gustFlew = true;
    if (a.phase === 'travel' && a.wall.visible) wallInTravel = true;
    if (a.wall.visible) {
      minThroat = Math.min(minThroat, a._wallShape.r1 / a._wallShape.r0);
      maxFlare = Math.max(maxFlare, a._wallShape.flare);
      for (const k of ['r0', 'r1', 'r2', 'height', 'spin', 'flow']) assert.ok(Number.isFinite(a._wallShape[k]), `wall ${k} finite`);
    }
    if (!a._coughed && bodies.some((b) => b.kills)) killedBeforeCough = true;
    if (a._coughed && a.scour.visible) scourAfterCough = true;
    frames++;
  }
  const seconds = frames / 30;
  assert.ok(seconds > 1.5 && seconds < 5, `screen time ${seconds}`);
  assert.ok(gustFlew, 'the gust is seen travelling');
  assert.ok(wallInTravel, 'the gate whirls up before the beat');
  assert.ok(minThroat < c.gateThroatStart * 0.5, `the throat squeezes (${minThroat})`);
  assert.ok(maxFlare > 0.5, 'the cough blows the mouth open');
  assert.ok(a._coughed, 'the cough lands');
  assert.ok(scourAfterCough, 'the scour stays after the cough');
  assert.equal(killedBeforeCough, false, 'hit timing unchanged: bodies go on the cough (echo)');
  assert.equal(bodies[3].kills, 0, 'outside the circle is untouched');
  assert.ok(bodies.slice(0, 3).every((b) => b.kills === 1), 'the bodies inside are taken once');
  const keys = editorKeys(buildVenturi, c);
  for (const k of Object.keys(venturi.settings)) assert.ok(keys.has(k) || k === 'lifetime', `editor exposes ${k}`);
  a.destroy();
  assert.equal(a.wall.visible, false);
  assert.equal(a.scour.visible, false);
  a.spawn(new Vector3(), new Vector3(0, 0, 1), 10);
  assert.equal(a._coughed, false);
  assert.equal(a._gateFlow, 0);
  a.destroy();
  a.dispose();
});

test('absence: the lance flies over an opening void, plants, is unmade butt to tip, the line closes, the cast ends', () => {
  const c = settings.absence;
  const bodies = [body(0, 6), body(0.4, 11.5), body(4, 6)];
  const { a } = arena(AbsenceLanceAbility, bodies);
  a.spawn(new Vector3(), new Vector3(0, 0, 1), 12);
  let frames = 0;
  let flew = false;
  let trenchInTravel = false;
  let planted = false;
  let maxErase = 0;
  let maxClosed = 0;
  let killedInTravel = false;
  while (a.isActive && frames < 900) {
    a.update(1 / 30);
    if (a.phase === 'travel') {
      if (a.lance.visible) flew = true;
      if (a.trench.visible) trenchInTravel = true;
      if (bodies[0].kills) killedInTravel = true;
    } else if (a.lance.visible && a.lance.position.y > 1) planted = true;
    assert.ok(finite(a.lance.matrix.elements) && Number.isFinite(a.lance.position.y), 'lance pose finite');
    maxErase = Math.max(maxErase, a._lanceErase);
    maxClosed = Math.max(maxClosed, a._trenchClosed);
    frames++;
  }
  const seconds = frames / 30;
  assert.ok(seconds > 1.5 && seconds < 5, `screen time ${seconds}`);
  assert.ok(flew, 'the lance is seen in flight');
  assert.ok(trenchInTravel, 'the line is unmade behind the head');
  assert.ok(planted, 'the lance stands planted, butt in the air');
  assert.ok(maxErase > 0.99, 'the lance is unmade');
  assert.ok(maxClosed > 12, 'the line closes up to the lance');
  assert.ok(killedInTravel, 'hit timing unchanged: bodies on the line go as the head passes');
  assert.equal(bodies[2].kills, 0, 'well off the line is untouched');
  assert.ok(bodies.every((b) => b.kills <= 1));
  const keys = editorKeys(buildAbsence, c);
  for (const k of Object.keys(absence.settings)) if (k !== 'zoneRadius' && k !== 'lifetime') assert.ok(keys.has(k), `editor exposes ${k}`);
  a.destroy();
  assert.equal(a.lance.visible, false);
  assert.equal(a.trench.visible, false);
  a.spawn(new Vector3(), new Vector3(0, 0, 1), 12);
  assert.equal(a._lanceErase, 0);
  assert.equal(a._trenchClosed, 0);
  a.destroy();
  a.dispose();
});

test('aureole: the star flies, the crown tightens from wide onto the rim, flares on the beat, turns, sinks, the cast ends', () => {
  const c = settings.aureole;
  const bodies = [body(0, 10), body(1.5, 11), body(-2, 9.5), body(0, 22)];
  const { a } = arena(AureoleRingAbility, bodies);
  a.spawn(new Vector3(), new Vector3(0, 0, 1), 10);
  let frames = 0;
  let starFlew = false;
  let raysInTravel = false;
  let maxR = 0;
  let minR = Infinity;
  let sank = false;
  let sunAfter = false;
  while (a.isActive && frames < 900) {
    a.update(1 / 30);
    if (a.phase === 'travel') {
      if (a.star.visible) starFlew = true;
      if (a.rays.visible) raysInTravel = true;
      maxR = Math.max(maxR, a._crownR);
    } else {
      minR = Math.min(minR, a._crownR);
      if (a.sun.visible) sunAfter = true;
    }
    if (a.rays.visible) {
      assert.ok(finite(a.rays.instanceMatrix.array), 'ray matrices finite');
      const m = a.rays.instanceMatrix.array;
      for (let i = 0; i < a.rays.count; i++) if (m[i * 16 + 13] < -0.5) sank = true;
    }
    frames++;
  }
  const seconds = frames / 30;
  assert.ok(seconds > 1.5 && seconds < 5, `screen time ${seconds}`);
  assert.ok(starFlew, 'the sun-star is seen travelling');
  assert.ok(raysInTravel, 'the crown rises before the beat');
  assert.ok(maxR > c.zoneRadius * c.rayFit * 1.1 && minR < c.zoneRadius * c.rayFit, `the crown tightens (${maxR} → ${minR})`);
  assert.ok(sank, 'the rays sink into the floor at the end');
  assert.ok(sunAfter, 'the sunburst is on the floor');
  assert.equal(bodies[3].kills, 0, 'outside the circle is untouched');
  assert.ok(bodies.slice(0, 3).every((b) => b.kills === 1), 'the bodies inside are taken once');
  const keys = editorKeys(buildAureole, c);
  for (const k of Object.keys(aureole.settings)) assert.ok(keys.has(k) || k === 'lifetime', `editor exposes ${k}`);
  a.destroy();
  assert.equal(a.rays.visible, false);
  assert.equal(a.star.visible, false);
  a.spawn(new Vector3(), new Vector3(0, 0, 1), 10);
  assert.ok(a._crownR > c.zoneRadius * c.rayFit);
  a.destroy();
  a.dispose();
});
