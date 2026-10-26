import test from 'node:test';import assert from 'node:assert/strict';import { Vector3 } from 'three';
import {settings} from '../../packs/sandbox/src/config/settings.js';import config from '../../packs/sandbox/src/abilities/expansion-2026/momentum-ledger/config.js';
import {Ability,ID} from '../../packs/sandbox/src/abilities/expansion-2026/momentum-ledger/index.js';
settings[ID]=structuredClone(config.settings);
function run(step, teleport=false){const hits=[], character={position:new Vector3()}, target={position:new Vector3(5,0,0),kill:(x,z,f)=>{hits.push({...f});return true;}};
const a=new Ability({character,lights:{acquire:()=>({}),release:()=>{},set:()=>{}},dummies:{findTargets:(x,z,r,out)=>{assert.equal(x,5);assert.equal(z,0);out.length=0;out.push(target);return out;}}});a.spawn(new Vector3(),new Vector3(1,0,0),5);
for(let i=0;i<180;i++){if(i<100)character.position.x+=teleport?1:step;a.update(1/60);}return {a,hits};}
test('distance walked increases the deferred force while teleports do not inflate the bank',()=>{const still=run(0), walked=run(.08), teleported=run(0,true);assert.equal(still.hits.length,1);assert.equal(walked.hits.length,1);assert.ok(walked.hits[0].impulse>still.hits[0].impulse);assert.equal(teleported.hits[0].impulse,still.hits[0].impulse);for(const x of [still,walked,teleported]){x.a.destroy();x.a.dispose();}});
test('bounded finite glyphs and resources are disposed once',()=>{const {a}=run(0);assert.equal(a.vectors.count,32);let count=0;for(const x of a.resources)x.addEventListener('dispose',()=>count++);a.dispose();a.dispose();assert.equal(count,a.resources.length);});
