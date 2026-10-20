import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { SPELLS } from '../tools/pure-spells.mjs';
import { geometryModuleSource } from '../tools/pure-geometry.mjs';
import { SPELL_SURFACES, createSpellBodyGeometry } from '../packs/sandbox/src/abilities/codex/PureBodyGeometries.js';
const base = new URL('../packs/sandbox/src/', import.meta.url);

test('all 80 spells have distinct finite authored vertex buffers, independent of colour and seed', () => {
  assert.deepEqual(Object.keys(SPELL_SURFACES).sort(), SPELLS.map(s => s.id).sort());
  const fingerprints = new Map();
  for (const { id } of SPELLS) {
    const mesh = createSpellBodyGeometry(id);
    const positions = mesh.getAttribute('position');
    const uv = mesh.getAttribute('uv');
    assert.equal(positions.count, uv.count, id);
    assert.ok(mesh.index.count / 3 <= 10000, `${id} triangle budget`);
    assert.ok([...positions.array].every(Number.isFinite), `${id} finite coordinates`);
    assert.ok([...uv.array].every(v => v >= 0 && v <= 1), `${id} valid animation domain`);
    assert.ok([...mesh.index.array].every(i => i < positions.count), `${id} valid indices`);
    assert.ok(mesh.boundingSphere.radius > 0 && Number.isFinite(mesh.boundingSphere.radius), id);
    const digest = createHash('sha256').update(Buffer.from(positions.array.buffer)).digest('hex');
    assert.ok(!fingerprints.has(digest), `${id} duplicates ${fingerprints.get(digest)}`);
    fingerprints.set(digest, id);
    const again = createSpellBodyGeometry(id);
    assert.deepEqual(positions.array, again.getAttribute('position').array, `${id} deterministic`);
    let disposed = false;
    mesh.addEventListener('dispose', () => { disposed = true; });
    mesh.dispose(); again.dispose();
    assert.ok(disposed, id);
  }
  assert.equal(fingerprints.size, 80);
  assert.throws(() => createSpellBodyGeometry('missing'), /Missing spell body/);
});

test('body and distortion use the authored surface and UV animation coordinates for all 80', () => {
  for (const { cls, id } of SPELLS) {
    const ability = readFileSync(new URL(`abilities/codex/${cls}Ability.js`, base), 'utf8');
    const material = readFileSync(new URL(`materials/codex/${cls}Materials.js`, base), 'utf8');
    assert.match(ability, /this.bodyGeometry = createSpellBodyGeometry\(ID\)/, id);
    assert.match(ability, /this.lens = this._mesh\(this.bodyGeometry/, id);
    assert.match(ability, /this.bodyGeometry.dispose\(\)/, id);
    const vertex = material.match(/const BODY_VERTEX = \/\* glsl \*\/ `([\s\S]*?)`;/)[1];
    assert.match(vertex, /float u = uv.x/, id);
    assert.match(vertex, /float v = uv.y/, id);
    for (const axis of ['x', 'y', 'z']) assert.ok(vertex.includes(`position.${axis}`), `${id} uses ${axis}`);
  }
});

test('committed surfaces reproduce exactly from the authored source', () => {
  assert.equal(readFileSync(new URL('abilities/codex/PureBodyGeometries.js', base), 'utf8'), geometryModuleSource());
});
