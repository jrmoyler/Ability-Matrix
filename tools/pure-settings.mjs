// Live-settings blocks for the eighty pure-element castables.
//
// A castable's tuning follows from three things in `pure-spells.mjs`: its
// element (weight, tempo, how much it sheds), its archetype (what shape it
// is) and its variant (0..2, how hard the same shape is pushed). This module
// turns those into the `config/codex/<id>.js` data block. The numbers are
// rounded and grouped, and every key has a one-line note, so a config reads
// like the hand-written ones next to it.
import { SPELLS } from './pure-spells.mjs';

export const SHAPE = {
  spire: 'a ring of standing columns',
  lance: 'a drilling blade riding the line',
  well: 'a floor that inhales, then a column',
  whip: 'a sheet that shears sideways as it travels',
  cage: 'bars that drop in a ring and then move',
  volley: 'a fan of bolts on staggered arcs',
  pendulum: 'a blade hinged at the hand',
  halo: 'a ring that walks, then commits'
};

/**
 * How each element behaves. Multipliers are against a neutral 1.0.
 * `kind` is the stock piece DetailLayer falls back to (see DetailLayer.js); every cast now
 * throws its own authored piece (tools/rigs), so only a missing rig would use it.
 */
export const PROFILE = {
  earth: { speed: 0.85, impulse: 1.25, lift: 0.9, shake: 1.3, flash: 0.8, dust: 1.3, streak: 0.6, chip: 1.5, spin: 0.6, glow: 0.8, flicker: 0.12, lens: 0.6, kind: 'chunk', size: 0.55, solid: true, mote: 'dust' },
  crystal: { speed: 1.0, impulse: 1.0, lift: 1.0, shake: 0.9, flash: 1.1, dust: 0.5, streak: 1.4, chip: 1.3, spin: 1.0, glow: 1.3, flicker: 0.35, lens: 0.9, kind: 'shard', size: 0.6, solid: true, mote: 'glint' },
  wind: { speed: 1.35, impulse: 0.8, lift: 1.2, shake: 0.6, flash: 0.7, dust: 1.0, streak: 1.6, chip: 0.4, spin: 1.5, glow: 0.9, flicker: 0.3, lens: 1.2, kind: 'blade', size: 0.5, solid: false, mote: 'leaf' },
  sound: { speed: 1.0, impulse: 1.0, lift: 1.0, shake: 0.9, flash: 0.8, dust: 0.6, streak: 1.2, chip: 0.3, spin: 1.2, glow: 1.0, flicker: 0.5, lens: 1.3, kind: 'ring', size: 0.65, solid: false, mote: 'glint' },
  light: { speed: 1.4, impulse: 0.9, lift: 1.0, shake: 0.7, flash: 1.4, dust: 0.4, streak: 1.8, chip: 0.3, spin: 1.0, glow: 1.5, flicker: 0.5, lens: 0.8, kind: 'rod', size: 0.45, solid: false, mote: 'glint' },
  holy: { speed: 1.0, impulse: 0.9, lift: 1.4, shake: 0.8, flash: 1.3, dust: 0.6, streak: 1.2, chip: 0.3, spin: 0.8, glow: 1.4, flicker: 0.2, lens: 0.7, kind: 'petal', size: 0.6, solid: false, mote: 'glint' },
  cosmic: { speed: 1.1, impulse: 1.0, lift: 1.1, shake: 1.0, flash: 1.2, dust: 0.8, streak: 1.4, chip: 0.5, spin: 1.0, glow: 1.3, flicker: 0.3, lens: 1.0, kind: 'orb', size: 0.5, solid: false, mote: 'glint' },
  gravity: { speed: 0.8, impulse: 1.3, lift: 0.6, shake: 1.4, flash: 0.8, dust: 1.0, streak: 0.5, chip: 1.2, spin: 0.7, glow: 0.9, flicker: 0.1, lens: 1.5, kind: 'boulder', size: 0.7, solid: true, mote: 'dust' },
  shadow: { speed: 1.1, impulse: 1.0, lift: 0.9, shake: 0.8, flash: 0.5, dust: 1.5, streak: 0.8, chip: 0.6, spin: 1.0, glow: 0.6, flicker: 0.4, lens: 0.9, kind: 'fang', size: 0.55, solid: false, mote: 'dust' },
  void: { speed: 1.0, impulse: 1.1, lift: 0.7, shake: 1.0, flash: 0.6, dust: 1.2, streak: 0.9, chip: 0.4, spin: 1.2, glow: 0.7, flicker: 0.25, lens: 1.6, kind: 'disc', size: 0.6, solid: false, mote: 'dust' },
  arcane: { speed: 1.05, impulse: 0.95, lift: 1.1, shake: 0.8, flash: 1.0, dust: 0.5, streak: 1.3, chip: 0.4, spin: 1.3, glow: 1.3, flicker: 0.45, lens: 0.9, kind: 'rune', size: 0.55, solid: false, mote: 'glint' },
  illusion: { speed: 1.2, impulse: 0.8, lift: 1.0, shake: 0.6, flash: 1.1, dust: 0.4, streak: 1.1, chip: 0.3, spin: 1.1, glow: 1.1, flicker: 0.6, lens: 1.4, kind: 'pane', size: 0.6, solid: false, mote: 'glint' },
  time: { speed: 0.95, impulse: 0.9, lift: 1.0, shake: 0.7, flash: 0.9, dust: 0.5, streak: 1.0, chip: 0.5, spin: 0.9, glow: 1.1, flicker: 0.2, lens: 1.1, kind: 'cog', size: 0.55, solid: true, mote: 'glint' },
  motion: { speed: 1.5, impulse: 1.1, lift: 0.8, shake: 0.9, flash: 0.8, dust: 0.9, streak: 1.7, chip: 0.7, spin: 1.4, glow: 1.0, flicker: 0.3, lens: 1.1, kind: 'bar', size: 0.5, solid: true, mote: 'glint' },
  tech: { speed: 1.2, impulse: 1.0, lift: 0.9, shake: 0.8, flash: 1.0, dust: 0.5, streak: 1.3, chip: 1.0, spin: 1.0, glow: 1.1, flicker: 0.4, lens: 0.8, kind: 'block', size: 0.45, solid: true, mote: 'glint' },
  force: { speed: 1.1, impulse: 1.4, lift: 1.0, shake: 1.3, flash: 0.9, dust: 0.9, streak: 1.0, chip: 1.0, spin: 0.9, glow: 1.0, flicker: 0.2, lens: 1.2, kind: 'wedge', size: 0.6, solid: true, mote: 'dust' }
};

/**
 * The two element classes. A **solid** element (earth, crystal, gravity, time,
 * motion, tech, force) is matter: its hero rig and pieces are a patched
 * `MeshStandardMaterial` lit by the scene sun, casting and receiving shadows,
 * with the four-stop ramp as albedo and only its hot parts emissive. Every
 * other element is **energy**: emissive, but with a dark body and a fresnel
 * shell so it reads as a volume rather than a wireframe. `rough`/`metal` are
 * the solid's PBR defaults (stone is rough, brass and alloy are metal).
 */
export const MATTER = {
  earth: { rough: 0.92, metal: 0.0 },
  crystal: { rough: 0.16, metal: 0.08 },
  gravity: { rough: 0.55, metal: 0.45 },
  time: { rough: 0.32, metal: 0.85 },
  motion: { rough: 0.38, metal: 0.62 },
  tech: { rough: 0.34, metal: 0.8 },
  force: { rough: 0.5, metal: 0.3 }
};

/**
 * How pale the ground field the element leaves lies, 0 (a dark stain or
 * scorch) .. 1 (a pale coat: rime, glare, scoured sand). Solid elements burn
 * or crack the floor dark; crystal and the radiant elements frost or bleach it.
 */
export const GROUND_COAT = {
  earth: 0.12, crystal: 0.55, wind: 0.35, sound: 0.2, light: 0.42, holy: 0.4, cosmic: 0.1, gravity: 0.05,
  shadow: 0.0, void: 0.0, arcane: 0.12, illusion: 0.25, time: 0.2, motion: 0.1, tech: 0.08, force: 0.08
};

/** The residue decal the impact leaves for after the cast is gone: filled, never a ring. */
export const RESIDUE = {
  crystal: 'FROST'
};
export const residueFor = (element) => RESIDUE[element] ?? 'SCORCH';

/**
 * Hero rig defaults by archetype: [size m, ring fit, travel m, turn, fold].
 * Size scales the whole rig, ring fit is the share of a circle's radius a ring
 * rig spans, travel is how far it rises, drops or arcs, turn is its spin.
 */
const HERO = {
  spire: [2.4, 0.8, 2, 0.35, 1],
  lance: [1.8, 1, 0.9, 1, 1],
  well: [2, 0.7, 1.5, 0.5, 1],
  whip: [2, 1, 0.8, 1, 1],
  cage: [1.6, 0.85, 3, 0.4, 1],
  volley: [1.4, 1, 2.2, 1.5, 1],
  pendulum: [3, 1, 0.9, 1, 1],
  halo: [1.4, 0.85, 0.6, 1.2, 1]
};

/** Detail layer defaults by archetype: [count, lift in metres]. */
const DETAIL = {
  spire: [14, 2.4],
  lance: [16, 1.2],
  well: [18, 3.2],
  whip: [14, 1.4],
  cage: [12, 2.6],
  volley: [12, 1.0],
  pendulum: [14, 1.6],
  halo: [16, 0.9]
};

/**
 * What a felled body wears afterwards, by element — the older Codex casts char,
 * frost, salt or anoint the bodies they hit, and these do too. `body` is the
 * diffuse the body is stained toward, `amount` how far (0..1), `time` the
 * seconds it takes to set in. Rim and edge take the spell's own colours.
 */
export const MARK = {
  earth: { verb: 'caked in dust', body: '#3a2a1a', amount: 0.7, time: 0.5 },
  crystal: { verb: 'glassed over', body: '#2a2440', amount: 0.75, time: 0.35 },
  wind: { verb: 'scoured pale', body: '#3a4a46', amount: 0.5, time: 0.25 },
  sound: { verb: 'left ringing', body: '#2c3420', amount: 0.55, time: 0.2 },
  light: { verb: 'seared white', body: '#3a3020', amount: 0.8, time: 0.2 },
  holy: { verb: 'anointed in gold', body: '#3a2e14', amount: 0.75, time: 0.4 },
  cosmic: { verb: 'starred through', body: '#141a3a', amount: 0.8, time: 0.4 },
  gravity: { verb: 'turned to lead', body: '#1a1a20', amount: 0.85, time: 0.5 },
  shadow: { verb: 'shrouded', body: '#08080c', amount: 0.9, time: 0.6 },
  void: { verb: 'hollowed out', body: '#050308', amount: 0.95, time: 0.5 },
  arcane: { verb: 'inscribed', body: '#24143a', amount: 0.75, time: 0.35 },
  illusion: { verb: 'glamoured', body: '#3a1a34', amount: 0.6, time: 0.3 },
  time: { verb: 'aged to sepia', body: '#3a3024', amount: 0.85, time: 0.9 },
  motion: { verb: 'smeared', body: '#2a2a30', amount: 0.5, time: 0.2 },
  tech: { verb: 'shorted out', body: '#101820', amount: 0.7, time: 0.15 },
  force: { verb: 'bruised', body: '#2a1410', amount: 0.7, time: 0.3 }
};

/** A small emblem per element, laid over the archetype mark on the card. */
export const ELEMENT_MARK = {
  earth: '<path d="M70 82L78 66L86 82Z"/>',
  crystal: '<path d="M78 62L86 72L78 84L70 72Z"/>',
  wind: '<path d="M68 70C74 64 82 76 88 70"/>',
  sound: '<path d="M70 66C76 70 76 80 70 84M78 62C88 70 88 82 78 88"/>',
  light: '<path d="M78 62V74M72 68H84M73 63L83 73M83 63L73 73"/>',
  holy: '<path d="M78 60V84M68 70H88"/>',
  cosmic: '<circle cx="78" cy="72" r="5"/><path d="M68 72H88"/>',
  gravity: '<circle cx="78" cy="72" r="3"/><path d="M78 60V66M78 78V84M66 72H72M84 72H90"/>',
  shadow: '<path d="M84 62A12 12 0 1 0 84 84A8 10 0 1 1 84 62Z"/>',
  void: '<circle cx="78" cy="72" r="8"/><circle cx="78" cy="72" r="2"/>',
  arcane: '<path d="M78 62L86 78H70Z"/><path d="M78 84L70 68H86Z"/>',
  illusion: '<path d="M66 72Q78 60 90 72Q78 84 66 72Z"/><circle cx="78" cy="72" r="3"/>',
  time: '<circle cx="78" cy="72" r="9"/><path d="M78 66V72L83 75"/>',
  motion: '<path d="M66 66H86M70 72H90M66 78H86"/>',
  tech: '<path d="M70 64H86V80H70Z"/><path d="M74 68H82V76H74Z"/>',
  force: '<path d="M66 72H90M82 64L90 72L82 80"/>'
};

/**
 * How each element turns a spell's hue into a ramp, the way the older Codex
 * casts are coloured: a pale light, a saturated body and a dark deep. The
 * spell table only gives pastels (lightness 0.8–0.97), and seven elements share
 * the same gold, so without this every cast blends into a white blob.
 * [hue shift°, body saturation, body lightness, deep saturation, deep lightness]
 */
export const TONE = {
  earth: [-8, 0.62, 0.46, 0.55, 0.13],
  crystal: [0, 0.85, 0.68, 0.8, 0.2],
  wind: [0, 0.72, 0.58, 0.75, 0.15],
  sound: [0, 0.75, 0.56, 0.8, 0.14],
  light: [4, 1, 0.62, 0.95, 0.3],
  holy: [-2, 0.9, 0.56, 0.8, 0.2],
  cosmic: [0, 0.85, 0.64, 0.9, 0.16],
  gravity: [-4, 0.32, 0.5, 0.42, 0.1],
  shadow: [0, 0.7, 0.56, 0.6, 0.08],
  void: [0, 0.75, 0.56, 0.7, 0.05],
  arcane: [0, 0.85, 0.66, 0.85, 0.18],
  illusion: [0, 0.85, 0.66, 0.8, 0.2],
  time: [-6, 0.85, 0.54, 0.75, 0.17],
  motion: [-12, 0.95, 0.6, 0.85, 0.2],
  tech: [0, 0.9, 0.55, 0.9, 0.14],
  force: [-6, 0.9, 0.55, 0.85, 0.15]
};

const hslOf = (hex) => {
  const n = parseInt(hex.slice(1), 16);
  const r = ((n >> 16) & 255) / 255;
  const g = ((n >> 8) & 255) / 255;
  const b = (n & 255) / 255;
  const mx = Math.max(r, g, b);
  const mn = Math.min(r, g, b);
  const l = (mx + mn) / 2;
  const d = mx - mn;
  if (!d) return [0, 0, l];
  const s = d / (1 - Math.abs(2 * l - 1));
  const h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [(h * 60 + 360) % 360, s, l];
};

const hexOf = (h, s, l) => {
  const k = (n) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n) => Math.round(255 * (l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1))));
  return '#' + [f(0), f(8), f(4)].map((v) => v.toString(16).padStart(2, '0')).join('');
};

/**
 * A spell's ramp: `hot` (its white core), `light` (its own pastel), `body`
 * (saturated) and `deep` (dark). The hue is taken from whichever of its three
 * colours carries the most chroma.
 */
export function paletteFor(spell) {
  const [shift, bs, bl, ds, dl] = TONE[spell.element];
  let hue = 0;
  let best = -1;
  for (const hex of [spell.colorA, spell.colorB, spell.colorC]) {
    const [h, s, l] = hslOf(hex);
    const chroma = s * (1 - Math.abs(2 * l - 1));
    if (chroma > best) {
      best = chroma;
      hue = h;
    }
  }
  hue = (hue + shift + 360) % 360;
  return {
    hot: spell.colorB,
    light: spell.colorA,
    body: hexOf(hue, bs, bl),
    deep: hexOf(hue, ds, dl)
  };
}

export function glyphFor(spell) {
  return spell.glyph + (ELEMENT_MARK[spell.element] ?? '');
}

/** Rounded and ordered; every key is read live by the ability or its editor. */
export function settingsFor(spell) {
  const v = spell.variant;
  const zone = spell.cast === 'zone';
  const p = PROFILE[spell.element];
  const [detailCount, detailLift] = DETAIL[spell.archetype];
  const [heroSize, heroReach, heroLift, heroSpin, heroSwing] = HERO[spell.archetype];
  const well = spell.archetype === 'well';
  const mark = MARK[spell.element];
  const { hot, light, body, deep } = paletteFor(spell);
  const matter = MATTER[spell.element];
  return {
    // the cast
    range: 18,
    minRange: 2,
    speed: (zone ? 20 + v * 2 : 24 + v * 3) * p.speed,
    lifetime: 1.8 + v * 0.2,
    cooldown: 0.55,
    castAnim: ['cast1', 'cast2', 'cast3'][v],
    impactTime: 1.05 + v * 0.1,
    fadeTime: 1.25,
    zoneRadius: zone ? 4.2 + v * 0.25 : 0,

    // light
    lightColor: body,
    lightIntensity: 8 * p.glow,
    lightRadius: 11,
    lightFlicker: p.flicker,
    impactLight: 11 * p.flash,

    // the hand
    handForward: 0.55,
    handSide: 0.22,
    handHeight: 1.35,
    handFlare: 0.22 + v * 0.05,
    handSparks: 22 * p.streak,
    handMotes: 12,

    // body
    spinSpeed: (1.4 + v * 0.8) * p.spin,
    thickness: 0.22 + v * 0.06,
    count: [6, 7, 8][v],
    height: 2.6 + v * 0.45,
    sweep: 1.1 + v * 0.35,
    lean: 0.45 + v * 0.2,
    bodyOpacity: zone ? 0.2 : 0.5,
    edgeGlow: (1.6 + v * 0.25) * p.glow * (zone ? 0.55 : 1),
    softFade: 0.4,
    bodyGlow: 0.32 * p.glow,
    bodyPulse: 0.12,
    bodyPulseRate: 4 + v,
    colorA: body,
    colorB: hot,
    colorC: deep,
    lensWarp: (0.7 + v * 0.15) * p.lens,

    // voice
    voiceOpacity: 0.5,
    colorVoiceA: body,
    colorVoiceB: hot,

    // ground
    groundWidth: zone ? 9 : 2.4,
    groundGlow: 1.4,
    groundLife: 4.5,
    groundOpacity: 1,
    groundHeat: p.solid ? 1.1 : 1.5,
    groundCoat: GROUND_COAT[spell.element],
    ...(zone ? { groundLand: 0.32, groundTelegraph: 0.32 } : {}),
    groundStain: 0.9,
    groundStainReach: zone ? 1.05 : 0.9,
    colorGroundA: body,
    colorGroundB: deep,
    colorGroundStain: mark.body,

    // detail pieces
    detailCount,
    detailSize: p.size,
    detailSizeJitter: 0.35,
    detailSpread: 0.8,
    detailLift: detailLift * p.lift,
    detailSpin: 1,
    detailGlow: 1.2 * p.glow,
    detailOpacity: p.solid ? 1 : 0.85,
    detailSwing: 1,
    detailEdge: 1,
    detailDeep: 0.7,
    ...(matter ? { detailRough: matter.rough, detailMetal: matter.metal, detailShadow: 1 } : {}),
    colorDetailA: light,
    colorDetailB: body,
    colorDetailC: deep,

    // hero rig
    heroSize,
    heroReach,
    heroLift: heroLift * p.lift,
    heroSpin,
    heroSwing,
    heroGlow: 1.1 * p.glow,
    heroEdge: 1.2,
    heroOpacity: p.solid ? 1 : 0.9,
    heroDeep: spell.element === 'light' || spell.element === 'holy' ? 0.5 : 0.75,
    heroMaxHeight: 5,
    ...(zone ? { heroFit: 0.72 } : { heroMinSpan: 1.5 }),
    ...(matter ? { heroRough: matter.rough, heroMetal: matter.metal, heroShadow: 1 } : {}),
    colorHeroA: light,
    colorHeroB: body,
    colorHeroC: deep,

    // shed
    dustRate: 80 * p.dust,
    dustSize: 0.22,
    dustSpeed: 3.5,
    dustLife: 0.8,
    dustOpacity: 0.55,
    colorDustA: light,
    colorDustB: body,
    colorDustC: deep,
    colorDustD: '#1a140e',
    streakRate: 90 * p.streak,
    streakSize: 0.045,
    streakSpeed: 8,
    streakLife: 0.35,
    streakStretch: 1.4,
    colorStreakA: hot,
    colorStreakB: light,
    colorStreakC: body,
    colorStreakD: body,
    chipRate: 36 * p.chip,
    chipSize: 0.08,
    chipSpeed: 6,
    chipLife: 0.7,
    colorChipA: body,
    colorChipB: light,
    colorChipC: deep,
    colorChipD: '#2a241c',

    // motes thrown off the detail pieces
    moteRate: 26,
    moteSize: 0.06,
    moteSpeed: 1.6,
    moteLife: 1.1,
    colorMoteA: hot,
    colorMoteB: light,
    colorMoteC: body,
    colorMoteD: body,

    // the beat
    impactShake: 0.55 * p.shake,
    impactFlash: 0.16 * p.flash,
    colorFlash: light,
    burstRadius: (zone ? 3.2 : 2) + v * 0.3,
    burstLife: 0.7,
    burstOpacity: p.solid ? 0.16 : 0.5,
    impactChips: Math.round((p.solid ? 34 : 10) * p.chip),
    impactDust: Math.round((p.solid ? 26 : 8) * p.dust),
    colorBurstA: hot,
    colorBurstB: body,
    colorBurstC: deep,
    shockRadius: zone ? 6.5 : 3.2,
    shockLife: 0.85,
    shockRing: 0.3,
    colorShockA: body,
    colorShockB: hot,

    // the aftershock, once the fade starts
    aftershockAt: 1.06,
    aftershockRadius: zone ? 5 : 2.4,
    aftershockShake: 0.22 * p.shake,
    aftershockLight: 7 * p.flash,
    aftershockLife: 0.9,

    // bodies
    hitRadius: zone ? 4.4 : 1.15,
    hitImpulse: (7.5 + v) * p.impulse,
    hitLift: (well ? 9 : 3.2) * p.lift,
    hitSpin: 2.4,

    // the mark a felled body wears
    markAmount: mark.amount,
    markTime: mark.time,
    markLife: 2.2,
    markMotes: 18 * (PROFILE[spell.element].mote === 'dust' ? 1.3 : 1),
    colorMarkBody: mark.body,
    colorMarkRim: body,
    markRimGlow: 1.6 * p.glow,
    colorMarkEdge: light,
    markEdgeGlow: 2.6 * p.glow,
    markEdgeWidth: 0.05,

    // the trail a line cast leaves (abilities/codex/LineTrail.js); zone casts have none
    ...(zone ? {} : trailFor(spell, p, body, deep))
  };
}

/** Trail widths, lives and wake spacing by line archetype: [width, life, scar width, wake m, wake r]. */
const TRAIL = {
  lance: [0.38, 1.6, 0.9, 1.6, 0.9],
  whip: [0.6, 1.3, 1.4, 2, 1],
  volley: [0.18, 1.1, 0.35, 2.5, 0.6],
  pendulum: [0.26, 0.9, 0.6, 1.8, 0.7]
};

function trailFor(spell, p, body, deep) {
  const [width, life, scar, spacing, wake] = TRAIL[spell.archetype];
  return {
    trailWidth: width + spell.variant * 0.04,
    trailLife: life,
    trailOpacity: spell.archetype === 'pendulum' ? 0.55 : 0.85,
    trailGlow: 1.1 * p.glow,
    trailCore: spell.archetype === 'pendulum' ? 0.4 : 0.8,
    trailBreakup: 1.25,
    scarWidth: scar,
    scarLife: 2.6,
    scarOpacity: p.solid ? 0.85 : 0.7,
    scarGlow: 1.6 * p.glow,
    colorScarA: body,
    colorScarB: deep,
    wakeSpacing: spacing,
    wakeRadius: wake,
    wakeLife: 1.6,
    wakeChips: 4 * p.chip
  };
}

const GROUPS = [
  ['the cast itself', ['range', 'minRange', 'speed', 'lifetime', 'cooldown', 'castAnim', 'impactTime', 'fadeTime', 'zoneRadius']],
  ['light', ['lightColor', 'lightIntensity', 'lightRadius', 'lightFlicker', 'impactLight']],
  ['0 · the hand', ['handForward', 'handSide', 'handHeight', 'handFlare', 'handSparks', 'handMotes']],
  ['1 · the body', ['spinSpeed', 'thickness', 'count', 'height', 'sweep', 'lean', 'bodyOpacity', 'edgeGlow', 'softFade', 'bodyGlow', 'bodyPulse', 'bodyPulseRate', 'colorA', 'colorB', 'colorC', 'lensWarp']],
  ['2 · the voice', ['voiceOpacity', 'colorVoiceA', 'colorVoiceB']],
  ['3 · the ground', ['groundWidth', 'groundGlow', 'groundLife', 'groundOpacity', 'groundLand', 'groundHeat', 'groundCoat', 'groundTelegraph', 'groundStain', 'groundStainReach', 'colorGroundA', 'colorGroundB', 'colorGroundStain']],
  ['4 · detail pieces', ['detailCount', 'detailSize', 'detailSizeJitter', 'detailSpread', 'detailLift', 'detailSpin', 'detailGlow', 'detailOpacity', 'detailSwing', 'detailEdge', 'detailDeep', 'detailRough', 'detailMetal', 'detailShadow', 'colorDetailA', 'colorDetailB', 'colorDetailC']],
  ['5 · hero rig', ['heroSize', 'heroReach', 'heroLift', 'heroSpin', 'heroSwing', 'heroGlow', 'heroEdge', 'heroOpacity', 'heroDeep', 'heroMaxHeight', 'heroFit', 'heroMinSpan', 'heroRough', 'heroMetal', 'heroShadow', 'colorHeroA', 'colorHeroB', 'colorHeroC']],
  ['6 · shed', ['dustRate', 'dustSize', 'dustSpeed', 'dustLife', 'dustOpacity', 'colorDustA', 'colorDustB', 'colorDustC', 'colorDustD', 'streakRate', 'streakSize', 'streakSpeed', 'streakLife', 'streakStretch', 'colorStreakA', 'colorStreakB', 'colorStreakC', 'colorStreakD', 'chipRate', 'chipSize', 'chipSpeed', 'chipLife', 'colorChipA', 'colorChipB', 'colorChipC', 'colorChipD']],
  ['7 · motes', ['moteRate', 'moteSize', 'moteSpeed', 'moteLife', 'colorMoteA', 'colorMoteB', 'colorMoteC', 'colorMoteD']],
  ['8 · the beat', ['impactShake', 'impactFlash', 'colorFlash', 'burstRadius', 'burstLife', 'burstOpacity', 'impactChips', 'impactDust', 'colorBurstA', 'colorBurstB', 'colorBurstC', 'shockRadius', 'shockLife', 'shockRing', 'colorShockA', 'colorShockB']],
  ['9 · the aftershock', ['aftershockAt', 'aftershockRadius', 'aftershockShake', 'aftershockLight', 'aftershockLife']],
  ['10 · bodies', ['hitRadius', 'hitImpulse', 'hitLift', 'hitSpin']],
  ['11 · the mark', ['markAmount', 'markTime', 'markLife', 'markMotes', 'colorMarkBody', 'colorMarkRim', 'markRimGlow', 'colorMarkEdge', 'markEdgeGlow', 'markEdgeWidth']],
  ['12 · the trail', ['trailWidth', 'trailLife', 'trailOpacity', 'trailGlow', 'trailCore', 'trailBreakup', 'scarWidth', 'scarLife', 'scarOpacity', 'scarGlow', 'colorScarA', 'colorScarB', 'wakeSpacing', 'wakeRadius', 'wakeLife', 'wakeChips'], 'line']
];

/** Keys only some casts have: zone/line framing, and the PBR of solid elements. */
const OPTIONAL = new Set(['groundLand', 'groundTelegraph', 'heroFit', 'heroMinSpan', 'heroRough', 'heroMetal', 'heroShadow', 'detailRough', 'detailMetal', 'detailShadow']);

const NOTE = {
  range: 'maximum cast distance, metres',
  minRange: 'closer than this and the cast is refused',
  speed: 'metres/second the front travels',
  lifetime: 'seconds the cast is held before it is released',
  cooldown: 'seconds before it can be armed again',
  castAnim: 'which clip the body throws',
  impactTime: 'impact phase length, × global lifetime',
  fadeTime: 'fade phase length, × global lifetime',
  zoneRadius: 'circle radius for zone casts, metres',
  lightIntensity: 'the glow riding the cast',
  lightFlicker: '0..1 how much it shimmers',
  impactLight: 'extra light on the beat, decays on its own',
  spinSpeed: 'radians/second the body turns',
  thickness: 'width of a single body part, metres',
  count: 'parts in the body (max 12)',
  height: 'how tall the body stands, metres',
  sweep: 'lateral reach, metres',
  lean: 'how far the body opens on the beat',
  softFade: 'soft intersection with the floor and bodies, metres',
  bodyPulse: 'breathing in brightness, 0..1',
  bodyPulseRate: 'breaths per second (radians)',
  lensWarp: 'strength of the distortion it writes',
  voiceOpacity: 'strength of the second placement',
  groundWidth: 'footprint width, metres',
  groundLife: 'seconds the residue decal stays on the floor after the beat, × global lifetime',
  groundOpacity: 'strength of the field',
  groundLand: 'seconds the field takes to land out to the rim after the beat',
  groundHeat: 'how hot the fresh field and its landing lip glow, cooling through the fade',
  groundCoat: '0 dark stain/scorch .. 1 pale coat (rime, glare, scoured sand)',
  groundTelegraph: 'how strongly the footprint shows before the beat',
  groundStain: 'strength of the residue decal left at the beat',
  groundStainReach: 'residue radius, × the circle (zone) or × the ground width (line)',
  colorGroundStain: 'the dark tone the floor is stained toward',
  detailCount: 'pieces thrown (max 48)',
  detailSize: 'mean piece size, metres',
  detailSizeJitter: '± fraction of that',
  detailSpread: 'reach of the pieces, × the cast reach',
  detailLift: 'how high the pieces climb, metres',
  detailSpin: 'how fast the pieces orbit, × body spin',
  detailGlow: 'rim light on the pieces',
  detailOpacity: 'how solid the pieces are',
  detailSwing: 'how far each piece folds its parts, × authored swing',
  detailEdge: 'light along the piece arrises',
  detailDeep: '0..1 how far the pieces fall from body to deep tone across their form',
  detailRough: 'roughness of the lit pieces',
  detailMetal: 'metalness of the lit pieces',
  detailShadow: '1 = the pieces cast shadows',
  heroSize: 'scale of the hero rig, metres per authored unit',
  heroReach: 'ring rigs: share of the circle radius they span',
  heroLift: 'how far the rig rises, drops or arcs, metres',
  heroSpin: 'how fast the rig turns, × body spin',
  heroSwing: 'how far the rig folds its parts, × authored swing',
  heroGlow: 'rim light on the rig',
  heroEdge: 'light along the rig arrises',
  heroOpacity: 'how solid the rig is',
  heroDeep: '0..1 how far the rig falls from body to deep tone across its form (colour depth)',
  heroMaxHeight: 'the rig is scaled and lowered to keep its top under this, metres',
  heroFit: 'mass rigs grow to at least this share of the circle radius (heroSize is the floor)',
  heroMinSpan: 'line rigs grow to at least this cross-section, metres (heroSize is the floor)',
  heroRough: 'roughness of the lit rig',
  heroMetal: 'metalness of the lit rig',
  heroShadow: '1 = the rig casts shadows',
  dustRate: 'puffs per second',
  streakRate: 'sparks per second',
  chipRate: 'fragments per second',
  moteRate: 'motes per second off the pieces',
  moteSpeed: 'metres/second they drift at',
  impactShake: 'camera punch on the beat',
  impactFlash: 'screen flash on the beat',
  burstRadius: 'burst size, metres',
  burstOpacity: 'strength of the burst shell; matter keeps it low and hits with debris instead',
  impactChips: 'fragments thrown up and out on the beat',
  impactDust: 'dust puffs rolled out along the floor on the beat',
  shockRing: 'strength of the thin shock ring on the beat (0 = none)',
  trailWidth: 'ribbon width at the head, metres',
  trailLife: 'seconds a point of ribbon lasts after the head crosses it',
  trailOpacity: 'strength of the ribbon',
  trailGlow: 'brightness of the ribbon',
  trailCore: '0..1 how white the fresh middle of the ribbon runs',
  trailBreakup: 'how hard the ribbon breaks up as it ages',
  scarWidth: 'width of the scar on the floor, metres',
  scarLife: 'seconds the scar takes to cool and go',
  scarOpacity: 'strength of the scar',
  scarGlow: 'brightness of its hot seam',
  wakeSpacing: 'metres between wake decals along the path (0 = none)',
  wakeRadius: 'size of each wake decal, metres',
  wakeLife: 'seconds each wake decal lingers',
  wakeChips: 'fragments thrown at each wake',
  shockRadius: 'decal size, metres',
  aftershockAt: 'fade progress the aftershock lands at (1 = fade start)',
  aftershockRadius: 'aftershock ring size, metres',
  aftershockShake: 'camera punch of the aftershock',
  aftershockLight: 'light punch of the aftershock',
  aftershockLife: 'seconds the aftershock ring lingers',
  hitRadius: 'reach of the blow, metres',
  hitImpulse: 'how hard bodies are thrown',
  hitLift: 'how high they are thrown',
  hitSpin: 'how fast they tumble',
  handForward: 'metres in front of the caster the hand is',
  handSide: 'metres to the right of the caster',
  handHeight: 'metres off the floor',
  handFlare: 'size of the flare round the fist as the cast leaves it, metres',
  handSparks: 'sparks thrown off the hand at release',
  handMotes: 'motes left hanging at the hand',
  markAmount: '0..1 how far a felled body is stained',
  markTime: 'seconds the stain takes to set in',
  markLife: 'seconds a marked body keeps shedding motes, × global lifetime',
  markMotes: 'motes per second off a freshly marked body',
  colorMarkBody: 'what the body is stained toward',
  markRimGlow: 'rim light on a marked body',
  markEdgeGlow: 'brightness of the marked edge',
  markEdgeWidth: 'width of the marked edge'
};

/** 2 decimals for most things, enough for small sizes; never float noise. */
export function round(n) {
  if (!Number.isFinite(n)) return n;
  const r = Math.abs(n) < 0.1 ? 1000 : 100;
  return Math.round(n * r) / r;
}

/** Single-quoted, like the hand-written configs. */
function q(text) {
  return `'${String(text).replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
}

function literal(value) {
  return typeof value === 'number' ? String(round(value)) : q(value);
}

export function configSource(spell) {
  const s = settingsFor(spell);
  const flat = new Set(GROUPS.flatMap(([, keys]) => keys));
  const missing = Object.keys(s).filter((k) => !flat.has(k));
  if (missing.length) throw new Error(`${spell.id}: settings without a group: ${missing.join(', ')}`);
  // A group tagged 'line' only exists on line casts.
  const groups = GROUPS.filter(([, , only]) => !only || only === spell.cast);
  const last = groups[groups.length - 1][1].at(-1);
  const lines = [];
  for (const [title, keys] of groups) {
    if (lines.length) lines.push('');
    lines.push(`    /* --- ${title} --- */`);
    for (const key of keys) {
      if (!(key in s)) {
        if (OPTIONAL.has(key)) continue;
        throw new Error(`${spell.id}: group names unknown key ${key}`);
      }
      const note = NOTE[key] ? ` // ${NOTE[key]}` : '';
      lines.push(`    ${key}: ${literal(s[key])}${key === last ? '' : ','}${note}`);
    }
  }
  const body = lines.join('\n');
  return `/**
 * ${spell.label} — ${spell.element} — ${SHAPE[spell.archetype]}.
 *
 * ${spell.hint}.
 *
 * Elemental Codex data block: presentation (\`meta\`) and the live settings the
 * ability and its editor folder read. Plain data, no imports, so
 * \`settings.js\` can pull it in without a cycle. Dragging any field re-shapes
 * a cast that is already in the air.
 */
export default {
  id: ${q(spell.id)},
  meta: {
    label: ${q(spell.label)},
    accent: ${q(spell.colorA)},
    key: '',
    element: ${q(spell.element)},
    hint: ${q(spell.hint)},
    cast: ${q(spell.cast)},
    glyph: ${q(glyphFor(spell))}
  },
  settings: {
${body}
  }
};
`;
}

export function writeConfigs(write) {
  for (const spell of SPELLS) write(spell, configSource(spell));
}
