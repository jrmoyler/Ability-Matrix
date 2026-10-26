import test from 'node:test';
import assert from 'node:assert/strict';
import { expansionImpact } from '../../packs/sandbox/src/abilities/expansion-2026/ExpansionFX.js';
test('impact feedback invokes the sandbox camera and flash systems with bounded tunable values', () => {
  const seen = [];
  const ctx = {
    shake: { add: (...a) => seen.push(['shake', ...a]) },
    flash: { trigger: (...a) => seen.push(['flash', ...a]) },
  };
  expansionImpact(ctx, '#ff9a50', 0.18, 0.12);
  assert.deepEqual(seen[0], ['shake', 0.18, 7, 20]);
  assert.equal(seen[1][0], 'flash');
  assert.equal(seen[1][2], 0.12);
  expansionImpact(ctx, '#ff9a50', 0, 0);
  assert.equal(seen.length, 2);
  assert.doesNotThrow(() => expansionImpact({}, '#ff9a50', 0.2, 0.1));
});
