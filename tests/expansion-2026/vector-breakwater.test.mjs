import test from 'node:test';
import assert from 'node:assert/strict';
import { Matrix4, Vector3 } from 'three';
import { settings } from '../../packs/sandbox/src/config/settings.js';
import config from '../../packs/sandbox/src/abilities/expansion-2026/vector-breakwater/config.js';
import {
  Ability,
  ID,
} from '../../packs/sandbox/src/abilities/expansion-2026/vector-breakwater/index.js';
settings[ID] = structuredClone(config.settings);
function setup() {
  const hits = [],
    enemies = [
      {
        position: new Vector3(5, 0, 0),
        kill: () => {
          hits.push('front');
          return true;
        },
      },
      {
        position: new Vector3(14, 0, 0),
        kill: () => {
          hits.push('far');
          return true;
        },
      },
      {
        position: new Vector3(5, 0, 5),
        kill: () => {
          hits.push('outside');
          return true;
        },
      },
    ];
  const a = new Ability({
    lights: { acquire: () => ({}), release: () => {}, set: () => {} },
    dummies: {
      findTargets: (x, z, r, out) => {
        out.length = 0;
        out.push(...enemies);
        return out;
      },
    },
  });
  a.spawn(new Vector3(), new Vector3(1, 0, 0), 18);
  return { a, hits };
}
test('three independent fronts travel, hit only swept line and never double count per wave', () => {
  const { a, hits } = setup();
  for (let i = 0; i < 16; i++) a.update(1 / 60);
  assert.deepEqual(hits, []);
  for (let i = 0; i < 180; i++) a.update(1 / 60);
  assert.equal(hits.filter((x) => x === 'front').length, 3);
  assert.equal(hits.filter((x) => x === 'far').length, 3);
  assert.ok(!hits.includes('outside'));
  a.destroy();
  a.dispose();
});
test('custom shield buffer is finite, bounded and pooled resources dispose once', () => {
  const { a } = setup();
  assert.equal(a.fronts.length, 3);
  const p = a.fronts[0].geometry.attributes.position;
  assert.ok(p.count > 500);
  for (let i = 0; i < p.count; i++)
    assert.ok(Number.isFinite(p.getX(i)) && Math.abs(p.getX(i)) <= 0.5);
  let n = 0;
  for (const x of a.resources) x.addEventListener('dispose', () => n++);
  a.destroy();
  a.dispose();
  a.dispose();
  assert.equal(n, a.resources.length);
});
test('shield ribs travel with the front and each impact opens a bounded expanding wake', () => {
  const { a } = setup();
  assert.equal(a.fins.count, 18);
  const matrix = new Matrix4();
  a.fins.getMatrixAt(6, matrix);
  assert.ok(new Vector3().setFromMatrixScale(matrix).x < .01, 'later front remains hidden before launch');
  assert.equal(a.fronts[0].children.length, 1);
  assert.ok(a.fronts[0].children[0].geometry.attributes.position.count >= 300);
  assert.ok(a.wakeRings.every((ring) => !ring.visible));
  for (let i = 0; i < 76; i++) a.update(1 / 60);
  assert.equal(a.wakeRings[0].visible, true);
  assert.equal(a.wakeRings[1].visible, false);
  const start = a.wakeRings[0].scale.x;
  a.fins.getMatrixAt(0, matrix);
  const finBefore = new Vector3().setFromMatrixPosition(matrix);
  for (let i = 0; i < 6; i++) a.update(1 / 60);
  a.fins.getMatrixAt(0, matrix);
  const finAfter = new Vector3().setFromMatrixPosition(matrix);
  assert.ok(Math.abs(finAfter.x) > Math.abs(finBefore.x));
  assert.ok(a.wakeRings[0].scale.x > start);
  a.destroy();
  a.spawn(new Vector3(), new Vector3(1, 0, 0), 18);
  assert.ok(a.wakeRings.every((ring) => !ring.visible));
  a.destroy(); a.dispose();
});
test('each front shows its contact burst only when a target accepts the hit', () => {
  const {a}=setup();
  assert.ok(a.contacts.every((contact)=>!contact.visible));
  for(let i=0;i<26;i++)a.update(1/60);
  assert.ok(a.contactTimes[0]>=0);
  assert.equal(a.contacts[0].visible,true);
  assert.ok(Math.abs(a.contacts[0].position.z-5)<1e-6);
  a.destroy();a.spawn(new Vector3(),new Vector3(1,0,0),18);
  assert.deepEqual(a.contactTimes,[-1,-1,-1]);
  a.destroy();a.dispose();

  const blocked={position:new Vector3(5,0,0),kill:()=>false};
  const b=new Ability({lights:{acquire:()=>({}),set(){},release(){}},dummies:{findTargets(_x,_z,_r,out){out.length=0;out.push(blocked);return out;}}});
  b.spawn(new Vector3(),new Vector3(1,0,0),18);
  for(let i=0;i<100;i++)b.update(1/60);
  assert.deepEqual(b.contactTimes,[-1,-1,-1]);
  assert.ok(b.contacts.every((contact)=>!contact.visible));
  b.destroy();b.dispose();
});

test('three fronts damage UCSM enemies once each without striking allies or outside the corridor', async () => {
  const { CombatStateManager } = await import('../../packs/sandbox/src/combat/ucsm/CombatStateManager.js');
  const { ExpansionCombatAdapter } = await import('../../packs/sandbox/src/combat/ucsm/ExpansionCombatAdapter.js');
  settings[ID]=structuredClone(config.settings);
  const manager=new CombatStateManager();
  for(const e of [{id:'caster',teamId:'player'},{id:'enemy',teamId:'enemy',position:[5,0,0]},{id:'ally',teamId:'player',position:[5,0,0]},{id:'outside',teamId:'enemy',position:[5,0,6]}]) manager.upsertEntity({...e,health:10});
  const bridge=new ExpansionCombatAdapter(manager),events=[];
  const sub=bridge.bind('matrix-expansion/test','caster').on('hit',e=>events.push(e));
  const a=new Ability({lights:{acquire:()=>({}),release(){},set(){}},character:{position:new Vector3()},expansionCombat:bridge});
  a.spawn(new Vector3(),new Vector3(1,0,0),18);
  for(let i=0;i<180;i++){a.update(1/60);manager.advance(1/60);}
  assert.equal(manager.entities.get('enemy').health,7);
  assert.equal(manager.entities.get('ally').health,10);
  assert.equal(manager.entities.get('outside').health,10);
  assert.equal(events.filter(e=>e.abilityUid==='matrix-expansion/vector-breakwater').length,3);
  sub.unsubscribe();a.destroy();a.dispose();bridge.dispose();
});

test('breakwater contact waits for its committed hit and ignores cancellation', async () => {
  const {CombatStateManager}=await import('../../packs/sandbox/src/combat/ucsm/CombatStateManager.js');
  const {ExpansionCombatAdapter}=await import('../../packs/sandbox/src/combat/ucsm/ExpansionCombatAdapter.js');
  settings[ID]=structuredClone(config.settings);
  for(const cancel of [false,true]){
    const manager=new CombatStateManager();manager.upsertEntity({id:'caster',teamId:'player'});manager.upsertEntity({id:'target',teamId:'enemy',position:[5,0,0],health:5});
    const bridge=new ExpansionCombatAdapter(manager);
    const a=new Ability({lights:{acquire:()=>({}),set(){},release(){}},character:{position:new Vector3()},expansionCombat:bridge});
    a.spawn(new Vector3(),new Vector3(1,0,0),18);
    while(!manager.queue.length)a.update(1/60);
    assert.equal(a.contactTimes[0],-1,'enqueue must not show impact');
    if(cancel)manager.cancelEvents(()=>true);
    manager.advance(1/30);
    assert.equal(a.contactTimes[0]>=0,!cancel);
    a.destroy();a.dispose();bridge.dispose();
  }
});
