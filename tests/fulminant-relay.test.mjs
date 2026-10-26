import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { Vector3 } from "three";
import { FBXLoader } from "three/addons/loaders/FBXLoader.js";
import { Dummy } from "../packs/sandbox/src/combat/Dummy.js";
import { DummyField } from "../packs/sandbox/src/combat/DummyField.js";
import { settings } from "../packs/sandbox/src/config/settings.js";
import {
  FulminantRelayAbility,
  CONFIG,
  ID,
} from "../packs/sandbox/src/abilities/expansion-2026/storm/FulminantRelay.js";
settings[ID] = structuredClone(CONFIG.settings);
test("storm relay chains once through actual dummies and releases visual resources", () => {
  const bytes = readFileSync(
    new URL("../packs/sandbox/public/models/dummy.fbx", import.meta.url),
  );
  const model = new FBXLoader().parse(
    bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength),
    "",
  );
  const env = { registerShadowCasterWithPatch() {} };
  const field = new DummyField(env),
    targets = [];
  for (const x of [0, 3, 6]) {
    const dummy = new Dummy({
      source: model,
      clip: model.animations[0],
      scale: 0.01,
      offset: { x: 0, y: 0, z: 0 },
      forwardYaw: 0,
      environment: env,
    });
    dummy.root.position.set(x, 0, 5);
    dummy.root.updateWorldMatrix(true, true);
    targets.push(dummy);
    field.slots.push({ dummy, wait: 0 });
  }
  const ability = new FulminantRelayAbility({
    dummies: field,
    lights: { acquire: () => ({}), set() {}, release() {} },
  });
  ability.spawn(new Vector3(), new Vector3(0, 0, 1), 5);
  for (let i = 0; i < 160 && ability.isActive; i++) {
    ability.update(0.04);
    for (const d of targets) d.update(0.04);
  }
  assert.equal(targets.filter((d) => d.state !== "alive").length, 3);
  assert.equal(ability.hops.length, 3);
  assert.ok(ability.arcs.slice(0, 3).every((a) => a.visible));
  let disposed = 0;
  for (const a of ability.arcs)
    a.geometry.addEventListener("dispose", () => disposed++);
  ability.destroy();
  assert.ok(ability.arcs.every((a) => !a.visible));
  ability.dispose();
  assert.equal(disposed, 8);
  for (const d of targets) d.dispose();
});

test("relay selects nearest targets, enforces radius and jump limit, and resets on reuse", () => {
  const hits = [];
  const targets = [8, 3, 1].map((x) => ({
    position: new Vector3(x, 0, 5),
    alive: true,
    kill() {
      hits.push(x);
      this.alive = false;
    },
  }));
  const ctx = {
    lights: { acquire: () => ({}), set() {}, release() {} },
    dummies: {
      findTargets(_x, _z, _r, out) {
        out.length = 0;
        out.push(...targets);
        return out;
      },
    },
  };
  const ability = new FulminantRelayAbility(ctx);
  ability.spawn(new Vector3(), new Vector3(0, 0, 1), 5);
  ability.config.maxJumps = 2;
  ability.config.chainRadius = 3;
  ability.update(2);
  ability.update(2);
  assert.deepEqual(hits, [1, 3]);
  assert.equal(ability.hops.length, 2);
  ability.destroy();
  for (const t of targets) t.alive = true;
  hits.length = 0;
  ability.spawn(new Vector3(), new Vector3(0, 0, 1), 5);
  ability.config.maxJumps = 4;
  ability.update(2);
  ability.update(2);
  assert.deepEqual(hits, [1, 3]);
  ability.destroy();
  ability.dispose();
  settings[ID] = structuredClone(CONFIG.settings);
});

test("storm arc geometry flickers in place without changing the linked endpoints", () => {
  const target = {
    position: new Vector3(2, 0, 5),
    alive: true,
    kill() {
      this.alive = false;
    },
  };
  const a = new FulminantRelayAbility({
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
  a.update(0.05);
  const positions = a.arcs[0].geometry.attributes.position.array;
  const initial = Array.from(positions);
  a.update(0.1);
  const changed = Array.from(positions);
  assert.notDeepEqual(changed, initial);
  assert.deepEqual(changed.slice(0, 6), initial.slice(0, 6));
  assert.deepEqual(changed.slice(-6), initial.slice(-6));
  a.destroy();
  a.dispose();
});
