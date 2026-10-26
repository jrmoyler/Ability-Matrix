import test from 'node:test';
import assert from 'node:assert/strict';
import { Vector3 } from 'three';
import { readFileSync } from 'node:fs';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';
import { Dummy } from '../packs/sandbox/src/combat/Dummy.js';
import { DummyField } from '../packs/sandbox/src/combat/DummyField.js';
import { bindExpansionCombat } from '../packs/sandbox/src/abilities/expansion-2026/StandaloneCombat.js';
import { settings } from '../packs/sandbox/src/config/settings.js';

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

test('resetting a real pooled dummy clears partial damage inside the same active cast',()=>{
  const bytes=readFileSync(new URL('../packs/sandbox/public/models/dummy.fbx',import.meta.url));
  const source=new FBXLoader().parse(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');
  const env={registerShadowCasterWithPatch(){}};
  const dummy=new Dummy({source,clip:source.animations[0],scale:.01,offset:{x:0,y:0,z:0},forwardYaw:0,environment:env});
  dummy.root.position.set(2,0,0);dummy.root.updateWorldMatrix(true,true);
  const field=new DummyField(env);field.slots.push({dummy,wait:0});
  const bridge={enabled:()=>false,bind:()=>({})};
  const scope=bindExpansionCombat({dummies:field,character:{position:new Vector3()},expansionCombat:bridge},'matrix-expansion/example');
  const id=scope.queryActors({position:[2,0,0],radius:1}).actors[0].id;
  assert.equal(scope.emit({type:'hit',targetIds:[id],damage:.6}).ok,true);
  assert.ok(Math.abs(scope.getActor(id).actor.health-.4)<1e-8);
  field.reset();
  assert.equal(scope.getActor(id).actor.health,1,'new placement must not inherit prior partial damage');
  assert.equal(scope.emit({type:'hit',targetIds:[id],damage:.6}).ok,true);
  assert.equal(dummy.alive,true,'fresh life survives one partial hit');
  dummy.dispose();
});

test('disabled sandbox dummies cannot be queried or damaged by a standalone cast',()=>{
  const {dummy,scope}=arena(), previous=settings.dummies.enabled;
  try {
    settings.dummies.enabled=true;
    const id=scope.queryActors({position:[2,0,0],radius:1}).actors[0].id;
    settings.dummies.enabled=false;
    assert.deepEqual(scope.queryActors({position:[2,0,0],radius:1}).actors,[]);
    assert.equal(scope.getActor(id).ok,false);
    assert.equal(scope.emit({type:'hit',targetIds:[id],damage:1}).ok,false);
    assert.equal(dummy.alive,true);
  } finally { settings.dummies.enabled=previous; }
});

test('standalone hits reject invalid source positions without changing a target',()=>{
  const {dummy,scope}=arena(),id=scope.queryActors({position:[2,0,0],radius:1}).actors[0].id;
  assert.equal(scope.emit({type:'hit',targetIds:[id],damage:1,sourcePosition:[NaN,0,0]}).ok,false);
  assert.equal(dummy.alive,true);
  assert.equal(scope.getActor(id).actor.health,1);
});
