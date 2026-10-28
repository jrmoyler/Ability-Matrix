import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { Box3, Texture, Vector3 } from 'three';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';

import { WizardBody } from '../packs/sandbox/src/combat/duel/WizardBody.js';
import { DummyField } from '../packs/sandbox/src/combat/DummyField.js';
import { DuelRound } from '../packs/sandbox/src/combat/duel/DuelReferee.js';
import { settings } from '../packs/sandbox/src/config/settings.js';

const env = { registerShadowCasterWithPatch() {} };
const parse = (name) => {
  const bytes = readFileSync(new URL(`../packs/sandbox/public/models/${name}`, import.meta.url));
  return new FBXLoader().parse(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), '');
};

/** What `loadWizardAssets` hands over, built from the same files. */
function wizardAssets() {
  const source = parse('Idle.fbx');
  const box = new Box3().setFromObject(source);
  const size = box.getSize(new Vector3());
  const clips = {};
  for (const name of ['cast1', 'cast2', 'cast3']) {
    const clip = parse(`${name}.fbx`).animations[0];
    clip.name = name;
    clips[name] = clip;
  }
  return { source, idle: source.animations[0], clips, scale: 1.86 / size.y, offset: { x: 0, y: 0, z: 0 }, forwardYaw: 0, skin: new Texture(), height: 1.86 };
}

test('the original wizard rig carries its idle and binds all three cast gestures', () => {
  const assets = wizardAssets();
  assert.ok(assets.idle, 'Idle.fbx ships its breathing idle');
  const wizard = new WizardBody(assets, env);
  assert.equal(wizard.casts.size, 3);
  const bones = new Set();
  wizard.model.traverse((n) => n.isBone && bones.add(n.name));
  for (const action of wizard.casts.values()) {
    assert.ok(action.getClip().tracks.some((t) => bones.has(t.name.split('.')[0])), 'gesture binds to the wizard skeleton by name');
  }
  wizard.place(0, 5, Math.PI);
  wizard.playCast('cast2');
  assert.equal(wizard.isCasting, true);
  wizard.update(0.2);
  const hands = wizard.handsPoint(new Vector3());
  assert.ok(Number.isFinite(hands.y) && hands.y > 0.3, 'casts can leave from its hands');
});

test('kill spends HP until the lethal blow, which is a real ragdoll fall; its own casts never hit it', () => {
  const wizard = new WizardBody(wizardAssets(), env);
  wizard.place(0, 6, Math.PI);
  const round = new DuelRound({ wizardHp: 25, grace: 0.4 });
  wizard.onStruck = () => {
    const r = round.hit('wizard', 10);
    return r.lethal ? 'lethal' : r.landed ? 'hurt' : 'ignore';
  };
  const mine = { cpu: true };
  wizard.owns = (ability) => ability === mine;

  const field = new DummyField(env);
  field.addBody(wizard);
  const line = (owner) => Object.assign(owner, { isActive: true, element: 'tempest', origin: { x: 0, z: 0 }, position: { x: 0, z: 8 }, direction: { x: 0, z: 1 }, u: 1 });
  field._hitLine(line(mine), settings.dummies.hit);
  assert.equal(round.hp.wizard, 25, 'the wizard is immune to its own casts');

  const theirs = line({});
  field._hitLine(theirs, settings.dummies.hit);
  assert.equal(round.hp.wizard, 15);
  assert.equal(wizard.alive, true, 'a blow it survives does not fell it');
  field._hitLine(theirs, settings.dummies.hit);
  assert.equal(round.hp.wizard, 15, 'a cast overlapping it next frame is the same blow');
  round.step(0.5);
  assert.equal(wizard.freeze(), false, 'a freeze is a blow, never a statue');
  assert.equal(round.hp.wizard, 5);
  round.step(0.5);
  assert.deepEqual(field.findTargets(0, 6, 1, []), [wizard]);
  field._hitLine(theirs, settings.dummies.hit);
  assert.equal(round.over, true);
  assert.equal(wizard.alive, false);
  assert.ok(wizard.parts[0].ragdoll?.valid, 'the lethal blow is a ragdoll fall');
  // A rematch stands it up whole.
  wizard.place(0, 6, Math.PI);
  assert.equal(wizard.alive, true);
  assert.equal(wizard.parts[0].ragdoll, null);
});
