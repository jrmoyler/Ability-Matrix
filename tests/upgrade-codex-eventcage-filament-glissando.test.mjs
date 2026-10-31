import test from 'node:test';
import assert from 'node:assert/strict';
import { Vector3 } from 'three';
import { settings } from '../packs/sandbox/src/config/settings.js';
import { EventCageAbility, buildEditor as buildCage } from '../packs/sandbox/src/abilities/codex/EventCageAbility.js';
import eventcage from '../packs/sandbox/src/config/codex/eventcage.js';
import { FilamentVolleyAbility, buildEditor as buildFil } from '../packs/sandbox/src/abilities/codex/FilamentVolleyAbility.js';
import filament from '../packs/sandbox/src/config/codex/filament.js';

settings.eventcage ??= structuredClone(eventcage.settings);
settings.filament ??= structuredClone(filament.settings);

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

test('eventcage: bars fall during travel, slam in a ring, close in steps on a hole, are erased, the cast ends', () => {
  const c = settings.eventcage;
  const bodies = [body(0, 10), body(1.5, 11), body(-2, 9.5), body(0, 20)];
  const { a, counter } = arena(EventCageAbility, bodies);
  a.spawn(new Vector3(), new Vector3(0, 0, 1), 10);
  let frames = 0;
  let fellInTravel = false;
  let seedFlew = false;
  let maxClose = 0;
  let maxPit = 0;
  let erased = false;
  let minRing = Infinity;
  const centre = new Vector3(0, 0, 10);
  const m = new Float32Array(16);
  while (a.isActive && frames < 900) {
    a.update(1 / 30);
    if (a.phase === 'travel' && a.bars.visible) fellInTravel = true;
    if (a.seed.visible) seedFlew = true;
    maxClose = Math.max(maxClose, a._cageClose);
    maxPit = Math.max(maxPit, a._pitR);
    if (a.bars.visible) {
      assert.ok(finite(a.bars.instanceMatrix.array), 'bar matrices finite');
      for (let i = 0; i < a.bars.count; i++) {
        a.bars.instanceMatrix.array.slice(i * 16, i * 16 + 16).forEach((v, k) => (m[k] = v));
        if (m[5] > 0.5) minRing = Math.min(minRing, Math.hypot(m[12] - centre.x, m[14] - centre.z));
      }
      const e = a.barGeometry.getAttribute('aBar');
      for (let i = 0; i < a.bars.count; i++) if (e.getY(i) > 0.5) erased = true;
    }
    frames++;
  }
  const seconds = frames / 30;
  assert.ok(seconds > 1.5 && seconds < 5, `screen time ${seconds}`);
  assert.ok(fellInTravel, 'the bars fall while the event is in flight');
  assert.ok(seedFlew, 'the event is seen travelling');
  assert.ok(maxClose > 0.99, 'the cage closes fully');
  assert.ok(minRing < c.zoneRadius * c.cageFit * 0.75, `bars move in toward the centre (${minRing})`);
  assert.ok(maxPit > 0.5, 'the missing centre opens');
  assert.ok(erased, 'the bars are erased');
  assert.ok(a._cageStep === Math.round(c.cageSteps), 'every closing event lands');
  assert.ok(counter.decals >= c.cageBars, 'a scorch under every foot');
  assert.equal(bodies[3].kills, 0, 'outside the circle is untouched');
  assert.ok(bodies.slice(0, 3).every((b) => b.kills === 1), 'the bodies inside are taken once');
  const keys = editorKeys(buildCage, c);
  for (const k of Object.keys(eventcage.settings)) assert.ok(keys.has(k), `editor exposes ${k}`);
  a.destroy();
  assert.equal(a.bars.visible, false);
  assert.equal(a.pit.visible, false);
  a.spawn(new Vector3(), new Vector3(0, 0, 1), 10);
  assert.equal(a._cageStep, 0);
  assert.equal(a._pitR, 0);
  a.destroy();
  a.dispose();
});

test('filament: bolts draw arc by arc, barbs plant where hits land, the stitch cinches, unravels, the cast ends', () => {
  const c = settings.filament;
  const bodies = [body(0, 11.5), body(1.2, 11), body(-1.2, 1)];
  const { a, counter } = arena(FilamentVolleyAbility, bodies);
  a.spawn(new Vector3(), new Vector3(0, 0, 1), 12);
  const n = Math.round(c.count);
  let frames = 0;
  let drawingInTravel = false;
  let maxHeight = 0;
  let minHeightAfter = Infinity;
  let unravelled = false;
  while (a.isActive && frames < 900) {
    a.update(1 / 30);
    const arc = a.filGeometry.getAttribute('aArc');
    if (a.phase === 'travel' && a.filaments.visible) drawingInTravel = true;
    for (let k = 0; k < a.filaments.count; k++) {
      if (arc.getY(k) <= 0) continue;
      if (a.phase === 'travel') maxHeight = Math.max(maxHeight, arc.getX(k));
      else if (arc.getX(k) > 0) minHeightAfter = Math.min(minHeightAfter, arc.getX(k));
      if (arc.getW(k) > 0.5) unravelled = true;
    }
    assert.ok(finite(a.filGeometry.getAttribute('aStart').array), 'arc ends finite');
    assert.ok(finite(a.barbs.instanceMatrix.array), 'barb matrices finite');
    frames++;
  }
  const seconds = frames / 30;
  assert.ok(seconds > 1.5 && seconds < 5, `screen time ${seconds}`);
  assert.ok(drawingInTravel, 'the bolts are seen in flight');
  for (let i = 0; i < n; i++) assert.ok(a._planted[i] >= 0, `barb ${i} planted`);
  assert.ok(minHeightAfter < maxHeight, 'the stitch cinches tight after the beat');
  assert.ok(unravelled, 'the stitch unravels');
  assert.ok(counter.decals >= n, 'a scorch under every barb');
  assert.ok(bodies.every((b) => b.kills <= 1));
  const keys = editorKeys(buildFil, c);
  for (const k of Object.keys(filament.settings)) if (k !== 'zoneRadius') assert.ok(keys.has(k), `editor exposes ${k}`);
  a.destroy();
  assert.equal(a.filaments.visible, false);
  assert.equal(a.barbs.visible, false);
  a.spawn(new Vector3(), new Vector3(0, 0, 1), 12);
  assert.ok(Array.from(a._planted).every((t) => t === -1), 'spawn resets the barbs');
  a.destroy();
  a.dispose();
});

import { GlissandoSweepAbility, buildEditor as buildGliss } from '../packs/sandbox/src/abilities/codex/GlissandoSweepAbility.js';
import glissando from '../packs/sandbox/src/config/codex/glissando.js';

test('glissando: one wall of sound rises ahead of the caster, slides in late, rings, tears, the cast ends', () => {
  settings.glissando ??= structuredClone(glissando.settings);
  const c = settings.glissando;
  const bodies = [body(0, 11), body(0.6, 6), body(5, 6)];
  const { a } = arena(GlissandoSweepAbility, bodies);
  a.spawn(new Vector3(), new Vector3(0, 0, 1), 12);
  let frames = 0;
  let minAhead = Infinity;
  let maxAhead = 0;
  let sawInTravel = false;
  let tore = false;
  while (a.isActive && frames < 900) {
    a.update(1 / 30);
    if (a.sheet.visible) {
      const ahead = a._sheetAt.z;
      minAhead = Math.min(minAhead, ahead);
      maxAhead = Math.max(maxAhead, ahead);
      if (a.phase === 'travel') sawInTravel = true;
      assert.ok(finite(a.sheetGeometry.getAttribute('aCentre').array), 'sheet finite');
      if (a.sheetGeometry.getAttribute('aSheet').getW(0) > 0.5) tore = true;
    }
    frames++;
  }
  const seconds = frames / 30;
  assert.ok(seconds > 1.5 && seconds < 5, `screen time ${seconds}`);
  assert.ok(sawInTravel, 'the sheet is seen travelling');
  assert.ok(minAhead >= c.sheetStart - 1e-6, `it never stands over the caster (${minAhead})`);
  assert.ok(maxAhead > 12, 'it glides on past the end, late');
  assert.ok(tore, 'it tears at the end');
  assert.ok(bodies.every((b) => b.kills <= 1));
  assert.equal(bodies[2].kills, 0, 'well off the line is untouched');
  const keys = editorKeys(buildGliss, c);
  for (const k of Object.keys(glissando.settings)) if (k !== 'zoneRadius') assert.ok(keys.has(k), `editor exposes ${k}`);
  a.destroy();
  assert.equal(a.sheet.visible, false);
  a.dispose();
});
