# Bloom Crown — `codex/bloomcrown`
Nature · zone · range 18 (capture 13.2 m) · zone radius 4.4 · ≈ 4.1 s on screen (travel 0.6 + crown 1.36 + linger 1.3 + exit 0.9)

## Read in one line
A wreath of pink lotus buds flies to the circle, opens into a spinning crown that sinks down onto the bodies, snaps shut into one white-hot seed, slams it into the floor — and the crown grows back out of the ground as a ring of big blossoms on a bed of moss.

## Beats
| t (s) | Beat | On screen |
|-------|------|-----------|
| 0.00–0.60 | Anticipation / travel | 7 closed buds (0.8×) on a 1.1 m green vine circlet, 1.5 m up, spinning 5 rad/s, fly at 22 m/s to the circle. |
| 0.60–0.95 | Widen | Ring widens to 2.7 m (0.62 R) and rises to 2.3 m; pink rose-curve mandala lights on the floor (0.1 m lines, `#ff4fa8`) over a wine-dark pool. |
| 0.65–1.30 | Bloom | Buds open whorl by whorl (two whorls × 6 petals, 0.78 m), ring spins up 2.6 → 6 rad/s, tilts ±0.45 m and **sinks 0.7 m** onto the dummies' heads; petals (LEAF) and gold pollen flung off. |
| 1.45–1.83 | Gather | Blossoms snap shut white-hot from the heart, ring draws in and lifts 0.35 m, fuses into a 0.36 m almond seed. |
| ≈1.96 | Impact (slam) | Seed drops in 0.13 s: EARTH burst, SHOCKWAVE (1.5 R), DUSTRING, CRACK, flash, shake, light ×3; 160 petals, soil chips, grass blades; bodies in R thrown outward 10 m/s + 6.5 lift. Furrowed soil crater (1.4 m) opens. |
| 1.96–3.3 | Linger (garden) | A green ring runs out at 12 m/s and dies at 1.6 R; moss crawls out behind it with breathing lit veins and wine petal stains; **where the ring passes, 9 big blossoms (1.35×, ~2 m across) heave up from 0.5 m under the floor** at 0.66 R, plus a 1.5× one in the crater — each opens, turns on its stem, breathes ±12 %, the ring rotates 0.25 rad/s. |
| 3.3–4.2 | Exit | Blossoms shut, wilt and sink back into the floor; moss and crater burn away on noise from the rim in. |

## Layers
1. Crown petals — InstancedMesh of parameter-space strips curled in the vertex stage, opaque on `LAYER.SHAPED` with own depth material (shadow). `createBloomPetalMaterial`.
2. Hearts + seed — additive fresnel/vein orbs. `createBloomCoreMaterial`.
3. Garland — braided vine tube hung between blossoms in the vertex stage. `createBloomGarlandMaterial`.
4. Sigil — rose-curve mandala, filled petals (`sigilFill`), slam flare, green ring that fades at its reach. `createBloomSigilMaterial`.
5. **Ground** (new) — normal-blended: wine pool → soil crater with furrows and lip, moss with breathing veins, petal stains, noise burn-away. `createBloomGroundMaterial`.
6. **Garden** (new) — second InstancedMesh of the same petal material + instanced hearts; placement derived (`gardenRadius × zoneRadius`, sprout at `r / waveSpeed`).
7. Particles — petals LEAF (lit), pollen SOFT (additive), soil CHIP, grass LEAF.
8. Lens ring on `LAYER.DISTORTION`; EARTH burst, SHOCKWAVE/DUSTRING/CRACK decals; flash, shake, light.

All in `packs/sandbox/src/abilities/codex/BloomCrownAbility.js`, `materials/codex/BloomCrownMaterials.js`, `assets/codex/BloomCrownGeometry.js`, `config/codex/bloomcrown.js`.

## Signature
The crown is struck into the earth as a seed and grows back out of it as a garden.

## Palette
Petals: core `#fff4d6` (charge) → tint `#ff8fc2` → body `#c22a78` → deep `#2e0620`. Floor: moss `#1d5a22` / veins `#8af06a` / deep `#12050d`.

## Gameplay
`handlesOwnHits`: nothing while the crown turns; at the slam every body within `hitReach × zoneRadius` is thrown outward from the centre, harder near it.

## What the capture shows (after upgrade)
f8 wreath of buds in flight at the cluster; f20 crown widening over the pink mandala; f40 open blossoms low among the dummies, mandala filled; f70 slam: bodies airborne, green ring, crater, garden breaking the soil. Extra frames (f100) show the full garden on moss.
