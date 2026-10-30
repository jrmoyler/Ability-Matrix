# Hemorrhage Ring — `codex/hemorrhage`
Blood · zone · range 2–18 m · circle 4.5 m · ≈4.3 s on screen (≈0.5 throw + 0.6 race + 0.25 rise + 0.22 stand + 0.4 fall + 0.6 geyser + 1.8 drying)

## Read in one line
A bead of blood is flung to the near rim, turns and races round the circle as a glowing rope cutting a groove, stands up into a 3 m spinning wall of dark wet blood shaped like a breaking wave, falls inward dragging everything with it and bursts in the middle into a dark geyser and mist over a splat with smeared drag marks.

## Beats
| t (s) | Beat | On screen |
|---|---|---|
| 0.0–≈0.5 | Anticipation / travel | Red bloom at the hand; the bead arcs low to the near rim. |
| ≈0.5–1.1 | Race | It turns and runs the rim, accelerating ×2.6: a wet rope with a hot swollen head, a groove filling behind it, spray flung outward; rim bodies are clipped. |
| ≈1.1–1.35 | Rise | The ring stands up (outBack) into a wall 3 m tall: thick bulging foot, crest curling 0.55 m inward, torn lip with a thin pale foam band; body dark #24020a → #9a1222, hot #ff2e46 only on streak crests. |
| ≈1.35–1.57 | Stand | The wall spins at full height, streaks racing round it, crest spray thrown off. |
| ≈1.57–1.97 | Fall | The foot races inward, the crest leans in and climbs a little, a ring of bent air runs in with it; bodies are dragged to the centre; drag marks smear across the floor. |
| ≈1.97 | Impact | It meets itself: a faint red shell, 80 dark blood-mist billows, 280 drops up as a geyser, a 6 m shockwave, flash 0.35, shake 0.6; dragged bodies thrown up. |
| ≈2.0–2.6 | Linger | The geyser keeps spouting; the splat spreads 1.6 m; bodies bleed. |
| ≈2.6–4.4 | Exit | Channel, drag marks and splat dry to brown #2e1410 and erode on noise. |

## Layers
1. Race — parameter-space tube along the rim arc, lit wet blood.
2. Wall — parameter-space band, wave profile in the vertex stage (foot bulge, crest curl, lean, torn crest), lit deep blood.
3. Channel — groove, drag marks, splat, drying.
4. Head glow — billboard bloom.
5. Implosion warp — `LAYER.DISTORTION`.
6. Drops (DROPLET), spray (STREAK), mist (SMOKE).
7. Burst — WATER shell, SHOCKWAVE, flash, shake, light.

## Palette (one ramp)
foam #ff9aa6 / bloom core (cores only) → hot #ff2e46 → body #9a1222 → deep #24020a (carries the wall, drops, mist).

## Changed in the upgrade
Wall 2.3 → 3 m with a breaking-wave profile and a stand beat (`wallHoldTime`); wall shader re-weighted so the deep stop carries it; pale burst shell made faint and replaced in mass by dark mist; drop/mist ramp darkened; shock colours deepened. New keys: wallHoldTime, wallCurl, wallFoot, wallDeep, burstMist, burstShellOpacity, burstShellIntensity (7), all in the editor.
