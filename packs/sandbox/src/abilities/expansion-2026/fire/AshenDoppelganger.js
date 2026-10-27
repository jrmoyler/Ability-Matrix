import { Box3, Group, Mesh, Points, Quaternion, Vector3 } from 'three';
import { clone as cloneSkeleton } from 'three/addons/utils/SkeletonUtils.js';
import { Ability, AbilityPhase } from '../../Ability.js';
import { LAYER } from '../../../core/Layers.js';
import { frame } from '../../../core/FrameUniforms.js';
import { settings } from '../../../config/settings.js';
import { ParticleShape } from '../../../particles/ParticleSystem.js';
import { RateEmitter } from '../../../particles/ParticleEngine.js';
import { DecalType } from '../../../effects/GroundDecals.js';
import { BurstMode } from '../../../effects/BurstSphere.js';
import { getColor } from '../../../utils/color.js';
import { saturate } from '../../../utils/math.js';
import { prefersReducedMotion } from '../ExpansionAtmosphere.js';
import { ID, UID, CONFIG } from './AshenDoppelgangerConfig.js';
import {
  FUSE_POINTS,
  createEmberColumnGeometry,
  createFuseGeometry,
  createGroundQuad,
  createHazeQuad,
  createHeadGeometry,
  createLimbGeometry,
  createTorsoGeometry
} from './AshenDoppelgangerGeometry.js';
import {
  createEchoSkinMaterial,
  createEmberColumnMaterial,
  createFuseMaterial,
  createHeatHazeMaterial,
  createRigMaterial,
  createSigilMaterial
} from './AshenDoppelgangerMaterials.js';

export { ID, UID, CONFIG };

/** Recorded path/pose samples (20 Hz → ~4.8 s of history). */
const HISTORY = 96;
/** Seconds between recorded samples. */
const SAMPLE_STEP = 0.05;
/** Bones a caster rig may have before the echo falls back to the figure. */
const MAX_BONES = 128;
/** Floats per bone per sample: quaternion xyzw + position xyz. */
const BONE_STRIDE = 7;

const _emit = {};
const _pos = new Vector3();
const _dir = new Vector3();
const _a = new Vector3();
const _b = new Vector3();
const _side = new Vector3();
const _up = new Vector3(0, 1, 0);
const _box = new Box3();

/**
 * ASHEN DOPPELGANGER — Fire, zone cast (matrix-expansion candidate).
 *
 * The caster leaves a copy of themselves made of cooling ash. It condenses at
 * the spot they cast from and then *walks their path* — the same footsteps,
 * the same facing and, when the host has given us the caster's rig, the same
 * pose — `delay` seconds behind them. Every `pulseInterval` it flares and
 * scorches everything within `pulseRadius`. When its time is up it crumbles
 * crown-first into ash and embers.
 *
 * The read is *a fuse burning towards you*: a smouldering path runs from the
 * echo's feet to the caster, white-hot where they have just stepped and
 * cooling to ash where the echo is about to tread, so the player can always
 * see where their own past is going to hurt someone next.
 *
 * ## Beats
 *
 *   - **anticipation** — the echo condenses feet-first out of ash over
 *     `formTime` while it waits `delay` for the caster to move off.
 *   - **travel** — it walks the recorded path; the fuse, ember column, motes,
 *     ash flakes and heat haze ride with it.
 *   - **pulse** — `preheat` seconds before each pulse the crust's fissures and
 *     the sigil's cracks brighten; on the pulse a ring runs out across the
 *     sigil, a shockwave and scorch decal mark the floor, sparks fly, the
 *     light punches and the camera knocks lightly. A pulse that fells a body
 *     adds a fire shell on it, a flash and a harder knock, and chars the body
 *     (`Dummy.corrode` with `scorchLook`) so the stain travels with it.
 *   - **exit** — over the last `burnOutTime` the echo crumbles from the crown
 *     down behind a white-hot edge, shedding ash and embers; every layer
 *     fades with it. Nothing pops.
 *
 * ## Layers (each a folder in the editor)
 *
 *   1. **the echo body** — the caster's own rig cloned with the ash crust
 *      patched into its material, or (until a rig exists) an authored, eroded
 *      fallback figure with the bespoke ember-crust ShaderMaterial.
 *   2. **the sigil** — ground circle, cracks and pulse ring (additive shader).
 *   3. **the fuse** — the smouldering path ribbon, rewritten in place each frame
 *      from the recorded history (fixed `FUSE_POINTS`).
 *   4. **the ember column** — baked points in an updraft round the body.
 *   5. **heat haze** — a `LAYER.DISTORTION` billboard over the echo.
 *   6. **particles** — embers shed (`.motes`), ash flakes (`.ash`), pulse
 *      sparks (`.sparks`), all shared `ctx.particles` systems.
 *   7. **beats** — SHOCKWAVE + SCORCH decals, FIRE bursts, flash, shake, light.
 *
 * ## Hits (`handlesOwnHits`)
 *
 * Unchanged from the gameplay contract: each pulse calls `findTargets` round
 * the echo and `kill`s each body with a force pointing away from it; only a
 * body that actually fell is stained. Pulses are clocked off `age`, not
 * frames, so a long frame catches up (capped at four per frame).
 *
 * ## The editor rule
 *
 * A cast keeps its history, its pulse clock and a few integrated phases;
 * every size, colour, rate and glow is read from `settings[ID]` every frame.
 * Reduced motion holds every ambient animation (crust crawl, column drift,
 * haze, shake) — the gameplay timing is untouched.
 */
export class AshenDoppelgangerAbility extends Ability {
  constructor(ctx) {
    super(ID, ctx);
  }

  get handlesOwnHits() {
    return true;
  }

  get impactDuration() {
    return 0.05;
  }

  get fadeDuration() {
    return Math.max(0.1, this.config.duration);
  }

  get instanceCount() {
    return this._hitCount;
  }

  /** A coal gutters; the light breathes harder as the next pulse nears. */
  lightShimmer() {
    if (this.reduceMotion) return 1;
    const gutter = 0.8 + 0.12 * Math.sin(this.age * 13.1) * Math.sin(this.age * 4.7) + 0.08 * Math.sin(this.age * 29.3);
    return gutter + (this._heat ?? 0) * 0.35;
  }

  /* ------------------------------------------------------------------ */
  /* Construction                                                        */
  /* ------------------------------------------------------------------ */

  createShaders() {
    this.skin = createEchoSkinMaterial();
    this.groundMat = createSigilMaterial();
    this.sparkMat = createEmberColumnMaterial();
    this.fuseMat = createFuseMaterial();
    this.hazeMat = createHeatHazeMaterial();

    this.bodyGeo = createTorsoGeometry();
    this.headGeo = createHeadGeometry();
    this.limbGeo = createLimbGeometry();
    this.groundGeo = createGroundQuad();
    this.sparkGeo = createEmberColumnGeometry();
    this.fuseGeo = createFuseGeometry();
    this.hazeGeo = createHazeQuad();

    // The echo: everything that walks the path lives under this group.
    this.echo = new Group();
    this.echo.name = 'AshEcho';
    this.group.add(this.echo);

    // Fallback figure, ~1.8 m: the legs hang from hips at 0.84 m to the
    // floor, the torso stands on the crotch at 0.74 m with its shoulders at
    // ~1.47 m, the head sits on the neck. Parts are authored at a generous
    // size and proportioned here, so the editor-free silhouette reads as a
    // person rather than a stack of capsules.
    this.body = new Mesh(this.bodyGeo, this.skin);
    this.body.position.y = 0.74;
    this.body.scale.set(0.62, 0.72, 0.62);
    this.echo.add(this.body);
    this.head = new Mesh(this.headGeo, this.skin);
    this.head.position.y = 1.52;
    this.head.scale.setScalar(0.6);
    this.echo.add(this.head);
    this.limbs = [];
    // [x, y, length scale, girth scale]: arms hang from the shoulders, legs
    // from the hips. The limb geometry is built pointing up; the pivot's
    // child is turned over so it hangs, and the pivot swings it.
    for (const [x, y, len, girth] of [
      [-0.25, 1.44, 0.85, 0.62],
      [0.25, 1.44, 0.85, 0.62],
      [-0.09, 0.84, 1.0, 0.85],
      [0.09, 0.84, 1.0, 0.85]
    ]) {
      const pivot = new Group();
      pivot.position.set(x, y, 0);
      const part = new Mesh(this.limbGeo, this.skin);
      part.rotation.z = Math.PI;
      part.scale.set(girth, len, girth);
      pivot.add(part);
      this.echo.add(pivot);
      this.limbs.push(pivot);
    }

    // The ember column rides the echo too.
    this.spark = new Points(this.sparkGeo, this.sparkMat);
    this.spark.frustumCulled = false;
    this.echo.add(this.spark);

    // The sigil and the fuse are on the floor in world space.
    this.ground = new Mesh(this.groundGeo, this.groundMat);
    this.ground.rotation.x = -Math.PI / 2;
    this.ground.position.y = 0.035;
    this.ground.renderOrder = 2;
    this.group.add(this.ground);

    this.fuse = new Mesh(this.fuseGeo, this.fuseMat);
    this.fuse.frustumCulled = false;
    this.fuse.renderOrder = 1;
    this.group.add(this.fuse);

    this.haze = new Mesh(this.hazeGeo, this.hazeMat);
    this.haze.frustumCulled = false;
    this.group.add(this.haze);

    // Bounded ring-buffer history: position, time, facing, and (with a rig)
    // every bone's local pose. Nothing here grows after construction.
    this.samples = Array.from({ length: HISTORY }, () => new Vector3());
    this.sampleTimes = new Float64Array(HISTORY);
    this.yawHistory = new Float32Array(HISTORY);
    this.writeIndex = 0;
    this.count = 0;
    this.sampleClock = 0;
    this.nextPulse = 0;
    this.lastPulse = -1;
    this.found = [];
    this.tmp = new Vector3();
    this.last = new Vector3();
    this.poseQuaternion = new Quaternion();
    this.posePosition = new Vector3();
    this.echoRig = null;
    this.poseSources = [];
    this.poseCopies = [];
    this.poseHistory = null;
    this.rigMaterial = null;
    this._rigHeight = 1.8;

    // Per-cast state handed to the material syncs (same objects every frame).
    this._skinState = { clock: 0, heat: 0, form: 0, crumble: 0, origin: new Vector3() };
    this._rigState = { clock: 0, heat: 0, form: 0, crumble: 0, height: 1.8, opacity: 0 };
    this._fxState = { clock: 0, heat: 0, power: 1 };
    this._force = { impulse: 0, lift: 0, spin: 0 };
    this._clock = 0;
    this._heat = 0;
    this._form = 0;
    this._crumble = 0;
    this._hitCount = 0;
    this._collapsed = false;
    this.reduceMotion = false;

    this.echo.traverse((o) => o.layers?.set(LAYER.VFX));
    this.ground.layers.set(LAYER.VFX);
    this.fuse.layers.set(LAYER.VFX);
    this.haze.layers.set(LAYER.DISTORTION);
  }

  createParticles() {
    const particles = this.ctx.particles;
    this.moteEmitter = new RateEmitter();
    this.ashEmitter = new RateEmitter();
    if (!particles?.get) {
      this.motes = this.ash = this.sparks = null;
      return;
    }
    this.motes = particles.get(`${ID}.motes`, {
      capacity: 900,
      shape: ParticleShape.SOFT,
      additive: true,
      curl: true,
      softFade: 0.2
    });
    this.motes.uniforms.uSizeIn.value = 0.1;
    this.motes.uniforms.uFadeIn.value = 0.1;
    this.motes.uniforms.uFadeOut.value = 0.55;
    this.motes.uniforms.uEndSize.value = 0.2;
    this.motes.uniforms.uDrag.value = 1.1;

    this.ash = particles.get(`${ID}.ash`, {
      capacity: 600,
      shape: ParticleShape.SMOKE,
      additive: false,
      softFade: 0.6
    });
    this.ash.uniforms.uSizeIn.value = 0.2;
    this.ash.uniforms.uFadeIn.value = 0.15;
    this.ash.uniforms.uFadeOut.value = 0.5;
    this.ash.uniforms.uEndSize.value = 1.8;
    this.ash.uniforms.uDrag.value = 1.6;

    this.sparks = particles.get(`${ID}.sparks`, {
      capacity: 900,
      shape: ParticleShape.STREAK,
      additive: true,
      stretch: true,
      softFade: 0.15
    });
    this.sparks.uniforms.uSizeIn.value = 0.02;
    this.sparks.uniforms.uFadeIn.value = 0.02;
    this.sparks.uniforms.uFadeOut.value = 0.6;
    this.sparks.uniforms.uEndSize.value = 0.3;
    this.sparks.uniforms.uDrag.value = 1.4;
  }

  /* ------------------------------------------------------------------ */
  /* Casting                                                             */
  /* ------------------------------------------------------------------ */

  onSpawn() {
    const c = this.config;
    const g = settings.global;
    this._ensureRig();
    this.reduceMotion = prefersReducedMotion();
    this.count = 0;
    this.writeIndex = 0;
    this.sampleClock = 0;
    this.nextPulse = c.delay;
    this.lastPulse = -1;
    this._clock = 0;
    this._heat = 0;
    this._form = 0;
    this._crumble = 0;
    this._hitCount = 0;
    this._collapsed = false;
    this.moteEmitter.reset();
    this.ashEmitter.reset();
    this.last.copy(this.origin);
    this.echo.position.copy(this.origin);
    this.echo.rotation.y = 0;

    this.echo.visible = true;
    this.ground.visible = true;
    this.fuse.visible = true;
    this.haze.visible = !this.reduceMotion;

    this.skin.uniforms.uOpacity.value = c.echoOpacity;
    this.sparkMat.uniforms.uOpacity.value = c.emberOpacity * g.opacity;
    this.sparkMat.uniforms.uRate.value = c.emberRate;
    this.groundMat.uniforms.uOpacity.value = c.sigilOpacity * g.opacity;
    this.groundMat.uniforms.uPulse.value = 1;
    this._sample();
    this._present(0, 1);
  }

  /** Clone the caster's rig once per pooled instance; the clone is reused. */
  _ensureRig() {
    if (this.echoRig || !this.ctx.character?.model) return;
    const source = this.ctx.character.model;
    const copy = cloneSkeleton(source);
    const originals = [];
    const clones = [];
    source.traverse((node) => {
      if (node.isBone) originals.push(node);
    });
    copy.traverse((node) => {
      if (node.isBone) clones.push(node);
    });
    if (!originals.length || originals.length !== clones.length || originals.length > MAX_BONES) return;
    this.rigMaterial = createRigMaterial();
    this.rigMaterial.opacity = this.config.echoOpacity;
    copy.traverse((node) => {
      if (node.isMesh) {
        node.material = this.rigMaterial;
        node.castShadow = false;
      }
      node.layers?.set(LAYER.VFX);
    });
    // The crust's dissolve needs the body's height; measure it once.
    _box.setFromObject(source);
    const height = _box.max.y - _box.min.y;
    this._rigHeight = Number.isFinite(height) && height > 0.2 && height < 6 ? height : 1.8;
    this.echo.add(copy);
    this.echoRig = copy;
    this.poseSources = originals;
    this.poseCopies = clones;
    this.poseHistory = new Float32Array(HISTORY * originals.length * BONE_STRIDE);
    this.body.visible = false;
    this.head.visible = false;
    for (const limb of this.limbs) limb.visible = false;
  }

  /** Record where (and how) the caster is now into the ring buffer. */
  _sample() {
    const point = this.ctx.character?.position ?? this.origin;
    this.samples[this.writeIndex].copy(point);
    this.sampleTimes[this.writeIndex] = this.age;
    this.yawHistory[this.writeIndex] = this.ctx.character?.root?.rotation.y ?? 0;
    if (this.poseHistory) {
      const bones = this.poseSources;
      const base = this.writeIndex * bones.length * BONE_STRIDE;
      for (let i = 0; i < bones.length; i++) {
        bones[i].quaternion.toArray(this.poseHistory, base + i * BONE_STRIDE);
        bones[i].position.toArray(this.poseHistory, base + i * BONE_STRIDE + 4);
      }
    }
    this.writeIndex = (this.writeIndex + 1) % HISTORY;
    this.count = Math.min(this.count + 1, HISTORY);
  }

  /**
   * Walk the echo along the recorded path and run the pulse clock.
   * Gameplay lives here; `_present` does the look.
   */
  _updateEcho(dt) {
    const c = this.config;
    this.sampleClock += dt;
    if (this.sampleClock >= SAMPLE_STEP) {
      this._sample();
      this.sampleClock %= SAMPLE_STEP;
    }
    const targetTime = Math.max(0, this.age - c.delay);
    // Bracket the desired time in the circular history. Interpolate rather
    // than stepping between 20 Hz samples, including across the ±π yaw seam.
    const size = this.samples.length;
    let lower = (this.writeIndex - this.count + size) % size;
    let upper = lower;
    for (let n = 1; n < this.count; n++) {
      const i = (lower + 1) % size;
      if (this.sampleTimes[i] > targetTime) {
        upper = i;
        break;
      }
      lower = i;
      upper = i;
    }
    this._lower = lower;
    const span = this.sampleTimes[upper] - this.sampleTimes[lower];
    const blend = span > 0 ? saturate((targetTime - this.sampleTimes[lower]) / span) : 0;
    this.last.copy(this.echo.position);
    this.echo.position.copy(this.samples[lower]).lerp(this.samples[upper], blend);
    this.echo.position.y = 0;
    const dx = this.echo.position.x - this.last.x;
    const dz = this.echo.position.z - this.last.z;
    if (this.echoRig) {
      const yaw = this.yawHistory[lower];
      const delta = this.yawHistory[upper] - yaw;
      const deltaYaw = Math.atan2(Math.sin(delta), Math.cos(delta));
      this.echo.rotation.y = yaw + deltaYaw * blend;
      const bones = this.poseCopies;
      const lowerBase = lower * bones.length * BONE_STRIDE;
      const upperBase = upper * bones.length * BONE_STRIDE;
      for (let i = 0; i < bones.length; i++) {
        const bone = bones[i];
        const offset = i * BONE_STRIDE;
        bone.quaternion.fromArray(this.poseHistory, lowerBase + offset).normalize();
        this.poseQuaternion.fromArray(this.poseHistory, upperBase + offset).normalize();
        bone.quaternion.slerp(this.poseQuaternion, blend);
        bone.position.fromArray(this.poseHistory, lowerBase + offset + 4);
        this.posePosition.fromArray(this.poseHistory, upperBase + offset + 4);
        bone.position.lerp(this.posePosition, blend);
      }
    } else if (dx * dx + dz * dz > 1e-6) {
      this.echo.rotation.y = Math.atan2(dx, dz);
    }
    // The fallback figure swings its limbs with its walking speed.
    const stride = Math.min(1, (Math.hypot(dx, dz) / Math.max(dt, 0.001)) * 0.2);
    for (let i = 0; i < 4; i++) this.limbs[i].rotation.x = Math.sin(this.age * 8 + i * Math.PI) * stride * 0.5;

    this.ground.position.set(this.echo.position.x, 0.035, this.echo.position.z);
    this.ground.scale.setScalar(c.pulseRadius * 2);
    this._heat = Math.max(0, 1 - (this.nextPulse - this.age) / Math.max(0.01, c.preheat));
    this.skin.uniforms.uHeat.value = this._heat;
    this.groundMat.uniforms.uPulse.value = saturate((this.age - this.lastPulse) / Math.max(0.01, c.pulseRingTime));
    this.position.copy(this.echo.position);

    let pulses = 0;
    while (this.age >= this.nextPulse && pulses++ < 4) {
      this.nextPulse += Math.max(0.05, c.pulseInterval);
      this.lastPulse = this.age;
      this.groundMat.uniforms.uPulse.value = 0;
      this._pulseFx();
      const found =
        this.ctx.dummies?.findTargets?.(this.echo.position.x, this.echo.position.z, c.pulseRadius, this.found) ?? [];
      this._force.impulse = c.pulseForce;
      this._force.lift = c.pulseLift;
      this._force.spin = c.pulseSpin;
      for (const d of found) {
        const x = d.position.x - this.echo.position.x;
        const z = d.position.z - this.echo.position.z;
        const r = Math.hypot(x, z) || 1;
        const struck = d.kill?.(x / r, z / r, this._force, false);
        // Like Emberveil's scorch stain, the look travels with the actual
        // struck body rather than being a separate unattached decoration.
        if (struck) {
          d.corrode?.(c.scorchAmount, c.scorchLook);
          this._hitCount++;
          this._strikeFx(d);
        }
      }
    }
  }

  onTravel(dt) {
    this._updateEcho(dt);
    this._present(dt, 1);
  }

  onImpact() {}

  onFade(dt, t) {
    this._updateEcho(dt);
    this._present(dt, t);
  }

  /* ------------------------------------------------------------------ */
  /* The look                                                            */
  /* ------------------------------------------------------------------ */

  /**
   * Drive every layer from the cast's clock and the live settings.
   * @param {number} t the base phase parameter (1..2 in the fade)
   */
  _present(dt, t) {
    const c = this.config;
    const g = settings.global;
    // Ambient clock: held under reduced motion, scaled by the global speed.
    if (!this.reduceMotion) this._clock += dt * g.animationSpeed;
    const clock = this._clock;

    // Condense over `formTime`; crumble over the last `burnOutTime`.
    this._form = Math.min(1, this.age / Math.max(0.01, c.formTime));
    let remaining = Infinity;
    if (this.phase === AbilityPhase.FADE && t > 1) remaining = (2 - t) * this.fadeDuration;
    this._crumble = 1 - saturate(remaining / Math.max(0.01, c.burnOutTime));
    // The last quarter also thins, as before, so the exit never snaps.
    const exitFade = t > 1 ? saturate((2 - t) * 4) : 1;
    const live = (1 - this._crumble) * exitFade;

    // 1 · body
    const opacity = c.echoOpacity * g.opacity * exitFade;
    this.skin.uniforms.uOpacity.value = opacity;
    const ss = this._skinState;
    ss.clock = clock;
    ss.heat = this._heat;
    ss.form = this._form;
    ss.crumble = this._crumble;
    ss.origin.copy(this.echo.position);
    this.skin.userData.sync(ss);
    if (this.rigMaterial) {
      const rs = this._rigState;
      rs.clock = clock;
      rs.heat = this._heat;
      rs.form = this._form;
      rs.crumble = this._crumble;
      rs.height = this._rigHeight;
      rs.opacity = opacity;
      this.rigMaterial.userData.sync(rs);
    }

    // 2 · sigil (uPulse belongs to the pulse clock in `_updateEcho`)
    const fx = this._fxState;
    fx.clock = clock;
    fx.heat = this._heat;
    fx.power = live;
    this.groundMat.uniforms.uOpacity.value = c.sigilOpacity * g.opacity * Math.min(1, this._form * 2) * exitFade;
    this.groundMat.userData.sync(fx);

    // 3 · fuse
    this._drawFuse(c);
    fx.power = live * this._form;
    this.fuseMat.userData.sync(fx);

    // 4 · ember column
    this.sparkMat.uniforms.uOpacity.value = c.emberOpacity * g.opacity * exitFade;
    this.sparkMat.uniforms.uRate.value = c.emberRate;
    this.sparkMat.userData.sync(fx);

    // 5 · haze — strongest at the pulse, gone under reduced motion
    this.haze.visible = !this.reduceMotion && c.hazeStrength > 0;
    this.haze.position.copy(this.echo.position);
    fx.power = live * this._form * (0.45 + 0.55 * Math.max(this._heat, 1 - this.groundMat.uniforms.uPulse.value));
    this.hazeMat.userData.sync(fx);

    // 6 · particles
    this._syncParticles(c, g);
    this._shed(dt, c, g, live);
    if (this._crumble > 0 && !this._collapsed) this._collapse(c, g);
  }

  /**
   * Rewrite the fuse ribbon along the recorded path, from the echo's feet
   * (u = 0) to the caster (u = 1), resampled to at most `FUSE_POINTS`.
   */
  _drawFuse(c) {
    const pos = this.fuseGeo.attributes.position;
    const size = this.samples.length;
    const lower = this._lower ?? (this.writeIndex - this.count + size) % size;
    const newest = (this.writeIndex - 1 + size) % size;
    const available = ((newest - lower + size) % size) + 1;
    const points = Math.max(2, Math.min(FUSE_POINTS, available + 1));
    for (let i = 0; i < FUSE_POINTS; i++) {
      const k = Math.min(i, points - 1);
      this._fusePoint(k, points, lower, available, _a);
      // Tangent from the neighbours; the strip is laid flat across it.
      this._fusePoint(Math.max(0, k - 1), points, lower, available, _b);
      this._fusePoint(Math.min(points - 1, k + 1), points, lower, available, _pos);
      _dir.subVectors(_pos, _b).setY(0);
      if (_dir.lengthSq() < 1e-8) _dir.copy(this.direction);
      _dir.normalize();
      _side.crossVectors(_dir, _up);
      // Thins towards both ends so the cap never shows.
      const u = k / (points - 1);
      const w = c.trailWidth * (0.35 + 0.65 * Math.sin(Math.PI * Math.min(1, u * 1.1)));
      pos.setXYZ(i * 2, _a.x - _side.x * w, 0.03, _a.z - _side.z * w);
      pos.setXYZ(i * 2 + 1, _a.x + _side.x * w, 0.03, _a.z + _side.z * w);
    }
    pos.needsUpdate = true;
    this.fuseGeo.setDrawRange(0, (points - 1) * 6);
  }

  /** Station `k` of `points`: the echo, then history samples, then the caster. */
  _fusePoint(k, points, lower, available, out) {
    if (k === 0) return out.copy(this.echo.position);
    if (k === points - 1) {
      const p = this.ctx.character?.position;
      return p ? out.copy(p) : out.copy(this.samples[(lower + available - 1) % this.samples.length]);
    }
    const s = Math.round((k / (points - 1)) * (available - 1));
    return out.copy(this.samples[(lower + s) % this.samples.length]);
  }

  _syncParticles(c, g) {
    if (this.motes) {
      this.motes.setGradient(getColor(c.colorMoteA), getColor(c.colorMoteB), getColor(c.colorMoteC), getColor(c.colorMoteD));
      const m = this.motes.uniforms;
      m.uGravity.value.set(0, c.moteLift, 0);
      m.uSizeScale.value = g.particleSize;
      m.uLifeScale.value = g.particleLifetime;
      m.uSpeedScale.value = g.particleSpeed;
      m.uOpacity.value = g.opacity;
      m.uGlow.value = c.moteGlow * g.glow;
      m.uTurbulence.value = 0.8 * g.turbulence;
    }
    if (this.ash) {
      this.ash.setGradient(getColor(c.colorAshA), getColor(c.colorAshB), getColor(c.colorAshC), getColor(c.colorAshD));
      const a = this.ash.uniforms;
      a.uGravity.value.set(0, c.ashLift, 0);
      a.uSizeScale.value = g.particleSize;
      a.uLifeScale.value = g.particleLifetime;
      a.uSpeedScale.value = g.particleSpeed;
      a.uOpacity.value = c.ashOpacity * g.opacity;
      a.uTurbulence.value = 0.6 * g.turbulence;
    }
    if (this.sparks) {
      this.sparks.setGradient(getColor(c.colorSparkA), getColor(c.colorSparkB), getColor(c.colorSparkC), getColor(c.colorSparkD));
      const k = this.sparks.uniforms;
      k.uGravity.value.set(0, -c.sparkGravity, 0);
      k.uStretch.value = c.sparkStretch;
      k.uSizeScale.value = g.particleSize;
      k.uLifeScale.value = g.particleLifetime;
      k.uSpeedScale.value = g.particleSpeed;
      k.uOpacity.value = g.opacity;
      k.uGlow.value = c.sparkGlow * g.glow;
      k.uTurbulence.value = 0.2 * g.turbulence;
    }
  }

  _resetEmit() {
    _emit.position = _pos;
    _emit.radius = 0;
    _emit.direction = _up;
    _emit.speed = 0;
    _emit.speedVariance = 0.35;
    _emit.spread = 0.5;
    _emit.inherit = null;
    _emit.anchor = null;
    _emit.size = 0.1;
    _emit.sizeVariance = 0.45;
    _emit.life = 1;
    _emit.lifeVariance = 0.35;
    _emit.spin = 0;
    _emit.tint = null;
    _emit.time = frame.uTime.value;
  }

  /** A random point on the standing body, world. */
  _bodyPoint(out, low = 0.15, high = 1.65) {
    const h = low + Math.random() * (high - low);
    const a = Math.random() * Math.PI * 2;
    const r = 0.12 + Math.random() * 0.16;
    return out.set(this.echo.position.x + Math.cos(a) * r, h, this.echo.position.z + Math.sin(a) * r);
  }

  /** Embers and ash shed continuously; heavier at the pulse and the crumble. */
  _shed(dt, c, g, live) {
    if (dt <= 0 || this._form <= 0) return;
    const boost = (0.6 + this._heat) * (1 + this._crumble * 3) * Math.max(0.15, live + this._crumble);
    if (this.motes) {
      const n = Math.round(this.moteEmitter.tick(dt, c.moteRate * boost) * g.particleCount);
      if (n > 0) {
        this._resetEmit();
        _emit.size = c.moteSize;
        _emit.life = c.moteLife;
        _emit.speed = c.moteSpeed;
        _emit.spread = 0.8;
        _emit.radius = 0.05;
        // Shed from where the crust still stands (below the crumble line).
        const top = 1.65 * (1 - this._crumble * 0.9);
        for (let i = 0; i < n; i++) {
          this._bodyPoint(_pos, 0.15, Math.max(0.2, top));
          this.motes.emit(1, _emit);
        }
      }
    }
    if (this.ash) {
      const n = Math.round(this.ashEmitter.tick(dt, c.ashRate * boost) * g.particleCount);
      if (n > 0) {
        this._resetEmit();
        _emit.size = c.ashSize;
        _emit.life = c.ashLife;
        _emit.speed = 0.3;
        _emit.spread = 0.9;
        _emit.radius = 0.08;
        _emit.spin = 0.6;
        for (let i = 0; i < n; i++) {
          this._bodyPoint(_pos, 0.3, 1.6);
          this.ash.emit(1, _emit);
        }
      }
    }
  }

  /** The pulse beat: ring, marks on the floor, sparks, light, a light knock. */
  _pulseFx() {
    const c = this.config;
    const g = settings.global;
    const power = g.explosionIntensity;
    _pos.copy(this.echo.position).setY(0);
    this.ctx.decals?.spawn?.(DecalType.SHOCKWAVE, _pos, {
      radius: c.pulseRadius * power,
      life: c.shockLife,
      width: 0.06,
      intensity: 1,
      colorA: getColor(c.colorShockA),
      colorB: getColor(c.colorShockB)
    });
    this.ctx.decals?.spawn?.(DecalType.SCORCH, _pos, {
      radius: c.pulseRadius * c.scorchDecal,
      life: c.scorchDecalLife,
      intensity: 0.8,
      colorA: getColor(c.scorchLook.rimColor),
      colorB: getColor(c.scorchLook.color)
    });
    if (this.sparks && c.pulseSparks > 0) {
      this._resetEmit();
      _pos.copy(this.echo.position).setY(0.9);
      _emit.radius = 0.25;
      _emit.speed = c.sparkSpeed;
      _emit.speedVariance = 0.5;
      _emit.spread = 1;
      _emit.size = c.sparkSize;
      _emit.life = c.sparkLife;
      this.sparks.emit(Math.round(c.pulseSparks * g.particleCount), _emit);
    }
    this.lightBoost = Math.max(this.lightBoost, c.lightIntensity * c.pulseLight * power);
    if (!this.reduceMotion && c.pulseShake > 0) this.ctx.shake?.add?.(c.pulseShake * power, c.shakeDecay, 18);
  }

  /** A pulse felled `dummy`: a fire shell on it, sparks, a flash, a knock. */
  _strikeFx(dummy) {
    const c = this.config;
    const g = settings.global;
    const power = g.explosionIntensity;
    _pos.copy(dummy.position).setY(0.9);
    this.ctx.bursts?.spawn?.(BurstMode.FIRE, _pos, {
      radius: c.burstSize * 0.2,
      endRadius: c.burstSize * power,
      life: 0.5,
      intensity: c.burstIntensity,
      opacity: 0.8,
      fresnel: 1.5 * g.fresnel,
      displace: 0.3,
      turbulence: 0.9 * g.turbulence,
      colorA: getColor(c.colorBurstA),
      colorB: getColor(c.colorBurstB),
      colorC: getColor(c.colorBurstC)
    });
    _a.copy(dummy.position).setY(0);
    this.ctx.decals?.spawn?.(DecalType.SCORCH, _a, {
      radius: Math.max(0.3, c.burstSize * 0.9),
      life: c.scorchDecalLife,
      intensity: 1,
      colorA: getColor(c.scorchLook.rimColor),
      colorB: getColor(c.scorchLook.color)
    });
    if (this.sparks) {
      this._resetEmit();
      _dir.subVectors(dummy.position, this.echo.position).setY(0);
      if (_dir.lengthSq() < 1e-6) _dir.copy(this.direction);
      _dir.normalize().addScaledVector(_up, 0.8).normalize();
      _emit.direction = _dir;
      _emit.radius = 0.3;
      _emit.speed = c.sparkSpeed * 0.8;
      _emit.spread = 0.8;
      _emit.size = c.sparkSize;
      _emit.life = c.sparkLife;
      this.sparks.emit(Math.round(c.pulseSparks * 0.8 * g.particleCount), _emit);
    }
    if (this.motes) {
      this._resetEmit();
      _emit.radius = 0.35;
      _emit.speed = c.moteSpeed * 2.5;
      _emit.spread = 1;
      _emit.size = c.moteSize * 1.3;
      _emit.life = c.moteLife;
      this.motes.emit(Math.round(20 * g.particleCount), _emit);
    }
    if (c.hitFlash > 0) this.ctx.flash?.trigger?.(getColor(c.colorFlash), c.hitFlash * power);
    if (!this.reduceMotion && c.hitShake > 0) this.ctx.shake?.add?.(c.hitShake * power, c.shakeDecay, 22);
    this.lightBoost = Math.max(this.lightBoost, c.lightIntensity * c.pulseLight * 1.6 * power);
  }

  /** The crumble begins: one sigh of ash and embers off the whole body. */
  _collapse(c, g) {
    this._collapsed = true;
    if (this.ash && c.collapseAsh > 0) {
      this._resetEmit();
      _emit.size = c.ashSize * 1.4;
      _emit.life = c.ashLife * 1.2;
      _emit.speed = 0.5;
      _emit.spread = 1;
      _emit.radius = 0.1;
      _emit.spin = 0.8;
      const n = Math.round(c.collapseAsh * g.particleCount);
      for (let i = 0; i < n; i++) {
        this._bodyPoint(_pos, 0.1, 1.7);
        this.ash.emit(1, _emit);
      }
    }
    if (this.motes && c.collapseEmbers > 0) {
      this._resetEmit();
      _emit.size = c.moteSize * 1.2;
      _emit.life = c.moteLife * 1.3;
      _emit.speed = c.moteSpeed * 1.8;
      _emit.spread = 1;
      _emit.radius = 0.1;
      const n = Math.round(c.collapseEmbers * g.particleCount);
      for (let i = 0; i < n; i++) {
        this._bodyPoint(_pos, 0.1, 1.7);
        this.motes.emit(1, _emit);
      }
    }
    _pos.copy(this.echo.position).setY(0);
    this.ctx.decals?.spawn?.(DecalType.SCORCH, _pos, {
      radius: c.pulseRadius * c.scorchDecal * 0.8,
      life: c.scorchDecalLife * 1.5,
      intensity: 0.9,
      colorA: getColor(c.scorchLook.rimColor),
      colorB: getColor(c.scorchLook.color)
    });
    this.lightBoost = Math.max(this.lightBoost, c.lightIntensity * c.pulseLight * g.explosionIntensity);
  }

  /* ------------------------------------------------------------------ */
  /* Pooling                                                             */
  /* ------------------------------------------------------------------ */

  onDestroy() {
    this.count = 0;
    this.echo.visible = false;
    this.ground.visible = false;
    this.fuse.visible = false;
    this.haze.visible = false;
    this.moteEmitter.reset();
    this.ashEmitter.reset();
  }

  dispose() {
    for (const g of [this.bodyGeo, this.limbGeo, this.headGeo, this.groundGeo, this.sparkGeo, this.fuseGeo, this.hazeGeo]) g.dispose();
    for (const m of [this.skin, this.groundMat, this.sparkMat, this.fuseMat, this.hazeMat]) m.dispose();
    if (this.echoRig?.traverse) {
      // The clone shares geometry with the caster but owns its skeletons
      // (and their bone textures).
      this.echoRig.traverse((node) => {
        if (node.isSkinnedMesh) node.skeleton?.dispose?.();
      });
      this.echoRig.parent?.remove(this.echoRig);
    }
    this.rigMaterial?.dispose();
    super.dispose();
  }
}

/* ---------------------------------------------------------------------- */
/* Editor                                                                  */
/* ---------------------------------------------------------------------- */

/** A sub-folder where the host GUI has them; the parent folder otherwise. */
function sub(folder, title) {
  return typeof folder.addFolder === 'function' ? folder.addFolder(title) : folder;
}

/** `Editor.gradient` where sub-folders exist, four plain colours otherwise. */
function gradient(folder, c, prefix, title, Editor) {
  if (typeof folder.addFolder === 'function' && Editor.gradient) return Editor.gradient(folder, c, prefix, title);
  for (const [k, label] of [['A', 'birth'], ['B', 'early'], ['C', 'late'], ['D', 'death']]) folder.addColor(c, `${prefix}${k}`).name(`${title} ${label}`);
  return folder;
}

export function buildEditor(gui, c, Editor) {
  const folder = gui.addFolder('♨  Ashen Doppelganger');
  const R = Editor.range;

  const cast = sub(folder, 'The cast');
  R(cast, c, 'range', 0, 48, 0.1, 'max range');
  R(cast, c, 'minRange', 0, 12, 0.1, 'min range');
  R(cast, c, 'speed', 1, 90, 0.5, 'front speed');
  R(cast, c, 'lifetime', 0.1, 12, 0.05, 'nominal lifetime');
  R(cast, c, 'cooldown', 0, 30, 0.1, 'cooldown');
  if (Editor.castAnimation) Editor.castAnimation(cast, c);
  cast.addColor(c, 'lightColor').name('light colour');
  R(cast, c, 'lightIntensity', 0, 40, 0.1, 'light intensity');
  R(cast, c, 'lightRadius', 0.5, 40, 0.1, 'light radius');

  const rules = sub(folder, 'The echo (gameplay)');
  R(rules, c, 'delay', 0.1, 2, 0.05, 'echo delay (s)');
  R(rules, c, 'duration', 1, 8, 0.1, 'duration (s)');
  R(rules, c, 'pulseInterval', 0.2, 2, 0.05, 'pulse interval (s)');
  R(rules, c, 'pulseRadius', 0.5, 5, 0.1, 'pulse radius (m)');
  R(rules, c, 'pulseForce', 0, 12, 0.1, 'pulse force');
  R(rules, c, 'pulseLift', 0, 8, 0.05, 'pulse lift');
  R(rules, c, 'pulseSpin', 0, 4, 0.05, 'pulse tumble');
  R(rules, c, 'scorchAmount', 0, 1, 0.01, 'scorch amount');
  rules.addColor(c.scorchLook, 'color').name('scorch colour');
  rules.addColor(c.scorchLook, 'rimColor').name('scorch rim');
  R(rules, c.scorchLook, 'rimEmissive', 0, 4, 0.05, 'rim glow');
  rules.addColor(c.scorchLook, 'edgeColor').name('scorch edge');
  R(rules, c.scorchLook, 'edgeEmissive', 0, 4, 0.05, 'edge glow');

  const body = sub(folder, '1 · The echo body');
  R(body, c, 'echoOpacity', 0, 1, 0.01, 'opacity');
  R(body, c, 'formTime', 0.01, 2, 0.01, 'condenses over (s)');
  R(body, c, 'burnOutTime', 0.05, 3, 0.01, 'crumbles over (s)');
  R(body, c, 'fissureScale', 2, 60, 0.5, 'crack density');
  R(body, c, 'fissureSpeed', 0, 8, 0.05, 'crack crawl');
  R(body, c, 'crustGrain', 1, 60, 0.5, 'char grain');
  R(body, c, 'fissureGlow', 0, 8, 0.05, 'crack glow');
  R(body, c, 'rimGlow', 0, 4, 0.01, 'rim glow');
  R(body, c, 'preheat', 0.01, 1, 0.01, 'flares before pulse (s)');
  R(body, c, 'heatFlare', 0, 4, 0.05, 'pulse flare');
  R(body, c, 'wobble', 0, 0.2, 0.001, 'heat sway (m)');
  R(body, c, 'burnEdge', 0.005, 0.4, 0.005, 'burn edge');
  body.addColor(c, 'colorCharA').name('char cool');
  body.addColor(c, 'colorCharB').name('char warm');
  body.addColor(c, 'colorFissure').name('cracks');
  body.addColor(c, 'colorRim').name('rim');
  body.addColor(c, 'colorBurnEdge').name('burn edge');
  R(body, c, 'rigEmissive', 0, 6, 0.05, 'rig glow');
  body.addColor(c, 'colorRigBody').name('rig body');
  body.addColor(c, 'colorRigEmissive').name('rig emissive');

  const sigil = sub(folder, '2 · Sigil and pulse ring');
  R(sigil, c, 'sigilOpacity', 0, 1, 0.01, 'opacity');
  R(sigil, c, 'sigilGlow', 0, 6, 0.05, 'glow');
  R(sigil, c, 'sigilRing', 0.2, 0.95, 0.01, 'ring radius');
  R(sigil, c, 'sigilCracks', 0, 32, 1, 'cracks');
  R(sigil, c, 'pulseRingTime', 0.05, 2, 0.01, 'ring runs out over (s)');
  sigil.addColor(c, 'colorSigil').name('colour');
  sigil.addColor(c, 'colorSigilHot').name('hot');

  const fuse = sub(folder, '3 · The fuse');
  R(fuse, c, 'trailWidth', 0, 1, 0.01, 'half-width (m)');
  R(fuse, c, 'trailGlow', 0, 6, 0.05, 'glow');
  R(fuse, c, 'trailOpacity', 0, 1, 0.01, 'opacity');
  R(fuse, c, 'trailFlicker', 0, 3, 0.05, 'gutter');
  fuse.addColor(c, 'colorTrailHot').name('hot');
  fuse.addColor(c, 'colorTrailAsh').name('ash');

  const column = sub(folder, '4 · Ember column');
  R(column, c, 'emberOpacity', 0, 1, 0.01, 'opacity');
  R(column, c, 'emberRate', 0, 6, 0.1, 'ember drift');
  R(column, c, 'emberHeight', 0.3, 5, 0.05, 'height (m)');
  R(column, c, 'emberSize', 1, 60, 0.5, 'size');
  column.addColor(c, 'colorEmberA').name('cool');
  column.addColor(c, 'colorEmberB').name('hot');

  const haze = sub(folder, '5 · Heat haze');
  R(haze, c, 'hazeStrength', 0, 3, 0.01, 'strength');
  R(haze, c, 'hazeWidth', 0.2, 4, 0.05, 'half-width (m)');
  R(haze, c, 'hazeHeight', 0.3, 6, 0.05, 'height (m)');
  R(haze, c, 'hazeScale', 0.2, 8, 0.05, 'noise scale');
  R(haze, c, 'hazeSpeed', 0, 6, 0.05, 'rise speed');

  const fx = sub(folder, '6 · Particles');
  R(fx, c, 'moteRate', 0, 200, 1, 'embers/second');
  R(fx, c, 'moteSize', 0.005, 0.4, 0.001, 'ember size');
  R(fx, c, 'moteSpeed', 0, 6, 0.05, 'ember speed');
  R(fx, c, 'moteLife', 0.1, 5, 0.05, 'ember lifetime');
  R(fx, c, 'moteLift', -4, 6, 0.05, 'ember rise');
  R(fx, c, 'moteGlow', 0, 10, 0.05, 'ember glow');
  gradient(fx, c, 'colorMote', 'ember gradient', Editor);
  R(fx, c, 'ashRate', 0, 120, 1, 'ash/second');
  R(fx, c, 'ashSize', 0.02, 1.5, 0.01, 'ash size');
  R(fx, c, 'ashLife', 0.1, 6, 0.05, 'ash lifetime');
  R(fx, c, 'ashLift', -2, 4, 0.05, 'ash rise');
  R(fx, c, 'ashOpacity', 0, 1, 0.01, 'ash opacity');
  gradient(fx, c, 'colorAsh', 'ash gradient', Editor);
  R(fx, c, 'pulseSparks', 0, 200, 1, 'sparks per pulse');
  R(fx, c, 'sparkSpeed', 0, 20, 0.1, 'spark speed');
  R(fx, c, 'sparkSize', 0.005, 0.3, 0.001, 'spark size');
  R(fx, c, 'sparkLife', 0.05, 3, 0.01, 'spark lifetime');
  R(fx, c, 'sparkGravity', -10, 30, 0.1, 'spark gravity');
  R(fx, c, 'sparkStretch', 0, 1, 0.01, 'spark stretch');
  R(fx, c, 'sparkGlow', 0, 10, 0.05, 'spark glow');
  gradient(fx, c, 'colorSpark', 'spark gradient', Editor);

  const beats = sub(folder, '7 · Pulse and strike');
  R(beats, c, 'pulseShake', 0, 1, 0.01, 'pulse knock');
  R(beats, c, 'hitShake', 0, 1.5, 0.01, 'strike knock');
  R(beats, c, 'shakeDecay', 0.5, 30, 0.1, 'knock settles');
  R(beats, c, 'pulseLight', 0, 6, 0.05, 'light punch (× intensity)');
  R(beats, c, 'hitFlash', 0, 1, 0.01, 'strike flash');
  beats.addColor(c, 'colorFlash').name('flash');
  R(beats, c, 'scorchDecal', 0, 1.5, 0.01, 'scorch mark (× radius)');
  R(beats, c, 'scorchDecalLife', 0.1, 8, 0.05, 'scorch lasts (s)');
  R(beats, c, 'shockLife', 0.05, 2, 0.01, 'shockwave lasts (s)');
  beats.addColor(c, 'colorShockA').name('shockwave');
  beats.addColor(c, 'colorShockB').name('shockwave hot');
  R(beats, c, 'burstSize', 0, 4, 0.05, 'fire shell (m)');
  R(beats, c, 'burstIntensity', 0, 4, 0.05, 'shell brightness');
  beats.addColor(c, 'colorBurstA').name('shell inner');
  beats.addColor(c, 'colorBurstB').name('shell mid');
  beats.addColor(c, 'colorBurstC').name('shell outer');
  R(beats, c, 'collapseAsh', 0, 200, 1, 'crumble ash');
  R(beats, c, 'collapseEmbers', 0, 300, 1, 'crumble embers');

  folder.close();
  return folder;
}
