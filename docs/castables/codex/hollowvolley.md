# Hollow Volley — `codex/hollowvolley`
Void · line · range 18 m · no zone · ~2.6 s on screen (travel ≈ 0.4 s at 24 m/s, impact 1.05 s, fade 1.25 s)

## Read in one line
Six obsidian seeds leave the hand one after another on high arcs, land in a staggered row down the line, and each one collapses in on itself and leaves a turning black-violet hole in the floor that folds shut at the end.

## Beats
| t (s) | Beat | On screen (shape, size in m, colour, motion) |
|---|---|---|
| 0.00–0.05 | Anticipation | Violet flare and sparks at the fist (0.22 m). The first husk appears at the hand. |
| 0.00–0.40 | Travel | `count` (6) husks, 1.15 m tall. They are solid, matte, sun-lit dark husks with narrow violet slits, and they tumble along ballistic arcs about 2.6 m high from the hand to staggered points along the line (±0.9 m to each side). Each lands when the head passes its part, at the same moment that part's hit fires. |
| per landing | Impact | A thud (shake 0.16, light punch 2.4), chips and a low dust roll. The husk crumples in while it spins faster and its slits run white-hot. The last landing is the cast's beat: shake, flash and a small burst. |
| landing +0.3 → 1.6 | Linger | Where the husk was, a filled void disc 1.2 m in radius opens. It is near-black throughout: a pit. Violet shows only on three narrow spiral arms that wind inward and turn at 2.6 rad/s. A ragged stone lip about 0.36 m tall, with violet crest cracks, stands round it. Motes are drawn in from round each well. |
| fade 1.3 → 2.0 | Exit | The wells fold shut (radius → 0, eased), the lips sink and the cracks cool. The dark residue decals stay on the floor. |

## Layers
1. Seeds: `HollowVolleySignatureGeometry.createHollowVolleySeedGeometry` (five-lobed lathe husk, open crown) with `createHollowVolleySeedMaterial`, a patched MeshStandardMaterial on LAYER.WORLD that casts shadows. The lobe valleys split into slits (discard), and the inner face and slits are emissive.
2. Core: a small HDR icosahedron inside each husk, seen through the mouth.
3. Implosion shell: an icosphere carrier with `createHollowVolleyImplodeMaterial` (a dark shell that contracts). It is off by default (`implodeOpacity` 0) because it read as a glass bubble.
4. Wells: a flat quad with `createHollowVolleyWellMaterial`: a filled near-black pit with violet only on narrow spiral arms.
5. Lips: `createHollowVolleyLipGeometry` with `createHollowVolleyLipMaterial`: flat-shaded dark stone with emissive crest cracks, lit and casting shadows.
6. Floor: the template void strip under the line, plus a scorch residue decal at every landing.
7. Particles: motes drawn into the wells, plus landing chips and dust, plus the template shed and trail at low strength.
8. Turned down: the template arc body (opacity and glow 0), voice, wire nest rig, detail pods, shock ring.

## Signature
The pull goes in: each seed is crushed inward and leaves a hole that turns. Nothing is thrown outward.

## Palette
core #f4f0ff · tint #6a55ff · body #2a2156 / #4a33d8 · deep #07050f / #020107

## Gameplay
Unchanged. Hits come from `_strikeParts` (WHEN `part`): each of `count` parts strikes at its staggered point as the head passes, and all remaining parts strike on the beat. The seeds land on those same points at those same moments. Felled bodies are marked "hollowed".
