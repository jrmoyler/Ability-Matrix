// Sound rigs. See earth.mjs for the conventions.
import { RigBuilder, PI, TAU, lerp, clamp, smooth, rng, ngon, star, arcBand, curve, arcPath, helixPath } from '../../packs/sandbox/src/assets/codex/RigKit.js';
void [RigBuilder, PI, TAU, lerp, clamp, smooth, rng, ngon, star, arcBand, curve, arcPath, helixPath];

export const SOUND = {
  subtone: {
    title: 'A held subtone drills the line as a visible bore.\nThe hero is the bore: a hollow barrel with nine compression rings\nstacked along it, each wobbling out of phase as the note builds, and a\nflared speaker cone behind.',
    pieceNote: 'Three compression rings stacked on a hollow core, each tilting out of phase',
    heroNote: 'A hollow barrel, nine wobbling compression rings and a flared rear cone',
    piece: (b) => {
      b.part({ edge: 0.6 });
      b.cylinder(0.07, 1, 8, { r1: 0.07, cap: false });
      for (let i = 0; i < 3; i++) {
        b.part({ pivot: [0, 0.2 + i * 0.3, 0], axis: [1, 0, 0], swing: (i % 2 ? -1 : 1) * 0.5, stage: 1, delay: i * 0.1, glow: i === 1 ? 0.4 : 0 });
        b.at({ p: [0, 0.2 + i * 0.3, 0] }, () => b.torus(0.2 + i * 0.07, 0.022, { segs: 16, sides: 5 }));
      }
    },
    hero: (b) => {
      b.fit('mass');
      b.aimZ(() => {
        // The barrel: an open bore you can see through.
        b.part({ edge: 0.7 });
        b.lathe([[0.1, 0], [0.1, 0.4], [0.075, 0.9], [0.06, 1.5]], 10, { cap: false });
        // Compression rings, widest at the mouth, each wobbling out of phase.
        for (let i = 0; i < 9; i++) {
          const y = 0.1 + i * 0.16;
          b.part({ pivot: [0, y, 0], axis: [Math.cos(i * 0.9), 0, Math.sin(i * 0.9)], swing: (i % 2 ? -1 : 1) * 0.35, stage: 1, delay: i * 0.05, glow: i % 3 === 0 ? 0.35 : 0, edge: 0.9 });
          b.at({ p: [0, y, 0] }, () => b.torus(0.2 + 0.11 * Math.sin((i / 8) * PI) + 0.03, 0.02, { segs: 20, sides: 5 }));
        }
        // The speaker cone behind: a flared bell.
        b.part({ glow: 0.4 });
        b.lathe([[0.1, 0], [0.16, -0.08], [0.3, -0.2], [0.46, -0.36]], 14, { cap: false });
      });
    }
  },

  clangor: {
    title: 'Bars of clangor drop and ring the circle inward.\nThe hero is the carillon: ten tubular bars of descending length hung\nfrom a crown ring on cords, each swinging in to strike a central\nclapper that hangs on its own hinge.',
    pieceNote: 'A tubular chime bar hung from a cord with a small striker',
    heroNote: 'A crown ring, ten hung chime bars, ten cords and a central swinging clapper',
    piece: (b) => {
      b.part({ pivot: [0, 0.5, 0], axis: [0, 0, 1], swing: 0.4, stage: 1 });
      b.at({ p: [0, 0.5, 0] }, () => b.tube((t) => [0, -t * 0.2, 0], { r: 0.008, sides: 4, segs: 2 }));
      b.at({ p: [0, -0.5, 0] }, () => b.box(0.1, 0.78, 0.1, {}));
      b.part({ glow: 0.5, pivot: [0, 0.3, 0], axis: [1, 0, 0], swing: -0.7, stage: 1, delay: 0.15 });
      b.at({ p: [0.12, -0.05, 0] }, () => b.orb(0.07, { sides: 6, rings: 3 }));

      // A second, shorter chime on its own cord and a crown ring above.
      b.part({ edge: 0.8 });
      b.at({ p: [0, 0.52, 0] }, () => b.torus(0.12, 0.012, { segs: 12, sides: 4 }));
      b.part({ pivot: [0.12, 0.5, 0], axis: [0, 0, 1], swing: 0.5, stage: 1, delay: 0.1 });
      b.at({ p: [0.12, 0.5, 0] }, () => b.tube((t) => [0, -t * 0.12, 0], { r: 0.007, sides: 4, segs: 2 }));
      b.at({ p: [0.12, -0.18, 0] }, () => b.box(0.07, 0.52, 0.07, { taper: [0.9, 0.9] }));
    },
    hero: (b) => {
      b.fit('ring');
      // Crown ring the bars hang from.
      b.part({ edge: 0.7 });
      b.at({ p: [0, 1.25, 0] }, () => b.torus(0.95, 0.03, { segs: 40, sides: 5 }));
      // Ten chime bars: lengths step down like a scale.
      b.ring(10, 0.95, (i) => {
        const len = 0.9 - (i % 5) * 0.12;
        b.part({ pivot: [0, 1.25, 0], axis: [1, 0, 0], swing: -0.45, stage: 1, delay: (i % 5) * 0.06, glow: i % 5 === 0 ? 0.3 : 0 });
        b.at({ p: [0, 1.25, 0] }, () => b.tube((t) => [0, -t * 0.1, 0], { r: 0.007, sides: 4, segs: 2 }));
        b.at({ p: [0, 1.15 - len, 0] }, () => b.box(0.09, len, 0.09, { taper: [0.9, 0.9] }));
        b.at({ p: [0, 1.15 - len - 0.03, 0] }, () => b.pyramid(4, 0.05, -0.05, {}));
      });
      // The clapper hangs from the middle of the crown on a chain of three links.
      b.part({ pivot: [0, 1.25, 0], axis: [1, 0, 0], swing: 0.5, stage: 1, delay: 0.2, glow: 0.8 });
      b.at({ p: [0, 1.25, 0] }, () => {
        b.tube((t) => [0, -t * 0.5, 0], { r: 0.012, sides: 4, segs: 6 });
        b.at({ p: [0, -0.62, 0] }, () => b.orb(0.14, { sides: 8, rings: 4, ey: 1.3 }));
      });
    }
  },

  overtone: {
    title: 'Overtones walk the rim and collapse onto the fundamental.\nThe hero is the standing wave: a heavy fundamental ring and three\novertone rings rippling with two, three and four lobes, spiked at their\nnodes, each tilting in as the harmonics collapse.',
    pieceNote: 'A three-lobed ring with a bead at each antinode',
    heroNote: 'The fundamental, three rippled overtone rings and nodal spikes',
    piece: (b) => {
      b.part({ pivot: [0.3, 0, 0], axis: [0, 0, 1], swing: 0.5, stage: 1, glow: 0.3 });
      b.at({ r: [PI / 2, 0, 0] }, () => b.tube((t) => [Math.cos(t * TAU) * (0.3 + 0.07 * Math.sin(t * TAU * 3)), Math.sin(t * TAU) * (0.3 + 0.07 * Math.sin(t * TAU * 3)), 0.06 * Math.sin(t * TAU * 3)], { r: 0.022, sides: 5, segs: 30, closed: true }));
      b.part({ glow: 0.8 });
      b.ring(3, 0.3, () => b.orb(0.045, { sides: 5, rings: 3 }), { y: 0.1 });
    },
    hero: (b) => {
      b.fit('ring');
      // The fundamental: one heavy ring.
      b.part({ glow: 0.5 });
      b.torus(1, 0.05, { segs: 48, sides: 6 });
      // Overtones: n lobes, radius falling, each tilting in on the collapse.
      [[2, 0.78], [3, 0.58], [4, 0.4]].forEach(([n, R], k) => {
        b.part({ pivot: [R, 0.12, 0], axis: [0, 0, 1], swing: 0.45 + k * 0.1, stage: 1, delay: k * 0.12, glow: k === 2 ? 0.5 : 0, edge: 0.8 });
        b.at({ p: [0, 0.14 + k * 0.1, 0] }, () => b.tube((t) => {
          const a = t * TAU;
          const r = R + 0.08 * Math.sin(a * n);
          return [Math.cos(a) * r, 0.1 * Math.cos(a * n), Math.sin(a) * r];
        }, { r: 0.022, sides: 5, segs: 60, closed: true }));
        // Spikes at the nodes of this ring.
        b.ring(n * 2, R, (i) => b.pyramid(4, 0.03, 0.2 + k * 0.03, {}), { y: 0.14 + k * 0.1 });
      });
    }
  },

  whisperwell: {
    title: 'A well of whisper inhales the circle, then shouts straight up.\nThe hero is the horn: a deep flared bell sunk in the floor, three\nspiral channels winding up its throat, eight lip petals that peel\nopen, and the shout pipe standing in the middle.',
    pieceNote: 'A tiny horn with a rolled lip and a straight shout rod',
    heroNote: 'A flared bell, three throat spirals, eight lip petals and a shout pipe',
    piece: (b) => {
      b.part({ crease: 35 });
      b.lathe([[0.04, -0.5], [0.06, -0.3], [0.12, -0.1], [0.24, 0.12], [0.4, 0.3]], 10, { cap: false });
      for (let i = 0; i < 3; i++) {
        b.part({ pivot: [0.3, 0.28, 0], axis: [0, 0, 1], swing: -0.7, stage: 1, delay: i * 0.1 });
        b.at({ p: [0, 0.3, 0], r: [0, (i / 3) * TAU, 0] }, () => b.at({ p: [0.38, 0, 0] }, () => b.blade({ len: 0.2, w: 0.06, thick: 0.01, segs: 4 })));
      }
    },
    hero: (b) => {
      b.fit('ring');
      // The bell: slow at first, then flaring wide at the mouth.
      b.part({ crease: 30, edge: 0.4 });
      b.lathe([[0.08, 0], [0.1, 0.12], [0.14, 0.26], [0.22, 0.4], [0.38, 0.54], [0.62, 0.66], [0.9, 0.74]], 24, { cap: false });
      // Three spiral channels climbing the throat.
      for (let i = 0; i < 3; i++) {
        b.part({ edge: 0.9, glow: 0.2 });
        b.ribbon(helixPath(0.12, 0.8, 1.2, 0.7, 0.02, (i / 3) * TAU), { w: 0.07, segs: 30, up: [0, 1, 0] });
      }
      // Lip petals peel outward on the shout.
      b.ring(8, 0.9, (i) => {
        b.part({ pivot: [0, 0.74, 0], axis: [1, 0, 0], swing: 0.85, stage: 1, delay: (i % 2) * 0.1, glow: 0.25 });
        b.at({ p: [0, 0.74, 0], r: [-0.3, 0, 0] }, () => b.blade({ len: 0.34, w: 0.13, thick: 0.014, segs: 5 }));
      });
      // The shout pipe: an open tube standing in the middle.
      b.part({ glow: 0.7 });
      b.lathe([[0.07, 0], [0.07, 1.3], [0.1, 1.4]], 10, { cap: false });
    }
  },

  cadence: {
    title: 'Beats arc down the line and detonate on the downbeat.\nThe hero is the phrase: three ribbed beat capsules strung nose to tail,\neach one smaller than the last, bending against each other as they\ndescend, with the downbeat ring locked around the leader.',
    pieceNote: 'A single ribbed capsule with a bead on its nose',
    heroNote: 'Three ribbed capsules in a bending chain, rib rings and a downbeat collar',
    piece: (b) => {
      b.part({ glow: 0.3, pivot: [0, 0, 0], axis: [1, 0, 0], swing: 0.25, stage: 1 });
      b.lathe([[0.001, 0.5], [0.13, 0.42], [0.17, 0.2], [0.17, -0.2], [0.13, -0.42], [0.001, -0.5]], 10, { crease: 40 });
      b.part({ edge: 0.8, pivot: [0, 0, 0], axis: [1, 0, 0], swing: 0.25, stage: 1 });
      [-0.12, 0.12].forEach((y) => b.at({ p: [0, y, 0] }, () => b.torus(0.175, 0.014, { segs: 14, sides: 4 })));
      b.part({ pivot: [0, 0.45, 0], axis: [0, 0, 1], swing: 0.6, stage: 1 });
      b.at({ p: [0, 0.54, 0] }, () => b.orb(0.05, { sides: 5, rings: 3 }));
    },
    hero: (b) => {
      b.fit('mass');
      b.aimZ(() => {
        // Three capsules, nose to tail, each smaller, each hinged on the last.
        [0.2, 0.15, 0.11].forEach((r, i) => {
          const y = 0.55 - i * 0.72;
          b.part({ crease: 40, pivot: [0, y + 0.5 * r / 0.2, 0], axis: [Math.cos(i * 2), 0, Math.sin(i * 2)], swing: (i % 2 ? -1 : 1) * 0.28 * (i + 1), stage: 1, delay: i * 0.1, glow: i === 0 ? 0.45 : 0.15 });
          b.at({ p: [0, y, 0] }, () => b.lathe([[0.001, 0.32 * r / 0.2], [r * 0.75, 0.26 * r / 0.2], [r, 0.12 * r / 0.2], [r, -0.12 * r / 0.2], [r * 0.75, -0.26 * r / 0.2], [0.001, -0.32 * r / 0.2]], 10, {}));
          b.part({ edge: 0.8 });
          [-0.08, 0.08].forEach((o) => b.at({ p: [0, y + o * r / 0.2, 0] }, () => b.torus(r * 1.02, 0.012, { segs: 14, sides: 4 })));
          if (i < 2) {
            b.part();
            b.at({ p: [0, y - 0.38, 0] }, () => b.tube((t) => [0, -t * 0.2, 0], { r: 0.012, sides: 4, segs: 2 }));
          }
        });
        // The downbeat collar around the leader.
        b.part({ glow: 0.9, edge: 1 });
        b.at({ p: [0, 0.55, 0] }, () => b.torus(0.3, 0.025, { segs: 22, sides: 5 }));
      });
    }
  },

  glissando: {
    title: 'A glissando sheet slides sideways and arrives late.\nThe hero is the comb: twelve fins climbing in height like a rising\nscale along a rail, each tipping over a step after its neighbour so the\nmotion runs across the sheet like a slide, under a travelling wave.',
    pieceNote: 'A five-key comb rising in height, each key tipping a step late',
    heroNote: 'A rail, twelve rising fins, a travelling wave ribbon and a bridge at each end',
    piece: (b) => {
      b.part();
      b.box(0.62, 0.04, 0.08, {});
      for (let i = 0; i < 5; i++) {
        b.part({ pivot: [(i - 2) * 0.12, 0.04, 0], axis: [0, 0, 1], swing: -0.5, stage: 1, delay: i * 0.08, glow: i === 4 ? 0.4 : 0 });
        b.at({ p: [(i - 2) * 0.12, 0.04, 0] }, () => b.box(0.05, 0.25 + i * 0.12, 0.04, { taper: [0.8, 1] }));
      }
    },
    hero: (b) => {
      b.fit('mass');
      // Rail.
      b.part({ edge: 0.7 });
      b.at({ p: [0, 0.04, 0] }, () => b.box(2.7, 0.07, 0.14, {}));
      // Twelve fins: each taller than the last, each tipping over a step later.
      for (let i = 0; i < 12; i++) {
        const x = (i - 5.5) * 0.22;
        b.part({ pivot: [x, 0.08, 0], axis: [0, 0, 1], swing: -0.55, stage: 1, delay: i * 0.04, glow: i % 4 === 3 ? 0.4 : 0 });
        b.at({ p: [x, 0.08, 0] }, () => b.box(0.14, 0.3 + i * 0.07, 0.04, { taper: [0.75, 1] }));
      }
      // A wave ribbon travelling above the tips.
      b.part({ crease: 55, edge: 0.3, glow: 0.3 });
      b.ribbon((t) => [(t - 0.5) * 2.5, 1.0 + 0.1 * Math.sin(t * 9), 0], { w: 0.1, segs: 40, up: [0, 0, 1] });
      // Bridges at the two ends.
      b.part();
      [-1.3, 1.3].forEach((x) => b.at({ p: [x, 0, 0] }, () => b.cylinder(0.06, 0.22, 6, { r1: 0.04 })));

      // A cap on every fin, tipping with it, and a string from each to the wave.
      for (let i = 0; i < 12; i++) {
        const x = (i - 5.5) * 0.22;
        b.part({ pivot: [x, 0.08, 0], axis: [0, 0, 1], swing: -0.55, stage: 1, delay: i * 0.04, glow: 0.8 });
        b.at({ p: [x, 0.38 + i * 0.07, 0] }, () => b.pyramid(4, 0.06, 0.1, { phase: PI / 4 }));
      }
      b.part({ edge: 0.5 });
      for (let i = 0; i < 12; i++) {
        const x = (i - 5.5) * 0.22;
        b.tube((t) => [x, lerp(0.5 + i * 0.07, 1.0 + 0.1 * Math.sin((i / 11) * 9), t), 0], { r: 0.005, sides: 3, segs: 2 });
      }
    }
  }
};
