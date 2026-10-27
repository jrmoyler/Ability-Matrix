# Symbiotic Exchange — `matrix-expansion/symbiotic-exchange`
Nature · zone · range 2–18 m · zone radius 3.4 m · ≈ 4.1 s on screen at 10 m (0.35 charge + ≈ 0.8 travel + 2.45 exchange + 0.9 exit)

## Read in one line
A seed on a living vine is lobbed into the circle, bursts into a lobed, beating heart on a root mound, coils roots round everything inside, and with every heartbeat pulls amber sap out of its prey and pays it back down the vine to the caster as green.

## Beats
| t (s) | Beat | On screen (shape, size in m, colour, motion) |
|---|---|---|
| 0.00–0.35 | Anticipation | A ribbed spindle seed (0.34 m radius) swells out of nothing 0.6 m in front of the caster at 1.35 m, tumbling; spores are drawn round it; its veins glow lime. |
| 0.35–≈1.1 | Travel | The seed is lobbed (apex 1.4 m + 0.1 m per metre of range) and pays out the **lifeline** behind it: a bark vine, 0.085 m thick, growing from the hand along the same arc, green sap already running back down it. |
| ≈1.1 | Impact | Seed punches in. A soil mound (1.7 m radius, 0.55 m tall) heaves up with an overshoot; EARTH shell to 3 m, CRACK (2.1 m) and DUSTRING (3 m) decals, 48 lit soil chips, a lime flash, a camera knock and a 7× light punch; a RING shoots out. The heart (2.1 m tall, 1.6 m across, six swollen lobes, a cupped lip) heaves out of the mound and its six serrated sepals peel open. Up to six prey roots whip out with an arch overshoot and coil 2.2 turns (0.36 m radius, 1.35 m high) round each enemy; eight more roots plunge into the rim at 1.05 R. The root field spreads to the rim over 0.7 s. |
| ≈1.45–3.0 | Linger — the exchange | Four heartbeats, 0.5 s apart. Each: a lub-dub squeeze (16 %), sepals flutter, a bright ring runs **inward** along the floor veins from the rim to the mound, a pressure ring warps the air outward, every root flushes, sap droplets tear off each bound body toward the heart, and an amber bead climbs each root (0.4 s) into the heart. The heart's veins fill from the root upward, amber turning green as the heart converts it; each arriving amber bead sends a green bead down the lifeline (12 m/s) to the caster, where motes and a small ring rise. The bound bodies stain brown a quarter at a time. Roots squirm continuously; the lifeline sags from its throwing arc to a 0.85 m resting arc. On the fourth beat the emptied bodies are hauled into the heart and their roots snap back. |
| ≈3.55–4.45 | Exit | The heart browns, folds its sepals and sinks into the mound, which sinks after it; the roots dry and draw back tip-first over 0.7 of the exit, the lifeline last (after the final green beads are home); the field dissolves through noise with an amber edge; the crack decal stays to 3.4 s. |

## Layers
1. The heart — `createHeartGeometry` (custom lathe: six lobes with mid-ribs on a gourd profile, a lip that rolls into a cup) in `createHeartMaterial` (wrap-lit skin dark in the grooves, ridged-noise veins that flush on the beat and fill from the root with banked vitality, fresnel flesh, a cup lit from inside). Opaque, `LAYER.WORLD`, shadowed. 2.1 × 1.6 m. Also draws the seed (`createSeedGeometry`). `materials.js`, `geometry.js`.
2. Sepals & mound — six serrated, bevelled, curled sepals (`createSepalGeometry`, instanced) and a heaved soil mound with seven root humps (`createMoundGeometry`), `MeshStandardMaterial`, lit, shadowed.
3. Tendrils — one instanced parameter tube (`createTendrilGeometry`) bent in the vertex stage by `createTendrilMaterial` (arch → coil, writhe, grow point), `LAYER.SHAPED` with its own shadow depth: the lifeline, up to two ally lines, six prey roots, eight rim roots. Ridged bark, green rim, sap flowing toward the start (amber taken / green given), lime grow tip, brown wither.
4. Sap beads — up to 48 instanced drops (`createBeadMaterial`, additive): amber prey→heart, green heart→ally.
5. Root field — `createFieldMaterial` on a 2 × 1.18 R quad: moss stain (deep), radial root veins (ramp), torn soil ring at the mound, beat rings running in, noise dissolve.
6. Particles — SOFT spores (charge, heart mouth, regen motes), DROPLET sap per beat, lit CHIP soil at impact, RING at impact / each beat / each regen.
7. Impact — EARTH burst shell, CRACK + DUSTRING decals, camera knock (impact and each beat), flash, light punches.
8. Pulse — `createPulseWarpMaterial` on `LAYER.DISTORTION`: a pressure ring per beat.

## Signature
The trade made visible: amber sap climbs the coiled roots into a beating heart and leaves it again, green, down the vine the seed was thrown on — the same lifeline that was the travel beat is the regeneration link.

## Palette
core #f4ffd6, tint #b9f07a, body #3f9a3a, deep #0d2914 · sap #ffb64a / #7a320c · bark #2c2014 / #6e5434 · withered #4a3a24

## Gameplay
- `handlesOwnHits`. At impact the heart binds up to `maxLinks` (≤ 6) enemies inside `zoneRadius`, nearest first (ties by id), and up to `maxAllies` (≤ 3) allies within `allyRadius`; the caster is always ally 0 (its lifeline).
- Beat k of `pulses` (default 4) fires at `latchTime + k·beatInterval` (× global lifetime). Every bound enemy is drained once per beat: exactly `links × pulses` hits, never more.
  - Combat binding (UCSM): an attributed `hit` (`element: 'nature'`, `damage: drainDamage`, source placed on the far side of the body so the knockback hauls it toward the heart) each beat, plus a nature `status` (entangled, `entangleSeconds`) on the first beat.
  - Standalone bridge: the same hits accumulate on the sandbox fallback health (4 × 0.25 = 1), so the dummy falls on the last beat exactly, hauled into the heart. Statuses are refused there and ignored.
  - No binding: the dummy is stained (`corrode`) a share per beat and `kill`ed toward the heart on the last beat with `hitImpulse/hitLift/hitSpin` × explosion intensity.
- Regeneration (interpretation): each drained share becomes one amber bead to the heart and then one green bead to an ally (round-robin over bound allies), crediting `regenPerShare` up to `regenCap` per ally. The sandbox host has **no heal event**, so the regeneration is this deterministic ledger (`ability.allyVitality`, `allies[i].banked`) plus its presentation; nothing is invented on the combat side. A host heal hook would be the one integration needed to make the credit restore health.
- Prey that is defeated or removed mid-exchange drops its link (its root snaps back); a mode change mid-cast is refused by the binding and recorded in `ability.failure`.
