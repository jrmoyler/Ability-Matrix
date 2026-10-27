# Prism Choir — `matrix-expansion/prism-choir`
Crystal · line · range 2–20 m · split reach 6 m · ≈ 2.8 s after the lance arrives (+ travel at 20 m/s)

## Read in one line
A 2.8 m quartz lance flies the line dragging a comet of caustic light, shatters into three spectral shards that fan out, and where each lands a cluster of organ-pipe crystals in its colour bursts from the floor and rings like a chord before sinking away.

## Beats
| t (s) | Beat | On screen (shape, size in m, colour, motion) |
|-------|------|------------------------------------------------|
| 0.00–0.12 | Anticipation | The doubly-terminated lance condenses at the hand with an outBack grow and dissolve-in, glints sparking off it. |
| 0.12–arrival | Travel | 2.8 m lance at 1.35 m height spinning, a 7 m crossed-ribbon comet 0.42 m wide, a 2.2 m caustic pool and comet on the floor, lens on `LAYER.DISTORTION`. |
| arrival | Impact (split) | Flash, 0.22 knock, light punch, a 3 m FROST plate shell, 5 m shockwave, 3.4 m frost decal, streak + chip bursts; the lance shatters over 0.15 of the split. |
| +0–0.9 | Split | Three shards (pink, green, blue) fan out at ±0.52 rad, 6 m, trailing 0.4 m spectral beams; three 1.1 m-wide coloured rays on the floor. From 55 % of the split each shard's cluster of seven quartz pipes (middle pipe 2.8 m) breaks the floor with a chip burst and a knock, overshooting, while the shard climbs to crown it; a rime of faceted crystal floor spreads 2.2 m round each. |
| +0.9–2.0 | Linger (the song) | Rings of light climb each pipe in turn across the cluster and flare at the tips; spectral cracks pulse outward through the rime; shards bob over their clusters; the floor rays hold at 65 %. |
| last 35 % | Exit | Pipes sink and burn out from the tips down with a second chip burst; the rime burns out through noise; shards dissolve. |

## Layers
1. Lance + comet (`createPrismMaterial`, `createBeamMaterial`).
2. Shards, beams, 120 GPU splinters.
3. Lightfall (floor caustics, spectral rays) and lens (distortion).
4. Particles: SOFT glints, STREAK spectral streaks, CHIP glass chips.
5. Split beat: flash, shake, light, FROST shell, SHOCKWAVE + FROST decals.
6. The choir — `createChoirSpireGeometry` (seven graded quartz pipes on an arc), lit flat-shaded `createChoirSolidMaterial` on `LAYER.WORLD` with shadows, plus `createChoirGlowMaterial` additive song shell (climbing rings, tip flares, spectral fresnel, facet edges, burn-out).
7. The rime — `createChoirRimeMaterial`, normal-blended faceted crystal floor per cluster with pulsing spectral cracks.

## Signature
A chord made solid: one white light becomes three coloured crystal organs that ring in turn.

## Palette
core #ffffff, tint #bff4ff, body #8f7cff (per-shard spectrum pink/green/blue), deep #262a8c

## Gameplay
Unchanged: `handlesOwnHits`; the lance throws bodies within `reach` of its swept path, each shard within `reach` of its swept segment along its heading; nothing hit twice. The clusters are visual only.
