import { AdditiveBlending, BufferAttribute, BufferGeometry, Color, DoubleSide, Mesh, ShaderMaterial, Vector3 } from 'three';
import { LAYER } from '../../../core/Layers.js';
import { BurstMode } from '../../../effects/BurstSphere.js';
import { DecalType } from '../../../effects/GroundDecals.js';
const TAU=Math.PI*2,clamp=x=>Math.max(0,Math.min(1,x));

/** Each inheritance tier gains more interlocking, raised wing facets. */
export function inheritanceSealGeometry(tier){
  const count=[6,8,10][tier],p=[],uv=[],idx=[];if(count===undefined)throw new RangeError('Expected inheritance tier 0, 1 or 2');
  for(let i=0;i<count;i++){
    const a=i*TAU/count,span=Math.PI/count*.8,base=p.length/3;
    for(const [r,t,y] of [[.36,a-span,0],[.85,a-span*.5,.05],[1,a,.14+tier*.05],[.85,a+span*.5,.05],[.36,a+span,0],[.64,a,.2+tier*.05]]){
      p.push(Math.cos(t)*r,y,Math.sin(t)*r);uv.push(.5+Math.cos(t)*r*.4,.5+Math.sin(t)*r*.4);
    }
    for(let j=0;j<5;j++)idx.push(base+j,base+(j+1)%5,base+5);
  }
  const g=new BufferGeometry();g.setAttribute('position',new BufferAttribute(new Float32Array(p),3));g.setAttribute('uv',new BufferAttribute(new Float32Array(uv),2));g.setIndex(idx);g.computeVertexNormals();return g;
}
function sealMaterial(tier){return new ShaderMaterial({transparent:true,depthWrite:false,side:DoubleSide,blending:AdditiveBlending,
  uniforms:{uTime:{value:0},uFade:{value:0},uProgress:{value:0},uTier:{value:tier},uColor:{value:new Color('#68409e')},uEdge:{value:new Color('#c7a7ff')}},
  vertexShader:`varying vec2 vUv;uniform float uTime,uProgress;void main(){vUv=uv;vec3 p=position;p.y+=sin(uv.x*14.+uv.y*17.-uTime*3.)*.04*(1.-uProgress);gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);}`,
  fragmentShader:`varying vec2 vUv;uniform float uTime,uFade,uProgress,uTier;uniform vec3 uColor,uEdge;void main(){vec2 p=vUv*2.-1.;float r=length(p),a=atan(p.y,p.x);float vein=pow(max(0.,cos(a*(6.+uTier*2.)+sin(r*10.-uTime))),14.);float front=exp(-abs(r-(.7-uProgress*.4))*22.);gl_FragColor=vec4(mix(uColor,uEdge,clamp(vein*.55+front*.35,0.,1.)),(.16+vein*.45+front*.3)*uFade);\n#include <tonemapping_fragment>\n#include <colorspace_fragment>\n}`
});}

/** Transfer-only effect; no seal is produced for a refused or missing successor. */
export class InheritanceSeals {
  constructor(parent,ctx,atmosphere,ownGeometry,ownMaterial){
    this.ctx=ctx;this.atmosphere=atmosphere;this.point=new Vector3();this.primary=new Color();this.edge=new Color();this.dark=new Color();this.meshes=[];this.materials=[];this.times=[-1,-1,-1];
    for(let i=0;i<3;i++){const material=ownMaterial(sealMaterial(i)),mesh=new Mesh(ownGeometry(inheritanceSealGeometry(i)),material);mesh.visible=false;mesh.layers.set(LAYER.VFX);mesh.frustumCulled=false;parent.add(mesh);this.meshes.push(mesh);this.materials.push(material);}
  }
  reset(){this.times.fill(-1);for(const mesh of this.meshes)mesh.visible=false;}
  fire(tier,position,elapsed,c){
    const index=tier-1;if(index<0||index>=3)return;this.times[index]=elapsed;this.point.fromArray(position);this.meshes[index].position.copy(this.point).setY(.055+index*.01);
    this.primary.set(c.shadowColor);this.edge.set(c.edgeColor);this.dark.copy(this.primary).multiplyScalar(.25);
    const scale=Math.max(.25,Math.min(3,c.sealScale??1)),glow=Math.max(0,Math.min(2,c.sealGlow??.8)),radius=Math.min(4,scale*(.8+tier*.25));
    this.ctx.bursts?.spawn(BurstMode.AIR,this.point,{radius:.06,endRadius:radius,life:.35+tier*.1,intensity:glow*.6,opacity:.45,colorA:this.edge,colorB:this.primary,colorC:this.dark});
    this.ctx.decals?.spawn(DecalType.SHOCKWAVE,this.point,{radius,life:.5+tier*.12,intensity:glow*.6,width:.04+tier*.01,colorA:this.primary,colorB:this.dark});
    this.atmosphere.burst(position,8+tier*4,{radius:.3+tier*.1,speed:.4,size:.1,life:.9,spread:.75});
  }
  update(elapsed,time,fade,c,reducedMotion){
    const duration=Math.max(.1,c.sealDuration??.7),scale=Math.max(.25,Math.min(3,c.sealScale??1)),glow=Math.max(0,Math.min(2,c.sealGlow??.8));
    for(let i=0;i<3;i++){const age=this.times[i]<0?-1:elapsed-this.times[i],progress=age<0?0:clamp(age/duration),mesh=this.meshes[i],mat=this.materials[i];mesh.visible=!reducedMotion&&age>=0&&progress<1;mesh.scale.setScalar(scale*(1.2-progress*.7));mesh.rotation.y=time*(i%2?-.6:.6);mat.uniforms.uTime.value=time;mat.uniforms.uProgress.value=progress;mat.uniforms.uFade.value=fade*(1-progress)*glow;mat.uniforms.uColor.value.set(c.shadowColor);mat.uniforms.uEdge.value.set(c.edgeColor);}
  }
}
