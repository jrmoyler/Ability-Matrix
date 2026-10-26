const TAU = Math.PI * 2;

/** Render the same collision centres used by the worldshape simulation. */
export function buildWorldshapeVariant(v, g, data, spec) {
  if (!spec?.style) return false;
  const { style, radius } = spec;
  const at = (name, mat, x, y, z, sx, sy, sz) => v.mesh(name, mat, g, x, y, z, sx, sy, sz);
  const ring = (mat, size, y) => v.ring(g, mat, size, y);
  const centers = data.ridges.map((r) => [r.x - data.position[0], r.z - data.position[2], r.r]);
  if (style === 'scorched') {
    ring('fire', radius * 0.96, 0.06);
    ring('iron', radius * 0.76, 0.04);
    for (const [x, z, r] of centers) {
      at('ridge', 'rock', x, 0.8, z, r * 0.8, 0.67, r * 0.8);
      at('shard', 'fire', x, 1.15, z, r * 0.35, 0.7, r * 0.35);
    }
    for (let i = 0; i < 18; i++) {
      const a = i * TAU / 18, d = radius * (0.35 + (i % 3) * 0.2);
      const crack = at('box', i % 3 ? 'fire' : 'bronze', Math.sin(a) * d, 0.04, Math.cos(a) * d, 0.06, 0.035, 0.9);
      crack.rotation.y = a + 0.4;
    }
  } else if (style === 'glacier') {
    // Match the cone used by the worldshape height query, so feet meet visible ice.
    const ramp = v.geo.ramp.parameters;
    const surface = at('ramp', 'ice', 0, spec.height / 2, 0,
      radius / ramp.radius, spec.height / ramp.height, radius / ramp.radius);
    surface.name = 'glacier-surface';
    ring('ice', radius * 0.98, 0.09);
    ring('steel', radius * 0.65, 0.12);
    for (const [x, z, r] of centers) {
      at('shard', 'ice', x, 1.05, z, r, 1.25, r);
      for (let k = 0; k < 4; k++) {
        const a = k * TAU / 4;
        const shard = at('shard', 'ice', x + Math.sin(a) * r * 0.45, 0.45, z + Math.cos(a) * r * 0.45, 0.18, 0.65, 0.18);
        shard.rotation.z = Math.sin(a) * 0.35;
        shard.rotation.x = Math.cos(a) * 0.35;
      }
    }
    for (let i = 0; i < 8; i++) {
      const a = i * TAU / 8, bar = at('box', 'ice', Math.sin(a) * 1.5, 0.08, Math.cos(a) * 1.5, 0.06, 0.05, 2.2);
      bar.rotation.y = a;
    }
  } else if (style === 'stormground') {
    ring('storm', radius * 0.95, 0.07);
    for (const [x, z, r] of centers) {
      at('base', 'iron', x, 0.1, z, r, 0.7, r);
      at('shaft', 'steel', x, 1.1, z, 0.7, 2, 0.7);
      at('shard', 'storm', x, 2.2, z, 0.22, 0.65, 0.22);
      for (let k = 0; k < 3; k++) ring('storm', 0.3 + k * 0.17, 0.2 + k * 0.15).position.set(x, 0.2 + k * 0.15, z);
    }
    for (let i = 0; i < 12; i++) {
      const a = i * TAU / 12, bolt = at('box', 'storm', Math.sin(a) * 2.1, 0.07, Math.cos(a) * 2.1, 0.08, 0.05, 2.3);
      bolt.rotation.y = a;
    }
  } else if (style === 'floodplain') {
    for (let i = 0; i < 5; i++) ring(i % 2 ? 'steel' : 'water', radius * (0.25 + i * 0.17), 0.06 + i * 0.015);
    for (let i = 0; i < 20; i++) {
      const a = i * TAU / 20, d = radius * (0.35 + (i % 4) * 0.15);
      const wave = at('shard', 'water', Math.sin(a) * d, 0.14 + (i % 2) * 0.1, Math.cos(a) * d, 0.12, 0.07, 0.45);
      wave.rotation.y = a + Math.PI / 2;
    }
  } else if (style === 'glass') {
    ring('ice', radius * 0.96, 0.08);
    ring('gold', radius * 0.74, 0.06);
    for (const [x, z, r] of centers) {
      at('shard', 'ice', x, 1.2, z, r * 0.8, 1.6, r * 0.8);
      for (let k = 0; k < 3; k++) {
        const a = k * TAU / 3;
        const shard = at('shard', 'storm', x + Math.sin(a) * r * 0.45, 0.65, z + Math.cos(a) * r * 0.45, 0.18, 0.9, 0.18);
        shard.rotation.z = Math.sin(a) * 0.3;
        shard.rotation.x = Math.cos(a) * 0.3;
      }
      ring('steel', r * 0.8, 0.12).position.set(x, 0.12, z);
    }
  }
  return true;
}
