import test from "node:test";
import assert from "node:assert/strict";
import { Vector3 } from "three";
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
