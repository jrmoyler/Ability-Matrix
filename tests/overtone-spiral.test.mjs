import test from "node:test";
import assert from "node:assert/strict";
import { Vector3 } from "three";
import { settings } from "../packs/sandbox/src/config/settings.js";
import {
  OvertoneSpiralAbility,
  CONFIG,
  ID,
} from "../packs/sandbox/src/abilities/expansion-2026/sound/OvertoneSpiral.js";
settings[ID] = structuredClone(CONFIG.settings);
test("three expanding harmonic fronts apply separate impulses and stop on cleanup", () => {
  let hits = 0,
    pushes = 0;
  const target = {
      position: new Vector3(2, 0, 4),
      alive: true,
      kill() {
        hits++;
        this.alive = false;
        return true;
      },
      bodyPoint(v) {
        return v.copy(this.position);
      },
      shove() {
        pushes++;
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
        findBodies(_x, _z, _r, out) {
          out.length = 0;
          out.push(target);
          return out;
        },
      },
    };
  const a = new OvertoneSpiralAbility(ctx);
  a.spawn(new Vector3(), new Vector3(0, 0, 1), 4);
  for (let i = 0; i < 120 && a.isActive; i++) a.update(0.05);
  assert.equal(hits, 1);
  assert.equal(pushes, 2);
  a.destroy();
  assert.ok(a.rings.every((r) => !r.visible));
  a.dispose();
});
