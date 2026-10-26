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
  settings[ID].freezeDuration = 4;
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
  let beforeFreeze = new Map();
  for (let i = 0; i < 40 && a.frozen.length === 0; i++) {
    target.update(0.05);
    beforeFreeze = new Map();
    target.root.traverse((node) => {
      if (node.isBone) beforeFreeze.set(node.name, node.quaternion.clone());
    });
    a.update(0.05);
  }
  assert.equal(target.state, "frozen");
  assert.equal(a.frozen.length, 1);
  assert.equal(a.iceShards.count, 6, "statue gets a bounded ice shard cluster");
  assert.equal(
    target.root.visible,
    false,
    "live rig is hidden beneath the ice clone",
  );
  assert.equal(a.frozen[0].figure.visible, true);
  let skinned = 0;
  a.frozen[0].figure.traverse((n) => {
    if (n.isSkinnedMesh) skinned++;
    if (n.isBone && beforeFreeze.has(n.name)) {
      assert.ok(
        n.quaternion.angleTo(beforeFreeze.get(n.name)) < 1e-5,
        `${n.name} keeps its animated pose`,
      );
    }
  });
  assert.ok(skinned > 0, "actual frozen articulated mesh is present");
  for (let i = 0; i < 55; i++) a.update(0.05);
  assert.equal(
    target.state,
    "frozen",
    "extended editor duration survives the default cast lifetime",
  );
  for (let i = 0; i < 40 && target.state === "frozen"; i++) a.update(0.05);
  assert.equal(
    target.state,
    "gone",
    "statue expires after its configured duration",
  );
  assert.equal(a.iceShards.count, 0, "expired statues release shard instances");
  a.destroy();
  assert.equal(target.state, "gone");
  assert.equal(a.frozen.length, 0);
  a.dispose();
  target.dispose();
  settings[ID] = structuredClone(CONFIG.settings);
});

test("earth and wind candidates interact with the actual sandbox dummy and release physics state", async () => {
  const [
    { FaultwakeBastionAbility, CONFIG: earth, ID: earthId },
    { PressureInversionAbility, CONFIG: wind, ID: windId },
  ] = await Promise.all([
    import("../packs/sandbox/src/abilities/expansion-2026/earth/FaultwakeBastion.js"),
    import("../packs/sandbox/src/abilities/expansion-2026/wind/PressureInversion.js"),
  ]);
  const bytes = readFileSync(
    new URL("../packs/sandbox/public/models/dummy.fbx", import.meta.url),
  );
  const root = new FBXLoader().parse(
    bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength),
    "",
  );
  for (const [Type, config, id] of [
    [FaultwakeBastionAbility, earth, earthId],
    [PressureInversionAbility, wind, windId],
  ]) {
    settings[id] = structuredClone(config.settings);
    const env = { registerShadowCasterWithPatch() {} };
    const target = new Dummy({
      source: root,
      clip: root.animations[0],
      scale: 0.01,
      offset: { x: 0, y: 0, z: 0 },
      forwardYaw: 0,
      environment: env,
    });
    target.root.position.set(0.5, 0, 4);
    target.root.updateWorldMatrix(true, true);
    const field = new DummyField(env);
    field.slots.push({ dummy: target, wait: 0 });
    const a = new Type({
      dummies: field,
      lights: { acquire: () => ({}), set() {}, release() {} },
    });
    a.spawn(new Vector3(), new Vector3(0, 0, 1), 5);
    for (let i = 0; i < 180 && a.isActive; i++) {
      a.update(0.04);
      target.update(0.04);
    }
    assert.notEqual(target.state, "alive", `${id} reaches actual actor`);
    a.destroy();
    a.dispose();
    target.dispose();
  }
});

test("fire, water, crystal and sound candidates reach actual sandbox actors", async () => {
  const configs = await Promise.all([
    import("../packs/sandbox/src/abilities/expansion-2026/fire/AshenDoppelganger.js"),
    import("../packs/sandbox/src/abilities/expansion-2026/water/TidalMemory.js"),
    import("../packs/sandbox/src/abilities/expansion-2026/crystal/PrismChoir.js"),
    import("../packs/sandbox/src/abilities/expansion-2026/sound/OvertoneSpiral.js"),
  ]);
  const bytes = readFileSync(
    new URL("../packs/sandbox/public/models/dummy.fbx", import.meta.url),
  );
  const model = new FBXLoader().parse(
    bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength),
    "",
  );
  for (const mod of configs) {
    settings[mod.ID] = structuredClone(mod.CONFIG.settings);
    const Type = mod[Object.keys(mod).find((k) => k.endsWith("Ability"))],
      env = { registerShadowCasterWithPatch() {} };
    const target = new Dummy({
      source: model,
      clip: model.animations[0],
      scale: 0.01,
      offset: { x: 0, y: 0, z: 0 },
      forwardYaw: 0,
      environment: env,
    });
    target.root.position.set(0.4, 0, mod.ID === "ashen-doppelganger" ? 1 : 4);
    target.root.updateWorldMatrix(true, true);
    const field = new DummyField(env);
    field.slots.push({ dummy: target, wait: 0 });
    const a = new Type({
      dummies: field,
      character: { position: new Vector3() },
      lights: { acquire: () => ({}), set() {}, release() {} },
    });
    a.spawn(new Vector3(), new Vector3(0, 0, 1), 5);
    for (let i = 0; i < 200 && a.isActive; i++) {
      a.update(0.04);
      target.update(0.04);
    }
    assert.notEqual(
      target.state,
      "alive",
      `${mod.ID} reaches an actual target`,
    );
    a.destroy();
    a.dispose();
    target.dispose();
  }
});
