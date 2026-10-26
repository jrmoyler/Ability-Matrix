// Export only implemented mechanics for the matrix shell; the original catalog remains unchanged.
import { writeFileSync } from 'node:fs';
import { ELEMENT_GROUPS } from '../packs/sandbox/src/config/elements.js';
import { MECHANIC_REGISTRY, MECHANIC_FAMILIES } from '../packs/sandbox/src/combat/ucsm/registry.js';
import { MECHANIC_PRESETS, MECHANIC_VARIANTS } from '../packs/sandbox/src/combat/ucsm/mechanics/presets.js';
import { weaveHint } from '../packs/sandbox/src/combat/ucsm/mechanics/WeaveVariants.js';
const presets = new Map([...Object.values(MECHANIC_PRESETS), ...Object.values(MECHANIC_VARIANTS)].map(p => [p.uid, p]));
const accents = Object.fromEntries(ELEMENT_GROUPS.map(e => [e.id, e.accent]));
const abilities = MECHANIC_REGISTRY.filter(e => e.selectable).map(e => {
  const p = presets.get(e.uid);
  if (!p || p.element !== e.element || p.family !== e.mechanic) throw new Error(`Invalid mechanic registration: ${e.uid}`);
  const hint = p.detail || (p.family === 'weave' ? weaveHint(p.uid) : MECHANIC_FAMILIES[p.family].rule);
  return { uid: p.uid, pack: 'mechanics', id: p.uid.split('/').at(-1), kind: 'mechanic', family: p.family,
    element: p.element, label: p.name, hint, accent: accents[p.element], cast: ['stance','counter'].includes(p.family) ? 'self' : 'ground',
    range: p.range, cooldown: p.cooldown, castAnim: p.castAnim, status: 'live' };
});
writeFileSync(new URL('../presets/mechanics/catalog.json', import.meta.url), JSON.stringify({ format: 'collective-mechanics-catalog@1', abilities }, null, 2) + '\n');
