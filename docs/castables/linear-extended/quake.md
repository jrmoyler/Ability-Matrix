# Monolith Rift — `linear-extended/quake`  ★ reference (§1)
Earth · line · range 3–17 m (capture: 12.8 m) · no zone · ≈ 7.9 s on screen (0.49 travel + 5.0 stand + 0.8 delay + 1.6 sink)

## Read in one line
A rupture front shears slabs of the floor upward behind it — knee-high at the caster, a 3–4.5 m standing cluster of brutalist concrete-grey monoliths at the end — while a ring of heavy dust rolls outward along the ground, real rock shrapnel bounces and comes to rest, the floor cracks into a heaved crater with dark fissures racing 8.5 m out, and the slabs slowly wear a coat of settling dust before sinking back.

## Beats
| t (s) | Beat | On screen (shape, size in m, colour, motion) |
|-------|------|----------------------------------------------|
| 0.00–0.49 | Anticipation + travel | `cast3`; rupture front at 26 m/s with a heavy `rumble` 0.075. Slabs (footprint r 0.8 m ± 55 %, near-parallel walls `taper` 0.92) shear up by `along`: band 0.5 → 1.5 m, height 0.45 → 1.6 m, 45 % demoted to ankle blocks; rise 0.17 s with 15 % overshoot. Dust 260/s and grit 90/s along the front; scar decals 1.4 per metre. |
| 0.49 | Impact | The **blast cluster** (r 3.8 m, centre slabs 3.0 m × `peak` up to 4.5 m, rim lagging 0.13 s × radius) goes up; 70 shrapnel chunks (r 0.28 m) launched at 12 m/s; the **dust ring** rolls out at 7 m/s to 8 m over 0.9 s with a plume climbing behind (4.5 m/s); crater plate (r 4.2 m) heaves; fissures race out to 8.5 m; screen-space pressure ring to 9 m + a 5 × 4 m churning-air column; 6.5 m shockwave (#d8cfbd/#8d8578); shake 0.95 for 1.5 s; flash only 0.045 — **geology does not glow**. |
| 0.49–5.49 | Linger | Shrapnel bounces (keeps 55 % lateral speed per bounce), kicks dust on hard landings, comes to rest; after 0.35 s the slabs start wearing cement dust over 2.2 s (up-facing surfaces pale, roughness flattened); chips trickle off faces 12/s; motes hang 4.5 s; the dust plume settles. |
| 5.49–7.89 | Exit | After `sinkDelay` 0.8 s slabs go back into the floor over `sinkTime` 1.6 s; fissures and scars remain. |

## Layers
1. **Monoliths** — `assets/MonolithGeometry.js`: an irregular 4–7-gon footprint flattened on X (slab, not column), straight slightly tapered walls, a **sheared break plane** on top with a chamfered lip; unit space (base y 0, top y 1, r 0.5). Instanced (≤ 280, 96 dealt), `materials/MonolithStoneMaterial.js`: real `MeshStandardMaterial` with a **triplanar world-space projection of the ambientCG Rock030 scan** (grain fixed in metres however an instance is stretched), plus `uDustCoat` (#cfc6b3) climbing over the cast, paler/rougher fresh-fracture faces (`aFace`) and a damp dark root (#241f1b, 24 % up). `LAYER.WORLD`, casts and receives shadows. Stone #9a948a / #3d3a35.
2. **Dust** — heavy, lit, non-additive smoke: a torus rolling outward along the ground + a climbing plume (#a79d8b → #2a2823).
3. **Shrapnel** — real instanced rock (same stone material), integrated ballistic sim with bounce and friction — the one place records hold position/velocity.
4. **Scars** — heaved voronoi crater plate (`effects/RiftCrater.js`, depth 0.09, heave 0.085 × r) + dark fissure ribbons (`effects/RiftFissures.js`, #141210 with powdered lips #6f695d) + scar decals (#231f1a / #3e3931).
5. **Kinetic air** — `effects/KineticWarp.js`: pressure ring + churning column written into the refraction buffer on `LAYER.DISTORTION`, not drawn.
6. **Particles** — grit `CHIP` (#9c9384 → #22201c), motes (#efe6d2 → #2c2a25); light #c9b596 (r 16).

## What the capture shows
Standard sheet: `sheets/linear-extended__quake-sheet.jpg`; dense pass f4–f90.
- **f4–f10 (0.13–0.33 s)** — a pale dust pool lights up around the caster's feet and the first knee-high grey blocks shear up just ahead.
- **f16 (0.53 s)** — the rift reaches the end: a line of tumbled grey slabs runs downrange, a white dust disc spreads at the far end.
- **f24–f34 (0.8–1.1 s)** — the blast: a cluster of tall, flat-sided broken slabs with tilted, chamfered tops (the tallest ≈ 4 m) stands at the end, shrapnel chunks in the air all round, a wide pale dust sheet lit on the floor.
- **f48–f90 (1.6–3.0 s)** — shrapnel has landed and lies scattered as real shadow-casting rocks up to the frame edges; dark fissure lines run out across the floor; the slabs stand photographed-grey in the sun with no glow anywhere; the dust sheet stays lit around the cluster. Reads as geology at a glance.

## Signature
**Geology, not magic**: nothing emissive — photographic stone in the sun with real shadows, dust that rolls along the ground, rocks that bounce and rest, and slabs that get dustier the longer they stand.

## What makes it the bar
1. **Solid world-layer geometry, shaded physically.** Lit `MeshStandardMaterial` on `LAYER.WORLD` with shadows both ways; the brightness comes from the sun, the key light catching the chamfer on each break edge. Use this route for anything that is matter (rock, metal, wood, bone).
2. **A shape builder that refuses the default.** Not the crystal generator: `flatten` (slab vs column — one cluster holding both edge-on blades and flat-on walls is the silhouette), `shear` (tilted break top reads *snapped*, not cut), `bevel` (chamfer catches light). Three parameters turn a prism into broken concrete.
3. **Triplanar in world metres.** Instances are stretched non-uniformly every cast; UVs would smear. Sampling the scan in world space off the world normal keeps a 3 m slab and a knee-high block the same rock — and the same rock as the floor they came out of. Normals use the inverse-transpose of the instance basis (divide by squared column lengths).
4. **Material that changes over the linger.** `uDustCoat` ramps after `coatDelay` over `coatTime`, paling up-facing surfaces patchily: the slabs visibly were *in* the explosion — identity in motion without moving.
5. **The world answers physically.** Dust as a ground-hugging torus with its own outward speed, shrapnel that bounces and settles, a refraction pressure ring instead of a bright flash (flash 0.045), long heavy shake (1.5 s).
6. **Line → cluster grammar shared with Venom.** The same `along`-fraction ramp and radial `blastStagger` as the Venom Surge, but every material decision inverted (opaque, unlit-by-self, dusty) — proof that the beat structure is reusable and identity lives in material and physics.

## Palette
core #e8e0d0 (flash) / #efe6d2, tint #cfc6b3, body #9a948a / #a79d8b, deep #3d3a35 / #141210

## Gameplay
Line cast; `DummyField` hits from the published line. Cooldown 0.8 s.
