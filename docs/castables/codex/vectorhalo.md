# Vector Halo — `codex/vectorhalo`
Force · zone · range 2–18 m · zone radius 4.7 m · ≈2.9 s on screen (≈0.4 s stream + 1.25 s impact + 1.25 s fade)

## Read in one line
Twelve forged iron arrows stream out of the hand and fall into a ring around the group, which walks round as it fills. On the beat the ring locks and the arrows glow with charge. Then every arrow is released along its own tangent at once, a pinwheel. They fly out and stab nose-first into the floor, where they quiver and cool from ember to iron before they shatter.

## Beats
| t (s) | Beat | On screen |
|---|---|---|
| 0.00–0.4 | Anticipation / travel | The arrows leave the hand one after another over 45 % of the travel, on 1.6 m arcs. Each grows from 0.4× to its full 1.9 m × 0.9 m and falls into its slot on a 3.85 m ring at 1.1 m height. They bank 0.55 rad and settle into the tangent nose to tail. The ring walks round at 2.4 rad/s. The scoured disc starts to show under it. |
| ≈0.4 | Impact: lock | Every arrow snaps 0.45 m forward into its slot (outBack) and floods with charge. Template beat: shake, a small flash, a light punch, dust, and the residue stain. Bodies are thrown (unchanged). |
| 0.4–0.72 | Linger: charged hold | The locked ring quivers (±0.08 rad, faster as it holds), its heads white-hot. |
| 0.72–1.1 | Linger: release | All arrows fly at once along their tangents, 4.4 m out with a 12 % outward flare. They rise 0.35 m, then dip and pitch nose-down, streaming sparks. A gouge is cut along each flight into the char of the scoured disc. Each landing brings a scorch, chips and dust, a light punch, and one camera punch for the volley. |
| 1.1–2.4 | Linger: embedded | The arrows stand nose-first in the floor at 0.62 rad, quiver (0.16 rad, decaying) and cool from ember to dark iron. The gouges cool to char. |
| 2.4–2.85 | Exit | The arrows shatter along voronoi cells and sink. The floor fades. The stain and scorches stay. |

## Layers
1. Arrows (hero): `createVectorHaloArrowGeometry`, an extruded, bevelled barbed head, square shaft and split fletch with `aEdge` (tail 0 → tip 1). Instanced, max 16. Material: `createVectorHaloArrowMaterial`, lit dark hammered iron on `LAYER.WORLD` with shadows. Heat lives only at the tip and on the head's cutting edges; the flats stay dark iron. There is a charge term, a cooling term and a voronoi shatter (per instance `aVec`).
2. Floor: `createVectorHaloSweepMaterial`, a filled, near-black char disc under the ring, and a gouge cut along every flight with a narrow ember seam while fresh.
3. Residue stain (darkened), landing scorches, aftershock dust roll.
4. Particles: flight sparks, landing chips and dust, the template shed, hand flare.
5. World: shake, flash and light on the lock; a light punch per landing and a camera punch for the volley.

Switched off in the config: ground field (it read as a red disc), body, voice, lens, shared rig (the flat ring on the floor), detail pieces (jagged shards), shock ring.

## Signature
A ring of arrows that locks and then lets go tangentially all at once: a pinwheel of iron stabbed into the floor.

## Palette
core #fff0dc · tint #ffb27a · body #f05a1a · iron #2c2522 · deep #0b0503 / char #0e0907

## Gameplay
Unchanged. `handlesOwnHits`, hit timing `commit`, blow `ring`, carry `orbit`. The stream, lock, release and landings are presentation only.
