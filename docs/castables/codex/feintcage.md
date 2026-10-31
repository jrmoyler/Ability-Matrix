# Feint Cage — `codex/feintcage`
Illusion · zone · range 2–18 m · zone radius 4.7 m · ≈2.95 s on screen at 13 m (≈0.45 s throw + 1.25 s impact + 1.25 s fade)

## Read in one line
Two sheaves of dark spear-bars tumble from the hand. They burst open and stab into two rings around the targets, and the rings turn opposite ways. Then the outer cage (the feint) glitches apart into motes, and the real cage clenches in like a claw, its blades flashing hot. It grinds round as the blades cool, then sinks.

## Beats
| t (s) | Beat | On screen |
|---|---|---|
| 0.00–0.45 | Anticipation / travel | A flare and sparks at the hand. Two sheaves of 9 bars each (1.5 m long, 1.3 m sheaf radius, so each bar reads on its own) tumble end over end along a low 0.45 m arc to 1.5 m over the circle, broadside to the camera, 2.3 m apart side by side. The real sheaf is near-black plum with pink collars. The feint sheaf is a dim violet afterimage: translucent, scan-sliced and slipping sideways, tumbling the other way. |
| ≈0.45–0.69 | Impact (the plant) | Both sheaves burst. Each bar swings upright and stabs down into a ring: the real cage at 0.8 × the circle (3.8 m), the feint at 1.02 × (4.8 m). Dust and chips kick from every foot, with a thud and a light punch. A dark plum stain lands out to 1.12 × the circle. |
| 0.69–1.23 | Linger: the feint | The cages turn opposite ways (+1.4 / −1.9 rad/s). The real feet plough a dark groove in the stain, glowing pink only right under each foot, and sparks fly off them. Under the feint there is only a flickering violet dashed phantom ring. The two cages read apart at a glance: solid near-black bars, and translucent violet ghosts behind them. |
| ≈1.23 | The cut | The feint glitches apart into 120 motes over 0.35 s. The real bars lean in 0.62 rad (outBack) into a claw, and the spearheads go white-pink. There are sparks at the blades, a camera punch and a 14-unit light punch. A gash per bar is torn from its foot toward the centre. |
| 1.23–2.4 | Linger: the grind | The clenched cage keeps grinding round at 0.3 rad/s. The blades and gashes cool from white through pink to dark scars, and smoke rises off the gashes. |
| 2.4–2.95 | Exit | The bars are eaten from the top behind a hot edge as they sink 1.3 m. The stain and gashes let go from fade 1.6. |

## Layers
1. Real cage: `createFeintCageBarGeometry` (`assets/codex/FeintCageSignatureGeometry.js`), instanced × 9. Each bar has a driven foot, collars, a quarter-twist shaft and a broad diamond spearhead. Material: `createFeintCageBarMaterial` (near-black lacquer #040102 → #12040b, lit by the sun at `cageLit` 0.55 with a soft specular; pink #f25faa only in the collars and on the blade arrises; white-pink #ffd2ea at the cut; dissolve). It is on LAYER.SHAPED and casts shadows.
2. Feint cage: the same geometry and shader with `uGhost`, on LAYER.VFX. It is a translucent (`feintOpacity` 0.4) dim violet afterimage (#140c24 body, #8a6ad8 seams and rim), scan-sliced, with bands dropping out and sliding sideways. It casts no shadow.
3. Cage floor: `createFeintCageFloorMaterial`. It has a filled near-black plum stain, the dark plough groove (glowing only right under each foot), the violet phantom dashed feint ring, and the radial gashes after the cut. The template residue and telegraph decal rims were darkened (`colorGroundA` #4a1430, `colorShock*`).
4. Particles: hand sparks, foot sparks while turning, plant dust and chips, cut sparks, feint motes and gash smoke.
5. Decals: footprint telegraph, a dark residue scorch and the aftershock dust ring.
6. World: plant, cut and aftershock shakes and light punches. The flash is a 0.04 tint.

Turned down in the config: body, voice, lens, template field, detail pieces, rig, burst shell, shock ring and template shed rates.

## Signature
Two cages turning against each other; one is a lie and comes apart, the other closes like a claw.

## Palette
core #ffd2ea · body #f25faa (collars and blade edges only) · deep #040102 / #12040b lacquer, #0a0306 floor · feint #8a6ad8 / #140c24 violet

## Gameplay
Unchanged. The hit lands at impact (`commit`) on everything within max(zoneRadius, hitRadius) of the centre, pulled in and orbited (`orbit`).
