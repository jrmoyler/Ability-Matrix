/**
 * Loess Curtain — earth — a sheet that shears sideways as it travels.
 *
 * Earth — a curtain of loess snaps sideways and buries the line.
 *
 * Elemental Codex data block: presentation (`meta`) and the live settings the
 * ability and its editor folder read. Plain data, no imports, so
 * `settings.js` can pull it in without a cycle. Dragging any field re-shapes
 * a cast that is already in the air.
 */
export default {
  id: 'loess',
  meta: {
    label: 'Loess Curtain',
    accent: '#efe0c4',
    key: '',
    element: 'earth',
    hint: 'Earth — a curtain of loess snaps sideways and buries the line',
    cast: 'line',
    glyph: '<path d="M16 62C30 28 48 78 64 36C74 18 80 48 88 30"/><path d="M70 82L78 66L86 82Z"/>'
  },
  settings: {
    /* --- the cast itself --- */
    range: 18, // maximum cast distance, metres
    minRange: 2, // closer than this and the cast is refused
    speed: 20.4, // metres/second the front travels
    lifetime: 1.35, // seconds the cast is held before it is released
    cooldown: 0.55, // seconds before it can be armed again
    castAnim: 'cast1', // which clip the body throws
    impactTime: 0.7, // impact phase length, × global lifetime
    fadeTime: 0.95, // fade phase length, × global lifetime
    zoneRadius: 0, // circle radius for zone casts, metres

    /* --- light --- */
    lightColor: '#fffaf0',
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
    colorA: '#efe0c4',
    colorB: '#fffaf0',
    colorC: '#a08050',
    lensWarp: 0.42, // strength of the distortion it writes

    /* --- 2 · the voice --- */
    voiceOpacity: 0.65, // strength of the second placement
    colorVoiceA: '#fffaf0',
    colorVoiceB: '#efe0c4',

    /* --- 3 · the ground --- */
    groundWidth: 2.4, // footprint width, metres
    groundGlow: 1.4,
    groundLife: 1.5, // seconds the stamp lingers
    groundOpacity: 1, // strength of the stamp
    colorGroundA: '#efe0c4',
    colorGroundB: '#a08050',

    /* --- 4 · detail pieces --- */
    detailCount: 14, // pieces thrown (max 48)
    detailSize: 0.55, // mean piece size, metres
    detailSizeJitter: 0.35, // ± fraction of that
    detailSpread: 0.8, // reach of the pieces, × the cast reach
    detailLift: 1.26, // how high the pieces climb, metres
    detailSpin: 1, // how fast the pieces orbit, × body spin
    detailGlow: 0.96, // rim light on the pieces
    detailOpacity: 0.95, // how solid the pieces are
    colorDetailA: '#efe0c4',
    colorDetailB: '#fffaf0',
    colorDetailC: '#a08050',

    /* --- 5 · shed --- */
    dustRate: 104, // puffs per second
    dustSize: 0.22,
    dustSpeed: 3.5,
    dustLife: 0.8,
    dustOpacity: 0.55,
    colorDustA: '#efe0c4',
    colorDustB: '#fffaf0',
    colorDustC: '#a08050',
    colorDustD: '#1a140e',
    streakRate: 54, // sparks per second
    streakSize: 0.045,
    streakSpeed: 8,
    streakLife: 0.35,
    streakStretch: 1.4,
    colorStreakA: '#fffaf0',
    colorStreakB: '#efe0c4',
    colorStreakC: '#a08050',
    colorStreakD: '#ffffff',
    chipRate: 54, // fragments per second
    chipSize: 0.08,
    chipSpeed: 6,
    chipLife: 0.7,
    colorChipA: '#a08050',
    colorChipB: '#efe0c4',
    colorChipC: '#fffaf0',
    colorChipD: '#2a241c',

    /* --- 6 · motes --- */
    moteRate: 26, // motes per second off the pieces
    moteSize: 0.06,
    moteSpeed: 1.6, // metres/second they drift at
    moteLife: 1.1,
    colorMoteA: '#fffaf0',
    colorMoteB: '#efe0c4',
    colorMoteC: '#a08050',
    colorMoteD: '#ffffff',

    /* --- 7 · the beat --- */
    impactShake: 0.72, // camera punch on the beat
    impactFlash: 0.21, // screen flash on the beat
    colorFlash: '#fffaf0',
    burstRadius: 3.4, // burst size, metres
    burstLife: 0.7,
    colorBurstA: '#fffaf0',
    colorBurstB: '#efe0c4',
    colorBurstC: '#a08050',
    shockRadius: 3.2, // decal size, metres
    shockLife: 0.85,
    colorShockA: '#efe0c4',
    colorShockB: '#fffaf0',

    /* --- 8 · the aftershock --- */
    aftershockAt: 1.06, // fade progress the aftershock lands at (1 = fade start)
    aftershockRadius: 2.4, // aftershock ring size, metres
    aftershockShake: 0.29, // camera punch of the aftershock
    aftershockLight: 5.6, // light punch of the aftershock
    aftershockLife: 0.9, // seconds the aftershock ring lingers

    /* --- 9 · bodies --- */
    hitRadius: 1.15, // reach of the blow, metres
    hitImpulse: 9.38, // how hard bodies are thrown
    hitLift: 2.88, // how high they are thrown
    hitSpin: 2.4 // how fast they tumble
  }
};
