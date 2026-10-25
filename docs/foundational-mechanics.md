# UCSM foundational mechanics

Implementation target: the existing Three.js sandbox, based on `cdb861f070e34f99046673241e66ec047e608cc7`.

## Source and scope

The merged `registry.js`, `ontology.js`, `reactions.js`, `CombatStateManager.js`,
and native/hosted runtime hit contracts were inspected first. The **Ability Matrix
Production Bible v1.0** (24 October 2026) was recovered and read: dossiers 277
(Infernal Circuit), 322 (Aegis Exemplar), 324 (Shatterpoint Reversal), 350
(Continental Uprising), and 371 (Storm Catalyst). The repository's already-merged
short family UIDs are preserved; the Bible's longer family slugs are design labels,
not replacement identifiers.

This change implements five reusable managers and five representative moves. The
46 standard additions and the other 110 mechanic moves remain proposed and
unselectable. The 230 existing castables retain their UIDs, presets, geometry and
vendored source. New mechanics have a separate control panel and preset namespace;
they are not falsely added to the existing catalog's ten-per-element count.

## Play

Open the sandbox. Expand **Combat mechanics** if collapsed. Select a move using its
button or **Alt+Z / Alt+X / Alt+C / Alt+V / Alt+B**, then click the arena. The ground
marker shows placement. Escape cancels targeting. Existing ability shortcuts keep
working; selecting/arming an ordinary ability releases mechanic targeting.

| Move | Playable behavior | Counterplay / failure |
| --- | --- | --- |
| Infernal Circuit | Place up to three articulated braziers. Valid links form a live graph; fire capsules damage hostiles and contribute elemental regions. | 14 m maximum link, terrain LOS, 12 s lifetime, two hostile impacts break an anchor. Third placement starts the 20 s network cooldown. |
| Aegis Exemplar | Force armor follows the caster, reduces movement speed, drains sovereignty, reduces incoming damage and banks the blocked impulse. Every third ordinary cast adds a local force wave. Select the active stance again for its banked radial finisher. | 15 s maximum, no stacking, energy exhaustion/death/interrupt restores baseline; no phantom bank on a perfect counter. |
| Shatterpoint Reversal | After 0.1 s anticipation, a 0.13 s perfect window rejects the arriving hit and returns a frosty strike. The following 0.2 s window halves damage/exposure. | Whiff costs recovery; uncounterable and counter-return tags bypass reflection; hostile source must be in range. |
| Continental Uprising | A raised ramp patch and three stratified ridges provide temporary ground height, swept movement collision and line-attack cover. | 10 s lifetime; placement rejects actors, overlapping terrain and arena-edge overflow. Zone attacks bypass line cover. |
| Storm Catalyst | Aim at a live compatible elemental region, e.g. an actual Maelstrom footprint. A storm emitter consumes up to three spatially overlapping ingredients and resolves typed UCSM reactions. | No ingredient means refusal and refund. Generic/incompatible combinations are not promoted into invented reactions. Normal depth, intensity, diminishing and reaction budgets apply. |

**Incoming attack drill** is optional and off by default. An eligible living dummy
with line of sight telegraphs an ember toward the player's sampled position every
three seconds. Move away, block it, or time the frost counter as it arrives. When
anchors exist, alternating attacks target an anchor. Killed sources cannot finish
a queued attack. Drill death resets the practice caster. It is a sandbox opponent,
not a new autonomous enemy AI or a networking implementation.

**Mechanic sound** is optional and off by default. Original synthesized cues need
no imported audio license. Reduced-motion preference removes secondary orbital
motion while preserving authoritative timing and hit readability. C clears all
mechanic constructs/effects through the existing clear action. Pause freezes the
simulation and refuses new mechanic casts.

## Architecture and contracts

`MechanicSystems` attaches to a `CombatStateManager` and invokes exported
`WeavingManager`, `StanceManager`, `CounterManager`, `WorldshapeManager`, and
`ConvergenceManager` instances. Gameplay has no Three.js, randomness, wall-clock
time, timers or DOM dependency. `MechanicHost` handles input/host damage; the
Three.js `MechanicPresentation` only renders state and cues.

```js
const systems = new MechanicSystems(combat);
combat.upsertEntity({ id: 'caster', teamId: 'player', position: [0, 0, 0] });
systems.command({ family: 'weave', ownerId: 'caster', position: [3, 0, -5] });
combat.advance(); // Or combat.step(dt); never advance a second mechanic clock.
```

The command return value means **queued**, not successfully activated. Inspect
`systems.results` for acceptance/refusal after anticipation. Each request is
validated for implementation, owner, finite coordinates, range, energy, recovery,
cooldown and budgets. Failed placement/ingredient validation refunds the reserved
cost and releases cooldown; interruption still costs the attempted cast.

Commands are processed in insertion order on UCSM ticks. Expiry and manager
updates run before event ingestion. Each action emits ordinary UCSM events with
its original UID/owner/team. A unique command ID prevents replay (bounded 4096-ID
window). The recent result list is bounded to 64.

Optional hit `damage` is clamped to [0, 10]. Existing events without that field
keep their original reporting-only semantics. Shields absorb damage; each target
is deduplicated; direct damage is delivered once through the effect outbox. Perfect
counter filtering precedes stance banking. Per-target reductions do not weaken
unprotected targets in the same hit. Reflected hits are tagged to prevent ping-pong.

`worldshape.blocked(from, to, radius)`, `move(from, to, radius)` and `heightAt(point)`
are the same authority for the renderer's terrain, player movement and the drill's
LOS. The movement query sweeps the whole segment, including dashes. The native
character controller resets its Y coordinate, so the host reapplies sampled ground
height after animation update. Terrain is a combat-local overlay: no persistent
base-ground mesh is mutated and no global navmesh is claimed. Host integrations
can use `blocked` for their own AI navigation. Existing zone attacks can still
reach behind cover; direct line hits are rejected before `Dummy.kill` commits.

The adapter tags every lazily loaded hosted runtime before its first cast. Dummy
prototype hooks resolve their adapter through the actual dummy instance, avoiding
a stale scene closure across disposal/reinitialization. Direct mechanic damage is
not reported a second time through those hooks.

## Budgets, presets and resources

Authoritative tuning is `mechanics/presets.js`. The five JSON files under
`presets/mechanics/` are portable exports and have a round-trip drift test.
Defaults: 64 queued commands, 8 commands/tick, 32 actors, 32 pending actions,
48 anchors, 8 terrain patches, 24 mechanic events/tick, 8 direct targets/action.
UCSM's own maxQueue, region, reaction, intensity, depth and stacking budgets still
apply. Sovereignty starts at 100, regenerates at 8/s outside a stance, and drains
at 5/s in Aegis. These are initial balance values, not competitive balance claims.

Procedural meshes/materials are original code in this change. Shared immutable
geometries/materials are allocated once per presenter; persistent rigs are keyed
by authoritative state; transient presentation objects are capped at 32. Clear
removes scene objects, and dispose releases every shared GPU resource, listener,
control panel and AudioContext. No external images, generated assets or licensed
model packs were introduced.

## Verification and limits

See `evidence/mechanics/VALIDATION.md` for exact commands and observed results.
The deterministic guarantee is **identical ordered commands/events at identical
ticks**, including 30/60/120 FPS accumulator partitions under the existing catch-up
limit. It does not assert that all 230 legacy renderers, randomized dummy spawning,
or their animation systems have become deterministic. Multiplayer rollback,
latency compensation, persistence and target-device certification are outside this
sandbox implementation.

The existing castables are regression-checked at the shared combat contract and
by the repository's source/preset/geometry tests. Browser evidence distinguishes
real input playtests from structured queries and does not equate them with a full
manual artistic review of all 230 effects. Unimplemented proposals must not be
made selectable merely because a family manager now exists.
