/**
 * Predatory Canopy — Nature, zone cast. A seed pod flies to the circle and
 * bursts into a carnivorous canopy hung over it: branches, leaves, hanging
 * vines and a root snare drawn on the floor. It waits. The first living body
 * to step inside the snare wakes it — the warning ring races in, thorns stab
 * up, the vines lash down — and the nearest target is struck once.
 *
 * Expansion candidate data block: presentation (`meta`) and the live settings
 * the ability and its editor folder read. Plain data, no imports. Gated by
 * `../status.js` — candidates are never exposed by the production shell.
 *
 * Every dimension, time and colour below is resolved per frame by
 * `PredatoryCanopyAbility`, so dragging any of it reshapes a canopy already
 * hanging. The gameplay keys (`zoneRadius`, `armDelay`, `triggerWindup`,
 * `lifetime`, `hit*`) decide who is struck and when.
 */
export default {
  id: 'exp-predatory-canopy',
  uid: 'matrix-expansion/predatory-canopy',
  meta: {
    label: 'Predatory Canopy', element: 'nature', accent: '#86dc62', cast: 'zone', key: '',
    hint: 'An overhead canopy watches the ground, then lashes the first target that enters its roots.',
    glyph: '<path d="M12 35Q50 0 88 35M18 35Q20 76 34 82M82 35Q80 76 66 82M50 25V72M35 50Q50 62 65 50"/>'
  },
  settings: {
    /* --- the cast itself --- */
    range: 18, // maximum cast distance, metres
    minRange: 2, // closer than this and the cast is refused
    speed: 18, // metres/second the seed pod flies
    cooldown: 8, // seconds before the ability can be armed again
    castAnim: 'cast2', // which clip in `CAST_ANIMATIONS` the body throws
    zoneRadius: 4, // radius of the root snare, metres — the strike reach

    /* --- light (rides the pod, then hangs under the canopy) --- */
    lightColor: '#b7ff8a',
    lightIntensity: 5,
    lightRadius: 9,

    /* --- particles (pooled, shared systems) --- */
    leafRate: 12, // leaves/second drifting down from the canopy (×3.5 while it wakes)
    moteRate: 22, // pollen motes/second
    leafSize: 0.13, // leaf particle size, metres

    /* ================================================================ */
    /* 1 · THE CANOPY — crown, branches, leaves, vines                   */
    /* ================================================================ */
    canopyHeight: 4.8, // metres the crown hangs over the floor
    canopySpread: 4, // metres the branches reach (4 = authored size)
    seedScale: 1, // size of the travelling seed pod
    retreatStrength: 0.8, // how far the canopy draws in as it withers, 0..1
    dropDistance: 1.5, // metres it sinks as it withers

    /* --- timing --- */
    armDelay: 0.55, // seconds after landing before the snare can trigger
    triggerWindup: 0.32, // seconds from a body entering to the lash
    thornLength: 1.5, // metres the floor thorns stab up
    strikeWidth: 0.12, // half-width of each lashing vine, metres
    strikeDuration: 0.6, // seconds the vines take to withdraw after the hit

    lifetime: 6, // seconds the canopy hangs (× settings.global.lifetime)
    fade: 1.1, // seconds it takes to wither (× settings.global.lifetime)

    /* --- the hit --- */
    hitImpulse: 5, // knockback
    hitLift: 2, // upward share
    hitSpin: 1, // tumble

    /* --- palette --- */
    barkColor: '#365423', // wood, pod husk, lashing vines
    leafColor: '#55a837', // leaves, falling leaves
    leafRim: '#d1ff82', // leaf rim and veins, pod glow, pollen
    rootColor: '#a9eb6a', // root snare, sap, vine veins

    /* --- leaves --- */
    leafFlutter: 1, // how much the leaves flutter
    leafVariegation: 0.5, // blotching across each leaf
    leafBristle: 1, // how hard they curl when the trap wakes
    leafSpeed: 0.55, // metres/second the falling leaves drift
    leafLifetime: 1.7, // seconds a falling leaf lives
    moteSize: 0.07, // pollen size
    moteSpeed: 0.2, // pollen drift
    moteLifetime: 1.2, // seconds

    /* --- bark --- */
    barkRidge: 1, // bark furrow scale
    barkMoss: 0.6, // moss on the upward faces
    mossColor: '#5f8a2e',
    crownSpin: 0.12, // radians/second the crown slowly turns
    tendrilCurl: 0.42, // radians the vines swing in as the trap wakes

    /* --- the seed pod --- */
    seedHeight: 0.8, // metres off the floor it flies
    seedSpin: 3, // radians/second it turns
    seedGlow: 1, // light leaking from its seams

    /* ================================================================ */
    /* 2 · THE SNARE — the root sigil and the dappled shade              */
    /* ================================================================ */
    rootGlow: 1, // emissive gain of the snare
    rootCount: 12, // root lobes round the snare
    shadeOpacity: 0.45, // how dark the leaf shadow is
    shadeScale: 1, // leaf-shadow fleck size
    shadeColor: '#0d1608',

    /* ================================================================ */
    /* 3 · THE LASH — vines, splinters, snap                             */
    /* ================================================================ */
    strikeArc: 0.8, // metres the lashing vines bow upward
    strikeGlow: 1, // vein glow along the vines
    splinterBurst: 26, // wood splinters thrown from the struck body
    splinterSize: 0.07, // metres
    splinterSpeed: 4, // metres/second
    splinterLifetime: 0.9, // seconds
    colorSplinterA: '#e7f5b0', // birth
    colorSplinterB: '#7aa043', // early
    colorSplinterC: '#3d5524', // late
    colorSplinterD: '#1a2410', // death
    strikeLeaves: 18, // leaves torn loose at the hit
    shedLeaves: 40, // leaves shed as the canopy withers
    snapWarp: 0.8, // strength of the air-snap distortion (× global distortion)
    snapRadius: 2.4, // metres it runs out to
    snapDuration: 0.45, // seconds

    /* ================================================================ */
    /* 4 · THE BEATS                                                     */
    /* ================================================================ */
    unfurlShake: 0.1, // trauma as the canopy bursts open (× explosionIntensity)
    windupRumble: 0.35, // rumble while the trap winds up
    strikeShake: 0.3, // trauma on the lash
    strikeFlash: 0.12, // screen flash on the lash
    strikeLight: 9, // light punch on the lash
    flashColor: '#d8ffb0'
  }
};
