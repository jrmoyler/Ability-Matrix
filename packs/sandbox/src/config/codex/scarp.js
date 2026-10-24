/**
 * Scarp Break — earth — a ring of standing columns.
 *
 * Earth — a scarp face shears up inside the circle and topples outward.
 *
 * Elemental Codex data block: presentation (`meta`) and the live settings the
 * ability and its editor folder read. Plain data, no imports, so
 * `settings.js` can pull it in without a cycle. Dragging any field re-shapes
 * a cast that is already in the air.
 */
export default {
  id: 'scarp',
  meta: {
    label: 'Scarp Break',
    accent: '#e6c48a',
    key: '',
    element: 'earth',
    hint: 'Earth — a scarp face shears up inside the circle and topples outward',
    cast: 'zone',
    glyph: '<path d="M32 86V40L40 28V86"/><path d="M46 86V22L54 12L62 22V86"/><path d="M68 86V40L76 30V86"/><path d="M18 86H82"/><path d="M70 82L78 66L86 82Z"/>'
  },
  settings: {
    /* --- the cast itself --- */
    range: 18, // maximum cast distance, metres
    minRange: 2, // closer than this and the cast is refused
    speed: 17, // metres/second the front travels
    lifetime: 1.35, // seconds the cast is held before it is released
    cooldown: 0.55, // seconds before it can be armed again
    castAnim: 'cast1', // which clip the body throws
    impactTime: 0.7, // impact phase length, × global lifetime
    fadeTime: 0.95, // fade phase length, × global lifetime
    zoneRadius: 4.2, // circle radius for zone casts, metres

    /* --- light --- */
    lightColor: '#fff1d2',
    lightIntensity: 6.4, // the glow riding the cast
    lightRadius: 11,
    lightFlicker: 0.12, // 0..1 how much it shimmers
    impactLight: 8.8, // extra light on the beat, decays on its own

    /* --- 0 · the hand --- */
    handForward: 0.55, // metres in front of the caster the hand is
    handSide: 0.22, // metres to the right of the caster
    handHeight: 1.35, // metres off the floor
    handFlare: 0.4, // size of the flare round the fist as the cast leaves it, metres
    handSparks: 13.2, // sparks thrown off the hand at release
    handMotes: 12, // motes left hanging at the hand

    /* --- 1 · the body --- */
    spinSpeed: 0.84, // radians/second the body turns
    thickness: 0.22, // width of a single body part, metres
    count: 6, // parts in the body (max 12)
    height: 2.6, // how tall the body stands, metres
    sweep: 1.1, // lateral reach, metres
    lean: 0.45, // how far the body opens on the beat
    bodyOpacity: 0.5,
    edgeGlow: 1.28,
    softFade: 0.4, // soft intersection with the floor and bodies, metres
    bodyGlow: 0.26,
    bodyPulse: 0.12, // breathing in brightness, 0..1
    bodyPulseRate: 4, // breaths per second (radians)
    colorA: '#e6c48a',
    colorB: '#fff1d2',
    colorC: '#8a5a32',
    lensWarp: 0.42, // strength of the distortion it writes

    /* --- 2 · the voice --- */
    voiceOpacity: 0.5, // strength of the second placement
    colorVoiceA: '#fff1d2',
    colorVoiceB: '#e6c48a',

    /* --- 3 · the ground --- */
    groundWidth: 9, // footprint width, metres
    groundGlow: 1.4,
    groundLife: 1.5, // seconds the stamp lingers
    groundOpacity: 1, // strength of the stamp
    colorGroundA: '#e6c48a',
    colorGroundB: '#8a5a32',

    /* --- 4 · detail pieces --- */
    detailCount: 14, // pieces thrown (max 48)
    detailSize: 0.55, // mean piece size, metres
    detailSizeJitter: 0.35, // ± fraction of that
    detailSpread: 0.8, // reach of the pieces, × the cast reach
    detailLift: 2.16, // how high the pieces climb, metres
    detailSpin: 1, // how fast the pieces orbit, × body spin
    detailGlow: 0.96, // rim light on the pieces
    detailOpacity: 0.95, // how solid the pieces are
    detailSwing: 1, // how far each piece folds its parts, × authored swing
    detailEdge: 1, // light along the piece arrises
    colorDetailA: '#e6c48a',
    colorDetailB: '#fff1d2',
    colorDetailC: '#8a5a32',

    /* --- 5 · hero rig --- */
    heroSize: 2.4, // scale of the hero rig, metres per authored unit
    heroReach: 0.8, // ring rigs: share of the circle radius they span
    heroLift: 1.8, // how far the rig rises, drops or arcs, metres
    heroSpin: 0.35, // how fast the rig turns, × body spin
    heroSwing: 1, // how far the rig folds its parts, × authored swing
    heroGlow: 0.88, // rim light on the rig
    heroEdge: 1.2, // light along the rig arrises
    heroOpacity: 0.95, // how solid the rig is
    colorHeroA: '#e6c48a',
    colorHeroB: '#fff1d2',
    colorHeroC: '#8a5a32',

    /* --- 6 · shed --- */
    dustRate: 104, // puffs per second
    dustSize: 0.22,
    dustSpeed: 3.5,
    dustLife: 0.8,
    dustOpacity: 0.55,
    colorDustA: '#e6c48a',
    colorDustB: '#fff1d2',
    colorDustC: '#8a5a32',
    colorDustD: '#1a140e',
    streakRate: 54, // sparks per second
    streakSize: 0.045,
    streakSpeed: 8,
    streakLife: 0.35,
    streakStretch: 1.4,
    colorStreakA: '#fff1d2',
    colorStreakB: '#e6c48a',
    colorStreakC: '#8a5a32',
    colorStreakD: '#ffffff',
    chipRate: 54, // fragments per second
    chipSize: 0.08,
    chipSpeed: 6,
    chipLife: 0.7,
    colorChipA: '#8a5a32',
    colorChipB: '#e6c48a',
    colorChipC: '#fff1d2',
    colorChipD: '#2a241c',

    /* --- 7 · motes --- */
    moteRate: 26, // motes per second off the pieces
    moteSize: 0.06,
    moteSpeed: 1.6, // metres/second they drift at
    moteLife: 1.1,
    colorMoteA: '#fff1d2',
    colorMoteB: '#e6c48a',
    colorMoteC: '#8a5a32',
    colorMoteD: '#ffffff',

    /* --- 8 · the beat --- */
    impactShake: 0.72, // camera punch on the beat
    impactFlash: 0.21, // screen flash on the beat
    colorFlash: '#fff1d2',
    burstRadius: 3.4, // burst size, metres
    burstLife: 0.7,
    colorBurstA: '#fff1d2',
    colorBurstB: '#e6c48a',
    colorBurstC: '#8a5a32',
    shockRadius: 6.5, // decal size, metres
    shockLife: 0.85,
    colorShockA: '#e6c48a',
    colorShockB: '#fff1d2',

    /* --- 9 · the aftershock --- */
    aftershockAt: 1.06, // fade progress the aftershock lands at (1 = fade start)
    aftershockRadius: 5, // aftershock ring size, metres
    aftershockShake: 0.29, // camera punch of the aftershock
    aftershockLight: 5.6, // light punch of the aftershock
    aftershockLife: 0.9, // seconds the aftershock ring lingers

    /* --- 10 · bodies --- */
    hitRadius: 4.4, // reach of the blow, metres
    hitImpulse: 9.38, // how hard bodies are thrown
    hitLift: 2.88, // how high they are thrown
    hitSpin: 2.4, // how fast they tumble

    /* --- 11 · the mark --- */
    markAmount: 0.7, // 0..1 how far a felled body is stained
    markTime: 0.5, // seconds the stain takes to set in
    markLife: 2.2, // seconds a marked body keeps shedding motes, × global lifetime
    markMotes: 23.4, // motes per second off a freshly marked body
    colorMarkBody: '#3a2a1a', // what the body is stained toward
    colorMarkRim: '#e6c48a',
    markRimGlow: 1.28, // rim light on a marked body
    colorMarkEdge: '#fff1d2',
    markEdgeGlow: 2.08, // brightness of the marked edge
    markEdgeWidth: 0.05 // width of the marked edge
  }
};
