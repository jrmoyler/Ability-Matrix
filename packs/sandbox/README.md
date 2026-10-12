# Ability Sandbox

The one scene where every ability in the Ability Matrix can be cast. It has one character, one set of target dummies, one camera and one environment. It hosts 78 castable abilities: 73 abilities, 3 buffs and 2 summons.

Built with Three.js r185, Vite 8 and hand-written GLSL.

```sh
npm i
npm run dev     # or: npx vite build
```

The matrix page (`../../index.html`) embeds this sandbox with `?hud=0` and acts as its picker. Run on its own, it is controlled from the keyboard:

| Key | Action |
|-----|--------|
| `[` / `]` | Step through every ability, in every pack |
| `Q E R F V X B Z N K Y U` | The twelve Collective originals |
| `G` | VFX editor |
| `P` | Pause |
| `C` | Clear |
| `T` | Reset targets |
| `H` | Help |

## Layout

| Path | What it is |
|------|------------|
| `src/abilities/collective`, `src/config/collective` | The 12 Collective originals (native) |
| `src/abilities/matrix-new`, `src/config/matrix-new` | The 12 Matrix New abilities (native) |
| `src/abilities/atlas`, `src/config/atlas` | The 10 Ability Atlas abilities, rebuilt on this engine (native) |
| `src/config/sandbox.js` | The native groups and their order |
| `src/vendor/<pack>/` | The five source packs, byte-for-byte copies of `packs/<pack>/src` |
| `src/vendor/runtimes/<pack>.js` | How each source pack is hosted: models, summons, buffs and editor folders |
| `src/sandbox/createRuntime.js` | The generic host for a source pack's engine |
| `src/sandbox/SandboxCharacter.js` | The shared caster |
| `src/bridge/MatrixBridge.js` | The `window.matrix` / postMessage API |
| `SANDBOX_NATIVE_CONTRACT.md` | The rules a native ability follows |

## How abilities run

- **Native abilities** run on this engine. They use the shared particle, decal, burst and light systems, the character's cast clips, and the dummies.
- **Source-pack abilities** run on their pack's own engine, loaded the first time one of them is picked. Each pack keeps its own AbilityManager, ParticleEngine, DecalSystem, BurstSystem, AimController, settings and editor folders. Everything else is shared with the sandbox: the scene, camera, lights, shake, flash, frame uniforms, character and dummies. That way every ability looks exactly as it does in its source repo.

Every ability is addressed by uid, `<pack>/<id>`:

```js
window.matrix.cast('casting/dragon');
window.matrix.preset('matrix-new/starfall');
```
