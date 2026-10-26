import test from "node:test";
import assert from "node:assert/strict";
import { Vector3 } from "three";
import { settings } from "../packs/sandbox/src/config/settings.js";
import {
  PressureInversionAbility,
  CONFIG,
  ID,
} from "../packs/sandbox/src/abilities/expansion-2026/wind/PressureInversion.js";
settings[ID] = structuredClone(CONFIG.settings);
test("pressure well pulls inward then inverts and releases its bodies on cleanup", () => {
  let velocities = [],
    shove = 0,
    release = 0;
  const target = {
      position: new Vector3(1, 0, 5),
      kill() {
        return true;
      },
      carry(field) {
        let out = new Vector3();
        field(1, 0, 5, out);
        velocities.push(out.x);
      },
      shove() {
        shove++;
      },
      release() {
        release++;
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
  const a = new PressureInversionAbility(ctx);
  a.spawn(new Vector3(), new Vector3(0, 0, 1), 5);
  for (let i = 0; i < 100 && a.isActive; i++) a.update(0.05);
  assert.ok(velocities.some((v) => v < 0));
  assert.ok(velocities.some((v) => v > 0));
  assert.equal(shove, 1);
  a.destroy();
  assert.equal(release, 1);
  a.dispose();
  assert.equal(release, 1);
});
