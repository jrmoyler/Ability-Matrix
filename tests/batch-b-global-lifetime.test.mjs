import test from 'node:test';
import assert from 'node:assert/strict';
import { Scene, Vector3 } from 'three';
import { AbilityPhase } from '../packs/sandbox/src/abilities/Ability.js';
import { settings } from '../packs/sandbox/src/config/settings.js';
import { BATCH_B_CONFIGS, BATCH_B_ABILITIES } from '../packs/sandbox/src/abilities/expansion-2026/batch-b.js';

function run(id,scale){
  const cfg=BATCH_B_CONFIGS.find(c=>c.id===id),mod=BATCH_B_ABILITIES.find(c=>c.ID===id);settings[id]=structuredClone(cfg.settings);settings.global.lifetime=scale;
  const events=[],actor={id:'dummy:0',alive:true,position:[5,0,0]},dummy={alive:true,position:new Vector3(5,0,0),kill(){this.alive=false;events.push({type:'hit',at:a.impactTime});return true;}};
  const scope={on:()=>({ok:true,unsubscribe(){}}),queryActors:()=>({ok:true,actors:[actor]}),getActor:()=>({ok:true,actor}),isBlocked:()=>({ok:true,blocked:false}),emit:e=>{if(e.type==='hit')events.push({type:'hit',at:a.impactTime});return {ok:true};}};
  const ctx={scene:new Scene(),dummies:{findTargets(x,z,r,out){out.length=0;if(dummy.alive)out.push(dummy);return out;}},lights:{acquire:()=>({}),set(){},release(){}},expansionCombat:{bind:()=>scope}};
  const a=new mod.Ability(ctx);a.spawn(new Vector3(),new Vector3(1,0,0),5);
  while(a.phase===AbilityPhase.TRAVEL)a.update(1/120);
  assert.ok(Math.abs(a.impactDuration-cfg.settings.lifetime*scale)<1e-9,id);assert.ok(Math.abs(a.fadeDuration-cfg.settings.fade*scale)<1e-9,id);
  const index=['exp-toxin-evolution','exp-vigil-of-embers','exp-mass-weft'].includes(id)?1:0;
  for(let i=0;i<2400&&events.length<=index&&a.phase===AbilityPhase.IMPACT;i++)a.update(1/120);
  const result=events[index]?.at;a.destroy();a.dispose();delete settings[id];return result;
}

test('global lifetime scales staged strike timing without losing stages',()=>{
  const original=settings.global.lifetime;
  try{
    for(const id of ['exp-predatory-canopy','exp-celestial-cartography','exp-toxin-evolution','exp-heliostat-verdict','exp-vigil-of-embers','exp-mass-weft','exp-hollow-meridian']){
      const normal=run(id,1),fast=run(id,.5),slow=run(id,2);assert.ok(Number.isFinite(normal)&&Number.isFinite(fast)&&Number.isFinite(slow),id);assert.ok(Math.abs(fast-normal*.5)<.035,`${id}: fast ${fast}, normal ${normal}`);assert.ok(Math.abs(slow-normal*2)<.05,`${id}: slow ${slow}, normal ${normal}`);
    }
  }finally{settings.global.lifetime=original;}
});
test('shadow mark rise uses the same scaled phase clock',()=>{
  const original=settings.global.lifetime,id='exp-nightshade-inheritance',cfg=BATCH_B_CONFIGS.find(c=>c.id===id),mod=BATCH_B_ABILITIES.find(c=>c.ID===id);settings[id]=structuredClone(cfg.settings);settings.global.lifetime=2;
  const actor={id:'dummy:0',alive:true,position:[5,0,0]},scope={on:()=>({ok:true,unsubscribe(){}}),queryActors:()=>({ok:true,actors:[actor]}),getActor:()=>({ok:true,actor}),emit:()=>({ok:true})},ctx={scene:new Scene(),lights:{acquire:()=>({}),set(){},release(){}},expansionCombat:{bind:()=>scope}},a=new mod.Ability(ctx);
  try{a.spawn(new Vector3(),new Vector3(1,0,0),5);while(a.phase===AbilityPhase.TRAVEL)a.update(1/120);a.update(.45);assert.ok(a.shade.scale.x>.45&&a.shade.scale.x<.55);a.update(.45);assert.equal(a.shade.scale.x,1);assert.equal(a.impactDuration,cfg.settings.lifetime*2);assert.equal(a.fadeDuration,cfg.settings.fade*2);}finally{settings.global.lifetime=original;a.destroy();a.dispose();delete settings[id];}
});
