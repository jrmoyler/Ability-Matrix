import { BufferGeometry, ExtrudeGeometry, Float32BufferAttribute, Path, PlaneGeometry, Shape } from 'three';

/**
 * Mirage Procession — procedural geometry.
 *
 *  - **the mask** — a theatrical half-face: an extruded outline with two cut
 *    eye apertures, then *sculpted*: wrapped round a cylinder so it has a
 *    face's curvature, with a nose ridge, a brow ridge and cheek swells
 *    raised out of it. `maskRelief(x, y)` is the one surface function, so the
 *    engraving can be laid exactly on it.
 *  - **the engraving** — crown, brow, cheek spirals, tear lines and mouth,
 *    as line segments on the sculpted surface; `aT` runs along each stroke
 *    so the shader can run glints down them.
 *  - **the veil** — a ribbon grid hung from the crown, `uv.y` 0 at the mask,
 *    1 at the trailing hem; the vertex stage flutters it.
 *  - **the mirror shard** — an irregular bevelled kite with a real thickness
 *    and rim, so it flashes edge-on as it turns.
 *  - **the glitter** — a fixed seed cloud placed entirely in the shader.
 */

/** The sculpted surface offset (local z) of the mask at (x, y). */
export function maskRelief(x, y) {
  const wrap = -0.36 * x * x - 0.1 * y * y; // a face's curvature
  const nose = 0.07 * Math.exp(-(x * x) / 0.0035) * smoothWindow(y, -0.18, 0.34);
  const brow = 0.035 * Math.exp(-((y - 0.3) * (y - 0.3)) / 0.003) * smoothWindow(Math.abs(x), -1, 0.42);
  const cheek = 0.03 * (Math.exp(-((Math.abs(x) - 0.26) ** 2 + (y + 0.02) ** 2) / 0.012));
  return wrap + nose + brow + cheek;
}

/** 1 inside [a, b], easing to 0 over 6 cm at either end. */
function smoothWindow(v, a, b) {
  const t0 = Math.min(1, Math.max(0, (v - a) / 0.06));
  const t1 = Math.min(1, Math.max(0, (b - v) / 0.06));
  return t0 * t0 * (3 - 2 * t0) * t1 * t1 * (3 - 2 * t1);
}

/** The sculpted mask, facing +Z, roughly 1 × 1.5 m before scaling. */
export function createMaskGeometry() {
  const s = new Shape();
  s.moveTo(-0.5, 0.58);
  s.quadraticCurveTo(0, 0.84, 0.5, 0.58);
  s.lineTo(0.4, -0.25);
  s.quadraticCurveTo(0, -0.8, -0.4, -0.25);
  s.closePath();
  for (const sign of [-1, 1]) {
    const hole = new Path();
    hole.moveTo(sign * 0.11, 0.21);
    hole.lineTo(sign * 0.34, 0.24);
    hole.lineTo(sign * 0.25, 0.1);
    hole.closePath();
    s.holes.push(hole);
  }
  const g = new ExtrudeGeometry(s, {
    depth: 0.07,
    bevelEnabled: true,
    bevelSegments: 3,
    bevelThickness: 0.035,
    bevelSize: 0.035,
    curveSegments: 24,
  });
  // Sculpt: every vertex is pushed along z by the relief, so both faces and
  // the bevel follow the same curved surface.
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i);
    p.setZ(i, p.getZ(i) + maskRelief(x, y));
  }
  p.needsUpdate = true;
  g.computeVertexNormals();
  g.computeBoundingSphere();
  return g;
}

/** Filigree laid on the sculpted front face. */
export function createEngravingGeometry() {
  const paths = [
    // crown
    [[-0.4, 0.53], [-0.25, 0.61], [0, 0.66], [0.25, 0.61], [0.4, 0.53]],
    // jaw
    [[-0.4, 0.3], [-0.34, 0.04], [-0.22, -0.25], [0, -0.48], [0.22, -0.25], [0.34, 0.04], [0.4, 0.3]],
    // mouth
    [[-0.2, -0.24], [-0.1, -0.29], [0, -0.31], [0.1, -0.29], [0.2, -0.24]],
    // brow
    [[-0.25, 0.39], [-0.12, 0.46], [0, 0.49], [0.12, 0.46], [0.25, 0.39]],
    // tear lines under each eye
    [[-0.24, 0.06], [-0.25, -0.04], [-0.23, -0.14]],
    [[0.24, 0.06], [0.25, -0.04], [0.23, -0.14]],
  ];
  // Cheek spirals: two turns of an Archimedean spiral on each cheek.
  for (const sign of [-1, 1]) {
    const spiral = [];
    for (let i = 0; i <= 24; i++) {
      const t = i / 24;
      const a = t * Math.PI * 4 * sign;
      const r = 0.012 + t * 0.06;
      spiral.push([sign * 0.3 + Math.cos(a) * r, -0.06 + Math.sin(a) * r]);
    }
    paths.push(spiral);
  }
  const position = [];
  const along = [];
  const FRONT = 0.07 + 0.035 + 0.008; // depth + bevel + a hair proud
  for (const path of paths) {
    for (let i = 1; i < path.length; i++) {
      const [ax, ay] = path[i - 1];
      const [bx, by] = path[i];
      position.push(ax, ay, FRONT + maskRelief(ax, ay), bx, by, FRONT + maskRelief(bx, by));
      along.push((i - 1) / (path.length - 1), i / (path.length - 1));
    }
  }
  const g = new BufferGeometry();
  g.setAttribute('position', new Float32BufferAttribute(position, 3));
  g.setAttribute('aT', new Float32BufferAttribute(along, 1));
  g.computeBoundingSphere();
  return g;
}

/**
 * A ribbon grid: x across (−½..½), hanging from y = 0 down a unit length
 * along +Z; the shader flutters, droops and scales it.
 */
export function createVeilGeometry({ across = 6, along = 18 } = {}) {
  const position = [];
  const uv = [];
  const index = [];
  for (let j = 0; j <= along; j++) {
    const v = j / along;
    for (let i = 0; i <= across; i++) {
      const u = i / across;
      position.push(u - 0.5, 0, v);
      uv.push(u, v);
    }
  }
  const row = across + 1;
  for (let j = 0; j < along; j++) {
    for (let i = 0; i < across; i++) {
      const a = j * row + i, b = a + 1, c = a + row, d = c + 1;
      index.push(a, c, b, b, c, d);
    }
  }
  const g = new BufferGeometry();
  g.setIndex(index);
  g.setAttribute('position', new Float32BufferAttribute(position, 3));
  g.setAttribute('uv', new Float32BufferAttribute(uv, 2));
  g.computeVertexNormals();
  g.computeBoundingSphere();
  return g;
}

/** Irregular bevelled mirror shard with a real rim. Points up +Y. */
export function createShardGeometry() {
  // Outline in XY, front face at +h, back at −h, rim joining them.
  const outline = [[0, 0.9], [-0.22, 0.32], [-0.34, -0.05], [-0.1, -0.8], [0.12, -0.62], [0.34, 0.06], [0.2, 0.42]];
  const h = 0.06;
  const position = [];
  const tri = (a, b, c) => position.push(...a, ...b, ...c);
  const n = outline.length;
  const cf = [0, 0.04, h * 1.6]; // front centre, slightly proud: a shallow facet
  const cb = [0, 0.04, -h * 1.6];
  for (let i = 0; i < n; i++) {
    const [ax, ay] = outline[i];
    const [bx, by] = outline[(i + 1) % n];
    tri(cf, [ax, ay, h], [bx, by, h]);
    tri(cb, [bx, by, -h], [ax, ay, -h]);
    tri([ax, ay, -h], [bx, by, -h], [ax, ay, h]);
    tri([ax, ay, h], [bx, by, -h], [bx, by, h]);
  }
  const g = new BufferGeometry();
  g.setAttribute('position', new Float32BufferAttribute(position, 3));
  g.computeVertexNormals();
  return g;
}

/** `count` seeds for the GPU glitter. Positions are placeholders. */
export function createGlitterGeometry(count) {
  const position = new Float32Array(count * 3);
  const seed = new Float32Array(count * 4);
  let h = 0x2545f491;
  const rand = () => {
    h ^= h << 13; h ^= h >>> 17; h ^= h << 5;
    return ((h >>> 0) % 100000) / 100000;
  };
  for (let i = 0; i < count; i++) {
    // Lanes are dealt round-robin so every lane always holds the same count.
    seed[i * 4 + 0] = (i % 3) - 1;
    seed[i * 4 + 1] = rand();
    seed[i * 4 + 2] = rand();
    seed[i * 4 + 3] = Math.floor(i / 3) / Math.ceil(count / 3);
  }
  const g = new BufferGeometry();
  g.setAttribute('position', new Float32BufferAttribute(position, 3));
  g.setAttribute('aSeed', new Float32BufferAttribute(seed, 4));
  return g;
}

/** Unit quad. */
export function createQuad() {
  return new PlaneGeometry(1, 1);
}
