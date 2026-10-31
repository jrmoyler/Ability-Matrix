# Hardpoint Halo — `codex/hardpoint`
Tech · zone · range 18 m · zone radius 4.45 m · ~2.9 s on screen (travel ≈ 0.52 s at 26.4 m/s, impact 1.15 s, fade 1.25 s)

## Read in one line
Eight dark gunmetal gun turrets leave the hand in a turning formation and arc over to the target. They spread into a ring, drop and bolt onto a hex-plated deck, then fire outward together in three volleys with recoil, muzzle flash and tracers. Then they power down and sink into the deck.

## Beats
| t (s) | Beat | On screen |
|---|---|---|
| 0.00–0.05 | Anticipation | Hand flare and sparks, plus the template's faint footprint telegraph at the target. |
| 0.00–0.52 | Travel | Eight turrets at 0.45 × size, in a 0.7 m formation, turn as they fly (the ring walks, 2.6 rad/s) on a 0.5 m arc at 1.1–1.35 m. Their barrels are stowed upright and their cyan sensor slits glow. From 78 % of the travel the formation spreads to 0.8 × the circle (≈3.6 m) and drops from 1.1 m. The barrels level, and the deck opens out from the hub with conduits charging to each turret. |
| 0.52 | Impact | The turrets slam onto the deck with a bounce. On the next frame every turret fires outward at once: the barrels kick back 0.32 m, the muzzles flash and glow white-hot, and tracers and spent casings fly. Shake and a light punch. The template's commit hit throws the bodies outward. |
| 0.52–1.7 | Linger | Two more volleys follow, 0.42 s apart, each with recoil, flash, tracers and a smaller kick, while the turrets sweep ±0.22 rad (tracking). The muzzles cool from white to cyan to dark. A burnt wedge stays on the deck ahead of each muzzle. |
| clock 1.55–2.0 | Exit | The slits go dark, the barrels droop, and the turrets sink 1.3 m into the deck. The deck fades over the last 10 %. |

## Layers
1. Turrets: `HardpointHaloSignatureGeometry.createHardpointPodGeometry` (hex mount plate, collar, extruded sloped armour head, cheeks, fin, sensor slit) and `createHardpointBarrelGeometry` (trunnion block with twin lathed barrels and muzzle brakes). Both are InstancedMesh with `createHardpointHaloArmourMaterial`: patched MeshStandard gunmetal with panel grooves, on LAYER.WORLD, casting shadows. Only the slit, the plate seam and the muzzles glow.
2. Deck: `createHardpointHaloDeckMaterial` on a floor plane. It is a filled hex-plated disc with powered seams, charging conduits and a muzzle-scorch wedge per turret.
3. Tracers (`hardpoint.tracer`, STREAK) and muzzle flash (`hardpoint.flash`, SOFT), plus casings (template chips).
4. Template: a faint ground field (0.2), the residue decal, dust and the aftershock.
5. Turned down: the sigil body (0.03), voice, the pale block hero rig, detail pieces, burst shell, shock ring, and the arc-ring decal (`deckArc` 0).

## Signature
The ring locks first and then fires outward together: eight barrels recoil on the same frame and a burnt wedge stays ahead of each.

## Palette
core #e4fcff · tint #25d7f4 · body #34414a (gunmetal) · deep #0b1014 (deck #080d11, burn #06080a)

## Gameplay
Unchanged. The commit ring hit and the outward carry are the template's. The ring radius is derived from `zoneRadius × podRing`, so the circle slider re-fits it mid-cast. Volleys after the first are presentation only.
