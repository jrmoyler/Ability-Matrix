# Prism Lie — `codex/prismlie`
Illusion (arcane) · line · range 2–18 m (capture ≈ 13.2 m) · ≈ 3.8 s on screen (0.75 travel + 0.42 reveal + 1.6 stand + 1.0 glass)

## Read in one line
Three coloured prisms braid down the line over burnt dark glass; two lies veer off and pop, the true one is driven into the floor and comes back up as a 3 m lit crystal monolith with satellites, throwing a rainbow fan that sweeps the floor, then charges white and shatters.

## Beats
| t (s) | Beat | On screen |
|-------|------|-----------|
| 0.00–0.2 | Anticipation | One white crystal in the hand splits into cyan #3fe6ff / magenta #ff4fd8 / gold #ffd23f (1.5 m prisms). |
| 0.2–0.75 | Travel | Braid down the line at 18 m/s, tethers crackling between them; three 0.16 m spectral streaks on a dark glass band (#0e0a26) burnt under the braid. |
| 0.75–1.17 | Reveal | Lies swerve 2.6 m off the line, stutter, pop into glitter; the truth swings onto the target and flares. |
| 1.17 | Impact (plant) | Crater of crazed glass (2.2 m) with spectral cracks, SHOCKWAVE + CRACK decals, low dust shell, glass chips, shake 0.38, a restrained hued flash 0.12. |
| 1.17–2.77 | Linger | Monolith (chamfered, tapered, twisted crystal, 3.1 × 0.8 m, lit MeshStandard on LAYER.WORLD, shadow) punches up with overshoot and springs back; 6 satellites tear up round it one by one over 1 s, leaning out; two rainbow wedges (6.5 m) sweep the floor at 0.85 rad/s; veins of light climb it; glitter rises. Last 0.45 s: white charge + shudder. |
| 2.77 | Exit (shatter) | 72 spectral shards, rainbow ring 5.5 m, lens, faint AIR shell (opacity 0.2), shock decal, flash 0.14. |
| 2.77–3.8 | Exit | Glass flies and skitters; fan dies in 0.3 s; trails, burn and crater fade. |

## Layers
1. Prisms (additive glass, glitch slices) — `PrismLieMaterials.js#createPrismCrystalMaterial`.
2. Monolith + satellites (hero) — `createPrismMonolithGeometry` + `createPrismMonolithMaterial`.
3. Spectrum fan — `createPrismFanMaterial`.
4. Glass burn + crater (deep tone) — `createPrismScorchMaterial`.
5. Tethers, 6. trails, 7. glitter (SOFT) + sparks (STREAK), 8. instanced shards, 9. ring + lens (DISTORTION) + bursts/decals.

## Signature
What a prism does: the truth stands in the floor and splits white light into a rainbow that sweeps the ground.

## Palette
core #ffffff, tint #d5dbff, body = truth hue (#3fe6ff / #ff4fd8 / #ffd23f), deep #0e0a26 (and hue × 0.12 albedo)

## Gameplay
Engine line hits (DummyField along the line). Unchanged. Fixed: prism hues were never applied (colour keys passed to `getColor` instead of values) — the prisms were white.

## What the capture shows (after)
`sheets/codex__prismlie-sheet.jpg`: f8/f20 coloured braid over a dark band; f40 plant — crater, monolith rising, fan starting; f70 monolith with satellites and a magenta/cyan fan across the floor; f90 shatter with ring. Short: the shatter still shows a faint grey shell dome.
