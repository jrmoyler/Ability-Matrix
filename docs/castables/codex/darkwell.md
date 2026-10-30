# Dark Matter Well — `codex/darkwell`
Gravity (Cosmic) · zone · range 2–18 m · zone radius 4.8 m · ≈5.3 s on screen (≈0.4 travel at 22 m/s + 0.35 sag + 1.35 swallow + 0.42 pulled down + 0.5 spring shut + 2.0 linger/erode)

## Read in one line
A bead of ink is lobbed to the circle and the floor visibly **sags** into a 3.4 m bowl — a dark violet sheet whose far wall catches the light and whose depths go black. A wall of dark matter stands up at the rim and closes inward like an iris while a pure-black pit opens at the eye, ringed by a thin hot ring of bent light. The wall becomes a churning ring round the pit, is pulled down the throat, the well springs shut with a violet crack — and a dent stays, breathing, its ink still winding in spiral arms into the shrinking pit, before the stain erodes.

## Beats
| t (s) | Beat | On screen |
|---|---|---|
| 0.00–0.4 | Anticipation / travel | A black bead in a thin lensed violet ring (0.42 m) arcs 1.6 m to the circle, trailing motes. |
| ≈0.4 | Impact | The bead sinks into the floor: a 4.3 m violet shockwave, 30 sparks, a light knock (0.25) and a faint flash (0.05). |
| ≈0.4–0.95 | Sag | The floor under the 4.8 m circle sags (outCubic, 0.55 s) into a bowl + throat 3.4 m deep: a deep #1a0c2c sheet with a saturated #5e1e94 body on the lit far wall, black at the bottom, a violet grid whose rings flow in and spokes wind into a spiral, dying with depth. The lens pulls the world inward. At the rim a 1.7 m wall of near-black ink tongues with violet crests stands up (outBack, 0.4 s). |
| ≈0.75–2.1 | Linger (swallow) | The front closes from the rim to the eye (1.35 s); behind it the sheet is drowned in ink wound with three spiral arms of violet that turn into the eye, veins and cold stars. A black pit opens at the eye, growing from 0.05 to 0.21 × radius, ringed by a hot #e2d4ff photon ring. The wall grows to 2.7 m as it closes and stops as a churning ring 1.4 m round the pit; ink is torn off its crest and motes stream in. Bodies the front passes are knocked in, carried round, in and down, and swallowed. |
| ≈2.1–2.5 | Collapse | The wall is pulled down the throat (inCubic, 0.42 s). |
| ≈2.5 | Shut | The well springs shut with an overshoot: 160 sparks up the throat, an AIR shell, a 7.7 m shockwave, knock 0.6, a light punch, a faint flash. It does not go flat: 38 % of the dent stays and the pit stays at 60 %. |
| ≈3.1–5.1 | Linger / exit | The dent breathes (±18 %, 1.6/s) as it relaxes over ≈1.7 s; the ink keeps winding in its spiral arms, motes spiral into the shrinking pit, a thread of ink smoke is breathed out of it, the lens stays on it. The pit closes, then the ink stain erodes in patches from the rim in. |

## Layers
1. The seed: a billboard — ink bead, lensed ring.
2. The well: `createWellMaterial` — a polar grid (72 × 128) dropped in the vertex stage into throat + broad bowl; depth-shaded, wall-lit, grid, front, spiral-armed ink, black pit + photon ring; drawn below the floor with its own depth, a constant 8 cm in front of the floor (the old depth-decaying bias let the deep sheet z-fight the floor and vanish — the old "outline-only" late frames).
3. The curtain: `createCurtainMaterial` — an open cylinder of ink tongues with violet crests, closing to a ring round the pit, pulled down the throat.
4. The lens: `LAYER.DISTORTION`, pulling the light inward along the front and toward the eye, kept on the dent while it relaxes.
5. Ink & motes: non-additive SMOKE ink (off the crest, out of the pit), additive SOFT motes (in off the front, spiralling into the pit).
6. Landing & closing: SHOCKWAVE decals, AIR shell, STREAK sparks, shake, light, faint flash.
7. The swallow: `handlesOwnHits` — unchanged.

## Signature
The floor itself sags into a bowl with a black, light-eating pit at its eye — and the dent is still there, breathing, after it shuts.

## Palette
core #ffffff / #e2d4ff (photon ring, sparks only), tint #a27cff (front, crests), body #5e1e94 (lit wall, spiral arms), deep #1a0c2c sheet / #05020b ink / #000000 pit

## Gameplay
Unchanged. The swallow's own front (`this._front`) still runs from the rim to 0.03 × radius over `swallowTime`; only the *drawn* wall stops at `curtainMin`. Capture, carry, sink and consume use the original throat profile (`_shape`); the broad bowl is drawn only. Bounded by `MAX_GRIPS` = 12.

## New settings (presentation)
`bowl`, `bowlPower`, `depthFalloff`, `wallLight`, `residualSag`, `relaxWobble`, `relaxRate`, `lingerLens`, `colorBody`, `horizonMin`, `horizonMax`, `horizonLinger`, `photonGlow`, `photonWidth`, `spiralArms`, `spiralTight`, `spiralGlow`, `lingerMotes`, `lingerSmoke`, `colorPhoton`, `curtainMin`.
