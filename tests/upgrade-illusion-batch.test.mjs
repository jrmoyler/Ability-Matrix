import test from 'node:test';
import assert from 'node:assert/strict';
import { Vector3 } from 'three';
import { settings } from '../packs/sandbox/src/config/settings.js';
import { MirageConstructAbility } from '../packs/sandbox/src/abilities/matrix-new/MirageConstructAbility.js';
import { HallOfEchoesAbility } from '../packs/sandbox/src/abilities/atlas/HallOfEchoesAbility.js';
import { PrismLieAbility } from '../packs/sandbox/src/abilities/codex/PrismLieAbility.js';
import mirageConfig from '../packs/sandbox/src/config/matrix-new/mirage.js';
import echoesConfig from '../packs/sandbox/src/config/atlas/echoes.js';
import prismConfig from '../packs/sandbox/src/config/codex/prismlie.js';

settings.mirage ??= structuredClone(mirageConfig.settings);
settings.echoes ??= structuredClone(echoesConfig.settings);
settings.prismlie ??= structuredClone(prismConfig.settings);

/** A context that records what the cast asks of the engine (no character: fallbacks). */
function mockCtx(bodies = []) {
  const log = { emitted: 0, decals: 0, bursts: 0, kills: 0, flashes: 0 };
  const uniform = () => new Proxy({}, { get: (t, k) => (t[k] ??= { value: k === 'uGravity' ? new Vector3() : 0 }) });
  const system = () => ({
    uniforms: uniform(),
    setGradient() {},
    emit(n) {
      assert.ok(Number.isFinite(n) && n >= 0, 'emit count is finite');
      log.emitted += n;
    }
  });
  const ctx = {
    log,
    camera: { position: new Vector3(0, 6, -8) },
    lights: { acquire: () => ({}), set() {}, release() {} },
    particles: { get: () => system() },
    decals: { spawn: () => log.decals++ },
    bursts: { spawn: () => log.bursts++ },
    shake: { add() {}, rumble() {} },
    flash: { trigger: () => log.flashes++ },
    dummies: {
      findTargets(x, z, r, out) {
        out.length = 0;
        for (const b of bodies) if (b.alive && Math.hypot(b.position.x - x, b.position.z - z) <= r) out.push(b);
        return out;
      },
      findBodies(x, z, r, out) {
        return this.findTargets(x, z, r, out);
      }
    }
  };
  for (const b of bodies) {
    b.alive = true;
    b.kill = () => {
      if (!b.alive) return false;
      b.alive = false;
      log.kills++;
      return true;
    };
  }
  return ctx;
}

const cluster = (z) => [0, 1, 2, 3, 4].map((i) => ({ position: new Vector3(Math.cos(i * 1.3) * 1.2, 0, z + Math.sin(i * 1.3) * 1.2) }));

function play(a, watch) {
  let steps = 0;
  while (a.isActive && steps < 900) {
    a.update(1 / 30);
    watch?.(a);
    steps++;
  }
  assert.ok(!a.isActive, 'finishes');
  assert.ok(steps / 30 < 6, 'screen time is bounded');
  return steps;
}

test('mirage construct: road, lake, looming copy, veil, burst that kills the circle, clean reuse', () => {
  const bodies = cluster(10);
  const ctx = mockCtx(bodies);
  const a = new MirageConstructAbility(ctx);
  a.spawn(new Vector3(), new Vector3(0, 0, 1), 10);
  let road = false;
  let veil = false;
  let maxScale = 0;
  let maxPool = 0;
  play(a, (x) => {
    road ||= x.road.visible;
    veil ||= x.veil.visible;
    maxScale = Math.max(maxScale, x._scale());
    maxPool = Math.max(maxPool, x._poolState.radius);
  });
  assert.ok(road, 'the road shows the travel');
  assert.ok(veil, 'the heat veil stands');
  assert.ok(maxScale > 1.5, 'the copy looms');
  assert.ok(maxPool > settings.mirage.zoneRadius * 0.8, 'the lake fills the zone');
  assert.ok(ctx.log.kills >= 1 && ctx.log.kills <= bodies.length, 'hits are bounded');
  a.spawn(new Vector3(), new Vector3(0, 0, 1), 10);
  assert.equal(a._stand, -1);
  assert.equal(a.shards.count, 0, 'spawn resets');
  a.destroy();
  a.dispose();
});

test('hall of echoes: the hall rises, panes break, copy shards cut, floor stays, clean reuse', () => {
  const bodies = cluster(11);
  const ctx = mockCtx(bodies);
  const a = new HallOfEchoesAbility(ctx);
  a.spawn(new Vector3(), new Vector3(0, 0, 1), 11);
  let panes = 0;
  let floor = false;
  play(a, (x) => {
    if (x.panes.visible) panes = Math.max(panes, x.panes.count);
    floor ||= x.floor.visible;
  });
  assert.equal(panes, Math.round(settings.echoes.paneCount), 'every pane stands');
  assert.ok(a.paneDice.slice(0, panes).every((d) => d.broken), 'every pane breaks');
  assert.ok(floor, 'black glass floor');
  assert.equal(a.panes.layers.mask, 1, 'panes are solid world geometry');
  assert.ok(ctx.log.kills <= bodies.length, 'hits are bounded');
  a.spawn(new Vector3(), new Vector3(0, 0, 1), 11);
  assert.ok(a.paneDice.every((d) => !d.broken), 'spawn resets');
  a.destroy();
  a.dispose();
});

test('prism lie: plant, monolith stands with fan and satellites, shatters on exit, clean reuse', () => {
  const ctx = mockCtx([]);
  const a = new PrismLieAbility(ctx);
  a.spawn(new Vector3(), new Vector3(0, 0, 1), 13);
  let mono = false;
  let fan = false;
  let shattered = false;
  play(a, (x) => {
    mono ||= x.monolith.visible;
    fan ||= x.fan.visible;
    shattered ||= x._shattered;
  });
  assert.ok(mono && fan && shattered, 'monolith, fan, shatter');
  assert.ok(a.monolith.castShadow, 'the monolith is lit, shadow-casting');
  a.spawn(new Vector3(), new Vector3(0, 0, 1), 13);
  assert.ok(!a._planted && !a._shattered && a.monolith.count === 0, 'spawn resets');
  a.destroy();
  a.dispose();
});
