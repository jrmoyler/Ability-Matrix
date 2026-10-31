# Perigee Halo — `codex/perigee`
Gravity · zone · range 2–18 m · zone radius 4.2 m · ≈3.1 s on screen at 13 m (≈0.85 s throw + 1.05 s impact + 1.25 s fade)

## Read in one line
A ring of fused lead-and-basalt blocks is thrown from the hand, opens to the size of the circle and falls onto it tilted, its low side slamming into the rim. It then settles like a spun coin: the contact point walks round the rim faster and faster, grinding sparks and cutting a spiral groove into a dark pressed well, while the ring tightens. It falls flat with a slam and sinks into the well.

## Beats
| t (s) | Beat | On screen |
|---|---|---|
| 0.00–0.85 | Anticipation / travel | The ring leaves the hand at 0.12 × full size, tilted 0.8 rad and spinning at 9 rad/s. It arcs (up to 1 m extra height, top held under 4.2 m) toward the circle and opens to 3.7 m radius as it goes. Its low side swings round to face the landing. Stone is dark brown (#120b07 → #5a4130), lit by the sun, and casts a shadow on the floor. |
| ≈0.85 | Impact | The ring lands tilted 0.42 rad, its low side on the rim. A crack decal and a spray of chips and dust come off the contact point. The template beat follows (shake, light punch, a small dust shell, the residue stain). Hits land here, as before. |
| 0.85–2.15 | Linger: the walk | Euler-disk settle. The tilt falls as √(1−k) and the contact precesses at 3.4 rad/s ÷ √(tilt), up to 13 rad/s, for about 200–300° in total. The ring tightens by 22 %. The underside burns amber (#e0782e) to white (#fff1dc) at the contact, and the burn trails about 1 rad behind it. Sparks, grit and chips are thrown off along the walk, and a scorch is cut every 0.42 rad (a spiral groove). Felled bodies are dragged inward. |
| 0.85–3.1 | Linger: the well | A filled bowl (1.15 × the ring) presses in within 0.25 s. It is lit as a dent: #070403 at the bottom, #3c2a1c at the lip, with grit drawn inward on a slow spiral. The groove under the contact glows hot and cools behind it. |
| ≈2.15 | Commit | The tilt reaches 0 on the aftershock: the ring slams flat, with a 70-puff dust roll out from under its rim, a camera punch and a light punch. |
| 2.15–3.1 | Exit | The ring sinks 1.6 × its depth into the well. It is eaten through, top-down and through the grain, behind a hot edge. The well lets go over 0.6 s. The groove scorches and the residue stain stay. |

## Layers
1. Halo (hero): `createHaloGeometry` / `shapeHalo` in `PerigeeHaloAbility.js`. A closed band of 13 fused blocks, 0.78 × 0.5 m in section, pinched at the seams and lumped. Material: `createPerigeeHaloRingMaterial` (ShaderMaterial; sun key + sky + specular, ochre seams, a friction burn that trails the contact, dissolve). It is on `LAYER.SHAPED` and casts shadows.
2. Well: `createPerigeeHaloWellMaterial`, a filled bowl shader with a fake-normal dent, a spiral grit pull and the hot groove.
3. Groove: SCORCH decals cut along the contact path, plus a CRACK decal at the landing.
4. Particles: grind sparks (STREAK), grit (SMOKE), chips (CHIP), and the landing and flat-slam dust rolls.
5. World: shake, flash (0.05) and light punch on the beat; a second punch on the flat slam. Template residue stain.

Turned down in the config: body sheet, voice crown, lens, the shared rig, detail pieces, the template field and the shock ring (the old white orbit rings and beads). The streak particles are now STREAK instead of RING.

## Signature
A heavy ring that you watch settle: it lands on its edge and walks round the rim like a spun coin, grinding a groove until it falls flat and sinks.

## Palette
core #fff1dc · tint #e0782e · body #5a4130 / #a87a57 rim · deep #120b07 / #070403 well

## Gameplay
Unchanged. `handlesOwnHits`: everything within max(zoneRadius, hitRadius) is taken once on the beat and dragged inward. The throw, the walk and the well are presentation only.
