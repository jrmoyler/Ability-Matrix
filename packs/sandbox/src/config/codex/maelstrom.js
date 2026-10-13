/**
 * Maelstrom Vortex — placeholder data block (being written).
 */
export default {
  id: 'maelstrom',
  meta: {
    label: "Maelstrom Vortex",
    accent: '#3fa9ff',
    key: '',
    element: 'water',
    hint: "Water — a whirlpool opens in the floor, spins bodies round its rim and drags them under",
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
    lightColor: '#3fa9ff',
    lightIntensity: 6,
    lightRadius: 8,
    zoneRadius: 4,
    colorA: '#3fa9ff',
    colorB: '#ffffff'
  }
};
