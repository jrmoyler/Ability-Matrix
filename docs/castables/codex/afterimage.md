# Afterimage Swing — `codex/afterimage`
Illusion · line · range 2–18 m · no zone · ≈ 2.8 s on screen (≈0.41 s travel at 32.4 m/s for a 13 m cast + 1.15 impact + 1.25 fade)

## Read in one line
A flickering image of a crescent war-glaive spins out down the line leaving a strobe of afterimages hanging in the air; on the beat the image winks out and the real blade — dark plum glass with a white-hot edge — forms behind the group, cuts through them on an arc, and comes back like a boomerang, breaking the afterimages, then hangs off the line turning until it shatters.

## Beats
| t (s) | Beat | On screen |
|---|---|---|
| 0.00–0.41 | Anticipation / travel (the decoy) | A see-through ghost of the 3 m crescent glaive — dark plum body, pink cutting edge, scanlines, stutter, chromatic split on the edge — spins at 16 rad/s at 1.35 m height, banked 0.85 rad, weaving up to 1.3 m off the line; streaks stream behind. From 20 % of the line it leaves `ghostCount` (4) frozen copies of itself, each over a dark mirror pool. It kills nothing. |
| ≈0.41 | Impact (the blade) | The decoy is gone; the real blade forms out of glass panes in 0.08 s behind the group and sweeps an arc of radius 2.2 m (±0.85 rad) through it in 0.3 s — the kill lands on the first frame (rule unchanged) — under a crisp swept arc of light with a knife-bright line at its radius; a dark crescent gash opens in the floor behind the blade as it sweeps. Shake, flash, light punch from the template beat. |
| 0.6–1.55 | Linger (the way back) | The blade flies back up the line to 32 % of it, bowing 2.6 m out to one side like a boomerang and settling 1.6 m off the line (clear of the caster), its spin decaying; each afterimage it passes breaks into glass panes and shards; the ones it does not reach collapse one by one 0.15 s after it stops. The gash seam cools. |
| 1.55–2.3 | Linger (hanging) | The blade hangs, bobbing 0.12 m and rocking, sheen sliding over its facets. |
| 2.2–2.8 | Exit | From 50 % into the fade it shatters along its facet cells (hot rim on each break) and throws 40 shards; the gash and pools erode from 55 %. |

## Layers
1. Real blade — `createAfterimageBladeGeometry` (lofted lens-section crescent with grip, in the ability file), `createAfterimageBladeMaterial` (lit glass, ramp #fff3fa → #ffb3dc → #9c1460 → #16020f, thin-film sheen, hot edge, cell shatter), `LAYER.WORLD`, shadow.
2. Decoy + afterimages — same geometry instanced, `createAfterimageGhostMaterial` (normal-blended dark plum body, pink edge, scanlines, stutter, chromatic split, pane break-up).
3. The cut — `createAfterimageCutMaterial`, swept arc of light over the group.
4. Floor — `createAfterimageFloorMaterial`: dark mirror pools under the afterimages and the crescent gash with a cooling seam and iridescent lip; erodes.
5. Engine — SCORCH residue + DUSTRING from the template beat; aftershock.
6. Particles — streaks off the decoy, lit chips as glass shards, motes.
7. World — shake, flash, light, lens distortion (0.4).
Template fan of blades, voice, floor grid, rig, pieces and trail are off by default.

## Signature
The thing you watch fly out is not the weapon. The weapon is the dark one that comes back.

## Palette
core #fff3fa, tint #ffb3dc, body #9c1460 (blade) / #f25fad (light), deep #16020f

## Gameplay
Unchanged: `handlesOwnHits`, `WHEN = 'return'` — on the first frames after the beat everything within `hitRadius` of the end is cut (`kill(…, slice)`), thrown along the swinging direction.
