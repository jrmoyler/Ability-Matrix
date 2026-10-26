import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { Scene } from 'three';
import { createWeaveSurface, WEAVE_HERO_STYLES } from '../packs/sandbox/src/combat/ucsm/mechanics/WeaveHeroGeometry.js';
import { CombatStateManager } from '../packs/sandbox/src/combat/ucsm/CombatStateManager.js';
import { MechanicSystems } from '../packs/sandbox/src/combat/ucsm/mechanics/MechanicSystems.js';
import { MechanicPresentation } from '../packs/sandbox/src/combat/ucsm/mechanics/MechanicPresentation.js';
import { WEAVE_VARIANTS } from '../packs/sandbox/src/combat/ucsm/mechanics/WeaveVariants.js';

test('each weave has deterministic, distinct finite anchor and bounded link surfaces', () => {
 for(const role of ['anchor','link']) {
  const seen=new Set();
  for(const style of WEAVE_HERO_STYLES){
   const g=createWeaveSurface(style,role), p=g.getAttribute('position'), uv=g.getAttribute('uv');
   assert.ok(p.count>=100 && p.count<=300,`${style} ${role}`);assert.equal(p.count,uv.count);
   assert.ok([...p.array].every(Number.isFinite));assert.ok([...uv.array].every(x=>x>=0&&x<=1));
   assert.ok([...g.index.array].every(i=>i<p.count));
   if(role==='link') for(let i=0;i<p.count;i++) assert.ok(Math.abs(p.getX(i))+0.04<=0.625,style);
   const hash=createHash('sha256').update(Buffer.from(p.array.buffer)).digest('hex');
   assert.ok(!seen.has(hash),style);seen.add(hash);
   const copy=createWeaveSurface(style,role);assert.deepEqual(p.array,copy.getAttribute('position').array);g.dispose();copy.dispose();
  }
 }
 assert.throws(()=>createWeaveSurface('unknown','anchor'),/Unknown weave surface/);
});

test('weave surfaces share a clock, stay within link width, obey reduced motion and dispose', () => {
 const m=new CombatStateManager();m.upsertEntity({id:'caster',teamId:'player'});
 const s=new MechanicSystems(m),scene=new Scene(),v=new MechanicPresentation(scene,s);
 const p=WEAVE_VARIANTS.find(x=>x.element==='storm');
 const anchor=v.add('a','anchor',{uid:p.uid,position:[0,0,0],direction:[0,0,1]});
 const link=v.add('l','link',{uid:p.uid,position:[0,0,0],shape:{kind:'capsule',ax:0,az:0,bx:0,bz:8,r:p.width}});
 let ah,lh,motes;anchor.g.traverse(n=>{if(n.name==='weave-anchor-hero:storm')ah=n;});link.g.traverse(n=>{if(n.name==='weave-link-hero:storm')lh=n;if(n.name==='weave-link-motes:storm')motes=n;});
 assert.ok(ah&&lh&&motes);assert.equal(ah.material,lh.material);assert.equal(lh.material.uniforms.clock,v.terrainTime);
 assert.equal(motes.geometry.getAttribute('position').count,20);assert.equal(motes.material.uniforms.clock,v.terrainTime);assert.equal(motes.material.depthWrite,false);
 assert.ok(lh.scale.x*0.625<=p.width+1e-9);assert.equal(lh.material.depthWrite,false);
 m.tick=30;v.update();assert.equal(v.terrainTime.value,1);v.reducedMotion=true;v.update();assert.equal(v.terrainTime.value,0);
 const resources=[ah.geometry,lh.geometry,ah.material,motes.geometry,motes.material];let disposed=0;for(const r of resources)r.addEventListener('dispose',()=>disposed++);
 v.dispose();assert.equal(disposed,5);assert.equal(scene.children.length,0);
});
