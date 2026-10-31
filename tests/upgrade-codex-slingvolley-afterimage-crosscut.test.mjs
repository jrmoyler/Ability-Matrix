import test from 'node:test';
import assert from 'node:assert/strict';
import { Vector3 } from 'three';
import { settings } from '../packs/sandbox/src/config/settings.js';
import { SlingVolleyAbility, buildEditor as slingEditor } from '../packs/sandbox/src/abilities/codex/SlingVolleyAbility.js';
import slingvolley from '../packs/sandbox/src/config/codex/slingvolley.js';
import { AfterimageSwingAbility, buildEditor as afterEditor } from '../packs/sandbox/src/abilities/codex/AfterimageSwingAbility.js';
import afterimage from '../packs/sandbox/src/config/codex/afterimage.js';
import { CrosscutGustAbility, buildEditor as crossEditor } from '../packs/sandbox/src/abilities/codex/CrosscutGustAbility.js';
import crosscut from '../packs/sandbox/src/config/codex/crosscut.js';

settings.slingvolley ??= structuredClone(slingvolley.settings);
settings.afterimage ??= structuredClone(afterimage.settings);
settings.crosscut ??= structuredClone(crosscut.settings);

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
    corrode() {}
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

test('slingvolley: lit stones fly, land on their strike points, spin down in craters, the cast ends', () => {
  const bodies = [body(0, 12.2), body(0.6, 6.5), body(-1, 2)];
  const { a, counter } = arena(SlingVolleyAbility, bodies);
  a.spawn(new Vector3(), new Vector3(0, 0, 1), 13.2);
  const c = settings.slingvolley;
  let frames = 0;
  let flying = 0;
  let maxStones = 0;
  let craterFrames = 0;
  let cordFrames = 0;
  let maxEmit = 0;
  const blurLate = [];
  while (a.isActive && frames < 600) {
    const before = counter.emits;
    a.update(1 / 30);
    maxEmit = Math.max(maxEmit, counter.emits - before);
    frames++;
    if (a.phase === 'travel' && a.stones.visible) flying++;
    maxStones = Math.max(maxStones, a.stones.count);
    if (a.crater.visible) craterFrames++;
    if (a.cord.visible) cordFrames++;
    if (a.phase !== 'travel' && a.stones.count) blurLate.push(a._stoneState[3]);
  }
  const seconds = frames / 30;
  assert.ok(seconds > 1.5 && seconds < 4.5, `screen time ${seconds}`);
  assert.ok(flying > 3, 'stones are seen in the air');
  assert.ok(maxStones >= Math.round(c.count) && maxStones <= Math.round(c.count) + 1, `stones ${maxStones}`); // + the stone in the sling's pouch
  assert.ok(craterFrames / 30 > 1.2, `craters stay ${craterFrames / 30}s`);
  assert.ok(cordFrames > 3, 'the sling whirls at the fist');
  assert.ok(blurLate[0] > blurLate[Math.floor(blurLate.length / 2)], 'the stones spin down through the linger');
  for (const s of a._stones.slice(0, Math.round(c.count))) assert.ok(s.land >= 0, 'every stone landed');
  assert.ok(bodies.reduce((n, b) => n + b.kills, 0) >= 1);
  assert.ok(counter.decals >= Math.round(c.count) && counter.shakes >= Math.round(c.count));
  assert.ok(maxEmit < 2000);
  a.destroy();
  assert.ok(!a.stones.visible && !a.blur.visible && !a.crater.visible && !a.cord.visible);
});

test('slingvolley: reuse resets, editor exposes every key, dispose frees', () => {
  const { a } = arena(SlingVolleyAbility);
  a.spawn(new Vector3(), new Vector3(0, 0, 1), 10);
  for (let i = 0; i < 40; i++) a.update(1 / 30);
  a.destroy();
  a.spawn(new Vector3(), new Vector3(0, 0, 1), 10);
  assert.ok(a._stones.every((s) => s.land === -1));
  assert.equal(a.stones.count, 0);
  const keys = editorKeys(slingEditor, settings.slingvolley);
  for (const k of Object.keys(slingvolley.settings)) assert.ok(keys.has(k) || k === 'zoneRadius', `editor exposes ${k}`);
  let disposed = 0;
  for (const r of [a.stoneMaterial, a.stoneGeometry, a.blurMaterial, a.craterMaterial, a.cordGeometry]) r.addEventListener('dispose', () => disposed++);
  a.destroy();
  a.dispose();
  assert.equal(disposed, 5);
});

test('afterimage: the decoy leaves afterimages, the real blade cuts the group on the beat and breaks them coming back', () => {
  const bodies = [body(0, 13.2), body(0.8, 13.6), body(-0.9, 12.8), body(0.3, 6)];
  const { a, counter } = arena(AfterimageSwingAbility, bodies);
  a.spawn(new Vector3(), new Vector3(0, 0, 1), 13.2);
  const c = settings.afterimage;
  let frames = 0;
  let maxGhosts = 0;
  let bladeFrames = 0;
  let cutFrames = 0;
  let floorFrames = 0;
  let killedBeforeBeat = 0;
  let maxEmit = 0;
  const along = [];
  while (a.isActive && frames < 600) {
    const before = counter.emits;
    a.update(1 / 30);
    maxEmit = Math.max(maxEmit, counter.emits - before);
    frames++;
    if (a.phase === 'travel') {
      maxGhosts = Math.max(maxGhosts, a.ghosts.count);
      killedBeforeBeat = bodies.reduce((n, b) => n + b.kills, 0);
    }
    if (a.blade.visible) {
      bladeFrames++;
      along.push(a._bladeAlong);
    }
    if (a.cut.visible) cutFrames++;
    if (a.floor.visible) floorFrames++;
  }
  const seconds = frames / 30;
  assert.ok(seconds > 1.5 && seconds < 4.5, `screen time ${seconds}`);
  assert.equal(killedBeforeBeat, 0, 'the decoy kills nothing');
  assert.ok(maxGhosts >= 1 + Math.round(c.ghostCount) - 1, `afterimages ${maxGhosts}`);
  assert.ok(bladeFrames / 30 > 1.2, `blade stands ${bladeFrames / 30}s`);
  assert.ok(along[0] > 0.95 && along.at(-1) < along[0] - 0.3, 'the blade comes back up the line');
  assert.ok(cutFrames > 3 && floorFrames / 30 > 1.5);
  assert.ok(a._broke.slice(0, Math.round(c.ghostCount)).some((t) => t >= 0), 'the blade breaks afterimages');
  assert.equal(bodies.slice(0, 3).reduce((n, b) => n + b.kills, 0), 3);
  assert.equal(bodies[3].kills, 0);
  assert.ok(maxEmit < 2000);
  a.destroy();
  assert.ok(!a.blade.visible && !a.ghosts.visible && !a.cut.visible && !a.floor.visible);
});

test('afterimage: reuse resets, editor exposes every key, dispose frees', () => {
  const { a } = arena(AfterimageSwingAbility);
  a.spawn(new Vector3(), new Vector3(0, 0, 1), 10);
  for (let i = 0; i < 40; i++) a.update(1 / 30);
  a.destroy();
  a.spawn(new Vector3(), new Vector3(0, 0, 1), 10);
  assert.equal(a._cutAt, -1);
  assert.ok([...a._left].every((t) => t === -1));
  const keys = editorKeys(afterEditor, settings.afterimage);
  for (const k of Object.keys(afterimage.settings)) assert.ok(keys.has(k) || k === 'zoneRadius', `editor exposes ${k}`);
  let disposed = 0;
  for (const r of [a.bladeMaterial, a.bladeGeometry, a.ghostMaterial, a.cutMaterial, a.floorMaterial]) r.addEventListener('dispose', () => disposed++);
  a.destroy();
  a.dispose();
  assert.equal(disposed, 5);
});

test('crosscut: a gust front runs the line and crosses, breaks into a rolling rotor, the floor is scoured', () => {
  const bodies = [body(0, 13.2), body(0.6, 6), body(-0.5, 9), body(4, 8)];
  const { a, counter } = arena(CrosscutGustAbility, bodies);
  a.spawn(new Vector3(), new Vector3(0, 0, 1), 13.2);
  let frames = 0;
  let frontTravel = 0;
  let rotorFrames = 0;
  let scourFrames = 0;
  const yaws = [];
  const turns = [];
  let maxEmit = 0;
  while (a.isActive && frames < 600) {
    const before = counter.emits;
    a.update(1 / 30);
    maxEmit = Math.max(maxEmit, counter.emits - before);
    frames++;
    if (a.phase === 'travel' && a.gustFront.visible) {
      frontTravel++;
      yaws.push(a.gustFront.rotation.y);
    }
    if (a.rotor.visible) {
      rotorFrames++;
      turns.push(a._rotorTurn);
    }
    if (a.scour.visible) scourFrames++;
  }
  const seconds = frames / 30;
  assert.ok(seconds > 1.5 && seconds < 4.5, `screen time ${seconds}`);
  assert.ok(frontTravel >= 3, 'the front is seen running');
  assert.ok(Math.abs(yaws.at(-1) - yaws[0]) > 0.2, 'its face crosses as it runs');
  assert.ok(rotorFrames / 30 > 1.2, `rotor rolls ${rotorFrames / 30}s`);
  assert.ok(turns.at(-1) - turns[0] > 2, 'the rotor keeps rolling through the linger');
  assert.ok(scourFrames / 30 > 1.5);
  assert.ok(typeof a.front === 'number', 'the base front is not clobbered');
  assert.equal(bodies.slice(0, 3).reduce((n, b) => n + b.kills, 0), 3);
  assert.equal(bodies[3].kills, 0);
  assert.ok(maxEmit < 2000);
  a.destroy();
  assert.ok(!a.gustFront.visible && !a.rotor.visible && !a.scour.visible);
});

test('crosscut: reuse resets, editor exposes every key, dispose frees', () => {
  const { a } = arena(CrosscutGustAbility);
  a.spawn(new Vector3(), new Vector3(0, 0, 1), 10);
  for (let i = 0; i < 40; i++) a.update(1 / 30);
  a.destroy();
  a.spawn(new Vector3(), new Vector3(0, 0, 1), 10);
  assert.equal(a._breakAt, -1);
  assert.equal(a._rotorTurn, 0);
  const keys = editorKeys(crossEditor, settings.crosscut);
  for (const k of Object.keys(crosscut.settings)) assert.ok(keys.has(k) || k === 'zoneRadius', `editor exposes ${k}`);
  let disposed = 0;
  for (const r of [a.frontMaterial, a.frontGeometry, a.rotorMaterial, a.rotorGeometry, a.scourMaterial]) r.addEventListener('dispose', () => disposed++);
  a.destroy();
  a.dispose();
  assert.equal(disposed, 5);
});
