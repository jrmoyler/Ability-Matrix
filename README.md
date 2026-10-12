# Collective Ability Matrix

**78 castable abilities** (73 abilities, 3 buffs, 2 summons) from 8 groups, plus 8 character moves and 7 archived effects, all in **one sandbox**: one scene, one character and one set of target dummies.

Open the matrix, pick any ability, cast it, tune it, and copy its settings as a preset for your own Three.js games.

## One sandbox

`packs/sandbox` is the single page that runs everything. The matrix (`index.html`) embeds it and acts as its picker.

| Group | Runs on | Count | Notes |
|-------|---------|-------|-------|
| Collective | sandbox engine (native) | 12 | Collective originals |
| Matrix New | sandbox engine (native) | 12 | New: shaders, rigs and dummy reactions at Collective quality |
| Ability Atlas | sandbox engine (native) | 10 | New: the ten Atlas mechanics, rebuilt on the full engine with the character and dummies |
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
  src/config/{collective,matrix-new,atlas}/   native ability settings
  src/abilities/{collective,matrix-new,atlas}/ native ability code
  src/vendor/<pack>/       the five source packs, verbatim
  src/vendor/runtimes/     how each pack is hosted (models, summons, buffs)
packs/<pack>/              each source pack and the collective, still runnable on its own
packs/atlas/               the asset-free Atlas prototype (presets/runtime.js)
presets/catalog.json       every ability, buff, summon, move and archived effect
presets/<group>/<id>.json  one preset per ability (full default settings block)
presets/library.json       every preset in one file
tools/                     build-all.sh · stage-site.sh · extract-presets.mjs
tests/                     npm test
```

## Run it

```sh
sh tools/build-all.sh
sh tools/stage-site.sh
npx serve site
```

To work on the sandbox alone: `cd packs/sandbox && npm i && npm run dev`.

Sandbox keys:

| Key | Action |
|-----|--------|
| `[` / `]` | Previous / next ability, across every pack |
| `Q E R F V X B Z N K Y U` | The twelve Collective originals |
| `G` | VFX editor |
| `P` | Pause |
| `C` | Clear |
| `T` | Reset targets |
| `H` | Help |

While a summon is out: `WASD` / arrows steer, `Space` or hold-click fires, and the same ability recalls it.

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

## Abilities

The keys listed for the source packs are the ones those packs use when run on their own. In the sandbox, pick them from the matrix or step to them with `[` / `]`.

### Linear — vendored from `packs/linear`

| Key | Ability | Aim | Range (m) | Circle (m) |
|-----|---------|-----|-----------|------------|
| Q | Frost Lance | line | 2.5–15 | |
| E | Storm Lance | line | 2–24 | |
| R | Cinder Fall | line | 3–20 | |
| F | Nova Beam | line | 3–26 | |
| V | Voltaic Snare | zone | 0–20 | 4.4 |
| X | Glacial Crown | zone | 0–18 | 4.6 |

### Linear Ext — vendored from `packs/linear-ext`

| Key | Ability | Aim | Range (m) | Circle (m) |
|-----|---------|-----|-----------|------------|
| Q | Pyre Crown | zone | 0–18 | 4.2 |
| E | Kraken Crown | zone | 0–18 | 4.6 |
| R | Electrical Sphere | zone | 0–18 | 4.5 |
| F | Earthen Spire | line | 0–18 | |
| V | Verdant Gate | gate | 3–17 | |
| X | Tidewrought Ring | ring | 3.5–18 | |
| Z | Fire Portal | scribe | 3–18 | |
| B | Electric Boost | self | | |
| M | Magic Boost | self | | |
| K | Fire Boost | self | | |

### Linear Extended — vendored from `packs/linear-extended`

| Key | Ability | Aim | Range (m) | Circle (m) |
|-----|---------|-----|-----------|------------|
| Q | Volcanic Horror Ward | zone | 0–20 | 5 |
| E | Caustic Bloom | zone | 0–20 | 4.4 |
| R | Arborist's Growth | zone | 0–22 | 4.2 |
| F | Cyber Serpent | line | 3.5–26 | |
| V | Crystallized Venom Surge | line | 2.5–16 | |
| X | Brutalist Earth Blast | line | 3–17 | |
| B | Sumi Tide | zone | 0–22 | 5 |
| Z | Astral Void Blast | zone | 0–24 | 5.5 |
| N | Baleful Cascade Mark | zone | 0–24 | 4 |
| K | Celestial Rend | zone | 0–24 | 5 |

### Hand Cast — vendored from `packs/handcast`

| Key | Ability | Aim | Range (m) | Circle (m) |
|-----|---------|-----|-----------|------------|
| Q | Shimmering Flux of Chaos | line | 3.5–28 | |
| E | Linear Void Slash | line | 4–30 | |
| R | Glacial Shard Storm | line | 4–30 | |
| X | Corrupted Shard Spawn | zone | 0–22 | 3.6 |
| B | Glacial Prison | zone | 3–20 | 3.2 |
| Z | Toxic Shield of Conquest | zone | 3–20 | 3.4 |
| F | Serpent Tide Field | zone | 0–22 | 5 |
| V | Monowheel Bot | summon | 0–7 | |
| Y | Sentinel Drone | summon | 0–7 | |

### Ability Casting — vendored from `packs/casting`

| Key | Ability | Aim | Range (m) | Circle (m) |
|-----|---------|-----|-----------|------------|
| K | Abyssal Maw | zone | 0–20 | 1.1 |
| L | Chains of Penance | zone | 0–18 | 1.1 |
| I | Dragonfire Circle | zone | 0–22 | 5.5 |
| O | Stormheart Gyroscope | zone | 0–20 | 6 |
| U | Amethyst Verdict | zone | 0–18 | 3.2 |
| ; | Astral Tome | zone | 0–20 | 6 |
| ' | Wildroot Reliquary | zone | 0–18 | 3 |
| Y | Starbreaker Lance | zone | 0–22 | 1.2 |
| B | Astral Fang | zone | 0–20 | 1.1 |

### Collective — native

| Key | Ability | Aim | Range (m) | Circle (m) |
|-----|---------|-----|-----------|------------|
| Q | Tempest Spiral | zone | 2–16 | 3.2 |
| E | Dune Scourge | line | 3–18 |  |
| R | Sunfall Prism | zone | 2–16 | 3.2 |
| F | Chain Arc | line | 3–18 |  |
| V | Graviton Collapse | zone | 2–16 | 3.2 |
| X | Blink Step | line | 3–18 |  |
| B | Resonance Pulse | line | 3–18 |  |
| Z | Crimson Rite | zone | 2–16 | 3.2 |
| N | Meteor Swarm | zone | 2–16 | 3.6 |
| K | Aegis Bulwark | zone | 0–16 | 3.2 |
| Y | Spore Bloom | zone | 2–16 | 3.4 |
| U | Chrono Fracture | zone | 2–16 | 3.2 |

### Matrix New — native

Built new for the matrix, at the same quality as the Collective: hand-written GLSL, procedural rigs, a cast animation, decals, lights, shake, and each one reacts with the dummies in its own way.

| uid | Ability | Aim | Range (m) | Circle (m) |
|-----|---------|-----|-----------|------------|
| `matrix-new/gale` | Gale Sever | line | 1–22 |  |
| `matrix-new/emberveil` | Emberveil Lattice | zone | 0–16 | 5.5 |
| `matrix-new/umbra` | Umbra Grasp | zone | 2–14 | 2.2 |
| `matrix-new/geode` | Geode Eruption | zone | 0–16 | 4.5 |
| `matrix-new/aetherblade` | Aetherblade Cascade | line | 2–20 |  |
| `matrix-new/mirage` | Mirage Construct | zone | 0–12 | 3 |
| `matrix-new/bloodroot` | Bloodroot Thorns | zone | 0–16 | 6 |
| `matrix-new/ionstorm` | Ion Storm Pillar | zone | 0–18 | 5 |
| `matrix-new/obsidianwall` | Obsidian Wall | line | 2–18 |  |
| `matrix-new/starfall` | Starfall Rite | zone | 0–20 | 5.5 |
| `matrix-new/voidstep` | Voidstep Rift | line | 3–16 |  |
| `matrix-new/crystallineheart` | Crystalline Heart | zone | 0–14 | 5 |

### Ability Atlas — native

These are the ten Atlas mechanics (chain relay, rewind, blink corridor, sanctuary, minefield, decoys, ricochet, parry, stasis and splitshot). They are rebuilt on the sandbox engine with the character's cast animations, the shared dummies and full VFX.

The original asset-free versions stay in `packs/atlas` and `presets/runtime.js`, with presets in `presets/atlas-prototype/`.

| uid | Ability | Aim | Range (m) | Circle (m) |
|-----|---------|-----|-----------|------------|
| `atlas/relay` | Arc Relay | line | 3–18 |  |
| `atlas/recall` | Chrono Recall | line | 3–18 |  |
| `atlas/parallax` | Parallax Blink | line | 4–18 |  |
| `atlas/sanctuary` | Dawn Sanctuary | zone | 0–16 | 3.2 |
| `atlas/polarity` | Polarity Garden | zone | 2–16 | 3.2 |
| `atlas/echoes` | Hall of Echoes | zone | 0–16 | 3.2 |
| `atlas/chakram` | Vector Chakram | line | 3–18 |  |
| `atlas/reversal` | Aegis Reversal | zone | 0–16 | 3.2 |
| `atlas/stillpoint` | Stillpoint | zone | 2–16 | 3.2 |
| `atlas/refractor` | Prism Refractor | line | 3–18 |  |

## Moves

- Idle (Idle.fbx), shared by every pack
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
