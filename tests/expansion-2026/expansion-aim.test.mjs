import test from 'node:test';
import assert from 'node:assert/strict';
import { PerspectiveCamera, Vector3 } from 'three';
import { settings } from '../../packs/sandbox/src/config/settings.js';
import { AimController } from '../../packs/sandbox/src/input/AimController.js';
import { ExpansionAim } from '../../packs/sandbox/src/input/ExpansionAim.js';
import pulse from '../../packs/sandbox/src/abilities/expansion-2026/pulse-covenant/config.js';
import mirage from '../../packs/sandbox/src/abilities/expansion-2026/mirage-procession/config.js';
import force from '../../packs/sandbox/src/abilities/expansion-2026/vector-breakwater/config.js';
for (const c of [pulse, mirage, force])
  settings[c.id] = structuredClone(c.settings);
test('real aim controller confirms a self cast without requiring a pointer and anchors its radius to the caster', () => {
  const a = new AimController(new PerspectiveCamera());
  a.setElement(pulse.id);
  a.setOrigin(new Vector3(3, 0, 4));
  let cast;
  a.on(
    'cast',
    (origin, direction, distance) =>
      (cast = {
        origin: origin.clone(),
        direction: direction.clone(),
        distance,
      }),
  );
  a.arm();
  a.update(0.2);
  assert.equal(a.valid, true);
  assert.equal(a.expansionAim.circle.visible, true);
  assert.equal(a.expansionAim.circle.scale.x, settings[pulse.id].pulseRadius);
  assert.deepEqual(a.expansionAim.object3D.position.toArray(), [3, 0.06, 4]);
  assert.equal(a.confirm(), true);
  assert.equal(cast.distance, 0.1);
  assert.deepEqual(cast.origin.toArray(), [3, 0, 4]);
  a.cancel();
  a.update(0.2);
  assert.equal(a.expansionAim.object3D.visible, false);
  a.dispose();
});
test('line reticles exactly match three hidden lanes and the single wide swept front', () => {
  const aim = new ExpansionAim(),
    origin = new Vector3();
  aim.update('lanes', origin, 0, 10, settings[mirage.id], 1, true);
  const a = aim.lineGeometry.attributes.position;
  assert.equal(aim.lineGeometry.drawRange.count, 24);
  const width = settings[mirage.id].hitWidth,
    gap = settings[mirage.id].laneGap;
  assert.ok(Math.abs(a.getX(0) - (gap - width)) < 1e-5);
  assert.ok(Math.abs(a.getX(8) - -width) < 1e-5);
  assert.ok(Math.abs(a.getX(16) - (-gap - width)) < 1e-5);
  assert.equal(a.getZ(1), 10);
  aim.update('wide', origin, 0, 12, settings[force.id], 1, true);
  assert.equal(aim.lineGeometry.drawRange.count, 8);
  assert.ok(Math.abs(a.getX(0) + settings[force.id].width) < 1e-5);
  assert.equal(a.getZ(1), 12);
  let disposed = 0;
  for (const x of [aim.circleGeometry, aim.lineGeometry, aim.material])
    x.addEventListener('dispose', () => disposed++);
  aim.dispose();
  assert.equal(disposed, 3);
});
