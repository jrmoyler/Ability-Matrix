# Combustion Debt — `matrix-expansion/combustion-debt`
Fire · zone · range 2–18 m · zone radius 3.2 m · ≈ 4.2 s on screen (10 m cast, defaults)

## Read in one line
A molten slug is lobbed onto the target and a forged-iron heating coil screws up
out of the floor; it heats one segment at a time while every enemy inside is
branded with a stack of heat debt, then the spring lets go and a combustion
plume calls the whole debt in at once.

## Beats
| t (s) | Beat | On screen (shape, size in m, colour, motion) |
|---|---|---|
| 0.00–0.28 | Anticipation | A 0.5 m molten teardrop swells (outBack) beside the casting hand (1.7 m), white core under a crust of dull slag; embers lift round it. Light gutters at the caster. |
| 0.28–0.70 | Travel | The slug is lobbed (arc 1.6 m) nose-first along its path at 24 m/s, stretched 1.5×, trailing white-to-orange streak sparks. |
| 0.70–1.06 | Landing / rise | Small scorch decal + spark fountain + light knock. The coil **screws up out of the floor** (outBack, 2.4 rad unwind): a conical dome-spring, 3¼ turns of 0.35 m beaded iron tube, outer turn on the 2.9 m circle, tip 2.7 m over the centre. Black iron, lit by the sun, shadowing. The floor scorch spreads from the landing point. |
| 1.17–2.13 | Linger I — the debt accrues | Four ticks, 0.32 s apart. On each: the heat front crawls one segment inward from the buried outer end (white-hot leading edge, red→orange iron behind it with crawling hot spots), the whole coil flares, sparks spray from the front, the camera ticks. The spring **winds down to 55 % height and twists 0.7 rad** as it loads. The floor glows in a spiral under the hot length; voronoi cracks open and brighten toward the centre. Every enemy inside gets a 0.75 m tally ring under its feet with one notch lit per stack (4 notches); past the ignite threshold it pulses fast and burns brighter; its body chars a step per stack. Heat shimmer grows over the dome; embers stream off the hot iron. |
| 2.34 | Impact — the call | One frame: the spring lets go and **overshoots to ~1.6× height**, the tip whips 0.45 m; a 5.6 m lathed combustion plume erupts through the dome (white throat, orange body, red-black crown); a fire ring runs out across the floor to the rim; brief FIRE shell to 2.7 m (0.45 s, 50 % opacity), SCORCH (3.4 m) + CRACK + SHOCKWAVE decals; 90 sparks and 34 molten slag chips fly; 26 smoke puffs; screen flash, camera knock 0.42, light punch 14; brands flare and swell. Debtors with ≥ 2 stacks are thrown away from the coil. |
| 2.34–3.49 | Linger II — cooling | The spring rings and settles (11 rad/s, damping 3.6), the twist unwinds, the plume is eaten from its foot upward by noise and gone by 3.4 s; smoke climbs; the iron cools white → orange → dull red over 1 s, the floor's cracks die to embers. |
| 3.49–4.19 | Exit | The coil sinks back into the floor it came out of (inCubic, 1.2× its height), still faintly red; the scorch dissolves through noise with a glowing edge; decals outlast it. |

## Layers
1. The coil — `createCoilGeometry`/`writeCoil` (320 × 10 tube rewritten in place each frame along a conical dome-helix, forged beads, tip drawn to a point, outer end anchored into the floor) with `createCoilMaterial` (MeshStandardMaterial patched with a heat-front emissive, crawling hot spots, leading edge, tick flare); `LAYER.WORLD`, casts/receives shadows; 2.9 m radius × 2.7 m; iron #2a2220 → full ramp. `geometry.js`, `materials.js`.
2. The hob — floor disc shader (normal-blended scorch #0d0806, heat pooled along the coil's own spiral, F2−F1 cracks, fire ring, noise dissolve), 3.7 m radius. `createHobMaterial`.
3. The plume — lathed column (foot, neck, body, mushroom cap), vertex-turbulated, fbm + ridged flame through the ramp, dissolve eats it bottom-up; 5.6 m × 1.3 m. `createPlumeGeometry`, `createPlumeMaterial`.
4. The slug — lathed teardrop, fresnel slag crust over a white core. `createSlugGeometry`, `createSlugMaterial`.
5. Debt brands — instanced tally rings (≤ 8), one notch per tick, lit per stack. `createBrandMaterial`.
6. Particles — embers (SOFT, curl, off the hot length), sparks (STREAK: flight, ticks, call), smoke (SMOKE, non-additive), slag (CHIP, lit).
7. Impact — FIRE burst, SCORCH + CRACK + SHOCKWAVE decals, flash, shake, light punch; light intensity follows the heat and gutters.
8. Haze — `LAYER.DISTORTION` disc over the dome: shimmer ∝ debt, pressure ring at the call. `createHazeMaterial`.

## Signature
The spring that loads: a solid iron coil that visibly fills with heat segment by segment and winds tighter with each tick of debt, then springs past its rest and vents everything at once.

## Palette
core #fff3d6, tint #ffb347, body #ff4a0c, deep #3a0703 (iron #2a2220, scorch #0d0806)

## Gameplay
- `ticks` (4) heat ticks at fixed times after landing; each adds one stack to every enemy within `zoneRadius` (≤ 8 debtors). Through the combat binding each tick is a UCSM `status` (fire → `burning`, intensity `burnIntensity × stacks`, ≤ 3); on the sandbox dummies it is `Dummy.corrode` (`charPerStack` per stack).
- The call lands when the coil is hot to the tip, or early — **foreclosure** — once the total stacks in the zone reach `debtCap` (12), `foreclosureDelay` after that tick.
- At the call every debtor with ≥ `igniteThreshold` (2) stacks is hit exactly once: UCSM `hit`, damage `stacks × damagePerStack` ≤ `maxDamage`, `hitForce` from `impactForce` scaled by `1 − stackForce + stackForce × stacks/ticks`; on dummies `kill` away from the coil centre with the same scaling. A UCSM `terrain-impact` disc leaves burning ground for `groundBurn` s (no-op in standalone). Debtors under the threshold are forgiven.
- Debt follows the debtor: a branded enemy that walks out of the zone still pays at the call (its brand goes with it).
- Interpretation: "heat accumulation" is implemented as per-target stacks on the existing dummies / UCSM actors; there are no projectiles or allies involved. `handlesOwnHits` is true; hit timing is independent of reduced motion (which only stills the coil's turn, ringing and whip and the haze).
