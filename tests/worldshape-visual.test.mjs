import test from 'node:test';
import assert from 'node:assert/strict';
import { Scene, Vector3 } from 'three';
import { CombatStateManager } from '../packs/sandbox/src/combat/ucsm/CombatStateManager.js';
import { MechanicSystems } from '../packs/sandbox/src/combat/ucsm/mechanics/MechanicSystems.js';
import { MechanicPresentation } from '../packs/sandbox/src/combat/ucsm/mechanics/MechanicPresentation.js';
import { WORLDSHAPE_VARIANTS } from '../packs/sandbox/src/combat/ucsm/mechanics/worldshapeVariants.js';
import { animateWorldshape } from '../packs/sandbox/src/combat/ucsm/mechanics/worldshapeVisuals.js';

function setup(preset) {
  const m = new CombatStateManager();
  m.upsertEntity({ id: 'caster', teamId: 'player', position: [0, 0, -10] });
  const s = new MechanicSystems(m);
  const command = { id: 'terrain', family: 'worldshape', uid: preset.uid, ownerId: 'caster', position: [0, 0, 0], direction: [1, 0, 0] };
  assert.equal(s.worldshape.activate(command), null);
  const scene = new Scene(), view = new MechanicPresentation(scene, s), region = s.worldshape.regions.get('terrain');
  return { m, s, scene, view, region };
}
function animated(root) {
  const nodes = [];
  root.traverse(n => { if (n.userData.worldshapeMotion) nodes.push(n); });
  return nodes;
}
function state(nodes) { return nodes.map(n => [...n.position.toArray(), ...n.scale.toArray()]); }

test('all five terrain styles animate deterministically and reduced motion preserves a static pose', () => {
  for (const p of WORLDSHAPE_VARIANTS) {
    const { view, region } = setup(p);
    const a = view.build('worldshape', region), b = view.build('worldshape', region);
    const an = animated(a), bn = animated(b);
    assert.ok(an.length > 0, p.style);
    const first = state(an);
    animateWorldshape(a, 1.25, false);
    animateWorldshape(b, 1.25, false);
    assert.deepEqual(state(an), state(bn), p.style);
    assert.notDeepEqual(state(an), first, p.style);
    const frozen = state(bn);
    animateWorldshape(b, 20, true);
    assert.deepEqual(state(bn), frozen, p.style);
    view.dispose();
  }
});

test('flood chevrons flow in cast direction inside the field radius', () => {
  const p = WORLDSHAPE_VARIANTS.find(x => x.style === 'floodplain'), { view, region } = setup(p);
  const root = view.build('worldshape', region), marker = animated(root).find(n => n.userData.worldshapeMotion.type === 'current');
  animateWorldshape(root, 0, false);
  const x = marker.position.x;
  animateWorldshape(root, 0.25, false);
  assert.ok(marker.position.x > x);
  for (let t = 0; t < 20; t += 0.2) {
    animateWorldshape(root, t, false);
    for (const n of animated(root)) assert.ok(Math.hypot(n.position.x, n.position.z) <= p.radius - 0.4 + 1e-9);
  }
  view.dispose();
});

test('terrain visual vertices stay within each advertised terrain radius', () => {
  for (const p of WORLDSHAPE_VARIANTS) {
    const { view, region } = setup(p), root = view.build('worldshape', region), point = new Vector3();
    animateWorldshape(root, 1.2, false);
    root.updateMatrixWorld(true);
    root.traverse(n => {
      if (!n.isMesh) return;
      const positions = n.geometry.attributes.position;
      for (let i = 0; i < positions.count; i++) {
        point.fromBufferAttribute(positions, i).applyMatrix4(n.matrixWorld);
        assert.ok(Math.hypot(point.x, point.z) <= p.radius + 1e-5, `${p.style}: ${n.name || n.geometry.type}`);
      }
    });
    view.dispose();
  }
});

test('terrain pulse shapes vary by element and terrain materials carry deterministic detail uniforms', () => {
  const signatures = [];
  for (const p of WORLDSHAPE_VARIANTS) {
    const { view, region } = setup(p), pulse = view.build('terrain-pulse', region);
    const meshes = [];
    pulse.traverse(n => { if (n.isMesh) meshes.push([n.geometry.type, n.material.color.getHex(), ...n.scale.toArray()]); });
    signatures.push(JSON.stringify(meshes));
    assert.ok(meshes.length >= 3, p.style);
    view.dispose();
  }
  assert.equal(new Set(signatures).size, 5);
  const { view } = setup(WORLDSHAPE_VARIANTS[0]);
  for (const name of ['terrainFire', 'terrainIce', 'terrainStorm', 'terrainWater', 'terrainGlass']) {
    const shader = { uniforms: {}, vertexShader: '#include <common>\n#include <begin_vertex>', fragmentShader: '#include <common>\n#include <color_fragment>' };
    view.mat[name].onBeforeCompile(shader);
    assert.equal(shader.uniforms.terrainClock, view.terrainTime);
    assert.match(shader.fragmentShader, /vTerrainLocal/);
    assert.match(shader.fragmentShader, /terrainClock/);
  }
  view.reducedMotion = true;
  view.s.m.tick = 90;
  view.update();
  assert.equal(view.terrainTime.value, 0);
  assert.equal(view.mat.fire.emissiveIntensity, 1.15);
  view.s.m.tick = 180;
  view.update();
  assert.equal(view.mat.fire.emissiveIntensity, 1.15);
  view.dispose();
});

test('expired terrain retracts, disappears and releases all shared resources on disposal', () => {
  const p = WORLDSHAPE_VARIANTS[0], { m, s, scene, view } = setup(p);
  m.tick = 30;
  view.update();
  const item = view.items.get('terrain');
  assert.ok(item);
  s.worldshape.regions.delete('terrain');
  view.update();
  m.tick += 4;
  view.update();
  assert.ok(item.g.scale.y > 0 && item.g.scale.y < 1);
  m.tick += 6;
  view.update();
  assert.equal(view.items.has('terrain'), false);
  let disposed = 0;
  for (const resource of view.resources) resource.addEventListener('dispose', () => disposed++);
  view.dispose();
  assert.equal(disposed, view.resources.length);
  assert.equal(scene.children.length, 0);
});

test('reduced-motion pulses hold a fixed size and clear without animated retraction', () => {
  const p = WORLDSHAPE_VARIANTS[0], { m, s, view, region } = setup(p);
  view.reducedMotion = true;
  view.cue({ ...region, kind: 'mechanic', phase: 'terrain-pulse', tick: m.tick });
  view.update();
  const pulse = [...view.items.values()].find(x => x.kind === 'terrain-pulse');
  assert.ok(pulse);
  assert.equal(pulse.g.scale.x, 1);
  m.tick += 5;
  view.update();
  assert.equal(pulse.g.scale.x, 1);
  s.worldshape.regions.delete('terrain');
  view.update();
  assert.equal(view.items.has('terrain'), false);
  view.dispose();
});
