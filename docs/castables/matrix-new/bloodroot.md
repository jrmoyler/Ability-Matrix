# Bloodroot Thorns — `matrix-new/bloodroot`
Blood · zone · range 16 m · zone radius 6 m · runner 17 m/s · thicket stands 3 s · withers 1.5 s · total about 5.3 s at 11 m

## Read in one line
A root splits the floor at your feet and crawls to the circle, throwing up a hedge of thorns behind it. Where it surfaces, roots race out and a dark glossy thicket bursts up across a blood-soaked floor. The thicket throbs and writhes as it drains everyone inside, and the blood beats back along the roots to you.

## Beats
| t (s) | Beat | On screen |
| 0.00–0.1 | Anticipation | A CRACK decal (1.1 m) at the caster's feet, with a spray of blood and soil thrown forward. |
| 0.0–0.65 | Travel | The runner, a real root (0.25 m radius, pinned to land exactly on the circle), crawls toward the target with a white-hot tip and soil and blood spray. Its veins beat forward. A 0.9 m crack opens every 1.4 m, and 22 wake thorns (1.5 m tall, 0.7 m off the line) burst up 0.05 s behind the tip. The light rides 0.9 m above the tip. |
| 0.65 | Impact | The seed surfaces: a 6.6 m crack, a WATER burst, flash and shake. |
| 0.65–1.3 | Bloom | 9 roots plus 18 branches race out to 6 m. 110 thorns (1.9 m at the heart) burst up in a wave chasing the fronts, with a knock, a 7.8 m shockwave and flare. The soaked floor spreads behind the fronts. |
| 1.3–3.65 | Linger | After 0.9 s the beats turn inward (the drain), back to the heart and along the runner to the caster. Each vine swells as a beat passes (`thornThrob`), and the thicket writhes (`thornSway`). Bodies are stained and motes arc into the heart. Each body folds after 1.3 s and its husk is eaten. |
| 3.65–5.15 | Exit | The vines shrivel, go matte and sink. The roots darken and sink. The soak dries brown-black and a SCORCH stain is left behind. |

## Layers
1. Roots and runner: one merged tube mesh, with 31 paths evaluated in the vertex shader from a uniform table (index 30 is the runner, pinned at both ends). Dark wet bark with crimson pulsing veins and a hot front. Files: `BloodrootThornsMaterials.js`, `BloodrootThornsGeometry.js`.
2. Thicket and wake: instanced authored thorn vines (3 silhouettes, 168 slots) on LAYER.WORLD that cast shadows. The ramp runs from dark bark at the base, through clot and glossy body, to a red rim, sap barbs and a white specular.
3. Soaked floor: a normal-blended disc in clotted black-red with capillaries that carry the same heartbeat and a wet sheen. It stays through the linger.
4. Particles: drops (DROPLET), mist (SMOKE), motes (SOFT additive) and soil (CHIP, lit).
5. Decals and bursts: launch crack, cracks along the path, impact crack, thicket shockwave, end SCORCH stain, WATER burst.

## Signature
The circulation. Blood is pumped out along the runner to grow the thicket, then the beat turns and the thicket drinks the bodies back along the same roots to the caster.

## Palette
core #ffd6dc, tint #e8243f / #ff5a6e, body #4a0610, deep #1c0206 / #160206 (bark #1a0b08)

## Gameplay
This part is unchanged (handlesOwnHits). Bodies within 0.9 × zone radius are held from 0.68 s after surfacing. They are stained, fall after `drainTime` 1.3 s (`kill` toward the heart, low impulse), and their husks are consumed. The only timing change is runner speed: 12 → 17 m/s.
