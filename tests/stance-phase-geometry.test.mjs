import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { Scene } from 'three';
import { CombatStateManager } from '../packs/sandbox/src/combat/ucsm/CombatStateManager.js';
import { MechanicSystems } from '../packs/sandbox/src/combat/ucsm/mechanics/MechanicSystems.js';
import { MechanicPresentation } from '../packs/sandbox/src/combat/ucsm/mechanics/MechanicPresentation.js';
import { MECHANIC_PRESETS } from '../packs/sandbox/src/combat/ucsm/mechanics/presets.js';
import { STANCE_VARIANTS } from '../packs/sandbox/src/combat/ucsm/mechanics/stance-presets.js';
import { createStancePhaseSurface, STANCE_PHASES, STANCE_PHASE_ELEMENTS } from '../packs/sandbox/src/combat/ucsm/mechanics/StancePhaseGeometry.js';

test('each phase and element has distinct finite geometry within its gameplay radius',()=>{
  const signatures=new Set();
  for(const phase of STANCE_PHASES) for(const element of STANCE_PHASE_ELEMENTS){
    const g=createStancePhaseSurface(element,phase), p=g.attributes.position, uv=g.attributes.uv;
    assert.ok(p.count>=30 && p.count<=600,`${element}:${phase}`);
    assert.equal(uv.count,p.count);
    for(const v of p.array) assert.ok(Number.isFinite(v));
    for(const v of uv.array) assert.ok(Number.isFinite(v)&&v>=0&&v<=1);
    for(const i of g.index.array) assert.ok(i<p.count);
    for(let i=0;i<p.count;i++) assert.ok(Math.hypot(p.getX(i),p.getZ(i))<=1,`${element}:${phase}`);
    const signature=createHash('sha256').update(new Uint8Array(p.array.buffer)).digest('hex');
    assert.ok(!signatures.has(signature),`${element}:${phase}`); signatures.add(signature);
    const repeat=createStancePhaseSurface(element,phase);
    assert.deepEqual(p.array,repeat.attributes.position.array);
    repeat.dispose();g.dispose();
  }
  assert.equal(signatures.size,24);
});

test('phase surfaces and motes reuse bounded resources, obey reduced motion and dispose',()=>{
  const m=new CombatStateManager(),s=new MechanicSystems(m),scene=new Scene(),v=new MechanicPresentation(scene,s);
  m.upsertEntity({id:'caster',teamId:'player'});
  for(const preset of [MECHANIC_PRESETS.stance,...STANCE_VARIANTS]) for(const phase of STANCE_PHASES){
    const data={family:'stance',uid:preset.uid,ownerId:'caster',position:[0,0,0],direction:[0,0,1]};
    const a=v.build(phase,data), b=v.build(phase,data);
    const hero=a.getObjectByName(`stancePhaseHero:${preset.element}:${phase}`), motes=a.getObjectByName(`stancePhaseMotes:${preset.element}:${phase}`);
    assert.ok(hero);assert.ok(motes);assert.equal(motes.geometry.attributes.position.count,32);
    assert.equal(hero.geometry,b.getObjectByName(hero.name).geometry);
    assert.equal(hero.material,b.getObjectByName(hero.name).material);
    assert.equal(hero.material.uniforms.clock,v.terrainTime);
    assert.equal(hero.material.depthWrite,false);
  }
  v.reducedMotion=true;m.tick=20;v.update();assert.equal(v.terrainTime.value,0);
  let disposed=0;for(const r of v.resources)r.addEventListener('dispose',()=>disposed++);
  v.dispose();assert.equal(disposed,v.resources.length);assert.equal(scene.children.length,0);
});
