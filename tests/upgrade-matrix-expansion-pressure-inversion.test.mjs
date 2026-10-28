import test from 'node:test';
import assert from 'node:assert/strict';
import { Vector3 } from 'three';
import { settings } from '../packs/sandbox/src/config/settings.js';
import { PressureInversionAbility, CONFIG, ID, buildEditor } from '../packs/sandbox/src/abilities/expansion-2026/wind/PressureInversion.js';

settings[ID] = structuredClone(CONFIG.settings);
const ctx = () => ({
  lights: { acquire: () => ({}), set() {}, release() {} },
  dummies: { findTargets: (_x, _z, _r, out) => ((out.length = 0), out) }
});

test('pressure column rises, pinches before the inversion, blows out and tears after it', () => {
  const a = new PressureInversionAbility(ctx());
  a.spawn(new Vector3(), new Vector3(0, 0, 1), 6);
  assert.equal(a.column.visible, false);
  a.update(1); // lands
  assert.ok(a.column.visible && a.columnSheath.visible && a.bowl.visible);
  const D = a.impactDuration;
  const inv = a.config.inversionPoint;
  let pinchMax = 0;
  while (a.impactTime / D < inv - 0.02) {
    a.update(1 / 30);
    pinchMax = Math.max(pinchMax, a.columnMaterial.uniforms.uPinch.value);
  }
  assert.ok(a.columnMaterial.uniforms.uGrow.value > 0.9);
  assert.ok(pinchMax > a.config.columnRestPinch + 0.2, 'waist pinches as the well tightens');
  assert.equal(a.columnMaterial.uniforms.uBloom.value, 0);
  for (let i = 0; i < 20; i++) a.update(1 / 30);
  assert.ok(a.columnMaterial.uniforms.uBloom.value > 0.3, 'gust blows the column out');
  assert.ok(a.columnMaterial.uniforms.uTear.value > 0, 'and tears it');
  let frames = 0;
  while (a.isActive && frames++ < 400) a.update(1 / 30);
  assert.ok(!a.isActive);
  a.destroy();
  assert.ok(!a.column.visible && !a.bowl.visible);
  let n = 0;
  for (const r of [a.columnGeometry, a.columnMaterial, a.columnSheathMaterial, a.bowlMaterial]) r.addEventListener('dispose', () => n++);
  a.dispose();
  assert.equal(n, 4);
});

test('column is sized from the well radius every frame and the editor exposes every key', () => {
  const a = new PressureInversionAbility(ctx());
  a.spawn(new Vector3(), new Vector3(0, 0, 1), 6);
  a.update(1);
  const c = settings[ID];
  const r = c.radius;
  c.radius = r * 2;
  a.update(0.01);
  assert.ok(Math.abs(a.columnMaterial.uniforms.uR1.value - c.columnTopRadius * r * 2) < 1e-9);
  c.radius = r;
  a.destroy();
  a.dispose();
  const keys = new Set();
  const folder = () => ({ addFolder: () => folder(), add: (_c, k) => (keys.add(k), { name: () => ({}) }), addColor: (_c, k) => (keys.add(k), { name: () => ({}) }), close() {} });
  const Editor = { range: (_f, _c, k) => keys.add(k), castAnimation: () => keys.add('castAnim'), gradient: (_f, _c, p) => ['A', 'B', 'C', 'D'].forEach((s) => keys.add(p + s)) };
  buildEditor(folder(), c, Editor);
  for (const k of Object.keys(CONFIG.settings)) assert.ok(keys.has(k), `editor exposes ${k}`);
});
