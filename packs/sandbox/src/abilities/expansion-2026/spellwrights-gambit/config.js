/**
 * Spellwright's Gambit — arcane, zone cast. Data only, no imports.
 *
 * An armillary descends over the target and inks a sigil; the caster has
 * composed two attack shapes (ring, line or burst) and the armillary releases
 * them one beat apart. The footprint of the *next* beat is drawn on the floor
 * the whole time — it is the hit test, drawn — so `zoneRadius`, `lineWidth`
 * and `ringWidth` are gameplay numbers as well as visual ones.
 *
 * Every key below is a live editor control. Gameplay keys (range, timing,
 * shapes, widths, force) keep their original names and defaults; the rest
 * are the craft layer.
 */
export default {
  id: 'spellwrightsGambit',
  meta: {
    label: "Spellwright's Gambit",
    accent: '#7c8cff',
    element: 'arcane',
    cast: 'zone',
    hint: 'Arcane — compose two runic shapes; the armillary releases them one beat apart',
    glyph:
      '<circle cx="50" cy="50" r="34"/><path d="M50 12L78 68H22Z M23 32H77L50 82Z"/><circle cx="50" cy="50" r="6"/>',
  },
  settings: {
    /* --- the cast --- */
    range: 18, // max aim distance (m)
    minRange: 1, // min aim distance (m)
    speed: 30, // the armillary flies to the target at (m/s)
    cooldown: 4,
    castAnim: 'cast2',
    zoneRadius: 4, // reach of both shapes (m) — the hit radius
    lifetime: 2.4, // nominal cast length, for the HUD (the beats set the real timing)

    /* --- the gambit (gameplay) --- */
    firstShape: 'ring', // 'ring' | 'line' | 'burst'
    secondShape: 'line',
    beatInterval: 0.65, // seconds from landing to the first shape, and between shapes
    lineWidth: 0.8, // half-width of the line stripe (m)
    ringWidth: 0.8, // depth of the ring band, measured in from the rim (m)
    impulse: 12, // knockback per struck body (m/s, × explosion intensity)
    lift: 5,
    spin: 2,

    /* --- light --- */
    lightColor: '#aab4ff',
    lightIntensity: 6,
    lightRadius: 9,
    beatLight: 2, // light punch on each release (added intensity, × explosion intensity)

    /* --- palette --- */
    inkColor: '#646cff', // the sigil's ink
    edgeColor: '#eef0ff', // white-hot rims, nibs and footprints
    etchColor: '#9a65ee', // the written linework and motes
    coreColor: '#c2bbff', // the armillary core, releases and beam body
    bandColor: '#8f86ff', // the brass-of-light armillary bands
    beamColor: '#ffffff', // the beam's hot foot

    /* --- 1 · the sigil (floor) --- */
    fieldGlow: 1.8, // ink disc brightness
    inkBleed: 1, // how much the brushed ink wanders (fbm)
    inkWash: 0.22, // ink wash that deepens as a beat charges
    etchGlow: 1, // linework brightness
    sigilSpin: 0.25, // linework turns at (rad/s)
    drawTime: 0.45, // inked round over (s)
    scriptSpeed: 0.8, // scan wedge and ripples run at (× clock)
    dissolveTime: 0.7, // fraction of the fade spent dissolving (0..1)

    /* --- 2 · the footprints (telegraph) --- */
    footprintGlow: 1.6,
    footprintOpacity: 1,

    /* --- 3 · the armillary (hero) --- */
    coreSize: 1, // whole armillary scale
    orbitSpeed: 1, // blades and rings turn at (× clock)
    heroHeight: 1.15, // hovers at (m)
    heroDrop: 2.4, // descends from this much higher on arrival (m)
    descendTime: 0.45, // descent lasts (s)
    heroRise: 1.6, // lifts away on the exit (m)
    coreGlow: 1.1, // core emissive intensity at rest
    coreFlare: 1.6, // extra emissive on a release
    coreEmissive: '#5743ab',
    coreMetalness: 0.65,
    coreRoughness: 0.28,
    bandGlow: 1.4, // armillary band brightness
    bandRunes: 24, // rune cells round each band
    bladeCount: 8, // orbiting runic blades (≤ 8)
    bladeSize: 0.6,
    bladeRadius: 0.65, // blade orbit radius (m)
    bladeSpread: 0.1, // the orbit widens this much per released beat (m)
    bladeCinch: 0.18, // the orbit tightens this much as a beat comes due (m)
    bladeBob: 0.14, // vertical bob of the blades (m)
    ringGlow: 1, // floor ring brightness (× band glow)

    /* --- 4 · the release --- */
    releaseLife: 0.5, // each flare lasts (s)
    releaseGrow: 0.2, // a ring flare grows by (× reach)
    releaseGlow: 2.2,
    releaseOpacity: 0.65,
    beamHeight: 4, // column of light (m)
    beamWidth: 0.42, // column radius (m)
    beamLife: 0.35, // column fades over (s)
    beamGlow: 3,

    /* --- 5 · particles --- */
    strikeCount: 42, // streaks thrown per release
    strikeSize: 0.075,
    strikeLife: 0.7,
    strikeSpeed: 3,
    ambientRate: 14, // streaks/second rising off the sigil while charging
    ambientSize: 0.05,
    ambientLife: 0.9,
    ambientSpeed: 1.1,
    sparkGlow: 1.6,
    colorSparkA: '#ffffff', // birth
    colorSparkB: '#c9cbff',
    colorSparkC: '#7c8cff',
    colorSparkD: '#372275', // death
    moteCount: 140, // GPU motes (≤ 160)
    moteSize: 0.06,
    moteRise: 1.6, // climb over one life (m)
    moteSwirl: 1.2, // orbit speed (rad/s)
    moteGlow: 2,
    moteColor: '#f2f0ff', // hot core of a mote

    /* --- 6 · the strike (burst, decals, camera) --- */
    burstReach: 0.9, // arcane shell grows to (× reach)
    burstIntensity: 0.7,
    burstLife: 0.5,
    burstOpacity: 0.55,
    burstFresnel: 2, // rim sharpness of the shell
    burstSquash: 0.35, // vertical squash of the shell (1 = sphere)
    decalLife: 0.8,
    decalWidth: 0.06, // shockwave / arc scar width for the burst and line shapes
    decalIntensity: 0.8,
    colorBurstA: '#ffffff',
    colorBurstB: '#9aa4ff',
    colorBurstC: '#3a2a8a',
    impactShake: 0.12, // camera knock per release (× explosion intensity, × camera shake)
    shakeDecay: 7,
    shakeFrequency: 20,
    impactFlash: 0.08, // screen flash per release (× explosion intensity)

    /* --- 7 · the warp --- */
    warpStrength: 0.6, // release pressure ring strength (× global distortion)
    warpWidth: 0.12, // ring thickness (fraction of reach)
    warpLife: 0.45, // ring runs out over (s)
    warpSwirl: 0.25, // slow swirl while a beat charges
  },
};
