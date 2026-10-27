import test from 'node:test';
import assert from 'node:assert/strict';
import { Matrix4, Vector3 } from 'three';
import { settings } from '../packs/sandbox/src/config/settings.js';
import { GlyphBarrageAbility, ID } from '../packs/sandbox/src/abilities/codex/GlyphBarrageAbility.js';

/** A uniform bag that answers any name with a settable value. */
function uniformBag() {
  return new Proxy({}, {
    get(target, key) {
      if (!(key in target)) target[key] = { value: key === 'uGravity' ? new Vector3() : 0 };
      return target[key];
    },
  });
}

function makeCtx() {
  const decals = [];
  const bursts = [];
  const systems = new Map();
  const particles = {
    get(name) {
      if (!systems.has(name)) systems.set(name, { uniforms: uniformBag(), setGradient() {}, emitted: 0, emit(n) { this.emitted += n; } });
      return systems.get(name);
    },
  };
  return {
    decals, bursts, systems,
    ctx: {
      particles,
      decals: { spawn: (type, pos, opts) => decals.push({ type, radius: opts.radius }) },
      bursts: { spawn: (mode, pos, opts) => bursts.push(opts) },
      shake: { add() {}, rumble() {} },
      flash: { trigger() {} },
      lights: { acquire: () => ({}), release() {}, set() {} },
      dummies: { findTargets: (x, z, r, out) => ((out.length = 0), out), findBodies: (x, z, r, out) => ((out.length = 0), out) },
    },
  };
}

function run(ability, seconds) {
  for (let t = 0; t < seconds; t += 1 / 30) ability.update(1 / 30);
}

test('glyph barrage: seals fly, stamp, hover and are swallowed; chain runs outward; floor keeps scorch', () => {
  assert.ok(settings[ID], 'settings block registered');
  const { ctx, decals } = makeCtx();
  const ability = new GlyphBarrageAbility(ctx);
  ability.spawn(new Vector3(0, 0, 0), new Vector3(0, 0, 1), 14);
  const m = new Matrix4();
  const pos = new Vector3();

  // In flight: at least one seal is airborne ahead of the front.
  run(ability, 0.2);
  assert.ok(ability.seals.count > 0);
  let airborne = false;
  for (let i = 0; i < ability.seals.count; i++) {
    ability.seals.getMatrixAt(i, m);
    pos.setFromMatrixPosition(m);
    const scale = new Vector3().setFromMatrixScale(m).x;
    if (scale > 1e-3 && pos.y > 0.3) airborne = true;
  }
  assert.ok(airborne, 'a seal is in the air during travel');

  // By the chain charge every glyph is stamped and its seal hovers.
  run(ability, 1.2);
  ability.seals.getMatrixAt(0, m);
  pos.setFromMatrixPosition(m);
  assert.ok(pos.y > 1, `first seal hovers (y=${pos.y})`);
  assert.ok(decals.some((d) => d.type === 'scorch' || d.type === 0 || d.radius > 0), 'imprints written');

  // Outward order: the first glyph to erupt is the one nearest the caster.
  const erupted = ability._glyphs.filter((g) => g.eruptAt >= 0);
  if (erupted.length >= 2) assert.ok(ability._glyphs[0].eruptAt <= ability._glyphs[erupted.length - 1].eruptAt);

  run(ability, 6);
  ability.destroy?.();
  assert.equal(ability.seals.count, 0, 'pooled seals hidden on destroy');

  // Reuse resets.
  ability.spawn(new Vector3(0, 0, 0), new Vector3(1, 0, 0), 10);
  run(ability, 0.05);
  for (const g of ability._glyphs) assert.ok(g.eruptAt < 0);
  ability.dispose();
});
