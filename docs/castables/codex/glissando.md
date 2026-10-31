# Glissando Sweep — `codex/glissando`
Sound · line · range 2–18 m · ≈2.9 s on screen (≈0.4 s travel + 1.25 s impact + 1.25 s fade)

## Read in one line
A single bowed wall of sound, 6 m wide and 3 m tall, rises 2.6 m ahead of the caster. Its top edge is the waveform itself. It slides in sideways and sheared over, lagging the cast, and its ridges crowd from low pitch to high across it as the pitch climbs. It arrives late, glides on past the targets ringing, with two echoes behind, and then tears into strips and sinks. It leaves a scoured trail on the floor.

## Beats
| t (s) | Beat | On screen |
|---|---|---|
| 0.00–0.12 | Anticipation | The hand flare. The sheet rises out of the floor (outBack) 2.6 m ahead and 2.4 m to one side (random), with its top sheared 1.1 m over. |
| 0.12–0.4 | Travel | It waits for 30% of the travel, then glides down the line, easing in from the side. A chirp of ridges runs across it (1.6 → 7 ridges across, rising) and its top edge swings with the waveform. Dust and sparks are scoured off its foot, and a dark scoured patch (1.5 m) is left every 1.1 m. |
| ≈0.4 | Impact | Hits are taken by the head from 42% of the line on (template `late`). The beat brings shake, flash and light, and bodies are thrown sideways. |
| 0.4–1.9 | Linger | It keeps gliding 1.6 m on and 1.2 m sideways while the shear settles the other way. The ridge depth decays to 25% while the pitch keeps climbing. Two echoes (0.8× size, half strength) follow 1.3 m apart. |
| 1.85–2.65 | Exit | It tears into horizontal strips (echoes first) and sinks to 40% of its height. The scour and the template scar stay. |

## Layers
1. Sheet (hero): a grid carrier reshaped in the vertex stage (`createGlissandoSweepSheetMaterial`): it is bowed, sheared, and has chirped ridges and a waveform top edge. It is instanced for the echoes. Four stops by crest: deep #0b1500 troughs → body #74b415 → tint #d8f77a → white-hot crests. It also has a burning top edge, a foot glow and a strip tear.
2. Floor: scoured SCORCH patches along the sheet's path (`groove*`), the template scar and wake, and the residue. The ground ring field is turned down to 0.25.
3. Particles: foot dust and sparks, plus the template shed.
4. World: the template beat and aftershock.

Turned down in the config: body, voice, shared rig and detail slats (the scattered pale "piano-key ladders"), and the lens.

## Signature
One shout you can see: a waveform wall whose pitch climbs as it slides in late.

## Palette
core #ffffff · tint #d8f77a · body #74b415 · deep #0b1500

## Gameplay
Unchanged. Hits are `late` and sideways at the head. The sheet's lag and glide are presentation only.
