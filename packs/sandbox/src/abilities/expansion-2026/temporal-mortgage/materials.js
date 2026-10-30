import { AdditiveBlending, Color, DoubleSide, LessEqualDepth, NormalBlending, ShaderMaterial } from 'three';
import { noiseGLSL } from '../../../shaders/lib/noise.glsl.js';
import { commonGLSL } from '../../../shaders/lib/common.glsl.js';
import { sharedUniforms } from '../../../core/FrameUniforms.js';
import { settings } from '../../../config/settings.js';
import { getColor } from '../../../utils/color.js';
import config from './config.js';

/**
 * Temporal Mortgage — the bespoke shaders.
 *
 *  - **stress light** — drawn over the steel band on the very same vertices
 *    (depth-equal, additive): light pulses running *out* along the band while
 *    the loan is spent and *back in* while it is repaid, brightest on the
 *    outer, most-stressed coils and on the band's top edge, all scaled by the
 *    outstanding balance. The steel underneath stays lit, solid matter.
 *  - **the ledger** — the floor. A dark bed (the ramp's deep stop) cut with
 *    the spring's own spiral (same r0 / rOut / turn / start angle as the band,
 *    so the groove under the steel is exactly where the steel is), fine
 *    grooves that run at the cast's clock, the sector the lash has swept lit
 *    as *debt*, the sector already repaid stamped in ink, and a white-hot
 *    line under the lashing tip. Dissolves through noise on the exit.
 *  - **the smear** — an open cylinder at the tip's radius painted only in a
 *    wedge trailing the tip: vertical streaks, longer the faster the clock.
 *    Borrowed speed made visible.
 *  - **the lens** — `LAYER.DISTORTION` disc: a time-shear swirl whose sign and
 *    strength follow the clock's rate (forward and hard while borrowing, back
 *    and faint while repaying), plus a pressure ring on landing.
 *
 * Every material reads `settings.temporalMortgage` in `userData.sync(state)`.
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
/* Stress light                                                         */
/* -------------------------------------------------------------------- */

const STRESS_VERTEX = /* glsl */ `
  uniform float uInflate;     // metres the light skin floats off the steel
  varying vec2 vUv;
  varying vec3 vNormalW;
  varying vec3 vViewDir;
  void main() {
    vUv = uv;
    // A hair off the steel: the light is drawn in the VFX pass, the steel in
    // the world pass, and coplanar skins in two passes z-fight into streaks.
    vec4 world = modelMatrix * vec4(position + normal * uInflate, 1.0);
    vNormalW = normalize(mat3(modelMatrix) * normal);
    vViewDir = cameraPosition - world.xyz;
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;

const STRESS_FRAGMENT = /* glsl */ `
  uniform float uDebt;        // outstanding balance 0..1
  uniform float uFlow;        // pulse phase along the band (signed: out / in)
  uniform float uPulses;
  uniform float uFade;
  uniform float uGlow;
  uniform float uEdge;
  uniform float uFresnelPow;
  uniform float uFresnel;
  uniform float uFlash;       // instalment click flash
  uniform vec3  uCore;
  uniform vec3  uTint;
  uniform vec3  uBody;
  uniform vec3  uDeep;
  uniform float uGlobalGlow;
  uniform float uShaderIntensity;
  varying vec2 vUv;
  varying vec3 vNormalW;
  varying vec3 vViewDir;
  ${commonGLSL}
  void main() {
    float s = vUv.x;
    float v = vUv.y;
    // Outer coils carry the load: stress rises along the band.
    float stress = smoothstep(0.1, 1.0, s) * (0.2 + 0.8 * uDebt);
    float pulse = pow(0.5 + 0.5 * sin((s * uPulses - uFlow) * 6.2831853), 8.0);
    float rim = fresnelTerm(vViewDir, vNormalW, uFresnelPow, uFresnel);
    float edge = smoothstep(0.86, 1.0, v) * uEdge;
    float heat = stress * (0.3 + 1.2 * pulse) * uShaderIntensity + edge * (0.25 + 0.75 * uDebt) + uFlash * 0.6;
    vec3 col = gradient4(uDeep, uBody, uTint, uCore, clamp(heat * 0.8, 0.0, 1.0)) * (0.6 + heat);
    float a = (stress * (0.15 + 0.85 * pulse) + rim * 0.5 * (0.2 + stress) + edge * 0.6 + uFlash * 0.4) * uFade;
    if (a < 0.003) discard;
    gl_FragColor = vec4(col * uGlow * uGlobalGlow, clamp(a, 0.0, 1.0));
  }
`;

/** The light that runs along the steel. Draw it on the band's own geometry. */
export function createStressMaterial() {
  const material = new ShaderMaterial({
    ...additive({ depthFunc: LessEqualDepth, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -2 }),
    uniforms: sharedUniforms({
      uDebt: { value: 0 },
      uInflate: { value: 0.012 },
      uFlow: { value: 0 },
      uPulses: { value: 7 },
      uFade: { value: 1 },
      uGlow: { value: 1.6 },
      uEdge: { value: 2.2 },
      uFresnelPow: { value: 2.4 },
      uFresnel: { value: 1 },
      uFlash: { value: 0 },
      uCore: { value: new Color() },
      uTint: { value: new Color() },
      uBody: { value: new Color() },
      uDeep: { value: new Color() },
    }),
    vertexShader: STRESS_VERTEX,
    fragmentShader: STRESS_FRAGMENT,
  });
  /** @param {object} s { debt, flow, fade, flash } */
  material.userData.sync = (s) => {
    const c = settings[ID];
    const g = settings.global;
    const u = material.uniforms;
    u.uDebt.value = s.debt;
    u.uInflate.value = c.stressInflate;
    u.uFlow.value = s.flow;
    u.uPulses.value = c.stressPulses;
    u.uFade.value = s.fade * g.opacity;
    u.uGlow.value = c.stressGlow * g.glow;
    u.uEdge.value = c.edgeGlow;
    u.uFresnelPow.value = c.stressFresnel;
    u.uFresnel.value = g.fresnel;
    u.uFlash.value = s.flash;
    u.uCore.value.copy(getColor(c.coreColor));
    u.uTint.value.copy(getColor(c.tintColor));
    u.uBody.value.copy(getColor(c.bodyColor));
    u.uDeep.value.copy(getColor(c.deepColor));
  };
  return material;
}

/* -------------------------------------------------------------------- */
/* The ledger                                                           */
/* -------------------------------------------------------------------- */

const LEDGER_FRAGMENT = /* glsl */ `
  uniform float uRadius;      // zone radius (m)
  uniform float uR0;          // spring: inner radius (m)
  uniform float uROut;        //          outer radius (m)
  uniform float uPhi;         //          total turn (rad)
  uniform float uPsi;         //          angle of the inner end (rad)
  uniform float uTheta0;      // the lash starts here (world angle)
  uniform float uSweep;       // the tip's swept angle now (rad, ≤ 2π)
  uniform float uSweepMax;    // the furthest it reached
  uniform float uDebt;
  uniform float uClock;       // the cast's own clock (runs fast, then slow)
  uniform float uFade;
  uniform float uDissolve;
  uniform float uGlow;
  uniform float uOpacity;
  uniform float uGroove;
  uniform float uSweptGlow;
  uniform float uInk;
  uniform float uGrain;
  uniform float uScale;
  uniform vec3  uCore;
  uniform vec3  uTint;
  uniform vec3  uBody;
  uniform vec3  uDeep;
  uniform float uGlobalGlow;
  uniform float uShaderIntensity;
  varying vec2 vUv;
  varying vec3 vWorld;
  ${noiseGLSL}
  ${commonGLSL}
  const float TAU = 6.2831853;
  void main() {
    // Plane local y → world −z (the quad is laid flat with rotation.x = −π/2).
    vec2 p = (vUv - 0.5) * 2.0 * uRadius;
    vec2 w = vec2(p.x, -p.y);
    float r = length(w);
    if (r > uRadius) discard;
    float th = atan(w.y, w.x);

    // The spring's own spiral, welded to the band by the same four numbers.
    float pitch = max(0.02, (uROut - uR0) / max(0.05, uPhi / TAU));
    float g = (r - uR0) / pitch - (th - uPsi) / TAU;
    float d = abs(fract(g + 0.5) - 0.5) * pitch;
    float onCoil = step(uR0 - 0.05, r) * (1.0 - smoothstep(uROut, uROut + 0.15, r));
    float coil = exp(-d * d / 0.006) * onCoil;
    float shade = (1.0 - exp(-d * d / 0.05)) * onCoil; // the band's foot casts a soft halo

    // Fine grooves cut by the turning spring, running at the cast's clock.
    float fine = pow(abs(sin((g * 3.0 * uGroove + uClock * 0.6) * 3.14159265)), 24.0) * onCoil;

    // The ledger: swept = debt drawn, repaid = ink.
    float a = mod(th - uTheta0, TAU);
    float drawn = 1.0 - smoothstep(uSweep - 0.02, uSweep + 0.02, a);
    float repaid = smoothstep(uSweep - 0.02, uSweep + 0.02, a) * (1.0 - smoothstep(uSweepMax - 0.02, uSweepMax + 0.02, a));
    float tipLive = step(0.001, uSweep) * step(uSweep, TAU - 0.001);
    float tip = exp(-abs(a - uSweep) * max(r, 0.3) * 7.0) * tipLive * smoothstep(uR0, uR0 + 0.4, r);

    float grain = fbm3(vec3(w * 1.2 * uScale, uClock * 0.05));
    float cells = 1.0 - smoothstep(0.0, 0.08, voronoi2(w * 1.6 * uScale).x);
    float rim = exp(-abs(r - uRadius * 0.985) * 14.0);
    float edgeFade = 1.0 - smoothstep(uRadius * 0.9, uRadius, r);

    vec3 bed = mix(uDeep, uDeep * 1.8 + uBody * 0.08, grain * uGrain);
    vec3 col = bed;
    col = mix(col, uDeep * 0.35, repaid * uInk * (0.6 + 0.4 * grain));
    col += uBody * drawn * uSweptGlow * (0.25 + 0.55 * grain) * (0.4 + 0.6 * uDebt);
    col += uTint * cells * drawn * 0.25 * uDebt;
    col += uTint * coil * 1.2 * uShaderIntensity;
    col += uBody * fine * 0.5 * uShaderIntensity;
    col += uCore * tip * 3.0;
    col += uTint * rim * 0.9;
    col *= 1.0 - shade * 0.25;

    float alpha = uOpacity * (0.55 * edgeFade + 0.35 * drawn + coil * 0.6 + tip + rim * 0.7);
    vec2 dm = dissolveMask(snoise01(vec3(w * 0.9, 4.1)), uDissolve, 0.08);
    col += uTint * dm.y * 2.5;
    gl_FragColor = vec4(col * uGlow * uGlobalGlow, clamp(alpha * dm.x * uFade, 0.0, 1.0));
  }
`;

/** The floor under the spring. Alpha-blended so its deep tone darkens the floor. */
export function createLedgerMaterial() {
  const material = new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    depthTest: true,
    blending: NormalBlending,
    side: DoubleSide,
    toneMapped: false,
    uniforms: sharedUniforms({
      uRadius: { value: 3.4 },
      uR0: { value: 0.4 },
      uROut: { value: 1 },
      uPhi: { value: 20 },
      uPsi: { value: 0 },
      uTheta0: { value: 0 },
      uSweep: { value: 0 },
      uSweepMax: { value: 0 },
      uDebt: { value: 0 },
      uClock: { value: 0 },
      uFade: { value: 1 },
      uDissolve: { value: 0 },
      uGlow: { value: 1.4 },
      uOpacity: { value: 0.85 },
      uGroove: { value: 1 },
      uSweptGlow: { value: 1.2 },
      uInk: { value: 0.8 },
      uGrain: { value: 1 },
      uScale: { value: 1 },
      uCore: { value: new Color() },
      uTint: { value: new Color() },
      uBody: { value: new Color() },
      uDeep: { value: new Color() },
    }),
    vertexShader: QUAD_VERTEX,
    fragmentShader: LEDGER_FRAGMENT,
  });
  /** @param {object} s { radius, r0, rOut, phi, psi, theta0, sweep, sweepMax, debt, clock, fade, dissolve } */
  material.userData.sync = (s) => {
    const c = settings[ID];
    const g = settings.global;
    const u = material.uniforms;
    u.uRadius.value = s.radius;
    u.uR0.value = s.r0;
    u.uROut.value = s.rOut;
    u.uPhi.value = s.phi;
    u.uPsi.value = s.psi;
    u.uTheta0.value = s.theta0;
    u.uSweep.value = s.sweep;
    u.uSweepMax.value = s.sweepMax;
    u.uDebt.value = s.debt;
    u.uClock.value = s.clock * c.floorFlow;
    u.uFade.value = s.fade * g.opacity;
    u.uDissolve.value = s.dissolve;
    u.uGlow.value = c.floorGlow * g.glow;
    u.uOpacity.value = c.floorOpacity;
    u.uGroove.value = c.groovePitch;
    u.uSweptGlow.value = c.sweptGlow;
    u.uInk.value = c.debtInk;
    u.uGrain.value = c.floorGrain * g.noiseStrength;
    u.uScale.value = g.noiseFrequency;
    u.uCore.value.copy(getColor(c.coreColor));
    u.uTint.value.copy(getColor(c.tintColor));
    u.uBody.value.copy(getColor(c.bodyColor));
    u.uDeep.value.copy(getColor(c.deepColor));
  };
  return material;
}

/* -------------------------------------------------------------------- */
/* The smear                                                            */
/* -------------------------------------------------------------------- */

const SMEAR_VERTEX = /* glsl */ `
  varying vec3 vLocal;
  varying vec3 vNormalW;
  varying vec3 vViewDir;
  void main() {
    vLocal = position;
    vec4 world = modelMatrix * vec4(position, 1.0);
    vNormalW = normalize(mat3(modelMatrix) * normal);
    vViewDir = cameraPosition - world.xyz;
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;

const SMEAR_FRAGMENT = /* glsl */ `
  uniform float uTip;         // world angle of the lashing tip
  uniform float uLen;         // wedge length behind it (rad)
  uniform float uDir;         // +1 lashing out, −1 winding back
  uniform float uPower;
  uniform float uStreaks;
  uniform float uClock;
  uniform float uGlow;
  uniform vec3  uCore;
  uniform vec3  uTint;
  uniform vec3  uBody;
  uniform vec3  uDeep;
  uniform float uGlobalGlow;
  varying vec3 vLocal;
  varying vec3 vNormalW;
  varying vec3 vViewDir;
  ${noiseGLSL}
  ${commonGLSL}
  const float TAU = 6.2831853;
  void main() {
    float th = atan(vLocal.z, vLocal.x);
    float behind = mod(uDir * (uTip - th), TAU);
    float m = behind < uLen ? pow(1.0 - behind / max(uLen, 1e-3), 2.2) : 0.0;
    float streak = 0.45 + 0.55 * smoothstep(-0.3, 0.7, snoise(vec3(th * uStreaks, vLocal.y * 1.5, uClock * 0.3)));
    float y = vLocal.y;
    float vertical = smoothstep(0.0, 0.08, y) * (1.0 - smoothstep(0.45, 1.0, y + 0.25 * (1.0 - m)));
    float heat = m * streak * vertical;
    if (heat * uPower < 0.003) discard;
    float rim = 0.6 + 0.4 * (1.0 - abs(dot(normalize(vNormalW), normalize(vViewDir))));
    vec3 col = gradient4(uDeep, uBody, uTint, uCore, clamp(heat * 1.2, 0.0, 1.0)) * (0.5 + heat * 1.5);
    gl_FragColor = vec4(col * uGlow * uGlobalGlow, clamp(heat * rim * uPower, 0.0, 1.0));
  }
`;

/** A wedge of streaked light trailing the lashing tip. */
export function createSmearMaterial() {
  const material = new ShaderMaterial({
    ...additive(),
    uniforms: sharedUniforms({
      uTip: { value: 0 },
      uLen: { value: 1 },
      uDir: { value: 1 },
      uPower: { value: 0 },
      uStreaks: { value: 18 },
      uClock: { value: 0 },
      uGlow: { value: 1.8 },
      uCore: { value: new Color() },
      uTint: { value: new Color() },
      uBody: { value: new Color() },
      uDeep: { value: new Color() },
    }),
    vertexShader: SMEAR_VERTEX,
    fragmentShader: SMEAR_FRAGMENT,
  });
  /** @param {object} s { tip, len, dir, power, clock } */
  material.userData.sync = (s) => {
    const c = settings[ID];
    const g = settings.global;
    const u = material.uniforms;
    u.uTip.value = s.tip;
    u.uLen.value = s.len;
    u.uDir.value = s.dir;
    u.uPower.value = s.power * c.smearOpacity * g.opacity;
    u.uStreaks.value = c.smearStreaks;
    u.uClock.value = s.clock;
    u.uGlow.value = c.smearGlow * g.glow;
    u.uCore.value.copy(getColor(c.coreColor));
    u.uTint.value.copy(getColor(c.tintColor));
    u.uBody.value.copy(getColor(c.bodyColor));
    u.uDeep.value.copy(getColor(c.deepColor));
  };
  return material;
}

/* -------------------------------------------------------------------- */
/* The lens                                                             */
/* -------------------------------------------------------------------- */

const LENS_FRAGMENT = /* glsl */ `
  uniform float uShear;       // signed: + forward (borrowing), − back (repaying)
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
    vec2 tangent = vec2(-radial.y, radial.x);
    // A shear band, strongest at mid-radius where the lash runs.
    float band = exp(-pow((r - 0.7) / 0.28, 2.0));
    float ring = exp(-pow((r - uWave) / 0.1, 2.0));
    vec3 np = vec3(q * 2.2 * uScale, uClock * 0.3);
    vec2 n = vec2(snoise(np), snoise(np + vec3(5.2, 1.3, 7.7))) * 0.35;
    vec2 dir = (tangent * sign(uShear) + n) * band * abs(uShear) + (radial + n) * ring * uShock;
    float mask = 1.0 - smoothstep(0.85, 1.0, r);
    float strength = uShaderIntensity * mask * clamp(band * abs(uShear) + ring * uShock, 0.0, 1.0);
    if (strength < 0.002) discard;
    gl_FragColor = vec4(clamp(dir, -1.0, 1.0) * 0.5 + 0.5, strength, mask);
  }
`;

/** `LAYER.DISTORTION` disc (opaque on purpose, as the expansion lens proxies are). */
export function createLensMaterial() {
  const material = new ShaderMaterial({
    transparent: false,
    depthWrite: false,
    depthTest: false,
    blending: NormalBlending,
    side: DoubleSide,
    toneMapped: false,
    uniforms: sharedUniforms({
      uShear: { value: 0 },
      uShock: { value: 0 },
      uWave: { value: 0 },
      uClock: { value: 0 },
      uScale: { value: 1 },
    }),
    vertexShader: QUAD_VERTEX,
    fragmentShader: LENS_FRAGMENT,
  });
  /** @param {object} s { shear, shock, wave, clock } */
  material.userData.sync = (s) => {
    const c = settings[ID];
    const g = settings.global;
    const u = material.uniforms;
    u.uShear.value = s.shear * c.lensStrength * g.distortion;
    u.uShock.value = s.shock * c.lensShock * g.distortion;
    u.uWave.value = s.wave;
    u.uClock.value = s.clock;
    u.uScale.value = g.noiseFrequency;
  };
  return material;
}
