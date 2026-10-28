import test from 'node:test';
import assert from 'node:assert/strict';
import { Vector3 } from 'three';
import { settings } from '../../packs/sandbox/src/config/settings.js';
import config from '../../packs/sandbox/src/abilities/expansion-2026/hydraulic-marionette/config.js';
import {
  Ability,
  ID,
  MAX_STRINGS,
} from '../../packs/sandbox/src/abilities/expansion-2026/hydraulic-marionette/index.js';

settings[ID] = structuredClone(config.settings);
const C = settings[ID];
const DT = 1 / 60;
const lights = { acquire: () => ({}), release() {}, set() {} };

/** A mock dummy that records every call the tether makes on it. */
function dummy(name, x, z, log) {
  return {
    name,
    alive: true,
    position: new Vector3(x, 0, z),
    pins: [],
    kill(dx, dz, force) {
      log.push({ kind: 'kill', name, dx, dz, impulse: force.impulse, lift: force.lift });
      this.alive = false;
      return true;
    },
    pin(joint, at, stiffness) {
      this.pins.push({ joint, at: at.clone(), stiffness });
      return true;
    },
    hold() {},
    unpin() { log.push({ kind: 'unpin', name }); },
    shove(x, y, z) { log.push({ kind: 'shove', name, x, y, z }); },
    release() { log.push({ kind: 'release', name }); },
  };
}

function setup(positions) {
  const log = [];
  const dummies = positions.map(([x, z], i) => dummy(`d${i}`, x, z, log));
  const ability = new Ability({
    lights,
    dummies: {
      // Returns everything alive, nearest first, including bodies outside the
      // radius — the cast must filter them itself.
      findTargets: (x, z, r, out) => {
        out.length = 0;
        for (const d of dummies) if (d.alive) out.push(d);
        out.sort((a, b) => Math.hypot(a.position.x - x, a.position.z - z) - Math.hypot(b.position.x - x, b.position.z - z));
        return out;
      },
    },
  });
  return { ability, dummies, log };
}

const run = (ability, frames) => { for (let i = 0; i < frames; i++) ability.update(DT); };
const runUntil = (ability, pred, max = 1000) => { for (let i = 0; i < max && !pred(); i++) ability.update(DT); };

test('hooks only tethered enemies inside the circle, yanks them toward the centre, and is bounded to six strings', () => {
  // Eight bodies in the circle round (10, 0) and one far outside.
  const ring = [];
  for (let i = 0; i < 8; i++) ring.push([10 + Math.cos(i) * 1.5, Math.sin(i) * 1.5]);
  const { ability, dummies, log } = setup([...ring, [30, 0]]);
  ability.spawn(new Vector3(), new Vector3(1, 0, 0), 10);
  runUntil(ability, () => ability.phase === 'impact');
  assert.equal(log.length, 0, 'nothing is struck before the strings hook');
  runUntil(ability, () => ability._hooked);
  const kills = log.filter((e) => e.kind === 'kill');
  assert.equal(kills.length, MAX_STRINGS);
  assert.ok(!kills.some((k) => k.name === 'd8'), 'the far body is never hooked');
  for (const k of kills) {
    const d = dummies.find((x) => x.name === k.name);
    // The blow points from the body at the centre of the circle.
    const ix = 10 - d.position.x;
    const iz = 0 - d.position.z;
    const len = Math.hypot(ix, iz);
    assert.ok((k.dx * ix + k.dz * iz) / len > 0.99, `${k.name} is yanked inward`);
    assert.equal(k.impulse, C.hookImpulse);
  }
  run(ability, 600);
  assert.equal(ability.isFinished, true);
  assert.equal(log.filter((e) => e.kind === 'kill').length, MAX_STRINGS, 'no further kills on the felled');
  ability.destroy();
  ability.dispose();
});

test('the signature: hooked bodies are hoisted on their strings, hauled inward, then slammed down at the cut', () => {
  const { ability, dummies, log } = setup([[12.5, 0], [10, -2.6]]);
  ability.spawn(new Vector3(), new Vector3(1, 0, 0), 10);
  runUntil(ability, () => ability._hooked);
  const L = settings.global.lifetime;
  run(ability, Math.ceil((C.hoistTime * L + 0.3) / DT));
  const R = C.zoneRadius;
  for (const d of dummies) {
    assert.ok(d.pins.length > 10, `${d.name} is held by its string`);
    const at = d.pins[d.pins.length - 1].at;
    assert.equal(d.pins[0].joint, C.pinJoint);
    assert.ok(at.y > C.puppetHeight - 0.05, `${d.name} is hoisted (${at.y.toFixed(2)} m)`);
    const r = Math.hypot(at.x - 10, at.z);
    assert.ok(Math.abs(r - R * C.gatherRadius) < C.danceSway + 0.1, `${d.name} is hauled to the gather ring (${r.toFixed(2)} m)`);
    // The string tip and the pinned joint are the same point.
    assert.ok(ability.tubes.some((t) => t.visible));
  }
  assert.ok(!log.some((e) => e.kind === 'shove'), 'no slam before the cut');
  runUntil(ability, () => ability._cutDone);
  const shoves = log.filter((e) => e.kind === 'shove');
  assert.equal(shoves.length, 2);
  for (const s of shoves) {
    assert.ok(s.y < 0, 'slammed down');
    const d = dummies.find((x) => x.name === s.name);
    assert.ok(s.x * (10 - d.position.x) + s.z * (0 - d.position.z) > 0, 'slammed on toward the centre');
  }
  assert.equal(log.filter((e) => e.kind === 'unpin').length, 2);
  const pinsAtCut = dummies.map((d) => d.pins.length);
  run(ability, 30);
  assert.deepEqual(dummies.map((d) => d.pins.length), pinsAtCut, 'nothing is held after the cut');
  ability.destroy();
  ability.dispose();
});

test('pooled reuse resets the tether, the strings and the crowns', () => {
  const { ability, dummies, log } = setup([[10.5, 0.5]]);
  ability.spawn(new Vector3(), new Vector3(1, 0, 0), 10);
  runUntil(ability, () => ability._cutDone);
  // Destroyed mid-linger on the second cast: the body must be let go.
  ability.destroy();
  assert.equal(ability.control.visible, false);
  assert.ok(ability.tubes.every((t) => !t.visible));
  dummies[0].alive = true;
  ability.spawn(new Vector3(), new Vector3(1, 0, 0), 10);
  assert.equal(ability._hooked, false);
  assert.equal(ability._cutDone, false);
  assert.ok(ability._slots.every((s) => !s.active && !s.dummy && !s.pinned));
  assert.ok(ability._crownRec.every((r) => r.start < 0));
  runUntil(ability, () => ability._hooked);
  run(ability, 30);
  const released = log.filter((e) => e.kind === 'unpin').length;
  ability.destroy();
  assert.equal(log.filter((e) => e.kind === 'unpin').length, released + 1, 'destroy lets go of a held body');
  assert.equal(log.filter((e) => e.kind === 'kill').length, 2);
  ability.dispose();
});

test('no targets, no dummy field and no combat binding: strings hook the floor and nothing throws', () => {
  const ability = new Ability({ lights });
  ability.spawn(new Vector3(), new Vector3(0, 0, 1), 8);
  runUntil(ability, () => ability._hooked);
  run(ability, 20);
  assert.equal(ability._slots.filter((s) => s.active).length, C.stringCount);
  assert.ok(ability._slots.every((s) => !s.active || !s.body));
  assert.ok(ability.tubes.filter((t) => t.visible).length >= C.stringCount);
  run(ability, 600);
  assert.equal(ability.isFinished, true);
  ability.destroy();
  ability.dispose();
});

test('geometry is finite and every GPU resource is disposed exactly once', () => {
  const { ability } = setup([[10, 1]]);
  ability.spawn(new Vector3(), new Vector3(1, 0, 0), 10);
  runUntil(ability, () => ability._hooked);
  run(ability, 40);
  let meshes = 0;
  ability.group.traverse((o) => {
    if (!o.isMesh || !o.visible) return;
    meshes++;
    const p = o.geometry.attributes.position.array;
    for (let i = 0; i < p.length; i++) assert.ok(Number.isFinite(p[i]));
  });
  assert.ok(meshes >= 8);
  let count = 0;
  for (const r of ability.resources) r.addEventListener('dispose', () => count++);
  ability.destroy();
  ability.dispose();
  ability.dispose();
  assert.equal(count, ability.resources.length);
});

test('through the UCSM bridge each tethered enemy takes the hook and the slam, toward the centre, attributed', async () => {
  const { CombatStateManager } = await import('../../packs/sandbox/src/combat/ucsm/CombatStateManager.js');
  const { ExpansionCombatAdapter } = await import('../../packs/sandbox/src/combat/ucsm/ExpansionCombatAdapter.js');
  const manager = new CombatStateManager();
  manager.upsertEntity({ id: 'caster', teamId: 'player', health: 5 });
  manager.upsertEntity({ id: 'enemy', teamId: 'enemy', position: [11, 0, 1], health: 5 });
  manager.upsertEntity({ id: 'ally', teamId: 'player', position: [10, 0, 1], health: 5 });
  manager.upsertEntity({ id: 'outside', teamId: 'enemy', position: [20, 0, 0], health: 5 });
  const bridge = new ExpansionCombatAdapter(manager);
  const ability = new Ability({ lights, expansionCombat: bridge });
  const seen = [];
  const sub = bridge.bind('matrix-expansion/test-observer').on('hit', (e) => seen.push(e));
  ability.spawn(new Vector3(), new Vector3(1, 0, 0), 10);
  for (let i = 0; i < 400 && !ability.isFinished; i++) { ability.update(DT); if (i % 2) manager.advance(); }
  for (let i = 0; i < 4; i++) manager.advance();
  assert.equal(ability.failure, null);
  assert.equal(manager.entities.get('enemy').health, 5 - C.hookDamage - C.cutDamage);
  assert.equal(manager.entities.get('ally').health, 5);
  assert.equal(manager.entities.get('outside').health, 5);
  assert.equal(seen.length, 2);
  for (const e of seen) {
    assert.equal(e.abilityUid, 'matrix-expansion/hydraulic-marionette');
    assert.equal(e.element, 'water');
    assert.deepEqual(e.targetIds, ['enemy']);
  }
  sub.unsubscribe();
  ability.destroy();
  ability.dispose();
  bridge.dispose();
});

test('standalone bridge: the hook fells a dummy once and the slam does not strike the fallen twice', async () => {
  const { CombatStateManager } = await import('../../packs/sandbox/src/combat/ucsm/CombatStateManager.js');
  const { ExpansionCombatAdapter } = await import('../../packs/sandbox/src/combat/ucsm/ExpansionCombatAdapter.js');
  const manager = new CombatStateManager();
  let kills = 0;
  let dir = null;
  const d = { alive: true, position: new Vector3(11.5, 0, 0), kill(x, z) { kills++; dir = [x, z]; this.alive = false; return true; } };
  const bridge = new ExpansionCombatAdapter(manager, { enabled: () => false, modeVersion: () => 0 });
  const ability = new Ability({ lights, character: { position: new Vector3() }, dummies: { slots: [{ dummy: d }] }, expansionCombat: bridge });
  ability.spawn(new Vector3(), new Vector3(1, 0, 0), 10);
  run(ability, 400);
  assert.equal(kills, 1);
  assert.ok(dir[0] < -0.99, 'felled toward the centre');
  assert.equal(ability.failure, null);
  ability.destroy();
  ability.dispose();
  bridge.dispose();
});
