import test from "node:test";
import assert from "node:assert/strict";
import { Vector3 } from "three";
import { settings } from "../packs/sandbox/src/config/settings.js";
import {
  TidalMemoryAbility,
  CONFIG,
  ID,
} from "../packs/sandbox/src/abilities/expansion-2026/water/TidalMemory.js";
settings[ID] = structuredClone(CONFIG.settings);
test("tidal memory traces the same wave path forward and back with per-pass target hits", () => {
  let hit = [];
  const target = {
      position: new Vector3(0, 0, 3),
      kill(x, z) {
        hit.push([x, z]);
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
  const a = new TidalMemoryAbility(ctx);
  a.spawn(new Vector3(), new Vector3(0, 0, 1), 6);
  const samples = Array.from(a.samples);
  for (let i = 0; i < 120 && a.isActive; i++) a.update(0.05);
  assert.deepEqual(Array.from(a.samples), samples);
  assert.equal(hit.length, 2);
  assert.ok(hit[0][1] > 0 && hit[1][1] < 0);
  a.destroy();
  a.dispose();
});
