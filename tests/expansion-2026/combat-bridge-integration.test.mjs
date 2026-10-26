import test from 'node:test';
import assert from 'node:assert/strict';
import { Vector3 } from 'three';
import { CombatStateManager } from '../../packs/sandbox/src/combat/ucsm/CombatStateManager.js';
import { MechanicSystems } from '../../packs/sandbox/src/combat/ucsm/mechanics/MechanicSystems.js';
import { ExpansionCombatAdapter } from '../../packs/sandbox/src/combat/ucsm/ExpansionCombatAdapter.js';
import { settings } from '../../packs/sandbox/src/config/settings.js';
import {
  Ability as Pulse,
  ID as PID,
  config as pc,
} from '../../packs/sandbox/src/abilities/expansion-2026/pulse-covenant/index.js';
import {
  Ability as Fabricator,
  ID as FID,
  config as fc,
} from '../../packs/sandbox/src/abilities/expansion-2026/adaptive-fabricator/index.js';
settings[PID] = structuredClone(pc.settings);
settings[FID] = structuredClone(fc.settings);
const lights = { acquire: () => ({}), release: () => {}, set: () => {} };
function arena() {
  const manager = new CombatStateManager();
  manager.upsertEntity({ id: 'caster', teamId: 'player', health: 10 });
  manager.upsertEntity({
    id: 'first',
    teamId: 'enemy',
    position: [2, 0, 0],
    health: 10,
  });
  manager.upsertEntity({
    id: 'near',
    teamId: 'enemy',
    position: [2, 0, 1],
    health: 10,
  });
  new MechanicSystems(manager);
  const bridge = new ExpansionCombatAdapter(manager);
  return { manager, bridge };
}
test('Pulse Covenant observes real fixed-tick hit events and queues a bounded attributed pulse', () => {
  const { manager: m, bridge } = arena(),
    a = new Pulse({
      lights,
      character: { position: new Vector3() },
      expansionCombat: bridge,
    });
  a.spawn(new Vector3(), new Vector3(1, 0, 0), 1);
  const hit = (id) =>
    m.submit({
      type: 'hit',
      element: 'force',
      abilityUid: 'legacy/test',
      castId: id,
      ownerId: 'caster',
      teamId: 'player',
      targetIds: ['first'],
      position: [2, 0, 0],
      damage: 0,
    });
  hit('a');
  m.advance();
  for (let i = 0; i < 17; i++) m.advance();
  hit('b');
  m.advance();
  assert.ok(
    m.queue.some(
      (e) =>
        e.abilityUid === 'matrix-expansion/pulse-covenant' &&
        e.targetIds.includes('near'),
    ),
  );
  m.advance();
  assert.ok(m.entities.get('near').health < 10);
  a.destroy();
  assert.equal(bridge.listeners.size, 0);
  a.dispose();
  bridge.dispose();
});
test('Adaptive Fabricator uses real actor status and submits owned counter-element damage', () => {
  const { manager: m, bridge } = arena(),
    a = new Fabricator({ lights, expansionCombat: bridge });
  m.submit({
    type: 'status',
    element: 'water',
    abilityUid: 'legacy/water',
    ownerId: 'caster',
    teamId: 'player',
    targetIds: ['first'],
    position: [2, 0, 0],
  });
  m.advance();
  a.spawn(new Vector3(), new Vector3(1, 0, 0), 1);
  for (let i = 0; i < 80; i++) a.update(1 / 60);
  assert.ok(
    m.queue.some(
      (e) =>
        e.abilityUid === 'matrix-expansion/adaptive-fabricator' &&
        e.element === 'storm' &&
        e.targetIds.includes('first'),
    ),
  );
  m.advance();
  assert.ok(m.entities.get('first').health < 10);
  a.destroy();
  a.dispose();
  bridge.dispose();
});

test('optional hit source preserves contact location and supplies damage impulse origin', () => {
  const { manager, bridge } = arena();
  const scope = bridge.bind('matrix-expansion/adaptive-fabricator', 'caster');
  let observed;
  scope.on('hit', event => { observed = event; });
  assert.equal(scope.emit({ type:'hit', element:'tech', targetIds:['first'], position:[2,0,0], sourcePosition:[-1,0,0], damage:.1 }).ok, true);
  assert.equal(scope.emit({ type:'hit', element:'tech', targetIds:['first'], position:[2,0,0], sourcePosition:[NaN,0,0], damage:.1 }).ok, false);
  manager.advance();
  const effect = manager.drain().effects.find(e => e.kind === 'damage');
  assert.deepEqual(effect.from, [-1,0]);
  assert.deepEqual(observed.position, [2,0,0]);
  assert.deepEqual(observed.sourcePosition, [-1,0,0]);
  manager.submit({ type:'hit', element:'force', abilityUid:'legacy/test', ownerId:'caster', teamId:'player', targetIds:['near'], position:[2,0,1], damage:.1 });
  manager.advance();
  const legacyEffect = manager.drain().effects.find(e => e.kind === 'damage');
  assert.deepEqual(legacyEffect.from, [2,1], 'legacy hits continue using their contact position');
  bridge.dispose();
});
