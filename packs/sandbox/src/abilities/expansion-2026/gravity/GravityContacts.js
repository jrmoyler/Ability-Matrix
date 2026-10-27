import { AdditiveBlending, BufferAttribute, BufferGeometry, Color, DoubleSide, Mesh, ShaderMaterial, Vector3 } from 'three';
import { LAYER } from '../../../core/Layers.js';
import { BurstMode } from '../../../effects/BurstSphere.js';
import { DecalType } from '../../../effects/GroundDecals.js';
import { noiseGLSL } from '../../../shaders/lib/noise.glsl.js';
import { settings } from '../../../config/settings.js';

const TAU = Math.PI * 2;
const clamp01 = (x) => Math.max(0, Math.min(1, x));

/** Contact rosettes held in the pool. Each accepted pulse reuses the oldest. */
const MAX_CONTACTS = 8;
/** Bodies a single pulse decorates. The pulse can strike up to eight; three read. */
const MAX_PER_PULSE = 3;

/**
 * A warped ring of alternating narrow mass lenses, made around one target.
 *
 * Twenty-four petals, alternating long and short, each a five-vertex kite
 * raised to a shallow peak at its middle: seen from the cast camera it reads
 * as space puckered round the body like cloth pinched under a weight.
 * `uv` is planar (centred on 0.5) so the fragment stage can work in polar
 * coordinates.
 */
export function gravityContactGeometry() {
  const p = [];
  const uv = [];
  const indices = [];
  const count = 24;
  for (let i = 0; i < count; i++) {
    const a = (i * TAU) / count;
    const half = (Math.PI / count) * 0.7;
    const r0 = 0.45;
    const r1 = i % 2 ? 0.85 : 1.05;
    const base = p.length / 3;
    const kite = [
      [r0, a - half, 0],
      [r1, a - half * 0.4, 0.08],
      [r1, a + half * 0.4, 0.08],
      [r0, a + half, 0],
      [0.72, a, 0.18]
    ];
    for (const [r, t, y] of kite) {
      p.push(Math.cos(t) * r, y, Math.sin(t) * r);
      uv.push(0.5 + Math.cos(t) * r * 0.4, 0.5 + Math.sin(t) * r * 0.4);
    }
    indices.push(base, base + 1, base + 4, base + 1, base + 2, base + 4, base + 2, base + 3, base + 4, base + 3, base, base + 4);
  }
  const g = new BufferGeometry();
  g.setAttribute('position', new BufferAttribute(new Float32Array(p), 3));
  g.setAttribute('uv', new BufferAttribute(new Float32Array(uv), 2));
  g.setIndex(indices);
  g.computeVertexNormals();
  return g;
}

const CONTACT_VERTEX = /* glsl */ `
  uniform float uTime;
  uniform float uProgress;
  varying vec2 vUv;
  void main() {
    vUv = uv;
    vec3 p = position;
    // The petals quiver as the pinch lands, then settle as it relaxes.
    p.y += sin(uv.x * 21.0 + uv.y * 13.0 - uTime * 3.0) * 0.035 * (1.0 - uProgress);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`;

const CONTACT_FRAGMENT = /* glsl */ `
  uniform float uTime;
  uniform float uFade;
  uniform float uProgress;
  uniform vec3  uColor;
  uniform vec3  uCore;
  varying vec2 vUv;
  ${noiseGLSL}
  void main() {
    vec2 p = vUv * 2.0 - 1.0;
    float r = length(p);
    float a = atan(p.y, p.x);
    // Twelve lens spokes, and a wave front contracting toward the body.
    float lens = pow(max(0.0, cos(a * 12.0 + uTime)), 16.0);
    float wave = exp(-abs(r - (0.8 - uProgress * 0.45)) * 26.0);
    float grain = 0.8 + 0.2 * snoise(vec3(p * 5.0, uTime * 0.9));
    vec3 col = mix(uColor, uCore, clamp(lens * 0.35 + wave * 0.4, 0.0, 1.0));
    gl_FragColor = vec4(col * (1.0 + wave), clamp((0.16 + lens * 0.4 + wave * 0.35) * grain * uFade, 0.0, 1.0));
  }
`;

function contactMaterial() {
  return new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: DoubleSide,
    blending: AdditiveBlending,
    toneMapped: false,
    uniforms: {
      uTime: { value: 0 },
      uFade: { value: 0 },
      uProgress: { value: 0 },
      uColor: { value: new Color('#9f8fbe') },
      uCore: { value: new Color('#efe4ff') }
    },
    vertexShader: CONTACT_VERTEX,
    fragmentShader: CONTACT_FRAGMENT
  });
}

/**
 * Eight pooled target-centred contacts; combat remains owned by the cast.
 *
 * `fire` is called only after the cast's pulse event has been *accepted* by
 * the combat binding, so a refused or budget-starved pulse never paints a
 * hit that did not happen. Each decorated body gets one rosette mesh, one
 * STORM burst, one CRACK decal and a small infall of the corridor's streaks.
 *
 * The owning ability passes its own geometry/material ownership callbacks so
 * `dispose` frees everything this class creates.
 */
export class GravityContacts {
  constructor(parent, ctx, atmosphere, ownGeometry, ownMaterial) {
    this.ctx = ctx;
    this.atmosphere = atmosphere;
    this.point = new Vector3();
    this.primary = new Color();
    this.core = new Color();
    this.dark = new Color();
    this.meshes = [];
    this.materials = [];
    this.times = Array(MAX_CONTACTS).fill(-1);
    this.next = 0;
    this._burst = { radius: 0.06, endRadius: 1, life: 0.5, intensity: 0.5, opacity: 0.5, colorA: this.core, colorB: this.primary, colorC: this.dark };
    this._decal = { radius: 1, life: 0.7, intensity: 0.5, width: 0.05, colorA: this.primary, colorB: this.dark };
    this._spray = { radius: 0.25, speed: 0.55, size: 0.09, life: 0.8, spread: 0.5 };
    const geometry = ownGeometry(gravityContactGeometry());
    for (let i = 0; i < MAX_CONTACTS; i++) {
      const mat = ownMaterial(contactMaterial());
      const mesh = new Mesh(geometry, mat);
      mesh.visible = false;
      mesh.layers.set(LAYER.VFX);
      mesh.frustumCulled = false;
      parent.add(mesh);
      this.meshes.push(mesh);
      this.materials.push(mat);
    }
  }

  reset() {
    this.times.fill(-1);
    this.next = 0;
    for (const mesh of this.meshes) mesh.visible = false;
  }

  /** Fire only after a pulse event has been accepted; cap visible contacts at three. */
  fire(actors, elapsed, c) {
    const scale = Math.max(0.2, Math.min(3, c.contactScale ?? 1));
    const glow = Math.max(0, Math.min(2, c.contactGlow ?? 0.8));
    const boom = settings.global.explosionIntensity;
    this.primary.set(c.gravityColor);
    this.core.set(c.coreColor);
    this.dark.copy(this.primary).multiplyScalar(0.3);
    const n = Math.min(MAX_PER_PULSE, actors.length);
    for (let k = 0; k < n; k++) {
      const actor = actors[k];
      const slot = this.next;
      this.next = (slot + 1) % this.meshes.length;
      this.times[slot] = elapsed;
      this.point.fromArray(actor.position);
      this.meshes[slot].position.copy(this.point).setY(0.06);
      const radius = Math.min(4, Math.max(0.2, c.zoneRadius * scale));
      const b = this._burst;
      b.endRadius = radius;
      b.intensity = glow * 0.65 * boom;
      this.ctx.bursts?.spawn(BurstMode.STORM, this.point, b);
      const d = this._decal;
      d.radius = radius;
      d.intensity = glow * 0.65;
      this.ctx.decals?.spawn(DecalType.CRACK, this.point, d);
      this._spray.radius = radius * 0.25;
      this.atmosphere.burst(actor.position, 8, this._spray);
    }
  }

  update(elapsed, time, fade, c, reducedMotion) {
    const duration = Math.max(0.1, c.contactDuration ?? 0.6);
    const scale = Math.max(0.2, Math.min(3, c.contactScale ?? 1));
    const glow = Math.max(0, Math.min(2, c.contactGlow ?? 0.8));
    for (let i = 0; i < this.meshes.length; i++) {
      const age = this.times[i] < 0 ? -1 : elapsed - this.times[i];
      const progress = age < 0 ? 0 : clamp01(age / duration);
      const mesh = this.meshes[i];
      const u = this.materials[i].uniforms;
      mesh.visible = !reducedMotion && age >= 0 && progress < 1;
      // Lands wide and contracts onto the body — the pinch of the weight.
      mesh.scale.setScalar(scale * (1.25 - progress * 0.8));
      mesh.rotation.y = time * (i % 2 ? -0.7 : 0.7);
      u.uTime.value = time;
      u.uProgress.value = progress;
      u.uFade.value = fade * (1 - progress) * glow;
      u.uColor.value.set(c.gravityColor);
      u.uCore.value.set(c.coreColor);
    }
  }
}
