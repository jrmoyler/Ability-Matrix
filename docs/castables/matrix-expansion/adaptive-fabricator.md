# Adaptive Fabricator — `matrix-expansion/adaptive-fabricator`
Tech · zone · range 1–18 m · scan radius 6 m · ≈ 7.1 s on screen (0.42 flight + 6 deploy + 0.7 un-fabricate)

## Read in one line
A glowing fabrication seed is lobbed onto the circle, and a 3.9 m gunmetal sentry is cut out of the air from the floor up onto a dark hex pad; its vanes swing open and it turns, scans and fires a counter-element bolt at the nearest enemy every 0.9 s, scorching the floor where each shot lands.

## Beats
| t (s) | Beat | On screen |
|---|---|---|
| 0.00–0.42 | Anticipation + travel | Faceted 0.84 m seed tumbling on a 1.4 m arc, 150 streaks/s trail; telegraph rim and faint grid ramp in at the landing circle. |
| 0.42 | Impact (deploy) | Shockwave 3.2 m + dust ring, STORM shell, 26 debris, shake 0.2, flash, light punch 6; pad seams flash hot. |
| 0.42–1.0 | Fabrication | A noise-jagged white cut climbs the sentry over 0.55 s (plinth, three feet, mast, cradle, crystal core) — shadow follows the cut; the deep pad (r = 0.42 × scan) is laid outward from its foot; vanes swing open (outBack, 0.4 s) once the cut passes the head. |
| 1.0–6.42 | Linger | Head turns 0.6 rad/s, vanes breathe, halo turns, radar sweep and pulses run on a dimmed scan disc. Every 0.9 s: head snaps to the target, recoils, 1.4 m muzzle shell, ramped bolt (white core → counter tint → body → deep) to the body, 2.1 m ionised shell + reticle at the body, sparks in the counter colour, ARC decal and a 0.85 m SCORCH that stays 4 s; pad seams reheat. |
| 6.42–7.12 | Exit | Cut runs back down, vanes refold, pad and disc fade. |

## Layers
1. Sentry — faceted lathes/extrusions (`FabricatorGeometry.js`) under the lit housing shader with fabrication front; `LAYER.SHAPED`, casts shadows through a front-aware `customDepthMaterial`.
2. Pad — `createPadMaterial`: premultiplied deep-tone footing #04121c with hex plate seams heated on deploy/shots.
3. Scan floor — hex grid, spokes, sweep, pulses (kept low: the machine is the read).
4. Shot — ramped crossed-ribbon bolt, muzzle and impact STORM shells, reticle, sparks, ARC + SCORCH decals.
5. Seed + trail, deploy debris, motes (shared STREAK system); distortion shimmer above the emitters.

## Signature
A machine built in front of you: the jagged cut climbing a solid, shadow-casting sentry, then vanes unfolding and the head snapping to each target.

## Palette
core #ffffff, tint #a5efff / counter colour, body #3ab5ec, deep #04121c (housing #2c3742)

## Gameplay
Unchanged: shots every `shotInterval` in the impact phase at the nearest unobstructed live enemy in `zoneRadius`; element from statuses (wet → storm, burning → frost, chilled/frozen → fire, else tech); UCSM `hit` with `damage`, `hitForce` from `hit*`.
