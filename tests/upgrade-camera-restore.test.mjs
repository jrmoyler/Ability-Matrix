// Regression: Chrono Recall and Rune Meteor used to leave the sandbox camera
// pitched top-down for the rest of the session.
//
// Cause: `core/CameraRig.js` keeps the camera's direction to its orbit target
// and lets OrbitControls re-measure the angles every frame, so moving the
// target rotates the orbit. Rune Meteor framed its star 26 m up (target rose,
// pitch clamped at maxPolar, then fell back steeper than it began); Chrono
// Recall runs the caster ~12 m out and snaps it home (same ratchet,
// horizontally). Each cast now keeps the pitch it found (a cast-local
// `PitchKeeper` read through `ctx.shake.rig`), through the cast, a short
// settle, and a clear.
//
// This drives the real CameraRig + CameraShake in the App's frame order.
import test from 'node:test';
import assert from 'node:assert/strict';
import { MathUtils, Object3D, Vector3 } from 'three';

globalThis.window ??= { innerWidth: 1280, innerHeight: 800 };
const el = {
  getBoundingClientRect: () => ({ width: 1280, height: 800 }),
  addEventListener() {},
  removeEventListener() {},
  style: {},
  ownerDocument: { addEventListener() {}, removeEventListener() {} },
  getRootNode() { return { addEventListener() {}, removeEventListener() {} }; },
  setPointerCapture() {},
  releasePointerCapture() {},
  clientWidth: 1280,
  clientHeight: 800
};

const { settings } = await import('../packs/sandbox/src/config/settings.js');
const { CameraRig } = await import('../packs/sandbox/src/core/CameraRig.js');
const { CameraShake } = await import('../packs/sandbox/src/effects/CameraShake.js');
const Recall = await import('../packs/sandbox/src/abilities/atlas/ChronoRecallAbility.js');
const Meteor = await import('../packs/sandbox/src/abilities/codex/RuneMeteorAbility.js');

const mock = () =>
  new Proxy(function () {}, {
    get: (_, k) => (k === Symbol.toPrimitive ? () => 0 : k === 'then' ? undefined : mock()),
    apply: () => mock()
  });

const DT = 1 / 30;

function world(Module) {
  settings.camera.distance = 8;
  settings.camera.zoomDamping = 1e-9;
  const rig = new CameraRig(el);
  const shake = new CameraShake(rig);
  const character = {
    position: new Vector3(),
    facing: 0,
    root: new Object3D(),
    setFacing(y) { this.facing = y; },
    playCast() {},
    castLunge() {}
  };
  const hits = [];
  const dummy = { position: new Vector3(), kill: (x, z, f) => (hits.push(f), true) };
  const ctx = {
    scene: new Object3D(),
    camera: rig.camera,
    particles: mock(),
    lights: mock(),
    decals: mock(),
    bursts: mock(),
    flash: mock(),
    models: mock(),
    environment: mock(),
    shake,
    character,
    dummies: { findTargets: (x, z, r, out) => { out.length = 0; dummy.position.set(x, 0, z); out.push(dummy); return out; } }
  };
  const Ability = Module[Object.keys(Module).find((k) => k.endsWith("Ability"))];
  const ability = new Ability(ctx);
  const active = [];
  // App#frame: abilities, then focus, anchor, shake, rig.
  const frame = () => {
    for (let i = active.length - 1; i >= 0; i--) {
      active[i].update(DT);
      if (active[i].isFinished) { active[i].destroy(); active.splice(i, 1); }
    }
    const focus = [...active].reverse().find((a) => a.isActive);
    if (focus) rig.lookAt(focus.position, MathUtils.clamp(1 - focus.u * 0.4, 0, 1));
    rig.setAnchor(character.position.x, 0, character.position.z);
    shake.update(DT);
    rig.update(DT);
  };
  const polar = () => {
    const o = rig.camera.position.clone().sub(rig.controls.target);
    return Math.acos(o.y / o.length());
  };
  const cast = () => {
    const fwd = new Vector3();
    rig.camera.getWorldDirection(fwd);
    fwd.setY(0).normalize();
    ability.spawn(new Vector3(), fwd, (settings[Module.ID].range ?? 10) * 0.7);
    active.push(ability);
  };
  // Clear, as App#clearEffects does it: destroy everything, reset the shake.
  const clear = () => { for (const a of active) a.destroy(); active.length = 0; shake.reset(); };
  for (let i = 0; i < 90; i++) frame();
  return { rig, ability, active, frame, polar, cast, clear, character, hits };
}

for (const [name, Module] of [['atlas/recall', Recall], ['codex/runemeteor', Meteor]]) {
  test(`${name}: the camera pitch is the same after the cast as before it`, () => {
    const w = world(Module);
    const before = w.polar();
    let worst = 0;
    w.cast();
    for (let i = 0; i < 900 && w.active.length; i++) {
      w.frame();
      worst = Math.max(worst, Math.abs(w.polar() - before));
    }
    assert.equal(w.active.length, 0, 'the cast finishes');
    for (let i = 0; i < 120; i++) w.frame();
    assert.ok(Math.abs(w.polar() - before) < 0.02, `pitch restored (${before.toFixed(3)} → ${w.polar().toFixed(3)})`);
    assert.ok(worst < 0.06, `pitch held through the cast (worst drift ${worst.toFixed(3)} rad)`);
    // The orbit target is back on the caster.
    assert.ok(Math.hypot(w.rig.controls.target.x - w.character.position.x, w.rig.controls.target.z - w.character.position.z) < 0.1);
    // Five casts in a row do not compound.
    for (let n = 0; n < 5; n++) {
      w.cast();
      for (let i = 0; i < 900 && w.active.length; i++) w.frame();
    }
    for (let i = 0; i < 120; i++) w.frame();
    assert.ok(Math.abs(w.polar() - before) < 0.03, `pitch after six casts ${w.polar().toFixed(3)}`);
  });

  test(`${name}: a clear mid-cast restores the camera at once and it stays`, () => {
    for (const at of [10, 25, 45, 70]) {
      const w = world(Module);
      const before = w.polar();
      w.cast();
      for (let i = 0; i < at && w.active.length; i++) w.frame();
      w.clear();
      assert.ok(Math.abs(w.polar() - before) < 0.02, `restored on clear at frame ${at}: ${w.polar().toFixed(3)} vs ${before.toFixed(3)}`);
      for (let i = 0; i < 150; i++) w.frame();
      assert.ok(Math.abs(w.polar() - before) < 0.02, `still level 5 s after a clear at frame ${at}: ${w.polar().toFixed(3)}`);
      assert.equal(w.rig.focusWeight, 0);
      // The caster is home (Recall puts the body back on a clear).
      assert.ok(w.character.position.length() < 1e-6);
    }
  });

  test(`${name}: the test is sensitive — with the hold off the old drift comes back`, () => {
    const hold = settings[Module.ID].cameraHold;
    settings[Module.ID].cameraHold = 0;
    try {
      const w = world(Module);
      const before = w.polar();
      w.cast();
      for (let i = 0; i < 900 && w.active.length; i++) w.frame();
      for (let i = 0; i < 120; i++) w.frame();
      assert.ok(before - w.polar() > 0.3, `unheld, the camera pitches down (${before.toFixed(3)} → ${w.polar().toFixed(3)})`);
    } finally {
      settings[Module.ID].cameraHold = hold;
    }
  });
}
