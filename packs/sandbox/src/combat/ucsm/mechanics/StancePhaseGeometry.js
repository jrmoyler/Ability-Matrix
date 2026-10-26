import { AdditiveBlending, BufferGeometry, Color, DoubleSide, Float32BufferAttribute, Points, ShaderMaterial } from 'three';

/** A distinct authored outline for every elemental form and combat phase.
 * Finisher-space coordinates are normalised to the gameplay radius. */
export const STANCE_PHASES=Object.freeze(['anticipation','block','reversal','finisher']);
export const STANCE_PHASE_ELEMENTS=Object.freeze(['fire','frost','storm','water','earth','force']);
const PALETTE={fire:'#ff822d',frost:'#afeaff',storm:'#baa9ff',water:'#40c8ee',earth:'#d6a56c',force:'#a6e8fa'};
const COUNT={anticipation:6,block:8,reversal:5,finisher:12};
const RADIUS={anticipation:.55,block:.65,reversal:.68,finisher:.78};
const HEIGHT={anticipation:.22,block:1.35,reversal:.85,finisher:.42};
export function createStancePhaseSurface(element,phase){
 if(!STANCE_PHASE_ELEMENTS.includes(element)||!STANCE_PHASES.includes(phase))throw new Error('Unknown stance phase');
 const positions=[],uvs=[],indices=[],count=COUNT[phase],radius=RADIUS[phase],height=HEIGHT[phase];
 const ribbon=(points,width)=>{
  const start=positions.length/3;
  for(let i=0;i<points.length;i++){
   const [x,y,z]=points[i],p=points[Math.max(0,i-1)],n=points[Math.min(points.length-1,i+1)],dx=n[0]-p[0],dz=n[2]-p[2],d=Math.hypot(dx,dz)||1;
   const w=width*(.3+.7*Math.sin(Math.PI*(i+.5)/points.length));
   positions.push(x-dz/d*w,y,z+dx/d*w,x+dz/d*w,y,z-dx/d*w);uvs.push(i/(points.length-1),0,i/(points.length-1),1);
   if(i){const a=start+(i-1)*2,b=start+i*2;indices.push(a,b,a+1,b,b+1,a+1);}
  }
 };
 const facet=(x,y,z,w,h,d,lean)=>{
  const start=positions.length/3,points=[[x-w,y,z],[x,y-h,z],[x+w,y,z],[x+lean,y+h,z],[x,y,z+d],[x,y,z-d]];
  for(const [px,py,pz] of points){positions.push(px,py,pz);uvs.push(Math.max(0,Math.min(1,(px-x)/(2*w)+.5)),Math.max(0,Math.min(1,(py-y)/(2*h)+.5)));}
  for(const f of [[0,1,4],[1,2,4],[2,3,4],[3,0,4],[1,0,5],[2,1,5],[3,2,5],[0,3,5]])indices.push(...f.map(i=>start+i));
 };
 for(let k=0;k<count;k++){
  const angle=k*Math.PI*2/count, sx=Math.sin(angle),sz=Math.cos(angle);
  if(element==='frost'||element==='earth'||element==='force'){
   const r=radius*.78, x=sx*r,z=sz*r;
   const w=element==='earth'?.12:element==='force'?.10:.075;
   const h=height*(element==='earth'?.4:element==='force'?.5:.6);
   facet(x,h+.06,z,w,h,element==='force'?.04:.1,sx*.025);
   if(element==='frost')facet(sx*r*.76,h*.55+.06,sz*r*.76,.035,h*.5,.05,0);
  }else{
   const points=[];
   for(let i=0;i<=18;i++){
    const t=i/18,curve=element==='storm'?((i%2?1:-1)*.045*(1-t)):element==='water'?Math.sin(t*6+k)*.07:.04*Math.sin(t*9+k)*t;
    const r=radius*(.2+.7*t),a=angle+(element==='water'?t*.32:0);
    points.push([Math.sin(a)*r+sz*curve,.05+height*Math.sin(Math.PI*t*.75),Math.cos(a)*r-sx*curve]);
   }
   ribbon(points,element==='storm'?.025:element==='water'?.05:.045);
  }
 }
 const g=new BufferGeometry();g.name=`stance-phase:${element}:${phase}`;
 g.setAttribute('position',new Float32BufferAttribute(positions,3));g.setAttribute('uv',new Float32BufferAttribute(uvs,2));g.setIndex(indices);g.computeVertexNormals();g.computeBoundingSphere();return g;
}
const VERTEX=`varying vec2 vUv;uniform float clock;uniform float identity;uniform float phase;
 void main(){vUv=uv;vec3 p=position;p.y+=0.025*sin(uv.x*(13.0+phase)-clock*(2.0+identity*.25));gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.0);}`;
const FRAGMENT=`varying vec2 vUv;uniform float clock;uniform float identity;uniform float phase;uniform vec3 tint;
 void main(){float edge=1.0-abs(vUv.y*2.0-1.0);float beat=pow(max(0.0,sin(vUv.x*(15.0+phase*2.0)-clock*(2.1+identity*.3))),4.0);gl_FragColor=vec4(tint*(1.0+beat*.8),(.25+.55*edge)*(.7+.3*beat));}`;
const POINT_VERTEX=`uniform float clock;varying float vFade;
 void main(){vec3 p=position;float phase=fract(clock*.28+position.y*.31);p.y+=phase*.32;vFade=sin(phase*3.14159265);vec4 mv=modelViewMatrix*vec4(p,1.0);gl_Position=projectionMatrix*mv;gl_PointSize=clamp(18.0/max(1.0,-mv.z),1.5,5.0);}`;
const POINT_FRAGMENT=`varying float vFade;uniform vec3 tint;void main(){float r=length(gl_PointCoord-vec2(.5));gl_FragColor=vec4(tint*1.4,(1.0-smoothstep(.1,.5,r))*vFade*.6);}`;
export function addStancePhaseSurface(v,group,element,phase){
 if(!STANCE_PHASE_ELEMENTS.includes(element)||!STANCE_PHASES.includes(phase))return false;
 const key=`stancePhaseHero:${element}:${phase}`,mat=`stancePhaseMaterial:${element}:${phase}`,points=`stancePhaseMotes:${element}:${phase}`,pointMat=`stancePhaseMoteMaterial:${element}`;
 if(!v.geo[key]){const g=createStancePhaseSurface(element,phase);v.geo[key]=g;v.resources.push(g);}
 if(!v.mat[mat]){const m=new ShaderMaterial({uniforms:{clock:v.terrainTime,identity:{value:STANCE_PHASE_ELEMENTS.indexOf(element)},phase:{value:STANCE_PHASES.indexOf(phase)},tint:{value:new Color(PALETTE[element])}},vertexShader:VERTEX,fragmentShader:FRAGMENT,transparent:true,depthWrite:false,side:DoubleSide,blending:AdditiveBlending});m.name=mat;v.mat[mat]=m;v.resources.push(m);}
 if(!v.geo[points]){const source=v.geo[key].getAttribute('position'),a=[];for(let i=0;i<32;i++){const j=Math.floor(i*source.count/32);a.push(source.getX(j),source.getY(j),source.getZ(j));}const g=new BufferGeometry();g.name=points;g.setAttribute('position',new Float32BufferAttribute(a,3));g.computeBoundingSphere();v.geo[points]=g;v.resources.push(g);}
 if(!v.mat[pointMat]){const m=new ShaderMaterial({uniforms:{clock:v.terrainTime,tint:{value:new Color(PALETTE[element])}},vertexShader:POINT_VERTEX,fragmentShader:POINT_FRAGMENT,transparent:true,depthWrite:false,blending:AdditiveBlending});m.name=pointMat;v.mat[pointMat]=m;v.resources.push(m);}
 const hero=v.mesh(key,mat,group);hero.name=key;hero.castShadow=false;hero.receiveShadow=false;
 const motes=new Points(v.geo[points],v.mat[pointMat]);motes.name=points;motes.frustumCulled=false;group.add(motes);return true;
}
