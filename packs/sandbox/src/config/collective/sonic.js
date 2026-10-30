/**
 * Resonance Pulse — Sound — rings of pressure that ripple the world.
 *
 * Collective Originals data block: presentation (`meta`) and the live settings
 * the ability and its editor folder read. Plain data, no imports, so
 * `settings.js` can pull it in without a cycle.
 */
export default {
  id: 'sonic',
  meta: {
    label: "Resonance Pulse",
    accent: '#ffd1f0',
    key: 'B',
    hint: "Sound — a train of pressure rings that ends in a boom",
    cast: 'line',
    glyph: `<circle cx="26" cy="50" r="6"/><path d="M40 34a22 22 0 0 1 0 32"/><path d="M54 24a36 36 0 0 1 0 52"/><path d="M68 14a50 50 0 0 1 0 72"/>`
  },
  settings: {
    /* --- the cast itself --- */
    range: 18.0, // maximum cast distance, metres
    minRange: 3.0, // closer than this and the cast is refused
    speed: 17.0, // how fast every ring travels, metres/second
    lifetime: 1.9, // seconds the boom (plate, hum) hangs after the last ring lands
    cooldown: 0.6, // seconds before the ability can be armed again
    castAnim: 'cast1', // which clip in `CAST_ANIMATIONS` the body throws
    fadeTime: 0.9, // seconds everything takes to settle out

    /* --- where the train leaves the caster --- */
    handForward: 0.6, // metres in front of the caster
    handSide: 0.0, // metres to the caster's right
    handHeight: 1.3, // metres off the floor

    /* ================================================================ */
    /* 1 · RINGS — the pressure shells                                   */
    /* ================================================================ */

    /* --- the train --- */
    pulseCount: 6, // rings per cast (capped at 12)
    pulseInterval: 0.13, // seconds between one ring leaving and the next
    pulseShrink: 0.08, // each later ring is this much smaller, fraction
    pulseDim: 0.1, // ...and this much dimmer

    /* --- one ring's shape on its way down the line --- */
    ringStart: 0.3, // lateral radius as it leaves the hand, metres
    ringEnd: 2.1, // lateral radius at the end of the line, metres
    ringCurve: 0.65, // <1 opens early, >1 stays tight then flares
    ringHeight: 1.15, // centre height at the end of the line, metres
    spread: 0.85, // half-angle of the shell, radians — how domed it is
    birthTime: 0.07, // seconds a ring takes to fade in at the hand
    arriveGrow: 0.45, // how much more it opens as it dies at the end, fraction
    arriveFade: 0.32, // seconds it takes to die once it lands

    /* --- the shader --- */
    rimWidth: 0.055, // width of the bright rim, fraction of the shell
    rimBright: 1.7, // rim brightness
    chroma: 0.045, // RGB split across the rim, fraction of the shell
    fresnelPower: 2.4,
    fresnelBright: 0.5,
    bodyOpacity: 0.38, // brightness of the interference bands through the body
    bands: 6.0, // interference bands across the shell
    beat: 1.65, // ratio of the second wave — the beat pattern between them
    bandSpeed: 16.0, // how fast the bands run outward
    bandSharp: 3.0, // >1 thins the bands into lines
    lobes: 5.0, // standing-wave lobes around the ring
    lobeDepth: 0.35, // how much the lobes modulate the bands, 0..1
    intensity: 2.2, // emissive multiplier — bloom picks this up
    opacity: 1.0,
    softFade: 0.45, // metres it feathers out where it cuts the floor
    colorRim: '#fff4fb', // white-hot core stop
    colorBody: '#8e1fe0', // saturated body stop
    colorChromaR: '#ff2f8f',
    colorChromaG: '#a8d8ff',
    colorChromaB: '#5a3cff',

    /* --- the body: a filled lens of compressed air with a rolled lip --- */
    bodyFill: 0.8, // opacity of the lens body (normal-blended, it darkens what it crosses)
    bodyCentre: 0.5, // fill at the apex, × the fill at the front
    capSplit: 0.78, // share of the shell grid that is the cap; the rest rolls into the lip
    lipSize: 0.13, // thickness of the vortex lip, × the ring radius
    lipCurl: 4.4, // radians the lip rolls back over itself
    lipSpin: 2.6, // how fast air streaks roll round it
    lipBright: 1.0, // lip brightness
    lipOpacity: 0.92,
    colorTint: '#ff86d2', // pale tint stop
    colorDeep: '#14042a', // the dark deep stop

    /* ================================================================ */
    /* 2 · WARP — the screen bends under every ring                      */
    /* ================================================================ */
    warpStrength: 1.4, // refraction strength of a ring
    warpWidth: 0.16, // width of the bent band, fraction of the shell
    warpBody: 0.22, // how much the rest of the shell bends, × the rim
    boomWarp: 1.8, // refraction strength of the boom across the floor

    /* ================================================================ */
    /* 3 · DUST — kicked up under each passing ring                      */
    /* ================================================================ */
    dustSpacing: 1.6, // metres between puffs under one ring
    dustCount: 3, // particles per puff
    dustSize: 0.6,
    dustLife: 1.2,
    dustSpeed: 1.8, // metres/second, outward from the ring's path
    dustRise: 0.45,
    dustDrag: 2.4,
    dustOpacity: 0.28,
    dustTurbulence: 1.0,
    colorDustA: '#9a8aa6',
    colorDustB: '#6a5a7a',
    colorDustC: '#3e3150',
    colorDustD: '#1c1428',

    /* ================================================================ */
    /* 4 · RIPPLES — the floor answering each ring                       */
    /* ================================================================ */
    rippleSpacing: 2.6, // metres between ripple decals under one ring
    rippleEvery: 3, // only every Nth ring lays ripples (1 = all of them)
    rippleRadius: 0.9, // ripple radius, × the ring's radius
    rippleLife: 1.2,
    rippleWidth: 0.07,
    rippleIntensity: 0.22,
    colorRippleA: '#ffe6f6',
    colorRippleB: '#8e1fe0',

    /* ================================================================ */
    /* 5 · MUZZLE — little rings thrown off the hand per pulse           */
    /* ================================================================ */
    muzzleRings: 3, // RING particles per pulse
    muzzleSize: 0.45,
    muzzleLife: 0.32,
    muzzleSpeed: 2.4,
    muzzleGlow: 2.2,
    colorMuzzleA: '#ffffff',
    colorMuzzleB: '#ffd1f0',
    colorMuzzleC: '#b98cff',
    colorMuzzleD: '#3a2060',

    /* ================================================================ */
    /* 6 · BOOM — the train lands                                        */
    /* ================================================================ */
    boomBurst: 3.4, // AIR shell end radius, metres (inside the domes)
    boomBurstLife: 0.6,
    boomBurstIntensity: 1.5,
    boomBurstOpacity: 0.32,
    colorBurstA: '#ffffff',
    colorBurstB: '#ff6fd0',
    colorBurstC: '#2c0b52',
    shockRadius: 6.5, // SHOCKWAVE decal radius, metres
    shockLife: 0.75,
    shockWidth: 0.07,
    colorShockA: '#ffffff',
    colorShockB: '#8e1fe0',
    floorRadius: 9.0, // how far the floor ripple runs, metres
    floorTime: 1.2, // seconds it takes to get there
    floorRings: 3, // wavelets in the ripple train (capped at 6)
    floorWavelength: 0.85, // metres between them
    floorWidth: 0.14, // width of one wavelet, metres
    floorIntensity: 2.0,
    floorChroma: 0.09, // RGB split across a wavelet, metres
    boomDust: 36, // dust thrown out by the boom
    boomShake: 0.55,
    boomShakeTime: 0.5, // seconds the kick takes to die
    boomFlash: 0.24,
    boomLight: 22, // light punch
    pulseShake: 0.035, // a tick of shake per ring leaving
    colorFlash: '#ffe6f6',

    /* --- the domes: the boom stood on the floor, its echo, and the hum --- */
    boomDomeRadius: 4.4, // metres
    boomDomeTime: 0.32, // seconds it takes to open
    boomDomeLife: 0.55, // seconds it takes to die once open
    boomDomeSpread: 1.2, // half-angle, radians (1.57 = a hemisphere)
    boomEcho: 0.2, // seconds before the echo dome
    boomEchoScale: 0.72, // echo size, × the first
    humRadius: 1.9, // metres — the standing dome left humming over the plate
    humSpread: 1.3,
    humAmp: 0.14, // how far it breathes in and out, fraction
    humRate: 2.6, // breaths per second (the plate's lines pulse with it)
    humDelay: 0.35, // seconds after the boom before it stands
    humBright: 0.85,
    humFill: 0.8, // body fill, × the rings'

    /* ================================================================ */
    /* 7 · CHLADNI PLATE — the floor sorts into the sound's figure       */
    /* ================================================================ */
    plateRadius: 4.6, // metres
    plateModeA: 3, // nodal diameters of the first figure
    plateRingsA: 2.5, // nodal circles of the first figure
    plateModeB: 5, // ...and of the figure it morphs into
    plateRingsB: 3.5,
    plateMorphTime: 1.4, // seconds per morph (it swings back and forth)
    plateLineWidth: 0.16, // width of the sand ridges, in pattern units
    plateGrain: 34, // sand grain frequency
    plateStain: 0.72, // dark stain where the floor shakes
    plateGlow: 2.2, // ridge glow on each beat
    laneWidth: 0.85, // lane half-width, × the rings' end radius
    laneStripe: 0.9, // lane wavelength along the line, metres
    laneAcross: 0, // nodes across the lane (0 = ripples straight across)
    laneStain: 0.62, // dark stain under the lane
    laneLines: 0.5, // strength of the sorted ridges in the lane, × the plate's

    /* --- the light --- */
    lightColor: '#ffd1f0',
    lightIntensity: 5.0,
    lightRadius: 9.0,
    lightThrob: 0.45 // 0..1 how much the light beats with the train
  }
};
