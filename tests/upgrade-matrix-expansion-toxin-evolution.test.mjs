import test from 'node:test';
import assert from 'node:assert/strict';
import { Vector3 } from 'three';
import { settings } from '../packs/sandbox/src/config/settings.js';
import config from '../packs/sandbox/src/abilities/expansion-2026/poison/toxin-evolution.config.js';
import { ToxinEvolutionAbility, ID, buildEditor } from '../packs/sandbox/src/abilities/expansion-2026/poison/ToxinEvolutionAbility.js';
import { toxinTendrilGeometry, toxinTrailGeometry } from '../packs/sandbox/src/abilities/expansion-2026/poison/ToxinGeometry.js';
import { ThunderheadParasiteAbility, CONFIG, ID as THUNDER_ID, buildEditor as thunderEditor } from '../packs/sandbox/src/abilities/expansion-2026/storm/ThunderheadParasite.js';
import { createCloudGeometry } from '../packs/sandbox/src/abilities/expansion-2026/storm/ThunderheadParasiteGeometry.js';

settings[ID] = structuredClone(config.settings);
settings[THUNDER_ID] = structuredClone(CONFIG.settings);

/** A lil-gui stand-in that records every key a folder exposes. */
function recorder() {
  const keys = new Set();
  const ctl = { name: () => ctl, onChange: () => ctl };
  const folder = () => ({
    addFolder: () => folder(),
    add: (_o, k) => (keys.add(k), ctl),
    addColor: (_o, k) => (keys.add(k), ctl),
    close() {}
  });
  const Editor = {
    range: (f, c, k) => (keys.add(k), ctl),
    gradient: (f, c, prefix) => { for (const s of 'ABCD') keys.add(prefix + s); return f; },
    castAnimation: () => (keys.add('castAnim'), ctl)
  };
  return { keys, gui: folder(), Editor };
}

const finite = (g) => [...g.attributes.position.array].every(Number.isFinite);

test('every new toxin key is a live slider', () => {
  const { keys, gui, Editor } = recorder();
  buildEditor(gui, settings[ID], Editor);
  for (const k of Object.keys(config.settings)) if (/^(tendril|trail|deep|membraneOpacity)/.test(k)) assert.ok(keys.has(k), k);
});

test('every new thunderhead key is a live slider', () => {
  const { keys, gui, Editor } = recorder();
  thunderEditor(gui, settings[THUNDER_ID], Editor);
  for (const k of ['cloudBoil', 'cloudBoilRate', 'cloudTwist', 'cloudAnvil', 'cloudSwell', 'cloudSurge', 'cloudCrownLight', 'cloudLining', 'cloudEmber', 'flareSize', 'flareGlow', 'crackleGlow', 'crackleScale', 'scorchDarken']) {
    assert.ok(k in CONFIG.settings, k);
    assert.ok(keys.has(k), k);
  }
});

test('authored geometry is finite', () => {
  for (const g of [toxinTendrilGeometry(), toxinTrailGeometry(), createCloudGeometry(2)]) {
    assert.ok(finite(g));
    g.dispose();
  }
  const cloud = createCloudGeometry(2);
  for (const name of ['aLobe', 'aHeight', 'aCenter', 'aOcc']) assert.ok(cloud.attributes[name], name);
  cloud.dispose();
});

function toxinArena() {
  const actors = [{ id: 'dummy:1', alive: true, standGeneration: 1, position: [5, 0, 0] }];
  const facade = {
    queryActors: () => ({ ok: true, actors }),
    getActor: (id) => ({ ok: true, actor: actors.find((a) => a.id === id) }),
    emit: () => ({ ok: true })
  };
  const ctx = {
    lights: { acquire: () => ({}), set() {}, release() {} },
    expansionCombat: { bind: () => facade }
  };
  return new ToxinEvolutionAbility(ctx);
}

test('tendrils erupt on arrival, multiply per generation, sink on exit and reset on reuse', () => {
  const a = toxinArena();
  a.spawn(new Vector3(), new Vector3(1, 0, 0), 5);
  assert.equal(a.trail.visible, true);
  a.update(0.1);
  assert.ok(a.trailMat.uniforms.uHead.value > 0 && a.trailMat.uniforms.uHead.value < 1);
  for (let i = 0; i < 20; i++) a.update(0.05);
  const first = a.tendrils.count;
  assert.ok(first >= settings[ID].tendrilCount);
  assert.ok(a.tendrilLife.array[0] > 0.5);
  for (let i = 0; i < 60; i++) a.update(0.05);
  assert.ok(a.tendrils.count > first, 'later generations add tendrils');
  for (let i = 0; i < 200 && a.isActive; i++) a.update(0.05);
  assert.ok(a.tendrilLife.array[0] < 0.05, 'they sink on exit');
  a.destroy();
  a.spawn(new Vector3(), new Vector3(1, 0, 0), 5);
  assert.equal(a.tendrils.count, 0);
  a.destroy();
  a.dispose();
});

test('the thunderhead churns through the ride and flares on a bolt', () => {
  const actors = [{ id: 'dummy:1', alive: true, position: [0, 0, 8] }];
  const facade = {
    queryActors: () => ({ ok: true, actors }),
    getActor: (id) => ({ ok: true, actor: actors.find((x) => x.id === id) }),
    on: () => ({ ok: true, unsubscribe() {} }),
    emit: () => ({ ok: true })
  };
  const ctx = {
    lights: { acquire: () => ({}), set() {}, release() {} },
    bursts: { spawn() {} },
    decals: { spawn() {} },
    expansionCombat: { bind: () => facade }
  };
  const a = new ThunderheadParasiteAbility(ctx);
  a.spawn(new Vector3(), new Vector3(0, 0, 1), 8);
  let flared = false;
  for (let i = 0; i < 12; i++) { a.update(0.05); flared ||= a.flare.visible; }
  assert.ok(flared, 'the bite lands with a contact flare');
  for (let i = 0; i < 18; i++) a.update(0.05);
  const u = a.cloudMaterial.uniforms;
  const twist = u.uTwist.value, anvil = u.uAnvil.value, scale = a.cloud.scale.x;
  for (let i = 0; i < 40; i++) a.update(0.05);
  assert.ok(u.uTwist.value > twist, 'the crown wheels');
  assert.ok(u.uAnvil.value > anvil, 'the anvil spreads');
  assert.ok(a.cloud.scale.x > scale, 'it swells as it feeds');
  a.destroy();
  assert.equal(a.flare.visible, false);
  a.dispose();
});
