# Bile Lance — `codex/bilelance`
Poison · line · range 18 m · eruption reach 2.4 m · ~3.4 s total

## Read in one line
A fluted drill of bile screws down the line eating a bubbling trench, bores into the floor, and a column of dark bile bursts up out of the hole, mushrooms, slumps into a bubbling heap and sinks back.

## Beats
| t (s) | Beat | On screen |
|---|---|---|
| 0.00–0.15 | Anticipation | Lance swells out of the hand, motes gather. |
| 0.15–0.9 | Travel | 3.2 m lime spike spinning at chest height, corkscrew ribbons and wake rings, drops flung off the spin, trench eaten behind it. |
| ~0.9–1.3 | Impact | Nose pitches down and screws in (0.32 s), spiral drain opens; eruption: droplet fountain, shockwave, small wet shell, flash, shake, then the geyser bursts to 3.3 m in 0.26 s with a white-hot throat. |
| 1.3–2.6 | Linger | Geyser boils (lobes, sway) 0.28 s, then its head droops and it slumps over 0.95 s into a 0.7 m × 1.35 m heap; drips run off the head; bubble domes swell and pop on the heap; BUBBLE beads break off. Trench keeps hissing. |
| 2.6–3.4 | Exit | Heap sinks 0.35 m back into the drain; trench and drain erode on a noise threshold. |

## Layers
1. Lance — parameter tube bent in the vertex shader, fluted, normal-blended bile (`createLanceMaterial`).
2. Corkscrew ribbons + wake rings.
3. Trench — floor strip with live acid, bubbles, etched stone.
4. Bore — spiral drain floor quad + SCORCH decal.
5. Geyser — tube grid stood on end, vertex-bent column/head/foot with lobes, bubble domes and analytic normals; lit four-stop ramp (`createGeyserMaterial`).
6. Particles — DROPLET drops/drips, SMOKE mist, SOFT motes, BUBBLE beads.
7. Haze on LAYER.DISTORTION.

## Signature
The drill's grooves crawl backward; what goes down comes back up as a mass that collapses.

## Palette
core #f4ffc8 (throat only), tint #a8d830 (trench seams, veins), body #2c4608, deep #0f1604 (trench wet #16220a); screen flash 0.03 — the impact is the burst and local light

## Gameplay
Pierce along the line, eruption throw round the bore at `drillTime + eruptDelay`; stain on bodies. Unchanged.
