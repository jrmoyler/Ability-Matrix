# Pulse Covenant — `matrix-expansion/pulse-covenant`
Blood · zone (self cast) · anchored on the caster · sigil radius 3.2 m (= zone) · beat waves to 9 m · covenant lives 8 s (gameplay `life`), exit 0.6 s

## Read in one line
A big beating heart is bound 2.4 m over the caster. Its arteries plant on the rim of a dark pool of blood, blood waves roll out on every beat, and vessels arch out to the bodies nearby. When two different casts land on the beat, a pulse of blood tears through the enemies near the second hit.

## Beats
| t (s) | Beat | On screen (shape, size in m, colour, motion) |
| 0.00–0.35 | Anticipation | The heart swells in with an out-back ease (about 1.5 m tall, centred 2.45 m up). Six arteries and their forks grow down to the 3.2 m rim. The additive sigil and the timing gate show on the floor. |
| 0.35 | Impact (bind) | First beat: blood droplets burst off the heart, a WATER burst sphere fires and a SCORCH stain (4.8 m) is slammed down with a 6 m shockwave. Flash, shake and a +6 light punch. The pool starts to run. |
| 0.35–0.9 | Travel | Threads, which are opaque vessels 0.11 m thick, arch from the heart's lower lobes to the 5 nearest bodies within 11 m, tip first, over 0.55 s. On every beat (0.6 s) a ragged blood wave rolls from 1.8 m out to 9 m, with its own warp. |
| 0.9–8.0 | Linger | Lub-dub: the heart contracts apex first and its veins flare. A bolus runs down each artery and out along each thread. Each bolus splashes on its body and leaves a 0.9 m ripple ring under it. The pool spreads to 2.9 m, ripples, and motes rise from it. Beads jump off the sigil. After an owned hit, the timing cue ring contracts to the gate. A pulse adds its own ring, warp, droplets and light at the hit. |
| 8.0–8.6 | Exit | The threads retract, the network shrinks into the heart, the heart burns away from the apex up and the pool dries. The bind stain stays until 8 s. |

## Layers
1. Heart: an extruded two-lobed muscle with deep bevels, plus an aortic arch and a pulmonary trunk (tapered tubes). It is an opaque ShaderMaterial on LAYER.WORLD and casts a shadow. Shading is wrap-lit with fibres, deep clefts, flaring veins, a wet specular and a fresnel rim. Files: `PulseCovenantGeometry.js`, `PulseCovenantMaterials.js`.
2. Arteries: 6 tapered vessels and 6 forks, scaled so they land on `floorRadius`. Opaque dark walls with a bright bolus; 18 instanced red cells.
3. Blood pool: a normal-blended deep-red disc with a lobed edge, wet sheen, ripples on the beat and a bright meniscus. Above it sits the additive sigil (capillaries, rings, timing cue) and the gate ring.
4. Beat wave and warp: a ragged additive ring from 1.8 m to `waveReach`, plus a proxy on LAYER.DISTORTION.
5. Threads: 6 pooled parametric tubes bent along a quadratic arch in the vertex shader, with a bolus per beat. A splash and a RIPPLE decal mark each bolus arrival.
6. Pulse: the existing ring, warp, second light and droplets at the triggering hit.
7. Particles: `expansion.blood` (DROPLET, non-additive) for the bind burst, splashes, beads and pulse. `expansion.blood-motes` (SOFT, additive) rises off the pool.
8. Decals and bursts: a SCORCH stain and SHOCKWAVE at the bind, RIPPLE bites under bodies, a WATER burst off the heart.

## Signature
A visible heartbeat that sets the rhythm the mechanic wants. Each lub-dub sends a wave out across the floor and a bolus down every vessel to the bodies it can reach.

## Palette
core #fff0f2, tint #ff8290, body #d91f47 (muscle #750a22), deep #24030b

## Gameplay
This part is unchanged. The cast never hits on its own. Two different owned casts that land hits `beatSeconds` (0.6) ± `tolerance` (0.18) apart, measured on fixed ticks, emit one blood hit. It deals `damage` 0.45 to up to `maxTargets` 5 enemies within `pulseRadius` 3.2 m of the second hit, excluding that hit's own targets. Threads and waves are presentation only.
