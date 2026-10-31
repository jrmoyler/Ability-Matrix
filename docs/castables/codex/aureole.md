# Aureole Ring — `codex/aureole`
Light · zone · range 2–18 m · circle 4.2 m · ≈2.8 s on screen (≈0.5 s travel + 1.05 impact + 1.25 fade)

## Read in one line
A twelve-pointed star of cast gold is thrown spinning over the circle while a crown of gilt flamberge rays rises out of the floor wide of it and tightens in; when the radius meets the crown snaps shut, a band of white-gold runs up every blade, the bodies are flung out, and the crown turns, cools to bronze and sinks back into a sunburst burned into the floor.

## Beats
| t (s) | Beat | On screen |
|---|---|---|
| 0.00–0.50 | Travel / anticipation | Sun-star (0.85 m radius, faceted boss) arcs from the hand to hang 2.3 m over the centre, spinning 14 rad/s, motes in its wake. 16 rays (2.7 m tall / 1.7 m short, alternating) rise from the floor at 1.55 × R leaning out and tighten to 0.95 × R. |
| 0.50 | Impact (flare) | The crown snaps in 12 % and leans its tips 0.32 rad toward the star (outBack); a white-gold band runs foot→tip over 0.38 s; 8 sparks shot up each blade; the star swells and rises 0.35 m; the sunburst lands from the centre; bodies flung outward (unchanged hit). Light +9 +6, flash 0.06. |
| 0.5–2.0 | Linger | Crown turns 0.25 rad/s, each blade sways; heat cools gold → bronze; star turns and bobs; light motes rise off the sunburst. |
| 2.0–2.8 | Exit | Rays sink into the floor one after another round the ring; the star drops into the boss and shrinks; the sunburst erodes. |

## Layers
1. Crown — instanced lofted flamberge rays, `LAYER.SHAPED`, casts shadow, lit gilt shader (bronze deep, gold body, glint, edge light, flare band) (`createAureoleRingGiltMaterial`).
2. Sun-star — authored star plate with a faceted boss, same gilt shader.
3. Sunburst — filled floor disc of long/short gilt wedges on an umber bed, hot foot ring, cools and erodes (`createAureoleRingSunMaterial`).
4. Particles — blade sparks and template rising light (SOFT), star wake and sunburst motes.
5. Engine — telegraph, SCORCH residue, light, shake.
Template ring / voice / rig / pieces / field / lens switched off through their own keys.

## Signature
A crown that closes in from outside the circle and meets it on the beat — the flare runs up the blades.

## Palette
white-gold #fff2c4 → pale #ffe7a0 → gold #a86e10 → bronze #1e1002; floor bed #160d02, rays #8a5c10.

## Gameplay
Unchanged: hits once on the beat (commit) inside the circle, thrown outward.

## Upgrade notes
Before (5/10): flat spiked gold ring on the floor. After: thrown sun-star, a crown of lit gilt rays that tightens in and flares, sinks at the end, over a dark sunburst. Template ring, voice, rig, pieces, field and lens off by their own keys; 48 new keys in editor folders 14–16. Presentation only.
After sheet: `/tmp/claude-0/-home-user-Ability-Matrix/174b9a5c-e697-5786-9cd6-44ec7499a4e1/scratchpad/agents/R7/v3/codex__aureole-sheet.jpg`. Honest score 8.
