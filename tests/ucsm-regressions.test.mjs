import test from 'node:test';
import assert from 'node:assert/strict';
import { Vector3 } from 'three';
import { registerHooks } from 'node:module';
registerHooks({ load(url, context, nextLoad) { return url.endsWith('.css') ? { format: 'module', source: '', shortCircuit: true } : nextLoad(url, context); } });
const { PackAdapter } = await import('../packs/sandbox/src/combat/ucsm/PackAdapter.js');
import { Dummy } from '../packs/sandbox/src/combat/Dummy.js';
import { CombatStateManager } from '../packs/sandbox/src/combat/ucsm/CombatStateManager.js';
import { MechanicSystems } from '../packs/sandbox/src/combat/ucsm/mechanics/MechanicSystems.js';
import { STANCE_VARIANTS } from '../packs/sandbox/src/combat/ucsm/mechanics/stance-presets.js';

 test('line cover uses a snapshot of the attack origin after caster and ability move', () => {
  const m = new CombatStateManager();
  m.upsertEntity({ id: 'caster', teamId: 'player', position: [9, 0, 9] });
  let queried;
  const adapter = Object.create(PackAdapter.prototype);
  Object.assign(adapter, { enabled: true, manager: m, _meta: new WeakMap(), _tracked: new Set(), _wrapped: new WeakSet(), mechanics: { systems: { worldshape: { blocked: (a, b) => { queried = [a, b]; return true; } } } }, app: { abilities: { active: [], cast() {} }, dummies: {} } });
  adapter._install();
  const ability = { origin: new Vector3(0, 0, 0), element: 'fire', update() {} };
  adapter._tagNew([ability], new Set(), () => 'linear/meteor', { castShapeOf: () => 'line' });
  ability.origin.set(7, 0, 7);
  const dummy = { __ucsmAdapter: adapter, position: new Vector3(0, 0, 10) };
  adapter._within(ability, () => Dummy.prototype.kill.call(dummy));
  assert.deepEqual(queried, [[0, 0, 0], [0, 0, 10]]);
});

test('Thundergod chains after two real sandbox knockdown/freeze reports, excluding reactions', () => {
  const m = new CombatStateManager();
  m.upsertEntity({ id: 'caster', teamId: 'player', position: [0, 0, 0], health: 5 });
  const systems = new MechanicSystems(m), profile = STANCE_VARIANTS[2];
  const adapter = Object.create(PackAdapter.prototype);
  Object.assign(adapter, {
    enabled: true, manager: m, scope: null, _ids: new WeakMap(), _byId: new Map(), _nextDummy: 0,
    mechanics: { systems }, app: { abilities: { active: [], cast() {} }, dummies: {} }
  });
  adapter._install();
  const makeDummy = (x) => {
    const d = Object.create(Dummy.prototype);
    Object.assign(d, {
      state: 'alive', __ucsmAdapter: adapter,
      root: { position: new Vector3(x, 0, 0), updateWorldMatrix() {} },
      mixer: { stopAllAction() {} }, parts: [{}], _fall() {}
    });
    const id = adapter._dummyId(d);
    m.upsertEntity({ id, teamId: 'targets', position: [x, 0, 0], health: 10 });
    return { d, id };
  };
  const first = makeDummy(1), second = makeDummy(2), bystander = makeDummy(3), reactionBody = makeDummy(2.5);
  assert.equal(systems.command({ family: 'stance', uid: profile.uid }).ok, true);
  for (let i = 0; i <= systems.t(profile.anticipation); i++) m.advance();
  const scope = { uid: 'linear/thunder', element: 'storm', castId: 'cast:real', depth: 0, isLine: false };
  adapter.scope = scope;
  assert.equal(first.d.freeze(), true);
  m.setAlive(first.id, first.d.alive); // mirrors the adapter's frame sync
  m.advance();
  assert.equal(systems.stance.active.get('caster').hits, 1);
  adapter.scope = { ...scope, reactionId: 'reaction:other', depth: 1 };
  assert.equal(reactionBody.d.kill(1, 0, {}), true);
  m.setAlive(reactionBody.id, reactionBody.d.alive);
  m.advance();
  assert.equal(systems.stance.active.get('caster').hits, 1, 'reaction does not count as a standard-cast takedown');
  adapter.scope = scope;
  assert.equal(second.d.kill(1, 0, {}), true);
  m.setAlive(second.id, second.d.alive);
  m.advance(); m.advance();
  const reports = m.recentEvents.filter((e) => e.tags.includes('sandbox-kill') || e.tags.includes('sandbox-freeze'));
  assert.deepEqual(reports.map((e) => e.tags[0]), ['sandbox-freeze', 'sandbox-kill']);
  const arc = m.recentEvents.find((e) => e.tags.includes('stance-arc'));
  assert.deepEqual(arc.targetIds, [bystander.id]);
  assert.ok(m.entities.get(bystander.id).health < 10);
});

test('same-tick interruption cancels extracted mechanic damage and terrain while preserving standard attacks', () => {
  const m = new CombatStateManager();
  m.upsertEntity({ id: 'caster', teamId: 'player' });
  m.upsertEntity({ id: 'enemy', teamId: 'enemy', position: [8, 0, 0], health: 10 });
  const s = new MechanicSystems(m);
  const c = { id: 'ridge', family: 'worldshape', ownerId: 'caster', position: [0, 0, 6], direction: [0, 0, 1] };
  assert.equal(s.worldshape.activate(c), null);
  m.advance();
  assert.equal(s.worldshape.regions.size, 1);
  assert.ok(m.regions.has('rg:ridge:terrain-impact'));
  m.submit({ type: 'interrupt', ownerId: 'enemy', teamId: 'enemy', abilityUid: 'linear/fire', element: 'fire', targetIds: ['caster'] });
  const base = { ownerId: 'caster', teamId: 'player', abilityUid: 'mechanics/weave', element: 'fire', mechanic: 'weave', position: [0, 0, 0] };
  m.submit({ ...base, eventId: 'cancel-hit', type: 'hit', targetIds: ['enemy'], damage: 2 });
  m.submit({ ...base, eventId: 'cancel-terrain', type: 'terrain-impact', shape: { kind: 'disc', x: 20, z: 20, r: 1 } });
  m.submit({ ...base, eventId: 'standard-hit', mechanic: 'standard', type: 'hit', targetIds: ['enemy'], damage: 1 });
  m.advance();
  assert.equal(m.entities.get('enemy').health, 9);
  assert.equal(s.worldshape.regions.size, 0);
  assert.equal(m.regions.has('rg:ridge:terrain-impact'), false);
  assert.equal(m.regions.has('rg:cancel-terrain'), false);
  assert.equal(m.recentEvents.some(e => e.eventId === 'cancel-hit' || e.eventId === 'cancel-terrain'), false);
  assert.equal(m.drain().effects.filter(e => e.kind === 'damage').length, 1);
});
