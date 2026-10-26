import test from 'node:test';
import assert from 'node:assert/strict';
import { register } from 'node:module';
import { createConvergenceTelegraph } from '../packs/sandbox/src/combat/ucsm/mechanics/ConvergenceTelegraph.js';
import { CONVERGENCE_VARIANTS } from '../packs/sandbox/src/combat/ucsm/mechanics/ConvergenceVariants.js';

// The host imports its stylesheet through Vite; ignore that non-JS import for
// the Node lifecycle test while exercising the real host method.
const loader = `export async function load(url, context, nextLoad) {
  if (url.endsWith('.css')) return { format: 'module', source: '', shortCircuit: true };
  return nextLoad(url, context);
}`;
register(`data:text/javascript,${encodeURIComponent(loader)}`, import.meta.url);
const { MechanicHost } = await import('../packs/sandbox/src/combat/ucsm/mechanics/MechanicHost.js');

test('clearing mechanics hides both previews immediately, before another frame', () => {
  let resets=0, clears=0;
  const host={
    systems:{reset(){resets++;}}, presentation:{clear(){clears++;}},
    threats:[{}], selected:'convergence', selectedUid:CONVERGENCE_VARIANTS[0].uid,
    preview:{visible:true}, convergencePreview:{visible:true}
  };
  MechanicHost.prototype.clear.call(host);
  assert.equal(resets,1); assert.equal(clears,1);
  assert.equal(host.preview.visible,false); assert.equal(host.convergencePreview.visible,false);
  assert.equal(host.selected,null); assert.equal(host.selectedUid,null); assert.deepEqual(host.threats,[]);
  host.convergencePreview=null;
  assert.doesNotThrow(()=>MechanicHost.prototype.clear.call(host));
});

test('all convergence outlines are a visible overlay on raised terrain', () => {
  for(const preset of CONVERGENCE_VARIANTS) {
    const overlay=createConvergenceTelegraph(preset);
    assert.ok(overlay.children.length > 1,preset.name);
    for(const line of overlay.children) {
      assert.equal(line.material.depthTest,false,preset.name);
      assert.equal(line.material.depthWrite,false,preset.name);
      assert.ok(line.renderOrder >= 100,preset.name);
    }
    overlay.userData.dispose();
  }
});
