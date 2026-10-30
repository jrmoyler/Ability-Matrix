# Mirage Construct — `matrix-new/mirage`
Illusion · zone · range 0–12 m (capture ≈ 8.4 m) · zone radius 3 m · ≈ 4.4 s on screen (0.65 travel + 2.4 stand incl. 0.55 charge + 1.3 burst/dry)

## Read in one line
A strip of false water races from your feet to the circle with two chromatic ghosts of you running on it; a dark lake that mirrors the sky opens there, a copy of you assembles out of it and looms to nearly twice your height, upside down in the lake beneath itself, inside a ring of tall heat-tongues — then the tongues lean in, it gathers and bursts into shards of light that kill everything in the circle.

## Beats
| t (s) | Beat | On screen (shape, size in m, colour, motion) |
|-------|------|----------------------------------------------|
| 0.00–0.65 | Anticipation + travel | Mote stream (#ffffff→#5a4c9a) off the hand; the **road** (deep #0a0c26 + mirrored sky, 0.5 → 2.6 m wide) is laid up to the projection front, a hot seam (#ffffff) on its leading edge; two afterimage ghosts (magenta #ff5ad0 / cyan #4ff2ff) run on it, strung 0.55 m apart. |
| 0.65 | Impact | RIPPLE decal, 40-mote puff, shake 0.08, light ×0.4; the false lake starts to spread (0.5 s to 0.95 R). |
| 0.65–1.4 | Assembly / loom | The copy assembles from the feet up behind a ragged white seam (0.6 s) and grows from 1× to 1.75× the caster (0.7 s, outCubic); its inverted reflection wavers in the lake (ripple 0.07 m, 1.4 /m); 11 heat-tongues (4.2 m, 1.15 m wide, seated 0.62 R) stand up round it over 0.6 s. |
| 1.4–2.5 | Linger | Copy breathes its own idle out of step with you and swells ±2.5 %; the afterimages drift apart (×2.2 split); the veil sways (0.22 m, 3.2 rad/s), turns at 0.25 rad/s, interference bands climb it with an R/B split; the lake ripples iridescent; the road dries back from your end toward the lake (1.6 s). |
| 2.5–3.05 | Charge | Veil tips lean in over the copy (pull 0.75), body glow ×(1+2.5), slice tearing up, afterimages split ×3, rumble. |
| 3.05 | Burst (impact 2) | 36 light shards (closed-form flight), 120 sparks, AIR shell 3.2 m, SHOCKWAVE 1.4 R, DUSTRING, flash 0.35, shake 0.7, light ×3; every dummy within R killed and thrown out. |
| 3.05–4.35 | Exit | Veil blown outward and thinned (0.6 s); shards skid and fade; the lake dries in from its shore (evap) then fades. |

## Layers
1. Copy — caster rig clone (`SkeletonUtils`), `createMirageBodyMaterial` (premultiplied dark violet glass #1a0f4a covering the background — `bodyCover` 0.78 — so it reads as your silhouette; pale rim #cfe6ff, saturated bands #7a7cff; fresnel, chromatic interference bands, strobe, slice tearing, assembly seam, burst erosion). `abilities/matrix-new/MirageConstructAbility.js`, `materials/matrix-new/MirageConstructMaterials.js`.
2. Afterimages — two more draws on the same skeleton, tinted #ff5ad0 / #4ff2ff; run on the road during travel.
3. Reflection — third draw, flipped through the floor in the vertex stage, no depth test, clipped where the eye ray crosses the water (so it sits on the lake rather than spilling toward the camera), hidden by anything in front of the water (scene depth), same dark glass (`reflectCover`), fading over 3.2 m.
4. Heat veil (hero geometry) — `createMirageVeilGeometry` param-space ribbons placed/swayed/tapered in `createMirageVeilMaterial` (#6f7cff body, #e8d4ff bands, white spine, smoking out to deep #24106a at the tips, premultiplied cover).
5. False lake — `createMiragePoolMaterial`, normal-blended deep #0b0826 + env-probe sky reflection + 4 iridescent ripples broken into wavelets by noise + softer shore.
6. Road — `createMirageRoadMaterial`, same false water along the line.
7. Heat haze + burst shock (LAYER.DISTORTION).
8. Motes (SOFT, curl) and sparks (STREAK); instanced light shards.

## Signature
A real mirage: the copy stands on water that is not there, its upside-down image in it, inside a ring of bent air.

## Palette
core #ffffff, tint #cfe6ff, body #6f7cff / #7a7cff, deep #1a0f4a / #24106a / #0b0826

## Gameplay
`handlesOwnHits`: at the burst every live dummy within `killReach × zoneRadius` dies, thrown outward (impulse 7, lift 4.5). Unchanged.

## What the capture shows (after)
`sheets/matrix-new__mirage-sheet.jpg`: f8 ghosts on the road; f20 blue road reaching the circle; f40/f70 3 m copy inside a crown of chromatic heat-tongues over a dark ringed lake; f90 the burst. Short of the bar: the reflection is faint at the 45° capture camera and the lake still reads ring-heavy.

## What the capture shows (upgrade C)
`/tmp/claude-0/-home-user-Ability-Matrix/8cc56224-c22f-51ae-821d-6da7489331c5/scratchpad/up-C/r2/matrix-new__mirage-sheet.jpg`: f32–f70 a tall violet-glass copy with a pale rim inside violet-tipped heat tongues, its inverted violet image on the dark lake in front of it, wavelet ripples instead of target rings; the white column that used to spill from the lake to the caster is gone. Before 7 → after honest 8. Short: in the cluster capture the dummies stand in front of the copy and cut its silhouette.
