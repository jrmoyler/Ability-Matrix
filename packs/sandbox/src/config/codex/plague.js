/**
 * Plague Swarm — placeholder data block (being written).
 */
export default {
  id: 'plague',
  meta: {
    label: "Plague Swarm",
    accent: '#b6ff3d',
    key: '',
    element: 'poison',
    hint: "Poison — a hive cracks open and a swarm of glowing toxic insects devours the circle",
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
    lightColor: '#b6ff3d',
    lightIntensity: 6,
    lightRadius: 8,
    zoneRadius: 4,
    colorA: '#b6ff3d',
    colorB: '#ffffff'
  }
};
