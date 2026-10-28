# Brief: bring existing castables up to the original Linear bar

Repo: /home/user/Ability-Matrix. Many agents are editing other files in this
checkout at the same time. Never run state-changing git commands; the
coordinator commits.

You are given (in the task message) a few castable uids plus the auditor's
findings for each: score, failing checks, anti-patterns, gaps and what is
on screen today. Your job is to raise each to the bar — honestly at ≥ 8/10 on
the rubric — while keeping it the same spell (same name, element, uid, kind,
gameplay intent, settings keys that presets rely on).

## Read first
1. `docs/castable-quality-standard.md` — the rubric (§2) and anti-patterns (§3).
2. `docs/castables/README.md` and two or three storyboards in
   `docs/castables/linear*/` (if present yet), and the reference code
   `packs/linear-ext/src/abilities/KrakenAbility.js` +
   `packs/linear-ext/src/materials/KrakenMaterial.js`, plus one of
   `packs/linear-extended/src/abilities/{Ward,CelestialRend,AstralVoid}Ability.js`.
3. `packs/sandbox/SANDBOX_NATIVE_CONTRACT.md`.
4. Your casts' files: `packs/sandbox/src/abilities/<pack>/<Name>Ability.js`,
   `src/materials/<pack>/<Name>*.js`, `src/assets/<pack>/<Name>Geometry.js`,
   `src/config/<pack>/<id>.js` (expansion casts live in
   `src/abilities/expansion-2026/<folder>/`). For the 80 generated Codex
   "pure element" casts, the files were written by `tools/gen-pure.mjs` /
   `tools/sculpt-pure.mjs` / `tools/rigs/*.mjs`; edit the generated
   files in `packs/sandbox/src/` directly (they are committed) and do not
   re-run the generators. Shared Codex helpers (`abilities/codex/RigHero.js`,
   `DetailLayer.js`, `LineTrail.js`, `PureBodyGeometries.js`, `RigKit.js`) are
   shared by many casts — do NOT change their behaviour; add cast-local code
   instead.

## Files you may edit
Only the files of the casts you were given (ability, its materials, its
geometry, its config block), plus their storyboards
`docs/castables/<pack>/<id>.md` (create) and their tests (existing tests that
cover your cast must keep passing; you may extend them, or add
`tests/upgrade-<pack>-<id>.test.mjs`). Nothing else — not settings.js, Editor.js,
shared helpers, other casts, catalog or presets (the coordinator regenerates
presets from your config).

## Constraints
- Same uid, id, element, label, kind (line/zone), aim. Keep existing settings
  keys (you may add many more; you may change defaults). Every new value is a
  live editor slider in the cast's own editor folder.
- Hits keep working through the same path (DummyField / handlesOwnHits /
  expansion combat binding); bounded and deterministic.
- Pooled, allocation-free per frame, `spawn` resets, `dispose` frees.
- Fix the root gaps the auditor listed: usually a real authored hero form at
  zone scale, solid lit materials for solid things, a four-stop ramp, a floor
  layer that stays, a linger with its own motion, a visible travel.

## Verify (required; iterate until an honest pass)
- `node --check` your files; run the tests that import your files
  (`grep -rl <Name> tests/`), and `cd packs/sandbox && npx vite build --logLevel error --outDir <scratch>`.
- Capture before (first thing) and after:
  `node tools/capture-cast.mjs <scratch>/before <uids> --sheet` then `.../after`.
  Read the sheets with the Read tool next to a reference sheet
  (`docs/castables/sheets/` or capture `linear-ext/kraken linear-extended/ward`).
  4 CPUs are shared by many agents: one capture at a time, ≤6 rounds per cast.
  Zero page errors in report.json.
- Write/refresh the storyboard for each cast.

## Final message
≤8 lines per cast: what changed (hero/material/ground/linger/travel), new
settings keys count, tests run, build, before→after honest score, path of the
after sheet, anything left short.

## Notes added by the coordinator
- Audit findings for your uids: `docs/castables/handoff/remaining-below-bar.json`
  (and `docs/castables/handoff/audit/audit-group*.json`). Some low scores came from the old capture
  setup (no bodies in the zone; tall heroes off the top of frame). The tool
  now stands 7 dummies in a cluster where the cast lands (default
  `--targets=cluster`); use `--distance=11` for tall casts. Take your "before"
  with the current tool so you judge the cast fairly, then fix what is really
  below the bar — a target-dependent cast must still read before it finds a host.
- Reference storyboards, sheets and a 26-technique catalogue are now in
  `docs/castables/` — use them.
- Captures: only the repo's `node tools/capture-cast.mjs` (machine-wide queue;
  Bash timeout 20 min; never copy it). Write progress to disk early; the
  session may be paused by API limits and resumed.
- The shared Codex rig (RigHero/DetailLayer and the 81 generated pure casts)
  is being upgraded by another agent — do not touch those files.
