# Arterial Whip — `codex/arterial`
Blood · line · range 2–18 m · hit width 1.0 m either side, tip zone 2.2 m · ≈4.2 s on screen (≈0.4 travel at 27 m/s + 0.16 snap + 1.55 lie + 0.65 reel + 1.5 drying)

## Read in one line
A beaded, wet artery pays out of the caster's wrist, arches 3 m overhead and is cracked down flat along the line. It does not die there: it lies on the floor writhing like a cut snake, swollen and still pumping, its torn head rearing a body-height up and striking the floor again and again over a spreading pool of blood. Then it reels back into the wrist and the pool dries brown and erodes.

## Beats
| t (s) | Beat | On screen |
|---|---|---|
| 0.00–0.12 | Anticipation | The wrist opens: a ragged red bloom (0.5 m) at the hand and a burst of 30 drops. |
| ≈0.05–0.45 | Travel | The vessel pays out down the line at 27 m/s: 0.15 m thick at the wrist tapering to 0.035 m, beaded every 0.34 m with pinched joints, arching 3.2 m over the caster's head with a vertical wave rolling along it. Peristaltic pulses (2.6/s) swell the beads and glow through the thin wall; joints spurt blood. |
| ≈0.45–0.61 | Snap | The arch inverts and comes down accelerating (inCubic, 0.16 s), hand first, tip last. |
| ≈0.61 | Impact | The vessel lies flat along the line; the tip ruptures: a fan of 220 drops thrown forward, a red WATER dome (2 m), a 5 m shockwave, a 3.6 m ring of bent air, the tip's own 1.2 m bloom and a light punch ×2.6, camera knock 0.55. The screen flash is kept at 0.04 — the punch is local to the tip. 160 drops are kicked up all along the line; the smear and spatter are painted hand → tip over 0.12 s. Bodies along the line are thrown up and off it; the tip launches what it lands on. |
| ≈0.8–2.2 | Linger | It comes alive on the floor (0.22 s): it swells ×1.35 with pooled blood and writhes in a 0.42 m serpentine (2.6 m wavelength) that crawls hand → tip at 6.5 rad/s. The last 38 % of it — the torn head — rears up to 1.35 m and slams down ≈once a second; each strike throws 55 drops, a 1.7 m ring and a small knock. Pulses keep running and the joints keep spurting. Under it the smear spreads to ×2.3 its width over ≈1.1 s, its wet sheen running down the line at 0.45 m/s and fresh blood welling in it with each beat. |
| ≈2.2–2.8 | Exit (vessel) | It eases still and reels back into the wrist, lifting a little, bleeding away tip-first along a hot fraying edge. |
| ≈2.8–4.3 | Exit (floor) | The pool dries from wet crimson to matte brown #2e1610 and erodes in noise patches; a little mist rises off it. |

## Layers
1. The wound: an additive billboard bloom at the hand that beats with the pulses.
2. The vessel: `createVesselMaterial` — a parameter-space tube (220 × 14) bent along a centreline in the vertex stage (arch, wave, sway, slam clamp, **writhe** and **rearing head**); opaque, lit wet flesh: wrapped diffuse, hard specular, joint grooves, capillaries, blood glowing through the wall on each pulse.
3. The splatter/pool: `createSplatterMaterial` — a ground strip down the line: smear + flung spatter, spreading into a pool, sheen running down the line, welling with the beat, drying brown and eroding.
4. The rupture: WATER shell, SHOCKWAVE decal, the tip bloom, a `LAYER.DISTORTION` ring (`createRuptureWarpMaterial`).
5. Blood: DROPLET drops (spurts, rupture fan, strikes), additive STREAK spray, SMOKE mist.
6. The linger strikes: SHOCKWAVE ring + drops + knock per strike of the head.
7. World: shake, light punch, a 0.04 flash.

## Signature
The whip is still alive after it lands — it writhes and strikes the floor with its torn head before it is reeled in.

## Palette
core #ffd8dc (wound bloom only) / hot #e8182e (pulse through the wall), tint #c8182c rim, body #460712, deep #140105 (pool #9a0c1e → #2a0208, dried #2e1610)

## Gameplay
`handlesOwnHits` is unchanged: nothing is hit until the slam, then everything within `hitWidth` 1.0 m of the line is thrown up and off it, and the last `tipZone` 2.2 m launches. The linger (writhe, rearing strikes) is presentation only — it deals no hits. Bled bodies stain and drip (bounded by `MAX_BLED` = 10).

## New settings (presentation)
`writheAmp`, `writheLength`, `writheSpeed`, `writheIn`, `lieThicken`, `rearHeight`, `rearFrom`, `rearRate`, `restrikeDrops`, `restrikeRing`, `restrikeShake`, `poolGrow`, `poolTime`, `poolFlow`, `poolPulse` — all in the editor folders "4b · It lies there (linger)" and "6 · Splatter".
