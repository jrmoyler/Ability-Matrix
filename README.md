# Collective Ability Matrix

75 castable abilities across 7 packs, plus moves and archived effects. One page to test every ability and copy its settings as a preset for your own Three.js games.

**75 castable** · **34 moves** · **7 archived abilities** · **7 packs**

## Packs

| Pack | Location | Count | Focus |
|------|----------|-------|-------|
| Linear | `packs/linear` | 6 | Line and zone skillshots (ice, lightning, meteor, beam, snare, crown) |
| Linear Ext | `packs/linear-ext` | 7 + 3 buffs | Extended targeting (gate, ring, scribe) plus self-buffs |
| Linear Extended | `packs/linear-extended` | 10 | High-density zone and line effects (ward, acid, growth, serpent, venom, monolith, ink, void, cascade, rend) |
| Hand Cast | `packs/handcast` | 9 | Hand-aimed line, far, and summon abilities |
| Casting | `packs/casting` | 9 | Targeted and area cinematic spells with ragdoll interaction |
| Collective | `packs/collective` | 24 | Collective originals (12) + matrix additions (12) on the extended engine |
| Atlas | `packs/atlas` | 10 | Asset-free portable effects (runtime only, no models or textures) |

## What's here

```
index.html            the matrix — test page for everything
packs/<pack>/         each pack as its own Vite app
presets/catalog.json  every ability, buff, summon, move and archived ability
presets/<pack>/<id>.json  one preset per ability (full default settings block)
presets/library.json  every preset in one file
presets/runtime.js    Atlas runtime (imports only Three.js)
bridge/MatrixBridge.js  drives packs by URL or postMessage
tools/                build-all.sh · stage-site.sh · extract-presets.mjs
```

## Run it

```sh
sh tools/build-all.sh
sh tools/stage-site.sh
npx serve site
```

Or work on one pack: `cd packs/collective && npm i && npm run dev`.

Inside any pack: `G` VFX editor, `P` pause, `C` clear, `T` reset targets.

Atlas only: `npm ci && npm run dev:atlas`.

## Using an ability as a preset

Each preset is the ability's complete settings block:

```json
{ "format": "collective-ability-preset@1", "pack": "collective", "id": "tempest",
  "cast": "zone", "castAnim": "cast3", "settings": { "range": 16, "zoneRadius": 3.2 } }
```

1. Copy the pack that owns the ability (`packs/<pack>/src`) or the ability file plus the systems it imports.
2. Load the preset and merge it: `applySettings({ [preset.id]: preset.settings })`.
3. Cast it: `abilityManager.cast(origin, direction, distance, preset.id)`.

## Bridge API

URL: `?ability=<id>` arm · `&cast=1` cast on load · `&auto=<s>` recast loop · `&hud=0`  
JS: `window.matrix.list() | arm(id) | cast(id) | auto(id, s) | clear() | action(name) | preset(id) | applyPreset(id, json)`  
postMessage: `{ matrix: 'cast', id }`

## Abilities

### Linear — `packs/linear`

| Key | Ability | Aim | Range (m) | Circle (m) |
|-----|---------|-----|-----------|------------|
| Q | Frost Lance | line | 2.5–15 | |
| E | Storm Lance | line | 2–24 | |
| R | Cinder Fall | line | 3–20 | |
| F | Nova Beam | line | 3–26 | |
| V | Voltaic Snare | zone | 0–20 | 4.4 |
| X | Glacial Crown | zone | 0–18 | 4.6 |

### Linear Ext — `packs/linear-ext`

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

### Linear Extended — `packs/linear-extended`

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

### Hand Cast — `packs/handcast`

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

### Casting — `packs/casting`

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

### Collective — `packs/collective`

**Originals**

| Key | Ability | Aim | Range (m) | Circle (m) |
|-----|---------|-----|-----------|------------|
| Q | Tempest Spiral | zone | 2–16 | 3.2 |
| E | Dune Scourge | line | 3–18 | |
| R | Sunfall Prism | zone | 2–16 | 3.2 |
| F | Chain Arc | line | 3–18 | |
| V | Graviton Collapse | zone | 2–16 | 3.2 |
| X | Blink Step | line | 3–18 | |
| B | Resonance Pulse | line | 3–18 | |
| Z | Crimson Rite | zone | 2–16 | 3.2 |
| N | Meteor Swarm | zone | 2–16 | 3.6 |
| K | Aegis Bulwark | zone | 0–16 | 3.2 |
| Y | Spore Bloom | zone | 2–16 | 3.4 |
| U | Chrono Fracture | zone | 2–16 | 3.2 |

**Matrix additions**

| ID | Ability | Aim |
|----|---------|-----|
| gale | Gale Sever | line |
| emberveil | Emberveil Lattice | zone |
| umbra | Umbra Grasp | zone |
| geode | Geode Eruption | zone |
| aetherblade | Aetherblade Cascade | line |
| mirage | Mirage Construct | summon |
| bloodroot | Bloodroot Thorns | zone |
| ionstorm | Ion Storm Pillar | zone |
| obsidianwall | Obsidian Wall | line |
| starfall | Starfall Rite | zone |
| voidstep | Voidstep Rift | line |
| crystallineheart | Crystalline Heart | zone |

### Atlas — `packs/atlas`

| ID | Ability |
|----|---------|
| chain-relay | Chain Relay |
| temporal-rewind | Temporal Rewind |
| blink-corridor | Blink Corridor |
| restorative-sanctuary | Restorative Sanctuary |
| magnetic-minefield | Magnetic Minefield |
| mirror-decoys | Mirror Decoys |
| ricochet-chakram | Ricochet Chakram |
| kinetic-parry | Kinetic Parry |
| stasis-bubble | Stasis Bubble |
| prismatic-splitshot | Prismatic Splitshot |

## Moves

- Cast gesture I (cast1.fbx)
- Cast gesture II (cast2.fbx)
- Cast gesture III (cast3.fbx)
- Cast lunge
- Duel Hall burn
- Hand-tracking cast
- Idle
- Summon drive

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
