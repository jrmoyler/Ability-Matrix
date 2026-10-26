import { AdditiveBlending, BufferAttribute, BufferGeometry, Color, DoubleSide, Mesh, ShaderMaterial, Vector3 } from 'three';
import { LAYER } from '../../../core/Layers.js';
import { BurstMode } from '../../../effects/BurstSphere.js';
import { DecalType } from '../../../effects/GroundDecals.js';
const TAU=Math.PI*2,clamp=x=>Math.max(0,Math.min(1,x));

/** A warped ring of alternating narrow mass lenses, made around one target. */
export function gravityContactGeometry(){
  const p=[],uv=[],indices=[],count=24;
  for(let i=0;i<count;i++){
    const a=i*TAU/count,half=Math.PI/count*.7,r0=.45,r1=i%2?.85:1.05,base=p.length/3;
    for(const [r,t,y] of [[r0,a-half,0],[r1,a-half*.4,.08],[r1,a+half*.4,.08],[r0,a+half,0],[.72,a,.18]]){p.push(Math.cos(t)*r,y,Math.sin(t)*r);uv.push(.5+Math.cos(t)*r*.4,.5+Math.sin(t)*r*.4);}
    indices.push(base,base+1,base+4,base+1,base+2,base+4,base+2,base+3,base+4,base+3,base,base+4);
  }
  const g=new BufferGeometry();g.setAttribute('position',new BufferAttribute(new Float32Array(p),3));g.setAttribute('uv',new BufferAttribute(new Float32Array(uv),2));g.setIndex(indices);g.computeVertexNormals();return g;
}
function contactMaterial(){return new ShaderMaterial({transparent:true,depthWrite:false,side:DoubleSide,blending:AdditiveBlending,
  uniforms:{uTime:{value:0},uFade:{value:0},uProgress:{value:0},uColor:{value:new Color('#9f8fbe')},uCore:{value:new Color('#efe4ff')}},
  vertexShader:`varying vec2 vUv;uniform float uTime,uProgress;void main(){vUv=uv;vec3 p=position;p.y+=sin(uv.x*21.+uv.y*13.-uTime*3.)*.035*(1.-uProgress);gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);}`,
  fragmentShader:`varying vec2 vUv;uniform float uTime,uFade,uProgress;uniform vec3 uColor,uCore;void main(){vec2 p=vUv*2.-1.;float r=length(p),a=atan(p.y,p.x);float lens=pow(max(0.,cos(a*12.+uTime)),16.);float wave=exp(-abs(r-(.8-uProgress*.45))*26.);gl_FragColor=vec4(mix(uColor,uCore,clamp(lens*.35+wave*.4,0.,1.)),(.16+lens*.4+wave*.35)*uFade);\n#include <tonemapping_fragment>\n#include <colorspace_fragment>\n}`
});}

/** Eight pooled target-centered contacts; combat remains owned by the cast. */
export class GravityContacts {
  constructor(parent,ctx,atmosphere,ownGeometry,ownMaterial){
    this.ctx=ctx;this.atmosphere=atmosphere;this.point=new Vector3();this.primary=new Color();this.core=new Color();this.dark=new Color();this.meshes=[];this.materials=[];this.times=Array(8).fill(-1);this.next=0;
    const geometry=ownGeometry(gravityContactGeometry());
    for(let i=0;i<8;i++){const mat=ownMaterial(contactMaterial()),mesh=new Mesh(geometry,mat);mesh.visible=false;mesh.layers.set(LAYER.VFX);mesh.frustumCulled=false;parent.add(mesh);this.meshes.push(mesh);this.materials.push(mat);}
  }
  reset(){this.times.fill(-1);this.next=0;for(const mesh of this.meshes)mesh.visible=false;}
  /** Fire only after a pulse event has been accepted; cap visible contacts at three. */
  fire(actors,elapsed,c){
    const scale=Math.max(.2,Math.min(3,c.contactScale??1)),glow=Math.max(0,Math.min(2,c.contactGlow??.8));
    this.primary.set(c.gravityColor);this.core.set(c.coreColor);this.dark.copy(this.primary).multiplyScalar(.3);
    for(const actor of actors.slice(0,3)){
      const slot=this.next;this.next=(slot+1)%this.meshes.length;this.times[slot]=elapsed;this.point.fromArray(actor.position);this.meshes[slot].position.copy(this.point).setY(.06);
      const radius=Math.min(4,Math.max(.2,c.zoneRadius*scale));
      this.ctx.bursts?.spawn(BurstMode.STORM,this.point,{radius:.06,endRadius:radius,life:.5,intensity:glow*.65,opacity:.5,colorA:this.core,colorB:this.primary,colorC:this.dark});
      this.ctx.decals?.spawn(DecalType.CRACK,this.point,{radius,life:.7,intensity:glow*.65,width:.05,colorA:this.primary,colorB:this.dark});
      this.atmosphere.burst(actor.position,8,{radius:radius*.25,speed:.55,size:.09,life:.8,spread:.5});
    }
  }
  update(elapsed,time,fade,c,reducedMotion){
    const duration=Math.max(.1,c.contactDuration??.6),scale=Math.max(.2,Math.min(3,c.contactScale??1)),glow=Math.max(0,Math.min(2,c.contactGlow??.8));
    for(let i=0;i<this.meshes.length;i++){
      const age=this.times[i]<0?-1:elapsed-this.times[i],progress=age<0?0:clamp(age/duration),mesh=this.meshes[i],mat=this.materials[i];
      mesh.visible=!reducedMotion&&age>=0&&progress<1;mesh.scale.setScalar(scale*(1.25-progress*.8));mesh.rotation.y=time*(i%2?-.7:.7);
      mat.uniforms.uTime.value=time;mat.uniforms.uProgress.value=progress;mat.uniforms.uFade.value=fade*(1-progress)*glow;mat.uniforms.uColor.value.set(c.gravityColor);mat.uniforms.uCore.value.set(c.coreColor);
    }
  }
}
