# Orbit Pendulum — `codex/orbitpendulum`
Motion · line · range 2–18 m · hit reach 1.15 m at the far end (impact + fade) · ≈2.8 s on screen (≈0.3 travel + 1.25 impact + 1.25 fade)

## Read in one line
A studded forged bob whirls on a chain down the line. At the far end an anchor post punches out of the floor, and the bob swings round it faster and faster over a scored, glowing disc. Then the chain snaps, the bob flies on, bounces and rolls to a stop, and the post and bob sink away.

## Beats
| t (s) | Beat | On screen |
|---|---|---|
| 0.00–0.05 | Anticipation | Hand flare and sparks. |
| ≈0.0–0.3 | Travel | The bob (1.45 × 1.5 m body, 3 m over its studs; bronze-black, hot belt groove) whirls at 18 rad/s on a 1.4 m chain of 12 links round the front, 1.7 m up. |
| ≈0.3 | Plant | The template beat lands (chips, dust, faint ring, scorch). A 2.6 m anchor post punches up in 0.16 s (outBack); the chain pays out to the orbit radius, `hitRadius × orbitReach` = 3 m, so the sweep covers exactly what the blow hits. |
| 0.3–1.55 | Orbit | The bob makes 2.25 accelerating turns round the post on a plane tilted 0.3 rad, skimming the floor on the far side, while the chain sags. Under it a scored disc (3.9 m) opens: spiral gouges swept round and a hot wake trailing the bob. The phase is solved back from the release, so the bob always lets go on the near side, heading down the line. |
| ≈1.55 | Release | The orbit is tilted low on the near side (`orbitTilt` −0.25), and the release comes there, between the caster and the group. The chain snaps with sparks, a light punch and a thud. The bob is slung straight down the line at 10 m/s with 1.5 m/s of lift, through the group, and lands with a crack, a dust ring and chips. It bounces (0.32), then rolls on, slowing (friction 1.1), trailing dust and leaving scorch marks every 0.9 m. The broken chain drops and dangles from the hub, swinging. |
| 2.2–2.8 | Exit | From fade 1.55 the post and the bob sink; the bob cools; the disc erodes from the rim. |

## Layers
1. Bob: `createOrbitBobGeometry` (in the ability file), an oblate 12-faceted lathe with a raised split belt, 8 studs and an eye. `createOrbitForgedMaterial('bob')` is a MeshStandardMaterial (metal 0.82) with seam heat on a ramp and a fresnel rim. On `LAYER.WORLD`, casting shadows; it rolls without slipping.
2. Chain: an InstancedMesh of up to 24 links (`createOrbitLinkGeometry`), alternately twisted, sagging, then snapped and dangling.
3. Anchor: `createOrbitAnchorGeometry`, a spurred, banded post with a hot hub ring, stretched to `anchorHeight`.
4. Scored floor: `createOrbitFloorMaterial`, a filled dark disc with spiral gouges and a hot wake that follows the bob's direction of travel.
5. Decals and particles: landing crack, dust ring, roll scorches, residue scorch; lit chips, dust, release sparks.
Off by default: the template drum rig, body, voice, pieces, floor rings, trail and scar ribbon, wake decals and lens. The wake decals and lens drew the frame-wide ring line.

## Signature
A real mass on a real tether: it orbits the anchor exactly over the bodies it hits, and lets go heading away from the caster every time.

## Palette
core #fff0e6 (white-hot stud tips), tint #ff6436 (stud tips, narrow wake), rim #7a7570 (cold iron), deep #2a2624 iron / #0c0a0a floor, #3a322e scored stone. The bob is dark lit iron with heat only at the stud tips; the disc is a dark gouge with a narrow hot wake.

## Gameplay
Unchanged: `handlesOwnHits`, return hits at the far end every frame of impact and fade within 1.15 m, swing blow; bodies are smeared.
