# Glamour Sweep — `codex/glamour`
Illusion · line · range 18 m · sweep 1.45 m (swing reach ≈ 2.1 m each side) · ~2.8 s on screen (travel ≈ 0.42 s at 32.4 m/s, impact 1.15 s, fade 1.25 s)

## Read in one line
A tall crescent blade of black-plum lacquered steel, pink only along its cutting edge, flies down the line drawn back to one side. A holed, pink-edged false copy runs ahead of it and makes the swing first. Then the real blade swings across the targets, bites its heel into the floor, ploughs on sideways, and its glamour peels away from the tip down.

## Beats
| t (s) | Beat | On screen |
|---|---|---|
| 0.00–0.05 | Anticipation | Hand flare and sparks. The blade leaves the fist at 0.3 × size. |
| 0.00–0.42 | Travel | The blade (3.7 m tall at full size, face to the camera) grows as it flies and draws back to the left (`bladeShear`), leaning into the motion. The false copy (0.8 × size, dim and broken: eaten through, with only a faint glamour edge) runs 0.38 of the travel ahead. It reaches the targets first, swings across them (it hits nothing) and pre-draws a faint pink line on the floor. An afterimage copy trails 0.14 behind. Over the last 28 % of the travel the real blade swings right across the line, edge first, turning 0.3 rad. Hits are the template's `late` strike at the head. |
| 0.42 | Impact | The false copy burns away. The blade carries 18 % past the swing and grows to 1.55 × and bites its heel 0.2 m into the floor, leaning 0.8 rad so the crescent's curve arches over the targets, its edge picked out by a cold steel limb. You get a small shake, a light punch, lacquer chips, and sparks thrown along the swing. The cut opens hot on the floor: a 5 m wide dark gouge across the line with a pink-white seam. |
| 0.42–1.9 | Linger | The blade ploughs on 0.8 m sideways through the floor, throwing sparks and chips off its heel and rocking as it goes. The cut's seam cools from pink-white to pink on a dark plum bed. |
| clock 1.05–1.97 | Exit | The glamour peels from the tip down behind a burning pink front that sheds motes, until nothing is left above the floor. The cut fades over the last 15 %. |

## Layers
1. Blade: `GlamourSweepSignatureGeometry.createGlamourBladeGeometry` is a crescent loft with a lens section: a thick spine, a scalloped back and a sharp convex edge. The material is `createGlamourSweepBladeMaterial(0)`: a patched MeshStandard on LAYER.WORLD that casts shadows. Its lacquer runs from deep to body, with engraved filigree, a hot edge, and a dissolve peel.
2. False copy and afterimage: the same geometry with `createGlamourSweepBladeMaterial(1)`, eaten through by drifting holes whose lips burn pink. These are alpha-tested, not translucent.
3. Cut: `createGlamourSweepCutMaterial` on a floor plane. It is a filled tapered slash with a hot seam and shear marks. It opens along the swing and cools.
4. Particles: sparks along the cut, plough sparks and chips, and peel motes. These use the template systems.
5. Template: the scar trail along the path, a faint ground field, the residue decal, and the aftershock.
6. Turned down: the sheet body (0.06), voice, hero rig, petal pieces, burst shell, shock ring, ribbon and ground field (0, which removes the pink haze along the line). The scar is dimmed and the wake decals are small.

## Signature
The glamour shows the cut early: a holed pink-edged copy swings first. The steel lands it late: the dark blade swings through the copy and bites into the floor.

## Palette
core #ffe8f6 · tint #f25fb0 · body #3e1a38 (lacquer) · deep #12060e (bed #14040d)

## Gameplay
Unchanged. Hits are the template's `late` strike, the side blow and the mark. The swing reach is derived from `sweep × bladeCutReach`, so the sweep slider re-fits the swing mid-cast.

## Honest status
8/10. The blade in flight, the dim broken false copy, and a large steel-edged crescent biting the floor over a wide dark gouge all read at 8 m. The weakest part is the exit, where the peeling blade lies low.
