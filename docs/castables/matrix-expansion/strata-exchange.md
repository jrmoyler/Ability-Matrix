# Strata Exchange — `matrix-expansion/strata-exchange`
Earth · zone · range 3–18 m · zone radius 1.9 m per socket (two sockets, 4.4 m apart centre to centre) · ≈ 3.8 s on screen at 8 m (0.5 lob + 2.75 exchange + 0.75 exit)

## Read in one line
A banded lodestone is lobbed onto the target, two circles of floor burn open — the target and a twin socket beside it — both plugs of layered rock tear out whole with their roots hanging, trade places in the air (one vaults over, one swings round beneath), slam into each other's holes carrying whoever stood on them, grind a quarter turn into the lock and sink flush as the kerfs heal.

## Beats
| t (s) | Beat | On screen (shape, size in m, colour, motion) |
|-------|------|----------------------------------------------|
| 0.00–0.15 | Anticipation | A 0.55 m ridged spindle of banded rock (sandstone #b98a52 / iron #8c4a2a / slate #3c3037) grows at the hand (1.4 m up), its seams lit gold #f6c877; motes start to trail it. On the floor two 2 m telegraph circles begin to **scribe themselves** clockwise (a pale-gold line with a white-hot head) — the target and its twin socket, so both sites are read before anything lands. |
| 0.15–≈0.55 | Travel | The lodestone is lobbed at 15 m/s in an arc 0.22 × distance high, tumbling at 9 rad/s, trailing SOFT gold motes; both circles finish drawing at 85 % of the flight. |
| ≈0.55 | Impact — the key | The lodestone drives into the target and vanishes. One frame: both kerfs burn open (white-hot #fff3d6 → gold → rust #c26a26 rim, 0.12 m wide), eleven radial cracks run out to 1.9 R, the floor around each darkens (#26150b stain); EARTH shells (#ffe2a8/#a8642e/#2e1c10, to 1.25 R) and 40 lit rock chips + 26 dust puffs per socket; short, faint CRACK decals 3.6 m (the socket shader carries the lasting cracks); light punch 5, camera knock 0.12, flash 0.06 gold; a lumpy pressure ring runs through the ground on the distortion layer. |
| +0.00–0.40 | Heave | Both plugs — 1.8 m radius, a 2 m body of five tilted, off-axis strata bands, a ragged root hanging another 0.7 m — tear out of the floor with a 12 % overshoot to hang at 3 m (crown). Each socket becomes a **pit**: you look down past banded walls, darker with depth, their seams glowing, to a rubble floor 2.7 m down. At 30 % of the heave everyone standing on a plug is knocked down and lifted onto it. |
| +0.40–0.58 | Hang | The plugs shudder (5 cm), clods rain off their roots (CHIP, 70/s each), their strata seams charge from gold to white; two glowing exchange arcs draw themselves out of the near ends of both plugs. |
| +0.58–1.48 | Linger I — the exchange | The plugs trade places along the arcs (in-out cubic): the target plug **vaults** 2.4 m higher over the top, the twin plug **swings round** beneath it on the far side; each spins 1.6 rad and banks 0.35 rad into the turn; carried bodies ride the crowns; gold motes stream off both plugs; energy runs along each arc toward its landing socket and the arc cools behind the plug. |
| +1.48–1.70 | Drop / slam | Each plug falls (accelerating) into the other's pit and jams, driven 0.35 m below where it will rest. The second beat: both kerfs flare, EARTH shells and 48 chips + 31 dust puffs per socket, DUSTRING 3.8 m and SHOCKWAVE 4.4 m decals, light punch 7, camera knock 0.28, flash 0.1; carried bodies are released and thrown outward; anything standing in a landing pit is crushed; arcs fade over 0.35 s. |
| +1.70–2.75 | Linger II — the lock | The plugs bounce off the slam (damped, 9 rad/s) and settle jammed 0.75 m proud of the floor — two stepped mesas of banded rock — **grinding a 0.5 rad twist into the lock** with a fading tremor; seams flash white on landing then cool to a dim rust; dust trickles from both kerfs; cracks and kerfs keep glowing. |
| +2.75–3.50 | Exit | The plugs sink flush and under (ease-in), the kerfs close inward through noise (70 % of the exit), cracks and stain fade, dust rolls off the rims. |

## Layers
1. **The plugs** (hero) — `createPlugGeometry`: authored strata plug, unit radius, five bands of uneven thickness, each off-axis with its own wandering outline (ledges), all beds tilted by one shared dip, pinched seam grooves between bands, a crown, a spiky torn root; faceted. `createStrataRockMaterial`: `MeshStandardMaterial` patched — banded albedo with wandering boundaries, laminations and grit, dusty crown, dark root, seam emission that charges in flight, ridged veins at full charge. Lit, `LAYER.WORLD`, casts and receives shadows. `geometry.js`, `materials.js`.
2. **The sockets** — `createSocketMaterial` on two floor quads (radius 1.9 R): telegraph scribe, kerf, radial cracks, stain and an **interior-mapped pit** (each pixel's view ray intersected with a cylinder `plugDepth × 1.35` deep; banded walls darker with depth, glowing seams, rubble floor or the crown of the plug that fills it); closes through noise on the exit.
3. **The lodestone** — lathe spindle (`createLodestoneGeometry`), 7 facets, ridges as seams, same rock material keyed to `stoneGlow`.
4. **The exchange arcs** — `createArcMaterial`: a parameter-only tube (`createArcGeometry`) placed entirely in the vertex shader on each plug's live arc; flowing dashes, a white-hot head riding with the plug, cooling tail; additive.
5. **Particles** — `strataExchange.chips` CHIP (lit; key/slam bursts, clods off the roots), `strataExchange.dust` SMOKE (bursts, kerf trickle, exit), `strataExchange.motes` SOFT additive (stone trail, plugs in flight).
6. **The beats** — EARTH bursts, CRACK / DUSTRING / SHOCKWAVE decals, flash, camera knock and light punch at the key and at the slam.
7. **The lens** — `createLensMaterial` on `LAYER.DISTORTION`: a grit-broken pressure ring through each socket at the key and the slam.
8. **The light** — #ffc46e, 4.5, r 10, held over the exchange midpoint.

## Signature
**The ground trades places.** Two plugs of layered earth tear out, cross in the air — one vaulting over, one swinging under — and slam into each other's holes with whatever stood on them. Placement is derived: the twin socket sits `2·zoneRadius + socketGap` along `exchangeBearing`, and both arcs are built from that span, so changing radius, gap or bearing mid-cast keeps both plugs landing exactly in the other socket.

## Palette
core #fff3d6, tint #f6c877, body #c26a26, deep #26150b (rock: crown #7b6a52, sandstone #b98a52, iron #8c4a2a, slate #3c3037, root #1d140e)

## Gameplay
`handlesOwnHits`. **Seize** (30 % into the heave): every enemy inside either socket is hit once — knocked down with a mostly vertical force (`seizeImpulse` 1.2, `seizeLift` 6) — through the expansion combat binding (`hit`, damage `crushDamage`, tags `strata-exchange`/`seize`) or directly on the dummy field. **Carry**: downed bodies found on either plug up to the start of the exchange (max 8) ride their plug through `Dummy#carry` (a current of the plug's velocity plus a spring to its crown, `carryGrip`, `carryBuoyancy`). **Slam**: carried bodies are released and shoved outward from the socket they landed in (`hitImpulse`/`hitLift` × 0.6 × explosion intensity); enemies standing in a landing socket who were not already hit are crushed once (`impactForce`); with the combat manager on, a `terrain-impact` disc imprint (radius `zoneRadius`, `terrainIntensity`) is written at both sockets. At most 12 hits per cast, nobody twice.

**Interpretation.** The sandbox has no relocatable terrain (`terrainRelocation` is false and `swapOwnedWorldshapes` only swaps the caster's own worldshape constructs), so the "terrain exchange" is the cast's own constructs — the two plugs — and what it moves is the bodies standing on them, plus the two terrain-impact imprints the combat manager records at the exchanged sockets.
