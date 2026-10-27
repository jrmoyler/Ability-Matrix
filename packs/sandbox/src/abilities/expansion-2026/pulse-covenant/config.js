/**
 * Pulse Covenant — Blood — a self cast. A heart is bound above the caster,
 * its arteries draped to the floor round them. For as long as the covenant
 * lasts, every pair of the caster's *other* casts that strike on the beat —
 * two different casts landing hits `beatSeconds` apart, within `tolerance` —
 * sends a pulse of blood through the enemies near the second hit.
 *
 * Expansion candidate data block: presentation (`meta`) and the live settings
 * the ability and its editor folder read. Plain data, no imports.
 *
 * Gameplay keys (`life`, `beatSeconds`, `tolerance`, `pulseRadius`, `damage`,
 * `maxTargets`) are read when a hit is observed and are pinned by tests;
 * everything else is presentation, resolved every frame.
 */
export default {
  id: 'pulseCovenant',
  meta: {
    label: 'Pulse Covenant',
    accent: '#ff3a55',
    element: 'blood',
    cast: 'zone',
    hint: 'Blood — bind a heart above you; land two different casts on its beat and a pulse of blood tears through the enemies near the second hit',
    glyph:
      '<path d="M50 80C22 61 20 33 34 27C42 23 48 27 50 33C52 27 58 23 66 27C80 33 78 61 50 80Z"/><path d="M10 53H30L37 43L44 62L51 50H89"/>',
  },
  settings: {
    /* --- the cast itself --- */
    aimStyle: 'self', // the aim controller anchors the cast on the caster
    range: 8, // nominal range the aim reticle shows, metres
    minRange: 0.5,
    speed: 100, // metres/second — the covenant binds almost at once
    cooldown: 7, // seconds before the ability can be armed again
    castAnim: 'cast3', // which clip in `CAST_ANIMATIONS` the body throws
    zoneRadius: 3.2, // radius the self-cast reticle shows, metres
    life: 8, // seconds the covenant lasts (gameplay window)
    lifetime: 8, // catalog mirror of `life` for tools that read `lifetime`
    fade: 0.6, // seconds the heart takes to withdraw (× global lifetime)

    /* --- the rhythm (gameplay) --- */
    beatSeconds: 0.6, // the beat two owned hits must land apart
    tolerance: 0.18, // ± seconds either side of the beat that still counts
    pulseRadius: 3.2, // metres round the second hit the pulse reaches
    damage: 0.45, // damage the pulse deals to each enemy it reaches
    maxTargets: 5, // enemies one pulse may reach (bridge cap 8)

    /* --- light (rides the caster; a second light marks each pulse) --- */
    lightColor: '#ff3a55',
    lightIntensity: 4,
    lightRadius: 9,
    lightPunch: 2, // extra intensity punched in by a pulse
    lightThrob: 0.25, // how much the light swells on every heartbeat

    /* --- palette --- */
    heartColor: '#750a22', // the muscle
    arteryColor: '#d91f47', // vessel walls and the veins in the heart
    bloodGlow: '#ff8290', // living blood: boluses, cells, sigil, pulse

    /* ================================================================ */
    /* 1 · THE HEART                                                     */
    /* ================================================================ */
    heartSize: 0.48, // scale of the heart
    heartHeight: 1.5, // metres it hangs above the caster's feet
    formTime: 0.35, // seconds it takes to swell into being
    heartBeat: 0.15, // how much it swells on each beat
    heartSquash: 0.12, // how hard it contracts apex-first
    heartGlow: 1.4, // emissive gain of its veins and rim
    heartFresnel: 1.8, // wet rim
    heartVeins: 1, // how many veins show on its surface

    /* ================================================================ */
    /* 2 · THE ARTERIES                                                  */
    /* ================================================================ */
    growTime: 0.5, // seconds the arteries take to reach the floor
    arteryReach: 1, // radius multiplier of the whole network
    arteryGlow: 1.6, // brightness of the bolus running down them
    arterySwell: 1, // how much the wall swells as the bolus passes
    cellSize: 1, // size of the red cells riding them
    cellGlow: 2, // their glow

    /* ================================================================ */
    /* 3 · THE COVENANT FLOOR — sigil and timing cue                     */
    /* ================================================================ */
    floorRadius: 1.5, // metres the sigil reaches round the caster
    floorGlow: 1.2, // capillaries, rings and pulse front
    floorVeins: 1, // capillary density
    gateRadius: 0.8, // metres — the gate the timing cue contracts to
    cueGlow: 1.6, // brightness of the cue and gate (they flare in the window)

    /* ================================================================ */
    /* 4 · THE PULSE — thrown from the hit that completed the rhythm     */
    /* ================================================================ */
    pulseLife: 0.65, // seconds the ring takes to cross `pulseRadius`
    pulseWidth: 0.35, // band width of the ring, fraction of its radius
    pulseGlow: 2, // emissive gain of the ring
    warpStrength: 0.7, // screen-space push of the passing shell
    impactShake: 0.12, // camera trauma (× global camera shake)
    impactFlash: 0.08, // screen flash (× global explosion intensity)

    /* ================================================================ */
    /* 5 · PARTICLES — one pooled droplet system                         */
    /* ================================================================ */
    dropletCount: 48, // blood droplets thrown by a pulse
    dropletSize: 0.12,
    dropletLife: 0.8,
    dropletSpeed: 2.6,
    dropletColorA: '#fff1e7', // birth
    dropletColorB: '#ff8290', // early
    dropletColorC: '#c11136', // late
    dropletColorD: '#3d0717', // death
    dropletGravity: 6, // how hard they fall
    beatDrops: 6, // beads of blood that jump off the sigil's rim per heartbeat
    beatDropSize: 0.07,
    beatDropSpeed: 1.6, // metres/second they are thrown up
    beatDropLife: 0.7,
  },
};
