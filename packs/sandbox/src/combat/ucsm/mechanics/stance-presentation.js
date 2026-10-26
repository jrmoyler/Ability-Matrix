import { AdditiveBlending, BufferGeometry, CatmullRomCurve3, DoubleSide, Float32BufferAttribute, IcosahedronGeometry, MeshBasicMaterial, TorusGeometry, TubeGeometry, Vector3 } from 'three';

const TAU = Math.PI * 2;
const ELEMENT_MATERIAL = { fire: 'stanceFire', frost: 'stanceFrost', storm: 'stanceStorm', water: 'stanceWater', earth: 'stanceEarth', force: 'stanceForce' };

/** Two individually sculpted sheets: a curling flame and a flowing water ribbon. */
function sheet(style) {
  const positions = [], indices = [], rows = 16, columns = 4;
  for (let y = 0; y <= rows; y++) for (let x = 0; x <= columns; x++) {
    const t = y / rows, u = x / columns * 2 - 1;
    const width = style === 'flame' ? (0.42 * (1 - t) + 0.015) : 0.24 + 0.07 * Math.sin(t * Math.PI);
    const bend = style === 'flame' ? 0.28 * Math.sin(t * 5) * t : 0.22 * Math.sin(t * Math.PI * 2);
    positions.push(u * width + bend, t * 2, style === 'flame' ? 0.16 * Math.sin(t * 4) * (1 - Math.abs(u)) : 0.18 * Math.sin(t * 8 + u));
    if (y < rows && x < columns) { const n = y * (columns + 1) + x; indices.push(n, n + columns + 1, n + 1, n + 1, n + columns + 1, n + columns + 2); }
  }
  const g = new BufferGeometry();
  g.setAttribute('position', new Float32BufferAttribute(positions, 3)); g.setIndex(indices); g.computeVertexNormals();
  return g;
}

/** Shared per-view assets: no per-cast geometry or materials to leak. */
export function initStanceResources(view) {
  const addGeo = (name, value) => { view.geo[name] = value; view.resources.push(value); };
  const addMat = (name, color, opacity) => {
    const material = new MeshBasicMaterial({ color, transparent: true, opacity, depthWrite: false, side: DoubleSide, blending: AdditiveBlending });
    view.mat[name] = material; view.resources.push(material);
  };
  addGeo('stanceFlameSheet', sheet('flame')); addGeo('stanceWaterSheet', sheet('water'));
  // The outer edge is exactly unit radius, allowing a true gameplay boundary.
  addGeo('stanceBoundary', new TorusGeometry(0.985, 0.015, 6, 64));
  const crystal = new IcosahedronGeometry(1, 0); crystal.scale(0.28, 1.15, 0.21); addGeo('stanceCrystal', crystal);
  const points = [[0,0,0],[0.08,0.28,0.03],[-0.09,0.48,0],[0.11,0.72,-0.04],[0,1,0]].map(p => new Vector3(...p));
  addGeo('stanceBolt', new TubeGeometry(new CatmullRomCurve3(points), 20, 0.035, 5, false));
  const rock = new IcosahedronGeometry(1, 1), pos = rock.attributes.position;
  for (let i=0; i<pos.count; i++) { const x=pos.getX(i), y=pos.getY(i), z=pos.getZ(i), n=1+0.16*Math.sin(x*12+y*17+z*9); pos.setXYZ(i,x*n*0.75,y*n*0.9,z*n*0.45); }
  rock.computeVertexNormals(); addGeo('stanceRock', rock);
  addMat('stanceFire',0xff8a2f,0.56); addMat('stanceFrost',0x8deaff,0.48); addMat('stanceStorm',0xcbb4ff,0.72);
  addMat('stanceWater',0x37c9ed,0.4); addMat('stanceEarth',0xc99154,0.44); addMat('stanceForce',0x95e9fa,0.5);
}

/** Layered, element-specific combat beats. A unit boundary is scaled to the gameplay radius by the caller. */
export function buildStancePhase(view, g, phase, element) {
  const mat = ELEMENT_MATERIAL[element] ?? ELEMENT_MATERIAL.force;
  const primary = {fire:'stanceFlameSheet',frost:'stanceCrystal',storm:'stanceBolt',water:'stanceWaterSheet',earth:'stanceRock',force:'shield'}[element] ?? 'shield';
  const amount = phase === 'finisher' ? 12 : phase === 'anticipation' ? 8 : 6;
  const boundary = view.mesh('stanceBoundary', mat, g, 0, 0.035, 0, phase === 'finisher' ? 1 : 0.8);
  boundary.rotation.x = Math.PI / 2;
  boundary.castShadow = false; boundary.userData.stanceBoundary = phase === 'finisher';
  if (phase === 'finisher') {
    const inner = view.ring(g, mat, 0.54, 0.055); inner.castShadow = false;
    inner.userData.stanceWave = true;
  }
  for (let i=0;i<amount;i++) {
    const a=i*TAU/amount, radius=phase === 'finisher' ? 0.78 : 0.68;
    const height=phase === 'block' ? 0.6 + 0.15*(i%2) : 0.12;
    const part=view.mesh(primary,mat,g,Math.sin(a)*radius,height,Math.cos(a)*radius,
      phase === 'finisher' ? 0.08 : 0.16,phase === 'finisher' ? 0.3 : 0.5,phase === 'finisher' ? 0.08 : 0.16);
    part.castShadow=false; part.rotation.y=a; part.rotation.z=Math.sin(a)*0.2;
    part.userData.stanceBeat={ baseY:part.position.y, baseScaleY:part.scale.y, phase:i*0.7, element };
  }
}
/** Art-directed silhouettes for the five elemental stances, using shared immutable resources. */
export function buildStanceRig(view, g, element) {
  const mesh = (...args) => view.mesh(...args);
  const ring = (...args) => view.ring(...args);
  if (element === 'fire') {
    ring(g, 'bronze', 0.84, 0.12); ring(g, 'fire', 0.58, 2.2);
    for (let i = 0; i < 9; i++) {
      const a = i * TAU / 9;
      const spike = mesh('shard', i % 2 ? 'fire' : 'bronze', g, Math.sin(a) * 0.54, 2.27, Math.cos(a) * 0.54, 0.09, 0.36 + (i % 3) * 0.11, 0.09);
      spike.rotation.z = Math.sin(a) * 0.3; spike.rotation.x = -Math.cos(a) * 0.3;
      const flare = mesh('shard', 'fire', g, Math.sin(a) * 0.92, 0.65 + (i % 2) * 0.4, Math.cos(a) * 0.92, 0.09, 0.42, 0.09);
      flare.rotation.z = Math.sin(a) * 0.45;
    }
  } else if (element === 'frost') {
    ring(g, 'steel', 0.88, 0.1); ring(g, 'ice', 0.5, 2.2);
    for (let i = 0; i < 8; i++) {
      const a = i * TAU / 8;
      const fin = mesh('shard', 'ice', g, Math.sin(a) * 0.85, 1.15, Math.cos(a) * 0.85, 0.18, 0.83, 0.10);
      fin.rotation.y = a; fin.rotation.z = Math.sin(a) * 0.17;
      mesh('shard', 'steel', g, Math.sin(a) * 0.5, 2.28, Math.cos(a) * 0.5, 0.08, 0.27 + (i % 2) * 0.18, 0.08);
    }
    ring(g, 'ice', 1.1, 0.3);
  } else if (element === 'storm') {
    for (let j = 0; j < 3; j++) {
      const r = ring(g, j === 1 ? 'storm' : 'steel', 0.78 + j * 0.14, 0.6 + j * 0.58);
      r.rotation.y = j * 0.45; r.rotation.z = (j - 1) * 0.4;
      r.userData.orbit = j + 1; r.userData.orbitBase = r.rotation.z;
    }
    for (let i = 0; i < 10; i++) {
      const a = i * TAU / 10;
      const bolt = mesh('box', 'storm', g, Math.sin(a) * 0.95, 1.1 + (i % 2) * 0.5, Math.cos(a) * 0.95, 0.07, 0.54, 0.07);
      bolt.rotation.z = (i % 2 ? 1 : -1) * 0.6;
      mesh('sphere', 'storm', g, Math.sin(a) * 0.9, 0.32 + (i % 3) * 0.56, Math.cos(a) * 0.9, 0.09);
    }
  } else if (element === 'water') {
    for (let j = 0; j < 4; j++) {
      const r = ring(g, j % 2 ? 'water' : 'steel', 0.75 + j * 0.11, 0.22 + j * 0.48);
      r.rotation.z = (j - 1.5) * 0.17; r.userData.orbit = j + 1; r.userData.orbitBase = r.rotation.z;
    }
    for (let i = 0; i < 12; i++) {
      const a = i * TAU / 12, height = 0.35 + i * 0.12;
      const drop = mesh('sphere', 'water', g, Math.sin(a) * 0.98, height, Math.cos(a) * 0.98, 0.11, 0.2, 0.11);
      drop.rotation.z = 0.3 * Math.sin(a);
    }
  } else if (element === 'earth') {
    ring(g, 'bronze', 1.1, 0.12);
    for (let i = 0; i < 7; i++) {
      const a = i * TAU / 7;
      const plate = mesh('ridge', i % 2 ? 'rock' : 'strata', g, Math.sin(a) * 0.97, 0.92, Math.cos(a) * 0.97, 0.22, 0.55, 0.12);
      plate.rotation.y = a;
      const cap = mesh('box', 'bronze', g, Math.sin(a) * 0.97, 1.48, Math.cos(a) * 0.97, 0.32, 0.08, 0.15);
      cap.rotation.y = a;
      mesh('shard', 'rock', g, Math.sin(a) * 1.15, 0.22, Math.cos(a) * 1.15, 0.20, 0.25, 0.16);
    }
    ring(g, 'strata', 0.6, 2.0);
  } else return false;
  const material = ELEMENT_MATERIAL[element];
  const hero = {fire:'stanceFlameSheet',frost:'stanceCrystal',storm:'stanceBolt',water:'stanceWaterSheet',earth:'stanceRock'}[element];
  for (let i=0;i<7;i++) {
    const a=i*TAU/7, y=element === 'earth' ? 0.45 : 0.18;
    const part=mesh(hero,material,g,Math.sin(a)*0.9,y,Math.cos(a)*0.9,
      element === 'earth' ? 0.25 : 0.2, element === 'earth' ? 0.33 : 0.75, 0.2);
    part.rotation.y=a; part.castShadow=false;
    part.userData.stanceBeat={baseY:y,baseScaleY:part.scale.y,phase:i*0.9,element};
  }
  return true;
}
