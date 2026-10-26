import test from 'node:test';
import assert from 'node:assert/strict';
import { Vector3 } from 'three';
import { settings } from '../../packs/sandbox/src/config/settings.js';
import config from '../../packs/sandbox/src/abilities/expansion-2026/adaptive-fabricator/config.js';
import {
  Ability,
  ID,
} from '../../packs/sandbox/src/abilities/expansion-2026/adaptive-fabricator/index.js';
settings[ID] = structuredClone(config.settings);
function setup(tag, blocked = false) {
  const emitted = [];
  let n = 0;
  const enemy = { id: 'target', alive: true, position: [6, 0, 0] };
  const scope = {
    queryActors: () => ({ ok: true, actors: [enemy] }),
    isBlocked: () => ({ ok: true, blocked }),
    getActor: () => ({
      ok: true,
      actor: { ...enemy, statuses: tag ? [{ tag }] : [] },
    }),
    emit: (e) => {
      emitted.push(e);
      return { ok: true, eventId: `event:${n++}` };
    },
  };
  const ability = new Ability({
    lights: { acquire: () => ({}), release: () => {}, set: () => {} },
    expansionCombat: { bind: () => scope },
  });
  ability.spawn(new Vector3(), new Vector3(1, 0, 0), 5);
  return { ability, emitted };
}
test('fabricator fires attributed counter-elements against live exposed targets and respects cover', () => {
  for (const [status, expected] of [
    ['wet', 'storm'],
    ['burning', 'frost'],
    ['chilled', 'fire'],
    [null, 'tech'],
  ]) {
    const { ability, emitted } = setup(status);
    for (let i = 0; i < 100; i++) ability.update(1 / 60);
    assert.ok(emitted.length >= 1);
    assert.equal(emitted[0].element, expected);
    assert.deepEqual(emitted[0].targetIds, ['target']);
    assert.deepEqual(emitted[0].position, [6, 0, 0]);
    assert.deepEqual(emitted[0].sourcePosition, [5, 0, 0]);
    ability.destroy();
    ability.dispose();
  }
  const blocked = setup('wet', true);
  for (let i = 0; i < 100; i++) blocked.ability.update(1 / 60);
  assert.equal(blocked.emitted.length, 0);
  blocked.ability.destroy();
  blocked.ability.dispose();
});
test('fabricator scene allocations are bounded and resources dispose once', () => {
  const { ability } = setup();
  let n = 0;
  ability.root.traverse((o) => {
    if (o.isMesh) {
      n++;
      assert.ok(o.geometry.attributes.position.count > 0);
    }
  });
  assert.ok(n >= 10);
  let nDispose = 0;
  for (const x of ability.resources)
    x.addEventListener('dispose', () => nDispose++);
  ability.destroy();
  ability.dispose();
  ability.dispose();
  assert.equal(nDispose, ability.resources.length);
});
test('six articulated emitter vanes recoil on a real attributed shot and reset on reuse', () => {
  const { ability, emitted } = setup('wet');
  assert.equal(ability.arms.length, 6);
  const rest = ability.head.position.y;
  ability._fire();
  ability._sync();
  assert.equal(emitted[0].element, 'storm');
  assert.ok(ability.head.position.y < rest);
  assert.ok(ability.arms.every((arm) => arm.children.length === 1));
  ability.destroy();
  ability.spawn(new Vector3(), new Vector3(1, 0, 0), 5);
  assert.equal(ability.head.position.y, rest);
  ability.destroy(); ability.dispose();
});
test('fabricator chooses the nearest visible live actor instead of the first actor ID', () => {
  const events = [];
  const actors = [
    {id:'a-far', alive:true, position:[8,0,0]},
    {id:'b-blocked', alive:true, position:[5.2,0,0]},
    {id:'c-near', alive:true, position:[6,0,0]},
  ];
  const scope = {
    queryActors: () => ({ok:true, actors}),
    isBlocked: (_from, to) => ({ok:true, blocked:to[0] === 5.2}),
    getActor: () => ({ok:true, actor:{statuses:[]}}),
    emit: (event) => (events.push(event), {ok:true}),
  };
  const ability = new Ability({lights:{acquire:()=>({}),release(){},set(){}}, expansionCombat:{bind:()=>scope}});
  ability.spawn(new Vector3(), new Vector3(1,0,0), 5);
  ability._fire();
  assert.deepEqual(events[0].targetIds, ['c-near']);
  assert.deepEqual(events[0].position, [6,0,0]);
  ability.destroy(); ability.dispose();
});
test('adaptive arrival rings expand at the struck target and reset on reuse', () => {
  const { ability } = setup('wet');
  ability._fire(); ability._sync();
  assert.equal(ability.impactGroup.visible, true);
  assert.equal(ability.impactGroup.position.x, 1);
  const before = ability.impactRings[0].scale.x;
  ability.update(.3);
  assert.ok(ability.impactRings[0].scale.x > before);
  ability.update(.3);
  assert.equal(ability.impactGroup.visible, false);
  ability.destroy();
  ability.spawn(new Vector3(), new Vector3(1,0,0), 5);
  assert.equal(ability.impactGroup.visible, false);
  ability.destroy(); ability.dispose();
});
test('standalone fabricator fails closed after a combat-mode round trip',()=>{
  const mode={enabled:false,epoch:0};
  const target={alive:true,position:new Vector3(6,0,0),kill(){this.alive=false;return true;}};
  const bridge={enabled:()=>mode.enabled,modeVersion:()=>mode.epoch,bind:()=>({})};
  const a=new Ability({character:{position:new Vector3()},dummies:{slots:[{dummy:target}]},lights:{acquire:()=>({}),set(){},release(){}},expansionCombat:bridge});
  a.spawn(new Vector3(),new Vector3(1,0,0),5);
  a.update(.3);
  mode.enabled=true;mode.epoch++;mode.enabled=false;mode.epoch++;
  a.update(1);
  assert.equal(target.alive,true);
  assert.equal(a.failure,'combat mode changed during cast');
  a.destroy();a.dispose();
});
