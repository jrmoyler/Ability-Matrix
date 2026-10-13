import { AdditiveBlending, Color, DoubleSide, NormalBlending, ShaderMaterial, Vector3 } from 'three';
import { noiseGLSL } from '../../shaders/lib/noise.glsl.js';
import { commonGLSL } from '../../shaders/lib/common.glsl.js';
import { sharedUniforms } from '../../core/FrameUniforms.js';

/**
 * Shared body for the tenth-slot codex casts.
 *
 * One program, ten silhouettes. The silhouette is a uniform (`uStyle`), so a
 * cast already in the air re-shapes when the editor moves a slider, and every
 * new spell compiles against the program the one before it already warmed.
 * The lens twin writes the same screen-space warp the source packs use
 * (offset around 0.5, strength in B, mask in A).
 *
 * Styles
 *   0 blade     swept polar shuriken
 *   1 orb       corona around a hard core
 *   2 ring      halo with rune ticks
 *   3 needle    diamond shard
 *   4 sigil     hex plate and two rings
 *   5 column    striated pillar
 *   6 sheet     cutting wave
 *   7 cage      electric bar
 *   8 scythe    hooked arc
 *   9 ribbon    twisted helix band
 */

const VERT = /* glsl */ `
  uniform vec3  uCentre;
  uniform vec3  uAxis;
  uniform vec3  uHeading;
  uniform float uRadius;
  uniform float uFlat;

  varying vec2  vLocal;
  varying vec3  vNormalW;
  varying vec3  vViewDir;
  varying vec2  vT;
  varying vec2  vB;
  varying float vViewZ;

  void main() {
    vec3 n = normalize(uAxis);
    vec3 t = normalize(uHeading - n * dot(uHeading, n) + 1e-5);
    vec3 b = cross(n, t);
    vec2 xy = position.xy;
    if (uFlat > 0.5) {
      n = vec3(0.0, 1.0, 0.0);
      t = vec3(1.0, 0.0, 0.0);
      b = vec3(0.0, 0.0, 1.0);
    }
    vec3 world = uCentre + (t * xy.x + b * xy.y) * uRadius;
    if (uFlat > 0.5) world.y = uCentre.y;
    vLocal = xy;
    vNormalW = n;
    vViewDir = cameraPosition - world;
    vT = (viewMatrix * vec4(t, 0.0)).xy;
    vB = (viewMatrix * vec4(b, 0.0)).xy;
    vec4 mv = viewMatrix * vec4(world, 1.0);
    vViewZ = mv.z;
    gl_Position = projectionMatrix * mv;
  }
`;

const FRAG = /* glsl */ `
  precision highp float;

  uniform float uTime;
  uniform float uSpin;
  uniform float uStyle;
  uniform float uBlades;
  uniform float uTaper;
  uniform float uCurve;
  uniform float uHole;
  uniform float uHub;
  uniform float uSpikes;
  uniform float uTwist;
  uniform float uThickness;
  uniform float uNoiseAmt;
  uniform float uEdgeGlow;
  uniform float uBodyOpacity;
  uniform float uFringe;
  uniform float uRimGlow;
  uniform float uSoftFade;
  uniform float uFade;
  uniform float uSeed;
  uniform float uWarp;
  uniform float uWarpSwirl;
  uniform vec3  uColorA;
  uniform vec3  uColorB;
  uniform vec3  uColorC;

  uniform vec2      uResolution;
  uniform sampler2D uSceneDepth;
  uniform float     uCameraNear;
  uniform float     uCameraFar;
  uniform float     uGlobalGlow;
  uniform float     uShaderIntensity;

  varying vec2  vLocal;
  varying vec3  vNormalW;
  varying vec3  vViewDir;
  varying vec2  vT;
  varying vec2  vB;
  varying float vViewZ;

  ${noiseGLSL}
  ${commonGLSL}

  float sdBlade(vec2 p, float spin) {
    float r = length(p);
    float th = atan(p.y, p.x);
    float gap = 6.2831853 / max(uBlades, 1.0);
    float ph = (th - spin) + uCurve * r;
    float f = mod(ph, gap) - gap * 0.5;
    float w = gap * 0.5 * uThickness * pow(max(1.0 - r, 0.0), max(uTaper, 0.05));
    float blade = (abs(f) - w) * max(r, 0.08);
    blade = max(blade, r - 1.0);
    float hub = r - uHub;
    return max(min(blade, hub), uHole - r);
  }

  float sdOrb(vec2 p) {
    float r = length(p);
    float n = snoise(vec3(p * (2.2 + uSpikes), uTime * 0.8 + uSeed)) * uNoiseAmt;
    float corona = abs(r - (0.72 + n * 0.08)) - uThickness * 0.15;
    float core = r - (0.28 + uHub * 0.2);
    return min(corona, core);
  }

  float sdRing(vec2 p, float spin) {
    float r = length(p);
    float th = atan(p.y, p.x) + spin;
    float ticks = abs(fract(th / 6.2831853 * max(uBlades, 3.0)) - 0.5) ;
    float tick = ticks < 0.08 ? 0.0 : 1.0;
    float ring = abs(r - 0.78) - uThickness * 0.12;
    float rune = max(ring - 0.02, tick);
    float inner = abs(r - 0.42) - 0.015;
    return min(ring, mix(rune, inner, 0.35));
  }

  float sdNeedle(vec2 p, float spin) {
    float c = cos(spin);
    float s = sin(spin);
    vec2 q = mat2(c, -s, s, c) * p;
    q.x *= 1.0 + uTaper;
    float d = abs(q.x) * 0.35 + abs(q.y) * (1.6 + uSpikes);
    return d - uThickness;
  }

  float sdSigil(vec2 p, float spin) {
    float r = length(p);
    float th = atan(p.y, p.x) + spin;
    float sides = max(uBlades, 3.0);
    float sector = 6.2831853 / sides;
    th = mod(th, sector) - sector * 0.5;
    vec2 q = vec2(cos(th), sin(th)) * r;
    q = abs(q);
    float hex = max(q.x * 0.866 + q.y * 0.5, q.y) - 0.72;
    float ring = abs(r - 0.88) - 0.03;
    float core = r - uHub;
    return min(min(hex, ring), core);
  }

  float sdColumn(vec2 p, float spin) {
    float n = snoise(vec3(p.y * 6.0 + spin, p.x * 3.0, uSeed)) * uNoiseAmt;
    float edge = abs(p.x) - uThickness * (0.55 + 0.25 * sin(p.y * uSpikes + spin));
    edge += n * 0.08;
    float cap = abs(p.y) - 0.96;
    return max(edge, cap);
  }

  float sdSheet(vec2 p, float spin) {
    float wave = sin(p.x * (4.0 + uSpikes) + spin + uTime * 2.0) * uCurve * 0.15;
    float d = abs(p.y - wave) - uThickness * 0.35;
    d = max(d, abs(p.x) - 0.98);
    return d;
  }

  float sdCage(vec2 p, float spin) {
    float n = snoise(vec3(p.y * 10.0 - uTime * 6.0, uSeed, spin)) * 0.5 + 0.5;
    float bar = abs(p.x) - (0.04 + uThickness * 0.08);
    float spark = bar - n * uNoiseAmt * 0.15;
    return max(spark, abs(p.y) - 1.0);
  }

  float sdScythe(vec2 p, float spin) {
    float c = cos(spin);
    float s = sin(spin);
    vec2 q = mat2(c, -s, s, c) * p;
    float arc = abs(length(q - vec2(-0.15, 0.0)) - 0.72) - uThickness * 0.16;
    float hook = length(q - vec2(0.45, 0.35)) - 0.22;
    float handle = max(abs(q.x + 0.55) - 0.045, abs(q.y + 0.15) - 0.7);
    return min(min(arc, hook), handle);
  }

  float sdRibbon(vec2 p, float spin) {
    float twist = p.y * uTwist + spin;
    float x = p.x - sin(twist) * 0.25 * uCurve;
    float w = uThickness * (0.45 + 0.55 * abs(cos(twist)));
    float d = abs(x) - w;
    return max(d, abs(p.y) - 1.0);
  }

  float silhouette(vec2 p, float spin) {
    float s = floor(uStyle + 0.5);
    if (s < 0.5) return sdBlade(p, spin);
    if (s < 1.5) return sdOrb(p);
    if (s < 2.5) return sdRing(p, spin);
    if (s < 3.5) return sdNeedle(p, spin);
    if (s < 4.5) return sdSigil(p, spin);
    if (s < 5.5) return sdColumn(p, spin);
    if (s < 6.5) return sdSheet(p, spin);
    if (s < 7.5) return sdCage(p, spin);
    if (s < 8.5) return sdScythe(p, spin);
    return sdRibbon(p, spin);
  }

  void main() {
    vec2 p = vLocal;
    float r = length(p);
    if (r > 1.35) discard;
    float spin = uSpin;

    #ifdef WARP
      float sd = silhouette(p, spin);
      float mask = (1.0 - smoothstep(0.0, 0.18, abs(sd))) * (1.0 - smoothstep(1.05, 1.3, r));
      vec2 radial = p / max(r, 1e-3);
      vec2 tangential = vec2(-radial.y, radial.x);
      vec2 local = mix(radial, tangential, uWarpSwirl);
      vec2 dir = normalize(vT * local.x + vB * local.y + 1e-5);
      float n = snoise(vec3(p * 3.0, uTime * 1.5 + uSeed));
      vec2 offset = dir * (0.75 + 0.25 * n);
      float strength = uWarp * uShaderIntensity * mask * uFade;
      if (strength < 0.002) discard;
      gl_FragColor = vec4(offset * 0.5 + 0.5, clamp(strength, 0.0, 1.0), clamp(mask, 0.0, 1.0));
      return;
    #else
      float sd = silhouette(p, spin);
      float ew = 0.02 + uThickness * 0.02;
      float edge = 1.0 - smoothstep(ew * 0.2, ew, abs(sd));
      float inside = 1.0 - smoothstep(-ew, ew, sd);
      float n = snoise(vec3(p * (3.0 + uSpikes * 0.15), uTime * 0.7 + uSeed));
      float veins = smoothstep(0.35, 1.0, sin(p.y * (8.0 + uBlades) + spin + n * uNoiseAmt * 4.0));
      float f1 = 1.0 - smoothstep(0.0, ew * 2.0, abs(silhouette(p, spin - 0.08)));
      float f2 = 1.0 - smoothstep(0.0, ew * 2.0, abs(silhouette(p, spin - 0.16)));
      vec3 fringe = (uColorC * f1 + uColorB * f2) * uFringe;
      float rim = pow(1.0 - abs(dot(normalize(vNormalW), normalize(vViewDir))), 2.4) * uRimGlow;
      vec3 col = uColorA * inside * uBodyOpacity * (0.55 + 0.45 * veins)
               + uColorB * edge * uEdgeGlow
               + fringe * (1.0 - inside * 0.5)
               + uColorB * rim * (edge + inside * 0.25);
      col *= uShaderIntensity * (1.0 + n * uNoiseAmt * 0.25);
      float mask = uFade * inside;
      mask = max(mask, edge * uFade);
      vec2 screenUV = gl_FragCoord.xy / uResolution;
      mask *= softFade(uSceneDepth, screenUV, vViewZ, uCameraNear, uCameraFar, uSoftFade);
      if (mask < 0.004) discard;
      gl_FragColor = vec4(col * uGlobalGlow * mask, clamp(mask, 0.0, 1.0));
    #endif
  }
`;

function uniforms() {
  return sharedUniforms({
    uCentre: { value: new Vector3() },
    uAxis: { value: new Vector3(0, 1, 0) },
    uHeading: { value: new Vector3(0, 0, 1) },
    uRadius: { value: 1 },
    uFlat: { value: 0 },
    uSpin: { value: 0 },
    uStyle: { value: 0 },
    uBlades: { value: 4 },
    uTaper: { value: 1.2 },
    uCurve: { value: 0.8 },
    uHole: { value: 0.08 },
    uHub: { value: 0.18 },
    uSpikes: { value: 6 },
    uTwist: { value: 3 },
    uThickness: { value: 0.35 },
    uNoiseAmt: { value: 0.45 },
    uEdgeGlow: { value: 3.5 },
    uBodyOpacity: { value: 0.45 },
    uFringe: { value: 0.8 },
    uRimGlow: { value: 0.8 },
    uSoftFade: { value: 0.35 },
    uFade: { value: 1 },
    uSeed: { value: 0 },
    uWarp: { value: 0.8 },
    uWarpSwirl: { value: 0.65 },
    uColorA: { value: new Color() },
    uColorB: { value: new Color() },
    uColorC: { value: new Color() }
  });
}

export function createTenthMaterial(warp = false) {
  return new ShaderMaterial({
    name: warp ? 'TenthLens' : 'TenthBody',
    defines: warp ? { WARP: '' } : {},
    transparent: true,
    depthWrite: false,
    depthTest: !warp,
    blending: warp ? NormalBlending : AdditiveBlending,
    side: DoubleSide,
    toneMapped: false,
    uniforms: uniforms(),
    vertexShader: VERT,
    fragmentShader: FRAG
  });
}
