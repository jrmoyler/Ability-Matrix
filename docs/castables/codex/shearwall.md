# Shear Wall — `codex/shearwall`
Wind · line · range 2–18 m · wall 6 m wide × 3.2 m tall × 1.5 m deep · ≈ 1.1 s plough + 0.45 s tear + 2.0 s linger + 0.9 s erode

## Read in one line
A thick, lit wall of air stands up in front of the caster and ploughs down the line, its stacked rows snapping sideways against each other; it scours a dark band into the floor, tears in two at the end, and the halves peel up and drift apart over a floor that keeps drifting with dust.

## Beats
| t (s) | Beat | On screen |
|-------|------|-----------|
| 0.00–0.2 | Anticipation | The wall stands up 1.3 m out (outBack from 25 % size), dust rolls at its foot. |
| 0.2–1.1 | Travel | Wall ploughs at 15 m/s: 4 rows shoved ±0.7 m, snapping every 0.16 s (seams flash, wind lines whip out, knock); the teal body (7 slices, lit by the sun through the folds, deep #071f26 at the foot) under the white-teal streaming skin; behind it a filled dark scour band (#04090b bare floor, combed dust, stepped grooves, dust berms at both edges). Bodies thrown sideways off the line. |
| 1.1 | Impact | Wall tears in two (halves slide 3.5 m each): AIR shell 3.4 m, SHOCKWAVE 6.5 m, DUSTRING, flash, light punch, shake. |
| 1.1–3.5 | Linger | Halves keep shearing (softer snaps every 0.35 s), rise 1.6 m and keep drifting apart, body outlasting the glow; dust keeps lifting off the scour band and drifting sideways over it. |
| 3.5–4.4 | Exit | Halves dissolve with a noise edge; the scour band erodes. |

## Layers
1. Skin — `createShearWallMaterial`, additive, pleated + row-sheared grid.
1b. Body (hero mass) — `createShearBodyMaterial`, 7-slice stack through `wallThickness` (thins to the top), normal blended, four-stop ramp (#f0fffb → #5fc9bb → #1d5a62 → #071f26), sun-shaded via derivative normals, rim.
2. Lens — `createShearLensMaterial` on LAYER.DISTORTION.
3. Scour — `createShearGroundMaterial`: filled dark band, combed dust, stepped grooves, berms, drifting dust, fresh glow, erosion.
4. Dust (SMOKE, foot + linger lift-off), grit (CHIP), wind lines (STREAK).
5. Tear beat: AIR shell, SHOCKWAVE, DUSTRING, flash, light.

## Palette
streak #f0fffb, air #5fc9bb, depth #1d5a62, deep #071f26; floor #04090b / #162224 / berm #71847f

## Gameplay (unchanged)
`handlesOwnHits`; the wall's foot throws each body once sideways (hitDepth 0.9 m, impulse 8), the tear catches 2× depth.

## What the capture shows (upgrade J)
`/tmp/claude-0/-home-user-Ability-Matrix/8cc56224-c22f-51ae-821d-6da7489331c5/scratchpad/up-J/after-sw/codex__shearwall-sheet.jpg` (f8/20/40/70/100). Before (`/tmp/claude-0/-home-user-Ability-Matrix/8cc56224-c22f-51ae-821d-6da7489331c5/scratchpad/regrade-b/codex__shearwall-sheet.jpg`): flat white zig-zag planes, cyan-stripe floor, gone by 2.3 s (5). After: lit teal mass under the skin, dark scoured band that stays to 3.3 s with drifting dust, halves risen and drifting at 2.3 s. Honest 7.5–8. Short: from the play camera the shear rows still read partly as horizontal bands; seams remain the brightest element.
