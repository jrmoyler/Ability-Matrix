import { AdditiveBlending, Color, DoubleSide, NormalBlending, ShaderMaterial, Vector3 } from 'three';
import { noiseGLSL } from '../../shaders/lib/noise.glsl.js';
import { commonGLSL } from '../../shaders/lib/common.glsl.js';
import { sharedUniforms } from '../../core/FrameUniforms.js';
import { settings } from '../../config/settings.js';
import { getColor } from '../../utils/color.js';

const ID = 'lensewell';

/**
 * Lens Well — four shaders, none of them shared.
 *
 * Body placement is the inhale read (Crystal — a lens in the floor drinks the circle, then fires a column of glare).
 * The fragment field is crystal-specific (f 13.00 / 1.15, speed 0.35),
 * then carved by this spell's own mask. The lens writes distortion
 * (direction in RG around 0.5, strength in B, coverage in A). The ground
 * pattern belongs to crystal, not to a shared stamp. The voice is a
 * second placement — drain — so the cast has a layer that
 * is not the body. Every uniform is filled from settings.lensewell each frame.
 */

const BODY_VERTEX = /* glsl */ `

  uniform vec3 uCenter;
  uniform vec3 uOrigin;
  uniform vec3 uDir;
  uniform vec3 uSide;
  uniform float uRadius;
  uniform float uLength;
  uniform float uHeight;
  uniform float uThickness;
  uniform float uCount;
  uniform float uSpin;
  uniform float uOpen;
  uniform float uGrow;
  uniform float uAlong;
  uniform float uSeed;
  varying vec2 vUv;
  varying float vLocal;
  varying float vAlong;
  varying vec3 vWorld;
  varying float vViewZ;
  void main() {
    float u = position.x + 0.5;
    float v = position.y + 0.5;
    vec3 p = vec3(0.0);
    float local = u;


    float ang = u * 6.2831853 + uSpin;
    float rad = uRadius * (1.0 - uOpen * v);
    p = uCenter + vec3(cos(ang), 0.0, sin(ang)) * rad;
    p.y = v * uHeight * max(uOpen, 0.03) * uGrow;
    local = fract(ang * 0.1591549);
  

    vUv = vec2(u, v);
    vLocal = local;
    vAlong = uAlong;
    vWorld = p;
    vec4 mv = viewMatrix * vec4(p, 1.0);
    vViewZ = mv.z;
    gl_Position = projectionMatrix * mv;
  }

`;

const BODY_FRAGMENT = /* glsl */ `
  precision highp float;
  uniform float uTime;
  uniform float uSeed;
  uniform float uDissolve;
  uniform float uSoftFade;
  uniform float uOpacity;
  uniform float uGlow;
  uniform float uEdge;
  uniform float uPhrase;
  uniform vec3 uColorA;
  uniform vec3 uColorB;
  uniform vec3 uColorC;
  uniform vec2 uResolution;
  uniform sampler2D uSceneDepth;
  uniform float uCameraNear;
  uniform float uCameraFar;
  uniform float uGlobalGlow;
  uniform float uShaderIntensity;
  varying vec2 vUv;
  varying float vLocal;
  varying float vAlong;
  varying vec3 vWorld;
  varying float vViewZ;
  ${noiseGLSL}
  ${commonGLSL}
  void main() {
    float field = abs(sin(vWorld.x * 13.00 + uSeed) * sin(vWorld.z * 1.15));
    float band = 0.5 + 0.5 * sin(vLocal * 13.00 + uTime * 0.35);
    float carved = band * (0.30 + 0.70 * field);
    float keep = (vLocal + vAlong + vWorld.x + vViewZ) * 0.0;
    vec3 col = mix(uColorC, uColorA, pow(clamp(carved, 0.0, 1.0), 0.55));
    col += uColorB * step(0.72, carved) * uEdge;
    col *= 1.0 + uPhrase * 0.18;
    float mask = uOpacity * (0.22 + 0.78 * clamp(carved, 0.0, 1.0));
    mask *= smoothstep(0.0, 0.06, vUv.y) * (1.0 - smoothstep(0.94, 1.0, vUv.y));
    mask += keep;
    if (uDissolve > 0.0) {
      float n = snoise01(vWorld * 0.45 + vec3(uSeed, uTime * 0.20, 0.0));
      float hold = smoothstep(uDissolve, uDissolve + 0.14, n * 0.65 + carved * 0.35);
      col += uColorA * (1.0 - hold) * 0.65;
      mask *= hold;
    }
    if (mask < 0.02) discard;
    vec2 screenUV = gl_FragCoord.xy / max(uResolution, vec2(1.0));
    mask *= softFade(uSceneDepth, screenUV, vViewZ, uCameraNear, uCameraFar, max(uSoftFade, 0.02));
    if (mask < 0.02) discard;
    gl_FragColor = vec4(col * mask * uGlobalGlow * mix(1.0, uShaderIntensity, 0.65), mask);
  }
`;

const LENS_FRAGMENT = /* glsl */ `
  precision highp float;
  uniform float uTime;
  uniform float uWarp;
  uniform float uShaderIntensity;
  uniform float uDissolve;
  uniform float uPhrase;
  varying vec2 vUv;
  varying float vLocal;
  varying float vAlong;
  varying vec3 vWorld;
  varying float vViewZ;
  void main() {
    float keep = (vLocal + vAlong + vWorld.x + vViewZ + uTime * 0.0) * 0.0;
    float mask = smoothstep(0.0, 0.10, vUv.y) * (1.0 - smoothstep(0.82, 1.0, vUv.y));
    mask *= (0.40 + 0.60 * clamp(vLocal, 0.0, 1.0)) * (1.0 - uDissolve);
    mask += keep;
    float s = uWarp * uShaderIntensity * mask * (1.0 + uPhrase * 0.25);
    if (s < 0.01) discard;
    vec2 raw = floor((vUv - 0.5) * 4.0) / 4.0; float len = length(raw); vec2 dir = len < 0.001 ? vec2(1.0, 0.0) : raw / len;
    gl_FragColor = vec4(dir * 0.5 + 0.5, s, mask);
  }
`;

const GROUND_VERTEX = /* glsl */ `
  uniform vec3 uCenter;
  uniform vec3 uDir;
  uniform vec3 uSide;
  uniform float uLength;
  uniform float uWidth;
  varying vec2 vUv;
  varying vec3 vWorld;
  varying float vViewZ;
  void main() {
    vUv = vec2(position.x + 0.5, position.y + 0.5);
    vec3 p = uCenter + uDir * (position.y * uLength) + uSide * (position.x * uWidth);
    p.y = 0.04;
    vWorld = p;
    vec4 mv = viewMatrix * vec4(p, 1.0);
    vViewZ = mv.z;
    gl_Position = projectionMatrix * mv;
  }
`;

const GROUND_FRAGMENT = /* glsl */ `
  precision highp float;
  uniform float uTime;
  uniform float uSeed;
  uniform float uGlow;
  uniform float uErode;
  uniform float uOpacity;
  uniform float uPhrase;
  uniform vec3 uColorA;
  uniform vec3 uColorB;
  uniform vec2 uResolution;
  uniform sampler2D uSceneDepth;
  uniform float uCameraNear;
  uniform float uCameraFar;
  uniform float uGlobalGlow;
  varying vec2 vUv;
  varying vec3 vWorld;
  varying float vViewZ;
  ${noiseGLSL}
  ${commonGLSL}
  void main() {
    vec2 q = vUv - 0.5;
    float rad = length(q) * 2.0;
    float ang = atan(q.y, q.x);
    float grain = snoise(vec3(vWorld.xz * 0.85, uSeed)) * 0.5 + 0.5;
    float pat = step(0.72, abs(sin(ang * 6.0) * sin(rad * 14.0)));
    float mask = pat * (1.0 - smoothstep(0.92, 1.08, rad)) * uOpacity * (1.0 - uErode);
    mask *= 0.40 + 0.60 * grain;
    mask *= 1.0 + uPhrase * 0.15;
    if (mask < 0.02) discard;
    vec3 col = mix(uColorA, uColorB, clamp(pat, 0.0, 1.0)) * (0.55 + uGlow);
    vec2 screenUV = gl_FragCoord.xy / max(uResolution, vec2(1.0));
    mask *= softFade(uSceneDepth, screenUV, vViewZ, uCameraNear, uCameraFar, 0.45);
    gl_FragColor = vec4(col * mask * uGlobalGlow, mask);
  }
`;

const VOICE_VERTEX = /* glsl */ `

  uniform vec3 uCenter;
  uniform vec3 uOrigin;
  uniform vec3 uDir;
  uniform vec3 uSide;
  uniform float uRadius;
  uniform float uLength;
  uniform float uHeight;
  uniform float uThickness;
  uniform float uCount;
  uniform float uSpin;
  uniform float uOpen;
  uniform float uGrow;
  uniform float uAlong;
  uniform float uSeed;
  varying vec2 vUv;
  varying float vLocal;
  varying float vAlong;
  varying vec3 vWorld;
  varying float vViewZ;
  void main() {
    float u = position.x + 0.5;
    float v = position.y + 0.5;
    vec3 p = vec3(0.0);
    float local = u;


    float ang = u * 12.5663706 + uSpin;
    float rad = uRadius * (1.0 - v) * (1.0 - 0.65 * uOpen);
    p = uCenter + vec3(cos(ang), 0.0, sin(ang)) * max(rad, 0.05);
    p.y = (1.0 - v) * 0.45 * uHeight * uGrow;
    local = v;
  

    vUv = vec2(u, v);
    vLocal = local;
    vAlong = uAlong;
    vWorld = p;
    vec4 mv = viewMatrix * vec4(p, 1.0);
    vViewZ = mv.z;
    gl_Position = projectionMatrix * mv;
  }

`;

const VOICE_FRAGMENT = /* glsl */ `
  precision highp float;
  uniform float uTime;
  uniform float uSeed;
  uniform float uDissolve;
  uniform float uOpacity;
  uniform float uGlow;
  uniform float uPhrase;
  uniform vec3 uColorA;
  uniform vec3 uColorB;
  uniform vec2 uResolution;
  uniform sampler2D uSceneDepth;
  uniform float uCameraNear;
  uniform float uCameraFar;
  uniform float uGlobalGlow;
  varying vec2 vUv;
  varying float vLocal;
  varying float vAlong;
  varying vec3 vWorld;
  varying float vViewZ;
  ${noiseGLSL}
  ${commonGLSL}
  void main() {
    float keep = (vAlong + vWorld.x + vViewZ) * 0.0;
    float band = 0.5 + 0.5 * sin(vLocal * 13.00 + uTime * 0.35 + uSeed);
    float grain = snoise01(vWorld * 1.15 + vec3(uSeed, uTime * 0.30, 0.0));
    float mask = (0.30 + 0.70 * band) * (0.45 + 0.55 * grain);
    mask *= uOpacity * (1.0 - uDissolve);
    mask *= smoothstep(0.0, 0.08, vUv.y) * (1.0 - smoothstep(0.88, 1.0, vUv.y));
    mask += keep;
    if (mask < 0.02) discard;
    vec3 col = mix(uColorA, uColorB, band) * (1.0 + uGlow) * (1.0 + uPhrase * 0.40);
    vec2 screenUV = gl_FragCoord.xy / max(uResolution, vec2(1.0));
    mask *= softFade(uSceneDepth, screenUV, vViewZ, uCameraNear, uCameraFar, 0.35);
    gl_FragColor = vec4(col * mask * uGlobalGlow, mask);
  }
`;

function shapeUniforms() {
  return {
    uCenter: { value: new Vector3() },
    uOrigin: { value: new Vector3() },
    uDir: { value: new Vector3(0, 0, 1) },
    uSide: { value: new Vector3(1, 0, 0) },
    uRadius: { value: 1 },
    uLength: { value: 1 },
    uHeight: { value: 1 },
    uThickness: { value: 0.3 },
    uCount: { value: 6 },
    uSpin: { value: 0 },
    uOpen: { value: 1 },
    uGrow: { value: 1 },
    uAlong: { value: 1 },
    uSeed: { value: 0 }
  };
}

function writeShape(u, st, spin) {
  u.uCenter.value.copy(st.center);
  u.uOrigin.value.copy(st.origin);
  u.uDir.value.copy(st.dir);
  u.uSide.value.copy(st.side);
  u.uRadius.value = st.radius;
  u.uLength.value = st.length;
  u.uHeight.value = st.height;
  u.uThickness.value = st.thickness;
  u.uCount.value = st.count;
  u.uSpin.value = spin;
  u.uOpen.value = st.open;
  u.uGrow.value = st.grow;
  u.uAlong.value = st.along;
  u.uSeed.value = st.seed;
}

export function createLensWellBodyMaterial() {
  const material = new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    depthTest: true,
    blending: AdditiveBlending,
    side: DoubleSide,
    toneMapped: false,
    uniforms: sharedUniforms({
      ...shapeUniforms(),
      uDissolve: { value: 0 },
      uSoftFade: { value: 0.4 },
      uOpacity: { value: 1 },
      uGlow: { value: 1 },
      uEdge: { value: 2 },
      uPhrase: { value: 0 },
      uColorA: { value: new Color() },
      uColorB: { value: new Color() },
      uColorC: { value: new Color() }
    }),
    vertexShader: BODY_VERTEX,
    fragmentShader: BODY_FRAGMENT
  });
  material.userData.sync = (st) => {
    const c = settings[ID];
    const g = settings.global;
    const u = material.uniforms;
    writeShape(u, st, st.spin);
    u.uDissolve.value = st.dissolve;
    u.uSoftFade.value = c.softFade;
    u.uOpacity.value = c.bodyOpacity * g.opacity * st.fade;
    u.uGlow.value = c.bodyGlow * g.glow;
    u.uEdge.value = c.edgeGlow * g.glow;
    u.uPhrase.value = st.phrase;
    u.uColorA.value.copy(getColor(c.colorA));
    u.uColorB.value.copy(getColor(c.colorB));
    u.uColorC.value.copy(getColor(c.colorC));
  };
  return material;
}

export function createLensWellLensMaterial() {
  const material = new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    depthTest: false,
    blending: NormalBlending,
    side: DoubleSide,
    toneMapped: false,
    uniforms: sharedUniforms({
      ...shapeUniforms(),
      uWarp: { value: 1 },
      uDissolve: { value: 0 },
      uPhrase: { value: 0 }
    }),
    vertexShader: BODY_VERTEX,
    fragmentShader: LENS_FRAGMENT
  });
  material.userData.sync = (st) => {
    const c = settings[ID];
    const g = settings.global;
    const u = material.uniforms;
    writeShape(u, st, st.spin);
    u.uDissolve.value = st.dissolve;
    u.uPhrase.value = st.phrase;
    u.uWarp.value = c.lensWarp * g.distortion * st.fade * (1.0 - st.dissolve);
  };
  return material;
}

export function createLensWellGroundMaterial() {
  const material = new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    depthTest: true,
    blending: NormalBlending,
    side: DoubleSide,
    toneMapped: false,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    polygonOffsetUnits: -2,
    uniforms: sharedUniforms({
      uCenter: { value: new Vector3() },
      uDir: { value: new Vector3(0, 0, 1) },
      uSide: { value: new Vector3(1, 0, 0) },
      uLength: { value: 4 },
      uWidth: { value: 4 },
      uSeed: { value: 0 },
      uGlow: { value: 1 },
      uErode: { value: 0 },
      uOpacity: { value: 1 },
      uPhrase: { value: 0 },
      uColorA: { value: new Color() },
      uColorB: { value: new Color() }
    }),
    vertexShader: GROUND_VERTEX,
    fragmentShader: GROUND_FRAGMENT
  });
  material.userData.sync = (st) => {
    const c = settings[ID];
    const g = settings.global;
    const u = material.uniforms;
    u.uCenter.value.copy(st.center);
    u.uDir.value.copy(st.dir);
    u.uSide.value.copy(st.side);
    u.uLength.value = Math.max(0.2, st.foot);
    u.uWidth.value = Math.max(0.2, st.footWidth);
    u.uSeed.value = st.seed;
    u.uGlow.value = c.groundGlow * g.glow;
    u.uErode.value = st.dissolve;
    u.uOpacity.value = g.opacity * st.fade;
    u.uPhrase.value = st.phrase;
    u.uColorA.value.copy(getColor(c.colorA));
    u.uColorB.value.copy(getColor(c.colorC));
  };
  return material;
}

export function createLensWellVoiceMaterial() {
  const material = new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    depthTest: true,
    blending: AdditiveBlending,
    side: DoubleSide,
    toneMapped: false,
    uniforms: sharedUniforms({
      ...shapeUniforms(),
      uDissolve: { value: 0 },
      uOpacity: { value: 1 },
      uGlow: { value: 1 },
      uPhrase: { value: 0 },
      uColorA: { value: new Color() },
      uColorB: { value: new Color() }
    }),
    vertexShader: VOICE_VERTEX,
    fragmentShader: VOICE_FRAGMENT
  });
  material.userData.sync = (st) => {
    const c = settings[ID];
    const g = settings.global;
    const u = material.uniforms;
    writeShape(u, st, st.voiceSpin);
    u.uDissolve.value = st.dissolve;
    u.uOpacity.value = c.bodyOpacity * 0.65 * g.opacity * st.fade;
    u.uGlow.value = c.bodyGlow * g.glow * 1.25;
    u.uPhrase.value = st.phrase;
    u.uColorA.value.copy(getColor(c.colorB));
    u.uColorB.value.copy(getColor(c.colorA));
  };
  return material;
}
