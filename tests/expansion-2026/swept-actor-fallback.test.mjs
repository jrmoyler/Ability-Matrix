import test from 'node:test';
import assert from 'node:assert/strict';
import { Vector3 } from 'three';
import { CombatStateManager } from '../../packs/sandbox/src/combat/ucsm/CombatStateManager.js';
import { ExpansionCombatAdapter } from '../../packs/sandbox/src/combat/ucsm/ExpansionCombatAdapter.js';
import { settings } from '../../packs/sandbox/src/config/settings.js';
import { Ability as Mirage, ID as MIRAGE, config as mirageConfig } from '../../packs/sandbox/src/abilities/expansion-2026/mirage-procession/index.js';
import { Ability as Breakwater, ID as BREAKWATER, config as breakwaterConfig } from '../../packs/sandbox/src/abilities/expansion-2026/vector-breakwater/index.js';

for(const [name,Ability,id,config] of [['mirage',Mirage,MIRAGE,mirageConfig],['breakwater',Breakwater,BREAKWATER,breakwaterConfig]]){
  test(`${name} standalone sweep hits a real host target and fails closed on mode change`,()=>{
    settings[id]=structuredClone(config.settings);
    if(name==='mirage')settings[id].trueLane=0;
    for(const toggle of [false,true]){
      let enabled=false,epoch=0,kills=0;
      const dummy={alive:true,position:new Vector3(5,0,0),kill(){kills++;this.alive=false;return true;}};
      const manager=new CombatStateManager();
      const bridge=new ExpansionCombatAdapter(manager,{enabled:()=>enabled,modeVersion:()=>epoch});
      const a=new Ability({lights:{acquire:()=>({}),release(){},set(){}},character:{position:new Vector3()},dummies:{slots:[{dummy}]},expansionCombat:bridge});
      a.spawn(new Vector3(),new Vector3(1,0,0),10);
      if(toggle){enabled=true;epoch++;}
      for(let i=0;i<180;i++)a.update(1/60);
      assert.equal(kills,toggle?0:1);
      if(toggle)assert.equal(a.failure,'combat mode changed during cast');
      a.destroy();a.dispose();bridge.dispose();
    }
  });
}
