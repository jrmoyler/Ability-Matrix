import { createExpansionFX, expansionBurst, expansionImpact, ParticleShape } from '../ExpansionFX.js';
import { AdditiveBlending, CatmullRomCurve3, Color, DoubleSide, Group, Mesh, MeshBasicMaterial, MeshStandardMaterial, PlaneGeometry, ShaderMaterial, Shape, ExtrudeGeometry, TorusGeometry, TubeGeometry, Vector3 } from 'three';
import {Ability as BaseAbility} from '../../Ability.js';
import {settings} from '../../../config/settings.js';
import {LAYER} from '../../../core/Layers.js';
import config from './config.js';
export {config};export const ID=config.id;const UID='matrix-expansion/pulse-covenant',TAU=Math.PI*2;
const clamp=x=>Math.max(0,Math.min(1,x));
function heart(){const s=new Shape();s.moveTo(0,-.8);s.bezierCurveTo(-.6,-.36,-.78,.08,-.65,.4);s.bezierCurveTo(-.5,.78,-.15,.74,0,.48);s.bezierCurveTo(.15,.74,.5,.78,.65,.4);s.bezierCurveTo(.78,.08,.6,-.36,0,-.8);return new ExtrudeGeometry(s,{depth:.22,bevelEnabled:true,bevelSegments:4,steps:1,bevelSize:.12,bevelThickness:.11,curveSegments:24});}
function membrane(){return new ShaderMaterial({transparent:true,depthWrite:false,side:DoubleSide,blending:AdditiveBlending,uniforms:{time:{value:0},pulse:{value:0},fade:{value:1},color:{value:new Color('#ff8290')}},vertexShader:`varying vec2 q;void main(){q=uv*2.-1.;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,fragmentShader:`varying vec2 q;uniform float time,pulse,fade;uniform vec3 color;void main(){float r=length(q);float a=atan(q.y,q.x);float rings=pow(max(0.,cos(r*33.-time*4.)),20.);float branches=pow(abs(sin(a*7.+sin(r*17.-time*2.))),26.);float wave=exp(-abs(r-pulse)*45.);float mask=1.-smoothstep(.9,1.,r);float alpha=(rings*.18+branches*.2+wave*.65)*mask*fade;gl_FragColor=vec4(color*2.,alpha);}`});}
/** A timed reactive covenant. Every in-rhythm pair of other cast hits produces a single bounded blood pulse. */
export class Ability extends BaseAbility{
 constructor(ctx){super(ID,ctx);}get handlesOwnHits(){return true;}get impactDuration(){return this.config.life;}get fadeDuration(){return .6;}
 createShaders(){this.resources=[];const own=x=>(this.resources.push(x),x);this.root=new Group();this.group.add(this.root);
 this.heartMat=own(new MeshStandardMaterial({color:0x750a22,emissive:0x530014,emissiveIntensity:.65,metalness:.25,roughness:.28}));
 this.veinMat=own(new MeshStandardMaterial({color:0xd91f47,emissive:0x9f002b,emissiveIntensity:.85,roughness:.33}));
 this.glow=own(new MeshBasicMaterial({color:0xff8290,transparent:true,opacity:.65,depthWrite:false,blending:AdditiveBlending}));
 this.core=new Mesh(own(heart()),this.heartMat);this.core.position.set(0,1.5,0);this.core.scale.setScalar(.48);this.root.add(this.core);
 this.branches=[];for(let k=0;k<6;k++){const angle=k*TAU/6,points=[];for(let i=0;i<9;i++){const t=i/8,rad=.25+t*1.65,a=angle+Math.sin(t*4+k)*.12;points.push(new Vector3(Math.sin(a)*rad,1.25*(1-t)+.12,Math.cos(a)*rad));}const vein=new Mesh(own(new TubeGeometry(new CatmullRomCurve3(points),48,.035,7,false)),this.veinMat);this.root.add(vein);this.branches.push(vein);}
 const ringGeo=own(new TorusGeometry(1,.035,8,100));this.ring=new Mesh(ringGeo,this.glow);this.ring.rotation.x=Math.PI/2;this.ring.position.y=.08;this.root.add(this.ring);
 this.membrane=own(membrane());this.floor=new Mesh(own(new PlaneGeometry(1,1)),this.membrane);this.floor.rotation.x=-Math.PI/2;this.floor.position.y=.05;this.floor.layers.set(LAYER.VFX);this.root.add(this.floor);
 this._unsub=null;this._lastTick=null;this._pulseAge=999;this._seen=new Set();this._seenOrder=[];this._disposed=false;}
 createParticles(){this.fx=createExpansionFX(this.ctx,'blood',{shape:ParticleShape.DROPLET,colors:['#fff1e7','#ff8290','#c11136','#3d0717'],additive:false});}
 onSpawn(){this._lastTick=null;this._lastCast=null;this._pulseAge=999;this._seen.clear();this._seenOrder.length=0;this.root.visible=true;this._bind();this._sync();}
 _bind(){const bridge=this.ctx.expansionCombat;if(!bridge?.bind){this._bridgeUnavailable=true;return;}const scope=bridge.bind(UID,'caster');this._scope=scope;this._bridgeUnavailable=false;const sub=scope.on('hit',(e)=>this._onHit(e));this._bridgeUnavailable=!sub?.ok;this._unsub=sub?.ok?sub.unsubscribe:null;}
 _onHit(e){if(!this.isActive||e.ownerId!=='caster'||e.abilityUid===UID||!e.targetIds?.length||this._seen.has(e.eventId))return;
  const cast=e.castId??e.eventId;if(cast===this._lastCast)return;this._lastCast=cast;this._seen.add(e.eventId);this._seenOrder.push(e.eventId);if(this._seenOrder.length>128)this._seen.delete(this._seenOrder.shift());
  const tickRate=this._scope?.tickRate??30, interval=this._lastTick===null?Infinity:(e.tick-this._lastTick)/tickRate;this._lastTick=e.tick;
  if(Math.abs(interval-this.config.beatSeconds)>this.config.tolerance)return;
  const at=e.position, result=this._scope.queryActors({position:at,radius:this.config.pulseRadius,relation:'enemy'});if(!result?.ok)return;
  const ids=result.actors.filter(x=>x.alive&&!e.targetIds.includes(x.id)).slice(0,Math.min(8,this.config.maxTargets)).map(x=>x.id);if(!ids.length)return;
  const sent=this._scope.emit({type:'hit',element:'blood',targetIds:ids,position:at,damage:this.config.damage,tags:['pulse-covenant']});if(sent?.ok){this._pulseAge=0;this.lightBoost=2;expansionImpact(this.ctx,this.config.bloodGlow,this.config.impactShake,this.config.impactFlash);this._fxPoint??=new Vector3();this._fxPoint.fromArray(at);expansionBurst(this.fx,this._fxPoint,{count:48,size:.12,life:.8,speed:2.6,radius:this.config.pulseRadius*.25});}}
 onTravel(dt){this._pulseAge+=dt;this._sync();}onImpact(){this._sync();}onFade(dt){this._pulseAge+=dt;this._sync();}
 _sync(){const c=this.config,p=this.ctx.character?.position??this.origin;this.root.position.copy(p);this.position.copy(p);const beat=Math.pow(.5+.5*Math.sin(this.age*TAU/Math.max(.1,c.beatSeconds)),8);this.core.scale.setScalar(.48*(1+beat*.15));this.core.rotation.y=Math.sin(this.age*1.2)*.1;this.heartMat.color.set(c.heartColor);this.veinMat.color.set(c.arteryColor);this.glow.color.set(c.bloodGlow);
  const r=c.pulseRadius;this.ring.scale.setScalar(r);this.floor.scale.set(r*2,r*2,1);this.membrane.uniforms.time.value=this.age;this.membrane.uniforms.pulse.value=clamp(this._pulseAge/.65);this.membrane.uniforms.fade.value=this.phase==='fade'?1-clamp(this.fadeTime/this.fadeDuration):1;this.membrane.uniforms.color.value.set(c.bloodGlow);}
 onDestroy(){this._unsub?.();this._unsub=null;this._scope=null;this.root.visible=false;this._seen.clear();this._seenOrder.length=0;}
 dispose(){if(this._disposed)return;this._disposed=true;this.onDestroy();for(const r of this.resources)r.dispose();super.dispose();}}
export function buildEditor(gui,c){const f=gui.addFolder('Pulse Covenant');f.add(c,'beatSeconds',.2,1.5,.05).name('beat (s)');f.add(c,'tolerance',.03,.3,.01).name('timing window');f.add(c,'pulseRadius',1,8,.1).name('pulse radius');f.add(c,'damage',0,2,.05).name('pulse damage');f.addColor(c,'heartColor').name('heart');f.addColor(c,'arteryColor').name('arteries');f.addColor(c,'bloodGlow').name('pulse');f.add(c,'impactShake',0,1,.01).name('impact shake');f.add(c,'impactFlash',0,1,.01).name('impact flash');return f;}
