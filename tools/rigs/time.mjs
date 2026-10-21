// Time and motion rigs. See earth.mjs for the conventions.
import { RigBuilder, PI, TAU, lerp, clamp, smooth, rng, ngon, star, arcBand, curve, arcPath, helixPath } from '../../packs/sandbox/src/assets/codex/RigKit.js';
void [RigBuilder, PI, TAU, lerp, clamp, smooth, rng, ngon, star, arcBand, curve, arcPath, helixPath];

export const TIME = {
  latebolt: {
    title: 'Back-swept hourglass darts: the bolt that arrives after its own sound.\nThe hero is the late bolt: a small hourglass body carrying a thread of\nfalling sand, three back-swept fins that lag behind it, and a clock\nhand on a face behind the dart that ticks round as it falls.',
    pieceNote: 'A stubby hourglass with a bead of sand',
    heroNote: 'An hourglass dart, a sand thread, three swept fins and a clock face with a hand',
    piece: (b) => {
      b.part({ glow: 0.4, crease: 25 });
      b.lathe([[0.001, -0.5], [0.2, -0.45], [0.2, -0.2], [0.03, 0], [0.2, 0.2], [0.2, 0.45], [0.001, 0.5]], 10, {});
      b.part({ glow: 1 });
      b.at({ p: [0, -0.28, 0] }, () => b.orb(0.05, { sides: 5, rings: 3 }));
      b.part({ edge: 0.9, pivot: [0, 0, 0], axis: [0, 0, 1], swing: 0.8, stage: 1 });
      b.at({ p: [0, 0.5, 0] }, () => b.torus(0.2, 0.015, { segs: 14, sides: 4 }));
    },
    hero: (b) => {
      b.fit('mass');
      b.aimZ(() => {
        // Two glass bulbs meeting at a waist.
        b.part({ glow: 0.4, crease: 25 });
        b.lathe([[0.001, -0.55], [0.22, -0.5], [0.26, -0.25], [0.04, 0.0], [0.26, 0.25], [0.22, 0.5], [0.001, 0.55]], 14, {});
        // Sand falling through the waist.
        b.part({ glow: 1 });
        b.lathe([[0.001, 0.0], [0.015, -0.1], [0.12, -0.3], [0.17, -0.44]], 8, { cap: false });
        // Brass caps.
        b.part({ edge: 0.9 });
        [-0.52, 0.52].forEach((y) => b.at({ p: [0, y, 0] }, () => b.torus(0.2, 0.02, { segs: 16, sides: 4 })));
        // Three back-swept fins, lagging behind.
        for (let i = 0; i < 3; i++) {
          const a = (i / 3) * TAU;
          b.part({ pivot: [Math.cos(a) * 0.2, -0.4, Math.sin(a) * 0.2], axis: [-Math.sin(a), 0, Math.cos(a)], swing: 0.55, stage: 1, delay: i * 0.08, glow: 0.2 });
          b.at({ p: [Math.cos(a) * 0.2, -0.4, Math.sin(a) * 0.2], r: [PI - 0.3, 0, 0] }, () => b.at({ r: [0, a, 0] }, () => b.blade({ len: 0.55, w: 0.08, thick: 0.014, segs: 5 })));
        }
        // The clock face behind, and the hand that ticks round.
        b.part({ edge: 0.9 });
        b.at({ p: [0, -0.85, 0] }, () => {
          b.torus(0.3, 0.015, { segs: 28, sides: 4 });
          b.ring(12, 0.3, () => b.box(0.015, 0.05, 0.015, {}), { y: 0 });
        });
        b.part({ glow: 0.9, pivot: [0, -0.85, 0], axis: [0, 1, 0], swing: 2.4, stage: 1 });
        b.at({ p: [0, -0.85, 0], r: [0, 0, 0] }, () => b.at({ r: [PI / 2, 0, 0] }, () => b.lathe([[0.02, 0], [0.012, 0.26], [0.001, 0.3]], 4, {})));
      });
    }
  },

  chronowell: {
    title: 'An hourglass temporal throat: the well keeps the time it drinks.\nThe hero is the glass: a huge hourglass whose two bulbs, sand and\nframe turn end over end together on the beat, standing in a ring of\ntwelve hour ticks that never turn.',
    pieceNote: 'A tiny hourglass in a two-post frame that flips on the beat',
    heroNote: 'Two glass bulbs, a sand cone, four frame posts, two plates and a twelve-tick ring',
    piece: (b) => {
      b.part({ glow: 0.4, crease: 25, pivot: [0, 0, 0], axis: [1, 0, 0], swing: PI, stage: 1 });
      b.lathe([[0.001, -0.5], [0.2, -0.46], [0.22, -0.22], [0.03, 0], [0.22, 0.22], [0.2, 0.46], [0.001, 0.5]], 10, {});
      b.part({ glow: 1, pivot: [0, 0, 0], axis: [1, 0, 0], swing: PI, stage: 1 });
      b.lathe([[0.17, -0.44], [0.08, -0.3], [0.001, -0.22]], 8, {});
      b.part({ edge: 0.9, pivot: [0, 0, 0], axis: [1, 0, 0], swing: PI, stage: 1 });
      [-0.5, 0.5].forEach((y) => b.at({ p: [0, y, 0] }, () => b.cylinder(0.22, 0.03, 10, {})));
    },
    hero: (b) => {
      b.fit('ring');
      // Twelve ticks that never turn.
      b.part({ edge: 0.8 });
      b.torus(1, 0.02, { segs: 48, sides: 4 });
      b.ring(12, 1.0, (i) => b.box(i % 3 === 0 ? 0.05 : 0.03, i % 3 === 0 ? 0.3 : 0.18, 0.04, {}));
      // The glass, with everything that turns with it, flipped end over end.
      const flip = { pivot: [0, 0.8, 0], axis: [1, 0, 0], swing: PI, stage: 1 };
      b.part({ ...flip, crease: 25, glow: 0.35 });
      b.at({ p: [0, 0.8, 0] }, () => b.lathe([[0.001, -0.75], [0.4, -0.7], [0.44, -0.4], [0.06, 0], [0.44, 0.4], [0.4, 0.7], [0.001, 0.75]], 24, {}));
      b.part({ ...flip, glow: 1 });
      b.at({ p: [0, 0.8, 0] }, () => b.lathe([[0.36, -0.68], [0.2, -0.5], [0.08, -0.34], [0.001, -0.22]], 16, {}));
      b.part({ ...flip, edge: 0.9 });
      b.at({ p: [0, 0.8, 0] }, () => {
        [-0.76, 0.76].forEach((y) => b.at({ p: [0, y, 0] }, () => b.cylinder(0.46, 0.04, 14, {})));
        b.ring(4, 0.46, () => b.at({ p: [0, -0.76, 0] }, () => b.cylinder(0.025, 1.52, 5, {})));
      });
    }
  },

  tickcage: {
    title: 'Stepped escapement teeth: the cage advances one notch at a time.\nThe hero is the escapement: twelve ratchet bars standing round the rim,\neach cut with a stepped tooth, a pallet fork rocking in the middle\nbetween them, and a hairspring coiled over it all.',
    pieceNote: 'A single ratchet bar with its sawtooth edge',
    heroNote: 'Twelve ratchet bars, an escape ring, a rocking pallet fork and a hairspring',
    piece: (b) => {
      b.part({ pivot: [0, -0.5, 0], axis: [0, 0, 1], swing: -0.3, stage: 1 });
      b.at({ p: [0, -0.5, 0] }, () => b.prism([[-0.1, -0.06], [0.1, -0.06], [0.1, 0.06], [0.0, 0.06], [-0.02, 0.1], [-0.1, 0.1]], 0, 0.9, { taper: 0.9 }));
      b.part({ glow: 0.7, pivot: [0.1, 0.3, 0], axis: [0, 0, 1], swing: 0.9, stage: 1, delay: 0.1 });
      b.at({ p: [0.12, 0.3, 0] }, () => b.pyramid(3, 0.06, 0.16, {}));
    },
    hero: (b) => {
      b.fit('ring');
      b.part({ edge: 0.8 });
      b.torus(1, 0.03, { segs: 40, sides: 4 });
      // Twelve ratchet bars: a stepped tooth on the leading face.
      b.ring(12, 1.0, (i) => {
        b.part({ pivot: [0, 0, 0], axis: [1, 0, 0], swing: -0.4, stage: 1, delay: (i % 3) * 0.07, glow: i % 3 === 0 ? 0.3 : 0 });
        b.prism([[-0.07, -0.05], [0.07, -0.05], [0.07, 0.05], [0.0, 0.05], [-0.015, 0.09], [-0.07, 0.09]], 0, 1.05, { taper: 0.88 });
        b.part({ glow: 0.6, pivot: [0, 0, 0], axis: [1, 0, 0], swing: -0.4, stage: 1, delay: (i % 3) * 0.07 });
        b.at({ p: [0, 0.65, 0.05], r: [0, 0, 0] }, () => b.pyramid(3, 0.05, 0.12, {}));
      });
      // The pallet fork rocking between the teeth.
      b.part({ glow: 0.8, pivot: [0, 0.5, 0], axis: [0, 1, 0], swing: 0.45, stage: 1 });
      b.at({ p: [0, 0.5, 0] }, () => {
        b.at({ p: [0.5, 0, 0], r: [0, 0, PI / 2] }, () => b.cylinder(0.025, 1.0, 6, {}));
        b.at({ p: [-0.46, 0, 0.0] }, () => b.at({ r: [PI / 2, 0, 0] }, () => b.pyramid(3, 0.06, 0.2, {})));
        b.at({ p: [0.46, 0, 0.0] }, () => b.at({ r: [PI / 2, 0, 0] }, () => b.pyramid(3, 0.06, 0.2, {})));
      });
      // The hairspring: a flat spiral over the middle.
      b.part({ edge: 0.5, glow: 0.3 });
      b.tube((t) => [Math.cos(t * TAU * 3.5) * lerp(0.05, 0.3, t), 0.9, Math.sin(t * TAU * 3.5) * lerp(0.05, 0.3, t)], { r: 0.008, sides: 4, segs: 60 });
    }
  },

  vectorlance: {
    title: 'Arrowhead vector fins: the lance is a vector that happens to be a spear.\nThe hero is the arrow: a flat barbed arrowhead on a long shaft, three\nvector fins at the nock that sweep forward as it accelerates, and\nthree speed-line streaks trailing.',
    pieceNote: 'A barbed arrowhead with a short shaft and a fin',
    heroNote: 'A barbed head, a shaft, three nock fins and three speed streaks',
    piece: (b) => {
      b.part({ glow: 0.5 });
      b.at({ p: [0, 0.18, 0] }, () => b.lathe([[0.001, 0.32], [0.14, 0.04], [0.06, 0.02], [0.001, 0]], 4, { phase: PI / 4 }));
      b.part();
      b.lathe([[0.02, 0.2], [0.02, -0.5]], 6, {});
      b.part({ pivot: [0, -0.4, 0], axis: [0, 0, 1], swing: -0.6, stage: 1 });
      b.at({ p: [0, -0.4, 0], r: [0, 0, 0.5] }, () => b.blade({ len: 0.2, w: 0.04, thick: 0.01, segs: 3 }));
    },
    hero: (b) => {
      b.fit('mass');
      b.aimZ(() => {
        // Barbed head: a flat diamond with back barbs.
        b.part({ glow: 0.6 });
        b.lathe([[0.001, 1.9], [0.1, 1.5], [0.2, 1.2], [0.07, 1.14], [0.001, 1.1]], 4, { phase: PI / 4, ex: 1, ez: 0.35 });
        b.lathe([[0.001, 1.9], [0.1, 1.5], [0.2, 1.2], [0.07, 1.14], [0.001, 1.1]], 4, { phase: PI / 4, ex: 0.35, ez: 1 });
        // Shaft.
        b.part({ edge: 0.8 });
        b.lathe([[0.04, 1.12], [0.03, 0.2], [0.035, -0.4]], 8, {});
        // Fletching: three fins swept forward as the bolt accelerates.
        for (let i = 0; i < 3; i++) {
          const a = (i / 3) * TAU;
          b.part({ pivot: [Math.cos(a) * 0.04, -0.15, Math.sin(a) * 0.04], axis: [-Math.sin(a), 0, Math.cos(a)], swing: 0.6, stage: 1, delay: i * 0.06, glow: 0.2 });
          b.at({ p: [Math.cos(a) * 0.04, -0.4, Math.sin(a) * 0.04], r: [0, -a + PI / 2, 0] }, () => b.at({ r: [0, 0, 0] }, () => b.prism([[0, -0.01], [0.28, -0.01], [0.28, 0.01], [0, 0.01]], 0, 0.55, { taper: [0.5, 1], offset: [0, 0] })));
        }
        // Speed lines.
        for (let i = 0; i < 3; i++) {
          const a = (i / 3) * TAU + 0.5;
          b.part({ glow: 0.5, pivot: [0, -0.5, 0], axis: [-Math.sin(a), 0, Math.cos(a)], swing: 0.25, stage: 1 });
          b.at({ p: [Math.cos(a) * 0.2, -0.5, Math.sin(a) * 0.2], r: [PI, 0, 0] }, () => b.lathe([[0.012, 0], [0.006, 0.9], [0.001, 1.4]], 4, {}));
        }
      });

      b.aimZ(() => {
        // Rings along the shaft.
        b.part({ edge: 0.9 });
        [0.0, 0.3, 0.6, 0.9].forEach((y) => b.at({ p: [0, y, 0] }, () => b.torus(0.05, 0.01, { segs: 10, sides: 4 })));
        // Four barbs behind the head that flare open on the beat.
        for (let i = 0; i < 4; i++) {
          const a = (i / 4) * TAU + PI / 4;
          b.part({ pivot: [Math.cos(a) * 0.05, 1.15, Math.sin(a) * 0.05], axis: [-Math.sin(a), 0, Math.cos(a)], swing: 0.7, stage: 1, delay: i * 0.05, glow: 0.4 });
          b.at({ p: [Math.cos(a) * 0.05, 1.14, Math.sin(a) * 0.05], r: [0, -a + PI / 2, 0] }, () => b.at({ r: [PI - 0.2, 0, 0] }, () => b.blade({ len: 0.32, w: 0.04, thick: 0.01, segs: 4 })));
        }
        // Three chevrons trailing, stacked V plates that tip back.
        for (let i = 0; i < 3; i++) {
          b.part({ glow: 0.5, edge: 0.8, pivot: [0, -0.6 - i * 0.25, 0], axis: [1, 0, 0], swing: 0.4, stage: 1, delay: i * 0.08 });
          b.at({ p: [0, -0.6 - i * 0.25, 0] }, () => b.prism([[0, 0.12], [0.22, -0.1], [0.22, -0.16], [0, 0.04], [-0.22, -0.16], [-0.22, -0.1]], 0, 0.02, {}));
        }
      });
    }
  },

  slingvolley: {
    title: 'Spinning sling discs: momentum you can hold in a loop of cord.\nThe hero is the sling shot: three notched discs on one axle, each\nspinning against the next, wobbling on its seat as the throw builds,\nwith a pair of cord loops streaming behind.',
    pieceNote: 'A notched disc on a short axle with one cord loop',
    heroNote: 'Three notched discs, an axle, two cord loops and a pair of cord tails',
    piece: (b) => {
      b.part({ glow: 0.4, pivot: [0, 0, 0], axis: [1, 0, 0], swing: 0.5, stage: 1 });
      b.prism(star(10, 0.34, 0.27), -0.03, 0.03, {});
      b.part({ edge: 0.8 });
      b.lathe([[0.03, -0.5], [0.03, 0.5]], 6, {});
      b.part({ glow: 0.2, pivot: [0, 0, 0], axis: [1, 0, 0], swing: -0.5, stage: 1, delay: 0.1 });
      b.at({ p: [0, 0.3, 0] }, () => b.torus(0.18, 0.012, { segs: 14, sides: 4 }));
    },
    hero: (b) => {
      b.fit('mass');
      b.aimZ(() => {
        // Axle.
        b.part({ edge: 0.8 });
        b.lathe([[0.04, -0.6], [0.04, 0.9]], 6, {});
        // Three notched discs, each tipping against its neighbours.
        [[0.0, 0.5, 0.42], [0.35, 0.42, 0.34], [0.7, 0.34, 0.27]].forEach(([y, R, r], i) => {
          b.part({ glow: 0.3, pivot: [0, y, 0], axis: [Math.cos(i * 2), 0, Math.sin(i * 2)], swing: (i % 2 ? -1 : 1) * 0.45, stage: 1, delay: i * 0.08 });
          b.at({ p: [0, y, 0] }, () => b.prism(star(14, R, r), -0.035, 0.035, {}));
        });
        // Two cord loops streaming behind.
        [0.0, 1.0].forEach((ph, i) => {
          b.part({ crease: 40, edge: 0.3, pivot: [0, -0.2, 0], axis: [1, 0, 0], swing: (i ? -1 : 1) * 0.4, stage: 1 });
          b.tube((t) => [Math.cos(t * TAU + ph) * 0.14 * Math.sin(t * PI) * (i ? 1 : -1), -0.2 - t * 0.7, Math.sin(t * TAU + ph) * 0.14 * Math.sin(t * PI)], { r: 0.012, sides: 4, segs: 20 });
        });
      });
    }
  },

  shearstep: {
    title: 'A lateral staircase ribbon: each step is a little further to the side.\nThe hero is the stair: six slabs climbing along the cast, each stepped\nout further to one side than the last, a rail ribbon tracing their\nouter edge, each slab slipping sideways in turn on its hinge.',
    pieceNote: 'Three stepped slabs, each offset a little further',
    heroNote: 'Six offset slabs, six risers, a rail ribbon and a newel post',
    piece: (b) => {
      for (let i = 0; i < 3; i++) {
        b.part({ pivot: [-0.2 + i * 0.2, -0.5 + i * 0.25, 0], axis: [0, 0, 1], swing: -0.35 + i * 0.1, stage: 1, delay: i * 0.1, glow: i === 2 ? 0.4 : 0 });
        b.at({ p: [-0.2 + i * 0.2, -0.5 + i * 0.3, 0] }, () => b.box(0.3, 0.16, 0.3, { taper: [0.95, 0.95] }));
      }

      // Risers under each step and a short rail on the outside.
      b.part({ edge: 0.8 });
      for (let i = 0; i < 3; i++) b.at({ p: [-0.2 + i * 0.2, -0.5, 0.14] }, () => b.box(0.28, 0.12 + i * 0.3, 0.02, {}));
      b.part({ edge: 0.4, glow: 0.4 });
      b.tube((t) => [lerp(-0.1, 0.45, t), lerp(-0.3, 0.2, t), 0.17], { r: 0.012, sides: 4, segs: 3 });
    },
    hero: (b) => {
      b.fit('mass');
      for (let i = 0; i < 6; i++) {
        const x = -0.5 + i * 0.2;
        const z = i * 0.3;
        const y = i * 0.12;
        b.part({ pivot: [x, y, z], axis: [0, 0, 1], swing: -0.4 + i * 0.06, stage: 1, delay: i * 0.07, glow: i === 5 ? 0.5 : 0 });
        b.at({ p: [x, y, z] }, () => b.box(0.5, 0.1, 0.3, { taper: [0.96, 0.96] }));
        b.part({ edge: 0.7 });
        b.at({ p: [x, 0, z + 0.14] }, () => b.box(0.48, y + 0.04, 0.02, {}));
      }
      // The rail: a ribbon along the outer edge.
      b.part({ edge: 0.3, crease: 40, glow: 0.4 });
      b.ribbon((t) => [-0.5 + t * 1.0 + 0.27, 0.38 + t * 0.72, t * 1.5], { w: 0.04, segs: 20, up: [1, 0, 0], thick: 0.01 });
      b.part({ edge: 0.8 });
      b.at({ p: [0.77, 0, 1.5] }, () => b.lathe([[0.04, 0], [0.03, 1.1], [0.05, 1.15]], 6, {}));
    }
  },

  orbitpendulum: {
    title: 'An orbital mace crescent: a weight on a stick with a moon of its own.\nThe hero is the mace: a long haft from the hand ending in a heavy head,\na tilted orbit ring round the head and three satellites that run round\nit when the pendulum swings through.',
    pieceNote: 'A stub haft, a head ball and one satellite on an orbit ring',
    heroNote: 'A haft, a banded head, a tilted orbit ring and three satellites',
    piece: (b) => {
      b.part();
      b.lathe([[0.03, -0.5], [0.03, 0.2]], 6, {});
      b.part({ glow: 0.4 });
      b.at({ p: [0, 0.32, 0] }, () => b.orb(0.14, { sides: 8, rings: 4 }));
      b.part({ edge: 0.8, pivot: [0, 0.32, 0], axis: [1, 0, 0], swing: 0.6, stage: 1 });
      b.at({ p: [0, 0.32, 0], r: [0.4, 0, 0.3] }, () => b.torus(0.27, 0.012, { segs: 18, sides: 4 }));
      b.part({ glow: 1, pivot: [0, 0.32, 0], axis: [0, 1, 0], swing: 1.8, stage: 1 });
      b.at({ p: [0.27, 0.32, 0] }, () => b.orb(0.04, { sides: 5, rings: 3 }));
    },
    hero: (b) => {
      b.fit('mass');
      // Haft from the hand.
      b.part({ edge: 0.7 });
      b.at({ r: [PI / 2, 0, 0] }, () => b.lathe([[0.06, -0.15], [0.04, 0.0], [0.035, 1.05], [0.05, 1.1]], 8, {}));
      // The head: a heavy ball with two bands.
      b.part({ glow: 0.35 });
      b.at({ p: [0, 0, 1.3] }, () => b.orb(0.22, { sides: 10, rings: 5 }));
      b.part({ edge: 0.9 });
      [-0.1, 0.1].forEach((y) => b.at({ p: [0, y, 1.3] }, () => b.torus(0.2, 0.018, { segs: 22, sides: 4 })));
      // The orbit ring, tilted, with three satellites running round it.
      b.part({ edge: 0.8, glow: 0.2, pivot: [0, 0, 1.3], axis: [1, 0, 0], swing: 0.7, stage: 1 });
      b.at({ p: [0, 0, 1.3], r: [0.5, 0, 0.35] }, () => b.torus(0.48, 0.016, { segs: 36, sides: 4 }));
      for (let i = 0; i < 3; i++) {
        const a = (i / 3) * TAU;
        b.part({ glow: 1, pivot: [0, 0, 1.3], axis: [0.5, 1, 0.3], swing: 2.0 + i * 0.5, stage: 1, delay: i * 0.05 });
        b.at({ p: [0, 0, 1.3], r: [0.5, 0, 0.35] }, () => b.at({ p: [Math.cos(a) * 0.48, 0, Math.sin(a) * 0.48] }, () => b.orb(0.06, { sides: 6, rings: 3 })));
      }
    }
  },

  kinethalo: {
    title: 'Swept turbine vanes: the circle spins up like a fan nobody asked for.\nThe hero is the turbine: eighteen backswept vanes laid flat round a\nhub inside a shroud ring, each vane pitching on its spar as the rotor\nspins up, the hub capped with a nose cone.',
    pieceNote: 'A four-vane rotor on a hub',
    heroNote: 'Eighteen swept vanes, a hub, a nose cone, a shroud ring and a stator ring',
    piece: (b) => {
      b.part({ glow: 0.5 });
      b.cylinder(0.08, 0.1, 8, {});
      b.ring(4, 0.06, (i) => {
        b.part({ pivot: [0, 0.05, 0], axis: [0, 0, 1], swing: 0.9, stage: 1, delay: i * 0.05, crease: 40 });
        b.at({ p: [0, 0.05, 0], r: [PI / 2 - 0.1, 0, 0.0] }, () => b.blade({ len: 0.36, w: 0.1, thick: 0.014, twist: 0.5, bend: 0.12, segs: 6 }));
      });
    },
    hero: (b) => {
      b.fit('ring');
      b.part({ glow: 0.5 });
      b.cylinder(0.2, 0.18, 14, { r1: 0.17 });
      b.at({ p: [0, 0.18, 0] }, () => b.pyramid(14, 0.17, 0.2, {}));
      // Eighteen swept vanes.
      b.ring(18, 0.17, (i) => {
        b.part({ pivot: [0, 0.09, 0], axis: [0, 0, 1], swing: 0.85, stage: 1, delay: (i % 6) * 0.03, crease: 40, glow: i % 6 === 0 ? 0.25 : 0 });
        b.at({ p: [0, 0.09, 0], r: [PI / 2 - 0.08, 0, 0] }, () => b.blade({ len: 0.8, w: 0.12, thick: 0.014, twist: 0.5, bend: 0.2, segs: 10 }));
      });
      b.part({ edge: 0.8 });
      b.at({ p: [0, 0.07, 0] }, () => b.torus(1.0, 0.035, { segs: 48, sides: 5 }));
      b.part({ edge: 0.5 });
      b.at({ p: [0, 0.07, 0] }, () => b.torus(0.62, 0.012, { segs: 36, sides: 4 }));
    }
  },

  presscage: {
    title: 'Opposing piston jaws: the cage closes by pushing.\nThe hero is the press: six hydraulic pistons round the ring, each a\nhousing, a bright rod and a flat jaw pad facing in, tied by a crown\nring, the pads tilting square to the load as the jaws close.',
    pieceNote: 'A piston: housing, rod and jaw pad',
    heroNote: 'Six pistons with housings, rods and pads, a crown ring and a base ring',
    piece: (b) => {
      b.part({ edge: 0.8 });
      b.at({ p: [0, -0.5, 0] }, () => b.cylinder(0.12, 0.5, 8, {}));
      b.part({ glow: 0.6, pivot: [0, 0, 0], axis: [0, 0, 1], swing: -0.25, stage: 1 });
      b.at({ p: [0, 0, 0] }, () => b.cylinder(0.05, 0.6, 6, {}));
      b.part({ pivot: [0, 0.6, 0], axis: [0, 0, 1], swing: -0.4, stage: 1, delay: 0.1 });
      b.at({ p: [0, 0.58, 0] }, () => b.box(0.34, 0.06, 0.2, {}));
    },
    hero: (b) => {
      b.fit('ring');
      b.part({ edge: 0.8 });
      b.torus(1, 0.035, { segs: 40, sides: 4 });
      b.at({ p: [0, 1.0, 0] }, () => b.torus(0.82, 0.03, { segs: 40, sides: 4 }));
      // Six pistons lying toward the middle, each lifting its pad square on the press.
      b.ring(6, 0.98, (i) => {
        b.part({ edge: 0.8 });
        b.at({ p: [0, 0.5, 0], r: [-PI / 2 - 0.15, 0, 0] }, () => b.cylinder(0.1, 0.42, 8, {}));
        b.part({ glow: 0.6, pivot: [0, 0.5, -0.1], axis: [1, 0, 0], swing: -0.15, stage: 1 });
        b.at({ p: [0, 0.5, -0.1], r: [-PI / 2 - 0.15, 0, 0] }, () => b.cylinder(0.04, 0.55, 6, {}));
        b.part({ pivot: [0, 0.4, -0.64], axis: [1, 0, 0], swing: 0.4, stage: 1, delay: (i % 2) * 0.1, glow: 0.2 });
        b.at({ p: [0, 0.4, -0.64], r: [0, 0, 0] }, () => b.box(0.28, 0.4, 0.05, { center: true }));
      });
    }
  },

  surgewell: {
    title: 'Spiral spillway ribs: the well pours itself upward.\nThe hero is the spillway: a tapered surge column wound with three\nrising spiral ribbons that widen from throat to lip, ringed with twelve\nspillway ribs in a ramp, the ribs fanning outward as it surges.',
    pieceNote: 'A short surge column with one spiral ribbon',
    heroNote: 'A tapered column, three widening spiral ribbons and twelve ramp ribs',
    piece: (b) => {
      b.part({ glow: 0.4 });
      b.lathe([[0.1, -0.5], [0.06, 0], [0.04, 0.5]], 7, {});
      b.part({ crease: 40, edge: 0.4, pivot: [0, 0, 0], axis: [0, 1, 0], swing: 1.0, stage: 1 });
      b.ribbon(helixPath(0.1, 0.3, 1.4, 0.9, -0.45, 0), { w: 0.08, segs: 24, thick: 0.01, up: [0, 1, 0] });
    },
    hero: (b) => {
      b.fit('ring');
      b.part({ glow: 0.5 });
      b.lathe([[0.2, 0], [0.14, 0.3], [0.1, 0.9], [0.06, 1.5]], 12, {});
      for (let i = 0; i < 3; i++) {
        b.part({ crease: 40, edge: 0.4, glow: 0.2, pivot: [0, 0, 0], axis: [0, 1, 0], swing: 0.9 - i * 0.2, stage: 1, delay: i * 0.08 });
        b.ribbon(helixPath(0.18, 0.85, 1.5, 1.3, 0.04, (i / 3) * TAU), { w: 0.14, segs: 60, thick: 0.014, up: [0, 1, 0] });
      }
      b.ring(12, 0.9, (i) => {
        b.part({ pivot: [0, 0.04, -0.25], axis: [1, 0, 0], swing: 0.6, stage: 1, delay: (i % 4) * 0.05, edge: 0.8 });
        b.at({ p: [0, 0.04, 0] }, () => b.box(0.05, 0.05 + (i % 4) * 0.04, 0.4, { taper: [1, 0.7] }));
      });
    }
  }
};
