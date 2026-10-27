/** Promotion gate. A candidate is never exposed by the production shell or runtime.
 * Change one UID from 'candidate' to 'live' only after its quality gate passes.
 */
export const EXPANSION_STATUS = Object.freeze({
  'matrix-expansion/ashen-doppelganger': 'live',
  'matrix-expansion/absolute-zero-thread': 'live',
  'matrix-expansion/fulminant-relay': 'live',
  'matrix-expansion/thunderhead-parasite': 'live',
  'matrix-expansion/tidal-memory': 'live',
  'matrix-expansion/faultwake-bastion': 'live',
  'matrix-expansion/prism-choir': 'live',
  'matrix-expansion/pressure-inversion': 'live',
  'matrix-expansion/overtone-spiral': 'live',
  'matrix-expansion/predatory-canopy': 'live',
  'matrix-expansion/celestial-cartography': 'live',
  'matrix-expansion/toxin-evolution': 'live',
  'matrix-expansion/nightshade-inheritance': 'live',
  'matrix-expansion/heliostat-verdict': 'live',
  'matrix-expansion/vigil-of-embers': 'live',
  'matrix-expansion/mass-weft': 'live',
  'matrix-expansion/hollow-meridian': 'live',
  'matrix-expansion/pulse-covenant': 'live',
  'matrix-expansion/spellwrights-gambit': 'live',
  'matrix-expansion/mirage-procession': 'live',
  'matrix-expansion/borrowed-tomorrow': 'live',
  'matrix-expansion/momentum-ledger': 'live',
  'matrix-expansion/adaptive-fabricator': 'live',
  'matrix-expansion/vector-breakwater': 'live',
  'matrix-expansion/cinder-crown': 'live',
  'matrix-expansion/glacier-bell': 'live'
});
export const hasLiveExpansion = () => Object.values(EXPANSION_STATUS).includes('live');
