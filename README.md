# Collective Ability Matrix

**230 castable abilities** (225 abilities, 3 buffs, 2 summons) from 9 groups, **sorted into 23 elements, ten each**, plus 11 character moves (walk, run and dash among them) and 7 archived effects, all in **one sandbox**: one scene, one character and one set of target dummies.

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

To see the rigs without running the app: `node tools/rig-sheet.mjs sheet.png [id ...]` renders a contact sheet (each hero at rest and fully folded, with its piece) through Playwright.

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
