import test from 'node:test';
import assert from 'node:assert/strict';
import { Scene } from 'three';
import { CombatStateManager } from '../packs/sandbox/src/combat/ucsm/CombatStateManager.js';
import { MechanicSystems } from '../packs/sandbox/src/combat/ucsm/mechanics/MechanicSystems.js';
import { MechanicPresentation } from '../packs/sandbox/src/combat/ucsm/mechanics/MechanicPresentation.js';
import { WORLDSHAPE_VARIANTS } from '../packs/sandbox/src/combat/ucsm/mechanics/worldshapeVariants.js';
import { IMPLEMENTED_MECHANICS } from '../packs/sandbox/src/combat/ucsm/registry.js';
import { STATUS_OF } from '../packs/sandbox/src/combat/ucsm/ontology.js';

const ticks = (m, n) => { for (let i = 0; i < n; i++) m.advance(); };
const setup = (spec) => {
  const m = new CombatStateManager();
  m.upsertEntity({ id: 'caster', teamId: 'player', position: [0, 0, -8] });
  m.upsertEntity({ id: 'enemy', teamId: 'enemy', position: [0, 0, 0], health: 20 });
  m.upsertEntity({ id: 'ally', teamId: 'player', position: [0, 0, 1], health: 20 });
  const s = new MechanicSystems(m);
  assert.equal(s.command({ family: 'worldshape', uid: spec.uid, position: [0, 0, 0], direction: [0, 0, 1] }).ok, true);
  ticks(m, s.t(spec.anticipation) + 1);
  return { m, s, region: [...s.worldshape.regions.values()][0] };
};

test('five worldshape profiles are selectable, attributed and expire cleanly', () => {
  assert.equal(WORLDSHAPE_VARIANTS.length, 5);
  assert.equal(new Set(WORLDSHAPE_VARIANTS.map(p => p.uid)).size, 5);
  for (const p of WORLDSHAPE_VARIANTS) {
    assert.ok(IMPLEMENTED_MECHANICS.find(e => e.uid === p.uid && e.selectable));
    const { m, s, region } = setup(p);
    assert.ok(region, p.uid);
    assert.equal(region.ridges.length, p.ridges.length);
    ticks(m, s.t(p.pulse) + 2);
    assert.ok(m.recentEvents.some(e => e.abilityUid === p.uid && e.element === p.element && e.type === 'hit'), p.uid);
    assert.ok(m.entities.get('enemy').statuses.some(status => status.tag === STATUS_OF[p.element]), p.uid);
    assert.equal(m.entities.get('ally').health, 20, p.uid);
    assert.ok(m.entities.get('enemy').health < 20, p.uid);
    ticks(m, s.t(p.life) + 1);
    assert.equal(s.worldshape.regions.size, 0, p.uid);
    assert.equal(s.worldshape.blocked([-5, 0, 0], [5, 0, 0]), false, p.uid);
  }
});

test('floodplain has no cover and its current scales with movement distance', () => {
  const p = WORLDSHAPE_VARIANTS.find(x => x.style === 'floodplain');
  const { s } = setup(p);
  assert.equal(s.worldshape.blocked([-3, 0, 0], [3, 0, 0]), false);
  const one = s.worldshape.move([0, 0, 0], [1, 0, 0]);
  const half = s.worldshape.move([0, 0, 0], [0.5, 0, 0]);
  assert.ok(Math.abs(one[2] - 2 * half[2]) < 1e-9);
  assert.ok(one[2] > 0);
});

test('solid ridge collision follows cast direction and is removed on interrupt', () => {
  const p = WORLDSHAPE_VARIANTS.find(x => x.style === 'glass');
  const { m, s, region } = setup(p);
  const r = region.ridges[0];
  assert.equal(s.worldshape.blocked([r.x - 2, 0, r.z], [r.x + 2, 0, r.z]), true);
  s.cancel('caster');
  assert.equal(s.worldshape.regions.size, 0);
  assert.equal(s.worldshape.blocked([r.x - 2, 0, r.z], [r.x + 2, 0, r.z]), false);
  ticks(m, 5);
  assert.equal([...m.regions.values()].filter(x => x.sourceUid === p.uid).length, 0);
});

test('a caster inside a ridge may move outward but cannot move deeper or enter from outside', () => {
  const p = WORLDSHAPE_VARIANTS.find(x => x.style === 'glass');
  const { s, region } = setup(p);
  const r = region.ridges[0];
  const center = [r.x, 0, r.z];
  const towardEdge = [r.x - 0.2, 0, r.z];
  const outside = [r.x - 2, 0, r.z];
  assert.deepEqual(s.worldshape.move(center, towardEdge), towardEdge);
  assert.deepEqual(s.worldshape.move(towardEdge, outside), outside);
  assert.deepEqual(s.worldshape.move(towardEdge, center), towardEdge);
  assert.deepEqual(s.worldshape.move(outside, center), outside);
  assert.equal(s.worldshape.blocked(center, outside), true, 'line of sight remains blocked');
});

test('ability displacement cannot leave the caster inside terrain and preserves clear teleports', () => {
  const p = WORLDSHAPE_VARIANTS.find(x => x.style === 'glass');
  const { s, region } = setup(p);
  const r = region.ridges[0], from = [r.x - 2, 0, r.z], inside = [r.x, 0, r.z];
  assert.deepEqual(s.worldshape.resolveAbilityMovement(from, inside), from);
  const beyond = [r.x + 2, 0, r.z];
  assert.deepEqual(s.worldshape.resolveAbilityMovement(from, beyond), beyond);
  assert.deepEqual(s.worldshape.resolveAbilityMovement(inside, from), from);
});

test('glacier visible ramp has the same height and radius as its collision surface', () => {
  const p = WORLDSHAPE_VARIANTS.find(x => x.style === 'glacier');
  const { s, region } = setup(p), view = new MechanicPresentation(new Scene(), s);
  const item = view.add('glacier', 'worldshape', region);
  const surface = item.g.getObjectByName('glacier-surface');
  assert.ok(surface);
  assert.ok(Math.abs(surface.geometry.parameters.radius * surface.scale.x - p.radius) < 1e-9);
  assert.ok(Math.abs(surface.geometry.parameters.height * surface.scale.y - p.height) < 1e-9);
  assert.ok(Math.abs(surface.position.y - p.height / 2) < 1e-9);
  assert.ok(Math.abs(s.worldshape.heightAt(region.position) - p.height) < 1e-9);
  view.dispose();
});

test('five worldshape rigs have finite, distinctive mesh structures and release resources', () => {
  const signatures = [];
  for (const p of WORLDSHAPE_VARIANTS) {
    const { s, region } = setup(p), scene = new Scene(), view = new MechanicPresentation(scene, s);
    const item = view.add('shape', 'worldshape', region);
    const shapes = [];
    item.g.traverse(node => { if (node.isMesh) { assert.ok(node.geometry.attributes.position.count > 0); shapes.push([node.geometry.type, node.material.color.getHex(), ...node.scale.toArray()]); } });
    assert.ok(shapes.length >= 10, p.uid);
    signatures.push(JSON.stringify(shapes));
    view.dispose();
    assert.equal(scene.children.length, 0);
  }
  assert.equal(new Set(signatures).size, 5);
});
