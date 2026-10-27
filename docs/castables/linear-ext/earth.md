# Earthen Spire — `linear-ext/earth`
Earth · line · range 0–18 m (capture: 12.6 m) · no zone · ≈ 4.4 s on screen (0.48 travel + 0.76 tower rise + 1.3 hold + 1.9 sink)

## Read in one line
A band of stone plates paves itself along the line and breaks behind the head as boulders heave through the cracks, and at the end a 5.8 m amber-glass tower climbs out of the floor inside a ring of shouldered boulders.

## Beats
| t (s) | Beat | On screen |
|-------|------|-----------|
| 0.00 | Anticipation | `cast3`, low hand (0.25 m — earth is grounded), cast flash 0.06 #cba37a. The first 1.8 m in front of the caster are kept clear (`startOffset`). |
| 0.00–0.48 | Travel | Head at 26 m/s; plates (r 0.7 m, 0.16 m thick) surface flush with the floor over `paintTime` 0.18 s across a 1.2 m band. A fracture wave trails the head by `crackDelay` 0.35 s and breaks the crust: plates lever up to 0.33 rad and drop into the seams; ~14 boulders (0.43 m) heave 1 m out of the cracks every 3.3 m, tumbling 5.9 rad/s; pebbles 22/s and dust at the head; warm light #ff9a3c follows the front. |
| 0.48 | Impact | Tower starts climbing; a ring of 18 boulders (r 1.8 m) shoulders up around the plinth. Flash 0.59 #e9a56c, shake 0.65 (0.9 s). |
| 0.48–1.24 | Impact cont. | Tower rises over 0.76 s to 5.8 m (base half-width 1.35 m); its gold outline shell pulses up to 2.4 on appearance and decays (rate 1.5/s) to 0.6. |
| 1.24–2.54 | Linger | Tower holds 1.3 s, outline pulsing 2.4 Hz; crust and loose rocks stand to `lifetime` 3.65 s. |
| 2.54–4.44 | Exit | Crust, rocks and tower sink out of sight over 1.9 s (crack-side rocks linger +0.22 s). |

## Layers
1. **Crust plates** — instanced plates, `materials/RockMaterial.js` (warm #7c5634, dark #3a2618, moss #5a6b3a on up faces), hot crack seams (glow 0.76).
2. **Boulders** — instanced rocks from `assets/ProceduralGeometry.js`, same rock material, shadows.
3. **Tower** — one mesh with `materials/GlassMaterial.js` (transmission 0.95, IOR 1.5, tint #ffe9a8, attenuation #ffd54a over 0.4 m, opacity 0.55) plus an outline shell 0.06 m off the body (#ffd54a).
4. **Dust & debris** — dust trail (size 0.85, 2.2 s), debris chips at 5.7 m/s, pebbles at the head.
5. **Light, flash, shake.**

## What the capture shows
- **f20 (0.67 s)** — a 1.2 m band of warm brown stone plates runs from the caster's feet to the target; at the end a dark, glassy obelisk with a thin gold outline is climbing, a translucent pale dust/impact dome around its base, a ring of shouldered rocks.
- **f40 / f70 (1.3 / 2.3 s)** — the tower leaves the top of frame; the plate band is broken and tilted into rubble; the dome has cleared. The rock reads as earth (heavy, shadowed, warm) but the plates are uniform and the tower's glass body is dark — the silhouette carries less detail than the other originals (it is the oldest of them, 75 controls).

## Signature
**Three-beat paving**: lay → break → monument. The crust is laid flush and *then* broken by a second wave trailing the first, so the travel itself has two beats before the tower lands.

## Palette
core #ffd54a (tower rim), tint #ffe9a8, body #7c5634, deep #3a2618

## Gameplay
Line cast via `DummyField`. Cooldown 1.4 s. Fewer controls (75) than the other originals; the plate/rock look is a shared rock material rather than a bespoke shader.
