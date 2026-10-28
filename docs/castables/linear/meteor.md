# Cinder Fall — `linear/meteor`  ★ reference (§1)
Fire · line (lob) · range 3–20 m (capture: 14.9 m) · no zone · ≈ 4.5 s on screen (0.72 flight + 2.2 crater burns + 1.6 clear), scorch 8 s

## Read in one line
A cratered, lava-seamed boulder 1.6 m across leaves the caster's hand trailing a raymarched fire plume, lobs 2.6 m high downrange while its seams split wider and whiter, and slams into the floor — a fireball, a shockwave, a burst of its own glowing chunks, and a star of real molten fissures with basalt lips torn 5 m across the ground that cool after the debris has gone out.

## Beats
| t (s) | Beat | On screen (shape, size in m, colour, motion) |
|-------|------|----------------------------------------------|
| 0.00 | Anticipation | `cast1` throw; cast flash 0.08 #ff9a2e (muzzle flare off by default, `muzzleSize` 0). The rock leaves the **hand** (1.35 m up, 0.6 m forward, 0.2 m to the side), already visible — the anticipation *is* the rock you watch coming. |
| 0.00–0.72 | Travel | Rock r 0.8 m tumbling 3.4 rad/s, flying at 21 m/s on `arc` 2.6 m (`y += arc·sin(πt)^arcCurve`, arcCurve 0.85 flattens the top). `uCharge = u^chargeCurve` (1.6) — seams stay thin (0.045) for most of the flight and open to double width and white-hot only over the last third. Leading facets glow white (compression heat), trailing side dark. Behind it a 7 m black-body fire trail (tube r 0.66 m, head 1.8×), embers 180/s rising 1.5 m/s, sparks 110/s, smoke 70/s; `rumble` 0.04. |
| 0.72 | Impact | One frame: fireball (`BurstMode.FIRE`, 3.6 m, turbulence 2) + a faster inner flash shell; 6 m shockwave ring #ff9a2e/#fff3d0; **fissures** spawn (6 arms racing out at 9 m/s to 5.2 m); 2.8 m scorch #0d0907; 18 chunks (r 0.22 m) thrown at 7.5 m/s, 55 % biased downrange; 260 embers, 180 sparks, 90 grit, 70 smoke; shake 1.0 for 1.1 s; flash 0.3 #ff9a2e; light #ff8a3c 16 → boosted. |
| 0.72–2.92 | Linger | `lifetime` 2.2 s: chunks fly ballistically (gravity −17, spin 6 rad/s), land and **cool** — their seams dim over `chunkCool` 2.6 s; fissures pulse heat waves outward (`fissurePulse` 1.0) with a white core and wide orange underglow; smoke column rises; the trail burns out over `trailBurnout` 1.2 s. |
| 2.92–4.52 | Exit | `fadeTime` 1.6 s: chunks lie 0.5 s then sink 1.0 s into the floor; light gutters out. Fissures close at 6.5 s, scorch stays to 8 s — **the floor outlives the spell**. |

## Layers
1. **Rock** — `createAsteroidGeometry` (icosphere ×3 subdivisions, lumpiness 0.26, 9 planar cuts 0.28 R deep, 5 craters) on an `InstancedMesh` with `materials/MeteorMaterial.js` (patched `MeshStandardMaterial`, `LAYER.WORLD`, shadows). Rock #6e675f, char #17130f, crack #ff6a12, hot #fff3d0.
2. **Fire trail** — camera-facing proxy hull along the arc, raymarched black-body volume `materials/VolumetricFireMaterial.js` (35 steps, 5 octaves, Planck temps 1920 K core / 1590 K edge, palette blend 0.62 to #ffb02e / #ff3d10 / smoke #181616).
3. **Debris chunks** — same geometry/material, per-instance `aHeat` cooling, closed-form ballistic positions.
4. **Fissures** — `effects/GroundFissures.js`: real ribbon geometry in a unit disc × `uRadius`, drawn twice (narrow white-hot core + wide additive underglow) with up to 44 instanced basalt lumps (0.3 m) heaved along the lips.
5. **Particles** — embers `SOFT` (#fff3d0 → #ff9a2e → #ff3b0d → #2b0d05), sparks `STREAK` (#fffdf2 → #3d1103), smoke `SMOKE` (#6b503f → #141010), grit `CHIP`.
6. **Floor & world** — SCORCH + SHOCKWAVE decals (`effects/GroundDecals.js`), FIRE bursts (`effects/BurstSphere.js`), shake, flash, pooled light with 0.25 flicker at 13 Hz.

## What the capture shows
- **f8 (0.27 s)** — rock high over the line, faceted dark stone with glowing seams, a tall orange-to-white plume streaming behind it. Already reads as "burning rock incoming".
- **f20 (0.67 s)** — one frame before impact: the rock is near the floor, seams white, the plume now standing *up* off it like a torch — the read of "something heavy is about to land".
- **f40 (1.33 s)** — the fireball shell has torn into big yellow-orange facets 4–5 m tall around a white core; under it an orange star of fissures and a pale shockwave ring 6 m across; glowing chunks scattered.
- **f70 (2.33 s)** — everything in the air is gone; what remains is the **floor answer**: a dozen orange fissure arms with dark basalt lumps along them and ember-lit chunks lying around — readable from 15 m.
- **Dense pass (f4–f90)** — f4–f16: the rock is visible from the first frames high over the line, plume trailing; f24 (0.80 s): the impact frame — a white-hot ball of light on the floor with a thin shockwave ring (impact lands ≈ 0.75 s, matching 14.9 m ÷ 21 m/s); f34 (1.13 s): the faceted yellow fireball shell ≈ 5 m tall; f48–f90 (1.6–3.0 s): only the floor answers — the orange fissure star with basalt lips and cooling chunks, still bright at 3 s.

## Signature
**You watch it arrive**: heat is a function of flight progress (`u^chargeCurve`), so the explosion lands on a rock that has visibly been heating for 0.7 s — and the ground tears open in real geometry rather than a decal.

## What makes it the bar
1. **Anticipation by charge, not by a wind-up.** `uCharge = pow(u, chargeCurve)` widens and whitens the seams (`crackWidth` doubles at full charge) as the rock closes. Copy: drive your hero's emissive from *progress toward impact* with a late-biased power curve (1.4–1.8), so the impact frame is the brightest frame of a build the player already saw.
2. **Seams welded to the body.** Cracks are the zero crossing of fbm — `1 − smoothstep(0, width, abs(fbm(p)))` — sampled in **local** space so they tumble with the rock, with soot darkening either side and a facet-tint break-up so the stone reads as stone. Use local space for anything that moves; world space (as the Frost Lance does) only for things that should look quarried from one block.
3. **Fissures are geometry, baked in a unit disc.** `GroundFissures` generates meandering arms with lightning-style branches once into unit space; the vertex shader multiplies by `uRadius`, so reach, width, branch density and heat are live uniforms. Two passes (thin hot core + wide additive underglow) plus instanced basalt lips give relief. This is the template for any "the floor tears open" beat.
4. **Closed-form ballistics.** `_chunkFlight` computes the landing time as the positive root of `½g·t² + vy·t + (y0 − rest) = 0`, clamps `t = min(elapsed, landing)` and places the chunk at `impact + dir·speed·t`, `y = max(rest, y0 + vy·t + ½g·t²)`; spin angle is `spin · chunkSpin · t`. Never integrated — so dragging `chunkSpeed` re-throws debris that has already landed, and a landed chunk stops exactly on the floor.
5. **The floor outlives the spell.** Fissures 6.5 s and scorch 8 s vs a 4.5 s cast: the impact leaves a scar, and chunks *cool* (`aHeat` 1 → 0 over 2.6 s) instead of fading.
6. **Volumetric trail on a proxy.** A cheap camera-facing hull laid along the analytic arc hosts a raymarched black-body volume; the hull's centre line is sampled from the trajectory each frame, so it is never a recorded history.

## Palette
core #fff3d0, tint #ffb02e / #ff9a2e, body #ff6a12 / #ff3d10, deep #17130f / #0d0907

## Gameplay
Line cast; `DummyField` hits from the published line at impact. Cooldown 0.9 s.
