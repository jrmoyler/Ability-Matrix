import test from 'node:test';
import assert from 'node:assert/strict';
import { Vector3 } from 'three';
import { settings } from '../packs/sandbox/src/config/settings.js';
import { CometHarpoonAbility, buildEditor } from '../packs/sandbox/src/abilities/codex/CometHarpoonAbility.js';
import cometharpoon from '../packs/sandbox/src/config/codex/cometharpoon.js';

settings.cometharpoon ??= structuredClone(cometharpoon.settings);

const box = () => ({ value: { set() {}, copy() {} } });
function mockParticles(counter) {
  return {
    get() {
      const uniforms = new Proxy({}, { get: (t, k) => (t[k] ??= box()) });
      return { uniforms, setGradient() {}, emit: (n) => (counter.emits += n) };
    }
  };
}

function arena(bodies = []) {
  const counter = { emits: 0, decals: 0, bursts: 0 };
  const ctx = {
    particles: mockParticles(counter),
    lights: { acquire: () => ({}), set() {}, release() {} },
    decals: { spawn: () => counter.decals++ },
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
  return { a: new CometHarpoonAbility(ctx), counter };
}

function body(x, z) {
  return {
    alive: true,
    position: new Vector3(x, 0, z),
    kills: 0,
    kill() {
      if (!this.alive) return false;
      this.alive = false;
      this.kills++;
      return true;
    }
  };
}

test('cometharpoon: a solid nucleus flies with the harpoon, ice blades stand at the strike, linger moves, the cast ends', () => {
  const bodies = [body(0, 13.2), body(1.6, 13.6), body(-1.8, 12.8), body(9, 13)];
  const { a, counter } = arena(bodies);
  a.spawn(new Vector3(), new Vector3(0, 0, 1), 13.2);
  const c = settings.cometharpoon;
  let frames = 0;
  let nucleusInFlight = 0;
  let maxNucleusR = 0;
  let bladeFrames = 0;
  let maxBladeCount = 0;
  const spins = [];
  let maxEmit = 0;
  while (a.isActive && frames < 600) {
    const before = counter.emits;
    a.update(1 / 30);
    maxEmit = Math.max(maxEmit, counter.emits - before);
    frames++;
    if (a.phase === 'travel' && a.nucleus.visible) nucleusInFlight++;
    maxNucleusR = Math.max(maxNucleusR, a.nucleus.scale.x);
    if (a.blades.visible && a.blades.count > 0) {
      bladeFrames++;
      maxBladeCount = Math.max(maxBladeCount, a.blades.count);
      spins.push(a._spin);
    }
  }
  const seconds = frames / 30;
  assert.ok(seconds > 1.5 && seconds < 4.5, `screen time ${seconds}`);
  assert.ok(nucleusInFlight > 5, 'nucleus rides the throw');
  assert.ok(maxNucleusR >= c.nucleusSize * c.harpoonScale * 0.99, `nucleus body ${maxNucleusR}`);
  assert.ok(bladeFrames / 30 > 1.2, `blades stand ${bladeFrames / 30}s`);
  assert.equal(maxBladeCount, Math.round(c.petals) * (c.innerPetals >= 0.5 ? 2 : 1));
  assert.ok(spins.at(-1) - spins[0] > 0.3, 'the lotus turns through the linger');
  assert.equal(bodies.slice(0, 3).reduce((n, b) => n + b.kills, 0), 3);
  assert.equal(bodies[3].kills, 0);
  assert.ok(counter.decals >= 2 && counter.bursts >= 1);
  assert.ok(maxEmit < 2000);
  a.destroy();
  assert.ok(!a.nucleus.visible && !a.blades.visible && !a.harpoon.visible);
});

test('cometharpoon: reuse resets, editor exposes every key, dispose frees', () => {
  const { a } = arena();
  a.spawn(new Vector3(), new Vector3(0, 0, 1), 10);
  for (let i = 0; i < 60; i++) a.update(1 / 30);
  a.destroy();
  a.spawn(new Vector3(), new Vector3(0, 0, 1), 10);
  assert.equal(a.blades.count, 0);
  assert.equal(a._nucleusState.dissolve, 0);
  assert.equal(a.nucleus.visible, true);

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
  buildEditor(folder(), settings.cometharpoon, Editor);
  for (const k of Object.keys(cometharpoon.settings)) assert.ok(keys.has(k), `editor exposes ${k}`);

  let disposed = 0;
  for (const r of [a.nucleusMaterial, a.bladeMaterial, a.nucleusGeometry, a.bladeGeometry]) r.addEventListener('dispose', () => disposed++);
  a.destroy();
  a.dispose();
  assert.equal(disposed, 4);
});
