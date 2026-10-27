# Tidewrought Ring — `linear-ext/aether`
Water · ring (standing structure) · range 3.5–18 m (capture: 13.7 m) · clear radius 2.15 m · persistent: ≈ 3.3 s to forge, stand and open, then stays (break-up 1.4 s)

## Read in one line
A tide of cyan light runs to the site, dark metal segments spiral in out of a wide orbit to forge a ring lying flat on the floor, the ring hinges up to vertical with a wobble, and a churning cyan water-horizon irises open inside it and stays.

## Beats
| t (s) | Beat | On screen |
|-------|------|-----------|
| 0.00–0.34 | Anticipation + travel | `cast3`, flash 0.14 #7ff0ff; tide at 40 m/s. |
| 0.34–1.49 | Impact (forge) | `assembleTime` 1.15 s: segments (0.5 m, step 0.42 m) swing in from 3.4 × their slot radius, 1.1 m out of plane, through 0.42 turns, tumbling 5 rad/s, each 0.55 s in flight; they lock from the foot upward, both arcs closing on the crown, the ring turning 0.85 turns as it closes; runes light behind them; 0.05 shake per lock, 0.45 at the crown. Lies 0.06 m off the floor. |
| 1.64–2.59 | Impact (stand up) | After 0.15 s the hoop hinges about its lateral axis over `riseTime` 0.95 s, clearing the floor by 0.28 m, overshooting past vertical and settling. |
| 2.73–3.28 | Impact (open) | Horizon irises open from the middle over 0.55 s and slams into the rim; surge throws spray at 11 m/s; flash 0.38. |
| 3.28 → | Linger (indefinite) | Pool shears about a dark eye (46 % of the radius, partly see-through), ripples run *inward*, sparkles hang in it, rim light #8ef4ff and halo spill onto the segments, idle spin 0.015 turns/s; motes drawn into the eye, spray breathed out, cold mist falling from the underside. |
| on dismiss | Exit | `closeTime` 1.4 s: segments are flung 2.6 m outward and tangentially. |

## Layers
1. **Segments** — instanced metal (#3d5468 / #101a26) with burned-in runes; `abilities/AetherRingAbility.js`.
2. **Horizon pool** — SDF surface quad: lip #e6ffff, water #31d9ff, deep/eye #03142c, rim #8ef4ff.
3. **Rune band** — 14 marks per half contour.
4. **Motes / spray / mist / debris** particles.
5. **Ring indicator** (`effects/RingIndicator.js`) and light #3fd8ff (13, r 16).

## Signature
**Assembled somewhere other than where it ends up**: forged flat, then stood up — every frame of the build is a function of three ages, so `stand up over` re-poses it mid-hinge.

## Palette
core #e6ffff, tint #8ef4ff, body #31d9ff, deep #03142c

## Gameplay
Persistent structure, one at a time. No damage role. Cooldown 2.8 s.
