// Cosmic and gravity rigs. See earth.mjs for the conventions.
import { RigBuilder, PI, TAU, lerp, clamp, smooth, rng, ngon, star, arcBand, curve, arcPath, helixPath } from '../../packs/sandbox/src/assets/codex/RigKit.js';
void [RigBuilder, PI, TAU, lerp, clamp, smooth, rng, ngon, star, arcBand, curve, arcPath, helixPath];

export const COSMIC = {
  redshift: {
    title: 'A lance stretches down the line and redshifts as it goes.\nThe hero is the stretched wave: a thin spindle whose crest discs sit\nfurther apart the further they run, a spiral ribbon whose pitch opens\nup behind the tip, and a cooling tail.',
    pieceNote: 'A spindle with three crest rings whose spacing opens up',
    heroNote: 'A spindle, seven stretching crest discs, an opening spiral ribbon and a cooling tail',
    piece: (b) => {
      b.part({ glow: 0.6 });
      b.lathe([[0.001, 0.5], [0.05, 0.3], [0.05, -0.3], [0.001, -0.5]], 6, {});
      [0.28, 0.0, -0.36].forEach((y, i) => {
        b.part({ pivot: [0, y, 0], axis: [1, 0, 0], swing: 0.5 * (i + 1) * 0.5, stage: 1, delay: i * 0.1, edge: 0.8 });
        b.at({ p: [0, y, 0] }, () => b.torus(0.18 - i * 0.02, 0.014, { segs: 14, sides: 4 }));
      });
    },
    hero: (b) => {
      b.fit('mass');
      b.aimZ(() => {
        b.part({ glow: 0.9 });
        b.lathe([[0.001, 1.9], [0.04, 1.6], [0.06, 1.2], [0.05, 0.2], [0.03, -0.3]], 6, {});
        // Crest discs: each gap wider than the last.
        let y = 0.1;
        for (let i = 0; i < 7; i++) {
          const gap = 0.1 + i * 0.045;
          y += gap;
          b.part({ pivot: [0, y, 0], axis: [1, 0, 0], swing: 0.12 * (i + 1) * 0.6, stage: 1, delay: i * 0.05, edge: 0.8, glow: i === 6 ? 0.4 : 0 });
          b.at({ p: [0, y, 0] }, () => b.lathe([[0.17 + i * 0.012, -0.015], [0.2 + i * 0.012, 0], [0.17 + i * 0.012, 0.015]], 18, { cap: false }));
        }
        // A spiral ribbon whose pitch opens behind the tip.
        b.part({ crease: 40, edge: 0.3 });
        b.ribbon((t) => {
          const a = Math.pow(t, 0.7) * TAU * 3.2;
          return [Math.cos(a) * (0.1 + t * 0.1), 0.1 + Math.pow(t, 1.6) * 1.7, Math.sin(a) * (0.1 + t * 0.1)];
        }, { w: 0.05, segs: 50, up: [0, 1, 0] });
        // The cooling tail: three trailing streaks.
        for (let i = 0; i < 3; i++) {
          const a = (i / 3) * TAU;
          b.part({ pivot: [0, -0.1, 0], axis: [-Math.sin(a), 0, Math.cos(a)], swing: 0.4, stage: 1, delay: i * 0.1, glow: 0.2 });
          b.at({ p: [Math.cos(a) * 0.04, -0.1, Math.sin(a) * 0.04], r: [PI, 0, 0] }, () => b.lathe([[0.025, 0], [0.012, 0.35], [0.001, 0.75]], 4, {}));
        }
      });
    }
  },

  magnetar: {
    title: 'Paired magnetic lobes: a dead star that throws its field as it flies.\nThe hero is the magnetar: a dense core with polar jets fore and aft,\nand six dipole field loops wrapped round it, each loop swinging wide\nas the field is torn open.',
    pieceNote: 'A bead with two dipole loops and a polar needle',
    heroNote: 'A banded core, two polar jets, six dipole loops and an equatorial band',
    piece: (b) => {
      b.part({ glow: 1 });
      b.orb(0.1, { sides: 6, rings: 3 });
      b.part({ glow: 0.3 });
      b.lathe([[0.001, 0.5], [0.025, 0.2], [0.025, -0.2], [0.001, -0.5]], 4, { phase: PI / 4 });
      for (let i = 0; i < 2; i++) {
        const s = i ? 1 : -1;
        b.part({ pivot: [0, 0, 0], axis: [0, 1, 0], swing: s * 0.6, stage: 1, delay: i * 0.1, edge: 0.8 });
        b.tube((t) => [s * Math.pow(Math.sin(t * PI), 2) * 0.32, Math.cos(t * PI) * 0.4, 0], { r: 0.014, sides: 4, segs: 14 });
      }
    },
    hero: (b) => {
      b.fit('mass');
      b.aimZ(() => {
        // Core with a dense equatorial band.
        b.part({ glow: 1 });
        b.orb(0.2, { sides: 10, rings: 5 });
        b.part({ edge: 0.9 });
        b.torus(0.24, 0.025, { segs: 24, sides: 5 });
        // Polar jets.
        b.part({ glow: 0.5 });
        b.lathe([[0.001, 1.0], [0.035, 0.6], [0.05, 0.22]], 6, {});
        b.lathe([[0.001, -1.0], [0.035, -0.6], [0.05, -0.22]], 6, {});
        // Six dipole loops around the axis; each swings wide on the beat.
        for (let i = 0; i < 6; i++) {
          const a = (i / 6) * TAU;
          b.part({ pivot: [0, 0, 0], axis: [-Math.sin(a), 0, Math.cos(a)], swing: 0.5, stage: 1, delay: (i % 3) * 0.08, edge: 0.7, glow: 0.2 });
          b.at({ r: [0, a, 0] }, () => b.tube((t) => {
            const th = t * PI;
            const r = 0.9 * Math.pow(Math.sin(th), 2) + 0.01;
            return [Math.sin(th) * r * 0.55 + 0.001, Math.cos(th) * r, 0];
          }, { r: 0.012, sides: 4, segs: 28 }));
        }
      });
    }
  },

  zodiac: {
    title: 'A twelve-pointed celestial rim: signs walk the ring, the heavens turn.\nThe hero is the astrolabe: a rim set with twelve different sigils,\nspoked to a hub, and an armillary of three tilting bands floating\nin the middle that rolls over when the rim closes.',
    pieceNote: 'A medallion: a ring, a four-point star and a tiny moon',
    heroNote: 'A twelve-sigil rim, three spokes, a hub and a three-band armillary',
    piece: (b) => {
      b.part({ edge: 0.8 });
      b.at({ r: [PI / 2, 0, 0] }, () => b.torus(0.32, 0.02, { segs: 18, sides: 4 }));
      b.part({ glow: 0.9, pivot: [0, 0, 0], axis: [0, 0, 1], swing: 0.7, stage: 1 });
      b.at({ r: [PI / 2, 0, 0] }, () => b.prism(star(4, 0.26, 0.07), -0.02, 0.02, {}));
      b.part({ pivot: [0, 0, 0], axis: [0, 0, 1], swing: -0.6, stage: 1, delay: 0.15 });
      b.at({ p: [0.32, 0, 0] }, () => b.orb(0.05, { sides: 5, rings: 3 }));
    },
    hero: (b) => {
      b.fit('ring');
      b.part({ edge: 0.8 });
      b.at({ p: [0, 0.06, 0] }, () => b.torus(1, 0.03, { segs: 48, sides: 5 }));
      b.at({ p: [0, 0.06, 0] }, () => b.torus(0.82, 0.015, { segs: 40, sides: 4 }));
      // Twelve sigils, each a different solid.
      const glyph = [
        () => b.crystal({ sides: 4, r: 0.05, h: 0.18, tip: 0.4 }),
        () => b.orb(0.06, { sides: 6, rings: 3 }),
        () => b.pyramid(3, 0.07, 0.16, {}),
        () => b.prism(star(4, 0.08, 0.025), 0, 0.03, {}),
        () => b.torus(0.05, 0.015, { segs: 10, sides: 4 }),
        () => b.box(0.08, 0.12, 0.04, { taper: [0.5, 1] }),
        () => b.cylinder(0.05, 0.16, 6, { r1: 0.02 }),
        () => b.orb(0.05, { sides: 4, rings: 2, ey: 1.6 }),
        () => b.prism(ngon(5, 0.07), 0, 0.04, {}),
        () => b.prism(star(6, 0.08, 0.04), 0, 0.03, {}),
        () => b.crystal({ sides: 3, r: 0.05, h: 0.2, tip: 0.5 }),
        () => b.lathe([[0.07, 0], [0.03, 0.06], [0.07, 0.12]], 8, {})
      ];
      b.ring(12, 1.0, (i) => {
        b.part({ pivot: [0, 0.06, 0], axis: [1, 0, 0], swing: 0.9, stage: 1, delay: (i % 4) * 0.05, glow: i % 3 === 0 ? 0.6 : 0.15 });
        b.at({ p: [0, 0.06, 0] }, () => glyph[i]());
      });
      // Three spokes and a hub.
      b.part({ edge: 0.6 });
      for (let i = 0; i < 3; i++) b.at({ p: [0, 0.06, 0], r: [0, (i / 3) * PI, 0] }, () => b.at({ p: [-0.82, 0, 0], r: [0, 0, -PI / 2] }, () => b.cylinder(0.01, 1.64, 4, {})));
      b.part({ glow: 0.9 });
      b.at({ p: [0, 0.06, 0] }, () => b.orb(0.1, { sides: 8, rings: 4 }));
      // The armillary: three bands, each free to tip on its own axis.
      for (let i = 0; i < 3; i++) {
        b.part({ pivot: [0, 0.55, 0], axis: [Math.cos((i / 3) * PI), 0, Math.sin((i / 3) * PI)], swing: 0.9 + i * 0.3, stage: 1, delay: i * 0.1, edge: 0.8, glow: 0.2 });
        b.at({ p: [0, 0.55, 0], r: [0.5 * i, (i / 3) * PI, 0] }, () => b.torus(0.34 - i * 0.04, 0.018, { segs: 28, sides: 4 }));
      }
    }
  },

  quarkspire: {
    title: 'A three-strand quark helix: a spire that cannot be pulled apart.\nThe hero is the helix: three strands wound around one another, a\nquark bead riding each, gluon rungs tying them at every turn, and a\ntriangular foot. The strands wind and unwind about the axis.',
    pieceNote: 'A short three-strand twist with a bead on each strand',
    heroNote: 'Three helical strands, nine quark beads, twelve gluon rungs and a triangular foot',
    piece: (b) => {
      for (let i = 0; i < 3; i++) {
        b.part({ pivot: [0, 0, 0], axis: [0, 1, 0], swing: 0.9, stage: 1, delay: i * 0.08, glow: 0.35 });
        b.tube(helixPath(0.14, 0.14, 1.2, 1, -0.5, (i / 3) * TAU), { r: 0.018, sides: 4, segs: 20 });
        const a = (i / 3) * TAU + 1.2 * TAU;
        b.at({ p: [Math.cos(a) * 0.14, 0.5, Math.sin(a) * 0.14] }, () => b.orb(0.045, { sides: 5, rings: 3 }));
      }
    },
    hero: (b) => {
      b.fit('mass');
      b.part();
      b.prism(ngon(3, 0.75), 0, 0.07, { taper: 0.8 });
      // Three strands; each unwinds about the axis on the beat.
      for (let i = 0; i < 3; i++) {
        const phase = (i / 3) * TAU;
        b.part({ pivot: [0, 0, 0], axis: [0, 1, 0], swing: 0.9 - i * 0.15, stage: 1, delay: i * 0.08, glow: 0.35 });
        b.tube(helixPath(0.34, 0.26, 2.6, 1.7, 0.1, phase), { r: 0.032, sides: 5, segs: 56 });
        // Quark beads at three heights on this strand.
        [0.25, 0.55, 0.85].forEach((t) => {
          const a = phase + t * 2.6 * TAU;
          const r = lerp(0.34, 0.26, t);
          b.at({ p: [Math.cos(a) * r, 0.1 + t * 1.7, Math.sin(a) * r] }, () => b.orb(0.075, { sides: 6, rings: 3 }));
        });
      }
      // Gluon rungs tie neighbouring strands at four heights.
      b.part({ edge: 0.5, glow: 0.2 });
      for (let k = 0; k < 4; k++) {
        const t = 0.15 + k * 0.22;
        for (let i = 0; i < 3; i++) {
          const a0 = (i / 3) * TAU + t * 2.6 * TAU;
          const a1 = ((i + 1) / 3) * TAU + t * 2.6 * TAU;
          const r = lerp(0.34, 0.26, t);
          const y = 0.1 + t * 1.7;
          b.tube((u) => [lerp(Math.cos(a0), Math.cos(a1), u) * r, y, lerp(Math.sin(a0), Math.sin(a1), u) * r], { r: 0.008, sides: 3, segs: 2 });
        }
      }
    }
  },

  slingwell: {
    title: 'An eccentric accretion ramp: the well slings what it drinks.\nThe hero is the disc: a spiral ramp winding in to a dense core,\nthree slung stones riding the ramp at different radii, and an outer\nlip. The stones are flung outward on the exhale.',
    pieceNote: 'A short spiral ramp with a stone riding it',
    heroNote: 'A spiral ramp, a banded core mass, three slung stones and an outer lip',
    piece: (b) => {
      b.part({ crease: 40, edge: 0.5, pivot: [0, 0, 0], axis: [0, 1, 0], swing: 0.5, stage: 1 });
      b.ribbon(helixPath(0.38, 0.08, 1.6, -0.35, 0.2, 0), { w: 0.13, segs: 26, thick: 0.012, up: [0, 1, 0] });
      b.part({ glow: 0.6, pivot: [0, 0, 0], axis: [0, 1, 0], swing: -1.2, stage: 1 });
      b.at({ p: [0.3, 0.1, 0] }, () => b.orb(0.07, { sides: 6, rings: 3, ey: 0.85 }));
    },
    hero: (b) => {
      b.fit('ring');
      const rand = rng(81);
      // The ramp: a flat ribbon spiralling down and in.
      b.part({ crease: 40, edge: 0.4, pivot: [0, 0, 0], axis: [0, 1, 0], swing: 0.45, stage: 1 });
      b.ribbon(helixPath(0.95, 0.2, 2.4, -0.3, 0.38, 0), { w: 0.22, segs: 90, thick: 0.014, up: [0, 1, 0] });
      // The core: a dense mass with a belt.
      b.part({ glow: 0.8 });
      b.at({ p: [0, 0.14, 0] }, () => b.orb(0.2, { sides: 9, rings: 4, ey: 0.8 }));
      b.part({ edge: 0.9 });
      b.at({ p: [0, 0.14, 0] }, () => b.torus(0.25, 0.022, { segs: 20, sides: 5 }));
      // Three stones slung from the ramp at different radii.
      [0.82, 0.58, 0.38].forEach((r, i) => {
        const a = i * 2.1;
        b.part({ pivot: [0, 0, 0], axis: [0, 1, 0], swing: -1.1 - i * 0.4, stage: 1, delay: i * 0.1, glow: 0.35 });
        b.at({ p: [Math.cos(a) * r, 0.42 - r * 0.28, Math.sin(a) * r] }, () => b.orb(0.1 + rand() * 0.03, { sides: 6, rings: 3, ey: 0.85, jag: () => 0.9 + rand() * 0.2 }));
      });
      b.part({ edge: 0.8 });
      b.at({ p: [0, 0.02, 0] }, () => b.torus(1.03, 0.035, { segs: 48, sides: 5 }));
    }
  },

  tidebar: {
    title: 'Bowed tidal buttresses hold the circle against the pull.\nThe hero is the buttress ring: eight bowed bars leaning in, each braced\nby a flying arch that springs from its shoulder out to a foot plate,\nthe arches swinging wide as the tide lets go.',
    pieceNote: 'A bowed bar braced by one flying arch',
    heroNote: 'Eight bowed bars, eight flying arches, foot plates and a base ring',
    piece: (b) => {
      b.part({ pivot: [0, -0.5, 0], axis: [0, 0, 1], swing: -0.2, stage: 1 });
      b.tube((t) => [0.08 * Math.sin(t * PI), -0.5 + t * 1.0, 0], { r: 0.05, sides: 4, segs: 10 });
      b.part({ pivot: [0.04, 0.2, 0], axis: [0, 0, 1], swing: 0.5, stage: 1, delay: 0.1 });
      b.tube((t) => [0.04 + t * 0.34, 0.2 - Math.sin(t * PI * 0.6) * -0.0 - t * 0.5 + 0.18 * Math.sin(t * PI), 0], { r: 0.02, sides: 4, segs: 10 });
    },
    hero: (b) => {
      b.fit('ring');
      b.part({ edge: 0.7 });
      b.torus(1, 0.035, { segs: 40, sides: 4 });
      b.ring(8, 0.95, (i) => {
        // The bar bows outward through its middle.
        b.part({ pivot: [0, 0, 0], axis: [1, 0, 0], swing: -0.4, stage: 1, delay: (i % 2) * 0.1, glow: i % 4 === 0 ? 0.3 : 0 });
        b.tube((t) => [0, t * 1.2, 0.07 * Math.sin(t * PI) - t * 0.12], { r: lerp(0.07, 0.045, 0), sides: 4, segs: 12 });
        b.at({ p: [0, 1.2, -0.12] }, () => b.pyramid(4, 0.07, 0.1, { phase: PI / 4 }));
        // The flying arch springs from the shoulder out to a foot plate.
        b.part({ pivot: [0, 0.95, -0.05], axis: [1, 0, 0], swing: -0.55, stage: 1, delay: 0.1 + (i % 2) * 0.1, edge: 0.8 });
        b.tube((t) => [0, 0.95 - t * 0.9 + 0.12 * Math.sin(t * PI), -0.05 + t * 0.5], { r: 0.025, sides: 4, segs: 12 });
        b.at({ p: [0, 0.0, 0.5] }, () => b.box(0.16, 0.04, 0.14, {}));
      });
    }
  },

  perigee: {
    title: 'An eccentric low-orbit hoop: the circle is held, then let swing.\nThe hero is the orbit: an elliptical hoop tipped against the ground,\nan outer guide hoop, a moon on the near arc and a banded planet in the\nfocus. The hoops roll over on the beat.',
    pieceNote: 'A tilted elliptical hoop with a moon bead',
    heroNote: 'Two tilted elliptical hoops, a moon, a banded planet and an equator band',
    piece: (b) => {
      b.part({ edge: 0.8, pivot: [0, 0, 0], axis: [1, 0, 0], swing: 0.9, stage: 1 });
      b.at({ r: [0.5, 0, 0.2] }, () => b.tube((t) => [Math.cos(t * TAU) * 0.4, 0, Math.sin(t * TAU) * 0.24], { r: 0.018, sides: 5, segs: 24, closed: true }));
      b.part({ glow: 0.8, pivot: [0, 0, 0], axis: [1, 0, 0], swing: 0.9, stage: 1 });
      b.at({ r: [0.5, 0, 0.2] }, () => b.at({ p: [0.4, 0, 0] }, () => b.orb(0.06, { sides: 6, rings: 3 })));
      b.part({ glow: 0.4 });
      b.orb(0.1, { sides: 8, rings: 4 });
    },
    hero: (b) => {
      b.fit('ring');
      // The planet and its equator band.
      b.part({ glow: 0.4 });
      b.at({ p: [0, 0.35, 0] }, () => b.orb(0.22, { sides: 12, rings: 6 }));
      b.part({ edge: 0.8 });
      b.at({ p: [0, 0.35, 0], r: [0, 0, 0.35] }, () => b.torus(0.3, 0.018, { segs: 30, sides: 4 }));
      // Two elliptical hoops, tilted differently, rolling on the beat.
      [[1.0, 0.7, 0.28], [0.8, 0.55, -0.2]].forEach(([A, B, tilt], i) => {
        b.part({ pivot: [0, 0.35, 0], axis: [1, 0, 0], swing: 0.8 + i * 0.3, stage: 1, delay: i * 0.1, edge: 0.8, glow: i ? 0.2 : 0.3 });
        b.at({ p: [0, 0.35, 0], r: [tilt, i * 1.0, tilt * 0.5] }, () => b.tube((t) => [Math.cos(t * TAU) * A, 0, Math.sin(t * TAU) * B], { r: 0.03 - i * 0.008, sides: 5, segs: 56, closed: true }));
      });
      // The moon on the near arc of the first hoop.
      b.part({ glow: 0.8, pivot: [0, 0.35, 0], axis: [1, 0, 0], swing: 0.8, stage: 1 });
      b.at({ p: [0, 0.35, 0], r: [0.28, 0, 0.14] }, () => b.at({ p: [Math.cos(2.2) * 1.0, 0, Math.sin(2.2) * 0.7] }, () => b.orb(0.1, { sides: 7, rings: 4 })));
    }
  },

  masslance: {
    title: 'A dense oblate ram: more mass than lance, and it knows it.\nThe hero is the ram: a flattened spheroid armoured in three bands,\na heavy wedge on its nose, and three trailing weights on struts that\nswing out behind as it drives.',
    pieceNote: 'A flattened weight with a band and a blunt wedge nose',
    heroNote: 'An oblate spheroid, three armour bands, a wedge nose and three weighted struts',
    piece: (b) => {
      b.part({ glow: 0.3, pivot: [0, 0, 0], axis: [0, 0, 1], swing: 0.3, stage: 1 });
      b.orb(0.25, { sides: 9, rings: 4, ey: 0.65 });
      b.part({ edge: 0.8, pivot: [0, 0, 0], axis: [0, 0, 1], swing: -0.3, stage: 1, delay: 0.1 });
      b.torus(0.255, 0.02, { segs: 20, sides: 4 });
      b.part({ pivot: [0, 0.1, 0], axis: [0, 0, 1], swing: -0.5, stage: 1 });
      b.at({ p: [0, 0.16, 0] }, () => b.pyramid(4, 0.15, 0.22, { phase: PI / 4 }));
    },
    hero: (b) => {
      b.fit('mass');
      b.aimZ(() => {
        // The oblate ram, long axis along the cast after aimZ.
        b.part({ glow: 0.3 });
        b.orb(0.5, { sides: 14, rings: 6, ey: 0.62 });
        for (let i = 0; i < 3; i++) {
          b.part({ edge: 0.8 });
          b.at({ p: [0, (i - 1) * 0.2, 0] }, () => b.torus(0.5 * Math.sqrt(1 - (((i - 1) * 0.2) / 0.31) ** 2) + 0.01, 0.025, { segs: 28, sides: 5 }));
        }
        // The nose: a heavy wedge.
        b.part({ glow: 0.6, pivot: [0, 0.3, 0], axis: [0, 0, 1], swing: -0.25, stage: 1 });
        b.at({ p: [0, 0.28, 0] }, () => b.lathe([[0.3, 0], [0.34, 0.06], [0.18, 0.4], [0.02, 0.5]], 4, { phase: PI / 4 }));
        // Three weights trailing on struts.
        for (let i = 0; i < 3; i++) {
          const a = (i / 3) * TAU + 0.5;
          b.part({ pivot: [0, -0.3, 0], axis: [-Math.sin(a), 0, Math.cos(a)], swing: 0.65, stage: 1, delay: i * 0.08, glow: 0.2 });
          b.at({ p: [0, -0.3, 0] }, () => {
            b.tube((t) => [Math.cos(a) * 0.3 * t, -t * 0.5, Math.sin(a) * 0.3 * t], { r: 0.02, sides: 4, segs: 6 });
            b.at({ p: [Math.cos(a) * 0.3, -0.54, Math.sin(a) * 0.3] }, () => b.orb(0.09, { sides: 6, rings: 3 }));
          });
        }
      });
    }
  },

  shearorbit: {
    title: 'Sheared asteroid wedges: one rock cleaved, its pieces still falling round it.\nThe hero is the split asteroid: two halves offset along the shear\nplane, and four wedges of debris on their own tilted orbits that\nsweep round the pair when the volley turns.',
    pieceNote: 'A cleaved rock: two offset halves and a wedge shard',
    heroNote: 'Two offset rock halves, a shear seam, and four orbiting debris wedges',
    piece: (b) => {
      const rand = rng(91);
      b.part({ pivot: [0, 0, 0], axis: [0, 0, 1], swing: 0.3, stage: 1 });
      b.at({ p: [0, 0.07, 0] }, () => b.orb(0.22, { sides: 7, rings: 3, ey: 0.6, jag: () => 0.85 + rand() * 0.3 }));
      b.part({ pivot: [0, 0, 0], axis: [0, 0, 1], swing: -0.3, stage: 1 });
      b.at({ p: [0.06, -0.12, 0] }, () => b.orb(0.2, { sides: 7, rings: 3, ey: 0.55, jag: () => 0.85 + rand() * 0.3 }));
      b.part({ glow: 0.5, pivot: [0, 0, 0], axis: [0, 1, 0], swing: 1.2, stage: 1 });
      b.at({ p: [0.36, 0.05, 0] }, () => b.prism([[-0.07, -0.05], [0.07, -0.05], [0.0, 0.08]], 0, 0.08, { taper: 0.4 }));
    },
    hero: (b) => {
      b.fit('mass');
      const rand = rng(93);
      // Two halves of one rock, offset along the shear.
      b.part({ glow: 0.2, pivot: [0, 0, 0], axis: [0, 1, 0], swing: -0.25, stage: 1 });
      b.at({ p: [0.06, 0.17, 0] }, () => b.orb(0.46, { sides: 12, rings: 4, ey: 0.62, jag: () => 0.88 + rand() * 0.24 }));
      b.part({ glow: 0.2, pivot: [0, 0, 0], axis: [0, 1, 0], swing: 0.25, stage: 1 });
      b.at({ p: [-0.07, -0.17, 0] }, () => b.orb(0.42, { sides: 12, rings: 4, ey: 0.62, jag: () => 0.88 + rand() * 0.24 }));
      // The shear seam between them.
      b.part({ edge: 0.9, glow: 0.8 });
      b.at({ p: [0, 0, 0] }, () => b.torus(0.46, 0.012, { segs: 28, sides: 4 }));
      // Four debris wedges, each on its own tilted orbit about the pair.
      for (let i = 0; i < 4; i++) {
        const r = 0.8 + i * 0.12;
        const a = i * 1.7;
        b.part({ pivot: [0, 0, 0], axis: [Math.cos(i * 1.3), Math.sin(i * 1.1) * 0.5, Math.sin(i * 1.3)], swing: 1.1 + i * 0.2, stage: 1, delay: i * 0.05, glow: 0.2 });
        b.at({ p: [Math.cos(a) * r, 0.05 * i, Math.sin(a) * r], r: [rand(), rand() * 3, rand()] }, () => b.prism([[-0.12, -0.08], [0.12, -0.08], [0.0, 0.14]], 0, 0.1, { taper: 0.4 }));
      }
    }
  },

  plumbswing: {
    title: 'A terminal plumb weight: nothing in the swing but the weight at its end.\nThe hero is the plumb: a stiff rod from the hand ending in a ring and\ncord, and a heavy brass bob hung from them, point down, that swings\nunder the rod on the beat.',
    pieceNote: 'A short cord and a pointed brass bob',
    heroNote: 'A rod, a suspension ring, a cord, a brass bob with collar and a point, and a balance ring',
    piece: (b) => {
      b.part({ pivot: [0, 0.5, 0], axis: [0, 0, 1], swing: 0.45, stage: 1 });
      b.tube((t) => [0, 0.5 - t * 0.35, 0], { r: 0.01, sides: 4, segs: 3 });
      b.part({ glow: 0.4, pivot: [0, 0.5, 0], axis: [0, 0, 1], swing: 0.45, stage: 1 });
      b.at({ p: [0, -0.5, 0] }, () => b.lathe([[0.001, 0.62], [0.12, 0.5], [0.12, 0.34], [0.14, 0.3], [0.1, 0.1], [0.001, -0.1]], 9, {}));
    },
    hero: (b) => {
      b.fit('mass');
      // The rod from the hand, along +Z.
      b.part({ edge: 0.7 });
      b.at({ r: [PI / 2, 0, 0] }, () => b.lathe([[0.05, -0.1], [0.035, 0.1], [0.025, 1.4]], 8, {}));
      b.at({ p: [0, 0, 1.4] }, () => b.torus(0.06, 0.016, { segs: 10, sides: 4 }));
      // Cord and bob hang under the tip of the rod.
      b.part({ pivot: [0, 0, 1.4], axis: [1, 0, 0], swing: 0.5, stage: 1 });
      b.at({ p: [0, -0.05, 1.4] }, () => b.tube((t) => [0, -t * 0.5, 0], { r: 0.012, sides: 4, segs: 5 }));
      b.part({ glow: 0.4, pivot: [0, 0, 1.4], axis: [1, 0, 0], swing: 0.5, stage: 1 });
      b.at({ p: [0, -1.05, 1.4] }, () => {
        b.lathe([[0.001, 0.52], [0.1, 0.46], [0.11, 0.3], [0.2, 0.22], [0.24, 0.1], [0.2, -0.05], [0.09, -0.32], [0.001, -0.55]], 10, {});
      });
      b.part({ edge: 0.9, glow: 0.2, pivot: [0, 0, 1.4], axis: [1, 0, 0], swing: 0.5, stage: 1 });
      b.at({ p: [0, -0.78, 1.4] }, () => b.torus(0.24, 0.02, { segs: 20, sides: 5 }));
    }
  }
};
