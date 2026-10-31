import test from 'node:test';
import assert from 'node:assert/strict';
import { Vector3 } from 'three';
import { settings } from '../packs/sandbox/src/config/settings.js';
import { AetherbladeCascadeAbility, buildEditor as aetherEditor } from '../packs/sandbox/src/abilities/matrix-new/AetherbladeCascadeAbility.js';
import { BileLanceAbility, buildEditor as bileEditor } from '../packs/sandbox/src/abilities/codex/BileLanceAbility.js';
import { MiasmaSpitAbility, buildEditor as miasmaEditor } from '../packs/sandbox/src/abilities/codex/MiasmaSpitAbility.js';
import aetherblade from '../packs/sandbox/src/config/matrix-new/aetherblade.js';
import bilelance from '../packs/sandbox/src/config/codex/bilelance.js';
import miasma from '../packs/sandbox/src/config/codex/miasma.js';

settings.aetherblade ??= structuredClone(aetherblade.settings);
settings.bilelance ??= structuredClone(bilelance.settings);
settings.miasma ??= structuredClone(miasma.settings);

const box = () => ({ value: { set() {}, copy() {} } });
function mockParticles(counter) {
  return {
    get() {
      const uniforms = new Proxy({}, { get: (t, k) => (t[k] ??= box()) });
      return { uniforms, setGradient() {}, emit: (n) => (counter.emits += n) };
    }
  };
}

function arena(Kind, bodies = []) {
  const counter = { emits: 0, decals: 0, bursts: 0, decalTypes: [] };
  const ctx = {
    particles: mockParticles(counter),
    lights: { acquire: () => ({}), set() {}, release() {} },
    decals: { spawn: (type) => (counter.decals++, counter.decalTypes.push(type)) },
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
  return { a: new Kind(ctx), counter };
}

function body(x, z) {
  return {
    alive: true,
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
    bodyPoint(out) {
      return out.copy(this.position).setY(0.9);
    }
  };
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

function run(a, onFrame) {
  let frames = 0;
  let maxEmit = 0;
  let emits = 0;
  while (a.isActive && frames < 900) {
    a.update(1 / 30);
    frames++;
    onFrame?.(frames);
  }
  return frames;
}

test('aetherblade: lit cores ride the glass, floor is branded, blades settle and crack before the shatter', () => {
  const bodies = [body(0, 6), body(0.4, 12), body(9, 6)];
  const { a, counter } = arena(AetherbladeCascadeAbility, bodies);
  a.spawn(new Vector3(), new Vector3(0, 0, 1), 12);
  let maxCores = 0;
  let coresMatchSwords = true;
  let maxPreCrack = 0;
  const frames = run(a, () => {
    maxCores = Math.max(maxCores, a.cores.count);
    if (a.cores.count !== a.swords.count) coresMatchSwords = false;
    maxPreCrack = Math.max(maxPreCrack, a._preCrack);
  });
  const seconds = frames / 30;
  assert.ok(seconds > 1.5 && seconds < 6, `screen time ${seconds}`);
  assert.ok(maxCores >= Math.round(settings.aetherblade.bladeCount), `cores drawn ${maxCores}`);
  assert.ok(coresMatchSwords, 'one core per sword');
  assert.equal(a.cores.instanceMatrix, a.swords.instanceMatrix);
  assert.ok(maxPreCrack > 0.1, 'cracks telegraph the exit');
  assert.ok(counter.decalTypes.filter((t) => t === 0).length >= Math.round(settings.aetherblade.bladeCount), 'a SCORCH brand per landing');
  assert.equal(bodies[0].kills + bodies[1].kills, 2);
  assert.equal(bodies[2].kills, 0);
  a.destroy();
  assert.equal(a.cores.count, 0);

  a.spawn(new Vector3(), new Vector3(0, 0, 1), 10);
  assert.equal(a._preCrack, 0);
  assert.equal(a.cores.count, 0);
  const keys = editorKeys(aetherEditor, settings.aetherblade);
  for (const k of Object.keys(aetherblade.settings)) assert.ok(keys.has(k), `editor exposes ${k}`);
  let disposed = 0;
  a.coreMaterial.addEventListener('dispose', () => disposed++);
  a.destroy();
  a.dispose();
  assert.equal(disposed, 1);
});

test('bilelance: the eruption raises a geyser that slumps, bubbles and sinks; hits unchanged', () => {
  const c = settings.bilelance;
  const bodies = [body(0, 5), body(0.3, 12), body(-1, 12.5), body(8, 5)];
  const { a } = arena(BileLanceAbility, bodies);
  a.spawn(new Vector3(), new Vector3(0, 0, 1), 12);
  const heights = [];
  const frames = run(a, () => {
    if (a.geyser.visible) heights.push(a._geyserState.height);
  });
  const seconds = frames / 30;
  assert.ok(seconds > 1.5 && seconds < 5, `screen time ${seconds}`);
  const peak = Math.max(...heights);
  assert.ok(peak > c.geyserHeight * 0.9, `geyser bursts up ${peak}`);
  assert.ok(heights.length / 30 > 1.2, `geyser lives ${heights.length / 30}s`);
  // It keeps changing: slumps to a heap, then sinks.
  const late = heights.slice(-8);
  assert.ok(late.at(-1) < c.heapHeight, 'heap sinks back');
  let changes = 0;
  for (let i = 1; i < heights.length; i++) if (Math.abs(heights[i] - heights[i - 1]) > 1e-4) changes++;
  assert.ok(changes > heights.length * 0.5, 'the silhouette keeps moving');
  assert.equal(bodies.slice(0, 3).reduce((n, b) => n + b.kills, 0), 3);
  assert.equal(bodies[3].kills, 0);
  a.destroy();
  assert.ok(!a.geyser.visible);
  a.spawn(new Vector3(), new Vector3(0, 0, 1), 10);
  assert.equal(a._eruptAge, -1);
  assert.ok(!a.geyser.visible);

  const keys = editorKeys(bileEditor, c);
  for (const k of Object.keys(bilelance.settings)) assert.ok(keys.has(k), `editor exposes ${k}`);
  let disposed = 0;
  for (const r of [a.geyserMaterial, a.geyserGeometry]) r.addEventListener('dispose', () => disposed++);
  a.destroy();
  a.dispose();
  assert.equal(disposed, 2);
});

test('miasma: plumes thicken the reek, the crown lives longer, editor exposes the new keys', () => {
  const { a, counter } = arena(MiasmaSpitAbility);
  a.spawn(new Vector3(), new Vector3(0, 0, 1), 10);
  let crownFrames = 0;
  const frames = run(a, () => {
    if (a.crown.visible) crownFrames++;
  });
  const seconds = frames / 30;
  assert.ok(seconds > 1.5 && seconds < 7, `screen time ${seconds}`);
  assert.ok(crownFrames / 30 > 0.8, `crown stands ${crownFrames / 30}s`);
  assert.ok(counter.emits > 0);
  a.destroy();
  a.spawn(new Vector3(), new Vector3(0, 0, 1), 10);
  assert.equal(a._plumeClock, 0);

  const keys = editorKeys(miasmaEditor, settings.miasma);
  for (const k of ['plumeEvery', 'plumePuffs', 'plumeSize', 'plumeRise', 'plumeHeight']) assert.ok(keys.has(k), `editor exposes ${k}`);
  a.destroy();
  a.dispose();
});
