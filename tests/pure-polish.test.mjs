// The 80 pure-element castables are generated (tools/sculpt-pure.mjs), so these
// tests pin what the generator promises: depth comparable to the hand-written
// Codex casts, no leftover hacks, a settled detail layer, and no float noise.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { Vector3, MeshBasicMaterial } from 'three';
import { SPELLS } from '../tools/pure-spells.mjs';
import { DetailLayer, DETAIL_KINDS } from '../packs/sandbox/src/abilities/codex/DetailLayer.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const src = (dir, name) => readFileSync(path.join(root, 'packs/sandbox/src', dir, 'codex', name), 'utf8');

test('there are eighty pure castables', () => {
  assert.equal(SPELLS.length, 80);
  assert.equal(new Set(SPELLS.map((s) => s.id)).size, 80);
});

test('every pure castable has a clean, deep config', async () => {
  const glyphs = new Set();
  for (const spell of SPELLS) {
    const text = src('config', `${spell.id}.js`);
    assert.ok(!/\d\.\d{5,}/.test(text), `${spell.id} config has float noise`);
    const spec = (await import(pathToFileURL(path.join(root, 'packs/sandbox/src/config/codex', `${spell.id}.js`)).href)).default;
    const keys = Object.keys(spec.settings);
    assert.ok(keys.length >= 100, `${spell.id} has ${keys.length} controls`);
    for (const key of ['detailCount', 'moteRate', 'aftershockRadius', 'voiceOpacity', 'groundOpacity', 'bodyPulse']) {
      assert.ok(key in spec.settings, `${spell.id} lacks ${key}`);
    }
    glyphs.add(spec.meta.glyph);
  }
  assert.equal(glyphs.size, 80, 'every card has its own glyph');
});

test('generated code has no placeholder hacks and uses the detail layer', () => {
  for (const spell of SPELLS) {
    const ability = src('abilities', `${spell.cls}Ability.js`);
    const materials = src('materials', `${spell.cls}Materials.js`);
    assert.ok(!/\bvoid \w+;/.test(ability), `${spell.id} ability discards a value`);
    assert.ok(!/\* 0\.0;/.test(materials), `${spell.id} shader multiplies a varying by zero`);
    assert.match(ability, new RegExp(`new DetailLayer\\(create${spell.cls}PieceGeometry\\(\\), this\\.detailMaterial\\)`), `${spell.id} detail layer`);
    assert.match(ability, new RegExp(`new RigHero\\(create${spell.cls}HeroGeometry\\(\\), this\\.heroMaterial`), `${spell.id} hero rig`);
    assert.match(ability, /_aftershock\(\)/, `${spell.id} aftershock`);
    assert.match(materials, new RegExp(`export function create${spell.cls}DetailMaterial`), `${spell.id} detail material`);
    assert.ok((ability.match(/\.addFolder\(/g) ?? []).length >= 14, `${spell.id} editor folders`);
  }
});

test('the detail layer lays every kind out without NaN, for circles and lines', () => {
  const st = {
    center: new Vector3(0, 0, 5), origin: new Vector3(), dir: new Vector3(0, 0, 1), side: new Vector3(1, 0, 0),
    radius: 3, length: 10, thickness: 0.3, grow: 1, along: 1, open: 1, spin: 1, fade: 1, dissolve: 0
  };
  const c = { detailCount: 24, detailSpread: 0.8, detailLift: 2, detailSpin: 1, detailSize: 0.5, detailSizeJitter: 0.3 };
  const twists = ['topple', 'crush', 'stamp', 'inhale', 'shear', 'drill', 'plant', 'seal', 'braid', 'return'];
  for (const kind of DETAIL_KINDS) {
    const layer = new DetailLayer(kind, new MeshBasicMaterial());
    layer.reseed(3.3);
    for (const twist of twists) {
      for (const zone of [true, false]) {
        layer.update(twist, zone, st, c, 1.2);
        assert.ok(layer.live > 0, `${kind}/${twist}/${zone} draws something`);
        assert.ok(!layer.mesh.instanceMatrix.array.some(Number.isNaN), `${kind}/${twist}/${zone} NaN`);
      }
    }
    st.fade = 0;
    layer.update('topple', true, st, c, 1);
    assert.equal(layer.mesh.visible, false, `${kind} hides when faded`);
    st.fade = 1;
    layer.dispose();
  }
});

test('every pure castable marks the bodies it fells, like the older Codex casts', async () => {
  const { MARK } = await import('../tools/pure-settings.mjs');
  const marks = new Set();
  for (const spell of SPELLS) {
    const spec = (await import(pathToFileURL(path.join(root, 'packs/sandbox/src/config/codex', `${spell.id}.js`)).href)).default;
    const c = spec.settings;
    assert.equal(c.colorMarkBody, MARK[spell.element].body, `${spell.id} wears its element`);
    marks.add(spell.element + c.colorMarkBody);
    const mod = await import(pathToFileURL(path.join(root, 'packs/sandbox/src/abilities/codex', `${spell.cls}Ability.js`)).href);
    // Just the mark's own state, on a bare instance: no scene, no GPU.
    const cast = Object.create(mod[`${spell.cls}Ability`].prototype);
    cast._struck = [];
    cast._carried = [];
    cast._hits = 0;
    cast._markCount = 0;
    cast._marks = Array.from({ length: 12 }, () => ({ dummy: null, time: 0, emitter: { reset() {}, tick: (dt, rate) => dt * rate } }));
    cast._look = {};
    let emitted = 0;
    cast.motes = { emit: (n) => { emitted += n; } };
    const seen = [];
    const dummy = {
      finished: false,
      position: new Vector3(1, 0, 2),
      bodyPoint: (out) => out.set(1, 0.9, 2),
      corrode: (amount, look) => seen.push([amount, look.color])
    };
    cast._remember(dummy);
    for (let i = 0; i < 40; i++) cast._updateMarks(0.05);
    assert.equal(cast._hits, 1);
    assert.ok(seen.length > 0, `${spell.id} stains the body`);
    const last = seen.at(-1);
    assert.ok(Math.abs(last[0] - c.markAmount) < 1e-9, `${spell.id} stains to markAmount`);
    assert.equal(last[1], c.colorMarkBody);
    for (let i = 1; i < seen.length; i++) assert.ok(seen[i][0] >= seen[i - 1][0], `${spell.id} stain never heals`);
    assert.ok(emitted > 0, `${spell.id} sheds off the marked body`);
    cast._releaseMarks();
    assert.equal(cast._markCount, 0);
    const ability = src('abilities', `${spell.cls}Ability.js`);
    assert.match(ability, /_hand\(\);/, `${spell.id} flares at the hand`);
  }
  assert.equal(marks.size, new Set(SPELLS.map((s) => s.element)).size, 'one look per element');
});
