# Kraken Crown — `linear-ext/kraken`  ★ reference (§1)
Water · zone (far cast) · range 0–18 m (capture: 12.6 m) · zone radius 4.6 m · ≈ 7.7 s on screen (0.3 surge + 0.3 tear + 5.5 hammering incl. finale + 1.6 withdrawal)

## Read in one line
A slick of black water races to the circle, the flagstones give way into a teal maelstrom, and a ring of nine purple-pink tentacles (plus twelve thin whips) hauls itself out of the rift, rears back over the floor and hammers the centre in a rolling wave of slams — spray, stone and ink at every landing — until all of them rear together for one synchronised slam and are dragged back under.

## Beats
| t (s) | Beat | On screen (shape, size in m, colour, motion) |
|-------|------|----------------------------------------------|
| 0.00–0.30 | Anticipation + travel | Cast flash 0.08 #5fe6dc. The wet surge runs at 42 m/s from the hand (1.22 m), laying dark wet patches (#0a1a20, r 1.1 m, 2 per metre, 8 s life); `rumble` 0.05. |
| 0.30–0.60 | Impact (tear) | `openTime` 0.3 s: the rift tears outward to the boundary — 8.5 m shockwave (#3fd8d0/#e8fffb), 150 spray + 70 ink + 90 stone thrown, shake 0.9 (0.8 s), flash 0.18 #8ff5e6. The arms come up as a **sweep**: nearest the caster first, the wave running round both sides over `sweepTime` 0.7 s (+0.14 s stagger), whips 0.12 s behind. Each arm arrives as a tight **coil** (lean 0.2, curl 5.4 rad) and uncoils over `riseTime` 0.45 s into its idle pose; a breach throws 22 spray + 10 stone. |
| ≈1.3–5.05 | Linger (the hammering) | Every arm runs its own cycle on `smashPeriod` 1.35 s (whips × 0.62), scattered over 85 % of a period so slams arrive as rolling thunder: **rear** 0.38 s (lean −1.3, curl 1.6 — tip poised *behind* the ring) → **whip** 0.19 s (total turn → π + jitter; arm thickens 35 %) → **press** 0.22 s → **peel** 0.45 s, with a 0.22 rad ring-out at 26 Hz on landing. Each landing at the computed centre point: shock ring 0.85 R, dust ring 0.7 R, 26 stone chips, 44 flat spray, 10 ink, camera knock 0.5 (whips × 0.42). Between strikes a travelling wave runs up the arm (idle amplitude 0.55), chromatophore colour bands flood it toward #ff3b5c, biolume veins crawl. The floor: drowned flagstones with lit seams, a 3-arm maelstrom spiral turning 0.1 rev/s, a glyph ring at 0.6 R, swell rings running *inward*, and a curtain of falling spray 1.6 m tall on the rim. Marine snow (90/s) spirals slowly up inside the ring; ink rolls off the rift. |
| 5.05 | Impact 2 (finale) | `finaleLead` 0.75 s before the end every arm ignores its scatter and lands on the same frame: power × 1.7, a 13 m ring, flash 0.26. |
| 5.80–7.40 | Exit | After `withdrawDelay` 0.35 s each arm shortens back into the rift over 0.85 s (+0.4 s stagger), tips last, settling 0.8 m into it; the water closes over them; wet patches linger. |

## Layers
1. **Arms** — `createTentacleGeometry` (`assets/ProceduralGeometry.js`): a straight tube, 44 rings × 12 sides, taper 0.05, muscle swell 1.32 at 17 % up, cross-section flattened 0.85 across the sucker face. Bent entirely in the vertex shader of `materials/KrakenMaterial.js` (`ShaderMaterial`, lit, wet specular 1.5 at gloss 52, fresnel rim #ff6f9c, translucency at the thin end). Skin #7a2f56 / deep #2a0f22, belly #e8b9a8, suckers #f2d8c8 (two rows, 30 cups), biolume #4ff2d8. `abilities/KrakenAbility.js` holds one dice-only record per arm (role, bearing, splay, jitters).
2. **Rift field** — `materials/AbyssFieldMaterial.js` (field shader on a quad re-scaled by `zoneRadius`): water #0e6f7a, edge/seams/throat #7ff5e2.
3. **Spray curtain (veil)** — same file: open cylinder on the rim, ridged noise flowing down, foam #cfeff5 where it tears, ink #070d12 at the foot, droplet glints.
4. **Particles** — ink (`SMOKE`, 153/s, barely buoyant), spray (`SOFT` droplets 180/s, gravity −13), stone debris (`CHIP`, #6b7a7e → #141a1c), marine snow (`SOFT` 90/s, near-neutral buoyancy, swirling 0.55 rad/s).
5. **Floor decals** — wet slick, swell RIPPLE rings 0.8/s, shock & dust rings per slam (`effects/GroundDecals.js`).
6. **World** — light #2ed6c8 (14, r 16) sitting 0.9 m up *in* the water; per-slam shake; tear and finale flashes.

## What the capture shows
_(see the dense pass below; filled from `docs/castables/sheets/linear-ext__kraken-sheet.jpg`)_

## Signature
**Identity in motion**: nothing is ever still — the arms rear, whip, press and peel on their own clocks, and the silhouette is different on every frame until one synchronised slam ends it.

## What makes it the bar
1. **Derived placement — the arc identity.** An arm's centreline is a circular arc when its curvature profile is constant; for arclength `L` turning through `Θ` the tip lands at `inward = L(1 − cos Θ)/Θ`, `up = L sin Θ/Θ`. At `Θ = π` that is `(2L/π, 0)`. So `_armLength = reach · (π/2) · zoneRadius` (reach 1.06) makes every strike land on the centre at *any* radius — drag the footprint mid-cast and the arms still hit the middle — and the CPU gets each slam's impact point for free (no readback) to place its shockwave, debris and spray.
2. **One curvature profile, four poses.** The whole animation is `θ(s) = A·s + C·s² + W·sin(2πfs + φ)·s` (lean, accelerating curl, travelling wave) integrated per vertex with 12 trapezoid steps (`centreAt` in `KrakenMaterial.js`); coil, idle, rear, strike and peel are just different `(A, C, W)` triples blended in time. Positive θ is defined as "inward over the crater", so the smash is a single number (`strikeTurn` = π).
3. **Per-instance strike clocks with scatter, then one synchronised beat.** Each arm's phase = its own period offset (`cycleScatter` 0.85 of a period) so impacts roll; `finaleLead` overrides the scatter for one unison landing at ×1.7 power. Rolling-then-unison is the beat structure to copy for any multi-limb cast.
4. **Born coiled, sweep-ordered.** Arms emerge nearest-first and run round both sides (`|angleDelta(bearing, entry)|/π · sweepTime`) — the crown *closes* rather than appears — and each arrives as a curl that opens, which is what something hauled out of a hole looks like.
5. **The floor is a place, not a decal.** The rift is an ability-owned field quad (re-scaled live by `zoneRadius`) with drowned plates, a warped maelstrom spiral and inward swell rings, plus a rim curtain of falling spray; every slam *also* writes shock/dust rings into it.
6. **Material that moves with the body.** Chromatophore bands travel along `vT` and speed up on a strike, suckers are cell-tiled in the arm's own `(t, angle)` space and roll with the twist — surface detail that animates with the motion rather than sitting on it.

## Palette
core #e8fffb / #4ff2d8 (biolume), tint #7ff5e2 / #ff6f9c (rim), body #7a2f56 / #0e6f7a, deep #2a0f22 / #050d14

## Gameplay
Zone cast; hits are resolved from the published circle by the sandbox's `DummyField` (the ability itself only drives visuals, camera and light). Cooldown 2.2 s.
