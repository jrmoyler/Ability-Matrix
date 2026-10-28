# Collective Ability Matrix

**279 castable abilities** (274 abilities, 3 buffs, 2 summons) from 10 groups: the original 230, **sorted into 23 elements, ten each**, and 49 Matrix Expansion casts (every element has at least two), plus 11 character moves (walk, run and dash among them) and 7 archived effects, all in **one sandbox**: one scene, one character and one set of target dummies.

Open the matrix, pick any ability, cast it, tune it, and copy its settings as a preset for your own Three.js games. Walk the caster around the arena while you do it.

## Install it as an app

The hosted matrix is a PWA: it installs on phones, tablets and desktops and can run with no connection.

- **First visit** opens a short guide (reopen it any time from **Guide**) that covers casting, moving, presets, and installing.
- **Install.** Chrome, Edge and Android show **Install app** in the header. On iPhone and iPad use Share, then Add to Home Screen. Safari on macOS uses File, then Add to Dock. Firefox on desktop cannot install web apps.
- **Offline.** The guide's last step has **Download for offline** (about 65 MB: every model, texture and preset). The page, catalog and anything you have already cast are also cached as you use them. The download is resumable.
- **Updates.** Each deploy is a new release. Installed copies notice it, keep only the files that changed, and show a **Reload** bar so a new version never lands mid-cast.

How it fits together:

| File | Role |
|------|------|
| `manifest.webmanifest`, `icons/` | name, colours and icons (`node tools/make-icons.mjs` regenerates the PNGs; the output is committed) |
| `sw.js` | precaches the shell per release, caches `packs/` and `presets/` on use, keeps big files across releases when their hash is unchanged |
| `tools/make-precache.mjs` | run by `stage-site.sh`: writes `site/precache.json` (hash and size per file) and stamps the release into `site/sw.js` |

An unstamped `sw.js` (a source checkout, `vite` dev) is a pass-through, so local work never serves stale files. Service workers need HTTPS or `localhost`; test the real thing with `npm run build && npx serve site`.

## One sandbox

`packs/sandbox` is the single page that runs everything. The matrix (`index.html`) embeds it and acts as its picker.

| Group | Runs on | Count | Notes |
|-------|---------|-------|-------|
| Collective | sandbox engine (native) | 12 | Collective originals |
| Matrix New | sandbox engine (native) | 12 | New: shaders, rigs and dummy reactions at Collective quality |
| Ability Atlas | sandbox engine (native) | 10 | New: the ten Atlas mechanics, rebuilt on the full engine with the character and dummies |
| Elemental Codex | sandbox engine (native) | 152 | New: every element filled out to ten castables. 72 were written by hand; the 80 pure-element casts are generated (see Procedural rigs) |
| Linear | vendored `linear` engine | 6 | |
| Linear Ext | vendored `linear-ext` engine | 7 + 3 buffs | Gate, ring and scribe aims; Electric, Magic and Fire boosts on the character |
| Linear Extended | vendored `linear-extended` engine | 10 | Includes the Cyber Serpent model |
| Hand Cast | vendored `handcast` engine | 9 | Includes the drone, monowheel and phoenix rigs; the two summons are drivable |
| Ability Casting | vendored `casting` engine | 9 | The shark, wolf, dragon, gyroscope, amethyst, tome and reliquary rigs, with ragdolls |
| Matrix Expansion | sandbox engine (native) | 49 | Live: casts with their own combat rules (echoes, inherited marks, recorded paths, deployed sentries) through the expansion combat adapter, including one next-wave cast per element. See [Matrix Expansion](#matrix-expansion--49) |

### How the source packs run inside it

The five source repos each ship their own copy of the particle, decal, burst, aim and pooling systems, and those copies drifted apart. Their abilities are written against their own copies. So the sandbox does **not** port them; it runs each one verbatim:

- **Vendored code.** `packs/sandbox/src/vendor/<pack>/` is a byte-for-byte copy of `packs/<pack>/src`; the test suite checks this.
- **Own systems.** Each pack keeps its own AbilityManager, ParticleEngine, DecalSystem, BurstSystem, AimController, settings and editor folders. They are hosted by `src/sandbox/createRuntime.js`.
- **Shared scene.** All packs share the scene, camera, lighting, environment, character, camera shake, screen flash and target dummies. The host frame uniforms (clock, depth and light direction) are copied into each pack every frame.
- **Loaded on demand.** A pack's engine loads lazily the first time one of its abilities is picked.

Every ability is addressed by uid: `<pack>/<id>`, for example `casting/dragon` or `atlas/stillpoint`.

### Pack-only features

Two features stay in their original packs and are not in the hosted sandbox:

- **Hand-tracking cast** (Hand Cast and Ability Casting, `M`). It needs a webcam.
- **Duel Hall burn** (Ability Casting, `` ` ``). It needs that pack's gothic hall scene.

## What's here

```
index.html                 the matrix: picker + the embedded sandbox
packs/sandbox/             the one sandbox (Vite app)
  src/config/{collective,matrix-new,atlas,codex}/   native ability settings
  src/abilities/{collective,matrix-new,atlas,codex}/ native ability code
  src/assets/codex/        each pure-element cast's own geometry module (<Cast>Geometry.js) and RigKit.js, the toolkit they share
  src/config/elements.js   every castable's element
  src/sandbox/Locomotion.js walking, running, dashing
  src/vendor/<pack>/       the five source packs, verbatim
  src/vendor/runtimes/     how each pack is hosted (models, summons, buffs)
packs/<pack>/              each source pack and the collective, still runnable on its own
packs/atlas/               the asset-free Atlas prototype (presets/runtime.js)
presets/catalog.json       every ability, buff, summon, move and archived effect, with its element
presets/<group>/<id>.json  one preset per ability (full default settings block)
presets/library.json       every preset in one file
tools/                     build-all.sh · stage-site.sh · extract-presets.mjs · sculpt-pure.mjs · pure-rigs.mjs · rigs/ · rig-sheet.mjs
tests/                     npm test
```

## The quality bar

Every castable is held to one bar: the three original Linear packs. [`docs/castable-quality-standard.md`](docs/castable-quality-standard.md) writes that bar down as checks (form, motion, material, layers, engineering) and names the anti-patterns found when casts were compared side by side with the originals, so an agent that cannot see the screen can still build to it.

- **Reference storyboards.** [`docs/castables/`](docs/castables/) has a beat-by-beat storyboard (metres, seconds, hex colours, the file behind each layer) for every original Linear cast, contact sheets of the twelve references, and a catalogue of 26 named craft techniques with where each one lives in the code. New and upgraded casts add their own storyboard in the same format.
- **See a cast without a screen.** `node tools/capture-cast.mjs <out> <uid> [uid ...] --sheet` renders any cast in the real sandbox under a fixed 30 Hz clock and writes frames plus a contact sheet. By default seven dummies stand where the cast lands, so hits show. `--module=<path>` loads one unregistered expansion cast on its own; captures queue for a machine-wide slot (`CAPTURE_SLOTS`, default 2).
- **Guards.** `tests/expansion-2026/editor-keys.test.mjs` builds every registered expansion cast's editor against a strict GUI, so a control without a settings key fails in CI rather than taking the sandbox down at boot.

## Run it

```sh
sh tools/build-all.sh
sh tools/stage-site.sh
npx serve site
```

`npm run build` does both steps. Vercel runs that command and publishes `site` (`vercel.json`). The same tree is copied to `dist` so a Vite preset that still expects `dist` succeeds. The hosted matrix loads the sandbox with `?bin=wasm`; staging renames models and HDRIs to `.wasm` and the sandbox bridge rewrites those requests.

To work on the sandbox alone: `cd packs/sandbox && npm i && npm run dev`.

Sandbox keys:

| Key | Action |
|-----|--------|
| `W A S D` / arrows | Walk (relative to the camera) |
| `Shift` | Run |
| `Space` | Dash |
| `[` / `]` | Previous / next ability, across every pack |
| `Q E R F V X B Z N K Y U` | The twelve Collective originals |
| `G` | VFX editor |
| `P` | Pause |
| `C` | Clear |
| `T` | Reset targets |
| `H` | Help |

While a summon is out: `WASD` / arrows steer it instead of the caster, `Space` or hold-click fires, and the same ability recalls it.

## Moving the caster

The caster walks, runs and dashes around the arena:

- **W A S D** (or the arrows) walk relative to the camera, **Shift** runs, **Space** dashes the way you are moving (or facing).
- **Cast on the move.** The aim arrow and the zone circle ride with the caster. While an ability is armed, the body keeps facing the aim and strafes, at `aimSpeed` of its pace.
- **A rigged PBR caster.** The caster is the Vanguard soldier (`packs/sandbox/public/models/Soldier.glb`), a skinned glTF with its own PBR materials and its own Idle, Walk and Run clips. `SandboxCharacter` blends Idle, Walk and Run by speed and scrubs Walk and Run by the gait phase, so the feet match the ground speed. The three cast gestures (`cast1–3.fbx`) were authored on a different Mixamo rig, so they are retargeted onto the soldier's skeleton once at load. Each clip is split at the hips: a cast always drives the upper body, and drives the legs only while the caster is standing, so casting on the move keeps the legs walking. A rig with no Walk clip falls back to the old procedural gait.
- The caster walks round the dummies rather than through them, and stays inside `arenaRadius`. The dummies re-form round wherever you stand.
- Steering stands down while a summon is out, and while Blink Step, Voidstep Rift, Parallax Blink or Chrono Recall is moving the body.
- Every value (speeds, dash, every gait angle) is in `settings.move` and the editor's **Movement** folder, and ships in each group's `_shared.json`. The bridge takes `move('dash')`.

## Procedural rigs

Each of the 80 pure-element casts (the ten castables per element that split the combined elements) owns two authored solids, written in Three.js geometry rather than drawn by a shader alone:

- a **piece**, about one unit across, thrown through the cast's `InstancedMesh` (up to 48 of them), and
- a **hero**, a larger rig that stands, drops or rides at the heart of the cast: a hexagram of glyph stones, a gimbal of three rings, an hourglass that flips, a chain of fourteen links.

Both are built in `packs/sandbox/src/assets/codex/<Cast>Geometry.js` from `RigKit.js`: lathes, lofts, polygon prisms (concave outlines are ear-clipped), tubes along curves, ribbons, blades and faceted crystals, placed with a transform stack. The recipes are authored in `tools/rigs/*.mjs` and written out by `node tools/sculpt-pure.mjs`.

Every solid is split into **parts**. A part carries a pivot, a hinge axis, a swing angle, a delay and a stage (rise or beat), and the detail vertex shader folds it about its pivot as the cast progresses, so a cage closes, a lotus opens and a pendulum's satellites run round their orbit with no per-frame CPU work. The same attributes drive the fragment shader: `aEdge` for anti-aliased arrises, `aInfo` for per-part and per-face tint, and `aStyle` for hot core parts.

The hero is stood by its archetype (`abilities/codex/RigHero.js`): a spire thrusts up through the floor, a cage drops and closes, a well sinks and then stretches, a pendulum is hinged at the hand. Everything is live in the editor under **Hero rig** (`heroSize`, `heroReach`, `heroLift`, `heroSpin`, `heroSwing`, `heroGlow`, `heroEdge`, `heroOpacity` and a palette) and **Detail pieces** (`detailSwing`, `detailEdge`).

Like the older Codex casts, each of the 80 also marks the bodies it fells and leaves the hand with a flare:

- **The mark.** A felled body is stained with its element through `Dummy#corrode`: caked in dust (earth), glassed over (crystal), seared white (light), turned to lead (gravity), aged to sepia (time) and so on, one look per element (`MARK` in `tools/pure-settings.mjs`). The stain sets in over `markTime` and the body sheds motes for `markLife`. It is in the editor under **Mark**.
- **The hand.** The cast leaves the fist in a small flare with a spray of sparks along the aim and a few motes left hanging (`handFlare`, `handSparks`, `handMotes`, under **Hand**).
- **The colour.** Like the older casts, every layer is coloured from a ramp rather than three pastels: the spell's white core, its own pale tint, a saturated body and a dark deep, all on the spell's hue. `TONE` in `tools/pure-settings.mjs` sets, per element, how saturated and how dark the body and the deep go and nudges the hue, so earth, gravity, light, holy, time, motion and force no longer share one gold. Rigs and pieces are shaded light to body to deep, and the burst, ground, dust and chips take the deep tone.

- **The trail.** The 37 line casts leave the line behind them, the way Railgun and Riptide do: a ribbon along the cast's own path that thins and breaks up from the tail forward, a scar on the floor that cools from the element's hot seam to a dark bed, and a wake decal every few metres (crack, frost, scorch, arc … by element). Four path families cover them: straight for lances, a sideways bow for whips, one arc per bolt for volleys (which wake once, where each bolt lands), and a sweep round the hand for pendulums. `abilities/codex/LineTrail.js` owns the strips and the wake; each cast's own Materials file carries its trail and scar shaders, written by `tools/pure-trail.mjs` with the GLSL twin of the path and the element's surface. Live under **Trail** (`trailWidth`, `trailLife`, `trailBreakup`, `scarWidth`, `scarLife`, `wakeSpacing` and the rest).

To see the rigs without running the app: `node tools/rig-sheet.mjs sheet.png [id ...]` renders a contact sheet (each hero at rest and fully folded, with its piece) through Playwright.

## Unified combat state

Every cast in the sandbox, from every pack, reports into one combat state, `combat/ucsm` (the Unified Combat Spec's Universal Combat State Manager). Nothing vendored is edited: `PackAdapter` wraps the places casts already pass through (cast, update, the field's hit passes, `Dummy#kill`, a summon deploying, a buff switching on) and turns them into normalised events: `cast-start`, `hit`, `status`, `terrain-impact`.

- **What it tracks.** Statuses on bodies (wet, burning, charged … one per element), element regions where casts landed, and who owns what. It runs on a fixed 30 Hz tick: events in (tick, sequence) order, ids and reactions exactly once, expiry before anything new lands.
- **Reactions.** When an arriving element meets one already there (a status on the body it hits, a region under it, a region its footprint overlaps), the pair resolves in one of four tiers: the spec's **15 authored** pairs (Storm Conduction, Glacial Bloom, Wildfire …), **70 tag rules** (heat + air → Firestorm, electric + device → Overload …), **generic** stacking with no invented fusion, or a stated **incompatibility** (Lightning into Earth is Grounded). All 276 unordered pairs are covered. Order matters: an authored reaction lands harder when its driver arrives second.
- **Bounds.** Chain depth (default 3), reactions per tick and per body, one reaction of a name per cast, diminishing returns on repeats and an intensity cap. A reaction's own product never sets the same reaction off again. Only the manager deals secondary damage, through an outbox the adapter applies once; VFX never do.
- **In the sandbox.** A feed lists reactions as they land, chips above each body show its statuses, and a reaction rings the floor in both elements' colours. Toggles and the budget are in the editor under **Combat — unified state**. From the console: `matrix.combat.preview('water', 'storm')`, `matrix.combat.pairs()`, `matrix.combat.log()`.
- **31 playable mechanic moves.** The five family representatives (Infernal Circuit, Aegis Exemplar, Shatterpoint Reversal, Continental Uprising and Storm Catalyst) and 26 more run through UCSM in the sandbox. Open **Combat mechanics**, select a move (buttons or Alt+Z/X/C/V/B) and click the arena. The opt-in incoming attack drill supports real counter/block/dodge practice. Each family's look is live in the editor (**Convergence**, **Counter**, **Stance**, **Weave** and **Worldshape** folders). See [mechanic contracts and controls](docs/foundational-mechanics.md) and [validation evidence](evidence/mechanics/VALIDATION.md).
- **Unimplemented content stays locked.** `EXPANSION_REGISTRY` holds the full 161-entry design roster: 46 standard castables and 115 mechanic moves. A standard entry is selectable once its Matrix Expansion cast is live (37 are), a mechanic move once it is implemented (31 are); the other 93 stay `status: 'proposed', selectable: false`. New portable presets are in `presets/mechanics/`.

`tests/ucsm.test.mjs` pins the pair coverage, determinism, order sensitivity, exactly-once commits, the budgets, expiry, team policy and the registry; `tests/line-trail.test.mjs` pins the trail.

## Using an ability as a preset

Each preset is the ability's complete settings block:

```json
{ "format": "collective-ability-preset@1", "uid": "matrix-new/starfall", "pack": "matrix-new", "id": "starfall",
  "cast": "zone", "castAnim": "cast3", "settings": { "range": 20, "zoneRadius": 5.5 } }
```

1. Copy the engine that owns the ability: `packs/sandbox/src` for the native groups, or `packs/<pack>/src` for a source pack.
2. Load the preset and merge it: `applySettings({ [preset.id]: preset.settings })`.
3. Cast it: `abilityManager.cast(origin, direction, distance, preset.id)`.

## Bridge API

The sandbox exposes the same API by URL, JavaScript and postMessage.

- **URL:** `?ability=<uid>` selects it, `&cast=1` casts it on load, `&auto=<s>` recasts on a loop, and `&hud=0` runs it embedded.
- **JS:** `window.matrix.list()`, `select(uid)`, `arm(uid)`, `cast(uid)`, `auto(uid, s)`, `clear()`, `runAction(pack, action)`, `move(name)`, `preset(uid)`, `applyPreset(uid, json)`, `resetPreset(uid)`.
- **postMessage:** `{ matrix: 'cast', uid: 'casting/dragon' }`.
- **Duel and targets:** `window.matrix.duel` and `window.matrix.targets`, below.

## Duel the Arch-Wizard

The original caster, the Mixamo wizard every source pack shipped, is back as a CPU opponent. Open **Arch-Wizard duel** (under Combat mechanics), choose a difficulty and what it may cast, and press **Start duel**, or **Watch (demo)** to have it work through its loadout on the dummies with no input from you.

- **The wizard.** It uses the same files the old caster did: `models/Idle.fbx` (rig and idle), `models/diffuse.png` (skin) and the three gestures `cast1–3.fbx`, which bind by bone name with no retargeting. It is a `Dummy` built from that rig (`combat/duel/WizardBody.js`), so every cast in every pack reaches it through the usual `DummyField` contract. A health bar floats over its head, and both HP bars sit at the top of the screen.
- **Its loadout.** Any castable from any pack, Matrix Expansion included, and any of the 31 implemented mechanic moves. The presets are *Random element*, *One element*, *Mirror my loadout* (your slot and recent picks) and *Custom* (a filterable list). A few casts cannot work from a second caster and are listed disabled, each with the reason: summons (they take over WASD and Space), self buffs, casts that move their caster (Blink Step, Voidstep Rift, Parallax Blink, Chrono Recall), casts that copy the caster's body (Hall of Echoes, Mirage Construct, Ashen Doppelgänger), the Ability Casting lance (it reads the player's hands every frame) and the drawn Fire Portal.
- **How it fights** (`combat/duel/DuelAI.js`). It keeps about 9 m away and strafes, flipping sides every few seconds. When a cast is off cooldown and its reach covers the distance, it plants, raises the gesture and puts an aim marker on the floor (the footprint of a zone cast, or the lane of a line cast, filling in until release). It then casts at where you are, or where you will be. It picks the least recently used cast in range, and may sidestep a cast that is coming down its line.

  | Difficulty | Cast every | Telegraph | Aim error | Dodge | HP |
  |---|---|---|---|---|---|
  | Apprentice | 3.4–4.6 s | 0.8 s | ±0.30 rad, no lead | 10% | 90 |
  | Adept | 2.3–3.2 s | 0.55 s | ±0.13 rad, half lead | 35% | 120 |
  | Archmage | 1.5–2.2 s | 0.38 s | ±0.05 rad, full lead | 60% | 150 |

- **Casting from a second caster.** Native and Matrix Expansion casts go through a second `AbilityManager` that uses the player's own context with the wizard as `character`. Hosted packs' casts go through that pack's manager, below the aim. Mechanics go through `MechanicSystems.command` with the wizard's own owner id (team `cpu`). None of this touches your slot, aim or cooldowns, and the gestures play on the wizard's rig.
- **Hits, both ways.** Your casts hit the wizard through `applyHits`, `findTargets` and `kill`. `kill` spends 10 HP (once per 0.45 s, so a cast overlapping it for many frames is one blow) until the blow that empties the bar: that one ragdolls it and it burns away. Its casts hit you through a referee that reads each CPU cast's `origin`, `position`, `u` and `direction` every frame and applies the field's own rule (a line is a capsule swept to the front, a zone is a disc armed when it lands). Each cast hits once, and you flinch. Its mechanics hurt you through the unified combat state's damage effects. Its stance cuts the damage it takes, and its counter parries a blow and sends half of it back. The dummies can stay (toggle) and either side can hit them. The wizard's own casts never hit the wizard.
- **Round over.** A banner names the winner, with **Rematch** (same loadout, full HP) and **End duel**.
- **API.** `matrix.duel.start({ loadout, castables, mechanics, difficulty, keepDummies })`, `watch({…})`, `rematch()`, `stop()`, `state()`. `loadout` is a preset id (`'random'`, `'element'` with `element`, `'mirror'`) or an array of uids. URL: `?duel=1&cpu=linear/meteor,codex/solarlash&difficulty=adept` (also `&mechanics=<uid,…>`, `&loadout=element&element=frost`, or `?watch=1`). postMessage: `{ matrix: 'duel', action: 'start', options: {…} }`. The page posts back `{ matrix: 'duel', event, state }` on start, stop, hits and round over.
- **Limits.** The soldier does not ragdoll when it loses; it staggers and the round ends. A hosted-pack cast by the CPU shares that pack's limit of four live casts with yours. Casts that pick their own targets are refereed by their line or footprint, not by their own targeting.

## Targets

The dummy field holds up to 24 bodies of five archetypes. Each is the same rig with its own tint, rim and a small procedural piece on the head, so no new model files are needed:

| Archetype | Look | Rule |
|---|---|---|
| Standard | cold black, cyan rim | one hit and it falls |
| Armored | steel, gold rim, helm | shrugs off `armorHits` (3) blows with sparks; the next fells it |
| Runner | green rim, headband | strafes back and forth across its spot (`runnerSpeed`, `runnerRange`) |
| Giant | 1.35× scale, ember rim, horns | heavy: a blow throws it `giantImpulse` (45%) as hard |
| Caster | violet rim, pointed hat | raises a shield bubble on a timer; a blow on the bubble pops it instead |

Formations: **Ring** (the original scatter round the caster), **Line** (one rank across the view), **Cluster** (a tight knot for zone casts), **Gauntlet** (three staggered lanes running away from you) and **Scatter** (anywhere inside the outer radius). The **Targets** panel sets the count, the formation and the mix (a weight per archetype, shared out over the slots and interleaved). Everything is in `settings.dummies` (`count`, `formation`, `mix`, `archetypes`) and in the editor's **Target dummies** folder, and ships in each group's `_shared.json` with the other shared blocks. From code: `matrix.targets.set({ count: 12, formation: 'gauntlet', mix: { armored: 1, runner: 1 } })` (or `mix: 'armored,runner'`) and `matrix.targets.state()`. URL: `&targets=12&formation=gauntlet&mix=armored,runner`. The rules are in `combat/DummyArchetypes.js`.

## Abilities, by element

Every castable has one element, set in `packs/sandbox/src/config/elements.js` and carried in the catalog as `element`. The matrix groups its spellbook by element by default; switch to **By pack** to see where each one came from. The keys each source pack uses on its own are in that pack's README.

### Fire · 10

| Ability | uid | Group | Kind / aim | Range (m) | Circle (m) |
|---------|-----|-------|------------|-----------|------------|
| Cinder Fall | `linear/meteor` | Linear Ability Casting | line | 3–20 |  |
| Pyre Crown | `linear-ext/pyre` | Linear Ability Ext | zone | 0–18 | 4.2 |
| Fire Portal | `linear-ext/firePortal` | Linear Ability Ext | scribe | 3–18 |  |
| Fire Boost | `linear-ext/fire` | Linear Ability Ext | buff |  |  |
| Volcanic Ward | `linear-extended/ward` | Linear Ability Casting Extended | zone | 0–20 | 5 |
| Serpent Tide Field | `handcast/phoenix` | Hand Cast Ability | zone | 0–22 | 5 |
| Dragonfire Circle | `casting/dragon` | Ability Casting (Elemental Sandbox) | zone | 0–22 | 5.5 |
| Meteor Swarm | `collective/swarm` | Collective Originals | zone | 2–16 | 3.6 |
| Emberveil Lattice | `matrix-new/emberveil` | Matrix New | zone | 0–16 | 5.5 |
| Solar Lash **new** | `codex/solarlash` | Elemental Codex | line | 2–20 |  |

### Frost · 10

| Ability | uid | Group | Kind / aim | Range (m) | Circle (m) |
|---------|-----|-------|------------|-----------|------------|
| Frost Lance | `linear/ice` | Linear Ability Casting | line | 2.5–15 |  |
| Glacial Crown | `linear/glacier` | Linear Ability Casting | zone | 0–18 | 4.6 |
| Glacial Shard Storm | `handcast/glacial` | Hand Cast Ability | line | 4–30 |  |
| Glacial Prison | `handcast/frost` | Hand Cast Ability | zone | 3–20 | 3.2 |
| Permafrost Bloom **new** | `codex/permafrost` | Elemental Codex | zone | 0–18 | 4 |
| Avalanche Wake **new** | `codex/avalanche` | Elemental Codex | line | 3–22 |  |
| Hoarfrost Mirror **new** | `codex/hoarfrost` | Elemental Codex | zone | 2–18 | 4.4 |
| Rime Halo **new** | `codex/rimehalo` | Elemental Codex | zone | 2–18 | 4.6 |
| Whiteout Needle **new** | `codex/whiteout` | Elemental Codex | line | 2–18 |  |
| Glacier Calving **new** | `codex/calving` | Elemental Codex | zone | 2–18 | 5 |

### Lightning · 10

| Ability | uid | Group | Kind / aim | Range (m) | Circle (m) |
|---------|-----|-------|------------|-----------|------------|
| Storm Lance | `linear/thunder` | Linear Ability Casting | line | 2–24 |  |
| Voltaic Snare | `linear/snare` | Linear Ability Casting | zone | 0–20 | 4.4 |
| Electrical Sphere | `linear-ext/electrical` | Linear Ability Ext | zone | 0–18 | 4.5 |
| Electric Boost | `linear-ext/boost` | Linear Ability Ext | buff |  |  |
| Stormheart Gyroscope | `casting/gyro` | Ability Casting (Elemental Sandbox) | zone | 0–20 | 6 |
| Chain Arc | `collective/chain` | Collective Originals | line | 3–18 |  |
| Ion Storm Pillar | `matrix-new/ionstorm` | Matrix New | zone | 0–18 | 5 |
| Arc Relay | `atlas/relay` | Ability Atlas | line | 3–18 |  |
| Ball Lightning **new** | `codex/balllightning` | Elemental Codex | line | 2–20 |  |
| Fulgur Cage **new** | `codex/fulgur` | Elemental Codex | zone | 2–18 | 4.4 |

### Water · 10

| Ability | uid | Group | Kind / aim | Range (m) | Circle (m) |
|---------|-----|-------|------------|-----------|------------|
| Kraken Crown | `linear-ext/kraken` | Linear Ability Ext | zone | 0–18 | 4.6 |
| Tidewrought Ring | `linear-ext/aether` | Linear Ability Ext | ring | 3.5–18 |  |
| Sumi Tide | `linear-extended/ink` | Linear Ability Casting Extended | zone | 0–22 | 5 |
| Abyssal Maw | `casting/shark` | Ability Casting (Elemental Sandbox) | zone | 0–20 | 1.1 |
| Maelstrom Vortex **new** | `codex/maelstrom` | Elemental Codex | zone | 2–18 | 4.2 |
| Riptide Lash **new** | `codex/riptide` | Elemental Codex | line | 2–20 |  |
| Brine Geyser **new** | `codex/brine` | Elemental Codex | zone | 2–18 | 4.2 |
| Glass Tide **new** | `codex/glasstide` | Elemental Codex | line | 2–18 |  |
| Undertow Chains **new** | `codex/undertow` | Elemental Codex | zone | 2–18 | 4.8 |
| Pearl Tempest **new** | `codex/pearltempest` | Elemental Codex | line | 2–18 |  |

### Earth · 10

| Ability | uid | Group | Kind / aim | Range (m) | Circle (m) |
|---------|-----|-------|------------|-----------|------------|
| Earthen Spire | `linear-ext/earth` | Linear Ability Ext | line | 0–18 |  |
| Monolith Rift | `linear-extended/quake` | Linear Ability Casting Extended | line | 3–17 |  |
| Dune Scourge | `collective/dune` | Collective Originals | line | 3–18 |  |
| Obsidian Wall | `matrix-new/obsidianwall` | Matrix New | line | 2–18 |  |
| Basalt Columns **new** | `codex/basalt` | Elemental Codex | zone | 0–16 | 4 |
| Fault Choir **new** | `codex/faultchoir` | Elemental Codex | line | 2–18 |  |
| Scarp Break **new** | `codex/scarp` | Elemental Codex | zone | 2–18 | 4.2 |
| Sinter Plate **new** | `codex/sinter` | Elemental Codex | zone | 2–18 | 4.2 |
| Loess Curtain **new** | `codex/loess` | Elemental Codex | line | 2–18 |  |
| Keystone Drop **new** | `codex/keystone` | Elemental Codex | zone | 2–18 | 4.45 |

### Crystal · 10

| Ability | uid | Group | Kind / aim | Range (m) | Circle (m) |
|---------|-----|-------|------------|-----------|------------|
| Amethyst Verdict | `casting/amethyst` | Ability Casting (Elemental Sandbox) | zone | 0–18 | 3.2 |
| Geode Eruption | `matrix-new/geode` | Matrix New | zone | 0–16 | 4.5 |
| Crystalline Heart | `matrix-new/crystallineheart` | Matrix New | zone | 0–14 | 5 |
| Quartz Spire **new** | `codex/quartzspire` | Elemental Codex | zone | 2–18 | 4.5 |
| Prism Fault **new** | `codex/prismfault` | Elemental Codex | line | 2–18 |  |
| Geode Cage **new** | `codex/geodecage` | Elemental Codex | zone | 2–18 | 4.2 |
| Shard Choir **new** | `codex/shardchoir` | Elemental Codex | zone | 2–18 | 4.7 |
| Lens Well **new** | `codex/lensewell` | Elemental Codex | zone | 2–18 | 4.45 |
| Facet Volley **new** | `codex/facetvolley` | Elemental Codex | line | 2–18 |  |
| Needle Glass **new** | `codex/needleglass` | Elemental Codex | line | 2–18 |  |

### Wind · 10

| Ability | uid | Group | Kind / aim | Range (m) | Circle (m) |
|---------|-----|-------|------------|-----------|------------|
| Tempest Spiral | `collective/tempest` | Collective Originals | zone | 2–16 | 3.2 |
| Gale Sever | `matrix-new/gale` | Matrix New | line | 1–22 |  |
| Zephyr Shuriken **new** | `codex/zephyr` | Elemental Codex | line | 2–20 |  |
| Downburst **new** | `codex/downburst` | Elemental Codex | zone | 0–18 | 4 |
| Shear Wall **new** | `codex/shearwall` | Elemental Codex | line | 2–18 |  |
| Dust Devil March **new** | `codex/dustmarch` | Elemental Codex | zone | 2–18 | 5 |
| Katabatic Sheet **new** | `codex/katabatic` | Elemental Codex | line | 2–18 |  |
| Rotor Stack **new** | `codex/rotor` | Elemental Codex | zone | 2–18 | 4.7 |
| Venturi Gate **new** | `codex/venturi` | Elemental Codex | zone | 2–18 | 4.2 |
| Crosscut Gust **new** | `codex/crosscut` | Elemental Codex | line | 2–18 |  |

### Sound · 10

| Ability | uid | Group | Kind / aim | Range (m) | Circle (m) |
|---------|-----|-------|------------|-----------|------------|
| Resonance Pulse | `collective/sonic` | Collective Originals | line | 3–18 |  |
| Siren Note **new** | `codex/sirennote` | Elemental Codex | line | 2–18 |  |
| Vortex Bell **new** | `codex/vortexbell` | Elemental Codex | zone | 2–18 | 4.6 |
| Harmonic Reed **new** | `codex/harmonic` | Elemental Codex | zone | 2–18 | 4.2 |
| Subtone Lance **new** | `codex/subtone` | Elemental Codex | line | 2–18 |  |
| Clangor Cage **new** | `codex/clangor` | Elemental Codex | zone | 2–18 | 4.7 |
| Overtone Halo **new** | `codex/overtone` | Elemental Codex | zone | 2–18 | 4.7 |
| Whisper Well **new** | `codex/whisperwell` | Elemental Codex | zone | 2–18 | 4.2 |
| Cadence Volley **new** | `codex/cadence` | Elemental Codex | line | 2–18 |  |
| Glissando Sweep **new** | `codex/glissando` | Elemental Codex | line | 2–18 |  |

### Nature · 10

| Ability | uid | Group | Kind / aim | Range (m) | Circle (m) |
|---------|-----|-------|------------|-----------|------------|
| Verdant Gate | `linear-ext/portal` | Linear Ability Ext | gate | 3–17 |  |
| Arborist's Growth | `linear-extended/growth` | Linear Ability Casting Extended | zone | 0–22 | 4.2 |
| Wildroot Reliquary | `casting/reliquary` | Ability Casting (Elemental Sandbox) | zone | 0–18 | 3 |
| Spore Bloom | `collective/spore` | Collective Originals | zone | 2–16 | 3.4 |
| Pollen Nova **new** | `codex/pollen` | Elemental Codex | zone | 0–18 | 4 |
| Seedstorm Volley **new** | `codex/seedstorm` | Elemental Codex | line | 2–20 |  |
| Briar Cathedral **new** | `codex/briar` | Elemental Codex | zone | 2–18 | 4.8 |
| Mycelium Wake **new** | `codex/mycelium` | Elemental Codex | line | 2–18 |  |
| Thorn Volley **new** | `codex/thornvolley` | Elemental Codex | line | 2–18 |  |
| Bloom Crown **new** | `codex/bloomcrown` | Elemental Codex | zone | 2–18 | 4.4 |

### Poison · 10

| Ability | uid | Group | Kind / aim | Range (m) | Circle (m) |
|---------|-----|-------|------------|-----------|------------|
| Caustic Bloom | `linear-extended/acid` | Linear Ability Casting Extended | zone | 0–20 | 4.4 |
| Venom Surge | `linear-extended/venom` | Linear Ability Casting Extended | line | 2.5–16 |  |
| Toxic Shield | `handcast/toxic` | Hand Cast Ability | zone | 3–20 | 3.4 |
| Plague Swarm **new** | `codex/plague` | Elemental Codex | zone | 0–18 | 4 |
| Miasma Spit **new** | `codex/miasma` | Elemental Codex | line | 2–17 |  |
| Acid Choir **new** | `codex/acidchoir` | Elemental Codex | zone | 2–18 | 4.6 |
| Bile Lance **new** | `codex/bilelance` | Elemental Codex | line | 2–18 |  |
| Spore Coffin **new** | `codex/sporecoffin` | Elemental Codex | zone | 2–18 | 4.2 |
| Noxious Halo **new** | `codex/noxioushalo` | Elemental Codex | zone | 2–18 | 4.5 |
| Vitriol Rain **new** | `codex/vitriol` | Elemental Codex | zone | 2–18 | 4.8 |

### Light · 10

| Ability | uid | Group | Kind / aim | Range (m) | Circle (m) |
|---------|-----|-------|------------|-----------|------------|
| Nova Beam | `linear/beam` | Linear Ability Casting | line | 3–26 |  |
| Starbreaker Lance | `casting/lance` | Ability Casting (Elemental Sandbox) | zone | 0–22 | 1.2 |
| Sunfall Prism | `collective/prism` | Collective Originals | zone | 2–16 | 3.2 |
| Starfall Rite | `matrix-new/starfall` | Matrix New | zone | 0–20 | 5.5 |
| Caustic Lance **new** | `codex/caustic` | Elemental Codex | line | 2–18 |  |
| Aureole Ring **new** | `codex/aureole` | Elemental Codex | zone | 2–18 | 4.2 |
| Photon Well **new** | `codex/photonwell` | Elemental Codex | zone | 2–18 | 4.7 |
| Filament Volley **new** | `codex/filament` | Elemental Codex | line | 2–18 |  |
| Noon Blade **new** | `codex/noonblade` | Elemental Codex | line | 2–18 |  |
| Lattice Flare **new** | `codex/latticeflare` | Elemental Codex | zone | 2–18 | 4.2 |

### Holy · 10

| Ability | uid | Group | Kind / aim | Range (m) | Circle (m) |
|---------|-----|-------|------------|-----------|------------|
| Celestial Rend | `linear-extended/rend` | Linear Ability Casting Extended | zone | 0–24 | 5 |
| Chains of Penance | `casting/chains` | Ability Casting (Elemental Sandbox) | zone | 0–18 | 1.1 |
| Dawn Sanctuary | `atlas/sanctuary` | Ability Atlas | zone | 0–16 | 3.2 |
| Seraphic Descent **new** | `codex/seraph` | Elemental Codex | zone | 0–18 | 4 |
| Halo Guillotine **new** | `codex/haloguillotine` | Elemental Codex | line | 2–18 |  |
| Reliquary Dawn **new** | `codex/reliquarydawn` | Elemental Codex | zone | 2–18 | 4.6 |
| Censer March **new** | `codex/censers` | Elemental Codex | zone | 2–18 | 4.45 |
| Relic Lash **new** | `codex/reliclash` | Elemental Codex | line | 2–18 |  |
| Vow Cage **new** | `codex/vowcage` | Elemental Codex | zone | 2–18 | 4.45 |
| Hymn Well **new** | `codex/hymnwell` | Elemental Codex | zone | 2–18 | 4.2 |

### Cosmic · 10

| Ability | uid | Group | Kind / aim | Range (m) | Circle (m) |
|---------|-----|-------|------------|-----------|------------|
| Astral Void Blast | `linear-extended/astral` | Linear Ability Casting Extended | zone | 0–24 | 5.5 |
| Astral Tome | `casting/tome` | Ability Casting (Elemental Sandbox) | zone | 0–20 | 6 |
| Astral Fang | `casting/wolf` | Ability Casting (Elemental Sandbox) | zone | 0–20 | 1.1 |
| Nebula Collapse **new** | `codex/nebula` | Elemental Codex | zone | 0–16 | 4 |
| Pulsar Lash **new** | `codex/pulsar` | Elemental Codex | line | 2–18 |  |
| Comet Harpoon **new** | `codex/cometharpoon` | Elemental Codex | line | 2–18 |  |
| Redshift Lance **new** | `codex/redshift` | Elemental Codex | line | 2–18 |  |
| Magnetar Volley **new** | `codex/magnetar` | Elemental Codex | line | 2–18 |  |
| Zodiac Halo **new** | `codex/zodiac` | Elemental Codex | zone | 2–18 | 4.45 |
| Quark Spire **new** | `codex/quarkspire` | Elemental Codex | zone | 2–18 | 4.7 |

### Gravity · 10

| Ability | uid | Group | Kind / aim | Range (m) | Circle (m) |
|---------|-----|-------|------------|-----------|------------|
| Graviton Collapse | `collective/graviton` | Collective Originals | zone | 2–16 | 3.2 |
| Event Horizon **new** | `codex/horizon` | Elemental Codex | zone | 2–18 | 5 |
| Dark Matter Well **new** | `codex/darkwell` | Elemental Codex | zone | 2–18 | 4.8 |
| Orbit Lock **new** | `codex/orbitlock` | Elemental Codex | zone | 2–18 | 4.6 |
| Sling Well **new** | `codex/slingwell` | Elemental Codex | zone | 2–18 | 4.7 |
| Tide Bars **new** | `codex/tidebar` | Elemental Codex | zone | 2–18 | 4.2 |
| Perigee Halo **new** | `codex/perigee` | Elemental Codex | zone | 2–18 | 4.2 |
| Mass Lance **new** | `codex/masslance` | Elemental Codex | line | 2–18 |  |
| Shear Orbit **new** | `codex/shearorbit` | Elemental Codex | line | 2–18 |  |
| Plumb Swing **new** | `codex/plumbswing` | Elemental Codex | line | 2–18 |  |

### Shadow · 10

| Ability | uid | Group | Kind / aim | Range (m) | Circle (m) |
|---------|-----|-------|------------|-----------|------------|
| Corrupted Shard | `handcast/shard` | Hand Cast Ability | zone | 0–22 | 3.6 |
| Umbra Grasp | `matrix-new/umbra` | Matrix New | zone | 2–14 | 2.2 |
| Nightfall Scythe **new** | `codex/nightfall` | Elemental Codex | line | 2–20 |  |
| Wraith Host **new** | `codex/wraiths` | Elemental Codex | zone | 0–18 | 4 |
| Umbral Guillotine **new** | `codex/umbral` | Elemental Codex | line | 2–18 |  |
| Shade Puppets **new** | `codex/shadepuppet` | Elemental Codex | zone | 2–18 | 4.4 |
| Eclipse Needle **new** | `codex/eclipseneedle` | Elemental Codex | line | 2–18 |  |
| Penumbra Sheet **new** | `codex/penumbra` | Elemental Codex | line | 2–18 |  |
| Dusk Spire **new** | `codex/duskspire` | Elemental Codex | zone | 2–18 | 4.45 |
| Mourn Halo **new** | `codex/mournhalo` | Elemental Codex | zone | 2–18 | 4.2 |

### Void · 10

| Ability | uid | Group | Kind / aim | Range (m) | Circle (m) |
|---------|-----|-------|------------|-----------|------------|
| Void Slash | `handcast/voidslash` | Hand Cast Ability | line | 4–30 |  |
| Voidstep Rift | `matrix-new/voidstep` | Matrix New | line | 3–16 |  |
| Void Bloom **new** | `codex/voidbloom` | Elemental Codex | zone | 2–18 | 4.6 |
| Null Well **new** | `codex/nullwell` | Elemental Codex | zone | 2–18 | 4.45 |
| Event Cage **new** | `codex/eventcage` | Elemental Codex | zone | 2–18 | 4.2 |
| Absence Lance **new** | `codex/absence` | Elemental Codex | line | 2–18 |  |
| Hollow Volley **new** | `codex/hollowvolley` | Elemental Codex | line | 2–18 |  |
| Rift Pendulum **new** | `codex/riftpendulum` | Elemental Codex | line | 2–18 |  |
| Quietus Halo **new** | `codex/quietus` | Elemental Codex | zone | 2–18 | 4.45 |
| Unspire **new** | `codex/unspire` | Elemental Codex | zone | 2–18 | 4.7 |

### Blood · 10

| Ability | uid | Group | Kind / aim | Range (m) | Circle (m) |
|---------|-----|-------|------------|-----------|------------|
| Shimmering Flux | `handcast/flux` | Hand Cast Ability | line | 3.5–28 |  |
| Crimson Rite | `collective/crimson` | Collective Originals | zone | 2–16 | 3.2 |
| Bloodroot Thorns | `matrix-new/bloodroot` | Matrix New | zone | 0–16 | 6 |
| Sanguine Tide **new** | `codex/sanguine` | Elemental Codex | line | 3–20 |  |
| Hemorrhage Ring **new** | `codex/hemorrhage` | Elemental Codex | zone | 2–18 | 4.5 |
| Clot Armor **new** | `codex/clotarmor` | Elemental Codex | zone | 2–18 | 4.2 |
| Arterial Whip **new** | `codex/arterial` | Elemental Codex | line | 2–18 |  |
| Crimson Baptism **new** | `codex/baptism` | Elemental Codex | zone | 2–18 | 4.4 |
| Heartstake **new** | `codex/heartstake` | Elemental Codex | line | 2–18 |  |
| Vein Lattice **new** | `codex/veinlattice` | Elemental Codex | zone | 2–18 | 4.6 |

### Arcane · 10

| Ability | uid | Group | Kind / aim | Range (m) | Circle (m) |
|---------|-----|-------|------------|-----------|------------|
| Magic Boost | `linear-ext/magic` | Linear Ability Ext | buff |  |  |
| Baleful Cascade | `linear-extended/cascade` | Linear Ability Casting Extended | zone | 0–24 | 4 |
| Aetherblade Cascade | `matrix-new/aetherblade` | Matrix New | line | 2–20 |  |
| Glyph Barrage **new** | `codex/glyphs` | Elemental Codex | line | 3–20 |  |
| Sigil Gate **new** | `codex/sigilgate` | Elemental Codex | zone | 2–18 | 4.4 |
| Rune Meteor **new** | `codex/runemeteor` | Elemental Codex | zone | 2–18 | 4.2 |
| Bind Rune **new** | `codex/bindrune` | Elemental Codex | zone | 2–18 | 4.45 |
| Ley Whip **new** | `codex/leywhip` | Elemental Codex | line | 2–18 |  |
| Mana Well **new** | `codex/manawell` | Elemental Codex | zone | 2–18 | 4.7 |
| Sigil Volley **new** | `codex/sigilvolley` | Elemental Codex | line | 2–18 |  |

### Illusion · 10

| Ability | uid | Group | Kind / aim | Range (m) | Circle (m) |
|---------|-----|-------|------------|-----------|------------|
| Mirage Construct | `matrix-new/mirage` | Matrix New | zone | 0–12 | 3 |
| Hall of Echoes | `atlas/echoes` | Ability Atlas | zone | 0–16 | 3.2 |
| Prism Lie **new** | `codex/prismlie` | Elemental Codex | line | 2–18 |  |
| Mind Lattice **new** | `codex/mindlattice` | Elemental Codex | zone | 2–18 | 4.5 |
| Doppel Lance **new** | `codex/doppel` | Elemental Codex | line | 2–18 |  |
| False Floor **new** | `codex/falsefloor` | Elemental Codex | zone | 2–18 | 4.2 |
| Mirror Halo **new** | `codex/mirrorhalo` | Elemental Codex | zone | 2–18 | 4.7 |
| Feint Cage **new** | `codex/feintcage` | Elemental Codex | zone | 2–18 | 4.7 |
| Glamour Sweep **new** | `codex/glamour` | Elemental Codex | line | 2–18 |  |
| Afterimage Swing **new** | `codex/afterimage` | Elemental Codex | line | 2–18 |  |

### Time · 10

| Ability | uid | Group | Kind / aim | Range (m) | Circle (m) |
|---------|-----|-------|------------|-----------|------------|
| Chrono Fracture | `collective/chrono` | Collective Originals | zone | 2–16 | 3.2 |
| Chrono Recall | `atlas/recall` | Ability Atlas | line | 3–18 |  |
| Stillpoint | `atlas/stillpoint` | Ability Atlas | zone | 2–16 | 3.2 |
| Hourglass Sunder **new** | `codex/hourglass` | Elemental Codex | zone | 0–16 | 4 |
| Second Self **new** | `codex/secondself` | Elemental Codex | line | 2–18 |  |
| Rewind Snare **new** | `codex/rewindsnare` | Elemental Codex | zone | 2–18 | 4.6 |
| Stasis Bell **new** | `codex/stasisbell` | Elemental Codex | zone | 2–18 | 4.4 |
| Late Bolt **new** | `codex/latebolt` | Elemental Codex | line | 2–18 |  |
| Chrono Well **new** | `codex/chronowell` | Elemental Codex | zone | 2–18 | 4.45 |
| Tick Cage **new** | `codex/tickcage` | Elemental Codex | zone | 2–18 | 4.2 |

### Motion · 10

| Ability | uid | Group | Kind / aim | Range (m) | Circle (m) |
|---------|-----|-------|------------|-----------|------------|
| Blink Step | `collective/blink` | Collective Originals | line | 3–18 |  |
| Parallax Blink | `atlas/parallax` | Ability Atlas | line | 4–18 |  |
| Pendulum Cleaver **new** | `codex/pendulum` | Elemental Codex | line | 2–18 |  |
| Vector Lance **new** | `codex/vectorlance` | Elemental Codex | line | 2–18 |  |
| Sling Volley **new** | `codex/slingvolley` | Elemental Codex | line | 2–18 |  |
| Shear Step **new** | `codex/shearstep` | Elemental Codex | line | 2–18 |  |
| Orbit Pendulum **new** | `codex/orbitpendulum` | Elemental Codex | line | 2–18 |  |
| Kinetic Halo **new** | `codex/kinethalo` | Elemental Codex | zone | 2–18 | 4.7 |
| Press Cage **new** | `codex/presscage` | Elemental Codex | zone | 2–18 | 4.45 |
| Surge Well **new** | `codex/surgewell` | Elemental Codex | zone | 2–18 | 4.7 |

### Tech · 10

| Ability | uid | Group | Kind / aim | Range (m) | Circle (m) |
|---------|-----|-------|------------|-----------|------------|
| Cyber Serpent | `linear-extended/cyber` | Linear Ability Casting Extended | line | 3.5–26 |  |
| Monowheel Bot | `handcast/monowheel` | Hand Cast Ability | summon | 0–7 |  |
| Sentinel Drone | `handcast/drone` | Hand Cast Ability | summon | 0–7 |  |
| Prism Refractor | `atlas/refractor` | Ability Atlas | line | 3–18 |  |
| Railgun Lance **new** | `codex/railgun` | Elemental Codex | line | 2–26 |  |
| Orbital Strike **new** | `codex/orbital` | Elemental Codex | zone | 0–18 | 4 |
| Servo Pylon **new** | `codex/servopylon` | Elemental Codex | zone | 2–18 | 4.2 |
| Raster Lance **new** | `codex/raster` | Elemental Codex | line | 2–18 |  |
| Gimbal Whip **new** | `codex/gimbal` | Elemental Codex | line | 2–18 |  |
| Hardpoint Halo **new** | `codex/hardpoint` | Elemental Codex | zone | 2–18 | 4.45 |

### Force · 10

| Ability | uid | Group | Kind / aim | Range (m) | Circle (m) |
|---------|-----|-------|------------|-----------|------------|
| Aegis Bulwark | `collective/aegis` | Collective Originals | zone | 0–16 | 3.2 |
| Polarity Garden | `atlas/polarity` | Ability Atlas | zone | 2–16 | 3.2 |
| Vector Chakram | `atlas/chakram` | Ability Atlas | line | 3–18 |  |
| Aegis Reversal | `atlas/reversal` | Ability Atlas | zone | 0–16 | 3.2 |
| Impulse Well **new** | `codex/impulse` | Elemental Codex | zone | 2–18 | 4.7 |
| Tensor Cage **new** | `codex/tensor` | Elemental Codex | zone | 2–18 | 4.2 |
| Vector Halo **new** | `codex/vectorhalo` | Elemental Codex | zone | 2–18 | 4.7 |
| Shear Force **new** | `codex/shearforce` | Elemental Codex | line | 2–18 |  |
| Moment Swing **new** | `codex/moment` | Elemental Codex | line | 2–18 |  |
| Press Lance **new** | `codex/presslance` | Elemental Codex | line | 2–18 |  |
## Matrix Expansion · 49

Native sandbox casts whose rules go past a single hit: an ash echo that follows your recent path, a thread that locks struck bodies in ice, a storm that attaches to one target, poison that evolves on its host, a sentry that reads enemy exposure and fires the counter-element. Each cast lives in `packs/sandbox/src/abilities/expansion-2026/<cast>/`, is built to the same contract as the originals (`packs/sandbox/SANDBOX_NATIVE_CONTRACT.md`) and binds the expansion combat adapter ([docs/expansion-combat-adapter.md](docs/expansion-combat-adapter.md)) for its hits, statuses and terrain. Promotion is per UID in `expansion-2026/status.js`: a `live` cast is installed in the sandbox and listed in the matrix, while a `candidate` stays hidden. Presets are in `presets/expansion/` (`node tools/extract-expansion.mjs` regenerates them).

| Ability | uid | Element | Kind / aim | Range (m) | Circle (m) |
|---------|-----|---------|------------|-----------|------------|
| Ashen Doppelganger | `matrix-expansion/ashen-doppelganger` | Fire | zone | 0–18 |  |
| Absolute Zero Thread | `matrix-expansion/absolute-zero-thread` | Frost | line | 1–20 |  |
| Fulminant Relay | `matrix-expansion/fulminant-relay` | Storm | line | 2–20 |  |
| Thunderhead Parasite | `matrix-expansion/thunderhead-parasite` | Storm | zone | 0–18 |  |
| Tidal Memory | `matrix-expansion/tidal-memory` | Water | line | 2–20 |  |
| Faultwake Bastion | `matrix-expansion/faultwake-bastion` | Earth | line | 2–18 |  |
| Prism Choir | `matrix-expansion/prism-choir` | Crystal | line | 2–20 |  |
| Pressure Inversion | `matrix-expansion/pressure-inversion` | Wind | zone | 1–18 |  |
| Overtone Spiral | `matrix-expansion/overtone-spiral` | Sound | zone | 1–18 |  |
| Predatory Canopy | `matrix-expansion/predatory-canopy` | Nature | zone | 2–18 | 4 |
| Celestial Cartography | `matrix-expansion/celestial-cartography` | Cosmic | zone | 2–18 | 4.2 |
| Toxin Evolution | `matrix-expansion/toxin-evolution` | Poison | zone | 2–18 | 3.5 |
| Nightshade Inheritance | `matrix-expansion/nightshade-inheritance` | Shadow | zone | 2–18 | 3.5 |
| Heliostat Verdict | `matrix-expansion/heliostat-verdict` | Light | zone | 2–18 | 4 |
| Vigil of Embers | `matrix-expansion/vigil-of-embers` | Holy | zone | 2–18 | 4 |
| Mass Weft | `matrix-expansion/mass-weft` | Gravity | line | 2–18 | 1.1 |
| Hollow Meridian | `matrix-expansion/hollow-meridian` | Void | line | 2–18 | 1.4 |
| Pulse Covenant | `matrix-expansion/pulse-covenant` | Blood | zone | 0.5–8 | 3.2 |
| Spellwright's Gambit | `matrix-expansion/spellwrights-gambit` | Arcane | zone | 1–18 | 4 |
| Mirage Procession | `matrix-expansion/mirage-procession` | Illusion | line | 1–20 |  |
| Borrowed Tomorrow | `matrix-expansion/borrowed-tomorrow` | Time | zone | 1–20 | 3.6 |
| Momentum Ledger | `matrix-expansion/momentum-ledger` | Motion | zone | 0.5–10 | 4.5 |
| Adaptive Fabricator | `matrix-expansion/adaptive-fabricator` | Tech | zone | 1–18 | 6 |
| Vector Breakwater | `matrix-expansion/vector-breakwater` | Force | line | 1–20 |  |
| Cinder Crown | `matrix-expansion/cinder-crown` | Fire | zone | 0–18 | 4 |
| Glacier Bell | `matrix-expansion/glacier-bell` | Frost | zone | 0–18 | 4 |

### The next wave · 23

One new cast per element, the registry's next standard entry for that element (`batch-d.js`). Each was built to [the castable quality standard](docs/castable-quality-standard.md): an authored hero form at zone scale, solid lit materials for solid things, bespoke shaders on a four-stop ramp, a floor that answers and stays, and a linger that keeps moving. Each has a storyboard in [`docs/castables/matrix-expansion/`](docs/castables/matrix-expansion/) and a unit test in `tests/expansion-2026/`.

| Ability | uid | Element | Kind / aim | Range (m) | Circle (m) |
|---------|-----|---------|------------|-----------|------------|
| Combustion Debt | `matrix-expansion/combustion-debt` | Fire | zone | 2–18 | 3.2 |
| Winter's Borrowed Breath | `matrix-expansion/winters-borrowed-breath` | Frost | zone | 2–18 | 3.4 |
| Synaptic Override | `matrix-expansion/synaptic-override` | Storm | zone | 2–18 | 3.6 |
| Hydraulic Marionette | `matrix-expansion/hydraulic-marionette` | Water | zone | 2–16 | 3.4 |
| Strata Exchange | `matrix-expansion/strata-exchange` | Earth | zone | 3–18 | 1.9 |
| Refraction Tribunal | `matrix-expansion/refraction-tribunal` | Crystal | zone | 5–20 | 3.8 |
| Skyhook Draft | `matrix-expansion/skyhook-draft` | Wind | line | 3–16 |  |
| Resonance Theft | `matrix-expansion/resonance-theft` | Sound | zone | 1.5–18 | 3.8 |
| Symbiotic Exchange | `matrix-expansion/symbiotic-exchange` | Nature | zone | 2–18 | 4 |
| Venom Mimicry | `matrix-expansion/venom-mimicry` | Poison | zone | 2–18 | 3.2 |
| Photon Doppel | `matrix-expansion/photon-doppel` | Light | zone | 2–18 | 3.2 |
| Martyr's Accord | `matrix-expansion/martyrs-accord` | Holy | zone | 2–18 | 4 |
| Vacuum Genesis | `matrix-expansion/vacuum-genesis` | Cosmic | zone | 2–17 | 3.4 |
| Equivalence Engine | `matrix-expansion/equivalence-engine` | Gravity | zone | 2–17 | 3.8 |
| Umbra Exchange | `matrix-expansion/umbra-exchange` | Shadow | zone | 3–16 | 4.4 |
| Existence Tax | `matrix-expansion/existence-tax` | Void | zone | 2–16 | 3.4 |
| Hematite Arsenal | `matrix-expansion/hematite-arsenal` | Blood | zone | 2–14 | 3.2 |
| Countermand Sigil | `matrix-expansion/countermand-sigil` | Arcane | zone | 2–16 | 3.6 |
| False Victory | `matrix-expansion/false-victory` | Illusion | zone | 2–15 | 3.4 |
| Temporal Mortgage | `matrix-expansion/temporal-mortgage` | Time | zone | 2–16 | 3.4 |
| Trajectory Hijack | `matrix-expansion/trajectory-hijack` | Motion | zone | 2–16 | 4.2 |
| Signal Jack | `matrix-expansion/signal-jack` | Tech | zone | 2–16 | 4.5 |
| Impact Dividend | `matrix-expansion/impact-dividend` | Force | zone | 2–16 | 3.2 |

## Moves

- Walk and run (the soldier's own clips), and dash (the run, leaned into)
- Idle (Soldier.glb), shared by every pack
- Cast gesture I, II and III (cast1–3.fbx), each thrown with the cast lunge
- Cast lunge
- Summon drive (Sentinel Drone and Monowheel Bot)
- Hand-tracking cast: pack-only
- Duel Hall burn: pack-only

## Archived

Kept in `packs/<pack>/src/archive/`. Built for freehand path input and not reachable from the live apps.

- linear · Fire (path cast)
- linear · Water (path cast)
- linear · Earth (path cast)
- linear · Wind (path cast)
- linear · Air Scooter (walk mode)
- linear-ext · Water (path cast)
- linear-ext · Air Scooter (walk mode)

## Licence

MIT. See each pack's LICENSE file.
