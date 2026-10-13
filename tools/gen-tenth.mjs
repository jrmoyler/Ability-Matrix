// Fills every element to 10 castables. Run once: node tools/gen-tenth.mjs
import { writeFileSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const spells = [
  // frost +4
  s('hoarfrost', 'HoarfrostMirror', 'Hoarfrost Mirror', 'frost', 'zone', 'bloom', 4, 2, 'FROST', 'FROST', 'CHIP',
    'Frost — a mirror of rime rises in the circle and throws the cold back out', '#d7f4ff', '#ffffff', '#9fd0ff',
    { blades: 6, thickness: 0.22, lift: 3.4, bodyRadius: 1.1, zoneRadius: 4.4, count: 6, edgeGlow: 5.2 }),
  s('rimehalo', 'RimeHalo', 'Rime Halo', 'frost', 'zone', 'ring', 2, 3, 'FROST', 'FROST', 'SOFT',
    'Frost — a halo of needles walks the rim and freezes whatever it closes on', '#e7fbff', '#b9ecff', '#ffffff',
    { blades: 10, thickness: 0.16, spinSpeed: 14, zoneRadius: 4.6, count: 8, flightHeight: 1.3 }),
  s('whiteout', 'WhiteoutNeedle', 'Whiteout Needle', 'frost', 'line', 'rain', 3, 0, 'FROST', 'AIR', 'CHIP',
    'Frost — a whiteout of needles falls along the line and pins what it reaches', '#f4fbff', '#9ad7ff', '#ffffff',
    { count: 8, accentStyle: 3, braidWidth: 1.6, lift: 4.2, speed: 26, bodyRadius: 0.7 }),
  s('calving', 'GlacierCalving', 'Glacier Calving', 'frost', 'zone', 'geyser', 5, 2, 'FROST', 'EARTH', 'CHIP',
    'Frost — a shelf of glacier calves upward, then breaks into the circle', '#c5e4f5', '#ffffff', '#7eb6d6',
    { lift: 4.8, bodyRadius: 1.35, count: 6, thickness: 0.5, zoneRadius: 5, noiseAmt: 0.55 }),

  // lightning +1
  s('fulgur', 'FulgurCage', 'Fulgur Cage', 'storm', 'zone', 'cage', 7, 1, 'ARC', 'STORM', 'STREAK',
    'Lightning — bars of fulgur drop in a cage and arc inward', '#d6e4ff', '#ffffff', '#8eb6ff',
    { count: 8, lift: 3.6, zoneRadius: 4.4, thickness: 0.2, edgeGlow: 6, spinSpeed: 18, noiseAmt: 0.7 }),

  // water +4
  s('brine', 'BrineGeyser', 'Brine Geyser', 'water', 'zone', 'geyser', 5, 1, 'FOAM', 'WATER', 'DROPLET',
    'Water — a brine column punches up and salts the circle', '#7ecbff', '#e8f7ff', '#2f86c9',
    { lift: 5.2, bodyRadius: 1.15, count: 7, zoneRadius: 4.2, thickness: 0.42 }),
  s('glasstide', 'GlassTide', 'Glass Tide', 'water', 'line', 'whip', 6, 2, 'RIPPLE', 'WATER', 'DROPLET',
    'Water — a glass-hard sheet of tide whips down the line', '#b7e6ff', '#ffffff', '#3d9be0',
    { braidWidth: 1.8, thickness: 0.22, count: 7, speed: 28, curve: 1.4, bodyOpacity: 0.32 }),
  s('undertow', 'UndertowChains', 'Undertow Chains', 'water', 'zone', 'well', 8, 6, 'RIPPLE', 'WATER', 'DROPLET',
    'Water — chains of undertow spiral in and drag the circle down', '#49b4ff', '#d5f1ff', '#0e4e86',
    { count: 7, zoneRadius: 4.8, style: 8, accentStyle: 6, twist: 6, orbit: 1.4 }),
  s('pearltempest', 'PearlTempest', 'Pearl Tempest', 'water', 'line', 'volley', 1, 2, 'FOAM', 'WATER', 'BUBBLE',
    'Water — pearls of compressed tide arc down the line and burst wet', '#e7f8ff', '#9ad8ff', '#ffffff',
    { count: 6, arcHeight: 2.2, spread: 0.7, hub: 0.34, hole: 0.0, bodyRadius: 0.55 }),

  // earth +2
  s('faultchoir', 'FaultChoir', 'Fault Choir', 'earth', 'line', 'lance', 0, 5, 'CRACK', 'EARTH', 'CHIP',
    'Earth — the fault sings a stone lance and splits what it crosses', '#e6c48a', '#fff1d2', '#8a5a32',
    { speed: 20, bodyRadius: 0.95, thickness: 0.48, blades: 3, noiseAmt: 0.65, count: 5 }),
  s('quartzspire', 'QuartzSpire', 'Quartz Spire', 'earth', 'zone', 'bloom', 5, 4, 'CRACK', 'EARTH', 'CHIP',
    'Earth — quartz spires choir up through the circle', '#f3e2ff', '#ffe7bf', '#c9a0ff',
    { count: 7, lift: 4.4, zoneRadius: 4.5, hub: 0.12, thickness: 0.28, edgeGlow: 4.4, blades: 6 }),

  // wind +5
  s('sirennote', 'SirenNote', 'Siren Note', 'wind', 'line', 'lance', 6, 2, 'DUSTRING', 'AIR', 'STREAK',
    'Wind — a single held note cuts the line as a visible sheet of air', '#e9fff8', '#ffffff', '#9af0d8',
    { thickness: 0.18, bodyOpacity: 0.28, speed: 30, count: 4, edgeGlow: 5, curve: 1.8 }),
  s('vortexbell', 'VortexBell', 'Vortex Bell', 'wind', 'zone', 'ring', 2, 9, 'DUSTRING', 'AIR', 'STREAK',
    'Wind — a bell of air rings the circle and throws a vortex off the rim', '#d9fff6', '#ffffff', '#7dffe4',
    { count: 8, spinSpeed: 16, zoneRadius: 4.6, orbit: 1.6, warp: 1.2, warpSwirl: 0.9 }),
  s('shearwall', 'ShearWall', 'Shear Wall', 'wind', 'line', 'whip', 6, 0, 'SHOCKWAVE', 'AIR', 'STREAK',
    'Wind — a wall of shear snaps laterally down the cast', '#f4fffd', '#c8fff2', '#ffffff',
    { braidWidth: 2.2, count: 8, thickness: 0.2, speed: 26, bodyRadius: 0.9 }),
  s('dustmarch', 'DustDevilMarch', 'Dust Devil March', 'wind', 'zone', 'crown', 5, 9, 'DUSTRING', 'EARTH', 'SMOKE',
    'Wind — a march of dust devils crowns the circle and walks it', '#efe6d4', '#fffaf0', '#d7c4a4',
    { count: 6, lift: 3.8, zoneRadius: 5, noiseAmt: 0.8, bodyOpacity: 0.5 }),
  s('harmonic', 'HarmonicReed', 'Harmonic Reed', 'wind', 'zone', 'bloom', 4, 6, 'SHOCKWAVE', 'AIR', 'STREAK',
    'Wind — reeds of harmonic air stand up and ring', '#e7fff8', '#bdf8ea', '#ffffff',
    { blades: 8, count: 7, lift: 3.2, thickness: 0.16, zoneRadius: 4.2, spikes: 10 }),

  // nature +4
  s('briar', 'BriarCathedral', 'Briar Cathedral', 'nature', 'zone', 'bloom', 5, 8, 'DUSTRING', 'EARTH', 'LEAF',
    'Nature — a cathedral of briar rises and closes over the circle', '#8ee07a', '#eaffd8', '#2f7a32',
    { count: 7, lift: 4.6, zoneRadius: 4.8, thickness: 0.3, twist: 5, curve: 1.6 }),
  s('mycelium', 'MyceliumWake', 'Mycelium Wake', 'nature', 'line', 'lance', 0, 4, 'CRACK', 'EARTH', 'SMOKE',
    'Nature — mycelium wakes along the line and fruits where it hits', '#d6ff9a', '#f4ffe4', '#6ea84a',
    { count: 6, bodyRadius: 0.8, noiseAmt: 0.75, speed: 18, thickness: 0.4, blades: 5 }),
  s('thornvolley', 'ThornVolley', 'Thorn Volley', 'nature', 'line', 'volley', 3, 0, 'SHOCKWAVE', 'AIR', 'LEAF',
    'Nature — a volley of thorns arcs and pins', '#b6f29a', '#f3ffe8', '#3d8f3a',
    { count: 7, spread: 0.62, arcHeight: 1.8, accentStyle: 3, bodyRadius: 0.48, taper: 2.2 }),
  s('bloomcrown', 'BloomCrown', 'Bloom Crown', 'nature', 'zone', 'crown', 4, 1, 'DUSTRING', 'AIR', 'LEAF',
    'Nature — a crown of blooms orbits, then slams into seed', '#ffd0ea', '#fff6e8', '#7dffa0',
    { count: 8, lift: 3.5, zoneRadius: 4.4, hub: 0.28, blades: 6, bodyOpacity: 0.5 }),

  // poison +5
  s('acidchoir', 'AcidChoir', 'Acid Choir', 'poison', 'zone', 'ring', 2, 1, 'SHOCKWAVE', 'EARTH', 'BUBBLE',
    'Poison — a choir of acid rings walks outward and eats the stone', '#d6ff4a', '#f4ffd0', '#6a8f12',
    { count: 7, zoneRadius: 4.6, spinSpeed: 10, thickness: 0.2, edgeGlow: 4.5, bodyOpacity: 0.36 }),
  s('bilelance', 'BileLance', 'Bile Lance', 'poison', 'line', 'lance', 0, 1, 'SCORCH', 'EARTH', 'DROPLET',
    'Poison — a lance of bile drills the line', '#c6f25a', '#f6ffcf', '#7aa318',
    { speed: 27, count: 5, bodyRadius: 0.7, thickness: 0.26, edgeGlow: 5, taper: 1.8 }),
  s('sporecoffin', 'SporeCoffin', 'Spore Coffin', 'poison', 'zone', 'cage', 5, 4, 'DUSTRING', 'EARTH', 'SMOKE',
    'Poison — a coffin of spores cages the circle and bursts', '#b6e24a', '#f0ffc2', '#5c7018',
    { count: 8, lift: 3.3, zoneRadius: 4.2, noiseAmt: 0.85, thickness: 0.34 }),
  s('noxioushalo', 'NoxiousHalo', 'Noxious Halo', 'poison', 'zone', 'ring', 2, 7, 'SHOCKWAVE', 'AIR', 'BUBBLE',
    'Poison — a noxious halo tightens, then pops', '#e4ff8a', '#ffffff', '#9ccc2a',
    { count: 8, zoneRadius: 4.5, orbit: 1.2, blades: 12, thickness: 0.12, fringe: 1.2 }),
  s('vitriol', 'VitriolRain', 'Vitriol Rain', 'poison', 'zone', 'deluge', 3, 1, 'SCORCH', 'WATER', 'DROPLET',
    'Poison — vitriol rains inside the circle and pits the ground', '#d2ff55', '#fbffd8', '#88aa22',
    { count: 8, lift: 5, zoneRadius: 4.8, accentStyle: 3, bodyRadius: 0.42 }),

  // light +2
  s('haloguillotine', 'HaloGuillotine', 'Halo Guillotine', 'light', 'line', 'pendulum', 8, 2, 'SHOCKWAVE', 'AIR', 'RING',
    'Light — a halo hinges into a guillotine and swings the line', '#fff4c8', '#ffffff', '#ffd36a',
    { count: 3, braidWidth: 2.4, bodyRadius: 1.35, flightHeight: 1.7, edgeGlow: 6, thickness: 0.16 }),
  s('reliquarydawn', 'ReliquaryDawn', 'Reliquary Dawn', 'light', 'zone', 'bloom', 4, 5, 'SHOCKWAVE', 'AIR', 'SOFT',
    'Light — a reliquary of dawn stands up and washes the circle', '#ffe9a8', '#fffdf4', '#ffb703',
    { count: 7, lift: 4, zoneRadius: 4.6, blades: 8, hub: 0.22, edgeGlow: 5.5, bodyOpacity: 0.4 }),

  // cosmic +5
  s('horizon', 'EventHorizon', 'Event Horizon', 'cosmic', 'zone', 'well', 2, 1, 'SHOCKWAVE', 'AIR', 'RING',
    'Cosmic — an event horizon draws the circle in and shears it', '#c9b6ff', '#ffffff', '#6a4cff',
    { count: 8, zoneRadius: 5, orbit: 1.8, warp: 1.35, warpSwirl: 0.95, thickness: 0.14, edgeGlow: 5 }),
  s('pulsar', 'PulsarLash', 'Pulsar Lash', 'cosmic', 'line', 'whip', 0, 9, 'ARC', 'STORM', 'STREAK',
    'Cosmic — a pulsar lashes the line in a hard whip', '#d8ccff', '#ffffff', '#8a6cff',
    { count: 7, braidWidth: 1.5, speed: 32, spinSpeed: 22, thickness: 0.2, edgeGlow: 6 }),
  s('darkwell', 'DarkMatterWell', 'Dark Matter Well', 'cosmic', 'zone', 'well', 1, 4, 'SHOCKWAVE', 'AIR', 'SOFT',
    'Cosmic — a well of dark matter swallows the circle from the rim', '#1c1030', '#b9a0ff', '#ffffff',
    { count: 7, zoneRadius: 4.8, bodyOpacity: 0.55, noiseAmt: 0.9, hub: 0.4, hole: 0.02, edgeGlow: 3.2 }),
  s('cometharpoon', 'CometHarpoon', 'Comet Harpoon', 'cosmic', 'line', 'lance', 3, 1, 'SCORCH', 'FIRE', 'STREAK',
    'Cosmic — a comet harpoon rides the line and blooms on impact', '#ffe1a8', '#ffffff', '#ff7ad9',
    { speed: 34, count: 5, bodyRadius: 0.62, accentStyle: 1, trailRate: 120, edgeGlow: 5.5 }),
  s('orbitlock', 'OrbitLock', 'Orbit Lock', 'cosmic', 'zone', 'crown', 2, 9, 'SHOCKWAVE', 'AIR', 'RING',
    'Cosmic — orbits lock above the circle, then drop into one ring', '#e7deff', '#ffffff', '#9d86ff',
    { count: 8, lift: 4.2, zoneRadius: 4.6, spinSpeed: 12, blades: 8 }),

  // shadow +4
  s('umbral', 'UmbralGuillotine', 'Umbral Guillotine', 'shadow', 'line', 'pendulum', 8, 0, 'SCORCH', 'AIR', 'SMOKE',
    'Shadow — an umbral blade swings across the line', '#c4b6ff', '#f2ecff', '#3a2a66',
    { count: 3, braidWidth: 2.2, bodyRadius: 1.4, flightHeight: 1.6, bodyOpacity: 0.5, edgeGlow: 4 }),
  s('voidbloom', 'VoidBloom', 'Void Bloom', 'shadow', 'zone', 'well', 1, 4, 'SCORCH', 'AIR', 'SMOKE',
    'Shadow — a void bloom opens and pulls the circle into its throat', '#6a5cff', '#e6e0ff', '#12081c',
    { count: 7, zoneRadius: 4.6, noiseAmt: 0.8, hub: 0.36, bodyOpacity: 0.48, warp: 1.2 }),
  s('shadepuppet', 'ShadePuppets', 'Shade Puppets', 'shadow', 'zone', 'crown', 8, 5, 'DUSTRING', 'AIR', 'SMOKE',
    'Shadow — shade puppets crown the circle and fall inward', '#b7a6ff', '#ffffff', '#2a1848',
    { count: 6, lift: 3.6, zoneRadius: 4.4, thickness: 0.24, twist: 4 }),
  s('eclipseneedle', 'EclipseNeedle', 'Eclipse Needle', 'shadow', 'line', 'lance', 3, 1, 'ARC', 'AIR', 'STREAK',
    'Shadow — an eclipse needle drills the line and leaves a dark wake', '#d9d0ff', '#ffffff', '#5a48aa',
    { speed: 30, count: 4, bodyRadius: 0.55, taper: 2.4, thickness: 0.18, edgeGlow: 5.2 }),

  // blood +6
  s('hemorrhage', 'HemorrhageRing', 'Hemorrhage Ring', 'blood', 'zone', 'ring', 2, 1, 'SCORCH', 'FIRE', 'DROPLET',
    'Blood — a hemorrhage ring races the rim and bursts inward', '#ff4d68', '#ffd0d8', '#6e0018',
    { count: 8, zoneRadius: 4.5, spinSpeed: 14, thickness: 0.18, edgeGlow: 5 }),
  s('clotarmor', 'ClotArmor', 'Clot Armor', 'blood', 'zone', 'cage', 5, 0, 'SCORCH', 'EARTH', 'DROPLET',
    'Blood — clot plates stand up into armor around the circle', '#ff3355', '#ffb3c0', '#4a0012',
    { count: 8, lift: 2.8, zoneRadius: 4.2, thickness: 0.46, noiseAmt: 0.6, bodyOpacity: 0.55 }),
  s('arterial', 'ArterialWhip', 'Arterial Whip', 'blood', 'line', 'whip', 0, 9, 'SCORCH', 'FIRE', 'DROPLET',
    'Blood — an arterial whip cracks down the line', '#ff2a4a', '#ffe4ea', '#8a1024',
    { count: 7, braidWidth: 1.7, speed: 27, thickness: 0.24, edgeGlow: 4.8, curve: 1.5 }),
  s('baptism', 'CrimsonBaptism', 'Crimson Baptism', 'blood', 'zone', 'geyser', 6, 1, 'RIPPLE', 'WATER', 'DROPLET',
    'Blood — a crimson baptism fountains and falls back as rain', '#ff5a72', '#fff0f3', '#a11230',
    { count: 7, lift: 4.8, zoneRadius: 4.4, bodyRadius: 1.05, thickness: 0.3 }),
  s('heartstake', 'Heartstake', 'Heartstake', 'blood', 'line', 'lance', 3, 8, 'SCORCH', 'FIRE', 'DROPLET',
    'Blood — a heartstake flies the line and roots', '#ff2244', '#ffffff', '#ff8aa0',
    { speed: 32, count: 4, bodyRadius: 0.5, taper: 2.6, edgeGlow: 5.5, trailRate: 90 }),
  s('veinlattice', 'VeinLattice', 'Vein Lattice', 'blood', 'zone', 'bloom', 4, 9, 'CRACK', 'EARTH', 'DROPLET',
    'Blood — a lattice of veins climbs out of the circle', '#ff3b58', '#ffd6de', '#6a0016',
    { count: 7, lift: 3.4, zoneRadius: 4.6, blades: 6, twist: 5, thickness: 0.22 }),

  // arcane +4
  s('sigilgate', 'SigilGate', 'Sigil Gate', 'arcane', 'zone', 'bloom', 4, 2, 'ARC', 'STORM', 'SOFT',
    'Arcane — a sigil gate stands and brands the circle', '#c9d2ff', '#ffffff', '#7c8cff',
    { count: 6, lift: 4.2, zoneRadius: 4.4, blades: 6, hub: 0.2, edgeGlow: 5, spikes: 8 }),
  s('prismlie', 'PrismLie', 'Prism Lie', 'arcane', 'line', 'volley', 3, 1, 'SHOCKWAVE', 'AIR', 'SOFT',
    'Arcane — three lying prisms take the same line and disagree', '#d5dbff', '#ffffff', '#ff9ad5',
    { count: 6, spread: 0.8, arcHeight: 1.2, accentStyle: 3, fringe: 1.4, edgeGlow: 4.6 }),
  s('runemeteor', 'RuneMeteor', 'Rune Meteor', 'arcane', 'zone', 'geyser', 1, 4, 'ARC', 'FIRE', 'SOFT',
    'Arcane — a rune meteor drops into the circle and unfolds', '#b7c3ff', '#fff6d8', '#ffffff',
    { count: 6, lift: 5.5, zoneRadius: 4.2, bodyRadius: 1.2, hub: 0.3, noiseAmt: 0.5 }),
  s('mindlattice', 'MindLattice', 'Mind Lattice', 'arcane', 'zone', 'cage', 7, 4, 'ARC', 'STORM', 'STREAK',
    'Arcane — a lattice of thought cages the circle in light', '#dfe4ff', '#ffffff', '#8ea0ff',
    { count: 8, lift: 3.5, zoneRadius: 4.5, thickness: 0.14, edgeGlow: 6, spikes: 12 }),

  // time +4
  s('secondself', 'SecondSelf', 'Second Self', 'time', 'line', 'braid', 8, 2, 'SHOCKWAVE', 'FROST', 'RING',
    'Time — a second self braids down the line a heartbeat late', '#ffe2a8', '#ffffff', '#ffb15a',
    { count: 4, braidWidth: 0.9, braidPitch: 4.2, speed: 18, bodyOpacity: 0.48, fringe: 1.1 }),
  s('rewindsnare', 'RewindSnare', 'Rewind Snare', 'time', 'zone', 'well', 2, 9, 'SHOCKWAVE', 'FROST', 'RING',
    'Time — the circle rewinds inward and snare-locks where it began', '#ffd98a', '#fff8e8', '#ff9a3c',
    { count: 8, zoneRadius: 4.6, orbit: -1.3, thickness: 0.16, spinSpeed: -12 }),
  s('pendulum', 'PendulumCleaver', 'Pendulum Cleaver', 'time', 'line', 'pendulum', 8, 3, 'SHOCKWAVE', 'AIR', 'STREAK',
    'Time — a pendulum cleaves the cast on a slowing swing', '#ffe7b8', '#ffffff', '#e39b3a',
    { count: 3, braidWidth: 2.6, flightHeight: 1.8, bodyRadius: 1.25, orbit: 1.1, edgeGlow: 5 }),
  s('stasisbell', 'StasisBell', 'Stasis Bell', 'time', 'zone', 'ring', 2, 5, 'FROST', 'FROST', 'RING',
    'Time — a stasis bell rings the rim and holds the circle', '#fff0cc', '#ffffff', '#ffc46b',
    { count: 8, zoneRadius: 4.4, spinSpeed: 6, blades: 12, thickness: 0.12, bodyOpacity: 0.34, edgeGlow: 5.4 })
];

function s(id, cls, label, element, cast, motion, style, accent, decal, burst, particle, hint, a, b, c, extra) {
  return { id, cls, label, element, cast, motion, style, accentStyle: accent, decal, burst, particle, hint, colorA: a, colorB: b, colorC: c, extra, glyph: glyph(style, element) };
}

function glyph(style, element) {
  const marks = {
    0: '<path d="M50 14L62 50L50 86L38 50Z"/><path d="M18 50H82"/>',
    1: '<circle cx="50" cy="50" r="14"/><circle cx="50" cy="50" r="28"/>',
    2: '<circle cx="50" cy="50" r="30"/><path d="M50 20V34M50 66V80M20 50H34M66 50H80"/>',
    3: '<path d="M50 8L58 50L50 92L42 50Z"/>',
    4: '<path d="M50 16L74 32V68L50 84L26 68V32Z"/><circle cx="50" cy="50" r="8"/>',
    5: '<path d="M38 86V28L50 14L62 28V86"/><path d="M30 86H70"/>',
    6: '<path d="M12 58C28 40 40 70 54 48C66 32 74 60 88 42"/>',
    7: '<path d="M30 22V78M50 16V84M70 22V78"/><path d="M22 30H78M22 70H78"/>',
    8: '<path d="M28 78C28 40 70 28 78 48C84 64 60 70 50 58"/>',
    9: '<path d="M34 16C54 28 34 40 54 52C34 64 54 76 34 86"/>'
  };
  return marks[style] ?? marks[0];
}

const base = {
  range: 18, minRange: 2, speed: 22, lifetime: 1.5, cooldown: 0.6, castAnim: 'cast2',
  impactTime: 0.85, fadeTime: 1.35,
  lightIntensity: 9, lightRadius: 10, lightFlicker: 0.3, lightPunch: 12,
  count: 6, bodyRadius: 0.9, flightHeight: 1.2,
  blades: 5, taper: 1.35, curve: 1, thickness: 0.34, hole: 0.08, hub: 0.2,
  spikes: 6, twist: 3.2, noiseAmt: 0.45, edgeGlow: 4.2, bodyOpacity: 0.42, fringe: 0.9, rimGlow: 0.85, softFade: 0.35,
  spinSpeed: 9, braidWidth: 1.25, braidPitch: 5, braidLift: 0.4, arcHeight: 1.5, lift: 3.4,
  spread: 0.55, stagger: 0.4, spreadIn: 2.2, orbit: 0.85, warp: 0.9, warpSwirl: 0.65,
  zoneRadius: 4.4,
  decalLife: 1.45, burstScale: 1.15, burstLife: 0.72, burstSquash: 0.5,
  impactShake: 0.5, impactFlash: 0.4,
  trailRate: 80, trailSpeed: 9, trailSize: 0.055, trailLife: 0.38,
  mistRate: 46, mistSize: 0.2, mistLife: 0.85,
  burstCount: 32, debrisSize: 0.14
};

const anim = ['cast1', 'cast2', 'cast3'];
const configDir = path.join(root, 'packs/sandbox/src/config/codex');
const abilityDir = path.join(root, 'packs/sandbox/src/abilities/codex');

const importsCfg = [];
const importsAb = [];
const blocks = [];
const abilities = [];
const elementLines = [];

spells.forEach((spell, index) => {
  const settings = {
    ...base,
    ...spell.extra,
    castAnim: anim[index % 3],
    motion: spell.motion,
    style: spell.style,
    accentStyle: spell.accentStyle,
    decal: spell.decal,
    burst: spell.burst,
    colorA: spell.colorA,
    colorB: spell.colorB,
    colorC: spell.colorC,
    lightColor: spell.colorB
  };
  if (spell.cast !== 'zone') settings.zoneRadius = spell.extra.zoneRadius ?? 0;
  const cfg = `/**
 * ${spell.label} — tenth ${spell.element} castable.
 * Live settings for ${spell.cls}Ability. Plain data, no imports.
 */
export default {
  id: '${spell.id}',
  meta: {
    label: ${JSON.stringify(spell.label)},
    accent: '${spell.colorA}',
    key: '',
    element: '${spell.element}',
    hint: ${JSON.stringify(spell.hint)},
    cast: '${spell.cast}',
    glyph: ${JSON.stringify(spell.glyph)}
  },
  settings: ${JSON.stringify(settings, null, 2).replace(/"([^"]+)":/g, '$1:').replace(/"/g, "'")}
};
`;
  // JSON with single quotes can break on apostrophes in strings. Write real JSON-ish via a safer emit.
  const safe = `/**
 * ${spell.label} — fills ${spell.element} out to ten castables.
 * Data only. ${spell.cls}Ability reads every field live.
 */
export default ${JSON.stringify({
    id: spell.id,
    meta: {
      label: spell.label,
      accent: spell.colorA,
      key: '',
      element: spell.element,
      hint: spell.hint,
      cast: spell.cast,
      glyph: spell.glyph
    },
    settings
  }, null, 2)};
`;
  writeFileSync(path.join(configDir, `${spell.id}.js`), safe);
  const ability = `import spec from '../../config/codex/${spell.id}.js';
import { makeAbility, buildTenthEditor } from './TenthEngine.js';

export const ID = spec.id;
export const ${spell.cls}Ability = makeAbility(spec);
export function buildEditor(gui, c, Editor) {
  buildTenthEditor(gui, c, Editor, spec);
}
`;
  writeFileSync(path.join(abilityDir, `${spell.cls}Ability.js`), ability);
  importsCfg.push(`import ${spell.id} from './${spell.id}.js';`);
  importsAb.push(`import * as ${spell.cls} from './${spell.cls}Ability.js';`);
  blocks.push(spell.id);
  abilities.push(spell.cls);
  elementLines.push(`  'codex/${spell.id}': '${spell.element}',`);
  void cfg;
});

function inject(file, importNeedle, importBlock, arrayNeedle, arrayReplacement) {
  let text = readFileSync(file, 'utf8');
  if (text.includes("from './hoarfrost.js'") || text.includes("from './HoarfrostMirrorAbility.js'")) {
    console.log('already injected', file);
    return;
  }
  if (!text.includes(importNeedle)) throw new Error(`missing import anchor in ${file}`);
  if (!text.includes(arrayNeedle)) throw new Error(`missing array anchor in ${file}`);
  text = text.replace(importNeedle, `${importNeedle}\n${importBlock}`);
  text = text.replace(arrayNeedle, arrayReplacement);
  writeFileSync(file, text);
}

inject(
  path.join(configDir, 'index.js'),
  "import orbital from './orbital.js';",
  importsCfg.join('\n'),
  'const BLOCKS = [solarlash, permafrost, avalanche, maelstrom, riptide, zephyr, downburst, pollen, seedstorm, plague, miasma, nebula, nightfall, wraiths, sanguine, glyphs, hourglass, basalt, seraph, balllightning, railgun, orbital];',
  `const TENTH = [${blocks.join(', ')}];\nconst BLOCKS = [solarlash, permafrost, avalanche, maelstrom, riptide, zephyr, downburst, pollen, seedstorm, plague, miasma, nebula, nightfall, wraiths, sanguine, glyphs, hourglass, basalt, seraph, balllightning, railgun, orbital, ...TENTH];`
);

inject(
  path.join(abilityDir, 'index.js'),
  "import * as OrbitalStrike from './OrbitalStrikeAbility.js';",
  importsAb.join('\n'),
  'export const CODEX_ABILITIES = [\n  SolarLash, PermafrostBloom, AvalancheWake, MaelstromVortex, RiptideLash, ZephyrShuriken, Downburst, PollenNova, SeedstormVolley, PlagueSwarm, MiasmaSpit, NebulaCollapse, NightfallScythe, WraithHost, SanguineTide, GlyphBarrage, HourglassSunder, BasaltColumns, SeraphicDescent, BallLightning, RailgunLance, OrbitalStrike\n]',
  `const TENTH = [${abilities.join(', ')}];\nexport const CODEX_ABILITIES = [\n  SolarLash, PermafrostBloom, AvalancheWake, MaelstromVortex, RiptideLash, ZephyrShuriken, Downburst, PollenNova, SeedstormVolley, PlagueSwarm, MiasmaSpit, NebulaCollapse, NightfallScythe, WraithHost, SanguineTide, GlyphBarrage, HourglassSunder, BasaltColumns, SeraphicDescent, BallLightning, RailgunLance, OrbitalStrike, ...TENTH\n]`
);

let elements = readFileSync(path.join(root, 'packs/sandbox/src/config/elements.js'), 'utf8');
if (!elements.includes("'codex/hoarfrost'")) {
  elements = elements.replace("  'codex/orbital': 'tech'\n};", `  'codex/orbital': 'tech',\n\n  /* ---- tenth of every element still short of ten ---- */\n${elementLines.join('\n')}\n};`);
  writeFileSync(path.join(root, 'packs/sandbox/src/config/elements.js'), elements);
}

console.log('wrote', spells.length, 'spells');
console.log(spells.map((sp) => `${sp.element}/${sp.id}`).join('\n'));
