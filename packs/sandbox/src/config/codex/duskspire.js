/**
 * Dusk Spire — shadow — a ring of standing columns.
 *
 * Shadow — dusk columns drink the circle inward as they rise.
 *
 * Elemental Codex data block: presentation (`meta`) and the live settings the
 * ability and its editor folder read. Plain data, no imports, so
 * `settings.js` can pull it in without a cycle. Dragging any field re-shapes
 * a cast that is already in the air.
 */
export default {
  id: 'duskspire',
  meta: {
    label: 'Dusk Spire',
    accent: '#b7a6ff',
    key: '',
    element: 'shadow',
    hint: 'Shadow — dusk columns drink the circle inward as they rise',
    cast: 'zone',
    glyph: '<path d="M32 86V40L40 28V86"/><path d="M46 86V22L54 12L62 22V86"/><path d="M68 86V40L76 30V86"/><path d="M18 86H82"/><path d="M30 50H70"/><path d="M84 62A12 12 0 1 0 84 84A8 10 0 1 1 84 62Z"/>'
  },
  settings: {
    /* --- the cast itself --- */
    range: 18, // maximum cast distance, metres
    minRange: 2, // closer than this and the cast is refused
    speed: 24.2, // metres/second the front travels
    lifetime: 1.5, // seconds the cast is held before it is released
    cooldown: 0.55, // seconds before it can be armed again
    castAnim: 'cast2', // which clip the body throws
    impactTime: 0.78, // impact phase length, × global lifetime
    fadeTime: 0.95, // fade phase length, × global lifetime
    zoneRadius: 4.45, // circle radius for zone casts, metres

    /* --- light --- */
    lightColor: '#ffffff',
    lightIntensity: 4.8, // the glow riding the cast
    lightRadius: 11,
    lightFlicker: 0.4, // 0..1 how much it shimmers
    impactLight: 5.5, // extra light on the beat, decays on its own

    /* --- 1 · the body --- */
    spinSpeed: 2.2, // radians/second the body turns
    thickness: 0.28, // width of a single body part, metres
    count: 7, // parts in the body (max 12)
    height: 3.05, // how tall the body stands, metres
    sweep: 1.45, // lateral reach, metres
    lean: 0.65, // how far the body opens on the beat
    bodyOpacity: 0.5,
    edgeGlow: 1.11,
    softFade: 0.4, // soft intersection with the floor and bodies, metres
    bodyGlow: 0.19,
    bodyPulse: 0.12, // breathing in brightness, 0..1
    bodyPulseRate: 5, // breaths per second (radians)
    colorA: '#b7a6ff',
    colorB: '#ffffff',
    colorC: '#2a1848',
    lensWarp: 0.77, // strength of the distortion it writes

    /* --- 2 · the voice --- */
    voiceOpacity: 0.5, // strength of the second placement
    colorVoiceA: '#ffffff',
    colorVoiceB: '#b7a6ff',

    /* --- 3 · the ground --- */
    groundWidth: 9, // footprint width, metres
    groundGlow: 1.4,
    groundLife: 1.5, // seconds the stamp lingers
    groundOpacity: 1, // strength of the stamp
    colorGroundA: '#b7a6ff',
    colorGroundB: '#2a1848',

    /* --- 4 · detail pieces --- */
    detailCount: 14, // pieces thrown (max 48)
    detailSize: 0.55, // mean piece size, metres
    detailSizeJitter: 0.35, // ± fraction of that
    detailSpread: 0.8, // reach of the pieces, × the cast reach
    detailLift: 2.16, // how high the pieces climb, metres
    detailSpin: 1, // how fast the pieces orbit, × body spin
    detailGlow: 0.72, // rim light on the pieces
    detailOpacity: 0.8, // how solid the pieces are
    detailSwing: 1, // how far each piece folds its parts, × authored swing
    detailEdge: 1, // light along the piece arrises
    colorDetailA: '#b7a6ff',
    colorDetailB: '#ffffff',
    colorDetailC: '#2a1848',

    /* --- 5 · hero rig --- */
    heroSize: 2.4, // scale of the hero rig, metres per authored unit
    heroReach: 0.8, // ring rigs: share of the circle radius they span
    heroLift: 1.8, // how far the rig rises, drops or arcs, metres
    heroSpin: 0.35, // how fast the rig turns, × body spin
    heroSwing: 1, // how far the rig folds its parts, × authored swing
    heroGlow: 0.66, // rim light on the rig
    heroEdge: 1.2, // light along the rig arrises
    heroOpacity: 0.85, // how solid the rig is
    colorHeroA: '#b7a6ff',
    colorHeroB: '#ffffff',
    colorHeroC: '#2a1848',

    /* --- 6 · shed --- */
    dustRate: 120, // puffs per second
    dustSize: 0.22,
    dustSpeed: 3.5,
    dustLife: 0.8,
    dustOpacity: 0.55,
    colorDustA: '#b7a6ff',
    colorDustB: '#ffffff',
    colorDustC: '#2a1848',
    colorDustD: '#1a140e',
    streakRate: 72, // sparks per second
    streakSize: 0.045,
    streakSpeed: 8,
    streakLife: 0.35,
    streakStretch: 1.4,
    colorStreakA: '#ffffff',
    colorStreakB: '#b7a6ff',
    colorStreakC: '#2a1848',
    colorStreakD: '#ffffff',
    chipRate: 21.6, // fragments per second
    chipSize: 0.08,
    chipSpeed: 6,
    chipLife: 0.7,
    colorChipA: '#2a1848',
    colorChipB: '#b7a6ff',
    colorChipC: '#ffffff',
    colorChipD: '#2a241c',

    /* --- 7 · motes --- */
    moteRate: 26, // motes per second off the pieces
    moteSize: 0.06,
    moteSpeed: 1.6, // metres/second they drift at
    moteLife: 1.1,
    colorMoteA: '#ffffff',
    colorMoteB: '#b7a6ff',
    colorMoteC: '#2a1848',
    colorMoteD: '#ffffff',

    /* --- 8 · the beat --- */
    impactShake: 0.44, // camera punch on the beat
    impactFlash: 0.13, // screen flash on the beat
    colorFlash: '#ffffff',
    burstRadius: 3.7, // burst size, metres
    burstLife: 0.7,
    colorBurstA: '#ffffff',
    colorBurstB: '#b7a6ff',
    colorBurstC: '#2a1848',
    shockRadius: 6.5, // decal size, metres
    shockLife: 0.85,
    colorShockA: '#b7a6ff',
    colorShockB: '#ffffff',

    /* --- 9 · the aftershock --- */
    aftershockAt: 1.06, // fade progress the aftershock lands at (1 = fade start)
    aftershockRadius: 5, // aftershock ring size, metres
    aftershockShake: 0.18, // camera punch of the aftershock
    aftershockLight: 3.5, // light punch of the aftershock
    aftershockLife: 0.9, // seconds the aftershock ring lingers

    /* --- 10 · bodies --- */
    hitRadius: 4.4, // reach of the blow, metres
    hitImpulse: 8.5, // how hard bodies are thrown
    hitLift: 2.88, // how high they are thrown
    hitSpin: 2.4 // how fast they tumble
  }
};
