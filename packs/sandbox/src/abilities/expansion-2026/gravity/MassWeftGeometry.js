import { BufferAttribute, BufferGeometry } from 'three';

/**
 * Procedural geometry for MASS WEFT.
 *
 * Every builder here produces a mesh in *normalised corridor space*: the
 * ability scales it per frame from the live settings, so none of the metres
 * are baked and every slider can reshape a corridor already standing. The
 * builders run once, at construction — never per frame.
 *
 * The cast is a loom. A shuttle (the core) runs down the line laying a gravity
 * weft behind it; the weft is the ribbon on the floor, two helical filaments
 * twisting round it, and a row of bead rings that the filaments thread
 * through. Each accepted pulse sends compression rings down the corridor and a
 * contact rosette under every body it struck (`GravityContacts`).
 */

const TAU = Math.PI * 2;

/** Pack plain arrays into an indexed BufferGeometry. Construction only. */
function build(positions, uvs, indices, normals = null) {
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new BufferAttribute(new Float32Array(positions), 3));
  geometry.setAttribute('uv', new BufferAttribute(new Float32Array(uvs), 2));
  if (normals) geometry.setAttribute('normal', new BufferAttribute(new Float32Array(normals), 3));
  geometry.setIndex(indices);
  if (!normals) geometry.computeVertexNormals();
  return geometry;
}

/** Quad-strip indices for a `rows × cols` vertex grid. */
function gridIndices(rows, cols, out) {
  for (let j = 0; j < rows - 1; j++) {
    for (let i = 0; i < cols - 1; i++) {
      const n = j * cols + i;
      out.push(n, n + cols, n + 1, n + 1, n + cols, n + cols + 1);
    }
  }
  return out;
}

/**
 * The weft ribbon: a long, narrow sheet whose edges fold up into a shallow
 * trough. Local +Y is the cast axis (0 at the caster, 1 at the aim point) and
 * X spans -0.5..0.5 across the corridor. The ability lays it flat
 * (`rotation.x = π/2`) and scales X by the corridor width, Y by its length.
 *
 * The fold is quadratic in X so the trough reads as mass pressing the floor
 * down along the spine, and the field shader's vertex stage ripples it.
 */
export function gravityRibbonGeometry() {
  const rows = 65;
  const cols = 9;
  const p = [];
  const uv = [];
  const ix = [];
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      const t = j / (rows - 1);
      const u = (i / (cols - 1)) * 2 - 1;
      p.push(u * 0.5, t, u * u * 0.1);
      uv.push(i / (cols - 1), t);
    }
  }
  gridIndices(rows, cols, ix);
  return build(p, uv, ix);
}

/**
 * Two helical filaments in normalised corridor coordinates: a thin tube wound
 * four full turns round the corridor axis (local Z, 0..1). The ability draws
 * two copies half a turn apart and counter-rotates them, so the pair reads as
 * the twist of a single thread being spun.
 */
export function gravityFilamentGeometry() {
  const rows = 97;
  const cols = 7;
  const p = [];
  const uv = [];
  const ix = [];
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      const t = j / (rows - 1);
      const phase = t * Math.PI * 8;
      const side = (i / (cols - 1)) * TAU;
      const r = 0.31 + 0.018 * Math.cos(side);
      p.push(Math.cos(phase) * r, Math.sin(phase) * r + 0.018 * Math.sin(side), t);
      uv.push(i / (cols - 1), t);
    }
  }
  gridIndices(rows, cols, ix);
  return build(p, uv, ix);
}

/**
 * A faceted compression ring in the plane of the corridor cross-section: a
 * unit-radius loop with a six-sided profile, so it catches light as a hard
 * band rather than a soft torus.
 */
export function compressionRingGeometry() {
  const sides = 72;
  const profile = 6;
  const p = [];
  const uv = [];
  const ix = [];
  for (let i = 0; i <= sides; i++) {
    for (let j = 0; j <= profile; j++) {
      const a = (i * TAU) / sides;
      const b = (j * TAU) / profile;
      const r = 0.5 + 0.025 * Math.cos(b);
      p.push(Math.cos(a) * r, Math.sin(a) * r, 0.025 * Math.sin(b));
      uv.push(i / sides, j / profile);
    }
  }
  for (let i = 0; i < sides; i++) {
    for (let j = 0; j < profile; j++) {
      const n = i * (profile + 1) + j;
      ix.push(n, n + profile + 1, n + 1, n + 1, n + profile + 1, n + profile + 2);
    }
  }
  return build(p, uv, ix);
}

/**
 * A bead ring — the heddle the filaments thread through. Instead of a smooth
 * torus it is a loop of `beads` swollen lobes joined by a waisted cord: the
 * tube radius is modulated by `|cos(beads·a)|^k`, which reads as a string of
 * pearls at distance and as a loom heddle up close.
 *
 * Outer radius ≈ 0.65 (the old torus), in the XY plane, so the ability's
 * placement and tilt carry over unchanged. `uv.x` runs round the ring and
 * `uv.y` round the tube; the shader uses `uv.x` to march light round it.
 */
export function weftRingGeometry(beads = 12) {
  const around = beads * 8;
  const tube = 10;
  const p = [];
  const uv = [];
  const n = [];
  const ix = [];
  const R = 0.65;
  for (let i = 0; i <= around; i++) {
    const a = (i / around) * TAU;
    const lobe = Math.pow(Math.abs(Math.cos(a * beads * 0.5)), 3);
    const r = 0.018 + 0.042 * lobe;
    const ca = Math.cos(a);
    const sa = Math.sin(a);
    for (let j = 0; j <= tube; j++) {
      const b = (j / tube) * TAU;
      const cb = Math.cos(b);
      const sb = Math.sin(b);
      p.push((R + r * cb) * ca, (R + r * cb) * sa, r * sb);
      n.push(cb * ca, cb * sa, sb);
      uv.push(i / around, j / tube);
    }
  }
  for (let i = 0; i < around; i++) {
    for (let j = 0; j < tube; j++) {
      const a = i * (tube + 1) + j;
      const b = a + tube + 1;
      ix.push(a, b, a + 1, a + 1, b, b + 1);
    }
  }
  return build(p, uv, ix, n);
}

/**
 * The shuttle — the hero of the travel. A lathe of a weaver's shuttle: two
 * pointed tips and a pinched waist with a ridge round it, long axis on local
 * Z (the corridor axis) so it flies point-first down the line.
 *
 * Profile (radius as a function of `s` in -1..1 along the axis):
 *   - a `sin`-shaped belly falling to sharp tips,
 *   - pinched at the waist by a narrow gaussian,
 *   - a raised ridge either side of the waist (the bobbin's spool lips).
 *
 * Unit-ish size (≈0.23 radius, 0.62 long) so the old sphere's scale applies.
 * `uv.y` is the axial coordinate 0..1; the shader keys the event-horizon band
 * off it.
 */
export function shuttleGeometry() {
  const rings = 48;
  const segs = 28;
  const p = [];
  const uv = [];
  const ix = [];
  const half = 0.31;
  for (let j = 0; j <= rings; j++) {
    const v = j / rings;
    const s = v * 2 - 1;
    const belly = Math.pow(Math.sin(Math.PI * v), 0.75);
    const waist = 1 - 0.38 * Math.exp(-s * s * 60);
    const lips = 1 + 0.16 * Math.exp(-Math.pow((Math.abs(s) - 0.2) * 14, 2));
    const r = 0.23 * belly * waist * lips;
    for (let i = 0; i <= segs; i++) {
      const a = (i / segs) * TAU;
      // Six shallow flutes give the spin something to show.
      const flute = 1 + 0.04 * Math.cos(a * 6);
      p.push(Math.cos(a) * r * flute, Math.sin(a) * r * flute, s * half);
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

/**
 * The floor the corridor sags into: a fine grid over local X -0.5..0.5,
 * Y 0..1 (same frame as the ribbon), dense enough across the width that the
 * vertex stage can pull the cloth down into a well along the spine.
 */
export function weftFloorGeometry() {
  const rows = 97;
  const cols = 25;
  const p = [];
  const uv = [];
  const ix = [];
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      const u = i / (cols - 1);
      const t = j / (rows - 1);
      p.push(u - 0.5, t, 0);
      uv.push(u, t);
    }
  }
  gridIndices(rows, cols, ix);
  return build(p, uv, ix);
}
