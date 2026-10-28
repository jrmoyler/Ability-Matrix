# Brief: build one brand-new Matrix Expansion castable to the original Linear bar

Repo: /home/user/Ability-Matrix (a Three.js ability sandbox). You are one of ~25
builders working **in the same checkout at the same time**, each on different
files. Never run git commands that change state (no commit, stash, checkout,
reset, add). The coordinator commits.

## Your cast
Given in the task message: uid `matrix-expansion/<slug>`, element, name, and the
design note from the Unified Combat Spec registry
(`packs/sandbox/src/combat/ucsm/registry.js`, STANDARD table, second column). It is
the "next wave" castable for its element; every element gets exactly one.

## The bar (read first, in this order)
1. `docs/castable-quality-standard.md` — the rubric. Every check in §2 must pass.
2. `packs/sandbox/SANDBOX_NATIVE_CONTRACT.md` — engine contract (ctx, phases,
   particles, decals, bursts, layers, globals).
3. Two original reference casts' code, e.g. `packs/linear-ext/src/abilities/KrakenAbility.js`
   (+ `materials/KrakenMaterial.js`) and one of `packs/linear-extended/src/abilities/{WardAbility,CelestialRendAbility,AstralVoidAbility,BalefulCascadeAbility}.js`.
4. The module format you must follow: `packs/sandbox/src/abilities/expansion-2026/borrowed-tomorrow/`
   (config.js data-only, index.js exporting `config`, `ID`, `Ability`, `buildEditor`,
   materials.js, geometry.js) and `vector-breakwater/` — including how they route
   hits through `bindExpansionCombat` (`../StandaloneCombat.js`), `impactForce`,
   `createExpansionFX`, `prefersReducedMotion`. Read `docs/expansion-combat-adapter.md`.
5. Your element's existing casts, so yours is **distinct** in silhouette and motion:
   the first-wave expansion cast of the same element and the element's Codex casts
   (`presets/catalog.json`, field `element`; storm == lightning).

## Files you own (create only these)
- `packs/sandbox/src/abilities/expansion-2026/<slug>/config.js` — data only, no
  imports; `id` camelCase of the slug; `meta: { label, accent, element, cast:'line'|'zone', hint, glyph }`
  (glyph = SVG path markup in a 100×100 box like the others); a fully commented
  settings block (60–150 keys) keeping `range, minRange, speed, cooldown, castAnim,
  lightColor, lightIntensity, lightRadius, lifetime` and `zoneRadius` for zone casts.
- `.../<slug>/index.js`, `.../<slug>/materials.js`, `.../<slug>/geometry.js` (more
  files in that folder are fine).
- `tests/expansion-2026/<slug>.test.mjs` — node:test with a mock ctx (see
  `tests/expansion-2026/borrowed-tomorrow.test.mjs`): spawn, update to completion,
  hits bounded and correct, the signature rule works, pooled reuse resets state,
  no throw with combat binding absent.
- `docs/castables/matrix-expansion/<slug>.md` — storyboard in the format of
  §5 of the standard.
Do NOT edit status.js, batch-*.js, ProductionRoster.js, index.html, presets,
README, settings.js, or anything else. The coordinator registers your cast.

## Gameplay
Implement the design note as a real rule, bounded and deterministic, in the
sandbox's terms: enemies are the target dummies (`ctx.dummies.findTargets`,
`dummy.kill(...)`, `carry/sink/release/corrode`) and, through the combat binding,
UCSM statuses/regions. Where the note mentions projectiles, constructs, allies or
deployables that the sandbox may not have, implement it against what exists
(your own sub-projectiles, the cast's own constructs, other live casts' regions,
or the dummies) and state the interpretation in the storyboard. `handlesOwnHits`
returning true is expected. A CPU wizard opponent is being added in parallel; do
not depend on it.

## Craft
This is the main point. It must look and move like a Linear original, not like a
diagram: an authored procedural hero form at zone scale, solid lit materials for
solid things, bespoke ShaderMaterials, a four-stop colour ramp, ≥5 layers, the
floor answers, five beats with identity in motion during the linger, placement
derived from settings. Avoid every anti-pattern in §3.

## Verify (required, iterate until honest pass)
- `node --check` on your files; `node --test tests/expansion-2026/<slug>.test.mjs`.
- `cd packs/sandbox && npx vite build --logLevel error --outDir <your scratch dir>`
  (failures in files you don't own: retry later).
- Capture and LOOK (you can read PNG/JPG with the Read tool):
  `node tools/capture-cast.mjs <scratch>/cap matrix-expansion/<slug> --module=abilities/expansion-2026/<slug>/index.js --sheet`
  and compare with `node tools/capture-cast.mjs <scratch>/ref linear-ext/kraken linear-extended/ward --sheet`
  (capture references once). The machine has 4 CPUs shared by many builders; a
  capture takes ~1 min — keep to about 6 capture rounds. Check the report.json
  for page errors; zero console errors is required.
- Use a scratch dir under /tmp/claude-0/ named after your slug.

## Final message (your return value)
Plain text, ≤25 lines: files written; kind/range/radius; the signature in one
line; layers; gameplay rule; test result; build result; your honest pass/fail on
each standard section 2.1–2.5 judged from your captures; path of your final
contact sheet; anything unfinished.
