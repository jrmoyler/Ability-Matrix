# Adaptive Fabricator — `matrix-expansion/adaptive-fabricator`
Tech · zone · range 1–18 m · scan radius 6 m · ≈ 7.2 s on screen (≈0.45 flight + 6 deploy + 0.7 un-fabricate)

## Read in one line
A glowing fabrication seed is lobbed onto the circle, and a 4.3 m neutral-gunmetal sentry is cut out of the air from the floor up onto a dark hex pad; its vanes swing open and it turns, scans and paints a red lock-on sight onto the nearest enemy, then drops an arcing counter-element bolt on it every 0.9 s, scorching the floor where each shot lands.

## Beats
| t (s) | Beat | On screen |
|---|---|---|
| 0.00–0.45 | Anticipation + travel | Faceted 1.0 m seed tumbling on a 2.6 m lob at 18 m/s, 190 streaks/s trail (0.5 s life, stays drawn behind it); telegraph rim and faint grid ramp in at the landing circle. |
| 0.45 | Impact (deploy) | Shockwave 3.2 m + dust ring, STORM shell, 26 debris, shake 0.2, flash, light punch 6; pad seams flash hot. |
| 0.45–1.0 | Fabrication | A noise-jagged white cut climbs the sentry over 0.55 s (plinth, three feet, mast, cradle, crystal core) — shadow follows the cut; the deep pad (r = 0.55 × scan) is laid outward from its foot; vanes swing open (outBack, 0.4 s) once the cut passes the head. |
| 1.0–6.45 | Linger | Head turns 0.6 rad/s, vanes breathe, halo turns, radar sweep and pulses run on a saturated #1c8fd0 scan field. 0.4 s before each shot a thin red (#ff4a2e) lock-on sight stutters on, tightens and steadies along the bolt's arc while the head slews to the body. Every 0.9 s: recoil, 0.6 m muzzle shell at the emitter tips, a 0.52 m-wide ramped bolt (white core → counter tint → body → deep) that leaves the emitter ring on the target's side 0.8 m above the head and bows 2.8 m up over the head before plunging into the body (so it is never hidden behind the mast), 1.3 m ionised shell + reticle at the body, sparks in the counter colour, ARC decal and a 0.85 m SCORCH that stays 4 s; pad seams reheat. |
| 6.45–7.15 | Exit | Cut runs back down, vanes refold, pad and disc fade. |

## Layers
1. Sentry — faceted lathes/extrusions (`FabricatorGeometry.js`) under the lit housing shader with fabrication front; `LAYER.SHAPED`, casts shadows through a front-aware `customDepthMaterial`.
2. Pad — `createPadMaterial`: premultiplied deep-tone footing #04121c with hex plate seams heated on deploy/shots.
3. Scan floor — hex grid, spokes, sweep, pulses (kept low: the machine is the read).
4. Shot — lock-on sight (crossed ribbon, own material, red) then the ramped crossed-ribbon bolt bent into an arc in its vertex shader (`beamArc`), muzzle and impact STORM shells, reticle, sparks, ARC + SCORCH decals. Both leave from `_muzzleLocal` (emitter ring, target side).
5. Seed + trail, deploy debris, motes (shared STREAK system); distortion shimmer above the emitters.

## Signature
A machine built in front of you: the jagged cut climbing a solid, shadow-casting sentry, then vanes unfolding and the head snapping to each target.

## Palette
core #ffffff, tint #a5efff / counter colour, body #3ab5ec / field #1c8fd0, deep #04121c · housing #454a52 neutral gunmetal, trim #2a8fd0 (low glow, low rim) · lock sight #ff4a2e

## Gameplay
Unchanged: shots every `shotInterval` in the impact phase at the nearest unobstructed live enemy in `zoneRadius`; element from statuses (wet → storm, burning → frost, chilled/frozen → fire, else tech); UCSM `hit` with `damage`, `hitForce` from `hit*`.

## Upgrade notes (2026-10-30)
Fixed from the audit: the housing no longer leans cyan (neutral metal, saturated trim at low weight, smaller muzzle/impact shells that used to read as a pale dome over the head); the scan field takes its own saturated body tone; travel is a slower, higher lob; the shot is now a two-step beat (lock-on, then bolt) and the bolt arcs over the head because the old straight bolt from the head to a body standing behind the mast was hidden by the housing. New keys: floorColor, lockColor, lockTime, lockWidth, lockArc, lockOpacity, beamArc, muzzleHeight, muzzleReach.

## Known gap (first pass — closed in upgrade G, see below)
With the cluster of bodies right against the plinth the bolt's arc is nearly vertical from the play camera — it reads as a bright pillar over the head rather than a lobbed curve. A wider `muzzleReach` or a sideways bow would make it read as a trajectory.

## Upgrade G (second pass, 2026-10-30) — the known gap closed
The bolt's bow is now a world-space vector, not only "up": `beamArc` 1.6 m up, `beamSwing` 2.2 m to one side of the sentry→body line (alternating side each shot, `beamAlternate`, deterministic from the shot index), `beamThrow` 0.6 m outward, on a skewed bell (apex at one third, so it rises and swings out first, then falls onto the body). `muzzleReach` 0.7 → 1.0. The lock-on sight uses the next shot's side, so it traces the curve the bolt will take. With the cluster packed against the plinth the shot now reads as a lobbed curved bolt swinging out from the emitters and down onto the body instead of a bright pillar over the head.
New keys (3): beamSwing, beamThrow, beamAlternate. After sheet: `/tmp/claude-0/-home-user-Ability-Matrix/8cc56224-c22f-51ae-821d-6da7489331c5/scratchpad/up-G/r1/matrix-expansion__adaptive-fabricator-sheet.jpg` (f45/f52 show the arc). Honest 8.
