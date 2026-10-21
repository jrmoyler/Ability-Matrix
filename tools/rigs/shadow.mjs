// Shadow and void rigs. See earth.mjs for the conventions.
import { RigBuilder, PI, TAU, lerp, clamp, smooth, rng, ngon, star, arcBand, curve, arcPath, helixPath } from '../../packs/sandbox/src/assets/codex/RigKit.js';
void [RigBuilder, PI, TAU, lerp, clamp, smooth, rng, ngon, star, arcBand, curve, arcPath, helixPath];

export const SHADOW = {
  penumbra: {
    title: 'A frayed shadow membrane: a sheet with no clean edge.\nThe hero is the veil: two layers of torn membrane hung from a ragged\nspine, each fraying into hanging threads, drifting past one another\nin opposite directions as it shears.',
    pieceNote: 'A torn shred of shadow with three trailing threads',
    heroNote: 'Two ragged membranes, a spine, nine hanging threads and two tatter wisps',
    piece: (b) => {
      const rand = rng(101);
      b.part({ crease: 50, edge: 0.15 });
      b.ribbon((t) => [0.05 * Math.sin(t * 6), 0.5 - t * 0.9, 0.06 * Math.sin(t * 4)], { w: (t) => 0.3 * (1 - t * 0.5) * (0.65 + 0.35 * Math.abs(Math.sin(t * 21))), segs: 14, up: [0, 0, 1] });
      for (let i = 0; i < 3; i++) {
        b.part({ crease: 50, edge: 0.1, pivot: [(i - 1) * 0.1, -0.3, 0], axis: [0, 0, 1], swing: (i - 1) * 0.6, stage: 1, delay: i * 0.1 });
        b.ribbon((t) => [(i - 1) * 0.1 + Math.sin(t * 5 + i) * 0.04, -0.3 - t * 0.28, 0], { w: (t) => 0.022 * (1 - t) + 0.004, segs: 6, up: [0, 0, 1] });
      }
    },
    hero: (b) => {
      b.fit('mass');
      const rand = rng(103);
      // The spine along the side axis.
      b.part({ glow: 0.3 });
      b.at({ p: [-1.0, 1.0, 0], r: [0, 0, -PI / 2] }, () => b.lathe([[0.03, 0], [0.04, 1], [0.02, 2]], 6, {}));
      // Two torn membranes, facing opposite ways.
      for (let layer = 0; layer < 2; layer++) {
        b.part({ crease: 55, edge: 0.15, pivot: [0, 1.0, 0], axis: [0, 1, 0], swing: layer ? -0.4 : 0.4, stage: 1, delay: layer * 0.1 });
        b.ribbon((t) => [(t - 0.5) * 2.0, 1.0 - 0.9 * 0, (layer ? 0.1 : -0.1) + 0.12 * Math.sin(t * 7 + layer * 2)], { w: 0.01, segs: 2, up: [0, 0, 1] });
        const hang = (i) => 0.55 + 0.35 * Math.abs(Math.sin(i * 1.9 + layer)) + rand() * 0.1;
        for (let i = 0; i < 10; i++) {
          const x = -0.95 + i * 0.21 + layer * 0.1;
          const len = hang(i);
          b.ribbon((t) => [x + Math.sin(t * 4 + i) * 0.04, 1.0 - t * len, (layer ? 0.1 : -0.1) + 0.12 * Math.sin((x + 1) * 3.5 + layer * 2) + t * 0.05], { w: (t) => 0.2 * (1 - t * 0.6), segs: 10, up: [0, 0, 1] });
        }
      }
      // Hanging threads from the membrane's frayed edge.
      for (let i = 0; i < 9; i++) {
        const x = -0.9 + i * 0.22;
        b.part({ crease: 55, edge: 0.1, pivot: [x, 0.4, 0], axis: [0, 0, 1], swing: Math.sin(i * 1.3) * 0.4, stage: 1, delay: 0.1 + (i % 3) * 0.05 });
        b.ribbon((t) => [x + Math.sin(t * 6 + i) * 0.04, 0.4 - t * (0.3 + 0.25 * Math.abs(Math.sin(i * 2.3))), 0.02], { w: (t) => 0.02 * (1 - t) + 0.004, segs: 8, up: [0, 0, 1] });
      }
    }
  },

  duskspire: {
    title: 'Hooked shadow talons rise out of the dusk.\nThe hero is the claw: five tapering talons curving in from a ring of\nthorns round a dark core spike, each hooked at the tip and hinged at\nits foot so the whole hand closes and opens as the spire climbs.',
    pieceNote: 'A single hooked talon with a base thorn',
    heroNote: 'Five hooked talons, a core spike, a thorn ring of twelve and a mound',
    piece: (b) => {
      b.part({ crease: 35, pivot: [0, -0.5, 0], axis: [0, 0, 1], swing: -0.4, stage: 1, glow: 0.3 });
      b.tube((t) => [Math.sin(t * PI * 0.7) * 0.28, -0.5 + t * 1.0, 0], { r: (t) => 0.1 * (1 - t) + 0.006, sides: 6, segs: 14 });
      b.part();
      b.at({ p: [-0.1, -0.5, 0.05] }, () => b.pyramid(4, 0.05, 0.2, {}));
    },
    hero: (b) => {
      b.fit('mass');
      const rand = rng(113);
      // Mound.
      b.part();
      b.lathe([[0.9, 0], [0.8, 0.07], [0.4, 0.14], [0.12, 0.18]], 12, { jag: () => 0.9 + rand() * 0.2 });
      // Core spike.
      b.part({ glow: 0.8 });
      b.lathe([[0.12, 0.1], [0.07, 0.6], [0.001, 1.5]], 5, {});
      // Five talons curving in, hooked at the tips.
      b.ring(5, 0, (i) => {
        b.part({ crease: 35, pivot: [0, 0, 0.6], axis: [1, 0, 0], swing: -0.45, stage: 1, delay: (i % 2) * 0.1, glow: 0.2 });
        b.tube((t) => [0, t * 1.5, 0.6 - 0.35 * Math.sin(t * 1.2) - Math.pow(t, 3) * 0.5 + 0.12 * t], { r: (t) => 0.1 * Math.pow(1 - t, 0.8) + 0.006, sides: 6, segs: 24 });
      });
      // A ring of thorns.
      b.part({ edge: 0.8 });
      b.ring(12, 0.95, (i) => b.at({ r: [0.25, 0, 0] }, () => b.pyramid(4, 0.05, 0.22 + (i % 3) * 0.06, {})));
    }
  },

  mournhalo: {
    title: 'A drooping mourning veil: the ring hangs its head.\nThe hero is the veil: a high hoop with twenty cloth drapes of unequal\nlength hanging from it and sagging outward, weighted by tassels, and\nthree long weeping streamers. The drapes swing out as the veil lifts.',
    pieceNote: 'A small hoop with three drooping cloth drapes',
    heroNote: 'A raised hoop, twenty drapes, twenty tassels and three weeping streamers',
    piece: (b) => {
      b.part({ edge: 0.8 });
      b.at({ p: [0, 0.4, 0] }, () => b.torus(0.18, 0.015, { segs: 14, sides: 4 }));
      for (let i = 0; i < 3; i++) {
        const a = (i / 3) * TAU;
        b.part({ crease: 50, edge: 0.1, pivot: [Math.cos(a) * 0.18, 0.4, Math.sin(a) * 0.18], axis: [-Math.sin(a), 0, Math.cos(a)], swing: 0.6, stage: 1, delay: i * 0.1 });
        b.ribbon((t) => [Math.cos(a) * (0.18 + t * 0.1), 0.4 - t * (0.6 + i * 0.1), Math.sin(a) * (0.18 + t * 0.1)], { w: 0.12 * 0.8, segs: 8, up: [Math.cos(a), 0, Math.sin(a)] });
      }
    },
    hero: (b) => {
      b.fit('ring');
      b.part({ edge: 0.8, glow: 0.2 });
      b.at({ p: [0, 1.0, 0] }, () => b.torus(0.95, 0.03, { segs: 48, sides: 5 }));
      // Twenty drapes hanging and sagging outward, lengths uneven.
      b.ring(20, 0.95, (i) => {
        const len = 0.55 + 0.35 * Math.abs(Math.sin(i * 1.7));
        b.part({ crease: 55, edge: 0.1, pivot: [0, 1.0, 0], axis: [1, 0, 0], swing: 0.5, stage: 1, delay: (i % 4) * 0.05 });
        b.ribbon((t) => [0.03 * Math.sin(t * 5 + i), 1.0 - t * len, 0.04 + 0.1 * t * t], { w: 0.28 * (1 - 0.3 * 0), segs: 8, up: [0, 0, 1] });
        b.part({ pivot: [0, 1.0, 0], axis: [1, 0, 0], swing: 0.5, stage: 1, delay: (i % 4) * 0.05, glow: 0.3 });
        b.at({ p: [0, 1.0 - len - 0.02, 0.05 + 0.1] }, () => b.pyramid(4, 0.03, -0.07, { phase: PI / 4 }));
      });
      // Three long weeping streamers.
      for (let i = 0; i < 3; i++) {
        const a = (i / 3) * TAU + 0.4;
        b.part({ crease: 55, edge: 0.1, glow: 0.2, pivot: [Math.cos(a) * 0.95, 1.0, Math.sin(a) * 0.95], axis: [-Math.sin(a), 0, Math.cos(a)], swing: 0.7, stage: 1, delay: 0.2 });
        b.ribbon((t) => [Math.cos(a) * (0.95 + t * 0.12), 1.0 - t * 1.15, Math.sin(a) * (0.95 + t * 0.12)], { w: (t) => 0.06 * (1 - t) + 0.01, segs: 14, up: [Math.cos(a), 0, Math.sin(a)] });
      }
    }
  },

  nullwell: {
    title: 'An inverted empty throat: the floor forgets to be a floor.\nThe hero is the throat: a thick collar with a funnel hung inside it\npoint-down, five blades bent inward to the point, and a hovering shell\nof rings that tighten as the well drinks and flare on the exhale.',
    pieceNote: 'A tiny hanging funnel inside a collar',
    heroNote: 'A collar, a hanging funnel, five inward blades and four tightening rings',
    piece: (b) => {
      b.part({ edge: 0.8 });
      b.at({ p: [0, 0.3, 0] }, () => b.torus(0.3, 0.03, { segs: 16, sides: 5 }));
      b.part({ crease: 30 });
      b.at({ p: [0, 0.3, 0] }, () => b.lathe([[0.3, 0], [0.24, -0.2], [0.1, -0.5], [0.02, -0.7]], 12, { cap: false }));
      for (let i = 0; i < 3; i++) {
        b.part({ pivot: [0, 0.3, 0], axis: [0, 0, 1], swing: -0.5, stage: 1, delay: i * 0.1 });
        b.at({ p: [0, 0.3, 0], r: [0, (i / 3) * TAU, 0] }, () => b.at({ p: [0.28, 0, 0], r: [0, 0, 0.3] }, () => b.blade({ len: 0.4, w: 0.03, thick: 0.01, segs: 4 })));
      }
    },
    hero: (b) => {
      b.fit('ring');
      // The collar.
      b.part({ edge: 0.8 });
      b.at({ p: [0, 0.18, 0] }, () => b.torus(0.9, 0.08, { segs: 40, sides: 6 }));
      // The funnel: wide at the collar, narrowing to a point below.
      b.part({ crease: 30, edge: 0.3 });
      b.at({ p: [0, 1.0, 0] }, () => b.lathe([[0.88, 0.05], [0.7, -0.15], [0.44, -0.45], [0.2, -0.72], [0.05, -0.95]], 28, { cap: false }));
      // Five blades bent inward to the point.
      b.ring(5, 0.8, (i) => {
        b.part({ pivot: [0, 1.0, 0], axis: [1, 0, 0], swing: -0.5, stage: 1, delay: (i % 2) * 0.1, glow: 0.3 });
        b.at({ p: [0, 1.02, 0], r: [-0.5, 0, 0] }, () => b.blade({ len: 0.8, w: 0.08, thick: 0.014, segs: 5 }));
      });
      // Rings that tighten.
      [0.86, 0.62, 0.38, 0.18].forEach((r, i) => {
        b.part({ pivot: [r, 1.0 - i * 0.22, 0], axis: [0, 0, 1], swing: 0.35, stage: 1, delay: i * 0.08, edge: 0.8, glow: i === 3 ? 0.6 : 0.1 });
        b.at({ p: [0, 1.0 - i * 0.24, 0] }, () => b.torus(r, 0.016, { segs: 28, sides: 4 }));
      });
    }
  },

  eventcage: {
    title: 'Inward event-horizon hooks: bars that curl toward the point of no return.\nThe hero is the horizon: nine hooked bars rising from a base ring and\ncurling inward at the crown, an event-horizon ring wrapped round the\nwaist, and a dark core ringed by a flat accretion band.',
    pieceNote: 'A hooked bar curling over a bead',
    heroNote: 'Nine hooks, a base ring, a horizon ring, a dark core and an accretion band',
    piece: (b) => {
      b.part({ pivot: [0, -0.5, 0], axis: [0, 0, 1], swing: -0.45, stage: 1 });
      b.tube((t) => [Math.sin(Math.pow(t, 2.2) * PI * 0.9) * 0.3, -0.5 + t * 0.9, 0], { r: (t) => 0.04 * (1 - t * 0.6), sides: 5, segs: 14 });
      b.part({ glow: 0.5 });
      b.at({ p: [0.04, 0.05, 0] }, () => b.orb(0.07, { sides: 6, rings: 3 }));
    },
    hero: (b) => {
      b.fit('ring');
      b.part({ edge: 0.7 });
      b.torus(1, 0.035, { segs: 40, sides: 4 });
      b.ring(9, 0, (i) => {
        b.part({ pivot: [0, 0, 1], axis: [1, 0, 0], swing: -0.5, stage: 1, delay: (i % 3) * 0.06, glow: i % 3 === 0 ? 0.3 : 0 });
        b.tube((t) => [0, t * 1.2, 1 - 0.6 * Math.pow(t, 2.4) - 0.05 * Math.sin(t * 5)], { r: (t) => 0.045 * (1 - 0.55 * t), sides: 5, segs: 22 });
      });
      // The event horizon ring at the waist and a dark core with its accretion band.
      b.part({ glow: 0.5, edge: 0.9 });
      b.at({ p: [0, 0.65, 0] }, () => b.torus(0.72, 0.02, { segs: 36, sides: 4 }));
      b.part({ glow: 0.1 });
      b.at({ p: [0, 0.55, 0] }, () => b.orb(0.2, { sides: 10, rings: 5 }));
      b.part({ glow: 0.9, pivot: [0, 0.55, 0], axis: [1, 0, 0], swing: 0.5, stage: 1 });
      b.at({ p: [0, 0.55, 0] }, () => b.lathe([[0.26, -0.01], [0.5, 0], [0.26, 0.01]], 30, { cap: false }));
    }
  },

  absence: {
    title: 'A split erasure edge: the lance is the gap it leaves.\nThe hero is the absence: a blade cleft along its whole length into two\nhalves with nothing between them, each half bowed away from the cut,\nand the crumbs of erased matter hanging in the gap. The halves part\nfurther on the beat.',
    pieceNote: 'Two thin blade halves with a diamond of nothing between them',
    heroNote: 'Two cleft blade halves, a hilt, four erased fragments and a notch collar',
    piece: (b) => {
      for (let i = 0; i < 2; i++) {
        const s = i ? 1 : -1;
        b.part({ pivot: [0, -0.45, 0], axis: [0, 0, 1], swing: -s * 0.3, stage: 1, glow: 0.2 });
        b.at({ p: [s * 0.045, -0.5, 0] }, () => b.blade({ len: 1, w: 0.04, thick: 0.015, bend: 0, segs: 6 }));
      }
      b.part({ glow: 0.9 });
      b.at({ p: [0, 0, 0] }, () => b.orb(0.03, { sides: 4, rings: 2, ey: 1.6 }));
    },
    hero: (b) => {
      b.fit('mass');
      b.aimZ(() => {
        // Two halves of one blade: mirrored, each bowed away from the cleft.
        for (let i = 0; i < 2; i++) {
          const s = i ? 1 : -1;
          b.part({ pivot: [0, 0.1, 0], axis: [0, 0, 1], swing: -s * 0.22, stage: 1, glow: 0.2 });
          b.at({ p: [s * 0.075, 0.1, 0] }, () => b.blade({ len: 1.8, w: 0.075, thick: 0.02, bend: s * -0.06, segs: 12, shape: (t) => Math.sin(Math.PI * Math.pow(t, 0.55)) * (1 - 0.35 * t) }));
        }
        // Hilt and notch collar.
        b.part({ edge: 0.8 });
        b.lathe([[0.07, 0.12], [0.05, 0], [0.05, -0.3], [0.09, -0.36], [0.001, -0.42]], 8, {});
        b.torus(0.18, 0.02, { segs: 18, sides: 4 });
        // Erased crumbs hanging in the gap.
        for (let i = 0; i < 4; i++) {
          b.part({ glow: 0.9, pivot: [0, 0.5 + i * 0.3, 0], axis: [1, 0, 0], swing: (i % 2 ? 1 : -1) * 0.9, stage: 1, delay: i * 0.07 });
          b.at({ p: [0, 0.4 + i * 0.35, 0] }, () => b.orb(0.035, { sides: 4, rings: 2, ey: 1.6 }));
        }
      });
    }
  },

  hollowvolley: {
    title: 'Hollow implosion cups: shells that are mostly the space inside them.\nThe hero is the nest: three open cups set mouth-forward one inside\nanother, each smaller than the last, spaced along the flight, their\nrims flaring wider as they inhale and the whole nest twisting.',
    pieceNote: 'A single hollow cup with a thin rim',
    heroNote: 'Three nested open cups, three rims, a hollow centre rod and a rear hook',
    piece: (b) => {
      b.part({ crease: 30, pivot: [0, 0.2, 0], axis: [0, 0, 1], swing: 0.4, stage: 1 });
      b.lathe([[0.001, -0.45], [0.18, -0.38], [0.3, -0.1], [0.34, 0.3]], 10, { cap: false });
      b.part({ edge: 1, glow: 0.4, pivot: [0, 0.3, 0], axis: [1, 0, 0], swing: 0.4, stage: 1 });
      b.at({ p: [0, 0.3, 0] }, () => b.torus(0.34, 0.018, { segs: 16, sides: 4 }));
    },
    hero: (b) => {
      b.fit('mass');
      b.aimZ(() => {
        // Three nested cups, mouth toward +z after aimZ.
        [[0.55, 0.9], [0.4, 0.55], [0.26, 0.28]].forEach(([r, h], i) => {
          const base = -0.2 + i * 0.4;
          b.part({ crease: 30, pivot: [0, base + h, 0], axis: [1, 0, 0], swing: 0.3 + i * 0.1, stage: 1, delay: i * 0.08 });
          b.at({ p: [0, base, 0] }, () => b.lathe([[0.001, 0], [r * 0.5, h * 0.12], [r * 0.85, h * 0.5], [r, h]], 20, { cap: false }));
          b.part({ edge: 1, glow: 0.3 + 0.2 * i, pivot: [0, base + h, 0], axis: [1, 0, 0], swing: 0.3 + i * 0.1, stage: 1, delay: i * 0.08 });
          b.at({ p: [0, base + h, 0] }, () => b.torus(r, 0.02, { segs: 24, sides: 4 }));
        });
        // The hollow centre: a thin open rod.
        b.part({ edge: 0.7 });
        b.lathe([[0.03, -0.3], [0.03, 1.1]], 6, { cap: false });
        // The rear hook that drags the nest.
        b.part({ glow: 0.5 });
        b.tube((t) => [Math.sin(t * 2.6) * 0.18, -0.3 - t * 0.35, 0], { r: 0.018, sides: 4, segs: 8 });
      });
    }
  },

  riftpendulum: {
    title: 'A bifurcated rift sickle: one blade, cut in two, hinged at the hand.\nThe hero is the sickle: two crescent halves bowing apart from a\nsingle hilt with a rift of nothing between them, hung with shards\nof torn edge that separate as the pendulum swings through.',
    pieceNote: 'A thin sickle in two halves with a spark of rift between them',
    heroNote: 'Two bowed crescent halves, a hilt, a rift seam and six torn shards',
    piece: (b) => {
      for (let i = 0; i < 2; i++) {
        const s = i ? 1 : -1;
        b.part({ crease: 40, pivot: [0, -0.4, 0], axis: [0, 0, 1], swing: -s * 0.4, stage: 1, glow: 0.2 });
        b.tube((t) => [s * (0.03 + Math.sin(t * PI) * 0.15), -0.45 + t * 0.9, 0], { r: (t) => 0.03 * Math.sin(t * PI) + 0.004, sides: 4, segs: 12 });
      }
      b.part({ glow: 1 });
      b.at({ p: [0, 0.05, 0] }, () => b.orb(0.03, { sides: 4, rings: 2, ey: 1.7 }));
    },
    hero: (b) => {
      b.fit('mass');
      // Two halves, each a crescent ribbon bowing away from the rift.
      for (let i = 0; i < 2; i++) {
        const s = i ? 1 : -1;
        b.part({ crease: 40, edge: 0.6, glow: 0.15, pivot: [0, 0, 0], axis: [0, 1, 0], swing: -s * 0.38, stage: 1 });
        b.ribbon((t) => [s * (0.03 + 0.45 * Math.sin(t * PI * 0.95) * (1 - 0.3 * t)), 0, t * 1.55], { w: (t) => 0.3 * Math.sin(t * PI) ** 0.6 + 0.02, segs: 28, thick: 0.014, up: [1, 0, 0] });
      }
      // Hilt.
      b.part({ edge: 0.8 });
      b.aimZ(() => b.lathe([[0.07, 0.12], [0.045, -0.02], [0.05, -0.25], [0.08, -0.3], [0.001, -0.36]], 8, {}));
      // Rift seam: a thin bright wedge down the middle.
      b.part({ glow: 1 });
      b.at({ p: [0, 0, 0.1], r: [PI / 2, 0, 0] }, () => b.lathe([[0.001, 0], [0.012, 0.5], [0.008, 1.2], [0.001, 1.4]], 4, { phase: PI / 4 }));
      // Torn shards that drift apart on the swing.
      for (let i = 0; i < 6; i++) {
        const s = i % 2 ? 1 : -1;
        b.part({ glow: 0.5, pivot: [0, 0, 0.3 + i * 0.2], axis: [0, 0, 1], swing: s * 1.0, stage: 1, delay: i * 0.05 });
        b.at({ p: [0, 0, 0.3 + i * 0.2], r: [0, i, 0] }, () => b.pyramid(3, 0.04, 0.14, {}));
      }
    }
  },

  quietus: {
    title: 'An inverted serrated iris: the circle closes like an eye that has seen enough.\nThe hero is the iris: twelve overlapping serrated blades laid flat round\nthe rim, each rotating in toward the pupil on its own pin as the iris\ncloses, with a pupil ring and a dark hub.',
    pieceNote: 'Four overlapping serrated leaves on a pin',
    heroNote: 'Twelve serrated iris leaves, an outer housing, a pupil ring and a hub',
    piece: (b) => {
      for (let i = 0; i < 4; i++) {
        b.part({ pivot: [0.2, 0, 0], axis: [0, 1, 0], swing: 0.8, stage: 1, delay: i * 0.07 });
        b.at({ r: [0, (i / 4) * TAU, 0] }, () => b.prism([[0.08, -0.04], [0.32, -0.12], [0.34, 0.02], [0.3, 0.1], [0.08, 0.05]], i * 0.018, i * 0.018 + 0.02, {}));
      }
      b.part({ glow: 0.8 });
      b.cylinder(0.04, 0.12, 6, {});
    },
    hero: (b) => {
      b.fit('ring');
      b.part({ edge: 0.8 });
      b.torus(1.0, 0.045, { segs: 48, sides: 5 });
      // Twelve serrated leaves; each swings its tip inward about its outer pin.
      b.ring(12, 0.9, (i) => {
        b.part({ pivot: [0, 0, 0], axis: [0, 1, 0], swing: 0.55, stage: 1, delay: (i % 3) * 0.05, glow: i % 4 === 0 ? 0.2 : 0 });
        const leaf = [[0.0, -0.07], [-0.55, -0.1], [-0.5, -0.02], [-0.58, 0.03], [-0.52, 0.1], [-0.3, 0.14], [0.0, 0.1]];
        b.at({ p: [0, i * 0.008, 0], r: [0, -PI / 2, 0] }, () => b.prism(leaf, 0, 0.025, {}));
      });
      b.part({ glow: 0.9 });
      b.at({ p: [0, 0.05, 0] }, () => b.torus(0.3, 0.025, { segs: 28, sides: 5 }));
      b.part({ glow: 0.1 });
      b.at({ p: [0, 0.03, 0] }, () => b.cylinder(0.2, 0.06, 14, {}));
    }
  },

  unspire: {
    title: 'Reverse corkscrew spires: a tower that screws itself out of the ground.\nThe hero is the unspire: an inverted tower wider at the crown than the\nfoot, three corkscrews winding the wrong way round it, a capstone\ndisc and a stepped foot. The whole stack unscrews about its axis.',
    pieceNote: 'A small inverted tower with one corkscrew',
    heroNote: 'An inverted twisting tower, three reverse corkscrews, a capstone and a stepped foot',
    piece: (b) => {
      b.part({ pivot: [0, 0, 0], axis: [0, 1, 0], swing: -1.0, stage: 1 });
      b.lathe([[0.04, -0.5], [0.12, 0], [0.24, 0.5]], 5, { phase: 0.3, twist: -2.5 });
      b.part({ glow: 0.5, pivot: [0, 0, 0], axis: [0, 1, 0], swing: 1.0, stage: 1 });
      b.tube(helixPath(0.1, 0.34, 1.6, 1.0, -0.5, 0), { r: 0.018, sides: 4, segs: 24 });
    },
    hero: (b) => {
      b.fit('mass');
      b.part();
      b.lathe([[0.55, 0], [0.5, 0.06], [0.3, 0.1], [0.2, 0.14]], 10, {});
      // The inverted tower: narrow at the foot, wide at the crown, twisting left.
      b.part({ glow: 0.2, pivot: [0, 0, 0], axis: [0, 1, 0], swing: -1.0, stage: 1 });
      b.lathe([[0.001, 0.12], [0.08, 0.2], [0.18, 0.8], [0.3, 1.4], [0.42, 1.8]], 6, { phase: 0.3, twist: -2.2 });
      // Three corkscrews winding the wrong way round it.
      for (let i = 0; i < 3; i++) {
        b.part({ glow: 0.3, pivot: [0, 0, 0], axis: [0, 1, 0], swing: 1.0, stage: 1, delay: i * 0.06 });
        b.tube(helixPath(0.16, 0.6, 2.2, 1.7, 0.15, (i / 3) * TAU), { r: 0.025, sides: 5, segs: 56 });
      }
      b.part({ glow: 0.9 });
      b.at({ p: [0, 1.82, 0] }, () => b.cylinder(0.55, 0.05, 6, { r1: 0.4 }));
    }
  }
};
