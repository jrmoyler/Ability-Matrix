# Nova Beam — `linear/beam`  ★ reference (§1)
Light · line (sustained) · range 3–26 m (capture: 19.1 m) · no zone · ≈ 2.1 s on screen (0.42 charge + 0.13 race + 1.15 burn + 0.4 collapse), scorch line 7 s

## Read in one line
The caster winds up a ball of light in both hands while motes spiral into it, then lets out a bell-mouthed column of cyan-white light down the line — a white rod inside a glassy sheath, wound by four counter-rolling gold coils and threaded with shock hoops — that burns into the floor for a second, collapses to a thread and blinks out, leaving a scorch line.

## Beats
| t (s) | Beat | On screen (shape, size in m, colour, motion) |
|-------|------|----------------------------------------------|
| 0.00–0.42 | Anticipation (charge) | Orb in both hands (1.3 m up, 0.72 m forward, centre line) grows to r 0.39 m (`0.28 + 0.72·outCubic(charge)`), throbbing 6.9 Hz; intake motes pulled in from 2.6 m at 7.5 m/s (`intakeRate` 260 × (0.35 + charge)), shell shrinking toward the hands; a second light in the hands (16, r 9) so the charge lights the body; rumble 0.045 × charge. The front is **not allowed to leave the hand** until `age ≥ charge`. |
| 0.42–0.55 | Travel | Release: muzzle pressure shell 1.1 m, cast flash 0.22 #d3f4ff. The leading edge races at 150 m/s; scorch burns 1.1 per metre (r 0.7 m). |
| 0.55 | Impact | Shell 4.2 m (`BurstMode` light, A #3ec6ff, B #d3f4ff, C #ffffff), 7 m shockwave, 220 sparks + 70 debris, shake 0.9 (0.7 s), flash 0.3. |
| 0.55–1.70 | Linger (burn) | The column holds `lifetime` 1.15 s: half-width 0.16 m at the muzzle staying tight (`radiusCurve` 1.27) then flaring ×1.74 over the last 9 % to 0.77 m — a jet with a bell. Coils (4) ride at 1.88 × radius, 1.45 turns over the length, rolling −0.69 turns/s *against* the charge pulses that run along them; 10 shock hoops travel 1.31 trips/s and swell 55 %. At the burning end: pressure shells 2.6/s (2.2 m), dust rings 7/s, floor shock rings 3.5/s, splash sparks 260/s kicked back up the beam; steam 90/s; burn rumble 0.09; light #7fdcff 30, r 20, humming 18 % at 5 Hz. |
| 1.70–2.10 | Exit | `fadeTime` 0.4 s: collapses back to a thread and blinks out; scorch (#0a0d14, ember #4ad6ff) lingers 7 s. |

## Layers
1. **Column** — one `createBeamTubeGeometry` (96 nodes × 26 sides) drawn **three times** by `materials/BeamMaterial.js`: HALO (2.75 × radius, rim only, opacity 0.14), SHELL (rim-weighted sheath, fill 0.18), CORE (0.2 × radius, weighted to the *axis*). Smooth noise only (ripple, streaks stretched along the flow at 7 m/s) — no kinks. Core #ffffff → inner #d3f4ff → outer #3ec6ff → halo #0d3ce0; whole column held back (glow 0.74, opacity 0.29).
2. **Coils** — 4th pass, ribbons on the bolt strip, warm #ffdc8c / edge #ff6a12, glow 8, the thing the eye follows.
3. **Shock hoops** — 5th pass, `createBeamRingGeometry`, instanced annuli at 2.42–2.73 × the local radius, #9ceeff.
4. **Charge orb** — 6th pass, noise-eaten sphere with filament bands, rim exponent 1.8.
5. **Particles** — sparks `STREAK` 300/s dragged downrange (#ffffff → #0b2f7a), motes `SOFT` (intake while charging, drift while firing; #ffffff → #06205e), steam `SMOKE` (#41566d → #1a2430), debris `CHIP`.
6. **Floor & world** — scorch line, dust rings, shockwaves (`effects/GroundDecals.js`), bursts, two pooled lights, shake, flash.

## What the capture shows
- **f8 (0.27 s)** — charge only: a pale-cyan glassy orb in the caster's hands and a cyan pool of light on the floor around them; nothing has left yet. Clear anticipation.
- **f20 (0.67 s)** — just after impact: the impact shell is a huge faceted white-cyan bubble around the near beam, a second shell at the far end, a 7 m shockwave ring on the floor, orange-white coils spiralling up the column toward the target (seen end-on from behind, the coils read as a corkscrew of rings). Struck dummy tagged `illuminated` + `burning`.
- **f40 (1.33 s)** — the held beam: a narrow white core rod inside stacked hoop rings and warm coils, a flat orange shock disc around the far end; cyan sparks on the floor at the feet.
- **f70 (2.33 s)** — gone; a dotted cyan ember/scorch line to a small burn pool at the target. Exit is a clean blink, not a pop, because it first collapses to a thread.

## Signature
**A fourth beat in front of travel** — the charge — and a column that reads as a *solid rod of light* because its core is weighted to the axis while its sheath is weighted to the rim.

## What makes it the bar
1. **Charge gates travel.** `advance()` refuses to move the front until `age ≥ settings.beam.charge`; everything in the charge is a function of `charge = saturate(age/charge)` (orb size `0.28 + 0.72·outCubic`, intake rate `× (0.35 + charge)`, intake shell `lerp(1, 0.45, charge)`, hand light × charge, rumble × charge). Copy this for any cast with a wind-up: one 0..1 drives every charge layer.
2. **Volume integral on the cheap.** The same tube at three radii: a wide rim-only HALO, a rim-weighted SHELL (hollow, bright edges) and a narrow CORE weighted by how far the view ray runs down the barrel. Rim-weighted outside + axis-weighted inside, additively, reads as a solid luminous rod — not a lit pipe. Hold the column *back* (glow 0.74, opacity 0.29) so it doesn't clip to a white plank.
3. **One radius function welds every pass.** `beamRadius(s)` / `beamAxis(s)` are shared GLSL used by tube, coils and hoops, evaluated per vertex per frame — drag `radius` or `flare` and five passes stay welded.
4. **Bell, not cone.** `radiusCurve` > 1 keeps the throat tight and `flare` opens the last ~10 %: the mass lands at the impact end, not spread along the line.
5. **Counter-motion for a held shape.** Coils roll one way (`coilSpeed` −0.69) while charge pulses run the other way along them, and hoops travel down: three motions in different directions keep a static column alive for its whole linger. Warm coils on a cool beam (colour split) stop them dissolving into the sheath.
6. **Smooth noise is identity.** No piecewise-linear kinks anywhere (that is the bolt's vocabulary); every noise term is smooth and stretched along the flow.

## Palette
core #ffffff, tint #d3f4ff, body #3ec6ff (+ coils #ffdc8c / #ff6a12), deep #0d3ce0 / #0a0d14

## Gameplay
Line cast via `DummyField`; in the sandbox, struck dummies show `illuminated` and `burning`. Cooldown 1.6 s.
