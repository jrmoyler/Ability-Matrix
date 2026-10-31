# Facet Volley — `codex/facetvolley`
Crystal · line · range 2–18 m · ≈2.8 s on screen (≈0.55 s travel at 24 m/s for a 13 m cast + 1.05 impact + 1.25 fade)

## Read in one line
Six dark amethyst seeds are thrown one after another on staggered arcs, spinning broadside; each turns point-first and plants exactly where its part strikes, cracking a dark bed into the floor, and a cluster of crystals bursts out round it; the row of clusters keeps growing and glinting, then cracks and sinks.

## Beats
| t (s) | Beat | On screen |
|---|---|---|
| 0.00–0.55 | Anticipation / travel | Hand flare. `count` (6) double-terminated seeds (1.2 m, dark violet, glowing tips) leave the hand one after another, each on a parabola to its part point (apex up to 2.2 m, lower for short throws), spinning broadside about the flight path (9 rad/s) so the camera sees their length; from 60 % of the flight each swings point-first. |
| on each landing | Impact (×6) | The seed buries 30 % of its length at its landing angle on the frame the template strikes part *i*: dark amethyst scorch bed (1.3 m) + crack (1.1 m), 14 chips, 8 dust puffs, shake 0.18, light +3. 0.04 s later five prisms burst out round it (outBack 0.22 s, 0.035 s stagger), fanned 0.75 rad, up to 1.9 m tall; clusters grow from ×0.5 at the caster's feet to ×1 at the end of the line. |
| ≈0.55 | Impact (end) | Template end beat: shake 0.5, light punch, dark frost residue. |
| 0.6–2.2 | Linger | Each cluster accretes 25 % more over 1.6 s; its tips cool from white through lilac to violet (0.7 s); a glint band climbs every crystal. |
| 2.2–2.8 | Exit | At fade 1.5 each cluster cracks (14 chips) and shrinks and sinks into the floor; the beds stay 4.5 s. |

## Layers
1. Seeds — `createFacetVolleySeedGeometry` (`assets/codex/FacetVolleySignatureGeometry.js`, six-sided double-terminated, `aHeat` tips), InstancedMesh ≤12.
2. Prisms — `createFacetVolleyPrismGeometry` (single-terminated, skewed point), InstancedMesh ≤84.
3. Crystal material — `createFacetVolleyCrystalMaterial`: MeshStandard dark amethyst #1d0e3a (rough 0.16, metal 0.35, flat facets) patched with ramped tip glow × per-instance freshness `aPlant`, climbing glint, pale fresnel; `LAYER.WORLD`, shadows. Opaque, not glassy.
4. Decals — SCORCH bed + CRACK per planting; template FROST residue at the end.
5. Particles — lit CHIP shards, SMOKE dust, a few streaks.
6. World — per-planting shake and light punch, end beat.
Off by default (sliders kept): template curtain body, lens, voice, strip field, pieces, rig, ribbon, scar, wake.

## Signature
Every hit is a planting: the seed you watched fly is the one standing in the floor, and a crystal cluster grows out of the spot it struck.

## Palette
core #ffffff, tint #f4e8ff, body #9268f3, deep #230a5c / crystal #1d0e3a / bed #140a26

## Gameplay
Unchanged: `handlesOwnHits`, `WHEN = 'part'` — part *i* strikes its point (`(i+0.5)/n` along the line, lane ±`sweep`) when `u ≥ (i+0.98)/n`; the seed's touchdown is timed to that strike. Blow `bolt`, glassed-over mark.
