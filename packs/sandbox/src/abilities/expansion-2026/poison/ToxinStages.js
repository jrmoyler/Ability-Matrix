import { AdditiveBlending, BufferAttribute, BufferGeometry, Color, DoubleSide, Mesh, ShaderMaterial, Vector3 } from 'three';
import { LAYER } from '../../../core/Layers.js';
import { BurstMode } from '../../../effects/BurstSphere.js';
import { DecalType } from '../../../effects/GroundDecals.js';

const TAU=Math.PI*2;
const clamp=x=>Math.max(0,Math.min(1,x));

/** Three physically distinct crowns: seed petals, jagged split lobes, raised spines. */
export function toxinStageGeometry(stage){
  const positions=[],uv=[],indices=[],count=[6,10,12][stage];
  if(count===undefined)throw new RangeError('Expected toxin stage 0, 1 or 2');
  for(let i=0;i<count;i++){
    const a=i*TAU/count,half=(stage===0?.34:stage===1?.21:.12)*Math.PI/count*6;
    const inner=stage===0?.28:.38,outer=stage===0?.85:stage===1?1.05:1.22;
    const tipHeight=stage===2?.48+(i%2)*.12:stage===1?.13:.04,base=positions.length/3;
    const points=[[inner,a-half,0],[outer*.77,a-half*.55,.04],[outer,a,tipHeight],[outer*.77,a+half*.55,.04],[inner,a+half,0],[outer*.65,a,stage===2?.12:.06]];
    for(const [radius,angle,y] of points){positions.push(Math.cos(angle)*radius,y,Math.sin(angle)*radius);uv.push(.5+Math.cos(angle)*radius*.38,.5+Math.sin(angle)*radius*.38);}
    for(let j=0;j<5;j++)indices.push(base+j,base+(j+1)%5,base+5);
  }
  const geometry=new BufferGeometry();geometry.setAttribute('position',new BufferAttribute(new Float32Array(positions),3));geometry.setAttribute('uv',new BufferAttribute(new Float32Array(uv),2));geometry.setIndex(indices);geometry.computeVertexNormals();return geometry;
}
function stageMaterial(stage){return new ShaderMaterial({
  transparent:true,depthWrite:false,side:DoubleSide,blending:AdditiveBlending,
  uniforms:{uTime:{value:0},uFade:{value:0},uProgress:{value:0},uStage:{value:stage},uColor:{value:new Color('#9be641')},uCore:{value:new Color('#e4ff93')}},
  vertexShader:`varying vec2 vUv;uniform float uTime,uProgress,uStage;void main(){vUv=uv;vec3 p=position;p.y+=sin(uv.x*18.+uv.y*11.-uTime*3.)*.035*(1.-uProgress);gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);}`,
  fragmentShader:`varying vec2 vUv;uniform float uTime,uFade,uProgress,uStage;uniform vec3 uColor,uCore;void main(){vec2 p=vUv*2.-1.;float r=length(p),a=atan(p.y,p.x);float ridges=pow(max(0.,cos(a*(6.+uStage*4.)+sin(r*12.-uTime*2.))),14.);float rim=exp(-abs(r-(.45+uProgress*.35))*20.);vec3 color=mix(uColor,uCore,clamp(ridges*.5+rim*.3+uStage*.08,0.,1.));gl_FragColor=vec4(color,(.16+ridges*.45+rim*.3)*uFade);\n#include <tonemapping_fragment>\n#include <colorspace_fragment>\n}`
});}

/** Owned by one cast. Three independently timed crowns accompany accepted hits. */
export class ToxinStages {
  constructor(parent,ctx,atmosphere,ownGeometry,ownMaterial){
    this.ctx=ctx;this.atmosphere=atmosphere;this.point=new Vector3();this.primary=new Color();this.core=new Color();this.dark=new Color();this.meshes=[];this.materials=[];
    for(let i=0;i<3;i++){
      const mat=ownMaterial(stageMaterial(i)),mesh=new Mesh(ownGeometry(toxinStageGeometry(i)),mat);
      mesh.position.y=.055+i*.012;mesh.visible=false;mesh.layers.set(LAYER.VFX);mesh.frustumCulled=false;parent.add(mesh);this.meshes.push(mesh);this.materials.push(mat);
    }
  }
  reset(){for(const mesh of this.meshes)mesh.visible=false;}
  /** A stage cue is called only after its combat hit was accepted. */
  fire(stage,position,c){
    const index=stage-1;if(index<0||index>2)return;
    this.point.fromArray(position);this.primary.set(c.toxinColor);this.core.set(c.coreColor);this.dark.copy(this.primary).multiplyScalar(.25);
    const scale=Math.max(.25,Math.min(3,c.stageCueScale??1)),radius=Math.min(5,(.8+stage*.35)*scale),glow=Math.max(0,Math.min(2,c.stageCueGlow??.8));
    const modes=[BurstMode.AIR,BurstMode.WATER,BurstMode.EARTH],marks=[DecalType.DUSTRING,DecalType.RIPPLE,DecalType.SHOCKWAVE];
    this.ctx.bursts?.spawn(modes[index],this.point,{radius:.08,endRadius:radius,life:.35+stage*.12,intensity:glow*(.35+stage*.16),opacity:.55,colorA:this.core,colorB:this.primary,colorC:this.dark});
    this.ctx.decals?.spawn(marks[index],this.point,{radius,life:.45+stage*.16,intensity:glow,width:.04+stage*.015,colorA:this.primary,colorB:this.dark});
    this.atmosphere.burst(position,8+stage*6,{radius:.4+stage*.15,speed:.45+stage*.15,size:.09+stage*.02,life:1.3});
  }
  update(times,elapsed,time,fade,c,reducedMotion){
    const duration=Math.max(.1,c.stageCueDuration??.8),scale=Math.max(.25,Math.min(3,c.stageCueScale??1)),glow=Math.max(0,Math.min(2,c.stageCueGlow??.8));
    for(let i=0;i<3;i++){
      const age=times[i]<0?-1:elapsed-times[i],progress=age<0?0:clamp(age/duration),mesh=this.meshes[i],mat=this.materials[i];
      mesh.visible=!reducedMotion&&age>=0&&progress<1;
      mesh.rotation.y=time*(i%2?-.55:.55);mesh.scale.setScalar(scale*(.35+progress*(.8+i*.18)));
      mat.uniforms.uTime.value=time;mat.uniforms.uProgress.value=progress;mat.uniforms.uFade.value=fade*(1-progress)*glow;mat.uniforms.uColor.value.set(c.toxinColor);mat.uniforms.uCore.value.set(c.coreColor);
    }
  }
}
