import test from 'node:test';
import assert from 'node:assert/strict';
import { Vector3 } from 'three';
import { settings } from '../packs/sandbox/src/config/settings.js';
import { FulminantRelayAbility, CONFIG, ID } from '../packs/sandbox/src/abilities/expansion-2026/storm/FulminantRelay.js';

settings[ID] = structuredClone(CONFIG.settings);

test('relay: dark charge blasts, dark scorch per struck body, standing channels on a dark bed, same chain', () => {
  const decals = [];
  const targets = [0, 2, 4].map((x) => ({
    position: new Vector3(x, 0, 5),
    alive: true,
    kill() {
      this.alive = false;
    }
  }));
  const a = new FulminantRelayAbility({
    lights: { acquire: () => ({}), set() {}, release() {} },
    decals: { spawn: (type, pos, o) => decals.push({ type, radius: o.radius }) },
    bursts: { spawn() {} },
    shake: { add() {} },
    flash: { trigger() {} },
    dummies: {
      findTargets(_x, _z, _r, out) {
        out.length = 0;
        out.push(...targets.filter((t) => t.alive));
        return out;
      }
    }
  });
  a.spawn(new Vector3(), new Vector3(0, 0, 1), 5);
  for (let i = 0; i < 40 && a.hops.length === 0; i++) a.update(1 / 30);
  assert.equal(a.blasts[0].mesh.visible, true, 'detonation blast up');
  for (let i = 0; i < 30; i++) a.update(1 / 30);
  assert.equal(a.hops.length, 3, 'chain unchanged');
  assert.ok(targets.every((t) => !t.alive));
  const hopScorches = decals.filter((d) => d.radius === CONFIG.settings.hopScorchRadius).length;
  assert.equal(hopScorches, 3, 'a dark scorch under every struck body');
  assert.ok(a.unders.slice(0, 3).some((u) => u.visible), 'dark bed under the standing channels');
  // Links stack in height.
  const midY = (m) => m.geometry.attributes.position.getY(24);
  a.update(0);
  assert.ok(midY(a.unders[2]) > midY(a.unders[0]) + 0.5 || !a.unders[2].visible || !a.unders[0].visible);
  a.destroy();
  assert.ok(a.blasts.every((b) => !b.mesh.visible) && a.unders.every((u) => !u.visible));
  a.dispose();
});
