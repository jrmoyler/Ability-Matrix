import { AdditiveBlending, Color, DoubleSide, FrontSide, NormalBlending, ShaderMaterial, Vector2 } from 'three';
import { noiseGLSL } from '../../../shaders/lib/noise.glsl.js';
import { commonGLSL } from '../../../shaders/lib/common.glsl.js';
import { sharedUniforms } from '../../../core/FrameUniforms.js';
import { settings } from '../../../config/settings.js';
import { getColor } from '../../../utils/color.js';
import config from './config.js';

/**
 * Momentum Ledger — the bespoke shaders.
 *
 *  - **the dial** — the ledger's floor: a rim, flow lines bent along the
 *    *banked direction* (the way you actually walked), the travelling waves of
 *    the original, and a **tally** of 24 cells round the rim lit one by one as
 *    the bank fills — the same count as the gauge glyphs. A shock ring runs
 *    out at the release; the dial dissolves through noise on the exit.
 *  - **the velocity glyphs** — instanced arrows (orbiting glyphs and the
 *    gauge): a hot spine, a streak gradient tail→tip and a pulse that runs
 *    faster with the bank.
 *  - **the ledger glow** — the lit wheel and release rings: fresnel light.
 *  - **the wake ribbon** — the walked path as a ribbon of chevrons flowing
 *    toward the newest point, feathered at its edges and its oldest end.
 *  - **the directional fan** — the release front: a sector laid out in the
 *    vertex stage from `uSpread`, a front racing out along it with streaks.
 *  - **speed motes** — GPU points orbiting the dial, faster with the bank.
 *  - **the compression lens** — `LAYER.DISTORTION` disc: a pinch toward the
 *    centre while banking, a pressure ring at the release.
 *
 * Every material reads `settings.momentumLedger` in `userData.sync(state)`.
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

/* -------------------------------------------------------------------- */
/* The dial                                                             */
/* -------------------------------------------------------------------- */

const DIAL_FRAGMENT = /* glsl */ `
  uniform float uClock;
  uniform float uCharge;      // 0..1 banked fraction
  uniform float uFade;
  uniform float uDissolve;
  uniform float uRelease;     // 0..1 through the release shock, −1 before
  uniform vec2  uFlow;        // banked direction in the dial's own frame
  uniform float uFlowLines;
  uniform float uTally;
  uniform float uGlow;
  uniform float uScale;
  uniform vec3  uA;
  uniform vec3  uB;
  uniform vec3  uCore;
  uniform float uGlobalGlow;
  uniform float uShaderIntensity;

  varying vec2 vUv;
  varying vec3 vWorld;

  ${noiseGLSL}
  ${commonGLSL}

  void main() {
    vec2 q = vUv * 2.0 - 1.0;
    float r = length(q);
    if (r > 1.0) discard;
    float phi = atan(q.y, q.x);

    float edge = exp(-abs(r - 0.94) * 65.0);
    float travel = pow(max(0.0, sin(phi * 10.0 - uClock * 6.0 - r * 12.0)), 14.0);
    float wave = exp(-abs(r - mod(uClock * 0.65, 1.0)) * 45.0) * uCharge;

    // Flow lines run along the banked direction, bent by fbm.
    vec2 f = length(uFlow) > 1e-3 ? normalize(uFlow) : vec2(0.0, 1.0);
    float across = dot(q, vec2(-f.y, f.x));
    float alongF = dot(q, f);
    float bend = (fbm3(vec3(q * 1.8 * uScale, uClock * 0.2)) - 0.5) * 0.25;
    float lines = pow(max(0.0, cos((across + bend) * 26.0)), 18.0)
                * (0.5 + 0.5 * sin(alongF * 9.0 - uClock * (3.0 + 9.0 * uCharge)))
                * (1.0 - smoothstep(0.55, 0.9, r)) * uFlowLines * (0.25 + 0.75 * uCharge);

    // The tally: 24 cells just inside the rim, lit one by one with the bank.
    float cellA = fract(0.25 - phi / 6.2831853);
    float cell = floor(cellA * 24.0);
    float lit = step(cell + 0.5, uCharge * 24.0);
    float cellShape = (1.0 - smoothstep(0.32, 0.42, abs(fract(cellA * 24.0) - 0.5)))
                    * smoothstep(0.8, 0.82, r) * (1.0 - smoothstep(0.88, 0.9, r));
    float tally = cellShape * (0.12 + lit * uTally);

    float shock = uRelease >= 0.0 ? exp(-abs(r - uRelease) * 28.0) * (1.0 - uRelease) * 2.0 : 0.0;

    vec2 dm = dissolveMask(snoise01(vec3(q * 3.2, 4.1)), uDissolve, 0.07);
    float mask = 1.0 - smoothstep(0.92, 1.0, r);
    float alpha = ((edge * 0.7 + travel * 0.23 * uShaderIntensity + wave * 0.6 + lines) * mask + tally + shock) * dm.x * uFade;
    vec3 col = mix(uB, uA, clamp(edge + wave + uCharge * 0.5 + lines, 0.0, 1.0));
    col = mix(col, uCore, clamp(tally * lit + shock * 0.5 + dm.y, 0.0, 1.0));
    gl_FragColor = vec4(col * uGlow * uGlobalGlow, clamp(alpha, 0.0, 1.0));
  }
`;

/** The ledger's floor dial. Additive. */
export function createDialMaterial() {
  const material = new ShaderMaterial({
    ...additive(),
    uniforms: sharedUniforms({
      uClock: { value: 0 },
      uCharge: { value: 0 },
      uFade: { value: 1 },
      uDissolve: { value: 0 },
      uRelease: { value: -1 },
      uFlow: { value: new Vector2(0, 1) },
      uFlowLines: { value: 1 },
      uTally: { value: 1.4 },
      uGlow: { value: 2 },
      uScale: { value: 1 },
      uA: { value: new Color() },
      uB: { value: new Color() },
      uCore: { value: new Color() },
    }),
    vertexShader: QUAD_VERTEX,
    fragmentShader: DIAL_FRAGMENT,
  });
  /** @param {object} s { clock, charge, fade, dissolve, release, flowX, flowY } */
  material.userData.sync = (s) => {
    const c = settings[ID];
    const g = settings.global;
    const u = material.uniforms;
    u.uClock.value = s.clock;
    u.uCharge.value = s.charge;
    u.uFade.value = s.fade * g.opacity;
    u.uDissolve.value = s.dissolve;
    u.uRelease.value = s.release;
    u.uFlow.value.set(s.flowX, s.flowY);
    u.uFlowLines.value = c.flowLines * g.shaderIntensity;
    u.uTally.value = c.tallyGlow;
    u.uGlow.value = c.dialGlow * g.glow;
    u.uScale.value = g.noiseFrequency;
    u.uA.value.copy(getColor(c.accentColor));
    u.uB.value.copy(getColor(c.trailColor));
    u.uCore.value.copy(getColor(c.coreColor));
  };
  return material;
}

/* -------------------------------------------------------------------- */
/* The velocity glyphs                                                  */
/* -------------------------------------------------------------------- */

const GLYPH_VERTEX = /* glsl */ `
  varying float vAlong;
  varying float vHeight;
  varying vec3 vNormalW;
  varying vec3 vViewDir;
  varying float vSeed;
  void main() {
    mat4 local = mat4(1.0);
    #ifdef USE_INSTANCING
      local = instanceMatrix;
    #endif
    vAlong = position.z * 1.1 + 0.5; // tail 0 → tip 1
    vHeight = position.y;
    vec4 world = modelMatrix * local * vec4(position, 1.0);
    vNormalW = normalize(mat3(modelMatrix) * mat3(local) * normal);
    vViewDir = cameraPosition - world.xyz;
    vSeed = fract(local[3].x * 1.7 + local[3].z * 2.9);
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;

const GLYPH_FRAGMENT = /* glsl */ `
  uniform float uClock;
  uniform float uCharge;
  uniform float uFade;
  uniform float uGlow;
  uniform float uFresnel;
  uniform vec3  uA;
  uniform vec3  uCore;
  uniform float uGlobalGlow;
  varying float vAlong;
  varying float vHeight;
  varying vec3 vNormalW;
  varying vec3 vViewDir;
  varying float vSeed;
  ${commonGLSL}
  void main() {
    float spine = smoothstep(0.02, 0.08, vHeight);
    float pulse = pow(max(0.0, sin((vAlong - uClock * (1.0 + 3.0 * uCharge) - vSeed) * 6.2831853)), 6.0);
    float rim = fresnelTerm(vViewDir, vNormalW, 2.0, uFresnel);
    vec3 col = mix(uA, uCore, clamp(vAlong * 0.7 + spine * 0.5 + pulse, 0.0, 1.0));
    float a = (0.45 + 0.4 * vAlong + spine * 0.4 + pulse * 0.6 + rim * 0.5) * uFade;
    gl_FragColor = vec4(col * uGlow * uGlobalGlow, clamp(a, 0.0, 1.0));
  }
`;

/** Instanced velocity glyphs (orbiting arrows and the gauge). */
export function createGlyphMaterial() {
  const material = new ShaderMaterial({
    ...additive({ side: FrontSide }),
    uniforms: sharedUniforms({
      uClock: { value: 0 },
      uCharge: { value: 0 },
      uFade: { value: 1 },
      uGlow: { value: 1.8 },
      uFresnel: { value: 1 },
      uA: { value: new Color() },
      uCore: { value: new Color() },
    }),
    vertexShader: GLYPH_VERTEX,
    fragmentShader: GLYPH_FRAGMENT,
  });
  material.userData.instanced = true;
  /** @param {object} s { clock, charge, fade } */
  material.userData.sync = (s) => {
    const c = settings[ID];
    const g = settings.global;
    const u = material.uniforms;
    u.uClock.value = s.clock;
    u.uCharge.value = s.charge;
    u.uFade.value = s.fade * g.opacity;
    u.uGlow.value = c.glyphGlow * g.glow;
    u.uFresnel.value = g.fresnel;
    u.uA.value.copy(getColor(c.accentColor));
    u.uCore.value.copy(getColor(c.coreColor));
  };
  return material;
}

/* -------------------------------------------------------------------- */
/* The ledger glow                                                      */
/* -------------------------------------------------------------------- */

const LEDGER_VERTEX = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vNormalW;
  varying vec3 vViewDir;
  void main() {
    vUv = uv;
    vec4 world = modelMatrix * vec4(position, 1.0);
    vNormalW = normalize(mat3(modelMatrix) * normal);
    vViewDir = cameraPosition - world.xyz;
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;

const LEDGER_FRAGMENT = /* glsl */ `
  uniform float uOpacity;
  uniform float uGlow;
  uniform float uFresnel;
  uniform float uClock;
  uniform vec3  uColor;
  uniform vec3  uCore;
  uniform float uGlobalGlow;
  varying vec2 vUv;
  varying vec3 vNormalW;
  varying vec3 vViewDir;
  ${commonGLSL}
  void main() {
    float rim = fresnelTerm(vViewDir, vNormalW, 2.0, uFresnel);
    float run = pow(max(0.0, sin((vUv.x * 8.0 - uClock) * 6.2831853)), 10.0);
    vec3 col = mix(uColor, uCore, clamp(rim + run * 0.6, 0.0, 1.0));
    float a = (0.5 + 0.5 * rim + run * 0.4) * uOpacity;
    if (a < 0.003) discard;
    gl_FragColor = vec4(col * uGlow * uGlobalGlow, clamp(a, 0.0, 1.0));
  }
`;

/** The lit wheel and the release rings. `state.opacity` is the record's own. */
export function createLedgerGlowMaterial() {
  const material = new ShaderMaterial({
    ...additive(),
    uniforms: sharedUniforms({
      uOpacity: { value: 0.9 },
      uGlow: { value: 1.6 },
      uFresnel: { value: 1 },
      uClock: { value: 0 },
      uColor: { value: new Color() },
      uCore: { value: new Color() },
    }),
    vertexShader: LEDGER_VERTEX,
    fragmentShader: LEDGER_FRAGMENT,
  });
  /** @param {object} s { opacity, clock } */
  material.userData.sync = (s) => {
    const c = settings[ID];
    const g = settings.global;
    const u = material.uniforms;
    u.uOpacity.value = s.opacity * g.opacity;
    u.uClock.value = s.clock;
    u.uGlow.value = c.ringGlow * g.glow;
    u.uFresnel.value = g.fresnel;
    u.uColor.value.copy(getColor(c.accentColor));
    u.uCore.value.copy(getColor(c.coreColor));
  };
  return material;
}

/* -------------------------------------------------------------------- */
/* The wake ribbon                                                      */
/* -------------------------------------------------------------------- */

const RIBBON_VERTEX = /* glsl */ `
  attribute float aT;
  attribute float aSide;
  varying float vT;
  varying float vSide;
  void main() {
    vT = aT;
    vSide = aSide;
    vec4 world = modelMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;

const RIBBON_FRAGMENT = /* glsl */ `
  uniform float uClock;
  uniform float uFlow;
  uniform float uFade;
  uniform float uGlow;
  uniform float uOpacity;
  uniform float uSpan;        // how many chevrons fit the recorded path
  uniform vec3  uColor;
  uniform vec3  uA;
  uniform vec3  uCore;
  uniform float uGlobalGlow;
  varying float vT;
  varying float vSide;
  void main() {
    float edge = 1.0 - smoothstep(0.55, 1.0, abs(vSide));
    float tail = smoothstep(0.0, 0.25, vT);
    // Chevrons flowing toward the newest point — toward you.
    float chev = pow(max(0.0, sin((vT * uSpan - abs(vSide) * 0.6 - uClock * uFlow) * 6.2831853)), 6.0);
    vec3 col = mix(uColor, mix(uA, uCore, chev), 0.3 + 0.7 * vT);
    float a = (0.25 + chev * 0.75) * edge * tail * (0.35 + 0.65 * vT) * uFade * uOpacity;
    if (a < 0.003) discard;
    gl_FragColor = vec4(col * uGlow * uGlobalGlow, clamp(a, 0.0, 1.0));
  }
`;

/** The walked path as a ribbon. */
export function createRibbonMaterial() {
  const material = new ShaderMaterial({
    ...additive(),
    uniforms: sharedUniforms({
      uClock: { value: 0 },
      uFlow: { value: 2.5 },
      uFade: { value: 1 },
      uGlow: { value: 1.6 },
      uOpacity: { value: 0.8 },
      uSpan: { value: 8 },
      uColor: { value: new Color() },
      uA: { value: new Color() },
      uCore: { value: new Color() },
    }),
    vertexShader: RIBBON_VERTEX,
    fragmentShader: RIBBON_FRAGMENT,
  });
  /** @param {object} s { clock, fade, span } */
  material.userData.sync = (s) => {
    const c = settings[ID];
    const g = settings.global;
    const u = material.uniforms;
    u.uClock.value = s.clock;
    u.uFlow.value = c.wakeFlow;
    u.uFade.value = s.fade * g.opacity;
    u.uGlow.value = c.wakeGlow * g.glow;
    u.uOpacity.value = c.wakeOpacity;
    u.uSpan.value = Math.max(1, s.span);
    u.uColor.value.copy(getColor(c.trailColor));
    u.uA.value.copy(getColor(c.accentColor));
    u.uCore.value.copy(getColor(c.coreColor));
  };
  return material;
}

/* -------------------------------------------------------------------- */
/* The directional fan                                                  */
/* -------------------------------------------------------------------- */

const FAN_VERTEX = /* glsl */ `
  uniform float uSpread;
  varying vec2 vUv;
  void main() {
    vUv = uv;
    // Laid out here so the half-angle is live: uv.x across, uv.y out.
    float a = (uv.x * 2.0 - 1.0) * uSpread;
    vec3 p = vec3(sin(a) * uv.y, 0.0, cos(a) * uv.y);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`;

const FAN_FRAGMENT = /* glsl */ `
  uniform float uProgress;
  uniform float uPower;
  uniform float uGlow;
  uniform vec3  uA;
  uniform vec3  uCore;
  uniform float uGlobalGlow;
  varying vec2 vUv;
  ${noiseGLSL}
  void main() {
    float front = exp(-abs(vUv.y - uProgress) * 22.0);
    float wake = smoothstep(uProgress - 0.45, uProgress, vUv.y) * step(vUv.y, uProgress) * 0.35;
    float streaks = 0.6 + 0.4 * snoise(vec3(vUv.x * 18.0, vUv.y * 2.0 - uProgress * 6.0, 0.0));
    float sides = 1.0 - smoothstep(0.7, 1.0, abs(vUv.x * 2.0 - 1.0));
    float a = (front + wake) * streaks * sides * uPower * (1.0 - uProgress);
    if (a < 0.003) discard;
    gl_FragColor = vec4(mix(uA, uCore, front) * uGlow * uGlobalGlow, clamp(a, 0.0, 1.0));
  }
`;

/** The directional release front. */
export function createFanMaterial() {
  const material = new ShaderMaterial({
    ...additive(),
    uniforms: sharedUniforms({
      uSpread: { value: 0.9 },
      uProgress: { value: 0 },
      uPower: { value: 0 },
      uGlow: { value: 2.2 },
      uA: { value: new Color() },
      uCore: { value: new Color() },
    }),
    vertexShader: FAN_VERTEX,
    fragmentShader: FAN_FRAGMENT,
  });
  /** @param {object} s { progress, power } */
  material.userData.sync = (s) => {
    const c = settings[ID];
    const g = settings.global;
    const u = material.uniforms;
    u.uSpread.value = Math.max(0.05, Math.min(Math.PI, c.fanSpread));
    u.uProgress.value = s.progress;
    u.uPower.value = s.power * g.opacity;
    u.uGlow.value = c.fanGlow * g.glow;
    u.uA.value.copy(getColor(c.accentColor));
    u.uCore.value.copy(getColor(c.coreColor));
  };
  return material;
}

/* -------------------------------------------------------------------- */
/* Speed motes                                                          */
/* -------------------------------------------------------------------- */

const MOTE_VERTEX = /* glsl */ `
  attribute vec4 aSeed;
  uniform float uClock;
  uniform float uRadius;
  uniform float uCharge;
  uniform float uThrow;
  uniform float uSize;
  uniform float uFade;
  uniform float uCount;
  uniform vec2  uResolution;
  varying float vAlpha;
  varying float vHot;
  void main() {
    if (aSeed.w >= uCount) {
      gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
      gl_PointSize = 0.0;
      vAlpha = 0.0;
      vHot = 0.0;
      return;
    }
    float speed = (0.6 + 1.4 * aSeed.y) * (0.4 + 2.6 * uCharge);
    float ang = aSeed.x * 6.2831853 + uClock * speed;
    float rad = uRadius * mix(0.45, 1.05, aSeed.z) * (1.0 + uThrow * (0.6 + aSeed.y));
    float y = 0.12 + aSeed.y * 0.5 + sin(uClock * 2.0 + aSeed.x * 9.0) * 0.05;
    vec4 mv = modelViewMatrix * vec4(cos(ang) * rad, y, sin(ang) * rad, 1.0);
    gl_Position = projectionMatrix * mv;
    vAlpha = (0.35 + 0.65 * uCharge) * (1.0 - uThrow) * uFade;
    vHot = aSeed.y;
    gl_PointSize = uSize * uResolution.y * projectionMatrix[1][1] * 0.5 / max(0.1, -mv.z);
  }
`;

const MOTE_FRAGMENT = /* glsl */ `
  uniform float uGlow;
  uniform vec3  uColor;
  uniform vec3  uHot;
  uniform float uGlobalGlow;
  varying float vAlpha;
  varying float vHot;
  void main() {
    vec2 c = gl_PointCoord * 2.0 - 1.0;
    float d = dot(c, c);
    if (d > 1.0) discard;
    float soft = exp(-d * 3.0);
    gl_FragColor = vec4(mix(uColor, uHot, soft * vHot) * uGlow * uGlobalGlow, soft * vAlpha);
  }
`;

/** GPU speed motes orbiting the dial. */
export function createSpeedMoteMaterial() {
  const material = new ShaderMaterial({
    ...additive({ side: FrontSide }),
    uniforms: sharedUniforms({
      uClock: { value: 0 },
      uRadius: { value: 4 },
      uCharge: { value: 0 },
      uThrow: { value: 0 },
      uSize: { value: 0.05 },
      uFade: { value: 1 },
      uCount: { value: 1 },
      uGlow: { value: 1.8 },
      uColor: { value: new Color() },
      uHot: { value: new Color() },
    }),
    vertexShader: MOTE_VERTEX,
    fragmentShader: MOTE_FRAGMENT,
  });
  /** @param {object} s { clock, radius, charge, throw, fade, capacity } */
  material.userData.sync = (s) => {
    const c = settings[ID];
    const g = settings.global;
    const u = material.uniforms;
    u.uClock.value = s.clock;
    u.uRadius.value = s.radius;
    u.uCharge.value = s.charge;
    u.uThrow.value = s.throw;
    u.uSize.value = c.speedLineSize * g.particleSize;
    u.uFade.value = s.fade * g.opacity;
    u.uCount.value = Math.min(1, (c.speedLineCount * g.particleCount) / s.capacity);
    u.uGlow.value = c.speedLineGlow * g.glow;
    u.uColor.value.copy(getColor(c.accentColor));
    u.uHot.value.copy(getColor(c.coreColor));
  };
  return material;
}

/* -------------------------------------------------------------------- */
/* The compression lens                                                 */
/* -------------------------------------------------------------------- */

const LENS_FRAGMENT = /* glsl */ `
  uniform float uPinch;
  uniform float uShock;
  uniform float uWave;
  uniform float uClock;
  uniform float uScale;
  uniform float uShaderIntensity;
  varying vec2 vUv;
  varying vec3 vWorld;
  ${noiseGLSL}
  void main() {
    vec2 q = vUv * 2.0 - 1.0;
    float r = length(q);
    vec2 radial = q / max(r, 1e-3);
    float body = smoothstep(0.0, 0.35, r) * (1.0 - smoothstep(0.5, 1.0, r));
    float ring = exp(-pow((r - uWave) / 0.09, 2.0));
    vec3 np = vec3(q * 2.2 * uScale, uClock * 0.5);
    vec2 n = vec2(snoise(np), snoise(np + vec3(3.7, 9.1, 0.4))) * 0.25;
    vec2 dir = (-radial + n) * body * uPinch + (radial + n) * ring * uShock;
    float mask = 1.0 - smoothstep(0.85, 1.0, r);
    float strength = uShaderIntensity * mask * clamp(body * uPinch + ring * uShock, 0.0, 1.0);
    if (strength < 0.002) discard;
    gl_FragColor = vec4(clamp(dir, -1.0, 1.0) * 0.5 + 0.5, strength, mask);
  }
`;

/**
 * `LAYER.DISTORTION` disc. Opaque on purpose: the offset buffer wants the
 * proxy's own value, and an opaque proxy keeps the expansion's "transparent ⇒
 * VFX layer" routing from pulling it out of the warp pass.
 */
export function createCompressionLensMaterial() {
  const material = new ShaderMaterial({
    transparent: false,
    depthWrite: false,
    depthTest: false,
    blending: NormalBlending,
    side: DoubleSide,
    toneMapped: false,
    uniforms: sharedUniforms({
      uPinch: { value: 0 },
      uShock: { value: 0 },
      uWave: { value: 0 },
      uClock: { value: 0 },
      uScale: { value: 1 },
    }),
    vertexShader: QUAD_VERTEX,
    fragmentShader: LENS_FRAGMENT,
  });
  /** @param {object} s { pinch, shock, wave, clock } */
  material.userData.sync = (s) => {
    const c = settings[ID];
    const g = settings.global;
    const u = material.uniforms;
    u.uPinch.value = s.pinch * c.lensStrength * g.distortion;
    u.uShock.value = s.shock * c.lensShock * g.distortion;
    u.uWave.value = s.wave;
    u.uClock.value = s.clock;
    u.uScale.value = g.noiseFrequency;
  };
  return material;
}
