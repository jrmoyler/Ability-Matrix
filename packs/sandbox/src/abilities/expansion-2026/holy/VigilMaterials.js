import { AdditiveBlending, Color, DoubleSide, NormalBlending, ShaderMaterial } from 'three';
import { noiseGLSL } from '../../../shaders/lib/noise.glsl.js';
import { commonGLSL } from '../../../shaders/lib/common.glsl.js';
import { sharedUniforms } from '../../../core/FrameUniforms.js';

/**
 * Materials for Vigil of Embers.
 *
 * Raw `ShaderMaterial`s on the shared noise / common libraries. The ability
 * resolves `settings[ID]` once per frame and writes the uniforms; nothing here
 * reads settings, so one material can serve every arch (or every bell) of the
 * rig. `uClock` is the cast's visual clock (held at zero under reduced
 * motion), never the shared frame time.
 *
 * The sanctuary is *light*, not stone: every surface is additive and
 * `toneMapped: false`, so pulses can push it past 1 and bloom. Form comes from
 * fresnel rims, grain and the authored geometry, not from opacity.
 */

const SURFACE_VARYINGS = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vNormalW;
  varying vec3 vViewDir;
  varying vec3 vWorld;
  varying float vViewZ;
`;

/** Pass-through vertex stage with an optional displacement hook. */
function surfaceVertex(displace = '') {
  return /* glsl */ `
    uniform float uClock;
    ${SURFACE_VARYINGS}
    ${displace ? noiseGLSL : ''}

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

function holyMaterial({ uniforms, vertexShader = surfaceVertex(), fragmentShader, blending = AdditiveBlending, depthTest = true }) {
  return new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    depthTest,
    side: DoubleSide,
    blending,
    toneMapped: false,
    uniforms: sharedUniforms({
      uClock: { value: 0 },
      uFade: { value: 1 },
      uPulse: { value: 0 },
      uGlow: { value: 1 },
      uColor: { value: new Color('#ffe9ac') },
      uCore: { value: new Color('#ffffff') },
      ...uniforms
    }),
    vertexShader,
    fragmentShader
  });
}

/* ---------------------------------------------------------------------- */
/* The arches                                                              */
/* ---------------------------------------------------------------------- */

/**
 * Vaulted arches of light. They *build* on arrival: a noise-ragged dissolve
 * front climbs from both feet (uv.x = 0 and 1) to the keystone (0.5), its
 * edge burning white. Fine vertical grain shimmers in the faces, the box
 * edges carry a gilt trim (uv.y crosses a face boundary every 0.25), the rim
 * catches the view by fresnel, and each accepted pulse sends a ripple of
 * light up the sweep.
 */
const ARCH_FRAGMENT = /* glsl */ `
  uniform float uClock;
  uniform float uFade;
  uniform float uPulse;
  uniform float uBuild;
  uniform float uGlow;
  uniform float uShaderIntensity;
  uniform vec3 uColor;
  uniform vec3 uCore;
  ${SURFACE_VARYINGS}

  ${noiseGLSL}
  ${commonGLSL}

  void main() {
    vec3 N = normalize(vNormalW);
    vec3 V = normalize(vViewDir);
    float fres = fresnelTerm(V, N, 2.2, 1.0);

    // Build front: feet first, keystone last.
    float climb = 1.0 - abs(vUv.x - 0.5) * 2.0;
    float n = snoise01(vec3(vUv.x * 14.0, vUv.y * 6.0, 1.3));
    vec2 build = dissolveMask(1.0 - climb + n * 0.25 * uShaderIntensity, 1.25 - uBuild * 1.3, 0.08);
    float built = 1.0 - build.x;

    float grain = 0.5 + 0.5 * sin(vUv.x * 160.0 + snoise(vec3(vUv * vec2(40.0, 8.0), uClock * 0.4)) * 2.0);
    float faceEdge = abs(fract(vUv.y * 4.0) - 0.5) * 2.0;
    float trim = smoothstep(0.82, 1.0, faceEdge);
    // The pulse climbs the sweep from the feet to the keystone as it decays.
    float ripple = exp(-abs(climb - (1.0 - uPulse)) * 18.0) * uPulse;

    vec3 color = mix(uColor, uCore, clamp(trim * 0.5 + fres * 0.4 + uPulse * 0.35 + ripple, 0.0, 1.0));
    float alpha = (0.22 + grain * 0.1 + trim * 0.35 + fres * 0.35 + uPulse * 0.25 + ripple * 0.6) * built;
    alpha += build.y * 1.2; // the burning build edge
    alpha *= uFade;
    if (alpha < 0.004) discard;
    gl_FragColor = vec4(color * uGlow, alpha);
  }
`;

export function createVigilArchMaterial() {
  return holyMaterial({ fragmentShader: ARCH_FRAGMENT, uniforms: { uBuild: { value: 1 } } });
}

/* ---------------------------------------------------------------------- */
/* Bells and the crown                                                     */
/* ---------------------------------------------------------------------- */

/**
 * Gilt metal that *rings*: brushed-gold bands follow the lathe profile, a
 * fresnel rim outlines the silhouette, and `uRing` (the pulse envelope) runs
 * bright standing-wave rings round the body — the strike made visible.
 */
const GILT_FRAGMENT = /* glsl */ `
  uniform float uClock;
  uniform float uFade;
  uniform float uPulse;
  uniform float uRing;
  uniform float uGlow;
  uniform vec3 uColor;
  uniform vec3 uCore;
  uniform vec3 uGilt;
  ${SURFACE_VARYINGS}

  ${noiseGLSL}
  ${commonGLSL}

  void main() {
    vec3 N = normalize(vNormalW);
    vec3 V = normalize(vViewDir);
    float fres = fresnelTerm(V, N, 2.6, 1.0);
    float brush = snoise01(vec3(vUv.x * 2.0, vUv.y * 40.0, 0.7));
    float bands = smoothstep(0.75, 1.0, sin(vUv.y * 38.0) * 0.5 + 0.5);
    float ring = pow(max(0.0, sin(vUv.y * 24.0 - uClock * 30.0)), 6.0) * uRing;

    vec3 color = uGilt * (0.45 + 0.35 * brush) + uColor * bands * 0.4 + uCore * (fres * 0.8 + ring + uPulse * 0.3);
    float alpha = (0.35 + fres * 0.45 + bands * 0.15 + ring * 0.6 + uPulse * 0.2) * uFade;
    if (alpha < 0.004) discard;
    gl_FragColor = vec4(color * uGlow, alpha);
  }
`;

export function createVigilGiltMaterial() {
  return holyMaterial({ fragmentShader: GILT_FRAGMENT, uniforms: { uRing: { value: 0 }, uGilt: { value: new Color('#ffcf6a') } } });
}

/* ---------------------------------------------------------------------- */
/* The lamp flames                                                         */
/* ---------------------------------------------------------------------- */

/**
 * A flame: the vertex stage sways the column with height-weighted noise (the
 * foot stays planted in its lamp), the fragment carves licking tongues from
 * domain-warped fbm scrolling upward, with a white core at the root fading to
 * the holy colour at the tip. A pulse flares the whole flame.
 */
const FLAME_DISPLACE = /* glsl */ `
  float sway = uv.y * uv.y;
  p.x += (snoise(vec3(uv.y * 2.5, uClock * 1.6, 0.0)) * uSway + sin(uClock * 4.0 + uv.y * 6.0) * uSway * 0.4) * sway;
  p.z += snoise(vec3(uv.y * 2.5, uClock * 1.6, 7.0)) * uSway * sway;
`;

const FLAME_VERTEX = /* glsl */ `
  uniform float uSway;
  ${surfaceVertex(FLAME_DISPLACE)}
`;

const FLAME_FRAGMENT = /* glsl */ `
  uniform float uClock;
  uniform float uFade;
  uniform float uPulse;
  uniform float uGlow;
  uniform float uShaderIntensity;
  uniform vec3 uColor;
  uniform vec3 uCore;
  ${SURFACE_VARYINGS}

  ${noiseGLSL}
  ${commonGLSL}

  void main() {
    vec3 N = normalize(vNormalW);
    vec3 V = normalize(vViewDir);
    float facing = abs(dot(N, V));
    vec3 q = vec3(vUv.x * 4.0, vUv.y * 2.2 - uClock * 1.8, uClock * 0.3);
    q.xy += vec2(fbm3(q * 0.8), fbm3(q * 0.8 + 3.1)) * 0.6 * uShaderIntensity;
    float tongues = smoothstep(0.25, 0.75, fbm4(q) * 0.5 + 0.5 + (0.5 - vUv.y) * 0.9);
    float core = pow(1.0 - vUv.y, 2.0) * facing;
    float body = sin(vUv.y * 3.14159);

    vec3 color = mix(uColor, uCore, clamp(core * 0.9 + uPulse * 0.25, 0.0, 1.0));
    float alpha = (0.15 + core * 0.55 + tongues * 0.45 + uPulse * 0.2) * body * uFade;
    if (alpha < 0.004) discard;
    gl_FragColor = vec4(color * uGlow * (1.0 + uPulse * 0.6), alpha);
  }
`;

export function createVigilFlameMaterial() {
  return holyMaterial({ vertexShader: FLAME_VERTEX, fragmentShader: FLAME_FRAGMENT, uniforms: { uSway: { value: 0.07 } } });
}

/* ---------------------------------------------------------------------- */
/* The floor sigil                                                         */
/* ---------------------------------------------------------------------- */

/**
 * The consecrated floor. Drawn in on arrival by an angular sweep (`uReveal`),
 * it carries two boundary rings at the true damage radius, eight spokes that
 * line up with the arches, a band of rune cells (voronoi) between the inner
 * rings, a slow ember noise in the field, and the pulse wave (`uWave`, radius
 * 0..1) as a bright travelling ring. On exit it dissolves from the rim in.
 */
const FLOOR_FRAGMENT = /* glsl */ `
  uniform float uClock;
  uniform float uFade;
  uniform float uPulse;
  uniform float uWave;
  uniform float uReveal;
  uniform float uSpin;
  uniform float uGlow;
  uniform float uShaderIntensity;
  uniform vec3 uColor;
  uniform vec3 uCore;
  ${SURFACE_VARYINGS}

  ${noiseGLSL}
  ${commonGLSL}

  void main() {
    vec2 p = vUv * 2.0 - 1.0;
    float r = length(p);
    if (r > 1.0) discard;
    p = rot2(uClock * uSpin) * p;
    float a = atan(p.y, p.x);
    float sweep = (a + 3.14159265) / 6.2831853;
    // 1 behind the sweep, 0 ahead of it; fully drawn at uReveal = 1.
    float drawn = 1.0 - smoothstep(uReveal * 1.05 - 0.05, uReveal * 1.05, sweep);

    float rings = exp(-abs(r - 0.96) * 120.0) + 0.7 * exp(-abs(r - 0.9) * 140.0) + 0.6 * exp(-abs(r - 0.62) * 110.0);
    float spokes = pow(max(0.0, cos(a * 8.0)), 60.0) * smoothstep(0.2, 0.3, r) * (1.0 - smoothstep(0.88, 0.9, r));
    vec2 cell = voronoi2(vec2(a * 6.0, r * 14.0));
    float runeBand = smoothstep(0.66, 0.68, r) * (1.0 - smoothstep(0.84, 0.86, r));
    // Rune cells: about half the cells in the band carry a glowing glyph dot.
    float runes = step(0.5, cell.y) * (1.0 - smoothstep(0.12, 0.28, cell.x)) * runeBand;
    float embers = pow(snoise01(vec3(p * 5.0, uClock * 0.5)), 5.0) * uShaderIntensity * (1.0 - smoothstep(0.6, 0.95, r));
    float wave = exp(-abs(r - uWave) * 40.0) * step(0.01, uWave) * uPulse;
    float centre = exp(-r * 6.0) * 0.4;

    float alpha = (rings * 0.8 + spokes * 0.5 + runes * 0.55 + embers * 0.6 + centre) * drawn + wave * 1.2;
    // Exit: dissolve from the rim inward with a ragged edge.
    vec2 exitMask = dissolveMask(1.0 - r + snoise01(vec3(p * 4.0, 5.0)) * 0.2, 1.1 - uFade * 1.2, 0.06);
    alpha = alpha * exitMask.x + exitMask.y * 0.8 * drawn;
    alpha *= min(1.0, uFade * 2.0);
    if (alpha < 0.004) discard;
    vec3 color = mix(uColor, uCore, clamp(rings * 0.3 + wave + centre, 0.0, 1.0));
    gl_FragColor = vec4(color * uGlow, alpha * 0.6);
  }
`;

export function createVigilFloorMaterial() {
  return holyMaterial({
    fragmentShader: FLOOR_FRAGMENT,
    uniforms: { uWave: { value: 0 }, uReveal: { value: 0 }, uSpin: { value: 0.05 } }
  });
}

/* ---------------------------------------------------------------------- */
/* The expanding curtain                                                   */
/* ---------------------------------------------------------------------- */

/**
 * A wall of light thrown outward by each pulse. Light columns ride the
 * bearing (one per arch bay and finer between), broken by fbm that climbs;
 * a bright band sits low where the curtain sweeps the floor; top and foot
 * are feathered so it never cuts a ring.
 */
const CURTAIN_DISPLACE = /* glsl */ `
  p.xz *= 1.0 + 0.018 * sin(uv.x * 37.7 + uClock * 2.0) * uv.y;
`;

const CURTAIN_FRAGMENT = /* glsl */ `
  uniform float uClock;
  uniform float uFade;
  uniform float uGlow;
  uniform float uShaderIntensity;
  uniform vec3 uColor;
  uniform vec3 uCore;
  ${SURFACE_VARYINGS}

  ${noiseGLSL}

  void main() {
    float bays = pow(max(0.0, cos(vUv.x * 50.265)), 10.0);
    float fine = pow(max(0.0, cos(vUv.x * 301.6 + sin(vUv.y * 7.0 - uClock))), 14.0);
    float climb = fbm3(vec3(vUv.x * 24.0, vUv.y * 3.0 - uClock * 1.4, 0.5)) * 0.5 + 0.5;
    climb = mix(1.0, climb, uShaderIntensity);
    float band = exp(-abs(vUv.y - 0.15) * 7.0);
    float feather = smoothstep(0.0, 0.06, vUv.y) * (1.0 - smoothstep(0.55, 1.0, vUv.y));
    vec3 color = mix(uColor, uCore, clamp(bays * 0.45 + band * 0.35, 0.0, 1.0));
    float alpha = (0.1 + bays * 0.35 + fine * 0.25 + band * 0.25) * (0.5 + climb) * feather * uFade;
    if (alpha < 0.004) discard;
    gl_FragColor = vec4(color * uGlow, alpha);
  }
`;

export function createVigilCurtainMaterial() {
  return holyMaterial({ vertexShader: surfaceVertex(CURTAIN_DISPLACE), fragmentShader: CURTAIN_FRAGMENT });
}

/* ---------------------------------------------------------------------- */
/* The column of light                                                     */
/* ---------------------------------------------------------------------- */

/**
 * The shaft from the crown to the floor: god-rays as vertical streaks of
 * noise that drift slowly round, brightest where the eye looks *through* the
 * shell (inverse fresnel), faded top and bottom and soft against the floor.
 */
const SHAFT_FRAGMENT = /* glsl */ `
  uniform float uClock;
  uniform float uFade;
  uniform float uPulse;
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
    float through = pow(abs(dot(N, V)), 1.5);
    float rays = snoise01(vec3(vUv.x * 18.0 + uClock * 0.15, vUv.y * 0.8 - uClock * 0.25, 2.0));
    rays = pow(rays, 3.0);
    float ends = smoothstep(0.0, 0.2, vUv.y) * (1.0 - smoothstep(0.7, 1.0, vUv.y));
    float alpha = (0.15 + rays * 0.85) * through * ends * (1.0 + uPulse * 0.8) * uFade;
    if (alpha < 0.004) discard;
    alpha *= softFade(uSceneDepth, gl_FragCoord.xy / uResolution, vViewZ, uCameraNear, uCameraFar, 0.5);
    gl_FragColor = vec4(mix(uColor, uCore, rays * 0.5) * uGlow, alpha);
  }
`;

/** The column is built as a cylinder; its foot is widened here so it stays live. */
const SHAFT_VERTEX = /* glsl */ `
  uniform float uFoot;
  ${surfaceVertex('p.xz *= mix(uFoot, 1.0, uv.y);')}
`;

export function createVigilShaftMaterial() {
  return holyMaterial({ vertexShader: SHAFT_VERTEX, fragmentShader: SHAFT_FRAGMENT, uniforms: { uFoot: { value: 1.6 } } });
}

/* ---------------------------------------------------------------------- */
/* Heat over the lamps — LAYER.DISTORTION                                  */
/* ---------------------------------------------------------------------- */

/**
 * A camera-facing quad over the sanctuary written into the distortion buffer
 * (`vec4(offset * 0.5 + 0.5, strength, mask)`): rising heat over the lamp
 * ring, with a radial kick when a pulse goes out.
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
  uniform float uKick;
  uniform float uShaderIntensity;
  varying vec2 vUv;
  varying vec3 vWorld;

  ${noiseGLSL}

  void main() {
    vec2 c = vUv * 2.0 - 1.0;
    vec3 np = vec3(vWorld.xz * 1.8, vWorld.y * 1.8 - uClock * 1.6);
    vec2 n = vec2(snoise(np), snoise(np + vec3(11.0, 3.0, 23.0)));
    vec2 radial = normalize(c + 1e-4);
    vec2 offset = normalize(n + radial * uKick * 2.0 + 1e-4);
    float mask = (1.0 - smoothstep(0.55, 1.0, length(c)));
    float strength = (uStrength + uKick) * uShaderIntensity * mask;
    if (strength < 0.002) discard;
    gl_FragColor = vec4(offset * 0.5 + 0.5, strength, mask);
  }
`;

export function createVigilWarpMaterial() {
  return new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    depthTest: false,
    blending: NormalBlending,
    side: DoubleSide,
    toneMapped: false,
    uniforms: sharedUniforms({
      uClock: { value: 0 },
      uWidth: { value: 6 },
      uHeight: { value: 2 },
      uStrength: { value: 0 },
      uKick: { value: 0 }
    }),
    vertexShader: WARP_VERTEX,
    fragmentShader: WARP_FRAGMENT
  });
}

/* ---------------------------------------------------------------------- */
/* Pulse glyph and footprint (owned by VigilPulses)                        */
/* ---------------------------------------------------------------------- */

/**
 * The pulse glyph: twelve raised flame petals, ribbed, with a ring front that
 * rides out with `uProgress` and a noise burn-away as it finishes.
 */
const PULSE_DISPLACE = /* glsl */ `
  p.y += sin(uv.x * 16.0 + uv.y * 13.0 - uClock * 2.0) * 0.025 * (1.0 - uProgress);
`;

const PULSE_VERTEX = /* glsl */ `
  uniform float uProgress;
  ${surfaceVertex(PULSE_DISPLACE)}
`;

const PULSE_FRAGMENT = /* glsl */ `
  uniform float uClock;
  uniform float uFade;
  uniform float uProgress;
  uniform vec3 uColor;
  uniform vec3 uCore;
  ${SURFACE_VARYINGS}

  ${noiseGLSL}
  ${commonGLSL}

  void main() {
    vec2 p = vUv * 2.0 - 1.0;
    float r = length(p);
    float a = atan(p.y, p.x);
    float ribs = pow(max(0.0, cos(a * 12.0 + uClock * 0.3)), 12.0);
    float front = exp(-abs(r - (0.3 + uProgress * 0.45)) * 22.0);
    vec2 burn = dissolveMask(snoise01(vec3(p * 6.0, 4.1)), uProgress * uProgress, 0.1);
    float alpha = ((0.18 + ribs * 0.35 + front * 0.3) * burn.x + burn.y * 0.6) * uFade;
    if (alpha < 0.004) discard;
    gl_FragColor = vec4(mix(uColor, uCore, clamp(ribs * 0.35 + front * 0.35 + burn.y, 0.0, 1.0)), alpha);
  }
`;

export function createVigilPulseMaterial() {
  return holyMaterial({ vertexShader: PULSE_VERTEX, fragmentShader: PULSE_FRAGMENT, uniforms: { uProgress: { value: 0 }, uFade: { value: 0 } } });
}

/**
 * The immediate footprint: the whole damage disc lights for an instant, so
 * the player reads exactly what the pulse covered.
 */
const FOOTPRINT_FRAGMENT = /* glsl */ `
  uniform float uFade;
  uniform vec3 uColor;
  uniform vec3 uCore;
  ${SURFACE_VARYINGS}

  ${noiseGLSL}

  void main() {
    vec2 p = vUv * 2.0 - 1.0;
    float r = length(p);
    float inside = 1.0 - smoothstep(0.9, 1.0, r);
    float edge = exp(-abs(r - 0.88) * 35.0);
    float centre = exp(-r * 3.0);
    float grain = 0.8 + 0.4 * snoise01(vec3(p * 9.0, 1.0));
    float alpha = inside * (0.16 + edge * 0.35 + centre * 0.12) * grain * uFade;
    if (alpha < 0.004) discard;
    gl_FragColor = vec4(mix(uColor, uCore, centre * 0.35 + edge * 0.25), alpha);
  }
`;

export function createVigilFootprintMaterial() {
  return holyMaterial({ fragmentShader: FOOTPRINT_FRAGMENT, uniforms: { uFade: { value: 0 } } });
}
