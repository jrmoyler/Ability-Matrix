/**
 * Vector Breakwater — settings block. Data only, no imports.
 *
 * A line cast: three curved shield fronts launched `spacing` seconds apart
 * sweep the corridor. Each front strikes every enemy it passes once, so a
 * body in the lane takes three consecutive impacts. When a front reaches the
 * end of the line it breaks like a wave on a sea wall — a wake ring, fins
 * peeling away — and the last one leaves the corridor scoured.
 *
 * Gameplay keys (`speed`, `width`, `spacing`, `impulse`, `lift`, `spin`) are
 * the attack; everything else is presentation. Every value is a live editor
 * slider read every frame.
 */
export default {
  id: 'vectorBreakwater',
  meta: {
    label: 'Vector Breakwater',
    accent: '#ffd1a3',
    element: 'force',
    cast: 'line',
    hint: 'Force — three shield fronts sweep the lane in succession; anything in it takes three consecutive impacts',
    glyph: '<path d="M15 15L45 50L15 85M38 15L68 50L38 85M60 15L90 50L60 85"/>',
  },
  settings: {
    /* --- the cast itself --- */
    aimStyle: 'wide', // aim reticle: a single wide swept front
    range: 20, // maximum cast distance, metres
    minRange: 1, // closer than this and the cast is refused
    speed: 15, // how fast each front travels, metres/second
    cooldown: 4, // seconds before the ability can be armed again
    castAnim: 'cast2', // which clip in `CAST_ANIMATIONS` the body throws
    lifetime: 2.5, // shared-contract lifetime; fronts are timed by speed + spacing

    /* --- the attack (combat-bound; preserved exactly) --- */
    width: 2.2, // half-width of the swept corridor, metres
    spacing: 0.22, // seconds between consecutive fronts
    impulse: 13, // knockback along the lane, m/s
    lift: 4, // upward kick, m/s
    spin: 2, // tumble on a knockdown

    /* --- light --- */
    lightColor: '#ffd1a3',
    lightIntensity: 5,
    lightRadius: 9,

    /* ================================================================ */
    /* 1 · BRACE (anticipation at the caster)                           */
    /* ================================================================ */
    braceSize: 1.2, // span of the chevron brace at the caster's feet, metres
    braceGlow: 2.5, // how hot a chevron flares as its front launches
    braceTime: 0.35, // seconds a chevron takes to cool after launch
    launchShake: 0.04, // camera knock as each front leaves
    launchLight: 2, // light punch as each front leaves

    /* ================================================================ */
    /* 2 · SHIELD FRONTS                                                */
    /* ================================================================ */
    edgeColor: '#fff0dd', // hot rim of the shield
    bodyColor: '#d16f56', // pressure body of the shield
    frontHeight: 1.8, // metres
    frontGlow: 2, // emissive strength of the shield
    frontOpacity: 1, // multiplier on the shield's alpha
    frontNoise: 0.6, // weight of the pressure cells in the body
    frontNoiseScale: 3, // pressure cells per metre-ish
    shimmerSpeed: 7, // how fast the slash lines run across it
    frontRim: 0.8, // weight of the leading rim
    spentFade: 0.15, // fraction of the line over which a front tears apart at the end
    ribGlow: 1.4, // brightness of the internal splines
    ribOpacity: 0.7,

    /* --- pressure fins behind each front --- */
    finSize: 0.22, // fin scale, metres
    finSpread: 0.9, // how far fins are flung sideways as a front breaks
    finGlow: 1.6,

    /* ================================================================ */
    /* 3 · GROUND SCOUR                                                 */
    /* ================================================================ */
    groundColor: '#ff9e76',
    groundOpacity: 1, // multiplier on the corridor scour
    groundGlow: 1.5,
    scourWidth: 0.45, // how far behind a front the fresh scour reaches, metres × width
    dustRate: 40, // grit streaks per second kicked off each front's foot
    dustSize: 0.09,
    dustLife: 0.6,
    dustColor: '#d9b49a', // grit tint; also the break's dust-ring decal

    /* ================================================================ */
    /* 4 · SPRAY + CONTACT                                              */
    /* ================================================================ */
    sprayCount: 20, // streaks thrown off a front every `sprayEvery` metres
    sprayEvery: 2, // metres between spray bursts along the lane
    spraySize: 0.07,
    sprayLife: 0.5,
    spraySpeed: 4,
    particleGravity: -4, // gravity on the shared streak system, m/s²
    particleDrag: 1.1, // drag on the shared streak system
    // The one pooled streak system's lifetime gradient; spray, grit and
    // shards are all tinted over it.
    colorSprayA: '#fff6e4',
    colorSprayB: '#ffd1a3',
    colorSprayC: '#e9876f',
    colorSprayD: '#68394b',
    contactSize: 1, // pressure-petal size at a struck target
    contactLife: 0.4, // seconds a contact petal lives
    chipCount: 12, // shards off a struck target
    chipSize: 0.09,
    chipLife: 0.38,
    chipSpeed: 3,
    chipColor: '#e9b08f', // shard tint
    contactLight: 1.5, // light punch on a confirmed contact

    /* ================================================================ */
    /* 5 · BREAK (arrival at the end of the line)                       */
    /* ================================================================ */
    wakeTime: 0.55, // seconds a wake ring lives after a front breaks
    wakeGrowth: 1.15, // how far a wake spreads, × width
    wakeOpacity: 0.65,
    impactShake: 0.12, // camera knock when the first front breaks
    impactFlash: 0.08, // screen flash when the first front breaks
    arrivalShake: 0.05, // smaller knock for the following fronts
    arrivalLight: 3, // light punch per break
    shockRadius: 3, // shockwave decal on each break, metres
    burstSize: 2.2, // pressure shell on the first break, metres

    /* ================================================================ */
    /* 6 · DISTORTION                                                   */
    /* ================================================================ */
    warpStrength: 0.5, // refraction riding each front
    warpHeight: 2.2, // metres
    warpScale: 2.5, // noise scale
    warpSpeed: 2, // noise speed
  },
};
