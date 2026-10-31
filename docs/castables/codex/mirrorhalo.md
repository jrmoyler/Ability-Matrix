# Mirror Halo — `codex/mirrorhalo`
Illusion · zone · range 2–18 m · zone radius 4.7 m (hit reach 4.7) · ≈3.0 s on screen (≈0.5 travel + 1.25 impact + 1.25 fade)

## Read in one line
A spinning mirror shard flies from the hand and plants in the circle. Three rings of tall dark mirrors rise around it and walk the rim against each other, one inside it, one on it, one outside. They then agree, closing into one wall on the true rim. The glass cracks, and mirror by mirror the wall tips outward and sinks into a dark mirror pool.

## Beats
| t (s) | Beat | On screen |
|---|---|---|
| 0.00–0.10 | Anticipation | Hand flare, sparks and motes; a faint dust-ring telegraph at the target (0.85 R). |
| ≈0.05–0.5 | Travel | One cusped mirror shard (1.7 m × 0.95 m) leaves the hand on a 1.4 m lob, spinning on its long axis at 14 rad/s so its face flashes pink as it turns. |
| ≈0.5 | Impact | The template blow (commit, reach 4.7 m) throws the bodies. The shard plants as a 3.3 m centre mirror. The mirror pool lands out to 1.42 R. Three rings of 11 mirrors rise out of the floor, 0.08 s apart (outBack, 0.22 s): inner at 0.64 R, 2.2 m tall; true at R, 2.7 m; outer at 1.34 R, 2.4 m. Chips and dust; flash kept at 0.04. |
| 0.5–1.4 | Walk → agree | The rings turn against each other (1.5 rad/s, ±) and breathe in and out (±7 % R): three answers to where the rim is. From 30 % to 72 % of the impact phase they walk onto R and interleave into one closed wall, 33 mirrors wide. As it locks, the frame and rim flare, with a light punch and a small thud. |
| 1.4–2.3 | Linger | The wall turns slowly as one (0.22 rad/s). Cell-pattern cracks run through each pane at its own moment, and the pool cracks radially from the centre with a pale ring crack. |
| 2.0–3.0 | Exit | Mirror by mirror, in scattered order, each one tips outward (up to 77°), shrinks, sinks into the floor and sheds 7 lit glass chips. The pool breaks up from the rim in. |

## Layers
1. Glass: `createMirrorPanelGeometry` (an extruded cusped outline with a bevelled arris; in the ability file), drawn as one InstancedMesh of up to 49 panels (shard/centre + 3 × 16). `createMirrorGlassMaterial` is a MeshStandardMaterial (metal 0.85, rough 0.16, albedo #121118) patched with a cold fresnel rim, a fake sky/floor reflection, a world-space sweeping streak, a glowing inner frame and per-instance cracks. On `LAYER.WORLD`, casting shadows.
2. Mirror pool: `createMirrorPoolMaterial`, a filled disc of near-black glass with a sliding sheen, radial and ring cracks, and a glow at the wall's foot; erodes from the rim.
3. Chips: lit CHIP particles on the beat and from every falling mirror; dust; streak and mote shed (template emitters).
4. Beat: template burst (0.1), scorch residue, a faint shock ring, aftershock dust roll, light punch, lock thud.
5. Bodies: template commit blow plus orbit carry; marked bodies are glamoured.
Template layers (rig, braid body, voice, pieces, field) are off by default and remain as sliders.

## Signature
Three rings disagree about where the rim is, then agree. The wall the blow landed on is the one that stays, and then it breaks.

## Palette
core #ff4fb8 (crack lines and the thin frame only), tint #6a7290 sky / #141a2e floor (what the glass reflects), rim #8a90b0 (cold fresnel), deep #121118 glass / #0d030a pool. The body is near-black reflective glass; magenta appears only on the thin edge and in the cracks.

## Gameplay
Unchanged: `handlesOwnHits`, commit on the beat within max(zoneRadius, hitRadius) = 4.7 m, impulse 7.6, lift 3.2, carry orbit, mark up to 12 bodies.
