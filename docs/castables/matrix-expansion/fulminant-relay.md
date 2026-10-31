# Fulminant Relay — `matrix-expansion/fulminant-relay`
Storm · line · range 2–20 m · chain radius 5 m, up to 4 hops every 0.22 s · ≈2.9 s on screen (≈0.5 s travel + 1.18 s chain + 0.8 s dissolve, × `global.lifetime` on the dissolve)

## Read in one line
A dark violet storm-node split by white-hot veins, spitting crackle bolts, flies down the line over a scored furrow, detonates among the targets and relays itself body to body — every link it strikes stays as a standing, re-striking bolt until the node burns away.

## Beats
| t (s) | Beat | On screen (shape, size in m, colour, motion) |
|---|---|---|
| 0.00–0.14 | Anticipation | The node (0.7 m radius, six blunt prongs) swells out of the hand with an outBack overshoot; crackle bolts start snapping off it; sparks off the hand. |
| 0.14–≈0.5 | Travel | Node at 18 m/s, 1.1 m up, spinning inside three broken orbit rings and a corona; 6 crackle bolts (0.1 m wide, reaching 1.1 × radius past the surface) re-strike 9 ×/s. Behind it the furrow is revealed under the seed (plasma #cfe6ff → violet #6a5cff → scorch #14121c); streak sparks and motes shed. |
| ≈0.5 | Impact | A **dark charge blast** (own mesh, 2.2 m, outCubic swell over 0.6 s): a billowing near-black #0a0724 mass lit violet #4a2ad8 where it faces the eye, white filaments skating over it, tearing apart from its folds. The STORM filament shell is cut to a 0.05 film; violet SHOCKWAVE 3.2 m, SCORCH 1.6 m, cinders, spark burst, shake, flash, light punch. |
| 0.5–1.7 | Chain | Each hop (0.22 s apart): a full-width bolt (0.26 m flat ribbon + 0.24 m cross-ribbon, white core / #a99cff body / #4a22d8 halo, broad jag 0.28 m + fine kinks re-rolled 14 ×/s, 1.1 m side branch) strikes from the node's anchor to the next body with a white return-stroke flare; a small dark charge blast (0.85 m), a **dark SCORCH (1.1 m, #07050e) under the body** plus the ARC burn, sparks and cinders; the target is thrown. The node leaps to each new anchor. |
| 0.5–2.9 | Linger | Every struck link keeps a **standing channel** (its own ribbon, 0.8 strength, re-striking 7 ×/s on per-link dice) laid on a **dark violet under-stroke** 2.4× its width; each later link bows 0.32 m higher (arch 0.7 m + 0.32 m × link, ends lifted 0.15 m × link), so the links fan out in height and the whole circuit stands visible across the knocked-down bodies; crackle keeps snapping off the node; furrow cools to scorch. |
| 1.7–2.5 | Exit | Node dissolves through noise with a burning white lip; channels and crackle fade with it; scorch and burns outlast. |

## Layers
1. Seed node — `createSeedGeometry` (pronged welded icosphere) + `createSeedMaterial('core')`: now **opaque**, four-stop charge ramp (white filaments → #b7a6ff rim → #5b3cff body → #0a0724 deep), ridged spikes, dissolve.
2. Crackle shell — `createSeedMaterial('shell')`: stepped voronoi hairlines, glass film cut to 0.05.
3. Crackle bolts — 10 pooled `createArcRibbon` pairs, one shared `createBoltMaterial`, written by `_drawCrackle` from hashed dice.
4. Orbits + corona.
5. Chain arcs — per-hop bolt + branch + halo, each on its own clock (`arcLifetime`).
6. Standing channels — per-hop ribbon pair on a shared bolt material (`arcSustain`, `arcRestrike`), each over a normal-blended dark under-stroke (`createBoltUnderMaterial`), stacked by `channelArch`/`channelArchStep`/`channelLift`.
9. Charge blasts — `createBlastMaterial` on a displaced icosphere carrier, pooled (detonation + one per hop), normal-blended dark mass with HDR filaments.
7. Particles — sparks (STREAK), motes (SOFT, curl), cinders (CHIP, lit).
8. Ground — furrow shader, SCORCH, ARC burns. Distortion warp on LAYER.DISTORTION.

## Signature
One object you can follow: the charged node leaps from body to body, and the circuit it leaves behind keeps crackling.

## Palette
core #ffffff, tint #b7a6ff, body #5b3cff, deep #0a0724

## Gameplay
Unchanged: `handlesOwnHits`; nearest unstruck target within `chainRadius` from the current anchor, every `jumpInterval`, up to `maxJumps`, same force (`impulse`, `lift`, `hitSpin`). The standing channels and crackle are presentation only.
