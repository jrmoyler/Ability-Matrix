# Servo Pylon — `codex/servopylon`
Tech · zone · range 2–18 m · zone radius 4.2 m · ≈2.5 s on screen (≈0.4 s throw + 1.05 s impact + 1.05 s fade)

## Read in one line
A small faceted servo core is lobbed into the circle and beds into the deck. As it lands, six tall, slim gunmetal pylons, each crowned with a bright status lamp, stamp up out of the floor in a ring around it. Every ram fires outward at once and hammers the group away. Then the rams keep firing round the ring one after another, like a radial engine, over a dark machined deck whose conduits pulse cyan. Then the pylons sink back into the floor one by one.

## Beats
| t (s) | Beat | On screen |
|---|---|---|
| 0.00–0.4 | Anticipation / travel | The core (a 0.28 m faceted drum with a vented band) flies on a 2.2 m arc and spins. The deck plate spreads under the circle (radius 4 m). Over the last 40 % of the flight the pylons stamp up out of the floor (3.2 m tall, 0.5 m plinth, a piston crown and a status lamp on top, on a ring of 2.9 m, leaving the deck open in the middle), staggered and overshooting. |
| ≈0.4 | Impact | The core beds in with a dip. Every pylon punches 0.18 m into the floor. All six rams punch their hammer heads (0.42 m blocks) 1 m outward at torso height in 0.07 s, hold for 0.05 s and snap back in 0.16 s: short punches, not long arms. Thin louvre slots in the housings and the striking faces flare teal. Template beat: shake, a small flash, a light punch, dust, chips, residue. |
| 0.9–1.8 | Linger: servo cycle | The rams fire round the ring once every 0.9 s, each one a full short punch, one after another. Each stroke brings sparks, dust under the head, a light tick, and a pulse running out along its conduit in the deck. The ring indexes slowly round and the core's rotor drives. |
| 1.8–2.5 | Exit | The rams retract. The pylons sink back into the floor one after another round the ring (0.32 s each, over 0.3 s). The core sinks last. The deck's conduits cool and the plate fades. The template residue stays. |

## Layers
1. Pylons (hero): `createServoPylonColumnGeometry`, a lofted chamfered-square section (plinth, shaft, louvred housing, mast, piston crown, lamp) with `aPart` 1 on the vents and 2 on the crown lamp. Instanced, max 12.
2. Rams: `createServoPylonRamGeometry`, a lathe piston rod with a gland collar. Hammer heads: `createServoPylonHeadGeometry`, a lofted block with a glowing striking face.
3. Servo core: `createServoPylonHubGeometry`, a faceted lathe drum with a vented motor band.
4. All of the above use `createServoPylonMachineMaterial`, lit machined gunmetal on `LAYER.WORLD` with shadows. Brushed grain, specular, a cool fresnel, dark gunmetal with hammered micro-relief, thin teal seams lit on power-up, and thin louvre slots and striking faces that glow with each stroke (per instance `aServo`).
5. Deck: `createServoPylonDeckMaterial`, a filled floor plate with plating, grooves, a conduit per pylon, and stroke pulses (`uPulse[12]`).
6. Residue stain, aftershock dust roll. Particles: stroke sparks and dust, the template shed.
7. World: shake, flash and light on the beat; a light tick on every stroke and a camera tick once per turn of the ring.

Switched off in the config: ground field (its cyan glow washed the machine), body (the striped hex wall), voice, lens, shared rig (the tall pylon that left the frame), detail pieces (thin rods), shock ring.

## Signature
A ring of machined rams that hammers out once as one, then keeps cycling round like an engine.

## Palette
core #e8fdff · tint #9ff1ff · body #1fb8d2 (seams, vents, conduits) · steel #323d44 · deep #030506

## Gameplay
Unchanged. `handlesOwnHits`, hit timing `commit`, blow `out`: everything in the circle is taken once on the beat and thrown outward. The cycle strokes are presentation only.
