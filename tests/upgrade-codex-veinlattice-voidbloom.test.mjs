import test from 'node:test';
import assert from 'node:assert/strict';
import { Vector3 } from 'three';
import { settings } from '../packs/sandbox/src/config/settings.js';
import { VeinLatticeAbility } from '../packs/sandbox/src/abilities/codex/VeinLatticeAbility.js';
import { VoidBloomAbility } from '../packs/sandbox/src/abilities/codex/VoidBloomAbility.js';
import veinlattice from '../packs/sandbox/src/config/codex/veinlattice.js';
import voidbloom from '../packs/sandbox/src/config/codex/voidbloom.js';

settings.veinlattice ??= structuredClone(veinlattice.settings);
settings.voidbloom ??= structuredClone(voidbloom.settings);

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
    sunk: 0,
    released: 0,
    kill() {
      if (!this.alive) return false;
      this.alive = false;
      return true;
    },
    bodyPoint(out) {
      return out.copy(this.position).setY(this.finished ? -9 : 0.9 - this.sunk);
    },
    carry(field, a) {
      const v = field(0, 0, 0, new Vector3());
      this.position.x += v.x * a * 0.1;
      this.position.z += v.z * a * 0.1;
    },
    hold() {},
    sink(d) {
      this.sunk = Math.min(d, this.sunk + 0.05);
    },
    consume() {},
    release() {
      this.released++;
    }
  };
}

function arena(Ability, bodies) {
  const counter = { emits: 0, decals: 0, bursts: 0, shakes: 0 };
  const ctx = {
    particles: mockParticles(counter),
    lights: { acquire: () => ({}), set() {}, release() {} },
    decals: { spawn: () => counter.decals++ },
    bursts: { spawn: () => counter.bursts++ },
    shake: { add: () => counter.shakes++, rumble() {} },
    flash: { trigger() {} },
    dummies: {
      findBodies(x, z, r, out) {
        out.length = 0;
        for (const b of bodies) if (Math.hypot(b.position.x - x, b.position.z - z) <= r) out.push(b);
        return out;
      }
    }
  };
  return { a: new Ability(ctx), counter };
}

test('veinlattice: the feeder travels, the lattice climbs and beats on a dark ramp, withers, and resets', () => {
  const c = settings.veinlattice;
  // A four-stop ramp whose deep stops are genuinely dark.
  const lum = (hex) => {
    const n = parseInt(hex.slice(1), 16);
    return (0.2126 * (n >> 16) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255)) / 255;
  };
  assert.ok(lum(c.colorSkinDark) < 0.05 && lum(c.colorSkin) < 0.08, 'deep stops are dark');
  assert.ok(lum(c.colorVeinBody) < 0.12, 'body is a saturated deep red, not pastel');
  assert.ok(lum(c.colorVeinHot) > lum(c.colorBlood), 'hot stop is the brightest');

  const { a, counter } = arena(VeinLatticeAbility, []);
  for (let round = 0; round < 2; round++) {
    a.spawn(new Vector3(), new Vector3(0, 0, 1), 12);
    assert.equal(a.net.visible, false, 'spawn hides the lattice');
    let frames = 0;
    let fronts = 0;
    let beats = 0;
    let last = 0;
    let maxBeat = 0;
    let minBeat = Infinity;
    while (a.isActive && frames < 600) {
      a.update(1 / 30);
      frames++;
      if (a.phase === 'travel' || a._clock < 0) fronts = Math.max(fronts, a._feedState.front);
      if (a._beatIndex !== last && a._beatIndex >= 0) beats++;
      last = a._beatIndex;
      if (a.net.visible && a._clock > a._grownAt(c, settings.global) + 0.1) {
        maxBeat = Math.max(maxBeat, a._beatNow);
        minBeat = Math.min(minBeat, a._beatNow);
      }
    }
    const seconds = frames / 30;
    assert.ok(seconds > 2 && seconds < 6, `screen time ${seconds}`);
    assert.ok(fronts > 5, 'the feeder visibly travels down the line');
    assert.ok(beats >= 2, `it beats (${beats})`);
    assert.ok(maxBeat - minBeat > 0.6, 'the beat swings between rest and peak');
    assert.equal(a.net.visible, false);
    assert.equal(a.feeder.visible, false);
  }
  assert.ok(counter.emits > 0 && counter.decals > 0 && counter.shakes > 0);
});

test('voidbloom: a crawl travels from the caster, the bloom opens round a dark core, pulls, snaps and sinks', () => {
  const bodies = [body(0, 12), body(1.5, 12.5), body(-2, 11), body(14, 0)];
  const { a, counter } = arena(VoidBloomAbility, bodies);
  for (let round = 0; round < 2; round++) {
    for (const b of bodies) {
      b.alive = true;
      b.sunk = 0;
    }
    bodies[0].position.set(0, 0, 12);
    bodies[1].position.set(1.5, 0, 12.5);
    bodies[2].position.set(-2, 0, 11);
    a.spawn(new Vector3(), new Vector3(0, 0, 1), 12);
    assert.equal(a.core.visible, false, 'spawn hides the core');
    let frames = 0;
    let crawlTravel = 0;
    let crawlFrames = 0;
    let coreMax = 0;
    let coreFrames = 0;
    while (a.isActive && frames < 600) {
      a.update(1 / 30);
      frames++;
      if (a.phase === 'travel' && a.crawl.visible) {
        crawlFrames++;
        crawlTravel = Math.max(crawlTravel, a._crawlState.front);
      }
      if (a.core.visible) {
        coreFrames++;
        coreMax = Math.max(coreMax, a._coreState.radius);
      }
    }
    const seconds = frames / 30;
    assert.ok(seconds > 2 && seconds < 7, `screen time ${seconds}`);
    assert.ok(crawlFrames > 5 && crawlTravel > 6, `the crawl surges from the caster (${crawlTravel} m)`);
    assert.ok(coreFrames > 20 && coreMax > 0.5, `the void core stands in the throat (${coreMax} m)`);
    assert.ok(bodies.slice(0, 3).every((b) => !b.alive), 'bodies in the circle are taken');
    assert.ok(bodies[3].alive, 'a body far off is untouched');
    assert.equal(a.crawl.visible, false);
    assert.equal(a.core.visible, false);
  }
  assert.ok(counter.bursts > 0 && counter.decals > 0);
});
