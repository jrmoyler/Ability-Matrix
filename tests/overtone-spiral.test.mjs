import test from "node:test";
import assert from "node:assert/strict";
import { Vector3 } from "three";
import { settings } from "../packs/sandbox/src/config/settings.js";
import {
  OvertoneSpiralAbility,
  CONFIG,
  ID,
} from "../packs/sandbox/src/abilities/expansion-2026/sound/OvertoneSpiral.js";
settings[ID] = structuredClone(CONFIG.settings);
test("three expanding harmonic fronts apply separate impulses and stop on cleanup", () => {
  let hits = 0,
    pushes = 0;
  const target = {
      position: new Vector3(2, 0, 4),
      alive: true,
      kill() {
        hits++;
        this.alive = false;
        return true;
      },
      bodyPoint(v) {
        return v.copy(this.position);
      },
      shove() {
        pushes++;
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
        findBodies(_x, _z, _r, out) {
          out.length = 0;
          out.push(target);
          return out;
        },
      },
    };
  const a = new OvertoneSpiralAbility(ctx);
  a.spawn(new Vector3(), new Vector3(0, 0, 1), 4);
  for (let i = 0; i < 120 && a.isActive; i++) a.update(0.05);
  assert.equal(hits, 1);
  assert.equal(pushes, 2);
  a.destroy();
  assert.ok(a.rings.every((r) => !r.visible));
  a.dispose();
});

test("resonator appears on impact and releases its tuning-fork and note layers", () => {
  const a = new OvertoneSpiralAbility({
    lights: { acquire: () => ({}), set() {}, release() {} },
    dummies: {
      findTargets(_x, _z, _r, out) {
        out.length = 0;
        return out;
      },
    },
  });
  a.spawn(new Vector3(), new Vector3(0, 0, 1), 5);
  assert.equal(a.notes.visible, false);
  a.update(2);
  a.update(0.1);
  assert.equal(a.notes.visible, true);
  assert.ok(a.forks.every((f) => f.visible));
  let disposed = 0;
  for (const r of [
    a.forkGeometry,
    a.stemGeometry,
    a.noteGeometry,
    a.noteMaterial,
  ])
    r.addEventListener("dispose", () => disposed++);
  a.destroy();
  a.dispose();
  assert.equal(disposed, 4);
});

test("three harmonic fronts carry independent colors, phases and disposal", () => {
  const a = new OvertoneSpiralAbility({
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
  a.update(0.1);
  assert.equal(a.rings[0].visible, true);
  assert.equal(a.rings[1].visible, false);
  assert.equal(new Set(a.ringMaterials).size, 3);
  assert.equal(
    new Set(a.ringMaterials.map((m) => m.uniforms.uHarmonic.value)).size,
    3,
  );
  a.update(0.5);
  assert.equal(a.rings[1].visible, true);
  assert.notEqual(
    a.ringMaterials[0].uniforms.uFade.value,
    a.ringMaterials[1].uniforms.uFade.value,
  );
  let disposed = 0;
  for (const m of a.ringMaterials)
    m.addEventListener("dispose", () => disposed++);
  a.destroy();
  a.dispose();
  assert.equal(disposed, 3);
});

test("sound carrier follows the cast front and hands off to the resonator", () => {
  const a = new OvertoneSpiralAbility({
    lights: { acquire: () => ({}), set() {}, release() {} },
    dummies: {
      findTargets(_x, _z, _r, out) {
        out.length = 0;
        return out;
      },
    },
  });
  a.spawn(new Vector3(), new Vector3(1, 0, 0), 10);
  assert.equal(a.carrier.visible, true);
  assert.equal(a.notes.visible, false);
  a.update(0.1);
  assert.ok(a.carrier.position.x > 0 && a.carrier.position.x < 10);
  a.update(2);
  assert.equal(a.carrier.visible, false);
  assert.equal(a.notes.visible, true);
  let disposed = 0;
  for (const resource of [a.carrierGeometry, a.carrierMaterial])
    resource.addEventListener("dispose", () => disposed++);
  a.destroy();
  a.spawn(new Vector3(), new Vector3(0, 0, 1), 10);
  assert.equal(a.carrier.visible, true);
  assert.equal(a.notes.visible, false);
  a.destroy();
  a.dispose();
  assert.equal(disposed, 2);
});

test("tone colors update live and return to saved settings on reuse", () => {
  const a = new OvertoneSpiralAbility({
    lights: { acquire: () => ({}), set() {}, release() {} },
    dummies: {
      findTargets(_x, _z, _r, out) {
        out.length = 0;
        return out;
      },
    },
  });
  const original = a.config.toneB;
  try {
    a.spawn(new Vector3(), new Vector3(0, 0, 1), 5);
    a.update(2);
    a.update(0.1);
    a.config.toneB = "#ff0000";
    a.update(0.1);
    assert.equal(
      a.ringMaterials[1].uniforms.uColor.value.getHexString(),
      "ff0000",
    );
    a.destroy();
    a.config.toneB = original;
    a.spawn(new Vector3(), new Vector3(0, 0, 1), 5);
    assert.equal(
      a.ringMaterials[1].uniforms.uColor.value.getHexString(),
      original.slice(1),
    );
  } finally {
    a.config.toneB = original;
    a.destroy();
    a.dispose();
  }
});

test("resonator strikes in sync with each wavefront and settles afterward", () => {
  const a = new OvertoneSpiralAbility({
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
  a.update(a.config.pulseInterval - 0.02);
  const before = a.forks[0].scale.y;
  a.update(0.02);
  const strike = a.forks[0].scale.y;
  assert.ok(strike > before);
  a.update(0.25);
  assert.ok(a.forks[0].scale.y < strike);
  a.destroy();
  a.dispose();
});
