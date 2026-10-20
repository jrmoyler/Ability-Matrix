/**
 * Penumbra Sheet — shadow — a sheet that shears sideways as it travels.
 *
 * Shadow — a penumbra sheet slides across the line and leaves a dark wake.
 *
 * Elemental Codex data block: presentation (`meta`) and the live settings the
 * ability and its editor folder read. Plain data, no imports, so
 * `settings.js` can pull it in without a cycle. Dragging any field re-shapes
 * a cast that is already in the air.
 */
export default {
  id: 'penumbra',
  meta: {
    label: 'Penumbra Sheet',
    accent: '#c4b6ff',
    key: '',
    element: 'shadow',
    hint: 'Shadow — a penumbra sheet slides across the line and leaves a dark wake',
    cast: 'line',
    glyph: '<path d="M16 62C30 28 48 78 64 36C74 18 80 48 88 30"/><path d="M30 50H70"/><path d="M84 62A12 12 0 1 0 84 84A8 10 0 1 1 84 62Z"/>'
  },
  settings: {
    /* --- the cast itself --- */
    range: 18, // maximum cast distance, metres
    minRange: 2, // closer than this and the cast is refused
    speed: 29.7, // metres/second the front travels
    lifetime: 1.5, // seconds the cast is held before it is released
    cooldown: 0.55, // seconds before it can be armed again
    castAnim: 'cast2', // which clip the body throws
    impactTime: 0.78, // impact phase length, × global lifetime
    fadeTime: 0.95, // fade phase length, × global lifetime
    zoneRadius: 0, // circle radius for zone casts, metres

    /* --- light --- */
    lightColor: '#f2ecff',
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
    colorA: '#c4b6ff',
    colorB: '#f2ecff',
    colorC: '#3a2a66',
    lensWarp: 0.77, // strength of the distortion it writes

    /* --- 2 · the voice --- */
    voiceOpacity: 0.5, // strength of the second placement
    colorVoiceA: '#f2ecff',
    colorVoiceB: '#c4b6ff',

    /* --- 3 · the ground --- */
    groundWidth: 2.4, // footprint width, metres
    groundGlow: 1.4,
    groundLife: 1.5, // seconds the stamp lingers
    groundOpacity: 1, // strength of the stamp
    colorGroundA: '#c4b6ff',
    colorGroundB: '#3a2a66',

    /* --- 4 · detail pieces --- */
    detailCount: 14, // pieces thrown (max 48)
    detailSize: 0.55, // mean piece size, metres
    detailSizeJitter: 0.35, // ± fraction of that
    detailSpread: 0.8, // reach of the pieces, × the cast reach
    detailLift: 1.26, // how high the pieces climb, metres
    detailSpin: 1, // how fast the pieces orbit, × body spin
    detailGlow: 0.72, // rim light on the pieces
    detailOpacity: 0.8, // how solid the pieces are
    detailSwing: 1, // how far each piece folds its parts, × authored swing
    detailEdge: 1, // light along the piece arrises
    colorDetailA: '#c4b6ff',
    colorDetailB: '#f2ecff',
    colorDetailC: '#3a2a66',

    /* --- 5 · hero rig --- */
    heroSize: 2, // scale of the hero rig, metres per authored unit
    heroReach: 1, // ring rigs: share of the circle radius they span
    heroLift: 0.72, // how far the rig rises, drops or arcs, metres
    heroSpin: 1, // how fast the rig turns, × body spin
    heroSwing: 1, // how far the rig folds its parts, × authored swing
    heroGlow: 0.66, // rim light on the rig
    heroEdge: 1.2, // light along the rig arrises
    heroOpacity: 0.85, // how solid the rig is
    colorHeroA: '#c4b6ff',
    colorHeroB: '#f2ecff',
    colorHeroC: '#3a2a66',

    /* --- 6 · shed --- */
    dustRate: 120, // puffs per second
    dustSize: 0.22,
    dustSpeed: 3.5,
    dustLife: 0.8,
    dustOpacity: 0.55,
    colorDustA: '#c4b6ff',
    colorDustB: '#f2ecff',
    colorDustC: '#3a2a66',
    colorDustD: '#1a140e',
    streakRate: 72, // sparks per second
    streakSize: 0.045,
    streakSpeed: 8,
    streakLife: 0.35,
    streakStretch: 1.4,
    colorStreakA: '#f2ecff',
    colorStreakB: '#c4b6ff',
    colorStreakC: '#3a2a66',
    colorStreakD: '#ffffff',
    chipRate: 21.6, // fragments per second
    chipSize: 0.08,
    chipSpeed: 6,
    chipLife: 0.7,
    colorChipA: '#3a2a66',
    colorChipB: '#c4b6ff',
    colorChipC: '#f2ecff',
    colorChipD: '#2a241c',

    /* --- 7 · motes --- */
    moteRate: 26, // motes per second off the pieces
    moteSize: 0.06,
    moteSpeed: 1.6, // metres/second they drift at
    moteLife: 1.1,
    colorMoteA: '#f2ecff',
    colorMoteB: '#c4b6ff',
    colorMoteC: '#3a2a66',
    colorMoteD: '#ffffff',

    /* --- 8 · the beat --- */
    impactShake: 0.44, // camera punch on the beat
    impactFlash: 0.13, // screen flash on the beat
    colorFlash: '#f2ecff',
    burstRadius: 3.7, // burst size, metres
    burstLife: 0.7,
    colorBurstA: '#f2ecff',
    colorBurstB: '#c4b6ff',
    colorBurstC: '#3a2a66',
    shockRadius: 3.2, // decal size, metres
    shockLife: 0.85,
    colorShockA: '#c4b6ff',
    colorShockB: '#f2ecff',

    /* --- 9 · the aftershock --- */
    aftershockAt: 1.06, // fade progress the aftershock lands at (1 = fade start)
    aftershockRadius: 2.4, // aftershock ring size, metres
    aftershockShake: 0.18, // camera punch of the aftershock
    aftershockLight: 3.5, // light punch of the aftershock
    aftershockLife: 0.9, // seconds the aftershock ring lingers

    /* --- 10 · bodies --- */
    hitRadius: 1.15, // reach of the blow, metres
    hitImpulse: 8.5, // how hard bodies are thrown
    hitLift: 2.88, // how high they are thrown
    hitSpin: 2.4 // how fast they tumble
  }
};
