/**
 * Glyph Barrage — placeholder data block (being written).
 */
export default {
  id: 'glyphs',
  meta: {
    label: "Glyph Barrage",
    accent: '#7c8cff',
    key: '',
    element: 'arcane',
    hint: "Arcane — sigils stamp themselves down the line, then detonate one after another",
    cast: 'line',
    glyph: `<circle cx="50" cy="50" r="26"/>`
  },
  settings: {
    range: 20,
    minRange: 2,
    speed: 24,
    lifetime: 2,
    cooldown: 0.5,
    castAnim: 'cast3',
    lightColor: '#7c8cff',
    lightIntensity: 6,
    lightRadius: 8,
    colorA: '#7c8cff',
    colorB: '#ffffff'
  }
};
