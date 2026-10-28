# Temporal Mortgage — `matrix-expansion/temporal-mortgage`
Time · zone · range 2–16 m · zone radius 3.4 m · about 3.4 s on screen

## Read in one line
A wound mainspring of blued steel is thrown into the circle, lashes once round
it at borrowed speed, then is wound back up click by click while time runs slow
to repay the loan.

## Beats
| t (s) | Beat | On screen (shape, size in m, colour, motion) |
|---|---|---|
| 0.00–0.22 | Anticipation | A small, tight coil of blued steel winds in the hand; stress light runs hot along it. |
| ~0.22–0.6 | Travel | The wound coil is thrown, spinning, on an arc. |
| ~0.6 | Impact (landing) | It hits the floor and lets go (0.12 s grow): air shell, crack, shockwave and dust ring, knock, flash, light punch. Full size: 4½ turns of steel band standing 1.4 m on edge round an iron arbor. |
| ~0.6–1.3 | Linger 1 — the borrow | The cast's clock τ runs at 2.4×. The spring uncoils and its outer limb lashes once round the whole circle from the caster's side, a wedge of speed-smear behind it, sparks off the tip, the floor lit behind it. Every enemy it passes is struck along the lash. |
| ~1.3–2.7 | Linger 2 — the repayment | τ runs at 0.35× for exactly R = (k − 1)·B / (1 − ρ) seconds, so τ stands level with real time on the last frame. The winding key turns the spring back up in ratchet clicks: the pawl drops, filings spit, the floor ledger is inked back sector by sector, motes hang almost still. |
| ~2.7–3.4 | Exit | A cold flash and ripple as the loan is paid; the tight-wound spring sinks into its ledger, which dissolves. |

## Layers
1. **The mainspring** — closed box ribbon on an Archimedean spiral, rewritten each frame from (r0, rOut, turn, start, height); lit blued steel (`MeshStandardMaterial`, `LAYER.WORLD`, shadows).
2. **Stress light** — the same band again, additive: pulses run out while borrowing and back in while repaying; hot top edge; all × the balance (`createStressMaterial`).
3. **The iron** — turned arbor, saw-tooth ratchet that turns with the inner coil, a world-fixed pawl that kicks on every click, a butterfly key.
4. **The ledger** — floor field welded to the spiral: deep bed, coil groove, debt-lit sector, inked repaid sector, white tip line; noise dissolve (`createLedgerMaterial`).
5. **The smear** — streaked light trailing the tip (`createSmearMaterial`).
6. **Particles** — streak sparks off the tip, chip filings on clicks and hits, soft motes rising at the clock's rate.
7. **Impact & settlement** — air shell, crack + shockwave + dust ring on landing, a knock per body, ripple + flash when paid.
8. **Lens** — shear signed by the clock's rate; pressure ring on landing (`LAYER.DISTORTION`).

## Signature
Nothing has its own timer: how far the spring stands open is, every frame, the outstanding balance U = (τ − t) / ((k − 1)·B). It opens while the debt is drawn and is shut tight exactly when τ = t again.

## Palette
core #f2fbff, tint #a8e6ff, body #2a8fd6, deep #0a1230 · steel #2b4f86 · iron #1a2233

## Gameplay
One lash per cast: every enemy inside `zoneRadius` that the lash's sweep passes is hit once (≤ 16), knocked along the lash, and given a `delayed` debt status (≤ 8 ids) through the expansion combat binding (or `dummy.kill` standalone).

## Known gap
At default settings the 4½ turns sit close together, so from the play camera the spring can read as a drum rather than a coil; the stress light was toned down (stress 0.55, edge 0.9, smear 0.8) so the lit steel band shows.
