import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';

import {
  ARCHETYPE_IDS,
  FORMATION_IDS,
  MAX_DUMMIES,
  assignArchetypes,
  blowScale,
  formationSpot,
  freshState,
  normalizeMix,
  resolveBlow,
  runnerOffset,
  seededRandom,
  stepArchetype
} from '../packs/sandbox/src/combat/DummyArchetypes.js';
import { Dummy } from '../packs/sandbox/src/combat/Dummy.js';
import { DummyField } from '../packs/sandbox/src/combat/DummyField.js';
import { settings } from '../packs/sandbox/src/config/settings.js';

const env = { registerShadowCasterWithPatch() {} };
let model = null;
function rig() {
  if (!model) {
    const bytes = readFileSync(new URL('../packs/sandbox/public/models/dummy.fbx', import.meta.url));
    model = new FBXLoader().parse(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), '');
  }
  return model;
}
const body = (archetype) => {
  const source = rig();
  return new Dummy({ source, clip: source.animations[0], scale: 0.01, offset: { x: 0, y: 0, z: 0 }, forwardYaw: 0, environment: env, archetype });
};
const force = { impulse: 6, lift: 3, spin: 1 };

test('mix: unknown archetypes and bad weights are dropped; empty means all standard', () => {
  assert.deepEqual(normalizeMix(null), { standard: 1, armored: 0, runner: 0, giant: 0, caster: 0 });
  assert.deepEqual(normalizeMix({ armored: 2, wizard: 5, runner: -1, giant: 'x' }), { standard: 0, armored: 2, runner: 0, giant: 0, caster: 0 });
  assert.deepEqual(normalizeMix('armored, runner,armored'), { standard: 0, armored: 2, runner: 1, giant: 0, caster: 0 });
});

test('assignment apportions the weights, interleaves them and is deterministic', () => {
  const list = assignArchetypes(8, { standard: 1, armored: 1 });
  assert.equal(list.length, 8);
  assert.equal(list.filter((a) => a === 'armored').length, 4);
  // Interleaved, never four of one in a row.
  assert.ok(!/(standard,){3}standard|(armored,){3}armored/.test(list.join(',')));
  assert.deepEqual(assignArchetypes(8, { standard: 1, armored: 1 }), list);
  const all = assignArchetypes(10, { standard: 1, armored: 1, runner: 1, giant: 1, caster: 1 });
  for (const id of ARCHETYPE_IDS) assert.equal(all.filter((a) => a === id).length, 2, id);
  assert.equal(assignArchetypes(16, { giant: 3, caster: 1 }).filter((a) => a === 'giant').length, 12);
  assert.deepEqual(assignArchetypes(0, {}), []);
});

test('formations: line spans across the view, gauntlet runs away in three lanes, cluster stays tight', () => {
  const config = { radius: 13, minRadius: 5, separation: 2.4, forward: { x: 0, z: -1 } };
  const line = Array.from({ length: 5 }, (_, i) => formationSpot('line', i, 5, config));
  for (const p of line) assert.ok(Math.abs(p.z + 9) < 1e-9, 'all on one rank ahead of the caster');
  assert.ok(Math.abs(line[0].x + line[4].x) < 1e-9, 'centred on the view');
  assert.ok(Math.abs(line[1].x - line[0].x) - 2.4 < 1e-9);

  const gauntlet = Array.from({ length: 9 }, (_, i) => formationSpot('gauntlet', i, 9, config));
  const lanes = new Set(gauntlet.map((p) => p.x.toFixed(3)));
  assert.equal(lanes.size, 3);
  assert.ok(gauntlet[6].z < gauntlet[0].z, 'later ranks are further away');
  assert.notEqual(gauntlet[1].z, gauntlet[0].z, 'the middle lane is staggered');

  const cluster = Array.from({ length: 8 }, (_, i) => formationSpot('cluster', i, 8, config));
  const cx = cluster.reduce((s, p) => s + p.x, 0) / 8;
  const cz = cluster.reduce((s, p) => s + p.z, 0) / 8;
  for (const p of cluster) assert.ok(Math.hypot(p.x - cx, p.z - cz) < 5);

  const random = seededRandom(7);
  for (let i = 0; i < 50; i++) {
    const ring = formationSpot('ring', i, 50, config, random);
    const r = Math.hypot(ring.x, ring.z);
    assert.ok(r >= 5 - 1e-9 && r <= 13 + 1e-9);
    const scatter = formationSpot('scatter', i, 50, config, random);
    assert.ok(Math.hypot(scatter.x, scatter.z) <= 13 + 1e-9);
  }
  assert.deepEqual(FORMATION_IDS, ['ring', 'line', 'cluster', 'gauntlet', 'scatter']);
});

test('archetype rules: armour, grace window, shield timer, runner strafe, heavy giant', () => {
  const armored = freshState('armored', { armorHits: 2 });
  assert.equal(resolveBlow(armored), 'absorb');
  assert.equal(resolveBlow(armored), 'ignore', 'the same cast overlapping next frame is not a second blow');
  stepArchetype(armored, 0.5, {});
  assert.equal(resolveBlow(armored), 'absorb');
  stepArchetype(armored, 0.5, {});
  assert.equal(resolveBlow(armored), 'fall');

  const caster = freshState('caster', { shieldDelay: 1 });
  assert.equal(caster.shield, false);
  let raised = false;
  for (let i = 0; i < 40 && !raised; i++) raised = stepArchetype(caster, 0.25, { shieldDown: 4, shieldUp: 2 }).shieldRaised;
  assert.ok(raised && caster.shield);
  assert.equal(resolveBlow(caster), 'pop');
  assert.equal(caster.shield, false);
  stepArchetype(caster, 0.5, {});
  assert.equal(resolveBlow(caster), 'fall', 'with the bubble down a caster falls to one blow');

  const runner = freshState('runner');
  stepArchetype(runner, Math.PI / 2, { runnerSpeed: 1 });
  assert.ok(Math.abs(runnerOffset(runner, { runnerRange: 3 }) - 3) < 1e-9);
  assert.equal(blowScale('giant', { giantImpulse: 0.4 }), 0.4);
  assert.equal(blowScale('standard'), 1);
});

test('an armored dummy shrugs off its armour (sparks), then falls; a giant is thrown less hard', () => {
  const previous = structuredClone(settings.dummies.archetypes);
  settings.dummies.archetypes.armorHits = 2;
  try {
    const d = body('armored');
    d.place(0, 3, 0);
    const blows = [];
    d.onBlow = (_, what) => blows.push(what);
    assert.equal(d.kill(0, 1, force), false);
    assert.equal(d.alive, true);
    d.update(0.5);
    assert.equal(d.kill(0, 1, force), false);
    d.update(0.5);
    assert.deepEqual(blows, ['absorb', 'absorb']);
    assert.equal(d.kill(0, 1, force), true);
    assert.equal(d.alive, false);
    assert.ok(d.parts[0].ragdoll, 'the last blow is a real fall');
    // A new life puts the armour back on.
    d.place(0, 3, 0);
    assert.equal(d.kill(0, 1, force), false);

    const giant = body('giant');
    assert.ok(giant.height > settings.dummies.height * 1.3);
    assert.ok(giant.hitRadius > settings.dummies.bodyRadius * 1.3);
    assert.equal(giant.root.scale.x, settings.dummies.archetypes.giantScale);
    giant.place(0, 3, 0);
    assert.equal(giant.kill(0, 1, force), true);
  } finally {
    Object.assign(settings.dummies.archetypes, previous);
  }
});

test('the field: count up to 24, the mix rebuilds slots, external bodies are hit but never managed', () => {
  const saved = { count: settings.dummies.count, mix: { ...settings.dummies.mix }, formation: settings.dummies.formation, enabled: settings.dummies.enabled };
  try {
    const field = new DummyField(env);
    const source = rig();
    field.source = source;
    field.clip = source.animations[0];
    settings.dummies.formation = 'line';
    settings.dummies.mix = { standard: 1, armored: 1, runner: 0, giant: 0, caster: 0 };
    field._resize(16);
    assert.equal(field.ownSlots.length, 16);
    assert.equal(field.ownSlots.filter((s) => s.dummy.archetype === 'armored').length, 8);
    field._resize(MAX_DUMMIES + 10);
    assert.equal(field.ownSlots.length, MAX_DUMMIES);
    field._resize(4);
    assert.equal(field.ownSlots.length, 4);
    settings.dummies.mix = { standard: 0, armored: 0, runner: 0, giant: 0, caster: 1 };
    field._resize(4);
    assert.ok(field.ownSlots.every((s) => s.dummy.archetype === 'caster'));

    // An external body: reached by searches, never stood or disposed by the field.
    const wizard = { alive: true, state: 'alive', position: { x: 0, y: 0, z: 30 }, kills: 0, kill() { this.kills++; return false; }, immuneTo: (a) => a.cpu === true };
    field.addBody(wizard);
    field.addBody(wizard);
    assert.equal(field.slots.filter((s) => s.external).length, 1);
    settings.dummies.enabled = false;
    const found = field.findTargets(0, 30, 1, []);
    assert.deepEqual(found, [wizard], 'still in play with the field switched off');
    field.exclude = wizard;
    assert.deepEqual(field.findTargets(0, 30, 1, []), []);
    field.exclude = null;
    const line = { isActive: true, element: 'tempest', origin: { x: 0, z: 0 }, position: { x: 0, z: 31 }, direction: { x: 0, z: 1 }, u: 0.5 };
    field._hitLine(line, settings.dummies.hit);
    assert.equal(wizard.kills, 1);
    field._hitLine({ ...line, cpu: true }, settings.dummies.hit);
    assert.equal(wizard.kills, 1, 'a body can refuse its own casts');
    field.reset();
    assert.equal(wizard.position.z, 30, 'reset never moves an external body');
    field.removeBody(wizard);
    assert.equal(field.slots.filter((s) => s.external).length, 0);
    field.dispose();
  } finally {
    Object.assign(settings.dummies, saved);
  }
});
