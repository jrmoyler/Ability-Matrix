# Mass Weft — `matrix-expansion/mass-weft`
Gravity · line · range 2–18 m · capsule half-width 1.1 m · ≈ 5.5 s on screen (10 m cast, defaults: 0.5 s travel, 4 s corridor, 1 s collapse)

## Read in one line
A shuttle of collapsed mass rolls down the line and a row of heavy stone loom
arches heaves out of the floor behind it over a dark, bending well; every
second a strike wave runs the corridor, the arches beat in one after another
like a loom's beater, and a block of stone drops on a glowing warp thread onto
every body standing inside.

## Beats
| t (s) | Beat | On screen (shape, size in m, colour, motion) |
|---|---|---|
| 0.00–0.10 | Anticipation | The shuttle (0.8 m lathed spindle, near-black #0e0819 body, burning violet→white rim) appears at the hand rolling about its axis; the well starts to darken the floor under it. |
| 0.10–0.55 | Travel | The shuttle flies point-first at 20 m/s, 0.6 m up. Behind it the corridor is drawn: the filled well (2.9 m wide) and ribbon grow to the front, and each loom arch (1.45 m tall, ≈ 2.9 m span, squared studded section) heaves up out of the floor 0.35 s after the shuttle passes it, seams flaring. Twin beaded threads twist down the spine; infall motes pull in from the edges. |
| 0.55 | Impact — lock-in | One frame: camera knock 0.12, light lift, four CRACK decals laid down the whole corridor (stay for its life). The first pulse: the strike wave leaves the caster, the first-strike flash. Every struck body gets a loom weight (≈ 2 m tall dark stone, violet runes) released 2.4 m above it on a white-hot thread; it lands 0.22 s later — STORM burst, CRACK decal, knock 0.12, a squash — and the thread snaps and whips up out of sight. |
| 0.55–4.55 | Linger — the loom | Every `pulsePeriod` (1 s): the strike wave (a pale chevron across the well) runs caster → front in 0.55 s; each arch it reaches lifts 0.35 × slam, then slams down and leans 0.32 rad toward the front and recoils (a rolling beat down the row, seams flooding white); the threads swell into a knot that travels with the wave; three compression rings run the corridor; grit chips leap off the floor; new weights drop on whoever is inside. Between strikes the well's bands keep dragging toward the front, the arches sway out of step, landed weights settle, sink 0.55 × size and dissolve over 1.4 s. |
| 4.55–5.55 | Exit — implosion | Flash 0.12, knock 0.14. The arches sink back into the floor (leaning alternately inward) and dissolve through a burning white edge; the corridor narrows by 85 %; the threads draw in; the shuttle swells ×1.6 and flares as the weave falls into it, then everything fades. The crack decals fade last. |

## Layers
0. Loom arches (hero) — `loomArchGeometry` (two-centred pointed arch swept with a bevelled superellipse section; flared feet, three tie-off studs per leg, swollen keystone), up to 8, spacing/span/height derived from the corridor every frame; `createLoomStoneMaterial` (lit by `uLightDir`, wrap diffuse, specular, violet fresnel, thin noise cracks + rune bands glowing the four-stop ramp, flare on a beat, dissolve exit). Opaque, `LAYER.WORLD`, casting/receiving shadows. `MassWeftGeometry.js`, `MassWeftMaterials.js`.
1. Weft ribbon — `gravityRibbonGeometry` trough + `createWeftFieldMaterial` (additive filaments rolling to the front, bright spine and edges).
2. Floor well — `weftFloorGeometry` + `createWeftFloorMaterial`: normal-blended filled field — fbm bands of bent space pinched to the spine, coloured `gradient4(deep, body, tint, core)`, mostly deep; a dim weave lit only on band crests; crushed lips at the capsule edge; the strike-wave chevron. 2.6 × radius wide. Plus 4 CRACK decals at lock-in.
3. Threads + heddles — two counter-wound tubes (`gravityFilamentGeometry`) with their own bulge vertex stage (knot rides the strike wave), ramp-coloured; six bead rings.
4. Shuttle — `shuttleGeometry` lathe, `createShuttleMaterial` event-horizon shader.
5. Strike — compression rings (3 waves × 3); `GravityContacts`: per struck body a loom weight (`loomWeightGeometry`: truncated four-sided stone with a cord hole and groove; same stone material; `LAYER.WORLD`, shadows) on a warp thread (additive cylinder, ramp from core at the weight to body at the sky, beads running down), a puckered-space rosette, STORM burst + CRACK decal on landing.
6. Lens — ribbon on `LAYER.DISTORTION`, pulling toward the spine.
7. Particles — corridor STREAKs (ExpansionAtmosphere), `exp-mass-weft.infall` SOFT motes, `exp-mass-weft.grit` lit CHIPs.
8. Light — #dccbe9, 5 / 8 m, punched on every strike and the implosion.

## Signature
The loom beat: a strike is a wave that runs the corridor and beats each stone
arch in turn, and the blow lands as a loom weight dropped on its thread.

## Palette
core #f7f1ff, tint #c4a8ff, body #7b4fe0, deep #0e0819 (stone #221b33)

## Gameplay
Handles its own hits through the expansion combat binding: every `pulsePeriod`
(≥ 0.3 s) one `hit` event (element gravity, capsule shape from caster to aim
point, radius `zoneRadius`, `damage`, authored impact force) for up to 8
living enemies inside the capsule and not behind cover; refused queries/emits
retry after 0.2 s. Without a binding it draws nothing. Visual weights are
cosmetic and fire only after an accepted event (max 3 bodies per pulse).
`settings.global.lifetime` scales the staged clock.
