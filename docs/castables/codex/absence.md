# Absence Lance — `codex/absence`
Void · line · range 2–18 m · ≈2.9 s on screen (≈0.45 s travel at 30 m/s + 1.25 impact + 1.25 fade)

## Read in one line
A black obsidian lance with a violet-rimmed cruciform head forms at the hand and flies at chest height down the line; behind it the floor is simply gone — a black slot with crumbling, violet-seamed lips — and at the end the lance drives into the ground and stands, then the line closes up behind it and the lance is unmade from the butt to the buried tip.

## Beats
| t (s) | Beat | On screen |
|---|---|---|
| 0.00–0.14 | Anticipation | The lance forms at the hand (length 35 → 100 %), tip ahead of the fist. |
| 0.00–0.45 | Travel | 6.2 m lance (cruciform head ≈1.2 m across) rides the head at 1.5 m, nose up 0.18 rad and turned 0.4 rad across the aim so its length shows from behind the caster,, diving over the last 22 % of the line. Behind it the unmade line opens: a 1.15 m black strip, lips crumbling, violet seam; flakes torn up out of its lips near the head. Bodies on the line are cut as the head passes (unchanged). |
| 0.45 | Impact (plant) | The lance pitches down and drives just its tip (0.1 m) into the floor at the end, standing at 0.62 rad, turned 0.55 rad across the aim (butt ≈3.5 m up, the whole head above the floor among the bodies), quivering; tip glows; 40 black chips + dust ring, dark crater decal 1.6 m, shake 0.35, light +6. No dome flash (burst off, flash 0.04). |
| 0.8–2.4 | Linger | From 0.35 s after the plant the line closes from the caster's end toward the lance (lips draw together over a 2.5 m front, 1.8 s). |
| 1.7–2.65 | Exit | From 1.25 s the lance is unmade butt → tip behind a white-hot cut, shedding black flakes and violet motes; wake scorches fade. |

## Layers
1. Lance — lofted cruciform solid, `LAYER.SHAPED`, casts shadow, lit obsidian shader with rim, edge seams, unmaking front (`createAbsenceLanceSpearMaterial`).
2. Unmade line — floor strip shader, opens behind the head and closes (`createAbsenceLanceTrenchMaterial`).
3. Particles — torn flakes and plant chips (CHIP, dark), unmaking motes (SOFT), template dust/streaks reduced.
4. Engine — wake SCORCH decals every 1.6 m, plant crater, residue stain, shake, light.
Template body / voice / rig / glyph pieces / field / ribbon / scar switched off through their own keys.

## Signature
The floor behind the lance is not stained but missing, and it heals from the caster's end while the lance is erased.

## Palette
hot #e6e0ff → rim #6a55f0 → obsidian #3a2e66 → deep #05030c; void #010003.

## Gameplay
Unchanged: hits during travel at the head (hitRadius 1.15), slice, thrown along the aim.

## Upgrade notes
Before (5/10): short violet shard, scattered glyph slivers, dome flash. After: lit obsidian lance in flight → black unmade line → planted lance → line closes, lance unmade. Template body, voice, rig, pieces, field, ribbon, scar, lens and burst dome off by their own keys; 36 new keys in editor folders 15–16. Presentation only.
After sheet: `/tmp/claude-0/-home-user-Ability-Matrix/174b9a5c-e697-5786-9cd6-44ec7499a4e1/scratchpad/agents/R7/v4/codex__absence-sheet.jpg`. Honest score 7–8: the planted black lance and the black unmade line read; the lance is thin in flight from behind (an X), and the head is half-buried when planted.

## Fix pass (coordinator)
Lance 4.8 → 6.2 m with a broader head; planted shallow (0.62 rad, tip buried 0.1 m) and turned across the aim so the cruciform head and the full length show; flies nose-up and crabbed across the aim. Obsidian body darkened (#1c1636) with a cold rim light (#a8c8ff, a tight fresnel band) and thin violet seams only on the true blade edges. 5 more keys (colorLanceCold, lanceColdRim, lancePlantYaw, lanceFlightYaw, lanceFlightPitch), all in the editor.
After sheet: `/tmp/claude-0/-home-user-Ability-Matrix/174b9a5c-e697-5786-9cd6-44ec7499a4e1/scratchpad/agents/R7/fix/a2/codex__absence-sheet.jpg`. Honest 8.
