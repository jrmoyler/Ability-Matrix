# Storm Lance — `linear/thunder`
Lightning · line · range 2–24 m (capture: 17.4 m) · no zone · ≈ 1.1 s on screen (0.17 travel + 0.45 hold + 0.5 blow-out), scorch stays 6.5 s

## Read in one line
A bundle of nine white-cored blue lightning filaments snaps from the caster's hand to the target in under a fifth of a second, gutters and re-strikes for half a second, and blows out, leaving a branching electric burn and a dark scorch line on the floor.

## Beats
| t (s) | Beat | On screen |
|-------|------|-----------|
| 0.00 | Anticipation | Muzzle shell at the hand (0.55 m, `BurstMode.STORM`, intensity 1.9) and a 0.1 #c9ecff cast flash. The bolt starts at the hand (1.28 m up, 0.55 m forward, 0.16 m to the side), not at the feet. |
| 0.00–0.17 | Travel | Strike front at 105 m/s; the bundle is drawn behind it with a 2× hot leading edge (`tipGlow`) over the last 8 % of the span. ARC decals (r 1.5 m, 0.6 s) laid 0.9 per metre; dark scorch (r 0.5 m, 6.5 s) under the line. Sparks 240/s (`STREAK`). |
| 0.17 | Impact | STORM shell 3 m at the end point, 6.5 m shockwave ring, 170 sparks + 45 debris, shake 0.8 (0.55 s), flash 0.28 #c9ecff. |
| 0.17–0.62 | Linger | The bundle holds `lifetime` 0.45 s: filaments re-roll their kinks 24×/s (`restrike`), whole-bolt brightness stutters at 34 Hz (`flicker` 0.3), single strands blink out (`strandFlash` 0.5), kinks crawl along the bolt. Light gutters (quantised stutter, 26 Hz). |
| 0.62–1.12 | Exit | `fadeTime` 0.5 s blow-out; motes (rise 1 m/s) and floor haze linger 1.6–2.2 s; the scorch stays 6.5 s. |

## Layers
1. **The bolt** — one instanced ribbon (`createBoltRibbonGeometry`, 72 nodes × ≤ 24 strands) drawn in two passes by `materials/LightningMaterial.js` (core + halo). The *entire* path — sag 0.22 m, bundle fan 0.05 → 0.75 m (`spreadCurve` 1.6), 4 octaves of piecewise-linear kink (0.34 m, 0.85 per m, falloff 0.55), twist 0.45 turns + 0.8 turns/s roll, camera-facing width 0.025 m tapering to 43 % — is evaluated in the vertex shader. Colours core #ffffff → inner #c9ecff → outer #3aa0ff → halo #0b3fc8.
2. **Floor** — `ARC` branching burn decals (#9fdcff, ember #4aa8ff) + `SCORCH` (#080b11). `effects/GroundDecals.js`.
3. **Sparks** — `STREAK` 240/s, stretch 0.18, gravity −12, #ffffff → #1e5b95.
4. **Motes** — `SOFT` 90/s, rising 1 m/s, ending #02195f.
5. **Haze** — `SMOKE` 50/s, opacity 0.06, #3d546e → #1c2938.
6. **Debris** — `CHIP` 24/s, gravity −17, dark #252c36.
7. **Muzzle & impact shells, shockwave, light** #63b8ff 26 / r 17 with 0.4 flicker.

## Signature
The **bolt is pure shader**: a cast captures one `uSeed`; every kink, fan and sag is resolved from `settings.thunder` per vertex per frame, so a held bolt re-kinks under the slider while paused.

## Palette
core #ffffff, tint #c9ecff, body #3aa0ff, deep #0b3fc8 (halo) / #02195f (motes)

## What the capture shows
- **f8 (0.27 s)** — already past impact: a translucent white-blue STORM dome (≈ 3 m) with a flat shockwave lip sits on the target, the bolt bundle climbs to it from the hand, a crazed blue ARC burn spreads under the caster. Seen from behind, the 17 m bolt is foreshortened into a short vertical tangle — this cast reads best from the side.
- **f20 (0.67 s)** — the bundle is a thick twisting rope of filaments near the hand, the 6.5 m shockwave ring is wide open, the struck dummy is flung up as a white ragdoll silhouette.
- **f40 (1.3 s)** — bolt gone; only a dotted line of small blue embers/scorch along the cast path. Short, sharp, done — the bar for an *instant* cast, not for a lingering one.

## Gameplay
Line cast, hits from the published line via `DummyField`. Cooldown 0.5 s.
