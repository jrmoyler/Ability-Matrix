# Rime Halo — `codex/rimehalo`
Frost · zone · range 2–18 m · circle 4.6 m · ≈4.3 s on screen (≈0.4 travel at 22 m/s + 0.8 walk + 0.3 spin + 1.0 close + 0.55 lock + 0.7 drop + 1.2 rime sublimes)

## Read in one line
A cold glint skates to the circle and walks once round its rim, and behind it a **crown of 72 solid, faceted ice spears** crystallises in two rows at chest height — each raised 35° and pointing in at the middle, blue-black at the root, glacier blue through the body, pale toward a white point. The crown spins up and **closes like a noose**, dragging blue rime in across the floor, freezing what it catches, and knots into a bristling star at the centre before the spears drop and sublime.

## Beats
| t (s) | Beat | On screen |
|---|---|---|
| 0.0–0.4 | Anticipation / travel | A four-point star of light skates along the floor leaving frost prints every 1.6 m and a comet of blue sparks. |
| ≈0.4–1.2 | Impact / walk | The star walks the rim; spears crystallise behind it one by one (0.16 s each, a brief flash at the point), hanging from a thin thread of light; a hot track is drawn on the floor. |
| ≈1.2–1.5 | Spin up | The closed crown spins; cold air falls off it as mist. |
| ≈1.5–2.5 | Close | The ring tightens (ease power 1.35 — it visibly halves by mid-close), sinks 0.35 m and spins to 7 rad/s; the swept floor turns to streaked blue rime (#0b2442 → #1f6fb8 → #cfeeff crests). Bodies it reaches are pulled in, stained ice blue (#3f7fbf) with a small frost puff. |
| ≈2.5 | Lock | The spears cross into a star knot; FROST shell, 6 m shockwave, chips, glitter, shake 0.55, flash 0.3, light punch; a crystal star is printed on the floor. |
| ≈2.5–3.2 | Exit | Spears drop under 9 m/s², tumble and sublime tip-first. |
| ≈3.2–4.4 | Linger (floor) | The rime erodes in noise patches. |

## Layers
1. Needles — instanced lathed hexagonal crystal (`RimeHaloGeometry`), `createNeedleMaterial`: opaque, `LAYER.WORLD`, casts shadows; flat facet normals, alternate faces in shadow, four-stop ramp along the spear, ramp-tinted specular (never white), thin filament + hot point, dissolve.
2. Spine & head — torus rebuilt in the vertex stage from the live radius; billboarded star head.
3. Rime floor — swept rime on the ramp, track, crystal star, erosion.
4. Cold air — `LAYER.DISTORTION` sheet kept *under* the crown (`coldHeight` 0.55, `coldWarp` 0.15) so it no longer smears the spears into a glassy swirl; SMOKE mist.
5. STREAK sparks, SOFT glitter, CHIP ice.
6. Beat — rumble, FROST shell, SHOCKWAVE, flash, shake, light.

## Palette
core #e6f9ff (tips/filament) / pale #a8e4ff / body #1f6fb8 / deep #06142a (floor deep #0b2442)

## Gameplay
Unchanged: `handlesOwnHits`, caught when the closing radius comes within `hitReach`, anything left at the heart caught at the lock; same impulse/lift/spin.

## New settings (presentation)
`colorNeedleDeep`, `needleRamp`, `needleSpecular`, `needleGloss`, `needleRise`, `coldHeight`, `catchBurst`, `catchBurstOpacity` (folders "2 · Needles", "5 · Cold air", "7 · Bodies").
