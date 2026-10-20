/**
 * Mourn Halo — shadow — a ring that walks, then commits.
 *
 * Shadow — a mourning ring tightens and snuffs the rim.
 *
 * Elemental Codex data block: presentation (`meta`) and the live settings the
 * ability and its editor folder read. Plain data, no imports, so
 * `settings.js` can pull it in without a cycle. Dragging any field re-shapes
 * a cast that is already in the air.
 */
export default {
  id: 'mournhalo',
  meta: {
    label: 'Mourn Halo',
    accent: '#d0c4ff',
    key: '',
    element: 'shadow',
    hint: 'Shadow — a mourning ring tightens and snuffs the rim',
    cast: 'zone',
    glyph: '<circle cx="50" cy="50" r="28"/><circle cx="50" cy="50" r="10"/><path d="M50 8V18M50 82V92M8 50H18M82 50H92"/><path d="M84 62A12 12 0 1 0 84 84A8 10 0 1 1 84 62Z"/>'
  },
  settings: {
    /* --- the cast itself --- */
    range: 18, // maximum cast distance, metres
    minRange: 2, // closer than this and the cast is refused
    speed: 22, // metres/second the front travels
    lifetime: 1.35, // seconds the cast is held before it is released
    cooldown: 0.55, // seconds before it can be armed again
    castAnim: 'cast1', // which clip the body throws
    impactTime: 0.7, // impact phase length, × global lifetime
    fadeTime: 0.95, // fade phase length, × global lifetime
    zoneRadius: 4.2, // circle radius for zone casts, metres

    /* --- light --- */
    lightColor: '#f6f2ff',
    lightIntensity: 4.8, // the glow riding the cast
    lightRadius: 11,
    lightFlicker: 0.4, // 0..1 how much it shimmers
    impactLight: 5.5, // extra light on the beat, decays on its own

    /* --- 1 · the body --- */
    spinSpeed: 1.4, // radians/second the body turns
    thickness: 0.22, // width of a single body part, metres
    count: 6, // parts in the body (max 12)
    height: 2.6, // how tall the body stands, metres
    sweep: 1.1, // lateral reach, metres
    lean: 0.45, // how far the body opens on the beat
    bodyOpacity: 0.7,
    edgeGlow: 1.32,
    softFade: 0.4, // soft intersection with the floor and bodies, metres
    bodyGlow: 0.25,
    bodyPulse: 0.12, // breathing in brightness, 0..1
    bodyPulseRate: 4, // breaths per second (radians)
    colorA: '#d0c4ff',
    colorB: '#f6f2ff',
    colorC: '#4a386e',
    lensWarp: 0.63, // strength of the distortion it writes

    /* --- 2 · the voice --- */
    voiceOpacity: 0.65, // strength of the second placement
    colorVoiceA: '#f6f2ff',
    colorVoiceB: '#d0c4ff',

    /* --- 3 · the ground --- */
    groundWidth: 9, // footprint width, metres
    groundGlow: 1.4,
    groundLife: 1.5, // seconds the stamp lingers
    groundOpacity: 1, // strength of the stamp
    colorGroundA: '#d0c4ff',
    colorGroundB: '#4a386e',

    /* --- 4 · detail pieces --- */
    detailCount: 16, // pieces thrown (max 48)
    detailSize: 0.55, // mean piece size, metres
    detailSizeJitter: 0.35, // ± fraction of that
    detailSpread: 0.8, // reach of the pieces, × the cast reach
    detailLift: 0.81, // how high the pieces climb, metres
    detailSpin: 1, // how fast the pieces orbit, × body spin
    detailGlow: 0.72, // rim light on the pieces
    detailOpacity: 0.8, // how solid the pieces are
    colorDetailA: '#d0c4ff',
    colorDetailB: '#f6f2ff',
    colorDetailC: '#4a386e',

    /* --- 5 · shed --- */
    dustRate: 120, // puffs per second
    dustSize: 0.22,
    dustSpeed: 3.5,
    dustLife: 0.8,
    dustOpacity: 0.55,
    colorDustA: '#d0c4ff',
    colorDustB: '#f6f2ff',
    colorDustC: '#4a386e',
    colorDustD: '#1a140e',
    streakRate: 72, // sparks per second
    streakSize: 0.045,
    streakSpeed: 8,
    streakLife: 0.35,
    streakStretch: 1.4,
    colorStreakA: '#f6f2ff',
    colorStreakB: '#d0c4ff',
    colorStreakC: '#4a386e',
    colorStreakD: '#ffffff',
    chipRate: 21.6, // fragments per second
    chipSize: 0.08,
    chipSpeed: 6,
    chipLife: 0.7,
    colorChipA: '#4a386e',
    colorChipB: '#d0c4ff',
    colorChipC: '#f6f2ff',
    colorChipD: '#2a241c',

    /* --- 6 · motes --- */
    moteRate: 26, // motes per second off the pieces
    moteSize: 0.06,
    moteSpeed: 1.6, // metres/second they drift at
    moteLife: 1.1,
    colorMoteA: '#f6f2ff',
    colorMoteB: '#d0c4ff',
    colorMoteC: '#4a386e',
    colorMoteD: '#ffffff',

    /* --- 7 · the beat --- */
    impactShake: 0.44, // camera punch on the beat
    impactFlash: 0.13, // screen flash on the beat
    colorFlash: '#f6f2ff',
    burstRadius: 3.4, // burst size, metres
    burstLife: 0.7,
    colorBurstA: '#f6f2ff',
    colorBurstB: '#d0c4ff',
    colorBurstC: '#4a386e',
    shockRadius: 6.5, // decal size, metres
    shockLife: 0.85,
    colorShockA: '#d0c4ff',
    colorShockB: '#f6f2ff',

    /* --- 8 · the aftershock --- */
    aftershockAt: 1.06, // fade progress the aftershock lands at (1 = fade start)
    aftershockRadius: 5, // aftershock ring size, metres
    aftershockShake: 0.18, // camera punch of the aftershock
    aftershockLight: 3.5, // light punch of the aftershock
    aftershockLife: 0.9, // seconds the aftershock ring lingers

    /* --- 9 · bodies --- */
    hitRadius: 4.4, // reach of the blow, metres
    hitImpulse: 7.5, // how hard bodies are thrown
    hitLift: 2.88, // how high they are thrown
    hitSpin: 2.4 // how fast they tumble
  }
};
