import test from 'node:test';
import assert from 'node:assert/strict';
import { Scene } from 'three';
import { CombatStateManager } from '../packs/sandbox/src/combat/ucsm/CombatStateManager.js';
import { MechanicSystems } from '../packs/sandbox/src/combat/ucsm/mechanics/MechanicSystems.js';
import { MechanicPresentation } from '../packs/sandbox/src/combat/ucsm/mechanics/MechanicPresentation.js';
import { COUNTER_VARIANTS, MECHANIC_PRESETS } from '../packs/sandbox/src/combat/ucsm/mechanics/presets.js';

function rig() {
  const m = new CombatStateManager();
  m.upsertEntity({ id: 'caster', teamId: 'player' });
  const s = new MechanicSystems(m), scene = new Scene(), v = new MechanicPresentation(scene, s);
  return { m, s, scene, v };
}

test('all elemental guard rigs have bounded animated pieces', () => {
  for (const p of [MECHANIC_PRESETS.counter, ...COUNTER_VARIANTS]) {
    const { m, s, v } = rig();
    s.counter.windows.set('caster', { id: p.uid, uid: p.uid, family: 'counter', ownerId: 'caster', direction: [0,0,1], position: [0,0,0] });
    v.update();
    const item = v.items.get(p.uid), moving = [];
    item.g.traverse((n) => { if (n.userData.counterMotion) moving.push(n); });
    assert.ok(moving.length >= 8, p.name);
    const before = moving.map((n) => [n.position.y, n.scale.y, n.rotation.y, n.rotation.z]);
    m.tick += 5; v.update();
    const after = moving.map((n) => [n.position.y, n.scale.y, n.rotation.y, n.rotation.z]);
    assert.notDeepEqual(after, before, p.name);
    v.dispose();
  }
});

test('counter reversal travels from defender to attacker and resolves a bounded impact', () => {
  for (const p of [MECHANIC_PRESETS.counter, ...COUNTER_VARIANTS]) {
    const { m, scene, v } = rig();
    const cue = { kind: 'mechanic', phase: 'reversal', family: 'counter', uid: p.uid, id: p.uid, tick: 0,
      ownerId: 'caster', position: [8,0,0], from: [0,0,0], direction: [1,0,0] };
    v.cue(cue); v.update();
    const item = [...v.items.values()][0], paths = [], projectiles = [], impacts = [];
    item.g.traverse((n) => {
      if (n.userData.counterTrail !== undefined) paths.push(n);
      if (n.userData.counterProjectile) projectiles.push(n);
      if (n.userData.counterImpact) impacts.push(n);
    });
    assert.equal(paths.length, 8, p.name);
    assert.equal(projectiles.length, 1, p.name);
    assert.equal(impacts.length, 1, p.name);
    assert.equal(projectiles[0].position.x, -8, p.name);
    assert.equal(impacts[0].visible, false, p.name);
    m.tick = 8; v.update();
    assert.equal(projectiles[0].visible, false, p.name);
    assert.equal(impacts[0].visible, true, p.name);
    assert.ok(paths.every(n => n.visible), p.name);
    m.tick = 22; v.update();
    assert.equal(v.items.size, 0, p.name);
    v.dispose(); assert.equal(scene.children.length, 0);
  }
});

test('effect pool remains capped and reduced motion leaves guard poses stable', () => {
  const { m, s, v } = rig();
  const p = COUNTER_VARIANTS[0];
  v.reducedMotion = true;
  s.counter.windows.set('caster', { id:'guard', uid:p.uid, family:'counter', ownerId:'caster', direction:[0,0,1], position:[0,0,0] });
  v.update(); const guard = v.items.get('guard').g, parts=[];
  guard.traverse(n => { if(n.userData.counterMotion) parts.push(n); });
  const before = parts.map(n=>[...n.position.toArray(), ...n.scale.toArray(), ...n.rotation.toArray().slice(0,3)]);
  m.tick = 5; v.update();
  assert.deepEqual(parts.map(n=>[...n.position.toArray(), ...n.scale.toArray(), ...n.rotation.toArray().slice(0,3)]), before);
  for(let i=0;i<50;i++) v.cue({kind:'mechanic',phase:'reversal',family:'counter',uid:p.uid,id:`c${i}`,tick:m.tick,position:[8,0,0],from:[0,0,0]});
  assert.equal(v.effects.length, 32); assert.ok(v.items.size <= 33);
  v.update();
  const effect = v.items.get(v.effects[0]).g; let impact, projectile;
  effect.traverse(n => { if (n.userData.counterImpact) impact=n; if (n.userData.counterProjectile) projectile=n; });
  assert.equal(impact.visible, true); assert.equal(projectile.visible, false);
  v.dispose();
});
