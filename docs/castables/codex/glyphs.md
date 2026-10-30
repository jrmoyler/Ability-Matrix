# Glyph Barrage — `codex/glyphs`
Arcane · line · range 3–20 m · glyph radius 1.1 m · ≈ 4.5 s on screen (≈1 s stamping + 0.4 charge + 0.75 chain + 0.9 pillar + 1.6 fade)

## Read in one line
Six heavy obsidian seal-stamps are thrown down the line ahead of the front and slam face-down one by one, each printing a glowing rune circle into a dark imprint; they lift to hover over their prints while the chain charges, then the prints erupt outward from the caster into violet pillars that swallow their seals, leaving burnt sigils on the floor.

## Beats
| t (s) | Beat | On screen |
|---|---|---|
| 0.00–1.0 | Anticipation + travel | Each seal (striking face 0.6 m radius, 0.8 m tall, rune band, turned handle; lit obsidian #1c1530, shadowing) is thrown from 2.6 m back, arcs in, and slams face-down the frame the front reaches its point: squash 22 %, 16 obsidian chips + a DUSTRING kicked up, SCORCH imprint (#0c0620, 4.5 s), shockwave ring, motes, knock 0.12. The sigil draws itself on; a ley line follows. |
| per glyph | Hover | After 0.08 s in its print the seal lifts (outBack) to 1.95 m, a binding shaft of rune-rain (cone, seal face → 0.8 R at the print, tint → body → deep) hangs from it into its own sigil, bobs and turns, its engraved runes glowing; the chain charges 0.4 s — seals tip toward their prints and throb down the line. |
| hold + k·0.15 | Impact (chain, outward) | Glyph k erupts, nearest the caster first: a 7 m pillar (thin white axis only, tint → body → deep #1a0a4a at the walls), STORM shell 1.6 m, shockwave, shards, streaks, halo rings; its seal is flung up and swallowed (0.45 s); a 1.5 m SCORCH burn (6 s) is left; bodies on it are lifted up the column and thrown. The last, biggest beat lands at the far (target) end. |
| fade 1.6 s | Exit | Spent sigils come off ring by ring; imprints and burns outlive them. |

## Layers
1. Seal stones — `assets/codex/GlyphBarrageGeometry.js` (faceted lathe) + `createGlyphSealMaterial` (patched MeshStandard, instanced `aSeal` glow) on `LAYER.WORLD`.
2. Sigils — SDF ground shader per glyph, now on an inked plate (premultiplied: deep #0d0628 disc darkening the floor, violet ink swirling in it). 2b. Binding shafts — `createGlyphBindMaterial`, seal → print. 3. Rune fragments (instanced billboards). 4. Pillars (four-stop ramp, premultiplied with deep walls covering what is behind — `pillarCover` — so a chain lined up along the view converges on violet, not white; HDR only in the axis) + lens on `LAYER.DISTORTION`. 5. Shockwave, STORM shell, SCORCH imprint/burn decals. 6. Particles: CHIP shards, STREAKs, SOFT motes, RING halos. 7. Ley line. 8. Bodies lifted in the pillar.

## Signature
The stamp is a thing: a seal you see thrown, slammed and lifted off its print, then eaten by the light it printed.

## Palette
core #ffffff / #f4f2ff, tint #9aa6ff / #c4b6ff, body #6a3dff / #7c8cff, deep #1a0a4a / #0c0620

## Gameplay
Unchanged `handlesOwnHits`: bodies on a glyph are marked, and on its eruption knocked up, held in the pillar and thrown. Default `chainOrder` is now 1 (outward), so the chain ends at the target rather than on the caster.

## What the capture shows (upgrade C)
`/tmp/claude-0/-home-user-Ability-Matrix/8cc56224-c22f-51ae-821d-6da7489331c5/scratchpad/up-C/r2/codex__glyphs-sheet.jpg`: filled violet-plated sigils, seals hovering on violet binding shafts that run back to their prints (the "stack" at the far end is now visibly the line of hovering seals), f70 a violet column with a pale axis and deep top instead of a white slab. Before 7 → after honest 8. Short: from the caster camera the hovering seals still overlap one another in screen.
