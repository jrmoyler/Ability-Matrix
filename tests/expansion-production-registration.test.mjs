import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { registerHooks } from 'node:module';
import { Scene, Vector3 } from 'three';
import { App } from '../packs/sandbox/src/core/App.js';
import { AbilityManager } from '../packs/sandbox/src/abilities/AbilityManager.js';
import { settings, DEFAULT_SETTINGS, ELEMENT_META, ELEMENTS } from '../packs/sandbox/src/config/settings.js';
import { ELEMENT_OF } from '../packs/sandbox/src/config/elements.js';
import { EXPANSION_STATUS } from '../packs/sandbox/src/abilities/expansion-2026/status.js';
import { expansionRoster } from '../packs/sandbox/src/abilities/expansion-2026/ProductionRoster.js';
import { installProductionExpansion } from '../packs/sandbox/src/abilities/expansion-2026/ProductionRegistration.js';
import { CombatStateManager } from '../packs/sandbox/src/combat/ucsm/CombatStateManager.js';
import { ExpansionCombatAdapter } from '../packs/sandbox/src/combat/ucsm/ExpansionCombatAdapter.js';
registerHooks({ load(url, context, next) { return url.endsWith('.css') ? { format:'module', source:'', shortCircuit:true } : next(url, context); } });
const { PackAdapter } = await import('../packs/sandbox/src/combat/ucsm/PackAdapter.js');

function gui() {
  const controller = { name() { return this; }, onChange() { return this; }, listen() { return this; } };
  return { addFolder() { return gui(); }, add() { return controller; }, addColor() { return controller; }, close() {}, destroy() {} };
}
function appStub() {
  const app = Object.create(App.prototype);
  app.scene = { add() {}, remove() {} };
  app.abilities = new AbilityManager({ scene: app.scene });
  app.nativePack = new Map();
  app.editor = { gui: gui() };
  app.combat = { _tracked: new Set(), mechanics: { selected: null, selectedUid: null } };
  app.hud = { setElement() {}, showToast() {} };
  app.aim = { object3D: { visible: true }, setElement(id) { this.element = id; }, arm() { this.isArmed = true; }, cancel() {} };
  app.slot = null;
  app.runtimes = new Map();
  app.cooldowns = new Map();
  return app;
}

test('every expansion status is explicit and candidate rows stay out of public selection', () => {
  const roster = expansionRoster();
  assert.ok(roster.length >= 23);
  assert.ok(roster.every((p) => ['candidate', 'live'].includes(p.status)));
  assert.deepEqual(new Set(roster.map((p) => p.config.meta.element)).size, 23);
  const before = readFileSync(new URL('../presets/expansion/catalog.json', import.meta.url), 'utf8');
  execFileSync(process.execPath, ['tools/extract-expansion.mjs']);
  assert.equal(readFileSync(new URL('../presets/expansion/catalog.json', import.meta.url), 'utf8'), before);
  const manifest = JSON.parse(before).abilities;
  assert.equal(manifest.length, roster.length);
  for (const item of roster) {
    const row = manifest.find((x) => x.uid === item.uid);
    assert.equal(row.element, item.config.meta.element);
    assert.equal(row.status, EXPANSION_STATUS[item.uid]);
    const preset = JSON.parse(readFileSync(new URL(`../presets/expansion/${item.uid.split('/').at(-1)}.json`, import.meta.url)));
    assert.deepEqual(preset.settings, item.config.settings);
  }
  const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  assert.match(html, /expansion\.abilities\.filter\(\(a\) => a\.status === 'live'\)/);
  const first = roster[0];
  const trial = expansionRoster({ ...EXPANSION_STATUS, [first.uid]:'live' });
  assert.equal(trial.find((x) => x.uid === first.uid).status, 'live');
  assert.ok(trial.filter((x) => x.uid !== first.uid).every((x) => x.status === EXPANSION_STATUS[x.uid]));
});

test('each hypothetical single-UID approval wires real App selection, aim, editor and preset defaults without modifying the legacy pools', async () => {
  for (const candidate of expansionRoster()) {
    const statuses = { ...EXPANSION_STATUS, [candidate.uid]: 'live' };
    const roster = expansionRoster(statuses), app = appStub();
    const before = [...app.abilities.pools.keys()];
    const handle = installProductionExpansion(app, roster);
    assert.equal(handle.byUid.size, 1, candidate.uid);
    assert.ok(app.abilities.pools.has(candidate.ID));
    assert.equal(ELEMENT_OF[candidate.uid], candidate.config.meta.element);
    assert.deepEqual(DEFAULT_SETTINGS[candidate.ID], candidate.config.settings);
    assert.deepEqual(settings[candidate.ID], candidate.config.settings);
    const description = await app.select(candidate.uid, { prepare: false });
    assert.equal(description.uid, candidate.uid);
    assert.equal(description.id, candidate.ID);
    assert.equal(app.uidOf(candidate.ID), candidate.uid);
    assert.equal(app.aim.element, candidate.ID);
    assert.ok(app.uids.includes(candidate.uid));
    assert.equal(await app.arm(candidate.uid), true);
    assert.equal(app.aim.isArmed, true);
    handle.dispose();
    assert.deepEqual([...app.abilities.pools.keys()], before, candidate.uid);
    assert.equal(settings[candidate.ID], undefined);
    assert.equal(DEFAULT_SETTINGS[candidate.ID], undefined);
    assert.equal(ELEMENT_META[candidate.ID], undefined);
    assert.equal(ELEMENT_OF[candidate.uid], undefined);
    assert.equal(app.abilities.selected, ELEMENTS[0]);
    app.abilities.dispose();
  }
});

test('registration refuses collisions and rolls back when editor setup fails', () => {
  const app = appStub(), source = expansionRoster()[0];
  assert.throws(() => installProductionExpansion(app, [{ ...source, status:'live', ID:ELEMENTS[0] }]), /conflict/);
  const bad = { ...source, status:'live', buildEditor() { throw new Error('editor failure'); } };
  assert.throws(() => installProductionExpansion(app, [bad]), /editor failure/);
  assert.equal(app.abilities.pools.has(source.ID), false);
  assert.equal(settings[source.ID], undefined);
  assert.equal(ELEMENT_OF[source.uid], undefined);
  assert.equal(app.expansionLive, undefined);
  app.abilities.dispose();
  assert.throws(() => expansionRoster({ ...EXPANSION_STATUS, [source.uid]: 'unknown' }), /Invalid/);
});

test('approved candidates take the real native cast path and report their own UID and element', async () => {
  for (const candidate of expansionRoster()) {
    const combat = new CombatStateManager();
    combat.upsertEntity({ id:'caster', teamId:'player' });
    const expansionCombat = new ExpansionCombatAdapter(combat);
    const app = appStub();
    app.abilities.dispose();
    app.scene = new Scene();
    app.character = { position:new Vector3() };
    app.dummies = { findTargets: () => [] };
    const ctx = { scene:app.scene, character:app.character, dummies:app.dummies,
      lights:{ acquire:() => ({}), set() {}, release() {} }, expansionCombat };
    app.abilities = new AbilityManager(ctx);
    app._throwBody = () => {};
    app.aim.facing = 0;
    const adapter = Object.assign(Object.create(PackAdapter.prototype), {
      app, manager:combat, enabled:true, scope:null, mechanics:{ selected:null, selectedUid:null }, _meta:new WeakMap(), _wrapped:new WeakSet(), _tracked:new Set()
    });
    app.combat = adapter;
    adapter._install();
    const roster = expansionRoster({ ...EXPANSION_STATUS, [candidate.uid]:'live' });
    const live = installProductionExpansion(app, roster);
    await app.select(candidate.uid, { prepare:false });
    app._cast(new Vector3(), new Vector3(0,0,1), 5);
    const ability = app.abilities.active[0];
    assert.ok(ability, candidate.uid);
    assert.equal(adapter._meta.get(ability).uid, candidate.uid);
    assert.equal(adapter._meta.get(ability).element, candidate.config.meta.element);
    assert.ok(combat.queue.some((event) => event.type === 'cast-start' && event.abilityUid === candidate.uid));
    app.abilities.clear();
    assert.ok(adapter._tracked.has(ability));
    live.dispose(); app.abilities.dispose(); expansionCombat.dispose();
    assert.equal(adapter._tracked.has(ability), false, candidate.uid);
  }
});
