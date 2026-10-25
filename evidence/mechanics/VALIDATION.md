# Foundational mechanics — validation evidence

Validated 25 October 2026 against base `cdb861f070e34f99046673241e66ec047e608cc7`.

## Results

| Check | Result |
| --- | --- |
| `npm test` | **116 passed, 0 failed**, including 20 new mechanic tests |
| `npm run build` | **Passed** for seven Three.js packs, Atlas, preset extraction and PWA staging |
| Existing catalog/presets | 230 existing castables unchanged; timestamp-only regeneration removed |
| Existing source engines | Five vendored engines remain byte-identical to their source packs |
| Idle mechanic compatibility | All 230 existing castable event contracts produce byte-identical combat results with managers attached versus unattached |
| Deterministic replay | Identical commands/events produce identical state and cues across 30/60/120 FPS partitions |
| Browser | **8 checks passed; zero page/console errors** |
| Cleanup | Zero live mechanic presentation objects after reset |

Raw results: [tests.txt](tests.txt), [build.txt](build.txt), [browser.json](browser.json).

## Browser procedure

Reproducible script: `tools/mechanics-smoke.mjs`. Requires Playwright/Chromium
(`npm install --no-save playwright`, `npx playwright install chromium`); run with
`node tools/mechanics-smoke.mjs` from the repository root after root and sandbox
`npm ci`. `PLAYWRIGHT_MODULE` may point to an existing module. The script starts
and stops its own local Vite server and Chromium instance.

The browser test uses actual button/keyboard/canvas input for anchor placement,
stance activation/movement/finisher, terrain placement and counter activation.
It drives the normal `App.frame` simulation with a fixed 1/30 s test clock, renders
sampled frames, and reads public scene/UCSM state to assert outcomes. This avoids
software-rendering wall time expiring short counter windows during automation.

A real `codex/maelstrom` cast is selected through the existing bridge and dispatched
through `App._cast` to supply the water region for Storm Catalyst. Its heavy legacy
visual is retired after the footprint lands; no water region or reaction is
injected. The catalyst is then selected and fired with normal pointer input. The
render shows the resulting **Storm Conduction** reaction feed. The optional drill
runs a real hostile telegraph; the counter is entered with keyboard/canvas input
against its countdown. The caster remains at 100% health after the strike.

Software environment: Chromium 134 / SwiftShader, 1440×900 viewport, 0.75 device
pixel ratio, 1024 shadow map. The mobile check uses 390×844. The on-screen 30 FPS
readout is driven by the test clock, **not a measured hardware frame rate**. These
captures are functional/visual evidence, not Steam Deck/mobile GPU certification.

## Inspected renders

- [Startup controls](boot.png)
- [Infernal Circuit — three anchors and three linked edges](weave.png)
- [Aegis Exemplar — caster-following armor](stance.png)
- [Shatterpoint Reversal — active frost guard](counter.png)
- [Continental Uprising — sculpted cover and walkable ramp](worldshape.png)
- [Storm Catalyst — emitter and real Storm Conduction](convergence.png)
- [Incoming attack drill](drill.png)
- [Mobile layout](mobile.png)

The inspected renders show distinct silhouettes and materials for the five moves.
The terrain query reported blocked swept traversal and 0.65 m center height.
Clear removed all mechanic visual instances. The geometry disposal test verifies
that every shared geometry/material receives its dispose event.

## Defects caught and corrected

- Existing X/V/B shortcut collisions: mechanic shortcuts now require Alt.
- Help-panel overlap: mechanics panel repositioned and collapsible.
- Character animation reset of terrain Y: sampled height reapplied after animation.
- Perfect-counter phantom stance banking: counter filtering precedes banking.
- Partial counter weakening unrelated targets: reductions are target-specific.
- Duplicate target damage: target IDs deduplicated before resolution.
- High-speed link crossing: swept target paths checked each tick with a per-owner
  contact cooldown, so multiple edges cannot multiply a crossing's damage.
- Inward terrain winding: outward normals checked against the collider in a test.
- Counter geometry growing slower than its perfect window: active guard now appears
  at its full collision-readable silhouette immediately.
- Failed placement spending full cost/cooldown: validation failures refund reservation.

## Explicit limits

No assertion is made that every legacy renderer/animation is deterministic, nor
that all 230 castables received a new manual visual review. Regression coverage
for those casts is the shared combat contract plus the existing source, preset,
geometry and integration suites. No multiplayer authority, rollback, navmesh
baking or target-device performance certification is introduced.

Only the five implemented UIDs are selectable. The remaining **156 proposals**
(46 standard and 110 mechanic) stay explicitly unplayable.

Final mobile follow-up: after resizing, two normal simulation/render frames are
explicitly advanced before capture. The panel is positioned below the existing
intro card. This follow-up had zero browser errors. The 116-test suite and sandbox
production build were rerun after the CSS adjustment; both passed. Vite still
reports a >2 MB chunk-size advisory; it is not a build failure.
