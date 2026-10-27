# Volcanic Ward — `linear-extended/ward`  ★ reference (§1, zone cast)
Fire (volcanic / blood) · zone · range 0–20 m (capture: 14 m) · zone radius 5 m · ≈ 6.7 s on screen (0.19 surge + 5.2 stand incl. 0.34 seal + 1.3 tear-down)

## Read in one line
A surge of melt runs to the circle, the stone inside shatters into plates with magma in the seams, six obsidian slabs heave up in a ring, and a 4.4 m cylinder of dark blood closes over everything — burning rune bands at its foot and rim, a lens flare at its heart — and beats like a heart at 58 bpm until the membrane tears from the rim down and the slabs sink back into the cooling melt.

## Beats
| t (s) | Beat | On screen (shape, size in m, colour, motion) |
|-------|------|----------------------------------------------|
| 0.00–0.19 | Anticipation + travel | Muzzle flash 0.55 m at the hand (1.2 m), cast flash 0.1 #ff6a3a; the surge runs at 74 m/s laying burn/gore marks 1.2 per metre. |
| 0.19–0.53 | Impact (seal) | `sealTime` 0.34 s: the floor fractures into a voronoi plate network out to R; the six monoliths (1.9 m ± 0.5, 1.3 m wide, 0.55 thin, leaning 0.14 rad out, seated at 0.62 R) come up as a sweep over 0.36 s; the membrane closes. On the seal: a thin, brief, heavily-fresnelled FIRE shell 0.5 → 2.4 m over 0.38 s (pressure, not a boulder), 8.5 m shockwave (#ff3a14/#ffd8a0), shake 0.95 (0.7 s), flash 0.3 #ff4a20, 2.2 m scorch. **The first heartbeat lands on the seal frame** (`_beat = 1`). |
| 0.53–5.39 | Linger | Heartbeat at 58 bpm (≈ 1.03 s period), `heartbeat(phase) = min(1, exp(−((p−0.08)·9.5)²) + 0.55·exp(−((p−0.3)·12)²))` — a systole and a smaller diastole. On every beat: the membrane radius swells 4.5 %, runes flare, a vein-flash wave climbs each slab at 3.4 m/s, the magma pumps and a ring pushes across the stone, the core flare relights (42 %), 46 embers + 5 gore droplets are thrown, camera knock 0.05, the light (#ff4a1c, r 22, low on the wall) throbs. Between beats blood runs *down* the wall (ridged noise scrolled down), the rune ring turns 0.03 rev/s with a read-head sweeping round it, heat haze rises 1.15 × the wall, embers 300/s lift off the seams, gore marks 3.5/s, dust rings 0.9/s. |
| 5.39–6.69 | Exit | `fadeTime` 1.3 s: the membrane **tears from the rim down** behind a 0.2-wide burning dissolve edge, the slabs sink back into the melt, beats weaken (× (1 − 0.65·collapse)) and stop throwing FX past 75 %; the floor cools. |

## Layers
1. **Blood barrier** — `materials/WardBarrierMaterial.js`: one open unit tube drawn **twice** (back faces first = far wall, then front faces), alpha-blended so it *tints* what is behind it. Vertex stage barrels it at the waist, opens the rim, breathes on the beat and adds metre-scale lobes. Fragment: downward ridged runs (world space), triplanar voronoi cells, hot hoops at floor and rim (`rimTop` 0.05), fresnel, all gained by the beat. Membrane #8d0f18, flow #e0241c, rim #ff9a6a, deep #26030a.
2. **Magma fracture floor** — `materials/WardGroundMaterial.js`: true voronoi edge network lit off a world-space gradient of its own height field; crust #0b0708, plate #1d1214, magma #ff4a12 / hot #ffd8a0, edge #ff2a14.
3. **Obsidian monoliths** — `materials/ObsidianMaterial.js` on lit slab geometry: #1c1416 / char #070406 with **sub-surface veins** (#ff2f10 / #ffdca6) sampled along the view ray so they sit *under* the surface, flashing as the beat climbs.
4. **Rune bands** — two rings of 42 procedurally cut glyphs (0.38 m bands) at foot and rim, #ff3a16 / core #ffdcae.
5. **Lens flare** — 5 m flare at 1.15 m with an anamorphic streak (×2.2) and the ring the seal throws; core #fff3dc, streak #ff5c20, ghost #8f0f12.
6. **Heat distortion** — proxy on `LAYER.DISTORTION`, 1.15 × wall height.
7. **Particles** — embers `SOFT` (#ffe6bd → #2c0503), obsidian flecks `CHIP`, gore droplets `SOFT` non-additive (#c11a1e → #210306), smoke `SMOKE`; gore splat decals (#5c0a10 / #c0201c).

## What the capture shows
_(filled from the dense pass, `docs/castables/sheets/linear-extended__ward-sheet.jpg`)_

## Signature
**It is alive**: one heartbeat envelope, evaluated once per frame, is handed to every material, the light, the camera and the emitters — eight separate systems pulse as one organ.

## What makes it the bar
1. **One shared envelope instead of free-running sines.** `_beat = heartbeat(phase % 1)` (the two-gaussian systole/diastole above, phase advancing at `bpm/60`) is written into a shared `state` object read by all four lit materials, multiplied into the light (`1 − 0.55·lightBeat + 1.35·lightBeat·beat`) and fired as discrete `_beatFx` bursts on each beat. Copy: give a lingering zone one rhythmic envelope and route *everything* through it; the first beat lands on the impact frame.
2. **A barrier with depth.** Draw the same open cylinder twice — back faces then front faces, normal alpha blending — so you see the far wall *through* the near one and the volume reads as a tinted liquid, not a glass shell. Shape the silhouette in the vertex stage (barrel, rim flare, beat throb, lobes); a fragment-only pattern on a perfect cylinder reads as a texture.
3. **Glow under the surface.** Obsidian veins are sampled along the view ray (parallax), so the melt sits inside the stone; the beat climbs each slab as a vein-flash wave (3.4 m/s, 1 m wide) — the floor's pulse visibly travels up into the monoliths.
4. **A floor lit by its own height field.** The magma fracture is a true voronoi edge network; its lighting comes from the gradient of its own height, so plates have relief without geometry.
5. **Readable hoops.** The two hot rim bands (floor and top) plus two rune rings are what make the cylinder legible at 8 m — a membrane without hard edges disappears.
6. **Exit by tearing.** The membrane dissolves from the rim *down* behind a burning edge while beats decay — a directed exit, not an alpha fade.

## Palette
core #ffdca6 / #fff3dc, tint #ff9a6a, body #e0241c / #ff4a12, deep #26030a / #0b0708

## Gameplay
Zone cast; hits from the circle via `DummyField`. Cooldown 2.4 s.
