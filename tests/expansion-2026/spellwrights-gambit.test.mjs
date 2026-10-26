import test from 'node:test';
import assert from 'node:assert/strict';
import { Vector3 } from 'three';
import { settings } from '../../packs/sandbox/src/config/settings.js';
import config from '../../packs/sandbox/src/abilities/expansion-2026/spellwrights-gambit/config.js';
import {
  Ability,
  ID,
} from '../../packs/sandbox/src/abilities/expansion-2026/spellwrights-gambit/index.js';
settings[ID] = structuredClone(config.settings);
function setup() {
  const hits = [];
  const a = [
    {
      position: new Vector3(5, 0, 3.8),
      kill: () => {
        hits.push('ring');
        return true;
      },
    },
    {
      position: new Vector3(6, 0, 0),
      kill: () => {
        hits.push('line');
        return true;
      },
    },
    {
      position: new Vector3(7, 0, 2),
      kill: () => {
        hits.push('interior');
        return true;
      },
    },
  ];
  const ability = new Ability({
    lights: { acquire: () => ({}), release: () => {}, set: () => {} },
    dummies: {
      findTargets: (x, z, r, out) => {
        out.length = 0;
        out.push(...a);
        return out;
      },
    },
  });
  ability.spawn(new Vector3(), new Vector3(1, 0, 0), 5);
  return { ability, hits };
}
test('composed ring then line release separately and enforce their selected footprints', () => {
  const { ability, hits } = setup();
  for (let i = 0; i < 70; i++) ability.update(1 / 60);
  assert.deepEqual(hits, ['ring']);
  assert.equal(ability.releases[0].kind, 'ring');
  assert.equal(ability.releases[0].group.visible, true);
  for (let i = 0; i < 40; i++) ability.update(1 / 60);
  assert.deepEqual(hits, ['ring', 'line']);
  assert.equal(ability.releases[1].kind, 'line');
  assert.equal(ability.shapeRing.visible, false);
  assert.equal(ability.shapeLine.visible, false);
  assert.equal(ability.shapeBurst.visible, false);
  ability.destroy();
  ability.dispose();
});
test('shape indicators respond to live selection and all geometry is bounded and disposable', () => {
  const { ability } = setup();
  assert.equal(ability.shapeRing.visible, true);
  settings[ID].firstShape = 'burst';
  ability.update(0);
  assert.equal(ability.shapeBurst.visible, true);
  assert.equal(ability.shapeRing.visible, false);
  settings[ID].firstShape = 'ring';
  let disposed = 0;
  for (const r of ability.resources)
    r.addEventListener('dispose', () => disposed++);
  ability.destroy();
  ability.dispose();
  ability.dispose();
  assert.equal(disposed, ability.resources.length);
});
