# False Floor — `codex/falsefloor`
Illusion · zone · range 2–18 m · circle 4.2 m · ≈2.8 s on screen (≈0.5 s travel + 1.05 impact + 1.25 fade)

## Read in one line
A heave of flagstones runs along the floor to the circle, which paves itself with slabs that pass for the real floor; on the commit every slab drops straight down, tumbling, into a dark shaft with stone walls; the shaft stays open, its walls sliding upward as if the fall never ends; then the slabs fly back up, the floor closes rim first, and the stones sink into the real floor.

## Beats
| t (s) | Beat | On screen |
|---|---|---|
| 0.00–0.50 | Anticipation / travel | Hand flare. A wave of 0.85 m slate flagstones heaves up 0.22 m out of the floor and sinks back behind the front (3 m long), starting 3 m past the hand. From 35 % of the travel the circle paves itself near edge to far edge with ≈60 0.9 m slabs standing 3 cm proud; their dusty-rose seams flicker harder as the front closes (the lie wearing thin). |
| ≈0.50 | Impact — the drop | Every slab falls straight down (kick 3 m/s, 22 m/s²), tumbling, centre first (0.18 s to the rim). Under them the pit opens centre-out: an interior-mapped shaft 4 m deep, stone courses darkening into a violet-black bottom. Eight cracks tear round the rim, 60 stone chips; shake, light punch, flash 0.04. Bodies drop (template hit `down`). |
| 0.6–1.9 | Linger | The open shaft: its wall slides upward at 1.6 m/s (the endless fall), slow rose bands in the mortar, haze motes rising out (40/s). |
| 1.9–2.5 | Exit — the lie reasserts | From fade 1.3 the slabs fly back up out of the shaft (outBack, rim first over 0.25 of the fade clock), their seams lit as they move; the pit closes behind them from the rim in. |
| 2.5–2.8 | Exit | The reformed slabs sink into the real floor and the seams go out; the dark residue and rim cracks stay. |

## Layers
1. Flagstones — `createFalseFloorTileGeometry` (`assets/codex/FalseFloorSignatureGeometry.js`: chamfered, slightly irregular slab, `aHeat` seams), InstancedMesh ≤170, `createFalseFloorTileMaterial` (MeshStandard slate #2b3040 with grain, ramped seam glow × per-instance `aState`, sheen sweep, strain flicker), `LAYER.WORLD`, shadows.
2. Travelling wave — a second InstancedMesh of the same slab (≤40).
3. Pit — `createFalseFloorPitMaterial`: disc on the circle shading, by interior mapping, a 4 m shaft (brick courses, depth falloff, near-black bottom #07040b, haze #2a0c26, rose mortar #8a3a6e, lip); drawn after the decals.
4. Decals — eight CRACKs round the rim, template SCORCH residue (darkened) and telegraph.
5. Particles — lit CHIP stone, SMOKE dust, SOFT haze motes rising from the shaft.
6. World — shake, light punch (muted rose light), aftershock.
Off by default (sliders kept): template dome body, lens, voice, pink field, pieces, rig.

## Signature
The floor lies, then tells the truth, then lies again: solid slabs, a real hole with depth under them, and the slabs coming back to close it.

## Palette
core #fff6fb, tint #ffd6ef, body #f25fc6 (seams only), deep #5c0a43 / slate #2b3040 / pit #07040b

## Gameplay
Unchanged: `handlesOwnHits`, commit hit on the beat, blow `down`, carry `up`, glamour mark.
