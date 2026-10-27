# Arborist's Growth — `linear-extended/growth`  ★ reference (§1)
Nature · zone (summon) · range 0–22 m (capture: 15.4 m) · zone radius 4.2 m · ≈ 9.9 s on screen (0.25 seed + 7.4 stand + 2.2 wither)

## Read in one line
A seed of green light runs to the circle, a nature sigil races out to the boundary, a nest of fifteen 3 m woody tendrils climbs and curls out of it unfurling leaves as a growth front passes up them, and a jade-and-gold flower rises out of the middle and opens whorl by whorl over a charging core — then it turns and fires green lances, one target at a time, cutting what it hits in half, before the nest withers back from an ember burn line.

## Beats
| t (s) | Beat | On screen (shape, size in m, colour, motion) |
|-------|------|----------------------------------------------|
| 0.00–0.25 | Anticipation + travel | Muzzle 0.55 m at the hand (1.25 m), cast flash 0.1 #a8ffc8; the seed runs at 62 m/s shedding motes 26/s and leaving stain marks 2.6 per metre (#20301f / #5f8a3a). |
| 0.25–0.67 | Impact (sigil) | Root shake 0.3. The sigil writes itself out to the boundary over `sigilTime` 0.42 s: rails, a rune band 0.32 m wide with a sweeping read-head, 72 ticks, a counter-rotating star at 0.66 R, filigree; #5fe08a / core #e6fff0 / runes #8affb0 / pool #2f8f5a. |
| 0.43–1.58 | Impact (nest) | Tendrils already coming up 0.18 s after landing; full height (3.2 m ± 0.6) over `vineTime` 1.15 s. Each is a closed woody tube bowing out at the waist and leaning over at the tip; a growth front (#d8ffb0) climbs it; leaves (0.32 m) unfurl as the front passes; bioluminescent seams (#57e08c) with sap pulses travel up the bark (#33291d / #6b5940). |
| 1.10–2.15 | Impact (bloom) | The bud lifts out of the nest at 0.85 s and opens over 1.05 s at 3.2 m: three whorls of petals (outer 1.0, mid 0.72, inner 0.44 × scale; #12543f → #1f7a5c → gold #e8c05a, pale margins #bfe89a, vein glow), a filamented core (#ffffff → #7cffd4 → #0e7a56), a halo of 14 rays and two dials (#5fe0b0 / #c9ffe4). Bloom flash 0.22, shake 0.18. |
| 2.50–7.65 | Linger (work) | 0.35 s after the bloom is open it starts firing: finds the nearest standing body within 11 m, swings onto it at 7 rad/s, the core charges 0.26 s (petal tips light), then a **lance** (white core → #a8ffb0 → #2fbf6a with a coiling #dbff7a helix, 0.16 m at the muzzle → 0.085 m) leaves; when its head reaches the body the body is **cut at the waist** (`laserHit` impulse 3.4, lift 2.6, spin 1.6). Meanwhile the nest sways, leaves flutter, pollen hangs, spirit motes lift, leaves drift off, a low mist bank sits in it, the whole thing breathes on `pulseRate` 1.15. |
| 7.65–9.85 | Exit | `fadeTime` 2.2 s: the tendrils **wither** back behind a burn line that leaves an ember (#ff9a3c), the flower closes and sinks. |

## Layers
1. **Nature sigil** — `materials/NatureSigilMaterial.js`, floor quad 0.028 m up, re-seated live by `zoneRadius`.
2. **Tendrils** — `assets/GrowthGeometry.js` parameter-space tube (`position = (t, a, 0)`), instanced (15 of 18), shape computed in the vertex stage of `materials/GrowthVineMaterial.js`: a `MeshStandardMaterial` with its vertex stage replaced (writes *world* positions; model matrix kept identity) + a matching `MeshDepthMaterial` so shadows are stems, not a sheet.
3. **Foliage** — same file: leaves **clipped to** the stems by including the same `vinePoint/vineFrame/vineRadius` GLSL and the same uniform box by identity.
4. **Arcane bloom** — `materials/ArcaneBloomMaterial.js`: petals (parameter-space grids), core, halo.
5. **Lances** — `materials/GrowthLanceMaterial.js`.
6. **Particles** — motes (#ffffff → #0b3a22), pollen (#fff6c8 → #2a4a20), mist (#cfeede → #16281f), drifting leaves (#d8ff9e → #1a3320); light #6effa8 (r 12, 45 % of the way to the bloom).

## What the capture shows
_(filled from the dense pass, `docs/castables/sheets/linear-extended__growth-sheet.jpg`)_

## Signature
**Growth along curves, in the vertex shader**: an analytic stem path climbs, curls and withers per frame, and leaves ride the exact same function — then the flower picks its own targets.

## What makes it the bar
1. **Parameter-space geometry.** Every buffer is a `(u, v)` grid with no metres in it — `t` along, `a` around; the vertex shader maps it to world space from `(instanceIndex, t)`: bearing, handedness, height and dice derive from the instance index. Adding a tendril is `instanceCount++`. Copy this for any organic or growing form; set `frustumCulled = false`.
2. **One path function shared by several materials.** `vinePoint / vineFrame / vineRadius` are injected into the tube, the foliage and both depth materials, all handed one uniform block (`_shape`) by identity — a single write per frame keeps several hundred leaves welded to fifteen animated stems with no readback.
3. **Growth and wither as fronts along `t`.** `grow` is how far up the stem the front has climbed (geometry beyond it collapses, a lit front band rides it); `wither` eats back with a burn edge whose height bias (`witherRise` 0.58) mixes height with noise. Foliage unfurls as the front passes its stalk.
4. **Matter is lit.** Wood and leaves are `MeshStandardMaterial` with a replaced vertex stage (and custom depth material) so they take sun, shadow and probe; only the seams, sigil, bloom and lances are additive.
5. **Staged sub-beats on one clock.** sigil (0.42) → vines (+0.18, 1.15) → bloom (+0.85, 1.05) → first lance (+0.35): overlapping delays make a long build read as one continuous growth.
6. **A summon that aims.** `handlesOwnHits`: it calls `findTargets`, turns, charges, fires, and calls `Dummy#kill(…, slice)` on the frame the lance head arrives — the cut *is* the kill.

## Palette
core #ffffff / #e6fff0, tint #bfffd8 / #a8ffb0, body #5fe08a / #4e9c46 / #1f7a5c, deep #1d4426 / #0d2c22 / #33291d (bark)

## Gameplay
`handlesOwnHits`: lances to the nearest standing body within 11 m, one at a time; slice kill with impulse 3.4 / lift 2.6 / spin 1.6. Cooldown 3.2 s.
