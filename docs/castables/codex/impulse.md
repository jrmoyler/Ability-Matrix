# Impulse Well — `codex/impulse`
Force · zone · range 18 m · zone radius 4.7 m · ~3.0 s on screen (travel ≈ 0.52 s at 26.4 m/s, impact 1.25 s, fade 1.25 s)

## Read in one line
A dark lumpy charge of compressed force skims from the hand while the floor at the target sinks into a glowing funnel and drags broken slabs toward its eye. On the beat the funnel dumps: a heaved ring wave runs out along the floor, the slabs are thrown up in a twisting column, then they fall back, bounce and settle while the floor ripples flat.

## Beats
| t (s) | Beat | On screen |
|---|---|---|
| 0.00–0.05 | Anticipation | Hand flare. At the target the broken basalt disc (1.15 × the circle) is already sinking: the floor inhales. |
| 0.00–0.52 | Travel | A 0.85 m dark charge with glowing orange seams skims at 1.1 m from the hand to the centre, shedding streaks, and dives into the eye. The funnel deepens to 1.5 m. Its cracks glow orange toward a hot eye, and 22 slabs are dragged 45 % of the way in, tipping into the funnel. |
| 0.52 | Impact | The funnel springs back and a 1.05 m heaved ring wave starts outward, with glowing cracks along its crest. The slabs launch up at 6–9.5 m/s in a twisting column that unspools over 0.14 s. Shake, light punch, chips and dust. The template's commit blow throws the bodies out along the floor. |
| 0.52–1.9 | Linger | The wave runs to the rim and dies. The column peaks at about 2–3 m, then the slabs fall back outward, land, bounce and turn to the nearest flat side. Their torn undersides glow and cool. The floor settles in rippling rings, and embers fade in the cracks. |
| clock 1.55–2.0 | Exit | The broken floor breaks up from the rim inward, and the slabs sink 0.6 m into the floor. |

## Layers
1. Well floor: `ImpulseWellSignatureGeometry.createImpulseFloorGeometry` (a polar disc) with `createImpulseWellFloorMaterial`. It is a patched MeshStandard whose vertex shader draws the funnel, the wave and the ripples; its normals follow the slope. Voronoi cracks glow only where the floor is pulled or bent. It is on LAYER.WORLD and receives shadows.
2. Slabs: `createImpulseSlabGeometry` (jittered seven-sided prism) as an InstancedMesh with `createImpulseWellSlabMaterial`: lit basalt with a hot torn underside. They cast shadows.
3. Charge: a sphere carrier reshaped by `createImpulseWellOrbMaterial` (noise lumps, glowing seams, lit).
4. Streak trail from the charge; template chips, dust, aftershock and residue decal.
5. Turned down: the sigil body (0.03), voice (the pink ring), the wire-funnel hero rig, moth-like detail pieces, burst shell and shock ring.

## Signature
The floor itself inhales and then dumps. You see the funnel, the ring wave running out and the slab column falling back.

## Palette
core #fff0dc · tint #f47325 · body #3d2f27 / #4a3a30 (basalt) · deep #120b08

## Gameplay
Unchanged. The commit blow outward and the outward carry are the template's. The disc is derived from `zoneRadius × wellReach`, so the circle slider re-fits it mid-cast.
