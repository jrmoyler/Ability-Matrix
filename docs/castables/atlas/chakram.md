# Vector Chakram — `atlas/chakram`
Projectile · line · range 3–18 m · blade 0.8 m to the tooth roots (≈ 2.2 m across the tips) · ≈ 0.16 s windup + ~1.6 s flight + 0.7 s catch spin-down; floor path lasts 2.8 s

## Read in one line
A big six-toothed bronze blade spins up in the raised hand, zig-zags through three bodies biting each one, scores its whole route into the floor as a glowing gold cut, and curves home to the hand, where it spins down before it is stowed.

## Beats
| t (s) | Beat | On screen |
|-------|------|-----------|
| 0.00–0.16 | Anticipation | Blade spins up held edge-on at 1.6 m, grows 55 %→100 %, energy charges. |
| 0.16–~1.4 | Travel | Straight legs at 26 m/s at 1.25 m; lit brushed metal (#c9b384 / #1a140c), burning edge, white-hot tips, thin spin smear, 0.55 m trail ribbon (0.75 s), and behind it the floor path: char bed + white-hot cut cooling to gold + tooth nicks. |
| each bank | Impact | Blade flares, body cut (sliced), chevron sigil + SCORCH + SHOCKWAVE, sparks + chips, faint AIR shell, light/shake/flash. |
| ~1.4–1.9 | Return | Bowed, lifted arc home; its floor mark is wider and fainter (a shadow more than a cut). |
| catch → +0.7 | Linger | Caught in a flash; keeps turning in the hand, spinning down and laying over, then shrinks away; sigils and path cool and erode. |
| → ~2.8 | Exit | Path erodes from its old end with a noise edge; sigils dissolve. |

## Layers
1. Disc (hero) — `createChakramGeometry` hooked sawtooth ring, `createChakramDiscMaterial` lit metal + energy, LAYER.WORLD, casts shadow.
2. Smear + trail ribbon. 3. Bank sigils + SCORCH + SHOCKWAVE. 3b. Floor path — `ChakramTrailRibbon(MAX_PATH, false)` + `createChakramPathMaterial`. 4. Sparks / chips / motes. 5. Bank + catch shells. 6. Wake warp (LAYER.DISTORTION).

## Palette
hot #ffffff / #fffbe8, tint #ffdf79, body #ffcf5a / #ff9a3c, deep #3a2410 / #1a140c

## Gameplay (unchanged)
`handlesOwnHits`; banks on the nearest live bodies ahead, kills in passing within hitRadius 0.75 m; speeds, bank count and hit forces unchanged.

## What the capture shows (upgrade J)
`/tmp/claude-0/-home-user-Ability-Matrix/8cc56224-c22f-51ae-821d-6da7489331c5/scratchpad/up-J/after/atlas__chakram-sheet.jpg`. Before (`/tmp/claude-0/-home-user-Ability-Matrix/8cc56224-c22f-51ae-821d-6da7489331c5/scratchpad/regrade-b/atlas__chakram-sheet.jpg`): 0.5 m speck + streak, yellow flash sphere (6). After: blade legible near the caster and at the first bank, gold scored path of the whole zig-zag and the return bow, sigils, disc spinning down in the hand at 2.3 s. Honest 8. Short: at the far bank (~25 m) the blade is still small and the teeth only read up close.
