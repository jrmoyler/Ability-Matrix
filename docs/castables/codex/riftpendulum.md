# Rift Pendulum — `codex/riftpendulum`
Void · line · range 2–18 m · speed 30 m/s · ≈2.9 s on screen (≈0.35 s throw + 1.25 s impact + 1.25 s fade)

## Read in one line
A dark crescent blade leaves the hand spinning and flies down the line. A spiked knot of void gathers over the target. On the beat the blade catches on a forged arm hung from the knot and swings across the line through the bodies, in front of a tall black tear that opens in the air behind it. The tear hangs open, then zips shut. The blade's swing dies away, and then it shatters.

## Beats
| t (s) | Beat | On screen |
|---|---|---|
| 0.00–0.35 | Anticipation / travel | The blade (1.8 m at first, growing to 4 m horn to horn, ≈1.5 m tall) spins in its own plane at 18 rad/s. It flies from the hand on a low arc to the bottom of the pendulum's arc over the target. A 0.42 m spiked knot (black, with a violet horizon) gathers 3.7 m above the target. |
| ≈0.35 | Impact | The blade catches on a 2.45 m arm hung from the knot, at the bottom of the arc, moving fast. A filled black tear 3.2 m tall and up to 2.1 m wide parts in 0.18 s, 0.35 m behind the blade. Its inside warms to deep violet toward a narrow violet seam, and a smoky dark-violet skirt round it gives it mass. A wound tears across the floor under it (3.2 m × 1.2 m). Template beat: shake, a small flash, a light punch and the residue stain. |
| 0.35–1.9 | Linger: swing | A damped swing across the line: ±0.95 rad, 1.15 s period, damping 0.45/s. The blade's belly passes about 0.35 m off the floor through the group. Each pass back through the bottom brings a camera tick, a light tick and dust thrown sideways. Sparks stream off the edge while it moves fast, and the edge glows hotter with speed. Motes are dragged into the tear. |
| 1.55–2.1 | Linger: zip | The tear zips shut from both ends to the middle over 0.55 s. The floor wound stays open. |
| 2.3–2.85 | Exit | The blade and arm shatter along voronoi cells, each with a white-hot bite. The knot collapses and the floor wound zips shut. The residue stain stays on the floor. |

## Layers
1. Blade (hero): `createPendulumBladeGeometry`, an extruded, bevelled crescent whose edge factor (spine 0 → cutting edge 1) the shader works out per fragment from the crescent outline. Material: `createRiftPendulumBladeMaterial`, lit void-iron on `LAYER.WORLD` with shadows. Sun diffuse, specular on the bevels broken up by hammered micro-relief, a violet fresnel, crawling rift veins, a hot edge driven by swing speed, and a voronoi shatter.
2. Arm: `createPendulumArmGeometry`, a forged lathe rod with a hanger, a mid collar and a socket collar. Same material, no hot edge.
3. Knot: a sphere carrier pushed into churning spikes in the vertex stage (`createRiftPendulumKnotMaterial`).
4. Tear: `createRiftPendulumTearMaterial`, a vesica slit (open / zip / jagged lip / draining streaks) that is opaque where open. The same shader, laid flat, is the floor wound.
5. Template residue stain and aftershock dust roll.
6. Particles: edge sparks, pass dust, motes drawn into the tear, hand flare.
7. World: shake, flash and light on the beat, plus a smaller tick on every pass.

Switched off in the config: body sheet, voice, lens, shared rig (the old grid pod-blade at the caster), detail pieces, ground haze strip, shock ring decal, trail ribbon and scar, wake decals (the return path laid them in a long dark arc across the floor).

## Signature
The pit-and-pendulum blade swinging across the line in front of a black tear in the world.

## Palette
core #efe8ff · tint #a898ff · body #4a2fd0 / lip #7a5cff · deep #06040e / tear #020107

## Gameplay
Unchanged. `handlesOwnHits`, hit timing `return`, blow `swing`. The blade, the tear and the passes are presentation only.
