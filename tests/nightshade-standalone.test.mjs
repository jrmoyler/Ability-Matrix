import test from 'node:test';
import assert from 'node:assert/strict';
import { Scene, Vector3 } from 'three';
import { settings } from '../packs/sandbox/src/config/settings.js';
import { CombatStateManager } from '../packs/sandbox/src/combat/ucsm/CombatStateManager.js';
import { ExpansionCombatAdapter } from '../packs/sandbox/src/combat/ucsm/ExpansionCombatAdapter.js';
import { NightshadeInheritanceAbility, ID } from '../packs/sandbox/src/abilities/expansion-2026/shadow/NightshadeInheritanceAbility.js';
import config from '../packs/sandbox/src/abilities/expansion-2026/shadow/nightshade-inheritance.config.js';
settings[ID]=structuredClone(config.settings);
function arena(positions=[5,6]){
  const actors=positions.map(x=>({alive:true,position:new Vector3(x,0,0),kill(dx,dz){if(!this.alive)return false;this.lastDirection=[dx,dz];this.alive=false;return true;}}));
  const mode={enabled:false,epoch:0},manager=new CombatStateManager();
  const bridge=new ExpansionCombatAdapter(manager,{enabled:()=>mode.enabled,modeVersion:()=>mode.epoch});
  const ctx={scene:new Scene(),character:{position:new Vector3()},dummies:{slots:actors.map(dummy=>({dummy}))},lights:{acquire:()=>({}),set(){},release(){}},expansionCombat:bridge};
  return {actors,mode,manager,bridge,a:new NightshadeInheritanceAbility(ctx)};
}
const tick=(a,n)=>{for(let i=0;i<n*60;i++)a.update(1/60);};
test('disabled shadow marks a real target and strikes a successor on observed death',()=>{
  const {actors,manager,bridge,a}=arena();a.spawn(new Vector3(),new Vector3(1,0,0),5);tick(a,.7);assert.ok(a.targetId);assert.equal(a.shade.visible,true);assert.ok(actors.every(d=>d.alive));actors[0].kill();tick(a,.1);assert.equal(a.transfers,1);assert.equal(actors[1].alive,false);assert.equal(manager.queue.length,0);a.destroy();a.dispose();bridge.dispose();
});
test('a combat mode round trip cancels the standalone mark without striking',()=>{
  const {actors,mode,manager,bridge,a}=arena();a.spawn(new Vector3(),new Vector3(1,0,0),5);tick(a,.7);assert.ok(a.targetId);mode.enabled=true;mode.epoch++;mode.enabled=false;mode.epoch++;actors[0].kill();tick(a,.1);assert.equal(a.targetId,null);assert.equal(a.failure,'combat mode changed during cast');assert.equal(a.transfers,0);assert.equal(actors[1].alive,true);assert.equal(manager.queue.length,0);a.destroy();a.dispose();bridge.dispose();
});
test('disabled sandbox dummies cannot receive a standalone mark',()=>{
  const {actors,bridge,a}=arena(),enabled=settings.dummies.enabled;try{settings.dummies.enabled=false;a.spawn(new Vector3(),new Vector3(1,0,0),5);tick(a,.7);assert.equal(a.targetId,null);assert.equal(a.shade.visible,false);assert.ok(actors.every(d=>d.alive));}finally{settings.dummies.enabled=enabled;a.destroy();a.dispose();bridge.dispose();}
});

test('a replaced marked dummy releases the mark without transferring or striking',()=>{const {actors,bridge,a}=arena();let generation=0;a.ctx.dummies.standGeneration=()=>generation;a.spawn(new Vector3(),new Vector3(1,0,0),5);tick(a,.7);assert.ok(a.targetId);generation++;tick(a,.1);assert.equal(a.targetId,null);assert.equal(a.failure,'marked target was replaced');assert.equal(a.transfers,0);assert.ok(actors.every(d=>d.alive));a.destroy();a.dispose();bridge.dispose();});

test('standalone inheritance sends its strike away from the defeated host, not the caster',()=>{
  const {actors,bridge,a}=arena([5,4]);
  a.spawn(new Vector3(),new Vector3(1,0,0),5);tick(a,.7);
  actors[0].kill(1,0);tick(a,.1);
  assert.equal(a.transfers,1);
  assert.deepEqual(actors[1].lastDirection,[-1,0]);
  a.destroy();a.dispose();bridge.dispose();
});
