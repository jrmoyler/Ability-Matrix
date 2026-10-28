# Martyr's Accord — `matrix-expansion/martyrs-accord`
Holy · zone · range 2–18 m · zone radius 4 m · ≈ 3.9 s on screen at 8 m (≈0.55 throw + 1.7 vigil + 0.8 aftermath + 0.9 exit)

## Read in one line
A gilded heart is thrown onto the circle, swords of light form round it and drive into it one after another while it beats and cracks under a radiant glory, then it bursts. The light runs back up every sword, the enemies those swords belong to are hurled away from the caster, and the crown of thorns falls onto a seared, cooling floor.

## Beats
| t (s) | Beat | On screen (shape, size in m, colour, motion) |
|-------|------|----------------------------------------------|
| 0.00–0.15 | Anticipation | A 0.65 m gold heart kindles at the caster's hand (grows from nothing), its fresnel aura and a small flame lit. At the target the 4 m rim starts to **scribe itself** round from the caster's side in both directions, a white-hot head on each line (#fffbe9 → #ffe39a). |
| 0.15–≈0.55 | Travel | The heart is thrown in an arc (0.16 × distance high) at 24 m/s, spinning 7 rad/s, trailing SOFT gold motes; the rim finishes as it lands. |
| ≈0.55 | Impact | The heart unfurls with an overshoot (outBack, 0.3 s) to 2.2 m tall, 1.05 m above the floor, facing the caster. A briar crown of thorns is wound round it, a flame rises from the cleft and a 4 m glory of 28 rays opens behind it. The sanctified field fills the circle (amber #e39b2c at the heart, oxblood #3a0d0b at the rim) under a seven-point star. Light punch 4, knock 0.08, flash, a SHOCKWAVE decal and a gold AIR shell. The accord is sealed: allies inside are sanctified, enemies inside are bound. |
| +0.2–1.5 | Linger I — the vigil | Seven swords (2.9 m blades of light on lit gold hilts) **form guard-first**, each with a hot front running to the point, then draw back 2 m and **thrust** into the heart (inCubic), one every 0.17 s round the circle (a rolling wave). Each blow knocks the heart back 0.14 m along the blade, leaves a white **wound** where the point went in, spreads the glowing crack network, tightens the crown, brightens the glory and throws STREAK sparks back up the blade. The heart beats throughout (a two-lobe cardiac throb), the crown turns and the flame licks. Each sword's **accord ray** runs out across the floor to its bound enemy. |
| +1.5–1.7 | Swell | The heart swells 22 % and its cracks spread over the whole shell. |
| +1.7 | The sacrifice (second impact) | The heart **bursts** into 36 lit gold shards thrown from its actual surface, with 64 lit gold-leaf CHIPs, 96 sparks and 48 motes. The flame flares ×2.6, the glory flares, and a white sear ring runs out over the floor, leaving glowing cracks on dark scorch. SCORCH, CRACK and SHOCKWAVE decals, an AIR shell, a pressure ring on the distortion layer, light punch 10, knock 0.32 and a white flash. A light pulse runs up every blade from point to hilt as each bound enemy is struck and thrown away from the caster. |
| +1.7–2.5 | Linger II — aftermath | The swords back out 1.4 m and dissolve point-first through noise. The crown drops to the floor and settles flat. The shards arc out, land, skid and cool from white to oxblood, and the floor's cracks cool. |
| +2.5–3.4 | Exit | The shards shrink and sink, the crown sinks, and the floor dissolves through noise with a burning edge. |

## Layers
1. **The heart** (hero): `createHeartGeometry` is a raised sacred heart. The heart curve is swept round its centre by a puffed profile, giving full lobes and a sharp cleft and tip, with a chased belt standing proud at the equator. `createHeartMaterial` is a patched `MeshStandardMaterial`: hammered gold #e2a447, oxblood enamel #4a0f0d pooled in the cleft and tip, emissive wounds at each sword's bearing, and an F2−F1 crack network that spreads from the wounds. It is lit, on `LAYER.WORLD` and casts shadows. Height `heartScale × zoneRadius`. Files: `geometry.js`, `materials.js`.
2. **The aura**: `createAuraMaterial` is a fresnel shell inflated round the heart in the vertex stage, breathing with the beat. It is additive.
3. **The swords**: `createBladeGeometry` builds lofted diamond-section blades with a fuller and a leaf swell. `createBladeMaterial` renders them as instanced additive light (form front, white ridge, return pulse, noise dissolve), on `createHiltGeometry` hilts (extruded quillons, turned grip and pommel) in lit gold #8f5f1f.
4. **The crown of thorns**: `createCrownGeometry` braids two briar tubes round a ring and sets 46 thorns on them, in lit bronze #3c2312.
5. **The flame**: `createFlameMaterial` uses a tube carrier pinched and torn into tongues in the vertex stage, with fbm fire in the fragment.
6. **The glory**: `createGloryMaterial` is a camera-facing sunburst of long and short rays with a nimbus ring and a soft core.
7. **The consecrated floor**: `createSigilMaterial` uses normal blending (so the oxblood really darkens the floor). It holds the scribed rim, the field, the seven-point star, the accord rays, the sear and the cooling cracks. The beats add SHOCKWAVE, SCORCH and CRACK decals and AIR shells.
8. **The shards**: 36 instanced lit fragments (`createShardGeometry`, the gold material in shard mode), thrown from `heartSurfacePoint`, bounced and sunk.
9. **Particles**: `martyrsAccord.motes` SOFT additive with curl (trail, floor motes, burst), `martyrsAccord.sparks` STREAK additive (per blow, sacrifice), `martyrsAccord.flakes` CHIP lit (gold leaf).
10. **The beats**: light punch, camera knock and flash on landing, per blow and at the sacrifice, all × `explosionIntensity` / `cameraShake`.
11. **The lens**: `createLensMaterial` on `LAYER.DISTORTION` adds heat shimmer over the flame and the sacrifice's pressure ring.
12. **The light**: #ffd98a, intensity 6, r 11, riding the heart.

## Signature
**The heart takes the blows, then gives them back.** One sword per bound enemy forms on that enemy's bearing and drives into the heart. When the heart breaks, the light runs back up each sword and every bound enemy is thrown **away from the protected caster**, not radially from the circle. Placement is derived from the settings each frame: the blade length is `swordReach × R`, and each point sits `tipDepth × heart` inside the heart along `(cos θ·cos pitch, sin pitch, sin θ·cos pitch)` from its live centre. So dragging the radius, the heart size or the lift mid-cast keeps every point buried in the heart. The plunge stagger compresses so the last blow always lands before the sacrifice.

## Palette
core #fffbe9, tint #ffe39a, body #e39b2c, deep #3a0d0b (gold #e2a447, enamel #4a0f0d, hilt #8f5f1f, briar #3c2312)

## Gameplay
`handlesOwnHits`. On landing the accord is sealed:
- **Bind:** up to `maxBound` (7) living enemies inside `zoneRadius` are bound. Their identities and bearings are recorded, and nobody who arrives later is added.
- **Shelter:** with live combat, the allies inside (up to 8, including the caster when inside) receive one holy `status` (`sanctified`, tags `martyrs-accord`/`sanctuary`). The standalone fallback cannot carry statuses, so there only the caster counts as sheltered, when inside.
- **Sacrifice:** after `sacrificeDelay` (1.7 s × global lifetime), each bound enemy that is still standing takes exactly one `hit`:
  - damage is `sacrificeDamage + wardBonus × min(sheltered, wardBonusCap)` (1 + 0.5 per sheltered ally);
  - `hitForce` comes from `impactForce`, and `sourcePosition` is the caster's position when the accord was sealed, so the knockback points **away from the protected**.
  - With no combat binding it is the same rule on the dummy field: `dummy.kill` with the direction from the caster and `hitImpulse`/`hitLift` × explosion intensity.

At most 7 hits per cast, and nobody is hit twice.

**Interpretation.** The sandbox has no damage redirection (`capabilities` reports it unsupported), so "protective sacrifice" is the cast's own construct:
- The heart stands in for the protected and visibly takes one blow per bound enemy.
- The protection is the holy `sanctified` status on allies.
- The sacrifice is the bounded counter-hit that drives the bound enemies away from the caster.
