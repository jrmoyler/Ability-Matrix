import test from 'node:test';
import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';
import { CombatStateManager } from '../../packs/sandbox/src/combat/ucsm/CombatStateManager.js';
import { ExpansionCombatAdapter } from '../../packs/sandbox/src/combat/ucsm/ExpansionCombatAdapter.js';
import { bindExpansionCombat } from '../../packs/sandbox/src/abilities/expansion-2026/StandaloneCombat.js';
registerHooks({load(url, context, next) {return url.endsWith('.css') ? {format:'module', source:'', shortCircuit:true} : next(url,context);}});
const { PackAdapter } = await import('../../packs/sandbox/src/combat/ucsm/PackAdapter.js');

function setup(enabled) {
  const host = Object.create(PackAdapter.prototype);
  host.enabled = enabled;
  const manager = new CombatStateManager();
  host.manager = manager;
  manager.upsertEntity({id:'caster',teamId:'player',health:1});
  const bridge = new ExpansionCombatAdapter(manager, {enabled:()=>host.enabled,modeVersion:()=>host.combatModeEpoch});
  const scope = bindExpansionCombat({dummies:{slots:[]},expansionCombat:bridge},'matrix-expansion/example');
  return {host,manager,bridge,scope};
}
test('a standalone cast cannot resume after on/off round-trip between calls', () => {
  const {host,bridge,scope} = setup(false);
  assert.equal(scope.queryActors({position:[0,0,0],radius:1}).ok,true);
  const before=host.combatModeEpoch;
  host.enabled=true; host.enabled=false;
  assert.equal(host.combatModeEpoch,before+2);
  assert.equal(scope.queryActors({position:[0,0,0],radius:1}).reason,'combat mode changed during cast');
  bridge.dispose();
});
test('a live cast and its existing event listener cannot resume after off/on round-trip', () => {
  const {host,bridge,scope} = setup(true);
  let calls=0;
  const sub=scope.on('hit',()=>calls++);
  assert.equal(sub.ok,true);
  host.enabled=false; host.enabled=true;
  assert.equal(scope.queryActors({position:[0,0,0],radius:1}).reason,'combat mode changed during cast');
  bridge.onEvent({eventId:'x',sequence:1,tick:0,type:'hit',abilityUid:'legacy/test',targetIds:[],position:[0,0,0],tags:[]});
  assert.equal(calls,0);
  sub.unsubscribe();bridge.dispose();
});
test('writing the same enabled setting does not invalidate a cast', () => {
  const {host,bridge,scope}=setup(true);
  const before=host.combatModeEpoch;
  host.enabled=true;
  assert.equal(host.combatModeEpoch,before);
  assert.equal(scope.queryActors({position:[0,0,0],radius:1}).ok,true);
  bridge.dispose();
});
test('mode changes cancel pending expansion events while preserving legacy events', () => {
  const {host,manager,bridge}=setup(true);
  const submit=(abilityUid)=>manager.submit({type:'hit',element:'fire',abilityUid,ownerId:'caster',teamId:'player',targetIds:['caster'],position:[0,0,0],damage:1});
  submit('matrix-expansion/example'); submit('legacy/fire');
  host.enabled=false; host.enabled=true;
  assert.deepEqual(manager.queue.map((event)=>event.abilityUid),['legacy/fire']);
  bridge.dispose();
});
