import { BufferGeometry, Float32BufferAttribute, Mesh, PlaneGeometry, Quaternion, Vector3 } from 'three';
import { Ability } from '../Ability.js';
import { DetailLayer } from './DetailLayer.js';
import { RigHero } from './RigHero.js';
import { createSpellBodyGeometry } from './PureBodyGeometries.js';
import { LineTrail } from './LineTrail.js';
import { createCrosscutGustPieceGeometry, createCrosscutGustHeroGeometry } from '../../assets/codex/CrosscutGustGeometry.js';
import {
  createCrosscutGustBodyMaterial,
  createCrosscutGustLensMaterial,
  createCrosscutGustGroundMaterial,
  createCrosscutGustVoiceMaterial,
  createCrosscutGustDetailMaterial,
  createCrosscutGustTrailMaterial,
  createCrosscutGustScarMaterial,
  createCrosscutWindMaterial,
  createCrosscutScourMaterial,
  createCrosscutCoreMaterial
} from '../../materials/codex/CrosscutGustMaterials.js';
import { ParticleShape } from '../../particles/ParticleSystem.js';
import { RateEmitter } from '../../particles/ParticleEngine.js';
import { DecalType } from '../../effects/GroundDecals.js';
import { BurstMode } from '../../effects/BurstSphere.js';
import { LAYER } from '../../core/Layers.js';
import { frame } from '../../core/FrameUniforms.js';
import { settings } from '../../config/settings.js';
import { getColor } from '../../utils/color.js';
import { saturate, lerp, Easing } from '../../utils/math.js';

export const ID = 'crosscut';

const TWIST = 'hinge';
const ARCH = 'pendulum';
const HIT = 'swing';
const CARRY = 'none';
const WHEN = 'travel';
const ECHO = null;
const OFFSET = false;
const DISSOLVE_TRAVEL = false;
const COUNTER = false;
const ZONE = false;
const LIFT = 1;
const SLICE = true;

const _emit = {};
const _pos = new Vector3();
const _dir = new Vector3();
const _end = new Vector3();
const _focus = new Vector3();
const _body = new Vector3();
const _up = new Vector3(0, 1, 0);

/** Felled bodies one cast can keep marked at once. */
const MAX_MARKS = 12;

const _gp = new Vector3();
const _fwd = new Vector3();
const _lat = new Vector3();
const _q = new Quaternion();
const _qa = new Quaternion();
const _axisX = new Vector3(1, 0, 0);
const _axisZ = new Vector3(0, 0, 1);
const TAU = Math.PI * 2;
const PI = Math.PI;
const outBack = (t) => {
  const k = 1.70158;
  const x = t - 1;
  return 1 + (k + 1) * x * x * x + k * x * x;
};

/* ------------------------------------------------------------------ */
/* Cast-local geometry for the upgrade. It lives here, not in the      */
/* generated `CrosscutGustGeometry.js`, which must stay byte-identical to   */
/* its rig recipe (tests/pure-rigs.test.mjs).                         */
/* ------------------------------------------------------------------ */
/** Grid of (cols+1)×(rows+1) vertices from `point(u, v)` → [x, y, z], with aU/aV attributes. */
function sheet(cols, rows, point) {
  const pos = [];
  const au = [];
  const av = [];
  const index = [];
  for (let j = 0; j <= rows; j++) {
    for (let i = 0; i <= cols; i++) {
      const u = i / cols;
      const v = j / rows;
      const p = point(u, v);
      pos.push(p[0], p[1], p[2]);
      au.push(u);
      av.push(v);
    }
  }
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      const a = j * (cols + 1) + i;
      const b = a + 1;
      const c = a + cols + 1;
      const d = c + 1;
      index.push(a, c, b, b, c, d);
    }
  }
  const g = new BufferGeometry();
  g.setAttribute('position', new Float32BufferAttribute(pos, 3));
  g.setAttribute('aU', new Float32BufferAttribute(au, 1));
  g.setAttribute('aV', new Float32BufferAttribute(av, 1));
  g.setIndex(index);
  g.computeVertexNormals();
  g.computeBoundingSphere();
  return g;
}

/**
 * The gust front — hero of the upgraded cast's travel. A breaking wave of
 * air: a sheet that rises off the floor, leans forward and curls over into a
 * lip, bowed into a crescent across its width (the middle leads) and lower at
 * its two horns. Unit size: x ∈ [-1, 1] across, y ∈ [0, ~1] up, the lip
 * reaching ~0.55 forward (+Z). `aU` runs across (0..1), `aV` from the floor
 * (0) over the curl to the lip (1).
 */
export function createCrosscutFrontGeometry({ curl = 3.6, bow = 0.35 } = {}) {
  const N = 40;
  const prof = [[0, 0]];
  let z = 0;
  let y = 0;
  const ds = 1.45 / N;
  for (let k = 1; k <= N; k++) {
    const t = k / N;
    const a = curl * t * t; // 0 = straight up; past π/2 it leans over; past π it falls back down
    z += Math.sin(a) * ds;
    y += Math.cos(a) * ds;
    prof.push([z, y]);
  }
  const top = Math.max(...prof.map((p) => p[1]));
  return sheet(36, N, (u, v) => {
    const x = u * 2 - 1;
    // The crest peaks off-centre, so the wave reads as a diagonal cut, not a dome.
    const horn = Math.max(0, 1 - Math.pow((x - 0.3) / 1.3, 2)) * Math.sqrt(Math.max(0, 1 - Math.pow(Math.abs(x), 6)));
    const f = v * N;
    const k = Math.min(N - 1, Math.floor(f));
    const w = f - k;
    const pz = prof[k][0] + (prof[k + 1][0] - prof[k][0]) * w;
    const py = prof[k][1] + (prof[k + 1][1] - prof[k][1]) * w;
    return [x, (py / top) * (0.35 + 0.65 * horn), pz / top * (0.5 + 0.5 * horn) + bow * (1 - x * x)];
  });
}

/**
 * The rotor — what the front becomes when it breaks: a horizontal roll of
 * wind, three helical ribbons wound round the X axis (x ∈ [-1, 1]), radius 1
 * at the middle tapering to the ends. `aU` runs along the axis, `aV` across a
 * ribbon. Spin it about X and it rolls.
 */
export function createCrosscutRotorGeometry({ ribbons = 3, turns = 1.6, width = 1.1 } = {}) {
  const parts = [];
  for (let k = 0; k < ribbons; k++) {
    parts.push(sheet(56, 5, (u, v) => {
      const x = u * 2 - 1;
      const r = Math.max(0.06, Math.pow(Math.max(0, 1 - Math.pow(Math.abs(x), 5)), 0.5)) * (0.82 + 0.18 * Math.cos(u * PI * 3 + k));
      const th = (k / ribbons) * PI * 2 + turns * PI * x + (v - 0.5) * width;
      const rr = r * (1 - 0.12 * Math.abs(v - 0.5));
      return [x, Math.sin(th) * rr, Math.cos(th) * rr];
    }));
  }
  // Merge.
  const pos = [];
  const au = [];
  const av = [];
  const index = [];
  let base = 0;
  for (const g of parts) {
    pos.push(...g.getAttribute('position').array);
    au.push(...g.getAttribute('aU').array);
    av.push(...g.getAttribute('aV').array);
    for (const i of g.getIndex().array) index.push(i + base);
    base += g.getAttribute('position').count;
    g.dispose();
  }
  const g = new BufferGeometry();
  g.setAttribute('position', new Float32BufferAttribute(pos, 3));
  g.setAttribute('aU', new Float32BufferAttribute(au, 1));
  g.setAttribute('aV', new Float32BufferAttribute(av, 1));
  g.setIndex(index);
  g.computeVertexNormals();
  g.computeBoundingSphere();
  return g;
}

/**
 * The roll's body: a closed tube along X (x ∈ [-1, 1], radius 1 at the middle,
 * pinched at the ends), lumpy so it never reads as a cylinder. `aU` along the
 * axis, `aV` round it.
 */
export function createCrosscutCoreGeometry() {
  return sheet(40, 28, (u, v) => {
    const x = u * 2 - 1;
    const a = v * PI * 2;
    const r = Math.max(0.05, Math.pow(Math.max(0, 1 - Math.pow(Math.abs(x), 4)), 0.5)) * (0.9 + 0.1 * Math.sin(a * 3 + x * 4));
    return [x, Math.sin(a) * r, Math.cos(a) * r];
  });
}

/**
 * CROSSCUT GUST — wind, line cast.
 *
 * Wind — a gust hinged at the hand cuts across the cast.
 *
 * The gust is a hinge at the hand. It cuts across, not along, and the far side takes the load.
 *
 * The read is `hinge`: hit timing `travel`, blow `swing`.
 *
 * ## Layers
 *
 *   1. **body** — the hinge placement, in its own shader.
 *   2. **lens** — the same placement into the distortion buffer.
 *   3. **ground** — a filled wind field under the strip the head has crossed: it lands behind a hot lip on the beat, holds through the linger with the element's pattern carved in, cools and breaks up; a filled residue decal outlives the cast.
 *   4. **voice** — a bore riding alongside the body, spun with the cast.
 *   5. **detail** — an InstancedMesh of the cast's own authored piece (`createCrosscutGustPieceGeometry`); each piece folds part by part as the cast rises and beats.
 *   6. **hero** — one larger authored rig (`createCrosscutGustHeroGeometry`), stood by its archetype (pendulum): hinged at the hand, swung across the cast.
 *      Hero and pieces are energy: emissive over a dark body with a fresnel shell (LAYER.VFX). The rig is framed to the body height (`heroMinSpan`) and kept under `heroMaxHeight`.
 *   7. **shed** — dust, streaks, chips and motes on RateEmitters.
 *   8. **aftershock** — a second, smaller beat when the fade starts.
 *   9. **bodies** — `handlesOwnHits`: the gust is a hinge at the hand. It cuts across, not along, and the far side takes the load.
 *  10. **mark** — a felled body is scoured pale: `corrode` stains it toward the
 *      element's look over `markTime` and it sheds motes for `markLife`.
 *
 * The cast leaves the fist in a flare of sparks (`handFlare`, `handSparks`).
 *
 * ## The upgrade — a gust you can see
 *
 * The template layers above (ribbon sweep at the caster, voice, floor grid,
 * rig, pieces, trail) are off by default (their opacity/count sliders still
 * work). The cast now reads through its own layers:
 *
 *  11. **the gust front** (`createCrosscutFrontGeometry`,
 *      `createCrosscutWindMaterial('front')`) — a breaking wave of air
 *      `frontWidth` × `frontHeight` metres that runs down the line with the
 *      hit front: it rises off the floor, leans over and curls into a white
 *      lip, bowed into a crescent; a translucent torn body (deep teal low,
 *      saturated teal, pale mint, white lip) with flow streaks racing up and
 *      over the curl. Its face *crosses* as it runs — skewed from
 *      `-frontSkew` to `+frontSkew` — the same way the blow it deals swings
 *      across the line (the kill direction is unchanged).
 *  12. **the rotor** (`createCrosscutRotorGeometry`, `…('rotor')`) — on the
 *      beat the front breaks over the group and rolls up into a horizontal
 *      roll of wind (`rotorLength` × `rotorRadius`): three helical ribbons
 *      spinning about an axis across the line, drifting and swaying, debris
 *      thrown round it; on the exit it unwinds (swells, tears apart).
 *  13. **leaves and grit** — a lit LEAF system (`crosscut.leaf`) shed off
 *      the curl and flung tangentially off the rotor so they ride the roll.
 *  14. **the scoured floor** (`createCrosscutScourMaterial`) — a filled strip
 *      behind the front combed by two crossing families of streaks (the
 *      crosscut, written into the ground), fresh dust right behind the front,
 *      and a spiral eddy scoured where it broke that keeps turning through
 *      the linger; erodes on the exit.
 *
 * Every metre, rate and colour is read from `settings.crosscut` each frame.
 * A cast only captures a seed, an integrated spin and the break time.
 */
export class CrosscutGustAbility extends Ability {
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
    this.bodyGeometry = createSpellBodyGeometry(ID);
    this.voiceGeometry = new PlaneGeometry(1, 1, 64, 8);
    this.groundGeometry = new PlaneGeometry(1, 1, 1, 1);
    this.bodyMaterial = createCrosscutGustBodyMaterial();
    this.lensMaterial = createCrosscutGustLensMaterial();
    this.groundMaterial = createCrosscutGustGroundMaterial();
    this.voiceMaterial = createCrosscutGustVoiceMaterial();
    this.detailMaterial = createCrosscutGustDetailMaterial();
    this.heroMaterial = createCrosscutGustDetailMaterial(true);
    this.detail = new DetailLayer(createCrosscutGustPieceGeometry(), this.detailMaterial);
    this.group.add(this.detail.mesh);
    this.rig = new RigHero(createCrosscutGustHeroGeometry(), this.heroMaterial, ARCH, ZONE);
    this.group.add(this.rig.mesh);
    this.body = this._mesh(this.bodyGeometry, this.bodyMaterial, LAYER.VFX, 12);
    this.voice = this._mesh(this.voiceGeometry, this.voiceMaterial, LAYER.VFX, 13);
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
      voiceSpin: 0,
      open: 1,
      beat: 0,
      grow: 1,
      along: 0,
      seed: 0,
      fade: 1,
      dissolve: 0,
      phrase: 0,
      foot: 1,
      footWidth: 1,
      groundCenter: new Vector3(),
      land: 0,
      pre: 0,
      heat: 0,
      erode: 0,
      pulse: 1
    };
    this._seed = 0;
    this._settled = false;
    this._spin = 0;
    this._hits = 0;
    this._echoed = false;
    this._struck = [];
    this._carried = [];
    this._parts = Array.from({ length: 12 }, () => ({ armed: true }));
    this._force = { impulse: 0, lift: 0, spin: 0 };
    this._flow = { vx: 0, vy: 0, vz: 0 };
    this._field = (x, y, z, out) => out.set(this._flow.vx, this._flow.vy, this._flow.vz);
    this._found = [];
    this._marks = Array.from({ length: MAX_MARKS }, () => ({ dummy: null, time: 0, emitter: new RateEmitter() }));
    this._markCount = 0;
    this._look = { color: '#000000', rimColor: '#000000', rimEmissive: 0, edgeColor: '#000000', edgeEmissive: 0, edgeWidth: 0 };
    this.trailMaterial = createCrosscutGustTrailMaterial();
    this.scarMaterial = createCrosscutGustScarMaterial();
    this.trail = new LineTrail(TWIST, this.trailMaterial, this.scarMaterial);
    this.trail.onWake = (point, lane, s) => this._wake(point, lane, s);
    this.group.add(this.trail.scarMesh, this.trail.trailMesh);

    // The upgrade's own layers: the gust front, the rotor, the scoured floor.
    this.frontGeometry = createCrosscutFrontGeometry();
    this.frontMaterial = createCrosscutWindMaterial('front');
    this.gustFront = this._mesh(this.frontGeometry, this.frontMaterial, LAYER.VFX, 11);
    this.rotorGeometry = createCrosscutRotorGeometry();
    this.rotorMaterial = createCrosscutWindMaterial('rotor');
    this.rotor = this._mesh(this.rotorGeometry, this.rotorMaterial, LAYER.VFX, 11);
    // The roll's body: a dark translucent churn under the ribbons.
    this.coreGeometry = createCrosscutCoreGeometry();
    this.coreMaterial = createCrosscutCoreMaterial();
    this.core = this._mesh(this.coreGeometry, this.coreMaterial, LAYER.VFX, 10);
    this.scourGeometry = new PlaneGeometry(1, 1, 1, 1).rotateX(-Math.PI / 2);
    this.scourMaterial = createCrosscutScourMaterial();
    this.scour = this._mesh(this.scourGeometry, this.scourMaterial, LAYER.VFX, 2);
    this._breakAt = -1;
    this._rotorTurn = 0;
    this._eddyTurn = 0;
    this._fadeT = 0;
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
    this.dust = particles.get('crosscut.dust', {
      capacity: 900,
      shape: ParticleShape.SMOKE,
      additive: false,
      curl: true,
      softFade: 0.65
    });
    this.streaks = particles.get('crosscut.streak', {
      capacity: 1200,
      shape: ParticleShape.STREAK,
      additive: true,
      stretch: true,
      softFade: 0.2
    });
    this.chips = particles.get('crosscut.chip', {
      capacity: 500,
      shape: ParticleShape.CHIP,
      additive: false,
      lit: true,
      softFade: 0.15
    });
    this.motes = particles.get('crosscut.mote', {
      capacity: 600,
      shape: ParticleShape.SOFT,
      additive: true,
      softFade: 0.2
    });
    this.dustEmitter = new RateEmitter();
    this.streakEmitter = new RateEmitter();
    this.chipEmitter = new RateEmitter();
    this.moteEmitter = new RateEmitter();
    this.leaves = particles.get('crosscut.leaf', {
      capacity: 700,
      shape: ParticleShape.LEAF,
      additive: false,
      lit: true,
      softFade: 0.15
    });
    this.leafEmitter = new RateEmitter();
  }

  get impactDuration() {
    return Math.max(0.05, settings[ID].impactTime * settings.global.lifetime);
  }

  get fadeDuration() {
    return Math.max(0.1, settings[ID].fadeTime * settings.global.lifetime);
  }

  lightShimmer() {
    const f = settings[ID].lightFlicker;
    return 1 - f + f * Math.sin(this.age * 10.00);
  }

  onSpawn() {
    this._seed = Math.random() * 10;
    this._spin = Math.random() * Math.PI * 2;
    this._hits = 0;
    this._echoed = false;
    this._settled = false;
    this._struck.length = 0;
    this._carried.length = 0;
    for (let i = 0; i < this._parts.length; i++) this._parts[i].armed = true;
    this.dustEmitter.reset();
    this.streakEmitter.reset();
    this.chipEmitter.reset();
    this.moteEmitter.reset();
    this.detail.reseed(this._seed);
    this.trail.reset();
    this.detail.hide();
    this.rig.hide();
    this.body.visible = false;
    this.voice.visible = false;
    this.lens.visible = false;
    this.ground.visible = false;
    this._releaseMarks();
    this._breakAt = -1;
    this._rotorTurn = 0;
    this._eddyTurn = 0;
    this._fadeT = 0;
    this.leafEmitter.reset();
    this.gustFront.visible = false;
    this.rotor.visible = false;
    this.core.visible = false;
    this.scour.visible = false;
    this._palette();
    this._hand();
    if (ZONE) this._telegraph();
  }

  /** The cast leaves the fist: a small flare, a spray of sparks along the aim, motes left hanging. */
  _hand() {
    const c = settings[ID];
    const g = settings.global;
    _pos.copy(this.origin).addScaledVector(this.direction, c.handForward).addScaledVector(this.side, c.handSide);
    _pos.y = c.handHeight;
    if (c.handFlare > 0.01) {
      this.ctx.bursts.spawn(BurstMode.AIR, _pos, {
        radius: 0.05,
        endRadius: c.handFlare,
        life: 0.22,
        intensity: 0.6,
        opacity: 0.4 * g.opacity,
        squash: 1,
        colorA: getColor(c.colorBurstA),
        colorB: getColor(c.colorBurstB),
        colorC: getColor(c.colorBurstC)
      });
    }
    const sparks = Math.round(c.handSparks * g.particleCount);
    if (sparks > 0) {
      this._fillEmit(_pos, 0.08, this.direction, c.streakSpeed * 1.2, 0.5, 0.06, c.streakLife * 0.8, 2);
      this.streaks.emit(sparks, _emit);
    }
    const motes = Math.round(c.handMotes * g.particleCount);
    if (motes > 0) {
      this._fillEmit(_pos, 0.15, _up, c.moteSpeed * 0.5, 0.9, 0.08, c.moteLife, 1);
      this.motes.emit(motes, _emit);
    }
  }

  _focusPoint(out) {
    if (ZONE) return this.pointAt(1, out);
    return this.pointAt(this.u, out);
  }

  _aim(out) {
    this._focusPoint(out);
    if (OFFSET) out.addScaledVector(this.side, settings[ID].thickness * 4);
    return out;
  }

  _pose(committed, fadeT) {
    const u = this.u;
    
    
    let grow;
    let open;
    let along;
    along = committed ? 1 : u; grow = 1; open = 1;
    let dissolve = 0;
    if (committed && fadeT >= 1) dissolve = saturate((fadeT - 1) * 1.15);
    else if (DISSOLVE_TRAVEL && !committed) dissolve = saturate(u * 0.55);
    const fade = committed && fadeT >= 1 ? 1 - (fadeT - 1) : 1;
    const phrase = committed ? (fadeT < 1 ? 1 : 2) : 0;
    this._groundPose(committed, fadeT);
    this._write(open, grow, along, dissolve, fade, phrase);
  }

  /**
   * The floor's own clock. Before the beat a zone shows its footprint faintly
   * and a line lays its strip behind the head; on the beat the field lands out
   * to the rim over `groundLand` seconds (a line's strip is already down),
   * hot; it cools through the fade and breaks up over its last stretch. The
   * residue decal outlives it.
   */
  _groundPose(committed, fadeT) {
    const c = settings[ID];
    const st = this._state;
    if (!committed) {
      st.land = 1;
      st.pre = 0;
      st.heat = 0.85;
      st.erode = 0;
      return;
    }
    st.land = 1;
    st.pre = 0;
    st.heat = fadeT < 1 ? 1 - 0.3 * fadeT : 0.7 * (1 - saturate((fadeT - 1) * 1.5));
    st.erode = fadeT < 1 ? 0 : saturate((fadeT - 1.4) / 0.6);
  }

  _write(open, grow, along, dissolve, fade, phrase) {
    const c = settings[ID];
    const g = settings.global;
    const st = this._state;
    this._focusPoint(_focus);
    st.center.copy(_focus);
    st.origin.copy(this.origin);
    st.dir.copy(this.direction);
    st.side.copy(this.side);
    st.radius = ZONE ? Math.max(0.2, c.zoneRadius) : Math.max(0.2, c.sweep);
    st.length = Math.max(0.2, this.length);
    st.height = c.height * g.shaderIntensity;
    st.thickness = c.thickness;
    st.count = Math.max(1, c.count);
    st.spin = this._spin;
    st.voiceSpin = this._spin * (COUNTER ? -1.35 : 1);
    st.open = open * (0.35 + Math.max(0, c.lean));
    st.beat = open;
    st.grow = grow;
    st.along = along;
    st.seed = this._seed;
    st.fade = fade;
    st.dissolve = dissolve;
    st.phrase = phrase;
    st.foot = ZONE ? c.zoneRadius * 2 : Math.max(0.4, this.front);
    st.footWidth = ZONE ? c.zoneRadius * 2 : c.groundWidth;
    // A zone's field sits on the circle; a line's covers the strip already crossed.
    if (ZONE) st.groundCenter.copy(_focus);
    else st.groundCenter.copy(this.origin).addScaledVector(this.direction, st.foot * 0.5);
    st.pulse = 1 + c.bodyPulse * Math.sin(this.age * c.bodyPulseRate);
    this.bodyMaterial.userData.sync(st);
    this.lensMaterial.userData.sync(st);
    this.groundMaterial.userData.sync(st);
    this.voiceMaterial.userData.sync(st);
    this.detailMaterial.userData.sync(st);
    this.heroMaterial.userData.sync(st);
    this.trailMaterial.userData.sync(st, this.trail, this._travelTime());
    this.scarMaterial.userData.sync(st, this.trail, this._travelTime());
    this.trail.show(this.isActive);
    this.detail.update(TWIST, ZONE, st, c, this.age);
    this.rig.update(st, c, this.age);
    const show = fade > 0.02 && (grow > 0.02 || open > 0.02);
    this.body.visible = show && c.bodyOpacity > 0.01;
    this.voice.visible = show && c.voiceOpacity > 0.01;
    this.lens.visible = show && c.lensWarp > 0.01;
    this.ground.visible = c.groundOpacity > 0.01 && st.erode < 0.99 && (st.land > 0.001 || st.pre > 0.01);
    if (c.trailOpacity <= 0.01 && c.scarOpacity <= 0.01) this.trail.show(false);
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
    sync(this.motes, c.colorMoteA, c.colorMoteB, c.colorMoteC, c.colorMoteD, c.moteSize, 1.6 * g.glow, 0.5);
    this.motes.uniforms.uOpacity.value = 0.9 * g.opacity;
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
      this._fillEmit(_end, ZONE ? c.zoneRadius * 0.35 : 0.3, _dir, c.dustSpeed, 0.45, 0.45, c.dustLife, 0.4);
      for (let i = 0; i < dustN; i++) {
        const ang = this._spin + i * 0.7;
        _dir.copy(this.direction).addScaledVector(this.side, Math.random() - 0.5).setY(0.15);
        _emit.direction = _dir;
        this.dust.emit(1, _emit);
      }
    }
    const streakN = Math.round(this.streakEmitter.tick(dt, c.streakRate * strength) * g.particleCount);
    if (streakN > 0) {
      this._fillEmit(_end, 0.2, _dir, c.streakSpeed, 0.22, 0.08, c.streakLife, 2);
      for (let i = 0; i < streakN; i++) {
        const ang = this._spin * 1.7 + i;
        _dir.copy(this.side).multiplyScalar(Math.random() < 0.5 ? -1.4 : 1.4).setY(0.05);
        _emit.direction = _dir;
        this.streaks.emit(1, _emit);
      }
    }
    const chipN = Math.round(this.chipEmitter.tick(dt, c.chipRate * strength) * g.particleCount);
    if (chipN > 0) {
      this._fillEmit(_end, 0.16, _dir, c.chipSpeed, 0.4, 0.08, c.chipLife, 6);
      for (let i = 0; i < chipN; i++) {
        const ang = this._spin + i * 1.3;
        _dir.set(Math.cos(ang), 0.7, Math.sin(ang));
        _emit.direction = _dir;
        this.chips.emit(1, _emit);
      }
    }
    this._motes(dt, strength);
  }

  /** Motes drift off whichever detail pieces are standing. */
  _motes(dt, strength) {
    const c = settings[ID];
    const g = settings.global;
    const n = Math.round(this.moteEmitter.tick(dt, c.moteRate * strength * (this.detail.live / Math.max(1, c.detailCount))) * g.particleCount);
    if (n <= 0) return;
    const count = Math.round(c.detailCount);
    for (let k = 0; k < n; k++) {
      const pick = Math.floor(Math.random() * count);
      if (!this.detail.pointOf(pick, _pos)) continue;
      _dir.set((Math.random() - 0.5) * 0.6, 1, (Math.random() - 0.5) * 0.6);
      this._fillEmit(_pos, 0.12, _dir, c.moteSpeed, 0.5, 0.08, c.moteLife, 1);
      this.motes.emit(1, _emit);
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
    this._mark(dummy);
  }

  /** Start a felled body wearing the element. */
  _mark(dummy) {
    if (this._markCount >= MAX_MARKS) return;
    const slot = this._marks[this._markCount++];
    slot.dummy = dummy;
    slot.time = 0;
    slot.emitter.reset();
  }

  /** Stain the marked bodies toward the element's look and keep them shedding. */
  _updateMarks(dt) {
    if (this._markCount === 0) return;
    const c = settings[ID];
    const g = settings.global;
    const look = this._look;
    look.color = c.colorMarkBody;
    look.rimColor = c.colorMarkRim;
    look.rimEmissive = c.markRimGlow;
    look.edgeColor = c.colorMarkEdge;
    look.edgeEmissive = c.markEdgeGlow;
    look.edgeWidth = c.markEdgeWidth;
    for (let i = 0; i < this._markCount; i++) {
      const slot = this._marks[i];
      const dummy = slot.dummy;
      if (!dummy || dummy.finished) continue;
      slot.time += dt;
      dummy.corrode(saturate(slot.time / Math.max(0.02, c.markTime)) * c.markAmount, look);
      const left = 1 - saturate(slot.time / Math.max(0.05, c.markLife * g.lifetime));
      if (left <= 0) continue;
      const n = Math.round(slot.emitter.tick(dt, c.markMotes * left) * g.particleCount);
      if (n <= 0) continue;
      const at = dummy.bodyPoint?.(_body) ?? _body.copy(dummy.position).setY(0.9);
      this._fillEmit(at, 0.3, _up, c.moteSpeed, 0.7, 0.08, c.moteLife, 1);
      this.motes.emit(n, _emit);
    }
  }

  _releaseMarks() {
    for (let i = 0; i < this._markCount; i++) this._marks[i].dummy = null;
    this._markCount = 0;
  }


  _killDir() {
    const ang = lerp(-settings[ID].sweep, settings[ID].sweep, saturate(this._state.along));
    _dir.copy(this.direction).multiplyScalar(Math.cos(ang)).addScaledVector(this.side, Math.sin(ang));
  }

  _blow(dummy, mode) {
    const c = settings[ID];
    const g = settings.global;
    if (mode && mode !== HIT) this._killEcho(dummy, mode);
    else this._killDir(dummy);
    this._force.impulse = c.hitImpulse * g.explosionIntensity;
    this._force.lift = c.hitLift * g.explosionIntensity * LIFT;
    if (mode === 'up') this._force.lift *= 1.4;
    this._force.spin = c.hitSpin;
    if (dummy.kill(_dir.x, _dir.z, this._force, SLICE || mode === 'swing')) this._remember(dummy);
  }

  _killEcho(dummy, mode) {
    this._aim(_focus);
    if (mode === 'up') {
      _dir.copy(this.direction).multiplyScalar(0.2);
      return;
    }
    _dir.set(dummy.position.x - _focus.x, 0, dummy.position.z - _focus.z);
    if (_dir.lengthSq() < 1e-4) _dir.copy(this.direction);
    else _dir.normalize();
    if (mode === 'in') _dir.multiplyScalar(-1);
    if (mode === 'tangent') {
      const x = _dir.x;
      _dir.set(-_dir.z, 0, x);
    }
  }

  _gather(x, z, radius, mode) {
    const field = this.ctx.dummies;
    if (!field?.findTargets) return;
    const found = field.findTargets(x, z, radius, this._found);
    for (let i = 0; i < found.length; i++) {
      const dummy = found[i];
      if (this._already(dummy)) continue;
      this._blow(dummy, mode);
    }
    this._found.length = 0;
  }


  _head(i, n) {
    return saturate(this.u * n - i);
  }

  _partPoint(i, n, out) {
    const c = settings[ID];
    const lane = ((i + 0.5) / n - 0.5) * 2 * c.sweep;
    const s = (i + 0.5) / n;
    return this.pointAt(s, out).addScaledVector(this.side, lane);
  }

  _strikeParts(forceAll) {
    const c = settings[ID];
    const n = Math.max(1, Math.min(12, Math.round(c.count)));
    for (let i = 0; i < n; i++) {
      if (!forceAll && this._head(i, n) < 0.98) continue;
      if (!this._parts[i].armed) continue;
      this._parts[i].armed = false;
      this._partPoint(i, n, _end);
      this._gather(_end.x, _end.z, Math.max(0.45, c.thickness * 4 + 0.5));
    }
  }

  _strike(forceAll) {
    const c = settings[ID];
    if (WHEN === 'part') {
      this._strikeParts(forceAll);
      return;
    }
    if (WHEN === 'late' && this.u < 0.42 && !forceAll) return;
    this._aim(_end);
    const reach = ZONE ? Math.max(c.zoneRadius, c.hitRadius) : Math.max(0.35, c.hitRadius);
    this._gather(_end.x, _end.z, reach);
  }

  _echo() {
    if (!ECHO) return;
    const c = settings[ID];
    this._aim(_end);
    const reach = (ZONE ? Math.max(c.zoneRadius, c.hitRadius) : c.hitRadius) * 1.15;
    this._gather(_end.x, _end.z, reach, ECHO);
    this.ctx.flash.trigger(getColor(c.colorFlash), c.impactFlash * 0.45 * settings.global.explosionIntensity);
    this.ctx.shake.add(c.impactShake * 0.4 * settings.global.cameraShake, 6, 16);
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
      const inward = CARRY === 'in' ? 1 : CARRY === 'out' ? -1 : 0.25;
      const spin = CARRY === 'orbit' ? 4.2 : 1.15;
      const lift = CARRY === 'up' ? 7 : 1.3;
      this._flow.vx = (dx / d) * inward * 6 * c.sweep + (-dz / d) * spin;
      this._flow.vz = (dz / d) * inward * 6 * c.sweep + (dx / d) * spin;
      this._flow.vy = lift * fade;
      dummy.carry(this._field, grab, grab, CARRY === 'up' ? 0.35 : 0);
    }
  }

  _telegraph() {
    const c = settings[ID];
    this.pointAt(1, _end);
    this.ctx.decals.spawn(DecalType.DUSTRING, _end, {
      radius: Math.max(0.4, c.zoneRadius) * 0.85,
      life: Math.max(0.4, c.shockLife),
      width: 0.05,
      intensity: 0.45,
      colorA: getColor(c.colorShockA),
      colorB: getColor(c.colorShockB),
      height: 0.02
    });
  }

  /**
   * The beat lands as a hit, not a pop: shake, flash and a light punch, a
   * burst, real fragments thrown up and out with dust rolled along
   * the floor, and a filled residue decal sized to the strip that stays on the
   * floor after the cast is gone. The thin shock ring is only a trace now (`shockRing`).
   */
  _beat() {
    const c = settings[ID];
    const g = settings.global;
    const power = g.explosionIntensity;
    this._aim(_end);
    this.ctx.shake.add(c.impactShake * power * g.cameraShake, 4, 18);
    this.ctx.flash.trigger(getColor(c.colorFlash), c.impactFlash * power);
    this.lightBoost = c.impactLight * power;
    if (c.burstOpacity > 0.01) {
      this.ctx.bursts.spawn(BurstMode.AIR, _pos.copy(_end).setY(Math.max(0.4, c.height * 0.35)), {
        radius: 0.35,
        endRadius: c.burstRadius * power,
        life: c.burstLife,
        intensity: 0.85,
        opacity: c.burstOpacity * g.opacity,
        squash: 0.38,
        colorA: getColor(c.colorBurstA),
        colorB: getColor(c.colorBurstB),
        colorC: getColor(c.colorBurstC)
      });
    }
    this._debris(_end);
    this.ctx.decals.spawn(DecalType.SCORCH, _end, {
      radius: Math.max(0.5, c.groundWidth * c.groundStainReach) * power,
      life: c.groundLife * g.lifetime,
      width: 0.8,
      intensity: c.groundStain,
      colorA: getColor(c.colorGroundStain),
      colorB: getColor(c.colorGroundA),
      height: 0.025
    });
    this.ctx.decals.spawn(DecalType.DUSTRING, _end, {
      radius: c.shockRadius * (ZONE ? 1 : 0.65) * power,
      life: c.shockLife,
      width: 0.08,
      intensity: 1,
      colorA: getColor(c.colorShockA),
      colorB: getColor(c.colorShockB),
      height: 0.03
    });
    if (c.shockRing > 0.01) {
      this.ctx.decals.spawn(DecalType.SHOCKWAVE, _end, {
        radius: c.shockRadius * 0.8,
        life: c.shockLife * 0.75,
        width: 0.08,
        intensity: 0.85 * c.shockRing,
        colorA: getColor(c.colorShockB),
        colorB: getColor(c.colorShockA),
        height: 0.03
      });
    }
  }

  /** Fragments thrown up and out of the strike, and dust rolled out along the floor. */
  _debris(at) {
    const c = settings[ID];
    const g = settings.global;
    const spread = ZONE ? c.zoneRadius * 0.4 : 0.5;
    _pos.copy(at).setY(0.15);
    const chips = Math.round(c.impactChips * g.particleCount * g.explosionIntensity);
    if (chips > 0) {
      this._fillEmit(_pos, spread, _up, c.chipSpeed * 1.5, 0.8, c.chipSize * 1.4, c.chipLife * 1.3, 8);
      this.chips.emit(chips, _emit);
    }
    const dust = Math.round(c.impactDust * g.particleCount);
    for (let i = 0; i < dust; i++) {
      const ang = (i / Math.max(1, dust)) * Math.PI * 2 + this._spin;
      _dir.set(Math.cos(ang), 0.12, Math.sin(ang));
      this._fillEmit(_pos, spread * 0.6, _dir, c.dustSpeed * 1.8, 0.25, 0.6, c.dustLife * 1.4, 0.4);
      this.dust.emit(1, _emit);
    }
  }

  /** The smaller second beat: a low dust roll settling over the field, a thud and a last flare of light. */
  _aftershock() {
    const c = settings[ID];
    const g = settings.global;
    const power = g.explosionIntensity;
    this._aim(_end);
    this.ctx.shake.add(c.aftershockShake * power * g.cameraShake, 3, 12);
    this.lightBoost += c.aftershockLight * power;
    this.ctx.decals.spawn(DecalType.DUSTRING, _end, {
      radius: c.aftershockRadius * power,
      life: c.aftershockLife,
      width: 0.06,
      intensity: 0.55,
      colorA: getColor(c.colorGroundB),
      colorB: getColor(c.colorGroundA),
      height: 0.03
    });
  }

  /** Seconds the head takes over the whole line — the trail's clock. */
  _travelTime() {
    return Math.max(0.05, this.length / Math.max(1, settings[ID].speed * settings.global.speed));
  }

  /** Where the head crosses each `wakeSpacing` metre: a dustring decal and a few chips. */
  _wake(point, lane, s) {
    const c = settings[ID];
    const g = settings.global;
    _pos.copy(point).setY(0);
    this.ctx.decals.spawn(DecalType.DUSTRING, _pos, {
      radius: c.wakeRadius * (0.8 + 0.4 * Math.random()),
      life: c.wakeLife * g.lifetime,
      width: 0.08,
      intensity: 0.75,
      colorA: getColor(c.colorScarA),
      colorB: getColor(c.colorB),
      height: 0.03
    });
    const chips = Math.round(c.wakeChips * g.particleCount);
    if (chips > 0) {
      this._fillEmit(_pos.setY(0.1), 0.25, _up, c.chipSpeed * 0.6, 0.8, c.chipSize, c.chipLife, 3);
      this.chips.emit(chips, _emit);
    }
  }

  onTravel(dt) {
    const c = settings[ID];
    const g = settings.global;
    this._spin += dt * c.spinSpeed * g.animationSpeed;
    this._fadeT = 0;
    this._pose(false, 0);
    this._palette();
    this._shed(dt, 0.35 + 0.65 * this._state.grow);
    this.trail.tick(dt, this._state.along, this._state, c.wakeSpacing);
    if (WHEN === 'travel' || WHEN === 'part' || WHEN === 'late') this._strike(false);
    this._gust(dt);
    this._updateMarks(dt);
    this.ctx.shake.rumble(0.035 * c.impactShake * g.cameraShake, dt);
  }

  onImpact() {
    this._beat();
    if (WHEN === 'commit' || WHEN === 'part') this._strike(true);
  }

  onFade(dt, t) {
    const c = settings[ID];
    const g = settings.global;
    const fade = t < 1 ? 1 : 1 - (t - 1);
    this._spin += dt * c.spinSpeed * g.animationSpeed * 0.40;
    this._fadeT = t;
    if (this._breakAt < 0) this._breakAt = this.age;
    this._pose(true, t);
    this._palette();
    this._shed(dt, fade * 0.7);
    this.trail.tick(dt, 1, this._state, c.wakeSpacing);
    if (WHEN === 'return') this._strike(false);
    this._gust(dt);
    if (!this._settled && t > c.aftershockAt) {
      this._settled = true;
      this._aftershock();
    }
    if (ECHO && !this._echoed && t > 1.08) {
      this._echoed = true;
      this._echo();
    }
    this._drag(dt, fade);
    this._updateMarks(dt);
  }

  onDestroy() {
    this._releaseMarks();
    for (let i = 0; i < this._carried.length; i++) this._carried[i].release?.();
    this._carried.length = 0;
    this.body.visible = false;
    this.voice.visible = false;
    this.lens.visible = false;
    this.ground.visible = false;
    this.detail.hide();
    this.rig.hide();
    this.trail.hide();
    this.gustFront.visible = false;
    this.rotor.visible = false;
    this.core.visible = false;
    this.scour.visible = false;
  }

  /* ------------------------------------------------------------------ */
  /* The upgrade: the gust front, the rotor, leaves, the scoured floor   */
  /* ------------------------------------------------------------------ */

  /** Point `_fwd` along the line turned by `yaw` about the vertical, `_lat` across it. */
  _frame(yaw) {
    _fwd.copy(this.direction).applyAxisAngle(_up, yaw);
    _lat.crossVectors(_fwd, _up).normalize();
  }

  _gust(dt) {
    const c = settings[ID];
    const g = settings.global;
    const life = Math.max(0.05, g.lifetime);
    const broke = this._breakAt >= 0;
    const tau = broke ? this.age - this._breakAt : 0;
    const crash = broke ? saturate(tau / Math.max(0.05, c.crashTime)) : 0;
    const W = Math.max(0.2, c.frontWidth * 0.5);
    const H = Math.max(0.2, c.frontHeight);
    const leafRate = c.leafRate;
    let leafFrom = 0; // 0 none, 1 front curl, 2 rotor
    this._syncLeaves();

    // --- the front: runs with the hit front, its face crossing as it goes ---
    if (crash < 0.999 && c.frontOpacity > 0.01) {
      const along = broke ? 1 : this.u;
      const skew = c.frontSkew * (2 * along - 1) * (broke ? 1 + crash * 0.4 : 1);
      this._frame(skew);
      this.pointAt(along, _gp);
      _gp.addScaledVector(_fwd, broke ? crash * c.crashLunge : 0);
      _gp.addScaledVector(_fwd, -H * 0.35);
      _gp.y = 0;
      // Basis: local X across (lat), Y up, Z forward; the break pitches it over its base.
      _q.setFromAxisAngle(_up, Math.atan2(_fwd.x, _fwd.z));
      _qa.setFromAxisAngle(_axisX, crash * c.crashPitch);
      _q.multiply(_qa);
      this.gustFront.position.copy(_gp);
      this.gustFront.quaternion.copy(_q);
      const squash = 1 - crash * 0.45;
      const grow = broke ? 1 : outBack(saturate(this.age / Math.max(0.02, c.frontGrow)));
      this.gustFront.scale.set(W * grow, H * squash * grow, H * c.frontDepth * grow);
      this.gustFront.visible = true;
      this.frontMaterial.userData.sync(Math.max(crash, 0), this._seed);
      leafFrom = 1;
    } else {
      this.gustFront.visible = false;
    }

    // --- the rotor: the front rolled up over the group, rolling, swaying, unwinding ---
    if (broke && c.rotorOpacity > 0.01) {
      const grow = outBack(saturate(tau / Math.max(0.05, c.rotorGrow)));
      const exit = saturate((this._fadeT - c.rotorExitAt) / Math.max(0.05, 1.95 - c.rotorExitAt));
      const slow = Math.exp(-tau / Math.max(0.1, c.rotorSpinDown * life));
      this._rotorTurn += dt * c.rotorSpin * g.animationSpeed * (0.35 + 0.65 * slow);
      const sway = Math.sin(tau * c.rotorSwayRate) * c.rotorSway;
      this._frame(c.frontSkew + sway * 0.6);
      this.pointAt(1, _gp);
      _gp.addScaledVector(this.direction, c.rotorDrift * (1 - Math.exp(-tau * 0.9)));
      _gp.addScaledVector(this.side, sway);
      const R = Math.max(0.1, c.rotorRadius) * grow * (1 + exit * 0.6);
      _gp.y = R * 1.02 + c.rotorLift * exit;
      // Axis across the heading (local X along _lat), rolling forward about it.
      _q.setFromAxisAngle(_up, Math.atan2(_fwd.x, _fwd.z));
      _qa.setFromAxisAngle(_axisX, this._rotorTurn);
      _q.multiply(_qa);
      this.rotor.position.copy(_gp);
      this.rotor.quaternion.copy(_q);
      this.rotor.scale.set(Math.max(0.1, c.rotorLength * 0.5) * (0.6 + 0.4 * grow), R, R);
      this.rotor.visible = exit < 0.99;
      this.rotorMaterial.userData.sync(exit, this._seed + 3);
      this.core.position.copy(_gp);
      this.core.quaternion.copy(_q);
      this.core.scale.copy(this.rotor.scale).multiplyScalar(c.coreSize);
      this.core.scale.x = this.rotor.scale.x;
      this.core.visible = this.rotor.visible && c.coreOpacity > 0.01;
      this.coreMaterial.userData.sync(exit, this._seed + 5);
      if (this.rotor.visible) leafFrom = 2;
    } else {
      this.rotor.visible = false;
      this.core.visible = false;
    }

    // --- leaves: shed off the curl, or flung round the roll ---
    const n = Math.round(this.leafEmitter.tick(dt, leafFrom ? leafRate * (leafFrom === 2 ? 1 : 0.7) : 0) * g.particleCount);
    for (let k = 0; k < n; k++) {
      if (leafFrom === 1) {
        const x = (Math.random() * 2 - 1) * W * 0.9;
        _pos.copy(this.gustFront.position).addScaledVector(_lat, x).addScaledVector(_fwd, H * 0.25);
        _pos.y = H * (0.55 + 0.4 * Math.random());
        _dir.copy(_fwd).multiplyScalar(1.2).setY(0.6);
      } else {
        const a = Math.random() * TAU;
        const x = (Math.random() * 2 - 1) * c.rotorLength * 0.45;
        const R = this.rotor.scale.y;
        _pos.copy(this.rotor.position).addScaledVector(_lat, x).addScaledVector(_fwd, Math.cos(a) * R);
        _pos.y += Math.sin(a) * R;
        // Tangent of a forward roll about the lateral axis.
        _dir.copy(_fwd).multiplyScalar(-Math.sin(a)).setY(Math.cos(a));
      }
      this._fillEmit(_pos, 0.15, _dir, c.leafSpeed, 0.35, c.leafSize, c.leafLife, 6);
      this.leaves.emit(1, _emit);
    }

    // --- the scoured floor ---
    const erode = saturate((this._fadeT - c.scourErodeAt) / Math.max(0.05, 2 - c.scourErodeAt));
    if (c.scourOpacity > 0.01 && erode < 0.99) {
      const u = this.scourMaterial.uniforms;
      u.uOrigin.value.set(this.origin.x, this.origin.z);
      u.uDir.value.set(this.direction.x, this.direction.z);
      u.uFront.value = this.front;
      u.uLength.value = this.length;
      this._eddyTurn += dt * c.eddySpin * g.animationSpeed * (broke ? Math.exp(-tau / Math.max(0.1, c.rotorSpinDown * life * 1.5)) * 0.8 + 0.2 : 0);
      u.uEddySpin.value = this._eddyTurn;
      this.pointAt(1, _gp);
      u.uEddy.value.set(_gp.x, _gp.z, broke ? tau : -1);
      this.scour.position.copy(this.origin).addScaledVector(this.direction, this.length * 0.5 + c.eddyRadius * 0.5);
      this.scour.position.y = 0.02;
      this.scour.rotation.set(0, Math.atan2(this.direction.x, this.direction.z), 0);
      const w = Math.max(c.scourWidth * 1.3, c.eddyRadius * 2.2);
      this.scour.scale.set(w, 1, this.length + c.eddyRadius * 2.5);
      this.scourMaterial.userData.sync(erode);
      this.scour.visible = this.front > 0.05;
    } else {
      this.scour.visible = false;
    }
  }

  _syncLeaves() {
    const c = settings[ID];
    const g = settings.global;
    const p = this.leaves;
    p.setGradient(getColor(c.colorLeafA), getColor(c.colorLeafB), getColor(c.colorLeafC), getColor(c.colorLeafD));
    p.uniforms.uSizeScale.value = c.leafSize * g.particleSize * 7;
    p.uniforms.uLifeScale.value = g.particleLifetime;
    p.uniforms.uSpeedScale.value = g.particleSpeed;
    p.uniforms.uOpacity.value = g.opacity;
    p.uniforms.uGlow.value = 1;
    p.uniforms.uGravity.value.set(0, -c.leafFall, 0);
  }

  dispose() {
    this.frontGeometry.dispose();
    this.frontMaterial.dispose();
    this.rotorGeometry.dispose();
    this.rotorMaterial.dispose();
    this.coreGeometry.dispose();
    this.coreMaterial.dispose();
    this.scourGeometry.dispose();
    this.scourMaterial.dispose();
    this.trail.dispose();
    this.trailMaterial.dispose();
    this.scarMaterial.dispose();
    this.detail.dispose();
    this.rig.dispose();
    this.detailMaterial.dispose();
    this.heroMaterial.dispose();
    this.bodyGeometry.dispose();
    this.voiceGeometry.dispose();
    this.groundGeometry.dispose();
    this.bodyMaterial.dispose();
    this.lensMaterial.dispose();
    this.groundMaterial.dispose();
    this.voiceMaterial.dispose();
    super.dispose();
  }
}

export function buildEditor(gui, c, Editor) {
  const folder = gui.addFolder('Crosscut Gust');
  const R = Editor.range;

  const cast = folder.addFolder('The cast');
  R(cast, c, 'range', 4, 40, 0.1, 'max range');
  R(cast, c, 'minRange', 0, 12, 0.1, 'min range');
  R(cast, c, 'speed', 2, 60, 0.5, 'travel (m/s)');
  R(cast, c, 'cooldown', 0, 8, 0.05, 'cooldown');
  R(cast, c, 'impactTime', 0.05, 3, 0.01, 'impact (s)');
  R(cast, c, 'fadeTime', 0.05, 4, 0.01, 'fade (s)');
  
  Editor.castAnimation(cast, c);

  const hand = folder.addFolder('0 · Hand');
  R(hand, c, 'handForward', -0.5, 2, 0.01, 'forward (m)');
  R(hand, c, 'handSide', -1, 1, 0.01, 'side (m)');
  R(hand, c, 'handHeight', 0.2, 2.5, 0.01, 'height (m)');
  R(hand, c, 'handFlare', 0, 3, 0.01, 'flare (m)');
  R(hand, c, 'handSparks', 0, 120, 1, 'sparks');
  R(hand, c, 'handMotes', 0, 80, 1, 'motes');

  const shape = folder.addFolder('1 · Shape — hinge');
  R(shape, c, 'count', 1, 16, 1, 'count');
  R(shape, c, 'height', 0.2, 10, 0.05, 'height (m)');
  R(shape, c, 'thickness', 0.02, 2, 0.01, 'thickness (m)');
  R(shape, c, 'sweep', 0, 8, 0.05, 'reach');
  R(shape, c, 'lean', 0, 3, 0.01, 'lean');

  const motion = folder.addFolder('2 · Timing');
  R(motion, c, 'spinSpeed', -20, 20, 0.1, 'spin (rad/s)');
  R(motion, c, 'lifetime', 0.1, 5, 0.05, 'hold (s)');

  const look = folder.addFolder('3 · Body');
  R(look, c, 'bodyOpacity', 0, 2, 0.01, 'opacity');
  R(look, c, 'bodyGlow', 0, 4, 0.01, 'body glow');
  R(look, c, 'edgeGlow', 0, 10, 0.05, 'edge glow');
  R(look, c, 'softFade', 0.01, 2, 0.01, 'soft fade (m)');
  R(look, c, 'bodyPulse', 0, 1, 0.01, 'pulse');
  R(look, c, 'bodyPulseRate', 0, 20, 0.1, 'pulse rate');
  R(look, c, 'lensWarp', 0, 3, 0.01, 'lens warp');
  look.addColor(c, 'colorA').name('edge');
  look.addColor(c, 'colorB').name('core');
  look.addColor(c, 'colorC').name('deep');

  const voice = folder.addFolder('4 · Voice');
  R(voice, c, 'voiceOpacity', 0, 2, 0.01, 'opacity');
  voice.addColor(c, 'colorVoiceA').name('voice');
  voice.addColor(c, 'colorVoiceB').name('voice, hot');

  const floor = folder.addFolder('5 · Ground');
  R(floor, c, 'groundWidth', 0.2, 16, 0.05, 'width (m)');
  R(floor, c, 'groundGlow', 0, 6, 0.05, 'glow');
  R(floor, c, 'groundLife', 0.1, 12, 0.05, 'residue life (s)');
  R(floor, c, 'groundOpacity', 0, 2, 0.01, 'opacity');
  R(floor, c, 'groundHeat', 0, 4, 0.05, 'heat');
  R(floor, c, 'groundCoat', 0, 1, 0.01, 'stain .. coat');
  
  R(floor, c, 'groundStain', 0, 1.5, 0.01, 'residue');
  R(floor, c, 'groundStainReach', 0.1, 2, 0.01, 'residue reach');
  floor.addColor(c, 'colorGroundA').name('ground');
  floor.addColor(c, 'colorGroundB').name('ground, deep');
  floor.addColor(c, 'colorGroundStain').name('stain');

  const pieces = folder.addFolder('6 · Detail pieces');
  R(pieces, c, 'detailCount', 0, 48, 1, 'count');
  R(pieces, c, 'detailSize', 0.05, 2, 0.01, 'size (m)');
  R(pieces, c, 'detailSizeJitter', 0, 1, 0.01, 'size jitter');
  R(pieces, c, 'detailSpread', 0.1, 2, 0.01, 'spread');
  R(pieces, c, 'detailLift', 0, 8, 0.05, 'lift (m)');
  R(pieces, c, 'detailSpin', -4, 4, 0.05, 'orbit');
  R(pieces, c, 'detailGlow', 0, 6, 0.05, 'rim glow');
  R(pieces, c, 'detailOpacity', 0, 1.5, 0.01, 'opacity');
  R(pieces, c, 'detailSwing', 0, 2.5, 0.01, 'fold');
  R(pieces, c, 'detailEdge', 0, 4, 0.05, 'arris light');
  R(pieces, c, 'detailDeep', 0, 1, 0.01, 'colour depth');
  pieces.addColor(c, 'colorDetailA').name('rim');
  pieces.addColor(c, 'colorDetailB').name('lit');
  pieces.addColor(c, 'colorDetailC').name('shade');

  const hero = folder.addFolder('7 · Hero rig');
  R(hero, c, 'heroSize', 0.2, 8, 0.05, 'size (m)');
  R(hero, c, 'heroReach', 0.1, 1.4, 0.01, 'ring fit');
  R(hero, c, 'heroLift', 0, 8, 0.05, 'travel (m)');
  R(hero, c, 'heroSpin', -4, 4, 0.05, 'turn');
  R(hero, c, 'heroSwing', 0, 2.5, 0.01, 'fold');
  R(hero, c, 'heroGlow', 0, 6, 0.05, 'rim glow');
  R(hero, c, 'heroEdge', 0, 4, 0.05, 'arris light');
  R(hero, c, 'heroOpacity', 0, 1.5, 0.01, 'opacity');
  R(hero, c, 'heroDeep', 0, 1, 0.01, 'colour depth');
  R(hero, c, 'heroMaxHeight', 1, 12, 0.05, 'max height (m)');
  R(hero, c, 'heroMinSpan', 0, 6, 0.05, 'min span (m)');
  hero.addColor(c, 'colorHeroA').name('rim');
  hero.addColor(c, 'colorHeroB').name('lit');
  hero.addColor(c, 'colorHeroC').name('shade');

  const parts = folder.addFolder('8 · Shed');
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

  const motes = folder.addFolder('9 · Motes');
  R(motes, c, 'moteRate', 0, 200, 1, 'motes / s');
  R(motes, c, 'moteSize', 0.01, 0.4, 0.005, 'size');
  R(motes, c, 'moteSpeed', 0, 10, 0.1, 'speed');
  R(motes, c, 'moteLife', 0.1, 4, 0.05, 'life');
  Editor.gradient(motes, c, 'colorMote', 'mote colour');

  const beat = folder.addFolder('10 · The beat');
  R(beat, c, 'impactShake', 0, 2, 0.01, 'camera punch');
  R(beat, c, 'impactFlash', 0, 1, 0.01, 'flash');
  beat.addColor(c, 'colorFlash').name('flash');
  R(beat, c, 'burstRadius', 0, 12, 0.05, 'burst (m)');
  R(beat, c, 'burstLife', 0.05, 3, 0.01, 'burst life');
  R(beat, c, 'burstOpacity', 0, 1.5, 0.01, 'burst opacity');
  R(beat, c, 'impactChips', 0, 200, 1, 'fragments');
  R(beat, c, 'impactDust', 0, 120, 1, 'dust roll');
  beat.addColor(c, 'colorBurstA').name('burst, hot');
  beat.addColor(c, 'colorBurstB').name('burst, body');
  beat.addColor(c, 'colorBurstC').name('burst, deep');
  R(beat, c, 'shockRadius', 0, 16, 0.05, 'decal (m)');
  R(beat, c, 'shockLife', 0.05, 3, 0.01, 'decal life');
  R(beat, c, 'shockRing', 0, 1.5, 0.01, 'shock ring');
  beat.addColor(c, 'colorShockA').name('decal');
  beat.addColor(c, 'colorShockB').name('decal, hot');

  const after = folder.addFolder('11 · Aftershock');
  R(after, c, 'aftershockAt', 1, 1.9, 0.01, 'lands at');
  R(after, c, 'aftershockRadius', 0, 12, 0.05, 'dust roll (m)');
  R(after, c, 'aftershockShake', 0, 2, 0.01, 'camera punch');
  R(after, c, 'aftershockLight', 0, 40, 0.5, 'light punch');
  R(after, c, 'aftershockLife', 0.05, 3, 0.01, 'dust life');

  const bodies = folder.addFolder('12 · Bodies');
  R(bodies, c, 'hitRadius', 0.1, 12, 0.05, 'reach (m)');
  R(bodies, c, 'hitImpulse', 0, 24, 0.1, 'impulse');
  R(bodies, c, 'hitLift', 0, 20, 0.1, 'lift');
  R(bodies, c, 'hitSpin', 0, 8, 0.05, 'spin');

  const mark = folder.addFolder('13 · Mark — scoured pale');
  R(mark, c, 'markAmount', 0, 1, 0.01, 'stain');
  R(mark, c, 'markTime', 0.02, 3, 0.01, 'sets in (s)');
  R(mark, c, 'markLife', 0, 8, 0.05, 'sheds for (s)');
  R(mark, c, 'markMotes', 0, 120, 1, 'motes / s');
  mark.addColor(c, 'colorMarkBody').name('body');
  mark.addColor(c, 'colorMarkRim').name('rim');
  R(mark, c, 'markRimGlow', 0, 6, 0.05, 'rim glow');
  mark.addColor(c, 'colorMarkEdge').name('edge');
  R(mark, c, 'markEdgeGlow', 0, 8, 0.05, 'edge glow');
  R(mark, c, 'markEdgeWidth', 0, 0.3, 0.005, 'edge width');

  const trail = folder.addFolder('14 · Trail');
  R(trail, c, 'trailWidth', 0, 3, 0.01, 'ribbon width (m)');
  R(trail, c, 'trailLife', 0.05, 6, 0.05, 'ribbon life (s)');
  R(trail, c, 'trailOpacity', 0, 2, 0.01, 'ribbon opacity');
  R(trail, c, 'trailGlow', 0, 4, 0.01, 'ribbon glow');
  R(trail, c, 'trailCore', 0, 1, 0.01, 'white core');
  R(trail, c, 'trailBreakup', 0, 3, 0.01, 'break-up');
  R(trail, c, 'scarWidth', 0, 4, 0.01, 'scar width (m)');
  R(trail, c, 'scarLife', 0.05, 8, 0.05, 'scar life (s)');
  R(trail, c, 'scarOpacity', 0, 1, 0.01, 'scar opacity');
  R(trail, c, 'scarGlow', 0, 6, 0.05, 'seam glow');
  trail.addColor(c, 'colorScarA').name('seam');
  trail.addColor(c, 'colorScarB').name('bed');
  R(trail, c, 'wakeSpacing', 0, 6, 0.05, 'wake every (m)');
  R(trail, c, 'wakeRadius', 0, 4, 0.01, 'wake decal (m)');
  R(trail, c, 'wakeLife', 0.05, 6, 0.05, 'wake life (s)');
  R(trail, c, 'wakeChips', 0, 40, 1, 'wake chips');

  const gust = folder.addFolder('15 · Gust front');
  R(gust, c, 'frontWidth', 0.5, 10, 0.05, 'width (m)');
  R(gust, c, 'frontHeight', 0.3, 6, 0.05, 'height (m)');
  R(gust, c, 'frontDepth', 0.1, 2, 0.01, 'curl reach, × height');
  R(gust, c, 'frontSkew', 0, 1.4, 0.01, 'crosses (rad)');
  R(gust, c, 'frontGrow', 0.02, 0.6, 0.01, 'rises over (s)');
  R(gust, c, 'frontOpacity', 0, 2, 0.01, 'body');
  R(gust, c, 'frontFlow', 0, 12, 0.05, 'flow');
  R(gust, c, 'frontFlutter', 0, 0.3, 0.005, 'flutter');
  R(gust, c, 'crashTime', 0.05, 1, 0.01, 'breaks over (s)');
  R(gust, c, 'crashPitch', 0, 2, 0.01, 'falls over (rad)');
  R(gust, c, 'crashLunge', 0, 4, 0.05, 'lunges (m)');

  const roll = folder.addFolder('16 · Rotor');
  R(roll, c, 'rotorLength', 0.5, 10, 0.05, 'length (m)');
  R(roll, c, 'rotorRadius', 0.1, 3, 0.01, 'radius (m)');
  R(roll, c, 'rotorGrow', 0.05, 1, 0.01, 'rolls up over (s)');
  R(roll, c, 'rotorSpin', 0, 30, 0.1, 'roll (rad/s)');
  R(roll, c, 'rotorSpinDown', 0.1, 6, 0.05, 'slows over (s)');
  R(roll, c, 'rotorDrift', 0, 4, 0.05, 'drifts on (m)');
  R(roll, c, 'rotorSway', 0, 2, 0.01, 'sway (m)');
  R(roll, c, 'rotorSwayRate', 0, 8, 0.05, 'sway rate');
  R(roll, c, 'rotorLift', 0, 3, 0.01, 'lifts on exit (m)');
  R(roll, c, 'rotorExitAt', 1, 1.95, 0.01, 'unwinds from');
  R(roll, c, 'rotorOpacity', 0, 2, 0.01, 'body');
  R(roll, c, 'rotorFlow', 0, 12, 0.05, 'flow');
  R(roll, c, 'rotorFlutter', 0, 0.3, 0.005, 'flutter');
  R(roll, c, 'coreOpacity', 0, 1.5, 0.01, 'body (dark core)');
  R(roll, c, 'coreSize', 0.2, 1.2, 0.01, 'body radius, × roll');

  const air = folder.addFolder('17 · Wind look');
  R(air, c, 'windStreaks', 0, 4, 0.01, 'streaks');
  R(air, c, 'windFresnel', 0, 3, 0.01, 'rim');
  air.addColor(c, 'colorWindCore').name('core');
  air.addColor(c, 'colorWindTint').name('tint');
  air.addColor(c, 'colorWindBody').name('body');
  air.addColor(c, 'colorWindDeep').name('deep');
  R(air, c, 'leafRate', 0, 400, 1, 'leaves / s');
  R(air, c, 'leafSize', 0.01, 0.5, 0.005, 'leaf size');
  R(air, c, 'leafSpeed', 0, 20, 0.1, 'leaf speed');
  R(air, c, 'leafLife', 0.05, 4, 0.01, 'leaf life');
  R(air, c, 'leafFall', -5, 15, 0.1, 'leaf fall');
  Editor.gradient(air, c, 'colorLeaf', 'leaf colour');

  const scour = folder.addFolder('18 · Scoured floor');
  R(scour, c, 'scourWidth', 0.2, 10, 0.05, 'width (m)');
  R(scour, c, 'scourCross', 0, 1.4, 0.01, 'cross (rad)');
  R(scour, c, 'scourOpacity', 0, 1.5, 0.01, 'opacity');
  R(scour, c, 'scourGlow', 0, 4, 0.05, 'fresh dust');
  R(scour, c, 'scourErodeAt', 1, 1.95, 0.01, 'erodes from');
  R(scour, c, 'eddyRadius', 0.2, 6, 0.05, 'eddy (m)');
  R(scour, c, 'eddySpin', 0, 12, 0.05, 'eddy turn');

  const light = folder.addFolder('Light');
  light.addColor(c, 'lightColor').name('colour');
  R(light, c, 'lightIntensity', 0, 30, 0.1, 'intensity');
  R(light, c, 'lightRadius', 1, 40, 0.1, 'radius');
  R(light, c, 'lightFlicker', 0, 1, 0.01, 'flicker');
  R(light, c, 'impactLight', 0, 40, 0.5, 'light punch');
}
