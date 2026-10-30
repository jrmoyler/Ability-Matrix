import test from 'node:test';
import assert from 'node:assert/strict';
import { Vector3 } from 'three';
import { settings } from '../packs/sandbox/src/config/settings.js';
import { HeartstakeAbility } from '../packs/sandbox/src/abilities/codex/HeartstakeAbility.js';
import { OrbitLockAbility } from '../packs/sandbox/src/abilities/codex/OrbitLockAbility.js';
import heartstake from '../packs/sandbox/src/config/codex/heartstake.js';
import orbitlock from '../packs/sandbox/src/config/codex/orbitlock.js';

settings.heartstake ??= structuredClone(heartstake.settings);
settings.orbitlock ??= structuredClone(orbitlock.settings);

const box = () => ({ value: { set() {}, copy() {} } });
function mockParticles(counter) {
  return {
    get() {
      const uniforms = new Proxy({}, { get: (t, k) => (t[k] ??= box()) });
      return { uniforms, setGradient() {}, emit: (n) => (counter.emits += n) };
    }
  };
}

function body(x, z) {
  return {
    alive: true,
    finished: false,
    position: new Vector3(x, 0, z),
    kills: 0,
    kill() {
      if (!this.alive) return false;
      this.alive = false;
      this.kills++;
      return true;
    },
    corrode() {},
    bodyPoint(out) {
      return out.copy(this.position).setY(0.9);
    }
  };
}

function arena(Ability, bodies) {
  const counter = { emits: 0, decals: 0, bursts: 0 };
  const ctx = {
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
  return { a: new Ability(ctx), counter };
}

test('heartstake: a zone-scale stake plants, thorn roots heave out a step per beat, it withers and ends', () => {
  const bodies = [body(0, 14), body(1.5, 14.5), body(-2, 13), body(12, 3)];
  const { a } = arena(HeartstakeAbility, bodies);
  for (let round = 0; round < 2; round++) {
    for (const b of bodies) b.alive = true;
    a.spawn(new Vector3(), new Vector3(0, 0, 1), 14);
    assert.equal(a.thorns.visible, false, 'spawn resets the thorns');
    let frames = 0;
    const grows = [];
    let maxLen = 0;
    while (a.isActive && frames < 600) {
      a.update(1 / 30);
      frames++;
      if (a.thorns.visible && a._stakeState.crumble === 0) grows.push(a._thornState.grow);
      maxLen = Math.max(maxLen, a._stakeState.grow * settings.heartstake.stakeLength);
    }
    const seconds = frames / 30;
    assert.ok(seconds > 1.5 && seconds < 5, `screen time ${seconds}`);
    assert.ok(maxLen > 4, `planted stake is zone scale (${maxLen} m)`);
    assert.ok(grows.length > 10, 'thorns are up through the beats');
    assert.ok(grows[grows.length - 1] > grows[0] + 0.3, 'thorns grow with the beats');
    assert.ok(bodies.slice(0, 3).every((b) => !b.alive), 'bodies at the plunge are hit');
    assert.ok(bodies[3].alive, 'a body far off the line is untouched');
    assert.equal(a.thorns.visible, false);
  }
});

test('orbitlock: singularity and well form, the slam hits, the moons are dragged in, the cast ends', () => {
  const bodies = [body(0, 12), body(2, 13), body(-3, 11), body(15, 0)];
  const { a } = arena(OrbitLockAbility, bodies);
  for (let round = 0; round < 2; round++) {
    for (const b of bodies) b.alive = true;
    a.spawn(new Vector3(), new Vector3(0, 0, 1), 12);
    assert.equal(a.vortex.visible, false, 'spawn resets the well');
    let frames = 0;
    let coreSeen = 0;
    let maxOuter = 0;
    let minR = Infinity;
    while (a.isActive && frames < 600) {
      a.update(1 / 30);
      frames++;
      if (a.core.visible) coreSeen++;
      if (a.vortex.visible) maxOuter = Math.max(maxOuter, a._vortexState.outer);
      if (a._slammed && a.planetMesh.visible) {
        const p = a._planetPos[0];
        minR = Math.min(minR, Math.hypot(p.x - a._target.x, p.z - a._target.z));
      }
    }
    const seconds = frames / 30;
    const zone = settings.orbitlock.zoneRadius;
    assert.ok(seconds > 2 && seconds < 6, `screen time ${seconds}`);
    assert.ok(coreSeen > 20, 'the singularity is on screen');
    assert.ok(maxOuter > zone * 0.8, `the well reaches the circle (${maxOuter})`);
    assert.ok(minR < zone * 0.6, `the moons are dragged in (${minR})`);
    assert.ok(bodies.slice(0, 3).every((b) => !b.alive), 'bodies in the ring are launched');
    assert.ok(bodies[3].alive);
    assert.equal(a.vortex.visible, false);
    assert.equal(a.lens.visible, false);
  }
});
