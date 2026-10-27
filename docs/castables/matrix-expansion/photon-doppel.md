# Photon Doppel — `matrix-expansion/photon-doppel`
Light · zone · range 2–18 m · zone radius 3.2 m (lure 5.2 m) · ≈3.7 s at a 10 m cast

## Read in one line
A spark winds up at your hand and flies to the circle, where it stands up as a
hooded figure of light with its arms open; for a second and a half it drinks
the light around it (its core goes dark, ribbons, rays and tethers stream into
its heart, the scene dims), then it whites out and bursts, striking everything
in the circle and leaving a sun-print burned into the floor.

## Beats
| t (s) | Beat | On screen (shape, size in m, colour, motion) |
|---|---|---|
| 0.00–0.22 | Anticipation | Photon packet (turned spindle, 0.17→0.55 m) grows at the hand at 1.15 m inside a 1.2 m starburst flare (white core, pale-gold anamorphic streak). At the target the 3.2 m strike circle and the dashed 5.2 m lure ring draw themselves in (pale gold). |
| 0.22–0.62 | Travel | The packet flies the line at 26 m/s, stretching up to ×2.2 along its axis, banded light sliding to its nose, a 0.8 m flare riding on it and a stream of STREAK sparks (white → gold) shed behind. |
| 0.62 | Impact (formation) | The packet stands up as the figure: a hooded robed body 3.0 m tall (0.95 × zoneRadius) rising out of the floor with an overshoot over 0.3 s, arms open. 1.8 m starburst at the heart, tint flash, small knock, a 1.9 m SHOCKWAVE, CHIP glints, light punch. |
| 0.62–1.97 | Linger (drinking) | The figure breathes (faster as it fills), leans, turns ±25° to and fro, lifts its arms by up to 0.75 rad; bands of light run inward through it while a dark umbra (#24150a) spreads from the heart and the rim stays white-hot and prismatic. A halo of 12 lit crystal shards turns behind the hood. Ten ribbons spiral in from the lure ring (dashes running inward); a tether arcs from every exposed enemy (≤ 8) into the heart; 26 rays on the floor run toward its feet while a ragged umbra eats the floor under it (0.9→2.1 m); SOFT motes stream from the lure ring into the heart; the screen is pulled inward (warp); the cast's light sinks by up to 65 %. |
| 1.97 | Impact (overexposure) | The figure whites out and swells (0.18 s); 3.4 m starburst + anamorphic streak; white front runs out over the floor to 3.5 m; AIR shell to 3.5 m; SHOCKWAVE (3.7 m) and SCORCH (3.0 m, gold → deep); 90 sparks + 44 glints; all 36 shards thrown out of the body on ballistic arcs; heavy knock, white flash, light punch ×14; struck dummies fly outward. |
| 1.97–3.02 | Linger (aftermath) | The figure burns away from the hem upward with a white-hot edge (0.55 s); shards tumble, land and lie cooling (emissive falls 85 %); the sun-print — a bleached disc with radial streaks and a hot rim — cools from the rim inward to the centre over 1.4 s; pressure ring rolls out. |
| 3.02–3.72 | Exit | Shards sink and shrink into the print; the print dissolves through noise with a gold burn edge; scorch decal fades after. |

## Layers
1. Figure — lofted hooded/robed body (18 profile rings × 56 segments, drapery folds) + two swept tapered arm tubes, `geometry.js#createFigureGeometry`; `createFigureMaterial` (vertex: arm lift round the shoulder, breath, hem ripple, sway, overexposure swell; fragment: inward bands, umbra, prismatic fresnel rim, white-out, upward burn dissolve), normal-blended so the dark core occludes; 3.0 m × ~1.0 m span; full ramp.
2. Halo and shards — 36 instanced faceted crystal spindles (`createShardGeometry`), `MeshStandardMaterial` lit, shadow-casting on the world layer; 0.2–0.4 m; tint body, gold emissive cooling.
3. Streamers — 10 spiral ribbons (`createStreamerGeometry`), additive `createStreamerMaterial`, scaled to (lureRadius, figure height); 0.12 m tall; core → body.
4. Tethers — up to 8 arcs from exposed enemies to the heart, bent in the vertex shader (`createTetherMaterial`); 0.16 m wide; core → body.
5. Floor — `createFieldMaterial` on a 10.6 m disc: strike circle, dashed lure ring, inward-running ray comb, umbra, white front, cooling sun-print, dissolve; normal-blended (it darkens the floor).
6. Packet — turned spindle (`createPacketGeometry`), additive `createPacketMaterial`; 0.55 m.
7. Flare — camera-facing starburst + anamorphic streak + chromatic ghost ring (`createFlareMaterial`); 1.2–3.4 m.
8. Particles — `photonDoppel.motes` (SOFT, swirl, inward), `photonDoppel.sparks` (STREAK, trail and burst), `photonDoppel.glints` (CHIP); AIR burst; SHOCKWAVE ×2 and SCORCH decals.
9. Warp — `LAYER.DISTORTION` disc (`createWarpMaterial`): inward pull while drinking, pressure ring at the overexposure.
10. Light — dims with charge while drinking, punches at formation and overexposure.

## Signature
A decoy that *takes light away*: the only light cast whose hero goes dark from
the inside, dims the scene and pulls ribbons, rays and tethers into itself —
and the more it drank, the harder its overexposure lands.

## Palette
core #ffffff, tint #fff0c8, body #ffb93f, deep #24150a

## Gameplay
- Zone cast, `handlesOwnHits`. The decoy forms at the target and drinks for
  `absorbTime` (1.35 s × global lifetime).
- **Exposure:** every `markInterval` it exposes new enemies inside
  `lureRadius` (5.2 m), up to `maxMarks` (6, hard cap 8), in deterministic
  order (UCSM actors sorted by id; dummies nearest first). Each exposure draws
  a tether and, under the combat binding, emits a `light` `status` on that
  enemy for `statusSeconds` (refused harmlessly in standalone mode).
- **Soaking:** under the binding it subscribes to committed `hit` events; any
  other cast's hit whose position lies inside `zoneRadius` while it drinks is
  soaked up (≤ `maxSoaked`, cap 8). Unsubscribed at overexposure and on
  destroy/dispose.
- **Charge** = exposures × 0.25 + soaked × 0.2, capped at 1.
- **Overexposure:** one hit on every enemy inside `zoneRadius` (≤ 8), element
  `light`, damage `baseDamage + round(charge × bonusDamage)` (1–3),
  impulse/lift × (1 + charge × `chargeForce`) clamped to the bridge bounds
  (24/20) and × explosion intensity. Enemies exposed in the lure but outside
  the circle are not struck. Routed through `bindExpansionCombat`, or
  `dummy.kill` directly without a binding.
- **Corpses** (downed dummies) inside the lure are drawn toward the decoy with
  `Dummy#carry` while it drinks, then released and thrown outward
  (`bodyThrow`) at the overexposure.
- Interpretation: the sandbox has no enemy AI to fool, so "decoy" is played as
  *absorption* — the figure drinks the light of whatever it exposes and of
  any hit landing in its circle, and pays it back as one strike. It does not
  depend on the CPU wizard, projectiles or allies.
