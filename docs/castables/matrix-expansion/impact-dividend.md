# Impact Dividend — `matrix-expansion/impact-dividend`
Force · zone · range 2–16 m (capture: 11.8 m) · zone radius 3.2 m · ≈ 3.8 s on screen (0.66 travel + 1.53 bank + 0.85 open + 0.6 sink)

## Read in one line
A forged pressure slug is lobbed into a pressed crater, six lamellar petals of dark bronze slam up out of the floor and shut over it — the landing's shock ring runs out and is *reeled back in* — the petals ratchet tighter three times as their seams light band by band, then the bud blows open flat and pays the banked blow out to everything caught inside.

## Beats
| t (s) | Beat | On screen (shape, size in m, colour, motion) |
|-------|------|----------------------------------------------|
| 0.00–0.18 | Anticipation | The slug (0.42 m knot, deep #24100c body with crawling peach-white cracks) swells out of the hand with an overshoot at 1.35 m; at the target a dark 6.4 m crater fades in, terraces faintly lit (telegraph). |
| 0.00–0.66 | Travel | The slug is lobbed at 18 m/s on a 2.6 m-high arc, tumbling 9 rad/s, shedding a stream of streaks (#fff6ea → #d27a4a). |
| 0.66 | Impact (the block) | It lands: CRACK decal r 3.0 m, dust ring 3.8 m, 46 chips heaved, short knock 0.35, flash 0.06. Six petals (≈ 3.4 m tall, ≈ 2.6 m wide at the root, hinged at 0.86 R) tear up from the floor nearest-the-caster first (0.12 s sweep), leaning out, and slam shut past closed (overshoot 0.18 rad) to 0.42 rad inward; their roots glow from the heave. The ledger ring runs out to the rim in 0.14 s and is reeled back in to the slug over 0.26 s. Every enemy inside is deposited: a peach ripple under its feet, sparks — and no knockback. The slug rises to hover at 1.25 m inside the bud. |
| 0.98 / 1.34 / 1.70 | Linger (compound beats) | Each beat: petals ratchet 0.07 rad tighter with a 14 Hz ring-out and are pressed into the floor; one more band of lamellae lights from the root up (2 of 6 per beat); sparks spit from every petal's seams; a deposit ring runs *inward* across the crater; the slug squashes and shrinks 13 %, cracks running hotter; knock 0.12, light punch. Between beats dust is drawn in off the rim (60/s) and the lens pulls the air inward. |
| 1.85 | Payout | The bud blows open (outBack, 0.32 s) — petals fall flat outward to −1.32 rad and slide 0.6 m out; the slug swells ×2.4 and dissolves; AIR pressure shell to 4.8 m, ring to 6.1 m, SCORCH + SHOCKWAVE decals, 80+ chips and 65 sparks, knock 0.75, flash 0.16, light ×14; depositors fly outward. |
| 1.85–2.70 | Linger (cooling) | Open petals lie on the crater, seams cooling band by band from the tip; crater cracks cool to copper. |
| 2.70–3.30 | Exit | Petals sink into the floor; the crater dissolves through noise with a copper edge; scorch and cracks remain (3.5 s). |

## Layers
1. **Bulwark petals** (hero) — `geometry.js#createPetalGeometry`: a thick cupped shell, spine bowed inward (0.24·s²), section cupped (edges wrap toward the centre), outer face stepped into 6 overlapping lamellae with a raised spine ridge, blunt tapered tip; outer/inner faces, side walls, root cap. Instanced ×6 (≤ 8), rigid, hinged per frame from settings. `materials.js#createPetalMaterial`: `MeshStandardMaterial` (bronze #4a3a33, metal 0.82, rough 0.38) on `LAYER.WORLD`, casting/receiving shadows, patched with hammered grain, glowing lamella lips (ledger bands lit per beat), hot root, the core's light on inner faces.
2. **Core / slug** — `createCoreMaterial` on an icosphere carrier: opaque, sun-shaded deep body displaced into a lumpy knot, squashed on beats; crawling noise cracks through the four-stop ramp; fresnel rim; noise dissolve at the payout.
3. **Crater** — `createCraterMaterial` floor quad (2R): normal-blended dark disc with 5 pressure terraces, radial grooves, hot cracks, inward deposit pulses, payout ring, cooling, dissolve.
4. **Ledger ring** — `createRingMaterial`: one additive floor ring driven out → reeled in → in per beat → out to 1.9 R at the payout; chevroned and noise-broken, feathered behind its run direction.
5. **Particles** — sparks + flight trail (`STREAK`), heaved and thrown chips (`CHIP`, lit), inflowing dust (`SMOKE`, lit).
6. **Impact / payout** — CRACK, DUSTRING, RIPPLE (per deposit), SCORCH, SHOCKWAVE decals; AIR burst; shake, flash and light punches on landing, beats and payout.
7. **Lens** — `createLensMaterial` on `LAYER.DISTORTION`: inward pull while banking, pressure ring at the payout.
8. **Light** — #ffc792, 6, r 12, punched on every event.

## Signature
**The blow is held, then paid with interest**: the landing ring goes out and is reeled back in, the petals ratchet shut a notch per beat while their lamellae light up like a ledger filling, and the bud bursts open flat on the payout.

## Palette
core #fff6ea, tint #ffd1a3, body #d27a4a, deep #24100c (metal #4a3a33)

## Gameplay
Zone cast, `handlesOwnHits`. Interpretation of "bank blocked impulse": the cast's own landing blow is the impulse that is blocked. At the landing every live enemy within `zoneRadius` is **deposited** (≤ 8; UCSM enemies via `bindExpansionCombat`, else `ctx.dummies.findTargets`) and is not struck. With `lateDeposits`, each beat also banks newcomers. After `compoundBeats` (3) beats the payout strikes each depositor exactly once, outward from the centre, with `mult = min(maxMultiplier 3, (1 + 0.12·(n−1))·1.25^beats)` on impulse (6·mult ≤ 24), lift (3·mult ≤ 20) and UCSM damage (1·mult ≤ 10). The schedule is a pure function of time since landing (× global lifetime). Cooldown 6 s.
