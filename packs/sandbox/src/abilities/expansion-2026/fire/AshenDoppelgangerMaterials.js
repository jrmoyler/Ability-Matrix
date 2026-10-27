import {
  AdditiveBlending,
  Color,
  DoubleSide,
  MeshStandardMaterial,
  NormalBlending,
  ShaderMaterial,
  Vector3
} from 'three';
import { noiseGLSL } from '../../../shaders/lib/noise.glsl.js';
import { commonGLSL } from '../../../shaders/lib/common.glsl.js';
import { sharedUniforms } from '../../../core/FrameUniforms.js';
import { settings } from '../../../config/settings.js';
import { getColor } from '../../../utils/color.js';
import { ID } from './AshenDoppelgangerConfig.js';

/**
 * Ashen Doppelganger — the bespoke shaders.
 *
 *  - **the ember crust** (`createEchoSkinMaterial`) — the fallback figure. Char
 *    grain from fbm, glowing fissures that crawl up the body (a sine band bent
 *    by simplex noise, so the cracks branch instead of striping), a fresnel rim,
 *    and a two-sided noise dissolve: the echo *condenses* feet-first out of ash
 *    while it forms and *crumbles* crown-first when it expires, with a white-hot
 *    edge on both fronts. All in body space, so the crust is welded to the
 *    walking echo rather than sliding through it.
 *  - **the rig crust** (`createRigMaterial`) — the same reading on a skinned
 *    clone of the caster. A built-in `MeshStandardMaterial` (it has to skin),
 *    patched in `onBeforeCompile` with the fissures and dissolve.
 *  - **the sigil** (`createSigilMaterial`) — the ash circle under the echo: a
 *    wavering ring, noise-broken radial cracks that brighten as the next pulse
 *    nears, and the pulse ring itself running out to the rim.
 *  - **the ember column** (`createEmberColumnMaterial`) — baked points lifted
 *    in an updraft that narrows as it rises.
 *  - **the fuse** (`createFuseMaterial`) — the smouldering path between caster
 *    and echo: hot coals where the caster has just walked, cooling to ash where
 *    the echo is about to tread.
 *  - **the heat haze** (`createHeatHazeMaterial`) — a `LAYER.DISTORTION` proxy:
 *    rising simplex shimmer above the echo, strongest at the pulse.
 *
 * Every material reads `settings['ashen-doppelganger']` in
 * `userData.sync(state)`; the ability only hands over what a cast owns
 * (its clock, its heat, how formed or crumbled it is).
 */

/* -------------------------------------------------------------------- */
/* The ember crust (fallback figure)                                    */
/* -------------------------------------------------------------------- */

const SKIN_VERTEX = /* glsl */ `
  uniform float uClock;
  uniform float uWobble;

  varying vec3 vWorld;
  varying vec3 vNormalW;
  varying vec3 vViewDir;

  void main() {
    vec3 p = position;
    // Heat shimmer: the figure sways, more towards the top of each part.
    p.x += sin(position.y * 8.0 + uClock * 3.0) * uWobble * (0.4 + position.y);
    vec4 world = modelMatrix * vec4(p, 1.0);
    vWorld = world.xyz;
    vNormalW = normalize(mat3(modelMatrix) * normal);
    vViewDir = cameraPosition - world.xyz;
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;

const SKIN_FRAGMENT = /* glsl */ `
  uniform float uClock;
  uniform float uOpacity;
  uniform float uHeat;
  uniform float uForm;       // 0..1 condensed (feet first)
  uniform float uCrumble;    // 0..1 crumbled (crown first)
  uniform float uHeight;     // body height used by both fronts (m)
  uniform float uFissureScale;
  uniform float uFissureSpeed;
  uniform float uGrain;
  uniform float uFissureGlow;
  uniform float uRimGlow;
  uniform float uBurnEdge;
  uniform float uFresnel;
  uniform vec3  uOrigin;     // the echo's feet, world
  uniform vec3  uColorCharA;
  uniform vec3  uColorCharB;
  uniform vec3  uColorFissure;
  uniform vec3  uColorRim;
  uniform vec3  uColorBurnEdge;
  uniform float uGlobalGlow;
  uniform float uShaderIntensity;

  varying vec3 vWorld;
  varying vec3 vNormalW;
  varying vec3 vViewDir;

  ${noiseGLSL}
  ${commonGLSL}

  void main() {
    vec3 q = vWorld - uOrigin;
    float h = clamp(q.y / max(uHeight, 0.05), 0.0, 1.0);

    // Two fronts share one noise so their edges are ragged the same way.
    float n = snoise01(q * 5.0 + vec3(0.0, uClock * 0.2, 0.0));
    float formKeep = uForm * 1.25 - 0.1 - h + (n - 0.5) * 0.25;
    // Crumbling eats from the crown: the keep line falls from above the head.
    float crumbleKeep = (1.15 - uCrumble * 1.3) - h + (n - 0.5) * 0.25;
    float keep = min(formKeep, crumbleKeep);
    if (keep < 0.0) discard;
    float burn = 1.0 - smoothstep(0.0, max(uBurnEdge, 1e-3), keep);

    // Char: coarse fbm grain, warmer in the hollows.
    float grain = fbm3(q * uGrain * 0.3);
    vec3 charred = mix(uColorCharA, uColorCharB, clamp(grain * 0.8 + 0.5, 0.0, 1.0));

    // Fissures: a sine band bent by noise so the cracks branch and wander.
    float bend = snoise(q * 3.0) * 1.8;
    float band = sin(q.y * uFissureScale + bend + sin(q.x * uFissureScale * 0.85) * 1.6 + uClock * uFissureSpeed);
    float fissure = pow(max(0.0, 1.0 - abs(band) * 5.0), 2.0);
    // Breathing coals inside the cracks.
    fissure *= 0.65 + 0.35 * snoise01(q * 9.0 + vec3(0.0, -uClock * 1.3, 0.0));

    float rim = fresnelTerm(vViewDir, vNormalW, 2.0, uFresnel);

    vec3 glow = uColorFissure * fissure * uFissureGlow * (1.0 + uHeat)
              + uColorRim * rim * uRimGlow * (1.0 + uHeat * 0.6)
              + uColorBurnEdge * burn * 3.0;
    vec3 col = charred + glow * uGlobalGlow * uShaderIntensity;
    float alpha = uOpacity * clamp(0.68 + rim * 0.25 + burn * 0.4, 0.0, 1.0);
    gl_FragColor = vec4(col, alpha);
  }
`;

/** The fallback echo body. Normal-blended char with an emissive crust. */
export function createEchoSkinMaterial() {
  const material = new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: DoubleSide,
    toneMapped: false,
    uniforms: sharedUniforms({
      uClock: { value: 0 },
      uOpacity: { value: 0 },
      uHeat: { value: 0 },
      uForm: { value: 1 },
      uCrumble: { value: 0 },
      uHeight: { value: 1.8 },
      uWobble: { value: 0.025 },
      uFissureScale: { value: 21 },
      uFissureSpeed: { value: 2 },
      uGrain: { value: 18 },
      uFissureGlow: { value: 1.3 },
      uRimGlow: { value: 0.42 },
      uBurnEdge: { value: 0.08 },
      uFresnel: { value: 1 },
      uOrigin: { value: new Vector3() },
      uColorCharA: { value: new Color() },
      uColorCharB: { value: new Color() },
      uColorFissure: { value: new Color() },
      uColorRim: { value: new Color() },
      uColorBurnEdge: { value: new Color() }
    }),
    vertexShader: SKIN_VERTEX,
    fragmentShader: SKIN_FRAGMENT
  });

  /**
   * @param {{clock:number, heat:number, form:number, crumble:number,
   *          origin:Vector3}} state
   * `uOpacity` is written by the ability (tests read it straight back).
   */
  material.userData.sync = (state) => {
    const c = settings[ID];
    const g = settings.global;
    const u = material.uniforms;
    u.uClock.value = state.clock;
    u.uHeat.value = state.heat * c.heatFlare;
    u.uForm.value = state.form;
    u.uCrumble.value = state.crumble;
    u.uWobble.value = c.wobble;
    u.uFissureScale.value = c.fissureScale * g.noiseFrequency;
    u.uFissureSpeed.value = c.fissureSpeed * g.noiseSpeed;
    u.uGrain.value = c.crustGrain;
    u.uFissureGlow.value = c.fissureGlow * g.glow;
    u.uRimGlow.value = c.rimGlow * g.glow;
    u.uBurnEdge.value = c.burnEdge;
    u.uFresnel.value = g.fresnel;
    u.uOrigin.value.copy(state.origin);
    u.uColorCharA.value.copy(getColor(c.colorCharA));
    u.uColorCharB.value.copy(getColor(c.colorCharB));
    u.uColorFissure.value.copy(getColor(c.colorFissure));
    u.uColorRim.value.copy(getColor(c.colorRim));
    u.uColorBurnEdge.value.copy(getColor(c.colorBurnEdge));
  };

  return material;
}

/* -------------------------------------------------------------------- */
/* The rig crust (skinned clone of the caster)                          */
/* -------------------------------------------------------------------- */

/**
 * A skinned mesh needs three's skinning chunks, so the rig keeps a built-in
 * material and has the crust patched in. `userData.ash` holds the uniform
 * boxes (shared with the compiled program by identity).
 */
export function createRigMaterial() {
  const material = new MeshStandardMaterial({
    color: 0x24100a,
    emissive: 0xb52805,
    emissiveIntensity: 1.4,
    roughness: 0.72,
    metalness: 0.08,
    transparent: true,
    opacity: 0.84,
    depthWrite: false
  });
  const ash = {
    time: { value: 0 },
    heat: { value: 0 },
    form: { value: 1 },
    crumble: { value: 0 },
    height: { value: 1.8 },
    edge: { value: 0.08 },
    fissure: { value: 23 },
    speed: { value: 2 },
    fissureColor: { value: new Color(1, 0.13, 0.015) },
    edgeColor: { value: new Color(1, 0.75, 0.44) }
  };
  material.userData.ash = ash;
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uAshTime = ash.time;
    shader.uniforms.uAshHeat = ash.heat;
    shader.uniforms.uAshForm = ash.form;
    shader.uniforms.uAshCrumble = ash.crumble;
    shader.uniforms.uAshHeight = ash.height;
    shader.uniforms.uAshEdge = ash.edge;
    shader.uniforms.uAshFissure = ash.fissure;
    shader.uniforms.uAshSpeed = ash.speed;
    shader.uniforms.uAshFissureColor = ash.fissureColor;
    shader.uniforms.uAshEdgeColor = ash.edgeColor;
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vAshWorld;')
      // After skinning: `transformed` is the posed vertex in mesh space.
      .replace(
        '#include <project_vertex>',
        '#include <project_vertex>\nvAshWorld = (modelMatrix * vec4(transformed, 1.0)).xyz;'
      );
    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>
        varying vec3 vAshWorld;
        uniform float uAshTime;
        uniform float uAshHeat;
        uniform float uAshForm;
        uniform float uAshCrumble;
        uniform float uAshHeight;
        uniform float uAshEdge;
        uniform float uAshFissure;
        uniform float uAshSpeed;
        uniform vec3 uAshFissureColor;
        uniform vec3 uAshEdgeColor;
        ${noiseGLSL}`
      )
      .replace(
        '#include <emissivemap_fragment>',
        `#include <emissivemap_fragment>
        {
          // The echo stands on y = 0; both fronts measure height off the floor.
          float ashH = clamp(vAshWorld.y / max(uAshHeight, 0.05), 0.0, 1.0);
          float ashN = snoise01(vAshWorld * 5.0);
          float ashKeep = min(uAshForm * 1.25 - 0.1 - ashH, 1.15 - uAshCrumble * 1.3 - ashH) + (ashN - 0.5) * 0.25;
          if (ashKeep < 0.0) discard;
          float ashBurn = 1.0 - smoothstep(0.0, max(uAshEdge, 1e-3), ashKeep);
          float ashSeam = pow(max(0.0, 1.0 - abs(sin(vAshWorld.y * uAshFissure + snoise(vAshWorld * 3.0) * 1.8 + uAshTime * uAshSpeed)) * 7.0), 2.0);
          totalEmissiveRadiance += uAshFissureColor * ashSeam * (1.2 + uAshHeat) + uAshEdgeColor * ashBurn * 3.0;
        }`
      );
  };
  material.customProgramCacheKey = () => 'ashen-doppelganger-rig-v2';

  /** @param {{clock:number, heat:number, form:number, crumble:number, height:number, opacity:number}} state */
  material.userData.sync = (state) => {
    const c = settings[ID];
    const g = settings.global;
    material.opacity = state.opacity;
    material.color.copy(getColor(c.colorRigBody));
    material.emissive.copy(getColor(c.colorRigEmissive));
    material.emissiveIntensity = c.rigEmissive * g.glow;
    ash.time.value = state.clock;
    ash.heat.value = state.heat * c.heatFlare;
    ash.form.value = state.form;
    ash.crumble.value = state.crumble;
    ash.height.value = state.height;
    ash.edge.value = c.burnEdge;
    ash.fissure.value = c.fissureScale * 1.1 * g.noiseFrequency;
    ash.speed.value = c.fissureSpeed * g.noiseSpeed;
    ash.fissureColor.value.copy(getColor(c.colorFissure)).multiplyScalar(c.fissureGlow * g.glow);
    ash.edgeColor.value.copy(getColor(c.colorBurnEdge));
  };

  return material;
}

/* -------------------------------------------------------------------- */
/* The sigil                                                            */
/* -------------------------------------------------------------------- */

const QUAD_VERTEX = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vWorld;

  void main() {
    vUv = uv;
    vec4 world = modelMatrix * vec4(position, 1.0);
    vWorld = world.xyz;
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;

const SIGIL_FRAGMENT = /* glsl */ `
  uniform float uClock;
  uniform float uOpacity;
  uniform float uPulse;      // 0 at the pulse, 1 when its ring has run out
  uniform float uHeat;       // 0..1 as the next pulse nears
  uniform float uGlow;
  uniform float uRing;
  uniform float uCracks;
  uniform vec3  uColor;
  uniform vec3  uColorHot;
  uniform float uGlobalGlow;
  uniform float uShaderIntensity;

  varying vec2 vUv;
  varying vec3 vWorld;

  ${noiseGLSL}

  void main() {
    vec2 p = vUv * 2.0 - 1.0;
    float r = length(p);
    float a = atan(p.y, p.x);

    // The standing circle, wavering like a heat line.
    float waver = snoise(vec3(p * 3.0, uClock * 0.6)) * 0.03;
    float ring = exp(-pow((r - uRing + waver) * 18.0, 2.0));

    // Radial cracks out from the feet, broken by noise so no two are alike.
    float spoke = pow(max(0.0, sin(a * uCracks + snoise(vec3(p * 4.0, 1.7)) * 2.0)), 14.0);
    float crackMask = smoothstep(uRing + 0.05, 0.12, r) * snoise01(vec3(p * 6.0, uClock * 0.3));
    float cracks = spoke * crackMask;

    // The pulse ring runs out from the body to the rim and dies.
    float shockR = 0.12 + uPulse * 0.82;
    float shock = exp(-pow((r - shockR) * 26.0, 2.0)) * (1.0 - uPulse);

    // A bed of ash right under the feet (dims, never brightens).
    float ash = smoothstep(0.5, 0.0, r) * (0.5 + 0.5 * fbm3(vec3(p * 5.0, 3.1)));

    float edge = 1.0 - smoothstep(0.84, 1.0, r);
    float glow = ring * (0.7 + uHeat * 0.6) + cracks * (0.35 + uHeat) + shock * 1.4;
    vec3 col = mix(uColor, uColorHot, clamp(shock + uHeat * ring * 0.5, 0.0, 1.0));
    float m = (glow + ash * 0.12) * edge * uOpacity * uShaderIntensity;
    if (m < 0.002) discard;
    gl_FragColor = vec4(col * m * uGlow * uGlobalGlow, m);
  }
`;

/** The ash circle and pulse ring under the echo. Additive. */
export function createSigilMaterial() {
  const material = new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
    toneMapped: false,
    uniforms: sharedUniforms({
      uClock: { value: 0 },
      uOpacity: { value: 0 },
      uPulse: { value: 1 },
      uHeat: { value: 0 },
      uGlow: { value: 1 },
      uRing: { value: 0.74 },
      uCracks: { value: 12 },
      uColor: { value: new Color() },
      uColorHot: { value: new Color() }
    }),
    vertexShader: QUAD_VERTEX,
    fragmentShader: SIGIL_FRAGMENT
  });

  /** @param {{clock:number, heat:number}} state — uOpacity/uPulse are the ability's */
  material.userData.sync = (state) => {
    const c = settings[ID];
    const g = settings.global;
    const u = material.uniforms;
    u.uClock.value = state.clock;
    u.uHeat.value = state.heat;
    u.uGlow.value = c.sigilGlow * g.glow;
    u.uRing.value = c.sigilRing;
    u.uCracks.value = Math.round(c.sigilCracks);
    u.uColor.value.copy(getColor(c.colorSigil));
    u.uColorHot.value.copy(getColor(c.colorSigilHot));
  };

  return material;
}

/* -------------------------------------------------------------------- */
/* The ember column                                                     */
/* -------------------------------------------------------------------- */

const EMBER_VERTEX = /* glsl */ `
  attribute float aSeed;
  uniform float uClock;
  uniform float uRate;
  uniform float uHeight;
  uniform float uSize;

  varying float vSeed;
  varying float vRise;

  ${noiseGLSL}

  void main() {
    vSeed = aSeed;
    float speed = 0.25 + aSeed * 0.6;
    float rise = fract(position.y + uClock * uRate * speed / max(uHeight, 0.1));
    vRise = rise;
    // An updraft: the column narrows and turns as it climbs.
    vec2 xz = rot2(uClock * (0.3 + aSeed * 0.4) + rise * 2.0) * position.xz;
    xz *= (1.0 - 0.45 * rise) * (0.85 + 0.15 * sin(uClock * 2.0 + aSeed * 15.0));
    vec3 p = vec3(xz.x, rise * uHeight, xz.y);
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_PointSize = clamp(uSize * (0.6 + aSeed * 0.8) * (1.0 - rise * 0.6) / max(1.0, -mv.z), 1.0, 9.0);
    gl_Position = projectionMatrix * mv;
  }
`;

const EMBER_FRAGMENT = /* glsl */ `
  uniform float uOpacity;
  uniform vec3  uColorA;
  uniform vec3  uColorB;
  uniform float uGlobalGlow;

  varying float vSeed;
  varying float vRise;

  void main() {
    float d = length(gl_PointCoord - 0.5);
    float disc = 1.0 - smoothstep(0.0, 0.5, d);
    // Fade in off the body and out at the top so the column never pops.
    float life = smoothstep(0.0, 0.12, vRise) * (1.0 - smoothstep(0.6, 1.0, vRise));
    float a = disc * life * uOpacity;
    vec3 col = mix(uColorA, uColorB, clamp(vSeed * (1.0 - vRise * 0.7), 0.0, 1.0));
    gl_FragColor = vec4(col * a * 1.6 * uGlobalGlow, a);
  }
`;

/** The baked ember column. `uOpacity` and `uRate` are written by the ability. */
export function createEmberColumnMaterial() {
  const material = new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
    toneMapped: false,
    uniforms: sharedUniforms({
      uClock: { value: 0 },
      uOpacity: { value: 0 },
      uRate: { value: 1 },
      uHeight: { value: 2.2 },
      uSize: { value: 18 },
      uColorA: { value: new Color() },
      uColorB: { value: new Color() }
    }),
    vertexShader: EMBER_VERTEX,
    fragmentShader: EMBER_FRAGMENT
  });

  /** @param {{clock:number}} state */
  material.userData.sync = (state) => {
    const c = settings[ID];
    const g = settings.global;
    const u = material.uniforms;
    u.uClock.value = state.clock;
    u.uHeight.value = c.emberHeight;
    u.uSize.value = c.emberSize * g.particleSize;
    u.uColorA.value.copy(getColor(c.colorEmberA));
    u.uColorB.value.copy(getColor(c.colorEmberB));
  };

  return material;
}

/* -------------------------------------------------------------------- */
/* The fuse                                                             */
/* -------------------------------------------------------------------- */

const FUSE_FRAGMENT = /* glsl */ `
  uniform float uClock;
  uniform float uOpacity;
  uniform float uGlow;
  uniform float uFlicker;
  uniform vec3  uColorHot;
  uniform vec3  uColorAsh;
  uniform float uGlobalGlow;
  uniform float uShaderIntensity;

  varying vec2 vUv;
  varying vec3 vWorld;

  ${noiseGLSL}

  void main() {
    float across = abs(vUv.y - 0.5) * 2.0;
    float body = 1.0 - smoothstep(0.3, 1.0, across);
    // Coals welded to the floor, so the path does not crawl as it is redrawn.
    float coals = smoothstep(0.05, 0.6, fbm3(vec3(vWorld.xz * 3.0, uClock * 0.7)) + 0.35);
    // Hot where the caster has just walked (u = 1), ash where the echo treads.
    float heat = smoothstep(0.05, 1.0, vUv.x);
    float flick = 1.0 + uFlicker * 0.35 * snoise(vec3(vWorld.xz * 1.3, uClock * 4.0));
    // Both ends feathered: no hard cap at the echo's feet or the caster's.
    float ends = smoothstep(0.0, 0.1, vUv.x) * (1.0 - smoothstep(0.88, 1.0, vUv.x));
    vec3 col = mix(uColorAsh, uColorHot * uGlow * uGlobalGlow * flick, heat * coals);
    float a = body * ends * uOpacity * (0.3 + 0.7 * coals) * uShaderIntensity;
    if (a < 0.003) discard;
    gl_FragColor = vec4(col, a);
  }
`;

/** The smouldering path. Normal-blended so the cold end reads as ash. */
export function createFuseMaterial() {
  const material = new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: NormalBlending,
    side: DoubleSide,
    toneMapped: false,
    uniforms: sharedUniforms({
      uClock: { value: 0 },
      uOpacity: { value: 0 },
      uGlow: { value: 1.4 },
      uFlicker: { value: 1 },
      uColorHot: { value: new Color() },
      uColorAsh: { value: new Color() }
    }),
    vertexShader: QUAD_VERTEX,
    fragmentShader: FUSE_FRAGMENT
  });

  /** @param {{clock:number, power:number}} state */
  material.userData.sync = (state) => {
    const c = settings[ID];
    const g = settings.global;
    const u = material.uniforms;
    u.uClock.value = state.clock;
    u.uOpacity.value = c.trailOpacity * state.power * g.opacity;
    u.uGlow.value = c.trailGlow * g.glow;
    u.uFlicker.value = c.trailFlicker;
    u.uColorHot.value.copy(getColor(c.colorTrailHot));
    u.uColorAsh.value.copy(getColor(c.colorTrailAsh));
  };

  return material;
}

/* -------------------------------------------------------------------- */
/* The heat haze (distortion proxy)                                     */
/* -------------------------------------------------------------------- */

const HAZE_VERTEX = /* glsl */ `
  uniform float uWidth;
  uniform float uHeight;

  varying vec2 vUv;
  varying vec3 vWorld;

  void main() {
    vUv = uv;
    // Camera-facing, standing on the echo's feet.
    vec4 mv = modelViewMatrix * vec4(0.0, 0.0, 0.0, 1.0);
    mv.xy += position.xy * vec2(uWidth * 2.0, uHeight);
    vWorld = (modelMatrix * vec4(position.x * uWidth * 2.0, position.y * uHeight, 0.0, 1.0)).xyz;
    gl_Position = projectionMatrix * mv;
  }
`;

const HAZE_FRAGMENT = /* glsl */ `
  uniform float uClock;
  uniform float uStrength;
  uniform float uScale;
  uniform float uSpeed;
  uniform float uShaderIntensity;

  varying vec2 vUv;
  varying vec3 vWorld;

  ${noiseGLSL}

  void main() {
    vec3 np = vec3(vWorld.xz * uScale, vWorld.y * uScale * 0.6 - uClock * uSpeed);
    float nx = snoise(np);
    float ny = snoise(np + vec3(19.3, 7.7, 31.1));
    vec2 c = (vUv - 0.5) * 2.0;
    // Feathered on every side; strongest at chest height, thinning upward.
    float mask = (1.0 - smoothstep(0.2, 1.0, abs(c.x)))
               * smoothstep(0.0, 0.25, vUv.y)
               * (1.0 - smoothstep(0.45, 1.0, vUv.y));
    float strength = uStrength * uShaderIntensity * mask;
    if (strength < 0.002) discard;
    gl_FragColor = vec4(vec2(nx, ny) * 0.5 + 0.5, strength, mask);
  }
`;

/** Heat shimmer over the echo, drawn into the distortion layer. */
export function createHeatHazeMaterial() {
  const material = new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    depthTest: false,
    blending: NormalBlending,
    side: DoubleSide,
    toneMapped: false,
    uniforms: sharedUniforms({
      uClock: { value: 0 },
      uWidth: { value: 1.4 },
      uHeight: { value: 2.6 },
      uStrength: { value: 0 },
      uScale: { value: 2.2 },
      uSpeed: { value: 1.4 }
    }),
    vertexShader: HAZE_VERTEX,
    fragmentShader: HAZE_FRAGMENT
  });

  /** @param {{clock:number, power:number}} state */
  material.userData.sync = (state) => {
    const c = settings[ID];
    const g = settings.global;
    const u = material.uniforms;
    u.uClock.value = state.clock;
    u.uWidth.value = c.hazeWidth;
    u.uHeight.value = c.hazeHeight;
    u.uStrength.value = c.hazeStrength * state.power * g.distortion;
    u.uScale.value = c.hazeScale * g.noiseFrequency;
    u.uSpeed.value = c.hazeSpeed * g.noiseSpeed;
  };

  return material;
}

