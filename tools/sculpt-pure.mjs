// Source of truth for the 80 pure-element castables.
// Writes each config, ability and materials file. Does not touch uids or the
// element map (gen-pure.mjs did that once). Run: node tools/sculpt-pure.mjs
import { writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { SPELLS } from './pure-spells.mjs';
import { sculptVertex, geometryModuleSource, SCULPTS } from './pure-geometry.mjs';
import { PROFILE, MARK, configSource } from './pure-settings.mjs';
import { RIGS, rigModuleSource, missingRigs } from './pure-rigs.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const abilityDir = path.join(root, 'packs/sandbox/src/abilities/codex');
const assetDir = path.join(root, 'packs/sandbox/src/assets/codex');
const configDir = path.join(root, 'packs/sandbox/src/config/codex');
const materialDir = path.join(root, 'packs/sandbox/src/materials/codex');

const ARCH = {
  spire: { hit: ['out', 'in', 'tangent'], carry: ['none', 'in', 'orbit'] },
  lance: { hit: ['slice', 'slice', 'slice'], carry: ['none', 'none', 'none'] },
  well: { hit: ['up', 'in', 'out'], carry: ['up', 'in', 'out'] },
  whip: { hit: ['side', 'side', 'side'], carry: ['none', 'none', 'none'] },
  cage: { hit: ['in', 'out', 'tangent'], carry: ['in', 'out', 'orbit'] },
  volley: { hit: ['bolt', 'bolt', 'bolt'], carry: ['none', 'none', 'none'] },
  pendulum: { hit: ['swing', 'swing', 'swing'], carry: ['none', 'none', 'none'] },
  halo: { hit: ['ring', 'ring', 'ring'], carry: ['in', 'out', 'orbit'] }
};

/**
 * One row per new castable. `twist` selects the vertex placement and the
 * phase timing. Anything else is a behavior the note promises.
 */
const SCORE = {
  scarp: { twist: 'topple', note: 'The face may not lean until every column has finished standing. The throw is the fall, not the rise.' },
  sinter: { twist: 'stamp', note: 'The plate walks the rim for the whole travel and only stamps when the ring has closed on itself.' },
  loess: { twist: 'shear', note: 'The curtain is a sideways sheet. The burial is the lateral shear; the line itself is only the hinge.' },
  keystone: { twist: 'crush', note: 'Stones drop as separate bars. The crush is inward — the lock is the centre, not an explosion.' },
  prismfault: { twist: 'drill', note: 'Three wakes ride the bore. The cut is a slice along the line, and the glass stays in the wound.' },
  geodecage: { twist: 'seal', note: 'The shell seals before the points fire. Nothing inside is hit until the cage is closed.' },
  shardchoir: { twist: 'converge', note: 'Shards stay on the rim and light in order, then the whole choir steps inward on one beat.' },
  lensewell: { twist: 'inhale', note: 'The floor lens drinks first. The column is the exhale, and bodies ride that exhale upward.' },
  facetvolley: { twist: 'plant', note: 'Each facet plants where it lands and does not hit early. A miss is a crater, not a scratch along the line.' },
  needleglass: { twist: 'hinge', note: 'The needle is hinged at the hand and shatters at the far stop, not on the way through.' },
  katabatic: { twist: 'shear', note: 'The sheet slides as if the line were a slope. The shear is stronger at the far end than at the hand.' },
  rotor: { twist: 'braid', note: 'Each rotor throws tangent. The stack does not pull inward — it sheds what it is already holding.' },
  venturi: { twist: 'crush', note: 'The bars squeeze first. The cough is a second beat that throws outward after the squeeze.', echo: 'out', hitWhen: 'echo' },
  crosscut: { twist: 'hinge', note: 'The gust is a hinge at the hand. It cuts across, not along, and the far side takes the load.' },
  subtone: { twist: 'drill', note: 'The bore is a held tone: thickness pulses with the spin, and the slice stays on the line.' },
  clangor: { twist: 'seal', note: 'Bars drop and ring. The hit waits until they have all arrived, then steps inward.' },
  overtone: { twist: 'converge', note: 'The halo walks, and the fundamental is the collapse — the rim shrinks instead of flaring.' },
  whisperwell: { twist: 'inhale', note: 'Inhale is quiet and radial. The shout is vertical, and only after the floor has emptied.' },
  cadence: { twist: 'plant', note: 'Bolts are beats. They detonate on their own landing, later ones harder than early ones.' },
  glissando: { twist: 'late', note: 'The sheet lags the cast point. The cut arrives after the hand has already moved on.' },
  caustic: { twist: 'drill', note: 'Brightness leads the tip. The scar on the ground is wider than the blade that boiled it.' },
  aureole: { twist: 'stamp', note: 'The ring tightens. The flare is the moment the radius meets, not the moment it appears.' },
  photonwell: { twist: 'inhale', note: 'Photons fall in, then the point gives them back as a column. The return is brighter than the drain.' },
  filament: { twist: 'plant', note: 'Each landing leaves a short bright barb. The next bolt starts where the last one ended.' },
  noonblade: { twist: 'return', note: 'The outward swing is only the light. The edge, and the kill, are on the way back.' },
  latticeflare: { twist: 'topple', note: 'Flares stand in a lattice and bloom outward together. The hit is the bloom, not the rise.' },
  censers: { twist: 'drink', note: 'The censers rise, swing inward once, and the slam follows the smoke into the centre.' },
  reliclash: { twist: 'shear', note: 'The chain brands what it crosses. The brand is the ground under the sheet, not a second projectile.' },
  vowcage: { twist: 'seal', note: 'The bars hold. They do not hit while they are still falling; the break outward is the vow ending.' },
  hymnwell: { twist: 'inhale', note: 'The inhale takes the circle by radius. The lift belongs to whatever is still inside when the column starts.' },
  redshift: { twist: 'drill', note: 'The lance stretches, and the colour walks from the core toward the tip. The far end is the hit.' },
  magnetar: { twist: 'pair', note: 'Seeds travel in pairs. A pair bursts together, offset to either side of the line.' },
  zodiac: { twist: 'stamp', note: 'The ring locks overhead first, then drops onto the rim. The drop is the commit.' },
  quarkspire: { twist: 'braid', note: 'Neighbouring columns spin opposite ways. The throw is tangent to that braid.' },
  slingwell: { twist: 'inhale', note: 'Mass falls into the well, then is slung along the floor. The sling is horizontal.' },
  tidebar: { twist: 'crush', note: 'Bars tilt inward and pin. The pin drives bodies toward the floor, not up off it.' },
  perigee: { twist: 'stamp', note: 'The ring dips until it scrapes, then tightens. The scrape is the hit.' },
  masslance: { twist: 'flatten', note: 'The lance is dense: height collapses as it advances, and it drags forward rather than slicing clean.' },
  shearorbit: { twist: 'plant', note: 'Masses shear off the line and crater. Each crater is its own hit, not one shared blast.' },
  plumbswing: { twist: 'hinge', note: 'The weight is at the tip. It craters at the far stop and barely cuts on the way.' },
  penumbra: { twist: 'shear', note: 'The sheet leaves a dark wake wider than the cut. The wake is the ground; the cut is the slice.' },
  duskspire: { twist: 'drink', note: 'Columns drink inward as they rise. The pull gets stronger as they grow, not when they finish.' },
  mournhalo: { twist: 'converge', note: 'The ring tightens and snuffs. Bodies are drawn to the rim, not blasted off it.' },
  nullwell: { twist: 'inhale', note: 'The well does not give the circle back. What it caught stays, and the column is only the absence.', dissolveTravel: true },
  eventcage: { twist: 'seal', note: 'Bars erase toward a missing centre. The centre itself is never a body — the hit is the closing.', dissolveTravel: true },
  absence: { twist: 'erase', note: 'The lance unmakes as it passes. The tail is already gone while the tip is still cutting.', dissolveTravel: true },
  hollowvolley: { twist: 'plant', note: 'Seeds arc and implode on landing. The implode pulls toward the crater instead of scattering.' },
  riftpendulum: { twist: 'return', note: 'The rift hangs open at the far end for the impact, then cuts on the way back.' },
  quietus: { twist: 'snap', note: 'The ring expands first, a fake of safety, then snaps the rim inward and off the floor.', hit: 'in' },
  unspire: { twist: 'braid', note: 'The columns throw tangent, and the spin accelerates on the fade instead of settling.' },
  bindrune: { twist: 'seal', note: 'Runes hold as bars, then brand outward. The brand is the second beat, not the closing.', echo: 'out', hitWhen: 'echo' },
  leywhip: { twist: 'shear', note: 'The ley line cracks off to the side of the cast. The sheet is the crack, not a beam down the line.' },
  manawell: { twist: 'inhale', note: 'The drain draws to a sigil on the floor. The column is the reflux, and it lifts.' },
  sigilvolley: { twist: 'plant', note: 'Each sigil brands where it lands. The brand is per bolt, small, not one shared circle.' },
  doppel: { twist: 'falsecut', note: 'The visible lance sits a body-width off the line. The kill is on that offset, not on the aim.', offset: true },
  falsefloor: { twist: 'drop', note: 'The floor reads as solid during the travel. The drop is the commit, straight down, with no warning lift.', hit: 'down' },
  mirrorhalo: { twist: 'braid', note: 'Three rings disagree about the rim. The hit is the ring that arrives last.', counter: true },
  feintcage: { twist: 'crush', note: 'A cage and its feint spin opposite ways. Only the inward cage cuts.', hit: 'in', counter: true },
  glamour: { twist: 'late', note: 'Travel shows the cut early. The edge itself arrives late, after the sheet has already been seen.' },
  afterimage: { twist: 'return', note: 'The outward swing is the decoy. The blade and the kill are the return.' },
  latebolt: { twist: 'reverse', note: 'Bolts resolve from the far end backward. The last one you see leave is the first that hits.' },
  chronowell: { twist: 'inhale', note: 'The rim ages first. The centre is hit late, and the lift belongs to that younger centre.' },
  tickcage: { twist: 'clock', note: 'Bars close on a clock. They lock, and hit, only when the hand meets itself.' },
  vectorlance: { twist: 'drill', note: 'The lance keeps its speed all the way down the line. It does not ease off at the tip.' },
  slingvolley: { twist: 'plant', note: 'Stones leave on flat slings and are still spinning when they arrive. The spin is the torque of the hit.' },
  shearstep: { twist: 'shear', note: 'The line steps sideways. What was standing on it is thrown to the side, not forward.' },
  orbitpendulum: { twist: 'return', note: 'The mass orbits out to the far end and is released there, on the way back through the cast.' },
  kinethalo: { twist: 'tangent', note: 'The ring stores speed along itself, then dumps it tangent. Nothing is thrown radially.' },
  presscage: { twist: 'crush', note: 'The squeeze comes first. The spit upward is the second beat, after the bars have met.', echo: 'up', hitWhen: 'echo' },
  surgewell: { twist: 'inhale', note: 'The circle is poured into a point. The surge leaves along the floor when the point cannot hold it.' },
  servopylon: { twist: 'topple', note: 'Pylons stamp up and hammer outward on the beat. The rise is the windup; the hammer is the hit.' },
  raster: { twist: 'scan', note: 'The lance burns one row at a time. A row does not hit until the scan reaches it.' },
  gimbal: { twist: 'shear', note: 'The cutter yaws across the cast and keeps its edge. It does not straighten to follow the aim.' },
  hardpoint: { twist: 'stamp', note: 'Hardpoints lock the ring first. They fire outward together, not as each one arrives.' },
  impulse: { twist: 'inhale', note: 'Impulse collects at the centre during travel. The dump is horizontal, along the floor, on the beat.' },
  tensor: { twist: 'seal', note: 'The bars close and then hold. Leaving the circle is harder than entering it.' },
  vectorhalo: { twist: 'tangent', note: 'Vectors sit on the rim and release tangent when the ring locks. There is no radial throw.' },
  shearforce: { twist: 'shear', note: 'Forward speed is only the travel. The kill is a pure lateral shear.' },
  moment: { twist: 'hinge', note: 'The arm swings, and the load is delivered at the stop. Mid-swing is the tell, not the hit.' },
  presslance: { twist: 'flatten', note: 'The press flattens as it advances. Height falls, and whatever it reaches is driven along the floor.' }
};

const FIELD = {
  earth: (f1, f2, spd) => `abs(fract(vWorld.y * ${f1} - uTime * ${spd}) - 0.5)`,
  crystal: (f1, f2) => `abs(sin(vWorld.x * ${f1} + uSeed) * sin(vWorld.z * ${f2}))`,
  wind: (f1, f2, spd) => `abs(sin(vWorld.x * ${f1} + vWorld.z * ${f2} - uTime * ${spd}))`,
  sound: (f1, spd) => `abs(fract(length(vUv - 0.5) * ${f1} - uTime * ${spd}) - 0.5)`,
  light: (f1, f2, spd) => `pow(abs(sin(vLocal * ${f1} + uTime * ${spd})) * abs(sin(vWorld.y * ${f2})), 0.65)`,
  holy: (f1, spd) => `pow(abs(sin(vWorld.y * ${f1} + uTime * ${spd})), 1.40)`,
  cosmic: (f1, spd) => `abs(fract(vAlong * ${f1} + uTime * ${spd}) - 0.5)`,
  gravity: (f1) => `smoothstep(0.0, 1.0, length(vUv - 0.5) * ${f1})`,
  shadow: (f1, f2, spd) => `1.0 - snoise01(vWorld * ${f1} + vec3(0.0, uTime * ${spd}, uSeed * ${f2}))`,
  void: (f1, spd) => `smoothstep(0.15, 0.85, length(vUv - 0.5) + 0.25 * sin(uTime * ${spd} + vLocal * ${f1}))`,
  arcane: (f1, f2) => `abs(sin(atan(vUv.y - 0.5, vUv.x - 0.5) * ${f1} + vLocal * ${f2}))`,
  illusion: (f1, f2, spd) => `abs(sin(vWorld.x * ${f1} + uTime * ${spd}) - sin(vWorld.z * ${f2} - uTime * ${spd}))`,
  time: (f1, spd) => `abs(fract((vLocal + uTime * ${spd}) * ${f1}) - 0.5)`,
  motion: (f1, spd) => `abs(fract(vAlong * 4.0 - vLocal * ${f1} + uTime * ${spd}) - 0.5)`,
  tech: (f1, spd) => `step(0.55, abs(fract(vWorld.y * ${f1} + uTime * ${spd}) - 0.5) * 2.0)`,
  force: (f1, f2) => `abs(fract(vWorld.x * ${f1} + vWorld.z * ${f2}) - 0.5)`
};

const COLOR = {
  earth: `vec3 col = mix(uColorC, uColorB, carved);
    col += uColorA * pow(1.0 - clamp(carved, 0.0, 1.0), 2.0) * uEdge * 0.35;`,
  crystal: `vec3 col = mix(uColorC, uColorA, pow(clamp(carved, 0.0, 1.0), 0.55));
    col += uColorB * step(0.72, carved) * uEdge;`,
  wind: `vec3 col = mix(uColorC, uColorA, carved);
    col += uColorB * (1.0 - carved) * uGlow;`,
  sound: `vec3 col = mix(uColorC, uColorB, carved);
    col += uColorA * pow(clamp(carved, 0.0, 1.0), 3.0) * uEdge;`,
  light: `vec3 col = mix(uColorC, uColorB, carved) + uColorA * uEdge * carved;`,
  holy: `vec3 col = mix(uColorC, uColorA, carved);
    col += vec3(1.0) * pow(clamp(carved, 0.0, 1.0), 4.0) * uEdge * 0.45;`,
  cosmic: `vec3 col = mix(uColorC, uColorA, vAlong);
    col = mix(col, uColorB, carved);`,
  gravity: `vec3 col = mix(uColorB, uColorC, carved);
    col *= 0.55 + 0.45 * (1.0 - carved);`,
  shadow: `vec3 col = mix(uColorC * 0.35, uColorA, carved);
    col += uColorB * (1.0 - carved) * 0.15;`,
  void: `vec3 col = mix(uColorC, uColorA, carved) * (0.20 + 0.80 * carved);
    col += uColorB * (1.0 - carved) * 0.25;`,
  arcane: `vec3 col = mix(uColorC, uColorA, carved);
    col += uColorB * step(0.62, carved) * uEdge * 0.8;`,
  illusion: `vec3 col = mix(uColorA, uColorB, abs(sin(vLocal * 9.0 + uTime)));
    col = mix(col, uColorC, 1.0 - carved);`,
  time: `vec3 col = mix(uColorC, uColorA, carved);
    col += uColorB * abs(sin(uTime * 3.0 + vLocal * 12.0)) * uGlow * 0.35;`,
  motion: `vec3 col = mix(uColorC, uColorA, vAlong);
    col += uColorB * carved * uEdge * 0.5;`,
  tech: `vec3 col = mix(uColorC, uColorA, step(0.5, carved));
    col += uColorB * carved * uGlow;`,
  force: `vec3 col = mix(uColorC, uColorB, carved);
    col += uColorA * (1.0 - carved) * uEdge * 0.4;`
};

/** How the hero rig is stood for each archetype (see RigHero.js). */
const HERO_STAND = {
  spire: 'thrust up through the floor, then left to lean and topple',
  halo: 'held flat on the ground, turning, pulsing on the beat',
  well: 'sunk low while it inhales, then stretched up the exhale',
  cage: 'dropped from above, then closed inward',
  lance: 'riding the head of the line, rolling about its own axis',
  whip: 'riding the head, swept sideways as it travels',
  volley: 'riding a ballistic arc, pitched along it',
  pendulum: 'hinged at the hand, swung across the cast'
};

const DETAIL_PATTERN = {
  earth: 'abs(sin(vWorld.y * 9.0 + vSeed * 20.0)) * 0.6 + snoise01(vWorld * 3.0) * 0.4',
  crystal: 'pow(abs(sin(vSpan * 14.0 + vSeed * 12.0)), 3.0)',
  wind: 'abs(sin(vSpan * 10.0 - uTime * 5.0 + vSeed * 9.0))',
  sound: 'abs(sin(vWorld.y * 18.0 - uTime * 6.0))',
  light: 'pow(vSpan, 1.5) + 0.3 * sin(uTime * 8.0 + vSeed * 20.0)',
  holy: 'pow(1.0 - vSpan, 1.4) + 0.2',
  cosmic: 'snoise01(vWorld * 4.0 + vec3(0.0, uTime * 0.6, vSeed * 8.0))',
  gravity: 'smoothstep(0.2, 0.9, snoise01(vWorld * 2.4 + vSeed * 6.0))',
  shadow: '1.0 - snoise01(vWorld * 3.2 + vec3(vSeed * 5.0, uTime * 0.4, 0.0))',
  void: 'smoothstep(0.1, 0.9, 1.0 - rim)',
  arcane: 'step(0.6, abs(sin(vWorld.x * 12.0 + vWorld.z * 12.0 + uTime * 2.0)))',
  illusion: 'abs(sin(vWorld.x * 7.0 + uTime * 3.0) - sin(vWorld.z * 7.0 - uTime * 3.0))',
  time: 'step(0.5, fract(vSpan * 6.0 + uTime * 0.7))',
  motion: 'abs(fract(vSpan * 5.0 - uTime * 3.0) - 0.5) * 2.0',
  tech: 'step(0.6, fract(vWorld.y * 6.0 + vSeed * 4.0)) * 0.7 + step(0.9, fract(vWorld.x * 5.0 + vWorld.z * 5.0)) * 0.3',
  force: 'abs(fract(vWorld.x * 4.0 + vWorld.z * 4.0 + vSeed * 3.0) - 0.5) * 2.0'
};

const WHEN = {
  topple: 'commit', drink: 'commit', stamp: 'commit', crush: 'commit', seal: 'commit',
  converge: 'commit', snap: 'commit', inhale: 'commit', drop: 'commit', braid: 'commit',
  clock: 'commit', tangent: 'commit',
  shear: 'travel', drill: 'travel', flatten: 'travel', falsecut: 'travel', erase: 'travel',
  late: 'late',
  plant: 'part', pair: 'part', reverse: 'part', scan: 'part',
  hinge: 'travel', return: 'return'
};

const VOICE = {
  topple: 'crown', drink: 'crown', braid: 'crown', stamp: 'crown', clock: 'crown',
  drill: 'bore', flatten: 'bore', falsecut: 'bore', erase: 'bore', scan: 'bore',
  shear: 'bore', late: 'bore', hinge: 'bore', return: 'bore',
  plant: 'bore', pair: 'bore', reverse: 'bore',
  inhale: 'drain', drop: 'drain',
  crush: 'chord', seal: 'chord', converge: 'chord', snap: 'chord', tangent: 'chord'
};

function hashId(id) {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) h = Math.imul(h ^ id.charCodeAt(i), 16777619);
  return h >>> 0;
}

function num(n) {
  return Number(n).toFixed(2);
}

function elementIndex(spell) {
  let i = 0;
  for (const other of SPELLS) {
    if (other.id === spell.id) return i;
    if (other.element === spell.element) i++;
  }
  return 0;
}

function freqs(spell) {
  const h = hashId(spell.id);
  return {
    f1: num(3 + (h % 9) + elementIndex(spell)),
    f2: num(1.15 + (h % 11) * 0.31),
    spd: num(0.35 + (h % 8) * 0.22)
  };
}

function motif(spell) {
  const { f1, f2, spd } = freqs(spell);
  const v = elementIndex(spell);
  const field = FIELD[spell.element](f1, f2, spd);
  const salt = num(0.7 + (hashId(spell.id) % 5) * 0.11);
  const shapes = [
    `float field = ${field};
    float carved = smoothstep(0.48, 0.04, field);`,
    `float field = ${field};
    float carved = pow(clamp(field, 0.0, 1.0), 1.70);`,
    `float field = ${field};
    float ridge = abs(snoise(vWorld * ${f2} + vec3(uSeed, uTime * ${spd}, 0.0)));
    float carved = max(field, ridge);`,
    `float field = ${field};
    float band = 0.5 + 0.5 * sin(vLocal * ${f1} + uTime * ${spd});
    float carved = band * (0.30 + 0.70 * field);`,
    `float field = ${field};
    float ang = atan(vUv.y - 0.5, vUv.x - 0.5);
    float spoke = abs(fract(ang * ${f1} * 0.15915) - 0.5);
    float carved = (1.0 - smoothstep(0.04, 0.22, spoke)) * (0.35 + 0.65 * field);`,
    `float field = ${field};
    float rad = length(vUv - 0.5);
    float ring = abs(fract(rad * ${f1} - uTime * ${spd}) - 0.5);
    float carved = smoothstep(0.42, 0.04, ring) + 0.40 * field;`,
    `float field = ${field};
    float rows = abs(fract(vWorld.z * ${f1} + vAlong * 3.0) - 0.5);
    float carved = step(${salt}, field) * (1.0 - smoothstep(0.12, 0.38, rows));`
  ];
  return shapes[v % shapes.length];
}

const VERT_HEAD = `
  uniform vec3 uCenter;
  uniform vec3 uOrigin;
  uniform vec3 uDir;
  uniform vec3 uSide;
  uniform float uRadius;
  uniform float uLength;
  uniform float uHeight;
  uniform float uThickness;
  uniform float uCount;
  uniform float uSpin;
  uniform float uOpen;
  uniform float uGrow;
  uniform float uAlong;
  uniform float uSeed;
  varying vec2 vUv;
  varying float vLocal;
  varying float vAlong;
  varying vec3 vWorld;
  varying float vViewZ;
  void main() {
    float u = position.x + 0.5;
    float v = position.y + 0.5;
    vec3 p = vec3(0.0);
    float local = u;
`;

const VERT_TAIL = `
    vUv = vec2(u, v);
    vLocal = local;
    vAlong = uAlong;
    vWorld = p;
    vec4 mv = viewMatrix * vec4(p, 1.0);
    vViewZ = mv.z;
    gl_Position = projectionMatrix * mv;
  }
`;

function columns(extra) {
  return `
    float cols = max(uCount, 1.0);
    float col = min(floor(u * cols), cols - 1.0);
    float fu = fract(u * cols);
    float ang = (col + 0.5) / cols * 6.2831853 + uSpin;
    float lat = (fu - 0.5) * uThickness;
    vec3 radial = vec3(cos(ang), 0.0, sin(ang));
    vec3 tangent = vec3(-sin(ang), 0.0, cos(ang));
    local = fu;
    ${extra}
  `;
}

const VERTEX = {
  topple: columns(`
    p = uCenter + radial * uRadius + tangent * lat;
    p.y = v * uHeight * uGrow;
    p += radial * (v * uOpen * uHeight * 0.55);
  `),
  drink: columns(`
    p = uCenter + radial * (uRadius * (1.0 - 0.42 * uOpen)) + tangent * lat;
    p.y = v * uHeight * uGrow;
    p -= radial * (v * uOpen * uHeight * 0.38);
  `),
  braid: columns(`
    float flip = mod(col, 2.0) * 2.0 - 1.0;
    p = uCenter + radial * (uRadius + sin(v * 6.0 + uSpin * flip) * uThickness) + tangent * lat;
    p.y = v * uHeight * uGrow;
    p += tangent * sin(v * 9.0 + uSpin * flip) * uOpen * 0.50;
  `),
  crush: columns(`
    float rad = uRadius * (1.0 - 0.55 * uOpen);
    p = uCenter + radial * rad + tangent * lat;
    p.y = mix(uHeight, uHeight * 0.22, uOpen) * v * uGrow;
  `),
  seal: columns(`
    vec3 wall = uCenter + radial * uRadius + tangent * lat;
    wall.y = v * uHeight * uGrow;
    float cap = smoothstep(0.78, 1.0, v);
    vec3 lid = uCenter + radial * uRadius * (1.0 - 0.85 * uOpen);
    lid.y = uHeight * uGrow;
    p = mix(wall, lid, cap);
  `),
  clock: columns(`
    float hand = mod(uSpin, 6.2831853);
    float gap = abs(ang - hand);
    if (gap > 3.1415926) gap = 6.2831853 - gap;
    float on = 1.0 - smoothstep(0.35, 1.15, gap);
    p = uCenter + radial * uRadius + tangent * lat;
    p.y = v * uHeight * uGrow * (0.12 + 0.88 * on);
  `),
  stamp: `
    float ang = u * 6.2831853 + uSpin;
    vec3 radial = vec3(cos(ang), 0.0, sin(ang));
    float rad = uRadius * (1.0 + 0.20 * (1.0 - uGrow));
    p = uCenter + radial * rad;
    p.y = (uHeight * (1.0 - uOpen) + (v - 0.5) * uThickness) * max(uGrow, 0.04);
    local = fract(ang * 0.1591549);
  `,
  converge: `
    float ang = u * 6.2831853 + uSpin;
    vec3 radial = vec3(cos(ang), 0.0, sin(ang));
    float rad = uRadius * (1.18 - 0.82 * uOpen);
    p = uCenter + radial * rad;
    p.y = uHeight * 0.18 * uGrow + (v - 0.5) * uThickness;
    local = fract(ang * 0.1591549);
  `,
  snap: `
    float ang = u * 6.2831853 + uSpin;
    vec3 radial = vec3(cos(ang), 0.0, sin(ang));
    float rad = uRadius * (1.40 - 1.05 * uOpen);
    p = uCenter + radial * rad;
    p.y = (0.25 + 0.75 * (1.0 - uOpen)) * (v * uHeight * 0.35) * max(uGrow, 0.04);
    local = fract(ang * 0.1591549);
  `,
  tangent: `
    float ang = u * 6.2831853 + uSpin;
    vec3 radial = vec3(cos(ang), 0.0, sin(ang));
    vec3 tangent = vec3(-sin(ang), 0.0, cos(ang));
    p = uCenter + radial * uRadius + tangent * (uOpen * uThickness * 3.0);
    p.y = uHeight * 0.22 * uGrow + (v - 0.5) * uThickness;
    local = fract(ang * 0.1591549);
  `,
  shear: `
    float s = clamp(uAlong, 0.0, 1.0);
    float bow = sin(s * 3.1415926);
    p = uOrigin + uDir * (s * uLength) + uSide * ((u - 0.5) * uThickness * 2.0 + bow * uRadius * max(uOpen, 0.20));
    p.y = v * uHeight * (0.28 + 0.72 * uGrow);
    local = s;
  `,
  late: `
    float s = clamp(uAlong, 0.0, 1.0);
    s = s * s;
    float bow = sin(s * 3.1415926);
    p = uOrigin + uDir * (s * uLength) + uSide * ((u - 0.5) * uThickness * 2.2 + bow * uRadius);
    p.y = v * uHeight * (0.22 + 0.78 * uGrow);
    local = s;
  `,
  drill: `
    float s = clamp(uAlong, 0.0, 1.0);
    float ang = uSpin * 2.0 + s * 9.0;
    vec3 side = uSide * cos(ang);
    side.y += sin(ang);
    p = uOrigin + uDir * (s * uLength) + side * ((u - 0.5) * uThickness * 2.0);
    p.y += (v - 0.5) * uHeight * 0.40 * uGrow;
    local = s;
  `,
  flatten: `
    float s = clamp(uAlong, 0.0, 1.0);
    p = uOrigin + uDir * (s * uLength) + uSide * ((u - 0.5) * uThickness * 3.2);
    p.y = (v - 0.30) * uHeight * uGrow * (1.0 - 0.84 * s);
    local = s;
  `,
  falsecut: `
    float s = clamp(uAlong, 0.0, 1.0);
    p = uOrigin + uDir * (s * uLength) + uSide * (uThickness * 3.4 + (u - 0.5) * uThickness);
    p.y = v * uHeight * 0.42 * uGrow;
    local = s;
  `,
  erase: `
    float s = clamp(uAlong, 0.0, 1.0);
    float tail = smoothstep(0.0, 0.30, s);
    p = uOrigin + uDir * (s * uLength) + uSide * ((u - 0.5) * uThickness * 1.6 * tail);
    p.y = (v - 0.5) * uHeight * 0.32 * tail * uGrow;
    local = s;
  `,
  scan: `
    float rows = max(uCount, 1.0);
    float row = min(floor(clamp(uAlong, 0.0, 0.999) * rows), rows - 1.0);
    float fu = fract(u * rows);
    float s = (row + 0.5) / rows;
    p = uOrigin + uDir * (s * uLength) + uSide * ((v - 0.5) * uRadius * 1.4);
    p.y = 0.12 + uGrow * 0.22 + fu * 0.05;
    local = fu;
  `,
  inhale: `
    float ang = u * 6.2831853 + uSpin;
    float rad = uRadius * (1.0 - uOpen * v);
    p = uCenter + vec3(cos(ang), 0.0, sin(ang)) * rad;
    p.y = v * uHeight * max(uOpen, 0.03) * uGrow;
    local = fract(ang * 0.1591549);
  `,
  drop: `
    float ang = u * 6.2831853 + uSpin;
    float rad = uRadius * (0.25 + 0.75 * (1.0 - uOpen));
    p = uCenter + vec3(cos(ang), 0.0, sin(ang)) * rad;
    p.y = (1.0 - uOpen) * v * uHeight * 0.25 * uGrow;
    local = fract(ang * 0.1591549);
  `,
  plant: `
    float n = max(uCount, 1.0);
    float i = min(floor(u * n), n - 1.0);
    float fu = fract(u * n);
    float lane = ((i + 0.5) / n - 0.5) * 2.0 * uRadius;
    float head = clamp(uAlong * n - i, 0.0, 1.0);
    float arc = sin(head * 3.1415926) * uHeight;
    p = uOrigin + uDir * (head * uLength) + uSide * (lane + (fu - 0.5) * uThickness * 2.0);
    p.y = arc * uGrow + v * 0.12;
    local = head;
  `,
  pair: `
    float n = max(floor(uCount * 0.5) * 2.0, 2.0);
    float i = min(floor(u * n), n - 1.0);
    float pair = floor(i * 0.5);
    float sideSign = mod(i, 2.0) * 2.0 - 1.0;
    float pairs = max(n * 0.5, 1.0);
    float head = clamp(uAlong * pairs - pair, 0.0, 1.0);
    float lane = sideSign * (0.40 + pair * 0.18) * uRadius;
    float arc = sin(head * 3.1415926) * uHeight;
    p = uOrigin + uDir * (head * uLength) + uSide * lane;
    p.y = arc * uGrow + (v - 0.5) * uThickness;
    local = head;
  `,
  reverse: `
    float n = max(uCount, 1.0);
    float i = min(floor(u * n), n - 1.0);
    float fu = fract(u * n);
    float lane = ((i + 0.5) / n - 0.5) * 2.0 * uRadius;
    float head = clamp(uAlong * n - (n - 1.0 - i), 0.0, 1.0);
    float arc = sin(head * 3.1415926) * uHeight * 0.85;
    p = uOrigin + uDir * (head * uLength) + uSide * (lane + (fu - 0.5) * uThickness);
    p.y = arc * uGrow;
    local = head;
  `,
  hinge: `
    float ang = mix(-uRadius, uRadius, clamp(uAlong, 0.0, 1.0));
    vec3 fwd = uDir * cos(ang) + uSide * sin(ang);
    p = uOrigin + fwd * (uLength * (0.10 + 0.90 * v));
    p.y = uHeight * (0.90 - v * 0.28) * uGrow;
    local = v;
  `,
  return: `
    float ang = mix(-uRadius, uRadius, clamp(uAlong, 0.0, 1.0));
    vec3 fwd = uDir * cos(ang) + uSide * sin(ang);
    p = uOrigin + fwd * (uLength * (0.16 + 0.84 * v));
    p.y = uHeight * (0.55 + 0.45 * (1.0 - v)) * uGrow;
    local = v;
  `
};

const VOICE_VERT = {
  crown: `
    float ang = u * 6.2831853 + uSpin;
    float rad = uRadius * (0.72 + 0.28 * uGrow);
    p = uCenter + vec3(cos(ang), 0.0, sin(ang)) * rad;
    p.y = uHeight * (0.82 + 0.18 * sin(ang * max(uCount, 1.0))) * uGrow + (v - 0.5) * uThickness;
    local = fract(ang * 0.1591549);
  `,
  bore: `
    float s = clamp(uAlong, 0.0, 1.0);
    p = uOrigin + uDir * (s * uLength) + uSide * ((u - 0.5) * uThickness * 1.5);
    p.y = 0.18 + v * uHeight * 0.22 * uGrow;
    local = s;
  `,
  drain: `
    float ang = u * 12.5663706 + uSpin;
    float rad = uRadius * (1.0 - v) * (1.0 - 0.65 * uOpen);
    p = uCenter + vec3(cos(ang), 0.0, sin(ang)) * max(rad, 0.05);
    p.y = (1.0 - v) * 0.45 * uHeight * uGrow;
    local = v;
  `,
  chord: `
    float ang = u * 6.2831853 - uSpin;
    float rad = uRadius * (0.35 + 0.85 * uOpen);
    p = uCenter + vec3(cos(ang) * rad, (v - 0.5) * uThickness, sin(ang) * rad);
    local = fract(ang * 0.1591549);
  `
};

function groundFrag(element) {
  const patterns = {
    earth: `float pat = smoothstep(0.10, 0.0, abs(fract(ang * 8.0 + grain) - 0.5) - 0.38);`,
    crystal: `float pat = step(0.72, abs(sin(ang * 6.0) * sin(rad * 14.0)));`,
    wind: `float pat = smoothstep(0.25, 0.0, abs(fract(rad * 5.0 - uTime * 0.40) - 0.5));`,
    sound: `float pat = smoothstep(0.08, 0.0, abs(fract(rad * 9.0 - uTime * 0.80) - 0.5));`,
    light: `float pat = pow(abs(sin(ang * 7.0 + uTime * 0.60)), 3.0) * (1.0 - rad);`,
    holy: `float pat = pow(max(1.0 - rad, 0.0), 1.60) * (0.45 + 0.55 * abs(sin(ang * 4.0)));`,
    cosmic: `float pat = smoothstep(0.5, 1.0, grain) * (1.0 - smoothstep(0.2, 0.9, rad));`,
    gravity: `float pat = smoothstep(0.15, 0.85, rad) * (0.35 + 0.65 * grain);`,
    shadow: `float pat = (1.0 - grain) * (1.0 - smoothstep(0.4, 1.0, rad));`,
    void: `float pat = smoothstep(0.25, 0.05, abs(rad - 0.45)) * grain;`,
    arcane: `float pat = step(0.55, abs(sin(ang * 5.0 + uSeed))) * (1.0 - smoothstep(0.85, 1.05, rad));`,
    illusion: `float pat = abs(sin(ang * 3.0 + uTime * 0.50)) * smoothstep(1.0, 0.2, rad);`,
    time: `float pat = step(0.60, abs(sin(ang - uTime * 1.20))) * (1.0 - rad);`,
    motion: `float pat = smoothstep(0.2, 0.0, abs(fract(rad * 4.0 - uTime * 0.70) - 0.5));`,
    tech: `float pat = step(0.45, abs(fract(vUv.y * 12.0) - 0.5)) * step(0.45, abs(fract(vUv.x * 12.0) - 0.5));`,
    force: `float pat = smoothstep(0.12, 0.0, abs(vUv.y - 0.5) - 0.08) + smoothstep(0.12, 0.0, abs(vUv.x - 0.5) - 0.08);`
  };
  return patterns[element];
}

function lensFrag(element) {
  const dir = {
    earth: `vec2 dir = vec2(0.0, 1.0);`,
    crystal: `vec2 raw = floor((vUv - 0.5) * 4.0) / 4.0; float len = length(raw); vec2 dir = len < 0.001 ? vec2(1.0, 0.0) : raw / len;`,
    wind: `vec2 dir = vec2(vLocal - 0.5, 0.15); dir = length(dir) < 0.001 ? vec2(1.0, 0.0) : normalize(dir);`,
    sound: `vec2 raw = vUv - 0.5; float len = length(raw); vec2 dir = len < 0.001 ? vec2(1.0, 0.0) : raw / len;`,
    light: `vec2 dir = normalize(vec2(0.20, 1.0));`,
    holy: `vec2 dir = vec2(0.0, 1.0);`,
    cosmic: `vec2 dir = vec2(vAlong - 0.5, vLocal - 0.5); dir = length(dir) < 0.001 ? vec2(1.0, 0.0) : normalize(dir);`,
    gravity: `vec2 raw = vec2(0.5) - vUv; float len = length(raw); vec2 dir = len < 0.001 ? vec2(0.0, 1.0) : raw / len;`,
    shadow: `vec2 dir = vec2(vLocal - 0.5, -0.4); dir = normalize(dir);`,
    void: `vec2 raw = vec2(0.5) - vUv; float len = length(raw); vec2 dir = len < 0.001 ? vec2(1.0, 0.0) : raw / len;`,
    arcane: `float a = vLocal * 6.2831853; vec2 dir = vec2(cos(a), sin(a));`,
    illusion: `vec2 dir = normalize(vec2(sin(uTime + vLocal * 4.0), cos(uTime * 0.7)));`,
    time: `vec2 dir = vec2(sin(vLocal * 6.2831853), 0.2); dir = normalize(dir);`,
    motion: `vec2 dir = vec2(vAlong - 0.5, 0.0); dir = length(dir) < 0.001 ? vec2(1.0, 0.0) : normalize(dir);`,
    tech: `vec2 dir = vec2(0.0, fract(vLocal * 8.0) - 0.5); dir = length(dir) < 0.001 ? vec2(0.0, 1.0) : normalize(dir);`,
    force: `vec2 dir = vec2(vUv.x - 0.5, 0.0); dir = length(dir) < 0.001 ? vec2(1.0, 0.0) : normalize(dir);`
  };
  return dir[element];
}

const SHED = {
  earth: [`_dir.set(Math.cos(ang), 0.25, Math.sin(ang));`, `_dir.set(Math.random() - 0.5, 1.15, Math.random() - 0.5);`],
  crystal: [`_dir.set(Math.cos(ang), 0.85, Math.sin(ang));`, `_dir.set(Math.cos(ang) * 0.3, 1.4, Math.sin(ang) * 0.3);`],
  wind: [`_dir.copy(this.direction).addScaledVector(this.side, Math.random() - 0.5).setY(0.15);`, `_dir.copy(this.side).multiplyScalar(Math.random() < 0.5 ? -1.4 : 1.4).setY(0.05);`],
  sound: [`_dir.set(Math.cos(ang), 0.05, Math.sin(ang));`, `_dir.set(Math.cos(ang), 0.4, Math.sin(ang));`],
  light: [`_dir.set(Math.cos(ang) * 0.2, 1.6, Math.sin(ang) * 0.2);`, `_dir.set(0, 1.8, 0);`],
  holy: [`_dir.set(Math.cos(ang) * 0.35, 0.9, Math.sin(ang) * 0.35);`, `_dir.set((Math.random() - 0.5) * 0.2, 1.2, (Math.random() - 0.5) * 0.2);`],
  cosmic: [`_dir.copy(this.direction).setY(0.35 + Math.random() * 0.4);`, `_dir.copy(this.direction).multiplyScalar(-0.4).setY(0.8);`],
  gravity: [`_dir.set(Math.cos(ang) * 0.4, -0.2, Math.sin(ang) * 0.4);`, `_dir.set(Math.random() - 0.5, -0.6, Math.random() - 0.5);`],
  shadow: [`const pull = 0.6; _dir.set(-Math.cos(ang) * pull, 0.15, -Math.sin(ang) * pull);`, `_dir.set(-Math.cos(ang), 0.25, -Math.sin(ang));`],
  void: [`_dir.set(-Math.cos(ang), 0.05, -Math.sin(ang));`, `_dir.set((Math.random() - 0.5) * 0.2, -0.15, (Math.random() - 0.5) * 0.2);`],
  arcane: [`_dir.set(Math.cos(ang + 1.2), 0.7, Math.sin(ang + 1.2));`, `_dir.set(Math.cos(-ang), 1.0, Math.sin(-ang));`],
  illusion: [`_dir.copy(this.side).multiplyScalar(1.2).setY(0.3);`, `_dir.copy(this.side).multiplyScalar(-0.8).setY(0.5);`],
  time: [`_dir.copy(this.direction).multiplyScalar(-0.5).setY(0.4);`, `_dir.set(Math.cos(ang), 0.2, Math.sin(ang));`],
  motion: [`_dir.copy(this.direction).setY(0.2);`, `_dir.copy(this.side).multiplyScalar(Math.random() < 0.5 ? -1 : 1).setY(0.15);`],
  tech: [`_dir.set(0, (i % 2 === 0 ? 0.2 : 1.1), 0).addScaledVector(this.direction, 0.8);`, `_dir.copy(this.direction).setY(0.1);`],
  force: [`_dir.copy(this.side).multiplyScalar(Math.random() < 0.5 ? -1.6 : 1.6).setY(0.05);`, `_dir.copy(this.direction).setY(0.1);`]
};

function poseLines(twist) {
  const lines = {
    topple: 'along = 1; grow = rise; open = beat;',
    drink: 'along = 1; grow = rise; open = beat;',
    braid: 'along = 1; grow = rise; open = beat;',
    stamp: 'along = 1; grow = rise; open = beat;',
    crush: 'along = 1; grow = rise; open = beat;',
    seal: 'along = 1; grow = rise; open = beat;',
    converge: 'along = 1; grow = rise; open = beat;',
    snap: 'along = 1; grow = rise; open =  beat;',
    tangent: 'along = 1; grow = rise; open = beat;',
    clock: 'along = 1; grow = rise; open = beat;',
    inhale: 'along = 1; grow = 0.25 + 0.75 * rise; open = beat;',
    drop: 'along = 1; grow = rise; open = beat;',
    shear: 'along = committed ? 1 : u; grow = 0.4 + 0.6 * rise; open = 1;',
    late: 'along = committed ? 1 : saturate((u - 0.32) / 0.68); grow = rise; open = 1;',
    drill: 'along = committed ? 1 : u; grow = 1; open = 0.2 + 0.8 * rise;',
    flatten: 'along = committed ? 1 : u; grow = 1; open = rise;',
    falsecut: 'along = committed ? 1 : u; grow = rise; open = 1;',
    erase: 'along = committed ? 1 : u; grow = 1; open = rise;',
    scan: 'along = committed ? 1 : u; grow = 1; open = 1;',
    plant: 'along = committed ? 1 : u; grow = 1; open = 1;',
    pair: 'along = committed ? 1 : u; grow = 1; open = 1;',
    reverse: 'along = committed ? 1 : u; grow = 1; open = 1;',
    hinge: 'along = committed ? 1 : u; grow = 1; open = 1;',
    return: 'along = committed ? (1 - saturate(fadeT < 1 ? fadeT : 1)) : u; grow = 1; open = committed ? saturate(fadeT) : 0;'
  };
  return lines[twist];
}

function killMethod(mode) {
  if (mode === 'in' || mode === 'out' || mode === 'tangent' || mode === 'ring') {
    return `
  _killDir(dummy) {
    this._aim(_focus);
    _dir.set(dummy.position.x - _focus.x, 0, dummy.position.z - _focus.z);
    if (_dir.lengthSq() < 1e-4) _dir.copy(this.direction);
    else _dir.normalize();
    ${mode === 'in' ? '_dir.multiplyScalar(-1);' : ''}
    ${mode === 'tangent' ? 'const x = _dir.x; _dir.set(-_dir.z, 0, x);' : ''}
  }`;
  }
  if (mode === 'side') {
    return `
  _killDir(dummy) {
    this._aim(_focus);
    const lateral = (dummy.position.x - _focus.x) * this.side.x + (dummy.position.z - _focus.z) * this.side.z;
    _dir.copy(this.side).multiplyScalar(lateral < 0 ? -1 : 1);
  }`;
  }
  if (mode === 'swing') {
    return `
  _killDir() {
    const ang = lerp(-settings[ID].sweep, settings[ID].sweep, saturate(this._state.along));
    _dir.copy(this.direction).multiplyScalar(Math.cos(ang)).addScaledVector(this.side, Math.sin(ang));
  }`;
  }
  if (mode === 'up') {
    return `
  _killDir() {
    _dir.copy(this.direction).multiplyScalar(0.25);
  }`;
  }
  if (mode === 'down') {
    return `
  _killDir() {
    _dir.copy(this.direction).multiplyScalar(0.12);
  }`;
  }
  return `
  _killDir() {
    _dir.copy(this.direction);
  }`;
}

function partMethods(twist) {
  if (twist === 'pair') {
    return `
  _head(i, n) {
    const pairs = Math.max(1, Math.ceil(n / 2));
    return saturate(this.u * pairs - Math.floor(i / 2));
  }

  _partPoint(i, n, out) {
    const c = settings[ID];
    const pair = Math.floor(i / 2);
    const sign = i % 2 === 0 ? -1 : 1;
    const s = (pair + 0.5) / Math.max(1, Math.ceil(n / 2));
    return this.pointAt(s, out).addScaledVector(this.side, sign * (0.45 + pair * 0.18) * c.sweep);
  }`;
  }
  if (twist === 'reverse') {
    return `
  _head(i, n) {
    return saturate(this.u * n - (n - 1 - i));
  }

  _partPoint(i, n, out) {
    const c = settings[ID];
    const lane = ((i + 0.5) / n - 0.5) * 2 * c.sweep;
    const s = (n - 1 - i + 0.5) / n;
    return this.pointAt(s, out).addScaledVector(this.side, lane);
  }`;
  }
  if (twist === 'scan') {
    return `
  _head(i, n) {
    return saturate(this.u * n - i);
  }

  _partPoint(i, n, out) {
    const s = (i + 0.5) / n;
    return this.pointAt(s, out);
  }`;
  }
  return `
  _head(i, n) {
    return saturate(this.u * n - i);
  }

  _partPoint(i, n, out) {
    const c = settings[ID];
    const lane = ((i + 0.5) / n - 0.5) * 2 * c.sweep;
    const s = (i + 0.5) / n;
    return this.pointAt(s, out).addScaledVector(this.side, lane);
  }`;
}

function materialsSource(spell) {
  const cls = spell.cls;
  const id = spell.id;
  const { f1, f2, spd } = freqs(spell);
  return `import { AdditiveBlending, Color, DoubleSide, NormalBlending, ShaderMaterial, Vector3 } from 'three';
import { noiseGLSL } from '../../shaders/lib/noise.glsl.js';
import { commonGLSL } from '../../shaders/lib/common.glsl.js';
import { sharedUniforms } from '../../core/FrameUniforms.js';
import { settings } from '../../config/settings.js';
import { getColor } from '../../utils/color.js';

const ID = '${id}';

/**
 * ${spell.label} — four shaders, none of them shared.
 *
 * Body placement is the ${SCORE[id].twist} read (${spell.hint}).
 * The fragment field is ${spell.element}-specific (f ${f1} / ${f2}, speed ${spd}),
 * then carved by this spell's own mask. The lens writes distortion
 * (direction in RG around 0.5, strength in B, coverage in A). The ground
 * pattern belongs to ${spell.element}, not to a shared stamp. The voice is a
 * second placement — ${VOICE[SCORE[id].twist]} — so the cast has a layer that
 * is not the body. Every uniform is filled from settings.${id} each frame.
 */

const BODY_VERTEX = /* glsl */ \`
${VERT_HEAD.replace('position.x + 0.5', 'uv.x').replace('position.y + 0.5', 'uv.y')}
${VERTEX[SCORE[id].twist]}
${sculptVertex(spell)}
${VERT_TAIL}
\`;

const BODY_FRAGMENT = /* glsl */ \`
  precision highp float;
  uniform float uTime;
  uniform float uSeed;
  uniform float uDissolve;
  uniform float uSoftFade;
  uniform float uOpacity;
  uniform float uGlow;
  uniform float uEdge;
  uniform float uPhrase;
  uniform vec3 uColorA;
  uniform vec3 uColorB;
  uniform vec3 uColorC;
  uniform vec2 uResolution;
  uniform sampler2D uSceneDepth;
  uniform float uCameraNear;
  uniform float uCameraFar;
  uniform float uGlobalGlow;
  uniform float uShaderIntensity;
  varying vec2 vUv;
  varying float vLocal;
  varying float vAlong;
  varying vec3 vWorld;
  varying float vViewZ;
  \${noiseGLSL}
  \${commonGLSL}
  void main() {
    ${motif(spell)}
    ${COLOR[spell.element]}
    col *= 1.0 + uPhrase * 0.18;
    float mask = uOpacity * (0.22 + 0.78 * clamp(carved, 0.0, 1.0));
    mask *= smoothstep(0.0, 0.06, vUv.y) * (1.0 - smoothstep(0.94, 1.0, vUv.y));
    if (uDissolve > 0.0) {
      float n = snoise01(vWorld * 0.45 + vec3(uSeed, uTime * 0.20, 0.0));
      float hold = smoothstep(uDissolve, uDissolve + 0.14, n * 0.65 + carved * 0.35);
      col += uColorA * (1.0 - hold) * 0.65;
      mask *= hold;
    }
    if (mask < 0.02) discard;
    vec2 screenUV = gl_FragCoord.xy / max(uResolution, vec2(1.0));
    mask *= softFade(uSceneDepth, screenUV, vViewZ, uCameraNear, uCameraFar, max(uSoftFade, 0.02));
    if (mask < 0.02) discard;
    gl_FragColor = vec4(col * mask * uGlobalGlow * mix(1.0, uShaderIntensity, 0.65), mask);
  }
\`;

const LENS_FRAGMENT = /* glsl */ \`
  precision highp float;
  uniform float uTime;
  uniform float uWarp;
  uniform float uShaderIntensity;
  uniform float uDissolve;
  uniform float uPhrase;
  varying vec2 vUv;
  varying float vLocal;
  varying float vAlong;
  varying vec3 vWorld;
  varying float vViewZ;
  void main() {
    float mask = smoothstep(0.0, 0.10, vUv.y) * (1.0 - smoothstep(0.82, 1.0, vUv.y));
    mask *= (0.40 + 0.60 * clamp(vLocal, 0.0, 1.0)) * (1.0 - uDissolve);
    float s = uWarp * uShaderIntensity * mask * (1.0 + uPhrase * 0.25);
    if (s < 0.01) discard;
    ${lensFrag(spell.element)}
    gl_FragColor = vec4(dir * 0.5 + 0.5, s, mask);
  }
\`;

const GROUND_VERTEX = /* glsl */ \`
  uniform vec3 uCenter;
  uniform vec3 uDir;
  uniform vec3 uSide;
  uniform float uLength;
  uniform float uWidth;
  varying vec2 vUv;
  varying vec3 vWorld;
  varying float vViewZ;
  void main() {
    vUv = vec2(position.x + 0.5, position.y + 0.5);
    vec3 p = uCenter + uDir * (position.y * uLength) + uSide * (position.x * uWidth);
    p.y = 0.04;
    vWorld = p;
    vec4 mv = viewMatrix * vec4(p, 1.0);
    vViewZ = mv.z;
    gl_Position = projectionMatrix * mv;
  }
\`;

const GROUND_FRAGMENT = /* glsl */ \`
  precision highp float;
  uniform float uTime;
  uniform float uSeed;
  uniform float uGlow;
  uniform float uErode;
  uniform float uOpacity;
  uniform float uPhrase;
  uniform vec3 uColorA;
  uniform vec3 uColorB;
  uniform vec2 uResolution;
  uniform sampler2D uSceneDepth;
  uniform float uCameraNear;
  uniform float uCameraFar;
  uniform float uGlobalGlow;
  varying vec2 vUv;
  varying vec3 vWorld;
  varying float vViewZ;
  \${noiseGLSL}
  \${commonGLSL}
  void main() {
    vec2 q = vUv - 0.5;
    float rad = length(q) * 2.0;
    float ang = atan(q.y, q.x);
    float grain = snoise(vec3(vWorld.xz * 0.85, uSeed)) * 0.5 + 0.5;
    ${groundFrag(spell.element)}
    float mask = pat * (1.0 - smoothstep(0.92, 1.08, rad)) * uOpacity * (1.0 - uErode);
    mask *= 0.40 + 0.60 * grain;
    mask *= 1.0 + uPhrase * 0.15;
    if (mask < 0.02) discard;
    vec3 col = mix(uColorA, uColorB, clamp(pat, 0.0, 1.0)) * (0.55 + uGlow);
    vec2 screenUV = gl_FragCoord.xy / max(uResolution, vec2(1.0));
    mask *= softFade(uSceneDepth, screenUV, vViewZ, uCameraNear, uCameraFar, 0.45);
    gl_FragColor = vec4(col * mask * uGlobalGlow, mask);
  }
\`;

const VOICE_VERTEX = /* glsl */ \`
${VERT_HEAD}
${VOICE_VERT[VOICE[SCORE[id].twist]]}
${VERT_TAIL}
\`;

const VOICE_FRAGMENT = /* glsl */ \`
  precision highp float;
  uniform float uTime;
  uniform float uSeed;
  uniform float uDissolve;
  uniform float uOpacity;
  uniform float uGlow;
  uniform float uPhrase;
  uniform vec3 uColorA;
  uniform vec3 uColorB;
  uniform vec2 uResolution;
  uniform sampler2D uSceneDepth;
  uniform float uCameraNear;
  uniform float uCameraFar;
  uniform float uGlobalGlow;
  varying vec2 vUv;
  varying float vLocal;
  varying float vAlong;
  varying vec3 vWorld;
  varying float vViewZ;
  \${noiseGLSL}
  \${commonGLSL}
  void main() {
    float band = 0.5 + 0.5 * sin(vLocal * ${f1} + uTime * ${spd} + uSeed);
    float grain = snoise01(vWorld * ${f2} + vec3(uSeed, uTime * 0.30, 0.0));
    float mask = (0.30 + 0.70 * band) * (0.45 + 0.55 * grain);
    mask *= uOpacity * (1.0 - uDissolve);
    mask *= smoothstep(0.0, 0.08, vUv.y) * (1.0 - smoothstep(0.88, 1.0, vUv.y));
    if (mask < 0.02) discard;
    vec3 col = mix(uColorA, uColorB, band) * (1.0 + uGlow) * (1.0 + uPhrase * 0.40);
    vec2 screenUV = gl_FragCoord.xy / max(uResolution, vec2(1.0));
    mask *= softFade(uSceneDepth, screenUV, vViewZ, uCameraNear, uCameraFar, 0.35);
    gl_FragColor = vec4(col * mask * uGlobalGlow, mask);
  }
\`;

const DETAIL_VERTEX = /* glsl */ \`
  attribute float aSeed;
  attribute vec3 aEdge;
  attribute vec4 aInfo;
  attribute vec3 aStyle;
  attribute vec3 aPivot;
  attribute vec4 aHinge;
  uniform float uGrowArt;
  uniform float uOpenArt;
  uniform float uSwing;
  varying vec3 vWorld;
  varying vec3 vNormalW;
  varying float vSeed;
  varying float vSpan;
  varying float vViewZ;
  varying vec3 vEdge;
  varying vec4 vInfo;
  varying vec2 vStyle;
  vec3 rotAxis(vec3 v, vec3 k, float a) {
    float c = cos(a);
    float s = sin(a);
    return v * c + cross(k, v) * s + k * dot(k, v) * (1.0 - c);
  }
  void main() {
    // Each authored part folds about its own pivot: aInfo.w picks whether it
    // follows the rise (0) or the beat (1), aInfo.z delays it within that.
    float art = mix(uGrowArt, uOpenArt, aInfo.w);
    float fold = smoothstep(aInfo.z, aInfo.z + 0.5, art) * aHinge.w * uSwing;
    vec3 p = position;
    vec3 n = normal;
    if (abs(fold) > 1e-4 && dot(aHinge.xyz, aHinge.xyz) > 0.5) {
      p = aPivot + rotAxis(position - aPivot, aHinge.xyz, fold);
      n = rotAxis(normal, aHinge.xyz, fold);
    }
    mat4 model = modelMatrix;
    #ifdef USE_INSTANCING
      model = modelMatrix * instanceMatrix;
    #endif
    vec4 wp = model * vec4(p, 1.0);
    vWorld = wp.xyz;
    vNormalW = normalize(mat3(model) * n);
    vSeed = aSeed;
    vSpan = aStyle.z;
    vEdge = aEdge;
    vInfo = aInfo;
    vStyle = aStyle.xy;
    vec4 mv = viewMatrix * wp;
    vViewZ = mv.z;
    gl_Position = projectionMatrix * mv;
  }
\`;

const DETAIL_FRAGMENT = /* glsl */ \`
  precision highp float;
  uniform float uTime;
  uniform float uOpacity;
  uniform float uGlow;
  uniform float uEdge;
  uniform float uDissolve;
  uniform vec3 uColorA;
  uniform vec3 uColorB;
  uniform vec3 uColorC;
  uniform vec3 uLightDir;
  uniform vec2 uResolution;
  uniform sampler2D uSceneDepth;
  uniform float uCameraNear;
  uniform float uCameraFar;
  uniform float uGlobalGlow;
  varying vec3 vWorld;
  varying vec3 vNormalW;
  varying float vSeed;
  varying float vSpan;
  varying float vViewZ;
  varying vec3 vEdge;
  varying vec4 vInfo;
  varying vec2 vStyle;
  \${noiseGLSL}
  \${commonGLSL}
  void main() {
    vec3 n = normalize(vNormalW);
    if (!gl_FrontFacing) n = -n;
    vec3 view = normalize(cameraPosition - vWorld);
    float rim = pow(1.0 - abs(dot(n, view)), 2.2);
    float lit = clamp(dot(n, normalize(uLightDir)) * 0.5 + 0.5, 0.0, 1.0);
    float pat = ${DETAIL_PATTERN[spell.element]};
    // The body of the solid stays below white so its form reads; the bright
    // terms (hot cores, arrises, rim) ride on top of it and feed the bloom.
    vec3 col = mix(uColorC * 0.7, uColorA * 0.9, pow(lit, 1.6));
    // Face and part tint: no two faces of an authored solid read the same.
    col *= 0.84 + 0.3 * fract(vInfo.y * 0.61803 + vInfo.x * 0.37);
    col = mix(col, uColorB * 0.85, clamp(pat, 0.0, 1.0) * 0.3);
    // Hot core parts (glow weight) breathe.
    col += uColorB * vStyle.y * (0.55 + 0.35 * sin(uTime * 3.0 + vInfo.x * 1.7));
    // Arrises: distance to the nearest real edge, a hairline whatever the size
    // on screen, dropped once a triangle is too small to carry one.
    float edge = min(min(vEdge.x, vEdge.y), vEdge.z);
    float slope = fwidth(edge) + 1e-4;
    float line = (1.0 - smoothstep(slope * 0.6, slope * 1.7, edge)) * (1.0 - smoothstep(0.14, 0.3, slope)) * vStyle.x;
    col += uColorA * line * uEdge * 0.55 * (0.5 + 0.5 * lit);
    col += uColorB * rim * uGlow * 0.35;
    col *= 0.86 + 0.14 * sin(uTime * (3.0 + vSeed * 5.0) + vSeed * 31.0);
    float mask = uOpacity;
    if (uDissolve > 0.0) {
      float cut = snoise01(vWorld * 1.7 + vec3(vSeed * 9.0, uTime * 0.2, 0.0));
      mask *= smoothstep(uDissolve, uDissolve + 0.12, cut);
    }
    if (mask < 0.02) discard;
    vec2 screenUV = gl_FragCoord.xy / max(uResolution, vec2(1.0));
    mask *= softFade(uSceneDepth, screenUV, vViewZ, uCameraNear, uCameraFar, 0.3);
    if (mask < 0.02) discard;
    ${PROFILE[spell.element].solid ? 'gl_FragColor = vec4(col * uGlobalGlow, mask);' : 'gl_FragColor = vec4(col * mask * uGlobalGlow, mask);'}
  }
\`;

function shapeUniforms() {
  return {
    uCenter: { value: new Vector3() },
    uOrigin: { value: new Vector3() },
    uDir: { value: new Vector3(0, 0, 1) },
    uSide: { value: new Vector3(1, 0, 0) },
    uRadius: { value: 1 },
    uLength: { value: 1 },
    uHeight: { value: 1 },
    uThickness: { value: 0.3 },
    uCount: { value: 6 },
    uSpin: { value: 0 },
    uOpen: { value: 1 },
    uGrow: { value: 1 },
    uAlong: { value: 1 },
    uSeed: { value: 0 }
  };
}

function writeShape(u, st, spin) {
  u.uCenter.value.copy(st.center);
  u.uOrigin.value.copy(st.origin);
  u.uDir.value.copy(st.dir);
  u.uSide.value.copy(st.side);
  u.uRadius.value = st.radius;
  u.uLength.value = st.length;
  u.uHeight.value = st.height;
  u.uThickness.value = st.thickness;
  u.uCount.value = st.count;
  u.uSpin.value = spin;
  u.uOpen.value = st.open;
  u.uGrow.value = st.grow;
  u.uAlong.value = st.along;
  u.uSeed.value = st.seed;
}

export function create${cls}BodyMaterial() {
  const material = new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    depthTest: true,
    blending: AdditiveBlending,
    side: DoubleSide,
    toneMapped: false,
    uniforms: sharedUniforms({
      ...shapeUniforms(),
      uDissolve: { value: 0 },
      uSoftFade: { value: 0.4 },
      uOpacity: { value: 1 },
      uGlow: { value: 1 },
      uEdge: { value: 2 },
      uPhrase: { value: 0 },
      uColorA: { value: new Color() },
      uColorB: { value: new Color() },
      uColorC: { value: new Color() }
    }),
    vertexShader: BODY_VERTEX,
    fragmentShader: BODY_FRAGMENT
  });
  material.userData.sync = (st) => {
    const c = settings[ID];
    const g = settings.global;
    const u = material.uniforms;
    writeShape(u, st, st.spin);
    u.uDissolve.value = st.dissolve;
    u.uSoftFade.value = c.softFade;
    u.uOpacity.value = c.bodyOpacity * g.opacity * st.fade;
    u.uGlow.value = c.bodyGlow * g.glow * st.pulse;
    u.uEdge.value = c.edgeGlow * g.glow * st.pulse;
    u.uPhrase.value = st.phrase;
    u.uColorA.value.copy(getColor(c.colorA));
    u.uColorB.value.copy(getColor(c.colorB));
    u.uColorC.value.copy(getColor(c.colorC));
  };
  return material;
}

export function create${cls}LensMaterial() {
  const material = new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    depthTest: false,
    blending: NormalBlending,
    side: DoubleSide,
    toneMapped: false,
    uniforms: sharedUniforms({
      ...shapeUniforms(),
      uWarp: { value: 1 },
      uDissolve: { value: 0 },
      uPhrase: { value: 0 }
    }),
    vertexShader: BODY_VERTEX,
    fragmentShader: LENS_FRAGMENT
  });
  material.userData.sync = (st) => {
    const c = settings[ID];
    const g = settings.global;
    const u = material.uniforms;
    writeShape(u, st, st.spin);
    u.uDissolve.value = st.dissolve;
    u.uPhrase.value = st.phrase;
    u.uWarp.value = c.lensWarp * g.distortion * st.fade * (1.0 - st.dissolve);
  };
  return material;
}

export function create${cls}GroundMaterial() {
  const material = new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    depthTest: true,
    blending: NormalBlending,
    side: DoubleSide,
    toneMapped: false,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    polygonOffsetUnits: -2,
    uniforms: sharedUniforms({
      uCenter: { value: new Vector3() },
      uDir: { value: new Vector3(0, 0, 1) },
      uSide: { value: new Vector3(1, 0, 0) },
      uLength: { value: 4 },
      uWidth: { value: 4 },
      uSeed: { value: 0 },
      uGlow: { value: 1 },
      uErode: { value: 0 },
      uOpacity: { value: 1 },
      uPhrase: { value: 0 },
      uColorA: { value: new Color() },
      uColorB: { value: new Color() }
    }),
    vertexShader: GROUND_VERTEX,
    fragmentShader: GROUND_FRAGMENT
  });
  material.userData.sync = (st) => {
    const c = settings[ID];
    const g = settings.global;
    const u = material.uniforms;
    u.uCenter.value.copy(st.center);
    u.uDir.value.copy(st.dir);
    u.uSide.value.copy(st.side);
    u.uLength.value = Math.max(0.2, st.foot);
    u.uWidth.value = Math.max(0.2, st.footWidth);
    u.uSeed.value = st.seed;
    u.uGlow.value = c.groundGlow * g.glow;
    u.uErode.value = st.dissolve;
    u.uOpacity.value = c.groundOpacity * g.opacity * st.fade;
    u.uPhrase.value = st.phrase;
    u.uColorA.value.copy(getColor(c.colorGroundA));
    u.uColorB.value.copy(getColor(c.colorGroundB));
  };
  return material;
}

export function create${cls}VoiceMaterial() {
  const material = new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    depthTest: true,
    blending: AdditiveBlending,
    side: DoubleSide,
    toneMapped: false,
    uniforms: sharedUniforms({
      ...shapeUniforms(),
      uDissolve: { value: 0 },
      uOpacity: { value: 1 },
      uGlow: { value: 1 },
      uPhrase: { value: 0 },
      uColorA: { value: new Color() },
      uColorB: { value: new Color() }
    }),
    vertexShader: VOICE_VERTEX,
    fragmentShader: VOICE_FRAGMENT
  });
  material.userData.sync = (st) => {
    const c = settings[ID];
    const g = settings.global;
    const u = material.uniforms;
    writeShape(u, st, st.voiceSpin);
    u.uDissolve.value = st.dissolve;
    u.uOpacity.value = c.bodyOpacity * c.voiceOpacity * g.opacity * st.fade;
    u.uGlow.value = c.bodyGlow * g.glow * 1.25 * st.pulse;
    u.uPhrase.value = st.phrase;
    u.uColorA.value.copy(getColor(c.colorVoiceA));
    u.uColorB.value.copy(getColor(c.colorVoiceB));
  };
  return material;
}

/** \`rig\` true builds the hero rig's material: the same shader, its own look. */
export function create${cls}DetailMaterial(rig = false) {
  const material = new ShaderMaterial({
    transparent: true,
    depthWrite: ${PROFILE[spell.element].solid},
    depthTest: true,
    blending: ${PROFILE[spell.element].solid ? 'NormalBlending' : 'AdditiveBlending'},
    side: DoubleSide,
    toneMapped: false,
    uniforms: sharedUniforms({
      uOpacity: { value: 1 },
      uGlow: { value: 1 },
      uEdge: { value: 1 },
      uDissolve: { value: 0 },
      uGrowArt: { value: 0 },
      uOpenArt: { value: 0 },
      uSwing: { value: 1 },
      uColorA: { value: new Color() },
      uColorB: { value: new Color() },
      uColorC: { value: new Color() }
    }),
    vertexShader: DETAIL_VERTEX,
    fragmentShader: DETAIL_FRAGMENT
  });
  material.userData.sync = (st) => {
    const c = settings[ID];
    const g = settings.global;
    const u = material.uniforms;
    const k = rig ? 'hero' : 'detail';
    const K = rig ? 'Hero' : 'Detail';
    u.uOpacity.value = c[k + 'Opacity'] * g.opacity * st.fade;
    u.uGlow.value = c[k + 'Glow'] * g.glow * st.pulse;
    u.uEdge.value = c[k + 'Edge'];
    u.uSwing.value = c[k + 'Swing'];
    u.uGrowArt.value = Math.min(1, Math.max(0, st.grow));
    u.uOpenArt.value = Math.min(1, Math.max(0, st.beat));
    u.uDissolve.value = st.dissolve * 0.6;
    u.uColorA.value.copy(getColor(c['color' + K + 'A']));
    u.uColorB.value.copy(getColor(c['color' + K + 'B']));
    u.uColorC.value.copy(getColor(c['color' + K + 'C']));
  };
  return material;
}
`;
}

function abilitySource(spell) {
  const score = SCORE[spell.id];
  const arch = ARCH[spell.archetype];
  const hit = score.hit ?? arch.hit[spell.variant];
  const carry = arch.carry[spell.variant];
  const hitWhen = score.hitWhen ?? WHEN[score.twist];
  const echo = score.echo ?? null;
  const lift = spell.id === 'falsefloor' ? -1 : (hit === 'up' ? 1.5 : 1);
  const slice = ['slice', 'swing', 'side'].includes(hit);
  const [shedA, shedB] = SHED[spell.element];
  const zone = spell.cast === 'zone';
  const cls = spell.cls;
  const poseText = poseLines(score.twist);
  return `import { Mesh, PlaneGeometry, Vector3 } from 'three';
import { Ability } from '../Ability.js';
import { DetailLayer } from './DetailLayer.js';
import { RigHero } from './RigHero.js';
import { createSpellBodyGeometry } from './PureBodyGeometries.js';
import { create${cls}PieceGeometry, create${cls}HeroGeometry } from '../../assets/codex/${cls}Geometry.js';
import {
  create${cls}BodyMaterial,
  create${cls}LensMaterial,
  create${cls}GroundMaterial,
  create${cls}VoiceMaterial,
  create${cls}DetailMaterial
} from '../../materials/codex/${cls}Materials.js';
import { ParticleShape } from '../../particles/ParticleSystem.js';
import { RateEmitter } from '../../particles/ParticleEngine.js';
import { DecalType } from '../../effects/GroundDecals.js';
import { BurstMode } from '../../effects/BurstSphere.js';
import { LAYER } from '../../core/Layers.js';
import { frame } from '../../core/FrameUniforms.js';
import { settings } from '../../config/settings.js';
import { getColor } from '../../utils/color.js';
import { saturate, ${hit === 'swing' ? 'lerp, ' : ''}Easing } from '../../utils/math.js';

export const ID = '${spell.id}';

const TWIST = '${score.twist}';
const ARCH = '${spell.archetype}';
const HIT = '${hit}';
const CARRY = '${carry}';
const WHEN = '${hitWhen}';
const ECHO = ${echo ? `'${echo}'` : 'null'};
const OFFSET = ${score.offset ? 'true' : 'false'};
const DISSOLVE_TRAVEL = ${score.dissolveTravel ? 'true' : 'false'};
const COUNTER = ${score.counter ? 'true' : 'false'};
const ZONE = ${zone ? 'true' : 'false'};
const LIFT = ${lift};
const SLICE = ${slice ? 'true' : 'false'};

const _emit = {};
const _pos = new Vector3();
const _dir = new Vector3();
const _end = new Vector3();
const _focus = new Vector3();
const _body = new Vector3();
const _up = new Vector3(0, 1, 0);

/** Felled bodies one cast can keep marked at once. */
const MAX_MARKS = 12;

/**
 * ${spell.label.toUpperCase()} — ${spell.element}, ${spell.cast} cast.
 *
 * ${spell.hint}.
 *
 * ${score.note}
 *
 * The read is \`${score.twist}\`: hit timing \`${hitWhen}\`, blow \`${hit}\`${carry === 'none' ? '' : `, carry \`${carry}\``}.${echo ? ` A second beat (\`${echo}\`) lands once the fade has started, for whoever the first beat missed.` : ''}${score.offset ? ' The kill sits off the aim by the thickness, on purpose.' : ''}${score.dissolveTravel ? ' The body starts to dissolve while it is still travelling.' : ''}
 *
 * ## Layers
 *
 *   1. **body** — the ${score.twist} placement, in its own shader.
 *   2. **lens** — the same placement into the distortion buffer.
 *   3. **ground** — a ${spell.element} pattern under the footprint.
 *   4. **voice** — a ${VOICE[score.twist]} riding alongside the body, spun ${score.counter ? 'the other way' : 'with the cast'}.
 *   5. **detail** — an InstancedMesh of the cast's own authored piece (\`create${cls}PieceGeometry\`); each piece folds part by part as the cast rises and beats.
 *   6. **hero** — one larger authored rig (\`create${cls}HeroGeometry\`), stood by its archetype (${spell.archetype}): ${HERO_STAND[spell.archetype]}.
 *   7. **shed** — dust, streaks, chips and motes on RateEmitters.
 *   8. **aftershock** — a second, smaller beat when the fade starts.
 *   9. **bodies** — \`handlesOwnHits\`: ${score.note.charAt(0).toLowerCase()}${score.note.slice(1)}
 *  10. **mark** — a felled body is ${MARK[spell.element].verb}: \`corrode\` stains it toward the
 *      element's look over \`markTime\` and it sheds motes for \`markLife\`.
 *
 * The cast leaves the fist in a flare of sparks (\`handFlare\`, \`handSparks\`).
 *
 * Every metre, rate and colour is read from \`settings.${spell.id}\` each frame.
 * A cast only captures a seed and an integrated spin.
 */
export class ${cls}Ability extends Ability {
  constructor(ctx) {
    super(ID, ctx);
  }

  get handlesOwnHits() {
    return true;
  }

  get instanceCount() {
    return this._hits;
  }

  createShaders() {
    this.bodyGeometry = createSpellBodyGeometry(ID);
    this.voiceGeometry = new PlaneGeometry(1, 1, 64, 8);
    this.groundGeometry = new PlaneGeometry(1, 1, 1, 1);
    this.bodyMaterial = create${cls}BodyMaterial();
    this.lensMaterial = create${cls}LensMaterial();
    this.groundMaterial = create${cls}GroundMaterial();
    this.voiceMaterial = create${cls}VoiceMaterial();
    this.detailMaterial = create${cls}DetailMaterial();
    this.heroMaterial = create${cls}DetailMaterial(true);
    this.detail = new DetailLayer(create${cls}PieceGeometry(), this.detailMaterial);
    this.group.add(this.detail.mesh);
    this.rig = new RigHero(create${cls}HeroGeometry(), this.heroMaterial, ARCH, ZONE);
    this.group.add(this.rig.mesh);
    this.body = this._mesh(this.bodyGeometry, this.bodyMaterial, LAYER.VFX, 12);
    this.voice = this._mesh(this.voiceGeometry, this.voiceMaterial, LAYER.VFX, 13);
    this.lens = this._mesh(this.bodyGeometry, this.lensMaterial, LAYER.DISTORTION, 0);
    this.ground = this._mesh(this.groundGeometry, this.groundMaterial, LAYER.VFX, 1);
    this._state = {
      center: new Vector3(),
      origin: new Vector3(),
      dir: new Vector3(0, 0, 1),
      side: new Vector3(1, 0, 0),
      radius: 1,
      length: 1,
      height: 1,
      thickness: 0.3,
      count: 6,
      spin: 0,
      voiceSpin: 0,
      open: 1,
      beat: 0,
      grow: 1,
      along: 0,
      seed: 0,
      fade: 1,
      dissolve: 0,
      phrase: 0,
      foot: 1,
      footWidth: 1,
      pulse: 1
    };
    this._seed = 0;
    this._settled = false;
    this._spin = 0;
    this._hits = 0;
    this._echoed = false;
    this._struck = [];
    this._carried = [];
    this._parts = Array.from({ length: 12 }, () => ({ armed: true }));
    this._force = { impulse: 0, lift: 0, spin: 0 };
    this._flow = { vx: 0, vy: 0, vz: 0 };
    this._field = (x, y, z, out) => out.set(this._flow.vx, this._flow.vy, this._flow.vz);
    this._found = [];
    this._marks = Array.from({ length: MAX_MARKS }, () => ({ dummy: null, time: 0, emitter: new RateEmitter() }));
    this._markCount = 0;
    this._look = { color: '#000000', rimColor: '#000000', rimEmissive: 0, edgeColor: '#000000', edgeEmissive: 0, edgeWidth: 0 };
  }

  _mesh(geometry, material, layer, order) {
    const mesh = new Mesh(geometry, material);
    mesh.layers.set(layer);
    mesh.renderOrder = order;
    mesh.frustumCulled = false;
    mesh.visible = false;
    this.group.add(mesh);
    return mesh;
  }

  createParticles() {
    const particles = this.ctx.particles;
    this.dust = particles.get('${spell.id}.dust', {
      capacity: 900,
      shape: ParticleShape.SMOKE,
      additive: false,
      curl: true,
      softFade: 0.65
    });
    this.streaks = particles.get('${spell.id}.streak', {
      capacity: 1200,
      shape: ParticleShape.${spell.particle},
      additive: true,
      stretch: true,
      softFade: 0.2
    });
    this.chips = particles.get('${spell.id}.chip', {
      capacity: 500,
      shape: ParticleShape.CHIP,
      additive: false,
      lit: true,
      softFade: 0.15
    });
    this.motes = particles.get('${spell.id}.mote', {
      capacity: 600,
      shape: ParticleShape.SOFT,
      additive: true,
      softFade: 0.2
    });
    this.dustEmitter = new RateEmitter();
    this.streakEmitter = new RateEmitter();
    this.chipEmitter = new RateEmitter();
    this.moteEmitter = new RateEmitter();
  }

  get impactDuration() {
    return Math.max(0.05, settings[ID].impactTime * settings.global.lifetime);
  }

  get fadeDuration() {
    return Math.max(0.1, settings[ID].fadeTime * settings.global.lifetime);
  }

  lightShimmer() {
    const f = settings[ID].lightFlicker;
    return 1 - f + f * Math.sin(this.age * ${num(5 + (hashId(spell.id) % 7))});
  }

  onSpawn() {
    this._seed = Math.random() * 10;
    this._spin = Math.random() * Math.PI * 2;
    this._hits = 0;
    this._echoed = false;
    this._settled = false;
    this._struck.length = 0;
    this._carried.length = 0;
    for (let i = 0; i < this._parts.length; i++) this._parts[i].armed = true;
    this.dustEmitter.reset();
    this.streakEmitter.reset();
    this.chipEmitter.reset();
    this.moteEmitter.reset();
    this.detail.reseed(this._seed);
    this.detail.hide();
    this.rig.hide();
    this.body.visible = false;
    this.voice.visible = false;
    this.lens.visible = false;
    this.ground.visible = false;
    this._releaseMarks();
    this._palette();
    this._hand();
    if (ZONE) this._telegraph();
  }

  /** The cast leaves the fist: a small flare, a spray of sparks along the aim, motes left hanging. */
  _hand() {
    const c = settings[ID];
    const g = settings.global;
    _pos.copy(this.origin).addScaledVector(this.direction, c.handForward).addScaledVector(this.side, c.handSide);
    _pos.y = c.handHeight;
    if (c.handFlare > 0.01) {
      this.ctx.bursts.spawn(BurstMode.${spell.burst}, _pos, {
        radius: 0.05,
        endRadius: c.handFlare,
        life: 0.22,
        intensity: 0.6,
        opacity: 0.4 * g.opacity,
        squash: 1,
        colorA: getColor(c.colorBurstA),
        colorB: getColor(c.colorBurstB),
        colorC: getColor(c.colorBurstC)
      });
    }
    const sparks = Math.round(c.handSparks * g.particleCount);
    if (sparks > 0) {
      this._fillEmit(_pos, 0.08, this.direction, c.streakSpeed * 1.2, 0.5, 0.06, c.streakLife * 0.8, 2);
      this.streaks.emit(sparks, _emit);
    }
    const motes = Math.round(c.handMotes * g.particleCount);
    if (motes > 0) {
      this._fillEmit(_pos, 0.15, _up, c.moteSpeed * 0.5, 0.9, 0.08, c.moteLife, 1);
      this.motes.emit(motes, _emit);
    }
  }

  _focusPoint(out) {
    if (ZONE) return this.pointAt(1, out);
    return this.pointAt(this.u, out);
  }

  _aim(out) {
    this._focusPoint(out);
    if (OFFSET) out.addScaledVector(this.side, settings[ID].thickness * 4);
    return out;
  }

  _pose(committed, fadeT) {
    const u = this.u;
    ${/rise/.test(poseText) ? 'const rise = committed ? 1 : Easing.outCubic(saturate(u));' : ''}
    ${/beat/.test(poseText) ? 'const beat = committed ? Easing.outCubic(saturate(fadeT < 1 ? fadeT : 1)) : 0;' : ''}
    let grow;
    let open;
    let along;
    ${poseText}
    let dissolve = 0;
    if (committed && fadeT >= 1) dissolve = saturate((fadeT - 1) * 1.15);
    else if (DISSOLVE_TRAVEL && !committed) dissolve = saturate(u * 0.55);
    const fade = committed && fadeT >= 1 ? 1 - (fadeT - 1) : 1;
    const phrase = committed ? (fadeT < 1 ? 1 : 2) : 0;
    this._write(open, grow, along, dissolve, fade, phrase);
  }

  _write(open, grow, along, dissolve, fade, phrase) {
    const c = settings[ID];
    const g = settings.global;
    const st = this._state;
    this._focusPoint(_focus);
    st.center.copy(_focus);
    st.origin.copy(this.origin);
    st.dir.copy(this.direction);
    st.side.copy(this.side);
    st.radius = ZONE ? Math.max(0.2, c.zoneRadius) : Math.max(0.2, c.sweep);
    st.length = Math.max(0.2, this.length);
    st.height = c.height * g.shaderIntensity;
    st.thickness = c.thickness;
    st.count = Math.max(1, c.count);
    st.spin = this._spin;
    st.voiceSpin = this._spin * (COUNTER ? -1.35 : 1);
    st.open = open * (0.35 + Math.max(0, c.lean));
    st.beat = open;
    st.grow = grow;
    st.along = along;
    st.seed = this._seed;
    st.fade = fade;
    st.dissolve = dissolve;
    st.phrase = phrase;
    st.foot = ZONE ? c.zoneRadius * 2 : Math.max(0.4, this.front);
    st.footWidth = ZONE ? c.zoneRadius * 2 : c.groundWidth;
    st.pulse = 1 + c.bodyPulse * Math.sin(this.age * c.bodyPulseRate);
    this.bodyMaterial.userData.sync(st);
    this.lensMaterial.userData.sync(st);
    this.groundMaterial.userData.sync(st);
    this.voiceMaterial.userData.sync(st);
    this.detailMaterial.userData.sync(st);
    this.heroMaterial.userData.sync(st);
    this.detail.update(TWIST, ZONE, st, c, this.age);
    this.rig.update(st, c, this.age);
    const show = fade > 0.02 && (grow > 0.02 || open > 0.02);
    this.body.visible = show;
    this.voice.visible = show;
    this.lens.visible = show && c.lensWarp > 0.01;
    this.ground.visible = fade > 0.02;
    this.position.copy(_focus);
    this.position.y = c.height * 0.45;
  }

  _palette() {
    const c = settings[ID];
    const g = settings.global;
    const sync = (p, a, b, cc, d, size, glow, grav) => {
      p.setGradient(getColor(a), getColor(b), getColor(cc), getColor(d));
      p.uniforms.uSizeScale.value = size * g.particleSize * 7;
      p.uniforms.uLifeScale.value = g.particleLifetime;
      p.uniforms.uSpeedScale.value = g.particleSpeed;
      p.uniforms.uOpacity.value = g.opacity;
      p.uniforms.uGlow.value = glow;
      p.uniforms.uGravity.value.set(0, grav, 0);
    };
    sync(this.dust, c.colorDustA, c.colorDustB, c.colorDustC, c.colorDustD, c.dustSize, 1, ${spell.element === 'gravity' || spell.element === 'earth' ? -1.4 : 0.4});
    this.dust.uniforms.uOpacity.value = c.dustOpacity * g.opacity;
    sync(this.streaks, c.colorStreakA, c.colorStreakB, c.colorStreakC, c.colorStreakD, c.streakSize, 2 * g.glow, 0);
    this.streaks.uniforms.uStretch.value = c.streakStretch;
    sync(this.motes, c.colorMoteA, c.colorMoteB, c.colorMoteC, c.colorMoteD, c.moteSize, 1.6 * g.glow, ${PROFILE[spell.element].mote === 'dust' ? -0.6 : 0.5});
    this.motes.uniforms.uOpacity.value = 0.9 * g.opacity;
    sync(this.chips, c.colorChipA, c.colorChipB, c.colorChipC, c.colorChipD, c.chipSize, 1, ${spell.element === 'light' || spell.element === 'holy' ? 2.5 : -9});
  }

  _fillEmit(position, radius, direction, speed, spread, size, life, spin) {
    _emit.position = position;
    _emit.radius = radius;
    _emit.direction = direction;
    _emit.speed = speed;
    _emit.speedVariance = 0.4;
    _emit.spread = spread;
    _emit.inherit = null;
    _emit.anchor = null;
    _emit.size = size;
    _emit.sizeVariance = 0.5;
    _emit.life = life;
    _emit.lifeVariance = 0.35;
    _emit.spin = spin;
    _emit.tint = null;
    _emit.time = frame.uTime.value;
  }

  _shed(dt, strength) {
    const c = settings[ID];
    const g = settings.global;
    this._focusPoint(_end);
    const dustN = Math.round(this.dustEmitter.tick(dt, c.dustRate * strength) * g.particleCount);
    if (dustN > 0) {
      this._fillEmit(_end, ZONE ? c.zoneRadius * 0.35 : 0.3, _dir, c.dustSpeed, 0.45, 0.45, c.dustLife, 0.4);
      for (let i = 0; i < dustN; i++) {
        const ang = this._spin + i * 0.7;
        ${shedA}
        _emit.direction = _dir;
        this.dust.emit(1, _emit);
      }
    }
    const streakN = Math.round(this.streakEmitter.tick(dt, c.streakRate * strength) * g.particleCount);
    if (streakN > 0) {
      this._fillEmit(_end, 0.2, _dir, c.streakSpeed, 0.22, 0.08, c.streakLife, 2);
      for (let i = 0; i < streakN; i++) {
        const ang = this._spin * 1.7 + i;
        ${shedB}
        _emit.direction = _dir;
        this.streaks.emit(1, _emit);
      }
    }
    const chipN = Math.round(this.chipEmitter.tick(dt, c.chipRate * strength) * g.particleCount);
    if (chipN > 0) {
      this._fillEmit(_end, 0.16, _dir, c.chipSpeed, 0.4, 0.08, c.chipLife, 6);
      for (let i = 0; i < chipN; i++) {
        const ang = this._spin + i * 1.3;
        _dir.set(Math.cos(ang), ${spell.element === 'gravity' ? '-0.4' : '0.7'}, Math.sin(ang));
        _emit.direction = _dir;
        this.chips.emit(1, _emit);
      }
    }
    this._motes(dt, strength);
  }

  /** Motes drift off whichever detail pieces are standing. */
  _motes(dt, strength) {
    const c = settings[ID];
    const g = settings.global;
    const n = Math.round(this.moteEmitter.tick(dt, c.moteRate * strength * (this.detail.live / Math.max(1, c.detailCount))) * g.particleCount);
    if (n <= 0) return;
    const count = Math.round(c.detailCount);
    for (let k = 0; k < n; k++) {
      const pick = Math.floor(Math.random() * count);
      if (!this.detail.pointOf(pick, _pos)) continue;
      _dir.set((Math.random() - 0.5) * 0.6, 1, (Math.random() - 0.5) * 0.6);
      this._fillEmit(_pos, 0.12, _dir, c.moteSpeed, 0.5, 0.08, c.moteLife, 1);
      this.motes.emit(1, _emit);
    }
  }

  _already(dummy) {
    for (let i = 0; i < this._struck.length; i++) if (this._struck[i] === dummy) return true;
    return false;
  }

  _remember(dummy) {
    if (this._struck.length < 24) this._struck.push(dummy);
    if (CARRY !== 'none' && this._carried.length < 16) this._carried.push(dummy);
    this._hits++;
    this._mark(dummy);
  }

  /** Start a felled body wearing the element. */
  _mark(dummy) {
    if (this._markCount >= MAX_MARKS) return;
    const slot = this._marks[this._markCount++];
    slot.dummy = dummy;
    slot.time = 0;
    slot.emitter.reset();
  }

  /** Stain the marked bodies toward the element's look and keep them shedding. */
  _updateMarks(dt) {
    if (this._markCount === 0) return;
    const c = settings[ID];
    const g = settings.global;
    const look = this._look;
    look.color = c.colorMarkBody;
    look.rimColor = c.colorMarkRim;
    look.rimEmissive = c.markRimGlow;
    look.edgeColor = c.colorMarkEdge;
    look.edgeEmissive = c.markEdgeGlow;
    look.edgeWidth = c.markEdgeWidth;
    for (let i = 0; i < this._markCount; i++) {
      const slot = this._marks[i];
      const dummy = slot.dummy;
      if (!dummy || dummy.finished) continue;
      slot.time += dt;
      dummy.corrode(saturate(slot.time / Math.max(0.02, c.markTime)) * c.markAmount, look);
      const left = 1 - saturate(slot.time / Math.max(0.05, c.markLife * g.lifetime));
      if (left <= 0) continue;
      const n = Math.round(slot.emitter.tick(dt, c.markMotes * left) * g.particleCount);
      if (n <= 0) continue;
      const at = dummy.bodyPoint?.(_body) ?? _body.copy(dummy.position).setY(0.9);
      this._fillEmit(at, 0.3, _up, c.moteSpeed, 0.7, 0.08, c.moteLife, 1);
      this.motes.emit(n, _emit);
    }
  }

  _releaseMarks() {
    for (let i = 0; i < this._markCount; i++) this._marks[i].dummy = null;
    this._markCount = 0;
  }

${killMethod(hit)}

  _blow(dummy, mode) {
    const c = settings[ID];
    const g = settings.global;
    if (mode && mode !== HIT) this._killEcho(dummy, mode);
    else this._killDir(dummy);
    this._force.impulse = c.hitImpulse * g.explosionIntensity;
    this._force.lift = c.hitLift * g.explosionIntensity * LIFT;
    if (mode === 'up') this._force.lift *= 1.4;
    this._force.spin = c.hitSpin;
    if (dummy.kill(_dir.x, _dir.z, this._force, SLICE || mode === 'swing')) this._remember(dummy);
  }

  _killEcho(dummy, mode) {
    this._aim(_focus);
    if (mode === 'up') {
      _dir.copy(this.direction).multiplyScalar(0.2);
      return;
    }
    _dir.set(dummy.position.x - _focus.x, 0, dummy.position.z - _focus.z);
    if (_dir.lengthSq() < 1e-4) _dir.copy(this.direction);
    else _dir.normalize();
    if (mode === 'in') _dir.multiplyScalar(-1);
    if (mode === 'tangent') {
      const x = _dir.x;
      _dir.set(-_dir.z, 0, x);
    }
  }

  _gather(x, z, radius, mode) {
    const field = this.ctx.dummies;
    if (!field?.findTargets) return;
    const found = field.findTargets(x, z, radius, this._found);
    for (let i = 0; i < found.length; i++) {
      const dummy = found[i];
      if (this._already(dummy)) continue;
      this._blow(dummy, mode);
    }
    this._found.length = 0;
  }

${partMethods(score.twist)}

  _strikeParts(forceAll) {
    const c = settings[ID];
    const n = Math.max(1, Math.min(12, Math.round(c.count)));
    for (let i = 0; i < n; i++) {
      if (!forceAll && this._head(i, n) < 0.98) continue;
      if (!this._parts[i].armed) continue;
      this._parts[i].armed = false;
      this._partPoint(i, n, _end);
      this._gather(_end.x, _end.z, Math.max(0.45, c.thickness * 4 + 0.5));
    }
  }

  _strike(forceAll) {
    const c = settings[ID];
    if (WHEN === 'part') {
      this._strikeParts(forceAll);
      return;
    }
    if (WHEN === 'late' && this.u < 0.42 && !forceAll) return;
    this._aim(_end);
    const reach = ZONE ? Math.max(c.zoneRadius, c.hitRadius) : Math.max(0.35, c.hitRadius);
    this._gather(_end.x, _end.z, reach);
  }

  _echo() {
    if (!ECHO) return;
    const c = settings[ID];
    this._aim(_end);
    const reach = (ZONE ? Math.max(c.zoneRadius, c.hitRadius) : c.hitRadius) * 1.15;
    this._gather(_end.x, _end.z, reach, ECHO);
    this.ctx.flash.trigger(getColor(c.colorFlash), c.impactFlash * 0.45 * settings.global.explosionIntensity);
    this.ctx.shake.add(c.impactShake * 0.4 * settings.global.cameraShake, 6, 16);
  }

  _drag(dt, fade) {
    if (CARRY === 'none' || fade <= 0.02) return;
    const c = settings[ID];
    this._focusPoint(_focus);
    const grab = saturate(6 * dt) * fade;
    for (let i = this._carried.length - 1; i >= 0; i--) {
      const dummy = this._carried[i];
      if (!dummy || dummy.finished || dummy.alive) {
        dummy?.release?.();
        this._carried.splice(i, 1);
        continue;
      }
      const at = dummy.bodyPoint ? dummy.bodyPoint(_pos) : dummy.position;
      if (!at) continue;
      const dx = _focus.x - at.x;
      const dz = _focus.z - at.z;
      const d = Math.max(0.2, Math.hypot(dx, dz));
      const inward = CARRY === 'in' ? 1 : CARRY === 'out' ? -1 : 0.25;
      const spin = CARRY === 'orbit' ? 4.2 : 1.15;
      const lift = CARRY === 'up' ? 7 : 1.3;
      this._flow.vx = (dx / d) * inward * 6 * c.sweep + (-dz / d) * spin;
      this._flow.vz = (dz / d) * inward * 6 * c.sweep + (dx / d) * spin;
      this._flow.vy = lift * fade;
      dummy.carry(this._field, grab, grab, CARRY === 'up' ? 0.35 : 0);
    }
  }

  _telegraph() {
    const c = settings[ID];
    this.pointAt(1, _end);
    this.ctx.decals.spawn(DecalType.${spell.decal}, _end, {
      radius: Math.max(0.4, c.zoneRadius) * 0.85,
      life: Math.max(0.4, c.shockLife),
      width: 0.05,
      intensity: 0.45,
      colorA: getColor(c.colorShockA),
      colorB: getColor(c.colorShockB),
      height: 0.02
    });
  }

  _beat() {
    const c = settings[ID];
    const g = settings.global;
    const power = g.explosionIntensity;
    this._aim(_end);
    this.ctx.shake.add(c.impactShake * power * g.cameraShake, 4, 18);
    this.ctx.flash.trigger(getColor(c.colorFlash), c.impactFlash * power);
    this.lightBoost = c.impactLight * power;
    this.ctx.bursts.spawn(BurstMode.${spell.burst}, _pos.copy(_end).setY(Math.max(0.4, c.height * 0.35)), {
      radius: 0.35,
      endRadius: c.burstRadius * power,
      life: c.burstLife,
      intensity: 0.85,
      opacity: 0.55 * g.opacity,
      squash: 0.7,
      colorA: getColor(c.colorBurstA),
      colorB: getColor(c.colorBurstB),
      colorC: getColor(c.colorBurstC)
    });
    this.ctx.decals.spawn(DecalType.${spell.decal}, _end, {
      radius: c.shockRadius * (ZONE ? 1 : 0.65) * power,
      life: c.shockLife,
      width: 0.08,
      intensity: 1,
      colorA: getColor(c.colorShockA),
      colorB: getColor(c.colorShockB),
      height: 0.03
    });
    this.ctx.decals.spawn(DecalType.SHOCKWAVE, _end, {
      radius: c.shockRadius * 0.8,
      life: c.shockLife * 0.75,
      width: 0.05,
      intensity: 0.85,
      colorA: getColor(c.colorShockB),
      colorB: getColor(c.colorShockA),
      height: 0.03
    });
  }

  /** The smaller second beat: a settling ring, a low thud and a last flare of light. */
  _aftershock() {
    const c = settings[ID];
    const g = settings.global;
    const power = g.explosionIntensity;
    this._aim(_end);
    this.ctx.shake.add(c.aftershockShake * power * g.cameraShake, 3, 12);
    this.lightBoost += c.aftershockLight * power;
    this.ctx.decals.spawn(DecalType.SHOCKWAVE, _end, {
      radius: c.aftershockRadius * power,
      life: c.aftershockLife,
      width: 0.06,
      intensity: 0.55,
      colorA: getColor(c.colorShockB),
      colorB: getColor(c.colorShockA),
      height: 0.03
    });
  }

  onTravel(dt) {
    const c = settings[ID];
    const g = settings.global;
    this._spin += dt * c.spinSpeed * g.animationSpeed;
    this._pose(false, 0);
    this._palette();
    this._shed(dt, 0.35 + 0.65 * this._state.grow);
    if (WHEN === 'travel' || WHEN === 'part' || WHEN === 'late') this._strike(false);
    this._updateMarks(dt);
    this.ctx.shake.rumble(0.035 * c.impactShake * g.cameraShake, dt);
  }

  onImpact() {
    this._beat();
    if (WHEN === 'commit' || WHEN === 'part') this._strike(true);
  }

  onFade(dt, t) {
    const c = settings[ID];
    const g = settings.global;
    const fade = t < 1 ? 1 : 1 - (t - 1);
    this._spin += dt * c.spinSpeed * g.animationSpeed * ${score.twist === 'braid' ? '1.65' : '0.40'};
    this._pose(true, t);
    this._palette();
    this._shed(dt, fade * 0.7);
    if (WHEN === 'return') this._strike(false);
    if (!this._settled && t > c.aftershockAt) {
      this._settled = true;
      this._aftershock();
    }
    if (ECHO && !this._echoed && t > 1.08) {
      this._echoed = true;
      this._echo();
    }
    this._drag(dt, fade);
    this._updateMarks(dt);
  }

  onDestroy() {
    this._releaseMarks();
    for (let i = 0; i < this._carried.length; i++) this._carried[i].release?.();
    this._carried.length = 0;
    this.body.visible = false;
    this.voice.visible = false;
    this.lens.visible = false;
    this.ground.visible = false;
    this.detail.hide();
    this.rig.hide();
  }

  dispose() {
    this.detail.dispose();
    this.rig.dispose();
    this.detailMaterial.dispose();
    this.heroMaterial.dispose();
    this.bodyGeometry.dispose();
    this.voiceGeometry.dispose();
    this.groundGeometry.dispose();
    this.bodyMaterial.dispose();
    this.lensMaterial.dispose();
    this.groundMaterial.dispose();
    this.voiceMaterial.dispose();
    super.dispose();
  }
}

export function buildEditor(gui, c, Editor) {
  const folder = gui.addFolder('${spell.label}');
  const R = Editor.range;

  const cast = folder.addFolder('The cast');
  R(cast, c, 'range', 4, 40, 0.1, 'max range');
  R(cast, c, 'minRange', 0, 12, 0.1, 'min range');
  R(cast, c, 'speed', 2, 60, 0.5, 'travel (m/s)');
  R(cast, c, 'cooldown', 0, 8, 0.05, 'cooldown');
  R(cast, c, 'impactTime', 0.05, 3, 0.01, 'impact (s)');
  R(cast, c, 'fadeTime', 0.05, 4, 0.01, 'fade (s)');
  ${zone ? "R(cast, c, 'zoneRadius', 0.5, 12, 0.05, 'circle (m)');" : ''}
  Editor.castAnimation(cast, c);

  const hand = folder.addFolder('0 · Hand');
  R(hand, c, 'handForward', -0.5, 2, 0.01, 'forward (m)');
  R(hand, c, 'handSide', -1, 1, 0.01, 'side (m)');
  R(hand, c, 'handHeight', 0.2, 2.5, 0.01, 'height (m)');
  R(hand, c, 'handFlare', 0, 3, 0.01, 'flare (m)');
  R(hand, c, 'handSparks', 0, 120, 1, 'sparks');
  R(hand, c, 'handMotes', 0, 80, 1, 'motes');

  const shape = folder.addFolder('1 · Shape — ${score.twist}');
  R(shape, c, 'count', 1, 16, 1, 'count');
  R(shape, c, 'height', 0.2, 10, 0.05, 'height (m)');
  R(shape, c, 'thickness', 0.02, 2, 0.01, 'thickness (m)');
  R(shape, c, 'sweep', 0, 8, 0.05, 'reach');
  R(shape, c, 'lean', 0, 3, 0.01, 'lean');

  const motion = folder.addFolder('2 · Timing');
  R(motion, c, 'spinSpeed', -20, 20, 0.1, 'spin (rad/s)');
  R(motion, c, 'lifetime', 0.1, 5, 0.05, 'hold (s)');

  const look = folder.addFolder('3 · Body');
  R(look, c, 'bodyOpacity', 0, 2, 0.01, 'opacity');
  R(look, c, 'bodyGlow', 0, 4, 0.01, 'body glow');
  R(look, c, 'edgeGlow', 0, 10, 0.05, 'edge glow');
  R(look, c, 'softFade', 0.01, 2, 0.01, 'soft fade (m)');
  R(look, c, 'bodyPulse', 0, 1, 0.01, 'pulse');
  R(look, c, 'bodyPulseRate', 0, 20, 0.1, 'pulse rate');
  R(look, c, 'lensWarp', 0, 3, 0.01, 'lens warp');
  look.addColor(c, 'colorA').name('edge');
  look.addColor(c, 'colorB').name('core');
  look.addColor(c, 'colorC').name('deep');

  const voice = folder.addFolder('4 · Voice');
  R(voice, c, 'voiceOpacity', 0, 2, 0.01, 'opacity');
  voice.addColor(c, 'colorVoiceA').name('voice');
  voice.addColor(c, 'colorVoiceB').name('voice, hot');

  const floor = folder.addFolder('5 · Ground');
  R(floor, c, 'groundWidth', 0.2, 16, 0.05, 'width (m)');
  R(floor, c, 'groundGlow', 0, 6, 0.05, 'glow');
  R(floor, c, 'groundLife', 0.1, 4, 0.05, 'life');
  R(floor, c, 'groundOpacity', 0, 2, 0.01, 'opacity');
  floor.addColor(c, 'colorGroundA').name('ground');
  floor.addColor(c, 'colorGroundB').name('ground, deep');

  const pieces = folder.addFolder('6 · Detail pieces');
  R(pieces, c, 'detailCount', 0, 48, 1, 'count');
  R(pieces, c, 'detailSize', 0.05, 2, 0.01, 'size (m)');
  R(pieces, c, 'detailSizeJitter', 0, 1, 0.01, 'size jitter');
  R(pieces, c, 'detailSpread', 0.1, 2, 0.01, 'spread');
  R(pieces, c, 'detailLift', 0, 8, 0.05, 'lift (m)');
  R(pieces, c, 'detailSpin', -4, 4, 0.05, 'orbit');
  R(pieces, c, 'detailGlow', 0, 6, 0.05, 'rim glow');
  R(pieces, c, 'detailOpacity', 0, 1.5, 0.01, 'opacity');
  R(pieces, c, 'detailSwing', 0, 2.5, 0.01, 'fold');
  R(pieces, c, 'detailEdge', 0, 4, 0.05, 'arris light');
  pieces.addColor(c, 'colorDetailA').name('rim');
  pieces.addColor(c, 'colorDetailB').name('lit');
  pieces.addColor(c, 'colorDetailC').name('shade');

  const hero = folder.addFolder('7 · Hero rig');
  R(hero, c, 'heroSize', 0.2, 8, 0.05, 'size (m)');
  R(hero, c, 'heroReach', 0.1, 1.4, 0.01, 'ring fit');
  R(hero, c, 'heroLift', 0, 8, 0.05, 'travel (m)');
  R(hero, c, 'heroSpin', -4, 4, 0.05, 'turn');
  R(hero, c, 'heroSwing', 0, 2.5, 0.01, 'fold');
  R(hero, c, 'heroGlow', 0, 6, 0.05, 'rim glow');
  R(hero, c, 'heroEdge', 0, 4, 0.05, 'arris light');
  R(hero, c, 'heroOpacity', 0, 1.5, 0.01, 'opacity');
  hero.addColor(c, 'colorHeroA').name('rim');
  hero.addColor(c, 'colorHeroB').name('lit');
  hero.addColor(c, 'colorHeroC').name('shade');

  const parts = folder.addFolder('8 · Shed');
  R(parts, c, 'dustRate', 0, 400, 1, 'dust / s');
  R(parts, c, 'dustSize', 0.02, 2, 0.01, 'dust size');
  R(parts, c, 'dustSpeed', 0, 20, 0.1, 'dust speed');
  R(parts, c, 'dustLife', 0.05, 3, 0.01, 'dust life');
  R(parts, c, 'dustOpacity', 0, 1, 0.01, 'dust opacity');
  Editor.gradient(parts, c, 'colorDust', 'dust colour');
  R(parts, c, 'streakRate', 0, 400, 1, 'shed / s');
  R(parts, c, 'streakSize', 0.005, 0.4, 0.005, 'shed size');
  R(parts, c, 'streakSpeed', 0, 30, 0.1, 'shed speed');
  R(parts, c, 'streakLife', 0.05, 2, 0.01, 'shed life');
  R(parts, c, 'streakStretch', 0, 4, 0.01, 'shed stretch');
  Editor.gradient(parts, c, 'colorStreak', 'shed colour');
  R(parts, c, 'chipRate', 0, 200, 1, 'chips / s');
  R(parts, c, 'chipSize', 0.01, 0.4, 0.005, 'chip size');
  R(parts, c, 'chipSpeed', 0, 20, 0.1, 'chip speed');
  R(parts, c, 'chipLife', 0.05, 3, 0.01, 'chip life');
  Editor.gradient(parts, c, 'colorChip', 'chip colour');

  const motes = folder.addFolder('9 · Motes');
  R(motes, c, 'moteRate', 0, 200, 1, 'motes / s');
  R(motes, c, 'moteSize', 0.01, 0.4, 0.005, 'size');
  R(motes, c, 'moteSpeed', 0, 10, 0.1, 'speed');
  R(motes, c, 'moteLife', 0.1, 4, 0.05, 'life');
  Editor.gradient(motes, c, 'colorMote', 'mote colour');

  const beat = folder.addFolder('10 · The beat');
  R(beat, c, 'impactShake', 0, 2, 0.01, 'camera punch');
  R(beat, c, 'impactFlash', 0, 1, 0.01, 'flash');
  beat.addColor(c, 'colorFlash').name('flash');
  R(beat, c, 'burstRadius', 0, 12, 0.05, 'burst (m)');
  R(beat, c, 'burstLife', 0.05, 3, 0.01, 'burst life');
  beat.addColor(c, 'colorBurstA').name('burst, hot');
  beat.addColor(c, 'colorBurstB').name('burst, body');
  beat.addColor(c, 'colorBurstC').name('burst, deep');
  R(beat, c, 'shockRadius', 0, 16, 0.05, 'decal (m)');
  R(beat, c, 'shockLife', 0.05, 3, 0.01, 'decal life');
  beat.addColor(c, 'colorShockA').name('decal');
  beat.addColor(c, 'colorShockB').name('decal, hot');

  const after = folder.addFolder('11 · Aftershock');
  R(after, c, 'aftershockAt', 1, 1.9, 0.01, 'lands at');
  R(after, c, 'aftershockRadius', 0, 12, 0.05, 'ring (m)');
  R(after, c, 'aftershockShake', 0, 2, 0.01, 'camera punch');
  R(after, c, 'aftershockLight', 0, 40, 0.5, 'light punch');
  R(after, c, 'aftershockLife', 0.05, 3, 0.01, 'ring life');

  const bodies = folder.addFolder('12 · Bodies');
  R(bodies, c, 'hitRadius', 0.1, 12, 0.05, 'reach (m)');
  R(bodies, c, 'hitImpulse', 0, 24, 0.1, 'impulse');
  R(bodies, c, 'hitLift', 0, 20, 0.1, 'lift');
  R(bodies, c, 'hitSpin', 0, 8, 0.05, 'spin');

  const mark = folder.addFolder('13 · Mark — ${MARK[spell.element].verb}');
  R(mark, c, 'markAmount', 0, 1, 0.01, 'stain');
  R(mark, c, 'markTime', 0.02, 3, 0.01, 'sets in (s)');
  R(mark, c, 'markLife', 0, 8, 0.05, 'sheds for (s)');
  R(mark, c, 'markMotes', 0, 120, 1, 'motes / s');
  mark.addColor(c, 'colorMarkBody').name('body');
  mark.addColor(c, 'colorMarkRim').name('rim');
  R(mark, c, 'markRimGlow', 0, 6, 0.05, 'rim glow');
  mark.addColor(c, 'colorMarkEdge').name('edge');
  R(mark, c, 'markEdgeGlow', 0, 8, 0.05, 'edge glow');
  R(mark, c, 'markEdgeWidth', 0, 0.3, 0.005, 'edge width');

  const light = folder.addFolder('Light');
  light.addColor(c, 'lightColor').name('colour');
  R(light, c, 'lightIntensity', 0, 30, 0.1, 'intensity');
  R(light, c, 'lightRadius', 1, 40, 0.1, 'radius');
  R(light, c, 'lightFlicker', 0, 1, 0.01, 'flicker');
  R(light, c, 'impactLight', 0, 40, 0.5, 'light punch');
}
`;
}

/** Every `c.<key>` the generated code reads must exist in the spell's config. */
function checkSettings(spell, config, code) {
  const known = new Set([...config.matchAll(/^\s{4}([A-Za-z0-9]+):/gm)].map((m) => m[1]));
  const read = new Set([...code.matchAll(/\bc\.([A-Za-z0-9]+)/g)].map((m) => m[1]));
  for (const key of read) {
    if (!known.has(key)) throw new Error(`${spell.id}: code reads settings.${key} but the config has no such key`);
  }
  // Gradients are read as `colorDustA..D` and edited as `colorDust`.
  const editor = [...code.matchAll(/Editor\.gradient\([^,]+, c, '([A-Za-z]+)'/g)].map((m) => m[1]);
  for (const base of editor) {
    for (const suffix of ['A', 'B', 'C', 'D']) {
      if (!known.has(base + suffix)) throw new Error(`${spell.id}: gradient ${base}${suffix} missing`);
    }
  }
}

function main() {
  writeFileSync(path.join(abilityDir, 'PureBodyGeometries.js'), geometryModuleSource());
  // RIGS_PARTIAL=1 regenerates only the casts that have a rig yet (authoring aid).
  const partial = process.env.RIGS_PARTIAL === '1';
  const unrigged = missingRigs();
  if (unrigged.length && !partial) throw new Error('no rig for ' + unrigged.join(','));
  const strayRigs = Object.keys(RIGS).filter((id) => !SPELLS.some((s) => s.id === id));
  if (strayRigs.length) throw new Error('rig without spell ' + strayRigs.join(','));
  const missing = SPELLS.filter((s) => !SCORE[s.id]);
  if (missing.length) throw new Error('no score for ' + missing.map((s) => s.id).join(','));
  const extra = Object.keys(SCORE).filter((id) => !SPELLS.some((s) => s.id === id));
  if (extra.length) throw new Error('score without spell ' + extra.join(','));

  const frags = new Map();

  let minAbility = Infinity;
  for (const spell of SPELLS) {
    if (partial && !RIGS[spell.id]) continue;
    const ability = abilitySource(spell);
    const materials = materialsSource(spell);
    const config = configSource(spell);
    const aLines = ability.split('\n').length;
    const mLines = materials.split('\n').length;
    minAbility = Math.min(minAbility, aLines);
    if (aLines < 400) throw new Error(`${spell.id} ability is ${aLines} lines`);
    if ((materials.match(/new ShaderMaterial\(/g) ?? []).length < 4) throw new Error(`${spell.id} shaders`);
    if ((ability.match(/\.addFolder\(/g) ?? []).length < 8) throw new Error(`${spell.id} folders`);
    if (/TenthEngine|TenthMaterials|makeAbility\(/.test(ability)) throw new Error(`${spell.id} wrapper`);
    const frag = (materials.match(/const BODY_FRAGMENT = \/\* glsl \*\/ `([\s\S]*?)`;/) ?? [])[1];
    const vert = (materials.match(/const BODY_VERTEX = \/\* glsl \*\/ `([\s\S]*?)`;/) ?? [])[1];
    if (!frag || !vert) throw new Error(`${spell.id} shader extract failed`);
    const fh = createHash('sha256').update(frag).digest('hex');
    if (frags.has(fh)) throw new Error(`fragment collision ${spell.id} == ${frags.get(fh)}`);
    frags.set(fh, spell.id);
    if (!SCULPTS[spell.id]) throw new Error(`missing body surface ${spell.id}`);
    checkSettings(spell, config, ability + materials);
    writeFileSync(path.join(configDir, `${spell.id}.js`), config);
    writeFileSync(path.join(abilityDir, `${spell.cls}Ability.js`), ability);
    writeFileSync(path.join(materialDir, `${spell.cls}Materials.js`), materials);
    writeFileSync(path.join(assetDir, `${spell.cls}Geometry.js`), rigModuleSource(spell));
  }
  console.log(`sculpted ${SPELLS.length} abilities, shortest ${minAbility} lines, ${frags.size} unique fragments, ${Object.keys(SCULPTS).length} authored body surfaces, ${Object.keys(RIGS).length} rigs`);
}

main();
