import test from 'node:test';
import assert from 'node:assert/strict';
import { Scene, Vector3 } from 'three';
import { settings } from '../packs/sandbox/src/config/settings.js';
import { PredatoryCanopyAbility, ID, canopyLeafGeometry } from '../packs/sandbox/src/abilities/expansion-2026/nature/PredatoryCanopyAbility.js';
import config from '../packs/sandbox/src/abilities/expansion-2026/nature/predatory-canopy.config.js';
settings[ID] = structuredClone(config.settings);
const target = (x,z) => ({ alive: true, position: new Vector3(x,0,z), hits: 0, kill() {this.hits++;this.alive=false;return true;} });
function arena() {
  const scene=new Scene(), bodies=[];
  const ctx={scene, lights:{acquire:()=>({}),set(){},release(){}}, dummies:{findTargets(x,z,r,out){out.length=0;out.push(...bodies.filter(d=>d.alive && Math.hypot(d.position.x-x,d.position.z-z)<=r));return out;}}};
  const ability=new PredatoryCanopyAbility(ctx);scene.add(ability.group);return {ability,bodies,scene};
}
const ticks=(a,seconds)=>{for(let i=0;i<Math.ceil(seconds*60);i++)a.update(1/60);};
test('canopy waits above target area, attacks one entrant after the warning, and resets for reuse',()=>{
  const {ability:a,bodies}=arena(), d=target(30,0);bodies.push(d);
  a.spawn(new Vector3(0,0,0),new Vector3(1,0,0),5);ticks(a,1.2);
  assert.equal(a.root.visible,true);assert.equal(d.hits,0);
  d.position.set(5,0,0);ticks(a,.15);assert.equal(d.hits,0);
  ticks(a,.4);assert.equal(d.hits,1);ticks(a,1);assert.equal(d.hits,1);
  a.destroy();assert.equal(a.root.visible,false);assert.equal(a._target,null);
  d.alive=true;a.spawn(new Vector3(0,0,0),new Vector3(1,0,0),5);ticks(a,1.6);assert.equal(d.hits,2);a.destroy();a.dispose();
});
test('escaped targets do not take a delayed trap hit',()=>{
  const {ability:a,bodies}=arena(), d=target(5,0);bodies.push(d);
  a.spawn(new Vector3(),new Vector3(1,0,0),5);ticks(a,1);d.position.x=30;ticks(a,1);assert.equal(d.hits,0);a.destroy();a.dispose();
});
test('authored foliage is finite and every owned GPU resource is disposed',()=>{
  const g=canopyLeafGeometry(),p=g.attributes.position;assert.ok(p.count>100);for(let i=0;i<p.count;i++)assert.ok(Number.isFinite(p.getX(i))&&Number.isFinite(p.getY(i))&&Number.isFinite(p.getZ(i)));g.dispose();
  const {ability:a,scene}=arena();let disposed=0;for(const r of [...a.geometries,...a.materials])r.addEventListener('dispose',()=>disposed++);
  a.dispose();assert.equal(disposed,a.geometries.length+a.materials.length);assert.equal(scene.children.length,0);
});
