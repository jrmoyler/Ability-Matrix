# Redshift Lance — `codex/redshift`
Cosmic · line · range 2–18 m · ≈2.8 s on screen at 13 m (≈0.52 s travel + 1.05 s impact + 1.25 s fade)

## Read in one line
A four-bladed spear of dark blued steel flies down the line. It is sun-lit and casts a shadow, and its light runs only in a narrow glowing core line down its flutes and blade edges. It trails low and stretches from 1.5 m to 6 m long as it goes, and the core line walks from violet toward red. It plunges into the floor at the end, and its shaft swings up and aside like a landed javelin, so from behind it stands as a diagonal slash. Lodged there, it goes on reddening and cooling while the shaft comes apart into segments that settle onto the red scar it burnt down the line.

## Beats
| t (s) | Beat | On screen |
|---|---|---|
| 0.00–0.52 | Travel (hits at the head, as before) | The spearhead (1.1 × 2.4 m) rides the head of the line at 1.3 m. The fluted shaft trails it low along the line, tapering from 0.4 m to 0.14 m and stretching from 1.5 m to 6 m. The body is lit steel (#06070e, with a #2c3550 sheen and a hard sun glint). Only the core line glows violet (#6a48f0 / #b8a8ff, with a white thread at the centre). The line is already redder toward the tip and is cut by dark absorption bands that slide tipward. Light streaks run tipward along it. The template scar and the wake scorches burn into the floor behind it. |
| ≈0.52 | Impact | The head plunges 0.5 m into the floor in 0.12 s, and over 0.35 s (outBack) the shaft swings up by 0.5 rad and aside by 0.75 rad. There is a red spray back up the line (70 sparks, deep red-brown #a8301c → #1a0405 with #ff9a6a ember specks), 26 chips, dust and a 1.6 m crack, then the template beat (shake, a light punch, an ARC burn and the residue stain). |
| 0.52–1.9 | Linger: shift and cool | The core line keeps shifting until it is fully red (#fff0e8 / #ff9a7a / #e02a2a / #2a0308) 1.4 s after the hit, and dims by 70 %. The lance keeps drawing out by 1.2 m. |
| 1.1–2.2 | Linger: break-up | From 0.55 s after the hit, the shaft breaks into 9 segments. The gaps open to 80 %, and the segments drift a little down the line and settle 0.9 m toward the floor, shedding red embers. |
| 2.2–2.8 | Exit | Eaten from the tail forward behind a red edge, the head last. The scar and the wake scorches stay. |

## Layers
1. Shaft (hero): `createShaftGeometry`, a 4-fluted rod. Taper, segmentation, drift and settle are done in the vertex shader of `createRedshiftLanceSpearMaterial`.
2. Head (hero): `createHeadGeometry`, a socketed four-bladed spearhead, using the same material with the head flag. The material is lit blued steel / obsidian (key + sky + specular) on `LAYER.SHAPED`, casting shadows; a patched `MeshDepthMaterial` repeats the taper and segments, so the shadow matches. The light is a narrow core line down the flute valleys and blade edges. It runs a violet four-stop ramp into a red four-stop ramp by the local redshift, is cut by absorption bands, and the whole lance dissolves tail-first.
3. Floor: the LineTrail scar (1.0 m, dark red seam #7a1612 on a #0e0306 bed, 3.4 s), wake scorches every 1.1 m, the plunge crack, the residue and the template field at 0.45.
4. Particles: tipward streaks in flight, the plunge spray, chips and dust, and red embers in the linger.
5. World: shake, flash (0.06) and light punch on the plunge. The light is #c04a7a.

Turned down in the config: body (the violet spots), voice, lens, rig (the wire capsule), detail pieces, the trail ribbon, the burst dome and the shock ring.

## Signature
You can see the light change: a spear that leaves violet, lands red, and comes apart as it cools.

## Palette
violet: #f4f0ff · #b8a8ff · #6a48f0 · #0e0336 → red: #fff0e8 · #ff9a7a · #e02a2a · #2a0308

## Gameplay
Unchanged. `handlesOwnHits` with WHEN = travel: bodies within hitRadius of the head are sliced as it passes.
