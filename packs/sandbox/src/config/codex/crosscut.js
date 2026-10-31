/**
 * Crosscut Gust — wind — a blade hinged at the hand.
 *
 * Wind — a gust hinged at the hand cuts across the cast.
 *
 * Elemental Codex data block: presentation (`meta`) and the live settings the
 * ability and its editor folder read. Plain data, no imports, so
 * `settings.js` can pull it in without a cycle. Dragging any field re-shapes
 * a cast that is already in the air.
 */
export default {
  id: 'crosscut',
  meta: {
    label: 'Crosscut Gust',
    accent: '#e7fff8',
    key: '',
    element: 'wind',
    hint: 'Wind — a gust hinged at the hand cuts across the cast',
    cast: 'line',
    glyph: '<path d="M50 16V28"/><path d="M18 78L50 28L82 70"/><circle cx="50" cy="18" r="5"/><path d="M30 50H70"/><path d="M68 70C74 64 82 76 88 70"/>'
  },
  settings: {
    /* --- the cast itself --- */
    range: 18, // maximum cast distance, metres
    minRange: 2, // closer than this and the cast is refused
    speed: 36.45, // metres/second the front travels
    lifetime: 2, // seconds the cast is held before it is released
    cooldown: 0.55, // seconds before it can be armed again
    castAnim: 'cast2', // which clip the body throws
    impactTime: 1.15, // impact phase length, × global lifetime
    fadeTime: 1.25, // fade phase length, × global lifetime
    zoneRadius: 0, // circle radius for zone casts, metres

    /* --- light --- */
    lightColor: '#47e1bc',
    lightIntensity: 7.2, // the glow riding the cast
    lightRadius: 11,
    lightFlicker: 0.3, // 0..1 how much it shimmers
    impactLight: 7.7, // extra light on the beat, decays on its own

    /* --- 0 · the hand --- */
    handForward: 0.55, // metres in front of the caster the hand is
    handSide: 0.22, // metres to the right of the caster
    handHeight: 1.35, // metres off the floor
    handFlare: 0.27, // size of the flare round the fist as the cast leaves it, metres
    handSparks: 35.2, // sparks thrown off the hand at release
    handMotes: 12, // motes left hanging at the hand

    /* --- 1 · the body --- */
    spinSpeed: 3.3, // radians/second the body turns
    thickness: 0.28, // width of a single body part, metres
    count: 7, // parts in the body (max 12)
    height: 3.05, // how tall the body stands, metres
    sweep: 1.45, // lateral reach, metres
    lean: 0.65, // how far the body opens on the beat
    bodyOpacity: 0,
    edgeGlow: 1.67,
    softFade: 0.4, // soft intersection with the floor and bodies, metres
    bodyGlow: 0.29,
    bodyPulse: 0.12, // breathing in brightness, 0..1
    bodyPulseRate: 5, // breaths per second (radians)
    colorA: '#47e1bc',
    colorB: '#ffffff',
    colorC: '#0a4335',
    lensWarp: 0.5, // strength of the distortion it writes

    /* --- 2 · the voice --- */
    voiceOpacity: 0, // strength of the second placement
    colorVoiceA: '#47e1bc',
    colorVoiceB: '#ffffff',

    /* --- 3 · the ground --- */
    groundWidth: 2.4, // footprint width, metres
    groundGlow: 1.4,
    groundLife: 4.5, // seconds the residue decal stays on the floor after the beat, × global lifetime
    groundOpacity: 0, // strength of the field
    groundHeat: 1.5, // how hot the fresh field and its landing lip glow, cooling through the fade
    groundCoat: 0.35, // 0 dark stain/scorch .. 1 pale coat (rime, glare, scoured sand)
    groundStain: 0.9, // strength of the residue decal left at the beat
    groundStainReach: 0.9, // residue radius, × the circle (zone) or × the ground width (line)
    colorGroundA: '#47e1bc',
    colorGroundB: '#0a4335',
    colorGroundStain: '#3a4a46', // the dark tone the floor is stained toward

    /* --- 4 · detail pieces --- */
    detailCount: 0, // pieces thrown (max 48)
    detailSize: 0.5, // mean piece size, metres
    detailSizeJitter: 0.35, // ± fraction of that
    detailSpread: 0.8, // reach of the pieces, × the cast reach
    detailLift: 1.92, // how high the pieces climb, metres
    detailSpin: 1, // how fast the pieces orbit, × body spin
    detailGlow: 1.08, // rim light on the pieces
    detailOpacity: 0.85, // how solid the pieces are
    detailSwing: 1, // how far each piece folds its parts, × authored swing
    detailEdge: 1, // light along the piece arrises
    detailDeep: 0.7, // 0..1 how far the pieces fall from body to deep tone across their form
    colorDetailA: '#e7fff8',
    colorDetailB: '#47e1bc',
    colorDetailC: '#0a4335',

    /* --- 5 · hero rig --- */
    heroSize: 3, // scale of the hero rig, metres per authored unit
    heroReach: 1, // ring rigs: share of the circle radius they span
    heroLift: 1.08, // how far the rig rises, drops or arcs, metres
    heroSpin: 1, // how fast the rig turns, × body spin
    heroSwing: 1, // how far the rig folds its parts, × authored swing
    heroGlow: 0.99, // rim light on the rig
    heroEdge: 1.2, // light along the rig arrises
    heroOpacity: 0, // how solid the rig is
    heroDeep: 0.75, // 0..1 how far the rig falls from body to deep tone across its form (colour depth)
    heroMaxHeight: 5, // the rig is scaled and lowered to keep its top under this, metres
    heroMinSpan: 1.5, // line rigs grow to at least this cross-section, metres (heroSize is the floor)
    colorHeroA: '#e7fff8',
    colorHeroB: '#47e1bc',
    colorHeroC: '#0a4335',

    /* --- 6 · shed --- */
    dustRate: 40, // puffs per second
    dustSize: 0.22,
    dustSpeed: 3.5,
    dustLife: 0.8,
    dustOpacity: 0.55,
    colorDustA: '#e7fff8',
    colorDustB: '#47e1bc',
    colorDustC: '#0a4335',
    colorDustD: '#1a140e',
    streakRate: 60, // sparks per second
    streakSize: 0.045,
    streakSpeed: 8,
    streakLife: 0.35,
    streakStretch: 1.4,
    colorStreakA: '#ffffff',
    colorStreakB: '#e7fff8',
    colorStreakC: '#47e1bc',
    colorStreakD: '#47e1bc',
    chipRate: 14.4, // fragments per second
    chipSize: 0.08,
    chipSpeed: 6,
    chipLife: 0.7,
    colorChipA: '#47e1bc',
    colorChipB: '#e7fff8',
    colorChipC: '#0a4335',
    colorChipD: '#2a241c',

    /* --- 7 · motes --- */
    moteRate: 26, // motes per second off the pieces
    moteSize: 0.06,
    moteSpeed: 1.6, // metres/second they drift at
    moteLife: 1.1,
    colorMoteA: '#ffffff',
    colorMoteB: '#e7fff8',
    colorMoteC: '#47e1bc',
    colorMoteD: '#47e1bc',

    /* --- 8 · the beat --- */
    impactShake: 0.33, // camera punch on the beat
    impactFlash: 0.11, // screen flash on the beat
    colorFlash: '#e7fff8',
    burstRadius: 2.3, // burst size, metres
    burstLife: 0.7,
    burstOpacity: 0.1, // strength of the burst shell; matter keeps it low and hits with debris instead
    impactChips: 4, // fragments thrown up and out on the beat
    impactDust: 8, // dust puffs rolled out along the floor on the beat
    colorBurstA: '#ffffff',
    colorBurstB: '#47e1bc',
    colorBurstC: '#0a4335',
    shockRadius: 3.2, // decal size, metres
    shockLife: 0.85,
    shockRing: 0, // strength of the thin shock ring on the beat (0 = none)
    colorShockA: '#47e1bc',
    colorShockB: '#ffffff',

    /* --- 9 · the aftershock --- */
    aftershockAt: 1.06, // fade progress the aftershock lands at (1 = fade start)
    aftershockRadius: 2.4, // aftershock ring size, metres
    aftershockShake: 0.13, // camera punch of the aftershock
    aftershockLight: 4.9, // light punch of the aftershock
    aftershockLife: 0.9, // seconds the aftershock ring lingers

    /* --- 10 · bodies --- */
    hitRadius: 1.15, // reach of the blow, metres
    hitImpulse: 6.8, // how hard bodies are thrown
    hitLift: 3.84, // how high they are thrown
    hitSpin: 2.4, // how fast they tumble

    /* --- 11 · the mark --- */
    markAmount: 0.5, // 0..1 how far a felled body is stained
    markTime: 0.25, // seconds the stain takes to set in
    markLife: 2.2, // seconds a marked body keeps shedding motes, × global lifetime
    markMotes: 18, // motes per second off a freshly marked body
    colorMarkBody: '#3a4a46', // what the body is stained toward
    colorMarkRim: '#47e1bc',
    markRimGlow: 1.44, // rim light on a marked body
    colorMarkEdge: '#e7fff8',
    markEdgeGlow: 2.34, // brightness of the marked edge
    markEdgeWidth: 0.05, // width of the marked edge

    /* --- 12 · the trail --- */
    trailWidth: 0.3, // ribbon width at the head, metres
    trailLife: 0.9, // seconds a point of ribbon lasts after the head crosses it
    trailOpacity: 0, // strength of the ribbon
    trailGlow: 0.99, // brightness of the ribbon
    trailCore: 0.4, // 0..1 how white the fresh middle of the ribbon runs
    trailBreakup: 1.25, // how hard the ribbon breaks up as it ages
    scarWidth: 0.6, // width of the scar on the floor, metres
    scarLife: 2.6, // seconds the scar takes to cool and go
    scarOpacity: 0, // strength of the scar
    scarGlow: 1.44, // brightness of its hot seam
    colorScarA: '#47e1bc',
    colorScarB: '#0a4335',
    wakeSpacing: 0, // metres between wake decals along the path (0 = none)
    wakeRadius: 0.7, // size of each wake decal, metres
    wakeLife: 1.6, // seconds each wake decal lingers
    wakeChips: 1.6, // fragments thrown at each wake

    /* --- 15 · the gust front (upgrade) --- */
    frontWidth: 4.2, // width across the line, metres
    frontHeight: 2.8, // height of the wave of air, metres
    frontDepth: 0.45, // how far the curl reaches forward, × height
    frontSkew: 0.6, // radians its face is turned off square; it crosses from − to + as it runs
    frontGrow: 0.12, // seconds it takes to rise off the fist
    frontOpacity: 0.7, // strength of its body (the deep teal mass)
    frontFlow: 3.2, // speed of the streaks racing up and over the curl
    frontFlutter: 0.04, // how much the sheet flutters
    crashTime: 0.3, // seconds the front takes to break over the group
    crashPitch: 1.1, // radians it falls forward as it breaks
    crashLunge: 1.2, // metres it lunges on as it breaks

    /* --- 16 · the rotor (upgrade) --- */
    rotorLength: 5.2, // length of the roll of wind across the line, metres
    rotorRadius: 1.35, // radius of the roll, metres
    rotorGrow: 0.32, // seconds it takes to roll up
    rotorSpin: 9, // radians/second it rolls
    rotorSpinDown: 1.4, // seconds its roll slows over, × global lifetime
    rotorDrift: 1.6, // metres it drifts on past the group
    rotorSway: 0.55, // metres it sways side to side
    rotorSwayRate: 2.2, // sway rate (radians/second)
    rotorLift: 0.9, // metres it lifts as it unwinds
    rotorExitAt: 1.4, // fade progress it starts to unwind at
    rotorOpacity: 0.6, // strength of its body
    rotorFlow: 4.5, // speed of the streaks round the roll
    rotorFlutter: 0.05, // how much the ribbons flutter
    coreOpacity: 0.78, // strength of the dark translucent body filling the roll
    coreSize: 0.85, // its radius, × the roll's

    /* --- 17 · the wind's look (upgrade) --- */
    windStreaks: 1.4, // brightness of the flow streaks
    windFresnel: 0.9, // rim brightening at grazing angles
    colorWindCore: '#f2fffb', // white lip
    colorWindTint: '#9ff5dc', // pale mint
    colorWindBody: '#1f9e80', // saturated teal
    colorWindDeep: '#04211b', // deep teal, carries the mass
    leafRate: 150, // leaves per second shed off the curl / flung round the roll
    leafSize: 0.24, // leaf size
    leafSpeed: 5.5, // metres/second they are flung at
    leafLife: 0.9, // seconds a leaf lives
    leafFall: 2.5, // how hard they fall (gravity)
    colorLeafA: '#5c6b3a',
    colorLeafB: '#2f3d22',
    colorLeafC: '#1c2614',
    colorLeafD: '#0b0f08',

    /* --- 18 · the scoured floor (upgrade) --- */
    scourWidth: 3.6, // width of the combed strip, metres
    scourCross: 0.55, // half-angle the two streak families cross at, radians
    scourOpacity: 0.85, // strength of the strip and the eddy
    scourGlow: 0.9, // fresh dust right behind the front
    scourErodeAt: 1.5, // fade progress the floor starts to break up at
    eddyRadius: 2.3, // radius of the spiral eddy where the gust broke, metres
    eddySpin: 3.5 // how fast the eddy's arms turn (radians/second, slowing with the rotor)

  }
};
