import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { NEW_PRESETS } from '../presets/runtime.js';

const root = fileURLToPath(new URL('../', import.meta.url));
const read = file => readFileSync(path.join(root, file));
const json = file => JSON.parse(read(file));
const hash = value => createHash('sha256').update(value).digest('hex');
const baseline = json('tests/fixtures/original-inventory.json');
const catalog = json('presets/catalog.json');
const library = json('presets/library.json');
const ids = ['chain-relay', 'temporal-rewind', 'blink-corridor', 'restorative-sanctuary',
  'magnetic-minefield', 'mirror-decoys', 'ricochet-chakram', 'kinetic-parry',
  'stasis-bubble', 'prismatic-splitshot'];

test('only the ten previously authored Atlas abilities are added to the catalog', () => {
  assert.deepEqual(NEW_PRESETS.map(p => p.id), ids);
  assert.deepEqual(catalog.abilities.filter(a => a.pack === 'atlas').map(a => a.id), ids);
  assert.equal(catalog.packs.length, 7);
  assert.equal(catalog.abilities.filter(a => a.status === 'live' && a.kind !== 'move').length, 66);
  assert.equal(catalog.abilities.filter(a => a.kind === 'move').length, 34);
  assert.equal(catalog.abilities.filter(a => a.status === 'archived').length, 7);
  assert.equal(new Set(catalog.abilities.map(a => a.uid)).size, catalog.abilities.length);
});

test('all pre-existing catalog and library entries retain exactly their original data', () => {
  const legacy = { packs: catalog.packs.filter(p => p.pack !== 'atlas'),
    abilities: catalog.abilities.filter(a => a.pack !== 'atlas') };
  assert.equal(hash(JSON.stringify(legacy)), baseline.legacyCatalogSha256);
  const presets = Object.fromEntries(Object.entries(library.presets).filter(([key]) => !key.startsWith('atlas/')));
  assert.equal(hash(JSON.stringify(presets)), baseline.legacyLibrarySha256);
});

test('all ten presets appear consistently in the catalog, individual files and library', () => {
  assert.equal(Object.keys(library.presets).length, 66);
  for (const preset of NEW_PRESETS) {
    const uid = `atlas/${preset.id}`;
    const entry = catalog.abilities.find(a => a.uid === uid);
    const file = json(`presets/atlas/${preset.id}.json`);
    assert.deepEqual(file, library.presets[uid]);
    assert.deepEqual(file.settings, { ...preset.defaults, color: preset.color });
    assert.equal(file.format, 'collective-ability-preset@1');
    for (const [key, value] of Object.entries(entry)) assert.deepEqual(file[key], value);
  }
});

test('the five portable Atlas source modules are copied without behavior changes', () => {
  for (const [name, expected] of Object.entries(baseline.atlasSource)) {
    assert.equal(hash(read(name === 'runtime.js' ? 'presets/runtime.js' : `presets/new/${name}`)), expected, name);
  }
});

function filesUnder(dir) {
  return readdirSync(path.join(root, dir), { withFileTypes: true }).flatMap(entry => {
    if (['node_modules', 'dist', '.git'].includes(entry.name)) return [];
    const file = `${dir}/${entry.name}`;
    return entry.isDirectory() ? filesUnder(file) : [file];
  });
}

for (const [pack, expected] of Object.entries(baseline.packs)) {
  test(`${pack}: every pre-existing pack file remains byte-for-byte unchanged`, () => {
    const files = filesUnder(`packs/${pack}`).sort();
    const digest = createHash('sha256');
    for (const file of files) digest.update(file).update('\0').update(read(file)).update('\0');
    assert.equal(files.length, expected.count);
    assert.equal(digest.digest('hex'), expected.sha256);
  });
}
