# Sling Volley — `codex/slingvolley`
Motion · line · range 2–18 m · no zone · ≈ 2.7 s on screen (≈0.37 s travel at 36 m/s for a 13 m cast + 1.05 impact + 1.25 fade)

## Read in one line
A leather sling whirls flat over the fist and six lit, chiselled lemon-shaped stones fly out on low staggered arcs, each slamming into the floor on its own strike point, skidding, and spinning on in a cracked crater like a spun bottle until it slows, rocks, beds in and crumbles.

## Beats
| t (s) | Beat | On screen |
|---|---|---|
| 0.00–0.32 | Anticipation | Over the throwing shoulder, 0.75 m out to the caster's side and 2.1 m up, a thick dark leather cord (#3a2216) whirls at 26 rad/s, radius 1.05 m, its plane tipped 0.55 rad toward the side and the camera, a stone riding in its pouch, under a smear disc; it folds away after 0.4 s. |
| 0.00–0.37 | Travel | `count` (6) stones, each 1.0 m long (half-length 0.5 ± 22 %), fly from the hand on flat arcs (apex up to 1.6 m) to their strike points staggered down the line and ±1.1 m across it, spinning flat at 30 rad/s with comet smears behind both tips and grit streaks shed. Flight is solved back from each part's strike time, so the near stones land first. |
| on each landing | Impact (×6) | The stone touches down 0.45 m short of its strike point with a hop (0.35 × size), skids 0.9 m; a dark scorched-rock crater (r ≈ 0.85 m, near-black) with a heaped lip, the gouge and thin ember cracks opens; faint engine CRACK decal, dark dust ring (1.6 m), 14 chips, 10 dust puffs, 0.16 camera punch, light +2.2. Bodies in reach are thrown along the line. |
| ≈0.37 | Impact (end) | The template's end beat: shake 0.5, flash 0.1, light punch 8.8, low dust shell, SCORCH residue. |
| 0.4–2.0 | Linger | Each stone keeps spinning in its crater, slowing over 1.5 s; as it slows it rocks harder about its long axis (0.42 rad); the smear fades with the spin, dust is kicked off the tips; cracks and tips cool from white-hot through ochre to rust over 0.75 s. |
| 1.85–2.7 | Exit | From 45 % into the fade the stones bed into the floor (0.75 × height) and crumble on noise with hot bite edges; the crater field erodes raggedly from 50 %; the crack decals outlive the cast (4.5 s). |

## Layers
1. Sling cord — `createSlingCordGeometry` (tube, in the ability file), MeshStandardMaterial leather, `LAYER.WORLD`, shadow.
2. Stones — `createSlingStoneGeometry` (chiselled glans, in the ability file), `createSlingStoneMaterial` (lit ShaderMaterial, instanced, ramp #fff1e4 → #ffc49a → #6e2c1a → #110705, hairline noise cracks glowing with heat), `LAYER.WORLD`, cast shadows.
3. Spin blur — `createSlingBlurMaterial`, instanced horizontal discs, two comet arms per stone, strength = spin left.
4. Crater floor — `createSlingCraterMaterial`, one plane over the strip with up to 12 landings: bowl, lip, gouge, scuff disc, glowing cracks; normal blending; erodes.
5. Engine decals — CRACK per landing (outlives the cast), DUSTRING per landing, SCORCH + DUSTRING at the end beat.
6. Particles — lit CHIP fragments, SMOKE dust, streak grit, SOFT motes.
7. World — per-landing shake + light punch, end-beat shake, flash, light, the lens distortion (0.35).
Template body arcs, voice, floor grid, rig, pieces and trail are off by default (sliders kept).

## Signature
The stones arrive still spinning: every one is a little top on the floor, winding down at its own pace, so the linger is six things slowing down rather than one thing fading.

## Palette
core #fff1e4, tint #ffc49a, body #6e2c1a (stone) / #fa5838 (light, smear), deep #110705

## Gameplay
Unchanged: `handlesOwnHits`, `WHEN = 'part'` — part *i* strikes its point (`(i+0.5)/n` along the line, lane ±`sweep`) when the front passes it; the stone's touchdown is timed to that strike. Bounded by `count` ≤ 12.
