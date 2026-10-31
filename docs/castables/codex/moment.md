# Moment Swing — `codex/moment`
Force · line · range 2–18 m · hit reach 1.15 m along the head · ≈2.9 s on screen (≈0.45 travel + 1.15 impact + 1.25 fade)

## Read in one line
A forged maul, broadside to the camera, tumbles end over end down the line and comes down head-first on the target. It punches a dark crater with glowing fissures, stands planted and rocks on its buried head like an inverted pendulum, then cools and sinks into the crater.

## Beats
| t (s) | Beat | On screen |
|---|---|---|
| 0.00–0.08 | Anticipation | Hand flare and sparks; the maul appears at the hand, haft down. |
| ≈0.05–0.45 | Travel | A 4.7 m maul (1.35 × 3.5 m; head 2.4 m across, dark iron, hot faces) tumbles 1.25 turns about its heavy end on a low lob (1.3 m + 0.5 m). The turn is derived from the front `u`, so the last quarter-turn always brings the head down onto the target. The template hits run along the head (travel, 1.15 m). |
| ≈0.45 | Impact | The head drives 0.32 m into the floor and the faces flash white-hot. A 2.6 m crater bowl opens in 0.22 s with 9 fissures running out from a hot pit. Crack decal 3.5 m, dust ring 4.2 m, 70 lit chips, 30 dust puffs, shake 0.72 and a light punch; flash only 0.05. |
| 0.45–1.9 | Linger | The maul stands head-down, leaning 0.2 rad back toward the caster, and rocks on its buried head: a damped swing (0.5 rad, 7.5 rad/s, damping 1.5) that kicks dust at each pass. Its faces and the crater's fissures cool from white through orange to ember (time constant 0.9 s). |
| 2.0–2.9 | Exit | From fade 1.4 it sinks 2.2 m into the crater (inCubic); the crater erodes from the rim in; the residue scorch stays. |

## Layers
1. Maul: `createMomentMaulGeometry` (in the ability file), a faceted octagonal lathe head with flared striking faces and a waist groove, a socket collar, a tapered haft with grip bands and a pommel. It carries a per-vertex `aHeat`. `createMomentMaulMaterial` is a MeshStandardMaterial (iron #2b1e18, metal 0.75) patched with ramped seam heat and a fresnel rim. On `LAYER.WORLD`, casting shadows.
2. Crater: `createMomentCraterMaterial`, a filled dark bowl with a raised lip and radial fissures on a four-stop ramp, plus flicker and rim erosion.
3. Decals: crack, dust ring, scorch residue, faint shock ring, aftershock dust roll.
4. Particles: lit CHIP fragments, SMOKE dust (on the slam and on each rock), streak and mote shed.
5. World: shake, light punch, aftershock thud.
Off by default: the template hammer rig, hinge body, voice, pieces, field strip, trail and scar ribbon, wake decals and lens. The wake decals and lens drew the frame-wide arc.

## Signature
The moment arm: it tumbles round its own centre of mass and always lands head-down, then rocks on its buried head and settles.

## Palette
core #fff0d8 (white-hot faces), tint #ff8a35, body #f46b25, deep #2b1e18 iron / #100503 crater

## Gameplay
Unchanged: `handlesOwnHits`, travel hits within 1.15 m of the head, impulse 11.9, lift 3.2, slicing; bodies are bruised.
