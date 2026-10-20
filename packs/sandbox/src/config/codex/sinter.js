/**
 * Sinter Plate — earth — a ring that walks, then commits.
 *
 * Earth — a plate of sinter walks the rim, locks, and stamps the circle flat.
 *
 * Elemental Codex data block: presentation (`meta`) and the live settings the
 * ability and its editor folder read. Plain data, no imports, so
 * `settings.js` can pull it in without a cycle. Dragging any field re-shapes
 * a cast that is already in the air.
 */
export default {
  id: 'sinter',
  meta: {
    label: 'Sinter Plate',
    accent: '#d7b07a',
    key: '',
    element: 'earth',
    hint: 'Earth — a plate of sinter walks the rim, locks, and stamps the circle flat',
    cast: 'zone',
    glyph: '<circle cx="50" cy="50" r="28"/><circle cx="50" cy="50" r="10"/><path d="M50 8V18M50 82V92M8 50H18M82 50H92"/><path d="M70 82L78 66L86 82Z"/>'
  },
  settings: {
    /* --- the cast itself --- */
    range: 18, // maximum cast distance, metres
    minRange: 2, // closer than this and the cast is refused
    speed: 17, // metres/second the front travels
    lifetime: 1.35, // seconds the cast is held before it is released
    cooldown: 0.55, // seconds before it can be armed again
    castAnim: 'cast1', // which clip the body throws
    impactTime: 0.7, // impact phase length, × global lifetime
    fadeTime: 0.95, // fade phase length, × global lifetime
    zoneRadius: 4.2, // circle radius for zone casts, metres

    /* --- light --- */
    lightColor: '#fff6e4',
    lightIntensity: 6.4, // the glow riding the cast
    lightRadius: 11,
    lightFlicker: 0.12, // 0..1 how much it shimmers
    impactLight: 8.8, // extra light on the beat, decays on its own

    /* --- 1 · the body --- */
    spinSpeed: 0.84, // radians/second the body turns
    thickness: 0.22, // width of a single body part, metres
    count: 6, // parts in the body (max 12)
    height: 2.6, // how tall the body stands, metres
    sweep: 1.1, // lateral reach, metres
    lean: 0.45, // how far the body opens on the beat
    bodyOpacity: 0.7,
    edgeGlow: 1.76,
    softFade: 0.4, // soft intersection with the floor and bodies, metres
    bodyGlow: 0.34,
    bodyPulse: 0.12, // breathing in brightness, 0..1
    bodyPulseRate: 4, // breaths per second (radians)
    colorA: '#d7b07a',
    colorB: '#fff6e4',
    colorC: '#6e4a28',
    lensWarp: 0.42, // strength of the distortion it writes

    /* --- 2 · the voice --- */
    voiceOpacity: 0.65, // strength of the second placement
    colorVoiceA: '#fff6e4',
    colorVoiceB: '#d7b07a',

    /* --- 3 · the ground --- */
    groundWidth: 9, // footprint width, metres
    groundGlow: 1.4,
    groundLife: 1.5, // seconds the stamp lingers
    groundOpacity: 1, // strength of the stamp
    colorGroundA: '#d7b07a',
    colorGroundB: '#6e4a28',

    /* --- 4 · detail pieces --- */
    detailCount: 16, // pieces thrown (max 48)
    detailSize: 0.55, // mean piece size, metres
    detailSizeJitter: 0.35, // ± fraction of that
    detailSpread: 0.8, // reach of the pieces, × the cast reach
    detailLift: 0.81, // how high the pieces climb, metres
    detailSpin: 1, // how fast the pieces orbit, × body spin
    detailGlow: 0.96, // rim light on the pieces
    detailOpacity: 0.95, // how solid the pieces are
    colorDetailA: '#d7b07a',
    colorDetailB: '#fff6e4',
    colorDetailC: '#6e4a28',

    /* --- 5 · shed --- */
    dustRate: 104, // puffs per second
    dustSize: 0.22,
    dustSpeed: 3.5,
    dustLife: 0.8,
    dustOpacity: 0.55,
    colorDustA: '#d7b07a',
    colorDustB: '#fff6e4',
    colorDustC: '#6e4a28',
    colorDustD: '#1a140e',
    streakRate: 54, // sparks per second
    streakSize: 0.045,
    streakSpeed: 8,
    streakLife: 0.35,
    streakStretch: 1.4,
    colorStreakA: '#fff6e4',
    colorStreakB: '#d7b07a',
    colorStreakC: '#6e4a28',
    colorStreakD: '#ffffff',
    chipRate: 54, // fragments per second
    chipSize: 0.08,
    chipSpeed: 6,
    chipLife: 0.7,
    colorChipA: '#6e4a28',
    colorChipB: '#d7b07a',
    colorChipC: '#fff6e4',
    colorChipD: '#2a241c',

    /* --- 6 · motes --- */
    moteRate: 26, // motes per second off the pieces
    moteSize: 0.06,
    moteSpeed: 1.6, // metres/second they drift at
    moteLife: 1.1,
    colorMoteA: '#fff6e4',
    colorMoteB: '#d7b07a',
    colorMoteC: '#6e4a28',
    colorMoteD: '#ffffff',

    /* --- 7 · the beat --- */
    impactShake: 0.72, // camera punch on the beat
    impactFlash: 0.21, // screen flash on the beat
    colorFlash: '#fff6e4',
    burstRadius: 3.4, // burst size, metres
    burstLife: 0.7,
    colorBurstA: '#fff6e4',
    colorBurstB: '#d7b07a',
    colorBurstC: '#6e4a28',
    shockRadius: 6.5, // decal size, metres
    shockLife: 0.85,
    colorShockA: '#d7b07a',
    colorShockB: '#fff6e4',

    /* --- 8 · the aftershock --- */
    aftershockAt: 1.06, // fade progress the aftershock lands at (1 = fade start)
    aftershockRadius: 5, // aftershock ring size, metres
    aftershockShake: 0.29, // camera punch of the aftershock
    aftershockLight: 5.6, // light punch of the aftershock
    aftershockLife: 0.9, // seconds the aftershock ring lingers

    /* --- 9 · bodies --- */
    hitRadius: 4.4, // reach of the blow, metres
    hitImpulse: 9.38, // how hard bodies are thrown
    hitLift: 2.88, // how high they are thrown
    hitSpin: 2.4 // how fast they tumble
  }
};
