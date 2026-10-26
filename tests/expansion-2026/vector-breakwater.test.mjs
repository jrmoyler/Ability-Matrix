import test from 'node:test';
import assert from 'node:assert/strict';
import { Matrix4, Vector3 } from 'three';
import { settings } from '../../packs/sandbox/src/config/settings.js';
import config from '../../packs/sandbox/src/abilities/expansion-2026/vector-breakwater/config.js';
import {
  Ability,
  ID,
} from '../../packs/sandbox/src/abilities/expansion-2026/vector-breakwater/index.js';
settings[ID] = structuredClone(config.settings);
function setup() {
  const hits = [],
    enemies = [
      {
        position: new Vector3(5, 0, 0),
        kill: () => {
          hits.push('front');
          return true;
        },
      },
      {
        position: new Vector3(14, 0, 0),
        kill: () => {
          hits.push('far');
          return true;
        },
      },
      {
        position: new Vector3(5, 0, 5),
        kill: () => {
          hits.push('outside');
          return true;
        },
      },
    ];
  const a = new Ability({
    lights: { acquire: () => ({}), release: () => {}, set: () => {} },
    dummies: {
      findTargets: (x, z, r, out) => {
        out.length = 0;
        out.push(...enemies);
        return out;
      },
    },
  });
  a.spawn(new Vector3(), new Vector3(1, 0, 0), 18);
  return { a, hits };
}
test('three independent fronts travel, hit only swept line and never double count per wave', () => {
  const { a, hits } = setup();
  for (let i = 0; i < 16; i++) a.update(1 / 60);
  assert.deepEqual(hits, []);
  for (let i = 0; i < 180; i++) a.update(1 / 60);
  assert.equal(hits.filter((x) => x === 'front').length, 3);
  assert.equal(hits.filter((x) => x === 'far').length, 3);
  assert.ok(!hits.includes('outside'));
  a.destroy();
  a.dispose();
});
test('custom shield buffer is finite, bounded and pooled resources dispose once', () => {
  const { a } = setup();
  assert.equal(a.fronts.length, 3);
  const p = a.fronts[0].geometry.attributes.position;
  assert.ok(p.count > 500);
  for (let i = 0; i < p.count; i++)
    assert.ok(Number.isFinite(p.getX(i)) && Math.abs(p.getX(i)) <= 0.5);
  let n = 0;
  for (const x of a.resources) x.addEventListener('dispose', () => n++);
  a.destroy();
  a.dispose();
  a.dispose();
  assert.equal(n, a.resources.length);
});
test('shield ribs travel with the front and each impact opens a bounded expanding wake', () => {
  const { a } = setup();
  assert.equal(a.fins.count, 18);
  const matrix = new Matrix4();
  a.fins.getMatrixAt(6, matrix);
  assert.ok(new Vector3().setFromMatrixScale(matrix).x < .01, 'later front remains hidden before launch');
  assert.equal(a.fronts[0].children.length, 1);
  assert.ok(a.fronts[0].children[0].geometry.attributes.position.count >= 300);
  assert.ok(a.wakeRings.every((ring) => !ring.visible));
  for (let i = 0; i < 76; i++) a.update(1 / 60);
  assert.equal(a.wakeRings[0].visible, true);
  assert.equal(a.wakeRings[1].visible, false);
  const start = a.wakeRings[0].scale.x;
  a.fins.getMatrixAt(0, matrix);
  const finBefore = new Vector3().setFromMatrixPosition(matrix);
  for (let i = 0; i < 6; i++) a.update(1 / 60);
  a.fins.getMatrixAt(0, matrix);
  const finAfter = new Vector3().setFromMatrixPosition(matrix);
  assert.ok(Math.abs(finAfter.x) > Math.abs(finBefore.x));
  assert.ok(a.wakeRings[0].scale.x > start);
  a.destroy();
  a.spawn(new Vector3(), new Vector3(1, 0, 0), 18);
  assert.ok(a.wakeRings.every((ring) => !ring.visible));
  a.destroy(); a.dispose();
});
