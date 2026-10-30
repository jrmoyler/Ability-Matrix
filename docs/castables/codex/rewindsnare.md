# Rewind Snare — `codex/rewindsnare`
Time · zone · range 18 (capture ≈ 11 m) · zone radius 4.6 m · ≈ 5 s on screen (0.5 feed + 0.75 unspool + 0.3 hold + 1.15 rewind + 0.9 lock + 1.3 burn)

## Read in one line
A strip of amber film unreels from the hand into the circle and unspools across it in a widening spiral; the floor it runs over develops into a deep-sepia field lit by the film; then the reel runs backward, wringing the field round, dragging everything on it inward, and winds itself up into a three-metre lit cocoon of film that cinches shut, keeps turning, and burns away.

## Beats
| t (s) | Beat | On screen |
|-------|------|-----------|
| 0.00–0.50 | Anticipation / travel | 0.85 m film (sepia base stock, amber frames, sprocket holes, ghost images strobing) feeds down the line at 22 m/s; the perforated amber rim draws itself round the circle. |
| 0.50 | Impact | Film reaches the centre; the reel begins to unspool. |
| 0.50–1.25 | Unspool | The spiral (pitch 1.15 m, inner r 1.7 m → rim 4.6 m, ≈ 50 m of film) runs out with a white-hot leading end, turning 0.6 rad/s; behind it the floor **develops**: a filled sepia field (#1e0c04 → #7a3a0e emulsion blotches, grain, flickering scratches) with warm #ffa640 light spilling 0.3 m off each turn of film. |
| 1.25–1.55 | Hold | It lies still; bodies on it are stained amber (recorded). |
| 1.55–2.70 | Rewind | Reel spins backward up to 5.5 rad/s; chevrons race inward; the whole field is wrung backward (inner rings further); bodies are tripped and dragged inward by the hips; film climbs off the spiral's inner end into a standing helix round the centre; air wrung on `LAYER.DISTORTION`; rumble. |
| 2.70 | Lock | Cocoon (r 1.7 → 1.05 m, 3.2 m tall, lit: sun side amber, shadow side sepia, hot rim) cinches with overshoot; two clasps spin shut; AIR shell 2.4 m, 5.5 m shockwave, sparks, implosion ring, flash, shake. |
| 2.70–3.60 | Linger | Cocoon keeps turning backward at 0.7 rad/s with the bound bodies; field keeps drifting; frames strobe. |
| 3.60–4.90 | Exit | Film burns away frame by frame from ragged white-hot edges, flakes drift up; the developed field burns off from a ragged lip; bodies dropped out. |

## Layers
1. Film — one strip placed per vertex (line / Archimedean spiral / cocoon helix), four-stop film shader, lit + rim-lit where it stands (`createFilmMaterial`).
2. Clasps — two bands that spin shut (`createClaspMaterial`).
3. Floor — normal-blended developed field + perforated rim + rewind chevrons (`createFloorMaterial`).
4. Warp — `LAYER.DISTORTION` wring + implosion (`createWarpMaterial`).
5. Particles — motes (SOFT), rewind streaks (STREAK), burnt flakes (LEAF).
6. Lock — AIR burst, SHOCKWAVE decal, flash, shake, light punch.

Files: `abilities/codex/RewindSnareAbility.js`, `materials/codex/RewindSnareMaterials.js`, `assets/codex/RewindSnareGeometry.js`, `config/codex/rewindsnare.js`.

## Signature
A reel running backward: the film literally winds itself back in and the floor it exposed is wrung round with it.

## Palette
core #fff4d6, tint #ffd690, body #e8891c, deep #2a1005 (field #1e0c04 / #7a3a0e, spill #ffa640)

## Gameplay
`handlesOwnHits`: bodies on the film are marked during the hold, tripped (`tripImpulse`, `tripLift`) and dragged in on the rewind, held in the cocoon during the lock, dropped out (`releaseImpulse`, `releaseLift`) as it burns. Unchanged by the upgrade.
