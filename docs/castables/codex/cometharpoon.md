# Comet Harpoon — `codex/cometharpoon`
Cosmic · line · range 18 (capture 13.2 m) · strike radius 3.4 · ≈ 3.2 s on screen (travel 0.44 + bloom 0.45 + hold 0.9 + exit 1.4)

## Read in one line
A barbed harpoon with a 1.3 m lump of dirty comet ice impaled behind its head flies the line on a starlight tether, trailing blue and gold tails, drives into the target and a lotus of solid ice blades bursts up round the buried nucleus, then melts while the nucleus boils away.

## Beats
| t (s) | Beat | On screen |
|-------|------|-----------|
| 0.00–0.44 | Travel | Harpoon (3.5 m at scale 1.35) on a shallow 1.4 m arc, nucleus (0.68 m radius, 1.25× long, faceted, cratered) tumbling on the shaft, forward face boiling white; blue coma, ion tail 6 m, gold dust tail 4.5 m curving right; 0.07 m tether with running beads; nucleus casts a shadow on the floor. |
| 0.44 | Impact | Head drives 0.55 m in and shudders; nucleus squashes; FROST shell (1.9 m, deep blue), 6.5 m shockwave, pressure ring, sparks, gold grains, vapour plume, flash, shake; nearest body yanked back down the tether, others thrown. |
| 0.44–0.9 | Bloom | 7+7 **solid ice blades** (lit, faceted diamond section, ~2.3 m outer) heave up round the strike at ~38° from vertical under the ice-light petals; frost cracks race out over a deep navy crater. |
| 0.9–1.8 | Linger | Lotus turns 0.5 rad/s and breathes; light runs out along the cracks; frost creeps 35 % wider; nucleus seams pulse. |
| 1.8–3.2 | Exit | Blades melt from their tips and sink; nucleus sublimates on noise, vapour boiling off; tether frays from the hand; harpoon dissolves butt-first; crater cools and erodes. |

## Layers
1. **Nucleus** (new) — `createCometNucleusGeometry` (subdivided icosphere, lattice-noise lumps, 7 craters, flat-shaded) + `createIceSolidMaterial('nucleus')`, `LAYER.WORLD`, casts shadow.
2. **Ice blades** (new) — `createIceBladeGeometry` (curved, diamond-section spike), InstancedMesh ×24, `createIceSolidMaterial('blade')`, `LAYER.WORLD`, casts shadow; placement from `petals`, `petalOpen × bladeOpen`, `petalLength × bladeLength`.
3. Harpoon — lit comet-ice spear, white-hot broadhead, gold barbs/eye.
4. Coma + lens (`LAYER.DISTORTION`), ion and dust tails, tether — ribbons bent in the vertex stage.
5. Light-petals — additive ice-light skin over the blades.
6. Crater — navy pit, frost, gold ring, cracks with running light, creeping frost.
7. Particles — grains SOFT, sparks STREAK, vapour SMOKE (incl. sublimation).
8. FROST burst, SHOCKWAVE + FROST decals, flash, shake, light punch.

Files: `abilities/codex/CometHarpoonAbility.js`, `materials/codex/CometHarpoonMaterials.js`, `assets/codex/CometHarpoonGeometry.js`, `config/codex/cometharpoon.js`.

## Signature
A comet you can see is a rock: the ice body rides the harpoon in and the blossom grows from it.

## Palette
Ice: core `#f2fbff` → tint `#9fd8ff` → body `#2a6ae0` → deep `#060f2e`; dust/grain gold `#ffd47a` → `#5a2a08`.

## Gameplay
`handlesOwnHits`: nearest body within `impaleRadius` is yanked toward the caster; all others within `bloomRadius` are thrown outward and up.
