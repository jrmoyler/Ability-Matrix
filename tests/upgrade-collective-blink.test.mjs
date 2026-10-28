import test from 'node:test';
import assert from 'node:assert/strict';
import { Object3D, Vector3 } from 'three';
import { settings } from '../packs/sandbox/src/config/settings.js';
import { BlinkStepAbility } from '../packs/sandbox/src/abilities/collective/BlinkStepAbility.js';
import blinkConfig from '../packs/sandbox/src/config/collective/blink.js';

settings.blink = structuredClone(blinkConfig.settings);

function mockCtx() {
  const log = { emitted: 0, decals: 0, bursts: 0, flashes: 0 };
  const uniform = () => new Proxy({}, { get: (t, k) => (t[k] ??= { value: k === 'uGravity' ? new Vector3() : 0 }) });
  const system = () => ({
    uniforms: uniform(),
    setGradient() {},
    emit(n) {
      assert.ok(Number.isFinite(n) && n >= 0);
      log.emitted += n;
    }
  });
  const root = new Object3D();
  const character = {
    root,
    get position() {
      return root.position;
    },
    setFacing() {}
  };
  return {
    log,
    character,
    lights: { acquire: () => ({}), set() {}, release() {} },
    particles: { get: () => system() },
    decals: { spawn: () => log.decals++ },
    bursts: { spawn: () => log.bursts++ },
    shake: { add() {}, rumble() {} },
    flash: { trigger: () => log.flashes++ }
  };
}

test('blink: rifts at both ends, a scar that stays, a linger, the caster moved and restored', () => {
  const ctx = mockCtx();
  const a = new BlinkStepAbility(ctx);
  a.spawn(new Vector3(), new Vector3(0, 0, 1), 12);
  a.update(1 / 30);
  assert.equal(a.departRift.visible, true, 'the departure rift splits with the vanish');
  let sawArrive = false;
  let lingerFrames = 0;
  let steps = 0;
  while (a.isActive && steps < 400) {
    a.update(1 / 30);
    steps++;
    if (a.arriveRift.visible) sawArrive = true;
    if (a._arriveAge > 0.6 && a.scar.visible && a.arriveRift.visible) lingerFrames++;
  }
  assert.ok(!a.isActive, 'finishes');
  assert.ok(sawArrive, 'arrival rift shown');
  assert.ok(lingerFrames > 5, 'rift and scar linger past the landing');
  assert.equal(ctx.character.position.z, 12, 'caster moved to the end of the line');
  assert.equal(ctx.character.root.visible, true);
  assert.equal(ctx.character.root.scale.x, 1);
  assert.ok(ctx.log.decals >= 4, 'shock, dust and two scorches');
  const total = steps / 30;
  assert.ok(total > 2 && total < 4.5, `screen time ${total}`);

  // Reuse resets; clear mid-transit restores the body where it stood.
  a.destroy();
  a.spawn(new Vector3(0, 0, 12), new Vector3(1, 0, 0), 10);
  for (let i = 0; i < 6; i++) a.update(1 / 30);
  assert.equal(ctx.character.root.visible, false, 'hidden in transit');
  a.destroy();
  assert.equal(ctx.character.root.visible, true);
  assert.equal(ctx.character.position.x, 0, 'not moved when cleared mid-transit');
  assert.equal(a.scar.visible, false);
  assert.equal(a.departRift.visible, false);
  a.dispose();
});
