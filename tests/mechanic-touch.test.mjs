import test from 'node:test';
import assert from 'node:assert/strict';
import { TouchControls } from '../packs/sandbox/src/input/TouchControls.js';

test('touch cast routes a selected mechanic to its own aiming path', async () => {
  const calls = [];
  const mechanic = { selected: 'weave', castAt(x, y) { calls.push([x, y]); return true; } };
  const controls = { app: { combat: { enabled: true, mechanics: mechanic } } };
  await TouchControls.prototype._castAt.call(controls, 132, 47);
  assert.deepEqual(calls, [[132, 47]]);
});

test('mechanic touch aim uses the selected range and caster-centered self casts', async () => {
  const { registerHooks } = await import('node:module');
  registerHooks({load(url, context, next) { return url.endsWith('.css') ? { format:'module', source:'', shortCircuit:true } : next(url, context); }});
  const { MechanicHost } = await import('../packs/sandbox/src/combat/ucsm/mechanics/MechanicHost.js');
  const { Vector2, Vector3 } = await import('three');
  const { MECHANIC_PRESETS } = await import('../packs/sandbox/src/combat/ucsm/mechanics/presets.js');
  let cast;
  const host = { selected:'worldshape', selectedUid:null, adapter:{enabled:true},
    app:{paused:false, canvas:{getBoundingClientRect:()=>({left:0,top:0,width:200,height:100})}, camera:{}, character:{position:new Vector3(1,0,2)}},
    pointer:new Vector2(), target:new Vector3(), plane:{},
    ray:{setFromCamera(){},ray:{intersectPlane(_plane,target){target.set(101,0,2);return target;}}},
    cast(...args){cast=args;return {ok:true};} };
  MechanicHost.prototype.castAt.call(host, 180, 50);
  assert.equal(cast[0], 'worldshape');
  assert.ok(Math.abs(cast[1][0] - (1 + MECHANIC_PRESETS.worldshape.range)) < 1e-8);
  assert.deepEqual(cast[2], [1,0,0]);
  host.selected='counter';
  MechanicHost.prototype.castAt.call(host, 180, 50);
  assert.deepEqual(cast[1], [1,0,2]);
});
