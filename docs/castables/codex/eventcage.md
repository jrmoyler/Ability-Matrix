# Event Cage — `codex/eventcage`
Void · zone · range 2–18 m · zone radius 4.2 m · ≈2.9 s on screen (≈0.55 s throw + 1.05 s impact + 1.25 s fade)

## Read in one line
A black spiked event is lobbed into the circle while ten bars of dark void-glass fall from the sky. They slam into a ring around the targets as one cage, joined by a lintel. The cage then closes on its centre in four snapped steps while a black hole with a burning violet lip opens under it. The bars are erased top-down one after another round the ring, and the hole closes to a stain.

## Beats
| t (s) | Beat | On screen |
|---|---|---|
| 0.00–0.55 | Anticipation / travel | A 0.42 m black urchin with a violet fresnel horizon and churning spikes arcs 2.2 m high from the hand to the centre and sheds motes. Over the last 55% of the flight the bars drop from 7 m, accelerating, staggered by up to 12%, and their sun shadows sweep in over the circle. |
| ≈0.55 | Impact | 10 bars (0.38 × 3.4 m) land together on a ring at 0.92 × the circle and dip 0.18 m into the floor. A scorch is left under every foot, with chips and dust thrown out. Template beat: shake, flash, light punch and the residue stain. The feet glow white-violet from the slam heat. |
| 0.85–2.0 | Linger: closing | Four closing events (from 0.3 s, each a 0.14 s outBack snap). Every bar jumps inward (to 0.6 × the ring) and leans its top in by up to 0.2 rad. Each event brings a thud, a light tick and dust dragged in off every foot. The notch column on each bar lights one tick further, newest hottest. |
| 0.85–2.9 | Linger: missing centre | A filled hole opens in 0.3 s and grows with the closing (to 0.66 × the ring). It is black inside with spiral streaks draining inward, a 0.32 m violet-to-white lip and a dark violet skirt that pulls the floor in. Motes stream across the floor into it. |
| 1.6–2.6 | Erase | The bars are erased top-down, one after another round the ring over 0.7 s, behind a white-hot cut that throws sparks, and they sink 0.3 × their height as they go. The lintel goes first. |
| 2.5–2.9 | Exit | The hole shrinks shut over 0.4 s. The residue stain and foot scorches stay on the floor. |

## Layers
1. Bars (hero): `createCageBarGeometry`, a chamfered-square prism with a driven spike foot, two collars and a pyramid cap. They are instanced (max 16) on `LAYER.SHAPED` and cast shadows. Material: `createEventCageBarMaterial`, lit void-glass. Deep #06040f / body veins #1a1248, with a key + sky lit, a specular glint, a violet #7a6cff fresnel rim, event notches, foot heat and a white-hot #f0ecff erase cut.
2. Lintel: the same section as a beam between neighbouring bar tops (instanced). It is erased first.
3. The event: a sphere carrier displaced into spikes (`createEventCageSeedMaterial`), black with a violet horizon.
4. Missing centre: `createEventCagePitMaterial`, a filled floor disc with hole, lip and skirt.
5. Template ground field (0.55 strength), residue stain and foot scorches. Dust, chips, streaks and motes (pull, wake, erase sparks).
6. World: shake, flash and light punch on the beat, plus a smaller one on each closing event. Aftershock dust roll.

Turned down in the config: body sheet, voice, shared rig, detail pieces and lens (they read as the old wire dome / ring template).

## Signature
A cage you watch close: bars fall, slam, step inward event by event, and are erased into the hole they surround.

## Palette
core #f0ecff · tint #9a8cff · body #7a6cff / #1a1248 veins · deep #06040f / #010004 hole

## Gameplay
Unchanged. `handlesOwnHits`: everything within max(zoneRadius, hitRadius) is taken once on the beat and dragged inward. The closing, the hole and the erase are presentation only.
