import { AdditiveBlending, Color, DoubleSide, NormalBlending, ShaderMaterial, Vector3 } from 'three';
import { noiseGLSL } from '../../shaders/lib/noise.glsl.js';
import { commonGLSL } from '../../shaders/lib/common.glsl.js';
import { sharedUniforms } from '../../core/FrameUniforms.js';
import { settings } from '../../config/settings.js';
import { getColor } from '../../utils/color.js';

const ID = 'vectorlance';

/**
 * Vector Lance — three bespoke shaders.
 *
 * The body is a drilling blade riding the line. The lens writes the same
 * silhouette into the distortion buffer (direction in RG around 0.5, strength
 * in B, coverage in A). The ground decal is a scrape groove,
 * not a shared stamp. Every uniform is filled from `settings.vectorlance`
 * inside `userData.sync`, so the editor reshapes a cast already in flight.
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
  varying vec3 vWorld;
  varying float vViewZ;
  void main() {
    float u = position.x + 0.5;
    float v = position.y + 0.5;
    vec3 p;
    float local = u;

    float along = v * uAlong;
    float braid = sin(along * 9.0 + uSpin) * uOpen;
    float width = uThickness * (1.05 - v) * (0.35 + 0.65 * uGrow);
    p = uOrigin + uDir * (along * uLength) + uSide * (position.x * width + braid);
    p.y = 0.25 + uHeight * sin(v * 3.14159265) * 0.35 * uGrow;
    local = along;
    vUv = vec2(u, v);
    vLocal = local;
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
  varying vec3 vWorld;
  varying float vViewZ;
  ${noiseGLSL}
  ${commonGLSL}
  void main() {
    vec3 np = vWorld * 0.35 + vec3(uSeed * 3.0, uTime * 0.57, uSeed);
    float n = fbm3(np);
    float ridge = abs(snoise(np * 1.70));
    float band = 0.5 + 0.5 * sin(vLocal * 18.00 + uTime * 1.37 + uSeed);
    float edge = smoothstep(0.15, 0.85, band);
    vec3 col = mix(uColorC, uColorB, n * 0.5 + 0.5);
    col += uColorA * pow(edge, 2.0) * uEdge;
    col += uColorB * ridge * uGlow;
    float mask = uOpacity * (0.25 + 0.75 * edge) * (0.35 + 0.65 * n);
    mask *= smoothstep(0.0, 0.08, vUv.y) * (1.0 - smoothstep(0.92, 1.0, vUv.y));
    if (uDissolve > 0.0) {
      float keep = smoothstep(uDissolve, uDissolve + 0.12, n * 0.6 + edge * 0.4);
      col += uColorA * (1.0 - keep) * 0.7;
      mask *= keep;
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
  uniform float uWarp;
  uniform float uShaderIntensity;
  uniform float uDissolve;
  varying vec2 vUv;
  varying float vLocal;
  void main() {
    float band = sin(vLocal * 10.0) * 0.5 + 0.5;
    float mask = smoothstep(0.0, 0.12, vUv.y) * (1.0 - smoothstep(0.8, 1.0, vUv.y));
    mask *= (0.35 + 0.65 * band) * (1.0 - uDissolve);
    float s = uWarp * uShaderIntensity * mask;
    if (s < 0.01) discard;
    vec2 raw = vec2(vUv.x - 0.5, vLocal);
    float len = length(raw);
    vec2 dir = len < 0.001 ? vec2(1.0, 0.0) : raw / len;
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
    float pat = smoothstep(0.05, 0.0, abs(fract(vUv.x * 8.0) - 0.5) - 0.44);
    float grain = snoise(vec3(vWorld.xz * 0.8, uSeed)) * 0.5 + 0.5;
    float mask = pat * (1.0 - smoothstep(0.92, 1.05, rad)) * uOpacity * (1.0 - uErode);
    mask *= 0.45 + 0.55 * grain;
    if (mask < 0.02) discard;
    vec3 col = mix(uColorA, uColorB, pat) * (0.6 + uGlow);
    vec2 screenUV = gl_FragCoord.xy / max(uResolution, vec2(1.0));
    mask *= softFade(uSceneDepth, screenUV, vViewZ, uCameraNear, uCameraFar, 0.45);
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

function writeShape(u, st) {
  u.uCenter.value.copy(st.center);
  u.uOrigin.value.copy(st.origin);
  u.uDir.value.copy(st.dir);
  u.uSide.value.copy(st.side);
  u.uRadius.value = st.radius;
  u.uLength.value = st.length;
  u.uHeight.value = st.height;
  u.uThickness.value = st.thickness;
  u.uCount.value = st.count;
  u.uSpin.value = st.spin;
  u.uOpen.value = st.open;
  u.uGrow.value = st.grow;
  u.uAlong.value = st.along;
  u.uSeed.value = st.seed;
}

export function createVectorLanceBodyMaterial() {
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
    writeShape(u, st);
    u.uDissolve.value = st.dissolve;
    u.uSoftFade.value = c.softFade;
    u.uOpacity.value = c.bodyOpacity * g.opacity * st.fade;
    u.uGlow.value = c.bodyGlow * g.glow;
    u.uEdge.value = c.edgeGlow * g.glow;
    u.uColorA.value.copy(getColor(c.colorA));
    u.uColorB.value.copy(getColor(c.colorB));
    u.uColorC.value.copy(getColor(c.colorC));
  };
  return material;
}

export function createVectorLanceLensMaterial() {
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
      uDissolve: { value: 0 }
    }),
    vertexShader: BODY_VERTEX,
    fragmentShader: LENS_FRAGMENT
  });
  material.userData.sync = (st) => {
    const c = settings[ID];
    const g = settings.global;
    const u = material.uniforms;
    writeShape(u, st);
    u.uDissolve.value = st.dissolve;
    u.uWarp.value = c.lensWarp * g.distortion * st.fade * (1.0 - st.dissolve);
  };
  return material;
}

export function createVectorLanceGroundMaterial() {
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
    u.uColorA.value.copy(getColor(c.colorA));
    u.uColorB.value.copy(getColor(c.colorC));
  };
  return material;
}
