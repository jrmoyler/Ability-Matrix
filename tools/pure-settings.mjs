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
 * `kind` is the piece the detail layer throws (see DetailLayer.js).
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
  motion: { speed: 1.5, impulse: 1.1, lift: 0.8, shake: 0.9, flash: 0.8, dust: 0.9, streak: 1.7, chip: 0.7, spin: 1.4, glow: 1.0, flicker: 0.3, lens: 1.1, kind: 'bar', size: 0.5, solid: false, mote: 'glint' },
  tech: { speed: 1.2, impulse: 1.0, lift: 0.9, shake: 0.8, flash: 1.0, dust: 0.5, streak: 1.3, chip: 1.0, spin: 1.0, glow: 1.1, flicker: 0.4, lens: 0.8, kind: 'block', size: 0.45, solid: true, mote: 'glint' },
  force: { speed: 1.1, impulse: 1.4, lift: 1.0, shake: 1.3, flash: 0.9, dust: 0.9, streak: 1.0, chip: 1.0, spin: 0.9, glow: 1.0, flicker: 0.2, lens: 1.2, kind: 'wedge', size: 0.6, solid: true, mote: 'dust' }
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

export function glyphFor(spell) {
  return spell.glyph + (ELEMENT_MARK[spell.element] ?? '');
}

/** Rounded and ordered; every key is read live by the ability or its editor. */
export function settingsFor(spell) {
  const v = spell.variant;
  const zone = spell.cast === 'zone';
  const p = PROFILE[spell.element];
  const [detailCount, detailLift] = DETAIL[spell.archetype];
  const well = spell.archetype === 'well';
  return {
    // the cast
    range: 18,
    minRange: 2,
    speed: (zone ? 20 + v * 2 : 24 + v * 3) * p.speed,
    lifetime: 1.35 + v * 0.15,
    cooldown: 0.55,
    castAnim: ['cast1', 'cast2', 'cast3'][v],
    impactTime: 0.7 + v * 0.08,
    fadeTime: 0.95,
    zoneRadius: zone ? 4.2 + v * 0.25 : 0,

    // light
    lightColor: spell.colorB,
    lightIntensity: 8 * p.glow,
    lightRadius: 11,
    lightFlicker: p.flicker,
    impactLight: 11 * p.flash,

    // body
    spinSpeed: (1.4 + v * 0.8) * p.spin,
    thickness: 0.22 + v * 0.06,
    count: [6, 7, 8][v],
    height: 2.6 + v * 0.45,
    sweep: 1.1 + v * 0.35,
    lean: 0.45 + v * 0.2,
    bodyOpacity: 0.7,
    edgeGlow: (2.2 + v * 0.3) * p.glow,
    softFade: 0.4,
    bodyGlow: 0.42 * p.glow,
    bodyPulse: 0.12,
    bodyPulseRate: 4 + v,
    colorA: spell.colorA,
    colorB: spell.colorB,
    colorC: spell.colorC,
    lensWarp: (0.7 + v * 0.15) * p.lens,

    // voice
    voiceOpacity: 0.65,
    colorVoiceA: spell.colorB,
    colorVoiceB: spell.colorA,

    // ground
    groundWidth: zone ? 9 : 2.4,
    groundGlow: 1.4,
    groundLife: 1.5,
    groundOpacity: 1,
    colorGroundA: spell.colorA,
    colorGroundB: spell.colorC,

    // detail pieces
    detailCount,
    detailSize: p.size,
    detailSizeJitter: 0.35,
    detailSpread: 0.8,
    detailLift: detailLift * p.lift,
    detailSpin: 1,
    detailGlow: 1.2 * p.glow,
    detailOpacity: p.solid ? 0.95 : 0.8,
    colorDetailA: spell.colorA,
    colorDetailB: spell.colorB,
    colorDetailC: spell.colorC,

    // shed
    dustRate: 80 * p.dust,
    dustSize: 0.22,
    dustSpeed: 3.5,
    dustLife: 0.8,
    dustOpacity: 0.55,
    colorDustA: spell.colorA,
    colorDustB: spell.colorB,
    colorDustC: spell.colorC,
    colorDustD: '#1a140e',
    streakRate: 90 * p.streak,
    streakSize: 0.045,
    streakSpeed: 8,
    streakLife: 0.35,
    streakStretch: 1.4,
    colorStreakA: spell.colorB,
    colorStreakB: spell.colorA,
    colorStreakC: spell.colorC,
    colorStreakD: '#ffffff',
    chipRate: 36 * p.chip,
    chipSize: 0.08,
    chipSpeed: 6,
    chipLife: 0.7,
    colorChipA: spell.colorC,
    colorChipB: spell.colorA,
    colorChipC: spell.colorB,
    colorChipD: '#2a241c',

    // motes thrown off the detail pieces
    moteRate: 26,
    moteSize: 0.06,
    moteSpeed: 1.6,
    moteLife: 1.1,
    colorMoteA: spell.colorB,
    colorMoteB: spell.colorA,
    colorMoteC: spell.colorC,
    colorMoteD: '#ffffff',

    // the beat
    impactShake: 0.55 * p.shake,
    impactFlash: 0.26 * p.flash,
    colorFlash: spell.colorB,
    burstRadius: 3.4 + v * 0.3,
    burstLife: 0.7,
    colorBurstA: spell.colorB,
    colorBurstB: spell.colorA,
    colorBurstC: spell.colorC,
    shockRadius: zone ? 6.5 : 3.2,
    shockLife: 0.85,
    colorShockA: spell.colorA,
    colorShockB: spell.colorB,

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
    hitSpin: 2.4
  };
}

const GROUPS = [
  ['the cast itself', ['range', 'minRange', 'speed', 'lifetime', 'cooldown', 'castAnim', 'impactTime', 'fadeTime', 'zoneRadius']],
  ['light', ['lightColor', 'lightIntensity', 'lightRadius', 'lightFlicker', 'impactLight']],
  ['1 · the body', ['spinSpeed', 'thickness', 'count', 'height', 'sweep', 'lean', 'bodyOpacity', 'edgeGlow', 'softFade', 'bodyGlow', 'bodyPulse', 'bodyPulseRate', 'colorA', 'colorB', 'colorC', 'lensWarp']],
  ['2 · the voice', ['voiceOpacity', 'colorVoiceA', 'colorVoiceB']],
  ['3 · the ground', ['groundWidth', 'groundGlow', 'groundLife', 'groundOpacity', 'colorGroundA', 'colorGroundB']],
  ['4 · detail pieces', ['detailCount', 'detailSize', 'detailSizeJitter', 'detailSpread', 'detailLift', 'detailSpin', 'detailGlow', 'detailOpacity', 'colorDetailA', 'colorDetailB', 'colorDetailC']],
  ['5 · shed', ['dustRate', 'dustSize', 'dustSpeed', 'dustLife', 'dustOpacity', 'colorDustA', 'colorDustB', 'colorDustC', 'colorDustD', 'streakRate', 'streakSize', 'streakSpeed', 'streakLife', 'streakStretch', 'colorStreakA', 'colorStreakB', 'colorStreakC', 'colorStreakD', 'chipRate', 'chipSize', 'chipSpeed', 'chipLife', 'colorChipA', 'colorChipB', 'colorChipC', 'colorChipD']],
  ['6 · motes', ['moteRate', 'moteSize', 'moteSpeed', 'moteLife', 'colorMoteA', 'colorMoteB', 'colorMoteC', 'colorMoteD']],
  ['7 · the beat', ['impactShake', 'impactFlash', 'colorFlash', 'burstRadius', 'burstLife', 'colorBurstA', 'colorBurstB', 'colorBurstC', 'shockRadius', 'shockLife', 'colorShockA', 'colorShockB']],
  ['8 · the aftershock', ['aftershockAt', 'aftershockRadius', 'aftershockShake', 'aftershockLight', 'aftershockLife']],
  ['9 · bodies', ['hitRadius', 'hitImpulse', 'hitLift', 'hitSpin']]
];

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
  groundLife: 'seconds the stamp lingers',
  groundOpacity: 'strength of the stamp',
  detailCount: 'pieces thrown (max 48)',
  detailSize: 'mean piece size, metres',
  detailSizeJitter: '± fraction of that',
  detailSpread: 'reach of the pieces, × the cast reach',
  detailLift: 'how high the pieces climb, metres',
  detailSpin: 'how fast the pieces orbit, × body spin',
  detailGlow: 'rim light on the pieces',
  detailOpacity: 'how solid the pieces are',
  dustRate: 'puffs per second',
  streakRate: 'sparks per second',
  chipRate: 'fragments per second',
  moteRate: 'motes per second off the pieces',
  moteSpeed: 'metres/second they drift at',
  impactShake: 'camera punch on the beat',
  impactFlash: 'screen flash on the beat',
  burstRadius: 'burst size, metres',
  shockRadius: 'decal size, metres',
  aftershockAt: 'fade progress the aftershock lands at (1 = fade start)',
  aftershockRadius: 'aftershock ring size, metres',
  aftershockShake: 'camera punch of the aftershock',
  aftershockLight: 'light punch of the aftershock',
  aftershockLife: 'seconds the aftershock ring lingers',
  hitRadius: 'reach of the blow, metres',
  hitImpulse: 'how hard bodies are thrown',
  hitLift: 'how high they are thrown',
  hitSpin: 'how fast they tumble'
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
  const last = GROUPS[GROUPS.length - 1][1].at(-1);
  const lines = [];
  for (const [title, keys] of GROUPS) {
    if (lines.length) lines.push('');
    lines.push(`    /* --- ${title} --- */`);
    for (const key of keys) {
      if (!(key in s)) throw new Error(`${spell.id}: group names unknown key ${key}`);
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
