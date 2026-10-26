import test from 'node:test';
import assert from 'node:assert/strict';
import { CombatStateManager } from '../packs/sandbox/src/combat/ucsm/CombatStateManager.js';
import { ExpansionCombatAdapter } from '../packs/sandbox/src/combat/ucsm/ExpansionCombatAdapter.js';
import { MechanicSystems } from '../packs/sandbox/src/combat/ucsm/mechanics/MechanicSystems.js';

function arena(budget = {}, options = {}) {
  const manager = new CombatStateManager(budget);
  manager.upsertEntity({ id: 'caster', teamId: 'player', health: 5 });
  manager.upsertEntity({ id: 'target', teamId: 'enemy', position: [3, 0, 0], health: 10 });
  manager.upsertEntity({ id: 'ally', teamId: 'player', position: [2, 0, 0], health: 4 });
  new MechanicSystems(manager);
  const adapter = new ExpansionCombatAdapter(manager, options);
  return { manager, adapter, scope: adapter.bind('matrix-expansion/pulse-covenant') };
}
const attack = { type: 'hit', element: 'fire', abilityUid: 'legacy/fire', ownerId: 'caster', teamId: 'player', targetIds: ['target'], position: [0, 0, 0], damage: 1 };

test('post-event notifications are deeply immutable, bounded, isolated and disposable', () => {
  const { manager, adapter, scope } = arena({}, { maxSubscriptions: 2 });
  let seen;
  const a = scope.on('hit', (event) => { seen = event; assert.throws(() => event.targetIds.push('ally')); throw new Error('extension failure'); });
  let calls = 0;
  const b = scope.on('hit', () => calls++);
  assert.equal(scope.on('hit', () => {}).reason, 'subscription budget');
  manager.submit(attack); manager.advance();
  assert.equal(seen.abilityUid, 'legacy/fire');
  assert.equal(manager.entities.get('target').health, 9);
  assert.equal(calls, 1);
  assert.deepEqual(seen.targetIds, ['target']);
  a.unsubscribe(); a.unsubscribe(); b.unsubscribe();
  adapter.dispose();
  assert.equal(manager.expansionObserver, null);
  assert.equal(scope.on('hit', () => {}).ok, false);
});

test('scoped emissions are attributed, validated, bounded and deferred to the next tick', () => {
  const { manager, scope } = arena({}, { eventsPerTick: 1 });
  let emitted, overflow;
  scope.on('cast-start', () => {
    emitted = scope.emit({ type: 'hit', element: 'blood', targetIds: ['target'], damage: 0.5, tags: ['pulse'] });
    overflow = scope.emit({ type: 'hit', element: 'blood', targetIds: ['target'] });
  });
  manager.submit({ ...attack, type: 'cast-start', targetIds: [], damage: undefined });
  manager.advance();
  assert.equal(emitted.ok, true);
  assert.equal(overflow.reason, 'event budget');
  assert.equal(manager.entities.get('target').health, 10);
  assert.equal(manager.queue[0].tick, 1);
  assert.equal(manager.queue[0].abilityUid, 'matrix-expansion/pulse-covenant');
  assert.equal(manager.queue[0].ownerId, 'caster');
  assert.equal(manager.queue[0].teamId, 'player');
  assert.equal(scope.emit({ type: 'hit', element: 'blood', targetIds: ['missing'] }).ok, false);
  assert.equal(scope.emit({ type: 'terrain-impact', element: 'blood' }).ok, false);
  assert.equal(scope.emit({ type: 'status', element: 'blood', targetIds: ['target'], tags: 'wrong' }).ok, false);
  manager.advance();
  assert.equal(manager.entities.get('target').health, 9.5);
});

test('actor and region queries are detached, deterministic and explicit about unsupported systems', () => {
  const { manager, scope } = arena();
  const enemies = scope.queryActors({ position: [0, 0, 0], radius: 5, relation: 'enemy' });
  assert.deepEqual(enemies.actors.map((e) => e.id), ['target']);
  assert.throws(() => { enemies.actors[0].position[0] = 100; });
  assert.equal(manager.entities.get('target').position[0], 3);
  assert.equal(scope.queryActors({ position: [0, 0, 0], radius: Infinity }).ok, false);
  assert.deepEqual(scope.queryProjectiles(), { ok: false, reason: 'projectile query unsupported' });
  assert.equal(scope.capabilities.projectileRedirect, false);
  assert.equal(scope.tickRate, 30);
  assert.equal(scope.ticksFor(0.5), 15);
  assert.equal(scope.getActor('target').actor.maxHealth, 10);
  assert.equal(scope.getActor('missing').ok, false);
  manager.submit({ ...attack, type: 'terrain-impact', shape: { kind: 'disc', x: 3, z: 0, r: 2 } });
  manager.advance();
  const regions = scope.queryRegions({ position: [3, 0, 0], radius: 1 });
  assert.equal(regions.regions.length, 1);
  assert.throws(() => { regions.regions[0].shape.r = 100; });
  assert.equal([...manager.regions.values()][0].shape.r, 2);
  assert.deepEqual(scope.positionAt('target', 0), [3, 0, 0]);
});

test('submissions outside a tick resolve on the next advance and invalid data never reaches the queue', () => {
  const { manager, scope } = arena();
  assert.equal(scope.emit({ type: 'hit', element: 'blood', targetIds: ['target'], damage: NaN }).ok, false);
  assert.equal(scope.emit({ type: 'terrain-impact', element: 'blood', shape: { kind: 'disc', x: 0, z: 0, r: Infinity } }).ok, false);
  assert.equal(scope.emit({ type: 'hit', element: 'blood', targetIds: ['target'], intensity: -1 }).ok, false);
  assert.equal(manager.queue.length, 0);
  assert.equal(scope.emit({ type: 'hit', element: 'blood', targetIds: ['target'], damage: 1, ownerId: 'target', teamId: 'enemy' }).ok, true);
  assert.equal(manager.queue[0].tick, 0);
  assert.equal(manager.queue[0].ownerId, 'caster');
  assert.equal(manager.queue[0].teamId, 'player');
  manager.advance();
  assert.equal(manager.entities.get('target').health, 9);
});

test('disabled combat and exhausted queue refuse new expansion events', () => {
  const { manager, scope } = arena({ maxQueue: 1 }, { enabled: () => false });
  assert.equal(scope.emit({ type: 'hit', element: 'blood', targetIds: ['target'] }).reason, 'combat disabled');
  const other = arena({ maxQueue: 1 });
  other.manager.submit(attack);
  assert.equal(other.scope.emit({ type: 'hit', element: 'blood', targetIds: ['target'] }).reason, 'event budget');
  assert.equal(other.manager.queue.length, 1);
});

test('legacy cast behavior remains identical with an idle expansion observer', () => {
  const run = (observe) => {
    const { manager, adapter } = arena();
    if (!observe) adapter.dispose();
    manager.submit(attack); manager.advance();
    return JSON.stringify({ entities: [...manager.entities], regions: [...manager.regions], events: manager.recentEvents, effects: manager.effects, cues: manager.cues, log: manager.log });
  };
  assert.equal(run(true), run(false));
});

test('owned terrain swaps move real collision, imprints and presentation together', async () => {
  const { Scene } = await import('three');
  const { MechanicPresentation } = await import('../packs/sandbox/src/combat/ucsm/mechanics/MechanicPresentation.js');
  const { manager: m, scope } = arena();
  const systems = m.mechanics;
  const a = { id: 'terrain-a', family: 'worldshape', uid: 'mechanics/worldshape/the-living-floodplain', ownerId: 'caster', position: [-8, 0, 0], direction: [0, 0, 1] };
  const b = { id: 'terrain-b', family: 'worldshape', uid: 'mechanics/worldshape/glaciers-dominion', ownerId: 'caster', position: [8, 0, 0], direction: [0, 0, 1] };
  assert.equal(systems.worldshape.activate(a), null); m.advance();
  assert.equal(systems.worldshape.activate(b), null); m.advance();
  const view = new MechanicPresentation(new Scene(), systems); view.update();
  assert.equal(view.items.get(a.id).g.position.x, -8);
  assert.equal(view.items.get(b.id).g.position.x, 8);
  assert.deepEqual(scope.queryWorldshapes({ position: [0, 0, 0], radius: 20 }).terrain.map((r) => r.id), ['terrain-a', 'terrain-b']);
  // A malformed-but-accepted legacy castId must not throw during the check.
  m.submit({ ...attack, type: 'cast-start', targetIds: [], castId: 7 });
  assert.equal(scope.swapOwnedWorldshapes(a.id, b.id).ok, true);
  assert.equal(systems.worldshape.regions.get(a.id).position[0], 8);
  assert.equal(systems.worldshape.regions.get(b.id).position[0], -8);
  assert.equal(m.regions.get('rg:terrain-a:terrain-impact').shape.x, 8);
  assert.equal(m.regions.get('rg:terrain-b:terrain-impact').shape.x, -8);
  assert.ok(systems.worldshape.regions.get(b.id).ridges.every((r) => r.x < 0));
  view.update();
  assert.equal(view.items.get(a.id).g.position.x, 8);
  assert.equal(view.items.get(b.id).g.position.x, -8);
  view.dispose();
});

test('terrain swaps reject traps, foreign ownership and pending worldshape events atomically', () => {
  const { manager: m, scope } = arena();
  const s = m.mechanics;
  const a = { id: 'a', family: 'worldshape', uid: 'mechanics/worldshape/the-living-floodplain', ownerId: 'caster', position: [-8, 0, 0], direction: [0, 0, 1] };
  const b = { id: 'b', family: 'worldshape', uid: 'mechanics/worldshape/glaciers-dominion', ownerId: 'caster', position: [8, 0, 0], direction: [0, 0, 1] };
  assert.equal(s.worldshape.activate(a), null);
  assert.equal(s.worldshape.activate(b), null);
  assert.equal(scope.swapOwnedWorldshapes('a', 'b').reason, 'terrain busy');
  m.advance();
  m.setPosition('ally', -10.2, 0, -0.6);
  assert.equal(scope.swapOwnedWorldshapes('a', 'b').reason, 'terrain would trap an actor');
  assert.equal(s.worldshape.regions.get('a').position[0], -8);
  assert.equal(s.worldshape.regions.get('b').position[0], 8);
  s.worldshape.regions.get('b').ownerId = 'target';
  assert.equal(scope.swapOwnedWorldshapes('a', 'b').reason, 'two active owned terrains required');
  assert.equal(scope.capabilities.terrainRelocation, false);
  assert.equal(scope.capabilities.ownedWorldshapeSwap, true);
});
