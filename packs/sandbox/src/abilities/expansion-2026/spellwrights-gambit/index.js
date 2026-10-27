import {
  CylinderGeometry,
  Group,
  InstancedMesh,
  LineSegments,
  Mesh,
  MeshStandardMaterial,
  Object3D,
  Points,
  Vector3,
} from 'three';
import { bindExpansionCombat } from '../StandaloneCombat.js';
import { impactForce } from '../ImpactForce.js';
import { prefersReducedMotion } from '../ExpansionAtmosphere.js';
import {
  createExpansionFX,
  routeExpansionTransparency,
  expansionBurst,
  ParticleShape,
} from '../ExpansionFX.js';
import { Ability as BaseAbility } from '../../Ability.js';
import { RateEmitter } from '../../../particles/ParticleEngine.js';
import { BurstMode } from '../../../effects/BurstSphere.js';
import { DecalType } from '../../../effects/GroundDecals.js';
import { frame } from '../../../core/FrameUniforms.js';
import { LAYER } from '../../../core/Layers.js';
import { CAST_ANIMATIONS, settings } from '../../../config/settings.js';
import { getColor } from '../../../utils/color.js';
import { Easing, saturate } from '../../../utils/math.js';
import {
  createBandGeometry,
  createFocusGemGeometry,
  createMoteGeometry,
  createQuad,
  createRunicBladeGeometry,
  createSigilGeometry,
} from './geometry.js';
import {
  createBandMaterial,
  createBeamMaterial,
  createFootprintMaterial,
  createMoteMaterial,
  createReleaseMaterial,
  createRuneLineMaterial,
  createSigilFieldMaterial,
  createWarpMaterial,
} from './materials.js';
import config from './config.js';

export { config };
export const ID = config.id;

const TAU = Math.PI * 2;
const SHAPES = ['ring', 'line', 'burst'];
/** Bodies one shape may strike; the combat facade caps a query at 32. */
const MAX_TARGETS = 16;
/** Orbiting blades allocated per pool member. */
const MAX_BLADES = 8;
/** GPU motes allocated per pool member. */
const MAX_MOTES = 160;

const clamp = (x) => Math.max(0, Math.min(1, x));
const offset = new Vector3();
const _pos = new Vector3();
const _dir = new Vector3();
const _up = new Vector3(0, 1, 0);
const bladeTransform = new Object3D();
const _emit = {};
/** Reused option bag for expansionBurst (it destructures, never retains). */
const _burst = { count: 0, size: 0, life: 0, speed: 0, spread: 0.8, radius: 0 };
/** Reused impactForce input — the result is still a fresh object per hit. */
const _forceIn = { hitImpulse: 0, hitLift: 0, hitSpin: 0 };

/**
 * SPELLWRIGHT'S GAMBIT — Arcane, zone cast.
 *
 * The caster composes two attack shapes and an armillary carries them to the
 * target. It **descends** out of the air over the aimed point while a sigil
 * is inked round on the floor beneath it, the footprint of the first shape
 * already drawn inside. Then the gambit plays out in two **beats**: the
 * footprint brightens and its chevrons march faster as the beat comes due,
 * the orbiting blades cinch in, motes are drawn toward the core — and the
 * shape **releases**: a column of light drives down from the core, the
 * footprint flares in its own shape (an expanding annulus, a streaming
 * stripe, a spoked disc), the air buckles in a ring, sparks are thrown, the
 * camera knocks. The second footprint takes the first one's place, and the
 * sequence repeats. After the second release the armillary **lifts away**
 * and shrinks, and the sigil is eaten by a noise dissolve from the rim in.
 *
 * ## Layers (each a folder in the editor)
 *
 *   1. **the sigil** (`createSigilFieldMaterial` + `createRuneLineMaterial`)
 *      — the ink disc and the authored star-polygon linework, written on
 *      stroke by stroke from the geometry's own `aDraw` order.
 *   2. **the footprints** (`createFootprintMaterial`) — the exact
 *      disc-clipped stripe / annulus / disc the next beat strikes. They *are*
 *      the hit test, drawn: `width` is the same fraction of the reach the
 *      `_strike` test uses. Brightens and marches as the beat approaches.
 *   3. **the armillary** — a faceted focus gem (lit `MeshStandardMaterial`,
 *      on the world layer so it shadows), three crenellated armillary bands
 *      and up to eight ridged runic blades (`createBandMaterial`), plus two
 *      floor bands round the sigil.
 *   4. **the release** (`createReleaseMaterial`, `createBeamMaterial`) — one
 *      pooled flare record per beat, so the second beat never cuts the first
 *      one short, and the column of light the core drives into the floor.
 *   5. **particles** — streaks rising off the sigil while a beat charges and
 *      thrown on every release (the shared expansion system), and a GPU mote
 *      cloud placed entirely in the vertex stage.
 *   6. **the strike** — STORM shell, SHOCKWAVE / ARC decals in the struck
 *      shape, flash, camera knock and light punch, all scaled by the globals.
 *   7. **the warp** (`createWarpMaterial` on `LAYER.DISTORTION`) — a pressure
 *      ring per release and a slow swirl while charging.
 *
 * ## Hits (`handlesOwnHits`)
 *
 * Unchanged by the craft pass: each beat queries enemies inside `zoneRadius`
 * through the expansion combat binding (or the dummy field when no binding is
 * installed) and keeps only those inside the selected shape — a ring keeps
 * the outer band `ringWidth` deep, a line keeps a stripe `lineWidth` either
 * side of the aimed direction, a burst keeps the whole disc.
 *
 * ## The editor rule
 *
 * A cast keeps only its beat count, the impact time of each release and
 * integrated clocks. Every dimension, colour, count and timing is read from
 * `settings.spellwrightsGambit` every frame, so changing the second shape
 * while the first is charging re-draws the next footprint at once.
 */
export class Ability extends BaseAbility {
  constructor(ctx) {
    super(ID, ctx);
  }

  get handlesOwnHits() {
    return true;
  }

  get instanceCount() {
    return MAX_BLADES + this._beats;
  }

  /* ------------------------------------------------------------------ */
  /* Timing — the beats are gameplay; these are unchanged                 */
  /* ------------------------------------------------------------------ */

  get impactDuration() {
    return Math.max(1.5, this.config.beatInterval * 2 + 0.5);
  }

  get fadeDuration() {
    return 0.7;
  }

  /* ------------------------------------------------------------------ */
  /* Construction                                                        */
  /* ------------------------------------------------------------------ */

  createShaders() {
    /** Everything GPU-side this instance owns; `dispose` frees exactly these. */
    this.resources = [];
    const own = (x) => (this.resources.push(x), x);
    this.root = new Group();
    this.group.add(this.root);

    const quad = own(createQuad());

    // 1 · the sigil
    this.ink = own(createSigilFieldMaterial());
    this.field = new Mesh(quad, this.ink);
    this.field.rotation.x = -Math.PI / 2;
    this.field.position.y = 0.035;
    this.field.renderOrder = 2;
    this.root.add(this.field);
    this.runeMat = own(createRuneLineMaterial());
    this.runes = new LineSegments(own(createSigilGeometry()), this.runeMat);
    this.runes.renderOrder = 3;
    this.runes.frustumCulled = false;
    this.root.add(this.runes);

    // 3 · the floor bands round the sigil (share the armillary material)
    this.glow = own(createBandMaterial());
    const floorBand = own(createBandGeometry({ width: 0.035, thickness: 0.02, teeth: 36 }));
    this.rings = [];
    for (let i = 0; i < 2; i++) {
      const r = new Mesh(floorBand, this.glow);
      r.rotation.x = Math.PI / 2;
      r.position.y = 0.08 + i * 0.03;
      r.renderOrder = 4;
      this.root.add(r);
      this.rings.push(r);
    }

    // 2 · the footprints of the next beat
    this.lineFootprint = own(createFootprintMaterial('line'));
    this.ringFootprint = own(createFootprintMaterial('ring'));
    this.shapeLine = new Mesh(quad, this.lineFootprint);
    this.shapeLine.rotation.x = -Math.PI / 2;
    this.shapeLine.position.y = 0.06;
    this.root.add(this.shapeLine);
    // A burst strikes the whole disc: its footprint is a ring of zero depth
    // inward, i.e. the annulus shader with `width` 1.
    this.burstFootprint = own(createFootprintMaterial('ring'));
    this.shapeBurst = new Mesh(quad, this.burstFootprint);
    this.shapeBurst.rotation.x = -Math.PI / 2;
    this.shapeBurst.position.y = 0.045;
    this.root.add(this.shapeBurst);
    this.shapeRing = new Mesh(quad, this.ringFootprint);
    this.shapeRing.rotation.x = -Math.PI / 2;
    this.shapeRing.position.y = 0.12;
    this.root.add(this.shapeRing);

    // 3 · the armillary
    this.coreMat = own(new MeshStandardMaterial({
      color: 0xc2bbff, emissive: 0x5743ab, emissiveIntensity: 1.1, metalness: 0.65, roughness: 0.28, flatShading: true,
    }));
    this.hero = new Group();
    this.hero.position.y = 1.15;
    this.core = new Mesh(own(createFocusGemGeometry()), this.coreMat);
    this.core.castShadow = true;
    this.hero.add(this.core);
    this.heroRings = [];
    const heroBand = own(createBandGeometry({ width: 0.05, thickness: 0.028, teeth: 16, segments: 128 }));
    for (let i = 0; i < 3; i++) {
      const ring = new Mesh(heroBand, this.glow);
      ring.scale.setScalar(0.52);
      this.hero.add(ring);
      this.heroRings.push(ring);
    }
    this.blades = new InstancedMesh(own(createRunicBladeGeometry()), this.coreMat, MAX_BLADES);
    this.blades.frustumCulled = false;
    this.blades.castShadow = true;
    this.hero.add(this.blades);
    this.root.add(this.hero);

    // 4 · the beam and the release flares. Each beat owns its own record so
    // overlapping releases stay legible even when the editor changes the next
    // shape mid-cast.
    this.beamMat = own(createBeamMaterial());
    this.beam = new Mesh(own(new CylinderGeometry(1, 0.6, 1, 32, 6, true)), this.beamMat);
    this.beam.visible = false;
    this.beam.renderOrder = 6;
    this.root.add(this.beam);
    this.releases = [];
    for (let i = 0; i < 2; i++) {
      const material = own(createReleaseMaterial());
      const group = new Group();
      const ring = new Mesh(quad, material);
      ring.rotation.x = -Math.PI / 2;
      const line = new Mesh(quad, material);
      line.rotation.x = -Math.PI / 2;
      const burst = new Mesh(quad, material);
      burst.rotation.x = -Math.PI / 2;
      group.position.y = 0.15 + i * 0.01;
      group.add(ring, line, burst);
      group.renderOrder = 5;
      this.root.add(group);
      this.releases.push({ group, ring, line, burst, material, kind: null, at: 0 });
    }

    // 5 · GPU motes
    this.moteMat = own(createMoteMaterial());
    this.motes = new Points(own(createMoteGeometry(MAX_MOTES)), this.moteMat);
    this.motes.frustumCulled = false;
    this.motes.renderOrder = 7;
    this.root.add(this.motes);

    // 7 · the warp (opaque proxy — see createWarpMaterial)
    this.warpMat = own(createWarpMaterial());
    this.warp = new Mesh(quad, this.warpMat);
    this.warp.rotation.x = -Math.PI / 2;
    this.warp.position.y = 0.2;
    this.warp.visible = false;
    this.root.add(this.warp);

    this._found = [];
    this._force = { impulse: 0, lift: 0, spin: 0 };
    this._beats = 0;
    this._target = new Vector3();
    this._clock = 0;
    this._calm = false;
    this._beamAt = -1;
    this._warpAt = -1;
    // Reused sync payloads — the materials read these, nothing is allocated per frame.
    this._fieldState = { clock: 0, draw: 0, charge: 0, beats: 0, fade: 1, dissolve: 0 };
    this._runeState = { draw: 0, wave: -1, pulse: 0, fade: 1, dissolve: 0 };
    this._footState = { width: 0, fade: 1, charge: 0, clock: 0 };
    this._bandState = { clock: 0, fade: 1, flare: 0 };
    this._releaseState = { kind: 'ring', progress: 0, width: 0, fade: 1, clock: 0 };
    this._beamState = { power: 0, clock: 0 };
    this._moteState = { clock: 0, radius: 1, charge: 0, burst: 0, fade: 1, capacity: MAX_MOTES };
    this._warpState = { wave: 0, strength: 0, swirl: 0, clock: 0 };

    routeExpansionTransparency(this.group);
    this.warp.layers.set(LAYER.DISTORTION);
    this._disposed = false;
  }

  createParticles() {
    this.fx = createExpansionFX(this.ctx, 'arcane', {
      shape: ParticleShape.STREAK,
      colors: ['#ffffff', '#c9cbff', '#7c8cff', '#372275'],
    });
    this.ambient = new RateEmitter();
  }

  /* ------------------------------------------------------------------ */
  /* Phases                                                              */
  /* ------------------------------------------------------------------ */

  onSpawn() {
    this._scope = bindExpansionCombat(this.ctx, 'matrix-expansion/spellwrights-gambit');
    this.failure = null;
    this._target.copy(this.origin).addScaledVector(this.direction, this.length);
    this._beats = 0;
    this._clock = 0;
    this._beamAt = -1;
    this._warpAt = -1;
    this._calm = prefersReducedMotion();
    this.ambient.reset();
    for (const release of this.releases) {
      release.kind = null;
      release.at = 0;
      release.group.visible = false;
    }
    this.root.visible = true;
    this._sync(0);
  }

  onTravel(dt) {
    this._sync(dt);
  }

  onImpact() {
    this._sync(0);
  }

  onFade(dt) {
    if (this.phase === 'impact') {
      const interval = Math.max(0.1, this.config.beatInterval);
      while (this._beats < 2 && this.impactTime >= interval * (this._beats + 1)) {
        const kind = this._beats === 0 ? this.config.firstShape : this.config.secondShape;
        this._strike(kind);
        this.releases[this._beats].kind = kind;
        this.releases[this._beats].at = this._elapsed();
        this._beats++;
        this._release(kind);
      }
      this._ambientFx(dt);
    }
    this._sync(dt);
  }

  /**
   * Seconds since landing that keep running through the fade. The base
   * class stops `impactTime` when the fade begins, so anything timed after
   * a beat (flares, beam, warp) is measured on this clock instead and runs
   * out cleanly rather than freezing mid-decay and popping in onDestroy.
   */
  _elapsed() {
    return this.impactTime + (this.phase === 'fade' ? this.fadeTime : 0);
  }

  /* ------------------------------------------------------------------ */
  /* The strike — gameplay, unchanged                                     */
  /* ------------------------------------------------------------------ */

  _strike(kind) {
    const c = this.config;
    _burst.count = c.strikeCount;
    _burst.size = c.strikeSize;
    _burst.life = c.strikeLife;
    _burst.speed = c.strikeSpeed;
    _burst.radius = c.zoneRadius * 0.4;
    expansionBurst(this.fx, this._target, _burst);
    if (!SHAPES.includes(kind)) return;
    if (this._scope) {
      const source = [this._target.x, 0, this._target.z];
      const targets = this._scope.queryActors({ position: source, radius: c.zoneRadius, relation: 'enemy' });
      if (!targets.ok) { this.failure = targets.reason; return; }
      _forceIn.hitImpulse = c.impulse;
      _forceIn.hitLift = c.lift;
      _forceIn.hitSpin = c.spin;
      let count = 0;
      for (const actor of targets.actors) {
        offset.set(actor.position[0] - source[0], 0, actor.position[2] - source[2]);
        const distance = offset.length(), lateral = offset.dot(this.side);
        if (distance > c.zoneRadius ||
            (kind === 'ring' && distance < Math.max(0, c.zoneRadius - c.ringWidth)) ||
            (kind === 'line' && Math.abs(lateral) > c.lineWidth)) continue;
        const sent = this._scope.emit({
          type: 'hit', element: 'arcane', targetIds: [actor.id],
          position: actor.position, sourcePosition: source, damage: 1,
          hitForce: impactForce(_forceIn, settings.global.explosionIntensity),
          tags: ['spellwrights-gambit', kind],
        });
        if (!sent.ok) this.failure = sent.reason;
        else if (++count >= MAX_TARGETS) break;
      }
      return;
    }
    const field = this.ctx.dummies;
    if (!field?.findTargets) return;
    const r = c.zoneRadius,
      found = field.findTargets(this._target.x, this._target.z, r, this._found),
      power = settings.global.explosionIntensity;
    this._force.impulse = c.impulse * power;
    this._force.lift = c.lift * power;
    this._force.spin = c.spin;
    let count = 0;
    for (const d of found) {
      offset.set(d.position.x - this._target.x, 0, d.position.z - this._target.z);
      const distance = offset.length();
      if (distance > r) continue;
      const lateral = offset.dot(this.side);
      if (kind === 'ring' && distance < Math.max(0, r - c.ringWidth)) continue;
      if (kind === 'line' && Math.abs(lateral) > c.lineWidth) continue;
      if (distance < 1e-5) offset.copy(this.direction);
      else offset.multiplyScalar(1 / distance);
      if (d.kill(offset.x, offset.z, this._force) && ++count >= MAX_TARGETS) break;
    }
  }

  /* ------------------------------------------------------------------ */
  /* The release — presentation of a beat                                 */
  /* ------------------------------------------------------------------ */

  /** Beam, shell, decals, flash, knock and light on the beat. */
  _release(kind) {
    const c = this.config;
    const g = settings.global;
    const power = g.explosionIntensity;
    const r = c.zoneRadius;
    this._beamAt = this._elapsed();
    this._warpAt = this._elapsed();
    this.lightBoost = c.beatLight * power;

    _pos.copy(this._target).setY(0.05);
    this.ctx.bursts?.spawn?.(BurstMode.STORM, _pos, {
      radius: r * 0.12,
      endRadius: r * c.burstReach * power,
      life: c.burstLife,
      intensity: c.burstIntensity,
      opacity: c.burstOpacity * g.opacity,
      fresnel: c.burstFresnel,
      squash: c.burstSquash,
      colorA: getColor(c.colorBurstA),
      colorB: getColor(c.colorBurstB),
      colorC: getColor(c.colorBurstC),
    });
    // The decal is written in the shape that struck: a shockwave for the
    // annulus and the disc, an arc scar for the stripe.
    this.ctx.decals?.spawn?.(kind === 'line' ? DecalType.ARC : DecalType.SHOCKWAVE, _pos, {
      radius: kind === 'burst' ? r * 0.8 : r,
      life: c.decalLife,
      intensity: c.decalIntensity,
      width: kind === 'ring' ? Math.max(0.02, c.ringWidth / Math.max(0.01, r)) * 0.5 : c.decalWidth,
      colorA: getColor(c.edgeColor),
      colorB: getColor(c.inkColor),
    });

    if (c.impactShake > 0) this.ctx.shake?.add?.(c.impactShake * power, c.shakeDecay, c.shakeFrequency);
    if (c.impactFlash > 0) this.ctx.flash?.trigger?.(getColor(c.edgeColor), c.impactFlash * power);
  }

  /** Streaks rising off the sigil while a beat charges. */
  _ambientFx(dt) {
    const c = this.config;
    const g = settings.global;
    if (!this.fx?.emit || this._beats >= 2 || dt <= 0) return;
    const n = this.ambient.tick(dt, Math.max(0, c.ambientRate) * g.particleCount);
    if (n <= 0) return;
    const angle = this._clock * 2.3;
    _pos.set(
      this._target.x + Math.cos(angle) * c.zoneRadius * 0.62,
      0.1,
      this._target.z + Math.sin(angle) * c.zoneRadius * 0.62,
    );
    _emit.position = _pos;
    _emit.radius = c.zoneRadius * 0.3;
    _emit.direction = _up;
    _emit.speed = c.ambientSpeed * g.particleSpeed;
    _emit.speedVariance = 0.4;
    _emit.spread = 0.35;
    _emit.size = c.ambientSize * g.particleSize;
    _emit.sizeVariance = 0.4;
    _emit.life = c.ambientLife * g.particleLifetime;
    _emit.lifeVariance = 0.35;
    _emit.spin = 1;
    _emit.time = frame.uTime.value;
    this.fx.emit(Math.min(8, n), _emit);
  }

  /** Mirror the particle look from settings every frame (no-op on stubs). */
  _syncParticles() {
    const c = this.config;
    const g = settings.global;
    const fx = this.fx;
    if (!fx?.uniforms) return;
    fx.setGradient?.(getColor(c.colorSparkA), getColor(c.colorSparkB), getColor(c.colorSparkC), getColor(c.colorSparkD));
    const u = fx.uniforms;
    if (u.uGlow) u.uGlow.value = c.sparkGlow * g.glow;
    if (u.uOpacity) u.uOpacity.value = g.opacity;
    if (u.uTurbulence) u.uTurbulence.value = 0.4 * g.turbulence;
    if (u.uSizeScale) u.uSizeScale.value = g.particleSize;
    if (u.uSpeedScale) u.uSpeedScale.value = g.particleSpeed;
    if (u.uLifeScale) u.uLifeScale.value = g.particleLifetime;
  }

  /* ------------------------------------------------------------------ */
  /* Per-frame presentation                                              */
  /* ------------------------------------------------------------------ */

  _sync(dt) {
    const c = this.config,
      g = settings.global,
      r = c.zoneRadius;
    // Ambient clock: frozen under reduced motion, scaled by the global speed.
    if (!this._calm) this._clock += dt * g.animationSpeed;
    const clock = this._clock;
    const fadeT = this.phase === 'fade' ? clamp(this.fadeTime / this.fadeDuration) : 0;
    const fade = 1 - fadeT;
    const interval = Math.max(0.1, c.beatInterval);
    // How close the next beat is, 0 → 1. Zero while flying and after both.
    const charge = this.phase === 'impact' && this._beats < 2
      ? clamp((this.impactTime - interval * this._beats) / interval)
      : 0;
    const lastRelease = this._beats ? this.releases[this._beats - 1] : null;
    const now = this._elapsed();
    const sinceBeat = lastRelease?.kind ? Math.max(0, now - lastRelease.at) : Infinity;
    const flare = Number.isFinite(sinceBeat) ? Math.exp(-sinceBeat * 7) : 0;
    const dissolve = clamp(fadeT / Math.max(0.05, c.dissolveTime));

    this.root.position.copy(this._target);
    this.position.copy(this._target);

    // 1 · the sigil, inked round on arrival
    const draw = clamp(this.age / Math.max(0.05, c.drawTime));
    this.field.scale.set(r * 2, r * 2, 1);
    const fs = this._fieldState;
    fs.clock = clock * c.scriptSpeed;
    fs.draw = draw;
    fs.charge = charge;
    fs.beats = this._beats / 2;
    fs.fade = fade;
    fs.dissolve = dissolve;
    this.ink.userData.sync(fs);
    const rs = this._runeState;
    rs.draw = Easing.outCubic(draw);
    // The release pulse runs out through the linework's bands, inner to outer.
    rs.wave = Number.isFinite(sinceBeat) ? sinceBeat * 2.4 : -1;
    rs.pulse = flare * 1.5;
    rs.fade = fade;
    rs.dissolve = dissolve;
    this.runeMat.userData.sync(rs);
    this.runes.scale.setScalar(r);
    this.runes.rotation.y = clock * c.sigilSpin;

    // 3 · the armillary: descends on arrival, lifts away on the exit
    const speed = c.orbitSpeed ?? 1;
    const arrive = clamp(this.age / Math.max(0.05, c.descendTime));
    const heroScale = (c.coreSize ?? 1) * clamp(this.u * 4) * fade;
    this.hero.scale.setScalar(Math.max(0.001, heroScale));
    this.hero.position.y = c.heroHeight + c.heroDrop * (1 - Easing.outCubic(arrive)) + c.heroRise * Easing.inCubic(fadeT);
    this.coreMat.color.copy(getColor(c.coreColor ?? '#c2bbff'));
    this.coreMat.emissive.copy(getColor(c.coreEmissive));
    this.coreMat.metalness = c.coreMetalness;
    this.coreMat.roughness = c.coreRoughness;
    this.coreMat.emissiveIntensity = (c.coreGlow + flare * c.coreFlare + charge * 0.4) * g.glow;
    this.core.rotation.set(clock * speed * 0.4, clock * speed, clock * speed * 0.2);
    for (let i = 0; i < this.heroRings.length; i++) {
      const ring = this.heroRings[i];
      ring.rotation.set(i * Math.PI / 3 + clock * speed * 0.3, clock * speed * (i % 2 ? -0.7 : 0.7), i * Math.PI / 4);
      ring.scale.setScalar(0.52 * (1 + this._beats * 0.12 + flare * 0.15));
    }
    const bladeCount = Math.max(0, Math.min(MAX_BLADES, Math.round(c.bladeCount)));
    this.blades.count = bladeCount;
    const orbit = c.bladeRadius + this._beats * c.bladeSpread - charge * charge * c.bladeCinch + flare * 0.25;
    for (let i = 0; i < bladeCount; i++) {
      const angle = (i * TAU) / Math.max(1, bladeCount) + clock * speed;
      bladeTransform.position.set(Math.cos(angle) * orbit, Math.sin(angle * 2) * c.bladeBob, Math.sin(angle) * orbit);
      bladeTransform.rotation.set(Math.sin(angle) * 0.3, angle, clock * speed + i);
      bladeTransform.scale.setScalar(c.bladeSize);
      bladeTransform.updateMatrix();
      this.blades.setMatrixAt(i, bladeTransform.matrix);
    }
    this.blades.instanceMatrix.needsUpdate = true;
    for (let i = 0; i < 2; i++) {
      this.rings[i].scale.setScalar(r * (i ? 0.7 : 0.92));
      this.rings[i].rotation.z = clock * (i ? -0.8 : 0.4);
    }
    const bs = this._bandState;
    bs.clock = clock * speed;
    bs.fade = fade * c.ringGlow;
    bs.flare = flare + charge * 0.25;
    this.glow.userData.sync(bs);

    // 2 · the next footprint — the hit test, drawn
    const next = this._beats === 0 ? c.firstShape : c.secondShape;
    this.shapeRing.visible = this._beats < 2 && next === 'ring';
    this.shapeLine.visible = this._beats < 2 && next === 'line';
    this.shapeBurst.visible = this._beats < 2 && next === 'burst';
    this.shapeRing.scale.set(r * 2, r * 2, 1);
    this.shapeLine.scale.set(r * 2, r * 2, 1);
    this.shapeBurst.scale.set(r * 2, r * 2, 1);
    // Local +Y of the floor quad onto the aimed direction (so the stripe
    // lies exactly where `lateral <= lineWidth` is tested).
    this.shapeLine.rotation.z = Math.atan2(this.direction.x, this.direction.z);
    const ft = this._footState;
    ft.fade = fade * Easing.outCubic(draw);
    ft.charge = charge;
    ft.clock = clock;
    ft.width = clamp(c.lineWidth / Math.max(0.01, r));
    this.lineFootprint.userData.sync(ft);
    ft.width = clamp(c.ringWidth / Math.max(0.01, r));
    this.ringFootprint.userData.sync(ft);
    ft.width = 1;
    this.burstFootprint.userData.sync(ft);

    // 4 · the release flares and the beam
    const life = Math.max(0.05, c.releaseLife);
    for (const release of this.releases) {
      const progress = (now - release.at) / life;
      release.group.visible = !!release.kind && progress >= 0 && progress < 1;
      if (!release.group.visible) continue;
      const t = clamp(progress);
      release.ring.visible = release.kind === 'ring';
      release.line.visible = release.kind === 'line';
      release.burst.visible = release.kind === 'burst';
      release.ring.scale.set(r * 2 * (1 + t * c.releaseGrow), r * 2 * (1 + t * c.releaseGrow), 1);
      release.line.scale.set(c.lineWidth * 2 * (1 + t * 0.35), r * 2, 1);
      release.line.rotation.z = Math.atan2(this.direction.x, this.direction.z);
      release.burst.scale.set(r * 2 * (0.25 + 0.75 * t), r * 2 * (0.25 + 0.75 * t), 1);
      const st = this._releaseState;
      st.kind = release.kind;
      st.progress = Easing.outCubic(t);
      st.width = clamp(c.ringWidth / Math.max(0.01, r * (1 + t * c.releaseGrow)));
      st.fade = fade;
      st.clock = clock;
      release.material.userData.sync(st);
    }
    const beamT = this._beamAt >= 0 ? (now - this._beamAt) / Math.max(0.05, c.beamLife) : 1;
    const beamPower = beamT < 1 ? Math.pow(1 - clamp(beamT), 2) * fade : 0;
    this.beam.visible = beamPower > 0.01;
    if (this.beam.visible) {
      const h = Math.max(0.1, Math.min(c.beamHeight, this.hero.position.y));
      this.beam.scale.set(c.beamWidth * (1 + beamT), h, c.beamWidth * (1 + beamT));
      this.beam.position.y = h * 0.5;
      this._beamState.power = beamPower;
      this._beamState.clock = clock;
      this.beamMat.userData.sync(this._beamState);
    }

    // 5 · motes and the particle look
    const ms = this._moteState;
    ms.clock = clock;
    ms.radius = r * 0.9;
    ms.charge = charge;
    ms.burst = flare;
    ms.fade = fade * Easing.outCubic(draw);
    this.moteMat.userData.sync(ms);
    this._syncParticles();

    // 7 · the warp: a pressure ring per release, a slow swirl while charging
    const warpT = this._warpAt >= 0 ? (now - this._warpAt) / Math.max(0.05, c.warpLife) : 1;
    const ws = this._warpState;
    ws.wave = Easing.outCubic(clamp(warpT));
    ws.strength = ((warpT < 1 ? 1 - clamp(warpT) : 0) + charge * c.warpSwirl) * fade;
    ws.swirl = charge * c.warpSwirl;
    ws.clock = clock;
    this.warp.visible = !this._calm && ws.strength * c.warpStrength * g.distortion > 0.002;
    if (this.warp.visible) {
      this.warp.scale.set(r * 2.2, r * 2.2, 1);
      this.warpMat.userData.sync(ws);
    }
  }

  /* ------------------------------------------------------------------ */
  /* Pooling                                                             */
  /* ------------------------------------------------------------------ */

  onDestroy() {
    this._scope = null;
    this.root.visible = false;
    this.beam.visible = false;
    this.warp.visible = false;
    for (const release of this.releases) release.group.visible = false;
    this._beats = 0;
    this._beamAt = -1;
    this._warpAt = -1;
  }

  dispose() {
    if (this._disposed) return;
    this._disposed = true;
    for (const r of this.resources) r.dispose();
    super.dispose();
  }
}

/* ---------------------------------------------------------------------- */
/* Editor                                                                  */
/* ---------------------------------------------------------------------- */

/**
 * Editor helpers that degrade gracefully: the production editor passes the
 * real `Editor` and lil-gui, the dev harness a minimal shim with neither
 * sub-folders nor gradients.
 */
function editorKit(Editor) {
  const R = Editor?.range ?? ((f, c, k, min, max, step, label) => f.add(c, k, min, max, step).name?.(label ?? k));
  const sub = (parent, title) => (typeof parent.addFolder === 'function' ? parent.addFolder(title) : parent);
  const color = (f, c, k, label) => f.addColor(c, k).name?.(label ?? k);
  const gradient = (f, c, prefix, title) => {
    if (Editor?.gradient && typeof f.addFolder === 'function') return Editor.gradient(f, c, prefix, title);
    for (const s of ['A', 'B', 'C', 'D']) color(f, c, prefix + s, `${title} ${s}`);
    return f;
  };
  const castAnim = (f, c) => (Editor?.castAnimation ? Editor.castAnimation(f, c) : f.add(c, 'castAnim', CAST_ANIMATIONS));
  return { R, sub, color, gradient, castAnim };
}

export function buildEditor(gui, c, Editor) {
  const { R, sub, color, gradient, castAnim } = editorKit(Editor);
  const folder = gui.addFolder("✷  Spellwright's Gambit");

  const cast = sub(folder, 'The cast');
  R(cast, c, 'range', 2, 40, 0.1, 'max range');
  R(cast, c, 'minRange', 0, 12, 0.1, 'min range');
  R(cast, c, 'speed', 4, 80, 0.5, 'armillary flies at (m/s)');
  R(cast, c, 'lifetime', 0.2, 8, 0.05, 'nominal lifetime (s)');
  R(cast, c, 'cooldown', 0, 15, 0.05, 'cooldown');
  castAnim(cast, c);

  const gambit = sub(folder, 'The gambit');
  gambit.add(c, 'firstShape', SHAPES).name?.('first shape');
  gambit.add(c, 'secondShape', SHAPES).name?.('second shape');
  R(gambit, c, 'beatInterval', 0.2, 1.5, 0.05, 'between shapes (s)');
  R(gambit, c, 'zoneRadius', 1, 8, 0.1, 'reach (m)');
  R(gambit, c, 'lineWidth', 0.1, 3, 0.05, 'line half-width (m)');
  R(gambit, c, 'ringWidth', 0.1, 3, 0.05, 'ring depth (m)');
  R(gambit, c, 'impulse', 0, 30, 0.1, 'knockback (m/s)');
  R(gambit, c, 'lift', 0, 15, 0.05, 'lift (m/s)');
  R(gambit, c, 'spin', 0, 8, 0.05, 'tumble');

  const light = sub(folder, 'Light');
  color(light, c, 'lightColor', 'colour');
  R(light, c, 'lightIntensity', 0, 30, 0.1, 'intensity');
  R(light, c, 'lightRadius', 1, 40, 0.1, 'radius');
  R(light, c, 'beatLight', 0, 20, 0.1, 'punch per release');

  const sigil = sub(folder, '1 · The sigil');
  R(sigil, c, 'fieldGlow', 0, 6, 0.05, 'ink glow');
  R(sigil, c, 'inkBleed', 0, 4, 0.05, 'brush wander');
  R(sigil, c, 'inkWash', 0, 1, 0.01, 'ink wash');
  R(sigil, c, 'etchGlow', 0, 6, 0.05, 'linework glow');
  R(sigil, c, 'sigilSpin', -2, 2, 0.01, 'linework turns (rad/s)');
  R(sigil, c, 'drawTime', 0.05, 2, 0.01, 'inked round over (s)');
  R(sigil, c, 'scriptSpeed', 0, 4, 0.05, 'scan speed');
  R(sigil, c, 'dissolveTime', 0.05, 1, 0.01, 'dissolves over (× fade)');
  color(sigil, c, 'inkColor', 'ink');
  color(sigil, c, 'edgeColor', 'light');
  color(sigil, c, 'etchColor', 'etching');

  const foot = sub(folder, '2 · Footprints');
  R(foot, c, 'footprintGlow', 0, 6, 0.05, 'glow');
  R(foot, c, 'footprintOpacity', 0, 2, 0.01, 'opacity');

  const hero = sub(folder, '3 · The armillary');
  R(hero, c, 'coreSize', 0.3, 2, 0.05, 'armillary size');
  R(hero, c, 'orbitSpeed', 0, 4, 0.05, 'orbit speed');
  R(hero, c, 'heroHeight', 0.3, 4, 0.01, 'hovers at (m)');
  R(hero, c, 'heroDrop', 0, 8, 0.05, 'descends from (m above)');
  R(hero, c, 'descendTime', 0.05, 2, 0.01, 'descent (s)');
  R(hero, c, 'heroRise', 0, 6, 0.05, 'lifts away (m)');
  R(hero, c, 'coreGlow', 0, 6, 0.05, 'core glow');
  R(hero, c, 'coreFlare', 0, 6, 0.05, 'core flare on release');
  R(hero, c, 'coreMetalness', 0, 1, 0.01, 'core metalness');
  R(hero, c, 'coreRoughness', 0, 1, 0.01, 'core roughness');
  color(hero, c, 'coreColor', 'armillary core');
  color(hero, c, 'coreEmissive', 'core emissive');
  R(hero, c, 'bandGlow', 0, 6, 0.05, 'band glow');
  R(hero, c, 'bandRunes', 1, 64, 1, 'band rune cells');
  R(hero, c, 'ringGlow', 0, 3, 0.01, 'floor band glow');
  color(hero, c, 'bandColor', 'bands');
  R(hero, c, 'bladeCount', 0, MAX_BLADES, 1, 'blades');
  R(hero, c, 'bladeSize', 0.1, 2, 0.01, 'blade size');
  R(hero, c, 'bladeRadius', 0.2, 2, 0.01, 'blade orbit (m)');
  R(hero, c, 'bladeSpread', 0, 0.6, 0.01, 'widens per beat (m)');
  R(hero, c, 'bladeCinch', 0, 0.6, 0.01, 'cinches before a beat (m)');
  R(hero, c, 'bladeBob', 0, 0.6, 0.01, 'blade bob (m)');

  const rel = sub(folder, '4 · The release');
  R(rel, c, 'releaseLife', 0.1, 2, 0.01, 'flare lasts (s)');
  R(rel, c, 'releaseGrow', 0, 1, 0.01, 'ring flare grows');
  R(rel, c, 'releaseGlow', 0, 8, 0.05, 'flare glow');
  R(rel, c, 'releaseOpacity', 0, 1, 0.01, 'flare opacity');
  R(rel, c, 'beamHeight', 0.5, 10, 0.05, 'beam height (m)');
  R(rel, c, 'beamWidth', 0.05, 2, 0.01, 'beam radius (m)');
  R(rel, c, 'beamLife', 0.05, 1.5, 0.01, 'beam fades over (s)');
  R(rel, c, 'beamGlow', 0, 10, 0.05, 'beam glow');
  color(rel, c, 'beamColor', 'beam hot');

  const fx = sub(folder, '5 · Particles');
  R(fx, c, 'strikeCount', 0, 128, 1, 'streaks per release');
  R(fx, c, 'strikeSize', 0.01, 0.4, 0.005, 'streak size');
  R(fx, c, 'strikeLife', 0.1, 3, 0.05, 'streak lifetime');
  R(fx, c, 'strikeSpeed', 0, 12, 0.1, 'streak speed');
  R(fx, c, 'ambientRate', 0, 60, 1, 'rising streaks/second');
  R(fx, c, 'ambientSize', 0.01, 0.3, 0.005, 'rising size');
  R(fx, c, 'ambientLife', 0.1, 3, 0.05, 'rising lifetime');
  R(fx, c, 'ambientSpeed', 0, 6, 0.05, 'rising speed');
  R(fx, c, 'sparkGlow', 0, 6, 0.05, 'streak glow');
  gradient(fx, c, 'colorSpark', 'streak gradient');
  R(fx, c, 'moteCount', 0, MAX_MOTES, 1, 'motes');
  R(fx, c, 'moteSize', 0.005, 0.3, 0.005, 'mote size');
  R(fx, c, 'moteRise', 0, 5, 0.05, 'mote climb (m)');
  R(fx, c, 'moteSwirl', -4, 4, 0.05, 'mote swirl');
  R(fx, c, 'moteGlow', 0, 8, 0.05, 'mote glow');
  color(fx, c, 'moteColor', 'mote core');

  const strike = sub(folder, '6 · The strike');
  R(strike, c, 'burstReach', 0, 2, 0.01, 'shell grows to (× reach)');
  R(strike, c, 'burstIntensity', 0, 3, 0.01, 'shell brightness');
  R(strike, c, 'burstLife', 0.05, 2, 0.01, 'shell lasts (s)');
  R(strike, c, 'burstOpacity', 0, 1, 0.01, 'shell opacity');
  R(strike, c, 'burstFresnel', 0, 6, 0.05, 'shell rim');
  R(strike, c, 'burstSquash', 0.05, 1.5, 0.01, 'shell squash');
  R(strike, c, 'decalLife', 0.05, 3, 0.01, 'decal lasts (s)');
  R(strike, c, 'decalIntensity', 0, 3, 0.01, 'decal intensity');
  R(strike, c, 'decalWidth', 0.01, 0.4, 0.005, 'line / burst decal width');
  color(strike, c, 'colorBurstA', 'shell inner');
  color(strike, c, 'colorBurstB', 'shell mid');
  color(strike, c, 'colorBurstC', 'shell outer');
  R(strike, c, 'impactShake', 0, 1, 0.01, 'camera knock');
  R(strike, c, 'shakeDecay', 0.5, 20, 0.1, 'knock decay');
  R(strike, c, 'shakeFrequency', 1, 40, 0.5, 'knock frequency');
  R(strike, c, 'impactFlash', 0, 1, 0.01, 'flash');

  const warp = sub(folder, '7 · The warp');
  R(warp, c, 'warpStrength', 0, 3, 0.01, 'pressure ring');
  R(warp, c, 'warpWidth', 0.01, 0.5, 0.005, 'ring thickness');
  R(warp, c, 'warpLife', 0.05, 2, 0.01, 'runs out over (s)');
  R(warp, c, 'warpSwirl', 0, 2, 0.01, 'charging swirl');

  return folder;
}
