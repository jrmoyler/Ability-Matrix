# Electrical Sphere — `linear-ext/electrical`
Lightning (orange plasma) · zone (far cast) · range 0–18 m (capture: 12.6 m) · zone radius 4.5 m · ≈ 5.2 s on screen (0.21 front + 0.35 bloom + 3.6 hover + 0.55 collapse + 0.45 blink-out)

## Read in one line
A line of current whips out to the target, a ringed orange containment platform blooms on the floor and a polished black 1.4 m-radius sphere rises to hover 2 m up, rimmed in orange Fresnel fire with discharge crawling over its skin and a corona of ~35 arcs tearing off it, until it collapses inward and vanishes.

## Beats
| t (s) | Beat | On screen |
|-------|------|-----------|
| 0.00–0.21 | Anticipation + travel | Front races at 60 m/s from the hand (1.28 m); sparks 240/s shed off it, scorch burns 1.4 per metre (r 0.7 m). |
| 0.21–0.56 | Impact (bloom) | `snapTime` 0.35 s: platform blooms to 4.5 m; the sphere rises out of the middle to `hoverHeight` 2.0 m; burst of 200 sparks + 80 embers, inner scorch r 3 m. |
| 0.56–4.16 | Linger | Sphere hovers (±0.06 m at 0.5 Hz). Skin: near-black #0d0b0c / #030203 shell with a hard key glint, discharge net (white-hot #fffbf0 filaments with #ff8614 bleed) re-striking 5×/s, Fresnel rim #ff1503 and wide halo #ff3a0a. Corona: 35 instanced ribbon bolts from random points on the surface (1.01 R) to points ≈ 2.7 m out, re-struck 16×/s, each lit 62 % of its cycle. Platform: 8 concentric rings, hot inner band, hex grain, outward pulse rings. A `pulse()` envelope at 8 Hz is *added* to every material's `uPulse` and *multiplied* into emitter rates (×3.15 on a beat) — the whole thing breathes, but nothing scales. |
| 4.16–4.71 | Exit (collapse) | `collapseTime` 0.55 s: the sphere collapses inward. |
| 4.71–5.16 | Exit | `fadeTime` 0.45 s: meshes blink out; scorches stay 4.5–7 s. |

## Layers
1. **Sphere body** — `materials/ElectricalSphereMaterial.js#createSphereBodyMaterial`: opaque, writes depth, Fresnel-weighted reflection (`reflectivity` 0.55, power 2.6), specular 3.4 at sharpness 220, plasma under the skin (#ff7a20), discharge net, rim/halo.
2. **Platform** — `createPlatformMaterial` (same file): rings #ff8c25, inner #ff661a, hex #ff8024, deep #150503, opacity 0.85.
3. **Corona arcs** — `materials/RadialBoltMaterial.js`, instanced ribbon, core #fff4d6 → #ffb24a → #ff6a18 → halo #ff3a0c, 4-octave kinks 0.16 m.
4. **Particles** — sparks (`STREAK`), motes, embers, smoke; continuous "field" emission off the standing sphere (380 sparks/s).
5. **Floor** — scorch decals #0a0302 with #ff3a0a embers.
6. **Light** — orange pooled light.

## What the capture shows
- **f8 (0.27 s)** — a burst of white-gold lightning strands erupting at the target over a small white-hot ring, a line of red scorch dots back to the caster; the struck dummy is tagged `charged`.
- **f20 (0.67 s)** — the sphere is up and hovering: at this distance it reads as a **red-orange ball laced with bright crack-like discharge** (the Fresnel rim and surface net dominate the black shell), arcs flicking off its top; under it a glowing red-orange platform of concentric rings and a wide pale shockwave ring; one dummy flung.
- **f40 / f70 (1.3 / 2.3 s)** — steady state: ball, corona arcs re-striking in new places each frame, 6–8 platform rings. Silhouette is a fixed sphere; motion lives in the arcs and the 8 Hz pulse.

## Signature
A **black mirror ball, lit only at its limb**: the energy is *on* the silhouette (Fresnel) and *leaving* it (arcs rooted on the surface at the hovering centre), never a glowing blob.

## Palette
core #fff7d6, tint #ffd166, body #ff7a20, deep #030203 (shell) / #150503 (platform)

## Gameplay
Zone cast; hits from the circle via `DummyField`. Cooldown 2 s.
