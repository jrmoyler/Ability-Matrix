# Sumi Tide — `linear-extended/ink`
Water (ink-wash) · zone · range 0–22 m (capture: 15.4 m) · zone radius 5 m · ≈ 7.6 s on screen (0.21 travel + 5.4 stand + 2.0 drain)

## Read in one line
A loaded brush stroke runs to the circle, paper soaks into the stone and black ink floods it, a 1.85 m wall of teal water stands round the boundary while a 3.6 m ink jet goes up the middle; the jet falls back, a throat opens, and everything inside is wound round and pulled under.

## Beats
| t (s) | Beat | On screen |
|-------|------|-----------|
| 0.00–0.21 | Anticipation + travel | Brush stroke at 74 m/s from 1.12 m; splatter flecks thrown clear and dried. |
| 0.21–0.76 | Impact (flood) | `floodTime` 0.55 s: the wash spreads to 1.24 × R, ink floods to 1.0 × R; crown of water rises; jet climbs to 3.6 m; 7.5 m shockwave (#dff2ef/#3d777c), shake 0.55, flash kept to 0.05 — it is a *dark* ability. |
| 0.76–1.91 | Linger (drain) | `drainTime` 1.15 s later the jet falls back and the throat opens at the centre. |
| 0.21–5.61 | Linger | `_swell` envelope breathes the pool, heaves the crown, thickens the ink veil (3.2 m high, absorbing), speeds the vortex; on `tideThreshold` crossings a ripple, a spray throw and a 0.022 knock. Brush-stroke ripples run 0.42 radii/s. Bodies go limp, float, are wound in (spinning while carried round) and sink one at a time at the middle, each with a splash. |
| 5.61–7.61 | Exit | `fadeTime` 2.0 s drain; stain r 4.6 m (#0a1418) stays. |

## Layers
1. **One painted surface** for puddle + ripples (+ distortion read) — `materials/InkPoolMaterial.js`: watercolour wash with dendritic wicking, dried dark rim, granulation (paper #ded8c9 / #8f8a7c, ink #05070b, wash #101f26, water #134b55 / #04141b, foam #e6f4f1, rim #8fd8d0).
2. **Crown & jet** — `materials/InkCrownMaterial.js`.
3. **Ink wisps volume** — `materials/InkVolumeMaterial.js`: raymarched, absorbing, hollowed into a funnel, wound hardest at the axis (#04070a → #12363d → #4e8f92, light #bfe6e0).
4. **Water-surface distortion** — `LAYER.DISTORTION` proxy reading the same ripple field.
5. **Splatter / droplets / spray / haze** particles.

## What the capture shows
- **f8 (0.27 s)** — the flood begins: a dark swirling disc with a pale-blue dome of water rising in its middle.
- **f20 (0.67 s)** — the full 10 m pool: dark teal water with a jagged, foamy off-white rim (the wall of water / paper edge), a pale water jet climbing out of the centre past the top of frame.
- **f40 (1.33 s)** — the jet narrows into a twisting spout; the rim crown heaves.
- **f70 (2.33 s)** — jet gone, the throat open: a dark rippling pool with a pale serrated rim. At 8 m the "ink" reads more as dark water than black sumi; the read is carried by the torn pale rim against the dark disc.

## Signature
**Four layers painted as one surface** so they cannot sort against each other, and a *dark* palette that absorbs rather than glows.

## Palette
core #e6f4f1 (foam), tint #8fd8d0, body #134b55, deep #05070b

## Gameplay
`handlesOwnHits`: grip with zero impulse/lift/spin; bodies float, spiral in over `spiral` seconds and `Dummy#sink` at the centre. Cooldown 2.8 s.
