# Zephyr Shuriken — `codex/zephyr`
Wind · line · range 2–20 m · no zone (cyclone foot 0.5 m, top 2.3 m, eye 2.6 m) · ≈ 4.1 s on screen (≈0.6 travel at 24 m/s + 2.2 cyclone + 1.3 settle)

## Read in one line
Three 2.3 m jade-and-white shuriken of air braid down the line, cutting dark furrows under looping scuffs, close together at the end and fold into a 4.6 m twisting cyclone that leans and precesses over a scoured spiral eye, then lifts off and unravels from the foot.

## Beats
| t (s) | Beat | On screen |
|---|---|---|
| 0.00–0.12 | Anticipation | The three discs snap open off the hand (outBack) at 1.35 m, dust gust at the feet. |
| ≈0.05–0.6 | Travel | Three 1.15 m-radius discs, tipped 0.55 rad toward the thrower so they show their faces, braid on a 4.2 m pitch ±1.45 m; each a lit jade body (#0a3530 → #3cc39e, bevelled, leading half brighter) under an additive white edge, spin blur and fringe. Under each strand a combed deep #10302b furrow 0.84 m wide with thin rim-loop scuffs over it; streaks, leaves and dust shed; bodies crossed are sliced and whirled. |
| ≈0.6 | Impact | The discs fold together (spin ×3) and burst: AIR shell 3.6 m, shockwave 5 m, dust ring, leaves/dust/streaks thrown, flash, knock 0.3, light ×1.3. |
| ≈0.65–2.4 | Linger | The cyclone stands up with an overshoot over 0.35 s: 4.6 m funnel, foot 0.5 m, top 2.3 m, banded white→#bff7e6→#3aa88c core over a lit dust sheath (#0a2b26 → #3d8f7b), spinning 9 rad/s, its spine leaning 0.16 m/m and precessing 1.6 rad/s round the foot while it snakes 0.55 m — the silhouette changes every frame. A spiral eye (r 2.6 m, 3 arms, deep core, pale heaped rim) is scoured into the floor under it; leaves spiral up, dust skirts the foot; bodies near it are knocked down and whirled up. |
| ≈2.2–2.85 | Exit | From 72 % of its life it unravels from the foot up along a burning edge while lifting 1.6 m. |
| 2.85–4.1 | Settle | Furrows, loops and eye erode raggedly; dust settles. |

## Layers
1. Disc bodies — `createZephyrDiscMaterial('body')`, normal-blended lit polar SDF (3 meshes).
2. Discs — additive polar-SDF shuriken (`createZephyrDiscMaterial(false)`).
3. Lenses — `LAYER.DISTORTION` twist per disc.
4. Ground strip — `createZephyrScuffMaterial`: three furrows, loop coils, dust bands, the cyclone eye.
5. Cyclone core + sheath — `createZephyrCycloneMaterial(false/true)` on a 48×28 grid, spine lean/precess/snake in the vertex stage.
6. Particles — STREAK, LEAF (lit), SMOKE dust.
7. World — AIR burst, SHOCKWAVE + DUSTRING, flash, shake, light.

## Signature
Three braided blades that become one storm: the braid's three strands close on the end point and the cyclone that stands there never holds still — its lean swings round its own foot.

## Palette
core #ffffff, tint #b6f7e2 / #d6fff2, body #3cc39e / #3d8f7b, deep #0a3530 / #0a2b26 (ground deep #10302b)

## Gameplay
`handlesOwnHits`: unchanged — each disc slices what is inside its rim (`dummy.kill(…, true)`) and whirls the halves with `dummy.carry`; the cyclone knocks down and lifts bodies within `max(puffRadius, 0.7·puffTopRadius)·grow` and releases them when its life ends. Bounded by `MAX_SPUN` = 12.
