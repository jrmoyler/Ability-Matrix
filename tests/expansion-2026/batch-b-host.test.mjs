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
const { installExpansionHarness } = await import('../../packs/sandbox/src/dev/ExpansionHarness.js');
class Element { constructor(){this.children=[];this.style={};this.value='';} append(...elements){this.children.push(...elements);if(!this.value&&elements[0]?.value)this.value=elements[0].value;} setAttribute(){} addEventListener(){} remove(){} }
const gui={addFolder(){return {add(){return {name(){return this;}}},addColor(){return {name(){return this;}}},close(){},destroy(){}}}};

test('bridge-driven expansion casts affect real host-synchronized dummies',()=>{
  globalThis.document={createElement:()=>new Element(),body:new Element()};
  const bytes=readFileSync(new URL('../../packs/sandbox/public/models/dummy.fbx',import.meta.url));
  const model=new FBXLoader().parse(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');
  for(const [id,element] of [['exp-toxin-evolution','poison'],['exp-heliostat-verdict','light'],['exp-vigil-of-embers','holy'],['exp-mass-weft','gravity'],['exp-hollow-meridian','void'],['exp-nightshade-inheritance','shadow']]) {
    const env={registerShadowCasterWithPatch(){}};
    const target=new Dummy({source:model,clip:model.animations[0],scale:.01,offset:{x:0,y:0,z:0},forwardYaw:0,environment:env});
    target.root.position.set(0,0,5);target.root.updateWorldMatrix(true,true);
    const dummies=new DummyField(env);dummies.slots=[{dummy:target,wait:0}];
    let nextTarget;
    if(element==='shadow'){nextTarget=new Dummy({source:model,clip:model.animations[0],scale:.01,offset:{x:0,y:0,z:0},forwardYaw:0,environment:env});nextTarget.root.position.set(1,0,5);nextTarget.root.updateWorldMatrix(true,true);dummies.slots.push({dummy:nextTarget,wait:0});}
    const combat=new CombatStateManager(); new MechanicSystems(combat); const bridge=new ExpansionCombatAdapter(combat);
    const ctx={scene:new Scene(),lights:{acquire:()=>({}),set(){},release(){}},character:{position:new Vector3()},dummies,expansionCombat:bridge};
    const abilities=new AbilityManager(ctx);
    const app={abilities,character:ctx.character,dummies,editor:{gui},uidOf:id=>`native/${id}`,runtimes:new Map(),renderer:{gl:{domElement:{}}}};
    const host=Object.assign(Object.create(PackAdapter.prototype),{app,manager:combat,enabled:true,cues:false,scope:null,_meta:new WeakMap(),_wrapped:new WeakSet(),_tracked:new Set(),_ids:new WeakMap(),_byId:new Map(),_nextDummy:0,mechanics:{systems:{worldshape:{blocked:()=>false}},beforeStep(){},update(){},cue(){},clear(){}},feed:{update(){},badges(){}}});
    app.combat=host;host._install();
    const harness=installExpansionHarness(app);
    host.update(1/60);
    const candidate=harness.cast(id,{heading:0,distance:5});
    const seen=[];
    for(let i=0;i<240;i++){abilities.update(1/60);if(element==='shadow'&&i===60)host._within(candidate,()=>target.kill(0,1,{impulse:1,lift:1,spin:1}));host.update(1/60);for(const e of combat.recentEvents)if(!seen.some(x=>x.eventId===e.eventId))seen.push(e);}
    const uid=host._meta.get(candidate).uid;
    const event=seen.find(e=>e.abilityUid===uid&&e.element===element&&e.targetIds.includes('dummy:0'));
    assert.ok(event,`${id} must commit an attributed event for the actual host dummy`);
    assert.equal(event.ownerId,'caster');
    if(['poison','light','void','holy','gravity'].includes(element)) assert.equal(target.alive,false,`${id} defeats a full-health sandbox dummy at default settings`);
    if(element==='shadow'){assert.equal(candidate.transfers,1);assert.ok(seen.some(e=>e.abilityUid===uid&&e.type==='status'&&e.targetIds.includes('dummy:1')),'defeat transfers mark to second real dummy');}
    harness.dispose();abilities.dispose();bridge.dispose();target.dispose();nextTarget?.dispose();
  }
});
