# Brief: give one Codex template cast its own identity, to the bar

Read `upgrade.md` in this folder first; everything there applies. This brief
adds what is specific to the 78 generated Codex "pure element" casts (the
`rig` array of `../remaining-below-bar.json`).

## What is wrong with them
The shared rig pass (PR #21) gave them lit solids, a deep tone and a floor
field that stays. They still score 3–7 because they read as **one template in
different colours**: arc lines, floor grids, concentric rings, small flat
sprites, a dome pop. Colour alone is not identity. Each cast needs its own
silhouette and its own motion, readable at 8 m, that says what the spell's
name says.

## Where the files are
For uid `codex/<id>`: `packs/sandbox/src/config/codex/<id>.js` (its `label`
and `meta` say what the spell is), `abilities/codex/<Name>Ability.js`,
`materials/codex/<Name>Materials.js`, `assets/codex/<Name>Geometry.js`.
`grep -rl "'<id>'" packs/sandbox/src` finds them. The generated files are now
the source: edit them directly and never re-run `tools/gen-pure.mjs`,
`tools/sculpt-pure.mjs` or `tools/rigs/*.mjs`.

Shared helpers are off limits: `abilities/codex/{RigHero,DetailLayer,LineTrail,PureBodyGeometries}.js`
and `assets/codex/RigKit.js`. If a helper does not do what you need, add
cast-local code (a new mesh, material or geometry in your cast's own files),
or turn a shared layer off for your cast through its existing settings.

## What to build
- **A hero form at zone scale** (or at least body height along a line) that
  is the spell's noun: a sling stone is a lit rock, a pendulum swings on a
  visible arm, a cage has bars that close, a well is a pit that pulls. Lit
  solids for solid matter (`LAYER.WORLD`, shadows), emissive with a dark deep
  stop for energy.
- **Travel from the caster** that has its own shape, not a generic streak.
- **An impact** that reads as a solid hit (burst, light, a short shake) and is
  not a white blow-out.
- **A floor that is filled**, not stacked outline rings, and that stays
  through the linger.
- **A linger with its own motion** (it settles, smoulders, drains, cools) and
  does not just fade.
- Remove or turn down whatever template layers fight the new read: arc lines,
  floor grids, ring stacks, dome pops, small cog sprites.

## Rules (repeat them to yourself; they were broken often)
- Presentation only. No change to hit rules, targets, damage, radii, ranges,
  projectile speeds, or any timing that sets when hits happen.
- If a beat falls outside the default capture window, capture with
  `--frames=` instead of retiming the cast.
- Rejected every time: pale, pastel, white or neon bodies with no dark deep
  stop carrying the mass; stacks of outline rings or lines as the main read;
  detonations or pillars that blow the frame out to white; heroes off the top
  of the frame or too small at 8 m.
- Keep every existing settings key; new values are live sliders in the cast's
  own editor folder. Pooled, allocation-free per frame, `spawn` resets,
  `dispose` frees.
- List every file you changed in your final message.
