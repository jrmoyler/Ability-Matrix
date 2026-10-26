import test from 'node:test';
import assert from 'node:assert/strict';
import { Scene } from 'three';
import { CombatStateManager } from '../packs/sandbox/src/combat/ucsm/CombatStateManager.js';
import { MechanicSystems } from '../packs/sandbox/src/combat/ucsm/mechanics/MechanicSystems.js';
import { MechanicPresentation } from '../packs/sandbox/src/combat/ucsm/mechanics/MechanicPresentation.js';
import { CONVERGENCE_VARIANTS, convergenceStrikeShapes } from '../packs/sandbox/src/combat/ucsm/mechanics/ConvergenceVariants.js';
import { IMPLEMENTED_MECHANICS } from '../packs/sandbox/src/combat/ucsm/registry.js';

const seedElements = { fire:'water', frost:'water', water:'fire', earth:'frost', crystal:'storm' };
function setup(budget = {}) {
  const m = new CombatStateManager();
  m.upsertEntity({id:'caster', teamId:'player', position:[0,0,-5], health:10});
  m.upsertEntity({id:'enemy', teamId:'enemy', position:[0,0,1], health:10});
  m.upsertEntity({id:'ally', teamId:'player', position:[0,0,1], health:10});
  return {m, s:new MechanicSystems(m,budget)};
}
function seed(m, el) {
  m.submit({type:'terrain-impact', ownerId:'caster', teamId:'player', abilityUid:'test/seed', element:el,
    position:[0,0,0], shape:{kind:'disc',x:0,z:0,r:2},durationTicks:100}); m.advance();
}
function run(p,budget) {
  const {m,s}=setup(budget); seed(m,seedElements[p.element]);
  const id=[...m.regions.keys()][0];
  const r=s.command({family:'convergence',uid:p.uid,position:[0,0,0],direction:[0,0,1]});
  assert.equal(r.ok,true);
  for(let i=0;i<s.t(p.anticipation)+2;i++) m.advance();
  return {m,s,id};
}
test('five convergence variants are separately registered with distinct authored patterns',()=>{
  assert.equal(CONVERGENCE_VARIANTS.length,5);
  assert.equal(new Set(CONVERGENCE_VARIANTS.map(p=>p.uid)).size,5);
  assert.equal(new Set(CONVERGENCE_VARIANTS.map(p=>p.pattern)).size,5);
  for(const p of CONVERGENCE_VARIANTS) assert.ok(IMPLEMENTED_MECHANICS.some(x=>x.uid===p.uid && x.selectable));
});
for(const p of CONVERGENCE_VARIANTS) test(`${p.name}: consumes compatible ingredient and hits only hostile targets with owned events`,()=>{
  const {m,s,id}=run(p);
  assert.equal(s.results.at(-1).ok,true);
  assert.equal(m.regions.has(id),false);
  const events=m.recentEvents.filter(e=>e.abilityUid===p.uid);
  assert.ok(events.some(e=>e.type==='terrain-impact' && e.ownerId==='caster' && e.element===p.element));
  assert.equal(events.filter(e=>e.type==='hit' && e.targetIds.includes('enemy')).length,1);
  assert.ok(m.entities.get('enemy').health < 10);
  assert.equal(m.entities.get('ally').health,10);
});
test('different strike geometries track direction and do not multiply hits at overlaps',()=>{
  const c={position:[0,0,0],direction:[1,0,0]};
  const signatures=CONVERGENCE_VARIANTS.map(p=>JSON.stringify(convergenceStrikeShapes(p,c)));
  assert.equal(new Set(signatures).size,5);
  const wave=convergenceStrikeShapes(CONVERGENCE_VARIANTS[2],c)[0];
  assert.ok(wave.bx>wave.ax && wave.bz===wave.az);
  for(const p of CONVERGENCE_VARIANTS) {
    const {m}=run(p);
    const hits=m.recentEvents.filter(e=>e.abilityUid===p.uid && e.type==='hit' && e.targetIds.includes('enemy'));
    assert.equal(hits.length,1,p.name);
  }
});
test('insufficient event budget rejects atomically without consuming ingredients',()=>{
  const p=CONVERGENCE_VARIANTS[0], {m,s,id}=run(p,{eventsPerTick:1});
  assert.equal(m.regions.has(id),true);
  assert.match(s.results.at(-1).reason,/budget/);
  assert.equal(m.recentEvents.filter(e=>e.abilityUid===p.uid && e.type==='terrain-impact').length,0);
  assert.equal(m.entities.get('enemy').health,10);
});
test('all five authored convergence rigs contain finite geometry and can be disposed',()=>{
  const {s}=setup(), scene=new Scene(), v=new MechanicPresentation(scene,s), signatures=[];
  for(const p of CONVERGENCE_VARIANTS) {
    const rig=v.build('convergence',{uid:p.uid,position:[0,0,0],direction:[0,0,1]});
    const meshes=[];
    rig.traverse(n=>{if(n.isMesh){assert.ok(n.geometry.attributes.position.count>0); meshes.push(`${n.geometry.type}:${n.material.color.getHexString()}`);}});
    assert.ok(meshes.length>=10,p.name); signatures.push(meshes.join(','));
  }
  assert.equal(new Set(signatures).size,5);
  v.dispose();
});

test('convergence detail motion follows fixed combat ticks and releases its scene objects',()=>{
  for (const p of CONVERGENCE_VARIANTS) {
    const {m,s}=setup(), scene=new Scene(), v=new MechanicPresentation(scene,s);
    v.reducedMotion=false;
    v.cue({kind:'mechanic',phase:'convergence',id:'cast',uid:p.uid,family:'convergence',tick:0,position:[0,0,0],direction:[0,0,1]});
    const rig=[...v.items.values()][0].g, animated=[];
    rig.traverse(n=>{if(n.userData.convergenceMotion) animated.push(n);});
    assert.ok(animated.length > 0,p.name);
    m.tick=2; v.update();
    const a=JSON.stringify(animated.map(n=>[n.position.toArray(),n.scale.toArray()]));
    m.tick=18; v.update();
    const b=JSON.stringify(animated.map(n=>[n.position.toArray(),n.scale.toArray()]));
    assert.notEqual(a,b,p.name);
    m.tick=70; v.update();
    assert.equal(scene.children.length,0,p.name);
    v.dispose();
  }
});

test('convergence escapes cover containing its origin but respects separate ridges',()=>{
  const {m,s}=setup();
  m.setPosition('caster',-8,0,0); m.setPosition('enemy',0,0,2); m.setPosition('ally',-7,0,1);
  assert.equal(s.worldshape.activate({id:'terrain',family:'worldshape',ownerId:'caster',position:[0,0,0],direction:[0,0,1]}),null);
  m.advance();
  const p=CONVERGENCE_VARIANTS[0];
  assert.equal(s.convergence.activate({id:'fusion',family:'convergence',uid:p.uid,ownerId:'caster',position:[0,0,0],direction:[0,0,1]}),null);
  m.advance();
  assert.ok(m.entities.get('enemy').health < 10);
  assert.equal(s.worldshape.blocked([0,0,0],[0,0,2]),true,'strict LOS remains unchanged');
  assert.equal(s.worldshape.blocked([0,0,0],[0,0,2],0,{allowEgress:true}),false);
  s.worldshape.regions.set('wall',{id:'wall',ridges:[{kind:'disc',x:0,z:3,r:0.4}]});
  assert.equal(s.worldshape.blocked([0,0,0],[0,0,5],0,{allowEgress:true}),true,'separate wall still blocks');
});

test('ingredient examples are actually compatible and each telegraph outlines its real strike shapes', async()=>{
  const { resolvePair, TIER } = await import('../packs/sandbox/src/combat/ucsm/reactions.js');
  const { createConvergenceTelegraph } = await import('../packs/sandbox/src/combat/ucsm/mechanics/ConvergenceTelegraph.js');
  function edgeDistance(shape,x,z) {
    if (shape.kind === 'disc') return Math.abs(Math.hypot(x-shape.x,z-shape.z)-shape.r);
    const dx=shape.bx-shape.ax, dz=shape.bz-shape.az, len=dx*dx+dz*dz;
    const t=Math.max(0,Math.min(1,((x-shape.ax)*dx+(z-shape.az)*dz)/len));
    return Math.abs(Math.hypot(x-(shape.ax+t*dx),z-(shape.az+t*dz))-shape.r);
  }
  for (const p of CONVERGENCE_VARIANTS) {
    assert.notEqual(p.element,p.ingredientExample);
    assert.ok(resolvePair(p.ingredientExample,p.element).tier<=TIER.RULE,p.name);
    const shapes=convergenceStrikeShapes(p,{position:[0,0,0],direction:[0,0,1]});
    const g=createConvergenceTelegraph(p);
    assert.equal(g.children.filter(x=>x.name==='strike-footprint').length,shapes.length);
    assert.equal(g.children.filter(x=>x.name==='ingredient-radius').length,1);
    let disposed=0;
    for(const child of g.children) child.geometry.addEventListener('dispose',()=>disposed++);
    g.children.filter(x=>x.name==='strike-footprint').forEach((line,i)=>{
      const a=line.geometry.getAttribute('position');
      for(let n=0;n<a.count;n++) assert.ok(edgeDistance(shapes[i],a.getX(n),a.getZ(n)) < 1e-5,`${p.name} shape ${i}`);
    });
    g.userData.dispose();
    assert.equal(disposed,g.children.length);
  }
});

test('convergence charge and impact layers follow their gameplay strike ranges',()=>{
  for (const p of CONVERGENCE_VARIANTS) {
    const {s}=setup(), v=new MechanicPresentation(new Scene(),s);
    const charge=v.build('anticipation',{uid:p.uid,family:'convergence',direction:[1,0,0]});
    assert.ok(charge.getObjectByName('convergence-charge'),p.name);
    const effect=v.build('convergence',{uid:p.uid,family:'convergence',direction:[1,0,0]});
    const impact=effect.getObjectByName('convergence-impact');
    assert.ok(impact,p.name);
    const shapes=convergenceStrikeShapes(p,{position:[0,0,0],direction:[0,0,1]});
    for (const [i,shape] of shapes.entries()) {
      if (shape.kind==='disc') {
        const ring=impact.getObjectByName(`impact-disc-${i}`);
        assert.ok(ring,p.name); assert.equal(ring.position.x,shape.x); assert.equal(ring.position.z,shape.z);
        assert.equal(ring.scale.x,shape.r);
      } else {
        for (const [j,point] of [[shape.ax,shape.az],[shape.bx,shape.bz]].entries()) {
          const ring=impact.getObjectByName(`impact-cap-${i}-${j}`);
          assert.ok(ring,p.name); assert.equal(ring.position.x,point[0]); assert.equal(ring.position.z,point[1]);
          assert.equal(ring.scale.x,shape.r);
        }
        assert.ok(impact.getObjectByName(`impact-rail-${i}--1`));
        assert.ok(impact.getObjectByName(`impact-rail-${i}-1`));
      }
    }
    v.dispose();
  }
});

test('directional convergence is aligned at every motion preference and visual effects are bounded',()=>{
  for (const reduced of [false,true]) for (const p of CONVERGENCE_VARIANTS) {
    const {m,s}=setup(), scene=new Scene(), v=new MechanicPresentation(scene,s);
    v.reducedMotion=reduced;
    const base={kind:'mechanic',id:'cast',uid:p.uid,family:'convergence',tick:0,position:[0,0,0],direction:[1,0,0]};
    v.cue({...base,phase:'anticipation'}); v.cue({...base,phase:'convergence'});
    for(const item of v.items.values()) assert.ok(Math.abs(item.g.rotation.y-Math.PI/2)<1e-9,p.name);
    m.tick=3; v.update();
    for(const item of v.items.values()) assert.ok(Math.abs(item.g.rotation.y-Math.PI/2)<1e-9,p.name);
    const impact=[...v.items.values()].find(item=>item.kind==='convergence').g.getObjectByName('convergence-impact');
    assert.equal(impact.visible,true,p.name);
    m.tick=18; v.update();
    assert.equal(impact.visible,false,`${p.name} impact is not a persistent damage zone`);
    for(let i=0;i<80;i++) v.cue({...base,id:`burst-${i}`,tick:m.tick,phase:'convergence'});
    assert.ok(v.effects.length <= 32); assert.ok(v.items.size <= 32);
    v.clear(); assert.equal(scene.children.length,0);
    let disposed=0; for(const r of v.resources) r.addEventListener('dispose',()=>disposed++);
    v.dispose(); assert.equal(disposed,v.resources.length);
  }
});

test('charge and hit boundary overlays remain readable over raised terrain at full first-frame range',()=>{
  for(const p of CONVERGENCE_VARIANTS) for(const reduced of [false,true]) {
    const {m,s}=setup(), v=new MechanicPresentation(new Scene(),s);
    v.reducedMotion=reduced;
    const base={kind:'mechanic',id:'cast',uid:p.uid,family:'convergence',tick:0,position:[0,0,0],direction:[1,0,0]};
    v.cue({...base,phase:'anticipation'}); v.cue({...base,phase:'convergence'});
    m.tick=0; v.update();
    const items=[...v.items.values()];
    const charge=items.find(x=>x.kind==='anticipation').g.getObjectByName('convergence-charge');
    const impactItem=items.find(x=>x.kind==='convergence');
    const impact=impactItem.g.getObjectByName('convergence-impact');
    assert.ok(charge && impact,p.name);
    for(const layer of [charge,impact]) layer.traverse(n=>{
      if(!n.isMesh) return;
      assert.equal(n.material.depthTest,false,p.name);
      assert.equal(n.material.depthWrite,false,p.name);
      assert.ok(n.renderOrder>=100,p.name);
      assert.equal(n.castShadow,false,p.name);
    });
    assert.equal(impactItem.g.scale.x,1,`${p.name} full damage range on impact frame`);
    assert.equal(impact.scale.x,1); assert.equal(impact.scale.z,1);
    const central=[];
    impactItem.g.traverse(n=>{if(n.isMesh && !impact.children.includes(n)) central.push(n);});
    assert.ok(central.some(n=>n.material.depthTest),`${p.name} sculpture still respects scene depth`);
    let disposed=0; for(const r of v.resources) r.addEventListener('dispose',()=>disposed++);
    v.dispose(); assert.equal(disposed,v.resources.length);
  }
});
