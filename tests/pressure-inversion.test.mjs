import test from "node:test";
import assert from "node:assert/strict";
import { Vector3 } from "three";
import { settings } from "../packs/sandbox/src/config/settings.js";
import {
  PressureInversionAbility,
  CONFIG,
  ID,
} from "../packs/sandbox/src/abilities/expansion-2026/wind/PressureInversion.js";
settings[ID] = structuredClone(CONFIG.settings);
test("pressure well pulls inward then inverts and releases its bodies on cleanup", () => {
  let velocities = [],
    shove = 0,
    release = 0;
  const target = {
      position: new Vector3(1, 0, 5),
      kill() {
        return true;
      },
      carry(field) {
        let out = new Vector3();
        field(1, 0, 5, out);
        velocities.push(out.x);
      },
      shove() {
        shove++;
      },
      release() {
        release++;
      },
    },
    ctx = {
      lights: { acquire: () => ({}), set() {}, release() {} },
      dummies: {
        findTargets(_x, _z, _r, out) {
          out.length = 0;
          out.push(target);
          return out;
        },
      },
    };
  const a = new PressureInversionAbility(ctx);
  a.spawn(new Vector3(), new Vector3(0, 0, 1), 5);
  for (let i = 0; i < 100 && a.isActive; i++) a.update(0.05);
  assert.ok(velocities.some((v) => v < 0));
  assert.ok(velocities.some((v) => v > 0));
  assert.equal(shove, 1);
  a.destroy();
  assert.equal(release, 1);
  a.dispose();
  assert.equal(release, 1);
});

test("inversion reverses wind particles and disposes its ground and airborne layers", () => {
  const a = new PressureInversionAbility({
    lights: { acquire: () => ({}), set() {}, release() {} },
    dummies: {
      findTargets(_x, _z, _r, out) {
        out.length = 0;
        return out;
      },
    },
  });
  a.spawn(new Vector3(), new Vector3(0, 0, 1), 5);
  a.update(2);
  a.update(a.impactDuration * 0.7);
  assert.equal(a.dustMaterial.uniforms.uPolarity.value, -1);
  assert.equal(a.floorMaterial.uniforms.uPolarity.value, -1);
  let disposed = 0;
  for (const r of [
    a.dustGeometry,
    a.dustMaterial,
    a.floorGeometry,
    a.floorMaterial,
  ])
    r.addEventListener("dispose", () => disposed++);
  a.destroy();
  a.dispose();
  assert.equal(disposed, 4);
});

test("a reused dummy slot is released and can be caught again", () => {
  let kills = 0,
    releases = 0;
  const target = {
    position: new Vector3(1, 0, 5),
    state: "alive",
    get alive() {
      return this.state === "alive";
    },
    kill() {
      this.state = "down";
      kills++;
      return true;
    },
    carry() {},
    release() {
      releases++;
    },
  };
  const a = new PressureInversionAbility({
    lights: { acquire: () => ({}), set() {}, release() {} },
    dummies: {
      findTargets(_x, _z, _r, out) {
        out.length = 0;
        if (target.alive) out.push(target);
        return out;
      },
    },
  });
  a.spawn(new Vector3(), new Vector3(0, 0, 1), 5);
  a.update(2);
  a.update(0.1);
  assert.equal(kills, 1);
  target.state = "alive";
  a.update(0.1);
  assert.equal(releases, 1);
  assert.equal(kills, 2);
  a.destroy();
  assert.equal(releases, 2);
  a.dispose();
});

test("inversion restores gravity when the gust ends rather than after visual fade", () => {
  let releases = 0;
  const target = {
    position: new Vector3(1, 0, 5),
    kill() {
      return true;
    },
    carry() {},
    shove() {},
    release() {
      releases++;
    },
  };
  const a = new PressureInversionAbility({
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
  a.update(2);
  a.update(a.impactDuration);
  assert.equal(releases, 0);
  a.update(0.05);
  assert.equal(releases, 1);
  assert.equal(a.held.size, 0);
  a.destroy();
  a.dispose();
  assert.equal(releases, 1);
});
