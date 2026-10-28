# Trajectory Hijack — `matrix-expansion/trajectory-hijack`
Motion · zone · range 2–16 m (capture: 11.8 m) · zone radius 4.2 m · ≈ 3.4 s on screen (0.28 charge + 0.4 travel + 2.05 hijack + 0.7 exit)

## Read in one line
Seven steel darts fan out over the caster's hand and fly straight down the aim line. At the target, a ring of bronze stator vanes has heaved out of the floor and snaps to swirl pitch. The ring seizes the volley, swings every dart round a compass-needle hub in a climbing helix of white-hot ribbons, and flings each one off on a new heading. Each dart hooks onto its own body, and the body flies sideways along that heading.

## Beats
| t (s) | Beat | On screen (shape, size in m, colour, motion) |
|-------|------|----------------------------------------------|
| 0.00–0.28 | Anticipation | 7 darts (1.25 m, lit steel, ember-hot #ff6a2c) stand nose-up on a 0.75 m arc over the hand, spinning at 14 rad/s while sparks are drawn in. At the target the deflection field powers up: a dark #2a0c05 disc of radial stream lines with a ticked rim. Nine vanes (2.7 m tall, 1.25 m chord) heave out of the floor 3.8 m from the centre. The vanes nearest the caster rise first, the rise runs round the ring over 0.3 s, and each vane springs past full height (overshoot 1.6). Dust rolls off their feet. |
| 0.28–0.67 | Travel | The darts leave 0.11 s apart at 30 m/s along the aim line. Each drags a 0.3 m camera-facing ribbon of its last 0.42 s of flight, fading from #fff2e4 through #ffc39a and #ff6a2c to #2a0c05. The compass needle spins, searching. |
| 0.67 | Impact (the seize) | The lead dart reaches the orbit tangentially. In 0.16 s the vanes snap from radial to 1.05 rad of swirl pitch (outBack), and their leading edges flash. The field's stream lines wind into a log spiral. Then come an AIR pressure shell to 1.05 R, a SHOCKWAVE decal at 1.25 R, a DUSTRING, a shock ring in the field and the lens, 60 sparks, a 0.45 shake, a 0.16 #ffc39a flash and a 6× light punch. Every body inside R is assigned a dart, nearest first. |
| 0.67–2.73 | Linger (the hijack) | Each dart in turn is braked to 13 m/s on a climbing helix (seat 0.55 R ±22 %, height 1.15 m ±0.45, climbing 0.45 m per turn). Together the ribbons draw a turning gyre round the hub. The needle (1.8 m, glowing north tip) swings to point at the next dart's target before the dart goes, and the gimbal ring turns. After at least 0.4 turn, a dart leaves on the tangent that points at its body, at 30 m/s. A quadratic hook bends it onto the torso (1.05 m up). Each release throws 18 tangent sparks, and the vane it passes flicks and rings (0.45 rad, 22 rad/s, decay 7). Each hit throws 26 sparks and 14 steel chips, lays a 0.9 m scorch (3.2 s) and a small shockwave, gives a 0.12 knock and a light punch, and the body is thrown along the dart's final heading. The whole ring turns at 0.35 rad/s. Releases roll from 1.7 to 2.3 s, so the silhouette changes on every frame. The vane edges' chevrons climb faster while darts are held (the shared `grip` envelope). |
| 2.73–3.43 | Exit | The vanes feather back to radial and sink into the floor (dust rises again), the needle droops and drops, and the field burns away through a noise dissolve with an orange edge. The scorch marks stay. |

## Layers
1. **Stator vanes (hero)**: `createVaneGeometry` in `geometry.js`, a cambered NACA airfoil lofted with taper, twist, swept leading edge and a rounded tip. 9 instances of lit bronze-gunmetal `MeshStandardMaterial` on the world layer, casting shadows.
2. **Vane edges**: `createVaneEdgeMaterial` in `materials.js`, drawn over the same instanced airfoil. A hot leading edge, chevrons climbing it and a per-vane `aKick` flare.
3. **Darts**: a turned bolt (`createDartGeometry`: fletch collar, waisted shaft, barbed head), instanced lit steel with ember emissive.
4. **Ribbons**: `createTrailMaterial` on a dynamic strip per dart. Each strip is the closed-form path sampled back in time, expanded to face the camera in the vertex shader and coloured with the four-stop ramp.
5. **Hub**: a turned compass needle (`createNeedleGeometry`), a glowing north tip (`createGlowMaterial`, fresnel) and a turned gimbal ring.
6. **Deflection field**: `createFieldMaterial`, normal-blended so the dark deep tone darkens the floor. Spiral stream lines whose twist equals the vane pitch, the orbit band and track, rim ticks, lit vane sockets, the seize shock and a dissolve.
7. **Particles**: STREAK sparks (charge, seize, capture, release, hit), CHIP steel at each hit, SMOKE dust off the vanes as they rise and sink.
8. **Bursts and decals**: AIR shell, SHOCKWAVE and DUSTRING at the seize, SCORCH and SHOCKWAVE under every hit.
9. **Lens**: `createLensMaterial` on `LAYER.DISTORTION`. It drags the air tangentially round the orbit band while darts are held and adds a pressure ring at the seize.
10. **World**: #ff9a62 light at 1.2 m over the ring, punches at the seize and at each hit, shakes and a flash.

## What the capture shows
`/tmp/claude-0/trajectory-hijack/cap3/matrix-expansion__trajectory-hijack-sheet.jpg` (frames 8/20/40/70/100).
- **Frame 8**: the dart fan glows over the hand. The vane crown is already up round a dark disc, with the dummies standing inside it.
- **Frames 18–20**: ribbons run from the hand to the ring, and the vanes stand round the spiral field.
- **Frame 40**: the gyre. Ribbons circle the hub inside the bronze vanes, the gimbal ring and needle stand in the middle, and the field is a glowing spiral.
- **Frame 70**: hooked darts have knocked bodies sideways and toward the camera, out of the ring along their new headings. One ribbon still bends out, and the stream lines flow.
- **Frame 100**: the exit begins with the vanes feathering. Scorches glow under the hit spots, and the bodies lie outside the ring.

## Signature
**The heading changes hands.** Darts arrive straight down your aim line and leave on the tangent of a seized orbit, so every body is struck from a direction the caster never aimed. The needle shows where each dart will go before it leaves.

## Interpretation
The sandbox has no enemy projectiles, apart from the CPU Arch-Wizard's, which this cast deliberately does not depend on. So the cast hijacks its own launched projectiles: the volley is fired straight, then its heading is redirected by the stator.

## Palette
core #fff2e4, tint #ffc39a, body #ff6a2c, deep #2a0c05 (metal #5c524c, steel #5a5450)

## Gameplay
`handlesOwnHits`. At the seize, up to `dartCount` (7, maximum 12) living bodies inside `lockReach × zoneRadius` are each assigned one dart, nearest first. Each dart circles at least `minTurn` and hits its body once, when its hook arrives. Knockback (`hitImpulse` 15, `hitLift` 6, `hitSpin` 3, × explosion intensity) points along the dart's final heading. Hits go through the expansion combat binding (element `motion`, tag `trajectory-hijack`) when present, otherwise through `dummy.kill`. Darts without a target fly off on their tangent and never hit. Hits ≤ min(darts, bodies). Cooldown 4 s.
