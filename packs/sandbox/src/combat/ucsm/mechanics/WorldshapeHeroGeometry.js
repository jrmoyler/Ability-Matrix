import { AdditiveBlending, BufferGeometry, Color, DoubleSide, Float32BufferAttribute, Points, ShaderMaterial } from 'three';

/** Normalised authored surfaces. Their radial extent stays inside the field,
 * and their shader is raised to the same cone height as the combat terrain. */
export const WORLDSHAPE_HEROES=Object.freeze(['the-scorched-kingdom','glaciers-dominion','stormground','the-living-floodplain','the-glass-labyrinth','continental-uprising']);
const COLORS={'the-scorched-kingdom':'#ff762c','glaciers-dominion':'#b3e9ff','stormground':'#b3a7ff','the-living-floodplain':'#31c5ef','the-glass-labyrinth':'#d6bfff','continental-uprising':'#d5a66c'};
const ELEVATION={'glaciers-dominion':.35,'continental-uprising':.65};
export function createWorldshapeHero(slug){
 if(!WORLDSHAPE_HEROES.includes(slug))throw new Error('Unknown worldshape hero');
 const positions=[],uvs=[],indices=[];
 const ribbon=(points,width)=>{
  const start=positions.length/3;
  for(let i=0;i<points.length;i++){
   const [x,z]=points[i],p=points[Math.max(0,i-1)],n=points[Math.min(points.length-1,i+1)];
   const dx=n[0]-p[0],dz=n[1]-p[1],len=Math.hypot(dx,dz)||1;
   const w=width*(.3+.7*Math.sin(Math.PI*(i+.5)/points.length));
   positions.push(x-dz/len*w,0,z+dx/len*w,x+dz/len*w,0,z-dx/len*w);
   uvs.push(i/(points.length-1),0,i/(points.length-1),1);
   if(i){const a=start+(i-1)*2,b=start+i*2;indices.push(a,b,a+1,b,b+1,a+1);}
  }
 };
 if(slug==='the-scorched-kingdom'){
  for(let k=0;k<12;k++){const a=k*Math.PI/6,points=[];for(let i=0;i<=24;i++){const t=i/24,r=.12+t*.65,offset=.035*Math.sin(t*14+k);points.push([Math.sin(a)*r+Math.cos(a)*offset,Math.cos(a)*r-Math.sin(a)*offset]);}ribbon(points,.024);}
 } else if(slug==='glaciers-dominion'){
  for(let k=0;k<6;k++){const a=k*Math.PI/3,points=[];for(let i=0;i<=16;i++){const r=i/16*.78;points.push([Math.sin(a)*r,Math.cos(a)*r]);}ribbon(points,.026);
   for(const r of [.32,.52])for(const side of [-1,1])ribbon([[Math.sin(a)*r,Math.cos(a)*r],[Math.sin(a)*r+Math.sin(a+side*.8)*.19,Math.cos(a)*r+Math.cos(a+side*.8)*.19]],.02);}
 } else if(slug==='stormground'){
  for(let k=0;k<10;k++){const a=k*Math.PI/5,points=[];for(let i=0;i<=16;i++){const t=i/16,r=.12+t*.66,off=(i%2?1:-1)*.045*(1-t);points.push([Math.sin(a)*r+Math.cos(a)*off,Math.cos(a)*r-Math.sin(a)*off]);}ribbon(points,.018);}
 } else if(slug==='the-living-floodplain'){
  for(let k=-3;k<=3;k++){const x=k*.18,span=Math.sqrt(.77*.77-x*x),points=[];for(let i=0;i<=24;i++){const z=-span+i/24*2*span;points.push([x+Math.sin(i/24*Math.PI*2+k)*.045,z]);}ribbon(points,.027);}
 } else if(slug==='the-glass-labyrinth'){
  for(let k=0;k<7;k++){const a=k*Math.PI*2/7;for(const r of [.35,.62]){const points=[];for(let i=0;i<=8;i++){const b=a+(i/8-.5)*.42;points.push([Math.sin(b)*r,Math.cos(b)*r]);}ribbon(points,.024);}ribbon([[0,0],[Math.sin(a)*.76,Math.cos(a)*.76]],.018);}
 } else {
  for(let k=0;k<5;k++){const r=.18+k*.145,points=[];for(let i=0;i<=48;i++){const a=i/48*Math.PI*2,rough=.025*Math.sin(a*7+k*1.5);points.push([Math.sin(a)*(r+rough),Math.cos(a)*(r+rough)]);}ribbon(points,.023);}
 }
 const g=new BufferGeometry();g.name=`worldshape-hero:${slug}`;
 g.setAttribute('position',new Float32BufferAttribute(positions,3));g.setAttribute('uv',new Float32BufferAttribute(uvs,2));g.setIndex(indices);g.computeVertexNormals();g.computeBoundingSphere();return g;
}
const SURFACE_VERTEX=`varying vec2 vUv;uniform float clock;uniform float elevation;
 void main(){vUv=uv;vec3 p=position;p.y=elevation*max(0.0,1.0-length(position.xz))+.08+.012*sin(uv.x*18.0-clock*2.0);gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.0);}`;
const SURFACE_FRAGMENT=`varying vec2 vUv;uniform float clock;uniform float identity;uniform vec3 tint;
 void main(){float edge=1.0-abs(vUv.y*2.0-1.0);float pulse=pow(max(0.0,sin(vUv.x*(18.0+identity*2.0)-clock*(1.8+identity*.4))),4.0);gl_FragColor=vec4(tint*(.9+pulse*.9),(.25+.5*edge)*(.7+.3*pulse));}`;
const MOTE_VERTEX=`uniform float clock;uniform float elevation;varying float vFade;
 void main(){vec3 p=position;float phase=fract(clock*.22+position.y);p.y=elevation*max(0.0,1.0-length(position.xz))+.1+phase*.75;vFade=sin(phase*3.14159265);vec4 mv=modelViewMatrix*vec4(p,1.0);gl_Position=projectionMatrix*mv;gl_PointSize=clamp(22.0/max(1.0,-mv.z),1.5,5.0);}`;
const MOTE_FRAGMENT=`varying float vFade;uniform vec3 tint;
 void main(){float r=length(gl_PointCoord-vec2(.5));gl_FragColor=vec4(tint*1.45,(1.0-smoothstep(.1,.5,r))*vFade*.6);}`;
export function addWorldshapeHero(v,group,uid,radius){
 const slug=(uid??'mechanics/worldshape/continental-uprising').split('/').at(-1);
 if(!WORLDSHAPE_HEROES.includes(slug)||!Number.isFinite(radius)||radius<=0)return false;
 const geo=`worldshapeHero:${slug}`,mat=`worldshapeHeroMaterial:${slug}`,points='worldshapeMotes:geometry',pointMat=`worldshapeMotes:${slug}`,elevation=ELEVATION[slug]??0;
 if(!v.geo[geo]){const g=createWorldshapeHero(slug);v.geo[geo]=g;v.resources.push(g);}
 if(!v.mat[mat]){const m=new ShaderMaterial({uniforms:{clock:v.terrainTime,elevation:{value:elevation},identity:{value:WORLDSHAPE_HEROES.indexOf(slug)},tint:{value:new Color(COLORS[slug])}},vertexShader:SURFACE_VERTEX,fragmentShader:SURFACE_FRAGMENT,transparent:true,depthWrite:false,side:DoubleSide,blending:AdditiveBlending});m.name=mat;v.mat[mat]=m;v.resources.push(m);}
 if(!v.geo[points]){const a=[];for(let i=0;i<36;i++){const angle=i*2.399,r=.16+.55*((i*11)%37)/36;a.push(Math.sin(angle)*r,(i+.5)/36,Math.cos(angle)*r);}const g=new BufferGeometry();g.name=points;g.setAttribute('position',new Float32BufferAttribute(a,3));g.computeBoundingSphere();v.geo[points]=g;v.resources.push(g);}
 if(!v.mat[pointMat]){const m=new ShaderMaterial({uniforms:{clock:v.terrainTime,elevation:{value:elevation},tint:{value:new Color(COLORS[slug])}},vertexShader:MOTE_VERTEX,fragmentShader:MOTE_FRAGMENT,transparent:true,depthWrite:false,blending:AdditiveBlending});m.name=pointMat;v.mat[pointMat]=m;v.resources.push(m);}
 const hero=v.mesh(geo,mat,group,0,0,0,radius,1,radius);hero.name=geo;hero.castShadow=false;hero.receiveShadow=false;
 const motes=new Points(v.geo[points],v.mat[pointMat]);motes.name=pointMat;motes.scale.set(radius,1,radius);motes.frustumCulled=false;group.add(motes);return true;
}
