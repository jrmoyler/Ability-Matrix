import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { Scene } from 'three';
import { createWorldshapeHero, WORLDSHAPE_HEROES } from '../packs/sandbox/src/combat/ucsm/mechanics/WorldshapeHeroGeometry.js';
import { CombatStateManager } from '../packs/sandbox/src/combat/ucsm/CombatStateManager.js';
import { MechanicSystems } from '../packs/sandbox/src/combat/ucsm/mechanics/MechanicSystems.js';
import { MechanicPresentation } from '../packs/sandbox/src/combat/ucsm/mechanics/MechanicPresentation.js';
import { MECHANIC_PRESETS } from '../packs/sandbox/src/combat/ucsm/mechanics/presets.js';
import { WORLDSHAPE_VARIANTS } from '../packs/sandbox/src/combat/ucsm/mechanics/worldshapeVariants.js';

test('terrain hero surfaces are finite, unique, deterministic, and bounded by the field',()=>{
 const signatures=new Set();
 for(const slug of WORLDSHAPE_HEROES){
  const g=createWorldshapeHero(slug),p=g.getAttribute('position'),uv=g.getAttribute('uv');
  assert.ok(p.count>=60&&p.count<=900,slug);assert.equal(p.count,uv.count,slug);
  assert.ok([...p.array].every(Number.isFinite),slug);assert.ok([...uv.array].every(x=>x>=0&&x<=1),slug);
  assert.ok([...g.index.array].every(i=>i<p.count),slug);
  for(let i=0;i<p.count;i++) assert.ok(Math.hypot(p.getX(i),p.getZ(i))<=1,`${slug} vertex ${i}`);
  const digest=createHash('sha256').update(Buffer.from(p.array.buffer)).digest('hex');assert.ok(!signatures.has(digest),slug);signatures.add(digest);
  const again=createWorldshapeHero(slug);assert.deepEqual(p.array,again.getAttribute('position').array);g.dispose();again.dispose();
 }
 assert.throws(()=>createWorldshapeHero('missing'),/Unknown worldshape hero/);
});

test('terrain heroes and 36 motes are pooled, clocked, elevation-aware and disposed',()=>{
 for(const p of [...WORLDSHAPE_VARIANTS,MECHANIC_PRESETS.worldshape]){
  const m=new CombatStateManager();m.upsertEntity({id:'caster',teamId:'player',position:[0,0,-10]});
  const s=new MechanicSystems(m), scene=new Scene(),v=new MechanicPresentation(scene,s);
  const c={id:'terrain',family:'worldshape',uid:p.uid,ownerId:'caster',position:[0,0,0],direction:[0,0,1]};
  assert.equal(s.worldshape.activate(c),null);
  const item=v.add('visual','worldshape',s.worldshape.regions.get('terrain'));
  const slug=p.uid.split('/').at(-1);let hero,motes;
  item.g.traverse(n=>{if(n.name===`worldshapeHero:${slug}`)hero=n;if(n.name===`worldshapeMotes:${slug}`)motes=n;});
  assert.ok(hero&&motes,slug);assert.equal(motes.geometry.getAttribute('position').count,36);
  assert.equal(hero.material.uniforms.clock,v.terrainTime);assert.equal(motes.material.uniforms.clock,v.terrainTime);
  assert.equal(hero.material.uniforms.elevation.value,p.height??0);assert.match(hero.material.vertexShader,/elevation\*max/);
  assert.equal(hero.scale.x,p.radius);assert.equal(hero.scale.z,p.radius);assert.equal(hero.material.depthWrite,false);
  m.tick=30;v.update();assert.equal(v.terrainTime.value,1);v.reducedMotion=true;v.update();assert.equal(v.terrainTime.value,0);
  const resources=[hero.geometry,hero.material,motes.geometry,motes.material];let count=0;for(const r of resources)r.addEventListener('dispose',()=>count++);
  v.dispose();assert.equal(count,4);assert.equal(scene.children.length,0);
 }
});
