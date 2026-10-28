# Pyre Crown — `linear-ext/pyre`  ★ reference (§1)
Fire · zone (far cast) · range 0–18 m (capture: 12.6 m) · zone radius 4.2 m · ≈ 6.7 s on screen (0.27 fire line + 4.0 blaze incl. 0.2 catch + 2.45 burn-out)

## Read in one line
A line of fire runs to the circle, the ground inside splits into a molten crater, and a ring of opaque, hooked flame-blades tears up around it — fanned so they cross, leaning in over the middle — which burns and gutters with a wall of flame between them and embers spiralling up the open centre, then is eaten down from the tips to the floor and left as ash.

## Beats
| t (s) | Beat | On screen (shape, size in m, colour, motion) |
|-------|------|----------------------------------------------|
| 0.00–0.27 | Anticipation + travel | Cast flash 0.09 #ffb066; the fire line runs at 46 m/s from the hand, laying scorch patches (r 1 m, 2.2 per metre, 7.5 s); `rumble` 0.05. |
| 0.27–0.47 | Impact (catch) | `snapTime` 0.2 s: the crater burns out to the boundary; a star of molten cracks 1.15 R (#ffb347); 8 m shockwave (#ff7a22/#ffe6b0); 130 cinders, 80 smoke, 170 embers; shake 0.95 (0.85 s); flash 0.24. The ring erupts as a **sweep** from the near side over `sweepTime` 0.38 s, skirt 0.09 s behind across the band in 0.24 s. Each blade (≈ 1.5 m on the ring, uneven crest, base r 0.45 m, hooked `bend` 1.5, widest at 34 % height) rises **monotonically** — a front-loaded surge over `riseTime` 0.18 s with `riseSnap` 0.65 and no overshoot — then keeps creeping 6 % higher over 1.4 s, the way a flame climbs. A white-hot combustion front walks up each blade as it appears. |
| 0.47–4.27 | Linger (blaze) | Blades flicker per blade (0.22 at 7.5 Hz), flame tongues climb their surface; late blades (14 %) keep catching through 70 % of the blaze. Wall of flame (veil) 1.5 m tall at 0.99 R turns 0.125 rev/s, licking upward and cooling to smoke at the top. Crater: plates of cooling crust with molten seams, warped runnels crawling, ember glitter, heat rings, a breathing pool of melt in the middle (0.31 R). Embers 260/s everywhere; **updraft** 120/s embers climbing the column inside the ring, swirling 1.35 rad/s and opening out; smoke 220/s leaving over the top; heat rings 0.9/s; hold rumble 0.06. |
| 4.27–6.72 | Exit (burn out) | After `burnDelay` 0.45 s the burn-down sweeps back around the ring the way the bloom came (`burnSweep` 0.5 s + 0.4 s stagger): each blade is **consumed** from its point down over `ashTime` 1.1 s — an ember rim rides the char line, the body behind it drains to ash #4a4038 and settles 30 % into the floor. Gutter cinders/embers fly; the crater cools inward. Scorch stays to 7.5 s. |

## Layers
1. **Blades** — `createCrystalGeometry` (10 facets, roughness 0.68, bend 1.5, belly 1.67 at 0.34, taper 0.12) on an `InstancedMesh` (≤ 320, ≈ 103 dealt: 159 × density 0.65; 66 % ring, rest skirt + 14 % late), `materials/PyreMaterial.js`: opaque, almost every pixel emissive, `LAYER.WORLD`. Heat ramp char #150402 → ember #c01807 → flame #ff7d1a → core #fff0bd, rim #ff9a3c.
2. **Crater** — `materials/EmberFieldMaterial.js` field quad re-scaled by `zoneRadius`: #ff4314 wash/crust/runnels, #ffbd80 boundary/seams/pool.
3. **Wall of flame** — same file, open cylinder veil: body #ff9f80, crest #f4930b, cooling to #2a1109.
4. **Heat haze** — distortion proxy on `LAYER.DISTORTION` (same file); **ships at `haze: 0`**, turn it up to bend the floor.
5. **Particles** — smoke `SMOKE` (#5a3020 → #0d0908, rising 0.85), cinders `CHIP` (#fff0bd → #1a0f0b, gravity −14), embers `STREAK`-stretched (#fff4cf → #ffb03c → #ff4a10 → #4a0d04), updraft `SOFT` (#ffdc8a → #2a0a04).
6. **Floor & world** — scorch (#140b08, ember #ff7a22) under the path, around the boundary (3/s) and collared round each blade's foot; molten fracture star; shockwave + heat rings; light #ff7a26 (deliberately low: 4, r 17, at 45 % of the crown's height); shake, flash.

## What the capture shows
Standard sheet: `sheets/linear-ext__pyre-sheet.jpg`; dense pass f4–f90.
- **f4 (0.13 s)** — the fire line: a carpet of glowing red-orange ember scorch along the path, already reaching the site.
- **f10 (0.33 s)** — the catch: an orange shockwave ring and molten spokes on the floor, a warm flash tinting the whole frame.
- **f16–f24 (0.53–0.80 s)** — the bloom: blades erupting white-hot (the combustion front) round the circle, near side first, a pale shockwave ring 8 m across.
- **f34–f90 (1.1–3.0 s)** — the blaze: a ring of hooked, opaque blades 1–2.5 m tall, white tips over orange bodies with dark red voids, leaning in and crossing; embers in the air; the inside floor shows a faint concentric glow. Silhouette is stable through the hold (the tongues crawl, a few late blades catch); the burn-out begins after 4.7 s, outside this window.
- Honest read: at 8 m the blades read as **faceted fire-crystal** more than as soft flame — the flame field shows as colour bands on facets. The crater and the flame wall between blades are subtle compared with the blades, and the heat haze is off by default.

## Signature
**Fire in the shape of a blade**: the same crown silhouette as the Glacial Crown, told apart entirely by material and by how it *ends* — consumed tip-first into ash, not shattered.

## What makes it the bar
1. **Identity in material — one field, one ramp.** `PyreMaterial` computes a single temperature from domain-warped fbm in the blade's own space, squashed along its axis (`flameStretch` 0.77) and scrolled *down* the noise so tongues climb *up*; a ridged term gives the hard lip; `sharp` pushes it through a contrast curve to get tongues with black voids. That one value indexes a four-stop ramp (char → ember → flame → core) — one slider re-tempers the whole crown coherently. Add heat bias toward the point, soot at the foot (`soot` 0.48 over 30 %), and a hot silhouette rim.
2. **Grow and die by a noisy discard front, per instance.** `aGrow` (0 at the floor, 1 at the tip) discards everything above a noisy cut, with a white-hot lip (`frontGlow` 3.2) — a blade *catches* upward instead of sliding out of a hole. `aChar` is the same construction run from the other end — the point is eaten first, an ember rim rides the line (`charGlow` 3.4), the body drains to ash (`ashDrain` 0.85). Both are instanced attributes the ability drives; geometry never changes.
3. **Motion curve as identity.** `_emergence` is strictly monotonic (fast front-loaded surge, then asymptotic creep): no overshoot term exists. Ice punches and springs back; fire never does. Choose the easing per element.
4. **Open middle, sweep order, symmetric exit.** Everything is seated in a band about `zoneRadius` (`ringSeat` 0.93, skirt 0.7 → 1.16) so the read is a wall you look *into*; the bloom sweeps from the near side round both arms, and the burn-out sweeps back the same way so the crown opens and closes on one axis.
5. **The air inside does something.** The centre is filled with an *updraft* (embers on a swirling, expanding column) rather than geometry — a cheap, element-defining linger motion (the Glacial Crown's counterpart is falling snow).
6. **The floor is a crater, not a scorch.** An ability-owned field shader with crust plates, molten seams, crawling runnels and a breathing pool, plus a wall-of-flame cylinder seated on the same radius — both live under `zoneRadius`.

## Palette
core #fff0bd, tint #ff9a3c / #ffbd80, body #ff7d1a / #ff4314, deep #150402 / #140b08

## Gameplay
Zone cast; hits from the circle via `DummyField`. Cooldown 1.6 s.
