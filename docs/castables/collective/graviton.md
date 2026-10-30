# Graviton Collapse — `collective/graviton`
Gravity · zone · range 2–16 m · zone r 3.2 m (funnel lip 4.6 m) · ≈3.6 s on screen (≈0.3 s seed flight + 2.2 s hold + 1.1 s collapse/settle, × `global.lifetime`)

## Read in one line
A dense black seed is thrown to the circle, sinks the floor into a violet lensing funnel with a black event horizon at its throat, drags every body into a levitating huddle under a turning accretion eye while the horizon widens and the arms wind tighter — then the well collapses and throws them all back out.

## Beats
| t (s) | Beat | On screen |
|---|---|---|
| 0.00–0.3 | Anticipation + travel | Seed gathered at the hand (black core, hot violet limb, tight disc); thrown on a shallow arc at 30 m/s shedding violet dust; travel rumble. |
| 0.3 | Impact (opening) | Eye opens over 0.45 s (outBack), soft flash 0.25, downward knock, dust ring; the floor sinks into the funnel (1.6 m deep, lip 4.6 m). |
| 0.3–2.5 | Linger (the hold) | **Funnel = lensing field**: three log-spiral arms of matter (four-stop ramp deep #030207 → body #5019b8 → tint #a983ff → hot #f3e0ff) drain down the throat and turn faster the deeper they are; inward gravity ripples modulate the density; a dark shadow ring then a thin violet photon ring round a **black horizon** (1.25 × throat) that widens 50 % over the hold; the pit sinks a further 30 %. Grid demoted to a faint undertone. Bodies dragged in, wound round and levitated; debris, motes and haze spiral in; disc spins with Doppler beaming; lens bends the frame. |
| 2.15–2.5 | Crush | Horizon crushed tight, photon ring brightens ×2.5, arms wind tighter, core whitens and shrinks, implosion motes rush in, rumble ×4. |
| 2.5 | Collapse | Violet AIR shell (violet → deep, intensity 0.45 — never white), SHOCKWAVE r 7.5 m, scar decal, 140 ejecta + 180 sparks + dust, flash 0.3, shake, light punch 6; bodies thrown outward. |
| 2.5–3.6 | Exit | Floor springs up into a dome and rings flat; disc flung out and thinned; field fades. |

## Layers
1. Core — opaque black sphere, hot streaked limb (`createGravitonCoreMaterial`).
2. Accretion disc — sheared, Doppler-beamed annulus (`createGravitonDiscMaterial`).
3. Lens — LAYER.DISTORTION pinch + swirl (`createGravitonLensMaterial`).
4. Funnel — polar disc sunk in the vertex stage with the depth-proxy trick; fragment now a filled lensing field + horizon + photon ring; sunk pixels seen past the near lip are hidden (`wellOcclude`) so the throat never pokes below the floor (`createGravitonWellMaterial`).
5. Infall — CHIP debris, motes, haze on negative swirl expansion.
6. Collapse — AIR burst, SHOCKWAVE, scar, ejecta, sparks, dust, flash, shake, light.

## New settings (16)
`wellGripDeepen, wellHorizon, wellHorizonGrow, wellPhotonGlow, wellPhotonWidth, wellArms, wellArmTight, wellFieldSpin, wellFieldFlow, wellFieldContrast, wellFieldGlow, wellRipple, wellOcclude, burstIntensity` + colours `colorWellBody, colorWellTint`. Retuned: grid glow 2.4→0.35, disc mid magenta→violet, collapse flash 1.1→0.3, collapse light 10→6.

## Gameplay
`handlesOwnHits` grip/throw unchanged (same reach, pull, timing, lifetime). The hold progress fed to the shaders is presentation only.

## Capture
`node tools/capture-cast.mjs <dir> collective/graviton --frames=8,25,55,80 --sheet` (f80 shows the collapse).
