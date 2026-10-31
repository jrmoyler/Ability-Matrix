# Crosscut Gust — `codex/crosscut`
Wind · line · range 2–18 m · no zone · ≈ 2.8 s on screen (≈0.36 s travel at 36.5 m/s for a 13 m cast + 1.15 impact + 1.25 fade)

## Read in one line
A 4 m wide, 2.8 m tall breaking wave of teal air curls up off the hand and runs down the line, its face raking across it as it goes over a floor combed into crossing streaks; at the group it breaks and rolls up into a 5 m roll of wind that keeps turning over a spiral eddy, flinging leaves, then unwinds and lifts away.

## Beats
| t (s) | Beat | On screen |
|---|---|---|
| 0.00–0.12 | Anticipation | The front rises off the hand with an overshoot (outBack, 0.12 s); sparks and motes leave the fist. |
| 0.00–0.36 | Travel | The gust front rides the hit front: a translucent sheet rising, leaning over and curling into a white lip, crest peaking off-centre, bowed forward; deep teal low (#04211b), saturated teal (#1f9e80), mint at the crest; streaks rake diagonally up and across it; it flutters; its face turns from −0.6 to +0.6 rad as it runs (the cross-cut; bodies it reaches are thrown on the same swinging heading). Leaves shed off the curl. Behind it a 3.6 m strip of floor is combed by two families of streaks crossing at ±0.55 rad, fresh mint dust right behind the front. |
| ≈0.36 | Impact | The front breaks over the group: pitches forward 1.1 rad, lunges 1.2 m, squashes and tears apart over 0.3 s, while the rotor rolls up (outBack, 0.32 s); template beat: shake, flash, light, dust shell, residue decal. |
| 0.4–1.9 | Linger | The rotor — a filled, translucent teal body (deep core, lighter limb, swirling) under three quieter helical ribbons, 5.2 m long, 1.35 m radius, axis across the line — rolls forward at 9 rad/s slowing over 1.4 s, drifts 1.6 m on, sways ±0.55 m; dark leaf debris (#5c6b3a → #0b0f08, 0.24 size) is flung tangentially round it; under it a spiral eddy (r 2.3 m, three arms) is scoured into the floor and keeps turning. |
| 1.9–2.8 | Exit | From 40 % into the fade the rotor swells 60 %, lifts 0.9 m and tears apart on noise; the strip and eddy erode from 50 %. |

## Layers
1. Gust front — `createCrosscutFrontGeometry` (curl-profile sheet, in the ability file), `createCrosscutWindMaterial('front')` (normal-blended torn translucent body, flutter in the vertex stage, raking streaks, white lip).
2. Rotor — `createCrosscutRotorGeometry` (three helical ribbons, in the ability file), `createCrosscutWindMaterial('rotor')`, over the roll's body `createCrosscutCoreGeometry` + `createCrosscutCoreMaterial` (dark-teal translucent churn).
3. Scoured floor — `createCrosscutScourMaterial`: combed crosscut strip + turning spiral eddy; erodes.
4. Particles — lit LEAF system `crosscut.leaf` (dark debris), SMOKE dust, STREAK sparks, motes.
5. Engine — SCORCH residue, DUSTRING, aftershock.
6. World — shake, flash, light, lens distortion (0.5).
Template ribbon sweep at the caster, voice, floor grid, rig, pieces and trail are off by default.

## Signature
The gust's face crosses the line as it runs, and the floor keeps the cross: two sets of combed streaks, written diagonally both ways.

## Palette
core #f2fffb, tint #9ff5dc, body #1f9e80 (wind) / #47e1bc (light), deep #04211b

## Gameplay
Unchanged: `handlesOwnHits`, `WHEN = 'travel'` — the hit front cuts what is within `hitRadius` as it passes (`kill(…, slice)`), the blow's heading swinging from −`sweep` to +`sweep` across the line.
