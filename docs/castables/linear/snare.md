# Voltaic Snare — `linear/snare`
Lightning · zone (far cast) · range 0–20 m (capture: 14 m) · zone radius 4.4 m · ≈ 3.6 s on screen (0.23 leash + 2.6 stand + 0.75 collapse)

## Read in one line
A whip of violet current lashes across the floor to the target, the ring snaps open, and a 9 m twisting column of lightning stands in a burnt violet disc while tendrils crawl out to the boundary and arcs race around the rim, then the cage collapses.

## Beats
| t (s) | Beat | On screen |
|-------|------|-----------|
| 0.00–0.23 | Anticipation + travel | The **leash**: 3 filaments thrown from the hand (1.24 m up) that sag *down* to the floor (`leashSag` −0.35 m) and cling 0.12 m above it, racing to the point at 62 m/s. |
| 0.23–0.39 | Impact (snap) | `snapTime` 0.16 s: the ring slams open to `zoneRadius`; a 7 m shockwave (#8f6bff/#ffffff), flash and shake. |
| 0.39–2.83 | Linger | **Column** of 15 filaments climbs to 9.2 m (`heightCurve` 1.45 — climbs late), throat 0.16 R → top 0.25 R + flare 0.585 R over the last quarter, twisting 0.22 turns and rolling 1.26 turns/s. **Tendrils** (20) wander (1.41 rad) from the column out to 1.07 R, hopping 1.16 m off the floor, the whole fan turning −0.225 turns/s. **Rim arcs** (14), each covering 0.335 of the circle, run around the boundary at −1.84 rev/s hopping 0.98 m. The **field** disc under it: thin bright boundary band, rim-crowded wash, warped veins writhing, pressure rings travelling out, 20 boundary ticks stepping round. Branching ARC burns laid 5/s around the rim; updraft particles drag upward. |
| 2.83–3.58 | Exit | `fadeTime` 0.75 s collapse; scorch remains. |

## Layers
1. **The cage** — *one* instanced strip for every filament (`materials/SnareMaterial.js#createSnareCageMaterial`, core + halo passes). The instance index picks a **role** (leash → column → tendril → rim) and the vertex shader threads it along that role's parametric path. Ramp core #ffffff → inner #dcd0ff → outer #8f6bff → halo #2a0e8c.
2. **Field disc** — `createSnareFieldMaterial`, ability-owned quad 0.03 m above the floor that re-scales live with `zoneRadius`; #8f6bff wash, #ffffff boundary and core pool.
3. **Floor marks** — `ARC` burns #c3b0ff, scorch #0b0813, shockwave.
4. **Sparks** `STREAK` (#ffffff → #2a0e8c), **updraft** `SOFT` (#8f6bff → #1b0a5e), **smoke** `SMOKE` (#4a4368 → #191728), **debris** `CHIP`.
5. **Light** — pooled point light in the cage colour.

## What the capture shows
- **f20 (0.67 s)** — the trap is open: a bright violet-white disc ~9 m across with a hot white boundary band and a pale shockwave ring just outside it, a crown of crawling arcs standing on the rim, and a tight bundle of violet lightning filaments climbing out of the frame from a white core pool. Dummy on the edge untouched.
- **f40 / f70 (1.3 / 2.3 s)** — the column has opened into a fan of a dozen filaments, inner pressure ring visible, rim arcs re-strike; silhouette changes frame to frame (filaments re-roll) but the shape is a stable pillar-on-disc. The violet reads as "storm" without the label, and the column is the hero at play distance.

## Signature
**The circle's promise is kept**: the indicator's `zoneRadius` is the boundary the field burns, the tendrils reach (`tendrilReach` 1.07) and the rim arcs ride — drag it and indicator and standing snare re-scale together.

## Palette
core #ffffff, tint #dcd0ff, body #8f6bff, deep #2a0e8c

## Gameplay
Zone cast; `DummyField` resolves hits inside the circle. Cooldown 1.4 s.
