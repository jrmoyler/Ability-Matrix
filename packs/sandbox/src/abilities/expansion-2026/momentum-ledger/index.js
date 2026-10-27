import {
  AdditiveBlending,
  BufferGeometry,
  DynamicDrawUsage,
  Float32BufferAttribute,
  Group,
  InstancedMesh,
  Line,
  LineBasicMaterial,
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
import { BurstMode } from '../../../effects/BurstSphere.js';
import { DecalType } from '../../../effects/GroundDecals.js';
import { LAYER } from '../../../core/Layers.js';
import { CAST_ANIMATIONS, settings } from '../../../config/settings.js';
import { getColor } from '../../../utils/color.js';
import { Easing } from '../../../utils/math.js';
import {
  createCoilGeometry,
  createFanGeometry,
  createLedgerWheelGeometry,
  createQuad,
  createRibbonGeometry,
  createSpeedMoteGeometry,
  createVectorGeometry,
} from './geometry.js';
import {
  createCompressionLensMaterial,
  createDialMaterial,
  createFanMaterial,
  createGlyphMaterial,
  createLedgerGlowMaterial,
  createRibbonMaterial,
  createSpeedMoteMaterial,
} from './materials.js';
import config from './config.js';

export { config };
export const ID = config.id;

const TAU = Math.PI * 2,
  clamp = (x) => Math.max(0, Math.min(1, x));
const delta = new Vector3(),
  scratch = new Object3D(),
  _pos = new Vector3(),
  _a = new Vector3(),
  _b = new Vector3();
/** Orbiting velocity glyphs. */
const MAX_VECTORS = 32;
/** Bodies the release may affect. */
const MAX_TARGETS = 16;
/** Reused option bag for expansionBurst (it destructures, never retains). */
const _burst = { count: 0, size: 0, life: 0, speed: 0, spread: 0, radius: 0, direction: undefined };
/** Points the wake remembers (a ring buffer). */
const WAKE_POINTS = 64;
/** Gauge glyphs, one per tally cell on the dial. */
const GAUGE_CELLS = 24;
/** GPU speed motes allocated per pool member. */
const MAX_MOTES = 160;

/**
 * MOMENTUM LEDGER — Motion, zone cast.
 *
 * Movement is measured while the ledger is active, then converted into a
 * bounded strike. The ledger **lands** on the target — a dial of counter
 * wheels, four charge coils and an orbit of velocity glyphs — and **banks**
 * the distance the caster actually walks for `chargeDuration` seconds. The
 * bank is legible from everywhere: tally cells light round the dial's rim one
 * by one, the gauge glyphs fill the same 24 positions, the coils compress,
 * the glyphs and speed motes orbit faster, the dial's flow lines turn to
 * follow the way you walked, the air pinches in, and the walked path itself
 * is drawn back to the ledger as a ribbon of chevrons. Then the ledger
 * **releases**: a directional wave races out along the banked direction,
 * release rings run out to the strike radius, the coils spring open, the
 * camera knocks in proportion to the bank. Then it **winds down** and the dial
 * dissolves.
 *
 * Teleports and velocity spikes above `maxSpeed` are rejected, not banked:
 * the wake is cut, no trail puff is emitted, and nothing is added to the
 * tally — the same rule the gameplay uses, drawn.
 *
 * ## Layers (each a folder in the editor)
 *
 *   1. **the dial** (`createDialMaterial`) — rim, travelling waves, flow
 *      lines along the banked direction, the 24-cell tally, release shock,
 *      noise dissolve.
 *   2. **the ledger wheels** — three notched counter wheels: two of lit metal
 *      (`MeshStandardMaterial`, world layer) and one of light
 *      (`createLedgerGlowMaterial`).
 *   3. **the coils** — four tapered helical springs compressed by the bank.
 *   4. **glyphs** (`createGlyphMaterial`) — 32 instanced orbiting velocity
 *      arrows and the 24-cell gauge filled from the banked fraction.
 *   5. **the wake** — the recorded walk as a crisp line and a chevron ribbon
 *      (`createRibbonMaterial`), both cut on a rejected move.
 *   6. **particles** — streak puffs off the caster's feet while they move
 *      validly and a burst at the release (shared expansion system); GPU
 *      speed motes orbiting the dial (`createSpeedMoteMaterial`).
 *   7. **the release** — the directional fan (`createFanMaterial`), release
 *      rings, AIR shell, SHOCKWAVE + DUSTRING decals, flash, knock, light.
 *   8. **the lens** (`createCompressionLensMaterial` on `LAYER.DISTORTION`) —
 *      a pinch while banking, a pressure ring at the release.
 *
 * ## Hits (`handlesOwnHits`)
 *
 * Unchanged by the craft pass: one release `chargeDuration` after landing on
 * every enemy inside `zoneRadius`, with knockback
 * `baseImpulse + bonusImpulse × bank`, through the expansion combat binding
 * or the dummy field.
 *
 * ## The editor rule
 *
 * A cast keeps the banked distance, the banked direction, the wake ring
 * buffer and integrated clocks; every dimension, colour, count and timing is
 * read from `settings.momentumLedger` every frame.
 */
export class Ability extends BaseAbility {
  constructor(ctx) {
    super(ID, ctx);
  }

  get handlesOwnHits() {
    return true;
  }

  get instanceCount() {
    return MAX_VECTORS + this.gauge.count;
  }

  /* ------------------------------------------------------------------ */
  /* Timing — gameplay; unchanged                                        */
  /* ------------------------------------------------------------------ */

  get impactDuration() {
    return this.config.chargeDuration + 0.5;
  }

  get fadeDuration() {
    return 0.75;
  }

  /* ------------------------------------------------------------------ */
  /* Construction                                                        */
  /* ------------------------------------------------------------------ */

  createShaders() {
    this.resources = [];
    const own = (x) => (this.resources.push(x), x);
    this.root = new Group();
    this.group.add(this.root);
    const quad = own(createQuad());

    // 1 · the dial
    this.fieldMat = own(createDialMaterial());
    this.field = new Mesh(quad, this.fieldMat);
    this.field.rotation.x = -Math.PI / 2;
    this.field.position.y = 0.035;
    this.field.renderOrder = 2;
    this.root.add(this.field);

    // 2 · the ledger wheels
    this.metal = own(new MeshStandardMaterial({
      color: 0x8c4945, metalness: 0.78, roughness: 0.24, emissive: 0x4b1b0d,
    }));
    this.ringGlow = own(createLedgerGlowMaterial());
    const wheel = own(createLedgerWheelGeometry());
    this.rings = [];
    for (let i = 0; i < 3; i++) {
      const o = new Mesh(wheel, i === 1 ? this.ringGlow : this.metal);
      o.rotation.x = Math.PI / 2;
      o.position.y = 0.1 + i * 0.025;
      o.castShadow = i !== 1;
      this.root.add(o);
      this.rings.push(o);
    }

    // 3 · the coils
    this.coilMat = own(new MeshStandardMaterial({
      color: 0xd98966, emissive: 0x5b2418, emissiveIntensity: 0.7, metalness: 0.75, roughness: 0.3,
    }));
    const coil = own(createCoilGeometry());
    this.coils = [];
    for (let i = 0; i < 4; i++) {
      const mesh = new Mesh(coil, this.coilMat);
      mesh.position.y = 0.4;
      mesh.castShadow = true;
      this.root.add(mesh);
      this.coils.push(mesh);
    }

    // 7 · release rings (one material, so both fade together)
    this.releaseGlow = own(createLedgerGlowMaterial());
    const thin = own(createLedgerWheelGeometry({ width: 0.03, thickness: 0.02, notches: 48 }));
    this.releaseRings = [];
    for (let i = 0; i < 2; i++) {
      const o = new Mesh(thin, this.releaseGlow);
      o.rotation.x = Math.PI / 2;
      o.position.y = 0.19 + i * 0.025;
      o.visible = false;
      this.root.add(o);
      this.releaseRings.push(o);
    }
    this.fanMat = own(createFanMaterial());
    this.fan = new Mesh(own(createFanGeometry()), this.fanMat);
    this.fan.position.y = 0.12;
    this.fan.visible = false;
    this.fan.frustumCulled = false;
    this.fan.renderOrder = 5;
    this.root.add(this.fan);

    // 5 · the wake: a crisp centreline and a chevron ribbon
    const wakeGeometry = own(new BufferGeometry());
    const wakePositions = new Float32BufferAttribute(new Float32Array(WAKE_POINTS * 3), 3);
    wakePositions.setUsage(DynamicDrawUsage);
    wakeGeometry.setAttribute('position', wakePositions);
    wakeGeometry.setDrawRange(0, 0);
    this.wake = new Line(
      wakeGeometry,
      own(new LineBasicMaterial({
        color: 0xffb088, transparent: true, opacity: 0.8, depthWrite: false, blending: AdditiveBlending, toneMapped: false,
      })),
    );
    this.wake.frustumCulled = false;
    this.root.add(this.wake);
    this.ribbonMat = own(createRibbonMaterial());
    this.wakeRibbon = new Mesh(own(createRibbonGeometry(WAKE_POINTS)), this.ribbonMat);
    this.wakeRibbon.frustumCulled = false;
    this.wakeRibbon.renderOrder = 3;
    this.root.add(this.wakeRibbon);
    this._wakePoints = Array.from({ length: WAKE_POINTS }, () => new Vector3());
    this._wakeHead = 0;
    this._wakeCount = 0;

    // 4 · glyphs
    this.glow = own(createGlyphMaterial());
    const arrow = own(createVectorGeometry());
    this.vectors = new InstancedMesh(arrow, this.glow, MAX_VECTORS);
    this.vectors.frustumCulled = false;
    this.root.add(this.vectors);
    // A separate graduated dial shows the real measured distance banked;
    // it is filled from q rather than from elapsed time.
    this.gauge = new InstancedMesh(arrow, this.glow, GAUGE_CELLS);
    this.gauge.frustumCulled = false;
    this.gauge.count = 0;
    this.root.add(this.gauge);

    // 6 · speed motes
    this.moteMat = own(createSpeedMoteMaterial());
    this.motes = new Points(own(createSpeedMoteGeometry(MAX_MOTES)), this.moteMat);
    this.motes.frustumCulled = false;
    this.motes.renderOrder = 6;
    this.root.add(this.motes);

    // 8 · the lens (opaque proxy — see createCompressionLensMaterial)
    this.lensMat = own(createCompressionLensMaterial());
    this.lens = new Mesh(quad, this.lensMat);
    this.lens.rotation.x = -Math.PI / 2;
    this.lens.position.y = 0.3;
    this.lens.visible = false;
    this.root.add(this.lens);

    this._prev = new Vector3();
    this._last = new Vector3();
    this._target = new Vector3();
    /** Sum of every banked step: the direction the caster actually walked. */
    this._flow = new Vector3();
    this._force = { impulse: 0, lift: 0, spin: 0 };
    this._found = [];
    this._clock = 0;
    this._calm = false;
    this._dialState = { clock: 0, charge: 0, fade: 1, dissolve: 0, release: -1, flowX: 0, flowY: 1 };
    this._glyphState = { clock: 0, charge: 0, fade: 1 };
    this._ringState = { opacity: 0.9, clock: 0 };
    this._releaseState = { opacity: 0, clock: 0 };
    this._ribbonState = { clock: 0, fade: 1, span: 8 };
    this._fanState = { progress: 0, power: 0 };
    this._moteState = { clock: 0, radius: 1, charge: 0, throw: 0, fade: 1, capacity: MAX_MOTES };
    this._lensState = { pinch: 0, shock: 0, wave: 0, clock: 0 };

    routeExpansionTransparency(this.group);
    this.lens.layers.set(LAYER.DISTORTION);
    this._disposed = false;
  }

  createParticles() {
    this.fx = createExpansionFX(this.ctx, 'motion', {
      shape: ParticleShape.STREAK,
      colors: ['#fff4df', '#ffb088', '#d65d52', '#4e203b'],
    });
  }

  /* ------------------------------------------------------------------ */
  /* Phases                                                              */
  /* ------------------------------------------------------------------ */

  onSpawn() {
    const p = this.ctx.character?.position ?? this.origin;
    this._prev.copy(p);
    this._last.copy(p);
    this._target.copy(this.origin).addScaledVector(this.direction, this.length);
    this._distance = 0;
    this._flow.set(0, 0, 0);
    this._trailElapsed = 0;
    this._released = false;
    this._clock = 0;
    this._calm = prefersReducedMotion();
    this._scope = bindExpansionCombat(this.ctx, 'matrix-expansion/momentum-ledger');
    this.failure = null;
    this._wakeHead = 0;
    this._wakeCount = 0;
    this._recordWake(p);
    this.root.visible = true;
    this._sync(0);
  }

  onTravel(dt) {
    this._capture(dt);
    this._sync(dt);
  }

  onImpact() {
    this._sync(0);
  }

  onFade(dt) {
    this._capture(dt);
    if (!this._released && this.impactTime >= this.config.chargeDuration) {
      this._released = true;
      this._strike();
      this._release();
    }
    this._sync(dt);
  }

  /* ------------------------------------------------------------------ */
  /* The ledger — gameplay, unchanged                                     */
  /* ------------------------------------------------------------------ */

  /** Bank this frame's movement, or reject it as a teleport. */
  _capture(dt) {
    if (this._released || dt <= 0) return;
    const c = this.config;
    const p = this.ctx.character?.position ?? this._last;
    delta.copy(p).sub(this._prev).setY(0);
    const n = delta.length();
    if (n <= c.maxSpeed * dt + 0.02) {
      this._distance = Math.min(c.maxDistance, this._distance + n);
      this._flow.add(delta);
      this._trailElapsed += dt;
      const interval = Math.max(0.02, c.trailInterval);
      if (n > 0.001 && this._trailElapsed >= interval) {
        this._trailElapsed %= interval;
        _burst.count = c.trailCount;
        _burst.size = c.trailSize;
        _burst.life = c.trailLife;
        _burst.speed = c.trailSpeed;
        _burst.spread = c.trailSpread;
        _burst.radius = 0.12;
        _burst.direction = delta.normalize(); // thrown along the step
        expansionBurst(this.fx, p, _burst);
      }
      const last = this._wakePoints[(this._wakeHead + this._wakeCount - 1) % this._wakePoints.length];
      if (n > 0 && (!last || last.distanceToSquared(p) >= 0.05 * 0.05)) this._recordWake(p);
    } else {
      // A velocity spike: not banked, and the wake is cut where it happened.
      this._wakeHead = 0;
      this._wakeCount = 0;
      this._recordWake(p);
    }
    this._prev.copy(p);
    this._last.copy(p);
  }

  _recordWake(p) {
    const cap = this._wakePoints.length;
    let index = (this._wakeHead + this._wakeCount) % cap;
    if (this._wakeCount === cap) {
      index = this._wakeHead;
      this._wakeHead = (this._wakeHead + 1) % cap;
    } else this._wakeCount++;
    this._wakePoints[index].copy(p);
  }

  _strike() {
    const c = this.config;
    _burst.count = c.releaseCount;
    _burst.size = c.releaseSize;
    _burst.life = c.releaseLife;
    _burst.speed = c.releaseSpeed;
    _burst.spread = 0.8; // expansionBurst's default cone
    _burst.radius = c.zoneRadius * 0.35;
    _burst.direction = undefined; // straight up (the default)
    expansionBurst(this.fx, this._target, _burst);
    const q = clamp(this._distance / Math.max(0.01, c.maxDistance)),
      power = settings.global.explosionIntensity;
    if (this._scope) {
      const source = [this._target.x, 0, this._target.z];
      const targets = this._scope.queryActors({ position: source, radius: c.zoneRadius, relation: 'enemy' });
      if (!targets.ok) { this.failure = targets.reason; return; }
      const force = impactForce({
        hitImpulse: c.baseImpulse + c.bonusImpulse * q,
        hitLift: c.lift * (0.6 + 0.4 * q), hitSpin: c.spin,
      }, power);
      for (const actor of targets.actors.slice(0, MAX_TARGETS)) {
        const sent = this._scope.emit({
          type: 'hit', element: 'motion', targetIds: [actor.id],
          position: actor.position, sourcePosition: source, damage: 1, hitForce: force, tags: ['momentum-ledger'],
        });
        if (!sent.ok) this.failure = sent.reason;
      }
      return;
    }
    const field = this.ctx.dummies;
    if (!field?.findTargets) return;
    this._force.impulse = (c.baseImpulse + c.bonusImpulse * q) * power;
    this._force.lift = c.lift * (0.6 + 0.4 * q) * power;
    this._force.spin = c.spin;
    const found = field.findTargets(this._target.x, this._target.z, c.zoneRadius, this._found);
    let hits = 0;
    for (const d of found) {
      delta.set(d.position.x - this._target.x, 0, d.position.z - this._target.z);
      if (delta.lengthSq() > c.zoneRadius * c.zoneRadius) continue;
      if (delta.lengthSq() < 1e-9) delta.copy(this.direction);
      else delta.normalize();
      if (d.kill(delta.x, delta.z, this._force) && ++hits >= MAX_TARGETS) break;
    }
  }

  /** Shell, decals, flash, knock and light, scaled by what was banked. */
  _release() {
    const c = this.config;
    const power = settings.global.explosionIntensity;
    const q = clamp(this._distance / Math.max(0.01, c.maxDistance));
    const weight = 0.5 + q;
    const r = c.zoneRadius;
    this.lightBoost = c.releaseLight * power * weight;
    _pos.copy(this._target).setY(0.05);
    this.ctx.bursts?.spawn?.(BurstMode.AIR, _pos, {
      radius: r * 0.1,
      endRadius: r * c.burstReach * power,
      life: c.burstLife,
      intensity: c.burstIntensity * weight,
      opacity: c.burstOpacity * settings.global.opacity,
      fresnel: c.burstFresnel,
      squash: c.burstSquash,
      colorA: getColor(c.colorBurstA),
      colorB: getColor(c.colorBurstB),
      colorC: getColor(c.colorBurstC),
    });
    this.ctx.decals?.spawn?.(DecalType.SHOCKWAVE, _pos, {
      radius: r * power, life: c.decalLife * 0.6, width: c.shockwaveWidth, intensity: c.shockwaveIntensity,
      colorA: getColor(c.coreColor), colorB: getColor(c.accentColor),
    });
    this.ctx.decals?.spawn?.(DecalType.DUSTRING, _pos, {
      radius: r * 0.8 * power, life: c.decalLife, intensity: c.dustIntensity,
      colorA: getColor(c.springColor), colorB: getColor(c.trailColor),
    });
    if (c.impactShake > 0) this.ctx.shake?.add?.(c.impactShake * power * weight, c.shakeDecay, c.shakeFrequency);
    if (c.impactFlash > 0) this.ctx.flash?.trigger?.(getColor(c.accentColor), c.impactFlash * power);
  }

  /* ------------------------------------------------------------------ */
  /* Per-frame presentation                                              */
  /* ------------------------------------------------------------------ */

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
    if (u.uTurbulence) u.uTurbulence.value = 0.3 * g.turbulence;
    if (u.uSizeScale) u.uSizeScale.value = g.particleSize;
    if (u.uSpeedScale) u.uSpeedScale.value = g.particleSpeed;
    if (u.uLifeScale) u.uLifeScale.value = g.particleLifetime;
  }

  /** Rebuild the line and the ribbon from the wake ring buffer, root-local. */
  _syncWake(c, fade) {
    const cap = this._wakePoints.length;
    const count = this._wakeCount;
    const attr = this.wake.geometry.attributes.position;
    for (let i = 0; i < count; i++) {
      const p = this._wakePoints[(this._wakeHead + i) % cap];
      attr.setXYZ(i, p.x - this._target.x, p.y + 0.06, p.z - this._target.z);
    }
    attr.needsUpdate = true;
    this.wake.geometry.setDrawRange(0, count);
    this.wake.material.opacity = c.wakeOpacity * settings.global.opacity * fade;
    this.wake.material.color.copy(getColor(c.trailColor));

    const rg = this.wakeRibbon.geometry;
    const rp = rg.attributes.position;
    const rt = rg.attributes.aT;
    const half = c.wakeWidth * 0.5;
    let length = 0;
    for (let i = 0; i < count; i++) {
      const p = this._wakePoints[(this._wakeHead + i) % cap];
      // Tangent from the neighbours; side is its flat perpendicular.
      _a.copy(this._wakePoints[(this._wakeHead + Math.min(count - 1, i + 1)) % cap]);
      _b.copy(this._wakePoints[(this._wakeHead + Math.max(0, i - 1)) % cap]);
      _a.sub(_b).setY(0);
      if (i > 0) length += _b.distanceTo(p);
      const len = _a.length();
      const sx = len > 1e-5 ? -_a.z / len : 0;
      const sz = len > 1e-5 ? _a.x / len : 0;
      const x = p.x - this._target.x, y = p.y + 0.05, z = p.z - this._target.z;
      rp.setXYZ(i * 2, x - sx * half, y, z - sz * half);
      rp.setXYZ(i * 2 + 1, x + sx * half, y, z + sz * half);
      const t = count > 1 ? i / (count - 1) : 1;
      rt.setX(i * 2, t);
      rt.setX(i * 2 + 1, t);
    }
    rp.needsUpdate = true;
    rt.needsUpdate = true;
    rg.setDrawRange(0, Math.max(0, count - 1) * 6);
    const rs = this._ribbonState;
    rs.clock = this._clock;
    rs.fade = fade;
    rs.span = length / 0.6; // one chevron every 60 cm of walk
    this.ribbonMat.userData.sync(rs);
  }

  _sync(dt) {
    const c = this.config,
      g = settings.global,
      r = c.zoneRadius,
      q = clamp(this._distance / Math.max(0.01, c.maxDistance));
    if (!this._calm) this._clock += dt * g.animationSpeed;
    const clock = this._clock;
    const fadeT = this.phase === 'fade' ? clamp(this.fadeTime / this.fadeDuration) : 0;
    const fade = 1 - fadeT;
    const landing = Easing.outCubic(clamp(this.age / Math.max(0.01, c.landTime)));
    this.root.position.copy(this._target);
    this.position.copy(this._target);

    // 5 · the wake
    this._syncWake(c, fade);

    // The banked direction, or the aim when nothing has been banked.
    const flowLen = Math.hypot(this._flow.x, this._flow.z);
    const fx = flowLen > 0.05 ? this._flow.x / flowLen : this.direction.x;
    const fz = flowLen > 0.05 ? this._flow.z / flowLen : this.direction.z;

    const releaseAge = this.impactTime - c.chargeDuration + (this.phase === 'fade' ? this.fadeTime : 0);
    const waveProgress = clamp(releaseAge / Math.max(0.05, c.releaseWaveLife ?? 0.6));

    // 1 · the dial
    this.field.scale.set(r * 2, r * 2, 1);
    const ds = this._dialState;
    ds.clock = clock;
    ds.charge = q;
    ds.fade = fade * landing;
    ds.dissolve = clamp(fadeT / Math.max(0.05, c.dissolveTime));
    ds.release = this._released && waveProgress < 1 ? waveProgress : -1;
    // The floor quad's uv.y runs along world −Z.
    ds.flowX = fx;
    ds.flowY = -fz;
    this.fieldMat.userData.sync(ds);

    // 2 · the ledger wheels
    this.metal.color.copy(getColor(c.metalColor));
    this.metal.emissive.copy(getColor(c.wheelEmissive));
    this.metal.metalness = c.wheelMetalness;
    this.metal.roughness = c.wheelRoughness;
    this.metal.emissiveIntensity = (0.6 + q * 0.8) * g.glow;
    const wheelTurn = clock * c.wheelSpin * (1 + q * 2);
    for (let i = 0; i < 3; i++) {
      this.rings[i].scale.setScalar(r * (0.55 + i * 0.17));
      this.rings[i].rotation.z = wheelTurn * (i % 2 ? -1.4 : 1);
    }
    this._ringState.opacity = 0.9 * fade * landing;
    this._ringState.clock = clock * (0.5 + q);
    this.ringGlow.userData.sync(this._ringState);

    // 3 · the coils compress with valid banked movement and uncoil only
    //     after release.
    const coilScale = Math.max(0.001, (c.springSize ?? 1) * fade * (this._released ? 1 - 0.8 * waveProgress : 1));
    const compressed = 1 - 0.5 * q;
    const axialScale = this._released ? compressed + (1 - compressed) * waveProgress : compressed;
    this.coilMat.color.copy(getColor(c.springColor ?? '#d98966'));
    this.coilMat.emissiveIntensity = (c.coilGlow + q * c.coilCharge) * g.glow;
    for (let i = 0; i < this.coils.length; i++) {
      this.coils[i].rotation.y = (i * TAU) / 4 + Math.atan2(this.direction.x, this.direction.z);
      this.coils[i].scale.set(coilScale, coilScale, coilScale * axialScale);
    }

    // 7 · the release: rings to the strike radius, and the directional fan
    this._releaseState.opacity = (0.35 + q * 0.45) * (1 - waveProgress) * fade;
    this._releaseState.clock = clock * 3;
    this.releaseGlow.userData.sync(this._releaseState);
    for (let i = 0; i < this.releaseRings.length; i++) {
      const wave = this.releaseRings[i];
      wave.visible = this._released && waveProgress < 1;
      wave.scale.setScalar(r * (i ? 0.12 + waveProgress * 0.88 : 1));
      wave.rotation.z = clock * (i ? 2 : -2);
    }
    this.fan.visible = this._released && waveProgress < 1;
    if (this.fan.visible) {
      this.fan.rotation.y = Math.atan2(fx, fz);
      this.fan.scale.setScalar(r * c.fanReach);
      this._fanState.progress = Easing.outCubic(waveProgress);
      this._fanState.power = 0.5 + q;
      this.fanMat.userData.sync(this._fanState);
    }

    // 4 · glyphs: the orbit and the gauge
    const gs = this._glyphState;
    gs.clock = clock;
    gs.charge = q;
    gs.fade = fade * landing;
    this.glow.userData.sync(gs);
    for (let i = 0; i < MAX_VECTORS; i++) {
      const a = (i * TAU) / MAX_VECTORS + clock * (c.glyphOrbit + q),
        radius = r * (0.42 + (i % 3) * 0.16);
      scratch.position.set(Math.sin(a) * radius, 0.14 + (i % 4) * 0.1, Math.cos(a) * radius);
      scratch.rotation.set(0, a + Math.PI / 2, 0);
      scratch.scale.setScalar((0.5 + q * 0.5) * fade * c.glyphSize);
      scratch.updateMatrix();
      this.vectors.setMatrixAt(i, scratch.matrix);
    }
    this.vectors.instanceMatrix.needsUpdate = true;
    this.gauge.count = Math.min(GAUGE_CELLS, Math.floor(q * GAUGE_CELLS));
    for (let i = 0; i < this.gauge.count; i++) {
      const a = (i * TAU) / GAUGE_CELLS;
      scratch.position.set(Math.sin(a) * r * 0.92, 0.12, Math.cos(a) * r * 0.92);
      scratch.rotation.set(0, a, 0);
      scratch.scale.setScalar(0.16 * fade * c.glyphSize);
      scratch.updateMatrix();
      this.gauge.setMatrixAt(i, scratch.matrix);
    }
    this.gauge.instanceMatrix.needsUpdate = true;

    // 6 · speed motes and the particle look
    const ms = this._moteState;
    ms.clock = clock;
    ms.radius = r;
    ms.charge = q;
    ms.throw = this._released ? waveProgress : 0;
    ms.fade = fade * landing;
    this.moteMat.userData.sync(ms);
    this._syncParticles();

    // 8 · the lens: pinch while banking, a pressure ring at the release
    const ls = this._lensState;
    ls.pinch = this._released ? 0 : q * (this.phase === 'travel' ? 0 : 1);
    ls.shock = this._released && waveProgress < 1 ? 1 - waveProgress : 0;
    ls.wave = Easing.outCubic(waveProgress);
    ls.clock = clock;
    this.lens.visible = !this._calm && (ls.pinch * c.lensStrength + ls.shock * c.lensShock) * g.distortion > 0.002;
    if (this.lens.visible) {
      this.lens.scale.set(r * 2.2, r * 2.2, 1);
      this.lensMat.userData.sync(ls);
    }
  }

  /* ------------------------------------------------------------------ */
  /* Pooling                                                             */
  /* ------------------------------------------------------------------ */

  onDestroy() {
    this._scope = null;
    this.root.visible = false;
    this.fan.visible = false;
    this.lens.visible = false;
    for (const ring of this.releaseRings) ring.visible = false;
    this._distance = 0;
    this._released = false;
    this._wakeCount = 0;
    this.gauge.count = 0;
    this.wake.geometry.setDrawRange(0, 0);
    this.wakeRibbon.geometry.setDrawRange(0, 0);
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

/** Editor helpers that degrade to the dev harness's minimal shim. */
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
  const folder = gui.addFolder('➶  Momentum Ledger');

  const cast = sub(folder, 'The cast');
  R(cast, c, 'range', 1, 30, 0.1, 'max range');
  R(cast, c, 'minRange', 0, 10, 0.1, 'min range');
  R(cast, c, 'speed', 4, 100, 0.5, 'ledger flies at (m/s)');
  R(cast, c, 'lifetime', 0.2, 8, 0.05, 'nominal lifetime (s)');
  R(cast, c, 'cooldown', 0, 15, 0.05, 'cooldown');
  castAnim(cast, c);

  const ledger = sub(folder, 'The ledger');
  R(ledger, c, 'chargeDuration', 0.4, 5, 0.05, 'bank time (s)');
  R(ledger, c, 'maxDistance', 1, 30, 0.1, 'distance cap (m)');
  R(ledger, c, 'maxSpeed', 1, 30, 0.5, 'maximum valid speed (m/s)');
  R(ledger, c, 'zoneRadius', 1, 8, 0.1, 'release radius (m)');
  R(ledger, c, 'baseImpulse', 0, 30, 0.5, 'base impulse');
  R(ledger, c, 'bonusImpulse', 0, 30, 0.5, 'stored impulse');
  R(ledger, c, 'lift', 0, 15, 0.05, 'lift');
  R(ledger, c, 'spin', 0, 8, 0.05, 'tumble');

  const light = sub(folder, 'Light');
  color(light, c, 'lightColor', 'colour');
  R(light, c, 'lightIntensity', 0, 30, 0.1, 'intensity');
  R(light, c, 'lightRadius', 1, 40, 0.1, 'radius');
  R(light, c, 'releaseLight', 0, 20, 0.1, 'punch at the release');

  const dial = sub(folder, '1 · The dial');
  R(dial, c, 'landTime', 0.01, 1.5, 0.01, 'eases in over (s)');
  R(dial, c, 'dialGlow', 0, 6, 0.05, 'glow');
  R(dial, c, 'flowLines', 0, 3, 0.01, 'flow lines');
  R(dial, c, 'tallyGlow', 0, 4, 0.05, 'tally');
  R(dial, c, 'dissolveTime', 0.05, 1, 0.01, 'dissolves over (× fade)');
  color(dial, c, 'accentColor', 'velocity');
  color(dial, c, 'coreColor', 'core');

  const wheels = sub(folder, '2 · The ledger wheels');
  R(wheels, c, 'wheelSpin', 0, 4, 0.05, 'turn rate');
  R(wheels, c, 'wheelMetalness', 0, 1, 0.01, 'metalness');
  R(wheels, c, 'wheelRoughness', 0, 1, 0.01, 'roughness');
  R(wheels, c, 'ringGlow', 0, 6, 0.05, 'lit wheel & release rings');
  color(wheels, c, 'metalColor', 'metal');
  color(wheels, c, 'wheelEmissive', 'metal emissive');

  const coils = sub(folder, '3 · The coils');
  R(coils, c, 'springSize', 0.3, 2, 0.05, 'coil size');
  R(coils, c, 'coilGlow', 0, 3, 0.01, 'glow at rest');
  R(coils, c, 'coilCharge', 0, 3, 0.01, 'extra glow at a full bank');
  color(coils, c, 'springColor', 'charge coils');

  const glyphs = sub(folder, '4 · Glyphs');
  R(glyphs, c, 'glyphGlow', 0, 6, 0.05, 'glow');
  R(glyphs, c, 'glyphOrbit', -3, 3, 0.01, 'orbit speed');
  R(glyphs, c, 'glyphSize', 0.2, 3, 0.01, 'size');

  const wake = sub(folder, '5 · The wake');
  R(wake, c, 'wakeWidth', 0.02, 1.5, 0.01, 'ribbon width (m)');
  R(wake, c, 'wakeGlow', 0, 6, 0.05, 'glow');
  R(wake, c, 'wakeOpacity', 0, 1, 0.01, 'opacity');
  R(wake, c, 'wakeFlow', -8, 8, 0.05, 'chevron flow');
  color(wake, c, 'trailColor', 'trail');

  const fx = sub(folder, '6 · Particles');
  R(fx, c, 'trailInterval', 0.02, 0.5, 0.01, 'streak puff every (s)');
  R(fx, c, 'trailCount', 0, 12, 1, 'streaks per puff');
  R(fx, c, 'trailSize', 0.01, 0.4, 0.005, 'puff streak size');
  R(fx, c, 'trailLife', 0.05, 3, 0.01, 'puff streak life (s)');
  R(fx, c, 'trailSpeed', 0, 6, 0.05, 'puff streak speed');
  R(fx, c, 'trailSpread', 0, 1, 0.01, 'puff spread');
  R(fx, c, 'releaseCount', 0, 128, 1, 'streaks at the release');
  R(fx, c, 'releaseSize', 0.01, 0.5, 0.005, 'release streak size');
  R(fx, c, 'releaseLife', 0.05, 3, 0.01, 'release streak life (s)');
  R(fx, c, 'releaseSpeed', 0, 16, 0.1, 'release streak speed');
  R(fx, c, 'sparkGlow', 0, 6, 0.05, 'streak glow');
  gradient(fx, c, 'colorSpark', 'streak gradient');
  R(fx, c, 'speedLineCount', 0, MAX_MOTES, 1, 'speed motes');
  R(fx, c, 'speedLineSize', 0.005, 0.3, 0.005, 'mote size');
  R(fx, c, 'speedLineGlow', 0, 6, 0.05, 'mote glow');

  const rel = sub(folder, '7 · The release');
  R(rel, c, 'releaseWaveLife', 0.1, 1.2, 0.05, 'release visual time (s)');
  R(rel, c, 'fanSpread', 0.1, 3.1, 0.01, 'wave half-angle (rad)');
  R(rel, c, 'fanReach', 0.2, 3, 0.01, 'wave reach (× radius)');
  R(rel, c, 'fanGlow', 0, 8, 0.05, 'wave glow');
  R(rel, c, 'burstReach', 0, 2, 0.01, 'shell (× radius)');
  R(rel, c, 'burstIntensity', 0, 3, 0.01, 'shell brightness');
  R(rel, c, 'burstLife', 0.05, 3, 0.01, 'shell lives (s)');
  R(rel, c, 'burstOpacity', 0, 1, 0.01, 'shell opacity');
  R(rel, c, 'burstFresnel', 0, 6, 0.05, 'shell rim');
  R(rel, c, 'burstSquash', 0.05, 1.5, 0.01, 'shell squash');
  R(rel, c, 'decalLife', 0.05, 3, 0.01, 'decals last (s)');
  R(rel, c, 'shockwaveWidth', 0.01, 0.4, 0.005, 'shockwave decal width');
  R(rel, c, 'shockwaveIntensity', 0, 3, 0.01, 'shockwave decal brightness');
  R(rel, c, 'dustIntensity', 0, 3, 0.01, 'dust ring brightness');
  color(rel, c, 'colorBurstA', 'shell inner');
  color(rel, c, 'colorBurstB', 'shell mid');
  color(rel, c, 'colorBurstC', 'shell outer');
  R(rel, c, 'impactShake', 0, 1, 0.01, 'camera knock');
  R(rel, c, 'shakeDecay', 0.5, 20, 0.1, 'knock decay');
  R(rel, c, 'shakeFrequency', 1, 40, 0.5, 'knock frequency');
  R(rel, c, 'impactFlash', 0, 1, 0.01, 'flash');

  const lens = sub(folder, '8 · The lens');
  R(lens, c, 'lensStrength', 0, 3, 0.01, 'banking pinch');
  R(lens, c, 'lensShock', 0, 3, 0.01, 'release pressure ring');

  return folder;
}
