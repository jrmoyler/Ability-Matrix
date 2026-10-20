/**
 * The eighty castables that split the combined elements into pure ones.
 * Each entry is a mechanical identity: archetype + variant, not a recolour.
 * `node tools/gen-pure.mjs` turns this table into Codex classes.
 */

/** @typedef {'spire'|'lance'|'well'|'whip'|'cage'|'volley'|'pendulum'|'halo'} Archetype */

export const SPELLS = [
  // earth +4
  spell('scarp', 'ScarpBreak', 'Scarp Break', 'earth', 'zone', 'spire', 0, 'CRACK', 'EARTH', 'CHIP',
    'Earth — a scarp face shears up inside the circle and topples outward', '#e6c48a', '#fff1d2', '#8a5a32'),
  spell('sinter', 'SinterPlate', 'Sinter Plate', 'earth', 'zone', 'halo', 0, 'CRACK', 'EARTH', 'CHIP',
    'Earth — a plate of sinter walks the rim, locks, and stamps the circle flat', '#d7b07a', '#fff6e4', '#6e4a28'),
  spell('loess', 'LoessCurtain', 'Loess Curtain', 'earth', 'line', 'whip', 0, 'DUSTRING', 'EARTH', 'SMOKE',
    'Earth — a curtain of loess snaps sideways and buries the line', '#efe0c4', '#fffaf0', '#a08050'),
  spell('keystone', 'KeystoneDrop', 'Keystone Drop', 'earth', 'zone', 'cage', 1, 'CRACK', 'EARTH', 'CHIP',
    'Earth — keystones drop into a ring and crush inward to one lock', '#c4a574', '#ffe8c4', '#5c3e22'),

  // crystal +6
  spell('prismfault', 'PrismFault', 'Prism Fault', 'crystal', 'line', 'lance', 1, 'FROST', 'FROST', 'CHIP',
    'Crystal — a fault of prism glass drills the line and throws three wakes', '#f3e2ff', '#ffffff', '#c9a0ff'),
  spell('geodecage', 'GeodeCage', 'Geode Cage', 'crystal', 'zone', 'cage', 0, 'FROST', 'EARTH', 'CHIP',
    'Crystal — a geode seals shut and the inner points fire inward', '#e7d4ff', '#fff8e8', '#9b7ad6'),
  spell('shardchoir', 'ShardChoir', 'Shard Choir', 'crystal', 'zone', 'halo', 2, 'SHOCKWAVE', 'AIR', 'CHIP',
    'Crystal — shards choir around the rim, then converge on one note', '#f7ecff', '#ffffff', '#d2b4ff'),
  spell('lensewell', 'LensWell', 'Lens Well', 'crystal', 'zone', 'well', 1, 'FROST', 'AIR', 'SOFT',
    'Crystal — a lens in the floor drinks the circle, then fires a column of glare', '#efe4ff', '#fffdf8', '#b9a0ff'),
  spell('facetvolley', 'FacetVolley', 'Facet Volley', 'crystal', 'line', 'volley', 0, 'FROST', 'AIR', 'CHIP',
    'Crystal — faceted seeds arc down the line and plant where they strike', '#f4e8ff', '#ffffff', '#c8b0ff'),
  spell('needleglass', 'NeedleGlass', 'Needle Glass', 'crystal', 'line', 'pendulum', 0, 'SHOCKWAVE', 'AIR', 'CHIP',
    'Crystal — a needle of glass swings across the cast and shatters on the far side', '#f8f0ff', '#ffffff', '#e0d0ff'),

  // wind +4
  spell('katabatic', 'KatabaticSheet', 'Katabatic Sheet', 'wind', 'line', 'whip', 1, 'DUSTRING', 'AIR', 'STREAK',
    'Wind — a katabatic sheet slides downhill along the line and shears sideways', '#e9fff8', '#ffffff', '#9af0d8'),
  spell('rotor', 'RotorStack', 'Rotor Stack', 'wind', 'zone', 'spire', 2, 'DUSTRING', 'AIR', 'STREAK',
    'Wind — a stack of rotors stands in the circle and throws what it catches', '#d9fff6', '#ffffff', '#7dffe4'),
  spell('venturi', 'VenturiGate', 'Venturi Gate', 'wind', 'zone', 'cage', 0, 'SHOCKWAVE', 'AIR', 'STREAK',
    'Wind — a venturi of air bars squeezes the circle, then coughs it out', '#f4fffd', '#c8fff2', '#ffffff'),
  spell('crosscut', 'CrosscutGust', 'Crosscut Gust', 'wind', 'line', 'pendulum', 1, 'DUSTRING', 'AIR', 'STREAK',
    'Wind — a gust hinged at the hand cuts across the cast', '#e7fff8', '#ffffff', '#bdf8ea'),

  // sound +6
  spell('subtone', 'SubtoneLance', 'Subtone Lance', 'sound', 'line', 'lance', 0, 'SHOCKWAVE', 'AIR', 'RING',
    'Sound — a held subtone drills the line as a visible bore', '#f3ffe0', '#ffffff', '#d6f5a2'),
  spell('clangor', 'ClangorCage', 'Clangor Cage', 'sound', 'zone', 'cage', 2, 'SHOCKWAVE', 'AIR', 'RING',
    'Sound — bars of clangor drop and ring the circle inward', '#e8ffc4', '#ffffff', '#b6e07a'),
  spell('overtone', 'OvertoneHalo', 'Overtone Halo', 'sound', 'zone', 'halo', 2, 'SHOCKWAVE', 'AIR', 'RING',
    'Sound — overtones walk the rim and collapse onto the fundamental', '#f7ffd8', '#ffffff', '#e4ff9a'),
  spell('whisperwell', 'WhisperWell', 'Whisper Well', 'sound', 'zone', 'well', 0, 'DUSTRING', 'AIR', 'SOFT',
    'Sound — a well of whisper inhales the circle, then shouts straight up', '#fbffe8', '#ffffff', '#d0eea0'),
  spell('cadence', 'CadenceVolley', 'Cadence Volley', 'sound', 'line', 'volley', 1, 'SHOCKWAVE', 'AIR', 'RING',
    'Sound — beats arc down the line and detonate on the downbeat', '#eaffc8', '#ffffff', '#c6f07a'),
  spell('glissando', 'GlissandoSweep', 'Glissando Sweep', 'sound', 'line', 'whip', 2, 'SHOCKWAVE', 'AIR', 'STREAK',
    'Sound — a glissando sheet slides sideways and arrives late', '#f4ffd4', '#ffffff', '#e8ffa8'),

  // light +6
  spell('caustic', 'CausticLance', 'Caustic Lance', 'light', 'line', 'lance', 2, 'SHOCKWAVE', 'AIR', 'SOFT',
    'Light — a caustic lance boils the line and leaves a bright scar', '#fff4c8', '#ffffff', '#ffd36a'),
  spell('aureole', 'AureoleRing', 'Aureole Ring', 'light', 'zone', 'halo', 0, 'SHOCKWAVE', 'AIR', 'SOFT',
    'Light — an aureole tightens on the circle and flares when it meets', '#ffe9a8', '#fffdf4', '#ffb703'),
  spell('photonwell', 'PhotonWell', 'Photon Well', 'light', 'zone', 'well', 2, 'ARC', 'STORM', 'SOFT',
    'Light — photons drain into a point, then the point gives them back', '#fff6d0', '#ffffff', '#ffe08a'),
  spell('filament', 'FilamentVolley', 'Filament Volley', 'light', 'line', 'volley', 2, 'ARC', 'STORM', 'STREAK',
    'Light — filaments arc and stitch whatever they land on', '#fff8dc', '#ffffff', '#ffd98a'),
  spell('noonblade', 'NoonBlade', 'Noon Blade', 'light', 'line', 'pendulum', 2, 'SHOCKWAVE', 'AIR', 'STREAK',
    'Light — a blade of noon swings flat and cuts on the return', '#fff1b8', '#ffffff', '#ffc44d'),
  spell('latticeflare', 'LatticeFlare', 'Lattice Flare', 'light', 'zone', 'spire', 0, 'SHOCKWAVE', 'AIR', 'SOFT',
    'Light — a lattice of flares stands up and blooms outward', '#fff7d2', '#ffffff', '#ffe7a0'),

  // holy +4
  spell('censers', 'CenserMarch', 'Censer March', 'holy', 'zone', 'spire', 1, 'DUSTRING', 'AIR', 'SOFT',
    'Holy — censers rise in a ring, swing once, and slam their smoke inward', '#fff6d0', '#ffffff', '#ffe08a'),
  spell('reliclash', 'RelicLash', 'Relic Lash', 'holy', 'line', 'whip', 0, 'SHOCKWAVE', 'AIR', 'STREAK',
    'Holy — a relic chain lashes the line and brands what it crosses', '#fff1c4', '#fffdf6', '#ffd36a'),
  spell('vowcage', 'VowCage', 'Vow Cage', 'holy', 'zone', 'cage', 1, 'SHOCKWAVE', 'AIR', 'RING',
    'Holy — vows lock as bars and hold the circle until they break outward', '#fff8dc', '#ffffff', '#ffe9a8'),
  spell('hymnwell', 'HymnWell', 'Hymn Well', 'holy', 'zone', 'well', 0, 'SHOCKWAVE', 'AIR', 'SOFT',
    'Holy — a hymn inhales the circle and lifts what it judges', '#fff4c2', '#ffffff', '#ffcc66'),

  // cosmic +4
  spell('redshift', 'RedshiftLance', 'Redshift Lance', 'cosmic', 'line', 'lance', 0, 'ARC', 'STORM', 'STREAK',
    'Cosmic — a lance stretches down the line and redshifts as it goes', '#d8ccff', '#ffffff', '#8a6cff'),
  spell('magnetar', 'MagnetarVolley', 'Magnetar Volley', 'cosmic', 'line', 'volley', 2, 'ARC', 'STORM', 'STREAK',
    'Cosmic — magnetar seeds arc, then burst into paired flares', '#e7deff', '#ffffff', '#ff9ad9'),
  spell('zodiac', 'ZodiacHalo', 'Zodiac Halo', 'cosmic', 'zone', 'halo', 1, 'SHOCKWAVE', 'AIR', 'RING',
    'Cosmic — a zodiac ring locks overhead and drops onto the rim', '#c9b6ff', '#ffffff', '#6a4cff'),
  spell('quarkspire', 'QuarkSpire', 'Quark Spire', 'cosmic', 'zone', 'spire', 2, 'ARC', 'STORM', 'SOFT',
    'Cosmic — quark columns braid up and throw the circle off their spin', '#d4c6ff', '#ffffff', '#b49cff'),

  // gravity +6
  spell('slingwell', 'SlingWell', 'Sling Well', 'gravity', 'zone', 'well', 2, 'CRACK', 'EARTH', 'CHIP',
    'Gravity — mass falls into the well, then is slung out along the floor', '#d9cfc2', '#fff6ea', '#8a7560'),
  spell('tidebar', 'TideBars', 'Tide Bars', 'gravity', 'zone', 'cage', 0, 'CRACK', 'EARTH', 'CHIP',
    'Gravity — tide bars tilt inward and pin the circle to the floor', '#cbbba8', '#fff1e0', '#6e5844'),
  spell('perigee', 'PerigeeHalo', 'Perigee Halo', 'gravity', 'zone', 'halo', 0, 'SHOCKWAVE', 'EARTH', 'RING',
    'Gravity — a perigee ring dips, scrapes the rim, and tightens', '#e4d8cc', '#ffffff', '#a89078'),
  spell('masslance', 'MassLance', 'Mass Lance', 'gravity', 'line', 'lance', 1, 'CRACK', 'EARTH', 'CHIP',
    'Gravity — a dense lance pins the line and drags it forward', '#d7c6b2', '#fff8ee', '#7a624c'),
  spell('shearorbit', 'ShearOrbit', 'Shear Orbit', 'gravity', 'line', 'volley', 1, 'CRACK', 'EARTH', 'CHIP',
    'Gravity — orbiting masses shear off the line and crater where they fall', '#e8dcc8', '#ffffff', '#b89a78'),
  spell('plumbswing', 'PlumbSwing', 'Plumb Swing', 'gravity', 'line', 'pendulum', 0, 'CRACK', 'EARTH', 'CHIP',
    'Gravity — a plumb weight swings across the cast and craters the far side', '#d2c2ae', '#fff4e6', '#6a5340'),

  // shadow +3
  spell('penumbra', 'PenumbraSheet', 'Penumbra Sheet', 'shadow', 'line', 'whip', 1, 'SCORCH', 'AIR', 'SMOKE',
    'Shadow — a penumbra sheet slides across the line and leaves a dark wake', '#c4b6ff', '#f2ecff', '#3a2a66'),
  spell('duskspire', 'DuskSpire', 'Dusk Spire', 'shadow', 'zone', 'spire', 1, 'SCORCH', 'AIR', 'SMOKE',
    'Shadow — dusk columns drink the circle inward as they rise', '#b7a6ff', '#ffffff', '#2a1848'),
  spell('mournhalo', 'MournHalo', 'Mourn Halo', 'shadow', 'zone', 'halo', 0, 'SCORCH', 'AIR', 'SMOKE',
    'Shadow — a mourning ring tightens and snuffs the rim', '#d0c4ff', '#f6f2ff', '#4a386e'),

  // void +7
  spell('nullwell', 'NullWell', 'Null Well', 'void', 'zone', 'well', 1, 'SCORCH', 'AIR', 'SMOKE',
    'Void — a null point drinks the circle and does not give it back', '#6a5cff', '#e6e0ff', '#12081c'),
  spell('eventcage', 'EventCage', 'Event Cage', 'void', 'zone', 'cage', 0, 'SCORCH', 'AIR', 'RING',
    'Void — event bars drop and erase inward toward a missing centre', '#7a6cff', '#f0ecff', '#1a1028'),
  spell('absence', 'AbsenceLance', 'Absence Lance', 'void', 'line', 'lance', 2, 'SCORCH', 'AIR', 'STREAK',
    'Void — a lance of absence unmakes the line as it passes', '#9a90e0', '#ffffff', '#2c2048'),
  spell('hollowvolley', 'HollowVolley', 'Hollow Volley', 'void', 'line', 'volley', 0, 'SCORCH', 'AIR', 'SOFT',
    'Void — hollow seeds arc and implode where they land', '#8a7fd0', '#f4f0ff', '#241838'),
  spell('riftpendulum', 'RiftPendulum', 'Rift Pendulum', 'void', 'line', 'pendulum', 2, 'SCORCH', 'AIR', 'SMOKE',
    'Void — a rift swings across the cast and hangs open a beat', '#b0a4e8', '#ffffff', '#3a2858'),
  spell('quietus', 'QuietusHalo', 'Quietus Halo', 'void', 'zone', 'halo', 1, 'SHOCKWAVE', 'AIR', 'RING',
    'Void — a quiet ring expands, then snaps the rim out of the world', '#c8c0f0', '#ffffff', '#4a3c78'),
  spell('unspire', 'Unspire', 'Unspire', 'void', 'zone', 'spire', 2, 'SCORCH', 'AIR', 'SMOKE',
    'Void — columns of un-matter rise and throw the circle off their spin', '#5c508c', '#ddd6ff', '#0e0816'),

  // arcane +4
  spell('bindrune', 'BindRune', 'Bind Rune', 'arcane', 'zone', 'cage', 1, 'ARC', 'STORM', 'SOFT',
    'Arcane — runes stand as bars, hold, then break outward in a brand', '#c9d2ff', '#ffffff', '#7c8cff'),
  spell('leywhip', 'LeyWhip', 'Ley Whip', 'arcane', 'line', 'whip', 2, 'ARC', 'STORM', 'STREAK',
    'Arcane — a ley line cracks sideways off the cast', '#d5dbff', '#ffffff', '#9aa6ff'),
  spell('manawell', 'ManaWell', 'Mana Well', 'arcane', 'zone', 'well', 2, 'ARC', 'STORM', 'SOFT',
    'Arcane — mana drains to a sigil and refluxes as a column', '#b7c3ff', '#fff6d8', '#ffffff'),
  spell('sigilvolley', 'SigilVolley', 'Sigil Volley', 'arcane', 'line', 'volley', 0, 'ARC', 'STORM', 'SOFT',
    'Arcane — sigils arc down the line and brand on impact', '#dfe4ff', '#ffffff', '#8ea0ff'),

  // illusion +6
  spell('doppel', 'DoppelLance', 'Doppel Lance', 'illusion', 'line', 'lance', 1, 'SHOCKWAVE', 'AIR', 'SOFT',
    'Illusion — the lance you see is late; the cut is a body-width to the side', '#ffd0ea', '#ffffff', '#ff9ad5'),
  spell('falsefloor', 'FalseFloor', 'False Floor', 'illusion', 'zone', 'well', 0, 'DUSTRING', 'AIR', 'SOFT',
    'Illusion — the floor agrees to be solid, then drops the circle', '#ffd6ef', '#fff6fb', '#e090c8'),
  spell('mirrorhalo', 'MirrorHalo', 'Mirror Halo', 'illusion', 'zone', 'halo', 2, 'SHOCKWAVE', 'AIR', 'RING',
    'Illusion — three mirror rings walk the rim and disagree about where it is', '#ffe0f4', '#ffffff', '#ffb0e0'),
  spell('feintcage', 'FeintCage', 'Feint Cage', 'illusion', 'zone', 'cage', 2, 'SHOCKWAVE', 'AIR', 'SOFT',
    'Illusion — a cage and its feint spin opposite ways, and only one of them cuts', '#ffc6e6', '#ffffff', '#ff8ec8'),
  spell('glamour', 'GlamourSweep', 'Glamour Sweep', 'illusion', 'line', 'whip', 1, 'SHOCKWAVE', 'AIR', 'SOFT',
    'Illusion — a glamour sheet shows the cut early and lands it late', '#ffe8f6', '#ffffff', '#ffd0ea'),
  spell('afterimage', 'AfterimageSwing', 'Afterimage Swing', 'illusion', 'line', 'pendulum', 1, 'SHOCKWAVE', 'AIR', 'STREAK',
    'Illusion — the swing is the decoy; the blade arrives on the way back', '#ffd4ee', '#ffffff', '#ff9ad0'),

  // time +3
  spell('latebolt', 'LateBolt', 'Late Bolt', 'time', 'line', 'volley', 2, 'FROST', 'FROST', 'RING',
    'Time — bolts leave late and arrive in reverse order', '#ffe2a8', '#ffffff', '#ffb15a'),
  spell('chronowell', 'ChronoWell', 'Chrono Well', 'time', 'zone', 'well', 1, 'FROST', 'FROST', 'RING',
    'Time — the circle ages inward, then the centre is a second younger', '#ffd98a', '#fff8e8', '#ff9a3c'),
  spell('tickcage', 'TickCage', 'Tick Cage', 'time', 'zone', 'cage', 0, 'SHOCKWAVE', 'FROST', 'RING',
    'Time — bars tick closed on a clock and lock when the hand meets itself', '#fff0cc', '#ffffff', '#ffc46b'),

  // motion +7
  spell('vectorlance', 'VectorLance', 'Vector Lance', 'motion', 'line', 'lance', 0, 'DUSTRING', 'AIR', 'STREAK',
    'Motion — a pure velocity vector pins the line and keeps its speed', '#ffd0b0', '#fff6ee', '#ff9a62'),
  spell('slingvolley', 'SlingVolley', 'Sling Volley', 'motion', 'line', 'volley', 0, 'DUSTRING', 'AIR', 'CHIP',
    'Motion — stones leave on flat slings and arrive still spinning', '#ffc49a', '#fff1e4', '#e07a40'),
  spell('shearstep', 'ShearStep', 'Shear Step', 'motion', 'line', 'whip', 0, 'SHOCKWAVE', 'AIR', 'STREAK',
    'Motion — the line steps sideways; what was on it is not', '#ffe0cc', '#ffffff', '#ffb088'),
  spell('orbitpendulum', 'OrbitPendulum', 'Orbit Pendulum', 'motion', 'line', 'pendulum', 2, 'DUSTRING', 'AIR', 'STREAK',
    'Motion — a mass on a tether orbits the cast and releases at the far end', '#ffd8bc', '#ffffff', '#ff9966'),
  spell('kinethalo', 'KineticHalo', 'Kinetic Halo', 'motion', 'zone', 'halo', 2, 'SHOCKWAVE', 'AIR', 'RING',
    'Motion — a ring of stored momentum orbits, then dumps it tangent', '#ffe6d4', '#ffffff', '#ffc4a0'),
  spell('presscage', 'PressCage', 'Press Cage', 'motion', 'zone', 'cage', 1, 'SHOCKWAVE', 'EARTH', 'CHIP',
    'Motion — momentum bars squeeze the circle and spit it upward', '#ffc8a4', '#fff4ea', '#d86a30'),
  spell('surgewell', 'SurgeWell', 'Surge Well', 'motion', 'zone', 'well', 2, 'DUSTRING', 'AIR', 'STREAK',
    'Motion — the circle is poured into a point and released as a surge', '#ffd8c0', '#ffffff', '#ffb080'),

  // tech +4
  spell('servopylon', 'ServoPylon', 'Servo Pylon', 'tech', 'zone', 'spire', 0, 'ARC', 'STORM', 'CHIP',
    'Tech — servo pylons stamp up in a ring and hammer outward', '#bffaff', '#ffffff', '#5ad6e8'),
  spell('raster', 'RasterLance', 'Raster Lance', 'tech', 'line', 'lance', 2, 'ARC', 'STORM', 'STREAK',
    'Tech — a raster scan burns the line one row at a time', '#d6fbff', '#ffffff', '#7ff0ff'),
  spell('gimbal', 'GimbalWhip', 'Gimbal Whip', 'tech', 'line', 'whip', 2, 'SHOCKWAVE', 'AIR', 'STREAK',
    'Tech — a gimballed cutter yaws across the cast and keeps the edge', '#c8f6ff', '#ffffff', '#8ae8ff'),
  spell('hardpoint', 'HardpointHalo', 'Hardpoint Halo', 'tech', 'zone', 'halo', 1, 'ARC', 'STORM', 'RING',
    'Tech — hardpoints lock into a ring, then fire outward together', '#e4fcff', '#ffffff', '#67d8ea'),

  // force +6
  spell('impulse', 'ImpulseWell', 'Impulse Well', 'force', 'zone', 'well', 2, 'SHOCKWAVE', 'EARTH', 'STREAK',
    'Force — impulse collects at the centre and dumps along the floor', '#ffe0c2', '#fff8f0', '#ffb068'),
  spell('tensor', 'TensorCage', 'Tensor Cage', 'force', 'zone', 'cage', 0, 'SHOCKWAVE', 'EARTH', 'STREAK',
    'Force — tensor bars close and hold a pressure the circle cannot leave', '#ffd2a8', '#ffffff', '#e89048'),
  spell('vectorhalo', 'VectorHalo', 'Vector Halo', 'force', 'zone', 'halo', 2, 'SHOCKWAVE', 'AIR', 'STREAK',
    'Force — vectors ring the rim and release tangent when the ring locks', '#ffe8d2', '#ffffff', '#ffc090'),
  spell('shearforce', 'ShearForce', 'Shear Force', 'force', 'line', 'whip', 1, 'SHOCKWAVE', 'AIR', 'STREAK',
    'Force — a pure shear travels the line and parts it sideways', '#ffd8b4', '#fff6ee', '#ffaa66'),
  spell('moment', 'MomentSwing', 'Moment Swing', 'force', 'line', 'pendulum', 1, 'SHOCKWAVE', 'EARTH', 'CHIP',
    'Force — a moment arm swings and delivers its load at the stop', '#ffe4cc', '#ffffff', '#ffb880'),
  spell('presslance', 'PressLance', 'Press Lance', 'force', 'line', 'lance', 0, 'CRACK', 'EARTH', 'CHIP',
    'Force — a travelling press flattens the line as it advances', '#ffc898', '#fff1e4', '#d87830')
];

function spell(id, cls, label, element, cast, archetype, variant, decal, burst, particle, hint, a, b, c) {
  return {
    id, cls, label, element, cast, archetype, variant, decal, burst, particle, hint,
    colorA: a, colorB: b, colorC: c,
    glyph: glyph(archetype, variant)
  };
}

function glyph(archetype, variant) {
  const marks = {
    spire: '<path d="M32 86V40L40 28V86"/><path d="M46 86V22L54 12L62 22V86"/><path d="M68 86V40L76 30V86"/><path d="M18 86H82"/>',
    lance: '<path d="M14 50H70"/><path d="M62 38L86 50L62 62"/><path d="M22 40V60"/>',
    well: '<circle cx="50" cy="54" r="22"/><path d="M50 54V18"/><path d="M40 28L50 16L60 28"/>',
    whip: '<path d="M16 62C30 28 48 78 64 36C74 18 80 48 88 30"/>',
    cage: '<path d="M28 22V78M40 16V84M50 12V88M60 16V84M72 22V78"/><path d="M22 28H78M22 72H78"/>',
    volley: '<path d="M18 70Q34 30 50 70"/><path d="M34 70Q50 24 66 70"/><path d="M50 70Q66 30 82 70"/>',
    pendulum: '<path d="M50 16V28"/><path d="M18 78L50 28L82 70"/><circle cx="50" cy="18" r="5"/>',
    halo: '<circle cx="50" cy="50" r="28"/><circle cx="50" cy="50" r="10"/><path d="M50 8V18M50 82V92M8 50H18M82 50H92"/>'
  };
  const extra = variant === 1 ? '<path d="M30 50H70"/>' : variant === 2 ? '<path d="M36 36L64 64M64 36L36 64"/>' : '';
  return (marks[archetype] ?? marks.lance) + extra;
}

/** Combined-group uids that move onto a pure element. Codex metas are updated to match. */
export const REASSIGN = {
  'casting/amethyst': 'crystal',
  'matrix-new/geode': 'crystal',
  'matrix-new/crystallineheart': 'crystal',
  'codex/quartzspire': 'crystal',
  'collective/sonic': 'sound',
  'codex/sirennote': 'sound',
  'codex/vortexbell': 'sound',
  'codex/harmonic': 'sound',
  'linear-extended/rend': 'holy',
  'casting/chains': 'holy',
  'atlas/sanctuary': 'holy',
  'codex/seraph': 'holy',
  'codex/haloguillotine': 'holy',
  'codex/reliquarydawn': 'holy',
  'collective/graviton': 'gravity',
  'codex/horizon': 'gravity',
  'codex/darkwell': 'gravity',
  'codex/orbitlock': 'gravity',
  'handcast/voidslash': 'void',
  'matrix-new/voidstep': 'void',
  'codex/voidbloom': 'void',
  'matrix-new/mirage': 'illusion',
  'atlas/echoes': 'illusion',
  'codex/prismlie': 'illusion',
  'codex/mindlattice': 'illusion',
  'collective/blink': 'motion',
  'atlas/parallax': 'motion',
  'codex/pendulum': 'motion',
  'collective/aegis': 'force',
  'atlas/polarity': 'force',
  'atlas/chakram': 'force',
  'atlas/reversal': 'force'
};

export const PURE_GROUPS = [
  { id: 'fire', label: 'Fire', accent: '#ff7a3d' },
  { id: 'frost', label: 'Frost', accent: '#9fe0ff' },
  { id: 'storm', label: 'Lightning', accent: '#8fb8ff' },
  { id: 'water', label: 'Water', accent: '#3fa9ff' },
  { id: 'earth', label: 'Earth', accent: '#d7a062' },
  { id: 'crystal', label: 'Crystal', accent: '#e7d4ff' },
  { id: 'wind', label: 'Wind', accent: '#cfeee6' },
  { id: 'sound', label: 'Sound', accent: '#f3ffe0' },
  { id: 'nature', label: 'Nature', accent: '#7fdc6a' },
  { id: 'poison', label: 'Poison', accent: '#a8f04a' },
  { id: 'light', label: 'Light', accent: '#ffe39a' },
  { id: 'holy', label: 'Holy', accent: '#fff6d0' },
  { id: 'cosmic', label: 'Cosmic', accent: '#b48cff' },
  { id: 'gravity', label: 'Gravity', accent: '#d9cfc2' },
  { id: 'shadow', label: 'Shadow', accent: '#8a6cff' },
  { id: 'void', label: 'Void', accent: '#6a5cff' },
  { id: 'blood', label: 'Blood', accent: '#ff3a55' },
  { id: 'arcane', label: 'Arcane', accent: '#7c8cff' },
  { id: 'illusion', label: 'Illusion', accent: '#ff9ad8' },
  { id: 'time', label: 'Time', accent: '#ffd38a' },
  { id: 'motion', label: 'Motion', accent: '#ffb088' },
  { id: 'tech', label: 'Tech', accent: '#7ff0ff' },
  { id: 'force', label: 'Force', accent: '#ffd1a3' }
];
