import test from 'node:test';
import assert from 'node:assert/strict';
import { Scene, Vector3 } from 'three';
import { candidates, installExpansionHarness } from '../../packs/sandbox/src/dev/ExpansionHarness.js';
import { expansionRoster } from '../../packs/sandbox/src/abilities/expansion-2026/ProductionRoster.js';
import { settings, ELEMENTS } from '../../packs/sandbox/src/config/settings.js';
import { AbilityManager } from '../../packs/sandbox/src/abilities/AbilityManager.js';
import { CombatStateManager } from '../../packs/sandbox/src/combat/ucsm/CombatStateManager.js';
import { registerHooks } from 'node:module';
registerHooks({ load(url, context, next) { return url.endsWith('.css') ? { format: 'module', source: '', shortCircuit: true } : next(url, context); } });
const { PackAdapter } = await import('../../packs/sandbox/src/combat/ucsm/PackAdapter.js');
import { ExpansionCombatAdapter } from '../../packs/sandbox/src/combat/ucsm/ExpansionCombatAdapter.js';

class Element { constructor() { this.children = []; this.style = {}; this.value = ''; } append(...els) { this.children.push(...els); if (!this.value && els[0]?.value) this.value = els[0].value; } setAttribute() {} addEventListener() {} remove() { this.removed = true; } }
const gui = { addFolder() { return { add(){return {name(){return this;}}}, addColor(){return {name(){return this;}}}, close(){}, destroy(){} }; } };
test('opt-in harness installs all candidates, editors and real combat adapter without changing native slots', () => {
  globalThis.document = { createElement: () => new Element(), body: new Element() };
  const original = [...ELEMENTS];
  const combatManager = new CombatStateManager();
  combatManager.upsertEntity({ id:'caster', teamId:'player', health:10 });
  const bridge = new ExpansionCombatAdapter(combatManager);
  const ctx = { scene:new Scene(), lights:{acquire:()=>({}),release(){},set(){}}, character:{position:new Vector3()}, dummies:{findTargets:()=>[]}, expansionCombat:bridge };
  const manager = new AbilityManager(ctx);
  const app = {abilities:manager, character:ctx.character, editor:{gui}};
  const host = Object.assign(Object.create(PackAdapter.prototype), { app, manager: combatManager, enabled: true, scope: null, _meta: new WeakMap(), _wrapped: new WeakSet(), _tracked: new Set() });
  app.combat = host;
  const harness = installExpansionHarness(app);
  assert.equal(candidates.length, expansionRoster().length);
  assert.deepEqual(new Set(candidates.map(x => x.uid)), new Set(expansionRoster().map(x => x.uid)));
  assert.equal(new Set(candidates.map(x=>x.config.meta.element)).size, 23);
  assert.deepEqual(ELEMENTS, original);
  const errors=[];
  for (const item of candidates) {
    try {
      const folder = item.buildEditor(gui,settings[item.ID], {range:(f,c,k,...rest)=>f.add(c,k,...rest)});
      assert.ok(folder);
      const ability = harness.cast(item.ID, { heading: 90, distance: 1000 });
      const meta = host._meta.get(ability);
      assert.equal(meta.uid, item.uid);
      assert.equal(meta.element, item.config.meta.element);
      assert.equal(meta.isLine, item.config.meta.cast !== 'zone');
      assert.ok(Math.abs(ability.direction.x - 1) < 1e-6);
      assert.equal(ability.length, item.config.settings.aimStyle === 'self' ? .1 : item.config.settings.range);
      assert.ok(combatManager.queue.some(event => event.type === 'cast-start' && event.abilityUid === item.uid && event.ownerId === 'caster'));
      manager.update(1/60);
      manager.clear();
    } catch(error) { errors.push(`${item.ID}: ${error.stack}`); }
  }
  const first = candidates[0];
  const diagnostic = document.body.children[0].children.at(-1);
  host.enabled = false;
  harness.refreshDiagnostics();
  assert.match(diagnostic.textContent, /Combat is disabled/);
  const a = harness.cast(first.ID);
  a.failure = 'bridge refused';
  harness.refreshDiagnostics();
  assert.match(diagnostic.textContent, /bridge refused/);
  host.enabled = true;
  a.failure = null;
  harness.refreshDiagnostics();
  assert.equal(diagnostic.textContent, '');
  manager.clear();
  const reused = harness.cast(first.ID);
  assert.equal(reused, a);
  assert.equal(host._meta.get(reused).uid, first.uid);
  assert.throws(() => harness.cast('missing'), /Unknown/);
  manager.clear();
  const tag = host._tagNew;
  host._tagNew = () => { throw new Error('tagging failed'); };
  assert.throws(() => harness.cast(first.ID), /tagging failed/);
  assert.equal(manager.active.length, 0);
  assert.equal(manager.pools.get(first.ID).activeCount, 0);
  host._tagNew = tag;
  harness.cast(first.ID);
  harness.dispose();
  assert.equal(manager.active.length, 0);
  assert.equal(host._tracked.size, 0);
  assert.equal(settings[first.ID], undefined);
  assert.equal(manager.pools.has(first.ID), false);
  assert.equal(app.expansionDev, undefined);
  assert.throws(() => harness.cast(first.ID), /disposed/);
  manager.dispose(); bridge.dispose();
  assert.deepEqual(errors, []);
});

test('nature and cosmic hits on real dummies retain their candidate attribution', async () => {
  const { readFileSync } = await import('node:fs');
  const { FBXLoader } = await import('three/addons/loaders/FBXLoader.js');
  const { Dummy } = await import('../../packs/sandbox/src/combat/Dummy.js');
  const { DummyField } = await import('../../packs/sandbox/src/combat/DummyField.js');
  const { ParticleEngine } = await import('../../packs/sandbox/src/particles/ParticleEngine.js');
  const { frame } = await import('../../packs/sandbox/src/core/FrameUniforms.js');
  globalThis.document = { createElement: () => new Element(), body: new Element() };
  const bytes = readFileSync(new URL('../../packs/sandbox/public/models/dummy.fbx', import.meta.url));
  const root = new FBXLoader().parse(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), '');
  const env = { registerShadowCasterWithPatch() {} };
  const field = new DummyField(env);
  const scene = new Scene();
  const particles = new ParticleEngine(scene);
  const combatManager = new CombatStateManager();
  combatManager.upsertEntity({ id:'caster', teamId:'player', health:10 });
  const bridge = new ExpansionCombatAdapter(combatManager);
  const ctx = { scene, particles, lights:{acquire:()=>({}),release(){},set(){}}, character:{position:new Vector3()}, dummies:field, expansionCombat:bridge };
  const abilities = new AbilityManager(ctx);
  const app = {abilities, character:ctx.character, dummies:field, editor:{gui}, runtimes:new Map(), renderer:{gl:{domElement:{}}}, uidOf:id => `native/${id}`};
  const host = Object.assign(Object.create(PackAdapter.prototype), { app, manager:combatManager, expansionCombat:bridge, enabled:true, scope:null, _meta:new WeakMap(), _wrapped:new WeakSet(), _tracked:new Set(), _ids:new WeakMap(), _byId:new Map(), _nextDummy:0, mechanics:{beforeStep(){},update(){},cue(){},systems:{worldshape:{blocked:()=>false}}},feed:{update(){},badges(){}} });
  app.combat = host;
  host._install();
  const harness = installExpansionHarness(app);
  const seen = [];
  const subscription = bridge.bind('matrix-expansion/test-observer').on('hit', event => seen.push(event));
  let target;
  try {
    for (const item of candidates.filter(item => ['nature', 'cosmic'].includes(item.config.meta.element))) {
      target = new Dummy({ source:root, clip:root.animations[0], scale:.01, offset:{x:0,y:0,z:0}, forwardYaw:0, environment:env });
      target.root.position.set(0,0,5); target.root.updateWorldMatrix(true,true);
      field.slots = [{dummy:target, wait:0}];
      host.update(0);
      const previousSystems = new Set(particles.systems.values());
      harness.cast(item.ID);
      for (let i=0; i<360 && target.alive; i++) { frame.uTime.value=i/60; abilities.update(1/60); host.update(1/60); }
      assert.equal(target.alive, false, item.ID);
      for (let i=0; i<3; i++) host.update(1/60);
      assert.ok(seen.some(event => event.type === 'hit' && event.abilityUid === item.uid && event.element === item.config.meta.element), item.ID);
      assert.ok([...particles.systems.values()].some(system => !previousSystems.has(system) && system.cursor > 0), `${item.ID}: particles emitted`);
      abilities.clear(); target.dispose(); target = null;
    }
  } finally {
    target?.dispose(); subscription.unsubscribe(); harness.dispose(); abilities.dispose(); particles.dispose(); bridge.dispose();
  }
});

test('live candidates are excluded without replacing or disposing their state', () => {
  globalThis.document = { createElement: () => new Element(), body: new Element() };
  const ctx = {scene:new Scene(), lights:{acquire:()=>({}),release(){},set(){}}, character:{position:new Vector3()}};
  const manager = new AbilityManager(ctx);
  const item = candidates[0];
  const liveSettings = { range: 123 };
  const livePool = { dispose() { throw new Error('live pool disposed'); } };
  settings[item.ID] = liveSettings;
  manager.pools.set(item.ID, livePool);
  const app = { abilities:manager, character:ctx.character, editor:{gui}, combat:{enabled:true}, expansionLive:{byUid:new Map([[item.uid, item]])} };
  const harness = installExpansionHarness(app);
  assert.equal(harness.candidates.length, candidates.length - 1);
  assert.equal(settings[item.ID], liveSettings);
  assert.equal(manager.pools.get(item.ID), livePool);
  assert.throws(() => harness.cast(item.ID), /Unknown/);
  harness.dispose();
  assert.equal(settings[item.ID], liveSettings);
  assert.equal(manager.pools.get(item.ID), livePool);
  delete settings[item.ID];
  manager.pools.delete(item.ID);
  manager.dispose();
});
