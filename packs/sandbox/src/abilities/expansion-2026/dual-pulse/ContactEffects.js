import { AdditiveBlending, BufferGeometry, Color, DoubleSide, DynamicDrawUsage, Float32BufferAttribute, Group, InstancedMesh, Object3D, ShaderMaterial } from 'three';
import { LAYER } from '../../../core/Layers.js';
const CAPACITY=16;
/** Fire bursts are flat, forked starlets; frost contacts are a radial crown of spikes. */
export function contactGeometry(fire){
 const v=[],uv=[];const tri=(a,b,c)=>{v.push(...a,...b,...c);uv.push(0,0,1,0,.5,1);};
 const count=fire?8:6;
 for(let i=0;i<count;i++){
  const a=i*Math.PI*2/count,s=Math.sin(a),c=Math.cos(a),x=c,z=-s;
  if(fire){
   tri([x*-.025,.04,z*-.025],[x*.025,.04,z*.025],[s*.36,.07,c*.36]);
   tri([s*.15,.05,c*.15],[s*.23+x*.09,.06,c*.23+z*.09],[s*.32,.07,c*.32]);
  }else{
   tri([x*-.035,.02,z*-.035],[x*.035,.02,z*.035],[s*.18,.42,c*.18]);
   tri([s*.12,.02,c*.12],[s*.2,.02,c*.2],[s*.18,.42,c*.18]);
  }
 }
 const geo=new BufferGeometry();geo.setAttribute('position',new Float32BufferAttribute(v,3));geo.setAttribute('uv',new Float32BufferAttribute(uv,2));geo.computeVertexNormals();return geo;
}
export function createContacts(root,resources,fire){
 const own=x=>(resources.push(x),x),group=new Group();root.add(group);
 const mat=own(new ShaderMaterial({transparent:true,depthWrite:false,side:DoubleSide,blending:AdditiveBlending,uniforms:{tint:{value:new Color(fire?'#ffc150':'#bcefff')},opacity:{value:1}},vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*instanceMatrix*vec4(position,1.);}',fragmentShader:fire?'varying vec2 vUv;uniform vec3 tint;uniform float opacity;void main(){gl_FragColor=vec4(tint*1.7,(1.-vUv.y*.75)*opacity);}':'varying vec2 vUv;uniform vec3 tint;uniform float opacity;void main(){float edge=.7+.3*sin(vUv.y*18.);gl_FragColor=vec4(tint*1.4,edge*(1.-vUv.y*.55)*opacity);}'}));
 const mesh=new InstancedMesh(own(contactGeometry(fire)),mat,CAPACITY);mesh.instanceMatrix.setUsage(DynamicDrawUsage);mesh.frustumCulled=false;mesh.layers.set(LAYER.VFX);mesh.count=0;group.add(mesh);
 return {group,mesh,states:Array.from({length:CAPACITY},()=>({x:0,z:0,age:0,live:false})),next:0,object:new Object3D(),fire};
}
export function clearContacts(c){for(const item of c.states)item.live=false;c.mesh.count=0;c.next=0;}
export function addContact(c,x,z){const state=c.states[c.next];c.next=(c.next+1)%CAPACITY;state.x=x;state.z=z;state.age=0;state.live=true;}
/** Delta zero renders current state without advancing or emitting. */
export function updateContacts(c,dt,tint,scale,opacity,reducedMotion=false){
 let n=0;for(const state of c.states){
  if(!state.live)continue;state.age+=Math.max(0,dt);const t=state.age/(c.fire?.34:.62);
  if(t>=1){state.live=false;continue;}
  const obj=c.object;obj.position.set(state.x,.06,state.z);obj.rotation.set(0,c.fire&&!reducedMotion?t*1.5:0,0);
  obj.scale.setScalar(Math.max(.001,scale*(c.fire?(1+t*.5)*(1-t):Math.sin(Math.PI*Math.min(.5,t))* (1-t*.35))));obj.updateMatrix();c.mesh.setMatrixAt(n++,obj.matrix);
 }
 c.mesh.count=n;c.mesh.instanceMatrix.needsUpdate=true;c.mesh.material.uniforms.tint.value.set(tint);c.mesh.material.uniforms.opacity.value=opacity;
}
