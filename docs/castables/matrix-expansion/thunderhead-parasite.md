# Thunderhead Parasite — `matrix-expansion/thunderhead-parasite`
Storm · zone · range 0–18 m · attach radius 2.5 m · ≈ 0.3 s travel + 6 s ride + 0.6 s rain-out

## Read in one line
A small storm is thrown on a crackling leash, heaps up into a 4.4 m bruise-dark cauliflower thunderhead over its victim, bites it with a bolt, and rides it — raining, flickering with sheet lightning and feeding on it with smaller bolts that burn the floor — until it rains itself away.

## Beats
| t (s) | Beat | On screen |
|-------|------|-----------|
| 0.00–0.45 | Anticipation + travel | Stormlet (0.4 × cloud ≈ 1.7 m) condenses out of noise; a jagged violet **leash** strand (r 0.06 m) runs from the caster's hand (1.4 m) to it. |
| 0.45 | Impact | Downdraft: DUSTRING r 2.4 m, AIR shell, mist puff; the cloud heaps up to ≈ 4.4 m across with its belly at 3 m; next frame the **bite**: a 0.4 m-wide bolt cloud → host's feet with two 1.3 m branches, a white-violet **contact flare** (1.1 m star) at the foot, STORM shell, ARC + SCORCH burn, sparks, the belly and crevices flood, the floor crackle net flares, knock + flash. No host → the bite grounds on the circle. |
| 0.45–6.45 | Linger | The cloud never sits still: every one of its 42 lobes boils on its own phase, the crown wheels against the belly (updraft shear 0.12 rad/s), the anvil spreads out sideways and the whole cloud swells 14 % as it feeds; each bolt heaves the lobes out. Crevices smoulder violet between flashes; sheet lightning lights pockets from inside. Tether strands crackle onto the host; rain falls into a dark wet pool whose centre chars black and over which a jittering net of charge crawls. Feeding bolts every 0.85 s ± 50 % (0.85 × strike), each with flare and burn; every host attack answered by a full retaliation bolt. |
| 6.45–7.05 | Exit | Feeding stops, the cloud spreads 25 % and dissolves by noise while the rain thickens, then it is gone. |

## Layers
1. Thunderhead — `createCloudGeometry`: 42 lumpy lobes (flat belly ring, stacked tower, budding turrets = cauliflower, sheared anvil), each vertex carrying its lobe centre (`aCenter`) and a baked crevice burial (`aOcc`). `createCloudMaterial`: per-lobe boil, shear twist, anvil spread, strike surge in the vertex stage; deep → body → crown ramp shaded off `uLightDir`, crevices darkened by `aOcc`, silver lining, sky fill, crevice ember, inner sheet lightning leaking through gaps; depth pre-pass.
2. Tether / leash strands, strike bolt + branches (thicker ribbons), contact flare billboard (`createFlareMaterial`).
3. Shadow pool (`createShadowMaterial`): ragged dark pool, wet rim, rain pocks, F2−F1 voronoi **crackle net** flaring on strikes, charred centre growing over the ride.
4. Rain STREAK, mist SMOKE, spark STREAK.
5. Decals: DUSTRING (arrival), ARC + SCORCH per bite/feed/strike; STORM/AIR bursts.
6. Downdraft warp on `LAYER.DISTORTION`; light inside the cloud with stutter.

## Signature
A living weather system on a body: a black, boiling thunderhead that follows its host and eats it in bites.

## Palette
core #ffffff / #c9c4ff, tint #6a73b4, body #1d2145, deep #020208

## Gameplay
`handlesOwnHits`; on arrival attaches to the nearest live enemy within `attachRadius` and subscribes to `hit` / `cast-start`; each host-owned event (deduped, `reactionCooldown`) emits one storm hit of `retaliation`. The bite and feeding bolts are presentation only and emit nothing.

## Second pass (size and value)
- Size from the zone: `cloudZoneSpan` (1.4) × the attach circle's diameter → ≈ 7 m across over the 2.5 m circle (`cloudSize` is now the minimum; the stormlet in flight still uses `cloudSize`). The cloud rises by its extra belly depth so the belly stays at `cloudHeight`; `cloudFlatten` 0.72 so it spreads wide over the 7-dummy cluster.
- Value: body slate-indigo #1d2145 × `cloudShade` (0.62), base near-black (lower 45 % of the tower multiplied down to 0.3, deep #020208), crown tint held to the very top sun faces (`cloudCrownLight` 0.2, tint #6a73b4), thinner lining, `cloudSkyFill` 0.15.
- Lightning only through the gaps: crevice = buried vertex × facing away (`aOcc` × (1−n·v)^1.5); dense faces take only `cloudFlashWash` (0.03) of a flash; a harder soft-clip. A bolt no longer washes the cloud lavender — the gaps and belly rim light, the lobes stay black against it.
- Downdraft warp 0.18, strike warp kick 0.6, so the bolt stays a crisp line through the warp.
- New keys: cloudZoneSpan, cloudShade, cloudSkyFill, cloudFlashWash (all sliders).
