/**
 * Tide Bars — gravity — bars that drop in a ring and then move.
 *
 * Gravity — tide bars tilt inward and pin the circle to the floor.
 *
 * Elemental Codex data block: presentation (`meta`) and the live settings the
 * ability and its editor folder read. Plain data, no imports, so
 * `settings.js` can pull it in without a cycle. Dragging any field re-shapes
 * a cast that is already in the air.
 */
export default {
  id: 'tidebar',
  meta: {
    label: 'Tide Bars',
    accent: '#cbbba8',
    key: '',
    element: 'gravity',
    hint: 'Gravity — tide bars tilt inward and pin the circle to the floor',
    cast: 'zone',
    glyph: '<path d="M28 22V78M40 16V84M50 12V88M60 16V84M72 22V78"/><path d="M22 28H78M22 72H78"/><circle cx="78" cy="72" r="3"/><path d="M78 60V66M78 78V84M66 72H72M84 72H90"/>'
  },
  settings: {
    /* --- the cast itself --- */
    range: 18, // maximum cast distance, metres
    minRange: 2, // closer than this and the cast is refused
    speed: 16, // metres/second the front travels
    lifetime: 1.35, // seconds the cast is held before it is released
    cooldown: 0.55, // seconds before it can be armed again
    castAnim: 'cast1', // which clip the body throws
    impactTime: 0.7, // impact phase length, × global lifetime
    fadeTime: 0.95, // fade phase length, × global lifetime
    zoneRadius: 4.2, // circle radius for zone casts, metres

    /* --- light --- */
    lightColor: '#fff1e0',
    lightIntensity: 7.2, // the glow riding the cast
    lightRadius: 11,
    lightFlicker: 0.1, // 0..1 how much it shimmers
    impactLight: 8.8, // extra light on the beat, decays on its own

    /* --- 1 · the body --- */
    spinSpeed: 0.98, // radians/second the body turns
    thickness: 0.22, // width of a single body part, metres
    count: 6, // parts in the body (max 12)
    height: 2.6, // how tall the body stands, metres
    sweep: 1.1, // lateral reach, metres
    lean: 0.45, // how far the body opens on the beat
    bodyOpacity: 0.5,
    edgeGlow: 1.44,
    softFade: 0.4, // soft intersection with the floor and bodies, metres
    bodyGlow: 0.29,
    bodyPulse: 0.12, // breathing in brightness, 0..1
    bodyPulseRate: 4, // breaths per second (radians)
    colorA: '#cbbba8',
    colorB: '#fff1e0',
    colorC: '#6e5844',
    lensWarp: 1.05, // strength of the distortion it writes

    /* --- 2 · the voice --- */
    voiceOpacity: 0.5, // strength of the second placement
    colorVoiceA: '#fff1e0',
    colorVoiceB: '#cbbba8',

    /* --- 3 · the ground --- */
    groundWidth: 9, // footprint width, metres
    groundGlow: 1.4,
    groundLife: 1.5, // seconds the stamp lingers
    groundOpacity: 1, // strength of the stamp
    colorGroundA: '#cbbba8',
    colorGroundB: '#6e5844',

    /* --- 4 · detail pieces --- */
    detailCount: 12, // pieces thrown (max 48)
    detailSize: 0.7, // mean piece size, metres
    detailSizeJitter: 0.35, // ± fraction of that
    detailSpread: 0.8, // reach of the pieces, × the cast reach
    detailLift: 1.56, // how high the pieces climb, metres
    detailSpin: 1, // how fast the pieces orbit, × body spin
    detailGlow: 1.08, // rim light on the pieces
    detailOpacity: 0.95, // how solid the pieces are
    detailSwing: 1, // how far each piece folds its parts, × authored swing
    detailEdge: 1, // light along the piece arrises
    colorDetailA: '#cbbba8',
    colorDetailB: '#fff1e0',
    colorDetailC: '#6e5844',

    /* --- 5 · hero rig --- */
    heroSize: 1.6, // scale of the hero rig, metres per authored unit
    heroReach: 0.85, // ring rigs: share of the circle radius they span
    heroLift: 1.8, // how far the rig rises, drops or arcs, metres
    heroSpin: 0.4, // how fast the rig turns, × body spin
    heroSwing: 1, // how far the rig folds its parts, × authored swing
    heroGlow: 0.99, // rim light on the rig
    heroEdge: 1.2, // light along the rig arrises
    heroOpacity: 0.95, // how solid the rig is
    colorHeroA: '#cbbba8',
    colorHeroB: '#fff1e0',
    colorHeroC: '#6e5844',

    /* --- 6 · shed --- */
    dustRate: 80, // puffs per second
    dustSize: 0.22,
    dustSpeed: 3.5,
    dustLife: 0.8,
    dustOpacity: 0.55,
    colorDustA: '#cbbba8',
    colorDustB: '#fff1e0',
    colorDustC: '#6e5844',
    colorDustD: '#1a140e',
    streakRate: 45, // sparks per second
    streakSize: 0.045,
    streakSpeed: 8,
    streakLife: 0.35,
    streakStretch: 1.4,
    colorStreakA: '#fff1e0',
    colorStreakB: '#cbbba8',
    colorStreakC: '#6e5844',
    colorStreakD: '#ffffff',
    chipRate: 43.2, // fragments per second
    chipSize: 0.08,
    chipSpeed: 6,
    chipLife: 0.7,
    colorChipA: '#6e5844',
    colorChipB: '#cbbba8',
    colorChipC: '#fff1e0',
    colorChipD: '#2a241c',

    /* --- 7 · motes --- */
    moteRate: 26, // motes per second off the pieces
    moteSize: 0.06,
    moteSpeed: 1.6, // metres/second they drift at
    moteLife: 1.1,
    colorMoteA: '#fff1e0',
    colorMoteB: '#cbbba8',
    colorMoteC: '#6e5844',
    colorMoteD: '#ffffff',

    /* --- 8 · the beat --- */
    impactShake: 0.77, // camera punch on the beat
    impactFlash: 0.21, // screen flash on the beat
    colorFlash: '#fff1e0',
    burstRadius: 3.4, // burst size, metres
    burstLife: 0.7,
    colorBurstA: '#fff1e0',
    colorBurstB: '#cbbba8',
    colorBurstC: '#6e5844',
    shockRadius: 6.5, // decal size, metres
    shockLife: 0.85,
    colorShockA: '#cbbba8',
    colorShockB: '#fff1e0',

    /* --- 9 · the aftershock --- */
    aftershockAt: 1.06, // fade progress the aftershock lands at (1 = fade start)
    aftershockRadius: 5, // aftershock ring size, metres
    aftershockShake: 0.31, // camera punch of the aftershock
    aftershockLight: 5.6, // light punch of the aftershock
    aftershockLife: 0.9, // seconds the aftershock ring lingers

    /* --- 10 · bodies --- */
    hitRadius: 4.4, // reach of the blow, metres
    hitImpulse: 9.75, // how hard bodies are thrown
    hitLift: 1.92, // how high they are thrown
    hitSpin: 2.4 // how fast they tumble
  }
};
