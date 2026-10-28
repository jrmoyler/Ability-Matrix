# Hematite Arsenal — `matrix-expansion/hematite-arsenal`
Blood · zone · range 2–14 m (capture 10.4 m) · zone radius 3.2 m · ≈ 3.9 s on screen (10.4 m cast, defaults: forge 0.32 + flight 0.47 + linger 2.31 + exit 0.8)

## Read in one line
A knot of blood at the hand congeals into six polished black hematite weapons
fanned over the caster; they fly tip-first and slam into a ring round the
target, then one by one rip out, run an enemy through and come back — the
blood draining out of each blade with every strike — until the spent ones rust
to flakes and the rest melt back into a pool that crusts and fades.

## Beats
| t (s) | Beat | On screen (shape, size in m, colour, motion) |
|---|---|---|
| 0.00–0.32 | Anticipation — the forge | A 0.22 m boiling sphere of blood (white core → crimson → near-black rim) swells at the hand (1.45 m up, 0.45 m ahead); blood mist rises round it. Six weapons — greatsword 2.0 m, spear 2.7 m, falx-glaive 2.6 m, twice — congeal in a 2.3 rad fan 2.35 m over the caster's shoulders, molten red cooling to polished black, every point turned downrange. Travel is held until the forge is done (Beam-style charge). |
| 0.32–0.79 | Travel — the volley | The weapons leave the fan one after another (stagger 0.28 of the flight) and fly quadratic arcs (apex 2.6 m over the chord) tip-first at 22 m/s, turning 0.6 rev on their own axis, glowing hotter as they come; the knot shrinks away as they leave. All arrive on the same frame. |
| 0.79 | Impact — the ring slams in | Six weapons drive point-first 0.28 m into the floor on a ring at 0.8·R (2.56 m), pommels leaning out 0.24 rad, flats to the centre, quivering (0.07 rad, 19 rad/s, decaying). One frame: CRACK decal at every socket (0.75 m), SHOCKWAVE to 3.7 m, a crimson WATER splash shell to 2.4 m, 14 droplets thrown out of every socket, pressure ring on the lens, screen flash in tint, camera knock 0.22, light punch 6. The blood pool starts to spread from the sockets. |
| 0.79–3.10 | Linger — the arsenal fights | Pool spreads to 1.08·R over 0.45 s: dark clotted blood, a ragged fbm edge, rivulets running from each socket to the centre, wet specular sheen from the sun, mist rising off the sockets. From 1.09 s, every 0.13 s, one weapon rips out (0.14 s), rears 1.5 m up and 0.8 m inward, turns on its target and drives through it at chest height (0.1 s, accelerating), passing 0.55 m through; a white-hot→crimson streak follows the lunge; droplets spray along the blow; the pool rings round its socket; lens puff; light and camera tick. It holds 0.1 s, then arcs home (0.24 s, 0.9 m arc) and replants. The blood in its fuller drops by half and its edge cools; its rivulet thins. Round two (from 1.87 s): each weapon's second strike empties it — it stays run through the body, oxidises to rust and crumbles from the point up through a burning orange lip over 0.55 s, sagging, shedding 30 lit rust flakes. The ring visibly thins to nothing. |
| 3.10–3.90 | Exit — return | Any weapon with vitality left (no enemy to strike) sinks molten into the pool and crumbles; the pool crusts over into dried hematite plates with dark voronoi cracks (0.7 of the fade) and dissolves through noise with a glowing edge; socket cracks outlast it (3.2 s). |

## Layers
1. The weapons (hero) — lofted blades (14-point lens section with a fuller groove each face; single-edged spined section for the falx with a centre line that hooks toward the edge), lathed hafts/grips/pommels/collars with ridged wraps, extruded greatsword guard with hooked quillons and a langet; flat-shaded; `MeshStandardMaterial` patched (`createWeaponMaterial`): hematite #3b3a40 metal 0.92 / rough 0.26 with #5a1218 sheen grain, fuller blood level = vitality with a meniscus, edge glow, molten form/heat through the ramp, rust blotches #6b2a14, noisy crumble discard with an ember lip. `LAYER.WORLD`, cast and receive shadows. 2.0–2.7 m. `geometry.js`, `materials.js`.
2. The knot — icosphere boiled in the vertex shader, `N·V` brightness through the four-stop ramp, additive. `createKnotMaterial`.
3. The streaks — one ribbon per weapon along the lunge, white-hot head, crimson smear, noisy sheet. `createStreakMaterial`.
4. The pool — floor field (normal-blended, so it can be dark): ragged spread, per-socket rivulets weighted by each weapon's vitality, socket strike rings, fake-normal wet sheen lit by `uLightDir`, voronoi crust, noise dissolve. ~3.9 m radius. `createPoolMaterial`.
5. Particles — blood droplets (`DROPLET`, normal blend, gravity 7) at landing and every strike; rust flakes (`CHIP`, lit, normal blend) when a weapon crumbles; blood mist (`SOFT`, curl, additive) at the forge and off the sockets.
6. The landing — WATER burst shell (#ffb3b0 → #c0102a → #2a0309), CRACK ×6 + SHOCKWAVE + RIPPLE per strike decals, flash, shake, light punch.
7. The lens — `LAYER.DISTORTION` disc: landing pressure ring, a puff at every strike, haze over the pool. `createLensMaterial`.
8. The light — #ff3446, punched on landing and per strike.

## Signature
Weapons that pay for themselves: a ring of solid hematite arms that fight on their own, and you can read how much each has left from the blood in its fuller — the last strike empties it and it rusts away inside the body it struck.

## Palette
core #ffe3dc, tint #ff5a62, body #c0102a, deep #2a0309 (hematite #3b3a40, sheen #5a1218, rust #6b2a14, crust #3a1410)

## Gameplay
- **The bound.** At spawn the cast fixes `N = weaponCount` (6, ≤ 8) and gives each weapon `vitality / N` (6/6 = 1). A strike deals `strikeDamage` (0.5) and spends exactly that, so each weapon carries `floor(share / strikeDamage)` strikes (2, ≤ 4). The whole cast can never deal more than `vitality`.
- **Cadence.** Strike `j` belongs to weapon `j mod N` and launches at `strikeStart + ⌊j/N⌋·cycle + (j mod N)·strikeGap` after landing (`cycle = max(N·gap, strike duration + 0.05)`); its hit lands `ripTime + lungeTime` later. Deterministic, frame-rate independent, unchanged by reduced motion.
- **Targeting.** Among living enemies inside `zoneRadius` of the landing point: the one this cast has already wounded most (it finishes what it starts), else the one nearest the weapon's socket; never a body already reserved enough damage to fall. Damage is reserved at launch, taken at landing.
- **Hits.** Through the expansion combat binding: UCSM `hit`, element `blood`, one target, `damage = strikeDamage`, `hitForce` from `impactForce`, source = where the weapon reared (bodies fly along the blow). Without it, straight on the dummies: a dummy falls (`kill` along the lunge, impulse 9 / lift 4.5 / spin 2.4 × explosion intensity) on the landing that brings this cast's wounds to its one health; a short wound stains it (`corrode`). With 7 dummies in the zone the defaults fell 6 of them, two strikes each.
- **Withheld strikes.** A strike with no enemy is withheld and spends nothing; that weapon keeps its blood and melts back into the pool at the exit.
- Interpretation: "vitality weapons" are the cast's own constructs; "bounded" is the fixed vitality budget split into per-weapon strike charges. No caster health is drawn (the sandbox has none to draw); `handlesOwnHits` is true.
