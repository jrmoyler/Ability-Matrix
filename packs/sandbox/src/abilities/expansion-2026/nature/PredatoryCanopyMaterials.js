import { AdditiveBlending, Color, DoubleSide, NormalBlending, ShaderMaterial, Vector3 } from 'three';
import { noiseGLSL } from '../../../shaders/lib/noise.glsl.js';
import { commonGLSL } from '../../../shaders/lib/common.glsl.js';
import { sharedUniforms } from '../../../core/FrameUniforms.js';
import { settings } from '../../../config/settings.js';

/**
 * Materials for PREDATORY CANOPY — one factory per layer.
 *
 * Like the rest of the expansion casts, every material owns its own `uTime`
 * box: the ability writes the cast's visual clock into it and holds it at zero
 * under `prefers-reduced-motion`, so the trap still arms and strikes while the
 * foliage stands still. Global depth/light/glow uniforms come from
 * `sharedUniforms`.
 *
 * Two kinds of surface live here:
 *
 *   - **lit** — bark and leaves. They are the *body* of the trap and must sit
 *     in the scene with weight, so they shade off `uLightDir` (the sun the
 *     lit meshes use) with a wrap term, rather than glowing. They dissolve
 *     with a noise threshold and a burning edge when the canopy withers.
 *   - **emissive** — the root sigil on the floor, the strike vines' veins and
 *     the seed pod. `toneMapped: false`, additive, so bloom carries the
 *     warning the player has to read.
 */

const g = () => settings.global;

/* ------------------------------------------------------------------ */
/* 1 · Bark — branches, vines, thorns, crown                           */
/* ------------------------------------------------------------------ */

const BARK_VERTEX = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vNormalW;
  varying vec3 vWorld;
  void main() {
    vUv = uv;
    vec4 world = modelMatrix * vec4(position, 1.0);
    vWorld = world.xyz;
    vNormalW = normalize(mat3(modelMatrix) * normal);
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;

const BARK_FRAGMENT = /* glsl */ `
  uniform float uTime;
  uniform float uFade;
  uniform float uDissolve;
  uniform float uWake;       // 0..1: the trap is triggered — veins flush
  uniform float uRidge;
  uniform float uMoss;
  uniform vec3  uColor;
  uniform vec3  uMossColor;
  uniform vec3  uVein;
  uniform vec3  uLightDir;
  uniform float uGlobalGlow;
  uniform float uShaderIntensity;
  varying vec2 vUv;
  varying vec3 vNormalW;
  varying vec3 vWorld;

  ${noiseGLSL}
  ${commonGLSL}

  void main() {
    // Ridged bark furrows run along the wood (uv.y), twisted a little.
    float furrow = ridged(vec3(vUv.x * 6.0 + vUv.y * 1.5, vUv.y * 22.0, 0.0) * uRidge, 4);
    float grain = fbm3(vWorld * 3.0);
    vec3 n = normalize(vNormalW);
    // Wrap lighting: bark facing away from the sun is still readable.
    float lambert = clamp((dot(n, normalize(uLightDir)) + 0.45) / 1.45, 0.0, 1.0);
    // Moss collects on the upward faces.
    float moss = smoothstep(0.25, 0.85, n.y + grain * 0.4) * uMoss;
    vec3 base = uColor * (0.55 + 0.45 * furrow) * (0.85 + 0.3 * grain);
    vec3 col = mix(base, uMossColor, moss) * (0.35 + 0.75 * lambert);
    // When the trap wakes, sap glows up the furrows.
    float vein = smoothstep(0.75, 0.95, furrow) * uWake * (0.6 + 0.4 * sin(vUv.y * 30.0 - uTime * 6.0));
    col += uVein * vein * 1.6 * uGlobalGlow * uShaderIntensity;
    // Withering: a noise threshold eats the wood, leaving a glowing rim.
    float burn = 0.0;
    if (uDissolve > 0.0) {
      float k = snoise01(vWorld * 2.2) - uDissolve;
      if (k < 0.0) discard;
      burn = 1.0 - smoothstep(0.0, 0.08, k);
    }
    col += uVein * burn * 2.0;
    gl_FragColor = vec4(col, uFade);
  }
`;

/** Lit, ridged, mossy bark that flushes with sap and withers away. */
export function createBarkMaterial() {
  const material = new ShaderMaterial({
    transparent: true,
    depthWrite: true,
    side: DoubleSide,
    uniforms: sharedUniforms({
      uTime: { value: 0 },
      uFade: { value: 1 },
      uDissolve: { value: 0 },
      uWake: { value: 0 },
      uRidge: { value: 1 },
      uMoss: { value: 0.6 },
      uColor: { value: new Color('#365423') },
      uMossColor: { value: new Color('#5f8a2e') },
      uVein: { value: new Color('#a9eb6a') }
    }),
    vertexShader: BARK_VERTEX,
    fragmentShader: BARK_FRAGMENT
  });
  material.userData.sync = (c) => {
    const u = material.uniforms;
    u.uColor.value.set(c.barkColor);
    u.uMossColor.value.set(c.mossColor ?? c.leafColor);
    u.uVein.value.set(c.rootColor);
    u.uRidge.value = (c.barkRidge ?? 1) * g().noiseFrequency;
    u.uMoss.value = c.barkMoss ?? 0.6;
  };
  return material;
}

/* ------------------------------------------------------------------ */
/* 2 · Leaves                                                          */
/* ------------------------------------------------------------------ */

const LEAF_VERTEX = /* glsl */ `
  uniform float uTime;
  uniform float uFlutter;
  uniform float uBristle;
  varying vec2 vUv;
  varying vec3 vNormalW;
  varying vec3 vViewW;
  varying vec3 vWorld;
  void main() {
    vUv = uv;
    vec3 p = position;
    // Leaves bend from the stem: displacement grows with uv.y. When the trap
    // triggers they bristle — curl hard toward their own normal.
    p.z += sin(uTime * 2.3 + position.y * 3.8 + position.x * 7.0) * 0.045 * uv.y * uFlutter;
    p.z += uBristle * uv.y * uv.y * 0.45;
    vec4 world = modelMatrix * vec4(p, 1.0);
    vWorld = world.xyz;
    vNormalW = normalize(mat3(modelMatrix) * normal);
    vViewW = cameraPosition - world.xyz;
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;

const LEAF_FRAGMENT = /* glsl */ `
  uniform float uTime;
  uniform float uFade;
  uniform float uDissolve;
  uniform float uFresnel;
  uniform float uVariegate;
  uniform vec3  uColor;
  uniform vec3  uRim;
  uniform vec3  uLightDir;
  uniform float uGlobalGlow;
  varying vec2 vUv;
  varying vec3 vNormalW;
  varying vec3 vViewW;
  varying vec3 vWorld;

  ${noiseGLSL}
  ${commonGLSL}

  void main() {
    float mid = 1.0 - smoothstep(0.0, 0.035, abs(vUv.x - 0.5));
    float veins = pow(max(0.0, cos((vUv.y + abs(vUv.x - 0.5) * 0.65) * 55.0)), 18.0) * 0.25;
    vec3 n = normalize(vNormalW);
    // Thin leaves: light through the back face as well as off the front.
    float lit = abs(dot(n, normalize(uLightDir)));
    float rim = fresnelTerm(vViewW, n, 2.0, uFresnel);
    float blotch = fbm3(vec3(vUv * vec2(3.0, 6.0), 0.0) + vWorld * 0.3);
    vec3 col = uColor * (0.45 + 0.35 * vUv.y + 0.35 * lit) * (1.0 - uVariegate * 0.35 * blotch);
    col += uRim * (0.22 * mid + veins + 0.25 * rim) * uGlobalGlow;
    // Withering eats each leaf from its tip with a pale burn edge.
    float burn = 0.0;
    if (uDissolve > 0.0) {
      float k = snoise01(vWorld * 3.0) * 0.6 + (1.0 - vUv.y) * 0.4 - uDissolve;
      if (k < 0.0) discard;
      burn = 1.0 - smoothstep(0.0, 0.06, k);
    }
    col += uRim * burn * 1.5;
    gl_FragColor = vec4(col, uFade);
  }
`;

/** The canopy's leaves: wrap-lit, translucent, variegated, withering tip-first. */
export function createLeafMaterial() {
  const material = new ShaderMaterial({
    side: DoubleSide,
    transparent: true,
    depthWrite: false,
    uniforms: sharedUniforms({
      uTime: { value: 0 },
      uFade: { value: 1 },
      uDissolve: { value: 0 },
      uFlutter: { value: 1 },
      uBristle: { value: 0 },
      uFresnel: { value: 1 },
      uVariegate: { value: 0.5 },
      uColor: { value: new Color('#55a837') },
      uRim: { value: new Color('#d1ff82') }
    }),
    vertexShader: LEAF_VERTEX,
    fragmentShader: LEAF_FRAGMENT
  });
  material.userData.sync = (c) => {
    const u = material.uniforms;
    u.uColor.value.set(c.leafColor);
    u.uRim.value.set(c.leafRim);
    u.uFlutter.value = (c.leafFlutter ?? 1) * g().noiseStrength;
    u.uVariegate.value = c.leafVariegation ?? 0.5;
    u.uFresnel.value = g().fresnel;
  };
  return material;
}

/* ------------------------------------------------------------------ */
/* 3 · The root sigil on the floor                                     */
/* ------------------------------------------------------------------ */

const DISC_VERTEX = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const ROOT_FRAGMENT = /* glsl */ `
  uniform float uTime;
  uniform float uFade;
  uniform float uTrigger;
  uniform float uArm;
  uniform float uGlowGain;
  uniform float uRootCount;
  uniform vec3  uColor;
  uniform float uGlobalGlow;
  uniform float uShaderIntensity;
  varying vec2 vUv;

  ${noiseGLSL}

  void main() {
    vec2 p = vUv * 2.0 - 1.0;
    float r = length(p);
    float a = atan(p.y, p.x);
    // Two boundary rings: the snare's edge and an inner warning ring.
    float ring = exp(-abs(r - 0.9) * 100.0) + 0.55 * exp(-abs(r - 0.67) * 85.0);
    // Roots creep in from the rim: angular lobes wobbled by noise, grown out
    // to \`uArm\` of the radius as the trap arms.
    float wob = snoise(vec3(p * 3.0, uTime * 0.25)) * 0.6;
    float roots = pow(max(0.0, cos(a * uRootCount + sin(r * 18.0 - uTime * 1.5) + wob)), 18.0);
    roots *= smoothstep(0.15, 0.7, r) * (1.0 - smoothstep(0.92, 1.0, r));
    roots *= smoothstep(1.0 - uArm, 1.05 - uArm, 1.0 - r + 0.05);
    // Voronoi cells read as root-split soil between the rings: the far
    // edge of each cell (large F1) is the crack.
    vec2 cell = voronoi2(p * 5.0 + vec2(0.0, uTime * 0.05));
    float cracks = smoothstep(0.42, 0.6, cell.x) * smoothstep(0.3, 0.85, r) * uArm * 0.35;
    float pulse = 0.65 + 0.35 * sin(uTime * 3.0 + r * 14.0);
    // On trigger the warning ring races inward.
    float warn = exp(-abs(r - (0.9 - uTrigger * 0.75)) * 40.0) * uTrigger;
    float alpha = (ring * uArm + roots * 0.5 + cracks + warn * 1.2) * uFade * (0.32 + 0.3 * uTrigger) * pulse;
    vec3 col = uColor * uGlowGain * uGlobalGlow * (1.0 + uTrigger * 1.5);
    gl_FragColor = vec4(col, clamp(alpha * uShaderIntensity, 0.0, 1.0));
  }
`;

/** The snare drawn on the floor: rings, creeping roots, split soil, a racing warning. */
export function createRootMaterial() {
  const material = new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: DoubleSide,
    blending: AdditiveBlending,
    toneMapped: false,
    uniforms: sharedUniforms({
      uTime: { value: 0 },
      uFade: { value: 1 },
      uTrigger: { value: 0 },
      uArm: { value: 1 },
      uGlowGain: { value: 1 },
      uRootCount: { value: 12 },
      uColor: { value: new Color('#a9eb6a') }
    }),
    vertexShader: DISC_VERTEX,
    fragmentShader: ROOT_FRAGMENT
  });
  material.userData.sync = (c) => {
    const u = material.uniforms;
    u.uColor.value.set(c.rootColor);
    u.uGlowGain.value = c.rootGlow ?? 1;
    u.uRootCount.value = c.rootCount ?? 12;
  };
  return material;
}

/* ------------------------------------------------------------------ */
/* 4 · Dappled shade under the canopy                                  */
/* ------------------------------------------------------------------ */

const SHADE_FRAGMENT = /* glsl */ `
  uniform float uTime;
  uniform float uFade;
  uniform float uOpacity;
  uniform float uScale;
  uniform vec3  uColor;
  varying vec2 vUv;
  ${noiseGLSL}
  void main() {
    vec2 p = vUv * 2.0 - 1.0;
    float r = length(p);
    // Leaf-shadow: thresholded fbm drifting with the flutter, so sun flecks
    // move across the floor under the trap.
    float n = fbm3(vec3(p * 3.5 * uScale, uTime * 0.25));
    float shade = smoothstep(-0.05, 0.25, n);
    float edge = 1.0 - smoothstep(0.55, 1.0, r);
    gl_FragColor = vec4(uColor, shade * edge * uOpacity * uFade);
  }
`;

/** Dark, normal-blended leaf shadow: it has to *darken* the floor. */
export function createShadeMaterial() {
  const material = new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: DoubleSide,
    blending: NormalBlending,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    uniforms: {
      uTime: { value: 0 },
      uFade: { value: 0 },
      uOpacity: { value: 0.45 },
      uScale: { value: 1 },
      uColor: { value: new Color('#0d1608') }
    },
    vertexShader: DISC_VERTEX,
    fragmentShader: SHADE_FRAGMENT
  });
  material.userData.sync = (c) => {
    const u = material.uniforms;
    u.uColor.value.set(c.shadeColor ?? '#0d1608');
    u.uOpacity.value = (c.shadeOpacity ?? 0.45) * g().opacity;
    u.uScale.value = (c.shadeScale ?? 1) * g().noiseFrequency;
  };
  return material;
}

/* ------------------------------------------------------------------ */
/* 5 · Strike vines                                                    */
/* ------------------------------------------------------------------ */

const STRIKE_VERTEX = /* glsl */ `
  uniform vec3  uAnchor;
  uniform vec3  uTarget;
  uniform float uTime;
  uniform float uProgress;
  uniform float uWidth;
  uniform float uArc;
  varying vec2 vUv;
  void main() {
    vUv = uv;
    // A quadratic from the canopy anchor to the target, raised by \`uArc\` in
    // the middle; drawn only as far as the windup has grown it.
    float t = uv.y * uProgress;
    vec3 mid = (uAnchor + uTarget) * 0.5 + vec3(0.0, uArc, 0.0);
    vec3 p = (1.0 - t) * (1.0 - t) * uAnchor + 2.0 * (1.0 - t) * t * mid + t * t * uTarget;
    vec2 d = uTarget.xz - uAnchor.xz;
    vec2 side = vec2(-d.y, d.x) / max(0.001, length(d));
    float w = uWidth * sin(t * 3.14159) * (uv.x * 2.0 - 1.0);
    p.xz += side * w;
    p.y += sin(t * 12.0 - uTime * 4.0) * 0.04 * sin(t * 3.14159);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`;

const STRIKE_FRAGMENT = /* glsl */ `
  uniform float uTime;
  uniform float uFade;
  uniform float uGlowGain;
  uniform vec3  uColor;
  uniform vec3  uVein;
  uniform float uGlobalGlow;
  varying vec2 vUv;
  ${noiseGLSL}
  void main() {
    float mid = exp(-abs(vUv.x - 0.5) * 22.0);
    float vein = pow(max(0.0, cos(vUv.y * 38.0 - uTime * 2.0)), 14.0);
    // Thorny silhouette: noise notches the vine's two edges.
    float notch = snoise(vec3(vUv.y * 40.0, vUv.x * 2.0, 0.0));
    float edge = abs(vUv.x - 0.5) * 2.0;
    if (edge > 0.82 + 0.18 * notch) discard;
    vec3 col = mix(uColor, uVein * uGlowGain * uGlobalGlow, mid * 0.35 + vein * 0.4);
    gl_FragColor = vec4(col, uFade);
  }
`;

/** One of the three lashing vines. Bent on the GPU, notched with thorns. */
export function createStrikeMaterial() {
  const material = new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: DoubleSide,
    uniforms: {
      uTime: { value: 0 },
      uAnchor: { value: new Vector3() },
      uTarget: { value: new Vector3() },
      uProgress: { value: 0 },
      uWidth: { value: 0.12 },
      uArc: { value: 0.8 },
      uFade: { value: 0 },
      uGlowGain: { value: 1 },
      uGlobalGlow: sharedUniforms().uGlobalGlow,
      uColor: { value: new Color('#365423') },
      uVein: { value: new Color('#a9eb6a') }
    },
    vertexShader: STRIKE_VERTEX,
    fragmentShader: STRIKE_FRAGMENT
  });
  material.userData.sync = (c) => {
    const u = material.uniforms;
    u.uColor.value.set(c.barkColor);
    u.uVein.value.set(c.rootColor);
    u.uWidth.value = c.strikeWidth ?? 0.12;
    u.uArc.value = c.strikeArc ?? 0.8;
    u.uGlowGain.value = c.strikeGlow ?? 1;
  };
  return material;
}

/* ------------------------------------------------------------------ */
/* 6 · The seed pod                                                    */
/* ------------------------------------------------------------------ */

const BUD_VERTEX = /* glsl */ `
  uniform float uTime;
  varying vec2 vUv;
  varying vec3 vNormalV;
  varying vec3 vViewV;
  void main() {
    vUv = uv;
    // A heartbeat: the pod swells and relaxes as it flies.
    float beat = pow(max(0.0, sin(uTime * 7.0)), 8.0);
    vec3 p = position * (1.0 + beat * 0.08);
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    vNormalV = normalize(normalMatrix * normal);
    vViewV = -mv.xyz;
    gl_Position = projectionMatrix * mv;
  }
`;

const BUD_FRAGMENT = /* glsl */ `
  uniform float uTime;
  uniform float uFade;
  uniform float uGlowGain;
  uniform vec3  uColor;
  uniform vec3  uGlow;
  uniform float uGlobalGlow;
  uniform float uShaderIntensity;
  varying vec2 vUv;
  varying vec3 vNormalV;
  varying vec3 vViewV;
  ${noiseGLSL}
  ${commonGLSL}
  void main() {
    float rim = fresnelTerm(vViewV, vNormalV, 2.5, 1.0);
    // Light leaks through the seams between the pod's ribs.
    float seam = pow(abs(cos(vUv.x * 3.14159 * 8.0)), 24.0);
    float flow = snoise01(vec3(vUv.x * 4.0, vUv.y * 6.0 - uTime * 1.5, 0.0));
    vec3 col = uColor * (0.4 + 0.3 * flow) + uGlow * (rim * 1.4 + seam * (0.8 + flow)) * uGlowGain * uGlobalGlow * uShaderIntensity;
    gl_FragColor = vec4(col, uFade);
  }
`;

/** The seed pod: dark husk, light seeping from the seams and the rim. */
export function createBudMaterial() {
  const material = new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: DoubleSide,
    toneMapped: false,
    uniforms: sharedUniforms({
      uTime: { value: 0 },
      uFade: { value: 1 },
      uGlowGain: { value: 1 },
      uColor: { value: new Color('#365423') },
      uGlow: { value: new Color('#d1ff82') }
    }),
    vertexShader: BUD_VERTEX,
    fragmentShader: BUD_FRAGMENT
  });
  material.userData.sync = (c) => {
    const u = material.uniforms;
    u.uColor.value.set(c.barkColor);
    u.uGlow.value.set(c.leafRim);
    u.uGlowGain.value = c.seedGlow ?? 1;
  };
  return material;
}

/* ------------------------------------------------------------------ */
/* 7 · The snap (LAYER.DISTORTION)                                     */
/* ------------------------------------------------------------------ */

const SNAP_FRAGMENT = /* glsl */ `
  uniform float uTime;
  uniform float uStrength;
  uniform float uProgress;
  varying vec2 vUv;
  ${noiseGLSL}
  void main() {
    vec2 p = vUv * 2.0 - 1.0;
    float r = length(p);
    // A ring of bent air running out from the struck body.
    float front = exp(-abs(r - uProgress) * 9.0) * (1.0 - smoothstep(0.85, 1.0, r));
    float s = uStrength * front * (1.0 - uProgress) * (0.85 + 0.15 * snoise(vec3(p * 4.0, uTime)));
    if (s < 0.001) discard;
    vec2 dir = r < 0.001 ? vec2(0.0, 1.0) : p / r;
    gl_FragColor = vec4(dir * 0.5 + 0.5, s, front);
  }
`;

/** The air cracked by the lash. Screen-warp proxy; NormalBlending, no depth write. */
export function createSnapMaterial() {
  return new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    depthTest: false,
    side: DoubleSide,
    blending: NormalBlending,
    toneMapped: false,
    uniforms: { uTime: { value: 0 }, uStrength: { value: 0 }, uProgress: { value: 0 } },
    vertexShader: DISC_VERTEX,
    fragmentShader: SNAP_FRAGMENT
  });
}
