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
