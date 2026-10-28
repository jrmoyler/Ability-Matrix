import test from 'node:test';
import assert from 'node:assert/strict';

import { DIFFICULTIES, DuelBrain, aimAt, chooseCast, steer, threatens, PREFERRED_RANGE } from '../packs/sandbox/src/combat/duel/DuelAI.js';
import { CPU_EXCLUSIONS, buildLoadout, classifyCastable, classifyMechanic, filterCastables, parseCpuParam } from '../packs/sandbox/src/combat/duel/DuelLoadout.js';
import { DuelRound, castTouches } from '../packs/sandbox/src/combat/duel/DuelReferee.js';
import { seededRandom } from '../packs/sandbox/src/combat/DummyArchetypes.js';
import { ELEMENT_OF } from '../packs/sandbox/src/config/elements.js';
import { PLAYABLE_MECHANICS, MECHANIC_PRESETS } from '../packs/sandbox/src/combat/ucsm/mechanics/presets.js';

test('loadout: summons, buffs, casters that move or copy their body are excluded with a reason', () => {
  for (const uid of ['handcast/drone', 'handcast/monowheel', 'linear-ext/boost', 'collective/blink', 'atlas/recall', 'casting/lance', 'matrix-expansion/ashen-doppelganger']) {
    const verdict = classifyCastable(uid);
    assert.equal(verdict.ok, false, uid);
    assert.ok(verdict.reason.length > 10, `${uid} says why`);
  }
  assert.equal(classifyCastable('linear/meteor').ok, true);
  assert.equal(classifyCastable('x/summoned', { kind: 'summon' }).ok, false);
  assert.equal(classifyCastable('x/self', { cast: 'self' }).ok, false);
  assert.equal(classifyCastable('nonsense').ok, false);

  // Over the whole sandbox roster: every exclusion that names a real uid is one.
  const { allowed, excluded } = filterCastables(Object.keys(ELEMENT_OF));
  assert.ok(allowed.length > 200, 'nearly everything works from a second caster');
  for (const { uid } of excluded) assert.ok(CPU_EXCLUSIONS[uid], uid);
  assert.ok(!allowed.includes('handcast/drone'));
});

test('loadout presets: random element, one element, mirror and custom', () => {
  const allowed = ['linear/meteor', 'collective/swarm', 'codex/solarlash', 'linear/ice', 'handcast/frost', 'codex/rimeward'];
  const elementOf = (uid) => ({ 'linear/meteor': 'fire', 'collective/swarm': 'fire', 'codex/solarlash': 'fire', 'linear/ice': 'frost', 'handcast/frost': 'frost', 'codex/rimeward': 'frost' })[uid];
  const random = seededRandom(3);
  const r = buildLoadout('random', { allowed, elementOf, random, size: 2 });
  assert.equal(r.castables.length, 2);
  assert.ok(r.castables.every((uid) => elementOf(uid) === r.element));
  const one = buildLoadout('element', { allowed, elementOf, element: 'frost' });
  assert.deepEqual(one, { castables: ['linear/ice', 'handcast/frost', 'codex/rimeward'], element: 'frost' });
  const mirror = buildLoadout('mirror', { allowed, elementOf, mirror: ['linear/ice', 'handcast/drone', 'linear/ice'] });
  assert.deepEqual(mirror.castables, ['linear/ice'], 'mirror keeps only what the CPU may cast, once');
  const custom = buildLoadout('custom', { allowed, elementOf, custom: ['codex/solarlash', 'collective/blink'] });
  assert.deepEqual(custom.castables, ['codex/solarlash']);
  assert.deepEqual(parseCpuParam('linear/meteor, codex/solarlash,,<script>'), ['linear/meteor', 'codex/solarlash']);
});

test('every implemented mechanic is usable by the CPU, each with a note', () => {
  assert.ok(PLAYABLE_MECHANICS.length >= 31);
  for (const preset of Object.values(MECHANIC_PRESETS)) {
    const verdict = classifyMechanic(preset);
    assert.equal(verdict.ok, true);
    assert.ok(verdict.reason);
  }
  assert.equal(classifyMechanic(null).ok, false);
});

test('AI choice: in range and off cooldown, least recently used first', () => {
  const loadout = [
    { id: 'near', range: 6, minRange: 0 },
    { id: 'far', range: 20, minRange: 8 },
    { id: 'mid', range: 14, minRange: 2 }
  ];
  const ready = () => true;
  const noise = () => 0;
  assert.equal(chooseCast(loadout, { distance: 4, ready, random: noise }).id, 'near');
  const lastUsed = new Map([['near', 5]]);
  assert.equal(chooseCast(loadout, { distance: 4, ready, lastUsed, random: noise }).id, 'mid');
  assert.equal(chooseCast(loadout, { distance: 18, ready, random: noise }).id, 'far');
  assert.equal(chooseCast(loadout, { distance: 4, ready: (id) => id === 'far', random: noise }), null);
  assert.equal(chooseCast(loadout, { distance: 40, ready, random: noise }), null);
});

test('AI movement holds its preferred range and strafes', () => {
  const far = steer({ x: 0, z: 0 }, { x: 0, z: 20 }, 1, 3);
  assert.ok(far.z > 0, 'closes in from far away');
  const near = steer({ x: 0, z: 0 }, { x: 0, z: 3 }, 1, 3);
  assert.ok(near.z < 0, 'backs off when too close');
  const held = steer({ x: 0, z: 0 }, { x: 0, z: PREFERRED_RANGE }, 1, 3);
  assert.ok(Math.abs(held.z) < 1e-9 && Math.abs(held.x) > 0, 'inside the band it only strafes');
  const other = steer({ x: 0, z: 0 }, { x: 0, z: PREFERRED_RANGE }, -1, 3);
  assert.ok(Math.sign(other.x) === -Math.sign(held.x), 'the strafe side flips');
});

test('AI aim error and lead scale with difficulty', () => {
  const from = { x: 0, z: 0 };
  const target = { x: 0, z: 10 };
  const velocity = { x: 4, z: 0 };
  const exact = aimAt(from, target, velocity, DIFFICULTIES.archmage, { random: () => 0.5 });
  assert.ok(exact.x > 1, 'the archmage leads a moving target');
  const naive = aimAt(from, target, velocity, DIFFICULTIES.apprentice, { random: () => 0.5 });
  assert.ok(Math.abs(naive.x) < 1e-9, 'the apprentice aims where you are');
  const spread = (d) => {
    const r = seededRandom(11);
    let worst = 0;
    for (let i = 0; i < 200; i++) worst = Math.max(worst, Math.abs(Math.atan2(aimAt(from, target, null, d, { random: r }).dirX, 1)));
    return worst;
  };
  assert.ok(spread(DIFFICULTIES.apprentice) > spread(DIFFICULTIES.archmage) * 3);
});

test('AI telegraphs every cast for its difficulty before releasing it, then cools down', () => {
  for (const difficulty of Object.values(DIFFICULTIES)) {
    const brain = new DuelBrain({ difficulty, loadout: [{ id: 'bolt', range: 20, minRange: 0, cooldown: 3 }], random: seededRandom(5) });
    const sense = { self: { x: 0, z: 0 }, target: { x: 0, z: 9 } };
    let windupAt = null;
    let releaseAt = null;
    let t = 0;
    for (let i = 0; i < 600 && releaseAt === null; i++) {
      const act = brain.update(1 / 30, sense);
      t += 1 / 30;
      if (act.windup) {
        windupAt = t;
        assert.equal(act.windup.telegraph, difficulty.telegraph);
        assert.deepEqual(act.move, { x: 0, z: 0 }, 'planted while it winds up');
      }
      if (act.release) releaseAt = t;
    }
    assert.ok(windupAt !== null && releaseAt !== null, difficulty.id);
    assert.ok(Math.abs(releaseAt - windupAt - difficulty.telegraph) < 0.05, `${difficulty.id} telegraph`);
    assert.equal(brain.ready('bolt'), false, 'on cooldown after the release');
  }
  assert.ok(DIFFICULTIES.apprentice.telegraph > DIFFICULTIES.adept.telegraph && DIFFICULTIES.adept.telegraph > DIFFICULTIES.archmage.telegraph);
  assert.ok(DIFFICULTIES.apprentice.interval[0] > DIFFICULTIES.archmage.interval[1]);
});

test('AI dodges a threat on its line, sideways, once', () => {
  const threat = { id: 1, origin: { x: 0, z: 0 }, dir: { x: 0, z: 1 }, reach: 20 };
  assert.equal(threatens(threat, { x: 0.5, z: 8 }), true);
  assert.equal(threatens(threat, { x: 5, z: 8 }), false);
  assert.equal(threatens(threat, { x: 0, z: -3 }), false, 'behind the caster');
  const brain = new DuelBrain({ difficulty: { ...DIFFICULTIES.archmage, dodge: 1 }, loadout: [], random: () => 0.3 });
  const act = brain.update(1 / 30, { self: { x: 0.5, z: 8 }, target: { x: 0, z: 0 }, threats: [threat] });
  assert.ok(act.dodge && Math.abs(act.dodge.z) < 1e-9 && act.dodge.x > 0, 'steps off the line, away from it');
  assert.equal(brain.update(1 / 30, { self: { x: 0.5, z: 8 }, target: { x: 0, z: 0 }, threats: [threat] }).dodge, undefined);
});

test('referee: a line cast is the swept capsule, a zone cast a disc armed when it lands', () => {
  const player = { x: 1, z: 6, r: 0.42 };
  const line = { shape: 'line', origin: { x: 0, z: 0 }, front: { x: 0, z: 4 }, u: 0.4, lineRadius: 1.5 };
  assert.equal(castTouches(line, player), false, 'the front has not got there yet');
  assert.equal(castTouches({ ...line, front: { x: 0, z: 8 } }, player), true);
  assert.equal(castTouches({ ...line, front: { x: 0, z: 8 } }, { ...player, x: 2.5 }), false, 'outside the capsule');
  const zone = { shape: 'zone', origin: { x: 0, z: 0 }, front: { x: 0, z: 5 }, landing: { x: 0, z: 10 }, u: 0.5, zoneRadius: 3 };
  assert.equal(castTouches(zone, { x: 0, z: 10, r: 0.4 }), false, 'not armed in flight');
  assert.equal(castTouches({ ...zone, u: 1 }, { x: 0, z: 12.5, r: 0.4 }), true);
  assert.equal(castTouches({ ...zone, u: 1 }, { x: 0, z: 14, r: 0.4 }), false);
});

test('round: HP, grace, reduction, the lethal blow ends it and nothing lands after', () => {
  const round = new DuelRound({ playerHp: 30, wizardHp: 20, grace: 0.5 });
  assert.deepEqual(round.hit('wizard', 10), { landed: true, dealt: 10, lethal: false });
  assert.equal(round.hit('wizard', 10).landed, false, 'inside the grace window');
  round.step(0.6);
  round.reduction.wizard = 0.5;
  assert.equal(round.hit('wizard', 10).dealt, 5);
  round.step(0.6);
  round.reduction.wizard = 0;
  const last = round.hit('wizard', 10);
  assert.equal(last.lethal, true);
  assert.equal(round.over, true);
  assert.equal(round.winner, 'player');
  round.step(1);
  assert.equal(round.hit('player', 99).landed, false, 'the round is over');
  const snap = round.snapshot();
  assert.equal(snap.wizard.hp, 0);
  assert.equal(snap.player.hp, 30);
  assert.equal(snap.wizard.hitsTaken, 3);
});
