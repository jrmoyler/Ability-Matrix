# Refraction Tribunal — `matrix-expansion/refraction-tribunal`
Crystal · zone · range 5–20 m · zone radius 3.8 m · ≈ 3.6 s total screen time at a 10 m cast, ≈ 4.1 s at full range

## Read in one line
A gem of light is thrown into a court of three quartz judges; each judge bends it onto
an enemy and on to the next judge, then the three bow until their points meet and drop
a column of light — the verdict — into the middle of the court.

## Beats
| t (s) | Beat | On screen (shape, size in m, colour, motion) |
|-------|------|------------------------------------------------|
| 0.00–0.28 | Anticipation | A hexagonal gem (0.7 m) grows and spins in the caster's hand at 1.35 m, white heart, amethyst rim, glints drawn round it. At the target the floor cracks on the three points of a triangle (CRACK decals, quartz chips) and three judges — faceted quartz slabs, 4 m tall, 1.3 m broad, deep amethyst, seated 2.7 m from the centre (front-left, behind, front-right, so the caster looks at an edge of the triangle and no judge hides the verdict) — break out of the floor leaning outward (0.16 rad), overshooting slightly (outBack) as they rise over 0.42 s. The court seal etches itself in from the judges: dark faceted floor, ring, triangle and inverted inner triangle. |
| 0.28–0.55 | Travel | The gem flies at 26 m/s on a shallow arc to the front-left judge's face, trailing a 3.4 m chromatic ribbon (white core, warm/violet split sheath) and shedding glints. |
| 0.55 | Impact | The gem strikes the near judge at 56 % of its height: the judge flashes white-hot (facet shader charge + emissive), kicks back, a spectral fan of five coloured streak bundles sprays into the court, light punch, small knock and flash. |
| 0.55–1.33 | Linger I — the trial | Three legs of 0.26 s each. Each leg the refracting judge turns its broad face (outBack, 0.16 s) toward the enemy it chose; the gem runs judge → enemy (struck on a single frame halfway, knocked along the beam, a smaller spectral spray at the body) → next judge, which flashes and bends it again. Every leg leaves its bent beam hanging for 0.55 s, so the court fills with a triangle of refracted light. Pools of light flare on the seal under each refracting judge. |
| 1.33–1.55 | Linger II — the bow | The light climbs from the last judge to the apex while the three judges bow inward (0.34 s, smooth) by the solved angle asin(0.94·Rj/H) (≈ 40°) — their chisel points converge 3 m over the centre into a tall pyramid. The lens pulls inward (three-fold). |
| 1.55 | Impact II — the verdict | A lathe column of light (0.95 m foot) drops from the apex to the floor in 0.12 s; FROST shell (amethyst, to 3.8 m), SHOCKWAVE and FROST decals, verdict ring on the seal, lens pressure ring, 9-unit light punch, heavy knock, flash, radial spectral spray, chips off every judge, every judge flashes. Unjudged enemies within 1.7 m of the centre are struck outward. |
| 1.55–2.90 | Linger III — the court stands | The bowed judges sway (±0.035 rad) and turn slowly on their axes (0.55 rad/s, alternate senses) so their facets sweep the sun; light bands climb inside them; caustics crawl over the seal; the column pulses and thins to a thread; the gem hangs at the apex as a slowly bobbing gavel; glints rise off the judges' points. |
| 2.90–3.70 | Exit | The gem shatters into chips at the apex; the judges straighten, then sink back through the floor (inCubic) while their facet light dissolves through noise with a burning edge; the seal dissolves; the frost decal fades. |

## Layers
1. Judges — `createJudgeGeometry` (authored: flattened-hexagon loft through six jittered rings with a growth step, off-centre chisel termination, three daughter crystals at the foot; flat normals), `MeshStandardMaterial` deep amethyst #2a1048 / emissive #7b2cff, metalness 0.35, roughness 0.14, `LAYER.WORLD`, casts/receives shadows; 4 m × 1.3 m; `geometry.js`, `materials.js`.
2. Facet light — `createFacetMaterial` additive shell on the same geometry: dispersive fresnel rim (R/G/B at three powers), climbing bands, per-facet sparkle, refraction flash, noise dissolve; ramp A→D.
3. Beams — `createBeamMaterial`, camera-facing ribbons built in the vertex stage, white core, chromatic sheath, flow noise, bright head knot; up to 14 (entry, two per leg, climb); 0.22 m half-width.
4. Witness — `createWitnessGeometry` hexagonal bipyramid, `createWitnessMaterial` inverted fresnel (white heart, amethyst rim).
5. Seal — `createSealMaterial`, normal-blended (the deep tone darkens the floor): faceted voronoi floor, ring, etched triangle + inner star, caustics, cracks round each judge, per-judge light pools, verdict ring, dissolve; 2.1 × zone radius.
6. Verdict column — `createColumnGeometry` lathe spindle, `createColumnMaterial` streaming light, fresnel edge.
7. Particles — SOFT glints (`refractionTribunal.glint`), STREAK spectral fans tinted through a five-colour spectrum (`.streak`), lit CHIP quartz (`.chip`).
8. World answers — CRACK ×3 at the rise, FROST shell burst + SHOCKWAVE + FROST decals at the verdict, flash, camera knock, light punch at every refraction and the verdict.
9. Lens — `createLensMaterial` on `LAYER.DISTORTION`: three-fold inward pull during the bow, pressure ring at the verdict.
10. Light — follows the witness round the court.

## Signature
The bolt is *refracted*: one light, bent judge → enemy → judge round a triangle of quartz
that turns its faces to catch it, then the judges bow (angle solved from the radius) until
their points meet and the verdict drops.

## Palette
core #fff7ff, tint #f0c4ff, body #a74cff, deep #1f0838 (spectral fans: red, amber, green, cyan, violet tints)

## Gameplay
Interpretation: the sandbox has no projectile system to refract (the combat adapter reports
`queryProjectiles` unsupported), so the projectile refracted is the cast's own witness
bolt, and the refracting surfaces are the cast's own constructs (the judges).
- Placement: judges at `judgeRing × zoneRadius`; judge height `max(judgeHeight, Rj/0.6)`
  so the bow is always steep; bow lean `asin(bowAmount·Rj/H)`; beam ends are the live
  refraction points on the judges — all re-derived every frame.
- `handlesOwnHits`. Leg k (k < `refractions`, 1–6, default 3) starts at judge k mod 3 and
  chooses the nearest enemy inside the court (`zoneRadius`) not yet struck and not
  claimed by an earlier leg, measured from that judge's seat; halfway through the leg the
  enemy is struck once (damage 1 / `dummy.kill`), knocked along the bent beam with
  `hitImpulse`/`hitLift`/`hitSpin` × explosion intensity. With no enemy left, the leg
  runs straight to the next judge.
- The verdict (after the last leg + `verdictDelay`) strikes every enemy not yet struck
  within `verdictRadius` (1.7 m) of the centre, outward, at most 8.
- Each enemy is struck at most once per cast; total strikes ≤ `refractions` + 8.
  Deterministic: choices are by distance, event times by settings.
- Routed through `bindExpansionCombat` (UCSM `hit` events, element `crystal`, tag
  `refraction-tribunal`) when the combat binding exists, the dummy field otherwise.
