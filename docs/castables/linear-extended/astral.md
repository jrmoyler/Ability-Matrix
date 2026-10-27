# Astral Void Blast — `linear-extended/astral`  ★ reference (§1)
Cosmic · zone · range 0–24 m (capture: 16.8 m) · zone radius 5.5 m · ≈ 6.9 s on screen (0.25 seed + 4.6 stand incl. 0.43 inflate-and-pinch + 2.0 close)

## Read in one line
A pinprick of collapsed space flies to the circle bending the frame around it, swells into a black disc with a blazing gold photon ring hanging 3.4 m up, then violently pinches — and the collapse *is* the blast: a gold-and-violet galaxy of gas erupts and winds into spiral arms, a violet shockwave rips 17 m across the floor, void shards are thrown and caught in orbit, and everything in the circle is lifted, wound in and swallowed, until the hole closes on itself with a white pop.

## Beats
| t (s) | Beat | On screen (shape, size in m, colour, motion) |
|-------|------|----------------------------------------------|
| 0.00–0.25 | Anticipation + travel | The seed (0.16 × core radius) runs at 68 m/s from the hand (1.15 m), already lensing the frame; `rumble` 0.05. |
| 0.25–0.59 | Anticipation 2 (implosion) | Lands at 3.4 m height and **inflates** over `coreSwell` 0.34 s (outQuad) to 2.1 × 1.05 m; 220 stars rush *inward*; shake 0.16. The world is pulled in before it is pushed out. |
| 0.59–0.68 | Impact (pinch → blast) | Collapse over `corePinch` 0.16 s (inCubic); the blast fires at 55 % of the pinch: 900 stars, 220 gold embers, 130 chips, 70 dust thrown; shake 0.75 (0.55 s); flash 0.28 #c9a2ff; the shockwave ring starts out across the floor at 11 m/s to 17 m. |
| 0.59–1.09 | Impact (bloom) | Nebula reaches full size (8.5 m) over `burstTime` 0.5 s. |
| 0.68–4.85 | Linger (feed) | The `_churn` envelope (rate 1.6) brightens disc, thickens gas, pulses the ring, speeds ejecta; when it crosses `flareThreshold` 0.66 the hole **feeds** (a throw of ejecta, knock 0.03, punch of light). 620 micro-stars/s are born on a shell 1.15 × R and spiral in over 1.5 s (97 % of the orbit collapsing); void shards orbit, tumbling, going incandescent near the hole; gold embers torn off the disc. Bodies within reach are knocked *inward* (impulse 3, lift 2.6, spin 1), carried off the floor (buoyancy), wound in tumbling and stretched (pull sampled per joint, 7.5 m/s at the middle, half strength at 0.6 R, wind-up 0.45 s), and consumed inside 2.4 × the horizon, each with 70 embers + 90 stars and a flare. Hold rumble 0.06. |
| 4.85–6.85 | Exit | `fadeTime` 2.0 s: the hole closes on itself and takes the light with it — collapse flash 0.45 **#ffffff**, shake 0.35; scorch r 5.2 m (#100b18 / ember #2a1a44) remains. |

## Layers
1. **Singularity** — `materials/SingularityMaterial.js`: camera-facing quad (a Schwarzschild shadow is round from every direction — the billboard is the *correct* primitive): pure black premultiplied shadow that removes the frame, a hard thin photon ring (#ffe9b8, 0.042 horizon radii) with one Doppler-beamed side, a halo of filaments wound at `uWind / r` (#c98cff → #3a1c72).
2. **Event-horizon lens** — same file, on `LAYER.DISTORTION`: bends the *whole finished frame* (deflection 0.45 × the hole radius at the ring), this ability's own layers included.
3. **Nebula** — `materials/AstralNebulaMaterial.js`: raymarched, depth-clipped, oblate (`uFlatten`), differentially sheared (`uWind / r`), arm-gated by a cosine on bearing in the rotating frame (→ logarithmic spirals for free); edge #2e1558, body #8b46f0, hot #ffb03a, throat #fff3d0.
4. **Ejecta** — micro-stars (#ffffff → #ffd9a0 → #b070ff → #2a1050), instanced void shards (`materials/VoidShardMaterial.js`: body #0a0714, facet #221838, rim #b98cff, vein #ffb54a, hot #fff0cf), embers, chips, dust.
5. **Shockwave** — `materials/CosmicShockMaterial.js`: planar ring on the floor 0.03 m up, 0.95 m wave packet, crest of displaced air, plus a refraction push (warp packet 1.2 m); #ffeccb / #a76bff / #2a1250.
6. **World** — light #b98cff (r 22) that *feeds* rather than flickers; scorch.

## What the capture shows
_(filled from the dense pass, `docs/castables/sheets/linear-extended__astral-sheet.jpg`)_

## Signature
**Implosion then release**: the frame is pulled in (inflate, inward star rush) before it is pushed out (pinch → blast), and the lens bends the finished frame including the effect itself.

## What makes it the bar
1. **Anticipation as a reversed impulse.** `swell = outQuad(t/coreSwell)` to 2.1×, then `pinch = inCubic((t − coreSwell)/corePinch)`; the blast fires once `t ≥ coreSwell + 0.55·corePinch`. Inward particles during the swell, outward during the blast. Copy: the most readable impact is preceded by its opposite.
2. **Physically-motivated primitives.** The black hole is a billboard *because* its shadow is round from every angle (no tessellated limb), premultiplied black so it subtracts light, a few-pixel photon ring with a Doppler-bright side, filaments wound at `1/r`. Pick the primitive the physics implies.
3. **A galaxy, not fog.** Oblate density (divide height before radius), differential rotation `uWind / r`, and arms from `pow(cos(bearing_rot), k)` in the rotating frame — spirals emerge from the shear instead of being painted. Raymarch with an analytic bound, early-out at opacity and a live step count.
4. **One envelope with a threshold event.** `_churn` gains everything; crossings of `flareThreshold` on the way up fire discrete "feed" events (ejecta, knock, light punch) — continuous motion punctuated by beats.
5. **Distortion that includes itself.** The lens samples the finished frame on `LAYER.DISTORTION`, so the nebula, ring and shards are lensed too — the strongest single "world answers" layer in the set.
6. **Bodies tell the story.** Taken (buoyancy lifts them off the floor so the solver can't scrub the slide) → wound (per-joint pull stretches them, tumbling faster near the centre) → consumed inside the horizon with a flare. Order matters or it reads as "a light with a suction sound".

## Palette
core #fff3d0 / #ffe9b8, tint #ffb03a (gold) / #c98cff, body #8b46f0 / #a76bff, deep #2e1558 / #0a0714

## Gameplay
`handlesOwnHits`: knock inward (3 / lift 2.6 / spin 1), carry, wind in, consume within 2.4 × horizon. Cooldown 4 s.
