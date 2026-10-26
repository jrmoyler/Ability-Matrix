import test from 'node:test';
import assert from 'node:assert/strict';
import { Scene, Vector3 } from 'three';
import { settings } from '../packs/sandbox/src/config/settings.js';
import { PredatoryCanopyAbility, ID, canopyLeafGeometry, canopyThornGeometry, canopyStrikeGeometry } from '../packs/sandbox/src/abilities/expansion-2026/nature/PredatoryCanopyAbility.js';
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

test('canopy spread moves branches, leaves, and tendrils together',()=>{const {ability:a}=arena();a.spawn(new Vector3(),new Vector3(1,0,0),5);ticks(a,1);const leaf=a.leaves[0].position.x,vine=a.tendrils[0].position.x,branch=a.branches[0].scale.x;a.config.canopySpread=6;ticks(a,.1);assert.equal(a.leaves[0].position.x,leaf*1.5);assert.equal(a.tendrils[0].position.x,vine*1.5);assert.equal(a.branches[0].scale.x,branch*1.5);a.config.canopySpread=4;a.destroy();a.dispose();});

test('triggered canopy raises its custom thorns during the windup',()=>{const g=canopyThornGeometry(),p=g.attributes.position;for(let i=0;i<p.count;i++)assert.ok(Number.isFinite(p.getX(i))&&Number.isFinite(p.getY(i))&&Number.isFinite(p.getZ(i)));g.dispose();const {ability:a,bodies}=arena();a.spawn(new Vector3(),new Vector3(1,0,0),5);ticks(a,1);assert.ok(a.thorns.every(t=>!t.visible));bodies.push(target(5,0));ticks(a,.15);assert.ok(a.thorns.every(t=>t.visible));const height=a.thorns[0].scale.y;ticks(a,.3);assert.ok(a.thorns[0].scale.y>height);a.destroy();a.dispose();});

test('foliage palette changes update pooled particle gradients in a live cast',()=>{const {ability:a}=arena(),gradients=[];a.leafParticles={setGradient:(...colors)=>gradients.push(colors.map(x=>x.getHexString())),emit(){}};a.moteParticles={setGradient(){},emit(){}};a.spawn(new Vector3(),new Vector3(1,0,0),5);ticks(a,.5);assert.equal(gradients.length,1);a.config.leafColor='#ff2200';ticks(a,.1);assert.equal(gradients.length,2);assert.equal(gradients[1][0],'ff2200');a.config.leafColor=config.settings.leafColor;a.destroy();a.dispose();});

test('folded leaf seed travels to the impact point and opens the canopy',()=>{const {ability:a}=arena();a.spawn(new Vector3(),new Vector3(1,0,0),5);assert.equal(a.seed.visible,true);a.update(.08);assert.ok(a.seed.position.x>0&&a.seed.position.x<5);assert.equal(a.seedLeaves.length,4);ticks(a,.5);assert.equal(a.seed.visible,false);assert.equal(a.root.visible,true);a.destroy();a.dispose();});

test('canopy descends and contracts while releasing',()=>{const {ability:a}=arena();a.spawn(new Vector3(),new Vector3(1,0,0),5);ticks(a,1);const width=a.root.scale.x,height=a.branches[0].position.y;a.onFade(0,1.5);assert.ok(a.root.scale.x<width);assert.ok(a.branches[0].position.y<height);assert.ok(a.leaves[0].position.y<height);a.destroy();a.dispose();});

test('strike vines follow the actual moving target then fade after the hit',()=>{const g=canopyStrikeGeometry(),p=g.attributes.position;for(let i=0;i<p.count;i++)assert.ok(Number.isFinite(p.getX(i))&&Number.isFinite(p.getY(i))&&Number.isFinite(p.getZ(i)));g.dispose();const {ability:a,bodies}=arena(),d=target(6,0);bodies.push(d);a.spawn(new Vector3(),new Vector3(1,0,0),5);ticks(a,1);assert.equal(a.strikeRig.visible,true);assert.equal(a.strikeMaterials[0].uniforms.uTarget.value.x,1);d.position.set(5,0,1.5);ticks(a,.1);assert.equal(a.strikeMaterials[0].uniforms.uTarget.value.x,0);assert.equal(a.strikeMaterials[0].uniforms.uTarget.value.z,1.5);ticks(a,.5);assert.equal(d.hits,1);ticks(a,.8);assert.equal(a.strikeRig.visible,false);a.destroy();a.dispose();});

test('canopy attacks the enemy nearest the cast center',()=>{const {ability:a,bodies}=arena(),far=target(7,0),near=target(5,0);bodies.push(far,near);a.spawn(new Vector3(),new Vector3(1,0,0),5);ticks(a,1.6);assert.equal(near.hits,1);assert.equal(far.hits,0);a.destroy();a.dispose();});

test('canopy leaf emissions honor global density and size controls',()=>{const {ability:a}=arena(),calls=[],count=settings.global.particleCount,size=settings.global.particleSize;const uniforms={uSizeScale:{value:1},uSpeedScale:{value:1},uLifeScale:{value:1}};a.leafParticles={uniforms,setGradient(){},emit:(n,p)=>calls.push({n,size:p.size})};a.moteParticles={setGradient(){},emit(){}};try{settings.global.particleCount=0;a.spawn(new Vector3(),new Vector3(1,0,0),5);ticks(a,1);assert.equal(calls.length,0);settings.global.particleCount=1;settings.global.particleSize=2;ticks(a,.5);assert.ok(calls.length>0);assert.equal(calls[0].size,a.config.leafSize);assert.equal(uniforms.uSizeScale.value,2);}finally{settings.global.particleCount=count;settings.global.particleSize=size;a.destroy();a.dispose();}});

test('a recycled canopy does not flash old thorns on arrival',()=>{const {ability:a,bodies}=arena();bodies.push(target(5,0));a.spawn(new Vector3(),new Vector3(1,0,0),5);ticks(a,1.2);assert.ok(a.thorns.some(t=>t.visible));a.destroy();a.spawn(new Vector3(),new Vector3(1,0,0),5);a.update(.5);assert.equal(a.root.visible,true);assert.ok(a.thorns.every(t=>!t.visible));a.destroy();a.dispose();});

test('canopy does not trigger on a target outside its actual strike radius',()=>{const {ability:a}=arena(),d=target(9.2,0);a.ctx.dummies.findTargets=(x,z,r,out)=>{out.length=0;out.push(d);return out;};a.spawn(new Vector3(),new Vector3(1,0,0),5);ticks(a,1.5);assert.equal(a._target,null);assert.equal(a._triggerAt,-1);assert.equal(d.hits,0);a.destroy();a.dispose();});
