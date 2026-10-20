/**
 * Chrono Well — time — a floor that inhales, then a column.
 *
 * Time — the circle ages inward, then the centre is a second younger.
 *
 * Elemental Codex data block: presentation (`meta`) and the live settings the
 * ability and its editor folder read. Plain data, no imports, so
 * `settings.js` can pull it in without a cycle. Dragging any field re-shapes
 * a cast that is already in the air.
 */
export default {
  id: 'chronowell',
  meta: {
    label: 'Chrono Well',
    accent: '#ffd98a',
    key: '',
    element: 'time',
    hint: 'Time — the circle ages inward, then the centre is a second younger',
    cast: 'zone',
    glyph: '<circle cx="50" cy="54" r="22"/><path d="M50 54V18"/><path d="M40 28L50 16L60 28"/><path d="M30 50H70"/><circle cx="78" cy="72" r="9"/><path d="M78 66V72L83 75"/>'
  },
  settings: {
    /* --- the cast itself --- */
    range: 18, // maximum cast distance, metres
    minRange: 2, // closer than this and the cast is refused
    speed: 20.9, // metres/second the front travels
    lifetime: 1.5, // seconds the cast is held before it is released
    cooldown: 0.55, // seconds before it can be armed again
    castAnim: 'cast2', // which clip the body throws
    impactTime: 0.78, // impact phase length, × global lifetime
    fadeTime: 0.95, // fade phase length, × global lifetime
    zoneRadius: 4.45, // circle radius for zone casts, metres

    /* --- light --- */
    lightColor: '#fff8e8',
    lightIntensity: 8.8, // the glow riding the cast
    lightRadius: 11,
    lightFlicker: 0.2, // 0..1 how much it shimmers
    impactLight: 9.9, // extra light on the beat, decays on its own

    /* --- 1 · the body --- */
    spinSpeed: 1.98, // radians/second the body turns
    thickness: 0.28, // width of a single body part, metres
    count: 7, // parts in the body (max 12)
    height: 3.05, // how tall the body stands, metres
    sweep: 1.45, // lateral reach, metres
    lean: 0.65, // how far the body opens on the beat
    bodyOpacity: 0.7,
    edgeGlow: 2.75,
    softFade: 0.4, // soft intersection with the floor and bodies, metres
    bodyGlow: 0.46,
    bodyPulse: 0.12, // breathing in brightness, 0..1
    bodyPulseRate: 5, // breaths per second (radians)
    colorA: '#ffd98a',
    colorB: '#fff8e8',
    colorC: '#ff9a3c',
    lensWarp: 0.94, // strength of the distortion it writes

    /* --- 2 · the voice --- */
    voiceOpacity: 0.65, // strength of the second placement
    colorVoiceA: '#fff8e8',
    colorVoiceB: '#ffd98a',

    /* --- 3 · the ground --- */
    groundWidth: 9, // footprint width, metres
    groundGlow: 1.4,
    groundLife: 1.5, // seconds the stamp lingers
    groundOpacity: 1, // strength of the stamp
    colorGroundA: '#ffd98a',
    colorGroundB: '#ff9a3c',

    /* --- 4 · detail pieces --- */
    detailCount: 18, // pieces thrown (max 48)
    detailSize: 0.55, // mean piece size, metres
    detailSizeJitter: 0.35, // ± fraction of that
    detailSpread: 0.8, // reach of the pieces, × the cast reach
    detailLift: 3.2, // how high the pieces climb, metres
    detailSpin: 1, // how fast the pieces orbit, × body spin
    detailGlow: 1.32, // rim light on the pieces
    detailOpacity: 0.95, // how solid the pieces are
    colorDetailA: '#ffd98a',
    colorDetailB: '#fff8e8',
    colorDetailC: '#ff9a3c',

    /* --- 5 · shed --- */
    dustRate: 40, // puffs per second
    dustSize: 0.22,
    dustSpeed: 3.5,
    dustLife: 0.8,
    dustOpacity: 0.55,
    colorDustA: '#ffd98a',
    colorDustB: '#fff8e8',
    colorDustC: '#ff9a3c',
    colorDustD: '#1a140e',
    streakRate: 90, // sparks per second
    streakSize: 0.045,
    streakSpeed: 8,
    streakLife: 0.35,
    streakStretch: 1.4,
    colorStreakA: '#fff8e8',
    colorStreakB: '#ffd98a',
    colorStreakC: '#ff9a3c',
    colorStreakD: '#ffffff',
    chipRate: 18, // fragments per second
    chipSize: 0.08,
    chipSpeed: 6,
    chipLife: 0.7,
    colorChipA: '#ff9a3c',
    colorChipB: '#ffd98a',
    colorChipC: '#fff8e8',
    colorChipD: '#2a241c',

    /* --- 6 · motes --- */
    moteRate: 26, // motes per second off the pieces
    moteSize: 0.06,
    moteSpeed: 1.6, // metres/second they drift at
    moteLife: 1.1,
    colorMoteA: '#fff8e8',
    colorMoteB: '#ffd98a',
    colorMoteC: '#ff9a3c',
    colorMoteD: '#ffffff',

    /* --- 7 · the beat --- */
    impactShake: 0.39, // camera punch on the beat
    impactFlash: 0.23, // screen flash on the beat
    colorFlash: '#fff8e8',
    burstRadius: 3.7, // burst size, metres
    burstLife: 0.7,
    colorBurstA: '#fff8e8',
    colorBurstB: '#ffd98a',
    colorBurstC: '#ff9a3c',
    shockRadius: 6.5, // decal size, metres
    shockLife: 0.85,
    colorShockA: '#ffd98a',
    colorShockB: '#fff8e8',

    /* --- 8 · the aftershock --- */
    aftershockAt: 1.06, // fade progress the aftershock lands at (1 = fade start)
    aftershockRadius: 5, // aftershock ring size, metres
    aftershockShake: 0.15, // camera punch of the aftershock
    aftershockLight: 6.3, // light punch of the aftershock
    aftershockLife: 0.9, // seconds the aftershock ring lingers

    /* --- 9 · bodies --- */
    hitRadius: 4.4, // reach of the blow, metres
    hitImpulse: 7.65, // how hard bodies are thrown
    hitLift: 9, // how high they are thrown
    hitSpin: 2.4 // how fast they tumble
  }
};
