# Spellwright's Gambit — `matrix-expansion/spellwrights-gambit`
Arcane · zone · range 1–18 m (capture ≈ 12.6 m) · zone radius 4 m · ≈ 3.3 s on screen (0.42 flight + 2.2 beats/linger + 0.8 exit)

## Read in one line
A blackened-bronze armillary sphere is lobbed from the hand, settles 2.7 m over a sigil inked into a pool of deep ink, and its crown of eight runic swords dives into the floor in the first composed shape (a ring of blades, a line of blades, or a starburst), is pulled back, and dives again in the second shape — each strike raising a wall of runes in that shape and burning the shape into the floor — before the swords are drawn up and the armillary lifts away.

## Beats
| t (s) | Beat | On screen (shape, size in m, colour, motion) |
|---|---|---|
| 0.00–0.42 | Anticipation + travel | The armillary (half size, bands spinning +6 rad/s) leaves the hand at 1.45 m and lobs (apex +1.4 m) to 0.9 m above its rest point, shedding 90 streaks/s; the sigil starts inking round the target and the next shape's footprint is drawn — the telegraph. |
| 0.42–0.87 | Settle / charge | The armillary grows to full size (outBack): three crenellated bands of 2.0 m radius round a 1.4 m faceted gem, centre 2.7 m. The deep ink pool soaks out under the sigil. The eight 1.66 m swords hang tips-down round it at 2.2 m, steepening and cinching in as the beat comes due. |
| 1.07 | Impact 1 | The swords dive (0.2 s, departures scattered, all land on the beat frame) and bite 0.3 m into the floor in shape 1 (default ring: on the 3.6 m circle, hilts leaning out), ringing out (42 Hz, decaying). Rune wall 1.9 m rises in the shape; STORM shell, SHOCKWAVE/ARC decal, crack decal + 6 dark chips under every blade; the shape's scar flashes white-hot in the floor; knock 0.12, flash, light punch. |
| 1.07–1.72 | Linger I | Blades held for 0.35 × interval, then pulled back up into the orbit; the scar cools white → ink → deep over 0.9 s and keeps an ember seam; the wall dissolves from its torn top. |
| 1.72 | Impact 2 | Same dive into shape 2 (default line: blades alternating either side of the aimed stripe over ±0.86 R; a straight rune wall). |
| 1.72–2.62 | Linger II | Swords stay planted in shape 2; both scars burnt into the pool; motes swirl; bands keep turning, opened 6 % per beat. |
| 2.62–3.42 | Exit | Swords pulled out and drawn up into the armillary, which lifts 1.6 m and shrinks (inCubic); the sigil and pool dissolve through noise from the rim; crack decals outlive it (2.4 s). |

## Layers
1. Armillary — `createBandGeometry` (crenellated, 160 seg) in lit `MeshStandardMaterial` (blackened bronze #3a3150, metalness 0.85) casting shadows, each wearing a thinner additive rune strip (`createBandMaterial`); faceted focus gem (`createFocusGemGeometry`). `geometry.js`, `index.js`.
2. Runic swords — `createRunicBladeGeometry` instanced ×8, lit metal with etch emissive; pose machine `_pose`/`_bladeFrame` (orbit → shape → orbit → shape → orbit) derived from `zoneRadius`, `ringWidth`, `lineWidth`.
3. Ink pool + scars — `createInkPoolMaterial` (normal-blended deep #150b3a, struck shapes burnt darker, stays) and the scar seams in `createSigilFieldMaterial` (voronoi F2−F1 cracks through edge → ink → deep ramp).
4. Sigil linework + footprints — authored star polygons written on stroke by stroke; the next shape's exact hit footprint.
5. Glyph walls — `createWallMaterial` on an open tube (ring, expanding burst) or sheet (line): rune columns streaming up, torn white lip, four-stop ramp.
6. Release flare, beam, GPU motes, STREAK sparks/trail, CHIP chips (`spellwrightsGambit.chips`, non-additive).
7. Strike — STORM shell, SHOCKWAVE/ARC + CRACK decals, shake/flash/light; warp ring on `LAYER.DISTORTION`.

## Signature
The swords are the release: the crown hung round the armillary visibly dives and plants itself in the composed shape on the beat frame — ring, line or star — so the two shapes and their stagger are read from the blades alone.

## Palette
core #ffffff / #eef0ff, tint #c2bbff, body #646cff / #7c8cff, deep #150b3a

## Gameplay
Unchanged: `handlesOwnHits`; on each beat (`beatInterval` after landing, twice) enemies within `zoneRadius` are filtered by shape (ring band `ringWidth` deep, line stripe ±`lineWidth`, burst whole disc) and hit through the expansion combat binding or `DummyField.kill` (≤16). `lingerTime`/`exitTime` are presentation only.
