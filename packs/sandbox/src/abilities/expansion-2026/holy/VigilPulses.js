import { AdditiveBlending, BufferAttribute, BufferGeometry, Color, DoubleSide, Mesh, PlaneGeometry, ShaderMaterial, Vector3 } from 'three';
import { LAYER } from '../../../core/Layers.js';
import { BurstMode } from '../../../effects/BurstSphere.js';
import { DecalType } from '../../../effects/GroundDecals.js';
const TAU=Math.PI*2,clamp=x=>Math.max(0,Math.min(1,x));

/** Twelve beveled flame petals, each built as a raised four-sided facet. */
export function vigilPulseGeometry(){
  const p=[],uv=[],idx=[],count=12;
  for(let i=0;i<count;i++){
    const a=i*TAU/count,span=Math.PI/count*.72,base=p.length/3;
    for(const [r,t,y] of [[.3,a,0],[.64,a-span,.025],[1,a,.08],[.64,a+span,.025],[.62,a,.16]]){
      p.push(Math.cos(t)*r,y,Math.sin(t)*r);uv.push(.5+Math.cos(t)*r*.4,.5+Math.sin(t)*r*.4);
    }
    idx.push(base,base+1,base+4,base+1,base+2,base+4,base+2,base+3,base+4,base+3,base,base+4);
  }
  const g=new BufferGeometry();g.setAttribute('position',new BufferAttribute(new Float32Array(p),3));g.setAttribute('uv',new BufferAttribute(new Float32Array(uv),2));g.setIndex(idx);g.computeVertexNormals();return g;
}
function pulseMaterial(){return new ShaderMaterial({transparent:true,depthWrite:false,side:DoubleSide,blending:AdditiveBlending,
  uniforms:{uTime:{value:0},uFade:{value:0},uProgress:{value:0},uColor:{value:new Color('#ffe9ac')},uCore:{value:new Color('#ffffff')}},
  vertexShader:`varying vec2 vUv;uniform float uTime,uProgress;void main(){vUv=uv;vec3 p=position;p.y+=sin(uv.x*16.+uv.y*13.-uTime*2.)*.025*(1.-uProgress);gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);}`,
  fragmentShader:`varying vec2 vUv;uniform float uTime,uFade,uProgress;uniform vec3 uColor,uCore;void main(){vec2 p=vUv*2.-1.;float r=length(p),a=atan(p.y,p.x);float ribs=pow(max(0.,cos(a*12.+uTime*.3)),12.);float ring=exp(-abs(r-(.3+uProgress*.45))*22.);gl_FragColor=vec4(mix(uColor,uCore,clamp(ribs*.35+ring*.35,0.,1.)),(.18+ribs*.35+ring*.3)*uFade);\n#include <tonemapping_fragment>\n#include <colorspace_fragment>\n}`
});}

/** A brief full-radius field makes the immediate pulse footprint visible. */
function footprintMaterial(){return new ShaderMaterial({transparent:true,depthWrite:false,side:DoubleSide,blending:AdditiveBlending,
  uniforms:{uFade:{value:0},uColor:{value:new Color('#ffe9ac')},uCore:{value:new Color('#ffffff')}},
  vertexShader:`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
  fragmentShader:`varying vec2 vUv;uniform float uFade;uniform vec3 uColor,uCore;void main(){vec2 p=vUv*2.-1.;float r=length(p);float inside=1.-smoothstep(.9,1.,r);float edge=exp(-abs(r-.88)*35.);float center=exp(-r*3.);gl_FragColor=vec4(mix(uColor,uCore,center*.35+edge*.25),inside*(.16+edge*.35+center*.12)*uFade);
#include <tonemapping_fragment>
#include <colorspace_fragment>
}`
});}

/** Three independent pooled pulse glyphs track the expanding sanctuary curtains. */
export class VigilPulses {
  constructor(parent,ctx,atmosphere,ownGeometry,ownMaterial){
    this.ctx=ctx;this.atmosphere=atmosphere;this.point=new Vector3();this.primary=new Color();this.core=new Color();this.dark=new Color();this.meshes=[];this.materials=[];this.footprints=[];this.footprintMaterials=[];this.times=[-1,-1,-1];this.next=0;
    const geometry=ownGeometry(vigilPulseGeometry()),quad=ownGeometry(new PlaneGeometry(2,2));for(let i=0;i<3;i++){const mat=ownMaterial(pulseMaterial()),mesh=new Mesh(geometry,mat),flashMat=ownMaterial(footprintMaterial()),flash=new Mesh(quad,flashMat);mesh.visible=false;flash.visible=false;flash.rotation.x=-Math.PI/2;for(const part of [mesh,flash]){part.layers.set(LAYER.VFX);part.frustumCulled=false;parent.add(part);}this.meshes.push(mesh);this.materials.push(mat);this.footprints.push(flash);this.footprintMaterials.push(flashMat);}
  }
  reset(){this.times.fill(-1);this.next=0;for(const mesh of this.meshes)mesh.visible=false;for(const flash of this.footprints)flash.visible=false;}
  fire(position,elapsed,c){
    const slot=this.next;this.next=(slot+1)%this.meshes.length;this.times[slot]=elapsed;this.point.fromArray(position);this.meshes[slot].position.copy(this.point).setY(.06+slot*.008);this.footprints[slot].position.copy(this.point).setY(.045+slot*.006);
    this.primary.set(c.holyColor);this.core.set(c.coreColor);this.dark.copy(this.primary).multiplyScalar(.35);
    const radius=Math.min(8,Math.max(.2,c.zoneRadius)),glow=Math.max(0,Math.min(2,c.glyphGlow??.75));
    this.ctx.bursts?.spawn(BurstMode.AIR,this.point,{radius:.08,endRadius:radius,life:.55,intensity:glow*.55,opacity:.45,colorA:this.core,colorB:this.primary,colorC:this.dark});
    this.ctx.decals?.spawn(DecalType.SHOCKWAVE,this.point,{radius,life:.7,intensity:glow*.6,width:.06,colorA:this.primary,colorB:this.dark});
    this.atmosphere.burst(position,18,{radius:radius*.5,speed:.8,size:.1,life:1.1,spread:.6});
  }
  update(elapsed,time,fade,c,reducedMotion){
    const duration=Math.max(.1,c.waveDuration??.7),radius=Math.max(.2,Math.min(8,c.zoneRadius)),glow=Math.max(0,Math.min(2,c.glyphGlow??.75));
    for(let i=0;i<this.meshes.length;i++){const age=this.times[i]<0?-1:elapsed-this.times[i],progress=age<0?0:clamp(age/duration),mesh=this.meshes[i],mat=this.materials[i];mesh.visible=!reducedMotion&&age>=0&&progress<1;mesh.scale.setScalar(Math.max(.001,radius*progress));mesh.rotation.y=time*(i%2?-.2:.2);mesh.position.y=.06+i*.008+(c.glyphRise??.1)*progress;mat.uniforms.uTime.value=time;mat.uniforms.uProgress.value=progress;mat.uniforms.uFade.value=fade*(1-progress)*glow;mat.uniforms.uColor.value.set(c.holyColor);mat.uniforms.uCore.value.set(c.coreColor);const flash=this.footprints[i],flashMat=this.footprintMaterials[i],flashDuration=Math.max(.05,c.footprintDuration??.22),flashProgress=age<0?0:clamp(age/flashDuration);flash.visible=!reducedMotion&&age>=0&&flashProgress<1;flash.scale.setScalar(radius);flashMat.uniforms.uFade.value=fade*(1-flashProgress)*Math.max(0,Math.min(2,c.footprintGlow??.8));flashMat.uniforms.uColor.value.set(c.holyColor);flashMat.uniforms.uCore.value.set(c.coreColor);}
  }
}
