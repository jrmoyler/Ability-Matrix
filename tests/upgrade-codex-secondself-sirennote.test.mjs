import test from 'node:test';
import assert from 'node:assert/strict';
import { Vector3 } from 'three';
import { settings } from '../packs/sandbox/src/config/settings.js';
import { AbilityPhase } from '../packs/sandbox/src/abilities/Ability.js';
import { SecondSelfAbility, buildEditor as buildSecond } from '../packs/sandbox/src/abilities/codex/SecondSelfAbility.js';
import { SirenNoteAbility, buildEditor as buildSiren } from '../packs/sandbox/src/abilities/codex/SirenNoteAbility.js';
import secondself from '../packs/sandbox/src/config/codex/secondself.js';
import sirennote from '../packs/sandbox/src/config/codex/sirennote.js';

settings.secondself ??= structuredClone(secondself.settings);
settings.sirennote ??= structuredClone(sirennote.settings);

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
    state: 'standing',
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
    hold() {},
    pin() {},
    unpin() {},
    shove() {}
  };
}

function arena(Ability, bodies = []) {
  const counter = { emits: 0, decals: 0, bursts: 0 };
  const near = (x, z, r, out) => {
    out.length = 0;
    for (const b of bodies) if (Math.hypot(b.position.x - x, b.position.z - z) <= r) out.push(b);
    return out;
  };
  const ctx = {
    particles: mockParticles(counter),
    lights: { acquire: () => ({}), set() {}, release() {} },
    decals: { spawn: () => counter.decals++ },
    bursts: { spawn: () => counter.bursts++ },
    shake: { add() {}, rumble() {} },
    flash: { trigger() {} },
    dummies: {
      findTargets: (x, z, r, out) => near(x, z, r, out).filter((b) => b.alive),
      findBodies: near
    }
  };
  return { a: new Ability(ctx), counter };
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


test('secondself: the double runs the line, stands on the dial through the linger, pours away, the cast ends', () => {
  const bodies = [body(0.3, 6), body(0, 11.5), body(2.5, 11), body(7, 3)];
  const { a, counter } = arena(SecondSelfAbility, bodies);
  a.spawn(new Vector3(), new Vector3(0, 0, 1), 11);
  let frames = 0;
  let standFrames = 0;
  let dialFrames = 0;
  let maxEmit = 0;
  let maxHand = 0;
  let sandSeen = false;
  while (a.isActive && frames < 900) {
    const before = counter.emits;
    a.update(1 / 30);
    maxEmit = Math.max(maxEmit, counter.emits - before);
    frames++;
    if (a._arrived && a._figures > 0) standFrames++;
    if (a.dial.visible) dialFrames++;
    maxHand = Math.max(maxHand, Math.abs(a._hand));
    if (a._figureState.sandY < 100) sandSeen = true;
  }
  const seconds = frames / 30;
  assert.ok(seconds > 2.5 && seconds < 4.5, `screen time ${seconds}`);
  assert.ok(standFrames / 30 > 0.9, `the double stays as a figure through the linger (${standFrames / 30}s)`);
  assert.ok(dialFrames / 30 > 1.2, `the dial holds the floor (${dialFrames / 30}s)`);
  assert.ok(maxHand > 0.5, 'the dial hand keeps moving');
  assert.ok(sandSeen, 'it pours away as sand rather than popping');
  assert.equal(bodies[0].kills, 1, 'struck as it runs through');
  assert.equal(bodies[1].kills + bodies[2].kills, 2, 'the finale throws what is near');
  assert.equal(bodies[3].kills, 0, 'nothing far off the line');
  assert.ok(counter.decals >= 2 && counter.bursts >= 1, 'shock rings and shell');
  assert.ok(maxEmit < 2500, `bounded emission ${maxEmit}`);
  a.destroy();
  assert.ok(!a.figure.visible && !a.dial.visible && !a.run.visible);
});

test('secondself: reuse resets, editor exposes every key, dispose frees', () => {
  const { a } = arena(SecondSelfAbility);
  a.spawn(new Vector3(), new Vector3(0, 0, 1), 9);
  for (let i = 0; i < 70; i++) a.update(1 / 30);
  a.destroy();
  a.spawn(new Vector3(), new Vector3(0, 0, 1), 9);
  assert.equal(a._arrived, false);
  assert.equal(a._hand, 0);
  assert.equal(a.dial.visible, false);
  const keys = editorKeys(buildSecond, settings.secondself);
  for (const k of Object.keys(secondself.settings)) assert.ok(keys.has(k), `editor exposes ${k}`);
  let disposed = 0;
  for (const r of [a.dialMaterial, a.figureMaterial, a.runMaterial]) r.addEventListener('dispose', () => disposed++);
  a.destroy();
  a.dispose();
  assert.equal(disposed, 3);
});

test('sirennote: the note cuts the line, rings down through a linger, the floor crawls, the cast ends', () => {
  const bodies = [body(0, 6), body(0.2, 12), body(5, 6)];
  const { a, counter } = arena(SirenNoteAbility, bodies);
  a.spawn(new Vector3(), new Vector3(0, 0, 1), 12);
  let frames = 0;
  let afterImpactSheet = 0;
  let morph0 = null;
  let maxEmit = 0;
  while (a.isActive && frames < 900) {
    const before = counter.emits;
    a.update(1 / 30);
    maxEmit = Math.max(maxEmit, counter.emits - before);
    frames++;
    if (a.phase !== AbilityPhase.TRAVEL && a.sheet.visible) afterImpactSheet++;
    if (a.phase === AbilityPhase.IMPACT && morph0 === null) morph0 = a._morph;
  }
  const seconds = frames / 30;
  assert.ok(seconds > 2.5 && seconds < 4.5, `screen time ${seconds}`);
  assert.ok(afterImpactSheet / 30 > 1.4, `the sheet rings on after the scream (${afterImpactSheet / 30}s)`);
  assert.ok(a._morph - morph0 > 1, 'the Chladni floor keeps re-sorting through the linger');
  assert.equal(bodies[0].kills + bodies[1].kills, 2, 'cut on the line and thrown at the end');
  assert.equal(bodies[2].kills, 0, 'nothing off the line');
  assert.ok(counter.decals >= 2 && counter.bursts >= 1);
  assert.ok(maxEmit < 2500, `bounded emission ${maxEmit}`);
  a.destroy();
  assert.ok(!a.sheet.visible && !a.ground.visible && !a.frontDisc.visible);
});

test('sirennote: reuse resets, editor exposes every key', () => {
  const { a } = arena(SirenNoteAbility);
  a.spawn(new Vector3(), new Vector3(0, 0, 1), 10);
  for (let i = 0; i < 40; i++) a.update(1 / 30);
  a.destroy();
  a.spawn(new Vector3(), new Vector3(0, 0, 1), 10);
  assert.equal(a._morph, 0);
  assert.equal(a._screamed, false);
  const keys = editorKeys(buildSiren, settings.sirennote);
  for (const k of Object.keys(sirennote.settings)) assert.ok(keys.has(k), `editor exposes ${k}`);
});
