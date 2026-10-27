import { AdditiveBlending, Color, DoubleSide, NormalBlending, ShaderMaterial } from 'three';
import { noiseGLSL } from '../../../shaders/lib/noise.glsl.js';
import { commonGLSL } from '../../../shaders/lib/common.glsl.js';
import { sharedUniforms } from '../../../core/FrameUniforms.js';

/**
 * Materials for Heliostat Verdict.
 *
 * Every factory returns a raw `ShaderMaterial` with hand-written GLSL on the
 * shared noise / common libraries. None of them reads `settings` itself: the
 * ability resolves the live block once per frame and writes uniforms, so a
 * material can be shared between the travelling lens and the standing rig.
 *
 * `uClock` is the cast's *visual* clock rather than the shared frame time:
 * under reduced motion the ability holds it at zero, which freezes every
 * shimmer and scroll while gameplay timing carries on.
 *
 * Emissive materials are `toneMapped: false`, so anything pushed past 1 by a
 * glow slider blooms.
 */

/* ---------------------------------------------------------------------- */
/* Shared vertex stage                                                     */
/* ---------------------------------------------------------------------- */

/** World-space normal, view vector and view depth: what fresnel and soft fades need. */
const SURFACE_VERTEX = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vNormalW;
  varying vec3 vViewDir;
  varying vec3 vWorld;
  varying float vViewZ;

  void main() {
    vUv = uv;
    vec4 world = modelMatrix * vec4(position, 1.0);
    vWorld = world.xyz;
    vNormalW = normalize(mat3(modelMatrix) * normal);
    vViewDir = cameraPosition - world.xyz;
    vec4 mv = viewMatrix * world;
    vViewZ = mv.z;
    gl_Position = projectionMatrix * mv;
  }
`;

const SURFACE_VARYINGS = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vNormalW;
  varying vec3 vViewDir;
  varying vec3 vWorld;
  varying float vViewZ;
`;

function baseMaterial({ uniforms, vertexShader = SURFACE_VERTEX, fragmentShader, additive = true }) {
  return new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    depthTest: true,
    side: DoubleSide,
    blending: additive ? AdditiveBlending : NormalBlending,
    toneMapped: false,
    uniforms: sharedUniforms({ uClock: { value: 0 }, uFade: { value: 1 }, ...uniforms }),
    vertexShader,
    fragmentShader
  });
}

/* ---------------------------------------------------------------------- */
/* 2 · The mirror dish                                                     */
/* ---------------------------------------------------------------------- */

/**
 * Concave mirror glass on a gilt frame.
 *
 * Normal-blended rather than additive: the dish is an *object*, and an
 * additive mirror is a ghost with no weight. The glass reflects a two-tone sky
 * (`uSky` overhead, the ray colour toward the horizon) off the real reflected
 * view vector, so tilting panels flash as they turn; a caustic band of ridged
 * noise crawls across it; the charge floods each panel from the hub outward.
 * Frame and hub (`aInfo.y` ≥ 2) are brushed gold with a hot edge.
 */
const MIRROR_VERTEX = /* glsl */ `
  attribute vec2 aInfo;
  varying vec2 vInfo;
  ${SURFACE_VARYINGS}

  void main() {
    vUv = uv;
    vInfo = aInfo;
    vec4 world = modelMatrix * vec4(position, 1.0);
    vWorld = world.xyz;
    vNormalW = normalize(mat3(modelMatrix) * normal);
    vViewDir = cameraPosition - world.xyz;
    vec4 mv = viewMatrix * world;
    vViewZ = mv.z;
    gl_Position = projectionMatrix * mv;
  }
`;

const MIRROR_FRAGMENT = /* glsl */ `
  uniform float uClock;
  uniform float uFade;
  uniform float uCharge;
  uniform float uOpen;
  uniform float uGlow;
  uniform float uFresnel;
  uniform float uShimmer;
  uniform float uShaderIntensity;
  uniform vec3 uColor;
  uniform vec3 uCore;
  uniform vec3 uSky;
  varying vec2 vInfo;
  ${SURFACE_VARYINGS}

  ${noiseGLSL}
  ${commonGLSL}

  void main() {
    vec3 N = normalize(vNormalW);
    vec3 V = normalize(vViewDir);
    if (dot(N, V) < 0.0) N = -N;
    float face = vInfo.y;
    float panel = vInfo.x;

    // Unfold: panels appear from the hub outward as the dish opens.
    float reach = smoothstep(vUv.y - 0.25, vUv.y + 0.05, uOpen * 1.25);
    if (face >= 2.5) reach = smoothstep(0.0, 0.3, uOpen);

    float fres = fresnelTerm(V, N, uFresnel, 1.0);
    vec3 R = reflect(-V, N);
    vec3 sky = mix(uColor * 0.55, uSky, smoothstep(-0.25, 0.85, R.y));

    // Caustic band: ridged noise on the panel, drifting with the clock.
    float caustic = ridged(vec3(vUv * vec2(3.0, 2.0) + panel * 9.0, uClock * 0.7), 3);
    caustic = pow(clamp(caustic, 0.0, 1.0), 3.0) * uShimmer * uShaderIntensity;

    // Bevel: the slab's edges catch the light.
    float edgeDist = min(min(vUv.x, 1.0 - vUv.x), min(vUv.y, 1.0 - vUv.y));
    float bevel = 1.0 - smoothstep(0.0, 0.09, edgeDist);

    // The charge floods outward from the hub; each panel pulses in turn.
    float flood = smoothstep(vUv.y - 0.2, vUv.y, uCharge * 1.2);
    float beat = 0.5 + 0.5 * sin(panel * 6.28318 * 3.0 - uClock * 7.0);

    vec3 color;
    float alpha;
    if (face < 0.5) {
      // Glass.
      color = sky * (0.35 + 0.75 * fres) + uColor * caustic * 1.4 + uCore * bevel * 0.6;
      color += uCore * flood * (0.35 + 0.4 * beat) * uCharge;
      alpha = 0.55 + 0.35 * fres + 0.2 * bevel;
    } else if (face < 1.5) {
      // Back plate: darker gilt, so the silhouette has a top and a bottom.
      color = uColor * (0.18 + 0.25 * fres) + uCore * bevel * 0.25;
      alpha = 0.7;
    } else {
      // Frame, spokes and hub: brushed gold with a hot rim.
      float brush = snoise01(vec3(vUv * vec2(1.0, 18.0), panel * 5.0));
      color = uColor * (0.45 + 0.35 * brush) + uCore * fres * 0.8 + uCore * uCharge * 0.35;
      alpha = 0.85;
    }

    alpha *= reach * uFade;
    if (alpha < 0.004) discard;
    gl_FragColor = vec4(color * uGlow, clamp(alpha, 0.0, 1.0));
  }
`;

export function createHeliostatMirrorMaterial() {
  return baseMaterial({
    additive: false,
    vertexShader: MIRROR_VERTEX,
    fragmentShader: MIRROR_FRAGMENT,
    uniforms: {
      uCharge: { value: 0 },
      uOpen: { value: 1 },
      uGlow: { value: 1.3 },
      uFresnel: { value: 2.4 },
      uShimmer: { value: 0.6 },
      uColor: { value: new Color('#ffe58b') },
      uCore: { value: new Color('#ffffff') },
      uSky: { value: new Color('#9cc4ff') }
    }
  });
}

/* ---------------------------------------------------------------------- */
/* Orbiting facets and the travelling lens                                 */
/* ---------------------------------------------------------------------- */

/**
 * Prismatic glass. The ridge splits the light: the two halves of each facet
 * are tinted toward the ray colour and toward the sky, and a dispersion band
 * slides across with the clock. Fresnel rim, additive.
 */
const PRISM_FRAGMENT = /* glsl */ `
  uniform float uClock;
  uniform float uFade;
  uniform float uCharge;
  uniform float uGlow;
  uniform float uFresnel;
  uniform vec3 uColor;
  uniform vec3 uCore;
  uniform vec3 uSky;
  ${SURFACE_VARYINGS}

  ${noiseGLSL}
  ${commonGLSL}

  void main() {
    vec3 N = normalize(vNormalW);
    vec3 V = normalize(vViewDir);
    float fres = fresnelTerm(V, N, uFresnel, 1.0);
    vec2 p = vUv * 2.0 - 1.0;
    float r = length(p);

    // Dispersion: a band sweeping across the facet, split either side of the ridge.
    float band = sin((p.x + p.y) * 5.0 - uClock * 3.0) * 0.5 + 0.5;
    vec3 split = mix(uColor, uSky, step(0.0, p.x));
    float sparkle = pow(snoise01(vec3(vWorld * 4.0 + uClock * 0.6)), 6.0);

    vec3 color = mix(split, uCore, clamp(fres * 0.6 + uCharge * 0.35, 0.0, 1.0));
    color += uCore * sparkle * 1.5;
    float alpha = (0.18 + band * 0.3 + fres * 0.45 + sparkle * 0.4) * (1.0 - smoothstep(0.9, 1.3, r));
    alpha *= uFade;
    if (alpha < 0.004) discard;
    gl_FragColor = vec4(color * uGlow, alpha);
  }
`;

export function createHeliostatPrismMaterial() {
  return baseMaterial({
    fragmentShader: PRISM_FRAGMENT,
    uniforms: {
      uCharge: { value: 0 },
      uGlow: { value: 1.2 },
      uFresnel: { value: 2.0 },
      uColor: { value: new Color('#ffe58b') },
      uCore: { value: new Color('#ffffff') },
      uSky: { value: new Color('#9cc4ff') }
    }
  });
}

/* ---------------------------------------------------------------------- */
/* The iris                                                                */
/* ---------------------------------------------------------------------- */

/**
 * Iris blades: a bright spine down the middle of each blade (where the
 * lenticular section peaks), etched cross-hatching that shimmers down the
 * blade, and a heat colour that climbs toward the core as the charge builds.
 */
const IRIS_FRAGMENT = /* glsl */ `
  uniform float uClock;
  uniform float uFade;
  uniform float uCharge;
  uniform float uGlow;
  uniform vec3 uColor;
  uniform vec3 uCore;
  ${SURFACE_VARYINGS}

  ${noiseGLSL}
  ${commonGLSL}

  void main() {
    vec3 N = normalize(vNormalW);
    vec3 V = normalize(vViewDir);
    float fres = fresnelTerm(V, N, 2.0, 1.0);
    float spine = exp(-abs(vUv.x - 0.5) * 14.0);
    float etch = pow(max(0.0, cos(vUv.y * 46.0 - uClock * 5.0 + snoise(vec3(vUv * 6.0, uClock)) * 1.5)), 10.0);
    float tip = smoothstep(0.0, 0.08, vUv.y) * (1.0 - smoothstep(0.92, 1.0, vUv.y) * 0.6);

    vec3 color = mix(uColor, uCore, clamp(spine * 0.55 + uCharge * 0.4 + fres * 0.3, 0.0, 1.0));
    float alpha = (0.2 + spine * 0.4 + etch * 0.25 + fres * 0.25) * tip * uFade;
    if (alpha < 0.004) discard;
    gl_FragColor = vec4(color * uGlow * (0.8 + 0.6 * uCharge), alpha);
  }
`;

export function createHeliostatIrisMaterial() {
  return baseMaterial({
    fragmentShader: IRIS_FRAGMENT,
    uniforms: {
      uCharge: { value: 0 },
      uGlow: { value: 1 },
      uColor: { value: new Color('#ffe58b') },
      uCore: { value: new Color('#ffffff') }
    }
  });
}

/* ---------------------------------------------------------------------- */
/* 3 · The focus spot on the floor                                         */
/* ---------------------------------------------------------------------- */

/**
 * A sun-dial drawn on the floor under the locked target. An outer graduated
 * ring with 24 hour ticks frames it; inside, a spot of caustic light narrows
 * from the whole disc to a pinpoint as the charge completes — the read is a
 * magnifying glass being brought into focus. Domain-warped fbm keeps the
 * caustics from looking like a texture.
 */
const FOCUS_FRAGMENT = /* glsl */ `
  uniform float uClock;
  uniform float uFade;
  uniform float uCharge;
  uniform float uTighten;
  uniform float uGlow;
  uniform float uShaderIntensity;
  uniform vec3 uColor;
  uniform vec3 uCore;
  ${SURFACE_VARYINGS}

  ${noiseGLSL}

  void main() {
    vec2 p = vUv * 2.0 - 1.0;
    float r = length(p);
    if (r > 1.0) discard;
    float a = atan(p.y, p.x);

    float spot = mix(0.82, 0.82 * (1.0 - clamp(uTighten, 0.0, 0.95)), uCharge);
    float disc = 1.0 - smoothstep(spot * 0.55, spot, r);
    float focusRing = exp(-abs(r - spot) * 38.0);
    float outer = exp(-abs(r - 0.94) * 80.0) + 0.5 * exp(-abs(r - 0.86) * 120.0);
    float ticks = pow(max(0.0, cos(a * 12.0)), 40.0) * smoothstep(0.86, 0.88, r) * (1.0 - smoothstep(0.92, 0.94, r));
    float minor = pow(max(0.0, cos(a * 48.0)), 20.0) * smoothstep(0.88, 0.9, r) * (1.0 - smoothstep(0.92, 0.93, r));

    vec2 warp = vec2(fbm3(vec3(p * 2.5, uClock * 0.35)), fbm3(vec3(p * 2.5 + 7.3, uClock * 0.35)));
    float caustic = pow(snoise01(vec3(p * 6.0 + warp * 1.6 * uShaderIntensity, uClock * 1.1)), 4.0);

    float hot = disc * (0.12 + 0.55 * uCharge) * (0.55 + 0.9 * caustic);
    float alpha = hot + focusRing * (0.25 + 0.6 * uCharge) + outer * 0.45 + ticks * 0.7 + minor * 0.3;
    vec3 color = mix(uColor, uCore, clamp(disc * uCharge + focusRing * 0.5, 0.0, 1.0));
    alpha *= uFade * (1.0 - smoothstep(0.97, 1.0, r));
    if (alpha < 0.004) discard;
    gl_FragColor = vec4(color * uGlow, alpha);
  }
`;

export function createHeliostatFocusMaterial() {
  return baseMaterial({
    fragmentShader: FOCUS_FRAGMENT,
    uniforms: {
      uCharge: { value: 0 },
      uTighten: { value: 0.75 },
      uGlow: { value: 0.9 },
      uColor: { value: new Color('#ffe58b') },
      uCore: { value: new Color('#ffffff') }
    }
  });
}

/* ---------------------------------------------------------------------- */
/* The cone of gathered light                                              */
/* ---------------------------------------------------------------------- */

/**
 * Light pouring down the fluted cone from the dish to the spot. Flutes are
 * one per mirror; a stream of noise scrolls *down* them so the light visibly
 * travels toward the target; both ends are feathered and the foot is soft-
 * faded against scene depth so it never cuts a ring into the floor.
 */
const CONE_FRAGMENT = /* glsl */ `
  uniform float uClock;
  uniform float uFade;
  uniform float uCharge;
  uniform float uBands;
  uniform float uGlow;
  uniform float uShaderIntensity;
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
    float flutes = pow(max(0.0, cos(vUv.x * 6.28318 * uBands)), 5.0);
    float stream = snoise01(vec3(vUv.x * uBands * 2.0, vUv.y * 5.0 + uClock * 2.6, 3.1));
    stream = mix(1.0, stream, uShaderIntensity);
    float ends = smoothstep(0.0, 0.12, vUv.y) * (1.0 - smoothstep(0.82, 1.0, vUv.y));
    float alpha = (flutes * 0.7 + 0.12) * (0.4 + 0.8 * stream) * ends * uCharge * uFade;
    if (alpha < 0.004) discard;
    alpha *= softFade(uSceneDepth, gl_FragCoord.xy / uResolution, vViewZ, uCameraNear, uCameraFar, 0.4);
    vec3 color = mix(uColor, uCore, flutes * 0.4 + (1.0 - vUv.y) * 0.3);
    gl_FragColor = vec4(color * uGlow, alpha);
  }
`;

export function createHeliostatConeMaterial() {
  return baseMaterial({
    fragmentShader: CONE_FRAGMENT,
    uniforms: {
      uCharge: { value: 0 },
      uBands: { value: 12 },
      uGlow: { value: 0.55 },
      uColor: { value: new Color('#ffe58b') },
      uCore: { value: new Color('#ffffff') }
    }
  });
}

/* ---------------------------------------------------------------------- */
/* 4 · The ray                                                             */
/* ---------------------------------------------------------------------- */

/**
 * The ray ribbons: a gaussian core across the width, filaments racing down
 * the length, a heat flicker of noise, a tip feather at the dish and a soft
 * fade where the ray meets the floor.
 */
const RAY_FRAGMENT = /* glsl */ `
  uniform float uClock;
  uniform float uFade;
  uniform float uGlow;
  uniform float uShaderIntensity;
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
    float x = abs(vUv.x - 0.5) * 2.0;
    float core = exp(-x * x * 7.0);
    float filaments = pow(max(0.0, cos(vUv.y * 52.0 + uClock * 18.0 + x * 3.0)), 16.0);
    float flicker = 0.75 + 0.5 * snoise(vec3(vUv.y * 4.0 - uClock * 6.0, x * 2.0, 1.7)) * uShaderIntensity;
    float tip = smoothstep(0.0, 0.05, vUv.y) * (1.0 - smoothstep(0.88, 1.0, vUv.y));
    float alpha = (core * flicker + filaments * 0.3 * core) * tip * uFade;
    if (alpha < 0.004) discard;
    alpha *= softFade(uSceneDepth, gl_FragCoord.xy / uResolution, vViewZ, uCameraNear, uCameraFar, 0.25);
    vec3 color = mix(uColor, uCore, core);
    gl_FragColor = vec4(color * uGlow, alpha);
  }
`;

export function createHeliostatRayMaterial() {
  return baseMaterial({
    fragmentShader: RAY_FRAGMENT,
    uniforms: {
      uGlow: { value: 2.2 },
      uColor: { value: new Color('#ffe58b') },
      uCore: { value: new Color('#ffffff') }
    }
  });
}

/**
 * The white-hot core column. Brightest where it is thickest to the eye
 * (facing ratio, the inverse of a rim), with a pulse running down it.
 */
const CORE_FRAGMENT = /* glsl */ `
  uniform float uClock;
  uniform float uFade;
  uniform float uGlow;
  uniform vec3 uColor;
  uniform vec3 uCore;
  ${SURFACE_VARYINGS}

  ${noiseGLSL}

  void main() {
    vec3 N = normalize(vNormalW);
    vec3 V = normalize(vViewDir);
    float facing = pow(abs(dot(N, V)), 1.6);
    float pulse = 0.7 + 0.3 * sin(vUv.y * 30.0 + uClock * 24.0);
    float tip = 1.0 - smoothstep(0.9, 1.0, vUv.y);
    float alpha = facing * pulse * tip * uFade;
    if (alpha < 0.004) discard;
    gl_FragColor = vec4(mix(uColor, uCore, facing) * uGlow, alpha);
  }
`;

export function createHeliostatCoreMaterial() {
  return baseMaterial({
    fragmentShader: CORE_FRAGMENT,
    uniforms: {
      uGlow: { value: 2.2 },
      uColor: { value: new Color('#ffe58b') },
      uCore: { value: new Color('#ffffff') }
    }
  });
}

/* ---------------------------------------------------------------------- */
/* Heat shimmer — LAYER.DISTORTION                                         */
/* ---------------------------------------------------------------------- */

/**
 * Air bent by the ray. A camera-facing quad standing on the floor, written
 * into the distortion buffer as `vec4(offset * 0.5 + 0.5, strength, mask)` —
 * the acid-fume contract. The offset is rising noise plus a push away from
 * the ray's axis, strongest at the foot where the floor is being cooked.
 */
const WARP_VERTEX = /* glsl */ `
  uniform float uWidth;
  uniform float uHeight;
  varying vec2 vUv;
  varying vec3 vWorld;

  void main() {
    vUv = uv;
    vec4 mv = modelViewMatrix * vec4(0.0, 0.0, 0.0, 1.0);
    mv.xy += vec2(position.x * uWidth, (position.y + 0.5) * uHeight);
    vWorld = (modelMatrix * vec4(position.x * uWidth, (position.y + 0.5) * uHeight, 0.0, 1.0)).xyz;
    gl_Position = projectionMatrix * mv;
  }
`;

const WARP_FRAGMENT = /* glsl */ `
  uniform float uClock;
  uniform float uStrength;
  uniform float uScale;
  uniform float uSpeed;
  uniform float uShaderIntensity;
  varying vec2 vUv;
  varying vec3 vWorld;

  ${noiseGLSL}

  void main() {
    vec2 c = vUv * 2.0 - 1.0;
    vec3 np = vec3(vWorld.xz * uScale, vWorld.y * uScale - uClock * uSpeed);
    vec2 n = vec2(snoise(np), snoise(np + vec3(17.1, 5.3, 29.7)));
    vec2 outward = vec2(sign(c.x) + 1e-4, 0.25);
    vec2 offset = normalize(n * 0.8 + outward * 0.4 + 1e-4);
    float mask = (1.0 - smoothstep(0.15, 1.0, abs(c.x)))
               * (1.0 - smoothstep(0.35, 1.0, vUv.y))
               * smoothstep(0.0, 0.05, vUv.y);
    float strength = uStrength * uShaderIntensity * mask;
    if (strength < 0.002) discard;
    gl_FragColor = vec4(offset * 0.5 + 0.5, strength, mask);
  }
`;

export function createHeliostatWarpMaterial() {
  return new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    depthTest: false,
    blending: NormalBlending,
    side: DoubleSide,
    toneMapped: false,
    uniforms: sharedUniforms({
      uClock: { value: 0 },
      uWidth: { value: 1.4 },
      uHeight: { value: 2.7 },
      uStrength: { value: 0 },
      uScale: { value: 2.2 },
      uSpeed: { value: 2.4 }
    }),
    vertexShader: WARP_VERTEX,
    fragmentShader: WARP_FRAGMENT
  });
}

/* ---------------------------------------------------------------------- */
/* 5 · The contact                                                         */
/* ---------------------------------------------------------------------- */

/**
 * The aperture left by the ray: an interrupted radial iris on the floor. A
 * ring front races outward with `uProgress`, rays rotate through it, and the
 * whole thing burns away with a noise dissolve rather than a flat fade.
 */
const APERTURE_FRAGMENT = /* glsl */ `
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
    float rays = pow(max(0.0, cos(a * 12.0 + uClock)), 14.0);
    float front = exp(-abs(r - (0.35 + uProgress * 0.4)) * 22.0);
    vec2 burn = dissolveMask(snoise01(vec3(p * 5.0, 2.3)), uProgress * 0.9, 0.12);
    float alpha = (0.18 + rays * 0.4 + front * 0.35) * burn.x + burn.y * 0.8;
    alpha *= uFade;
    if (alpha < 0.004) discard;
    vec3 color = mix(uColor, uCore, clamp(rays * 0.4 + front * 0.4 + burn.y, 0.0, 1.0));
    gl_FragColor = vec4(color, alpha);
  }
`;

export function createHeliostatApertureMaterial() {
  return baseMaterial({
    fragmentShader: APERTURE_FRAGMENT,
    uniforms: {
      uProgress: { value: 0 },
      uColor: { value: new Color('#ffe58b') },
      uCore: { value: new Color('#ffffff') }
    }
  });
}
