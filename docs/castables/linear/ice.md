# Frost Lance — `linear/ice`
Frost · line · range 2.5–15 m (capture: 11.3 m) · no zone · ≈ 6.1 s on screen (0.45 travel + 3.6 stand + 0.6 delay + 1.0 sink)

## Read in one line
A fracture front races away from the caster and a wedge of milky, faceted ice spikes tears out of the floor behind it — ankle-high at the hand, a 3–4.5 m wall of blades at the far end — then stands steaming glitter and sinks back.

## Beats
| t (s) | Beat | On screen (shape, size in m, colour, motion) |
|-------|------|----------------------------------------------|
| 0.00–0.45 | Anticipation + travel | No hand charge: the `cast3` throw and a continuous `rumble` 0.06 shake. The front leaves the caster at `speed` 26 m/s (eased in over 0.08 s). Behind it spikes erupt in order of their `along` fraction: band half-width 0.55 m at the hand → 2.5 m at the end (`widthCurve` 0.75), height 0.5 m → 3.1 m (`heightCurve` 1.7). Each spike punches up in `riseTime` 0.17 s with 26 % overshoot, damped over 0.55 s, with up to 0.09 s stagger. Rime patches (`FROST` decals, r ≈ 1.35 × local half-width) are laid 3.6 per metre of travel. |
| 0.45 | Impact | Every buried spike goes up, including the terminal cluster with `peak` ×1.45 height (≈ 4.5 m). FROST burst shell 1.1 → 3.6 m, a 5.5 m `SHOCKWAVE` ring (#5fd0ff/#f2feff), a broad rime patch (×2.2), 90 extra chips at 1.8 × shard speed, 90 mist puffs and 150 glitter motes thrown up, shake 0.7 for 0.9 s, screen flash 0.12 #f2feff, light boosted to 1.6 × 9. |
| 0.45–4.05 | Linger | The field stands for `lifetime` 3.6 s. Crystals glint (`glint` scrolling in world space), birth glow fades over 0.45 s, a glitter plume keeps lifting off the line (35 % of `sparkleRate`), mist rolls off the bases (`mistRise` 0.35 m/s). |
| 4.05–4.65 | Exit (hold) | `shatterDelay` 0.6 s — still standing, glitter stops once retract > 0.6. |
| 4.65–5.65 | Exit | Spikes withdraw into the floor over `sinkTime` 1.0 s; rime decals live on to 7 s. |

## Layers
1. **Crystal field** — 3 `InstancedMesh` variants (≤ 288 spikes, 190 default) of `createCrystalGeometry` (7-sided prism, taper 0.69, bend 0.66, roughness 0.09; radius 0.41 m ± 93 %), `materials/IceMaterial.js` (patched `MeshStandardMaterial`, flatShading, DoubleSide, depthWrite, `LAYER.WORLD`, casts shadow). Ramp: core #638797 → rim #f2feff → ice #8adaff → deep #3e737a. `abilities/IceAbility.js`.
2. **Rime on the floor** — `DecalType.FROST` decals laid along the path and under the cluster, #f0f9ff lit / #79b6dd shadow, 7 s life. `effects/GroundDecals.js`.
3. **Mist** — `SMOKE` particles 260/s, size 1.15, opacity 0.05, gradient #f2feff → #cdefff → #a9e4ff → #09304c.
4. **Chips** — `CHIP` particles 150/s, 0.075 m, gravity −14, gradient ending #12496f.
5. **Glitter plume** — `SOFT` particles 130/s, 0.055 m, rise 1.6 m/s, ending #041e32.
6. **Impact** — `BurstMode.FROST` shell (`effects/BurstSphere.js`, A #a9e4ff, B #cdefff, C #f2feff), `SHOCKWAVE` decal, camera shake, screen flash, pooled point light #7fd4ff (9, r 13).

## Signature
A **wedge that grows downrange**: every dimension of a spike is a function of its unitless `along` fraction, so the line reads as a wave of ice that gets taller and wider the further it goes, ending in a swollen cluster.

## Palette
core #638797 (trapped light) / #f2feff (rim), tint #8adaff, body #8adaff→#5fd0ff, deep #3e737a / #09304c

## What the capture shows (8 m camera behind the caster)
- **f8 (0.27 s)** — the front is mid-line: a knee-high band of chunky pale-cyan prisms around and just past the caster, chips flying sideways; already reads as ice from one frame.
- **f20 (0.67 s)** — the full wedge stands: short rubble at the feet, a forest of 3–4.5 m blades over the dummies, a white frost-burst dome (the FROST shell) behind the cluster, white rime sheet on the floor, dummies tagged `chilled`.
- **f40 / f70 (1.3 / 2.3 s)** — the burst is gone; the blades stand unchanged (static after impact — this cast's linger is glitter and mist, not motion), rime sheet sharp-edged and white, fracture veining visible inside each prism.

## Gameplay
Line cast; `DummyField` derives hits from the published line. Cooldown 0.4 s. In the sandbox the dummies hit take the `chilled` status (shown as a tag over them).
