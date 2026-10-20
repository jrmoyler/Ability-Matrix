/**
 * False Floor — illusion — a floor that inhales, then a column.
 *
 * Illusion — the floor agrees to be solid, then drops the circle.
 *
 * Elemental Codex data block: presentation (`meta`) and the live settings the
 * ability and its editor folder read. Plain data, no imports, so
 * `settings.js` can pull it in without a cycle. Dragging any field re-shapes
 * a cast that is already in the air.
 */
export default {
  id: 'falsefloor',
  meta: {
    label: 'False Floor',
    accent: '#ffd6ef',
    key: '',
    element: 'illusion',
    hint: 'Illusion — the floor agrees to be solid, then drops the circle',
    cast: 'zone',
    glyph: '<circle cx="50" cy="54" r="22"/><path d="M50 54V18"/><path d="M40 28L50 16L60 28"/><path d="M66 72Q78 60 90 72Q78 84 66 72Z"/><circle cx="78" cy="72" r="3"/>'
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
    zoneRadius: 4.2, // circle radius for zone casts, metres

    /* --- light --- */
    lightColor: '#fff6fb',
    lightIntensity: 8.8, // the glow riding the cast
    lightRadius: 11,
    lightFlicker: 0.6, // 0..1 how much it shimmers
    impactLight: 12.1, // extra light on the beat, decays on its own

    /* --- 1 · the body --- */
    spinSpeed: 1.54, // radians/second the body turns
    thickness: 0.22, // width of a single body part, metres
    count: 6, // parts in the body (max 12)
    height: 2.6, // how tall the body stands, metres
    sweep: 1.1, // lateral reach, metres
    lean: 0.45, // how far the body opens on the beat
    bodyOpacity: 0.5,
    edgeGlow: 1.76,
    softFade: 0.4, // soft intersection with the floor and bodies, metres
    bodyGlow: 0.35,
    bodyPulse: 0.12, // breathing in brightness, 0..1
    bodyPulseRate: 4, // breaths per second (radians)
    colorA: '#ffd6ef',
    colorB: '#fff6fb',
    colorC: '#e090c8',
    lensWarp: 0.98, // strength of the distortion it writes

    /* --- 2 · the voice --- */
    voiceOpacity: 0.5, // strength of the second placement
    colorVoiceA: '#fff6fb',
    colorVoiceB: '#ffd6ef',

    /* --- 3 · the ground --- */
    groundWidth: 9, // footprint width, metres
    groundGlow: 1.4,
    groundLife: 1.5, // seconds the stamp lingers
    groundOpacity: 1, // strength of the stamp
    colorGroundA: '#ffd6ef',
    colorGroundB: '#e090c8',

    /* --- 4 · detail pieces --- */
    detailCount: 18, // pieces thrown (max 48)
    detailSize: 0.6, // mean piece size, metres
    detailSizeJitter: 0.35, // ± fraction of that
    detailSpread: 0.8, // reach of the pieces, × the cast reach
    detailLift: 3.2, // how high the pieces climb, metres
    detailSpin: 1, // how fast the pieces orbit, × body spin
    detailGlow: 1.32, // rim light on the pieces
    detailOpacity: 0.8, // how solid the pieces are
    detailSwing: 1, // how far each piece folds its parts, × authored swing
    detailEdge: 1, // light along the piece arrises
    colorDetailA: '#ffd6ef',
    colorDetailB: '#fff6fb',
    colorDetailC: '#e090c8',

    /* --- 5 · hero rig --- */
    heroSize: 2, // scale of the hero rig, metres per authored unit
    heroReach: 0.7, // ring rigs: share of the circle radius they span
    heroLift: 1.5, // how far the rig rises, drops or arcs, metres
    heroSpin: 0.5, // how fast the rig turns, × body spin
    heroSwing: 1, // how far the rig folds its parts, × authored swing
    heroGlow: 1.21, // rim light on the rig
    heroEdge: 1.2, // light along the rig arrises
    heroOpacity: 0.85, // how solid the rig is
    colorHeroA: '#ffd6ef',
    colorHeroB: '#fff6fb',
    colorHeroC: '#e090c8',

    /* --- 6 · shed --- */
    dustRate: 32, // puffs per second
    dustSize: 0.22,
    dustSpeed: 3.5,
    dustLife: 0.8,
    dustOpacity: 0.55,
    colorDustA: '#ffd6ef',
    colorDustB: '#fff6fb',
    colorDustC: '#e090c8',
    colorDustD: '#1a140e',
    streakRate: 99, // sparks per second
    streakSize: 0.045,
    streakSpeed: 8,
    streakLife: 0.35,
    streakStretch: 1.4,
    colorStreakA: '#fff6fb',
    colorStreakB: '#ffd6ef',
    colorStreakC: '#e090c8',
    colorStreakD: '#ffffff',
    chipRate: 10.8, // fragments per second
    chipSize: 0.08,
    chipSpeed: 6,
    chipLife: 0.7,
    colorChipA: '#e090c8',
    colorChipB: '#ffd6ef',
    colorChipC: '#fff6fb',
    colorChipD: '#2a241c',

    /* --- 7 · motes --- */
    moteRate: 26, // motes per second off the pieces
    moteSize: 0.06,
    moteSpeed: 1.6, // metres/second they drift at
    moteLife: 1.1,
    colorMoteA: '#fff6fb',
    colorMoteB: '#ffd6ef',
    colorMoteC: '#e090c8',
    colorMoteD: '#ffffff',

    /* --- 8 · the beat --- */
    impactShake: 0.33, // camera punch on the beat
    impactFlash: 0.29, // screen flash on the beat
    colorFlash: '#fff6fb',
    burstRadius: 3.4, // burst size, metres
    burstLife: 0.7,
    colorBurstA: '#fff6fb',
    colorBurstB: '#ffd6ef',
    colorBurstC: '#e090c8',
    shockRadius: 6.5, // decal size, metres
    shockLife: 0.85,
    colorShockA: '#ffd6ef',
    colorShockB: '#fff6fb',

    /* --- 9 · the aftershock --- */
    aftershockAt: 1.06, // fade progress the aftershock lands at (1 = fade start)
    aftershockRadius: 5, // aftershock ring size, metres
    aftershockShake: 0.13, // camera punch of the aftershock
    aftershockLight: 7.7, // light punch of the aftershock
    aftershockLife: 0.9, // seconds the aftershock ring lingers

    /* --- 10 · bodies --- */
    hitRadius: 4.4, // reach of the blow, metres
    hitImpulse: 6, // how hard bodies are thrown
    hitLift: 9, // how high they are thrown
    hitSpin: 2.4 // how fast they tumble
  }
};
