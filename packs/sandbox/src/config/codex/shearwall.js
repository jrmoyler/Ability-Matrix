/**
 * Shear Wall — Wind — a pleated wall of air ploughs down the line, its layers snapping sideways.
 *
 * Elemental Codex data block: presentation (`meta`) and the live settings the
 * ability and its editor folder read. Plain data, no imports, so the settings
 * module can pull it in without a cycle.
 *
 * Every dimension below is resolved per frame by `ShearWallAbility`, so
 * dragging any of it re-shapes a wall that is already moving — its width, its
 * pleats, how far and how often its rows snap, the grooves it drags.
 */
export default {
  id: 'shearwall',
  meta: {
    label: 'Shear Wall',
    accent: '#f4fffd',
    key: '',
    element: 'wind',
    hint: 'Wind — a pleated wall of air ploughs down the cast, its layers snapping sideways against each other, and tears in two at the end',
    cast: 'line',
    glyph: `<path d="M18 22H58M30 40H70M18 58H58M30 76H70"/><path d="M62 18L70 22L62 26M74 36L82 40L74 44"/><path d="M26 54L18 58L26 62M38 72L30 76L38 80"/>`
  },
  settings: {
    /* --- the cast itself --- */
    range: 18, // maximum cast distance, metres
    minRange: 2, // closer than this and the cast is refused
    speed: 15, // how fast the wall ploughs down the line, metres/second
    lifetime: 2.0, // seconds the torn halves take to dissolve (the linger)
    cooldown: 0.6, // seconds before the ability can be armed again
    castAnim: 'cast2', // which clip in `CAST_ANIMATIONS` the body throws

    /* --- light --- */
    lightColor: '#c8fff2',
    lightIntensity: 9, // the wall's glow (the light rides its middle)
    lightRadius: 10,
    lightFlicker: 0.25, // 0..1 how much the light jolts on every snap
    impactLight: 22, // light punch as the wall tears

    /* ================================================================ */
    /* 1 · THE WALL — shape                                              */
    /* ================================================================ */
    startDistance: 1.3, // metres in front of the caster the wall stands up
    formTime: 0.2, // seconds it takes to stand up to full size
    wallWidth: 6.0, // metres across the line
    wallHeight: 3.2, // metres tall
    pleats: 4.5, // accordion folds across the width
    pleatDepth: 0.45, // metres deep each fold is
    rows: 4, // layers stacked up the wall, alternate ones shoved opposite ways
    wallBow: 0.5, // metres the ends trail behind the middle
    wallLean: 0.35, // metres the top leans forward of the foot
    wallThickness: 1.9, // metres of body along the line at the foot (thins to ~half at the top)
    wallCurl: 1.3, // metres the crest curls forward over the front, like a breaking wave
    rowBlend: 0.85, // 0 = rows cut hard (stacked bands), 1 = the shear bends smoothly through one mass
    pleatRowPhase: 0, // 0 = pleats run straight up through every row (one mass), 1 = alternate rows flipped (zig-zag bands)

    /* --- the shear --- */
    shearAmount: 0.7, // metres a row is shoved sideways
    snapInterval: 0.16, // seconds between snaps
    snapTime: 0.07, // seconds one snap takes
    snapSpring: 0.6, // how far past its mark a snap overshoots

    /* ================================================================ */
    /* 2 · THE WALL — look                                               */
    /* ================================================================ */
    flowSpeed: 9, // metres/second the air streams sideways inside a row
    streakScale: 1.2, // streak features per metre
    streakGlow: 0.4, // brightest streaks
    bodyGlow: 0.05, // the body of the air
    ridgeGlow: 0.15, // the fold ridges
    seamGlow: 0.3, // the seams between rows
    topTear: 0.4, // share of the height the torn top edge eats
    footFade: 0.12, // share of the height feathered into the dust
    softFade: 0.4, // metres of soft fade where it meets geometry
    wallOpacity: 0.45,
    colorAirA: '#f0fffb', // brightest streaks and ridges
    colorAirB: '#185c5c', // the air
    colorAirC: '#0e333a', // the air's depth
    colorAirD: '#04141a', // the deep tone: the body's foot and gaps
    bodyOpacity: 0.36, // opacity of each of the seven body slices
    bodyDensity: 0.35, // 0 = even, 1 = packed lumps with gaps
    bodyLight: 0.75, // how much the sun shapes the folds of the body
    bodyRim: 0.15, // grazing-angle brightening of the body
    bodyCrease: 0.75, // 0..1 how deep the upright pleat creases sink to the deep tone
    crestGlow: 0.35, // the pale edge along the curling crest
    colorSeam: '#ffffff', // seams and tear edges
    lensWarp: 1.1, // how hard each row shoves the world sideways (distortion)
    lensDepth: 1.6, // the lens is this much deeper than the wall

    /* ================================================================ */
    /* 3 · THE TEAR (impact)                                             */
    /* ================================================================ */
    tearTime: 0.45, // seconds the halves take to slide apart
    tearDistance: 3.5, // metres each half slides
    lingerSnap: 0.5, // 0..1 strength of the snaps that carry on while the halves linger
    lingerSnapSlow: 2.2, // linger snaps come this many times slower
    lingerSpread: 0.6, // the halves keep drifting apart by this share of tearDistance
    lingerRise: 1.6, // metres the torn halves peel up off the floor as they dissolve

    /* ================================================================ */
    /* 4 · DRAG MARKS                                                    */
    /* ================================================================ */
    groundStep: 0.35, // metres the grooves jump sideways at every snap
    grooveDensity: 2.6, // grooves per metre
    grooveGlow: 0.5, // fresh grooves glow
    groundScour: 0.82, // opacity of the scoured band
    freshLength: 2.5, // metres of fresh glow behind the wall
    groundFade: 0.9, // seconds the marks take to erode (after the halves are gone)
    groundWidth: 1.15, // band width, × wall width (berms included)
    bermAmount: 0.85, // the dust heaped at both edges of the band
    driftSpeed: 1.2, // m/s the loose dust keeps drifting sideways over the band
    driftGlow: 0.45, // brightness of the drifting dust
    lingerDustRate: 70, // dust / second lifting off the band through the linger
    colorScourDeep: '#04090b', // the bare, scoured floor
    colorScour: '#162224', // the dust combed flat on it
    colorGroove: '#4f6764',
    colorBerm: '#71847f', // dust heaped at the edges

    /* ================================================================ */
    /* 5 · PARTICLES                                                     */
    /* ================================================================ */
    dustRate: 70, // dust / second rolled up at the wall's foot
    dustSize: 0.45,
    dustSpeed: 2.2,
    dustLife: 0.8,
    dustOpacity: 0.34,
    colorDustA: '#cbd8d4',
    colorDustB: '#97aaa6',
    colorDustC: '#5f706e',
    colorDustD: '#2c3637',
    streakCount: 26, // wind lines whipped out of the seams per snap
    streakSize: 0.05,
    streakSpeed: 14,
    streakLife: 0.3,
    streakStretch: 1.4,
    colorStreakA: '#ffffff',
    colorStreakB: '#e1fff8',
    colorStreakC: '#7fe8d6',
    colorStreakD: '#2f7f86',
    chipRate: 30, // grit / second flung off the foot
    chipSize: 0.06,
    chipSpeed: 5,
    chipLife: 0.9,
    colorChipA: '#d7dfdc',
    colorChipB: '#9aa8a4',
    colorChipC: '#5d6a67',
    colorChipD: '#2a3130',

    /* ================================================================ */
    /* 6 · THE BEAT                                                      */
    /* ================================================================ */
    snapShake: 0.08, // knock on every snap
    travelRumble: 0.06,
    impactShake: 0.45,
    impactFlash: 0.3,
    colorFlash: '#e1fff8',
    burstRadius: 3.4, // AIR shell where it tears, metres
    burstLife: 0.5,
    burstIntensity: 0.8, // the AIR shell's glow (kept low so the tear never blows out)
    burstOpacity: 0.45,
    shockIntensity: 0.55, // the shock ring decal
    colorBurstA: '#7fd8cb',
    colorBurstB: '#9ff0e2',
    colorBurstC: '#2f7f86',
    shockRadius: 6.5, // metres
    shockLife: 0.6,
    colorShockA: '#4fa89c',
    colorShockB: '#9fe8dc',

    /* ================================================================ */
    /* 7 · BODIES                                                        */
    /* ================================================================ */
    hitDepth: 0.9, // metres either side of the wall's foot a body is caught
    hitImpulse: 8, // sideways
    hitForward: 0.35, // share of the throw that is forward, down the line
    hitLift: 3,
    hitSpin: 2.5
  }
};
