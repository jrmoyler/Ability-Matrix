import test from 'node:test';
import assert from 'node:assert/strict';
import { Vector3 } from 'three';
import { settings } from '../../packs/sandbox/src/config/settings.js';
import config from '../../packs/sandbox/src/abilities/expansion-2026/borrowed-tomorrow/config.js';
import { Ability, ID } from '../../packs/sandbox/src/abilities/expansion-2026/borrowed-tomorrow/index.js';
settings[ID] = structuredClone(config.settings);
const setup=()=>{
 const hits=[]; const target={position:new Vector3(10,0,0),kill:(x,z,force)=>{hits.push({...force,x,z});return true;}};
 const far={position:new Vector3(99,0,0),kill:()=>{throw Error('out of range');}};
 const ability=new Ability({lights:{acquire:()=>({}),release:()=>{},set:()=>{}},dummies:{findTargets:(x,z,r,out)=>{out.length=0;out.push(target,far);return out;}}});
 return {ability,hits};
};
test('Borrowed Tomorrow delays its one bounded strike until the clock debt matures, then resets on reuse',()=>{
 const {ability,hits}=setup();ability.spawn(new Vector3(),new Vector3(1,0,0),10);
 for(let i=0;i<45;i++)ability.update(1/60);
 assert.equal(hits.length,0);
 for(let i=0;i<75;i++)ability.update(1/60);
 assert.equal(hits.length,1);assert.equal(hits[0].impulse,config.settings.hitImpulse);
 for(let i=0;i<100;i++)ability.update(1/60);
 assert.equal(hits.length,1);assert.equal(ability.isFinished,true);
 ability.destroy(); ability.spawn(new Vector3(),new Vector3(1,0,0),10);
 for(let i=0;i<150;i++)ability.update(1/60);
 assert.equal(hits.length,2); ability.destroy();ability.dispose();
});
test('clock geometry and shader resources are finite, bounded, and disposed exactly once',()=>{
 const {ability}=setup();let meshes=0;ability.root.traverse((o)=>{if(o.isMesh){meshes++;let p=o.geometry.attributes.position;for(let i=0;i<p.count;i++)assert.ok(Number.isFinite(p.getX(i))&&Number.isFinite(p.getY(i))&&Number.isFinite(p.getZ(i)));}});
 assert.ok(meshes>=7);assert.equal(ability.shards.count,48);let count=0;for(const r of ability.resources)r.addEventListener('dispose',()=>count++);ability.dispose();ability.dispose();assert.equal(count,ability.resources.length);
});
