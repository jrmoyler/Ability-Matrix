/**
 * Mass Weft — Gravity, line cast. A shuttle of collapsed mass flies down the
 * line weaving a narrow corridor of bent space behind it; for the corridor's
 * life it pulses, and every pulse strikes the bodies standing inside it.
 *
 * Expansion candidate data block: presentation (`meta`) and the live settings
 * the ability and its editor folder read. Plain data, no imports. Gated by
 * `../status.js` — candidates are never exposed by the production shell.
 *
 * Every dimension and colour below is resolved per frame by
 * `MassWeftAbility`, so dragging any of it reshapes a corridor already
 * standing. The gameplay keys (`zoneRadius`, `pulsePeriod`, `damage`,
 * `lifetime`, `hit*`) drive the combat events the cast emits through the
 * expansion combat binding; everything else is presentation.
 */
export default {
  id: 'exp-mass-weft',
  uid: 'matrix-expansion/mass-weft',
  meta: {
    label: 'Mass Weft',
    element: 'gravity',
    accent: '#d8cad5',
    cast: 'line',
    key: '',
    hint: 'Weave a narrow gravity corridor that repeatedly strikes enemies inside it.',
    glyph: '<path d="M12 50H88M22 35Q50 5 78 35M22 65Q50 95 78 65M50 12V88"/><circle cx="50" cy="50" r="12"/>'
  },
  settings: {
    /* --- the impact each pulse delivers (combat hitForce) --- */
    hitImpulse: 2, // knockback impulse handed to the struck body
    hitLift: 1, // upward share of that impulse
    hitSpin: 0.6, // tumble

    /* --- the corridor's ambient streaks (shared ExpansionAtmosphere) --- */
    particleRate: 18, // streaks/second
    particleSize: 0.1, // streak size, metres

    /* --- the cast itself --- */
    range: 18, // maximum cast distance, metres
    minRange: 2, // closer than this and the cast is refused
    speed: 20, // metres/second the shuttle flies down the line
    cooldown: 8, // seconds before the ability can be armed again
    castAnim: 'cast1', // which clip in `CAST_ANIMATIONS` the body throws
    zoneRadius: 1.1, // half-width of the corridor's strike capsule, metres

    /* --- light (rides the shuttle, then the corridor) --- */
    lightColor: '#dccbe9',
    lightIntensity: 5,
    lightRadius: 8,

    /* --- timing (× settings.global.lifetime) --- */
    lifetime: 4, // seconds the corridor stands and pulses
    fade: 1, // seconds it takes to collapse once it stops pulsing
    pulsePeriod: 1, // seconds between strikes (never below 0.3)
    damage: 0.35, // damage per strike (a fresh sandbox dummy has 1)

    /* ================================================================ */
    /* 1 · THE WEFT RIBBON — the corridor drawn on the floor             */
    /* ================================================================ */
    travelWidth: 1, // corridor width while the shuttle is still flying, × zoneRadius
    collapseStrength: 0.85, // how far the corridor narrows as it fades, 0..1
    flowSpeed: 1, // speed of every shader in the corridor
    ribbonGlow: 1, // emissive gain of the ribbon
    ribbonNoise: 1, // how much noise breaks the travelling filaments
    ribbonRipple: 1, // the trough's breathing ripple
    softFade: 0.25, // metres the ribbon and floor feather into geometry

    /* ================================================================ */
    /* 2 · THE FLOOR WEAVE — the well of bent space-time under it        */
    /* ================================================================ */
    floorWidth: 2.6, // floor width, × zoneRadius
    floorSag: 1, // how hard the threads pinch toward the spine
    floorOpacity: 0.6, // darkness of the well
    weaveDensity: 6, // threads across the corridor
    weaveThread: 0.08, // thread thickness (fraction of a cell)
    weaveGlow: 1.2, // thread brightness
    weftColor: '#c9b8ff', // the threads
    voidColor: '#120d1c', // the well, and the shuttle's body

    /* ================================================================ */
    /* 3 · FILAMENTS + HEDDLES — the twist round the corridor            */
    /* ================================================================ */
    filamentHeight: 0.6, // metres off the floor the threads wind round
    filamentTwist: 0.45, // radians/second the pair counter-rotates
    filamentGlow: 1, // emissive gain
    filamentBeads: 60, // beads of light along each thread
    ringScale: 1, // heddle ring size, × corridor width (≤ 1)
    ringSpin: 0.7, // radians/second the heddles turn
    ringTilt: 0.45, // radians every other heddle leans
    ringGlow: 1, // emissive gain

    /* ================================================================ */
    /* 4 · THE SHUTTLE — the core that flies the line                    */
    /* ================================================================ */
    coreScale: 0.7, // shuttle size
    coreHeight: 0.6, // metres off the floor
    corePulse: 0.15, // how much it throbs while the corridor stands
    coreSpin: 3, // radians/second it rolls about its long axis in flight
    coreHorizon: 2.4, // tightness of the burning rim (higher = thinner)
    coreGlow: 1, // emissive gain
    coreWobble: 1, // how much space boils on its skin
    collapseFlare: 1.4, // flare as the corridor implodes into it

    /* ================================================================ */
    /* 5 · COMPRESSION + CONTACT — what an accepted pulse draws          */
    /* ================================================================ */
    compressionScale: 1, // compression ring size
    compressionDuration: 0.5, // seconds a compression wave runs
    compressionGlow: 1, // emissive gain
    contactScale: 1, // contact rosette size, × zoneRadius
    contactDuration: 0.6, // seconds a rosette lasts
    contactGlow: 0.8, // rosette, burst and decal strength

    /* ================================================================ */
    /* 6 · THE LENS — screen-space pull toward the spine                 */
    /* ================================================================ */
    lensWarp: 0.7, // refraction strength (× settings.global.distortion)

    /* ================================================================ */
    /* 7 · PARTICLES                                                     */
    /* ================================================================ */
    particleFlowSpeed: 0.8, // corridor lengths/second the streak source sweeps
    infallRate: 26, // motes/second drawn in from the corridor's edges
    infallSize: 0.07, // mote size, metres
    infallSpeed: 1.3, // metres/second they fall toward the spine
    infallLifetime: 0.9, // seconds
    colorInfallA: '#f4eeff', // birth
    colorInfallB: '#c3b0ea', // early
    colorInfallC: '#6f5f99', // late
    colorInfallD: '#221a35', // death
    gritBurst: 14, // grit chips lifted off the floor per accepted pulse
    gritSize: 0.08, // chip size, metres
    gritSpeed: 2.2, // metres/second they leap
    gritLifetime: 0.8, // seconds
    colorGritA: '#d9cfe6',
    colorGritB: '#8c7fa3',
    colorGritC: '#4a405c',
    colorGritD: '#1d1726',

    /* ================================================================ */
    /* 8 · THE BEATS — camera and light on the strikes                   */
    /* ================================================================ */
    arrivalShake: 0.12, // trauma as the corridor locks in (× explosionIntensity)
    pulseShake: 0.1, // trauma on every accepted strike
    pulseFlash: 0.08, // screen flash on the first accepted strike
    pulseLight: 6, // light punch on every accepted strike
    collapseShake: 0.14, // trauma as the corridor implodes
    collapseFlash: 0.12, // screen flash as it implodes
    flashColor: '#e6dcff',

    /* --- palette --- */
    gravityColor: '#9f8fbe', // bent space
    coreColor: '#efe4ff' // the light the weft carries
  }
};
