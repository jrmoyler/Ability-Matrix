# Borrowed Tomorrow — `matrix-expansion/borrowed-tomorrow`
Time · zone · range 20 (capture 14.3 m) · zone radius 3.6 · ~2.7 s on screen

## Read in one line
A brass pocket clock is thrown spinning to the target, stands up over a clock face 2.5 m in the air while its debt fills and its pendulum dies, then slams flat onto the floor on the hour and the strike lands.

## Beats
| t (s) | Beat | On screen |
|-------|------|-----------|
| 0.00–0.48 | Anticipation + travel | The clock, 0.3× size, spins (9 rad/s) along a 1.6 m arc from the hand to the target shedding brass chips. |
| 0.48–0.83 | Arrival | It unfolds (outBack) to ~3.6 m across, standing at 70° facing the caster, arbor 2.5 m up; the floor face, tomorrow's ring and sand appear. |
| 0.48–1.57 | Linger (the debt) | Enamel dial glows violet more and more, the debt arc fills round the floor face, the long hand sweeps one turn, gears turn faster, the 1.9 m pendulum swings below and settles to zero, tomorrow's ring descends, sand spirals in, lens twists. |
| 1.57–1.73 | Slam | The clock drops flat onto its face (`slamTime` 0.16 s). |
| 1.73 | Impact | The strike: light pillar, shock ring, AIR shell, SHOCKWAVE + RIPPLE decals, 64 chips, glass thrown, flash, knock; one hit on every enemy in 3.6 m. |
| 1.73–2.58 | Exit | Clock lies flat, gears still turning, face dissolves with noise, glass falls. |

## Layers
1. Floor face (`createClockFaceMaterial`) — ripples, hour rays, debt arc.
2. **Suspended clock** — lit brass bezels, chapter ring, indices, gear train, hands (`MeshStandardMaterial`) on a new turned enamel dial + case (`createDialGeometry`, dark violet `#1b1430`), tilted upright by `clockTilt`.
3. Pendulum — pierced rod + turned bob, hung plumb from the arbor behind the dial.
4. Tomorrow's ring, glass fragments (48), GPU sand, pillar, shock ring, lens on `LAYER.DISTORTION`.

## Signature
The clock falling flat on the hour is the strike.

## Palette
`#fff2cf` → brass `#d5a052` / `#edbd73` → violet `#a073bd` → deep `#1b1430` / `#302451`.

## Gameplay
Unchanged: exactly one strike `delay` (1.25 s) after arrival over `zoneRadius`, through the expansion combat binding or the dummy field.
