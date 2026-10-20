/**
 * Prism Fault — crystal — a drilling blade riding the line.
 *
 * Crystal — a fault of prism glass drills the line and throws three wakes.
 *
 * Elemental Codex data block: presentation (`meta`) and the live settings the
 * ability and its editor folder read. Plain data, no imports, so
 * `settings.js` can pull it in without a cycle. Dragging any field re-shapes
 * a cast that is already in the air.
 */
export default {
  id: 'prismfault',
  meta: {
    label: 'Prism Fault',
    accent: '#f3e2ff',
    key: '',
    element: 'crystal',
    hint: 'Crystal — a fault of prism glass drills the line and throws three wakes',
    cast: 'line',
    glyph: '<path d="M14 50H70"/><path d="M62 38L86 50L62 62"/><path d="M22 40V60"/><path d="M30 50H70"/><path d="M78 62L86 72L78 84L70 72Z"/>'
  },
  settings: {
    /* --- the cast itself --- */
    range: 18, // maximum cast distance, metres
    minRange: 2, // closer than this and the cast is refused
    speed: 27, // metres/second the front travels
    lifetime: 1.5, // seconds the cast is held before it is released
    cooldown: 0.55, // seconds before it can be armed again
    castAnim: 'cast2', // which clip the body throws
    impactTime: 0.78, // impact phase length, × global lifetime
    fadeTime: 0.95, // fade phase length, × global lifetime
    zoneRadius: 0, // circle radius for zone casts, metres

    /* --- light --- */
    lightColor: '#ffffff',
    lightIntensity: 10.4, // the glow riding the cast
    lightRadius: 11,
    lightFlicker: 0.35, // 0..1 how much it shimmers
    impactLight: 12.1, // extra light on the beat, decays on its own

    /* --- 1 · the body --- */
    spinSpeed: 2.2, // radians/second the body turns
    thickness: 0.28, // width of a single body part, metres
    count: 7, // parts in the body (max 12)
    height: 3.05, // how tall the body stands, metres
    sweep: 1.45, // lateral reach, metres
    lean: 0.65, // how far the body opens on the beat
    bodyOpacity: 0.7,
    edgeGlow: 3.25,
    softFade: 0.4, // soft intersection with the floor and bodies, metres
    bodyGlow: 0.55,
    bodyPulse: 0.12, // breathing in brightness, 0..1
    bodyPulseRate: 5, // breaths per second (radians)
    colorA: '#f3e2ff',
    colorB: '#ffffff',
    colorC: '#c9a0ff',
    lensWarp: 0.77, // strength of the distortion it writes

    /* --- 2 · the voice --- */
    voiceOpacity: 0.65, // strength of the second placement
    colorVoiceA: '#ffffff',
    colorVoiceB: '#f3e2ff',

    /* --- 3 · the ground --- */
    groundWidth: 2.4, // footprint width, metres
    groundGlow: 1.4,
    groundLife: 1.5, // seconds the stamp lingers
    groundOpacity: 1, // strength of the stamp
    colorGroundA: '#f3e2ff',
    colorGroundB: '#c9a0ff',

    /* --- 4 · detail pieces --- */
    detailCount: 16, // pieces thrown (max 48)
    detailSize: 0.6, // mean piece size, metres
    detailSizeJitter: 0.35, // ± fraction of that
    detailSpread: 0.8, // reach of the pieces, × the cast reach
    detailLift: 1.2, // how high the pieces climb, metres
    detailSpin: 1, // how fast the pieces orbit, × body spin
    detailGlow: 1.56, // rim light on the pieces
    detailOpacity: 0.95, // how solid the pieces are
    colorDetailA: '#f3e2ff',
    colorDetailB: '#ffffff',
    colorDetailC: '#c9a0ff',

    /* --- 5 · shed --- */
    dustRate: 40, // puffs per second
    dustSize: 0.22,
    dustSpeed: 3.5,
    dustLife: 0.8,
    dustOpacity: 0.55,
    colorDustA: '#f3e2ff',
    colorDustB: '#ffffff',
    colorDustC: '#c9a0ff',
    colorDustD: '#1a140e',
    streakRate: 126, // sparks per second
    streakSize: 0.045,
    streakSpeed: 8,
    streakLife: 0.35,
    streakStretch: 1.4,
    colorStreakA: '#ffffff',
    colorStreakB: '#f3e2ff',
    colorStreakC: '#c9a0ff',
    colorStreakD: '#ffffff',
    chipRate: 46.8, // fragments per second
    chipSize: 0.08,
    chipSpeed: 6,
    chipLife: 0.7,
    colorChipA: '#c9a0ff',
    colorChipB: '#f3e2ff',
    colorChipC: '#ffffff',
    colorChipD: '#2a241c',

    /* --- 6 · motes --- */
    moteRate: 26, // motes per second off the pieces
    moteSize: 0.06,
    moteSpeed: 1.6, // metres/second they drift at
    moteLife: 1.1,
    colorMoteA: '#ffffff',
    colorMoteB: '#f3e2ff',
    colorMoteC: '#c9a0ff',
    colorMoteD: '#ffffff',

    /* --- 7 · the beat --- */
    impactShake: 0.5, // camera punch on the beat
    impactFlash: 0.29, // screen flash on the beat
    colorFlash: '#ffffff',
    burstRadius: 3.7, // burst size, metres
    burstLife: 0.7,
    colorBurstA: '#ffffff',
    colorBurstB: '#f3e2ff',
    colorBurstC: '#c9a0ff',
    shockRadius: 3.2, // decal size, metres
    shockLife: 0.85,
    colorShockA: '#f3e2ff',
    colorShockB: '#ffffff',

    /* --- 8 · the aftershock --- */
    aftershockAt: 1.06, // fade progress the aftershock lands at (1 = fade start)
    aftershockRadius: 2.4, // aftershock ring size, metres
    aftershockShake: 0.2, // camera punch of the aftershock
    aftershockLight: 7.7, // light punch of the aftershock
    aftershockLife: 0.9, // seconds the aftershock ring lingers

    /* --- 9 · bodies --- */
    hitRadius: 1.15, // reach of the blow, metres
    hitImpulse: 8.5, // how hard bodies are thrown
    hitLift: 3.2, // how high they are thrown
    hitSpin: 2.4 // how fast they tumble
  }
};
