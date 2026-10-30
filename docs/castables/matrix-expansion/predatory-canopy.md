# Predatory Canopy — `matrix-expansion/predatory-canopy`
Nature · zone · range 2–18 m · snare radius 4 m · ≈ 7.7 s on screen (10 m cast, defaults: 0.6 s travel, 6 s hang, 1.1 s wither)

## Read in one line
A seed pod flies to the circle trailing a living vine from the hand, bursts on
the floor and a strangler-fig tree heaves up out of a glowing root snare; it
waits, its pitcher maw swaying under the leaves — and the first body to step
in is caged by thorns, whipped by three thorned vines that coil up round it,
and swallowed by the maw snapping shut over it.

## Beats
| t (s) | Beat | On screen (shape, size in m, colour, motion) |
|---|---|---|
| 0.00–0.10 | Anticipation | The ribbed seed pod (≈ 1.2 m with its four folded leaves, dark husk #365423, seams glowing #d1ff82) buds at the hand, heartbeat swelling. |
| 0.10–0.60 | Travel | The pod flies at 18 m/s, 1.2 m up, turning and nodding; a runner vine (lit thorned tube, 0.07 m) stays stretched from the caster's hand (1.2 m) to the pod, sagging 0.5 m — the path is drawn. |
| 0.60 | Impact — the burst | Pod gone; AIR burst (2.4 m), DUSTRING (4 m), green flash 0.06, knock 0.1, leaf spray. The braided trunk (four strands round a core, buttress roots 0.7 m) heaves out of the floor with an overshoot as the canopy opens from a point over 0.55 s to 2.9 m high, 8 m across: twelve knotted limbs, 48 drooping serrated leaves, twelve hanging vines. The root snare (4 m disc: two rings, creeping roots, split soil) and the dappled leaf-shadow draw on the floor and stay. The runner withers over 0.6 s. |
| 0.60–1.15 | Linger — the wait | Leaves flutter, pollen and leaves drift down, sun flecks move through the shade, roots creep in from the rim. The maw (0.9 m pale waxy pitcher with dark veins, five toothed jaws) hangs 1.3 m off the trunk on the caster's side from a stalk vine, swaying, jaws breathing, gullet glowing. |
| 1.15–1.47 | Windup | The nearest living body inside the snare trips it: the warning ring races inward, twelve thorns stab 1.5 m up in a cage 0.75 m round the body (points burning with sap), sap flushes the bark, leaves bristle, the camera rumbles, three thorned vines (0.2 m at the root) grow from the canopy's rim and swoop low across the snare toward the body, tracking it; the maw swings toward it, jaws gaping 1.15 rad, gullet blazing. |
| 1.47 | Impact — the lash | The body is struck once (knocked toward the trunk): AIR burst, DUSTRING, splinters, torn leaves, a snap of bent air, knock 0.3, flash 0.18, light punch 9. The maw lunges onto the body in 0.14 s and its jaws snap shut over it to 0.5 m off the floor. |
| 1.47–2.5 | Linger — the bind | The vines' last third coils 1.6 turns up round the body (0.38 m out, 1.3 m high) and holds for 0.45 s while the maw chews; then the vines withdraw (0.6 s) and the maw hauls itself back up under the crown (0.8 s). Thorns stay up. |
| 2.5–6.6 | Linger | The tree breathes: flutter, crown turn, drifting leaves, maw sway, root crawl. |
| 6.6–7.7 | Exit — wither | The canopy sinks 1.5 m and draws in, sheds 40 leaves, and the bark, leaves, maw and thorns dissolve through a burning sap edge; the thorns sink into the floor; the snare fades. |

## Layers
0. The maw (hero) — `canopyMawBulbGeometry` (six-lobed lathe pitcher with neck ridge and lip) + five hinged `canopyJawGeometry` (cupped, toothed, hooked lobes), `createMawMaterial` (lit waxy skin, dark veins, fresnel sap rim; inside a ribbed gullet on the four-stop ramp, blazing with hunger; dissolve), stalk = strike-vine tube. `LAYER.WORLD`, shadows.
1. The canopy — `canopyTrunkGeometry` (braided strangler fig), crown braid, twelve `canopyBranchGeometry` limbs, twelve `canopyVineGeometry` hanging vines — `createBarkMaterial` (lit ridged mossy bark, sap veins on wake, dissolve), on `LAYER.WORLD` casting shadows; 48 `canopyLeafGeometry` leaves (`createLeafMaterial`, wrap-lit, translucent, flutter/bristle in the vertex stage).
2. The snare — `canopyDiscGeometry` + `createRootMaterial` (additive rings, roots, split soil, racing warning ring) and `createShadeMaterial` (normal-blended dappled shade). Stays the whole life.
3. The lash — 12 thorns (`canopyThornGeometry`, own bark instance with burning points) in a cage round the body; three `canopyStrikeGeometry` tubes bent on the GPU along a low quadratic from the canopy rim and coiled round the body (`createStrikeMaterial`: lit fibrous wood, sap pulses, fresnel); snap on `LAYER.DISTORTION`; AIR burst, DUSTRING.
4. Particles — `exp.canopy.leaves` (LEAF, lit), `exp.canopy.motes` (SOFT pollen), `exp-predatory-canopy.splinters` (lit CHIP).
5. The pod — `canopyBudGeometry` + `createBudMaterial`, four folded leaves; the runner vine (strike-vine tube in world space).
6. Light — #b7ff8a, 5 / 9 m, dappled, punched at the landing and the lash.

## Signature
A tree that eats: it grows up out of the snare, waits, then cages, whips,
binds and swallows exactly one body.

## Palette
leaves (fix-1): deep `#061104` near-black green on the underside, stem end and ≥ 70 % of the lit face (`leafDeepFloor`) → body `#18440f` → lit margin `#d1ff82` (`leafEdgeStart` 0.86, `leafEdgeGlow` 1). Maw: skin `#5a7a22` with deep veins, blood-red gullet/rim `#d8304e`, hot core `#ffc070`. Bark `#365423`, sap `#a9eb6a` (snare `rootGlow` 0.55), shade `#0d1608`.

## Gameplay
`handlesOwnHits`: after `armDelay` the nearest living sandbox dummy within
`zoneRadius` triggers it; after `triggerWindup` that same body (same stand
generation, still inside, dummies still on) is struck once through
`dummies.kill` with `hitImpulse/hitLift/hitSpin` toward the trunk. One strike
per cast. `settings.global.lifetime` scales the staged clock.

## Fix pass (fix-1)
Coordinator read at 7: leaves flat bright lime, the snap at the body compact.
Leaves now shade to a near-black green (underside, stem, most of the lit face)
with only their margins lit. The maw is bigger (`mawScale` 1.15) with a
red gullet. Through the windup it rears back toward the caster and up
(`mawRear` 1.1 m, `mawRearLift`), swinging only 12 % of the way toward the
body (`mawWindReach`). The lunge is then one long plunge onto the body, and it
swells 30 % as the jaws slam shut (`mawPop`, `mawPopTime`). Hit timing,
`mawLunge` and every gameplay key are unchanged. After sheet:
`scratchpad/fix-1/pc4/matrix-expansion__predatory-canopy-sheet.jpg` (f42 reared, f47 plunge).
