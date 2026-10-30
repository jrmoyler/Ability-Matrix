# Umbral Guillotine — `codex/umbral`
Shadow · line · range 2–18 m · no zone (chop takes 2.3 m) · ≈4.0 s on screen at a 13 m cast (0.45 form + ≈1.2 swing travel at 10 m/s + 0.3 rear + 0.14 chop + 0.6 buried + 1.4 exit)

## Read in one line
A knot of shadow opens over the line, a crescent headsman's blade of black obsidian with a white-violet razor edge forms on a chain beneath it and swings side to side across the line as the knot rides down it, scoring a glowing slash into the floor at the bottom of every stroke — then it rears and chops into the target, splitting the floor, and a pool of veined shadow spills out round the buried blade, violet wisps and black smoke rising off it while the blade sinks into it.

## Beats
| t (s) | Beat | On screen |
|---|---|---|
| 0.00–0.45 | Anticipation | 4.0 m ahead of the caster a spiked violet knot (0.55 m) opens at 4.5 m; a rod drops from it and the crescent (≈3.1 m across, 1.55 m radius) forms out of in-drawn black smoke, drawn back ≈1.0 rad to one side. Fully in the 8 m chase shot (the pivot and the drawn-back horn sit under the frame top). |
| 0.45–≈1.6 | Travel (swing) | The blade swings ±0.95 rad (6.6 rad/s) while the knot advances at 10 m/s. A violet smear trails the edge; at each low pass (edge 0.65 m off the floor) sparks spray sideways and a **2.8 m glowing slash** (0.3 m wide, black void, violet lips) is cut across the line and stays. Bodies the edge meets are cut and thrown the way it swings. |
| ≈1.6–1.9 | Rear | At the target it rears to 1.3 rad (≈level, under the frame top). |
| ≈2.05 | Impact (chop) | Down in 0.14 s, edge first, 0.4 m into the floor: a 6 m × 0.76 m gash tears open across the line (black void, violet lips with a white hot line), violet AIR shell, a dimmed violet shockwave (6.5 m), 170 sparks, knock 0.75, faint violet flash, light punch. Everything within 2.3 m is thrown off the blade's faces. |
| ≈2.05–2.65 | Linger | A **shadow pool** spills out of the gash in 0.5 s to ≈3.2 m: near-black with a mottled bruise body, violet veins swirling inward toward the blade, a crawling tendril lip that pulses. Violet wisp streaks (300/s) and black smoke (50/s) rise off it, thickest along the gash. The buried blade flares then stands. |
| ≈2.65–4.05 | Exit | The blade dissolves on a burning lip while **sinking 1.6 m into the pool**; the wisps thin; the pool, the gash and every slash erode in patches. |

## Layers
1. Blade — extruded crescent (`UmbralGuillotineGeometry`), `createBladeMaterial`: obsidian #06040c, bruise #2a1660, temper/rim #9a7aff, razor edge #f2ecff.
2. Swing — tether + spiked anchor billboard (`createTetherMaterial`, `createAnchorMaterial`).
3. Smear — annular sector behind the edge (additive) + twin on `LAYER.DISTORTION`.
4. Chop — AIR burst, SHOCKWAVE, CRACK decal, STREAK sparks, shake, flash, light.
5. Cleft & slashes — `createCleftMaterial` (one for the chop, a pool of 10 for the low-pass slashes, each with its own length/width/glow); lips ramp violet → white only on the hottest line.
6. Smoke & sparks — non-additive SMOKE, additive STREAK.
7. Shadow pool — `createShadowPoolMaterial`, ground quad sized `chopRadius × poolScale`, normal-blended so it eats light.
8. Wisps — additive SOFT `umbral.wisps` (#f1eaff / #a88cff / #5a2fd0 / #1a0840) + pool smoke.

## Signature
A crescent guillotine on a chain that swings across the line face-on, leaves a row of glowing cuts, and drowns its own blade in a pool of shadow.

## Palette
core #f2ecff (edge, lip line) · tint #b49cff / #a88cff · body #6a40ff / #5a2fd0 · deep #24104f / #06040c / #030108

## Gameplay
Unchanged rules: same `_cutPass` / `_chop` code, hit keys and timing (`speed`, `formTime`, `raiseTime`, `dropTime`, `embedHold`, `lifetime`, `cooldown`). The swing geometry was lowered to stay in shot (pivot 6.4 → 4.5 m, arm 5.75 → 3.85 m — the edge's clearance at the bottom of the swing is the same 0.65 m), the knot starts 4.0 m out instead of 1.4 m, the form wind-up is 8 % instead of 18 %, and the rear-up is 1.3 rad instead of 1.9.

## New settings (presentation)
`slashLength`, `slashWidth`, `slashGlow`, `poolScale`, `poolSpread`, `poolSwirl`, `poolVeins`, `poolGlow`, `poolOpacity`, `bladeSink`, `wispRate`, `wispSize`, `wispSpeed`, `wispLife`, `wispGlow`, `poolSmokeRate`, `colorPoolDeep`, `colorPoolBody`, `colorPoolVein`, `colorWispA–D` (23).
