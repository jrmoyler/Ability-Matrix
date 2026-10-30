# Chain Arc — `collective/chain`
Lightning · line · range 3–18 m, leader 34 m/s, capture 1.6 m, up to 5 leaps of ≤ 7.5 m · ≈3.5–4.5 s on screen (travel ≈0.3 s + chain ≈0.16 s/leap + 1.6 s hang + 0.9 s exit, × `global.lifetime` on the hang)

## Read in one line
A jagged white bolt runs out of the hand, catches the first body and leaps body to body, flinging each one; wherever it goes to ground a cluster of black fulgurite glass heaves out of a branching Lichtenberg scorch, and charge keeps crawling through both until they sink and crumble.

## Beats
| t (s) | Beat | On screen |
|---|---|---|
| 0.00 | Anticipation | A crack of static (STREAK sparks) off the hand, small shake; the leader leaves at once. |
| 0.00–≈0.3 | Travel | Thin searching leader (half the forks, 0.7× width) races down the line at 1 m height, mote trail behind its head. |
| first catch | Impact | The bolt snaps onto the body (race 0.06 s, punch 1.6×, 1.7× wide), body thrown along the leap (impulse 5.2, lift 4.6, spin 2.2); 46 sparks, 30 motes, ARC burn r 1.4 m, light punch 14, shake 0.16, flash 0.16. Under the body a **Lichtenberg scorch** (r 1.9 m) burns out from white-hot over 0.28 s and a **fulgurite** (1.25 m tall, 1.15 m across) heaves out of the floor with an overshoot in 0.16 s. |
| +0.16 s each | Chain | Leaps to the nearest unstruck body within 7.5 m, same impact per body; every struck body gets its own glass and scorch. A leader that finds nobody grounds at the end of the line instead: 1.5× fulgurite, r 3 m scorch, STORM shell 3.2 m, extra floor forks. |
| last strike → +1.6 s | Linger | Bolts crackle (re-rolled 22×/s), latch to the thrown bodies, then tear apart; the glass cracks cool white → pale blue → violet → near-black while bands of residual charge crawl up the spikes (1.4 /s) and the spikes creep 12 % taller; pulses run outward along the scorch veins; sparks spit off the hanging ends. |
| +0.9 s | Exit | Bolts crackle out; glass sinks 85 % of its height into the floor while crumbling (noise dissolve); the scorch fades and blows away. |

## Layers
1. Bolts — `ChainArcGeometry` (Brownian-bridge channel + forks, rebuilt in place) + `ChainArcBoltMaterial` (white core, pale-blue glow, violet edge, crawl, tear-apart).
2. Sparks — `chain.sparks` STREAK, gradient white → #cfe0ff → #8fb8ff → #3a2a9a.
3. Motes — `chain.motes` SOFT additive, curl, gradient to #1a1040.
4. Ground — ARC decals per body, STORM shell + ground forks when it grounds.
5. Feedback — guttering light that rides the newest strike, punch/shake/flash per hit.
6. Fulgurite (hero) — `ChainArcFulguriteGeometry`: authored cluster of 7 faceted, kinked, tapering glass tubes with side branches on a fused crust (3 variants). `createChainFulguriteMaterial`: opaque, sun-lit (`uLightDir`), on `LAYER.WORLD`, casts a shadow; dark glass (#05060f → #141a3a), glint + cold fresnel, ridged-noise cracks carrying the bolt ramp, charge bands crawling root→tip, crumble dissolve.
7. Lichtenberg scorch (floor) — `createChainScarMaterial`: normal-blended char disc (#08071a) with a dendritic figure (warped log-polar ridged noise) revealed outward, hot front, cooling ramp, outward charge pulses.

## Signature
Lightning that leaves something solid behind: fused black glass standing in burnt fern-figures wherever the chain went to ground.

## Palette
core #ffffff, tint #8fb8ff / #cfe0ff, body #5a3cff, deep #05060f / #08071a (glass root and char)

## Gameplay
`handlesOwnHits` (unchanged): leader capture 1.6 m, leaps ≤ 7.5 m, `jumpDelay` 0.16 s, `maxJumps` 5; bodies killed through `dummy.kill` with `hit` from settings. The new layers are presentation only; `lifetime` (1.6 s) and `fadeTime` (0.9 s) only lengthen the hang after the last strike.
