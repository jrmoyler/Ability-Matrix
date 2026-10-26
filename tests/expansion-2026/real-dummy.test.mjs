import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { Vector3 } from 'three';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';
import { Dummy } from '../../packs/sandbox/src/combat/Dummy.js';
import { DummyField } from '../../packs/sandbox/src/combat/DummyField.js';
import { settings } from '../../packs/sandbox/src/config/settings.js';
import { BATCH_C } from '../../packs/sandbox/src/abilities/expansion-2026/batch-c.js';
import { CombatStateManager } from '../../packs/sandbox/src/combat/ucsm/CombatStateManager.js';
import { MechanicSystems } from '../../packs/sandbox/src/combat/ucsm/mechanics/MechanicSystems.js';
import { ExpansionCombatAdapter } from '../../packs/sandbox/src/combat/ucsm/ExpansionCombatAdapter.js';
import { registerHooks } from 'node:module';
registerHooks({ load(url, context, next) { return url.endsWith('.css') ? { format:'module', source:'', shortCircuit:true } : next(url, context); } });
const { PackAdapter } = await import('../../packs/sandbox/src/combat/ucsm/PackAdapter.js');

test('five targeted candidates strike the actual animated sandbox dummy', () => {
  const bytes = readFileSync(new URL('../../packs/sandbox/public/models/dummy.fbx', import.meta.url));
  const root = new FBXLoader().parse(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), '');
  const ids = ['borrowedTomorrow', 'momentumLedger', 'spellwrightsGambit', 'mirageProcession', 'vectorBreakwater'];
  for (const id of ids) {
    const { module: { Ability, config } } = BATCH_C.find(({ module }) => module.ID === id);
    settings[id] = structuredClone(config.settings);
    const env = { registerShadowCasterWithPatch() {} };
    const target = new Dummy({ source: root, clip: root.animations[0], scale: .01, offset: {x:0,y:0,z:0}, forwardYaw: 0, environment: env });
    target.root.position.set(0, 0, 5);
    target.root.updateWorldMatrix(true, true);
    const field = new DummyField(env);
    field.slots.push({ dummy: target, wait: 0 });
    const character = { position: new Vector3() };
    const ability = new Ability({ dummies: field, character, lights: { acquire: () => ({}), set() {}, release() {} } });
    ability.spawn(new Vector3(), new Vector3(0, 0, 1), 5);
    for (let i = 0; i < 240 && target.alive; i++) {
      if (id === 'momentumLedger') character.position.x += .02;
      ability.update(1 / 60);
      target.update(1 / 60);
    }
    assert.equal(target.alive, false, `${id} reaches an actual sandbox actor`);
    ability.destroy(); ability.dispose(); target.dispose(); delete settings[id];
  }
});

test('targets beyond the actual attack footprint survive each targeted candidate', () => {
  const bytes = readFileSync(new URL('../../packs/sandbox/public/models/dummy.fbx', import.meta.url));
  const root = new FBXLoader().parse(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), '');
  const ids = ['borrowedTomorrow', 'momentumLedger', 'spellwrightsGambit', 'mirageProcession', 'vectorBreakwater'];
  for (const id of ids) {
    const { module: { Ability, config } } = BATCH_C.find(({ module }) => module.ID === id);
    settings[id] = structuredClone(config.settings);
    const env = { registerShadowCasterWithPatch() {} };
    const target = new Dummy({ source: root, clip: root.animations[0], scale: .01, offset: {x:0,y:0,z:0}, forwardYaw: 0, environment: env });
    target.root.position.set(7, 0, 3);
    target.root.updateWorldMatrix(true, true);
    const field = new DummyField(env);
    field.slots.push({ dummy: target, wait: 0 });
    const ability = new Ability({ dummies: field, character: {position: new Vector3()}, lights: {acquire: () => ({}), set() {}, release() {}} });
    ability.spawn(new Vector3(), new Vector3(0, 0, 1), 5);
    for (let i = 0; i < 240 && ability.isActive; i++) {
      ability.update(1 / 60);
      target.update(1 / 60);
    }
    assert.equal(target.alive, true, `${id} must not hit an out-of-footprint sandbox actor`);
    ability.destroy(); ability.dispose(); target.dispose(); delete settings[id];
  }
});

test('fabricator damage travels through combat outbox into a real sandbox dummy', () => {
  const bytes = readFileSync(new URL('../../packs/sandbox/public/models/dummy.fbx', import.meta.url));
  const root = new FBXLoader().parse(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), '');
  const env = { registerShadowCasterWithPatch() {} };
  const target = new Dummy({ source:root, clip:root.animations[0], scale:.01, offset:{x:0,y:0,z:0}, forwardYaw:0, environment:env });
  target.root.position.set(1, 0, 5);
  const originalKill = target.kill.bind(target);
  let knockback = null;
  target.kill = (...args) => { knockback = args.slice(0,2); return originalKill(...args); };
  target.root.updateWorldMatrix(true, true);
  const manager = new CombatStateManager();
  manager.upsertEntity({id:'caster', teamId:'player', health:1});
  manager.upsertEntity({id:'dummy:0', teamId:'enemy', health:1, position:[1,0,5]});
  new MechanicSystems(manager);
  const bridge = new ExpansionCombatAdapter(manager);
  const { module } = BATCH_C.find(({ module }) => module.ID === 'adaptiveFabricator');
  settings[module.ID] = structuredClone(module.config.settings);
  const ability = new module.Ability({ expansionCombat:bridge, lights:{acquire:()=>({}), set(){}, release(){}} });
  const host = Object.assign(Object.create(PackAdapter.prototype), { _byId:new Map([['dummy:0', target]]), scope:null, app:{} });
  ability.spawn(new Vector3(), new Vector3(0, 0, 1), 5);
  for (let i = 0; i < 360 && target.alive; i++) {
    ability.update(1 / 60);
    if (i % 2 === 0) {
      manager.advance();
      const { effects } = manager.drain();
      for (const effect of effects) host._applyEffect(effect);
    }
    target.update(1 / 60);
  }
  assert.equal(target.alive, false, 'committed bridge damage must reach the visible actor');
  assert.ok(knockback[0] > .99 && Math.abs(knockback[1]) < .01, 'knockback points from turret to struck dummy');
  ability.destroy(); ability.dispose(); bridge.dispose(); target.dispose(); delete settings[module.ID];
});

test('pulse covenant secondary damage reaches a real nearby sandbox dummy', () => {
  const bytes = readFileSync(new URL('../../packs/sandbox/public/models/dummy.fbx', import.meta.url));
  const root = new FBXLoader().parse(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), '');
  const env = { registerShadowCasterWithPatch() {} };
  const target = new Dummy({source:root, clip:root.animations[0], scale:.01, offset:{x:0,y:0,z:0}, forwardYaw:0, environment:env});
  target.root.position.set(1, 0, 5); target.root.updateWorldMatrix(true, true);
  const manager = new CombatStateManager();
  manager.upsertEntity({id:'caster', teamId:'player', health:1});
  manager.upsertEntity({id:'first', teamId:'enemy', health:1, position:[0,0,5]});
  manager.upsertEntity({id:'dummy:0', teamId:'enemy', health:1, position:[1,0,5]});
  new MechanicSystems(manager);
  const bridge = new ExpansionCombatAdapter(manager);
  const { module } = BATCH_C.find(({ module }) => module.ID === 'pulseCovenant');
  settings[module.ID] = {...structuredClone(module.config.settings), damage:1};
  const ability = new module.Ability({expansionCombat:bridge, character:{position:new Vector3()}, lights:{acquire:()=>({}), set(){}, release(){}}});
  const host = Object.assign(Object.create(PackAdapter.prototype), { _byId:new Map([['dummy:0', target]]), scope:null, app:{} });
  ability.spawn(new Vector3(), new Vector3(0,0,1), .1);
  const hit = (id) => manager.submit({type:'hit', element:'force', abilityUid:'legacy/test', castId:id, ownerId:'caster', teamId:'player', targetIds:['first'], position:[0,0,5], damage:0});
  hit('first-cast');
  for (let i = 0; i < 25 && target.alive; i++) {
    if (i === 18) hit('second-cast');
    manager.advance();
    const { effects } = manager.drain();
    for (const effect of effects) host._applyEffect(effect);
    ability.update(1 / 30);
  }
  assert.equal(target.alive, false, 'secondary blood damage must reach the visible nearby actor');
  ability.destroy(); ability.dispose(); bridge.dispose(); target.dispose(); delete settings[module.ID];
});
