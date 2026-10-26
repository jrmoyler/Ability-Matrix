import test from 'node:test';
import assert from 'node:assert/strict';
import { Scene } from 'three';
import { CombatStateManager } from '../packs/sandbox/src/combat/ucsm/CombatStateManager.js';
import { MechanicSystems } from '../packs/sandbox/src/combat/ucsm/mechanics/MechanicSystems.js';
import { MechanicPresentation } from '../packs/sandbox/src/combat/ucsm/mechanics/MechanicPresentation.js';
import { MECHANIC_PRESETS } from '../packs/sandbox/src/combat/ucsm/mechanics/presets.js';
import { STANCE_VARIANTS } from '../packs/sandbox/src/combat/ucsm/mechanics/stance-presets.js';

const fixture = () => {
  const m=new CombatStateManager(), s=new MechanicSystems(m), scene=new Scene();
  m.upsertEntity({id:'caster',teamId:'player'});
  return {m,s,scene,view:new MechanicPresentation(scene,s)};
};

test('each stance has element-specific finite geometry for anticipation, block, reversal and finisher', () => {
  const {view}=fixture();
  for (const phase of ['anticipation','block','reversal','finisher']) {
    const signatures=[];
    for (const p of [MECHANIC_PRESETS.stance,...STANCE_VARIANTS]) {
      const g=view.build(phase,{family:'stance',uid:p.uid,ownerId:'caster',position:[0,0,0],direction:[0,0,1]});
      const shapes=[];
      g.traverse(n=>{
        if (!n.isMesh) return;
        assert.ok(n.geometry.attributes.position.count>0);
        for (const value of n.geometry.attributes.position.array) assert.ok(Number.isFinite(value));
        const color=n.material.color ?? n.material.uniforms?.tint?.value;
        assert.ok(color,p.uid);
        shapes.push([n.geometry.type,n.geometry.attributes.position.count,color.getHex()]);
      });
      assert.ok(shapes.length>=7,p.uid);
      signatures.push(JSON.stringify(shapes));
    }
    assert.equal(new Set(signatures).size,6,phase);
  }
  view.dispose();
});

test('finisher boundary uses its actual damage radius, including passive waves', () => {
  const {m,view}=fixture();
  for (const p of [MECHANIC_PRESETS.stance,...STANCE_VARIANTS]) {
    for (const radius of [p.finisherRadius,3.5]) {
      const cue={kind:'mechanic',phase:'finisher',id:`${p.uid}:${radius}`,family:'stance',uid:p.uid,
        ownerId:'caster',position:[0,0,0],direction:[0,0,1],visualRadius:radius,tick:m.tick};
      view.cue(cue); const item=view.items.get(`vfx:${cue.id}:finisher:${cue.tick}`);
      m.tick+=2; view.update();
      assert.equal(item.g.scale.x,radius,p.uid);
      assert.equal(item.g.scale.z,radius,p.uid);
      assert.equal(item.g.scale.y,1,p.uid);
      const boundary=item.g.children.find(n=>n.userData.stanceBoundary);
      assert.equal(boundary.scale.x,1);
      boundary.geometry.computeBoundingSphere();
      assert.ok(Math.abs(boundary.geometry.boundingSphere.radius - 1) < 1e-6, 'outer edge reaches the actual radius');
      view.remove(item.id);
    }
  }
  view.dispose();
});

test('combat cues carry the same radius as the actual finisher and passive hit shapes', () => {
  for (const p of [MECHANIC_PRESETS.stance,...STANCE_VARIANTS]) {
    const {m,s,view}=fixture();
    m.upsertEntity({id:'enemy',teamId:'enemy',position:[1,0,0],health:10});
    s.stance.activate({id:'cast',family:'stance',uid:p.uid,ownerId:'caster',position:[0,0,0],direction:[0,0,1]});
    assert.equal(s.stance.finish('caster'),true);
    const hit=m.queue.find(e=>e.type==='hit');
    const cue=m.cues.find(e=>e.phase==='finisher');
    assert.equal(cue.visualRadius,hit.shape.r,p.uid);
    view.dispose();
  }
  for (const [p,interval] of [[STANCE_VARIANTS[0],3],[STANCE_VARIANTS[3],2]]) {
    const {m,s,view}=fixture();
    m.upsertEntity({id:'enemy',teamId:'enemy',position:[1,0,0],health:10});
    s.stance.activate({id:'cast',family:'stance',uid:p.uid,ownerId:'caster',position:[0,0,0],direction:[0,0,1]});
    for(let i=0;i<interval;i++) s.stance.modify({type:'cast-start',ownerId:'caster',mechanic:'standard'});
    assert.equal(m.cues.find(e=>e.phase==='finisher').visualRadius,m.queue.find(e=>e.type==='hit').shape.r,p.uid);
    view.dispose();
  }
});

test('stance animation is tick-deterministic, reduced motion is static, and resources dispose', () => {
  const {m,scene,view}=fixture(), p=STANCE_VARIANTS[0];
  const cue={kind:'mechanic',phase:'finisher',id:'move',family:'stance',uid:p.uid,
    ownerId:'caster',position:[0,0,0],direction:[0,0,1],visualRadius:3,tick:0};
  view.cue(cue); const item=view.items.get('vfx:move:finisher:0');
  const part=item.g.children.find(n=>n.userData.stanceBeat);
  m.tick=3; view.update(); const first=[part.position.y,part.scale.y]; view.update();
  assert.deepEqual([part.position.y,part.scale.y],first);
  m.tick=5; view.update(); assert.notDeepEqual([part.position.y,part.scale.y],first);
  view.remove(item.id); view.reducedMotion=true; m.tick=0; view.cue(cue);
  const still=view.items.get('vfx:move:finisher:0'), fixed=still.g.children.find(n=>n.userData.stanceBeat);
  m.tick=3; view.update(); const before=[fixed.position.y,fixed.scale.y,still.g.scale.x];
  m.tick=5; view.update(); assert.deepEqual([fixed.position.y,fixed.scale.y,still.g.scale.x],before);
  let disposed=0; for(const resource of view.resources) resource.addEventListener('dispose',()=>disposed++);
  view.dispose(); assert.equal(disposed,view.resources.length); assert.equal(scene.children.length,0);
});
