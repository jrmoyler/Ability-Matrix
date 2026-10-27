import { AdditiveBlending, Color, DoubleSide, NormalBlending, ShaderMaterial } from 'three';
import { noiseGLSL } from '../../../shaders/lib/noise.glsl.js';
import { commonGLSL } from '../../../shaders/lib/common.glsl.js';
import { sharedUniforms } from '../../../core/FrameUniforms.js';
import { settings } from '../../../config/settings.js';
import { copyColor } from '../../../utils/color.js';

/**
 * Toxin Evolution — the bespoke shaders.
 *
 *  - **the membrane** — the hero: a translucent capsule grown over the host.
 *    Additive, so the host stays readable *inside* it, and dense at the
 *    silhouette (fresnel) like any thin wet film. Veins are domain-warped fbm
 *    streaming upward; cysts are voronoi bumps that rise out of the surface in
 *    the vertex stage as `uStage` climbs, and every accepted stage throbs the
 *    whole membrane (`uPulse`). It dissolves from the floor up on release.
 *  - **the vessel** — the seed pods: ribbed, fresnel-lit, with a hot seed
 *    glowing through the waist.
 *  - **the coil** — one generation of growth winding round the host. Grows
 *    along its length (`uGrow`), tapers to a point, filaments of light
 *    running along it.
 *  - **the spore** — small lumpy beads, fresnel and a slow pulse.
 *  - **the pool** — the infection stain on the floor. Normal-blended so it
 *    *darkens* the ground: wet voronoi cells, glowing seams between them,
 *    a spreading front that advances with each stage, a soft lobed edge.
 *  - **the haze** — a `LAYER.DISTORTION` billboard over the host: the air
 *    shimmering with fumes, stronger with every stage.
 *
 * Each material carries `userData.sync(c, state)` that reads the live
 * settings block, so every slider applies mid-cast. Uniform names the
 * candidate tests read (`uPulse`, `uStage`, `uFade`, `uColor`, `uCore`) are
 * kept from the first implementation.
 */

/* -------------------------------------------------------------------- */
/* The membrane                                                         */
/* -------------------------------------------------------------------- */

const MEMBRANE_VERTEX = /* glsl */ `
  uniform float uTime;
  uniform float uStage;
  uniform float uPulse;
  uniform float uCysts;
  uniform float uWobble;

  varying vec2  vUv;
  varying vec3  vNormalW;
  varying vec3  vViewDir;
  varying float vCyst;
  varying float vViewZ;

  ${noiseGLSL}

  void main() {
    vUv = uv;
    vec3 p = position;
    // Slow peristaltic wave climbing the membrane, stronger at later stages.
    float wave = sin(uv.y * 19.0 - uTime * 4.0 + uv.x * 12.0) * 0.035 * (1.0 + uStage * 0.3) * uWobble;
    // Cysts: voronoi cells round the girth whose centres swell outward as
    // the toxin evolves. Cell size shrinks per stage so more erupt.
    vec2 cellUv = vec2(uv.x * (7.0 + uStage * 2.0), uv.y * (5.0 + uStage * 1.5));
    vec2 cell = voronoi2(cellUv);
    float cyst = (1.0 - smoothstep(0.0, 0.45, cell.x)) * step(0.45 - uStage * 0.12, cell.y) * min(uStage, 3.0) / 3.0;
    vCyst = cyst;
    float swell = 1.0 + wave + uPulse * 0.12 + cyst * 0.18 * uCysts;
    p.xz *= swell;
    vec4 world = modelMatrix * vec4(p, 1.0);
    vNormalW = normalize(mat3(modelMatrix) * normal);
    vViewDir = cameraPosition - world.xyz;
    vec4 mv = viewMatrix * world;
    vViewZ = mv.z;
    gl_Position = projectionMatrix * mv;
  }
`;

const MEMBRANE_FRAGMENT = /* glsl */ `
  uniform float uTime;
  uniform float uStage;
  uniform float uPulse;
  uniform float uFade;
  uniform float uDissolve;
  uniform float uFresnel;
  uniform float uGlow;
  uniform float uVeinScale;
  uniform float uVeinSharp;
  uniform float uOpacity;
  uniform float uSoftFade;
  uniform float uGlobalGlow;
  uniform float uShaderIntensity;
  uniform vec3  uColor;
  uniform vec3  uCore;
  uniform sampler2D uSceneDepth;
  uniform vec2  uResolution;
  uniform float uCameraNear;
  uniform float uCameraFar;

  varying vec2  vUv;
  varying vec3  vNormalW;
  varying vec3  vViewDir;
  varying float vCyst;
  varying float vViewZ;

  ${noiseGLSL}
  ${commonGLSL}

  void main() {
    // Release eats from the floor up with a bright margin.
    float eat = vUv.y + snoise(vec3(vUv * vec2(9.0, 4.0), 2.3)) * 0.12;
    if (eat < uDissolve * 1.15) discard;
    float burn = (1.0 - smoothstep(uDissolve * 1.15, uDissolve * 1.15 + 0.08, eat)) * step(0.001, uDissolve);

    // Domain-warped veins streaming upward round the girth.
    vec3 q = vec3(vUv.x * 6.2831 * 0.6, vUv.y * 3.0 - uTime * 0.35, 1.7) * uVeinScale;
    vec3 warp = vec3(fbm3(q), fbm3(q + vec3(5.2, 1.3, 2.8)), 0.0);
    float veins = pow(1.0 - abs(snoise(q * 1.7 + warp * 1.6)), uVeinSharp);
    float rib = pow(max(0.0, cos(vUv.y * 42.0 - uTime * 3.0)), 18.0);

    float rim = fresnelTerm(vViewDir, vNormalW, 2.0, uFresnel);
    float heat = clamp(veins * 0.55 + rim * 0.35 + vCyst * 0.5 + uStage * 0.08 + uPulse * 0.3, 0.0, 1.0);
    vec3 col = mix(uColor, uCore, heat) * uGlow * uGlobalGlow * (1.0 + uPulse * 0.8);
    col += uCore * burn * 2.5;

    float alpha = (0.12 + veins * 0.32 + rib * 0.1 + rim * 0.38 + vCyst * 0.2) * uFade * uOpacity * uShaderIntensity;
    vec2 screenUV = gl_FragCoord.xy / uResolution;
    alpha *= softFade(uSceneDepth, screenUV, vViewZ, uCameraNear, uCameraFar, uSoftFade);
    if (alpha < 0.003) discard;
    gl_FragColor = vec4(col, clamp(alpha, 0.0, 1.0));
  }
`;

export function createMembraneMaterial() {
  const material = new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: DoubleSide,
    blending: AdditiveBlending,
    toneMapped: false,
    uniforms: sharedUniforms({
      // Own clock, held at 0 under reduced motion (the shared uTime is not).
      uTime: { value: 0 },
      uStage: { value: 0 },
      uPulse: { value: 0 },
      uFade: { value: 1 },
      uDissolve: { value: 0 },
      uCysts: { value: 1 },
      uWobble: { value: 1 },
      uFresnel: { value: 1.6 },
      uGlow: { value: 1.3 },
      uVeinScale: { value: 1 },
      uVeinSharp: { value: 6 },
      uOpacity: { value: 1 },
      uSoftFade: { value: 0.25 },
      uColor: { value: new Color('#9be641') },
      uCore: { value: new Color('#e4ff93') }
    }),
    vertexShader: MEMBRANE_VERTEX,
    fragmentShader: MEMBRANE_FRAGMENT
  });
  material.userData.sync = (c, state) => {
    const g = settings.global;
    const u = material.uniforms;
    u.uTime.value = state.time;
    u.uStage.value = state.stage;
    u.uPulse.value = state.pulse;
    u.uFade.value = state.fade;
    u.uDissolve.value = state.dissolve;
    u.uCysts.value = c.cystGrowth;
    u.uWobble.value = state.reduced ? 0 : 1;
    u.uFresnel.value = c.membraneFresnel * g.fresnel;
    u.uGlow.value = c.membraneGlow * g.glow;
    u.uVeinScale.value = c.veinScale * g.noiseFrequency;
    u.uVeinSharp.value = c.veinSharp;
    u.uOpacity.value = g.opacity;
    u.uSoftFade.value = c.softFade;
    copyColor(u.uColor.value, c.toxinColor);
    copyColor(u.uCore.value, c.coreColor);
  };
  return material;
}

/* -------------------------------------------------------------------- */
/* Vessel and spore — small fresnel-lit solids                          */
/* -------------------------------------------------------------------- */

const LIT_VERTEX = /* glsl */ `
  uniform float uTime;
  uniform float uBreathe;
  varying vec2 vUv;
  varying vec3 vNormalW;
  varying vec3 vViewDir;
  void main() {
    vUv = uv;
    vec3 p = position;
    // The vessel breathes round its waist.
    p.xz *= 1.0 + 0.04 * sin(uTime * 3.0 + uv.y * 10.0) * uBreathe;
    vec4 world = modelMatrix * vec4(p, 1.0);
    vNormalW = normalize(mat3(modelMatrix) * normal);
    vViewDir = cameraPosition - world.xyz;
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;

const VESSEL_FRAGMENT = /* glsl */ `
  uniform float uTime;
  uniform float uFade;
  uniform float uFresnel;
  uniform float uGlow;
  uniform float uGlobalGlow;
  uniform vec3  uColor;
  uniform vec3  uCore;
  varying vec2 vUv;
  varying vec3 vNormalW;
  varying vec3 vViewDir;

  ${noiseGLSL}
  ${commonGLSL}

  void main() {
    float ribs = pow(max(0.0, cos(vUv.x * 31.42 + sin(vUv.y * 9.0 - uTime))), 16.0);
    // The seed: a hot knot glowing through the waist, mottled by noise.
    float seed = exp(-abs(vUv.y - 0.55) * 8.0) * (0.7 + 0.3 * snoise(vec3(vUv * 6.0, uTime * 0.7)));
    float rim = fresnelTerm(vViewDir, vNormalW, 2.2, uFresnel);
    vec3 col = mix(uColor, uCore, clamp(seed * 0.5 + ribs * 0.45 + rim * 0.3, 0.0, 1.0)) * uGlow * uGlobalGlow;
    float alpha = (0.2 + seed * 0.25 + ribs * 0.3 + rim * 0.35) * uFade;
    if (alpha < 0.003) discard;
    gl_FragColor = vec4(col, clamp(alpha, 0.0, 1.0));
  }
`;

export function createVesselMaterial() {
  const material = new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: DoubleSide,
    blending: AdditiveBlending,
    toneMapped: false,
    uniforms: sharedUniforms({
      uTime: { value: 0 },
      uBreathe: { value: 1 },
      uFade: { value: 1 },
      uFresnel: { value: 1.6 },
      uGlow: { value: 1.4 },
      uColor: { value: new Color('#9be641') },
      uCore: { value: new Color('#e4ff93') }
    }),
    vertexShader: LIT_VERTEX,
    fragmentShader: VESSEL_FRAGMENT
  });
  material.userData.sync = (c, state) => {
    const g = settings.global;
    const u = material.uniforms;
    u.uTime.value = state.time;
    u.uFade.value = state.fade;
    u.uBreathe.value = state.reduced ? 0 : 1;
    u.uFresnel.value = c.membraneFresnel * g.fresnel;
    u.uGlow.value = c.vesselGlow * g.glow;
    copyColor(u.uColor.value, c.toxinColor);
    copyColor(u.uCore.value, c.coreColor);
  };
  return material;
}

const SPORE_FRAGMENT = /* glsl */ `
  uniform float uTime;
  uniform float uFade;
  uniform float uGlow;
  uniform float uGlobalGlow;
  uniform vec3  uColor;
  uniform vec3  uCore;
  varying vec2 vUv;
  varying vec3 vNormalW;
  varying vec3 vViewDir;

  ${commonGLSL}

  void main() {
    float rim = fresnelTerm(vViewDir, vNormalW, 1.6, 1.0);
    float pulse = 0.6 + 0.4 * sin(uTime * 5.0 + vUv.x * 6.2831);
    vec3 col = mix(uCore, uColor, rim) * uGlow * uGlobalGlow * pulse;
    gl_FragColor = vec4(col, clamp((0.45 + rim * 0.5) * uFade, 0.0, 1.0));
  }
`;

export function createSporeMaterial() {
  const material = new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
    toneMapped: false,
    uniforms: sharedUniforms({
      uTime: { value: 0 },
      uBreathe: { value: 0 },
      uFade: { value: 1 },
      uGlow: { value: 1.6 },
      uColor: { value: new Color('#9be641') },
      uCore: { value: new Color('#e4ff93') }
    }),
    vertexShader: LIT_VERTEX,
    fragmentShader: SPORE_FRAGMENT
  });
  material.userData.sync = (c, state) => {
    const g = settings.global;
    const u = material.uniforms;
    u.uTime.value = state.time;
    u.uFade.value = state.fade;
    u.uGlow.value = c.sporeGlow * g.glow;
    copyColor(u.uColor.value, c.toxinColor);
    copyColor(u.uCore.value, c.coreColor);
  };
  return material;
}

/* -------------------------------------------------------------------- */
/* The coil                                                             */
/* -------------------------------------------------------------------- */

const COIL_VERTEX = /* glsl */ `
  uniform float uTime;
  uniform float uTier;
  uniform float uTaper;
  varying vec2 vUv;
  void main() {
    vUv = uv;
    vec3 p = position;
    // Taper both ends to a point by pulling vertices back onto the spine.
    float ends = smoothstep(0.0, 0.12, uv.x) * (1.0 - smoothstep(0.82, 1.0, uv.x));
    float radius = 0.025 + uTier * 0.004;
    p -= normal * radius * (1.0 - mix(1.0, ends, uTaper));
    p.y += sin(uv.x * 15.0 - uTime * 2.0 + uTier) * 0.025;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`;

const COIL_FRAGMENT = /* glsl */ `
  uniform float uTime;
  uniform float uFade;
  uniform float uPulse;
  uniform float uTier;
  uniform float uGrow;
  uniform float uGlow;
  uniform float uGlobalGlow;
  uniform vec3  uColor;
  uniform vec3  uCore;
  varying vec2 vUv;

  void main() {
    // Grows from the root; the growing tip is the brightest point.
    if (vUv.x > uGrow) discard;
    float tip = exp(-(uGrow - vUv.x) * 30.0) * step(uGrow, 0.999);
    float filament = pow(max(0.0, cos(vUv.x * (24.0 + uTier * 7.0) - uTime * 3.0)), 12.0);
    float rim = pow(abs(vUv.y * 2.0 - 1.0), 2.0);
    vec3 color = mix(uColor, uCore, clamp(filament * 0.45 + rim * 0.25 + uPulse * 0.2 + tip, 0.0, 1.0)) * uGlow * uGlobalGlow;
    float alpha = (0.3 + filament * 0.35 + rim * 0.15 + uPulse * 0.2 + tip * 0.4) * uFade;
    gl_FragColor = vec4(color, clamp(alpha, 0.0, 1.0));
  }
`;

export function createCoilMaterial(tier) {
  const material = new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: DoubleSide,
    blending: AdditiveBlending,
    toneMapped: false,
    uniforms: {
      uTime: { value: 0 },
      uFade: { value: 0 },
      uPulse: { value: 0 },
      uTier: { value: tier },
      uGrow: { value: 0 },
      uTaper: { value: 1 },
      uGlow: { value: 1.4 },
      uGlobalGlow: sharedUniforms().uGlobalGlow,
      uColor: { value: new Color('#9be641') },
      uCore: { value: new Color('#e4ff93') }
    },
    vertexShader: COIL_VERTEX,
    fragmentShader: COIL_FRAGMENT
  });
  material.userData.sync = (c, state) => {
    const g = settings.global;
    const u = material.uniforms;
    u.uTime.value = state.time;
    u.uFade.value = state.fade;
    u.uPulse.value = state.pulse;
    u.uGrow.value = state.grow;
    u.uTaper.value = c.coilTaper;
    u.uGlow.value = c.coilGlow * g.glow;
    copyColor(u.uColor.value, c.toxinColor);
    copyColor(u.uCore.value, c.coreColor);
  };
  return material;
}

/* -------------------------------------------------------------------- */
/* The pool                                                             */
/* -------------------------------------------------------------------- */

const POOL_VERTEX = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vWorld;
  void main() {
    vUv = uv;
    vec4 world = modelMatrix * vec4(position, 1.0);
    vWorld = world.xyz;
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;

const POOL_FRAGMENT = /* glsl */ `
  uniform float uTime;
  uniform float uStage;
  uniform float uFade;
  uniform float uSpread;     // 0..1 how far the stain has crept out
  uniform float uCells;
  uniform float uGlow;
  uniform float uDarken;
  uniform float uOpacity;
  uniform float uGlobalGlow;
  uniform vec3  uColor;
  uniform vec3  uCore;
  uniform vec3  uStain;
  varying vec2 vUv;
  varying vec3 vWorld;

  ${noiseGLSL}

  void main() {
    vec2 p = vUv * 2.0 - 1.0;
    float r = length(p);
    float a = atan(p.y, p.x);
    // The creeping front, broken by noise so it advances in fingers.
    float front = uSpread * (0.85 + 0.25 * fbm3(vec3(a * 1.6, uStage * 0.7, 4.1)));
    float body = 1.0 - smoothstep(front - 0.18, front, r);
    if (body <= 0.0) discard;

    // Wet cells of toxin, with glowing seams between them.
    vec2 cell = voronoi2(p * uCells + vec2(uTime * 0.05, 0.0));
    float seam = 1.0 - smoothstep(0.05, 0.22, cell.x);
    float bubbling = 0.6 + 0.4 * sin(uTime * 2.0 + cell.y * 30.0);
    // A ring of brighter growth riding the advancing front.
    float edge = exp(-abs(r - front + 0.06) * 18.0);
    // Six-fold sigil cells that brighten per stage (the old ring glyph).
    float sigil = pow(max(0.0, cos(a * 6.0 + sin(r * 10.0 - uTime))), 16.0) * smoothstep(0.25, 0.5, r) * min(uStage, 3.0) / 3.0;

    float glow = clamp(seam * bubbling * 0.6 + edge * 0.8 + sigil * 0.5, 0.0, 1.0);
    vec3 col = mix(uStain, mix(uColor, uCore, edge) * uGlow * uGlobalGlow, glow);
    float alpha = body * mix(uDarken, 1.0, glow) * uFade * uOpacity;
    if (alpha < 0.003) discard;
    gl_FragColor = vec4(col, clamp(alpha, 0.0, 1.0));
  }
`;

export function createPoolMaterial() {
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
      uStage: { value: 0 },
      uFade: { value: 1 },
      uSpread: { value: 0 },
      uCells: { value: 4 },
      uGlow: { value: 1.5 },
      uDarken: { value: 0.55 },
      uOpacity: { value: 1 },
      uColor: { value: new Color('#9be641') },
      uCore: { value: new Color('#e4ff93') },
      uStain: { value: new Color('#16260f') }
    }),
    vertexShader: POOL_VERTEX,
    fragmentShader: POOL_FRAGMENT
  });
  material.userData.sync = (c, state) => {
    const g = settings.global;
    const u = material.uniforms;
    u.uTime.value = state.time;
    u.uStage.value = state.stage;
    u.uFade.value = state.fade;
    u.uSpread.value = state.spread;
    u.uCells.value = c.poolCells * g.noiseFrequency;
    u.uGlow.value = c.poolGlow * g.glow;
    u.uDarken.value = c.poolDarken;
    u.uOpacity.value = g.opacity;
    copyColor(u.uColor.value, c.toxinColor);
    copyColor(u.uCore.value, c.coreColor);
    copyColor(u.uStain.value, c.stainColor);
  };
  return material;
}

/* -------------------------------------------------------------------- */
/* The haze (LAYER.DISTORTION)                                          */
/* -------------------------------------------------------------------- */

const HAZE_VERTEX = /* glsl */ `
  uniform float uWidth;
  uniform float uHeight;
  varying vec2 vUv;
  varying vec3 vWorld;
  void main() {
    vUv = uv;
    vec4 mv = modelViewMatrix * vec4(0.0, 0.0, 0.0, 1.0);
    vec2 offset = vec2(position.x * uWidth, (position.y + 0.5) * uHeight);
    mv.xy += offset;
    vWorld = (modelMatrix * vec4(offset, 0.0, 1.0)).xyz;
    gl_Position = projectionMatrix * mv;
  }
`;

const HAZE_FRAGMENT = /* glsl */ `
  uniform float uTime;
  uniform float uStrength;
  uniform float uScale;
  uniform float uSpeed;
  uniform float uShaderIntensity;
  varying vec2 vUv;
  varying vec3 vWorld;

  ${noiseGLSL}

  void main() {
    // Fumes rising off the host: noise scrolled upward, strongest at the
    // shoulders, feathered on every side so the warp never shows a border.
    vec3 np = vec3(vWorld.xz * uScale, vWorld.y * uScale * 0.6 - uTime * uSpeed);
    float nx = snoise(np);
    float ny = snoise(np + vec3(19.3, 7.7, 31.1));
    vec2 c = (vUv - 0.5) * 2.0;
    float mask = (1.0 - smoothstep(0.3, 1.0, abs(c.x))) * smoothstep(0.0, 0.25, vUv.y) * (1.0 - smoothstep(0.6, 1.0, vUv.y));
    float strength = uStrength * uShaderIntensity * mask;
    if (strength < 0.002) discard;
    gl_FragColor = vec4(vec2(nx, ny) * 0.5 + 0.5, strength, mask);
  }
`;

export function createHazeMaterial() {
  const material = new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    depthTest: false,
    side: DoubleSide,
    blending: NormalBlending,
    toneMapped: false,
    uniforms: sharedUniforms({
      uTime: { value: 0 },
      uWidth: { value: 2 },
      uHeight: { value: 3 },
      uStrength: { value: 0 },
      uScale: { value: 1.6 },
      uSpeed: { value: 0.9 }
    }),
    vertexShader: HAZE_VERTEX,
    fragmentShader: HAZE_FRAGMENT
  });
  material.userData.sync = (c, state) => {
    const g = settings.global;
    const u = material.uniforms;
    u.uTime.value = state.time;
    u.uWidth.value = state.width;
    u.uHeight.value = state.height;
    u.uStrength.value = state.strength * c.hazeStrength * g.distortion;
    u.uScale.value = c.hazeScale * g.noiseFrequency;
    u.uSpeed.value = c.hazeSpeed * g.noiseSpeed;
  };
  return material;
}
