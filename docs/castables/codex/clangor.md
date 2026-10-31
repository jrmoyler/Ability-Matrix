# Clangor Cage — `codex/clangor`
Sound · zone · range 2–18 m · zone radius 4.7 m · ≈3.0 s on screen (≈0.5 s throw + 1.25 s impact + 1.25 s fade)

## Read in one line
A ring of heavy aged-bronze chime tubes hung from an iron hoop drops out of the sky over the group and slams into the floor. A strike then rolls round the ring twice, tube after tube. Each struck tube flashes white-hot at its band, flexes and steps inward, so the cage rings the circle closed over a dark pan of struck air whose pressure waves roll in to the centre. Then the cage is driven down into the floor.

## Beats
| t (s) | Beat | On screen |
|---|---|---|
| 0.00–0.5 | Anticipation / travel | A hand flare and sparks. Over the last 60 % of the throw the whole cage falls from 7 m as one piece: twelve 0.44 × 3.3 m tubes on a 4.0 m ring, swinging up to 0.22 rad on the hoop. Their sun shadows sweep in over the circle. |
| ≈0.5 | Impact | The feet slam in and dip 0.2 m. A scorch, dust and chips come off every foot, and every tube starts to ring (it flexes 0.2 m at the belly). Template beat: shake 0.5, a 0.06 flash and a light punch, with a low dust roll and the residue stain. The dark pressure pan spreads to the ring in 0.25 s. |
| 0.6–1.9 | Linger: the clangor | 24 clangs, 0.055 s apart, roll round the ring twice, starting with the tube nearest the caster. Each struck tube's band flashes white-hot then cools through lime. The tube flexes hard, kicks 0.06 rad, throws 14 sparks inward and kicks dust in off its foot. It snaps a step inward (outBack, 0.12 s), and its top leans in. Each clang adds a 0.07 shake and a light tick, and throws a filled swell in across the pan from its foot. By the end the ring has closed to 0.7 of its radius. |
| 0.6–2.6 | Linger: the pan | A filled dark pan of struck air (#060504 troughs, #1c1a0c crests, low lime on the crests) inside the ring. Broad 1.3 m pressure waves roll inward at 1.6 m/s, shaded as a sun-lit heightfield, with a dark heaved lip under the feet. |
| 2.3–3.0 | Exit | From 72 % of the life the cage is driven straight down into the floor (ease-in) as the ring dies, throwing dust off every foot. The pan frays out on noise from 78 %. The foot scorches and the residue stain stay. |

## Layers
1. Chime tubes (hero): `createChimeTubeGeometry`, a lathe with an open flared foot, a low band, the strike band and a crown cap. Instanced (max 16) on `LAYER.SHAPED`, casting shadows. `createClangorTubeMaterial` is lit aged bronze: deep #120a05, warm brown body #5c3a1c, worn brass rim #c8995a. It has a warm sun glint and a first-mode flex in the vertex stage. The strike band is the only hot part: white-hot #f2ffd8 through lime #9ee33b. The rim hum is off. All in `ClangorCageAbility.js` / `ClangorCageMaterials.js`.
2. Hoop: `createHoopBeamGeometry`, iron bars with clamp collars joining neighbouring tube tops (instanced, same material).
3. Pressure floor: `createClangorFloorMaterial`, a filled heightfield pan with inward waves and per-clang swells (a 6-slot ring buffer), normal-blended. It frays out on noise.
4. Engine decals: a SCORCH under every foot, plus the template SCORCH residue and DUSTRING telegraph and aftershock.
5. Particles: dark olive dust (slam, clang, sink), lit chips, streak sparks off the struck bands.
6. World: shake, flash and light on the beat. A small shake and light tick on every clang, and the aftershock.

Turned off in the config: body sheet, voice, lens, template ground field, shared rig, detail pieces, shock ring, burst shell. These were the old flat neon scribble panels. The residue-scorch embers are darkened to olive.

## Signature
A cage you hear: the strike rolls round the ring and every clang pulls the bars a step tighter.

## Palette
core #f2ffd8 · tint #c8995a brass / #9ee33b (strike and waves only) · body #5c3a1c bronze · deep #120a05 (tubes) / #060504 (pan)

## Gameplay
Unchanged. `handlesOwnHits`, `WHEN = 'commit'`: everything within max(zoneRadius, hitRadius) is struck once on the beat, thrown on the tangent and carried in orbit. The drop, the clangs, the pan and the sinking are presentation only.
