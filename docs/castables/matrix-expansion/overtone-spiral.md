# Overtone Spiral — `matrix-expansion/overtone-spiral`
Sound · zone · range 18 m · front radius 5 m · ~3.2 s on screen (default capture)

## Read in one line
A ribbon of sound swings from the caster's hand to a ringing bead; where it lands a dark green-steel tuning fork about 3 m tall grows out of the floor and is struck three times. Each strike rolls a lobed teal pressure front across the floor that knocks bodies away, and a Chladni plate keeps ringing under the fork while it rings down.

## Beats
| t (s) | Beat | On screen |
|---|---|---|
| 0.00–0.25 | Anticipation / travel | A lobed green bead 0.75 m across at hand height (1.2 m) flies out at `speed`, facing the camera and spinning. The **wake**, two crossed ribbons 0.6 m wide, runs from the caster's hand (1.3 m) to the bead. It swings in a standing wave (3 wavelengths, ±0.35 m) and has a hot green core, teal body and deep-teal edges, with pressure beads running down it. |
| ~0.25 | Impact | The bead becomes the fork. The wake stays strung from the hand to the tine centre (~1.9 m). The fork grows out of the floor (foot planted) to ~3.2 m. A knock, then the first strike: flash, a teal AIR shell, a SHOCKWAVE decal (0.6 × radius) and a light punch. |
| 0.25–1.35 | Strikes | Three strikes, `pulseInterval` 0.45 s apart. On each strike the tines jump and buzz, their nodal bands blaze white-green, sound rings come off the top, and a harmonic front (6, 8 and 10 lobes) rolls out at 8 m/s to 5 m. Each front knocks every body it passes. The helix lights up two turns per strike. After `wakeHold` 0.55 s the wake reels into the fork over 0.35 s. |
| 1.35–2.4 | Linger | A lobed teal/green resonance disc fills the 5 m circle. The Chladni figure on the plate turns and morphs (1,2)→(2,5)→(3,7), notes spiral up, and the dark fork keeps turning and buzzing over the downed bodies. |
| 2.4–3.3 | Exit | Fork, helix, plate and notes ring down together over `lifetime`. The fronts hold where they stopped and dim. |

## Layers
1. Carrier bead: `carrierGeometry`, `createCarrierMaterial`, additive, 0.75 m.
2. Wake: `carrierWakeGeometry` drawn twice (flat and upright) with `createWakeMaterial`, normal-blended. Ramp across it runs deep `colorDeep` → body `toneB` → hot core `toneA`×1.5.
3. Resonator: `forkStemGeometry` (lathe) and 3 × `forkTineGeometry` (superellipse prisms), `createResonatorMaterial`. Scaled by `forkScale` 1.9 and `forkThickness` 2.1, ~3.2 m tall. Steel ramp is `metalDeep` #050f0e → `metalColor` #3d5a54 → sheen → nodal white, with a teal fresnel rim.
4. Fronts: `harmonicFrontGeometry` ×3, vertex-displaced pressure ridges.
5. Plate: Chladni nodal-line shader across the zone (the floor layer that stays).
6. Helix: `overtoneHelixGeometry`, lit two turns per strike, × `forkScale`.
7. Particles: note cloud (points shader), RING bursts (toneA→toneB→deep), SOFT motes, SMOKE dust.
8. Warp on `LAYER.DISTORTION` riding the fronts. Beats: shake, flash, AIR shell, SHOCKWAVE decals, light.

## Signature
A dark steel fork, taller than a body, struck three times. Each strike shows as a different note on the floor.

## Palette
core #a6ff85 (pushed >1 in nodal bands) · tint #e6d1ff / sheen · body #54ebe6 / #3d5a54 steel · deep #07302b / #050f0e

## Gameplay
Unchanged. `handlesOwnHits`: each of the three fronts sweeps its annulus and knocks every body once (`kill`, then `shove` for bodies already down). `radius`, `pulseInterval`, `waveSpeed`, `impulse`, `lift` and `speed` are untouched.
