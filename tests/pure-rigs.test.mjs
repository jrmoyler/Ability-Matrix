// The 80 pure-element casts each own two procedural solids: a thrown piece and
// a hero rig (assets/codex/<Cast>Geometry.js, written by tools/sculpt-pure.mjs
// from tools/rigs/*.mjs). These tests pin what that promises: every cast has
// its own, they are articulated, finite and within budget, and nothing that
// stands them in the world produces a NaN.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { MeshBasicMaterial, Vector3 } from 'three';
import { SPELLS } from '../tools/pure-spells.mjs';
import { RIGS, rigModuleSource, missingRigs } from '../tools/pure-rigs.mjs';
import { RigBuilder, PI, TAU, ngon, star, arcBand } from '../packs/sandbox/src/assets/codex/RigKit.js';
import { RigHero } from '../packs/sandbox/src/abilities/codex/RigHero.js';
import { DetailLayer } from '../packs/sandbox/src/abilities/codex/DetailLayer.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const src = (dir, name) => readFileSync(path.join(root, 'packs/sandbox/src', dir, 'codex', name), 'utf8');
const load = (spell) => import(pathToFileURL(path.join(root, 'packs/sandbox/src/assets/codex', `${spell.cls}Geometry.js`)).href);
const ATTRIBUTES = ['position', 'normal', 'aEdge', 'aInfo', 'aStyle', 'aPivot', 'aHinge'];
const digest = (geometry) => createHash('sha256').update(Buffer.from(geometry.getAttribute('position').array.buffer)).digest('hex');

test('every one of the eighty casts has a rig recipe, and no stray ones', () => {
  assert.deepEqual(missingRigs(), []);
  assert.deepEqual(Object.keys(RIGS).sort(), SPELLS.map((s) => s.id).sort());
  for (const spell of SPELLS) {
    const rig = RIGS[spell.id];
    for (const key of ['title', 'pieceNote', 'heroNote']) assert.ok(typeof rig[key] === 'string' && rig[key].length > 20, `${spell.id}.${key}`);
    assert.equal(typeof rig.piece, 'function', `${spell.id} piece`);
    assert.equal(typeof rig.hero, 'function', `${spell.id} hero`);
  }
});

test('committed geometry modules reproduce exactly from the authored recipes', () => {
  for (const spell of SPELLS) {
    assert.equal(readFileSync(path.join(root, 'packs/sandbox/src/assets/codex', `${spell.cls}Geometry.js`), 'utf8'), rigModuleSource(spell), spell.id);
  }
});

test('pieces and heroes are finite, deterministic, articulated and within budget', async () => {
  const pieces = new Map();
  const heroes = new Map();
  for (const spell of SPELLS) {
    const mod = await load(spell);
    for (const [kind, make, maxTris, minParts] of [['piece', mod[`create${spell.cls}PieceGeometry`], 640, 2], ['hero', mod[`create${spell.cls}HeroGeometry`], 4000, 3]]) {
      assert.equal(typeof make, 'function', `${spell.id} ${kind} factory`);
      const g = make();
      const again = make();
      const label = `${spell.id} ${kind}`;
      for (const name of ATTRIBUTES) assert.ok(g.getAttribute(name), `${label} has ${name}`);
      const count = g.getAttribute('position').count;
      assert.equal(count % 3, 0, `${label} is whole triangles`);
      assert.ok(count / 3 <= maxTris, `${label} has ${count / 3} triangles`);
      assert.ok(count / 3 >= 12, `${label} is more than a token`);
      assert.ok(g.userData.parts >= minParts, `${label} has ${g.userData.parts} parts`);
      for (const name of ATTRIBUTES) assert.ok(g.getAttribute(name).array.every(Number.isFinite), `${label} ${name} finite`);
      assert.deepEqual(g.getAttribute('position').array, again.getAttribute('position').array, `${label} deterministic`);
      assert.ok(g.boundingSphere.radius > 0.1 && g.boundingSphere.radius < 6, `${label} radius ${g.boundingSphere.radius}`);

      const normal = g.getAttribute('normal');
      const edge = g.getAttribute('aEdge');
      const info = g.getAttribute('aInfo');
      const hinge = g.getAttribute('aHinge');
      let swinging = 0;
      for (let i = 0; i < count; i++) {
        const len = Math.hypot(normal.getX(i), normal.getY(i), normal.getZ(i));
        assert.ok(Math.abs(len - 1) < 1e-3, `${label} normal ${i} length ${len}`);
        for (const c of [edge.getX(i), edge.getY(i), edge.getZ(i)]) assert.ok(c >= 0 && c <= 1, `${label} aEdge range`);
        assert.ok(info.getW(i) === 0 || info.getW(i) === 1, `${label} stage is 0 or 1`);
        assert.ok(info.getZ(i) >= 0 && info.getZ(i) <= 0.5, `${label} delay ${info.getZ(i)}`);
        if (Math.abs(hinge.getW(i)) > 1e-6) {
          swinging++;
          const axis = Math.hypot(hinge.getX(i), hinge.getY(i), hinge.getZ(i));
          assert.ok(Math.abs(axis - 1) < 1e-3, `${label} hinge axis is a unit vector`);
          assert.ok(Math.abs(hinge.getW(i)) <= PI + 1e-6, `${label} swing within a half turn`);
        }
      }
      assert.ok(swinging > count * 0.05, `${label} articulates (${swinging}/${count} vertices swing)`);
      if (kind === 'piece') {
        // Pieces are centred, like the stock ones, so the layer can plant them.
        const mid = (g.boundingBox.min.y + g.boundingBox.max.y) / 2;
        assert.ok(Math.abs(mid) < 1e-4, `${label} is centred on y = 0, got ${mid}`);
        const size = g.boundingBox.getSize(new Vector3());
        assert.ok(Math.abs(Math.max(size.x, size.y, size.z) - 1) < 1e-4, `${label} fits one unit, got ${size.toArray()}`);
      } else {
        assert.ok(['ring', 'mass'].includes(g.userData.fit), `${label} declares how it is sized`);
      }
      const map = kind === 'piece' ? pieces : heroes;
      const key = digest(g);
      assert.ok(!map.has(key), `${label} duplicates ${map.get(key)}`);
      map.set(key, spell.id);
      g.dispose();
      again.dispose();
    }
  }
  assert.equal(pieces.size, 80);
  assert.equal(heroes.size, 80);
});

test('the hero stands for its archetype without NaN, and hides when the cast is gone', async () => {
  const st = {
    center: new Vector3(2, 0, 6), origin: new Vector3(0, 0, 0), dir: new Vector3(0, 0, 1), side: new Vector3(-1, 0, 0),
    radius: 4.2, length: 14, thickness: 0.3, grow: 1, along: 1, open: 1, beat: 1, spin: 2.5, fade: 1, dissolve: 0
  };
  const c = { heroSize: 2, heroReach: 0.85, heroLift: 2, heroSpin: 1, heroOpacity: 0.9 };
  const seen = new Set();
  for (const spell of SPELLS) {
    if (seen.has(spell.archetype + spell.cast)) continue;
    seen.add(spell.archetype + spell.cast);
    const geometry = (await load(spell))[`create${spell.cls}HeroGeometry`]();
    const rig = new RigHero(geometry, new MeshBasicMaterial(), spell.archetype, spell.cast === 'zone');
    for (const [grow, along, beat] of [[0.05, 0.05, 0], [0.5, 0.5, 0], [1, 1, 0.5], [1, 1, 1]]) {
      Object.assign(st, { grow, along, beat, open: beat });
      rig.update(st, c, 1.3);
      assert.ok(rig.mesh.visible, `${spell.archetype}/${spell.cast} visible at ${grow}`);
      for (const v of [...rig.mesh.position.toArray(), ...rig.mesh.quaternion.toArray(), ...rig.mesh.scale.toArray()]) assert.ok(Number.isFinite(v), `${spell.archetype} pose finite`);
      assert.ok(rig.mesh.scale.x > 0 && rig.mesh.scale.y > 0 && rig.mesh.scale.z > 0, `${spell.archetype} scale positive`);
    }
    Object.assign(st, { grow: 1, fade: 0 });
    rig.update(st, c, 1.3);
    assert.equal(rig.mesh.visible, false, `${spell.archetype} hides when faded`);
    st.fade = 1;
    rig.dispose();
  }
  assert.equal(seen.size >= 8, true);
});

test('the detail layer takes an authored piece and keeps its articulation attributes', async () => {
  const spell = SPELLS[0];
  const piece = (await load(spell))[`create${spell.cls}PieceGeometry`]();
  const layer = new DetailLayer(piece, new MeshBasicMaterial());
  assert.equal(layer.geometry, piece);
  for (const name of ['aSeed', ...ATTRIBUTES]) assert.ok(layer.geometry.getAttribute(name), name);
  layer.dispose();
});

test('every cast reads its rig from its own live settings and editor', () => {
  for (const spell of SPELLS) {
    const materials = src('materials', `${spell.cls}Materials.js`);
    const ability = src('abilities', `${spell.cls}Ability.js`);
    const config = src('config', `${spell.id}.js`);
    assert.match(materials, /attribute vec4 aHinge;/, `${spell.id} shader reads the hinge`);
    assert.match(materials, /uniform float uSwing;/, `${spell.id} shader folds parts`);
    assert.match(materials, new RegExp(`export function create${spell.cls}DetailMaterial\\(rig = false\\)`), `${spell.id} rig material`);
    assert.ok(!/\d\.\d{5,}/.test(config), `${spell.id} config has float noise`);
    for (const key of ['heroSize', 'heroReach', 'heroLift', 'heroSpin', 'heroSwing', 'heroGlow', 'heroEdge', 'heroOpacity', 'colorHeroA', 'colorHeroB', 'colorHeroC', 'detailSwing', 'detailEdge']) {
      assert.match(config, new RegExp(`\\b${key}:`), `${spell.id} config has ${key}`);
    }
    assert.match(ability, /R\(hero, c, 'heroSize'/, `${spell.id} editor has a hero folder`);
    assert.match(ability, /this\.rig\.dispose\(\)/, `${spell.id} releases the rig`);
  }
});

test('RigKit: polygons fill, lofts face outward, mirrors keep their winding, centring moves pivots', () => {
  // Ear clipping fills a concave star exactly.
  const b = new RigBuilder('star');
  b.part();
  b.poly(star(5, 1, 0.4).map(([x, z]) => [x, 0, z]));
  const g = b.build();
  let area = 0;
  const p = g.getAttribute('position').array;
  for (let i = 0; i < p.length; i += 9) area += Math.abs((p[i + 3] - p[i]) * (p[i + 8] - p[i + 2]) - (p[i + 5] - p[i + 2]) * (p[i + 6] - p[i])) / 2;
  const outline = star(5, 1, 0.4);
  let expected = 0;
  outline.forEach((a, i) => { const n = outline[(i + 1) % outline.length]; expected += a[0] * n[1] - n[0] * a[1]; });
  assert.ok(Math.abs(area - Math.abs(expected) / 2) < 1e-6, `star area ${area} vs ${Math.abs(expected) / 2}`);

  // A lathe faces outward, mirrored or not.
  for (const scale of [[1, 1, 1], [-1, 1, 1]]) {
    const lathe = new RigBuilder('cyl');
    lathe.at({ s: scale }, () => lathe.cylinder(1, 2, 12, {}));
    const geo = lathe.build();
    const pos = geo.getAttribute('position');
    const nor = geo.getAttribute('normal');
    let outward = 0;
    let sides = 0;
    for (let i = 0; i < pos.count; i++) {
      if (Math.abs(nor.getY(i)) > 0.5) continue;
      sides++;
      if (pos.getX(i) * nor.getX(i) + pos.getZ(i) * nor.getZ(i) > 0) outward++;
    }
    assert.ok(sides > 0 && outward === sides, `cylinder normals outward at scale ${scale}: ${outward}/${sides}`);
  }

  // Centring moves pivots with the vertices.
  const c = new RigBuilder('centre');
  c.part({ pivot: [0, 2, 0], axis: [0, 0, 1], swing: 1 });
  c.box(1, 2, 1, {});
  const centred = c.build({ center: true });
  assert.ok(Math.abs(centred.boundingBox.min.y + centred.boundingBox.max.y) < 1e-6);
  assert.ok(Math.abs(centred.getAttribute('aPivot').getY(0) - 1) < 1e-6, 'pivot followed the shift');

  // Smoothing only blends faces within the crease angle.
  const s = new RigBuilder('smooth');
  s.part({ crease: 80 });
  s.orb(1, { sides: 12, rings: 6 });
  const smooth = s.build();
  const n = smooth.getAttribute('normal');
  const q = smooth.getAttribute('position');
  let aligned = 0;
  for (let i = 0; i < q.count; i++) {
    const r = Math.hypot(q.getX(i), q.getY(i), q.getZ(i));
    if (r < 1e-6) continue;
    if ((q.getX(i) * n.getX(i) + q.getY(i) * n.getY(i) + q.getZ(i) * n.getZ(i)) / r > 0.97) aligned++;
  }
  assert.ok(aligned > q.count * 0.9, 'a smoothed orb has normals along its radius');
  assert.ok(ngon(6).length === 6 && arcBand(0, 1, 1, 2, 4).length === 10 && TAU > 6);
});
