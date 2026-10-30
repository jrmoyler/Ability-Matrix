# Nebula Collapse — `codex/nebula`
Cosmic · zone · range 0–16 m · zone 4 m · ≈ 5.7 s on screen (≈0.4 travel + 1.0 gather + 1.3 collapse + 0.7 blaze + 0.9 nova + 1.8 remnant)

## Read in one line
A seed of light flies over the circle and a flattened violet nebula with dark dust lanes gathers at 2.5 m — its height derived from the circle so it sits in frame — while the floor beneath sinks into a spiralling gravity well; the cloud falls in on itself, drags the bodies up into orbit round a newborn star and its accretion disk, then goes supernova and throws them.

## Beats
| t (s) | Beat | On screen |
|---|---|---|
| 0.0–0.4 | Anticipation + travel | A tiny white-gold star in a violet corona climbs from the hand to the heart (zoneRadius × 0.58 + 0.15 m) shedding violet wisps. |
| 0.4 | Impact | Seed bursts into dust; a faint ring marks the circle. |
| 0.4–1.0 | Gather | 30 puffs (2.7 m) fill a 4.4 m-radius, 0.85 m half-thick disc: violet body (#6f2ee6) with teal/magenta accent puffs, over deep normal-blended dust lanes (#14062e) that give it a body against the floor; stars twinkle inside. The floor under it darkens into a gravity well (r 4.6 m) whose four log-spiral dust arms start to wind. |
| 1.0–1.9 | Collapse | Inside falls first, winding into a spiral and spinning up; collapsed gas thins into the forming star. The well's arms wind inward faster and lit floor chips are dragged across it toward the heart. Bodies in the circle are tipped in and hauled up into an orbit round the core. Rumble. |
| 1.9–2.4 | Blaze | The protostar (orange-gold body, white-gold heart) burns inside a tinted corona and a violet accretion disk (white only at the inner lip, deep between arms); it implodes at the end. |
| 2.4–3.3 | Supernova | Shell tears out (hot rim cooling pink→violet→teal), ground shock front + starburst, AIR shell, dust and sparks, flash, knock; held bodies thrown outward. |
| 3.3–5.1 | Linger / exit | Remnant ring widens and fades in the disk plane; the well remains as a fading scar; the starburst cools. |

## Layers
1. Gas — `createNebulaGasMaterial()` additive fbm puffs, accent share `gasAccent`, deep stop in thin parts, `collapseThin`.
2. Dust lanes — `createNebulaGasMaterial(true)`, normal-blended deep pass under the gas.
3. Stars, protostar, corona, accretion disk, nova shell, remnant ring (bespoke shaders).
4. Gravity well — `createNebulaWellMaterial`: deep sink, winding spiral arms, violet lip, scar.
5. Ground — glow, faint ripples, shock front, starburst.
6. Lens — `LAYER.DISTORTION` pinch then shell push.
7. Particles — wisps (SOFT curl), dust (SOFT), sparks (STREAK), floor chips (CHIP, lit).
8. World — SHOCKWAVE, DUSTRING, AIR burst, flash, shake, light.

## Signature
The floor itself is pulled into the cloud's gravity — a dark spiral well and dragged chips under a dark-laned nebula that collapses into a star.

## Palette
heat #fff0d2 · tint #d8b4ff · body #6f2ee6 (accents #1f9f9c / #c23a95) · deep #14062e

## Gameplay
Unchanged hit rules (`handlesOwnHits`: grab within zoneRadius × grabReach, carry into orbit, throw at the supernova, kill standing bodies in the blast). The beat lengths are unchanged (gather 1.0, collapse 1.3, hold 0.7 s) because they set when the grab and throw happen; capture the star and nova with `--frames` past 2.3 s.

## Fix pass (fix-7)
Coordinator read: mid-collapse cloud thin, centre blooms too bright, floor partly concentric rings. Timing unchanged (gather 1.0 / collapse 1.3 / hold 0.7 s); later beats captured with `--frames=40,60,90,105`.
- Dust body: half-thickness 0.55 → 0.85 m and the falling cloud keeps 55 % of it (`collapseThickKeep`) so it collapses to a fat globule, not a sliver; dark lanes denser (0.82), bigger, and they shrink only to `laneCoreSize` 0.8 and barely thin as they fall, so a deep-violet dust mass stays round the forming star; glowing gas thins away harder when fully collapsed (`collapseThin` 0.93) so thirty hot puffs no longer stack into a white blot.
- Star: white-gold capped (`coreHeatCap` 0.4) with darkened granulation lanes, per-channel brightness cap (`coreBloomCap`), corona hollow over the star's face and capped (`coronaBloomCap`), disk inner lip half-hot and dimmer — the star reads as an orange boiling ball, not a bloom.
- Floor: the well is a filled mottled deep field with broad dust arms (`wellArmLight`), softer lip; the inward ripples are broken along the spiral and by noise and dimmed (0.08) — no concentric outline rings.
