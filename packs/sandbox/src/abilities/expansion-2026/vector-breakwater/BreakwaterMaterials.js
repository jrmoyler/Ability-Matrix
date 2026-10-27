import { AdditiveBlending, Color, DoubleSide, AddEquation, CustomBlending, OneMinusSrcAlphaFactor, SrcAlphaFactor, ShaderMaterial, Vector3 } from 'three';
import { noiseGLSL } from '../../../shaders/lib/noise.glsl.js';
import { commonGLSL } from '../../../shaders/lib/common.glsl.js';
import { sharedUniforms } from '../../../core/FrameUniforms.js';
import { settings } from '../../../config/settings.js';
import { getColor } from '../../../utils/color.js';
import config from './config.js';

/**
 * Vector Breakwater — every material the cast draws with.
 *
 * Each factory returns a `ShaderMaterial` with hand-written GLSL and a
 * `userData.sync(state)` that reads `settings.vectorBreakwater` and the
 * globals into uniforms every frame. Per-front materials are separate
 * instances so each front can tear apart on its own schedule.
 *
 *  - **front** — the shield sheet. Voronoi pressure cells drifting up it,
 *    slash lines racing across, a hot leading rim, bright tapered sides and a
 *    fresnel edge; near the end of the lane a noise dissolve (`dissolveMask`)
 *    tears it apart from the crest with a burning edge — the front breaks
 *    rather than vanishing.
 *  - **rib** — the internal splines, with pulses climbing them.
 *  - **fin** — instanced pressure fins; tip-hot, alpha by instance scale.
 *  - **contact** — the pressure petals at a struck body, noise-streaked.
 *  - **wake** — the breaking crest at the end of the lane, foam-noise broken.
 *  - **corridor** — the ground: scour gouges, a fresh hot band just behind
 *    each front (their positions arrive as one `vec3`), edge lines.
 *  - **brace** — three chevrons at the caster, each flared as its front leaves.
 *  - **warp** — a vertical sheet on `LAYER.DISTORTION` riding each front.
 */

const ID = config.id;

/* ==================================================================== */
/* The shield front                                                       */
/* ==================================================================== */

const FRONT_VERTEX = /* glsl */ `
  uniform float uTime;
  uniform float uShimmer;
  uniform float uSpent;
  uniform float uSeed;
  uniform float uNoiseStrength;

  varying vec2 vUv;
  varying vec3 vNormalW;
  varying vec3 vView;

  ${noiseGLSL}

  void main() {
    vUv = uv;
    vec3 p = position;
    // The sheet quivers: a travelling ripple plus a slow noise bowing,
    // both strongest at the crest so the foot stays planted.
    p.z += sin(uv.x * 19.0 + uShimmer) * 0.008 * uv.y;
    p.z += snoise(vec3(uv * vec2(3.0, 2.0), uTime * 1.5 + uSeed)) * 0.025 * uv.y * uNoiseStrength;
    // As it breaks, the crest curls forward over the foot.
    p.z += uSpent * uSpent * 0.3 * uv.y * uv.y;
    vec4 world = modelMatrix * vec4(p, 1.0);
    vNormalW = normalize(mat3(modelMatrix) * normal);
    vView = cameraPosition - world.xyz;
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;

const FRONT_FRAGMENT = /* glsl */ `
  precision highp float;

  uniform float uTime;
  uniform float uShimmer;
  uniform float uFade;
  uniform float uSpent;
  uniform float uSeed;
  uniform float uGlow;
  uniform float uOpacity;
  uniform float uNoise;
  uniform float uNoiseScale;
  uniform float uRim;
  uniform float uFresnel;
  uniform vec3  uEdge;
  uniform vec3  uBody;
  uniform float uGlobalGlow;
  uniform float uShaderIntensity;

  varying vec2 vUv;
  varying vec3 vNormalW;
  varying vec3 vView;

  ${noiseGLSL}
  ${commonGLSL}

  void main() {
    float side = pow(abs(vUv.x * 2.0 - 1.0), 6.0);
    float rim = exp(-abs(vUv.y - 0.93) * 35.0) * uRim;
    float slash = pow(max(0.0, cos(vUv.x * 33.0 - vUv.y * 17.0 - uShimmer)), 16.0);
    // Pressure cells drift up the sheet: bright where cells meet.
    vec2 vor = voronoi2(vec2(vUv.x * uNoiseScale * 4.0, vUv.y * uNoiseScale * 1.6 - uTime * 0.8 + uSeed));
    float cells = smoothstep(0.35, 0.8, vor.x) * (0.6 + 0.4 * vor.y);
    float fres = fresnelTerm(vView, vNormalW, 2.0, uFresnel);
    float ends = smoothstep(0.0, 0.08, vUv.y) * (1.0 - smoothstep(0.93, 1.0, vUv.y));

    // The break: noise dissolve from the crest down, with a burning edge.
    float tear = snoise01(vec3(vUv * vec2(6.0, 3.0), uSeed + uTime * 0.6)) * 0.75 + (1.0 - vUv.y) * 0.25;
    vec2 cut = dissolveMask(tear, uSpent * 1.05, 0.08);
    if (cut.x < 0.5 && cut.y < 0.01) discard;

    float heat = clamp(rim + side + cut.y * 2.0, 0.0, 1.0);
    float alpha = (rim * 0.8 + side * 0.45 + slash * 0.28 + cells * uNoise * 0.35 * uShaderIntensity + fres * 0.25 + 0.1)
                * ends * uFade * uOpacity * max(cut.x, cut.y);
    if (alpha < 0.003) discard;
    vec3 color = mix(uBody, uEdge, heat) * uGlow * uGlobalGlow;
    gl_FragColor = vec4(color, alpha);
  }
`;

export function createFrontMaterial(seed = 0) {
  const material = new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: DoubleSide,
    blending: AdditiveBlending,
    toneMapped: false,
    uniforms: sharedUniforms({
      uShimmer: { value: 0 },
      uFade: { value: 1 },
      uSpent: { value: 0 },
      uSeed: { value: seed },
      uNoiseStrength: { value: 1 },
      uGlow: { value: 2 },
      uOpacity: { value: 1 },
      uNoise: { value: 0.6 },
      uNoiseScale: { value: 3 },
      uRim: { value: 0.8 },
      uFresnel: { value: 1 },
      uEdge: { value: new Color('#fff0dd') },
      uBody: { value: new Color('#d16f56') },
    }),
    vertexShader: FRONT_VERTEX,
    fragmentShader: FRONT_FRAGMENT,
  });
  /** @param {{fade:number, spent:number, shimmer:number}} s */
  material.userData.sync = (s) => {
    const c = settings[ID];
    const g = settings.global;
    const u = material.uniforms;
    u.uShimmer.value = s.shimmer;
    u.uFade.value = s.fade;
    u.uSpent.value = s.spent;
    u.uNoiseStrength.value = g.noiseStrength;
    u.uGlow.value = c.frontGlow * g.glow;
    u.uOpacity.value = c.frontOpacity * g.opacity;
    u.uNoise.value = c.frontNoise * g.noiseStrength;
    u.uNoiseScale.value = c.frontNoiseScale * g.noiseFrequency;
    u.uRim.value = c.frontRim;
    u.uFresnel.value = g.fresnel;
    u.uEdge.value.copy(getColor(c.edgeColor));
    u.uBody.value.copy(getColor(c.bodyColor));
  };
  return material;
}

/* ==================================================================== */
/* Ribs and fins                                                          */
/* ==================================================================== */

const RIB_VERTEX = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const RIB_FRAGMENT = /* glsl */ `
  precision highp float;
  uniform float uTime;
  uniform float uFade;
  uniform float uGlow;
  uniform float uOpacity;
  uniform vec3  uColor;
  uniform float uGlobalGlow;
  varying vec2 vUv;
  void main() {
    // A pulse climbs each spline as the front drives forward.
    float pulse = pow(0.5 + 0.5 * sin(vUv.y * 18.0 - uTime * 14.0), 6.0);
    float across = 1.0 - abs(vUv.x * 2.0 - 1.0);
    float alpha = (0.55 + 0.45 * pulse) * (0.5 + 0.5 * across) * uFade * uOpacity;
    gl_FragColor = vec4(uColor * uGlow * uGlobalGlow * (0.8 + pulse), alpha);
  }
`;

export function createRibMaterial() {
  const material = new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: DoubleSide,
    blending: AdditiveBlending,
    toneMapped: false,
    uniforms: sharedUniforms({
      uFade: { value: 1 },
      uGlow: { value: 1.4 },
      uOpacity: { value: 0.7 },
      uColor: { value: new Color('#ffe8cf') },
    }),
    vertexShader: RIB_VERTEX,
    fragmentShader: RIB_FRAGMENT,
  });
  /** @param {{fade:number}} s */
  material.userData.sync = (s) => {
    const c = settings[ID];
    const g = settings.global;
    const u = material.uniforms;
    u.uFade.value = s.fade;
    u.uGlow.value = c.ribGlow * g.glow;
    u.uOpacity.value = c.ribOpacity * g.opacity;
    u.uColor.value.copy(getColor(c.edgeColor));
  };
  return material;
}

const FIN_VERTEX = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vNormalW;
  varying vec3 vView;
  void main() {
    vUv = uv;
    vec4 local = vec4(position, 1.0);
    vec3 n = normal;
    #ifdef USE_INSTANCING
      local = instanceMatrix * local;
      n = mat3(instanceMatrix) * n;
    #endif
    vec4 world = modelMatrix * local;
    vNormalW = normalize(mat3(modelMatrix) * n);
    vView = cameraPosition - world.xyz;
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;

const FIN_FRAGMENT = /* glsl */ `
  precision highp float;
  uniform float uFade;
  uniform float uGlow;
  uniform vec3  uColor;
  uniform vec3  uBody;
  uniform float uGlobalGlow;
  varying vec2 vUv;
  varying vec3 vNormalW;
  varying vec3 vView;
  void main() {
    float f = pow(1.0 - abs(dot(normalize(vNormalW), normalize(vView))), 1.5);
    float tip = vUv.y;
    vec3 color = mix(uBody, uColor, tip * 0.7 + f * 0.3) * uGlow * uGlobalGlow * (0.7 + tip);
    gl_FragColor = vec4(color, (0.35 + 0.65 * f) * uFade);
  }
`;

export function createFinMaterial() {
  const material = new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: DoubleSide,
    blending: AdditiveBlending,
    toneMapped: false,
    uniforms: sharedUniforms({
      uFade: { value: 1 },
      uGlow: { value: 1.6 },
      uColor: { value: new Color('#fff0dd') },
      uBody: { value: new Color('#d16f56') },
    }),
    vertexShader: FIN_VERTEX,
    fragmentShader: FIN_FRAGMENT,
  });
  /** @param {{fade:number}} s */
  material.userData.sync = (s) => {
    const c = settings[ID];
    const g = settings.global;
    const u = material.uniforms;
    u.uFade.value = s.fade * g.opacity;
    u.uGlow.value = c.finGlow * g.glow;
    u.uColor.value.copy(getColor(c.edgeColor));
    u.uBody.value.copy(getColor(c.bodyColor));
  };
  return material;
}

/* ==================================================================== */
/* Contact petals and wake crest                                          */
/* ==================================================================== */

const FLAT_VERTEX = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vWorld;
  void main() {
    vUv = uv;
    vec4 world = modelMatrix * vec4(position, 1.0);
    vWorld = world.xyz;
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;

const CONTACT_FRAGMENT = /* glsl */ `
  precision highp float;
  uniform float uTime;
  uniform vec3  color;
  uniform float fade;
  uniform float uGlow;
  uniform float uGlobalGlow;
  varying vec2 vUv;
  varying vec3 vWorld;

  ${noiseGLSL}

  void main() {
    float tip = 1.0 - vUv.x;
    // Streaks run root → tip, so the petals read as thrown, not printed.
    float streak = snoise01(vec3(vWorld.xz * 7.0, uTime * 4.0));
    float alpha = (0.25 + 0.75 * tip) * (0.6 + 0.6 * streak) * fade;
    if (alpha < 0.003) discard;
    gl_FragColor = vec4(color * uGlow * uGlobalGlow * (0.8 + tip), alpha);
  }
`;

/** Uniform names `color` / `fade` are kept from the candidate's contact cue. */
export function createContactMaterial() {
  const material = new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: DoubleSide,
    blending: AdditiveBlending,
    toneMapped: false,
    uniforms: sharedUniforms({
      color: { value: new Color('#fff0dd') },
      fade: { value: 0 },
      uGlow: { value: 1.6 },
    }),
    vertexShader: FLAT_VERTEX,
    fragmentShader: CONTACT_FRAGMENT,
  });
  /** @param {{fade:number}} s */
  material.userData.sync = (s) => {
    const c = settings[ID];
    const g = settings.global;
    const u = material.uniforms;
    u.color.value.copy(getColor(c.edgeColor));
    u.fade.value = s.fade * g.opacity;
    u.uGlow.value = 1.6 * g.glow;
  };
  return material;
}

const WAKE_FRAGMENT = /* glsl */ `
  precision highp float;
  uniform float uTime;
  uniform float uFade;
  uniform float uSeed;
  uniform float uGlow;
  uniform vec3  uColor;
  uniform vec3  uBody;
  uniform float uGlobalGlow;
  varying vec2 vUv;
  varying vec3 vWorld;

  ${noiseGLSL}

  void main() {
    // Brightest on the standing crest (uv.y 0.6), feathered both sides.
    float crest = exp(-pow((vUv.y - 0.6) * 4.0, 2.0));
    // Foam: the crest breaks into ridged noise round its length.
    float foam = ridged(vec3(vUv.x * 24.0, vUv.y * 3.0, uTime * 1.5 + uSeed), 3);
    float alpha = crest * (0.4 + 0.8 * foam) * uFade;
    if (alpha < 0.003) discard;
    vec3 color = mix(uBody, uColor, crest) * uGlow * uGlobalGlow;
    gl_FragColor = vec4(color, alpha);
  }
`;

export function createWakeMaterial(seed = 0) {
  const material = new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: DoubleSide,
    blending: AdditiveBlending,
    toneMapped: false,
    uniforms: sharedUniforms({
      uFade: { value: 0 },
      uSeed: { value: seed },
      uGlow: { value: 1.6 },
      uColor: { value: new Color('#ffe8cf') },
      uBody: { value: new Color('#d16f56') },
    }),
    vertexShader: FLAT_VERTEX,
    fragmentShader: WAKE_FRAGMENT,
  });
  /** @param {{fade:number}} s */
  material.userData.sync = (s) => {
    const c = settings[ID];
    const g = settings.global;
    const u = material.uniforms;
    u.uFade.value = s.fade * c.wakeOpacity * g.opacity;
    u.uGlow.value = 1.6 * g.glow;
    u.uColor.value.copy(getColor(c.edgeColor));
    u.uBody.value.copy(getColor(c.bodyColor));
  };
  return material;
}

/* ==================================================================== */
/* Corridor scour                                                         */
/* ==================================================================== */

const CORRIDOR_FRAGMENT = /* glsl */ `
  precision highp float;
  uniform float uTime;
  uniform float uFade;
  uniform float uGlow;
  uniform float uOpacity;
  uniform float uLength;      // metres
  uniform float uWidth;       // corridor half-width, metres
  uniform float uScour;       // fresh-scour length behind a front, × width
  uniform vec3  uFronts;      // each front's distance along the lane, metres (−1: not launched)
  uniform vec3  uColor;
  uniform float uNoise;
  uniform float uGlobalGlow;
  uniform float uShaderIntensity;
  varying vec2 vUv;
  varying vec3 vWorld;

  ${noiseGLSL}

  /** Fresh band just behind one front; nothing ahead of it. */
  float fresh(float along, float front) {
    if (front < 0.0) return 0.0;
    float behind = front - along;
    float reach = max(uScour * uWidth, 0.05);
    return step(0.0, behind) * exp(-behind / reach);
  }

  void main() {
    float along = vUv.y * uLength;
    float across = abs(vUv.x * 2.0 - 1.0);
    // Only ground the fronts have actually passed is scoured.
    float reached = max(max(uFronts.x, uFronts.y), uFronts.z);
    float passed = step(along, reached);

    float edge = exp(-abs(across - 0.9) * 40.0);
    // Gouges dragged along the lane by the fronts' feet: stretched noise.
    float gouge = ridged(vec3(vUv.x * 18.0, along * 0.35, 1.7), 3);
    gouge = smoothstep(0.55, 0.95, gouge) * uNoise * uShaderIntensity;
    float bands = pow(max(0.0, cos(along * 3.0 - uTime * 7.0)), 20.0) * 0.18;
    float hot = fresh(along, uFronts.x) + fresh(along, uFronts.y) + fresh(along, uFronts.z);

    float alpha = (edge * 0.35 + gouge * 0.35 + bands + hot * 0.55 * (1.0 - across * 0.6)) * passed
                * (1.0 - smoothstep(0.92, 1.0, across)) * uFade * uOpacity;
    if (alpha < 0.003) discard;
    gl_FragColor = vec4(uColor * uGlow * uGlobalGlow * (1.0 + hot), alpha);
  }
`;

export function createCorridorMaterial() {
  const material = new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: DoubleSide,
    blending: AdditiveBlending,
    toneMapped: false,
    uniforms: sharedUniforms({
      uFade: { value: 1 },
      uGlow: { value: 1.5 },
      uOpacity: { value: 1 },
      uLength: { value: 10 },
      uWidth: { value: 2.2 },
      uScour: { value: 0.45 },
      uFronts: { value: new Vector3(-1, -1, -1) },
      uColor: { value: new Color('#ff9e76') },
      uNoise: { value: 1 },
    }),
    vertexShader: FLAT_VERTEX,
    fragmentShader: CORRIDOR_FRAGMENT,
  });
  /** @param {{fade:number, length:number, f0:number, f1:number, f2:number}} s */
  material.userData.sync = (s) => {
    const c = settings[ID];
    const g = settings.global;
    const u = material.uniforms;
    u.uFade.value = s.fade;
    u.uGlow.value = c.groundGlow * g.glow;
    u.uOpacity.value = c.groundOpacity * g.opacity;
    u.uLength.value = s.length;
    u.uWidth.value = c.width;
    u.uScour.value = c.scourWidth;
    u.uFronts.value.set(s.f0, s.f1, s.f2);
    u.uColor.value.copy(getColor(c.groundColor));
    u.uNoise.value = g.noiseStrength;
  };
  return material;
}

/* ==================================================================== */
/* Brace                                                                  */
/* ==================================================================== */

const BRACE_FRAGMENT = /* glsl */ `
  precision highp float;
  uniform vec3  uHeat;        // flare of chevron 0, 1, 2
  uniform float uFade;
  uniform float uGlow;
  uniform vec3  uColor;
  uniform vec3  uBody;
  uniform float uGlobalGlow;
  varying vec2 vUv;
  varying vec3 vWorld;
  void main() {
    float id = vUv.x * 2.0;
    float heat = id < 0.5 ? uHeat.x : (id < 1.5 ? uHeat.y : uHeat.z);
    // Hot at the tip, cooling down each arm.
    float tip = 1.0 - vUv.y;
    float alpha = (0.18 + heat * (0.5 + 0.5 * tip)) * uFade;
    if (alpha < 0.003) discard;
    gl_FragColor = vec4(mix(uBody, uColor, heat) * uGlow * uGlobalGlow * (0.6 + heat), alpha);
  }
`;

export function createBraceMaterial() {
  const material = new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: DoubleSide,
    blending: AdditiveBlending,
    toneMapped: false,
    uniforms: sharedUniforms({
      uHeat: { value: new Vector3() },
      uFade: { value: 1 },
      uGlow: { value: 2.5 },
      uColor: { value: new Color('#fff0dd') },
      uBody: { value: new Color('#d16f56') },
    }),
    vertexShader: FLAT_VERTEX,
    fragmentShader: BRACE_FRAGMENT,
  });
  /** @param {{fade:number, h0:number, h1:number, h2:number}} s */
  material.userData.sync = (s) => {
    const c = settings[ID];
    const g = settings.global;
    const u = material.uniforms;
    u.uHeat.value.set(s.h0, s.h1, s.h2);
    u.uFade.value = s.fade * g.opacity;
    u.uGlow.value = c.braceGlow * g.glow;
    u.uColor.value.copy(getColor(c.edgeColor));
    u.uBody.value.copy(getColor(c.bodyColor));
  };
  return material;
}

/* ==================================================================== */
/* Distortion — LAYER.DISTORTION                                          */
/* ==================================================================== */

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
    vec3 np = vec3(vWorld.xz * uScale, vWorld.y * uScale * 0.5 - uTime * uSpeed);
    float nx = snoise(np);
    float ny = snoise(np + vec3(11.7, 3.1, 23.9));
    vec2 c = vUv * 2.0 - 1.0;
    // Strongest at the foot of the front, feathered to the tips and crest.
    float mask = (1.0 - smoothstep(0.4, 1.0, abs(c.x))) * smoothstep(0.0, 0.1, vUv.y)
               * (1.0 - smoothstep(0.3, 1.0, vUv.y));
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
      uStrength: { value: 0 },
      uScale: { value: 2.5 },
      uSpeed: { value: 2 },
    }),
    vertexShader: FLAT_VERTEX,
    fragmentShader: WARP_FRAGMENT,
  });
  /** @param {{strength:number}} s */
  material.userData.sync = (s) => {
    const c = settings[ID];
    const g = settings.global;
    const u = material.uniforms;
    u.uStrength.value = s.strength * c.warpStrength * g.distortion;
    u.uScale.value = c.warpScale * g.noiseFrequency;
    u.uSpeed.value = c.warpSpeed * g.noiseSpeed;
  };
  return material;
}
