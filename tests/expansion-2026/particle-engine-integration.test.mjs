import test from 'node:test';
import assert from 'node:assert/strict';
import { Scene, Vector3 } from 'three';
import { ParticleEngine } from '../../packs/sandbox/src/particles/ParticleEngine.js';
import { frame } from '../../packs/sandbox/src/core/FrameUniforms.js';
import { settings } from '../../packs/sandbox/src/config/settings.js';
import { BATCH_C } from '../../packs/sandbox/src/abilities/expansion-2026/batch-c.js';
import { LAYER } from '../../packs/sandbox/src/core/Layers.js';
const lights = { acquire: () => ({}), release: () => {}, set: () => {} };
test('new candidates bind actual pooled GPU particle systems without per-cast allocation', () => {
  for (const { module } of BATCH_C) {
    settings[module.ID] = structuredClone(module.config.settings);
    const scene = new Scene(),
      particles = new ParticleEngine(scene);
    const dummy = { position: new Vector3(5, 0, 0), kill: () => true };
    let cb;
    const scope = {
      tickRate: 30,
      on: (type, fn) => {
        cb = fn;
        return {
          ok: true,
          unsubscribe() {
            cb = null;
          },
        };
      },
      queryActors: () => ({
        ok: true,
        actors: [{ id: 'enemy', alive: true, position: [5, 0, 0] }],
      }),
      getActor: () => ({ ok: true, actor: { statuses: [] } }),
      isBlocked: () => ({ ok: true, blocked: false }),
      emit: () => ({ ok: true }),
    };
    const a = new module.Ability({
      scene,
      lights,
      particles,
      character: { position: new Vector3() },
      dummies: {
        findTargets: (x, z, r, out) => {
          out.length = 0;
          out.push(dummy);
          return out;
        },
      },
      expansionCombat: { bind: () => scope },
    });
    let transparentMeshes = 0;
    a.group.traverse((mesh) => {
      if (!mesh.isMesh && !mesh.isLine && !mesh.isPoints) return;
      const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      if (!materials.some((material) => material?.transparent)) return;
      transparentMeshes++;
      assert.equal(mesh.layers.mask, 1 << LAYER.VFX, `${module.ID}: transparent effect must not enter world depth prepass`);
    });
    assert.ok(transparentMeshes > 0, module.ID);
    a.spawn(new Vector3(), new Vector3(1, 0, 0), 5);
    for (let i = 0; i < 240; i++) {
      frame.uTime.value = i / 60;
      if (cb && i === 1)
        cb({
          eventId: 'a',
          tick: 1,
          ownerId: 'caster',
          abilityUid: 'legacy/fire',
          targetIds: ['first'],
          position: [5, 0, 0],
        });
      if (cb && i === 19)
        cb({
          eventId: 'b',
          tick: 19,
          ownerId: 'caster',
          abilityUid: 'legacy/fire',
          targetIds: ['first'],
          position: [5, 0, 0],
        });
      a.update(1 / 60);
    }
    // The quality standard asks for several particle layers, so a cast may
    // own more than one pooled system; each stays inside its capacity.
    const systems = [...particles.systems.values()];
    assert.ok(systems.length >= 1, module.ID);
    assert.ok(systems.some((system) => system.cursor > 0), `${module.ID} did not emit during the cast`);
    for (const system of systems) assert.ok(system.cursor < system.capacity, module.ID);
    a.destroy();
    a.dispose();
    particles.dispose();
    assert.equal(particles.systems.size, 0);
    assert.equal(scene.children.length, 0);
  }
});
