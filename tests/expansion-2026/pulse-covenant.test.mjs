import test from 'node:test';
import assert from 'node:assert/strict';
import { Matrix4, Scene, Vector3 } from 'three';
import { LightPool } from '../../packs/sandbox/src/effects/LightPool.js';
import { settings } from '../../packs/sandbox/src/config/settings.js';
import config from '../../packs/sandbox/src/abilities/expansion-2026/pulse-covenant/config.js';
import {
  Ability,
  ID,
} from '../../packs/sandbox/src/abilities/expansion-2026/pulse-covenant/index.js';
settings[ID] = structuredClone(config.settings);
function setup() {
  let callback,
    unsub = 0;
  const emits = [];
  const scope = {
    tickRate: 30,
    on: (type, fn) => {
      assert.equal(type, 'hit');
      callback = fn;
      return { ok: true, unsubscribe: () => unsub++ };
    },
    queryActors: () => ({
      ok: true,
      actors: [
        { id: 'first', alive: true },
        { id: 'near', alive: true },
        { id: 'dead', alive: false },
      ],
    }),
    emit: (e) => (emits.push(e), { ok: true, eventId: 'out' }),
  };
  const a = new Ability({
    character: { position: new Vector3() },
    lights: { acquire: () => ({}), release: () => {}, set: () => {} },
    expansionCombat: {
      bind: (uid, owner) => {
        assert.equal(uid, 'matrix-expansion/pulse-covenant');
        assert.equal(owner, 'caster');
        return scope;
      },
    },
  });
  a.spawn(new Vector3(), new Vector3(1, 0, 0), 1);
  return { a, emits, send: (e) => callback(e), unsubs: () => unsub };
}
const hit = (id, tick, extra = {}) => ({
  eventId: id,
  tick,
  ownerId: 'caster',
  abilityUid: 'codex/foo',
  targetIds: ['first'],
  position: [1, 0, 0],
  ...extra,
});
test('only distinct in-rhythm owned strikes produce bounded secondary blood pulses and unsubscribe on clear', () => {
  const { a, emits, send, unsubs } = setup();
  send(hit('a', 1));
  send(hit('b', 19));
  assert.equal(emits.length, 1);
  assert.deepEqual(emits[0].targetIds, ['near']);
  assert.equal(emits[0].element, 'blood');
  a.update(.1);
  assert.equal(a.pulseWave.visible, true);
  assert.equal(a.pulseWave.position.x, 1);
  assert.ok(a.pulseWave.scale.x < config.settings.pulseRadius);
  send(hit('b', 19));
  send(hit('c', 37, { abilityUid: 'matrix-expansion/pulse-covenant' }));
  send(hit('d', 100));
  assert.equal(emits.length, 1);
  a.destroy();
  assert.equal(unsubs(), 1);
  send(hit('e', 118));
  assert.equal(emits.length, 1);
  a.dispose();
  assert.equal(unsubs(), 1);
});
test('heart, arteries and pulse floor have bounded finite geometry and release all resources', () => {
  const { a } = setup();
  let meshes = 0;
  a.root.traverse((o) => {
    if (o.isMesh) {
      meshes++;
      const p = o.geometry.attributes.position;
      for (let i = 0; i < p.count; i++)
        assert.ok(
          Number.isFinite(p.getX(i)) &&
            Number.isFinite(p.getY(i)) &&
            Number.isFinite(p.getZ(i)),
        );
    }
  });
  assert.ok(meshes >= 9);
  let disposed = 0;
  for (const r of a.resources) r.addEventListener('dispose', () => disposed++);
  a.dispose();
  a.dispose();
  assert.equal(disposed, a.resources.length);
});
test('interleaved hits from an earlier cast do not count as a new beat', () => {
  const { a, emits, send } = setup();
  send(hit('a1', 1, { castId: 'cast-a' }));
  send(hit('b1', 19, { castId: 'cast-b' }));
  assert.equal(emits.length, 1);
  send(hit('a2', 37, { castId: 'cast-a' }));
  assert.equal(emits.length, 1);
  send(hit('c1', 37, { castId: 'cast-c' }));
  assert.equal(emits.length, 2);
  a.destroy();
  a.dispose();
});
test('pooled vessel beads travel along the actual authored blood branches', () => {
  const { a } = setup();
  assert.equal(a.vesselBeads.count, 18);
  const matrix = new Matrix4();
  a.vesselBeads.getMatrixAt(0, matrix);
  const before = new Vector3().setFromMatrixPosition(matrix);
  a.update(.15);
  a.vesselBeads.getMatrixAt(0, matrix);
  const after = new Vector3().setFromMatrixPosition(matrix);
  assert.ok(before.distanceTo(after) > .1);
  assert.ok(after.length() < 3);
  a.destroy(); a.dispose();
});
test('a successful secondary pulse lights its actual contact point and releases the light', () => {
  let callback;
  const allocated = [], released = [], updates = [];
  const lights = {
    acquire() { const light = {}; allocated.push(light); return light; },
    release(light) { released.push(light); },
    set(light, position) { updates.push({light, position:position.clone()}); },
  };
  const scope = {tickRate:30, on(_type, fn) { callback=fn; return {ok:true, unsubscribe(){}}; },
    queryActors() { return {ok:true, actors:[{id:'near',alive:true}]}; },
    emit() { return {ok:true}; }};
  const a = new Ability({character:{position:new Vector3()}, lights, expansionCombat:{bind:()=>scope}});
  a.spawn(new Vector3(), new Vector3(1,0,0), 1);
  callback(hit('one',1)); callback(hit('two',19));
  assert.equal(allocated.length, 2);
  a.update(.1);
  assert.ok(updates.some((update) => update.light === allocated[1] && update.position.x === 1));
  a.update(.7);
  assert.ok(released.includes(allocated[1]));
  a.destroy(); a.dispose();
});
test('secondary impact uses and returns a real sandbox light-pool slot', () => {
  let callback;
  const lights = new LightPool(new Scene());
  const scope = {tickRate:30, on(_type, fn) { callback=fn; return {ok:true, unsubscribe(){}}; },
    queryActors() { return {ok:true, actors:[{id:'near',alive:true}]}; }, emit() { return {ok:true}; }};
  const a = new Ability({character:{position:new Vector3()}, lights, expansionCombat:{bind:()=>scope}});
  a.spawn(new Vector3(), new Vector3(1,0,0), 1);
  callback(hit('one',1)); callback(hit('two',19));
  assert.equal(lights.lights.filter((entry) => entry.inUse).length, 2);
  a.update(.1);
  const secondary = a._pulseLight.light;
  assert.equal(secondary.position.x, 1);
  a.update(.7);
  assert.equal(lights.lights.filter((entry) => entry.inUse).length, 1);
  a.destroy(); a.dispose();
  assert.equal(lights.lights.filter((entry) => entry.inUse).length, 0);
  lights.dispose();
});
