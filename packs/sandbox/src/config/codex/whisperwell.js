/**
 * Whisper Well — sound — a floor that inhales, then a column.
 *
 * Sound — a well of whisper inhales the circle, then shouts straight up.
 *
 * Elemental Codex data block: presentation (`meta`) and the live settings the
 * ability and its editor folder read. Plain data, no imports, so
 * `settings.js` can pull it in without a cycle. Dragging any field re-shapes
 * a cast that is already in the air.
 */
export default {
  id: 'whisperwell',
  meta: {
    label: 'Whisper Well',
    accent: '#fbffe8',
    key: '',
    element: 'sound',
    hint: 'Sound — a well of whisper inhales the circle, then shouts straight up',
    cast: 'zone',
    glyph: '<circle cx="50" cy="54" r="22"/><path d="M50 54V18"/><path d="M40 28L50 16L60 28"/><path d="M70 66C76 70 76 80 70 84M78 62C88 70 88 82 78 88"/>'
  },
  settings: {
    /* --- the cast itself --- */
    range: 18, // maximum cast distance, metres
    minRange: 2, // closer than this and the cast is refused
    speed: 20, // metres/second the front travels
    lifetime: 1.35, // seconds the cast is held before it is released
    cooldown: 0.55, // seconds before it can be armed again
    castAnim: 'cast1', // which clip the body throws
    impactTime: 0.7, // impact phase length, × global lifetime
    fadeTime: 0.95, // fade phase length, × global lifetime
    zoneRadius: 4.2, // circle radius for zone casts, metres

    /* --- light --- */
    lightColor: '#ffffff',
    lightIntensity: 8, // the glow riding the cast
    lightRadius: 11,
    lightFlicker: 0.5, // 0..1 how much it shimmers
    impactLight: 8.8, // extra light on the beat, decays on its own

    /* --- 1 · the body --- */
    spinSpeed: 1.68, // radians/second the body turns
    thickness: 0.22, // width of a single body part, metres
    count: 6, // parts in the body (max 12)
    height: 2.6, // how tall the body stands, metres
    sweep: 1.1, // lateral reach, metres
    lean: 0.45, // how far the body opens on the beat
    bodyOpacity: 0.7,
    edgeGlow: 2.2,
    softFade: 0.4, // soft intersection with the floor and bodies, metres
    bodyGlow: 0.42,
    bodyPulse: 0.12, // breathing in brightness, 0..1
    bodyPulseRate: 4, // breaths per second (radians)
    colorA: '#fbffe8',
    colorB: '#ffffff',
    colorC: '#d0eea0',
    lensWarp: 0.91, // strength of the distortion it writes

    /* --- 2 · the voice --- */
    voiceOpacity: 0.65, // strength of the second placement
    colorVoiceA: '#ffffff',
    colorVoiceB: '#fbffe8',

    /* --- 3 · the ground --- */
    groundWidth: 9, // footprint width, metres
    groundGlow: 1.4,
    groundLife: 1.5, // seconds the stamp lingers
    groundOpacity: 1, // strength of the stamp
    colorGroundA: '#fbffe8',
    colorGroundB: '#d0eea0',

    /* --- 4 · detail pieces --- */
    detailCount: 18, // pieces thrown (max 48)
    detailSize: 0.65, // mean piece size, metres
    detailSizeJitter: 0.35, // ± fraction of that
    detailSpread: 0.8, // reach of the pieces, × the cast reach
    detailLift: 3.2, // how high the pieces climb, metres
    detailSpin: 1, // how fast the pieces orbit, × body spin
    detailGlow: 1.2, // rim light on the pieces
    detailOpacity: 0.8, // how solid the pieces are
    colorDetailA: '#fbffe8',
    colorDetailB: '#ffffff',
    colorDetailC: '#d0eea0',

    /* --- 5 · shed --- */
    dustRate: 48, // puffs per second
    dustSize: 0.22,
    dustSpeed: 3.5,
    dustLife: 0.8,
    dustOpacity: 0.55,
    colorDustA: '#fbffe8',
    colorDustB: '#ffffff',
    colorDustC: '#d0eea0',
    colorDustD: '#1a140e',
    streakRate: 108, // sparks per second
    streakSize: 0.045,
    streakSpeed: 8,
    streakLife: 0.35,
    streakStretch: 1.4,
    colorStreakA: '#ffffff',
    colorStreakB: '#fbffe8',
    colorStreakC: '#d0eea0',
    colorStreakD: '#ffffff',
    chipRate: 10.8, // fragments per second
    chipSize: 0.08,
    chipSpeed: 6,
    chipLife: 0.7,
    colorChipA: '#d0eea0',
    colorChipB: '#fbffe8',
    colorChipC: '#ffffff',
    colorChipD: '#2a241c',

    /* --- 6 · motes --- */
    moteRate: 26, // motes per second off the pieces
    moteSize: 0.06,
    moteSpeed: 1.6, // metres/second they drift at
    moteLife: 1.1,
    colorMoteA: '#ffffff',
    colorMoteB: '#fbffe8',
    colorMoteC: '#d0eea0',
    colorMoteD: '#ffffff',

    /* --- 7 · the beat --- */
    impactShake: 0.5, // camera punch on the beat
    impactFlash: 0.21, // screen flash on the beat
    colorFlash: '#ffffff',
    burstRadius: 3.4, // burst size, metres
    burstLife: 0.7,
    colorBurstA: '#ffffff',
    colorBurstB: '#fbffe8',
    colorBurstC: '#d0eea0',
    shockRadius: 6.5, // decal size, metres
    shockLife: 0.85,
    colorShockA: '#fbffe8',
    colorShockB: '#ffffff',

    /* --- 8 · the aftershock --- */
    aftershockAt: 1.06, // fade progress the aftershock lands at (1 = fade start)
    aftershockRadius: 5, // aftershock ring size, metres
    aftershockShake: 0.2, // camera punch of the aftershock
    aftershockLight: 5.6, // light punch of the aftershock
    aftershockLife: 0.9, // seconds the aftershock ring lingers

    /* --- 9 · bodies --- */
    hitRadius: 4.4, // reach of the blow, metres
    hitImpulse: 7.5, // how hard bodies are thrown
    hitLift: 9, // how high they are thrown
    hitSpin: 2.4 // how fast they tumble
  }
};
