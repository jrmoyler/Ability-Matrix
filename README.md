# Collective Ability Matrix

Every ability and move from five MIT-licensed Three.js ability sandboxes by
[achrefelouafi](https://github.com/achrefelouafi), pulled in **unchanged**, plus
**12 new Collective Originals** built on the same engine and **10 portable Ability Atlas effects** — and one page that lets
you test every one of them and copy its settings out as a preset for your own games.

**66 castable** (44 original + 12 Collective + 10 Atlas) · **34 moves** · **7 archived abilities** catalogued · **7 packs**

## What's here

```
index.html            the matrix — test page for everything (open via a local server)
packs/<pack>/         each source repo, verbatim, as its own Vite app
packs/collective/     the 12 new abilities, on a fork of the linear-extended engine
packs/atlas/          a small host for the 10 asset-free Ability Atlas effects
presets/runtime.js    the reusable Atlas runtime (imports only Three.js)
presets/new/          the Atlas factories, metadata, helpers and licence
bridge/MatrixBridge.js  the one file added to each pack (drives it by URL/postMessage)
presets/catalog.json  every ability, buff, summon, move and archived ability
presets/<pack>/<id>.json  one preset per ability (its full default settings block)
presets/<pack>/_shared.json  the pack's shared blocks (global, aim, zone, post, …)
presets/library.json  every preset in one file
tools/                build-all.sh · stage-site.sh · extract-presets.mjs
```

"Unchanged" means the ability, material, effect, input and settings code of every
source pack is byte-for-byte the upstream commit listed in `packs/SOURCES.txt`.
Two lines were added to each pack's `src/main.js` (import + `installMatrixBridge(app, '<pack>')`)
and `src/bridge/MatrixBridge.js` was dropped in. Nothing else was touched.
Not copied: each repo's `art/` and `promo/` Blender sources and `dist-baseline/` (not used at runtime).

## Run it

```sh
sh tools/build-all.sh        # npm ci + vite build every pack, regenerate presets/
sh tools/stage-site.sh       # assemble ./site (matrix + presets + all builds)
npx serve site               # or: cd site && python3 -m http.server
```

Or work on one pack the way its author does: `cd packs/collective && npm i && npm run dev`.
Inside the original six packs: `G` VFX editor (1,000+ live sliders), `P` pause, `C` clear, `T` reset targets.

For Atlas only: `npm ci && npm run dev:atlas` (Node.js 22.12+), or `npm run build:atlas`.
Its small editor tunes radius, power, duration, seed and color. `npm test` checks the
Atlas runtime, matrix bridge and additive catalog integration. The existing six
packs and their controls are unchanged. See [Atlas integration and comparison](docs/atlas-integration.md)
and the [portable runtime API](docs/new-presets.md).

## Using an ability as a preset in a new game

Each preset is the ability's complete settings block:

```json
{ "format": "collective-ability-preset@1", "pack": "collective", "id": "tempest",
  "cast": "zone", "castAnim": "cast3", "settings": { "range": 16, "zoneRadius": 3.2, … } }
```

1. Start the game from the pack that owns the ability (copy `packs/<pack>/src`), or copy the
   ability file plus the systems it imports (`particles/`, `effects/`, `materials/…`, `core/`).
2. Load the preset and merge it in place: `applySettings({ [preset.id]: preset.settings })`
   — every pack's `config/settings.js` exports `applySettings`, and live bindings keep working.
3. Cast it: `abilityManager.cast(origin, direction, distance, preset.id)`.

Tune in the matrix first: open **Preset JSON**, change values in the pack's VFX editor (or edit the
JSON and **Apply**), then **Copy preset** — the copy includes your edits.

## Bridge API (each pack)

URL: `?ability=<id>` arm · `&cast=1` cast on load · `&auto=<s>` recast loop · `&extra=<action>` · `&hud=0`
JS: `window.matrix.list() | arm(id) | cast(id) | auto(id, s) | clear() | action(name) | move('cast1'|'cast2'|'cast3'|'lunge') | preset(id) | applyPreset(id, json) | resetPreset(id) | allPresets()`
postMessage: `{ matrix: 'cast', id }` etc.; the pack answers `ready`, `cast`, `preset`, `applied`, `error`.

## Every ability

### Linear Ability Casting — `packs/linear` ([source](https://github.com/achrefelouafi/LinearAbiltyCastingThreeJS))

| Key | Ability | Kind | Aim | Gesture | Range (m) | Circle (m) | Live controls |
|---|---|---|---|---|---|---|---|
| Q | **Frost Lance** — Frost Lance | ability | line | cast3 | 2.5–15 |  | 114 |
| E | **Storm Lance** — Storm Lance | ability | line | cast2 | 2–24 |  | 124 |
| R | **Cinder Fall** — Cinder Fall | ability | line | cast1 | 3–20 |  | 180 |
| F | **Nova Beam** — Nova Beam | ability | line | cast1 | 3–26 |  | 177 |
| V | **Voltaic Snare** — Voltaic Snare | ability | zone | cast2 | 0–20 | 4.4 | 175 |
| X | **Glacial Crown** — Glacial Crown | ability | zone | cast3 | 0–18 | 4.6 | 205 |

### Linear Ability Ext — `packs/linear-ext` ([source](https://github.com/achrefelouafi/LinearAbilityExtThreeJS))

| Key | Ability | Kind | Aim | Gesture | Range (m) | Circle (m) | Live controls |
|---|---|---|---|---|---|---|---|
| Q | **Pyre Crown** — Pyre Crown | ability | zone | cast1 | 0–18 | 4.2 | 222 |
| E | **Kraken Crown** — Kraken Crown | ability | zone | cast2 | 0–18 | 4.6 | 244 |
| R | **Electrical Sphere** — Electrical Sphere | ability | zone | cast3 | 0–18 | 4.5 | 206 |
| F | **Earthen Spire** — Earthen Spire | ability | line | cast3 | 0–18 |  | 75 |
| V | **Verdant Gate** — Verdant Gate | ability | gate | cast2 | 3–17 |  | 77 |
| X | **Tidewrought Ring** — Tidewrought Ring | ability | ring | cast3 | 3.5–18 |  | 96 |
| Z | **Fire Portal** — Fire Portal | ability | scribe | cast1 | 3–18 |  | 58 |
| B | **Electric Boost** — Electric Boost | buff | self | cast3 |  |  | 172 |
| M | **Magic Boost** — Magic Boost | buff | self | cast2 |  |  | 148 |
| K | **Fire Boost** — Fire Boost | buff | self | cast2 |  |  | 208 |

### Linear Ability Casting Extended — `packs/linear-extended` ([source](https://github.com/achrefelouafi/LinearAbiltyCastingExtendedThreeJS))

| Key | Ability | Kind | Aim | Gesture | Range (m) | Circle (m) | Live controls |
|---|---|---|---|---|---|---|---|
| Q | **Volcanic Ward** — Volcanic Horror Ward | ability | zone | cast3 | 0–20 | 5 | 230 |
| E | **Caustic Bloom** — Poison Acid Aura | ability | zone | cast2 | 0–20 | 4.4 | 218 |
| R | **Arborist's Growth** — Arborist's Growth Chrono-Summon | ability | zone | cast3 | 0–22 | 4.2 | 361 |
| F | **Cyber Serpent** — Neon Cyber Serpent | ability | line | cast2 | 3.5–26 |  | 204 |
| V | **Venom Surge** — Crystallized Venom Surge | ability | line | cast2 | 2.5–16 |  | 194 |
| X | **Monolith Rift** — Brutalist Earth Blast | ability | line | cast3 | 3–17 |  | 195 |
| B | **Sumi Tide** — Ink-paint Water Zone | ability | zone | cast3 | 0–22 | 5 | 239 |
| Z | **Astral Void Blast** — Cosmic Singularity | ability | zone | cast2 | 0–24 | 5.5 | 200 |
| N | **Baleful Cascade** — Baleful Cascade Mark | ability | zone | cast3 | 0–24 | 4 | 301 |
| K | **Celestial Rend** — Judgment Cascade | ability | zone | cast1 | 0–24 | 5 | 326 |

### Hand Cast Ability — `packs/handcast` ([source](https://github.com/achrefelouafi/HandCastAbilityThreeJS))

| Key | Ability | Kind | Aim | Gesture | Range (m) | Circle (m) | Live controls |
|---|---|---|---|---|---|---|---|
| Q | **Shimmering Flux** — Shimmering Flux of Chaos | ability | line | cast3 | 3.5–28 |  | 184 |
| E | **Void Slash** — Linear Void Slash — an obsidian lance with a wake of shadow | ability | line | cast1 | 4–30 |  | 221 |
| R | **Glacial Shard Storm** — Glacial Shard Storm — a crystal of ice with a wake of frost | ability | line | cast3 | 4–30 |  | 225 |
| X | **Corrupted Shard** — Corrupted Shard Spawn — a light that fires back | ability | zone | cast1 | 0–22 | 3.6 | 285 |
| B | **Glacial Prison** — Glacial Prison — freezes what stands in it, then shatters it | ability | zone | cast2 | 3–20 | 3.2 | 126 |
| Z | **Toxic Shield** — Toxic Shield of Conquest — turns what stands in it to glass, then shatters it | ability | zone | cast3 | 3–20 | 3.4 | 150 |
| F | **Serpent Tide Field** — Serpent Tide Field — a phoenix that hunts | ability | zone | cast3 | 0–22 | 5 | 168 |
| V | **Monowheel Bot** — Monowheel Army Bot — toggle to deploy | summon | summon | cast2 | 0–7 |  | 94 |
| Y | **Sentinel Drone** — Sentinel Drone — toggle to deploy | summon | summon | cast2 | 0–7 |  | 102 |

### Ability Casting (Elemental Sandbox) — `packs/casting` ([source](https://github.com/achrefelouafi/AbilityCastingThreeJS))

| Key | Ability | Kind | Aim | Gesture | Range (m) | Circle (m) | Live controls |
|---|---|---|---|---|---|---|---|
| K | **Abyssal Maw** — Abyssal Maw — a rock kicks the target up, a shark takes it under | ability | zone | cast2 | 0–20 | 1.1 | 127 |
| L | **Chains of Penance** — Chains of Penance — chains from portals all round it tear the target apart | ability | zone | cast3 | 0–18 | 1.1 | 124 |
| I | **Dragonfire Circle** — Dragonfire Circle — a dragon draws a ring of fire, and the fire takes everything inside it | ability | zone | cast3 | 0–22 | 5.5 | 138 |
| O | **Stormheart Gyroscope** — Stormheart Gyroscope — a gyroscope condenses over the circle and strikes everyone in it with lightning | ability | zone | cast2 | 0–20 | 6 | 90 |
| U | **Amethyst Verdict** — Amethyst Verdict — amethyst points rise round the target and crush it | ability | zone | cast2 | 0–18 | 3.2 | 73 |
| ; | **Astral Tome** — Astral Tome — a tome flies to the circle, opens an orrery over it, and its planets fall on everyone inside | ability | zone | cast1 | 0–20 | 6 | 86 |
| ' | **Wildroot Reliquary** — Wildroot Reliquary — roots arch over the target, hang it in a ring of runestones and drag it into the earth | ability | zone | cast3 | 0–18 | 3 | 131 |
| Y | **Starbreaker Lance** — Starbreaker Lance — a beam from your hands into one target, blasting it away and burning it to light | ability | zone | cast1 | 0–22 | 1.2 | 94 |
| B | **Astral Fang** — Astral Fang — a wolf of starlight leaps out of a rift, takes the target and carries it into another | ability | zone | cast3 | 0–20 | 1.1 | 112 |

### Collective Originals — `packs/collective` (new — Collective AI)

| Key | Ability | Kind | Aim | Gesture | Range (m) | Circle (m) | Live controls |
|---|---|---|---|---|---|---|---|
| Q | **Tempest Spiral** — Wind — a tornado that lifts what it catches, then throws it | ability | zone | cast3 | 2–16 | 3.2 | 135 |
| E | **Dune Scourge** — Sand — a scouring dune wave rolls down the line and breaks | ability | line | cast1 | 3–18 |  | 108 |
| R | **Sunfall Prism** — Light — a falling prism splits the sun into a sweeping spectrum | ability | zone | cast2 | 2–16 | 3.2 | 108 |
| F | **Chain Arc** — Lightning — a bolt that leaps from body to body, then grounds | ability | line | cast1 | 3–18 |  | 107 |
| V | **Graviton Collapse** — Gravity — a well that bends the floor, drags everything in, then crushes it | ability | zone | cast3 | 2–16 | 3.2 | 153 |
| X | **Blink Step** — Movement — dissolve, streak and reform at the target | ability | line | cast2 | 3–18 |  | 129 |
| B | **Resonance Pulse** — Sound — a train of pressure rings that ends in a boom | ability | line | cast1 | 3–18 |  | 106 |
| Z | **Crimson Rite** — Blood — a moon-lit rite that impales the circle | ability | zone | cast3 | 2–16 | 3.2 | 155 |
| N | **Meteor Swarm** — Fire — a marked circle, then a rain of meteors onto every mark | ability | zone | cast2 | 2–16 | 3.6 | 152 |
| K | **Aegis Bulwark** — Shield — a hex-lattice dome that throws back what it touches | ability | zone | cast3 | 0–16 | 3.2 | 104 |
| Y | **Spore Bloom** — Fungal — a seed pod roots, glowing mushrooms burst into a corroding spore cloud | ability | zone | cast2 | 2–16 | 3.4 | 134 |
| U | **Chrono Fracture** — Time — a clockwork sphere that freezes, then shatters time | ability | zone | cast3 | 2–16 | 3.2 | 140 |

## Moves
- **Cast gesture I** — cast1.fbx — Mixamo cast clip, thrown with the cast lunge
- **Cast gesture II** — cast2.fbx — Mixamo cast clip, thrown with the cast lunge
- **Cast gesture III** — cast3.fbx — Mixamo cast clip, thrown with the cast lunge
- **Cast lunge** — Procedural body lunge thrown into every cast
- **Duel Hall burn** — ` — burn the gothic hall away around the platform, or raise it again
- **Hand-tracking cast** — M — MediaPipe webcam mode: open palm aims, fist casts, J swaps hands
- **Idle** — Idle.fbx — the rig and its idle loop
- **Summon drive** — With the Drone or Monowheel out: WASD steers, Space holds fire, the same slot recalls

## Archived (in the source repos, not wired into their live apps)
These are kept in `packs/<pack>/src/archive/` exactly as upstream left them. They were built for the
old freehand path-drawing input and are not reachable from the source apps either.

- `linear` · **Fire (path cast)** — Raymarched black-body flame volume + embers/smoke, cast along a freehand path
- `linear` · **Water (path cast)** — Raymarched water surface + spray/foam + splash crown, cast along a freehand path
- `linear` · **Earth (path cast)** — Instanced crust plates, heaved boulders, finale tower, cast along a freehand path
- `linear` · **Wind (path cast)** — Combed silk ribbons, vortex, tornado finale, cast along a freehand path
- `linear` · **Air Scooter (walk mode)** — Walk-mode air ball the character rides
- `linear-ext` · **Water (path cast)** — Same archived water path cast as the Linear pack
- `linear-ext` · **Air Scooter (walk mode)** — Same archived walk-mode air ball

## Licence
Source packs: MIT © 2026 mohamedachrefelouafi (see each `packs/<pack>/LICENSE`).
`packs/collective` is a derivative of LinearAbiltyCastingExtendedThreeJS under the same MIT licence;
the 12 new abilities in `src/abilities/collective/` are © 2026 Collective AI Inc., MIT.

The portable Atlas modules under `presets/new/` and `presets/runtime.js` retain
their [MIT licence](presets/new/LICENSE), © 2026 Ability Atlas contributors.
