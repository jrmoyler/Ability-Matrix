import { BufferAttribute, BufferGeometry, Vector3 } from 'three';

/**
 * Procedural geometry for PREDATORY CANOPY.
 *
 * The cast is a carnivorous tree that grows *downward*: a crown hung in the
 * air, twelve branches reaching out from it, three leaves on each, a vine
 * dropping from each to the floor, and a ring of thorns that stabs up out of
 * the ground when something walks in. Everything here is built once, at
 * construction, and placed/scaled per frame by the ability from the live
 * settings.
 *
 * All the woody parts are one builder — `taperedTube` — swept along a
 * hand-authored centreline with a radius that tapers and swells at knots,
 * so a branch reads as grown wood rather than a pipe.
 */

const TAU = Math.PI * 2;

function build(positions, uvs, indices) {
  const g = new BufferGeometry();
  g.setAttribute('position', new BufferAttribute(new Float32Array(positions), 3));
  g.setAttribute('uv', new BufferAttribute(new Float32Array(uvs), 2));
  g.setIndex(indices);
  g.computeVertexNormals();
  return g;
}

/** Small deterministic hash, so every build of the canopy is the same tree. */
function hash(n) {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
}

/**
 * Sweep a ring of `radial` vertices along `points`, radius from `radiusAt(t)`.
 * Frames are parallel-transported from the first tangent so the tube never
 * twists, and the tip is closed to a point. `uv.x` runs round, `uv.y` along.
 */
export function taperedTube(points, radiusAt, radial = 8) {
  const p = [];
  const uv = [];
  const ix = [];
  const count = points.length;
  const tangent = new Vector3();
  const normal = new Vector3();
  const binormal = new Vector3();
  const prev = new Vector3();
  // Seed the frame from any vector not parallel to the first tangent.
  tangent.subVectors(points[1], points[0]).normalize();
  normal.set(0, 1, 0);
  if (Math.abs(tangent.dot(normal)) > 0.9) normal.set(1, 0, 0);
  binormal.crossVectors(tangent, normal).normalize();
  normal.crossVectors(binormal, tangent).normalize();
  for (let j = 0; j < count; j++) {
    const t = j / (count - 1);
    if (j > 0) {
      prev.copy(tangent);
      tangent.subVectors(points[Math.min(count - 1, j + 1)], points[Math.max(0, j - 1)]).normalize();
      // Parallel transport: rotate the frame by the change in tangent.
      binormal.crossVectors(tangent, normal).normalize();
      normal.crossVectors(binormal, tangent).normalize();
    }
    const r = j === count - 1 ? 0 : radiusAt(t);
    for (let i = 0; i <= radial; i++) {
      const a = (i / radial) * TAU;
      const ca = Math.cos(a);
      const sa = Math.sin(a);
      const c = points[j];
      p.push(c.x + (normal.x * ca + binormal.x * sa) * r, c.y + (normal.y * ca + binormal.y * sa) * r, c.z + (normal.z * ca + binormal.z * sa) * r);
      uv.push(i / radial, t);
    }
  }
  for (let j = 0; j < count - 1; j++) {
    for (let i = 0; i < radial; i++) {
      const a = j * (radial + 1) + i;
      const b = a + radial + 1;
      ix.push(a, b, a + 1, a + 1, b, b + 1);
    }
  }
  return build(p, uv, ix);
}

/** Merge several non-indexed-compatible geometries into one (construction only). */
function merge(list) {
  const p = [];
  const uv = [];
  const ix = [];
  for (const g of list) {
    const base = p.length / 3;
    p.push(...g.attributes.position.array);
    uv.push(...g.attributes.uv.array);
    for (const i of g.index.array) ix.push(base + i);
    g.dispose();
  }
  return build(p, uv, ix);
}

/**
 * Leaves are not cards: their curved, tapered surface has an independent
 * midrib and a serrated silhouette. The leaf shader bends each leaf from its
 * stem in the vertex stage. Stem at the origin, tip at +Y 1.65.
 */
export function canopyLeafGeometry() {
  const cols = 7;
  const rows = 17;
  const vertices = [];
  const uv = [];
  const indices = [];
  for (let j = 0; j < rows; j++) {
    const t = j / (rows - 1);
    const width = Math.sin(Math.PI * t) ** 0.8 * (1 - 0.12 * t);
    for (let i = 0; i < cols; i++) {
      const x = (i / (cols - 1)) * 2 - 1;
      // Teeth only at the margin: |x|^5 is ~0 everywhere but the edge.
      const serration = 1 + 0.11 * Math.sin(t * Math.PI * 12) * Math.abs(x) ** 5;
      vertices.push(x * width * 0.42 * serration, t * 1.65, Math.sin(Math.PI * t) * (1 - x * x) * 0.18);
      uv.push(i / (cols - 1), t);
      if (j < rows - 1 && i < cols - 1) {
        const n = j * cols + i;
        indices.push(n, n + cols, n + 1, n + 1, n + cols, n + cols + 1);
      }
    }
  }
  return build(vertices, uv, indices);
}

/** A curved, tapering trap thorn; a bent spine gives the lunge its silhouette. */
export function canopyThornGeometry() {
  const p = [];
  const uv = [];
  const indices = [];
  const rows = 25;
  const cols = 13;
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      const t = j / (rows - 1);
      const a = (i * TAU) / (cols - 1);
      const r = 0.13 * (1 - t) ** 1.15;
      p.push(Math.cos(a) * r + 0.25 * t * t, t, Math.sin(a) * r);
      uv.push(i / (cols - 1), t);
      if (j < rows - 1 && i < cols - 1) {
        const n = j * cols + i;
        indices.push(n, n + cols, n + 1, n + 1, n + cols, n + cols + 1);
      }
    }
  }
  return build(p, uv, indices);
}

/**
 * Normalised ribbon for a target-seeking strike vine. The strike shader bends
 * it along a quadratic from the canopy anchor to the target in the vertex
 * stage, so the CPU never rebuilds it: X is -1..1 across, Y 0..1 along.
 */
export function canopyStrikeGeometry() {
  const p = [];
  const uv = [];
  const idx = [];
  const rows = 49;
  for (let j = 0; j < rows; j++) {
    const t = j / (rows - 1);
    for (let side = 0; side < 2; side++) {
      p.push(side ? 1 : -1, t, 0);
      uv.push(side, t);
    }
    if (j < rows - 1) {
      const n = j * 2;
      idx.push(n, n + 2, n + 1, n + 1, n + 2, n + 3);
    }
  }
  return build(p, uv, idx);
}

/**
 * One limb of the canopy, reaching out from the crown at bearing `angle` and
 * drooping toward its tip, with two short forks. Local origin is the crown;
 * the ability raises it to `canopyHeight` and scales it by `canopySpread`.
 *
 * The centreline is the old twig curve (out to `radius`, sagging t²·0.85,
 * bowed sideways by `seed`), so the leaves still sit where they always did.
 */
export function canopyBranchGeometry(angle, radius, seed) {
  const main = [];
  const ca = Math.cos(angle);
  const sa = Math.sin(angle);
  const at = (t, out) => {
    const r = radius * t;
    const bend = Math.sin(t * Math.PI) * (0.25 + seed * 0.14);
    return out.set(ca * r - sa * bend, -t * t * 0.85, sa * r + ca * bend);
  };
  for (let i = 0; i <= 16; i++) main.push(at(i / 16, new Vector3()));
  // Knots: the radius swells at three hashed stations along the limb.
  const knots = [0.22 + hash(seed + angle) * 0.1, 0.48 + hash(seed * 3 + angle) * 0.1, 0.72];
  const limb = taperedTube(main, (t) => {
    let r = 0.11 * (1 - t) ** 0.9 + 0.022;
    for (const k of knots) r *= 1 + 0.35 * Math.exp(-(((t - k) * 18) ** 2));
    return r;
  }, 8);
  // Two forks leave the limb and curl down, like fingers.
  const forks = [];
  for (let f = 0; f < 2; f++) {
    const t0 = 0.45 + f * 0.25;
    const start = at(t0, new Vector3());
    const out = f ? 1 : -1;
    const pts = [];
    for (let i = 0; i <= 8; i++) {
      const s = i / 8;
      pts.push(new Vector3(
        start.x + (ca * 0.5 - sa * 0.55 * out) * s * radius * 0.3,
        start.y - s * s * 0.5,
        start.z + (sa * 0.5 + ca * 0.55 * out) * s * radius * 0.3
      ));
    }
    forks.push(taperedTube(pts, (s) => 0.045 * (1 - s) + 0.01, 6));
  }
  return merge([limb, ...forks]);
}

/**
 * A hanging vine: drops from the branch to near the floor with a lazy S, a
 * swollen node every third of the way and a hooked tip. Origin at the top,
 * hanging along -Y about 4.1 m; the ability scales Y to the live height.
 */
export function canopyVineGeometry(seed = 0) {
  const pts = [];
  for (let i = 0; i <= 24; i++) {
    const t = i / 24;
    const sway = Math.sin(t * Math.PI * 1.5 + seed) * 0.35 * Math.sin(Math.PI * t);
    // The hook: the last eighth curls back up and inward.
    const hook = Math.max(0, (t - 0.88) / 0.12);
    pts.push(new Vector3(sway + hook * hook * 0.25, -t * 4.1 + hook * hook * 0.18, Math.cos(t * 5 + seed) * 0.12 * t));
  }
  return taperedTube(pts, (t) => {
    const node = 1 + 0.6 * Math.exp(-(((((t * 3) % 1) - 0.5) * 6) ** 2));
    return (0.045 * (1 - t * 0.6)) * node;
  }, 7);
}

/**
 * The crown the canopy hangs from: three strands braided round a ring, so it
 * reads as roots knotted round a hidden trunk. In the XY plane (the ability
 * lays it flat), outer radius ≈ 0.55.
 */
export function canopyCrownGeometry() {
  const strands = [];
  const R = 0.46;
  for (let s = 0; s < 3; s++) {
    const pts = [];
    for (let i = 0; i <= 96; i++) {
      const t = i / 96;
      const a = t * TAU;
      const braid = a * 3 + (s * TAU) / 3;
      const r = R + Math.cos(braid) * 0.07;
      pts.push(new Vector3(Math.cos(a) * r, Math.sin(a) * r, Math.sin(braid) * 0.07));
    }
    // Close the loop exactly: the last point repeats the first.
    pts[pts.length - 1].copy(pts[0]);
    strands.push(taperedTube(pts, () => 0.045, 6));
  }
  return merge(strands);
}

/**
 * The seed pod that flies the line: a ribbed teardrop, point forward along +Y.
 * Eight shallow ribs; `uv.y` is the axial coordinate the bud shader glows by.
 */
export function canopyBudGeometry() {
  const rings = 24;
  const segs = 24;
  const p = [];
  const uv = [];
  const ix = [];
  for (let j = 0; j <= rings; j++) {
    const v = j / rings;
    const r = 0.22 * Math.pow(Math.sin(Math.PI * v), 0.8) * (1 - 0.35 * v);
    for (let i = 0; i <= segs; i++) {
      const a = (i / segs) * TAU;
      const rib = 1 + 0.12 * Math.pow(Math.abs(Math.cos(a * 4)), 6);
      p.push(Math.cos(a) * r * rib, (v - 0.4) * 0.6, Math.sin(a) * r * rib);
      uv.push(i / segs, v);
    }
  }
  for (let j = 0; j < rings; j++) {
    for (let i = 0; i < segs; i++) {
      const a = j * (segs + 1) + i;
      const b = a + segs + 1;
      ix.push(a, b, a + 1, a + 1, b, b + 1);
    }
  }
  return build(p, uv, ix);
}

/** A flat unit disc (radius 1) in the XY plane with polar-friendly UVs. */
export function canopyDiscGeometry(segments = 64, rings = 8) {
  const p = [0, 0, 0];
  const uv = [0.5, 0.5];
  const ix = [];
  for (let r = 1; r <= rings; r++) {
    const rad = r / rings;
    for (let i = 0; i < segments; i++) {
      const a = (i / segments) * TAU;
      p.push(Math.cos(a) * rad, Math.sin(a) * rad, 0);
      uv.push(0.5 + Math.cos(a) * rad * 0.5, 0.5 + Math.sin(a) * rad * 0.5);
    }
  }
  for (let i = 0; i < segments; i++) ix.push(0, 1 + i, 1 + ((i + 1) % segments));
  for (let r = 1; r < rings; r++) {
    const a0 = 1 + (r - 1) * segments;
    const b0 = 1 + r * segments;
    for (let i = 0; i < segments; i++) {
      const i1 = (i + 1) % segments;
      ix.push(a0 + i, b0 + i, a0 + i1, a0 + i1, b0 + i, b0 + i1);
    }
  }
  return build(p, uv, ix);
}
