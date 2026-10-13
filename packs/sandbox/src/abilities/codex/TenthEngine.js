import { Mesh, PlaneGeometry, Vector3 } from 'three';
import { Ability } from '../Ability.js';
import { createTenthMaterial } from '../../materials/codex/TenthMaterials.js';
import { ParticleShape } from '../../particles/ParticleSystem.js';
import { RateEmitter } from '../../particles/ParticleEngine.js';
import { DecalType } from '../../effects/GroundDecals.js';
import { BurstMode } from '../../effects/BurstSphere.js';
import { LAYER } from '../../core/Layers.js';
import { frame } from '../../core/FrameUniforms.js';
import { settings, castShapeOf, CastShape } from '../../config/settings.js';
import { getColor } from '../../utils/color.js';
import { saturate } from '../../utils/math.js';

/**
 * The tenth castable in an element.
 *
 * Same contract as the Codex spells already in the sandbox: a phase machine
 * on `Ability`, a body drawn with a bespoke shader, a distortion lens, pooled
 * particles, a ground decal, an impact shell, a light and a camera kick.
 * What changes per spell is data — silhouette, motion, palette — read live
 * from `settings[id]` so the editor reshapes a cast that is already out.
 *
 * Motions (line, while the front travels; zone, once it lands):
 *   braid, lance, volley, whip, rain, pendulum,
 *   bloom, cage, geyser, ring, well, crown, deluge
 */

const BODIES = 8;
const TAU = Math.PI * 2;
const _pos = new Vector3();
const _axis = new Vector3();
const _head = new Vector3();
const _emit = {};
const _dir = new Vector3();
const _up = new Vector3(0, 1, 0);

const SHAPES = {
  SOFT: ParticleShape.SOFT,
  SMOKE: ParticleShape.SMOKE,
  STREAK: ParticleShape.STREAK,
  LEAF: ParticleShape.LEAF,
  CHIP: ParticleShape.CHIP,
  RING: ParticleShape.RING,
  BUBBLE: ParticleShape.BUBBLE,
  DROPLET: ParticleShape.DROPLET
};

const DECALS = {
  SCORCH: DecalType.SCORCH,
  RIPPLE: DecalType.RIPPLE,
  CRACK: DecalType.CRACK,
  SHOCKWAVE: DecalType.SHOCKWAVE,
  DUSTRING: DecalType.DUSTRING,
  FOAM: DecalType.FOAM,
  FROST: DecalType.FROST,
  ARC: DecalType.ARC
};

const BURSTS = {
  FIRE: BurstMode.FIRE,
  WATER: BurstMode.WATER,
  AIR: BurstMode.AIR,
  EARTH: BurstMode.EARTH,
  FROST: BurstMode.FROST,
  STORM: BurstMode.STORM
};

function mesh(geometry, material, name, layer) {
  const m = new Mesh(geometry, material);
  m.name = name;
  m.frustumCulled = false;
  m.renderOrder = layer === LAYER.DISTORTION ? 4 : 12;
  m.layers.set(layer);
  m.visible = false;
  return m;
}

export function makeAbility(spec) {
  const Type = class TenthCast extends Ability {
    constructor(ctx) {
      super(spec.id, ctx);
      this.spec = spec;
      this.group.matrixAutoUpdate = true;
    }

    get impactDuration() {
      return this.config.impactTime ?? 0.9;
    }

    get fadeDuration() {
      return this.config.fadeTime ?? 1.35;
    }

    createShaders() {
      this._geo = new PlaneGeometry(2, 2, 1, 1);
      this._bodies = [];
      for (let i = 0; i < BODIES; i++) {
        const material = createTenthMaterial(false);
        const warpMaterial = createTenthMaterial(true);
        const body = mesh(this._geo, material, `${spec.id}:body${i}`, LAYER.VFX);
        const warp = mesh(this._geo, warpMaterial, `${spec.id}:lens${i}`, LAYER.DISTORTION);
        this.group.add(body, warp);
        this._bodies.push({ body, warp, material, warpMaterial });
      }
      this._sealMat = createTenthMaterial(false);
      this._seal = mesh(this._geo, this._sealMat, `${spec.id}:seal`, LAYER.VFX);
      this.group.add(this._seal);
      this._spin = new Float32Array(BODIES);
      this._seed = Math.random() * 100;
      this._slammed = false;
      this._end = new Vector3();
    }

    createParticles() {
      const shape = SHAPES[spec.particle ?? spec.settings?.particle] ?? ParticleShape.SOFT;
      const id = spec.id;
      this._streaks = this.ctx.particles.get(`tenth.${id}.streak`, {
        capacity: 360,
        shape: ParticleShape.STREAK,
        additive: true,
        stretch: true
      });
      this._motes = this.ctx.particles.get(`tenth.${id}.mote`, {
        capacity: 280,
        shape,
        additive: shape !== ParticleShape.SMOKE && shape !== ParticleShape.CHIP && shape !== ParticleShape.LEAF,
        lit: shape === ParticleShape.CHIP || shape === ParticleShape.LEAF,
        softFade: true,
        curl: true
      });
      this._debris = this.ctx.particles.get(`tenth.${id}.debris`, {
        capacity: 220,
        shape: shape === ParticleShape.LEAF ? ParticleShape.LEAF : shape === ParticleShape.DROPLET ? ParticleShape.DROPLET : ParticleShape.CHIP,
        additive: false,
        lit: true,
        softFade: true
      });
      this._trail = new RateEmitter();
      this._mist = new RateEmitter();
    }

    onSpawn() {
      this._slammed = false;
      this._seed = Math.random() * 100;
      this._spin.fill(0);
      this._trail._accumulator = 0;
      this._mist._accumulator = 0;
      this.pointAt(1, this._end);
      this._hideAll();
    }

    onTravel(dt) {
      this.pointAt(1, this._end);
      const zone = castShapeOf(this.element) === CastShape.ZONE;
      if (zone) this._herald(dt);
      else this._formation(this.u, dt, 0);
      this._paint();
      this._trailFx(dt, zone ? this.position : this.position);
    }

    onImpact() {
      this.pointAt(1, this._end);
      this.position.copy(this._end);
      this._slam();
    }

    onFade(dt, t) {
      this._formation(1, dt, t);
      this._paint(1 - saturate((t - 1) / 1));
      if (t < 1.15) this._mistFx(dt, 1 - saturate(t - 0.2));
    }

    onDestroy() {
      this._hideAll();
    }

    /* ------------------------------------------------------------------ */

    _hideAll() {
      for (const b of this._bodies) {
        b.body.visible = false;
        b.warp.visible = false;
      }
      this._seal.visible = false;
    }

    _show(i, pos, axis, heading, radius, spin, fade, style) {
      const b = this._bodies[i];
      const on = fade > 0.02 && radius > 0.02;
      b.body.visible = on;
      b.warp.visible = on;
      if (!on) return;
      this._write(b.material, pos, axis, heading, radius, spin, fade, style, 0);
      this._write(b.warpMaterial, pos, axis, heading, radius * 1.25, spin, fade, style, 0);
    }

    _write(material, pos, axis, heading, radius, spin, fade, style, flat) {
      const u = material.uniforms;
      const c = this.config;
      u.uCentre.value.copy(pos);
      u.uAxis.value.copy(axis);
      u.uHeading.value.copy(heading);
      u.uRadius.value = radius;
      u.uFlat.value = flat;
      u.uSpin.value = spin;
      u.uStyle.value = style;
      u.uBlades.value = c.blades;
      u.uTaper.value = c.taper;
      u.uCurve.value = c.curve;
      u.uHole.value = c.hole;
      u.uHub.value = c.hub;
      u.uSpikes.value = c.spikes;
      u.uTwist.value = c.twist;
      u.uThickness.value = c.thickness;
      u.uNoiseAmt.value = c.noiseAmt;
      u.uEdgeGlow.value = c.edgeGlow;
      u.uBodyOpacity.value = c.bodyOpacity;
      u.uFringe.value = c.fringe;
      u.uRimGlow.value = c.rimGlow;
      u.uSoftFade.value = c.softFade;
      u.uFade.value = fade;
      u.uSeed.value = this._seed;
      u.uWarp.value = c.warp;
      u.uWarpSwirl.value = c.warpSwirl;
      u.uColorA.value.copy(getColor(c.colorA));
      u.uColorB.value.copy(getColor(c.colorB));
      u.uColorC.value.copy(getColor(c.colorC));
    }

    _paint(fadeMul = 1) {
      void fadeMul;
    }

    _herald(dt) {
      const c = this.config;
      const along = this.u;
      this.pointAt(along, _pos);
      _pos.y = c.flightHeight * (1 - along) + 0.4 * along;
      _axis.set(0, 1, 0);
      _head.copy(this.direction);
      const spin = this.age * c.spinSpeed;
      this._show(0, _pos, _axis, _head, c.bodyRadius * (0.45 + 0.55 * along), spin, 1, c.style);
      for (let i = 1; i < BODIES; i++) {
        this._bodies[i].body.visible = false;
        this._bodies[i].warp.visible = false;
      }
      void dt;
    }

    _formation(u, dt, t) {
      const c = this.config;
      const zone = castShapeOf(this.element) === CastShape.ZONE;
      const origin = zone ? this._end : null;
      const motion = c.motion;
      const n = Math.max(1, Math.min(BODIES, c.count | 0));
      const fade = t <= 0 ? 1 : t < 1 ? 1 : Math.max(0, 1 - (t - 1));
      const grow = t <= 0 ? saturate(u) : saturate(t < 1 ? t : 1);
      for (let i = 0; i < BODIES; i++) {
        if (i >= n) {
          this._bodies[i].body.visible = false;
          this._bodies[i].warp.visible = false;
          continue;
        }
        this._spin[i] += dt * c.spinSpeed * (i % 2 === 0 ? 1 : -1);
        this._place(motion, i, n, u, grow, fade, origin);
      }
      this._sealRing(zone, grow, fade);
    }

    _place(motion, i, n, u, grow, fade, origin) {
      const c = this.config;
      const k = n <= 1 ? 0 : i / (n - 1);
      const ang = (i / n) * TAU + this.age * (c.orbit || 0.6);
      const along = saturate(u - (i * c.stagger) / Math.max(0.2, this.length));
      if (!origin) this.pointAt(along, _pos);
      else _pos.copy(origin);

      let y = c.flightHeight;
      let radius = c.bodyRadius * (0.35 + 0.65 * grow);
      let style = c.style;
      const lateral = (k - 0.5) * 2;

      switch (motion) {
        case 'braid': {
          const w = c.braidWidth * Math.sin(saturate(along * this.length / Math.max(0.4, c.spreadIn)) * Math.PI);
          _pos.x += Math.cos(ang + i) * w * 0.35 + this.side.x * Math.sin(along * c.braidPitch + i * 2.1) * w;
          _pos.z += this.side.z * Math.sin(along * c.braidPitch + i * 2.1) * w;
          y = c.flightHeight + Math.cos(along * c.braidPitch + i) * c.braidLift;
          break;
        }
        case 'lance': {
          if (i === 0) {
            radius *= 1.35;
            y = c.flightHeight;
          } else {
            const back = along - i * 0.06;
            if (!origin) this.pointAt(saturate(back), _pos);
            radius *= 0.45;
            style = c.accentStyle;
            y = c.flightHeight * 0.65;
            _pos.addScaledVector(this.side, Math.sin(ang) * 0.25);
          }
          break;
        }
        case 'volley': {
          const spread = (i - (n - 1) / 2) * c.spread;
          _pos.addScaledVector(this.side, spread);
          y = c.flightHeight + Math.sin(along * Math.PI) * c.arcHeight;
          style = i % 2 ? c.accentStyle : c.style;
          break;
        }
        case 'whip': {
          const wave = Math.sin(along * c.braidPitch * 3 + this.age * 6 - i * 0.45);
          _pos.addScaledVector(this.side, wave * c.braidWidth);
          y = c.flightHeight + i * 0.05;
          radius *= 0.7 + 0.3 * (1 - k);
          break;
        }
        case 'rain':
        case 'deluge': {
          const span = motion === 'deluge' ? (c.zoneRadius || 4) : c.braidWidth;
          const rx = Math.cos(i * 2.3 + this._seed) * span * (0.3 + 0.7 * k);
          const rz = Math.sin(i * 1.7 + this._seed) * span * 0.85;
          if (origin) _pos.set(origin.x + rx, 0, origin.z + rz);
          else {
            this.pointAt(saturate(k * 0.85 + 0.1), _pos);
            _pos.addScaledVector(this.side, rx * 0.25);
          }
          const fall = saturate(grow * 1.2 - k * 0.35);
          y = c.lift * (1 - fall) + 0.15;
          style = c.accentStyle;
          radius *= 0.55;
          break;
        }
        case 'pendulum': {
          const swing = Math.sin(this.age * (2.2 + c.orbit) - i * 0.4);
          if (!origin) this.pointAt(0.55 + 0.4 * u, _pos);
          _pos.addScaledVector(this.side, swing * c.braidWidth * (i === 0 ? 1 : 0.45));
          y = c.flightHeight + Math.cos(this.age * 2.2) * 0.25;
          if (i > 0) {
            radius *= 0.4;
            style = c.accentStyle;
          }
          break;
        }
        case 'bloom': {
          const rad = (c.zoneRadius || 4) * (0.25 + 0.75 * grow);
          _pos.x += Math.cos(ang) * rad * (0.35 + 0.5 * k);
          _pos.z += Math.sin(ang) * rad * (0.35 + 0.5 * k);
          y = 0.2 + grow * c.lift * (0.4 + 0.6 * (1 - k));
          break;
        }
        case 'cage': {
          const rad = (c.zoneRadius || 4) * 0.92;
          _pos.x += Math.cos((i / n) * TAU) * rad;
          _pos.z += Math.sin((i / n) * TAU) * rad;
          y = grow * c.lift;
          radius = c.bodyRadius * (0.4 + grow);
          style = i % 2 ? c.style : c.accentStyle;
          _axis.set(Math.cos((i / n) * TAU), 0.15, Math.sin((i / n) * TAU));
          break;
        }
        case 'geyser': {
          if (i === 0) {
            y = grow * c.lift;
            radius = c.bodyRadius * (0.8 + grow * 0.6);
            style = c.style;
          } else {
            const rad = (c.zoneRadius || 3) * (0.2 + 0.5 * (1 - grow) + 0.15 * k);
            _pos.x += Math.cos(ang + i) * rad;
            _pos.z += Math.sin(ang + i) * rad;
            y = 0.3 + grow * c.lift * k;
            radius *= 0.42;
            style = c.accentStyle;
          }
          break;
        }
        case 'ring': {
          const rad = (c.zoneRadius || 4) * (0.25 + grow);
          _pos.x += Math.cos(ang) * rad;
          _pos.z += Math.sin(ang) * rad;
          y = c.flightHeight * (0.35 + 0.2 * Math.sin(ang * 2));
          break;
        }
        case 'well': {
          const rad = (c.zoneRadius || 4) * (1.05 - grow * 0.75);
          _pos.x += Math.cos(ang * 1.4) * rad;
          _pos.z += Math.sin(ang * 1.4) * rad;
          y = 0.3 + (1 - grow) * 0.4 + k * 0.5;
          style = i % 2 ? c.accentStyle : c.style;
          break;
        }
        case 'crown': {
          const rad = (c.zoneRadius || 4) * (0.55 + 0.2 * Math.sin(this.age * 2));
          const drop = saturate(grow);
          _pos.x += Math.cos((i / n) * TAU + this.age * 0.4) * rad * (1.15 - drop * 0.4);
          _pos.z += Math.sin((i / n) * TAU + this.age * 0.4) * rad * (1.15 - drop * 0.4);
          y = c.lift * (1 - drop) + 0.35;
          break;
        }
        default: {
          y = c.flightHeight;
          break;
        }
      }

      if (motion !== 'cage') _axis.set(0, 1, 0);
      _pos.y = y;
      _head.copy(this.direction);
      if (_head.lengthSq() < 1e-6) _head.set(0, 0, 1);
      this._show(i, _pos, _axis, _head, radius, this._spin[i], fade, style);
      void lateral;
    }

    _sealRing(zone, grow, fade) {
      if (!zone) {
        this._seal.visible = false;
        return;
      }
      const c = this.config;
      const radius = Math.max(0.4, (c.zoneRadius || 4) * (0.3 + grow));
      _pos.copy(this._end);
      _pos.y = 0.04;
      this._seal.visible = fade > 0.02;
      this._write(this._sealMat, _pos, _up, this.direction, radius, this.age * 0.6, fade * 0.9, 2, 1);
    }

    _slam() {
      if (this._slammed) return;
      this._slammed = true;
      const c = this.config;
      const g = settings.global;
      const centre = this._end;
      const R = castShapeOf(this.element) === CastShape.ZONE ? (c.zoneRadius || 4) : Math.max(1.6, c.bodyRadius * 3);
      const decal = DECALS[c.decal] ?? DecalType.SHOCKWAVE;
      const burst = BURSTS[c.burst] ?? BurstMode.AIR;
      this.ctx.decals.spawn(decal, centre, {
        radius: R * 1.15,
        life: c.decalLife,
        intensity: 1.15,
        growth: 0.35,
        colorA: getColor(c.colorA),
        colorB: getColor(c.colorB),
        height: 0.03
      });
      this.ctx.decals.spawn(DecalType.SHOCKWAVE, centre, {
        radius: R * 1.4 * g.explosionIntensity,
        life: c.decalLife * 0.7,
        width: 0.05,
        intensity: 1.1,
        colorA: getColor(c.colorB),
        colorB: getColor(c.colorC),
        height: 0.04
      });
      this.ctx.bursts.spawn(burst, _pos.copy(centre).setY(0.3), {
        radius: R * 0.25,
        endRadius: R * c.burstScale * g.explosionIntensity,
        life: c.burstLife,
        intensity: 1.6,
        opacity: 0.72 * g.opacity,
        squash: c.burstSquash,
        colorA: getColor(c.colorB),
        colorB: getColor(c.colorA)
      });
      this.ctx.shake.add(c.impactShake * g.cameraShake * g.explosionIntensity, 6, 16);
      this.ctx.flash.trigger(getColor(c.colorB), c.impactFlash * g.explosionIntensity);
      this.lightBoost = c.lightPunch;
      this._burstFx(centre, R);
    }

    _emit(system, count, position, radius, direction, speed, spread, size, life) {
      if (count <= 0) return;
      _emit.position = position;
      _emit.radius = radius;
      _emit.direction = direction;
      _emit.speed = speed;
      _emit.speedVariance = 0.35;
      _emit.spread = spread;
      _emit.inherit = null;
      _emit.anchor = position;
      _emit.size = size * settings.global.particleSize;
      _emit.sizeVariance = 0.4;
      _emit.life = life * settings.global.particleLifetime;
      _emit.lifeVariance = 0.3;
      _emit.spin = 2;
      _emit.tint = null;
      _emit.time = frame.uTime.value;
      system.emit(count, _emit);
    }

    _colors(system) {
      const c = this.config;
      system.setGradient(getColor(c.colorA), getColor(c.colorB), getColor(c.colorC), getColor(c.colorB));
    }

    _trailFx(dt, position) {
      const c = this.config;
      const count = Math.round(this._trail.tick(dt, c.trailRate) * settings.global.particleCount);
      if (count <= 0) return;
      this._colors(this._streaks);
      _dir.copy(this.direction);
      this._emit(this._streaks, count, position, 0.2, _dir, c.trailSpeed, 0.4, c.trailSize, c.trailLife);
    }

    _mistFx(dt, amount) {
      const c = this.config;
      const count = Math.round(this._mist.tick(dt, c.mistRate * amount) * settings.global.particleCount);
      if (count <= 0) return;
      this._colors(this._motes);
      _dir.set(0, 1, 0);
      this._emit(this._motes, count, this._end, (c.zoneRadius || 2) * 0.5, _dir, 1.5, 0.8, c.mistSize, c.mistLife);
    }

    _burstFx(centre, R) {
      const c = this.config;
      this._colors(this._debris);
      this._colors(this._motes);
      _dir.set(0, 1, 0);
      const n = Math.round(c.burstCount * settings.global.particleCount);
      this._emit(this._debris, n, centre, R * 0.3, _dir, 6, 0.85, c.debrisSize, 1.1);
      this._emit(this._motes, Math.round(n * 0.7), centre, R * 0.15, _dir, 3.5, 1, c.mistSize, 0.9);
    }
  };

  Object.defineProperty(Type, 'name', { value: spec.className });
  Type.tenth = true;
  return Type;
}

const NUM = [
  ['range', 4, 60, 0.1, 'max range'],
  ['minRange', 0, 12, 0.1, 'min range'],
  ['speed', 4, 80, 0.5, 'front (m/s)'],
  ['cooldown', 0, 8, 0.05, 'cooldown'],
  ['zoneRadius', 0.5, 16, 0.1, 'circle (m)'],
  ['count', 1, 8, 1, 'bodies'],
  ['style', 0, 9, 1, 'silhouette'],
  ['accentStyle', 0, 9, 1, 'secondary silhouette'],
  ['bodyRadius', 0.1, 4, 0.01, 'body radius'],
  ['flightHeight', 0.1, 4, 0.01, 'height'],
  ['blades', 2, 12, 1, 'blades / ticks'],
  ['taper', 0.1, 4, 0.01, 'taper'],
  ['curve', -3, 4, 0.01, 'sweep'],
  ['thickness', 0.05, 1, 0.01, 'thickness'],
  ['hole', 0, 0.6, 0.005, 'hole'],
  ['hub', 0, 0.8, 0.005, 'hub'],
  ['spikes', 0, 16, 1, 'detail'],
  ['twist', 0, 12, 0.1, 'twist'],
  ['noiseAmt', 0, 1.5, 0.01, 'noise'],
  ['edgeGlow', 0, 12, 0.05, 'edge glow'],
  ['bodyOpacity', 0, 1, 0.01, 'body'],
  ['fringe', 0, 3, 0.01, 'fringe'],
  ['spinSpeed', -40, 40, 0.1, 'spin'],
  ['braidWidth', 0, 6, 0.01, 'width'],
  ['braidPitch', 0.2, 14, 0.1, 'pitch'],
  ['braidLift', 0, 3, 0.01, 'lift weave'],
  ['arcHeight', 0, 6, 0.01, 'arc'],
  ['lift', 0.2, 10, 0.05, 'rise'],
  ['spread', 0, 3, 0.01, 'volley gap'],
  ['stagger', 0, 2, 0.01, 'stagger (m)'],
  ['orbit', 0, 4, 0.01, 'orbit'],
  ['warp', 0, 2, 0.01, 'lens'],
  ['impactShake', 0, 2, 0.01, 'shake'],
  ['impactFlash', 0, 2, 0.01, 'flash'],
  ['lightIntensity', 0, 40, 0.1, 'light'],
  ['lightRadius', 1, 30, 0.1, 'light radius'],
  ['trailRate', 0, 400, 1, 'trail / s']
];

export function buildTenthEditor(gui, c, Editor, spec) {
  const folder = gui.addFolder(`${spec.meta.label}`);
  const R = Editor.range;
  const cast = folder.addFolder('Cast');
  for (const [key, a, b, step, name] of NUM) {
    if (typeof c[key] !== 'number') continue;
    if (key === 'zoneRadius' && spec.meta.cast !== 'zone') continue;
    R(cast, c, key, a, b, step, name);
  }
  Editor.castAnimation(cast, c);
  const look = folder.addFolder('Colour');
  if (c.colorA) look.addColor(c, 'colorA').name('body');
  if (c.colorB) look.addColor(c, 'colorB').name('edge');
  if (c.colorC) look.addColor(c, 'colorC').name('fringe');
  if (c.lightColor) look.addColor(c, 'lightColor').name('light');
  folder.close();
}
