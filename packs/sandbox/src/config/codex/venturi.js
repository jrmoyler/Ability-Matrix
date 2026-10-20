/**
 * Venturi Gate — wind — bars that drop in a ring and then move.
 *
 * Wind — a venturi of air bars squeezes the circle, then coughs it out.
 *
 * Elemental Codex data block: presentation (`meta`) and the live settings the
 * ability and its editor folder read. Plain data, no imports, so
 * `settings.js` can pull it in without a cycle. Dragging any field re-shapes
 * a cast that is already in the air.
 */
export default {
  id: 'venturi',
  meta: {
    label: 'Venturi Gate',
    accent: '#f4fffd',
    key: '',
    element: 'wind',
    hint: 'Wind — a venturi of air bars squeezes the circle, then coughs it out',
    cast: 'zone',
    glyph: '<path d="M28 22V78M40 16V84M50 12V88M60 16V84M72 22V78"/><path d="M22 28H78M22 72H78"/><path d="M68 70C74 64 82 76 88 70"/>'
  },
  settings: {
    /* --- the cast itself --- */
    range: 18, // maximum cast distance, metres
    minRange: 2, // closer than this and the cast is refused
    speed: 27, // metres/second the front travels
    lifetime: 1.35, // seconds the cast is held before it is released
    cooldown: 0.55, // seconds before it can be armed again
    castAnim: 'cast1', // which clip the body throws
    impactTime: 0.7, // impact phase length, × global lifetime
    fadeTime: 0.95, // fade phase length, × global lifetime
    zoneRadius: 4.2, // circle radius for zone casts, metres

    /* --- light --- */
    lightColor: '#c8fff2',
    lightIntensity: 7.2, // the glow riding the cast
    lightRadius: 11,
    lightFlicker: 0.3, // 0..1 how much it shimmers
    impactLight: 7.7, // extra light on the beat, decays on its own

    /* --- 1 · the body --- */
    spinSpeed: 2.1, // radians/second the body turns
    thickness: 0.22, // width of a single body part, metres
    count: 6, // parts in the body (max 12)
    height: 2.6, // how tall the body stands, metres
    sweep: 1.1, // lateral reach, metres
    lean: 0.45, // how far the body opens on the beat
    bodyOpacity: 0.7,
    edgeGlow: 1.98,
    softFade: 0.4, // soft intersection with the floor and bodies, metres
    bodyGlow: 0.38,
    bodyPulse: 0.12, // breathing in brightness, 0..1
    bodyPulseRate: 4, // breaths per second (radians)
    colorA: '#f4fffd',
    colorB: '#c8fff2',
    colorC: '#ffffff',
    lensWarp: 0.84, // strength of the distortion it writes

    /* --- 2 · the voice --- */
    voiceOpacity: 0.65, // strength of the second placement
    colorVoiceA: '#c8fff2',
    colorVoiceB: '#f4fffd',

    /* --- 3 · the ground --- */
    groundWidth: 9, // footprint width, metres
    groundGlow: 1.4,
    groundLife: 1.5, // seconds the stamp lingers
    groundOpacity: 1, // strength of the stamp
    colorGroundA: '#f4fffd',
    colorGroundB: '#ffffff',

    /* --- 4 · detail pieces --- */
    detailCount: 12, // pieces thrown (max 48)
    detailSize: 0.5, // mean piece size, metres
    detailSizeJitter: 0.35, // ± fraction of that
    detailSpread: 0.8, // reach of the pieces, × the cast reach
    detailLift: 3.12, // how high the pieces climb, metres
    detailSpin: 1, // how fast the pieces orbit, × body spin
    detailGlow: 1.08, // rim light on the pieces
    detailOpacity: 0.8, // how solid the pieces are
    colorDetailA: '#f4fffd',
    colorDetailB: '#c8fff2',
    colorDetailC: '#ffffff',

    /* --- 5 · shed --- */
    dustRate: 80, // puffs per second
    dustSize: 0.22,
    dustSpeed: 3.5,
    dustLife: 0.8,
    dustOpacity: 0.55,
    colorDustA: '#f4fffd',
    colorDustB: '#c8fff2',
    colorDustC: '#ffffff',
    colorDustD: '#1a140e',
    streakRate: 144, // sparks per second
    streakSize: 0.045,
    streakSpeed: 8,
    streakLife: 0.35,
    streakStretch: 1.4,
    colorStreakA: '#c8fff2',
    colorStreakB: '#f4fffd',
    colorStreakC: '#ffffff',
    colorStreakD: '#ffffff',
    chipRate: 14.4, // fragments per second
    chipSize: 0.08,
    chipSpeed: 6,
    chipLife: 0.7,
    colorChipA: '#ffffff',
    colorChipB: '#f4fffd',
    colorChipC: '#c8fff2',
    colorChipD: '#2a241c',

    /* --- 6 · motes --- */
    moteRate: 26, // motes per second off the pieces
    moteSize: 0.06,
    moteSpeed: 1.6, // metres/second they drift at
    moteLife: 1.1,
    colorMoteA: '#c8fff2',
    colorMoteB: '#f4fffd',
    colorMoteC: '#ffffff',
    colorMoteD: '#ffffff',

    /* --- 7 · the beat --- */
    impactShake: 0.33, // camera punch on the beat
    impactFlash: 0.18, // screen flash on the beat
    colorFlash: '#c8fff2',
    burstRadius: 3.4, // burst size, metres
    burstLife: 0.7,
    colorBurstA: '#c8fff2',
    colorBurstB: '#f4fffd',
    colorBurstC: '#ffffff',
    shockRadius: 6.5, // decal size, metres
    shockLife: 0.85,
    colorShockA: '#f4fffd',
    colorShockB: '#c8fff2',

    /* --- 8 · the aftershock --- */
    aftershockAt: 1.06, // fade progress the aftershock lands at (1 = fade start)
    aftershockRadius: 5, // aftershock ring size, metres
    aftershockShake: 0.13, // camera punch of the aftershock
    aftershockLight: 4.9, // light punch of the aftershock
    aftershockLife: 0.9, // seconds the aftershock ring lingers

    /* --- 9 · bodies --- */
    hitRadius: 4.4, // reach of the blow, metres
    hitImpulse: 6, // how hard bodies are thrown
    hitLift: 3.84, // how high they are thrown
    hitSpin: 2.4 // how fast they tumble
  }
};
