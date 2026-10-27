// The trail every pure-element line cast leaves (see abilities/codex/LineTrail.js).
//
// LineTrail.js owns the strips and the wake. This module writes each spell's
// own two shaders for it: the ribbon (`create<Cast>TrailMaterial`) and the
// floor scar (`create<Cast>ScarMaterial`). The path in GLSL is the twin of
// `pathPoint` / `passAt` in LineTrail.js, one per twist; the surface uses the
// spell's element field and colour, so the trail is made of what the body is.

/** GLSL twin of LineTrail.pathPoint, per twist. Reads uOrigin, uDir, uSide, uLength, uRadius, uHeight, uThickness, uLanes. */
const PATH = {
  straight: (twist) => `
    float off = ${twist === 'falsecut' ? 'uThickness * 3.4' : '0.0'};
    vec3 p = uOrigin + uDir * (s * uLength) + uSide * off;
    p.y = ${['flatten', 'scan', 'erase'].includes(twist) ? '0.32' : '0.85'};
    return p;`,
  bow: () => `
    vec3 p = uOrigin + uDir * (s * uLength) + uSide * (sin(s * 3.1415926) * uRadius * 0.6);
    p.y = uHeight * 0.32;
    return p;`,
  arc: (twist) => `
    float n = max(uLanes, 1.0);
    float offset = ${twist === 'pair'
      ? '(mod(lane, 2.0) * 2.0 - 1.0) * (0.4 + floor(lane * 0.5) * 0.18) * uRadius'
      : '((lane + 0.5) / n - 0.5) * 2.0 * uRadius'};
    vec3 p = uOrigin + uDir * (s * uLength) + uSide * offset;
    p.y = sin(s * 3.1415926) * uHeight * ${twist === 'reverse' ? '0.85' : '1.0'} + 0.12;
    return p;`,
  sweep: (twist) => `
    float ang = -uRadius + 2.0 * uRadius * s;
    vec3 fwd = uDir * cos(ang) + uSide * sin(ang);
    vec3 p = uOrigin + fwd * (uLength * 0.92);
    p.y = uHeight * ${twist === 'return' ? '0.6' : '0.68'};
    return p;`
};

/** GLSL twin of LineTrail.passAt. */
function passGLSL(twist) {
  if (twist === 'late') return 'return sqrt(max(s, 0.0));';
  if (twist === 'reverse') return 'float n = max(uLanes, 1.0); return ((n - 1.0 - lane) + s) / n;';
  if (twist === 'pair') return 'float slots = max(ceil(uLanes * 0.5), 1.0); return (floor(lane * 0.5) + s) / slots;';
  if (twist === 'plant') return 'float n = max(uLanes, 1.0); return (lane + s) / n;';
  return 'return s;';
}

export const TRAIL_FAMILY = {
  drill: 'straight', flatten: 'straight', falsecut: 'straight', erase: 'straight', scan: 'straight',
  shear: 'bow', late: 'bow',
  plant: 'arc', pair: 'arc', reverse: 'arc',
  hinge: 'sweep', return: 'sweep'
};

/** The decal each element puts down along its wake. */
export const WAKE = {
  earth: 'CRACK', gravity: 'CRACK', force: 'CRACK',
  crystal: 'FROST', tech: 'ARC', light: 'SCORCH',
  wind: 'DUSTRING', shadow: 'DUSTRING', motion: 'DUSTRING',
  // The radiant and abstract elements used to wake with thin rings; a ring is
  // not a mark on the floor, so they now leave a small filled burn.
  illusion: 'SCORCH',
  sound: 'SCORCH', holy: 'SCORCH', cosmic: 'SCORCH', void: 'SCORCH', arcane: 'SCORCH', time: 'SCORCH'
};

/** How the scar reads on the floor, per element: `seam` is the hot line down its middle. */
const SCAR = {
  earth: 'float seam = smoothstep(0.18, 0.0, abs(x - 0.25 * (grain - 0.5)));',
  gravity: 'float seam = smoothstep(0.5, 0.0, x) * 0.6;',
  force: 'float seam = smoothstep(0.12, 0.0, abs(fract(along * 3.0) - 0.5) * x * 2.0 + x * 0.1);',
  crystal: 'float seam = step(0.62, abs(sin(along * 1.7 + x * 6.0 + uSeed)));',
  tech: 'float seam = step(0.5, fract(along * 2.0)) * smoothstep(0.2, 0.0, abs(x - 0.5));',
  light: 'float seam = smoothstep(0.35, 0.0, x);',
  wind: 'float seam = smoothstep(0.08, 0.0, abs(fract(x * 3.0 - along * 0.6) - 0.5)) * 0.6;',
  shadow: 'float seam = (1.0 - grain) * smoothstep(0.7, 0.0, x) * 0.5;',
  motion: 'float seam = smoothstep(0.1, 0.0, abs(fract(along * 1.5 - uTime * 0.5) - 0.5));',
  illusion: 'float seam = abs(sin(along * 2.0 + uTime)) * smoothstep(0.6, 0.0, x);',
  sound: 'float seam = smoothstep(0.08, 0.0, abs(fract(along * 2.5 - uTime * 0.8) - 0.5));',
  holy: 'float seam = smoothstep(0.25, 0.0, x) + 0.4 * smoothstep(0.06, 0.0, abs(x - 0.7));',
  cosmic: 'float seam = smoothstep(0.55, 1.0, grain) * smoothstep(0.8, 0.0, x);',
  void: 'float seam = smoothstep(0.12, 0.0, abs(x - 0.55)) * grain;',
  arcane: 'float seam = step(0.55, abs(sin(along * 3.0 + uSeed))) * smoothstep(0.3, 0.0, x);',
  time: 'float seam = smoothstep(0.1, 0.0, abs(fract(along * 1.2 + uTime * 0.3) - 0.5)) * smoothstep(0.7, 0.0, x);'
};

const HEAD = (twist) => `
  uniform vec3 uOrigin;
  uniform vec3 uDir;
  uniform vec3 uSide;
  uniform float uLength;
  uniform float uRadius;
  uniform float uHeight;
  uniform float uThickness;
  uniform float uLanes;
  uniform float uAlong;
  uniform float uTravel;
  uniform float uSince;
  uniform float uLife;
  uniform float uWidth;
  vec3 trailPath(float s, float lane) {${PATH[TRAIL_FAMILY[twist]](twist)}
  }
  float trailPass(float s, float lane) {
    ${passGLSL(twist)}
  }`;

/**
 * The shader consts and the two factories, for a line spell's Materials file.
 * `field` and `color` are the spell's own element field expression and colour block.
 */
export function trailMaterialsSource(spell, twist, field, color) {
  return `
/* ---- the trail: the line cast's wake, along its own ${twist} path (LineTrail.js) ---- */

const TRAIL_VERTEX = /* glsl */ \`
${HEAD(twist)}
  varying vec2 vUv;
  varying float vLocal;
  varying float vAlong;
  varying float vAge;
  varying vec3 vWorld;
  varying float vViewZ;
  void main() {
    float s = position.x;
    float lane = position.z;
    vec3 p = trailPath(s, lane);
    vec3 t = trailPath(min(s + 0.01, 1.0), lane) - trailPath(max(s - 0.01, 0.0), lane);
    // Seconds since the head crossed this point; negative ahead of the head.
    float age = (uAlong - trailPass(s, lane)) * uTravel + uSince;
    float k = clamp(age / max(uLife, 0.05), 0.0, 1.0);
    float w = uWidth * pow(1.0 - k, 0.7) * smoothstep(-0.01, 0.06, age) * smoothstep(0.0, 0.04, s);
    w *= step(lane, uLanes - 0.5);
    vec3 across = normalize(cross(normalize(t + vec3(0.0, 1e-4, 0.0)), cameraPosition - p));
    p += across * position.y * w;
    vUv = vec2(s, position.y);
    vLocal = s;
    vAlong = s;
    vAge = age / max(uLife, 0.05);
    vWorld = p;
    vec4 mv = viewMatrix * vec4(p, 1.0);
    vViewZ = mv.z;
    gl_Position = projectionMatrix * mv;
  }
\`;

const TRAIL_FRAGMENT = /* glsl */ \`
  precision highp float;
  uniform float uTime;
  uniform float uSeed;
  uniform float uLength;
  uniform float uOpacity;
  uniform float uGlow;
  uniform float uEdge;
  uniform float uCore;
  uniform float uBreakup;
  uniform vec3 uColorA;
  uniform vec3 uColorB;
  uniform vec3 uColorC;
  uniform vec2 uResolution;
  uniform sampler2D uSceneDepth;
  uniform float uCameraNear;
  uniform float uCameraFar;
  uniform float uGlobalGlow;
  varying vec2 vUv;
  varying float vLocal;
  varying float vAlong;
  varying float vAge;
  varying vec3 vWorld;
  varying float vViewZ;
  \${noiseGLSL}
  \${commonGLSL}
  void main() {
    if (vAge < 0.0 || vAge > 1.0) discard;
    float x = abs(vUv.y);
    float field = ${field};
    float carved = clamp(field, 0.0, 1.0);
    ${color}
    float core = (1.0 - smoothstep(0.0, 0.32, x)) * (1.0 - vAge);
    col = mix(col, uColorB, core * uCore);
    // Breaks up from the tail forward, the way an old beam goes to embers.
    float n = snoise01(vec3(vLocal * uLength * 1.3 - uTime * 0.7, vUv.y * 1.4, uSeed));
    float hold = smoothstep(vAge * uBreakup - 0.10, vAge * uBreakup + 0.06, n);
    float mask = (1.0 - smoothstep(0.5, 1.0, x)) * hold * pow(1.0 - vAge, 1.2) * uOpacity;
    if (mask < 0.01) discard;
    vec2 screenUV = gl_FragCoord.xy / max(uResolution, vec2(1.0));
    mask *= softFade(uSceneDepth, screenUV, vViewZ, uCameraNear, uCameraFar, 0.25);
    gl_FragColor = vec4(col * mask * uGlow * uGlobalGlow, mask);
  }
\`;

const SCAR_VERTEX = /* glsl */ \`
${HEAD(twist)}
  varying vec2 vUv;
  varying float vAge;
  varying vec3 vWorld;
  varying float vViewZ;
  void main() {
    float s = position.x;
    float lane = position.z;
    vec3 p = trailPath(s, lane);
    vec3 t = trailPath(min(s + 0.01, 1.0), lane) - trailPath(max(s - 0.01, 0.0), lane);
    t.y = 0.0;
    float age = (uAlong - trailPass(s, lane)) * uTravel + uSince;
    float w = uWidth * smoothstep(-0.01, 0.1, age) * smoothstep(0.0, 0.05, s) * step(lane, uLanes - 0.5);
    vec3 across = normalize(cross(normalize(t + vec3(1e-4, 0.0, 0.0)), vec3(0.0, 1.0, 0.0)));
    p += across * position.y * w;
    p.y = 0.035;
    vUv = vec2(s, position.y);
    vAge = age / max(uLife, 0.05);
    vWorld = p;
    vec4 mv = viewMatrix * vec4(p, 1.0);
    vViewZ = mv.z;
    gl_Position = projectionMatrix * mv;
  }
\`;

const SCAR_FRAGMENT = /* glsl */ \`
  precision highp float;
  uniform float uTime;
  uniform float uSeed;
  uniform float uLength;
  uniform float uOpacity;
  uniform float uGlow;
  uniform vec3 uColorA;
  uniform vec3 uColorB;
  uniform vec2 uResolution;
  uniform sampler2D uSceneDepth;
  uniform float uCameraNear;
  uniform float uCameraFar;
  uniform float uGlobalGlow;
  varying vec2 vUv;
  varying float vAge;
  varying vec3 vWorld;
  varying float vViewZ;
  \${noiseGLSL}
  \${commonGLSL}
  void main() {
    if (vAge < 0.0 || vAge > 1.0) discard;
    float x = abs(vUv.y);
    float along = vUv.x * uLength;
    float grain = snoise(vec3(vWorld.xz * 1.1, uSeed)) * 0.5 + 0.5;
    ${SCAR[spell.element]}
    seam = clamp(seam, 0.0, 1.0);
    float cool = 1.0 - vAge;
    float mask = (1.0 - smoothstep(0.55, 1.0, x + (grain - 0.5) * 0.35)) * (0.45 + 0.55 * grain);
    mask *= smoothstep(1.0, 0.6, vAge) * uOpacity;
    if (mask < 0.01) discard;
    // Dark scorched bed, with the element's hot seam cooling out of it.
    vec3 col = uColorB * 0.35 + uColorA * seam * cool * cool * uGlow;
    vec2 screenUV = gl_FragCoord.xy / max(uResolution, vec2(1.0));
    mask *= softFade(uSceneDepth, screenUV, vViewZ, uCameraNear, uCameraFar, 0.4);
    gl_FragColor = vec4(col * uGlobalGlow, mask * (0.55 + 0.45 * seam));
  }
\`;

function trailUniforms() {
  return {
    uOrigin: { value: new Vector3() },
    uDir: { value: new Vector3(0, 0, 1) },
    uSide: { value: new Vector3(1, 0, 0) },
    uLength: { value: 1 },
    uRadius: { value: 1 },
    uHeight: { value: 1 },
    uThickness: { value: 0.3 },
    uLanes: { value: 1 },
    uAlong: { value: 0 },
    uTravel: { value: 0.5 },
    uSince: { value: 0 },
    uLife: { value: 1 },
    uWidth: { value: 0.3 },
    uSeed: { value: 0 },
    uOpacity: { value: 1 },
    uGlow: { value: 1 }
  };
}

function writeTrail(u, st, trail, travel, life, width, opacity, glow) {
  u.uOrigin.value.copy(st.origin);
  u.uDir.value.copy(st.dir);
  u.uSide.value.copy(st.side);
  u.uLength.value = st.length;
  u.uRadius.value = st.radius;
  u.uHeight.value = st.height;
  u.uThickness.value = st.thickness;
  u.uLanes.value = trail.lanes;
  u.uAlong.value = trail.along;
  u.uTravel.value = travel;
  u.uSince.value = trail.since;
  u.uLife.value = life;
  u.uWidth.value = width;
  u.uSeed.value = st.seed;
  u.uOpacity.value = opacity;
  u.uGlow.value = glow;
}

/** The ribbon along the path. \`travel\` is the seconds the head takes over the whole line. */
export function create${spell.cls}TrailMaterial() {
  const material = new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    depthTest: true,
    blending: AdditiveBlending,
    side: DoubleSide,
    toneMapped: false,
    uniforms: sharedUniforms({
      ...trailUniforms(),
      uEdge: { value: 1 },
      uCore: { value: 1 },
      uBreakup: { value: 1 },
      uColorA: { value: new Color() },
      uColorB: { value: new Color() },
      uColorC: { value: new Color() }
    }),
    vertexShader: TRAIL_VERTEX,
    fragmentShader: TRAIL_FRAGMENT
  });
  material.userData.sync = (st, trail, travel) => {
    const c = settings[ID];
    const g = settings.global;
    const u = material.uniforms;
    writeTrail(u, st, trail, travel, c.trailLife * g.lifetime, c.trailWidth, c.trailOpacity * g.opacity, c.trailGlow * g.glow);
    // The body's edge term is tuned for a small shape; along a whole line it would go white.
    u.uEdge.value = c.edgeGlow * g.glow * 0.3;
    u.uCore.value = c.trailCore;
    u.uBreakup.value = c.trailBreakup;
    u.uColorA.value.copy(getColor(c.colorA));
    u.uColorB.value.copy(getColor(c.colorB));
    u.uColorC.value.copy(getColor(c.colorC));
  };
  return material;
}

/** The scar the path leaves on the floor, cooling from the element's seam to a dark bed. */
export function create${spell.cls}ScarMaterial() {
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
      ...trailUniforms(),
      uColorA: { value: new Color() },
      uColorB: { value: new Color() }
    }),
    vertexShader: SCAR_VERTEX,
    fragmentShader: SCAR_FRAGMENT
  });
  material.userData.sync = (st, trail, travel) => {
    const c = settings[ID];
    const g = settings.global;
    const u = material.uniforms;
    writeTrail(u, st, trail, travel, c.scarLife * g.lifetime, c.scarWidth, c.scarOpacity * g.opacity, c.scarGlow * g.glow);
    u.uColorA.value.copy(getColor(c.colorScarA));
    u.uColorB.value.copy(getColor(c.colorScarB));
  };
  return material;
}
`;
}
