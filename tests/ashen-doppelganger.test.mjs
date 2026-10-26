import test from "node:test";
import assert from "node:assert/strict";
import { Vector3 } from "three";
import { settings } from "../packs/sandbox/src/config/settings.js";
import {
  AshenDoppelgangerAbility,
  CONFIG,
  ID,
} from "../packs/sandbox/src/abilities/expansion-2026/fire/AshenDoppelganger.js";
settings[ID] = structuredClone(CONFIG.settings);
function setup() {
  let hit = 0;
  const character = { position: new Vector3() };
  const target = {
    position: new Vector3(1, 0, 0),
    kill() {
      hit++;
      return true;
    },
  };
  const ctx = {
    character,
    lights: { acquire: () => ({}), set() {}, release() {} },
    dummies: {
      findTargets(x, z, r, out) {
        out.length = 0;
        if (Math.hypot(target.position.x - x, target.position.z - z) <= r)
          out.push(target);
        return out;
      },
    },
  };
  return {
    ability: new AshenDoppelgangerAbility(ctx),
    character,
    hits: () => hit,
  };
}
test("ash echo follows a delayed caster path and reuses bounded history", () => {
  const { ability: a, character, hits } = setup();
  a.spawn(new Vector3(), new Vector3(0, 0, 1), 1);
  for (let i = 0; i < 30; i++) {
    character.position.x = i * 0.1;
    a.update(0.05);
  }
  assert.ok(
    a.echo.position.x > 0 && a.echo.position.x < character.position.x - 0.5,
  );
  assert.ok(a.count <= 96);
  assert.ok(hits() > 0);
  a.destroy();
  assert.equal(a.count, 0);
  a.spawn(new Vector3(5, 0, 0), new Vector3(0, 0, 1), 1);
  assert.equal(a.echo.visible, true);
  assert.equal(a.count, 1);
  a.destroy();
  a.dispose();
});
test("ash echo disposes every owned geometry and material", () => {
  const { ability: a } = setup();
  let n = 0;
  for (const r of [
    a.bodyGeo,
    a.limbGeo,
    a.headGeo,
    a.groundGeo,
    a.sparkGeo,
    a.skin,
    a.groundMat,
    a.sparkMat,
  ])
    r.addEventListener("dispose", () => n++);
  a.dispose();
  assert.equal(n, 8);
});

test("echo snapshots a rigged caster pose and plays it back without mutating the original material", async () => {
  const {
    Group,
    Bone,
    Skeleton,
    SkinnedMesh,
    BoxGeometry,
    MeshBasicMaterial,
    Uint16BufferAttribute,
    Float32BufferAttribute,
  } = await import("three");
  const model = new Group(),
    bone = new Bone();
  bone.name = "Hips";
  model.add(bone);
  const geometry = new BoxGeometry(0.5, 1, 0.3),
    count = geometry.attributes.position.count;
  geometry.setAttribute(
    "skinIndex",
    new Uint16BufferAttribute(new Uint16Array(count * 4), 4),
  );
  const weights = new Float32Array(count * 4);
  for (let i = 0; i < count; i++) weights[i * 4] = 1;
  geometry.setAttribute("skinWeight", new Float32BufferAttribute(weights, 4));
  const originalMaterial = new MeshBasicMaterial();
  const body = new SkinnedMesh(geometry, originalMaterial);
  model.add(body);
  body.bind(new Skeleton([bone]));
  const root = new Group();
  root.add(model);
  const character = { model, root, position: root.position };
  const ctx = {
    character,
    lights: { acquire: () => ({}), set() {}, release() {} },
    dummies: {
      findTargets(_x, _z, _r, out) {
        out.length = 0;
        return out;
      },
    },
  };
  const a = new AshenDoppelgangerAbility(ctx);
  a.spawn(new Vector3(), new Vector3(0, 0, 1), 1);
  for (let i = 0; i < 26; i++) {
    bone.rotation.y = i * 0.03;
    bone.position.y = i * 0.01;
    root.rotation.y = i * 0.02;
    root.position.x = i * 0.02;
    a.update(0.05);
  }
  assert.ok(a.echoRig);
  assert.notEqual(a.poseCopies[0].quaternion.y, bone.quaternion.y);
  assert.ok(a.poseCopies[0].position.y < bone.position.y);
  assert.equal(body.material, originalMaterial);
  const rigMaterial = a.rigMaterial;
  let disposed = false;
  rigMaterial.addEventListener("dispose", () => (disposed = true));
  a.destroy();
  a.dispose();
  assert.ok(disposed);
  geometry.dispose();
  originalMaterial.dispose();
});

test("echo restores visibility and applies ember drift on each reuse", () => {
  const a = new AshenDoppelgangerAbility({
    character: { position: new Vector3() },
    lights: { acquire: () => ({}), set() {}, release() {} },
  });
  a.spawn(new Vector3(), new Vector3(0, 0, 1), 3);
  a.sparkMat.uniforms.uOpacity.value = 0;
  a.destroy();
  a.spawn(new Vector3(), new Vector3(0, 0, 1), 3);
  assert.equal(a.sparkMat.uniforms.uOpacity.value, 0.8);
  assert.equal(a.sparkMat.uniforms.uRate.value, a.config.emberRate);
  assert.equal(a.skin.uniforms.uOpacity.value, a.config.echoOpacity);
  a.destroy();
  a.dispose();
});

test("ash echo telegraphs each pulse with a fading expanding ring", () => {
  const a = new AshenDoppelgangerAbility({
    character: { position: new Vector3() },
    lights: { acquire: () => ({}), set() {}, release() {} },
    dummies: {
      findTargets(_x, _z, _r, out) {
        out.length = 0;
        return out;
      },
    },
  });
  a.spawn(new Vector3(), new Vector3(0, 0, 1), 3);
  assert.equal(a.groundMat.uniforms.uPulse.value, 1);
  for (let i = 0; i < 50 && a.lastPulse < 0; i++) a.update(0.05);
  assert.ok(a.lastPulse >= 0);
  assert.equal(a.groundMat.uniforms.uPulse.value, 0);
  a.update(0.1);
  assert.ok(
    a.groundMat.uniforms.uPulse.value > 0 &&
      a.groundMat.uniforms.uPulse.value < 1,
  );
  a.destroy();
  a.dispose();
});
