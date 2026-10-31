import test from 'node:test';
import assert from 'node:assert/strict';
import { Matrix4, Vector3 } from 'three';
import { settings } from '../../packs/sandbox/src/config/settings.js';
import config from '../../packs/sandbox/src/abilities/expansion-2026/mirage-procession/config.js';
import {
  Ability,
  ID,
} from '../../packs/sandbox/src/abilities/expansion-2026/mirage-procession/index.js';
settings[ID] = structuredClone(config.settings);
function setup(lane) {
  settings[ID].trueLane = lane;
  const hits = [],
    targets = [-1, 0, 1].map((i) => ({
      position: new Vector3(5, 0, i * 1.8),
      kill: () => {
        hits.push(i);
        return true;
      },
    }));
  const a = new Ability({
    lights: { acquire: () => ({}), release: () => {}, set: () => {} },
    dummies: {
      findTargets: (x, z, r, out) => {
        out.length = 0;
        out.push(...targets);
        return out;
      },
    },
  });
  a.spawn(new Vector3(), new Vector3(1, 0, 0), 10);
  return { a, hits };
}
test('all three decoys travel but only chosen true lane hits, once', () => {
  for (const lane of [-1, 0, 1]) {
    const { a, hits } = setup(lane);
    for (let i = 0; i < 100; i++) a.update(1 / 60);
    assert.deepEqual(hits, [lane]);
    assert.equal(a.masks.length, 3);
    assert.ok(a.masks.every((mask) => mask.children[0].geometry === a.masks[0].children[0].geometry));
    assert.ok(a.masks.every((mask) => mask.children[0].material === a.masks[0].children[0].material));
    a.destroy();
    a.dispose();
  }
});
test('mask mesh has finite vertices and the pooled resources dispose once', () => {
  const { a } = setup(0),
    p = a.masks[0].geometry.attributes.position;
  assert.ok(p.count > 40);
  for (let i = 0; i < p.count; i++)
    assert.ok(Number.isFinite(p.getX(i)) && Number.isFinite(p.getY(i)));
  let n = 0;
  for (const r of a.resources) r.addEventListener('dispose', () => n++);
  a.destroy();
  a.dispose();
  a.dispose();
  assert.equal(n, a.resources.length);
});
test('every lane emits the same trail even before any target is hit', () => {
  const { a, hits } = setup(1);
  const emissions = [];
  a.fx = { emit(count, args) { emissions.push({count, position: args.position.clone()}); } };
  for (let i = 0; i < 8; i++) a.update(1 / 60);
  assert.deepEqual(hits, []);
  assert.equal(emissions.length, 3);
  assert.ok(emissions.every((e) => e.count === emissions[0].count));
  const positions = emissions.map((e) => e.position.z).sort((x, y) => x - y);
  assert.deepEqual(positions, [-config.settings.laneGap, 0, config.settings.laneGap]);
  for (let i = 0; i < 90; i++) a.update(1 / 60);
  const terminal = emissions.filter((e) => e.count === 12);
  assert.equal(terminal.length, 3);
  assert.deepEqual(terminal.map((e) => e.position.z).sort((x, y) => x - y), positions);
  a.destroy(); a.dispose();
});
test('identical pooled mirror shards expand as masks dissolve at the end', () => {
  const { a } = setup(0);
  assert.equal(a.shards.count, 24);
  const matrix = new Matrix4();
  a.shards.getMatrixAt(0, matrix);
  const left = new Vector3().setFromMatrixPosition(matrix);
  a.shards.getMatrixAt(8, matrix);
  const center = new Vector3().setFromMatrixPosition(matrix);
  assert.ok(Math.abs(center.x - left.x - config.settings.laneGap) < 1e-5);
  while (a.phase === 'travel') a.update(1 / 60);
  for (let i = 0; i < 25; i++) a.update(1 / 60);
  a.shards.getMatrixAt(8, matrix);
  const after = new Vector3().setFromMatrixPosition(matrix);
  assert.ok(Math.hypot(after.x, (after.y - a.masks[1].position.y) / .8) > .55);
  assert.ok(a.masks[1].scale.x < config.settings.maskSize, "masks shrink as they depart");
  a.destroy(); a.dispose();
});

test('a coarse final frame cannot strike beyond the aimed range', () => {
  settings[ID] = structuredClone(config.settings);
  const hits = [];
  const targets = [
    {position: new Vector3(9, 0, 0), kill(){hits.push('inside'); return true;}},
    {position: new Vector3(12, 0, 0), kill(){hits.push('beyond'); return true;}},
  ];
  const a = new Ability({lights:{acquire:()=>({}),set(){},release(){}},dummies:{findTargets(_x,_z,_r,out){out.length=0;out.push(...targets);return out;}}});
  a.spawn(new Vector3(), new Vector3(1, 0, 0), 10);
  a.update(1);
  assert.deepEqual(hits, ['inside']);
  assert.ok(a.masks.every(mask => mask.position.z === 10), 'the masks stop at the aimed endpoint');
  assert.ok(a.wakes.every(wake => wake.scale.y === 10), 'wakes do not extend beyond the endpoint');
  a.destroy(); a.dispose();
});

test('true lane damages UCSM enemies once without hitting allies or other lanes', async () => {
  const { CombatStateManager } = await import('../../packs/sandbox/src/combat/ucsm/CombatStateManager.js');
  const { ExpansionCombatAdapter } = await import('../../packs/sandbox/src/combat/ucsm/ExpansionCombatAdapter.js');
  settings[ID]=structuredClone(config.settings); settings[ID].trueLane=0;
  const manager=new CombatStateManager();
  for (const e of [{id:'caster',teamId:'player'}, {id:'enemy',teamId:'enemy',position:[5,0,0]}, {id:'ally',teamId:'player',position:[5,0,0]}, {id:'other',teamId:'enemy',position:[5,0,4]}]) manager.upsertEntity({...e,health:5});
  const bridge=new ExpansionCombatAdapter(manager), events=[];
  const sub=bridge.bind('matrix-expansion/test','caster').on('hit',e=>events.push(e));
  const a=new Ability({lights:{acquire:()=>({}),release(){},set(){}},character:{position:new Vector3()},expansionCombat:bridge});
  a.spawn(new Vector3(),new Vector3(1,0,0),10);
  for(let i=0;i<100;i++){a.update(1/60);manager.advance(1/60);}
  assert.equal(manager.entities.get('enemy').health,4);
  assert.equal(manager.entities.get('ally').health,5);
  assert.equal(manager.entities.get('other').health,5);
  assert.equal(events.filter(e=>e.abilityUid==='matrix-expansion/mirage-procession').length,1);
  sub.unsubscribe();a.destroy();a.dispose();bridge.dispose();
});

test('mirage contact burst waits for its own committed hit and ignores cancelled hits', async () => {
  const {CombatStateManager}=await import('../../packs/sandbox/src/combat/ucsm/CombatStateManager.js');
  const {ExpansionCombatAdapter}=await import('../../packs/sandbox/src/combat/ucsm/ExpansionCombatAdapter.js');
  settings[ID]=structuredClone(config.settings);settings[ID].trueLane=0;
  for(const cancel of [false,true]){
    const manager=new CombatStateManager();manager.upsertEntity({id:'caster',teamId:'player'});manager.upsertEntity({id:'target',teamId:'enemy',position:[5,0,0],health:5});
    const bridge=new ExpansionCombatAdapter(manager), bursts=[];
    const a=new Ability({lights:{acquire:()=>({}),set(){},release(){}},character:{position:new Vector3()},expansionCombat:bridge});
    a.spawn(new Vector3(),new Vector3(1,0,0),10);a.fx={emit(n){bursts.push(n);}};
    while(!manager.queue.length)a.update(1/60);
    assert.equal(bursts.filter(n=>n===24).length,0,'enqueue must not show impact');
    if(cancel)manager.cancelEvents(()=>true);
    manager.advance(1/30);
    assert.equal(bursts.filter(n=>n===24).length,cancel?0:1);
    a.destroy();a.dispose();bridge.dispose();
  }
});
