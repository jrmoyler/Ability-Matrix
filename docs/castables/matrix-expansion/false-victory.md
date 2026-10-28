# False Victory — `matrix-expansion/false-victory`
Illusion · zone · range 2–15 m · zone radius 3.4 m · about 3.4 s on screen

## Read in one line
A laurel crown opens over a chessboard dais; every enemy inside is shown its
own defeat as a chess king that topples, and is then struck in exactly the
direction its king fell.

## Beats
| t (s) | Beat | On screen (shape, size in m, colour, motion) |
|---|---|---|
| 0.00–~0.5 | Anticipation / travel | A folded laurel wreath spins from the hand on an arc, shedding glitter. |
| ~0.5 | Impact (the crowning) | It opens over the circle and hovers 2.3 m up, tipped toward the caster; two branches of lacquered leaves (up to 80) unfurl round both sides in 0.5 s, leaving a gap on the far side. A black-and-violet chessboard dais spreads from the centre; a stage light pours down; confetti pops. Each enemy inside (max 7) is marked: an obsidian chess king rises out of the dais behind it (0.32 s). |
| ~0.8–2.3 | Linger (the false victory) | The crown turns and drifts down; leaves flutter in a wave along the branches; board tiles flip; confetti rains. Each king rocks (0.38 s) and topples outward (0.42 s), landing with a flash and a floor crack; lying in state, its cracks heat from violet to white. |
| ~2.3 | Impact (the reveal) | The crown slams onto the board; leaves fly out like thrown knives; the kings burst along their cracks. Every marked enemy still within zone + 0.25 m is struck along its king's fall. |
| ~2.3–3.4 | Exit | Leaves and kings burn away through noise; the board dissolves from its rim; the light closes. |

## Layers
1. **The wreath** — instanced laurel leaves (closed, cupped, curled lens with a midrib) and stem segments; lit lacquer with thin-film rims (`createLacquerMaterial`, `createLeafGeometry`), `LAYER.WORLD`, shadows.
2. **The kings** — turned chess-king effigies in lit obsidian lacquer with voronoi cracks that heat and dissolve (`createEffigyMaterial`, `createKingGeometry`), shadows.
3. **The dais** — chessboard field sized from `zoneRadius`, normal-blended so it darkens the floor (the deep stop) (`createDaisMaterial`).
4. **Stage light** — the pour of light down onto the board.
5. **Particles** — confetti (A–D ramp), glitter, chips.
6. **Impacts** — king-fall flashes and cracks; the reveal's slam, thrown leaves, bursts, shake and flash.

## Signature
Defeat staged before it happens: the toppling king is a telegraph of the exact direction of the blow. Enemies who walk out of the staged circle "see through it" and are spared.

## Palette
core #fff2ff, tint #ff9fe6, body #9b2cff, deep #12041f · thin-film #38e8ff

## Gameplay
At the crowning, up to `maxMarked` (7, ≤ 8) enemies inside `zoneRadius` are marked. At the reveal, each marked enemy still within `zoneRadius + escapeSlack` is hit once, knocked along its king's fall direction, through the expansion combat binding (or `dummy.kill` standalone). Enemies arriving after the crowning are never struck.
