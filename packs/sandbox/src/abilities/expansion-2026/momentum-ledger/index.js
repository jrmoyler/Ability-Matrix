import { createExpansionFX, expansionBurst, expansionImpact, ParticleShape } from '../ExpansionFX.js';
import { AdditiveBlending, BufferGeometry, Color, DoubleSide, Float32BufferAttribute, Group, InstancedMesh, Mesh, MeshBasicMaterial, MeshStandardMaterial, Object3D, PlaneGeometry, ShaderMaterial, TorusGeometry, Vector3 } from 'three';
import { Ability as BaseAbility } from '../../Ability.js';
import { settings } from '../../../config/settings.js';
import { LAYER } from '../../../core/Layers.js';
import config from './config.js';
export {config}; export const ID=config.id;
const TAU=Math.PI*2, clamp=x=>Math.max(0,Math.min(1,x));
const delta=new Vector3(), scratch=new Object3D();const MAX_VECTORS=32, MAX_TARGETS=16;
/** A cut arrowhead with a raised spine; an oriented velocity glyph, not a flat decal. */
function vectorGeometry(){const g=new BufferGeometry(),v=[];const face=(a,b,c)=>v.push(...a,...b,...c);
 const p=[[0,0,.46],[-.17,0,.03],[-.065,0,.08],[-.065,0,-.4],[.065,0,-.4],[.065,0,.08],[.17,0,.03]];
 for(let i=0;i<p.length;i++){const a=p[i],b=p[(i+1)%p.length];face([0,.08,0],a,b);face([0,-.025,0],b,a);}g.setAttribute('position',new Float32BufferAttribute(v,3));g.computeVertexNormals();return g;}
function field(){return new ShaderMaterial({transparent:true,depthWrite:false,side:DoubleSide,blending:AdditiveBlending,
 uniforms:{time:{value:0},charge:{value:0},fade:{value:1},a:{value:new Color('#ff9a50')},b:{value:new Color('#a8383d')}},
 vertexShader:`varying vec2 q;void main(){q=uv*2.-1.;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
 fragmentShader:`varying vec2 q;uniform float time,charge,fade;uniform vec3 a,b;void main(){float r=length(q);float phi=atan(q.y,q.x);float edge=exp(-abs(r-.94)*65.);float travel=pow(max(0.,sin(phi*10.-time*6.-r*12.)),14.);float wave=exp(-abs(r-mod(time*.65,1.))*45.)*charge;float mask=1.-smoothstep(.92,1.,r);float alpha=(edge*.7+travel*.23+wave*.6)*mask*fade;gl_FragColor=vec4(mix(b,a,clamp(edge+wave+charge*.5,0.,1.))*2.,alpha);}`});}
/** Ledger stores movement, not the aim distance: teleports are rejected as velocity spikes. */
export class Ability extends BaseAbility{
 constructor(ctx){super(ID,ctx);}get handlesOwnHits(){return true;}get impactDuration(){return this.config.chargeDuration+.5;}get fadeDuration(){return .75;}
 createShaders(){this.resources=[];const own=x=>(this.resources.push(x),x);this.root=new Group();this.group.add(this.root);this.fieldMat=own(field());this.field=new Mesh(own(new PlaneGeometry(1,1)),this.fieldMat);this.field.rotation.x=-Math.PI/2;this.field.position.y=.035;this.field.layers.set(LAYER.VFX);this.root.add(this.field);
 this.metal=own(new MeshStandardMaterial({color:0x8c4945,metalness:.78,roughness:.24,emissive:0x4b1b0d}));this.glow=own(new MeshBasicMaterial({color:0xffbb75,transparent:true,opacity:.9,depthWrite:false,blending:AdditiveBlending}));
 const ring=own(new TorusGeometry(1,.028,8,96));this.rings=[];for(let i=0;i<3;i++){const o=new Mesh(ring,i===1?this.glow:this.metal);o.rotation.x=Math.PI/2;o.position.y=.1+i*.025;this.root.add(o);this.rings.push(o);}
 const arrow=own(vectorGeometry());this.vectors=new InstancedMesh(arrow,this.glow,MAX_VECTORS);this.vectors.frustumCulled=false;this.root.add(this.vectors);
 this._prev=new Vector3();this._last=new Vector3();this._target=new Vector3();this._force={impulse:0,lift:0,spin:0};this._found=[];this._disposed=false;}
 createParticles(){this.fx=createExpansionFX(this.ctx,'motion',{shape:ParticleShape.STREAK,colors:["#fff4df", "#ffb088", "#d65d52", "#4e203b"]});}
 onSpawn(){const p=this.ctx.character?.position??this.origin;this._prev.copy(p);this._last.copy(p);this._target.copy(this.origin).addScaledVector(this.direction,this.length);this._distance=0;this._released=false;this.root.visible=true;this._sync();}
 onTravel(dt){this._capture(dt);this._sync();}
 onImpact(){this._sync();}
 onFade(dt){this._capture(dt);if(!this._released&&this.impactTime>=this.config.chargeDuration){this._released=true;this._strike();this.lightBoost=4;expansionImpact(this.ctx,this.config.accentColor,this.config.impactShake,this.config.impactFlash);}this._sync();}
 _capture(dt){if(this._released||dt<=0)return;const p=this.ctx.character?.position??this._last;delta.copy(p).sub(this._prev).setY(0);const n=delta.length();if(n<=this.config.maxSpeed*dt+0.02)this._distance=Math.min(this.config.maxDistance,this._distance+n);this._prev.copy(p);this._last.copy(p);}
 _strike(){expansionBurst(this.fx, this._target, {count:56,size:.08,life:.65,speed:6,radius:this.config.zoneRadius*.35});const c=this.config,field=this.ctx.dummies;if(!field?.findTargets)return;const q=clamp(this._distance/Math.max(.01,c.maxDistance)),power=settings.global.explosionIntensity;
 this._force.impulse=(c.baseImpulse+c.bonusImpulse*q)*power;this._force.lift=c.lift*(.6+.4*q)*power;this._force.spin=c.spin;
 const found=field.findTargets(this._target.x,this._target.z,c.zoneRadius,this._found);let hits=0;for(const d of found){delta.set(d.position.x-this._target.x,0,d.position.z-this._target.z);if(delta.lengthSq()>c.zoneRadius*c.zoneRadius)continue;if(delta.lengthSq()<1e-9)delta.copy(this.direction);else delta.normalize();if(d.kill(delta.x,delta.z,this._force)&&++hits>=MAX_TARGETS)break;}}
 _sync(){const c=this.config,r=c.zoneRadius,q=clamp(this._distance/Math.max(.01,c.maxDistance));const fade=this.phase==='fade'?1-clamp(this.fadeTime/this.fadeDuration):1;this.root.position.copy(this._target);this.position.copy(this._target);this.field.scale.set(r*2,r*2,1);const u=this.fieldMat.uniforms;u.time.value=this.age;u.charge.value=q;u.fade.value=fade;u.a.value.set(c.accentColor);u.b.value.set(c.trailColor);
 for(let i=0;i<3;i++){this.rings[i].scale.setScalar(r*(.55+i*.17));this.rings[i].rotation.z=this.age*(i%2?-.9:.65);}
 for(let i=0;i<MAX_VECTORS;i++){let a=i*TAU/MAX_VECTORS+this.age*(.4+q),radius=r*(.42+(i%3)*.16);scratch.position.set(Math.sin(a)*radius,.14+(i%4)*.1,Math.cos(a)*radius);scratch.rotation.set(0,a+Math.PI/2,0);scratch.scale.setScalar((.5+q*.5)*fade);scratch.updateMatrix();this.vectors.setMatrixAt(i,scratch.matrix);}this.vectors.instanceMatrix.needsUpdate=true;}
 onDestroy(){this.root.visible=false;this._distance=0;this._released=false;}
 dispose(){if(this._disposed)return;this._disposed=true;for(const r of this.resources)r.dispose();super.dispose();}}
export function buildEditor(gui,c){const f=gui.addFolder('Momentum Ledger');f.add(c,'chargeDuration',.4,5,.05).name('bank time');f.add(c,'maxDistance',1,30,.1).name('distance cap');f.add(c,'zoneRadius',1,8,.1).name('release radius');f.add(c,'bonusImpulse',0,30,.5).name('stored impulse');f.addColor(c,'accentColor').name('velocity');f.addColor(c,'trailColor').name('trail');f.add(c,'impactShake',0,1,.01).name('impact shake');f.add(c,'impactFlash',0,1,.01).name('impact flash');return f;}
