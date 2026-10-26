# Convergence geometry inspection — non-WebGL

`convergence-geometry-before-after.png` is an offline Three.js SVGRenderer comparison of the five convergence rig meshes before and after the footprint-layer change. The before model was taken from `6f5ec3d`; the after model is this branch. Each uses the same perspective camera, lighting, and material inputs. It is a static geometry inspection, not a game screenshot.

SVGRenderer does not replicate the WebGL renderer, custom shaders, bloom, the game environment, character, HUD, input, timing or actual camera. It cannot establish visual parity or approve the finished in-game effects. Runtime screenshots and human review remain required.
