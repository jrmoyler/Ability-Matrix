import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { Vector3 } from 'three';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';
import { Dummy } from '../../packs/sandbox/src/combat/Dummy.js';
import { DummyField } from '../../packs/sandbox/src/combat/DummyField.js';
import { settings } from '../../packs/sandbox/src/config/settings.js';
import { ToxinEvolutionAbility } from '../../packs/sandbox/src/abilities/expansion-2026/poison/ToxinEvolutionAbility.js';
import toxin from '../../packs/sandbox/src/abilities/expansion-2026/poison/toxin-evolution.config.js';
import { HeliostatVerdictAbility } from '../../packs/sandbox/src/abilities/expansion-2026/light/HeliostatVerdictAbility.js';
import light from '../../packs/sandbox/src/abilities/expansion-2026/light/heliostat-verdict.config.js';

for (const [spec, Ability] of [[toxin,ToxinEvolutionAbility],[light,HeliostatVerdictAbility]]) {
 test(`${spec.meta.label} releases a replaced target before dealing damage`,()=>{
  settings[spec.id]=structuredClone(spec.settings);
  const bytes=readFileSync(new URL('../../packs/sandbox/public/models/dummy.fbx',import.meta.url));
  const model=new FBXLoader().parse(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');
  const env={registerShadowCasterWithPatch(){}};
  const dummy=new Dummy({source:model,clip:model.animations[0],scale:.01,offset:{x:0,y:0,z:0},forwardYaw:0,environment:env});
  dummy.place(0,5,0);dummy.root.updateWorldMatrix(true,true);
  const dummies=new DummyField(env);dummies.slots=[{dummy,wait:0}];
  const ctx={character:{position:new Vector3()},dummies,lights:{acquire:()=>({}),set(){},release(){}},expansionCombat:{enabled:()=>false,bind:()=>({})}};
  const a=new Ability(ctx);a.spawn(new Vector3(),new Vector3(0,0,1),5);
  for(let i=0;i<120&&!a.targetId;i++)a.update(1/60);
  assert.ok(a.targetId,'cast acquired the original life');
  const stage=a.stage;
  dummies.reset();dummy.place(0,5,0);
  for(let i=0;i<120;i++)a.update(1/60);
  assert.equal(a.targetId,null);
  assert.equal(a.failure,'target was replaced');
  assert.equal(dummy.alive,true,'the new life is not damaged by the old cast');
  if(stage!==undefined)assert.equal(a.stage,stage);
  a.destroy();a.dispose();dummy.dispose();delete settings[spec.id];
 });
}

test('combat snapshots expose the current dummy life rather than a stale manager identity', async()=>{
 const { CombatStateManager }=await import('../../packs/sandbox/src/combat/ucsm/CombatStateManager.js');
 const { ExpansionCombatAdapter }=await import('../../packs/sandbox/src/combat/ucsm/ExpansionCombatAdapter.js');
 const manager=new CombatStateManager();manager.upsertEntity({id:'caster',teamId:'player'});manager.upsertEntity({id:'dummy:0',teamId:'targets',position:[0,0,5]});
 let generation=1;
 const adapter=new ExpansionCombatAdapter(manager,{actorGeneration:id=>id==='dummy:0'?generation:undefined});
 const scope=adapter.bind('matrix-expansion/test');
 assert.equal(scope.queryActors({position:[0,0,5],radius:1}).actors[0].standGeneration,1);
 generation=2;
 assert.equal(scope.getActor('dummy:0').actor.standGeneration,2);
 adapter.dispose();
});

test('queued combat hits cannot strike a new life after a reset', async()=>{
 const { CombatStateManager }=await import('../../packs/sandbox/src/combat/ucsm/CombatStateManager.js');
 const { ExpansionCombatAdapter }=await import('../../packs/sandbox/src/combat/ucsm/ExpansionCombatAdapter.js');
 const manager=new CombatStateManager();manager.upsertEntity({id:'caster',teamId:'player'});manager.upsertEntity({id:'dummy:0',teamId:'targets',position:[0,0,5]});
 let generation=1;
 const adapter=new ExpansionCombatAdapter(manager,{actorGeneration:id=>id==='dummy:0'?generation:undefined});
 const scope=adapter.bind('matrix-expansion/test');
 assert.equal(scope.emit({type:'hit',element:'fire',targetIds:['dummy:0'],damage:1}).ok,true);
 generation=2;adapter.filterQueuedTargets();manager.step(1/30);
 assert.equal(manager.entities.get('dummy:0').health,1);
 assert.equal(manager.entities.get('dummy:0').alive,true);
 assert.equal(scope.emit({type:'hit',element:'fire',targetIds:['dummy:0'],damage:1}).ok,true);
 adapter.filterQueuedTargets();manager.step(1/30);
 assert.equal(manager.entities.get('dummy:0').alive,false,'freshly cast hit still affects the new life');
 adapter.dispose();
});

test('host clears combat health and statuses when a living dummy is reset', async()=>{
 const { registerHooks }=await import('node:module');
 registerHooks({load(url,context,next){return url.endsWith('.css')?{format:'module',source:'',shortCircuit:true}:next(url,context);}});
 const { PackAdapter }=await import('../../packs/sandbox/src/combat/ucsm/PackAdapter.js');
 const { CombatStateManager }=await import('../../packs/sandbox/src/combat/ucsm/CombatStateManager.js');
 const manager=new CombatStateManager(),dummy={alive:true,position:new Vector3(0,0,5)};
 let generation=0;
 const dummies={slots:[{dummy}],standGeneration:()=>generation};
 const app={character:{position:new Vector3()},dummies,runtimes:new Map(),camera:{},renderer:{gl:{domElement:{}}}};
 const host=Object.assign(Object.create(PackAdapter.prototype),{app,manager,enabled:true,_ids:new WeakMap(),_byId:new Map(),_nextDummy:0,_tracked:new Set(),cues:false,mechanics:{beforeStep(){},update(){},cue(){}},feed:{update(){},badges(){}}});
 host.update(0);
 const entity=manager.entities.get('dummy:0');entity.health=.4;entity.statuses.push({tag:'burn'});entity.pendingKill=true;
 generation++;host.update(0);
 assert.equal(entity.health,entity.maxHealth);assert.deepEqual(entity.statuses,[]);assert.equal(entity.pendingKill,false);
});

test('live Nightshade mark releases when the pooled target is replaced', async()=>{
 const { CombatStateManager }=await import('../../packs/sandbox/src/combat/ucsm/CombatStateManager.js');
 const { ExpansionCombatAdapter }=await import('../../packs/sandbox/src/combat/ucsm/ExpansionCombatAdapter.js');
 const { NightshadeInheritanceAbility }=await import('../../packs/sandbox/src/abilities/expansion-2026/shadow/NightshadeInheritanceAbility.js');
 const { default: spec }=await import('../../packs/sandbox/src/abilities/expansion-2026/shadow/nightshade-inheritance.config.js');
 settings[spec.id]=structuredClone(spec.settings);
 const manager=new CombatStateManager();manager.upsertEntity({id:'caster',teamId:'player'});manager.upsertEntity({id:'dummy:0',teamId:'targets',position:[0,0,5]});
 let generation=1;const bridge=new ExpansionCombatAdapter(manager,{actorGeneration:id=>id==='dummy:0'?generation:undefined});
 const a=new NightshadeInheritanceAbility({character:{position:new Vector3()},lights:{acquire:()=>({}),set(){},release(){}},expansionCombat:bridge});
 a.spawn(new Vector3(),new Vector3(0,0,1),5);for(let i=0;i<120&&!a.targetId;i++)a.update(1/60);
 assert.equal(a.targetId,'dummy:0');generation++;a.update(1/60);
 assert.equal(a.targetId,null);assert.equal(a.failure,'marked target was replaced');
 a.destroy();a.dispose();bridge.dispose();delete settings[spec.id];
});
