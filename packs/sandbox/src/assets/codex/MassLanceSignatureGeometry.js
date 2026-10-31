import { BufferAttribute, BufferGeometry, LatheGeometry, Vector2 } from 'three';

/**
 * MassLance — the cast's own signature geometry, kept out of the generated
 * `MassLanceGeometry.js` (which is pinned byte for byte by tests/pure-rigs.test.mjs).
 */

/* ------------------------------------------------------------------ */
/* The signature: the lance and the trench it drags                    */
/* ------------------------------------------------------------------ */

/**
 * The lance: a forged eight-sided spindle, unit radius at its widest and unit
 * length along +Z (tail at z = -0.5, nose at +0.5). A heavy collar at the tail,
 * a raised band a third of the way from the nose, a long taper to a blunt
 * point. Scaled per frame to `lanceRadius` × `lanceLength`.
 */
export function createMassLanceLanceGeometry() {
  const profile = [
    [0.001, -0.5], [0.55, -0.5], [0.82, -0.47], [0.86, -0.4], [0.62, -0.36], [0.7, -0.24],
    [0.9, -0.05], [0.96, 0.08], [1.0, 0.1], [1.0, 0.16], [0.86, 0.19], [0.78, 0.28],
    [0.5, 0.4], [0.2, 0.48], [0.001, 0.5]
  ].map(([r, z]) => new Vector2(r, z));
  const geometry = new LatheGeometry(profile, 8);
  geometry.rotateX(Math.PI / 2); // lathe axis +Y → +Z, nose forward
  geometry.computeVertexNormals();
  return geometry;
}

/**
 * The trench: a strip of torn floor, unit half-width across X, unit lip
 * height, unit length along +Z (z = 0 at the start, 1 at the head). The bed
 * runs down the middle at floor level; ragged lips of thrown-up ground stand
 * either side and taper off at both ends. Scaled per frame to the trench's
 * width, lip height and the distance the lance has covered.
 *
 * Attribute `aTrench` = (0 at the bed .. 1 at a lip crest, 0..1 along).
 */
export function createMassLanceTrenchGeometry(rows = 96) {
  // Across, from the left outside edge to the right one: [x, y, crest 0..1].
  const section = [
    [-1, 0, 0.2], [-0.84, 0.55, 0.7], [-0.68, 1, 1], [-0.5, 0.4, 0.6], [-0.32, 0.03, 0.1], [0, 0.012, 0],
    [0.32, 0.03, 0.1], [0.5, 0.4, 0.6], [0.68, 1, 1], [0.84, 0.55, 0.7], [1, 0, 0.2]
  ];
  const cols = section.length;
  const count = (rows + 1) * cols;
  const positions = new Float32Array(count * 3);
  const trench = new Float32Array(count * 2);
  // Deterministic rubble: a cheap hash per row and column.
  const hash = (a, b) => {
    const x = Math.sin(a * 127.1 + b * 311.7) * 43758.5453;
    return x - Math.floor(x);
  };
  for (let j = 0; j <= rows; j++) {
    const z = j / rows;
    const ends = Math.min(1, z / 0.05) * Math.min(1, (1 - z) / 0.08);
    const taper = ends * ends * (3 - 2 * ends);
    for (let i = 0; i < cols; i++) {
      const [x, y, crest] = section[i];
      const v = j * cols + i;
      const jag = crest > 0.05 ? 0.55 + 0.9 * hash(j, i) * (0.6 + 0.4 * Math.sin(j * 0.7 + i)) : 1;
      const wob = crest > 0.05 ? (hash(j + 7, i) - 0.5) * 0.12 : 0;
      positions[v * 3] = x * (0.55 + 0.45 * taper) + wob;
      positions[v * 3 + 1] = y > 0.05 ? y * jag * taper : y;
      positions[v * 3 + 2] = z;
      trench[v * 2] = crest;
      trench[v * 2 + 1] = z;
    }
  }
  const indices = [];
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols - 1; i++) {
      const a = j * cols + i;
      const b = a + 1;
      const c = a + cols;
      const d = c + 1;
      indices.push(a, c, b, b, c, d);
    }
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new BufferAttribute(positions, 3));
  geometry.setAttribute('aTrench', new BufferAttribute(trench, 2));
  geometry.setIndex(indices);
  // Flat-shaded rubble: unindex so every facet keeps its own normal.
  const flat = geometry.toNonIndexed();
  geometry.dispose();
  flat.computeVertexNormals();
  return flat;
}

/**
 * The crush ring at the end of the line: a ragged collar of floor heaved up
 * round where the lance went in. Unit outer radius, about 0.25 tall.
 */
export function createMassLanceCollarGeometry() {
  const profile = [[0.45, 0], [0.55, 0.14], [0.68, 0.25], [0.82, 0.2], [0.95, 0.08], [1.05, 0]].map(([r, y]) => new Vector2(r, y));
  const geometry = new LatheGeometry(profile, 48);
  const pos = geometry.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    const a = Math.atan2(z, x);
    const jag = 0.5 + 0.5 * Math.sin(a * 5 + 0.3) * Math.sin(a * 11 + 1.7);
    const rough = 1 + 0.06 * Math.sin(a * 9 + 0.4);
    pos.setXYZ(i, x * rough, y * (0.4 + 1.2 * jag), z * rough);
  }
  const flat = geometry.toNonIndexed();
  geometry.dispose();
  flat.computeVertexNormals();
  return flat;
}
