# Toxin Evolution — `matrix-expansion/toxin-evolution`
Poison · zone · range 2–18 m · search radius 3.5 m · ≈ 0.6 s travel + 5.5 s infection + 1 s wither (no host: 1.4 s colony + 0.55 s wither)

## Read in one line
A ribbed lime seed pod is lobbed at a circle whose rim starts rotting inward with veins; it bursts on the nearest body and grows a fluted toxic membrane over it that evolves through three generations of coils, crowns and pulses while the whole circle stays stained.

## Beats
| t (s) | Beat | On screen |
|-------|------|-----------|
| 0.00–0.6 | Anticipation + travel | Seed vessel (≈ 0.9 m, `travelScale` 1.8) arcs 1 m high, spinning, shedding venom drips and spore bubbles. At the landing circle the **blight** (r = zoneRadius 3.5 m) creeps in from the rim: dark rot band, nine domain-warped veins reaching 60 % of the way in by landing (`blightTelegraph`). |
| 0.6 | Impact | Vessel bursts on the nearest body (drip splash, light punch); membrane rises out of the floor over `formTime` 0.35 s; blight veins finish creeping in and bend toward the host. No host → a dormant colony (membrane husk ×0.75, stain, crown-1 puff + dust ring) rises on the aim point. |
| 0.6–6.1 | Linger (three generations) | Every `stagePeriod` 1.2 s an accepted poison strike grows a coil winding up the host, a satellite vessel, a crown (puff → ripple → shockwave) with burst/decal, cysts on the membrane, a pulse racing inward along the blight veins, a thicker stain; the membrane girth grows 1.35 → 1.83 × host. Miasma crawls off the pool, drips fall, spores orbit and climb. |
| 6.1–7.1 | Exit | Membrane dissolves floor-up with a burning margin, coils and vessels retract, stain and blight wither. Host escape or death triggers the same wither over `releaseDuration`. |

## Layers
1. Membrane — fluted asymmetric capsule (`toxinMembraneGeometry`), additive vein/cyst shader (`createMembraneMaterial`), 1.9 m tall × ≈ 1.25 m wide at stage 0.
2. Blight — lobed disc at zone scale, `createBlightMaterial` (normal-blended rot + glowing veins, host-centred polar veins, inward pulses), ToxinMaterials.js.
3. Pool — wet voronoi stain under the host (`createPoolMaterial`).
4. Coils ×3, satellite vessels ×3, spores ×24 (authored tube/lathe geometry, own shaders).
5. Crowns ×3 (`ToxinStages`) + AIR/WATER/EARTH bursts + DUSTRING/RIPPLE/SHOCKWAVE decals.
6. Particles — spore BUBBLE, venom DROPLET (non-additive), miasma SMOKE.
7. Fumes on `LAYER.DISTORTION`; light rides vessel then host; shake + flash per stage.

## Signature
The circle rots before the toxin lands: the search area is drawn on the floor as veins creeping in, then they all turn toward the chosen host.

## Palette
core #e4ff93, tint #b5f15a, body #9be641, deep #16260f

## Gameplay
`handlesOwnHits`; nearest living enemy in `zoneRadius` through the expansion combat bridge; up to three escalating poison hits (0.25 / 0.35 / 0.45), only accepted hits grow a generation. The dormant colony and the blight are presentation only.
