/**
 * Mirage Procession — illusion, line cast. Data only, no imports.
 *
 * Three identical masks process down three parallel lanes; only one of them
 * (`trueLane`) carries a hit volume. Everything the player can *see* — masks,
 * veils, wakes, shards, glitter, particles, decals — is emitted identically in
 * all three lanes, so the presentation can never give the real lane away.
 * `laneGap` and `hitWidth` are shared with the aim reticle (`ExpansionAim`
 * draws the three lanes from them) and are gameplay numbers.
 *
 * Every key below is a live editor control. Gameplay keys keep their original
 * names and defaults; the rest are the craft layer.
 */
export default {
  id: 'mirageProcession',
  meta: {
    label: 'Mirage Procession',
    accent: '#ff9ad8',
    element: 'illusion',
    cast: 'line',
    hint: 'Illusion — three masks process down three lanes; only the chosen lane strikes',
    glyph:
      '<path d="M18 25Q50 5 82 25L75 66L50 85L25 66Z M29 42L43 39 M57 39L71 42"/>',
  },
  settings: {
    /* --- the cast --- */
    aimStyle: 'lanes', // reticle style read by ExpansionAim
    range: 20,
    minRange: 1,
    speed: 12, // the procession advances at (m/s)
    cooldown: 4,
    castAnim: 'cast1',
    lifetime: 2, // nominal cast length, for the HUD

    /* --- the feint (gameplay) --- */
    laneGap: 1.8, // distance between lanes (m)
    trueLane: 0, // -1 left, 0 centre, 1 right — the only lane that strikes
    hitWidth: 0.7, // half-width of the true lane's sweep (m)
    impulse: 12,
    lift: 5,
    spin: 2,

    /* --- light --- */
    lightColor: '#ff9ad8',
    lightIntensity: 5,
    lightRadius: 9,
    finaleLight: 3, // light punch when the masks shatter (× explosion intensity)
    contactLight: 2, // light punch on a committed hit

    /* --- palette --- */
    maskColor: '#f3a5ed', // the masks' lacquer
    edgeColor: '#fff3ff', // rims, engraving, shards
    trailColor: '#9654d9', // wakes and veils

    /* --- 1 · the masks --- */
    maskSize: 1, // mask scale
    maskHeight: 1.15, // floats at (m)
    maskBob: 0.14, // bob height (m)
    maskSway: 0.16, // sway (rad)
    appearTime: 0.25, // fades in over (s)
    maskGlow: 2, // lacquer brightness
    maskOpacity: 1,
    filmStrength: 0.8, // thin-film iridescence on the rims
    glitch: 1, // slice glitches across the face
    scanSpeed: 7, // holographic scan bands run at
    engravingGlow: 1.4, // filigree brightness
    dissolveEdge: 0.08, // burn edge width of the dissolve

    /* --- 2 · the veils --- */
    veilLength: 1.6, // trails behind each mask (m)
    veilWidth: 0.8, // (m)
    veilFlutter: 1, // flutter amplitude
    veilDroop: 0.35, // sag toward the floor (m)
    veilGlow: 1.2,
    veilOpacity: 0.55,

    /* --- 3 · the wakes --- */
    wakeGlow: 1.7,
    wakeOpacity: 0.3,
    wakeShimmer: 1, // heat-shimmer bands
    wakeScale: 1, // band frequency

    /* --- 4 · the shards --- */
    shardSize: 0.12, // mirror shard scale
    shardSpread: 1.2, // how far they peel out when the masks depart (m)
    shardOrbit: 0.55, // orbit radius round a mask (m)
    shardSpin: 1.8, // orbit speed (rad/s)
    shardGlow: 1.6,
    shardOpacity: 0.7,

    /* --- 5 · particles --- */
    trailInterval: 0.12, // seconds between identical trail puffs in all lanes
    trailCount: 4, // per lane per puff
    finaleCount: 12, // per lane when the masks shatter
    contactCount: 24, // at a committed hit
    trailSize: 0.11, // trail puff size (m)
    trailLife: 0.48, // (s)
    trailSpeed: 0.6, // drift (m/s)
    trailSpread: 0.5, // cone spread (0 = straight up, 1 = hemisphere)
    trailRadius: 0.25, // emitter radius round the mask (m)
    finaleSize: 0.16, // finale puff size (m)
    finaleLife: 0.65, // (s)
    finaleSpeed: 1.4, // (m/s)
    finaleSpread: 0.8,
    finaleRadius: 0.35, // (m)
    contactSize: 0.14, // committed-hit burst size (m)
    contactLife: 0.6, // (s)
    contactSpeed: 2, // (m/s)
    contactSpread: 0.8,
    contactEmitRadius: 0.3, // emitter radius of the hit burst (m)
    sparkGlow: 1.4,
    colorSparkA: '#ffffff',
    colorSparkB: '#ffcefa',
    colorSparkC: '#b87de9',
    colorSparkD: '#392459',
    glitterCount: 150, // GPU glitter along the three lanes (≤ 180)
    glitterSize: 0.05,
    glitterGlow: 2,
    glitterRise: 1.2, // drift upward over one life (m)
    glitterColor: '#ffe6fb',

    /* --- 6 · the finale & contacts --- */
    finaleBurst: 1.1, // AIR shell per mask (m)
    finaleIntensity: 0.6,
    shellLife: 0.5, // AIR shell per mask lives (s)
    shellOpacity: 0.5,
    shellFresnel: 2.2, // rim sharpness of the shell
    rippleRadius: 1.6, // ripple decal per lane (m)
    contactRadius: 1.2, // shockwave at a committed hit (m)
    decalLife: 0.8,
    rippleIntensity: 0.7, // RIPPLE decal brightness at the endpoints
    contactIntensity: 0.9, // SHOCKWAVE decal brightness at a hit
    contactWidth: 0.07, // its ring width
    colorBurstA: '#ffffff',
    colorBurstB: '#ffb6f0',
    colorBurstC: '#6b3aa8',
    impactShake: 0.12, // (× explosion intensity, × camera shake)
    shakeDecay: 7,
    shakeFrequency: 20,
    impactFlash: 0.08, // (× explosion intensity)

    /* --- 7 · the shimmer --- */
    shimmerStrength: 0.5, // heat shimmer at the mask front (× global distortion)
    shimmerHeight: 2.4, // (m)
    shimmerScale: 1, // noise frequency
  },
};
