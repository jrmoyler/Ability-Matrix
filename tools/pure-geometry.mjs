// Authored silhouettes, in the spell's moving local frame. Values are geometric
// offsets, never colour/seed changes. Shared motion still owns gameplay timing.
// Each row: surface description, lateral profile, vertical profile, depth profile.
export const SCULPTS = {
  scarp: ['broken stratified escarpment', '0.2*sin(V*19.0)', 'V*(0.3+0.2*floor(U*7.0))', '0.35*floor(V*5.0)/5.0'],
  sinter: ['terraced mineral lip', '0.3*floor(V*6.0)/6.0', '0.12*floor(U*16.0)+0.25*V', '0.4*V*V'],
  loess: ['eroded hanging scallops', '0.4*sin(V*8.0+U*3.0)', '-0.6*pow(abs(sin(U*15.0)),3.0)*V', '0.2*sin(U*22.0)*V'],
  keystone: ['wedged masonry voussoirs', 'X*(1.0-0.7*V)', '0.3*abs(X)', '0.6*(1.0-abs(X))*V'],
  prismfault: ['trihedral prism bore', 'X*(1.0-abs(Y))', '0.8*abs(X)-0.4', '0.8*(1.0-abs(X)-abs(Y))'],
  geodecage: ['inward crystal teeth', 'X*(1.0-V)', '0.4*abs(sin(U*25.1327))*V', '-1.2*V*V*abs(sin(U*25.1327))'],
  shardchoir: ['sawtooth crystal coronet', '0.25*sin(U*18.8496)', '0.9*(1.0-abs(X))*V', '0.7*abs(sin(U*37.6991))*V'],
  lensewell: ['biconvex lens ribs', '0.3*sin(U*12.5664)*sin(V*3.1416)', '0.6*sin(V*3.1416)', '0.8*sin(V*3.1416)*sin(V*3.1416)'],
  facetvolley: ['diamond projectile fins', 'X*(1.0-abs(Y))', 'Y*(1.0-abs(X))', '0.7*(1.0-abs(X)-abs(Y))'],
  needleglass: ['tapered glass stiletto', 'X*(0.04+0.5*(1.0-V))', '0.12*abs(X)*(1.0-V)', '0.25*(1.0-abs(X))*(1.0-V)'],
  katabatic: ['descending folded wind sail', '0.7*sin(V*6.2832)*(1.0-U)', '-0.5*U*V', '0.5*sin(U*9.4248+V*3.1416)'],
  rotor: ['stacked helical airfoils', '0.8*cos(V*18.8496)', '0.16*sin(U*12.5664)', '0.8*sin(V*18.8496)'],
  venturi: ['pinched nozzle ribs', 'X*(0.3+1.4*Y*Y)', '0.15*cos(U*25.1327)', '-0.8*sin(V*3.1416)'],
  crosscut: ['crescent gust edge', 'X*(0.15+sin(V*3.1416))', '0.2*sin(V*6.2832)', '0.9*sin(V*3.1416)'],
  subtone: ['compression wave discs', 'X*(0.5+0.4*cos(V*25.1327))', 'Y*(0.5+0.4*cos(U*12.5664))', '0.25*sin(V*25.1327)'],
  clangor: ['flared bell ribs', 'X*(0.2+V*V)', '0.25*cos(U*18.8496)*V', '0.8*V*V*V'],
  overtone: ['three harmonic lobes', '0.4*cos(U*18.8496)', '0.5*sin(U*18.8496)+0.2*sin(U*37.6991)', '0.4*sin(U*18.8496)'],
  whisperwell: ['expanding trumpet throat', '0.15*sin(U*31.4159)*V', '0.3*sin(V*6.2832)', '1.1*V*V*V'],
  cadence: ['ribbed beat capsules', 'X*(0.4+0.4*cos(Y*3.1416))', '0.5*sin(V*18.8496)', '0.6*cos(X*1.5708)*cos(Y*1.5708)'],
  glissando: ['rising wave comb', '0.4*sin(V*12.5664+U*6.2832)', '0.6*U*sin(U*25.1327)', '0.3*cos(V*12.5664+U*6.2832)'],
  caustic: ['converging ray wedge', 'X*(0.1+V)', '0.7*abs(X)*V', '0.8*V*(1.0-V)'],
  aureole: ['sunburst serrated rim', '0.15*sin(U*50.2655)', '0.2*sin(U*25.1327)', '0.9*pow(abs(sin(U*50.2655)),6.0)*V'],
  photonwell: ['parabolic photon reflector', '0.25*sin(U*18.8496)*V', '0.8*V*V', '-0.6*V*(1.0-V)'],
  filament: ['forked luminous barbs', 'X*(0.1+0.8*abs(Y))', '0.4*Y', '0.6*abs(X)*abs(Y)'],
  noonblade: ['wide solar scimitar', 'X*(0.05+0.9*sin(V*3.1416))', '0.3*V*V', '1.1*V*V'],
  latticeflare: ['cross ribbed flare lattice', '0.5*sin(V*25.1327)', '0.25*cos(U*25.1327)', '0.5*cos(V*25.1327)'],
  censers: ['bulbous suspended censers', 'X*(0.15+0.8*sin(V*3.1416))', '0.3*cos(V*6.2832)', '0.7*sin(V*3.1416)*cos(X*1.5708)'],
  reliclash: ['interlocked chain folds', '0.65*sin(V*31.4159)', '0.45*cos(V*31.4159)', '0.3*sin(U*6.2832+V*31.4159)'],
  vowcage: ['ogival vaulted bars', 'X*(1.0-0.65*V)', '0.65*(1.0-abs(X))*V', '-0.6*pow(V,4.0)'],
  hymnwell: ['organ pipe fan', '0.3*sin(U*37.6991)', '0.7*abs(sin(U*18.8496))*V', '0.4*V*sin(U*6.2832)'],
  redshift: ['stretched spiral ribbon', '0.7*V*cos(V*12.5664)', '0.7*V*sin(V*12.5664)', '1.2*V*V'],
  magnetar: ['paired magnetic lobes', '0.8*sin(U*6.2832)*sin(V*3.1416)', '0.6*cos(U*6.2832)*sin(V*3.1416)', '0.5*cos(V*6.2832)'],
  zodiac: ['twelve pointed celestial rim', '0.2*cos(U*75.3982)', '0.4*sin(U*12.5664)', '0.8*pow(abs(cos(U*37.6991)),4.0)*V'],
  quarkspire: ['three strand quark helix', '0.65*cos(V*25.1327+U*18.8496)', '0.2*sin(U*18.8496)', '0.65*sin(V*25.1327+U*18.8496)'],
  slingwell: ['eccentric accretion ramp', '0.7*V*sin(U*6.2832)', '0.6*U*V', '0.5*cos(U*6.2832)*V'],
  tidebar: ['bowed tidal buttresses', 'X*(0.3+V)', '-0.5*V*V', '-0.9*sin(V*3.1416)'],
  perigee: ['eccentric low orbit hoop', '0.3*sin(U*6.2832)', '0.65*cos(U*6.2832)', '0.8*cos(U*6.2832)*V'],
  masslance: ['dense oblate ram', 'X*(1.2-0.6*abs(Y))', '0.15*Y', '0.9*(1.0-abs(X))*sin(V*3.1416)'],
  shearorbit: ['sheared asteroid wedges', 'X*(0.8-0.4*Y)', '0.45*Y+0.25*X', '0.6*(1.0-abs(X))*abs(Y)'],
  plumbswing: ['terminal plumb weight', 'X*(0.08+1.2*pow(V,5.0))', '-0.6*pow(V,4.0)', '0.7*pow(V,5.0)*(1.0-abs(X))'],
  penumbra: ['frayed shadow membrane', '0.5*sin(V*9.4248)', '-0.5*V*abs(sin(U*21.9911))', '0.35*sin(U*12.5664+V*9.4248)'],
  duskspire: ['hooked shadow talons', 'X*(1.0-V)', '0.35*sin(U*31.4159)*V', '-1.1*pow(V,3.0)'],
  mournhalo: ['drooping mourning veil', '0.15*cos(U*18.8496)', '-0.9*abs(sin(U*18.8496))*V', '0.35*sin(V*3.1416)'],
  nullwell: ['inverted empty throat', '0.2*sin(U*12.5664)*(1.0-V)', '-0.7*V*V', '-0.9*sin(V*1.5708)'],
  eventcage: ['inward event horizon hooks', 'X*(0.1+pow(1.0-V,2.0))', '-0.4*sin(V*3.1416)', '-1.3*pow(V,4.0)'],
  absence: ['split erasure edge', 'X*(0.2+abs(Y))', '0.25*sin(V*6.2832)', '-0.8*abs(X)*V'],
  hollowvolley: ['hollow implosion cups', '0.6*sin(U*6.2832)*V', '0.6*cos(U*6.2832)*V', '-0.9*V*V'],
  riftpendulum: ['bifurcated rift sickle', 'X*(0.08+V*V)', '0.4*sin(V*3.1416)', '-1.0*sin(V*3.1416)*abs(X)'],
  quietus: ['inverted serrated iris', '0.3*sin(U*43.9823)', '-0.4*V', '-0.9*abs(sin(U*21.9911))*V'],
  unspire: ['reverse corkscrew spires', '0.6*cos(V*31.4159)*(1.0-V)', '-0.2*sin(U*12.5664)', '-0.6*sin(V*31.4159)*(1.0-V)'],
  bindrune: ['angular rune brackets', '0.5*sign(Y)*abs(X)', '0.3*floor(V*4.0)', '0.4*abs(Y)'],
  leywhip: ['zigzag ley ribbon', '0.8*(2.0*abs(fract(V*4.0)-0.5)-0.5)', '0.3*sin(U*12.5664)', '0.4*sin(V*25.1327)'],
  manawell: ['five lobed sigil funnel', '0.3*sin(U*31.4159)*V', '0.45*sin(V*6.2832)', '0.7*cos(U*31.4159)*V'],
  sigilvolley: ['star sigil darts', 'X*(0.3+0.6*abs(sin(V*15.7080)))', 'Y*(0.3+0.6*abs(sin(U*15.7080)))', '0.4*cos(U*31.4159)*sin(V*3.1416)'],
  doppel: ['split mirrored spearhead', '0.7*sign(X)+0.3*X*(1.0-V)', '0.4*Y*(1.0-abs(X))', '0.4*sin(V*6.2832)*sign(X)'],
  falsefloor: ['stepped folding false tiles', '0.3*floor(U*8.0)/8.0', '0.5*floor(V*5.0)/5.0', '0.4*sin(U*25.1327)*sin(V*15.7080)'],
  mirrorhalo: ['pleated mirror polygon', '0.3*abs(sin(U*18.8496))', '0.55*sin(U*18.8496)', '0.45*abs(cos(U*18.8496))*V'],
  feintcage: ['alternating false buttresses', '0.55*sin(U*25.1327)*V', '0.35*cos(U*25.1327)*V', '0.6*sin(V*6.2832)*cos(U*25.1327)'],
  glamour: ['double folded silk sheet', '0.7*sin(V*6.2832+U*12.5664)', '0.3*cos(U*12.5664)', '0.45*cos(V*6.2832+U*12.5664)'],
  afterimage: ['offset echo blade', 'X*(0.15+0.5*sin(V*3.1416))+0.25*sin(V*12.5664)', '0.3*sin(V*9.4248)', '0.65*V*V'],
  latebolt: ['back swept hourglass darts', 'X*(0.2+abs(Y))', 'Y*(0.7-0.4*abs(X))', '-0.7*abs(Y)'],
  chronowell: ['hourglass temporal throat', '0.2*sin(U*75.3982)*V', '0.25*sin(V*12.5664)', '0.9*abs(Y)-0.45'],
  tickcage: ['stepped escapement teeth', 'X*(0.3+0.4*step(0.5,fract(V*6.0)))', '0.4*floor(U*12.0)/12.0', '0.4*step(0.5,fract(V*6.0))'],
  vectorlance: ['arrowhead vector fins', 'X*(1.0-V)', 'Y*(1.0-abs(X))*0.6', '1.2*V'],
  slingvolley: ['spinning sling discs', '0.7*cos(U*6.2832)*sin(V*3.1416)', '0.2*Y', '0.7*sin(U*6.2832)*sin(V*3.1416)'],
  shearstep: ['lateral staircase ribbon', '0.3*floor(V*5.0)', '0.3*floor(U*5.0)/5.0', '0.25*sin(V*31.4159)'],
  orbitpendulum: ['orbital mace crescent', 'X*(0.1+0.9*sin(V*1.5708))', '0.45*cos(V*6.2832)', '0.9*sin(V*3.1416)'],
  kinethalo: ['swept turbine vanes', '0.6*sin(U*31.4159)*V', '0.3*cos(U*31.4159)*V', '0.7*V'],
  presscage: ['opposing piston jaws', 'X*(0.3+0.7*step(0.65,V))', '-0.5*V', '-0.7*step(0.65,V)'],
  surgewell: ['spiral spillway ribs', '0.6*sin(U*6.2832+V*12.5664)*V', '0.25*sin(V*3.1416)', '0.6*cos(U*6.2832+V*12.5664)*V'],
  servopylon: ['telescopic hammer pylons', 'X*(0.3+0.6*step(0.8,V))', '0.25*floor(V*5.0)', '0.7*step(0.8,V)'],
  raster: ['flat raster scan teeth', 'X*(0.4+0.4*step(0.5,fract(V*8.0)))', '0.15*Y', '0.3*floor(U*8.0)/8.0'],
  gimbal: ['articulated gimbal ribbon', '0.65*sin(V*12.5664)', '0.5*cos(V*12.5664)', '0.3*sin(U*6.2832)'],
  hardpoint: ['square hardpoint crenels', '0.35*sign(sin(U*25.1327))', '0.5*step(0.5,fract(U*8.0))*V', '0.7*step(0.5,fract(U*8.0))'],
  impulse: ['radial compression dish', '0.3*sin(U*50.2655)*V', '0.65*V*V', '-0.8*sin(V*3.1416)'],
  tensor: ['cross braced tension struts', '0.6*X*Y', '0.25*abs(X)', '-0.6*abs(Y)'],
  vectorhalo: ['tangential arrow ring', '0.9*V*(1.0-abs(X))', '0.2*sin(U*37.6991)', '0.5*abs(X)*V'],
  shearforce: ['scissor folded force plane', '0.7*Y*sign(X)', '0.4*abs(X)*V', '0.5*X*Y'],
  moment: ['weighted hammer swing', 'X*(0.12+step(0.78,V))', '-0.35*step(0.78,V)', '0.8*step(0.78,V)*(1.0-abs(X))'],
  presslance: ['flattened wedge plough', 'X*(0.4+V)', '0.3*(1.0-V)*(1.0-abs(X))', '0.9*V*abs(X)']
};

export function sculptVertex(spell) {
  const [description] = SCULPTS[spell.id] ?? [];
  if (!description) throw new Error(`Missing geometry for ${spell.id}`);
  // Local coordinates stay independent of animation progress. In particular,
  // a projectile's travel is not substituted for its mesh's longitudinal axis.
  const frame = spell.cast === 'zone'
    ? `vec3 sculptForward = vec3(cos(u*6.2831853+uSpin),0.0,sin(u*6.2831853+uSpin));
    vec3 sculptSide = vec3(-sculptForward.z,0.0,sculptForward.x);`
    : `vec3 sculptForward = uDir;
    vec3 sculptSide = uSide;`;
  return `
    // ${description}
    ${frame}
    float sculptWidth = max(uThickness, 0.08);
    float sculptRise = max(uHeight * 0.22, 0.08) * uGrow;
    p += sculptSide * position.x * sculptWidth;
    p.y += position.y * sculptRise;
    p += sculptForward * position.z * sculptWidth;
`;
}

// Generate ordinary JS, not eval/Function: compatible with a strict CSP.
export function geometryModuleSource() {
  const js = expression => expression.replace(/\b(sin|cos|abs|pow|floor|sign)\(/g, 'Math.$1(');
  const entries = Object.entries(SCULPTS).map(([id, [label, x, y, z]]) =>
    `  // ${label}\n  ${id}: (U, V, X, Y) => [${js(x)}, ${js(y)}, ${js(z)}]`
  ).join(',\n');
  return `// Generated by tools/sculpt-pure.mjs from tools/pure-geometry.mjs.\nimport { BufferGeometry, Float32BufferAttribute } from 'three';
const fract = value => value - Math.floor(value);
const step = (edge, value) => value < edge ? 0 : 1;
export const SPELL_SURFACES = {\n${entries}\n};

/** Each mesh stores its own authored surface in position, and the animation
 * domain in uv. The vertex shader places this surface in the moving spell
 * frame. Body and distortion use the SAME geometry and lifecycle. */
export function createSpellBodyGeometry(id) {
  const surface = SPELL_SURFACES[id];
  if (!surface) throw new Error('Missing spell body geometry: ' + id);
  const columns = 96, rows = 48;
  const positions = [], uvs = [], indices = [];
  for (let j = 0; j <= rows; j++) {
    const v = j / rows;
    for (let i = 0; i <= columns; i++) {
      const u = i / columns;
      positions.push(...surface(u, v, u * 2 - 1, v * 2 - 1));
      uvs.push(u, v);
    }
  }
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < columns; i++) {
      const a = j * (columns + 1) + i, b = a + columns + 1;
      indices.push(a, a + 1, b, a + 1, b + 1, b);
    }
  }
  const geometry = new BufferGeometry();
  geometry.name = id + '-authored-body';
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  // Bounds describe the local sculpt, not shader world placement. Ability
  // meshes deliberately disable frustum culling for shader-placed geometry.
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
  return geometry;
}
`;
}
