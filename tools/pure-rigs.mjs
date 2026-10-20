// Source of truth for the procedural rigs of the 80 pure-element castables.
//
// Each cast owns two authored pieces of geometry (see RigKit.js):
//   piece  a small solid thrown many times through the InstancedMesh
//   hero   one larger articulated rig that stands, drops or rides at the heart
// Recipes live in tools/rigs/*.mjs as plain arrow functions over a RigBuilder.
// This module turns each into `assets/codex/<Cast>Geometry.js`, embedding the
// recipe's own source so the committed module reads like a hand-written one.
// Run: node tools/sculpt-pure.mjs (it calls rigModuleSource for every spell).
import { SPELLS } from './pure-spells.mjs';
import { EARTH } from './rigs/earth.mjs';
import { CRYSTAL } from './rigs/crystal.mjs';
import { WIND } from './rigs/wind.mjs';
import { SOUND } from './rigs/sound.mjs';
import { LIGHT } from './rigs/light.mjs';
import { HOLY } from './rigs/holy.mjs';
import { COSMIC } from './rigs/cosmic.mjs';
import { SHADOW } from './rigs/shadow.mjs';
import { ARCANE } from './rigs/arcane.mjs';
import { TIME } from './rigs/time.mjs';
import { TECH } from './rigs/tech.mjs';

export const RIGS = { ...EARTH, ...CRYSTAL, ...WIND, ...SOUND, ...LIGHT, ...HOLY, ...COSMIC, ...SHADOW, ...ARCANE, ...TIME, ...TECH };

const KIT = ['RigBuilder', 'PI', 'TAU', 'lerp', 'clamp', 'smooth', 'rng', 'ngon', 'star', 'arcBand', 'curve', 'arcPath', 'helixPath'];

/** Body of a block-bodied arrow function, dedented to two spaces. */
function body(fn) {
  const src = fn.toString();
  const open = src.indexOf('{');
  const close = src.lastIndexOf('}');
  if (open < 0 || close < open) throw new Error('rig recipes must use block bodies');
  const lines = src.slice(open + 1, close).replace(/^\s*\n/, '').replace(/\s+$/, '').split('\n');
  const indent = Math.min(...lines.filter((l) => l.trim()).map((l) => l.match(/^ */)[0].length));
  return lines.map((l) => (l.trim() ? '  ' + l.slice(indent) : '')).join('\n');
}

export function rigModuleSource(spell) {
  const rig = RIGS[spell.id];
  if (!rig) throw new Error(`Missing rig for ${spell.id}`);
  const pieceBody = body(rig.piece);
  const heroBody = body(rig.hero);
  const used = KIT.filter((name) => name === 'RigBuilder' || new RegExp(`\\b${name}\\b`).test(pieceBody + heroBody));
  const doc = (text) => text.trim().split('\n').map((l) => ` * ${l.trim()}`.trimEnd()).join('\n');
  return `import { ${used.join(', ')} } from './RigKit.js';

/**
 * ${spell.label} — procedural geometry.
 *
${doc(rig.title)}
 *
 * Two solids, both from RigKit: a small piece thrown through the instanced
 * layer, and one hero rig at the heart of the cast. Every part carries its own
 * pivot and hinge, so the detail shader folds them as the cast progresses.
 */

/** The thrown piece. ${rig.pieceNote}. Centred on y = 0, its largest extent one unit. */
export function create${spell.cls}PieceGeometry() {
  const b = new RigBuilder('${spell.id}.piece');
${pieceBody}
  return b.build({ center: true, fit: 1 });
}

/** The hero rig. ${rig.heroNote}. */
export function create${spell.cls}HeroGeometry() {
  const b = new RigBuilder('${spell.id}.hero');
${heroBody}
  return b.build();
}
`;
}

export function missingRigs() {
  return SPELLS.filter((s) => !RIGS[s.id]).map((s) => s.id);
}
