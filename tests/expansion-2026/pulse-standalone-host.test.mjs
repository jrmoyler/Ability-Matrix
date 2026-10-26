import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { Vector3 } from 'three';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';
import { registerHooks } from 'node:module';
import { Dummy } from '../../packs/sandbox/src/combat/Dummy.js';
import { DummyField } from '../../packs/sandbox/src/combat/DummyField.js';
import { settings } from '../../packs/sandbox/src/config/settings.js';
import { CombatStateManager } from '../../packs/sandbox/src/combat/ucsm/CombatStateManager.js';
import { ExpansionCombatAdapter } from '../../packs/sandbox/src/combat/ucsm/ExpansionCombatAdapter.js';
import { bindExpansionCombat } from '../../packs/sandbox/src/abilities/expansion-2026/StandaloneCombat.js';
import { Ability, ID, config } from '../../packs/sandbox/src/abilities/expansion-2026/pulse-covenant/index.js';
registerHooks({load(url,context,next){return url.endsWith('.css')?{format:'module',source:'',shortCircuit:true}:next(url,context);}});
const {PackAdapter}=await import('../../packs/sandbox/src/combat/ucsm/PackAdapter.js');

function arena(){
  settings[ID]={...structuredClone(config.settings),damage:1};
  const bytes=readFileSync(new URL('../../packs/sandbox/public/models/dummy.fbx',import.meta.url));
  const model=new FBXLoader().parse(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');
  const env={registerShadowCasterWithPatch(){}};
  const field=new DummyField(env);
  const dummies=[0,.5,1,1.5].map(x=>{const d=new Dummy({source:model,clip:model.animations[0],scale:.01,offset:{x:0,y:0,z:0},forwardYaw:0,environment:env});d.root.position.set(x,0,5);d.root.updateWorldMatrix(true,true);field.slots.push({dummy:d,wait:0});return d;});
  const manager=new CombatStateManager(),ctx={character:{position:new Vector3()},dummies:field,lights:{acquire:()=>({}),set(){},release(){}}};
  const app={abilities:{ctx,active:[],cast(){}},dummies:field,character:ctx.character};
  const host=Object.assign(Object.create(PackAdapter.prototype),{app,manager,enabled:false,scope:null,_meta:new WeakMap(),_wrapped:new WeakSet(),_tracked:new Set(),_ids:new WeakMap(),_byId:new Map(),_nextDummy:0,mechanics:{clear(){}}});
  const bridge=new ExpansionCombatAdapter(manager,{enabled:()=>host.enabled,modeVersion:()=>host.combatModeEpoch});ctx.expansionCombat=bridge;
  host._install();host.update(1/30);
  const pulse=new Ability(ctx);pulse.spawn(new Vector3(),new Vector3(0,0,1),.1);
  const observer=bindExpansionCombat(ctx,'matrix-expansion/test-observer'),events=[];
  const sub=observer.on('hit',e=>events.push(e));assert.equal(sub.ok,true);
  const cast=(uid)=>{const ability={origin:new Vector3(),element:'tempest',update(){}};host._tagNew([ability],new Set(),()=>uid);return ability;};
  const hit=(ability,dummy)=>host._within(ability,()=>dummy.kill(0,1,{impulse:1,lift:1,spin:1}));
  const close=()=>{pulse.destroy();pulse.dispose();sub.unsubscribe();host._detachStandaloneHits();bridge.dispose();for(const d of dummies)d.dispose();delete settings[ID];};
  return {dummies,manager,ctx,host,bridge,pulse,events,cast,hit,close};
}

test('real scoped knockdowns trigger a standalone pulse without fabricated or misattributed nested hits',()=>{
  const x=arena();
  const first=x.cast('collective/tempest'),second=x.cast('collective/dune');
  x.hit(first,x.dummies[0]);
  assert.equal(x.events.length,1);assert.equal(x.events[0].abilityUid,'collective/tempest');
  for(let i=0;i<18;i++)x.host.update(1/30);
  x.hit(second,x.dummies[1]);
  assert.equal(x.events.length,2,'Pulse-generated secondary kills must not inherit the second cast UID');
  assert.equal(x.events[1].abilityUid,'collective/dune');
  assert.notEqual(x.events[0].castId,x.events[1].castId);
  assert.equal(x.events[1].tick-x.events[0].tick,18);
  assert.equal(x.dummies[2].alive,false,'genuine cadence triggers real secondary damage');
  assert.equal(x.manager.queue.length,0,'standalone hit observation does not fabricate combat events');
  x.close();
});

test('unscoped and same-cast hits cannot invent an owned rhythm; listeners stop on mode change',()=>{
  const x=arena(),one=x.cast('collective/tempest');
  x.hit(one,x.dummies[0]);
  for(let i=0;i<18;i++)x.host.update(1/30);
  x.hit(one,x.dummies[1]);
  assert.equal(x.events.length,2);
  assert.equal(x.dummies[2].alive,true,'two hits from one cast do not trigger the covenant');
  x.dummies[2].kill(0,1,{impulse:1,lift:1,spin:1});
  assert.equal(x.events.length,2,'an unscoped kill has no owned cast attribution');
  x.host.enabled=true;x.host.enabled=false;
  x.hit(x.cast('collective/dune'),x.dummies[3]);
  assert.equal(x.events.length,2,'old subscriptions cannot revive after a mode round trip');
  x.close();
});

test('nonlethal fallback damage produces no physical hit and destroyed pulses unsubscribe',()=>{
  const x=arena(),direct=bindExpansionCombat(x.ctx,'matrix-expansion/adaptive-fabricator');
  const id=direct.queryActors({position:[0,0,5],radius:.1}).actors[0].id;
  assert.equal(direct.emit({type:'hit',element:'tech',targetIds:[id],position:[0,0,5],damage:.4}).ok,true);
  assert.equal(x.dummies[0].alive,true);
  assert.equal(x.events.length,0,'partial health alone is not a real physical hit');
  x.pulse.destroy();
  x.hit(x.cast('collective/tempest'),x.dummies[0]);
  for(let i=0;i<18;i++)x.host.update(1/30);
  x.hit(x.cast('collective/dune'),x.dummies[1]);
  assert.equal(x.events.length,2,'the independent observer still sees genuine hits');
  assert.equal(x.dummies[2].alive,true,'the destroyed pulse cannot proc');
  x.close();
});


test('a scoped hit on a newly added dummy is observed before the host frame update',()=>{
  const x=arena();
  const target=x.dummies[0];
  // A slot created since the previous host update has no host association yet.
  delete target.__ucsmAdapter;
  x.host._ids.delete(target);
  x.host._byId.clear();
  const cast=x.cast('collective/tempest');
  x.hit(cast,target);
  assert.equal(x.events.length,1);
  assert.equal(x.events[0].abilityUid,'collective/tempest');
  x.close();
});
