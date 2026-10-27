import { AdditiveBlending, Color, DoubleSide, NormalBlending, ShaderMaterial } from 'three';
import { noiseGLSL } from '../../../shaders/lib/noise.glsl.js';
import { commonGLSL } from '../../../shaders/lib/common.glsl.js';
import { sharedUniforms } from '../../../core/FrameUniforms.js';

/**
 * Materials for Celestial Cartography.
 *
 * Every surface is starlight, so every material is additive and
 * `toneMapped: false` — the chart and the strike can be pushed past 1 and
 * bloom. The ability writes the uniforms from the live settings each frame;
 * `uClock` is the cast's visual clock (held at zero under reduced motion).
 * `uFade` is always the layer's opacity envelope and `uGlow` its emissive
 * multiplier (including the global glow), kept apart so a fade can be read
 * back as exactly the authored value.
 */

const SURFACE_VARYINGS = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vNormalW;
  varying vec3 vViewDir;
  varying vec3 vWorld;
  varying float vViewZ;
`;

function surfaceVertex(displace = '', header = '') {
  return /* glsl */ `
    uniform float uClock;
    ${header}
    ${SURFACE_VARYINGS}

    void main() {
      vUv = uv;
      vec3 p = position;
      ${displace}
      vec4 world = modelMatrix * vec4(p, 1.0);
      vWorld = world.xyz;
      vNormalW = normalize(mat3(modelMatrix) * normal);
      vViewDir = cameraPosition - world.xyz;
      vec4 mv = viewMatrix * world;
      vViewZ = mv.z;
      gl_Position = projectionMatrix * mv;
    }
  `;
}

function starlightMaterial({ uniforms, vertexShader = surfaceVertex(), fragmentShader }) {
  return new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    depthTest: true,
    side: DoubleSide,
    blending: AdditiveBlending,
    toneMapped: false,
    uniforms: sharedUniforms({
      uClock: { value: 0 },
      uFade: { value: 1 },
      uGlow: { value: 1 },
      uColor: { value: new Color('#d5bbff') },
      uCore: { value: new Color('#f2eaff') },
      ...uniforms
    }),
    vertexShader,
    fragmentShader
  });
}

/* ---------------------------------------------------------------------- */
/* Stars                                                                   */
/* ---------------------------------------------------------------------- */

/**
 * Faceted starlight: each facet twinkles on its own phase (noise on world
 * position, so neighbouring stars never pulse together), the rim catches the
 * view, and the boss glows white.
 */
const STAR_FRAGMENT = /* glsl */ `
  uniform float uClock;
  uniform float uFade;
  uniform float uGlow;
  uniform float uTwinkle;
  uniform vec3 uColor;
  uniform vec3 uCore;
  ${SURFACE_VARYINGS}

  ${noiseGLSL}
  ${commonGLSL}

  void main() {
    vec3 N = normalize(vNormalW);
    vec3 V = normalize(vViewDir);
    float fres = fresnelTerm(V, N, 2.0, 1.0);
    float twinkle = 0.7 + 0.3 * snoise(vec3(vWorld * 1.7 + uClock * uTwinkle * 0.6));
    float boss = 1.0 - smoothstep(0.0, 0.35, length(vUv - 0.5));
    vec3 color = mix(uColor, uCore, clamp(boss + fres * 0.4, 0.0, 1.0)) * (twinkle + fres * 0.4);
    float alpha = (0.5 + 0.3 * twinkle + boss * 0.3) * uFade;
    if (alpha < 0.004) discard;
    gl_FragColor = vec4(color * uGlow, alpha);
  }
`;

export function createStarlightMaterial() {
  return starlightMaterial({ fragmentShader: STAR_FRAGMENT, uniforms: { uTwinkle: { value: 3 } } });
}

/* ---------------------------------------------------------------------- */
/* The armillary band                                                      */
/* ---------------------------------------------------------------------- */

/**
 * Graduated brass-of-light: the band carries a fine engraved scale and a
 * bright lip on both edges; the ticks (uv.y = 2) glow, the cardinal ones
 * brighter; a highlight runs round the band with the clock.
 */
const FRAME_FRAGMENT = /* glsl */ `
  uniform float uClock;
  uniform float uFade;
  uniform float uGlow;
  uniform vec3 uColor;
  uniform vec3 uCore;
  ${SURFACE_VARYINGS}

  ${noiseGLSL}

  void main() {
    float tick = step(1.5, vUv.y);
    float lip = pow(abs(clamp(vUv.y, 0.0, 1.0) * 2.0 - 1.0), 6.0);
    float engraving = pow(max(0.0, cos(vUv.x * 6.28318 * 360.0)), 20.0) * (1.0 - tick);
    float sweep = exp(-abs(fract(vUv.x - uClock * 0.08) - 0.5) * 18.0);
    float alpha = (0.35 + lip * 0.4 + engraving * 0.3 + tick * 0.6 + sweep * 0.4) * uFade;
    if (alpha < 0.004) discard;
    gl_FragColor = vec4(mix(uColor, uCore, clamp(lip * 0.5 + tick * 0.4 + sweep, 0.0, 1.0)) * uGlow, alpha);
  }
`;

export function createFrameMaterial() {
  return starlightMaterial({ fragmentShader: FRAME_FRAGMENT });
}

/* ---------------------------------------------------------------------- */
/* The nebula veil under the chart                                         */
/* ---------------------------------------------------------------------- */

/**
 * The sky the chart is drawn on: a disc of domain-warped fbm nebula with a
 * scatter of pin-prick background stars (voronoi cell centres), feathered to
 * nothing at the rim and swirling slowly about the chart's axis.
 */
const NEBULA_FRAGMENT = /* glsl */ `
  uniform float uClock;
  uniform float uFade;
  uniform float uGlow;
  uniform float uShaderIntensity;
  uniform vec3 uColor;
  uniform vec3 uCore;
  uniform vec3 uNebula;
  ${SURFACE_VARYINGS}

  ${noiseGLSL}

  void main() {
    vec2 p = vUv * 2.0 - 1.0;
    float r = length(p);
    if (r > 1.0) discard;
    vec2 q = rot2(uClock * 0.04 + r * 0.8) * p;
    vec2 warp = vec2(fbm3(vec3(q * 1.6, uClock * 0.05)), fbm3(vec3(q * 1.6 + 5.2, uClock * 0.05)));
    float cloud = fbm4(vec3(q * 2.2 + warp * 1.4 * uShaderIntensity, 1.0)) * 0.5 + 0.5;
    cloud = smoothstep(0.35, 0.85, cloud);
    vec2 cell = voronoi2(q * 9.0);
    // Background stars: a pin at the centre of roughly a third of the cells.
    float pins = (1.0 - smoothstep(0.0, 0.06, cell.x)) * step(0.7, cell.y);
    float rim = 1.0 - smoothstep(0.55, 1.0, r);
    vec3 color = mix(uNebula, uColor, cloud) + uCore * pins;
    float alpha = (cloud * 0.35 + pins * 0.8) * rim * uFade;
    if (alpha < 0.004) discard;
    gl_FragColor = vec4(color * uGlow, alpha);
  }
`;

export function createNebulaMaterial() {
  return starlightMaterial({ fragmentShader: NEBULA_FRAGMENT, uniforms: { uNebula: { value: new Color('#3a2a7a') } } });
}

/* ---------------------------------------------------------------------- */
/* Constellation links                                                     */
/* ---------------------------------------------------------------------- */

/** Each link reveals independently as the chart is written across the sky. */
const LINK_FRAGMENT = /* glsl */ `
  uniform float uClock;
  uniform float uFade;
  uniform float uGlow;
  uniform float uReveal;
  uniform vec3 uColor;
  uniform vec3 uCore;
  ${SURFACE_VARYINGS}

  void main() {
    float drawn = 1.0 - smoothstep(uReveal - 0.025, uReveal + 0.025, vUv.y);
    float edge = 1.0 - abs(vUv.x * 2.0 - 1.0);
    float spark = pow(max(0.0, cos(vUv.y * 25.0 - uClock * 4.0)), 12.0);
    // The pen: a bright bead where the line is being drawn.
    float pen = exp(-abs(vUv.y - uReveal) * 30.0) * step(uReveal, 0.999);
    float alpha = (edge * 0.6 + spark * 0.25) * drawn * uFade + pen * edge * uFade;
    if (alpha < 0.004) discard;
    gl_FragColor = vec4(mix(uColor, uCore, pen) * uGlow, alpha);
  }
`;

export function createChartLinkMaterial() {
  return starlightMaterial({ fragmentShader: LINK_FRAGMENT, uniforms: { uReveal: { value: 0 } } });
}

/* ---------------------------------------------------------------------- */
/* The chart on the floor                                                  */
/* ---------------------------------------------------------------------- */

/**
 * The floor projection of the chart: two rings at the true radius, a band of
 * 24 hour ticks, seven slow rays and a faint nebula wash, brightening as the
 * strike charges (`uCharge`).
 */
const CHART_FRAGMENT = /* glsl */ `
  uniform float uClock;
  uniform float uFade;
  uniform float uGlow;
  uniform float uCharge;
  uniform vec3 uColor;
  ${SURFACE_VARYINGS}

  ${noiseGLSL}

  void main() {
    vec2 p = vUv * 2.0 - 1.0;
    float r = length(p);
    if (r > 1.0) discard;
    float a = atan(p.y, p.x);
    float rings = exp(-abs(r - 0.9) * 110.0) + 0.45 * exp(-abs(r - 0.7) * 85.0);
    float ticks = pow(max(0.0, cos(a * 24.0)), 24.0) * smoothstep(0.73, 0.8, r) * (1.0 - smoothstep(0.88, 0.94, r));
    float rays = pow(max(0.0, cos(a * 7.0 + uClock * 0.25)), 25.0) * smoothstep(0.15, 0.4, r) * (1.0 - smoothstep(0.65, 0.85, r));
    float wash = fbm3(vec3(p * 2.5, uClock * 0.1)) * 0.5 + 0.5;
    wash = smoothstep(0.55, 0.9, wash) * (1.0 - smoothstep(0.4, 0.9, r)) * 0.25;
    float alpha = (rings + ticks * 0.7 + rays * 0.16 + wash) * uFade * (0.35 + 0.4 * uCharge);
    if (alpha < 0.004) discard;
    gl_FragColor = vec4(uColor * uGlow, alpha);
  }
`;

export function createChartFloorMaterial() {
  return starlightMaterial({ fragmentShader: CHART_FRAGMENT, uniforms: { uCharge: { value: 0 }, uColor: { value: new Color('#ac84ff') } } });
}

/* ---------------------------------------------------------------------- */
/* The warning compass                                                     */
/* ---------------------------------------------------------------------- */

/**
 * The mark on the floor: pulsing faster as the strike charges, with a sweep
 * that closes round the rose so the remaining time is legible at a glance.
 */
const TARGET_FRAGMENT = /* glsl */ `
  uniform float uClock;
  uniform float uFade;
  uniform float uGlow;
  uniform float uCharge;
  uniform vec3 uColor;
  uniform vec3 uCore;
  ${SURFACE_VARYINGS}

  void main() {
    vec2 p = vUv * 2.0 - 1.0;
    float a = atan(p.y, p.x);
    float sweep = (a + 3.14159265) / 6.2831853;
    float closed = step(sweep, uCharge);
    float pulse = 0.65 + 0.35 * sin(uClock * (5.0 + uCharge * 10.0) + a * 8.0);
    float alpha = (0.3 + uCharge * 0.5) * pulse * (0.55 + 0.45 * closed) * uFade;
    if (alpha < 0.004) discard;
    gl_FragColor = vec4(mix(uColor, uCore, closed * uCharge) * uGlow, alpha);
  }
`;

export function createTargetMaterial() {
  return starlightMaterial({ fragmentShader: TARGET_FRAGMENT, uniforms: { uCharge: { value: 0 }, uColor: { value: new Color('#ac84ff') } } });
}

/* ---------------------------------------------------------------------- */
/* The meteor                                                              */
/* ---------------------------------------------------------------------- */

/**
 * Head and tail of the falling star. The vertex stage ripples the tail's
 * radius in travelling bulges; the fragment streaks it with noise-bent
 * filaments and burns the head white.
 */
const METEOR_DISPLACE = /* glsl */ `
  p.xz *= 1.0 + 0.06 * sin(uv.y * 14.0 - uClock * 5.0);
`;

const METEOR_FRAGMENT = /* glsl */ `
  uniform float uClock;
  uniform float uFade;
  uniform float uGlow;
  uniform vec3 uColor;
  uniform vec3 uCore;
  ${SURFACE_VARYINGS}

  ${noiseGLSL}

  void main() {
    float streak = pow(max(0.0, cos(vUv.x * 25.0 + snoise(vec3(vUv.y * 6.0 - uClock * 5.0, vUv.x * 4.0, 0.0)) * 1.5)), 10.0);
    float head = 1.0 - smoothstep(0.0, 0.85, vUv.y);
    float alpha = (0.22 + streak * 0.35 + head * 0.3) * (1.0 - vUv.y * 0.7) * uFade;
    if (alpha < 0.004) discard;
    gl_FragColor = vec4(mix(uColor, uCore, clamp(streak * 0.45 + head * 0.35, 0.0, 1.0)) * uGlow, alpha);
  }
`;

export function createMeteorMaterial() {
  return starlightMaterial({
    vertexShader: surfaceVertex(METEOR_DISPLACE),
    fragmentShader: METEOR_FRAGMENT,
    uniforms: { uColor: { value: new Color('#ac84ff') } }
  });
}

/* ---------------------------------------------------------------------- */
/* Convergence rays and the descending beam                                */
/* ---------------------------------------------------------------------- */

/**
 * A ray of the chart bending onto the mark: brightest along its axis (facing
 * ratio), a bead of light racing root → tip, soft-faded where it meets the
 * floor so the convergence point never cuts a hard edge.
 */
const RAY_FRAGMENT = /* glsl */ `
  uniform float uClock;
  uniform float uFade;
  uniform float uGlow;
  uniform vec3 uColor;
  uniform vec3 uCore;
  uniform vec2 uResolution;
  uniform sampler2D uSceneDepth;
  uniform float uCameraNear;
  uniform float uCameraFar;
  ${SURFACE_VARYINGS}

  ${noiseGLSL}
  ${commonGLSL}

  void main() {
    vec3 N = normalize(vNormalW);
    vec3 V = normalize(vViewDir);
    float facing = pow(abs(dot(N, V)), 1.2);
    float bead = exp(-abs(vUv.y - fract(uClock * 1.4)) * 12.0);
    float shimmer = 0.75 + 0.25 * snoise(vec3(vUv.y * 8.0 - uClock * 3.0, vUv.x * 3.0, 1.0));
    float alpha = (facing * shimmer + bead * facing) * uFade;
    if (alpha < 0.004) discard;
    alpha *= softFade(uSceneDepth, gl_FragCoord.xy / uResolution, vViewZ, uCameraNear, uCameraFar, 0.3);
    gl_FragColor = vec4(mix(uColor, uCore, bead) * uGlow, alpha);
  }
`;

export function createRayMaterial() {
  return starlightMaterial({ fragmentShader: RAY_FRAGMENT, uniforms: { uColor: { value: new Color('#ac84ff') } } });
}

/* ---------------------------------------------------------------------- */
/* The corona and the shards                                               */
/* ---------------------------------------------------------------------- */

/** The strike's corona: spikes (uv.y → 1) burn hotter than the ring. */
const CORONA_FRAGMENT = /* glsl */ `
  uniform float uClock;
  uniform float uFade;
  uniform float uGlow;
  uniform vec3 uColor;
  uniform vec3 uCore;
  ${SURFACE_VARYINGS}

  ${noiseGLSL}

  void main() {
    float flicker = 0.7 + 0.3 * snoise(vec3(vUv.x * 12.0, uClock * 6.0, 0.0));
    float spike = smoothstep(0.3, 1.0, vUv.y);
    float alpha = (0.5 + spike * 0.5) * flicker * uFade;
    if (alpha < 0.004) discard;
    gl_FragColor = vec4(mix(uColor, uCore, 1.0 - spike * 0.5) * uGlow, alpha);
  }
`;

export function createCoronaMaterial() {
  return starlightMaterial({ fragmentShader: CORONA_FRAGMENT });
}

/* ---------------------------------------------------------------------- */
/* Gravitational lens — LAYER.DISTORTION                                   */
/* ---------------------------------------------------------------------- */

/**
 * A camera-facing quad at the strike point written into the distortion
 * buffer (`vec4(offset * 0.5 + 0.5, strength, mask)`): a ring-shaped lens
 * that bends the world *around* the falling star, tightening as it lands.
 */
const WARP_VERTEX = /* glsl */ `
  uniform float uWidth;
  uniform float uHeight;
  varying vec2 vUv;
  varying vec3 vWorld;

  void main() {
    vUv = uv;
    vec4 mv = modelViewMatrix * vec4(0.0, 0.0, 0.0, 1.0);
    mv.xy += position.xy * vec2(uWidth, uHeight);
    vWorld = (modelMatrix * vec4(position.x * uWidth, position.y * uHeight, 0.0, 1.0)).xyz;
    gl_Position = projectionMatrix * mv;
  }
`;

const WARP_FRAGMENT = /* glsl */ `
  uniform float uClock;
  uniform float uStrength;
  uniform float uRing;
  uniform float uShaderIntensity;
  varying vec2 vUv;
  varying vec3 vWorld;

  ${noiseGLSL}

  void main() {
    vec2 c = vUv * 2.0 - 1.0;
    float r = length(c);
    vec2 tangent = vec2(-c.y, c.x) / max(r, 1e-3);
    vec2 radial = c / max(r, 1e-3);
    float n = snoise(vec3(c * 3.0, uClock * 1.2));
    vec2 offset = normalize(radial * 0.8 + tangent * 0.4 + n * 0.3 + 1e-4);
    float lens = exp(-abs(r - uRing) * 6.0) * (1.0 - smoothstep(0.85, 1.0, r));
    float strength = uStrength * uShaderIntensity * lens;
    if (strength < 0.002) discard;
    gl_FragColor = vec4(offset * 0.5 + 0.5, strength, lens);
  }
`;

export function createLensWarpMaterial() {
  return new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    depthTest: false,
    blending: NormalBlending,
    side: DoubleSide,
    toneMapped: false,
    uniforms: sharedUniforms({
      uClock: { value: 0 },
      uWidth: { value: 3 },
      uHeight: { value: 3 },
      uStrength: { value: 0 },
      uRing: { value: 0.6 }
    }),
    vertexShader: WARP_VERTEX,
    fragmentShader: WARP_FRAGMENT
  });
}
