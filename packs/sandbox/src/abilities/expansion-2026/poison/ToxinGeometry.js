import { BufferGeometry, CatmullRomCurve3, Float32BufferAttribute, TubeGeometry, Vector3 } from 'three';

/**
 * Toxin Evolution — authored procedural geometry.
 *
 * Everything the infection is made of is grown from a parametric surface so
 * the shaders can address it by `uv`: the membrane's veins run along `uv.x`
 * round its girth, the coils grow along their `uv.x`, the pool's stain spreads
 * along its radial `uv.y`. All of it is built once per ability instance.
 *
 *  - `toxinMembraneGeometry` the fluted capsule wrapped round the host
 *  - `toxinVesselGeometry`   the seed vessel (travel pod, and one per stage)
 *  - `toxinCoilGeometry`     one stage's coil, different per tier
 *  - `toxinSporeGeometry`    a lumpy spore bead
 *  - `toxinPoolGeometry`     the infection stain on the floor
 */

const TAU = Math.PI * 2;

function hash(n) {
  const s = Math.sin(n * 91.7 + 47.3) * 43758.5453;
  return s - Math.floor(s);
}

function finish(positions, uvs, indices) {
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
  return geometry;
}

/** A lathe-like grid: `radius(t, a)` gives the surface, `t` up, `a` round. */
function revolve(rows, cols, height, radius) {
  const positions = [], uvs = [], indices = [];
  for (let j = 0; j < rows; j++) {
    const t = j / (rows - 1);
    for (let i = 0; i < cols; i++) {
      const a = (i * TAU) / (cols - 1);
      const r = radius(t, a);
      positions.push(r * Math.cos(a), t * height, r * Math.sin(a));
      uvs.push(i / (cols - 1), t);
      if (j < rows - 1 && i < cols - 1) {
        const n = j * cols + i;
        indices.push(n, n + cols, n + 1, n + 1, n + cols, n + cols + 1);
      }
    }
  }
  return finish(positions, uvs, indices);
}

/**
 * The membrane: a fluted, asymmetric capsule 1.9 m tall wrapped round the host.
 *
 * Six longitudinal flutes (`cos 6a`) twist slowly as they climb, and a second
 * lopsided term bulges one side near the shoulders, so it reads as something
 * *grown* over the target rather than a bubble placed on it. The shader
 * raises cysts on it with voronoi as the stages advance.
 */
export function toxinMembraneGeometry() {
  return revolve(40, 41, 1.9, (t, a) => {
    const flute = 0.07 * Math.cos(a * 6 + 2 * t);
    const lopsided = 0.05 * Math.cos(a - 0.6) * Math.sin(Math.PI * Math.min(1, t * 1.3));
    return Math.sin(Math.PI * t) * (0.46 + flute + lopsided);
  });
}

/**
 * The seed vessel: a ribbed pod with a pointed crown. The profile is a
 * `sin^0.7` lens with five ribs and a slight pinch below the crown, so the
 * top reads as a beak the toxin is injected through.
 */
export function toxinVesselGeometry() {
  return revolve(29, 25, 0.9, (t, a) => {
    const lens = Math.pow(Math.sin(Math.PI * t), 0.7);
    const ribs = 0.045 * Math.cos(a * 5 + t * 4);
    const pinch = 1 - 0.18 * Math.exp(-Math.pow((t - 0.78) * 9, 2));
    return lens * (0.28 + ribs) * pinch;
  });
}

/**
 * One stage's coil: a helix wound round the host. Each tier has more turns,
 * a wider sweep and a different swelling profile, so the three coils read as
 * three generations of the same growth. `uv.x` runs along it (the shader
 * grows and tapers it along that), `uv.y` round the tube.
 */
export function toxinCoilGeometry(phase, tier) {
  const points = [];
  for (let i = 0; i <= 64; i++) {
    const t = i / 64;
    const a = phase + t * TAU * (1.75 + tier * 0.55);
    const r = 0.5 + tier * 0.07 + (0.11 + tier * 0.035) * Math.sin(t * Math.PI * (2 + tier));
    points.push(new Vector3(Math.cos(a) * r, 0.2 + t * (1.9 + tier * 0.2), Math.sin(a) * r));
  }
  return new TubeGeometry(new CatmullRomCurve3(points), 96, 0.025 + tier * 0.004, 8, false);
}

/**
 * A spore bead: an icosahedral-ish sphere grid with three hashed lumps, so
 * the swarm is not a cloud of perfect balls. Unit size 0.045 m.
 */
export function toxinSporeGeometry() {
  const lumps = [0, 1, 2].map((k) => {
    const theta = hash(k + 1) * TAU, phi = Math.acos(2 * hash(k + 7) - 1);
    return new Vector3(Math.sin(phi) * Math.cos(theta), Math.cos(phi), Math.sin(phi) * Math.sin(theta));
  });
  const positions = [], uvs = [], indices = [];
  const rows = 9, cols = 12;
  const n = new Vector3();
  for (let j = 0; j < rows; j++) {
    const v = j / (rows - 1);
    const phi = v * Math.PI;
    for (let i = 0; i <= cols; i++) {
      const u = i / cols;
      const theta = u * TAU;
      n.set(Math.sin(phi) * Math.cos(theta), Math.cos(phi), Math.sin(phi) * Math.sin(theta));
      let r = 1;
      for (const lump of lumps) r += 0.22 * Math.pow(Math.max(0, n.dot(lump)), 6);
      r *= 0.045;
      positions.push(n.x * r, n.y * r, n.z * r);
      uvs.push(u, v);
      if (j < rows - 1 && i < cols) {
        const a = j * (cols + 1) + i;
        indices.push(a, a + cols + 1, a + 1, a + 1, a + cols + 1, a + cols + 2);
      }
    }
  }
  return finish(positions, uvs, indices);
}

/**
 * The infection pool on the floor: a unit disc whose rim is lobed (seven
 * hashed lobes) so the stain never draws a perfect circle. `uv` is planar
 * (0..1 across the disc) so the shader can work in disc space; the lobes only
 * set where the mesh ends, the shader feathers inside them.
 */
export function toxinPoolGeometry(segments = 72, rings = 8) {
  const positions = [0, 0, 0], uvs = [0.5, 0.5], indices = [];
  const lobes = [];
  for (let k = 0; k < 7; k++) lobes.push({ a: hash(k + 3) * TAU, w: 0.6 + hash(k + 11) * 0.6, h: 0.06 + hash(k + 19) * 0.08 });
  for (let j = 1; j <= rings; j++) {
    const v = j / rings;
    for (let i = 0; i < segments; i++) {
      const a = (i / segments) * TAU;
      let rim = 1;
      for (const lobe of lobes) {
        const d = Math.atan2(Math.sin(a - lobe.a), Math.cos(a - lobe.a));
        rim += lobe.h * Math.exp(-(d * d) / (lobe.w * lobe.w * 0.25));
      }
      const r = v * rim;
      positions.push(Math.cos(a) * r, 0, Math.sin(a) * r);
      uvs.push(0.5 + Math.cos(a) * r * 0.5, 0.5 + Math.sin(a) * r * 0.5);
    }
  }
  for (let i = 0; i < segments; i++) indices.push(0, 1 + ((i + 1) % segments), 1 + i);
  for (let j = 1; j < rings; j++) {
    const a0 = 1 + (j - 1) * segments, a1 = 1 + j * segments;
    for (let i = 0; i < segments; i++) {
      const i1 = (i + 1) % segments;
      indices.push(a0 + i, a0 + i1, a1 + i, a0 + i1, a1 + i1, a1 + i);
    }
  }
  return finish(positions, uvs, indices);
}
