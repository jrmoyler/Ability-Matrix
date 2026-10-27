/**
 * Servo Pylon — tech — a ring of standing columns.
 *
 * Tech — servo pylons stamp up in a ring and hammer outward.
 *
 * Elemental Codex data block: presentation (`meta`) and the live settings the
 * ability and its editor folder read. Plain data, no imports, so
 * `settings.js` can pull it in without a cycle. Dragging any field re-shapes
 * a cast that is already in the air.
 */
export default {
  id: 'servopylon',
  meta: {
    label: 'Servo Pylon',
    accent: '#bffaff',
    key: '',
    element: 'tech',
    hint: 'Tech — servo pylons stamp up in a ring and hammer outward',
    cast: 'zone',
    glyph: '<path d="M32 86V40L40 28V86"/><path d="M46 86V22L54 12L62 22V86"/><path d="M68 86V40L76 30V86"/><path d="M18 86H82"/><path d="M70 64H86V80H70Z"/><path d="M74 68H82V76H74Z"/>'
  },
  settings: {
    /* --- the cast itself --- */
    range: 18, // maximum cast distance, metres
    minRange: 2, // closer than this and the cast is refused
    speed: 24, // metres/second the front travels
    lifetime: 1.8, // seconds the cast is held before it is released
    cooldown: 0.55, // seconds before it can be armed again
    castAnim: 'cast1', // which clip the body throws
    impactTime: 1.05, // impact phase length, × global lifetime
    fadeTime: 1.25, // fade phase length, × global lifetime
    zoneRadius: 4.2, // circle radius for zone casts, metres

    /* --- light --- */
    lightColor: '#25d9f4',
    lightIntensity: 8.8, // the glow riding the cast
    lightRadius: 11,
    lightFlicker: 0.4, // 0..1 how much it shimmers
    impactLight: 11, // extra light on the beat, decays on its own

    /* --- 0 · the hand --- */
    handForward: 0.55, // metres in front of the caster the hand is
    handSide: 0.22, // metres to the right of the caster
    handHeight: 1.35, // metres off the floor
    handFlare: 0.22, // size of the flare round the fist as the cast leaves it, metres
    handSparks: 28.6, // sparks thrown off the hand at release
    handMotes: 12, // motes left hanging at the hand

    /* --- 1 · the body --- */
    spinSpeed: 1.4, // radians/second the body turns
    thickness: 0.22, // width of a single body part, metres
    count: 6, // parts in the body (max 12)
    height: 2.6, // how tall the body stands, metres
    sweep: 1.1, // lateral reach, metres
    lean: 0.45, // how far the body opens on the beat
    bodyOpacity: 0.2,
    edgeGlow: 0.97,
    softFade: 0.4, // soft intersection with the floor and bodies, metres
    bodyGlow: 0.35,
    bodyPulse: 0.12, // breathing in brightness, 0..1
    bodyPulseRate: 4, // breaths per second (radians)
    colorA: '#25d9f4',
    colorB: '#ffffff',
    colorC: '#043c44',
    lensWarp: 0.56, // strength of the distortion it writes

    /* --- 2 · the voice --- */
    voiceOpacity: 0.5, // strength of the second placement
    colorVoiceA: '#25d9f4',
    colorVoiceB: '#ffffff',

    /* --- 3 · the ground --- */
    groundWidth: 9, // footprint width, metres
    groundGlow: 1.4,
    groundLife: 4.5, // seconds the residue decal stays on the floor after the beat, × global lifetime
    groundOpacity: 1, // strength of the field
    groundLand: 0.32, // seconds the field takes to land out to the rim after the beat
    groundHeat: 1.1, // how hot the fresh field and its landing lip glow, cooling through the fade
    groundCoat: 0.08, // 0 dark stain/scorch .. 1 pale coat (rime, glare, scoured sand)
    groundTelegraph: 0.32, // how strongly the footprint shows before the beat
    groundStain: 0.9, // strength of the residue decal left at the beat
    groundStainReach: 1.05, // residue radius, × the circle (zone) or × the ground width (line)
    colorGroundA: '#25d9f4',
    colorGroundB: '#043c44',
    colorGroundStain: '#101820', // the dark tone the floor is stained toward

    /* --- 4 · detail pieces --- */
    detailCount: 14, // pieces thrown (max 48)
    detailSize: 0.45, // mean piece size, metres
    detailSizeJitter: 0.35, // ± fraction of that
    detailSpread: 0.8, // reach of the pieces, × the cast reach
    detailLift: 2.16, // how high the pieces climb, metres
    detailSpin: 1, // how fast the pieces orbit, × body spin
    detailGlow: 1.32, // rim light on the pieces
    detailOpacity: 1, // how solid the pieces are
    detailSwing: 1, // how far each piece folds its parts, × authored swing
    detailEdge: 1, // light along the piece arrises
    detailDeep: 0.7, // 0..1 how far the pieces fall from body to deep tone across their form
    detailRough: 0.34, // roughness of the lit pieces
    detailMetal: 0.8, // metalness of the lit pieces
    detailShadow: 1, // 1 = the pieces cast shadows
    colorDetailA: '#bffaff',
    colorDetailB: '#25d9f4',
    colorDetailC: '#043c44',

    /* --- 5 · hero rig --- */
    heroSize: 2.4, // scale of the hero rig, metres per authored unit
    heroReach: 0.8, // ring rigs: share of the circle radius they span
    heroLift: 1.8, // how far the rig rises, drops or arcs, metres
    heroSpin: 0.35, // how fast the rig turns, × body spin
    heroSwing: 1, // how far the rig folds its parts, × authored swing
    heroGlow: 1.21, // rim light on the rig
    heroEdge: 1.2, // light along the rig arrises
    heroOpacity: 1, // how solid the rig is
    heroDeep: 0.75, // 0..1 how far the rig falls from body to deep tone across its form (colour depth)
    heroMaxHeight: 5, // the rig is scaled and lowered to keep its top under this, metres
    heroFit: 0.72, // mass rigs grow to at least this share of the circle radius (heroSize is the floor)
    heroRough: 0.34, // roughness of the lit rig
    heroMetal: 0.8, // metalness of the lit rig
    heroShadow: 1, // 1 = the rig casts shadows
    colorHeroA: '#bffaff',
    colorHeroB: '#25d9f4',
    colorHeroC: '#043c44',

    /* --- 6 · shed --- */
    dustRate: 40, // puffs per second
    dustSize: 0.22,
    dustSpeed: 3.5,
    dustLife: 0.8,
    dustOpacity: 0.55,
    colorDustA: '#bffaff',
    colorDustB: '#25d9f4',
    colorDustC: '#043c44',
    colorDustD: '#1a140e',
    streakRate: 117, // sparks per second
    streakSize: 0.045,
    streakSpeed: 8,
    streakLife: 0.35,
    streakStretch: 1.4,
    colorStreakA: '#ffffff',
    colorStreakB: '#bffaff',
    colorStreakC: '#25d9f4',
    colorStreakD: '#25d9f4',
    chipRate: 36, // fragments per second
    chipSize: 0.08,
    chipSpeed: 6,
    chipLife: 0.7,
    colorChipA: '#25d9f4',
    colorChipB: '#bffaff',
    colorChipC: '#043c44',
    colorChipD: '#2a241c',

    /* --- 7 · motes --- */
    moteRate: 26, // motes per second off the pieces
    moteSize: 0.06,
    moteSpeed: 1.6, // metres/second they drift at
    moteLife: 1.1,
    colorMoteA: '#ffffff',
    colorMoteB: '#bffaff',
    colorMoteC: '#25d9f4',
    colorMoteD: '#25d9f4',

    /* --- 8 · the beat --- */
    impactShake: 0.44, // camera punch on the beat
    impactFlash: 0.16, // screen flash on the beat
    colorFlash: '#bffaff',
    burstRadius: 3.2, // burst size, metres
    burstLife: 0.7,
    burstOpacity: 0.16, // strength of the burst shell; matter keeps it low and hits with debris instead
    impactChips: 34, // fragments thrown up and out on the beat
    impactDust: 13, // dust puffs rolled out along the floor on the beat
    colorBurstA: '#ffffff',
    colorBurstB: '#25d9f4',
    colorBurstC: '#043c44',
    shockRadius: 6.5, // decal size, metres
    shockLife: 0.85,
    shockRing: 0.3, // strength of the thin shock ring on the beat (0 = none)
    colorShockA: '#25d9f4',
    colorShockB: '#ffffff',

    /* --- 9 · the aftershock --- */
    aftershockAt: 1.06, // fade progress the aftershock lands at (1 = fade start)
    aftershockRadius: 5, // aftershock ring size, metres
    aftershockShake: 0.18, // camera punch of the aftershock
    aftershockLight: 7, // light punch of the aftershock
    aftershockLife: 0.9, // seconds the aftershock ring lingers

    /* --- 10 · bodies --- */
    hitRadius: 4.4, // reach of the blow, metres
    hitImpulse: 7.5, // how hard bodies are thrown
    hitLift: 2.88, // how high they are thrown
    hitSpin: 2.4, // how fast they tumble

    /* --- 11 · the mark --- */
    markAmount: 0.7, // 0..1 how far a felled body is stained
    markTime: 0.15, // seconds the stain takes to set in
    markLife: 2.2, // seconds a marked body keeps shedding motes, × global lifetime
    markMotes: 18, // motes per second off a freshly marked body
    colorMarkBody: '#101820', // what the body is stained toward
    colorMarkRim: '#25d9f4',
    markRimGlow: 1.76, // rim light on a marked body
    colorMarkEdge: '#bffaff',
    markEdgeGlow: 2.86, // brightness of the marked edge
    markEdgeWidth: 0.05 // width of the marked edge
  }
};
