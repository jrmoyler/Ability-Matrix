import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { Vector3 } from "three";
import { FBXLoader } from "three/addons/loaders/FBXLoader.js";
import { Dummy } from "../packs/sandbox/src/combat/Dummy.js";
import { DummyField } from "../packs/sandbox/src/combat/DummyField.js";
import { settings } from "../packs/sandbox/src/config/settings.js";
import {
  AbsoluteZeroThreadAbility,
  CONFIG,
  ID,
} from "../packs/sandbox/src/abilities/expansion-2026/frost/AbsoluteZeroThread.js";
settings[ID] = structuredClone(CONFIG.settings);
test("frost uses the actual rigged sandbox dummy, preserves its pose as ice, and frees the slot", () => {
  const bytes = readFileSync(
    new URL("../packs/sandbox/public/models/dummy.fbx", import.meta.url),
  );
  const root = new FBXLoader().parse(
    bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength),
    "",
  );
  const env = { registerShadowCasterWithPatch() {} };
  const target = new Dummy({
    source: root,
    clip: root.animations[0],
    scale: 0.01,
    offset: { x: 0, y: 0, z: 0 },
    forwardYaw: 0,
    environment: env,
  });
  target.root.position.set(0, 0, 3);
  target.root.updateWorldMatrix(true, true);
  const field = new DummyField(env);
  field.slots.push({ dummy: target, wait: 0 });
  const a = new AbsoluteZeroThreadAbility({
    dummies: field,
    lights: { acquire: () => ({}), set() {}, release() {} },
  });
  a.spawn(new Vector3(), new Vector3(0, 0, 1), 6);
  for (let i = 0; i < 40 && a.frozen.length === 0; i++) a.update(0.05);
  assert.equal(target.state, "frozen");
  assert.equal(a.frozen.length, 1);
  let skinned = 0;
  a.frozen[0].figure.traverse((n) => {
    if (n.isSkinnedMesh) skinned++;
  });
  assert.ok(skinned > 0, "actual frozen articulated mesh is present");
  a.destroy();
  assert.equal(target.state, "gone");
  assert.equal(a.frozen.length, 0);
  a.dispose();
  target.dispose();
});
