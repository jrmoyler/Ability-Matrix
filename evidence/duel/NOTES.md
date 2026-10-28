# Arch-Wizard duel and targets: capture notes

These frames come from the built sandbox (`vite build`, served by `vite preview`), driven by headless Chromium (software WebGL) on a fixed 30 Hz clock, at 1440×900 (scale 0.75) and 390×844. JPEG, each under 100 KB.

| File | Shows |
|---|---|
| `02-telegraph.jpg` | The wizard planted mid wind-up (gesture up) with the lane marker for Solar Lash filling toward release. HP bars at the top, its own bar over its head. |
| `03-cpu-hits-player.jpg` | The CPU's Solar Lash lands on the soldier. The referee hit is shown by the red flash, the toast `Hit by Solar Lash · −13` and You at 87/100. |
| `04-wizard-hit.jpg` | The player's Solar Lash reaches the wizard: 80/90. The wizard rim flashes, and the unified state put `burning` on it. |
| `05-round-over.jpg` | The lethal blow: the wizard ragdolls and burns (a real `Dummy#kill`), and the banner offers Rematch / End duel. |
| `06-archetypes-line.jpg` | Line formation with one of each archetype: Standard (cyan), Armored (gold rim and helm, sparking as it shrugs a blow off), Runner (green, band), Giant (1.35×, horns), Caster (violet, hat). |
| `07-panels-1440.jpg` | Duel panel in Custom, filtered to "blink": both blink casts are disabled with the reason. Mechanic notes below it. Caster dummies with their shield bubbles up in a Cluster. |
| `08-watch-demo.jpg` | Watch mode: the wizard winds up a line cast on a Cluster of dummies, with no player input. |
| `09-panels-390.jpg` | 390 px: panels collapsed or bounded, HP bars above them, no horizontal scroll. |

The scripted checks produced these results:

- A 60 s Archmage duel with a native cast, a hosted-pack cast, a Matrix Expansion cast and three mechanics fired 27 casts, all accepted, and landed 16 hits on the player, with **0 console errors**.
- In each of the three runs, the page logged 0 errors.
- After a duel stops, no status badge lingers.
- At 390 px, `scrollWidth` does not exceed the viewport.

The wizard-idle, gauntlet, cluster, scatter and ring frames were taken and reviewed, but were left out to keep this set to the most informative 8.
