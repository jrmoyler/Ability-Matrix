import test from 'node:test';
import assert from 'node:assert/strict';
import { Matrix4, Vector3 } from 'three';
import { settings } from '../packs/sandbox/src/config/settings.js';
import relayConfig from '../packs/sandbox/src/config/atlas/relay.js';
import { ArcRelayAbility, ID } from '../packs/sandbox/src/abilities/atlas/ArcRelayAbility.js';

settings[ID] ??= structuredClone(relayConfig.settings);

function uniformBag() {
  return new Proxy({}, {
    get(target, key) {
      if (!(key in target)) target[key] = { value: key === 'uGravity' ? new Vector3() : 0 };
      return target[key];
    },
  });
}

/** Seven bodies in a cluster 9 m down +z, like the capture tool stands them. */
function makeField() {
  const bodies = [];
  const spots = [[0, 9], [1.4, 9.6], [-1.4, 9.5], [0.6, 11], [-0.8, 11.2], [2.6, 10.6], [-2.7, 10.4]];
  for (const [x, z] of spots) {
    bodies.push({
      alive: true,
      position: new Vector3(x, 0, z),
      kills: 0,
      kill() { if (!this.alive) return false; this.alive = false; this.kills++; return true; },
    });
  }
  const near = (x, z, r, out, alive) => {
    out.length = 0;
    for (const b of bodies) if ((!alive || b.alive) && Math.hypot(b.position.x - x, b.position.z - z) <= r) out.push(b);
    out.sort((a, b) => Math.hypot(a.position.x - x, a.position.z - z) - Math.hypot(b.position.x - x, b.position.z - z));
    return out;
  };
  return {
    bodies,
    field: {
      findTargets: (x, z, r, out) => near(x, z, r, out, true),
      findBodies: (x, z, r, out) => near(x, z, r, out, false),
    },
  };
}

function makeCtx(field) {
  const decals = [];
  const systems = new Map();
  return {
    decals,
    ctx: {
      particles: {
        get(name) {
          if (!systems.has(name)) systems.set(name, { uniforms: uniformBag(), setGradient() {}, emit() {} });
          return systems.get(name);
        },
      },
      decals: { spawn: (type, pos, opts) => decals.push({ type, radius: opts.radius }) },
      bursts: { spawn() {} },
      shake: { add() {}, rumble() {} },
      flash: { trigger() {} },
      lights: { acquire: () => ({}), release() {}, set() {} },
      camera: { position: new Vector3(0, 6, -8) },
      dummies: field,
    },
  };
}

function run(ability, seconds) {
  for (let t = 0; t < seconds; t += 1 / 30) ability.update(1 / 30);
}

test('arc relay: cages tear up round every relay, open, are blown out and sink; all die on one frame', () => {
  const { bodies, field } = makeField();
  const { ctx } = makeCtx(field);
  const ability = new ArcRelayAbility(ctx);
  ability.spawn(new Vector3(0, 0, 0), new Vector3(0, 0, 1), 12);

  const m = new Matrix4();
  const p = new Vector3();
  const s = new Vector3();

  // Growth: relays claimed, nobody dead yet, every relay has a standing cage.
  run(ability, 1.2);
  assert.ok(ability._nodeCount >= 3, `relays claimed (${ability._nodeCount})`);
  assert.equal(bodies.filter((b) => !b.alive).length, 0, 'held, not killed');
  const perRelay = Math.round(settings.relay.prongCount);
  assert.equal(ability.prongs.count, ability._nodeCount * perRelay, 'one cage per relay');
  let tall = 0;
  for (let i = 0; i < ability.prongs.count; i++) {
    ability.prongs.getMatrixAt(i, m);
    s.setFromMatrixScale(m);
    if (s.y > settings.relay.cageHeight * 0.8) tall++;
  }
  assert.ok(tall >= perRelay, `the first cage stands at full height (${tall})`);
  assert.ok(ability.prongs.castShadow, 'the cage casts shadows');

  // Discharge: everyone held dies together.
  run(ability, 2.5);
  const dead = bodies.filter((b) => !b.alive).length;
  assert.equal(dead, ability._nodeCount, 'every relay killed on the discharge');
  for (const b of bodies) assert.ok(b.kills <= 1, 'killed once');

  // Late linger: the rods have sunk below the floor.
  run(ability, 0.9);
  if (ability.prongs.count > 0) {
    ability.prongs.getMatrixAt(0, m);
    p.setFromMatrixPosition(m);
    assert.ok(p.y < -0.3, `rods sink (y=${p.y.toFixed(2)})`);
  }

  // Exit and reuse.
  run(ability, 3);
  ability.destroy?.();
  assert.equal(ability.prongs.count, 0, 'pooled cages hidden on destroy');
  ability.spawn(new Vector3(0, 0, 0), new Vector3(1, 0, 0), 10);
  run(ability, 0.05);
  assert.equal(ability.prongs.count, 0, 'spawn resets the cages');
  ability.dispose();
});
