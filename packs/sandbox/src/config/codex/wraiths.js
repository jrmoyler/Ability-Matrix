/**
 * Wraith Host — placeholder data block (being written).
 */
export default {
  id: 'wraiths',
  meta: {
    label: "Wraith Host",
    accent: '#9fb4ff',
    key: '',
    element: 'shadow',
    hint: "Shadow — shades claw up out of the circle, circle overhead, then dive on everyone inside",
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
    lightColor: '#9fb4ff',
    lightIntensity: 6,
    lightRadius: 8,
    zoneRadius: 4,
    colorA: '#9fb4ff',
    colorB: '#ffffff'
  }
};
