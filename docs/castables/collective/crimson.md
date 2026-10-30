# Crimson Rite — `collective/crimson`
Blood · zone · range 2–16 m · zone r 3.2 m · ≈4.3 s on screen (≈0.3 s travel + 2.2 s rite + 1.6 s sink, × `global.lifetime`)

## Read in one line
A comet of blood is flung from the caster's hand on a lob, trailing an arc of blood that stays strung to the circle; where it lands a blood moon rises and pours red light down, a heptagram is drawn in a filling pool of glowing blood, and a crown of blood spikes erupts in waves and throbs with a heartbeat before it sinks and dries to a stain.

## Beats
| t (s) | Beat | On screen |
|---|---|---|
| 0.00–0.30 | Anticipation + travel | The seal swells out of the hand (0.08 s) — a lathed comet of glossy blood, head 0.3 m, tail 1.6 m whipping — and arcs 1.1 m high to the circle at 30 m/s; behind it the arc of blood (a 0.6 m camera-facing ribbon on the same lob: deep clot body, red rim, hot core) is drawn from the hand; droplets and embers shed. |
| 0.30 | Impact (the seal lands) | Seal spent; droplet splash, RIPPLE decal, knock. The arc stays strung hand→circle and drains into the circle over 0.7 s. |
| 0.30–1.05 | The rite is drawn | Pool wells up at once and fills the whole circle in 0.45 s — wet, dark (#6e0610 → #250104) with crawling veins of saturated red light; rings sweep on, the heptagram is traced stroke by stroke, runes light; the blood moon (r 1.5 m, 4.2 m beyond, shaded as a sphere with a dark night side) rises 2.4 m in 0.8 s; a shaft of red moonlight drops onto the circle with embers drawn up it. |
| 1.05 | Impact (the eruption) | First wave of 46 spikes (3 waves 0.16 s apart, centre first, 2 m tall, overshoot 22 %): WATER burst to 2.6 m, SHOCKWAVE, flash, shake, light punch, moon flare; bodies in the circle impaled — thrown up 7.5 m/s. |
| 1.3–2.5 | Linger (the heartbeat) | Every 0.55 s: the spikes swell 20 %, a surge of light climbs every spike from the pool, a swell runs out across the pool, the moon and beam throb. Tips drip, mist hangs low, embers lift off the runes. |
| 2.5–4.1 | Exit | Spikes sink back in; the circle burns out; the moon sets; the pool dries to a matte stain with a tide line, handed to a SCORCH decal that stays 7 s. |

## Layers
1. Seal — `createBloodSealGeometry` (lathe: hemisphere head, neck, rippled taper) + `createCrimsonSealMaterial` (opaque, lit gloss, deep→body ramp, red rim, hot core), `CrimsonRiteGeometry.js` / `CrimsonRiteMaterials.js`.
2. Arc of blood — `PlaneGeometry` strip placed along the lob in the vertex stage (`RIBBON_VERTEX`), `createCrimsonArcMaterial` (premultiplied: clot body occludes, rim and core add).
3. Blood moon — camera-facing quad shading a cratered sphere analytically, terminator, rim, halo, beat throb.
4. Moonbeam — same ribbon vertex stage, straight, `createCrimsonBeamMaterial` (additive streaks of red light).
5. Ritual circle — SDF rings, heptagram, runes, drawn on (additive).
6. Blood pool — fingered, splattered, wet shading off the sun + sky, glowing veins, heartbeat swell, dries to a stain (normal blend).
7. Spikes — 3 instanced procedural silhouettes, opaque on `LAYER.WORLD`, cast shadows; veins, drips, rim, base glow, heartbeat surge.
8. Particles — `crimson.drops` DROPLET (seal trail, breach, drips, gouts), `crimson.mist` SMOKE, `crimson.embers` SOFT (seal glow, runes, beam).
9. Bursts/decals — RIPPLE on landing, WATER burst + SHOCKWAVE on eruption, SCORCH stain.

## Signature
Blood thrown in an arc that stays strung to the rite, a moon that pours light onto it, and a crown of spikes with a pulse.

## Palette
core #ff6a6a / #ffe2dc, tint #ff2a3a, body #c3101e / #8a0a18, deep #250104 / #1a0204

## Gameplay
`handlesOwnHits`: from `eruptDelay` (0.75 s after landing) until the spikes start to sink, every body within `zoneRadius × killReach` is killed and thrown up (`killImpulse` 3, `killLift` 7.5). Unchanged by the 2026 upgrade.
