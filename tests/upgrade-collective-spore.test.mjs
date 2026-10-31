import test from 'node:test';
import assert from 'node:assert/strict';
import { Vector3 } from 'three';
import { settings } from '../packs/sandbox/src/config/settings.js';
import { SporeBloomAbility, buildEditor } from '../packs/sandbox/src/abilities/collective/SporeBloomAbility.js';
import sporeConfig from '../packs/sandbox/src/config/collective/spore.js';

settings.spore = structuredClone(sporeConfig.settings);

function mockCtx() {
  const log = { emitted: 0, decals: 0, bursts: 0, flashes: 0, kills: 0 };
  const uniform = () => new Proxy({}, { get: (t, k) => (t[k] ??= { value: k === 'uGravity' ? new Vector3() : 0 }) });
  const system = () => ({
    uniforms: uniform(),
    setGradient() {},
    emit(n) {
      assert.ok(Number.isFinite(n) && n >= 0);
      log.emitted += n;
    }
  });
  const body = {
    position: new Vector3(0, 0, 8),
    alive: true,
    finished: false,
    corrode: (k) => k,
    consume() {},
    bodyPoint: () => true,
    kill() {
      this.alive = false;
      log.kills++;
      return true;
    }
  };
  return {
    log,
    body,
    environment: { registerShadowCasterWithPatch() {} },
    lights: { acquire: () => ({}), set() {}, release() {} },
    particles: { get: () => system() },
    decals: { spawn: () => log.decals++ },
    bursts: { spawn: () => log.bursts++ },
    shake: { add() {}, rumble() {} },
    flash: { trigger: () => log.flashes++ },
    dummies: {
      findBodies(_x, _z, _r, out) {
        out.length = 0;
        out.push(body);
        return out;
      }
    }
  };
}

test('spore: a trail shows the lob, the landing bursts, the cloud turns, the body still drops', () => {
  const ctx = mockCtx();
  const a = new SporeBloomAbility(ctx);
  a.spawn(new Vector3(), new Vector3(0, 0, 1), 8);
  a.update(1 / 30);
  a.update(1 / 30);
  assert.equal(a.trail.visible, true, 'trail drawn behind the pod in flight');
  const pos = a.trailGeometry.attributes.position;
  assert.ok(pos.getY(0) > 0.3, 'trail head rides the lob');
  let steps = 0;
  let burstsAtLanding = -1;
  let trailAfter = 0;
  while (a.isActive && steps < 600) {
    a.update(1 / 30);
    steps++;
    if (burstsAtLanding < 0 && a.impactTime > 0) burstsAtLanding = ctx.log.bursts;
    if (a.impactTime > 0 && a.trail.visible) trailAfter++;
  }
  assert.ok(!a.isActive, 'finishes');
  assert.ok(burstsAtLanding >= 2, 'air shell and spore dust ball on landing');
  assert.ok(trailAfter > 0 && trailAfter < 30, 'the trail settles into the impact, then goes');
  assert.equal(ctx.log.kills, 1, 'hit rule unchanged: the body in the cloud drops once');
  assert.equal(a.trail.visible, false);

  // Reuse resets.
  a.destroy();
  a.spawn(new Vector3(), new Vector3(1, 0, 0), 6);
  a.update(1 / 30);
  assert.equal(a.trail.visible, true);
  a.destroy();
  assert.equal(a.trail.visible, false);
  a.dispose();
});

test('spore: every editor control has a settings key', () => {
  const c = structuredClone(sporeConfig.settings);
  const check = (o, k) => assert.ok(k in o, k);
  const ctl = () => {
    const x = { name: () => x, onChange: () => x, listen: () => x, step: () => x };
    return x;
  };
  const gui = () => ({ add: (o, k) => (check(o, k), ctl()), addColor: (o, k) => (check(o, k), ctl()), addFolder: () => gui(), close() {}, open() {} });
  const Editor = {
    range: (f, o, k) => check(o, k),
    castAnimation() {},
    gradient: (f, o, p) => ['A', 'B', 'C', 'D'].forEach((s) => check(o, p + s))
  };
  buildEditor(gui(), c, Editor);
});
