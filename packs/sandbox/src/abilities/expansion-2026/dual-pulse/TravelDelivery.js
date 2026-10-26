import { AdditiveBlending, BufferGeometry, DynamicDrawUsage, Float32BufferAttribute, Group, Line, LineBasicMaterial, Mesh, ShaderMaterial } from 'three';
import { LAYER } from '../../../core/Layers.js';

/** Flying flame wedge and three-sided glacial needle have independent profiles. */
export function deliveryGeometry(fire){
 const v=[],uv=[];const face=(a,b,c)=>{v.push(...a,...b,...c);uv.push(0,0,1,0,.5,1);};
 if(fire){
  const tip=[0,.45,.65],base=[[0,.16,-.42],[.2,.26,-.3],[0,.45,-.28],[-.2,.26,-.3]];
  for(let i=0;i<4;i++){face(base[i],base[(i+1)%4],tip);face(base[(i+1)%4],base[i],[0,.3,-.58]);}
  for(let i=0;i<6;i++){const a=i*Math.PI/3,s=Math.sin(a),c=Math.cos(a);face([s*.08,.3+c*.08,-.28],[s*.15,.3+c*.15,-.52],[s*.035,.3+c*.035,-.9]);}
 }else{
  const tip=[0,.32,.8],back=[0,.32,-.58];const ring=[];
  for(let i=0;i<6;i++){const a=i*Math.PI/3;ring.push([Math.sin(a)*.16,.32+Math.cos(a)*.16,0]);}
  for(let i=0;i<6;i++){face(ring[i],ring[(i+1)%6],tip);face(ring[(i+1)%6],ring[i],back);}
  for(let i=0;i<3;i++){const a=i*Math.PI*2/3,s=Math.sin(a),c=Math.cos(a);face([s*.14,.32+c*.14,-.15],[s*.42,.32+c*.42,-.32],[s*.1,.32+c*.1,.25]);}
 }
 const g=new BufferGeometry();g.setAttribute('position',new Float32BufferAttribute(v,3));g.setAttribute('uv',new Float32BufferAttribute(uv,2));g.computeVertexNormals();return g;
}
export function createTravelDelivery(parent,resources,fire){
 const own=x=>(resources.push(x),x),group=new Group();parent.add(group);
 const mat=own(new ShaderMaterial({transparent:true,depthWrite:false,blending:AdditiveBlending,uniforms:{clock:{value:0}},vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:fire?'varying vec2 vUv;uniform float clock;void main(){float a=.5+.5*sin(vUv.y*14.-clock*7.);gl_FragColor=vec4(1.,.15+.55*vUv.y,.015,(1.-vUv.y*.5)*(.6+.4*a));}':'varying vec2 vUv;uniform float clock;void main(){float a=pow(max(0.,sin(vUv.y*26.+clock)),12.);gl_FragColor=vec4(.45+a*.5,.8+a*.2,1.,.75);}'}));
 const mesh=new Mesh(own(deliveryGeometry(fire)),mat);mesh.layers.set(LAYER.VFX);group.add(mesh);
 const geo=own(new BufferGeometry()),attr=new Float32BufferAttribute(new Float32Array(48*3),3);attr.setUsage(DynamicDrawUsage);geo.setAttribute('position',attr);geo.setDrawRange(0,0);
 const line=new Line(geo,own(new LineBasicMaterial({color:fire?0xff8b35:0xaeeeff,transparent:true,opacity:.8,depthWrite:false,blending:AdditiveBlending})));
 line.layers.set(LAYER.VFX);line.frustumCulled=false;parent.add(line);
 return {group,mesh,line,count:0,fire};
}
export function resetTravelDelivery(d){d.count=0;d.line.geometry.setDrawRange(0,0);d.group.visible=true;d.line.visible=true;}
export function updateTravelDelivery(d,position,direction,dt,clock,tint,scale){
 d.group.position.copy(position);d.group.rotation.y=Math.atan2(direction.x,direction.z);d.group.scale.setScalar(scale);d.mesh.material.uniforms.clock.value=clock;d.line.material.color.set(tint);
 const attr=d.line.geometry.attributes.position;
 if(dt>0){if(d.count===48){attr.array.copyWithin(0,3);d.count--;}attr.setXYZ(d.count++,position.x,position.y+.25,position.z);}
 attr.needsUpdate=true;d.line.geometry.setDrawRange(0,d.count);
}
export function endTravelDelivery(d){d.group.visible=false;d.line.visible=false;d.count=0;d.line.geometry.setDrawRange(0,0);}
