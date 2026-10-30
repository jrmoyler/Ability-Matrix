import test from 'node:test';
import assert from 'node:assert/strict';
import { Scene, Vector3 } from 'three';
import { settings } from '../packs/sandbox/src/config/settings.js';
import cfg from '../packs/sandbox/src/abilities/expansion-2026/shadow/nightshade-inheritance.config.js';
import { NightshadeInheritanceAbility } from '../packs/sandbox/src/abilities/expansion-2026/shadow/NightshadeInheritanceAbility.js';

settings[cfg.id] = structuredClone(cfg.settings);

function arena(actors) {
  const scope = {
    standalone: true,
    on: () => ({ ok: true, unsubscribe() {} }),
    queryActors: ({ position, radius }) => ({ ok: true, actors: actors.filter((a) => a.alive && Math.hypot(a.position[0] - position[0], a.position[2] - position[2]) <= radius) }),
    getActor: (id) => { const actor = actors.find((a) => a.id === id); return actor ? { ok: true, actor } : { ok: false }; },
    emit: () => ({ ok: true })
  };
  const scene = new Scene();
  const a = new NightshadeInheritanceAbility({ scene, lights: { acquire: () => ({}), set() {}, release() {} }, expansionCombat: { bind: () => scope } });
  scene.add(a.group);
  return a;
}
const tick = (a, s) => { for (let t = 0; t < s; t += 1 / 30) a.update(1 / 30); };

test('the bell rises over a marked host and roots reach toward two would-be heirs', () => {
  const actors = [
    { id: 'dummy:1', alive: true, position: [5, 0, 0] },
    { id: 'dummy:2', alive: true, position: [8, 0, 0] },
    { id: 'dummy:3', alive: true, position: [6, 0, 2] }
  ];
  const a = arena(actors);
  a.spawn(new Vector3(), new Vector3(1, 0, 0), 5);
  assert.equal(a.wake.visible, true);
  tick(a, 1.4);
  assert.equal(a.targetId, 'dummy:1');
  assert.equal(a.bloom.visible, true);
  assert.equal(a.petals.count, cfg.settings.bellPetals);
  assert.equal(a.blight.visible, true);
  assert.equal(a.tendrilCount, 2);
  assert.ok(a.tendrils.every((t) => t.visible));
  assert.ok(Math.abs(a.tendrils[0].scale.x - Math.hypot(1, 2)) < 1e-6);
  a.destroy();
  assert.equal(a.bloom.visible, false);
  assert.equal(a.blight.visible, false);
  a.dispose();
});

test('an empty circle still reads: the bell stands, then withers, and the blight stays', () => {
  const a = arena([]);
  a.spawn(new Vector3(), new Vector3(1, 0, 0), 5);
  tick(a, 0.9);
  assert.equal(a.targetId, null);
  assert.equal(a.bloom.visible, true);
  assert.equal(a.blight.visible, true);
  tick(a, 2.5);
  assert.equal(a.bloom.visible, false);
  assert.equal(a.blight.visible, true);
  a.destroy();
  a.dispose();
});
