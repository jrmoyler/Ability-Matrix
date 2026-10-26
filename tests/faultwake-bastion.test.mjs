import test from "node:test";
import assert from "node:assert/strict";
import { Matrix4, Vector3 } from "three";
import { settings } from "../packs/sandbox/src/config/settings.js";
import {
  FaultwakeBastionAbility,
  CONFIG,
  ID,
} from "../packs/sandbox/src/abilities/expansion-2026/earth/FaultwakeBastion.js";
settings[ID] = structuredClone(CONFIG.settings);
test("faultwake hits crossing targets once, not off-path bodies, and recycles", () => {
  let hits = 0;
  const target = {
      position: new Vector3(0, 0, 3),
      kill() {
        hits++;
        return true;
      },
    },
    off = {
      position: new Vector3(9, 0, 3),
      kill() {
        throw Error("off-path");
      },
    },
    ctx = {
      lights: { acquire: () => ({}), set() {}, release() {} },
      dummies: {
        findTargets(_x, _z, _r, out) {
          out.length = 0;
          out.push(target, off);
          return out;
        },
      },
    };
  let a = new FaultwakeBastionAbility(ctx);
  a.spawn(new Vector3(), new Vector3(0, 0, 1), 7);
  for (let i = 0; i < 60 && a.isActive; i++) a.update(0.05);
  assert.equal(hits, 1);
  a.destroy();
  assert.equal(a.columns.count, 0);
  a.dispose();
});
test("faultwake bounds pillar height, advances a direction-aligned fissure and disposes all effects", () => {
  const ctx = {
    lights: { acquire: () => ({}), set() {}, release() {} },
    dummies: {
      findTargets(_x, _z, _r, out) {
        out.length = 0;
        return out;
      },
    },
  };
  const a = new FaultwakeBastionAbility(ctx);
  a.spawn(new Vector3(), new Vector3(0, 0, 1), 7);
  for (let i = 0; i < 20; i++) a.update(0.05);
  assert.ok(a.crackMaterial.uniforms.uFront.value <= 1);
  a.group.updateMatrixWorld(true);
  const start = new Vector3(-0.5, 0, 0).applyMatrix4(a.crack.matrixWorld),
    end = new Vector3(0.5, 0, 0).applyMatrix4(a.crack.matrixWorld);
  assert.ok(end.z > start.z, "fissure UV advances with travel");
  assert.equal(a.debrisGeometry.attributes.position.count, 96);
  let disposed = 0;
  for (const r of [
    a.geo,
    a.mat,
    a.crackGeometry,
    a.crackMaterial,
    a.debrisGeometry,
    a.debrisMaterial,
  ])
    r.addEventListener("dispose", () => disposed++);
  a.destroy();
  assert.equal(a.crack.visible, false);
  assert.equal(a.debris.visible, false);
  a.dispose();
  assert.equal(disposed, 6);
});

test("earth debris clock continues after the eruption reaches its endpoint", () => {
  const a = new FaultwakeBastionAbility({
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
  const time = a.debrisMaterial.uniforms.uTime.value;
  a.update(0.1);
  assert.ok(a.debrisMaterial.uniforms.uTime.value > time);
  assert.equal(
    a.debrisMaterial.uniforms.uSpeed.value,
    a.config.speed * settings.global.speed,
  );
  assert.match(a.debrisMaterial.vertexShader, /uTime-along/);
  a.destroy();
  a.dispose();
});

test("rock columns have capped ends and the impact ring respects camera shake settings", () => {
  let shake = -1;
  const previous = settings.global.cameraShake;
  settings.global.cameraShake = 0;
  const a = new FaultwakeBastionAbility({
    shake: {
      add(v) {
        shake = v;
      },
    },
    lights: { acquire: () => ({}), set() {}, release() {} },
    dummies: {
      findTargets(_x, _z, _r, out) {
        out.length = 0;
        return out;
      },
    },
  });
  assert.equal(a.geo.attributes.position.count, 119);
  assert.equal(a.geo.index.count, 8 * 12 * 6 + 12 * 6);
  a.spawn(new Vector3(), new Vector3(0, 0, 1), 5);
  assert.equal(a.impactRing.visible, false);
  a.update(2);
  assert.equal(shake, 0);
  assert.equal(a.impactRing.visible, true);
  a.update(a.impactDuration * 0.5);
  assert.ok(a.impactRing.scale.x > 0.2);
  assert.ok(a.impactMaterial.uniforms.uFade.value < 1);
  let disposed = 0;
  for (const r of [a.impactGeometry, a.impactMaterial])
    r.addEventListener("dispose", () => disposed++);
  a.destroy();
  assert.equal(a.impactRing.visible, false);
  a.dispose();
  assert.equal(disposed, 2);
  settings.global.cameraShake = previous;
});

test("erupted columns overshoot then settle and retreat during fade", () => {
  const a = new FaultwakeBastionAbility({
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
  const m = new Matrix4(),
    scale = new Vector3(),
    position = new Vector3(),
    rotation = a.columns.quaternion.clone();
  const index = a.columns.count - 1;
  a.columns.getMatrixAt(index, m);
  m.decompose(position, rotation, scale);
  const initial = scale.y;
  a.update(0.1);
  a.columns.getMatrixAt(index, m);
  m.decompose(position, rotation, scale);
  assert.ok(scale.y > initial, "column heaves above its settled height");
  a.update(0.5);
  a.columns.getMatrixAt(index, m);
  m.decompose(position, rotation, scale);
  assert.ok(Math.abs(scale.y - initial) < 1e-5);
  a.update(a.fadeDuration * 0.5);
  a.columns.getMatrixAt(index, m);
  m.decompose(position, rotation, scale);
  assert.ok(position.y < 0, "column retreats beneath the ground");
  a.destroy();
  a.spawn(new Vector3(), new Vector3(0, 0, 1), 5);
  assert.ok(a.columnArrival.every((t) => t === -1));
  a.destroy();
  a.dispose();
});
