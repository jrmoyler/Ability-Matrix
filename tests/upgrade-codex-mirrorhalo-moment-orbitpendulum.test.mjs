import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const src = (p) => readFileSync(path.join(root, 'packs/sandbox/src', p), 'utf8');
const config = async (id) => (await import(pathToFileURL(path.join(root, `packs/sandbox/src/config/codex/${id}.js`)).href)).default;

const ABILITY = {
  mirrorhalo: 'abilities/codex/MirrorHaloAbility.js',
  moment: 'abilities/codex/MomentSwingAbility.js',
  orbitpendulum: 'abilities/codex/OrbitPendulumAbility.js'
};

const NEW = {
  mirrorhalo: ['shardHeight', 'shardSpin', 'shardArc', 'centreHeight', 'centreWidth', 'ringPanels', 'panelHeight', 'panelFill', 'lockFill', 'ringSpread', 'ringWobble', 'ringWalk', 'riseTime', 'riseStagger', 'convergeFrom', 'convergeTo', 'leanIn', 'lockSpin', 'lockPulse', 'lockShake', 'lockLight', 'crackFrom', 'fallFrom', 'fallStagger', 'fallTime', 'fallChips', 'mirrorRough', 'mirrorMetal', 'mirrorRim', 'mirrorReflect', 'mirrorSweep', 'mirrorStreak', 'mirrorFrame', 'crackGlow', 'colorMirror', 'colorMirrorSky', 'colorMirrorFloor', 'colorMirrorRim', 'colorCrack', 'poolReach', 'poolOpacity', 'poolGlow', 'poolCracks', 'colorPoolDeep'],
  moment: ['maulScale', 'flightHeight', 'flightArc', 'flightTurns', 'plantTilt', 'plantSink', 'rockAmp', 'rockRate', 'rockDamp', 'rockDust', 'sinkFrom', 'sinkOut', 'maulGlow', 'maulRim', 'maulRough', 'maulMetal', 'maulHeatFlight', 'maulHeatSlam', 'maulCool', 'colorMaulIron', 'colorMaulHot', 'craterRadius', 'craterOpen', 'craterOpacity', 'craterGlow', 'craterCracks', 'colorCraterDeep'],
  orbitpendulum: ['massScale', 'flightTether', 'flightHeight', 'flightSpin', 'anchorHeight', 'anchorRise', 'orbitReach', 'orbitTilt', 'orbitDrop', 'orbitTurns', 'chainLinks', 'chainSag', 'chainLength', 'releaseSpeed', 'releaseLift', 'releaseGravity', 'bounce', 'rollFriction', 'rollDust', 'rollMarkSpacing', 'sinkFrom', 'sinkOut', 'massGlow', 'massRim', 'massRough', 'massMetal', 'massHeatSpin', 'massCool', 'colorMass', 'colorChain', 'colorMassRim', 'colorMassHot', 'floorReach', 'floorOpacity', 'floorGlow', 'floorArms', 'colorFloorScore', 'colorFloorDeep']
};

// Hit rules and timing that set when hits happen: presentation-only upgrade.
const PINNED = {
  mirrorhalo: { range: 18, minRange: 2, speed: 28.8, lifetime: 2.2, impactTime: 1.25, fadeTime: 1.25, zoneRadius: 4.7, hitRadius: 4.4, hitImpulse: 7.6, hitLift: 3.2, hitSpin: 2.4 },
  moment: { range: 18, minRange: 2, speed: 29.7, lifetime: 2, impactTime: 1.15, fadeTime: 1.25, hitRadius: 1.15, hitImpulse: 11.9, hitLift: 3.2, hitSpin: 2.4 },
  orbitpendulum: { range: 18, minRange: 2, speed: 45, lifetime: 2.2, impactTime: 1.25, fadeTime: 1.25, hitRadius: 1.15 }
};

for (const [id, keys] of Object.entries(NEW)) {
  test(`${id}: every new presentation key has a default and a live editor control`, async () => {
    const spec = await config(id);
    const ability = src(ABILITY[id]);
    for (const key of keys) {
      assert.ok(key in spec.settings, `${id}.${key} default`);
      assert.match(ability, new RegExp(`['"]${key}['"]`), `${id}.${key} editor control`);
    }
  });

  test(`${id}: hit rules and timing unchanged, template layers off, flash local`, async () => {
    const s = (await config(id)).settings;
    for (const [k, v] of Object.entries(PINNED[id])) assert.equal(s[k], v, k);
    for (const k of ['heroOpacity', 'bodyOpacity', 'voiceOpacity', 'detailCount']) assert.equal(s[k], 0, k);
    assert.ok(s.impactFlash <= 0.06, 'no full-frame flash');
    const ability = src(ABILITY[id]);
    // The template hit path is still the only one.
    assert.match(ability, /get handlesOwnHits\(\) \{\n    return true;/);
    assert.equal((ability.match(/\.kill\(/g) || []).length, 1, 'one kill call, the template blow');
  });

  test(`${id}: the hero is a lit, shadow-casting solid on the world layer`, () => {
    const ability = src(ABILITY[id]);
    assert.match(ability, /layers\.set\(LAYER\.WORLD\)/);
    assert.match(ability, /castShadow = true/);
  });
}

test('line casts: no template wake arc', async () => {
  for (const id of ['moment', 'orbitpendulum']) {
    const s = (await config(id)).settings;
    assert.equal(s.wakeSpacing, 0, `${id} wakeSpacing`);
    assert.equal(s.trailOpacity, 0, `${id} trail`);
    assert.equal(s.lensWarp, 0, `${id} lens`);
  }
});

test('generated geometry modules are untouched (geometry lives in the abilities)', () => {
  for (const name of ['MirrorHalo', 'MomentSwing', 'OrbitPendulum']) {
    const geo = src(`assets/codex/${name}Geometry.js`);
    assert.doesNotMatch(geo, /upgrade pass/i, name);
  }
});
