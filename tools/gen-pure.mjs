// Bootstrap for the pure-element split: reassigns elements, patches the Codex
// indexes and writes first-draft castables. It is not the source of truth any
// more. Run `node tools/sculpt-pure.mjs` afterwards: that overwrites the
// ability and materials files and owns the configs (via pure-settings.mjs).
import { writeFileSync, readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { SPELLS, REASSIGN, PURE_GROUPS } from './pure-spells.mjs';
import { configSource } from './pure-settings.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const configDir = path.join(root, 'packs/sandbox/src/config/codex');
const abilityDir = path.join(root, 'packs/sandbox/src/abilities/codex');
const materialDir = path.join(root, 'packs/sandbox/src/materials/codex');

const ARCH = {
  spire: {
    shape: 'a ring of standing columns',
    segs: [64, 24],
    hit: ['out', 'in', 'tangent'],
    carry: ['none', 'in', 'orbit'],
    labels: ['columns', 'column height (m)', 'topple', 'spin (rad/s)']
  },
  lance: {
    shape: 'a drilling blade riding the line',
    segs: [8, 48],
    hit: ['slice', 'slice', 'slice'],
    carry: ['none', 'none', 'none'],
    labels: ['wakes', 'flight height (m)', 'braid (m)', 'drill (rad/s)']
  },
  well: {
    shape: 'a floor that inhales, then a column',
    segs: [48, 24],
    hit: ['up', 'in', 'out'],
    carry: ['up', 'in', 'out'],
    labels: ['ribs', 'column height (m)', 'inhale', 'swirl (rad/s)']
  },
  whip: {
    shape: 'a sheet that shears sideways as it travels',
    segs: [12, 48],
    hit: ['side', 'side', 'side'],
    carry: ['none', 'none', 'none'],
    labels: ['pleats', 'sheet height (m)', 'sideways reach (m)', 'flutter (rad/s)']
  },
  cage: {
    shape: 'bars that drop in a ring and then move',
    segs: [72, 20],
    hit: ['in', 'out', 'tangent'],
    carry: ['in', 'out', 'orbit'],
    labels: ['bars', 'bar height (m)', 'travel', 'bar spin (rad/s)']
  },
  volley: {
    shape: 'a fan of bolts on staggered arcs',
    segs: [64, 28],
    hit: ['bolt', 'bolt', 'bolt'],
    carry: ['none', 'none', 'none'],
    labels: ['bolts', 'arc height (m)', 'fan (m)', 'tumble (rad/s)']
  },
  pendulum: {
    shape: 'a blade hinged at the hand',
    segs: [6, 40],
    hit: ['swing', 'swing', 'swing'],
    carry: ['none', 'none', 'none'],
    labels: ['edge', 'hinge height (m)', 'swing (rad)', 'hinge spin (rad/s)']
  },
  halo: {
    shape: 'a ring that walks, then commits',
    segs: [80, 6],
    hit: ['ring', 'ring', 'ring'],
    carry: ['in', 'out', 'orbit'],
    labels: ['facets', 'ring lift (m)', 'commit', 'orbit (rad/s)']
  }
};

const GROUND = { spire: 0, lance: 2, well: 1, whip: 2, cage: 0, volley: 3, pendulum: 2, halo: 1 };

function vertexGlsl(spell) {
  const a = spell.archetype;
  const head = `
  uniform vec3 uCenter;
  uniform vec3 uOrigin;
  uniform vec3 uDir;
  uniform vec3 uSide;
  uniform float uRadius;
  uniform float uLength;
  uniform float uHeight;
  uniform float uThickness;
  uniform float uCount;
  uniform float uSpin;
  uniform float uOpen;
  uniform float uGrow;
  uniform float uAlong;
  uniform float uSeed;
  varying vec2 vUv;
  varying float vLocal;
  varying vec3 vWorld;
  varying float vViewZ;
  void main() {
    float u = position.x + 0.5;
    float v = position.y + 0.5;
    vec3 p;
    float local = u;
`;
  let body = '';
  if (a === 'spire' || a === 'cage') {
    body = `
    float cols = max(uCount, 1.0);
    float col = min(floor(u * cols), cols - 1.0);
    float fu = fract(u * cols);
    float ang = (col + 0.5) / cols * 6.2831853 + uSpin;
    float r = uRadius * (a == cage ? uOpen : 1.0);
    float lat = (fu - 0.5) * uThickness * (a == cage ? 0.55 : 1.0);
    vec3 radial = vec3(cos(ang), 0.0, sin(ang));
    vec3 tangent = vec3(-sin(ang), 0.0, cos(ang));
    float lean = uOpen * (fu - 0.5) * 0.65;
    p = uCenter + radial * r + tangent * lat + radial * lean * (a == spire ? 1.0 : 0.0);
    p.y = v * uHeight * uGrow;
    local = fu;
`.replace(/a == cage/g, a === 'cage' ? 'true' : 'false').replace(/a == spire/g, a === 'spire' ? 'true' : 'false');
    // The replacements above are messy because I used JS in glsl. Rewrite cleanly below.
  }
  body = placement(a);
  const tail = `
    vUv = vec2(u, v);
    vLocal = local;
    vWorld = p;
    vec4 mv = viewMatrix * vec4(p, 1.0);
    vViewZ = mv.z;
    gl_Position = projectionMatrix * mv;
  }
`;
  return head + body + tail;
}

function placement(a) {
  if (a === 'spire') return `
    float cols = max(uCount, 1.0);
    float col = min(floor(u * cols), cols - 1.0);
    float fu = fract(u * cols);
    float ang = (col + 0.5) / cols * 6.2831853 + uSpin;
    float lat = (fu - 0.5) * uThickness;
    vec3 radial = vec3(cos(ang), 0.0, sin(ang));
    vec3 tangent = vec3(-sin(ang), 0.0, cos(ang));
    p = uCenter + radial * uRadius + tangent * lat + radial * uOpen * (fu - 0.5);
    p.y = v * uHeight * uGrow;
    local = fu;`;
  if (a === 'cage') return `
    float cols = max(uCount, 1.0);
    float col = min(floor(u * cols), cols - 1.0);
    float fu = fract(u * cols);
    float ang = (col + 0.5) / cols * 6.2831853 + uSpin;
    float lat = (fu - 0.5) * uThickness * 0.45;
    vec3 radial = vec3(cos(ang), 0.0, sin(ang));
    vec3 tangent = vec3(-sin(ang), 0.0, cos(ang));
    p = uCenter + radial * (uRadius * uOpen) + tangent * lat;
    p.y = v * uHeight * uGrow;
    local = fu;`;
  if (a === 'lance') return `
    float along = v * uAlong;
    float braid = sin(along * 9.0 + uSpin) * uOpen;
    float width = uThickness * (1.05 - v) * (0.35 + 0.65 * uGrow);
    p = uOrigin + uDir * (along * uLength) + uSide * (position.x * width + braid);
    p.y = 0.25 + uHeight * sin(v * 3.14159265) * 0.35 * uGrow;
    local = along;`;
  if (a === 'whip') return `
    float along = v * uAlong;
    float sweep = sin(along * 3.14159265) * uOpen;
    float width = uThickness * (0.4 + 0.6 * sin(along * 3.14159265));
    p = uOrigin + uDir * (along * uLength) + uSide * (sweep + position.x * width);
    p.y = 0.2 + v * uHeight * uGrow * (0.45 + 0.55 * sin(along * 3.14159265));
    local = along;`;
  if (a === 'well') return `
    float ang = u * 6.2831853 + uSpin;
    float r = uThickness * (0.35 + 0.65 * v) * max(uRadius, 0.2) * (0.35 + 0.65 * uOpen);
    p = uCenter + vec3(cos(ang), 0.0, sin(ang)) * r;
    p.y = v * uHeight * uGrow;
    local = v;`;
  if (a === 'volley') return `
    float bolts = max(uCount, 1.0);
    float bolt = min(floor(u * bolts), bolts - 1.0);
    float fu = fract(u * bolts);
    float lane = ((bolt + 0.5) / bolts - 0.5) * 2.0;
    float head = clamp(uAlong * bolts - bolt, 0.0, 1.0);
    float s = fu * head;
    float y = sin(s * 3.14159265) * uHeight;
    p = uOrigin + uDir * (s * uLength) + uSide * (lane * uOpen);
    p.y = 0.15 + y;
    local = s;`;
  if (a === 'pendulum') return `
    float ang = mix(-uOpen, uOpen, clamp(uAlong, 0.0, 1.0));
    vec3 blade = cos(ang) * uDir + sin(ang) * uSide;
    vec3 across = -sin(ang) * uDir + cos(ang) * uSide;
    p = uOrigin + blade * (v * uRadius) + across * (position.x * uThickness * (0.25 + v));
    p.y = uHeight * (1.0 - v * 0.35);
    local = v;`;
  // halo
  return `
    float ang = u * 6.2831853 + uSpin;
    float r = max(uRadius * uOpen, 0.05);
    float tube = position.y * uThickness;
    vec3 radial = vec3(cos(ang), 0.0, sin(ang));
    p = uCenter + radial * (r + tube);
    p.y = 0.18 + uHeight * (1.0 - uGrow);
    local = ang;`;
}

function fragmentGlsl(spell) {
  const kind = GROUND[spell.archetype];
  const bias = (spell.variant + 1) * 0.17;
  const f = (n) => Number(n).toFixed(2);
  return `
  precision highp float;
  uniform float uTime;
  uniform float uSeed;
  uniform float uDissolve;
  uniform float uSoftFade;
  uniform float uOpacity;
  uniform float uGlow;
  uniform float uEdge;
  uniform vec3 uColorA;
  uniform vec3 uColorB;
  uniform vec3 uColorC;
  uniform vec2 uResolution;
  uniform sampler2D uSceneDepth;
  uniform float uCameraNear;
  uniform float uCameraFar;
  uniform float uGlobalGlow;
  uniform float uShaderIntensity;
  varying vec2 vUv;
  varying float vLocal;
  varying vec3 vWorld;
  varying float vViewZ;
  ${'${noiseGLSL}'}
  ${'${commonGLSL}'}
  void main() {
    vec3 np = vWorld * ${f(0.35 + spell.variant * 0.08)} + vec3(uSeed * 3.0, uTime * ${f(0.4 + bias)}, uSeed);
    float n = fbm3(np);
    float ridge = abs(snoise(np * ${f(1.7 + spell.variant * 0.2)}));
    float band = 0.5 + 0.5 * sin(vLocal * ${f(12 + kind * 3)} + uTime * ${f(1.2 + bias)} + uSeed);
    float edge = smoothstep(0.15, 0.85, band);
    vec3 col = mix(uColorC, uColorB, n * 0.5 + 0.5);
    col += uColorA * pow(edge, 2.0) * uEdge;
    col += uColorB * ridge * uGlow;
    float mask = uOpacity * (0.25 + 0.75 * edge) * (0.35 + 0.65 * n);
    mask *= smoothstep(0.0, 0.08, vUv.y) * (1.0 - smoothstep(0.92, 1.0, vUv.y));
    if (uDissolve > 0.0) {
      float keep = smoothstep(uDissolve, uDissolve + 0.12, n * 0.6 + edge * 0.4);
      col += uColorA * (1.0 - keep) * 0.7;
      mask *= keep;
    }
    if (mask < 0.02) discard;
    vec2 screenUV = gl_FragCoord.xy / max(uResolution, vec2(1.0));
    mask *= softFade(uSceneDepth, screenUV, vViewZ, uCameraNear, uCameraFar, max(uSoftFade, 0.02));
    if (mask < 0.02) discard;
    gl_FragColor = vec4(col * mask * uGlobalGlow * mix(1.0, uShaderIntensity, 0.65), mask);
  }
`;
}

function lensGlsl() {
  return `
  precision highp float;
  uniform float uWarp;
  uniform float uShaderIntensity;
  uniform float uDissolve;
  varying vec2 vUv;
  varying float vLocal;
  void main() {
    float band = sin(vLocal * 10.0) * 0.5 + 0.5;
    float mask = smoothstep(0.0, 0.12, vUv.y) * (1.0 - smoothstep(0.8, 1.0, vUv.y));
    mask *= (0.35 + 0.65 * band) * (1.0 - uDissolve);
    float s = uWarp * uShaderIntensity * mask;
    if (s < 0.01) discard;
    vec2 raw = vec2(vUv.x - 0.5, vLocal);
    float len = length(raw);
    vec2 dir = len < 0.001 ? vec2(1.0, 0.0) : raw / len;
    gl_FragColor = vec4(dir * 0.5 + 0.5, s, mask);
  }
`;
}

function groundFrag(kind) {
  const pattern = [
    'float pat = smoothstep(0.08, 0.0, abs(fract(ang * 7.0) - 0.5) - 0.42);',
    'float pat = smoothstep(0.04, 0.0, abs(fract(rad * 4.0 - uTime * 0.15) - 0.5) - 0.46);',
    'float pat = smoothstep(0.05, 0.0, abs(fract(vUv.x * 8.0) - 0.5) - 0.44);',
    'float pat = smoothstep(0.05, 0.0, abs(fract(ang * 2.0 + rad * 3.0) - 0.5) - 0.45);'
  ][kind];
  return `
  precision highp float;
  uniform float uTime;
  uniform float uSeed;
  uniform float uGlow;
  uniform float uErode;
  uniform float uOpacity;
  uniform vec3 uColorA;
  uniform vec3 uColorB;
  uniform vec2 uResolution;
  uniform sampler2D uSceneDepth;
  uniform float uCameraNear;
  uniform float uCameraFar;
  uniform float uGlobalGlow;
  varying vec2 vUv;
  varying vec3 vWorld;
  varying float vViewZ;
  ${'${noiseGLSL}'}
  ${'${commonGLSL}'}
  void main() {
    vec2 q = vUv - 0.5;
    float rad = length(q) * 2.0;
    float ang = atan(q.y, q.x);
    ${pattern}
    float grain = snoise(vec3(vWorld.xz * 0.8, uSeed)) * 0.5 + 0.5;
    float mask = pat * (1.0 - smoothstep(0.92, 1.05, rad)) * uOpacity * (1.0 - uErode);
    mask *= 0.45 + 0.55 * grain;
    if (mask < 0.02) discard;
    vec3 col = mix(uColorA, uColorB, pat) * (0.6 + uGlow);
    vec2 screenUV = gl_FragCoord.xy / max(uResolution, vec2(1.0));
    mask *= softFade(uSceneDepth, screenUV, vViewZ, uCameraNear, uCameraFar, 0.45);
    gl_FragColor = vec4(col * mask * uGlobalGlow, mask);
  }
`;
}

function groundVert() {
  return `
  uniform vec3 uCenter;
  uniform vec3 uDir;
  uniform vec3 uSide;
  uniform float uLength;
  uniform float uWidth;
  varying vec2 vUv;
  varying vec3 vWorld;
  varying float vViewZ;
  void main() {
    vUv = vec2(position.x + 0.5, position.y + 0.5);
    vec3 p = uCenter + uDir * (position.y * uLength) + uSide * (position.x * uWidth);
    p.y = 0.04;
    vWorld = p;
    vec4 mv = viewMatrix * vec4(p, 1.0);
    vViewZ = mv.z;
    gl_Position = projectionMatrix * mv;
  }
`;
}

function materialSource(spell) {
  const kind = GROUND[spell.archetype];
  const cls = spell.cls;
  return `import { AdditiveBlending, Color, DoubleSide, NormalBlending, ShaderMaterial, Vector3 } from 'three';
import { noiseGLSL } from '../../shaders/lib/noise.glsl.js';
import { commonGLSL } from '../../shaders/lib/common.glsl.js';
import { sharedUniforms } from '../../core/FrameUniforms.js';
import { settings } from '../../config/settings.js';
import { getColor } from '../../utils/color.js';

const ID = '${spell.id}';

/**
 * ${spell.label} — three bespoke shaders.
 *
 * The body is ${ARCH[spell.archetype].shape}. The lens writes the same
 * silhouette into the distortion buffer (direction in RG around 0.5, strength
 * in B, coverage in A). The ground decal is a ${['radial crack', 'walking ring', 'scrape groove', 'spiral brand'][kind]},
 * not a shared stamp. Every uniform is filled from \`settings.${spell.id}\`
 * inside \`userData.sync\`, so the editor reshapes a cast already in flight.
 */

const BODY_VERTEX = /* glsl */ \`
${vertexGlsl(spell)}
\`;

const BODY_FRAGMENT = /* glsl */ \`
${fragmentGlsl(spell)}
\`;

const LENS_FRAGMENT = /* glsl */ \`
${lensGlsl()}
\`;

const GROUND_VERTEX = /* glsl */ \`
${groundVert()}
\`;

const GROUND_FRAGMENT = /* glsl */ \`
${groundFrag(kind)}
\`;

function shapeUniforms() {
  return {
    uCenter: { value: new Vector3() },
    uOrigin: { value: new Vector3() },
    uDir: { value: new Vector3(0, 0, 1) },
    uSide: { value: new Vector3(1, 0, 0) },
    uRadius: { value: 1 },
    uLength: { value: 1 },
    uHeight: { value: 1 },
    uThickness: { value: 0.3 },
    uCount: { value: 6 },
    uSpin: { value: 0 },
    uOpen: { value: 1 },
    uGrow: { value: 1 },
    uAlong: { value: 1 },
    uSeed: { value: 0 }
  };
}

function writeShape(u, st) {
  u.uCenter.value.copy(st.center);
  u.uOrigin.value.copy(st.origin);
  u.uDir.value.copy(st.dir);
  u.uSide.value.copy(st.side);
  u.uRadius.value = st.radius;
  u.uLength.value = st.length;
  u.uHeight.value = st.height;
  u.uThickness.value = st.thickness;
  u.uCount.value = st.count;
  u.uSpin.value = st.spin;
  u.uOpen.value = st.open;
  u.uGrow.value = st.grow;
  u.uAlong.value = st.along;
  u.uSeed.value = st.seed;
}

export function create${cls}BodyMaterial() {
  const material = new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    depthTest: true,
    blending: AdditiveBlending,
    side: DoubleSide,
    toneMapped: false,
    uniforms: sharedUniforms({
      ...shapeUniforms(),
      uDissolve: { value: 0 },
      uSoftFade: { value: 0.4 },
      uOpacity: { value: 1 },
      uGlow: { value: 1 },
      uEdge: { value: 2 },
      uColorA: { value: new Color() },
      uColorB: { value: new Color() },
      uColorC: { value: new Color() }
    }),
    vertexShader: BODY_VERTEX,
    fragmentShader: BODY_FRAGMENT
  });
  material.userData.sync = (st) => {
    const c = settings[ID];
    const g = settings.global;
    const u = material.uniforms;
    writeShape(u, st);
    u.uDissolve.value = st.dissolve;
    u.uSoftFade.value = c.softFade;
    u.uOpacity.value = c.bodyOpacity * g.opacity * st.fade;
    u.uGlow.value = c.bodyGlow * g.glow;
    u.uEdge.value = c.edgeGlow * g.glow;
    u.uColorA.value.copy(getColor(c.colorA));
    u.uColorB.value.copy(getColor(c.colorB));
    u.uColorC.value.copy(getColor(c.colorC));
  };
  return material;
}

export function create${cls}LensMaterial() {
  const material = new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    depthTest: false,
    blending: NormalBlending,
    side: DoubleSide,
    toneMapped: false,
    uniforms: sharedUniforms({
      ...shapeUniforms(),
      uWarp: { value: 1 },
      uDissolve: { value: 0 }
    }),
    vertexShader: BODY_VERTEX,
    fragmentShader: LENS_FRAGMENT
  });
  material.userData.sync = (st) => {
    const c = settings[ID];
    const g = settings.global;
    const u = material.uniforms;
    writeShape(u, st);
    u.uDissolve.value = st.dissolve;
    u.uWarp.value = c.lensWarp * g.distortion * st.fade * (1.0 - st.dissolve);
  };
  return material;
}

export function create${cls}GroundMaterial() {
  const material = new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    depthTest: true,
    blending: NormalBlending,
    side: DoubleSide,
    toneMapped: false,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    polygonOffsetUnits: -2,
    uniforms: sharedUniforms({
      uCenter: { value: new Vector3() },
      uDir: { value: new Vector3(0, 0, 1) },
      uSide: { value: new Vector3(1, 0, 0) },
      uLength: { value: 4 },
      uWidth: { value: 4 },
      uSeed: { value: 0 },
      uGlow: { value: 1 },
      uErode: { value: 0 },
      uOpacity: { value: 1 },
      uColorA: { value: new Color() },
      uColorB: { value: new Color() }
    }),
    vertexShader: GROUND_VERTEX,
    fragmentShader: GROUND_FRAGMENT
  });
  material.userData.sync = (st) => {
    const c = settings[ID];
    const g = settings.global;
    const u = material.uniforms;
    u.uCenter.value.copy(st.center);
    u.uDir.value.copy(st.dir);
    u.uSide.value.copy(st.side);
    u.uLength.value = Math.max(0.2, st.foot);
    u.uWidth.value = Math.max(0.2, st.footWidth);
    u.uSeed.value = st.seed;
    u.uGlow.value = c.groundGlow * g.glow;
    u.uErode.value = st.dissolve;
    u.uOpacity.value = g.opacity * st.fade;
    u.uColorA.value.copy(getColor(c.colorA));
    u.uColorB.value.copy(getColor(c.colorC));
  };
  return material;
}
`;
}

function abilitySource(spell) {
  const arch = ARCH[spell.archetype];
  const hit = arch.hit[spell.variant];
  const carry = arch.carry[spell.variant];
  const [segX, segY] = arch.segs;
  const cls = spell.cls;
  const motion = motionSource(spell);
  const strike = strikeSource(spell, hit);
  const carrySrc = carry === 'none' ? '' : carrySource(carry);
  return `import { Mesh, PlaneGeometry, Vector3 } from 'three';
import { Ability } from '../Ability.js';
import {
  create${cls}BodyMaterial,
  create${cls}LensMaterial,
  create${cls}GroundMaterial
} from '../../materials/codex/${cls}Materials.js';
import { ParticleShape } from '../../particles/ParticleSystem.js';
import { RateEmitter } from '../../particles/ParticleEngine.js';
import { DecalType } from '../../effects/GroundDecals.js';
import { BurstMode } from '../../effects/BurstSphere.js';
import { LAYER } from '../../core/Layers.js';
import { frame } from '../../core/FrameUniforms.js';
import { settings } from '../../config/settings.js';
import { getColor } from '../../utils/color.js';
import { saturate, lerp, Easing } from '../../utils/math.js';

export const ID = '${spell.id}';

const CAST = '${spell.cast}';
const ARCH = '${spell.archetype}';
const VARIANT = ${spell.variant};
const HIT = '${hit}';
const CARRY = '${carry}';
const DECAL = DecalType.${spell.decal};
const BURST = BurstMode.${spell.burst};
const PRIMARY = ParticleShape.${spell.particle};

const _emit = {};
const _pos = new Vector3();
const _dir = new Vector3();
const _end = new Vector3();
const _focus = new Vector3();

/**
 * ${spell.label.toUpperCase()} — ${spell.element}, ${spell.cast} cast.
 *
 * ${spell.hint}.
 *
 * The silhouette is ${arch.shape}. Variant ${spell.variant} decides the
 * commitment: ${variantBlurb(spell, hit, carry)} It is not a recolour of the
 * other ${spell.element} castables — the motion, the hit direction and the
 * shader's ${spell.archetype} placement are this spell's own.
 *
 * ## Layers (each a folder in the editor)
 *
 *   1. **the body** — a subdivided quad placed in the vertex stage as
 *      ${arch.shape}. Additive, with a ridged fbm body and a bright edge.
 *   2. **the lens** — the same placement on \`LAYER.DISTORTION\`, so the
 *      world bends with the cast instead of merely glowing.
 *   3. **the ground** — a ${['crack fan', 'walking ring', 'scrape', 'spiral brand'][GROUND[spell.archetype]]}
 *      written under the footprint and eroded on the way out.
 *   4. **the shed** — a RateEmitter of ${spell.particle} plus dust and chips,
 *      rates read live so a slider never snaps the count.
 *   5. **the hit** — \`handlesOwnHits\`. ${hitBlurb(hit, carry)}
 *   6. **the beat** — impact burst (${spell.burst}), decal (${spell.decal}),
 *      screen flash and a camera punch, then a light that decays on its own.
 *
 * ## The editor rule
 *
 * A cast captures a seed and an integrated spin. Every metre, rate and colour
 * is read from \`settings.${spell.id}\` each frame.
 */
export class ${cls}Ability extends Ability {
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
    this.bodyGeometry = new PlaneGeometry(1, 1, ${segX}, ${segY});
    this.groundGeometry = new PlaneGeometry(1, 1, 1, 1);
    this.bodyMaterial = create${cls}BodyMaterial();
    this.lensMaterial = create${cls}LensMaterial();
    this.groundMaterial = create${cls}GroundMaterial();
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
    this.dust = particles.get('${spell.id}.dust', {
      capacity: 900,
      shape: ParticleShape.SMOKE,
      additive: false,
      curl: true,
      softFade: 0.65
    });
    this.streaks = particles.get('${spell.id}.streak', {
      capacity: 1200,
      shape: PRIMARY,
      additive: true,
      stretch: true,
      softFade: 0.2
    });
    this.chips = particles.get('${spell.id}.chip', {
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

${strike}
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
${motion}

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
  const folder = gui.addFolder('${spell.label}');
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
  R(shape, c, 'count', 1, 16, 1, '${arch.labels[0]}');
  R(shape, c, 'height', 0.2, 10, 0.05, '${arch.labels[1]}');
  R(shape, c, 'thickness', 0.02, 2, 0.01, 'thickness (m)');
  R(shape, c, 'sweep', 0, 8, 0.05, '${arch.labels[2]}');
  R(shape, c, 'lean', 0, 3, 0.01, 'lean');

  const motion = folder.addFolder('2 · Motion');
  R(motion, c, 'spinSpeed', -20, 20, 0.1, '${arch.labels[3]}');
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
`;
}

function variantBlurb(spell, hit, carry) {
  return `hit \`${hit}\`${carry === 'none' ? '' : `, then carry \`${carry}\``}.`;
}

function hitBlurb(hit, carry) {
  const map = {
    out: 'Bodies inside the circle are thrown straight out from the centre.',
    in: 'Bodies are thrown inward, toward the centre.',
    tangent: 'Bodies are thrown along the tangent of the spin.',
    slice: 'The blade slices anything inside its reach along its heading.',
    up: 'Bodies are thrown upward out of the well.',
    side: 'The sheet throws bodies sideways off the line.',
    bolt: 'Each bolt kills where it lands, once.',
    swing: 'The blade slices along its tangent as it sweeps.',
    ring: 'A body is hit when the ring passes over it.'
  };
  const tail = carry === 'none' ? '' : ' What is already down is carried by the field until the cast ends.';
  return (map[hit] ?? 'The cast picks its own targets.') + tail;
}

function strikeSource(spell, hit) {
  const zone = spell.cast === 'zone';
  return `
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
`;
}

function carrySource(carry) {
  return `
  _drag(dt, fade) {
    if (CARRY === 'none' || fade <= 0.02) return;
    const c = settings[ID];
    this._focusPoint(_focus);
    const grab = saturate(6 * dt) * fade;
    for (let i = this._carried.length - 1; i >= 0; i--) {
      const dummy = this._carried[i];
      if (!dummy || dummy.finished || dummy.alive) {
        this._carried.splice(i, 1);
        continue;
      }
      const at = dummy.bodyPoint ? dummy.bodyPoint(_pos) : dummy.position;
      if (!at) continue;
      const dx = _focus.x - at.x;
      const dz = _focus.z - at.z;
      const d = Math.max(0.2, Math.hypot(dx, dz));
      const pull = ${carry === 'in' ? '6' : carry === 'out' ? '-7' : '1.5'};
      const spin = ${carry === 'orbit' ? '4' : '1.2'};
      const lift = ${carry === 'up' ? '7' : '1.5'};
      this._flow.vx = (dx / d) * pull * c.sweep + (-dz / d) * spin;
      this._flow.vz = (dz / d) * pull * c.sweep + (dx / d) * spin;
      this._flow.vy = lift * fade;
      dummy.carry(this._field, grab, grab, ${carry === 'up' ? '0.35' : '0'});
    }
  }
`;
}

function motionSource(spell) {
  const a = spell.archetype;
  const v = spell.variant;
  let travel = '';
  let fade = '';
  if (a === 'spire') {
    travel = v === 0
      ? 'const grow = Easing.outCubic(saturate(this.u)); const open = 0;'
      : v === 1
        ? 'const grow = Easing.outCubic(saturate(this.u)); const open = 0.15 * this.u;'
        : 'const grow = Easing.outBack(saturate(this.u)); const open = 0;';
    fade = v === 0
      ? 'const open = Easing.outCubic(saturate(t)); const grow = 1;'
      : v === 1
        ? 'const open = lerp(0.15, 1.2, Easing.inCubic(saturate(t))); const grow = 1;'
        : 'const open = 0.2 * Math.sin(this._spin); const grow = 1;';
  } else if (a === 'lance') {
    travel = 'const grow = 0.35 + 0.65 * this.u; const open = (VARIANT === 1 ? c.sweep : VARIANT === 2 ? c.lean : 0) * this.u;';
    fade = 'const grow = 1; const open = c.sweep * (1 - dissolve);';
  } else if (a === 'well') {
    travel = 'const grow = 0.05; const open = 1 - Easing.inCubic(saturate(this.u));';
    fade = v === 2
      ? 'const grow = Easing.outCubic(saturate(t)); const open = lerp(0.15, 1.3, saturate(t));'
      : 'const grow = Easing.outCubic(saturate(t)); const open = lerp(1, 0.25, saturate(t));';
  } else if (a === 'whip') {
    travel = `const grow = 0.4 + 0.6 * this.u; const open = c.sweep * Math.sin(this.u * Math.PI) * ${v === 2 ? '(0.5 + 0.5 * Math.sin(this.age * 9))' : '1'};`;
    fade = 'const grow = 1; const open = c.sweep * (1 - dissolve);';
  } else if (a === 'cage') {
    travel = 'const grow = Easing.outCubic(saturate(this.u)); const open = 1.15;';
    fade = v === 1
      ? 'const grow = 1; const open = lerp(1.15, 1.7, Easing.outCubic(saturate(t)));'
      : 'const grow = 1; const open = lerp(1.15, 0.18, Easing.inCubic(saturate(t)));';
  } else if (a === 'volley') {
    travel = 'const grow = 1; const open = c.sweep;';
    fade = 'const grow = 1 - dissolve; const open = c.sweep;';
  } else if (a === 'pendulum') {
    travel = `const grow = 1; const open = c.sweep;`;
    fade = v === 2
      ? 'const grow = 1; const open = c.sweep; this.u = saturate(1 - (t > 1 ? (t - 1) : 0) * 0.85);'
      : 'const grow = 1 - dissolve * 0.4; const open = c.sweep;';
  } else {
    travel = v === 1
      ? 'const grow = Easing.outCubic(this.u); const open = lerp(0.35, 1.25, this.u);'
      : 'const grow = Easing.outCubic(this.u); const open = lerp(1.15, 0.25, this.u);';
    fade = v === 1
      ? 'const grow = 1; const open = lerp(1.25, 1.8, saturate(t));'
      : v === 2
        ? 'const grow = 1; const open = 0.85 + 0.1 * Math.sin(this._spin);'
        : 'const grow = 1; const open = lerp(0.25, 0.05, saturate(t));';
  }
  return `
  _step(dt, dissolve, fade, committed) {
    const c = settings[ID];
    const t = committed ? saturate(this.impactTime / Math.max(0.05, this.impactDuration)) : this.u;
    let grow = 1;
    let open = 1;
    if (committed) { ${fade.replaceAll('const ', '')} }
    else { ${travel.replaceAll('const ', '')} }
    const along = ARCH === 'pendulum' && VARIANT === 2
      ? this.u
      : (ARCH === 'pendulum' || ARCH === 'lance' || ARCH === 'whip' || ARCH === 'volley' ? (committed ? 1 : this.u) : 1);
    this._writeFrame(open, grow, along, dissolve, fade);
    this._palette();
    this._shed(dt, fade * (0.35 + 0.65 * grow));
    if (!committed) this._strikeTravel();
    void c;
  }
`;
}

function patchElements() {
  const file = path.join(root, 'packs/sandbox/src/config/elements.js');
  let text = readFileSync(file, 'utf8');
  const groupSrc = `export const ELEMENT_GROUPS = [\n${PURE_GROUPS.map((g) => `  { id: '${g.id}', label: '${g.label}', accent: '${g.accent}' }`).join(',\n')}\n];`;
  text = text.replace(/export const ELEMENT_GROUPS = \[[\s\S]*?\];/, groupSrc);
  for (const [uid, element] of Object.entries(REASSIGN)) {
    const needle = `'${uid}': '`;
    const at = text.indexOf(needle);
    if (at < 0) throw new Error(`missing uid ${uid}`);
    const end = text.indexOf("'", at + needle.length);
    text = text.slice(0, at + needle.length) + element + text.slice(end);
  }
  if (!text.includes("'codex/scarp'")) {
    const lines = SPELLS.map((s) => `  'codex/${s.id}': '${s.element}',`);
    text = text.replace(/\n};(\s*\n\/\*\* The element of a uid)/, `,\n\n  /* ---- pure split: one element, ten castables ---- */\n${lines.join('\n')}\n};$1`);
  }
  text = text.replace(
    'The packs say where an ability came from; this says what it is.',
    'The packs say where an ability came from; this says what it is. Combined labels (Earth & Crystal, Wind & Sound, and the rest) are split into pure elements.'
  );
  writeFileSync(file, text);
}

function patchCodexMeta() {
  for (const [uid, element] of Object.entries(REASSIGN)) {
    if (!uid.startsWith('codex/')) continue;
    const id = uid.slice('codex/'.length);
    const file = path.join(configDir, `${id}.js`);
    const text = readFileSync(file, 'utf8');
    const next = text.replace(/element: '[a-z]+'/, `element: '${element}'`);
    if (!/element: '[a-z]+'/.test(text)) throw new Error(`no element field in ${id}`);
    writeFileSync(file, next);
  }
}

function patchIndex(file, importLines, listNames, which) {
  let text = readFileSync(file, 'utf8');
  if (text.includes('const PURE = [')) return;
  const anchor = text.includes("import stasisbell from './stasisbell.js';")
    ? "import stasisbell from './stasisbell.js';"
    : "import * as StasisBell from './StasisBellAbility.js';";
  if (!text.includes(anchor)) throw new Error(`missing anchor in ${file}`);
  text = text.replace(anchor, `${anchor}\n${importLines.join('\n')}`);
  text = text.replace('const TENTH = [', `const PURE = [${listNames.join(', ')}];\nconst TENTH = [`);
  if (which === 'config') text = text.replace('...TENTH];', '...TENTH, ...PURE];');
  else text = text.replace('...TENTH\n]', '...TENTH, ...PURE\n]');
  writeFileSync(file, text);
}

const seen = new Set();
for (const spell of SPELLS) {
  if (seen.has(spell.id)) throw new Error(`duplicate ${spell.id}`);
  seen.add(spell.id);
  const ability = abilitySource(spell);
  const materials = materialSource(spell);
  if (ability.split('\n').length < 400) throw new Error(`${spell.id} ability is short: ${ability.split('\n').length}`);
  if ((materials.match(/new ShaderMaterial\(/g) ?? []).length < 2) throw new Error(`${spell.id} shaders`);
  if ((ability.match(/\.addFolder\(/g) ?? []).length < 4) throw new Error(`${spell.id} folders`);
  if (/TenthEngine|TenthMaterials|makeAbility\(/.test(ability)) throw new Error(`${spell.id} wrapper`);
  writeFileSync(path.join(configDir, `${spell.id}.js`), configSource(spell));
  writeFileSync(path.join(abilityDir, `${spell.cls}Ability.js`), ability);
  writeFileSync(path.join(materialDir, `${spell.cls}Materials.js`), materials);
}

patchElements();
patchCodexMeta();
patchIndex(
  path.join(configDir, 'index.js'),
  SPELLS.map((s) => `import ${s.id} from './${s.id}.js';`),
  SPELLS.map((s) => s.id),
  'config'
);
patchIndex(
  path.join(abilityDir, 'index.js'),
  SPELLS.map((s) => `import * as ${s.cls} from './${s.cls}Ability.js';`),
  SPELLS.map((s) => s.cls),
  'ability'
);

console.log('wrote', SPELLS.length, 'pure castables');
for (const g of PURE_GROUPS) {
  const n = SPELLS.filter((s) => s.element === g.id).length;
  if (n) console.log(g.id, '+' + n);
}
void existsSync;
