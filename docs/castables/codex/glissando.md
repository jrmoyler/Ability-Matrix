# Glissando Sweep — `codex/glissando`
Sound · line · range 2–18 m · ≈2.9 s on screen (≈0.4 s travel + 1.25 s impact + 1.25 s fade)

## Read in one line
A rank of dark bronze organ pipes on a wind chest, 5.5 m wide and 3.1 m at its tallest, rises out of the floor 2.6 m ahead of the caster. It slides in late from one side and plays a run that climbs from its long, low pipes to its short, high ones. Each pipe it passes shivers, lights its lime mouth and throws a dark pressure ripple. On the beat every pipe sounds at once. It glides on past the targets, still playing faster and higher, then sinks back into the floor and leaves a scoured trail.

## Beats
| t (s) | Beat | On screen |
|---|---|---|
| 0.00–0.12 | Anticipation | The hand flare. The rank rises out of the floor (outBack, a small overshoot and settle) 2.6 m ahead and 2.4 m to one side (random). The pipes lean with the 1.1 m shear. |
| 0.12–0.4 | Travel | The rank waits for 30% of the travel, then glides down the line, easing in from the side. The run climbs the rank about 1.3 times a second. Each pipe it reaches swells in a standing wave, lights its lime mouth and throws a dark ripple toward the caster. Dust is scoured off the chest's foot, and a dark scoured patch (1.1 m) is left every 1.1 m. |
| ≈0.4 | Impact | Hits are taken by the head from 42% of the line on (template `late`). Every pipe speaks at once and throws a ripple. The bronze flares, and the beat brings shake, flash and light. Bodies are thrown sideways. |
| 0.4–1.9 | Linger | The rank glides 1.6 m on and 1.2 m sideways while the lean settles the other way. The run keeps climbing, faster as the pitch climbs (up to ×2.2), over a hum that decays to 25%. Ripples keep rolling out, and the shorter pipes shiver faster. |
| 1.85–2.65 | Exit | The rank sinks into the floor (`rankSink`) while its ripples thin out. The scour and the template scar stay. |

## Layers
1. Pipe rank (hero): `GlissandoSweepSignatureGeometry.js`. Each pipe is lathed with a toe, a conical foot, a languid band, a pressed-flat mouth, a body, a rolled rim and an open bore. The chest is a moulded, bevelled box. Both use `createGlissandoSweepPipeMaterial`, a lit metal shader with a night horizon reflection, sun specular, hammered grain and patina, and a standing-wave swell in the vertex stage. They are instanced, on LAYER.SHAPED, and cast shadows. Stops: deep #0d0805 → bronze #4f3f20 → polished #c08f4c, with lime #b6e33b only in speaking mouths and as a faint rim.
2. Pressure ripples: an instanced pool of 48 arcs (`createGlissandoSweepPressureMaterial`). Each is bulged and heat-warped, with a dark translucent body #111906 and a thin lime crest that dies before the body does. The same ripples go into LAYER.DISTORTION (`createGlissandoSweepPressureLensMaterial`, a gentle warp).
3. Floor: scoured SCORCH patches along the path (`groove*`), plus the template scar, wake and residue.
4. Particles: foot dust and sparks, plus the template shed.
5. World: the template beat (the burst is turned down to a trace) and the aftershock.

Turned down in the config: the old lime sheet (`sheetOpacity` 0; its motion still drives the rank), the body, voice, shared rig, detail slats and lens.

## Signature
A solid instrument plays the spell: an organ rank whose run climbs from long pipes to short ones, faster and faster, as it slides in late.

## Palette
lime #b6e33b (mouth, crest) · polished #c08f4c · bronze #4f3f20 · deep #0d0805

## Gameplay
Unchanged. Hits are `late` and sideways at the head. The rank's lag, glide and run are presentation only.
