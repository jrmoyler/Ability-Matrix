// The unified combat state (packs/sandbox/src/combat/ucsm): the element
// ontology, every pair's resolution, the manager's tick contract, and the
// proposed-content registry. Spec: Ability Matrix Unified Combat Spec §5–8.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const load = (p) => import(pathToFileURL(path.join(root, 'packs/sandbox/src/combat/ucsm', p)).href);
const { ELEMENT_IDS, CAPABILITIES, STATUS_OF } = await load('ontology.js');
const { resolvePair, pairTable, foldElements, AUTHORED, INCOMPATIBLE, TIER } = await load('reactions.js');
const { CombatStateManager } = await load('CombatStateManager.js');
const { PROPOSED, PROPOSED_STANDARD, PROPOSED_MECHANICS, MECHANIC_REGISTRY, EXPANSION_REGISTRY, IMPLEMENTED_MECHANICS } = await load('registry.js');
const { ELEMENT_GROUPS, ELEMENT_OF } = await import(pathToFileURL(path.join(root, 'packs/sandbox/src/config/elements.js')).href);
const catalog = JSON.parse(readFileSync(path.join(root, 'presets/catalog.json'), 'utf8'));

test('the ontology covers exactly the sandbox elements, each with tags and a status', () => {
  assert.equal(ELEMENT_IDS.length, 23);
  assert.deepEqual([...ELEMENT_IDS].sort(), ELEMENT_GROUPS.map((g) => g.id).sort());
  for (const id of ELEMENT_IDS) {
    assert.ok(CAPABILITIES[id].length >= 2, id);
    assert.ok(STATUS_OF[id], id);
  }
  assert.equal(new Set(Object.values(STATUS_OF)).size, 23, 'statuses are distinct');
});

test('every catalog castable maps to one of the 23 elements, so every cast can report', () => {
  const castable = catalog.abilities.filter((a) => a.status === 'live' && a.kind !== 'move');
  assert.ok(castable.length >= 230, `${castable.length} castables`);
  for (const a of castable) assert.ok(ELEMENT_IDS.includes(ELEMENT_OF[a.uid]), `${a.uid} has an element`);
});

test('all 276 unordered pairs resolve to exactly one tier, with a name', () => {
  const table = pairTable();
  assert.equal(table.length, 276);
  assert.equal(new Set(table.map((r) => r.key)).size, 276);
  const tiers = { 1: 0, 2: 0, 3: 0, 4: 0 };
  for (const r of table) {
    assert.ok([1, 2, 3, 4].includes(r.tier), r.key);
    assert.ok(r.name, r.key);
    tiers[r.tier]++;
    if (r.tier <= TIER.RULE) assert.ok(r.effect, `${r.key} has an effect`);
    else assert.equal(r.effect, null, `${r.key} invents nothing`);
  }
  assert.equal(tiers[1], 15);
  assert.equal(tiers[4], Object.keys(INCOMPATIBLE).length);
  // Self pairs stack, they never fuse.
  for (const id of ELEMENT_IDS) assert.equal(resolvePair(id, id).tier, TIER.GENERIC);
});

test('the fifteen authored pairs are the spec\'s', () => {
  const names = Object.values(AUTHORED).map((r) => r.name).sort();
  assert.deepEqual(names, [
    'Autonomous Bastion', 'Celestial Orbit', 'Glacial Bloom', 'Living Bastion', 'Miasma Corridor',
    'Null Sigil', 'Paradox Velocity', 'Phantom Theatre', 'Prism Cathedral', 'Resonance Fracture',
    'Sacrificial Sanctuary', 'Storm Conduction', 'Thermal Shock', 'Vapor Dominion', 'Wildfire'
  ]);
  for (const key of Object.keys(AUTHORED)) {
    const [a, b] = key.split('|');
    assert.ok(a < b && ELEMENT_IDS.includes(a) && ELEMENT_IDS.includes(b), key);
    assert.ok([a, b].includes(AUTHORED[key].driver), `${key} driver is one of its pair`);
  }
});

test('resolution is deterministic and order-sensitive through the driver, not the name', () => {
  for (const a of ELEMENT_IDS) {
    for (const b of ELEMENT_IDS) {
      const ab = resolvePair(a, b);
      assert.deepEqual(ab, resolvePair(a, b));
      const ba = resolvePair(b, a);
      assert.equal(ab.name, ba.name, `${a}/${b} same name both ways`);
      assert.equal(ab.tier, ba.tier);
    }
  }
  assert.ok(resolvePair('water', 'storm').intensity > resolvePair('storm', 'water').intensity, 'lightning into water conducts harder');
  assert.throws(() => resolvePair('fire', 'plasma'));
});

test('multi-element folds are finite and only keep real reactions', () => {
  const storm = foldElements(['water', 'wind', 'storm', 'gravity']);
  assert.ok(storm.some((r) => r.name === 'Storm Conduction'));
  assert.ok(storm.every((r) => r.tier <= TIER.RULE));
  assert.ok(foldElements(ELEMENT_IDS).length <= 6);
});

/* ---- the manager ---- */

/** Advance tick by tick (step() caps catch-up per call, as a frame loop should). */
function run(m, seconds) {
  for (let i = 0; i < Math.round(seconds * m.budget.tickRate); i++) m.advance();
}

function arena(budget) {
  const m = new CombatStateManager(budget);
  m.upsertEntity({ id: 'caster', teamId: 'player', position: [0, 0, 0] });
  for (let i = 0; i < 4; i++) m.upsertEntity({ id: `d${i}`, teamId: 'targets', position: [5 + i * 0.8, 0, 0] });
  return m;
}
const base = { ownerId: 'caster', teamId: 'player' };
const water = (extra = {}) => ({ ...base, type: 'terrain-impact', element: 'water', abilityUid: 'codex/maelstrom', shape: { kind: 'disc', x: 6, z: 0, r: 3 }, ...extra });
const bolt = (extra = {}) => ({ ...base, type: 'terrain-impact', element: 'storm', abilityUid: 'linear/thunder', shape: { kind: 'capsule', ax: 0, az: 0, bx: 10, bz: 0, r: 1 }, ...extra });

test('a reaction commits once and issues each kill once, to hostile bodies only', () => {
  const m = arena();
  m.submit(water());
  run(m, 0.05);
  m.submit(bolt());
  run(m, 0.2);
  const { effects, cues } = m.drain();
  assert.equal(cues.filter((c) => c.kind === 'reaction').length, 1);
  assert.equal(effects.length, 4);
  assert.equal(new Set(effects.map((e) => e.effectId)).size, 4);
  assert.ok(effects.every((e) => e.targetId.startsWith('d')), 'the caster is never a target');
  run(m, 1);
  assert.equal(m.drain().effects.length, 0, 'nothing is issued twice');
});

test('a replayed eventId and malformed events are refused', () => {
  const m = arena();
  m.submit(water({ eventId: 'same' }));
  m.submit(water({ eventId: 'same' }));
  m.submit({ ...base, type: 'hit', element: 'fire', abilityUid: 'x/y', targetIds: ['nobody'] });
  m.submit({ ...base, type: 'boom', element: 'fire', abilityUid: 'x/y' });
  m.submit({ type: 'hit', element: 'fire', abilityUid: 'x/y', targetIds: ['d0'] });
  m.submit({ ...base, type: 'hit', element: 'plasma', abilityUid: 'x/y', targetIds: ['d0'] });
  run(m, 0.05);
  assert.equal(m.stats.events, 1);
  assert.deepEqual(m.rejected.map((r) => r.reason).sort(), ['hit with no known target', 'no owner', 'replayed eventId', 'unknown element plasma', 'unknown type boom']);
});

test('one cast reacts once per reaction name, however many events it sends', () => {
  const m = arena();
  m.submit(water());
  m.submit({ ...base, type: 'hit', element: 'water', abilityUid: 'codex/maelstrom', targetIds: ['d0'] });
  run(m, 0.05);
  m.submit({ ...base, type: 'hit', element: 'storm', abilityUid: 'linear/thunder', castId: 'c1', targetIds: ['d0'] });
  run(m, 0.05);
  m.submit(bolt({ castId: 'c1' }));
  run(m, 0.2);
  assert.equal(m.log.filter((r) => r.kind === 'Storm Conduction').length, 1);
});

test('chains stop at the depth cap, and per-tick budgets hold', () => {
  // Fire on nature leaves wildfire (a fire region) which can react again.
  const deep = arena({ maxDepth: 3 });
  deep.submit({ ...base, type: 'terrain-impact', element: 'nature', abilityUid: 'a/n', shape: { kind: 'disc', x: 6, z: 0, r: 4 } });
  deep.submit({ ...base, type: 'terrain-impact', element: 'water', abilityUid: 'a/w', shape: { kind: 'disc', x: 6, z: 0, r: 4 } });
  run(deep, 0.05);
  deep.submit({ ...base, type: 'terrain-impact', element: 'fire', abilityUid: 'a/f', shape: { kind: 'disc', x: 6, z: 0, r: 4 } });
  run(deep, 2);
  assert.ok(deep.log.length >= 2, 'a chain formed');
  assert.ok(deep.log.every((r) => r.depth <= 3));

  const none = arena({ maxDepth: 0 });
  none.submit(water());
  run(none, 0.05);
  none.submit(bolt());
  run(none, 0.2);
  assert.equal(none.log.length, 0, 'depth 0 allows no reactions');

  const tight = arena({ reactionsPerTick: 1 });
  for (const element of ['water', 'nature', 'poison', 'frost']) tight.submit({ ...base, type: 'terrain-impact', element, abilityUid: `a/${element}`, shape: { kind: 'disc', x: 6, z: 0, r: 4 } });
  run(tight, 0.05);
  tight.submit({ ...base, type: 'terrain-impact', element: 'fire', abilityUid: 'a/f', shape: { kind: 'disc', x: 6, z: 0, r: 4 } });
  const before = tight.log.length;
  tight.advance();
  assert.ok(tight.log.length - before <= 1, 'one reaction in that tick');
});

test('statuses and regions expire, and a body that stands again stands clean', () => {
  const m = arena({ exposure: 1, regionLife: 1 });
  m.submit({ ...base, type: 'hit', element: 'fire', abilityUid: 'a/f', targetIds: ['d0'] });
  m.submit(water());
  run(m, 0.1);
  assert.equal(m.entities.get('d0').statuses[0].tag, 'burning');
  assert.equal(m.regions.size, 1);
  run(m, 1.2);
  assert.equal(m.entities.get('d0').statuses.length, 0);
  assert.equal(m.regions.size, 0);
  m.submit({ ...base, type: 'hit', element: 'fire', abilityUid: 'a/f', targetIds: ['d1'] });
  run(m, 0.1);
  m.setAlive('d1', false);
  m.setAlive('d1', true);
  assert.equal(m.entities.get('d1').statuses.length, 0);
});

test('repeats on the same spot diminish, and intensity never passes the cap', () => {
  const m = arena({ diminish: 1, maxIntensity: 3 });
  const levels = [];
  for (let i = 0; i < 3; i++) {
    m.submit({ ...base, type: 'terrain-impact', element: 'water', abilityUid: `w/${i}`, castId: `w${i}`, shape: { kind: 'disc', x: 6, z: 0, r: 2 } });
    run(m, 0.05);
    m.submit({ ...base, type: 'terrain-impact', element: 'storm', abilityUid: `s/${i}`, castId: `s${i}`, intensity: 5, shape: { kind: 'disc', x: 6, z: 0, r: 2 } });
    run(m, 0.05);
    levels.push(m.log.at(-1).intensity);
  }
  assert.ok(levels.every((v) => v <= 3));
  assert.ok(levels[2] < levels[0], `diminishing: ${levels}`);
});

test('friendly effects land on the caster\'s side only', () => {
  const m = arena();
  m.submit({ ...base, type: 'terrain-impact', element: 'blood', abilityUid: 'a/b', shape: { kind: 'disc', x: 0, z: 0, r: 3 } });
  run(m, 0.05);
  m.submit({ ...base, type: 'terrain-impact', element: 'holy', abilityUid: 'a/h', shape: { kind: 'disc', x: 0, z: 0, r: 3 } });
  run(m, 0.1);
  assert.ok(m.entities.get('caster').statuses.some((s) => s.tag === 'warded'));
  assert.ok(!m.entities.get('d0').statuses.some((s) => s.tag === 'warded'));
});

test('incompatible pairs are refused but both effects stand', () => {
  const m = arena();
  m.submit({ ...base, type: 'terrain-impact', element: 'earth', abilityUid: 'a/e', shape: { kind: 'disc', x: 6, z: 0, r: 3 } });
  run(m, 0.05);
  m.submit(bolt());
  run(m, 0.1);
  assert.equal(m.log.length, 0);
  assert.equal(m.stats.refused, 1);
  assert.equal(m.regions.size, 2, 'both footprints remain');
});

test('the same events give the same reactions (determinism), and history is kept', () => {
  const replay = () => {
    const m = arena();
    m.submit(water());
    m.submit({ ...base, type: 'hit', element: 'fire', abilityUid: 'a/f', targetIds: ['d2'] });
    run(m, 0.05);
    m.submit(bolt());
    m.submit({ ...base, type: 'hit', element: 'frost', abilityUid: 'a/i', targetIds: ['d2'] });
    run(m, 0.5);
    return JSON.stringify(m.log);
  };
  assert.equal(replay(), replay());
  const m = arena({ historyTicks: 10 });
  run(m, 1);
  m.setPosition('d0', 9, 0, 9);
  run(m, 0.1);
  assert.deepEqual(m.positionAt('d0', 0), [9, 0, 9]);
  assert.deepEqual(m.positionAt('d0', 5), [5, 0, 0]);
  assert.ok(m.history.get('d0').length <= 10);
});

/* ---- proposed content ---- */

test('the expansion registry: only five completed mechanics promoted; 156 proposals stay unplayable', () => {
  assert.equal(PROPOSED_STANDARD.length, 46);
  assert.equal(PROPOSED_MECHANICS.length, 110);
  assert.equal(PROPOSED.length, 156);
  assert.equal(IMPLEMENTED_MECHANICS.length, 5);
  assert.equal(new Set(IMPLEMENTED_MECHANICS.map(p => p.mechanic)).size, 5);
  const uids = new Set(EXPANSION_REGISTRY.map((p) => p.uid));
  assert.equal(uids.size, 161);
  const existing = new Set(catalog.abilities.map((a) => a.uid));
  for (const p of EXPANSION_REGISTRY) {
    assert.ok(!existing.has(p.uid), `${p.uid} does not collide`);
    assert.equal(p.status, p.selectable ? 'live' : 'proposed');
    if (!IMPLEMENTED_MECHANICS.includes(p)) assert.equal(p.selectable, false);
    assert.ok(ELEMENT_IDS.includes(p.element), p.uid);
    assert.match(p.uid, p.mechanic === 'standard' ? /^matrix-expansion\/[a-z0-9-]+$/ : new RegExp(`^mechanics/${p.mechanic}/[a-z0-9-]+$`));
  }
  for (const element of ELEMENT_IDS) {
    assert.equal(PROPOSED_STANDARD.filter((p) => p.element === element).length, 2, element);
    assert.equal(MECHANIC_REGISTRY.filter((p) => p.element === element).length, 5, element);
  }
});

test('what a reaction makes does not set the same reaction off again', () => {
  const m = arena();
  for (let i = 0; i < 4; i++) m.submit({ ...base, type: 'terrain-impact', element: 'water', abilityUid: `w/${i}`, castId: `w${i}`, shape: { kind: 'disc', x: 6 + i, z: 0, r: 3 } });
  run(m, 0.05);
  m.submit({ ...base, type: 'terrain-impact', element: 'frost', abilityUid: 'f/1', castId: 'f1', shape: { kind: 'disc', x: 6, z: 0, r: 3 } });
  run(m, 2);
  assert.equal(m.log.filter((r) => r.kind === 'Glacial Bloom').length, 1);
});
