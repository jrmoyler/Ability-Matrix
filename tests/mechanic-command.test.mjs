import test from 'node:test';
import assert from 'node:assert/strict';
import { CombatStateManager } from '../packs/sandbox/src/combat/ucsm/CombatStateManager.js';
import { MechanicSystems } from '../packs/sandbox/src/combat/ucsm/mechanics/MechanicSystems.js';
import { issueMechanicCast } from '../packs/sandbox/src/combat/ucsm/mechanics/MechanicCommand.js';
import { CRYOSTASIS_MESH, MECHANIC_PRESETS, MECHANIC_VARIANTS } from '../packs/sandbox/src/combat/ucsm/mechanics/presets.js';

function host() {
  const m = new CombatStateManager();
  m.upsertEntity({ id: 'caster', teamId: 'player' });
  return { systems: new MechanicSystems(m), adapter: { enabled: true }, selected: null, selectedUid: null,
    app: { paused: false, _throwBody() {}, hud: { showToast() {} } } };
}

test('bridge can select every variant explicitly without depending on UI selection', () => {
  for (const p of Object.values(MECHANIC_VARIANTS)) {
    const h = host();
    h.selected = 'weave'; h.selectedUid = CRYOSTASIS_MESH.uid;
    const result = issueMechanicCast(h, p.family, [1, 0, 0], [1, 0, 0], 'cast', p.uid);
    assert.equal(result.ok, true, p.uid);
    assert.equal(h.systems.commands[0].uid, p.uid);
  }
});

test('old four-argument casts use defaults when stale selection belongs to another family', () => {
  const h = host();
  h.selected = null; h.selectedUid = CRYOSTASIS_MESH.uid;
  assert.equal(issueMechanicCast(h, 'counter', [0, 0, 0], [0, 0, 1], 'cast').ok, true);
  assert.equal(h.systems.commands[0].uid, MECHANIC_PRESETS.counter.uid);
  assert.equal(h.selectedUid, null);
});

test('interactive selection is respected, and mismatched explicit UID is rejected', () => {
  const h = host(); h.selected = 'weave'; h.selectedUid = CRYOSTASIS_MESH.uid;
  assert.equal(issueMechanicCast(h, 'weave', [1, 0, 0]).ok, true);
  assert.equal(h.systems.commands[0].uid, CRYOSTASIS_MESH.uid);
  assert.equal(issueMechanicCast(h, 'counter', [0, 0, 0], [0, 0, 1], 'cast', CRYOSTASIS_MESH.uid).ok, false);
});
