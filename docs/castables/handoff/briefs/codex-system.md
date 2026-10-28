# Brief: lift the shared Codex "pure element" rig to the original Linear bar

Repo: /home/user/Ability-Matrix. Other agents are editing other files in this
checkout (new casts under src/abilities/expansion-2026/<new>/, the duel work in
core/combat/ui). No state-changing git commands; the coordinator commits.

## The problem (from a visual audit of all 212 native casts)
81 Codex casts are built on one generated system: `packs/sandbox/src/abilities/codex/`
`RigHero.js`, `DetailLayer.js`, `PureBodyGeometries.js`, `LineTrail.js`, each
cast's `<Name>Ability.js` (two near-identical templates: a ~957-line line cast
and a ~900-line zone cast), `src/materials/codex/<Name>Materials.js`,
`src/assets/codex/<Name>Geometry.js` + `RigKit.js`. They were written by
`tools/gen-pure.mjs`, `tools/sculpt-pure.mjs`, `tools/pure-*.mjs`, `tools/rigs/*.mjs`.
Auditors scored them mostly 3–5/10 against the original Linear casts. Shared
failures, seen in the frames:
- hero and detail meshes are on `LAYER.VFX` with emissive/unlit shading: earth,
  metal, crystal, bone and wood solids read as **flat single-tone panels,
  outline sigils or wireframes**, unlit, casting no shadow (RigHero.js:51,
  DetailLayer.js:116);
- **no colour depth**: pale pastel bodies with no dark deep tone, washed out on
  the dark floor;
- **the same ending everywhere**: a faint translucent dome pop, then a thin
  outline ring on the floor; nothing stays on the floor through the linger;
- **outline-only** floor art (rings, sigils) instead of a filled field;
- heroes often too small (0.2–1 m) at 8 m, or too high (off the top of frame).

Audit details per uid: `docs/castables/handoff/audit/audit-group*.json`
(read them; groups 0 and 3 may still be landing).

## Read first
`docs/castable-quality-standard.md`; `docs/castables/README.md` (technique
catalogue) and storyboards `docs/castables/linear-extended/quake.md`,
`linear/glacier.md`, `linear-ext/kraken.md`; the contract
`packs/sandbox/SANDBOX_NATIVE_CONTRACT.md`; how a lit solid is done in an
original (`packs/linear-extended/src/abilities/MonolithRiftAbility.js` +
`materials/MonolithStoneMaterial.js`, and how VenomCrystalMaterial registers a
patched mesh as a shadow caster via `environment.registerShadowCasterWithPatch`).

## Your job: the systemic pass (not per-cast redesign)
Change the shared system so that every one of the 81 casts improves at once:
1. **Solid heroes are lit matter.** Per element class (solid: earth, crystal,
   frost, metal/tech, gravity, force, motion, blood, nature…; energy: fire,
   light, holy, storm, arcane, void, shadow, cosmic, sound…), hero/detail
   meshes of solid elements render on `LAYER.WORLD`, cast and receive shadows,
   and are shaded by the scene sun (lit shader or patched MeshStandardMaterial
   keeping the part fold/hinge vertex logic and `aEdge/aInfo/aStyle`), with
   the element's four-stop ramp (core/tint/body/deep) driving albedo/emissive
   so hot parts still glow. Energy elements stay emissive but gain the ramp's
   dark deep tone and a fresnel/body so they stop reading as wireframe.
2. **Colour depth.** The ramp's deep stop is actually used (body→deep across
   the form, AO in creases/edges), so nothing is pastel-only.
3. **A floor that answers and stays.** Replace the outline-ring ending with a
   filled ground field per element (scorch/frost/crack/stain/glyph burn…) that
   lands at impact sized to the zone (or along the line) and holds through
   the linger then cools out — reuse each element's existing MARK/TONE data
   (`tools/pure-settings.mjs`) and the decal system; remove/retune the thin
   dome pop so the impact reads as a solid hit (burst + light + shake).
4. **Scale & framing.** Heroes sized to the zone (or ≥ body height for line
   casts) by default, and kept below ~5 m unless the design needs height.
5. Every new value is a live editor slider (extend the shared Hero rig /
   Detail / Ground editor folders), globals honoured, pooled and
   allocation-free.

You may edit: `abilities/codex/{RigHero,DetailLayer,PureBodyGeometries,LineTrail}.js`,
`assets/codex/RigKit.js`, the 81 generated `abilities/codex/<Name>Ability.js`,
`materials/codex/<Name>Materials.js`, `config/codex/<id>.js`, and the generator
tools in `tools/` (keep them consistent with what you change so regenerating
does not undo it — or note clearly that the generated files are now the source).
Do NOT change gameplay (hits, ranges, radii, timings of hits), uids, labels,
element, or remove settings keys. The 72 hand-written Codex casts that do not
use RigHero are out of scope.

Prefer scripted, reviewed edits across the 81 files over hand edits; keep
diffs consistent. `npm test` must stay green (tests/pure-*.test.mjs,
line-trail, codex-review… pin parts of this system — update a test only when
it pins the exact old look you are deliberately replacing, and say so).

## Verify
- `node --check`; `npm test`; `cd packs/sandbox && npx vite build --logLevel error --outDir <scratch>`.
- Before/after captures of a representative set (≥ 12 casts across solid and
  energy elements, both templates), e.g. `codex/sinter codex/keystone
  codex/tensor codex/hardpoint codex/aureole codex/clangor codex/caustic
  codex/kinethalo codex/zodiac codex/raster codex/presslance codex/geodecage`:
  `node tools/capture-cast.mjs <scratch>/before <uids> --sheet` (queues for a
  machine-wide slot; Bash timeout 20 min; never copy the script). Read the
  sheets next to `docs/castables/sheets/`. Iterate until solids read as lit
  matter, the floor stays, and nothing is outline-only.
- Write partial progress early; the session may be paused by API limits.

## Final message
≤30 lines: what changed in the shared system, element classes, how the ramp
and ground work, new settings keys, files touched (counts), tests/build
results, before→after sheet paths and your honest read of the representative
set, what per-cast work remains (which casts still look like templates).
