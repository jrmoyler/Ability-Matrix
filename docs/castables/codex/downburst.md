# Downburst — `codex/downburst`
Wind · zone · range 0–18 m · circle 4 m · ≈3.5 s on screen (≈0.35 herald at 24 m/s + 0.42 gather + 0.14 drop + 0.7 press + ≈2 settle)

## Read in one line
A low, dark storm cloud swirls together right over the circle, a bell of dark storm-blue air banded with pale wind streaks slams down out of it, and the outflow scours the floor into a wide dark star of radial grooves with pale combed ridges while a rolling ring of slate dust runs out through the bodies.

## Beats
| t (s) | Beat | On screen |
|---|---|---|
| 0.00–0.35 | Travel | A knot of wind streaks runs out from the hand to the circle, climbing toward where the cloud will hang. |
| ≈0.35–0.77 | Anticipation | The cloud (2.9 m rim, 4.5 m radius, near-black core #070c16 → storm blue #24375a, ice-blue rim light) winds together in three spiral arms in frame above the dummies, its core sagging 1 m toward head height; sheet lightning flickers inside; wisps spiral in; the circle's edge pulses on the floor; the camera rumbles. |
| ≈0.77–0.91 | Drop | The column falls (0.14 s) with a white-hot leading front; the cloud core lurches down 0.5 m. |
| ≈0.91 | Impact | Slam: the front dies, the bell stands on the floor — dark navy #071226 body, #3567a8 sun side, pale #a9c9f5 streak crests falling at 24 m/s. Shock ring (ice edge on a dark trough) runs out to 9 m; a faint air shell; 320 radial streaks, 80 slate dust billows, 60 dark grit chips; shake 1.0, light punch 30, flash 0.22. Core bodies are pressed into the floor, edge bodies blown out tumbling. |
| ≈0.91–1.6 | Linger (column) | The column keeps pressing for 0.7 s, streaks still pouring, then is lifted up into the cloud through a ragged edge; the cloud tears apart. |
| ≈0.9–3.0 | Linger (floor) | The dust torus rolls outward and thins; the floor stays scoured: 90 deep radial grooves #0d1626 with pale combed ridges #5f86bd and a near-black pressed imprint in the middle; fine dust sifts back down. |
| ≈3.0–4.0 | Exit | The scour erodes away on noise. |

## Layers
1. Storm cloud — bent polar disc, spiral fbm, two-tap sun lighting, charge glow, lightning.
2. Pressure funnel — `LAYER.DISTORTION` tube (anticipation + slam punch).
3. Column — premultiplied tube: dark body occludes, streak crests / front add light.
4. Ground blast — telegraph, shock ring + dark trough, two-tone scour, imprint, noise erosion.
5. Dust torus — rolling parameter-space torus, lit slate.
6. Shock lens — `LAYER.DISTORTION`.
7. Particles — wisps (SMOKE), streaks (STREAK), dust (SMOKE, lit), debris (CHIP).
8. Engine — DUSTRING + SHOCKWAVE decals, AIR shell, shake, flash, light.

## Palette (one ramp)
white-hot #ffffff → pale ice #a9c9f5 / #cfe3ff → storm blue #3567a8 → deep navy #071226 (carries the column, torus, scour, imprint, cloud core).

## Changed in the upgrade
Cloud lowered 4.9 → 2.9 m and narrowed; gather 1.15 → 0.42 s, drop 0.2 → 0.14 s; column rebuilt premultiplied with a deep body; front only during the fall; beige dust → slate-navy ramp; scour two-tone and opaque; white ring dimmed onto a dark trough; air shell made faint. 11 new settings keys (colorColumnBody, colorColumnDeep, columnBodyOpacity, columnBodyLight, columnFrontDecay, colorScourLit, scourRidge, ringShadow, burstOpacity, burstIntensity, shockIntensity) all in the editor.
