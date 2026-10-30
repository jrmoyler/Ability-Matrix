# Emberveil Lattice — `matrix-new/emberveil`
Fire · zone · range 0–16 m · zone radius 5.5 m (cage 5.06 m, 3.6 m tall) · ≈ 7 s on screen (≈0.8 travel at 14 m/s + 0.9 weave + 3.2 burn + 0.75 contraction + 1.4 fade)

## Read in one line
A flare catches at the hand and a ball of wound burning thread is lobbed at the circle, spooling a molten thread behind it while the target ring starts to smoulder; it bursts, charred cords split by molten cracks climb out of glowing anchor pools into a woven dome over the bodies, a hot side chases round the burning cage as it breathes and creeps in, then it pulls tight, burns white, and collapses in one flame burst that throws the trapped clear.

## Beats
| t (s) | Beat | On screen (shape, size in m, colour, motion) |
|---|---|---|
| 0.00–0.16 | Anticipation | FIRE flare 0.8 m at the hand (1.2 m up); the ember ball winds up there with an outBack over 0.16 s: 10 charred cords per hemisphere (two mirrored lattice domes, r 0.55 m) split by orange cracks, tumbling 7 rad/s. |
| 0.00–≈0.8 | Travel | The ball flies a 1.4 m lob at 14 m/s; behind it a 6 cm burning thread lies exactly on the flown path — molten #ffa040/#fff0c4 at the ball, cooling to char #170a07 with dark red cracks at the hand. Streak sparks, falling embers and dark smoke shed off the ball. From 35 % of the throw the target circle is telegraphed: ember seam and 16 anchor pools on the 5.06 m ring catch (≤ 55 %). |
| ≈0.8 | Impact | Ball bursts: FIRE puff 1.4 m, shockwave at the cage radius, small shake, light punch. The thread burns back from the hand to the circle over 0.45 s with a hot front. |
| 0.8–1.7 | Weave | 16 strands (two families sweeping ±2.1 rad, 7 over/under crossings) climb from the pools to the crown, hot tips leading; flames lick off them; char band spreads on the floor. Bodies inside are held and stained. |
| 1.7–4.9 | Linger (burn) | Closed dome: charred cords lit by the sun with molten cracks that widen as it burns; a hot side (burn wave) chases round the cage at 2.2 rad/s (cracks open, tongues leap there); the cage breathes ±6 % in height, turns 0.22 rad/s and visibly creeps in 8 %; flames climb 60 % higher; smoke column off the crown; char creeps inward on the floor; heat haze. |
| 4.9–5.7 | Contraction | Cage pulls in to 12 % radius, slumps to 35 % height, spins ×6, cracks open toward white (surge 0.7), rumble. |
| ≈5.7 | Collapse | FIRE shell 3.4 m (#fff2c0 → #ff7a22 → #4a120a), shock ring 7.5 m, scorch 3.2 m, 160 streak sparks, flash, shake 0.55, light +30; every held body (and anything still inside) killed and thrown outward. |
| 5.7–7.1 | Exit | Burnt strands slump and break apart on burning dissolve edges in ≈0.6 s; floor ring cools over 1.4 s; scorch stays 5 s. |

## Layers
1. Strands — `createLatticeGeometry` parameter buffer, `createEmberStrandMaterial('core')`: solid normal-blended sun-lit charred cord + molten cracks (4-stop ramp), burn wave, `materials/matrix-new/EmberveilLatticeMaterials.js`.
2. Flames — same buffer, `createEmberStrandMaterial('flame')`: additive torn tongues, climb with the burn and the burn wave.
3. Ember ball — 2 × (core + flame) on the same buffer, two mirrored domes (`squash = −1`), travel only.
4. Burning thread — `createThreadGeometry` + `createEmberThreadMaterial`, laid on the ember's lob in the vertex stage; burns back after the landing.
5. Scorched ring — `createEmberFloorMaterial`: char band (creeps over the burn), crawling seam, anchor pools, heat wash; telegraphed in travel.
6. Particles — SOFT drips, curl SOFT sparks, SMOKE column + trail, STREAK sparks.
7. Heat haze on `LAYER.DISTORTION`; collapse FIRE burst, SHOCKWAVE + SCORCH decals, flash, shake, light.

## Signature
The cage is built of the same thread the ember spools: a wound ball of burning cord is thrown, and the circle it marks grows a woven basket of charred, crack-lit cords that heats, breathes, and is pulled tight until it bursts.

## Palette
core #fff0c4, tint #ffa040, body #e0400c, deep #4a0c04 (cord #170a07, char floor #0c0806)

## Gameplay
`handlesOwnHits`, unchanged: from half-weave the cage holds bodies inside `cageRadius × zoneRadius × contraction × trapReach` (the visible creep/breath are presentation only, `_hitShrink`); at the collapse every held body and anything inside the full cage radius is killed and thrown outward (impulse 9, lift 5.5, spin 1.8). Speed, range and all timings unchanged.
