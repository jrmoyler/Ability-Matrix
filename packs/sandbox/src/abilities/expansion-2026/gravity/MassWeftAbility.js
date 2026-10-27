import { Group, Mesh, Vector3 } from 'three';
import { Ability, AbilityPhase } from '../../Ability.js';
import { settings, CAST_ANIMATIONS } from '../../../config/settings.js';
import { LAYER } from '../../../core/Layers.js';
import { frame } from '../../../core/FrameUniforms.js';
import { ParticleShape } from '../../../particles/ParticleSystem.js';
import { RateEmitter } from '../../../particles/ParticleEngine.js';
import { getColor } from '../../../utils/color.js';
import { impactForce } from '../AuthoredImpactForce.js';
import { bindExpansionCombat } from '../StandaloneCombat.js';
import { ExpansionAtmosphere, prefersReducedMotion } from '../ExpansionAtmosphere.js';
import { GravityContacts } from './GravityContacts.js';
import {
  gravityRibbonGeometry,
  gravityFilamentGeometry,
  compressionRingGeometry,
  weftRingGeometry,
  shuttleGeometry,
  weftFloorGeometry
} from './MassWeftGeometry.js';
import {
  createWeftFieldMaterial,
  createFilamentMaterial,
  createWeftRingMaterial,
  createShuttleMaterial,
  createCompressionMaterial,
  createGravityLensMaterial,
  createWeftFloorMaterial
} from './MassWeftMaterials.js';

// The corridor geometry is part of this module's public surface (tests and
// tools build it directly), so the builders are re-exported from here.
export { gravityRibbonGeometry, gravityFilamentGeometry, compressionRingGeometry };

export const ID = 'exp-mass-weft';
export const UID = 'matrix-expansion/mass-weft';

const clamp01 = (x) => Math.max(0, Math.min(1, x));

/** Bodies one pulse can strike — the combat binding's own target cap. */
const MAX_TARGETS = 8;
/** Compression waves in flight at once (one per recent pulse) × rings per wave. */
const MAX_WAVES = 3;
const RINGS_PER_WAVE = 3;
/** Heddle rings strung along the corridor. */
const HEDDLES = 6;
/** Grit emissions spaced down the corridor per accepted pulse. */
const GRIT_STATIONS = 4;

const _emit = {};
const _pos = new Vector3();
const _dir = new Vector3();
const _up = new Vector3(0, 1, 0);
// Pulse scratch: the actor query and line-of-sight origin are read and
// dropped by the scope, so they are filled in place. Only the emitted event's
// arrays are fresh (the combat queue keeps those by reference).
const _query = { position: [0, 0, 0], radius: 0, relation: 'enemy' };
const _losFrom = [0, 0, 0];

/** Distance in the floor plane from a point to the segment a→b (all `[x,y,z]`-like scalars). */
function distanceToSegment(px, pz, ax, az, bx, bz) {
  const dx = bx - ax;
  const dz = bz - az;
  const l = dx * dx + dz * dz;
  const t = l ? clamp01(((px - ax) * dx + (pz - az) * dz) / l) : 0;
  return Math.hypot(px - ax - dx * t, pz - az - dz * t);
}

/**
 * MASS WEFT — Gravity, line cast.
 *
 * The cast is a loom. A **shuttle** of collapsed mass flies point-first down
 * the line, and behind it space is woven into a narrow corridor: a ribbon of
 * bent light on the floor, a well of darkened stone under it, two threads
 * twisting round it through a row of bead heddles, and a lens that pulls the
 * screen toward its spine. When the shuttle reaches the aim point the weft
 * locks in and the corridor **pulses**: every `pulsePeriod` it asks the combat
 * binding who is standing inside the capsule and strikes them. When its
 * lifetime runs out the corridor narrows, the threads draw in, and the whole
 * weave implodes into the shuttle.
 *
 * ## Layers (each a folder in the editor)
 *
 *   1. **the weft ribbon** (`createWeftFieldMaterial`) — the folded trough on
 *      the floor; noise-broken filaments roll toward the front, the spine
 *      glows, the edges catch a hard line. It *is* the corridor: it grows
 *      behind the shuttle and never runs past the aim point.
 *   2. **the floor weave** (`createWeftFloorMaterial`) — normal-blended, so it
 *      darkens the floor into a well; warp and weft threads pinch toward the
 *      spine and bow toward the front the deeper they sit. Flares on a pulse.
 *   3. **filaments and heddles** — two counter-wound helical threads
 *      (`gravityFilamentGeometry`) and six bead rings (`weftRingGeometry`)
 *      they appear to pass through; fresnel-lit, beads of light riding them.
 *   4. **the shuttle** (`shuttleGeometry`, `createShuttleMaterial`) — a lathe
 *      of a weaver's shuttle with an event-horizon shader: near-black body,
 *      burning grazing rim. It rolls in flight, throbs while the corridor
 *      stands, and flares as the weave implodes into it.
 *   5. **compression and contact** — on every *accepted* pulse, three faceted
 *      rings run down the corridor (three waves can overlap), and a pooled
 *      rosette, STORM burst and CRACK decal mark each struck body
 *      (`GravityContacts`). A refused pulse draws nothing.
 *   6. **the lens** — the ribbon's own geometry on `LAYER.DISTORTION`,
 *      pulling the screen toward the spine with a travelling shear.
 *   7. **particles** — the shared corridor streaks (`ExpansionAtmosphere`)
 *      sweeping down the line; motes drawn *in* from the edges toward the
 *      spine (`.infall`); grit chips leaping off the floor on a strike
 *      (`.grit`).
 *   8. **the beats** — a knock on the camera as the weft locks in, a smaller
 *      one plus a light punch on every strike (a flash on the first), and a
 *      flash and knock as the corridor implodes. All × the globals.
 *
 * ## Combat
 *
 * The cast binds `ctx.expansionCombat` through `bindExpansionCombat` at
 * spawn. Without a binding it draws nothing and records `failure`. Each pulse
 * queries enemies round the corridor's midpoint, keeps the ones within
 * `zoneRadius` of the segment that the terrain does not hide, and emits one
 * `hit` event carrying a capsule shape and the authored impact force. A
 * refused query or emit retries in 0.2 s; an accepted one waits a full
 * `pulsePeriod`. The event's arrays are built fresh per pulse because the
 * combat queue keeps them by reference — that is the only allocation, and it
 * happens at most once per pulse, never per frame.
 *
 * ## The editor rule
 *
 * A cast keeps only its phase clocks, the pulse schedule and the pooled
 * wave/contact timestamps. Every metre, colour and gain is read from
 * `settings['exp-mass-weft']` every frame, so the corridor reshapes under the
 * slider. `settings.global.lifetime` scales the staged clock, so pulses keep
 * their count when the global lifetime is dragged.
 */
export class MassWeftAbility extends Ability {
  constructor(ctx) {
    super(ID, ctx);
  }

  /** The cast chooses its own targets and talks to combat itself. */
  get handlesOwnHits() {
    return true;
  }

  /** Bodies struck by the last accepted pulse. HUD readout only. */
  get instanceCount() {
    return this._struck;
  }

  get impactDuration() {
    return this.config.lifetime * this.lifetimeScale;
  }

  get lifetimeScale() {
    return Math.max(0.1, settings.global.lifetime);
  }

  /** Seconds into the impact phase on the authored (unscaled) clock. */
  get stagedTime() {
    return this.impactTime / this.lifetimeScale;
  }

  get fadeDuration() {
    return this.config.fade * this.lifetimeScale;
  }

  /** Gravity does not flicker; it throbs, slowly, with the pulse. */
  lightShimmer() {
    return 0.92 + 0.08 * Math.sin(this.age * 2.6);
  }

  /* ------------------------------------------------------------------ */
  /* Construction                                                        */
  /* ------------------------------------------------------------------ */

  createShaders() {
    this._particlePoint = new Vector3();
    this.rig = new Group();
    this.rig.name = 'mass-weft';
    this.group.add(this.rig);
    this.rig.visible = false;

    // Every geometry and material this cast creates is recorded once, so
    // `dispose` can free exactly what it made (tests count them).
    this.gs = [];
    this.ms = [];
    const g = (x) => (this.gs.push(x), x);
    const m = (x) => (this.ms.push(x), x);

    /* ---- 1 · the weft ribbon ---- */
    this.mat = m(createWeftFieldMaterial());
    this.ribbon = new Mesh(g(gravityRibbonGeometry()), this.mat);
    this.ribbon.rotation.x = Math.PI / 2; // local +Y (cast axis) → rig +Z
    this.ribbon.position.y = 0.08;
    this.ribbon.renderOrder = 4;
    this.rig.add(this.ribbon);

    /* ---- 2 · the floor weave ---- */
    this.floorMat = m(createWeftFloorMaterial());
    this.floor = new Mesh(g(weftFloorGeometry()), this.floorMat);
    this.floor.rotation.x = Math.PI / 2;
    this.floor.position.y = 0.03;
    this.floor.renderOrder = 2;
    this.rig.add(this.floor);

    /* ---- 6 · the lens (shares the ribbon's geometry) ---- */
    this.lensMat = m(createGravityLensMaterial());
    this.lens = new Mesh(this.ribbon.geometry, this.lensMat);
    this.lens.rotation.x = Math.PI / 2;
    this.lens.position.y = 0.07;
    this.lens.visible = false;
    this.rig.add(this.lens);

    /* ---- 3 · filaments and heddles ---- */
    this.filamentMat = m(createFilamentMaterial());
    const filament = g(gravityFilamentGeometry());
    this.filaments = [];
    for (let i = 0; i < 2; i++) {
      const f = new Mesh(filament, this.filamentMat);
      f.renderOrder = 6;
      this.rig.add(f);
      this.filaments.push(f);
    }
    this.ringMat = m(createWeftRingMaterial());
    const heddle = g(weftRingGeometry(12));
    this.rings = [];
    for (let i = 0; i < HEDDLES; i++) {
      const ring = new Mesh(heddle, this.ringMat);
      ring.renderOrder = 7;
      this.rig.add(ring);
      this.rings.push(ring);
    }

    /* ---- 4 · the shuttle ---- */
    this.coreMat = m(createShuttleMaterial());
    this.core = new Mesh(g(shuttleGeometry()), this.coreMat);
    this.core.renderOrder = 8;
    this.rig.add(this.core);

    /* ---- 5 · compression waves (contacts are built in createParticles) ---- */
    const compression = g(compressionRingGeometry());
    this.compressionWaves = [];
    this.compressionMaterials = [];
    this.compressionTimes = [];
    this.compressionNext = 0;
    for (let j = 0; j < MAX_WAVES; j++) {
      const mat = m(createCompressionMaterial());
      const wave = [];
      for (let i = 0; i < RINGS_PER_WAVE; i++) {
        const ring = new Mesh(compression, mat);
        ring.visible = false;
        ring.renderOrder = 9;
        this.rig.add(ring);
        wave.push(ring);
      }
      this.compressionWaves.push(wave);
      this.compressionMaterials.push(mat);
      this.compressionTimes.push(-1);
    }
    /** The newest wave's rings — the one the editor and tests watch. */
    this.compression = this.compressionWaves[0];

    // Normalised vertices: the bounding spheres mean nothing.
    this.rig.traverse((n) => {
      if (n.isMesh) {
        n.layers.set(LAYER.VFX);
        n.frustumCulled = false;
      }
    });
    this.lens.layers.set(LAYER.DISTORTION);

    /** The four materials that share the corridor's fade/pulse/clock. */
    this._bodyMaterials = [this.mat, this.filamentMat, this.ringMat, this.coreMat];

    this.scope = null;
    this.failure = null;
    this.nextPulse = 0;
    this.lastPulse = -1;
    this._struck = 0;
    this._strikes = 0;
    this._collapsed = false;
    this._affected = [];
  }

  createParticles() {
    /* ---- 7a · corridor streaks: the shared element transport ---- */
    this.atmosphere = new ExpansionAtmosphere(this.ctx, 'gravity', {
      shape: 'STREAK',
      colors: ['#e9ddff', '#b8a6cf', '#786c99', '#372d53'],
      rate: 18
    });
    this.contactEffects = new GravityContacts(this.group, this.ctx, this.atmosphere, (x) => (this.gs.push(x), x), (x) => (this.ms.push(x), x));

    const particles = this.ctx.particles;
    /* ---- 7b · infall: soft motes pulled from the edges to the spine ---- */
    this.infall = particles?.get?.(`${ID}.infall`, {
      capacity: 900,
      shape: ParticleShape.SOFT,
      additive: true,
      curl: true,
      softFade: 0.4
    }) ?? null;
    /* ---- 7c · grit: lit chips the pulse kicks off the floor ---- */
    // Not additive: grit is stone, it should occlude, not glow.
    this.grit = particles?.get?.(`${ID}.grit`, {
      capacity: 480,
      shape: ParticleShape.CHIP,
      additive: false,
      lit: true,
      softFade: 0.2
    }) ?? null;
    this.infallEmitter = new RateEmitter();
  }

  /* ------------------------------------------------------------------ */
  /* Casting                                                             */
  /* ------------------------------------------------------------------ */

  onSpawn() {
    this.reduceMotion = prefersReducedMotion();
    this.atmosphere.reset();
    this.infallEmitter.reset();
    this.rig.visible = false;
    this.scope = bindExpansionCombat(this.ctx, UID);
    this.failure = this.scope ? null : 'combat bridge unavailable';
    this.nextPulse = 0;
    this.lastPulse = -1;
    this._struck = 0;
    this._strikes = 0;
    this._collapsed = false;
    this._affected.length = 0;
    this.lens.visible = false;
    this.contactEffects.reset();
    // Without a binding the cast cannot strike, so it draws nothing either.
    this.rig.visible = !!this.scope;
    this.rig.position.copy(this.origin);
    this.rig.rotation.y = Math.atan2(this.direction.x, this.direction.z);
    this.compressionTimes.fill(-1);
    this.compressionNext = 0;
    for (const wave of this.compressionWaves) for (const ring of wave) ring.visible = false;
    this.coreMat.uniforms.uFlare.value = 0;
    this.floorMat.uniforms.uPulse.value = 0;
  }

  /** Copy the live palette and gains into every material. */
  _syncMaterials(c, fade, pulse, visualTime) {
    const flow = c.flowSpeed ?? 1;
    const time = visualTime * flow;
    for (const mat of this._bodyMaterials) {
      mat.userData.sync(c);
      mat.uniforms.uTime.value = time;
      mat.uniforms.uFade.value = fade;
      mat.uniforms.uPulse.value = pulse;
    }
    this.floorMat.userData.sync(c, this.ribbon.scale.y / Math.max(0.1, this.floor.scale.x));
    this.floorMat.uniforms.uTime.value = time;
    this.floorMat.uniforms.uFade.value = fade;
    this.floorMat.uniforms.uPulse.value = pulse;
  }

  /** Shared particle uniforms, written every frame from the live settings. */
  _syncParticles(c) {
    const gl = settings.global;
    if (this.infall) {
      this.infall.setGradient(getColor(c.colorInfallA), getColor(c.colorInfallB), getColor(c.colorInfallC), getColor(c.colorInfallD));
      const u = this.infall.uniforms;
      u.uGravity.value.set(0, -0.4, 0);
      u.uDrag.value = 1.6;
      u.uSizeScale.value = gl.particleSize;
      u.uLifeScale.value = gl.particleLifetime;
      u.uSpeedScale.value = gl.particleSpeed;
      u.uOpacity.value = gl.opacity;
      u.uGlow.value = gl.glow;
      u.uTurbulence.value = 0.25 * gl.turbulence;
    }
    if (this.grit) {
      this.grit.setGradient(getColor(c.colorGritA), getColor(c.colorGritB), getColor(c.colorGritC), getColor(c.colorGritD));
      const u = this.grit.uniforms;
      // Grit leaps then is dragged *back down* hard — gravity wins.
      u.uGravity.value.set(0, -14, 0);
      u.uDrag.value = 0.8;
      u.uSizeScale.value = gl.particleSize;
      u.uLifeScale.value = gl.particleLifetime;
      u.uSpeedScale.value = gl.particleSpeed;
      u.uOpacity.value = gl.opacity;
    }
  }

  /**
   * Lay out the corridor's meshes for a given width and drawn length.
   * Shared by the travel (length grows behind the shuttle) and the impact
   * (full length, narrowing as it collapses).
   */
  _layout(c, width, extent, visualTime, coreZ, coreScale) {
    this.ribbon.scale.set(width * 2, extent, 1);
    this.lens.scale.copy(this.ribbon.scale);
    // The well is wider than the strike capsule: space bends past its edge.
    this.floor.scale.set(Math.max(0.1, width * (c.floorWidth ?? 2.6)), extent, 1);
    const height = c.filamentHeight ?? 0.6;
    const twist = c.filamentTwist ?? 0.45;
    for (let i = 0; i < this.filaments.length; i++) {
      const f = this.filaments[i];
      f.position.y = height;
      f.rotation.z = i * Math.PI + visualTime * (i ? -1 : 1) * twist;
      f.scale.set(width, Math.min(1, width), extent);
    }
    const spin = c.ringSpin ?? 0.7;
    const tilt = c.ringTilt ?? 0.45;
    const ringSize = Math.min(1, width) * (c.ringScale ?? 1);
    for (let i = 0; i < this.rings.length; i++) {
      const r = this.rings[i];
      r.position.set(0, height, (extent * (i + 0.5)) / this.rings.length);
      r.rotation.set(Math.PI / 2 + (i % 2) * tilt, visualTime * (i % 2 ? -spin : spin), 0);
      r.scale.setScalar(ringSize);
    }
    this.core.position.set(0, c.coreHeight ?? 0.6, coreZ);
    this.core.scale.setScalar(coreScale);
  }

  onTravel(dt) {
    if (!this.scope) return;
    const c = this.config;
    const t = this.reduceMotion ? 0 : this.age;
    const width = c.zoneRadius * (c.travelWidth ?? 1);
    // Never draw past the aim point, even on a long frame.
    const extent = Math.min(this.front, this.length);

    this.atmosphere.rate = c.particleRate ?? this.atmosphere.rate;
    this.atmosphere.size = c.particleSize ?? this.atmosphere.size;
    this.atmosphere.radius = Math.min(4, c.zoneRadius * 0.7);
    if (!this.reduceMotion) {
      // The wake of the shuttle sheds streaks at reduced density.
      this._particlePoint.copy(this.position).setY(0.35);
      this.atmosphere.update(dt, this._particlePoint, 0.7);
    }

    this._layout(c, width, extent, t, extent, c.coreScale ?? 0.7);
    // Roll the shuttle about its long axis as it flies.
    this.core.rotation.set(0, 0, t * (c.coreSpin ?? 3));
    // The weave fades in behind the shuttle rather than appearing whole.
    this._syncMaterials(c, 1, 0, t);
    this.floorMat.uniforms.uFade.value = 0.75;
    this.coreMat.uniforms.uFlare.value = 0;
    this._lens(c, t, extent > 0 ? 1 : 0, 0);
    this._syncParticles(c);
    this._emitInfall(dt, c, extent, width, 0.5);
  }

  onImpact() {
    if (!this.scope) return;
    this.rig.position.copy(this.origin);
    this.rig.rotation.y = Math.atan2(this.direction.x, this.direction.z);
    this.rig.visible = true;
    // The weft locks in: a knock on the camera, a lift of the light.
    const c = this.config;
    const gl = settings.global;
    if (!this.reduceMotion) this.ctx.shake?.add?.((c.arrivalShake ?? 0.12) * gl.explosionIntensity, 3, 14);
    this.lightBoost = (c.pulseLight ?? 6) * 0.6 * gl.explosionIntensity;
    this.onFade(0, 0);
  }

  /** Lens on LAYER.DISTORTION: strength × the global distortion, held under reduced motion. */
  _lens(c, time, fade, pulse) {
    const strength = Math.max(0, Math.min(3, c.lensWarp ?? 0.7)) * Math.max(0, Math.min(2, settings.global.distortion)) * fade;
    this.lens.visible = !this.reduceMotion && strength > 0;
    this.lensMat.uniforms.uTime.value = time * (c.flowSpeed ?? 1);
    this.lensMat.uniforms.uStrength.value = strength;
    this.lensMat.uniforms.uPulse.value = pulse;
  }

  /** Motes drawn from both edges toward the spine, at a random station. */
  _emitInfall(dt, c, extent, width, rateScale) {
    if (!this.infall || this.reduceMotion || dt <= 0 || extent <= 0) return;
    const n = this.infallEmitter.tick(dt, Math.max(0, (c.infallRate ?? 26) * rateScale * settings.global.particleCount));
    if (!n) return;
    const sideSign = Math.random() < 0.5 ? -1 : 1;
    // Rig space → world: along the heading, across the side vector.
    _pos.copy(this.origin)
      .addScaledVector(this.direction, Math.random() * extent)
      .addScaledVector(this.side, sideSign * width * 1.1)
      .setY(0.15 + Math.random() * 0.5);
    _dir.copy(this.side).multiplyScalar(-sideSign).addScaledVector(_up, 0.15).normalize();
    _emit.position = _pos;
    _emit.radius = width * 0.25;
    _emit.direction = _dir;
    _emit.speed = c.infallSpeed ?? 1.3;
    _emit.speedVariance = 0.4;
    _emit.spread = 0.25;
    _emit.inherit = null;
    _emit.anchor = null;
    _emit.size = c.infallSize ?? 0.07;
    _emit.sizeVariance = 0.5;
    _emit.life = c.infallLifetime ?? 0.9;
    _emit.lifeVariance = 0.3;
    _emit.spin = 0;
    _emit.tint = null;
    _emit.time = frame.uTime.value;
    this.infall.emit(n, _emit);
  }

  /** Grit leaping off the floor at stations down the corridor. */
  _emitGrit(c) {
    if (!this.grit || this.reduceMotion) return;
    const count = Math.round(((c.gritBurst ?? 14) * settings.global.particleCount) / GRIT_STATIONS);
    if (count <= 0) return;
    for (let i = 0; i < GRIT_STATIONS; i++) {
      this.pointAt((i + 0.5) / GRIT_STATIONS, _pos).setY(0.05);
      _emit.position = _pos;
      _emit.radius = c.zoneRadius * 0.7;
      _emit.direction = _up;
      _emit.speed = c.gritSpeed ?? 2.2;
      _emit.speedVariance = 0.5;
      _emit.spread = 0.5;
      _emit.inherit = null;
      _emit.anchor = null;
      _emit.size = c.gritSize ?? 0.08;
      _emit.sizeVariance = 0.6;
      _emit.life = c.gritLifetime ?? 0.8;
      _emit.lifeVariance = 0.3;
      _emit.spin = 6;
      _emit.tint = null;
      _emit.time = frame.uTime.value;
      this.grit.emit(count, _emit);
    }
  }

  /**
   * One pulse: query, filter to the capsule, emit. Returns whether combat
   * accepted it (a refusal records `failure` and schedules a quick retry).
   */
  _pulse(c) {
    const ax = this.origin.x;
    const az = this.origin.z;
    const bx = this.position.x;
    const bz = this.position.z;
    const mx = (ax + bx) / 2;
    const mz = (az + bz) / 2;
    _query.position[0] = mx;
    _query.position[2] = mz;
    _query.radius = Math.min(48, this.length / 2 + c.zoneRadius);
    const q = this.scope.queryActors(_query);
    let accepted = !!q?.ok;
    const affected = this._affected;
    affected.length = 0;
    if (!accepted) this.failure = q?.reason ?? 'target query refused';
    if (accepted) {
      _losFrom[0] = ax;
      _losFrom[2] = az;
      for (const actor of q.actors) {
        if (!actor.alive || distanceToSegment(actor.position[0], actor.position[2], ax, az, bx, bz) > c.zoneRadius) continue;
        // Solid cover between the caster and the body shelters it.
        const los = this.scope.isBlocked(_losFrom, actor.position);
        if (!los?.ok) {
          accepted = false;
          this.failure = los?.reason ?? 'terrain query refused';
          break;
        }
        if (!los.blocked && affected.length < MAX_TARGETS) affected.push(actor);
      }
    }
    if (accepted && affected.length) {
      // Fresh arrays: the combat queue keeps the event by reference.
      const targetIds = new Array(affected.length);
      for (let i = 0; i < affected.length; i++) targetIds[i] = affected[i].id;
      const out = this.scope.emit({
        type: 'hit',
        element: 'gravity',
        position: [mx, 0, mz],
        sourcePosition: [ax, 0, az],
        hitForce: impactForce(c),
        targetIds,
        damage: c.damage,
        intensity: 1,
        shape: { kind: 'capsule', ax, az, bx, bz, r: c.zoneRadius }
      });
      if (out?.ok) {
        this._onStrike(c, affected);
      } else {
        accepted = false;
        this.failure = out?.reason ?? 'gravity event refused';
      }
    }
    // Accepted pulses wait a full period; refused ones retry soon.
    this.nextPulse = this.stagedTime + (accepted ? Math.max(0.3, c.pulsePeriod) : 0.2);
  }

  /** The beat of an accepted strike: waves, contacts, grit, camera, light. */
  _onStrike(c, affected) {
    const gl = settings.global;
    this.lastPulse = this.stagedTime;
    this._struck = affected.length;
    this.compressionTimes[this.compressionNext] = this.stagedTime;
    this.compressionNext = (this.compressionNext + 1) % this.compressionWaves.length;
    if (!this.reduceMotion) this.contactEffects.fire(affected, this.stagedTime, c);
    this._emitGrit(c);
    // Camera beats are skipped under reduced motion; the light punch stays.
    if (!this.reduceMotion) {
      this.ctx.shake?.add?.((c.pulseShake ?? 0.1) * gl.explosionIntensity, 4, 18);
      if (this._strikes === 0) this.ctx.flash?.trigger?.(getColor(c.flashColor ?? c.coreColor), (c.pulseFlash ?? 0.08) * gl.explosionIntensity);
    }
    this.lightBoost = (c.pulseLight ?? 6) * gl.explosionIntensity;
    this._strikes++;
  }

  onFade(dt, t) {
    if (!this.scope) return;
    const c = this.config;
    const gl = settings.global;
    const visualTime = this.reduceMotion ? 0 : this.age;
    this.atmosphere.rate = c.particleRate ?? this.atmosphere.rate;
    this.atmosphere.size = c.particleSize ?? this.atmosphere.size;
    if (!this.reduceMotion && this.phase === AbilityPhase.IMPACT) {
      // The streak source sweeps the length of the corridor, so the particles
      // trace the weft rather than piling at the aim point.
      const flow = (this.stagedTime * (c.particleFlowSpeed ?? 0.8)) % 1;
      this._particlePoint.copy(this.origin).addScaledVector(this.direction, this.length * flow).setY(0.35);
      this.atmosphere.radius = Math.min(4, c.zoneRadius * 0.7);
      this.atmosphere.update(dt, this._particlePoint);
    }

    const fade = t <= 1 ? 1 : 1 - clamp01(t - 1);
    if (dt > 0 && this.phase === AbilityPhase.IMPACT && this.stagedTime >= this.nextPulse) this._pulse(c);

    // The implosion: one beat on the first frame of the fade.
    if (t > 1 && !this._collapsed) {
      this._collapsed = true;
      if (!this.reduceMotion) {
        this.ctx.shake?.add?.((c.collapseShake ?? 0.14) * gl.explosionIntensity, 3, 12);
        this.ctx.flash?.trigger?.(getColor(c.flashColor ?? c.coreColor), (c.collapseFlash ?? 0.12) * gl.explosionIntensity);
      }
      this.lightBoost = Math.max(this.lightBoost, (c.pulseLight ?? 6) * 0.8 * gl.explosionIntensity);
    }

    this.atmosphere.syncPalette(c.gravityColor, c.coreColor);
    this.contactEffects.update(this.stagedTime, visualTime, fade, c, this.reduceMotion);

    // The corridor narrows as it fades: width falls by `collapseStrength`.
    const collapse = 1 - (1 - fade) * clamp01(c.collapseStrength ?? 0.85);
    const visualWidth = c.zoneRadius * collapse;
    const pulse = this.lastPulse < 0 ? 0 : 1 - clamp01((this.stagedTime - this.lastPulse) / 0.35);
    const throb = 1 + (c.corePulse ?? 0.15) * Math.sin(visualTime * 4);
    // The shuttle swells on the implosion as the weave falls into it.
    const implosion = t <= 1 ? 0 : Math.sin(Math.PI * clamp01(t - 1));
    this._layout(c, visualWidth, this.length, visualTime, this.length * 0.5, (c.coreScale ?? 0.7) * throb * collapse * (1 + implosion * 0.6));
    this.core.rotation.set(0, 0, visualTime * (c.coreSpin ?? 3) * 0.25);
    this._syncMaterials(c, fade, pulse, visualTime);
    this.coreMat.uniforms.uFade.value = Math.min(1, fade + implosion);
    this.coreMat.uniforms.uFlare.value = implosion * (c.collapseFlare ?? 1.4);
    this._lens(c, visualTime, fade, pulse);

    for (let j = 0; j < this.compressionWaves.length; j++) {
      const pulseAge = this.compressionTimes[j] < 0 ? -1 : this.stagedTime - this.compressionTimes[j];
      const duration = Math.max(0.1, c.compressionDuration ?? 0.5);
      const progress = pulseAge < 0 ? 0 : clamp01(pulseAge / duration);
      const mat = this.compressionMaterials[j];
      mat.userData.sync(c);
      mat.uniforms.uTime.value = visualTime;
      mat.uniforms.uFade.value = fade * (pulseAge < 0 ? 0 : 1 - progress);
      const wave = this.compressionWaves[j];
      for (let i = 0; i < wave.length; i++) {
        const ring = wave[i];
        ring.visible = pulseAge >= 0 && progress < 1;
        ring.position.set(0, c.filamentHeight ?? 0.6, (this.length * (i + 1)) / 4);
        // Each ring opens from half to one-and-a-half corridor widths.
        ring.scale.setScalar((c.compressionScale ?? 1) * Math.min(1, visualWidth) * (0.5 + progress));
        ring.rotation.z = visualTime * (i % 2 ? -1 : 1);
      }
    }

    this._syncParticles(c);
    if (this.phase === AbilityPhase.IMPACT) this._emitInfall(dt, c, this.length, visualWidth, 1);
  }

  onDestroy() {
    this.rig.visible = false;
    this.lens.visible = false;
    this.contactEffects.reset();
    for (const wave of this.compressionWaves) for (const ring of wave) ring.visible = false;
    this._affected.length = 0;
    this.scope = null;
  }

  dispose() {
    for (const x of this.gs) x.dispose();
    for (const x of this.ms) x.dispose();
    super.dispose();
  }
}

/* -------------------------------------------------------------------- */
/* Editor                                                               */
/* -------------------------------------------------------------------- */

/**
 * Editor helpers that degrade gracefully: the production shell passes the
 * real `Editor` and lil-gui folders, while hosts and tests may pass a bare
 * folder without `addFolder`/`name`, or no `Editor` at all.
 */
function editorKit(Editor) {
  const named = (ctl, label) => (label && typeof ctl?.name === 'function' ? ctl.name(label) : ctl);
  const sub = (folder, title) => (typeof folder.addFolder === 'function' ? folder.addFolder(title) : folder);
  const R = (folder, c, key, min, max, step, label) =>
    typeof Editor?.range === 'function' ? Editor.range(folder, c, key, min, max, step, label) : named(folder.add(c, key, min, max, step), label);
  const C = (folder, c, key, label) => named(folder.addColor(c, key), label);
  const G = (folder, c, prefix, title) => {
    if (typeof Editor?.gradient === 'function' && typeof folder.addFolder === 'function') return Editor.gradient(folder, c, prefix, title);
    const group = sub(folder, title);
    C(group, c, `${prefix}A`, 'birth');
    C(group, c, `${prefix}B`, 'early');
    C(group, c, `${prefix}C`, 'late');
    C(group, c, `${prefix}D`, 'death');
    return group;
  };
  const anim = (folder, c) =>
    typeof Editor?.castAnimation === 'function' ? Editor.castAnimation(folder, c) : named(folder.add(c, 'castAnim', CAST_ANIMATIONS), 'cast animation');
  return { R, C, G, sub, anim };
}

export function buildEditor(gui, c, Editor) {
  const { R, C, G, sub, anim } = editorKit(Editor);
  const f = gui.addFolder('◎  Mass Weft');

  const cast = sub(f, 'The cast');
  R(cast, c, 'range', 1, 48, 0.1, 'max range');
  R(cast, c, 'minRange', 0, 20, 0.1, 'min range');
  R(cast, c, 'speed', 1, 60, 0.1, 'shuttle speed (m/s)');
  R(cast, c, 'cooldown', 0, 30, 0.1, 'cooldown');
  R(cast, c, 'lifetime', 2, 8, 0.1, 'corridor stands for');
  R(cast, c, 'fade', 0.1, 5, 0.1, 'collapse over');
  anim(cast, c);

  const strike = sub(f, 'The strike');
  R(strike, c, 'zoneRadius', 0.3, 4, 0.1, 'corridor half-width (m)');
  R(strike, c, 'pulsePeriod', 0.3, 3, 0.1, 'seconds between strikes');
  R(strike, c, 'damage', 0.1, 2, 0.1, 'damage per strike');
  R(strike, c, 'hitImpulse', 0, 24, 0.1, 'knockback');
  R(strike, c, 'hitLift', 0, 20, 0.1, 'lift');
  R(strike, c, 'hitSpin', 0, 8, 0.05, 'spin');

  const ribbon = sub(f, '1 · Weft ribbon');
  R(ribbon, c, 'travelWidth', 0.25, 2, 0.05, 'width in flight (× radius)');
  R(ribbon, c, 'collapseStrength', 0, 1, 0.05, 'narrowing on collapse');
  R(ribbon, c, 'flowSpeed', 0, 3, 0.05, 'shader flow speed');
  R(ribbon, c, 'ribbonGlow', 0, 4, 0.05, 'glow');
  R(ribbon, c, 'ribbonNoise', 0, 3, 0.05, 'noise in the threads');
  R(ribbon, c, 'ribbonRipple', 0, 3, 0.05, 'trough ripple');
  R(ribbon, c, 'softFade', 0, 2, 0.01, 'soft edge into geometry (m)');
  C(ribbon, c, 'gravityColor', 'bent space');
  C(ribbon, c, 'coreColor', 'weft light');

  const floor = sub(f, '2 · Floor weave');
  R(floor, c, 'floorWidth', 0.5, 5, 0.05, 'width (× radius)');
  R(floor, c, 'floorSag', 0, 2, 0.05, 'pinch toward the spine');
  R(floor, c, 'floorOpacity', 0, 1, 0.01, 'darkness of the well');
  R(floor, c, 'weaveDensity', 1, 20, 0.5, 'threads across');
  R(floor, c, 'weaveThread', 0.01, 0.4, 0.005, 'thread thickness');
  R(floor, c, 'weaveGlow', 0, 4, 0.05, 'thread glow');
  C(floor, c, 'weftColor', 'threads');
  C(floor, c, 'voidColor', 'the well');

  const threads = sub(f, '3 · Filaments + heddles');
  R(threads, c, 'filamentHeight', 0.1, 2, 0.05, 'height (m)');
  R(threads, c, 'filamentTwist', 0, 3, 0.05, 'twist speed (rad/s)');
  R(threads, c, 'filamentGlow', 0, 4, 0.05, 'filament glow');
  R(threads, c, 'filamentBeads', 4, 160, 1, 'beads per thread');
  R(threads, c, 'ringScale', 0.2, 2, 0.05, 'heddle size');
  R(threads, c, 'ringSpin', 0, 4, 0.05, 'heddle spin (rad/s)');
  R(threads, c, 'ringTilt', 0, 1.5, 0.01, 'alternate lean (rad)');
  R(threads, c, 'ringGlow', 0, 4, 0.05, 'heddle glow');

  const shuttle = sub(f, '4 · Shuttle');
  R(shuttle, c, 'coreScale', 0.2, 2, 0.05, 'size');
  R(shuttle, c, 'coreHeight', 0.1, 2, 0.05, 'height (m)');
  R(shuttle, c, 'corePulse', 0, 0.6, 0.01, 'throb');
  R(shuttle, c, 'coreSpin', 0, 12, 0.1, 'roll in flight (rad/s)');
  R(shuttle, c, 'coreHorizon', 0.5, 8, 0.05, 'rim tightness');
  R(shuttle, c, 'coreGlow', 0, 4, 0.05, 'rim glow');
  R(shuttle, c, 'coreWobble', 0, 3, 0.05, 'skin boil');
  R(shuttle, c, 'collapseFlare', 0, 4, 0.05, 'implosion flare');

  const waves = sub(f, '5 · Compression + contact');
  R(waves, c, 'compressionScale', 0.25, 2, 0.05, 'compression size');
  R(waves, c, 'compressionDuration', 0.1, 2, 0.05, 'compression runs for');
  R(waves, c, 'compressionGlow', 0, 4, 0.05, 'compression glow');
  R(waves, c, 'contactScale', 0.2, 3, 0.05, 'contact size');
  R(waves, c, 'contactDuration', 0.1, 2, 0.05, 'contact lasts');
  R(waves, c, 'contactGlow', 0, 2, 0.05, 'contact strength');

  const lens = sub(f, '6 · Lens');
  R(lens, c, 'lensWarp', 0, 3, 0.05, 'refraction');

  const motes = sub(f, '7 · Particles');
  R(motes, c, 'particleRate', 0, 100, 1, 'streaks/second');
  R(motes, c, 'particleSize', 0.02, 0.5, 0.01, 'streak size');
  R(motes, c, 'particleFlowSpeed', 0, 3, 0.05, 'streak sweep speed');
  R(motes, c, 'infallRate', 0, 200, 1, 'infall motes/second');
  R(motes, c, 'infallSize', 0.01, 0.4, 0.005, 'infall size');
  R(motes, c, 'infallSpeed', 0, 6, 0.05, 'infall speed');
  R(motes, c, 'infallLifetime', 0.1, 4, 0.05, 'infall lifetime');
  G(motes, c, 'colorInfall', 'infall gradient');
  R(motes, c, 'gritBurst', 0, 80, 1, 'grit per strike');
  R(motes, c, 'gritSize', 0.01, 0.4, 0.005, 'grit size');
  R(motes, c, 'gritSpeed', 0, 8, 0.05, 'grit leap');
  R(motes, c, 'gritLifetime', 0.1, 3, 0.05, 'grit lifetime');
  G(motes, c, 'colorGrit', 'grit gradient');

  const beats = sub(f, '8 · Beats');
  R(beats, c, 'arrivalShake', 0, 1, 0.01, 'lock-in shake');
  R(beats, c, 'pulseShake', 0, 1, 0.01, 'strike shake');
  R(beats, c, 'pulseFlash', 0, 1, 0.01, 'first strike flash');
  R(beats, c, 'pulseLight', 0, 30, 0.1, 'strike light punch');
  R(beats, c, 'collapseShake', 0, 1, 0.01, 'implosion shake');
  R(beats, c, 'collapseFlash', 0, 1, 0.01, 'implosion flash');
  C(beats, c, 'flashColor', 'flash');

  const light = sub(f, 'Light');
  R(light, c, 'lightIntensity', 0, 30, 0.1, 'intensity');
  R(light, c, 'lightRadius', 1, 40, 0.1, 'radius');
  C(light, c, 'lightColor', 'colour');
  return f;
}
