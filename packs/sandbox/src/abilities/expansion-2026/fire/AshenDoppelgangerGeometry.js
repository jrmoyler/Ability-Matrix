import { BufferAttribute, BufferGeometry, LatheGeometry, PlaneGeometry, Vector2 } from 'three';

/**
 * Ashen Doppelganger — procedural geometry.
 *
 * Everything here is built once per pooled instance and never reallocated:
 *
 *  - **the fallback figure** (`createTorsoGeometry`, `createHeadGeometry`,
 *    `createLimbGeometry`) — only drawn until the host hands the cast the
 *    caster's rig, after which the echo is a skinned clone of the caster
 *    itself. A plain capsule would read as a placeholder, so the figure is
 *    profiled like a body — pelvis, waist, ribcage, shoulders, neck; a
 *    cranium over a jaw; limbs that swell at the muscle and pinch at the joint
 *    — flattened front-to-back, and then *eroded*: every vertex is pushed in
 *    by a deterministic value noise so the surface reads as a crust of ash
 *    with flakes missing, not as a smooth mannequin.
 *  - **the ember column** (`createEmberColumnGeometry`) — points baked on a
 *    golden-angle spiral around the body with a per-point seed. The shader
 *    lifts and recycles them; the CPU never touches them again.
 *  - **the fuse** (`createFuseGeometry`) — a fixed-capacity ribbon the ability
 *    rewrites in place each frame along the recorded path from the echo to the
 *    caster; unused points collapse onto the last one and the draw range trims
 *    them.
 *  - **the ground quad** and **the haze quad** — flat parameter quads for the
 *    sigil and the distortion billboard (the haze quad is anchored at its
 *    bottom edge so it stands on the floor).
 */

/** Points the fuse ribbon can hold. */
export const FUSE_POINTS = 48;
/** Baked points in the ember column. */
export const EMBER_POINTS = 96;

/* -------------------------------------------------------------------- */
/* Deterministic value noise for the erosion                            */
/* -------------------------------------------------------------------- */

function hash3(x, y, z) {
  const h = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453;
  return h - Math.floor(h);
}

function valueNoise(x, y, z) {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const iz = Math.floor(z);
  const fx = x - ix;
  const fy = y - iy;
  const fz = z - iz;
  // Smoothstep weights so the crust has no grid creases.
  const ux = fx * fx * (3 - 2 * fx);
  const uy = fy * fy * (3 - 2 * fy);
  const uz = fz * fz * (3 - 2 * fz);
  let v = 0;
  for (let k = 0; k < 2; k++) {
    for (let j = 0; j < 2; j++) {
      for (let i = 0; i < 2; i++) {
        const w = (i ? ux : 1 - ux) * (j ? uy : 1 - uy) * (k ? uz : 1 - uz);
        v += w * hash3(ix + i, iy + j, iz + k);
      }
    }
  }
  return v;
}

/**
 * Flatten a lathe front-to-back and erode it.
 *
 * @param {BufferGeometry} geometry built round +Y
 * @param {number} depth   z scale (a body is deeper than it is wide only at the head)
 * @param {number} erosion metres the deepest flake bites in
 * @param {number} seed    keeps the torso, head and limbs from sharing one crust
 */
function erode(geometry, depth, erosion, seed) {
  const pos = geometry.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i) * depth;
    const r = Math.hypot(x, z);
    if (r < 1e-4) {
      pos.setXYZ(i, x, y, z);
      continue;
    }
    // Two octaves; the high one is sharpened so flakes have edges.
    const n1 = valueNoise(x * 7 + seed, y * 7, z * 7);
    const n2 = valueNoise(x * 19, y * 19 + seed, z * 19);
    const flake = Math.pow(Math.max(0, n2 - 0.55) / 0.45, 1.5);
    const k = 1 - erosion * (0.45 * n1 + 0.9 * flake) / Math.max(r, 0.05);
    pos.setXYZ(i, x * k, y, z * k);
  }
  pos.needsUpdate = true;
  geometry.computeVertexNormals();
  return geometry;
}

/* -------------------------------------------------------------------- */
/* The fallback figure                                                  */
/* -------------------------------------------------------------------- */

/** Pelvis to neck, 1.3 m, standing on y = 0 of its own frame. */
export function createTorsoGeometry() {
  const profile = [
    [0.02, 0.0],
    [0.17, 0.02], // the crotch, closed
    [0.25, 0.12], // hips
    [0.26, 0.24],
    [0.2, 0.42], // waist
    [0.22, 0.56],
    [0.28, 0.74], // ribcage
    [0.33, 0.92],
    [0.37, 1.02], // shoulders
    [0.33, 1.1],
    [0.18, 1.16],
    [0.09, 1.2], // neck
    [0.08, 1.28],
    [0.02, 1.3]
  ].map(([r, y]) => new Vector2(r, y));
  return erode(new LatheGeometry(profile, 28), 0.62, 0.022, 3.1);
}

/** Cranium over a narrower jaw, 0.46 m. */
export function createHeadGeometry() {
  const profile = [
    [0.01, 0.0],
    [0.09, 0.02], // chin
    [0.13, 0.08], // jaw
    [0.15, 0.17],
    [0.18, 0.26], // cheekbones
    [0.19, 0.33],
    [0.17, 0.4], // brow
    [0.11, 0.45],
    [0.01, 0.46]
  ].map(([r, y]) => new Vector2(r, y));
  return erode(new LatheGeometry(profile, 20), 0.88, 0.016, 7.7);
}

/** One limb, root at y = 0 hanging to y = 0.82 (pivots flip it down). */
export function createLimbGeometry() {
  const profile = [
    [0.02, 0.0],
    [0.1, 0.02], // the joint into the body
    [0.15, 0.1], // the big muscle
    [0.14, 0.26],
    [0.09, 0.4], // knee / elbow pinch
    [0.1, 0.46],
    [0.11, 0.56], // calf / forearm
    [0.07, 0.74],
    [0.05, 0.8], // ankle / wrist
    [0.01, 0.82]
  ].map(([r, y]) => new Vector2(r, y));
  return erode(new LatheGeometry(profile, 14), 0.85, 0.014, 12.4);
}

/* -------------------------------------------------------------------- */
/* The ember column                                                     */
/* -------------------------------------------------------------------- */

/**
 * Golden-angle spiral round the body. `position.y` is the spawn height inside
 * the column (0..1, scaled by the shader), `aSeed` drives speed, size, colour.
 */
export function createEmberColumnGeometry(count = EMBER_POINTS) {
  const geometry = new BufferGeometry();
  const positions = new Float32Array(count * 3);
  const seeds = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    const a = i * 2.399963;
    const r = 0.16 + (i % 9) * 0.06 + hash3(i, 1, 2) * 0.12;
    positions[i * 3] = Math.sin(a) * r;
    positions[i * 3 + 1] = hash3(i, 7, 3);
    positions[i * 3 + 2] = Math.cos(a) * r;
    seeds[i] = hash3(i, 11, 5);
  }
  geometry.setAttribute('position', new BufferAttribute(positions, 3));
  geometry.setAttribute('aSeed', new BufferAttribute(seeds, 1));
  return geometry;
}

/* -------------------------------------------------------------------- */
/* The fuse                                                             */
/* -------------------------------------------------------------------- */

/**
 * A two-vertex-wide strip of `FUSE_POINTS` stations. `uv.x` runs 0 at the echo
 * to 1 at the caster, `uv.y` 0..1 across.
 */
export function createFuseGeometry() {
  const geometry = new BufferGeometry();
  const positions = new Float32Array(FUSE_POINTS * 2 * 3);
  const uvs = new Float32Array(FUSE_POINTS * 2 * 2);
  const index = new Uint16Array((FUSE_POINTS - 1) * 6);
  for (let i = 0; i < FUSE_POINTS; i++) {
    const u = i / (FUSE_POINTS - 1);
    uvs.set([u, 0, u, 1], i * 4);
    if (i < FUSE_POINTS - 1) {
      const j = i * 2;
      index.set([j, j + 1, j + 2, j + 1, j + 3, j + 2], i * 6);
    }
  }
  geometry.setAttribute('position', new BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new BufferAttribute(uvs, 2));
  geometry.setIndex(new BufferAttribute(index, 1));
  return geometry;
}

/* -------------------------------------------------------------------- */
/* Quads                                                                */
/* -------------------------------------------------------------------- */

/** Unit ground quad, rotated flat by the mesh. */
export function createGroundQuad() {
  return new PlaneGeometry(1, 1);
}

/** Unit billboard quad standing on its bottom edge (y 0..1). */
export function createHazeQuad() {
  return new PlaneGeometry(1, 1).translate(0, 0.5, 0);
}
