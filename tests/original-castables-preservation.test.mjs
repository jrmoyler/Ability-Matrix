import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';

const root = new URL('../', import.meta.url);
const read = (path) => readFileSync(new URL(path, root));
const hash = (data) => createHash('sha256').update(data).digest('hex');
const baseline = JSON.parse(read('tests/fixtures/castables-230-baseline.json'));

test('all original 230 castables retain their catalog entries, presets and authored source', () => {
  const catalog = JSON.parse(read('presets/catalog.json'));
  assert.equal(Object.keys(baseline.entries).length, 230);
  const byUid = new Map(catalog.abilities.map((entry) => [entry.uid, entry]));
  for (const [uid, expected] of Object.entries(baseline.entries)) {
    const entry = byUid.get(uid);
    assert.ok(entry, `missing ${uid}`);
    assert.equal(hash(JSON.stringify(entry)), expected.record, `catalog ${uid}`);
    assert.equal(hash(read(`presets/${entry.pack}/${entry.id}.json`)), expected.preset, `preset ${uid}`);
  }
  for (const [path, expected] of Object.entries(baseline.files))
    assert.equal(hash(read(path)), expected, path);
});
