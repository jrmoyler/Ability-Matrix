# Siren Note — `codex/sirennote`
Wind / sound · line · range 2–18 m · ≈3.9 s on screen at 12 m (≈0.4 travel at 30 m/s + 0.3 scream + 1.45 ring-down + 0.8 shred + 0.9 floor erode)

## Read in one line
A held note leaves the caster's mouth and opens into a standing 2.8 m sheet of pressed air — dark teal body, saturated where it swings, pale strands and a white-hot leading edge — over a filled Chladni pattern of piled teal dust on a scoured black floor; at the end it screams into a dark pressure disc, then keeps ringing down, the floor pattern crawling, before it shreds into strands and the floor erodes.

## Beats
| t (s) | Beat | On screen |
|---|---|---|
| 0.00–0.12 | Anticipation | A taut thread at the mouth (1.4 m up) opens over 3 m. |
| 0.0–0.4 | Travel | The sheet runs down the line, banked 1 rad (a standing curtain), vibrating as a standing wave (nodes every 2 m, 3.5 Hz) with a ripple behind the edge. A 1.3 m dark-filled wavefront disc with teal arcs stands at the front. Under it a 4.2 m Chladni floor fills in: #021416 scour, #0f6f68 lobes, #7fe6d4 ridges glowing #2fd8c0. Bodies within 1.2 m are cut. |
| ≈0.4 | Impact (scream) | Amplitude ×2.6, the wavefront blooms ×2.2 as a filled disc, faint AIR ripple (opacity 0.16), teal shockwave + dust ring, shake, light punch; everything within 2.4 m of the end thrown. |
| ≈0.7–2.15 | Linger (ring-down) | The sheet keeps vibrating, swelling and dying on a 2.2 Hz tremolo; node rings pulse; the floor pattern crawls between two plate modes (0.6 Hz) and its lobes pulse with the note. |
| ≈2.15–2.95 | Exit (shred) | The sheet tears from the far end back into its strands; the fill goes first, strands fray with bright tear edges. |
| ≈2.95–3.85 | Exit (floor) | The dust pattern erodes in patches. |

## Layers
1. The sheet — `createSirenSheetMaterial`, premultiplied filled membrane + emissive strands/edge. `SirenNoteMaterials.js`.
2. The lens — same strip on `LAYER.DISTORTION`.
3. The wavefront — `createSirenFrontMaterial`, premultiplied dark-filled pressure disc with teal arcs.
4. The Chladni floor — `createSirenGroundMaterial`, filled lobes / scour / ridges, crawling mode mix (`uMorph`).
5. Particles — STREAK wind lines, RING node pulses, SMOKE dust (all on the teal ramp).
6. Scream — AIR shell (low opacity), SHOCKWAVE, DUSTRING, flash, shake, light.

## Signature
One vibrating membrane of air the length of the cast that sorts the dust beneath it into a living plate pattern.

## Palette
core #eafffb · tint #8ff3e2 · body #13a596 · deep #03262a (sheet, wavefront, particles); floor #7fe6d4 / #2fd8c0 / #0f6f68 / #021416.

## Gameplay
Unchanged: cut within `hitRadius` of the front during travel, blast within `blastRadius` at the scream. The ring-down and floor crawl are presentation only.

## New settings (presentation)
`membraneFill`, `colorDeep`, `ringDown`, `ringDecay`, `tremolo`, `groundFill`, `groundMorph`, `colorSandBody`, `colorGroundLine`, `burstIntensity`, `burstOpacity`, `shockIntensity`, `frontFill` (13).
