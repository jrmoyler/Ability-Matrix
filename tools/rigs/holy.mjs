// Holy rigs. See earth.mjs for the conventions.
import { RigBuilder, PI, TAU, lerp, clamp, smooth, rng, ngon, star, arcBand, curve, arcPath, helixPath } from '../../packs/sandbox/src/assets/codex/RigKit.js';
void [RigBuilder, PI, TAU, lerp, clamp, smooth, rng, ngon, star, arcBand, curve, arcPath, helixPath];

export const HOLY = {
  censers: {
    title: 'Censers rise in a ring, swing once, and slam their smoke inward.\nThe hero is the procession: a slim reliquary spire in the middle and six\nthuribles hung from its arms on chains, each swinging inward on its own\nhinge, their lids perforated and their bowls banded.',
    pieceNote: 'A banded thurible on a short chain with a pierced lid',
    heroNote: 'A reliquary spire with six crossarms, six chains and six perforated thuribles',
    piece: (b) => {
      b.part({ pivot: [0, 0.5, 0], axis: [0, 0, 1], swing: 0.5, stage: 1 });
      b.tube((t) => [0, 0.5 - t * 0.35, 0], { r: 0.008, sides: 4, segs: 3 });
      b.part({ glow: 0.35, pivot: [0, 0.5, 0], axis: [0, 0, 1], swing: 0.5, stage: 1 });
      b.lathe([[0.001, 0.12], [0.12, 0.06], [0.2, -0.05], [0.16, -0.22], [0.001, -0.32]], 10, { crease: 35 });
      b.part({ glow: 0.8, pivot: [0, 0.5, 0], axis: [0, 0, 1], swing: 0.5, stage: 1 });
      b.at({ p: [0, 0.14, 0] }, () => b.orb(0.05, { sides: 5, rings: 3 }));
    },
    hero: (b) => {
      b.fit('mass');
      // The reliquary spire.
      b.part({ glow: 0.3 });
      b.lathe([[0.3, 0], [0.18, 0.1], [0.1, 0.3], [0.07, 1.4], [0.001, 1.7]], 8, {});
      b.part({ glow: 0.9 });
      b.at({ p: [0, 1.5, 0] }, () => b.prism(star(4, 0.16, 0.05), 0, 0.03, { taper: 1 }));
      // Six crossarms and their chains and thuribles.
      b.ring(6, 0, (i) => {
        b.part();
        b.at({ p: [0, 1.15, 0], r: [PI / 2, 0, 0] }, () => b.cylinder(0.02, 0.78, 5, { r1: 0.015 }));
        b.part({ pivot: [0, 1.15, 0.78], axis: [1, 0, 0], swing: -0.55, stage: 1, delay: (i % 2) * 0.12, edge: 0.6 });
        b.at({ p: [0, 1.15, 0.78] }, () => b.tube((t) => [0, -t * 0.42, 0], { r: 0.008, sides: 4, segs: 4 }));
        b.part({ pivot: [0, 1.15, 0.78], axis: [1, 0, 0], swing: -0.55, stage: 1, delay: (i % 2) * 0.12, glow: 0.3 });
        b.at({ p: [0, 0.57, 0.78] }, () => b.lathe([[0.001, 0.14], [0.13, 0.08], [0.2, -0.05], [0.16, -0.22], [0.001, -0.3]], 10, { crease: 35 }));
        b.part({ pivot: [0, 1.15, 0.78], axis: [1, 0, 0], swing: -0.55, stage: 1, delay: (i % 2) * 0.12, edge: 0.9 });
        b.at({ p: [0, 0.47, 0.78] }, () => b.torus(0.2, 0.012, { segs: 14, sides: 4 }));
      });
    }
  },

  reliclash: {
    title: 'A relic chain lashes the line and brands what it crosses.\nThe hero is the chain: fourteen interlocked links in a running curve,\neach turned ninety degrees from the last and flexing alternately as the\nlash cracks, ending in a reliquary that carries the brand.',
    pieceNote: 'Three interlocked chain links',
    heroNote: 'Fourteen alternating links on an S curve and a cross-topped reliquary',
    piece: (b) => {
      for (let i = 0; i < 3; i++) {
        b.part({ pivot: [0, -0.3 + i * 0.3, 0], axis: [0, 0, 1], swing: (i - 1) * 0.5, stage: 1, delay: i * 0.1, glow: i === 2 ? 0.4 : 0 });
        b.at({ p: [0, -0.3 + i * 0.3, 0], r: [0, (i % 2) * PI / 2, 0], s: [1, 1.7, 1] }, () => b.at({ r: [PI / 2, 0, 0] }, () => b.torus(0.1, 0.028, { segs: 10, sides: 5 })));
      }
    },
    hero: (b) => {
      b.fit('mass');
      const bend = (t) => 0.22 * Math.sin(t * 5.5);
      for (let i = 0; i < 14; i++) {
        const t = i / 14;
        const z = t * 1.7;
        const dx = (bend(t + 0.01) - bend(t)) / (0.01 * 1.7);
        b.part({ pivot: [bend(t), 0.5, z], axis: [0, 1, 0], swing: (i % 2 ? -1 : 1) * 0.22, stage: 1, delay: t * 0.4, glow: i > 10 ? 0.35 : 0 });
        b.at({ p: [bend(t), 0.5, z], r: [0, Math.atan2(dx, 1), (i % 2) * PI / 2], s: [1, 1, 1.75] }, () => b.torus(0.075, 0.017, { segs: 10, sides: 5 }));
      }
      // Reliquary at the end of the chain: a small spired casket.
      b.part({ glow: 0.9, pivot: [bend(1), 0.5, 1.7], axis: [0, 1, 0], swing: 0.3, stage: 1, delay: 0.4 });
      b.at({ p: [bend(1), 0.5, 1.82] }, () => {
        b.at({ p: [0, -0.09, -0.12], r: [PI / 2, 0, 0] }, () => b.box(0.14, 0.24, 0.14, { taper: [0.9, 0.9] }));
        b.at({ p: [0, 0.01, 0.12], r: [PI / 2, 0, 0] }, () => b.pyramid(4, 0.1, 0.16, { phase: PI / 4 }));
      });
      b.part({ glow: 1 });
      b.at({ p: [bend(1), 0.5, 2.1] }, () => {
        b.box(0.03, 0.2, 0.03, { center: true });
        b.at({ p: [0, 0.03, 0] }, () => b.box(0.14, 0.03, 0.03, { center: true }));
      });
    }
  },

  vowcage: {
    title: 'Vows lock as bars and hold the circle until they break outward.\nThe hero is the vault: nine gothic ribs that rise from a threshold\nring and curve to meet at a boss, each hinged at its foot to break\noutward when the vow is released.',
    pieceNote: 'A single pointed-arch rib with a capstone',
    heroNote: 'Nine vault ribs, a threshold ring, a mid hoop, a keystone boss and nine foot plates',
    piece: (b) => {
      b.part({ pivot: [-0.25, -0.5, 0], axis: [0, 0, 1], swing: 0.35, stage: 1 });
      b.tube((t) => [lerp(-0.25, 0.25, 1 - Math.pow(1 - t, 1.6)) * (1 - Math.pow(t, 3) * 0.0) - Math.sin(t * PI) * 0.0, -0.5 + t * 1.0, 0], { r: 0.025, sides: 5, segs: 12 });
      b.part({ glow: 0.7 });
      b.at({ p: [0.25, 0.5, 0] }, () => b.pyramid(4, 0.07, 0.1, { phase: PI / 4 }));
    },
    hero: (b) => {
      b.fit('ring');
      b.part({ edge: 0.8 });
      b.torus(1, 0.03, { segs: 40, sides: 4 });
      // Nine gothic ribs, each a pointed arch: out at the foot, in at the crown.
      b.ring(9, 0, (i) => {
        b.part({ pivot: [0, 0, 1], axis: [1, 0, 0], swing: 0.5, stage: 1, delay: (i % 3) * 0.07, glow: i % 3 === 0 ? 0.25 : 0 });
        b.tube((t) => [0, t * 1.35, Math.pow(1 - t, 0.7) * 0.98 + 0.02], { r: 0.03, sides: 5, segs: 18 });
        b.at({ p: [0, 0, 1], r: [0, 0, 0] }, () => b.box(0.14, 0.04, 0.14, { center: true }));
      });
      b.part({ edge: 0.7 });
      b.at({ p: [0, 0.55, 0] }, () => b.torus(0.62, 0.016, { segs: 32, sides: 4 }));
      // The boss where the ribs meet.
      b.part({ glow: 0.9 });
      b.at({ p: [0, 1.36, 0] }, () => b.lathe([[0.001, 0], [0.1, 0.02], [0.08, 0.1], [0.001, 0.2]], 9, {}));
      b.at({ p: [0, 1.36, 0], r: [PI, 0, 0] }, () => b.lathe([[0.001, 0], [0.1, 0.02], [0.05, 0.12], [0.001, 0.2]], 9, {}));
    }
  },

  hymnwell: {
    title: 'A hymn inhales the circle and lifts what it judges.\nThe hero is the organ: nine pipes of stepped height set in a fan\nround a wooden rim, each with a cut mouth, leaning outward on the\nlifting note under a halo that rises above them.',
    pieceNote: 'Three organ pipes of stepped height',
    heroNote: 'Nine open pipes with mouths, a foot ring and a rising halo',
    piece: (b) => {
      [[-0.14, 0.9], [0, 1.1], [0.14, 0.75]].forEach(([x, h], i) => {
        b.part({ pivot: [x, -0.5, 0], axis: [0, 0, 1], swing: (i - 1) * -0.35, stage: 1, delay: i * 0.08, glow: i === 1 ? 0.35 : 0 });
        b.at({ p: [x, -0.5, 0] }, () => {
          b.lathe([[0.05, 0], [0.05, h], [0.056, h + 0.02]], 8, { cap: false });
          b.at({ p: [0, 0.12, 0.05] }, () => b.box(0.06, 0.05, 0.02, {}));
        });
      });
    },
    hero: (b) => {
      b.fit('ring');
      // The foot: a wooden ring the pipes stand in.
      b.part({ edge: 0.7 });
      b.torus(0.78, 0.05, { segs: 36, sides: 6 });
      // Nine pipes, stepped so the fan rises toward the middle.
      b.ring(9, 0.78, (i) => {
        const h = 0.7 + (i % 3) * 0.25 + (i % 2) * 0.1;
        b.part({ pivot: [0, 0, 0], axis: [1, 0, 0], swing: 0.3 + (i % 3) * 0.1, stage: 1, delay: (i % 3) * 0.08, glow: i % 3 === 2 ? 0.4 : 0.1 });
        b.at({ r: [-0.12, 0, 0] }, () => {
          b.lathe([[0.065, 0], [0.065, h], [0.074, h + 0.025]], 10, { cap: false });
          b.at({ p: [0, 0.18, 0.062] }, () => b.box(0.08, 0.08, 0.03, { taper: [1, 0.6] }));
        });
      });
      // The halo that rises above them on the lifting note.
      b.part({ glow: 0.9, pivot: [0.5, 1.3, 0], axis: [0, 0, 1], swing: -0.2, stage: 1 });
      b.at({ p: [0, 1.4, 0] }, () => b.torus(0.5, 0.03, { segs: 32, sides: 5 }));
      b.part({ glow: 0.5 });
      b.at({ p: [0, 1.4, 0] }, () => b.ring(8, 0.5, () => b.at({ r: [PI / 2, 0, 0] }, () => b.blade({ len: 0.16, w: 0.025, thick: 0.01, segs: 3 })), { y: 0 }));
    }
  }
};
