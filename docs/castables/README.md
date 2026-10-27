# Castables — written references of the original Linear casts

The three original packs — `linear`, `linear-ext`, `linear-extended` — are the
quality bar for every castable in the matrix
([`docs/castable-quality-standard.md`](../castable-quality-standard.md)). This
folder describes each of them **in words, metres, seconds and hex codes**, so an
agent that cannot see the screen can still understand what the bar looks like,
and an agent that can see has the frames next to the words.

## How the folder is organised

```
docs/castables/
  README.md                 ← this file: index + craft techniques catalogue
  linear/<id>.md            ← one storyboard per cast of the `linear` pack
  linear-ext/<id>.md        ← … of `linear-ext` (incl. the three self buffs)
  linear-extended/<id>.md   ← … of `linear-extended`
  sheets/<pack>__<id>-sheet.jpg
                            ← four-frame contact sheets of the 12 §1 reference casts
```

New or upgraded casts add their own storyboard in the same format under their
own pack folder (`docs/castables/<pack>/<id>.md`).

Every storyboard was written from two sources: the cast's code (ability class,
materials, geometry builders, its block in `packs/<pack>/src/config/settings.js`)
and frames rendered in the real sandbox with `tools/capture-cast.mjs` (default
frames 8/20/40/70, plus a dense pass at 4/10/16/24/34/48/64/90 for the twelve
references). Numbers are the shipped defaults; every one is a live slider.

## How to read a storyboard

- **Header line** — element · cast kind (line / zone / gate / ring / scribe / self) ·
  range (and the distance the capture cast at: `minRange + 0.7·(range − minRange)`)
  · zone radius · total screen time with its parts.
- **Read in one line** — what a player sees, as one sentence. If your new cast
  cannot be described this way, it has no identity yet.
- **Beats** — `t (s)` is seconds from the moment the cast spawns (confirm), at
  `settings.global.lifetime = 1` and `speed = 1`. Travel time is capture
  distance ÷ `speed`. The five beats of the standard (anticipation → travel →
  impact → linger → exit) are named in the Beat column; casts with sub-beats
  (bloom, hammering, finale, charge) name them.
- **Layers** — each layer with its geometry/material/particle shape, size,
  colour stops and the file that owns it (paths are relative to
  `packs/<pack>/src/`; the sandbox runs byte-identical copies under
  `packs/sandbox/src/vendor/…` and `packs/sandbox/src/abilities/…`).
- **What the capture shows** — an honest read of the rendered frames at the
  8 m capture camera, which sits *behind* the caster looking downrange (line
  casts are therefore foreshortened; zone casts are seen at ~45°).
- **Signature** — the one thing that makes the cast its own.
- **What makes it the bar** (references only) — 3–6 craft decisions to copy,
  stated concretely enough to reuse without seeing the cast.
- **Palette** — the four-stop ramp (core → tint → body → deep) taken from the
  settings hex values.
- **Gameplay** — how hits are resolved (`DummyField` from the published line or
  circle, or `handlesOwnHits` for casts that aim / grip / consume themselves).

Frame ↔ time: the capture runs a fixed 30 Hz clock, so frame *n* ≈ *n*/30 s
after spawn (f8 ≈ 0.27 s, f20 ≈ 0.67 s, f40 ≈ 1.33 s, f70 ≈ 2.33 s,
f90 = 3.0 s).

## Index

★ = one of the twelve §1 reference casts (contact sheet in `sheets/`).

INDEX_TABLE

## Craft techniques catalogue

Synthesised across all originals. Each technique names the reference(s) that
demonstrate it and where in the code it lives (paths under `packs/<pack>/src/`).
When you design a new cast, pick deliberately from this list — a cast at the bar
uses at least five of them.

### A · State, placement and timing

1. **Records store dice, not dimensions.** A per-instance record holds unitless
   fractions (along the line, lateral −1..1, bearing, radial 0..1) and jitters,
   plus event timestamps; every metre, radian and second is resolved from
   `settings.<id>` inside `update`, which also runs on a zero-length frame, so
   sliders reshape a cast that is already standing while paused.
   *Venom* (`abilities/VenomSurgeAbility.js`, class comment + record pool),
   *Ice* (`abilities/IceAbility.js` `records`), every original.
2. **Derived placement — the arc identity.** Compute where things land from the
   zone instead of tuning it: an arc of length `L` turning through `Θ = π`
   lands its tip `2L/π` inward on the floor, so arm length `= reach · (π/2) · R`
   strikes the centre at any radius, and the impact point is known on the CPU
   for free. *Kraken* (`abilities/KrakenAbility.js#_armLength`,
   `materials/KrakenMaterial.js` header).
3. **Seat everything as a fraction of `zoneRadius`; keep the middle open.**
   Ring at `ringSeat·R`, skirt band behind it, `coreShare` 0 — a wall you look
   *into*. Floor fields and veils are ability-owned meshes (decals capture
   their radius at spawn). *Glacier*, *Pyre* (`settings.<id>.ringSeat`,
   `skirtSeat`, `fieldBoundary…`), *Kraken*.
4. **Sweep-ordered eruption from the arrival bearing.** Delay =
   `|angleDelta(bearing, entryAngle)|/π · sweepTime + stagger·dice`: the ring
   closes round both sides from where the front came in; exit sweeps back the
   same way. *Glacier* (`GlacierAbility#_scheduleEruption`), *Pyre*, *Kraken*.
5. **Shape a line as a function of `along`.** Width, height and density ramp
   `near → far` with a curve exponent, a `peak` swell over the last
   `peakWidth`, then a radial starburst cluster with `stagger × radius` lag.
   *Venom*, *Quake* (`settings.venom/quake` width*/height*/peak*/burst*),
   *Ice*.
6. **One clock, thresholds on it.** A single "time since landing" drives every
   sub-beat via `saturate((t − start)/duration)`; nothing has its own timer, so
   the sequence scrubs. *Rend* (`CelestialRendAbility#_rendAt`, `_markTime`),
   *Cascade*, *Growth* (staggered `*Delay`/`*Time` keys).
7. **Anticipation by charge or by implosion.** Either a 0..1 `charge` that
   gates travel and drives every wind-up layer (*Beam*, `BeamAbility#charge`,
   `advance()` refusing to leave the hand), heat as a late-biased power of
   flight progress (*Meteor*, `uCharge = u^chargeCurve`), or the opposite
   impulse first — inflate, pull inward, then pinch to the blast (*Astral*,
   `coreSwell`/`corePinch`, blast at 55 % of the pinch).
8. **Accelerating arrivals.** `arrival = end − window · dice^bias`, bias > 1:
   lonely strikes become a hail that the detonation lands on. *Rend*
   (`settings.rend` shard block, `CelestialRendAbility` shard scheduling).
9. **Per-instance cycles with scatter, then one unison beat.** Each limb runs
   its own rear → strike → press → peel clock offset by `cycleScatter`; a
   `finaleLead` overrides the scatter for one synchronised slam at ×1.7 power.
   *Kraken* (`settings.kraken` beat block).
10. **One shared envelope with threshold events.** A single per-frame value
    (`_beat` heartbeat, `_boil`, `_swell`, `_churn`) is written into every
    material, the light, the camera and emitter rates; upward crossings of a
    threshold fire discrete bursts. Never free-running sines per layer.
    *Ward* (`WardAbility.js#heartbeat`, `_beatFx`), *Astral*, *Acid*, *Ink*.
11. **Closed-form motion, not integration.** Ballistic chunks solve their own
    landing time (`½g·t² + vy·t + (y0 − rest) = 0`) and are placed from
    `min(elapsed, landing)`; trails are sampled from the analytic trajectory
    (or the orbit sampled backward in time), so slider changes rewrite the
    whole flight. *Meteor* (`MeteorAbility#_chunkFlight`), *Fire Boost* orb
    trails (`materials/EmberOrbMaterial.js`).
12. **Element-specific easing.** Ice punches past full height and springs back
    (`riseOvershoot`), fire rises monotonically then creeps (`_emergence`, no
    overshoot term), arms arrive coiled and uncoil. *Glacier* vs *Pyre*
    (`PyreAbility#_emergence`), *Kraken* (`coilCurl`).

### B · Form and geometry

13. **Parameter-space geometry placed in the vertex shader.** Buffers are
    `(t, a)` grids with no metres; the vertex stage maps them to world space
    from the instance index and shared uniforms (`frustumCulled = false`,
    model matrix identity, matching `MeshDepthMaterial` for shadows).
    *Growth* (`assets/GrowthGeometry.js`, `materials/GrowthVineMaterial.js`),
    *Cascade*, *Rend* (`assets/CascadeGeometry.js`, `assets/RendGeometry.js`),
    *Thunder* bolt (`createBoltRibbonGeometry` + `LightningMaterial`).
14. **One curvature profile, many poses.** A limb is a straight tube bent per
    vertex by integrating `θ(s) = A·s + C·s² + W·sin(2πfs + φ)·s` (12
    trapezoid steps); coil / idle / rear / strike are `(A, C, W)` triples.
    *Kraken* (`materials/KrakenMaterial.js#centreAt`,
    `createTentacleGeometry`).
15. **Shared path / uniform block by identity.** Several materials include the
    same GLSL path function and receive the same uniform object, so leaves stay
    clipped to stems, thrown blades match the crown, and five beam passes stay
    welded. *Growth* (`vinePoint/vineFrame`), *Cascade* (`_blades`), *Beam*
    (`beamRadius/beamAxis` in `materials/BeamMaterial.js`).
16. **A shape builder that refuses the default primitive.** Crystals with
    jittered shared facet angles, bend and taper (`createCrystalGeometry`);
    slabs with `flatten`, sheared break plane and chamfer
    (`assets/MonolithGeometry.js`); asteroids with planar cuts and craters
    (`createAsteroidGeometry`); lens-section blades (`CascadeGeometry`). *Ice*,
    *Glacier*, *Pyre*, *Quake*, *Meteor*, *Cascade*.
17. **The floor tears open in real geometry.** Fissure ribbons generated once in
    a unit disc and scaled by `uRadius` in the vertex shader, drawn as a hot
    core + wide additive underglow with instanced basalt lips (*Meteor*,
    `effects/GroundFissures.js`); voronoi slab plates shrunk to their
    centroids, heaved and canted by uniforms (*Venom* `effects/ShatterPlate.js`
    + `assets/ShatterGeometry.js`; *Quake* `effects/RiftCrater.js`).

### C · Material and light

18. **Grow and die by a noisy per-instance discard front.** `aGrow` (0 floor →
    1 tip) discards above a noisy cut with a lit lip; `aShatter` thresholds a
    per-fragment chunk id (voronoi in blade space + face-normal hash) so blades
    lose whole plates; `aChar` eats from the tip down with an ember rim and
    ash behind. *Glacier* (`materials/GlacierMaterial.js`), *Pyre*
    (`materials/PyreMaterial.js`), *Growth* (wither front).
19. **One field → one four-stop ramp.** Compute a single scalar (temperature,
    density) from warped fbm in the object's own space and index a
    core → tint → body → deep ramp; one slider re-tempers coherently. *Pyre*
    (`PyreMaterial` flame field), *Meteor* black-body trail
    (`materials/VolumetricFireMaterial.js`), every particle system's A→D
    lifetime gradient.
20. **Local vs world noise space, on purpose.** Sample in *local* space for
    detail that must move with the body (meteor seams, venom flaws, frost
    veining); in *world* space for detail that should look quarried from one
    block or keep physical size (ice fracture, venom cleavage, quake
    triplanar scan). *Meteor* (`materials/MeteorMaterial.js` header), *Ice*,
    *Venom*, *Quake* (`materials/MonolithStoneMaterial.js`).
21. **Chromatic dispersion from three fresnels.** Evaluate the rim term at three
    slightly different exponents for R, G, B — a real prism fringe in two
    lines. *Glacier* (`dispersion`), *Venom* (`VenomCrystalMaterial`).
22. **Volume brightness on `N·V`, not `1 − N·V`.** A beam or glow ball is
    brightest where the view ray crosses most of it: `pow(|N·V|, k)` for the
    body, a small rim on top; for tubes, stack halo (rim only) + shell
    (rim-weighted) + core (axis-weighted). *Beam* (`BeamMaterial` HALO/SHELL/
    CORE), *Rend* (`RendPillarMaterial`), *Venom* kernel
    (`VenomCoreMaterial`).
23. **Double-walled translucent barriers.** Draw one open cylinder twice — back
    faces then front faces, alpha blended — so the far wall is seen through the
    near one; shape the silhouette (barrel, rim flare, lobes, beat throb) in
    the vertex stage; hot hoops at floor and rim for legibility. *Ward*
    (`materials/WardBarrierMaterial.js`).
24. **Solid things are lit matter.** Rock, wood, crystal, flesh and blades are
    `MeshStandardMaterial` (or a lit `ShaderMaterial`) on `LAYER.WORLD`,
    casting and receiving shadows, catching the HDR probe — stylisation
    injected on top via shader patches. *Quake*, *Ice*, *Meteor*, *Growth*,
    *Cascade*, *Kraken*, *Rend* shards (the only solid in a shot of light
    gives it scale).
25. **Physically-motivated primitives and raymarched volumes.** Billboard where
    the physics is view-symmetric (black-hole shadow, premultiplied black);
    raymarch gas that must be seen through and clipped against the scene,
    with an analytic bound, early-out and a live step count; get spirals from
    differential rotation `uWind / r`. *Astral* (`SingularityMaterial`,
    `AstralNebulaMaterial`), *Acid* (`ToxicMistMaterial`), *Ink*
    (`InkVolumeMaterial`), *Meteor* trail.
26. **Two layers welded by one uniform.** Pass one layer's world position or
    colour into another's material — the venom kernel lights the gems
    (`uCore`), the column lights the shards (`shardBeamBleed`), the heart
    lights the crown (`bladeGlow`). *Venom*, *Rend*, *Cascade*.

### D · The world answers

27. **The floor is a place, and it outlives the spell.** An ability-owned field
    shader under the zone (frozen sheet, molten crater, drowned rift, magma
    voronoi, sigil) plus decals laid *along the travel path* (rime, scorch,
    slick, stain) and at impact, lasting longer than the cast (meteor scorch
    8 s vs 4.5 s cast). *Glacier* (`FrostFieldMaterial`), *Pyre*
    (`EmberFieldMaterial`), *Kraken* (`AbyssFieldMaterial`), *Ward*
    (`WardGroundMaterial`), *Meteor*.
28. **Air motion that names the element.** Snow falls through the frost crown
    and mist sinks; embers ride an updraft column in the fire crown; marine
    snow drifts near-neutral in the kraken ring; gas rolls (rise 0.22) in
    venom. *Glacier*, *Pyre* (`updraft*`), *Kraken* (`mote*`), *Venom* (`gas*`).
29. **Distortion as a layer.** A proxy on `LAYER.DISTORTION` — heat haze,
    pressure ring, lens that includes the cast itself — is the one effect
    emissive geometry cannot fake. *Astral* (lens), *Quake*
    (`effects/KineticWarp.js`), *Ward*, *Acid*, *Rend*, *Ink*; *Pyre* ships
    it at 0.
30. **Impact punch scaled by globals, and restraint where it fits.** Shake ×
    `explosionIntensity × cameraShake`, screen flash in the cast's tint, light
    boost on the impact frame, continuous `rumble` during travel and
    `holdShake` during the linger; geology keeps its flash at 0.045 and ink at
    0.05. *Meteor*, *Ice* (`onImpact`), *Quake*, *Ink*.
31. **Bodies tell the story.** Casts that grip handle their own hits: fell with
    zero impulse and hold (*Rend*), knock inward, lift and consume (*Astral*),
    float and sink (*Ink*), ragdoll limp and corrode (*Acid*), slice at the
    waist on the frame the projectile arrives (*Growth*, *Cascade*).
