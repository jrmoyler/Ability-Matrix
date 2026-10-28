# Arc Relay — `atlas/relay`
Storm (chain) · line · range 3–18 m · capture 7 m relay radius · ≈ 0.3 s seek + up to 1.6 s growth + 0.85 s overload + 1.1 s wreckage + 0.6 s fade; floor marks stay 4.5–5.5 s

## Read in one line
A braided bolt runs from the hand to the first body and holds it as a relay; the lattice branches body to body, each held under a blazing node over a spinning seal, strains white, then every relay discharges on the same frame and the bodies are thrown outward, leaving the network burnt into the floor.

## Beats
| t (s) | Beat | On screen |
|-------|------|-----------|
| 0.00–0.3 | Anticipation + travel | Spark spray at the hand; thin leader tether races down the line at 30 m/s shedding motes. |
| 0.3 | Claim | First body caught within 1.7 m: node core (1.6 m billboard) blazes over it, seal draws in under it (r 1.15 m), ARC burn, sparks, flash; the link's ground track is burnt as a dotted line of ARC + SCORCH marks (every 0.9 m). |
| 0.3–1.6 | Growth | Every 0.32 s each newest relay claims up to 2 nearest bodies within 7 m (max 6): braided white/cyan/violet tethers with travelling packets, more scars. |
| 1.6–2.45 | Overload | Cores swell ×1.55, tethers widen and whiten, seals throb, warp climbs, camera rumbles. |
| 2.45 | Impact | All relays die on one frame: STORM shell 2.6 m + SHOCKWAVE 3.4 m + dark SCORCH 1.7 m (5.5 s) each, spark/mote rings, hard shake + flash; bodies thrown along their branch. |
| 2.45–4.15 | Linger + exit | Tethers snap into pieces and fade; seals wipe outward; the scars and scorches stay on the floor well after the cast. |

## Layers
1. Tethers — parameter-space braided ribbons placed in the vertex stage (`ArcRelayGeometry`, `createRelayTetherMaterial`).
2. Relay cores — polar billboard plasma ball, filaments, broken ring (`createRelayCoreMaterial`).
3. Ground seals (`createRelaySigilMaterial`) + ARC burn per claim.
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
