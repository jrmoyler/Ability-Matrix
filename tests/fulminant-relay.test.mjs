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
  assert.ok(
    ability.arcs.every((a) => !a.visible),
    "completed arcs do not linger",
  );
  let disposed = 0;
  for (const a of ability.arcs)
    a.geometry.addEventListener("dispose", () => disposed++);
  let materialsDisposed = 0;
  for (const a of ability.arcs)
    a.material.addEventListener("dispose", () => materialsDisposed++);
  ability.destroy();
  assert.ok(ability.arcs.every((a) => !a.visible));
  ability.dispose();
  assert.equal(disposed, 8);
  assert.equal(materialsDisposed, 8);
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

test("each chained arc fades independently from its own hit time", () => {
  const targets = [0, 2].map((x) => ({
    position: new Vector3(x, 0, 5),
    alive: true,
    kill() {
      this.alive = false;
    },
  }));
  const a = new FulminantRelayAbility({
    lights: { acquire: () => ({}), set() {}, release() {} },
    dummies: {
      findTargets(_x, _z, _r, out) {
        out.length = 0;
        out.push(...targets.filter((t) => t.alive));
        return out;
      },
    },
  });
  a.spawn(new Vector3(), new Vector3(0, 0, 1), 5);
  a.update(2);
  a.update(0.05);
  assert.equal(a.hops.length, 1);
  a.update(0.23);
  assert.equal(a.hops.length, 2);
  assert.ok(
    a.arcs[0].material.uniforms.uFade.value <
      a.arcs[1].material.uniforms.uFade.value,
  );
  a.update(0.35);
  assert.equal(a.arcs[0].visible, false);
  assert.equal(a.arcs[1].visible, true);
  a.destroy();
  a.dispose();
});

test("branching arcs originate on actual chain geometry and expire with it", () => {
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
  const main = a.arcs[0].geometry.attributes.position,
    branch = a.branches[0].geometry.attributes.position;
  const midpoint = new Vector3(
    (main.getX(24) + main.getX(25)) / 2,
    (main.getY(24) + main.getY(25)) / 2,
    (main.getZ(24) + main.getZ(25)) / 2,
  );
  const origin = new Vector3(
    (branch.getX(0) + branch.getX(1)) / 2,
    (branch.getY(0) + branch.getY(1)) / 2,
    (branch.getZ(0) + branch.getZ(1)) / 2,
  );
  assert.ok(midpoint.distanceTo(origin) < 1e-5);
  assert.equal(a.branches[0].visible, true);
  a.update(a.config.arcLifetime + 0.1);
  assert.equal(a.arcs[0].visible, false);
  assert.equal(a.branches[0].visible, false);
  let disposed = 0;
  for (const b of a.branches)
    b.geometry.addEventListener("dispose", () => disposed++);
  a.destroy();
  a.dispose();
  assert.equal(disposed, 8);
});

test("storm branches remain visible when the first target coincides with the seed", () => {
  const target = {
    position: new Vector3(0, 0, 5),
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
  const p = a.branches[0].geometry.attributes.position;
  const start = new Vector3(
    (p.getX(0) + p.getX(1)) / 2,
    0,
    (p.getZ(0) + p.getZ(1)) / 2,
  );
  const end = new Vector3(
    (p.getX(48) + p.getX(49)) / 2,
    0,
    (p.getZ(48) + p.getZ(49)) / 2,
  );
  assert.ok(start.distanceTo(end) > 0.5);
  a.destroy();
  a.dispose();
});

test('relay skips a target that refuses the hit and chains to the next target', () => {
  let hits = 0;
  const blocked = {position: new Vector3(1, 0, 5), alive: true, kill() {return false;}};
  const next = {position: new Vector3(2, 0, 5), alive: true, kill() {hits++; this.alive=false; return true;}};
  const a = new FulminantRelayAbility({
    lights: {acquire: () => ({}), set() {}, release() {}},
    dummies: {findTargets(_x, _z, _r, out) {out.length=0;out.push(blocked, next);return out;}},
  });
  a.spawn(new Vector3(), new Vector3(0,0,1), 5);
  a.anchor.set(0,0,5);
  assert.equal(a._jump(), true);
  assert.equal(hits, 1);
  assert.deepEqual(a.hops[0].to.toArray(), [2,0,5]);
  a.destroy(); a.dispose();
});
