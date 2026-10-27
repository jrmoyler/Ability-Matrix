# Cyber Serpent — `linear-extended/cyber`
Tech · line · range 3.5–26 m (capture: 19.3 m) · no zone · ≈ 2.5 s on screen (0.88 flight + 0.75 shatter + 0.85 fade)

## Read in one line
A 5 m holographic wireframe serpent assembles behind its nose at the caster's hand and swims down the line 1.85 m above the floor, wound in neon helices and trailing lagged ghost copies, lighting a circuit board on the floor as it passes, then shatters into fragments at the target.

## Beats
| t (s) | Beat | On screen |
|-------|------|-----------|
| 0.00–0.22 | Anticipation | Cast flash 0.18; the body assembles behind the nose over `formTime` 0.22 s at 1.35 m. |
| 0.00–0.88 | Travel | Flies at 22 m/s at 1.85 m (bob 0.9 Hz); the spine sways 0.14 × body length over 1.6 wavelengths at 1.6 strokes/s; scan bands (34 over the length) run along the wire #35d5ff with hot #ffffff head (front 14 %); inner energy #7fd4ff → #1050e0; helix ribbons 9 m long, 0.85 m off the axis (#ffffff/#4fe0ff/#0f47d8); ghost copies lag 0.16 × body length, eroding to vapour (#3fb8ff); the rune board under the line lights as the nose passes (#0d3f66 → live #5fe6ff → hot #e8feff). |
| 0.88 | Impact | Fragments thrown 0.4 × body length; 4.2 m shockwave, arc burn r 3.4, flash 0.35, shake 0.32; a ring crosses the rune board at 14 m/s. |
| 0.88–1.63 | Linger | `shatterTime` 0.75 s of shattering; sparks, motes, wake. |
| 1.63–2.48 | Exit | `fadeTime` 0.85 s; debris goes out. |

## Layers
1. **Construct wireframe** — `public/models/snake.glb` (the only loaded asset in the three packs; its material/texture are discarded), redrawn by `materials/CyberSerpentMaterial.js` whose vertex stage rebuilds a frame from an analytic spine every frame.
2. **Inner energy** — the same mesh barely inflated (0.006 × length), brightest along long view-ray paths.
3. **Ribbons** — `materials/NeonTrailMaterial.js`, one instanced draw of helices.
4. **Ghost wake** — N lagged copies + mist particles.
5. **Rune board** — `materials/CircuitFieldMaterial.js`, routed circuit on the floor.
6. **Distortion** — a `SerpentPass.WARP` pass of the same mesh on `LAYER.DISTORTION`.

## Signature
A **swimming construct** whose body bends from an analytic spine in the vertex shader, with a floor that lights only where the nose has passed.

## Palette
core #ffffff, tint #7fd4ff, body #35d5ff, deep #0b3f7a / #06214d

## Gameplay
Line cast via `DummyField`. Cooldown 1.5 s. Uses a loaded mesh for the silhouette, unlike every other original.
