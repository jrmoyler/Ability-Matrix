# Arc Relay — `atlas/relay`
Storm (chain) · line · range 3–18 m · capture 7 m relay radius · ≈ 0.3 s seek + up to 1.6 s growth + 0.85 s overload + 1.1 s wreckage + 0.6 s fade; floor marks stay 4.5–5.5 s

## Read in one line
A braided bolt runs from the hand to the first body and holds it as a relay; the lattice branches body to body, each held under a blazing node over a spinning seal, strains white, then every relay discharges on the same frame and the bodies are thrown outward, leaving the network burnt into the floor.

## Beats
| t (s) | Beat | On screen |
|-------|------|-----------|
| 0.00–0.3 | Anticipation + travel | Spark spray at the hand; thin leader tether races down the line at 30 m/s shedding motes. |
| 0.3 | Claim | First body caught within 1.7 m: a **conductor cage** tears up out of the floor round it (5 lit blued-steel rods, insulator stacks, hooked points; feet at 0.85 m, points crowning the head at 2.25 m; staggered 35 ms, 0.24 s outBack rise, shadows), node core (1.6 m billboard) blazes over it, a filled charged plate draws in under it (r 1.15 m, deep #050818 plate, plasma field #2a58e8, veins), ARC burn, sparks, flash; the link's ground track is burnt as a dotted line of ARC + SCORCH marks (every 0.9 m). |
| 0.3–1.6 | Growth | Every 0.32 s each newest relay claims up to 2 nearest bodies within 7 m (max 6): braided white/cyan/violet tethers with travelling packets, more scars. |
| 1.6–2.45 | Overload | Cores swell ×1.55, cage heat creeps from the points down the whole rod (deep → body → tint → white point) and the cages open 0.22 rad, tethers widen and whiten, plate veins thicken, warp climbs, camera rumbles. |
| 2.45 | Impact | All relays die on one frame: STORM shell 2.6 m + SHOCKWAVE 3.4 m + dark SCORCH 1.7 m (5.5 s) each, spark/mote rings, hard shake + flash; bodies thrown along their branch. |
| 2.45–4.15 | Linger + exit | Rods blown outward 0.95 rad white-hot (0.16 s), cool down the ramp over 0.45 s, then topple-sink into the floor (from +0.5 s over 1.05 s); tethers snap into pieces and fade; plates wipe outward; the scars and scorches stay on the floor well after the cast. |

## Layers
1. Tethers — parameter-space braided ribbons placed in the vertex stage (`ArcRelayGeometry`, `createRelayTetherMaterial`).
2. Relay cores — polar billboard plasma ball, filaments, broken ring (`createRelayCoreMaterial`).
2b. Conductor cage (hero) — `createRelayProngGeometry` (faceted hexagonal lightning rod, insulator stack, hooked point) × 5 per relay, one InstancedMesh on LAYER.WORLD, `createRelayProngMaterial` (patched MeshStandard, per-instance heat through the four-stop ramp, grooves first).
3. Ground plates (`createRelaySigilMaterial`, premultiplied: deep floor-darkening disc + plasma field + current veins under the seal lines) + ARC burn per claim. Shockwaves reduced (2.6 m, intensity 0.75) so six at once read as one blast.
3b. Conduction scars — ARC + SCORCH decals along every link's ground track; SCORCH per relay at discharge.
4. Sparks (STREAK) + motes (SOFT).
5. Discharge STORM shells + SHOCKWAVE decals.
6. Heat warp per relay on `LAYER.DISTORTION`; light at the lattice centroid.

## Signature
Bodies are kept, not killed — until all of them go at once; the floor keeps the shape of the network.

## Palette
core #ffffff, tint #82e9ff, body #2f6bff / #5b3cff, deep #070b1c

## Gameplay
`handlesOwnHits`; nobody dies until the discharge, then every relay is killed on the same frame along its branch (`hit` impulse 6.5 / lift 6 / spin 2). No body on the line: the leader grounds at the end and kills within `groundRadius`.

## What the capture shows (upgrade C)
`/tmp/claude-0/-home-user-Ability-Matrix/8cc56224-c22f-51ae-821d-6da7489331c5/scratchpad/up-C/r2/atlas__relay-sheet.jpg` (frames 8/20/32/45/70): f32 dark steel cages with hot points round every held body, filled plates under them; f45 the cages white-hot and opened; f70 rods blown outward blue-cooling over dark scorched plates, bodies thrown. Before: no solid form, white outline rings (7). After: honest 8. Short: the rods are thin at 8 m when a body stands in front of them.
