# Magic Boost — `linear-ext/magic`
Arcane · self buff · no range · vortex radius 0.7 m, smoke field 1.8 m · ≈ 14 s held (0.7 ramp in, 1.4 ramp out)

## Read in one line
The caster channels: a violet fresnel over the rig, twelve glowing ribbons wound round the body and turning about it, and dark violet smoke lying on the floor sheared into a spiral with the buff's light pooled under it.

## Beats
| t (s) | Beat | On screen |
|-------|------|-----------|
| 0.00–0.70 | Arrival | Envelope ramps in over 0.7 s — "arrives the way weather does"; 4.2 m shockwave ring, flash #c98bff. |
| 0.70 → 12.6 | Linger (hold) | Fresnel rim #c46bff (core #ffffff, veins #8b3cff); 12 ribbon sheets on a 0.7 m vortex (lip #ffdcff → #e05cff → #8a1fd6 → halo #2b0455); floor cloud r 1.8 m (#171032 / #160828, pool #8a2be2, glints #e3b6ff) sheared into a spiral; smoke (≈ 1 m at birth → 2.5 m, #2a1240 → #1b0d30), motes released on a 1.05 m ring (#ffe4ff → #1e0538), burns r 1.4 m (#7b3cff); light 9, r 10. |
| 12.6–14.0 | Exit | `rampOut` 1.4 s. |

## Layers
1. **Fresnel aura** — `materials/FresnelAura.js` (shaded violet from `settings.magic`).
2. **Ribbons** — `materials/ArcaneRibbonMaterial.js`.
3. **Ground smoke** — `materials/DarkFieldMaterial.js`.
4. **Smoke / motes / burns / light.** Effect class: `effects/MagicBoost.js`.

## Signature
**Wound, not struck**: slow sheets and smoke where the Electric Boost has filaments — same structure, opposite vocabulary, ramps twice as long.

## Palette
core #ffffff / #ffdcff, tint #e05cff, body #8a1fd6 / #8a2be2, deep #2b0455 / #171032

## Gameplay
Self buff, no hits. Cooldown 1 s.
