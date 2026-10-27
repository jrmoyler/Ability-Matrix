import { BufferAttribute, BufferGeometry, PlaneGeometry } from 'three';

/**
 * Prism Choir — procedural geometry.
 *
 *  - **the lance** — a doubly-terminated quartz crystal: a slightly irregular
 *    hexagonal prism with a long pyramidal point and a short butt, the apex
 *    knocked off-centre so it reads as grown, not machined. Long axis is local
 *    +Y (the ability turns +Y onto the flight direction). Non-indexed, so every
 *    facet is flat; each vertex carries a barycentric (`aBary`) for the facet
 *    edge glow and a per-facet dice (`aFacet`) for the dispersion.
 *  - **a shard** — a single-terminated fragment of the same habit: five sides,
 *    a broken, tilted base and a long point.
 *  - **the trail** — two ribbons crossed along local +Z (0..1), one flat and
 *    one standing, so a trail reads from behind *and* from above. `uv.x` runs
 *    along it, `uv.y` across.
 *  - **the splinters** — 120 directions on a Fibonacci sphere with a seed each;
 *    the vertex stage throws them out from the split.
 *  - **the lightfall** — a subdivided ground plane for the caustics the
 *    crystal throws on the floor.
 *  - **the lens** — a unit billboard quad for the refraction proxy.
 */

export const SPLINTER_COUNT = 120;

function hash(n) {
  const s = Math.sin(n * 91.7 + 47.3) * 43758.5453;
  return s - Math.floor(s);
}

/**
 * Build a crystal from rings of (radius, height) and an apex/base point.
 * Every triangle is emitted with its own three vertices and barycentrics.
 */
function crystal({ sides, radii, rings, apex, base, seed }) {
  const positions = [];
  const bary = [];
  const facet = [];
  const ring = (k, i) => {
    const a = ((i % sides) / sides) * Math.PI * 2 + 0.11 * (hash(seed + i) - 0.5);
    const r = radii[k] * (0.88 + 0.24 * hash(seed * 3.1 + i * 1.7));
    return [Math.cos(a) * r, rings[k], Math.sin(a) * r];
  };
  let face = 0;
  const tri = (a, b, c) => {
    positions.push(...a, ...b, ...c);
    bary.push(1, 0, 0, 0, 1, 0, 0, 0, 1);
    const f = hash(seed * 7.3 + face++);
    facet.push(f, f, f);
  };
  // The prism body, ring to ring, two triangles per side.
  for (let k = 0; k < rings.length - 1; k++) {
    for (let i = 0; i < sides; i++) {
      const a = ring(k, i), b = ring(k, i + 1), c = ring(k + 1, i), d = ring(k + 1, i + 1);
      tri(a, c, b);
      tri(b, c, d);
    }
  }
  // Terminations: a pyramid onto the apex and one onto the base point.
  const top = rings.length - 1;
  for (let i = 0; i < sides; i++) {
    tri(ring(top, i), apex, ring(top, i + 1));
    tri(ring(0, i + 1), base, ring(0, i));
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new BufferAttribute(new Float32Array(positions), 3));
  geometry.setAttribute('aBary', new BufferAttribute(new Float32Array(bary), 3));
  geometry.setAttribute('aFacet', new BufferAttribute(new Float32Array(facet), 1));
  geometry.computeVertexNormals();
  return geometry;
}

/** The travelling lance, ~2.4 m long at scale 1, point toward +Y. */
export function createLanceGeometry() {
  return crystal({
    sides: 6,
    // A waist slightly forward of centre: the point is the long end.
    radii: [0.34, 0.42, 0.4, 0.3],
    rings: [-0.62, -0.1, 0.42, 0.78],
    apex: [0.05, 1.3, -0.03],
    base: [-0.02, -1.1, 0.02],
    seed: 1.3
  });
}

/** One split shard: five-sided, single point, broken base. */
export function createShardGeometry() {
  return crystal({
    sides: 5,
    radii: [0.36, 0.33, 0.24],
    rings: [-0.55, 0.1, 0.62],
    apex: [0.03, 1.25, 0.04],
    base: [0.08, -0.72, -0.05],
    seed: 4.9
  });
}

/** Crossed ribbon along local +Z, `segments` slices along it. */
export function createTrailGeometry(segments = 24) {
  const positions = [];
  const uvs = [];
  const index = [];
  for (let plane = 0; plane < 2; plane++) {
    const offset = positions.length / 3;
    for (let i = 0; i <= segments; i++) {
      const u = i / segments;
      for (let j = 0; j < 2; j++) {
        const s = j ? 0.5 : -0.5;
        // Plane 0 lies flat (across = X), plane 1 stands (across = Y).
        positions.push(plane ? 0 : s, plane ? s : 0, u);
        uvs.push(u, j);
      }
      if (i < segments) {
        const n = offset + i * 2;
        index.push(n, n + 1, n + 2, n + 1, n + 3, n + 2);
      }
    }
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new BufferAttribute(new Float32Array(positions), 3));
  geometry.setAttribute('uv', new BufferAttribute(new Float32Array(uvs), 2));
  geometry.setIndex(index);
  return geometry;
}

/** 120 unit directions on a Fibonacci sphere, each with a 0..1 seed. */
export function createSplinterGeometry() {
  const positions = new Float32Array(SPLINTER_COUNT * 3);
  const seeds = new Float32Array(SPLINTER_COUNT);
  for (let i = 0; i < SPLINTER_COUNT; i++) {
    const a = i * 2.399963;
    const y = 1 - (2 * (i + 0.5)) / SPLINTER_COUNT;
    const r = Math.sqrt(1 - y * y);
    positions[i * 3] = Math.cos(a) * r;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = Math.sin(a) * r;
    seeds[i] = (i * 0.618034) % 1;
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new BufferAttribute(positions, 3));
  geometry.setAttribute('seed', new BufferAttribute(seeds, 1));
  return geometry;
}

/** Unit ground plane in XZ (Y up), subdivided so the floor caustics stay smooth. */
export function createLightfallGeometry() {
  const geometry = new PlaneGeometry(1, 1, 8, 8);
  geometry.rotateX(-Math.PI / 2);
  return geometry;
}

/** Unit quad in XY for view-space billboards. */
export function createLensGeometry() {
  return new PlaneGeometry(1, 1, 1, 1);
}
