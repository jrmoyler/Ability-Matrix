import { AdditiveBlending, Color, DoubleSide, NormalBlending, ShaderMaterial } from 'three';
import { noiseGLSL } from '../../../shaders/lib/noise.glsl.js';
import { commonGLSL } from '../../../shaders/lib/common.glsl.js';
import { sharedUniforms } from '../../../core/FrameUniforms.js';
import { settings } from '../../../config/settings.js';

/**
 * Materials for MASS WEFT — one factory per layer.
 *
 * ## The clock rule
 *
 * Every material here owns its **own** `uTime` box rather than the shared
 * frame clock. The ability writes the cast's visual time into it (scaled by
 * `flowSpeed`), and holds it at zero under `prefers-reduced-motion`, so a
 * reduced-motion player sees a still corridor whose gameplay still pulses.
 * Everything else that is global (scene depth, resolution, camera planes,
 * the glow and shader-intensity multipliers) comes from `sharedUniforms`.
 *
 * ## The palette rule
 *
 * The corridor is two colours from the settings — `gravityColor` (the bruised
 * violet of bent space) and `coreColor` (the pale light the weft carries) —
 * plus `weftColor` for the floor threads and `voidColor` for the well they
 * sag into. Each `sync` copies those strings into uniforms every frame, so a
 * colour drag lands on a corridor already standing.
 *
 * Emissive materials set `toneMapped: false` so bloom can pick up values
 * above one; the distortion proxy writes the screen-warp vector the sandbox's
 * distortion pass expects.
 */

/* ------------------------------------------------------------------ */
/* Shared helpers                                                      */
/* ------------------------------------------------------------------ */

const SOFT_VARYINGS = /* glsl */ `
  varying float vViewZ;
  varying vec4  vClip;
`;

/** Soft-fade against the opaque depth prepass; 1 when there is no depth yet. */
const SOFT_FRAGMENT = /* glsl */ `
  float sceneSoft(float dist) {
    if (dist <= 0.0) return 1.0;
    vec2 screenUV = screenUVFromClip(vClip);
    return softFade(uSceneDepth, screenUV, vViewZ, uCameraNear, uCameraFar, dist);
  }
`;

const g = () => settings.global;

/* ------------------------------------------------------------------ */
/* 1 · The weft ribbon                                                 */
/* ------------------------------------------------------------------ */

const FIELD_VERTEX = /* glsl */ `
  uniform float uTime;
  uniform float uRipple;
  varying vec2 vUv;
  ${SOFT_VARYINGS}

  void main() {
    vUv = uv;
    vec3 p = position;
    // A standing ripple down the trough, strongest along the spine: the
    // floor of the weft "breathes" toward the aim point.
    float spine = 1.0 - abs(uv.x * 2.0 - 1.0);
    p.z += sin(uv.y * 24.0 - uTime * 4.0) * 0.025 * spine * uRipple;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    vViewZ = mv.z;
    gl_Position = projectionMatrix * mv;
    vClip = gl_Position;
  }
`;

const FIELD_FRAGMENT = /* glsl */ `
  uniform float uTime;
  uniform float uFade;
  uniform float uPulse;
  uniform float uGlowGain;
  uniform float uNoise;
  uniform float uNoiseScale;
  uniform float uSoft;
  uniform vec3  uColor;
  uniform vec3  uCore;
  uniform sampler2D uSceneDepth;
  uniform vec2  uResolution;
  uniform float uCameraNear;
  uniform float uCameraFar;
  uniform float uGlobalGlow;
  uniform float uShaderIntensity;
  varying vec2 vUv;
  ${SOFT_VARYINGS}

  ${noiseGLSL}
  ${commonGLSL}
  ${SOFT_FRAGMENT}

  void main() {
    float x = abs(vUv.x * 2.0 - 1.0);
    // Threads of the weft: tight bright filaments rolling toward the front,
    // broken by noise so they never read as a scrolling texture.
    float n = fbm3(vec3(vUv.x * 3.0 * uNoiseScale, vUv.y * 9.0 * uNoiseScale - uTime * 0.9, uTime * 0.15));
    float fil = pow(max(0.0, cos(vUv.y * 45.0 - uTime * 5.0 + n * 3.0 * uNoise)), 20.0);
    float edge = exp(-abs(x - 0.86) * 40.0);
    float core = exp(-x * 7.0);
    // Feather the two ends so the corridor never ends on a hard line.
    float ends = smoothstep(0.0, 0.04, vUv.y) * (1.0 - smoothstep(0.96, 1.0, vUv.y));
    float body = edge * 0.4 + fil * 0.2 * (0.6 + 0.4 * n) + core * 0.3 + uPulse * 0.2;
    vec3 col = mix(uColor, uCore, clamp(core * 0.6 + fil * 0.3 + uPulse * 0.25, 0.0, 1.0));
    col *= uGlowGain * uGlobalGlow * (1.0 + uPulse * 0.8);
    float alpha = body * uFade * ends * sceneSoft(uSoft) * uShaderIntensity;
    gl_FragColor = vec4(col, clamp(alpha, 0.0, 1.0));
  }
`;

/** The weft ribbon laid on the floor. Additive. */
export function createWeftFieldMaterial() {
  const material = new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: DoubleSide,
    blending: AdditiveBlending,
    toneMapped: false,
    uniforms: sharedUniforms({
      uTime: { value: 0 },
      uFade: { value: 1 },
      uPulse: { value: 0 },
      uRipple: { value: 1 },
      uGlowGain: { value: 1 },
      uNoise: { value: 1 },
      uNoiseScale: { value: 1 },
      uSoft: { value: 0.25 },
      uColor: { value: new Color('#9f8fbe') },
      uCore: { value: new Color('#efe4ff') }
    }),
    vertexShader: FIELD_VERTEX,
    fragmentShader: FIELD_FRAGMENT
  });
  /** @param {object} c the cast's live settings */
  material.userData.sync = (c) => {
    const u = material.uniforms;
    u.uColor.value.set(c.gravityColor);
    u.uCore.value.set(c.coreColor);
    u.uGlowGain.value = c.ribbonGlow ?? 1;
    u.uRipple.value = c.ribbonRipple ?? 1;
    u.uNoise.value = (c.ribbonNoise ?? 1) * g().noiseStrength;
    u.uNoiseScale.value = g().noiseFrequency;
    u.uSoft.value = c.softFade ?? 0.25;
  };
  return material;
}

/* ------------------------------------------------------------------ */
/* 2 · The filaments                                                   */
/* ------------------------------------------------------------------ */

const FILAMENT_VERTEX = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vNormalV;
  varying vec3 vViewV;
  void main() {
    vUv = uv;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vNormalV = normalize(normalMatrix * normal);
    vViewV = -mv.xyz;
    gl_Position = projectionMatrix * mv;
  }
`;

const FILAMENT_FRAGMENT = /* glsl */ `
  uniform float uTime;
  uniform float uFade;
  uniform float uPulse;
  uniform float uGlowGain;
  uniform float uBeads;
  uniform float uFresnel;
  uniform vec3  uColor;
  uniform vec3  uCore;
  uniform float uGlobalGlow;
  uniform float uShaderIntensity;
  varying vec2 vUv;
  varying vec3 vNormalV;
  varying vec3 vViewV;

  ${noiseGLSL}
  ${commonGLSL}

  void main() {
    // Beads of light ride the thread from the caster to the front; the pulse
    // brightens the whole thread at once.
    float bead = pow(max(0.0, sin(vUv.y * uBeads - uTime * 6.0)), 6.0);
    float flicker = 0.75 + 0.25 * snoise(vec3(vUv.y * 14.0, uTime * 1.7, 0.0));
    float rim = fresnelTerm(vViewV, vNormalV, 1.6, uFresnel);
    float ends = smoothstep(0.0, 0.05, vUv.y) * (1.0 - smoothstep(0.95, 1.0, vUv.y));
    vec3 col = mix(uColor, uCore, clamp(bead + uPulse * 0.5, 0.0, 1.0));
    col *= uGlowGain * uGlobalGlow * (0.6 + rim + bead * 1.5 + uPulse);
    float alpha = (0.25 + 0.35 * rim + 0.5 * bead) * flicker * ends * uFade * uShaderIntensity;
    gl_FragColor = vec4(col, clamp(alpha, 0.0, 1.0));
  }
`;

/** The two counter-wound threads. Additive, fresnel-lit, beaded. */
export function createFilamentMaterial() {
  const material = new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: DoubleSide,
    blending: AdditiveBlending,
    toneMapped: false,
    uniforms: sharedUniforms({
      uTime: { value: 0 },
      uFade: { value: 1 },
      uPulse: { value: 0 },
      uGlowGain: { value: 1 },
      uBeads: { value: 60 },
      uFresnel: { value: 1 },
      uColor: { value: new Color('#9f8fbe') },
      uCore: { value: new Color('#efe4ff') }
    }),
    vertexShader: FILAMENT_VERTEX,
    fragmentShader: FILAMENT_FRAGMENT
  });
  material.userData.sync = (c) => {
    const u = material.uniforms;
    u.uColor.value.set(c.gravityColor);
    u.uCore.value.set(c.coreColor);
    u.uGlowGain.value = c.filamentGlow ?? 1;
    u.uBeads.value = c.filamentBeads ?? 60;
    u.uFresnel.value = g().fresnel;
  };
  return material;
}

/* ------------------------------------------------------------------ */
/* 3 · The bead rings (heddles)                                        */
/* ------------------------------------------------------------------ */

const RING_FRAGMENT = /* glsl */ `
  uniform float uTime;
  uniform float uFade;
  uniform float uPulse;
  uniform float uGlowGain;
  uniform float uFresnel;
  uniform vec3  uColor;
  uniform vec3  uCore;
  uniform float uGlobalGlow;
  uniform float uShaderIntensity;
  varying vec2 vUv;
  varying vec3 vNormalV;
  varying vec3 vViewV;

  ${noiseGLSL}
  ${commonGLSL}

  void main() {
    // A comet of light chases round each heddle; noise keeps the beads from
    // lighting in lock-step.
    float chase = pow(fract(vUv.x - uTime * 0.35), 6.0);
    float n = snoise01(vec3(vUv.x * 24.0, vUv.y * 3.0, uTime * 0.6));
    float rim = fresnelTerm(vViewV, vNormalV, 2.2, uFresnel);
    vec3 col = mix(uColor, uCore, clamp(chase + rim * 0.4 + uPulse * 0.5, 0.0, 1.0));
    col *= uGlowGain * uGlobalGlow * (0.5 + chase * 2.0 + rim + uPulse);
    float alpha = (0.18 + rim * 0.45 + chase * 0.6) * (0.7 + 0.3 * n) * uFade * uShaderIntensity;
    gl_FragColor = vec4(col, clamp(alpha, 0.0, 1.0));
  }
`;

/** The six heddle rings. Shares the filament vertex stage. */
export function createWeftRingMaterial() {
  const material = new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: DoubleSide,
    blending: AdditiveBlending,
    toneMapped: false,
    uniforms: sharedUniforms({
      uTime: { value: 0 },
      uFade: { value: 1 },
      uPulse: { value: 0 },
      uGlowGain: { value: 1 },
      uFresnel: { value: 1 },
      uColor: { value: new Color('#9f8fbe') },
      uCore: { value: new Color('#efe4ff') }
    }),
    vertexShader: FILAMENT_VERTEX,
    fragmentShader: RING_FRAGMENT
  });
  material.userData.sync = (c) => {
    const u = material.uniforms;
    u.uColor.value.set(c.gravityColor);
    u.uCore.value.set(c.coreColor);
    u.uGlowGain.value = c.ringGlow ?? 1;
    u.uFresnel.value = g().fresnel;
  };
  return material;
}

/* ------------------------------------------------------------------ */
/* 4 · The shuttle (the core)                                          */
/* ------------------------------------------------------------------ */

const SHUTTLE_VERTEX = /* glsl */ `
  uniform float uTime;
  uniform float uWobble;
  varying vec2 vUv;
  varying vec3 vNormalV;
  varying vec3 vViewV;
  ${noiseGLSL}
  void main() {
    vUv = uv;
    // Space boils on the shuttle's skin: a slow noise displacement along the
    // normal, pinned at the tips so the silhouette stays a shuttle.
    float tips = sin(3.14159265 * uv.y);
    float n = snoise(position * 7.0 + vec3(0.0, 0.0, uTime * 0.8));
    vec3 p = position + normal * n * 0.018 * uWobble * tips;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    vNormalV = normalize(normalMatrix * normal);
    vViewV = -mv.xyz;
    gl_Position = projectionMatrix * mv;
  }
`;

const SHUTTLE_FRAGMENT = /* glsl */ `
  uniform float uTime;
  uniform float uFade;
  uniform float uPulse;
  uniform float uFlare;
  uniform float uHorizon;
  uniform float uGlowGain;
  uniform vec3  uColor;
  uniform vec3  uCore;
  uniform vec3  uVoid;
  uniform float uGlobalGlow;
  uniform float uShaderIntensity;
  varying vec2 vUv;
  varying vec3 vNormalV;
  varying vec3 vViewV;

  ${noiseGLSL}
  ${commonGLSL}

  void main() {
    // An event horizon, not a glow ball: the body is near-black and only the
    // grazing rim burns. The waist band carries the weft colour round.
    float rim = fresnelTerm(vViewV, vNormalV, uHorizon, 1.0);
    float waist = exp(-pow((vUv.y - 0.5) * 14.0, 2.0));
    float swirl = snoise01(vec3(vUv.x * 6.0 + uTime * 0.7, vUv.y * 5.0, uTime * 0.3));
    vec3 body = uVoid * (0.35 + 0.25 * swirl);
    vec3 glow = mix(uColor, uCore, rim) * (rim * 2.2 + waist * (0.6 + uPulse) + uFlare * 2.5);
    vec3 col = body + glow * uGlowGain * uGlobalGlow * uShaderIntensity;
    gl_FragColor = vec4(col, uFade);
  }
`;

/** The shuttle: a dark mass with a burning horizon. Normal blending, so it occludes. */
export function createShuttleMaterial() {
  const material = new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: DoubleSide,
    blending: NormalBlending,
    toneMapped: false,
    uniforms: sharedUniforms({
      uTime: { value: 0 },
      uFade: { value: 1 },
      uPulse: { value: 0 },
      uFlare: { value: 0 },
      uWobble: { value: 1 },
      uHorizon: { value: 2.4 },
      uGlowGain: { value: 1 },
      uColor: { value: new Color('#9f8fbe') },
      uCore: { value: new Color('#efe4ff') },
      uVoid: { value: new Color('#120d1c') }
    }),
    vertexShader: SHUTTLE_VERTEX,
    fragmentShader: SHUTTLE_FRAGMENT
  });
  material.userData.sync = (c) => {
    const u = material.uniforms;
    u.uColor.value.set(c.gravityColor);
    u.uCore.value.set(c.coreColor);
    u.uVoid.value.set(c.voidColor ?? '#120d1c');
    u.uHorizon.value = Math.max(0.3, (c.coreHorizon ?? 2.4) / Math.max(0.1, g().fresnel));
    u.uGlowGain.value = c.coreGlow ?? 1;
    u.uWobble.value = (c.coreWobble ?? 1) * g().noiseStrength;
  };
  return material;
}

/* ------------------------------------------------------------------ */
/* 5 · Compression rings                                               */
/* ------------------------------------------------------------------ */

const PLAIN_VERTEX = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const COMPRESSION_FRAGMENT = /* glsl */ `
  uniform float uTime;
  uniform float uFade;
  uniform float uGlowGain;
  uniform vec3  uColor;
  uniform float uGlobalGlow;
  uniform float uShaderIntensity;
  varying vec2 vUv;
  ${noiseGLSL}
  void main() {
    // Thirty-six crests march round the ring; noise tears the band so the
    // compression reads as a shock, not a hoop.
    float pulse = pow(max(0.0, cos(vUv.x * 37.7 - uTime * 4.0)), 12.0);
    float tear = smoothstep(-0.4, 0.5, snoise(vec3(vUv.x * 9.0, uTime * 1.3, 0.0)));
    vec3 col = uColor * uGlowGain * uGlobalGlow * (1.0 + pulse * 1.5);
    gl_FragColor = vec4(col, clamp((0.35 + 0.5 * pulse) * tear * uFade * uShaderIntensity, 0.0, 1.0));
  }
`;

/** One compression wave (three rings share it). Additive. */
export function createCompressionMaterial() {
  const material = new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: DoubleSide,
    blending: AdditiveBlending,
    toneMapped: false,
    uniforms: sharedUniforms({
      uTime: { value: 0 },
      uFade: { value: 0 },
      uGlowGain: { value: 1 },
      uColor: { value: new Color('#efe4ff') }
    }),
    vertexShader: PLAIN_VERTEX,
    fragmentShader: COMPRESSION_FRAGMENT
  });
  material.userData.sync = (c) => {
    material.uniforms.uColor.value.set(c.coreColor);
    material.uniforms.uGlowGain.value = c.compressionGlow ?? 1;
  };
  return material;
}

/* ------------------------------------------------------------------ */
/* 6 · The lens (LAYER.DISTORTION)                                     */
/* ------------------------------------------------------------------ */

const LENS_FRAGMENT = /* glsl */ `
  uniform float uTime;
  uniform float uStrength;
  uniform float uPulse;
  varying vec2 vUv;
  ${noiseGLSL}
  void main() {
    float across = 1.0 - abs(vUv.x * 2.0 - 1.0);
    float along = smoothstep(0.0, 0.08, vUv.y) * (1.0 - smoothstep(0.92, 1.0, vUv.y));
    float mask = pow(max(0.0, across), 1.5) * along;
    // Breathing noise keeps the refraction alive between pulses.
    float breathe = 0.85 + 0.15 * snoise(vec3(vUv * vec2(3.0, 12.0), uTime * 0.6));
    float s = uStrength * mask * (0.65 + uPulse * 0.35) * breathe;
    if (s < 0.001) discard;
    // Pull the screen toward the corridor's spine, with a travelling shear.
    vec2 delta = vec2(0.5 - vUv.x, 0.08 * sin(vUv.y * 18.0 - uTime * 3.0));
    float l = length(delta);
    vec2 direction = l < 0.001 ? vec2(0.0, 1.0) : delta / l;
    gl_FragColor = vec4(direction * 0.5 + 0.5, s, mask);
  }
`;

/** Distortion pass proxy: pull screen-space samples toward the corridor spine. */
export function createGravityLensMaterial() {
  return new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    depthTest: false,
    side: DoubleSide,
    blending: NormalBlending,
    toneMapped: false,
    uniforms: { uTime: { value: 0 }, uStrength: { value: 0 }, uPulse: { value: 0 } },
    vertexShader: PLAIN_VERTEX,
    fragmentShader: LENS_FRAGMENT
  });
}

/* ------------------------------------------------------------------ */
/* 7 · The floor weave                                                 */
/* ------------------------------------------------------------------ */

const FLOOR_VERTEX = /* glsl */ `
  varying vec2 vUv;
  ${SOFT_VARYINGS}
  void main() {
    vUv = uv;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vViewZ = mv.z;
    gl_Position = projectionMatrix * mv;
    vClip = gl_Position;
  }
`;

const FLOOR_FRAGMENT = /* glsl */ `
  uniform float uTime;
  uniform float uFade;
  uniform float uPulse;
  uniform float uSag;
  uniform float uDensity;
  uniform float uThread;
  uniform float uGlowGain;
  uniform float uOpacity;
  uniform float uAspect;   // corridor length / width, keeps the weave square
  uniform float uNoise;
  uniform float uSoft;
  uniform vec3  uWeft;
  uniform vec3  uVoid;
  uniform sampler2D uSceneDepth;
  uniform vec2  uResolution;
  uniform float uCameraNear;
  uniform float uCameraFar;
  uniform float uGlobalGlow;
  uniform float uShaderIntensity;
  varying vec2 vUv;
  ${SOFT_VARYINGS}

  ${noiseGLSL}
  ${commonGLSL}
  ${SOFT_FRAGMENT}

  float line(float v, float w) {
    float d = abs(fract(v) - 0.5);
    return 1.0 - smoothstep(w * 0.5, w, d);
  }

  void main() {
    float x = vUv.x * 2.0 - 1.0;               // -1..1 across
    float well = exp(-x * x * 3.0);            // depth of the sag
    // The cloth of space-time, pinched toward the spine: warp threads run the
    // length and bunch at the centre, weft threads cross and bow toward the
    // front the deeper they sit in the well.
    float pinch = x * (1.0 - uSag * 0.55 * well);
    float jitter = snoise(vec3(vUv * vec2(4.0, 4.0 * uAspect), uTime * 0.2)) * 0.06 * uNoise;
    float warp = line(pinch * uDensity * 0.5 + jitter, uThread);
    float bow = vUv.y * uAspect * uDensity * 0.5 - well * uSag * 0.6 - uTime * 0.35;
    float weft = line(bow + jitter, uThread);
    float threads = max(warp, weft) * (0.45 + 0.55 * well);
    // Feather every side; the ends breathe in as the corridor builds.
    float side = 1.0 - smoothstep(0.7, 1.0, abs(x));
    float ends = smoothstep(0.0, 0.05, vUv.y) * (1.0 - smoothstep(0.95, 1.0, vUv.y));
    float mask = side * ends * uFade * sceneSoft(uSoft);
    vec3 glow = uWeft * uGlowGain * uGlobalGlow * (1.0 + uPulse * 1.5);
    vec3 col = mix(uVoid, glow, threads);
    float alpha = max(well * 0.55 * uOpacity, threads * 0.8) * mask * uShaderIntensity;
    gl_FragColor = vec4(col, clamp(alpha, 0.0, 1.0));
  }
`;

/**
 * The floor the corridor bends. Normal blending, because a gravity well has
 * to *darken* the stone under it; the threads are bright enough (toneMapped
 * false) to bloom through the dark.
 */
export function createWeftFloorMaterial() {
  const material = new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: DoubleSide,
    blending: NormalBlending,
    toneMapped: false,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    uniforms: sharedUniforms({
      uTime: { value: 0 },
      uFade: { value: 0 },
      uPulse: { value: 0 },
      uSag: { value: 1 },
      uDensity: { value: 6 },
      uThread: { value: 0.08 },
      uGlowGain: { value: 1 },
      uOpacity: { value: 0.6 },
      uAspect: { value: 4 },
      uNoise: { value: 1 },
      uSoft: { value: 0 },
      uWeft: { value: new Color('#c9b8ff') },
      uVoid: { value: new Color('#120d1c') }
    }),
    vertexShader: FLOOR_VERTEX,
    fragmentShader: FLOOR_FRAGMENT
  });
  /** @param {object} c live settings  @param {number} aspect length ÷ width */
  material.userData.sync = (c, aspect) => {
    const u = material.uniforms;
    u.uWeft.value.set(c.weftColor ?? c.coreColor);
    u.uVoid.value.set(c.voidColor ?? '#120d1c');
    u.uSag.value = c.floorSag ?? 1;
    u.uDensity.value = c.weaveDensity ?? 6;
    u.uThread.value = c.weaveThread ?? 0.08;
    u.uGlowGain.value = c.weaveGlow ?? 1;
    u.uOpacity.value = (c.floorOpacity ?? 0.6) * g().opacity;
    u.uAspect.value = Math.max(0.1, aspect);
    u.uNoise.value = g().noiseStrength;
  };
  return material;
}
