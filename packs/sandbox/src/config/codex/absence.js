/**
 * Absence Lance — void — a drilling blade riding the line.
 *
 * Void — a lance of absence unmakes the line as it passes.
 *
 * Elemental Codex data block: presentation (`meta`) and the live settings the
 * ability and its editor folder read. Plain data, no imports, so
 * `settings.js` can pull it in without a cycle. Dragging any field re-shapes
 * a cast that is already in the air.
 */
export default {
  id: 'absence',
  meta: {
    label: 'Absence Lance',
    accent: '#9a90e0',
    key: '',
    element: 'void',
    hint: 'Void — a lance of absence unmakes the line as it passes',
    cast: 'line',
    glyph: '<path d="M14 50H70"/><path d="M62 38L86 50L62 62"/><path d="M22 40V60"/><path d="M36 36L64 64M64 36L36 64"/><circle cx="78" cy="72" r="8"/><circle cx="78" cy="72" r="2"/>'
  },
  settings: {
    /* --- the cast itself --- */
    range: 18, // maximum cast distance, metres
    minRange: 2, // closer than this and the cast is refused
    speed: 30, // metres/second the front travels
    lifetime: 1.65, // seconds the cast is held before it is released
    cooldown: 0.55, // seconds before it can be armed again
    castAnim: 'cast3', // which clip the body throws
    impactTime: 0.86, // impact phase length, × global lifetime
    fadeTime: 0.95, // fade phase length, × global lifetime
    zoneRadius: 0, // circle radius for zone casts, metres

    /* --- light --- */
    lightColor: '#ffffff',
    lightIntensity: 5.6, // the glow riding the cast
    lightRadius: 11,
    lightFlicker: 0.25, // 0..1 how much it shimmers
    impactLight: 6.6, // extra light on the beat, decays on its own

    /* --- 1 · the body --- */
    spinSpeed: 3.6, // radians/second the body turns
    thickness: 0.34, // width of a single body part, metres
    count: 8, // parts in the body (max 12)
    height: 3.5, // how tall the body stands, metres
    sweep: 1.8, // lateral reach, metres
    lean: 0.85, // how far the body opens on the beat
    bodyOpacity: 0.5,
    edgeGlow: 1.47,
    softFade: 0.4, // soft intersection with the floor and bodies, metres
    bodyGlow: 0.22,
    bodyPulse: 0.12, // breathing in brightness, 0..1
    bodyPulseRate: 6, // breaths per second (radians)
    colorA: '#9a90e0',
    colorB: '#ffffff',
    colorC: '#2c2048',
    lensWarp: 1.6, // strength of the distortion it writes

    /* --- 2 · the voice --- */
    voiceOpacity: 0.5, // strength of the second placement
    colorVoiceA: '#ffffff',
    colorVoiceB: '#9a90e0',

    /* --- 3 · the ground --- */
    groundWidth: 2.4, // footprint width, metres
    groundGlow: 1.4,
    groundLife: 1.5, // seconds the stamp lingers
    groundOpacity: 1, // strength of the stamp
    colorGroundA: '#9a90e0',
    colorGroundB: '#2c2048',

    /* --- 4 · detail pieces --- */
    detailCount: 16, // pieces thrown (max 48)
    detailSize: 0.6, // mean piece size, metres
    detailSizeJitter: 0.35, // ± fraction of that
    detailSpread: 0.8, // reach of the pieces, × the cast reach
    detailLift: 0.84, // how high the pieces climb, metres
    detailSpin: 1, // how fast the pieces orbit, × body spin
    detailGlow: 0.84, // rim light on the pieces
    detailOpacity: 0.8, // how solid the pieces are
    detailSwing: 1, // how far each piece folds its parts, × authored swing
    detailEdge: 1, // light along the piece arrises
    colorDetailA: '#9a90e0',
    colorDetailB: '#ffffff',
    colorDetailC: '#2c2048',

    /* --- 5 · hero rig --- */
    heroSize: 1.8, // scale of the hero rig, metres per authored unit
    heroReach: 1, // ring rigs: share of the circle radius they span
    heroLift: 0.63, // how far the rig rises, drops or arcs, metres
    heroSpin: 1, // how fast the rig turns, × body spin
    heroSwing: 1, // how far the rig folds its parts, × authored swing
    heroGlow: 0.77, // rim light on the rig
    heroEdge: 1.2, // light along the rig arrises
    heroOpacity: 0.85, // how solid the rig is
    colorHeroA: '#9a90e0',
    colorHeroB: '#ffffff',
    colorHeroC: '#2c2048',

    /* --- 6 · shed --- */
    dustRate: 96, // puffs per second
    dustSize: 0.22,
    dustSpeed: 3.5,
    dustLife: 0.8,
    dustOpacity: 0.55,
    colorDustA: '#9a90e0',
    colorDustB: '#ffffff',
    colorDustC: '#2c2048',
    colorDustD: '#1a140e',
    streakRate: 81, // sparks per second
    streakSize: 0.045,
    streakSpeed: 8,
    streakLife: 0.35,
    streakStretch: 1.4,
    colorStreakA: '#ffffff',
    colorStreakB: '#9a90e0',
    colorStreakC: '#2c2048',
    colorStreakD: '#ffffff',
    chipRate: 14.4, // fragments per second
    chipSize: 0.08,
    chipSpeed: 6,
    chipLife: 0.7,
    colorChipA: '#2c2048',
    colorChipB: '#9a90e0',
    colorChipC: '#ffffff',
    colorChipD: '#2a241c',

    /* --- 7 · motes --- */
    moteRate: 26, // motes per second off the pieces
    moteSize: 0.06,
    moteSpeed: 1.6, // metres/second they drift at
    moteLife: 1.1,
    colorMoteA: '#ffffff',
    colorMoteB: '#9a90e0',
    colorMoteC: '#2c2048',
    colorMoteD: '#ffffff',

    /* --- 8 · the beat --- */
    impactShake: 0.55, // camera punch on the beat
    impactFlash: 0.16, // screen flash on the beat
    colorFlash: '#ffffff',
    burstRadius: 4, // burst size, metres
    burstLife: 0.7,
    colorBurstA: '#ffffff',
    colorBurstB: '#9a90e0',
    colorBurstC: '#2c2048',
    shockRadius: 3.2, // decal size, metres
    shockLife: 0.85,
    colorShockA: '#9a90e0',
    colorShockB: '#ffffff',

    /* --- 9 · the aftershock --- */
    aftershockAt: 1.06, // fade progress the aftershock lands at (1 = fade start)
    aftershockRadius: 2.4, // aftershock ring size, metres
    aftershockShake: 0.22, // camera punch of the aftershock
    aftershockLight: 4.2, // light punch of the aftershock
    aftershockLife: 0.9, // seconds the aftershock ring lingers

    /* --- 10 · bodies --- */
    hitRadius: 1.15, // reach of the blow, metres
    hitImpulse: 10.45, // how hard bodies are thrown
    hitLift: 2.24, // how high they are thrown
    hitSpin: 2.4 // how fast they tumble
  }
};
