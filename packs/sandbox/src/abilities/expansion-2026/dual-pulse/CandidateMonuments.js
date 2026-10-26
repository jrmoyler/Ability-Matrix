import { AdditiveBlending, BufferGeometry, Color, DoubleSide, Float32BufferAttribute, Group, Mesh, MeshStandardMaterial, ShaderMaterial } from 'three';
import { LAYER } from '../../../core/Layers.js';

// A closed, faceted coal with four raised fire veins.
export function emberHeartGeometry(){
 const p=[];const tri=(a,b,c)=>p.push(...a,...b,...c),n=12;
 for(let i=0;i<n;i++){
  const a=i*Math.PI*2/n,b=(i+1)*Math.PI*2/n;
  const ring=(angle,y,r)=>[Math.cos(angle)*r,y,Math.sin(angle)*r];
  const a0=ring(a,.25,.28),b0=ring(b,.25,.28),a1=ring(a,.64,.22),b1=ring(b,.64,.22);
  tri([0,0,0],b0,a0);tri(a0,b0,a1);tri(b0,b1,a1);tri(a1,b1,[0,.85,0]);
  if(i%3===0)tri(ring(a-.08,.27,.3),ring(a+.08,.27,.3),ring(a,.76,.27));
 }
 const g=new BufferGeometry();g.setAttribute('position',new Float32BufferAttribute(p,3));g.computeVertexNormals();return g;
}
// A solid bell, scalloped on its rim and hollowed beneath the lip.
export function glacierBellGeometry(){
 const p=[],n=36;const tri=(a,b,c)=>p.push(...a,...b,...c);
 const profile=[[0,.83],[.13,.79],[.22,.65],[.28,.4],[.34,.14],[.38,.06],[.29,.09],[.24,.2]];
 const v=(i,j)=>{const a=i*Math.PI*2/n,[r,y]=profile[j],flute=1+.07*Math.cos(a*6);return [Math.sin(a)*r*flute,y,Math.cos(a)*r*flute];};
 for(let i=0;i<n;i++)for(let j=0;j<profile.length-1;j++){
  const a=v(i,j),b=v(i+1,j),c=v(i,j+1),d=v(i+1,j+1);tri(a,c,b);tri(b,c,d);
 }
 const g=new BufferGeometry();g.setAttribute('position',new Float32BufferAttribute(p,3));g.computeVertexNormals();return g;
}
function shaftGeometry(fire){
 const v=[],uv=[];const count=fire?8:6;
 for(let i=0;i<count;i++){
  const a=i*Math.PI*2/count,s=Math.sin(a),c=Math.cos(a),r=fire?.3:.35;
  const tip=fire?[s*.48,1.05,c*.48]:[s*.72,.1,c*.72];
  v.push(s*r+c*.035,.18,c*r-s*.035,s*r-c*.035,.18,c*r+s*.035,...tip);uv.push(0,0,1,0,.5,1);
 }
 const g=new BufferGeometry();g.setAttribute('position',new Float32BufferAttribute(v,3));g.setAttribute('uv',new Float32BufferAttribute(uv,2));g.computeVertexNormals();return g;
}
export function createCandidateMonument(root,resources,fire){
 const own=x=>(resources.push(x),x),group=new Group();root.add(group);
 const solid=new Mesh(own(fire?emberHeartGeometry():glacierBellGeometry()),own(new MeshStandardMaterial({color:fire?0x3e160e:0x477691,emissive:fire?0xa93108:0x183e65,emissiveIntensity:.7,metalness:fire?.3:.45,roughness:fire?.48:.22,transparent:true,opacity:1,depthWrite:false,side:DoubleSide})));
 solid.layers.set(LAYER.VFX);group.add(solid);
 const shader=new ShaderMaterial({transparent:true,depthWrite:false,side:DoubleSide,blending:AdditiveBlending,uniforms:{clock:{value:0},power:{value:0},fade:{value:1},tint:{value:new Color(fire?'#ff9a28':'#adf4ff')}},
 vertexShader:'varying vec2 vUv;uniform float power;void main(){vUv=uv;vec3 p=position;p.y*=.45+power*.55;gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);}',
 fragmentShader:fire?'varying vec2 vUv;uniform float clock,power,fade;uniform vec3 tint;void main(){float flicker=pow(max(0.,sin(vUv.y*18.-clock*6.)),4.);gl_FragColor=vec4(tint*(1.+flicker+power),fade*(1.-vUv.y)*.7);}':'varying vec2 vUv;uniform float clock,power,fade;uniform vec3 tint;void main(){float glint=pow(max(0.,sin(vUv.y*32.+clock*2.)),16.);gl_FragColor=vec4(tint*(1.+glint),fade*(1.-vUv.y)*(.3+.5*power));}'});
 const shafts=new Mesh(own(shaftGeometry(fire)),own(shader));shafts.layers.set(LAYER.VFX);group.add(shafts);
 return {group,solid,shafts,fire};
}
export function updateCandidateMonument(m,{q,phase,pulse,fade,clock,tint,scale,glow}){
 const active=phase==='impact'||phase==='fade';
 const energy=m.fire?(active?Math.max(0,1-q/.14,1-Math.abs(q-pulse)/.14):.12):(active?q:0);
 m.group.scale.setScalar(scale);m.group.position.y=m.fire?.22:.1;
 m.solid.material.opacity=fade;m.solid.material.emissiveIntensity=glow*(.4+energy);
 m.shafts.material.uniforms.clock.value=clock;m.shafts.material.uniforms.power.value=energy;
 m.shafts.material.uniforms.fade.value=fade;m.shafts.material.uniforms.tint.value.set(tint);
}
