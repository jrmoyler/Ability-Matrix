const TAU = Math.PI * 2;
const themes = {
  'mechanics/weave/neural-thunder-grid': ['storm', 'steel', 4, 'coil'],
  'mechanics/weave/hydrostatic-labyrinth': ['water', 'bronze', 3, 'water'],
  'mechanics/weave/tectonic-triangulation': ['rock', 'gold', 3, 'stone'],
  'mechanics/weave/prismatic-cathedral': ['crystal', 'steel', 5, 'prism'],
  'mechanics/weave/jetstream-loom': ['wind', 'bronze', 4, 'wind']
};
export const weaveMaterial = (uid) => themes[uid]?.[0];
/** Construct a distinct silhouette for each new anchor using shared, disposed resources. */
export function buildWeaveAnchor(v, g, data) {
  const theme = themes[data.uid];
  if (!theme) return false;
  const [color, frame, n, form] = theme;
  v.mesh('base', frame, g, 0, 0, 0, 0.8, 0.8, 0.8);
  v.ring(g, color, 0.66, 0.14);
  if (form === 'coil') {
    v.mesh('shaft', frame, g, 0, 0.95, 0, 0.7, 1.8, 0.7);
    for (let i = 0; i < 5; i++) { const ring = v.ring(g, color, 0.4 + i * 0.06, 0.4 + i * 0.3); ring.rotation.z = 0.3; }
    v.mesh('sphere', color, g, 0, 1.85, 0, 0.23);
  } else if (form === 'water') {
    v.mesh('sphere', color, g, 0, 1.05, 0, 0.45, 0.75, 0.45);
    for (let i = 0; i < 3; i++) { const ring = v.ring(g, frame, 0.65 - i * 0.1, 0.5 + i * 0.5); ring.rotation.z = (i - 1) * 0.5; }
  } else if (form === 'stone') {
    v.mesh('ridge', color, g, 0, 0.95, 0, 0.5, 0.8, 0.5);
    for (let i = 0; i < 3; i++) v.ring(g, frame, 0.48 - i * 0.08, 0.35 + i * 0.5);
  } else if (form === 'prism') {
    v.mesh('shard', color, g, 0, 1.1, 0, 0.45, 1.15, 0.45);
    v.ring(g, frame, 0.58, 1.2);
  } else {
    v.mesh('shaft', frame, g, 0, 0.85, 0, 0.7, 1.5, 0.7);
    const hub = v.mesh('sphere', color, g, 0, 1.6, 0, 0.22);
    for (let i = 0; i < 4; i++) {
      const blade = v.mesh('shard', color, hub, Math.sin(i * TAU / 4) * 1.3, Math.cos(i * TAU / 4) * 1.3, 0, 0.28, 1.2, 0.14);
      blade.rotation.z = -i * TAU / 4;
    }
  }
  for (let i = 0; i < n; i++) {
    const angle = i * TAU / n;
    const side = v.mesh(form === 'stone' ? 'box' : 'shard', color, g, Math.sin(angle) * 0.55, 0.7, Math.cos(angle) * 0.55, 0.11, form === 'prism' ? 0.85 : 0.5, 0.11);
    side.rotation.z = -Math.sin(angle) * 0.3; side.rotation.x = Math.cos(angle) * 0.3;
  }
  return true;
}
