import { AdditiveBlending, BufferGeometry, Color, DoubleSide, Float32BufferAttribute, Points, ShaderMaterial } from 'three';

/** Individual silhouettes for each implemented convergence, authored in local
 * cast coordinates and pooled by presentation. No cast allocates a geometry. */
export const CONVERGENCE_HEROES=Object.freeze(['promethean-ignition','absolute-crystallization','storm-catalyst','hydrodynamic-synthesis','elemental-lithification','prismatic-multiplication']);
const COLORS={ 'promethean-ignition':'#ff842d','absolute-crystallization':'#9adfff','storm-catalyst':'#b6a3ff','hydrodynamic-synthesis':'#38bfff','elemental-lithification':'#ce9a61','prismatic-multiplication':'#d1bbff' };
export function createConvergenceHero(slug) {
 if(!CONVERGENCE_HEROES.includes(slug)) throw new Error('Unknown convergence hero');
 const pos=[],uv=[],idx=[];
 const ribbon=(points,width)=>{
  const start=pos.length/3;
  for(let i=0;i<points.length;i++){
   const [x,y,z]=points[i], p=points[Math.max(0,i-1)],n=points[Math.min(points.length-1,i+1)];
   const dx=n[0]-p[0],dz=n[2]-p[2],d=Math.hypot(dx,dz)||1;
   // Offset across the horizontal footprint. Taper prevents hard cut ends.
   const w=width*(.25+.75*Math.sin(Math.PI*(i+.5)/points.length));
   pos.push(x-dz/d*w,y,z+dx/d*w,x+dz/d*w,y,z-dx/d*w);uv.push(i/(points.length-1),0,i/(points.length-1),1);
   if(i){const a=start+(i-1)*2,b=start+i*2;idx.push(a,b,a+1,b,b+1,a+1);}
  }
 };
 const diamond=(x,z,r,h,phase=0)=>{
  const start=pos.length/3, top=[x+Math.sin(phase)*r*.16,h,z+Math.cos(phase)*r*.16];
  const points=[[x-r,0,z],[x,0,z-r],[x+r,0,z],[x,0,z+r],top,[x,h*.43,z]];
  for(const [px,py,pz] of points){pos.push(px,py,pz);uv.push(Math.max(0,Math.min(1,(px-x)/(2*r)+.5)),Math.max(0,Math.min(1,py/h)));}
  for(const f of [[0,1,4],[1,2,4],[2,3,4],[3,0,4],[1,0,5],[2,1,5],[3,2,5],[0,3,5]])idx.push(...f.map(i=>start+i));
 };
 if(slug==='promethean-ignition') {
  for(let k=0;k<9;k++){const a=k*Math.PI*2/9, pts=[];for(let i=0;i<=24;i++){const t=i/24,r=.4+t*2.5, angle=a+t*.8;pts.push([Math.sin(angle)*r,.15+Math.sin(t*Math.PI)*1.1,Math.cos(angle)*r]);}ribbon(pts,.18);}
 } else if(slug==='absolute-crystallization') {
  diamond(0,0,.62,2.2);for(let i=0;i<6;i++){const a=i*Math.PI/3,x=Math.sin(a)*3,z=Math.cos(a)*3;diamond(x,z,.44,1.6,a);diamond(x*.87,z*.87,.18,.8,-a);}
 } else if(slug==='storm-catalyst') {
  for(let k=0;k<10;k++){const a=k*Math.PI*2/10, pts=[];for(let i=0;i<=20;i++){const t=i/20,r=.35+t*3.2,offset=i===20?0:(i%2?.13:-.13);pts.push([Math.sin(a)*r+Math.cos(a)*offset,.3+.25*Math.sin(t*8+k),Math.cos(a)*r-Math.sin(a)*offset]);}ribbon(pts,.075);}
 } else if(slug==='hydrodynamic-synthesis') {
  for(let k=-3;k<=3;k++){const pts=[];for(let i=0;i<=28;i++){const t=i/28;pts.push([k*.23+Math.sin(t*9+k)*.12,.24+.35*Math.sin(t*Math.PI)+Math.abs(k)*.07,-2+t*8]);}ribbon(pts,.08);}
 } else if(slug==='elemental-lithification') {
  for(const z of [-2.5,0,2.5]){diamond(0,z,.74,2.5,z);for(let k=0;k<6;k++){const a=k*Math.PI/3;diamond(Math.sin(a)*.67,z+Math.cos(a)*.67,.2,.75,k);}}
 } else if(slug==='prismatic-multiplication') {
  for(const a of [-.48,0,.48])for(let k=-1;k<=1;k++){const pts=[];for(let i=0;i<=24;i++){const t=i/24,r=t*6, offset=k*.11+Math.sin(t*10+k)*.045;pts.push([Math.sin(a)*r+Math.cos(a)*offset,.6+Math.sin(t*6+k)*.12,Math.cos(a)*r-Math.sin(a)*offset]);}ribbon(pts,.045);}
 }
 const g=new BufferGeometry();g.name=`convergence-hero:${slug}`;
 g.setAttribute('position',new Float32BufferAttribute(pos,3));g.setAttribute('uv',new Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();g.computeBoundingSphere();return g;
}
const VERTEX=`varying vec2 vUv;uniform float clock;uniform float identity;
 void main(){vUv=uv;vec3 p=position;p.y+=0.035*sin(uv.x*18.0-clock*(3.0+identity*.2));gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.0);}`;
const FRAGMENT=`varying vec2 vUv;uniform float clock;uniform float identity;uniform vec3 tint;
 void main(){float rim=1.0-abs(vUv.y*2.0-1.0);float pulse=pow(max(0.0,sin(vUv.x*(16.0+identity*2.0)-clock*(2.4+identity*.25))),5.0);
 gl_FragColor=vec4(tint*(1.0+pulse),(.28+.55*rim)*(.72+.28*pulse));}`;
const PARTICLE_VERTEX=`uniform float clock;varying float vFade;
 void main(){vec3 p=position;float phase=fract(clock*.25+position.y*.37);p.y+=phase*.7;vFade=sin(phase*3.14159265);
 vec4 mv=modelViewMatrix*vec4(p,1.0);gl_Position=projectionMatrix*mv;gl_PointSize=clamp(24.0/max(1.0,-mv.z),1.5,6.0);}`;
const PARTICLE_FRAGMENT=`varying float vFade;uniform vec3 tint;
 void main(){float r=length(gl_PointCoord-vec2(.5));gl_FragColor=vec4(tint*1.5,(1.0-smoothstep(.1,.5,r))*vFade*.65);}`;
export function addConvergenceHero(v, group, uid) {
 const slug=(uid??'mechanics/convergence/storm-catalyst').split('/').at(-1);
 if(!CONVERGENCE_HEROES.includes(slug)) return false;
 const key=`convergenceHero:${slug}`, material=`convergenceHeroMaterial:${slug}`, dots=`convergenceMotes:${slug}`, dotMat=`convergenceMoteMaterial:${slug}`;
 if(!v.geo[key]) {const g=createConvergenceHero(slug);v.geo[key]=g;v.resources.push(g);}
 if(!v.mat[material]) {const m=new ShaderMaterial({uniforms:{clock:v.terrainTime,identity:{value:CONVERGENCE_HEROES.indexOf(slug)},tint:{value:new Color(COLORS[slug])}},vertexShader:VERTEX,fragmentShader:FRAGMENT,transparent:true,depthWrite:false,side:DoubleSide,blending:AdditiveBlending});m.name=material;v.mat[material]=m;v.resources.push(m);}
 if(!v.geo[dots]) {
  const original=v.geo[key].getAttribute('position'),p=[];
  for(let i=0;i<48;i++){const j=Math.floor(i*original.count/48);p.push(original.getX(j),original.getY(j),original.getZ(j));}
  const g=new BufferGeometry();g.setAttribute('position',new Float32BufferAttribute(p,3));g.computeBoundingSphere();g.name=dots;v.geo[dots]=g;v.resources.push(g);
 }
 if(!v.mat[dotMat]) {const m=new ShaderMaterial({uniforms:{clock:v.terrainTime,tint:{value:new Color(COLORS[slug])}},vertexShader:PARTICLE_VERTEX,fragmentShader:PARTICLE_FRAGMENT,transparent:true,depthWrite:false,blending:AdditiveBlending});m.name=dotMat;v.mat[dotMat]=m;v.resources.push(m);}
 const hero=v.mesh(key,material,group);hero.name=key;hero.castShadow=false;hero.receiveShadow=false;
 const motes=new Points(v.geo[dots],v.mat[dotMat]);motes.name=dots;motes.frustumCulled=false;group.add(motes);
 return true;
}
