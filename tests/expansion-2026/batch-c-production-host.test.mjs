import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { Scene, Vector3 } from 'three';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';
import { Dummy } from '../../packs/sandbox/src/combat/Dummy.js';
import { DummyField } from '../../packs/sandbox/src/combat/DummyField.js';
import { AbilityManager } from '../../packs/sandbox/src/abilities/AbilityManager.js';
import { CombatStateManager } from '../../packs/sandbox/src/combat/ucsm/CombatStateManager.js';
import { MechanicSystems } from '../../packs/sandbox/src/combat/ucsm/mechanics/MechanicSystems.js';
import { ExpansionCombatAdapter } from '../../packs/sandbox/src/combat/ucsm/ExpansionCombatAdapter.js';
import { registerHooks } from 'node:module';
registerHooks({load(url, context, next) { return url.endsWith('.css') ? {format:'module', source:'', shortCircuit:true} : next(url,context); }});
const { PackAdapter } = await import('../../packs/sandbox/src/combat/ucsm/PackAdapter.js');
const { installProductionExpansion } = await import('../../packs/sandbox/src/abilities/expansion-2026/ProductionRegistration.js');
const { expansionRoster } = await import('../../packs/sandbox/src/abilities/expansion-2026/ProductionRoster.js');
const { EXPANSION_STATUS } = await import('../../packs/sandbox/src/abilities/expansion-2026/status.js');
const { App } = await import('../../packs/sandbox/src/core/App.js');
class Element { constructor(){this.children=[];this.style={};this.value='';} append(...elements){this.children.push(...elements);if(!this.value&&elements[0]?.value)this.value=elements[0].value;} setAttribute(){} addEventListener(){} remove(){} }
const gui={addFolder(){return {add(){return {name(){return this;}}},addColor(){return {name(){return this;}}},close(){},destroy(){}}}};

test('seven candidates use production selection, cast, and host combat attribution',async()=>{
  globalThis.document={createElement:()=>new Element(),body:new Element()};
  const bytes=readFileSync(new URL('../../packs/sandbox/public/models/dummy.fbx',import.meta.url));
  const model=new FBXLoader().parse(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');
  const items=[['pulseCovenant','blood'],['spellwrightsGambit','arcane'],['mirageProcession','illusion'],['borrowedTomorrow','time'],['momentumLedger','motion'],['adaptiveFabricator','tech'],['vectorBreakwater','force']];
  for (const [id,element] of items) {
    const env={registerShadowCasterWithPatch(){}};
    const createTarget=(x,z)=>{const target=new Dummy({source:model,clip:model.animations[0],scale:.01,offset:{x:0,y:0,z:0},forwardYaw:0,environment:env});target.root.position.set(x,0,z);target.root.updateWorldMatrix(true,true);return target;};
    const target=createTarget(0,5), nearby=element==='blood'?createTarget(1,5):null;
    const dummies=new DummyField(env);dummies.slots=[{dummy:target,wait:0}];if(nearby)dummies.slots.push({dummy:nearby,wait:0});
    const combat=new CombatStateManager();new MechanicSystems(combat);const bridge=new ExpansionCombatAdapter(combat);
    const ctx={scene:new Scene(),lights:{acquire:()=>({}),set(){},release(){}},character:{position:new Vector3()},dummies,expansionCombat:bridge};
    const abilities=new AbilityManager(ctx);
    const app=Object.assign(Object.create(App.prototype),{abilities,scene:ctx.scene,character:ctx.character,dummies,editor:{gui},nativePack:new Map(),runtimes:new Map(),renderer:{gl:{domElement:{}}},hud:{setElement(){},showToast(){}},aim:{object3D:{visible:true},setElement(){},cancel(){},facing:0},cooldowns:new Map(),slot:null,_throwBody(){}});
    const host=Object.assign(Object.create(PackAdapter.prototype),{app,manager:combat,enabled:true,cues:false,scope:null,_meta:new WeakMap(),_wrapped:new WeakSet(),_tracked:new Set(),_ids:new WeakMap(),_byId:new Map(),_nextDummy:0,mechanics:{systems:{worldshape:{blocked:()=>false}},beforeStep(){},update(){},cue(){},clear(){}},feed:{update(){},badges(){}}});
    app.combat=host;host._install();
    const item=expansionRoster().find(c=>c.ID===id);assert.ok(item,id);
    const live=installProductionExpansion(app,expansionRoster({...EXPANSION_STATUS,[item.uid]:'live'}));
    host.update(1/60);await app.select(item.uid,{prepare:false});app._cast(new Vector3(),new Vector3(0,0,1),element==='blood'?.1:5);
    const candidate=abilities.active[0];assert.ok(candidate,id);
    const seen=[];
    for(let i=0;i<300;i++){
      if(element==='blood'&&(i===2||i===38)) combat.submit({type:'hit',element:'force',abilityUid:'legacy/test',castId:`test:${i}`,ownerId:'caster',teamId:'player',targetIds:['dummy:0'],position:[0,0,5],damage:0});
      if(element==='motion'&&i<100)ctx.character.position.x+=.02;
      abilities.update(1/60);host.update(1/60);
      for(const event of combat.recentEvents)if(!seen.some(x=>x.eventId===event.eventId))seen.push(event);
    }
    const uid=host._meta.get(candidate).uid;
    const targetId=element==='blood'?'dummy:1':'dummy:0';
    const event=seen.find(e=>e.abilityUid===uid&&e.element===element&&e.type==='hit'&&e.targetIds.includes(targetId));
    assert.ok(event,`${id} must commit an attributed hit for the actual host dummy`);
    assert.equal(event.ownerId,'caster');
    if(element!=='blood')assert.equal(target.alive,false,`${id} defeats the target in the host`);
    live.dispose();abilities.dispose();bridge.dispose();target.dispose();nearby?.dispose();
  }
});
