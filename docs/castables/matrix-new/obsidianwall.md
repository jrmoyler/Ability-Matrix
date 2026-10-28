# Obsidian Wall — `matrix-new/obsidianwall`
Earth (volcanic glass) · line · range 2–18 m (capture ≈13.2 m) · no zone radius (crown r 1.9 m at the end) · ≈3.6 s on screen (0.83 s travel + 1.3 s stand + ~1.5 s break, × `global.lifetime`)

## Read in one line
A V of black-glass slabs tears up out of a violet rift down the line, a crown of taller blades heaves up round the target, aftershocks jolt the wall from the hand to the crown, and then it bursts slab by slab into a fan of spinning shards.

## Beats
| t (s) | Beat | On screen (shape, size in m, colour, motion) |
|---|---|---|
| 0.00–0.25 | Anticipation | The front leaves the feet: the first pair of slabs (2.4 m, 1.45 m wide, 0.7 m thick) punches up 1.4 m ahead, rows only 0.7 m apart, overshooting 12 % then settling; the rift (#050409 core, #a070ff glow) opens between them. |
| 0.25–0.83 | Travel | Eruption front at 16 m/s: staggered slab pairs every 0.53 m, the rows splitting to 2.4 m apart and leaning out 0.24 rad, building to 3.2 m at the far end; each throws dark SMOKE, lit black CHIP grit, a CRACK and a DUSTRING decal; camera rumble. |
| 0.83 | Impact (landing) | Crown of 7 slabs, 3.6 m tall, ring r 1.9 m, leaning out 0.32 rad, erupts in a 0.18 s sweep closing from the caster's side; EARTH shell → 3.4 m, SHOCKWAVE r 6.5 m, CRACK r 3.6 m + SCORCH r 2.9 m that stay, flash #c8b8ff 0.3, knock 0.55, light +26, 110 grit + 36 dust + violet embers; bodies standing on a slab's foot are thrown off it. |
| 0.83–2.1 | Linger (stand + charge) | Aftershocks run from the hand to the crown at 14 m/s (1.6 m wide): each slab jolts 16 % taller, its cracks flare, dust and grit puff off its foot; the whole wall creeps 12 % taller. Last 0.6 s: the charge — cracks throb violet, slabs shiver 2.5 cm, sparks rise, rumble. |
| 2.1–3.6 | Exit (the break) | Slab by slab, caster first (35 ms stagger), each bursts into 6 glass bipyramids (0.42 m) thrown out of its own row's side (crown radially) at 13 m/s, tumbling, skidding and shrinking away over 1.4 s; EARTH shells down the far two-thirds of the wall, knock, flash; the rift erodes. Shards kill bodies they reach. |

## Layers
1. Slabs — 3 InstancedMeshes of faceted, jag-topped conchoidal plates (`createObsidianSlabGeometry`), `LAYER.WORLD`, shadows. Two rows + crown placed by `_slabFoot`/`_orient` from settings each frame. `assets/matrix-new/ObsidianWallGeometry.js`.
2. Volcanic glass — `createObsidianGlassMaterial` (flat facets from derivatives, conchoidal ripples, env reflection, sun glint, violet cracks + parallax inner glow, per-instance heat/charge). `materials/matrix-new/ObsidianWallMaterials.js`.
3. Fissure — `createObsidianFissureMaterial` ground strip (zigzag rift, branching cracks, scorched margin), widened to hold both rows and the crown; CRACK/DUSTRING/SCORCH decals.
4. Dust + grit — `obsidianwall.dust` (SMOKE), `.grit` (lit CHIP), aftershock puffs.
5. Charge — `obsidianwall.embers` (SOFT, additive violet).
6. Shards — 3 InstancedMeshes of glass bipyramids, analytic ballistic + skid flight; `handlesOwnHits`.
7. Beats — landing burst/shockwave/flash/knock/light; break shells, flash, knock.

## Signature
A wall that splits along its own rift: two rows leaning away from a violet seam, ending in a crown, with aftershocks you can watch run down it before it explodes.

## Palette
core #ffffff / #d8dcff (sheen), tint #c8a8ff, body #9a6bff / #5a2fd0, deep #07060b

## Gameplay
`handlesOwnHits`: slabs erupting under a body throw it (`eruptKnock`); flying/skidding shards kill bodies within `shardHitRadius`, thrown along the shard's flight (`shardImpulse/KillLift/KillSpin`). Bounded: each body once; deterministic timing from settings.
