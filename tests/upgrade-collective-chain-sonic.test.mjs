import test from 'node:test';
import assert from 'node:assert/strict';
import { Object3D, Vector3 } from 'three';
import { settings } from '../packs/sandbox/src/config/settings.js';
import { ChainArcAbility } from '../packs/sandbox/src/abilities/collective/ChainArcAbility.js';
import { ResonancePulseAbility } from '../packs/sandbox/src/abilities/collective/ResonancePulseAbility.js';
import chainConfig from '../packs/sandbox/src/config/collective/chain.js';
import sonicConfig from '../packs/sandbox/src/config/collective/sonic.js';

settings.chain = structuredClone(chainConfig.settings);
settings.sonic = structuredClone(sonicConfig.settings);

function mockDummies(points) {
  const list = points.map(([x, z]) => ({
    position: new Vector3(x, 0, z),
    alive: true,
    kills: 0,
    kill() {
      this.alive = false;
      this.kills++;
    },
    bodyPoint(out) {
      return out.copy(this.position).setY(0.4);
    }
  }));
  return {
    list,
    findTargets(x, z, r, out) {
      out.length = 0;
      for (const d of list) if (d.alive && Math.hypot(d.position.x - x, d.position.z - z) <= r) out.push(d);
      out.sort((a, b) => Math.hypot(a.position.x - x, a.position.z - z) - Math.hypot(b.position.x - x, b.position.z - z));
      return out;
    }
  };
}

function mockCtx(dummies) {
  const log = { emitted: 0, decals: 0, bursts: 0, flashes: 0 };
  const uniform = () => new Proxy({}, { get: (t, k) => (t[k] ??= { value: k === 'uGravity' ? new Vector3() : 0 }) });
  const system = () => ({
    uniforms: uniform(),
    setGradient() {},
    emit(n) {
      assert.ok(Number.isFinite(n) && n >= 0);
      log.emitted += n;
    }
  });
  const root = new Object3D();
  return {
    log,
    dummies,
    character: { root, get position() { return root.position; }, setFacing() {} },
    lights: { acquire: () => ({}), set() {}, release() {} },
    particles: { get: () => system() },
    decals: { spawn: () => log.decals++ },
    bursts: { spawn: () => log.bursts++ },
    shake: { add() {}, rumble() {} },
    flash: { trigger: () => log.flashes++ }
  };
}

test('chain: every struck body gets a fulgurite + scorch that linger, then sink and clear', () => {
  const dummies = mockDummies([[0, 8], [1.5, 9], [-1.5, 9.5], [0.5, 11]]);
  const ctx = mockCtx(dummies);
  const a = new ChainArcAbility(ctx);
  a.spawn(new Vector3(), new Vector3(0, 0, 1), 13);
  let maxGlass = 0;
  let lingerGlass = 0;
  let sunk = false;
  let steps = 0;
  while (a.isActive && steps < 600) {
    a.update(1 / 30);
    steps++;
    const glass = a.scars.filter((s) => s.glass.visible).length;
    maxGlass = Math.max(maxGlass, glass);
    if (a._mode === 2 && glass > 0) lingerGlass++;
    for (const s of a.scars) if (s.glass.visible && s.glass.position.y < -0.05) sunk = true;
  }
  assert.ok(!a.isActive, 'finishes');
  assert.equal(dummies.list.filter((d) => d.kills === 1).length, 4, 'each body struck exactly once (hit rules unchanged)');
  assert.equal(maxGlass, 4, 'one fulgurite per strike');
  assert.ok(lingerGlass > 30, 'glass stands through the linger');
  assert.ok(sunk, 'glass sinks on the way out');
  a.destroy();
  for (const s of a.scars) {
    assert.equal(s.glass.visible, false);
    assert.equal(s.scar.visible, false);
  }
  a.dispose();
});

test('chain: a leader that finds nobody grounds and leaves a larger fulgurite', () => {
  const ctx = mockCtx(mockDummies([]));
  const a = new ChainArcAbility(ctx);
  a.spawn(new Vector3(), new Vector3(0, 0, 1), 10);
  let grounded = false;
  for (let i = 0; i < 200 && a.isActive; i++) {
    a.update(1 / 30);
    if (a.scars[0].active && a.scars[0].grounded && a.scars[0].glass.visible) grounded = true;
  }
  assert.ok(grounded);
});

test('sonic: filled shells travel, then domes, hum and a Chladni plate linger and clear', () => {
  const ctx = mockCtx(mockDummies([]));
  const a = new ResonancePulseAbility(ctx);
  a.spawn(new Vector3(), new Vector3(0, 0, 1), 12);
  let sawRing = false;
  let sawDome = false;
  let humFrames = 0;
  let plateFrames = 0;
  let laneFrames = 0;
  let steps = 0;
  while (a.isActive && steps < 600) {
    a.update(1 / 30);
    steps++;
    if (a.rings.some((r) => r.mesh.visible)) sawRing = true;
    if (a.domes[0].mesh.visible) sawDome = true;
    if (a.domes[2].mesh.visible) humFrames++;
    if (a.plate.visible) plateFrames++;
    if (a.lane.visible) laneFrames++;
  }
  assert.ok(!a.isActive, 'finishes');
  assert.ok(sawRing && sawDome);
  assert.ok(humFrames > 20, 'the hum stands through the linger');
  assert.ok(plateFrames > 30, 'the plate stays');
  assert.ok(laneFrames > 30, 'the lane stays');
  a.destroy();
  assert.equal(a.plate.visible, false);
  assert.equal(a.lane.visible, false);
  assert.ok(a.domes.every((d) => !d.mesh.visible));
  a.dispose();
});
