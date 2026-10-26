import { Group, Line, BufferGeometry, Float32BufferAttribute, LineBasicMaterial } from 'three';
import { convergenceStrikeShapes } from './ConvergenceVariants.js';

/** Exact local-space outlines of the reaction disc (cyan) and strike shapes
 * (gold). Rotate the group around its cast point to aim in world space. */
export function createConvergenceTelegraph(p) {
  const root = new Group();
  root.name = 'ConvergenceAim';
  // These are deliberate screen-visible aim overlays: raised worldshapes must
  // not hide a footprint, including while its origin lies under a ridge.
  const reactionMat = new LineBasicMaterial({ color: 0x74dce6, transparent: true, opacity: 0.7, depthWrite: false, depthTest: false });
  const strikeMat = new LineBasicMaterial({ color: 0xffd27a, transparent: true, opacity: 0.95, depthWrite: false, depthTest: false });
  const geometries = [];
  function outline(points, material, role) {
    const geo = new BufferGeometry();
    geo.setAttribute('position', new Float32BufferAttribute(points.flatMap(([x,z]) => [x, 0.075, z]), 3));
    geometries.push(geo);
    const line = new Line(geo, material);
    line.name = role;
    line.renderOrder = 100;
    root.add(line);
  }
  function disc(x, z, r) {
    return Array.from({length: 49}, (_,i) => {
      const a = i * Math.PI * 2 / 48;
      return [x + Math.cos(a) * r, z + Math.sin(a) * r];
    });
  }
  function capsule(s) {
    const dx = s.bx - s.ax, dz = s.bz - s.az, length = Math.hypot(dx,dz);
    if (length < 1e-9) return disc(s.ax,s.az,s.r);
    const ux = dx / length, uz = dz / length, px = -uz, pz = ux;
    const point = (x,z,a) => [x + s.r*(ux*Math.cos(a)+px*Math.sin(a)), z + s.r*(uz*Math.cos(a)+pz*Math.sin(a))];
    const points = [point(s.ax,s.az,Math.PI/2)];
    for (let i=0;i<=24;i++) points.push(point(s.bx,s.bz,Math.PI/2-Math.PI*i/24));
    for (let i=0;i<=24;i++) points.push(point(s.ax,s.az,-Math.PI/2-Math.PI*i/24));
    points.push(points[0]);
    return points;
  }
  outline(disc(0,0,p.radius), reactionMat, 'ingredient-radius');
  const shapes = convergenceStrikeShapes(p, {position:[0,0,0], direction:[0,0,1]});
  for (const shape of shapes) outline(shape.kind === 'disc' ? disc(shape.x,shape.z,shape.r) : capsule(shape), strikeMat, 'strike-footprint');
  root.userData.dispose = () => { for (const g of geometries) g.dispose(); reactionMat.dispose(); strikeMat.dispose(); };
  return root;
}
