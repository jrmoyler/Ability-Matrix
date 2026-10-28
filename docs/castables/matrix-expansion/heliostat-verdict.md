# Heliostat Verdict — `matrix-expansion/heliostat-verdict`
Light · zone · range 2–18 m · zone radius 4 m · ≈ 3.2 s after the lens lands (+ travel at 30 m/s)

## Read in one line
A lens skims out to the circle, a ring of eight bronze mirror pylons shoulders out of the floor round it and turns its panels to throw sunlight onto a great dish over the nearest visible enemy; the dish fires one body-wide ray, glasses the floor, and the panels follow the sun across the dial before folding away.

## Beats
| t (s) | Beat | On screen (shape, size in m, colour, motion) |
|-------|------|------------------------------------------------|
| 0.00–travel | Travel | A 0.3 m lens of six iris blades round a prism disc rolls down the line at 1 m height, shedding gold glints (30 m/s). |
| +0.00–0.40 | Anticipation | Eight lathed, fluted bronze posts (2.6 m) shoulder out of the floor at 0.92 × zone radius one after another (0.035 s stagger, outBack overshoot), each carrying a 2 × 1.3 m concave six-tile mirror panel. The sun-court dial draws in from the centre: dark glassy bronze flags with gold seams, twelve hour lines, rim band. Over the target a 4.7 m dish of twelve mirror slabs unfolds 3.6 m up. |
| +0.00–0.70 | Charge | Each panel turns by the reflection law (normal = bisector of sun and dish) and a reflected shaft runs from it to the dish, brightening with the charge — a crown of sunlight converging overhead. The fluted cone pours from the dish; the caustic focus on the dial narrows onto the target; pools swell under the pylons; the bronze warms; the camera hums. |
| +0.70 | Impact | One attributed `light` hit; the ray fires: three crossed ribbons + white core, ~0.9 m wide and 3.6 m tall; every panel flashes; STORM burst, shockwave, scorch, aperture petals and prism shards; flash, knock, light punch. |
| +0.70–2.20 | Linger | The ray burns 0.6 s and thins; the dish folds away. The focus slides off the dish and sweeps the court like the sun crossing the sky — the panels keep turning to follow it, their shafts at 30 %; the gnomon's hand sweeps the dial; a 2.2 m disc of glassed floor with molten voronoi cracks crawls and cools. |
| +2.20–3.20 | Exit | Panels fold flat (first half), posts sink 1.4 m back through the floor (second half); the dial burns out through noise with a white edge. |

With nobody to judge, the field still rises, gathers its shafts on the empty centre at 35 %, sweeps, and folds — no hit is claimed.

## Layers
1. Lens — iris blades + prism disc (`HeliostatGeometry.js`, `HeliostatMaterials.js`).
2. Dish — `heliostatGeometry` twelve concave slabs, mirror shader; iris blades and orbiting facets.
3. Gather — sun-dial focus quad and fluted cone.
4. Ray — crossed ribbons, core column, heat shimmer on `LAYER.DISTORTION`.
5. Contact — `HeliostatImpact` aperture, shards, STORM burst, SHOCKWAVE + SCORCH decals.
6. Particles — STREAK glints, SOFT sparks, ambient motes.
7. Heliostat field — `heliostatPostGeometry` (lathed fluted post), `heliostatPanelGeometry` (six-tile concave mirror, frame lip, strut, trunnion), lit `MeshStandardMaterial` bronze + glass on `LAYER.WORLD`, casting shadows; `heliostatShaftGeometry` + `createHeliostatShaftMaterial` reflected shafts.
8. Sun-court — `createHeliostatCourtMaterial`, normal-blended floor dial spanning 1.05 × zone radius.

## Signature
Placement by the reflection law: every panel's aim is solved each frame from the sun and the live focus, so the ring of mirrors always throws its light onto the judged enemy at any radius, height or target position.

## Palette
core #ffffff, tint #fff1bd, body #e0a040 (rays #ffe58b), deep #1c0f05 (bronze #3a2410, scorch #5a3410)

## Gameplay
Unchanged: `handlesOwnHits`; nearest living enemy in `zoneRadius` with line of sight from the caster; one `light` hit through `bindExpansionCombat` after `lockTime`, only if the binding accepts it; re-validated every frame; cover/escape/replacement aborts with a fold-away; refused events retry.
