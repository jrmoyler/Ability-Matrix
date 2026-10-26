import test from 'node:test';import assert from 'node:assert/strict';import { Scene, Vector3 } from 'three';
import { settings } from '../packs/sandbox/src/config/settings.js';
import { CelestialCartographyAbility, ID, starGeometry, beamGeometry } from '../packs/sandbox/src/abilities/expansion-2026/cosmic/CelestialCartographyAbility.js';
import config from '../packs/sandbox/src/abilities/expansion-2026/cosmic/celestial-cartography.config.js';
settings[ID]=structuredClone(config.settings);
function arena(){const bodies=[],scene=new Scene(),ctx={scene,lights:{acquire:()=>({}),set(){},release(){}},dummies:{findTargets(x,z,r,out){out.length=0;out.push(...bodies.filter(d=>d.alive&&Math.hypot(d.position.x-x,d.position.z-z)<=r));return out;}}};const a=new CelestialCartographyAbility(ctx);scene.add(a.group);return {a,bodies,scene};}
const tick=(a,n)=>{for(let i=0;i<n*60;i++)a.update(1/60);};
const dummy=(x,z)=>({alive:true,position:new Vector3(x,0,z),hits:0,kill(){this.hits++;this.alive=false;return true;}});
test('constellation waits for a target then strikes only the marked location after its warning',()=>{const {a,bodies}=arena(),d=dummy(30,0);bodies.push(d);a.spawn(new Vector3(),new Vector3(1,0,0),5);tick(a,1);assert.equal(d.hits,0);d.position.x=5;tick(a,.2);assert.equal(d.hits,0);tick(a,.5);assert.equal(d.hits,1);tick(a,1);assert.equal(d.hits,1);a.destroy();a.dispose();});
test('marked target can evade by leaving before the strike lands',()=>{const {a,bodies}=arena(),d=dummy(5,0);bodies.push(d);a.spawn(new Vector3(),new Vector3(1,0,0),5);tick(a,.9);d.position.x=8;tick(a,1);assert.equal(d.hits,0);a.destroy();a.dispose();});
test('star and beam geometry are finite and the ability disposes owned resources',()=>{for(const g of [starGeometry(),beamGeometry()]){const p=g.attributes.position;assert.ok(p.count>20);for(let i=0;i<p.count;i++)assert.ok(Number.isFinite(p.getX(i))&&Number.isFinite(p.getY(i))&&Number.isFinite(p.getZ(i)));g.dispose();}const {a,scene}=arena();let count=0;for(const x of [...a.gs,...a.ms])x.addEventListener('dispose',()=>count++);a.dispose();assert.equal(count,a.gs.length+a.ms.length);assert.equal(scene.children.length,0);});

test('strike releases a brief corona at the marked location',()=>{const {a,bodies}=arena();bodies.push(dummy(5,0));a.spawn(new Vector3(),new Vector3(1,0,0),5);tick(a,1.25);assert.equal(a._struck,true);assert.equal(a.flare.visible,true);assert.equal(a.flareRings.length,3);assert.equal(a.flare.position.x,0);tick(a,.6);assert.equal(a.flare.visible,false);a.destroy();a.dispose();});
