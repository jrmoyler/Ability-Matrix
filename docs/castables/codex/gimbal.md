# Gimbal Whip — `codex/gimbal`
Tech · line · range 2–18 m · hit radius 1.15 m · ≈2.85 s on screen at 13 m (≈0.36 s travel + 1.25 s impact + 1.25 s fade)

## Read in one line
A gimballed saw of gunmetal leaves the hand and whips down the line at body height, snaking side to side and yawing into each swing. It cuts a snaking kerf into the floor that cools from white-cyan to dark teal. At the end it bites into the floor in a fountain of sparks, precesses down on its gimbals, folds flat and sinks into its own bite.

## Beats
| t (s) | Beat | On screen |
|---|---|---|
| 0.00–0.36 | Anticipation / travel | A flare at the hand. The cutter (yoke radius 1.5 m, hub at 1.6 m) runs the line at 36 m/s. It snakes ±0.95 m on a 5.5 m wavelength, ramping in over 1.5 m, and yaws ±0.9 rad into each swing. The cradle tumbles at 7 rad/s and the saw spins at 32 rad/s, throwing contact sparks back off the floor. Behind it, a scorched bed with a snaking groove is white-cyan just behind the blade and cools over 2.5 m. Hits land as it passes, as before. |
| ≈0.36 | Impact (the bite) | It drops 0.42 m into the floor over 0.12 s, with chips, a camera punch and a light punch. A dark gouge with hot cracks opens at the end of the line. |
| 0.36–1.6 | Linger | It keeps precessing on its gimbals (2.6 rad/s, running down over 1.1 s), with a spark fountain running down. The kerf cools to deep teal and dark, smoking. |
| 1.6–2.4 | Fold | From fade 1.15 the cradle folds flat into the yoke, the saw spins down and the cyan channels dim. |
| 2.4–2.85 | Exit | From fade 1.45 it is eaten behind a hot edge and sinks into the bite. The kerf lets go from fade 1.6. |

## Layers
1. Cutter: `assets/codex/GimbalWhipSignatureGeometry.js` has a yoke, cradle and saw blade, as a real Object3D gimbal hierarchy (yoke > cradle > blade). Material: `createGimbalWhipMetalMaterial` (machined gunmetal #05090c → #2a3a42 lit by the sun, brushed, tight specular; cyan #25cbf4 only in the narrow inset channels; teeth from cyan to #e8fbff with heat; dissolve). It is on LAYER.SHAPED and casts shadows.
2. Kerf: `createGimbalWhipKerfMaterial`. A scorched bed (#03080a / #13232a) follows the whip path, with the groove and walls and a seam that cools behind the cutter, plus the bite gouge with hot cracks.
3. Particles: contact sparks, the bite spark fountain and chips, and kerf smoke.
4. Decals: the residue stain at the end. World: bite shake and light. The flash is a 0.04 tint.

Turned down in the config: body, voice, lens, template field, detail pieces, rig, template ribbon (`trailOpacity`), template scar (`scarOpacity`), hex wake discs (`wakeSpacing` 0), burst shell, shock ring and shed rates.

## Signature
A saw on gimbals that whips down the line and leaves its cut in the floor.

## Palette
core #e8fbff · tint #c8f6ff · body #25cbf4 (channels and edges only) · deep #05090c metal / #03080a scorch

## Gameplay
Unchanged. The hits land along the line as the head passes (`travel`), within hitRadius, thrown sideways (`side`, slice).
