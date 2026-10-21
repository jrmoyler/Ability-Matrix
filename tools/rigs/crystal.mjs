// Crystal and wind rigs. See earth.mjs for the conventions.
import { RigBuilder, PI, TAU, lerp, clamp, smooth, rng, ngon, star, arcBand, curve, arcPath, helixPath } from '../../packs/sandbox/src/assets/codex/RigKit.js';
void [RigBuilder, PI, TAU, lerp, clamp, smooth, rng, ngon, star, arcBand, curve, arcPath, helixPath];

export const CRYSTAL = {
  prismfault: {
    title: 'A fault of prism glass drills the line and throws three wakes.\nThe hero is the drill: a twisting three-sided bore with spiral\nflutes, and three wake shards trailing behind it that fan open.',
    pieceNote: 'A three-sided prism shard flanked by two shorter fault splinters',
    heroNote: 'A twisted trihedral bore, three helical flutes, a collar and three wake shards',
    piece: (b) => {
      b.part({ glow: 0.5 });
      b.crystal({ sides: 3, r: 0.17, h: 1, tip: 0.3, asym: 0.12, foot: 0 });
      for (let i = 0; i < 2; i++) {
        const s = i ? 1 : -1;
        b.part({ pivot: [s * 0.14, -0.2, 0], axis: [0, 0, 1], swing: s * -0.5, stage: 1, delay: 0.1 });
        b.at({ p: [s * 0.2, -0.35, 0], r: [0, 0, s * -0.15] }, () => b.crystal({ sides: 3, r: 0.07, h: 0.5, tip: 0.35, asym: 0.1 }));
      }

      // A second tier of fault splinters higher on the shard.
      for (let i = 0; i < 2; i++) {
        const s = i ? 1 : -1;
        b.part({ pivot: [s * 0.1, 0.2, 0], axis: [0, 0, 1], swing: s * -0.6, stage: 1, delay: 0.2 });
        b.at({ p: [s * 0.14, 0.12, 0.05], r: [0, 0, s * -0.3] }, () => b.crystal({ sides: 3, r: 0.045, h: 0.3, tip: 0.4 }));
      }
    },
    hero: (b) => {
      b.fit('mass');
      b.aimZ(() => {
        b.part({ glow: 0.85 });
        b.prism(ngon(3, 0.2), 0, 0.95, { taper: 0.02, twist: 2.6 });
        // Three helical flutes wind round the bore.
        for (let i = 0; i < 3; i++) {
          b.part({ edge: 0.8 });
          b.ribbon(helixPath(0.24, 0.05, 1.1, 0.9, 0.02, (i / 3) * TAU), { w: 0.1, segs: 22, up: [0, 1, 0] });
        }
        // Collar where the bore meets the wake.
        b.part();
        b.torus(0.24, 0.025, { segs: 18, sides: 4 });
        // The wake: three long shards trailing behind, fanning open on the beat.
        for (let i = 0; i < 3; i++) {
          const a = (i / 3) * TAU + 0.5;
          b.part({ pivot: [0, 0, 0], axis: [-Math.sin(a), 0, Math.cos(a)], swing: 0.55, stage: 1, delay: i * 0.1, glow: 0.3 });
          b.at({ p: [Math.cos(a) * 0.12, 0, Math.sin(a) * 0.12], r: [PI, 0, 0] }, () => b.crystal({ sides: 3, r: 0.07, h: 0.85, tip: 0.5, asym: 0.15 }));
        }
      });

      b.aimZ(() => {
        // A stand of loose prism splinters along the bore: three tiers of three.
        for (let tier = 0; tier < 3; tier++) {
          for (let i = 0; i < 3; i++) {
            const a = (i / 3) * TAU + tier * 0.6;
            b.part({ pivot: [Math.cos(a) * 0.22, 0.2 + tier * 0.25, Math.sin(a) * 0.22], axis: [-Math.sin(a), 0, Math.cos(a)], swing: 0.7, stage: 1, delay: tier * 0.07 + i * 0.03, glow: 0.35 });
            b.at({ p: [Math.cos(a) * 0.22, 0.2 + tier * 0.25, Math.sin(a) * 0.22], r: [0, -a + PI / 2, 0.55] }, () => b.crystal({ sides: 3, r: 0.035, h: 0.28 - tier * 0.04, tip: 0.5, asym: 0.1 }));
          }
        }
        // A clear tip crystal ahead of the bore.
        b.part({ glow: 1 });
        b.at({ p: [0, 0.92, 0] }, () => b.crystal({ sides: 3, r: 0.05, h: 0.3, tip: 0.6 }));
      });
    }
  },

  geodecage: {
    title: 'A geode seals shut and the inner points fire inward.\nThe hero is the geode: a rough lower shell lined with inward\ncrystals, and a domed lid hinged open that swings down to seal.',
    pieceNote: 'A crystal-lined cup with five inward points and a hinged lid',
    heroNote: 'A rough bowl shell, fourteen inward crystals, a hinged dome lid and a rim of teeth',
    piece: (b) => {
      const rand = rng(41);
      b.part();
      b.lathe([[0.1, -0.1], [0.3, -0.02], [0.4, 0.14], [0.36, 0.2], [0.28, 0.14]], 9, { jag: () => 0.92 + rand() * 0.16 });
      b.part({ glow: 0.6 });
      b.ring(5, 0.2, (i) => b.at({ r: [0.7, 0, 0] }, () => b.crystal({ sides: 4, r: 0.05, h: 0.28, tip: 0.4 })), { y: 0.08 });
      b.part({ pivot: [0.36, 0.2, 0], axis: [0, 0, 1], swing: -1.2, stage: 1 });
      b.at({ p: [0.36, 0.2, 0], r: [0, 0, 1.2] }, () => b.at({ p: [-0.36, 0, 0] }, () => b.lathe([[0.38, 0], [0.34, 0.12], [0.2, 0.24], [0.04, 0.3]], 9, { jag: () => 0.95 + rand() * 0.1 })));
    },
    hero: (b) => {
      b.fit('ring');
      const rand = rng(43);
      // Lower shell: a rough bowl, wall thick, jagged at the lip.
      b.part();
      b.lathe([[0.15, 0], [0.62, 0.05], [0.95, 0.3], [1.02, 0.58], [0.88, 0.62], [0.8, 0.42], [0.55, 0.18], [0.12, 0.1]], 18, { cap: false, jag: (i, j) => 0.94 + rand() * 0.12 });
      // Inner crystals: fourteen points aimed at the centre, in two tiers.
      b.part({ glow: 0.7 });
      b.ring(14, 0.84, (i) => {
        const tier = i % 2;
        b.at({ p: [0, 0.26 + tier * 0.22, 0], r: [-1.15 + tier * 0.3, 0, 0] }, () => b.crystal({ sides: 5, r: 0.07 + rand() * 0.03, h: 0.4 + rand() * 0.2, tip: 0.4, asym: 0.2 }));
      });
      // The lid: a dome hinged at the back lip, authored open.
      b.at({ p: [0, 0.6, -0.95], r: [-1.4, 0, 0] }, () => {
        b.part({ pivot: [0, 0, 0], axis: [1, 0, 0], swing: 1.4, stage: 1, delay: 0.05, glow: 0.2 });
        b.at({ p: [0, 0, 0.95] }, () => b.lathe([[0.95, 0], [0.9, 0.2], [0.65, 0.4], [0.3, 0.52], [0, 0.55]], 18, { cap: false, jag: () => 0.96 + rand() * 0.08 }));
      });
    }
  },

  shardchoir: {
    title: 'Shards choir around the rim, then converge on one note.\nThe hero is the choir: nine slender crystals of unequal height\nstanding in a ring, linked at the foot, each leaning inward on the\nconverge, with the held note hanging at their centre.',
    pieceNote: 'A tall crystal with two lesser voices leaning off its shoulders',
    heroNote: 'Nine standing shards, a linking foot ring, three inner voices and a floating note',
    piece: (b) => {
      b.part({ glow: 0.4 });
      b.crystal({ sides: 6, r: 0.13, h: 1, tip: 0.3, asym: 0.2 });
      for (let i = 0; i < 2; i++) {
        const s = i ? 1 : -1;
        b.part({ pivot: [s * 0.1, -0.35, 0], axis: [0, 0, 1], swing: s * -0.5, stage: 1, delay: 0.08 * (i + 1) });
        b.at({ p: [s * 0.2, -0.45, 0], r: [0, 0, s * -0.25] }, () => b.crystal({ sides: 5, r: 0.06, h: 0.5 - i * 0.12, tip: 0.35 }));
      }
    },
    hero: (b) => {
      b.fit('ring');
      const rand = rng(51);
      b.part({ edge: 0.6 });
      b.torus(0.95, 0.025, { segs: 36, sides: 4 });
      // The choir: nine shards, heights stepped like voices.
      b.ring(9, 0.95, (i) => {
        b.part({ pivot: [0, 0, 0], axis: [1, 0, 0], swing: -0.62, stage: 1, delay: (i % 3) * 0.08, glow: i % 3 === 0 ? 0.4 : 0 });
        b.at({ r: [0.12, 0, 0] }, () => b.crystal({ sides: 6, r: 0.07, h: 0.8 + (i % 3) * 0.28 + rand() * 0.1, tip: 0.3, asym: 0.2 }));
      });
      // Inner voices: three shorter shards on a smaller ring, leaning out.
      b.ring(3, 0.45, (i) => {
        b.part({ pivot: [0, 0, 0], axis: [1, 0, 0], swing: -0.4, stage: 1, delay: 0.25 });
        b.at({ r: [-0.2, 0, 0] }, () => b.crystal({ sides: 5, r: 0.05, h: 0.5, tip: 0.35 }));
      }, { phase: 0.5 });
      // The note: a held octahedron.
      b.part({ glow: 1 });
      b.at({ p: [0, 0.85, 0] }, () => b.orb(0.14, { sides: 4, rings: 2, ey: 1.5 }));
    }
  },

  lensewell: {
    title: 'A lens in the floor drinks the circle, then fires a column of glare.\nThe hero is the lens: a biconvex disc in a three-arc gimbal, an iris of\nprism teeth that fold open on the exhale, and the glass column above.',
    pieceNote: 'A biconvex lens in a thin frame with a cap that tips back',
    heroNote: 'A lens, a gimbal of three arc brackets, twelve iris teeth and a hex glass column',
    piece: (b) => {
      b.part({ glow: 0.5, pivot: [0, 0, 0], axis: [0, 0, 1], swing: 0.4, stage: 1 });
      b.at({ r: [PI / 2, 0, 0] }, () => b.lathe([[0.02, -0.06], [0.2, -0.03], [0.32, 0], [0.2, 0.03], [0.02, 0.06]], 12, { cap: false }));
      b.part({ edge: 1, pivot: [0, 0, 0], axis: [0, 0, 1], swing: -0.4, stage: 1, delay: 0.1 });
      b.at({ r: [PI / 2, 0, 0] }, () => b.torus(0.33, 0.022, { segs: 14, sides: 4 }));
      b.part({ pivot: [0, 0.33, 0], axis: [1, 0, 0], swing: 0.9, stage: 1 });
      b.at({ p: [0, 0.38, 0] }, () => b.pyramid(4, 0.1, 0.22, { phase: PI / 4 }));
    },
    hero: (b) => {
      b.fit('ring');
      // The lens itself, low in the floor.
      b.part({ glow: 0.9 });
      b.lathe([[0.02, 0.2], [0.35, 0.22], [0.7, 0.19], [0.82, 0.12], [0.7, 0.05], [0.35, 0.02], [0.02, 0]], 28, { cap: false });
      // Gimbal: three arc brackets at different tilts.
      for (let i = 0; i < 3; i++) {
        b.part({ edge: 0.9 });
        b.at({ p: [0, 0.14, 0], r: [0, (i / 3) * PI, i * 0.35] }, () => b.tube(arcPath(0.92, 0.15, PI - 0.15, 0), { r: 0.025, sides: 4, segs: 14 }));
      }
      // Iris: twelve prism teeth that fold open on the exhale.
      b.ring(12, 0.86, (i) => {
        b.part({ pivot: [0, 0.1, 0], axis: [1, 0, 0], swing: 1.2, stage: 1, delay: (i % 3) * 0.07 });
        b.at({ p: [0, 0.1, 0], r: [-0.4, 0, 0] }, () => b.crystal({ sides: 3, r: 0.07, h: 0.5, tip: 0.5, asym: 0.15 }));
      });
      // The glare column: a tall hex glass rising from the lens.
      b.part({ glow: 0.5 });
      b.at({ p: [0, 0.2, 0] }, () => b.lathe([[0.05, 0], [0.17, 0.02], [0.14, 0.9], [0.05, 1.1]], 6, { jag: (i, j) => (j % 2 ? 0.85 : 1) }));
    }
  },

  facetvolley: {
    title: 'Faceted seeds arc down the line and plant where they strike.\nThe hero is one seed in flight: a cut gem, four tail fins that fold\nshut as it dives, and three root crystals that splay open when it plants.',
    pieceNote: 'A brilliant-cut gem with a crown, a girdle and a pointed pavilion',
    heroNote: 'A brilliant-cut seed, four tail fins, a girdle ring and three splaying roots',
    piece: (b) => {
      b.part({ glow: 0.6 });
      b.lathe([[0.001, 0.5], [0.12, 0.42], [0.3, 0.18], [0.32, 0.12], [0.28, 0.08], [0.2, -0.1], [0.001, -0.5]], 8, { phase: PI / 8, jag: (i, j) => (i === 1 || i === 4 ? 1 : 1 + (j % 2 ? -0.06 : 0.06)) });
      b.part({ pivot: [0, 0.15, 0], axis: [0, 0, 1], swing: -0.6, stage: 1 });
      b.at({ p: [0.28, 0.14, 0], r: [0, 0, -0.9] }, () => b.crystal({ sides: 4, r: 0.04, h: 0.25, tip: 0.5 }));
    },
    hero: (b) => {
      b.fit('mass');
      b.aimZ(() => {
        // The seed: crown, girdle, pavilion.
        b.part({ glow: 0.8 });
        b.lathe([[0.001, 0.62], [0.1, 0.54], [0.24, 0.3], [0.27, 0.24], [0.25, 0.2], [0.17, 0], [0.001, -0.3]], 8, { phase: PI / 8, jag: (i, j) => (i === 3 || i === 4 ? 1 : 1 + (j % 2 ? -0.05 : 0.05)) });
        b.part();
        b.at({ p: [0, 0.22, 0] }, () => b.torus(0.27, 0.014, { segs: 16, sides: 4 }));
        // Tail fins: fold shut as the seed dives.
        for (let i = 0; i < 4; i++) {
          const a = (i / 4) * TAU + PI / 4;
          b.part({ pivot: [Math.cos(a) * 0.15, -0.28, Math.sin(a) * 0.15], axis: [-Math.sin(a), 0, Math.cos(a)], swing: -0.55, delay: 0, stage: 0 });
          b.at({ p: [Math.cos(a) * 0.15, -0.28, Math.sin(a) * 0.15], r: [PI, 0, 0] }, () => b.blade({ len: 0.5, w: 0.06, thick: 0.012, segs: 4 }));
        }
        // Roots: three crystals that splay on the beat.
        for (let i = 0; i < 3; i++) {
          const a = (i / 3) * TAU;
          b.part({ pivot: [0, -0.3, 0], axis: [-Math.sin(a), 0, Math.cos(a)], swing: 0.9, stage: 1, delay: i * 0.08, glow: 0.4 });
          b.at({ p: [0, -0.3, 0], r: [PI, 0, 0] }, () => b.crystal({ sides: 4, r: 0.05, h: 0.45, tip: 0.5 }));
        }
      });
    }
  },

  needleglass: {
    title: 'A needle of glass swings across the cast and shatters on the far side.\nThe hero is the needle: a long four-sided stiletto hinged at the hand\nwith a faceted guard, and a column of glass collars that slide loose\nand tumble off on the shatter.',
    pieceNote: 'A fine four-sided needle with three loose collars',
    heroNote: 'A stiletto, a faceted guard, a tang and seven collars that shake loose',
    piece: (b) => {
      b.part({ glow: 0.5 });
      b.lathe([[0.001, -0.5], [0.05, -0.42], [0.05, 0.1], [0.001, 0.5]], 4, { phase: PI / 4 });
      for (let i = 0; i < 3; i++) {
        b.part({ pivot: [0, -0.2 + i * 0.22, 0], axis: [0, 0, 1], swing: (i - 1) * 0.7, stage: 1, delay: i * 0.1 });
        b.at({ p: [0, -0.25 + i * 0.22, 0] }, () => b.torus(0.09, 0.02, { segs: 8, sides: 4 }));
      }
    },
    hero: (b) => {
      b.fit('mass');
      b.aimZ(() => {
        // The stiletto: long, tapering, four-sided.
        b.part({ glow: 0.7 });
        b.lathe([[0.001, 0.0], [0.06, 0.05], [0.07, 0.15], [0.045, 0.8], [0.001, 1.4]], 4, { phase: PI / 4 });
        // Guard: two faceted quillons.
        b.part();
        for (let i = 0; i < 2; i++) {
          const s = i ? 1 : -1;
          b.at({ p: [s * 0.1, 0.1, 0], r: [0, 0, -s * PI / 2] }, () => b.crystal({ sides: 4, r: 0.04, h: 0.22, tip: 0.5 }));
        }
        // Tang and pommel.
        b.at({ p: [0, 0, 0] }, () => b.lathe([[0.04, 0], [0.03, -0.18], [0.07, -0.26], [0.001, -0.32]], 6, {}));
        // Collars: seven glass rings along the blade, each shaking loose at its own time.
        for (let i = 0; i < 7; i++) {
          const y = 0.25 + i * 0.15;
          b.part({ pivot: [0, y, 0], axis: [Math.cos(i * 2.1), 0, Math.sin(i * 2.1)], swing: (i % 2 ? 1 : -1) * 0.8, stage: 1, delay: i * 0.06, edge: 0.9 });
          b.at({ p: [0, y, 0] }, () => b.torus(0.1 - i * 0.008, 0.016, { segs: 10, sides: 4 }));
        }
      });
    }
  }
};
