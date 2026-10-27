# Fire Portal — `linear-ext/firePortal`
Fire · scribe (standing structure) · range 3–18 m (capture: 13.5 m) · ring radius 2.15 m, foot 0.55 m off the floor · persistent: ≈ 1.2 s to draw and open, then stays (close 1.0 s)

## Read in one line
A spark is struck at the foot of a 4.3 m circle in the air and runs all the way round it, throwing a shower of curved orange spark-lines off its tangent; once it is nearly home a pitch-black disc irises open inside the ring and the wheel of sparks keeps spinning off it.

## Beats
| t (s) | Beat | On screen |
|-------|------|-----------|
| 0.00–0.28 | Anticipation + travel | `cast1`; the cast races to the site at 48 m/s. |
| 0.28–0.90 | Impact (scribe) | `scribeTime` 0.62 s: a white spark (0.19 m blob, brightness 3.6) runs round the contour; the shader refuses to draw contour it has not reached; the 2.4 m behind the head burns 1.8× hotter than the settled ring; 6500 sparks/s are fired from the 0.55 m of contour behind the head at 7.4 m/s, carrying 15 % of the head's travel, so the shower trails it. |
| ≈0.75–1.25 | Impact (aperture) | At 76 % of the draw the black disc (#150400, feathered 0.02 m, warm bounce on the lip) irises open over 0.5 s. It writes depth with normal blending — it *removes* the room. |
| 1.25 → | Linger (indefinite) | The ring (bloom #ff8c1e, 0.33 m out, 0.06 m in, hot white core) emits 3200 sparks/s along its tangent (`sparkSwirl` 1.45) at 6.1 m/s; drag 3.56 bends each straight throw into a long curve; slight sag (gravity −0.8). Each spark colours white #fff6e0 → orange #ffab34 → red #ff4a0a → #4a0a00 over its 0.89 s life. Firelight #ff7a22 (40, r 18.5) gutters 0.38. |
| on dismiss | Exit | `closeTime` 1.0 s. |

## Layers
1. **Ring line** — shader-drawn contour with scribe mask and hot trail (`abilities/FirePortalAbility.js`).
2. **Void disc** — normal-blended, depth-writing black iris.
3. **Spark emitter** — the whole rest of the look: stretched `STREAK` particles off the ring's tangent, curved by drag.
4. **Light** — guttering pooled light.

That is deliberately all — the smallest original (58 controls).

## Signature
**The curve is drawn by drag, not by geometry**: a circle that throws straight tangent sparks and a drag term that bends them is a wheel of fire; and the circle is *struck* by a running spark rather than switched on.

## Palette
core #fff6e0, tint #ffab34, body #ff4a0a / ring #ff8c1e, deep #150400 / #4a0a00

## Gameplay
Persistent, one at a time. No damage role. Cooldown 3 s.
