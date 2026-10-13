/**
 * Ball Lightning — placeholder data block (being written).
 */
export default {
  id: 'balllightning',
  meta: {
    label: "Ball Lightning",
    accent: '#9fd8ff',
    key: '',
    element: 'storm',
    hint: "Lightning — a crackling plasma orb rolls down the line, zapping bodies, then bursts",
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
    lightColor: '#9fd8ff',
    lightIntensity: 6,
    lightRadius: 8,
    colorA: '#9fd8ff',
    colorB: '#ffffff'
  }
};
