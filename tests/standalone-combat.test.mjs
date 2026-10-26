import test from 'node:test';
import assert from 'node:assert/strict';
import { Vector3 } from 'three';
import { bindExpansionCombat } from '../packs/sandbox/src/abilities/expansion-2026/StandaloneCombat.js';

function arena(){
  const dummy={alive:true,position:new Vector3(2,0,0),kills:0,kill(x,z,force){assert.ok(Number.isFinite(x)&&Number.isFinite(z));assert.ok(force.impulse>0);if(!this.alive)return false;this.kills++;this.alive=false;return true;}};
  const state={enabled:false};const live={queryActors:()=>({ok:true,actors:[{id:'live'}]}),getActor:()=>({ok:false}),isBlocked:()=>({ok:true,blocked:true}),on:()=>({ok:true,unsubscribe(){}}),emit:()=>({ok:true,eventId:'live'})};
  const ctx={character:{position:new Vector3()},dummies:{slots:[{dummy}]},expansionCombat:{enabled:()=>state.enabled,bind:()=>live}};
  return {dummy,state,ctx,scope:bindExpansionCombat(ctx,'matrix-expansion/example')};
}
test('disabled manager uses actual dummies and applies accumulated hits without fabricating statuses',()=>{
  const {dummy,scope}=arena(),q=scope.queryActors({position:[2,0,0],radius:1,relation:'enemy'});assert.equal(q.ok,true);assert.equal(q.actors.length,1);
  const id=q.actors[0].id,hit=damage=>scope.emit({type:'hit',targetIds:[id],damage});
  assert.equal(hit(.25).ok,true);assert.equal(dummy.alive,true);assert.equal(hit(.35).ok,true);assert.equal(dummy.alive,true);assert.equal(hit(.45).ok,true);assert.equal(dummy.alive,false);assert.equal(dummy.kills,1);
  assert.equal(scope.emit({type:'status',targetIds:[id]}).ok,false);assert.equal(scope.on('hit',()=>{}).ok,false);
  dummy.alive=true;assert.equal(scope.getActor(id).actor.health,1);assert.equal(hit(1).ok,true);assert.equal(dummy.kills,2);
});
test('scope fails closed on a mid-cast toggle and without a dummy world',()=>{
  const {state,scope}=arena();assert.equal(scope.standalone,true);assert.equal(scope.isBlocked([0,0,0],[1,0,0]).blocked,false);
  state.enabled=true;assert.equal(scope.standalone,false);assert.equal(scope.queryActors({}).reason,'combat mode changed during cast');assert.equal(scope.isBlocked([0,0,0],[1,0,0]).ok,false);
  const noWorld=bindExpansionCombat({expansionCombat:{enabled:()=>false,bind:()=>({})}},'matrix-expansion/example');assert.equal(noWorld.queryActors({position:[0,0,0],radius:1}).ok,false);
});

test('partial standalone damage does not leak into another cast or a reused dummy',()=>{const {ctx,scope}=arena(),id=scope.queryActors({position:[2,0,0],radius:1}).actors[0].id;assert.equal(scope.emit({type:'hit',targetIds:[id],damage:.6}).ok,true);const next=bindExpansionCombat(ctx,'matrix-expansion/example');assert.equal(next.getActor(id).actor.health,1);});

test('observed defeats clear partial standalone damage before a dummy respawns',()=>{const {dummy,scope}=arena(),query=()=>scope.queryActors({position:[2,0,0],radius:1}),id=query().actors[0].id;scope.emit({type:'hit',targetIds:[id],damage:.6});dummy.alive=false;assert.equal(query().actors.length,0);dummy.alive=true;assert.equal(query().actors[0].health,1);});
