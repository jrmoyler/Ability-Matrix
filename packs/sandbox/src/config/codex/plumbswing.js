/**
 * Plumb Swing — gravity — a blade hinged at the hand.
 *
 * Gravity — a plumb weight swings across the cast and craters the far side.
 *
 * Elemental Codex data block: presentation (`meta`) and the live settings the
 * ability and its editor folder read. Plain data, no imports, so
 * `settings.js` can pull it in without a cycle. Dragging any field re-shapes
 * a cast that is already in the air.
 */
export default {
  id: 'plumbswing',
  meta: {
    label: 'Plumb Swing',
    accent: '#d2c2ae',
    key: '',
    element: 'gravity',
    hint: 'Gravity — a plumb weight swings across the cast and craters the far side',
    cast: 'line',
    glyph: '<path d="M50 16V28"/><path d="M18 78L50 28L82 70"/><circle cx="50" cy="18" r="5"/><circle cx="78" cy="72" r="3"/><path d="M78 60V66M78 78V84M66 72H72M84 72H90"/>'
  },
  settings: {
    /* --- the cast itself --- */
    range: 18, // maximum cast distance, metres
    minRange: 2, // closer than this and the cast is refused
    speed: 19.2, // metres/second the front travels
    lifetime: 1.35, // seconds the cast is held before it is released
    cooldown: 0.55, // seconds before it can be armed again
    castAnim: 'cast1', // which clip the body throws
    impactTime: 0.7, // impact phase length, × global lifetime
    fadeTime: 0.95, // fade phase length, × global lifetime
    zoneRadius: 0, // circle radius for zone casts, metres

    /* --- light --- */
    lightColor: '#fff4e6',
    lightIntensity: 7.2, // the glow riding the cast
    lightRadius: 11,
    lightFlicker: 0.1, // 0..1 how much it shimmers
    impactLight: 8.8, // extra light on the beat, decays on its own

    /* --- 1 · the body --- */
    spinSpeed: 0.98, // radians/second the body turns
    thickness: 0.22, // width of a single body part, metres
    count: 6, // parts in the body (max 12)
    height: 2.6, // how tall the body stands, metres
    sweep: 1.1, // lateral reach, metres
    lean: 0.45, // how far the body opens on the beat
    bodyOpacity: 0.7,
    edgeGlow: 1.98,
    softFade: 0.4, // soft intersection with the floor and bodies, metres
    bodyGlow: 0.38,
    bodyPulse: 0.12, // breathing in brightness, 0..1
    bodyPulseRate: 4, // breaths per second (radians)
    colorA: '#d2c2ae',
    colorB: '#fff4e6',
    colorC: '#6a5340',
    lensWarp: 1.05, // strength of the distortion it writes

    /* --- 2 · the voice --- */
    voiceOpacity: 0.65, // strength of the second placement
    colorVoiceA: '#fff4e6',
    colorVoiceB: '#d2c2ae',

    /* --- 3 · the ground --- */
    groundWidth: 2.4, // footprint width, metres
    groundGlow: 1.4,
    groundLife: 1.5, // seconds the stamp lingers
    groundOpacity: 1, // strength of the stamp
    colorGroundA: '#d2c2ae',
    colorGroundB: '#6a5340',

    /* --- 4 · detail pieces --- */
    detailCount: 14, // pieces thrown (max 48)
    detailSize: 0.7, // mean piece size, metres
    detailSizeJitter: 0.35, // ± fraction of that
    detailSpread: 0.8, // reach of the pieces, × the cast reach
    detailLift: 0.96, // how high the pieces climb, metres
    detailSpin: 1, // how fast the pieces orbit, × body spin
    detailGlow: 1.08, // rim light on the pieces
    detailOpacity: 0.95, // how solid the pieces are
    colorDetailA: '#d2c2ae',
    colorDetailB: '#fff4e6',
    colorDetailC: '#6a5340',

    /* --- 5 · shed --- */
    dustRate: 80, // puffs per second
    dustSize: 0.22,
    dustSpeed: 3.5,
    dustLife: 0.8,
    dustOpacity: 0.55,
    colorDustA: '#d2c2ae',
    colorDustB: '#fff4e6',
    colorDustC: '#6a5340',
    colorDustD: '#1a140e',
    streakRate: 45, // sparks per second
    streakSize: 0.045,
    streakSpeed: 8,
    streakLife: 0.35,
    streakStretch: 1.4,
    colorStreakA: '#fff4e6',
    colorStreakB: '#d2c2ae',
    colorStreakC: '#6a5340',
    colorStreakD: '#ffffff',
    chipRate: 43.2, // fragments per second
    chipSize: 0.08,
    chipSpeed: 6,
    chipLife: 0.7,
    colorChipA: '#6a5340',
    colorChipB: '#d2c2ae',
    colorChipC: '#fff4e6',
    colorChipD: '#2a241c',

    /* --- 6 · motes --- */
    moteRate: 26, // motes per second off the pieces
    moteSize: 0.06,
    moteSpeed: 1.6, // metres/second they drift at
    moteLife: 1.1,
    colorMoteA: '#fff4e6',
    colorMoteB: '#d2c2ae',
    colorMoteC: '#6a5340',
    colorMoteD: '#ffffff',

    /* --- 7 · the beat --- */
    impactShake: 0.77, // camera punch on the beat
    impactFlash: 0.21, // screen flash on the beat
    colorFlash: '#fff4e6',
    burstRadius: 3.4, // burst size, metres
    burstLife: 0.7,
    colorBurstA: '#fff4e6',
    colorBurstB: '#d2c2ae',
    colorBurstC: '#6a5340',
    shockRadius: 3.2, // decal size, metres
    shockLife: 0.85,
    colorShockA: '#d2c2ae',
    colorShockB: '#fff4e6',

    /* --- 8 · the aftershock --- */
    aftershockAt: 1.06, // fade progress the aftershock lands at (1 = fade start)
    aftershockRadius: 2.4, // aftershock ring size, metres
    aftershockShake: 0.31, // camera punch of the aftershock
    aftershockLight: 5.6, // light punch of the aftershock
    aftershockLife: 0.9, // seconds the aftershock ring lingers

    /* --- 9 · bodies --- */
    hitRadius: 1.15, // reach of the blow, metres
    hitImpulse: 9.75, // how hard bodies are thrown
    hitLift: 1.92, // how high they are thrown
    hitSpin: 2.4 // how fast they tumble
  }
};
