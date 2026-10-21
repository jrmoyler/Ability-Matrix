/**
 * Redshift Lance — cosmic — a drilling blade riding the line.
 *
 * Cosmic — a lance stretches down the line and redshifts as it goes.
 *
 * Elemental Codex data block: presentation (`meta`) and the live settings the
 * ability and its editor folder read. Plain data, no imports, so
 * `settings.js` can pull it in without a cycle. Dragging any field re-shapes
 * a cast that is already in the air.
 */
export default {
  id: 'redshift',
  meta: {
    label: 'Redshift Lance',
    accent: '#d8ccff',
    key: '',
    element: 'cosmic',
    hint: 'Cosmic — a lance stretches down the line and redshifts as it goes',
    cast: 'line',
    glyph: '<path d="M14 50H70"/><path d="M62 38L86 50L62 62"/><path d="M22 40V60"/><circle cx="78" cy="72" r="5"/><path d="M68 72H88"/>'
  },
  settings: {
    /* --- the cast itself --- */
    range: 18, // maximum cast distance, metres
    minRange: 2, // closer than this and the cast is refused
    speed: 26.4, // metres/second the front travels
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
    lightFlicker: 0.3, // 0..1 how much it shimmers
    impactLight: 13.2, // extra light on the beat, decays on its own

    /* --- 1 · the body --- */
    spinSpeed: 1.4, // radians/second the body turns
    thickness: 0.22, // width of a single body part, metres
    count: 6, // parts in the body (max 12)
    height: 2.6, // how tall the body stands, metres
    sweep: 1.1, // lateral reach, metres
    lean: 0.45, // how far the body opens on the beat
    bodyOpacity: 0.5,
    edgeGlow: 2.08,
    softFade: 0.4, // soft intersection with the floor and bodies, metres
    bodyGlow: 0.42,
    bodyPulse: 0.12, // breathing in brightness, 0..1
    bodyPulseRate: 4, // breaths per second (radians)
    colorA: '#d8ccff',
    colorB: '#ffffff',
    colorC: '#8a6cff',
    lensWarp: 0.7, // strength of the distortion it writes

    /* --- 2 · the voice --- */
    voiceOpacity: 0.5, // strength of the second placement
    colorVoiceA: '#ffffff',
    colorVoiceB: '#d8ccff',

    /* --- 3 · the ground --- */
    groundWidth: 2.4, // footprint width, metres
    groundGlow: 1.4,
    groundLife: 1.5, // seconds the stamp lingers
    groundOpacity: 1, // strength of the stamp
    colorGroundA: '#d8ccff',
    colorGroundB: '#8a6cff',

    /* --- 4 · detail pieces --- */
    detailCount: 16, // pieces thrown (max 48)
    detailSize: 0.5, // mean piece size, metres
    detailSizeJitter: 0.35, // ± fraction of that
    detailSpread: 0.8, // reach of the pieces, × the cast reach
    detailLift: 1.32, // how high the pieces climb, metres
    detailSpin: 1, // how fast the pieces orbit, × body spin
    detailGlow: 1.56, // rim light on the pieces
    detailOpacity: 0.8, // how solid the pieces are
    detailSwing: 1, // how far each piece folds its parts, × authored swing
    detailEdge: 1, // light along the piece arrises
    colorDetailA: '#d8ccff',
    colorDetailB: '#ffffff',
    colorDetailC: '#8a6cff',

    /* --- 5 · hero rig --- */
    heroSize: 1.8, // scale of the hero rig, metres per authored unit
    heroReach: 1, // ring rigs: share of the circle radius they span
    heroLift: 0.99, // how far the rig rises, drops or arcs, metres
    heroSpin: 1, // how fast the rig turns, × body spin
    heroSwing: 1, // how far the rig folds its parts, × authored swing
    heroGlow: 1.43, // rim light on the rig
    heroEdge: 1.2, // light along the rig arrises
    heroOpacity: 0.85, // how solid the rig is
    colorHeroA: '#d8ccff',
    colorHeroB: '#ffffff',
    colorHeroC: '#8a6cff',

    /* --- 6 · shed --- */
    dustRate: 64, // puffs per second
    dustSize: 0.22,
    dustSpeed: 3.5,
    dustLife: 0.8,
    dustOpacity: 0.55,
    colorDustA: '#d8ccff',
    colorDustB: '#ffffff',
    colorDustC: '#8a6cff',
    colorDustD: '#1a140e',
    streakRate: 126, // sparks per second
    streakSize: 0.045,
    streakSpeed: 8,
    streakLife: 0.35,
    streakStretch: 1.4,
    colorStreakA: '#ffffff',
    colorStreakB: '#d8ccff',
    colorStreakC: '#8a6cff',
    colorStreakD: '#ffffff',
    chipRate: 18, // fragments per second
    chipSize: 0.08,
    chipSpeed: 6,
    chipLife: 0.7,
    colorChipA: '#8a6cff',
    colorChipB: '#d8ccff',
    colorChipC: '#ffffff',
    colorChipD: '#2a241c',

    /* --- 7 · motes --- */
    moteRate: 26, // motes per second off the pieces
    moteSize: 0.06,
    moteSpeed: 1.6, // metres/second they drift at
    moteLife: 1.1,
    colorMoteA: '#ffffff',
    colorMoteB: '#d8ccff',
    colorMoteC: '#8a6cff',
    colorMoteD: '#ffffff',

    /* --- 8 · the beat --- */
    impactShake: 0.55, // camera punch on the beat
    impactFlash: 0.31, // screen flash on the beat
    colorFlash: '#ffffff',
    burstRadius: 3.4, // burst size, metres
    burstLife: 0.7,
    colorBurstA: '#ffffff',
    colorBurstB: '#d8ccff',
    colorBurstC: '#8a6cff',
    shockRadius: 3.2, // decal size, metres
    shockLife: 0.85,
    colorShockA: '#d8ccff',
    colorShockB: '#ffffff',

    /* --- 9 · the aftershock --- */
    aftershockAt: 1.06, // fade progress the aftershock lands at (1 = fade start)
    aftershockRadius: 2.4, // aftershock ring size, metres
    aftershockShake: 0.22, // camera punch of the aftershock
    aftershockLight: 8.4, // light punch of the aftershock
    aftershockLife: 0.9, // seconds the aftershock ring lingers

    /* --- 10 · bodies --- */
    hitRadius: 1.15, // reach of the blow, metres
    hitImpulse: 7.5, // how hard bodies are thrown
    hitLift: 3.52, // how high they are thrown
    hitSpin: 2.4 // how fast they tumble
  }
};
