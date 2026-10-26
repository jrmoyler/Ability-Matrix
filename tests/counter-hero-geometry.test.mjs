import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { Scene } from 'three';
import { createCounterHeroGeometry, COUNTER_HERO_SLUGS } from '../packs/sandbox/src/combat/ucsm/mechanics/CounterHeroGeometry.js';
import { MechanicPresentation } from '../packs/sandbox/src/combat/ucsm/mechanics/MechanicPresentation.js';
import { MechanicSystems } from '../packs/sandbox/src/combat/ucsm/mechanics/MechanicSystems.js';
import { CombatStateManager } from '../packs/sandbox/src/combat/ucsm/CombatStateManager.js';

test('counter hero surfaces are finite, deterministic, and geometrically distinct', () => {
  const fingerprints=new Set();
  for(const slug of COUNTER_HERO_SLUGS) {
    const g=createCounterHeroGeometry(slug), p=g.getAttribute('position'), uv=g.getAttribute('uv');
    assert.ok(p.count >= 36, slug);
    assert.equal(p.count,uv.count,slug);
    assert.ok([...p.array].every(Number.isFinite),slug);
    assert.ok([...uv.array].every(x=>Number.isFinite(x) && x>=0 && x<=1),slug);
    assert.ok([...g.index.array].every(i=>i<p.count),slug);
    assert.ok(g.boundingSphere.radius>0 && g.boundingSphere.radius<5,slug);
    const fp=createHash('sha256').update(Buffer.from(p.array.buffer)).digest('hex');
    assert.ok(!fingerprints.has(fp),slug); fingerprints.add(fp);
    const again=createCounterHeroGeometry(slug);
    assert.deepEqual(p.array,again.getAttribute('position').array,slug);
    g.dispose();again.dispose();
  }
  assert.throws(()=>createCounterHeroGeometry('unknown'),/Unknown counter hero/);
});

test('counter guard and return reuse one hero geometry and dispose it once', () => {
  const m=new CombatStateManager();m.upsertEntity({id:'caster',teamId:'player'});
  const s=new MechanicSystems(m), scene=new Scene(), v=new MechanicPresentation(scene,s);
  const uid='mechanics/counter/backdraft-reprisal';
  const guard=v.add('guard','counter',{uid,position:[0,0,0],direction:[0,0,1]});
  const projectile=v.add('return','reversal',{uid,position:[8,0,0],from:[0,0,0]});
  const geo=v.geo['counterHero:backdraft-reprisal'];
  let hasGuard=false,hasReturn=false;
  guard.g.traverse(n=>{if(n.geometry===geo)hasGuard=true;});
  projectile.g.traverse(n=>{if(n.geometry===geo && n.userData.counterProjectile)hasReturn=true;});
  assert.ok(hasGuard && hasReturn);
  assert.equal(v.resources.filter(r=>r===geo).length,1);
  let disposed=0;geo.addEventListener('dispose',()=>disposed++);
  v.dispose();assert.equal(disposed,1);assert.equal(scene.children.length,0);
});
