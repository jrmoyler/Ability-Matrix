import test from 'node:test';
import assert from 'node:assert/strict';
import { Scene } from 'three';
import { CombatStateManager } from '../packs/sandbox/src/combat/ucsm/CombatStateManager.js';
import { MechanicSystems } from '../packs/sandbox/src/combat/ucsm/mechanics/MechanicSystems.js';
import { MechanicPresentation } from '../packs/sandbox/src/combat/ucsm/mechanics/MechanicPresentation.js';
import { STANCE_VARIANTS } from '../packs/sandbox/src/combat/ucsm/mechanics/stance-presets.js';
import { IMPLEMENTED_MECHANICS } from '../packs/sandbox/src/combat/ucsm/registry.js';

const ticks = (m,n) => { for(let i=0;i<n;i++) m.advance(); };
function setup(p) {
  const m = new CombatStateManager();
  m.upsertEntity({id:'caster',teamId:'player',position:[0,0,0],health:5});
  m.upsertEntity({id:'enemy',teamId:'enemy',position:[2,0,0],health:10});
  m.upsertEntity({id:'enemy2',teamId:'enemy',position:[3,0,0],health:10});
  m.upsertEntity({id:'ally',teamId:'player',position:[1,0,0],health:10});
  const s = new MechanicSystems(m);
  assert.equal(s.command({family:'stance',uid:p.uid}).ok,true);
  ticks(m,s.t(p.anticipation)+1);
  return {m,s};
}
const hit = (m, extra={}) => m.submit({type:'hit',ownerId:'enemy',teamId:'enemy',abilityUid:'enemy/test',element:'force',targetIds:['caster'],damage:0.8, ...extra});
const cast = (m, n=1) => { for(let i=0;i<n;i++) m.submit({type:'cast-start',ownerId:'caster',teamId:'player',abilityUid:'test/standard',element:'arcane'}); };

test('five authored forms are selectable and restore movement on finish, interruption and death', () => {
  assert.equal(STANCE_VARIANTS.length,5);
  for(const p of STANCE_VARIANTS) {
    assert.ok(IMPLEMENTED_MECHANICS.some((entry) => entry.uid===p.uid && entry.selectable));
    const {m,s}=setup(p);
    assert.equal(s.speed('caster'),p.speed,p.uid);
    const energy=s.actor('caster').energy; ticks(m,30);
    assert.ok(s.actor('caster').energy < energy,p.uid);
    assert.equal(s.stance.finish('caster'),true); ticks(m,2);
    assert.equal(s.speed('caster'),1,p.uid);
    assert.ok(m.recentEvents.some((e)=>e.abilityUid===p.uid && e.type==='hit'),p.uid);
    assert.equal(m.entities.get('ally').health,10,p.uid);
    const x=setup(p); x.s.cancel('caster'); ticks(x.m,2);
    assert.equal(x.s.speed('caster'),1,p.uid);
    const y=setup(p); y.m.setAlive('caster',false); ticks(y.m,2);
    assert.equal(y.s.stance.active.size,0,p.uid);
    const z=setup(p); z.s.actor('caster').energy=0; ticks(z.m,2);
    assert.equal(z.s.speed('caster'),1,p.uid);
    const timeout=setup(p); timeout.s.actor('caster').energy=10000; ticks(timeout.m,timeout.s.t(p.life)+2);
    assert.equal(timeout.s.speed('caster'),1,p.uid);
  }
});

test('ember and tide pulse on distinct cast cadences with their own elemental attribution', () => {
  for (const [p, cadence] of [[STANCE_VARIANTS[0],3],[STANCE_VARIANTS[3],2]]) {
    const {m}=setup(p); cast(m,cadence-1); ticks(m,2);
    assert.equal(m.recentEvents.filter(e=>e.abilityUid===p.uid && e.type==='hit').length,0);
    cast(m); ticks(m,2);
    assert.ok(m.recentEvents.some(e=>e.abilityUid===p.uid && e.type==='hit' && e.element===p.element));
    assert.equal(m.entities.get('ally').health,10);
  }
});

test('pale guard retaliates within range with a one-second rate limit', () => {
  const p=STANCE_VARIANTS[1], {m}=setup(p);
  hit(m); hit(m); ticks(m,3);
  assert.equal(m.recentEvents.filter(e=>e.abilityUid===p.uid && e.type==='hit').length,1);
  assert.ok(m.entities.get('enemy').statuses.some(s=>s.tag==='chilled'));
  ticks(m,31); hit(m); ticks(m,3);
  assert.equal(m.recentEvents.filter(e=>e.abilityUid===p.uid && e.type==='hit').length,2);
});

test('thunder chains the second tagged sandbox takedown to a different hostile body', () => {
  const p=STANCE_VARIANTS[2], {m}=setup(p);
  m.submit({type:'hit',ownerId:'caster',teamId:'player',abilityUid:'test/attack',element:'storm',targetIds:['enemy'],damage:0.1});
  ticks(m,2);
  assert.equal(m.recentEvents.filter(e=>e.abilityUid===p.uid && e.tags.includes('stance-arc')).length,0);
  for(let i=0;i<2;i++) m.submit({type:'hit',ownerId:'caster',teamId:'player',abilityUid:'test/attack',element:'storm',targetIds:['enemy'],tags:['sandbox-kill'],damage:0.1});
  ticks(m,3);
  const arc=m.recentEvents.find(e=>e.abilityUid===p.uid && e.tags.includes('stance-arc'));
  assert.deepEqual(arc.targetIds,['enemy2']);
  assert.ok(m.entities.get('enemy2').health<10);
  assert.equal(m.entities.get('ally').health,10);
});

test('titan turns accumulated absorbed impact into a local tremor', () => {
  const p=STANCE_VARIANTS[4], {m,s}=setup(p);
  hit(m); ticks(m,3);
  assert.ok(s.stance.active.get('caster').bank > 0.5);
  assert.ok(m.recentEvents.some(e=>e.abilityUid===p.uid && e.type==='hit'));
  assert.ok(m.entities.get('enemy').health < 10);
});

test('finish reserves damage and terrain together and preserves the stance when either budget is exhausted', () => {
  for (const budget of ['queue', 'events']) {
    const p = STANCE_VARIANTS[0], {m,s} = setup(p);
    const active = s.stance.active.get('caster');
    const before = m.cues.filter(c => c.phase === 'finisher').length;
    if (budget === 'queue') m.budget.maxQueue = m.queue.length + 1;
    else s.b.eventsPerTick = s.used + 1;
    assert.equal(s.stance.finish('caster'), false, budget);
    assert.equal(s.stance.active.get('caster'), active, budget);
    assert.equal(m.cues.filter(c => c.phase === 'finisher').length, before, budget);
    assert.equal(m.queue.filter(e => e.castId === `${active.id}:finish`).length, 0, budget);
    m.budget.maxQueue = 512; s.b.eventsPerTick = 24; s.used = 0;
    assert.equal(s.stance.finish('caster'), true, budget);
    const queued = m.queue.filter(e => e.castId === `${active.id}:finish`);
    assert.deepEqual(queued.map(e => e.type).sort(), ['hit','terrain-impact']);
  }
});

test('an exhausted passive budget retains ember, tide and titan procs for retry without false cues', () => {
  for (const p of [STANCE_VARIANTS[0], STANCE_VARIANTS[3], STANCE_VARIANTS[4]]) {
    const {m,s}=setup(p), before = m.cues.filter(c=>c.phase==='finisher').length;
    s.b.eventsPerTick = 0;
    if (p.passive === 'quakes') {
      s.stance.modify({type:'hit',ownerId:'enemy',teamId:'enemy',targetIds:['caster'],damage:0.8,tags:[]});
    } else {
      const count = p.passive === 'tide' ? 2 : 3;
      for(let i=0;i<count;i++) s.stance.modify({type:'cast-start',ownerId:'caster',mechanic:'standard'});
    }
    assert.equal(m.cues.filter(c=>c.phase==='finisher').length,before,p.uid);
    assert.equal(m.queue.filter(e=>e.abilityUid===p.uid && e.type==='hit').length,0,p.uid);
    s.b.eventsPerTick = 24;
    m.advance();
    assert.equal(m.cues.filter(c=>c.phase==='finisher').length,before+1,p.uid);
    assert.equal(m.recentEvents.filter(e=>e.abilityUid===p.uid && e.type==='hit').length,1,p.uid);
  }
});

test('thunder arc retries on the next tick after an event budget refusal', () => {
  const p=STANCE_VARIANTS[2], {m,s}=setup(p);
  s.b.eventsPerTick=0;
  for(let i=0;i<2;i++) s.stance.modify({type:'hit',ownerId:'caster',teamId:'player',mechanic:'standard',
    eventId:`direct:${i}`,targetIds:['enemy'],tags:['sandbox-kill'],intensity:1});
  assert.equal(m.cues.filter(c=>c.phase==='reversal').length,0);
  assert.doesNotThrow(() => JSON.stringify(m.snapshot()), 'deferred arcs do not create cyclic state');
  s.b.eventsPerTick=24; m.advance();
  assert.ok(m.recentEvents.some(e=>e.abilityUid===p.uid && e.tags.includes('stance-arc')));
  assert.equal(m.cues.filter(c=>c.phase==='reversal').length,1);
});

test('pale retaliation is deferred without a false reversal cue when the event budget is exhausted', () => {
  const p=STANCE_VARIANTS[1], {m,s}=setup(p);
  s.b.eventsPerTick=0;
  s.stance.modify({type:'hit',ownerId:'enemy',teamId:'enemy',mechanic:'standard',
    eventId:'attack',targetIds:['caster'],tags:[],damage:0.8});
  assert.equal(m.cues.filter(c=>c.phase==='reversal').length,0);
  s.b.eventsPerTick=24; m.advance();
  assert.ok(m.recentEvents.some(e=>e.abilityUid===p.uid && e.tags.includes('stance-retort')));
  assert.equal(m.cues.filter(c=>c.phase==='reversal').length,1);
});

test('stance cancellation discards deferred procs without a late hit', () => {
  const p=STANCE_VARIANTS[0], {m,s}=setup(p);
  s.b.eventsPerTick=0;
  for(let i=0;i<3;i++) s.stance.modify({type:'cast-start',ownerId:'caster',mechanic:'standard'});
  s.cancel('caster'); s.b.eventsPerTick=24; ticks(m,2);
  assert.equal(m.recentEvents.filter(e=>e.abilityUid===p.uid && e.type==='hit').length,0);
});

test('a finisher without hostile targets requires only the terrain event', () => {
  const p=STANCE_VARIANTS[0], {m,s}=setup(p);
  m.setAlive('enemy',false); m.setAlive('enemy2',false);
  m.queue.length=0; s.used=0; s.b.eventsPerTick=1; m.budget.maxQueue=1;
  assert.equal(s.stance.finish('caster'),true);
  assert.deepEqual(m.queue.map(e=>e.type),['terrain-impact']);
});

test('a refused finisher reports event budget and can be retried through commands', () => {
  const p=STANCE_VARIANTS[0], {m,s}=setup(p);
  m.queue.length=0; m.budget.maxQueue=1;
  assert.equal(s.command({family:'stance',uid:p.uid,action:'finish'}).ok,true);
  m.advance();
  assert.equal(s.results.at(-1).reason,'event budget');
  assert.equal(s.stance.active.has('caster'),true);
  m.budget.maxQueue=512;
  assert.equal(s.command({family:'stance',uid:p.uid,action:'finish'}).ok,true);
  m.advance();
  assert.equal(s.results.at(-1).ok,true);
  assert.equal(s.stance.active.has('caster'),false);
});

test('deferred stance procs share the pending cast limit and explicitly refuse overflow', () => {
  const m = new CombatStateManager();
  m.upsertEntity({id:'caster',teamId:'player'});
  m.upsertEntity({id:'enemy',teamId:'enemy',position:[2,0,0]});
  m.upsertEntity({id:'other',teamId:'enemy',position:[3,0,0]});
  const s = new MechanicSystems(m,{eventsPerTick:0,maxPending:32}), p = STANCE_VARIANTS[2];
  s.stance.activate({id:'test',ownerId:'caster',family:'stance',uid:p.uid,position:[0,0,0],direction:[0,0,1]});
  for(let i=0;i<100;i++) s.stance.modify({type:'hit',ownerId:'caster',teamId:'player',mechanic:'standard',
    eventId:`h${i}`,targetIds:['enemy'],tags:['sandbox-kill'],intensity:1});
  assert.equal(s.stance.deferredCount(),32);
  assert.equal(m.cues.filter(c=>c.phase==='refused' && c.reason==='stance proc budget').length,18);
  assert.equal(m.cues.filter(c=>c.phase==='reversal').length,0);
  s.b.eventsPerTick=24; m.advance();
  assert.ok(s.stance.deferredCount() < 32, 'accepted procs drain when budget returns');
});

test('pending casts and deferred procs compete for capacity, including zero limits and death cleanup', () => {
  const m=new CombatStateManager();
  m.upsertEntity({id:'caster',teamId:'player'});
  m.upsertEntity({id:'enemy',teamId:'enemy',position:[2,0,0]});
  const s=new MechanicSystems(m,{eventsPerTick:0,maxPending:2}), p=STANCE_VARIANTS[0];
  const c={id:'s',family:'stance',uid:p.uid,ownerId:'caster',position:[0,0,0],direction:[0,0,1]};
  s.stance.activate(c); const active=s.stance.active.get('caster');
  s.pending.push({...c,readyTick:100});
  assert.equal(s.stance.reserve(active,'burst',c),true);
  assert.equal(s.stance.reserve(active,'burst',c),false);
  assert.equal(s.stance.deferredCount()+s.pending.length,2);
  assert.equal(m.cues.at(-1).reason,'stance proc budget');
  assert.equal(s.command({family:'counter'}).ok,true); m.advance();
  assert.equal(s.results.at(-1).reason,'pending budget');
  m.setAlive('caster',false); s.stance.update();
  assert.equal(s.stance.deferredCount(),0, 'death releases all deferred references');
  s.b.maxPending=0; s.pending=[]; m.setAlive('caster',true);
  s.stance.activate(c); const next=s.stance.active.get('caster');
  assert.equal(s.stance.reserve(next,'burst',c),false);
  assert.equal(s.stance.deferredCount(),0);
  assert.equal(m.cues.at(-1).reason,'stance proc budget');
});

test('Titan stores only bounded queued tremors and refuses excess explicitly', () => {
  const m=new CombatStateManager();
  m.upsertEntity({id:'caster',teamId:'player',health:50});
  m.upsertEntity({id:'enemy',teamId:'enemy',position:[2,0,0],health:50});
  const s=new MechanicSystems(m,{eventsPerTick:0,maxPending:2}), p=STANCE_VARIANTS[4];
  const c={id:'titan',family:'stance',uid:p.uid,ownerId:'caster',position:[0,0,0],direction:[0,0,1]};
  s.stance.activate(c);
  s.stance.modify({type:'hit',eventId:'large',ownerId:'enemy',teamId:'enemy',targetIds:['caster'],damage:10,tags:[]});
  const active=s.stance.active.get('caster');
  assert.equal(active.pendingQuakes,2);
  assert.ok(active.quakeBank < 0.4);
  assert.ok(m.cues.some(cue=>cue.phase==='refused' && cue.reason==='stance proc budget'));
});

test('deferred budget is shared across owners and cancellation releases capacity', () => {
  const m=new CombatStateManager();
  m.upsertEntity({id:'one',teamId:'player'}); m.upsertEntity({id:'two',teamId:'player'});
  const s=new MechanicSystems(m,{eventsPerTick:0,maxPending:1}), p=STANCE_VARIANTS[0];
  const castFor=(ownerId)=>({id:ownerId,family:'stance',uid:p.uid,ownerId,position:[0,0,0],direction:[0,0,1]});
  const first=castFor('one'), second=castFor('two');
  s.stance.activate(first); s.stance.activate(second);
  assert.equal(s.stance.reserve(s.stance.active.get('one'),'burst',first),true);
  assert.equal(s.stance.reserve(s.stance.active.get('two'),'burst',second),false);
  s.cancel('one');
  assert.equal(s.stance.reserve(s.stance.active.get('two'),'burst',second),true);
  assert.equal(s.stance.deferredCount(),1);
});

test('five stance rigs use distinct arrangements and release all shared resources', () => {
  const m=new CombatStateManager(), s=new MechanicSystems(m), scene=new Scene(), view=new MechanicPresentation(scene,s);
  const signatures=[];
  for(const p of STANCE_VARIANTS) {
    const obj=view.add(p.uid,'stance',{uid:p.uid,family:'stance',position:[0,0,0],direction:[0,0,1]});
    const parts=[];
    obj.g.traverse(n=>{if(n.isMesh) parts.push([n.geometry.type,n.position.toArray().map(x=>+x.toFixed(2)),n.scale.toArray().map(x=>+x.toFixed(2))]);});
    assert.ok(parts.length>=12,p.uid);
    signatures.push(JSON.stringify(parts));
  }
  assert.equal(new Set(signatures).size,5);
  view.dispose(); assert.equal(scene.children.length,0);
});
