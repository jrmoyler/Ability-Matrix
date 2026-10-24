/**
 * Mirror Halo — illusion — a ring that walks, then commits.
 *
 * Illusion — three mirror rings walk the rim and disagree about where it is.
 *
 * Elemental Codex data block: presentation (`meta`) and the live settings the
 * ability and its editor folder read. Plain data, no imports, so
 * `settings.js` can pull it in without a cycle. Dragging any field re-shapes
 * a cast that is already in the air.
 */
export default {
  id: 'mirrorhalo',
  meta: {
    label: 'Mirror Halo',
    accent: '#ffe0f4',
    key: '',
    element: 'illusion',
    hint: 'Illusion — three mirror rings walk the rim and disagree about where it is',
    cast: 'zone',
    glyph: '<circle cx="50" cy="50" r="28"/><circle cx="50" cy="50" r="10"/><path d="M50 8V18M50 82V92M8 50H18M82 50H92"/><path d="M36 36L64 64M64 36L36 64"/><path d="M66 72Q78 60 90 72Q78 84 66 72Z"/><circle cx="78" cy="72" r="3"/>'
  },
  settings: {
    /* --- the cast itself --- */
    range: 18, // maximum cast distance, metres
    minRange: 2, // closer than this and the cast is refused
    speed: 28.8, // metres/second the front travels
    lifetime: 1.65, // seconds the cast is held before it is released
    cooldown: 0.55, // seconds before it can be armed again
    castAnim: 'cast3', // which clip the body throws
    impactTime: 0.86, // impact phase length, × global lifetime
    fadeTime: 0.95, // fade phase length, × global lifetime
    zoneRadius: 4.7, // circle radius for zone casts, metres

    /* --- light --- */
    lightColor: '#ffffff',
    lightIntensity: 8.8, // the glow riding the cast
    lightRadius: 11,
    lightFlicker: 0.6, // 0..1 how much it shimmers
    impactLight: 12.1, // extra light on the beat, decays on its own

    /* --- 0 · the hand --- */
    handForward: 0.55, // metres in front of the caster the hand is
    handSide: 0.22, // metres to the right of the caster
    handHeight: 1.35, // metres off the floor
    handFlare: 0.6, // size of the flare round the fist as the cast leaves it, metres
    handSparks: 24.2, // sparks thrown off the hand at release
    handMotes: 12, // motes left hanging at the hand

    /* --- 1 · the body --- */
    spinSpeed: 3.3, // radians/second the body turns
    thickness: 0.34, // width of a single body part, metres
    count: 8, // parts in the body (max 12)
    height: 3.5, // how tall the body stands, metres
    sweep: 1.8, // lateral reach, metres
    lean: 0.85, // how far the body opens on the beat
    bodyOpacity: 0.5,
    edgeGlow: 2.31,
    softFade: 0.4, // soft intersection with the floor and bodies, metres
    bodyGlow: 0.35,
    bodyPulse: 0.12, // breathing in brightness, 0..1
    bodyPulseRate: 6, // breaths per second (radians)
    colorA: '#ffe0f4',
    colorB: '#ffffff',
    colorC: '#ffb0e0',
    lensWarp: 1.4, // strength of the distortion it writes

    /* --- 2 · the voice --- */
    voiceOpacity: 0.5, // strength of the second placement
    colorVoiceA: '#ffffff',
    colorVoiceB: '#ffe0f4',

    /* --- 3 · the ground --- */
    groundWidth: 9, // footprint width, metres
    groundGlow: 1.4,
    groundLife: 1.5, // seconds the stamp lingers
    groundOpacity: 1, // strength of the stamp
    colorGroundA: '#ffe0f4',
    colorGroundB: '#ffb0e0',

    /* --- 4 · detail pieces --- */
    detailCount: 16, // pieces thrown (max 48)
    detailSize: 0.6, // mean piece size, metres
    detailSizeJitter: 0.35, // ± fraction of that
    detailSpread: 0.8, // reach of the pieces, × the cast reach
    detailLift: 0.9, // how high the pieces climb, metres
    detailSpin: 1, // how fast the pieces orbit, × body spin
    detailGlow: 1.32, // rim light on the pieces
    detailOpacity: 0.8, // how solid the pieces are
    detailSwing: 1, // how far each piece folds its parts, × authored swing
    detailEdge: 1, // light along the piece arrises
    colorDetailA: '#ffe0f4',
    colorDetailB: '#ffffff',
    colorDetailC: '#ffb0e0',

    /* --- 5 · hero rig --- */
    heroSize: 1.4, // scale of the hero rig, metres per authored unit
    heroReach: 0.85, // ring rigs: share of the circle radius they span
    heroLift: 0.6, // how far the rig rises, drops or arcs, metres
    heroSpin: 1.2, // how fast the rig turns, × body spin
    heroSwing: 1, // how far the rig folds its parts, × authored swing
    heroGlow: 1.21, // rim light on the rig
    heroEdge: 1.2, // light along the rig arrises
    heroOpacity: 0.85, // how solid the rig is
    colorHeroA: '#ffe0f4',
    colorHeroB: '#ffffff',
    colorHeroC: '#ffb0e0',

    /* --- 6 · shed --- */
    dustRate: 32, // puffs per second
    dustSize: 0.22,
    dustSpeed: 3.5,
    dustLife: 0.8,
    dustOpacity: 0.55,
    colorDustA: '#ffe0f4',
    colorDustB: '#ffffff',
    colorDustC: '#ffb0e0',
    colorDustD: '#1a140e',
    streakRate: 99, // sparks per second
    streakSize: 0.045,
    streakSpeed: 8,
    streakLife: 0.35,
    streakStretch: 1.4,
    colorStreakA: '#ffffff',
    colorStreakB: '#ffe0f4',
    colorStreakC: '#ffb0e0',
    colorStreakD: '#ffffff',
    chipRate: 10.8, // fragments per second
    chipSize: 0.08,
    chipSpeed: 6,
    chipLife: 0.7,
    colorChipA: '#ffb0e0',
    colorChipB: '#ffe0f4',
    colorChipC: '#ffffff',
    colorChipD: '#2a241c',

    /* --- 7 · motes --- */
    moteRate: 26, // motes per second off the pieces
    moteSize: 0.06,
    moteSpeed: 1.6, // metres/second they drift at
    moteLife: 1.1,
    colorMoteA: '#ffffff',
    colorMoteB: '#ffe0f4',
    colorMoteC: '#ffb0e0',
    colorMoteD: '#ffffff',

    /* --- 8 · the beat --- */
    impactShake: 0.33, // camera punch on the beat
    impactFlash: 0.29, // screen flash on the beat
    colorFlash: '#ffffff',
    burstRadius: 4, // burst size, metres
    burstLife: 0.7,
    colorBurstA: '#ffffff',
    colorBurstB: '#ffe0f4',
    colorBurstC: '#ffb0e0',
    shockRadius: 6.5, // decal size, metres
    shockLife: 0.85,
    colorShockA: '#ffe0f4',
    colorShockB: '#ffffff',

    /* --- 9 · the aftershock --- */
    aftershockAt: 1.06, // fade progress the aftershock lands at (1 = fade start)
    aftershockRadius: 5, // aftershock ring size, metres
    aftershockShake: 0.13, // camera punch of the aftershock
    aftershockLight: 7.7, // light punch of the aftershock
    aftershockLife: 0.9, // seconds the aftershock ring lingers

    /* --- 10 · bodies --- */
    hitRadius: 4.4, // reach of the blow, metres
    hitImpulse: 7.6, // how hard bodies are thrown
    hitLift: 3.2, // how high they are thrown
    hitSpin: 2.4, // how fast they tumble

    /* --- 11 · the mark --- */
    markAmount: 0.6, // 0..1 how far a felled body is stained
    markTime: 0.3, // seconds the stain takes to set in
    markLife: 2.2, // seconds a marked body keeps shedding motes, × global lifetime
    markMotes: 18, // motes per second off a freshly marked body
    colorMarkBody: '#3a1a34', // what the body is stained toward
    colorMarkRim: '#ffe0f4',
    markRimGlow: 1.76, // rim light on a marked body
    colorMarkEdge: '#ffffff',
    markEdgeGlow: 2.86, // brightness of the marked edge
    markEdgeWidth: 0.05 // width of the marked edge
  }
};
