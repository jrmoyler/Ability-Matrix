import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { Scene } from 'three';
import { CONVERGENCE_HEROES,createConvergenceHero } from '../packs/sandbox/src/combat/ucsm/mechanics/ConvergenceHeroGeometry.js';
import { CONVERGENCE_VARIANTS,convergenceStrikeShapes } from '../packs/sandbox/src/combat/ucsm/mechanics/ConvergenceVariants.js';
import { CombatStateManager,shapeContains } from '../packs/sandbox/src/combat/ucsm/CombatStateManager.js';
import { MechanicSystems } from '../packs/sandbox/src/combat/ucsm/mechanics/MechanicSystems.js';
import { MechanicPresentation } from '../packs/sandbox/src/combat/ucsm/mechanics/MechanicPresentation.js';

test('all convergence hero surfaces are finite, distinctive, deterministic and follow the strike footprint',()=>{
 const seen=new Set();
 for(const slug of CONVERGENCE_HEROES){
  const g=createConvergenceHero(slug), p=g.getAttribute('position'),uv=g.getAttribute('uv');
  assert.ok(p.count>=60&&p.count<=700,slug);assert.equal(p.count,uv.count);
  assert.ok([...p.array].every(Number.isFinite),slug);assert.ok([...uv.array].every(x=>x>=0&&x<=1),slug);
  assert.ok([...g.index.array].every(i=>i<p.count),slug);
  const id=`mechanics/convergence/${slug}`, profile=CONVERGENCE_VARIANTS.find(x=>x.uid===id);
  const shapes=profile?convergenceStrikeShapes(profile,{position:[0,0,0],direction:[0,0,1]}):[{kind:'disc',x:0,z:0,r:4}];
  for(let i=0;i<p.count;i++) assert.ok(shapes.some(s=>shapeContains({...s,r:s.r+0.001},p.getX(i),p.getZ(i))),`${slug} vertex ${i}`);
  const hash=createHash('sha256').update(Buffer.from(p.array.buffer)).digest('hex');assert.ok(!seen.has(hash),slug);seen.add(hash);
  const repeat=createConvergenceHero(slug);assert.deepEqual(p.array,repeat.getAttribute('position').array);g.dispose();repeat.dispose();
 }
 assert.throws(()=>createConvergenceHero('unknown'),/Unknown convergence hero/);
});

test('convergence hero and bounded motes share one clock and dispose pooled resources',()=>{
 const m=new CombatStateManager();m.upsertEntity({id:'caster',teamId:'player'});
 const s=new MechanicSystems(m), scene=new Scene(),v=new MechanicPresentation(scene,s);
 const uid='mechanics/convergence/hydrodynamic-synthesis';
 const a=v.add('a','convergence',{uid,family:'convergence',position:[0,0,0],direction:[0,0,1]},1.8);
 const b=v.add('b','convergence',{uid,family:'convergence',position:[1,0,0],direction:[0,0,1]},1.8);
 let hero,particles,again;a.g.traverse(n=>{if(n.name==='convergenceHero:hydrodynamic-synthesis')hero=n;if(n.name==='convergenceMotes:hydrodynamic-synthesis')particles=n;});
 b.g.traverse(n=>{if(n.name==='convergenceHero:hydrodynamic-synthesis')again=n;});
 assert.ok(hero&&particles&&again);assert.equal(hero.geometry,again.geometry);assert.equal(hero.material,again.material);
 assert.equal(particles.geometry.getAttribute('position').count,48);assert.equal(hero.material.uniforms.clock,v.terrainTime);assert.equal(particles.material.uniforms.clock,v.terrainTime);
 m.tick=30;v.update();assert.equal(v.terrainTime.value,1);v.reducedMotion=true;v.update();assert.equal(v.terrainTime.value,0);
 const resources=[hero.geometry,hero.material,particles.geometry,particles.material];let disposed=0;for(const r of resources)r.addEventListener('dispose',()=>disposed++);
 v.dispose();assert.equal(disposed,4);assert.equal(scene.children.length,0);
});
