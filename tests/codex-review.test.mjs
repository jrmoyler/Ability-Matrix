import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { markLookPointer, isTapCast } from '../packs/sandbox/src/input/TouchControls.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const abilityDir = path.join(root, 'packs/sandbox/src/abilities/codex');
const configDir = path.join(root, 'packs/sandbox/src/config/codex');
const materialDir = path.join(root, 'packs/sandbox/src/materials/codex');

test('every codex ability is bespoke: its own class, shaders and full editor', async () => {
  const files = readdirSync(abilityDir).filter((name) => name.endsWith('Ability.js'));
  assert.equal(files.length, 72);
  const materials = new Set(readdirSync(materialDir));
  for (const name of files) {
    const src = readFileSync(path.join(abilityDir, name), 'utf8');
    const cls = name.replace(/\.js$/, '');
    const stem = cls.replace(/Ability$/, '');
    assert.ok(!/TenthEngine|TenthMaterials|makeAbility\(/.test(src), `${cls} is not a shared-engine wrapper`);
    assert.match(src, new RegExp(`export class ${cls} extends Ability`), `${cls} class`);
    assert.match(src, /export function buildEditor\(gui, c, Editor\)/, `${cls} editor`);
    assert.ok(materials.has(`${stem}Materials.js`), `${cls} has its own materials`);
    const shaders = readFileSync(path.join(materialDir, `${stem}Materials.js`), 'utf8');
    assert.ok((shaders.match(/new ShaderMaterial\(/g) ?? []).length >= 2, `${cls} writes its own GLSL`);
    assert.ok(src.split('\n').length >= 400, `${cls} is a full ability, not a wrapper`);
    assert.ok((src.match(/\.addFolder\(/g) ?? []).length >= 4, `${cls} editor has a folder per layer`);
    const id = src.match(/export const ID = '([a-z0-9]+)'/)?.[1];
    assert.ok(id, `${cls} ID`);
    const spec = (await import(pathToFileURL(path.join(configDir, `${id}.js`)).href)).default;
    assert.equal(spec.id, id, `${cls} config id`);
    assert.ok(!('particle' in spec), `${cls} config drops the shared-engine particle key`);
  }
});

test('a pinch is not a tap cast', () => {
  const pinch = new Map();
  const first = markLookPointer(pinch, 1, 0, 0);
  const second = markLookPointer(pinch, 2, 12, 4);
  assert.equal(isTapCast(first), false);
  assert.equal(isTapCast(second), false);

  const tap = new Map();
  const lone = markLookPointer(tap, 7, 0, 0);
  assert.equal(isTapCast(lone), true);
  lone.moved = 14;
  assert.equal(isTapCast(lone), false);
});
