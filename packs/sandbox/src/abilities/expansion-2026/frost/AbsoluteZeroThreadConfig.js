/**
 * Absolute Zero Thread — settings block (data only, no imports).
 *
 * A line cast. A needle of ice is thrown down the aimed line trailing a
 * filament of supercooled light; every body the filament passes within
 * `reach` is frozen `freezeDelay` seconds later, stands as an ice statue for
 * `freezeDuration`, and then shatters.
 *
 * Grouped by layer, in the order the editor shows them. The gameplay group is
 * what tests and the combat adapter rely on; everything else is presentation
 * and is read from `settings['absolute-zero-thread']` every frame, so the
 * editor changes a cast that is already running.
 */
export const ID = 'absolute-zero-thread';
export const UID = 'matrix-expansion/absolute-zero-thread';

export const CONFIG = Object.freeze({
  id: ID,
  meta: {
    label: 'Absolute Zero Thread',
    accent: '#9be9ff',
    element: 'frost',
    key: '',
    cast: 'line',
    hint: 'A freezing filament sweeps forward and locks struck bodies in ice.',
    glyph: '<path d="M10 80Q30 25 50 50T90 20"/><path d="M50 30V70M32 40L68 60M32 60L68 40"/>'
  },
  settings: {
    /* --- the cast ------------------------------------------------------ */
    range: 20, // max aim distance (m)
    minRange: 1,
    speed: 20, // the needle's speed down the line (m/s)
    lifetime: 2.4, // the filament lingers at least this long after landing (s)
    cooldown: 4,
    castAnim: 'cast1',
    lightColor: '#9be9ff', // the light rides the needle
    lightIntensity: 5,
    lightRadius: 6,

    /* --- the freeze (gameplay) ------------------------------------------ */
    width: 0.15, // filament half-width at its widest (m)
    reach: 0.8, // bodies within this of the line are frozen (m)
    freezeDelay: 0.25, // seconds from being passed to being frozen
    freezeDuration: 1.5, // seconds a statue stands before it shatters
    shatterLife: 0.7, // seconds the shatter chips fly
    shatterSpeed: 2.4, // how hard the chips are thrown

    /* --- 1 · the filament ----------------------------------------------- */
    threadHeight: 0.32, // height at the caster and at the needle (m)
    threadArc: 0.45, // extra height at the middle of the run (m)
    threadWave: 0.08, // lateral wave (m)
    waveFrequency: 31, // waves along the filament
    waveSpeed: 5, // how fast the waves run
    threadGlow: 1.6,
    strandDensity: 92, // fine strands along it
    crystalDensity: 66, // crystal cells along it
    threadDissolve: 0.6, // how much of the fade is a noise dissolve (vs a dim)
    colorThreadDeep: '#0f73cc', // the cold blue at the edges
    colorThreadCore: '#ddffff', // the white core
    colorCrystal: '#ffffff', // crystal glints

    /* --- 2 · the needle ------------------------------------------------- */
    needleLength: 0.9, // m
    needleRadius: 0.07, // m
    needleGlow: 2.2,
    needleSpin: 6, // radians per second about its own axis
    needleFresnel: 2.5, // rim power
    colorNeedle: '#e8fbff',
    colorNeedleRim: '#62c8ff',

    /* --- 3 · the rime path (ground) ------------------------------------- */
    rimeWidth: 0.55, // half-width of the frosted strip (m)
    rimeOpacity: 0.75,
    rimeScale: 3.2, // frost plates per metre
    rimeGlow: 0.8,
    rimeMelt: 0.35, // fraction of the fade spent melting
    colorRimeA: '#d8f6ff', // plate edges
    colorRimeB: '#3d8fbf', // plate centres

    /* --- 4 · frost motes (baked points over the line) ------------------- */
    moteOpacity: 1,
    moteSize: 14, // point size at 1 m
    moteRise: 0.35, // how fast they drift up
    colorMote: '#73d9ff',

    /* --- 5 · chill (screen distortion over the line) ------------------- */
    chillStrength: 0.35,
    chillScale: 3, // noise frequency
    chillSpeed: 0.6,

    /* --- 6 · the statues ----------------------------------------------- */
    statueOpacity: 0.78,
    statueGlow: 0.8, // emissive strength of the ice
    statueFrost: 1.2, // hoarfrost on the ice
    statueRim: 1.4, // grazing-angle glow
    statueCreep: 0.35, // seconds the ice takes to climb the body
    colorStatue: '#84d9ff',
    colorStatueEmissive: '#12517a',
    colorStatueRim: '#e6fbff',
    ringRadius: 0.8, // the rime rosette round a statue's feet (m)
    ringGlow: 1.2,
    shardRadius: 0.52, // the shard ring round the feet (m)
    shardHeight: 0.8, // tallest shard (m)
    shardGlow: 1.2,
    colorShard: '#99eaff',
    colorShardRim: '#f2fdff',
    chipSize: 12, // baked shatter chip size
    colorChip: '#8ce6ff',

    /* --- 7 · particles --------------------------------------------------- */
    rimeRate: 90, // frost dust per second off the needle
    rimeSize: 0.06,
    rimeLife: 0.9,
    rimeSpeed: 0.6,
    rimeGlowP: 1.6,
    colorRimeDustA: '#ffffff',
    colorRimeDustB: '#bdf1ff',
    colorRimeDustC: '#5cc4ff',
    colorRimeDustD: '#0c3a66',
    shatterChips: 40, // lit ice chips per shatter
    chipParticleSize: 0.08,
    chipLife: 1.1,
    chipGravity: 9,
    colorChipA: '#f2fdff',
    colorChipB: '#bdeeff',
    colorChipC: '#6cc8f2',
    colorChipD: '#2b6f99',
    vapourCount: 14, // cold vapour puffs per freeze / shatter
    vapourSize: 0.6,
    vapourLife: 1.6,
    vapourOpacity: 0.35,
    colorVapourA: '#e8f9ff',
    colorVapourB: '#b6dff2',
    colorVapourC: '#8ab8d1',
    colorVapourD: '#5d7f94',

    /* --- 8 · beats ------------------------------------------------------- */
    freezeShake: 0.08, // camera knock when a body freezes
    shatterShake: 0.2, // camera knock when a statue shatters
    landShake: 0.05, // camera knock when the needle lands
    shakeDecay: 8,
    freezeLight: 0.8, // light punch per freeze (× lightIntensity)
    shatterFlash: 0.15,
    colorFlash: '#bff3ff',
    freezeBurst: 1.1, // FROST shell on a freezing body (m)
    landBurst: 0.9, // FROST shell where the needle lands (m)
    burstIntensity: 1,
    colorBurstA: '#ffffff',
    colorBurstB: '#9be9ff',
    colorBurstC: '#1a5c8c',
    frostDecal: 1.4, // FROST decal radius at a statue (m)
    frostDecalLife: 2.5,
    colorDecalA: '#e6fbff',
    colorDecalB: '#4aa8d8'
  }
});
