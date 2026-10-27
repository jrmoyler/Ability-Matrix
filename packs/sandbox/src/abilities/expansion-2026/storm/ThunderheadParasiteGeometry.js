import { BufferAttribute, BufferGeometry, IcosahedronGeometry, PlaneGeometry } from 'three';

/**
 * Thunderhead Parasite — procedural geometry.
 *
 *  - **the thunderhead** — a cumulus built the way a cloud is: out of lobes.
 *    Eleven lumpy spheres are placed in a cluster that is wide and flat at the
 *    bottom and heaped at the top, with a sheared anvil shelf leaning off one
 *    side. Every lobe is roughened by a smooth hash field, the underside is
 *    pressed flat (a real thunderhead has a level base where the air reaches
 *    its dew point), and the lobes are merged into one geometry so the cloud
 *    draws in a single call. Each vertex carries `aLobe` (a per-lobe seed for
 *    the shader's billow phase) and `aHeight` (0 at the base, 1 at the crown)
 *    so the shader can light the crown and darken the belly without knowing
 *    the cluster's layout.
 *  - **strand ribbons** — the tether bolts and the retaliation strike. A strip
 *    of `points − 1` quads with a `uv` (x along, y across); vertices are
 *    written in world space by the ability.
 *  - **ground quad / warp quad** — flat units placed and sized by their
 *    shaders.
 */

function hash3(x, y, z) {
  const s = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453;
  return s - Math.floor(s);
}

/** Smooth 3D value noise in 0..1 — construction time only. */
function valueNoise(x, y, z) {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const zi = Math.floor(z);
  const xf = x - xi;
  const yf = y - yi;
  const zf = z - zi;
  const u = xf * xf * (3 - 2 * xf);
  const v = yf * yf * (3 - 2 * yf);
  const w = zf * zf * (3 - 2 * zf);
  let sum = 0;
  for (let k = 0; k < 2; k++)
    for (let j = 0; j < 2; j++)
      for (let i = 0; i < 2; i++) {
        const weight = (i ? u : 1 - u) * (j ? v : 1 - v) * (k ? w : 1 - w);
        sum += weight * hash3(xi + i, yi + j, zi + k);
      }
  return sum;
}

/**
 * Lobes: [x, y, z, radius]. Unit cloud ≈ 2.4 wide, 1 tall, base at y = −0.35.
 * The last two are the anvil — flatter, pushed out and up to one side.
 */
const LOBES = [
  [0.0, 0.05, 0.0, 0.62],
  [0.55, -0.05, 0.18, 0.48],
  [-0.58, -0.02, -0.1, 0.5],
  [0.15, 0.0, -0.55, 0.44],
  [-0.2, -0.04, 0.55, 0.46],
  [0.3, 0.35, 0.1, 0.42],
  [-0.25, 0.32, -0.15, 0.4],
  [0.02, 0.55, 0.0, 0.33],
  [0.92, 0.02, -0.3, 0.32],
  [0.75, 0.62, -0.2, 0.3],
  [1.05, 0.66, -0.05, 0.24]
];

const BASE_Y = -0.35;
const TOP_Y = 0.95;

export function createCloudGeometry(detail = 3) {
  const positions = [];
  const normals = [];
  const lobes = [];
  const heights = [];
  for (let l = 0; l < LOBES.length; l++) {
    const [cx, cy, cz, r] = LOBES[l];
    const anvil = l >= LOBES.length - 2;
    const sx = anvil ? 1.5 : 1;
    const sy = anvil ? 0.45 : 0.9;
    const sz = anvil ? 1.2 : 1;
    const lobe = new IcosahedronGeometry(1, detail);
    const p = lobe.attributes.position;
    const seed = hash3(l, l * 1.7, 3.3);
    for (let i = 0; i < p.count; i++) {
      const ux = p.getX(i);
      const uy = p.getY(i);
      const uz = p.getZ(i);
      // Cauliflower: two octaves of smooth noise, so the surface boils in
      // rounded bumps rather than spikes.
      const n = valueNoise(ux * 2.3 + l * 3.1, uy * 2.3, uz * 2.3) * 0.7 + valueNoise(ux * 5.1, uy * 5.1 + l, uz * 5.1) * 0.3;
      const k = r * (0.86 + n * 0.3);
      const x = cx + ux * k * sx;
      let y = cy + uy * k * sy;
      const z = cz + uz * k * sz;
      // Smooth ellipsoid normal (the bumps are left to the shader's billow,
      // so the merged lobes never shade as facets).
      let nx = ux / sx;
      let ny = uy / sy;
      let nz = uz / sz;
      // The level base: anything below the condensation line is pressed up
      // onto it, with a little sag so it is not a cut plane, and faces down.
      if (y < BASE_Y) {
        y = BASE_Y - (BASE_Y - y) * 0.12;
        nx *= 0.3;
        ny = -1;
        nz *= 0.3;
      }
      // Bulge the normal out of the cluster as a whole, not out of each lobe's
      // crease, so the crevices between lobes do not read as hard seams.
      const ox = x;
      const oy = y - 0.1;
      const oz = z;
      const ol = Math.hypot(ox, oy, oz) || 1;
      const nl = Math.hypot(nx, ny, nz) || 1;
      nx = (nx / nl) * 0.65 + (ox / ol) * 0.35;
      ny = (ny / nl) * 0.65 + (oy / ol) * 0.35;
      nz = (nz / nl) * 0.65 + (oz / ol) * 0.35;
      const bl = Math.hypot(nx, ny, nz) || 1;
      positions.push(x, y, z);
      normals.push(nx / bl, ny / bl, nz / bl);
      lobes.push(seed);
      heights.push(Math.min(1, Math.max(0, (y - BASE_Y) / (TOP_Y - BASE_Y))));
    }
    lobe.dispose();
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new BufferAttribute(new Float32Array(positions), 3));
  geometry.setAttribute('normal', new BufferAttribute(new Float32Array(normals), 3));
  geometry.setAttribute('aLobe', new BufferAttribute(new Float32Array(lobes), 1));
  geometry.setAttribute('aHeight', new BufferAttribute(new Float32Array(heights), 1));
  geometry.computeBoundingSphere();
  return geometry;
}

/** World-space strip of `points − 1` quads; the ability writes its vertices. */
export function createStrandGeometry(points = 12) {
  const geometry = new BufferGeometry();
  const p = new Float32Array(points * 2 * 3);
  const uv = new Float32Array(points * 2 * 2);
  const index = [];
  for (let i = 0; i < points; i++) {
    uv.set([i / (points - 1), 0, i / (points - 1), 1], i * 4);
    if (i < points - 1) {
      const j = i * 2;
      index.push(j, j + 1, j + 2, j + 1, j + 3, j + 2);
    }
  }
  geometry.setAttribute('position', new BufferAttribute(p, 3));
  geometry.setAttribute('uv', new BufferAttribute(uv, 2));
  geometry.setIndex(index);
  return geometry;
}

/** A flat unit quad on the floor (XZ), centred. */
export function createGroundQuad() {
  const geometry = new PlaneGeometry(2, 2, 1, 1);
  geometry.rotateX(-Math.PI / 2);
  return geometry;
}

/** The warp billboard. */
export function createWarpQuad() {
  return new PlaneGeometry(1, 1, 1, 1);
}
