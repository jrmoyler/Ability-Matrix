import test from 'node:test';
import assert from 'node:assert/strict';
import { Vector3 } from 'three';
import { settings } from '../packs/sandbox/src/config/settings.js';
import { ThunderheadParasiteAbility, CONFIG, ID } from '../packs/sandbox/src/abilities/expansion-2026/storm/ThunderheadParasite.js';
settings[ID] = structuredClone(CONFIG.settings);

function make(actors) {
  const events = [], bursts = [], decals = [];
  const facade = {
    queryActors: () => ({ ok: true, actors }),
    getActor: (id) => ({ ok: true, actor: actors.find((x) => x.id === id) }),
    on: () => ({ ok: true, unsubscribe() {} }),
    emit: (e) => (events.push(e), { ok: true })
  };
  const ctx = {
    lights: { acquire: () => ({}), set() {}, release() {} },
    bursts: { spawn: (mode) => bursts.push(mode) },
    decals: { spawn: (type) => decals.push(type) },
    expansionCombat: { bind: () => facade }
  };
  return { a: new ThunderheadParasiteAbility(ctx), events, bursts, decals };
}

test('the stormlet is leashed to the hand in flight', () => {
  const { a } = make([]);
  a.spawn(new Vector3(), new Vector3(0, 0, 1), 8);
  a.update(0.05);
  assert.equal(a.strands[0].visible, true);
  a.destroy();
  a.dispose();
});

test('the bite and the feeding bolts are presentation only, host or not', () => {
  for (const actors of [[{ id: 'dummy:1', alive: true, position: [0, 0, 8] }], []]) {
    const { a, events, bursts, decals } = make(actors);
    a.spawn(new Vector3(), new Vector3(0, 0, 1), 8);
    for (let i = 0; i < 20; i++) a.update(0.05);
    assert.ok(bursts.length >= 2, 'arrival shell + bite shell');
    const afterBite = decals.length;
    for (let i = 0; i < 60; i++) a.update(0.05);
    assert.ok(decals.length > afterBite, 'feeding bolts burn the floor');
    assert.equal(events.length, 0, 'no combat event without a retaliation');
    a.destroy();
    a.dispose();
  }
});
