/**
 * Downburst — placeholder data block (being written).
 */
export default {
  id: 'downburst',
  meta: {
    label: "Downburst",
    accent: '#cfe3ff',
    key: '',
    element: 'wind',
    hint: "Wind — a column of air slams down onto the circle and flattens everything in it",
    cast: 'zone',
    glyph: `<circle cx="50" cy="50" r="26"/>`
  },
  settings: {
    range: 18,
    minRange: 0,
    speed: 24,
    lifetime: 2,
    cooldown: 0.5,
    castAnim: 'cast2',
    lightColor: '#cfe3ff',
    lightIntensity: 6,
    lightRadius: 8,
    zoneRadius: 4,
    colorA: '#cfe3ff',
    colorB: '#ffffff'
  }
};
