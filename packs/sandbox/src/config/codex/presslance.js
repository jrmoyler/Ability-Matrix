/**
 * Press Lance — force — a drilling blade riding the line.
 *
 * Force — a travelling press flattens the line as it advances.
 *
 * Elemental Codex data block: presentation (`meta`) and the live settings the
 * ability and its editor folder read. Plain data, no imports, so
 * `settings.js` can pull it in without a cycle. Dragging any field re-shapes
 * a cast that is already in the air.
 */
export default {
  id: 'presslance',
  meta: {
    label: 'Press Lance',
    accent: '#ffc898',
    key: '',
    element: 'force',
    hint: 'Force — a travelling press flattens the line as it advances',
    cast: 'line',
    glyph: '<path d="M14 50H70"/><path d="M62 38L86 50L62 62"/><path d="M22 40V60"/><path d="M66 72H90M82 64L90 72L82 80"/>'
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
    lightColor: '#fff1e4',
    lightIntensity: 8, // the glow riding the cast
    lightRadius: 11,
    lightFlicker: 0.2, // 0..1 how much it shimmers
    impactLight: 9.9, // extra light on the beat, decays on its own

    /* --- 0 · the hand --- */
    handForward: 0.55, // metres in front of the caster the hand is
    handSide: 0.22, // metres to the right of the caster
    handHeight: 1.35, // metres off the floor
    handFlare: 0.4, // size of the flare round the fist as the cast leaves it, metres
    handSparks: 22, // sparks thrown off the hand at release
    handMotes: 12, // motes left hanging at the hand

    /* --- 1 · the body --- */
    spinSpeed: 1.26, // radians/second the body turns
    thickness: 0.22, // width of a single body part, metres
    count: 6, // parts in the body (max 12)
    height: 2.6, // how tall the body stands, metres
    sweep: 1.1, // lateral reach, metres
    lean: 0.45, // how far the body opens on the beat
    bodyOpacity: 0.5,
    edgeGlow: 1.6,
    softFade: 0.4, // soft intersection with the floor and bodies, metres
    bodyGlow: 0.32,
    bodyPulse: 0.12, // breathing in brightness, 0..1
    bodyPulseRate: 4, // breaths per second (radians)
    colorA: '#ffc898',
    colorB: '#fff1e4',
    colorC: '#d87830',
    lensWarp: 0.84, // strength of the distortion it writes

    /* --- 2 · the voice --- */
    voiceOpacity: 0.5, // strength of the second placement
    colorVoiceA: '#fff1e4',
    colorVoiceB: '#ffc898',

    /* --- 3 · the ground --- */
    groundWidth: 2.4, // footprint width, metres
    groundGlow: 1.4,
    groundLife: 1.5, // seconds the stamp lingers
    groundOpacity: 1, // strength of the stamp
    colorGroundA: '#ffc898',
    colorGroundB: '#d87830',

    /* --- 4 · detail pieces --- */
    detailCount: 16, // pieces thrown (max 48)
    detailSize: 0.6, // mean piece size, metres
    detailSizeJitter: 0.35, // ± fraction of that
    detailSpread: 0.8, // reach of the pieces, × the cast reach
    detailLift: 1.2, // how high the pieces climb, metres
    detailSpin: 1, // how fast the pieces orbit, × body spin
    detailGlow: 1.2, // rim light on the pieces
    detailOpacity: 0.95, // how solid the pieces are
    detailSwing: 1, // how far each piece folds its parts, × authored swing
    detailEdge: 1, // light along the piece arrises
    colorDetailA: '#ffc898',
    colorDetailB: '#fff1e4',
    colorDetailC: '#d87830',

    /* --- 5 · hero rig --- */
    heroSize: 1.8, // scale of the hero rig, metres per authored unit
    heroReach: 1, // ring rigs: share of the circle radius they span
    heroLift: 0.9, // how far the rig rises, drops or arcs, metres
    heroSpin: 1, // how fast the rig turns, × body spin
    heroSwing: 1, // how far the rig folds its parts, × authored swing
    heroGlow: 1.1, // rim light on the rig
    heroEdge: 1.2, // light along the rig arrises
    heroOpacity: 0.95, // how solid the rig is
    colorHeroA: '#ffc898',
    colorHeroB: '#fff1e4',
    colorHeroC: '#d87830',

    /* --- 6 · shed --- */
    dustRate: 72, // puffs per second
    dustSize: 0.22,
    dustSpeed: 3.5,
    dustLife: 0.8,
    dustOpacity: 0.55,
    colorDustA: '#ffc898',
    colorDustB: '#fff1e4',
    colorDustC: '#d87830',
    colorDustD: '#1a140e',
    streakRate: 90, // sparks per second
    streakSize: 0.045,
    streakSpeed: 8,
    streakLife: 0.35,
    streakStretch: 1.4,
    colorStreakA: '#fff1e4',
    colorStreakB: '#ffc898',
    colorStreakC: '#d87830',
    colorStreakD: '#ffffff',
    chipRate: 36, // fragments per second
    chipSize: 0.08,
    chipSpeed: 6,
    chipLife: 0.7,
    colorChipA: '#d87830',
    colorChipB: '#ffc898',
    colorChipC: '#fff1e4',
    colorChipD: '#2a241c',

    /* --- 7 · motes --- */
    moteRate: 26, // motes per second off the pieces
    moteSize: 0.06,
    moteSpeed: 1.6, // metres/second they drift at
    moteLife: 1.1,
    colorMoteA: '#fff1e4',
    colorMoteB: '#ffc898',
    colorMoteC: '#d87830',
    colorMoteD: '#ffffff',

    /* --- 8 · the beat --- */
    impactShake: 0.72, // camera punch on the beat
    impactFlash: 0.23, // screen flash on the beat
    colorFlash: '#fff1e4',
    burstRadius: 3.4, // burst size, metres
    burstLife: 0.7,
    colorBurstA: '#fff1e4',
    colorBurstB: '#ffc898',
    colorBurstC: '#d87830',
    shockRadius: 3.2, // decal size, metres
    shockLife: 0.85,
    colorShockA: '#ffc898',
    colorShockB: '#fff1e4',

    /* --- 9 · the aftershock --- */
    aftershockAt: 1.06, // fade progress the aftershock lands at (1 = fade start)
    aftershockRadius: 2.4, // aftershock ring size, metres
    aftershockShake: 0.29, // camera punch of the aftershock
    aftershockLight: 6.3, // light punch of the aftershock
    aftershockLife: 0.9, // seconds the aftershock ring lingers

    /* --- 10 · bodies --- */
    hitRadius: 1.15, // reach of the blow, metres
    hitImpulse: 10.5, // how hard bodies are thrown
    hitLift: 3.2, // how high they are thrown
    hitSpin: 2.4, // how fast they tumble

    /* --- 11 · the mark --- */
    markAmount: 0.7, // 0..1 how far a felled body is stained
    markTime: 0.3, // seconds the stain takes to set in
    markLife: 2.2, // seconds a marked body keeps shedding motes, × global lifetime
    markMotes: 23.4, // motes per second off a freshly marked body
    colorMarkBody: '#2a1410', // what the body is stained toward
    colorMarkRim: '#ffc898',
    markRimGlow: 1.6, // rim light on a marked body
    colorMarkEdge: '#fff1e4',
    markEdgeGlow: 2.6, // brightness of the marked edge
    markEdgeWidth: 0.05 // width of the marked edge
  }
};
