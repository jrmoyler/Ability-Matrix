# Vein Lattice — `codex/veinlattice`
Blood · zone · range 18 m · zone radius 4.6 m · ~4.2 s on screen

## Read in one line
A living vein burrows from the caster's feet to the circle, then a 4.2 m dome of dark, wet, knotted veins climbs out of a capillary bruise and beats — constricting, swelling and glaring blood-red on every lub-dub — before it drains grey and withers.

## Beats
| t (s) | Beat | On screen (shape, size in m, colour, motion) |
|---|---|---|
| 0.00–0.25 | Anticipation | red glow at the hand (cast3); the feeder vein starts at the caster's feet |
| 0.25–0.60 | Travel | feeder vein (0.11 m tube, half-sunk, meandering 0.3 m) burrows down the line at 22 m/s, pulses racing toward the circle |
| ~0.60 | Impact | jolt, CRACK decal 3.2 m, burst of droplets; the bruise + capillary web spreads to 6 m over 0.35 s |
| 0.65–1.45 | Linger (grow) | 11 trunks climb out of the rim, fork 4 times into a diamond net, curl in at 4.2 m; tubes inflate behind a growth front |
| 1.45–2.95 | Linger (beat) | 1.5 beats/s lub-dub: the net constricts 16 % toward the centre and the tubes swell 55 %, the ramp swings deep maroon → blood red with hot pulse crests, the floor web flashes, a ring runs out, droplets burst off the knots, shake + light punch; first beat adds a SHOCKWAVE and a red flash |
| 2.95–4.2 | Exit | glow dies, veins wither from the tendrils to the roots (grey, thinning), the bruise fades |

## Layers
1. Lattice — tube net in cylinder parameter space (`VeinLatticeGeometry`, 8-sided tubes) inflated in the vertex stage; `createVeinNetMaterial`: four-stop ramp driven by a half-lambert sun term, world-noise bump, wet specular, red fresnel rim, travelling pulses; `LAYER.SHAPED`, opaque.
2. Feeder — same tissue shader laid down the cast line (`createVeinFeederMaterial`).
3. Floor — bruise + two-scale warped capillary web with beat rings (`createVeinFloorMaterial`), 1.35 × radius.
4. Droplets (DROPLET, 0.14 m, burst per knot per beat + drips), mist (SMOKE), motes (SOFT additive, rising off the veins).
5. Throb — open cylinder on `LAYER.DISTORTION` that bends the air on each beat.
6. Arrival/beat — CRACK decal, SHOCKWAVE + flash on the first beat, shake and light punch every beat; red point light that throbs.

## Signature
The heartbeat: a whole cage of veins that constricts and swells in a lub-dub, with blood visibly surging up it.

## Palette
hot #ffc4cc, tint (blood) #e8213c, body #3e0612, deep #2a040c / #0c0104

## Gameplay
Engine hits: everything inside the circle falls on arrival (bleeding status). Unchanged by the upgrade.
