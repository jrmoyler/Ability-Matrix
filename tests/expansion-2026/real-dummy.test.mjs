import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { Vector3 } from 'three';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';
import { Dummy } from '../../packs/sandbox/src/combat/Dummy.js';
import { DummyField } from '../../packs/sandbox/src/combat/DummyField.js';
import { settings } from '../../packs/sandbox/src/config/settings.js';
import { BATCH_C } from '../../packs/sandbox/src/abilities/expansion-2026/batch-c.js';

test('five targeted candidates strike the actual animated sandbox dummy', () => {
  const bytes = readFileSync(new URL('../../packs/sandbox/public/models/dummy.fbx', import.meta.url));
  const root = new FBXLoader().parse(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), '');
  const ids = ['borrowedTomorrow', 'momentumLedger', 'spellwrightsGambit', 'mirageProcession', 'vectorBreakwater'];
  for (const id of ids) {
    const { module: { Ability, config } } = BATCH_C.find(({ module }) => module.ID === id);
    settings[id] = structuredClone(config.settings);
    const env = { registerShadowCasterWithPatch() {} };
    const target = new Dummy({ source: root, clip: root.animations[0], scale: .01, offset: {x:0,y:0,z:0}, forwardYaw: 0, environment: env });
    target.root.position.set(0, 0, 5);
    target.root.updateWorldMatrix(true, true);
    const field = new DummyField(env);
    field.slots.push({ dummy: target, wait: 0 });
    const character = { position: new Vector3() };
    const ability = new Ability({ dummies: field, character, lights: { acquire: () => ({}), set() {}, release() {} } });
    ability.spawn(new Vector3(), new Vector3(0, 0, 1), 5);
    for (let i = 0; i < 240 && target.alive; i++) {
      if (id === 'momentumLedger') character.position.x += .02;
      ability.update(1 / 60);
      target.update(1 / 60);
    }
    assert.equal(target.alive, false, `${id} reaches an actual sandbox actor`);
    ability.destroy(); ability.dispose(); target.dispose(); delete settings[id];
  }
});
