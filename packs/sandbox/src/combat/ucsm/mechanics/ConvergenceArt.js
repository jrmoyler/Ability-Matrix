import { Vector3 } from 'three';
/** Authored silhouettes for the five convergence variants. All meshes use the
 * presentation's shared, centrally disposed material/geometry pool. */
export function drawConvergenceArt(v, g, uid) {
  const TAU = 2 * Math.PI;
  const m = (...args) => v.mesh(...args);
  const ring = (...args) => v.ring(...args);
  const animate = (mesh, kind, phase = 0) => {
    mesh.userData.convergenceMotion = { kind, phase, scale: mesh.scale.clone(), position: mesh.position.clone() };
    return mesh;
  };
  if (uid.endsWith('/promethean-ignition')) {
    m('base','iron',g,0,0.2,0,1.1,1,1.1);
    ring(g,'bronze',1.1,0.35); ring(g,'fire',1.8,0.1); ring(g,'gold',2.5,0.08);
    m('sphere','fire',g,0,1.25,0,0.46);
    for (let i=0;i<8;i++) {
      const a=i*TAU/8, x=Math.sin(a), z=Math.cos(a);
      let rib=m('shaft','bronze',g,x*0.65,1.1,z*0.65,0.6,1.55,0.6); rib.rotation.z=x*0.5; rib.rotation.x=-z*0.5;
      let flame=animate(m('shard','fire',g,x*1.2,0.62,z*1.2,0.18,0.8,0.18),'flame',i); flame.rotation.z=-x*0.3;
      m('box','gold',g,x*2.5,0.1,z*2.5,0.14,0.07,0.45).rotation.y=a;
    }
  } else if (uid.endsWith('/absolute-crystallization')) {
    ring(g,'ice',3.0,0.1); ring(g,'steel',2.35,0.12);
    m('shard','ice',g,0,1.05,0,0.45,1.3,0.45);
    for(let i=0;i<6;i++) {
      const a=i*TAU/6, x=Math.sin(a), z=Math.cos(a);
      m('base','steel',g,x*3,0.1,z*3,0.5,0.5,0.5);
      animate(m('shard','ice',g,x*3,0.8,z*3,0.3,1.1,0.3),'crystal',i).rotation.y=a;
      m('shard','ice',g,x*2.5,0.45,z*2.5,0.13,0.55,0.13).rotation.z=x*0.6;
      m('box','steel',g,x*2.15,0.14,z*2.15,0.08,0.08,1).rotation.y=a;
    }
  } else if (uid.endsWith('/hydrodynamic-synthesis')) {
    for(let i=0;i<5;i++) {
      const z=-1.6+i*1.6;
      const arc=ring(g, i%2?'steel':'water', 0.7+i*0.15, 0.35+i*0.2);
      arc.position.z=z; arc.rotation.x=0; arc.rotation.y=Math.PI/2;
      for(let j=0;j<6;j++) {
        const a=j*Math.PI/5;
        animate(m('sphere','water',g,Math.cos(a)*(0.7+i*0.15),0.35+Math.sin(a)*(0.7+i*0.15),z,0.12+(j%2)*0.05),'droplet',i*6+j);
      }
    }
    for(const x of [-1,1]) m('shaft','water',g,x*1.1,0.1,2,0.2,7,0.2).rotation.x=Math.PI/2;
  } else if (uid.endsWith('/elemental-lithification')) {
    for(let i=-1;i<=1;i++) {
      animate(m('ridge','rock',g,0,1.2,i*2.5,0.8,1+0.15*(1-Math.abs(i)),0.8),'eruption',i+1);
      for(let j=0;j<4;j++) {
        const a=j*TAU/4;
        m('shard','strata',g,Math.sin(a)*0.8,0.25,i*2.5+Math.cos(a)*0.8,0.35,0.4,0.35);
      }
      ring(g,'gold',1.15,0.12).position.z=i*2.5;
    }
    m('box','bronze',g,0,0.1,0,0.09,0.08,6);
  } else if (uid.endsWith('/prismatic-multiplication')) {
    ring(g,'gold',0.8,0.1);
    m('shard','ice',g,0,1,0,0.4,0.9,0.4);
    for(const a of [-0.48,0,0.48]) {
      const x=Math.sin(a),z=Math.cos(a);
      const beam=m('shaft','ice',g,x*3,0.8,z*3,0.22,6,0.22); beam.quaternion.setFromUnitVectors(new Vector3(0,1,0), new Vector3(x,0,z));
      for(let j=1;j<=4;j++) {
        const shard=animate(m('shard',j%2?'gold':'ice',g,x*j*1.3,0.8,z*j*1.3,0.12,0.45,0.12),'prism',j); shard.rotation.z=a;
      }
      m('shard','ice',g,x*6,0.8,z*6,0.25,0.8,0.25).rotation.z=a;
    }
  } else return false;
  return true;
}
