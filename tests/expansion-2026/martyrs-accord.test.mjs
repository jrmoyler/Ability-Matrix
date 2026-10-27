import test from 'node:test';
import assert from 'node:assert/strict';
import { Vector3 } from 'three';
import { settings } from '../../packs/sandbox/src/config/settings.js';
import config from '../../packs/sandbox/src/abilities/expansion-2026/martyrs-accord/config.js';
import { Ability, ID, UID, buildEditor } from '../../packs/sandbox/src/abilities/expansion-2026/martyrs-accord/index.js';

settings[ID] = structuredClone(config.settings);
const lights = { acquire: () => ({}), release() {}, set() {} };
const FRAME = 1 / 60;

/** Zone centre at (10, 0, 0) for a cast from the origin along +X, distance 10. */
function setup(targets) {
  const hits = [];
  for (const t of targets) {
    t.kill = (x, z, force) => {
      if (t.throws) throw Error('out of range');
      hits.push({ who: t, x, z, ...force });
      return true;
    };
  }
  const ability = new Ability({
    lights,
    dummies: {
      findTargets: (x, z, r, out) => {
        out.length = 0;
        out.push(...targets);
        return out;
      },
    },
  });
  return { ability, hits };
}
const run = (ability, frames) => { for (let i = 0; i < frames && !ability.isFinished; i++) ability.update(FRAME); };

test('config is data-only with a full commented-size settings block', () => {
  const keys = Object.keys(config.settings);
  assert.equal(config.id, 'martyrsAccord');
  assert.equal(config.meta.element, 'holy');
  assert.equal(config.meta.cast, 'zone');
  assert.ok(keys.length >= 60 && keys.length <= 150, `${keys.length} keys`);
  for (const k of ['range', 'minRange', 'speed', 'cooldown', 'castAnim', 'lightColor', 'lightIntensity', 'lightRadius', 'lifetime', 'zoneRadius'])
    assert.ok(k in config.settings, k);
  assert.ok(config.settings.zoneRadius >= 3 && config.settings.range >= 16);
});

test('one bounded sacrifice: no hit during the vigil, exactly one per bound enemy at the break, then finishes', () => {
  const near = { alive: true, position: new Vector3(9, 0, 1) };
  const far = { alive: true, position: new Vector3(99, 0, 0), throws: true };
  const { ability, hits } = setup([near, far]);
  ability.spawn(new Vector3(), new Vector3(1, 0, 0), 10);
  run(ability, 60);
  assert.equal(ability._arrived, true);
  assert.equal(ability._boundCount, 1, 'only the enemy inside the circle is bound');
  assert.equal(hits.length, 0, 'the vigil itself never hits');
  run(ability, 600);
  assert.equal(ability.isFinished, true);
  assert.equal(hits.length, 1);
  assert.equal(hits[0].impulse, config.settings.hitImpulse);
  assert.equal(ability._landedCount, ability._swordN, 'every sword landed before the break');
  assert.equal(ability._swordN, 7);
  ability.destroy();
  ability.dispose();
});

test('signature: bound enemies are thrown away from the protected caster, not from the circle centre', () => {
  // This enemy sits on the caster's side of the centre; a radial push would send it back toward the caster.
  const t = { alive: true, position: new Vector3(7.5, 0, 1.5) };
  const { ability, hits } = setup([t]);
  ability.spawn(new Vector3(), new Vector3(1, 0, 0), 10);
  run(ability, 600);
  assert.equal(hits.length, 1);
  const expected = new Vector3(7.5, 0, 1.5).normalize();
  assert.ok(Math.abs(hits[0].x - expected.x) < 1e-6 && Math.abs(hits[0].z - expected.z) < 1e-6);
  assert.ok(hits[0].x > 0.9, 'away from the caster');
  ability.destroy();
  ability.dispose();
});

test('the bound cap holds: at most seven enemies, each struck once', () => {
  const targets = [];
  for (let i = 0; i < 10; i++) targets.push({ alive: true, position: new Vector3(10 + Math.cos(i) * 2, 0, Math.sin(i) * 2) });
  const { ability, hits } = setup(targets);
  ability.spawn(new Vector3(), new Vector3(1, 0, 0), 10);
  run(ability, 600);
  assert.equal(hits.length, 7, 'at most seven blows return');
  assert.equal(new Set(hits.map((h) => h.who)).size, 7, 'nobody twice');
  ability.destroy();
  ability.dispose();
});

test('swords land in the heart: points stay inside it when the radius changes mid-cast', () => {
  const { ability } = setup([]);
  ability.spawn(new Vector3(), new Vector3(1, 0, 0), 10);
  run(ability, 70);
  settings[ID].zoneRadius = 6;
  run(ability, 30);
  const m = ability.blades.instanceMatrix;
  const c = new Vector3(); ability._heartCentre(c).add(ability._recoil);
  const S = ability._heartSize();
  for (let k = 0; k < ability._swordN; k++) {
    if (ability._landedAt[k] < 0) continue;
    const e = m.array.slice(k * 16, k * 16 + 16);
    const guard = new Vector3(e[12], e[13], e[14]);
    const axis = new Vector3(e[4], e[5], e[6]); // local +Y (guard → point), scaled by blade length
    const tip = guard.add(axis);
    assert.ok(tip.distanceTo(c) < S * 0.5, `sword ${k} point ${tip.distanceTo(c).toFixed(2)} m from the heart centre`);
  }
  settings[ID].zoneRadius = config.settings.zoneRadius;
  ability.destroy();
  ability.dispose();
});

test('pooled reuse resets every record', () => {
  const t = { alive: true, position: new Vector3(10, 0, 0) };
  const { ability, hits } = setup([t]);
  ability.spawn(new Vector3(), new Vector3(1, 0, 0), 10);
  run(ability, 600);
  assert.equal(hits.length, 1);
  ability.destroy();
  assert.equal(ability.root.visible, false);
  assert.equal(ability.shards.count, 0);
  ability.spawn(new Vector3(), new Vector3(1, 0, 0), 10);
  assert.equal(ability._sacrificed, false);
  assert.equal(ability._arrived, false);
  assert.equal(ability._landedCount, 0);
  assert.equal(ability.hitCount, 0);
  assert.ok(ability._landedAt.every((v) => v === -1));
  run(ability, 600);
  assert.equal(hits.length, 2);
  ability.destroy();
  ability.dispose();
});

test('no throw with no combat binding, no dummies, no particles; resources disposed once', () => {
  const ability = new Ability({ lights });
  ability.spawn(new Vector3(), new Vector3(0, 0, 1), 8);
  run(ability, 600);
  assert.equal(ability.isFinished, true);
  let disposed = 0;
  for (const r of ability.resources) r.addEventListener('dispose', () => disposed++);
  ability.destroy();
  ability.dispose();
  ability.dispose();
  assert.equal(disposed, ability.resources.length);
});

test('the editor exposes every settings key', () => {
  const seen = new Set();
  const ctl = { name() { return ctl; }, onChange() { return ctl; } };
  const folder = () => ({
    addFolder: () => folder(),
    add: (c, k) => { seen.add(k); return ctl; },
    addColor: (c, k) => { seen.add(k); return ctl; },
  });
  buildEditor(folder(), settings[ID], null);
  for (const k of Object.keys(config.settings)) assert.ok(seen.has(k), `editor misses ${k}`);
});

test('live combat: allies sanctified, bound enemy hit once through the attributed bridge, outsider untouched', async () => {
  const { CombatStateManager } = await import('../../packs/sandbox/src/combat/ucsm/CombatStateManager.js');
  const { ExpansionCombatAdapter } = await import('../../packs/sandbox/src/combat/ucsm/ExpansionCombatAdapter.js');
  const manager = new CombatStateManager();
  manager.upsertEntity({ id: 'caster', teamId: 'player', health: 5 });
  manager.upsertEntity({ id: 'enemy', teamId: 'enemy', position: [10, 0, 1], health: 5 });
  manager.upsertEntity({ id: 'ally', teamId: 'player', position: [11, 0, -1], health: 5 });
  manager.upsertEntity({ id: 'outside', teamId: 'enemy', position: [20, 0, 0], health: 5 });
  const bridge = new ExpansionCombatAdapter(manager);
  const ability = new Ability({ lights, expansionCombat: bridge });
  const seen = [];
  const sub = bridge.bind('matrix-expansion/test-observer').on('hit', (e) => seen.push(e));
  ability.spawn(new Vector3(), new Vector3(1, 0, 0), 10);
  for (let i = 0; i < 60; i++) { ability.update(FRAME); if (i % 2) manager.advance(); }
  assert.equal(manager.entities.get('enemy').health, 5, 'vigil does not hit');
  assert.ok(manager.entities.get('ally').statuses.some((s) => s.tag === 'sanctified'), 'ally sanctified');
  for (let i = 0; i < 400 && !ability.isFinished; i++) { ability.update(FRAME); if (i % 2) manager.advance(); }
  manager.advance();
  const expected = 5 - (config.settings.sacrificeDamage + config.settings.wardBonus * 1);
  assert.equal(manager.entities.get('enemy').health, expected);
  assert.equal(manager.entities.get('outside').health, 5);
  assert.equal(manager.entities.get('ally').health, 5);
  assert.equal(seen.length, 1);
  assert.equal(seen[0].abilityUid, UID);
  assert.equal(seen[0].element, 'holy');
  assert.deepEqual(seen[0].targetIds, ['enemy']);
  sub.unsubscribe(); ability.destroy(); ability.dispose(); bridge.dispose();
});
