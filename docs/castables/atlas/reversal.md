# Aegis Reversal — `atlas/reversal`
Defense · zone · range 0–16 m · shield r 1.5 m on a 2 m seal · ≈ 0.35 s travel + 0.34 s assembly + 0.3 s muzzle warning + 0.56 s bolt flight + 0.42 s stored + 0.6 s counter-wave + 0.8 s scorch + 0.9 s scatter

## Read in one line
A seal is marked on the floor, plates fly in and lock into a dark blued-steel round shield; a red-hot bolt gathers at a muzzle off to the side and streaks across the frame into it; the shield drinks the blow, spins up and burns brighter, then throws it back as a widening cone that scorches the floor dark and hurls every body in front of it.

## Beats
| t (s, from cast) | Beat | On screen |
|-------|------|-----------|
| 0.00–0.35 | Anticipation + travel | Anchor sparks race out at knee height; on the target two blue rings close on the mark over a darkening disc (seal telegraph, r 2 m → 1.35 × shield). |
| 0.35–0.7 | Assembly | 26 plates (boss 6, inner 8, outer 12) tumble in from 2.8 m and lock into a dished 1.5 m disc standing 1.6 m high, face down the aim line; each lock flashes rim-blue. The seal forms: deep navy disc #030914 with a rune ring and a counter-turning chevron ring in #1f6fe0. |
| 0.7–1.15 | Threat | 7.5 m out and 0.62 rad off the aim line, 2.6 m up, a red knot swells at the muzzle drawing embers in; a small scorch marks the ground under it. |
| 1.15–1.7 | Travel (hostile) | The bolt — white needle, pale-orange sheath, #ff4a1c body, ember-brown #3c0703 torn tail 3.4 m long, 0.5 m wide — crosses the frame diagonally into the face. |
| ≈1.7 | Catch (impact 1) | STORM burst at the strike point, spark spray back along the bolt, shockwave ring on the seal, shield shoved back 0.18 m, ripple across the plates, flash + shake. |
| 1.7–2.1 | Store | Channels fill with crawling blue light, rings spin up to 6 rad/s, the rim crackles, the seal turns ×5 and brightens, a faint cone is sketched ahead. |
| ≈2.1 | Release (impact 2) | Blue AIR burst off the face (1.6 × r), shockwave + dust ring, CHIP shards fanned down the cone, flash + shake + light punch. |
| 2.1–2.7 | Counter-wave | A 4.2 m standing wavefront (dark body, blue bands) breaks out above the shield and sweeps the cone (0.12 → 0.62 rad, 7 m); the swept floor goes dark #020814 with rays and chevrons racing on it; bodies inside the cone are thrown down it. |
| 2.7–4.4 | Linger + exit | Scorched cone glows and cools; seal keeps turning at idle; plates come apart and are flung outward and forward, shrinking out; seal fades with them. |

## Layers
1. Plates (hero) — InstancedMesh of parameter-space annular sectors built into dished, bevelled plates in the vertex stage; blued steel lit by the sun with ring-by-ring temper, thin lit chamfers, engraved charge channels, impact ripple.
2. Bolt — camera-facing corkscrew strip, four-stop ramp, muzzle embers, trail sparks.
3. Cone — premultiplied ground shader: dark scorched path + front, rays, chevrons, edges, preview.
4. Wavefront — premultiplied banded wall with dark body; LAYER.DISTORTION twin.
5. Impacts — STORM / AIR bursts, SHOCKWAVE, DUSTRING, RIPPLE, SCORCH decals; STREAK sparks, CHIP shards, SMOKE dust.
6. Seal — premultiplied engraved disc: telegraph rings in flight, rune + chevron rings, charge and release flare; stays for the linger.

## Palette (four-stop)
Shield: #f2faff glint → #3d9bff rim → #335a8a steel → #040912 deep. Bolt: #fff4e6 → #ffc890 → #ff4a1c → #3c0703. Wave/seal: #dff2ff → #2a86ff / #1f6fe0 → #020814 / #030914.

## Hits
Unchanged: the counter-wave only, tested per frame against the live cone half-angle at each body's distance; `hit` impulse 11 / lift 4.5 / spin 1.8.
