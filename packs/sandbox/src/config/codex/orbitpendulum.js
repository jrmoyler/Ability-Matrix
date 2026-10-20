/**
 * Orbit Pendulum — motion — a blade hinged at the hand.
 *
 * Motion — a mass on a tether orbits the cast and releases at the far end.
 *
 * Elemental Codex data block: presentation (`meta`) and the live settings the
 * ability and its editor folder read. Plain data, no imports, so
 * `settings.js` can pull it in without a cycle. Dragging any field re-shapes
 * a cast that is already in the air.
 */
export default {
  id: 'orbitpendulum',
  meta: {
    label: 'Orbit Pendulum',
    accent: '#ffd8bc',
    key: '',
    element: 'motion',
    hint: 'Motion — a mass on a tether orbits the cast and releases at the far end',
    cast: 'line',
    glyph: '<path d="M50 16V28"/><path d="M18 78L50 28L82 70"/><circle cx="50" cy="18" r="5"/><path d="M36 36L64 64M64 36L36 64"/><path d="M66 66H86M70 72H90M66 78H86"/>'
  },
  settings: {
    /* --- the cast itself --- */
    range: 18, // maximum cast distance, metres
    minRange: 2, // closer than this and the cast is refused
    speed: 45, // metres/second the front travels
    lifetime: 1.65, // seconds the cast is held before it is released
    cooldown: 0.55, // seconds before it can be armed again
    castAnim: 'cast3', // which clip the body throws
    impactTime: 0.86, // impact phase length, × global lifetime
    fadeTime: 0.95, // fade phase length, × global lifetime
    zoneRadius: 0, // circle radius for zone casts, metres

    /* --- light --- */
    lightColor: '#ffffff',
    lightIntensity: 8, // the glow riding the cast
    lightRadius: 11,
    lightFlicker: 0.3, // 0..1 how much it shimmers
    impactLight: 8.8, // extra light on the beat, decays on its own

    /* --- 1 · the body --- */
    spinSpeed: 4.2, // radians/second the body turns
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
    colorA: '#ffd8bc',
    colorB: '#ffffff',
    colorC: '#ff9966',
    lensWarp: 1.1, // strength of the distortion it writes

    /* --- 2 · the voice --- */
    voiceOpacity: 0.65, // strength of the second placement
    colorVoiceA: '#ffffff',
    colorVoiceB: '#ffd8bc',

    /* --- 3 · the ground --- */
    groundWidth: 2.4, // footprint width, metres
    groundGlow: 1.4,
    groundLife: 1.5, // seconds the stamp lingers
    groundOpacity: 1, // strength of the stamp
    colorGroundA: '#ffd8bc',
    colorGroundB: '#ff9966',

    /* --- 4 · detail pieces --- */
    detailCount: 14, // pieces thrown (max 48)
    detailSize: 0.5, // mean piece size, metres
    detailSizeJitter: 0.35, // ± fraction of that
    detailSpread: 0.8, // reach of the pieces, × the cast reach
    detailLift: 1.28, // how high the pieces climb, metres
    detailSpin: 1, // how fast the pieces orbit, × body spin
    detailGlow: 1.2, // rim light on the pieces
    detailOpacity: 0.8, // how solid the pieces are
    colorDetailA: '#ffd8bc',
    colorDetailB: '#ffffff',
    colorDetailC: '#ff9966',

    /* --- 5 · shed --- */
    dustRate: 72, // puffs per second
    dustSize: 0.22,
    dustSpeed: 3.5,
    dustLife: 0.8,
    dustOpacity: 0.55,
    colorDustA: '#ffd8bc',
    colorDustB: '#ffffff',
    colorDustC: '#ff9966',
    colorDustD: '#1a140e',
    streakRate: 153, // sparks per second
    streakSize: 0.045,
    streakSpeed: 8,
    streakLife: 0.35,
    streakStretch: 1.4,
    colorStreakA: '#ffffff',
    colorStreakB: '#ffd8bc',
    colorStreakC: '#ff9966',
    colorStreakD: '#ffffff',
    chipRate: 25.2, // fragments per second
    chipSize: 0.08,
    chipSpeed: 6,
    chipLife: 0.7,
    colorChipA: '#ff9966',
    colorChipB: '#ffd8bc',
    colorChipC: '#ffffff',
    colorChipD: '#2a241c',

    /* --- 6 · motes --- */
    moteRate: 26, // motes per second off the pieces
    moteSize: 0.06,
    moteSpeed: 1.6, // metres/second they drift at
    moteLife: 1.1,
    colorMoteA: '#ffffff',
    colorMoteB: '#ffd8bc',
    colorMoteC: '#ff9966',
    colorMoteD: '#ffffff',

    /* --- 7 · the beat --- */
    impactShake: 0.5, // camera punch on the beat
    impactFlash: 0.21, // screen flash on the beat
    colorFlash: '#ffffff',
    burstRadius: 4, // burst size, metres
    burstLife: 0.7,
    colorBurstA: '#ffffff',
    colorBurstB: '#ffd8bc',
    colorBurstC: '#ff9966',
    shockRadius: 3.2, // decal size, metres
    shockLife: 0.85,
    colorShockA: '#ffd8bc',
    colorShockB: '#ffffff',

    /* --- 8 · the aftershock --- */
    aftershockAt: 1.06, // fade progress the aftershock lands at (1 = fade start)
    aftershockRadius: 2.4, // aftershock ring size, metres
    aftershockShake: 0.2, // camera punch of the aftershock
    aftershockLight: 5.6, // light punch of the aftershock
    aftershockLife: 0.9, // seconds the aftershock ring lingers

    /* --- 9 · bodies --- */
    hitRadius: 1.15, // reach of the blow, metres
    hitImpulse: 10.45, // how hard bodies are thrown
    hitLift: 2.56, // how high they are thrown
    hitSpin: 2.4 // how fast they tumble
  }
};
