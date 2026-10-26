import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { Scene, Vector3 } from 'three';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';
import { Dummy } from '../../packs/sandbox/src/combat/Dummy.js';
import { DummyField } from '../../packs/sandbox/src/combat/DummyField.js';
import { settings } from '../../packs/sandbox/src/config/settings.js';
import { PredatoryCanopyAbility, ID as canopyId } from '../../packs/sandbox/src/abilities/expansion-2026/nature/PredatoryCanopyAbility.js';
import { CelestialCartographyAbility, ID as skyId } from '../../packs/sandbox/src/abilities/expansion-2026/cosmic/CelestialCartographyAbility.js';
import canopyConfig from '../../packs/sandbox/src/abilities/expansion-2026/nature/predatory-canopy.config.js';
import skyConfig from '../../packs/sandbox/src/abilities/expansion-2026/cosmic/celestial-cartography.config.js';

settings[canopyId]=structuredClone(canopyConfig.settings);
settings[skyId]=structuredClone(skyConfig.settings);
const bytes=readFileSync(new URL('../../packs/sandbox/public/models/dummy.fbx',import.meta.url));
const source=new FBXLoader().parse(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');
for(const [name, Ability, marked] of [
  ['canopy',PredatoryCanopyAbility,a=>a._triggerAt>=0],
  ['cartography',CelestialCartographyAbility,a=>a._markedAt>=0],
]) test(`${name} cannot strike the next life of a real pooled target`,()=>{
  const env={registerShadowCasterWithPatch(){}};
  const dummy=new Dummy({source,clip:source.animations[0],scale:.01,offset:{x:0,y:0,z:0},forwardYaw:0,environment:env});
  dummy.root.position.set(0,0,5);dummy.root.updateWorldMatrix(true,true);
  const field=new DummyField(env);field.slots.push({dummy,wait:0});
  const ability=new Ability({scene:new Scene(),dummies:field,lights:{acquire:()=>({}),set(){},release(){}}});
  ability.spawn(new Vector3(),new Vector3(0,0,1),5);
  for(let i=0;i<180&&!marked(ability);i++)ability.update(1/60);
  assert.ok(marked(ability),'original life was marked');
  const before=field.standGeneration(dummy);field.reset();assert.equal(field.standGeneration(dummy),before+1);
  // Return the reused body to the exact marked location, to distinguish the
  // generation check from ordinary distance-based evasion.
  dummy.root.position.set(0,0,5);dummy.root.updateWorldMatrix(true,true);
  for(let i=0;i<120;i++)ability.update(1/60);
  assert.equal(dummy.alive,true);
  ability.destroy();ability.dispose();dummy.dispose();
});
