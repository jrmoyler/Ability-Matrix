# Synaptic Override — `matrix-expansion/synaptic-override`
Storm (lightning) · zone · range 2–18 m · zone radius 3.6 m · ≈ 2.8 s on screen at 10 m (travel 0.4 s + impact 1.9 s + exit 0.7 s)

## Read in one line
A charged nerve crawls from the caster's hand to the circle. A neuron fires there and its crown of insulated dendrites arcs out and plants on the floor. Arms swing onto each enemy and grip it, then the override throws each body into the next one.

## Beats
| t (s) | Beat | On screen (shape, size in m, colour, motion) |
|---|---|---|
| 0.00–0.40 | Anticipation + travel | A white-hot charge bulb (≈0.25 m) at the hand and sparks gather. The axon (a 0.075 m tube, beaded with nodes of Ranvier every ≈0.75 m, meandering ±0.45 m) drops to the floor and crawls to the target at 26 m/s. A white head leads it. Colours run cyan → electric blue. |
| 0.40 | Impact (plant) | The soma heaves up (0.72 m lumpy plasma, centre 0.8 m high, hillock toward the caster). Seven dendrites arc out over 0.32 s (outCubic), 0.24 m thick at the root. Each one plants a lathe terminal exactly on the 3.6 m rim, with a 1.6 m arch. A STORM shell runs to 2 m, and ARC and SCORCH burns cover the zone. Flash, knock, light punch. The floor web burns in. |
| 0.62–0.78 | Seize (the interrupt) | Each enemy within 3.6 m (≤ 6) takes the nearest arm. The arm swings and re-plants on that body's feet, its length re-derived from the body's distance. The terminal flashes and a jagged contact arc climbs the body to 1.15 m. |
| 0.78–1.55 | Linger (the override listens) | Writhe gain ×1.8. White potentials run inward along the seized arms and outward along the free ones, swelling the tubes. The soma beats at 7 Hz. Transmitter motes stream in from the rim and sparks crackle off the arms. Rings pulse inward through the floor web and ionised air shimmers over the crown. |
| 1.55 | Diversion | Each seized body is struck and thrown at the next one round the soma, and a bolt jumps between them for 0.4 s. The crown whips open on a damped spring: Θ drops from π to 0.7π, so every arm rears up off the floor and flings out. Potentials reverse. A shock ring runs out through the floor, and there is a SHOCKWAVE, a 3.8 m STORM shell, ARC burns at each body, a big flash, knock and light punch. |
| 1.55–2.30 | Tail | The crown sways back from its overshoot and the floor ring runs out. The burns stay. |
| 2.30–3.00 | Exit | The arms retract into the soma from the tips (inCubic), twigs first, and the sheath segments vanish as the arm passes them. The soma collapses and the floor web dissolves through noise with a cyan burn edge. |

## Layers
1. Soma: icosphere reshaped in its vertex stage by fbm lumps and an axon hillock. Additive plasma with a white nucleus, ridged veins and a blue fresnel rim. `materials.js#createSomaMaterial`.
2. Dendrite crown (hero): 10 arms × (1 primary + 2 twigs), as parameter-space tubes bent in the vertex stage (`crown.js`). Opaque on `LAYER.SHAPED` and lit by the sun: a dark mottled membrane (#1a2150 → deep), a live core seen face-on, a blue rim, and white potentials. A matching depth material lets the arms cast shadows. `createDendriteMaterial`.
3. Sheath: lathe myelin segments (≤ 5 per arm) and lathe synaptic terminals. `MeshStandardMaterial` (#232c58, metal 0.55), on `LAYER.WORLD`, casting shadows. They are placed on the bent arms by the JS mirror of the crown, so they sit on the arms exactly.
4. Axon: the travel tube from the hand to the target, with a charge bulb and a bright head. `createAxonMaterial`.
5. Arcs: 8 camera-facing bolt ribbons, jagged by two octaves of noise and re-struck 22×/s. They climb the seized bodies during the linger and jump between bodies at the diversion. `createArcMaterial`.
6. Synaptic field (floor, 4.2 m radius): deep scorch, a domain-warped neural web, a burnt trace under every arm with potentials running in, inward listening rings, the outward diversion ring, and a noise dissolve. `createFieldMaterial`.
7. Particles: STREAK sparks (`expansion.synaptic-override.sparks`) at the hand, the plant, off the arms and at the diversion. SOFT transmitter motes (`…motes`) drawn in from the rim.
8. Plant and diversion: STORM bursts, SCORCH, ARC and SHOCKWAVE decals, flash, shake and light punch.
9. Lens: a disc on `LAYER.DISTORTION` with stepped ionised crackle while listening and pressure rings at the plant and the diversion. `createLensMaterial`.
10. Light: a #9fd6ff point light that stutters with the potentials.

## Signature
Arms that aim themselves. Each dendrite is a constant-curvature arc with length L = π(D − r0)/2, so its terminal lands exactly D metres out. D is the zone rim for a free arm and the body's distance for a seized arm. The crown visibly picks its victims, grips them, then turns each one's blow onto its neighbour.

## Palette
core #f2fbff, tint #a6e9ff, body #3b72ff, deep #140a3e (membrane #1a2150)

## Gameplay
- **Seize (interrupt):** `seizeDelay` (0.22 s) after landing, up to `maxSeized` (6, capped at the arm count and at 8) enemies inside `zoneRadius` are seized, nearest first. Through the combat binding, one `status` event (storm → `charged`, tags `interrupt`) lands on all of them for the length of the override. In standalone mode there are no statuses, so this step is visual only.
- **Diversion:** at `overrideTime` (1.15 s after landing, not scaled by lifetime) each seized body is hit exactly once. Bodies are ordered by bearing round the soma, so the order is deterministic. Body *i* is thrown along the line to body *i+1* (cyclic). A lone body has no neighbour, so its blow is bent `divertAngle` (70°) off the radial. Through the binding this is one `hit` per body (damage `hitDamage`, `hitForce` from `impactForce`), with `sourcePosition` set behind the body on the diverted line. Without the binding it is `dummy.kill(dir, force)`.
- **How the note was interpreted:** the sandbox does not expose enemy attacks or projectiles. So "interrupt" is implemented as the seize plus the storm status, and "diversion" as turning each seized enemy's knockback onto its neighbour. No other hits are made. Nothing depends on the CPU wizard opponent.
