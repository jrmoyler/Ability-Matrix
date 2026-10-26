import { AdditiveBlending, BufferGeometry, Color, DoubleSide, DynamicDrawUsage, Float32BufferAttribute, Group, InstancedMesh, Object3D, ShaderMaterial } from 'three';
import { LAYER } from '../../../core/Layers.js';

// Spark is a swept flame splinter; ice is a closed, six-faced crystal shard.
export function fragmentGeometry(fire){
 const points=[],uv=[];const face=(a,b,c)=>{points.push(...a,...b,...c);uv.push(0,0,1,0,.5,1);};
 if(fire){
  const tip=[0,.05,.34],tail=[0,.02,-.38],l=[-.06,0,0],r=[.06,0,0],top=[0,.07,0];
  face(l,r,tip);face(r,l,tail);face(l,top,tip);face(top,r,tip);face(top,l,tail);face(r,top,tail);
 }else{
  const top=[0,.44,0],bottom=[0,-.08,0],ring=[[-.07,.12,0],[0,.12,.07],[.07,.12,0],[0,.12,-.07]];
  for(let i=0;i<4;i++){face(ring[i],ring[(i+1)%4],top);face(ring[(i+1)%4],ring[i],bottom);}
 }
 const g=new BufferGeometry();g.setAttribute('position',new Float32BufferAttribute(points,3));g.setAttribute('uv',new Float32BufferAttribute(uv,2));g.computeVertexNormals();return g;
}
export function createImpactFragments(root,resources,fire){
 const own=x=>(resources.push(x),x),group=new Group();root.add(group);
 const mat=own(new ShaderMaterial({transparent:true,depthWrite:false,side:DoubleSide,blending:AdditiveBlending,uniforms:{tint:{value:new Color(fire?'#ffba52':'#bfeeff')},fade:{value:1},glow:{value:1}},
 vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*instanceMatrix*vec4(position,1.);}',
 fragmentShader:fire?'varying vec2 vUv;uniform vec3 tint;uniform float fade,glow;void main(){float edge=1.-vUv.y*.65;gl_FragColor=vec4(tint*(1.+glow),edge*fade*.75);}':'varying vec2 vUv;uniform vec3 tint;uniform float fade,glow;void main(){float facets=pow(max(0.,sin(vUv.y*17.+vUv.x*5.)),10.);gl_FragColor=vec4(tint*(1.+glow*.5+facets),fade*(1.-vUv.y*.5)*.7);}'}));
 const mesh=new InstancedMesh(own(fragmentGeometry(fire)),mat,24);mesh.count=24;mesh.instanceMatrix.setUsage(DynamicDrawUsage);mesh.frustumCulled=false;mesh.layers.set(LAYER.VFX);group.add(mesh);
 return {group,mesh,object:new Object3D(),fire};
}
/** Fire has two bursts at actual hit times. Frost shards ride the active hit wave. */
export function updateImpactFragments(f,{phase,q,pulse,radius,fade,scale,glow,tint}){
 const active=phase==='impact'||phase==='fade';f.group.visible=active;if(!active)return;
 const age=f.fire?(q>=pulse?q-pulse:q):q;
 const progress=f.fire?Math.min(1,Math.max(0,age/.24)):q;
 const intensity=f.fire?Math.max(0,1-progress):1;
 const travel=f.fire?(.16+.7*progress):q;
 for(let i=0;i<24;i++){
  const a=i*Math.PI*2/24,r=radius*travel, obj=f.object;
  obj.position.set(Math.sin(a)*r,f.fire?.12+progress*.5:.08,Math.cos(a)*r);
  obj.rotation.set(f.fire?-.2:0,a,0);
  const s=Math.max(.001,scale*(f.fire?intensity:Math.min(1,q*5)));
  obj.scale.setScalar(s);obj.updateMatrix();f.mesh.setMatrixAt(i,obj.matrix);
 }
 f.mesh.instanceMatrix.needsUpdate=true;f.mesh.material.uniforms.fade.value=fade*(f.fire?intensity:1);
 f.mesh.material.uniforms.tint.value.set(tint);f.mesh.material.uniforms.glow.value=glow;
}
