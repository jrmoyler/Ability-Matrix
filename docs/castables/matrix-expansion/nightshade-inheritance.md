# Nightshade Inheritance — `matrix-expansion/nightshade-inheritance`
Shadow · zone · range 18 m · zone radius 3.5 m · waits up to 8 s, exit 1.1 s

## Read in one line
A winged shade skims out on a dark root, the floor blights violet where it lands, and a 3 m nightshade bell of glossy black petals tears up and closes over the nearest enemy — roots creeping from it to the next two who will inherit it.

## Beats
| t (s) | Beat | On screen |
| 0.00–0.50 | Travel | Four-winged shade (1.6×) flies at 26 m/s, 1.1 m up, shedding umbral wisps; behind it a 1 m-wide dark root with a violet vein races along the cast line. |
| 0.50 | Impact | Arrival (host or not): blight (radius = zoneRadius) creeps out over 0.55 s with a violet shock ring to its rim, camera knock, light punch, umbral smoke. The nearest enemy is marked. |
| 0.50–0.90 | Rise | Six petals (3.1 m tall, 1.55 m wide, seat 1.35 m) tear up splayed and close into a bell over the host (outBack); the original wings, crescent crown and blossoms unfurl inside. |
| 0.90–8.0 | Linger | Bell turns (0.12 rad/s), sways and opens on each hunger beat as its veins flood violet from the root; blight swirls with pulsing root veins; two roots crawl (0.9 s) from the host toward its would-be heirs; the wake sinks away over 1.6 s. With no host the bell stands 1.1 s, then withers. |
| on defeat | Inheritance | Ribbon from fallen host to heir, tier seal (AIR burst + shockwave), knock, flash; the bell re-rises over the heir and roots re-aim. |
| exit | Exit | Petals peel open outward, sink and wither tip-down behind a pale edge; blight and roots fade. |

## Layers
1. Shade in flight + wake root (`createRootMaterial`, `nightshadeStripGeometry`).
2. Mark: 8 membrane wings, crescent crown, 24 blossoms (existing).
3. Floor: host pool + claw glyph + distortion pull (existing), and the zone-sized blight (`createBlightMaterial`).
4. Inheritance ribbon + tier seals (existing).
5. Particles: shared shadow smoke, umbral SMOKE.
6. Nightshade bell — instanced cupped petal (`nightshadePetalGeometry`), `MeshStandardMaterial` patch: waxy aubergine `#1b1027`, vein network flooding on the beat, lilac margin, tip-down wither (`createNightshadePetalMaterial`), `LAYER.WORLD`, casts shadows.
7. Heir roots ×2 (`createRootMaterial`).
Ramp: `colorShadeA..D` `#f3eaff` → `#c7a7ff` → `#7b45c9` → `#0b0612`.

## Signature
A deadly-nightshade bell closing over its host, with roots already reaching for the next.
