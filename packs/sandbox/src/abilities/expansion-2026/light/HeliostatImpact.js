import { AdditiveBlending, BufferAttribute, BufferGeometry, Color, DoubleSide, Mesh, ShaderMaterial, Vector3 } from 'three';
import { LAYER } from '../../../core/Layers.js';
import { BurstMode } from '../../../effects/BurstSphere.js';
import { DecalType } from '../../../effects/GroundDecals.js';
const TAU=Math.PI*2,clamp=x=>Math.max(0,Math.min(1,x));

/** An interrupted radial aperture around the real beam contact. */
export function heliostatImpactGeometry(){
  const p=[],uv=[],idx=[],count=24;
  for(let i=0;i<count;i++){
    const a=i*TAU/count,span=Math.PI/count*.65,r=i%2?1:.82,base=p.length/3;
    for(const [radius,angle,y] of [[.35,a-span,0],[r,a-span*.35,.03],[r,a+span*.35,.03],[.35,a+span,0],[.67,a,.12]]){p.push(Math.cos(angle)*radius,y,Math.sin(angle)*radius);uv.push(.5+Math.cos(angle)*radius*.4,.5+Math.sin(angle)*radius*.4);}
    idx.push(base,base+1,base+4,base+1,base+2,base+4,base+2,base+3,base+4,base+3,base,base+4);
  }
  const g=new BufferGeometry();g.setAttribute('position',new BufferAttribute(new Float32Array(p),3));g.setAttribute('uv',new BufferAttribute(new Float32Array(uv),2));g.setIndex(idx);g.computeVertexNormals();return g;
}
/** A narrow faceted lens splinter. */
export function heliostatImpactShardGeometry(){const g=new BufferGeometry();g.setAttribute('position',new BufferAttribute(new Float32Array([0,.48,0,-.08,0,0,0,-.3,0,.08,0,0,0,0,.07]),3));g.setAttribute('uv',new BufferAttribute(new Float32Array([.5,1,0,.5,.5,0,1,.5,.5,.5]),2));g.setIndex([0,1,4,1,2,4,2,3,4,3,0,4]);g.computeVertexNormals();return g;}
function impactMaterial(){return new ShaderMaterial({transparent:true,depthWrite:false,side:DoubleSide,blending:AdditiveBlending,
  uniforms:{uTime:{value:0},uFade:{value:0},uProgress:{value:0},uColor:{value:new Color('#ffe58b')},uCore:{value:new Color('#ffffff')}},
  vertexShader:`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
  fragmentShader:`varying vec2 vUv;uniform float uTime,uFade,uProgress;uniform vec3 uColor,uCore;void main(){vec2 p=vUv*2.-1.;float r=length(p),a=atan(p.y,p.x);float rays=pow(max(0.,cos(a*12.+uTime)),14.);float edge=exp(-abs(r-(.35+uProgress*.4))*22.);gl_FragColor=vec4(mix(uColor,uCore,clamp(rays*.4+edge*.4,0.,1.)),(.18+rays*.4+edge*.3)*uFade);\n#include <tonemapping_fragment>\n#include <colorspace_fragment>\n}`
});}
/** One owned contact release, independent of the live target after the hit. */
export class HeliostatImpact {
  constructor(parent,ctx,atmosphere,ownGeometry,ownMaterial){
    this.ctx=ctx;this.atmosphere=atmosphere;this.point=new Vector3();this.primary=new Color();this.core=new Color();this.dark=new Color();this.time=-1;
    this.material=ownMaterial(impactMaterial());this.halo=new Mesh(ownGeometry(heliostatImpactGeometry()),this.material);this.shards=[];const shard=ownGeometry(heliostatImpactShardGeometry());
    for(let i=0;i<12;i++)this.shards.push(new Mesh(shard,this.material));
    for(const mesh of [this.halo,...this.shards]){mesh.visible=false;mesh.layers.set(LAYER.VFX);mesh.frustumCulled=false;parent.add(mesh);}
  }
  reset(){this.time=-1;this.halo.visible=false;for(const shard of this.shards)shard.visible=false;}
  fire(position,elapsed,c){
    this.time=elapsed;this.point.fromArray(position);this.primary.set(c.rayColor);this.core.set(c.coreColor);this.dark.copy(this.primary).multiplyScalar(.35);
    const scale=Math.max(.25,Math.min(3,c.impactScale??1)),glow=Math.max(0,Math.min(2,c.impactGlow??.8)),radius=Math.min(4,scale*1.2);
    this.ctx.bursts?.spawn(BurstMode.STORM,this.point,{radius:.06,endRadius:radius,life:.5,intensity:glow,opacity:.5,colorA:this.core,colorB:this.primary,colorC:this.dark});
    this.ctx.decals?.spawn(DecalType.SHOCKWAVE,this.point,{radius,life:.7,intensity:glow*.7,width:.05,colorA:this.primary,colorB:this.dark});
    this.atmosphere.burst(position,24,{radius:.25,speed:2.2,size:.07,life:.65,spread:.35});
  }
  update(elapsed,time,fade,c,reducedMotion){
    const age=this.time<0?-1:elapsed-this.time,duration=Math.max(.1,c.impactFxDuration??.8),progress=age<0?0:clamp(age/duration),scale=Math.max(.25,Math.min(3,c.impactScale??1)),glow=Math.max(0,Math.min(2,c.impactGlow??.8)),visible=!reducedMotion&&age>=0&&progress<1;
    this.halo.visible=visible;this.halo.position.copy(this.point).setY(.06);this.halo.scale.setScalar(scale*(.4+progress));this.halo.rotation.y=time*.5;
    for(let i=0;i<this.shards.length;i++){const shard=this.shards[i],angle=i*2.399963;shard.visible=visible;shard.position.set(this.point.x+Math.cos(angle)*progress*scale,this.point.y+.15+progress*(.5+(i%3)*.18),this.point.z+Math.sin(angle)*progress*scale);shard.rotation.set(angle*.3+time,angle*.7,angle+time);shard.scale.setScalar((.45+(i%2)*.25)*scale*(1-progress));}
    this.material.uniforms.uTime.value=time;this.material.uniforms.uProgress.value=progress;this.material.uniforms.uFade.value=fade*(1-progress)*glow;this.material.uniforms.uColor.value.set(c.rayColor);this.material.uniforms.uCore.value.set(c.coreColor);
  }
}
