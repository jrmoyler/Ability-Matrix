# Dune Scourge — `collective/dune`
Earth (sand) · line · range 3–18 m (capture ≈13.5 m) · crash fan r 4.2 m · ≈4.8 s on screen (0.32 s gather + 0.9 s travel + 2.6 s linger + 1.3 s exit, × `global.lifetime`)

## Read in one line
Sand is drawn in round the caster's feet into a swelling ridge that sets off as a curling, sun-lit dune wave, breaks on the target and collapses into a crescent dune that walks on over a bed of ripples before it is blown flat.

## Beats
| t (s) | Beat | On screen |
|---|---|---|
| 0.00–0.32 | Anticipation (gather) | Sand SOFT spray + SMOKE drawn in and up off a 2.4 m ring, spiralling; the ridge swells out of the floor 0.9 m ahead of the feet to 0.35 m (outBack); rumble. |
| 0.32–1.2 | Travel | The wave runs at 15 m/s: opaque lit sand ridge (crest 0.35 → 1.9 m over 4.5 m, half-width 0.9 → 2.6 m), long back slope, steep face with a lip curling over a dark hollow, crescent flanks; shadow on the floor; grit CHIPs flicked off the lip, spray blown back, dust rolling off the back; DUSTRING decals every 1.1 m; ripples settle in 1.2 m behind the crest. |
| 1.2 | Impact (the break) | Lip thrown forward 1.4×, the wave rolls on 1.6 m and slumps over 0.55 s; EARTH shell squashed to 3.6 m, SHOCKWAVE r 5.2 m, DUSTRING r 5 m, 160 grit + 220 spray + 70 dust, knock 0.5, flash, light punch. |
| 1.3–3.8 | Linger (the barchan) | The wave collapses into a crescent dune (1.6 m tall, half-width 3.2 m, horns trailing 1.6 m) that piles up over 0.45 s and *walks on* down the line at 0.55 m/s, settling ±5 %; grit avalanches off its slip face and spray blows off its crest; the ripple fan (r 4.2 m) and strip lie lit by the sun. |
| 3.8–5.1 | Exit | The mound is blown flat (inQuad) into the bed; the bed blows away, shedding a drift of spray. |

## Layers
1. The wave — parameter-space strip (`createWaveGeometry`), displaced in the vertex shader (`createDuneWaveMaterial`): raised-cosine back, curled lip, crescent, fbm grain; lit by the sun from finite-difference normals, hollow under the lip, deep contact stop at the floor, wind streaks, crest backlight. Opaque on `LAYER.SHAPED` with a depth material running the same surface, so it casts a shadow.
2. The mound — same strip, its own material instance, rounder barchan shape (state overrides tail/lead/curl/bow/taper).
3. Grit + spray + dust — `dune.grit` (lit CHIP), `dune.spray` (SOFT, non-additive), `dune.dust` (SMOKE, curl).
4. The scoured trail — DUSTRING decals per metre, rumble.
5. The crash — EARTH burst, SHOCKWAVE + DUSTRING decals, flash, knock, light.
6. Ripple bed — `createDuneRippleMaterial`: asymmetric ripples across the line and in rings round the crash, relit by the sun, revealed behind the crest.

## Signature
A landform as the projectile: a sand wave with a real curl and a hollow, which does not vanish but becomes a dune that keeps walking.

## Palette
core #fff0cf, tint #c99a5e, body #74481f / #4b2e18, deep #3a2210

## Gameplay
Engine default line capsule (`DummyField.applyHits`), unchanged.
