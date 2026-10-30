# Stasis Bell — `codex/stasisbell`
Time · zone · range 2–18 m · circle 4.4 m · ≈4.6 s on screen (≈0.45 travel at 20 m/s + 0.4 form + 3 tolls × 0.62 + release + 1.1 unmade)

## Read in one line
A struck note skates out to the circle while a great brass bell is **turned into being over it and lowered onto its hang** — derived so its lip clears the tuning-fork fence by 0.4 m (crown ≈4.55 m, fully in shot). The fork tines rise round the rim, the bell swings and tolls; each toll sends a sound front down to the fence, strings of standing waves are strung between the tines, and a **wall of stopped sound** (umber at the floor, amber standing bands that beat with the tolls) fills the circle while an amber tide and a dial of minute ticks floods the floor. Bodies inside stop dead, stained brass. The last toll snaps the strings, tears the wall away upward and throws everything out.

## Beats
| t (s) | Beat | On screen |
|---|---|---|
| 0.0–0.45 | Anticipation / travel | A hot brass bead with a comet of sparks skates along the floor, leaving a ring of sound every 1.4 m; the resonance band draws round the rim; overhead the bell is swept into being on the lathe (70 % during travel), its cut edge glowing, descending 1.1 m. |
| ≈0.45–0.85 | Impact / form | The bell finishes turning and settles onto its hang with a dip (outBack); 14 thick brass tines rise in a staggered wave. |
| ≈0.85–2.7 | Linger (hold) | Three tolls: lip flexes, inscription blazes, a front runs down the cone to the fence, tines flare and quiver, strings (0.08 m, amber) strung three rows high; the field wall stands; motes hang dead still; bodies stop. |
| ≈2.7 | Release | Strings snap and whip back, the wall tears away upward, AIR shell (amber), shockwave, dust ring, flash 0.35, held bodies thrown outward. |
| ≈2.7–3.8 | Exit | Tines sink, the bell is unmade by the same lathe sweep, the floor fades. |

## Layers
1. Bell, clapper, escapement wheel — lathe brass (`createBellMaterial`): lit, env-reflecting, verdigris, inscription; lathe materialise.
2. Tines — vertex-built tuning forks (thicker: 0.075 m prongs, 0.34 m gap).
3. Strings — standing-wave ribbons, amber not white.
4. Sound fronts — rippled cone bands.
5. Held field — `createCurtainMaterial` (new): open cylinder on the rim, normal-blended, four-stop umber→amber→crest ramp, tine seams, torn upward on release.
6. Floor — resonance band, standing-wave rings, minute-tick dial, amber held wash (`washStrength`).
7. Motes / sparks / dust; travel bead and sound rings.
8. Air — `LAYER.DISTORTION` ring per toll + held shimmer.
9. Beat — knocks, light punches, release shell/shock/dust/flash.

## Palette
core #ffd27a / pale #ffc861 / body #b8640f–#d6a046 brass / deep #2a1404 umber (brass dark #6a4a1c)

## Gameplay
Unchanged: `handlesOwnHits`; bodies in the circle are held from the first front's arrival and thrown on the release with the same impulse/lift/spin.

## New settings (presentation)
`hangFromZone`, `hangClear`, `dropHeight`, `travelForm`, `travelRate`, `travelSize`, `travelRingSpacing`, `travelRingRadius`, `washStrength`, `curtainHeight`, `curtainBands`, `curtainGlow`, `curtainOpacity`, `colorCurtainA/B/Deep` (folders "1 · Bell", "6b · Held field", "Note (travel)", "7 · Floor"). `hangHeight` is kept as the fixed height used when `hangFromZone` is 0.
