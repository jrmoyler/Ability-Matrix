# Rune Meteor — `codex/runemeteor`
Arcane · zone · range 18 (capture 13.4 m) · zone radius 4.2 · ~3.5 s on screen + 2 s invisible camera settle

## Read in one line
A rune-wrapped crystal star drops out of the sky into a darkening rune circle, punches a glowing crater, flings its stone petals out into a henge, charges it and detonates from the middle.

## Beats
| t (s) | Beat | On screen |
|-------|------|-----------|
| 0.00–0.6 | Anticipation | Sigil rings draw round the 4.2 m circle; the circle floor darkens to a deep indigo pool tightening on the strike point (the star's shadow). |
| 0.0–1.15 | Travel (the fall) | The 0.75 m faceted star kindles 5.5 m up in a 4.5 m light column, rune bands precessing round it, rune-stone petals wrapped round it, and plummets (fall curve 2.2). |
| 1.15 | Impact (landing) | 2.2 m crater bowl with a lip and 9 fissures glowing `#9aa8ff`, CRACK + DUSTRING decals, indigo dust, sparks, chips, shake, flash, warp ring; bodies within 1.6 m thrown. |
| 1.15–1.9 | Unfold | Seven 2.2 m slate stones tumble out on arcs and plant on the ring at 0.82 R; star rises to hover 2.3 m. |
| 1.9–2.65 | Linger (charge) | Tethers from the star to each stone; a chase of lit runes runs round the henge, the fissures re-heat. |
| 2.65 | Impact (nova) | 5 m shell (white → `#7f8cff` → `#1d1e5e`), 9 m shockwave, flash, light punch; bodies in the circle thrown 13 m/s. |
| 2.65–3.75 | Exit | Henge crumbles stone by stone, sinking, chips off each; crater cools to slate and fades. |

## Layers
1. Stones — instanced pointed slabs, lit slate with carved runes (`createStoneMaterial`).
2. Star — cut crystal with swirl (`createOrbMaterial`).
3. Rune bands ×2, beams (fall column + tethers), sigil (`materials/codex/RuneMeteorMaterials.js`).
4. **Ground** (new, `createGroundMaterial`) — normal-blended: shadow pool → crater bowl, lip, fissures; deep `#080920`, lip `#2b2f5c`, hot `#9aa8ff`.
5. Particles: motes (SOFT), sparks (STREAK), dust (SMOKE), chips (CHIP).
6. Warp on `LAYER.DISTORTION`; decals; bursts; light.

## Camera (regression fixed)
The cast used to frame the star 26 m up: the orbit target rose, the pitch clamped at `maxPolar`, then fell back steeper — every later cast in the session was shot from above. Now `frameHeight` (2.4 m) caps what the camera frames, the drop is 7 m so the fall is in shot, and a cast-local `PitchKeeper` holds the pitch through the cast + `cameraSettle`; a clear restores the rest pose. Test: `tests/upgrade-camera-restore.test.mjs`.

## Signature
A falling star that turns into its own stone circle and then detonates from inside it.

## Palette
core `#f4f6ff` → tint `#b7c3ff` → body `#7f8cff` → deep `#1d1e5e` / `#080920`.

## Gameplay
`handlesOwnHits`: one landing throw (`landRadius`) and one nova throw over `zoneRadius`.
