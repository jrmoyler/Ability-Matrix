import test from 'node:test';
import assert from 'node:assert/strict';
import { Scene, Vector3 } from 'three';
import { settings } from '../packs/sandbox/src/config/settings.js';
import { AbilityPhase } from '../packs/sandbox/src/abilities/Ability.js';
import { BATCH_B_CONFIGS, BATCH_B_ABILITIES } from '../packs/sandbox/src/abilities/expansion-2026/batch-b.js';

test('paused editor frames update the display without committing new combat actions',()=>{
  for (let i=0;i<BATCH_B_CONFIGS.length;i++) {
    const config=BATCH_B_CONFIGS[i], module=BATCH_B_ABILITIES[i];
    settings[config.id]=structuredClone(config.settings);
    const events=[], target={id:'dummy:0',alive:true,position:[0,0,5]}, dummy={alive:true,position:new Vector3(0,0,5),kill(){events.push('kill');this.alive=false;return true;}};
    const scope={on:()=>({ok:true,unsubscribe(){}}),queryActors:()=>({ok:true,actors:[target]}),getActor:()=>({ok:true,actor:target}),isBlocked:()=>({ok:true,blocked:false}),emit:e=>(events.push(e),{ok:true})};
    const ctx={scene:new Scene(),lights:{acquire:()=>({}),set(){},release(){}},expansionCombat:{bind:()=>scope},dummies:{findTargets(x,z,r,out){out.push(dummy);return out;}}};
    const a=new module.Ability(ctx);a.spawn(new Vector3(),new Vector3(0,0,1),5);
    a.update(1);assert.equal(a.phase,AbilityPhase.IMPACT,config.id);
    // At the time an action is due, repeated zero-duration frames may render,
    // but should not act. This also covers timing at the first impact frame.
    a.impactTime=a.impactDuration*.95;
    if(config.meta.element==='nature'){a._target=dummy;a._triggerAt=0;}
    if(config.meta.element==='cosmic'){a._target=dummy;a._targetPos.copy(dummy.position);a._markedAt=0;}
    events.length=0;
    for(let j=0;j<5;j++)a.update(0);
    assert.equal(events.length,0,config.id);
    a.destroy();a.dispose();delete settings[config.id];
  }
});
