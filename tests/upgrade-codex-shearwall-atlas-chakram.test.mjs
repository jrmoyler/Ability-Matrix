import test from 'node:test';
import assert from 'node:assert/strict';
import { Vector3 } from 'three';
import { settings } from '../packs/sandbox/src/config/settings.js';
import { ShearWallAbility, buildEditor as buildShear } from '../packs/sandbox/src/abilities/codex/ShearWallAbility.js';
import { VectorChakramAbility, buildEditor as buildChakram } from '../packs/sandbox/src/abilities/atlas/VectorChakramAbility.js';
import shearwall from '../packs/sandbox/src/config/codex/shearwall.js';
import chakram from '../packs/sandbox/src/config/atlas/chakram.js';

settings.shearwall ??= structuredClone(shearwall.settings);
settings.chakram ??= structuredClone(chakram.settings);

const box = () => ({ value: { set() {}, copy() {} } });
function arena(Cls, bodies = []) {
  const counter = { emits: 0 };
  const ctx = {
    particles: {
      get() {
        const uniforms = new Proxy({}, { get: (t, k) => (t[k] ??= box()) });
        return { uniforms, setGradient() {}, emit: (n) => (counter.emits += n) };
      }
    },
    lights: { acquire: () => ({}), set() {}, release() {} },
    decals: { spawn() {} },
    bursts: { spawn() {} },
    shake: { add() {}, rumble() {} },
    flash: { trigger() {} },
    dummies: {
      findBodies(x, z, r, out) { out.length = 0; for (const b of bodies) if (Math.hypot(b.position.x - x, b.position.z - z) <= r) out.push(b); return out; },
      findTargets(x, z, r, out) { out.length = 0; for (const b of bodies) if (b.alive && Math.hypot(b.position.x - x, b.position.z - z) <= r) out.push(b); return out; }
    }
  };
  return { a: new Cls(ctx), counter };
}
function body(x, z) {
  return { alive: true, position: new Vector3(x, 0, z), kills: 0, carry() {}, release() {},
    kill() { if (!this.alive) return false; this.alive = false; this.kills++; return true; } };
}
function editorKeys(build, c) {
  const keys = new Set();
  const folder = () => ({ addFolder: () => folder(), add: (_c, k) => (keys.add(k), { name: () => ({}) }),
    addColor: (_c, k) => (keys.add(k), { name: () => ({}) }), close() {} });
  const Editor = { range: (_f, _c, k) => keys.add(k), castAnimation: () => keys.add('castAnim'),
    gradient: (_f, _c, p) => ['A', 'B', 'C', 'D'].forEach((s) => keys.add(p + s)) };
  build(folder(), c, Editor);
  return keys;
}

test('shearwall: body slab + scour stay through the linger, bodies thrown once, ends, editor exposes every key', () => {
  const target = body(0.5, 9);
  const { a } = arena(ShearWallAbility, [target]);
  a.spawn(new Vector3(), new Vector3(0, 0, 1), 14);
  let frames = 0, sawBody = false, groundInLinger = false;
  while (a.isActive && frames < 900) {
    a.update(1 / 30);
    if (a.body.visible && a.wall.visible) sawBody = true;
    if (frames / 30 > 2.4 && a.ground.visible) groundInLinger = true;
    frames++;
  }
  const seconds = frames / 30;
  assert.ok(seconds > 1.5 && seconds < 4.8, `screen time ${seconds}`);
  assert.ok(sawBody, 'lit body drawn with the skin');
  assert.ok(groundInLinger, 'scoured floor stays into the linger');
  assert.equal(target.kills, 1);
  assert.equal(a.bodyGeometry.attributes.position.count, 97 * 25 * 7);
  a.destroy();
  assert.equal(a.body.visible, false);
  const keys = editorKeys(buildShear, settings.shearwall);
  for (const k of Object.keys(shearwall.settings)) assert.ok(keys.has(k), `editor exposes ${k}`);
  a.dispose();
});

test('chakram: blade sized for play distance, floor path recorded and kept, caught disc spins down, editor exposes every key', () => {
  const bodies = [body(0.5, 10), body(-1.5, 12), body(1.5, 13)];
  const { a } = arena(VectorChakramAbility, bodies);
  a.spawn(new Vector3(), new Vector3(0, 0, 1), 16);
  let frames = 0, maxPath = 0, heldVisible = false;
  while (a.isActive && frames < 900) {
    a.update(1 / 30);
    maxPath = Math.max(maxPath, a.path.count);
    if (a._flight === 4 && a.age - a._catchAge > 0.3 && a.disc.visible) heldVisible = true;
    frames++;
  }
  const seconds = frames / 30;
  assert.ok(seconds > 1.5 && seconds < 5, `screen time ${seconds}`);
  assert.ok(maxPath > 20, `floor path samples ${maxPath}`);
  assert.ok(heldVisible, 'disc stays in the hand spinning down');
  const c = settings.chakram;
  assert.ok(c.discRadius * (1 + c.toothDepth) >= 0.9, 'tooth tips ≥ 0.9 m radius');
  assert.ok(bodies.every((b) => b.kills <= 1));
  a.destroy();
  assert.equal(a.pathMesh.visible, false);
  assert.equal(a.path.count, 0);
  const keys = editorKeys(buildChakram, settings.chakram);
  for (const k of Object.keys(chakram.settings)) if (k !== 'hit') assert.ok(keys.has(k), `editor exposes ${k}`);
  a.dispose();
});
