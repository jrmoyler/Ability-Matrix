import test from 'node:test';
import assert from 'node:assert/strict';
import { Scene, Vector3 } from 'three';
import { settings } from '../packs/sandbox/src/config/settings.js';
import { ToxinEvolutionAbility, ID } from '../packs/sandbox/src/abilities/expansion-2026/poison/ToxinEvolutionAbility.js';
import cfg from '../packs/sandbox/src/abilities/expansion-2026/poison/toxin-evolution.config.js';
settings[ID] = structuredClone(cfg.settings);

function arena(actors) {
  const scene = new Scene(), events = [];
  const scope = {
    queryActors: ({ position, radius }) => ({ ok: true, actors: actors.filter((a) => a.alive && Math.hypot(a.position[0] - position[0], a.position[2] - position[2]) <= radius) }),
    getActor: (id) => ({ ok: true, actor: actors.find((a) => a.id === id) }),
    emit: (e) => (events.push(e), { ok: true })
  };
  const ctx = { scene, lights: { acquire: () => ({}), set() {}, release() {} }, expansionCombat: { bind: () => scope } };
  const a = new ToxinEvolutionAbility(ctx);
  scene.add(a.group);
  return { a, events };
}
const tick = (a, s) => { for (let i = 0; i < s * 60; i++) a.update(1 / 60); };

test('the blight telegraphs the search circle during travel, sized from zoneRadius', () => {
  const { a } = arena([{ id: 'd', alive: true, position: [6, 0, 0] }]);
  a.spawn(new Vector3(), new Vector3(1, 0, 0), 6);
  assert.equal(a.blight.visible, true);
  assert.equal(a.blight.position.x, 6);
  a.update(0.15);
  const reach = a.blightMat.uniforms.uReach.value;
  assert.ok(reach > 0 && reach <= a.config.blightTelegraph + 1e-6);
  assert.ok(Math.abs(a.blight.scale.x - a.config.zoneRadius * a.config.blightScale) < 1e-6);
  tick(a, 1.5);
  assert.ok(a.blightMat.uniforms.uReach.value > reach);
  a.destroy();
  assert.equal(a.blight.visible, false);
  a.dispose();
});

test('no host: a dormant colony rises at the aim point, strikes nothing, then withers', () => {
  const { a, events } = arena([]);
  a.spawn(new Vector3(), new Vector3(1, 0, 0), 6);
  tick(a, 0.5);
  assert.equal(a.dormant, true);
  assert.equal(a.targetId, null);
  assert.equal(a.effect.visible, true);
  assert.equal(a.effect.position.x, 6);
  tick(a, 0.5);
  assert.ok(a.body.scale.x > 0);
  tick(a, a.config.dormantTime + a.config.releaseDuration + 0.2);
  assert.equal(a.effect.visible, false);
  assert.equal(events.length, 0);
  a.destroy();
  a.spawn(new Vector3(), new Vector3(1, 0, 0), 6);
  assert.equal(a.dormant, false);
  a.destroy();
  a.dispose();
});
