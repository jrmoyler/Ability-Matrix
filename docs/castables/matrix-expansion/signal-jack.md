# Signal Jack — `matrix-expansion/signal-jack`
Tech · zone · range 2–16 m (capture: 11.8 m) · zone radius 4.5 m · ≈ 4.3 s on screen at 11.8 m (travel 0.4 s + plant/jack/turn 3.0 s + exit 0.9 s)

## Read in one line
A machined jack spike is thrown drill-first into the circle, bites the floor with four silver claws and raises a jammer dish. Armoured cables whip from its head into the backs of the nearest enemies, and each jacked body turns and shoots a magenta bolt into an enemy that is not jacked. Then the signal overloads and blows the jacked off their feet, and the rig folds and sinks into the floor.

## Interpretation of "hostile deployable takeover"
The sandbox has no enemy deployables (only the CPU wizard's casts, which this must not depend on). So the **enemies themselves are the hostile hardware**. The spike is our deployable. It jacks up to `maxJacks` target dummies, and the jacked bodies fire on their own side before they burn out.

## Beats
| t (s) | Beat | On screen (shape, size in m, colour, motion) |
|---|---|---|
| 0.00–0.40 | Anticipation + travel | A landing reticle closes in on the floor at the target (four brackets plus a cross; magenta on the dark footprint at 55 % opacity). The spike, at 0.55 → 1.0 scale, flies tip-first along a closed-form arc: from 1.5 m at the hand, peaking 2.2 m above the chord, to 0.7 m over the target. It spins 22 rad/s about its axis and sheds STREAK sparks at 90 per second. |
| 0.40 | Impact (plant) | The spike drives the last 0.7 m into the floor in 0.09 s and rights itself. A CRACK and SCORCH (r 1.5 m), a DUSTRING (3.2 m), an AIR shell (to 2.4 m), 70 sparks, 40 lit metal chips and 26 lit dust puffs. Shake 0.45, flash 0.1 in #ff8ad8, light punch 6, and a lens pressure ring. |
| 0.43–0.75 | Deploy | Four extruded claws (reach 0.36 R ≈ 1.6 m) spring from folded (1.95 rad) to planted with outBack. Their hinge height is derived (0.42 × reach), so the tips meet the floor at any radius. The mast telescopes 1.0 m and the 1 m parabolic dish unfolds (outBack) and sweeps at 9 rad/s. The circuit traces race out to the rim (1.08 R) in 0.75 s with a hot ragged front. |
| 1.00–1.40 | The jack (travel 2) | Up to 3 cables (r 0.1 m, armoured collars) whip from the head to the nearest bodies, staggered 0.1 s and 0.26 s in flight. They lash sideways 0.9 m, sag on a quadratic catenary and seat lathe jack plugs in the bodies' backs at 1.3 m, with a spark spit. Each jacked body lights a scan sheath (0.55 × 2.1 m, scanlines sweeping down) and a spinning hexagonal halo at 2.25 m. Bus routes (three lanes) light across the floor to it. |
| 1.40–2.85 | Linger (the turn) | The dish slews from body to body. Packets run down the cables at 3.2 per second and data motes rise off them. On its own clock (1.2 s + 0.38 s × i after the plant), each jacked body fires a turncoat bolt: a 0.11 m volume beam with dashes and a hot head, 0.32 s. It hits the nearest enemy that is not jacked (≤ 7 m, possibly outside the circle) and throws it **away from the traitor**. Each bolt brings a SCORCH under the victim, a spark burst, a knock, a light punch and a claw kick. |
| 2.85 | Impact 2 (overload) | A white front runs down every cable. Each jacked body is blown away from the spike (impulse 6, lift 6.5), with an ARC burn and sparks and chips. A STORM shell (to 0.9 R) and a SHOCKWAVE (1.1 R), the EMP ring on the field and the lens, shake 0.6, flash 0.2, light punch 10. The seams dim: the rig is spent. |
| 3.40–4.30 | Exit | The cables reel home off the fallen bodies (0.35 s). The dish folds and the mast drops. The claws fold up (0.35 s), the spike sinks back into the floor (0.5 s, inCubic) and the field dissolves through noise. The crack and scorch stay for 5 s. |

## Layers
1. **Jack spike (hero)**: a custom lathe in `geometry.js#createSpikeGeometry`. Its radius is a function of height *and* angle, so the drill carries a real helical thread. It has a flanged collar, a grooved leg hub, a ribbed column and a mast socket, 2.7 m tall and girth ×1.9. Lit gunmetal `MeshStandardMaterial` (#8a929e, metal 0.88) is patched with lathe banding in roughness and magenta seams that throb with the signal (`createMetalMaterial`). WORLD layer, casts and receives shadows.
2. **Claws**: extruded hooked outlines with a lightening slot and a bevel (`createClawGeometry`), in the same metal, on hinge pivots.
3. **Mast, dish, feed**: anodised and gunmetal tubes, a closed-shell parabolic dish with a rolled lip (`createDishGeometry`), and an accent eye (`createAccentMaterial`).
4. **Cables and plugs**: tubes swept on the CPU along the catenary every frame. The material is armoured rubber with collars, packet pulses and an overload front (`createCableMaterial`). The lathe jack plugs have glowing collars.
5. **Possession**: a scan sheath (`createSheathMaterial`) and a hex halo (`createHaloMaterial`) on each jacked body.
6. **Turncoat bolts**: additive volume beams on N·V with dashes and a travelling head (`createBoltMaterial`).
7. **Intrusion field**: a normal-blended deep footprint. It carries Manhattan circuit traces in world metres, growing from the spike with packets running outward, bus routes to the jacked, the landing reticle, the EMP ring and a noise dissolve (`createFieldMaterial`).
8. **Particles**: STREAK sparks, lit CHIP metal, lit SMOKE dust and SOFT data motes (`expansion.signal-jack.*`).
9. **Plant and overload**: CRACK, SCORCH, DUSTRING, SHOCKWAVE and ARC decals, AIR and STORM shells, flash, knock and light punches.
10. **Lens**: heat shimmer at the spike while it runs, plus the plant and EMP pressure rings, on `LAYER.DISTORTION` (`createLensMaterial`).
11. **Light**: #ff4fb4, 9, r 11.

## Signature
**Cables strung from a planted machine into enemy bodies, which then shoot their own side.** The silhouette is a tall lit-metal mast with a dish, and catenary cables hang from it into the crowd.

## Palette
core #fff0fb, tint #ff8ad8, body #e0177f, deep #1c0614. Metal is #8a929e with anodised #1b1d22.

## Gameplay
`handlesOwnHits`, bounded and deterministic:
- **Jack** (at `jackAt`): up to `maxJacks` (≤ 4) nearest alive enemies within `zoneRadius`. With live combat on, they also take a `tech` status for the takeover window.
- **Turn**: each jacked body, once, at `turnAt + i·turnStagger`, picks the nearest alive enemy within `turnRange` of itself. That enemy must not be jacked and must not already be chosen by another bolt. It lands one hit (damage `turnDamage`) when the bolt head arrives, thrown along traitor → victim. If there is no legal victim, there is no shot.
- **Overload** (at `overloadAt`): each jacked body takes one hit (`overloadDamage`), thrown along spike → body.
- The bound is ≤ 2·maxJacks hits per cast, and no body is hit twice. Hits go through `bindExpansionCombat`: attributed UCSM hits, the standalone fallback, or `dummy.kill` when no bridge is present. Cooldown 7 s.
