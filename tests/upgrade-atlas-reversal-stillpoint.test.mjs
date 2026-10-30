import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import reversal from '../packs/sandbox/src/config/atlas/reversal.js';
import stillpoint from '../packs/sandbox/src/config/atlas/stillpoint.js';
import * as reversalMats from '../packs/sandbox/src/materials/atlas/AegisReversalMaterials.js';
import * as stillMats from '../packs/sandbox/src/materials/atlas/StillpointMaterials.js';

const src = (p) => readFileSync(new URL(`../packs/sandbox/src/${p}`, import.meta.url), 'utf8');

const NEW_REVERSAL = ['rimWidth', 'colorBoltPale', 'colorBoltDeep', 'boltYaw', 'muzzleSparks', 'colorConeDeep', 'coneDeep',
  'wallDeep', 'releaseBurst', 'sealRadius', 'sealGlow', 'sealDeep', 'sealRunes', 'sealSpin', 'sealTelegraph',
  'colorSealDeep', 'colorSeal', 'colorSealHot', 'wallCrest', 'wallGrow', 'wallLinger', 'scarGlow'];
const NEW_STILLPOINT = ['colorPanelDeep', 'panelOpacity', 'panelGlow', 'panelGlint', 'sweepSpeed', 'sweepHeld', 'sweepGlow',
  'sweepTrail', 'floorDeep', 'floorTelegraph', 'colorFloorDeep', 'seedSize', 'seedGlow', 'seedTrailSize',
  'panelSaturation', 'panelLightCap', 'frameDeep'];

test('reversal: identity and hit settings preserved, new presentation keys are live sliders', () => {
  assert.equal(reversal.id, 'reversal');
  assert.equal(reversal.meta.cast, 'zone');
  assert.deepEqual(reversal.settings.hit, { impulse: 11.0, lift: 4.5, spin: 1.8 });
  assert.equal(reversal.settings.coneAngle, 0.62);
  assert.equal(reversal.settings.sweepTime, 0.6);
  assert.equal(reversal.settings.coneReach, 2.2);
  const editor = src('abilities/atlas/AegisReversalAbility.js');
  for (const key of NEW_REVERSAL) {
    assert.ok(key in reversal.settings, `config ${key}`);
    assert.ok(editor.includes(`'${key}'`), `editor ${key}`);
  }
  assert.equal(typeof reversalMats.createReversalSealMaterial, 'function');
});

test('stillpoint: identity and hit settings preserved, new presentation keys are live sliders', () => {
  assert.equal(stillpoint.id, 'stillpoint');
  assert.equal(stillpoint.meta.cast, 'zone');
  assert.deepEqual(stillpoint.settings.hit, { impulse: 10.0, lift: 3.5, spin: 2.6 });
  assert.equal(stillpoint.settings.killReach, 9.0);
  assert.equal(stillpoint.settings.fragmentHitRadius, 0.55);
  assert.equal(stillpoint.settings.holdTime, 2.2);
  const editor = src('abilities/atlas/StillpointAbility.js');
  for (const key of NEW_STILLPOINT) {
    assert.ok(key in stillpoint.settings, `config ${key}`);
    assert.ok(editor.includes(`'${key}'`), `editor ${key}`);
  }
  assert.equal(typeof stillMats.createStillpointSeedMaterial, 'function');
});

test('four-stop ramps: every new deep stop is genuinely dark', () => {
  const lum = (hex) => {
    const n = parseInt(hex.slice(1), 16);
    return (0.2126 * (n >> 16) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255)) / 255;
  };
  for (const hex of [reversal.settings.colorSteelDeep, reversal.settings.colorBoltDeep, reversal.settings.colorConeDeep,
    reversal.settings.colorSealDeep, stillpoint.settings.colorPanelDeep, stillpoint.settings.colorFloorDeep])
    assert.ok(lum(hex) < 0.08, hex);
});
