import test from "node:test";
import assert from "node:assert/strict";
import { Vector3 } from "three";
import { settings } from "../packs/sandbox/src/config/settings.js";

test("long frames keep swept casts inside their authored range", async () => {
  for (const path of [
    "frost/AbsoluteZeroThread",
    "water/TidalMemory",
    "earth/FaultwakeBastion",
  ]) {
    const mod = await import(
      `../packs/sandbox/src/abilities/expansion-2026/${path}.js`
    );
    settings[mod.ID] = structuredClone(mod.CONFIG.settings);
    let hits = 0;
    const target = {
      position: new Vector3(0, 0, 12),
      kill() {
        hits++;
      },
      freeze() {
        hits++;
        return true;
      },
    };
    const ctx = {
      lights: { acquire: () => ({}), set() {}, release() {} },
      dummies: {
        findTargets(_x, _z, _r, out) {
          out.length = 0;
          out.push(target);
          return out;
        },
      },
    };
    const Type = mod[Object.keys(mod).find((k) => k.endsWith("Ability"))];
    const ability = new Type(ctx);
    ability.spawn(new Vector3(), new Vector3(0, 0, 1), 5);
    ability.update(2);
    assert.equal(hits, 0, `${mod.ID} cannot hit beyond its range`);
    assert.equal(
      ability.pending?.length ?? 0,
      0,
      `${mod.ID} cannot queue a freeze beyond its range`,
    );
    ability.destroy();
    ability.dispose();
  }
});

test("prism choir checks the terminal edge of its outgoing cast", async () => {
  const mod =
    await import("../packs/sandbox/src/abilities/expansion-2026/crystal/PrismChoir.js");
  settings[mod.ID] = structuredClone(mod.CONFIG.settings);
  let hits = 0;
  const target = {
    position: new Vector3(0, 0, 0),
    kill() {
      hits++;
    },
  };
  const ctx = {
    lights: { acquire: () => ({}), set() {}, release() {} },
    dummies: {
      findTargets(_x, _z, _r, out) {
        out.length = 0;
        out.push(target);
        return out;
      },
    },
  };
  const ability = new mod.PrismChoirAbility(ctx);
  ability.spawn(new Vector3(), new Vector3(0, 0, 1), 5);
  target.position.z = ability.length + ability.config.reach * 0.9;
  ability.update(2);
  assert.equal(hits, 1);
  ability.destroy();
  ability.dispose();
});
