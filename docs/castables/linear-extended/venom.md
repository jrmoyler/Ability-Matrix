# Venom Surge — `linear-extended/venom`  ★ reference (§1, line cast)
Poison · line · range 2.5–16 m (capture: 12 m) · no zone · ≈ 6.0 s on screen (0.52 travel + 3.9 stand + 0.55 delay + 1.0 sink)

## Read in one line
A fracture front runs down the line and a wedge of cold amethyst crystals with green venom sealed in their flaws erupts behind it, opening into a 2.3 m starburst cluster around a white-green kernel of light, while heavy green gas rolls off the bases, venom drips from the tips and the floor at the end breaks into heaved slabs with light coming up the seams.

## Beats
| t (s) | Beat | On screen (shape, size in m, colour, motion) |
|-------|------|----------------------------------------------|
| 0.00–0.52 | Anticipation + travel | `cast2`; the seam runs at 23 m/s with `rumble` 0.055. Behind it gems erupt by `along` fraction: band half-width 0.42 → 1.9 m, height 0.45 → 2.4 m (`heightCurve` 1.6), 38 % demoted to ankle rubble; each rises in 0.16 s with a 16 % overshoot and a birth flash (0.22 s). Gas 240/s rolls from the front (rise only 0.22 m/s — it rolls, it does not lift); crack decals 1.8 per metre. |
| 0.52 | Impact | The **starburst** cluster at the end (r 2.3 m, centre gems 2.5 m, rim lagging 0.16 s × radius) goes up; the **kernel** of light appears at 1.15 m (r 0.8 m, halo × 2.4) and starts lighting the gems from inside; the **floor plate** (r 3.4 m, 74 voronoi slabs) heaves up with seams opening green; gas shell 3.8 m, 4.2 m shockwave (#9dff3a/#d8ffb0), droplets flung and arcing down, shake 0.72 (0.95 s), flash 0.11 #d6ffa8. |
| 0.52–4.42 | Linger | `lifetime` 3.9 s: venom drifts up inside the gems' flaws, glints crawl (0.6), the kernel flickers (6.5 Hz) and "breaks" (0.75), drips 7/s off the tips, motes lift, gas keeps rolling and goes dusty violet as it dies, light #9bff45 (r 15). |
| 4.42–5.97 | Exit | `shatterDelay` 0.55 s, then gems withdraw into the floor over `sinkTime` 1.0 s; slabs settle; crack stains (#27470f) remain. |

## Layers
1. **Gems** — `createCrystalGeometry` instanced (≤ 336, 210 dealt; base r 0.42 m, taper 0.18 — sharp), `materials/VenomCrystalMaterial.js` (patched `MeshStandardMaterial`, shadows, probe): thickness tint to deep #3c1a6e, body #7b3fd4, rim #c9a3ff with R/G/B **dispersion** (green one side, violet the other), frosted milky tip #ded2f8 in the last third, venom #9dff3a in ridged *local*-space flaws drifting up, world-space cleavage planes, birth flash, and `uCore` — the kernel's world position — lighting gems from inside.
2. **Gas** — `SMOKE` 240/s, #a8c47a → #879a80 → #7b7590 → #1e1729 (acid at source, dusty violet as it drifts).
3. **Droplets & drip** — `SOFT` beads flung out of the break and dripping off tips, #ecffb0 → #1d3a0c; motes #f4ffd9 → #2a1046.
4. **Cracks** — `effects/ShatterPlate.js` + `assets/ShatterGeometry.js` + `materials/ShatterStoneMaterial.js`: a CPU-built voronoi disc in unit space, each slab shrunk toward its centroid (opens seams), heaved and canted *in the vertex shader*; stone #8d8a86 / #3a3733, seam light #7ad42a, stain #54761f; plus CRACK decals along the path.
5. **Glow** — `materials/VenomCoreMaterial.js`: kernel + halo shells, brightness `pow(N·V, uCore)` (bright facing, not grazing): core #f6ffe8 / #a6ff32 / #5fd11a, halo edge **#7b3fd4** (the violet the cloud is read against).
6. **World** — gas burst shell, shockwave, light, shake, flash.

## What the capture shows
_(filled from the dense pass, `docs/castables/sheets/linear-extended__venom-sheet.jpg`)_

## Signature
**Cold purple glass lit from within by something green** — the venom is a substance held inside the gems (the only strongly emissive, only green term), never a green crystal with a purple glow.

## What makes it the bar
1. **Records store only dice.** A gem record is an `along` fraction, a signed lateral fraction, a bearing and unitless jitters; every metre/second is resolved from `settings.venom` per frame, on a zero-length frame too — drag `burstHeight` and a standing cluster re-grows while paused. The only captured values are eruption/shatter timestamps (events). This is the reference for how a line cast stores state.
2. **Shape the line as a function of `along`.** Width, height and density ramp from caster to impact (`widthNear`→`width` with `widthCurve`, `heightNear`→`height` with `heightCurve`, `peak` × over the last `peakWidth`), then a radial starburst with `burstStagger` × radius lag — a line that *builds* to its impact.
3. **Two layers welded by one uniform.** The glow's world position is written into the gem material (`uCore`), so the gems nearest the kernel are lit from its direction — one object, not a glow parked in a pile of crystals. Kernel brightness uses `pow(N·V)` (chord length), never a fresnel bubble.
4. **Colour logic carries the element.** Purple body, green only in the fluid; gas that starts acid-green and dies dusty violet; halo edge in the gem violet. Gas that *rolls* (rise 0.22) says "heavy toxin" without a label.
5. **Ground broken by voronoi slabs in the vertex shader.** A CPU-built voronoi disc in unit space whose slabs shrink to their centroids, heave and cant via three uniforms — the crater size is a mesh scale, the break is never rebuilt.
6. **Each panel is switchable.** Crystals, gas, droplets, cracks and glow are separate editor folders you can turn off and judge alone — the organisation to copy.

## Palette
core #f6ffe8, tint #c9a3ff / #a6ff32, body #7b3fd4 / #9dff3a, deep #3c1a6e / #1e1729

## Gameplay
Line cast; `DummyField` hits from the published line. Cooldown 0.5 s.
