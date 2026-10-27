# Winter's Borrowed Breath — `matrix-expansion/winters-borrowed-breath`
Frost · zone · range 2–18 m · zone radius 3.4 m · ≈3.5 s on screen (0.32 s gather + ~0.5 s travel at 8 m + 1.85 s linger + 0.9 s exit, × `global.lifetime`)

## Read in one line
A coiling plume of frost breath arcs onto the target and curls into a decelerating cyclone; every bit of speed it loses peels off as a faceted ice scale that locks into a carapace over the zone, the bodies it threw hang rimed in the air inside it, and when the cyclone stops the armour is flung outward as the breath is given back.

## Beats
| t (s) | Beat | On screen (shape, size in m, colour, motion) |
|---|---|---|
| 0.00–0.32 | Anticipation | Frost motes (SOFT, 0.07 m) spiral into the caster's hand at 1.45 m; the plume's mouth swells from 0.14 to ~0.34 m radius; a pale ring (zone edge, r 3.4 m) pulses on the floor at the target. |
| 0.32–~0.8 | Travel | The plume (tube, 0.14 → 0.42 m radius, coiling ×3.2 turns) runs down the line at 16 m/s, arcing from hand height to 0.55 m over the zone, a bright swelling head; fbm vapour white-blue → deep navy. |
| ~0.8 | Impact (the gust) | FROST shell 0.34 → 3.6 m, FROST decal r 3.7 m, SHOCKWAVE ring, 43 lit ice chips, light punch +5, camera knock 0.2, pale flash. Rime runs out from the centre to 4.25 m in 0.5 s. Standing enemies in the circle are thrown up and out. The cyclone unrolls in 0.22 s: two helical breath ribbons, 3.9 m wide at the floor, 2.25 turns, up to 3.3 m tall. |
| ~0.8–2.15 | Linger 1 — velocity → armour | The cyclone decelerates ((1−τ)^1.3) from 9 rad/s to rest and is drawn in from 1.15R to 0.55R; its streaks visibly slow, it sheds vapour (SMOKE, inward swirl) and ice needles (STREAK) at its speed. Plates peel off the ribbons and spiral in along the spin (0.42 s flight, tumbling, growing from 35 %) to seats on a 3.4 m × 2.65 m carapace, foot row first — 22, 19, 16, 13, 9 plates — each flashing white as it seats. Thrown bodies are braked in mid-air and hang ~1 m up, slowly orbiting, rimed pale blue. The floor's spiral breath streaks turn with the cyclone and tighten as it slows. |
| 2.15–2.65 | Linger 2 — hold | The cyclone is gone; the complete (or crown-open, if little was borrowed) carapace breathes in a wave round and up it (±4 %), and glowing cracks climb it row by row from the foot. |
| 2.65–3.55 | Exit (the return) | Every plate is thrown out along its seat normal (6.5 m/s ± seed) and up (3.2 m/s), tumbling at 7 rad/s, falling under 9.8 m/s² to lie on the floor while it dissolves through noise with a white edge. Held bodies are released and flung. A second FROST shell to 4.6 m, CRACK decal r 3.6 m, SHOCKWAVE r 5.1 m, chip sprays all round, knock 0.34, flash, light +8, a pressure ring in the lens. The rime breaks up through a dissolve; the FROST and CRACK decals stay a little longer. |

## Layers
1. The plume — authored tube (`createPlumeGeometry`), laid down the cast line, coiled and swollen in the vertex shader; `createPlumeMaterial` (fbm vapour, flow streaks, fresnel, bright head, [tail, head] window), additive. `geometry.js`, `materials.js`.
2. The cyclone — two interleaved helical ribbons stored as parameters (`createRibbonGeometry`), wound round the zone in the vertex shader; `createRibbonMaterial` with streaks scrolled by the integrated spin, opacity = velocity left. Additive.
3. The carapace (hero) — up to 79 instanced faceted ice lamellae (`createPlateGeometry`: kite outline, scalloped head, knapped inner ring, keel apex, shallow back, bent across its width; non-indexed for flat facets). `createIceMaterial`: opaque, lit (wrapped sun, sky/ground ambient, Blinn glint, fresnel rim, refracted cloudy interior), per-instance seat flash, voronoi crack network and noise dissolve. `LAYER.WORLD`, casts shadows. Seat, plate width/length and row spacing derived from `zoneRadius`/`domeHeight` each frame.
4. The return — the same plates on ballistic arcs with tumble; second FROST shell; CRACK + SHOCKWAVE decals.
5. The floor — `createFieldMaterial`: voronoi frost plates with bright edges, ridged hoarfrost, spiral breath streaks turning with the cyclone, a deep-blue stain, telegraph ring, jagged growing front, dissolve; plus the engine's FROST decal (r 1.1R).
6. Particles — `wintersBorrowedBreath.vapour` (SMOKE, swirl + curl, contracts inward), `.needles` (STREAK), `.chips` (lit CHIP, normal blend), `.motes` (SOFT, swirl into the hand).
7. Bursts, shake, flash, light — on the gust and on the return, × `explosionIntensity` / `cameraShake`.
8. The lens — `createLensMaterial` on `LAYER.DISTORTION`: cold swirl ∝ cyclone speed, a pressure ring on the return.

## Signature
Velocity becomes armour you can watch: the cyclone's spin visibly runs down while the same amount of motion appears as ice scales locking into a carapace — and bodies caught in the breath are stopped dead in mid-air to pay for more of it.

## Palette
core #f4fbff, tint #bfe8ff, body #3f9fe6, deep #0a2457 (ice: #78c3ee body, #0e3166 depth, #e8f9ff rim)

## Gameplay
- **Exhale** (impact): every enemy inside `zoneRadius` is struck once (`hitImpulse/hitLift/hitSpin` × explosion intensity, outward from the centre). In live combat this is a UCSM `frost` hit through the expansion binding, which also lays `chilled`.
- **Velocity → armour** (linger, deterministic and bounded): the cyclone's speed fraction is `(1 − τ)^1.3` over `inhaleTime`; it mints `floor(breathArmor × 79 × (1 − v))` plates (breathArmor 0.8 → 63 plates with no bodies; the crown row stays open). Any body down inside 1.15 × `zoneRadius` (up to 12) is held: each 1/60 s `brake` of its velocity above a slow holding current is taken, buoyancy carries its weight, and the speed taken accrues in an armour bank capped at `velocityPerPlate × 79`; every `velocityPerPlate` m/s mints one more plate (total ≤ 79). Armour `A` = plates / 79.
- **Return** (exit): held bodies are released and thrown outward; every enemy inside `zoneRadius` is struck once more with `returnImpulse/returnLift` × (0.5 + A) × explosion intensity (clamped to the bridge bounds), intensity 1 + A.
- Each enemy can be struck at most twice per cast, each strike capped at 16 targets; `handlesOwnHits` is true; with no combat binding the cast falls back to `ctx.dummies.findTargets` + `dummy.kill`.
- Interpretation: the sandbox has no projectile or ally-velocity query, so the "velocity" winter borrows is the cast's own cyclone spin and the measured ragdoll velocity of bodies in the zone (including those the gust itself threw, and any thrown there by other casts); "armour" is the carapace, whose amount is the return blow's multiplier. It does not shield the caster.
- Reduced motion (`prefersReducedMotion`): spin, plate spiral, breathing and the lens are damped or held; hit timing is unchanged.
