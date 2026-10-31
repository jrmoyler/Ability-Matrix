# Handoff: continuing the castable upgrades

State after PR #23 (branch `claude/castables-finish-upgrades`), which followed PR #22 (merged).

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
- PR #23:
  - **37 casts raised to an honest 8:** 7 hand-authored (aetherblade, bilelance, miasma, spore, fulminant-relay, overtone-spiral, umbra) and 30 Codex template casts, each with its own lit hero, travel, impact, floor and linger. The coordinator read every after sheet.
  - **6 casts improved but still at 7**, each with a `nextFix` line in the status file (see below).
  - **Gameplay to review:** Umbra's bigger hand carries held bodies further, so they finish being consumed about 0.03 s earlier. False Floor's existing lift still floats felled dummies to the top of the frame, which fights its "drop" read; it was left alone because it is gameplay.
  - Geode Cage's presentation beats moved earlier; its hit timing is unchanged. One test assertion changed: `tests/expansion-2026/mirage-procession.test.mjs` compares the departing masks against the configured `maskSize` instead of 1.

## Still to do, in priority order
1. **6 casts at 7** (`status: upgraded-7`). Each needs a new shape, not more colour tuning; `nextFix` says what:
   - `collective/sonic`, `collective/tempest`, `matrix-expansion/mirage-procession` (two fix-up passes each already).
   - `codex/glissando`, `codex/crosscut`, `codex/masslance`.
2. **45 Codex template casts not started**, the `rig` entries with `status: not-started` (scores 5–7): katabatic, latebolt, latticeflare, lensewell, leywhip, loess, magnetar, mournhalo, needleglass, nullwell, overtone, penumbra, plumbswing, presslance, raster, reliclash, scarp, shearforce, shearorbit, shearstep, sigilvolley, sinter, slingwell, subtone, tensor, tickcage, vectorlance, whisperwell, zodiac, bindrune, caustic, censers, chronowell, hymnwell, manawell, noonblade, photonwell, prismfault, quarkspire, rotor, shardchoir, surgewell, tidebar, vowcage, keystone.
3. **Re-audit the 31 implemented mechanic moves** in `packs/sandbox/src/combat/ucsm/mechanics/`.

## How the work was run
- **Briefs** are in `briefs/`: `upgrade.md` for upgrading existing casts, `rig-upgrade.md` for the Codex template casts, `new-cast.md` for building a new one, `codex-system.md` for the shared rig.
  - A fix-up pass works best with a short extra brief. It lists the coordinator's one-line read of each cast's last after sheet and repeats the rules below.
- **Ownership:** one agent per two or three casts, and each agent owns only its casts' files. The coordinator owns registration, presets, the two snapshot fixtures and this README.
- **Rules that had to be repeated in every brief:**
  - Presentation only: no change to hit rules, targets, damage, projectile speeds or any timing that sets when hits happen.
  - If a beat falls outside the default capture window, capture it with `--frames=` instead of retiming the cast.
  - Ask agents to list every file they changed. Several casts' files are not named after their id (for example `codex/darkwell` is `DarkMatterWell*`).
  - Never edit the generated `assets/codex/<Name>Geometry.js` files: `tests/pure-rigs.test.mjs` pins them byte for byte. New geometry goes in a cast-local `<Name>SignatureGeometry.js`.
  - Keep every file importable mid-edit (config first, then materials, then ability); a half-saved cast stops other agents' captures from booting.
  - Capture each cast on its own: casting several in one session triggers combo mechanics (for example "Gravity Slingshot") that draw rings into the next cast's frames.
- **What the coordinator kept rejecting:**
  - Pale, pastel, white or neon bodies with no dark deep stop carrying the mass.
  - Stacks of outline rings or lines as the main read.
  - Detonations or pillars that blow the frame out to white.
  - Heroes off the top of the frame, or too small at 8 m.
  - Saturated red, magenta, lime or violet solids; solid matter should be lit dark material with heat or glow only at edges, cracks and seams.
  - Glassy translucent domes, bubbles and blobs, and heroes seen end-on in travel.
  - Shapes that read as a generic object (a bucket, a fin, a block) instead of the spell's noun.
  - Most first passes landed at 7 for exactly these reasons; about two thirds needed one fix-up pass.
- **Capacity:** captures queue for 2 machine-wide slots, so on a 4-CPU box keep to about 6–7 agents at a time. A group of three template casts took one agent 40–60 minutes plus a fix-up. Seven agents at once hit the 5-hour API limit once in PR #23; resume stopped agents with a message rather than starting new ones.
- **After any change:**
  - Run `node tools/extract-presets.mjs` and `node tools/extract-expansion.mjs`.
  - Re-baseline `tests/fixtures/castables-230-baseline.json` and the sandbox hash in `tests/fixtures/original-inventory.json` for the casts you changed on purpose. Check that only those casts' entries changed; every vendored source pack must stay byte-identical.
  - Run `npm test` and `npm run build`. At the end of PR #23: 909/909, and the build passes.
  - Boot-check the sandbox. A broken editor key takes the whole app down; `tests/expansion-2026/editor-keys.test.mjs` guards the expansion casts.
