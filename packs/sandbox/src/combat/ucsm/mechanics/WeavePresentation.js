import { Points } from 'three';
import { ensureWeaveSurface, ensureWeaveMotes, weaveStyle } from './WeaveHeroGeometry.js';
const TAU = Math.PI * 2;
const themes = {
  'mechanics/weave/neural-thunder-grid': ['storm', 'steel', 4, 'coil'],
  'mechanics/weave/hydrostatic-labyrinth': ['water', 'bronze', 3, 'water'],
  'mechanics/weave/tectonic-triangulation': ['rock', 'gold', 3, 'stone'],
  'mechanics/weave/prismatic-cathedral': ['crystal', 'steel', 5, 'prism'],
  'mechanics/weave/jetstream-loom': ['wind', 'bronze', 4, 'wind']
};
export const weaveMaterial = (uid) => themes[uid]?.[0];
/** A pooled elemental hero layer accompanies each physical anchor. */
export function buildWeaveAnchorSurface(v, g, uid) {
  const style=weaveStyle(uid ?? ''), asset=ensureWeaveSurface(v,style,'anchor');
  const hero=v.mesh(asset.geometry,asset.material,g,0,0,0,1,1,1);
  hero.name=`weave-anchor-hero:${style}`;
  hero.castShadow=false;hero.receiveShadow=false;
}
/** Construct a distinct silhouette for each new anchor using shared, disposed resources. */
export function buildWeaveAnchor(v, g, data) {
  const theme = themes[data.uid];
  if (!theme) return false;
  const [color, frame, n, form] = theme;
  v.mesh('base', frame, g, 0, 0, 0, 0.8, 0.8, 0.8);
  v.ring(g, color, 0.66, 0.14);
  if (form === 'coil') {
    v.mesh('shaft', frame, g, 0, 0.95, 0, 0.7, 1.8, 0.7);
    for (let i = 0; i < 5; i++) { const ring = v.ring(g, color, 0.4 + i * 0.06, 0.4 + i * 0.3); ring.rotation.z = 0.3; ring.userData.weaveSpin = {axis:'z', rate:(i%2 ? -1 : 1)*0.6, base:0.3}; }
    v.mesh('sphere', color, g, 0, 1.85, 0, 0.23);
  } else if (form === 'water') {
    v.mesh('sphere', color, g, 0, 1.05, 0, 0.45, 0.75, 0.45);
    for (let i = 0; i < 3; i++) { const ring = v.ring(g, frame, 0.65 - i * 0.1, 0.5 + i * 0.5); ring.rotation.z = (i - 1) * 0.5; ring.userData.weaveSpin = {axis:'z', rate:(i%2 ? -0.45 : 0.45), base:ring.rotation.z}; }
  } else if (form === 'stone') {
    v.mesh('ridge', color, g, 0, 0.95, 0, 0.5, 0.8, 0.5);
    for (let i = 0; i < 3; i++) v.ring(g, frame, 0.48 - i * 0.08, 0.35 + i * 0.5);
  } else if (form === 'prism') {
    v.mesh('shard', color, g, 0, 1.1, 0, 0.45, 1.15, 0.45);
    v.ring(g, frame, 0.58, 1.2);
  } else {
    v.mesh('shaft', frame, g, 0, 0.85, 0, 0.7, 1.5, 0.7);
    const hub = v.mesh('sphere', color, g, 0, 1.6, 0, 0.22);
    hub.userData.weaveSpin = { axis: 'z', rate: 2.2, base: 0 };
    for (let i = 0; i < 4; i++) {
      const blade = v.mesh('shard', color, hub, Math.sin(i * TAU / 4) * 1.3, Math.cos(i * TAU / 4) * 1.3, 0, 0.28, 1.2, 0.14);
      blade.rotation.z = -i * TAU / 4;
    }
  }
  for (let i = 0; i < n; i++) {
    const angle = i * TAU / n;
    const side = v.mesh(form === 'stone' ? 'box' : 'shard', color, g, Math.sin(angle) * 0.55, 0.7, Math.cos(angle) * 0.55, 0.11, form === 'prism' ? 0.85 : 0.5, 0.11);
    side.rotation.z = -Math.sin(angle) * 0.3; side.rotation.x = Math.cos(angle) * 0.3;
    const foot = v.mesh('box', frame, g, Math.sin(angle)*0.46, 0.23, Math.cos(angle)*0.46, 0.08, 0.25, 0.08);
    foot.rotation.y = angle;
    v.mesh('sphere', color, g, Math.sin(angle)*0.46, 0.41, Math.cos(angle)*0.46, 0.055);
  }
  const crown = v.ring(g, frame, form === 'stone' ? 0.32 : 0.45, 1.52);
  if (form === 'prism' || form === 'wind') crown.userData.weaveSpin = {axis:'z', rate:form === 'wind' ? 0.8 : -0.35, base:0};
  return true;
}

// Animated decoration stays inside the authoritative link capsule. All meshes
// share presentation-owned resources and are disposed with the host.
export function buildWeaveLink(v, g, data) {
  const shape = data.shape;
  if (!shape) return false;
  const uid = data.uid ?? 'mechanics/weave/infernal-circuit';
  const material = weaveMaterial(uid) ?? (uid.endsWith('cryostasis-mesh') ? 'ice' : 'fire');
  const dx = shape.bx - shape.ax, dz = shape.bz - shape.az;
  const len = Math.hypot(dx, dz); if (len < 1e-6) return false;
  const nx = -dz / len, nz = dx / len;
  const mode = uid.includes('thunder') ? 'storm' : uid.includes('hydrostatic') ? 'water' :
    uid.includes('tectonic') ? 'earth' : uid.includes('prismatic') ? 'crystal' :
    uid.includes('jetstream') ? 'wind' : uid.includes('cryostasis') ? 'frost' : 'fire';
  const point = (t, offset, y = 0.58) => [shape.ax + dx * t + nx * offset, y, shape.az + dz * t + nz * offset];
  const segment = (a, b, mat, thickness) => {
    const vx = b[0]-a[0], vy = b[1]-a[1], vz = b[2]-a[2], length = Math.hypot(vx,vy,vz);
    const mesh = v.mesh('shaft', mat, g, (a[0]+b[0])/2,(a[1]+b[1])/2,(a[2]+b[2])/2, thickness, length, thickness);
    mesh.quaternion.setFromUnitVectors(v.up, v.vector(vx,vy,vz).normalize());
  };
  // Core line remains present in reduced motion; its extents fit the collider.
  segment(point(0,0), point(1,0), material, Math.min(0.55, shape.r * 0.7));
  const count = mode === 'storm' ? 12 : mode === 'earth' ? 8 : 10;
  const amplitude = shape.r * (mode === 'wind' ? 0.55 : 0.4);
  for (let i=0;i<count;i++) {
    const t0=i/count,t1=(i+1)/count;
    const wave=(t) => mode === 'storm' ? ((Math.round(t*count)%2 ? 1 : -1) * amplitude) :
      mode === 'earth' ? ((Math.round(t*count)%3-1)*amplitude*0.6) : Math.sin(t*TAU*(mode === 'crystal' ? 3 : 2))*amplitude;
    const y = mode === 'earth' ? 0.14 : mode === 'water' ? 0.43 : 0.58;
    segment(point(t0,wave(t0),y), point(t1,wave(t1),y), material, Math.min(0.35,shape.r*0.4));
  }
  // Motion is deterministic from combat ticks and can be fully disabled.
  for(let i=0;i<4;i++) {
    const marker = v.mesh(mode === 'water' ? 'sphere' : 'shard', material, g, 0,0,0, 0.055,0.12,0.055);
    marker.userData.weaveSlide = { a:point(0,0), b:point(1,0), phase:i/4, speed:mode==='wind'?1.1:0.65 };
    marker.position.set(...point(i/4,0));
  }
  // A transparent authored ribbon adds continuous elemental energy while the
  // physical strands remain the readable source of the collision width.
  const asset=ensureWeaveSurface(v,mode,'link');
  const hero=v.mesh(asset.geometry,asset.material,g,(shape.ax+shape.bx)/2,0.6,(shape.az+shape.bz)/2,shape.r*1.6,1,len);
  hero.rotation.y=Math.atan2(dx,dz);hero.name=`weave-link-hero:${mode}`;
  hero.castShadow=false;hero.receiveShadow=false;
  const motes=ensureWeaveMotes(v,mode), sparks=new Points(v.geo[motes.geometry],v.mat[motes.material]);
  sparks.name=`weave-link-motes:${mode}`;
  sparks.position.set((shape.ax+shape.bx)/2,0.6,(shape.az+shape.bz)/2);
  sparks.scale.set(shape.r*1.6,1,len);sparks.rotation.y=Math.atan2(dx,dz);
  sparks.frustumCulled=false;g.add(sparks);
  return true;
}

/** Draw geometry at the actual triggered targets/area rather than a generic burst. */
export function buildWeaveCue(v, g, data, kind) {
  const material = weaveMaterial(data.uid) ?? (data.uid?.endsWith('cryostasis-mesh') ? 'ice' : 'fire');
  const local = (p) => [p[0] - data.position[0], 0.12, p[2] - data.position[2]];
  const beam = (a,b,thickness=0.2) => {
    const d = v.vector(b[0]-a[0], b[1]-a[1], b[2]-a[2]);
    if (d.lengthSq() < 1e-9) return;
    const length=d.length(), mesh=v.mesh('shaft',material,g,(a[0]+b[0])/2,(a[1]+b[1])/2,(a[2]+b[2])/2,thickness,length,thickness);
    mesh.quaternion.setFromUnitVectors(v.up,d.normalize());
  };
  if (kind === 'anchor-expire') {
    v.ring(g, material, 0.7, 0.1); v.ring(g, material, 0.42, 0.16);
    return true;
  }
  if (kind === 'anchor-break') {
    for(let i=0;i<8;i++) {
      const a=i*TAU/8, shard=v.mesh('shard',material,g,Math.sin(a)*0.42,0.6,Math.cos(a)*0.42,0.08,0.28,0.08);
      shard.rotation.z=-a; shard.userData.weavePulse={phase:i, base:shard.scale.clone(), amount:0.25};
    }
    v.ring(g,material,0.65,0.12); return true;
  }
  if (data.weaveEffect === 'chain' && data.arcTargets?.length) {
    for (const target of data.arcTargets.slice(0,3)) {
      const end=local(target), from=[0,0.95,0], to=[end[0],0.95,end[2]];
      const dx=to[0],dz=to[2],len=Math.hypot(dx,dz)||1,nx=-dz/len,nz=dx/len;
      let prev=from;
      for(let i=1;i<=6;i++) {const t=i/6, offset=i===6?0:(i%2?0.12:-0.12); const next=[dx*t+nx*offset,0.95,dz*t+nz*offset];beam(prev,next,0.3);prev=next;}
    }
    return true;
  }
  if (data.weaveEffect === 'flood' && data.triangle?.length===3) {
    const [a,b,c]=data.triangle.map(local);
    beam(a,b); beam(b,c); beam(c,a);
    for(let i=1;i<9;i++) {const t=i/9;beam(a.map((x,k)=>x+(b[k]-x)*t),a.map((x,k)=>x+(c[k]-x)*t),0.12);}
    return true;
  }
  if (data.weaveEffect === 'quake') {
    v.ring(g,material,data.radius ?? 2,0.1);
    v.ring(g,material,(data.radius ?? 2)*0.65,0.12);
    for(let i=0;i<8;i++){const a=i*TAU/8,r=(data.radius ?? 2)*0.82;const chip=v.mesh('shard',material,g,Math.sin(a)*r,0.18,Math.cos(a)*r,0.1,0.25,0.1);chip.rotation.z=a;}
    return true;
  }
  if (data.weaveEffect === 'shatter' || data.weaveEffect === 'draft') {
    const r = data.radius ?? 1;
    for(let i=0;i<10;i++){const a=i*TAU/10;const shard=v.mesh('shard',material,g,Math.sin(a)*r*0.65,0.35,Math.cos(a)*r*0.65,0.09,0.35,0.09);shard.rotation.z=-a;}
    v.ring(g,material,r,0.1);return true;
  }
  return false;
}
