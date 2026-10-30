# Railgun Lance — `codex/railgun`
Tech · line (pierce) · range 26 (capture ≈ 11 m) · no zone · ≈ 3.5 s on screen (0.5 charge + 0.07 flight + 0.85 held column + 2.2 cooling scar)

## Read in one line
Three hard-light coils draw themselves in front of the hand and spin up, the slug leaves at 160 m/s, and the line becomes a held column of light — white braided core in a deep-blue sheath, two counter-wound strands of rifling round it, a bell where it hammers the far end — that thins, unwinds into motes and leaves a half-metre molten trench in a two-metre scorch, crawling with heat, smoking and spitting embers.

## Beats
| t (s) | Beat | On screen |
|-------|------|-----------|
| 0.00–0.50 | Anticipation | Coils (r 0.42 → 0.30 m, flat hex-lattice hard-light bands, 1.35 m up, 0.9–2.0 m ahead) draw in one after another with a hot leading edge, counter-rotate up to 26 rad/s; tangential sparks, motes drawn onto the axis, slug orb swelling in the muzzle; hum + light ramp. |
| 0.50 | Shot | Coils kicked back 0.22 m and swell; muzzle sparks, muzzle shock ring, kick shake, flash; the slug (1.5 m teardrop) crosses the line shedding streaks, punching a shock ring every 2.4 m, the trench opening white-hot behind it. Bodies within 0.8 m of the line are killed and thrown down it. |
| ≈0.57 | Impact | STORM shell 3.6 m (#d8fdff → #7ff0ff → #1d5cff, 0.7 s), 5.5 m ground shockwave, 2.4 m scorch, 220 sparks + 70 debris, end shock ring, shake. |
| 0.57–1.85 | Linger (held column) | Column: core r 0.13 (braided white), sheath r 0.42 (normal-blended, deep #0a1f8f skin → #1458ff → cyan rim), halo r 0.85; bell opens ×2.6 over the last 2.2 m; the column breathes. Rifling: 2 strands r 0.36, 0.55 turns/m, opposite hands, rolling 5 rad/s with pulses running down. The far end keeps taking the shot: 3.2 pressure shells + 3.2 m floor rings per second and 260 splash sparks/s thrown back up the line (falling off over 1.3 s). Dark ionised haze (#3c5f8c → #070b16, normal blend) hangs along the line. |
| 1.0–2.6 | Unwind | Beam thins late (curve 2.4) and breaks into dashes; rifling unwinds outward to 2.5× its radius and tears into light from noise, shedding motes; coils derez into pixels. |
| 1.4–3.6 | Exit (scar) | Trench (molten core half-width 0.24 m, scorch 1.15 m) cools muzzle-first white → #ff9a3a → #7a1806 under a #07090c crust; a heat wave crawls down the seams (1.1 c/s) and a thin cyan fused seam glows down the middle; smoke 150/s and embers 160/s lift off it; it erodes raggedly last of all. |

## Layers
1. Coils — param grid bent into a flat torus band (`createRailCoilMaterial`), ×3–5.
2. Slug — teardrop (`createRailSlugMaterial`).
3. Column — one tube drawn three times (`createRailBeamMaterial` core / sheath(normal) / halo) with shared bell + breathing in the vertex stage; heat bend on `LAYER.DISTORTION`.
4. Rifling — `createHelixGeometry` + `createRailHelixMaterial`: counter-wound strands, four-stop ramp, unwinding + tearing.
5. Shock rings — instanced quads across the line.
6. Slag trench — ground strip shader: voronoi crust, muzzle-first cooling, crawling seams, cyan glass seam.
7. Particles — coil/impact/splash sparks (STREAK), slug streaks (STREAK), motes/pixels/rifling motes (SOFT), slag smoke (SMOKE), ion haze (SMOKE, normal), embers (SOFT), debris (CHIP).
8. Impact — STORM burst, SCORCH + SHOCKWAVE decals, end pulses, flash, shake, light.

Files: `abilities/codex/RailgunLanceAbility.js`, `materials/codex/RailgunLanceMaterials.js`, `assets/codex/RailgunLanceGeometry.js`, `config/codex/railgun.js`.

## Signature
The rifling: two hard-light strands braided round a held column, rolling, then unwinding off it into light — the trail of a slug that was spun.

## Palette
core #ffffff, tint #7fe6ff, body #1a8cff / #1458ff, deep #0a1f8f (+ slag #ff9a3a / #7a1806 / scorch #07090c)

## Gameplay
`handlesOwnHits`: the slug kills every body within `hitRadius` of the line as it crosses it, throws it down the line (`hitImpulse`, `hitLift`, `hitSpin`) and stains it with the hard-light burn. Unchanged by the upgrade.
