import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { markLookPointer, isTapCast } from '../packs/sandbox/src/input/TouchControls.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const abilityDir = path.join(root, 'packs/sandbox/src/abilities/codex');
const configDir = path.join(root, 'packs/sandbox/src/config/codex');
const SHAPES = ['SOFT', 'SMOKE', 'STREAK', 'LEAF', 'CHIP', 'RING', 'BUBBLE', 'DROPLET'];

test('generated tenth specs keep the particle the engine reads', async () => {
  const files = readdirSync(abilityDir).filter((name) => {
    const src = readFileSync(path.join(abilityDir, name), 'utf8');
    return src.includes("from './TenthEngine.js'") && src.includes('makeAbility(spec)');
  });
  assert.equal(files.length, 50);
  const seen = new Set();
  for (const name of files) {
    const src = readFileSync(path.join(abilityDir, name), 'utf8');
    const id = src.match(/config\/codex\/([a-z0-9]+)\.js/)[1];
    const spec = (await import(pathToFileURL(path.join(configDir, `${id}.js`)).href)).default;
    assert.ok(SHAPES.includes(spec.particle), `${id} particle`);
    seen.add(spec.particle);
  }
  for (const shape of ['SMOKE', 'LEAF', 'CHIP', 'RING', 'BUBBLE', 'DROPLET']) {
    assert.ok(seen.has(shape), shape);
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
