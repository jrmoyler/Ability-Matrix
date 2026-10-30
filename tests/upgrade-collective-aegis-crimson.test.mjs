import test from 'node:test';
import assert from 'node:assert/strict';
import { Vector3 } from 'three';
import { settings } from '../packs/sandbox/src/config/settings.js';
import { AegisBulwarkAbility, buildEditor as buildAegisEditor } from '../packs/sandbox/src/abilities/collective/AegisBulwarkAbility.js';
import { CrimsonRiteAbility, buildEditor as buildCrimsonEditor } from '../packs/sandbox/src/abilities/collective/CrimsonRiteAbility.js';
import aegis from '../packs/sandbox/src/config/collective/aegis.js';
import crimson from '../packs/sandbox/src/config/collective/crimson.js';

settings.aegis ??= structuredClone(aegis.settings);
settings.crimson ??= structuredClone(crimson.settings);

const box = () => ({ value: { set() {}, copy() {} } });
function mockParticles(counter) {
  return {
    get() {
      const uniforms = new Proxy({}, { get: (t, k) => (t[k] ??= box()) });
      return { uniforms, setGradient() {}, emit: (n) => (counter.emits += n) };
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

function body(x, z) {
  return {
    alive: true,
    position: new Vector3(x, 0, z),
    kills: 0,
    kill() {
      if (!this.alive) return false;
      this.alive = false;
      this.kills++;
      return true;
    }
  };
}

function editorKeys(build, block) {
  const keys = new Set();
  const folder = () => ({
    addFolder: () => folder(),
    add: (o, k) => { keys.add(k); return chain(); },
    addColor: (o, k) => { keys.add(k); return chain(); },
    close() {}, open() {}
  });
  const chain = () => ({ name: () => chain(), onChange: () => chain(), step: () => chain(), listen: () => chain() });
  const Editor = {
    range: (f, o, k) => { keys.add(k); return chain(); },
    castAnimation: () => keys.add('castAnim'),
    gradient: (f, o, prefix) => { for (const s of 'ABCD') keys.add(prefix + s); }
  };
  build(folder(), block, Editor);
  return keys;
}

test('aegis: the dome has a deep body and a standing life, hits stay bounded, reuse resets', () => {
  const bodies = [body(0, 8), body(1.2, 8.5), body(-1.5, 7.4), body(9, 8)];
  const { a } = arena(AegisBulwarkAbility, bodies);
  a.spawn(new Vector3(), new Vector3(0, 0, 1), 8);
  const u = a.domeMaterial.uniforms;
  assert.equal(a.domeMaterial.premultipliedAlpha, true, 'dome body occludes (premultiplied over)');
  const sweeps = new Set();
  let beatSeen = false;
  let frames = 0;
  while (a.isActive && frames < 600) {
    a.update(1 / 30);
    frames++;
    if (a.dome.visible && u.uStand.value > 0.9) {
      sweeps.add(u.uSweepPos.value.toFixed(3));
      if (u.uBeatPhase.value > 0 && u.uBeatPhase.value < 1) beatSeen = true;
      assert.ok(u.uBodyOpacity.value > 0.3, 'deep body present');
    }
  }
  assert.ok(sweeps.size > 20, 'the sweep keeps moving through the linger');
  assert.ok(beatSeen, 'a heartbeat band climbs the dome');
  assert.equal(bodies.slice(0, 3).every((b) => b.kills === 1), true, 'bodies in the dome thrown once');
  assert.equal(bodies[3].kills, 0, 'outside body untouched');
  a.destroy();
  a.spawn(new Vector3(), new Vector3(0, 0, 1), 8);
  assert.equal(a._slamAge, -1);
  assert.equal(a.dome.visible, false);
  assert.equal(a._lastBeat, -1);
  a.destroy();
});

test('aegis: every settings key has an editor slider', () => {
  const keys = editorKeys(buildAegisEditor, settings.aegis);
  for (const k of Object.keys(aegis.settings)) {
    if (k === 'hit') continue;
    assert.ok(keys.has(k), `aegis.${k} has a slider`);
  }
});

test('crimson: the seal and the arc of blood travel from the hand, the moonbeam and heartbeat live in the linger', () => {
  const bodies = [body(0, 10), body(1.5, 10.5), body(-2, 9.6), body(9, 10)];
  const { a } = arena(CrimsonRiteAbility, bodies);
  a.spawn(new Vector3(), new Vector3(0, 0, 1), 10);
  let sealFrames = 0;
  let arcInFlight = 0;
  let arcAfterLanding = 0;
  let beamFrames = 0;
  const beats = new Set();
  let frames = 0;
  let landed = false;
  while (a.isActive && frames < 600) {
    a.update(1 / 30);
    frames++;
    if (a.phase === 'travel') {
      if (a.seal.visible) sealFrames++;
      if (a.arc.visible) arcInFlight++;
    } else {
      landed = true;
      assert.equal(a.seal.visible, false, 'the seal is gone once it lands');
      if (a.arc.visible) arcAfterLanding++;
      if (a.beam.visible) beamFrames++;
      const bp = a.spikeMaterial.uniforms.uBeatPhase.value;
      if (bp >= 0) beats.add(bp.toFixed(2));
    }
  }
  assert.ok(landed);
  assert.ok(sealFrames >= 3, 'the seal is on screen in flight');
  assert.ok(arcInFlight >= 3, 'the arc of blood is drawn behind it');
  assert.ok(arcAfterLanding >= 10, 'the arc stays strung after landing, draining into the circle');
  assert.ok(beamFrames >= 20, 'the moonbeam stands over the rite');
  assert.ok(beats.size > 10, 'the heartbeat keeps the field moving');
  assert.equal(bodies.slice(0, 3).every((b) => b.kills === 1), true, 'bodies in the circle impaled once');
  assert.equal(bodies[3].kills, 0, 'outside body untouched');
  a.destroy();
  a.spawn(new Vector3(), new Vector3(0, 0, 1), 10);
  assert.equal(a._beatFrac, -1);
  assert.equal(a._rite, 0);
  a.destroy();
  assert.equal(a.arc.visible, false);
  assert.equal(a.beam.visible, false);
});

test('crimson: every settings key has an editor slider', () => {
  const keys = editorKeys(buildCrimsonEditor, settings.crimson);
  for (const k of Object.keys(crimson.settings)) {
    assert.ok(keys.has(k), `crimson.${k} has a slider`);
  }
});
