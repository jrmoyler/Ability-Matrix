import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { CombatStateManager } from '../packs/sandbox/src/combat/ucsm/CombatStateManager.js';
import { MechanicSystems } from '../packs/sandbox/src/combat/ucsm/mechanics/MechanicSystems.js';
import { MECHANIC_PRESETS as P, CRYOSTASIS_MESH, COUNTER_VARIANTS, MECHANIC_VARIANTS } from '../packs/sandbox/src/combat/ucsm/mechanics/presets.js';
import { ELEMENT_OF } from '../packs/sandbox/src/config/elements.js';
import { Scene } from 'three';
import { MechanicPresentation } from '../packs/sandbox/src/combat/ucsm/mechanics/MechanicPresentation.js';
const arena = (budget = {}, mb = {}) => {
  const m = new CombatStateManager(budget);
  m.upsertEntity({ id: 'caster', teamId: 'player' });
  m.upsertEntity({ id: 'enemy', teamId: 'enemy', position: [8, 0, 0], health: 10 });
  m.upsertEntity({ id: 'ally', teamId: 'player', position: [8, 0, 1], health: 10 });
  return { m, s: new MechanicSystems(m, mb) };
};
const ticks = (m, n) => {
  for (let i = 0; i < n; i++) m.advance();
};
const cast = (s, family, position = [0, 0, 0]) => {
  const r = s.command({ family, position });
  assert.equal(r.ok, true);
  ticks(s.m, s.t(P[family].anticipation) + 1);
  return r;
};
const incoming = (m, extra = {}) =>
  m.submit({
    type: 'hit',
    ownerId: 'enemy',
    teamId: 'enemy',
    abilityUid: 'linear/fire',
    element: 'fire',
    position: [8, 0, 0],
    targetIds: ['caster'],
    damage: 0.4,
    ...extra
  });

test('five managers have executable, unique, finite presets; commands reject malformed inputs and replay', () => {
  const { s } = arena();
  assert.equal(Object.keys(P).length, 5);
  assert.equal(s.command({ family: 'missing' }).ok, false);
  assert.equal(s.command({ family: 'weave', position: [NaN, 0, 0] }).ok, false);
  assert.equal(s.command({ family: 'weave', ownerId: 'unknown' }).ok, false);
  assert.equal(s.command({ family: 'weave', commandId: 'one' }).ok, true);
  assert.equal(s.command({ family: 'weave', commandId: 'one' }).ok, false);
});

test('Infernal Circuit: 3 anchors, real link contacts, hostile-only damage, range and expiry', () => {
  const { m, s } = arena();
  cast(s, 'weave', [5, 0, 0]);
  ticks(m, 24);
  cast(s, 'weave', [11, 0, 0]);
  ticks(m, 24);
  cast(s, 'weave', [8, 0, 5]);
  ticks(m, 20);
  assert.equal(m.anchors.size, 3);
  assert.equal(s.weave.links.length, 3);
  assert.ok(m.entities.get('enemy').health < 10);
  assert.equal(m.entities.get('ally').health, 10);
  assert.ok(m.entities.get('enemy').statuses.some((x) => x.tag === 'burning'));
  assert.ok(m.regions.size > 0);
  assert.equal(
    s.weave.activate({ id: 'four', ownerId: 'caster', family: 'weave', position: [4, 0, 1] }),
    'anchor limit'
  );
  ticks(m, 400);
  assert.equal(m.anchors.size, 0);
  assert.equal(s.weave.links.length, 0);
});

test('hostile existing-cast footprints destroy anchors and remove ghost links; allied casts do not', () => {
  const { m, s } = arena();
  cast(s, 'weave', [4, 0, 0]);
  ticks(m, 24);
  cast(s, 'weave', [8, 0, 0]);
  const impact = {
    type: 'terrain-impact',
    abilityUid: 'codex/quake',
    element: 'earth',
    shape: { kind: 'disc', x: 4, z: 0, r: 1 },
    intensity: 3
  };
  m.submit({ ...impact, ownerId: 'caster', teamId: 'player' });
  m.advance();
  assert.equal(m.anchors.size, 2);
  m.submit({ ...impact, ownerId: 'enemy', teamId: 'enemy' });
  ticks(m, 2);
  assert.equal(m.anchors.size, 1);
  assert.equal(s.weave.links.length, 0);
});

test('Cryostasis Mesh places frost anchors and chills hostile crossers without changing Infernal Circuit', () => {
  const { m, s } = arena();
  const add = (position) => {
    assert.equal(s.command({ family: 'weave', uid: CRYOSTASIS_MESH.uid, position }).ok, true);
    ticks(m, s.t(CRYOSTASIS_MESH.anticipation) + 1);
  };
  add([4, 0, 0]);
  ticks(m, 24);
  add([12, 0, 0]);
  m.advance();
  assert.equal(s.weave.links.length, 1);
  assert.ok(m.entities.get('enemy').statuses.some((x) => x.tag === 'chilled'));
  assert.ok(m.recentEvents.some((x) => x.abilityUid === CRYOSTASIS_MESH.uid && x.element === 'frost'));
  assert.equal(m.entities.get('ally').health, 10);
  assert.equal(s.weave.activate({ id: 'mixed', family: 'weave', uid: P.weave.uid, ownerId: 'caster', position: [8, 0, 5] }), 'remove existing anchors before changing weave');
  assert.equal(s.command({ family: 'counter', uid: CRYOSTASIS_MESH.uid }).ok, false);
});

test('Aegis Exemplar: drain, movement, blocked impact bank, combo grammar, finisher and restoration', () => {
  const { m, s } = arena();
  cast(s, 'stance');
  assert.equal(s.speed('caster'), 0.75);
  const energy = s.actor('caster').energy;
  incoming(m);
  m.advance();
  assert.ok(m.entities.get('caster').health > 0.8);
  assert.ok(s.stance.active.get('caster').bank > 0);
  assert.ok(s.actor('caster').energy < energy);
  for (let i = 0; i < 3; i++)
    m.submit({
      type: 'cast-start',
      ownerId: 'caster',
      teamId: 'player',
      element: 'fire',
      abilityUid: 'linear/fire'
    });
  m.advance();
  assert.ok(m.cues.some((c) => c.phase === 'finisher'));
  s.command({ family: 'stance', action: 'finish' });
  m.advance();
  assert.equal(s.stance.active.size, 0);
  assert.equal(s.speed('caster'), 1, 'baseline locomotion restored');
});

test('stance baseline restores on death, timeout, depletion and interruption', () => {
  for (const end of ['death', 'timeout', 'depletion', 'interrupt']) {
    const { m, s } = arena();
    cast(s, 'stance');
    if (end === 'death') m.setAlive('caster', false);
    if (end === 'depletion') s.actor('caster').energy = 0;
    if (end === 'interrupt')
      m.submit({
        type: 'interrupt',
        ownerId: 'enemy',
        teamId: 'enemy',
        element: 'force',
        abilityUid: 'a/stop',
        targetIds: ['caster']
      });
    ticks(m, end === 'timeout' ? 460 : 2);
    assert.equal(s.stance.active.size, 0, end);
    assert.equal(s.speed('caster'), 1, end);
  }
});

test('Shatterpoint: perfect, partial, whiff, uncounterable, exactly-once and no counter ping-pong', () => {
  const perfect = arena();
  cast(perfect.s, 'counter');
  incoming(perfect.m, { eventId: 'strike' });
  perfect.m.advance();
  assert.equal(perfect.m.entities.get('caster').health, 1);
  perfect.m.advance();
  assert.equal(perfect.m.entities.get('enemy').health, 9);
  assert.ok(perfect.m.entities.get('enemy').statuses.some((s) => s.tag === 'chilled'));
  incoming(perfect.m, { eventId: 'strike' });
  perfect.m.advance();
  assert.equal(perfect.m.entities.get('enemy').health, 9);
  const partial = arena();
  cast(partial.s, 'counter');
  ticks(partial.m, partial.s.t(P.counter.perfect));
  incoming(partial.m);
  partial.m.advance();
  assert.equal(partial.m.entities.get('caster').health, 0.8);
  const immune = arena();
  cast(immune.s, 'counter');
  incoming(immune.m, { tags: ['uncounterable'] });
  immune.m.advance();
  assert.equal(immune.m.entities.get('caster').health, 0.6);
  const whiff = arena();
  cast(whiff.s, 'counter');
  ticks(whiff.m, 20);
  assert.equal(whiff.s.counter.windows.size, 0);
  assert.ok(whiff.m.cues.some((c) => c.phase === 'whiff'));
});

test('five additional counter moves guard, return their own elemental hit, and remain hostile-only', () => {
  for (const p of COUNTER_VARIANTS) {
    const { m, s } = arena();
    m.upsertEntity({ id: 'enemy2', teamId: 'enemy', position: [8, 0, 1], health: 10 });
    assert.equal(s.command({ family: 'counter', uid: p.uid }).ok, true, p.name);
    ticks(m, s.t(p.anticipation) + 1);
    incoming(m);
    m.advance();
    assert.equal(m.entities.get('caster').health, 1, p.name);
    m.advance();
    assert.ok(m.entities.get('enemy').health < 10, p.name);
    assert.equal(m.entities.get('ally').health, 10, p.name);
    assert.ok(m.recentEvents.some((e) => e.abilityUid === p.uid && e.element === p.element && e.tags.includes('counter-return')), p.name);
    if (p.splash) assert.ok(m.entities.get('enemy2').health < 10, p.name);
    if (p.footprint) assert.ok([...m.regions.values()].some((r) => r.element === p.element), p.name);
    if (p.shield) assert.equal(m.entities.get('caster').shields, p.shield, p.name);
  }
});

test('counter variants have distinct geometry and per-move perfect and recovery timing', () => {
  const { s, m } = arena(), v = new MechanicPresentation(new Scene(), s);
  const signatures = new Set();
  for (const p of COUNTER_VARIANTS) {
    const g = v.build('counter', { uid: p.uid });
    const shape = [];
    g.traverse(n => { if (n.isMesh) shape.push([n.geometry.type, n.position.x.toFixed(2), n.position.y.toFixed(2), n.position.z.toFixed(2)]); });
    assert.ok(shape.length >= 10, p.name);
    signatures.add(JSON.stringify(shape));
  }
  assert.equal(signatures.size, COUNTER_VARIANTS.length);
  const p = COUNTER_VARIANTS[0];
  assert.equal(s.command({ family: 'counter', uid: p.uid }).ok, true);
  ticks(m, s.t(p.anticipation + p.perfect + p.partial) + 2);
  assert.equal(s.counter.windows.size, 0);
  assert.ok(s.actor('caster').recoveryUntil > m.tick);
  v.dispose();
});

test('all variant guards respect partial timing, uncounterable attacks and cancellation', () => {
  for (const p of COUNTER_VARIANTS) {
    const open = () => {
      const a = arena();
      assert.equal(a.s.command({ family: 'counter', uid: p.uid }).ok, true);
      ticks(a.m, a.s.t(p.anticipation) + 1);
      return a;
    };
    const partial = open();
    ticks(partial.m, partial.s.t(p.perfect));
    incoming(partial.m);
    partial.m.advance();
    assert.ok(Math.abs(partial.m.entities.get('caster').health - (1 - 0.4 * p.reduction)) < 1e-9, p.name);
    partial.m.advance();
    assert.equal(partial.m.entities.get('enemy').health, 10, `${p.name}: partial has no return`);
    const immune = open();
    incoming(immune.m, { tags: ['uncounterable'] });
    immune.m.advance();
    assert.equal(immune.m.entities.get('caster').health, 0.6, p.name);
    const cancelled = open();
    cancelled.s.cancel('caster');
    incoming(cancelled.m);
    cancelled.m.advance();
    assert.equal(cancelled.m.entities.get('caster').health, 0.6, p.name);
    assert.equal(cancelled.s.counter.windows.size, 0, p.name);
  }
});

test('Continental Uprising: shared swept collision/LOS, ramp height, overlap safety and rollback', () => {
  const { m, s } = arena();
  cast(s, 'worldshape', [0, 0, 8]);
  assert.equal(s.worldshape.regions.size, 1);
  assert.equal(s.worldshape.blocked([0, 0, 0], [0, 0, 15]), true);
  assert.deepEqual(s.worldshape.move([0, 0, 0], [0, 0, 15]), [0, 0, 0]);
  assert.ok(s.worldshape.heightAt([0, 0, 6]) > 0);
  assert.equal(
    s.worldshape.activate({
      id: 'overlap',
      family: 'worldshape',
      ownerId: 'caster',
      position: [0, 0, 8],
      direction: [0, 0, 1]
    }),
    'terrain overlap'
  );
  assert.equal(
    s.worldshape.activate({
      id: 'edge',
      family: 'worldshape',
      ownerId: 'caster',
      position: [47, 0, 0],
      direction: [0, 0, 1]
    }),
    'terrain outside arena'
  );
  ticks(m, 310);
  assert.equal(s.worldshape.blocked([0, 0, 0], [0, 0, 15]), false);
  assert.equal(s.worldshape.heightAt([0, 0, 8]), 0);
});

test('Storm Catalyst consumes only active compatible ingredients, attributed to owner, obeys reaction caps', () => {
  const { m, s } = arena({ reactionsPerTick: 1, maxIntensity: 1.5 });
  m.submit({
    type: 'terrain-impact',
    ownerId: 'caster',
    teamId: 'player',
    abilityUid: 'codex/maelstrom',
    element: 'water',
    shape: { kind: 'disc', x: 8, z: 0, r: 3 },
    durationTicks: 100
  });
  m.advance();
  const ingredient = [...m.regions.keys()][0];
  cast(s, 'convergence', [8, 0, 0]);
  assert.ok(m.log.some((r) => r.kind === 'Storm Conduction'));
  assert.equal(m.regions.has(ingredient), false);
  assert.ok(m.log.every((r) => r.intensity <= 1.5 && r.depth <= m.budget.maxDepth));
  assert.ok(m.recentEvents.some((e) => e.abilityUid === P.convergence.uid && e.ownerId === 'caster'));
  const none = arena();
  cast(none.s, 'convergence', [8, 0, 0]);
  assert.match(none.s.results.at(-1).reason, /compatible/);
  assert.equal(none.m.regions.size, 0);
});

test('death, clear and interrupted anticipation leave no orphaned constructs or delayed effects', () => {
  const { m, s } = arena();
  s.command({ family: 'worldshape', position: [0, 0, 8] });
  m.advance();
  m.submit({
    type: 'interrupt',
    ownerId: 'enemy',
    teamId: 'enemy',
    element: 'force',
    abilityUid: 'a/stop',
    targetIds: ['caster']
  });
  ticks(m, 50);
  assert.equal(s.worldshape.regions.size, 0);
  cast(s, 'weave', [4, 0, 0]);
  s.reset();
  ticks(m, 60);
  assert.equal(m.anchors.size, 0);
  assert.equal(s.pending.length, 0);
});

test('command, actor, pending, event and UCSM queue budgets are bounded', () => {
  const { m, s } = arena({ maxQueue: 3 }, { maxCommands: 2, eventsPerTick: 1, maxActors: 1 });
  assert.equal(s.command({ family: 'weave', position: [1, 0, 0] }).ok, true);
  assert.equal(s.command({ family: 'weave', position: [2, 0, 0] }).ok, true);
  assert.equal(s.command({ family: 'weave' }).ok, false);
  m.advance();
  assert.ok(m.queue.length <= 3);
  assert.ok(s.pending.length <= 1);
  assert.ok(s.used <= 1);
  assert.equal(s.command({ family: 'counter', ownerId: 'enemy' }).ok, false);
});

test('same commands and incoming events produce byte-identical state and cues at 30/60/120fps', () => {
  const replay = (fps) => {
    const { m, s } = arena();
    s.command({ family: 'weave', position: [4, 0, 0] });
    for (let i = 0; i < fps * 2; i++) m.step(1 / fps);
    s.command({ family: 'weave', position: [10, 0, 0] });
    for (let i = 0; i < fps * 2; i++) m.step(1 / fps);
    return JSON.stringify({
      tick: m.tick,
      anchors: [...m.anchors],
      events: m.recentEvents,
      log: m.log,
      health: m.entities.get('enemy').health,
      cues: m.cues
    });
  };
  assert.equal(replay(30), replay(60));
  assert.equal(replay(60), replay(120));
});

test('all 230 existing castable contracts keep identical reactions with idle managers attached', () => {
  const catalog = JSON.parse(readFileSync(new URL('../presets/catalog.json', import.meta.url)));
  const live = catalog.abilities.filter((a) => a.status === 'live' && a.kind !== 'move');
  assert.equal(live.length, 230);
  for (const a of live) {
    const run = (enabled) => {
      const { m } = arena();
      if (!enabled) m.mechanics = null;
      m.submit({
        type: 'status',
        ownerId: 'caster',
        teamId: 'player',
        abilityUid: 'seed/water',
        element: 'water',
        targetIds: ['enemy']
      });
      m.advance();
      m.submit({
        type: 'cast-start',
        ownerId: 'caster',
        teamId: 'player',
        abilityUid: a.uid,
        element: ELEMENT_OF[a.uid]
      });
      m.submit({
        type: 'hit',
        ownerId: 'caster',
        teamId: 'player',
        abilityUid: a.uid,
        element: ELEMENT_OF[a.uid],
        targetIds: ['enemy']
      });
      ticks(m, 8);
      return JSON.stringify({ log: m.log, entities: [...m.entities], effects: m.effects });
    };
    assert.equal(run(true), run(false), a.uid);
  }
});

test('all five Three.js rigs have distinct real geometry and release scene/resources', () => {
  const { s } = arena(),
    scene = new Scene(),
    v = new MechanicPresentation(scene, s);
  const counts = [],
    signatures = [];
  for (const kind of ['anchor', 'stance', 'counter', 'worldshape', 'convergence']) {
    const item = v.add(kind, kind, { position: [0, 0, 0], direction: [0, 0, 1] });
    let count = 0;
    item.g.traverse((n) => {
      if (n.isMesh) {
        count++;
        assert.ok(n.geometry.attributes.position.count > 0);
      }
    });
    counts.push(count);
    signatures.push(JSON.stringify(item.g.toJSON().geometries));
  }
  assert.equal(new Set(signatures).size, 5);
  assert.ok(counts.every((c) => c >= 10));
  let disposed = 0;
  for (const r of v.resources) r.addEventListener('dispose', () => disposed++);
  v.dispose();
  assert.equal(scene.children.length, 0);
  assert.equal(disposed, v.resources.length);
});

test('Cryostasis anchor has its own finite geometry and disposes shared resources', () => {
  const { s } = arena(), scene = new Scene(), v = new MechanicPresentation(scene, s);
  const fire = v.add('fire', 'anchor', { position: [0, 0, 0] });
  const frost = v.add('frost', 'anchor', { uid: CRYOSTASIS_MESH.uid, position: [0, 0, 0] });
  let count = 0;
  frost.g.traverse((n) => { if (n.isMesh) { count++; assert.ok(n.geometry.attributes.position.count > 0); } });
  assert.ok(count >= 10);
  assert.notDeepEqual(frost.g.toJSON().object.children, fire.g.toJSON().object.children);
  v.dispose();
  assert.equal(scene.children.length, 0);
});

test('partial counter does not reduce another target, and duplicate targets never double damage', () => {
  const { m, s } = arena();
  cast(s, 'counter');
  ticks(m, s.t(P.counter.perfect));
  incoming(m, { targetIds: ['caster', 'caster', 'ally'] });
  m.advance();
  assert.equal(m.entities.get('caster').health, 0.8);
  assert.equal(m.entities.get('ally').health, 9.6);
  assert.equal(m.entities.get('caster').statuses.find((x) => x.tag === 'burning').intensity, 0.5);
  assert.equal(m.entities.get('ally').statuses.find((x) => x.tag === 'burning').intensity, 1);
});

test('perfect counter does not bank phantom stance impact', () => {
  const { m, s } = arena();
  cast(s, 'stance');
  ticks(m, 30);
  cast(s, 'counter');
  incoming(m);
  m.advance();
  assert.equal(m.entities.get('caster').health, 1);
  assert.equal(s.stance.active.get('caster').bank, 0);
});

test('partial counter and stance compose their reductions and bank only absorbed damage', () => {
  const { m, s } = arena();
  cast(s, 'stance');
  ticks(m, 30);
  cast(s, 'counter');
  ticks(m, s.t(P.counter.perfect));
  incoming(m);
  m.advance();
  assert.ok(Math.abs(m.entities.get('caster').health - 0.93) < 1e-9);
  assert.ok(Math.abs(s.stance.active.get('caster').bank - 0.13) < 1e-9);
});

test('counter cannot erase an existing shield or cancel a strike when the return event cannot be queued', () => {
  const full = arena();
  const facet = COUNTER_VARIANTS.find((p) => p.uid.endsWith('/facet-reprisal'));
  full.m.entities.get('caster').shields = 2;
  full.s.command({ family: 'counter', uid: facet.uid });
  ticks(full.m, full.s.t(facet.anticipation) + 1);
  incoming(full.m);
  full.m.advance();
  assert.equal(full.m.entities.get('caster').shields, 2);
  const limited = arena({}, { eventsPerTick: 0 });
  limited.s.command({ family: 'counter' });
  ticks(limited.m, limited.s.t(P.counter.anticipation) + 1);
  incoming(limited.m);
  limited.m.advance();
  assert.equal(limited.m.entities.get('caster').health, 0.6);
  assert.ok(limited.m.cues.some((c) => c.phase === 'refused' && c.reason === 'event budget'));
});

test('multi-event counters refuse atomically when only the primary return fits', () => {
  for (const slug of ['feedback-execution', 'backdraft-reprisal']) {
    const { m, s } = arena({}, { eventsPerTick: 1 });
    const p = COUNTER_VARIANTS.find((x) => x.uid.endsWith('/' + slug));
    m.upsertEntity({ id: 'near', teamId: 'enemy', position: [9, 0, 0], health: 10 });
    s.command({ family: 'counter', uid: p.uid });
    ticks(m, s.t(p.anticipation) + 1);
    incoming(m);
    m.advance();
    assert.equal(m.entities.get('caster').health, 0.6, slug);
    assert.ok(m.cues.some((c) => c.phase === 'refused' && c.reason === 'event budget'), slug);
    assert.equal(m.entities.get('enemy').health, 10, slug);
  }
});

test('failed terrain placement refunds reservation; shield absorbs actual damage; death restores max health', () => {
  const { m, s } = arena();
  cast(s, 'worldshape', [8, 0, 0]);
  assert.match(s.results.at(-1).reason, /trap/);
  assert.equal(s.actor('caster').energy, 100);
  assert.ok(s.actor('caster').cooldowns.worldshape <= m.tick);
  m.entities.get('caster').shields = 0.2;
  incoming(m);
  m.advance();
  assert.equal(m.entities.get('caster').health, 0.8);
  m.setAlive('enemy', false);
  m.setAlive('enemy', true);
  assert.equal(m.entities.get('enemy').health, 10);
});

test('weave links recalculate line of sight and range; invalid terrain never traps actors', () => {
  const { m, s } = arena();
  cast(s, 'weave', [-4, 0, 6]);
  ticks(m, 24);
  cast(s, 'weave', [4, 0, 6]);
  assert.equal(s.weave.links.length, 0, 'links rebuild next tick');
  m.advance();
  assert.equal(s.weave.links.length, 1);
  ticks(m, 30);
  cast(s, 'worldshape', [0, 0, 6]);
  m.advance();
  assert.equal(s.weave.links.length, 0);
  s.worldshape.regions.clear();
  m.advance();
  assert.equal(s.weave.links.length, 1);
  [...s.weave.anchors.values()][1].position = [30, 0, 6];
  m.advance();
  assert.equal(s.weave.links.length, 0);
});

test('exported mechanic presets round trip without drift', () => {
  for (const [family, p] of Object.entries(P)) {
    const json = JSON.parse(readFileSync(new URL(`../presets/mechanics/${family}.json`, import.meta.url)));
    assert.deepEqual(json, { schemaVersion: 1, ...p });
  }
  for (const p of Object.values(MECHANIC_VARIANTS)) {
    const slug = p.uid.split('/').at(-1);
    const json = JSON.parse(readFileSync(new URL(`../presets/mechanics/${slug}.json`, import.meta.url)));
    assert.deepEqual(json, { schemaVersion: 1, ...p });
  }
});

test('sculpted ridge winding faces outward and is bounded by its collider', () => {
  const { s } = arena(),
    v = new MechanicPresentation(new Scene(), s),
    g = v.geo.ridge;
  const p = g.attributes.position,
    n = g.attributes.normal;
  for (let i = 0; i < p.count - 1; i++) {
    assert.ok(Math.hypot(p.getX(i), p.getZ(i)) <= P.worldshape.ridgeRadius + 1e-6);
    if (Math.abs(p.getY(i)) < 1) assert.ok(p.getX(i) * n.getX(i) + p.getZ(i) * n.getZ(i) > 0);
  }
  v.dispose();
});

test('fast targets crossing a link between ticks collide once, not once per intersecting edge', () => {
  const { m, s } = arena();
  cast(s, 'weave', [4, 0, 0]);
  ticks(m, 24);
  cast(s, 'weave', [12, 0, 0]);
  m.setPosition('enemy', 8, 0, -3);
  m.advance();
  m.setPosition('enemy', 8, 0, 3);
  m.advance();
  assert.equal(m.entities.get('enemy').health, 9);
  m.setPosition('enemy', 8, 0, 0);
  ticks(m, 4);
  assert.equal(m.entities.get('enemy').health, 9);
});

test('interrupting queued convergence removes its uncommitted visual cue', () => {
  const {m,s}=arena();
  m.submit({type:'terrain-impact',ownerId:'enemy',teamId:'enemy',abilityUid:'test/water',element:'water',position:[8,0,0],shape:{kind:'disc',x:8,z:0,r:2},durationTicks:100});
  m.advance();
  const c={id:'cancelled-convergence',family:'convergence',uid:P.convergence.uid,ownerId:'caster',position:[8,0,0],direction:[1,0,0]};
  assert.equal(s.convergence.activate(c),null);
  assert.ok(m.cues.some(cue=>cue.id===c.id&&cue.phase==='convergence'));
  s.cancel('caster');
  assert.equal(m.cues.some(cue=>cue.id===c.id&&cue.phase==='convergence'),false);
  m.advance();
  assert.equal(m.entities.get('enemy').health,10);
});

test('same-tick interruption suppresses only an uncommitted convergence cue', () => {
  const {m,s}=arena();
  m.submit({type:'terrain-impact',ownerId:'enemy',teamId:'enemy',abilityUid:'test/water',element:'water',position:[8,0,0],shape:{kind:'disc',x:8,z:0,r:2},durationTicks:100});
  m.advance();
  m.submit({type:'interrupt',ownerId:'enemy',teamId:'enemy',abilityUid:'test/interrupt',element:'force',targetIds:['caster']});
  const c={id:'due-convergence',family:'convergence',uid:P.convergence.uid,ownerId:'caster',position:[8,0,0],direction:[1,0,0]};
  assert.equal(s.convergence.activate(c),null);
  m.advance();
  assert.equal(m.cues.some(cue=>cue.id===c.id&&cue.phase==='convergence'),false);
  assert.equal(m.entities.get('enemy').health,10);
});

test('cancelling after convergence commits retains its impact cue', () => {
  const {m,s}=arena();
  m.submit({type:'terrain-impact',ownerId:'enemy',teamId:'enemy',abilityUid:'test/water',element:'water',position:[8,0,0],shape:{kind:'disc',x:8,z:0,r:2},durationTicks:100});
  m.advance();
  const c={id:'committed-convergence',family:'convergence',uid:P.convergence.uid,ownerId:'caster',position:[8,0,0],direction:[1,0,0]};
  assert.equal(s.convergence.activate(c),null);
  m.advance();
  s.cancel('caster');
  assert.equal(m.cues.some(cue=>cue.id===c.id&&cue.phase==='convergence'),true);
});
