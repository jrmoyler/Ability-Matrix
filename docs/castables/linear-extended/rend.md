# Celestial Rend — `linear-extended/rend`  ★ reference (§1)
Holy · zone (judgment) · range 0–24 m (capture: 16.8 m) · zone radius 5 m · ≈ 8.8 s on screen (0.23 mote + 6.2 stand + 2.4 close)

## Read in one line
A mote of divine light with a star riding it flies to the circle, a gold celestial mark writes itself into the floor, gold-and-blue tendrils braid up out of it, dark crystal shards come in out of the dark from every bearing and drive into the mark faster and faster — and the mark detonates into a 30 m column of light with a four-pointed star at its head and two counter-tilted halo rings, putting down and burning away everything standing in the circle.

## Beats
| t (s) | Beat | On screen (shape, size in m, colour, motion) |
|-------|------|----------------------------------------------|
| 0.00–0.23 | Anticipation + travel | Cast flash 0.06; the mote runs at 72 m/s from 1.15 m carrying a seed star (0.34 R) that hangs 2.6 m above the mark. |
| 0.23–0.83 | Anticipation (mark) | Mark shake 0.16, flash 0.09. The mark writes itself on over `sigilTime` 0.6 s (outQuint) behind a white front #fffaf0: 5 rings, 4 glyphs at 0.68 R, 48 ticks at 1.04 R, 9 wandering cracks out to 1.25 R; line #ffcf7a, core #fff6e0, wash #ffab3c, deep #3a2a10. Bodies inside are **marked** (nothing moves them). |
| 0.53–1.53 | Anticipation (braid) | 32 tendrils climb from 0.85 R after 0.3 s over 1.0 s, winding up to half the column height, 35 % counter-wound, converging on the marked point; root #ffb14a → warm #ffd58f → cold #a9c8ff → tip #fffdf5. Gold motes 190/s lift off the mark. |
| 0.83–2.53 | Travel (charge) | `chargeTime` 1.7 s of shards: each sliver (1.7 m long) comes in from 3.4 R, high (loft 1.0 × column height), curving 0.6 rad, rolling, 0.85 s in flight, trailing 110 sparks/s; arrival time `rendAt − charge·dice^bias` — a lonely one every half second at first, a **hail** at the end. Each strike 0.035 shake. Shards are solid (dark #1b2436 / facet #4a5878 with warm #ffc86a and cold #9fc4ff sides). |
| 2.53–2.98 | Impact (rend) | The mark goes off over `rendTime` 0.45 s: a column 30 m tall (leaves the top of the frame on purpose), shaft 0.28 R with a skirt closing fast with height; star opens 0.16 s later over 0.5 s at 0.42 × the column's height (2 R half-extent, 34 needles); two halo rings (1.5 R) write themselves round after 0.2 s; warp proxy rings the shaft; shards thrown clear over 1.2 s; chips and a dust bank. Bodies are felled with **zero impulse** (legs go out, collapse into their footprint), held in place, then consumed one after another, the column flaring as each finishes. |
| 2.98–6.43 | Linger | Column streams (1.6), wobbles 8 % of its radius, star bobs and flickers 2.6 Hz, halos sweep 0.22 rev/s, tendrils feed the column, the toll envelope (`pulseRate` 1.3) swells the light. |
| 6.43–8.83 | Exit | `fadeTime` 2.4 s close. |

## Layers
1. **Celestial mark** — `materials/RendSigilMaterial.js`, floor SDF 0.03 m up.
2. **Astral tendrils** — `materials/RendTendrilMaterial.js` on `assets/RendGeometry.js` ribbons billboarded about their own spine (full width from every angle).
3. **Radiant shards** — `assets/RendGeometry.js#createSlingGeometry` (a real solid), `materials/RendShardMaterial.js`, in the depth prepass and shadow map; `shardBeamBleed` lights the facets that face the column in its gold.
4. **Divine impact** — `materials/RendPillarMaterial.js`: column (`|N·V|`-power body, small rim), star (polar field of three raised cosines summed, exponential falloff), two halo rings, and a warp proxy on `LAYER.DISTORTION`; column #fffdf2 / #ffd489 / #ffb254 / cool #bcd8ff, star #fffef8 / #ffe1a4 / #ffb04a / #a8c6ff, halos #fff4d6 / #ffc46a / #9dbcff.
5. **Particles** — motes (#fffdf4 → #4a2a12), spark streaks (#ffffff → #6b3a12), chips (#7a6d55 → #100d09), dust (#9a8f7c → #1a1815).

## What the capture shows
_(filled from the dense pass, `docs/castables/sheets/linear-extended__rend-sheet.jpg`)_

## Signature
**A pillar that cuts the sky and the floor at once**: one clock (`_markTime`) runs mark → braid → accelerating hail → detonation, and the hail lands on the frame the column goes up.

## What makes it the bar
1. **One clock, thresholds on it.** Every beat is `saturate((_markTime − start)/duration)` against `_rendAt = sigilTime + chargeTime`; nothing has its own timer, so the whole sequence scrubs in the editor.
2. **Accelerating arrivals.** `arrival = rendAt − chargeTime · dice^bias` with bias > 1 piles strikes toward the end: lonely → hail → detonation. Spread evenly, the same fifty shards read as weather. The cheapest way to make a charge *build*.
3. **Light shaded as a volume.** The column's body is a power of `|N·V|` (the chord through a cylinder is `2R·|N·V|`): brightest down the middle, fading at the edges — a searchlight, not a soap bubble (`1 − N·V`). The star is an analytic polar field (three summed raised cosines with exponential falloff) so its points stay sharp at any size.
4. **Scale via one solid.** Everything else is additive light; the shards are the only opaque, shadow-casting objects, and they are what the eye measures the 30 m column against. Lit by the column (`shardBeamBleed`), so they read as debris inside one light.
5. **Layers that feed each other.** Tendrils converge on the marked point before the column exists and are drawn onto its axis after — the braid visibly becomes the pillar.
6. **Judgment is not knockback.** Bodies are felled in place with zero impulse, held (`Dummy#carry` with zero lateral field and light downward press) and consumed staggered — the absence of scatter is the read.

## Palette
core #fffdf2 / #fffef8, tint #ffe1a4 / #ffd489, body #ffb254 / #ffcf7a (+ cool #a9c8ff / #bcd8ff accents), deep #3a2a10 / #1b2436

## Gameplay
`handlesOwnHits`: marks bodies in the circle at landing, fells them at the rend with zero impulse, holds and consumes them. Cooldown 5.5 s.
