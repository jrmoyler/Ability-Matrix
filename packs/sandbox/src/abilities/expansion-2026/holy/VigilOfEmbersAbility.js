import { ExpansionAtmosphere } from '../ExpansionAtmosphere.js';
import {AdditiveBlending,BufferAttribute,BufferGeometry,Color,DoubleSide,Group,LatheGeometry,Mesh,PlaneGeometry,ShaderMaterial,TorusGeometry,Vector2,Vector3} from 'three';
import {Ability,AbilityPhase} from '../../Ability.js';import {LAYER} from '../../../core/Layers.js';
export const ID='exp-vigil-of-embers',UID='matrix-expansion/vigil-of-embers';const TAU=Math.PI*2,clamp=x=>Math.max(0,Math.min(1,x));
/** Radial vaulted arch, authored in metres so the silhouette remains physical. */
export function vigilArchGeometry(){const p=[],uv=[],idx=[],segments=28;for(let i=0;i<=segments;i++){const t=i/segments,a=Math.PI*t,x=Math.cos(a)*.62,y=Math.sin(a)*1.05;for(const off of [-.07,.07]){p.push(x+Math.cos(a)*off,y+Math.sin(a)*off,0);uv.push(t,(off+.07)/.14);}if(i<segments){const n=i*2;idx.push(n,n+2,n+1,n+1,n+2,n+3);}}const g=new BufferGeometry();g.setAttribute('position',new BufferAttribute(new Float32Array(p),3));g.setAttribute('uv',new BufferAttribute(new Float32Array(uv),2));g.setIndex(idx);g.computeVertexNormals();return g;}
function holyMaterial(){return new ShaderMaterial({transparent:true,depthWrite:false,side:DoubleSide,blending:AdditiveBlending,uniforms:{uTime:{value:0},uFade:{value:1},uPulse:{value:0},uColor:{value:new Color('#ffe9ac')},uCore:{value:new Color('#fff')}},vertexShader:`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,fragmentShader:`varying vec2 vUv;uniform float uTime,uFade,uPulse;uniform vec3 uColor,uCore;void main(){float grain=.5+.5*sin(vUv.x*38.+sin(vUv.y*13.+uTime));float trim=pow(max(0.,cos(vUv.x*48.)),20.);vec3 c=mix(uColor,uCore,clamp(trim*.4+uPulse*.35,0.,1.));gl_FragColor=vec4(c,(.32+grain*.12+uPulse*.3)*uFade);
#include <tonemapping_fragment>
#include <colorspace_fragment>
}`});}
function floorMaterial(){return new ShaderMaterial({transparent:true,depthWrite:false,side:DoubleSide,blending:AdditiveBlending,uniforms:{uTime:{value:0},uFade:{value:1},uPulse:{value:0},uColor:{value:new Color('#ffe9ac')}},vertexShader:`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,fragmentShader:`varying vec2 vUv;uniform float uTime,uFade,uPulse;uniform vec3 uColor;void main(){vec2 p=vUv*2.-1.;float r=length(p),a=atan(p.y,p.x);float ring=exp(-abs(r-.9)*100.)+.6*exp(-abs(r-.64)*100.);float marks=pow(max(0.,cos(a*12.)),24.)*smoothstep(.68,.75,r)*(1.-smoothstep(.86,.92,r));float wave=exp(-abs(r-uPulse)*90.)*step(.01,uPulse);gl_FragColor=vec4(uColor,(ring+marks+wave)*uFade*.45);
#include <tonemapping_fragment>
#include <colorspace_fragment>
}`});}
export class VigilOfEmbersAbility extends Ability{
 constructor(ctx){super(ID,ctx);}get handlesOwnHits(){return true;}get impactDuration(){return this.config.lifetime;}get fadeDuration(){return this.config.fade;}
 createShaders(){this.rig=new Group();this.group.add(this.rig);this.rig.visible=false;this.gs=[];this.ms=[];const g=x=>(this.gs.push(x),x),m=x=>(this.ms.push(x),x);
  this.mat=m(holyMaterial());this.floorMat=m(floorMaterial());this.floor=new Mesh(g(new PlaneGeometry(2,2)),this.floorMat);this.floor.rotation.x=-Math.PI/2;this.floor.position.y=.04;this.rig.add(this.floor);
  const arch=g(vigilArchGeometry());this.arches=[];for(let i=0;i<8;i++){const a=i*TAU/8,w=new Mesh(arch,this.mat);w.position.set(Math.sin(a)*2.5,1,Math.cos(a)*2.5);w.rotation.y=a;this.rig.add(w);this.arches.push(w);}
  const bell=g(new LatheGeometry([new Vector2(.05,0),new Vector2(.24,.08),new Vector2(.28,.32),new Vector2(.4,.55),new Vector2(.45,.62)],24));this.bells=[];for(let i=0;i<4;i++){const a=i*TAU/4,b=new Mesh(bell,this.mat);b.position.set(Math.sin(a)*1.1,2.9,Math.cos(a)*1.1);b.rotation.z=Math.PI;this.rig.add(b);this.bells.push(b);}
  this.crown=new Mesh(g(new TorusGeometry(1,.025,8,64)),this.mat);this.crown.rotation.x=Math.PI/2;this.crown.position.y=3.2;this.rig.add(this.crown);this.rig.traverse(n=>{if(n.isMesh){n.layers.set(LAYER.VFX);n.frustumCulled=false;}});this.scope=null;this.nextPulse=0;this.pulseAt=-1;this.failure=null;}
 createParticles(){this.atmosphere=new ExpansionAtmosphere(this.ctx,'holy',{shape:'SOFT',colors:['#ffffff','#fff1ca','#ffd77f','#997748'],rate:24});}onSpawn(){this.atmosphere.reset();this.scope=this.ctx.expansionCombat?.bind?.(UID,'caster')??null;this.failure=this.scope?null:'combat bridge unavailable';this.rig.visible=false;this.nextPulse=0;this.pulseAt=-1;}
 onTravel(){}onImpact(){if(!this.scope)return;this.rig.position.copy(this.position);this.rig.visible=true;}
 onFade(dt,t){if(this.phase===AbilityPhase.IMPACT)this.atmosphere.update(dt,this.position);const c=this.config,fade=t<=1?1:1-clamp(t-1);if(this.scope&&this.phase===AbilityPhase.IMPACT&&this.impactTime>=this.nextPulse){
   const pos=this.position.toArray(),allies=this.scope.queryActors({position:pos,radius:c.zoneRadius,relation:'ally'}),enemies=this.scope.queryActors({position:pos,radius:c.zoneRadius,relation:'enemy'});
   if(!allies?.ok||!enemies?.ok)this.failure='sanctuary query refused';let emitted=false;for(const [query,type] of [[allies,'status'],[enemies,'hit']]){const ids=query?.ok?query.actors.filter(a=>a.alive).slice(0,8).map(a=>a.id):[];if(ids.length){const ev={type,element:'holy',position:pos,targetIds:ids,intensity:1};if(type==='hit')ev.damage=c.damage;const out=this.scope.emit(ev);if(out?.ok)emitted=true;else this.failure=out?.reason??'vigil event refused';}}
   if(emitted)this.pulseAt=this.impactTime;this.nextPulse=this.impactTime+Math.max(.3,c.pulsePeriod);
  }
  const pulse=this.pulseAt<0?0:clamp((this.impactTime-this.pulseAt)/.65),flash=this.pulseAt<0?0:1-clamp((this.impactTime-this.pulseAt)/.35);
  this.mat.uniforms.uTime.value=this.age;this.mat.uniforms.uFade.value=fade;this.mat.uniforms.uPulse.value=flash;this.mat.uniforms.uColor.value.set(c.holyColor);this.mat.uniforms.uCore.value.set(c.coreColor);
  this.floorMat.uniforms.uTime.value=this.age;this.floorMat.uniforms.uFade.value=fade;this.floorMat.uniforms.uPulse.value=pulse;this.floorMat.uniforms.uColor.value.set(c.holyColor);
  this.floor.scale.set(c.zoneRadius,c.zoneRadius,1);for(let i=0;i<this.arches.length;i++){const a=i*TAU/8;this.arches[i].position.x=Math.sin(a)*c.zoneRadius*.64;this.arches[i].position.z=Math.cos(a)*c.zoneRadius*.64;}
  for(let i=0;i<this.bells.length;i++)this.bells[i].rotation.z=Math.PI+Math.sin(this.age*3+i)*.15;this.crown.rotation.z=this.age*.4;
 }
 onDestroy(){this.rig.visible=false;this.scope=null;}dispose(){for(const x of this.gs)x.dispose();for(const x of this.ms)x.dispose();super.dispose();}
}
export function buildEditor(gui,c){const f=gui.addFolder('Vigil of Embers');for(const[k,a,b,s]of[['zoneRadius',1,8,.1],['pulsePeriod',.3,3,.1],['damage',.1,2,.1],['lifetime',2,8,.1]])f.add(c,k,a,b,s);return f;}
