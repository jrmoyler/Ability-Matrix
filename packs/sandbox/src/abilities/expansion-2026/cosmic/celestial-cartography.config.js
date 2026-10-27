/**
 * Celestial Cartography — Cosmic — a small orrery of three stars rolls out to
 * the circle and opens into a star chart overhead: an armillary band, a
 * nebula veil, eight stars whose links are drawn one by one as if by a pen,
 * two meridian rings turning above it all. Once armed, the first enemy whose
 * centre is inside the chart is *marked* at a fixed warning point; the chart's
 * stars bend rays onto it, a meteor falls from the chart along its tail, and
 * after `strikeDelay` it lands — striking only if the target is still within
 * `strikeRadius` of the mark. A target that walks out of the compass evades.
 *
 * Matrix Expansion data block: presentation (`meta`) and the live settings the
 * ability and its editor folder read. Plain data, no imports.
 *
 * Every presentation key is resolved per frame by
 * `CelestialCartographyAbility`, so dragging any of it re-draws a chart that
 * is already in the sky.
 */
export default {
  id: 'exp-celestial-cartography',
  uid: 'matrix-expansion/celestial-cartography',
  meta: {
    label: 'Celestial Cartography',
    element: 'cosmic',
    accent: '#bda1ff',
    cast: 'zone',
    key: '',
    hint: 'Draw a constellation overhead. An enemy entering the chart is marked and struck from above.',
    glyph: '<circle cx="20" cy="72" r="5"/><circle cx="42" cy="30" r="5"/><circle cx="80" cy="52" r="5"/><path d="M20 72L42 30L80 52L57 80L20 72M50 10L52 21M45 15H56"/>'
  },
  settings: {
    /* --- the cast itself --- */
    range: 18, // maximum cast distance, metres
    minRange: 2, // closer than this and the cast is refused
    speed: 20, // metres/second the orrery rolls to the circle
    cooldown: 9, // seconds before the ability can be armed again
    castAnim: 'cast2', // which clip in `CAST_ANIMATIONS` the body throws
    zoneRadius: 4.2, // metres: the chart, and the circle a mark may be made in
    lifetime: 6, // seconds the chart stays in the sky (× global lifetime)
    fade: 1.2, // seconds it takes to collapse and fade (× global lifetime)

    /* --- the strike (combat) --- */
    armDelay: 0.45, // seconds before the chart can mark anything
    strikeDelay: 0.42, // seconds between the mark and the meteor landing
    strikeRadius: 1, // metres: the target must still be this close to the mark
    hitImpulse: 6, // knock-back of the strike, m/s
    hitLift: 5,
    hitSpin: 2,

    /* --- light (at the chart's heart) --- */
    lightColor: '#d9c3ff',
    lightIntensity: 7,
    lightRadius: 10,
    arrivalLight: 0.6, // light punch as the chart opens, × lightIntensity
    markLight: 0.5, // light punch on the mark, × lightIntensity
    strikeLight: 1.6, // light punch on the strike, × lightIntensity

    /* --- palette --- */
    chartColor: '#d5bbff', // stars, links and the armillary band
    rayColor: '#ac84ff', // the floor chart, the mark, the rays and the meteor
    coreColor: '#f2eaff', // white-hot cores and the corona
    nebulaColor: '#3a2a7a', // the deep sky behind the chart

    /* ================================================================ */
    /* 1 · THE ORRERY — rolls from the hand to the circle                */
    /* ================================================================ */
    starScale: 1, // orrery size
    travelHeight: 1.1, // metres off the floor
    travelSpin: 1.5, // radians/second

    /* ================================================================ */
    /* 2 · THE CHART                                                     */
    /* ================================================================ */
    chartHeight: 4.2, // metres overhead
    drawTime: 0.45, // seconds to draw every link, one after another
    collapseStrength: 0.8, // how far the chart shrinks and sinks on its exit (0..1)
    nodeScale: 0.22, // chart star size
    twinkle: 3, // twinkle speed
    chartGlow: 1, // stars, links and band
    nebulaGlow: 0.5,
    nebulaScale: 1.15, // nebula radius, × chart radius
    meridianScale: 0.55, // the two turning meridian rings, × chart radius
    meridianSpin: 0.3, // radians/second
    meridianGlow: 0.6,
    floorGlow: 1, // the chart projected on the floor
    dustDrift: 0.08, // metres the star dust bobs

    /* ================================================================ */
    /* 3 · THE MARK — compass, convergence and meteor                    */
    /* ================================================================ */
    markGlow: 1, // the warning compass
    convergenceWidth: 0.45, // ray width
    convergenceGlow: 0.65,
    meteorHeadScale: 0.5,
    meteorTailLength: 2.5, // metres (never longer than the gap to the chart)
    meteorWidth: 1,
    meteorGlow: 1,
    meteorTrailRate: 28, // streaks shed by the meteor, per second
    beamGlow: 0.8, // the column the meteor falls down
    warpStrength: 0.6, // the lens bending the world round the falling star

    /* ================================================================ */
    /* 4 · THE STRIKE                                                    */
    /* ================================================================ */
    impactScale: 1, // burst, shockwave and shard spread
    impactGlow: 0.8,
    flareScale: 1, // the corona
    shardScale: 1,
    shardDuration: 0.8, // seconds the shards live
    strikeShake: 0.3, // camera knock (× global camera shake)
    strikeFlash: 0.28, // screen flash (× global explosion intensity)

    /* ================================================================ */
    /* 5 · PARTICLES                                                     */
    /* ================================================================ */
    particleRate: 26, // ambient motes under the chart, per second
    particleSize: 0.1,
    stardustRate: 22, // glitter drizzling off the chart, per second
    stardustSize: 0.05,
    stardustLife: 1.4, // seconds
    strikeStardust: 36, // glitter thrown up by the strike
    colorStardustA: '#ffffff',
    colorStardustB: '#e4d4ff',
    colorStardustC: '#9d7cf0',
    colorStardustD: '#2c1d5a'
  }
};
