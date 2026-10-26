import test from 'node:test';
import assert from 'node:assert/strict';
import { Group, Scene, Vector3 } from 'three';
import { ParticleEngine } from '../../packs/sandbox/src/particles/ParticleEngine.js';
import { frame } from '../../packs/sandbox/src/core/FrameUniforms.js';
import { settings } from '../../packs/sandbox/src/config/settings.js';
import config from '../../packs/sandbox/src/abilities/expansion-2026/void/hollow-meridian.config.js';
import { HollowMeridianAbility, ID } from '../../packs/sandbox/src/abilities/expansion-2026/void/HollowMeridianAbility.js';
import { MeridianFractures } from '../../packs/sandbox/src/abilities/expansion-2026/void/HollowMeridianFX.js';

function setup(accept = true) {
  settings[ID] = structuredClone(config.settings);
  const scene = new Scene(), particles = new ParticleEngine(scene), events = [];
  const scope = {
    queryActors: ({position}) => ({ok:true, actors:[{id:'enemy',alive:true,position}]}),
    isBlocked: () => ({ok:true, blocked:false}),
    emit: event => (events.push(event), accept ? {ok:true} : {ok:false,reason:'rejected'}),
  };
  const a = new HollowMeridianAbility({
    particles, lights:{acquire:()=>({}),set(){},release(){}},
    expansionCombat:{bind:()=>scope},
    bursts:{spawn(){throw new Error('generic burst must not be used');}},
    decals:{spawn(){throw new Error('generic decal must not be used');}},
  });
  a.spawn(new Vector3(), new Vector3(0,0,1), 8);
  return {a, particles, events, scope};
}
function step(a, n) { for(let i=0;i<n;i++) {frame.uTime.value=i/60; a.update(1/60);} }

test('travel trails and three accepted breaches have distinct positioned phase cues', () => {
  const {a, particles, events} = setup();
  step(a, 15);
  const system = particles.systems.get('expansion.hollow-meridian-cut');
  assert.ok(system.cursor > 0, 'travelling cut emits its own directional streaks');
  assert.ok(a.fractures.surfaces.every(({mesh})=>!mesh.visible));
  while(a.nextIndex<3 && a.age<5) step(a,1);
  assert.equal(events.length,3);
  assert.deepEqual(events.map(e=>e.position[2]), [2,4,6]);
  assert.deepEqual(a.fractures.surfaces.map(({mesh})=>mesh.visible),[true,true,true]);
  assert.deepEqual(a.fractures.surfaces.map(({mesh})=>mesh.position.z), [2,4,6]);
  assert.ok(a.fractures.surfaces[0].material.uniforms.progress.value > a.fractures.surfaces[2].material.uniforms.progress.value);
  a.destroy();
  assert.ok(a.fractures.surfaces.every(({mesh})=>!mesh.visible));
  a.dispose(); particles.dispose();
});

test('a refused breach cannot create its contact fracture or its split jets', () => {
  const {a, particles, events} = setup(false);
  while (a.phase === 'travel') step(a,1);
  const system = particles.systems.get('expansion.hollow-meridian-cut');
  const travelCursor = system.cursor;
  step(a, 100);
  assert.ok(events.length > 0);
  assert.equal(a.nextIndex,0);
  assert.equal(system.cursor, travelCursor);
  assert.ok(a.fractures.surfaces.every(({mesh})=>!mesh.visible));
  a.destroy(); a.dispose(); particles.dispose();
});

test('fracture geometry is pooled and reduced motion shows a static complete cut', () => {
  const rig = new Group(), f = new MeridianFractures(rig);
  f.update(1,.03,1,config.settings,8,true);
  assert.equal(f.surfaces[1].material.uniforms.progress.value,1);
  assert.equal(f.surfaces[1].mesh.position.z,4);
  assert.equal(f.surfaces[1].mesh.visible,true);
  assert.ok(f.surfaces.every(({mesh})=>mesh.geometry===f.geometry));
  let count=0;
  f.geometry.addEventListener('dispose',()=>count++);
  f.dispose();
  f.dispose();
  assert.equal(count,1);
  assert.equal(rig.children.length,0);
});


test('a temporarily unavailable cover query cannot silently consume a breach', () => {
  const {a, particles, events, scope} = setup();
  let available=false;
  scope.isBlocked=()=>available?{ok:true,blocked:false}:{ok:false,reason:'terrain unavailable'};
  while(a.phase==='travel')step(a,1);
  step(a,21);
  assert.equal(a.nextIndex,0);
  assert.equal(a.failure,'terrain unavailable');
  assert.equal(events.length,0);
  available=true;step(a,20);
  assert.equal(a.nextIndex,1);
  assert.equal(events.length,1);
  a.destroy();a.dispose();particles.dispose();
});
