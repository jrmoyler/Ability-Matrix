import test from 'node:test';
import assert from 'node:assert/strict';
import { Vector3 } from 'three';
import { settings } from '../packs/sandbox/src/config/settings.js';
import { DuskSpireAbility, buildEditor as duskEditor } from '../packs/sandbox/src/abilities/codex/DuskSpireAbility.js';
import { FacetVolleyAbility, buildEditor as facetEditor } from '../packs/sandbox/src/abilities/codex/FacetVolleyAbility.js';
import { FalseFloorAbility, buildEditor as floorEditor } from '../packs/sandbox/src/abilities/codex/FalseFloorAbility.js';
import duskspire from '../packs/sandbox/src/config/codex/duskspire.js';
import facetvolley from '../packs/sandbox/src/config/codex/facetvolley.js';
import falsefloor from '../packs/sandbox/src/config/codex/falsefloor.js';

settings.duskspire ??= structuredClone(duskspire.settings);
settings.facetvolley ??= structuredClone(facetvolley.settings);
settings.falsefloor ??= structuredClone(falsefloor.settings);

const box = () => ({ value: { set() {}, copy() {} } });
function arena(Ability, bodies = []) {
  const counter = { emits: 0, decals: 0, shakes: 0 };
  const ctx = {
    particles: {
      get() {
        const uniforms = new Proxy({}, { get: (t, k) => (t[k] ??= box()) });
        return { uniforms, setGradient() {}, emit: (n) => (counter.emits += n) };
      }
    },
    lights: { acquire: () => ({}), set() {}, release() {} },
    decals: { spawn: () => counter.decals++ },
    bursts: { spawn() {} },
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
  return { a: new Ability(ctx), counter };
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
    carry() {},
    release() {}
  };
}

function run(a, frames = 600, each = () => {}) {
  let n = 0;
  let maxEmit = 0;
  while (a.isActive && n < frames) {
    a.update(1 / 30);
    n++;
    each(n);
  }
  return { n, maxEmit };
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

test('duskspire: columns erupt round the circle, lean in and sink as the spire drinks; hits unchanged', () => {
  const c = settings.duskspire;
  const bodies = [body(0, 12), body(2, 12.5), body(-2.5, 11.5), body(9, 12)];
  const { a, counter } = arena(DuskSpireAbility, bodies);
  a.spawn(new Vector3(), new Vector3(0, 0, 1), 12);
  let runnerFrames = 0;
  let spireMin = Infinity;
  let spireMax = 0;
  const leans = [];
  const scratch = { m: null };
  run(a, 600, () => {
    if (a.phase === 'travel' && a.runner.visible) runnerFrames++;
    if (a.spire.visible && a.spire.position.y > -0.01) {
      spireMin = Math.min(spireMin, a.spire.scale.y);
      spireMax = Math.max(spireMax, a.spire.scale.y);
    }
    if (a.columns.visible && a.columns.count > 0 && a.phase !== 'travel') {
      a.columns.getMatrixAt(0, (scratch.m ??= new a.spire.matrix.constructor()));
      leans.push(scratch.m.elements[5]); // cos(lean) × height: falls as the column leans in and sinks
    }
  });
  assert.ok(runnerFrames > 3, 'a shadow crawls from the hand');
  assert.equal(a.columns.count, Math.round(c.spireColumns));
  assert.ok(spireMax > spireMin * 1.2, `the spire grows as it drinks (${spireMin} → ${spireMax})`);
  assert.ok(spireMax <= c.heroMaxHeight + 1e-6, 'the spire stays under the frame cap');
  assert.ok(leans.at(-1) < Math.max(...leans) * 0.9, 'the columns lean in and sink');
  assert.equal(bodies.slice(0, 3).reduce((n, b) => n + b.kills, 0), 3);
  assert.equal(bodies[3].kills, 0);
  assert.ok(counter.decals >= Math.round(c.spireColumns) + 2, 'each column cracks the floor');
  a.destroy();
  assert.ok(!a.columns.visible && !a.spire.visible && !a.pool.visible && !a.runner.visible);
});

test('facetvolley: seeds fly, each plants on the strike of its part and grows a cluster; the clusters shatter and sink', () => {
  const c = settings.facetvolley;
  const n = Math.round(c.count);
  // Two bodies on the last two part points (for a +z cast the lanes run along side = −x).
  const bodies = [body(-0.8, 11.9), body(-0.5, 9.7), body(30, 30)];
  const { a, counter } = arena(FacetVolleyAbility, bodies);
  a.spawn(new Vector3(), new Vector3(0, 0, 1), 13);
  let seedsInFlight = 0;
  let maxPrisms = 0;
  let lastPrisms = 0;
  let planted = 0;
  run(a, 600, () => {
    if (a.phase === 'travel') seedsInFlight = Math.max(seedsInFlight, a.seeds.count);
    maxPrisms = Math.max(maxPrisms, a.prisms.count);
    lastPrisms = a.prisms.count;
    planted = Math.max(planted, Array.from(a._plantAge.slice(0, n)).filter((t) => t >= 0).length);
  });
  assert.ok(seedsInFlight >= 2, 'seeds are in the air together');
  assert.equal(planted, n, 'every seed plants');
  assert.equal(maxPrisms, n * Math.round(c.clusterSize));
  assert.ok(lastPrisms < maxPrisms, 'the clusters go at the end');
  assert.equal(bodies[0].kills + bodies[1].kills, 2);
  assert.equal(bodies[2].kills, 0);
  assert.ok(counter.decals >= n * 2, 'each planting marks the floor');
  assert.ok(counter.shakes >= n, 'each planting lands with a punch');
  a.destroy();
  assert.ok(!a.seeds.visible && !a.prisms.visible);
});

test('falsefloor: the circle paves, drops into a pit that opens and closes, and the floor reforms', () => {
  const c = settings.falsefloor;
  const bodies = [body(0, 12), body(1.5, 12.5), body(9, 12)];
  const { a } = arena(FalseFloorAbility, bodies);
  a.spawn(new Vector3(), new Vector3(0, 0, 1), 12);
  let paved = 0;
  let wave = 0;
  let emptied = false;
  let reformed = 0;
  let pitOpen = 0;
  let pitClosed = false;
  run(a, 600, () => {
    if (a.phase === 'travel') {
      paved = Math.max(paved, a.tiles.count);
      wave = Math.max(wave, a.path.count);
    } else {
      if (a.tiles.count === 0) emptied = true;
      if (emptied) reformed = Math.max(reformed, a.tiles.count);
      if (a.pit.visible) pitOpen = Math.max(pitOpen, a.pitMaterial.uniforms.uOpen.value);
      if (pitOpen > 0.9 && !a.pit.visible) pitClosed = true;
    }
  });
  assert.ok(paved > 20, `the circle paves itself (${paved})`);
  assert.ok(wave > 0, 'a wave of flagstones runs from the hand');
  assert.ok(emptied, 'every slab drops');
  assert.ok(pitOpen > 0.95, 'the pit opens');
  assert.ok(reformed >= paved * 0.9, 'the floor reforms');
  assert.ok(pitClosed, 'the pit closes again');
  assert.equal(bodies[0].kills + bodies[1].kills, 2);
  assert.equal(bodies[2].kills, 0);
  assert.ok(c.pitDepth > 0);
  a.destroy();
  assert.ok(!a.tiles.visible && !a.path.visible && !a.pit.visible);
});

test('the three casts: reuse resets, every key is a live slider, dispose frees', () => {
  for (const [Ability, build, cfg, parts] of [
    [DuskSpireAbility, duskEditor, duskspire, (a) => [a.columnGeometry, a.spireGeometry, a.columnMaterial, a.spireMaterial, a.poolMaterial, a.runnerMaterial]],
    [FacetVolleyAbility, facetEditor, facetvolley, (a) => [a.seedGeometry, a.prismGeometry, a.crystalMaterial]],
    [FalseFloorAbility, floorEditor, falsefloor, (a) => [a.tileGeometry, a.pathGeometry, a.tileMaterial, a.pitGeometry, a.pitMaterial]]
  ]) {
    const { a } = arena(Ability);
    a.spawn(new Vector3(), new Vector3(0, 0, 1), 10);
    for (let i = 0; i < 50; i++) a.update(1 / 30);
    a.destroy();
    a.spawn(new Vector3(), new Vector3(0, 0, 1), 10);
    assert.equal(a._since ?? -1, -1, `${cfg.id} clock resets`);
    if (a._plantAge) assert.ok(Array.from(a._plantAge).every((t) => t === -1), 'seeds reset');

    const keys = editorKeys(build, settings[cfg.id]);
    // The generated line casts never exposed the unused zoneRadius / groundLand / groundTelegraph.
    const skip = cfg.meta.cast === 'line' ? new Set(['zoneRadius', 'groundLand', 'groundTelegraph']) : new Set();
    for (const k of Object.keys(cfg.settings)) if (!skip.has(k)) assert.ok(keys.has(k), `${cfg.id} editor exposes ${k}`);

    let disposed = 0;
    const res = parts(a);
    for (const r of res) r.addEventListener('dispose', () => disposed++);
    a.destroy();
    a.dispose();
    assert.equal(disposed, res.length, `${cfg.id} frees its own resources`);
  }
});
