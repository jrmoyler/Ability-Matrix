# Orbit Lock — `codex/orbitlock`
Gravity (cosmic) · zone · range 2–18 m · zone radius 4.6 m · ≈3.7 s on screen (≈0.5 throw + 1.5 orrery + 0.6 slam hold + 1.5 swallow and burn-out)

## Read in one line
A thrown star collapses into a black singularity with a burning photon ring, and light bends around it. Rocky moons on tilted orbits circle it over a dark, spiralling accretion vortex. The orbits lock into one ring, the whole orrery slams onto the circle, and the vortex becomes a gravity well on the floor that drags the embedded moons round and in until they are swallowed.

## Beats
| t (s) | Beat | On screen |
|---|---|---|
| 0.00–0.5 | Anticipation / travel | A four-point white-violet star is lobbed on a 2.2 m arc to 3.4 m over the circle, shedding star dust. |
| ≈0.5–0.85 | Burst | The star blooms and goes out into a 1 m black core with a violet-white photon ring, wrapped in a lens of bent light (3.2× the core). Nine 0.55 m moons of dark lit rock (#3a3050) with molten violet seams fly out onto three tilted orbits, with thick deep-violet tracks (#5a34e8) and comet trails. A vortex opens under them. |
| ≈0.85–1.75 | Lock | The orbits flatten into one ring that leans toward the caster, with a flash and sparks. The vortex grows from 2.2 m to 4.4 m and sags 1.1 m into a well. It is three log-spiral arms, near-black #07031a between them, #3a1aa8 on the ridges, pale streaks, and a white-hot lip at the horizon. It spins faster as it locks. The floor dial draws itself round. |
| ≈1.95–2.2 | Impact | The ring drops for 0.24 s and slams round the rim. Each moon craters with a scorch, sparks and dust; then come the AIR shell, a shockwave at 1.5× the zone, a dust ring, a floor ripple, flash, knock 0.6 and a light punch. Everything inside the ring is launched. The vortex lands flat on the floor and flares. |
| ≈2.2–3.6 | Linger | The well keeps spinning and contracts. From 0.25 s the moons are dragged round and in along the spiral, faster as they close (√ of zone / r), shedding a dust spiral. Near the centre they sink and are swallowed. The core grows slightly and the floor rumbles. |
| ≈3.0–3.7 | Exit | The core sinks into the floor and shrinks, the lens fades, the vortex dissolves inward on noise and the dial erodes. |

## Layers
1. Singularity: `createCoreMaterial`, an opaque black core with a photon-ring fresnel, on `LAYER.SHAPED`.
2. Accretion vortex / well (the hero form): `createVortexGeometry` (a 40×192 polar grid) + `createVortexMaterial`. Spiral ridges, sag, tilt and floor phase all come from the vertex stage; it is lit by derivative normals and coloured from a four-stop ramp.
3. Lens: `createLensMaterial`, a twisted radial pull on `LAYER.DISTORTION`.
4. Orbits: additive tilted tubes with comet trails (`createOrbitMaterial`).
5. Moons: an instanced, noise-displaced icosahedron, lit rock with molten seams, on `LAYER.SHAPED`.
6. Dial: the floor sigil (ring, ticks, spokes).
7. Particles: SOFT star dust, STREAK sparks, SMOKE puffs.
8. World: SCORCH craters per moon, SHOCKWAVE, DUSTRING, AIR shell, a slam ripple on `LAYER.DISTORTION`, flash, shake and light.

## Signature
Gravity you can see working: a black hole that bends light, and after the slam the moons spiral into it.

## Palette
core #f6eeff, tint #b49cff, body #3a1aa8 / #6a3cff seams, deep #07031a (moon rock #3a3050)

## Gameplay
`handlesOwnHits` is unchanged: nothing is touched before the slam, then everything within `zoneRadius × hitScale` is launched up and out. The swallowing is visual only and does not change hit timing.
