// Arcane and illusion rigs. See earth.mjs for the conventions.
import { RigBuilder, PI, TAU, lerp, clamp, smooth, rng, ngon, star, arcBand, curve, arcPath, helixPath } from '../../packs/sandbox/src/assets/codex/RigKit.js';
void [RigBuilder, PI, TAU, lerp, clamp, smooth, rng, ngon, star, arcBand, curve, arcPath, helixPath];

export const ARCANE = {
  bindrune: {
    title: 'Angular rune brackets bind the circle shut.\nThe hero is the binding: six standing stones each cut with a raised\nbracket glyph on their inner face and a rune diamond floating above,\nstrung together on a hexagram of thin lines. The stones lean in as the\nbinding is drawn tight.',
    pieceNote: 'A small standing stone with a bracket glyph and a floating rune',
    heroNote: 'Six glyph stones, six floating runes, a hexagram of six lines and a centre sigil ring',
    piece: (b) => {
      b.part({ pivot: [0, -0.5, 0], axis: [0, 0, 1], swing: -0.3, stage: 1 });
      b.at({ p: [0, -0.5, 0] }, () => b.box(0.3, 0.8, 0.12, { taper: [0.75, 0.8] }));
      b.part({ glow: 0.6, edge: 1, pivot: [0, -0.5, 0], axis: [0, 0, 1], swing: -0.3, stage: 1 });
      b.at({ p: [0, -0.15, 0.075] }, () => {
        b.box(0.05, 0.3, 0.03, {});
        b.at({ p: [0.0, 0.0, 0] }, () => b.box(0.14, 0.04, 0.03, {}));
        b.at({ p: [0, 0.26, 0] }, () => b.box(0.14, 0.04, 0.03, {}));
      });
      b.part({ glow: 1, pivot: [0, 0.1, 0], axis: [0, 1, 0], swing: 1.2, stage: 1 });
      b.at({ p: [0, 0.42, 0] }, () => b.orb(0.06, { sides: 4, rings: 2, ey: 1.5 }));

      // Base ring and two side glyph ticks.
      b.part({ edge: 0.8 });
      b.at({ p: [0, -0.5, 0] }, () => b.torus(0.24, 0.015, { segs: 14, sides: 4 }));
      b.part({ glow: 0.5, edge: 1, pivot: [0, -0.5, 0], axis: [0, 0, 1], swing: -0.3, stage: 1 });
      [-0.1, 0.1].forEach((x) => b.at({ p: [x, -0.3, 0.075] }, () => b.box(0.03, 0.2, 0.02, {})));
    },
    hero: (b) => {
      b.fit('ring');
      // Hexagram on the floor: two triangles of thin bars.
      b.part({ edge: 0.8, glow: 0.3 });
      [0, PI / 6].forEach((ph) => {
        for (let i = 0; i < 3; i++) {
          const a0 = ph + (i / 3) * TAU;
          const a1 = ph + ((i + 1) / 3) * TAU;
          b.tube((t) => [lerp(Math.cos(a0), Math.cos(a1), t) * 0.95, 0.03, lerp(Math.sin(a0), Math.sin(a1), t) * 0.95], { r: 0.012, sides: 4, segs: 2 });
        }
      });
      b.at({ p: [0, 0.03, 0] }, () => b.torus(0.3, 0.015, { segs: 24, sides: 4 }));
      // Six stones; the glyph is raised on the inner (−z) face.
      b.ring(6, 0.95, (i) => {
        b.part({ pivot: [0, 0, 0], axis: [1, 0, 0], swing: -0.4, stage: 1, delay: (i % 2) * 0.1 });
        b.box(0.34, 0.95, 0.14, { taper: [0.7, 0.85] });
        b.part({ glow: 0.7, edge: 1, pivot: [0, 0, 0], axis: [1, 0, 0], swing: -0.4, stage: 1, delay: (i % 2) * 0.1 });
        b.at({ p: [0, 0.2, -0.075] }, () => {
          b.box(0.05, 0.45, 0.03, {});
          b.box(0.16, 0.05, 0.03, {});
          b.at({ p: [0, 0.4, 0] }, () => b.box(0.16, 0.05, 0.03, {}));
        });
        b.part({ glow: 1, pivot: [0, 0, 0], axis: [1, 0, 0], swing: -0.4, stage: 1, delay: (i % 2) * 0.1 });
        b.at({ p: [0, 1.15, 0] }, () => b.orb(0.07, { sides: 4, rings: 2, ey: 1.5 }));
      });
    }
  },

  leywhip: {
    title: 'A zigzag ley ribbon: the line the earth remembers, flicked loose.\nThe hero is the ley line: six straight segments laid in a zigzag with a\nglyph node at every bend, each segment hinged at its joint to flex\nalternately as the whip cracks, trailing a thin parallel guide.',
    pieceNote: 'A three-segment zigzag with a node at each joint',
    heroNote: 'Six zigzag segments, seven glyph nodes and a parallel guide ribbon',
    piece: (b) => {
      const pts = [[-0.2, -0.5], [0.2, -0.17], [-0.2, 0.17], [0.2, 0.5]];
      pts.forEach(([x, y], i) => {
        b.part({ glow: 0.8 });
        b.at({ p: [x, y, 0] }, () => b.orb(0.05, { sides: 4, rings: 2, ey: 1.4 }));
        if (i < pts.length - 1) {
          const [x2, y2] = pts[i + 1];
          b.part({ pivot: [x, y, 0], axis: [0, 0, 1], swing: (i % 2 ? -1 : 1) * 0.4, stage: 1, delay: i * 0.1, edge: 0.9 });
          b.tube((t) => [lerp(x, x2, t), lerp(y, y2, t), 0], { r: 0.022, sides: 4, segs: 2 });
        }
      });
    },
    hero: (b) => {
      b.fit('mass');
      const node = (i) => [(i % 2 ? 0.28 : -0.28), 0.5, i * 0.3];
      for (let i = 0; i < 7; i++) {
        const [x, y, z] = node(i);
        b.part({ glow: 0.9 });
        b.at({ p: [x, y, z] }, () => b.orb(0.07, { sides: 4, rings: 2, ey: 1.4 }));
        if (i < 6) {
          const [x2, y2, z2] = node(i + 1);
          b.part({ pivot: [x, y, z], axis: [0, 1, 0], swing: (i % 2 ? -1 : 1) * 0.35, stage: 1, delay: i * 0.06, edge: 0.9, glow: 0.2 });
          b.tube((t) => [lerp(x, x2, t), y, lerp(z, z2, t)], { r: 0.03, sides: 4, segs: 2 });
          b.part({ pivot: [x, y, z], axis: [0, 1, 0], swing: (i % 2 ? -1 : 1) * 0.35, stage: 1, delay: i * 0.06, edge: 0.6 });
          b.tube((t) => [lerp(x, x2, t) * 0.4, y - 0.12, lerp(z, z2, t)], { r: 0.008, sides: 3, segs: 2 });
        }
      }

      // Rings round each node and a pair of sparks either side.
      for (let i = 0; i < 7; i++) {
        const [x, y, z] = node(i);
        b.part({ edge: 0.9, glow: 0.3 });
        b.at({ p: [x, y, z], r: [PI / 2, 0, 0] }, () => b.torus(0.12, 0.012, { segs: 14, sides: 4 }));
        b.part({ glow: 0.9, pivot: [x, y, z], axis: [0, 0, 1], swing: (i % 2 ? -1 : 1) * 0.8, stage: 1, delay: i * 0.05 });
        [-1, 1].forEach((s) => b.at({ p: [x + s * 0.12, y + 0.1, z], r: [0, 0, -s * 0.8] }, () => b.pyramid(3, 0.025, 0.12, {})));
      }
      // Glyph ticks along each segment.
      b.part({ edge: 0.6, glow: 0.4 });
      for (let i = 0; i < 6; i++) {
        const [x, , z] = node(i);
        const [x2, , z2] = node(i + 1);
        [0.3, 0.55, 0.8].forEach((t) => b.at({ p: [lerp(x, x2, t), 0.56, lerp(z, z2, t)] }, () => b.box(0.03, 0.02, 0.07, {})));
      }
    }
  },

  manawell: {
    title: 'A five-lobed sigil funnel: the circle drinks mana and holds it in a star.\nThe hero is the basin: a bowl whose rim swells into five lobes, five\npetal wards standing on the lobes, and a pentagonal column of drunk\nmana rising from the middle under a turning sigil ring.',
    pieceNote: 'A five-lobed bowl with a rising pentagonal pip',
    heroNote: 'A five-lobe basin, five petal wards, a pentagonal column and a sigil ring',
    piece: (b) => {
      b.part({ crease: 30 });
      b.lathe([[0.001, -0.15], [0.2, -0.1], [0.34, 0.05], [0.4, 0.2]], 20, { cap: false, jag: (i, j) => 1 + (i >= 2 ? 0.16 * Math.cos((j / 20) * TAU * 5) : 0) });
      b.part({ glow: 0.9, pivot: [0, 0, 0], axis: [0, 1, 0], swing: 1.0, stage: 1 });
      b.at({ p: [0, 0.0, 0] }, () => b.prism(ngon(5, 0.07), 0, 0.5, { taper: 0.4 }));
    },
    hero: (b) => {
      b.fit('ring');
      b.part({ crease: 30, edge: 0.5 });
      b.lathe([[0.1, 0.0], [0.5, 0.05], [0.85, 0.22], [1.0, 0.45]], 40, { cap: false, jag: (i, j) => 1 + (i >= 2 ? 0.14 * Math.cos((j / 40) * TAU * 5) : 0) });
      // Five petal wards standing on the lobes.
      b.ring(5, 0.95, (i) => {
        b.part({ pivot: [0, 0.4, 0], axis: [1, 0, 0], swing: 0.55, stage: 1, delay: (i % 2) * 0.1, glow: 0.35 });
        b.at({ p: [0, 0.4, 0] }, () => b.blade({ len: 0.7, w: 0.17, thick: 0.02, segs: 6 }));
      });
      // The mana column and its turning ring.
      b.part({ glow: 0.9, pivot: [0, 0, 0], axis: [0, 1, 0], swing: 1.2, stage: 1 });
      b.prism(ngon(5, 0.13), 0.02, 1.4, { taper: 0.35 });
      b.part({ edge: 0.9, glow: 0.5, pivot: [0, 1.0, 0], axis: [1, 0, 0], swing: 0.6, stage: 1, delay: 0.1 });
      b.at({ p: [0, 1.0, 0] }, () => b.torus(0.32, 0.02, { segs: 20, sides: 4 }));
      b.at({ p: [0, 1.0, 0], r: [0, 0, 0] }, () => b.prism(star(5, 0.3, 0.16), -0.01, 0.01, {}));
    }
  },

  sigilvolley: {
    title: 'Star sigil darts: five-pointed seals thrown spear-first.\nThe hero is the dart: a five-point star seal facing forward, a spike\ndriven through its centre, a binding ring behind it and five small\nrunes that spiral off the seal as it flies.',
    pieceNote: 'A five-point seal with a spike through it',
    heroNote: 'A star seal, a spike, a binding ring and five spiralling runes',
    piece: (b) => {
      b.part({ glow: 0.6 });
      b.at({ r: [PI / 2, 0, 0] }, () => b.prism(star(5, 0.34, 0.15), -0.025, 0.025, {}));
      b.part({ edge: 0.8 });
      b.lathe([[0.001, 0.5], [0.04, 0.3], [0.04, -0.3], [0.001, -0.5]], 4, { phase: PI / 4 });
      b.part({ glow: 1, pivot: [0, 0, 0], axis: [0, 1, 0], swing: 1.4, stage: 1 });
      b.at({ p: [0.24, 0, 0] }, () => b.orb(0.035, { sides: 4, rings: 2, ey: 1.4 }));
    },
    hero: (b) => {
      b.fit('mass');
      b.aimZ(() => {
        // The seal faces forward, stacked as two plates: a bright star over a wider dark one.
        b.part({ glow: 0.5 });
        b.prism(star(5, 0.55, 0.24, PI / 2), 0.0, 0.06, {});
        b.part({ edge: 0.9 });
        b.prism(star(5, 0.42, 0.2, PI / 2), 0.06, 0.1, { taper: 0.9 });
        // Spike driven through the middle.
        b.part({ glow: 0.9 });
        b.lathe([[0.001, 1.3], [0.04, 0.9], [0.06, 0.1], [0.05, -0.5]], 5, { phase: PI / 10 });
        // The binding ring behind.
        b.part({ edge: 0.9 });
        b.at({ p: [0, -0.25, 0] }, () => b.torus(0.3, 0.02, { segs: 20, sides: 4 }));
        // Five runes spiralling off.
        for (let i = 0; i < 5; i++) {
          const a = (i / 5) * TAU;
          b.part({ glow: 1, pivot: [0, 0, 0], axis: [0, 1, 0], swing: 1.2, stage: 1, delay: i * 0.05 });
          b.at({ p: [Math.cos(a) * 0.62, -0.1 - i * 0.12, Math.sin(a) * 0.62] }, () => b.orb(0.05, { sides: 4, rings: 2, ey: 1.5 }));
        }
      });

      b.aimZ(() => {
        // A second, wider plate behind the seal, turned half a point and swinging against it.
        b.part({ glow: 0.4, pivot: [0, 0, 0], axis: [0, 1, 0], swing: -0.9, stage: 1 });
        b.at({ p: [0, -0.04, 0] }, () => b.prism(star(5, 0.66, 0.32, PI / 2 + PI / 5), 0, 0.04, {}));
        // Tick marks round the binding ring.
        b.part({ edge: 0.9, glow: 0.6 });
        b.ring(10, 0.3, () => b.box(0.02, 0.06, 0.05, {}), { y: -0.25 });
        // Five barbs on the face of the seal.
        b.part({ glow: 0.9 });
        for (let i = 0; i < 5; i++) {
          const a = (i / 5) * TAU + PI / 2;
          b.at({ p: [Math.cos(a) * 0.5, 0.1, Math.sin(a) * 0.5] }, () => b.pyramid(3, 0.04, 0.14, {}));
        }
      });
    }
  },

  doppel: {
    title: 'A split mirrored spearhead: the lance and the two lances it was.\nThe hero is the trio: a bright leaf-bladed spearhead flanked by two\nechoes set a hand-width apart, each on a socket, the echoes fanning\nout from the true head about the socket as the lance splits.',
    pieceNote: 'A spear leaf with one echo beside it',
    heroNote: 'Three leaf spearheads, three sockets and a shared binding ring',
    piece: (b) => {
      b.part({ glow: 0.5 });
      b.blade({ len: 1, w: 0.12, thick: 0.02, segs: 8 });
      b.part({ pivot: [0, 0, 0], axis: [0, 0, 1], swing: -0.45, stage: 1, edge: 0.7 });
      b.at({ p: [0.12, -0.04, -0.03] }, () => b.blade({ len: 0.8, w: 0.1, thick: 0.015, segs: 6 }));
    },
    hero: (b) => {
      b.fit('mass');
      b.aimZ(() => {
        // The true head.
        b.part({ glow: 0.5 });
        b.at({ p: [0, 0.2, 0] }, () => b.blade({ len: 1.5, w: 0.14, thick: 0.03, segs: 12, shape: (t) => Math.sin(Math.PI * Math.pow(t, 0.55)) * (1 - 0.2 * t) }));
        b.lathe([[0.06, 0.25], [0.045, 0.0], [0.05, -0.4], [0.08, -0.46], [0.001, -0.52]], 8, {});
        // Two echoes, mirrored, smaller, each hinged on its own socket.
        [-1, 1].forEach((s, k) => {
          b.part({ edge: 0.7, glow: 0.2, pivot: [0, 0, 0], axis: [0, 0, 1], swing: s * -0.5, stage: 1, delay: k * 0.1 });
          b.at({ p: [s * 0.2, 0.15, -0.06] }, () => b.blade({ len: 1.2, w: 0.1, thick: 0.02, segs: 10 }));
          b.at({ p: [s * 0.2, -0.05, -0.06] }, () => b.lathe([[0.04, 0.2], [0.03, 0], [0.001, -0.2]], 6, {}));
        });
        // The binding ring.
        b.part({ edge: 0.9, glow: 0.4 });
        b.at({ p: [0, 0.18, 0] }, () => b.torus(0.12, 0.016, { segs: 16, sides: 4 }));
      });
    }
  },

  falsefloor: {
    title: 'A floor of stepped, folding false tiles.\nThe hero is the floor: three rings of square tiles laid like paving,\neach tile hinged on its inner edge so alternate ones fold away when the\nfloor gives out, over a pit disc with a ghost floor still sitting under it.',
    pieceNote: 'A trapdoor: one tile hinged over a dark pit',
    heroNote: 'Forty-two hinged tiles in three rings, a pit disc, a ghost floor and a threshold ring',
    piece: (b) => {
      b.part({ glow: 0.1 });
      b.cylinder(0.3, 0.04, 4, { phase: PI / 4 });
      b.part({ pivot: [-0.2, 0.05, 0], axis: [0, 0, 1], swing: 1.3, stage: 1 });
      b.at({ p: [0, 0.05, 0] }, () => b.box(0.4, 0.05, 0.4, { taper: [1, 1] }));
      b.part({ pivot: [0.1, 0.05, 0], axis: [0, 0, 1], swing: -1.3, stage: 1, delay: 0.1, glow: 0.4 });
      b.at({ p: [0.25, 0.05, 0] }, () => b.box(0.18, 0.05, 0.4, {}));

      // Rivets in the corners and two more small tiles of the false floor.
      b.part({ glow: 0.5, edge: 1 });
      [[-0.26, -0.26], [0.26, -0.26], [-0.26, 0.26], [0.26, 0.26]].forEach(([x, z]) => b.at({ p: [x, 0.07, z] }, () => b.cylinder(0.03, 0.03, 6, {})));
      for (let i = 0; i < 2; i++) {
        b.part({ pivot: [0.2, 0.05, -0.15 + i * 0.3], axis: [0, 0, 1], swing: -1.2, stage: 1, delay: 0.15 + i * 0.07 });
        b.at({ p: [0.3, 0.06, -0.15 + i * 0.3] }, () => b.box(0.16, 0.04, 0.14, {}));
      }
    },
    hero: (b) => {
      b.fit('ring');
      // The pit: dark disc and a ghost floor above it.
      b.part({ glow: 0.05 });
      b.cylinder(0.98, 0.03, 36, {});
      b.part({ edge: 0.7 });
      b.at({ p: [0, 0.01, 0] }, () => b.torus(1.0, 0.03, { segs: 40, sides: 4 }));
      // Three rings of tiles hinged on their inner edge; alternate tiles fold away.
      [[0.82, 14, 0.2], [0.58, 10, 0.17], [0.34, 6, 0.15]].forEach(([r, n, w], ring) => {
        b.ring(n, r, (i) => {
          const folds = i % 2 === 0;
          b.part({ pivot: [0, 0.08, -w * 0.45], axis: [1, 0, 0], swing: folds ? -1.35 : 0.2, stage: 1, delay: ring * 0.08 + (i % 3) * 0.04, glow: folds ? 0.1 : 0.25 });
          b.at({ p: [0, 0.03, 0] }, () => b.box(w * 1.25, 0.05, w, { taper: [0.97, 0.97] }));
        });
      });
      b.part({ glow: 0.5 });
      b.at({ p: [0, 0.03, 0] }, () => b.cylinder(0.12, 0.08, 8, {}));
    }
  },

  mirrorhalo: {
    title: 'A pleated mirror polygon: the circle folded into twelve faces.\nThe hero is the hall of mirrors: twelve framed panels standing round the\nrim, each alternate one angled the other way like pleats in cloth, a\nfaceted diamond hanging in the middle, all turning to catch the light.',
    pieceNote: 'A framed mirror panel with a hinged side leaf',
    heroNote: 'Twelve framed mirror panels, twelve frame caps and a hanging diamond',
    piece: (b) => {
      b.part({ glow: 0.2 });
      b.box(0.34, 0.8, 0.03, { center: true });
      b.part({ edge: 1 });
      b.at({ p: [0, 0, 0.02] }, () => b.box(0.4, 0.86, 0.015, { center: true, taper: [0.88, 0.95] }));
      b.part({ pivot: [0.17, 0, 0], axis: [0, 1, 0], swing: -0.9, stage: 1 });
      b.at({ p: [0.27, 0, 0] }, () => b.box(0.18, 0.7, 0.025, { center: true }));

      // Corner studs on the frame and a jewel at the heart of the glass.
      b.part({ glow: 0.7, edge: 1 });
      [[-0.2, 0.43], [0.2, 0.43], [-0.2, -0.43], [0.2, -0.43]].forEach(([x, y]) => b.at({ p: [x, y, 0.03] }, () => b.orb(0.03, { sides: 5, rings: 3 })));
      b.at({ p: [0, 0, 0.035] }, () => b.orb(0.06, { sides: 4, rings: 2, ey: 1.6 }));
      b.part({ pivot: [-0.17, 0, 0], axis: [0, 1, 0], swing: 0.9, stage: 1, delay: 0.1 });
      b.at({ p: [-0.27, 0, 0] }, () => b.box(0.18, 0.7, 0.025, { center: true }));
    },
    hero: (b) => {
      b.fit('ring');
      b.part({ edge: 0.8 });
      b.torus(1, 0.025, { segs: 40, sides: 4 });
      b.ring(12, 0.98, (i) => {
        const tilt = (i % 2 ? 1 : -1) * 0.3;
        b.part({ pivot: [0, 0, 0], axis: [0, 1, 0], swing: (i % 2 ? 1 : -1) * 0.55, stage: 1, delay: (i % 3) * 0.04, glow: 0.12 });
        b.at({ p: [0, 0.5, 0], r: [0, tilt, 0] }, () => {
          b.box(0.5, 0.95, 0.03, { center: true });
          b.at({ p: [0, 0, -0.02] }, () => b.box(0.56, 1.0, 0.012, { center: true, taper: [0.92, 0.96] }));
        });
        b.part({ edge: 1, glow: 0.4, pivot: [0, 0, 0], axis: [0, 1, 0], swing: (i % 2 ? 1 : -1) * 0.55, stage: 1, delay: (i % 3) * 0.04 });
        b.at({ p: [0, 1.0, 0], r: [0, tilt, 0] }, () => b.pyramid(4, 0.1, 0.1, { phase: PI / 4 }));
      });
      b.part({ glow: 0.8, pivot: [0, 0.7, 0], axis: [0, 1, 0], swing: 1.5, stage: 1 });
      b.at({ p: [0, 0.7, 0] }, () => b.orb(0.18, { sides: 6, rings: 3, ey: 1.6 }));
    }
  },

  feintcage: {
    title: 'Alternating false buttresses: half of the cage is a lie.\nThe hero is the feint: eight real pillars round the ring alternating\nwith eight false ones that lean the other way and thin to a thread, a\ncollar tying only the real ones, and a hanging false door in the middle.',
    pieceNote: 'One real bar and one false bar leaning the other way',
    heroNote: 'Eight real pillars, eight false pillars, a collar and a hanging false door',
    piece: (b) => {
      b.part({ pivot: [-0.15, -0.5, 0], axis: [0, 0, 1], swing: -0.2, stage: 1 });
      b.at({ p: [-0.15, -0.5, 0] }, () => b.box(0.1, 0.9, 0.1, { taper: [0.8, 0.8] }));
      b.part({ glow: 0.4, edge: 0.6, pivot: [0.15, -0.5, 0], axis: [0, 0, 1], swing: 0.5, stage: 1 });
      b.at({ p: [0.15, -0.5, 0] }, () => b.tube((t) => [t * -0.12, t * 0.9, 0], { r: (t) => 0.03 * (1 - t) + 0.006, sides: 4, segs: 5 }));
    },
    hero: (b) => {
      b.fit('ring');
      b.part({ edge: 0.8 });
      b.torus(1, 0.03, { segs: 40, sides: 4 });
      // Real pillars: solid, leaning inward.
      b.ring(8, 1.0, (i) => {
        b.part({ pivot: [0, 0, 0], axis: [1, 0, 0], swing: -0.35, stage: 1, delay: (i % 2) * 0.08 });
        b.box(0.12, 1.2, 0.12, { taper: [0.75, 0.75] });
      });
      // False pillars: threads that lean the other way and thin to nothing.
      b.ring(8, 1.0, (i) => {
        b.part({ edge: 0.5, glow: 0.35, pivot: [0, 0, 0], axis: [1, 0, 0], swing: 0.6, stage: 1, delay: 0.1 + (i % 2) * 0.08 });
        b.tube((t) => [0, t * 1.2, -0.06 * t], { r: (t) => 0.05 * (1 - t) + 0.006, sides: 4, segs: 8 });
      }, { phase: PI / 8 });
      b.part({ edge: 0.7 });
      b.at({ p: [0, 1.2, 0] }, () => b.torus(0.86, 0.018, { segs: 36, sides: 4 }));
      // The false door: a framed rectangle hung in the middle.
      b.part({ glow: 0.5, pivot: [0, 1.1, 0], axis: [0, 1, 0], swing: 1.4, stage: 1 });
      b.at({ p: [0, 0.65, 0] }, () => {
        b.at({ p: [-0.22, 0, 0] }, () => b.box(0.05, 0.9, 0.05, { center: true }));
        b.at({ p: [0.22, 0, 0] }, () => b.box(0.05, 0.9, 0.05, { center: true }));
        b.at({ p: [0, 0.45, 0] }, () => b.box(0.5, 0.05, 0.05, { center: true }));
        b.at({ p: [0, -0.45, 0] }, () => b.box(0.5, 0.05, 0.05, { center: true }));
      });
    }
  },

  glamour: {
    title: 'A double-folded silk sheet: pretty, and it does not tell you where the edge is.\nThe hero is the silk: four long cloths fanning from a cuff at the hand,\neach folded double and undulating out of step with the others, spread\nwide as the glamour lands.',
    pieceNote: 'A folded silk strip with a trailing tassel',
    heroNote: 'A hand cuff, four double-folded silk cloths and four tassels',
    piece: (b) => {
      b.part({ crease: 55, edge: 0.15, pivot: [0, -0.4, 0], axis: [0, 0, 1], swing: 0.5, stage: 1 });
      b.ribbon((t) => [0.1 * Math.sin(t * TAU), t * 0.9 - 0.45, 0.1 * Math.sin(t * TAU * 2)], { w: 0.2, segs: 16, twist: 1.2, up: [0, 0, 1] });
      b.part({ glow: 0.5, pivot: [0, -0.4, 0], axis: [0, 0, 1], swing: 0.5, stage: 1 });
      b.at({ p: [0, 0.48, 0] }, () => b.pyramid(4, 0.03, 0.12, {}));

      // A second, shorter fold and a tassel cord.
      b.part({ crease: 55, edge: 0.15, pivot: [0, -0.4, 0], axis: [0, 0, 1], swing: -0.5, stage: 1, delay: 0.1 });
      b.ribbon((t) => [-0.08 + 0.1 * Math.sin(t * TAU + 1), t * 0.7 - 0.4, 0.05 + 0.08 * Math.sin(t * TAU * 2 + 1)], { w: 0.12, segs: 12, twist: -1.0, up: [0, 0, 1] });
      b.part({ glow: 0.6 });
      b.at({ p: [0, -0.45, 0] }, () => b.pyramid(4, 0.03, -0.12, {}));
    },
    hero: (b) => {
      b.fit('mass');
      b.part({ glow: 0.5, edge: 0.8 });
      b.aimZ(() => b.lathe([[0.12, -0.12], [0.1, 0], [0.07, 0.2]], 10, { cap: false }));
      for (let i = 0; i < 4; i++) {
        const spread = (i - 1.5) * 0.35;
        b.part({ crease: 55, edge: 0.15, pivot: [0, 0.4, 0], axis: [0, 1, 0], swing: spread * 0.9, stage: 1, delay: i * 0.05, glow: i % 2 ? 0.2 : 0 });
        // Folded double: the cloth runs out and back, so each strip is two ribbons joined at the fold.
        const path = (t) => [Math.sin(t * 9 + i * 1.3) * 0.12 + spread * t * 0.9, 0.4 + Math.sin(t * 4 + i) * 0.1 - t * 0.12, t * 1.7];
        b.ribbon(path, { w: (t) => 0.3 * (0.5 + 0.5 * Math.sin(t * PI * 0.9)) + 0.04, segs: 36, twist: (t) => Math.sin(t * 5 + i) * 0.8, up: [0, 1, 0] });
        b.ribbon((t) => { const p = path(t * 0.7); return [p[0], p[1] - 0.05, p[2] * 0.97]; }, { w: (t) => 0.2 * (0.5 + 0.5 * Math.sin(t * PI)) + 0.02, segs: 24, twist: (t) => Math.sin(t * 5 + i + 1) * 0.8, up: [0, 1, 0] });
        const end = path(1);
        b.at({ p: end }, () => b.pyramid(4, 0.04, 0.14, {}));
      }
    }
  },

  afterimage: {
    title: 'An offset echo blade: the swing, and where the swing just was.\nThe hero is the swing: a bright main blade hinged at the hand with\nthree thinner echoes trailing at widening angles, each echo a shade\nbehind the one before it, closing up on the blade as the cut lands.',
    pieceNote: 'A blade with two thinner echoes behind it',
    heroNote: 'A main blade, three trailing echoes, a hilt and a hand-hinge ring',
    piece: (b) => {
      b.part({ glow: 0.5 });
      b.blade({ len: 1, w: 0.1, thick: 0.02, segs: 8, bend: 0.1 });
      [1, 2].forEach((k) => {
        b.part({ edge: 0.5, pivot: [0, -0.1, 0], axis: [0, 0, 1], swing: 0.22 * k, stage: 1, delay: k * 0.08 });
        b.at({ p: [-0.07 * k, -0.04 * k, -0.02 * k], r: [0, 0, 0.12 * k] }, () => b.blade({ len: 0.9 - k * 0.08, w: 0.07, thick: 0.012, segs: 6, bend: 0.1 }));
      });
    },
    hero: (b) => {
      b.fit('mass');
      // The main blade, in the cast plane.
      b.part({ glow: 0.4 });
      b.aimZ(() => b.blade({ len: 1.5, w: 0.14, thick: 0.03, segs: 12, bend: -0.12 }));
      // Echoes trailing at widening angles, each thinner and dimmer.
      [1, 2, 3].forEach((k) => {
        b.part({ edge: 0.5, glow: 0.2 / k, pivot: [0, 0, 0], axis: [0, 1, 0], swing: 0.2 * k, stage: 1, delay: k * 0.07 });
        b.at({ r: [0, -0.22 * k, 0] }, () => b.aimZ(() => b.blade({ len: 1.5 - k * 0.12, w: 0.12 - k * 0.025, thick: 0.015, segs: 10, bend: -0.12 })));
      });
      b.part({ edge: 0.9 });
      b.aimZ(() => b.lathe([[0.06, -0.05], [0.045, -0.15], [0.07, -0.25], [0.001, -0.31]], 8, {}));
      b.at({ p: [0, 0, 0] }, () => b.torus(0.1, 0.018, { segs: 14, sides: 4 }));
    }
  }
};
