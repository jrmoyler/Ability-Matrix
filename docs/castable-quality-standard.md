# Castable quality standard

The one bar every castable in the matrix is held to, written so that an agent
that **cannot see the screen** can still build to it and check its work.

The bar is the three original Linear packs — `linear`, `linear-ext` and
`linear-extended` (achrefelouafi's LinearAbiltyCasting repos). Not the Codex,
not the Collective, not the earlier expansion passes: those were written *to*
this bar and many fell short of it. When this document and an older cast
disagree, this document wins.

Companion files:

- [`docs/castables/`](castables/) — one written storyboard per reference cast
  and per new or upgraded cast: what is on screen, beat by beat, in metres,
  seconds and colours. Read three reference storyboards before you design.
- `docs/castables/sheets/` — contact sheets (four frames each) of the reference
  casts, for agents and people who can look at images.
- `tools/capture-cast.mjs` — renders any cast in the real sandbox to PNG frames
  and a contact sheet. Image-reading agents **must** use it; see *Verify*.
- `packs/sandbox/SANDBOX_NATIVE_CONTRACT.md` — the engine contract (ctx,
  phases, particles, decals, bursts, layers, globals). This standard sits on
  top of it.

## 1 · The reference casts

Read the code of at least two of these, and the storyboards of three, before
designing anything. They are the bar.

| uid | Name | Why it is the bar |
|-----|------|-------------------|
| `linear-ext/kraken` | Kraken Crown | Identity in **motion**: arms rear, whip and hammer the centre in a rolling wave, then one synchronised slam. Arm length is *derived* from `zoneRadius` (an arc of length πR/2 lands on the centre), so dragging the slider mid-cast keeps every strike on target. |
| `linear-ext/pyre` | Pyre Crown | Identity in **material**: volumetric fire body, ember field, cinder floor. Proves one shape can be a whole spell when the shader carries it. |
| `linear/glacier` | Glacial Crown | A crown of faceted ice that grows, refracts and shatters; ground frost spreads and stays. |
| `linear/meteor` | Cinder Fall | Anticipation done right: the rock is seen falling, the floor tears open into real geometry fissures (not a decal) with basalt lips, scorch stays after. |
| `linear/beam` | Nova Beam | A line cast with a charge, a held beam with a living core, and a scar. |
| `linear-extended/rend` | Celestial Rend | A pillar that cuts the sky and the floor at once; layered light, debris, lingering wound. |
| `linear-extended/astral` | Astral Void Blast | Implosion then release: the world is pulled in before it is pushed out. |
| `linear-extended/cascade` | Baleful Cascade | Many authored blades with their own procedural geometry and a choreographed fall. |
| `linear-extended/venom` | Venom Surge | The reference **line cast**: records store only dice, everything resolved from `settings` every frame. |
| `linear-extended/ward` | Volcanic Ward | The reference **zone cast**: a barrier shader with depth, a molten ground and a slow, readable life. |
| `linear-extended/growth` | Arborist's Growth | Organic procedural geometry (vines) that grows along curves in the vertex shader. |
| `linear-extended/quake` | Monolith Rift | Solid world-layer geometry that casts shadows and is lit by the sun, heaved out of the floor. |

What these share is the standard. Everything below is how to hit it.

## 2 · What "at the bar" means, as checks

A cast passes when **every** item below is true. Each is phrased so you can
check it from code and from the capture frames.

### 2.1 Silhouette and form

1. **A hero form with its own geometry.** At least one authored, procedural
   shape built in code — lathe, loft, extruded outline, tube along a curve,
   bent in the vertex shader — that could only belong to this spell. A
   `SphereGeometry`, `TorusGeometry`, `RingGeometry`, `PlaneGeometry` or
   `CylinderGeometry` used *as is* is never the hero (they are fine as
   carriers for a shader that reshapes them).
2. **It reads at play distance.** At the capture camera (8 m) the hero
   occupies a clear share of the frame at its peak — roughly the size of the
   zone circle for a zone cast, or a body-height-plus feature along a line cast.
   A cast that is a thin line, a faint disc or a scatter of specks at peak
   **fails**, however good its shader is up close.
3. **Solid where it should be solid.** Rock, ice, metal, bone, wood and
   crystal are opaque, lit by the scene sun (MeshStandardMaterial or a
   ShaderMaterial with real lighting), on `LAYER.WORLD` and casting shadows.
   Light, fire, plasma and spirit are emissive and additive. Never a flat,
   unlit, single-colour polygon blob.
4. **Detail at three scales.** Big shape (the silhouette), medium (parts,
   facets, rings, limbs), small (noise, grain, sparks, motes). A cast with
   only one scale reads as a placeholder.

### 2.2 Motion and beats

5. **Five beats, none skipped:** anticipation (gather, charge, telegraph at the
   hand or target) → travel (something visibly goes from caster to target) →
   impact (one frame where everything lands: light punch, shake, flash, burst,
   decal) → linger (the result stays and *does something* — burns, drips,
   settles, hums) → exit (dissolve, fold, sink, shatter — never pop).
6. **Identity in motion.** After impact, the silhouette keeps changing for at
   least half the linger. Static shapes that only fade are below the bar.
7. **Placement is derived, not tuned.** Where things land is computed from the
   settings (radius, range, length), so changing a slider mid-cast keeps the
   choreography correct (see the Kraken arc identity).
8. **Timing reads.** Anticipation 0.15–0.6 s, impact on a single frame, linger
   0.8–3 s, exit 0.3–1 s, × `settings.global.lifetime`. Total screen time of a
   standard cast is 1.5–4.5 s.

### 2.3 Material and colour

9. **A bespoke shader.** At least two `ShaderMaterial`s written for this cast
   (own vertex *or* fragment logic; noise, fresnel, dissolve, soft depth fade),
   in the cast's own materials module. Shared helpers are fine; a cast that is
   only `MeshBasicMaterial` + particles fails.
10. **A colour ramp, not pastels.** Every layer is coloured from a four-stop
    ramp on the spell's hue: white-hot core → pale tint → saturated body →
    dark deep. The deep tone grounds it on the dark floor; without it a cast
    looks washed out. HDR values > 1 only in the core (bloom picks them up).
11. **Element reads without the label.** A viewer names the element from one
    frame: fire flickers and rises, frost is faceted and blue-white, water is
    wet and specular, earth is heavy and shadowed, shadow eats light, holy is
    gold and radiant, etc.

### 2.4 Layers

12. **At least five distinct layers**, typically: hero mesh, ground treatment
    (field shader or decal set), two or more particle systems with different
    shapes (`SOFT`, `STREAK`, `CHIP`, `SMOKE`, `RING`…), an impact burst or
    shockwave, a distortion proxy on `LAYER.DISTORTION`, and the light.
13. **The floor answers.** Something is written onto or torn out of the ground
    at impact and stays for the linger (scorch, frost, crack, ripple, fissure,
    stain, crater), sized from the zone.
14. **The world answers.** Light punch, camera shake and screen flash on the
    impact beat, scaled by `settings.global.cameraShake` /
    `explosionIntensity`. Bodies hit fly in the direction of the blow with
    `impulse` / `lift` / `spin` from settings.

### 2.5 Engineering (from the contract)

15. **Every number is a live slider.** A settings block of typically 60–150
    commented keys; one editor folder exposing every key; changing a value
    mid-cast changes the effect on the next frame.
16. **Records store dice.** Per-instance records hold random seeds and event
    timestamps only; every dimension is resolved from settings each frame.
17. **Pooled and allocation-free.** Module-level scratch vectors, fixed
    `MAX_*` capacities, `spawn` fully resets, `onDestroy` hides everything,
    `dispose` frees GPU resources.
18. **Globals honoured.** glow, opacity, particleCount/Size/Lifetime/Speed,
    noise, turbulence, distortion, fresnel, explosionIntensity, cameraShake,
    lifetime and shaderIntensity all scale the cast.
19. **Documented like the originals.** A class comment that tells the story of
    the cast beat by beat and names each layer and the decision behind it.
20. **Reduced motion respected** where the cast has orbital or flourish motion
    (`prefersReducedMotion` for expansion casts) without changing hit timing.

## 3 · Anti-patterns seen in casts below the bar

These are the specific failures found when casts were compared side by side
with the references. If your cast has one, it is not done.

- **Outline-only.** The cast is a set of thin glowing lines or rings on the
  floor (a "diagram" of a spell) with no body. *Fix:* give it mass — a hero
  form with thickness and lighting, a filled field shader.
- **Specks at distance.** Lovely shards that are 10 cm across and vanish at
  8 m. *Fix:* scale the hero to the zone; use count and size so the mass reads.
- **Template sameness.** Ten casts that are the same rig with a different hue.
  *Fix:* each cast owns its silhouette and its motion; colour alone is not
  identity.
- **Static bloom.** Everything appears at impact and then only fades. *Fix:*
  a linger beat with its own motion (pulse, crawl, drip, orbit, collapse).
- **Flat blob.** A faceted, unlit, single-tone mesh (e.g. a low-poly
  explosion shell drawn in one colour). *Fix:* ramp shading, fresnel, noise
  dissolve, or a proper lit material.
- **Washed out.** Pale pastel layers with no dark deep tone; on the dark floor
  the cast looks like fog. *Fix:* the four-stop ramp.
- **Missing travel.** Effect simply appears at the target. *Fix:* a projectile,
  surge, crawl or tether that shows the path.
- **No ground.** Nothing marks the floor, so the cast floats. *Fix:* a field
  shader or decal set that stays for the linger.

## 4 · Verify (required)

1. `node --check` every file you own; `npx vite build --logLevel error
   --outDir <scratch>` from `packs/sandbox` (retry if another builder's file is
   mid-edit).
2. Your unit test in `tests/` (spawn, update to completion, hits bounded,
   reuse resets) passes with `node --test`.
3. **Capture and look.** `node tools/capture-cast.mjs <scratch> <uid> --sheet`
   (add `--module=<path>` for an unregistered expansion cast). Read the sheet
   next to a reference sheet from `docs/castables/sheets/`. Walk the checks in
   §2.1–2.4 against the frames and write down, honestly, which pass. Iterate
   until they all do. Frame 8 ≈ anticipation/travel, 20 ≈ impact, 40 ≈ linger,
   70 ≈ late linger/exit — use `--frames=` to sample your own beats.
4. Write or update the cast's storyboard in `docs/castables/` (format below).

## 5 · Storyboard format (`docs/castables/<pack>/<id>.md`)

So the next agent can understand the cast without seeing it:

```md
# <Name> — `<uid>`
Element · kind (line/zone) · range · zone radius · total screen time

## Read in one line
<what a player sees, as a sentence>

## Beats
| t (s) | Beat | On screen (shape, size in m, colour, motion) |
| 0.00–0.25 | Anticipation | … |
| … | Travel | … |
| … | Impact | … |
| … | Linger | … |
| … | Exit | … |

## Layers
1. <layer> — <geometry/material/particles>, <size>, <colour stops>, <file>
…

## Signature
<the one thing that makes this cast its own: a motion, a form, a rule>

## Palette
core #…, tint #…, body #…, deep #…

## Gameplay
hits, statuses, combat rules
```
