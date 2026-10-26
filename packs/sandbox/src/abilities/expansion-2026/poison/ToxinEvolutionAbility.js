import { ExpansionAtmosphere } from '../ExpansionAtmosphere.js';
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
function material(){return new ShaderMaterial({transparent:true,depthWrite:false,side:DoubleSide,blending:AdditiveBlending,
 uniforms:{uTime:{value:0},uStage:{value:0},uFade:{value:1},uColor:{value:new Color('#9be641')},uCore:{value:new Color('#e4ff93')}},
 vertexShader:`varying vec2 vUv;varying vec3 vN;uniform float uTime,uStage;void main(){vUv=uv;vN=normalize(normalMatrix*normal);vec3 p=position;float wave=sin(uv.y*19.-uTime*4.+uv.x*12.)*.035*(1.+uStage*.3);p.xz*=1.+wave;gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);}`,
 fragmentShader:`varying vec2 vUv;varying vec3 vN;uniform float uTime,uStage,uFade;uniform vec3 uColor,uCore;
 void main(){float veins=pow(max(0.,cos(vUv.x*37.+sin(vUv.y*14.-uTime*1.7))),15.);float rib=pow(max(0.,cos(vUv.y*42.-uTime*3.)),18.);
 float rim=pow(1.-abs(vN.z),2.);vec3 c=mix(uColor,uCore,clamp(veins*.4+rim*.35+uStage*.08,0.,1.));
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
  this.bodyMat=m(material());this.sigilMat=m(sigil());this.body=new Mesh(g(toxinMembraneGeometry()),this.bodyMat);this.effect.add(this.body);
  this.floor=new Mesh(g(new PlaneGeometry(2,2)),this.sigilMat);this.floor.rotation.x=-Math.PI/2;this.floor.position.y=.045;this.effect.add(this.floor);
  this.coils=[];for(let i=0;i<3;i++){const x=new Mesh(g(coil(i*TAU/3)),this.bodyMat);this.effect.add(x);this.coils.push(x);}
  const spore=g(new SphereGeometry(.045,10,6));this.spores=[];for(let i=0;i<24;i++){const s=new Mesh(spore,this.bodyMat);this.effect.add(s);this.spores.push(s);}
  this.effect.traverse(x=>{if(x.isMesh){x.layers.set(LAYER.VFX);x.frustumCulled=false;}});
  this.scope=null;this.targetId=null;this.stage=0;this.nextStage=0;this.failure=null;
 }
 createParticles(){this.atmosphere=new ExpansionAtmosphere(this.ctx,'poison',{shape:'BUBBLE',colors:['#e8ffad','#9be641','#5c9830','#24431b'],rate:22});}
 onSpawn(){this.atmosphere.reset();this.effect.visible=false;this.targetId=null;this.stage=0;this.nextStage=0;this.failure=null;
  const bridge=this.ctx.expansionCombat;this.scope=bridge?.bind?.(UID,'caster') ?? null;if(!this.scope)this.failure='combat bridge unavailable';
 }
 onTravel(){}
 onImpact(){
  if(!this.scope)return;
  const q=this.scope.queryActors({position:this.position.toArray(),radius:this.config.zoneRadius,relation:'enemy'});
  if(!q?.ok){this.failure=q?.reason??'query unavailable';return;}
  this.targetId=q.actors.find(x=>x.alive)?.id??null;if(!this.targetId){this.failure='no eligible target';return;}
  this.effect.visible=true;this.nextStage=0;
 }
 onFade(dt,t){if(this.targetId && this.phase===AbilityPhase.IMPACT)this.atmosphere.update(dt,this.effect.position);
  const fade=t<=1?1:1-clamp(t-1),c=this.config;
  if(this.targetId && this.scope && this.phase===AbilityPhase.IMPACT){
   const actor=this.scope.getActor(this.targetId);const e=actor?.actor;
   if(!actor?.ok||!e?.alive||Math.hypot(e.position[0]-this.position.x,e.position[2]-this.position.z)>c.tetherRange){this.targetId=null;this.failure='target left toxin range';}
   else{
    this.effect.position.fromArray(e.position);
    if(this.impactTime>=this.nextStage&&this.stage<Math.min(3,Math.max(1,Math.floor(c.maxStages)))){
     const result=this.scope.emit({type:'status',element:'poison',targetIds:[this.targetId],position:e.position,intensity:1+this.stage*.4});
     if(result?.ok){this.stage++;this.nextStage=this.impactTime+Math.max(.3,c.stagePeriod);}else {this.failure=result?.reason??'toxin event refused';this.nextStage=this.impactTime+.2;}
    }
   }
  }
  this.bodyMat.uniforms.uTime.value=this.age;this.bodyMat.uniforms.uStage.value=this.stage;this.bodyMat.uniforms.uFade.value=fade;this.bodyMat.uniforms.uColor.value.set(c.toxinColor);this.bodyMat.uniforms.uCore.value.set(c.coreColor);
  this.sigilMat.uniforms.uTime.value=this.age;this.sigilMat.uniforms.uStage.value=this.stage;this.sigilMat.uniforms.uFade.value=fade;this.sigilMat.uniforms.uColor.value.set(c.toxinColor);
  const grow=.7+this.stage*.12;this.body.scale.set(grow,1+this.stage*.1,grow);this.floor.scale.set(1.25+this.stage*.25,1.25+this.stage*.25,1);
  for(let i=0;i<this.coils.length;i++){this.coils[i].rotation.y=this.age*(.7+i*.15)*(i%2?-1:1);this.coils[i].scale.setScalar(grow);}
  for(let i=0;i<this.spores.length;i++){const a=i*2.399963+this.age*.8,r=.7+(i%4)*.16;this.spores[i].position.set(Math.cos(a)*r,.2+((i*.31+this.age*.45)%2.3),Math.sin(a)*r);}
 }
 onDestroy(){this.effect.visible=false;this.targetId=null;this.scope=null;}
 dispose(){for(const g of this.gs)g.dispose();for(const m of this.ms)m.dispose();super.dispose();}
}
export function buildEditor(gui,c){const f=gui.addFolder('Toxin Evolution');for(const [k,a,b,s] of [['zoneRadius',1,8,.1],['stagePeriod',.3,3,.1],['maxStages',1,3,1],['tetherRange',2,16,.1],['lifetime',2,12,.1]])f.add(c,k,a,b,s);return f;}
