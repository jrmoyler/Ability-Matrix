/**
 * Filament Volley — light — a fan of bolts on staggered arcs.
 *
 * Light — filaments arc and stitch whatever they land on.
 *
 * Elemental Codex data block: presentation (`meta`) and the live settings the
 * ability and its editor folder read. Plain data, no imports, so
 * `settings.js` can pull it in without a cycle. Dragging any field re-shapes
 * a cast that is already in the air.
 */
export default {
  id: 'filament',
  meta: {
    label: 'Filament Volley',
    accent: '#fff8dc',
    key: '',
    element: 'light',
    hint: 'Light — filaments arc and stitch whatever they land on',
    cast: 'line',
    glyph: '<path d="M18 70Q34 30 50 70"/><path d="M34 70Q50 24 66 70"/><path d="M50 70Q66 30 82 70"/><path d="M36 36L64 64M64 36L36 64"/><path d="M78 62V74M72 68H84M73 63L83 73M83 63L73 73"/>'
  },
  settings: {
    /* --- the cast itself --- */
    range: 18, // maximum cast distance, metres
    minRange: 2, // closer than this and the cast is refused
    speed: 42, // metres/second the front travels
    lifetime: 1.65, // seconds the cast is held before it is released
    cooldown: 0.55, // seconds before it can be armed again
    castAnim: 'cast3', // which clip the body throws
    impactTime: 0.86, // impact phase length, × global lifetime
    fadeTime: 0.95, // fade phase length, × global lifetime
    zoneRadius: 0, // circle radius for zone casts, metres

    /* --- light --- */
    lightColor: '#ffffff',
    lightIntensity: 12, // the glow riding the cast
    lightRadius: 11,
    lightFlicker: 0.5, // 0..1 how much it shimmers
    impactLight: 15.4, // extra light on the beat, decays on its own

    /* --- 1 · the body --- */
    spinSpeed: 3, // radians/second the body turns
    thickness: 0.34, // width of a single body part, metres
    count: 8, // parts in the body (max 12)
    height: 3.5, // how tall the body stands, metres
    sweep: 1.8, // lateral reach, metres
    lean: 0.85, // how far the body opens on the beat
    bodyOpacity: 0.5,
    edgeGlow: 3.15,
    softFade: 0.4, // soft intersection with the floor and bodies, metres
    bodyGlow: 0.48,
    bodyPulse: 0.12, // breathing in brightness, 0..1
    bodyPulseRate: 6, // breaths per second (radians)
    colorA: '#fff8dc',
    colorB: '#ffffff',
    colorC: '#ffd98a',
    lensWarp: 0.8, // strength of the distortion it writes

    /* --- 2 · the voice --- */
    voiceOpacity: 0.5, // strength of the second placement
    colorVoiceA: '#ffffff',
    colorVoiceB: '#fff8dc',

    /* --- 3 · the ground --- */
    groundWidth: 2.4, // footprint width, metres
    groundGlow: 1.4,
    groundLife: 1.5, // seconds the stamp lingers
    groundOpacity: 1, // strength of the stamp
    colorGroundA: '#fff8dc',
    colorGroundB: '#ffd98a',

    /* --- 4 · detail pieces --- */
    detailCount: 12, // pieces thrown (max 48)
    detailSize: 0.45, // mean piece size, metres
    detailSizeJitter: 0.35, // ± fraction of that
    detailSpread: 0.8, // reach of the pieces, × the cast reach
    detailLift: 1, // how high the pieces climb, metres
    detailSpin: 1, // how fast the pieces orbit, × body spin
    detailGlow: 1.8, // rim light on the pieces
    detailOpacity: 0.8, // how solid the pieces are
    detailSwing: 1, // how far each piece folds its parts, × authored swing
    detailEdge: 1, // light along the piece arrises
    colorDetailA: '#fff8dc',
    colorDetailB: '#ffffff',
    colorDetailC: '#ffd98a',

    /* --- 5 · hero rig --- */
    heroSize: 1.4, // scale of the hero rig, metres per authored unit
    heroReach: 1, // ring rigs: share of the circle radius they span
    heroLift: 2.2, // how far the rig rises, drops or arcs, metres
    heroSpin: 1.5, // how fast the rig turns, × body spin
    heroSwing: 1, // how far the rig folds its parts, × authored swing
    heroGlow: 1.65, // rim light on the rig
    heroEdge: 1.2, // light along the rig arrises
    heroOpacity: 0.85, // how solid the rig is
    colorHeroA: '#fff8dc',
    colorHeroB: '#ffffff',
    colorHeroC: '#ffd98a',

    /* --- 6 · shed --- */
    dustRate: 32, // puffs per second
    dustSize: 0.22,
    dustSpeed: 3.5,
    dustLife: 0.8,
    dustOpacity: 0.55,
    colorDustA: '#fff8dc',
    colorDustB: '#ffffff',
    colorDustC: '#ffd98a',
    colorDustD: '#1a140e',
    streakRate: 162, // sparks per second
    streakSize: 0.045,
    streakSpeed: 8,
    streakLife: 0.35,
    streakStretch: 1.4,
    colorStreakA: '#ffffff',
    colorStreakB: '#fff8dc',
    colorStreakC: '#ffd98a',
    colorStreakD: '#ffffff',
    chipRate: 10.8, // fragments per second
    chipSize: 0.08,
    chipSpeed: 6,
    chipLife: 0.7,
    colorChipA: '#ffd98a',
    colorChipB: '#fff8dc',
    colorChipC: '#ffffff',
    colorChipD: '#2a241c',

    /* --- 7 · motes --- */
    moteRate: 26, // motes per second off the pieces
    moteSize: 0.06,
    moteSpeed: 1.6, // metres/second they drift at
    moteLife: 1.1,
    colorMoteA: '#ffffff',
    colorMoteB: '#fff8dc',
    colorMoteC: '#ffd98a',
    colorMoteD: '#ffffff',

    /* --- 8 · the beat --- */
    impactShake: 0.39, // camera punch on the beat
    impactFlash: 0.36, // screen flash on the beat
    colorFlash: '#ffffff',
    burstRadius: 4, // burst size, metres
    burstLife: 0.7,
    colorBurstA: '#ffffff',
    colorBurstB: '#fff8dc',
    colorBurstC: '#ffd98a',
    shockRadius: 3.2, // decal size, metres
    shockLife: 0.85,
    colorShockA: '#fff8dc',
    colorShockB: '#ffffff',

    /* --- 9 · the aftershock --- */
    aftershockAt: 1.06, // fade progress the aftershock lands at (1 = fade start)
    aftershockRadius: 2.4, // aftershock ring size, metres
    aftershockShake: 0.15, // camera punch of the aftershock
    aftershockLight: 9.8, // light punch of the aftershock
    aftershockLife: 0.9, // seconds the aftershock ring lingers

    /* --- 10 · bodies --- */
    hitRadius: 1.15, // reach of the blow, metres
    hitImpulse: 8.55, // how hard bodies are thrown
    hitLift: 3.2, // how high they are thrown
    hitSpin: 2.4 // how fast they tumble
  }
};
