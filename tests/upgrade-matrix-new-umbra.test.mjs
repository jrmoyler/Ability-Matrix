import test from 'node:test';
import assert from 'node:assert/strict';
import { Vector3 } from 'three';
import { settings } from '../packs/sandbox/src/config/settings.js';
import { UmbraGraspAbility, buildEditor } from '../packs/sandbox/src/abilities/matrix-new/UmbraGraspAbility.js';
import umbra from '../packs/sandbox/src/config/matrix-new/umbra.js';

settings.umbra ??= structuredClone(umbra.settings);

const box = () => ({ value: { set() {}, copy() {} } });
function mockParticles() {
  return {
    get() {
      const uniforms = new Proxy({}, { get: (t, k) => (t[k] ??= box()) });
      return { uniforms, setGradient() {}, emit() {} };
    }
  };
}

function body(x, z) {
  return {
    alive: true,
    finished: false,
    position: new Vector3(x, 0, z),
    kills: 0,
    sunk: 0,
    consumed: 0,
    kill() {
      if (!this.alive) return false;
      this.alive = false;
      this.kills++;
      return true;
    },
    bodyPoint(out) {
      return out.copy(this.position).setY(this.position.y + 1 - this.sunk);
    },
    carry() {},
    corrode() {},
    sink(d) {
      this.sunk = Math.max(this.sunk, d);
    },
    consume(a) {
      this.consumed = Math.max(this.consumed, a);
      if (a >= 1) this.finished = true;
    },
    release() {}
  };
}

function arena(bodies) {
  const ctx = {
    particles: mockParticles(),
    lights: { acquire: () => ({}), set() {}, release() {} },
    decals: { spawn() {} },
    bursts: { spawn() {} },
    shake: { add() {}, rumble() {} },
    flash: { trigger() {} },
    dummies: {
      findTargets(x, z, r, out) {
        out.length = 0;
        for (const b of bodies) if (b.alive && Math.hypot(b.position.x - x, b.position.z - z) <= r) out.push(b);
        return out;
      },
      findBodies(x, z, r, out) {
        out.length = 0;
        for (const b of bodies) if (!b.finished && Math.hypot(b.position.x - x, b.position.z - z) <= r) out.push(b);
        return out;
      }
    }
  };
  return new UmbraGraspAbility(ctx);
}

test('umbra: the hand stands over a body, the ink sleeves take the held under, and everything is reset', () => {
  const near = body(0.3, 10);
  const far = body(6, 10);
  const a = arena([near, far]);
  for (let round = 0; round < 2; round++) {
    near.alive = true; near.finished = false; near.sunk = 0; near.consumed = 0;
    a.spawn(new Vector3(), new Vector3(0, 0, 1), 10);
    let tallest = 0;
    let sawSleeve = false;
    let sleeveBeforeDrag = false;
    for (let i = 0; i < 400 && a.isActive; i++) {
      a.update(1 / 30);
      if (a.hand.visible) {
        for (let b = 0; b < a._boneCount; b++) {
          const top = a._boneRoot[b * 3 + 1] + a._boneDir[b * 3 + 1] * a._boneLen[b];
          tallest = Math.max(tallest, top);
        }
      }
      if (a.sleeves.visible) {
        sawSleeve = true;
        if (a._drag() <= 0 && a._dry <= 0) sleeveBeforeDrag = true;
        assert.ok(a.sleeves.count <= 6);
      }
    }
    assert.ok(!a.isActive, 'the cast ends');
    assert.ok(tallest > 2.6, `hand stands over a body (${tallest.toFixed(2)} m)`);
    assert.ok(sawSleeve, 'an ink sleeve rose round the held body');
    assert.ok(!sleeveBeforeDrag, 'sleeves wait for the drag');
    assert.equal(near.kills, round === 0 ? 1 : 2, 'the body in the circle is taken once per cast');
    assert.equal(far.alive, true, 'a body outside the circle is untouched');
    assert.ok(near.consumed >= 1, 'the held body is taken under');
    a.destroy();
    assert.equal(a.sleeves.visible, false);
    assert.ok(a._sleeves.every((s) => !s.active));
  }
  a.dispose();
});

test('umbra: the editor binds every sleeve key', () => {
  const c = structuredClone(umbra.settings);
  const seen = new Set();
  const ctl = { name: () => ctl };
  const gui = {
    addFolder: () => gui,
    add: (o, k) => (seen.add(k), assert.ok(k in o, k), ctl),
    addColor: (o, k) => (seen.add(k), assert.ok(k in o, k), ctl),
    close() {}
  };
  const Editor = { range: (f, o, k) => gui.add(o, k), castAnimation() {}, gradient() {} };
  buildEditor(gui, c, Editor);
  for (const key of Object.keys(c).filter((k) => k.startsWith('sleeve') || k.startsWith('colorSleeve'))) assert.ok(seen.has(key), key);
});
