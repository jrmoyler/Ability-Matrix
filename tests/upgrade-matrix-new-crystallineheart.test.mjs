import test from 'node:test';
import assert from 'node:assert/strict';
import { Vector3 } from 'three';
import { settings } from '../packs/sandbox/src/config/settings.js';
import { CrystallineHeartAbility, buildEditor } from '../packs/sandbox/src/abilities/matrix-new/CrystallineHeartAbility.js';
import { createHeartRibGeometry } from '../packs/sandbox/src/assets/matrix-new/CrystallineHeartGeometry.js';
import heart from '../packs/sandbox/src/config/matrix-new/crystallineheart.js';

settings.crystallineheart = structuredClone(heart.settings);

const box = () => ({ value: { set() {}, copy() {} } });
function mockParticles(counter) {
  return {
    get() {
      const uniforms = new Proxy({}, { get: (t, k) => (t[k] ??= box()) });
      return { uniforms, setGradient() {}, emit: (n) => (counter.emits += n) };
    }
  };
}

function arena(bodies = []) {
  const counter = { emits: 0, decals: 0, bursts: 0 };
  const ctx = {
    camera: { position: new Vector3(0, 6, -8) },
    particles: mockParticles(counter),
    lights: { acquire: () => ({}), set() {}, release() {} },
    decals: { spawn: () => counter.decals++ },
    bursts: { spawn: () => counter.bursts++ },
    shake: { add() {}, rumble() {} },
    flash: { trigger() {} },
    dummies: {
      findTargets(x, z, r, out) {
        out.length = 0;
        for (const b of bodies) if (b.alive && Math.hypot(b.position.x - x, b.position.z - z) <= r) out.push(b);
        return out;
      }
    }
  };
  return { a: new CrystallineHeartAbility(ctx), counter };
}

const body = (x, z) => ({
  alive: true,
  position: new Vector3(x, 0, z),
  kills: 0,
  kill() {
    if (!this.alive) return false;
    this.alive = false;
    this.kills++;
    return true;
  }
});

test('crystalline heart: cage and quartz floor stand, grow with the beats, shatter once, reset', () => {
  const target = body(1, 8);
  const { a, counter } = arena([target]);
  for (let round = 0; round < 2; round++) {
    a.spawn(new Vector3(), new Vector3(0, 0, 1), 8);
    assert.ok(a.ribs.every((r) => !r.visible), 'no stale ribs on spawn');
    assert.equal(a.quartzFloor.visible, false);
    let frames = 0;
    let sawCage = false;
    let tallest = 0;
    let firstHeight = 0;
    let maxEmit = 0;
    while (a.isActive && frames < 600) {
      const before = counter.emits;
      a.update(1 / 30);
      maxEmit = Math.max(maxEmit, counter.emits - before);
      const shown = a.ribs.filter((r) => r.visible);
      if (shown.length === settings.crystallineheart.ribCount && a.quartzFloor.visible) {
        sawCage = true;
        if (!firstHeight && a._life > 0.6) firstHeight = shown[0].scale.y;
        if (a._shatter < 0) tallest = Math.max(tallest, shown[0].scale.y);
      }
      for (const r of a.ribs) for (const v of r.scale.toArray()) assert.ok(Number.isFinite(v));
      frames++;
    }
    assert.ok(frames < 600, 'cast finishes');
    assert.ok(sawCage, 'the cage and floor stand');
    assert.ok(tallest > firstHeight, 'the ribs climb with the beats');
    assert.ok(maxEmit < 2000, 'bounded emission');
    const seconds = frames / 30;
    assert.ok(seconds > 1.5 && seconds < 4.6, `screen time ${seconds}`);
    a.destroy();
    assert.ok(a.ribs.every((r) => !r.visible));
    assert.equal(a.quartzFloor.visible, false);
    target.alive = true;
  }
  assert.equal(target.kills, 2, 'one shatter kill per cast');
  a.dispose();
});

test('crystalline heart: rib geometry is finite and every new key is a slider', () => {
  const g = createHeartRibGeometry();
  const p = g.attributes.position;
  assert.ok(p.count > 50);
  for (let i = 0; i < p.count; i++) assert.ok(Number.isFinite(p.getX(i)) && Number.isFinite(p.getY(i)) && Number.isFinite(p.getZ(i)));
  g.dispose();
  const keys = new Set();
  const folder = {
    addFolder: () => folder,
    add: (o, k) => (keys.add(k), chain),
    addColor: (o, k) => (keys.add(k), chain),
    close() {}
  };
  const chain = { name: () => chain, onChange: () => chain };
  const Editor = { range: (f, c, k) => (keys.add(k), chain), castAnimation: () => chain, gradient: () => chain };
  buildEditor(folder, settings.crystallineheart, Editor);
  for (const k of Object.keys(settings.crystallineheart)) {
    if (/^(rib|floor|colorRib|colorFloor)/.test(k)) assert.ok(keys.has(k), `${k} has a slider`);
  }
});
