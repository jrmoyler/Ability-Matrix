import { BufferAttribute, BufferGeometry, Vector3 } from 'three';

/**
 * Procedural geometry for Celestial Cartography, authored in metres.
 *
 * A star chart is instruments and light: faceted stars with a real front and
 * back, an armillary band graduated in 72 ticks, ruled tapers for the rays
 * that converge on the mark, a compass rose for the warning, a coronal ring
 * with flame spikes for the strike. The shaders read `uv` only.
 */

const TAU = Math.PI * 2;

function finish(positions, uvs, indices) {
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new BufferAttribute(new Float32Array(positions), 3));
  geometry.setAttribute('uv', new BufferAttribute(new Float32Array(uvs), 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

/**
 * A faceted radial star in the XY plane: twelve spokes alternating long and
 * short, a raised front boss (z = 0.22) and a shallower back boss, so the
 * flare has a physical silhouette from any angle rather than a flat sprite.
 */
export function starGeometry() {
  const positions = [0, 0, 0.22];
  const uvs = [0.5, 0.5];
  const indices = [];
  const spokes = 12;
  const rim = spokes * 2;
  for (let i = 0; i < rim; i++) {
    const a = (i * Math.PI) / spokes;
    const r = i % 2 ? 0.16 : i % 4 === 0 ? 0.72 : 0.43;
    positions.push(Math.cos(a) * r, Math.sin(a) * r, i % 2 ? -0.02 : 0.03);
    uvs.push(0.5 + Math.cos(a) * r * 0.5, 0.5 + Math.sin(a) * r * 0.5);
  }
  const back = positions.length / 3;
  positions.push(0, 0, -0.12);
  uvs.push(0.5, 0.5);
  for (let i = 0; i < rim; i++) {
    const a = 1 + i;
    const b = 1 + ((i + 1) % rim);
    indices.push(0, a, b);
    indices.push(back, b, a);
  }
  return finish(positions, uvs, indices);
}

/**
 * A ruled taper, unit height along +Y: thin at both ends and swollen through
 * the middle, so a convergence ray reads as a directed strike of light rather
 * than a cylinder. `uv.y` runs root → tip.
 */
export function beamGeometry() {
  const positions = [];
  const uvs = [];
  const indices = [];
  const sides = 16;
  const segments = 32;
  for (let j = 0; j <= segments; j++) {
    for (let i = 0; i <= sides; i++) {
      const t = j / segments;
      const a = (i * TAU) / sides;
      const r = 0.045 + 0.18 * Math.sin(Math.PI * t) ** 1.4;
      positions.push(Math.cos(a) * r, t, Math.sin(a) * r);
      uvs.push(i / sides, t);
      if (j < segments && i < sides) {
        const n = j * (sides + 1) + i;
        indices.push(n, n + sides + 1, n + 1, n + 1, n + sides + 1, n + sides + 2);
      }
    }
  }
  return finish(positions, uvs, indices);
}

/**
 * The warning compass on the floor (XZ, radius 1): an outer ring interrupted
 * at the eight points of the rose, and eight inward-pointing stellar ticks.
 * Scaled to the true strike radius, so what it encloses is what is hit.
 */
export function celestialTargetGeometry() {
  const positions = [];
  const uvs = [];
  const indices = [];
  const n = 64;
  for (let i = 0; i < n; i++) {
    if (i % 8 === 0) continue; // the gaps at the rose points
    const a = (i * TAU) / n;
    const b = ((i + 1) * TAU) / n;
    const base = positions.length / 3;
    for (const [r, t] of [[0.9, a], [1, a], [1, b], [0.9, b]]) {
      positions.push(Math.cos(t) * r, 0, Math.sin(t) * r);
      uvs.push(0.5 + Math.cos(t) * r * 0.5, 0.5 + Math.sin(t) * r * 0.5);
    }
    indices.push(base, base + 1, base + 2, base, base + 2, base + 3);
  }
  for (let i = 0; i < 8; i++) {
    const a = (i * TAU) / 8;
    const base = positions.length / 3;
    for (const [r, t] of [[0.62, a], [0.83, a - 0.045], [0.83, a + 0.045]]) {
      positions.push(Math.cos(t) * r, 0, Math.sin(t) * r);
      uvs.push(0.5 + Math.cos(t) * r * 0.5, 0.5 + Math.sin(t) * r * 0.5);
    }
    indices.push(base, base + 1, base + 2);
  }
  return finish(positions, uvs, indices);
}

/**
 * A stellar fragment thrown by the strike: a lozenge with a ridge on each
 * face, so it tumbles with a highlight instead of flipping flat.
 */
export function celestialShardGeometry() {
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new BufferAttribute(new Float32Array([
    0, 0.4, 0,
    -0.08, 0, 0,
    0, -0.24, 0,
    0.08, 0, 0,
    0, 0.03, 0.06, // front ridge
    0, 0.03, -0.04 // back ridge
  ]), 3));
  geometry.setAttribute('uv', new BufferAttribute(new Float32Array([0.5, 1, 0, 0.5, 0.5, 0, 1, 0.5, 0.5, 0.55, 0.5, 0.45]), 2));
  geometry.setIndex([0, 1, 4, 1, 2, 4, 2, 3, 4, 3, 0, 4, 1, 0, 5, 2, 1, 5, 3, 2, 5, 0, 3, 5]);
  geometry.computeVertexNormals();
  return geometry;
}

/**
 * The meteor's tail: a ruled taper 0..1 along +Y (scaled to the gap between
 * the falling star and the chart), widest just behind the head and drawn out
 * to a thread at the top.
 */
export function celestialMeteorTailGeometry() {
  const positions = [];
  const uvs = [];
  const indices = [];
  const rows = 33;
  const sides = 16;
  for (let j = 0; j <= rows; j++) {
    for (let i = 0; i <= sides; i++) {
      const t = j / rows;
      const a = (i * TAU) / sides;
      const r = 0.035 + 0.16 * (1 - t) * Math.sin(Math.PI * (0.2 + 0.8 * t));
      positions.push(Math.cos(a) * r, t, Math.sin(a) * r);
      uvs.push(i / sides, t);
      if (j < rows && i < sides) {
        const n = j * (sides + 1) + i;
        indices.push(n, n + sides + 1, n + 1, n + 1, n + sides + 1, n + sides + 2);
      }
    }
  }
  return finish(positions, uvs, indices);
}

/**
 * The armillary band (XZ, radius 1): a flat ring with a lip and real
 * thickness, graduated by 72 outward ticks — every sixth a long cardinal
 * tick. `uv.x` runs round; `uv.y` is 0..1 across the band and 2 on a tick.
 */
export function celestialFrameGeometry() {
  const positions = [];
  const uvs = [];
  const indices = [];
  const segments = 144;
  const inner = 0.975;
  const outer = 1.025;
  const thick = 0.012;
  // Top, bottom and outer wall of the band.
  for (const [r0, r1, y0, y1, v0, v1] of [
    [inner, outer, thick, thick, 0, 1],
    [outer, inner, -thick, -thick, 1, 0],
    [outer, outer, -thick, thick, 1, 1]
  ]) {
    const base = positions.length / 3;
    for (let i = 0; i <= segments; i++) {
      const u = i / segments;
      const a = u * TAU;
      positions.push(Math.cos(a) * r0, y0, Math.sin(a) * r0, Math.cos(a) * r1, y1, Math.sin(a) * r1);
      uvs.push(u, v0, u, v1);
    }
    for (let i = 0; i < segments; i++) {
      const a = base + i * 2;
      indices.push(a, a + 2, a + 1, a + 1, a + 2, a + 3);
    }
  }
  // Graduations.
  const ticks = 72;
  for (let k = 0; k < ticks; k++) {
    const a = (k / ticks) * TAU;
    const long = k % 6 === 0;
    const len = long ? 0.09 : 0.04;
    const w = long ? 0.006 : 0.004;
    const cx = Math.cos(a);
    const cz = Math.sin(a);
    const sx = -cz * w;
    const sz = cx * w;
    const base = positions.length / 3;
    positions.push(
      cx * outer + sx, 0, cz * outer + sz,
      cx * outer - sx, 0, cz * outer - sz,
      cx * (outer + len) - sx, 0, cz * (outer + len) - sz,
      cx * (outer + len) + sx, 0, cz * (outer + len) + sz
    );
    uvs.push(k / ticks, 2, k / ticks, 2, k / ticks, 2, k / ticks, 2);
    indices.push(base, base + 1, base + 2, base, base + 2, base + 3);
  }
  return finish(positions, uvs, indices);
}

/**
 * A grain of star dust: three crossed four-point diamonds (one per axis),
 * long on one axis and short on the others, so it sparkles from any view.
 * About 0.06 m across.
 */
export function celestialDustGeometry() {
  const positions = [];
  const uvs = [];
  const indices = [];
  const axes = [
    [[1, 0, 0], [0, 1, 0]],
    [[0, 1, 0], [0, 0, 1]],
    [[0, 0, 1], [1, 0, 0]]
  ];
  for (const [u, v] of axes) {
    const base = positions.length / 3;
    positions.push(0, 0, 0);
    uvs.push(0.5, 0.5);
    for (let k = 0; k < 8; k++) {
      const a = (k / 8) * TAU;
      const r = k % 2 ? 0.008 : k % 4 === 0 ? 0.06 : 0.03;
      const cu = Math.cos(a) * r;
      const cv = Math.sin(a) * r;
      positions.push(u[0] * cu + v[0] * cv, u[1] * cu + v[1] * cv, u[2] * cu + v[2] * cv);
      uvs.push(0.5 + Math.cos(a) * 0.5, 0.5 + Math.sin(a) * 0.5);
    }
    for (let k = 0; k < 8; k++) indices.push(base, base + 1 + k, base + 1 + ((k + 1) % 8));
  }
  return finish(positions, uvs, indices);
}

/**
 * The strike's corona (XY, radius 0.5): a thin ring with sixteen flame
 * spikes of uneven length licking outward. Three of these turn on different
 * axes round the strike point.
 */
export function celestialCoronaGeometry() {
  const positions = [];
  const uvs = [];
  const indices = [];
  const segments = 96;
  const inner = 0.48;
  const outer = 0.52;
  for (let i = 0; i <= segments; i++) {
    const u = i / segments;
    const a = u * TAU;
    positions.push(Math.cos(a) * inner, Math.sin(a) * inner, 0, Math.cos(a) * outer, Math.sin(a) * outer, 0);
    uvs.push(u, 0, u, 0.3);
  }
  for (let i = 0; i < segments; i++) {
    const a = i * 2;
    indices.push(a, a + 2, a + 1, a + 1, a + 2, a + 3);
  }
  const spikes = 16;
  for (let k = 0; k < spikes; k++) {
    const a = (k / spikes) * TAU;
    // Deterministic uneven lengths: a corona is never regular.
    const len = 0.08 + 0.12 * (0.5 + 0.5 * Math.sin(k * 2.7 + 1.3));
    const half = 0.05;
    const base = positions.length / 3;
    positions.push(
      Math.cos(a - half) * outer, Math.sin(a - half) * outer, 0,
      Math.cos(a + half) * outer, Math.sin(a + half) * outer, 0,
      Math.cos(a + half * 0.3) * (outer + len), Math.sin(a + half * 0.3) * (outer + len), 0.01
    );
    uvs.push(k / spikes, 0.3, k / spikes, 0.3, k / spikes, 1);
    indices.push(base, base + 1, base + 2);
  }
  return finish(positions, uvs, indices);
}

/**
 * One constellation link: a flat band 5 cm wide from `a` to `b` (chart
 * space, y = 0). `uv.y` runs a → b, so the link material can reveal it as if
 * drawn with a pen. Built once per link at construction.
 */
export function celestialLinkGeometry(a, b) {
  const delta = new Vector3().subVectors(b, a);
  const side = new Vector3(-delta.z, 0, delta.x).normalize().multiplyScalar(0.025);
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new BufferAttribute(new Float32Array([
    a.x - side.x, a.y, a.z - side.z,
    a.x + side.x, a.y, a.z + side.z,
    b.x - side.x, b.y, b.z - side.z,
    b.x + side.x, b.y, b.z + side.z
  ]), 3));
  geometry.setAttribute('uv', new BufferAttribute(new Float32Array([0, 0, 1, 0, 0, 1, 1, 1]), 2));
  geometry.setIndex([0, 2, 1, 1, 2, 3]);
  geometry.computeVertexNormals();
  return geometry;
}
