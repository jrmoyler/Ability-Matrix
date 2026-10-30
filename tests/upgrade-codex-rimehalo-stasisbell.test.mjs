import test from 'node:test';
import assert from 'node:assert/strict';
import { Vector3 } from 'three';
import { settings } from '../packs/sandbox/src/config/settings.js';
import { RimeHaloAbility, buildEditor as buildRime } from '../packs/sandbox/src/abilities/codex/RimeHaloAbility.js';
import { StasisBellAbility, buildEditor as buildBell } from '../packs/sandbox/src/abilities/codex/StasisBellAbility.js';
import rimehalo from '../packs/sandbox/src/config/codex/rimehalo.js';
import stasisbell from '../packs/sandbox/src/config/codex/stasisbell.js';

settings.rimehalo ??= structuredClone(rimehalo.settings);
settings.stasisbell ??= structuredClone(stasisbell.settings);

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
    kill() {
      if (!this.alive) return false;
      this.alive = false;
      this.kills++;
      return true;
    }
  };
}

function arena(Cls, bodies = []) {
  const counter = { emits: 0, decals: 0, bursts: 0 };
  const ctx = {
    particles: mockParticles(counter),
    lights: { acquire: () => ({}), set() {}, release() {} },
    decals: { spawn: () => counter.decals++ },
    bursts: { spawn: () => counter.bursts++ },
    shake: { add() {}, rumble() {} },
    flash: { trigger() {} },
    dummies: {
      findBodies(x, z, r, out) {
        out.length = 0;
        for (const b of bodies) if (Math.hypot(b.position.x - x, b.position.z - z) <= r) out.push(b);
        return out;
      },
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

test('rimehalo: needles stand raised as a crown, the halo closes, bodies are caught, the cast ends', () => {
  const bodies = [body(0, 12), body(1.2, 11), body(-2, 13)];
  const { a } = arena(RimeHaloAbility, bodies);
  a.spawn(new Vector3(), new Vector3(0, 0, 1), 12);
  let frames = 0;
  let minR = Infinity;
  let raised = false;
  while (a.isActive && frames < 900) {
    a.update(1 / 30);
    if (a._haloR > 0) minR = Math.min(minR, a._haloR);
    if (a.needles.visible && !raised) {
      // An instance's +Y axis points up out of the horizontal (the crown).
      const e = a.needles.instanceMatrix.array;
      for (let i = 0; i < a.needles.count && !raised; i++) if (e[i * 16 + 5] > 0.1) raised = true;
    }
    frames++;
  }
  assert.ok(frames < 900);
  const seconds = frames / 30;
  assert.ok(seconds > 1.5 && seconds < 6, `screen time ${seconds}`);
  assert.ok(raised, 'needles are raised above the horizontal');
  assert.ok(minR < settings.rimehalo.zoneRadius * 0.5, 'the halo visibly closes');
  assert.ok(bodies.every((b) => b.kills <= 1));
  assert.ok(bodies.some((b) => b.kills === 1));
  const keys = editorKeys(buildRime, settings.rimehalo);
  for (const k of Object.keys(rimehalo.settings)) assert.ok(keys.has(k), `editor exposes ${k}`);
  a.destroy();
  a.dispose();
});

test('stasisbell: bell hangs from the fence (in shot), forms during travel, the field stands, the cast ends', () => {
  const c = settings.stasisbell;
  const bodies = [body(0, 12), body(1, 11)];
  const { a, counter } = arena(StasisBellAbility, bodies);
  a.spawn(new Vector3(), new Vector3(0, 0, 1), 12);
  const crown = a.crownHeight();
  assert.ok(Math.abs(crown - (Math.max(1.9, c.tineHeight) + c.hangClear + c.bellHeight)) < 1e-9, 'crown derived from the fence');
  assert.ok(crown < 5.5, `crown ${crown} m stays in shot`);
  let frames = 0;
  let formedInTravel = false;
  let sawField = false;
  let maxY = 0;
  while (a.isActive && frames < 900) {
    a.update(1 / 30);
    if (a._tau < 0 && a._form > 0.05) formedInTravel = true;
    if (a.curtain.visible) sawField = true;
    if (a.rig.visible) maxY = Math.max(maxY, a.rig.position.y);
    frames++;
  }
  assert.ok(frames < 900);
  assert.ok(formedInTravel, 'bell is turned and lowered while the note travels');
  assert.ok(sawField, 'the held field stands');
  assert.ok(maxY <= crown + c.dropHeight + 1e-6, 'never above the drop start');
  assert.ok(counter.decals > 2, 'sound rings left along the travel');
  assert.ok(bodies.every((b) => b.kills === 1), 'held bodies thrown on release');
  const keys = editorKeys(buildBell, settings.stasisbell);
  for (const k of Object.keys(stasisbell.settings)) assert.ok(keys.has(k), `editor exposes ${k}`);
  a.destroy();
  assert.equal(a.curtain.visible, false);
  a.spawn(new Vector3(), new Vector3(0, 0, 1), 12);
  assert.equal(a._curtainK, 0);
  a.dispose();
});
