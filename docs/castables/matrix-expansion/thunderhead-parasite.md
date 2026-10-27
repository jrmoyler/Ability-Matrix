# Thunderhead Parasite — `matrix-expansion/thunderhead-parasite`
Storm · zone · range 0–18 m · attach radius 2.5 m · ≈ 0.3 s travel + 6 s ride + 0.6 s rain-out

## Read in one line
A small storm is thrown on a crackling leash, heaps up into a 4 m indigo thunderhead over its victim, bites it with a bolt, and rides it — raining, flickering with sheet lightning and feeding on it with smaller bolts that burn the floor — until it rains itself away.

## Beats
| t (s) | Beat | On screen |
|-------|------|-----------|
| 0.00–0.3 | Anticipation + travel | Stormlet (0.4 × cloud ≈ 1.7 m) condenses out of noise; a jagged violet **leash** strand runs from the caster's hand (1.4 m) to it. |
| 0.3 | Impact | Downdraft: DUSTRING r 2.4 m, AIR shell, mist puff; the cloud heaps up to 4.2 m across at 3.4 m height; next frame the **bite**: a full bolt cloud → host's feet with two branches, STORM shell, ARC + SCORCH burn (3.5 s), sparks, flood from the belly, knock + flash. No host → the bite grounds on the circle. |
| 0.3–6.3 | Linger | Cloud boils (fbm billow), wheels, bobs and trails its host on a spring; tether strands crackle onto its shoulders; rain (160/s) falls into a wet, rain-pocked shadow pool; sheet lightning lights it from inside 1.6×/s; **feeding bolts** every 0.85 s ± 50 % (0.55 × strike) leave more burns. Every host attack is answered by a full retaliation bolt. |
| 6.3–6.9 | Exit | Feeding stops, the cloud spreads 25 % and dissolves by noise while the rain thickens, then it is gone. |

## Layers
1. Thunderhead — eleven-lobe cumulus with sheared anvil (`createCloudGeometry`), crown-lit/belly-dark billow shader + depth pre-pass, belly-weighted soft-clipped strike flood.
2. Tether / leash strands and strike bolt + branches (`createBoltMaterial`, world-space ribbons).
3. Shadow pool with wet rim and rain pocks (`createShadowMaterial`).
4. Rain STREAK, mist SMOKE, spark STREAK.
5. Decals: DUSTRING (arrival), ARC + SCORCH per bite/feed/strike; STORM/AIR bursts.
6. Downdraft warp on `LAYER.DISTORTION`; light inside the cloud with stutter.

## Signature
It is a weather system that lives on a body: a cloud that follows its host and eats it in bites.

## Palette
core #eef1ff, tint #7c86d6, body #2c2f78, deep #06061a

## Gameplay
`handlesOwnHits`; on arrival attaches to the nearest live enemy within `attachRadius` and subscribes to `hit` / `cast-start`; each host-owned event (deduped, `reactionCooldown`) emits one storm hit of `retaliation`. The bite and feeding bolts are presentation only and emit nothing.
