/**
 * Temporal Mortgage — time, zone cast. Data only, no imports.
 *
 * Speed, borrowed against the cast's own future and paid back exactly. A
 * wound mainspring is thrown to the target; on landing it lets go and its
 * outer limb lashes once round the circle at `borrowRate` × normal speed,
 * striking every enemy it passes. Then the loan falls due: a winding key on
 * the arbor turns the spring back up, ratchet click by ratchet click, while
 * the circle runs at `repayRate` × speed. The recovery lasts exactly as long
 * as it takes for the cast's clock to stand level with real time again —
 * `(borrowRate − 1) · borrowTime / (1 − repayRate)` — and how far the spring
 * stands open is, at every frame, the outstanding balance.
 *
 * Every key below is a live editor control. Gameplay keys (range, radius,
 * borrow/repay, force) are first; the rest are craft.
 */
export default {
  id: 'temporalMortgage',
  meta: {
    label: 'Temporal Mortgage',
    accent: '#7fd0ff',
    element: 'time',
    cast: 'zone',
    hint: 'Time — a mainspring lashes the circle at borrowed speed, then is wound back while time repays the loan',
    glyph:
      '<path d="M50 50m0-5a5 5 0 1 1-5 5a10 10 0 0 1 10-10a15 15 0 0 1 15 15a20 20 0 0 1-20 20a25 25 0 0 1-25-25a30 30 0 0 1 30-30a35 35 0 0 1 35 35"/><path d="M85 50l8 6M50 50l-6-18"/>',
  },
  settings: {
    /* --- the cast --- */
    range: 16, // max cast distance (m)
    minRange: 2,
    speed: 26, // the wound spring flies to the target at (m/s)
    cooldown: 4,
    castAnim: 'cast2',
    zoneRadius: 3.4, // the lash's reach = strike radius (m)
    lifetime: 3.4, // nominal cast length, for the HUD (s)

    /* --- the loan (gameplay) --- */
    borrowTime: 0.7, // real seconds the spring runs fast (× global lifetime)
    borrowRate: 2.4, // the cast's clock runs this many times fast while borrowing
    repayRate: 0.35, // and this fraction of speed while repaying (< 1)
    sweepTurns: 1, // turns the outer limb lashes round the circle while borrowing (≥ 1 covers it all)
    hitImpulse: 14, // knockback along the lash (m/s, × explosion intensity)
    hitLift: 5,
    hitSpin: 4,
    tangentPush: 0.8, // share of the knock along the sweep (rest is outward)
    debtStatus: 1, // 1: struck enemies carry the 'delayed' status for the repayment (combat on)

    /* --- anticipation & the throw --- */
    chargeTime: 0.22, // the spring winds tight in the hand before it leaves (s, × lifetime)
    handHeight: 1.3, // hand height (m)
    handForward: 0.55, // hand ahead of the caster (m)
    travelScale: 0.14, // spring size in flight (× full size)
    travelArc: 1.3, // extra height at the top of the throw (m)
    travelSpin: 14, // rad/s it spins in flight
    trailCount: 3, // sparks shed every 30 ms of the flight
    landTime: 0.12, // s the spring takes to grow to full size on landing

    /* --- 1 · the mainspring (solid blued steel) --- */
    bandHeight: 0.4, // band height (× zone radius) → ~1.4 m standing
    bandThickness: 0.1, // band thickness (m)
    arborShare: 0.12, // inner end of the band (× radius)
    tightOuter: 0.3, // outer radius when fully wound (× radius)
    openOuter: 0.97, // outer radius when fully let go (× radius)
    tightTurns: 4.6, // coils when wound
    openTurns: 1.6, // coils when let go
    hookCurl: 0.5, // the outer end curls back into a hook (rad)
    hookShare: 0.05, // length of the hook (fraction of the band)
    bandWave: 0.06, // the band ripples in height as it lashes (× height)
    steelColor: '#2b4f86', // blued steel
    steelDeep: '#0a1230', // the inner, unstressed coils
    steelMetalness: 0.9,
    steelRoughness: 0.28,
    steelEmissive: '#0d3a70',
    steelGlow: 0.35, // emissive under stress (× debt)

    /* --- 2 · the stress glow (shader over the band) --- */
    stressGlow: 1.6, // brightness of the stress light running along the band
    stressFresnel: 2.4, // rim sharpness
    stressPulses: 7, // pulses along the band
    stressSpeed: 3, // pulses run at (× the cast's clock)
    edgeGlow: 2.2, // the hot top edge of the band

    /* --- 3 · the arbor, ratchet, pawl and key (solid) --- */
    arborHeight: 0.55, // arbor post height (× radius)
    arborWidth: 1, // arbor thickness scale
    ratchetTeeth: 24, // teeth on the ratchet (rebuilt on change)
    ratchetSize: 0.2, // ratchet radius (× radius)
    keySize: 0.28, // winding key bow (× radius)
    keyTurns: 3, // key turns while the loan is repaid
    repayTicks: 9, // ratchet clicks during the repayment (instalments)
    tickSnap: 0.3, // share of each instalment spent snapping (0 = smooth)
    pawlKick: 0.35, // pawl lift on a click (rad)
    ironColor: '#1a2233', // arbor, ratchet and key iron
    ironRoughness: 0.42,

    /* --- 4 · the ledger (floor) --- */
    floorGlow: 1.4,
    floorOpacity: 0.85,
    groovePitch: 1, // spiral grooves on the floor (× the spring's own pitch)
    sweptGlow: 1.2, // the sector the lash has already swept stays lit
    debtInk: 0.8, // dark ink that creeps back as the debt is repaid
    floorGrain: 1, // fbm grain in the ledger
    floorFlow: 1, // grooves run at (× the cast's clock)
    dissolveTime: 0.8, // fraction of the exit spent dissolving

    /* --- 5 · the speed smear --- */
    smearGlow: 1.8,
    smearOpacity: 0.75,
    smearLength: 2.2, // rad behind the tip at full borrowed speed
    smearHeight: 1.1, // × band height
    smearStreaks: 18, // vertical streaks in the smear

    /* --- 6 · particles --- */
    sparkRate: 120, // sparks per second from the lashing tip
    sparkSize: 0.07,
    sparkLife: 0.45,
    sparkSpeed: 4,
    sparkGlow: 1.6,
    colorSparkA: '#f2fbff',
    colorSparkB: '#a8e6ff',
    colorSparkC: '#2a8fd6',
    colorSparkD: '#0a1230',
    hitCount: 26, // sparks thrown where the lash strikes a body
    clickCount: 10, // steel filings at each ratchet click
    clickSize: 0.06,
    clickLife: 0.5,
    moteRate: 40, // time motes hanging in the circle (per second, × the cast's clock)
    moteSize: 0.09,
    moteLife: 1.2,
    moteRise: 0.6, // m/s at normal speed
    landCount: 48, // dust thrown when the spring lands

    /* --- 7 · impact & settlement --- */
    landShake: 0.22, // camera knock on landing (× explosion intensity, × camera shake)
    landFlash: 0.1,
    landLight: 6, // light punch on landing
    hitShake: 0.06, // a knock per body struck
    clickShake: 0.02, // a tick per instalment
    settleFlash: 0.08, // the loan is paid: a cold flash
    settleLight: 4,
    burstReach: 0.9, // landing shell grows to (× radius)
    burstLife: 0.45,
    burstIntensity: 0.8,
    burstOpacity: 0.55,
    burstFresnel: 2.2,
    burstSquash: 0.35,
    colorBurstA: '#ffffff',
    colorBurstB: '#7fd0ff',
    colorBurstC: '#16306a',
    decalLife: 2.6, // landing crack and shock last (s)
    crackIntensity: 0.9,
    shockwaveWidth: 0.05,
    shockwaveIntensity: 1,
    rippleIntensity: 0.6,
    shakeDecay: 6,
    shakeFrequency: 20,

    /* --- 8 · exit --- */
    exitTime: 0.7, // s the paid-off spring sinks and dissolves (× lifetime)
    sinkDepth: 0.9, // sinks this far (× band height)

    /* --- 9 · the lens --- */
    lensStrength: 0.7, // time-shear swirl, signed by the clock's rate (× global distortion)
    lensShock: 0.8, // pressure ring on landing

    /* --- light --- */
    lightColor: '#7fd0ff',
    lightIntensity: 6,
    lightRadius: 10,
    lightHeight: 1.2, // m above the floor (inside the coil)

    /* --- palette (four-stop ramp) --- */
    coreColor: '#f2fbff',
    tintColor: '#a8e6ff',
    bodyColor: '#2a8fd6',
    deepColor: '#0a1230',
  },
};
