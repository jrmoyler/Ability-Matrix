/**
 * Sigil Volley — arcane — a fan of bolts on staggered arcs.
 *
 * Arcane — sigils arc down the line and brand on impact.
 *
 * Elemental Codex data block: presentation (`meta`) and the live settings the
 * ability and its editor folder read. Plain data, no imports, so
 * `settings.js` can pull it in without a cycle. Dragging any field re-shapes
 * a cast that is already in the air.
 */
export default {
  id: 'sigilvolley',
  meta: {
    label: 'Sigil Volley',
    accent: '#dfe4ff',
    key: '',
    element: 'arcane',
    hint: 'Arcane — sigils arc down the line and brand on impact',
    cast: 'line',
    glyph: '<path d="M18 70Q34 30 50 70"/><path d="M34 70Q50 24 66 70"/><path d="M50 70Q66 30 82 70"/><path d="M78 62L86 78H70Z"/><path d="M78 84L70 68H86Z"/>'
  },
  settings: {
    /* --- the cast itself --- */
    range: 18, // maximum cast distance, metres
    minRange: 2, // closer than this and the cast is refused
    speed: 25.2, // metres/second the front travels
    lifetime: 1.35, // seconds the cast is held before it is released
    cooldown: 0.55, // seconds before it can be armed again
    castAnim: 'cast1', // which clip the body throws
    impactTime: 0.7, // impact phase length, × global lifetime
    fadeTime: 0.95, // fade phase length, × global lifetime
    zoneRadius: 0, // circle radius for zone casts, metres

    /* --- light --- */
    lightColor: '#ffffff',
    lightIntensity: 10.4, // the glow riding the cast
    lightRadius: 11,
    lightFlicker: 0.45, // 0..1 how much it shimmers
    impactLight: 11, // extra light on the beat, decays on its own

    /* --- 1 · the body --- */
    spinSpeed: 1.82, // radians/second the body turns
    thickness: 0.22, // width of a single body part, metres
    count: 6, // parts in the body (max 12)
    height: 2.6, // how tall the body stands, metres
    sweep: 1.1, // lateral reach, metres
    lean: 0.45, // how far the body opens on the beat
    bodyOpacity: 0.7,
    edgeGlow: 2.86,
    softFade: 0.4, // soft intersection with the floor and bodies, metres
    bodyGlow: 0.55,
    bodyPulse: 0.12, // breathing in brightness, 0..1
    bodyPulseRate: 4, // breaths per second (radians)
    colorA: '#dfe4ff',
    colorB: '#ffffff',
    colorC: '#8ea0ff',
    lensWarp: 0.63, // strength of the distortion it writes

    /* --- 2 · the voice --- */
    voiceOpacity: 0.65, // strength of the second placement
    colorVoiceA: '#ffffff',
    colorVoiceB: '#dfe4ff',

    /* --- 3 · the ground --- */
    groundWidth: 2.4, // footprint width, metres
    groundGlow: 1.4,
    groundLife: 1.5, // seconds the stamp lingers
    groundOpacity: 1, // strength of the stamp
    colorGroundA: '#dfe4ff',
    colorGroundB: '#8ea0ff',

    /* --- 4 · detail pieces --- */
    detailCount: 12, // pieces thrown (max 48)
    detailSize: 0.55, // mean piece size, metres
    detailSizeJitter: 0.35, // ± fraction of that
    detailSpread: 0.8, // reach of the pieces, × the cast reach
    detailLift: 1.1, // how high the pieces climb, metres
    detailSpin: 1, // how fast the pieces orbit, × body spin
    detailGlow: 1.56, // rim light on the pieces
    detailOpacity: 0.8, // how solid the pieces are
    colorDetailA: '#dfe4ff',
    colorDetailB: '#ffffff',
    colorDetailC: '#8ea0ff',

    /* --- 5 · shed --- */
    dustRate: 40, // puffs per second
    dustSize: 0.22,
    dustSpeed: 3.5,
    dustLife: 0.8,
    dustOpacity: 0.55,
    colorDustA: '#dfe4ff',
    colorDustB: '#ffffff',
    colorDustC: '#8ea0ff',
    colorDustD: '#1a140e',
    streakRate: 117, // sparks per second
    streakSize: 0.045,
    streakSpeed: 8,
    streakLife: 0.35,
    streakStretch: 1.4,
    colorStreakA: '#ffffff',
    colorStreakB: '#dfe4ff',
    colorStreakC: '#8ea0ff',
    colorStreakD: '#ffffff',
    chipRate: 14.4, // fragments per second
    chipSize: 0.08,
    chipSpeed: 6,
    chipLife: 0.7,
    colorChipA: '#8ea0ff',
    colorChipB: '#dfe4ff',
    colorChipC: '#ffffff',
    colorChipD: '#2a241c',

    /* --- 6 · motes --- */
    moteRate: 26, // motes per second off the pieces
    moteSize: 0.06,
    moteSpeed: 1.6, // metres/second they drift at
    moteLife: 1.1,
    colorMoteA: '#ffffff',
    colorMoteB: '#dfe4ff',
    colorMoteC: '#8ea0ff',
    colorMoteD: '#ffffff',

    /* --- 7 · the beat --- */
    impactShake: 0.44, // camera punch on the beat
    impactFlash: 0.26, // screen flash on the beat
    colorFlash: '#ffffff',
    burstRadius: 3.4, // burst size, metres
    burstLife: 0.7,
    colorBurstA: '#ffffff',
    colorBurstB: '#dfe4ff',
    colorBurstC: '#8ea0ff',
    shockRadius: 3.2, // decal size, metres
    shockLife: 0.85,
    colorShockA: '#dfe4ff',
    colorShockB: '#ffffff',

    /* --- 8 · the aftershock --- */
    aftershockAt: 1.06, // fade progress the aftershock lands at (1 = fade start)
    aftershockRadius: 2.4, // aftershock ring size, metres
    aftershockShake: 0.18, // camera punch of the aftershock
    aftershockLight: 7, // light punch of the aftershock
    aftershockLife: 0.9, // seconds the aftershock ring lingers

    /* --- 9 · bodies --- */
    hitRadius: 1.15, // reach of the blow, metres
    hitImpulse: 7.13, // how hard bodies are thrown
    hitLift: 3.52, // how high they are thrown
    hitSpin: 2.4 // how fast they tumble
  }
};
