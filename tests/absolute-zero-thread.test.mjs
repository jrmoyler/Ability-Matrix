import test from "node:test";
import assert from "node:assert/strict";
import { Vector3, Group } from "three";
import { settings } from "../packs/sandbox/src/config/settings.js";
import {
  AbsoluteZeroThreadAbility,
  CONFIG,
  ID,
} from "../packs/sandbox/src/abilities/expansion-2026/frost/AbsoluteZeroThread.js";
settings[ID] = structuredClone(CONFIG.settings);
test("thread sweeps line and freezes after a delay once per body", () => {
  let count = 0;
  const target = {
      position: new Vector3(0, 0, 2),
      root: new Group(),
      freeze() {
        count++;
        return true;
      },
    },
    outside = {
      position: new Vector3(5, 0, 2),
      freeze() {
        throw Error("off-path target");
      },
    };
  const ctx = {
    lights: { acquire: () => ({}), set() {}, release() {} },
    dummies: {
      findTargets(_x, _z, _r, out) {
        out.length = 0;
        out.push(target, outside);
        return out;
      },
    },
  };
  const a = new AbsoluteZeroThreadAbility(ctx);
  a.spawn(new Vector3(), new Vector3(0, 0, 1), 5);
  a.update(0.05);
  a.update(0.05);
  assert.equal(count, 0);
  for (let i = 0; i < 30; i++) a.update(0.05);
  assert.equal(count, 1);
  a.destroy();
  a.spawn(new Vector3(), new Vector3(0, 0, 1), 5);
  for (let i = 0; i < 30; i++) a.update(0.05);
  assert.equal(count, 2);
  a.destroy();
  a.dispose();
});

test("frost motes advance with the filament and ring resources are reclaimed", () => {
  const a = new AbsoluteZeroThreadAbility({
    lights: { acquire: () => ({}), set() {}, release() {} },
    dummies: {
      findTargets(_x, _z, _r, out) {
        out.length = 0;
        return out;
      },
    },
  });
  a.spawn(new Vector3(), new Vector3(0, 0, 1), 10);
  assert.equal(a.motesMat.uniforms.uLength.value, 0);
  a.update(0.1);
  assert.ok(
    a.motesMat.uniforms.uLength.value > 0 &&
      a.motesMat.uniforms.uLength.value < 10,
  );
  let disposed = 0;
  for (const r of [a.frostRingGeometry, a.frostRingMaterial])
    r.addEventListener("dispose", () => disposed++);
  a.destroy();
  a.dispose();
  assert.equal(disposed, 2);
});

test("pending freeze is cancelled when its target dies before the delay", () => {
  let freezes = 0;
  const target = {
    position: new Vector3(0, 0, 2),
    root: new Group(),
    alive: true,
    freeze() {
      freezes++;
      return true;
    },
  };
  const a = new AbsoluteZeroThreadAbility({
    lights: { acquire: () => ({}), set() {}, release() {} },
    dummies: {
      findTargets(_x, _z, _r, out) {
        out.length = 0;
        out.push(target);
        return out;
      },
    },
  });
  a.spawn(new Vector3(), new Vector3(0, 0, 1), 5);
  a.update(0.1);
  assert.equal(a.pending.length, 1);
  target.alive = false;
  a.update(0.05);
  assert.equal(a.pending.length, 0);
  target.alive = true;
  for (let i = 0; i < 10; i++) a.update(0.1);
  assert.equal(freezes, 0, "the later occupant is not frozen by the old hit");
  a.destroy();
  a.dispose();
});

test("shatter chips use bounded reusable slots and are released on cancellation", () => {
  const a = new AbsoluteZeroThreadAbility({
    lights: { acquire: () => ({}), set() {}, release() {} },
    dummies: {
      findTargets(_x, _z, _r, out) {
        out.length = 0;
        return out;
      },
    },
  });
  a.spawn(new Vector3(), new Vector3(0, 0, 1), 5);
  for (let i = 0; i < 12; i++) a._shatter(new Vector3(i, 0, 0));
  assert.equal(a.shatters.length, 8);
  assert.equal(a.shatters.filter((s) => s.points.visible).length, 8);
  let disposed = 0;
  for (const r of [a.chipGeometry, ...a.shatters.map((s) => s.points.material)])
    r.addEventListener("dispose", () => disposed++);
  a.destroy();
  assert.ok(a.shatters.every((s) => !s.points.visible));
  a.dispose();
  assert.equal(disposed, 9);
});
