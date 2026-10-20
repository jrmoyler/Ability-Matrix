import { Mesh, PlaneGeometry, Vector3 } from 'three';
import { Ability } from '../Ability.js';
import {
  createCenserMarchBodyMaterial,
  createCenserMarchLensMaterial,
  createCenserMarchGroundMaterial
} from '../../materials/codex/CenserMarchMaterials.js';
import { ParticleShape } from '../../particles/ParticleSystem.js';
import { RateEmitter } from '../../particles/ParticleEngine.js';
import { DecalType } from '../../effects/GroundDecals.js';
import { BurstMode } from '../../effects/BurstSphere.js';
import { LAYER } from '../../core/Layers.js';
import { frame } from '../../core/FrameUniforms.js';
import { settings } from '../../config/settings.js';
import { getColor } from '../../utils/color.js';
import { saturate, lerp, Easing } from '../../utils/math.js';

export const ID = 'censers';

const CAST = 'zone';
const ARCH = 'spire';
const VARIANT = 1;
const HIT = 'in';
const CARRY = 'in';
const DECAL = DecalType.DUSTRING;
const BURST = BurstMode.AIR;
const PRIMARY = ParticleShape.SOFT;

const _emit = {};
const _pos = new Vector3();
const _dir = new Vector3();
const _end = new Vector3();
const _focus = new Vector3();

/**
 * CENSER MARCH — holy, zone cast.
 *
 * Holy — censers rise in a ring, swing once, and slam their smoke inward.
 *
 * The silhouette is a ring of standing columns. Variant 1 decides the
 * commitment: hit `in`, then carry `in`. It is not a recolour of the
 * other holy castables — the motion, the hit direction and the
 * shader's spire placement are this spell's own.
 *
 * ## Layers (each a folder in the editor)
 *
 *   1. **the body** — a subdivided quad placed in the vertex stage as
 *      a ring of standing columns. Additive, with a ridged fbm body and a bright edge.
 *   2. **the lens** — the same placement on `LAYER.DISTORTION`, so the
 *      world bends with the cast instead of merely glowing.
 *   3. **the ground** — a crack fan
 *      written under the footprint and eroded on the way out.
 *   4. **the shed** — a RateEmitter of SOFT plus dust and chips,
 *      rates read live so a slider never snaps the count.
 *   5. **the hit** — `handlesOwnHits`. Bodies are thrown inward, toward the centre. What is already down is carried by the field until the cast ends.
 *   6. **the beat** — impact burst (AIR), decal (DUSTRING),
 *      screen flash and a camera punch, then a light that decays on its own.
 *
 * ## The editor rule
 *
 * A cast captures a seed and an integrated spin. Every metre, rate and colour
 * is read from `settings.censers` each frame.
 */
export class CenserMarchAbility extends Ability {
  constructor(ctx) {
    super(ID, ctx);
  }

  get handlesOwnHits() {
    return true;
  }

  get instanceCount() {
    return this._hits;
  }

  createShaders() {
    this.bodyGeometry = new PlaneGeometry(1, 1, 64, 24);
    this.groundGeometry = new PlaneGeometry(1, 1, 1, 1);
    this.bodyMaterial = createCenserMarchBodyMaterial();
    this.lensMaterial = createCenserMarchLensMaterial();
    this.groundMaterial = createCenserMarchGroundMaterial();
    this.body = this._mesh(this.bodyGeometry, this.bodyMaterial, LAYER.VFX, 12);
    this.lens = this._mesh(this.bodyGeometry, this.lensMaterial, LAYER.DISTORTION, 0);
    this.ground = this._mesh(this.groundGeometry, this.groundMaterial, LAYER.VFX, 1);
    this._state = {
      center: new Vector3(),
      origin: new Vector3(),
      dir: new Vector3(0, 0, 1),
      side: new Vector3(1, 0, 0),
      radius: 1,
      length: 1,
      height: 1,
      thickness: 0.3,
      count: 6,
      spin: 0,
      open: 1,
      grow: 1,
      along: 0,
      seed: 0,
      fade: 1,
      dissolve: 0,
      foot: 1,
      footWidth: 1
    };
    this._seed = 0;
    this._spin = 0;
    this._hits = 0;
    this._struck = [];
    this._carried = [];
    this._boltsHit = new Set();
    this._force = { impulse: 0, lift: 0, spin: 0 };
    this._flow = { vx: 0, vy: 0, vz: 0 };
    this._field = (x, y, z, out) => out.set(this._flow.vx, this._flow.vy, this._flow.vz);
    this._found = [];
  }

  _mesh(geometry, material, layer, order) {
    const mesh = new Mesh(geometry, material);
    mesh.layers.set(layer);
    mesh.renderOrder = order;
    mesh.frustumCulled = false;
    mesh.visible = false;
    this.group.add(mesh);
    return mesh;
  }

  createParticles() {
    const particles = this.ctx.particles;
    this.dust = particles.get('censers.dust', {
      capacity: 900,
      shape: ParticleShape.SMOKE,
      additive: false,
      curl: true,
      softFade: 0.65
    });
    this.streaks = particles.get('censers.streak', {
      capacity: 1200,
      shape: PRIMARY,
      additive: true,
      stretch: true,
      softFade: 0.2
    });
    this.chips = particles.get('censers.chip', {
      capacity: 500,
      shape: ParticleShape.CHIP,
      additive: false,
      lit: true,
      softFade: 0.15
    });
    this.dustEmitter = new RateEmitter();
    this.streakEmitter = new RateEmitter();
    this.chipEmitter = new RateEmitter();
  }

  get impactDuration() {
    return Math.max(0.05, settings[ID].impactTime * settings.global.lifetime);
  }

  get fadeDuration() {
    return Math.max(0.1, settings[ID].fadeTime * settings.global.lifetime);
  }

  lightShimmer() {
    const f = settings[ID].lightFlicker;
    return 1 - f + f * Math.sin(this.age * (6 + VARIANT));
  }

  onSpawn() {
    this._seed = Math.random() * 10;
    this._spin = Math.random() * Math.PI * 2;
    this._hits = 0;
    this._struck.length = 0;
    this._carried.length = 0;
    this._boltsHit.clear();
    this.dustEmitter.reset();
    this.streakEmitter.reset();
    this.chipEmitter.reset();
    this.body.visible = false;
    this.lens.visible = false;
    this.ground.visible = false;
  }

  _focusPoint(out) {
    if (CAST === 'zone') return this.pointAt(1, out);
    return this.pointAt(this.u, out);
  }

  _writeFrame(open, grow, along, dissolve, fade) {
    const c = settings[ID];
    const g = settings.global;
    const st = this._state;
    this._focusPoint(_focus);
    st.center.copy(_focus);
    st.origin.copy(this.origin);
    st.dir.copy(this.direction);
    st.side.copy(this.side);
    st.radius = CAST === 'zone' ? Math.max(0.2, c.zoneRadius) : Math.max(0.2, c.sweep);
    st.length = Math.max(0.2, this.length);
    st.height = c.height * g.shaderIntensity;
    st.thickness = c.thickness;
    st.count = Math.max(1, c.count);
    st.spin = this._spin;
    st.open = open;
    st.grow = grow;
    st.along = along;
    st.seed = this._seed;
    st.fade = fade;
    st.dissolve = dissolve;
    st.foot = CAST === 'zone' ? c.zoneRadius * 2 : Math.max(0.4, this.front);
    st.footWidth = CAST === 'zone' ? c.zoneRadius * 2 : c.groundWidth;
    this.bodyMaterial.userData.sync(st);
    this.lensMaterial.userData.sync(st);
    this.groundMaterial.userData.sync(st);
    const show = fade > 0.02 && grow > 0.02;
    this.body.visible = show;
    this.lens.visible = show;
    this.ground.visible = fade > 0.02;
    this.position.copy(_focus);
    this.position.y = c.height * 0.45;
  }

  _palette() {
    const c = settings[ID];
    const g = settings.global;
    const sync = (p, a, b, cc, d, size, glow, grav) => {
      p.setGradient(getColor(a), getColor(b), getColor(cc), getColor(d));
      p.uniforms.uSizeScale.value = size * g.particleSize * 7;
      p.uniforms.uLifeScale.value = g.particleLifetime;
      p.uniforms.uSpeedScale.value = g.particleSpeed;
      p.uniforms.uOpacity.value = g.opacity;
      p.uniforms.uGlow.value = glow;
      p.uniforms.uGravity.value.set(0, grav, 0);
    };
    sync(this.dust, c.colorDustA, c.colorDustB, c.colorDustC, c.colorDustD, c.dustSize, 1, 0.4);
    this.dust.uniforms.uOpacity.value = c.dustOpacity * g.opacity;
    sync(this.streaks, c.colorStreakA, c.colorStreakB, c.colorStreakC, c.colorStreakD, c.streakSize, 2 * g.glow, 0);
    this.streaks.uniforms.uStretch.value = c.streakStretch;
    sync(this.chips, c.colorChipA, c.colorChipB, c.colorChipC, c.colorChipD, c.chipSize, 1, -9);
  }

  _fillEmit(position, radius, direction, speed, spread, size, life, spin) {
    _emit.position = position;
    _emit.radius = radius;
    _emit.direction = direction;
    _emit.speed = speed;
    _emit.speedVariance = 0.4;
    _emit.spread = spread;
    _emit.inherit = null;
    _emit.anchor = null;
    _emit.size = size;
    _emit.sizeVariance = 0.5;
    _emit.life = life;
    _emit.lifeVariance = 0.35;
    _emit.spin = spin;
    _emit.tint = null;
    _emit.time = frame.uTime.value;
  }

  _shed(dt, strength) {
    const c = settings[ID];
    const g = settings.global;
    this._focusPoint(_end);
    const dustN = Math.round(this.dustEmitter.tick(dt, c.dustRate * strength) * g.particleCount);
    if (dustN > 0) {
      this._fillEmit(_end, 0.35, _dir, c.dustSpeed, 0.5, 0.45, c.dustLife, 0.4);
      for (let i = 0; i < dustN; i++) {
        _dir.copy(this.direction).addScaledVector(this.side, Math.random() - 0.5).setY(0.6);
        _emit.direction = _dir;
        this.dust.emit(1, _emit);
      }
    }
    const streakN = Math.round(this.streakEmitter.tick(dt, c.streakRate * strength) * g.particleCount);
    if (streakN > 0) {
      this._fillEmit(_end, 0.2, _dir, c.streakSpeed, 0.25, 0.08, c.streakLife, 2);
      for (let i = 0; i < streakN; i++) {
        const ang = this._spin + i;
        _dir.set(Math.cos(ang), 0.35, Math.sin(ang));
        _emit.direction = _dir;
        this.streaks.emit(1, _emit);
      }
    }
    const chipN = Math.round(this.chipEmitter.tick(dt, c.chipRate * strength) * g.particleCount);
    if (chipN > 0) {
      this._fillEmit(_end, 0.15, _dir, c.chipSpeed, 0.45, 0.08, c.chipLife, 8);
      for (let i = 0; i < chipN; i++) {
        _dir.copy(this.side).multiplyScalar(Math.random() < 0.5 ? -1 : 1).setY(0.8);
        _emit.direction = _dir;
        this.chips.emit(1, _emit);
      }
    }
  }

  _already(dummy) {
    for (let i = 0; i < this._struck.length; i++) if (this._struck[i] === dummy) return true;
    return false;
  }

  _remember(dummy) {
    if (this._struck.length < 24) this._struck.push(dummy);
    if (CARRY !== 'none' && this._carried.length < 16) this._carried.push(dummy);
    this._hits++;
  }


  _blow(dummy, mode) {
    const c = settings[ID];
    const g = settings.global;
    this._focusPoint(_focus);
    if (mode === 'out' || mode === 'in' || mode === 'tangent' || mode === 'ring') {
      _dir.set(dummy.position.x - _focus.x, 0, dummy.position.z - _focus.z);
      if (_dir.lengthSq() < 1e-6) _dir.copy(this.direction);
      else _dir.normalize();
      if (mode === 'in') _dir.multiplyScalar(-1);
      if (mode === 'tangent') {
        const x = _dir.x;
        _dir.set(-_dir.z, 0, x);
      }
    } else if (mode === 'side') {
      const lateral = (dummy.position.x - _focus.x) * this.side.x + (dummy.position.z - _focus.z) * this.side.z;
      _dir.copy(this.side).multiplyScalar(lateral < 0 ? -1 : 1);
    } else if (mode === 'up') {
      _dir.copy(this.direction).multiplyScalar(0.25);
    } else if (mode === 'swing') {
      const ang = lerp(-c.sweep, c.sweep, saturate(this.u));
      _dir.copy(this.direction).multiplyScalar(Math.cos(ang)).addScaledVector(this.side, Math.sin(ang));
    } else {
      _dir.copy(this.direction);
    }
    this._force.impulse = c.hitImpulse * g.explosionIntensity;
    this._force.lift = c.hitLift * g.explosionIntensity * (mode === 'up' ? 1.4 : 1);
    this._force.spin = c.hitSpin;
    const slice = mode === 'slice' || mode === 'swing';
    if (dummy.kill(_dir.x, _dir.z, this._force, slice)) this._remember(dummy);
  }

  _gather(x, z, radius) {
    const field = this.ctx.dummies;
    if (!field?.findTargets) return;
    const found = field.findTargets(x, z, radius, this._found);
    for (let i = 0; i < found.length; i++) {
      const dummy = found[i];
      if (this._already(dummy)) continue;
      this._blow(dummy, HIT === 'ring' ? 'out' : HIT);
    }
    this._found.length = 0;
  }

  _strikeTravel() {
    const c = settings[ID];
    if (CAST === 'zone' && (ARCH === 'spire' || ARCH === 'cage' || ARCH === 'halo' || ARCH === 'well')) return;
    if (ARCH === 'volley') {
      this._strikeBolts(false);
      return;
    }
    if (ARCH === 'pendulum' || ARCH === 'lance' || ARCH === 'whip') {
      this._focusPoint(_end);
      this._gather(_end.x, _end.z, Math.max(0.3, c.hitRadius));
    }
  }

  _strikeBolts(forceAll) {
    const c = settings[ID];
    const n = Math.max(1, Math.round(c.count));
    for (let i = 0; i < n; i++) {
      const head = saturate(this.u * n - i);
      if (!forceAll && head < 0.98) continue;
      if (this._boltsHit.has(i)) continue;
      this._boltsHit.add(i);
      const lane = ((i + 0.5) / n - 0.5) * 2 * c.sweep;
      const s = VARIANT === 2 ? 1 - i / n : (i + 0.5) / n;
      this.pointAt(s, _end).addScaledVector(this.side, lane);
      this._gather(_end.x, _end.z, Math.max(0.4, c.thickness * 4 + 0.6));
    }
  }

  _commit() {
    const c = settings[ID];
    this._focusPoint(_end);
    if (ARCH === 'volley') {
      this._strikeBolts(true);
      return;
    }
    const reach = CAST === 'zone' ? Math.max(c.zoneRadius, c.hitRadius) : Math.max(0.4, c.hitRadius);
    this._gather(_end.x, _end.z, reach);
  }

  _drag(dt, fade) {
    if (CARRY === 'none' || fade <= 0.02) return;
    const c = settings[ID];
    this._focusPoint(_focus);
    const grab = saturate(6 * dt) * fade;
    for (let i = this._carried.length - 1; i >= 0; i--) {
      const dummy = this._carried[i];
      if (!dummy || dummy.finished || dummy.alive) {
        dummy?.release?.();
        this._carried.splice(i, 1);
        continue;
      }
      const at = dummy.bodyPoint ? dummy.bodyPoint(_pos) : dummy.position;
      if (!at) continue;
      const dx = _focus.x - at.x;
      const dz = _focus.z - at.z;
      const d = Math.max(0.2, Math.hypot(dx, dz));
      const inward = CARRY === 'in' ? 1 : CARRY === 'out' ? -1 : 0.2;
      const spin = CARRY === 'orbit' ? 4 : 1.1;
      const lift = CARRY === 'up' ? 7 : 1.4;
      this._flow.vx = (dx / d) * inward * 6 * c.sweep + (-dz / d) * spin;
      this._flow.vz = (dz / d) * inward * 6 * c.sweep + (dx / d) * spin;
      this._flow.vy = lift * fade;
      dummy.carry(this._field, grab, grab, CARRY === 'up' ? 0.35 : 0);
    }
  }

  _step(dt, dissolve, fade, committed) {
    const c = settings[ID];
    const t = committed ? saturate(this.impactTime / Math.max(0.05, this.impactDuration)) : this.u;
    let grow = 1;
    let open = 1;
    if (committed) { open = lerp(0.15, 1.2, Easing.inCubic(saturate(t))); grow = 1; }
    else { grow = Easing.outCubic(saturate(this.u)); open = 0.15 * this.u; }
    const along = ARCH === 'pendulum' && VARIANT === 2
      ? this.u
      : (ARCH === 'pendulum' || ARCH === 'lance' || ARCH === 'whip' || ARCH === 'volley' ? (committed ? 1 : this.u) : 1);
    this._writeFrame(open, grow, along, dissolve, fade);
    this._palette();
    this._shed(dt, fade * (0.35 + 0.65 * grow));
    if (!committed) this._strikeTravel();
    void c;
  }


  _beat() {
    const c = settings[ID];
    const g = settings.global;
    const power = g.explosionIntensity;
    this._focusPoint(_end);
    this.ctx.shake.add(c.impactShake * power * g.cameraShake, 4, 18);
    this.ctx.flash.trigger(getColor(c.colorFlash), c.impactFlash * power);
    this.lightBoost = c.impactLight * power;
    this.ctx.bursts.spawn(BURST, _pos.copy(_end).setY(Math.max(0.4, c.height * 0.4)), {
      radius: 0.35,
      endRadius: c.burstRadius * power,
      life: c.burstLife,
      intensity: 1.4,
      opacity: 0.85 * g.opacity,
      squash: 0.7,
      colorA: getColor(c.colorBurstA),
      colorB: getColor(c.colorBurstB),
      colorC: getColor(c.colorBurstC)
    });
    this.ctx.decals.spawn(DECAL, _end, {
      radius: c.shockRadius * (CAST === 'zone' ? 1 : 0.65) * power,
      life: c.shockLife,
      width: 0.08,
      intensity: 1,
      colorA: getColor(c.colorShockA),
      colorB: getColor(c.colorShockB),
      height: 0.03
    });
    this.ctx.decals.spawn(DecalType.SHOCKWAVE, _end, {
      radius: c.shockRadius * 0.85,
      life: c.shockLife * 0.8,
      width: 0.05,
      intensity: 0.9,
      colorA: getColor(c.colorShockB),
      colorB: getColor(c.colorShockA),
      height: 0.035
    });
  }

  onTravel(dt) {
    this._spin += dt * settings[ID].spinSpeed * settings.global.animationSpeed;
    this._step(dt, 0, 1, false);
    this.ctx.shake.rumble(0.04 * settings[ID].impactShake * settings.global.cameraShake, dt);
  }

  onImpact() {
    this._beat();
    this._commit();
  }

  onFade(dt, t) {
    const fade = t < 1 ? 1 : 1 - (t - 1);
    const dissolve = t < 1 ? 0 : saturate((t - 1) * 1.15);
    this._spin += dt * settings[ID].spinSpeed * settings.global.animationSpeed * 0.35;
    this._step(dt, dissolve, fade, true);
    this._drag(dt, fade);
  }

  onDestroy() {
    for (let i = 0; i < this._carried.length; i++) this._carried[i].release?.();
    this._carried.length = 0;
    this.body.visible = false;
    this.lens.visible = false;
    this.ground.visible = false;
  }

  dispose() {
    this.bodyGeometry.dispose();
    this.groundGeometry.dispose();
    this.bodyMaterial.dispose();
    this.lensMaterial.dispose();
    this.groundMaterial.dispose();
    super.dispose();
  }
}

export function buildEditor(gui, c, Editor) {
  const folder = gui.addFolder('Censer March');
  const R = Editor.range;

  const cast = folder.addFolder('The cast');
  R(cast, c, 'range', 4, 40, 0.1, 'max range');
  R(cast, c, 'minRange', 0, 12, 0.1, 'min range');
  R(cast, c, 'speed', 2, 60, 0.5, 'travel (m/s)');
  R(cast, c, 'cooldown', 0, 8, 0.05, 'cooldown');
  R(cast, c, 'impactTime', 0.05, 3, 0.01, 'impact (s)');
  R(cast, c, 'fadeTime', 0.05, 4, 0.01, 'fade (s)');
  if (CAST === 'zone') R(cast, c, 'zoneRadius', 0.5, 12, 0.05, 'circle (m)');
  Editor.castAnimation(cast, c);

  const shape = folder.addFolder('1 · Shape');
  R(shape, c, 'count', 1, 16, 1, 'columns');
  R(shape, c, 'height', 0.2, 10, 0.05, 'column height (m)');
  R(shape, c, 'thickness', 0.02, 2, 0.01, 'thickness (m)');
  R(shape, c, 'sweep', 0, 8, 0.05, 'topple');
  R(shape, c, 'lean', 0, 3, 0.01, 'lean');

  const motion = folder.addFolder('2 · Motion');
  R(motion, c, 'spinSpeed', -20, 20, 0.1, 'spin (rad/s)');
  R(motion, c, 'lifetime', 0.1, 5, 0.05, 'hold (s)');

  const look = folder.addFolder('3 · Look');
  R(look, c, 'bodyOpacity', 0, 2, 0.01, 'opacity');
  R(look, c, 'bodyGlow', 0, 4, 0.01, 'body glow');
  R(look, c, 'edgeGlow', 0, 10, 0.05, 'edge glow');
  R(look, c, 'softFade', 0.01, 2, 0.01, 'soft fade (m)');
  R(look, c, 'lensWarp', 0, 3, 0.01, 'lens warp');
  look.addColor(c, 'colorA').name('edge');
  look.addColor(c, 'colorB').name('core');
  look.addColor(c, 'colorC').name('deep');

  const floor = folder.addFolder('4 · Ground');
  R(floor, c, 'groundWidth', 0.2, 16, 0.05, 'width (m)');
  R(floor, c, 'groundGlow', 0, 6, 0.05, 'glow');
  R(floor, c, 'groundLife', 0.1, 4, 0.05, 'life');

  const parts = folder.addFolder('5 · Particles');
  R(parts, c, 'dustRate', 0, 400, 1, 'dust / s');
  R(parts, c, 'dustSize', 0.02, 2, 0.01, 'dust size');
  R(parts, c, 'dustSpeed', 0, 20, 0.1, 'dust speed');
  R(parts, c, 'dustLife', 0.05, 3, 0.01, 'dust life');
  R(parts, c, 'dustOpacity', 0, 1, 0.01, 'dust opacity');
  Editor.gradient(parts, c, 'colorDust', 'dust colour');
  R(parts, c, 'streakRate', 0, 400, 1, 'shed / s');
  R(parts, c, 'streakSize', 0.005, 0.4, 0.005, 'shed size');
  R(parts, c, 'streakSpeed', 0, 30, 0.1, 'shed speed');
  R(parts, c, 'streakLife', 0.05, 2, 0.01, 'shed life');
  R(parts, c, 'streakStretch', 0, 4, 0.01, 'shed stretch');
  Editor.gradient(parts, c, 'colorStreak', 'shed colour');
  R(parts, c, 'chipRate', 0, 200, 1, 'chips / s');
  R(parts, c, 'chipSize', 0.01, 0.4, 0.005, 'chip size');
  R(parts, c, 'chipSpeed', 0, 20, 0.1, 'chip speed');
  R(parts, c, 'chipLife', 0.05, 3, 0.01, 'chip life');
  Editor.gradient(parts, c, 'colorChip', 'chip colour');

  const beat = folder.addFolder('6 · The beat');
  R(beat, c, 'impactShake', 0, 2, 0.01, 'camera punch');
  R(beat, c, 'impactFlash', 0, 1, 0.01, 'flash');
  beat.addColor(c, 'colorFlash').name('flash');
  R(beat, c, 'burstRadius', 0, 12, 0.05, 'burst (m)');
  R(beat, c, 'burstLife', 0.05, 3, 0.01, 'burst life');
  beat.addColor(c, 'colorBurstA').name('burst, hot');
  beat.addColor(c, 'colorBurstB').name('burst, body');
  beat.addColor(c, 'colorBurstC').name('burst, deep');
  R(beat, c, 'shockRadius', 0, 16, 0.05, 'decal (m)');
  R(beat, c, 'shockLife', 0.05, 3, 0.01, 'decal life');
  beat.addColor(c, 'colorShockA').name('decal');
  beat.addColor(c, 'colorShockB').name('decal, hot');

  const bodies = folder.addFolder('7 · Bodies');
  R(bodies, c, 'hitRadius', 0.1, 12, 0.05, 'reach (m)');
  R(bodies, c, 'hitImpulse', 0, 24, 0.1, 'impulse');
  R(bodies, c, 'hitLift', 0, 20, 0.1, 'lift');
  R(bodies, c, 'hitSpin', 0, 8, 0.05, 'spin');

  const light = folder.addFolder('Light');
  light.addColor(c, 'lightColor').name('colour');
  R(light, c, 'lightIntensity', 0, 30, 0.1, 'intensity');
  R(light, c, 'lightRadius', 1, 40, 0.1, 'radius');
  R(light, c, 'lightFlicker', 0, 1, 0.01, 'flicker');
  R(light, c, 'impactLight', 0, 40, 0.5, 'light punch');
}
