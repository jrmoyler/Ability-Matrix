import test from 'node:test';
import assert from 'node:assert/strict';
import { Scene, Vector3 } from 'three';
import { settings } from '../packs/sandbox/src/config/settings.js';
import { VigilOfEmbersAbility, ID, buildEditor } from '../packs/sandbox/src/abilities/expansion-2026/holy/VigilOfEmbersAbility.js';
import cfg from '../packs/sandbox/src/abilities/expansion-2026/holy/vigil-of-embers.config.js';

settings[ID] = structuredClone(cfg.settings);

function arena() {
  const events = [];
  const scope = {
    queryActors: ({ relation }) => ({ ok: true, actors: [{ id: relation === 'ally' ? 'caster' : 'dummy:1', alive: true }] }),
    emit: (e) => (events.push(e), { ok: true })
  };
  const ctx = { scene: new Scene(), lights: { acquire: () => ({}), set() {}, release() {} }, expansionCombat: { bind: () => scope } };
  const a = new VigilOfEmbersAbility(ctx);
  ctx.scene.add(a.group);
  return { a, events };
}

test('vigil: the runner is laid behind the votive and the sanctuary forms at the target before it arrives', () => {
  const { a, events } = arena();
  a.spawn(new Vector3(), new Vector3(1, 0, 0), 12);
  let sawRunner = false;
  let formedEarly = false;
  let upperHiddenEarly = true;
  while (a.phase === 'travel' || a.travelVigil.visible) {
    a.update(1 / 60);
    if (!a.travelVigil.visible) break;
    if (a.runner.visible) sawRunner = true;
    if (a.rig.visible) {
      formedEarly = true;
      if (a.bells.some((b) => b.visible) || a.crown.visible) upperHiddenEarly = false;
      assert.ok(a.mat.uniforms.uBuild.value < 1, 'only the feet are built before the arrival');
    }
  }
  assert.ok(sawRunner, 'the processional runner is drawn during travel');
  assert.ok(formedEarly, 'the sigil, column and arch feet form before the votive lands');
  assert.ok(upperHiddenEarly, 'bells and crown wait for the arrival');
  assert.equal(events.length, 0, 'forming early never pulses');
  // Arrival: everything stands; the runner is taken up from the hand end.
  for (let i = 0; i < 60; i++) a.update(1 / 60);
  assert.ok(a.bells.every((b) => b.visible) && a.crown.visible);
  assert.ok(events.length >= 2, 'the first pulse rings on arrival');
  assert.equal(a.runner.visible, false, 'the runner has been taken up');
  // Feet on the floor at any arch size.
  assert.ok(Math.abs(a.arches[0].position.y - a.arches[0].scale.x) < 1e-6);
  a.destroy();
  assert.equal(a.runner.visible, false);
  a.spawn(new Vector3(), new Vector3(1, 0, 0), 12);
  assert.equal(a._pre, 0);
  assert.equal(a.rig.visible, false);
  a.destroy();
  a.dispose();
});

test('vigil: the kindle climbs through the linger and every new key is in the editor', () => {
  const { a } = arena();
  a.spawn(new Vector3(), new Vector3(1, 0, 0), 3);
  for (let i = 0; i < 60; i++) a.update(1 / 60);
  const early = a.mat.uniforms.uKindle.value;
  for (let i = 0; i < 60; i++) a.update(1 / 60);
  assert.ok(a.mat.uniforms.uKindle.value > early, 'the veins keep climbing');
  a.destroy();
  a.dispose();

  const keys = new Set();
  const ctl = { name: () => ctl };
  const gui = { addFolder: () => gui, add: (o, k) => (keys.add(k), ctl), addColor: (o, k) => (keys.add(k), ctl) };
  const Editor = { range: (f, c, k) => (keys.add(k), ctl), gradient: (f, c, p) => { for (const s of 'ABCD') keys.add(p + s); }, castAnimation: () => keys.add('castAnim') };
  buildEditor(gui, settings[ID], Editor);
  for (const key of ['runnerWidth', 'runnerGlow', 'runnerFade', 'telegraphStart', 'telegraphBuild', 'telegraphReveal', 'kindleTime', 'stoneColor', 'deepColor', 'bellScale', 'groundDark']) {
    assert.ok(keys.has(key), key);
  }
});
