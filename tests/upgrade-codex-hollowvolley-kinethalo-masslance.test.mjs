import test from 'node:test';
import assert from 'node:assert/strict';
import { Vector3 } from 'three';
import { settings } from '../packs/sandbox/src/config/settings.js';
import { HollowVolleyAbility, buildEditor as hollowEditor } from '../packs/sandbox/src/abilities/codex/HollowVolleyAbility.js';
import { KineticHaloAbility, buildEditor as haloEditor } from '../packs/sandbox/src/abilities/codex/KineticHaloAbility.js';
import { MassLanceAbility, buildEditor as lanceEditor } from '../packs/sandbox/src/abilities/codex/MassLanceAbility.js';
import hollowvolley from '../packs/sandbox/src/config/codex/hollowvolley.js';
import kinethalo from '../packs/sandbox/src/config/codex/kinethalo.js';
import masslance from '../packs/sandbox/src/config/codex/masslance.js';

settings.hollowvolley ??= structuredClone(hollowvolley.settings);
settings.kinethalo ??= structuredClone(kinethalo.settings);
settings.masslance ??= structuredClone(masslance.settings);

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
const NEW_KEY = /^(seed|implode|well|colorSeed|colorWell|wheel|colorWheel|smear|scrape|colorScrape|spark|colorSpark|lance|colorLance|trench|colorTrench|collar|crush)/;

test('hollowvolley: seeds fly, land, implode into wells that close; hits bounded; reuse resets', () => {
  const bodies = [body(0, 8), body(0.8, 7.5), body(-0.9, 6), body(6, 6)];
  const { a } = arena(HollowVolleyAbility, bodies);
  for (let round = 0; round < 2; round++) {
    a.spawn(new Vector3(), new Vector3(0, 0, 1), 9);
    let flying = 0;
    let wells = 0;
    let lastWellR = 0;
    const secs = run(a, (x) => {
      if (x.phase === 'travel' && x._seedRecs.some((r) => r.seed.visible && r.landAge < 0)) flying++;
      const w = x._seedRecs.filter((r) => r.well.visible);
      if (w.length) {
        wells = Math.max(wells, w.length);
        lastWellR = w[0].well.scale.x;
      }
    });
    assert.ok(secs > 1.5 && secs < 4.5, `screen time ${secs}`);
    assert.ok(flying > 0, 'seeds are seen in flight');
    assert.equal(wells, Math.round(settings.hollowvolley.count), 'one well per seed');
    assert.ok(lastWellR < settings.hollowvolley.wellRadius * 0.5, 'wells fold shut by the end');
    assert.ok(a.instanceCount <= bodies.length);
    a.destroy();
    assert.ok(a._seedRecs.every((r) => !r.seed.visible && !r.well.visible && r.landAge < 0));
  }
  const keys = editorKeys(hollowEditor, settings.hollowvolley);
  for (const k of Object.keys(hollowvolley.settings)) if (NEW_KEY.test(k)) assert.ok(keys.has(k), `editor exposes ${k}`);
  a.dispose();
});

test('kinethalo: the flywheel rolls in, lands at the circle, wobbles down, sinks; reuse resets', () => {
  const bodies = [body(0, 10), body(2, 10), body(-2, 11)];
  const { a } = arena(KineticHaloAbility, bodies);
  for (let round = 0; round < 2; round++) {
    a.spawn(new Vector3(), new Vector3(0, 0, 1), 10);
    const tilts = [];
    let travelVisible = 0;
    let scrape = 0;
    run(a, (x) => {
      if (x.phase === 'travel' && x.hub.visible) travelVisible++;
      if (x.phase !== 'travel') tilts.push(x.hub.quaternion.x ** 2 + x.hub.quaternion.z ** 2);
      if (x.scrape.visible) scrape++;
    });
    assert.ok(travelVisible > 0, 'the wheel is seen on its way');
    assert.ok(scrape > 20, 'the scraped floor stays for the linger');
    assert.ok(tilts[3] > tilts[tilts.length - 1] + 1e-4, 'it wobbles down to flat');
    const c = settings.kinethalo;
    assert.ok(Math.abs(a._wheelShape[0] - c.zoneRadius * c.wheelFit) < 1e-6, 'landed radius derives from the circle');
    assert.ok(a.instanceCount <= bodies.length);
    a.destroy();
    assert.equal(a.hub.visible, false);
  }
  const keys = editorKeys(haloEditor, settings.kinethalo);
  for (const k of Object.keys(kinethalo.settings)) if (NEW_KEY.test(k)) assert.ok(keys.has(k), `editor exposes ${k}`);
  a.dispose();
});

test('masslance: the lance rides the line, the trench grows behind it, it drives in and sinks', () => {
  const bodies = [body(0, 9), body(0.5, 5), body(4, 9)];
  const { a } = arena(MassLanceAbility, bodies);
  for (let round = 0; round < 2; round++) {
    a.spawn(new Vector3(), new Vector3(0, 0, 1), 10);
    const trenchLen = [];
    const lanceY = [];
    run(a, (x) => {
      if (x.phase === 'travel' && x.trench.visible) trenchLen.push(x.trench.scale.z);
      if (x.phase !== 'travel' && x.lance.visible) lanceY.push(x.lance.position.y);
    });
    assert.ok(trenchLen.length > 2 && trenchLen[trenchLen.length - 1] > trenchLen[0], 'the trench grows behind the lance');
    assert.ok(lanceY.length > 10 && lanceY[lanceY.length - 1] < lanceY[5], 'the lance sinks over the linger');
    assert.ok(a.instanceCount <= bodies.length);
    a.destroy();
    assert.equal(a.lance.visible, false);
  }
  const keys = editorKeys(lanceEditor, settings.masslance);
  for (const k of Object.keys(masslance.settings)) if (NEW_KEY.test(k)) assert.ok(keys.has(k), `editor exposes ${k}`);
  a.dispose();
});
