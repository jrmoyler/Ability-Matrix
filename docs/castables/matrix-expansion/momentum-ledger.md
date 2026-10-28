# Momentum Ledger — `matrix-expansion/momentum-ledger`
Motion · zone · range 0.5–10 m (capture ≈ 7.2 m) · zone radius 4.5 m · ≈ 4.1 s on screen (0.45 s throw + 1.6 s bank + 1.3 s wind-down + 0.75 s exit)

## Read in one line
A cast-iron flywheel is thrown spinning onto an iron ledger plate and winds up faster and faster — every metre you walk lights another tooth — then dumps its momentum in a directional shockwave, hops forward and settles like a spun coin before sinking into the plate.

## Beats
| t (s) | Beat | On screen (shape, size in m, colour, motion) |
|---|---|---|
| 0.00–0.45 | Anticipation / travel | The flywheel leaves the hand at 1.1 m, 45 % size, spinning and wobbling, and arcs (1.3 m high) to the target at 16 m/s, shedding a thin stream of orange streaks. |
| ≈0.45 | Landing | It lands on its rim and swells to full size with an overshoot — a 2.7 m dark-iron wheel (toothed rim, six S-curved spokes, proud hub), its face turned 0.55 rad off the aim. Dust ring, knock, spark spray. The iron ledger plate (9 m) opens under it: hammered deep-red iron engraved with ledger columns and a tick ring; the additive dial, counter wheels and 32 velocity glyphs ease in; four coils tether the axle to the floor. |
| 0.45–2.05 | Linger I — the bank | The wheel **winds up**: idle wind builds late through the bank (to 55 % with nothing walked), banked distance pushes it to full. Its spin rises 2.2 → 18 rad/s; the spin halo smears its teeth into a ring and pulls rotational streaks off the rim; sparks fly tangentially off the top of the rim; the iron glows from within; the plate's radial grooves turn with it and a dashed wind ring brightens. Honest readouts: teeth light white-hot one by one with the banked fraction, the plate's bank sector fills, the dial tally and gauge glyphs fill, the coils compress. Your walked path is drawn back as a chevron wake. Pinch lens. |
| ≈2.05 | Impact — the release | Every enemy in 4.5 m is struck (`baseImpulse + bonusImpulse × bank`). The wheel flashes, **hops** 0.6–1.8 m along the banked direction; a directional fan wave and release rings run out; AIR shell, SHOCKWAVE + DUSTRING, flash, knock and light punch scaled by the bank; the coils spring open. A burnt wedge is thrown across the plate along the banked direction, lined with ember skid lines. |
| 2.05–3.35 | Linger II — wind-down | The spin bleeds out exponentially; the wheel **tips over like Euler's disk**, its wobble precessing faster as it flattens (to 1.42 rad); the wedge's embers cool through the ramp; glyphs slow. |
| 3.35–4.1 | Exit | The wheel sinks into the plate (0.9 × radius); plate and dial dissolve through noise with a hot edge; decals outlast. |

## Layers
1. Flywheel (hero) — `createFlywheelGeometry` (swept sections: toothed rim, hub, spokes, `aTooth`), `createFlywheelMaterial` (MeshStandard lit iron on WORLD, shadows, patched tooth/heat emissive). Radius `flywheelSize × zoneRadius` = 1.35 m.
2. Spin halo — `createSpinHaloMaterial` additive disc in the wheel plane: teeth smear, rotational streak arcs, spoke ghosts.
3. Ledger plate (floor) — `createLedgerPlateMaterial` normal-blended iron, engraving, turning grooves, bank sector, wind ring, release wedge with cooling embers, dissolve.
4. Dial — `createDialMaterial` additive rim, flow lines, 24-cell tally, release shock.
5. Counter wheels (lit metal + one lit glow), coils (tethers), velocity glyphs + gauge.
6. Wake — line + chevron ribbon of the walked path.
7. Particles — shared expansion STREAK system (throw stream, landing spray, rim sparks, footsteps, release); GPU speed motes.
8. Release — fan, release rings, AIR shell, SHOCKWAVE, DUSTRING, flash, knock, light.
9. Lens — `LAYER.DISTORTION` pinch while winding, pressure ring at the release.

## Signature
The flywheel is the bank: it visibly stores the motion as spin, counts it on its teeth, and pays it out — then settles like a coin spun on a table.

## Palette
core #fff1d3, tint #ffb088, body #d6503a, deep #2a0f14 (iron #3a2a28)

## Gameplay
Unchanged rules, through `handlesOwnHits` (expansion combat binding or DummyField): distance actually walked during `chargeDuration` after landing is banked (cap `maxDistance`; steps faster than `maxSpeed` are rejected and cut the wake); one release on every enemy inside `zoneRadius` with knockback `baseImpulse + bonusImpulse × banked fraction`. The idle wind is presentation only and never changes force. Defaults changed: `chargeDuration` 2.2 → 1.6 s, `speed` 50 → 16 m/s (visible throw).
