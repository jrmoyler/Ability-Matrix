import test from 'node:test';
import assert from 'node:assert/strict';
import { Scene, Vector3 } from 'three';
import { settings } from '../packs/sandbox/src/config/settings.js';
import { BATCH_B_CONFIGS, BATCH_B_ABILITIES } from '../packs/sandbox/src/abilities/expansion-2026/batch-b.js';

test('target-bound effects move their lights without changing the fixed aim point',()=>{
  for(const id of ['exp-toxin-evolution','exp-nightshade-inheritance','exp-heliostat-verdict']){
    const config=BATCH_B_CONFIGS.find(x=>x.id===id),module=BATCH_B_ABILITIES.find(x=>x.ID===id);
    settings[id]=structuredClone(config.settings);
    const actor={id:'dummy:0',alive:true,position:[6,0,0]},seen=[];
    const scope={on:()=>({ok:true,unsubscribe(){}}),queryActors:()=>({ok:true,actors:[actor]}),getActor:()=>({ok:true,actor}),isBlocked:()=>({ok:true,blocked:false}),emit:()=>({ok:true})};
    const ctx={scene:new Scene(),lights:{acquire:()=>({}),set:(entry,pos)=>seen.push(pos.clone()),release(){}},expansionCombat:{bind:()=>scope}};
    const a=new module.Ability(ctx);a.spawn(new Vector3(),new Vector3(1,0,0),5);a.update(.5);a.update(.1);
    assert.equal(seen.at(-1).x,6,id);assert.equal(a.position.x,5,id);
    actor.position=[7,0,0];a.update(.1);assert.equal(seen.at(-1).x,7,id);assert.equal(a.position.x,5,id);
    a.destroy();a.dispose();delete settings[id];
  }
});
