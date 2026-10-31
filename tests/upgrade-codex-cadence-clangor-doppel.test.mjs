import test from 'node:test';
import assert from 'node:assert/strict';
import { Vector3 } from 'three';
import { settings } from '../packs/sandbox/src/config/settings.js';
import { ClangorCageAbility, buildEditor as clangorEditor } from '../packs/sandbox/src/abilities/codex/ClangorCageAbility.js';
import clangor from '../packs/sandbox/src/config/codex/clangor.js';
import { CadenceVolleyAbility, buildEditor as cadenceEditor } from '../packs/sandbox/src/abilities/codex/CadenceVolleyAbility.js';
import cadence from '../packs/sandbox/src/config/codex/cadence.js';
import { DoppelLanceAbility, buildEditor as doppelEditor } from '../packs/sandbox/src/abilities/codex/DoppelLanceAbility.js';
import doppel from '../packs/sandbox/src/config/codex/doppel.js';

settings.clangor ??= structuredClone(clangor.settings);
settings.cadence ??= structuredClone(cadence.settings);
settings.doppel ??= structuredClone(doppel.settings);

const box = () => ({ value: { set() {}, copy() {} } });
function mockParticles(counter) {
  return {
    get() {
      const uniforms = new Proxy({}, { get: (t, k) => (t[k] ??= box()) });
      return { uniforms, setGradient() {}, emit: (n) => (counter.emits += n) };
    }
  };
}

function arena(Ability, bodies = []) {
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


test('clangor: a bell cage drops, slams, clangs round the ring inward, is driven down, the cast ends', () => {
  const bodies = [body(0, 10), body(1.5, 11), body(-2, 9)];
  const { a, counter } = arena(ClangorCageAbility, bodies);
  a.spawn(new Vector3(), new Vector3(0, 0, 1), 10);
  const c = settings.clangor;
  let frames = 0;
  let falling = 0;
  let maxTubes = 0;
  let floorFrames = 0;
  let maxEmit = 0;
  const closes = [];
  while (a.isActive && frames < 600) {
    const before = counter.emits;
    a.update(1 / 30);
    maxEmit = Math.max(maxEmit, counter.emits - before);
    frames++;
    if (a.phase === 'travel' && a.tubes.visible) falling++;
    if (a.tubes.visible) maxTubes = Math.max(maxTubes, a.tubes.count);
    if (a.floor.visible) floorFrames++;
    if (a.phase !== 'travel') closes.push(a._bellClose);
  }
  const seconds = frames / 30;
  assert.ok(seconds > 1.5 && seconds < 4.5, `screen time ${seconds}`);
  assert.ok(falling > 2, 'the cage is seen falling');
  assert.equal(maxTubes, Math.round(c.bellTubes));
  assert.ok(floorFrames / 30 > 1.2, `pressure floor stays ${floorFrames / 30}s`);
  assert.equal(a._clangsFired, Math.round(c.bellTubes) * Math.round(c.bellRounds), 'every clang fired');
  assert.ok(Math.max(...closes) > 0.9, 'the ring closed inward');
  assert.ok(bodies.reduce((n, b) => n + b.kills, 0) === 3, 'hits unchanged: all in the circle on the beat');
  assert.ok(maxEmit < 2000);
  for (let i = 0; i < 16 * 16; i++) assert.ok(Number.isFinite(a.tubes.instanceMatrix.array[i]), 'finite tube matrices');
  a.destroy();
  assert.ok(!a.tubes.visible && !a.hoop.visible && !a.floor.visible);
});

test('clangor: reuse resets, editor exposes every key, dispose frees', () => {
  const { a } = arena(ClangorCageAbility);
  a.spawn(new Vector3(), new Vector3(0, 0, 1), 10);
  for (let i = 0; i < 50; i++) a.update(1 / 30);
  a.destroy();
  a.spawn(new Vector3(), new Vector3(0, 0, 1), 10);
  assert.equal(a._clangsFired, 0);
  assert.ok(!a.tubes.visible && !a.floor.visible);
  const keys = editorKeys(clangorEditor, settings.clangor);
  for (const k of Object.keys(clangor.settings)) assert.ok(keys.has(k), `editor has ${k}`);
  a.dispose();
});

test('cadence: forks fly, plant on their strike points, ring on the downbeat, topple, the cast ends', () => {
  const bodies = [body(0, 12.2), body(0.6, 6.5), body(-1, 2)];
  const { a, counter } = arena(CadenceVolleyAbility, bodies);
  a.spawn(new Vector3(), new Vector3(0, 0, 1), 13);
  const c = settings.cadence;
  let frames = 0;
  let flying = 0;
  let poolFrames = 0;
  let maxEmit = 0;
  const rings = [];
  while (a.isActive && frames < 600) {
    const before = counter.emits;
    a.update(1 / 30);
    maxEmit = Math.max(maxEmit, counter.emits - before);
    frames++;
    if (a.phase === 'travel' && a.forks.visible) flying++;
    if (a.pool.visible) poolFrames++;
    if (a.phase !== 'travel') rings.push(a._forkState[(Math.round(c.count) - 1) * 4 + 1]);
  }
  const seconds = frames / 30;
  assert.ok(seconds > 1.5 && seconds < 4.5, `screen time ${seconds}`);
  assert.ok(flying > 3, 'forks are seen in the air');
  for (const f of a._forks.slice(0, Math.round(c.count))) assert.ok(f.land >= 0, 'every fork landed');
  assert.ok(a._downAt > 0, 'the downbeat fired');
  assert.ok(poolFrames / 30 > 1.2, `pools stay ${poolFrames / 30}s`);
  assert.ok(rings[rings.length - 1] < 0.05, 'the hum dies as they topple');
  assert.ok(bodies.reduce((n, b) => n + b.kills, 0) >= 1);
  assert.ok(maxEmit < 2000);
  for (const v of a.forks.instanceMatrix.array) assert.ok(Number.isFinite(v));
  a.destroy();
  assert.ok(!a.forks.visible && !a.pool.visible);
});

test('cadence: reuse resets, editor exposes every key, dispose frees', () => {
  const { a } = arena(CadenceVolleyAbility);
  a.spawn(new Vector3(), new Vector3(0, 0, 1), 10);
  for (let i = 0; i < 40; i++) a.update(1 / 30);
  a.destroy();
  a.spawn(new Vector3(), new Vector3(0, 0, 1), 10);
  assert.ok(a._forks.every((f) => f.land < 0) && a._downAt < 0);
  const keys = editorKeys(cadenceEditor, settings.cadence);
  for (const k of Object.keys(cadence.settings)) if (k !== 'zoneRadius') assert.ok(keys.has(k), `editor has ${k}`);
  a.dispose();
});

test('doppel: the decoy flies late, the unseen lance cuts off the aim, the decoy shatters, the real lance is planted and drills, the cast ends', () => {
  const off = settings.doppel.thickness * 4;
  const onAim = body(0, 6);
  const onCut = body(-off, 6); // side is to the right of +z: (-1, 0, 0) for this aim
  const sideA = body(off, 6);
  const { a, counter } = arena(DoppelLanceAbility, [onAim, onCut, sideA]);
  a.spawn(new Vector3(), new Vector3(0, 0, 1), 12);
  let frames = 0;
  let ghostFrames = 0;
  let lanceFrames = 0;
  let shardFrames = 0;
  let maxEmit = 0;
  const lanceDepth = [];
  while (a.isActive && frames < 600) {
    const before = counter.emits;
    a.update(1 / 30);
    maxEmit = Math.max(maxEmit, counter.emits - before);
    frames++;
    if (a.phase === 'travel' && a.ghosts.visible) ghostFrames++;
    if (a.lance.visible) {
      lanceFrames++;
      lanceDepth.push(a.lance.position.y);
    }
    if (a.shards.visible) shardFrames++;
  }
  const seconds = frames / 30;
  assert.ok(seconds > 1.5 && seconds < 4.5, `screen time ${seconds}`);
  assert.ok(ghostFrames > 3, 'the decoy and the cloak are seen in flight');
  assert.ok(lanceFrames / 30 > 1, `the real lance stands ${lanceFrames / 30}s`);
  assert.ok(shardFrames > 10, 'the decoy shatters');
  assert.ok(a._planted, 'the lance was driven in');
  assert.ok(lanceDepth[lanceDepth.length - 1] < lanceDepth[0], 'it drills down');
  // Hits unchanged: the cut is a body-width to the side of the aim.
  const sx = a.side.x;
  const hitOff = sx > 0 ? sideA : onCut;
  const farSide = sx > 0 ? onCut : sideA;
  assert.equal(hitOff.kills, 1, 'the body on the offset falls');
  assert.equal(farSide.kills, 0, 'a body-width the other side of the aim is untouched');
  assert.ok(maxEmit < 2000);
  for (const v of a.shards.instanceMatrix.array) assert.ok(Number.isFinite(v));
  a.destroy();
  assert.ok(!a.lance.visible && !a.ghosts.visible && !a.shards.visible);
});

test('doppel: reuse resets, editor exposes every key, a twist change rebuilds, dispose frees', () => {
  const { a } = arena(DoppelLanceAbility);
  a.spawn(new Vector3(), new Vector3(0, 0, 1), 10);
  for (let i = 0; i < 40; i++) a.update(1 / 30);
  a.destroy();
  a.spawn(new Vector3(), new Vector3(0, 0, 1), 10);
  assert.ok(a._shatterAge < 0 && !a._planted);
  const keys = editorKeys(doppelEditor, settings.doppel);
  for (const k of Object.keys(doppel.settings)) if (k !== 'zoneRadius') assert.ok(keys.has(k), `editor has ${k}`);
  const twist = settings.doppel.lanceTwist;
  settings.doppel.lanceTwist = twist + 1;
  a.update(1 / 30);
  assert.equal(a._builtTwist, twist + 1);
  settings.doppel.lanceTwist = twist;
  a.dispose();
});
