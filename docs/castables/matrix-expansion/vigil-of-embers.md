# Vigil of Embers — `matrix-expansion/vigil-of-embers`
Holy · zone · range 2–18 m · zone radius 4 m · ≈ 5.8 s on screen (≈0.75 carry at 18 m/s + 4 s vigil + 1 s sink)

## Read in one line
A gilded votive shrine is carried out at chest height while a processional runner of light is laid on the floor behind it; before it lands the sanctuary is already forming at the target — dark bronze ground, a sigil drawing round, a column of light, arch feet rising — and on arrival a ring of eight gilded stone arches, four gold bells over lamp flames and a crown stand over the bodies, ringing a curtain of light every 1.2 s while veins of light climb the arches and the runes light one by one.

## Beats
| t (s) | Beat | On screen (shape, size in m, colour, motion) |
|---|---|---|
| 0.00–0.15 | Anticipation | The votive (three gilded arches round a lamp flame, ×1.7 ≈ 1.8 m tall) swells from 40 % at the hand; the runner starts at the feet. |
| 0.00–≈0.75 | Travel | Votive carried at 0.8 m, turning 0.8 rad/s, embers trailing. Behind it a 1.6 m runner on the floor all the way back to the hand: dark bronze #3a2209 cloth, gilt borders, marching rune dashes, white-gold centre line hottest at the votive. From 35 % of the carry the sanctuary forms at the target: bronze ground and sigil sweep round (≤ 50 %), the column of light descends, the eight arch feet build (≤ 40 %). |
| ≈0.75 | Impact | Votive gone into the vault: the arches finish building from their half-built state with a burning edge, bells, lamps and crown appear, arrival light punch and knock; first pulse rings (curtain, glyph, footprint, AIR shell, shockwave). Runner taken up from the hand end over 0.6 s. |
| 0.75–4.75 | Linger | Arches (2.8 m, ring r 3.4 m): solid sun-lit gilded stone #c8913f falling to bronze #3a2209 in shade, gilt trim; veins of light kindle from the feet to the keystones over 2.6 s and the floor runes light one by one; bells (×1.5) sway and ring every pulse (r 1.5 m, 3.1 m up), lamp flames 1.2 m up flare, crown (r 1.6 m) turns 0.7 rad/s, sigil turns 0.2 rad/s; pulse curtains sweep the circle every 1.2 s. |
| 4.75–5.75 | Exit | Architecture sinks 1.5 m and shrinks while the stone and gold crumble on a bright edge; flames gutter; sigil and ground dissolve from the rim in. |

## Layers
1. Votive + runner — `vigilArchGeometry` ×3 on its own arch material, `vigilFlameGeometry`; runner quad + `createVigilRunnerMaterial`.
2. Arches — `vigilArchGeometry` ×8, `createVigilArchMaterial`: solid lit stone, build front, kindle veins, pulse ripple, crumble exit.
3. Bells + crown — lathe bell and tine crown, `createVigilGiltMaterial`: solid lit gold with specular, ring bands on each pulse.
4. Lamps — `createVigilFlameMaterial` (additive, swayed in the vertex stage).
5. Ground + sigil + column — `createVigilGroundMaterial` (dark bronze, normal blend), `createVigilFloorMaterial` (additive sigil, runes kindle), `createVigilShaftMaterial`.
6. Pulse — `VigilPulses`: petal glyph, footprint, AIR shell (deep bronze outer stop), shockwave; expanding curtains.
7. Particles + distortion — lamp/pulse embers (SOFT, curl), ambient motes, heat warp on `LAYER.DISTORTION`.

## Signature
A procession that becomes a building: the votive walks a runner of light to the circle, and the sanctuary it carries has already begun to raise itself there before it arrives.

## Palette
core #fff3d2, tint #ffc45a, body #e8a33a / stone #c8913f, deep #3a2209

## Gameplay
Unchanged: on arrival and every `pulsePeriod` (1.2 s) the combat binding is queried inside `zoneRadius`; allies get a holy status, enemies a holy hit (0.4 dmg, up to 8 each). Pulses are shown only when accepted (or the circle is empty). Forming early during travel is visual only — no query, no event. Speed, range, lifetime and pulse timing unchanged.
