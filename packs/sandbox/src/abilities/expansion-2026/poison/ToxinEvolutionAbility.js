import { ExpansionAtmosphere, prefersReducedMotion, addCommonEditorControls } from '../ExpansionAtmosphere.js';
import {AdditiveBlending, BufferAttribute, BufferGeometry, Color, DoubleSide, Group, Mesh, PlaneGeometry, ShaderMaterial, SphereGeometry, TubeGeometry, CatmullRomCurve3, Vector3} from 'three';
import {Ability, AbilityPhase} from '../../Ability.js';
import {LAYER} from '../../../core/Layers.js';
export const ID='exp-toxin-evolution', UID='matrix-expansion/toxin-evolution';
const TAU=Math.PI*2, clamp=x=>Math.max(0,Math.min(1,x));
/** Fluted, asymmetric capsule surface whose longitudinal ribs advance with toxin stage. */
export function toxinMembraneGeometry(){
 const pos=[],uv=[],idx=[],rows=33,cols=33;
 for(let j=0;j<rows;j++)for(let i=0;i<cols;i++){
  const t=j/(rows-1),a=i*TAU/(cols-1),r=Math.sin(Math.PI*t)*(.46+.07*Math.cos(a*6+2*t));
  pos.push(r*Math.cos(a),t*1.9,r*Math.sin(a));uv.push(i/(cols-1),t);
  if(j<rows-1&&i<cols-1){const n=j*cols+i;idx.push(n,n+cols,n+1,n+1,n+cols,n+cols+1);}
 }
 const g=new BufferGeometry();g.setAttribute('position',new BufferAttribute(new Float32Array(pos),3));g.setAttribute('uv',new BufferAttribute(new Float32Array(uv),2));g.setIndex(idx);g.computeVertexNormals();return g;
}
/** Seed vessel with a pointed crown and asymmetrical ribbed sides. */
export function toxinVesselGeometry(){const p=[],uv=[],idx=[],rows=29,cols=25;for(let j=0;j<rows;j++)for(let i=0;i<cols;i++){const t=j/(rows-1),a=i*TAU/(cols-1),radius=Math.pow(Math.sin(Math.PI*t),.7)*(.28+.045*Math.cos(a*5+t*4));p.push(Math.cos(a)*radius,t*.9,Math.sin(a)*radius);uv.push(i/(cols-1),t);if(j<rows-1&&i<cols-1){const n=j*cols+i;idx.push(n,n+cols,n+1,n+1,n+cols,n+cols+1);}}const g=new BufferGeometry();g.setAttribute('position',new BufferAttribute(new Float32Array(p),3));g.setAttribute('uv',new BufferAttribute(new Float32Array(uv),2));g.setIndex(idx);g.computeVertexNormals();return g;}
function vesselMaterial(){return new ShaderMaterial({transparent:true,depthWrite:false,side:DoubleSide,blending:AdditiveBlending,uniforms:{uTime:{value:0},uFade:{value:1},uColor:{value:new Color('#9be641')},uCore:{value:new Color('#e4ff93')}},vertexShader:`varying vec2 vUv;uniform float uTime;void main(){vUv=uv;vec3 p=position;p.xz*=1.+.04*sin(uTime*3.+uv.y*10.);gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);}`,fragmentShader:`varying vec2 vUv;uniform float uTime,uFade;uniform vec3 uColor,uCore;void main(){float ribs=pow(max(0.,cos(vUv.x*31.42+sin(vUv.y*9.-uTime))),16.);float seed=exp(-abs(vUv.y-.55)*8.);gl_FragColor=vec4(mix(uColor,uCore,seed*.35+ribs*.45),(.2+seed*.2+ribs*.35)*uFade);
#include <tonemapping_fragment>
#include <colorspace_fragment>
}`});}
function material(){return new ShaderMaterial({transparent:true,depthWrite:false,side:DoubleSide,blending:AdditiveBlending,
 uniforms:{uTime:{value:0},uStage:{value:0},uPulse:{value:0},uFade:{value:1},uColor:{value:new Color('#9be641')},uCore:{value:new Color('#e4ff93')}},
 vertexShader:`varying vec2 vUv;varying vec3 vN;uniform float uTime,uStage,uPulse;void main(){vUv=uv;vN=normalize(normalMatrix*normal);vec3 p=position;float wave=sin(uv.y*19.-uTime*4.+uv.x*12.)*.035*(1.+uStage*.3);p.xz*=1.+wave+uPulse*.12;gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);}`,
 fragmentShader:`varying vec2 vUv;varying vec3 vN;uniform float uTime,uStage,uFade,uPulse;uniform vec3 uColor,uCore;
 void main(){float veins=pow(max(0.,cos(vUv.x*37.+sin(vUv.y*14.-uTime*1.7))),15.);float rib=pow(max(0.,cos(vUv.y*42.-uTime*3.)),18.);
 float rim=pow(1.-abs(vN.z),2.);vec3 c=mix(uColor,uCore,clamp(veins*.4+rim*.35+uStage*.08+uPulse*.2,0.,1.));
 gl_FragColor=vec4(c,(.18+veins*.38+rib*.12+rim*.25)*uFade);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
 }`});}
function sigil(){return new ShaderMaterial({transparent:true,depthWrite:false,side:DoubleSide,blending:AdditiveBlending,
 uniforms:{uTime:{value:0},uStage:{value:0},uFade:{value:1},uColor:{value:new Color('#9be641')}},
 vertexShader:`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
 fragmentShader:`varying vec2 vUv;uniform float uTime,uStage,uFade;uniform vec3 uColor;void main(){vec2 p=vUv*2.-1.;float r=length(p),a=atan(p.y,p.x);
 float r1=exp(-abs(r-.84)*85.);float cells=pow(max(0.,cos(a*6.+sin(r*10.-uTime))),16.)*smoothstep(.25,.5,r)*(1.-smoothstep(.84,.96,r));
 gl_FragColor=vec4(uColor,(r1+cells*(.3+uStage*.15))*uFade*.55);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
 }`});}
function coil(phase){const p=[];for(let i=0;i<=64;i++){const t=i/64,a=phase+t*TAU*2.5,r=.55+.17*Math.sin(t*Math.PI*3);p.push(new Vector3(Math.cos(a)*r,.2+t*2.2,Math.sin(a)*r));}return new TubeGeometry(new CatmullRomCurve3(p),96,.025,6,false);}
/** A bounded, owner-attributed evolving poison carried by a real UCSM actor. */
export class ToxinEvolutionAbility extends Ability {
 constructor(ctx){super(ID,ctx);}
 get handlesOwnHits(){return true;}
 get impactDuration(){return this.config.lifetime;}
 get fadeDuration(){return this.config.fade;}
 get instanceCount(){return this.coils.length+this.spores.length+2;}
 createShaders(){
  this.effect=new Group();this.group.add(this.effect);this.effect.visible=false;this.gs=[];this.ms=[];
  const g=x=>(this.gs.push(x),x),m=x=>(this.ms.push(x),x);
  this.bodyMat=m(material());this.sigilMat=m(sigil());this.vesselMat=m(vesselMaterial());this.body=new Mesh(g(toxinMembraneGeometry()),this.bodyMat);this.effect.add(this.body);
  this.floor=new Mesh(g(new PlaneGeometry(2,2)),this.sigilMat);this.floor.rotation.x=-Math.PI/2;this.floor.position.y=.045;this.effect.add(this.floor);
  this.coils=[];for(let i=0;i<3;i++){const x=new Mesh(g(coil(i*TAU/3)),this.bodyMat);this.effect.add(x);this.coils.push(x);}
  const vessel=g(toxinVesselGeometry());this.vessels=[];for(let i=0;i<3;i++){const v=new Mesh(vessel,this.vesselMat);this.effect.add(v);this.vessels.push(v);}this.stageTimes=[-1,-1,-1];
  const spore=g(new SphereGeometry(.045,10,6));this.spores=[];for(let i=0;i<24;i++){const s=new Mesh(spore,this.bodyMat);this.effect.add(s);this.spores.push(s);}
  this.travelPod=new Group();this.group.add(this.travelPod);this.travelPod.visible=false;const pod=new Mesh(vessel,this.vesselMat);pod.scale.setScalar(.75);this.travelPod.add(pod);this.travelSpores=[];for(let i=0;i<6;i++){const sp=new Mesh(spore,this.bodyMat);this.travelPod.add(sp);this.travelSpores.push(sp);}this.travelPod.traverse(n=>{if(n.isMesh){n.layers.set(LAYER.VFX);n.frustumCulled=false;}});
  this.effect.traverse(x=>{if(x.isMesh){x.layers.set(LAYER.VFX);x.frustumCulled=false;}});
  this.scope=null;this.targetId=null;this.stage=0;this.nextStage=0;this.failure=null;
 }
 createParticles(){this.atmosphere=new ExpansionAtmosphere(this.ctx,'poison',{shape:'BUBBLE',colors:['#e8ffad','#9be641','#5c9830','#24431b'],rate:22});}
 onSpawn(){this.reduceMotion=prefersReducedMotion();this.atmosphere.reset();this.effect.visible=false;this.targetId=null;this.stage=0;this.nextStage=0;this.failure=null;this.releaseAt=-1;this.stageTimes.fill(-1);
  const bridge=this.ctx.expansionCombat;this.scope=bridge?.bind?.(UID,'caster') ?? null;if(!this.scope)this.failure='combat bridge unavailable';this.travelPod.visible=!!this.scope;this.travelPod.position.copy(this.origin);
 }
 onTravel(){const c=this.config,t=this.reduceMotion?0:this.age;this.travelPod.position.copy(this.position);this.travelPod.position.y=.7;this.travelPod.rotation.y=t*2;this.travelPod.scale.setScalar(c.travelScale??1);this.vesselMat.uniforms.uTime.value=t;this.vesselMat.uniforms.uFade.value=1;this.vesselMat.uniforms.uColor.value.set(c.toxinColor);this.vesselMat.uniforms.uCore.value.set(c.coreColor);this.bodyMat.uniforms.uFade.value=1;this.bodyMat.uniforms.uPulse.value=0;this.bodyMat.uniforms.uTime.value=t;this.bodyMat.uniforms.uColor.value.set(c.toxinColor);this.bodyMat.uniforms.uCore.value.set(c.coreColor);for(let i=0;i<this.travelSpores.length;i++){const a=i*TAU/this.travelSpores.length+t*2;this.travelSpores[i].position.set(Math.cos(a)*.5,.2+(i%3)*.18,Math.sin(a)*.5);}}
 onImpact(){
  this.travelPod.visible=false;if(!this.scope)return;
  const q=this.scope.queryActors({position:this.position.toArray(),radius:this.config.zoneRadius,relation:'enemy'});
  if(!q?.ok){this.failure=q?.reason??'query unavailable';return;}
  this.targetId=q.actors.filter(x=>x.alive).sort((a,b)=>Math.hypot(a.position[0]-this.position.x,a.position[2]-this.position.z)-Math.hypot(b.position[0]-this.position.x,b.position[2]-this.position.z)||a.id.localeCompare(b.id))[0]?.id??null;if(!this.targetId){this.failure='no eligible target';return;}
  this.effect.visible=true;this.nextStage=0;
 }
 onFade(dt,t){const visualTime=this.reduceMotion?0:this.age;this.atmosphere.rate=this.config.particleRate??this.atmosphere.rate;this.atmosphere.size=this.config.particleSize??this.atmosphere.size;if(!this.reduceMotion && this.targetId && this.phase===AbilityPhase.IMPACT)this.atmosphere.update(dt,this.effect.position);
  const c=this.config;let fade=t<=1?1:1-clamp(t-1);
  if(this.targetId && this.scope && this.phase===AbilityPhase.IMPACT){
   const actor=this.scope.getActor(this.targetId);const e=actor?.actor;
   if(!actor?.ok||!e?.alive||Math.hypot(e.position[0]-this.position.x,e.position[2]-this.position.z)>c.tetherRange){this.targetId=null;this.releaseAt=this.impactTime;this.failure='target left toxin range';}
   else{
    this.effect.position.fromArray(e.position);
    if(dt>0&&this.impactTime>=this.nextStage&&this.stage<Math.min(3,Math.max(1,Math.floor(c.maxStages)))){
     const result=this.scope.emit({type:'hit',element:'poison',targetIds:[this.targetId],position:e.position,intensity:1+this.stage*.4,damage:(c.stageDamage??.25)*(1+this.stage*.4)});
     if(result?.ok){this.stageTimes[this.stage]=this.impactTime;this.stage++;if(!this.reduceMotion){this.atmosphere.cue(e.position,1+this.stage*.25);this.atmosphere.burst(e.position,8+this.stage*6,{radius:.4+this.stage*.15,speed:.45+this.stage*.15,size:.09+this.stage*.02,life:1.3});}this.nextStage=this.impactTime+Math.max(.3,c.stagePeriod);}else {this.failure=result?.reason??'toxin event refused';this.nextStage=this.impactTime+.2;}
    }
   }
  }
  if(this.releaseAt>=0){const release=clamp((this.impactTime-this.releaseAt)/Math.max(.1,c.releaseDuration??.55));fade=Math.min(fade,1-release);if(release>=1)this.effect.visible=false;}
  const latest=this.stage>0?this.stageTimes[this.stage-1]:-1,stagePulse=this.reduceMotion||latest<0?0:1-clamp((this.impactTime-latest)/Math.max(.1,c.bloomTime??.55)),retract=fade;
  this.atmosphere.syncPalette(c.toxinColor,c.coreColor);
  this.bodyMat.uniforms.uPulse.value=stagePulse;this.bodyMat.uniforms.uTime.value=visualTime;this.bodyMat.uniforms.uStage.value=this.stage;this.bodyMat.uniforms.uFade.value=fade;this.bodyMat.uniforms.uColor.value.set(c.toxinColor);this.bodyMat.uniforms.uCore.value.set(c.coreColor);
  this.sigilMat.uniforms.uTime.value=visualTime;this.sigilMat.uniforms.uStage.value=this.stage;this.sigilMat.uniforms.uFade.value=fade;this.sigilMat.uniforms.uColor.value.set(c.toxinColor);
  this.vesselMat.uniforms.uTime.value=visualTime;this.vesselMat.uniforms.uFade.value=fade;this.vesselMat.uniforms.uColor.value.set(c.toxinColor);this.vesselMat.uniforms.uCore.value.set(c.coreColor);
  for(let i=0;i<this.vessels.length;i++){const v=this.vessels[i],a=i*TAU/3+visualTime*(i%2?-.25:.25),age=this.stageTimes[i]<0?-1:this.impactTime-this.stageTimes[i];v.visible=age>=0;v.position.set(Math.cos(a)*.72,.45+i*.37,Math.sin(a)*.72);v.rotation.set(.3*Math.cos(a),-a,.3*Math.sin(a));v.scale.setScalar((c.vesselScale??1)*clamp(age/.25)*retract*(1+stagePulse*(c.bloomStrength??.3)));}
  const grow=(.7+this.stage*.12)*(1+stagePulse*(c.bloomStrength??.3))*retract;this.body.scale.set(grow,(1+this.stage*.1)*retract,grow);this.floor.scale.set((1.25+this.stage*.25)*retract,(1.25+this.stage*.25)*retract,1);
  for(let i=0;i<this.coils.length;i++){this.coils[i].rotation.y=visualTime*(.7+i*.15)*(i%2?-1:1);this.coils[i].scale.setScalar(grow);}
  for(let i=0;i<this.spores.length;i++){const a=i*2.399963+visualTime*.8,r=.7+(i%4)*.16;this.spores[i].position.set(Math.cos(a)*r,.2+((i*.31+visualTime*.45)%2.3),Math.sin(a)*r);}
 }
 onDestroy(){this.effect.visible=false;this.travelPod.visible=false;this.targetId=null;this.scope=null;}
 dispose(){for(const g of this.gs)g.dispose();for(const m of this.ms)m.dispose();super.dispose();}
}
export function buildEditor(gui,c,Editor){const f=gui.addFolder('Toxin Evolution');for(const [k,a,b,s] of [['zoneRadius',1,8,.1],['stagePeriod',.3,3,.1],['travelScale',.25,2,.05],['stageDamage',.05,1,.05],['maxStages',1,3,1],['vesselScale',.25,2,.05],['bloomStrength',0,1,.05],['bloomTime',.1,2,.05],['releaseDuration',.1,2,.05],['tetherRange',2,16,.1],['lifetime',2,12,.1]])f.add(c,k,a,b,s);addCommonEditorControls(f,c,Editor);return f;}
