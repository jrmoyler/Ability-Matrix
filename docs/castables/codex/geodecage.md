# Geode Cage — `codex/geodecage`
Crystal · zone · range 2–18 m · zone radius 4.2 m · ≈2.95 s on screen at 13 m (≈0.65 s throw + 1.05 s impact + 1.25 s fade)

## Read in one line
A rock nodule is lobbed into the middle of the targets. A geode tears up out of the floor around them, with craggy rock outside and amethyst inside, and slams shut. Its points fire inward, and it cracks open flat to show its crystal beds around a knot of crossed amethyst points. Then it sinks.

## Beats
| t (s) | Beat | On screen |
|---|---|---|
| 0.00–0.65 | Anticipation / travel | A 0.95 m lumpy dark rock nodule tumbles on a 2.4 m arc from the hand, with violet crystal glinting through its split waist and violet glints trailing. |
| ≈0.65 | Impact | The nodule bursts into chips. Seven shell petals tear up out of the floor on a 3.6 m ring (0.86 × the circle), leaning out 0.95 rad like a split rock. A dark crystalline floor lands under the circle. |
| 0.95–1.17 | The seal | The petals slam shut (inCubic) into a squat dome 2.2 m tall with an oculus. Dust squeezes out at the seams, with a camera punch, and the seams flare violet. |
| ≈1.23 | The points fire | Fourteen amethyst points (2.6 m × 0.46 m) shoot off the inner wall and cross 0.55 m past the centre at about 1.7 m. Light jets out through the seams, and shards and sparks spray out of the oculus. The floor's cell cracks light from below. |
| ≈1.6–2.0 | The crack | The shell falls open outward over 0.38 s and slams near flat (1.42 rad) with a bounce and dust. The crystal beds face up, around the glowing knot of points. |
| 2.0–2.6 | Linger | The knot turns slowly (0.35 rad/s), shedding glints. The crystal and floor cracks cool from violet to deep violet. |
| 2.6–2.95 | Exit | Rock and points are eaten behind a hot edge and sink. The floor lets go from fade 1.65. |

## Layers
1. Shell petals: `createGeodeCagePetalGeometry` (`assets/codex/GeodeCageSignatureGeometry.js`), instanced × 7. Each petal is a thick spherical-shell sector with a bumped rind, split seams, a crystal bed and about 30 amethyst points.
2. Fired points: `createGeodeCageSpikeGeometry`, a six-sided amethyst prism with a torn rock foot, instanced × 14.
3. Nodule: `createGeodeCageNoduleGeometry`.
4. Material for all three: `createGeodeCageRockMaterial`. It is lit by the sun. Rind #0e0b12 → #3b3540, bed #2a0f55, amethyst #5a34b0, glow #9a68f3 only in the seams and crystal, hot stop #c4a2ff. It is on LAYER.SHAPED and casts shadows.
5. Geode floor: `createGeodeCageFloorMaterial`. It is a dark violet-black stain cut into voronoi crystal cells, with cracks lit from below, a torn ring where the shell came up, and a glow spill at the crack.
6. Particles: nodule glints, burst chips, seal dust, oculus shards and sparks, fall dust and knot glints. The world answers with shake and light at the seal, the fire and the fall.

Turned down in the config: body, voice, lens, template field, detail pieces, rig, burst shell, shock ring, the frost shock decal (now gated on `shockRing`) and the template shed rates.

## Signature
A real geode: rock outside, amethyst inside, which closes on you, fires its points, and breaks open.

## Palette
core #c4a2ff · tint #9a68f3 · body #5a34b0 · deep #0e0b12 rind / #08060c floor

## Gameplay
Unchanged. The hit lands at impact (`commit`) within max(zoneRadius, hitRadius) of the centre, and bodies are carried in.
