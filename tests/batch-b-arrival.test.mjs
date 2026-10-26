import test from 'node:test';
import assert from 'node:assert/strict';
import { Scene, Vector3 } from 'three';
import { settings } from '../packs/sandbox/src/config/settings.js';
import { BATCH_B_CONFIGS, BATCH_B_ABILITIES } from '../packs/sandbox/src/abilities/expansion-2026/batch-b.js';

test('arrival resolves staged geometry immediately without premature damage',()=>{
  for(const id of ['exp-predatory-canopy','exp-toxin-evolution','exp-nightshade-inheritance','exp-vigil-of-embers','exp-mass-weft']){
    const cfg=BATCH_B_CONFIGS.find(x=>x.id===id),mod=BATCH_B_ABILITIES.find(x=>x.ID===id),events=[];settings[id]=structuredClone(cfg.settings);
    const actor={id:'dummy:0',alive:true,position:[6,0,0]},scope={on:()=>({ok:true,unsubscribe(){}}),queryActors:()=>({ok:true,actors:[actor]}),getActor:()=>({ok:true,actor}),isBlocked:()=>({ok:true,blocked:false}),emit:e=>(events.push(e),{ok:true})};
    const ctx={scene:new Scene(),dummies:{findTargets:()=>[]},lights:{acquire:()=>({}),set(){},release(){}},expansionCombat:{bind:()=>scope}};
    const a=new mod.Ability(ctx);a.spawn(new Vector3(),new Vector3(1,0,0),5);a.update(.5);
    if(id==='exp-predatory-canopy'){assert.equal(a.root.visible,true);assert.ok(a.root.scale.x<=.02);}
    if(id==='exp-toxin-evolution'){assert.equal(a.effect.visible,true);assert.equal(a.effect.position.x,6);assert.ok(a.coils.every(x=>!x.visible));}
    if(id==='exp-nightshade-inheritance'){assert.equal(a.shade.visible,true);assert.equal(a.shade.position.x,6);assert.equal(a.floorMat.uniforms.uFade.value,1);}
    if(id==='exp-vigil-of-embers'){assert.equal(a.rig.visible,true);assert.equal(a.crown.position.y,3.2);assert.ok(a.curtains.every(x=>!x.visible));}
    if(id==='exp-mass-weft'){assert.equal(a.rig.visible,true);assert.equal(a.ribbon.scale.y,5);assert.ok(a.compressionWaves.flat().every(x=>!x.visible));}
    assert.ok(events.every(e=>e.type==='status'),id);a.destroy();a.dispose();delete settings[id];
  }
});
