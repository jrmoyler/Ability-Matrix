// The hero rig and detail pieces of the pure-element castables: how they are
// shaded. Two element classes (see MATTER in pure-settings.mjs):
//
//   solid   earth, crystal, gravity, time, motion, tech, force. A patched
//           MeshStandardMaterial lit by the scene sun, opaque, casting and
//           receiving shadows (LAYER.SHAPED, with a matching depth material,
//           because the parts fold in the vertex stage). The four-stop ramp is
//           the albedo — body on the upper span and up-facing faces, deep at the
//           roots and underneath — and only the hot parts, a thin fresnel and
//           the dissolve edge are emissive. This is the Monolith Rift route.
//   energy  every other element. Still emissive, but over a dark body: the
//           deep tone fills the faces that look at the camera, the light tint
//           rides the silhouette as a fresnel shell, hot parts glow. Normal
//           blending, depth-writing, so it reads as a volume instead of the
//           additive wireframe it used to be.
//
// Both keep the part fold (aPivot / aHinge, staged by aInfo) and read aEdge,
// aInfo, aStyle exactly as before. sculpt-pure.mjs splices these sources into
// every `materials/codex/<Cast>Materials.js`.
import { PROFILE } from './pure-settings.mjs';

export const isSolid = (spell) => !!PROFILE[spell.element].solid;

/** The element's surface pattern on a piece; reads vWorld, vSpan, vSeed, rim, uTime. */
export const DETAIL_PATTERN = {
  earth: 'abs(sin(vWorld.y * 9.0 + vSeed * 20.0)) * 0.6 + snoise01(vWorld * 3.0) * 0.4',
  crystal: 'pow(abs(sin(vSpan * 14.0 + vSeed * 12.0)), 3.0)',
  wind: 'abs(sin(vSpan * 10.0 - uTime * 5.0 + vSeed * 9.0))',
  sound: 'abs(sin(vWorld.y * 18.0 - uTime * 6.0))',
  light: 'pow(vSpan, 1.5) + 0.3 * sin(uTime * 8.0 + vSeed * 20.0)',
  holy: 'pow(1.0 - vSpan, 1.4) + 0.2',
  cosmic: 'snoise01(vWorld * 4.0 + vec3(0.0, uTime * 0.6, vSeed * 8.0))',
  gravity: 'smoothstep(0.2, 0.9, snoise01(vWorld * 2.4 + vSeed * 6.0))',
  shadow: '1.0 - snoise01(vWorld * 3.2 + vec3(vSeed * 5.0, uTime * 0.4, 0.0))',
  void: 'smoothstep(0.1, 0.9, 1.0 - rim)',
  arcane: 'step(0.6, abs(sin(vWorld.x * 12.0 + vWorld.z * 12.0 + uTime * 2.0)))',
  illusion: 'abs(sin(vWorld.x * 7.0 + uTime * 3.0) - sin(vWorld.z * 7.0 - uTime * 3.0))',
  time: 'step(0.5, fract(vSpan * 6.0 + uTime * 0.7))',
  motion: 'abs(fract(vSpan * 5.0 - uTime * 3.0) - 0.5) * 2.0',
  tech: 'step(0.6, fract(vWorld.y * 6.0 + vSeed * 4.0)) * 0.7 + step(0.9, fract(vWorld.x * 5.0 + vWorld.z * 5.0)) * 0.3',
  force: 'abs(fract(vWorld.x * 4.0 + vWorld.z * 4.0 + vSeed * 3.0) - 0.5) * 2.0'
};

/** How much the arrises of a solid glow (glass and live circuitry glint; stone does not). */
const EDGE_GLOW = { crystal: 0.45, tech: 0.28, time: 0.16, motion: 0.12 };

const ROT_AXIS = `vec3 rotAxis(vec3 v, vec3 k, float a) {
    float c = cos(a);
    float s = sin(a);
    return v * c + cross(k, v) * s + k * dot(k, v) * (1.0 - c);
  }`;

/** The shader sources a solid cast's materials module declares. */
function solidShaders(spell) {
  return `
/*
 * The hero rig and the pieces are matter: a MeshStandardMaterial lit by the
 * sun, with the fold and the ramp patched in. The same vertex logic goes into
 * the depth material, so the shadow folds with the parts.
 */
const PART_VERTEX_PARS = /* glsl */ \`
  attribute float aSeed;
  attribute vec3 aEdge;
  attribute vec4 aInfo;
  attribute vec3 aStyle;
  attribute vec3 aPivot;
  attribute vec4 aHinge;
  uniform float uGrowArt;
  uniform float uOpenArt;
  uniform float uSwing;
  varying vec3 vPartWorld;
  varying vec3 vPartNormal;
  varying vec3 vPartEdge;
  varying vec4 vPartInfo;
  varying vec3 vPartStyle;
  varying float vPartSeed;
  ${ROT_AXIS}
  // Each authored part folds about its own pivot: aInfo.w picks whether it
  // follows the rise (0) or the beat (1), aInfo.z delays it within that.
  float partFold() {
    if (dot(aHinge.xyz, aHinge.xyz) < 0.5) return 0.0;
    float art = mix(uGrowArt, uOpenArt, aInfo.w);
    return smoothstep(aInfo.z, aInfo.z + 0.5, art) * aHinge.w * uSwing;
  }
\`;

const PART_NORMAL = /* glsl */ \`
  float partAngle = partFold();
  vec3 objectNormal = abs(partAngle) > 1e-4 ? rotAxis(normal, aHinge.xyz, partAngle) : normal;
  {
    vec3 on = objectNormal;
    #ifdef USE_INSTANCING
      mat3 im = mat3(instanceMatrix);
      on /= vec3(dot(im[0], im[0]), dot(im[1], im[1]), dot(im[2], im[2]));
      on = im * on;
    #endif
    vPartNormal = normalize(mat3(modelMatrix) * on);
  }
\`;

const PART_POSITION = /* glsl */ \`
  float partSwing = partFold();
  vec3 transformed = abs(partSwing) > 1e-4 ? aPivot + rotAxis(position - aPivot, aHinge.xyz, partSwing) : position;
  {
    vec4 wp = vec4(transformed, 1.0);
    #ifdef USE_INSTANCING
      wp = instanceMatrix * wp;
    #endif
    vPartWorld = (modelMatrix * wp).xyz;
  }
  vPartEdge = aEdge;
  vPartInfo = aInfo;
  vPartStyle = aStyle;
  vPartSeed = aSeed;
\`;

const PART_FRAGMENT_PARS = /* glsl */ \`
  uniform float uTime;
  uniform float uOpacity;
  uniform float uGlow;
  uniform float uEdge;
  uniform float uRim;
  uniform float uDeep;
  uniform float uDissolve;
  uniform vec3 uColorA;
  uniform vec3 uColorB;
  uniform vec3 uColorC;
  varying vec3 vPartWorld;
  varying vec3 vPartNormal;
  varying vec3 vPartEdge;
  varying vec4 vPartInfo;
  varying vec3 vPartStyle;
  varying float vPartSeed;
  vec3 gPartGlow;
  \${noiseGLSL}
\`;

/*
 * The ramp, as albedo. The deep stop is not a shadow colour painted on: it is
 * where the form is occluded — the root of every part, the faces that look
 * down — and the sun then lights whatever is left. The light stop only rides
 * the arrises, as a chamfer catching the key light.
 */
const PART_COLOR = /* glsl */ \`
  {
    vec3 vWorld = vPartWorld;
    float vSpan = vPartStyle.z;
    float vSeed = vPartSeed;
    vec3 pn = normalize(vPartNormal);
    if (!gl_FrontFacing) pn = -pn;
    vec3 pv = normalize(cameraPosition - vPartWorld);
    float rim = pow(1.0 - abs(dot(pn, pv)), 2.4);
    float pat = clamp(${DETAIL_PATTERN[spell.element]}, 0.0, 1.0);
    float up = pn.y * 0.5 + 0.5;
    float form = clamp(0.18 + 0.5 * vSpan + 0.42 * up, 0.0, 1.0);
    float tint = 0.86 + 0.28 * fract(vPartInfo.y * 0.61803 + vPartInfo.x * 0.37);
    vec3 albedo = mix(uColorC, uColorB, mix(1.0, form, uDeep)) * tint;
    albedo = mix(albedo, uColorC, pat * 0.32 * uDeep);
    albedo *= mix(1.0, 0.5 + 0.5 * smoothstep(0.0, 0.28, vSpan), uDeep);
    float edge = min(min(vPartEdge.x, vPartEdge.y), vPartEdge.z);
    float slope = fwidth(edge) + 1e-4;
    float line = (1.0 - smoothstep(slope * 0.8, slope * 2.2, edge)) * (1.0 - smoothstep(0.14, 0.3, slope)) * vPartStyle.x;
    albedo = mix(albedo, uColorA, line * clamp(uEdge, 0.0, 1.5) * 0.45);
    diffuseColor.rgb = albedo;
    float breathe = 0.65 + 0.35 * sin(uTime * 3.0 + vPartInfo.x * 1.7);
    gPartGlow = mix(uColorB, uColorA, 0.5) * vPartStyle.y * breathe * uGlow * 1.6;
    gPartGlow += uColorB * rim * uRim * uGlow * 0.22;
    gPartGlow += uColorA * line * uEdge * ${(EDGE_GLOW[spell.element] ?? 0.06).toFixed(2)};
    if (uDissolve > 0.0) {
      float cut = snoise01(vPartWorld * 1.7 + vec3(vPartSeed * 9.0, 0.0, 0.0));
      if (cut < uDissolve) discard;
      gPartGlow += uColorA * (1.0 - smoothstep(uDissolve, uDissolve + 0.06, cut)) * 2.0;
    }
    if (uOpacity < 0.999 && hash13(vec3(gl_FragCoord.xy, vPartSeed)) > uOpacity) discard;
  }
\`;

const PART_DEPTH_PARS = /* glsl */ \`
  uniform float uOpacity;
  uniform float uDissolve;
  varying vec3 vPartWorld;
  varying float vPartSeed;
  \${noiseGLSL}
\`;

const PART_DEPTH_CUT = /* glsl */ \`
  if (uDissolve > 0.0 && snoise01(vPartWorld * 1.7 + vec3(vPartSeed * 9.0, 0.0, 0.0)) < uDissolve) discard;
  if (uOpacity < 0.999 && hash13(vec3(gl_FragCoord.xy, vPartSeed)) > uOpacity) discard;
\`;
`;
}

/** The energy cast's two shader constants, the same names the old modules used. */
function energyShaders(spell) {
  return `
const DETAIL_VERTEX = /* glsl */ \`
  attribute float aSeed;
  attribute vec3 aEdge;
  attribute vec4 aInfo;
  attribute vec3 aStyle;
  attribute vec3 aPivot;
  attribute vec4 aHinge;
  uniform float uGrowArt;
  uniform float uOpenArt;
  uniform float uSwing;
  varying vec3 vWorld;
  varying vec3 vNormalW;
  varying float vSeed;
  varying float vSpan;
  varying float vViewZ;
  varying vec3 vEdge;
  varying vec4 vInfo;
  varying vec2 vStyle;
  ${ROT_AXIS}
  void main() {
    // Each authored part folds about its own pivot: aInfo.w picks whether it
    // follows the rise (0) or the beat (1), aInfo.z delays it within that.
    float art = mix(uGrowArt, uOpenArt, aInfo.w);
    float fold = smoothstep(aInfo.z, aInfo.z + 0.5, art) * aHinge.w * uSwing;
    vec3 p = position;
    vec3 n = normal;
    if (abs(fold) > 1e-4 && dot(aHinge.xyz, aHinge.xyz) > 0.5) {
      p = aPivot + rotAxis(position - aPivot, aHinge.xyz, fold);
      n = rotAxis(normal, aHinge.xyz, fold);
    }
    mat4 model = modelMatrix;
    #ifdef USE_INSTANCING
      model = modelMatrix * instanceMatrix;
    #endif
    vec4 wp = model * vec4(p, 1.0);
    vWorld = wp.xyz;
    vNormalW = normalize(mat3(model) * n);
    vSeed = aSeed;
    vSpan = aStyle.z;
    vEdge = aEdge;
    vInfo = aInfo;
    vStyle = aStyle.xy;
    vec4 mv = viewMatrix * wp;
    vViewZ = mv.z;
    gl_Position = projectionMatrix * mv;
  }
\`;

/*
 * Energy over a dark body. The deep stop fills the faces that look at the
 * camera, the body colour climbs the span and the lit side, and the light
 * tint rides the silhouette as a fresnel shell, so the rig reads as a volume
 * of something rather than as its own outline. Hot parts and arrises glow on
 * top and feed the bloom.
 */
const DETAIL_FRAGMENT = /* glsl */ \`
  precision highp float;
  uniform float uTime;
  uniform float uOpacity;
  uniform float uGlow;
  uniform float uEdge;
  uniform float uRim;
  uniform float uDeep;
  uniform float uDissolve;
  uniform vec3 uColorA;
  uniform vec3 uColorB;
  uniform vec3 uColorC;
  uniform vec3 uLightDir;
  uniform vec2 uResolution;
  uniform sampler2D uSceneDepth;
  uniform float uCameraNear;
  uniform float uCameraFar;
  uniform float uGlobalGlow;
  varying vec3 vWorld;
  varying vec3 vNormalW;
  varying float vSeed;
  varying float vSpan;
  varying float vViewZ;
  varying vec3 vEdge;
  varying vec4 vInfo;
  varying vec2 vStyle;
  \${noiseGLSL}
  \${commonGLSL}
  void main() {
    vec3 n = normalize(vNormalW);
    if (!gl_FrontFacing) n = -n;
    vec3 view = normalize(cameraPosition - vWorld);
    float rim = pow(1.0 - abs(dot(n, view)), 2.2);
    float lit = clamp(dot(n, normalize(uLightDir)) * 0.5 + 0.5, 0.0, 1.0);
    float pat = clamp(${DETAIL_PATTERN[spell.element]}, 0.0, 1.0);
    float form = clamp(0.15 + 0.45 * vSpan + 0.4 * lit, 0.0, 1.0);
    vec3 col = mix(uColorC, uColorB, mix(1.0, form, uDeep));
    col *= 0.86 + 0.28 * fract(vInfo.y * 0.61803 + vInfo.x * 0.37);
    col = mix(col, uColorC, pat * 0.35 * uDeep);
    col += uColorB * pat * 0.22 * uGlow;
    // The fresnel shell.
    col += mix(uColorB, uColorA, rim) * rim * uRim * uGlow * 1.15;
    // Hot core parts breathe.
    col += mix(uColorB, uColorA, 0.6) * vStyle.y * (1.1 + 0.5 * sin(uTime * 3.0 + vInfo.x * 1.7)) * uGlow;
    // Arrises: a hairline, dropped once a triangle is too small to carry one.
    float edge = min(min(vEdge.x, vEdge.y), vEdge.z);
    float slope = fwidth(edge) + 1e-4;
    float line = (1.0 - smoothstep(slope * 0.6, slope * 1.7, edge)) * (1.0 - smoothstep(0.14, 0.3, slope)) * vStyle.x;
    col += uColorA * line * uEdge * 0.3;
    col *= 0.9 + 0.1 * sin(uTime * (3.0 + vSeed * 5.0) + vSeed * 31.0);
    float mask = uOpacity * clamp(0.72 + 0.28 * rim + 0.3 * vStyle.y + 0.2 * line, 0.0, 1.0);
    if (uDissolve > 0.0) {
      float cut = snoise01(vWorld * 1.7 + vec3(vSeed * 9.0, uTime * 0.2, 0.0));
      mask *= smoothstep(uDissolve, uDissolve + 0.12, cut);
      col += uColorA * (1.0 - smoothstep(uDissolve, uDissolve + 0.08, cut)) * 1.5;
    }
    if (mask < 0.02) discard;
    vec2 screenUV = gl_FragCoord.xy / max(uResolution, vec2(1.0));
    mask *= softFade(uSceneDepth, screenUV, vViewZ, uCameraNear, uCameraFar, 0.3);
    if (mask < 0.02) discard;
    gl_FragColor = vec4(col * uGlobalGlow, mask);
  }
\`;
`;
}

export function detailShaders(spell) {
  return isSolid(spell) ? solidShaders(spell) : energyShaders(spell);
}

/** Shared tail of both factories: settings -> uniforms, every frame. */
function syncSource(solid) {
  return `  material.userData.sync = (st) => {
    const c = settings[ID];
    const g = settings.global;
    const k = rig ? 'hero' : 'detail';
    const K = rig ? 'Hero' : 'Detail';
    u.uOpacity.value = c[k + 'Opacity'] * g.opacity * st.fade;
    u.uGlow.value = c[k + 'Glow'] * g.glow * st.pulse;
    u.uEdge.value = c[k + 'Edge'];
    u.uRim.value = g.fresnel;
    u.uDeep.value = c[k + 'Deep'];
    u.uSwing.value = c[k + 'Swing'];
    u.uGrowArt.value = Math.min(1, Math.max(0, st.grow));
    u.uOpenArt.value = Math.min(1, Math.max(0, st.beat));
    u.uDissolve.value = st.dissolve * 0.6;
    u.uColorA.value.copy(getColor(c['color' + K + 'A']));
    u.uColorB.value.copy(getColor(c['color' + K + 'B']));
    u.uColorC.value.copy(getColor(c['color' + K + 'C']));${solid ? `
    material.roughness = c[k + 'Rough'];
    material.metalness = c[k + 'Metal'];
    material.userData.castShadow = c[k + 'Shadow'] > 0.5;` : ''}
  };
  return material;
}`;
}

export function detailFactory(spell) {
  const cls = spell.cls;
  const id = spell.id;
  if (!isSolid(spell)) {
    return `/**
 * \`rig\` true builds the hero rig's material: the same shader, its own look.
 * ${spell.element} is energy: emissive over a dark body, normal-blended and
 * depth-writing, on LAYER.VFX.
 */
export function create${cls}DetailMaterial(rig = false) {
  const material = new ShaderMaterial({
    transparent: true,
    depthWrite: true,
    depthTest: true,
    blending: NormalBlending,
    side: DoubleSide,
    toneMapped: false,
    uniforms: sharedUniforms({
      uOpacity: { value: 1 },
      uGlow: { value: 1 },
      uEdge: { value: 1 },
      uRim: { value: 1 },
      uDeep: { value: 0.75 },
      uDissolve: { value: 0 },
      uGrowArt: { value: 0 },
      uOpenArt: { value: 0 },
      uSwing: { value: 1 },
      uColorA: { value: new Color() },
      uColorB: { value: new Color() },
      uColorC: { value: new Color() }
    }),
    vertexShader: DETAIL_VERTEX,
    fragmentShader: DETAIL_FRAGMENT
  });
  material.userData.solid = false;
  const u = material.uniforms;
${syncSource(false)}`;
  }
  return `/**
 * \`rig\` true builds the hero rig's material: the same surface, its own look.
 * ${spell.element} is matter: a MeshStandardMaterial lit by the scene sun,
 * opaque, with the part fold and the four-stop ramp patched in, and a depth
 * material carrying the same fold so the shadow moves with the parts. The
 * owner (RigHero / DetailLayer) puts the mesh on LAYER.SHAPED and lets it cast
 * and receive shadows.
 */
export function create${cls}DetailMaterial(rig = false) {
  const material = new MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.6,
    metalness: 0,
    side: DoubleSide
  });
  const uniforms = {
    uTime: frame.uTime,
    uOpacity: { value: 1 },
    uGlow: { value: 1 },
    uEdge: { value: 1 },
    uRim: { value: 1 },
    uDeep: { value: 0.75 },
    uDissolve: { value: 0 },
    uGrowArt: { value: 0 },
    uOpenArt: { value: 0 },
    uSwing: { value: 1 },
    uColorA: { value: new Color() },
    uColorB: { value: new Color() },
    uColorC: { value: new Color() }
  };
  patchOnBeforeCompile(
    material,
    (shader) => {
      Object.assign(shader.uniforms, uniforms);
      shader.vertexShader = shader.vertexShader
        .replace('#include <common>', \`#include <common>\\n\${PART_VERTEX_PARS}\`)
        .replace('#include <beginnormal_vertex>', PART_NORMAL)
        .replace('#include <begin_vertex>', PART_POSITION);
      shader.fragmentShader = shader.fragmentShader
        .replace('#include <common>', \`#include <common>\\n\${PART_FRAGMENT_PARS}\`)
        .replace('#include <color_fragment>', \`#include <color_fragment>\\n\${PART_COLOR}\`)
        .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\\n  totalEmissiveRadiance += gPartGlow;');
    },
    'codex-solid-${id}'
  );
  // The shadow: the same folded shape, and the same dissolve, in the depth pass.
  const depth = new MeshDepthMaterial({ depthPacking: RGBADepthPacking, side: DoubleSide });
  patchOnBeforeCompile(
    depth,
    (shader) => {
      Object.assign(shader.uniforms, uniforms);
      shader.vertexShader = shader.vertexShader
        .replace('#include <common>', \`#include <common>\\n\${PART_VERTEX_PARS}\`)
        .replace('#include <begin_vertex>', PART_POSITION);
      shader.fragmentShader = shader.fragmentShader
        .replace('#include <common>', \`#include <common>\\n\${PART_DEPTH_PARS}\`)
        .replace('#include <clipping_planes_fragment>', \`#include <clipping_planes_fragment>\\n\${PART_DEPTH_CUT}\`);
    },
    'codex-solid-depth-${id}'
  );
  material.userData.solid = true;
  material.userData.depth = depth;
  material.userData.castShadow = true;
  material.userData.uniforms = uniforms;
  const baseDispose = material.dispose.bind(material);
  material.dispose = () => {
    depth.dispose();
    baseDispose();
  };
  const u = uniforms;
${syncSource(true)}`;
}

/** Extra imports a materials module needs for its detail factory. */
export function detailImports(spell) {
  if (!isSolid(spell)) return '';
  return `import { patchOnBeforeCompile } from '../../utils/shaderPatch.js';
`;
}
