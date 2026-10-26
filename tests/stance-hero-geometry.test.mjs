import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { Scene } from 'three';
import { createStanceHero, STANCE_HEROES } from '../packs/sandbox/src/combat/ucsm/mechanics/StanceHeroGeometry.js';
import { CombatStateManager } from '../packs/sandbox/src/combat/ucsm/CombatStateManager.js';
import { MechanicSystems } from '../packs/sandbox/src/combat/ucsm/mechanics/MechanicSystems.js';
import { MechanicPresentation } from '../packs/sandbox/src/combat/ucsm/mechanics/MechanicPresentation.js';

test('six stance hero surfaces are finite, distinctive, deterministic and near the caster',()=>{
 const seen=new Set();
 for(const slug of STANCE_HEROES){
  const g=createStanceHero(slug),p=g.getAttribute('position'),uv=g.getAttribute('uv');
  assert.ok(p.count>=60&&p.count<=600,slug);assert.equal(p.count,uv.count);
  assert.ok([...p.array].every(Number.isFinite),slug);assert.ok([...uv.array].every(x=>x>=0&&x<=1),slug);
  assert.ok([...g.index.array].every(i=>i<p.count),slug);
  for(let i=0;i<p.count;i++){assert.ok(Math.hypot(p.getX(i),p.getZ(i))<=1.5,slug);assert.ok(p.getY(i)>=-.05&&p.getY(i)<=3,slug);}
  const hash=createHash('sha256').update(Buffer.from(p.array.buffer)).digest('hex');assert.ok(!seen.has(hash),slug);seen.add(hash);
  const again=createStanceHero(slug);assert.deepEqual(p.array,again.getAttribute('position').array);g.dispose();again.dispose();
 }
 assert.throws(()=>createStanceHero('unknown'),/Unknown stance hero/);
});

test('stance hero and bounded motes share one clock and pooled resources',()=>{
 const m=new CombatStateManager();m.upsertEntity({id:'caster',teamId:'player'});
 const s=new MechanicSystems(m),scene=new Scene(),v=new MechanicPresentation(scene,s);
 const uid='mechanics/stance/leviathans-mantle';
 const a=v.add('a','stance',{uid,family:'stance',ownerId:'caster',position:[0,0,0],direction:[0,0,1]});
 const b=v.add('b','stance',{uid,family:'stance',ownerId:'caster',position:[0,0,0],direction:[0,0,1]});
 let hero,motes,again;a.g.traverse(n=>{if(n.name==='stanceHero:leviathans-mantle')hero=n;if(n.name==='stanceMotes:leviathans-mantle')motes=n;});
 b.g.traverse(n=>{if(n.name==='stanceHero:leviathans-mantle')again=n;});
 assert.ok(hero&&motes&&again);assert.equal(hero.geometry,again.geometry);assert.equal(hero.material,again.material);
 assert.equal(motes.geometry.getAttribute('position').count,48);assert.equal(hero.material.uniforms.clock,v.terrainTime);assert.equal(motes.material.uniforms.clock,v.terrainTime);
 assert.equal(hero.material.depthWrite,false);m.tick=30;v.update();assert.equal(v.terrainTime.value,1);v.reducedMotion=true;v.update();assert.equal(v.terrainTime.value,0);
 const resources=[hero.geometry,hero.material,motes.geometry,motes.material];let disposed=0;for(const r of resources)r.addEventListener('dispose',()=>disposed++);
 v.dispose();assert.equal(disposed,4);assert.equal(scene.children.length,0);
});
