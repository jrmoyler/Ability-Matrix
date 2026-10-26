import test from 'node:test';
import assert from 'node:assert/strict';
import { Matrix4, Vector3 } from 'three';
import { settings } from '../../packs/sandbox/src/config/settings.js';
import config from '../../packs/sandbox/src/abilities/expansion-2026/spellwrights-gambit/config.js';
import {
  Ability,
  ID,
} from '../../packs/sandbox/src/abilities/expansion-2026/spellwrights-gambit/index.js';
settings[ID] = structuredClone(config.settings);
function setup() {
  const hits = [];
  const a = [
    {
      position: new Vector3(5, 0, 3.8),
      kill: () => {
        hits.push('ring');
        return true;
      },
    },
    {
      position: new Vector3(6, 0, 0),
      kill: () => {
        hits.push('line');
        return true;
      },
    },
    {
      position: new Vector3(7, 0, 2),
      kill: () => {
        hits.push('interior');
        return true;
      },
    },
  ];
  const ability = new Ability({
    lights: { acquire: () => ({}), release: () => {}, set: () => {} },
    dummies: {
      findTargets: (x, z, r, out) => {
        out.length = 0;
        out.push(...a);
        return out;
      },
    },
  });
  ability.spawn(new Vector3(), new Vector3(1, 0, 0), 5);
  return { ability, hits };
}
test('composed ring then line release separately and enforce their selected footprints', () => {
  const { ability, hits } = setup();
  for (let i = 0; i < 70; i++) ability.update(1 / 60);
  assert.deepEqual(hits, ['ring']);
  assert.equal(ability.releases[0].kind, 'ring');
  assert.equal(ability.releases[0].group.visible, true);
  for (let i = 0; i < 40; i++) ability.update(1 / 60);
  assert.deepEqual(hits, ['ring', 'line']);
  assert.equal(ability.releases[1].kind, 'line');
  assert.equal(ability.shapeRing.visible, false);
  assert.equal(ability.shapeLine.visible, false);
  assert.equal(ability.shapeBurst.visible, false);
  ability.destroy();
  ability.dispose();
});
test('shape indicators respond to live selection and all geometry is bounded and disposable', () => {
  const { ability } = setup();
  assert.equal(ability.shapeRing.visible, true);
  assert.equal(ability.ringFootprint.uniforms.width.value, settings[ID].ringWidth / settings[ID].zoneRadius);
  assert.equal(ability.lineFootprint.uniforms.width.value, settings[ID].lineWidth / settings[ID].zoneRadius);
  settings[ID].firstShape = 'burst';
  ability.update(0);
  assert.equal(ability.shapeBurst.visible, true);
  assert.equal(ability.shapeRing.visible, false);
  settings[ID].firstShape = 'ring';
  let disposed = 0;
  for (const r of ability.resources)
    r.addEventListener('dispose', () => disposed++);
  ability.destroy();
  ability.dispose();
  ability.dispose();
  assert.equal(disposed, ability.resources.length);
});
test('armillary core deploys and its pooled blades orbit through both beats', () => {
  const { ability } = setup();
  assert.equal(ability.heroRings.length, 3);
  assert.equal(ability.blades.count, 8);
  const matrix = new Matrix4();
  ability.blades.getMatrixAt(0, matrix);
  const before = new Vector3().setFromMatrixPosition(matrix);
  for (let i = 0; i < 70; i++) ability.update(1 / 60);
  ability.blades.getMatrixAt(0, matrix);
  const after = new Vector3().setFromMatrixPosition(matrix);
  assert.ok(before.distanceTo(after) > .1);
  assert.ok(ability.hero.scale.x > .9);
  assert.ok(ability.coreMat.emissiveIntensity > 1.1);
  for (let i = 0; i < 100; i++) ability.update(1 / 60);
  assert.ok(ability.hero.scale.x < .9);
  ability.destroy(); ability.dispose();
});

test('runic shapes strike UCSM enemies with correct footprint and attribution', async () => {
  const {CombatStateManager}=await import('../../packs/sandbox/src/combat/ucsm/CombatStateManager.js');
  const {ExpansionCombatAdapter}=await import('../../packs/sandbox/src/combat/ucsm/ExpansionCombatAdapter.js');
  const m=new CombatStateManager();
  for (const e of [
    {id:'caster',teamId:'player',health:10},
    {id:'ring',teamId:'enemy',position:[5,0,3.8],health:10},
    {id:'line',teamId:'enemy',position:[6,0,0],health:10},
    {id:'interior',teamId:'enemy',position:[7,0,2],health:10},
    {id:'ally',teamId:'player',position:[6,0,0],health:10},
  ]) m.upsertEntity(e);
  const bridge=new ExpansionCombatAdapter(m),seen=[];
  const sub=bridge.bind('matrix-expansion/test-observer').on('hit', e=>seen.push(e));
  const a=new Ability({lights:{acquire:()=>({}),set(){},release(){}},expansionCombat:bridge});
  a.spawn(new Vector3(),new Vector3(1,0,0),5);
  for(let i=0;i<180;i++){a.update(1/60);if(i%2)m.advance();}
  assert.equal(m.entities.get('ring').health,9);assert.equal(m.entities.get('line').health,9);
  assert.equal(m.entities.get('interior').health,10);assert.equal(m.entities.get('ally').health,10);
  assert.deepEqual(seen.map(e=>e.abilityUid),['matrix-expansion/spellwrights-gambit','matrix-expansion/spellwrights-gambit']);
  assert.ok(seen.every(e=>e.element==='arcane'));
  sub.unsubscribe();a.destroy();a.dispose();bridge.dispose();
});

test('standalone runes reach real host targets and fail closed after mode changes', async () => {
  const {CombatStateManager}=await import('../../packs/sandbox/src/combat/ucsm/CombatStateManager.js');
  const {ExpansionCombatAdapter}=await import('../../packs/sandbox/src/combat/ucsm/ExpansionCombatAdapter.js');
  let enabled=false,epoch=0,kills=0;
  const dummy={alive:true,position:new Vector3(5,0,3.8),kill(){kills++;this.alive=false;return true;}};
  const bridge=new ExpansionCombatAdapter(new CombatStateManager(),{enabled:()=>enabled,modeVersion:()=>epoch});
  const a=new Ability({lights:{acquire:()=>({}),set(){},release(){}},character:{position:new Vector3()},dummies:{slots:[{dummy}]},expansionCombat:bridge});
  a.spawn(new Vector3(),new Vector3(1,0,0),5);
  for(let i=0;i<180;i++)a.update(1/60);
  assert.equal(kills,1);
  a.destroy();dummy.alive=true;a.spawn(new Vector3(),new Vector3(1,0,0),5);
  enabled=true;epoch++;enabled=false;epoch++;
  for(let i=0;i<180;i++)a.update(1/60);
  assert.equal(kills,1);assert.equal(a.failure,'combat mode changed during cast');
  a.destroy();a.dispose();bridge.dispose();
});
