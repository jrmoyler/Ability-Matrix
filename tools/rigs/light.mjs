// Light rigs. See earth.mjs for the conventions.
import { RigBuilder, PI, TAU, lerp, clamp, smooth, rng, ngon, star, arcBand, curve, arcPath, helixPath } from '../../packs/sandbox/src/assets/codex/RigKit.js';
void [RigBuilder, PI, TAU, lerp, clamp, smooth, rng, ngon, star, arcBand, curve, arcPath, helixPath];

export const LIGHT = {
  caustic: {
    title: 'A caustic lance boils the line and leaves a bright scar.\nThe hero is the focus: a lens ring at the hand throwing seven rays\nthat converge on a burning point, the whole bundle loosening and\nrefocusing as the heat builds.',
    pieceNote: 'Three rays converging on a hot bead',
    heroNote: 'A biconvex lens, a lens ring, seven converging rays and a burning focus',
    piece: (b) => {
      b.part({ glow: 1 });
      b.at({ p: [0, 0.4, 0] }, () => b.orb(0.07, { sides: 6, rings: 3, ey: 1.4 }));
      for (let i = 0; i < 3; i++) {
        const a = (i / 3) * TAU;
        b.part({ pivot: [0, 0.4, 0], axis: [-Math.sin(a), 0, Math.cos(a)], swing: 0.3, stage: 1, delay: i * 0.08 });
        b.tube((t) => [Math.cos(a) * 0.16 * (1 - t), lerp(-0.45, 0.4, t), Math.sin(a) * 0.16 * (1 - t)], { r: 0.013, sides: 4, segs: 5 });
      }
    },
    hero: (b) => {
      b.fit('mass');
      b.aimZ(() => {
        // The lens: biconvex, in a ring.
        b.part({ glow: 0.5 });
        b.at({ r: [-PI / 2, 0, 0] }, () => b.lathe([[0.001, -0.05], [0.14, -0.035], [0.24, 0], [0.14, 0.035], [0.001, 0.05]], 16, { cap: false }));
        b.part({ edge: 0.9 });
        b.at({ r: [-PI / 2, 0, 0] }, () => b.torus(0.25, 0.022, { segs: 20, sides: 5 }));
        // Seven rays converging on the focus 1.3 ahead; they loosen and refocus.
        for (let i = 0; i < 7; i++) {
          const a = (i / 7) * TAU;
          b.part({ pivot: [0, 0, 1.3], axis: [-Math.sin(a), Math.cos(a), 0], swing: 0.16, stage: 1, delay: (i % 3) * 0.08, glow: 0.35, edge: 0.7 });
          b.tube((t) => [Math.cos(a) * 0.23 * (1 - t), Math.sin(a) * 0.23 * (1 - t), t * 1.3], { r: 0.016, sides: 4, segs: 10 });
        }
        // The burning point.
        b.part({ glow: 1 });
        b.at({ p: [0, 0, 1.32] }, () => b.orb(0.1, { sides: 6, rings: 3, ex: 1, ey: 1 }));
        b.at({ p: [0, 0, 1.32], r: [0, 0, PI / 4] }, () => b.at({ r: [-PI / 2, 0, 0] }, () => b.blade({ len: 0.2, w: 0.03, thick: 0.01, segs: 3 })));
      });
    }
  },

  aureole: {
    title: 'An aureole tightens on the circle and flares when it meets.\nThe hero is the sunburst: a bright core ring set with twenty-four rays\nof alternating length, laid flat and lifting to the vertical as the ring\nflares.',
    pieceNote: 'A flat sixteen-point sun with a bead at its centre',
    heroNote: 'A bright core ring, a wide guard ring, twenty-four rays and ray beads',
    piece: (b) => {
      b.part({ glow: 0.5 });
      b.prism(star(8, 0.45, 0.2), 0, 0.05, {});
      b.part({ glow: 1, pivot: [0, 0.03, 0], axis: [0, 0, 1], swing: 0.5, stage: 1 });
      b.at({ p: [0, 0.07, 0] }, () => b.orb(0.07, { sides: 6, rings: 3 }));
      b.part({ edge: 0.8, pivot: [0, 0.03, 0], axis: [1, 0, 0], swing: -0.9, stage: 1, delay: 0.1 });
      b.at({ p: [0, 0.03, 0] }, () => b.torus(0.3, 0.015, { segs: 14, sides: 4 }));
    },
    hero: (b) => {
      b.fit('ring');
      b.part({ glow: 0.7 });
      b.at({ p: [0, 0.04, 0] }, () => b.torus(0.82, 0.045, { segs: 48, sides: 6 }));
      b.part({ edge: 0.8 });
      b.at({ p: [0, 0.02, 0] }, () => b.torus(1.0, 0.018, { segs: 48, sides: 4 }));
      // Twenty-four rays, alternately long and short, laid flat and lifting.
      b.ring(24, 0.84, (i) => {
        const long = i % 2 === 0;
        b.part({ pivot: [0, 0.04, 0], axis: [1, 0, 0], swing: -1.1, stage: 1, delay: long ? 0 : 0.1, glow: long ? 0.4 : 0.15 });
        b.at({ p: [0, 0.04, 0], r: [PI / 2 - 0.05, 0, 0] }, () => b.blade({ len: long ? 0.42 : 0.26, w: long ? 0.055 : 0.04, thick: 0.012, segs: 4 }));
      });
      // Beads at the tips of the long rays.
      b.part({ glow: 1 });
      b.ring(12, 1.3, () => b.orb(0.03, { sides: 4, rings: 2 }), { y: 0.05, phase: 0 });
    }
  },

  photonwell: {
    title: 'Photons drain into a point, then the point gives them back.\nThe hero is the reflector: a parabolic dish braced to a hovering\nemitter, ringed by twelve collector petals that fold inward as the dish\ndrains and spring back out on the release.',
    pieceNote: 'A shallow dish with a hovering bead and three struts',
    heroNote: 'A parabolic dish, a hovering emitter, six braces and twelve collector petals',
    piece: (b) => {
      b.part({ crease: 30 });
      b.lathe([[0.001, -0.3], [0.2, -0.26], [0.36, -0.1], [0.46, 0.14]], 14, { cap: false });
      b.part({ glow: 1 });
      b.at({ p: [0, 0.05, 0] }, () => b.orb(0.07, { sides: 6, rings: 3 }));
      for (let i = 0; i < 3; i++) {
        b.part({ pivot: [0, 0.1, 0], axis: [0, 0, 1], swing: -0.6, stage: 1, delay: i * 0.08 });
        b.at({ r: [0, (i / 3) * TAU, 0] }, () => b.tube((t) => [lerp(0, 0.45, t), lerp(0.05, 0.14, t), 0], { r: 0.01, sides: 4, segs: 3 }));
      }
    },
    hero: (b) => {
      b.fit('ring');
      // Parabolic dish: y = r^2 rise.
      b.part({ crease: 30, edge: 0.4 });
      const prof = [];
      for (let i = 0; i <= 10; i++) { const r = (i / 10) * 0.95 + 0.02; prof.push([r, 0.55 * r * r]); }
      b.lathe(prof, 32, { cap: false });
      // The emitter hovers at the focus; six braces tie it to the rim.
      b.part({ glow: 1 });
      b.at({ p: [0, 0.32, 0] }, () => b.orb(0.13, { sides: 8, rings: 4 }));
      b.ring(6, 0.95, (i) => {
        b.part({ edge: 0.6 });
        b.tube((t) => [0, lerp(0.5, 0.32, t), lerp(0, -0.95, t)], { r: 0.012, sides: 4, segs: 8 });
      });
      // Twelve collector petals around the rim.
      b.ring(12, 0.95, (i) => {
        b.part({ pivot: [0, 0.5, 0], axis: [1, 0, 0], swing: -0.9, stage: 1, delay: (i % 2) * 0.1, glow: 0.2 });
        b.at({ p: [0, 0.5, 0], r: [-0.45, 0, 0] }, () => b.blade({ len: 0.36, w: 0.1, thick: 0.012, segs: 5 }));
      });
    }
  },

  filament: {
    title: 'Filaments arc and stitch whatever they land on.\nThe hero is the needle of light: a thin core with six curved barbs\nlike fishhooks that spring open to stitch, and a thread of bright\nfilament winding out behind it.',
    pieceNote: 'A barbed needle with two hooked barbs and a thread',
    heroNote: 'A needle core, six fishhook barbs, a helical thread and an eyelet',
    piece: (b) => {
      b.part({ glow: 0.8 });
      b.lathe([[0.001, 0.5], [0.04, 0.3], [0.04, -0.4], [0.001, -0.5]], 4, { phase: PI / 4 });
      for (let i = 0; i < 2; i++) {
        const s = i ? 1 : -1;
        b.part({ pivot: [0, 0.2, 0], axis: [0, 0, 1], swing: s * -0.7, stage: 1, delay: i * 0.1 });
        b.tube((t) => [s * Math.sin(t * 1.8) * 0.18, 0.2 - t * 0.28, 0], { r: 0.012, sides: 4, segs: 6 });
      }
    },
    hero: (b) => {
      b.fit('mass');
      b.aimZ(() => {
        // Needle core.
        b.part({ glow: 0.9 });
        b.lathe([[0.001, 1.0], [0.045, 0.8], [0.05, 0.0], [0.03, -0.1]], 5, { phase: PI / 10 });
        // Six barbs sweeping back like fishhooks.
        for (let i = 0; i < 6; i++) {
          const a = (i / 6) * TAU;
          const c = Math.cos(a);
          const s = Math.sin(a);
          b.part({ pivot: [0, 0.75 - (i % 2) * 0.12, 0], axis: [-s, 0, c], swing: 0.55, stage: 1, delay: (i % 3) * 0.07, glow: 0.3, edge: 0.7 });
          b.tube((t) => [c * Math.sin(t * 1.9) * 0.2, 0.75 - (i % 2) * 0.12 - t * 0.35, s * Math.sin(t * 1.9) * 0.2], { r: 0.012, sides: 4, segs: 8 });
        }
        // The thread: a bright filament wound out behind.
        b.part({ crease: 40, edge: 0.2, glow: 0.5 });
        b.ribbon(helixPath(0.06, 0.18, 2.5, -1.0, -0.1, 0), { w: 0.03, segs: 30, up: [0, 1, 0] });
        // Eyelet.
        b.part({ edge: 0.8 });
        b.at({ p: [0, -0.1, 0], r: [0, 0, PI / 2] }, () => b.torus(0.07, 0.014, { segs: 10, sides: 4 }));
      });
    }
  },

  noonblade: {
    title: 'A blade of noon swings flat and cuts on the return.\nThe hero is the scimitar: a broad curved blade lying flat from the\nhand, a sun-disc guard ringed with short rays, and a lamp-bright edge\nline that rolls the blade over on the return.',
    pieceNote: 'A short curved blade laid flat with a sun-disc at its heel',
    heroNote: 'A curved broad blade, a sun-disc guard, eighteen guard rays and a grip',
    piece: (b) => {
      b.part({ glow: 0.4, pivot: [0, -0.4, 0], axis: [0, 1, 0], swing: 0.6, stage: 1 });
      b.at({ r: [0, 0, 0] }, () => b.blade({ len: 0.9, w: 0.2, thick: 0.02, bend: 0.35, segs: 8 }));
      b.part({ glow: 0.9 });
      b.at({ p: [0, -0.05, 0], r: [PI / 2, 0, 0] }, () => b.cylinder(0.12, 0.03, 12, {}));
    },
    hero: (b) => {
      b.fit('mass');
      b.aimZ(() => {
        // The blade: broad, curved toward the edge, lying flat when aimed along z.
        b.part({ glow: 0.35, pivot: [0, 0.2, 0], axis: [0, 1, 0], swing: 0.35, stage: 1 });
        b.at({ p: [0, 0.18, 0] }, () => b.blade({ len: 1.35, w: 0.3, thick: 0.03, bend: -0.45, segs: 12, shape: (t) => Math.sin(Math.PI * Math.pow(t, 0.5)) * (1 - 0.35 * t) }));
        // Sun-disc guard and its rays.
        b.part({ glow: 0.9 });
        b.at({ p: [0, 0.1, 0] }, () => b.cylinder(0.2, 0.05, 18, { r1: 0.17 }));
        b.part({ glow: 0.5, edge: 0.7 });
        b.ring(18, 0.2, (i) => {
          b.at({ p: [0, 0.12, 0], r: [PI / 2, 0, 0] }, () => b.blade({ len: 0.1 + (i % 2) * 0.05, w: 0.03, thick: 0.01, segs: 3 }));
        });
        // Grip and pommel.
        b.part();
        b.lathe([[0.05, 0.1], [0.04, -0.1], [0.045, -0.25], [0.08, -0.3], [0.001, -0.36]], 8, {});
      });
    }
  },

  latticeflare: {
    title: 'A lattice of flares stands up and blooms outward.\nThe hero is the lattice: six slender posts tapering inward with three\ncross hoops and diagonal braces, each post hinging open from its foot\nwhen the flare blooms, and a crossed star burning at the crown.',
    pieceNote: 'Two hoops braced by three posts, a tiny star on top',
    heroNote: 'Six posts, three hoops, twelve diagonal braces and a six-ray crown star',
    piece: (b) => {
      b.part({ edge: 0.8 });
      [-0.3, 0.1].forEach((y, k) => b.at({ p: [0, y, 0] }, () => b.torus(0.2 - k * 0.04, 0.014, { segs: 12, sides: 4 })));
      for (let i = 0; i < 3; i++) {
        b.part({ pivot: [0, -0.4, 0], axis: [Math.cos((i / 3) * TAU + PI / 2), 0, Math.sin((i / 3) * TAU + PI / 2)], swing: 0.5, stage: 1, delay: i * 0.08 });
        const a = (i / 3) * TAU;
        b.tube((t) => [Math.cos(a) * lerp(0.2, 0.12, t), lerp(-0.4, 0.3, t), Math.sin(a) * lerp(0.2, 0.12, t)], { r: 0.012, sides: 4, segs: 5 });
      }
      b.part({ glow: 1 });
      b.at({ p: [0, 0.42, 0] }, () => b.prism(star(4, 0.14, 0.04), 0, 0.03, {}));
    },
    hero: (b) => {
      b.fit('mass');
      const post = (i, t) => {
        const a = (i / 6) * TAU;
        return [Math.cos(a) * lerp(0.7, 0.28, t), t * 1.6, Math.sin(a) * lerp(0.7, 0.28, t)];
      };
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * TAU;
        b.part({ pivot: [Math.cos(a) * 0.7, 0, Math.sin(a) * 0.7], axis: [-Math.sin(a), 0, Math.cos(a)], swing: 0.55, stage: 1, delay: (i % 2) * 0.08, glow: 0.15 });
        b.tube((t) => post(i, t), { r: 0.018, sides: 5, segs: 12 });
      }
      // Hoops, and the braces that make the cage a lattice.
      b.part({ edge: 0.8, glow: 0.2 });
      [0.3, 0.8, 1.3].forEach((y) => b.at({ p: [0, y, 0] }, () => b.torus(lerp(0.7, 0.28, y / 1.6) + 0.01, 0.014, { segs: 24, sides: 4 })));
      b.part({ edge: 0.8 });
      for (let i = 0; i < 6; i++) {
        const j = (i + 1) % 6;
        [[0.0, 0.5], [0.5, 1.0]].forEach(([t0, t1], k) => {
          const A = post(i, t0 + (k ? 0.0 : 0));
          const B = post(j, t1);
          b.tube((t) => [lerp(A[0], B[0], t), lerp(A[1], B[1], t), lerp(A[2], B[2], t)], { r: 0.007, sides: 3, segs: 2 });
        });
      }
      // The crown: a crossed star.
      b.part({ glow: 1 });
      b.at({ p: [0, 1.65, 0] }, () => {
        b.orb(0.1, { sides: 6, rings: 3 });
        b.ring(6, 0.05, () => b.at({ r: [PI / 2, 0, 0] }, () => b.blade({ len: 0.3, w: 0.035, thick: 0.01, segs: 3 })), { y: 0 });
      });
    }
  }
};
