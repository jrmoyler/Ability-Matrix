export default {
  id: 'exp-predatory-canopy',
  uid: 'matrix-expansion/predatory-canopy',
  meta: {
    label: 'Predatory Canopy', element: 'nature', accent: '#86dc62', cast: 'zone', key: '',
    hint: 'An overhead canopy watches the ground, then lashes the first target that enters its roots.',
    glyph: '<path d="M12 35Q50 0 88 35M18 35Q20 76 34 82M82 35Q80 76 66 82M50 25V72M35 50Q50 62 65 50"/>'
  },
  settings: {
    range: 18, minRange: 2, speed: 18, cooldown: 8, castAnim: 'cast2', zoneRadius: 4,
    lightColor: '#b7ff8a', lightIntensity: 5, lightRadius: 9,
    leafRate: 12, moteRate: 22, leafSize: .13, canopyHeight: 4.8, canopySpread: 4, armDelay: 0.55, triggerWindup: 0.32, thornLength: 1.5,
    lifetime: 6, fade: 1.1, hitImpulse: 5, hitLift: 2, hitSpin: 1,
    barkColor: '#365423', leafColor: '#55a837', leafRim: '#d1ff82', rootColor: '#a9eb6a'
  }
};
