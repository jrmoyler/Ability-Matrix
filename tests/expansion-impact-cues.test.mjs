import test from "node:test";
import assert from "node:assert/strict";
import { Vector3 } from "three";
import { ScreenFlash } from "../packs/sandbox/src/effects/ScreenFlash.js";
import { settings } from "../packs/sandbox/src/config/settings.js";

test("earth, crystal and storm impact cues obey global flash and shake controls", async () => {
  const priorFlash = settings.post.flashStrength,
    priorShake = settings.global.cameraShake;
  try {
    settings.post.flashStrength = 0;
    settings.global.cameraShake = 0;
    for (const path of [
      "earth/FaultwakeBastion",
      "crystal/PrismChoir",
      "storm/FulminantRelay",
    ]) {
      const mod = await import(
        `../packs/sandbox/src/abilities/expansion-2026/${path}.js`
      );
      settings[mod.ID] = structuredClone(mod.CONFIG.settings);
      const flash = new ScreenFlash();
      let shake = -1;
      const ctx = {
        flash,
        shake: {
          add(v) {
            shake = v;
          },
        },
        lights: { acquire: () => ({}), set() {}, release() {} },
        dummies: {
          findTargets(_x, _z, _r, out) {
            out.length = 0;
            return out;
          },
        },
      };
      const Type = mod[Object.keys(mod).find((k) => k.endsWith("Ability"))];
      const ability = new Type(ctx);
      ability.spawn(new Vector3(), new Vector3(0, 0, 1), 5);
      ability.update(2);
      assert.equal(shake, 0, `${mod.ID} respects disabled shake`);
      assert.equal(flash.strength, 0, `${mod.ID} respects disabled flash`);
      settings.post.flashStrength = 1;
      settings.global.cameraShake = 1;
      ability.destroy();
      ability.spawn(new Vector3(), new Vector3(0, 0, 1), 5);
      ability.update(2);
      assert.ok(shake > 0);
      assert.ok(flash.strength > 0);
      ability.destroy();
      ability.dispose();
      settings.post.flashStrength = 0;
      settings.global.cameraShake = 0;
    }
  } finally {
    settings.post.flashStrength = priorFlash;
    settings.global.cameraShake = priorShake;
  }
});
