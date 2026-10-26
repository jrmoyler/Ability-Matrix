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
