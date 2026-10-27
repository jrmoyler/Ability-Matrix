# Skyhook Draft — `matrix-expansion/skyhook-draft`
Wind · line · range 3–16 m · lane width 2.6 m (no zone radius) · ≈ 3.6 s on screen (10 m cast, defaults)

## Read in one line
Air coils at the hand into a little hook of wind that is thrown down the line on
the front of a braided draft; at the end it erupts out of the floor as a 3 m
shepherd's crook of storm air, and the draft conveys everything it knocked down
along the lane, up the stem and onto the barb, then the hook climbs into the sky
and unravels.

## Beats
| t (s) | Beat | On screen (shape, size in m, colour, motion) |
|---|---|---|
| 0.00–0.32 | Anticipation | A seed crook (0.16 × full size, ≈ 0.55 m) draws itself from foot to barb at hand height (1.25 m) 0.6 m in front of the caster, spinning (7 rad/s); white-to-sky streaks are sucked in round it from 1.3 m; the light gathers at the hand. |
| 0.32–0.74 | Travel | The seed rides the draft front down the line at 24 m/s, sinking from hand height to 0.15 m and swelling 1.6×. Behind it nine streamline ribbons (0.2 m wide, 0.35–0.9 m up, waving) are laid along the lane with a white-hot leading edge; the floor is combed into a dark navy groove; dust kicks up at the front; the lens shimmers downstream. |
| 0.74 | Impact | The seed dives in and the **Skyhook erupts** (outCubic over 0.28 s, foot first): a bowed 3 m stem flaring 1.1 m into the floor, a half-circle curl (radius 0.36 × lane = 0.94 m) turned 0.8 rad off the lane so it reads as a crook, and a 0.7 m dropped barb. AIR shell, DUSTRING (2.6 m) + SHOCKWAVE decals, 16 lit rock plates heaved up and tilted outward, 30 grit chips thrown, flash, camera knock 0.3, light punch 7. Every enemy standing in the lane is knocked off its feet **downstream**. |
| 0.74–3.12 | Linger — the draft navigates | The braid converges and winds 1¼ turns up the stem; dashes flow downstream at 6 m/s; streamlines spiral up the tube; the storm-dust sheath churns; the floor vortex turns at the foot (3 arms) while streaks and faint chevrons crawl toward it. Downed bodies in the lane are drawn onto the centreline, conveyed at 4.2 m/s, held 1.2 m up, and within 1.6 m of the stem hoisted onto the barb. The whole hook **climbs 0.6 m into the sky** (inOutCubic) and its curl swings ±0.35 rad with its catch; plates orbit the stem (0.9 rad/s) and climb 1.6 m, tumbling; grit and streaks are drawn up the stem. |
| 3.12–3.87 | Exit | The hook unravels from the foot up along a white burning edge (inQuad), lets go of what it holds a third of the way in (bodies fall from ~3 m), keeps rising; plates drop back and sink through the floor; the braid and the scour dissolve through noise; the decals outlast it. |

## Layers
1. The skyhook — `createHookGeometry` (180 × 22 parameter-space tube) placed in the vertex shader along the crook path (`HOOK_PATH`, mirrored by `hookPoint`), two materials: `createHookCoreMaterial` (additive: helical streamlines, fbm, fresnel rim, growth head, unravel burn) and `createHookSheathMaterial` (normal-blended storm dust, lit by the sun from navy to sky blue — the mass). 3 m tall, foot 1.1 m flare, tube 0.5 m. `geometry.js`, `materials.js`.
2. The draft — `createBraidGeometry` (12 × 150-segment ribbons) placed in `createBraidMaterial`'s vertex stage along the lane, converging and climbing the stem; dash flow, white-hot head, noise dissolve.
3. The scour — `createLaneQuad` + `createScourMaterial`: normal-blended dark groove the lane's width, combed streaks, chevrons, and a spiral vortex torn at the foot; noise dissolve on exit.
4. Torn plates — 18 instanced bevelled slabs (`createPlateGeometry`), `MeshStandardMaterial` flat-shaded rock #4b5866, `LAYER.WORLD`, cast/receive shadows, 0.6–1.1 m.
5. Particles — SMOKE dust (lane, front, eruption), STREAK air (gather, lane, up the stem), lit CHIP grit (eruption, drawn up).
6. The eruption — AIR burst, DUSTRING + SHOCKWAVE decals, flash, shake, light punch.
7. The lens — `createLensMaterial` on `LAYER.DISTORTION`: downstream shimmer over the lane, pressure ring at the foot.
8. The light — #bfe3ff, follows the front, punched at the eruption.

## Signature
A current with a destination: the draft carries what it knocks down along the lane to a crook of wind that hoists it into the sky. The crook's curl is derived from the lane width and stands at the end of the line, so the barb always hangs over the lane however the sliders move.

## Palette
core #ffffff, tint #cfeaff, body #4f9ae6, deep #13233f (rock #4b5866, dust #d9e6f2 → #1c2636)

## Gameplay
- Lane: a capsule `laneWidth` (2.6 m) wide from the caster to the hook's foot (the end of the line).
- At the eruption every enemy in the lane is caught — at most `maxCaught` (8), nearest the hook first — and struck exactly once: through the combat binding one attributed `hit` (wind, damage 1, `impactForce` from `hitImpulse/hitLift/hitSpin`) plus, when combat is live, a `buffeted` status for the draft's duration; with no binding, `dummy.kill` downstream along the lane.
- For the linger only, the draft carries every downed body in the lane (the ones it struck and any corpses already lying there), bounded by the same cap, with `Dummy.carry`: downstream at `draftSpeed`, onto the centreline (`draftConverge`), held `draftRise` up with `draftBuoyancy`; once within `catchRadius` of the stem it is sprung (`hoistPull`, ≤ `hoistSpeed`) to the hanging point under the barb, computed from the same path the shader draws. Everything carried is released a third of the way into the exit.
- Interpretation of "navigable draft": the sandbox has no allied movement or projectile steering, so the draft is a bounded, deterministic conveyor current for downed bodies with a fixed heading (the cast line) and destination (the hook). Hit timing does not depend on reduced motion, which only stills the seed spin, curl swing, plate orbit and lens. `handlesOwnHits` is true.
