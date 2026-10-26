import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { register } from 'node:module';
import { MECHANIC_REGISTRY } from '../packs/sandbox/src/combat/ucsm/registry.js';
import { MECHANIC_PRESETS, MECHANIC_VARIANTS } from '../packs/sandbox/src/combat/ucsm/mechanics/presets.js';
import { ELEMENT_GROUPS } from '../packs/sandbox/src/config/elements.js';

globalThis.location = { search: '' };
const { armMechanic } = await import('../packs/sandbox/src/bridge/MatrixBridge.js');
register(`data:text/javascript,${encodeURIComponent("export async function load(url, context, nextLoad) { if (url.endsWith('.css')) return { format: 'module', source: '', shortCircuit: true }; return nextLoad(url, context); }")}`, import.meta.url);
const { MechanicHost } = await import('../packs/sandbox/src/combat/ucsm/mechanics/MechanicHost.js');

test('matrix mechanic catalog matches every live runtime move and its own element', () => {
  const file = new URL('../presets/mechanics/catalog.json', import.meta.url);
  const before = readFileSync(file, 'utf8');
  execFileSync(process.execPath, ['tools/extract-mechanics.mjs']);
  assert.equal(readFileSync(file, 'utf8'), before, 'manifest is reproducible');
  const rows = JSON.parse(before).abilities;
  const live = MECHANIC_REGISTRY.filter(e => e.selectable);
  assert.equal(rows.length, live.length);
  assert.equal(new Set(rows.map(r => r.uid)).size, rows.length);
  const elements = new Set(ELEMENT_GROUPS.map(e => e.id));
  for (const entry of live) {
    const row = rows.find(r => r.uid === entry.uid);
    assert.ok(row, entry.uid);
    assert.equal(row.element, entry.element, entry.uid);
    assert.ok(elements.has(row.element));
    assert.equal(row.family, entry.mechanic);
    assert.equal(row.kind, 'mechanic');
  }
  const catalog = JSON.parse(readFileSync(new URL('../presets/catalog.json', import.meta.url)));
  const original = catalog.abilities.filter(a => a.status === 'live' && ['ability','summon','buff'].includes(a.kind));
  assert.equal(original.length, 230);
  assert.ok(rows.every(row => !catalog.abilities.some(a => a.uid === row.uid)));
});

test('bridge arms each base and variant through its exact family without routing into existing packs', () => {
  const calls = [];
  const app = { combat: { enabled: true, mechanics: { select(family, uid) { calls.push({family, uid}); return true; } } } };
  for (const p of [...Object.values(MECHANIC_PRESETS), ...Object.values(MECHANIC_VARIANTS)]) {
    assert.equal(armMechanic(app, p.uid), p);
    assert.deepEqual(calls.at(-1), { family: p.family, uid: MECHANIC_VARIANTS[p.uid] ? p.uid : null });
  }
  assert.throws(() => armMechanic(app, 'mechanics/weave/not-real'), /Unknown mechanic/);
  app.combat.enabled = false;
  assert.throws(() => armMechanic(app, MECHANIC_PRESETS.weave.uid), /Enable combat/);
  app.combat.enabled = true;
  app.combat.mechanics.select = () => ({ ok: false, reason: 'paused' });
  assert.throws(() => armMechanic(app, MECHANIC_PRESETS.weave.uid), /paused/);
});

test('spellbook selections reach the real host and arm each mechanic family', () => {
  const app = { paused: false, activeAim: { cancel() {} }, hud: { showToast() {} }, scene: { add() {}, remove() {} } };
  const host = Object.create(MechanicHost.prototype);
  Object.assign(host, { app, adapter: { enabled: true }, systems: { stance: { active: new Map() } }, selected: null, selectedUid: null });
  app.combat = { enabled: true, mechanics: host };
  // Convergence variants create a visible aiming mesh; avoid depending on a renderer.
  for (const p of [...Object.values(MECHANIC_PRESETS), ...Object.values(MECHANIC_VARIANTS)]) {
    armMechanic(app, p.uid);
    assert.equal(host.selected, p.family, p.uid);
    assert.equal(host.selectedUid, MECHANIC_VARIANTS[p.uid] ? p.uid : null, p.uid);
  }
});
