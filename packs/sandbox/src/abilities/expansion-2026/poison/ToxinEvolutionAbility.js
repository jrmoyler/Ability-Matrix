import { Color, Group, Mesh, PlaneGeometry, Vector3 } from 'three';
import { Ability, AbilityPhase } from '../../Ability.js';
import { LAYER } from '../../../core/Layers.js';
import { frame } from '../../../core/FrameUniforms.js';
import { CAST_ANIMATIONS, settings } from '../../../config/settings.js';
import { getColor } from '../../../utils/color.js';
import { Easing } from '../../../utils/math.js';
import { ParticleShape } from '../../../particles/ParticleSystem.js';
import { RateEmitter } from '../../../particles/ParticleEngine.js';
import { impactForce } from '../AuthoredImpactForce.js';
import { bindExpansionCombat } from '../StandaloneCombat.js';
import { ExpansionAtmosphere, prefersReducedMotion } from '../ExpansionAtmosphere.js';
import { ToxinStages } from './ToxinStages.js';
import {
  toxinMembraneGeometry,
  toxinVesselGeometry,
  toxinCoilGeometry,
  toxinSporeGeometry,
  toxinPoolGeometry
} from './ToxinGeometry.js';
import {
  createMembraneMaterial,
  createVesselMaterial,
  createSporeMaterial,
  createCoilMaterial,
  createPoolMaterial,
  createHazeMaterial
} from './ToxinMaterials.js';

export { toxinMembraneGeometry, toxinVesselGeometry, toxinCoilGeometry };

export const ID = 'exp-toxin-evolution';
export const UID = 'matrix-expansion/toxin-evolution';

/** Generations of the toxin. Fixed by the mechanic. */
const MAX_STAGES = 3;
/** Spores orbiting the host, and riding the travelling vessel. */
const MAX_SPORES = 24;
const MAX_TRAVEL_SPORES = 6;
const TAU = Math.PI * 2;
const GOLDEN = 2.399963;

const clamp = (x) => Math.max(0, Math.min(1, x));

/* Module scratch: no allocation per frame. */
const _emit = {};
const _at = new Vector3();
const _down = new Vector3(0, -1, 0);
const _up = new Vector3(0, 1, 0);
const _membrane = { time: 0, stage: 0, pulse: 0, fade: 1, dissolve: 0, reduced: false };
const _solid = { time: 0, fade: 1, reduced: false };
const _coil = { time: 0, fade: 1, pulse: 0, grow: 0 };
const _pool = { time: 0, stage: 0, fade: 1, spread: 0 };
const _haze = { time: 0, width: 1, height: 1, strength: 0 };

/**
 * TOXIN EVOLUTION — an infection that grows through three generations.
 *
 * A zone cast that picks one host:
 *
 *   1. **travel** — a ribbed seed vessel arcs out to the circle, spinning,
 *      six spores riding it, shedding bubbles and venom drips.
 *   2. **arrival** — the vessel bursts on the nearest enemy in the circle
 *      (the combat bridge's snapshot, nearest first, ID as a tie-break): the
 *      membrane rises out of the floor over `formTime`, spores spiral out to
 *      their orbit, and a stain starts creeping out across the floor under it.
 *   3. **three generations** — each is a real poison strike committed through
 *      the bridge, stronger than the last. Only an *accepted* strike grows the
 *      next generation: a coil winds up the host, a satellite vessel unfolds
 *      beside it, a crown unfurls on the floor with its own burst and decal
 *      (puff → ripple → shockwave), cysts erupt on the membrane, the stain
 *      spreads, the fumes over the host thicken, and the camera, flash and
 *      light take a beat that grows with the stage.
 *   4. **withdrawal** — when the host dies, is replaced, or escapes past
 *      `tetherRange`, the infection stops striking and withers over
 *      `releaseDuration`; otherwise it withers through the fade phase. The
 *      membrane dissolves from the floor up, coils and vessels retract, the
 *      stain dries out.
 *
 * Layers, each a folder in the editor:
 *
 *   - the membrane (`createMembraneMaterial`) — additive, so the host stays
 *     visible inside it, fresnel-dense at the silhouette, voronoi cysts
 *   - vessels and spores (`createVesselMaterial`, `createSporeMaterial`)
 *   - three coils (`createCoilMaterial`, authored `toxinCoilGeometry`)
 *   - three crowns (`ToxinStages`) with their burst/decal beats
 *   - the pool (`createPoolMaterial`) — normal-blended, it *darkens* the floor
 *   - particles: spore bubbles (`ExpansionAtmosphere`), venom drips, miasma
 *   - fumes on `LAYER.DISTORTION` (`createHazeMaterial`)
 *
 * ## Gameplay vs presentation
 *
 * The strike schedule runs on `stagedTime` (impact time ÷ global lifetime)
 * and records the accepted time of each stage in `stageTimes`; every visual is
 * a function of those recorded times plus the live settings, so a refused
 * strike can never grow anything and every slider is live. The visual clock
 * (`_time`) is integrated and holds still under reduced motion, which also
 * skips the crowns, particles, camera shake and flash.
 */
export class ToxinEvolutionAbility extends Ability {
  constructor(ctx) {
    super(ID, ctx);
  }

  /** The host is chosen and struck through the combat bridge. */
  get handlesOwnHits() {
    return true;
  }

  get lifetimeScale() {
    return Math.max(0.1, settings.global.lifetime);
  }

  get impactDuration() {
    return this.config.lifetime * this.lifetimeScale;
  }

  get fadeDuration() {
    return this.config.fade * this.lifetimeScale;
  }

  /** Impact time on the unscaled authoring clock the strikes use. */
  get stagedTime() {
    return this.impactTime / this.lifetimeScale;
  }

  /** HUD readout only. */
  get instanceCount() {
    return this.coils.length + this.spores.length + 2;
  }

  /* ------------------------------------------------------------------ */
  /* Construction                                                        */
  /* ------------------------------------------------------------------ */

  createShaders() {
    this._lightSaved = new Vector3();
    /** Every geometry and material this instance owns, for `dispose`. */
    this.gs = [];
    this.ms = [];
    const g = (x) => (this.gs.push(x), x);
    const m = (x) => (this.ms.push(x), x);

    /* ---- the infection, positioned on the host ---- */
    this.effect = new Group();
    this.group.add(this.effect);
    this.effect.visible = false;

    this.bodyMat = m(createMembraneMaterial());
    this.vesselMat = m(createVesselMaterial());
    this.sporeMat = m(createSporeMaterial());
    this.poolMat = m(createPoolMaterial());
    /** The floor material under its original name. */
    this.sigilMat = this.poolMat;

    this.body = new Mesh(g(toxinMembraneGeometry()), this.bodyMat);
    this.body.renderOrder = 3;
    this.effect.add(this.body);

    this.floor = new Mesh(g(toxinPoolGeometry()), this.poolMat);
    this.floor.position.y = 0.045;
    this.effect.add(this.floor);

    this.coils = [];
    this.coilMaterials = [];
    for (let i = 0; i < MAX_STAGES; i++) {
      const material = m(createCoilMaterial(i));
      const coil = new Mesh(g(toxinCoilGeometry((i * TAU) / 3, i)), material);
      coil.visible = false;
      this.effect.add(coil);
      this.coils.push(coil);
      this.coilMaterials.push(material);
    }

    const vessel = g(toxinVesselGeometry());
    this.vessels = [];
    for (let i = 0; i < MAX_STAGES; i++) {
      const v = new Mesh(vessel, this.vesselMat);
      v.visible = false;
      this.effect.add(v);
      this.vessels.push(v);
    }
    this.stageTimes = [-1, -1, -1];

    // `this.atmosphere` is created in createParticles and handed in there.
    this.stageEffects = new ToxinStages(this.effect, this.ctx, this.atmosphere, g, m);

    const spore = g(toxinSporeGeometry());
    this.spores = [];
    for (let i = 0; i < MAX_SPORES; i++) {
      const s = new Mesh(spore, this.sporeMat);
      this.effect.add(s);
      this.spores.push(s);
    }

    /* ---- the seed vessel in flight ---- */
    this.travelPod = new Group();
    this.group.add(this.travelPod);
    this.travelPod.visible = false;
    this.pod = new Mesh(vessel, this.vesselMat);
    this.pod.scale.setScalar(0.75);
    this.travelPod.add(this.pod);
    this.travelSpores = [];
    for (let i = 0; i < MAX_TRAVEL_SPORES; i++) {
      const s = new Mesh(spore, this.sporeMat);
      this.travelPod.add(s);
      this.travelSpores.push(s);
    }
    this.travelPod.traverse((n) => {
      if (n.isMesh) {
        n.layers.set(LAYER.VFX);
        n.frustumCulled = false;
      }
    });
    this.effect.traverse((x) => {
      if (x.isMesh) {
        x.layers.set(LAYER.VFX);
        x.frustumCulled = false;
      }
    });

    /* ---- fumes over the host (after the VFX sweep) ---- */
    this.hazeMat = m(createHazeMaterial());
    this.haze = new Mesh(g(new PlaneGeometry(1, 1, 1, 1)), this.hazeMat);
    this.haze.layers.set(LAYER.DISTORTION);
    this.haze.frustumCulled = false;
    this.haze.visible = false;
    this.effect.add(this.haze);

    /* ---- per-cast state (reset in onSpawn) ---- */
    this.scope = null;
    this.targetId = null;
    this.targetGeneration = null;
    this.stage = 0;
    this.nextStage = 0;
    this.failure = null;
    this.releaseAt = -1;
    this._time = 0;
  }

  createParticles() {
    // Ambient spore bubbles, shared with the expansion transport.
    this.atmosphere = new ExpansionAtmosphere(this.ctx, 'poison', {
      shape: 'BUBBLE',
      colors: ['#e8ffad', '#9be641', '#5c9830', '#24431b'],
      rate: 22
    });
    this.stageEffects.atmosphere = this.atmosphere;

    const particles = this.ctx.particles;
    // Venom drips: non-additive so they read as liquid, falling under gravity.
    this.drips = particles?.get('expansion.toxin-evolution-drip', {
      capacity: 360, shape: ParticleShape.DROPLET, additive: false, stretch: true, softFade: 0.2
    }) ?? null;
    // Miasma: low, heavy fumes crawling off the pool.
    this.miasma = particles?.get('expansion.toxin-evolution-miasma', {
      capacity: 220, shape: ParticleShape.SMOKE, additive: false, curl: true, softFade: 0.8
    }) ?? null;
    this.dripEmitter = new RateEmitter();
    this.miasmaEmitter = new RateEmitter();
    this._dripColors = [new Color(), new Color(), new Color(), new Color()];
    this._miasmaColors = [new Color(), new Color(), new Color(), new Color()];
  }

  /* ------------------------------------------------------------------ */
  /* Casting                                                             */
  /* ------------------------------------------------------------------ */

  onSpawn() {
    this.reduceMotion = prefersReducedMotion();
    this.atmosphere.reset();
    this.dripEmitter.reset();
    this.miasmaEmitter.reset();
    this.effect.visible = false;
    this.haze.visible = false;
    this.targetId = null;
    this.targetGeneration = null;
    this.stage = 0;
    this.nextStage = 0;
    this.failure = null;
    this.releaseAt = -1;
    this._time = 0;
    this.stageTimes.fill(-1);
    for (const coil of this.coils) coil.visible = false;
    for (const vessel of this.vessels) vessel.visible = false;
    this.stageEffects.reset();
    this.scope = bindExpansionCombat(this.ctx, UID);
    if (!this.scope) this.failure = 'combat bridge unavailable';
    // Without a bridge there is nothing to infect, so nothing flies.
    this.travelPod.visible = !!this.scope;
    this.travelPod.position.copy(this.origin);
  }

  _advance(dt) {
    if (!this.reduceMotion && dt > 0) this._time += dt * settings.global.noiseSpeed;
  }

  _syncParticles(c) {
    const g = settings.global;
    this.atmosphere.rate = c.particleRate ?? this.atmosphere.rate;
    this.atmosphere.size = c.particleSize ?? this.atmosphere.size;
    this.atmosphere.syncPalette(c.toxinColor, c.coreColor);
    if (this.drips) {
      const k = this._dripColors;
      k[0].copy(getColor(c.dripColorA));
      k[1].copy(getColor(c.dripColorB));
      k[2].copy(getColor(c.dripColorC));
      k[3].copy(getColor(c.dripColorD));
      this.drips.setGradient(k[0], k[1], k[2], k[3]);
      const u = this.drips.uniforms;
      u.uGravity.value.set(0, -c.dripGravity, 0);
      u.uDrag.value = 0.3;
      u.uStretch.value = 0.25;
      u.uSizeScale.value = g.particleSize;
      u.uLifeScale.value = g.particleLifetime;
      u.uSpeedScale.value = g.particleSpeed;
      u.uOpacity.value = g.opacity;
    }
    if (this.miasma) {
      const k = this._miasmaColors;
      k[0].copy(getColor(c.miasmaColorA));
      k[1].copy(getColor(c.miasmaColorB));
      k[2].copy(getColor(c.miasmaColorC));
      k[3].copy(getColor(c.miasmaColorD));
      this.miasma.setGradient(k[0], k[1], k[2], k[3]);
      const u = this.miasma.uniforms;
      u.uGravity.value.set(0, c.miasmaRise, 0);
      u.uDrag.value = 1.2;
      u.uEndSize.value = 2.2;
      u.uFadeIn.value = 0.2;
      u.uFadeOut.value = 0.5;
      u.uTurbulence.value = 0.5 * g.turbulence;
      u.uSizeScale.value = g.particleSize;
      u.uLifeScale.value = g.particleLifetime;
      u.uSpeedScale.value = g.particleSpeed;
      u.uOpacity.value = c.miasmaOpacity * g.opacity;
    }
  }

  /** Venom drips shed from a point, falling. */
  _drip(dt, position, rate, radius, c) {
    if (this.reduceMotion || !this.drips || dt <= 0) return;
    const count = this.dripEmitter.tick(dt, Math.min(60, rate * settings.global.particleCount));
    if (!count) return;
    _emit.position = position;
    _emit.direction = _down;
    _emit.radius = radius;
    _emit.spread = 0.35;
    _emit.speed = 0.3;
    _emit.speedVariance = 0.5;
    _emit.inherit = null;
    _emit.anchor = null;
    _emit.size = c.dripSize;
    _emit.sizeVariance = 0.4;
    _emit.life = c.dripLife;
    _emit.lifeVariance = 0.3;
    _emit.spin = 0;
    _emit.tint = null;
    _emit.time = frame.uTime.value;
    this.drips.emit(Math.min(16, count), _emit);
  }

  onTravel(dt) {
    const c = this.config;
    this._advance(dt);
    this._syncParticles(c);
    const t = this._time;

    // A shallow arc: it is thrown, not fired.
    this.travelPod.position.copy(this.position);
    this.travelPod.position.y = c.travelHeight + Math.sin(Math.PI * this.u) * 0.6;
    this.travelPod.rotation.set(Math.sin(t * 3) * 0.25, t * c.travelSpin, 0);
    // Swells off the caster's hand rather than appearing at full size.
    this.travelPod.scale.setScalar((c.travelScale ?? 1) * Easing.outBack(clamp(this.age / 0.18)));
    if (!this.reduceMotion && this.travelPod.visible) this.atmosphere.update(dt, this.travelPod.position, c.travelDensity ?? 0.6);
    if (this.travelPod.visible) this._drip(dt, this.travelPod.position, c.dripRate * 0.6, 0.12, c);

    _solid.time = t;
    _solid.fade = 1;
    _solid.reduced = this.reduceMotion;
    this.vesselMat.userData.sync(c, _solid);
    this.sporeMat.userData.sync(c, _solid);
    for (let i = 0; i < this.travelSpores.length; i++) {
      const a = (i * TAU) / this.travelSpores.length + t * 2;
      this.travelSpores[i].position.set(Math.cos(a) * 0.5, 0.2 + (i % 3) * 0.18, Math.sin(a) * 0.5);
    }
  }

  onImpact() {
    this.travelPod.visible = false;
    if (!this.scope) return;
    const q = this.scope.queryActors({ position: this.position.toArray(), radius: this.config.zoneRadius, relation: 'enemy' });
    if (!q?.ok) {
      this.failure = q?.reason ?? 'query unavailable';
      return;
    }
    // Nearest living enemy to the aim point, ID as a stable tie-break.
    let target = null, best = Infinity;
    for (const actor of q.actors) {
      if (!actor.alive) continue;
      const d = Math.hypot(actor.position[0] - this.position.x, actor.position[2] - this.position.z);
      if (d < best || (d === best && target && actor.id.localeCompare(target.id) < 0)) {
        best = d;
        target = actor;
      }
    }
    this.targetId = target?.id ?? null;
    this.targetGeneration = target?.standGeneration ?? null;
    if (!target) {
      this.failure = 'no eligible target';
      return;
    }
    this.effect.position.fromArray(target.position);
    this.effect.visible = true;
    this.nextStage = 0;
    // The vessel bursts on the host: a splash of venom and a small light punch.
    this.lightBoost += this.config.lightPunch * 0.5 * settings.global.lightIntensity;
    if (!this.reduceMotion && this.drips) {
      _at.copy(this.effect.position).setY(1.1);
      _emit.position = _at;
      _emit.direction = _up;
      _emit.radius = 0.25;
      _emit.spread = 0.9;
      _emit.speed = 2.2;
      _emit.speedVariance = 0.5;
      _emit.inherit = null;
      _emit.anchor = null;
      _emit.size = this.config.dripSize * 1.2;
      _emit.sizeVariance = 0.5;
      _emit.life = this.config.dripLife;
      _emit.lifeVariance = 0.3;
      _emit.spin = 0;
      _emit.tint = null;
      _emit.time = frame.uTime.value;
      this.drips.emit(Math.round(18 * settings.global.particleCount), _emit);
    }
    this.onFade(0, 0);
  }

  onFade(dt, t) {
    const c = this.config;
    this._advance(dt);
    this._syncParticles(c);
    const visualTime = this._time;
    if (!this.reduceMotion && this.targetId && this.phase === AbilityPhase.IMPACT) this.atmosphere.update(dt, this.effect.position);

    let fade = t <= 1 ? 1 : 1 - clamp(t - 1);
    this._strike(dt, c);
    if (this.releaseAt >= 0) {
      const release = clamp((this.stagedTime - this.releaseAt) / Math.max(0.1, c.releaseDuration ?? 0.55));
      fade = Math.min(fade, 1 - release);
      if (release >= 1) this.effect.visible = false;
    }
    this._present(dt, fade, visualTime, c);
  }

  /* ------------------------------------------------------------------ */
  /* The mechanic                                                        */
  /* ------------------------------------------------------------------ */

  /**
   * Follow the host and commit the next generation's strike when it is due.
   * The host is lost (and the infection withers) when it is replaced by a new
   * life, dies, or leaves `tetherRange` of the circle; a refused strike
   * retries 0.2 s later without advancing the stage.
   */
  _strike(dt, c) {
    if (!this.targetId || !this.scope || this.phase !== AbilityPhase.IMPACT) return;
    const actor = this.scope.getActor(this.targetId);
    const e = actor?.actor;
    if (this.targetGeneration !== null && e?.standGeneration !== this.targetGeneration) {
      this.targetId = null;
      this.releaseAt = this.stagedTime;
      this.failure = 'target was replaced';
      return;
    }
    if (!actor?.ok || !e?.alive || Math.hypot(e.position[0] - this.position.x, e.position[2] - this.position.z) > c.tetherRange) {
      this.targetId = null;
      this.releaseAt = this.stagedTime;
      this.failure = 'target left toxin range';
      return;
    }
    this.effect.position.fromArray(e.position);
    const stages = Math.min(MAX_STAGES, Math.max(1, Math.floor(c.maxStages)));
    if (!(dt > 0) || this.stagedTime < this.nextStage || this.stage >= stages) return;
    const result = this.scope.emit({
      type: 'hit',
      element: 'poison',
      targetIds: [this.targetId],
      position: e.position,
      sourcePosition: this.origin.toArray(),
      hitForce: impactForce(c),
      intensity: 1 + this.stage * 0.4,
      damage: (c.stageDamage ?? 0.25) * (1 + this.stage * 0.4)
    });
    if (result?.ok) {
      this.stageTimes[this.stage] = this.stagedTime;
      this.stage++;
      if (!this.reduceMotion) this.stageEffects.fire(this.stage, e.position, c);
      this._beat(this.stage, c);
      this.nextStage = this.stagedTime + Math.max(0.3, c.stagePeriod);
    } else {
      this.failure = result?.reason ?? 'toxin event refused';
      this.nextStage = this.stagedTime + 0.2;
    }
  }

  /** Camera, flash and light on an accepted stage, growing with the stage. */
  _beat(stage, c) {
    const g = settings.global;
    this.lightBoost += c.lightPunch * stage * g.lightIntensity;
    if (this.reduceMotion) return;
    const weight = 1 + 0.5 * (stage - 1);
    if (c.impactShake > 0) this.ctx.shake?.add?.(c.impactShake * weight, 3, 18);
    const flash = c.impactFlash * weight * g.explosionIntensity;
    if (flash > 0) this.ctx.flash?.trigger?.(getColor(c.coreColor), flash);
  }

  /* ------------------------------------------------------------------ */
  /* Presentation                                                        */
  /* ------------------------------------------------------------------ */

  _bloom(age, c) {
    return this.reduceMotion || age < 0 ? 0 : 1 - clamp(age / Math.max(0.1, c.bloomTime ?? 0.55));
  }

  _present(dt, fade, visualTime, c) {
    const g = settings.global;
    const latest = this.stage > 0 ? this.stageTimes[this.stage - 1] : -1;
    const stagePulse = latest < 0 ? 0 : this._bloom(this.stagedTime - latest, c);
    const retract = fade;
    const bloom = c.bloomStrength ?? 0.3;
    // The infection forms on arrival instead of popping in: `form` grows the
    // hero mesh, coils, spores and haze in over `formTime` with a little
    // overshoot, while `rise` dissolves the membrane up out of the floor.
    const formSpan = Math.max(0.05, c.formTime ?? 0.35);
    const rise = clamp(this.stagedTime / formSpan);
    const form = this.reduceMotion ? 1 : Easing.outBack(rise);

    this.stageEffects.update(this.stageTimes, this.stagedTime, visualTime, fade, c, this.reduceMotion);

    /* ---- the membrane ---- */
    _membrane.time = visualTime;
    _membrane.stage = this.stage;
    _membrane.pulse = stagePulse;
    _membrane.fade = fade;
    _membrane.dissolve = Math.max(clamp(1 - fade) * 0.85, this.reduceMotion ? 0 : 1 - rise);
    _membrane.reduced = this.reduceMotion;
    this.bodyMat.userData.sync(c, _membrane);
    const grow = (0.7 + this.stage * 0.12) * (1 + stagePulse * bloom) * retract * form;
    this.body.scale.set(grow, (1 + this.stage * 0.1) * retract * form, grow);

    /* ---- the pool ---- */
    const poolScale = (c.poolRadius + this.stage * c.poolGrowth) * 1.25 * retract;
    this.floor.scale.set(Math.max(0.001, poolScale), 1, Math.max(0.001, poolScale));
    _pool.time = visualTime;
    _pool.stage = this.stage;
    _pool.fade = fade;
    _pool.spread = this.reduceMotion ? 1 : Easing.outCubic(clamp(this.stagedTime / Math.max(0.05, c.poolSpreadTime)));
    this.poolMat.userData.sync(c, _pool);

    /* ---- vessels ---- */
    _solid.time = visualTime;
    _solid.fade = fade;
    _solid.reduced = this.reduceMotion;
    this.vesselMat.userData.sync(c, _solid);
    this.sporeMat.userData.sync(c, _solid);
    for (let i = 0; i < this.vessels.length; i++) {
      const v = this.vessels[i];
      const a = (i * TAU) / 3 + visualTime * (i % 2 ? -0.25 : 0.25);
      const age = this.stageTimes[i] < 0 ? -1 : this.stagedTime - this.stageTimes[i];
      v.visible = age >= 0;
      v.position.set(Math.cos(a) * 0.72, 0.45 + i * 0.37, Math.sin(a) * 0.72);
      v.rotation.set(0.3 * Math.cos(a), -a, 0.3 * Math.sin(a));
      // Unfolds with a small overshoot, throbs on its own stage.
      const unfold = this.reduceMotion ? clamp(age / 0.25) : Easing.outBack(clamp(age / 0.25));
      v.scale.setScalar((c.vesselScale ?? 1) * unfold * retract * (1 + this._bloom(age, c) * bloom));
    }

    /* ---- coils ---- */
    for (let i = 0; i < this.coils.length; i++) {
      const coil = this.coils[i];
      const age = this.stageTimes[i] < 0 ? -1 : this.stagedTime - this.stageTimes[i];
      const growth = age < 0 ? 0 : this.reduceMotion ? 1 : clamp(age / Math.max(0.1, c.coilGrowTime ?? 0.45));
      coil.visible = age >= 0;
      coil.rotation.y = visualTime * (c.coilTwistSpeed ?? 1) * (0.7 + i * 0.15) * (i % 2 ? -1 : 1);
      // Height and the revealed length both grow; retract pulls it back down.
      coil.scale.set(grow * (c.coilSpread ?? 1), (0.3 + 0.7 * growth) * retract, grow * (c.coilSpread ?? 1));
      _coil.time = visualTime;
      _coil.fade = fade;
      _coil.pulse = this._bloom(age, c);
      _coil.grow = Easing.outCubic(growth);
      this.coilMaterials[i].userData.sync(c, _coil);
    }

    /* ---- spores ---- */
    const sporeSize = c.sporeSize * (0.6 + 0.4 * retract) * form;
    for (let i = 0; i < this.spores.length; i++) {
      const a = i * GOLDEN + visualTime * c.sporeSpeed;
      const r = (c.sporeOrbit + (i % 4) * 0.16) * (0.5 + 0.5 * retract) * form;
      const s = this.spores[i];
      s.position.set(Math.cos(a) * r, 0.2 + ((i * 0.31 + visualTime * c.sporeRise) % 2.3), Math.sin(a) * r);
      s.scale.setScalar(sporeSize * (1 + stagePulse * 0.5));
    }

    /* ---- fumes ---- */
    const hosted = this.effect.visible && fade > 0;
    this.haze.visible = hosted && !this.reduceMotion;
    if (this.haze.visible) {
      _haze.time = visualTime;
      _haze.width = c.hazeWidth * (0.8 + this.stage * 0.15);
      _haze.height = c.hazeHeight;
      _haze.strength = (0.4 + this.stage * 0.2 + stagePulse * 0.4) * fade * Math.min(1, form);
      this.hazeMat.userData.sync(c, _haze);
    }

    /* ---- drips and miasma while the host is held ---- */
    if (hosted && this.phase === AbilityPhase.IMPACT && this.targetId) {
      _at.copy(this.effect.position).setY(1.2 + this.stage * 0.1);
      this._drip(dt, _at, c.dripRate * (0.5 + this.stage * 0.25), 0.45, c);
      if (!this.reduceMotion && this.miasma && dt > 0) {
        const n = this.miasmaEmitter.tick(dt, Math.min(30, c.miasmaRate * (0.6 + this.stage * 0.2) * g.particleCount));
        if (n) {
          _at.copy(this.effect.position).setY(0.15);
          _emit.position = _at;
          _emit.direction = _up;
          _emit.radius = Math.max(0.2, poolScale * 0.8);
          _emit.spread = 0.6;
          _emit.speed = 0.15;
          _emit.speedVariance = 0.5;
          _emit.inherit = null;
          _emit.anchor = null;
          _emit.size = c.miasmaSize;
          _emit.sizeVariance = 0.4;
          _emit.life = c.miasmaLife;
          _emit.lifeVariance = 0.3;
          _emit.spin = 0.4;
          _emit.tint = null;
          _emit.time = frame.uTime.value;
          this.miasma.emit(Math.min(8, n), _emit);
        }
      }
    }
  }

  /** The light rides the vessel, then the host. The aim point never moves. */
  _updateLight(dt, scale) {
    if (this.phase === AbilityPhase.TRAVEL || !this.effect.visible) return super._updateLight(dt, scale);
    this._lightSaved.copy(this.position);
    this.position.copy(this.effect.position);
    try {
      super._updateLight(dt, scale);
    } finally {
      this.position.copy(this._lightSaved);
    }
  }

  /* ------------------------------------------------------------------ */
  /* Lifecycle                                                           */
  /* ------------------------------------------------------------------ */

  onDestroy() {
    this.effect.visible = false;
    this.travelPod.visible = false;
    this.haze.visible = false;
    for (const coil of this.coils) coil.visible = false;
    for (const vessel of this.vessels) vessel.visible = false;
    this.stageEffects.reset();
    this.targetId = null;
    this.scope = null;
  }

  dispose() {
    for (const geometry of this.gs) geometry.dispose();
    for (const material of this.ms) material.dispose();
    super.dispose();
  }
}

/* -------------------------------------------------------------------- */
/* Editor                                                               */
/* -------------------------------------------------------------------- */

/**
 * The production `Editor` helpers when they are handed in, plain lil-gui calls
 * when they are not (the candidate harnesses pass a bare folder).
 */
function editorKit(c, Editor) {
  const named = (controller, label) => (label && typeof controller?.name === 'function' ? controller.name(label) : controller);
  const sub = (folder, title) => (typeof folder.addFolder === 'function' ? folder.addFolder(title) : folder);
  const range = (folder, key, min, max, step, label) =>
    Editor?.range ? Editor.range(folder, c, key, min, max, step, label) : named(folder.add(c, key, min, max, step), label);
  const color = (folder, key, label) => named(folder.addColor(c, key), label);
  const gradient = (folder, prefix, title) => {
    if (Editor?.gradient && typeof folder.addFolder === 'function') return Editor.gradient(folder, c, prefix, title);
    const group = sub(folder, title);
    color(group, `${prefix}A`, 'birth');
    color(group, `${prefix}B`, 'early');
    color(group, `${prefix}C`, 'late');
    color(group, `${prefix}D`, 'death');
    return group;
  };
  const cast = (folder) => (Editor?.castAnimation ? Editor.castAnimation(folder, c) : named(folder.add(c, 'castAnim', CAST_ANIMATIONS), 'cast animation'));
  return { sub, range, color, gradient, cast };
}

export function buildEditor(gui, c, Editor) {
  const { sub, range: R, color, gradient, cast: castAnimation } = editorKit(c, Editor);
  const folder = gui.addFolder('☠  Toxin Evolution');

  const cast = sub(folder, 'The cast');
  R(cast, 'range', 1, 48, 0.1, 'max range');
  R(cast, 'minRange', 0, 20, 0.1, 'min range');
  R(cast, 'speed', 1, 60, 0.1, 'vessel speed (m/s)');
  R(cast, 'lifetime', 2, 12, 0.1, 'infection lives for');
  R(cast, 'fade', 0.1, 5, 0.1, 'withers over');
  R(cast, 'cooldown', 0, 30, 0.1, 'cooldown');
  castAnimation(cast);

  const infection = sub(folder, 'The infection (gameplay)');
  R(infection, 'zoneRadius', 1, 8, 0.1, 'host search radius (m)');
  R(infection, 'stagePeriod', 0.3, 3, 0.1, 'between generations');
  R(infection, 'stageDamage', 0.05, 1, 0.05, 'first strike damage');
  R(infection, 'maxStages', 1, 3, 1, 'generations');
  R(infection, 'tetherRange', 2, 16, 0.1, 'escape distance (m)');
  R(infection, 'hitImpulse', 0, 24, 0.1, 'knockback');
  R(infection, 'hitLift', 0, 20, 0.1, 'knock-up');
  R(infection, 'hitSpin', 0, 8, 0.05, 'tumble');

  const light = sub(folder, 'Light & beat');
  color(light, 'lightColor', 'light');
  R(light, 'lightIntensity', 0, 30, 0.1, 'intensity');
  R(light, 'lightRadius', 1, 40, 0.1, 'radius');
  R(light, 'lightPunch', 0, 20, 0.1, 'punch per stage');
  R(light, 'impactShake', 0, 1, 0.01, 'camera shake');
  R(light, 'impactFlash', 0, 1, 0.01, 'screen flash');

  const palette = sub(folder, 'Palette');
  color(palette, 'toxinColor', 'toxin');
  color(palette, 'coreColor', 'hot core');
  color(palette, 'stainColor', 'floor stain');

  const vessel = sub(folder, '1 · The seed vessel');
  R(vessel, 'travelScale', 0.25, 2, 0.05, 'pod size');
  R(vessel, 'travelHeight', 0, 3, 0.05, 'flight height (m)');
  R(vessel, 'travelSpin', -8, 8, 0.1, 'spin');
  R(vessel, 'travelDensity', 0, 2, 0.05, 'bubbles in flight');
  R(vessel, 'vesselScale', 0.25, 2, 0.05, 'satellite vessel size');
  R(vessel, 'vesselGlow', 0, 6, 0.05, 'vessel glow');

  const membrane = sub(folder, '2 · The membrane');
  R(membrane, 'formTime', 0.05, 1.5, 0.01, 'forms on arrival over');
  R(membrane, 'membraneGlow', 0, 6, 0.05, 'glow');
  R(membrane, 'membraneFresnel', 0, 6, 0.05, 'silhouette density');
  R(membrane, 'veinScale', 0.2, 4, 0.05, 'vein scale');
  R(membrane, 'veinSharp', 1, 16, 0.1, 'vein sharpness');
  R(membrane, 'cystGrowth', 0, 3, 0.05, 'cyst swelling');
  R(membrane, 'bloomStrength', 0, 1, 0.05, 'stage throb');
  R(membrane, 'bloomTime', 0.1, 2, 0.05, 'throb lasts');
  R(membrane, 'releaseDuration', 0.1, 2, 0.05, 'withers on escape over');
  R(membrane, 'softFade', 0.01, 1, 0.01, 'soft fade (m)');

  const coils = sub(folder, '3 · The coils');
  R(coils, 'coilGrowTime', 0.1, 2, 0.05, 'wind up over');
  R(coils, 'coilSpread', 0.25, 2, 0.05, 'radius');
  R(coils, 'coilTwistSpeed', 0, 3, 0.05, 'twist speed');
  R(coils, 'coilTaper', 0, 1, 0.01, 'taper');
  R(coils, 'coilGlow', 0, 6, 0.05, 'glow');

  const crowns = sub(folder, '4 · The crowns');
  R(crowns, 'stageCueScale', 0.25, 3, 0.05, 'size');
  R(crowns, 'stageCueDuration', 0.1, 2, 0.05, 'unfurl and decay over');
  R(crowns, 'stageCueGlow', 0, 2, 0.05, 'glow');

  const pool = sub(folder, '5 · The pool');
  R(pool, 'poolRadius', 0.2, 3, 0.05, 'radius (m)');
  R(pool, 'poolGrowth', 0, 1, 0.01, 'growth per stage (m)');
  R(pool, 'poolSpreadTime', 0.05, 3, 0.05, 'creeps out over');
  R(pool, 'poolCells', 1, 12, 0.1, 'cell density');
  R(pool, 'poolGlow', 0, 6, 0.05, 'seam glow');
  R(pool, 'poolDarken', 0, 1, 0.01, 'floor darkening');

  const spores = sub(folder, '6 · The spores');
  R(spores, 'sporeOrbit', 0.2, 2, 0.05, 'orbit radius (m)');
  R(spores, 'sporeSpeed', -4, 4, 0.05, 'orbit speed');
  R(spores, 'sporeRise', 0, 2, 0.05, 'climb speed');
  R(spores, 'sporeSize', 0.2, 3, 0.05, 'size');
  R(spores, 'sporeGlow', 0, 6, 0.05, 'glow');

  const particles = sub(folder, '7 · Particles');
  const bubbles = sub(particles, 'Spore bubbles');
  R(bubbles, 'particleRate', 0, 100, 1, 'bubbles/second');
  R(bubbles, 'particleSize', 0.02, 0.5, 0.01, 'size');
  const drips = sub(particles, 'Venom drips');
  R(drips, 'dripRate', 0, 60, 1, 'drips/second');
  R(drips, 'dripSize', 0.01, 0.3, 0.005, 'size');
  R(drips, 'dripLife', 0.2, 3, 0.05, 'lifetime');
  R(drips, 'dripGravity', 0, 20, 0.1, 'gravity');
  gradient(drips, 'dripColor', 'Drip colour');
  const miasma = sub(particles, 'Miasma');
  R(miasma, 'miasmaRate', 0, 30, 0.5, 'fumes/second');
  R(miasma, 'miasmaSize', 0.1, 3, 0.05, 'size');
  R(miasma, 'miasmaLife', 0.3, 6, 0.05, 'lifetime');
  R(miasma, 'miasmaOpacity', 0, 1, 0.01, 'opacity');
  R(miasma, 'miasmaRise', -1, 2, 0.01, 'rise speed');
  gradient(miasma, 'miasmaColor', 'Miasma colour');

  const haze = sub(folder, '8 · Distortion');
  R(haze, 'hazeStrength', 0, 3, 0.01, 'strength');
  R(haze, 'hazeScale', 0.1, 6, 0.05, 'noise scale');
  R(haze, 'hazeSpeed', 0, 4, 0.05, 'rise speed');
  R(haze, 'hazeWidth', 0.2, 5, 0.05, 'width (m)');
  R(haze, 'hazeHeight', 0.2, 6, 0.05, 'height (m)');

  return folder;
}
