import { AdditiveBlending, Color, DoubleSide, AddEquation, CustomBlending, OneMinusSrcAlphaFactor, SrcAlphaFactor, ShaderMaterial } from 'three';
import { noiseGLSL } from '../../../shaders/lib/noise.glsl.js';
import { sharedUniforms } from '../../../core/FrameUniforms.js';
import { settings } from '../../../config/settings.js';
import { getColor } from '../../../utils/color.js';
import config from './config.js';

/**
 * Adaptive Fabricator — every material the sentry draws with.
 *
 * Each factory returns a `ShaderMaterial` with hand-written GLSL and a
 * `userData.sync(state)` that reads `settings.adaptiveFabricator` and the
 * global multipliers into uniforms every frame, so the editor is live. The
 * per-frame inputs the ability resolves (build progress, fade, phases) arrive
 * in a small reused `state` object.
 *
 *  - **housing** — opaque, lit by `uLightDir`, with world-grid panel seams,
 *    fbm grime, a fresnel rim in the trim colour and the *fabrication front*:
 *    a noise-jagged horizontal edge that climbs the sentry as it assembles and
 *    sinks back down as it un-builds, burning white where it cuts. Drawn on
 *    `LAYER.SHAPED` so the depth prepass never rasterises the unbuilt part.
 *  - **core** — the same front, but the crystal is an energy body: fbm flow
 *    and climbing bands under a strong fresnel, flaring on each shot.
 *  - **floor** — the scan disc: an axial hex grid with flickering cells,
 *    spokes, a trailing radar sweep and outward pulses. During travel the same
 *    shader runs in *telegraph* mode — rim and faint grid only.
 *  - **beam** — a crossed-ribbon bolt with a hot core and noise racing along it.
 *  - **ring** — the halo and the arrival reticle: a soft band with dashes.
 *  - **seed** — the fabrication seed in flight: fresnel shell with bands.
 *  - **warp** — a camera-facing proxy on `LAYER.DISTORTION` (the acid-fume
 *    contract) shimmering above the emitters and kicked by every shot.
 */

const ID = config.id;

/* ==================================================================== */
/* Housing + core                                                         */
/* ==================================================================== */

const HOUSING_VERTEX = /* glsl */ `
  varying vec3 vWorld;
  varying vec3 vNormalW;
  varying vec2 vUv;

  void main() {
    vUv = uv;
    vec4 world = modelMatrix * vec4(position, 1.0);
    vWorld = world.xyz;
    vNormalW = normalize(mat3(modelMatrix) * normal);
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;

const HOUSING_FRAGMENT = /* glsl */ `
  precision highp float;

  uniform float uTime;
  uniform vec3  uLightDir;
  uniform float uGlobalGlow;
  uniform float uShaderIntensity;

  uniform float uBuild;        // 0 nothing, 1 fully assembled
  uniform float uBaseY;        // floor height of the sentry, world metres
  uniform float uBuildHeight;  // metres the front climbs
  uniform float uEdge;         // edge height, fraction of uBuildHeight
  uniform float uBuildNoise;
  uniform float uBuildGlow;
  uniform vec3  uEdgeColor;

  uniform vec3  uMetal;
  uniform vec3  uTrim;
  uniform vec3  uCore;
  uniform float uPanelScale;
  uniform float uPanelGlow;
  uniform float uRimPower;
  uniform float uRim;
  uniform float uShine;
  uniform float uGrime;
  uniform float uEnergy;       // 0 for the plates, 1 for the energy core
  uniform float uCoreGlow;
  uniform float uFlare;        // shot kick, 0..1

  varying vec3 vWorld;
  varying vec3 vNormalW;
  varying vec2 vUv;

  ${noiseGLSL}

  void main() {
    // --- fabrication front -------------------------------------------
    // h is 0 at the floor and 1 at the top of the sentry. The front starts
    // below the noise floor and finishes above the noise ceiling, so uBuild
    // 0 and 1 really are "nothing" and "everything".
    float h = (vWorld.y - uBaseY) / max(uBuildHeight, 1e-3);
    float jag = snoise(vec3(vWorld.xz * 5.0, vWorld.y * 2.0 + uTime * 0.9)) * uBuildNoise;
    float front = uBuild * (1.0 + 2.0 * uBuildNoise + uEdge) - uBuildNoise - 0.001;
    float d = front - (h + jag);
    if (d < 0.0) discard;
    float edge = 1.0 - smoothstep(0.0, max(uEdge, 1e-3), d);

    // --- lighting -----------------------------------------------------
    vec3 N = normalize(vNormalW);
    if (!gl_FrontFacing) N = -N;
    vec3 V = normalize(cameraPosition - vWorld);
    vec3 L = normalize(uLightDir);
    // Wrapped so the shadow side is still painted metal, not a black hole.
    float diffuse = 0.32 + 0.68 * clamp(dot(N, L) * 0.5 + 0.5, 0.0, 1.0);
    vec3 H = normalize(L + V);
    float spec = pow(max(dot(N, H), 0.0), 56.0) * uShine;
    float rim = pow(1.0 - abs(dot(N, V)), max(uRimPower, 0.1)) * uRim;

    // --- panel seams: a world grid projected on the dominant axis -----
    vec3 an = abs(N);
    vec3 p = vWorld * uPanelScale;
    vec2 q = an.y > max(an.x, an.z) ? p.xz : (an.x > an.z ? p.zy : p.xy);
    vec2 g = abs(fract(q) - 0.5);
    float seam = smoothstep(0.46, 0.5, max(g.x, g.y));
    // Seams pulse in a slow travelling wave so the plates look powered.
    float power = 0.55 + 0.45 * sin(uTime * 2.4 - vWorld.y * 5.0);

    float grime = fbm3(vWorld * 3.3) * 0.5 + 0.5;
    vec3 plate = uMetal * mix(1.0, 0.5 + 0.5 * grime, uGrime);
    vec3 color = plate * diffuse + vec3(spec) + uTrim * (rim + seam * uPanelGlow * power);

    // --- energy core --------------------------------------------------
    if (uEnergy > 0.5) {
      float flow = fbm3(vec3(vWorld.xz * 4.0, vWorld.y * 3.0 - uTime * 2.2));
      float bands = pow(0.5 + 0.5 * sin(vWorld.y * 26.0 - uTime * 7.0), 6.0);
      float f = pow(1.0 - abs(dot(N, V)), 1.6);
      vec3 energy = uCore * (uCoreGlow * (0.75 + 0.55 * flow) + bands * 0.7 + f * 1.8);
      energy *= 1.0 + uFlare * 1.5;
      color = mix(color, energy * uGlobalGlow, 0.9);
    }

    // The cut burns: brightest right at the front, cooling below it.
    color += uEdgeColor * edge * uBuildGlow * uShaderIntensity;
    gl_FragColor = vec4(color, 1.0);
  }
`;

/** @param {'housing'|'core'} role */
export function createHousingMaterial(role = 'housing') {
  const energy = role === 'core';
  const material = new ShaderMaterial({
    transparent: false,
    depthWrite: true,
    depthTest: true,
    side: DoubleSide,
    toneMapped: false,
    uniforms: sharedUniforms({
      uBuild: { value: 0 },
      uBaseY: { value: 0 },
      uBuildHeight: { value: 2.3 },
      uEdge: { value: 0.09 },
      uBuildNoise: { value: 0.18 },
      uBuildGlow: { value: 3 },
      uEdgeColor: { value: new Color('#ffffff') },
      uMetal: { value: new Color('#284258') },
      uTrim: { value: new Color('#7fd6ff') },
      uCore: { value: new Color('#7ff0ff') },
      uPanelScale: { value: 7 },
      uPanelGlow: { value: 0.6 },
      uRimPower: { value: 2.5 },
      uRim: { value: 0.55 },
      uShine: { value: 0.7 },
      uGrime: { value: 0.35 },
      uEnergy: { value: energy ? 1 : 0 },
      uCoreGlow: { value: 1.6 },
      uFlare: { value: 0 },
    }),
    vertexShader: HOUSING_VERTEX,
    fragmentShader: HOUSING_FRAGMENT,
  });

  /** @param {{build:number, baseY:number, height:number, flare:number}} s */
  material.userData.sync = (s) => {
    const c = settings[ID];
    const g = settings.global;
    const u = material.uniforms;
    u.uBuild.value = s.build;
    u.uBaseY.value = s.baseY;
    u.uBuildHeight.value = s.height;
    u.uEdge.value = c.buildEdge;
    u.uBuildNoise.value = c.buildNoise * g.noiseStrength;
    u.uBuildGlow.value = c.buildGlow * g.glow;
    u.uEdgeColor.value.copy(getColor(c.coreColor)).lerp(getColor('#ffffff'), 0.6);
    u.uMetal.value.copy(getColor(c.metalColor));
    u.uTrim.value.copy(getColor(c.trimColor));
    u.uCore.value.copy(getColor(c.coreColor));
    u.uPanelScale.value = c.panelScale * g.noiseFrequency;
    u.uPanelGlow.value = c.panelGlow * g.glow;
    u.uRimPower.value = c.rimPower;
    u.uRim.value = c.rimStrength * g.fresnel;
    u.uShine.value = c.shine;
    u.uGrime.value = c.grime;
    u.uCoreGlow.value = c.coreGlow * g.glow;
    u.uFlare.value = s.flare * c.coreFlare;
  };
  return material;
}

/* ==================================================================== */
/* Scan floor                                                             */
/* ==================================================================== */

const FLOOR_VERTEX = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const FLOOR_FRAGMENT = /* glsl */ `
  precision highp float;

  uniform float uTime;
  uniform float uGlobalGlow;
  uniform float uShaderIntensity;
  uniform float uFade;
  uniform float uTelegraph;    // 1 during travel: rim and faint grid only
  uniform float uOpacity;
  uniform float uGlow;
  uniform float uRadius;       // metres, so the grid keeps its cell size
  uniform float uGridScale;
  uniform float uGridOpacity;
  uniform float uSpokes;
  uniform float uSweepPhase;   // integrated on the CPU
  uniform float uRingPhase;    // integrated on the CPU
  uniform float uNoise;
  uniform vec3  uColor;
  uniform vec3  uHot;

  varying vec2 vUv;

  ${noiseGLSL}

  /** Distance to the edge of a unit hexagon. */
  float hexDistance(vec2 p) {
    p = abs(p);
    return max(dot(p, normalize(vec2(1.0, 1.7320508))), p.x);
  }

  /** Axial hex tiling: xy is the offset inside the cell, zw the cell id. */
  vec4 hexCell(vec2 uv) {
    vec2 r = vec2(1.0, 1.7320508);
    vec2 h = r * 0.5;
    vec2 a = mod(uv, r) - h;
    vec2 b = mod(uv - h, r) - h;
    vec2 gv = dot(a, a) < dot(b, b) ? a : b;
    return vec4(gv, uv - gv);
  }

  void main() {
    vec2 q = vUv * 2.0 - 1.0;
    float r = length(q);
    float a = atan(q.y, q.x);
    float mask = 1.0 - smoothstep(0.95, 1.0, r);
    float rim = exp(-abs(r - 0.965) * 60.0);

    vec4 cell = hexCell(q * uRadius * uGridScale * 0.5);
    float hx = hexDistance(cell.xy);
    float grid = smoothstep(0.42, 0.5, hx);
    // A sparse set of cells blinks on and off, re-rolled four times a second.
    float roll = hash13(vec3(cell.zw, floor(uTime * 4.0)));
    float blink = step(0.88, roll) * (1.0 - smoothstep(0.0, 0.48, hx));

    float spokes = pow(abs(cos(a * uSpokes * 0.5)), 48.0) * smoothstep(0.18, 0.7, r);
    // The sweep: a bright leading edge with a long exponential tail behind it.
    float behind = mod(uSweepPhase - a, 6.2831853);
    float sweep = exp(-behind * 2.4) * smoothstep(0.08, 0.3, r) * (1.0 - smoothstep(0.88, 0.96, r));
    float rings = pow(max(0.0, cos(r * 38.0 - uRingPhase)), 18.0) * 0.25;
    float breakup = mix(1.0, 0.5 + snoise01(vec3(q * 3.0, uTime * 0.35)), uNoise * uShaderIntensity);

    float deployed = (rim * 0.75 + grid * uGridOpacity + blink * 0.4 + spokes * 0.3 + sweep * 0.6 + rings) * breakup;
    float telegraph = rim * 0.9 + grid * uGridOpacity * 0.45 + rings * 0.6;
    float alpha = mix(deployed, telegraph, uTelegraph) * mask * uFade * uOpacity;
    if (alpha < 0.003) discard;

    vec3 color = mix(uColor, uHot, clamp(sweep * 0.7 + blink * 0.6, 0.0, 1.0));
    gl_FragColor = vec4(color * uGlow * uGlobalGlow, alpha);
  }
`;

export function createFloorMaterial() {
  const material = new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: DoubleSide,
    blending: AdditiveBlending,
    toneMapped: false,
    uniforms: sharedUniforms({
      uFade: { value: 1 },
      uTelegraph: { value: 1 },
      uOpacity: { value: 1 },
      uGlow: { value: 2 },
      uRadius: { value: 6 },
      uGridScale: { value: 3.2 },
      uGridOpacity: { value: 0.22 },
      uSpokes: { value: 6 },
      uSweepPhase: { value: 0 },
      uRingPhase: { value: 0 },
      uNoise: { value: 0.5 },
      uColor: { value: new Color('#7ff0ff') },
      uHot: { value: new Color('#ffffff') },
    }),
    vertexShader: FLOOR_VERTEX,
    fragmentShader: FLOOR_FRAGMENT,
  });

  /** @param {{fade:number, telegraph:number, opacity:number, sweep:number, rings:number}} s */
  material.userData.sync = (s) => {
    const c = settings[ID];
    const g = settings.global;
    const u = material.uniforms;
    u.uFade.value = s.fade;
    u.uTelegraph.value = s.telegraph;
    u.uOpacity.value = s.opacity * g.opacity;
    u.uGlow.value = c.floorGlow * g.glow;
    u.uRadius.value = c.zoneRadius;
    u.uGridScale.value = c.gridScale * g.noiseFrequency;
    u.uGridOpacity.value = c.gridOpacity;
    u.uSpokes.value = Math.max(1, Math.round(c.spokes));
    u.uSweepPhase.value = s.sweep;
    u.uRingPhase.value = s.rings;
    u.uNoise.value = c.floorNoise * g.noiseStrength;
    u.uColor.value.copy(getColor(c.coreColor));
    u.uHot.value.copy(getColor(c.beamColor));
  };
  return material;
}

/* ==================================================================== */
/* Beam, rings, seed                                                      */
/* ==================================================================== */

const UV_VERTEX = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const BEAM_FRAGMENT = /* glsl */ `
  precision highp float;
  uniform float uTime;
  uniform float uGlobalGlow;
  uniform float uFade;
  uniform float uGlow;
  uniform float uNoise;
  uniform vec3  uColor;
  varying vec2 vUv;

  ${noiseGLSL}

  void main() {
    float across = abs(vUv.x * 2.0 - 1.0);
    float core = exp(-across * across * 30.0);
    float halo = exp(-across * 3.5) * 0.4;
    // Noise racing from the emitter to the target: the bolt has direction.
    float flow = snoise01(vec3(vUv.x * 2.0, vUv.y * 7.0 - uTime * 22.0, uTime * 3.0));
    float ends = smoothstep(0.0, 0.05, vUv.y) * (1.0 - smoothstep(0.9, 1.0, vUv.y));
    float alpha = (core + halo * mix(1.0, 0.3 + 1.4 * flow, uNoise)) * ends * uFade;
    if (alpha < 0.003) discard;
    vec3 color = mix(uColor, vec3(1.0), core * 0.65) * uGlow * uGlobalGlow;
    gl_FragColor = vec4(color, alpha);
  }
`;

export function createBeamMaterial() {
  const material = new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: DoubleSide,
    blending: AdditiveBlending,
    toneMapped: false,
    uniforms: sharedUniforms({
      uFade: { value: 0 },
      uGlow: { value: 2.6 },
      uNoise: { value: 1 },
      uColor: { value: new Color('#d6ffff') },
    }),
    vertexShader: UV_VERTEX,
    fragmentShader: BEAM_FRAGMENT,
  });
  /** @param {{fade:number, color:string}} s */
  material.userData.sync = (s) => {
    const c = settings[ID];
    const g = settings.global;
    const u = material.uniforms;
    u.uFade.value = s.fade * g.opacity;
    u.uGlow.value = c.beamGlow * g.glow;
    u.uNoise.value = c.beamNoise * g.noiseStrength;
    u.uColor.value.copy(getColor(s.color));
  };
  return material;
}

const RING_FRAGMENT = /* glsl */ `
  precision highp float;
  uniform float uTime;
  uniform float uGlobalGlow;
  uniform float uFade;
  uniform float uGlow;
  uniform float uDash;
  uniform vec3  uColor;
  varying vec2 vUv;

  void main() {
    float band = 1.0 - abs(vUv.y * 2.0 - 1.0);
    float soft = smoothstep(0.0, 0.55, band);
    float dash = 0.6 + 0.4 * sin(vUv.x * 6.2831853 * uDash + uTime * 5.0);
    float alpha = soft * dash * uFade;
    if (alpha < 0.003) discard;
    gl_FragColor = vec4(uColor * uGlow * uGlobalGlow * (0.8 + 0.7 * band), alpha);
  }
`;

/** The halo and the arrival reticle share this; each owns its own instance. */
export function createRingMaterial(dashes = 12) {
  const material = new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: DoubleSide,
    blending: AdditiveBlending,
    toneMapped: false,
    uniforms: sharedUniforms({
      uFade: { value: 1 },
      uGlow: { value: 1.6 },
      uDash: { value: dashes },
      uColor: { value: new Color('#d6ffff') },
    }),
    vertexShader: UV_VERTEX,
    fragmentShader: RING_FRAGMENT,
  });
  /** @param {{fade:number, color:string, glow:number}} s */
  material.userData.sync = (s) => {
    const g = settings.global;
    const u = material.uniforms;
    u.uFade.value = s.fade * g.opacity;
    u.uGlow.value = s.glow * g.glow;
    u.uColor.value.copy(getColor(s.color));
  };
  return material;
}

const SEED_VERTEX = /* glsl */ `
  varying vec3 vNormalW;
  varying vec3 vView;
  varying vec2 vUv;
  void main() {
    vUv = uv;
    vec4 world = modelMatrix * vec4(position, 1.0);
    vNormalW = normalize(mat3(modelMatrix) * normal);
    vView = cameraPosition - world.xyz;
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;

const SEED_FRAGMENT = /* glsl */ `
  precision highp float;
  uniform float uTime;
  uniform float uGlobalGlow;
  uniform float uFade;
  uniform float uGlow;
  uniform vec3  uColor;
  uniform vec3  uHot;
  varying vec3 vNormalW;
  varying vec3 vView;
  varying vec2 vUv;

  void main() {
    float f = pow(1.0 - abs(dot(normalize(vNormalW), normalize(vView))), 2.0);
    float bands = pow(0.5 + 0.5 * sin(vUv.y * 30.0 - uTime * 14.0), 4.0);
    vec3 color = mix(uColor, uHot, f) * (0.6 + f * 1.6 + bands * 0.6) * uGlow * uGlobalGlow;
    gl_FragColor = vec4(color, (0.45 + 0.55 * f) * uFade);
  }
`;

export function createSeedMaterial() {
  const material = new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: DoubleSide,
    blending: AdditiveBlending,
    toneMapped: false,
    uniforms: sharedUniforms({
      uFade: { value: 1 },
      uGlow: { value: 2.2 },
      uColor: { value: new Color('#7ff0ff') },
      uHot: { value: new Color('#ffffff') },
    }),
    vertexShader: SEED_VERTEX,
    fragmentShader: SEED_FRAGMENT,
  });
  /** @param {{fade:number}} s */
  material.userData.sync = (s) => {
    const c = settings[ID];
    const g = settings.global;
    const u = material.uniforms;
    u.uFade.value = s.fade * g.opacity;
    u.uGlow.value = c.seedGlow * g.glow;
    u.uColor.value.copy(getColor(c.coreColor));
    u.uHot.value.copy(getColor(c.beamColor));
  };
  return material;
}

/* ==================================================================== */
/* Distortion proxy — LAYER.DISTORTION                                    */
/* ==================================================================== */

const WARP_VERTEX = /* glsl */ `
  uniform float uWidth;
  uniform float uHeight;
  varying vec2 vUv;
  varying vec3 vWorld;

  void main() {
    vUv = uv;
    // Camera-facing: offset in view space from the object's origin.
    vec4 mv = modelViewMatrix * vec4(0.0, 0.0, 0.0, 1.0);
    mv.xy += position.xy * vec2(uWidth, uHeight);
    vWorld = (modelMatrix * vec4(position.x * uWidth, position.y * uHeight, 0.0, 1.0)).xyz;
    gl_Position = projectionMatrix * mv;
  }
`;

const WARP_FRAGMENT = /* glsl */ `
  uniform float uTime;
  uniform float uShaderIntensity;
  uniform float uStrength;
  uniform float uScale;
  uniform float uSpeed;
  varying vec2 vUv;
  varying vec3 vWorld;

  ${noiseGLSL}

  void main() {
    // Rising heat: noise scrolled upward, welded to world space so it does
    // not slide with the camera.
    vec3 np = vec3(vWorld.xz * uScale, vWorld.y * uScale * 0.6 - uTime * uSpeed);
    float nx = snoise(np);
    float ny = snoise(np + vec3(17.1, 5.3, 29.7));
    vec2 c = vUv * 2.0 - 1.0;
    float mask = (1.0 - smoothstep(0.3, 1.0, abs(c.x)))
               * smoothstep(0.0, 0.2, vUv.y) * (1.0 - smoothstep(0.55, 1.0, vUv.y));
    float strength = uStrength * uShaderIntensity * mask;
    if (strength < 0.002) discard;
    gl_FragColor = vec4(vec2(nx, ny) * 0.5 + 0.5, strength, mask);
  }
`;

export function createWarpMaterial() {
  const material = new ShaderMaterial({
    // Not `transparent`: the expansion contract keeps every transparent mesh
    // on LAYER.VFX, and this proxy lives on LAYER.DISTORTION. Custom
    // SrcAlpha / OneMinusSrcAlpha blending is exactly the normal blend the
    // acid-fume proxy relies on, so the offset buffer still composites.
    transparent: false,
    depthWrite: false,
    depthTest: false,
    blending: CustomBlending,
    blendEquation: AddEquation,
    blendSrc: SrcAlphaFactor,
    blendDst: OneMinusSrcAlphaFactor,
    side: DoubleSide,
    toneMapped: false,
    uniforms: sharedUniforms({
      uWidth: { value: 1.6 },
      uHeight: { value: 2.4 },
      uStrength: { value: 0 },
      uScale: { value: 2.2 },
      uSpeed: { value: 1.4 },
    }),
    vertexShader: WARP_VERTEX,
    fragmentShader: WARP_FRAGMENT,
  });
  /** @param {{strength:number}} s */
  material.userData.sync = (s) => {
    const c = settings[ID];
    const g = settings.global;
    const u = material.uniforms;
    u.uWidth.value = c.warpWidth;
    u.uHeight.value = c.warpHeight;
    u.uStrength.value = s.strength * g.distortion;
    u.uScale.value = c.warpScale * g.noiseFrequency;
    u.uSpeed.value = c.warpSpeed * g.noiseSpeed;
  };
  return material;
}
