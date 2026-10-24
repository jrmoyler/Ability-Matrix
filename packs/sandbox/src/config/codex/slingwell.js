/**
 * Sling Well — gravity — a floor that inhales, then a column.
 *
 * Gravity — mass falls into the well, then is slung out along the floor.
 *
 * Elemental Codex data block: presentation (`meta`) and the live settings the
 * ability and its editor folder read. Plain data, no imports, so
 * `settings.js` can pull it in without a cycle. Dragging any field re-shapes
 * a cast that is already in the air.
 */
export default {
  id: 'slingwell',
  meta: {
    label: 'Sling Well',
    accent: '#d9cfc2',
    key: '',
    element: 'gravity',
    hint: 'Gravity — mass falls into the well, then is slung out along the floor',
    cast: 'zone',
    glyph: '<circle cx="50" cy="54" r="22"/><path d="M50 54V18"/><path d="M40 28L50 16L60 28"/><path d="M36 36L64 64M64 36L36 64"/><circle cx="78" cy="72" r="3"/><path d="M78 60V66M78 78V84M66 72H72M84 72H90"/>'
  },
  settings: {
    /* --- the cast itself --- */
    range: 18, // maximum cast distance, metres
    minRange: 2, // closer than this and the cast is refused
    speed: 19.2, // metres/second the front travels
    lifetime: 1.65, // seconds the cast is held before it is released
    cooldown: 0.55, // seconds before it can be armed again
    castAnim: 'cast3', // which clip the body throws
    impactTime: 0.86, // impact phase length, × global lifetime
    fadeTime: 0.95, // fade phase length, × global lifetime
    zoneRadius: 4.7, // circle radius for zone casts, metres

    /* --- light --- */
    lightColor: '#fff6ea',
    lightIntensity: 7.2, // the glow riding the cast
    lightRadius: 11,
    lightFlicker: 0.1, // 0..1 how much it shimmers
    impactLight: 8.8, // extra light on the beat, decays on its own

    /* --- 0 · the hand --- */
    handForward: 0.55, // metres in front of the caster the hand is
    handSide: 0.22, // metres to the right of the caster
    handHeight: 1.35, // metres off the floor
    handFlare: 0.6, // size of the flare round the fist as the cast leaves it, metres
    handSparks: 11, // sparks thrown off the hand at release
    handMotes: 12, // motes left hanging at the hand

    /* --- 1 · the body --- */
    spinSpeed: 2.1, // radians/second the body turns
    thickness: 0.34, // width of a single body part, metres
    count: 8, // parts in the body (max 12)
    height: 3.5, // how tall the body stands, metres
    sweep: 1.8, // lateral reach, metres
    lean: 0.85, // how far the body opens on the beat
    bodyOpacity: 0.5,
    edgeGlow: 1.89,
    softFade: 0.4, // soft intersection with the floor and bodies, metres
    bodyGlow: 0.29,
    bodyPulse: 0.12, // breathing in brightness, 0..1
    bodyPulseRate: 6, // breaths per second (radians)
    colorA: '#d9cfc2',
    colorB: '#fff6ea',
    colorC: '#8a7560',
    lensWarp: 1.5, // strength of the distortion it writes

    /* --- 2 · the voice --- */
    voiceOpacity: 0.5, // strength of the second placement
    colorVoiceA: '#fff6ea',
    colorVoiceB: '#d9cfc2',

    /* --- 3 · the ground --- */
    groundWidth: 9, // footprint width, metres
    groundGlow: 1.4,
    groundLife: 1.5, // seconds the stamp lingers
    groundOpacity: 1, // strength of the stamp
    colorGroundA: '#d9cfc2',
    colorGroundB: '#8a7560',

    /* --- 4 · detail pieces --- */
    detailCount: 18, // pieces thrown (max 48)
    detailSize: 0.7, // mean piece size, metres
    detailSizeJitter: 0.35, // ± fraction of that
    detailSpread: 0.8, // reach of the pieces, × the cast reach
    detailLift: 1.92, // how high the pieces climb, metres
    detailSpin: 1, // how fast the pieces orbit, × body spin
    detailGlow: 1.08, // rim light on the pieces
    detailOpacity: 0.95, // how solid the pieces are
    detailSwing: 1, // how far each piece folds its parts, × authored swing
    detailEdge: 1, // light along the piece arrises
    colorDetailA: '#d9cfc2',
    colorDetailB: '#fff6ea',
    colorDetailC: '#8a7560',

    /* --- 5 · hero rig --- */
    heroSize: 2, // scale of the hero rig, metres per authored unit
    heroReach: 0.7, // ring rigs: share of the circle radius they span
    heroLift: 0.9, // how far the rig rises, drops or arcs, metres
    heroSpin: 0.5, // how fast the rig turns, × body spin
    heroSwing: 1, // how far the rig folds its parts, × authored swing
    heroGlow: 0.99, // rim light on the rig
    heroEdge: 1.2, // light along the rig arrises
    heroOpacity: 0.95, // how solid the rig is
    colorHeroA: '#d9cfc2',
    colorHeroB: '#fff6ea',
    colorHeroC: '#8a7560',

    /* --- 6 · shed --- */
    dustRate: 80, // puffs per second
    dustSize: 0.22,
    dustSpeed: 3.5,
    dustLife: 0.8,
    dustOpacity: 0.55,
    colorDustA: '#d9cfc2',
    colorDustB: '#fff6ea',
    colorDustC: '#8a7560',
    colorDustD: '#1a140e',
    streakRate: 45, // sparks per second
    streakSize: 0.045,
    streakSpeed: 8,
    streakLife: 0.35,
    streakStretch: 1.4,
    colorStreakA: '#fff6ea',
    colorStreakB: '#d9cfc2',
    colorStreakC: '#8a7560',
    colorStreakD: '#ffffff',
    chipRate: 43.2, // fragments per second
    chipSize: 0.08,
    chipSpeed: 6,
    chipLife: 0.7,
    colorChipA: '#8a7560',
    colorChipB: '#d9cfc2',
    colorChipC: '#fff6ea',
    colorChipD: '#2a241c',

    /* --- 7 · motes --- */
    moteRate: 26, // motes per second off the pieces
    moteSize: 0.06,
    moteSpeed: 1.6, // metres/second they drift at
    moteLife: 1.1,
    colorMoteA: '#fff6ea',
    colorMoteB: '#d9cfc2',
    colorMoteC: '#8a7560',
    colorMoteD: '#ffffff',

    /* --- 8 · the beat --- */
    impactShake: 0.77, // camera punch on the beat
    impactFlash: 0.21, // screen flash on the beat
    colorFlash: '#fff6ea',
    burstRadius: 4, // burst size, metres
    burstLife: 0.7,
    colorBurstA: '#fff6ea',
    colorBurstB: '#d9cfc2',
    colorBurstC: '#8a7560',
    shockRadius: 6.5, // decal size, metres
    shockLife: 0.85,
    colorShockA: '#d9cfc2',
    colorShockB: '#fff6ea',

    /* --- 9 · the aftershock --- */
    aftershockAt: 1.06, // fade progress the aftershock lands at (1 = fade start)
    aftershockRadius: 5, // aftershock ring size, metres
    aftershockShake: 0.31, // camera punch of the aftershock
    aftershockLight: 5.6, // light punch of the aftershock
    aftershockLife: 0.9, // seconds the aftershock ring lingers

    /* --- 10 · bodies --- */
    hitRadius: 4.4, // reach of the blow, metres
    hitImpulse: 12.35, // how hard bodies are thrown
    hitLift: 5.4, // how high they are thrown
    hitSpin: 2.4, // how fast they tumble

    /* --- 11 · the mark --- */
    markAmount: 0.85, // 0..1 how far a felled body is stained
    markTime: 0.5, // seconds the stain takes to set in
    markLife: 2.2, // seconds a marked body keeps shedding motes, × global lifetime
    markMotes: 23.4, // motes per second off a freshly marked body
    colorMarkBody: '#1a1a20', // what the body is stained toward
    colorMarkRim: '#d9cfc2',
    markRimGlow: 1.44, // rim light on a marked body
    colorMarkEdge: '#fff6ea',
    markEdgeGlow: 2.34, // brightness of the marked edge
    markEdgeWidth: 0.05 // width of the marked edge
  }
};
