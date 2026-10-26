import test from "node:test";
import assert from "node:assert/strict";
import { Vector3 } from "three";
import { settings } from "../packs/sandbox/src/config/settings.js";
import {
  ThunderheadParasiteAbility,
  CONFIG,
  ID,
  UID,
} from "../packs/sandbox/src/abilities/expansion-2026/storm/ThunderheadParasite.js";
settings[ID] = structuredClone(CONFIG.settings);
test("parasite attaches and retaliates to the bound hostile attack stream once with attribution and clean unsubscribe", () => {
  const handlers = {},
    events = [];
  const actor = { id: "dummy:1", alive: true, position: [0, 0, 4] };
  const facade = {
    queryActors: () => ({ ok: true, actors: [actor] }),
    getActor: () => ({ ok: true, actor }),
    on(type, fn) {
      handlers[type] = fn;
      return {
        ok: true,
        unsubscribe() {
          delete handlers[type];
        },
      };
    },
    emit(e) {
      events.push(e);
      return { ok: true };
    },
  };
  const ctx = {
    lights: { acquire: () => ({}), set() {}, release() {} },
    expansionCombat: {
      bind(uid, owner) {
        assert.equal(uid, UID);
        assert.equal(owner, "caster");
        return facade;
      },
    },
  };
  const a = new ThunderheadParasiteAbility(ctx);
  a.spawn(new Vector3(), new Vector3(0, 0, 1), 4);
  for (let i = 0; i < 10; i++) a.update(0.05);
  assert.equal(a.targetId, "dummy:1");
  handlers.hit({ ownerId: "dummy:2", eventId: "wrong" });
  assert.equal(events.length, 0);
  handlers.hit({ ownerId: "dummy:1", eventId: "attack" });
  handlers.hit({ ownerId: "dummy:1", eventId: "attack" });
  assert.equal(events.length, 1);
  assert.equal(events[0].element, "storm");
  assert.deepEqual(events[0].targetIds, ["dummy:1"]);
  a.destroy();
  assert.equal(Object.keys(handlers).length, 0);
  a.dispose();
});
