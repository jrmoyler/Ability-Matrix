/**
 * Impulse Well — force — a floor that inhales, then a column.
 *
 * Force — impulse collects at the centre and dumps along the floor.
 *
 * Elemental Codex data block: presentation (`meta`) and the live settings the
 * ability and its editor folder read. Plain data, no imports, so
 * `settings.js` can pull it in without a cycle. Dragging any field re-shapes
 * a cast that is already in the air.
 */
export default {
  id: 'impulse',
  meta: {
    label: 'Impulse Well',
    accent: '#ffe0c2',
    key: '',
    element: 'force',
    hint: 'Force — impulse collects at the centre and dumps along the floor',
    cast: 'zone',
    glyph: '<circle cx="50" cy="54" r="22"/><path d="M50 54V18"/><path d="M40 28L50 16L60 28"/><path d="M36 36L64 64M64 36L36 64"/><path d="M66 72H90M82 64L90 72L82 80"/>'
  },
  settings: {
    /* --- the cast itself --- */
    range: 18, // maximum cast distance, metres
    minRange: 2, // closer than this and the cast is refused
    speed: 26.4, // metres/second the front travels
    lifetime: 1.65, // seconds the cast is held before it is released
    cooldown: 0.55, // seconds before it can be armed again
    castAnim: 'cast3', // which clip the body throws
    impactTime: 0.86, // impact phase length, × global lifetime
    fadeTime: 0.95, // fade phase length, × global lifetime
    zoneRadius: 4.7, // circle radius for zone casts, metres

    /* --- light --- */
    lightColor: '#fff8f0',
    lightIntensity: 8, // the glow riding the cast
    lightRadius: 11,
    lightFlicker: 0.2, // 0..1 how much it shimmers
    impactLight: 9.9, // extra light on the beat, decays on its own

    /* --- 1 · the body --- */
    spinSpeed: 2.7, // radians/second the body turns
    thickness: 0.34, // width of a single body part, metres
    count: 8, // parts in the body (max 12)
    height: 3.5, // how tall the body stands, metres
    sweep: 1.8, // lateral reach, metres
    lean: 0.85, // how far the body opens on the beat
    bodyOpacity: 0.7,
    edgeGlow: 2.8,
    softFade: 0.4, // soft intersection with the floor and bodies, metres
    bodyGlow: 0.42,
    bodyPulse: 0.12, // breathing in brightness, 0..1
    bodyPulseRate: 6, // breaths per second (radians)
    colorA: '#ffe0c2',
    colorB: '#fff8f0',
    colorC: '#ffb068',
    lensWarp: 1.2, // strength of the distortion it writes

    /* --- 2 · the voice --- */
    voiceOpacity: 0.65, // strength of the second placement
    colorVoiceA: '#fff8f0',
    colorVoiceB: '#ffe0c2',

    /* --- 3 · the ground --- */
    groundWidth: 9, // footprint width, metres
    groundGlow: 1.4,
    groundLife: 1.5, // seconds the stamp lingers
    groundOpacity: 1, // strength of the stamp
    colorGroundA: '#ffe0c2',
    colorGroundB: '#ffb068',

    /* --- 4 · detail pieces --- */
    detailCount: 18, // pieces thrown (max 48)
    detailSize: 0.6, // mean piece size, metres
    detailSizeJitter: 0.35, // ± fraction of that
    detailSpread: 0.8, // reach of the pieces, × the cast reach
    detailLift: 3.2, // how high the pieces climb, metres
    detailSpin: 1, // how fast the pieces orbit, × body spin
    detailGlow: 1.2, // rim light on the pieces
    detailOpacity: 0.95, // how solid the pieces are
    colorDetailA: '#ffe0c2',
    colorDetailB: '#fff8f0',
    colorDetailC: '#ffb068',

    /* --- 5 · shed --- */
    dustRate: 72, // puffs per second
    dustSize: 0.22,
    dustSpeed: 3.5,
    dustLife: 0.8,
    dustOpacity: 0.55,
    colorDustA: '#ffe0c2',
    colorDustB: '#fff8f0',
    colorDustC: '#ffb068',
    colorDustD: '#1a140e',
    streakRate: 90, // sparks per second
    streakSize: 0.045,
    streakSpeed: 8,
    streakLife: 0.35,
    streakStretch: 1.4,
    colorStreakA: '#fff8f0',
    colorStreakB: '#ffe0c2',
    colorStreakC: '#ffb068',
    colorStreakD: '#ffffff',
    chipRate: 36, // fragments per second
    chipSize: 0.08,
    chipSpeed: 6,
    chipLife: 0.7,
    colorChipA: '#ffb068',
    colorChipB: '#ffe0c2',
    colorChipC: '#fff8f0',
    colorChipD: '#2a241c',

    /* --- 6 · motes --- */
    moteRate: 26, // motes per second off the pieces
    moteSize: 0.06,
    moteSpeed: 1.6, // metres/second they drift at
    moteLife: 1.1,
    colorMoteA: '#fff8f0',
    colorMoteB: '#ffe0c2',
    colorMoteC: '#ffb068',
    colorMoteD: '#ffffff',

    /* --- 7 · the beat --- */
    impactShake: 0.72, // camera punch on the beat
    impactFlash: 0.23, // screen flash on the beat
    colorFlash: '#fff8f0',
    burstRadius: 4, // burst size, metres
    burstLife: 0.7,
    colorBurstA: '#fff8f0',
    colorBurstB: '#ffe0c2',
    colorBurstC: '#ffb068',
    shockRadius: 6.5, // decal size, metres
    shockLife: 0.85,
    colorShockA: '#ffe0c2',
    colorShockB: '#fff8f0',

    /* --- 8 · the aftershock --- */
    aftershockAt: 1.06, // fade progress the aftershock lands at (1 = fade start)
    aftershockRadius: 5, // aftershock ring size, metres
    aftershockShake: 0.29, // camera punch of the aftershock
    aftershockLight: 6.3, // light punch of the aftershock
    aftershockLife: 0.9, // seconds the aftershock ring lingers

    /* --- 9 · bodies --- */
    hitRadius: 4.4, // reach of the blow, metres
    hitImpulse: 13.3, // how hard bodies are thrown
    hitLift: 9, // how high they are thrown
    hitSpin: 2.4 // how fast they tumble
  }
};
