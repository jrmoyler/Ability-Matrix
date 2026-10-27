# Venom Mimicry — `matrix-expansion/venom-mimicry`
Poison · zone · range 2–18 m · zone radius 3.2 m (contagion 5.5 m) · ≈ 4.0 s at 8 m

## Read in one line
A venom seed is spat into the circle, a hooded serpent with false eyes on its hood rears out of the pool and bites the nearest enemy; venom threads leap from carrier to neighbour, a smaller copy of the serpent rises at each one and weaves exactly as the first does, a beat late — then every serpent strikes its carrier at once and sinks.

## Beats
| t (s) | Beat | On screen (shape, size in m, colour, motion) |
|---|---|---|
| 0.00–0.16 | Anticipation | A ridged teardrop seed (0.34 m, venom green with a white-hot swirl and violet-black depths) swells at the caster's hand from a quarter size. |
| 0.16–≈0.5 | Travel | The seed is spat in a 1.7 m arc toward the circle, head first, tumbling, shedding venom drops (DROPLET). |
| ≈0.5 | Landing | It bursts: a drop fountain, a dark SCORCH stain (0.95 R) and the pool tears open (R = 3.2 m, ragged fbm edge, near-black violet body, green veins, bubbling cells). A small knock. |
| 0.5–1.15 | Anticipation of the bite | The serpent (spine 3.2 m, body ≈0.3 m thick at the base, planted 0.7 rad off the cast line so the strike reads in 3/4 profile) rears out of the pool, hood folded; over `rearTime` the hood flares to ≈1.7 m wide and the body coils back (lean −0.85, curl 2.0). Its back faces the caster: two false eyes on the hood light white-hot inside green rings. Fumes (SMOKE) roll off the pool; the air shimmers (distortion). |
| 1.15 | Impact — the bite | In 0.09 s the spine whips to its strike pose (lean 1.05, curl 1.45) and the head lands on the host: skin floods, splatter streaks + drops, a WATER venom shell (0.55 R), a RIPPLE decal, a ring running across the pool, flash, knock, light punch. The host's body starts to stain green. |
| 1.15–2.86 | Linger — contagion | The serpent recoils and weaves (a travelling sway down the spine, ±0.22 rad side weave). Every 0.42 s a wave: glowing venom threads (0.085 m, dark core with bright beads flowing outward) arc 1.6 m high from each carrier to its two nearest healthy neighbours; where a thread lands, a 1.76 m pool opens and a mimic serpent (0.72×) rises out of it with its own hood and eyes, weaving on the original's clock 0.24 s late per generation — the copy of the sway ripples outward through the crowd. Each new carrier's body stains. |
| 2.86 | Impact — the unison strike | Every serpent strikes its own carrier at once; per carrier a venom shell, splatter and drops; a SHOCKWAVE ring (1.2 R) at the centre; flash, knock, light punch. Carriers fall away from their serpents. Threads flare and drain. |
| 2.86–3.29 | Recoil | Serpents pull back off their carriers. |
| 3.29–3.99 | Exit | Hoods fold, every serpent sinks back into its pool (sinkDepth 0.38 L), the pools dry darker and fade; the SCORCH stain and the stains on the bodies stay. |

## Layers
1. Seed — ridged lathe teardrop, `createSeedMaterial` (lit, fresnel, fbm venom swirl), 0.34 m, ramp #efffbc → #a6ff4d → #2f6416 → #0b0611, `materials.js`/`geometry.js`.
2. Serpents (hero) — one authored spine-space body (girth-profiled tube, lofted two-sheet hood, wedge head, curved fangs) instanced ×8: the serpent and its mimics are the same mesh. Bent in the vertex stage along θ(s)=A·s+C·s²+sway; hood span/cup/flare computed in the shader. Patched `MeshStandardMaterial` on `LAYER.SHAPED` with a matching depth material: lit by the sun, casts shadows. Skin: scale cells, pale belly, coral-snake warning bands (green / black / violet), false eyes on the hood back, wet fresnel, strike flood.
3. Venom threads — instanced unit tube laid on an arc in `createThreadMaterial`, normal-blended dark venom with HDR beads.
4. Pools — instanced floor blots in `createPoolMaterial`: fbm-ragged edge, darkening body, ridged glowing veins, bubbling voronoi cells, wet meniscus, strike ring; dry out on exit.
5. Particles — miasma (SMOKE, non-additive, rising, curl), venom drops (DROPLET, gravity), splatter (STREAK, additive).
6. Impacts — WATER bursts, SCORCH + RIPPLE + SHOCKWAVE decals, flash, camera knock, light punch.
7. Haze — `createHazeMaterial` on `LAYER.DISTORTION` over the main pool.
8. Light — venom green, shimmering, punched at the landing, the bite and the unison strike.

## Signature
The imitation is visible: every infected enemy grows a smaller copy of the hooded serpent that repeats the original's weave a beat late, so the same motion ripples outward through the crowd — and on the last beat all the copies strike as one.

## Palette
core #f6ffd6, tint #9dff3d / #a6ff4d, body #6fd12a, deep #140a1f (warning band #a94cff)

## Gameplay
- Host: the nearest enemy (UCSM `queryActors`, or `dummies.findTargets` without combat) to the landing point inside `zoneRadius`; ID breaks distance ties.
- Bite (at `riseTime + rearTime`): UCSM `status` poison on the host; the host's existing statuses (other than poison) are read and up to `maxMimic` (≤ 3) of their elements are kept, sorted, as the *copied ailments*.
- Contagion: `waves` waves, `hopInterval` apart. Each carrier from the previous wave infects up to `fanout` nearest uninfected enemies within `contagionRadius` (distance, then ID), until `maxInfected` (≤ 8) carriers. Each wave sends one `status` event per element — poison plus each copied ailment — with all of that wave's new carriers as targets (`statusSeconds` long). This is the imitation: a neighbour of a burning, chilled host is poisoned *and* set burning and chilled.
- Unison strike (`venomDelay` after the last wave): one poison `hit` per carrier (`venomDamage`, `hitImpulse/Lift/Spin` × explosion intensity), pushed away from that carrier's serpent. At most 8 hits, each carrier once.
- Without the combat manager (standalone binding) statuses are refused by design, so only the strike lands; with no binding at all the same rule runs on the dummy field — infection stains the body (`corrode`), the strike fells it.
- Interpretation: the sandbox has no enemy ailments other than UCSM statuses, so "status imitation" copies the host's UCSM statuses; on bare dummies the imitation is the venom stain each carrier inherits.
