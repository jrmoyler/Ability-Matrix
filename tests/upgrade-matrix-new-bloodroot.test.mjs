import test from 'node:test';
import assert from 'node:assert/strict';
import { Vector3 } from 'three';
import { settings } from '../packs/sandbox/src/config/settings.js';
import { BloodrootThornsAbility, buildEditor } from '../packs/sandbox/src/abilities/matrix-new/BloodrootThornsAbility.js';
import { BLOODROOT_RUNNER, rootPathAt } from '../packs/sandbox/src/materials/matrix-new/BloodrootThornsMaterials.js';
import bloodroot from '../packs/sandbox/src/config/matrix-new/bloodroot.js';

settings.bloodroot = structuredClone(bloodroot.settings);

const box = () => ({ value: { set() {}, copy() {} } });
function mockParticles(counter) {
  return {
    get() {
      const uniforms = new Proxy({}, { get: (t, k) => (t[k] ??= box()) });
      return { uniforms, setGradient() {}, emit: (n) => (counter.emits += n) };
    }
  };
}

const body = (x, z) => ({
  alive: true,
  finished: false,
  position: new Vector3(x, 0, z),
  kills: 0,
  corrode: () => 0.5,
  consume() {},
  bodyPoint: (out) => (out.set(x, 0.3, z), true),
  kill() {
    if (!this.alive) return false;
    this.alive = false;
    this.kills++;
    return true;
  }
});

function arena(bodies) {
  const counter = { emits: 0, decals: 0 };
  const ctx = {
    particles: mockParticles(counter),
    lights: { acquire: () => ({}), set() {}, release() {} },
    decals: { spawn: () => counter.decals++ },
    bursts: { spawn() {} },
    shake: { add() {}, rumble() {} },
    flash: { trigger() {} },
    dummies: {
      findBodies(x, z, r, out) {
        out.length = 0;
        for (const b of bodies) if (Math.hypot(b.position.x - x, b.position.z - z) <= r) out.push(b);
        return out;
      }
    }
  };
  return { a: new BloodrootThornsAbility(ctx), counter };
}

test('bloodroot: the runner crawls from the caster during travel, wake thorns rise, the soak and drain beat follow, reuse resets', () => {
  const target = body(0.5, 10);
  const { a, counter } = arena([target]);
  for (let round = 0; round < 2; round++) {
    a.spawn(new Vector3(), new Vector3(0, 0, 1), 10);
    assert.equal(a.field.visible, false, 'no soak before the seed surfaces');
    assert.ok(counter.decals > 0, 'the floor cracks at the caster on launch');
    let frames = 0;
    let wakeInFlight = 0;
    let runnerMid = false;
    let sawField = false;
    let sawInward = false;
    let maxEmit = 0;
    while (a.isActive && frames < 600) {
      const before = counter.emits;
      a.update(1 / 30);
      maxEmit = Math.max(maxEmit, counter.emits - before);
      const run = a.rootRecords[BLOODROOT_RUNNER];
      if (a.phase === 'travel' || a.u < 1) {
        if (run.grown > 0.3 * run.length && run.grown < run.length) runnerMid = true;
        wakeInFlight = Math.max(wakeInFlight, a.thorns.slice(144).filter((t) => t.broke).length);
      }
      if (a.field.visible) sawField = true;
      if (a._pulseSign < 0) sawInward = true;
      for (const m of a.thornMeshes) for (const v of m.instanceMatrix.array) assert.ok(Number.isFinite(v));
      frames++;
    }
    assert.ok(frames < 600, 'cast finishes');
    assert.ok(runnerMid, 'the runner is seen part-way across the floor in flight');
    assert.ok(wakeInFlight > 0, 'wake thorns break the floor before the seed arrives');
    assert.ok(sawField, 'the soaked floor stands');
    assert.ok(sawInward, 'the beats turn inward for the drain');
    assert.ok(maxEmit < 2000, 'bounded emission');
    const seconds = frames / 30;
    assert.ok(seconds > 1.5 && seconds < 7, `screen time ${seconds}`);
    a.destroy();
    assert.equal(a.field.visible, false);
    assert.equal(a.roots.visible, false);
    target.alive = true;
  }
  assert.equal(target.kills, 2, 'one drained body per cast');
  a.dispose();
});

test('bloodroot: the pinned runner ends exactly on the circle and every key is a slider', () => {
  const run = { ox: -3, oz: -8, bearing: Math.atan2(8, 3), length: Math.hypot(3, 8), p1: 1.3, p2: 4.1, wanderScale: 0.5, pin: 1 };
  const out = { x: 0, z: 0 };
  rootPathAt(run, 1, 0.75, 3.2, out);
  assert.ok(Math.abs(out.x) < 1e-9 && Math.abs(out.z) < 1e-9, 'lands on the heart');
  rootPathAt(run, 0, 0.75, 3.2, out);
  assert.ok(Math.abs(out.x + 3) < 1e-9 && Math.abs(out.z + 8) < 1e-9, 'leaves the caster');
  const keys = new Set();
  const chain = { name: () => chain, onChange: () => chain };
  const folder = { addFolder: () => folder, add: (o, k) => (keys.add(k), chain), addColor: (o, k) => (keys.add(k), chain), close() {} };
  const Editor = { range: (f, o, k) => (keys.add(k), chain), castAnimation: () => keys.add('castAnim'), gradient: (f, o, p) => ['A', 'B', 'C', 'D'].forEach((x) => keys.add(p + x)) };
  buildEditor(folder, settings.bloodroot, Editor);
  for (const k of Object.keys(settings.bloodroot)) if (typeof settings.bloodroot[k] !== 'object') assert.ok(keys.has(k), `${k} has a slider`);
});
