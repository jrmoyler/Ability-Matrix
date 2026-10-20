/**
 * Relic Lash — holy — a sheet that shears sideways as it travels.
 *
 * Holy — a relic chain lashes the line and brands what it crosses.
 *
 * Elemental Codex data block: presentation (`meta`) and the live settings the
 * ability and its editor folder read. Plain data, no imports, so
 * `settings.js` can pull it in without a cycle. Dragging any field re-shapes
 * a cast that is already in the air.
 */
export default {
  id: 'reliclash',
  meta: {
    label: 'Relic Lash',
    accent: '#fff1c4',
    key: '',
    element: 'holy',
    hint: 'Holy — a relic chain lashes the line and brands what it crosses',
    cast: 'line',
    glyph: '<path d="M16 62C30 28 48 78 64 36C74 18 80 48 88 30"/><path d="M78 60V84M68 70H88"/>'
  },
  settings: {
    /* --- the cast itself --- */
    range: 18, // maximum cast distance, metres
    minRange: 2, // closer than this and the cast is refused
    speed: 24, // metres/second the front travels
    lifetime: 1.35, // seconds the cast is held before it is released
    cooldown: 0.55, // seconds before it can be armed again
    castAnim: 'cast1', // which clip the body throws
    impactTime: 0.7, // impact phase length, × global lifetime
    fadeTime: 0.95, // fade phase length, × global lifetime
    zoneRadius: 0, // circle radius for zone casts, metres

    /* --- light --- */
    lightColor: '#fffdf6',
    lightIntensity: 11.2, // the glow riding the cast
    lightRadius: 11,
    lightFlicker: 0.2, // 0..1 how much it shimmers
    impactLight: 14.3, // extra light on the beat, decays on its own

    /* --- 1 · the body --- */
    spinSpeed: 1.12, // radians/second the body turns
    thickness: 0.22, // width of a single body part, metres
    count: 6, // parts in the body (max 12)
    height: 2.6, // how tall the body stands, metres
    sweep: 1.1, // lateral reach, metres
    lean: 0.45, // how far the body opens on the beat
    bodyOpacity: 0.7,
    edgeGlow: 3.08,
    softFade: 0.4, // soft intersection with the floor and bodies, metres
    bodyGlow: 0.59,
    bodyPulse: 0.12, // breathing in brightness, 0..1
    bodyPulseRate: 4, // breaths per second (radians)
    colorA: '#fff1c4',
    colorB: '#fffdf6',
    colorC: '#ffd36a',
    lensWarp: 0.49, // strength of the distortion it writes

    /* --- 2 · the voice --- */
    voiceOpacity: 0.65, // strength of the second placement
    colorVoiceA: '#fffdf6',
    colorVoiceB: '#fff1c4',

    /* --- 3 · the ground --- */
    groundWidth: 2.4, // footprint width, metres
    groundGlow: 1.4,
    groundLife: 1.5, // seconds the stamp lingers
    groundOpacity: 1, // strength of the stamp
    colorGroundA: '#fff1c4',
    colorGroundB: '#ffd36a',

    /* --- 4 · detail pieces --- */
    detailCount: 14, // pieces thrown (max 48)
    detailSize: 0.6, // mean piece size, metres
    detailSizeJitter: 0.35, // ± fraction of that
    detailSpread: 0.8, // reach of the pieces, × the cast reach
    detailLift: 1.96, // how high the pieces climb, metres
    detailSpin: 1, // how fast the pieces orbit, × body spin
    detailGlow: 1.68, // rim light on the pieces
    detailOpacity: 0.8, // how solid the pieces are
    colorDetailA: '#fff1c4',
    colorDetailB: '#fffdf6',
    colorDetailC: '#ffd36a',

    /* --- 5 · shed --- */
    dustRate: 48, // puffs per second
    dustSize: 0.22,
    dustSpeed: 3.5,
    dustLife: 0.8,
    dustOpacity: 0.55,
    colorDustA: '#fff1c4',
    colorDustB: '#fffdf6',
    colorDustC: '#ffd36a',
    colorDustD: '#1a140e',
    streakRate: 108, // sparks per second
    streakSize: 0.045,
    streakSpeed: 8,
    streakLife: 0.35,
    streakStretch: 1.4,
    colorStreakA: '#fffdf6',
    colorStreakB: '#fff1c4',
    colorStreakC: '#ffd36a',
    colorStreakD: '#ffffff',
    chipRate: 10.8, // fragments per second
    chipSize: 0.08,
    chipSpeed: 6,
    chipLife: 0.7,
    colorChipA: '#ffd36a',
    colorChipB: '#fff1c4',
    colorChipC: '#fffdf6',
    colorChipD: '#2a241c',

    /* --- 6 · motes --- */
    moteRate: 26, // motes per second off the pieces
    moteSize: 0.06,
    moteSpeed: 1.6, // metres/second they drift at
    moteLife: 1.1,
    colorMoteA: '#fffdf6',
    colorMoteB: '#fff1c4',
    colorMoteC: '#ffd36a',
    colorMoteD: '#ffffff',

    /* --- 7 · the beat --- */
    impactShake: 0.44, // camera punch on the beat
    impactFlash: 0.34, // screen flash on the beat
    colorFlash: '#fffdf6',
    burstRadius: 3.4, // burst size, metres
    burstLife: 0.7,
    colorBurstA: '#fffdf6',
    colorBurstB: '#fff1c4',
    colorBurstC: '#ffd36a',
    shockRadius: 3.2, // decal size, metres
    shockLife: 0.85,
    colorShockA: '#fff1c4',
    colorShockB: '#fffdf6',

    /* --- 8 · the aftershock --- */
    aftershockAt: 1.06, // fade progress the aftershock lands at (1 = fade start)
    aftershockRadius: 2.4, // aftershock ring size, metres
    aftershockShake: 0.18, // camera punch of the aftershock
    aftershockLight: 9.1, // light punch of the aftershock
    aftershockLife: 0.9, // seconds the aftershock ring lingers

    /* --- 9 · bodies --- */
    hitRadius: 1.15, // reach of the blow, metres
    hitImpulse: 6.75, // how hard bodies are thrown
    hitLift: 4.48, // how high they are thrown
    hitSpin: 2.4 // how fast they tumble
  }
};
