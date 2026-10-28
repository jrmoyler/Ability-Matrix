# Resonance Theft — `matrix-expansion/resonance-theft`
Sound · zone · range 1.5–18 m · zone radius 3.8 m · ≈ 3.6 s on screen (10 m cast, defaults)

## Read in one line
A coiled horn is thrown over the circle and unfurls mouth-down; corkscrew
waveforms reach from every enemy's chest into its bell and drain them while
the horn swallows and fills band by band — then it plays everything it stole
back down in one cone of pressure that throws them all out, harder for every
frequency it caught.

## Beats
| t (s) | Beat | On screen (shape, size in m, colour, motion) |
|---|---|---|
| 0.00–0.32 | Anticipation | At the caster's hand (1.45 m) a 0.55 m coiled shell — the horn wound tight — spins itself together (outBack) while coral rings converge and shrink onto it. Light at the caster. |
| 0.32–0.74 | Travel | The shell is thrown on a 1.6 m arc at 24 m/s, spinning 2.5 rev/s, shedding motes; a corkscrew waveform wake runs back from it to the hand (path is visible end to end). |
| 0.74–1.06 | Landing / unfurl | Small SHOCKWAVE ring, spark fountain, knock, light punch. The shell **unfurls** (outBack, the coil unwinding) into the hero: a cochlear horn 3.4 m across (`zoneRadius × hornScale`), lacquered plum-bronze, lit by the sun and shadowing, its bell (2.9 m wide) hanging mouth-down 1.9 m over the centre, coil climbing to ≈ 4 m. The floor darkens into a 7.6 m spectrogram (plum stain, spiral record grooves, a ring of pumping spectrum bars); 40 reeds sweep up round the rim. |
| 0.74–2.09 | Linger I — the listening | Each enemy inside is **tapped**: a corkscrew ribbon (0.2 m wide, 0.3 m helix) reaches from its chest into the bell in 0.35 s, white packets running up it, rings drawn along it, each tap a different number of turns (its harmonic). The tube **swells with a wave running toward the apex** (it is swallowing), energy crawls up the coil, the horn turns slowly; one groove band lights per caught frequency, from the bell upward, and one bright groove appears on the floor per frequency. Motes are sucked in from the rim, the reeds lean in and pump, the air under the bell is drawn inward (distortion). An attack another cast lands in the circle is swallowed too: a tether from where it struck, a flash on the horn, one more band. |
| 2.09 | Impact — the playback | One frame: the horn jumps (+18 %, ringing), the swell reverses out of the bell, a **pressure cone** (lathed in the shader from the bell to a 4 m foot) drops with rings running down it; every tapped enemy is struck outward at once; AIR shell to 4 m, SHOCKWAVE (4.2 m) + RIPPLE + DUSTRING-per-body decals, three interference rings run across the floor, 18 rings thrown from the bell, sparks off every body, flash, knock 0.32, light punch 8+; reeds spike; tethers flare and snap back. |
| 2.09–2.99 | Linger II — ring-down | The cone dissolves by 2.6 s; the swell decays, the bell hums out its last rings, reeds settle, lit grooves hum and dim, the floor's bars quiet; the RIPPLE ring lingers. |
| 2.99–3.59 | Exit | The horn **coils back** toward a shell, rising 1.4 m, and dissolves through noise from the bell up with a hot edge; the reeds sink in a sweep round the rim; the floor dissolves through noise. |

## Layers
1. The horn — `createHornGeometry` (tube swept along an authored conical spiral, 1¾ turns, cubic swoop to a bell mouth-down; exponential-horn radius law; raised brass bands; rolled lip; parallel-transported frames) with `createHornMaterial` (lit ShaderMaterial: wrapped lambert + Blinn from the scene sun, HDR probe sample, fresnel rim, fbm grain, vertex-stage travelling swell, groove bands lit per capture, glowing bell interior, noise dissolve). `LAYER.WORLD`, casts/receives shadows. 3.4 m × ≈ 2.1 m tall. `geometry.js`, `materials.js`.
2. The taps — `createTapGeometry` ribbon, `createTapMaterial` ×10 (+1 flight wake): quadratic bezier + helix + billboard all in the vertex stage; packets and a leading edge in the fragment; ramp coloured.
3. The floor — `createFloorMaterial` disc (normal-blended plum stain, spiral record grooves, 56 spectrum bars, captured grooves, playback interference rings, noise dissolve), 7.6 m.
4. The spectrum ring — `createReedGeometry` (extruded slotted reed, bevelled) ×40 instanced, `createReedMaterial` (dark foot → white-hot tip, fresnel, lit slot); 0.9 m tall, pumping, leaning in.
5. The playback cone — cylinder carrier reshaped by `createConeMaterial` (bell → floor, rings running down, fresnel edge, streak noise).
6. Particles — RING (`resonanceTheft.rings`: converge on the hand, drawn up each tap shrinking, thrown out of the bell swelling), STREAK sparks (`resonanceTheft.sparks`: landing, struck bodies), SOFT curl motes (`resonanceTheft.motes`: flight trail, drawn in from the rim).
7. Beats — AIR burst, SHOCKWAVE / RIPPLE / DUSTRING decals, flash, camera knock, light punch at landing and playback.
8. The lens — `createLensMaterial` on `LAYER.DISTORTION`: inward draw while listening, pressure ring at the playback.

## Signature
The horn that listens: a solid coiled horn visibly drinks each enemy's sound up a corkscrew waveform, lights a band per stolen frequency, and plays them all back at once — the more it heard, the harder it hits.

## Palette
core #fff4ea, tint #ffb39a, body #e8326f, deep #26092f

## Gameplay
Interpretation of "Capture attack frequency": the sandbox has no enemy attack
stream of its own, so the horn captures two real things — the *enemies* in the
circle (each tapped body is one frequency) and any committed *attack another
cast lands in the circle* during the listening (read through the combat
binding's `on('hit')`, own hits excluded). It does not depend on the CPU
wizard.

- While listening (`listenTime` 1.35 s after landing), every `scanInterval` the horn taps new enemies inside `zoneRadius` (≤ `maxTaps` 6). Through the combat binding each tap is a UCSM `status` (sound → `resonating`, `tapStatusTime`); on the dummy field it is a tether only.
- With `stealAttacks` on, each foreign committed hit whose position is inside the circle during the listening is captured (≤ `maxStolen` 4).
- At the end of the listening — the playback — every tapped enemy is hit exactly once, outward from the bell: `N = taps + captured attacks`, damage `min(maxDamage 4, baseDamage 1 + 0.5·(N−1))`, knockback `impactForce` × `min(maxAmplify 2.5, 1 + 0.25·(N−1))` (bridge bounds still apply). On dummies: `kill` away from the centre with the same force. Nothing is struck before the playback or twice.
- Bounded and deterministic: fixed pools (6 taps, 4 stolen, 10 tethers, 48 reeds), at most 6 status + 6 hit events per cast, subscription released at the playback, on destroy and on dispose.
