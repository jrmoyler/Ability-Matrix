# Verdant Gate — `linear-ext/portal`
Nature · gate (standing structure) · range 3–17 m (capture: 12.8 m) · opening 3.6 × 2.5 m · persistent: ≈ 2.6 s to build and light, then stands until dismissed (close 1.3 s)

## Read in one line
A seam of green races to the site, mossy stones break out of the floor and swing up into an arch course by course, the keystone seats with a thump, and a swirling green vortex floods the doorway and stays lit.

## Beats
| t (s) | Beat | On screen |
|-------|------|-----------|
| 0.00–0.38 | Anticipation + travel | `cast2`, flash 0.12 #9bff5a; the seam runs at 34 m/s from 0.9 m up. |
| 0.38–1.63 | Impact (construction) | `buildTime` 1.25 s from first stone to keystone. Stones (0.66 m, step 0.58 m, 2 courses 0.52 m apart, 0.85 m deep wall) start 1.4 m *below* the floor outside the footprint and fly 0.5 s each into their slot, bowing 0.9 m outward and tumbling 3.2 rad/s; both jambs climb together; each lands with 0.09 shake, the keystone with 0.5. Construction dust and debris. |
| 1.73–2.58 | Impact (open) | After `openDelay` 0.1 s the aperture floods the opening over `openTime` 0.85 s; flash 0.34. |
| 2.58 → | Linger (indefinite) | Wisps turn 0.22 turns/s about a focus at 0.62 × the springing line, sheared harder in the middle (`twist` 1.1); a white lip #f4ffd6 hugs the stone, a column of light up the middle, light streaming up the jambs, the centre clears to show through (`clear` 0.85). Motes 34/s rise 1.5 m/s; haze bleeds out; green light #7bff33 (11, r 15) flickers 0.12. |
| on dismiss | Exit | `closeTime` 1.3 s: the gate comes apart. |

## Layers
1. **Arch stones** — instanced rock geometry, rock #6f5b41 / dark #2f271c / moss #4d6b30 (`materials/RockMaterial.js`), shadows. Each stone stores only a signed 0..1 contour position, a course and dice.
2. **Portal surface** — one quad carrying the arch SDF in `PORTAL_FRAGMENT` (`abilities/PortalAbility.js`): core #f4ffd6, wisps #86e02a, fog #3b5138, rim #c9f757.
3. **Motes, mist, dust, debris** particles.
4. **Gate indicator** — `effects/GateIndicator.js` while aiming.
5. **Light.**

## Signature
**Built, not spawned** — masonry flying up out of the ground into an arch whose span is a live slider; the opening is an SDF, so it re-lays itself around a new span while standing.

## Palette
core #f4ffd6, tint #c9f757, body #86e02a, deep #3b5138

## Gameplay
Persistent structure (one at a time — `AbilityManager` dismisses the previous gate). No damage role in the sandbox. Cooldown 2.6 s.
