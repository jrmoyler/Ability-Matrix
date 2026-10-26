import test from 'node:test';
import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';
import { Vector3 } from 'three';
import { settings } from '../packs/sandbox/src/config/settings.js';
import { CombatStateManager } from '../packs/sandbox/src/combat/ucsm/CombatStateManager.js';
import { ExpansionCombatAdapter } from '../packs/sandbox/src/combat/ucsm/ExpansionCombatAdapter.js';
import { bindExpansionCombat } from '../packs/sandbox/src/abilities/expansion-2026/StandaloneCombat.js';
registerHooks({load(url,context,next){return url.endsWith('.css')?{format:'module',source:'',shortCircuit:true}:next(url,context);}});
const { PackAdapter } = await import('../packs/sandbox/src/combat/ucsm/PackAdapter.js');
const force={impulse:4,lift:2,spin:.5};

test('expansion hit force is bounded, copied and delivered with committed damage',()=>{
  const m=new CombatStateManager();m.upsertEntity({id:'caster',teamId:'player'});m.upsertEntity({id:'dummy:0',teamId:'targets',position:[2,0,0]});
  const bridge=new ExpansionCombatAdapter(m),scope=bridge.bind('matrix-expansion/test');
  for(const bad of [{...force,impulse:25},{...force,lift:-1},{...force,spin:Infinity},null])assert.equal(scope.emit({type:'hit',element:'light',targetIds:['dummy:0'],damage:1,hitForce:bad}).ok,false);
  assert.equal(scope.emit({type:'status',element:'light',targetIds:['dummy:0'],hitForce:force}).ok,false);
  const supplied={...force};assert.equal(scope.emit({type:'hit',element:'light',targetIds:['dummy:0'],damage:1,hitForce:supplied}).ok,true);supplied.impulse=20;m.advance();
  const effect=m.drain().effects.find(e=>e.kind==='damage');assert.deepEqual(effect.hitForce,force);bridge.dispose();
});
test('legacy damage keeps the established generic force, while an expansion hit can set its own',()=>{
  const m=new CombatStateManager();m.upsertEntity({id:'caster',teamId:'player'});m.upsertEntity({id:'dummy:0',teamId:'targets',position:[2,0,0]});
  m.submit({type:'hit',element:'light',abilityUid:'codex/original',ownerId:'caster',teamId:'player',targetIds:['dummy:0'],damage:1,hitForce:force});m.advance();const effect=m.drain().effects.find(e=>e.kind==='damage');assert.equal(effect.hitForce,undefined);
  const calls=[],dummy={alive:true,position:new Vector3(2,0,0),kill:(x,z,f)=>calls.push({x,z,f})};const host=Object.assign(Object.create(PackAdapter.prototype),{app:{character:{position:new Vector3()}},_byId:new Map([['dummy:0',dummy]]),scope:null});
  host._applyEffect({...effect,from:[2,0]});assert.equal(calls[0].f,settings.dummies.hit);
  host._applyEffect({...effect,from:[2,0],hitForce:force});assert.deepEqual(calls[1].f,force);assert.equal(calls[1].x,1);assert.equal(calls[1].z,0);
});
test('standalone dummy hits validate and apply the same authored force',()=>{
  const calls=[],dummy={alive:true,position:new Vector3(2,0,0),kill(x,z,f){calls.push({x,z,f});this.alive=false;return true;}},ctx={character:{position:new Vector3()},dummies:{slots:[{dummy}]},expansionCombat:{enabled:()=>false,bind:()=>({})}},scope=bindExpansionCombat(ctx,'matrix-expansion/test');
  const id=scope.queryActors({position:[2,0,0],radius:1}).actors[0].id;assert.equal(scope.emit({type:'hit',targetIds:[id],damage:1,hitForce:{...force,spin:99}}).ok,false);assert.equal(calls.length,0);
  assert.equal(scope.emit({type:'hit',targetIds:[id],damage:1,hitForce:force}).ok,true);assert.deepEqual(calls[0].f,force);
});
