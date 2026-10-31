# Press Cage — `codex/presscage`
Motion · zone · range 2–18 m · zone radius 4.45 m · ≈2.8 s on screen at 13 m (≈0.42 s volley + 1.15 s impact + 1.25 s fade)

## Read in one line
Eight forged-steel press bars are hurled from the hand and plant in a ring around the targets. They skid inward with gathering momentum, ploughing glowing gouges as their platens heat red. When they meet, a billet of crushed matter is spat straight up on a jet of chips and sparks, the bars recoil and topple flat outward, and the billet falls back.

## Beats
| t (s) | Beat | On screen |
|---|---|---|
| 0.00–0.42 | Anticipation / travel | 8 bars (0.6 × 2.5 × 0.42 m) leave the hand staggered, fanned 2.4 m wide, lying nose-first along their flight on a 1.6 m arc, with motion streaks behind them. Over the last half of the flight they swing upright. |
| ≈0.42 | Impact | They plant on a ring at 0.95 × the circle and dip 0.22 m into the floor. A scorch is left under every shoe, with dust and chips. The template beat follows (shake, light punch, residue). A filled, scoured dark stain lands under the circle. |
| 0.6–1.67 | Linger: the squeeze | After a 0.18 s hold the bars skid inward, eased in with power 2.4 (momentum), to 0.3 × the ring, with their tops leaning into the push. Each ploughs a gouge whose fresh end glows red/white and cools behind it. Skid sparks and grit come off the shoes. The platens glow from oxide to red as the pressure builds, and a billet rises out of the floor between them. |
| ≈1.67 | The spit (echo beat; hits land here, as before) | The billet is spat straight up to 2.8 m on a jet of 70 chips and 90 sparks. A dust roll goes out, with a crack at the centre, a camera punch and a light punch. The bars recoil out (outBack) to 0.62 × the ring. |
| 1.67–2.3 | Linger: the fall | The bars topple outward over 0.42 s and slam flat with a bounce, a dust kick and a thud. The billet tumbles down and bounces at the centre. A crushed dark dent with hot cracks stays at the centre. Bodies are thrown up and carried outward. |
| 2.3–2.8 | Exit | The fallen bars and the billet are eaten through behind a hot edge and sink. The gouges, the crushed centre and the scorches stay until the floor lets go over 0.5 s. |

## Layers
1. Press bars (hero): `createRamGeometry` in `PressCageAbility.js`, instanced (max 12, plus the billet). It is a shaft on a wide shoe, with two collars, a bevelled cap and a broad ribbed platen on the inner face. Material: `createPressCageRamMaterial` (lit forged steel #0a0504 / #2c1612; a red #fa5438 platen that heats with pressure; shoe friction heat; dissolve). It is on `LAYER.SHAPED` and casts shadows.
2. Billet: the same mesh and material as the bars, squat (0.95 m), squeezed up, spat and tumbling.
3. Floor: `createPressCageSkidMaterial`. It fills the circle with a scoured stain, adds one gouge per bar from the ring to the deepest point reached (hot fresh end), and a crushed dent with cracks after the spit.
4. Decals: shoe scorches, centre crack, template residue.
5. Particles: flight streaks, skid sparks, dust, the chip and spark jet, and the fall dust.
6. World: shake and light on the slam, the spit and the fall.

Turned down in the config: body (the red slab bars and striped drum), voice, lens, rig, detail pieces, template field, shock ring and burst shell.

## Signature
A press you watch work: bars that arrive, close in under momentum, spit what they crushed straight up, and fall over.

## Palette
core #fff4ea · tint #ffc8a4 · body #fa5438 heat on #2c1612 steel · deep #0a0504 / #0b0403 floor

## Gameplay
Unchanged. The hits land once, on the echo at fade progress 1.08 (the spit), on everything within 1.15 × max(zoneRadius, hitRadius). The bodies are thrown up and carried outward.
