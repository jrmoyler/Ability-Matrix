import test from 'node:test';
import assert from 'node:assert/strict';
import { Vector3 } from 'three';
import { settings } from '../packs/sandbox/src/config/settings.js';
import { PerigeeHaloAbility, buildEditor as buildPerigee } from '../packs/sandbox/src/abilities/codex/PerigeeHaloAbility.js';
import perigee from '../packs/sandbox/src/config/codex/perigee.js';

settings.perigee ??= structuredClone(perigee.settings);

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

test('perigee: the halo is thrown, lands tilted on the rim, walks and tightens, falls flat, sinks; the cast ends', () => {
  const c = settings.perigee;
  const bodies = [body(0, 10), body(1.5, 11), body(-2, 9.5), body(0, 20)];
  const { a, counter } = arena(PerigeeHaloAbility, bodies);
  a.spawn(new Vector3(), new Vector3(0, 0, 1), 10);
  let frames = 0;
  let flew = false;
  let minFlightR = Infinity;
  let maxTilt = 0;
  let flatAfter = false;
  let minR = Infinity;
  let maxWell = 0;
  let phiStart = null;
  let lowest = Infinity;
  while (a.isActive && frames < 900) {
    a.update(1 / 30);
    if (a.phase === 'travel' && a.halo.visible) {
      flew = true;
      minFlightR = Math.min(minFlightR, a._haloR);
    }
    if (a.phase !== 'travel') {
      if (phiStart === null) phiStart = a._phi;
      maxTilt = Math.max(maxTilt, a._tilt);
      if (a.phase === 'fade' && a._tilt < 1e-3) flatAfter = true;
      if (a.halo.visible) minR = Math.min(minR, a._haloR);
      maxWell = Math.max(maxWell, a._wellAlpha);
      if (a.halo.visible) lowest = Math.min(lowest, a.halo.position.y);
    }
    assert.ok(finite(a.halo.position.toArray()) && Number.isFinite(a._phi), 'halo pose finite');
    frames++;
  }
  assert.ok(finite(a.haloGeometry.getAttribute('position').array), 'halo geometry finite');
  const seconds = frames / 30;
  assert.ok(seconds > 1.5 && seconds < 5, `screen time ${seconds}`);
  assert.ok(flew, 'the halo is seen in flight');
  const full = c.zoneRadius * c.haloFit;
  assert.ok(minFlightR < full * 0.5, 'it leaves the hand small');
  assert.ok(maxTilt > c.haloTilt * 0.9, 'it lands tilted');
  assert.ok(flatAfter, 'it falls flat');
  assert.ok(minR < full * (1 - c.haloTighten * 0.8), `it tightens (${minR})`);
  assert.ok(a._phi - phiStart > Math.PI, 'the contact walks round the rim');
  assert.ok(maxWell > 0.9, 'the well presses in');
  assert.ok(counter.decals > 6, 'the groove is cut');
  assert.equal(bodies[3].kills, 0, 'outside the circle is untouched');
  assert.ok(bodies.slice(0, 3).every((b) => b.kills === 1), 'the bodies inside are taken once');
  const keys = editorKeys(buildPerigee, c);
  for (const k of Object.keys(perigee.settings)) assert.ok(keys.has(k), `editor exposes ${k}`);
  a.destroy();
  assert.equal(a.halo.visible, false);
  assert.equal(a.well.visible, false);
  a.spawn(new Vector3(), new Vector3(0, 0, 1), 10);
  assert.equal(a._haloR, 0);
  assert.equal(a._landed, false);
  a.destroy();
  a.dispose();
});

import { PressCageAbility, buildEditor as buildPress } from '../packs/sandbox/src/abilities/codex/PressCageAbility.js';
import presscage from '../packs/sandbox/src/config/codex/presscage.js';

test('presscage: bars fly, plant in a ring, skid inward, spit the billet up, topple flat, go; the cast ends', () => {
  settings.presscage ??= structuredClone(presscage.settings);
  const c = settings.presscage;
  const bodies = [body(0, 10), body(1.5, 11), body(-2, 9.5), body(0, 20)];
  const { a, counter } = arena(PressCageAbility, bodies);
  a.spawn(new Vector3(), new Vector3(0, 0, 1), 10);
  let frames = 0;
  let flew = false;
  let minR = Infinity;
  let maxBillet = -Infinity;
  let killedBeforeSpit = false;
  let flatAfter = false;
  const m = new Float32Array(16);
  while (a.isActive && frames < 900) {
    a.update(1 / 30);
    if (a.phase === 'travel' && a.rams.visible) flew = true;
    if (a.phase !== 'travel') minR = Math.min(minR, a._ramR);
    maxBillet = Math.max(maxBillet, a._billetY);
    if (!a._spat && bodies.some((b) => b.kills)) killedBeforeSpit = true;
    if (a.rams.visible) {
      assert.ok(finite(a.rams.instanceMatrix.array), 'bar matrices finite');
      a.rams.instanceMatrix.array.slice(0, 16).forEach((v, k) => (m[k] = v));
      if (a._fell && Math.abs(m[5]) < 0.3 * c.ramHeight) flatAfter = true;
    }
    frames++;
  }
  const seconds = frames / 30;
  assert.ok(seconds > 1.5 && seconds < 5, `screen time ${seconds}`);
  assert.ok(flew, 'the bars are seen in flight');
  assert.ok(minR < c.zoneRadius * c.ramFit * 0.5, `the bars squeeze in (${minR})`);
  assert.ok(a._spat, 'the press spits');
  assert.ok(maxBillet > c.billetApex * 0.9, `the billet is spat up (${maxBillet})`);
  assert.ok(a._fell && flatAfter, 'the bars topple flat');
  assert.equal(killedBeforeSpit, false, 'hits still land on the echo, not before');
  assert.ok(counter.decals >= c.ramCount, 'a scorch under every shoe');
  assert.equal(bodies[3].kills, 0, 'outside the circle is untouched');
  assert.ok(bodies.slice(0, 3).every((b) => b.kills === 1), 'the bodies inside are taken once');
  const keys = editorKeys(buildPress, c);
  for (const k of Object.keys(presscage.settings)) assert.ok(keys.has(k), `editor exposes ${k}`);
  a.destroy();
  assert.equal(a.rams.visible, false);
  assert.equal(a.skid.visible, false);
  a.spawn(new Vector3(), new Vector3(0, 0, 1), 10);
  assert.equal(a._spat, false);
  assert.equal(a._fell, false);
  a.destroy();
  a.dispose();
});

import { RedshiftLanceAbility, buildEditor as buildRed } from '../packs/sandbox/src/abilities/codex/RedshiftLanceAbility.js';
import redshift from '../packs/sandbox/src/config/codex/redshift.js';

test('redshift: the lance stretches down the line, reddens, plunges, breaks up and goes; the cast ends', () => {
  settings.redshift ??= structuredClone(redshift.settings);
  const c = settings.redshift;
  const bodies = [body(0, 5), body(0.4, 9), body(3, 6)];
  const { a } = arena(RedshiftLanceAbility, bodies);
  a.spawn(new Vector3(), new Vector3(0, 0, 1), 12);
  let frames = 0;
  let firstLen = Infinity;
  let maxLen = 0;
  let shiftInTravel = 0;
  let maxShift = 0;
  let maxBreak = 0;
  while (a.isActive && frames < 900) {
    a.update(1 / 30);
    if (a.shaft.visible) {
      if (a.phase === 'travel') {
        firstLen = Math.min(firstLen, a._lanceLen);
        shiftInTravel = Math.max(shiftInTravel, a._shift);
      }
      maxLen = Math.max(maxLen, a._lanceLen);
    }
    maxShift = Math.max(maxShift, a._shift);
    maxBreak = Math.max(maxBreak, a._lanceP.brk);
    assert.ok(Number.isFinite(a._lanceLen) && Number.isFinite(a.head.position.x), 'lance finite');
    frames++;
  }
  const seconds = frames / 30;
  assert.ok(seconds > 1.5 && seconds < 5, `screen time ${seconds}`);
  assert.ok(firstLen < 3 && maxLen > 6.5, `the lance stretches down the line (${firstLen} → ${maxLen})`);
  assert.ok(shiftInTravel > 0.1 && shiftInTravel < 0.5, 'it starts reddening in flight');
  assert.ok(maxShift > 0.99, 'it ends fully red');
  assert.ok(maxBreak > 0.5, 'it breaks into segments');
  assert.ok(a._plunged, 'the head plunges');
  assert.equal(bodies[0].kills, 1);
  assert.equal(bodies[1].kills, 1);
  assert.equal(bodies[2].kills, 0, 'off the line is untouched');
  const keys = editorKeys(buildRed, c);
  for (const k of Object.keys(redshift.settings)) if (k !== 'zoneRadius') assert.ok(keys.has(k), `editor exposes ${k}`);
  a.destroy();
  assert.equal(a.shaft.visible, false);
  a.spawn(new Vector3(), new Vector3(0, 0, 1), 12);
  assert.equal(a._plunged, false);
  a.destroy();
  a.dispose();
});
