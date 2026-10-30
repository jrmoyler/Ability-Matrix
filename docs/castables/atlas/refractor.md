# Prism Refractor — `atlas/refractor`
Light (projectile) · line · range 3–18 m · ≈ 0.24 s charge + ≈ 0.7 s flight (13 m/s) + 0.12 s split delay + 3 beams 0.2 s apart (0.8 s each) + 0.6 s hold + 1.1 s shatter; floor scar 1.8 s, sigils 2.2 s

## Read in one line
A lance of light charges in the hand and is seen crossing the field on a line of light it leaves behind; a 3.9 m crystal prism scans into being over the end of the line and throws a spectral pool on the floor, the lance strikes it, three coloured beams leave one after another for the nearest bodies and burn deep-glass seals into the floor, and the cracked prism keeps turning until it shatters.

## Beats
| t (s) | Beat | On screen |
|-------|------|-----------|
| 0.00–0.24 | Anticipation | Short fat lance at the hand (1.4 m), charge rings racing, motes drawn in, a shiver of shake. |
| 0.24–≈0.95 | Travel | Lance (3 m, 0.28 m half-width) flies at 13 m/s; behind it a **light path** filament runs hand → head with dashes sliding forward, and the same path is burned flat on the floor as a deep-blue rune scar; heat wake. 0.55 s before arrival the prism scans up out of nothing; its **caustic pool** (2.4 m) fades in under it at half strength. |
| ≈ 0.95 | Impact | Strike: light shell, shock ring, sparks, flash, light punch, a short lens; the prism spins up; the path flares and the pool flares to full. |
| +0.12 / +0.32 / +0.52 | Split | Beam A cyan, B violet, C green leave from the prism face for the nearest untaken bodies (0.42 m half-width, packets); each lands with a stamped sigil (deep-indigo glass disc + lines in the beam hue, white only while stamping), shock ring, SCORCH, AIR shell, sparks, kill; the crystal cracks further per beam. |
| ≈ 0.95–1.65 | Linger | The path drains into the prism from the caster's end (0.7 s); the floor scar wipes over 1.8 s; the pool's caustic web and three spectral lobes turn with the prism; sigils spin. |
| ≈ 2.4–3.5 | Exit | Prism stops, cracks blaze, facets dissolve on their own clocks into lit CHIP shards in the three hues; sigils wipe out from the centre. |

## Layers
1. Lance — vertex-placed ribbon (`createRefractorLanceMaterial`).
2. Prism (hero) — capped triangular column 0.95 m radius, 2.4 m body + 0.75 m points, hovering at 2.25 m (`createPrismGeometry`, `createRefractorCrystalMaterial`: dispersive refraction, caustic bands, drawn edges, scan, crack network, facet shatter).
3. Beams ×3 (`createRefractorBeamMaterial`).
4. Impact sigils — normal-blended deep fill + hue lines + shock ring (`createRefractorSigilMaterial`); SHOCKWAVE/SCORCH decals; AIR shells.
5. Particles — SOFT motes, STREAK sparks, CHIP shards.
6. Warp — lance wake + low prism lens (LAYER.DISTORTION).
7. Feedback — flash, shake, light punch.
8. Light path — air filament + floor scar (`createRefractorPathMaterial`, air/floor modes).
9. Caustic pool — deep-indigo glass shadow + caustic web + spectral lobes (`createRefractorPoolMaterial`).

## Palette
core #ffffff / #f2fdff, pale #9fe9ff, body #3fe6ff · #a07bff · #45ffb8 / path #1630c8, deep #0b1450 · #0a0d33 · #070a2a

## Gameplay (unchanged)
`handlesOwnHits`; the lance never kills; each beam picks the nearest live untaken body within `beamRange` 10 m of the prism the instant it fires and kills it plus anything within `impactRadius` 1 m (`hit` 6 / 4.6 / 1.6). Only presentation defaults changed (lance speed 34 → 13 m/s so the travel is seen).

## New settings (19)
pathWidth, pathIntensity, pathLinger, pathDashes, pathDashSpeed, scarWidth, scarIntensity, scarLife, colorPathDeep, poolRadius, poolIntensity, poolFill, poolScale, colorPoolDeep, colorSigilDeep, sigilFill, sigilTint, strikeShell, strikeShellSize.

## What the capture shows (upgrade L)
`/tmp/claude-0/-home-user-Ability-Matrix/8cc56224-c22f-51ae-821d-6da7489331c5/scratchpad/up-L/after4/atlas__refractor-sheet.jpg`: f8 charged lance at the hand; f20 the lance mid-flight on its light path toward the cluster; f40 a tall faceted cyan prism over a spectral caustic pool, the path and floor scar running back to the caster, bodies struck; f70 the cracked prism still turning over coloured seals on a dark glass floor, the scar draining. Before (regrade-b): travel invisible, 1 m prism, flat white rings (6). After: 8. Short: the refracted beams are short (targets stand 1–2 m from the prism) and read mostly as flashes at 8 m.

## Fix-up (fix-3) — deep indigo prism, three beams that read at 8 m
- **Prism body**: the refracted sky is filtered through the deep stop (`glassBody` 0.35, lighter tint only at grazing), sky reflection `glassReflect` 0.45, opacity 0.78, glass #5b6cff / deep #0a0f46; the strike flood is rim-only (chargeGlow 0.8); cracks thinner and blue (#4fa8ff, glow 1.5). Bright only on edges and cracks.
- **Beams**: a solid shaft of the beam colour (`beamShaft` 0.75 flattens the profile), half-width 0.55 m, the hot core only a 0.1 sliver mixed 25 % toward white, deeper hues (#1fb4ff / #8a5cff / #1fe08a). They now leave **high on the prism face** (`beamLift` 0.8 × half-span) and **bow up** (`beamArc` 1.0 m) so the shaft is seen above the crystal instead of hidden behind it. Start and end points — and so the targeting — are unchanged.
- **Floor burn** (`createRefractorBeamBurnMaterial`, new): each beam's path burned flat from the prism's foot to its landing — a charred deep-indigo band with ragged edges and a molten seam + embers in the beam hue; it follows the tip out, flares on landing, cools to embers and wipes over the sigil's life.
- Impact shells tinted with the beam colour (no white AIR shell); strike shell 1.4 → 0.8, burst colours #6f8cff / #5fc8ff.
- New settings (8): glassBody, glassReflect, beamShaft, beamLift, beamArc, burnWidth, burnFill, burnGlow. Gameplay and timing unchanged.
