# Electric Boost — `linear-ext/boost`
Lightning · self buff · no range · body radius 0.39 m, floor field 1 m · ≈ 13.7 s held (0.35 ramp in, 0.9 ramp out)

## Read in one line
The caster is charged: a cold-blue fresnel rim over the whole rig, 25 hairline arcs struck over and off the body twenty-odd times a second, and under their feet a 1 m crater of shattered black floor with blue charge burning in its seams, flat rings of lightning lying round it and short uprights struck off its rim.

## Beats
| t (s) | Beat | On screen |
|-------|------|-----------|
| 0.00–0.35 | Anticipation / arrival | One 0..1 envelope ramps in over `rampIn` 0.35 s (a snap — the fastest of the three buffs); a 4.5 m shockwave ring across the floor, flash #c9ecff. |
| 0.35 → 12.8 | Linger (hold) | Fresnel over every rig material (`colorRim` #7fc9ff, core #009dff, veins #4a92ff, scan band 18 % of body height); 25 arcs re-rolled 5.4×/s (#ffffff → #c9ecff → #3aa0ff → halo #0b3fc8); floor crater (crust #03060c, plates #0b1622, seams #3aa0ff, embers #c9ecff); 6 flat coil rings lifting to 0.55 m; 30 uprights struck 9.4×/s, 0.7 m high, 28 % arching across; sparks 800/s, motes 70/s, electric burns 3.5/s (r 1 m); light 11, r 9 at 1.1 m. |
| 12.8–13.7 | Exit | `rampOut` 0.9 s: the same envelope lets go. |

## Layers
1. **Fresnel aura** — `materials/FresnelAura.js` patch over the character's materials (shared by all three buffs).
2. **Body arcs** — `materials/BodyArcMaterial.js`.
3. **Charge field** — `materials/ChargeFieldMaterial.js` (crater, rings, uprights).
4. **Sparks / motes / burns / light** — particles + decals. Effect class: `effects/ElectricBoost.js` (not an `Ability`).

## What the capture shows
Not captured. `node tools/capture-cast.mjs <out> linear-ext/boost` fails with `Unknown ability linear-ext/boost` (`App.select`): the self buffs are catalogue entries (`kind: "buff"`) but are not registered as castable abilities in the sandbox the capture tool drives. This storyboard is written from the code and settings only.

## Signature
**Struck**: hairline filaments re-rolled many times a second, arriving in a snap — the vocabulary the other two buffs are defined against.

## Palette
core #ffffff, tint #c9ecff / #7fc9ff, body #3aa0ff, deep #0b3fc8 / #03060c

## Gameplay
Self buff, no hits; one 0..1 envelope drives every layer. Cooldown 1 s.
