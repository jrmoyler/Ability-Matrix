# Handoff: continuing the castable upgrades

State after PR #21 (branch `claude/castables-upgrade-standardize-pw8sid`).

## Done
- 23 next-wave castables, one per element, live through `batch-d.js`.
- Shared Codex rig pass over the 81 generated casts (lit solids, deep tone, a floor field that stays).
- 26 casts upgraded one by one (listed in the PR description).
- The Arch-Wizard duel and the dummy roster, the quality standard, reference storyboards and the capture tool.

## Still to do, in priority order
1. **Re-grade before upgrading — done 2026-10-30.** All 136 remaining uids were re-captured with the current `tools/capture-cast.mjs` (dummy cluster) and re-scored against `docs/castable-quality-standard.md`. `remaining-below-bar.json` now holds the fresh scores (`nearMiss`, `hand`, `rig`, each worst first, with `oldScore`). 65 went up and none went down, but **none reached 8**: near-misses 5–7, hand-authored 4–7 (34 at 6), Codex rig 3–7 (mostly 4–5). The common gaps are unchanged: flat or unlit heroes, no travel from the caster, a linger that only fades, and the shared rig look. `audit/` keeps the old scores for history.
2. **Seven near-misses** (upgraded, honest score under 8):
   - `matrix-expansion/toxin-evolution`: the membrane is all additive glow; it needs a solid dark body.
   - `matrix-expansion/thunderhead-parasite`: the cloud is a smooth pale puff; it needs cauliflower or volumetric structure and a dark base.
   - `atlas/relay`: there is no solid, lit hero form.
   - `codex/glyphs`: the floor is still outline rings, and the final pillar blows out to white.
   - `matrix-expansion/adaptive-fabricator`: the bolt is short and hard to read, and the housing leans cyan.
   - `matrix-expansion/temporal-mortgage`: the coils are packed so tight the spring reads as a drum.
   - `matrix-new/mirage`: the reflection is faint, and the lake still reads ring-heavy.
3. **51 hand-authored casts at ≤ 6**: `remaining-below-bar.json` → `hand` (worst first).
4. **78 Codex template casts**: `remaining-below-bar.json` → `rig`. They need per-cast silhouettes and motion; colour alone is not identity. Several, such as `codex/kinethalo`, still read as flat floor sigils.
5. **Re-audit the 31 implemented mechanic moves** (`packs/sandbox/src/combat/ucsm/mechanics/`).

## How the work was run
- **Briefs** are in `briefs/`: `upgrade.md` for upgrading existing casts, `new-cast.md` for building a new one, `codex-system.md` for the shared rig.
- **One agent per two or three casts**, and each agent owns only its casts' files.
- **The coordinator owns** registration, presets, the two snapshot fixtures and the README.
- **Captures queue for 2 machine-wide slots.** On a 4-CPU box keep agents to about 6 at a time. About 20 at once used up the API session limit three times in this PR.
- **After any change:**
  - Run `node tools/extract-presets.mjs` and `node tools/extract-expansion.mjs`.
  - Re-baseline `tests/fixtures/castables-230-baseline.json` and the sandbox hash in `tests/fixtures/original-inventory.json` for the casts you changed on purpose. Every vendored source pack must stay byte-identical.
  - Run `npm test` and `npm run build`.
  - Boot-check the sandbox. A broken editor key takes the whole app down; `tests/expansion-2026/editor-keys.test.mjs` guards the expansion casts.
