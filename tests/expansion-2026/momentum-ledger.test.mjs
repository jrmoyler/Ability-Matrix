import test from 'node:test';
import assert from 'node:assert/strict';
import { Vector3 } from 'three';
import { settings } from '../../packs/sandbox/src/config/settings.js';
import config from '../../packs/sandbox/src/abilities/expansion-2026/momentum-ledger/config.js';
import {
  Ability,
  ID,
} from '../../packs/sandbox/src/abilities/expansion-2026/momentum-ledger/index.js';
settings[ID] = structuredClone(config.settings);
function run(step, teleport = false) {
  const hits = [],
    character = { position: new Vector3() },
    target = {
      position: new Vector3(5, 0, 0),
      kill: (x, z, f) => {
        hits.push({ ...f });
        return true;
      },
    };
  const a = new Ability({
    character,
    lights: { acquire: () => ({}), release: () => {}, set: () => {} },
    dummies: {
      findTargets: (x, z, r, out) => {
        assert.equal(x, 5);
        assert.equal(z, 0);
        out.length = 0;
        out.push(target);
        return out;
      },
    },
  });
  a.spawn(new Vector3(), new Vector3(1, 0, 0), 5);
  for (let i = 0; i < 180; i++) {
    if (i < 100) character.position.x += teleport ? 1 : step;
    a.update(1 / 60);
  }
  return { a, hits };
}
test('distance walked increases the deferred force while teleports do not inflate the bank', () => {
  const still = run(0),
    walked = run(0.08),
    teleported = run(0, true);
  assert.equal(still.hits.length, 1);
  assert.equal(walked.hits.length, 1);
  assert.ok(walked.hits[0].impulse > still.hits[0].impulse);
  assert.equal(teleported.hits[0].impulse, still.hits[0].impulse);
  assert.equal(still.a.gauge.count, 0);
  assert.ok(walked.a.gauge.count > 0 && walked.a.gauge.count <= 24);
  assert.equal(teleported.a.gauge.count, 0);
  for (const x of [still, walked, teleported]) {
    x.a.destroy();
    x.a.dispose();
  }
});
test('bounded finite glyphs and resources are disposed once', () => {
  const { a } = run(0);
  assert.equal(a.vectors.count, 32);
  let count = 0;
  for (const x of a.resources) x.addEventListener('dispose', () => count++);
  a.dispose();
  a.dispose();
  assert.equal(count, a.resources.length);
});
test('movement wake records a bounded world trajectory, clears on teleport and resets on pooling', () => {
  const character = { position: new Vector3() },
    a = new Ability({
      character,
      lights: { acquire: () => ({}), release: () => {}, set: () => {} },
    });
  a.spawn(new Vector3(), new Vector3(1, 0, 0), 5);
  let particleBursts = 0;
  a.fx = { emit() { particleBursts++; } };
  for (let i = 0; i < 90; i++) {
    character.position.x += 0.05;
    a.update(1 / 60);
  }
  assert.ok(a.wake.geometry.drawRange.count > 1);
  assert.ok(a.wake.geometry.drawRange.count <= 64);
  assert.ok(particleBursts > 0);
  const beforeTeleport = particleBursts;
  character.position.x += 50;
  a.update(1 / 60);
  assert.equal(a.wake.geometry.drawRange.count, 1);
  assert.equal(particleBursts, beforeTeleport);
  a.destroy();
  assert.equal(a.wake.geometry.drawRange.count, 0);
  a.dispose();
});
