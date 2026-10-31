import test from 'node:test';
import assert from 'node:assert/strict';
import { Matrix4, Vector3 } from 'three';
import { settings } from '../packs/sandbox/src/config/settings.js';
import { GlamourSweepAbility, buildEditor as glamourEditor } from '../packs/sandbox/src/abilities/codex/GlamourSweepAbility.js';
import { HardpointHaloAbility, buildEditor as hardpointEditor } from '../packs/sandbox/src/abilities/codex/HardpointHaloAbility.js';
import { ImpulseWellAbility, buildEditor as impulseEditor } from '../packs/sandbox/src/abilities/codex/ImpulseWellAbility.js';
import glamour from '../packs/sandbox/src/config/codex/glamour.js';
import hardpoint from '../packs/sandbox/src/config/codex/hardpoint.js';
import impulse from '../packs/sandbox/src/config/codex/impulse.js';

settings.glamour ??= structuredClone(glamour.settings);
settings.hardpoint ??= structuredClone(hardpoint.settings);
settings.impulse ??= structuredClone(impulse.settings);

const box = () => ({ value: { set() {}, copy() {} } });
function arena(Klass, bodies) {
  const counter = { emits: 0, decals: 0 };
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
  const a = new Klass(ctx);
  return { a, counter };
}
function body(x, z) {
  return {
    alive: true,
    position: new Vector3(x, 0, z),
    kill() {
      if (!this.alive) return false;
      this.alive = false;
      return true;
    },
    corrode() {},
    carry() {},
    release() {}
  };
}
function run(a, probe) {
  let frames = 0;
  while (a.isActive && frames < 600) {
    a.update(1 / 30);
    a.group.updateMatrixWorld(true);
    probe?.(a);
    frames++;
  }
  return frames / 30;
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
function finite(obj) {
  return [...obj.position.toArray(), ...obj.quaternion.toArray(), ...obj.scale.toArray()].every(Number.isFinite);
}
const _m = new Matrix4();
const NEW_KEY = /^(blade|colorBlade|ghost|cut|colorCut|peel|pod|colorPod|barrel|volley|tracer|colorTracer|deck|colorDeck|muzzle|well|colorWell|slab|colorSlab|orb|colorOrb|wave|ripple)/;

test('glamour: the blade flies, the false copy cuts first, the blade bites and peels; hits bounded; reuse resets', () => {
  const bodies = [body(0, 12), body(1, 12.5), body(-1, 11.5), body(6, 4)];
  const { a } = arena(GlamourSweepAbility, bodies);
  for (let round = 0; round < 2; round++) {
    a.spawn(new Vector3(), new Vector3(0, 0, 1), 13);
    let flying = 0;
    let leadAhead = 0;
    let bitten = false;
    let cut = 0;
    const secs = run(a, (x) => {
      assert.ok(finite(x.blade), 'blade pose finite');
      if (x.phase === 'travel' && x.blade.visible) flying++;
      if (x.phase === 'travel' && x.ghosts[0].visible && x.ghosts[0].position.z > x.blade.position.z + 1) leadAhead++;
      if (x.phase !== 'travel' && x.blade.visible && x.blade.position.y < settings.glamour.bladeHeight * 0.5) bitten = true;
      if (x.cut.visible) cut++;
    });
    assert.ok(secs > 1.5 && secs < 4.5, `screen time ${secs}`);
    assert.ok(flying > 3, 'the blade is seen in flight');
    assert.ok(leadAhead > 0, 'the false copy runs ahead');
    assert.ok(bitten, 'the blade bites into the floor');
    assert.ok(cut > 20, 'the cut stays on the floor');
    assert.ok(a.instanceCount <= 3, 'only bodies near the head are hit');
    a.destroy();
    assert.ok(!a.blade.visible && !a.cut.visible && a.ghosts.every((g) => !g.visible));
  }
  const keys = editorKeys(glamourEditor, settings.glamour);
  for (const k of Object.keys(glamour.settings)) if (NEW_KEY.test(k)) assert.ok(keys.has(k), `editor exposes ${k}`);
  a.dispose();
});

test('hardpoint: turrets fly in formation, lock on the ring, fire every volley, sink; hits bounded; reuse resets', () => {
  const bodies = [body(0, 12), body(2, 12), body(-2, 13), body(9, 2)];
  const { a } = arena(HardpointHaloAbility, bodies);
  for (let round = 0; round < 2; round++) {
    a.spawn(new Vector3(), new Vector3(0, 0, 1), 12);
    let flying = 0;
    let deck = 0;
    let lowest = Infinity;
    const secs = run(a, (x) => {
      if (x.phase === 'travel' && x.pods.visible) flying++;
      if (x.deck.visible) deck++;
      for (const v of x.pods.instanceMatrix.array) assert.ok(Number.isFinite(v), 'turret matrices finite');
      if (x.phase === 'fade') {
        x.pods.getMatrixAt(0, _m);
        lowest = Math.min(lowest, _m.elements[13]);
      }
    });
    assert.ok(secs > 1.5 && secs < 4.5, `screen time ${secs}`);
    assert.ok(flying > 3, 'the formation is seen in flight');
    assert.equal(a._fired, Math.round(settings.hardpoint.volleyCount), 'every volley fires');
    assert.equal(a.pods.count, Math.round(settings.hardpoint.podCount));
    assert.ok(deck > 20, 'the deck stays');
    assert.ok(lowest < -0.3, 'the turrets sink on the way out');
    assert.ok(a.instanceCount <= 3, 'only the bodies in the circle are hit');
    a.destroy();
    assert.ok(!a.pods.visible && !a.barrels.visible && !a.deck.visible);
  }
  const keys = editorKeys(hardpointEditor, settings.hardpoint);
  for (const k of Object.keys(hardpoint.settings)) if (NEW_KEY.test(k)) assert.ok(keys.has(k), `editor exposes ${k}`);
  a.dispose();
});

test('impulse: the floor inhales while the charge flies, dumps a wave and a column of slabs that fall back and settle; reuse resets', () => {
  const bodies = [body(0, 12), body(2, 12), body(-2, 13), body(9, 2)];
  const { a } = arena(ImpulseWellAbility, bodies);
  for (let round = 0; round < 2; round++) {
    a.spawn(new Vector3(), new Vector3(0, 0, 1), 12);
    let orb = 0;
    let deepest = 0;
    let highest = 0;
    let waveSeen = 0;
    let lastHigh = Infinity;
    const secs = run(a, (x) => {
      if (x.phase === 'travel' && x.orb.visible) orb++;
      deepest = Math.max(deepest, x._shape.depth);
      if (x._shape.waveH > 0.2) waveSeen++;
      let top = -Infinity;
      for (let i = 0; i < x.slabs.count; i++) {
        x.slabs.getMatrixAt(i, _m);
        assert.ok(Number.isFinite(_m.elements[13]), 'slab finite');
        top = Math.max(top, _m.elements[13]);
      }
      if (x.phase !== 'travel') highest = Math.max(highest, top);
      lastHigh = top;
    });
    assert.ok(secs > 1.5 && secs < 4.5, `screen time ${secs}`);
    assert.ok(orb > 3, 'the charge is seen in flight');
    assert.ok(deepest > settings.impulse.wellDepth * 0.9, 'the floor inhales into a funnel');
    assert.ok(waveSeen > 3, 'a ring wave runs out');
    assert.ok(highest > 2, `the slabs are thrown up in a column (${highest})`);
    assert.ok(lastHigh < 0.6, `the slabs come down and settle (${lastHigh})`);
    assert.ok(a.instanceCount <= 3, 'only the bodies in the circle are hit');
    a.destroy();
    assert.ok(!a.well.visible && !a.slabs.visible && !a.orb.visible);
  }
  const keys = editorKeys(impulseEditor, settings.impulse);
  for (const k of Object.keys(impulse.settings)) if (NEW_KEY.test(k)) assert.ok(keys.has(k), `editor exposes ${k}`);
  a.dispose();
});
