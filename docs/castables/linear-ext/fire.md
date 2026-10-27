# Fire Boost — `linear-ext/fire`
Fire · self buff · no range · orb ring radius 1.09 m, burn field 1.5 m · ≈ 13.5 s held (0.5 ramp in, 1.4 burn down)

## Read in one line
The caster burns: a heat fresnel over the rig, tongues of fire rooted on the character's own bones that swing with the arms, eight small fire orbs circling on leaning rings each dragging a wake of flame, and the floor burnt black under them with fire still working in the cracks.

## Beats
| t (s) | Beat | On screen |
|-------|------|-----------|
| 0.00–0.50 | Arrival | Envelope ramps in over 0.5 s (between the snap of the charge and the weather of the channel); 4.8 m shockwave ring, flash #ffb066. |
| 0.50 → 12.1 | Linger (hold) | Fresnel rim #ff6a1e (core #ffd27a, veins #ff9a2e); **tongues** rooted on bones (core #fff3d0 → body #ff8a20 → ember #e0430a → smoke #160705); **orbs** (8, r 0.025 m with a corona 2.8×) turning on leaning rings of r 1.09 m, each trailing fire (#fff2cc → #ff7a14 → #cc2c06 → #140705); burn field r 1.5 m (char #0a0503, cracks #ff5a10, embers #ffc46a, ring #ff7a1e); embers (#fff0c0 → #3a0a02), smoke, scorches r 0.9 m; light 13, r 9.5 at 1 m. |
| 12.1–13.5 | Exit | `rampOut` 1.4 s burn-down. |

## Layers
1. **Fresnel aura** — `materials/FresnelAura.js` (the mask that puts the fire *on* the character).
2. **Body tongues** — `materials/FireBodyMaterial.js`, rooted on the rig's bones.
3. **Orbs + derived trails** — `materials/EmberOrbMaterial.js`: each trail is the orb's own orbit **sampled backward in time**, not a recorded history.
4. **Cinder field** — `materials/CinderFieldMaterial.js`.
5. **Embers / smoke / scorches / light.** Effect class: `effects/FireBoost.js`.

## Signature
**Fire on the body, not near it** — tongues follow bones through a cast, and orb wakes are analytic, so tilting the rings with the clock stopped re-sweeps a second of trail instantly.

## Palette
core #fff3d0 / #fff7e0, tint #ffd27a, body #ff8a20 / #ff6a1e, deep #160705 / #0a0503

## Gameplay
Self buff, no hits. Cooldown 1 s.
