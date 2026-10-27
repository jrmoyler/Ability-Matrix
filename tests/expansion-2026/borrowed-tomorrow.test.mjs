import test from 'node:test';
import assert from 'node:assert/strict';
import { Matrix4, Vector3 } from 'three';
import { settings } from '../../packs/sandbox/src/config/settings.js';
import config from '../../packs/sandbox/src/abilities/expansion-2026/borrowed-tomorrow/config.js';
import {
  Ability,
  ID,
} from '../../packs/sandbox/src/abilities/expansion-2026/borrowed-tomorrow/index.js';
settings[ID] = structuredClone(config.settings);
const setup = () => {
  const hits = [];
  const target = {
    position: new Vector3(10, 0, 0),
    kill: (x, z, force) => {
      hits.push({ ...force, x, z });
      return true;
    },
  };
  const far = {
    position: new Vector3(99, 0, 0),
    kill: () => {
      throw Error('out of range');
    },
  };
  const ability = new Ability({
    lights: { acquire: () => ({}), release: () => {}, set: () => {} },
    dummies: {
      findTargets: (x, z, r, out) => {
        out.length = 0;
        out.push(target, far);
        return out;
      },
    },
  });
  return { ability, hits };
};
test('Borrowed Tomorrow delays its one bounded strike until the clock debt matures, then resets on reuse', () => {
  const { ability, hits } = setup();
  ability.spawn(new Vector3(), new Vector3(1, 0, 0), 10);
  for (let i = 0; i < 45; i++) ability.update(1 / 60);
  assert.equal(hits.length, 0);
  assert.ok(Math.abs(ability.fieldMaterial.uniforms.uTime.value - ability.age * config.settings.pulseSpeed) < 1e-6);
  for (let i = 0; i < 75; i++) ability.update(1 / 60);
  assert.equal(hits.length, 1);
  assert.equal(hits[0].impulse, config.settings.hitImpulse);
  for (let i = 0; i < 100; i++) ability.update(1 / 60);
  assert.equal(hits.length, 1);
  assert.equal(ability.isFinished, true);
  ability.destroy();
  ability.spawn(new Vector3(), new Vector3(1, 0, 0), 10);
  for (let i = 0; i < 150; i++) ability.update(1 / 60);
  assert.equal(hits.length, 2);
  ability.destroy();
  ability.dispose();
});
test('clock geometry and shader resources are finite, bounded, and disposed exactly once', () => {
  const { ability } = setup();
  let meshes = 0;
  ability.root.traverse((o) => {
    if (o.isMesh) {
      meshes++;
      let p = o.geometry.attributes.position;
      for (let i = 0; i < p.count; i++)
        assert.ok(
          Number.isFinite(p.getX(i)) &&
            Number.isFinite(p.getY(i)) &&
            Number.isFinite(p.getZ(i)),
        );
    }
  });
  assert.ok(meshes >= 7);
  assert.equal(ability.shards.count, 48);
  let count = 0;
  for (const r of ability.resources)
    r.addEventListener('dispose', () => count++);
  ability.dispose();
  ability.dispose();
  assert.equal(count, ability.resources.length);
});
test('clock fragments scatter after the deferred hit and pooling clears the release phase', () => {
  const { ability } = setup();
  ability.spawn(new Vector3(), new Vector3(1, 0, 0), 10);
  for (let i = 0; i < 240 && !ability._released; i++) ability.update(1 / 60);
  assert.equal(ability._released, true);
  const matrix = new Matrix4();
  ability.shards.getMatrixAt(0, matrix);
  const before = new Vector3().setFromMatrixPosition(matrix);
  for (let i = 0; i < 20; i++) ability.update(1 / 60);
  ability.shards.getMatrixAt(0, matrix);
  const after = new Vector3().setFromMatrixPosition(matrix);
  assert.ok(after.y > before.y + .2);
  ability.destroy();
  ability.spawn(new Vector3(), new Vector3(1, 0, 0), 10);
  assert.equal(ability._released, false);
  ability.destroy(); ability.dispose();
});
test('clock gathers bounded orbiting particles before the delayed strike', () => {
  const { ability, hits } = setup();
  const counts = [];
  ability.fx = { emit(count) { counts.push(count); } };
  ability.spawn(new Vector3(), new Vector3(1, 0, 0), 10);
  for (let i = 0; i < 60; i++) ability.update(1 / 60);
  assert.equal(hits.length, 0);
  // Orbiting puffs (moteCount) and, in flight, the throw's trail (trailCount).
  assert.ok(counts.length > 0 && counts.every((count) => count === config.settings.moteCount || count === config.settings.trailCount));
  assert.ok(counts.includes(config.settings.moteCount));
  for (let i = 0; i < 75; i++) ability.update(1 / 60);
  assert.equal(hits.length, 1);
  assert.ok(counts.includes(64));
  ability.destroy(); ability.dispose();
});
test('pendulum settles exactly when the deferred strike is released and resets on reuse', () => {
  const {ability,hits}=setup();
  ability.spawn(new Vector3(),new Vector3(1,0,0),10);
  for(let i=0;i<55;i++)ability.update(1/60);
  assert.equal(hits.length,0);
  assert.ok(Math.abs(ability.pendulum.rotation.z)>.01);
  for(let i=0;i<180&&!ability._released;i++)ability.update(1/60);
  assert.equal(hits.length,1);
  assert.ok(Math.abs(ability.pendulum.rotation.z)<1e-8);
  for(let i=0;i<80;i++)ability.update(1/60);
  assert.ok(ability.root.scale.x<1);
  ability.destroy();ability.spawn(new Vector3(),new Vector3(1,0,0),10);
  assert.equal(ability._released,false);
  ability.destroy();ability.dispose();
});

test('delayed strike damages UCSM enemies through the attributed combat bridge', async () => {
  const { CombatStateManager } = await import('../../packs/sandbox/src/combat/ucsm/CombatStateManager.js');
  const { ExpansionCombatAdapter } = await import('../../packs/sandbox/src/combat/ucsm/ExpansionCombatAdapter.js');
  const manager = new CombatStateManager();
  manager.upsertEntity({id:'caster',teamId:'player',health:5});
  manager.upsertEntity({id:'enemy',teamId:'enemy',position:[10,0,1],health:5});
  manager.upsertEntity({id:'ally',teamId:'player',position:[10,0,1],health:5});
  manager.upsertEntity({id:'outside',teamId:'enemy',position:[20,0,0],health:5});
  const bridge = new ExpansionCombatAdapter(manager);
  const ability = new Ability({lights:{acquire:()=>({}),set(){},release(){}},expansionCombat:bridge});
  ability.spawn(new Vector3(),new Vector3(1,0,0),10);
  const seen=[];
  const subscription=bridge.bind('matrix-expansion/test-observer').on('hit',event=>seen.push(event));
  for(let i=0;i<45;i++){ability.update(1/60);if(i%2)manager.advance();}
  assert.equal(manager.entities.get('enemy').health,5, 'strike must remain delayed');
  for(let i=0;i<120;i++){ability.update(1/60);if(i%2)manager.advance();}
  assert.equal(manager.entities.get('enemy').health,4);
  assert.equal(manager.entities.get('ally').health,5);
  assert.equal(manager.entities.get('outside').health,5);
  assert.equal(seen.length,1);
  assert.equal(seen[0].abilityUid,'matrix-expansion/borrowed-tomorrow');
  assert.equal(seen[0].element,'time');
  assert.deepEqual(seen[0].targetIds,['enemy']);
  subscription.unsubscribe();ability.destroy();ability.dispose();bridge.dispose();
});

test('standalone strike affects the fallback target once and rejects a mode change before release', async () => {
  const { CombatStateManager } = await import('../../packs/sandbox/src/combat/ucsm/CombatStateManager.js');
  const { ExpansionCombatAdapter } = await import('../../packs/sandbox/src/combat/ucsm/ExpansionCombatAdapter.js');
  const manager = new CombatStateManager();
  let enabled=false, epoch=0, kills=0;
  const dummy={alive:true,position:new Vector3(10,0,0),kill(){kills++;this.alive=false;return true;}};
  const bridge=new ExpansionCombatAdapter(manager,{enabled:()=>enabled,modeVersion:()=>epoch});
  const ability=new Ability({lights:{acquire:()=>({}),set(){},release(){}},character:{position:new Vector3()},dummies:{slots:[{dummy}]},expansionCombat:bridge});
  ability.spawn(new Vector3(),new Vector3(1,0,0),10);
  for(let i=0;i<160;i++)ability.update(1/60);
  assert.equal(kills,1);
  ability.destroy();dummy.alive=true;
  ability.spawn(new Vector3(),new Vector3(1,0,0),10);
  enabled=true;epoch++;enabled=false;epoch++;
  for(let i=0;i<160;i++)ability.update(1/60);
  assert.equal(kills,1);
  assert.equal(ability.failure,'combat mode changed during cast');
  ability.destroy();ability.dispose();bridge.dispose();
});
