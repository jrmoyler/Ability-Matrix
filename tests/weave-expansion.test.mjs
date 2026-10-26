import test from 'node:test';
import assert from 'node:assert/strict';
import { Scene } from 'three';
import { CombatStateManager } from '../packs/sandbox/src/combat/ucsm/CombatStateManager.js';
import { MechanicSystems } from '../packs/sandbox/src/combat/ucsm/mechanics/MechanicSystems.js';
import { MechanicPresentation } from '../packs/sandbox/src/combat/ucsm/mechanics/MechanicPresentation.js';
import { WEAVE_VARIANTS, weaveHint } from '../packs/sandbox/src/combat/ucsm/mechanics/WeaveVariants.js';
import { IMPLEMENTED_MECHANICS } from '../packs/sandbox/src/combat/ucsm/registry.js';
const get = (behavior) => WEAVE_VARIANTS.find((p) => p.behavior === behavior);
const setup = (behavior) => {
 const m = new CombatStateManager(); m.upsertEntity({id:'caster',teamId:'player',position:[0,0,0],health:10});
 m.upsertEntity({id:'enemy',teamId:'enemy',position:[5,0,0],health:10});
 m.upsertEntity({id:'other',teamId:'enemy',position:[5,0,2],health:10});
 m.upsertEntity({id:'ally',teamId:'player',position:[5,0,0],health:10});
 const s = new MechanicSystems(m), p = get(behavior);
 const place = (id, position) => assert.equal(s.weave.activate({id,uid:p.uid,family:'weave',ownerId:'caster',position,direction:[0,0,1]}),null);
 return {m,s,p,place};
};
test('all five weave moves are selectable and unique', () => {
 assert.equal(WEAVE_VARIANTS.length,5);
 for (const p of WEAVE_VARIANTS) assert.ok(IMPLEMENTED_MECHANICS.some(x => x.uid === p.uid && x.selectable));
});
test('weave hints describe each variant and the player-only draft effect', () => {
 assert.match(weaveHint(get('chain').uid), /chains/);
 assert.match(weaveHint(get('flood').uid), /triangle/);
 assert.match(weaveHint(get('draft').uid), /your speed/);
 assert.doesNotMatch(weaveHint(get('draft').uid), /allies|teammates/);
 assert.match(weaveHint('mechanics/weave/cryostasis-mesh'), /chill/);
 assert.match(weaveHint(), /fire/);
});
test('every weave accepts a real command, resolves anticipation, and cancels its anchors', () => {
 for (const p of WEAVE_VARIANTS) {
  const {m,s} = setup(p.behavior);
  assert.equal(s.command({family:'weave',uid:p.uid,position:[3,0,0]}).ok,true,p.name);
  for (let i=0;i<s.t(p.anticipation)+2;i++) m.advance();
  assert.equal([...m.anchors.values()][0]?.uid,p.uid,p.name);
  assert.ok(m.recentEvents.some((e) => e.type === 'cast-start' && e.abilityUid === p.uid));
  s.cancel('caster'); assert.equal(m.anchors.size,0,p.name);
 }
});
test('thunder chains only to nearby hostiles and quake damages nearby hostiles', () => {
 for (const behavior of ['chain','quake']) {
  const {m,place,p} = setup(behavior); place('a',[1,0,0]); place('b',[9,0,0]); m.advance();
  assert.ok(m.entities.get('enemy').health < 10, behavior);
  assert.ok(m.entities.get('other').health < 10, behavior);
  assert.equal(m.entities.get('ally').health,10);
  assert.ok(m.recentEvents.some(e => e.abilityUid === p.uid && e.id !== 'irrelevant'));
 }
});
test('thunder chained targets observe the same cooldown across subsequent link strikes', () => {
 const {m,s,p,place} = setup('chain');
 place('a',[1,0,0]); place('b',[9,0,0]); m.advance();
 const afterFirst = m.entities.get('other').health;
 assert.ok(afterFirst < 10);
 m.upsertEntity({id:'fresh',teamId:'enemy',position:[7,0,0],health:10});
 m.advance();
 assert.ok(m.entities.get('fresh').health < 10, 'new target can trigger the grid');
 assert.equal(m.entities.get('other').health, afterFirst, 'chained target is protected until its cooldown expires');
 m.setPosition('enemy',0,0,12); m.setPosition('fresh',0,0,13);
 for (let i=0; i<s.t(p.pulse); i++) m.advance();
 m.upsertEntity({id:'later',teamId:'enemy',position:[6,0,0],health:10});
 m.advance();
 assert.ok(m.entities.get('other').health < afterFirst, 'target can be chained again after cooldown');
});
test('hydrostatic triangle floods its interior but not allies or outside targets', () => {
 const {m,place} = setup('flood'); m.setPosition('enemy',5,0,2); m.setPosition('other',5,0,9); m.setPosition('ally',5,0,2);
 place('a',[1,0,0]); place('b',[9,0,0]); place('c',[5,0,8]); m.advance();
 assert.ok(m.entities.get('enemy').health < 10); assert.equal(m.entities.get('other').health,10); assert.equal(m.entities.get('ally').health,10);
});
test('prismatic anchor shatters only when destroyed by an opponent', () => {
 const {m,place} = setup('shatter'); place('a',[4,0,0]);
 m.submit({type:'terrain-impact',ownerId:'enemy',teamId:'enemy',abilityUid:'hostile',element:'earth',position:[4,0,0],shape:{kind:'disc',x:4,z:0,r:1},intensity:2});
 m.advance(); m.advance(); assert.equal(m.anchors.size,0); assert.ok(m.entities.get('enemy').health < 10); assert.equal(m.entities.get('ally').health,10);
});
test('jetstream accelerates allies inside links and restores speed when leaving', () => {
 const {m,s,place} = setup('draft'); place('a',[1,0,0]); place('b',[9,0,0]); m.advance();
 assert.equal(s.speed('ally'),1.35); assert.equal(s.speed('enemy'),1); m.setPosition('ally',5,0,3); assert.equal(s.speed('ally'),1);
});
test('cancelling a weave immediately removes its links and cooldowns without affecting other owners', () => {
 const {m,s,p,place} = setup('draft');
 m.setPosition('caster',5,0,0);
 m.upsertEntity({id:'caster:two',teamId:'player',position:[5,0,10],health:10});
 m.upsertEntity({id:'far-enemy',teamId:'enemy',position:[5,0,10],health:10});
 place('a',[1,0,0]); place('b',[9,0,0]);
 for (const [id,position] of [['c',[1,0,10]],['d',[9,0,10]]])
  assert.equal(s.weave.activate({id,uid:p.uid,family:'weave',ownerId:'caster:two',position,direction:[0,0,1]}),null);
 m.advance();
 assert.equal(s.speed('caster'),1.35);
 const presentation = new MechanicPresentation(new Scene(),s);
 const ownLink = s.weave.links.find((l) => l.ownerId === 'caster').id;
 const otherLink = s.weave.links.find((l) => l.ownerId === 'caster:two').id;
 presentation.update();
 assert.ok(presentation.items.has(ownLink));
 const enemyBefore = m.entities.get('enemy').health;
 const farBefore = m.entities.get('far-enemy').health;
 s.cancel('caster');
 assert.equal(s.speed('caster'),1, 'speed is restored without waiting for another tick');
 assert.equal(s.weave.links.filter((l) => l.ownerId === 'caster').length,0);
 assert.equal(s.weave.links.filter((l) => l.ownerId === 'caster:two').length,1);
 presentation.update();
 assert.equal(presentation.items.has(ownLink),false, 'visual link clears on the next presentation update');
 assert.equal(presentation.items.has(otherLink),true);
 place('new-a',[1,0,0]); place('new-b',[9,0,0]);
 m.advance();
 assert.ok(m.entities.get('enemy').health < enemyBefore, 'cancelled owner can hit again after rebuilding');
 assert.equal(m.entities.get('far-enemy').health,farBefore, 'other owner retains their hit cooldown');
 presentation.dispose();
});
test('destroying an anchor immediately invalidates linked draft and queued link hits', () => {
 const {m,s,p,place} = setup('draft');
 m.setPosition('caster',5,0,0);
 place('a',[1,0,0]); place('b',[9,0,0]); m.advance();
 const presentation = new MechanicPresentation(new Scene(),s);
 const linkId = s.weave.links[0].id;
 presentation.update();
 assert.equal(s.speed('caster'),1.35);
 m.upsertEntity({id:'fresh',teamId:'enemy',position:[7,0,0],health:10});
 m.submit({type:'terrain-impact',ownerId:'enemy',teamId:'enemy',abilityUid:'hostile',element:'earth',position:[1,0,0],shape:{kind:'disc',x:1,z:0,r:0.5},intensity:2});
 m.advance();
 assert.equal(m.anchors.size,1);
 assert.equal(s.weave.links.length,0, 'broken link disappears within the same tick');
 assert.equal(s.speed('caster'),1, 'draft ends without another tick');
 assert.equal(m.entities.get('fresh').health,10, 'link hit queued after the hostile attack is cancelled');
 presentation.update();
 assert.equal(presentation.items.has(linkId),false);
 presentation.dispose();
});
test('destroying one flood anchor cancels the current triangle pulse but preserves the surviving edge', () => {
 const {m,s,place} = setup('flood');
 m.setPosition('enemy',0,0,15); m.setPosition('other',0,0,16);
 place('a',[1,0,0]); place('b',[9,0,0]); place('c',[5,0,8]); m.advance();
 assert.equal(s.weave.links.length,3);
 m.upsertEntity({id:'fresh',teamId:'enemy',position:[5,0,3],health:10});
 m.submit({type:'terrain-impact',ownerId:'enemy',teamId:'enemy',abilityUid:'hostile',element:'earth',position:[1,0,0],shape:{kind:'disc',x:1,z:0,r:0.5},intensity:2});
 m.advance();
 assert.equal(s.weave.links.length,1);
 assert.equal(m.entities.get('fresh').health,10,'the broken triangle cannot flood later in the same tick');
});
test('a cancelled link hit does not reserve the target cooldown for a surviving edge', () => {
 const {m,s,place} = setup('chain');
 m.setPosition('enemy',0,0,15); m.setPosition('other',0,0,16);
 place('a',[1,0,0]); place('b',[9,0,0]); place('c',[5,0,6]); m.advance();
 m.upsertEntity({id:'fresh',teamId:'enemy',position:[8.8,0,0.1],health:10});
 m.submit({type:'terrain-impact',ownerId:'enemy',teamId:'enemy',abilityUid:'hostile',element:'earth',position:[1,0,0],shape:{kind:'disc',x:1,z:0,r:0.5},intensity:2});
 m.advance();
 assert.equal(m.entities.get('fresh').health,10);
 assert.equal(s.weave.links.length,1);
 m.advance();
 assert.ok(m.entities.get('fresh').health < 10, 'surviving edge can hit on the next tick');
});
test('five distinct anchor arrangements use finite real geometry and release resources', () => {
 const {s} = setup('chain'); const v = new MechanicPresentation(new Scene(),s); const signatures=[];
 for (const p of WEAVE_VARIANTS) { const g=v.build('anchor',{uid:p.uid}); const records=[]; g.traverse(n => {if(n.isMesh) records.push([n.geometry.type,n.position.toArray(),n.scale.toArray()]);}); assert.ok(records.length >= 9,p.name); signatures.push(JSON.stringify(records)); }
 assert.equal(new Set(signatures).size,5); v.dispose();
});
