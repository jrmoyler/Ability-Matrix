import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { Scene, Vector3 } from "three";
import { FBXLoader } from "three/addons/loaders/FBXLoader.js";
import { Dummy } from "../../packs/sandbox/src/combat/Dummy.js";
import { DummyField } from "../../packs/sandbox/src/combat/DummyField.js";
import { AbilityManager } from "../../packs/sandbox/src/abilities/AbilityManager.js";
import { CombatStateManager } from "../../packs/sandbox/src/combat/ucsm/CombatStateManager.js";
import { MechanicSystems } from "../../packs/sandbox/src/combat/ucsm/mechanics/MechanicSystems.js";
import { ExpansionCombatAdapter } from "../../packs/sandbox/src/combat/ucsm/ExpansionCombatAdapter.js";
import { registerHooks } from "node:module";
registerHooks({
  load(url, context, next) {
    return url.endsWith(".css")
      ? { format: "module", source: "", shortCircuit: true }
      : next(url, context);
  },
});
const { PackAdapter } =
  await import("../../packs/sandbox/src/combat/ucsm/PackAdapter.js");
const { installProductionExpansion } =
  await import("../../packs/sandbox/src/abilities/expansion-2026/ProductionRegistration.js");
const { expansionRoster } =
  await import("../../packs/sandbox/src/abilities/expansion-2026/ProductionRoster.js");
const { EXPANSION_STATUS } =
  await import("../../packs/sandbox/src/abilities/expansion-2026/status.js");
// Each case approves one cast on its own; every other cast is held as a candidate.
const CANDIDATE_STATUS = Object.fromEntries(Object.keys(EXPANSION_STATUS).map((uid) => [uid, 'candidate']));

const { App } = await import("../../packs/sandbox/src/core/App.js");
class Element {
  constructor() {
    this.children = [];
    this.style = {};
    this.value = "";
  }
  append(...elements) {
    this.children.push(...elements);
    if (!this.value && elements[0]?.value) this.value = elements[0].value;
  }
  setAttribute() {}
  addEventListener() {}
  remove() {}
}
const gui = {
  addFolder() {
    return {
      add() {
        return {
          name() {
            return this;
          },
        };
      },
      addColor() {
        return {
          name() {
            return this;
          },
        };
      },
      close() {},
      destroy() {},
    };
  },
};

test("synthetically approved candidates use the production cast path and affect real dummies", async () => {
  globalThis.document = {
    createElement: () => new Element(),
    body: new Element(),
  };
  const bytes = readFileSync(
    new URL("../../packs/sandbox/public/models/dummy.fbx", import.meta.url),
  );
  const model = new FBXLoader().parse(
    bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength),
    "",
  );
  for (const [id, element] of [
    ["ashen-doppelganger", "fire"],
    ["absolute-zero-thread", "frost"],
    ["fulminant-relay", "storm"],
    ["tidal-memory", "water"],
    ["faultwake-bastion", "earth"],
    ["prism-choir", "crystal"],
    ["pressure-inversion", "wind"],
    ["overtone-spiral", "sound"],
  ]) {
    const env = { registerShadowCasterWithPatch() {} };
    const target = new Dummy({
      source: model,
      clip: model.animations[0],
      scale: 0.01,
      offset: { x: 0, y: 0, z: 0 },
      forwardYaw: 0,
      environment: env,
    });
    target.root.position.set(0, 0, 5);
    target.root.updateWorldMatrix(true, true);
    const dummies = new DummyField(env);
    dummies.slots = [{ dummy: target, wait: 0 }];
    let nextTarget;
    if (element === "storm") {
      nextTarget = new Dummy({
        source: model,
        clip: model.animations[0],
        scale: 0.01,
        offset: { x: 0, y: 0, z: 0 },
        forwardYaw: 0,
        environment: env,
      });
      nextTarget.root.position.set(3, 0, 5);
      nextTarget.root.updateWorldMatrix(true, true);
      dummies.slots.push({ dummy: nextTarget, wait: 0 });
    }
    const combat = new CombatStateManager();
    new MechanicSystems(combat);
    const bridge = new ExpansionCombatAdapter(combat);
    const ctx = {
      scene: new Scene(),
      lights: { acquire: () => ({}), set() {}, release() {} },
      character: { position: new Vector3(0, 0, 5) },
      dummies,
      expansionCombat: bridge,
    };
    const abilities = new AbilityManager(ctx);
    const app = Object.assign(Object.create(App.prototype), {
      abilities,
      scene: ctx.scene,
      character: ctx.character,
      dummies,
      editor: { gui },
      nativePack: new Map(),
      runtimes: new Map(),
      renderer: { gl: { domElement: {} } },
      hud: { setElement() {}, showToast() {} },
      aim: {
        object3D: { visible: true },
        setElement() {},
        cancel() {
          this.isArmed = false;
        },
        arm() {
          this.isArmed = true;
        },
        isArmed: false,
        facing: 0,
      },
      cooldowns: new Map(),
      slot: null,
      _throwBody() {},
      _warmDraw(groups) {
        this.warmed = groups[0];
      },
    });
    const host = Object.assign(Object.create(PackAdapter.prototype), {
      app,
      manager: combat,
      enabled: true,
      cues: false,
      scope: null,
      _meta: new WeakMap(),
      _wrapped: new WeakSet(),
      _tracked: new Set(),
      _ids: new WeakMap(),
      _byId: new Map(),
      _nextDummy: 0,
      mechanics: {
        systems: { worldshape: { blocked: () => false } },
        beforeStep() {},
        update() {},
        cue() {},
        clear() {},
      },
      feed: { update() {}, badges() {} },
    });
    app.combat = host;
    host._install();
    const item = expansionRoster().find((c) => c.ID === id);
    const live = installProductionExpansion(
      app,
      expansionRoster({ ...CANDIDATE_STATUS, [item.uid]: "live" }),
    );
    host.update(1 / 60);
    await app.select(item.uid);
    assert.ok(app.warmed, `${id} prewarms through the production select path`);
    assert.equal(await app.arm(item.uid), true);
    app._cast(new Vector3(), new Vector3(0, 0, 1), 5);
    const candidate = abilities.active[0];
    assert.ok(candidate, id);
    assert.equal(
      candidate.group,
      app.warmed,
      `${id} reuses its prewarmed instance`,
    );
    assert.ok(app.cooldowns.get(item.uid) > 0, `${id} starts its cooldown`);
    const seen = [];
    for (let i = 0; i < 240; i++) {
      abilities.update(1 / 60);
      host.update(1 / 60);
      for (const e of combat.recentEvents)
        if (!seen.some((x) => x.eventId === e.eventId)) seen.push(e);
    }
    const uid = host._meta.get(candidate).uid;
    const event = seen.find(
      (e) =>
        e.abilityUid === uid &&
        e.element === element &&
        e.targetIds.includes("dummy:0"),
    );
    assert.ok(
      event,
      `${id} must commit an attributed event for the actual host dummy`,
    );
    assert.equal(event.ownerId, "caster");
    assert.equal(
      target.alive,
      false,
      `${id} defeats a full-health sandbox dummy at default settings`,
    );
    if (nextTarget) {
      assert.equal(
        nextTarget.alive,
        false,
        "storm chains to a second real dummy",
      );
      assert.ok(
        seen.some(
          (e) => e.abilityUid === uid && e.targetIds.includes("dummy:1"),
        ),
        "second hit retains cast attribution",
      );
    }
    live.dispose();
    assert.equal(
      abilities.active.length,
      0,
      `${id} removes active casts during uninstall`,
    );
    assert.equal(abilities.pools.has(id), false, `${id} unregisters its pool`);
    abilities.dispose();
    bridge.dispose();
    target.dispose();
    nextTarget?.dispose();
  }
});
