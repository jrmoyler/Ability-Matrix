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

test('zero duration updates never commit pending combat actions',()=>{
 for(const C of [CinderCrownAbility,GlacierBellAbility]){
  const {a,hits}=fixture(C);run(a,.25);assert.equal(a.phase,'impact');
  a.impactTime=a.impactDuration*.9;const before=hits.length;
  for(let i=0;i<5;i++)a.update(0);
  assert.equal(hits.length,before);if(a.fire)assert.equal(a.second,false);
  a.update(1/60);assert.ok(hits.length>before);a.destroy();a.dispose();
 }
});

test('travel only shows the landing telegraph and reveals the authored effect at impact',()=>{
 for(const C of [CinderCrownAbility,GlacierBellAbility]){
  const {a}=fixture(C);assert.equal(a.phase,'travel');assert.equal(a.surface.visible,false);assert.equal(a.detail.points.visible,false);assert.equal(a.authored.stage.visible,false);assert.equal(a.monument.group.visible,false);assert.equal(a.ring.scale.x,a.config.zoneRadius);
  run(a,.25);assert.equal(a.phase,'impact');assert.equal(a.surface.visible,true);assert.equal(a.authored.stage.visible,true);assert.equal(a.monument.group.visible,true);
  a.destroy();a.dispose();
 }
});

test('coal heart and frost bell are distinct finite surfaces with phase-driven light and live controls',()=>{
 const heart=fixture(CinderCrownAbility),bell=fixture(GlacierBellAbility);
 try{
  const fire=heart.a,ice=bell.a;
  assert.notEqual(fire.monument.solid.geometry.attributes.position.count,ice.monument.solid.geometry.attributes.position.count);
  for(const a of [fire,ice])for(const n of a.monument.solid.geometry.attributes.position.array)assert.ok(Number.isFinite(n));
  run(ice,.3);const early=ice.monument.shafts.material.uniforms.power.value;run(ice,.6);assert.ok(ice.monument.shafts.material.uniforms.power.value>early);
  run(fire,.25);const impact=fire.monument.shafts.material.uniforms.power.value;run(fire,.3);assert.ok(fire.monument.shafts.material.uniforms.power.value<impact);
  settings[CINDER_CONFIG.id].monumentScale=2;settings[CINDER_CONFIG.id].monumentGlow=2;fire.update(1/60);
  assert.equal(fire.monument.group.scale.x,2);assert.ok(fire.monument.solid.material.emissiveIntensity>=.8);
 }finally{
  settings[CINDER_CONFIG.id].monumentScale=CINDER_CONFIG.settings.monumentScale;settings[CINDER_CONFIG.id].monumentGlow=CINDER_CONFIG.settings.monumentGlow;
  for(const a of [heart.a,bell.a]){a.destroy();a.dispose();}
 }
});

test('delivery follows front, maintains bounded trail, pauses cleanly, and resets on impact and reuse',()=>{
 for(const [C,c] of [[CinderCrownAbility,CINDER_CONFIG],[GlacierBellAbility,GLACIER_CONFIG]]){
  const speed=settings[c.id].speed;settings[c.id].speed=1;
  try{
   const {a}=fixture(C);assert.equal(a.delivery.group.visible,true);assert.equal(a.delivery.count,0);
   for(let i=0;i<80;i++)a.update(1/60);
   assert.ok(a.delivery.group.position.x>0&&a.delivery.group.position.x<5);
   assert.equal(a.delivery.count,48);assert.equal(a.delivery.line.geometry.drawRange.count,48);
   const before=a.delivery.count;a.update(0);assert.equal(a.delivery.count,before);
   for(const x of a.delivery.mesh.geometry.attributes.position.array)assert.ok(Number.isFinite(x));
   a.update(5);assert.equal(a.phase,'impact');assert.equal(a.delivery.group.visible,false);assert.equal(a.delivery.count,0);
   a.destroy();a.spawn(new Vector3(),new Vector3(1,0,0),5);assert.equal(a.delivery.group.visible,true);assert.equal(a.delivery.count,0);a.destroy();a.dispose();
  }finally{settings[c.id].speed=speed;}
 }
});

test('impact fragments follow the actual pulse and wave and remain bounded',()=>{
 for(const [C,c] of [[CinderCrownAbility,CINDER_CONFIG],[GlacierBellAbility,GLACIER_CONFIG]]){
  const {a}=fixture(C);assert.equal(a.fragments.group.visible,false);run(a,.35);
  assert.equal(a.fragments.group.visible,true);assert.equal(a.fragments.mesh.count,24);
  const array=a.fragments.mesh.instanceMatrix.array;for(const x of array)assert.ok(Number.isFinite(x));
  const r=Math.hypot(array[12],array[14]);
  if(!a.fire)assert.ok(Math.abs(r-a.config.zoneRadius*a.impactTime/a.impactDuration)<1e-5);
  else assert.ok(r<=a.config.zoneRadius);
  settings[c.id].fragmentGlow=2;settings[c.id].fragmentScale=1.5;a.update(1/60);
  assert.equal(a.fragments.mesh.material.uniforms.glow.value,2);
  a.destroy();a.dispose();settings[c.id].fragmentGlow=c.settings.fragmentGlow;settings[c.id].fragmentScale=c.settings.fragmentScale;
 }
});

test('contacts appear only on successful targets, use local position, pause and clear on reuse',()=>{
 for(const C of [CinderCrownAbility,GlacierBellAbility]){
  const {a}=fixture(C);run(a,a.fire?.3:.65);const contact=a.contacts.states.find(s=>s.live);assert.ok(contact);assert.ok([1,3].includes(contact.x));assert.equal(contact.z,0);
  const age=contact.age;a.update(0);assert.equal(contact.age,age);assert.ok(a.contacts.mesh.count>0&&a.contacts.mesh.count<=16);
  for(const x of a.contacts.mesh.geometry.attributes.position.array)assert.ok(Number.isFinite(x));
  a.destroy();assert.equal(a.contacts.mesh.count,0);assert.ok(a.contacts.states.every(s=>!s.live));a.spawn(new Vector3(),new Vector3(1,0,0),5);assert.equal(a.contacts.mesh.count,0);a.destroy();a.dispose();
 }
 const a=new GlacierBellAbility({lights:{acquire:()=>({}),release(){},set(){}},dummies:{findTargets(x,z,r,out){out.length=0;out.push({position:new Vector3(5,0,0),kill:()=>false});return out;}}});
 a.spawn(new Vector3(),new Vector3(1,0,0),5);run(a,1);assert.ok(a.contacts.states.every(s=>!s.live));a.destroy();a.dispose();
});

test('distinct ground seals follow gameplay phase, actual radius and live editor settings',()=>{
 for(const [C,c] of [[CinderCrownAbility,CINDER_CONFIG],[GlacierBellAbility,GLACIER_CONFIG]]){
  const {a}=fixture(C);assert.equal(a.ground.visible,false);run(a,.6);
  assert.equal(a.ground.visible,true);assert.equal(a.ground.scale.x,a.config.zoneRadius);
  assert.ok(Math.abs(a.ground.material.uniforms.progress.value-a.impactTime/a.impactDuration)<1e-7);
  settings[c.id].groundColor='#123456';settings[c.id].groundGlow=2;settings[c.id].groundOpacity=.2;a.update(0);
  assert.equal(a.ground.material.uniforms.tint.value.getHexString(),'123456');assert.equal(a.ground.material.uniforms.glow.value,2);assert.equal(a.ground.material.uniforms.opacity.value,.2);
  a.destroy();a.dispose();settings[c.id].groundColor=c.settings.groundColor;settings[c.id].groundGlow=c.settings.groundGlow;settings[c.id].groundOpacity=c.settings.groundOpacity;
 }
});

test('delivery arcs follow cast progress and editor height without changing hit position',()=>{
 for(const [C,c] of [[CinderCrownAbility,CINDER_CONFIG],[GlacierBellAbility,GLACIER_CONFIG]]){
  const originalSpeed=settings[c.id].speed,originalArc=settings[c.id].deliveryArc;
  settings[c.id].speed=1;settings[c.id].deliveryArc=2;
  try{
   const {a}=fixture(C);run(a,2);assert.equal(a.phase,'travel');const q=a.u;
   assert.ok(Math.abs(a.delivery.group.position.y-8*q*(1-q))<1e-7);
   assert.ok(Math.abs(a.delivery.group.position.x-a.length*q)<1e-7);
   const attr=a.delivery.line.geometry.attributes.position;assert.ok(Math.abs(attr.getY(a.delivery.count-1)-(a.delivery.group.position.y+.25))<1e-5);
   assert.deepEqual(a.target.toArray(),[5,0,0]);
   a.destroy();a.dispose();
  }finally{settings[c.id].speed=originalSpeed;settings[c.id].deliveryArc=originalArc;}
 }
});
