import test from 'node:test';
import assert from 'node:assert/strict';
import { Vector3 } from 'three';
import { settings } from '../../packs/sandbox/src/config/settings.js';
import config from '../../packs/sandbox/src/abilities/expansion-2026/existence-tax/config.js';
import { Ability, ID, buildEditor } from '../../packs/sandbox/src/abilities/expansion-2026/existence-tax/index.js';

settings[ID] = structuredClone(config.settings);
const reset = () => { settings[ID] = structuredClone(config.settings); };
const lights = { acquire: () => ({}), release() {}, set() {} };
const DT = 1 / 60;

/** A sandbox dummy stand-in that records what was done to it. */
function dummy(x, z) {
  return {
    alive: true, state: 'alive', position: new Vector3(x, 0, z), kills: [], corroded: 0, consumed: 0, carried: 0, released: 0,
    kill(dx, dz, force) { if (!this.alive) return false; this.alive = false; this.state = 'dead'; this.kills.push({ dx, dz, ...force }); return true; },
    corrode(a) { this.corroded = Math.max(this.corroded, a); return this.corroded; },
    consume(a) { this.consumed = Math.max(this.consumed, a); return this.consumed; },
    carry() { this.carried++; },
    sink() {},
    release() { this.released++; },
    bodyPoint(out) { return out.set(this.position.x, 0.6, this.position.z); },
  };
}

function field(list) {
  const near = (x, z, r, out, alive) => {
    out.length = 0;
    for (const d of list) if ((alive ? d.alive : true) && Math.hypot(d.position.x - x, d.position.z - z) <= r) out.push(d);
    out.sort((a, b) => Math.hypot(a.position.x - x, a.position.z - z) - Math.hypot(b.position.x - x, b.position.z - z));
    return out;
  };
  return {
    findTargets: (x, z, r, out) => near(x, z, r, out, true),
    findBodies: (x, z, r, out) => near(x, z, r, out, false),
  };
}

const cast = (ability) => ability.spawn(new Vector3(), new Vector3(1, 0, 0), 10);
const run = (ability, frames, each) => { for (let i = 0; i < frames && !ability.isFinished; i++) { ability.update(DT); each?.(i); } };

test('one cast levies the zone four times, consumes exactly the eligible construct, and finishes', () => {
  reset();
  const near = dummy(10.5, 0); // pays every levy, nearest the throat
  const rim = dummy(12.5, 0.5); // pays every levy, further out
  const far = dummy(30, 0); // never inside
  const ability = new Ability({ lights, dummies: field([near, rim, far]) });
  cast(ability);
  run(ability, 600);
  assert.equal(ability.isFinished, true);
  assert.equal(ability._ticksDone, config.settings.taxTicks);
  assert.equal(near.kills.length, 1, 'the construct that paid the most and stands nearest is consumed');
  assert.equal(rim.kills.length, 0, 'maxConsume bounds the consumption to one');
  assert.equal(far.kills.length, 0);
  assert.equal(far.corroded, 0);
  // Both payers wear the tax; the consumed one is taken by the throat.
  assert.ok(rim.corroded > 0 && rim.corroded < 1);
  assert.ok(near.consumed > 0, 'the seized body is consumed');
  assert.ok(near.carried > 0, 'and carried round the well');
  // The knock is inward: from beyond the body toward the throat at x = 10.
  assert.ok(near.kills[0].dx < 0);
  assert.equal(near.kills[0].impulse, config.settings.hitImpulse * settings.global.explosionIntensity);
  ability.destroy();
  ability.dispose();
});

test('eligibility is earned: a late arrival is only taxed, and the most-levied construct wins over the nearer one', () => {
  reset();
  const steady = dummy(12.6, 0); // inside from the first levy, far from the throat
  const late = dummy(30, 0); // walks in after two levies, right next to the throat
  const ability = new Ability({ lights, dummies: field([steady, late]) });
  cast(ability);
  run(ability, 600, () => { if (ability._ticksDone === 2) late.position.set(10.2, 0, 0); });
  assert.equal(ability.isFinished, true);
  assert.equal(late.kills.length, 0, 'two levies are below eligibleLevies (3)');
  assert.ok(late.corroded > 0, 'but the late arrival still paid');
  assert.equal(steady.kills.length, 1);
  ability.destroy();
  ability.dispose();
});

test('no eligible construct: the throat closes on nothing, and maxConsume bounds a crowded zone', () => {
  reset();
  settings[ID].eligibleLevies = 9; // more than there are assessments
  const a = dummy(10.4, 0);
  const ability = new Ability({ lights, dummies: field([a]) });
  cast(ability);
  run(ability, 600);
  assert.equal(a.kills.length, 0);
  assert.equal(ability._called, true, 'the call still comes');
  assert.equal(ability._consumedCount, 0, 'and takes nothing');
  ability.destroy();

  reset();
  settings[ID].maxConsume = 2;
  const crowd = [];
  for (let i = 0; i < 12; i++) crowd.push(dummy(10 + Math.cos(i) * 2.5, Math.sin(i) * 2.5));
  const ability2 = new Ability({ lights, dummies: field(crowd) });
  cast(ability2);
  run(ability2, 600);
  const killed = crowd.filter((d) => d.kills.length).length;
  const taxed = crowd.filter((d) => d.corroded > 0).length;
  assert.equal(killed, 2, 'exactly maxConsume constructs');
  assert.ok(taxed <= 8, 'at most eight payers are assessed');
  ability2.destroy();
  ability2.dispose();
  ability.dispose();
});

test('pooled reuse resets the ledger, the coins and the call', () => {
  reset();
  const a = dummy(10.5, 0);
  const ability = new Ability({ lights, dummies: field([a]) });
  cast(ability);
  run(ability, 200);
  assert.ok(ability._ticksDone > 0);
  assert.ok(ability.coins.count > 0, 'coins roll while the well stands');
  ability.destroy();
  assert.equal(ability.coins.count, 0);
  assert.equal(ability.root.visible, false);
  a.alive = true; a.state = 'alive'; a.kills.length = 0;
  cast(ability);
  assert.equal(ability._ticksDone, 0);
  assert.equal(ability._called, false);
  assert.equal(ability._payers.some((p) => p.used), false);
  assert.equal(ability._coins.some((c) => c.used), false);
  run(ability, 600);
  assert.equal(a.kills.length, 1);
  ability.destroy();
  ability.dispose();
});

test('no throw with the combat binding, dummies and particles all absent', () => {
  reset();
  const ability = new Ability({ lights });
  cast(ability);
  run(ability, 600);
  assert.equal(ability.isFinished, true);
  assert.equal(ability.failure, null);
  ability.destroy();
  ability.dispose();
});

test('the well, coins and fins are finite and every resource is disposed once', () => {
  reset();
  const ability = new Ability({ lights });
  cast(ability);
  run(ability, 90);
  const pos = ability.wellGeo.attributes.position.array;
  const nor = ability.wellGeo.attributes.normal.array;
  for (let i = 0; i < pos.length; i++) assert.ok(Number.isFinite(pos[i]) && Number.isFinite(nor[i]));
  // The rim sits on rimSeat · zoneRadius once the well has risen.
  let maxR = 0;
  for (let i = 0; i < pos.length; i += 3) maxR = Math.max(maxR, Math.hypot(pos[i], pos[i + 2]));
  const c = config.settings;
  assert.ok(Math.abs(maxR - (c.zoneRadius * c.rimSeat + c.lipRadius)) < 0.35, `rim at ${maxR}`);
  assert.equal(ability.fins.count, c.finCount);
  let count = 0;
  for (const r of ability.resources) r.addEventListener('dispose', () => count++);
  ability.destroy();
  ability.dispose();
  ability.dispose();
  assert.equal(count, ability.resources.length);
});

test('dragging zoneRadius mid-cast reshapes the standing well on the next frame', () => {
  reset();
  const ability = new Ability({ lights });
  cast(ability);
  run(ability, 100);
  const rimNow = ability._shape.rim;
  settings[ID].zoneRadius = config.settings.zoneRadius * 1.5;
  ability.update(0);
  assert.ok(ability._shape.rim > rimNow * 1.3);
  ability.destroy();
  ability.dispose();
  reset();
});

test('the editor exposes every settings key', () => {
  reset();
  const seen = new Set();
  const folder = () => ({
    add: (c, k) => { seen.add(k); const ctl = { name: () => ctl }; return ctl; },
    addColor: (c, k) => { seen.add(k); const ctl = { name: () => ctl }; return ctl; },
    addFolder: () => folder(),
  });
  buildEditor(folder(), settings[ID], null);
  const missing = Object.keys(config.settings).filter((k) => !seen.has(k));
  assert.deepEqual(missing, []);
});

test('through the UCSM bridge: levies are void statuses, the top payer is hit once, allies and outsiders untouched', async () => {
  reset();
  const { CombatStateManager } = await import('../../packs/sandbox/src/combat/ucsm/CombatStateManager.js');
  const { ExpansionCombatAdapter } = await import('../../packs/sandbox/src/combat/ucsm/ExpansionCombatAdapter.js');
  const manager = new CombatStateManager();
  manager.upsertEntity({ id: 'caster', teamId: 'player', health: 5 });
  manager.upsertEntity({ id: 'enemy', teamId: 'enemy', position: [10.4, 0, 0], health: 5 });
  manager.upsertEntity({ id: 'other', teamId: 'enemy', position: [12.4, 0, 1], health: 5 });
  manager.upsertEntity({ id: 'ally', teamId: 'player', position: [10, 0, 1], health: 5 });
  manager.upsertEntity({ id: 'outside', teamId: 'enemy', position: [25, 0, 0], health: 5 });
  const bridge = new ExpansionCombatAdapter(manager);
  const ability = new Ability({ lights, expansionCombat: bridge });
  const hits = [];
  const statuses = [];
  const a = bridge.bind('matrix-expansion/test-observer').on('hit', (e) => hits.push(e));
  const b = bridge.bind('matrix-expansion/test-observer').on('status', (e) => statuses.push(e));
  cast(ability);
  for (let i = 0; i < 600 && !ability.isFinished; i++) { ability.update(DT); if (i % 2) manager.advance(); }
  for (let i = 0; i < 4; i++) manager.advance();
  const mine = hits.filter((e) => e.abilityUid === 'matrix-expansion/existence-tax');
  assert.equal(mine.length, 1);
  assert.deepEqual(mine[0].targetIds, ['enemy']);
  assert.equal(mine[0].element, 'void');
  assert.ok(manager.entities.get('enemy').health < 5);
  assert.equal(manager.entities.get('other').health, 5);
  assert.equal(manager.entities.get('ally').health, 5);
  assert.equal(manager.entities.get('outside').health, 5);
  const levied = statuses.filter((e) => e.abilityUid === 'matrix-expansion/existence-tax');
  assert.ok(levied.length >= 2 * config.settings.taxTicks - 1, `levies seen: ${levied.length}`);
  assert.ok(levied.every((e) => !e.targetIds.includes('ally') && !e.targetIds.includes('outside')));
  assert.equal(ability.failure, null);
  a.unsubscribe(); b.unsubscribe();
  ability.destroy(); ability.dispose(); bridge.dispose();
});
