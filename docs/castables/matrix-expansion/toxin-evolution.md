# Toxin Evolution — `matrix-expansion/toxin-evolution`
Poison · zone · range 2–18 m · search radius 3.5 m · ≈ 0.75 s travel + 5.5 s infection + 1 s wither

## Read in one line
A dark ribbed seed pod is lobbed on a venom stream into the circle; it bursts on the nearest enemy and a crown of fat, pustuled blight tendrils erupts out of a rotting stain round it, curling closed over the host a little more with every one of three escalating poison strikes, then sinks back into the floor.

## Beats
| t (s) | Beat | On screen |
|-------|------|-----------|
| 0.00–0.75 | Anticipation + travel | The blight (search circle, r 3.5 m) creeps veins in from its rim. A 1.6 m dark-green lit seed vessel with a glowing waist flies a 1 m lob at 18 m/s, drawing a **venom stream** (r 0.07 m, dark body, hot lime thread, beads running toward the target) all the way from the caster's hand, shedding drips and bubbles. |
| 0.75 | Impact | Vessel bursts on the nearest host: drip splash, light punch; first strike accepted at once → AIR shell + DUSTRING crown, shake/flash. The stream drops onto the floor (0.35 s) and starts to dry from the caster's end. |
| 0.75–1.2 | Eruption | Six blight tendrils (2.6 m arcs, root r 0.21 m) erupt staggered out of the stain on a ring 1.4 m round the host (0.4 × zoneRadius), lean out, then curl back over it. A dark wet sac (the membrane) rises over the host. |
| 1.2–6.25 | Linger | Every 1.2 s a stronger strike: +2 tendrils, all 10 % longer, the claw closes further (curl 0.55→1.0 × 1.9 rad, plus slow closing through the whole linger), a coil winds up the host, a satellite vessel unfolds, WATER/EARTH shells and RIPPLE/SHOCKWAVE decals. Tendrils writhe constantly; vein pulses run up them; pustules beat. Stain and blight spread and darken; miasma crawls off the floor. |
| 6.25–7.25 | Exit | Tendrils sink back into the floor behind a ragged front and blacken; membrane dissolves from the floor up; stain dries. Host lost early → same wither over 0.55 s. |

## Layers
1. Blight tendrils (hero) — `toxinTendrilGeometry` (fluted tube, flared root, four one-sided pustules) bent into constant-curvature arcs in `createTendrilMaterial`'s vertex stage; opaque, lit off `uLightDir`, LAYER.SHAPED, instanced (max 14).
2. Membrane — fluted capsule, now a normal-blended dark lit sac (deep → dim body) with emissive veins and cysts.
3. Seed vessel — solid lit ribbed rind with glowing seed; venom stream (`toxinTrailGeometry`, `createTrailMaterial`) laid on the flight arc in the shader, sags to the floor, dries.
4. Coils, satellite vessels, spores; three stage crowns + bursts/decals (`ToxinStages`, shells now body → deep colours).
5. Floor — pool (wet voronoi cells) and blight (search circle rotting, veins bending toward the host).
6. Particles: spore bubbles, venom DROPLET drips, SMOKE miasma. Distortion haze on LAYER.DISTORTION. Light rides the vessel, then the host.

## Signature
A claw of diseased growth that closes over its victim one generation at a time.

## Palette
core #e4ff93, tint #9be641, body ≈ toxin × 0.03–0.12 lit over the deep stop, deep #0b1806, stain #0e1a08. The deep stop owns every surface (tendril flesh, sac, rind, stream body, floor rot); tint only in veins, pustules, seams, and core only on tips, cysts and pulse peaks.

## Gameplay
Unchanged. `handlesOwnHits`; nearest live enemy in `zoneRadius` (ID tie-break); up to `maxStages` poison hits every `stagePeriod`, damage × (1 + 0.4 × stage); only accepted strikes grow visuals; host lost on death/replacement/escape past `tetherRange`. No host → presentation-only dormant colony.

## Second pass (value structure)
- Tendrils: flesh = deep → toxin × `tendrilBodyTone` (0.03) on the lit side only, thin dim bile rim, tighter spec; veins rest at `tendrilVeinBase` (0.04) and light only when a pulse runs up them; pustules narrowed to the knob crowns.
- Membrane: flesh × `membraneBodyTone` (0.08), veins/cysts/rib/rim weights cut, glow 0.25, veins sharper (16).
- Vessel rind and venom stream body pushed down to toxin × 0.12–0.14.
- Floor: blight is now a *filled* rot (`blightFill`, densest round the host) with a dim edge (`blightRimGlow` 0.15) and thinner body-coloured veins; pool is a mottled deep-stain fill with thin seams and a dim creeping front (`poolEdgeGlow`, `poolDarken` 0.9). Stage crowns' additive base cut to 0.05; light 3.5 × #a6dc55.
- New keys: tendrilBodyTone, tendrilVeinBase, membraneBodyTone, poolEdgeGlow, blightFill, blightRimGlow (all sliders).
- Known short: when the host dies early the whole cast (floor included) withers with it (gameplay-tied host loss).
