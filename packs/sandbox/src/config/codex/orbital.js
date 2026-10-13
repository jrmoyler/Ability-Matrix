/**
 * Orbital Strike — placeholder data block (being written).
 */
export default {
  id: 'orbital',
  meta: {
    label: "Orbital Strike",
    accent: '#ff5f5f',
    key: '',
    element: 'tech',
    hint: "Tech — a targeting laser paints the circle, then a beam from orbit burns it out",
    cast: 'zone',
    glyph: `<circle cx="50" cy="50" r="26"/>`
  },
  settings: {
    range: 18,
    minRange: 0,
    speed: 24,
    lifetime: 2,
    cooldown: 0.5,
    castAnim: 'cast3',
    lightColor: '#ff5f5f',
    lightIntensity: 6,
    lightRadius: 8,
    zoneRadius: 4,
    colorA: '#ff5f5f',
    colorB: '#ffffff'
  }
};
