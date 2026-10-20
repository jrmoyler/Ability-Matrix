// Earth rigs: scarp, sinter, loess, keystone. Recipes are embedded verbatim in
// assets/codex/<Cast>Geometry.js, so they use only RigKit names and block bodies.
import { RigBuilder, PI, TAU, lerp, clamp, smooth, rng, ngon, star, arcBand, curve, arcPath, helixPath } from '../../packs/sandbox/src/assets/codex/RigKit.js';
void [RigBuilder, PI, TAU, lerp, clamp, smooth, rng, ngon, star, arcBand, curve, arcPath, helixPath];

export const EARTH = {
  scarp: {
    title: 'A scarp face shears up inside the circle and topples outward.\nThe hero is the escarpment: five courses of curved strata slabs around a\ncollapsing rim, each hinged at its outer foot, with a stratified spire\nstanding in the middle and talus tumbled at its feet.',
    pieceNote: 'A three-layer stratified stub whose upper blocks lean off their seats',
    heroNote: 'Twenty-five curved strata slabs, a six-layer core spire and nine boulders',
    piece: (b) => {
      const rand = rng(3);
      let y = 0;
      for (let i = 0; i < 3; i++) {
        const r = [0.3, 0.26, 0.2][i];
        const h = [0.38, 0.32, 0.3][i];
        const poly = ngon(6, r).map(([x, z]) => [x * (0.8 + rand() * 0.4), z * (0.8 + rand() * 0.4)]);
        b.part({ pivot: [r * 0.6, y, 0], axis: [0, 0, 1], swing: -0.22 * i, stage: 1, delay: 0.12 * i, glow: i === 2 ? 0.5 : 0 });
        b.at({ p: [rand() * 0.06, y, rand() * 0.06], r: [0, rand() * 6, 0] }, () => b.prism(poly, 0, h, { taper: 0.85 }));
        y += h * 0.92;
      }
    },
    hero: (b) => {
      b.fit('mass');
      const rand = rng(11);
      // Rim: five courses of curved slabs. Each course steps outward and is
      // rotated against the last, so the joints never line up.
      for (let course = 0; course < 5; course++) {
        const y = course * 0.27;
        const r0 = 0.72 + course * 0.05;
        b.ring(5, 0, () => {
          const span = 1.0 + rand() * 0.18;
          const top = y + 0.25 + rand() * 0.04;
          b.part({ pivot: [0, y, r0 + 0.2], axis: [1, 0, 0], swing: 0.18 + course * 0.17, stage: 1, delay: course * 0.07 + rand() * 0.05, glow: course === 4 ? 0.3 : 0 });
          b.prism(arcBand(PI / 2 - span / 2, PI / 2 + span / 2, r0, r0 + 0.2, 6, (i, n, outer) => 1 + (rand() - 0.5) * (outer ? 0.07 : 0.03)), y, top, { taper: [0.97, 0.97] });
        }, { phase: course * 0.62 });
      }
      // The heart: a core spire of six stratified layers, each rotated and narrower.
      for (let i = 0; i < 6; i++) {
        b.part({ pivot: [0.2, i * 0.26, 0], axis: [0, 0, 1], swing: -0.1 * i, stage: 1, delay: 0.1 + i * 0.06, glow: i === 5 ? 0.9 : 0 });
        b.at({ p: [0, i * 0.26, 0], r: [0, i * 0.5, 0] }, () => b.prism(ngon(6, 0.38 - i * 0.04).map(([x, z]) => [x * (0.85 + rand() * 0.3), z * (0.85 + rand() * 0.3)]), 0, 0.25, { taper: 0.92 }));
      }
      b.part();
      b.pyramid(6, 0.2, 0.55, {});
      for (let i = 0; i < 9; i++) {
        const a = rand() * TAU;
        const r = 1.12 + rand() * 0.35;
        b.at({ p: [Math.cos(a) * r, 0, Math.sin(a) * r], r: [rand(), rand() * 6, rand()] }, () => b.orb(0.07 + rand() * 0.07, { sides: 5, rings: 3, ey: 0.75 }));
      }
    }
  },

  sinter: {
    title: 'A plate of sinter walks the rim, locks, and stamps the circle flat.\nThe hero is the plate itself: a terraced mineral pan with scalloped\npool lips, ringed by upright collar plates that fall outward on the stamp.',
    pieceNote: 'Three scalloped travertine pans stacked small over large, the top pan tipping',
    heroNote: 'A four-step terraced pan, a rim of twelve collar plates and a mineral rosette',
    piece: (b) => {
      const rand = rng(21);
      for (let i = 0; i < 3; i++) {
        const r = 0.46 - i * 0.12;
        b.part({ pivot: [r, i * 0.17, 0], axis: [0, 0, 1], swing: -0.35 * i, stage: 1, delay: 0.1 * i, glow: i === 2 ? 0.5 : 0 });
        b.lathe([[r * 0.8, i * 0.17], [r, i * 0.17 + 0.03], [r * 1.02, i * 0.17 + 0.1], [r * 0.9, i * 0.17 + 0.15], [0, i * 0.17 + 0.12]], 14, { jag: (k, j) => 1 + (j % 2 ? -0.07 : 0.05) + rand() * 0.02 });
      }
    },
    hero: (b) => {
      b.fit('ring');
      const rand = rng(23);
      // Four terraces, each lip scalloped, each step pooled lower than the last.
      const steps = [[1.0, 0], [0.82, 0.07], [0.62, 0.14], [0.4, 0.2]];
      steps.forEach(([r, y], i) => {
        b.part({ glow: i === 3 ? 0.6 : 0, pivot: [0, y, 0], axis: [Math.cos(i * 1.9), 0, Math.sin(i * 1.9)], swing: 0.1 + i * 0.04, stage: 1, delay: i * 0.06 });
        b.lathe([[r * 0.92, y], [r, y + 0.015], [r * 1.01, y + 0.07], [r * 0.94, y + 0.1], [r * 0.7, y + 0.06]], 36, { jag: (k, j) => 1 + 0.05 * Math.sin(j * 1.571) + (rand() - 0.5) * 0.015 });
      });
      // Collar: twelve upright plates that fall outward when the plate stamps.
      b.ring(12, 1.02, (i) => {
        b.part({ pivot: [0, 0, 0.03], axis: [1, 0, 0], swing: 1.35, stage: 1, delay: (i % 4) * 0.08 });
        b.box(0.44, 0.34 + rand() * 0.08, 0.05, { taper: [0.9, 1] });
      });
      // The rosette: mineral blades radiating from the centre pool.
      b.part({ glow: 0.5 });
      b.ring(9, 0.05, (i, t, a) => {
        b.at({ p: [0, 0.2, 0], r: [-0.9, 0, 0] }, () => b.blade({ len: 0.34, w: 0.07, thick: 0.015, segs: 4 }));
      });
    }
  },

  loess: {
    title: 'A curtain of loess snaps sideways and buries the line.\nThe hero is the curtain: nine fluted drapes hung from a lintel,\neach eroded to a different hourglass and hinged at the top so the\nwhole sheet can shear.',
    pieceNote: 'A three-lobed scalloped flap with eroded teeth along its hem',
    heroNote: 'Nine hung flutes on a lintel, a ragged hem of drip cones and a dust skirt',
    piece: (b) => {
      const rand = rng(31);
      b.part({ pivot: [0, 0.5, 0], axis: [0, 0, 1], swing: 0.4, stage: 1 });
      b.at({ p: [0, 0.5, 0] }, () => b.box(0.5, 0.08, 0.1, { center: true }));
      for (let i = 0; i < 3; i++) {
        b.part({ pivot: [(i - 1) * 0.16, 0.45, 0], axis: [0, 0, 1], swing: (i - 1) * 0.5, stage: 1, delay: i * 0.1 });
        b.at({ p: [(i - 1) * 0.16, 0.45, 0], r: [PI, 0, 0] }, () => b.lathe([[0.09, 0], [0.06, 0.2], [0.11, 0.42], [0.04, 0.7 + rand() * 0.2]], 6, {}));
      }
    },
    hero: (b) => {
      b.fit('mass');
      const rand = rng(33);
      // Lintel along the side axis.
      b.part();
      b.at({ p: [0, 1.05, 0], r: [0, 0, PI / 2] }, () => b.cylinder(0.07, 2.2, 6, { r1: 0.07 }));
      b.at({ p: [-1.1, 1.05, 0] }, () => b.orb(0.1, { sides: 6, rings: 3 }));
      b.at({ p: [1.1, 1.05, 0] }, () => b.orb(0.1, { sides: 6, rings: 3 }));
      // Nine flutes, hung and inverted, each with its own erosion.
      for (let i = 0; i < 9; i++) {
        const x = (i - 4) * 0.25;
        b.part({ pivot: [x, 1.05, 0], axis: [0, 0, 1], swing: (i - 4) * 0.09, stage: 1, delay: Math.abs(i - 4) * 0.05, glow: i % 4 === 0 ? 0.25 : 0 });
        b.at({ p: [x, 1.05, (rand() - 0.5) * 0.06], r: [PI, 0, 0] }, () =>
          b.lathe([[0.09, 0], [0.06 + rand() * 0.02, 0.22], [0.13, 0.46], [0.05 + rand() * 0.03, 0.7], [0.11, 0.92], [0.02, 1.0 + rand() * 0.1]], 7, { jag: (k, j) => 1 + (j % 2 ? 0.1 : -0.06) }));
      }
      // Dust skirt: low ragged dunes at the foot.
      b.part();
      for (let i = 0; i < 6; i++) {
        b.at({ p: [(i - 2.5) * 0.4, 0, (rand() - 0.5) * 0.3], r: [0, rand() * 3, 0] }, () => b.lathe([[0.22, 0], [0.16, 0.06], [0.05, 0.12], [0, 0.14]], 6, { ez: 0.6 }));
      }
    }
  },

  keystone: {
    title: 'Keystones drop into a ring and crush inward to one lock.\nThe hero is the arch: eight tapered voussoir pillars around a ring,\neach leaning inward on the crush, and the keystone itself hanging above\ntheir tops on four tie rods.',
    pieceNote: 'A single tapered voussoir with a chamfered cap that lifts off',
    heroNote: 'Eight voussoir pillars, an inverted keystone, four tie rods and a base ring',
    piece: (b) => {
      b.part();
      b.prism([[-0.2, -0.13], [0.2, -0.13], [0.26, 0.13], [-0.26, 0.13]], 0, 0.6, { taper: [0.8, 0.85] });
      b.part({ pivot: [0.15, 0.6, 0], axis: [0, 0, 1], swing: -0.5, stage: 1, glow: 0.6 });
      b.at({ p: [0, 0.6, 0] }, () => b.pyramid(4, 0.22, 0.3, { phase: PI / 4 }));

      // Plinth, mortar pins and a carved boss on the face.
      b.part({ edge: 0.8 });
      b.box(0.6, 0.05, 0.34, { taper: [0.9, 0.9] });
      b.part({ glow: 0.5 });
      [-0.12, 0.12].forEach((x) => b.at({ p: [x, 0.4, 0.14], r: [PI / 2, 0, 0] }, () => b.cylinder(0.03, 0.05, 6, {})));
      b.at({ p: [0, 0.3, 0.14] }, () => b.orb(0.05, { sides: 5, rings: 3 }));
      b.part({ pivot: [-0.2, 0.6, 0], axis: [0, 0, 1], swing: 0.5, stage: 1, delay: 0.1 });
      b.at({ p: [-0.2, 0.6, 0] }, () => b.pyramid(4, 0.07, 0.12, { phase: PI / 4 }));
    },
    hero: (b) => {
      b.fit('ring');
      // Base ring the pillars stand on.
      b.part();
      b.torus(1, 0.035, { segs: 40, sides: 4 });
      // Voussoir pillars: plan-view wedges, lean inward on the crush.
      b.ring(8, 0, (i) => {
        b.part({ pivot: [0, 0, 0.88], axis: [1, 0, 0], swing: -0.5, stage: 1, delay: (i % 2) * 0.12 });
        b.prism(arcBand(PI / 2 - 0.34, PI / 2 + 0.34, 0.88, 1.08, 4), 0, 0.9, { taper: [0.8, 0.8] });
        b.at({ p: [0, 0.9, 0.98] }, () => b.pyramid(4, 0.1, 0.12, { phase: PI / 4 }));
      });
      // The keystone: an inverted four-sided wedge hung above the circle.
      b.part({ glow: 0.9 });
      b.at({ p: [0, 1.35, 0], r: [PI, 0, 0] }, () => b.lathe([[0.3, 0], [0.34, 0.05], [0.2, 0.34], [0.03, 0.46]], 4, { phase: PI / 4 }));
      // Four tie rods from keystone to the pillar tops.
      b.part({ edge: 0.5 });
      for (let i = 0; i < 4; i++) {
        const a = (i / 4) * TAU + PI / 4;
        b.tube((t) => [Math.cos(a) * lerp(0.3, 0.98, t), lerp(1.3, 1.0, t) + 0.12 * Math.sin(t * PI), Math.sin(a) * lerp(0.3, 0.98, t)], { r: 0.012, sides: 4, segs: 8 });
      }
    }
  }
};
