import test from 'node:test';
import assert from 'node:assert/strict';
import { Vector3 } from 'three';
import { settings } from '../packs/sandbox/src/config/settings.js';
import { UmbralGuillotineAbility, buildEditor as umbralEditor } from '../packs/sandbox/src/abilities/codex/UmbralGuillotineAbility.js';
import { WhiteoutNeedleAbility, buildEditor as whiteoutEditor } from '../packs/sandbox/src/abilities/codex/WhiteoutNeedleAbility.js';
import umbral from '../packs/sandbox/src/config/codex/umbral.js';
import whiteout from '../packs/sandbox/src/config/codex/whiteout.js';

settings.umbral ??= structuredClone(umbral.settings);
settings.whiteout ??= structuredClone(whiteout.settings);

const box = () => ({ value: { set() {}, copy() {} } });
function arena(Ability, bodies) {
  const counter = { emits: 0 };
  const ctx = {
    particles: {
      get() {
        const uniforms = new Proxy({}, { get: (t, k) => (t[k] ??= box()) });
        return { uniforms, setGradient() {}, emit: (n) => (counter.emits += n) };
      }
    },
    lights: { acquire: () => ({}), set() {}, release() {} },
    decals: { spawn() {} },
    bursts: { spawn() {} },
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
    pin() {},
    unpin() {},
    corrode() {},
    joint(name, out) {
      out.copy(this.position).setY(1);
      return true;
    }
  };
}

const cluster = () => [body(0, 13), body(1.2, 13.4), body(-1.4, 12.6), body(0.5, 14), body(8, 13)];

function editorKeys(build, c) {
  const keys = new Set();
  const folder = () => ({
    addFolder: folder,
    add: (_o, k) => (keys.add(k), { name: () => ({}) }),
    addColor: (_o, k) => (keys.add(k), { name: () => ({}) }),
    close() {}
  });
  const Editor = {
    range: (_f, _o, k) => keys.add(k),
    castAnimation: () => keys.add('castAnim'),
    gradient: (_f, _o, prefix) => ['A', 'B', 'C', 'D'].forEach((s) => keys.add(prefix + s))
  };
  build(folder(), c, Editor);
  return keys;
}

test('umbral: swing stays low enough to frame, pool and slashes appear, hits bounded, reuse resets', () => {
  const c = settings.umbral;
  // Highest the drawn-back blade's edge rides: under 4.5 m so the 8 m chase shot holds it.
  assert.ok(c.pivotHeight - c.armLength * Math.cos(c.swingAmp * 1.18) < 4.5);
  assert.ok(c.pivotHeight + c.armLength * Math.cos(Math.PI - c.raiseAngle) < 5.5);
  const bodies = cluster();
  const { a } = arena(UmbralGuillotineAbility, bodies);
  for (let run = 0; run < 2; run++) {
    for (const b of bodies) b.alive = true;
    a.spawn(new Vector3(), new Vector3(0, 0, 1), 13.2);
    assert.equal(a.pool.visible, false);
    assert.ok(a._slashes.every((s) => !s.mesh.visible));
    let frames = 0;
    let poolSeen = 0;
    let slashes = 0;
    let maxSpread = 0;
    while (a.isActive && frames < 400) {
      a.update(1 / 30);
      frames++;
      if (a.pool.visible) poolSeen++;
      maxSpread = Math.max(maxSpread, a._poolState.spread);
      slashes = Math.max(slashes, a._slashes.filter((s) => s.mesh.visible).length);
    }
    assert.ok(!a.isActive, 'cast ends');
    assert.ok(frames / 30 < 6, `screen time ${frames / 30}`);
    assert.ok(poolSeen > 20, `pool lingers (${poolSeen} frames)`);
    assert.ok(maxSpread > 0.95);
    assert.ok(slashes >= 1, 'the swing scores the floor');
    assert.ok(a._cuts <= bodies.length);
    assert.ok(bodies.filter((b) => !b.alive).length >= 4, 'cluster is cut');
  }
  const keys = editorKeys(umbralEditor, settings.umbral);
  for (const k of Object.keys(umbral.settings)) assert.ok(keys.has(k), `editor exposes ${k}`);
});

test('whiteout: blizzard body stands and keeps moving through the hold, pins bounded, reuse resets', () => {
  const bodies = cluster();
  const { a } = arena(WhiteoutNeedleAbility, bodies);
  for (let run = 0; run < 2; run++) {
    for (const b of bodies) b.alive = true;
    a.spawn(new Vector3(), new Vector3(0, 0, 1), 13.2);
    assert.equal(a.blizzard.visible, false);
    let frames = 0;
    let blizzard = 0;
    while (a.isActive && frames < 400) {
      a.update(1 / 30);
      frames++;
      if (a.blizzard.visible) blizzard++;
    }
    assert.ok(!a.isActive);
    assert.ok(blizzard > 30, `blizzard stands (${blizzard} frames)`);
    assert.ok(a.pins.every((p) => !p.dummy), 'pins released');
    assert.ok(bodies.filter((b) => !b.alive).length >= 4);
  }
  const keys = editorKeys(whiteoutEditor, settings.whiteout);
  for (const k of Object.keys(whiteout.settings)) assert.ok(keys.has(k), `editor exposes ${k}`);
});
