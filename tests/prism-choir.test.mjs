import test from "node:test";
import assert from "node:assert/strict";
import { Vector3 } from "three";
import { settings } from "../packs/sandbox/src/config/settings.js";
import {
  PrismChoirAbility,
  CONFIG,
  ID,
} from "../packs/sandbox/src/abilities/expansion-2026/crystal/PrismChoir.js";
settings[ID] = structuredClone(CONFIG.settings);
test("prism split sweeps its three arms across long frames and hits once", () => {
  let hits = 0;
  const target = {
      position: new Vector3(-1.24, 0, 7.18),
      kill() {
        hits++;
        return true;
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
  let a = new PrismChoirAbility(ctx);
  a.spawn(new Vector3(), new Vector3(0, 0, 1), 5);
  a.update(0.1);
  a.update(0.3);
  a.update(0.9);
  assert.equal(hits, 1);
  a.destroy();
  a.dispose();
});

test("split emits bounded splinters only on impact and releases them", () => {
  const a = new PrismChoirAbility({
    lights: { acquire: () => ({}), set() {}, release() {} },
    dummies: {
      findTargets(_x, _z, _r, out) {
        out.length = 0;
        return out;
      },
    },
  });
  a.spawn(new Vector3(), new Vector3(0, 0, 1), 5);
  assert.equal(a.splinters.visible, false);
  a.update(2);
  assert.equal(a.splinters.visible, true);
  a.update(a.impactDuration * 0.5);
  assert.ok(a.splinterMaterial.uniforms.uBurst.value > 0);
  assert.equal(a.splinterGeometry.attributes.position.count, 120);
  let disposed = 0;
  for (const r of [a.splinterGeometry, a.splinterMaterial])
    r.addEventListener("dispose", () => disposed++);
  a.destroy();
  assert.equal(a.splinters.visible, false);
  a.dispose();
  assert.equal(disposed, 2);
});

test("crystal lance and split shards point along their actual trajectories", () => {
  const a = new PrismChoirAbility({
    lights: { acquire: () => ({}), set() {}, release() {} },
    dummies: {
      findTargets(_x, _z, _r, out) {
        out.length = 0;
        return out;
      },
    },
  });
  const heading = new Vector3(1, 0, 0);
  a.spawn(new Vector3(), heading, 5);
  a.update(0.1);
  const axis = new Vector3(0, 1, 0).applyQuaternion(a.primary.quaternion);
  assert.ok(axis.dot(heading) > 0.999);
  a.update(2);
  a.update(0.3);
  for (let i = 0; i < 3; i++) {
    const along = a.shards[i].position
      .clone()
      .sub(a.splitOrigin)
      .setY(0)
      .normalize();
    const shardAxis = new Vector3(0, 1, 0).applyQuaternion(
      a.shards[i].quaternion,
    );
    assert.ok(shardAxis.dot(along) > 0.999, `shard ${i} aligns to flight`);
  }
  a.destroy();
  a.dispose();
});
