// The trail every pure-element line cast leaves (abilities/codex/LineTrail.js,
// written into each cast by tools/sculpt-pure.mjs + tools/pure-trail.mjs).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { Vector3 } from 'three';
import { SPELLS } from '../tools/pure-spells.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const { FAMILY, pathPoint, passAt, laneOrder, lanesFor, LineTrail, MAX_LANES } = await import(
  pathToFileURL(path.join(root, 'packs/sandbox/src/abilities/codex/LineTrail.js')).href
);
const sculpt = readFileSync(path.join(root, 'tools/sculpt-pure.mjs'), 'utf8');
const twistOf = Object.fromEntries([...sculpt.matchAll(/^  (\w+): \{ twist: '(\w+)'/gm)].map((m) => [m[1], m[2]]));
const read = (dir, name) => readFileSync(path.join(root, 'packs/sandbox/src', dir, name), 'utf8');

const state = () => ({
  origin: new Vector3(1, 0, 2),
  dir: new Vector3(0, 0, 1),
  side: new Vector3(1, 0, 0),
  length: 12,
  radius: 1.2,
  height: 3,
  thickness: 0.3,
  count: 6
});

test('every line cast has a trail path, and only line casts carry one', async () => {
  const line = SPELLS.filter((s) => s.cast === 'line');
  assert.equal(line.length, 37);
  for (const spell of SPELLS) {
    const ability = read('abilities/codex', `${spell.cls}Ability.js`);
    const materials = read('materials/codex', `${spell.cls}Materials.js`);
    const config = (await import(pathToFileURL(path.join(root, 'packs/sandbox/src/config/codex', `${spell.id}.js`)).href)).default.settings;
    if (spell.cast === 'line') {
      assert.ok(FAMILY[twistOf[spell.id]], `${spell.id} (${twistOf[spell.id]}) has a path family`);
      assert.match(ability, /new LineTrail\(TWIST, this\.trailMaterial, this\.scarMaterial\)/, spell.id);
      assert.match(ability, /addFolder\('14 · Trail'\)/, `${spell.id} editor`);
      assert.match(materials, new RegExp(`export function create${spell.cls}TrailMaterial`), spell.id);
      assert.match(materials, new RegExp(`export function create${spell.cls}ScarMaterial`), spell.id);
      for (const key of ['trailWidth', 'trailLife', 'scarWidth', 'scarLife', 'wakeSpacing', 'colorScarA', 'colorScarB']) assert.ok(key in config, `${spell.id}.${key}`);
    } else {
      assert.doesNotMatch(ability, /LineTrail/, spell.id);
      assert.doesNotMatch(materials, /TrailMaterial/, spell.id);
      assert.ok(!('trailWidth' in config), `${spell.id} is a zone cast`);
    }
  }
});

test('the GLSL path twin is written per twist', () => {
  const doppel = read('materials/codex', 'DoppelLanceMaterials.js');
  assert.match(doppel, /float off = uThickness \* 3\.4;/, 'falsecut runs offset');
  const glamour = read('materials/codex', 'GlamourSweepMaterials.js');
  assert.match(glamour, /return sqrt\(max\(s, 0\.0\)\);/, 'late arrives late');
  const latebolt = read('materials/codex', 'LateBoltMaterials.js');
  assert.match(latebolt, /\(n - 1\.0 - lane\)/, 'reverse fires last lane first');
  const needle = read('materials/codex', 'NeedleGlassMaterials.js');
  assert.match(needle, /float ang = -uRadius \+ 2\.0 \* uRadius \* s;/, 'hinge sweeps round the hand');
});

test('paths start at the hand and end at the far end; the sweep keeps its radius', () => {
  const st = state();
  const p = new Vector3();
  for (const twist of Object.keys(FAMILY)) {
    if (FAMILY[twist] === 'sweep') {
      for (const s of [0, 0.5, 1]) {
        pathPoint(twist, s, 0, 1, st, p);
        assert.ok(Math.abs(Math.hypot(p.x - 1, p.z - 2) - 12 * 0.92) < 1e-6, `${twist} radius`);
      }
      continue;
    }
    pathPoint(twist, 0, 0, 1, st, p);
    assert.ok(Math.abs(p.z - 2) < 1e-6, `${twist} starts at the hand`);
    pathPoint(twist, 1, 0, 1, st, p);
    assert.ok(Math.abs(p.z - 14) < 1e-6, `${twist} ends at the far end`);
    assert.ok(p.y >= 0, `${twist} stays above the floor`);
  }
});

test('a point is crossed later the further along it is, on every lane', () => {
  for (const twist of Object.keys(FAMILY)) {
    for (let lane = 0; lane < 6; lane++) {
      let last = -1;
      for (let i = 0; i <= 10; i++) {
        const t = passAt(twist, i / 10, lane, 6);
        assert.ok(t >= last && t >= 0 && t <= 1 + 1e-9, `${twist} lane ${lane}`);
        last = t;
      }
    }
  }
  assert.deepEqual(laneOrder('reverse', 0, 6), { order: 5, slots: 6 });
  assert.deepEqual(laneOrder('pair', 3, 6), { order: 1, slots: 3 });
  assert.equal(lanesFor('arc', 20), MAX_LANES);
  assert.equal(lanesFor('straight', 6), 1);
});

test('the wake: evenly spaced from a step out of the hand; one per bolt at its landing', () => {
  const fake = { dispose() {} };
  const lance = new LineTrail('drill', fake, fake);
  const wakes = [];
  lance.onWake = (point, lane, s) => wakes.push(s);
  const st = state();
  for (let i = 1; i <= 60; i++) lance.tick(1 / 60, i / 60, st, 2);
  assert.equal(wakes.length, 6);
  assert.ok(wakes[0] > 0.1, 'not at the caster\'s feet');

  const volley = new LineTrail('plant', fake, fake);
  const landings = [];
  volley.onWake = (point, lane, s) => landings.push([lane, s, point.y]);
  for (let i = 1; i <= 60; i++) volley.tick(1 / 60, i / 60, st, 2);
  for (let i = 0; i < 30; i++) volley.tick(1 / 60, 1, st, 2);
  assert.equal(landings.length, 6);
  assert.ok(landings.every(([, s]) => s === 1));
  assert.equal(new Set(landings.map(([lane]) => lane)).size, 6);
  assert.ok(volley.since > 0.4, 'the clock runs on after landing');
  lance.dispose();
  volley.dispose();
});
