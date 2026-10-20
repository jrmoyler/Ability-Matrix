/**
 * Press Cage — motion — bars that drop in a ring and then move.
 *
 * Motion — momentum bars squeeze the circle and spit it upward.
 *
 * Elemental Codex data block: presentation (`meta`) and the live settings the
 * ability and its editor folder read. Plain data, no imports, so
 * `settings.js` can pull it in without a cycle. Dragging any field re-shapes
 * a cast that is already in the air.
 */
export default {
  id: 'presscage',
  meta: {
    label: 'Press Cage',
    accent: '#ffc8a4',
    key: '',
    element: 'motion',
    hint: 'Motion — momentum bars squeeze the circle and spit it upward',
    cast: 'zone',
    glyph: '<path d="M28 22V78M40 16V84M50 12V88M60 16V84M72 22V78"/><path d="M22 28H78M22 72H78"/><path d="M30 50H70"/><path d="M66 66H86M70 72H90M66 78H86"/>'
  },
  settings: {
    /* --- the cast itself --- */
    range: 18, // maximum cast distance, metres
    minRange: 2, // closer than this and the cast is refused
    speed: 33, // metres/second the front travels
    lifetime: 1.5, // seconds the cast is held before it is released
    cooldown: 0.55, // seconds before it can be armed again
    castAnim: 'cast2', // which clip the body throws
    impactTime: 0.78, // impact phase length, × global lifetime
    fadeTime: 0.95, // fade phase length, × global lifetime
    zoneRadius: 4.45, // circle radius for zone casts, metres

    /* --- light --- */
    lightColor: '#fff4ea',
    lightIntensity: 8, // the glow riding the cast
    lightRadius: 11,
    lightFlicker: 0.3, // 0..1 how much it shimmers
    impactLight: 8.8, // extra light on the beat, decays on its own

    /* --- 1 · the body --- */
    spinSpeed: 3.08, // radians/second the body turns
    thickness: 0.28, // width of a single body part, metres
    count: 7, // parts in the body (max 12)
    height: 3.05, // how tall the body stands, metres
    sweep: 1.45, // lateral reach, metres
    lean: 0.65, // how far the body opens on the beat
    bodyOpacity: 0.5,
    edgeGlow: 1.85,
    softFade: 0.4, // soft intersection with the floor and bodies, metres
    bodyGlow: 0.32,
    bodyPulse: 0.12, // breathing in brightness, 0..1
    bodyPulseRate: 5, // breaths per second (radians)
    colorA: '#ffc8a4',
    colorB: '#fff4ea',
    colorC: '#d86a30',
    lensWarp: 0.94, // strength of the distortion it writes

    /* --- 2 · the voice --- */
    voiceOpacity: 0.5, // strength of the second placement
    colorVoiceA: '#fff4ea',
    colorVoiceB: '#ffc8a4',

    /* --- 3 · the ground --- */
    groundWidth: 9, // footprint width, metres
    groundGlow: 1.4,
    groundLife: 1.5, // seconds the stamp lingers
    groundOpacity: 1, // strength of the stamp
    colorGroundA: '#ffc8a4',
    colorGroundB: '#d86a30',

    /* --- 4 · detail pieces --- */
    detailCount: 12, // pieces thrown (max 48)
    detailSize: 0.5, // mean piece size, metres
    detailSizeJitter: 0.35, // ± fraction of that
    detailSpread: 0.8, // reach of the pieces, × the cast reach
    detailLift: 2.08, // how high the pieces climb, metres
    detailSpin: 1, // how fast the pieces orbit, × body spin
    detailGlow: 1.2, // rim light on the pieces
    detailOpacity: 0.8, // how solid the pieces are
    detailSwing: 1, // how far each piece folds its parts, × authored swing
    detailEdge: 1, // light along the piece arrises
    colorDetailA: '#ffc8a4',
    colorDetailB: '#fff4ea',
    colorDetailC: '#d86a30',

    /* --- 5 · hero rig --- */
    heroSize: 1.6, // scale of the hero rig, metres per authored unit
    heroReach: 0.85, // ring rigs: share of the circle radius they span
    heroLift: 2.4, // how far the rig rises, drops or arcs, metres
    heroSpin: 0.4, // how fast the rig turns, × body spin
    heroSwing: 1, // how far the rig folds its parts, × authored swing
    heroGlow: 1.1, // rim light on the rig
    heroEdge: 1.2, // light along the rig arrises
    heroOpacity: 0.85, // how solid the rig is
    colorHeroA: '#ffc8a4',
    colorHeroB: '#fff4ea',
    colorHeroC: '#d86a30',

    /* --- 6 · shed --- */
    dustRate: 72, // puffs per second
    dustSize: 0.22,
    dustSpeed: 3.5,
    dustLife: 0.8,
    dustOpacity: 0.55,
    colorDustA: '#ffc8a4',
    colorDustB: '#fff4ea',
    colorDustC: '#d86a30',
    colorDustD: '#1a140e',
    streakRate: 153, // sparks per second
    streakSize: 0.045,
    streakSpeed: 8,
    streakLife: 0.35,
    streakStretch: 1.4,
    colorStreakA: '#fff4ea',
    colorStreakB: '#ffc8a4',
    colorStreakC: '#d86a30',
    colorStreakD: '#ffffff',
    chipRate: 25.2, // fragments per second
    chipSize: 0.08,
    chipSpeed: 6,
    chipLife: 0.7,
    colorChipA: '#d86a30',
    colorChipB: '#ffc8a4',
    colorChipC: '#fff4ea',
    colorChipD: '#2a241c',

    /* --- 7 · motes --- */
    moteRate: 26, // motes per second off the pieces
    moteSize: 0.06,
    moteSpeed: 1.6, // metres/second they drift at
    moteLife: 1.1,
    colorMoteA: '#fff4ea',
    colorMoteB: '#ffc8a4',
    colorMoteC: '#d86a30',
    colorMoteD: '#ffffff',

    /* --- 8 · the beat --- */
    impactShake: 0.5, // camera punch on the beat
    impactFlash: 0.21, // screen flash on the beat
    colorFlash: '#fff4ea',
    burstRadius: 3.7, // burst size, metres
    burstLife: 0.7,
    colorBurstA: '#fff4ea',
    colorBurstB: '#ffc8a4',
    colorBurstC: '#d86a30',
    shockRadius: 6.5, // decal size, metres
    shockLife: 0.85,
    colorShockA: '#ffc8a4',
    colorShockB: '#fff4ea',

    /* --- 9 · the aftershock --- */
    aftershockAt: 1.06, // fade progress the aftershock lands at (1 = fade start)
    aftershockRadius: 5, // aftershock ring size, metres
    aftershockShake: 0.2, // camera punch of the aftershock
    aftershockLight: 5.6, // light punch of the aftershock
    aftershockLife: 0.9, // seconds the aftershock ring lingers

    /* --- 10 · bodies --- */
    hitRadius: 4.4, // reach of the blow, metres
    hitImpulse: 9.35, // how hard bodies are thrown
    hitLift: 2.56, // how high they are thrown
    hitSpin: 2.4 // how fast they tumble
  }
};
