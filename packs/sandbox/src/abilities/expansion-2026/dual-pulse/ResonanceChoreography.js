import { AdditiveBlending, BufferGeometry, Color, DoubleSide, Float32BufferAttribute, Group, Mesh, ShaderMaterial } from 'three';
import { LAYER } from '../../../core/Layers.js';
function geometry(fire){
 const p=[],uv=[];const face=(a,b,c)=>{p.push(...a,...b,...c);uv.push(0,0,1,0,.5,1);};
 if(fire){
  // A split ember crown that opens when each real pulse fires.
  for(let i=0;i<8;i++){
   const a=i*Math.PI*2/8,b=(i+.55)*Math.PI*2/8,m=(a+b)/2;
   face([Math.sin(a)*.5,0,Math.cos(a)*.5],[Math.sin(b)*.5,0,Math.cos(b)*.5],[Math.sin(m)*.73,.8,Math.cos(m)*.73]);
   face([Math.sin(b)*.5,0,Math.cos(b)*.5],[Math.sin(a)*.5,0,Math.cos(a)*.5],[Math.sin(m)*.57,.25,Math.cos(m)*.57]);
  }
 }else{
  // Striker shaft with a faceted pendulum bob, kept inside the bell silhouette.
  const tip=[0,-.58,0],lo=[-.04,-.44,0],ro=[.04,-.44,0],lt=[-.025,0,0],rt=[.025,0,0];
  face(lt,rt,lo);face(rt,ro,lo);
  const ring=[[-.11,-.46,0],[0,-.46,.11],[.11,-.46,0],[0,-.46,-.11]];
  for(let i=0;i<4;i++){face(ring[i],ring[(i+1)%4],tip);face(ring[(i+1)%4],ring[i],[0,-.35,0]);}
 }
 const g=new BufferGeometry();g.setAttribute('position',new Float32BufferAttribute(p,3));g.setAttribute('uv',new Float32BufferAttribute(uv,2));g.computeVertexNormals();return g;
}
export function createResonance(root,resources,fire){
 const own=x=>(resources.push(x),x),group=new Group();root.add(group);
 const material=own(new ShaderMaterial({transparent:true,depthWrite:false,side:DoubleSide,blending:AdditiveBlending,uniforms:{tint:{value:new Color(fire?'#ffba52':'#c8f6ff')},energy:{value:0},fade:{value:1}},
 vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:fire?'varying vec2 vUv;uniform vec3 tint;uniform float energy,fade;void main(){gl_FragColor=vec4(tint*(1.+energy),fade*(1.-vUv.y*.55)*.7);}':'varying vec2 vUv;uniform vec3 tint;uniform float energy,fade;void main(){float facet=.75+.25*sin(vUv.y*18.);gl_FragColor=vec4(tint*(1.+energy),fade*facet*.75);}'}));
 const mesh=new Mesh(own(geometry(fire)),material);mesh.layers.set(LAYER.VFX);group.add(mesh);
 return {group,mesh,fire};
}
export function updateResonance(r,{phase,q,pulse,fade,scale,amplitude,tint,reducedMotion}){
 const active=phase==='impact'||phase==='fade';r.group.visible=active;
 const energy=r.fire?Math.max(0,1-q/.15,1-Math.abs(q-pulse)/.15):Math.max(0,1-q);
 r.group.position.y=r.fire?.3:.8;r.group.scale.setScalar(scale);
 if(r.fire){r.mesh.rotation.y=reducedMotion?0:q*.5;r.mesh.scale.set(1+energy*amplitude*.2,1+energy*amplitude*.3,1+energy*amplitude*.2);}
 else {r.mesh.rotation.z=reducedMotion?0:Math.sin(q*Math.PI*6)*(1-q)*amplitude*.4;r.mesh.scale.setScalar(1);}
 r.mesh.material.uniforms.tint.value.set(tint);r.mesh.material.uniforms.energy.value=energy;r.mesh.material.uniforms.fade.value=fade;
}
