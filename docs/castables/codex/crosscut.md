# Crosscut Gust — `codex/crosscut`
Wind · line · range 2–18 m · no zone · ≈ 2.8 s on screen (≈0.36 s travel at 36.5 m/s for a 13 m cast + 1.15 impact + 1.25 fade)

## Read in one line
Two dark-teal scythe blades of air with white cutting edges leave the hand together, swing out either side of the line and back in, tearing up a band of turf, soil and grit as they come down to bite the floor, and cross over the group as an X; they run on, pitch over and tear apart, the debris they carried rolls on over the group as a thin dark spiral and is flung down, and an X gouged into the floor stays.

## Beats
| t (s) | Beat | On screen |
|---|---|---|
| 0.00–0.12 | Anticipation | Both blades open off the fist (outBack, 0.12 s); sparks and motes leave the hand. |
| 0.00–0.36 | Travel | Two crescents 4.6 m horn to horn, 1.25 m arc, 0.16 m thick at the spine, tilted ±0.6 rad opposite ways, ride the hit front on sine paths that swing out up to 3.2 m either side (never wider than the 0.65 rad crossing angle allows for the cast length) and back in; their faces turn with the path and the tilt sweeps 0.5 rad over the run. Deep teal bodies (#04211b) with saturated teal streaks racing to the trailing horn, which frays into wisps; a white-hot outer edge (#f2fffb), a mint spine. From ~6.5 m short of the group they bite the floor: lit clods (0.22–0.46 m, turf #36421f, soil #3f2c1b, grit #33373a; shadows) are thrown up and dragged on behind each blade in a 1.9 m band, with dark leaves and grit. |
| ≈0.36 | Impact | The blades meet over the group as it is struck and cross as an X; shake, flash, light punch, scorch residue, dust ring (burst shell almost off). |
| 0.36–1.0 | Run-on | The blades run on 5.5 m past the group (the X's far arms), pitch 0.5 rad forward and tear apart on noise with a burning mint rim (0.45 s). |
| 0.4–1.9 | Linger | Clods fall and settle half-buried along the X; 30 % of those near the group are caught by the spiral — three thin dark broken ribbons (4.6 m long, r 1 m) rolling at 9 rad/s, slowing, drifting 1.6 m, swaying — and roll round it with dark leaves flung off it. The X gash (1.5 m wide at the crossing, narrowing along its arms, dark gouge, teal-lit combed grooves, pale torn lips, a torn patch combed round at the crossing that keeps turning) holds. |
| 1.9–2.8 | Exit | The spiral swells, lifts 0.9 m and tears apart, flinging the caught clods down; clods sink into the floor; the gash erodes from 60 % into the fade. |

## Layers
1. Shear blades ×2 — `createCrosscutBladeGeometry` (`assets/codex/CrosscutGustSignatureGeometry.js`, lens-section crescent), `createCrosscutBladeMaterial` (sized in the vertex stage from settings; streaks, cutting edge, frayed horn, burn-out dissolve).
2. Debris clods — `createCrosscutClodGeometry` (faceted turf clod, vertex-coloured), `createCrosscutDebrisMaterial` (MeshStandardMaterial), InstancedMesh of up to 240, `LAYER.WORLD`, shadows; dice-only records plus a release timestamp.
3. Debris spiral — `createCrosscutRotorGeometry` (thin ribbons), `createCrosscutWindMaterial('rotor')` drawn as broken dark debris; old translucent core off (`coreOpacity` 0).
4. Gash — `createCrosscutScourMaterial`: two sweeps written behind the blades from `gashReach` short of the crossing, an X over the group; erodes.
5. Particles — lit LEAF `crosscut.leaf`, lit CHIP grit, SMOKE dust, STREAK sparks, motes.
6. Engine — SCORCH residue, DUSTRING, aftershock; world — shake, flash, light, lens distortion.
Template ribbon sweep, voice, floor grid, rig, pieces and trail are off by default.

## Signature
Two scythe sweeps that cross over the group as an X — in the air, then in the floor — and the wind is read through what it tears up and carries.

## Palette
core #f2fffb, tint #9ff5dc, body #1f9e80, deep #04211b · debris turf #36421f, soil #3f2c1b, grit #33373a

## Gameplay
Unchanged: `handlesOwnHits`, `WHEN = 'travel'` — the hit front cuts what is within `hitRadius` as it passes (`kill(…, slice)`), the blow's heading swinging from −`sweep` to +`sweep` across the line. The blades, debris and gash are presentation only.
