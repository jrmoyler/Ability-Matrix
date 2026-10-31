import { Color, DoubleSide, NormalBlending, ShaderMaterial, Vector2 } from 'three';
import { noiseGLSL } from '../../shaders/lib/noise.glsl.js';
import { commonGLSL } from '../../shaders/lib/common.glsl.js';
import { sharedUniforms } from '../../core/FrameUniforms.js';
import { settings } from '../../config/settings.js';
import { getColor } from '../../utils/color.js';

/**
 * The Resonance Pulse's three shaders: the pressure shell, the warp it bends
 * the frame with, and the ripple the boom sends across the floor.
 *
 * ## The shell is placed in the vertex stage
 *
 * The mesh is a plain `PlaneGeometry` grid and only its `uv` is used: `u` goes
 * once round the ring, `v` runs from the shell's apex (0) to its rim (1). The
 * vertex stage wraps that grid onto a spherical cap whose rim has a lateral
 * radius of `uRadius` and whose half-angle is `uSpread`, with the rim at local
 * z = 0 and the dome bulging forward along +Z — which the ability points down
 * the cast. A pressure front *is* a cap of a sphere, and building it this way
 * means the dome's curvature and the ring's radius are both live uniforms
 * rather than baked geometry: dragging `spread` re-curves rings that are
 * already in flight.
 *
 * ## The cap is a body, and the rim rolls into a lip
 *
 * The grid is split at `uSplit`: below it the rows are the cap; above it they
 * roll on past the rim around a tube of radius `uLip × uRadius`, curling back
 * over the shell by `uCurl` radians — the vortex ring a real pressure pulse
 * sheds at its edge. The material is normal-blended: the cap is a filled lens
 * of deep-violet compressed air (densest toward the front), the lip is lit by
 * the sun and streaked with air rolling round it, and only the hot stops of
 * the four-stop ramp (`uColorDeep` → `uColorBody` → `uColorTint` → `uColorRim`)
 * are pushed past 1 for the bloom.
 *
 * ## What the fragment draws on the cap
 *
 *  - a **rim**, a narrow gaussian at v = 1, sampled three times at offsets of
 *    ±`uChroma` and tinted red / green / blue, so the leading edge splits into
 *    its colours like a lens at the edge of its field — the classic read for a
 *    sound wave as opposed to a shockwave;
 *  - **interference bands** across the body: two travelling waves at a
 *    `uBeat` ratio multiplied together, which beat against each other the way
 *    two tones do, broken around the ring by `uLobes` standing-wave lobes;
 *  - a **fresnel** lift so the dome's silhouette reads even where it is thin;
 *  - **soft fade** against the depth prepass so the shell feathers where it
 *    cuts the floor instead of drawing a hard ellipse across it.
 */
const SHELL_VERTEX = /* glsl */ `
  uniform float uRadius;
  uniform float uSpread;
  uniform float uSplit;       // fraction of the grid that is the cap; the rest is the lip
  uniform float uLip;         // tube radius of the rolled lip, × the ring radius
  uniform float uCurl;        // radians the lip rolls back over itself
  uniform float uTime;
  uniform float uSeed;
  uniform float uLobes;
  uniform float uLobeDepth;

  varying vec2  vUv;
  varying vec3  vNormalW;
  varying vec3  vViewDir;
  varying float vViewZ;
  varying float vCapV;        // 0 apex → 1 rim, held at 1 across the lip
  varying float vLipV;        // 0 where the lip leaves the rim → 1 rolled under
  varying float vPart;        // 0 cap, 1 lip

  void main() {
    vUv = uv;
    float spread = max(uSpread, 0.05);
    float phi = uv.x * 6.28318530718;
    vec2 er = vec2(cos(phi), sin(phi));
    // Sphere radius chosen so the rim's lateral radius is exactly uRadius.
    float sphere = uRadius / sin(spread);
    float split = clamp(uSplit, 0.05, 0.98);
    // Standing-wave lobes breathe the lip in and out around the ring.
    float lobe = 1.0 + uLobeDepth * 0.35 * sin(phi * floor(uLobes + 0.5) + uTime * 2.1 + uSeed);

    vec3 local;
    vec3 n;
    if (uv.y <= split) {
      float cv = uv.y / split;
      vCapV = cv;
      vLipV = 0.0;
      vPart = 0.0;
      float theta = cv * spread;
      n = vec3(sin(theta) * er, cos(theta));
      local = vec3(n.xy, n.z - cos(spread)) * sphere;
    } else {
      float lv = (uv.y - split) / (1.0 - split);
      vCapV = 1.0;
      vLipV = lv;
      vPart = 1.0;
      float psi = lv * uCurl;
      float tube = uLip * uRadius * lobe;
      vec3 rimP = vec3(er * uRadius, 0.0);
      vec3 nr = vec3(sin(spread) * er, cos(spread));    // shell normal at the rim
      vec3 tr = vec3(cos(spread) * er, -sin(spread));   // on past the rim, down the meridian
      // The tube rolls about a centre just inside the rim: the leading edge
      // of the pressure front curls back over itself like a vortex ring.
      vec3 centre = rimP - nr * tube;
      n = nr * cos(psi) + tr * sin(psi);
      local = centre + n * tube;
    }

    vec4 world = modelMatrix * vec4(local, 1.0);
    vNormalW = normalize(mat3(modelMatrix) * n);
    vViewDir = cameraPosition - world.xyz;
    vec4 mv = viewMatrix * world;
    vViewZ = mv.z;
    gl_Position = projectionMatrix * mv;
  }
`;

const SHELL_FRAGMENT = /* glsl */ `
  precision highp float;

  uniform float uTime;
  uniform float uSeed;
  uniform float uFade;
  uniform float uRimWidth;
  uniform float uRimBright;
  uniform float uChroma;
  uniform float uFresnelPower;
  uniform float uFresnelBright;
  uniform float uBody;
  uniform float uBodyFill;
  uniform float uBodyCentre;
  uniform float uBodyGlow;
  uniform float uMottle;
  uniform float uMottleScale;
  uniform float uShade;
  uniform float uBodyTone;
  uniform float uBands;
  uniform float uBeat;
  uniform float uBandSpeed;
  uniform float uBandSharp;
  uniform float uLobes;
  uniform float uLobeDepth;
  uniform float uLipSpin;
  uniform float uLipBright;
  uniform float uLipOpacity;
  uniform float uIntensity;
  uniform float uOpacity;
  uniform float uSoftFade;
  uniform vec3  uColorRim;
  uniform vec3  uColorTint;
  uniform vec3  uColorBody;
  uniform vec3  uColorDeep;
  uniform vec3  uColorR;
  uniform vec3  uColorG;
  uniform vec3  uColorB;
  uniform vec3  uLightDir;

  uniform vec2      uResolution;
  uniform sampler2D uSceneDepth;
  uniform float     uCameraNear;
  uniform float     uCameraFar;
  uniform float     uGlobalGlow;
  uniform float     uShaderIntensity;

  varying vec2  vUv;
  varying vec3  vNormalW;
  varying vec3  vViewDir;
  varying float vViewZ;
  varying float vCapV;
  varying float vLipV;
  varying float vPart;

  ${noiseGLSL}
  ${commonGLSL}

  /** The four-stop ramp: deep → body → tint → white-hot. */
  vec3 ramp(float h) {
    h = clamp(h, 0.0, 1.0);
    vec3 c = mix(uColorDeep, uColorBody, smoothstep(0.0, 0.4, h));
    c = mix(c, uColorTint, smoothstep(0.4, 0.78, h));
    return mix(c, uColorRim, smoothstep(0.78, 1.0, h));
  }

  float rim(float v) {
    float d = (1.0 - v) / max(uRimWidth, 1e-3);
    return exp(-d * d);
  }

  void main() {
    float phi = vUv.x * 6.28318530718;
    vec3 N = normalize(vNormalW);
    vec3 V = normalize(vViewDir);
    float fres = fresnelTerm(vViewDir, vNormalW, uFresnelPower, 1.0) * uFresnelBright;
    float lobe = 1.0 - uLobeDepth * (0.5 + 0.5 * cos(phi * floor(uLobes + 0.5) + uTime * 1.3 + uSeed));

    vec3 base;
    vec3 emit;
    float alpha;

    if (vPart < 0.5) {
      /* ---------- the cap: a filled lens of compressed air ---------- */
      // The body is a *mass*, not a stack of bands: a lit, mottled lens whose
      // tone sits low on the ramp (deep → body, a touch of tint where the
      // pressure is highest), with the beat bands only a faint shimmer
      // through it. Seen end-on down the line it reads as a dark violet
      // pressure body, not concentric neon outlines.
      float v = vCapV;
      float phase = v * uBands * 6.28318530718 - uTime * uBandSpeed;
      float beat = (sin(phase) + sin(phase * uBeat + uSeed * 3.0)) * 0.5;
      float band = pow(clamp(beat * beat, 0.0, 1.0), uBandSharp * 0.5);
      float grain = 0.85 + 0.3 * snoise(vec3(phi * 1.5, v * 4.0, uTime * 0.8 + uSeed));
      // Densest toward the rim, where the front is compressed hardest.
      float comp = mix(uBodyCentre, 1.0, smoothstep(0.1, 0.95, v));
      float b = band * lobe * grain;
      // Swirling pressure cells (polar, not concentric) so the fill has form.
      vec2 pc = vec2(cos(phi), sin(phi)) * v * uMottleScale;
      float cellA = snoise(vec3(pc + uSeed, uTime * 0.9 - v * 1.4));
      float cellB = snoise(vec3(pc * 2.3 - uSeed, uTime * 1.6 + v * 2.0));
      float mott = clamp(0.5 + 0.35 * cellA + 0.2 * cellB, 0.0, 1.0);
      float press = comp * (1.0 - uMottle + uMottle * mott);
      // Lit like a volume: the sun-facing side of the lens lifts a little.
      float lit = mix(1.0, 0.55 + 0.75 * max(dot(N, normalize(uLightDir)), 0.0), uShade);

      // Mostly the deep stop: the body violet only where the air is
      // compressed hardest, so the lens has mass instead of glowing.
      base = mix(uColorDeep, uColorBody, clamp(uBodyTone * (0.25 + 0.75 * press) + 0.05 * b, 0.0, 1.0)) * lit;
      alpha = uBodyFill * comp * (0.82 + 0.18 * mott);

      // The chromatic edge where the cap meets the lip — a soft hot edge,
      // not a neon outline.
      float rr = rim(v + uChroma);
      float rg = rim(v);
      float rb = rim(v - uChroma);
      float white = min(rr, min(rg, rb));
      vec3 rimColor = (uColorR * rr + uColorG * rg + uColorB * rb) * 0.5 + uColorRim * white;
      emit = rimColor * uRimBright
           + ramp(0.42 + 0.3 * press) * press * press * uBodyGlow * uShaderIntensity
           + ramp(0.45 + b * 0.35) * b * uBody * uShaderIntensity
           + uColorBody * fres * 0.5;
      alpha = max(alpha, max(rr, max(rg, rb)) * 0.9);
    } else {
      /* ---------- the lip: a rolling vortex ring with thickness ---------- */
      vec3 L = normalize(uLightDir);
      float lambert = max(dot(N, L), 0.0);
      float facing = abs(dot(N, V));
      // Streaks of air rolling round the tube.
      float roll = snoise(vec3(phi * 7.0 + uSeed, vLipV * 3.0 - uTime * uLipSpin, uSeed));
      float streak = smoothstep(0.1, 0.8, roll);
      // Crest (just past the rim) is hottest, the rolled-under side is deep.
      float cx = vLipV * 2.6 - 0.35;
      float crest = exp(-cx * cx * 2.0);
      float h = clamp(0.12 + 0.36 * crest + 0.2 * lambert + 0.2 * streak * lobe, 0.0, 1.0);
      // The tube is the same dense air as the lens: deep-toned and lit by the
      // sun, with only the narrow crest running hot — nested lips seen
      // end-on must read as rolls of a body, not as a stack of neon rings.
      base = mix(uColorDeep, uColorBody, clamp(uBodyTone * (0.5 + 1.6 * h), 0.0, 1.0))
           * (0.5 + 0.5 * facing) * (0.7 + 0.6 * lambert);
      float hot = crest * crest * crest;
      emit = ramp(0.45 + 0.4 * h) * (hot * 0.9 + streak * hot * 0.3) * uLipBright + uColorBody * fres * 0.25;
      alpha = uLipOpacity * (0.75 + 0.25 * streak) * smoothstep(1.0, 0.85, vLipV);
    }

    alpha = clamp(alpha + fres * 0.1, 0.0, 1.0) * uFade * uOpacity;
    if (alpha < 0.003) discard;

    vec2 screenUV = gl_FragCoord.xy / uResolution;
    alpha *= softFade(uSceneDepth, screenUV, vViewZ, uCameraNear, uCameraFar, uSoftFade);
    if (alpha < 0.003) discard;

    vec3 color = base + emit * uIntensity * uGlobalGlow;
    gl_FragColor = vec4(color, alpha);
  }
`;

/**
 * The warp: same placement as the shell, but the fragment writes a
 * screen-space refraction offset instead of a colour (LAYER.DISTORTION, the
 * `createAcidFumeMaterial` convention — `vec4(dir * 0.5 + 0.5, strength,
 * mask)`). The direction is *radial on screen* from the ring's own centre, so
 * the frame is pushed outward across the rim the way air under pressure bends
 * light, not shivered at random.
 */
const WARP_SHELL_VERTEX = /* glsl */ `
  uniform float uRadius;
  uniform float uSpread;

  varying vec2 vUv;
  varying vec2 vScreen;
  varying vec2 vCentre;

  void main() {
    vUv = uv;
    float spread = max(uSpread, 0.05);
    float theta = uv.y * spread;
    float phi = uv.x * 6.28318530718;
    vec3 n = vec3(sin(theta) * cos(phi), sin(theta) * sin(phi), cos(theta));
    float sphere = uRadius / sin(spread);
    vec3 local = vec3(n.xy, n.z - cos(spread)) * sphere;

    vec4 clip = projectionMatrix * modelViewMatrix * vec4(local, 1.0);
    vec4 centre = projectionMatrix * modelViewMatrix * vec4(0.0, 0.0, 0.0, 1.0);
    vScreen = clip.xy / max(clip.w, 1e-4);
    vCentre = centre.xy / max(centre.w, 1e-4);
    gl_Position = clip;
  }
`;

const WARP_SHELL_FRAGMENT = /* glsl */ `
  uniform float uStrength;
  uniform float uWidth;
  uniform float uBody;
  uniform float uShaderIntensity;

  varying vec2 vUv;
  varying vec2 vScreen;
  varying vec2 vCentre;

  void main() {
    float d = (1.0 - vUv.y) / max(uWidth, 1e-3);
    float band = exp(-d * d);
    float mask = max(band, uBody * smoothstep(0.2, 1.0, vUv.y));
    float strength = uStrength * uShaderIntensity * mask;
    if (strength < 0.002) discard;

    vec2 dir = vScreen - vCentre;
    dir = length(dir) > 1e-5 ? normalize(dir) : vec2(0.0, 1.0);
    gl_FragColor = vec4(dir * 0.5 + 0.5, strength, mask);
  }
`;

/**
 * The boom's floor ripple — a flat quad, drawn in metres from the impact.
 *
 * A short train of wavelets races out to `floorRadius`. Each wavelet is a
 * gaussian ring split into red / green / blue by `floorChroma` metres, the
 * same lens trick as the shell rim, so the floor ripple and the rings read as
 * the same physics. One quad, two materials: the colour pass here, and a
 * `FLOOR_WARP` pass on LAYER.DISTORTION that bends the frame along the same
 * rings.
 */
const FLOOR_VERTEX = /* glsl */ `
  uniform float uQuadSize;

  varying vec2 vLocal;
  varying vec2 vScreen;
  varying vec2 vCentre;
  varying float vViewZ;

  void main() {
    vLocal = (uv - 0.5) * uQuadSize;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vViewZ = mv.z;
    vec4 clip = projectionMatrix * mv;
    vec4 centre = projectionMatrix * modelViewMatrix * vec4(0.0, 0.0, 0.0, 1.0);
    vScreen = clip.xy / max(clip.w, 1e-4);
    vCentre = centre.xy / max(centre.w, 1e-4);
    gl_Position = clip;
  }
`;

const FLOOR_COMMON = /* glsl */ `
  uniform float uFront;       // metres the leading wavelet has reached
  uniform float uRings;
  uniform float uWavelength;
  uniform float uWidth;
  uniform float uMaxRadius;

  /** Sum of the wavelet train at distance d from the centre. */
  float wavelets(float d) {
    float sum = 0.0;
    for (int k = 0; k < 6; k++) {
      if (float(k) >= uRings) break;
      float r = uFront - float(k) * uWavelength;
      if (r <= 0.0) continue;
      float x = (d - r) / max(uWidth, 1e-3);
      // Each trailing wavelet is weaker than the one ahead of it.
      sum += exp(-x * x) * (1.0 - float(k) / max(uRings, 1.0) * 0.6);
    }
    // Thins out as it runs to the edge of its reach.
    return sum * (1.0 - smoothstep(uMaxRadius * 0.6, uMaxRadius, d));
  }
`;

const FLOOR_FRAGMENT = /* glsl */ `
  precision highp float;

  uniform float uTime;
  uniform float uSeed;
  uniform float uChroma;
  uniform float uIntensity;
  uniform float uOpacity;
  uniform float uFade;
  uniform float uWake;        // 0..1 how dark the compressed band behind the front goes
  uniform float uWakeLength;  // metres of that band
  uniform vec3  uColorR;
  uniform vec3  uColorG;
  uniform vec3  uColorB;
  uniform vec3  uColorRim;
  uniform vec3  uColorDeep;
  uniform vec3  uColorBody;
  uniform float uGlobalGlow;

  varying vec2 vLocal;
  varying float vViewZ;

  ${noiseGLSL}
  ${FLOOR_COMMON}

  void main() {
    float d = length(vLocal);
    // The shockwave is a filled band of compressed air dragged across the
    // floor — dark deep-violet behind a hot crest — not a set of outlines.
    float reach = 1.0 - smoothstep(uMaxRadius * 0.6, uMaxRadius, d);
    float th = atan(vLocal.y, vLocal.x);
    float ragged = 0.18 * uWakeLength * snoise(vec3(cos(th) * 2.0, sin(th) * 2.0, uTime * 1.5));
    float inner = uFront - uWakeLength + ragged;
    float wake = smoothstep(inner, uFront - uWidth, d) * (1.0 - smoothstep(uFront - uWidth * 0.5, uFront + uWidth, d));
    wake *= reach * step(0.0, uFront - 0.05);
    float grain = 0.8 + 0.2 * snoise(vec3(vLocal * 3.0, uTime));

    float r = wavelets(d + uChroma);
    float g = wavelets(d);
    float b = wavelets(d - uChroma);
    float crest = clamp(max(r, max(g, b)), 0.0, 1.0);
    float white = min(r, min(g, b));
    vec3 hot = (uColorR * r + uColorG * g + uColorB * b) * 0.6 + uColorRim * white * 1.2;

    vec3 body = mix(uColorDeep, uColorBody * 0.3, wake * wake * grain);
    vec3 color = mix(body, hot * uIntensity * uGlobalGlow, crest);
    float alpha = max(wake * uWake * grain, crest) * uFade * uOpacity;
    if (alpha < 0.003) discard;
    gl_FragColor = vec4(color, alpha);
  }
`;

const FLOOR_WARP_FRAGMENT = /* glsl */ `
  uniform float uStrength;
  uniform float uShaderIntensity;

  varying vec2 vLocal;
  varying vec2 vScreen;
  varying vec2 vCentre;

  ${FLOOR_COMMON}

  void main() {
    float mask = clamp(wavelets(length(vLocal)), 0.0, 1.0);
    float strength = uStrength * uShaderIntensity * mask;
    if (strength < 0.002) discard;
    vec2 dir = vScreen - vCentre;
    dir = length(dir) > 1e-5 ? normalize(dir) : vec2(0.0, 1.0);
    gl_FragColor = vec4(dir * 0.5 + 0.5, strength, mask);
  }
`;

/* ==================================================================== */
/* Factories                                                             */
/* ==================================================================== */

/** One pressure shell. Each ring owns one, so each has its own envelope. */
export function createResonanceShellMaterial() {
  const material = new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    depthTest: true,
    blending: NormalBlending,
    side: DoubleSide,
    toneMapped: false,
    uniforms: sharedUniforms({
      uSeed: { value: Math.random() * 10 },
      uRadius: { value: 1 },
      uSpread: { value: 0.8 },
      uSplit: { value: 0.8 },
      uLip: { value: 0.15 },
      uCurl: { value: 4.4 },
      uBodyFill: { value: 0.6 },
      uBodyCentre: { value: 0.3 },
      uBodyGlow: { value: 0.5 },
      uMottle: { value: 0.6 },
      uMottleScale: { value: 2.2 },
      uShade: { value: 0.5 },
      uBodyTone: { value: 0.5 },
      uLipSpin: { value: 2.5 },
      uLipBright: { value: 1.4 },
      uLipOpacity: { value: 0.9 },
      uColorTint: { value: new Color(1, 0.6, 0.85) },
      uColorDeep: { value: new Color(0.02, 0.0, 0.05) },
      uFade: { value: 1 },
      uRimWidth: { value: 0.05 },
      uRimBright: { value: 3 },
      uChroma: { value: 0.04 },
      uFresnelPower: { value: 2.4 },
      uFresnelBright: { value: 0.9 },
      uBody: { value: 0.3 },
      uBands: { value: 6 },
      uBeat: { value: 1.65 },
      uBandSpeed: { value: 16 },
      uBandSharp: { value: 3 },
      uLobes: { value: 5 },
      uLobeDepth: { value: 0.35 },
      uIntensity: { value: 2 },
      uOpacity: { value: 1 },
      uSoftFade: { value: 0.45 },
      uColorRim: { value: new Color(1, 1, 1) },
      uColorBody: { value: new Color(0.8, 0.6, 1) },
      uColorR: { value: new Color(1, 0.3, 0.6) },
      uColorG: { value: new Color(0.6, 1, 0.9) },
      uColorB: { value: new Color(0.4, 0.5, 1) }
    }),
    vertexShader: SHELL_VERTEX,
    fragmentShader: SHELL_FRAGMENT
  });

  /**
   * @param {object} state { radius, fade, seed, spread?, lip?, fill? } — the
   *   ring's own envelope; `spread` overrides the train's dome angle (the boom
   *   domes and the hum), `lip` and `fill` scale the lip and the body.
   */
  material.userData.sync = (state) => {
    const c = settings.sonic;
    const g = settings.global;
    const u = material.uniforms;

    u.uSeed.value = state.seed;
    u.uRadius.value = state.radius;
    u.uFade.value = state.fade;
    u.uSpread.value = state.spread > 0 ? state.spread : c.spread;
    u.uSplit.value = c.capSplit;
    u.uLip.value = c.lipSize * (state.lip ?? 1);
    u.uCurl.value = c.lipCurl;
    u.uBodyFill.value = c.bodyFill * (state.fill ?? 1);
    u.uBodyCentre.value = c.bodyCentre;
    u.uBodyGlow.value = c.bodyGlow * (state.glow ?? 1);
    u.uMottle.value = c.bodyMottle * g.noiseStrength;
    u.uMottleScale.value = c.bodyMottleScale * g.noiseFrequency;
    u.uShade.value = c.bodyShade;
    u.uBodyTone.value = c.bodyTone * (state.tone ?? 1);
    u.uLipSpin.value = c.lipSpin * g.noiseSpeed;
    u.uLipBright.value = c.lipBright;
    u.uLipOpacity.value = c.lipOpacity;
    u.uColorTint.value.copy(getColor(c.colorTint));
    u.uColorDeep.value.copy(getColor(c.colorDeep));
    u.uRimWidth.value = c.rimWidth;
    u.uRimBright.value = c.rimBright;
    u.uChroma.value = c.chroma * g.shaderIntensity;
    u.uFresnelPower.value = c.fresnelPower;
    u.uFresnelBright.value = c.fresnelBright * g.fresnel;
    u.uBody.value = c.bodyOpacity;
    u.uBands.value = c.bands * g.noiseFrequency;
    u.uBeat.value = c.beat;
    u.uBandSpeed.value = c.bandSpeed * g.noiseSpeed;
    u.uBandSharp.value = c.bandSharp;
    u.uLobes.value = c.lobes;
    u.uLobeDepth.value = c.lobeDepth * g.noiseStrength;
    u.uIntensity.value = c.intensity * g.glow;
    u.uOpacity.value = c.opacity * g.opacity;
    u.uSoftFade.value = c.softFade;

    u.uColorRim.value.copy(getColor(c.colorRim));
    u.uColorBody.value.copy(getColor(c.colorBody));
    u.uColorR.value.copy(getColor(c.colorChromaR));
    u.uColorG.value.copy(getColor(c.colorChromaG));
    u.uColorB.value.copy(getColor(c.colorChromaB));
  };

  return material;
}

/** The warp under one pressure shell (LAYER.DISTORTION). */
export function createResonanceWarpMaterial() {
  const material = new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    depthTest: false,
    blending: NormalBlending,
    side: DoubleSide,
    toneMapped: false,
    uniforms: sharedUniforms({
      uRadius: { value: 1 },
      uSpread: { value: 0.8 },
      uStrength: { value: 1 },
      uWidth: { value: 0.16 },
      uBody: { value: 0.2 }
    }),
    vertexShader: WARP_SHELL_VERTEX,
    fragmentShader: WARP_SHELL_FRAGMENT
  });

  /** @param {object} state { radius, fade } */
  material.userData.sync = (state) => {
    const c = settings.sonic;
    const g = settings.global;
    const u = material.uniforms;
    u.uRadius.value = state.radius;
    u.uSpread.value = state.spread > 0 ? state.spread : c.spread;
    u.uStrength.value = state.fade * c.warpStrength * g.distortion * (state.warp ?? 1);
    u.uWidth.value = c.warpWidth;
    u.uBody.value = c.warpBody;
  };

  return material;
}

/**
 * The boom's floor ripple.
 * @param {'color'|'warp'} pass which of the two passes this material draws
 */
export function createResonanceFloorMaterial(pass = 'color') {
  const warp = pass === 'warp';
  const material = new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    depthTest: !warp,
    blending: NormalBlending,
    side: DoubleSide,
    toneMapped: false,
    uniforms: sharedUniforms({
      uQuadSize: { value: 20 },
      uFront: { value: 0 },
      uRings: { value: 3 },
      uWavelength: { value: 0.8 },
      uWidth: { value: 0.14 },
      uMaxRadius: { value: 9 },
      uChroma: { value: 0.09 },
      uIntensity: { value: 2 },
      uOpacity: { value: 1 },
      uFade: { value: 1 },
      uStrength: { value: 1 },
      uColorR: { value: new Color(1, 0.3, 0.6) },
      uColorG: { value: new Color(0.6, 1, 0.9) },
      uColorB: { value: new Color(0.4, 0.5, 1) },
      uColorRim: { value: new Color(1, 1, 1) },
      uColorDeep: { value: new Color() },
      uColorBody: { value: new Color() },
      uWake: { value: 0.6 },
      uWakeLength: { value: 2.4 },
      uSeed: { value: Math.random() * 10 }
    }),
    vertexShader: FLOOR_VERTEX,
    fragmentShader: warp ? FLOOR_WARP_FRAGMENT : FLOOR_FRAGMENT
  });

  /** @param {object} state { quadSize, front, fade } */
  material.userData.sync = (state) => {
    const c = settings.sonic;
    const g = settings.global;
    const u = material.uniforms;
    u.uQuadSize.value = state.quadSize;
    u.uFront.value = state.front;
    u.uFade.value = state.fade;
    u.uRings.value = Math.max(1, Math.min(6, Math.round(c.floorRings)));
    u.uWavelength.value = c.floorWavelength;
    u.uWidth.value = c.floorWidth;
    u.uMaxRadius.value = Math.max(0.1, c.floorRadius * g.explosionIntensity);
    u.uChroma.value = c.floorChroma * g.shaderIntensity;
    u.uIntensity.value = c.floorIntensity * g.glow;
    u.uOpacity.value = c.opacity * g.opacity;
    u.uStrength.value = state.fade * c.boomWarp * g.distortion;
    u.uColorR.value.copy(getColor(c.colorChromaR));
    u.uColorG.value.copy(getColor(c.colorChromaG));
    u.uColorB.value.copy(getColor(c.colorChromaB));
    u.uColorRim.value.copy(getColor(c.colorRim));
    u.uColorDeep.value.copy(getColor(c.colorDeep));
    u.uColorBody.value.copy(getColor(c.colorBody));
    u.uWake.value = c.floorWake * g.opacity;
    u.uWakeLength.value = c.floorWakeLength * g.explosionIntensity;
  };

  return material;
}

/* ==================================================================== */
/* The Chladni plate — the floor sorts itself into the sound's figure     */
/* ==================================================================== */

/**
 * Sand on a vibrating plate runs off the parts that move and piles up on the
 * nodal lines that do not — a Chladni figure. This floor layer is that: a dark
 * stain where the floor is shaking (the cast's deep tone on the ground) with
 * bright sorted ridges along the nodal lines, coloured up the same ramp as the
 * shells and pulsing with the hum.
 *
 * Two shapes from one shader:
 *  - `disc` (uMode 0) — the plate the boom leaves: a circular mode
 *    cos(nθ)·sin(kπr) that *morphs* between two modes over the linger, so the
 *    lines visibly crawl into a new figure while it hangs;
 *  - `lane` (uMode 1) — the strip the train lays down the line: a standing
 *    wave grid across and along the path, revealed behind the lead ring.
 */
const PLATE_VERTEX = /* glsl */ `
  uniform vec2 uQuad;
  varying vec2 vLocal;
  void main() {
    vLocal = (uv - 0.5) * uQuad;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const PLATE_FRAGMENT = /* glsl */ `
  precision highp float;

  uniform float uTime;
  uniform float uSeed;
  uniform float uMode;        // 0 disc, 1 lane
  uniform vec2  uQuad;
  uniform float uRadius;      // disc radius / lane half-width, metres
  uniform float uLength;      // lane length, metres
  uniform float uReveal;      // disc: metres reached · lane: metres down the line
  uniform float uMorph;       // 0..1 between the two disc modes
  uniform vec2  uModeA;       // (nodal diameters, nodal circles)
  uniform vec2  uModeB;
  uniform float uStripe;      // lane: wavelength along, metres
  uniform float uAcross;      // lane: nodes across
  uniform float uLineWidth;
  uniform float uGrain;
  uniform float uStain;
  uniform float uGlow;
  uniform float uHum;         // 0..1 the beat
  uniform float uFade;
  uniform float uDissolve;
  uniform float uLineAmt;
  uniform float uBodyMix;
  uniform float uRimGlow;
  uniform float uRimW;
  uniform vec3  uColorDeep;
  uniform vec3  uColorBody;
  uniform vec3  uColorTint;
  uniform vec3  uColorRim;
  uniform float uGlobalGlow;
  uniform float uShaderIntensity;

  varying vec2 vLocal;

  ${noiseGLSL}

  vec3 ramp(float h) {
    h = clamp(h, 0.0, 1.0);
    vec3 c = mix(uColorDeep, uColorBody, smoothstep(0.0, 0.4, h));
    c = mix(c, uColorTint, smoothstep(0.4, 0.78, h));
    return mix(c, uColorRim, smoothstep(0.78, 1.0, h));
  }

  float discMode(vec2 m, float r, float th) {
    return cos(floor(m.x + 0.5) * th + uSeed) * sin(max(m.y, 0.5) * 3.14159265 * r);
  }

  void main() {
    float edgeN = snoise(vec3(vLocal * 0.9, uSeed)) * 0.12;
    float pattern;
    float mask;
    float hot;

    if (uMode < 0.5) {
      float d = length(vLocal);
      float r = d / max(uRadius, 0.01);
      float th = atan(vLocal.y, vLocal.x);
      float pa = discMode(uModeA, r, th);
      float pb = discMode(uModeB, r, th + 0.4);
      pattern = mix(pa, pb, smoothstep(0.0, 1.0, uMorph));
      mask = (1.0 - smoothstep(0.7, 1.0, r + edgeN)) * (1.0 - smoothstep(uReveal - 0.4, uReveal, d));
      hot = 1.0 - r * 0.6;
    } else {
      float along = vLocal.y + uLength * 0.5;
      // The lane widens with the rings that laid it.
      float laneHalf = uRadius * mix(0.22, 1.0, sqrt(clamp(along / max(uLength, 0.1), 0.0, 1.0)));
      float ax = vLocal.x / max(laneHalf, 0.01);
      float acrossWave = uAcross > 0.01 ? cos(uAcross * 3.14159265 * ax + uSeed) : 1.0;
      // Ridges bowed and wandering like real sand ripples, not ruled lines.
      float wander = along + 0.35 * snoise(vec3(vLocal * 0.45, uSeed)) - 0.25 * ax * ax;
      pattern = acrossWave * sin(6.28318530718 * wander / max(uStripe, 0.05) + uSeed * 2.0);
      mask = (1.0 - smoothstep(0.65, 1.0, abs(ax) + edgeN))
           * smoothstep(0.6, 1.8, along)
           * (1.0 - smoothstep(uReveal - 0.8, uReveal, along));
      hot = 0.6 + 0.4 * smoothstep(uLength * 0.4, uLength, along);
    }
    if (mask < 0.004) discard;

    // Sand on the nodal lines, gritty.
    float w = uLineWidth * (1.0 + 0.4 * uHum);
    float line = 1.0 - smoothstep(0.0, w, abs(pattern));
    float grit = smoothstep(0.25, 0.75, snoise(vec3(vLocal * uGrain, uSeed)) * 0.5 + 0.5);
    line *= (0.55 + 0.45 * grit) * uLineAmt;
    if (uDissolve > 0.0) line *= smoothstep(uDissolve - 0.1, uDissolve + 0.1, snoise(vec3(vLocal * 2.2, uSeed + 4.0)) * 0.5 + 0.5);

    // The rest of the plate is shaking: the deep stain, darker at the antinodes.
    float anti = smoothstep(0.2, 1.0, abs(pattern));
    vec3 base = mix(uColorDeep, uColorBody * 0.6, (0.35 + 0.65 * (1.0 - anti)) * uBodyMix);
    // A pressed crater lip: the floor was struck here, and it stays struck.
    float rimD = uMode < 0.5 ? (length(vLocal) / max(uRadius, 0.01) - 0.74 - edgeN * 0.5) / max(uRimW, 0.005) : 9.0;
    float crater = exp(-rimD * rimD);
    float h = clamp(0.35 + 0.35 * hot + 0.35 * uHum, 0.0, 1.0);
    vec3 lineColor = ramp(h);
    vec3 color = mix(base, lineColor, line) + ramp(h) * line * uHum * uGlow * uGlobalGlow * uShaderIntensity * 0.8;
    color = mix(color, ramp(0.3 + 0.15 * uHum), crater * 0.8) + ramp(0.45) * crater * uRimGlow * (0.6 + 0.4 * uHum) * uGlobalGlow;

    float alpha = max(max(uStain * (0.65 + 0.35 * anti), line), crater * min(1.0, uRimGlow)) * mask * uFade;
    if (alpha < 0.004) discard;
    gl_FragColor = vec4(color, alpha);
  }
`;

/**
 * @param {'disc'|'lane'} kind
 */
export function createResonancePlateMaterial(kind = 'disc') {
  const lane = kind === 'lane';
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
      uSeed: { value: Math.random() * 10 },
      uMode: { value: lane ? 1 : 0 },
      uQuad: { value: new Vector2(1, 1) },
      uRadius: { value: 4 },
      uLength: { value: 10 },
      uReveal: { value: 0 },
      uMorph: { value: 0 },
      uModeA: { value: new Vector2(3, 2) },
      uModeB: { value: new Vector2(5, 3) },
      uStripe: { value: 1.2 },
      uAcross: { value: 2 },
      uLineWidth: { value: 0.12 },
      uGrain: { value: 30 },
      uStain: { value: 0.7 },
      uGlow: { value: 2 },
      uHum: { value: 0 },
      uFade: { value: 1 },
      uDissolve: { value: 0 },
      uLineAmt: { value: 1 },
      uBodyMix: { value: 0.5 },
      uRimGlow: { value: 0.8 },
      uRimW: { value: 0.06 },
      uColorDeep: { value: new Color() },
      uColorBody: { value: new Color() },
      uColorTint: { value: new Color() },
      uColorRim: { value: new Color() }
    }),
    vertexShader: PLATE_VERTEX,
    fragmentShader: PLATE_FRAGMENT
  });

  /** @param {object} s { seed, quadX, quadY, radius, length, reveal, morph, hum, fade, dissolve } */
  material.userData.sync = (s) => {
    const c = settings.sonic;
    const g = settings.global;
    const u = material.uniforms;
    u.uSeed.value = s.seed;
    u.uQuad.value.set(s.quadX, s.quadY);
    u.uRadius.value = s.radius;
    u.uLength.value = s.length;
    u.uReveal.value = s.reveal;
    u.uMorph.value = s.morph;
    u.uHum.value = s.hum;
    u.uFade.value = s.fade;
    u.uDissolve.value = s.dissolve;
    u.uModeA.value.set(c.plateModeA, c.plateRingsA);
    u.uModeB.value.set(c.plateModeB, c.plateRingsB);
    u.uStripe.value = c.laneStripe;
    u.uAcross.value = c.laneAcross;
    u.uLineWidth.value = c.plateLineWidth;
    u.uGrain.value = c.plateGrain * g.noiseFrequency;
    u.uStain.value = (lane ? c.laneStain : c.plateStain) * g.opacity;
    u.uLineAmt.value = lane ? c.laneLines : 1;
    u.uBodyMix.value = c.plateBodyMix;
    u.uRimGlow.value = lane ? 0 : c.plateRimGlow;
    u.uRimW.value = c.plateRimWidth;
    u.uGlow.value = c.plateGlow * g.glow * (lane ? c.laneLines * 0.4 : 1);
    u.uColorDeep.value.copy(getColor(c.colorDeep));
    u.uColorBody.value.copy(getColor(c.colorBody));
    u.uColorTint.value.copy(getColor(c.colorTint));
    u.uColorRim.value.copy(getColor(c.colorRim));
  };
  return material;
}
