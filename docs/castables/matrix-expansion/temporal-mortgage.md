# Temporal Mortgage — `matrix-expansion/temporal-mortgage`
Time · zone · range 2–16 m · zone radius 3.4 m · about 3.8 s on screen

## Read in one line
A wound mainspring of blued steel is thrown into the circle, lashes once round
it at borrowed speed, then is wound back up click by click while time runs slow
to repay the loan.

## Beats
| t (s) | Beat | On screen (shape, size in m, colour, motion) |
|---|---|---|
| 0.00–0.30 | Anticipation | A 0.36 × size coil (≈ 0.6 m across) winds up at the hand with an outBack pop, spinning faster as it tightens; stress light hot along it, a hand light ramps to 5, soft time motes gather round it. |
| ~0.30–0.9 | Travel | The wound coil is thrown at 15 m/s, spinning, on a 2.1 m arc; sparks and 0.22 m soft motes are shed every 30 ms, so the path stays drawn. |
| ~0.9 | Impact (landing) | It hits the floor and lets go (0.12 s grow): air shell, crack, shockwave and dust ring, knock, flash, light punch. Full size: an open spiral of blued steel band, 1.15 m tall at the arbor stepping down to 0.35 m at its outer hook, round an iron arbor. |
| ~0.9–1.6 | Linger 1 — the borrow | The cast's clock τ runs at 2.4×. The spring uncoils and its outer limb lashes once round the whole circle from the caster's side, a wedge of speed-smear behind it, sparks off the tip, the floor lit behind it. Every enemy it passes is struck along the lash. |
| ~1.6–3.1 | Linger 2 — the repayment | τ runs at 0.35× for exactly R = (k − 1)·B / (1 − ρ) seconds, so τ stands level with real time on the last frame. The winding key turns the spring back up in ratchet clicks: the pawl drops, filings spit, the floor ledger is inked back sector by sector, motes hang almost still. |
| ~3.1–3.8 | Exit | A cold flash and ripple as the loan is paid; the tight-wound spring sinks into its ledger, which dissolves. |

## Layers
1. **The mainspring** — closed box ribbon on an Archimedean spiral, rewritten each frame from (r0, rOut, turn, start, height, taper); 2.1 turns wound (0.5 × R outer) to 2 turns let go, so the gaps stay open; the band steps down toward its outer end (`bandTaper` 0.7) so every inner coil shows above the one outside it. Lit blued steel, low metalness (0.25) and env reflection (0.12) — a mirror band reflected the sky as vertical streaks — casts shadows but does not receive them (self-shadow acne). `LAYER.WORLD`.
2. **Stress light** — the same band again, inflated 12 mm off the steel with polygon offset (the old coplanar skin z-fought the steel across passes into 'video noise'), additive: pulses run out while borrowing and back in while repaying; hot top edge; all × the balance (`createStressMaterial`).
3. **The iron** — turned arbor, saw-tooth ratchet that turns with the inner coil, a world-fixed pawl that kicks on every click, a butterfly key.
4. **The ledger** — floor field welded to the spiral: deep bed, coil groove, debt-lit sector, inked repaid sector, white tip line; noise dissolve (`createLedgerMaterial`).
5. **The smear** — streaked light trailing the tip (`createSmearMaterial`).
6. **Particles** — streak sparks off the tip, chip filings on clicks and hits, soft motes rising at the clock's rate.
7. **Impact & settlement** — air shell, crack + shockwave + dust ring on landing, a knock per body, ripple + flash when paid.
8. **Lens** — shear signed by the clock's rate; pressure ring on landing (`LAYER.DISTORTION`).

## Signature
Nothing has its own timer: how far the spring stands open is, every frame, the outstanding balance U = (τ − t) / ((k − 1)·B). It opens while the debt is drawn and is shut tight exactly when τ = t again.

## Palette
core #f2fbff, tint #a8e6ff, body #2a8fd6, deep #0a1230 · steel #2a4f8c · iron #1a2233

## Gameplay
One lash per cast: every enemy inside `zoneRadius` that the lash's sweep passes is hit once (≤ 16), knocked along the lash, and given a `delayed` debt status (≤ 8 ids) through the expansion combat binding (or `dummy.kill` standalone).

## Upgrade notes (2026-10-30)
Fixed from the audit: the drum read (fewer, wider coils + a stepped taper), the streaked 'video noise' skin (z-fighting stress skin, shadow acne and mirror reflections), the lens shear toned down (0.22), and the empty first 0.67 s (bigger wind-up at the hand with light and motes, slower visible throw). New keys: bandTaper, steelEnv, stressInflate, trailGlow, trailGlowSize, chargeLight.

## Known gap (first pass — closed in upgrade G, see below)
The band's lit face is still on the pale side of the ramp at the camera; the deep stop is carried by the ledger floor rather than the steel.

## Upgrade G (second pass, 2026-10-30) — dark steel
Coordinator's read: the spring read as tiers but pale blue-white, like a stepped fountain.
- The band has its own material now (`createBandSteelMaterial`, a patched lit MeshStandardMaterial): the ramp's deep stop is on the metal — tempered near-black (`temperColor` #070b1c) at the foot and on the inner coils, darker blued steel (#1d3560) only up top, a faint temper streak under the edge. Satin, not mirror (metalness 0.3, roughness 0.66).
- The stress light is confined: no wash (`stressFill` 0.03), low rim (`stressRim`), thin slashes (`stressSharp` 90, 7 pulses) and a thin hot line along the top of the side faces (`edgeWidth` 0.08); the flat top face only takes `edgeTop` of it, so the top no longer reads as a white basin rim.
- Ledger rim line and the lit groove under the band are now keys (`ledgerRim` 0.2, `ledgerCoil` 0.6), toned down.
- New keys (13): temperColor, temperStrength, temperHeight, temperInner, temperSheen, sheenColor, edgeWidth, edgeTop, stressFill, stressRim, stressSharp, ledgerRim, ledgerCoil.
After sheet: `/tmp/claude-0/-home-user-Ability-Matrix/8cc56224-c22f-51ae-821d-6da7489331c5/scratchpad/up-G/r3/matrix-expansion__temporal-mortgage-sheet.jpg` — a dark blued-steel coil with thin cyan edge lines and stress slashes. Honest 8. Still short: from the play camera the stepped coils can still read as concentric walls between lashes; the spiral is clearest while the outer limb is lashing (f40).

## Fix-2 (third pass, 2026-10-30) — one coiled band
Coordinator's read of up-G/r3: steel dark, but at 8 m the spring read as a small stack of glowing concentric walls.
- The band is now a ribbon (`bandRibbon` 0.17 × height ≈ 0.42 m wide) whose foot lifts toward the arbor (`writeSpring` takes an optional `ribbon`), so the coil climbs as one conical helix: ~2.45 m at the arbor (`bandHeight` 0.72) down to its free end resting on the floor (`bandTaper` 0.84), with open air between turns — a visible pitch instead of nested walls. Fewer turns (1.8 wound / 1.55 let go), thicker steel (0.15 m), longer hook, taller arbor (0.78 × R) so the key stays above the top coil.
- Glowing edges only on the outer limb (`edgeInner` 0.15, `edgeGlow` 1.1, `edgeTop` 0.25) plus a hot free end (`tipGlow` 1.2); floor groove toned down (`ledgerCoil` 0.3), cast light 6 → 4 so the inner faces stay steel, smear lowered to the outer limb (`smearHeight` 0.3), tip sparks follow the low free end.
- New keys (3): bandRibbon, edgeInner, tipGlow. Lash timing, radius, hits unchanged.
After sheet: `/tmp/claude-0/-home-user-Ability-Matrix/8cc56224-c22f-51ae-821d-6da7489331c5/scratchpad/fix-2/r4/matrix-expansion__temporal-mortgage-sheet.jpg`.
