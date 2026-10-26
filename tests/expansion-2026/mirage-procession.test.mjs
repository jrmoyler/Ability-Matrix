import test from 'node:test';
import assert from 'node:assert/strict';
import { Vector3 } from 'three';
import { settings } from '../../packs/sandbox/src/config/settings.js';
import config from '../../packs/sandbox/src/abilities/expansion-2026/mirage-procession/config.js';
import {
  Ability,
  ID,
} from '../../packs/sandbox/src/abilities/expansion-2026/mirage-procession/index.js';
settings[ID] = structuredClone(config.settings);
function setup(lane) {
  settings[ID].trueLane = lane;
  const hits = [],
    targets = [-1, 0, 1].map((i) => ({
      position: new Vector3(5, 0, i * 1.8),
      kill: () => {
        hits.push(i);
        return true;
      },
    }));
  const a = new Ability({
    lights: { acquire: () => ({}), release: () => {}, set: () => {} },
    dummies: {
      findTargets: (x, z, r, out) => {
        out.length = 0;
        out.push(...targets);
        return out;
      },
    },
  });
  a.spawn(new Vector3(), new Vector3(1, 0, 0), 10);
  return { a, hits };
}
test('all three decoys travel but only chosen true lane hits, once', () => {
  for (const lane of [-1, 0, 1]) {
    const { a, hits } = setup(lane);
    for (let i = 0; i < 100; i++) a.update(1 / 60);
    assert.deepEqual(hits, [lane]);
    assert.equal(a.masks.length, 3);
    assert.ok(a.masks.every((mask) => mask.children[0].geometry === a.masks[0].children[0].geometry));
    assert.ok(a.masks.every((mask) => mask.children[0].material === a.masks[0].children[0].material));
    a.destroy();
    a.dispose();
  }
});
test('mask mesh has finite vertices and the pooled resources dispose once', () => {
  const { a } = setup(0),
    p = a.masks[0].geometry.attributes.position;
  assert.ok(p.count > 40);
  for (let i = 0; i < p.count; i++)
    assert.ok(Number.isFinite(p.getX(i)) && Number.isFinite(p.getY(i)));
  let n = 0;
  for (const r of a.resources) r.addEventListener('dispose', () => n++);
  a.destroy();
  a.dispose();
  a.dispose();
  assert.equal(n, a.resources.length);
});
test('every lane emits the same trail even before any target is hit', () => {
  const { a, hits } = setup(1);
  const emissions = [];
  a.fx = { emit(count, args) { emissions.push({count, position: args.position.clone()}); } };
  for (let i = 0; i < 8; i++) a.update(1 / 60);
  assert.deepEqual(hits, []);
  assert.equal(emissions.length, 3);
  assert.ok(emissions.every((e) => e.count === emissions[0].count));
  const positions = emissions.map((e) => e.position.z).sort((x, y) => x - y);
  assert.deepEqual(positions, [-config.settings.laneGap, 0, config.settings.laneGap]);
  for (let i = 0; i < 90; i++) a.update(1 / 60);
  const terminal = emissions.filter((e) => e.count === 12);
  assert.equal(terminal.length, 3);
  assert.deepEqual(terminal.map((e) => e.position.z).sort((x, y) => x - y), positions);
  a.destroy(); a.dispose();
});
