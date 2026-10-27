# Glacial Crown — `linear/glacier`  ★ reference (§1)
Frost · zone (far cast) · range 0–18 m (capture: 12.6 m) · zone radius 4.6 m · ≈ 6.6 s on screen (0.29 front + 4.2 stand incl. 0.22 bloom + 0.5 delay + 0.45 stagger + 1.15 crumble), rime 7.5 s

## Read in one line
A cold front lays a trail of rime patches to the circle, the disc freezes outward to the boundary, and a starburst wall of prismatic glass blades — thrown outward, fanned so they cross, wildly uneven — erupts around it as a sweep from the near side, stands glinting with snow falling through its open middle and cold air spilling off its rim, then breaks plate by plate and sinks.

## Beats
| t (s) | Beat | On screen (shape, size in m, colour, motion) |
|-------|------|----------------------------------------------|
| 0.00–0.29 | Anticipation + travel | `cast3`; the front leaves the hand (1.22 m) and runs at 44 m/s, laying rime patches (r 1 m, 2.2 per metre, 7.5 s) — the path is drawn on the floor. |
| 0.29–0.51 | Impact (bloom) | `snapTime` 0.22 s: the frozen sheet races out to the boundary; 7.5 m shockwave (#8ee8ff/#ffffff), flash, shake. The ring erupts as a **sweep**: the blade nearest the caster first, the wave running round both sides over `sweepTime` 0.42 s (+0.07 s stagger) to meet at the far side. Blades (≈ 132 on the ring at 0.94 R ± 0.16 R, length 1.4 m with an uneven crest `ringWave` 0.61; skirt shards 1.7 m banked 0.74–1.16 R behind the wave after 0.1 s, 53 % of them ankle-high rubble) each **crystallise upward** through a lit freeze front over `riseTime` 0.2 s, punch 30 % past full length and settle over 0.5 s. Lean outward 0.33 rad, splayed ±1.16 rad off the radius so neighbours cross. |
| 0.51–4.49 | Linger (hold) | The crown stands: chromatic glints on every edge, light piped up each blade to an incandescent tip with slow bands climbing; a **curtain of cold air** (1.9 m, at 1.02 R) pours downward off the rim; **snow** spawned above the crown falls back through the open middle; glitter lifts off the sheet; mist pours off the rim and *sinks* (`mistRise` −0.12); rime creeps round the boundary 3/s; pressure rings 0.9/s travel *inward* across the sheet; 12 % late shards keep pushing up through the sheet. |
| 4.49–6.59 | Exit (collapse) | After `shatterDelay` 0.5 s (+ up to 0.45 s stagger) each blade breaks into plates and wedges from the inside out — break edges flaring (`shatterGlow` 3) — and crumbles into the floor over `sinkTime` 1.15 s, throwing 5 chips; the sheet thaws back toward the middle. Rime decals remain to 7.5 s. |

## Layers
1. **Blades** — `createCrystalGeometry` (7 facets, roughness 0, bend 0 — clean prisms, taper 0.36, base r 0.375 m) on an `InstancedMesh` (≤ 320, 220 dealt), shaded from scratch by `materials/GlacierMaterial.js` (`ShaderMaterial`, non-indexed per-face normals, `LAYER.WORLD`): glass body #0e4a66 (`body` 1.37), edge #ffffff, prism split #57f0ff ↔ #8f9bff, piped core #a8f4ff, tip #ffffff, one HDR-probe reflection + sun lobe (specular 2.0). Per-instance `aSeed`, `aBirth`, `aGrow`, `aShatter`.
2. **Frozen sheet** — `materials/FrostFieldMaterial.js#createFrostFieldMaterial`, ability-owned quad (not a decal) re-scaled live by `zoneRadius`: 0.4 m bright boundary band, plates 2.2/m with rime in the seams, warped frost fingers, inward pressure rings, slow cold sweep, breathing core pool; #a7e6ff / #ffffff.
3. **Cold veil** — `createFrostVeilMaterial`: open cylinder on the boundary, ridged noise stretched vertically and scrolled *downward*, eroded harder at the top; #8cd2ff / crest #ffffff.
4. **Particles** — mist `SMOKE` 240/s (#f2feff → #0a2c42, sinking), chips `CHIP` (breach 3, shatter 5; #ffffff → #0a3c55), glitter `SOFT` 150/s rising, **snow** `SOFT` falling from above the crown.
5. **Floor decals** — FROST rime trail, rime under the crown (1.5 R), collars round each blade's foot (2.6 × its radius), creeping boundary rime, SHOCKWAVE rings (`effects/GroundDecals.js`).
6. **World** — pooled light, flash, shake.

## What the capture shows
- **f8 (0.27 s)** — the front is mid-flight: a frost-burst bubble around the caster's hands and a line of white rime patches stepping toward the target, a cyan glint where it will land. The path is visible before the crown exists.
- **f20 (0.67 s)** — the bloom: a white freezing-vapour dome over the circle, the blade wall already standing round its edge as a dense starburst, the white sheet with a bright boundary band; rime stepping-stones lead back to the caster.
- **f40 / f70 (1.3 / 2.3 s)** — the dome is gone; a full ring of pale, see-through blades 1–2.5 m tall, leaning out and crossing, open in the middle, standing on a white disc. Glints and veil keep it alive, but the silhouette itself is static through the hold (this cast's motion lives in its entry sweep, the falling snow and its plate-by-plate exit).

## Signature
**A wall you look into**: the middle is deliberately empty (`coreShare` 0) and the blades are near-empty glass carried by their edges — the opposite treatment to the Frost Lance, so two frost casts are told apart by material before silhouette.

## What makes it the bar
1. **Sweep-ordered eruption from the arrival bearing.** `delay = |angleDelta(bearing, entryAngle)|/π · sweepTime + stagger·dice` — the crown *closes* around both sides from where the front came in, rather than popping. The skirt follows with `skirtDelay + radial·skirtWave`. Reuse this for any ring cast (Pyre and Kraken copy it).
2. **Crystallise up, shatter by plates — per-instance thresholds in the shader.** `aGrow` (0 floor → 1 tip) discards everything above a noisy cut with a lit lip, so blades grow out of the floor; `aShatter` thresholds a per-fragment chunk id (half a voronoi cell in blade space, half a hash of the flat face normal), so a dying blade loses whole plates and wedges one at a time with flaring break edges. No geometry changes, no particles faking it.
3. **Prismatic glass from three fresnels.** The fresnel is evaluated three times at slightly different exponents driving R, G and B (`dispersion` 0.73) — a real chromatic fringe; light is *piped* along faces the axis runs along and climbs to the tip (`tipBias` 1.6, bands at 0.6/s); flow striations are ridged noise stretched along the blade's own axis; plus one equirect probe sample and a sun lobe so facets catch the room.
4. **Placement derived from the zone.** Every blade is seated as a fraction of `zoneRadius` (`ringSeat` 0.94, skirt 0.74 + 0.42 band), the sheet and the veil are ability-owned meshes (not decals, which capture their radius at spawn) — drag the radius and a standing crown re-scales with the clock paused.
5. **Ring silhouette from lean + fan, not a fence.** `ringLean` 0.33 rad outward plus `fan` ±1.16 rad off the radius makes neighbours cross into a starburst; `ringWave` 0.61 gives the uneven crest. At lean 0 it reads as a picket fence.
6. **Element-specific air motion.** Everything else in the project is thrown up; here snow falls *down* through the ring and mist sinks off the rim — the linger says "freezing" without any geometry changing.

## Palette
core #ffffff (edge/tip), tint #a8f4ff / #57f0ff, body #8ee8ff / #a7e6ff, deep #0e4a66 / #0a2c42

## Gameplay
Zone cast; hits from the circle via `DummyField`. Cooldown 1.6 s.
