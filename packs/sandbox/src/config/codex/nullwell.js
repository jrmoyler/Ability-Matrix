/**
 * Null Well — void — a floor that inhales, then a column.
 *
 * Void — a null point drinks the circle and does not give it back.
 *
 * Elemental Codex data block: presentation (`meta`) and the live settings the
 * ability and its editor folder read. Plain data, no imports, so
 * `settings.js` can pull it in without a cycle. Dragging any field re-shapes
 * a cast that is already in the air.
 */
export default {
  id: 'nullwell',
  meta: {
    label: 'Null Well',
    accent: '#6a5cff',
    key: '',
    element: 'void',
    hint: 'Void — a null point drinks the circle and does not give it back',
    cast: 'zone',
    glyph: '<circle cx="50" cy="54" r="22"/><path d="M50 54V18"/><path d="M40 28L50 16L60 28"/><path d="M30 50H70"/><circle cx="78" cy="72" r="8"/><circle cx="78" cy="72" r="2"/>'
  },
  settings: {
    /* --- the cast itself --- */
    range: 18, // maximum cast distance, metres
    minRange: 2, // closer than this and the cast is refused
    speed: 22, // metres/second the front travels
    lifetime: 1.5, // seconds the cast is held before it is released
    cooldown: 0.55, // seconds before it can be armed again
    castAnim: 'cast2', // which clip the body throws
    impactTime: 0.78, // impact phase length, × global lifetime
    fadeTime: 0.95, // fade phase length, × global lifetime
    zoneRadius: 4.45, // circle radius for zone casts, metres

    /* --- light --- */
    lightColor: '#e6e0ff',
    lightIntensity: 5.6, // the glow riding the cast
    lightRadius: 11,
    lightFlicker: 0.25, // 0..1 how much it shimmers
    impactLight: 6.6, // extra light on the beat, decays on its own

    /* --- 1 · the body --- */
    spinSpeed: 2.64, // radians/second the body turns
    thickness: 0.28, // width of a single body part, metres
    count: 7, // parts in the body (max 12)
    height: 3.05, // how tall the body stands, metres
    sweep: 1.45, // lateral reach, metres
    lean: 0.65, // how far the body opens on the beat
    bodyOpacity: 0.7,
    edgeGlow: 1.75,
    softFade: 0.4, // soft intersection with the floor and bodies, metres
    bodyGlow: 0.29,
    bodyPulse: 0.12, // breathing in brightness, 0..1
    bodyPulseRate: 5, // breaths per second (radians)
    colorA: '#6a5cff',
    colorB: '#e6e0ff',
    colorC: '#12081c',
    lensWarp: 1.36, // strength of the distortion it writes

    /* --- 2 · the voice --- */
    voiceOpacity: 0.65, // strength of the second placement
    colorVoiceA: '#e6e0ff',
    colorVoiceB: '#6a5cff',

    /* --- 3 · the ground --- */
    groundWidth: 9, // footprint width, metres
    groundGlow: 1.4,
    groundLife: 1.5, // seconds the stamp lingers
    groundOpacity: 1, // strength of the stamp
    colorGroundA: '#6a5cff',
    colorGroundB: '#12081c',

    /* --- 4 · detail pieces --- */
    detailCount: 18, // pieces thrown (max 48)
    detailSize: 0.6, // mean piece size, metres
    detailSizeJitter: 0.35, // ± fraction of that
    detailSpread: 0.8, // reach of the pieces, × the cast reach
    detailLift: 2.24, // how high the pieces climb, metres
    detailSpin: 1, // how fast the pieces orbit, × body spin
    detailGlow: 0.84, // rim light on the pieces
    detailOpacity: 0.8, // how solid the pieces are
    colorDetailA: '#6a5cff',
    colorDetailB: '#e6e0ff',
    colorDetailC: '#12081c',

    /* --- 5 · shed --- */
    dustRate: 96, // puffs per second
    dustSize: 0.22,
    dustSpeed: 3.5,
    dustLife: 0.8,
    dustOpacity: 0.55,
    colorDustA: '#6a5cff',
    colorDustB: '#e6e0ff',
    colorDustC: '#12081c',
    colorDustD: '#1a140e',
    streakRate: 81, // sparks per second
    streakSize: 0.045,
    streakSpeed: 8,
    streakLife: 0.35,
    streakStretch: 1.4,
    colorStreakA: '#e6e0ff',
    colorStreakB: '#6a5cff',
    colorStreakC: '#12081c',
    colorStreakD: '#ffffff',
    chipRate: 14.4, // fragments per second
    chipSize: 0.08,
    chipSpeed: 6,
    chipLife: 0.7,
    colorChipA: '#12081c',
    colorChipB: '#6a5cff',
    colorChipC: '#e6e0ff',
    colorChipD: '#2a241c',

    /* --- 6 · motes --- */
    moteRate: 26, // motes per second off the pieces
    moteSize: 0.06,
    moteSpeed: 1.6, // metres/second they drift at
    moteLife: 1.1,
    colorMoteA: '#e6e0ff',
    colorMoteB: '#6a5cff',
    colorMoteC: '#12081c',
    colorMoteD: '#ffffff',

    /* --- 7 · the beat --- */
    impactShake: 0.55, // camera punch on the beat
    impactFlash: 0.16, // screen flash on the beat
    colorFlash: '#e6e0ff',
    burstRadius: 3.7, // burst size, metres
    burstLife: 0.7,
    colorBurstA: '#e6e0ff',
    colorBurstB: '#6a5cff',
    colorBurstC: '#12081c',
    shockRadius: 6.5, // decal size, metres
    shockLife: 0.85,
    colorShockA: '#6a5cff',
    colorShockB: '#e6e0ff',

    /* --- 8 · the aftershock --- */
    aftershockAt: 1.06, // fade progress the aftershock lands at (1 = fade start)
    aftershockRadius: 5, // aftershock ring size, metres
    aftershockShake: 0.22, // camera punch of the aftershock
    aftershockLight: 4.2, // light punch of the aftershock
    aftershockLife: 0.9, // seconds the aftershock ring lingers

    /* --- 9 · bodies --- */
    hitRadius: 4.4, // reach of the blow, metres
    hitImpulse: 9.35, // how hard bodies are thrown
    hitLift: 6.3, // how high they are thrown
    hitSpin: 2.4 // how fast they tumble
  }
};
