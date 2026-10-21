// Tech and force rigs. See earth.mjs for the conventions.
import { RigBuilder, PI, TAU, lerp, clamp, smooth, rng, ngon, star, arcBand, curve, arcPath, helixPath } from '../../packs/sandbox/src/assets/codex/RigKit.js';
void [RigBuilder, PI, TAU, lerp, clamp, smooth, rng, ngon, star, arcBand, curve, arcPath, helixPath];

export const TECH = {
  servopylon: {
    title: 'Telescopic hammer pylons: a servo that hits the ground for a living.\nThe hero is the pylon: a braced base, three telescoping stages each\nnarrower than the one below with a hydraulic collar at every joint, and\na flat hammer head on top. The stages lean over at their joints as the\nhammer comes down.',
    pieceNote: 'A two-stage telescopic ram with a hammer pad',
    heroNote: 'A four-brace base, three telescopic stages, three collars and a hammer head',
    piece: (b) => {
      b.part({ edge: 0.8 });
      b.at({ p: [0, -0.5, 0] }, () => b.cylinder(0.13, 0.55, 8, {}));
      b.part({ glow: 0.4, pivot: [0, 0.05, 0], axis: [0, 0, 1], swing: -0.3, stage: 1 });
      b.at({ p: [0, 0.0, 0] }, () => b.cylinder(0.08, 0.45, 8, {}));
      b.part({ glow: 0.8, pivot: [0, 0.05, 0], axis: [0, 0, 1], swing: -0.3, stage: 1 });
      b.at({ p: [0, 0.45, 0] }, () => b.box(0.34, 0.08, 0.2, {}));
    },
    hero: (b) => {
      b.fit('mass');
      // Base with four braces.
      b.part({ edge: 0.8 });
      b.cylinder(0.45, 0.12, 10, { r1: 0.3 });
      b.ring(4, 0.3, () => b.at({ p: [0, 0.1, 0], r: [-0.55, 0, 0] }, () => b.box(0.06, 0.55, 0.06, {})), { phase: PI / 4 });
      // Three telescopic stages; each tips over a little at its joint.
      [[0.28, 0.12, 0.7], [0.2, 0.8, 0.7], [0.13, 1.5, 0.7]].forEach(([r, y, h], i) => {
        b.part({ edge: 0.8, glow: i === 2 ? 0.3 : 0, pivot: [0, y, 0], axis: [0, 0, 1], swing: -0.16 - i * 0.05, stage: 1, delay: i * 0.1 });
        b.at({ p: [0, y, 0] }, () => b.cylinder(r, h, 12, {}));
        b.part({ glow: 0.6, pivot: [0, y, 0], axis: [0, 0, 1], swing: -0.16 - i * 0.05, stage: 1, delay: i * 0.1 });
        b.at({ p: [0, y + h - 0.04, 0] }, () => b.torus(r + 0.015, 0.022, { segs: 20, sides: 4 }));
      });
      // Hammer head.
      b.part({ glow: 0.9, pivot: [0, 2.0, 0], axis: [0, 0, 1], swing: -0.5, stage: 1, delay: 0.25 });
      b.at({ p: [0, 2.2, 0] }, () => b.box(0.9, 0.3, 0.42, { center: true, taper: [0.9, 0.9] }));
      b.at({ p: [0, 2.04, 0] }, () => b.cylinder(0.12, 0.08, 8, {}));
    }
  },

  raster: {
    title: 'Flat raster scan teeth: the lance reads the line row by row.\nThe hero is the scanhead: a flat comb of sixteen teeth along a bar, a\nthin scan plane sweeping across the teeth, a pixel block grid under\nit, and a lens housing at the front. The teeth tip forward in sequence.',
    pieceNote: 'A short comb of five teeth with a scan bar',
    heroNote: 'A sixteen-tooth comb, a bar, a scan plane, a pixel grid and a lens housing',
    piece: (b) => {
      b.part({ edge: 0.8 });
      b.at({ p: [0, -0.4, 0] }, () => b.box(0.7, 0.08, 0.12, {}));
      for (let i = 0; i < 5; i++) {
        b.part({ glow: i === 2 ? 0.6 : 0.1, pivot: [(i - 2) * 0.14, -0.3, 0], axis: [0, 0, 1], swing: -0.3 - i * 0.05, stage: 1, delay: i * 0.06 });
        b.at({ p: [(i - 2) * 0.14, -0.32, 0] }, () => b.box(0.06, 0.55 + (i % 2) * 0.15, 0.06, { taper: [0.5, 0.8] }));
      }
    },
    hero: (b) => {
      b.fit('mass');
      b.aimZ(() => {
        // The bar across the cast.
        b.part({ edge: 0.8 });
        b.at({ p: [0, 0, 0], r: [0, 0, PI / 2] }, () => b.box(0.14, 2.4, 0.08, { center: true }));
        // Sixteen teeth along the bar.
        for (let i = 0; i < 16; i++) {
          const x = (i - 7.5) * 0.15;
          b.part({ glow: i % 4 === 0 ? 0.5 : 0.1, pivot: [x, 0, 0], axis: [0, 0, 1], swing: -0.25 - (i % 4) * 0.07, stage: 1, delay: i * 0.025 });
          b.at({ p: [x, 0.07, 0] }, () => b.box(0.07, 0.7 + (i % 3) * 0.12, 0.05, { taper: [0.45, 0.8] }));
        }
        // The scan plane: a thin bright sheet crossing the teeth.
        b.part({ glow: 0.9, edge: 1, pivot: [-1.2, 0.5, 0], axis: [0, 1, 0], swing: 0.4, stage: 1 });
        b.at({ p: [0, 0.5, 0] }, () => b.box(2.4, 0.015, 0.08, { center: true }));
        // Pixel blocks beneath.
        b.part({ glow: 0.3 });
        for (let r = 0; r < 2; r++) for (let c = 0; c < 8; c++) b.at({ p: [(c - 3.5) * 0.3, -0.12 - r * 0.08, 0] }, () => b.box(0.2, 0.05, 0.05, {}));
      });
    }
  },

  gimbal: {
    title: 'An articulated gimbal ribbon: three rings that never agree on up.\nThe hero is the gimbal: three nested rings, each hinged to the next on a\ndifferent axis, a gyro disc spinning at the centre, a mounting yoke\nbehind and a trailing ribbon cable.',
    pieceNote: 'Two nested rings on a gyro bead',
    heroNote: 'Three nested rings, a gyro disc, a mounting yoke and a ribbon cable',
    piece: (b) => {
      b.part({ glow: 0.8 });
      b.orb(0.08, { sides: 6, rings: 3 });
      b.part({ edge: 0.9, pivot: [0, 0, 0], axis: [1, 0, 0], swing: 1.0, stage: 1 });
      b.torus(0.32, 0.016, { segs: 20, sides: 4 });
      b.part({ edge: 0.9, pivot: [0, 0, 0], axis: [0, 0, 1], swing: -1.0, stage: 1, delay: 0.1 });
      b.at({ r: [PI / 2, 0, 0] }, () => b.torus(0.22, 0.016, { segs: 16, sides: 4 }));
    },
    hero: (b) => {
      b.fit('mass');
      // Gyro disc.
      b.part({ glow: 0.9, pivot: [0, 0, 0], axis: [0, 1, 0], swing: 1.5, stage: 1 });
      b.at({ p: [0, 0.6, 0] }, () => b.lathe([[0.01, -0.03], [0.22, -0.02], [0.24, 0], [0.22, 0.02], [0.01, 0.03]], 16, { cap: false }));
      // Three rings on perpendicular hinges.
      [[0.55, [1, 0, 0], 1.0], [0.42, [0, 0, 1], -1.2], [0.3, [0, 1, 0], 1.4]].forEach(([R, axis, swing], i) => {
        b.part({ edge: 0.9, pivot: [0, 0.6, 0], axis, swing, stage: 1, delay: i * 0.08, glow: i === 2 ? 0.3 : 0 });
        b.at({ p: [0, 0.6, 0], r: [i === 1 ? PI / 2 : 0, 0, i === 2 ? PI / 2 : 0] }, () => b.torus(R, 0.022, { segs: 32, sides: 5 }));
      });
      // Yoke and base.
      b.part({ edge: 0.8 });
      b.at({ p: [0, 0, 0] }, () => b.cylinder(0.12, 0.1, 8, { r1: 0.09 }));
      b.tube((t) => [0, lerp(0.1, 0.6, t), -0.2 * Math.sin(t * PI)], { r: 0.018, sides: 4, segs: 8 });
      // Ribbon cable.
      b.part({ crease: 40, edge: 0.2, glow: 0.3, pivot: [0, 0.4, -0.2], axis: [1, 0, 0], swing: 0.5, stage: 1 });
      b.ribbon((t) => [Math.sin(t * 7) * 0.12, 0.45 - t * 0.35, -0.2 - t * 1.0], { w: 0.1, segs: 24, up: [0, 1, 0] });
    }
  },

  hardpoint: {
    title: 'Square hardpoint crenels: the ring as a fortress with a gun in each corner.\nThe hero is the keep: a crenellated wall of sixteen merlons round the\nrim, four corner hardpoints each with a short gun barrel, and a ring\nwalk. The barrels traverse inward as the hardpoint locks.',
    pieceNote: 'A crenellated wall section with a barrel',
    heroNote: 'Sixteen merlons, four gun hardpoints with barrels, a ring walk and a base',
    piece: (b) => {
      b.part({ edge: 0.8 });
      b.at({ p: [0, -0.4, 0] }, () => b.box(0.6, 0.28, 0.16, {}));
      [-0.22, 0, 0.22].forEach((x, i) => b.at({ p: [x, -0.12, 0] }, () => b.box(0.14, 0.14, 0.16, {})));
      b.part({ glow: 0.6, pivot: [0.25, 0.1, 0], axis: [0, 1, 0], swing: 0.6, stage: 1 });
      b.at({ p: [0.25, 0.08, 0], r: [0, 0, PI / 2 - 0.15] }, () => b.cylinder(0.04, 0.4, 6, {}));
    },
    hero: (b) => {
      b.fit('ring');
      // Base ring and wall.
      b.part({ edge: 0.8 });
      b.torus(1, 0.04, { segs: 48, sides: 4 });
      b.ring(16, 0, (i) => {
        const a0 = PI / 2 - 0.19;
        b.part({ pivot: [0, 0, 1], axis: [1, 0, 0], swing: -0.15, stage: 1, delay: (i % 4) * 0.04 });
        b.prism(arcBand(PI / 2 - 0.15, PI / 2 + 0.15, 0.93, 1.07, 3), 0, 0.28 + (i % 2 ? 0.0 : 0.08), { taper: 0.97 });
      });
      b.part({ edge: 0.6 });
      b.at({ p: [0, 0.24, 0] }, () => b.torus(0.97, 0.02, { segs: 48, sides: 4 }));
      // Four hardpoints with traversing barrels.
      b.ring(4, 0.88, (i) => {
        b.part({ glow: 0.2 });
        b.at({ p: [0, 0, 0] }, () => b.box(0.34, 0.34, 0.34, { taper: [0.85, 0.85] }));
        b.part({ glow: 0.7, pivot: [0, 0.36, 0], axis: [0, 1, 0], swing: 0.55, stage: 1, delay: i * 0.06 });
        b.at({ p: [0, 0.4, 0], r: [-PI / 2 - 0.05, 0, 0] }, () => b.cylinder(0.05, 0.55, 8, { r1: 0.04 }));
        b.at({ p: [0, 0.38, 0] }, () => b.cylinder(0.11, 0.1, 8, {}));
      }, { phase: PI / 4 });
    }
  },

  impulse: {
    title: 'A radial compression dish: a floor that punches back.\nThe hero is the driver: a shallow dish of sixteen radial petals around\na central piston boss, three shock rings hung above it, the petals\nflexing inward as the dish compresses and springing out on release.',
    pieceNote: 'A small dish of four petals around a piston boss',
    heroNote: 'Sixteen dish petals, a piston boss and three shock rings',
    piece: (b) => {
      b.part({ glow: 0.6 });
      b.cylinder(0.08, 0.14, 8, {});
      b.ring(4, 0.06, (i) => {
        b.part({ pivot: [0, 0.02, 0], axis: [1, 0, 0], swing: -0.5, stage: 1, delay: i * 0.05 });
        b.at({ p: [0, 0.02, 0], r: [PI / 2 - 0.35, 0, 0] }, () => b.blade({ len: 0.34, w: 0.13, thick: 0.014, segs: 5 }));
      });
    },
    hero: (b) => {
      b.fit('ring');
      // Sixteen petals form the dish, each hinged at the hub.
      b.ring(16, 0.12, (i) => {
        b.part({ pivot: [0, 0.14, 0], axis: [1, 0, 0], swing: -0.45, stage: 1, delay: (i % 4) * 0.04, glow: i % 4 === 0 ? 0.2 : 0 });
        b.at({ p: [0, 0.14, 0], r: [PI / 2 - 0.45, 0, 0] }, () => b.blade({ len: 0.95, w: 0.2, thick: 0.02, segs: 8, shape: (t) => Math.sin(Math.PI * Math.pow(t, 0.9)) * 0.6 + 0.4 * t }));
      });
      // Central piston boss.
      b.part({ glow: 0.9 });
      b.cylinder(0.16, 0.34, 10, { r1: 0.1 });
      b.at({ p: [0, 0.34, 0] }, () => b.pyramid(10, 0.1, 0.1, {}));
      // Three shock rings hung above, tilting off as the dish fires.
      [0.55, 0.85, 1.15].forEach((y, i) => {
        b.part({ edge: 0.9, glow: 0.4, pivot: [0.4 + i * 0.1, y, 0], axis: [0, 0, 1], swing: 0.3 + i * 0.1, stage: 1, delay: i * 0.08 });
        b.at({ p: [0, y, 0] }, () => b.torus(0.3 + i * 0.22, 0.02, { segs: 30, sides: 4 }));
      });
    }
  },

  tensor: {
    title: 'Cross-braced tension struts: a cage made of what holds it apart.\nThe hero is the frame: six braced panels round the ring, each a pair of\ncrossing diagonals with a turnbuckle where they meet and posts at the\ncorners, joined by a top and a bottom ring. Each panel leans in as the\ntension is taken up.',
    pieceNote: 'An X-braced panel with a turnbuckle',
    heroNote: 'Six X-braced panels, twelve posts, twelve diagonals, turnbuckles and two rings',
    piece: (b) => {
      b.part({ edge: 0.8, pivot: [0, -0.5, 0], axis: [0, 0, 1], swing: -0.25, stage: 1 });
      [-0.25, 0.25].forEach((x) => b.at({ p: [x, -0.5, 0] }, () => b.box(0.05, 1.0, 0.05, {})));
      b.part({ edge: 0.5, glow: 0.3, pivot: [0, -0.5, 0], axis: [0, 0, 1], swing: -0.25, stage: 1 });
      b.tube((t) => [lerp(-0.25, 0.25, t), lerp(-0.5, 0.5, t), 0], { r: 0.012, sides: 4, segs: 3 });
      b.tube((t) => [lerp(0.25, -0.25, t), lerp(-0.5, 0.5, t), 0], { r: 0.012, sides: 4, segs: 3 });
      b.part({ glow: 0.9, pivot: [0, -0.5, 0], axis: [0, 0, 1], swing: -0.25, stage: 1 });
      b.at({ p: [0, 0, 0] }, () => b.orb(0.04, { sides: 6, rings: 3 }));
    },
    hero: (b) => {
      b.fit('ring');
      b.part({ edge: 0.8 });
      b.torus(1, 0.03, { segs: 40, sides: 4 });
      b.at({ p: [0, 1.1, 0] }, () => b.torus(0.9, 0.03, { segs: 40, sides: 4 }));
      b.ring(6, 0, (i) => {
        const w = 0.5;
        b.part({ pivot: [0, 0, 1], axis: [1, 0, 0], swing: -0.4, stage: 1, delay: (i % 2) * 0.08, edge: 0.8 });
        [-w, w].forEach((x) => b.at({ p: [x, 0, 1] }, () => b.cylinder(0.025, 1.1, 5, { r1: 0.02 })));
        b.part({ pivot: [0, 0, 1], axis: [1, 0, 0], swing: -0.4, stage: 1, delay: (i % 2) * 0.08, edge: 0.5, glow: 0.2 });
        b.tube((t) => [lerp(-w, w, t), lerp(0, 1.1, t), lerp(1, 0.9, t)], { r: 0.01, sides: 4, segs: 3 });
        b.tube((t) => [lerp(w, -w, t), lerp(0, 1.1, t), lerp(1, 0.9, t)], { r: 0.01, sides: 4, segs: 3 });
        b.part({ pivot: [0, 0, 1], axis: [1, 0, 0], swing: -0.4, stage: 1, delay: (i % 2) * 0.08, glow: 0.9 });
        b.at({ p: [0, 0.55, 0.95] }, () => b.at({ r: [0, 0, PI / 2] }, () => b.cylinder(0.03, 0.12, 6, {})));
      }, { phase: PI / 6 });
    }
  },

  vectorhalo: {
    title: 'A tangential arrow ring: every arrow points the same way round.\nThe hero is the field: twelve flat arrows lying tangent on the ring,\nhead to tail, a hub with a crossed compass of four vector arrows, and\nan outer guide ring. The arrows tip up off the floor as the field turns.',
    pieceNote: 'A flat arrow and a ring',
    heroNote: 'Twelve tangent arrows, a four-arrow compass, a hub and two guide rings',
    piece: (b) => {
      b.part({ glow: 0.5, pivot: [0, 0, 0], axis: [0, 0, 1], swing: 0.5, stage: 1 });
      b.at({ r: [PI / 2, 0, 0] }, () => {
        b.prism([[-0.06, -0.5], [0.06, -0.5], [0.06, 0.1], [0.2, 0.1], [0, 0.5], [-0.2, 0.1], [-0.06, 0.1]], -0.03, 0.03, {});
      });
      b.part({ edge: 0.8 });
      b.at({ r: [PI / 2, 0, 0] }, () => b.torus(0.3, 0.012, { segs: 16, sides: 4 }));
    },
    hero: (b) => {
      b.fit('ring');
      b.part({ edge: 0.8 });
      b.at({ p: [0, 0.03, 0] }, () => b.torus(1.0, 0.02, { segs: 48, sides: 4 }));
      b.at({ p: [0, 0.03, 0] }, () => b.torus(0.6, 0.012, { segs: 40, sides: 4 }));
      // Twelve arrows lying tangent, nose to tail.
      b.ring(12, 0.8, (i) => {
        b.part({ pivot: [0, 0.05, 0], axis: [0, 0, 1], swing: 0.8, stage: 1, delay: (i % 4) * 0.05, glow: i % 4 === 0 ? 0.5 : 0.1 });
        b.at({ p: [0, 0.04, 0], r: [0, PI / 2, 0] }, () => b.prism([[-0.045, -0.24], [0.045, -0.24], [0.045, 0.06], [0.12, 0.06], [0, 0.26], [-0.12, 0.06], [-0.045, 0.06]], 0, 0.04, {}));
      });
      // The compass: four vector arrows at the hub.
      b.part({ glow: 0.9 });
      b.at({ p: [0, 0.05, 0] }, () => b.orb(0.08, { sides: 6, rings: 3, ey: 0.7 }));
      for (let i = 0; i < 4; i++) {
        b.part({ glow: 0.4, pivot: [0, 0.05, 0], axis: [0, 0, 1], swing: 0.8, stage: 1, delay: 0.2 });
        b.at({ p: [0, 0.05, 0], r: [0, (i / 4) * TAU, 0] }, () => b.prism([[-0.025, 0.08], [0.025, 0.08], [0.025, 0.32], [0.07, 0.32], [0, 0.44], [-0.07, 0.32], [-0.025, 0.32]], 0, 0.03, {}));
      }
    }
  },

  shearforce: {
    title: 'A scissor-folded force plane: the line is cut by a plane that slides.\nThe hero is the shears: two broad triangular blades crossing on a\ncentre pivot, handles looping behind, the blades opening about the\npivot as the shear is applied, a force arrow riding the cutting plane.',
    pieceNote: 'Two crossed blades on a pivot pin',
    heroNote: 'Two scissor blades, two handle rings, a pivot screw and a force arrow',
    piece: (b) => {
      [-1, 1].forEach((s, i) => {
        b.part({ glow: i ? 0.4 : 0.1, pivot: [0, 0, 0], axis: [0, 0, 1], swing: s * 0.35, stage: 1 });
        b.at({ r: [0, 0, s * 0.18] }, () => b.prism([[-0.05, -0.5], [0.05, -0.5], [0.07, 0.3], [0.0, 0.5], [-0.05, 0.3]], -0.015 * s, 0.015 * s + 0.02 * s, {}));
      });
      b.part({ glow: 0.9 });
      b.cylinder(0.04, 0.08, 6, { center: true });

      // Serrations on one blade, a pivot ring and a grip.
      b.part({ glow: 0.4, pivot: [0, 0, 0], axis: [0, 0, 1], swing: 0.35, stage: 1 });
      for (let k = 0; k < 5; k++) b.at({ p: [0.07, -0.35 + k * 0.17, 0.0], r: [0, 0, -0.6] }, () => b.pyramid(3, 0.03, 0.07, {}));
      b.part({ edge: 0.9 });
      b.torus(0.07, 0.012, { segs: 12, sides: 4 });
      b.part();
      b.at({ p: [0, -0.56, 0] }, () => b.cylinder(0.03, 0.14, 6, {}));
    },
    hero: (b) => {
      b.fit('mass');
      b.aimZ(() => {
        // Two scissor blades crossing at the pivot, each a long flat triangle.
        [-1, 1].forEach((s, i) => {
          b.part({ glow: i ? 0.35 : 0.1, pivot: [0, 0, 0], axis: [0, 1, 0], swing: s * 0.5, stage: 1 });
          b.at({ r: [0, s * 0.12, 0] }, () => b.prism([[-0.07, -0.55], [0.07, -0.55], [0.1, 0.1], [0.0, 1.5], [-0.12, 0.1]].map(([x, z]) => [x, z]), i * 0.02, i * 0.02 + 0.03, { taper: 1 }));
        });
        // Handle rings behind.
        b.part({ edge: 0.8 });
        [-1, 1].forEach((s) => b.at({ p: [s * 0.14, 0, -0.74], r: [0, 0, 0] }, () => b.torus(0.12, 0.022, { segs: 14, sides: 4 })));
        // Pivot screw.
        b.part({ glow: 0.9 });
        b.at({ p: [0, 0, 0] }, () => b.cylinder(0.05, 0.1, 8, {}));
        // Force arrow riding the plane.
        b.part({ glow: 0.8, pivot: [0, 0.1, 0], axis: [0, 1, 0], swing: 0.3, stage: 1, delay: 0.15 });
        b.at({ p: [0.3, 0.06, 0.3] }, () => b.prism([[-0.03, -0.3], [0.03, -0.3], [0.03, 0.15], [0.09, 0.15], [0, 0.32], [-0.09, 0.15], [-0.03, 0.15]], 0, 0.03, {}));
      });

      b.aimZ(() => {
        // Serrated edges and grips, each folding with its own blade.
        [-1, 1].forEach((s, i) => {
          b.part({ glow: 0.3, pivot: [0, 0, 0], axis: [0, 1, 0], swing: s * 0.5, stage: 1 });
          for (let k = 0; k < 8; k++) b.at({ p: [s * (0.1 + k * 0.012), i * 0.02 + 0.015, 0.25 + k * 0.15], r: [0, s * 0.2, 0] }, () => b.pyramid(3, 0.035, 0.08, {}));
          b.at({ p: [s * 0.14, 0, -0.74], r: [PI / 2, 0, 0] }, () => b.cylinder(0.03, 0.2, 6, {}));
        });
        // A stop-pin and a ring round the pivot.
        b.part({ edge: 0.9 });
        b.at({ p: [0, 0, 0] }, () => b.torus(0.09, 0.014, { segs: 14, sides: 4 }));
        b.at({ p: [0.14, 0, 0.15], r: [PI / 2, 0, 0] }, () => b.cylinder(0.015, 0.06, 5, {}));
        // Two more force arrows, riding the cutting plane behind the first.
        for (let i = 0; i < 2; i++) {
          b.part({ glow: 0.6, pivot: [0, 0.1, 0], axis: [0, 1, 0], swing: 0.3, stage: 1, delay: 0.2 + i * 0.08 });
          b.at({ p: [0.3, 0.06, -0.1 - i * 0.22] }, () => b.prism([[-0.02, -0.08], [0.02, -0.08], [0.02, 0.02], [0.06, 0.02], [0, 0.12], [-0.06, 0.02], [-0.02, 0.02]], 0, 0.02, {}));
        }
      });
    }
  },

  moment: {
    title: 'A weighted hammer swing: the moment is the whole point.\nThe hero is the hammer: a long ash haft, a massive bevelled head, a\ncounterweight on the butt, and a pair of thin dimension lines marking\nthe lever arm. The head drops forward on its hinge as the moment\nbuilds.',
    pieceNote: 'A short haft with a bevelled head',
    heroNote: 'A haft, a bevelled head, a counterweight and two dimension lines',
    piece: (b) => {
      b.part({ edge: 0.8 });
      b.lathe([[0.04, -0.5], [0.03, 0], [0.03, 0.5]], 6, {});
      b.part({ glow: 0.5, pivot: [0, 0.4, 0], axis: [0, 0, 1], swing: -0.45, stage: 1 });
      b.at({ p: [0, 0.4, 0] }, () => b.box(0.34, 0.2, 0.18, { center: true, taper: [0.85, 0.85] }));
      b.part({ glow: 0.2 });
      b.at({ p: [0, -0.5, 0] }, () => b.orb(0.07, { sides: 6, rings: 3 }));
    },
    hero: (b) => {
      b.fit('mass');
      // Haft along +Z from the hand.
      b.part({ edge: 0.8 });
      b.at({ r: [PI / 2, 0, 0] }, () => b.lathe([[0.07, -0.2], [0.045, 0.0], [0.04, 1.2], [0.06, 1.35]], 8, {}));
      // Counterweight on the butt.
      b.part({ glow: 0.2 });
      b.at({ p: [0, 0, -0.3] }, () => b.orb(0.1, { sides: 8, rings: 4 }));
      // The head, dropping forward on its hinge.
      b.part({ glow: 0.6, pivot: [0, 0, 1.2], axis: [1, 0, 0], swing: 0.45, stage: 1 });
      b.at({ p: [0, 0, 1.38] }, () => {
        b.box(0.62, 0.34, 0.4, { center: true, taper: [0.88, 0.88] });
        b.at({ p: [0, 0.18, 0] }, () => b.box(0.54, 0.06, 0.34, { taper: [0.9, 0.9] }));
      });
      // Two thin dimension lines marking the lever arm.
      b.part({ edge: 0.5, glow: 0.3 });
      b.tube((t) => [0.45, 0.4, lerp(0, 1.38, t)], { r: 0.006, sides: 3, segs: 2 });
      [0, 1.38].forEach((z) => b.at({ p: [0.45, 0.4, z], r: [0, 0, 0] }, () => b.box(0.01, 0.2, 0.01, { center: true })));
      b.at({ p: [0.45, 0.4, 1.38], r: [PI / 2, 0, 0] }, () => b.pyramid(3, 0.03, -0.1, {}));

      // Grip rings and a spiral wrap down the haft.
      b.part({ edge: 0.7 });
      for (let i = 0; i < 6; i++) b.at({ p: [0, 0, 0.1 + i * 0.17] }, () => b.torus(0.052, 0.01, { segs: 10, sides: 4 }));
      b.part({ crease: 30, edge: 0.2 });
      b.aimZ(() => b.tube(helixPath(0.05, 0.05, 7, 1.0, 0.1), { r: 0.008, sides: 3, segs: 50 }));
      // Strike faces, a peen and band plates on the head, folding with it.
      const head = { pivot: [0, 0, 1.2], axis: [1, 0, 0], swing: 0.45, stage: 1 };
      b.part({ ...head, glow: 0.9 });
      [-1, 1].forEach((s) => b.at({ p: [s * 0.34, 0, 1.38], r: [0, 0, -s * PI / 2] }, () => b.cylinder(0.15, 0.09, 10, { r1: 0.11 })));
      b.part({ ...head, edge: 0.9 });
      b.at({ p: [0, 0.2, 1.38] }, () => b.pyramid(4, 0.17, 0.2, { phase: PI / 4 }));
      [-0.18, 0.18].forEach((z) => b.at({ p: [0, 0, 1.38 + z] }, () => b.box(0.66, 0.38, 0.03, { center: true })));
    }
  },

  presslance: {
    title: 'A flattened wedge plough: the lance is a blade for pushing, not cutting.\nThe hero is the plough: a broad flat wedge pointing down the line with\nthree prongs raked out each side, a thick push plate behind it, and two\nskid shoes. The rakes spread wide as the plough bites.',
    pieceNote: 'A flat wedge with two side prongs',
    heroNote: 'A wedge, six raked prongs, a push plate and two skid shoes',
    piece: (b) => {
      b.part({ glow: 0.4 });
      b.at({ r: [PI / 2, 0, 0] }, () => b.prism([[-0.3, -0.35], [0.3, -0.35], [0.0, 0.5]], 0, 0.1, { taper: 0.6 }));
      [-1, 1].forEach((s, i) => {
        b.part({ pivot: [s * 0.2, 0, -0.3], axis: [0, 1, 0], swing: s * 0.5, stage: 1, delay: i * 0.08 });
        b.at({ p: [s * 0.26, 0, -0.1], r: [PI / 2, 0, 0] }, () => b.cylinder(0.03, 0.35, 5, { r1: 0.005 }));
      });

      // A ridge down the middle and three teeth on the edge.
      b.part({ edge: 0.9, glow: 0.3 });
      b.at({ p: [0, 0.07, 0] }, () => b.box(0.16, 0.05, 0.6, { taper: [0.7, 1] }));
      for (let i = 0; i < 3; i++) {
        b.part({ pivot: [0.2 - i * 0.05, 0, -0.1 + i * 0.2], axis: [0, 1, 0], swing: 0.5, stage: 1, delay: i * 0.06, glow: 0.3 });
        b.at({ p: [0.26 - i * 0.07, 0, -0.1 + i * 0.2], r: [PI / 2, -0.5, 0] }, () => b.pyramid(3, 0.035, 0.13, {}));
      }
    },
    hero: (b) => {
      b.fit('mass');
      // The wedge: flat in plan, pointing +z.
      b.part({ glow: 0.4 });
      b.prism([[-0.6, -0.3], [0.6, -0.3], [0.0, 1.0]], 0, 0.14, { taper: 0.7 });
      // Raked prongs, three each side, spreading as it bites.
      [-1, 1].forEach((s) => {
        for (let i = 0; i < 3; i++) {
          b.part({ pivot: [s * 0.5, 0.07, -0.2 + i * 0.12], axis: [0, 1, 0], swing: s * (0.3 + i * 0.12), stage: 1, delay: i * 0.07, glow: 0.2 });
          b.at({ p: [s * (0.55 + i * 0.05), 0.07, -0.2 + i * 0.2], r: [PI / 2 + 0.0, 0, 0] }, () => b.cylinder(0.035, 0.45 - i * 0.07, 5, { r1: 0.006 }));
        }
      });
      // Push plate behind.
      b.part({ edge: 0.8 });
      b.at({ p: [0, 0.2, -0.36] }, () => b.box(1.3, 0.5, 0.09, { center: true, taper: [0.95, 0.9] }));
      // Skid shoes.
      b.part();
      [-0.55, 0.55].forEach((x) => b.at({ p: [x, -0.02, -0.1], r: [PI / 2, 0, 0] }, () => b.cylinder(0.05, 0.6, 6, { r1: 0.03 })));

      // A stepped ridge down the spine of the wedge.
      b.part({ edge: 0.9, glow: 0.2 });
      for (let i = 0; i < 4; i++) b.at({ p: [0, 0.14, -0.1 + i * 0.2] }, () => b.box(0.52 - i * 0.11, 0.05, 0.12, { taper: [0.8, 1] }));
      // Teeth along both leading edges, springing out as the plough bites.
      [-1, 1].forEach((s) => {
        for (let i = 0; i < 5; i++) {
          b.part({ pivot: [s * (0.5 - i * 0.1), 0.07, -0.25 + i * 0.25], axis: [0, 1, 0], swing: s * 0.45, stage: 1, delay: i * 0.05, glow: 0.3 });
          b.at({ p: [s * (0.52 - i * 0.1), 0.07, -0.22 + i * 0.25], r: [PI / 2, s * -0.5, 0] }, () => b.pyramid(3, 0.04, 0.16, {}));
        }
      });
      // Two hydraulic rams behind the plate, and the bolts that hold it.
      b.part({ edge: 0.8 });
      [-0.35, 0.35].forEach((x) => {
        b.at({ p: [x, 0.2, -0.45], r: [-PI / 2, 0, 0] }, () => {
          b.cylinder(0.07, 0.5, 8, {});
          b.at({ p: [0, 0.5, 0] }, () => b.cylinder(0.04, 0.35, 6, {}));
        });
      });
      b.part({ glow: 0.5 });
      for (let i = 0; i < 6; i++) b.at({ p: [-0.5 + i * 0.2, 0.32, -0.31], r: [PI / 2, 0, 0] }, () => b.cylinder(0.025, 0.03, 6, {}));
    }
  }
};
