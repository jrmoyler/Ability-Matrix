# Handoff: continuing the castable upgrades

State after PR #22 (branch `ccr-7d69e5b9-02yclk`), which followed PR #21 (merged).

## Done
- PR #21: 23 next-wave castables (one per element), a shared Codex rig pass over the 81 generated casts, 26 casts upgraded, the Arch-Wizard duel, the quality standard, reference storyboards and the capture tool.
- PR #22:
  - **Re-grade.** All 136 below-bar uids were re-captured with the dummy cluster and re-scored. 65 went up and none went down, but none reached 8 before this PR's upgrades.
  - **48 casts raised to an honest 8.** That covers all 7 near-misses and 41 hand-authored casts. The coordinator read every after sheet; agents' self-scores were not taken on trust.
  - **Status file.** `remaining-below-bar.json` gives each uid a `status` (`passed-8`, `upgraded-7`, `not-started`) and, where upgraded, a `newScore`.
  - **Gameplay changes the owner approved or should review:**
    - Ashen Doppelganger's coal now lands as a hit at the aimed point. The owner approved this.
    - Railgun Lance's charge went from 0.8 s to 0.5 s, inside the standard's anticipation window.
    - Umbral Guillotine's lower swing narrows its side reach from about 3.7 m to 3.1 m.
    - Tempest's shorter column lowers where lifted bodies hang, from about 5.3 m to 2.7 m.
    - Nothing else changes hits, targets, damage or hit timing. Stillpoint's 2.2 s hold, Nebula's beat lengths and Void Bloom's seed speed were restored after agents shortened them.

## Still to do, in priority order
1. **3 hand-authored casts upgraded to 7.** Each needs one fix-up pass. The fixes:
   - `matrix-expansion/mirage-procession`: the masks are small at 8 m and the violet zig-zag lanes read as line drawings.
   - `collective/sonic`: in travel the shells still read as stacked neon-magenta rings.
   - `collective/tempest`: the funnel is a translucent glassy-teal sheet, not a dense storm column.
2. **7 hand-authored casts not started**, `hand` with `status: not-started`:
   - `matrix-new/aetherblade` (6)
   - `codex/bilelance` (7)
   - `codex/miasma` (7)
   - `collective/spore` (7)
   - `matrix-expansion/fulminant-relay` (7)
   - `matrix-expansion/overtone-spiral` (7)
   - `matrix-new/umbra` (7)
3. **78 Codex template casts**, the `rig` array (3–7, mostly 4–5). They need per-cast silhouettes and motion; colour alone is not identity. Several, such as `codex/kinethalo`, still read as flat floor sigils.
4. **Re-audit the 31 implemented mechanic moves** in `packs/sandbox/src/combat/ucsm/mechanics/`.

## How the work was run
- **Briefs** are in `briefs/`: `upgrade.md` for upgrading existing casts, `new-cast.md` for building a new one, `codex-system.md` for the shared rig.
  - A fix-up pass works best with a short extra brief. It lists the coordinator's one-line read of each cast's last after sheet and repeats the rules below.
- **Ownership:** one agent per two or three casts, and each agent owns only its casts' files. The coordinator owns registration, presets, the two snapshot fixtures and this README.
- **Rules that had to be repeated in every brief:**
  - Presentation only: no change to hit rules, targets, damage, projectile speeds or any timing that sets when hits happen.
  - If a beat falls outside the default capture window, capture it with `--frames=` instead of retiming the cast.
  - Ask agents to list every file they changed. Several casts' files are not named after their id (for example `codex/darkwell` is `DarkMatterWell*`).
- **What the coordinator kept rejecting:**
  - Pale, pastel, white or neon bodies with no dark deep stop carrying the mass.
  - Stacks of outline rings or lines as the main read.
  - Detonations or pillars that blow the frame out to white.
  - Heroes off the top of the frame, or too small at 8 m.
  - Most first passes landed at 7 for exactly these reasons.
- **Capacity:** captures queue for 2 machine-wide slots, so on a 4-CPU box keep to about 6 agents at a time. A cast upgrade took one agent 15–55 minutes.
- **After any change:**
  - Run `node tools/extract-presets.mjs` and `node tools/extract-expansion.mjs`.
  - Re-baseline `tests/fixtures/castables-230-baseline.json` and the sandbox hash in `tests/fixtures/original-inventory.json` for the casts you changed on purpose. Check that only those casts' entries changed; every vendored source pack must stay byte-identical.
  - Run `npm test` and `npm run build`. At the end of PR #22: 850/850, and the build passes.
  - Boot-check the sandbox. A broken editor key takes the whole app down; `tests/expansion-2026/editor-keys.test.mjs` guards the expansion casts.
