# Vector Breakwater — `matrix-expansion/vector-breakwater`
Force · line · range 1–20 m · lane half-width 2.2 m · three fronts 0.22 s apart at 15 m/s · ≈ 1.4 s linger

## Read in one line
Three dense umber shield walls with white-hot crests rise out of the floor just past the caster's brace, slam down the lane one after another and break on the target; the lane behind them is scoured dark with orange pressure seams while chevron aftershocks keep rolling down it, then it crumbles away.

## Beats
| t (s) | Beat | On screen (shape, size in m, colour, motion) |
|-------|------|------------------------------------------------|
| 0.00–0.44 | Anticipation | Three floor chevrons at the caster's feet flare in turn as each front leaves (small knock, light punch, grit). |
| 0–0.25 per front | Rise | Each front leaves as a low pressure lip and rises out of the floor over the brace + 1.6 m (`frontClear`), so it never stands on the hero. |
| travel | Travel | 4.4 m wide × 1.8 m cambered, tapered sheet: dark umber body (density 0.62) with drifting saturated pressure cells, hot sides, a hard white-hot crest line, five pulsing ribs, six fins, a warp sheet on `LAYER.DISTORTION`, grit and spray; the ground behind it scours dark with a pale fresh band. |
| on contact | Contact | Jagged pressure petals, flung shards, light punch at a committed hit (each front strikes once). |
| arrival ×3 | Impact | Each front tears apart from the crest with a burning edge and curls forward; wake crest, shockwave and dust ring; the first adds a squashed dark-orange AIR shell, flash and knock. |
| +0–1.0 | Linger | The scour cools: dark scorched ground, orange seams fading to embers (`coolTime`), chevron aftershock bands rolling down the lane at 3.5 m/s. |
| last 1.4 s | Exit | The scour crumbles away through a noise dissolve with glowing edges. |

## Layers
1. Brace chevrons.
2. Shield fronts — `createFrontGeometry` under a normal-blended four-stop-ramp shader (voronoi cells, slash lines, crest line, break dissolve), ribs, fins.
3. Ground scour — normal-blended corridor shader: ragged edges, pressure seams, fresh bands, cooling, chevron aftershocks, crumble.
4. Spray, grit and shards (one pooled streak system), contact petals.
5. The break: wake crests, shockwave + dust decals, AIR shell, flash, knock.
6. Warp sheets on `LAYER.DISTORTION`.

## Signature
A wall of force that is dark and heavy, cut by a white crest — three times.

## Palette
core #fff3df, pale #ffc27a, body #e2571c, deep #2b0d06

## Gameplay
Unchanged: each front's position is the same pure function of age, spacing and speed; the sweep, per-front hit sets, UCSM event and force are untouched; `impactDuration` unchanged. Only the sheet's drawn height ramps up near the caster, and the fade (`lingerTime`) starts after every front has arrived.
