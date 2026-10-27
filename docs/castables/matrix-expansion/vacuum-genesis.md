# Vacuum Genesis — `matrix-expansion/vacuum-genesis`
Cosmic · zone · range 2–17 m · zone radius 3.4 m · ≈ 3.1 s on screen (10 m cast, defaults)

## Read in one line
A black-hearted seed is lobbed onto the circle and a bubble of true vacuum
blows out over it; everything inside floats weightless while a glowing cosmic
web crawls up the bubble's skin and knots of new rock condense on it — then
the shell is born and cracks outward, throwing the rock and the bodies clear.

## Beats
| t (s) | Beat | On screen (shape, size in m, colour, motion) |
|---|---|---|
| 0.00–0.15 | Anticipation | A 0.34 m faceted seven-sided spindle buds at the hand (1.3 m up), its facing facets vacuum-black (#12082c), its silhouette burning violet → white; an accretion swirl (1.4 m, two spiral arms) turns round it. The floor at the target dims to the pocket's size (telegraph, 30 % of the stain). |
| 0.15–0.50 | Travel | The seed is lobbed on a 2.2 m arc at 22 m/s, tumbling, shedding violet STREAK sparks (90/s) along its path. |
| 0.50 | Impact — the birth | One frame: the bubble blows out (outBack, 0.32 s, overshoot ~15 %) to a 3.4 m-radius, 3.1 m-tall superellipse dome standing on a meniscus lip that curls 0.55 m out into the floor; white flush over the skin; an AIR shell to 4.25 m; SHOCKWAVE (4.6 m), DUSTRING and CRACK decals; 54 dust puffs blasted outward off the lip in twelve jets; the floor tears open from the centre: dark stain, radial streaks dragged outward, a burning tear at the lip. Flash, camera knock 0.22, light punch 7. Dummies inside are knocked off their feet with a soft 3.2 m/s lift. |
| 0.50–2.25 | Linger — the pocket | Bodies float up to 1.25 m and turn slowly round the middle (0.45 rad/s, buoyancy 1). The skin rings down from 0.27 m standing waves (5 lobes) to a slow breath; a cyan-violet thin-film sheen slides over it; through it the world is darkened (62 %) and a violet nebula drifts with stars being born. The **cosmic web** crawls up the skin from the lip: 34 Fibonacci knots, ~60 tube threads on great arcs, each with a white-hot growing tip, finished threads carrying pulses; knots condense as threads arrive and **30 plates of dark violet rock** (0.7–1.4 m, lit, shadowed, glowing seams) accrete on them, lowest first. Crystal cracks spread across the floor from the centre under the growing web; violet streak sparks spit off fresh knots; motes rise inside. In the last quarter fractures open across the skin. |
| 2.25 | Rupture — genesis | The web closes over the crown: all threads flare white, a STORM shell (4.4 m) and second shockwave, SCORCH decal, 90 rock chips, flash, knock 0.35, light punch 9. The plates are thrown outward (9 m/s ± along the skin normal, 5 m/s up, tumbling) and the floating bodies are hurled clear (14 m/s out, 6 up) and given their weight back. |
| 2.25–3.10 | Exit | The skin and the void dissolve crown-down through a burning white edge (0.75 s), the web fades, the knots go out; the plates arc, land and shrink into the floor; the stain dissolves through noise in the last two thirds while the crack and scorch decals stay (2.6 s). |

## Layers
1. The seed — `createSeedGeometry` (7-sided flat-shaded lathe spindle) + `createSeedMaterial` (opaque, black heart, fresnel ramp rim, facet flicker); `createHaloMaterial` camera-facing accretion swirl. `geometry.js`, `materials.js`.
2. The skin (hero) — `createPocketGeometry` parametric grid placed in the vertex shader by `profileGLSL` (superellipse dome n = 2.2 on a meniscus lip; radius, height, lip all live), inflated with overshoot, rippled by standing waves that ring down; `createSkinMaterial`: fresnel on the four-stop ramp, noise-thickness thin film, hot lip, F2−F1 fractures, crown-down dissolve. Additive, both faces. 3.4 m × 3.1 m.
3. The void — same grid, back faces, `createVoidMaterial`: normal-blended deep (#12082c) at 62 %, fbm nebula, newborn star field on a sphere of directions.
4. The cosmic web — `createWebNodes` + `createWebGeometry` (tubes on slerped great arcs, k = 3 neighbours, oriented low → high, cross-section offset in the skin's frame in `createWebMaterial`), growing tip, pulses, flare; instanced knots (`createKnotMaterial`).
5. The new rock — `createPlateGeometry` (jittered seven-sided outline, extruded, bevelled), 30 instances, `MeshStandardMaterial` (#2a2140, roughness 0.55, metalness 0.35, violet emissive seams) on `LAYER.WORLD`, casting and receiving shadows; ballistic throw at the rupture.
6. The floor — `createFloorMaterial` (normal-blended: vacuum stain, air streaks, burning tear at the lip, crystal cracks growing with the web, dust swirl, noise dissolve), 4.4 m radius; CRACK + SHOCKWAVE + DUSTRING at the birth, SCORCH + SHOCKWAVE at the rupture.
7. Particles — `vacuumGenesis.dust` (SMOKE, normal blend, curl), `vacuumGenesis.spark` (STREAK: seed trail, web sparks), `vacuumGenesis.mote` (SOFT, rising), `expansion.vacuum-genesis` (CHIP rock at the rupture).
8. Bursts — AIR at the birth, STORM at the rupture.
9. The lens — the skin on `LAYER.DISTORTION` (`createLensMaterial`): rim refraction while it stands, pressure pulses at the birth and the rupture.
10. Light — #b48cff, 4.5 / 10 m, punched at the birth and the rupture.

## Signature
A pocket of *nothing* that makes *something*: the circle becomes a weightless
bubble of vacuum, and its skin crystallises — web, then knots, then plates of
new rock — until the shell is born and bursts outward.

## Palette
core #f6efff, tint #c9a9ff, body #7b3dff, deep #12082c (film #6fe6ff, rock #2a2140)

## Gameplay
- Interpretation of *vacuum pocket*: a bounded region that removes footing and
  weight. The sandbox has no projectile or construct system to empty, so the
  pocket acts on bodies.
- Birth (impact frame): up to `maxTargets` (8) enemies inside `zoneRadius`.
  UCSM: `hit` (`birthDamage` 1, soft lift force) + cosmic `status`
  (`starmarked`) for the hold. Dummies: `kill` with `holdLift`/`holdImpulse`.
- Hold (`holdTime` 1.75 s × lifetime): dummies are carried weightless
  (`Dummy#carry` with buoyancy `floatBuoyancy`, a flow field that lifts to
  `floatHeight`, orbits at `floatOrbit` and keeps them inside 70 % of the
  radius) and kept from burning (`hold`).
- Rupture (end of hold): UCSM — every held enemy still alive and within
  1.25 × radius takes a `hit` (`ruptureDamage` 1, outward `impactForce` from
  `hitImpulse/hitLift/hitSpin`). Dummies — `shove` outward and up, `release`.
  A body is never left floating: `onDestroy` releases anything still held.
- Deterministic and bounded: fixed order of `findTargets`/`queryActors`, one
  birth and one rupture event per target, ≤ 16 UCSM events per beat. A combat
  mode change mid-cast refuses the rupture and records `failure`. Reduced
  motion freezes the visual clock (ripples, orbit, twinkle) without moving
  either beat.
