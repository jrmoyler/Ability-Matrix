# Heartstake — `codex/heartstake`
Blood · line · range 2–18 m · no zone (stain 2.4 m, roots 5.2 m, thorns ≈4.7 m) · ≈3.3 s on screen (≈0.5 travel at 32 m/s + 1.6 heartbeats + 1.6 withering, eased out by 3.3 s)

## Read in one line
A barbed blood-glass javelin flies the line, swells into a 5.6 m spike as it dives, and plants itself in the target. A heart the size of a torso beats three times, and with each beat a thicket of barbed garnet thorn-arches heaves further out of a dark blood pool. Then everything dries brown-black and crumbles away.

## Beats
| t (s) | Beat | On screen |
|---|---|---|
| 0.00–0.20 | Anticipation | 60 droplets are drawn 1.1 m into the hand; the stake sets there at half size (`flightScale` 0.5, outBack). |
| ≈0.05–0.5 | Travel | A 2.8 m faceted garnet spike cruises at 2 m with a pulsing heart. A streaky blood ribbon (0.8 m wide, 4.5 m long) and droplets trail behind it, and bodies on the line are run through. Over the last 5 m it pitches down and swells to full size (5.6 m long, 0.36 m shaft, heart radius ≈0.8 m). |
| ≈0.5 | Impact | It drives in 1.1 m: a 2.2 m red WATER splash dome, a deep-red 5 m shockwave, a crown of 160 drops, mist, flash, knock 0.5 and a light punch. Bodies within 2.2 m are thrown clear. Nine thorn roots break the floor at 30 % of their reach. |
| ≈0.7–2.1 | Linger | Three heartbeats, 0.42 s apart. Each one swells the heart, runs a surge of light up the shaft, jets blood, thumps the air (distortion ring) and sends a pressure ring out along the capillaries. On each beat the thorns heave out another step (outBack, 0.24 s), up to 4.7 m long and 1.5 m high, swelling and lighting as the pressure front passes along them. The stain soaks out to 2.4 m and the roots knock bodies down and bleed them pale. |
| ≈2.1–3.3 | Exit | The stake and thorns dry from wet garnet to brown-black #2b1410. The stake crumbles point-first and the thorns tips-first, along a hot fraying edge that sheds lit flakes. The stain dries matte and erodes away. |

## Layers
1. Stake: `createStakeMaterial`, a parameter-space lathe (barbs, fins, lobed heart) on `LAYER.SHAPED`, faceted, sun-lit garnet glass with inner veins.
2. Thorn roots: `createThornGeometry` (16 tubes × 40 rings) + `createThornMaterial`, on `LAYER.SHAPED`. Barbed arches bent in the vertex stage, grown per beat, pulsed by the beat front, crumbled tips-first.
3. Heart bloom: an additive billboard, 1.7 m.
4. Trail: a camera-facing streaky ribbon.
5. Stain and capillaries: a ground quad with a fingered wet edge, radial roots, a pressure ring and wet glint; it dries and erodes.
6. Pulse warp: a `LAYER.DISTORTION` ring per beat.
7. Particles: DROPLET, SOFT spray, SMOKE mist, lit CHIP flakes.
8. World: a WATER burst, SHOCKWAVE per plunge and per beat, flash, shake and light.

## Signature
The heart keeps beating after it lands, and each beat roots it deeper: the thicket of thorns grows in steps you can count.

## Palette
core #ff9aa8 (bloom) / #ff3b4e hot, tint #ff4a5e rim, body #5c0714 / thorns #4a0610, deep #0e0103 (dry #2b1410)

## Gameplay
`handlesOwnHits` is unchanged. It pierces along the line (`hitWidth` 0.9), throws within `impactRadius` 2.2 at the plunge, and on each beat knocks down and drags in everything within the growing root reach. Bled bodies pale out and drip. Bounded by `MAX_BLED` = 12.
