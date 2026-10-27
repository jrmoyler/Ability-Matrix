# Chrono Recall — `atlas/recall`
Time · line (mobility) · range 18 (capture 13.5 m) · arc bend 0.32 · ~2.6 s on screen + 2 s invisible camera settle

## Read in one line
The caster sprints a bent amber arc leaving frozen dark-glass echoes of themselves on clock dials, time stops, then everything rewinds and they snap home in a cold-blue pressure ring.

## Beats
| t (s) | Beat | On screen |
|-------|------|-----------|
| 0.00–0.12 | Anticipation | Master dial (1.05 m) stamps under the caster, sand lifts, light ticks at 2 Hz. |
| 0.12–0.95 | Travel | The real body runs the arc at 16 m/s; every 1/5 of the way an echo (the live pose, dark amber glass with white rim and crawling sand bands) is left on a 0.7 m clock dial; chevrons flow along a 0.84 m wide time-stream; bodies on the arc are thrown. |
| 0.95 | Impact (hold) | Every clock stops: flash, shake, light punch at the target. |
| 0.95–1.40 | Linger (hold) | Echoes tremble in place, sand drifts off them, hands frozen. |
| 1.40–2.30 | Rewind | Cyan distortion wrings back down the arc; the body is dragged backward facing forward; each echo peels into twisting slices as it passes; dial hands spin backward at 22 rad/s. |
| 2.30 | Snap | Body snaps onto the origin: 3 m shock ring, body-sized (1.5 m) amber→deep-blue pressure shell, 110 sparks, 90 sand, short amber flash. |
| 2.30–2.90 | Exit | Stream and dials fade; ring and dust settle. Then 2 s of camera settle (invisible). |

## Layers
1. Echoes — skinned `CasterDouble` with `createRecallEchoMaterial` (now normal-blended: dark amber glass body `#2b1305`, core `#ff9a3c`, bands `#ffd27a`, rim `#fff1c4`), `materials/atlas/ChronoRecallMaterials.js`.
2. Clock dials — instanced glyph quads (`createRecallDialMaterial`).
3. Time-stream — arc ribbon (`createRecallPathGeometry`, `createRecallPathMaterial`) with soft depth fade.
4. Sand (SOFT) and sparks (STREAK) particle systems.
5. Rewind / snap warps on `LAYER.DISTORTION`.
6. Snap: SHOCKWAVE + DUSTRING decals, AIR burst, flash, shake, light.

## Camera (regression fixed)
The sandbox rig keeps the camera's direction to its orbit target, so a target that runs ~12 m out and snaps home ratcheted the pitch against `maxPolar` and left the session looking straight down. A cast-local `PitchKeeper` (reads the rig via `ctx.shake.rig`) holds the pitch found at spawn through the cast and `cameraSettle` (2 s) after it, and a clear puts the rig in its rest pose at once. Keys `cameraHold`, `cameraSettle`. Test: `tests/upgrade-camera-restore.test.mjs`.

## Signature
Your own past selves left standing on clock faces, unthreaded as time runs backward through them.

## Palette
white-hot `#fff1c4` → amber `#ffcf76` → `#ff9a3c` → deep `#2b1305`; counter-colour cold `#7fd8ff`/`#1d3c5a` for the rewind.

## Gameplay
`DummyField` sweep along the arc during the outbound dash (`hitRadius` 1.1 m, impulse 7, lift 3.6); the caster is moved only while the cast owns it (`casterLock`).
