/**
 * Miasma Spit — placeholder data block (being written).
 */
export default {
  id: 'miasma',
  meta: {
    label: "Miasma Spit",
    accent: '#9dff5a',
    key: '',
    element: 'poison',
    hint: "Poison — a gob of corrosive bile arcs down the line and splashes into a bubbling sludge",
    cast: 'line',
    glyph: `<circle cx="50" cy="50" r="26"/>`
  },
  settings: {
    range: 20,
    minRange: 2,
    speed: 24,
    lifetime: 2,
    cooldown: 0.5,
    castAnim: 'cast2',
    lightColor: '#9dff5a',
    lightIntensity: 6,
    lightRadius: 8,
    colorA: '#9dff5a',
    colorB: '#ffffff'
  }
};
