# Aetherblade Cascade — `matrix-new/aetherblade`
Arcane · line · range 20 m · no zone (per-blade strike 1.0 m, final 2.6 m) · ~3.3 s total

## Read in one line
Cobalt crystal swords dissolve in above the line, stab down one after another onto rune circles, stand on dark indigo brands breathing rune-light, then crack and shatter caster-first.

## Beats
| t (s) | Beat | On screen |
|---|---|---|
| 0.00–0.25 | Anticipation | First swords dissolve in point-first, 2.8 m long, 0.56 m wide, hanging 1.7 m up; motes drawn into them; rune circles drawn on under them. |
| 0.2–0.8 | Travel | The invisible front calls blades down the line at 24 m/s: each hangs, draws back 0.3 m, stabs in 0.09 s. Afterimage streaks. |
| per landing / ~1.2 | Impact | Spark spray, shockwave ring, arcane shell, light punch, shake; a dark indigo SCORCH brand (1.35 m) burns under the circle. Final blade 1.5× with flash + big shake. |
| 1.2–2.4 | Linger | Blades settle 12 % deeper, runes breathe (1.3 /s), aether wisps curl off them, circles draw in to 0.62×. From ~0.9 s before the exit cracks light up the blades. |
| 2.4–3.3 | Exit | Voronoi shatter caster-first (0.07 s stagger), cells drop out, glints fall, circles flare out 2.1× and fade. |

## Layers
1. Glass swords — additive fresnel/env/rune shader, `AetherbladeCascadeMaterials.js` (`createAetherSwordMaterial`).
2. Lit core — same instanced swords, normal-blended, sun-wrapped four-stop ramp (`createAetherCoreMaterial`). Carries the mass at 8 m.
3. Rune circles — SDF instanced ground quads, contract while standing, flare out on shatter.
4. Floor brand — SCORCH decal per landing, indigo deep with blue embers, stays the whole cast.
5. Particles — forming motes (SOFT), afterimages/sparks (STREAK), wisps (SOFT curl), glints (SOFT).
6. Impact — SHOCKWAVE decal, STORM burst, light punch, shake, final flash.

## Signature
The cascade is the stagger: each blade keeps its own clock from when the front passed its station.

## Palette
core #f4f8ff (runes), tint #7cc4ff, body #1d40b4, deep #120a3c (brand #0a0620)

## Gameplay
`handlesOwnHits`: each landing kills bodies within `killRadius` (final `finalKill`), thrown outward. Unchanged by this upgrade.
