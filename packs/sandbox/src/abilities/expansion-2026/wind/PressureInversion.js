import { Mesh, Points, Vector3 } from 'three';
import { Ability } from '../../Ability.js';
import {
  createVortexGeometry,
  createWellDiscGeometry,
  createMoteGeometry,
  createLensGeometry
} from './PressureInversionGeometry.js';
import {
  createVortexMaterial,
  createWellFloorMaterial,
  createMoteMaterial,
  createPressureLensMaterial
} from './PressureInversionMaterials.js';
import { ParticleShape } from '../../../particles/ParticleSystem.js';
import { RateEmitter } from '../../../particles/ParticleEngine.js';
import { DecalType } from '../../../effects/GroundDecals.js';
import { BurstMode } from '../../../effects/BurstSphere.js';
import { LAYER } from '../../../core/Layers.js';
import { frame } from '../../../core/FrameUniforms.js';
import { CAST_ANIMATIONS, settings } from '../../../config/settings.js';
import { getColor } from '../../../utils/color.js';
import { saturate, smoothstep, Easing } from '../../../utils/math.js';

export const ID = 'pressure-inversion',
  UID = 'matrix-expansion/pressure-inversion';

export const CONFIG = Object.freeze({
  id: ID,
  meta: {
    label: 'Pressure Inversion',
    accent: '#c7fff1',
    element: 'wind',
    key: '',
    cast: 'zone',
    hint: 'A pressure well pulls bodies inward before reversing into a violent outward gust.',
    glyph:
      '<path d="M12 45Q25 18 49 24Q72 28 75 48M88 53Q70 80 48 76Q25 72 23 53"/><path d="M65 13L76 25L63 31M32 88L21 76L35 70"/>'
  },
  settings: {
    /* --- the cast itself --- */
    range: 18, // maximum cast distance, metres
    minRange: 1, // closer than this and the cast is refused
    speed: 28, // how fast the carrier knot skims to the target, metres/second
    lifetime: 1.1, // seconds the spent air takes to settle after the gust
    cooldown: 6, // seconds before the ability can be armed again
    castAnim: 'cast3', // which clip in `CAST_ANIMATIONS` the body throws

    /* --- light --- */
    lightColor: '#c7fff1',
    lightIntensity: 3,
    lightRadius: 9,

    /* ================================================================ */
    /* 1 · THE WELL                                                      */
    /* ================================================================ */

    radius: 4, // radius of the well, metres
    duration: 3.2, // seconds from touchdown to the end of the gust
    inversionPoint: 0.65, // fraction of `duration` at which the well inverts
    growTime: 0.18, // fraction of the well over which the ribbons draw in from the rim
    squeezeTime: 0.22, // fraction before the inversion over which the well tightens
    squeeze: 1, // how hard it tightens, 0..1 (the anticipation)
    gustBloom: 1, // how far the ribbons are flung outward by the gust
    gustTime: 0.25, // fraction of `duration` the gust front takes to cross the well

    /* --- the vortex ribbons --- */
    wellHeight: 1.75, // height of the spiral at the eye, metres
    innerRadius: 0.18, // eye radius, fraction of `radius`
    ribbonTurns: 3, // turns of the spiral from eye to rim
    ribbonWidth: 0.24, // metres
    ribbonStreaks: 12, // streamlines along a ribbon
    spinRate: 2, // radians/second the spiral turns (reverses with the gust)
    flowSpeed: 1.4, // streamline speed along the ribbon
    ribbonGlow: 1.2,
    colorAirCore: '#b3fff0',
    colorAirEdge: '#0a6660',
    colorGust: '#f2fffb',

    /* --- the well floor --- */
    floorRings: 9, // isobars across the well
    ringSpeed: 0.6, // how fast they crawl toward the eye
    floorArms: 4, // spiral arms
    floorTwist: 3, // how tightly the arms curl
    floorGlow: 1,
    floorOpacity: 0.7,
    colorFloor: '#52d9c6',
    colorFloorEye: '#e0fff9',

    /* --- motes drawn up the spiral (128 GPU points) --- */
    moteSize: 1,
    moteRise: 1.8, // metres the motes climb
    moteSpeed: 0.22, // cycles/second rim ↔ eye
    moteGlow: 1.2,
    colorMote: '#8cffd9',

    /* --- the carrier knot skimming to the target --- */
    carrierRadius: 0.45, // metres
    carrierHeight: 0.9, // metres
    carrierGlow: 1.4,
    carrierDust: 30, // dust puffs/second kicked up behind it

    /* --- the lens (screen distortion) --- */
    lensStrength: 0.45, // the air bending round the eye
    lensSwirl: 1, // how much of that bend is tangential
    lensGust: 1, // the gust's pressure ring
    lensHeight: 2.2, // metres the distortion stands

    /* ================================================================ */
    /* 2 · PARTICLES                                                     */
    /* ================================================================ */

    /* --- motes wound in toward the eye (pooled SOFT, swirling) --- */
    inflowRate: 60,
    inflowSize: 0.06,
    inflowLife: 1.4,
    inflowSwirl: 2.4, // radians/second round the eye
    inflowContract: 0.85, // how far they are drawn in over their life, 0..1
    inflowGlow: 1.8,
    colorInflowA: '#ffffff',
    colorInflowB: '#c7fff1',
    colorInflowC: '#3fcab6',
    colorInflowD: '#0b3b37',

    /* --- ground dust dragged round the well (pooled SMOKE, swirling) --- */
    dustRate: 26,
    dustSize: 0.9,
    dustLife: 1.8,
    dustOpacity: 0.45,
    colorDustA: '#c9d6cf',
    colorDustB: '#9aaaa2',
    colorDustC: '#6a7872',
    colorDustD: '#333c39',

    /* --- the gust: dust thrown out and streaks (pooled SMOKE + STREAK) --- */
    gustDust: 36, // dust puffs thrown out at the inversion
    gustDustSpeed: 6,
    gustStreaks: 60, // streaks fired outward at the inversion
    rimStreakRate: 24, // streaks/second whipping round the rim while the well pulls
    streakSpeed: 11,
    streakSize: 0.05,
    streakLife: 0.5,
    streakStretch: 0.4,
    streakGlow: 2.2,
    colorStreakA: '#ffffff',
    colorStreakB: '#dafff6',
    colorStreakC: '#69e3cf',
    colorStreakD: '#14504a',

    /* ================================================================ */
    /* 3 · THE BEATS                                                     */
    /* ================================================================ */

    landLight: 1.2, // light punch at touchdown, × lightIntensity
    wellRumble: 0.05, // continuous low camera rumble while the well pulls
    squeezeLight: 1.5, // light climbing as the well tightens, × lightIntensity
    gustShake: 0.12, // camera knock at the inversion
    gustFlash: 0.05, // screen flash at the inversion
    gustLight: 3, // light punch at the inversion, × lightIntensity
    gustBurst: 4.5, // AIR pressure shell, metres
    gustBurstIntensity: 0.9,
    shockRadius: 6, // SHOCKWAVE decal, metres
    dustRingRadius: 5, // DUSTRING decal, metres
    colorFlash: '#e6fff9',
    colorBurstA: '#ffffff',
    colorBurstB: '#b8fff0',
    colorBurstC: '#2c8f84',

    /* ================================================================ */
    /* 4 · BODIES                                                        */
    /* ================================================================ */

    wellForce: 8, // inward wind speed while the well pulls, metres/second
    gustForce: 12, // outward throw at the inversion, metres/second
    lift: 2, // upward current, metres/second
    maxHeld: 12, // bodies the well can hold at once
    catchImpulse: 1, // how hard a standing body is knocked off its feet
    catchLift: 1,
    catchSpin: 0.4,
    carryGrab: 4, // how quickly a held body takes the wind's velocity, 1/s
    carryGrabY: 3, // the same, vertically
    carryBuoyancy: 0.3 // how much of a held body's weight the wind carries
  }
});

const TAU = Math.PI * 2;
/** The well is four ribbons, a quarter turn apart. */
const RIBBONS = 4;

const _emit = {};
const _pos = new Vector3();
const _dir = new Vector3();
const _body = new Vector3();
const _up = new Vector3(0, 1, 0);

/**
 * PRESSURE INVERSION — Wind, zone cast.
 *
 * Two breaths: in, then out. A small knot of wind skims the floor from the
 * caster to the circle. Where it lands the air **draws in** — four ribbons
 * of wind grow inward from the rim into a rising spiral, isobars crawl toward
 * the eye, dust and motes are dragged round and in, and every body in the
 * circle is knocked off its feet and carried toward the centre. In the last
 * moments the well **tightens** — the spiral squeezes toward the eye, the eye
 * brightens, the light climbs — and then it **inverts**: the same air thrown
 * outward in one gust. The ribbons bloom out, a pressure front races across
 * the floor, everything held is shoved clear, and the spent air settles.
 *
 * ## Layers (each a folder in the editor)
 *
 *   1. **the carrier** — the vortex material at a tenth of the size, skimming
 *      the line and kicking dust, then sinking into the eye (height and fade
 *      together) while the ribbons grow in from the rim.
 *   2. **the vortex ribbons** (`createVortexMaterial`) — parameter-space
 *      spirals: grown, squeezed and bloomed entirely in the vertex stage.
 *   3. **the well floor** (`createWellFloorMaterial`) — isobars, spiral arms,
 *      dragged dust, the eye and the gust front.
 *   4. **motes** — 128 GPU points drawn up the spiral (out, after the gust).
 *   5. **particles** — swirling inflow motes and ground dust (pooled, on a
 *      contracting swirl anchor); at the gust, dust and streaks thrown out
 *      radially; streaks whipping round the rim while it pulls.
 *   6. **the lens** (`createPressureLensMaterial`, `LAYER.DISTORTION`) — the
 *      air turning round the eye, then the gust's pressure ring.
 *   7. **the beats** — touchdown dust ring and light; a rumble while the well
 *      pulls; at the inversion an AIR shell, SHOCKWAVE + DUSTRING decals, a
 *      flash, the one camera knock, and a light punch.
 *
 * ## Bodies (`handlesOwnHits`)
 *
 * Unchanged from the candidate: while the well stands, standing bodies in the
 * circle are knocked down (gently) and held, and every held body is handed to
 * `Dummy#carry` with an inward field; at `inversionPoint` each is shoved
 * outward once and the field reverses; gravity is restored the moment the
 * gust ends (not after the visual fade); a pooled body that was reset and
 * reclaimed by another cast is never carried or released by this one.
 *
 * ## The editor rule
 *
 * A cast stores a seed and three integrated phases (spin, streamline flow,
 * isobar drift) — integrated so the reversal turns the air round instead of
 * snapping it. Every dimension, time and colour is read from
 * `settings['pressure-inversion']` every frame.
 */
export class PressureInversionAbility extends Ability {
  constructor(ctx) {
    super(ID, ctx);
  }

  /** It holds bodies across the whole well, so it must pick them itself. */
  get handlesOwnHits() {
    return true;
  }

  /** Bodies in the wind. HUD readout only. */
  get instanceCount() {
    return this.held.size;
  }

  get impactDuration() {
    return Math.max(0.2, this.config.duration) * settings.global.lifetime;
  }

  get fadeDuration() {
    return Math.max(0.2, this.config.lifetime) * settings.global.lifetime;
  }

  /** Moving air: a quick, uneven flutter. */
  lightShimmer() {
    return 0.86 + 0.14 * Math.sin(this.age * 13.0) * Math.sin(this.age * 4.3 + 1.1);
  }

  /* ------------------------------------------------------------------ */
  /* Construction                                                        */
  /* ------------------------------------------------------------------ */

  createShaders() {
    /* ---- layer 2: the ribbons share one parameter strip and material ---- */
    this.geo = createVortexGeometry(160, 4);
    this.mat = createVortexMaterial();
    this.ribbons = [];
    for (let i = 0; i < RIBBONS; i++) {
      const ribbon = this._mesh(this.geo, this.mat, LAYER.VFX, 11);
      // A quarter turn apart; the spiral itself turns in the shader.
      ribbon.rotation.y = (i * TAU) / RIBBONS;
      this.ribbons.push(ribbon);
    }

    /* ---- layer 3: the well floor ---- */
    this.floorGeometry = createWellDiscGeometry();
    this.floorMaterial = createWellFloorMaterial();
    this.floor = this._mesh(this.floorGeometry, this.floorMaterial, LAYER.VFX, 2);
    this.floor.rotation.x = -Math.PI / 2;

    /* ---- layer 1: the carrier knot ---- */
    this.carrierGeometry = createVortexGeometry(48, 2);
    this.carrierMaterial = createVortexMaterial();
    this.carrier = this._mesh(this.carrierGeometry, this.carrierMaterial, LAYER.VFX, 11);
    // At touchdown the travelling knot hands over to this one, pinned to the
    // eye, which sinks into the floor while the ribbons grow in from the rim.
    // It shares the carrier's geometry and material (the two never show at
    // once), so it costs a draw call and nothing else.
    this.sinkKnot = this._mesh(this.carrierGeometry, this.carrierMaterial, LAYER.VFX, 11);

    /* ---- layer 6: the lens ---- */
    this.lensGeometry = createLensGeometry();
    this.lensMaterial = createPressureLensMaterial();
    this.lens = this._mesh(this.lensGeometry, this.lensMaterial, LAYER.DISTORTION, 0);

    /** Scratch handed to the materials each frame — one object apiece. */
    this._vortexState = {
      time: 0, fade: 1, polarity: 1, radius: 4, inner: 0.18, height: 1.75, turns: 3,
      phase: 0, flow: 0, width: 0.24, squeeze: 0, bloom: 0, grow: 1, glow: 1, seed: 0
    };
    this._carrierState = {
      time: 0, fade: 1, polarity: 1, radius: 0.45, inner: 0.25, height: 0.9, turns: 2,
      phase: 0, flow: 0, width: 0.12, squeeze: 0, bloom: 0, grow: 1, glow: 1, seed: 0
    };
    this._floorState = { time: 0, fade: 1, polarity: 1, phase: 0, drift: 0, gust: 0, squeeze: 0, seed: 0 };
    this._moteState = { time: 0, fade: 1, polarity: 1, radius: 4, spin: 0 };
    this._lensState = { time: 0, polarity: 1, radius: 4, strength: 0, gust: 0, phase: 0 };

    this.centre = new Vector3();
    this.found = [];
    this.held = new Set();
    this.heldGeneration = new WeakMap();
    this.reversed = false;
    this._seed = 0;
    this._phase = 0;
    this._flow = 0;
    this._drift = 0;
    this._squeeze = 0;
    this._bloom = 0;
    this._gust = 0;
    this._catch = { impulse: 1, lift: 1, spin: 0.4 };
    // The velocity field handed to `Dummy#carry`: inward while the well pulls,
    // outward after the inversion, always with an upward current.
    this._field = (x, y, z, out) => {
      const dx = this.centre.x - x,
        dz = this.centre.z - z,
        r = Math.hypot(dx, dz) || 1,
        sign = this.reversed ? -1 : 1,
        force = this.reversed ? this.config.gustForce : this.config.wellForce;
      out.set((dx / r) * force * sign, this.config.lift, (dz / r) * force * sign);
    };
  }

  _mesh(geometry, material, layer, order) {
    const mesh = new Mesh(geometry, material);
    mesh.layers.set(layer);
    mesh.renderOrder = order;
    // Parameter-space vertices: the bounding volume means nothing.
    mesh.frustumCulled = false;
    mesh.visible = false;
    this.group.add(mesh);
    return mesh;
  }

  createParticles() {
    /* ---- layer 4: GPU motes, owned by this instance ---- */
    this.dustGeometry = createMoteGeometry();
    this.dustMaterial = createMoteMaterial();
    this.dust = new Points(this.dustGeometry, this.dustMaterial);
    this.dust.layers.set(LAYER.VFX);
    this.dust.frustumCulled = false;
    this.dust.visible = false;
    this.group.add(this.dust);

    /* ---- layer 5: pooled systems (optional in a bare test context) ---- */
    const particles = this.ctx.particles;
    this.inflow = particles?.get?.(`${ID}.inflow`, {
      capacity: 1000,
      shape: ParticleShape.SOFT,
      additive: true,
      swirl: true,
      softFade: 0.3
    }) ?? null;
    if (this.inflow) {
      const u = this.inflow.uniforms;
      u.uSizeIn.value = 0.1;
      u.uFadeIn.value = 0.15;
      u.uFadeOut.value = 0.5;
      u.uEndSize.value = 0.4;
      u.uDrag.value = 2;
    }
    this.swirlDust = particles?.get?.(`${ID}.dust`, {
      capacity: 600,
      shape: ParticleShape.SMOKE,
      additive: false,
      swirl: true,
      softFade: 0.9
    }) ?? null;
    if (this.swirlDust) {
      const u = this.swirlDust.uniforms;
      u.uSizeIn.value = 0.15;
      u.uFadeIn.value = 0.15;
      u.uFadeOut.value = 0.55;
      u.uEndSize.value = 1.8;
      u.uDrag.value = 2;
    }
    this.gustDust = particles?.get?.(`${ID}.gust`, {
      capacity: 600,
      shape: ParticleShape.SMOKE,
      additive: false,
      curl: true,
      softFade: 0.9
    }) ?? null;
    if (this.gustDust) {
      const u = this.gustDust.uniforms;
      u.uSizeIn.value = 0.1;
      u.uFadeIn.value = 0.05;
      u.uFadeOut.value = 0.6;
      u.uEndSize.value = 2.4;
      u.uDrag.value = 1.6;
      u.uTurbFrequency.value = 0.5;
      u.uTurbSpeed.value = 0.5;
    }
    this.streaks = particles?.get?.(`${ID}.streaks`, {
      capacity: 900,
      shape: ParticleShape.STREAK,
      additive: true,
      stretch: true,
      softFade: 0.15
    }) ?? null;
    if (this.streaks) {
      const u = this.streaks.uniforms;
      u.uSizeIn.value = 0.02;
      u.uFadeIn.value = 0.02;
      u.uFadeOut.value = 0.5;
      u.uEndSize.value = 0.4;
      u.uDrag.value = 1.8;
    }
    this.inflowEmitter = new RateEmitter();
    this.dustEmitter = new RateEmitter();
    this.rimEmitter = new RateEmitter();
    this.carrierEmitter = new RateEmitter();
  }

  /* ------------------------------------------------------------------ */
  /* Casting                                                             */
  /* ------------------------------------------------------------------ */

  onSpawn() {
    this.held.clear();
    this.reversed = false;
    this._seed = Math.random() * 100;
    this._phase = 0;
    this._flow = 0;
    this._drift = 0;
    this._squeeze = 0;
    this._bloom = 0;
    this._gust = 0;
    this.inflowEmitter.reset();
    this.dustEmitter.reset();
    this.rimEmitter.reset();
    this.carrierEmitter.reset();

    this.centre.copy(this.origin).addScaledVector(this.direction, this.length);
    this.floor.position.copy(this.centre);
    this.floor.position.y = 0.035;
    this.floor.scale.setScalar(this.config.radius);
    this.dust.position.copy(this.centre);
    this.lens.position.copy(this.centre);
    this.dustMaterial.uniforms.uRadius.value = this.config.radius;
    this.floorMaterial.uniforms.uFade.value = 1;
    this.dustMaterial.uniforms.uFade.value = 1;
    this.mat.uniforms.uFade.value = 1;

    this.carrier.visible = true;
    this.sinkKnot.visible = false;
    this.floor.visible = false;
    this.dust.visible = false;
    this.lens.visible = false;
    for (const ribbon of this.ribbons) ribbon.visible = false;
    this._draw(0);
    this._drawCarrier();
  }

  /**
   * The carrier knot. While travelling (`sink` omitted) it rides the front.
   * After touchdown `sink` (1 → 0) poses the sink knot instead: pinned to the
   * centre, height and fade shrinking together, so the knot sinks into the
   * floor as the ribbons grow in rather than vanishing in one frame.
   */
  _drawCarrier(sink = -1) {
    const c = this.config;
    const g = settings.global;
    const sinking = sink >= 0;
    if (sinking) this.sinkKnot.position.copy(this.centre);
    else this.pointAt(this.u, this.carrier.position);
    (sinking ? this.sinkKnot : this.carrier).position.y = 0.02;
    const cs = this._carrierState;
    cs.time = this.age;
    cs.fade = sinking ? sink : saturate(this.age / 0.08);
    cs.polarity = 1;
    // It breathes as it runs: the knot pulses in and out.
    cs.radius = c.carrierRadius * (1 + 0.15 * Math.sin(this.age * 10));
    cs.inner = 0.25;
    cs.height = c.carrierHeight * (sinking ? Math.max(0.001, sink) : 1);
    cs.turns = 2;
    cs.phase = this.age * c.spinRate * 4 * g.animationSpeed;
    cs.flow = this.age * c.flowSpeed * 2;
    cs.width = c.ribbonWidth * 0.5;
    cs.squeeze = 0;
    cs.bloom = 0;
    cs.grow = 1;
    cs.glow = c.carrierGlow;
    cs.seed = this._seed;
    this.carrierMaterial.userData.sync(cs);
  }

  /**
   * Pose the well for phase time `t` (0..1 through the well, 1..2 the
   * settling fade). Everything is resolved from settings here.
   */
  _draw(t) {
    const c = this.config;
    const polarity = this.reversed ? -1 : 1;
    const fade = t > 1 ? saturate(2 - t) : 1;

    // Grows in from the rim over the first part of the well.
    const grow = Easing.outCubic(saturate(t / Math.max(0.01, c.growTime)));
    for (const ribbon of this.ribbons) ribbon.position.copy(this.centre);

    const vs = this._vortexState;
    vs.time = this.age;
    vs.fade = fade;
    vs.polarity = polarity;
    vs.radius = c.radius;
    vs.inner = c.innerRadius;
    vs.height = c.wellHeight;
    vs.turns = c.ribbonTurns;
    vs.phase = this._phase;
    vs.flow = this._flow;
    vs.width = c.ribbonWidth;
    vs.squeeze = this._squeeze;
    vs.bloom = this._bloom;
    vs.grow = this.reversed ? 1 : grow;
    vs.glow = c.ribbonGlow * (1 + this._squeeze * 0.8);
    vs.seed = this._seed;
    this.mat.userData.sync(vs);

    this.floor.position.copy(this.centre);
    this.floor.position.y = 0.035;
    this.floor.scale.setScalar(c.radius);
    const fs = this._floorState;
    fs.time = this.age;
    fs.fade = fade * Math.max(grow, this.reversed ? 1 : 0);
    fs.polarity = polarity;
    fs.phase = this._phase;
    fs.drift = this._drift;
    fs.gust = this._gust;
    fs.squeeze = this._squeeze;
    fs.seed = this._seed;
    this.floorMaterial.userData.sync(fs);

    this.dust.position.copy(this.centre);
    const ms = this._moteState;
    ms.time = this.age;
    ms.fade = fade;
    ms.polarity = polarity;
    ms.radius = c.radius;
    ms.spin = this._phase;
    this.dustMaterial.userData.sync(ms);

    this.lens.position.copy(this.centre);
    const ls = this._lensState;
    ls.time = this.age;
    ls.polarity = polarity;
    ls.radius = c.radius;
    // In the settle the lens eases to zero by t = 1.5, where it is hidden.
    ls.strength = fade * grow * (this.reversed ? 0.4 * saturate((1.5 - t) * 2) : 1 + this._squeeze);
    ls.gust = this._gust;
    ls.phase = this._phase;
    this.lensMaterial.userData.sync(ls);
  }

  /** Integrate the three phases so the reversal turns, rather than snaps. */
  _advancePhases(dt) {
    const c = this.config;
    const g = settings.global;
    const polarity = this.reversed ? -1 : 1;
    // The air speeds up as it is squeezed and again as it is thrown out.
    const urgency = 1 + this._squeeze * 1.5 + this._bloom * 2;
    this._phase += dt * c.spinRate * polarity * urgency * g.animationSpeed;
    this._flow += dt * c.flowSpeed * polarity * urgency * g.noiseSpeed;
    this._drift += dt * c.ringSpeed * polarity * urgency;
  }

  /* ------------------------------------------------------------------ */
  /* Bodies                                                              */
  /* ------------------------------------------------------------------ */

  /** Whether `d` is still the body this cast caught (not reset and reclaimed). */
  _sameLife(d) {
    const captured = this.heldGeneration.get(d);
    return captured === null || captured === undefined || this.ctx.dummies?.standGeneration?.(d) === captured;
  }

  _pruneHeld() {
    for (const d of this.held) {
      const sameLife = this._sameLife(d);
      if (!sameLife || d.state === 'gone' || d.alive === true) {
        if (sameLife) d.release?.();
        this.held.delete(d);
        this.heldGeneration.delete(d);
      }
    }
  }

  _apply(dt) {
    if (!this.ctx.dummies?.findTargets) return;
    const c = this.config;
    this._pruneHeld();
    const found = this.ctx.dummies.findTargets(this.centre.x, this.centre.z, c.radius, this.found);
    const cap = Math.max(1, Math.round(c.maxHeld));
    this._catch.impulse = c.catchImpulse;
    this._catch.lift = c.catchLift;
    this._catch.spin = c.catchSpin;
    for (const d of found) {
      if (this.held.size >= cap && !this.held.has(d)) break;
      if (!this.held.has(d)) {
        const dx = this.centre.x - d.position.x,
          dz = this.centre.z - d.position.z,
          r = Math.hypot(dx, dz) || 1;
        if (d.kill?.(dx / r, dz / r, this._catch, false)) {
          this.held.add(d);
          this.heldGeneration.set(d, this.ctx.dummies?.standGeneration?.(d) ?? null);
          this._caughtFx(d);
        }
      }
    }
    for (const d of this.held) {
      d.carry?.(this._field, Math.min(1, dt * c.carryGrab), Math.min(1, dt * c.carryGrabY), c.carryBuoyancy);
    }
  }

  _releaseHeld() {
    for (const d of this.held) {
      if (this._sameLife(d)) d.release?.();
      this.heldGeneration.delete(d);
    }
    this.held.clear();
  }

  /* ------------------------------------------------------------------ */
  /* Phases                                                              */
  /* ------------------------------------------------------------------ */

  onTravel(dt) {
    this._drawCarrier();
    this._syncParticles();
    this._carrierFx(dt);
  }

  /** Touchdown: the knot sinks into the floor and the well draws breath. */
  onImpact() {
    const c = this.config;
    this.position.copy(this.centre);
    // The travelling knot hands over to the sink knot at the eye; onFade
    // sinks it over the ribbons' grow-in.
    this.carrier.visible = false;
    this.sinkKnot.visible = true;
    this._drawCarrier(1);
    this.floor.visible = true;
    this.dust.visible = true;
    this.lens.visible = true;
    for (const ribbon of this.ribbons) ribbon.visible = true;
    this._draw(0);
    // No camera knock and no flash here: the one hard beat is the inversion.
    this.lightBoost = c.lightIntensity * c.landLight;
    this.ctx.decals?.spawn?.(DecalType.DUSTRING, this.centre, {
      radius: c.radius * 0.8,
      life: 1.2,
      intensity: 0.7,
      colorA: getColor(c.colorDustA),
      colorB: getColor(c.colorDustC)
    });
    this._syncParticles();
    this._radialDust(Math.round(c.gustDust * 0.4 * settings.global.particleCount), -0.6);
  }

  onFade(dt, t) {
    const c = this.config;
    const g = settings.global;
    if (t <= 1) {
      // The knot sinks into the eye while the ribbons grow in from the rim.
      if (this.sinkKnot.visible) {
        const sink = 1 - saturate(t / Math.max(0.01, c.growTime));
        this._drawCarrier(sink);
        this.sinkKnot.visible = sink > 0;
      }
      const inversion = saturate(c.inversionPoint);
      const inverted = t >= inversion;
      if (inverted && !this.reversed) this._invert();

      if (!this.reversed) {
        // The anticipation: the well tightens over the last stretch.
        const window = Math.max(0.01, c.squeezeTime);
        this._squeeze = smoothstep(inversion - window, inversion, t) * saturate(c.squeeze);
        this.lightBoost = Math.max(this.lightBoost, c.lightIntensity * c.squeezeLight * this._squeeze);
        this.ctx.shake?.rumble?.(c.wellRumble * g.cameraShake * (0.4 + this._squeeze), dt);
      } else {
        // The gust front races out and the ribbons bloom with it.
        const since = (t - inversion) / Math.max(0.01, c.gustTime);
        this._gust = Easing.outCubic(saturate(since));
        this._bloom = Easing.outCubic(saturate(since)) * c.gustBloom;
        this._squeeze = Math.max(0, this._squeeze - dt * 6);
      }
      this._advancePhases(dt);
      this._apply(dt);
      this._draw(t);
      this._syncParticles();
      if (!this.reversed) this._wellFx(dt, t);
    } else {
      // The gust has ended. Return gravity immediately instead of leaving
      // bodies buoyant for the separate visual fade-out.
      this._releaseHeld();
      this._gust = Math.min(1, this._gust + dt * 2);
      this._advancePhases(dt * (2 - t));
      // `_draw` fades every layer by (2 − t); the lens goes first, its
      // strength already eased to zero by t = 1.5 so the hide is invisible.
      this._draw(t);
      this.lens.visible = t < 1.5;
      this.sinkKnot.visible = false;
    }
  }

  /** The inversion: the field reverses and every held body is thrown clear. */
  _invert() {
    const c = this.config;
    const g = settings.global;
    const power = g.explosionIntensity;
    this.reversed = true;
    // Always issued, so the host's own envelope sees a zero when shake is off.
    this.ctx.shake?.add?.(c.gustShake * g.cameraShake, 5, 18);
    this.ctx.flash?.trigger?.(getColor(c.colorFlash), c.gustFlash * power);
    this.lightBoost = c.lightIntensity * c.gustLight * power;
    this._pruneHeld();
    for (const d of this.held) {
      const p = d.bodyPoint?.(_body) ?? d.position,
        dx = p.x - this.centre.x,
        dz = p.z - this.centre.z,
        r = Math.hypot(dx, dz) || 1;
      d.shove?.((dx / r) * c.gustForce, c.lift, (dz / r) * c.gustForce);
    }

    _pos.copy(this.centre).setY(0.6);
    this.ctx.bursts?.spawn?.(BurstMode.AIR, _pos, {
      radius: 0.3,
      endRadius: c.gustBurst * power,
      life: 0.55,
      intensity: c.gustBurstIntensity,
      opacity: 0.55,
      fresnel: 2,
      displace: 0.25,
      turbulence: 0.9,
      squash: 0.4,
      colorA: getColor(c.colorBurstA),
      colorB: getColor(c.colorBurstB),
      colorC: getColor(c.colorBurstC)
    });
    this.ctx.decals?.spawn?.(DecalType.SHOCKWAVE, this.centre, {
      radius: c.shockRadius * power,
      life: 0.6,
      width: 0.07,
      intensity: 1,
      colorA: getColor(c.colorStreakC),
      colorB: getColor(c.colorStreakA)
    });
    this.ctx.decals?.spawn?.(DecalType.DUSTRING, this.centre, {
      radius: c.dustRingRadius * power,
      life: 1.4,
      intensity: 0.9,
      colorA: getColor(c.colorDustA),
      colorB: getColor(c.colorDustC)
    });
    this._syncParticles();
    this._radialDust(Math.round(c.gustDust * g.particleCount), 1);
    this._radialStreaks(Math.round(c.gustStreaks * g.particleCount));
  }

  /* ------------------------------------------------------------------ */
  /* Particles                                                           */
  /* ------------------------------------------------------------------ */

  _resetEmit(time) {
    _emit.radius = 0;
    _emit.direction = _up;
    _emit.speed = 0;
    _emit.speedVariance = 0.35;
    _emit.spread = 0.5;
    _emit.inherit = null;
    _emit.anchor = null;
    _emit.size = 0.1;
    _emit.sizeVariance = 0.4;
    _emit.life = 1;
    _emit.lifeVariance = 0.35;
    _emit.spin = 0;
    _emit.tint = null;
    _emit.time = time;
  }

  /** A point on the well's rim (or `fraction` of the way out), at height `y`. */
  _rimPoint(angle, fraction, y, out) {
    const r = this.config.radius * fraction;
    return out.set(this.centre.x + Math.cos(angle) * r, y, this.centre.z + Math.sin(angle) * r);
  }

  /** While the well pulls: motes and dust wound in, streaks round the rim. */
  _wellFx(dt, t) {
    const c = this.config;
    const g = settings.global;
    const pull = Easing.outCubic(saturate(t / Math.max(0.01, c.growTime))) * (1 + this._squeeze);
    if (this.inflow) {
      const n = Math.round(this.inflowEmitter.tick(dt, c.inflowRate * pull) * g.particleCount);
      if (n > 0) {
        this._resetEmit(frame.uTime.value);
        // The anchor is the eye; offsets from it rotate and contract.
        _emit.anchor = this.centre;
        _emit.speed = 0.6;
        _emit.direction = _up;
        _emit.spread = 0.2;
        _emit.size = c.inflowSize;
        _emit.life = c.inflowLife;
        for (let k = 0; k < n; k++) {
          this._rimPoint(Math.random() * TAU, 0.6 + 0.4 * Math.random(), 0.2 + Math.random() * 0.8, _pos);
          _emit.position = _pos;
          this.inflow.emit(1, _emit);
        }
      }
    }
    if (this.swirlDust) {
      const n = Math.round(this.dustEmitter.tick(dt, c.dustRate * pull) * g.particleCount);
      if (n > 0) {
        this._resetEmit(frame.uTime.value);
        _emit.anchor = this.centre;
        _emit.speed = 0.15;
        _emit.spread = 0.4;
        _emit.size = c.dustSize;
        _emit.life = c.dustLife;
        _emit.spin = 0.6;
        for (let k = 0; k < n; k++) {
          this._rimPoint(Math.random() * TAU, 0.75 + 0.25 * Math.random(), 0.12, _pos);
          _emit.position = _pos;
          this.swirlDust.emit(1, _emit);
        }
      }
    }
    if (this.streaks) {
      const n = Math.round(this.rimEmitter.tick(dt, c.rimStreakRate * pull) * g.particleCount);
      if (n > 0) {
        this._resetEmit(frame.uTime.value);
        _emit.speed = c.streakSpeed * 0.6;
        _emit.spread = 0.15;
        _emit.size = c.streakSize;
        _emit.life = c.streakLife;
        for (let k = 0; k < n; k++) {
          const a = Math.random() * TAU;
          this._rimPoint(a, 0.9, 0.3 + Math.random() * 0.6, _pos);
          // Tangential, turned a little inward: the way the well is pulling.
          _dir.set(-Math.sin(a), 0.05, Math.cos(a)).addScaledVector(_body.set(-Math.cos(a), 0, -Math.sin(a)), 0.35).normalize();
          _emit.position = _pos;
          _emit.direction = _dir;
          this.streaks.emit(1, _emit);
        }
      }
    }
  }

  /** Dust thrown radially: `sign` 1 outward (the gust), −1 drawn in (touchdown). */
  _radialDust(count, sign) {
    if (!this.gustDust || count <= 0) return;
    const c = this.config;
    this._resetEmit(frame.uTime.value);
    _emit.speed = c.gustDustSpeed * Math.abs(sign);
    _emit.speedVariance = 0.4;
    _emit.spread = 0.25;
    _emit.size = c.dustSize;
    _emit.life = c.dustLife * 0.8;
    _emit.spin = 0.8;
    for (let k = 0; k < count; k++) {
      const a = (k / count) * TAU + Math.random() * 0.3;
      this._rimPoint(a, sign > 0 ? 0.25 : 1, 0.15, _pos);
      _dir.set(Math.cos(a) * sign, 0.15, Math.sin(a) * sign).normalize();
      _emit.position = _pos;
      _emit.direction = _dir;
      this.gustDust.emit(1, _emit);
    }
  }

  /** Streaks fired straight out from the eye with the gust. */
  _radialStreaks(count) {
    if (!this.streaks || count <= 0) return;
    const c = this.config;
    this._resetEmit(frame.uTime.value);
    _emit.speed = c.streakSpeed;
    _emit.speedVariance = 0.4;
    _emit.spread = 0.12;
    _emit.size = c.streakSize;
    _emit.life = c.streakLife;
    for (let k = 0; k < count; k++) {
      const a = (k / count) * TAU + Math.random() * 0.2;
      this._rimPoint(a, 0.2, 0.3 + Math.random() * 1.2, _pos);
      _dir.set(Math.cos(a), 0.08, Math.sin(a)).normalize();
      _emit.position = _pos;
      _emit.direction = _dir;
      this.streaks.emit(1, _emit);
    }
  }

  /** Dust kicked up behind the travelling knot. */
  _carrierFx(dt) {
    if (!this.gustDust) return;
    const c = this.config;
    const n = Math.round(this.carrierEmitter.tick(dt, c.carrierDust) * settings.global.particleCount);
    if (n <= 0) return;
    this._resetEmit(frame.uTime.value);
    _pos.copy(this.carrier.position).setY(0.1);
    _emit.position = _pos;
    _emit.radius = c.carrierRadius * 0.6;
    _emit.speed = 0.8;
    _emit.spread = 1;
    _emit.size = c.dustSize * 0.5;
    _emit.life = c.dustLife * 0.5;
    this.gustDust.emit(n, _emit);
  }

  /** A body was caught: a flick of streaks off it. */
  _caughtFx(d) {
    if (!this.streaks) return;
    const c = this.config;
    this._syncParticles();
    this._resetEmit(frame.uTime.value);
    _pos.copy(d.position).setY(0.8);
    _dir.copy(this.centre).sub(d.position).setY(0.3).normalize();
    _emit.position = _pos;
    _emit.radius = 0.3;
    _emit.direction = _dir;
    _emit.speed = c.streakSpeed * 0.5;
    _emit.spread = 0.5;
    _emit.size = c.streakSize;
    _emit.life = c.streakLife;
    this.streaks.emit(Math.round(10 * settings.global.particleCount), _emit);
  }

  /** Pooled systems are shared by name; refresh them from settings every frame. */
  _syncParticles() {
    const c = this.config;
    const g = settings.global;
    if (this.inflow) {
      this.inflow.setGradient(getColor(c.colorInflowA), getColor(c.colorInflowB), getColor(c.colorInflowC), getColor(c.colorInflowD));
      const u = this.inflow.uniforms;
      u.uGravity.value.set(0, 0.6, 0);
      u.uSwirl.value = c.inflowSwirl;
      // Negative expansion: the orbit closes on the eye over a mote's life.
      u.uSwirlExpand.value = -saturate(c.inflowContract);
      u.uSizeScale.value = g.particleSize;
      u.uLifeScale.value = g.particleLifetime;
      u.uSpeedScale.value = g.particleSpeed;
      u.uOpacity.value = g.opacity;
      u.uGlow.value = c.inflowGlow * g.glow;
      u.uTurbulence.value = 0.2 * g.turbulence;
    }
    if (this.swirlDust) {
      this.swirlDust.setGradient(getColor(c.colorDustA), getColor(c.colorDustB), getColor(c.colorDustC), getColor(c.colorDustD));
      const u = this.swirlDust.uniforms;
      u.uGravity.value.set(0, 0.3, 0);
      u.uSwirl.value = c.inflowSwirl * 0.7;
      u.uSwirlExpand.value = -saturate(c.inflowContract) * 0.7;
      u.uSizeScale.value = g.particleSize;
      u.uLifeScale.value = g.particleLifetime;
      u.uSpeedScale.value = g.particleSpeed;
      u.uOpacity.value = c.dustOpacity * g.opacity;
      u.uTurbulence.value = 0.3 * g.turbulence;
    }
    if (this.gustDust) {
      this.gustDust.setGradient(getColor(c.colorDustA), getColor(c.colorDustB), getColor(c.colorDustC), getColor(c.colorDustD));
      const u = this.gustDust.uniforms;
      u.uGravity.value.set(0, 0.4, 0);
      u.uSizeScale.value = g.particleSize;
      u.uLifeScale.value = g.particleLifetime;
      u.uSpeedScale.value = g.particleSpeed;
      u.uOpacity.value = c.dustOpacity * g.opacity;
      u.uTurbulence.value = 0.6 * g.turbulence;
    }
    if (this.streaks) {
      this.streaks.setGradient(getColor(c.colorStreakA), getColor(c.colorStreakB), getColor(c.colorStreakC), getColor(c.colorStreakD));
      const u = this.streaks.uniforms;
      u.uGravity.value.set(0, 0, 0);
      u.uStretch.value = c.streakStretch;
      u.uSizeScale.value = g.particleSize;
      u.uLifeScale.value = g.particleLifetime;
      u.uSpeedScale.value = g.particleSpeed;
      u.uOpacity.value = g.opacity;
      u.uGlow.value = c.streakGlow * g.glow;
      u.uTurbulence.value = 0.15 * g.turbulence;
    }
  }

  /* ------------------------------------------------------------------ */
  /* Pooling                                                             */
  /* ------------------------------------------------------------------ */

  onDestroy() {
    this._releaseHeld();
    this.carrier.visible = false;
    this.sinkKnot.visible = false;
    this.floor.visible = false;
    this.dust.visible = false;
    this.lens.visible = false;
    for (const ribbon of this.ribbons) ribbon.visible = false;
    this.mat.uniforms.uFade.value = 1;
  }

  dispose() {
    this.onDestroy();
    this.geo.dispose();
    this.mat.dispose();
    this.floorGeometry.dispose();
    this.floorMaterial.dispose();
    this.carrierGeometry.dispose();
    this.carrierMaterial.dispose();
    this.lensGeometry.dispose();
    this.lensMaterial.dispose();
    this.dustGeometry.dispose();
    this.dustMaterial.dispose();
    super.dispose();
  }
}

/* ---------------------------------------------------------------------- */
/* Editor                                                                  */
/* ---------------------------------------------------------------------- */

/** A sub-folder where the GUI supports them; flat otherwise (test GUIs). */
const sub = (parent, title) => (typeof parent.addFolder === 'function' ? parent.addFolder(title) : parent);
const gradient = (folder, c, prefix, title, Editor) => {
  // `Editor.gradient` nests a folder; a flat GUI gets the four stops inline.
  if (typeof Editor.gradient === 'function' && typeof folder.addFolder === 'function') {
    return Editor.gradient(folder, c, prefix, title);
  }
  for (const stop of ['A', 'B', 'C', 'D']) folder.addColor(c, `${prefix}${stop}`);
  return folder;
};
const castAnimation = (folder, c, Editor) =>
  typeof Editor.castAnimation === 'function' ? Editor.castAnimation(folder, c) : folder.add(c, 'castAnim', CAST_ANIMATIONS);
const color = (folder, c, key, label) => {
  const controller = folder.addColor(c, key);
  return controller?.name ? controller.name(label) : controller;
};

export function buildEditor(gui, c, Editor) {
  const folder = gui.addFolder('↻  Pressure Inversion');
  const R = Editor.range;

  const cast = sub(folder, 'The cast');
  R(cast, c, 'range', 2, 48, 0.1, 'max range');
  R(cast, c, 'minRange', 0, 12, 0.1, 'min range');
  R(cast, c, 'speed', 2, 80, 0.5, 'knot skims at (m/s)');
  R(cast, c, 'lifetime', 0.2, 6, 0.05, 'air settles over (s)');
  R(cast, c, 'cooldown', 0, 30, 0.1, 'cooldown');
  castAnimation(cast, c, Editor);

  const light = sub(folder, 'Light');
  color(light, c, 'lightColor', 'colour');
  R(light, c, 'lightIntensity', 0, 30, 0.1, 'intensity');
  R(light, c, 'lightRadius', 1, 40, 0.1, 'radius');

  const well = sub(folder, '1 · The well');
  R(well, c, 'radius', 1, 8, 0.1, 'well radius');
  R(well, c, 'duration', 1, 8, 0.1, 'well duration');
  R(well, c, 'inversionPoint', 0.05, 0.98, 0.01, 'inverts at (fraction)');
  R(well, c, 'growTime', 0.01, 0.6, 0.01, 'draws in over (fraction)');
  R(well, c, 'squeezeTime', 0.01, 0.6, 0.01, 'tightens over (fraction)');
  R(well, c, 'squeeze', 0, 1, 0.01, 'tightens by');
  R(well, c, 'gustBloom', 0, 3, 0.01, 'gust flings ribbons');
  R(well, c, 'gustTime', 0.02, 1, 0.01, 'gust front crosses in (fraction)');

  const ribbons = sub(folder, '1 · Vortex ribbons');
  R(ribbons, c, 'wellHeight', 0.2, 6, 0.05, 'height at the eye (m)');
  R(ribbons, c, 'innerRadius', 0.02, 0.9, 0.01, 'eye radius (fraction)');
  R(ribbons, c, 'ribbonTurns', 0.25, 8, 0.05, 'turns');
  R(ribbons, c, 'ribbonWidth', 0.02, 1.5, 0.01, 'width (m)');
  R(ribbons, c, 'ribbonStreaks', 1, 60, 1, 'streamlines');
  R(ribbons, c, 'spinRate', 0, 12, 0.05, 'spin (rad/s)');
  R(ribbons, c, 'flowSpeed', 0, 8, 0.05, 'flow speed');
  R(ribbons, c, 'ribbonGlow', 0, 8, 0.05, 'glow');
  color(ribbons, c, 'colorAirCore', 'air core');
  color(ribbons, c, 'colorAirEdge', 'air edge');
  color(ribbons, c, 'colorGust', 'gust');

  const floor = sub(folder, '1 · Well floor');
  R(floor, c, 'floorRings', 1, 30, 0.5, 'isobars');
  R(floor, c, 'ringSpeed', 0, 4, 0.01, 'isobar crawl');
  R(floor, c, 'floorArms', 1, 12, 1, 'spiral arms');
  R(floor, c, 'floorTwist', 0, 10, 0.05, 'arm curl');
  R(floor, c, 'floorGlow', 0, 6, 0.05, 'glow');
  R(floor, c, 'floorOpacity', 0, 1, 0.01, 'opacity');
  color(floor, c, 'colorFloor', 'floor');
  color(floor, c, 'colorFloorEye', 'eye');

  const motes = sub(folder, '1 · Motes');
  R(motes, c, 'moteSize', 0, 4, 0.01, 'size');
  R(motes, c, 'moteRise', 0, 6, 0.05, 'climb (m)');
  R(motes, c, 'moteSpeed', 0, 2, 0.01, 'cycles/second');
  R(motes, c, 'moteGlow', 0, 6, 0.05, 'glow');
  color(motes, c, 'colorMote', 'colour');

  const carrier = sub(folder, '1 · Carrier knot');
  R(carrier, c, 'carrierRadius', 0.05, 2, 0.01, 'radius (m)');
  R(carrier, c, 'carrierHeight', 0.1, 3, 0.01, 'height (m)');
  R(carrier, c, 'carrierGlow', 0, 6, 0.05, 'glow');
  R(carrier, c, 'carrierDust', 0, 200, 1, 'dust/second');

  const lens = sub(folder, '1 · Lens');
  R(lens, c, 'lensStrength', 0, 3, 0.01, 'well bend');
  R(lens, c, 'lensSwirl', 0, 3, 0.01, 'swirl');
  R(lens, c, 'lensGust', 0, 3, 0.01, 'gust ring');
  R(lens, c, 'lensHeight', 0.2, 8, 0.05, 'height (m)');

  const fx = sub(folder, '2 · Particles');
  R(fx, c, 'inflowRate', 0, 400, 1, 'inflow/second');
  R(fx, c, 'inflowSize', 0.005, 0.4, 0.005, 'inflow size');
  R(fx, c, 'inflowLife', 0.1, 5, 0.05, 'inflow lifetime');
  R(fx, c, 'inflowSwirl', -10, 10, 0.05, 'inflow swirl');
  R(fx, c, 'inflowContract', 0, 1, 0.01, 'inflow drawn in');
  R(fx, c, 'inflowGlow', 0, 8, 0.05, 'inflow glow');
  gradient(fx, c, 'colorInflow', 'inflow gradient', Editor);
  R(fx, c, 'dustRate', 0, 200, 1, 'dust/second');
  R(fx, c, 'dustSize', 0.05, 4, 0.01, 'dust size');
  R(fx, c, 'dustLife', 0.1, 6, 0.05, 'dust lifetime');
  R(fx, c, 'dustOpacity', 0, 1, 0.01, 'dust opacity');
  gradient(fx, c, 'colorDust', 'dust gradient', Editor);
  R(fx, c, 'gustDust', 0, 200, 1, 'gust dust');
  R(fx, c, 'gustDustSpeed', 0, 20, 0.1, 'gust dust speed');
  R(fx, c, 'gustStreaks', 0, 300, 1, 'gust streaks');
  R(fx, c, 'rimStreakRate', 0, 200, 1, 'rim streaks/second');
  R(fx, c, 'streakSpeed', 0, 40, 0.1, 'streak speed');
  R(fx, c, 'streakSize', 0.005, 0.3, 0.005, 'streak size');
  R(fx, c, 'streakLife', 0.05, 3, 0.01, 'streak lifetime');
  R(fx, c, 'streakStretch', 0, 1, 0.005, 'streak stretch');
  R(fx, c, 'streakGlow', 0, 10, 0.05, 'streak glow');
  gradient(fx, c, 'colorStreak', 'streak gradient', Editor);

  const beats = sub(folder, '3 · The beats');
  R(beats, c, 'landLight', 0, 6, 0.05, 'touchdown light (× intensity)');
  R(beats, c, 'wellRumble', 0, 0.5, 0.005, 'well rumble');
  R(beats, c, 'squeezeLight', 0, 6, 0.05, 'tightening light (× intensity)');
  R(beats, c, 'gustShake', 0, 1, 0.01, 'gust shake');
  R(beats, c, 'gustFlash', 0, 0.5, 0.01, 'gust flash');
  R(beats, c, 'gustLight', 0, 10, 0.05, 'gust light (× intensity)');
  R(beats, c, 'gustBurst', 0, 12, 0.05, 'pressure shell (m)');
  R(beats, c, 'gustBurstIntensity', 0, 4, 0.01, 'shell brightness');
  R(beats, c, 'shockRadius', 0, 16, 0.05, 'shockwave (m)');
  R(beats, c, 'dustRingRadius', 0, 12, 0.05, 'dust ring (m)');
  color(beats, c, 'colorFlash', 'flash');
  color(beats, c, 'colorBurstA', 'shell inner');
  color(beats, c, 'colorBurstB', 'shell mid');
  color(beats, c, 'colorBurstC', 'shell outer');

  const bodies = sub(folder, '4 · Bodies');
  R(bodies, c, 'wellForce', 0, 20, 0.2, 'inward force');
  R(bodies, c, 'gustForce', 0, 25, 0.2, 'release force');
  R(bodies, c, 'lift', 0, 8, 0.1, 'current lift');
  R(bodies, c, 'maxHeld', 1, 24, 1, 'bodies held at once');
  R(bodies, c, 'catchImpulse', 0, 8, 0.05, 'catch knock');
  R(bodies, c, 'catchLift', 0, 8, 0.05, 'catch lift');
  R(bodies, c, 'catchSpin', 0, 4, 0.01, 'catch tumble');
  R(bodies, c, 'carryGrab', 0, 20, 0.1, 'wind grip');
  R(bodies, c, 'carryGrabY', 0, 20, 0.1, 'wind grip (vertical)');
  R(bodies, c, 'carryBuoyancy', 0, 1, 0.01, 'buoyancy');

  folder.close();
  return folder;
}
