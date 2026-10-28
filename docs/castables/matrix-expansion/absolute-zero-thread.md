# Absolute Zero Thread — `matrix-expansion/absolute-zero-thread`
Frost · line · range 1–20 m (capture ≈14.3 m) · no zone (terminal cluster r 1.0 m) · ≈3.5 s on screen (0.7 s travel + 0.25 s impact + 2.55 s linger/exit, × `global.lifetime`)

## Read in one line
An ice needle draws a filament of supercooled light down the line and a herringbone of lit ice crystals tears out of the frost behind it, ending in a spire cluster round the bodies it freezes; pulses of cold ratchet the crystals taller, then they shatter from the end back to the hand.

## Beats
| t (s) | Beat | On screen |
|---|---|---|
| 0.00–0.12 | Anticipation | The needle (0.9 m faceted spike) grows out of the hand (outBack); rime starts at the feet. |
| 0.12–0.7 | Travel | Needle at 20 m/s trailing the braided filament (0.4 m wide strip pair, arcing to 0.77 m), frost dust; behind it the rime path (2.3 m wide voronoi plates) and the frost spine: 30 opaque sun-lit crystals alternating sides, 0.3 m at the hand to 1.7 m at the end, 0.2–0.6 m off the line, leaning out 0.42 rad and raked downrange 0.3 rad, each grown over 1.8 m of run (outBack). Bodies within 0.8 m of the line are queued to freeze 0.25 s later. |
| 0.7 | Impact | Terminal cluster: a 3.4 m spire + 7 crystals 2.2 m tall ringing it at r 1 m, leaning out 0.5 rad, grown in 0.28 s and flashing white; FROST shell → 2.2 m, FROST decal r 1.5 m, knock 0.22, light punch. Frozen bodies become ice statues (climbing ice, rosette, shard ring). |
| 0.95–2.0 | Linger | Pulses of cold run the thread at 9 m/s (1.4 m wide): each crystal flares white and ratchets 14 % taller as one passes; the spine creeps 12 % taller; filament waves and sifts dust; statues stand 1.5 s and shatter into chips + vapour with a flash. |
| 2.0–3.5 | Exit | Shatter sweep from the cluster back to the hand: each crystal shrinks and bursts into 8 lit ice chips (cluster 20) with vapour; the filament breaks up through a noise dissolve and the rime melts plate by plate. |

## Layers
1. Filament — crossed strips rewritten per frame, `createThreadMaterial` (additive, strands, crystal cells, dissolve).
2. Needle — faceted crystal, `createNeedleMaterial` (fresnel).
3. Rime path + chill — `createRimeMaterial` ground strip; `createChillMaterial` on `LAYER.DISTORTION`.
4. Frost motes — baked points.
5. Frost spine + terminal cluster (hero) — instanced `createIceShardGeometry` crystals, `createSpineMaterial` (MeshStandardMaterial patched: deep stop in turned facets, frost clouding, fresnel rim, per-instance pulse), `LAYER.WORLD`, casting/receiving shadows.
6. Statues — skinned ice clones (`createStatueMaterial`), rosette, shard ring, baked chip bursts.
7. Particles — `.rime` (SOFT), `.chips` (lit CHIP), `.vapour` (SMOKE).
8. Beats — FROST bursts, FROST decals, flash, shake, light.

## Signature
The thread grows a spine: crystals torn up along a line of light, pulsed taller by cold running down it, then shattered back toward the hand.

## Palette
core #ffffff, tint #d8f6ff / #bdf1ff, body #8cc8ec / #5cc4ff, deep #0b2f5c

## Gameplay
`handlesOwnHits`, unchanged: the needle's crossed segment is scanned each frame; bodies within `reach` freeze after `freezeDelay`, stand `freezeDuration`, shatter and vanish (`frozenOwners` guards pooled dummies). The spine is presentation only.
