// Wind rigs. See earth.mjs for the conventions.
import { RigBuilder, PI, TAU, lerp, clamp, smooth, rng, ngon, star, arcBand, curve, arcPath, helixPath } from '../../packs/sandbox/src/assets/codex/RigKit.js';
void [RigBuilder, PI, TAU, lerp, clamp, smooth, rng, ngon, star, arcBand, curve, arcPath, helixPath];

export const WIND = {
  katabatic: {
    title: 'A katabatic sheet slides downhill along the line and shears sideways.\nThe hero is the sheet: three stacked sails draped down a slope, each\nrolling over about its own spine on the shear, trailed by streamers.',
    pieceNote: 'A curled leaf of air: a ribbon with an S bend and a trailing tuck',
    heroNote: 'Three draped sails on a sloping spine, seven streamers and a leading lip',
    piece: (b) => {
      b.part({ crease: 55, edge: 0.3, pivot: [0, 0, 0], axis: [0, 1, 0], swing: 0.8, stage: 1 });
      b.ribbon((t) => [0.22 * Math.sin(t * PI * 1.6), t - 0.5, 0.18 * Math.sin(t * PI)], { w: (t) => 0.1 + 0.28 * Math.sin(t * PI) ** 0.7, segs: 14, twist: 0.8, up: [0, 0, 1] });
      b.part({ crease: 55, edge: 0.3, pivot: [0, -0.3, 0], axis: [0, 0, 1], swing: -0.9, stage: 1, delay: 0.2 });
      b.ribbon((t) => [0.1 * t, -0.3 - t * 0.2, 0.04], { w: (t) => 0.12 * (1 - t), segs: 6, up: [0, 0, 1] });

      // Fold ribs across the leaf and a long trailing streamer.
      b.part({ edge: 0.7 });
      for (let i = 0; i < 4; i++) b.at({ p: [0, -0.3 + i * 0.2, 0.0] }, () => b.torus(0.09 + 0.04 * Math.sin((i / 3) * PI), 0.008, { segs: 8, sides: 3, arc: PI, a0: 0 }));
      b.part({ crease: 55, edge: 0.2, glow: 0.3, pivot: [0, 0.4, 0], axis: [0, 0, 1], swing: -0.7, stage: 1, delay: 0.1 });
      b.ribbon((t) => [0.04 * Math.sin(t * 8), 0.45 + t * 0.4, 0.02], { w: (t) => 0.06 * (1 - t) + 0.005, segs: 10, up: [0, 0, 1] });
    },
    hero: (b) => {
      b.fit('mass');
      const rand = rng(61);
      // Three sails, each a ribbon that runs forward and slopes away downhill.
      for (let i = 0; i < 3; i++) {
        b.part({ crease: 50, edge: 0.35, pivot: [0, 0.5, 0.7], axis: [0, 0, 1], swing: (i - 1) * 0.55, stage: 1, delay: i * 0.1, glow: i === 1 ? 0.2 : 0 });
        b.ribbon((t) => [Math.sin(t * PI * 2 + i) * 0.1, 0.95 - i * 0.12 - Math.pow(t, 1.3) * 0.8, t * 1.5 - 0.1], { w: 1.4 - i * 0.35, segs: 26, twist: (t) => Math.sin(t * PI) * 0.15 * (i - 1), up: [0, 1, 0] });
      }
      // Streamers peel off the trailing edge.
      for (let i = 0; i < 7; i++) {
        const x = (i - 3) * 0.18;
        b.part({ crease: 55, edge: 0.2, pivot: [x, 0.4, 0.2], axis: [0, 1, 0], swing: (i - 3) * 0.14, stage: 1, delay: 0.1 + i * 0.03 });
        b.ribbon((t) => [x + Math.sin(t * 7 + i) * 0.05 * t, 0.4 - t * 0.35, 0.2 - t * 0.9], { w: (t) => 0.06 * (1 - t) + 0.01, segs: 12, up: [1, 0, 0] });
      }
      // A rolled lip on the leading edge.
      b.part({ crease: 50 });
      b.at({ p: [0, 0.9, 1.35], r: [0, 0, PI / 2] }, () => b.cylinder(0.05, 1.4, 8, { r1: 0.02 }));
    }
  },

  rotor: {
    title: 'A stack of rotors stands in the circle and throws what it catches.\nThe hero is the stack: a central mast carrying four tiers of curved\nairfoil blades, each blade pitching about its own spar as the rotors\nbite, on a stepped base.',
    pieceNote: 'A hub with three twisted airfoil blades, each pitching on its spar',
    heroNote: 'A mast, four tiers of five airfoil blades, four hubs and a stepped base',
    piece: (b) => {
      b.part({ glow: 0.4 });
      b.cylinder(0.05, 1, 6, {});
      b.part({ glow: 0.4 });
      b.at({ p: [0, 0.5, 0] }, () => b.cylinder(0.11, 0.14, 8, { r1: 0.09 }));
      b.ring(3, 0.1, (i) => {
        b.part({ pivot: [0, 0.57, 0], axis: [0, 0, 1], swing: 0.9, stage: 1, delay: i * 0.08, crease: 40 });
        b.at({ p: [0, 0.57, 0], r: [PI / 2, 0, 0] }, () => b.blade({ len: 0.42, w: 0.09, thick: 0.015, twist: 0.9, segs: 6 }));
      });
    },
    hero: (b) => {
      b.fit('mass');
      // Stepped base and mast.
      b.part();
      b.lathe([[0.7, 0], [0.7, 0.06], [0.5, 0.1], [0.5, 0.16], [0.3, 0.2], [0.1, 0.22]], 14, {});
      b.part({ glow: 0.5 });
      b.cylinder(0.07, 1.8, 8, { r1: 0.05 });
      // Four tiers, each a hub and five curved blades with their own pitch.
      for (let tier = 0; tier < 4; tier++) {
        const y = 0.45 + tier * 0.38;
        const reach = 0.95 - tier * 0.1;
        b.part({ glow: 0.3 });
        b.at({ p: [0, y, 0] }, () => b.cylinder(0.12, 0.06, 10, { r1: 0.1 }));
        b.ring(5, 0.1, (i) => {
          b.part({ pivot: [0, y, 0], axis: [0, 0, 1], swing: 0.7 + tier * 0.15, stage: 1, delay: tier * 0.07 + i * 0.01, crease: 40 });
          b.at({ p: [0, y + 0.03, 0], r: [PI / 2 + 0.1, 0, 0] }, () => b.blade({ len: reach, w: 0.13, thick: 0.018, twist: 0.8, bend: 0.1, segs: 8 }));
        }, { phase: tier * 0.45 });
      }
    }
  },

  venturi: {
    title: 'A venturi of air bars squeezes the circle, then coughs it out.\nThe hero is the nozzle: twelve curved bars tracing a throat pinched to\nhalf its width, three hoops that hold it, and a flared mouth whose\nbars kick outward on the cough.',
    pieceNote: 'A pinched nozzle ring with three flared fins',
    heroNote: 'Twelve bent bars, three hoops, six inner baffles and a mouth rim',
    piece: (b) => {
      b.part({ crease: 40 });
      b.lathe([[0.3, -0.5], [0.16, -0.05], [0.14, 0.05], [0.28, 0.5]], 10, { cap: false });
      b.ring(3, 0.28, (i) => {
        b.part({ pivot: [0, 0.5, 0], axis: [1, 0, 0], swing: 0.6, stage: 1, delay: i * 0.1 });
        b.at({ p: [0, 0.48, 0], r: [0.2, 0, 0] }, () => b.blade({ len: 0.3, w: 0.05, thick: 0.01, segs: 4 }));
      });
    },
    hero: (b) => {
      b.fit('ring');
      const radius = (t) => 1 - 0.55 * Math.sin(t * PI) * Math.sin(t * PI) ** 0.5 + 0.12 * t;
      // Twelve bars along the pinched profile; the mouth ends kick out.
      b.ring(12, 0, (i) => {
        b.part({ pivot: [0, 0.55, radius(0.5)], axis: [1, 0, 0], swing: 0.45, stage: 1, delay: (i % 4) * 0.05, glow: i % 4 === 0 ? 0.3 : 0 });
        b.tube((t) => [0, t * 1.2, radius(t)], { r: 0.022, sides: 4, segs: 16 });
      });
      // Hoops at the mouth, the throat and the exit.
      [0, 0.6, 1.2].forEach((y, i) => {
        b.part({ edge: 0.8 });
        b.at({ p: [0, y, 0] }, () => b.torus(radius(y / 1.2) + 0.01, 0.028, { segs: 36, sides: 4 }));
      });
      // Baffles: six thin vanes inside the throat.
      b.part({ crease: 30 });
      b.ring(6, 0.3, (i) => {
        b.at({ p: [0, 0.6, 0], r: [0, 0, 0] }, () => b.box(0.015, 0.34, 0.26, { center: true }));
      });
    }
  },

  crosscut: {
    title: 'A gust hinged at the hand cuts across the cast.\nThe hero is the gust blade: three nested crescent sheets of air that\nbow forward from the hand, with curled tips that whip back on the cut.',
    pieceNote: 'A small crescent shard with two curled tips',
    heroNote: 'Three nested crescents, curled tip ribbons and a hand sleeve',
    piece: (b) => {
      b.part({ crease: 55, edge: 0.5 });
      b.ribbon((t) => [Math.sin(t * PI) * 0.3 - 0.05, (t - 0.5) * 0.9, 0], { w: (t) => 0.2 * Math.sin(t * PI) ** 0.8, segs: 12, up: [0, 0, 1] });
      for (let i = 0; i < 2; i++) {
        const s = i ? 1 : -1;
        b.part({ crease: 55, pivot: [0, s * 0.42, 0], axis: [0, 0, 1], swing: s * 0.9, stage: 1, delay: 0.1 });
        b.ribbon((t) => [0.18 * Math.sin(t * 3.5) * t - 0.05, s * (0.4 + t * 0.12), 0.18 * t], { w: (t) => 0.05 * (1 - t) + 0.01, segs: 6, up: [1, 0, 0] });
      }

      // Feather barbs along the edge of the crescent.
      b.part({ glow: 0.4, pivot: [0, 0, 0], axis: [0, 0, 1], swing: -0.4, stage: 1, delay: 0.1 });
      for (let i = 0; i < 5; i++) {
        const t = 0.2 + i * 0.15;
        b.at({ p: [Math.sin(t * PI) * 0.3 - 0.05 + 0.1, (t - 0.5) * 0.9, 0], r: [0, 0, -1.1] }, () => b.blade({ len: 0.14, w: 0.02, thick: 0.006, segs: 3 }));
      }
    },
    hero: (b) => {
      b.fit('mass');
      // Three nested crescents lying in the cast plane, widest outermost.
      for (let i = 0; i < 3; i++) {
        const bow = 0.7 - i * 0.18;
        const len = 1.6 - i * 0.28;
        b.part({ crease: 55, edge: 0.45, glow: i === 2 ? 0.4 : 0, pivot: [0, 0, 0], axis: [0, 1, 0], swing: 0.25 * (i - 1), stage: 1, delay: i * 0.08 });
        b.ribbon((t) => [bow * Math.sin(t * PI) ** 0.9 * (t < 0.5 ? 1 : 1 - (t - 0.5) * 0.6), 0.1 * i, t * len], { w: (t) => (0.5 - i * 0.12) * Math.sin(t * PI) ** 0.6 + 0.02, segs: 30, up: [1, 0, 0] });
      }
      // Curled tip ribbons that whip back on the cut.
      for (let i = 0; i < 3; i++) {
        b.part({ crease: 55, edge: 0.3, pivot: [0, 0.1 * i, 1.6 - i * 0.28], axis: [0, 1, 0], swing: -0.9, stage: 1, delay: 0.2 + i * 0.05 });
        b.ribbon((t) => [0.2 * t * Math.sin(t * 4), 0.1 * i, 1.6 - i * 0.28 + t * 0.35], { w: (t) => 0.1 * (1 - t) + 0.01, segs: 10, up: [1, 0, 0] });
      }
      // Hand sleeve at the hinge.
      b.part({ glow: 0.5 });
      b.aimZ(() => b.lathe([[0.1, -0.12], [0.08, 0.0], [0.05, 0.2]], 8, {}));

      // Two slim outer crescents that open as the gust cuts.
      for (let i = 0; i < 2; i++) {
        b.part({ crease: 55, edge: 0.3, pivot: [0, 0, 0], axis: [0, 1, 0], swing: -0.3 + i * 0.5, stage: 1, delay: 0.1 + i * 0.08, glow: 0.15 });
        b.ribbon((t) => [(0.95 + i * 0.2) * Math.sin(t * PI) ** 0.9, 0.2 + i * 0.08, t * (1.9 - i * 0.2)], { w: (t) => 0.12 * Math.sin(t * PI) ** 0.6 + 0.01, segs: 30, up: [1, 0, 0] });
      }
      // A vortex curl at the root of the cut.
      b.part({ crease: 40, edge: 0.2, glow: 0.3, pivot: [0, 0.2, 0.3], axis: [0, 1, 0], swing: 0.8, stage: 1 });
      b.at({ p: [0, 0.05, 0.3] }, () => b.ribbon(helixPath(0.06, 0.32, 1.5, 0.3, 0, 0), { w: 0.07, segs: 30, up: [0, 1, 0] }));
      // Feather barbs along the main edge.
      b.part({ glow: 0.4 });
      for (let i = 0; i < 8; i++) {
        const t = 0.15 + i * 0.1;
        b.at({ p: [0.7 * Math.sin(t * PI) ** 0.9, 0.0, t * 1.6], r: [PI / 2, 0, -0.9] }, () => b.blade({ len: 0.18, w: 0.025, thick: 0.008, segs: 3 }));
      }
    }
  }
};
