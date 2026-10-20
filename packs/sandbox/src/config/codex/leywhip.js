/**
 * Ley Whip — arcane — a sheet that shears sideways as it travels.
 *
 * Arcane — a ley line cracks sideways off the cast.
 *
 * Elemental Codex data block: presentation (`meta`) and the live settings the
 * ability and its editor folder read. Plain data, no imports, so
 * `settings.js` can pull it in without a cycle. Dragging any field re-shapes
 * a cast that is already in the air.
 */
export default {
  id: 'leywhip',
  meta: {
    label: 'Ley Whip',
    accent: '#d5dbff',
    key: '',
    element: 'arcane',
    hint: 'Arcane — a ley line cracks sideways off the cast',
    cast: 'line',
    glyph: '<path d="M16 62C30 28 48 78 64 36C74 18 80 48 88 30"/><path d="M36 36L64 64M64 36L36 64"/><path d="M78 62L86 78H70Z"/><path d="M78 84L70 68H86Z"/>'
  },
  settings: {
    /* --- the cast itself --- */
    range: 18, // maximum cast distance, metres
    minRange: 2, // closer than this and the cast is refused
    speed: 31.5, // metres/second the front travels
    lifetime: 1.65, // seconds the cast is held before it is released
    cooldown: 0.55, // seconds before it can be armed again
    castAnim: 'cast3', // which clip the body throws
    impactTime: 0.86, // impact phase length, × global lifetime
    fadeTime: 0.95, // fade phase length, × global lifetime
    zoneRadius: 0, // circle radius for zone casts, metres

    /* --- light --- */
    lightColor: '#ffffff',
    lightIntensity: 10.4, // the glow riding the cast
    lightRadius: 11,
    lightFlicker: 0.45, // 0..1 how much it shimmers
    impactLight: 11, // extra light on the beat, decays on its own

    /* --- 1 · the body --- */
    spinSpeed: 3.9, // radians/second the body turns
    thickness: 0.34, // width of a single body part, metres
    count: 8, // parts in the body (max 12)
    height: 3.5, // how tall the body stands, metres
    sweep: 1.8, // lateral reach, metres
    lean: 0.85, // how far the body opens on the beat
    bodyOpacity: 0.5,
    edgeGlow: 2.73,
    softFade: 0.4, // soft intersection with the floor and bodies, metres
    bodyGlow: 0.42,
    bodyPulse: 0.12, // breathing in brightness, 0..1
    bodyPulseRate: 6, // breaths per second (radians)
    colorA: '#d5dbff',
    colorB: '#ffffff',
    colorC: '#9aa6ff',
    lensWarp: 0.9, // strength of the distortion it writes

    /* --- 2 · the voice --- */
    voiceOpacity: 0.5, // strength of the second placement
    colorVoiceA: '#ffffff',
    colorVoiceB: '#d5dbff',

    /* --- 3 · the ground --- */
    groundWidth: 2.4, // footprint width, metres
    groundGlow: 1.4,
    groundLife: 1.5, // seconds the stamp lingers
    groundOpacity: 1, // strength of the stamp
    colorGroundA: '#d5dbff',
    colorGroundB: '#9aa6ff',

    /* --- 4 · detail pieces --- */
    detailCount: 14, // pieces thrown (max 48)
    detailSize: 0.55, // mean piece size, metres
    detailSizeJitter: 0.35, // ± fraction of that
    detailSpread: 0.8, // reach of the pieces, × the cast reach
    detailLift: 1.54, // how high the pieces climb, metres
    detailSpin: 1, // how fast the pieces orbit, × body spin
    detailGlow: 1.56, // rim light on the pieces
    detailOpacity: 0.8, // how solid the pieces are
    detailSwing: 1, // how far each piece folds its parts, × authored swing
    detailEdge: 1, // light along the piece arrises
    colorDetailA: '#d5dbff',
    colorDetailB: '#ffffff',
    colorDetailC: '#9aa6ff',

    /* --- 5 · hero rig --- */
    heroSize: 2, // scale of the hero rig, metres per authored unit
    heroReach: 1, // ring rigs: share of the circle radius they span
    heroLift: 0.88, // how far the rig rises, drops or arcs, metres
    heroSpin: 1, // how fast the rig turns, × body spin
    heroSwing: 1, // how far the rig folds its parts, × authored swing
    heroGlow: 1.43, // rim light on the rig
    heroEdge: 1.2, // light along the rig arrises
    heroOpacity: 0.85, // how solid the rig is
    colorHeroA: '#d5dbff',
    colorHeroB: '#ffffff',
    colorHeroC: '#9aa6ff',

    /* --- 6 · shed --- */
    dustRate: 40, // puffs per second
    dustSize: 0.22,
    dustSpeed: 3.5,
    dustLife: 0.8,
    dustOpacity: 0.55,
    colorDustA: '#d5dbff',
    colorDustB: '#ffffff',
    colorDustC: '#9aa6ff',
    colorDustD: '#1a140e',
    streakRate: 117, // sparks per second
    streakSize: 0.045,
    streakSpeed: 8,
    streakLife: 0.35,
    streakStretch: 1.4,
    colorStreakA: '#ffffff',
    colorStreakB: '#d5dbff',
    colorStreakC: '#9aa6ff',
    colorStreakD: '#ffffff',
    chipRate: 14.4, // fragments per second
    chipSize: 0.08,
    chipSpeed: 6,
    chipLife: 0.7,
    colorChipA: '#9aa6ff',
    colorChipB: '#d5dbff',
    colorChipC: '#ffffff',
    colorChipD: '#2a241c',

    /* --- 7 · motes --- */
    moteRate: 26, // motes per second off the pieces
    moteSize: 0.06,
    moteSpeed: 1.6, // metres/second they drift at
    moteLife: 1.1,
    colorMoteA: '#ffffff',
    colorMoteB: '#d5dbff',
    colorMoteC: '#9aa6ff',
    colorMoteD: '#ffffff',

    /* --- 8 · the beat --- */
    impactShake: 0.44, // camera punch on the beat
    impactFlash: 0.26, // screen flash on the beat
    colorFlash: '#ffffff',
    burstRadius: 4, // burst size, metres
    burstLife: 0.7,
    colorBurstA: '#ffffff',
    colorBurstB: '#d5dbff',
    colorBurstC: '#9aa6ff',
    shockRadius: 3.2, // decal size, metres
    shockLife: 0.85,
    colorShockA: '#d5dbff',
    colorShockB: '#ffffff',

    /* --- 9 · the aftershock --- */
    aftershockAt: 1.06, // fade progress the aftershock lands at (1 = fade start)
    aftershockRadius: 2.4, // aftershock ring size, metres
    aftershockShake: 0.18, // camera punch of the aftershock
    aftershockLight: 7, // light punch of the aftershock
    aftershockLife: 0.9, // seconds the aftershock ring lingers

    /* --- 10 · bodies --- */
    hitRadius: 1.15, // reach of the blow, metres
    hitImpulse: 9.03, // how hard bodies are thrown
    hitLift: 3.52, // how high they are thrown
    hitSpin: 2.4 // how fast they tumble
  }
};
