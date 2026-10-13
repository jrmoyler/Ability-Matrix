/**
 * Railgun Lance — placeholder data block (being written).
 */
export default {
  id: 'railgun',
  meta: {
    label: "Railgun Lance",
    accent: '#7ff0ff',
    key: '',
    element: 'tech',
    hint: "Tech — coils charge round the hand and fire a hard-light slug straight down the line",
    cast: 'line',
    glyph: `<circle cx="50" cy="50" r="26"/>`
  },
  settings: {
    range: 20,
    minRange: 2,
    speed: 24,
    lifetime: 2,
    cooldown: 0.5,
    castAnim: 'cast1',
    lightColor: '#7ff0ff',
    lightIntensity: 6,
    lightRadius: 8,
    colorA: '#7ff0ff',
    colorB: '#ffffff'
  }
};
