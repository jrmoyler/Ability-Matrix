# Void Bloom — `codex/voidbloom`
Void (shadow) · zone · range 18 m · zone radius 4.6 m · ~4.5 s on screen

## Read in one line
A dark crawl of void surges along the floor from the caster under a thrown seed; where it lands a black bud bursts up, opens into a 2.6 m tulip of near-black violet petals around a writhing black core that eats light, drags everything in the circle into its throat, snaps shut and sinks.

## Beats
| t (s) | Beat | On screen (shape, size in m, colour, motion) |
|---|---|---|
| 0.00–0.25 | Anticipation | cast1; seed (0.6 m dark bead with violet rays) leaves the hand |
| 0.25–0.7 | Travel | seed on a 1.1 m arc at 22 m/s (unchanged, so the bloom lands on its original beat); under it the crawl — a 0.8 m dark ribbon with violet filaments and a glowing head — surges down the floor from the caster's feet, shedding black smoke |
| ~1.0 | Impact | RIPPLE decal, root-veins spread over the circle; at +0.08 s the bud bursts out of the floor: sparks, CRACK decal, knock |
| 1.0–1.3 | Linger (bud) | a 3.5 m closed bud of black-violet petals stands in the circle |
| 1.3–1.8 | Linger (open) | petals lean out to 66° and curl back — a tulip ~2.6 m tall, 5 m across; the throat (1.6 m, black centre, violet spiral arms) and the void core (0.9 m opaque writhing black mass at 2.4 m, thin violet rim) appear |
| 1.8–3.1 | Linger (pull) | bodies knocked off their feet, dragged on a spiral to the throat and lowered through the floor; motes and black smoke stream in; petal veins pulse toward the throat; the core swells as it feeds; the light swirls (distortion) |
| ~3.1 | Snap | petals clench shut in 0.16 s, core swallowed, violet AIR shell, SHOCKWAVE, sparks, SCORCH, knock, dim violet flash (no white-out) |
| 3.1–4.5 | Exit | closed bud stands 0.25 s and sinks 0.5 s into the floor; the crawl is eaten from the caster's end; the stain erodes over 1.4 s |

## Layers
1. Crawl — strip laid down the cast line in the vertex stage (`createCrawlGeometry` + `createCrawlMaterial`).
2. Seed — billboard (`createSeedMaterial`).
3. Petals — instanced parameter grid bent in the vertex stage (`createPetalMaterial`): four-stop lit ramp, waxy sheen, violet fresnel, thin hot rim.
4. Throat + void core — spiral disc with a wide black hole (`createThroatMaterial`), opaque noise-displaced core (`createVoidCoreMaterial`), swirl on `LAYER.DISTORTION`.
5. Floor veins — spreading stain with inward-pulsing root veins (`createVeinsMaterial`).
6. Motes (SOFT, additive), smoke (SMOKE), sparks (STREAK); RIPPLE / CRACK / SHOCKWAVE / SCORCH decals; AIR burst; violet point light.

## Signature
A black flower that opens round a dark core and swallows the circle, then snaps shut.

## Palette
hot #c6b4ff (thin rim only), tint #7a4cff, body #3a1a86, deep #05020c / #140828; core #010004

## Gameplay
`handlesOwnHits`: bodies in the circle are taken while the bloom is open (> half), dragged to the throat and consumed; still inside at the snap → crushed and taken down. Unchanged by the upgrade.
