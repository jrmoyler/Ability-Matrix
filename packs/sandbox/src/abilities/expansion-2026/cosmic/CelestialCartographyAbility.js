import { ExpansionAtmosphere, prefersReducedMotion, addCommonEditorControls } from '../ExpansionAtmosphere.js';
import {AdditiveBlending, BufferAttribute, BufferGeometry, Color, DoubleSide, Group, Mesh, PlaneGeometry, ShaderMaterial, SphereGeometry, TorusGeometry, Vector3} from 'three';
import { Ability, AbilityPhase } from '../../Ability.js';
import { LAYER } from '../../../core/Layers.js';
import { BurstMode } from '../../../effects/BurstSphere.js';
import { DecalType } from '../../../effects/GroundDecals.js';
export const ID='exp-celestial-cartography';
const TAU=Math.PI*2;
const bound=x=>Math.max(0,Math.min(1,x));
const smoother=x=>{x=bound(x);return x*x*(3-2*x);};
const V=new Vector3();

/** Faceted radial star; non-coplanar points give the flare a physical silhouette. */
export function starGeometry() {
 const p=[],idx=[],uv=[];const spokes=12;
 p.push(0,0,.22);uv.push(.5,.5);
 for(let i=0;i<spokes*2;i++){
  const a=i*Math.PI/spokes,r=i%2?.16:(i%4===0?.72:.43);
  p.push(Math.cos(a)*r,Math.sin(a)*r,(i%2?-.02:.03));uv.push(.5+Math.cos(a)*r*.5,.5+Math.sin(a)*r*.5);
 }
 for(let i=0;i<spokes*2;i++)idx.push(0,1+i,1+(i+1)%(spokes*2));
 const g=new BufferGeometry();g.setAttribute('position',new BufferAttribute(new Float32Array(p),3));g.setAttribute('uv',new BufferAttribute(new Float32Array(uv),2));g.setIndex(idx);g.computeVertexNormals();return g;
}

/** A ruled taper preserves a true directed strike rather than a generic sphere. */
export function beamGeometry() {
 const pos=[],uv=[],idx=[],sides=16,segments=32;
 for(let j=0;j<=segments;j++)for(let i=0;i<=sides;i++){
  const t=j/segments,a=i*TAU/sides,r=.045+(.18*Math.sin(Math.PI*t)**1.4);
  pos.push(Math.cos(a)*r,t,Math.sin(a)*r);uv.push(i/sides,t);
  if(j<segments&&i<sides){const n=j*(sides+1)+i;idx.push(n,n+sides+1,n+1,n+1,n+sides+1,n+sides+2);}
 }
 const g=new BufferGeometry();g.setAttribute('position',new BufferAttribute(new Float32Array(pos),3));g.setAttribute('uv',new BufferAttribute(new Float32Array(uv),2));g.setIndex(idx);g.computeVertexNormals();return g;
}
/** Target compass: interrupted arcs and inward-pointing stellar ticks. */
export function celestialTargetGeometry(){const p=[],uv=[],idx=[],n=64;for(let i=0;i<n;i++){if(i%8===0)continue;const a=i*TAU/n,b=(i+1)*TAU/n,base=p.length/3;for(const [r,t] of [[.9,a],[1,a],[1,b],[.9,b]]){p.push(Math.cos(t)*r,0,Math.sin(t)*r);uv.push(.5+Math.cos(t)*r*.5,.5+Math.sin(t)*r*.5);}idx.push(base,base+1,base+2,base,base+2,base+3);}for(let i=0;i<8;i++){const a=i*TAU/8,base=p.length/3;for(const [r,t] of [[.62,a],[.83,a-.045],[.83,a+.045]]){p.push(Math.cos(t)*r,0,Math.sin(t)*r);uv.push(.5+Math.cos(t)*r*.5,.5+Math.sin(t)*r*.5);}idx.push(base,base+1,base+2);}const g=new BufferGeometry();g.setAttribute('position',new BufferAttribute(new Float32Array(p),3));g.setAttribute('uv',new BufferAttribute(new Float32Array(uv),2));g.setIndex(idx);g.computeVertexNormals();return g;}
/** Faceted stellar fragment with a raised spine. */
export function celestialShardGeometry(){const g=new BufferGeometry();g.setAttribute('position',new BufferAttribute(new Float32Array([0,.4,0,-.08,0,0,0,-.24,0,.08,0,0,0,0,.06]),3));g.setAttribute('uv',new BufferAttribute(new Float32Array([.5,1,0,.5,.5,0,1,.5,.5,.5]),2));g.setIndex([0,1,4,1,2,4,2,3,4,3,0,4]);g.computeVertexNormals();return g;}
function targetMaterial(){return new ShaderMaterial({transparent:true,depthWrite:false,side:DoubleSide,blending:AdditiveBlending,uniforms:{uTime:{value:0},uFade:{value:1},uCharge:{value:0},uColor:{value:new Color('#ac84ff')}},vertexShader:`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,fragmentShader:`varying vec2 vUv;uniform float uTime,uFade,uCharge;uniform vec3 uColor;void main(){vec2 p=vUv*2.-1.;float a=atan(p.y,p.x),pulse=.65+.35*sin(uTime*5.+a*8.);gl_FragColor=vec4(uColor,(.3+uCharge*.5)*pulse*uFade);
#include <tonemapping_fragment>
#include <colorspace_fragment>
}`});}
function starlight(){return new ShaderMaterial({transparent:true,depthWrite:false,side:DoubleSide,blending:AdditiveBlending,
 uniforms:{uTime:{value:0},uFade:{value:1},uColor:{value:new Color('#d5bbff')}},
 vertexShader:`varying vec2 vUv;varying vec3 vNormal;void main(){vUv=uv;vNormal=normalize(normalMatrix*normal);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
 fragmentShader:`varying vec2 vUv;varying vec3 vNormal;uniform float uTime,uFade;uniform vec3 uColor;
 void main(){float t=.75+.25*sin(uTime*5.+vUv.x*19.);float rim=pow(1.-abs(vNormal.z),2.);vec3 c=uColor*(t+rim*.4);gl_FragColor=vec4(c,uFade*(.55+.3*t));
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
 }`});}
/** Each link reveals independently as the chart is written across the sky. */
function chartLinkMaterial(){return new ShaderMaterial({transparent:true,depthWrite:false,side:DoubleSide,blending:AdditiveBlending,uniforms:{uTime:{value:0},uFade:{value:1},uReveal:{value:0},uColor:{value:new Color('#d5bbff')}},vertexShader:`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,fragmentShader:`varying vec2 vUv;uniform float uTime,uFade,uReveal;uniform vec3 uColor;void main(){float drawn=1.-smoothstep(uReveal-.025,uReveal+.025,vUv.y);float edge=1.-abs(vUv.x*2.-1.);float spark=pow(max(0.,cos(vUv.y*25.-uTime*4.)),12.);gl_FragColor=vec4(uColor,(edge*.6+spark*.25)*drawn*uFade);
#include <tonemapping_fragment>
#include <colorspace_fragment>
}`});}
function chart(){return new ShaderMaterial({transparent:true,depthWrite:false,side:DoubleSide,blending:AdditiveBlending,
 uniforms:{uTime:{value:0},uFade:{value:1},uColor:{value:new Color('#ac84ff')},uCharge:{value:0}},
 vertexShader:`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
 fragmentShader:`varying vec2 vUv;uniform float uTime,uFade,uCharge;uniform vec3 uColor;
 void main(){vec2 p=vUv*2.-1.;float r=length(p),a=atan(p.y,p.x);float rings=exp(-abs(r-.9)*110.)+.45*exp(-abs(r-.7)*85.);
 float ticks=pow(max(0.,cos(a*24.)),24.)*smoothstep(.73,.8,r)*(1.-smoothstep(.88,.94,r));
 float rays=pow(max(0.,cos(a*7.+uTime*.25)),25.)*smoothstep(.15,.4,r)*(1.-smoothstep(.65,.85,r));
 gl_FragColor=vec4(uColor,(rings+ticks*.7+rays*.16)*uFade*(.35+.4*uCharge));
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
 }`});}
function band(a,b){
 const delta=b.clone().sub(a),side=new Vector3(-delta.z,0,delta.x).normalize().multiplyScalar(.025);
 const g=new BufferGeometry();g.setAttribute('position',new BufferAttribute(new Float32Array([
  a.x-side.x,a.y,a.z-side.z,a.x+side.x,a.y,a.z+side.z,b.x-side.x,b.y,b.z-side.z,b.x+side.x,b.y,b.z+side.z]),3));
 g.setAttribute('uv',new BufferAttribute(new Float32Array([0,0,1,0,0,1,1,1]),2));g.setIndex([0,2,1,1,2,3]);g.computeVertexNormals();return g;
}
const layout=[[-.8,-.32],[-.55,.51],[-.15,.16],[.16,.76],[.65,.39],[.82,-.24],[.28,-.7],[-.18,-.52]];
export class CelestialCartographyAbility extends Ability {
 constructor(ctx){super(ID,ctx);}
 get handlesOwnHits(){return true;}
 get impactDuration(){return this.config.lifetime;}
 get fadeDuration(){return this.config.fade;}
 get instanceCount(){return this.stars.length+this.lines.length+this.dust.length;}
 createShaders(){
  this.chartGroup=new Group();this.group.add(this.chartGroup);this.chartGroup.visible=false;this.gs=[];this.ms=[];
  const geom=g=>(this.gs.push(g),g),mat=m=>(this.ms.push(m),m);
  this.starGeo=geom(starGeometry());this.beamGeo=geom(beamGeometry());this.starMat=mat(starlight());this.floorMat=mat(chart());this.flareMat=mat(starlight());this.shardMat=mat(starlight());this.targetMat=mat(targetMaterial());this.targetMark=new Mesh(geom(celestialTargetGeometry()),this.targetMat);this.targetMark.visible=false;this.chartGroup.add(this.targetMark);
  this.floor=new Mesh(geom(new PlaneGeometry(2,2)),this.floorMat);this.floor.rotation.x=-Math.PI/2;this.floor.position.y=.04;this.chartGroup.add(this.floor);
  this.frame=new Mesh(geom(new TorusGeometry(1,.018,6,96)),this.starMat);this.frame.rotation.x=Math.PI/2;this.chartGroup.add(this.frame);
  this.travelStar=new Group();this.group.add(this.travelStar);this.travelStar.visible=false;this.travelStars=[];for(let i=0;i<3;i++){const star=new Mesh(this.starGeo,this.starMat);star.rotation.set(i*TAU/3,0,i*TAU/6);star.scale.setScalar(.45);this.travelStar.add(star);this.travelStars.push(star);}const orbit=new Mesh(this.frame.geometry,this.starMat);orbit.rotation.x=Math.PI/2;orbit.scale.setScalar(.65);this.travelStar.add(orbit);this.travelStar.traverse(n=>{if(n.isMesh){n.layers.set(LAYER.VFX);n.frustumCulled=false;}});
  this.stars=[];this.lines=[];this.lineMaterials=[];this.nodes=layout.map(([x,z])=>new Vector3(x,0,z));
  for(const node of this.nodes){const star=new Mesh(this.starGeo,this.starMat);star.position.copy(node);star.rotation.x=-Math.PI/2;star.scale.setScalar(.22);this.chartGroup.add(star);this.stars.push(star);}
  for(let i=0;i<this.nodes.length;i++){const material=mat(chartLinkMaterial()),line=new Mesh(geom(band(this.nodes[i],this.nodes[(i+1)%this.nodes.length])),material);this.chartGroup.add(line);this.lines.push(line);this.lineMaterials.push(material);}
  this.beam=new Mesh(this.beamGeo,this.starMat);this.chartGroup.add(this.beam);this.beam.visible=false;
  this.flare=new Group();this.chartGroup.add(this.flare);this.flare.visible=false;const flareRing=geom(new TorusGeometry(.5,.018,6,64));this.flareRings=[];for(let i=0;i<3;i++){const ring=new Mesh(flareRing,this.flareMat);this.flare.add(ring);this.flareRings.push(ring);}const flareStar=new Mesh(this.starGeo,this.flareMat);this.flare.add(flareStar);this.flareStar=flareStar;const shard=geom(celestialShardGeometry());this.strikeShards=[];for(let i=0;i<12;i++){const piece=new Mesh(shard,this.shardMat);piece.visible=false;this.chartGroup.add(piece);this.strikeShards.push(piece);}this._cueA=new Color();this._cueB=new Color();this._cueDark=new Color();
  const orb=geom(new SphereGeometry(.025,8,6));this.dust=[];
  for(let i=0;i<40;i++){const dot=new Mesh(orb,this.starMat),a=i*2.399963,r=.18+.78*((i*37%41)/40);dot.position.set(Math.cos(a)*r,(i%7)*.03,Math.sin(a)*r);this.chartGroup.add(dot);this.dust.push(dot);}
  this.chartGroup.traverse(n=>{if(n.isMesh){n.layers.set(LAYER.VFX);n.frustumCulled=false;}});
  this._found=[];this._target=null;this._markedAt=-1;this._struck=false;this._strikeAt=-1;this._targetPos=new Vector3();
 }
 createParticles(){this.atmosphere=new ExpansionAtmosphere(this.ctx,'cosmic',{shape:'SOFT',colors:['#f7eaff','#bd9eff','#8067dc','#372356'],rate:26});}
 onSpawn(){this.reduceMotion=prefersReducedMotion();this.atmosphere.reset();this.chartGroup.visible=false;this.travelStar.visible=true;this.travelStar.position.copy(this.origin);this._target=null;this._markedAt=-1;this._struck=false;this._strikeAt=-1;this._hitAt=-1;this.flare.visible=false;this.targetMark.visible=false;for(const shard of this.strikeShards)shard.visible=false;}
 onTravel(){const c=this.config,visualTime=this.reduceMotion?0:this.age;this.travelStar.position.copy(this.position);this.travelStar.position.y=1.1;this.travelStar.rotation.set(visualTime*.6,visualTime*1.5,visualTime*.9);this.travelStar.scale.setScalar(c.starScale??1);this.starMat.uniforms.uTime.value=visualTime;this.starMat.uniforms.uFade.value=1;this.starMat.uniforms.uColor.value.set(c.chartColor);}
 onImpact(){this.travelStar.visible=false;this.chartGroup.position.copy(this.position);this.chartGroup.visible=true;}
 onFade(dt,t){const visualTime=this.reduceMotion?0:this.age;this.atmosphere.rate=this.config.particleRate??this.atmosphere.rate;this.atmosphere.size=this.config.particleSize??this.atmosphere.size;if(!this.reduceMotion && this.phase===AbilityPhase.IMPACT)this.atmosphere.update(dt,this.position);
  const c=this.config,elapsed=this.impactTime,fade=t<=1?1:1-bound(t-1),rise=smoother(elapsed/Math.max(.01,c.armDelay)),collapse=1-(1-fade)*bound(c.collapseStrength??.8),radius=c.zoneRadius*collapse,draw=bound(elapsed/Math.max(.1,c.drawTime??.45));
  this.atmosphere.syncPalette(c.chartColor,c.coreColor);
  this.floor.scale.set(radius,radius,1);this.frame.position.y=c.chartHeight*(.5+.5*collapse);this.frame.scale.setScalar(radius);
  for(let i=0;i<this.stars.length;i++){const s=this.stars[i];s.position.set(this.nodes[i].x*radius,c.chartHeight*(.5+.5*collapse),this.nodes[i].z*radius);s.scale.setScalar(.22*(.8+.2*Math.sin(visualTime*3+i)));}
  for(let i=0;i<this.lines.length;i++){const line=this.lines[i],material=this.lineMaterials[i];line.position.y=c.chartHeight*(.5+.5*collapse);line.scale.set(radius,1,radius);material.uniforms.uTime.value=visualTime;material.uniforms.uFade.value=fade;material.uniforms.uReveal.value=bound(draw*this.lines.length-i);material.uniforms.uColor.value.set(c.chartColor);}
  for(let i=0;i<this.dust.length;i++){const a=i*2.399963,r=radius*(.18+.78*((i*37%41)/40));this.dust[i].position.set(Math.cos(a)*r,c.chartHeight*(.5+.5*collapse)+(i%7)*.03+.08*Math.sin(visualTime*2+i),Math.sin(a)*r);}
  this.starMat.uniforms.uTime.value=visualTime;this.starMat.uniforms.uFade.value=fade*rise;this.starMat.uniforms.uColor.value.set(c.chartColor);
  this.floorMat.uniforms.uTime.value=visualTime;this.floorMat.uniforms.uFade.value=fade*rise;this.floorMat.uniforms.uColor.value.set(c.rayColor);
  if(dt>0 && this.phase===AbilityPhase.IMPACT && elapsed>=c.armDelay && this._markedAt<0){
   const field=this.ctx.dummies;if(field?.findTargets){const found=field.findTargets(this.position.x,this.position.z,radius,this._found);let nearest=null,nearestDistance=Infinity;for(const d of found){if(!d.alive)continue;const distance=Math.hypot(d.position.x-this.position.x,d.position.z-this.position.z);if(distance<nearestDistance){nearest=d;nearestDistance=distance;}}this._target=nearest;if(this._target){this._markedAt=elapsed;this._targetPos.copy(this._target.position);}this._found.length=0;}
  }
  const charge=this._markedAt<0?0:bound((elapsed-this._markedAt)/Math.max(.01,c.strikeDelay));this.floorMat.uniforms.uCharge.value=charge;
  this.targetMark.visible=this._markedAt>=0&&!this._struck;this.targetMark.position.set(this._targetPos.x-this.position.x,.06,this._targetPos.z-this.position.z);this.targetMark.scale.setScalar(c.strikeRadius??1);this.targetMat.uniforms.uTime.value=visualTime;this.targetMat.uniforms.uFade.value=fade;this.targetMat.uniforms.uCharge.value=charge;this.targetMat.uniforms.uColor.value.set(c.rayColor);
  this.beam.visible=this._markedAt>=0 && !this._struck;
  if(this.beam.visible){this.beam.position.set(this._targetPos.x-this.position.x,0,this._targetPos.z-this.position.z);this.beam.scale.set(1,c.chartHeight*charge,1);}
  if(dt>0 && this._target && !this._struck && charge>=1){this._struck=true;this._strikeAt=elapsed;this.targetMark.visible=false;const d=this._target;
   if(d.alive && Math.hypot(d.position.x-this._targetPos.x,d.position.z-this._targetPos.z)<=Math.max(.25,c.strikeRadius??1)){V.copy(this.direction);if(d.kill(V.x,V.z,{impulse:c.hitImpulse,lift:c.hitLift,spin:c.hitSpin})){this._hitAt=elapsed;if(!this.reduceMotion){const a=this._cueA.set(c.coreColor),b=this._cueB.set(c.chartColor),dark=this._cueDark.copy(b).multiplyScalar(.3),radius=Math.min(4,(c.strikeRadius??1)*(c.impactScale??1));this.ctx.bursts?.spawn(BurstMode.STORM,this._targetPos,{radius:.08,endRadius:radius,life:.7,intensity:c.impactGlow??.8,opacity:.55,colorA:a,colorB:b,colorC:dark});this.ctx.decals?.spawn(DecalType.SHOCKWAVE,this._targetPos,{radius,life:.8,intensity:c.impactGlow??.8,width:.05,colorA:b,colorB:dark});this.atmosphere.burst(this._targetPos,22,{radius:.4,speed:1.4,size:.08,life:.9,spread:.8});}}}
  }
  const flareAge=this._strikeAt<0?-1:elapsed-this._strikeAt;this.flare.visible=flareAge>=0&&flareAge<.5;this.flare.position.set(this._targetPos.x-this.position.x,.6,this._targetPos.z-this.position.z);this.flare.scale.setScalar((c.flareScale??1)*(1+bound(flareAge/.5)*1.5));this.flareMat.uniforms.uTime.value=visualTime;this.flareMat.uniforms.uFade.value=fade*(1-bound(flareAge/.5));this.flareMat.uniforms.uColor.value.set(c.coreColor);for(let i=0;i<this.flareRings.length;i++)this.flareRings[i].rotation.set(i*TAU/3,visualTime*(i%2?-1:1),i*TAU/6);this.flareStar.rotation.y=visualTime;const hitAge=this._hitAt<0?-1:elapsed-this._hitAt,shardDuration=Math.max(.1,c.shardDuration??.8),shardProgress=hitAge<0?0:bound(hitAge/shardDuration);this.shardMat.uniforms.uTime.value=visualTime;this.shardMat.uniforms.uFade.value=fade*(1-shardProgress);this.shardMat.uniforms.uColor.value.set(c.coreColor);for(let i=0;i<this.strikeShards.length;i++){const shard=this.strikeShards[i],a=i*2.399963;shard.visible=!this.reduceMotion&&hitAge>=0&&shardProgress<1;shard.position.set(this._targetPos.x-this.position.x+Math.cos(a)*shardProgress*(c.impactScale??1),.2+shardProgress*(.5+(i%3)*.25),this._targetPos.z-this.position.z+Math.sin(a)*shardProgress*(c.impactScale??1));shard.rotation.set(a*.3+visualTime,a*.7,a+visualTime);shard.scale.setScalar((c.shardScale??1)*(.5+.5*(i%2))*(1-shardProgress));}
 }
 onDestroy(){this.chartGroup.visible=false;this.travelStar.visible=false;this.beam.visible=false;this._target=null;this._found.length=0;}
 dispose(){for(const g of this.gs)g.dispose();for(const m of this.ms)m.dispose();super.dispose();}
}
export function buildEditor(gui,c,Editor){const f=gui.addFolder('Celestial Cartography');for(const [k,a,b,s] of [['zoneRadius',1,8,.1],['chartHeight',2,9,.1],['starScale',.25,2,.05],['armDelay',.1,3,.05],['drawTime',.1,3,.05],['collapseStrength',0,1,.05],['strikeDelay',.1,1,.05],['strikeRadius',.25,3,.05],['impactScale',.25,3,.05],['impactGlow',0,2,.05],['shardScale',.25,2,.05],['shardDuration',.1,2,.05],['flareScale',.25,2,.05],['lifetime',2,12,.1]])f.add(c,k,a,b,s);addCommonEditorControls(f,c,Editor);return f;}
