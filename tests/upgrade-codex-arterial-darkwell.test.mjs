import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const src = (p) => readFileSync(path.join(root, 'packs/sandbox/src', p), 'utf8');
const config = async (id) => (await import(pathToFileURL(path.join(root, `packs/sandbox/src/config/codex/${id}.js`)).href)).default;

const NEW = {
  arterial: ['writheAmp', 'writheLength', 'writheSpeed', 'writheIn', 'lieThicken', 'rearHeight', 'rearFrom', 'rearRate', 'restrikeDrops', 'restrikeRing', 'restrikeShake', 'poolGrow', 'poolTime', 'poolFlow', 'poolPulse'],
  darkwell: ['bowl', 'bowlPower', 'depthFalloff', 'wallLight', 'residualSag', 'relaxWobble', 'relaxRate', 'lingerLens', 'colorBody', 'horizonMin', 'horizonMax', 'horizonLinger', 'photonGlow', 'photonWidth', 'spiralArms', 'spiralTight', 'spiralGlow', 'inkBody', 'lingerMotes', 'lingerSmoke', 'colorPhoton', 'curtainMin']
};
const ABILITY = { arterial: 'abilities/codex/ArterialWhipAbility.js', darkwell: 'abilities/codex/DarkMatterWellAbility.js' };

for (const [id, keys] of Object.entries(NEW)) {
  test(`${id}: every new presentation key has a default and a live editor control`, async () => {
    const spec = await config(id);
    const ability = src(ABILITY[id]);
    for (const key of keys) {
      assert.ok(key in spec.settings, `${id}.${key} default`);
      assert.match(ability, new RegExp(`['"]${key}['"]`), `${id}.${key} editor control`);
    }
  });
}

test('arterial: the linger is long enough to read and the flash is local, hit rules unchanged', async () => {
  const s = (await config('arterial')).settings;
  assert.ok(s.holdTime >= 1, 'it lies there at least a second');
  assert.ok(s.slamFlash <= 0.1, 'no full-screen red flash');
  for (const [k, v] of Object.entries({ hitWidth: 1.0, hitImpulse: 4.5, hitLift: 8, tipZone: 2.2, tipImpulse: 14, tipLift: 7 })) assert.equal(s[k], v, k);
  const ability = src(ABILITY.arterial);
  // the strikes of the head are presentation: no kill calls in the linger
  const lie = ability.slice(ability.indexOf('_lie(dt, after, r) {'), ability.indexOf('/** A little mist'));
  assert.ok(lie.length > 100 && !/\.kill\(/.test(lie), 'linger deals no hits');
});

test('darkwell: swallow timing and grip rules unchanged; well draws in front of the floor with a constant margin', async () => {
  const s = (await config('darkwell')).settings;
  for (const [k, v] of Object.entries({ swallowDelay: 0.35, swallowTime: 1.35, collapseTime: 0.42, closeTime: 0.5, gripImpulse: 2.0, gripLift: 1.2, pullSpeed: 2.2, sinkSpeed: 1.6, consumeDepth: 1.4, zoneRadius: 4.8, wellDepth: 3.4, throat: 0.22 })) assert.equal(s[k], v, k);
  const mats = src('materials/codex/DarkMatterWellMaterials.js');
  assert.match(mats, /float dOut = dFloor - uDepthBias;/);
  // the swallow's own front still runs to the eye; only the drawn wall stops short
  assert.match(src(ABILITY.darkwell), /this\._front = lerp\(1, 0\.03, Easing\.inOutQuad\(sw\)\);/);
});
