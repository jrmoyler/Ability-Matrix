import test from 'node:test';
import assert from 'node:assert/strict';
import { Vector3 } from 'three';
import { settings } from '../packs/sandbox/src/config/settings.js';
import { SunfallPrismAbility, buildEditor as prismEditor } from '../packs/sandbox/src/abilities/collective/SunfallPrismAbility.js';
import { StarfallRiteAbility, buildEditor as starEditor } from '../packs/sandbox/src/abilities/matrix-new/StarfallRiteAbility.js';
import prism from '../packs/sandbox/src/config/collective/prism.js';
import starfall from '../packs/sandbox/src/config/matrix-new/starfall.js';

settings.prism ??= structuredClone(prism.settings);
settings.starfall ??= structuredClone(starfall.settings);

const box = () => ({ value: { set() {}, copy() {} } });
function arena(Ability, bodies = []) {
  const counter = { emits: 0, decals: 0, bursts: 0 };
  const ctx = {
    particles: { get: () => ({ uniforms: new Proxy({}, { get: (t, k) => (t[k] ??= box()) }), setGradient() {}, emit: (n) => (counter.emits += n) }) },
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
  return { a: new Ability(ctx), counter };
}
const body = (x, z) => ({ alive: true, position: new Vector3(x, 0, z), kills: 0, kill() { if (!this.alive) return false; this.alive = false; this.kills++; return true; } });
const run = (a, seconds) => { for (let i = 0; i < seconds * 30; i++) a.update(1 / 30); };

/** Every settings key is a live control in the cast's own folder. */
function editorKeys(build, c) {
  const keys = new Set();
  const folder = () => ({ addFolder: folder, add: (o, k) => (keys.add(k), { name() { return this; } }), addColor: (o, k) => (keys.add(k), { name() { return this; } }) });
  const Editor = { range: (f, o, k) => keys.add(k), castAnimation: () => keys.add('castAnim'), gradient: (f, o, p) => ['A', 'B', 'C', 'D'].forEach((s) => keys.add(p + s)) };
  build(folder(), c, Editor);
  return keys;
}

test('prism: dart + lance travel, zone-scale stone, glassed floor that spreads, every key in the editor', () => {
  const near = body(10.5, 0.5);
  const { a, counter } = arena(SunfallPrismAbility, [near]);
  a.spawn(new Vector3(), new Vector3(1, 0, 0), 10);
  run(a, 0.2);
  assert.equal(a.dart.visible, true);
  assert.equal(a.lance.visible, true);
  assert.ok(a.prism.scale.y >= 2.5, 'the stone is zone scale');
  run(a, 1.3);
  assert.ok(a._split, 'split inside the first 1.5 s');
  assert.ok(a.charMaterial.uniforms.uField.value > 0.5);
  assert.ok(a.charMaterial.uniforms.uFieldReach.value > 0);
  run(a, 6);
  assert.equal(near.kills, 1);
  assert.ok(counter.bursts >= 2);
  // Reuse resets.
  a.spawn(new Vector3(), new Vector3(1, 0, 0), 10);
  assert.equal(a._split, false);
  assert.equal(a.dart.visible, true);
  a.destroy?.();
  a.dispose();
  const keys = editorKeys(prismEditor, settings.prism);
  for (const k of Object.keys(prism.settings)) assert.ok(keys.has(k), `prism editor misses ${k}`);
});

test('starfall: crystals fall, land, turn and sink; the floor keeps the figure; bounded hits', () => {
  const bodies = [];
  for (let i = 0; i < 7; i++) bodies.push(body(12 + Math.cos(i) * 1.5, Math.sin(i) * 1.5));
  const { a } = arena(StarfallRiteAbility, bodies);
  a.spawn(new Vector3(), new Vector3(1, 0, 0), 12);
  run(a, 0.3);
  assert.equal(a.meteorGeometry.attributes.aHead.array[16 * 4 + 3], 1, 'herald trails a meteor');
  // Launch order is jittered, so wait on the cast's own clock: the earliest
  // star must have landed by the time the latest one could.
  const latestLanding = a._firstLaunch() + a._span() + a._fallTime();
  for (let t = 0; t < latestLanding + 0.5 && !a.stars.slice(0, a._count).some((s) => s.landed); t += 0.1) run(a, 0.1);
  assert.ok(a.stars.slice(0, a._count).some((s) => s.landed), 'a star has landed within the fall window');
  const u = a.fieldMaterial.uniforms;
  assert.ok(Array.from(u.uStars.value).some((v, i) => i % 4 === 2 && v >= 0));
  assert.equal(a.crystals.visible, true);
  run(a, 1.5);
  assert.ok(Array.from(u.uSegDraw.value).some((d) => d > 0), 'floor lines drawn between landed stars');
  const kills = bodies.reduce((n, b) => n + b.kills, 0);
  assert.ok(kills <= bodies.length && kills > 0);
  run(a, 6);
  // Reuse resets.
  a.spawn(new Vector3(), new Vector3(1, 0, 0), 12);
  assert.ok(a.stars.slice(0, a._count).every((s) => !s.landed));
  a.destroy?.();
  a.dispose();
  const keys = editorKeys(starEditor, settings.starfall);
  for (const k of Object.keys(starfall.settings)) assert.ok(keys.has(k), `starfall editor misses ${k}`);
});

test('celestial cartography: every settings key is in its editor folder; the rete hero is solid and lit', async () => {
  const { buildEditor, CelestialCartographyAbility, ID } = await import('../packs/sandbox/src/abilities/expansion-2026/cosmic/CelestialCartographyAbility.js');
  const config = (await import('../packs/sandbox/src/abilities/expansion-2026/cosmic/celestial-cartography.config.js')).default;
  settings[ID] ??= structuredClone(config.settings);
  const keys = editorKeys(buildEditor, settings[ID]);
  for (const k of Object.keys(config.settings)) assert.ok(keys.has(k), `celestial editor misses ${k}`);
  const { a } = arena(CelestialCartographyAbility);
  assert.equal(a.rete.castShadow, true);
  assert.equal(a.rete.material.isMeshStandardMaterial, true);
  a.spawn(new Vector3(), new Vector3(1, 0, 0), 8);
  run(a, 1.5);
  assert.ok(a.skyGroup.position.y > 1.5 && a.skyGroup.position.y < 3.5, 'the chart hangs in frame');
  assert.ok(a.rete.scale.x > 3, 'the rete is zone scale');
  const yaw = a._yaw;
  run(a, 0.5);
  assert.ok(a._yaw > yaw, 'the plate keeps turning in the linger');
  a.destroy?.();
  a.dispose();
});
