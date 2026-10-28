# Baleful Cascade — `linear-extended/cascade`  ★ reference (§1)
Arcane · zone (mark / summon) · range 0–24 m (capture: 16.8 m) · zone radius 4 m · ≈ 9.3 s on screen (0.25 shard + 7.0 stand + 2.0 close)

## Read in one line
A shard of cold light runs to the circle, a teal ground glow opens and an angular mark cuts itself over it, wisps climb out of the ring and are drawn inward, and a crown of forty faceted teal-and-violet crystal blades assembles 3 m up around a glowing heart — then it marks the nearest body, winds up, and throws its own blades at it in flurries of three, the crown visibly thinning and regrowing.

## Beats
| t (s) | Beat | On screen (shape, size in m, colour, motion) |
|-------|------|----------------------------------------------|
| 0.00–0.25 | Anticipation + travel | Cast flash 0.1 #a8fff0; the shard runs at 66 m/s from 1.25 m shedding motes 26/s and stains 2.6 per metre (#101f26 / #2f6f70). |
| 0.25–0.59 | Impact (glow) | Land shake 0.3, flash 0.2. The ground glow opens to the boundary over `glowTime` 0.34 s (core #7ffff2, pool #1fd3c8, rim #aefff4, wobbling lip 0.32 m, a sweep turning 0.08 rev/s). |
| 0.25–0.77 | Impact (mark) | The line-work cuts itself on behind it over 0.52 s, 0.03 m up: spear, diamond (counter-spinning), 4 hooks at 0.26 R, 9 ribs, 32 ticks; line #5ff2ff, core #e6ffff, deep #2b6adf, wash #1a8fa8. |
| 0.47–1.37 | Impact (wisps) | Wisps leave the floor 0.22 s after landing and climb to 4.4 m over 0.9 s, thinning as they climb, eroding, drawn onto the crown's axis over the top (#5fead8 → #2bc6bd → #12586b). |
| 0.75–1.55 | Impact (crown) | Blades tear out of the middle 0.5 s after landing and assemble over 0.8 s (each may lag 40 %), rising 0.9 m to hang at 3.1 m: 10 spears (1.85 × 1.65 m ≈ 3 m), 16 blades (≈ 1.65 m), 14 shards (≈ 0.9 m), 42 % dealt violet stone. Crown shake 0.2, flash 0.22. Heart r 0.24 × 1.65 m with filaments; halo 2.3 × 1.65 m, 16 rays, a ring at 0.62. |
| 1.85–7.25 | Linger (work) | 0.3 s later: marks the nearest standing body within 12 m, winds up 0.3 s (crown 85 % brighter), then throws **3 blades** — each the blade already pointing nearest the body, launched from its actual tip (throw length 1.45 m, flare 2.6, 220 trail sparks/s, shake 0.14). A thrown blade's presence goes to 0 in the crown (visible gap) and regrows over 0.9 s after 0.35 s. Only the last blade through a body kills (`cutHit` 3.6 / 2.6 / 1.8, slice at the waist); earlier ones draw sparks. Crown bobs 0.05 m, spins 0.03 rev/s, nods 0.22 rad; breathes on `pulseRate` 1.05; motes lift off the mark, a mist bank sits in it. |
| 7.25–9.25 | Exit | `fadeTime` 2.0 s: the mark closes. |

## Layers
1. **Decal mark** — `materials/CascadeMarkMaterial.js` (SDF line-work, re-seated live by `zoneRadius`).
2. **Ground glow** — `materials/CascadeGlowMaterial.js`, 0.008 m up, under the mark.
3. **Wisps** — `materials/CascadeWispMaterial.js` on `assets/CascadeGeometry.js` parameter-space ribbons.
4. **Crown / volley / heart / halo** — `materials/CascadeBladeMaterial.js`: blades are a parameter-space tube whose 8-facet cross-section is **pinched to a lens** (sharp edge each side, spine ridge each face), `MeshStandardMaterial` with replaced vertex stage + extended emissive, `flatShading` so each facet takes the sun, matching depth material; body #08252f / facet #1e8f92 (violet stone #1b1240 / #5f4bbd), edge #3fe4ff, vein #a98cff, hot #8ff2ff. Crown and volley share **one uniform block by identity**.
5. **Particles** — motes (#ffffff → #0a3038), streak sparks for trails and wounds (#ffffff → #1a2a6b), crystal chips (#cffff6 → #101a2e), mist (#bfe8e6 → #141d24); light (r 12, half-way up to the crown).

## What the capture shows
Standard sheet: `sheets/linear-extended__cascade-sheet.jpg`; dense pass f4–f90.
- **f4 (0.13 s)** — a soft cyan glow at the site, a trail of dark stain marks from the caster.
- **f10–f16 (0.33–0.53 s)** — the ground glow and concentric rings open to the boundary (~8 m); the angular mark cuts in on top.
- **f24 (0.8 s)** — wisps rise out of the ring and bend inward; a bright heart appears ≈ 3 m up.
- **f34–f64 (1.1–2.1 s)** — the crown: a starburst of long faceted teal and violet blades round a white heart with a thin halo ring, the wisps curving up into it like a cage; the mark below is a bright cyan disc with the line-work inside.
- **f90 (3.0 s)** — it has worked: a dummy lies on the floor ≈ 7 m off tagged `inscribed`; the crown has visible gaps where blades left. At 8 m the crown reads as a ~3 m starburst — a clear hero, though the blades in flight are small and fast (best seen frame by frame).

## Signature
**The crown is a magazine**: the thing that is thrown is visibly the thing that was standing there — a blade leaves a gap in the crown and grows back.

## What makes it the bar
1. **Many authored blades from one procedural cross-section.** A `(t, a)` tube grid whose thickness the shader pinches to zero at two opposite angles → a lens-section blade with real facets; eight facets + `flatShading` = "cut crystal", not "carrot". Lengths are multiples of one `crownScale`.
2. **Dealt on the CPU, shaped on the GPU.** Unlike Growth (instance index → bearing in shader), the crown is dealt into instanced attributes (`aDir`, `aShape`) the ability rewrites every frame from live settings — because it must know a blade's tip in world space to throw it. Nothing captured at spawn.
3. **Shared uniform block by identity.** Crown and volley materials receive the same `_blades` object, so a launched blade has identical section, taper, facets and palette — it reads as the crown spending itself, not a projectile spawning.
4. **Choreographed volley with a lethal rule.** Pick the blade already pointing nearest the target, launch from its tip, three per target ~70 ms apart, only the last one kills, crown presence → 0 then regrow (`crownRegrowDelay` 0.35, `crownRegrow` 0.9). One float per blade turns a turret into a summon that spends something.
5. **Wisps feed the crown.** Wisp spines are drawn onto the crown's axis over the top of their climb — the ground layer visibly supplies the hero layer; the heart lights nearby facets (`bladeGlow`), so forty solids read as one lamp-lit object.
6. **Staggered build on one clock.** glow 0.34 → mark 0.52 → wisps +0.22 → crown +0.5 over 0.8 → first throw +0.3: four layers arrive as one assembly.

## Palette
core #ffffff / #e6ffff, tint #aefff4 / #8ff2ff, body #1fd3c8 / #1e8f92 / #5f4bbd, deep #08252f / #1b1240

## Gameplay
`handlesOwnHits`: targets within 12 m, 3 blades per flurry, last one slices (3.6 / 2.6 / 1.8). Cooldown 3.4 s.
