/**
 * Ashen Doppelganger — settings block (data only, no imports).
 *
 * The cast is a zone that never really "lands": the base front runs out to the
 * aimed point in a blink and the whole spell lives in the fade phase, where an
 * ash copy of the caster walks the caster's own recent path `delay` seconds
 * behind them and scorches whatever stands near it every `pulseInterval`.
 *
 * Grouped by layer, in the order the editor shows them. Gameplay keys (the
 * first group) are the ones tests and the combat adapter rely on; every other
 * key is presentation and is read from `settings['ashen-doppelganger']` every
 * frame, so dragging it in the editor changes a cast that is already running.
 */
export const ID = 'ashen-doppelganger';
export const UID = 'matrix-expansion/ashen-doppelganger';

export const CONFIG = Object.freeze({
  id: ID,
  meta: {
    label: 'Ashen Doppelganger',
    accent: '#ff7439',
    element: 'fire',
    key: '',
    cast: 'zone',
    hint: 'An ash echo follows your recent path and periodically scorches nearby foes.',
    glyph: '<circle cx="50" cy="25" r="12"/><path d="M32 78L38 43L62 43L68 78M22 52L37 47M63 47L78 52"/>'
  },
  settings: {
    /* --- the cast ------------------------------------------------------ */
    range: 18, // max aim distance (m) — the echo ignores it, it follows you
    minRange: 0,
    speed: 45, // the base front: effectively instant, the spell is the fade
    lifetime: 5, // nominal; the live length is `duration`
    cooldown: 9,
    castAnim: 'cast2',
    lightColor: '#ff7439', // the light rides the echo, guttering like a coal
    lightIntensity: 5,
    lightRadius: 7,

    /* --- the echo's rules (gameplay) ------------------------------------ */
    delay: 0.8, // seconds the echo walks behind the caster
    duration: 5, // seconds the echo exists after the cast lands
    pulseInterval: 0.8, // seconds between scorching pulses (first at `delay`)
    pulseRadius: 2.4, // metres each pulse reaches from the echo
    pulseForce: 2, // knock-back impulse on a struck body
    pulseLift: 1.2, // upward kick on a struck body
    pulseSpin: 0.4, // tumble on a struck body
    scorchAmount: 0.65, // how far a struck body is charred (0..1, monotonic)
    scorchLook: {
      color: '#38130c', // charred skin
      rimColor: '#ff5b20', // glowing rim of the char
      rimEmissive: 1.2,
      edgeColor: '#ffb04b', // the advancing burn line
      edgeEmissive: 1.6
    },

    /* --- 1 · the echo body (ember-crust shader) -------------------------- */
    echoOpacity: 0.84, // overall opacity of the echo
    formTime: 0.45, // condenses out of ash over (s)
    burnOutTime: 0.9, // crumbles top-down over the last (s)
    fissureScale: 21, // density of the glowing cracks
    fissureSpeed: 2, // how fast heat crawls through them
    crustGrain: 18, // char grain size
    fissureGlow: 1.3, // crack brightness
    rimGlow: 0.42, // silhouette glow
    preheat: 0.25, // seconds before a pulse the body starts to flare
    heatFlare: 1, // extra crack glow at the pulse
    wobble: 0.025, // heat-shimmer sway of the fallback figure (m)
    burnEdge: 0.08, // width of the glowing dissolve edge
    colorCharA: '#060201', // coolest char
    colorCharB: '#330902', // warmest char
    colorFissure: '#ff3005', // crack glow
    colorRim: '#ff7a2a', // silhouette rim
    colorBurnEdge: '#ffc070', // forming / crumbling edge
    rigEmissive: 1.4, // emissive strength on the cloned caster rig
    colorRigBody: '#24100a', // cloned rig base colour
    colorRigEmissive: '#b52805', // cloned rig emissive

    /* --- 2 · ground sigil and pulse ring -------------------------------- */
    sigilOpacity: 0.32, // standing ash circle
    sigilGlow: 1, // brightness of the circle and cracks
    sigilRing: 0.74, // radius of the ring, fraction of pulseRadius
    sigilCracks: 12, // radial crack count
    pulseRingTime: 0.4, // seconds a pulse ring takes to run out
    colorSigil: '#ff2e04',
    colorSigilHot: '#ffb04b',

    /* --- 3 · the fuse (path between caster and echo) --------------------- */
    trailWidth: 0.22, // half-width of the smouldering path (m)
    trailGlow: 1.4,
    trailOpacity: 0.7,
    trailFlicker: 1, // how hard the fuse gutters
    colorTrailHot: '#ff6a1a', // just walked on by the caster
    colorTrailAsh: '#2a0d06', // about to be walked on by the echo

    /* --- 4 · ember column (baked points round the body) ------------------ */
    emberOpacity: 0.8,
    emberRate: 2.4, // rise speed of the column
    emberHeight: 2.2, // column height (m)
    emberSize: 18, // point size at 1 m
    colorEmberA: '#ff1f03', // cool ember
    colorEmberB: '#ffb329', // hot ember

    /* --- 5 · heat haze (screen distortion) ------------------------------ */
    hazeStrength: 0.6,
    hazeWidth: 1.4, // billboard half-width (m)
    hazeHeight: 2.6, // billboard height (m)
    hazeScale: 2.2, // noise frequency
    hazeSpeed: 1.4, // rise speed of the shimmer

    /* --- 6 · particles -------------------------------------------------- */
    moteRate: 26, // embers per second shed by the echo
    moteSize: 0.07,
    moteSpeed: 0.9,
    moteLife: 1.2,
    moteLift: 1.6, // buoyancy
    moteGlow: 2.2,
    colorMoteA: '#fff1c0',
    colorMoteB: '#ff9a2e',
    colorMoteC: '#ff3a08',
    colorMoteD: '#2a0602',
    ashRate: 10, // ash flakes per second
    ashSize: 0.22,
    ashLife: 1.8,
    ashLift: 0.5,
    ashOpacity: 0.55,
    colorAshA: '#4a2a1e',
    colorAshB: '#2c1a14',
    colorAshC: '#1b110d',
    colorAshD: '#0b0807',
    pulseSparks: 34, // sparks thrown on every pulse
    sparkSpeed: 6,
    sparkSize: 0.05,
    sparkLife: 0.45,
    sparkGravity: 9,
    sparkStretch: 0.4,
    sparkGlow: 3,
    colorSparkA: '#fff4d0',
    colorSparkB: '#ffb040',
    colorSparkC: '#ff4a0a',
    colorSparkD: '#3a0802',

    /* --- 7 · pulse and hit beats ---------------------------------------- */
    pulseShake: 0.05, // camera knock on every pulse
    hitShake: 0.16, // extra knock when a pulse strikes a body
    shakeDecay: 9, // how fast the knock settles
    pulseLight: 0.6, // light punch per pulse (× lightIntensity)
    hitFlash: 0.12, // screen flash on a strike
    colorFlash: '#ff8a3a',
    scorchDecal: 0.55, // scorch mark radius (× pulseRadius) left by a pulse
    scorchDecalLife: 2.2,
    shockLife: 0.45, // pulse shockwave decal life
    colorShockA: '#ff5a1c',
    colorShockB: '#ffd08a',
    burstSize: 0.9, // fire shell on a struck body (m)
    burstIntensity: 1.2,
    colorBurstA: '#fff0c0',
    colorBurstB: '#ff7a1e',
    colorBurstC: '#3a0a02',
    collapseAsh: 40, // ash thrown when the echo crumbles
    collapseEmbers: 60 // embers thrown when the echo crumbles
  }
});
