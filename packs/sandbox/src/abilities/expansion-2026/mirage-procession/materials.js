import { AdditiveBlending, Color, DoubleSide, FrontSide, NormalBlending, ShaderMaterial } from 'three';
import { noiseGLSL } from '../../../shaders/lib/noise.glsl.js';
import { commonGLSL } from '../../../shaders/lib/common.glsl.js';
import { sharedUniforms } from '../../../core/FrameUniforms.js';
import { settings } from '../../../config/settings.js';
import { getColor } from '../../../utils/color.js';
import config from './config.js';

/**
 * Mirage Procession — the bespoke shaders.
 *
 *  - **the mask** — holographic lacquer: a thin-film iridescence that turns
 *    with the viewing angle and a slow fbm, scan bands running up the face,
 *    and slice glitches that shear horizontal strips of the mask sideways in
 *    the vertex stage. It dissolves through a noise threshold with a burning
 *    edge as the procession breaks up.
 *  - **the engraving** — glints running along each filigree stroke (`aT`).
 *  - **the veil** — a silk ribbon fluttered, swayed and drooped in the
 *    vertex stage, iridescent at its edges and thinning toward the hem.
 *  - **the wake** — heat shimmer down each lane: fbm-bent bands brightest
 *    just behind the mask, feathered at both sides.
 *  - **the mirror shards** — instanced; a fake sky/floor reflection off the
 *    reflected view vector and a thin-film rim, so they flash as they turn.
 *  - **the glitter** — a GPU point cloud dealt evenly over the three lanes.
 *  - **the shimmer** — `LAYER.DISTORTION` sheet standing across all three
 *    lanes at the mask front: the air the procession bends.
 *
 * Every material reads `settings.mirageProcession` in `userData.sync(state)`.
 */

const ID = config.id;

const additive = (extra) => ({
  transparent: true,
  depthWrite: false,
  depthTest: true,
  blending: AdditiveBlending,
  side: DoubleSide,
  toneMapped: false,
  ...extra,
});

/** Thin-film interference approximated by a phase-shifted cosine palette. */
const FILM_GLSL = /* glsl */ `
  vec3 thinFilm(float phase) {
    return 0.5 + 0.5 * cos(6.2831853 * (vec3(0.0, 0.33, 0.67) + phase));
  }
`;

/* -------------------------------------------------------------------- */
/* The mask                                                             */
/* -------------------------------------------------------------------- */

const MASK_VERTEX = /* glsl */ `
  uniform float uClock;
  uniform float uGlitch;
  varying vec3 vNormalW;
  varying vec3 vViewDir;
  varying vec3 vLocal;

  ${noiseGLSL}

  void main() {
    vec3 q = position;
    // A gentle ripple, then slice glitches: a horizontal strip of the face
    // jumps sideways for a few frames at a time.
    q.x += sin(uClock * 4.0 + position.y * 9.0) * 0.02;
    float strip = floor(position.y * 14.0);
    float tick = floor(uClock * 9.0);
    float slice = step(0.93, hash11(strip * 7.13 + tick * 1.31));
    q.x += slice * (hash11(strip + tick) - 0.5) * 0.12 * uGlitch;
    vLocal = position;
    vec4 world = modelMatrix * vec4(q, 1.0);
    vNormalW = normalize(mat3(modelMatrix) * normal);
    vViewDir = cameraPosition - world.xyz;
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;

const MASK_FRAGMENT = /* glsl */ `
  uniform float uClock;
  uniform float uFade;
  uniform float uDissolve;
  uniform float uEdgeWidth;
  uniform float uGlow;
  uniform float uOpacity;
  uniform float uFilm;
  uniform float uScan;
  uniform float uFresnel;
  uniform vec3  uColor;
  uniform vec3  uEdge;
  uniform float uGlobalGlow;
  uniform float uShaderIntensity;

  varying vec3 vNormalW;
  varying vec3 vViewDir;
  varying vec3 vLocal;

  ${noiseGLSL}
  ${commonGLSL}
  ${FILM_GLSL}

  void main() {
    float n = fbm3(vLocal * 3.0 + vec3(0.0, 0.0, uClock * 0.2));
    vec2 dm = dissolveMask(n * 0.5 + 0.5 * snoise01(vLocal * 9.0), uDissolve, uEdgeWidth);
    if (dm.x < 0.5 && dm.y < 0.01) discard;
    float rim = fresnelTerm(vViewDir, vNormalW, 2.0, uFresnel);
    float bands = pow(max(0.0, cos(vLocal.y * 35.0 - uClock * uScan)), 14.0) * uShaderIntensity;
    vec3 film = thinFilm(rim * 0.9 + n * 0.4 + uClock * 0.05);
    vec3 col = mix(uColor, uEdge, clamp(rim + bands * 0.5, 0.0, 1.0));
    col = mix(col, film * uEdge, uFilm * rim);
    col += uEdge * dm.y * 3.0;
    float alpha = (0.23 + rim * 0.4 + bands * 0.2 + dm.y) * uFade * uOpacity;
    gl_FragColor = vec4(col * uGlow * uGlobalGlow, clamp(alpha, 0.0, 1.0));
  }
`;

/** Holographic lacquer shared by all three masks. Additive. */
export function createMaskMaterial() {
  const material = new ShaderMaterial({
    ...additive(),
    uniforms: sharedUniforms({
      // The cast's own clock (frozen under reduced motion, scaled by the
      // global animation speed) — not the shared frame time.
      uClock: { value: 0 },
      uFade: { value: 1 },
      uDissolve: { value: 0 },
      uEdgeWidth: { value: 0.08 },
      uGlitch: { value: 1 },
      uGlow: { value: 2 },
      uOpacity: { value: 1 },
      uFilm: { value: 0.8 },
      uScan: { value: 7 },
      uFresnel: { value: 1 },
      uColor: { value: new Color() },
      uEdge: { value: new Color() },
    }),
    vertexShader: MASK_VERTEX,
    fragmentShader: MASK_FRAGMENT,
  });
  /** @param {object} s { clock, fade, dissolve, calm } */
  material.userData.sync = (s) => {
    const c = settings[ID];
    const g = settings.global;
    const u = material.uniforms;
    u.uClock.value = s.clock;
    u.uFade.value = s.fade;
    u.uDissolve.value = s.dissolve;
    u.uEdgeWidth.value = c.dissolveEdge;
    u.uGlitch.value = s.calm ? 0 : c.glitch * g.randomness;
    u.uGlow.value = c.maskGlow * g.glow;
    u.uOpacity.value = c.maskOpacity * g.opacity;
    u.uFilm.value = c.filmStrength;
    u.uScan.value = s.calm ? 0 : c.scanSpeed * g.noiseSpeed;
    u.uFresnel.value = g.fresnel;
    u.uColor.value.copy(getColor(c.maskColor));
    u.uEdge.value.copy(getColor(c.edgeColor));
  };
  return material;
}

/* -------------------------------------------------------------------- */
/* The engraving                                                        */
/* -------------------------------------------------------------------- */

const ENGRAVING_VERTEX = /* glsl */ `
  attribute float aT;
  varying float vT;
  void main() {
    vT = aT;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const ENGRAVING_FRAGMENT = /* glsl */ `
  uniform float uClock;
  uniform float uFade;
  uniform float uGlow;
  uniform vec3  uEdge;
  uniform vec3  uColor;
  uniform float uGlobalGlow;
  varying float vT;
  void main() {
    float glint = pow(max(0.0, sin((vT * 2.0 - uClock * 0.8) * 6.2831853)), 12.0);
    float a = (0.55 + 0.15 * sin(uClock * 3.0) + glint) * uFade;
    vec3 col = mix(uColor, uEdge, 0.6 + 0.4 * glint);
    gl_FragColor = vec4(col * uGlow * uGlobalGlow, clamp(a, 0.0, 1.0));
  }
`;

/** Glinting filigree lines. */
export function createEngravingMaterial() {
  const material = new ShaderMaterial({
    ...additive({ side: FrontSide }),
    uniforms: sharedUniforms({
      uClock: { value: 0 },
      uFade: { value: 1 },
      uGlow: { value: 1.4 },
      uEdge: { value: new Color() },
      uColor: { value: new Color() },
    }),
    vertexShader: ENGRAVING_VERTEX,
    fragmentShader: ENGRAVING_FRAGMENT,
  });
  /** @param {object} s { clock, fade } */
  material.userData.sync = (s) => {
    const c = settings[ID];
    const g = settings.global;
    const u = material.uniforms;
    u.uClock.value = s.clock;
    u.uFade.value = s.fade * g.opacity;
    u.uGlow.value = c.engravingGlow * g.glow;
    u.uEdge.value.copy(getColor(c.edgeColor));
    u.uColor.value.copy(getColor(c.maskColor));
  };
  return material;
}

/* -------------------------------------------------------------------- */
/* The veil                                                             */
/* -------------------------------------------------------------------- */

const VEIL_VERTEX = /* glsl */ `
  uniform float uClock;
  uniform float uLength;
  uniform float uWidth;
  uniform float uFlutter;
  uniform float uDroop;
  varying vec2 vUv;
  varying vec3 vNormalW;
  varying vec3 vViewDir;

  ${noiseGLSL}

  void main() {
    vUv = uv;
    float v = uv.y;
    vec3 p = vec3(position.x * uWidth * (1.0 + v * 0.35), 0.0, v * uLength);
    // Flutter grows toward the hem; the hem also sags toward the floor.
    float wave = sin(v * 7.0 - uClock * 5.0 + position.x * 2.0);
    p.y += (wave * 0.09 + snoise(vec3(position.x * 2.0, v * 3.0, uClock * 0.8)) * 0.06) * v * uFlutter;
    p.x += sin(v * 4.0 - uClock * 3.1) * 0.08 * v * uFlutter;
    p.y -= v * v * uDroop;
    vec4 world = modelMatrix * vec4(p, 1.0);
    vNormalW = normalize(mat3(modelMatrix) * vec3(0.0, 1.0, 0.0));
    vViewDir = cameraPosition - world.xyz;
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;

const VEIL_FRAGMENT = /* glsl */ `
  uniform float uClock;
  uniform float uFade;
  uniform float uGlow;
  uniform float uOpacity;
  uniform float uFilm;
  uniform vec3  uColor;
  uniform vec3  uEdge;
  uniform float uGlobalGlow;
  varying vec2 vUv;
  varying vec3 vNormalW;
  varying vec3 vViewDir;

  ${noiseGLSL}
  ${commonGLSL}
  ${FILM_GLSL}

  void main() {
    float across = 1.0 - smoothstep(0.32, 0.5, abs(vUv.x - 0.5));
    float hem = pow(1.0 - vUv.y, 1.5);
    float weave = 0.75 + 0.25 * sin(vUv.x * 60.0) * sin(vUv.y * 40.0 - uClock * 2.0);
    float grazing = fresnelTerm(vViewDir, vNormalW, 1.5, 1.0);
    vec3 col = mix(uColor, thinFilm(vUv.y * 0.8 + grazing * 0.5 + uClock * 0.04) * uEdge, uFilm * (0.3 + 0.7 * grazing));
    float a = across * hem * weave * (0.4 + 0.6 * grazing) * uFade * uOpacity;
    if (a < 0.003) discard;
    gl_FragColor = vec4(col * uGlow * uGlobalGlow, clamp(a, 0.0, 1.0));
  }
`;

/** Silk veils trailing the masks. */
export function createVeilMaterial() {
  const material = new ShaderMaterial({
    ...additive(),
    uniforms: sharedUniforms({
      uClock: { value: 0 },
      uLength: { value: 1.6 },
      uWidth: { value: 0.8 },
      uFlutter: { value: 1 },
      uDroop: { value: 0.35 },
      uFade: { value: 1 },
      uGlow: { value: 1.2 },
      uOpacity: { value: 0.55 },
      uFilm: { value: 0.8 },
      uColor: { value: new Color() },
      uEdge: { value: new Color() },
    }),
    vertexShader: VEIL_VERTEX,
    fragmentShader: VEIL_FRAGMENT,
  });
  /** @param {object} s { clock, fade, calm } */
  material.userData.sync = (s) => {
    const c = settings[ID];
    const g = settings.global;
    const u = material.uniforms;
    u.uClock.value = s.clock;
    u.uLength.value = c.veilLength;
    u.uWidth.value = c.veilWidth;
    u.uFlutter.value = s.calm ? 0 : c.veilFlutter * g.turbulence;
    u.uDroop.value = c.veilDroop;
    u.uFade.value = s.fade;
    u.uGlow.value = c.veilGlow * g.glow;
    u.uOpacity.value = c.veilOpacity * g.opacity;
    u.uFilm.value = c.filmStrength;
    u.uColor.value.copy(getColor(c.trailColor));
    u.uEdge.value.copy(getColor(c.edgeColor));
  };
  return material;
}

/* -------------------------------------------------------------------- */
/* The wake                                                             */
/* -------------------------------------------------------------------- */

const WAKE_VERTEX = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vWorld;
  void main() {
    vUv = uv;
    vec4 world = modelMatrix * vec4(position, 1.0);
    vWorld = world.xyz;
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;

const WAKE_FRAGMENT = /* glsl */ `
  uniform float uClock;
  uniform float uFade;
  uniform float uGlow;
  uniform float uOpacity;
  uniform float uShimmer;
  uniform float uScale;
  uniform vec3  uColor;
  uniform vec3  uEdge;
  uniform float uGlobalGlow;
  uniform float uShaderIntensity;
  varying vec2 vUv;
  varying vec3 vWorld;

  ${noiseGLSL}

  void main() {
    // uv.y is 0 at the mask, 1 back at the caster.
    float behind = vUv.y;
    float bend = fbm3(vec3(vWorld.xz * 0.6 * uScale, uClock * 0.3)) * 2.0;
    float bands = pow(max(0.0, cos(behind * 33.0 * uScale - uClock * 5.0 + sin(vUv.x * 9.0) * 2.0 + bend * uShimmer)), 14.0);
    float side = 1.0 - smoothstep(0.35, 0.5, abs(vUv.x - 0.5));
    float near = 0.35 + 0.65 * pow(1.0 - behind, 1.2);
    float haze = (0.25 + 0.75 * snoise01(vec3(vWorld.xz * 1.3 * uScale, uClock * 0.6))) * 0.35 * uShaderIntensity;
    float a = (bands + haze) * side * near * uFade * uOpacity;
    if (a < 0.002) discard;
    vec3 col = mix(uColor, uEdge, bands * 0.4 * (1.0 - behind));
    gl_FragColor = vec4(col * uGlow * uGlobalGlow, clamp(a, 0.0, 1.0));
  }
`;

/** Heat shimmer down each lane. */
export function createWakeMaterial() {
  const material = new ShaderMaterial({
    ...additive(),
    uniforms: sharedUniforms({
      uClock: { value: 0 },
      uFade: { value: 1 },
      uGlow: { value: 1.7 },
      uOpacity: { value: 0.3 },
      uShimmer: { value: 1 },
      uScale: { value: 1 },
      uColor: { value: new Color() },
      uEdge: { value: new Color() },
    }),
    vertexShader: WAKE_VERTEX,
    fragmentShader: WAKE_FRAGMENT,
  });
  /** @param {object} s { clock, fade } */
  material.userData.sync = (s) => {
    const c = settings[ID];
    const g = settings.global;
    const u = material.uniforms;
    u.uClock.value = s.clock;
    u.uFade.value = s.fade;
    u.uGlow.value = c.wakeGlow * g.glow;
    u.uOpacity.value = c.wakeOpacity * g.opacity;
    u.uShimmer.value = c.wakeShimmer * g.noiseStrength;
    u.uScale.value = c.wakeScale * g.noiseFrequency;
    u.uColor.value.copy(getColor(c.trailColor));
    u.uEdge.value.copy(getColor(c.edgeColor));
  };
  return material;
}

/* -------------------------------------------------------------------- */
/* The mirror shards                                                    */
/* -------------------------------------------------------------------- */

const SHARD_VERTEX = /* glsl */ `
  varying vec3 vNormalW;
  varying vec3 vViewDir;
  varying float vSeed;
  void main() {
    mat4 local = mat4(1.0);
    #ifdef USE_INSTANCING
      local = instanceMatrix;
    #endif
    vec4 world = modelMatrix * local * vec4(position, 1.0);
    vNormalW = normalize(mat3(modelMatrix) * mat3(local) * normal);
    vViewDir = cameraPosition - world.xyz;
    vSeed = fract(local[3].x * 3.7 + local[3].z * 1.3);
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;

const SHARD_FRAGMENT = /* glsl */ `
  uniform float uClock;
  uniform float uFade;
  uniform float uGlow;
  uniform float uOpacity;
  uniform float uFilm;
  uniform float uFresnel;
  uniform vec3  uColor;
  uniform vec3  uEdge;
  uniform float uGlobalGlow;
  varying vec3 vNormalW;
  varying vec3 vViewDir;
  varying float vSeed;

  ${commonGLSL}
  ${FILM_GLSL}

  void main() {
    vec3 N = normalize(vNormalW);
    vec3 V = normalize(vViewDir);
    vec3 Rf = reflect(-V, N);
    // A fake world in the mirror: bright sky above the horizon, dark floor below.
    float sky = smoothstep(-0.1, 0.5, Rf.y);
    float glint = pow(max(0.0, dot(Rf, normalize(vec3(0.4, 0.8, 0.3)))), 24.0);
    float rim = fresnelTerm(V, N, 3.0, uFresnel);
    vec3 col = mix(uColor * 0.4, uEdge, sky) + uEdge * glint * 3.0;
    col = mix(col, thinFilm(rim + vSeed + uClock * 0.1) * uEdge, uFilm * rim);
    float a = (0.35 + 0.4 * sky + rim + glint) * uFade * uOpacity;
    gl_FragColor = vec4(col * uGlow * uGlobalGlow, clamp(a, 0.0, 1.0));
  }
`;

/** Instanced mirror shards. */
export function createShardMaterial() {
  const material = new ShaderMaterial({
    ...additive(),
    uniforms: sharedUniforms({
      uClock: { value: 0 },
      uFade: { value: 1 },
      uGlow: { value: 1.6 },
      uOpacity: { value: 0.7 },
      uFilm: { value: 0.8 },
      uFresnel: { value: 1 },
      uColor: { value: new Color() },
      uEdge: { value: new Color() },
    }),
    vertexShader: SHARD_VERTEX,
    fragmentShader: SHARD_FRAGMENT,
  });
  material.userData.instanced = true;
  /** @param {object} s { clock, fade } */
  material.userData.sync = (s) => {
    const c = settings[ID];
    const g = settings.global;
    const u = material.uniforms;
    u.uClock.value = s.clock;
    u.uFade.value = s.fade;
    u.uGlow.value = c.shardGlow * g.glow;
    u.uOpacity.value = c.shardOpacity * g.opacity;
    u.uFilm.value = c.filmStrength;
    u.uFresnel.value = g.fresnel;
    u.uColor.value.copy(getColor(c.maskColor));
    u.uEdge.value.copy(getColor(c.edgeColor));
  };
  return material;
}

/* -------------------------------------------------------------------- */
/* The glitter                                                          */
/* -------------------------------------------------------------------- */

const GLITTER_VERTEX = /* glsl */ `
  attribute vec4 aSeed;       // lane, along, phase, index
  uniform float uClock;
  uniform float uFront;
  uniform float uLaneGap;
  uniform float uHeight;
  uniform float uRise;
  uniform float uSpread;
  uniform float uSize;
  uniform float uFade;
  uniform float uCount;
  uniform vec2  uResolution;
  varying float vAlpha;
  varying float vTwinkle;

  void main() {
    if (aSeed.w >= uCount || uFront <= 0.0) {
      gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
      gl_PointSize = 0.0;
      vAlpha = 0.0;
      vTwinkle = 0.0;
      return;
    }
    float life = fract(aSeed.z + uClock * 0.35);
    // Shed from the mask and left behind it: the same in every lane.
    float along = uFront - aSeed.y * min(uFront, 3.0) - life * 0.4;
    float x = aSeed.x * uLaneGap + (fract(aSeed.y * 13.7) - 0.5) * 0.9 * (1.0 + uSpread);
    float y = uHeight * (0.4 + 0.8 * fract(aSeed.z * 7.3)) + life * uRise;
    vec4 mv = modelViewMatrix * vec4(x, y, max(0.0, along), 1.0);
    gl_Position = projectionMatrix * mv;
    float env = sin(3.14159265 * life);
    vAlpha = env * uFade;
    vTwinkle = 0.5 + 0.5 * sin(uClock * 23.0 + aSeed.y * 91.0);
    gl_PointSize = uSize * env * uResolution.y * projectionMatrix[1][1] * 0.5 / max(0.1, -mv.z);
  }
`;

const GLITTER_FRAGMENT = /* glsl */ `
  uniform float uGlow;
  uniform vec3  uColor;
  uniform vec3  uHot;
  uniform float uGlobalGlow;
  varying float vAlpha;
  varying float vTwinkle;
  void main() {
    vec2 c = gl_PointCoord * 2.0 - 1.0;
    // A four-point star: two thin crossed bars over a soft core.
    float star = max(exp(-abs(c.x) * 14.0) * exp(-abs(c.y) * 3.0), exp(-abs(c.y) * 14.0) * exp(-abs(c.x) * 3.0));
    float core = exp(-dot(c, c) * 5.0);
    float a = (star * vTwinkle + core) * vAlpha;
    if (a < 0.003) discard;
    gl_FragColor = vec4(mix(uColor, uHot, core) * uGlow * uGlobalGlow, clamp(a, 0.0, 1.0));
  }
`;

/** GPU glitter dealt evenly across the three lanes. */
export function createGlitterMaterial() {
  const material = new ShaderMaterial({
    ...additive({ side: FrontSide }),
    uniforms: sharedUniforms({
      uClock: { value: 0 },
      uFront: { value: 0 },
      uLaneGap: { value: 1.8 },
      uHeight: { value: 1.15 },
      uRise: { value: 1.2 },
      uSpread: { value: 0 },
      uSize: { value: 0.05 },
      uFade: { value: 1 },
      uCount: { value: 1 },
      uGlow: { value: 2 },
      uColor: { value: new Color() },
      uHot: { value: new Color() },
    }),
    vertexShader: GLITTER_VERTEX,
    fragmentShader: GLITTER_FRAGMENT,
  });
  /** @param {object} s { clock, front, spread, fade, capacity } */
  material.userData.sync = (s) => {
    const c = settings[ID];
    const g = settings.global;
    const u = material.uniforms;
    u.uClock.value = s.clock;
    u.uFront.value = s.front;
    u.uLaneGap.value = c.laneGap;
    u.uHeight.value = c.maskHeight;
    u.uRise.value = c.glitterRise;
    u.uSpread.value = s.spread;
    u.uSize.value = c.glitterSize * g.particleSize;
    u.uFade.value = s.fade * g.opacity;
    u.uCount.value = Math.min(1, (c.glitterCount * g.particleCount) / s.capacity);
    u.uGlow.value = c.glitterGlow * g.glow;
    u.uColor.value.copy(getColor(c.maskColor));
    u.uHot.value.copy(getColor(c.glitterColor));
  };
  return material;
}

/* -------------------------------------------------------------------- */
/* The shimmer                                                          */
/* -------------------------------------------------------------------- */

const SHIMMER_VERTEX = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vWorld;
  void main() {
    vUv = uv;
    vec4 world = modelMatrix * vec4(position, 1.0);
    vWorld = world.xyz;
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;

const SHIMMER_FRAGMENT = /* glsl */ `
  uniform float uStrength;
  uniform float uScale;
  uniform float uSpeed;
  uniform float uLaneGap;
  uniform float uSpan;
  uniform float uShaderIntensity;
  uniform float uClock;
  varying vec2 vUv;
  varying vec3 vWorld;

  ${noiseGLSL}

  void main() {
    vec3 np = vec3(vWorld.xz * 1.4 * uScale, vWorld.y * 1.1 * uScale - uClock * uSpeed);
    vec2 dir = vec2(snoise(np), snoise(np + vec3(11.3, 5.1, 2.7)));
    // Strongest in each lane, feathered between, at the top and the floor.
    float x = (vUv.x - 0.5) * uSpan;
    float lanes = 0.0;
    for (int i = -1; i <= 1; i++) lanes = max(lanes, exp(-pow((x - float(i) * uLaneGap) / 0.7, 2.0)));
    float mask = lanes * smoothstep(0.0, 0.15, vUv.y) * (1.0 - smoothstep(0.55, 1.0, vUv.y));
    float strength = uStrength * uShaderIntensity * mask;
    if (strength < 0.002) discard;
    gl_FragColor = vec4(dir * 0.5 + 0.5, strength, mask);
  }
`;

/**
 * `LAYER.DISTORTION` sheet across the three lanes. Opaque on purpose: the
 * offset buffer wants the proxy's value, and an opaque proxy keeps the
 * expansion's "transparent ⇒ VFX layer" routing from pulling it out of the
 * warp pass.
 */
export function createShimmerMaterial() {
  const material = new ShaderMaterial({
    transparent: false,
    depthWrite: false,
    depthTest: false,
    blending: NormalBlending,
    side: DoubleSide,
    toneMapped: false,
    uniforms: sharedUniforms({
      uClock: { value: 0 },
      uStrength: { value: 0 },
      uScale: { value: 1 },
      uSpeed: { value: 1 },
      uLaneGap: { value: 1.8 },
      uSpan: { value: 6 },
    }),
    vertexShader: SHIMMER_VERTEX,
    fragmentShader: SHIMMER_FRAGMENT,
  });
  /** @param {object} s { clock, strength, span } */
  material.userData.sync = (s) => {
    const c = settings[ID];
    const g = settings.global;
    const u = material.uniforms;
    u.uClock.value = s.clock;
    u.uStrength.value = s.strength * c.shimmerStrength * g.distortion;
    u.uScale.value = c.shimmerScale * g.noiseFrequency;
    u.uSpeed.value = g.noiseSpeed;
    u.uLaneGap.value = c.laneGap;
    u.uSpan.value = s.span;
  };
  return material;
}
