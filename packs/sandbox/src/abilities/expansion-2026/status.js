/** Promotion gate. A candidate is never exposed by the production shell or runtime.
 * Change one UID from 'candidate' to 'live' only after its quality gate passes.
 */
export const EXPANSION_STATUS = Object.freeze({
  'matrix-expansion/ashen-doppelganger': 'candidate',
  'matrix-expansion/absolute-zero-thread': 'candidate',
  'matrix-expansion/fulminant-relay': 'candidate',
  'matrix-expansion/tidal-memory': 'candidate',
  'matrix-expansion/faultwake-bastion': 'candidate',
  'matrix-expansion/prism-choir': 'candidate',
  'matrix-expansion/pressure-inversion': 'candidate',
  'matrix-expansion/overtone-spiral': 'candidate',
  'matrix-expansion/predatory-canopy': 'candidate',
  'matrix-expansion/celestial-cartography': 'candidate',
  'matrix-expansion/toxin-evolution': 'candidate',
  'matrix-expansion/nightshade-inheritance': 'candidate',
  'matrix-expansion/heliostat-verdict': 'candidate',
  'matrix-expansion/vigil-of-embers': 'candidate',
  'matrix-expansion/mass-weft': 'candidate',
  'matrix-expansion/hollow-meridian': 'candidate',
  'matrix-expansion/pulse-covenant': 'candidate',
  'matrix-expansion/spellwrights-gambit': 'candidate',
  'matrix-expansion/mirage-procession': 'candidate',
  'matrix-expansion/borrowed-tomorrow': 'candidate',
  'matrix-expansion/momentum-ledger': 'candidate',
  'matrix-expansion/adaptive-fabricator': 'candidate',
  'matrix-expansion/vector-breakwater': 'candidate',
  'matrix-expansion/cinder-crown': 'candidate',
  'matrix-expansion/glacier-bell': 'candidate'
});
export const hasLiveExpansion = () => Object.values(EXPANSION_STATUS).includes('live');
