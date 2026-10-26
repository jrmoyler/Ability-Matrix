import { AdditiveBlending, BufferGeometry, Color, DoubleSide, Float32BufferAttribute, Points, ShaderMaterial } from 'three';

/** Independently authored mantle silhouettes centred around the caster.
 * All meshes/materials are pooled on the presentation and disposed with it. */
export const STANCE_HEROES=Object.freeze(['crown-of-the-first-ember','the-pale-monarch','thundergod-conduction','leviathans-mantle','titan-of-the-deep-strata','aegis-exemplar']);
const COLORS={'crown-of-the-first-ember':'#ff7730','the-pale-monarch':'#a7eaff','thundergod-conduction':'#b8a6ff','leviathans-mantle':'#42c9f2','titan-of-the-deep-strata':'#c99762','aegis-exemplar':'#a5e7f5'};
export function createStanceHero(slug){
 if(!STANCE_HEROES.includes(slug))throw new Error('Unknown stance hero');
 const positions=[],uvs=[],indices=[];
 const ribbon=(points,width)=>{
  const start=positions.length/3;
  for(let i=0;i<points.length;i++){
   const [x,y,z]=points[i],p=points[Math.max(0,i-1)],n=points[Math.min(points.length-1,i+1)];
   const dx=n[0]-p[0],dy=n[1]-p[1],len=Math.hypot(dx,dy)||1;
   const w=width*(.2+.8*Math.sin(Math.PI*(i+.5)/points.length));
   positions.push(x-dy/len*w,y+dx/len*w,z,x+dy/len*w,y-dx/len*w,z);
   uvs.push(i/(points.length-1),0,i/(points.length-1),1);
   if(i){const a=start+(i-1)*2,b=start+i*2;indices.push(a,a+1,b,b,a+1,b+1);}
  }
 };
 const facet=(x,y,z,w,h,d,lean=0)=>{
  const start=positions.length/3;
  const points=[[x-w,y,z],[x,y-h,z],[x+w,y,z],[x+lean,y+h,z],[x,y,z+d],[x,y,z-d]];
  for(const [px,py,pz] of points){positions.push(px,py,pz);uvs.push(Math.max(0,Math.min(1,(px-x)/(2*w)+.5)),Math.max(0,Math.min(1,(py-y)/(2*h)+.5)));}
  for(const f of [[0,1,4],[1,2,4],[2,3,4],[3,0,4],[1,0,5],[2,1,5],[3,2,5],[0,3,5]])indices.push(...f.map(i=>start+i));
 };
 if(slug==='crown-of-the-first-ember'){
  for(let k=0;k<9;k++){const a=k*Math.PI*2/9,points=[];for(let i=0;i<=20;i++){const t=i/20,r=.6+.16*Math.sin(t*5+k)*t;points.push([Math.sin(a)*r+.08*Math.sin(t*8+k)*t,1.65+t*(.75+(k%3)*.1),Math.cos(a)*r]);}ribbon(points,.09);}
 } else if(slug==='the-pale-monarch'){
  for(let k=0;k<10;k++){const a=k*Math.PI/5;facet(Math.sin(a)*.78,1.25,Math.cos(a)*.78,.12,.65+(k%3)*.13,.12,Math.sin(a)*.12);}
 } else if(slug==='thundergod-conduction'){
  for(let k=0;k<8;k++){const a=k*Math.PI/4,points=[];for(let i=0;i<=16;i++){const t=i/16,r=.8+(i%2?1:-1)*.1;points.push([Math.sin(a)*r, .15+t*2.2,Math.cos(a)*r]);}ribbon(points,.04);}
 } else if(slug==='leviathans-mantle'){
  for(let k=0;k<6;k++){const points=[];for(let i=0;i<=28;i++){const t=i/28,a=k*Math.PI/3+t*Math.PI*1.1,r=.93+.07*Math.sin(t*8+k);points.push([Math.sin(a)*r,.15+t*2.15,Math.cos(a)*r]);}ribbon(points,.08);}
 } else if(slug==='titan-of-the-deep-strata'){
  for(let k=0;k<8;k++){const a=k*Math.PI/4;facet(Math.sin(a)*1.0,1.0,Math.cos(a)*1.0,.22,.62,.17,Math.sin(a)*.08);facet(Math.sin(a)*1.05,.32,Math.cos(a)*1.05,.18,.28,.15);}
 } else {
  for(let k=0;k<6;k++){const a=k*Math.PI/3;facet(Math.sin(a)*.88,1.15,Math.cos(a)*.88,.2,.62,.09,Math.sin(a)*.08);}
  for(let k=0;k<12;k++){const a=k*Math.PI/6,points=[];for(let i=0;i<=8;i++){const t=i/8,b=a+(t-.5)*.25;points.push([Math.sin(b)*1.02,.25+k%2*.06,Math.cos(b)*1.02]);}ribbon(points,.025);}
 }
 const g=new BufferGeometry();g.name=`stance-hero:${slug}`;g.setAttribute('position',new Float32BufferAttribute(positions,3));g.setAttribute('uv',new Float32BufferAttribute(uvs,2));g.setIndex(indices);g.computeVertexNormals();g.computeBoundingSphere();return g;
}
const SURFACE_VERTEX=`varying vec2 vUv;uniform float clock;uniform float identity;
 void main(){vUv=uv;vec3 p=position;p.y+=0.035*sin(uv.x*16.0-clock*(2.8+identity*.2));gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.0);}`;
const SURFACE_FRAGMENT=`varying vec2 vUv;uniform float clock;uniform float identity;uniform vec3 tint;
 void main(){float edge=1.0-abs(vUv.y*2.0-1.0);float beam=pow(max(0.0,sin(vUv.x*(16.0+identity*2.0)-clock*(2.0+identity*.3))),5.0);gl_FragColor=vec4(tint*(1.05+beam*.85),(.25+.55*edge)*(.7+.3*beam));}`;
const PARTICLE_VERTEX=`uniform float clock;varying float vFade;
 void main(){vec3 p=position;float phase=fract(clock*.22+position.y*.31);p.y+=phase*.45;vFade=sin(phase*3.14159265);vec4 mv=modelViewMatrix*vec4(p,1.0);gl_Position=projectionMatrix*mv;gl_PointSize=clamp(20.0/max(1.0,-mv.z),1.5,5.0);}`;
const PARTICLE_FRAGMENT=`varying float vFade;uniform vec3 tint;
 void main(){float r=length(gl_PointCoord-vec2(.5));gl_FragColor=vec4(tint*1.4,(1.0-smoothstep(.1,.5,r))*vFade*.65);}`;
export function addStanceHero(v,group,uid){
 const slug=(uid??'mechanics/stance/aegis-exemplar').split('/').at(-1);
 if(!STANCE_HEROES.includes(slug))return false;
 const geo=`stanceHero:${slug}`,mat=`stanceHeroMaterial:${slug}`,points=`stanceMotes:${slug}`,pointMat=`stanceMoteMaterial:${slug}`;
 if(!v.geo[geo]){const g=createStanceHero(slug);v.geo[geo]=g;v.resources.push(g);}
 if(!v.mat[mat]){const m=new ShaderMaterial({uniforms:{clock:v.terrainTime,identity:{value:STANCE_HEROES.indexOf(slug)},tint:{value:new Color(COLORS[slug])}},vertexShader:SURFACE_VERTEX,fragmentShader:SURFACE_FRAGMENT,transparent:true,depthWrite:false,side:DoubleSide,blending:AdditiveBlending});m.name=mat;v.mat[mat]=m;v.resources.push(m);}
 if(!v.geo[points]){const source=v.geo[geo].getAttribute('position'),a=[];for(let i=0;i<48;i++){const j=Math.floor(i*source.count/48);a.push(source.getX(j),source.getY(j),source.getZ(j));}const g=new BufferGeometry();g.name=points;g.setAttribute('position',new Float32BufferAttribute(a,3));g.computeBoundingSphere();v.geo[points]=g;v.resources.push(g);}
 if(!v.mat[pointMat]){const m=new ShaderMaterial({uniforms:{clock:v.terrainTime,tint:{value:new Color(COLORS[slug])}},vertexShader:PARTICLE_VERTEX,fragmentShader:PARTICLE_FRAGMENT,transparent:true,depthWrite:false,blending:AdditiveBlending});m.name=pointMat;v.mat[pointMat]=m;v.resources.push(m);}
 const hero=v.mesh(geo,mat,group);hero.name=geo;hero.castShadow=false;hero.receiveShadow=false;
 const motes=new Points(v.geo[points],v.mat[pointMat]);motes.name=points;motes.frustumCulled=false;group.add(motes);return true;
}
