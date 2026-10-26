const TAU = Math.PI * 2;
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
  return true;
}
