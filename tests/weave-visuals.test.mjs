import test from 'node:test';
import assert from 'node:assert/strict';
import { Scene } from 'three';
import { CombatStateManager } from '../packs/sandbox/src/combat/ucsm/CombatStateManager.js';
import { MechanicSystems } from '../packs/sandbox/src/combat/ucsm/mechanics/MechanicSystems.js';
import { MechanicPresentation } from '../packs/sandbox/src/combat/ucsm/mechanics/MechanicPresentation.js';
import { WEAVE_VARIANTS } from '../packs/sandbox/src/combat/ucsm/mechanics/WeaveVariants.js';
const make = () => {
 const m=new CombatStateManager(); m.upsertEntity({id:'caster',teamId:'player',position:[0,0,0],health:10});
 m.upsertEntity({id:'enemy',teamId:'enemy',position:[5,0,0],health:10});
 m.upsertEntity({id:'other',teamId:'enemy',position:[5,0,2],health:10});
 const s=new MechanicSystems(m), scene=new Scene(), v=new MechanicPresentation(scene,s);
 return {m,s,v,scene};
};
const meshes = (g) => {const out=[];g.traverse(n=>{if(n.isMesh)out.push(n);});return out;};
test('five weave links have distinct finite bounded layouts with a fixed mesh budget', () => {
 const {v}=make(), signatures=[];
 for(const p of WEAVE_VARIANTS){
  const g=v.build('link',{uid:p.uid,shape:{kind:'capsule',ax:2,az:4,bx:12,bz:4,r:p.width}}), ms=meshes(g);
  assert.ok(ms.length <= 20 && ms.length >= 10,p.name);
  for(const mesh of ms){assert.ok(mesh.position.toArray().every(Number.isFinite));assert.ok(mesh.scale.toArray().every(Number.isFinite));assert.ok(Math.abs(mesh.position.z-4)<=p.width,p.name);}
  signatures.push(JSON.stringify(ms.map(n=>[n.geometry.type,n.position.toArray(),n.scale.toArray()])));
 }
 assert.equal(new Set(signatures).size,5);v.dispose();
});
test('link markers and anchor details animate on combat ticks, remain fixed with reduced motion, and clear', () => {
 const run=(reduced)=>{
  const {m,s,v,scene}=make();v.reducedMotion=reduced;
  const p=WEAVE_VARIANTS.find(x=>x.behavior==='draft');
  s.weave.activate({id:'a',uid:p.uid,family:'weave',ownerId:'caster',position:[2,0,4],direction:[0,0,1]});
  s.weave.activate({id:'b',uid:p.uid,family:'weave',ownerId:'caster',position:[12,0,4],direction:[0,0,1]});
  m.advance();v.update();
  const link=v.items.get('a:b'),anchor=v.items.get('a');
  let marker,spinner;link.g.traverse(n=>{if(n.userData.weaveSlide&&!marker)marker=n;});anchor.g.traverse(n=>{if(n.userData.weaveSpin&&!spinner)spinner=n;});
  assert.ok(marker&&spinner);assert.deepEqual(link.g.scale.toArray(),[1,1,1]);
  const before=marker.position.toArray(), rotation=spinner.rotation.z;
  m.tick+=15;v.update();
  if(reduced){assert.deepEqual(marker.position.toArray(),before);assert.equal(spinner.rotation.z,rotation);}
  else {assert.notDeepEqual(marker.position.toArray(),before);assert.notEqual(spinner.rotation.z,rotation);}
  s.cancel('caster');v.update();assert.equal(v.items.has('a:b'),false);v.dispose();assert.equal(scene.children.length,0);
 };
 run(false);run(true);
});
test('chain and flood cues carry resolved spatial data; break, expiry and active cues stay bounded and dispose', () => {
 const {m,s,v,scene}=make(),p=WEAVE_VARIANTS.find(x=>x.behavior==='chain');
 for(const [id,pos] of [['a',[1,0,0]],['b',[9,0,0]]])s.weave.activate({id,uid:p.uid,family:'weave',ownerId:'caster',position:pos,direction:[0,0,1]});
 m.advance();const chain=m.cues.find(c=>c.weaveEffect==='chain');assert.deepEqual(chain.arcTargets,[[5,0,2]]);
 const chainGeometry=v.build('weave-burst',chain);assert.ok(meshes(chainGeometry).length>=6);
 const shatter=v.build('weave-burst',{uid:WEAVE_VARIANTS.find(x=>x.behavior==='shatter').uid,position:[0,0,0],weaveEffect:'shatter',radius:3});
 assert.ok(meshes(shatter).some(n=>n.geometry.type==='TorusGeometry' && n.scale.x===3), 'shatter ring matches its gameplay radius');
 for(let i=0;i<40;i++)v.cue({kind:'mechanic',phase:'anchor-break',id:`test:${i}`,uid:p.uid,ownerId:'caster',position:[0,0,0],tick:i});
 assert.ok(v.effects.length<=32); assert.ok(scene.children.length<=32);
 const a=m.anchors.get('a');a.expiresTick=m.tick;m.advance();assert.ok(m.cues.some(c=>c.phase==='anchor-expire'&&c.id==='a'));
 v.dispose();assert.equal(scene.children.length,0);
 const next=make(),w=WEAVE_VARIANTS.find(x=>x.behavior==='flood');
 next.m.setPosition('enemy',5,0,2);next.m.setPosition('other',0,0,15);
 for(const [id,pos] of [['x',[1,0,0]],['y',[9,0,0]],['z',[5,0,8]]])next.s.weave.activate({id,uid:w.uid,family:'weave',ownerId:'caster',position:pos,direction:[0,0,1]});
 next.m.advance();const flood=next.m.cues.find(c=>c.weaveEffect==='flood');assert.deepEqual(flood.triangle,[[1,0,0],[9,0,0],[5,0,8]]);assert.ok(meshes(next.v.build('weave-burst',flood)).length>=10);next.v.dispose();
});
