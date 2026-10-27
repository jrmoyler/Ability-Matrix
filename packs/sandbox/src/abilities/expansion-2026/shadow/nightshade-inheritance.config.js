/**
 * Nightshade Inheritance — Shadow — a winged shade flies out and settles on
 * the nearest enemy in the circle, unfurling eight wings round it over a pool
 * of real darkness, a thorned crescent hanging over its head and belladonna
 * blossoms drifting up through it. When that host is defeated the shade is
 * *inherited*: it strikes the nearest living enemy that has not carried it
 * yet, arcing to them on a twisted ribbon and sealing them with a tier seal,
 * up to `maxTransfers` times. With combat off it inherits on an observed
 * sandbox knockdown instead; elemental reactions need combat.
 *
 * Matrix Expansion data block: presentation (`meta`) and the live settings the
 * ability and its editor folder read. Plain data, no imports.
 *
 * Every presentation key is resolved per frame by `NightshadeInheritanceAbility`,
 * so dragging any of it re-shapes a shade that is already marking its host.
 */
export default {
  id: 'exp-nightshade-inheritance',
  uid: 'matrix-expansion/nightshade-inheritance',
  meta: {
    label: 'Nightshade Inheritance',
    element: 'shadow',
    accent: '#9c79e8',
    cast: 'zone',
    key: '',
    hint: 'Mark an enemy; on its defeat the shadow strikes and marks a nearby enemy. Elemental reactions require combat.',
    glyph: '<path d="M50 12Q15 25 18 55Q22 82 50 90Q78 82 82 55Q85 25 50 12Z"/><path d="M28 58L40 49L50 65L60 49L72 58"/>'
  },
  settings: {
    /* --- the cast itself --- */
    range: 18, // maximum cast distance, metres
    minRange: 2, // closer than this and the cast is refused
    speed: 18, // metres/second the shade flies to the circle
    cooldown: 9, // seconds before the ability can be armed again
    castAnim: 'cast2', // which clip in `CAST_ANIMATIONS` the body throws
    zoneRadius: 3.5, // metres: the first host is the nearest enemy inside this
    lifetime: 8, // seconds the shade may wait for its host to fall (× global lifetime)
    fade: 1.1, // seconds of graceful exit (× global lifetime)

    /* --- the inheritance (combat) --- */
    inheritRadius: 6, // metres from the fallen host an heir may be found
    maxTransfers: 3, // inheritances per cast (0..3)
    transferDamage: 1, // damage of each inherited strike
    hitImpulse: 3, // knock-back of an inherited strike, m/s (× global explosion intensity)
    hitLift: 2,
    hitSpin: 1,

    /* --- light (rides the shade, then the marked host) --- */
    lightColor: '#9870d9',
    lightIntensity: 4,
    lightRadius: 7,
    markLight: 0.8, // light punch when a host is marked, × lightIntensity
    transferLight: 1.4, // light punch on each inheritance, × lightIntensity

    /* --- palette --- */
    shadowColor: '#68409e', // the shade's body
    edgeColor: '#c7a7ff', // veins, rims and the ribbon's edges
    voidColor: '#120a1c', // the darkness the membranes and the pool sink toward

    /* ================================================================ */
    /* 1 · THE SHADE IN FLIGHT                                           */
    /* ================================================================ */
    travelScale: 1,
    travelHeight: 0.9, // metres off the floor
    travelSpin: 0.8, // radians/second it turns as it flies
    travelFlap: 5, // wingbeats (radians/second of the flap cycle)
    travelTrailRate: 18, // umbral wisps per second shed behind the flying shade (× global particle count)

    /* ================================================================ */
    /* 2 · THE MARK — wings, crown and blossoms round the host           */
    /* ================================================================ */
    markRise: 0.45, // seconds the mark takes to rise round its host
    wingStagger: 0.06, // seconds between each wing pair unfurling
    wingCurl: 0.7, // radians a wing is curled before it unfurls
    wingRise: 0.8, // metres a wing rises as it unfurls
    wingHeight: 1.2, // metres: where the wings root on the host
    wingSpin: 0.25, // radians/second the wings turn round the host
    wingOpacity: 0.85, // membrane density
    wingGlow: 1,
    markPulseRate: 2.5, // radians/second of the hunger beat
    markGlow: 0.8, // how hard the hunger floods veins and crown
    sigilHeight: 2.1, // metres: the thorned crescent over the head
    sigilScale: 1,
    sigilGlow: 1.2,
    blossomScale: 1, // belladonna blossom size
    blossomOrbit: 0.6, // radians/second they circle the host
    blossomRise: 0.4, // metres/second they drift up

    /* ================================================================ */
    /* 3 · THE FLOOR — glyph of light over a pool of darkness            */
    /* ================================================================ */
    floorRadius: 1, // metres: the claw glyph
    floorGlow: 1,
    poolRadius: 1.35, // metres: the umbral pool
    poolDarkness: 0.75, // how much of the floor the pool hides
    poolSwirl: 0.6, // radians/second the darkness is drawn inward
    warpStrength: 0.45, // the world bending toward the host (distortion layer)

    /* ================================================================ */
    /* 4 · THE INHERITANCE — ribbon and tier seals                       */
    /* ================================================================ */
    trailScale: 1, // ribbon height and width
    trailDuration: 0.5, // seconds the ribbon lingers
    trailTwist: 1.5, // half-turns the ribbon twists along its length
    trailGlow: 1.2,
    sealScale: 1, // tier seal size (the burst and ring are bounded to 4 m)
    sealDuration: 0.7, // seconds a seal takes to close and burn away
    sealGlow: 0.8,
    markShake: 0.06, // camera knock when a host is marked (× global camera shake)
    transferShake: 0.22, // camera knock on each inheritance
    transferFlash: 0.16, // screen flash on each inheritance (× global explosion intensity)
    releaseDuration: 0.55, // seconds the shade takes to retract when it has no heir

    /* ================================================================ */
    /* 5 · PARTICLES                                                     */
    /* ================================================================ */
    particleRate: 24, // ambient shadow smoke round the host, per second
    particleSize: 0.1,
    umbraRate: 16, // dark (non-additive) smoke rising off the pool, per second
    umbraSize: 0.42,
    umbraLife: 1.6, // seconds
    umbraRise: 0.5, // metres/second
    colorUmbraA: '#2a1840',
    colorUmbraB: '#1a0f29',
    colorUmbraC: '#0e0817',
    colorUmbraD: '#05030a'
  }
};
