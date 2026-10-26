// Authored additions to the Covenant Weaving family. All limits are in metres/seconds.
const spec = (slug, name, element, data) => Object.freeze({
  uid: `mechanics/weave/${slug}`, family: 'weave', name, element,
  range: 18, cost: 10, cooldown: 21, anticipation: 0.4, recovery: 0.5,
  castAnim: 'cast1', life: 12, maxAnchors: 3, maxLink: 14,
  anchorHealth: 2, width: 0.34, pulse: 0.8, damage: 0.65, ...data
});
export const WEAVE_VARIANTS = Object.freeze([
  spec('neural-thunder-grid', 'Neural Thunder Grid', 'storm', { behavior: 'chain', chainRadius: 4, chainDamage: 0.4, chainTargets: 3, pulse: 1 }),
  spec('hydrostatic-labyrinth', 'Hydrostatic Labyrinth', 'water', { behavior: 'flood', floodPulse: 1.5, floodDamage: 0.35, width: 0.42 }),
  spec('tectonic-triangulation', 'Tectonic Triangulation', 'earth', { behavior: 'quake', quakeRadius: 2.1, quakeDamage: 0.45, pulse: 1.2, anchorHealth: 3 }),
  spec('prismatic-cathedral', 'Prismatic Cathedral', 'crystal', { behavior: 'shatter', shatterRadius: 3, shatterDamage: 0.8, damage: 0.45 }),
  spec('jetstream-loom', 'Jetstream Loom', 'wind', { behavior: 'draft', draftSpeed: 1.35, width: 0.7, damage: 0.4, pulse: 0.7 })
]);

const WEAVE_HINTS = Object.freeze({
  'mechanics/weave/cryostasis-mesh': 'Place frost anchors; links chill enemies that cross.',
  'mechanics/weave/neural-thunder-grid': 'Place storm anchors; crossing enemies spark chains to nearby foes.',
  'mechanics/weave/hydrostatic-labyrinth': 'Place three water anchors in a triangle to flood enemies within it.',
  'mechanics/weave/tectonic-triangulation': 'Place earth anchors; crossing enemies trigger a local shock.',
  'mechanics/weave/prismatic-cathedral': 'Place crystal anchors; a destroyed anchor bursts against nearby foes.',
  'mechanics/weave/jetstream-loom': 'Place wind anchors; moving along a link increases your speed.'
});
/** Hints describe actual sandbox behavior, including its player-only movement integration. */
export const weaveHint = (uid) => WEAVE_HINTS[uid] ?? 'Place fire anchors; links ignite enemies that cross.';
