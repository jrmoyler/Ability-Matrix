import test from 'node:test';
import assert from 'node:assert/strict';
import { Scene, Vector3 } from 'three';
import { settings } from '../packs/sandbox/src/config/settings.js';
import { CombatStateManager } from '../packs/sandbox/src/combat/ucsm/CombatStateManager.js';
import { MechanicSystems } from '../packs/sandbox/src/combat/ucsm/mechanics/MechanicSystems.js';
import { ExpansionCombatAdapter } from '../packs/sandbox/src/combat/ucsm/ExpansionCombatAdapter.js';
import { NightshadeInheritanceAbility, ID, UID } from '../packs/sandbox/src/abilities/expansion-2026/shadow/NightshadeInheritanceAbility.js';
import config from '../packs/sandbox/src/abilities/expansion-2026/shadow/nightshade-inheritance.config.js';
settings[ID]=structuredClone(config.settings);

test('enabled inheritance delivers attributed hits and stops at the configured transfer limit',()=>{
  const m=new CombatStateManager();new MechanicSystems(m);m.upsertEntity({id:'caster',teamId:'player',position:[0,0,0],health:10});
  for(let i=0;i<5;i++)m.upsertEntity({id:`dummy:${i}`,teamId:'enemy',position:[5+i,0,0],health:1});
  const bridge=new ExpansionCombatAdapter(m),a=new NightshadeInheritanceAbility({scene:new Scene(),lights:{acquire:()=>({}),set(){},release(){}},expansionCombat:bridge});
  a.spawn(new Vector3(),new Vector3(1,0,0),5);a.update(.5);a.update(.1);m.advance();assert.equal(a.targetId,'dummy:0');
  m.submit({type:'hit',element:'shadow',abilityUid:'test/external',ownerId:'caster',teamId:'player',targetIds:['dummy:0'],damage:1});
  for(let i=0;i<12;i++)m.advance();
  assert.equal(a.transfers,3);assert.equal(a.targetId,null);assert.deepEqual([0,1,2,3,4].map(i=>m.entities.get(`dummy:${i}`).alive),[false,false,false,false,true]);
  const strikes=m.recentEvents.filter(e=>e.abilityUid===UID&&e.type==='hit');assert.deepEqual(strikes.map(e=>e.targetIds[0]),['dummy:1','dummy:2','dummy:3']);assert.ok(strikes.every(e=>e.ownerId==='caster'&&e.damage===1));const marks=m.recentEvents.filter(e=>e.abilityUid===UID&&e.type==='status');assert.deepEqual(marks.map(e=>e.targetIds[0]),['dummy:0']);
  a.destroy();assert.equal(bridge.listeners.size,0);a.dispose();bridge.dispose();
});

test('a surviving successor receives one shadow exposure from the inherited hit',()=>{
  const prior=settings[ID].transferDamage;settings[ID].transferDamage=.25;
  const m=new CombatStateManager();new MechanicSystems(m);m.upsertEntity({id:'caster',teamId:'player',position:[0,0,0],health:10});m.upsertEntity({id:'dummy:0',teamId:'enemy',position:[5,0,0],health:1});m.upsertEntity({id:'dummy:1',teamId:'enemy',position:[6,0,0],health:1});
  const bridge=new ExpansionCombatAdapter(m),a=new NightshadeInheritanceAbility({scene:new Scene(),lights:{acquire:()=>({}),set(){},release(){}},expansionCombat:bridge});
  try{a.spawn(new Vector3(),new Vector3(1,0,0),5);a.update(.5);a.update(.1);m.advance();m.submit({type:'hit',element:'shadow',abilityUid:'test/external',ownerId:'caster',teamId:'player',targetIds:['dummy:0'],damage:1});for(let i=0;i<4;i++)m.advance();const successor=m.entities.get('dummy:1');assert.equal(successor.health,.75);assert.equal(successor.alive,true);assert.equal(successor.statuses.find(s=>s.tag==='obscured').stacks,1);assert.equal(a.targetId,'dummy:1');}finally{settings[ID].transferDamage=prior;a.destroy();a.dispose();bridge.dispose();}
});
