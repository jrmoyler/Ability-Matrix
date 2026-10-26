import test from 'node:test';
import assert from 'node:assert/strict';
import { Vector3 } from 'three';
import { settings } from '../../packs/sandbox/src/config/settings.js';
import { CINDER_CONFIG, GLACIER_CONFIG, CinderCrownAbility, GlacierBellAbility } from '../../packs/sandbox/src/abilities/expansion-2026/dual-pulse/index.js';
for(const c of [CINDER_CONFIG,GLACIER_CONFIG])settings[c.id]=structuredClone(c.settings);
function fixture(Ability){
 const hits=[], targets=[1,3,5].map((x,i)=>({position:new Vector3(5+x,0,0),kill(dx,dz,force){hits.push({i,dx,dz,force});return true;}}));
 const a=new Ability({lights:{acquire:()=>({}),release(){},set(){}},dummies:{findTargets(x,z,r,out){out.length=0;for(const d of targets)if(Math.hypot(d.position.x-x,d.position.z-z)<=r)out.push(d);return out;}}});
 a.spawn(new Vector3(),new Vector3(1,0,0),5);return {a,hits};
}
function run(a,seconds){for(let i=0;i<seconds*60;i++)a.update(1/60);}
test('cinder crown pushes targets inside the field twice and resets on reuse',()=>{
 const {a,hits}=fixture(CinderCrownAbility);run(a,3);
 assert.deepEqual(hits.map(h=>h.i),[0,1,0,1]);assert.ok(hits.every(h=>h.dx===1&&h.dz===0&&h.force.impulse===CINDER_CONFIG.settings.impulse));
 a.destroy();a.spawn(new Vector3(),new Vector3(1,0,0),5);run(a,3);assert.equal(hits.length,8);a.destroy();a.dispose();
});
test('glacier bell catches each target once as its expanding radius reaches them',()=>{
 const {a,hits}=fixture(GlacierBellAbility);run(a,.6);assert.deepEqual(hits.map(h=>h.i),[0]);run(a,2);assert.deepEqual(hits.map(h=>h.i),[0,1]);
 a.destroy();a.spawn(new Vector3(),new Vector3(1,0,0),5);run(a,3);assert.deepEqual(hits.map(h=>h.i),[0,1,0,1]);
 let disposed=0;for(const r of a.resources)r.addEventListener('dispose',()=>disposed++);a.destroy();a.dispose();a.dispose();assert.equal(disposed,a.resources.length);
});
test('candidate shapes are finite and the visual ring tracks the hit radius',()=>{
 for(const C of [CinderCrownAbility,GlacierBellAbility]){const {a}=fixture(C);for(const v of a.surface.geometry.attributes.position.array)assert.ok(Number.isFinite(v));run(a,1);assert.ok(a.ring.scale.x<=a.config.zoneRadius);a.destroy();a.dispose();}
});

test('phase detail has distinct bounded geometry, 64 motes, and editor changes reach uniforms',()=>{
 for(const [C,c] of [[CinderCrownAbility,CINDER_CONFIG],[GlacierBellAbility,GLACIER_CONFIG]]){
  const {a}=fixture(C), detail=a.detail;
  assert.equal(detail.points.geometry.attributes.position.count,64);
  for(const v of detail.surface.geometry.attributes.position.array)assert.ok(Number.isFinite(v));
  const attr=detail.points.geometry.attributes.position;
  for(let i=0;i<attr.count;i++)assert.ok(Math.hypot(attr.getX(i),attr.getZ(i))<=1);
  settings[c.id].accentColor='#123456';a.update(1/60);assert.equal(detail.uniforms.tint.value.getHexString(),'123456');
  settings[c.id].accentColor=c.settings.accentColor;
  a.destroy();a.dispose();
 }
});

test('cinder emits two bounded particle bursts, glacier emits one, and reduced motion freezes shader clock',()=>{
 for(const [C,c,count] of [[CinderCrownAbility,CINDER_CONFIG,2],[GlacierBellAbility,GLACIER_CONFIG,1]]){
  const calls=[];const effect={setGradient(){},emit(n){calls.push(n);}};
  const a=new C({lights:{acquire:()=>({}),release(){},set(){}},particles:{get:()=>effect}});
  const prior=globalThis.matchMedia;globalThis.matchMedia=()=>({matches:true});
  try{a.spawn(new Vector3(),new Vector3(1,0,0),5);run(a,3);assert.equal(calls.length,count);assert.ok(calls.every(n=>n>=0&&n<=128));assert.equal(a.detail.uniforms.clock.value,0);a.destroy();a.dispose();}
  finally{if(prior)globalThis.matchMedia=prior;else delete globalThis.matchMedia;}
 }
});

test('authored frost lattice follows the same expanding radius used for hits',()=>{
 const {a,hits}=fixture(GlacierBellAbility);run(a,.6);
 assert.equal(a.phase,'impact');const expected=a.config.zoneRadius*a.impactTime/a.impactDuration;
 assert.ok(Math.abs(a.authored.stage.scale.x-expected)<1e-7);
 assert.deepEqual(hits.map(h=>h.i),[0]);
 const pos=a.authored.mesh.geometry.attributes.position;
 for(let i=0;i<pos.count;i++)assert.ok(Math.hypot(pos.getX(i),pos.getZ(i))<=1);
 a.destroy();a.dispose();
});

test('cinder second pulse control changes both the strike and crown energy timing',()=>{
 const original=settings[CINDER_CONFIG.id].secondPulse;settings[CINDER_CONFIG.id].secondPulse=.8;
 try{
  const {a,hits}=fixture(CinderCrownAbility);run(a,1.15);
  assert.equal(hits.length,2);assert.equal(a.second,false);
  run(a,.25);assert.equal(a.second,true);assert.equal(hits.length,4);
  assert.ok(a.authored.mesh.material.uniforms.energy.value>0);
  settings[CINDER_CONFIG.id].coreColor='#123456';settings[CINDER_CONFIG.id].detailHeight=1.5;a.update(1/60);
  assert.equal(a.authored.mesh.material.uniforms.tint.value.getHexString(),'123456');assert.equal(a.authored.stage.scale.y,1.5);
  a.destroy();a.dispose();
 }finally{settings[CINDER_CONFIG.id].secondPulse=original;settings[CINDER_CONFIG.id].coreColor=CINDER_CONFIG.settings.coreColor;settings[CINDER_CONFIG.id].detailHeight=CINDER_CONFIG.settings.detailHeight;}
});
