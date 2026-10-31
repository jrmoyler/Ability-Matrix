# Venturi Gate — `codex/venturi`
Wind · zone · range 2–18 m · circle 4.2 m · ≈2.9 s on screen (≈0.5 s travel at 27 m/s + 1.05 impact + 1.25 fade)

## Read in one line
A spinning spindle of air is flung from the hand into the circle, a tall hourglass of dense dark-teal wind slams up round the bodies, its waist squeezes tighter and faster until it coughs: the mouth blows open, the wall is torn away top-down, a dust roll runs out and the bodies are thrown clear over a spiral-scoured floor.

## Beats
| t (s) | Beat | On screen |
|---|---|---|
| 0.00–0.50 | Travel | Gust: a 1.9 m spindle of streaming air (dark teal body, pale crests) rolls along an arc from the hand into the circle, shedding streaks. Over the last half of the flight the foot of the gate whirls up to 28 % height; the scour footprint shows faintly. |
| 0.50 | Impact | The wall slams up in 0.16 s (outBack): 2.5 m tall (kept in frame), foot on the circle (4.2 m), throat at 55 % height, mouth 0.95 × R, fourteen clean vertical air flutes; a dark teal body with mint only on the flute crests, thin streaks running up and a bright throat ring. The spiral scour lands out to the rim behind a pale lip. Light punch, small shake. |
| 0.66–1.65 | Squeeze | Throat closes 0.78 → 0.24 × R (inOutCubic), spin ×3.6 and upward flow speed up; dust is drawn in across the floor, streaks spiral up the wall; the floor grooves wind with it. |
| ≈1.65 | Cough (second beat; the original echo hit) | Mouth blown open and 1.4 m up, spin burst, wall torn away from the mouth down over 0.7 s; 110 dust puffs roll outward, 170 streaks fan out, chips, a dark dust-ring decal, shake 0.45, light +8. Bodies thrown out (unchanged hit). |
| 1.65–2.8 | Linger | Radial scour streaks overlay the spiral; dust roll thins; floor cools from a teal glow to near-black grooves with pale ridges. |
| 2.3–3.0 | Exit | Scour erodes on noise; residue stain decal remains. |

## Layers
1. Gate wall — lathe drawn in the vertex stage (foot/throat/mouth profile, flutes, twist), normal-blended air shader (`VenturiGateMaterials.createVenturiGateWallMaterial`).
2. Gust — the same shader on a spindle profile laid along the aim.
3. Scour — filled floor disc: spiral grooves, combed ridges, cough rays, erosion (`createVenturiGateScourMaterial`).
4. Particles — inward dust (SMOKE), up-spiral and cough streaks (STREAK), chips (CHIP), template motes.
5. Engine — telegraph DUSTRING, SCORCH residue, cough DUSTRING, small AIR burst, shake, light.
Template drum / voice / rig / pieces / field / lens switched off through their own keys.

## Signature
The waist of the gate visibly closes — a squeeze you can see — then coughs open.

## Palette
crest #b9f5e4 → body #1b6e5a → deep #031a15; scour bed #03120e, ridges #4f9c86.

## Gameplay
Unchanged: `handlesOwnHits`, hits only on the echo beat (fade t > 1.08) in max(zoneRadius, hitRadius) × 1.15, blown outward; carry in.

## Upgrade notes
Before (4/10): a wire drum of thin teal bars. After: gust → hourglass wall that squeezes → cough → spiral scour. Template drum, voice, rig, pieces, field and lens switched off by their own keys; 56 new keys, all in editor folders 14–17. Presentation only.
After sheet: `/tmp/claude-0/-home-user-Ability-Matrix/174b9a5c-e697-5786-9cd6-44ec7499a4e1/scratchpad/agents/R7/v3/codex__venturi-sheet.jpg`. Honest score 7–8: the hero and motion are its own; the wall's crest pattern is still a little mottled/mint at 13 m.

## Fix pass (coordinator)
Height 3.3 → 2.5 m and lower cough lift so the hourglass stays in frame; the wall fragment shader was rewritten: the fbm blotches are gone, the body is an opaque-ish dark teal (#135646 → #021410), 14 vertical flutes carry mint crests, thin streaks pulse up between them, and a mint throat ring marks the squeeze.
After sheet: `/tmp/claude-0/-home-user-Ability-Matrix/174b9a5c-e697-5786-9cd6-44ec7499a4e1/scratchpad/agents/R7/fix/v2/codex__venturi-sheet.jpg`. Honest 8.
