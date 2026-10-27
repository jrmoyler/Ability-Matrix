# Umbra Exchange — `matrix-expansion/umbra-exchange`
Shadow · zone · range 16 m (min 3) · reach (zone radius) 4.4 m · ≈4.0 s screen time (× global lifetime)

## Read in one line
An obsidian anchor is drawn out of the caster's shadow, hurled, and driven crown-first into the floor; its chains hook every enemy in reach, drag each one down into its own shadow and across the pool *through the anchor*, and it surfaces on the far side, mirrored, and is thrown.

## Beats
| t (s) | Beat | On screen (shape, size in m, colour, motion) |
|---|---|---|
| 0.00–0.34 | Anticipation | The anchor forms over the right hand (1.45 m) at 0.32× size, its violet veins dissolving in out of smoke while it slowly spins. A link chain rises to its ring out of the floor at the caster's feet. Dark smoke curls off the caster's shadow, and lilac motes (#c4a2ff) gather. |
| 0.34–0.81 | Travel | The anchor is hurled on a 2.4 m arc, growing to full size (0.85 × reach ≈ 3.7 m tall, 3.3 m across the arms). It flips end over end once and lands crown-down. The chain pays out behind it from the caster's shadow, with a pulse running along it. Smoke and motes trail behind. |
| 0.81 | Impact (plunge) | It bites 0.16 × height into the floor, overshoots and rebounds (damped). The crown, spike and flukes go white-hot (#f4ecff). The pool of darkness tears open from the anchor with violet fissures, and a pressure ring runs out. There is a dark EARTH shell (body→deep→void) to 0.8R, CRACK + SCORCH + SHOCKWAVE decals, 56 obsidian chips, a smoke burst, a flash, a knock and a light punch. The tether reels back to the hand over 0.3 s. |
| 0.81–1.03 | Linger · hook | Chains whip out of the ring to every enemy in reach (slack arcs that snap taut). A shadow puddle opens under each one, inside a twisting sheath of umbral tendrils (≈2.4 m). |
| 1.03–1.45 | Linger · sink | Hooked bodies sink 2.3 m into their puddles. The chains follow them down, and the lens bends the floor round the anchor. |
| 1.45–2.07 | Linger · crawl | Under the floor, each body changes sides. Its umbra (a dark stretched body with a lilac edge) crawls across the pool P → anchor → P′ with the chain end dragging it, and a pulse runs down the chain. The anchor turns 180° while this happens. |
| 2.07–2.41 | Linger · surface | A second sheath unwinds at P′ and the body rises out of it. On the frame it is out it is struck: thrown away from the anchor, with a small AIR shell, a SHOCKWAVE, chips, smoke and a knock. Its chain reels back. |
| 2.41–3.16 | Linger · hum | Veins pulse up the shank (2.6 Hz) and the anchor rocks. The pool churns and smokes, the fissures throb and the sheaths tear away upward. |
| 3.16–3.96 | Exit | The anchor is drawn down into its pool, and the pool drains in noise patches with a lilac edge. Smoke and the decals stay a little longer. |

## Layers
1. The anchor: procedural lofted obsidian (octagonal shank with collar and flared crown, diamond-section arms on an arc, arrowhead flukes, knobbed stock, forged ring, crown spike). It is flat-shaded with lit `MeshStandardMaterial`, sits on `LAYER.WORLD` and casts shadows. An additive vein shell (`createVeinMaterial`: ridged-noise veins, climbing pulse, fresnel, plunge heat, form dissolve) sits over it. Height is derived from `zoneRadius`. Files: `geometry.js`, `materials.js`.
2. The chains: the tether plus up to 6 hook chains. Each is a unit tube bent onto a bezier in the vertex shader and pinched into alternate quarter-turned links (`createChainMaterial`, dark metal with a violet edge and a drag pulse). With nobody in reach, 3 floor chains bite the pool and are dragged round as the anchor turns.
3. The pool (`createPoolMaterial`): normal-blended darkness (it removes light) with an fbm spreading edge, inward churn, fissure spokes and ridged branches. It also draws the plunge ring, the puddles at P and P′, and the crawling umbra with its trail. It drains with a dissolve.
4. The gates (`createGateMaterial`): instanced open cylinders twisted in the vertex stage into five umbral tendrils, torn from the top. Sinking sheaths twist one way and rising sheaths unwind the other.
5. Particles: lit SMOKE (`umbraExchange.smoke`, dark ramp, rising), lit CHIP obsidian (`umbraExchange.shards`, falling) and additive SOFT motes (`umbraExchange.motes`).
6. The plunge and surfacing: EARTH shell, CRACK / SCORCH / SHOCKWAVE decals, flash, shake and light punches; AIR shell, SHOCKWAVE and knock at each arrival.
7. The lens (`LAYER.DISTORTION`): a swirl round the turning anchor and a pressure ring at the plunge.
8. The light: violet #9c6cff with an uneven breath; punches at the plunge and at each surfacing.

## Signature
The anchored swap: bodies go down into their own shadows, their umbrae crawl through the anchor while it turns half a revolution, and they come up mirrored on the far side.

## Palette
core #f4ecff, tint #b892ff, body #5a2bb0, deep #0a0614 (void #030107)

## Gameplay
- `handlesOwnHits`. At the plunge the anchor hooks the `maxTargets` (4, at most 6) nearest living dummies within `zoneRadius`. With the combat binding on, a body is hooked only if it is one of the binding's live **enemy** actors (matched within 0.6 m), so allies are never moved.
- Each hooked body is moved in the sandbox's own terms. Its root is lowered (`sinkDepth`), its x/z are set to the point reflection through the anchor P′ = 2A − P while it is hidden (a runner's strafe home is reflected too), and it is raised again. Bodies on opposite sides of the anchor trade places.
- On surfacing: one attributed `hit` (element `shadow`, `damage`, `hitForce` from `hitImpulse/Lift/Spin`, source = anchor, tags `umbra-exchange`/`exchange`) through the binding, or `Dummy#kill` away from the anchor without one. Each hooked enemy is hit at most once, so a cast hits at most 6.
- Safety: a body is touched only while it is alive and in the same stand generation it was hooked in. If a cast is cleared mid-exchange, every body it holds is put back on the floor (y = 0) where it stands, never left underground.
- Interpretation: "anchored shadow position swap" is read as swapping each enemy with its own umbra across an anchor the cast drives into the floor (dummies swapped with an anchor). The caster is not moved.
- Reduced motion holds the tumble, turn, rock, chain whip, lens and knocks. The exchange and its timing are unchanged.
