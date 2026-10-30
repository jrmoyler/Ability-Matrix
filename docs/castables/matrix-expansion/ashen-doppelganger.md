# Ashen Doppelganger — `matrix-expansion/ashen-doppelganger`
Fire · zone · range 18 m · landing radius 2.8 m (`brandRadius`) · echo pulse radius 2.4 m · ~5 s

## Read in one line
A charcoal-dark ash copy of you, cracked with fire, stands at your shoulder, throws a coal where you aimed, and a crown of smouldering basalt spires tears up out of a field of glowing cracks there while the echo keeps walking your path and pulsing.

## Beats
| t (s) | Beat | On screen |
| 0.00–0.45 | Anticipation | The echo condenses feet-first (white-hot edge) 1 m to the caster's right, 0.35 m behind; dark ash grain, orange fissures crawling up, ember rim. From 0.2 s a coal (0.55 m) swells in its hand, embers gathering, light rising. |
| 0.50–1.00 | Travel | The coal flies a 1.8 m arc to the aimed point, tumbling, seams boiling white-gold, a 1.8 m flame-cone tail pointing back along the flight, a wake of embers and ash smoke. |
| 1.00 | Impact | Everything within 2.8 m is struck (kill + scorch stain); fire shell (≈2.7 m), shockwave decal (4.5 m), scorch decal, 110 sparks, ember and ash bursts, flash, camera knock, light punch. The cinder field tears open from the centre with a white-hot front. |
| 1.00–3.30 | Linger | Ten faceted ash-basalt spires (1.9–3.2 m) tear up in 0.3 s with overshoot, leaning out round a 1.7 m ring; they settle 0.45 m, lean further, sway; veins cool white → gold → ember → char (half-life 1.6 s) and pale ash settles on the crowns; embers and ash rise; the field's cracks breathe and cool; haze over the crown; every echo pulse re-flares stone and cracks. The echo keeps walking the path and pulsing (sigil ring, shockwave, sparks). |
| 3.30–4.20 | Exit (crown) | Spires crumble crown-down behind a white-hot edge with a sigh of ash. |
| last 0.9 s | Exit (echo) | The echo crumbles from the crown down; field and sigil fade with the cast. |

## Layers
1. Echo body — caster rig clone, `MeshStandardMaterial` patch (charcoal `#3a2c26`, ash flecks `#6b5d55`, fissures `#ff3005`×2, ember rim, form/crumble fronts), `LAYER.WORLD`, shadow while whole — `AshenDoppelgangerMaterials.js#createRigMaterial`.
2. Sigil + pulse ring (additive), 3. fuse ribbon (path), 4. ember column (points), 5. two heat-haze proxies (`LAYER.DISTORTION`).
6. Particles: `.motes` SOFT embers, `.ash` SMOKE, `.sparks` STREAK.
7. Beats: SHOCKWAVE/SCORCH decals, FIRE bursts, flash, shake, light.
8. Brand — eroded lathe coal (`createBrandGeometry`), opaque sun-lit char with boiling seams (`createBrandMaterial`), additive flame tail (`createBrandTailGeometry/Material`).
9. Cinder crown — instanced faceted hexagonal shards (`createSpireGeometry`), lit/shadowing `MeshStandardMaterial` patch with veins, ash coat, crumble (`createSpireMaterial`), `LAYER.WORLD`.
10. Cinder field — normal-blended torn floor: char plates, warped F2–F1 crack network, tear front (`createCinderFieldMaterial`), radius 3.5 m.
Ramp for 8–10: `colorCinderA..D` `#fff3cc` → `#ffb347` → `#ff3d0a` → `#1c0703`.

## Signature
The echo is you, a moment late — it even repeats your cast.
