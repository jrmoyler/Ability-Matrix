import { AdditiveBlending, BufferGeometry, DoubleSide, Float32BufferAttribute, Group, Mesh, MeshBasicMaterial, RingGeometry, ShaderMaterial, Vector3 } from 'three';
import { Ability as BaseAbility } from '../../Ability.js';
import { LAYER } from '../../../core/Layers.js';
import { prefersReducedMotion } from '../ExpansionAtmosphere.js';
import { createPhaseEffects } from './PhaseEffects.js';
import { createAuthoredStages, updateAuthoredStages } from './AuthoredStages.js';
import { createCandidateMonument, updateCandidateMonument } from './CandidateMonuments.js';
import { createTravelDelivery, resetTravelDelivery, updateTravelDelivery, endTravelDelivery } from './TravelDelivery.js';
import { createImpactFragments, updateImpactFragments } from './ImpactFragments.js';
import { createContacts, clearContacts, addContact, updateContacts } from './ContactEffects.js';
import { createElementalGround, updateElementalGround } from './ElementalGround.js';
import { createResonance, updateResonance } from './ResonanceChoreography.js';
import { createExpansionFX, expansionBurst, expansionImpact, ParticleShape } from '../ExpansionFX.js';

const clamp=(n)=>Math.max(0,Math.min(1,n));
function config(id,label,element,accent,hint,glyph){return {id,meta:{label,element,accent,hint,glyph,cast:'zone',key:''},settings:{range:18,minRange:0,speed:28,cooldown:6,castAnim:'cast2',zoneRadius:4,lifetime:1.4,impulse:6,lift:3,lightColor:accent,lightIntensity:4,lightRadius:8,impactShake:.1,impactFlash:.08,accentColor:accent,particleCount:32,detailHeight:1,monumentScale:1.5,monumentGlow:1,deliveryScale:1,deliveryArc:element==='fire'?.6:1.4,fragmentScale:1,fragmentGlow:1,contactScale:1,groundGlow:1,groundOpacity:.65,resonanceScale:1,resonanceMotion:1,groundColor:element==='fire'?'#ff6030':'#8edcff',coreColor:element==='fire'?'#ffd06b':'#cdf6ff',...(element==='fire'?{secondPulse:.55}:{})}};}
export const CINDER_CONFIG=config('cinder-crown','Cinder Crown','fire','#ff8d43','A crown flares twice, pushing enemies from the impact.','<path d="M12 75L21 29L38 52L50 17L62 52L79 29L88 75Z"/>');
export const GLACIER_CONFIG=config('glacier-bell','Glacier Bell','frost','#9ceaff','An expanding frost ring catches each enemy once as it passes.','<path d="M12 65Q50 5 88 65M17 65H83M50 20V80M33 47L67 67M67 47L33 67"/>');

// The crown's rising tongues and the bell's radial ice teeth have different silhouettes.
function sculpture(fire){
  const p=[],uv=[];const count=fire?16:24;
  for(let i=0;i<count;i++){
    const a=i*Math.PI*2/count,b=(i+.72)*Math.PI*2/count,mid=(a+b)/2;
    const r=fire?.72:.88,h=fire?1.1+(i%3)*.25:.35+(i%4)*.12;
    p.push(Math.sin(a)*r,.03,Math.cos(a)*r,Math.sin(b)*r,.03,Math.cos(b)*r,Math.sin(mid)*(fire?.83:1),h,Math.cos(mid)*(fire?.83:1));uv.push(0,0,1,0,.5,1);
  }
  const g=new BufferGeometry();g.setAttribute('position',new Float32BufferAttribute(p,3));g.setAttribute('uv',new Float32BufferAttribute(uv,2));g.computeVertexNormals();return g;
}
function material(fire){return new ShaderMaterial({transparent:true,depthWrite:false,side:DoubleSide,blending:AdditiveBlending,uniforms:{clock:{value:0},fade:{value:1}},vertexShader:'varying vec2 vUv; uniform float clock; void main(){vUv=uv;vec3 p=position;p.y+=sin(clock*3.0+uv.x*5.0)*.025*uv.y;gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.0);}',fragmentShader:`varying vec2 vUv;uniform float clock,fade;void main(){float pulse=.65+.35*sin(clock*5.0+vUv.y*8.0);vec3 c=${fire?'mix(vec3(.9,.08,.01),vec3(1.,.75,.12),vUv.y)':'mix(vec3(.03,.3,.6),vec3(.7,.96,1.),vUv.y)'};gl_FragColor=vec4(c*(1.+pulse),fade*(1.-vUv.y*.65)*.65);}`});}
class PulseAbility extends BaseAbility {
  constructor(id,ctx,fire){super(id,ctx);this.fire=fire;}
  get handlesOwnHits(){return true;}
  get impactDuration(){return this.config.lifetime;}
  get fadeDuration(){return .6;}
  createShaders(){
    // This is called by the base constructor before subclass fields are assigned.
    const fire=this.element===CINDER_CONFIG.id;this.resources=[];const own=x=>(this.resources.push(x),x);
    this.root=new Group();this.group.add(this.root);
    this.delivery=createTravelDelivery(this.group,this.resources,fire);
    this.surface=new Mesh(own(sculpture(fire)),own(material(fire)));this.surface.layers.set(LAYER.VFX);this.root.add(this.surface);
    this.ring=new Mesh(own(new RingGeometry(.96,1,96)),own(new MeshBasicMaterial({color:fire?0xffc95c:0xc9f8ff,transparent:true,opacity:.9,depthWrite:false,side:DoubleSide,blending:AdditiveBlending})));
    this.ring.rotation.x=-Math.PI/2;this.ring.position.y=.05;this.ring.layers.set(LAYER.VFX);this.root.add(this.ring);
    this.detail=createPhaseEffects(this.root,this.resources,fire);
    this.authored=createAuthoredStages(this.root,this.resources,!fire);
    this.monument=createCandidateMonument(this.root,this.resources,fire);
    this.fragments=createImpactFragments(this.root,this.resources,fire);
    this.contacts=createContacts(this.root,this.resources,fire);
    this.ground=createElementalGround(this.root,this.resources,fire);
    this.resonance=createResonance(this.root,this.resources,fire);
    this.found=[];this.hit=new Set();this.target=new Vector3();this._disposed=false;
  }
  createParticles(){this.fx=createExpansionFX(this.ctx,this.element,{shape:this.element===CINDER_CONFIG.id?ParticleShape.STREAK:ParticleShape.CHIP,colors:this.element===CINDER_CONFIG.id?['#fff2a6','#ff9b40','#bd2510','#341018']:['#ffffff','#a8efff','#3895c9','#203a80']});}
  onSpawn(){clearContacts(this.contacts);resetTravelDelivery(this.delivery);updateTravelDelivery(this.delivery,this.origin,this.direction,0,0,this.config.accentColor,this.config.deliveryScale,0,this.config.deliveryArc,prefersReducedMotion());this.hit.clear();this.second=false;this.root.visible=true;this.target.copy(this.origin).addScaledVector(this.direction,this.length);this._sync(1,0);}
  onTravel(dt){updateTravelDelivery(this.delivery,this.position,this.direction,dt,prefersReducedMotion()?0:this.age,this.config.accentColor,this.config.deliveryScale,this.u,this.config.deliveryArc,prefersReducedMotion());this._sync(1,0);}
  onImpact(){endTravelDelivery(this.delivery);this._sync(1,0);this._burst();if(this.fire)this._strike(this.config.zoneRadius,false);}
  onFade(dt,t){const q=clamp(t),fade=t>1?2-t:1;
    if(dt>0&&t<=1){if(this.fire&&!this.second&&q>=this.config.secondPulse){this.second=true;this._burst();this._strike(this.config.zoneRadius,false);}else if(!this.fire)this._strike(this.config.zoneRadius*q,true);}
    updateContacts(this.contacts,dt,this.config.coreColor,this.config.contactScale,fade,prefersReducedMotion());
    this._sync(fade,q);
  }
  _burst(){expansionBurst(this.fx,this.target,{count:this.config.particleCount,radius:this.config.zoneRadius*.6,speed:this.fire?3:1.8,life:.8,size:.12});expansionImpact(this.ctx,this.config.lightColor,this.config.impactShake,this.config.impactFlash);}
  _strike(radius,once){
    const c=this.config;if(!this.ctx.dummies?.findTargets||radius<=0)return;
    this.found.length=0;const found=this.ctx.dummies.findTargets(this.target.x,this.target.z,radius,this.found)||this.found;
    for(let i=0;i<Math.min(found.length,32);i++){const d=found[i];if(!d?.position||typeof d.kill!=='function'||(once&&(this.hit.has(d)||this.hit.size>=32)))continue;
      const dx=d.position.x-this.target.x,dz=d.position.z-this.target.z,dist=Math.hypot(dx,dz);if(dist>radius)continue;
      const x=dist>1e-6?dx/dist:this.direction.x,z=dist>1e-6?dz/dist:this.direction.z;
      if(d.kill(x,z,{impulse:c.impulse,lift:c.lift,spin:0})){addContact(this.contacts,dx,dz);if(once)this.hit.add(d);}
    }
  }
  _sync(fade,q){const radius=this.config.zoneRadius;this.root.position.copy(this.target);this.position.copy(this.target);const travelling=this.phase==='travel';this.surface.visible=!travelling;this.detail.surface.visible=!travelling;this.detail.points.visible=!travelling;this.authored.stage.visible=!travelling;this.monument.group.visible=!travelling;this.surface.scale.set(radius,1,radius);this.ring.scale.setScalar(radius*(travelling||this.fire?1:Math.max(.01,q)));this.surface.material.uniforms.clock.value=prefersReducedMotion()?0:this.age;this.surface.material.uniforms.fade.value=fade;this.ring.material.opacity=(travelling?.3:.8)*fade;this.ring.material.color.set(this.config.accentColor);const u=this.detail.uniforms;u.clock.value=prefersReducedMotion()?0:this.age;u.fade.value=fade;u.beat.value=this.fire?(q<.12||q>=this.config.secondPulse&&q<this.config.secondPulse+.12?1:0):q;u.tint.value.set(this.config.accentColor);this.detail.surface.scale.set(radius,1,radius);this.detail.points.scale.set(radius,1,radius);updateAuthoredStages(this.authored,{radius,q,phase:this.phase,pulse:this.config.secondPulse??0,fade,clock:prefersReducedMotion()?0:this.age,tint:this.config.coreColor,detailHeight:this.config.detailHeight});updateCandidateMonument(this.monument,{q,phase:this.phase,pulse:this.config.secondPulse??0,fade,clock:prefersReducedMotion()?0:this.age,tint:this.config.coreColor,scale:this.config.monumentScale,glow:this.config.monumentGlow});updateImpactFragments(this.fragments,{phase:this.phase,q,pulse:this.config.secondPulse??0,radius,fade,scale:this.config.fragmentScale,glow:this.config.fragmentGlow,tint:this.config.coreColor});updateElementalGround(this.ground,{phase:this.phase,q,pulse:this.config.secondPulse??0,radius,fade,clock:prefersReducedMotion()?0:this.age,tint:this.config.groundColor,glow:this.config.groundGlow,opacity:this.config.groundOpacity});updateResonance(this.resonance,{phase:this.phase,q,pulse:this.config.secondPulse??0,fade,scale:this.config.resonanceScale,amplitude:this.config.resonanceMotion,tint:this.config.coreColor,reducedMotion:prefersReducedMotion()});}
  onDestroy(){clearContacts(this.contacts);endTravelDelivery(this.delivery);this.root.visible=false;this.hit.clear();this.second=false;}
  dispose(){if(this._disposed)return;this._disposed=true;for(const x of this.resources)x.dispose();super.dispose();}
}
export class CinderCrownAbility extends PulseAbility {constructor(ctx){super(CINDER_CONFIG.id,ctx,true);}}
export class GlacierBellAbility extends PulseAbility {constructor(ctx){super(GLACIER_CONFIG.id,ctx,false);}}
function editor(label,gui,c){const f=gui.addFolder(label);f.add(c,'zoneRadius',1,8,.1).name('radius');f.add(c,'lifetime',.3,3,.1).name('duration');f.add(c,'impulse',0,20,.5).name('impulse');f.add(c,'lift',0,12,.5).name('lift');f.addColor(c,'lightColor').name('light');f.addColor(c,'accentColor').name('accent');f.add(c,'particleCount',0,64,1).name('burst particles');f.add(c,'impactShake',0,1,.01).name('impact shake');f.add(c,'impactFlash',0,1,.01).name('impact flash');f.addColor(c,'coreColor').name('core');f.add(c,'detailHeight',.3,2,.05).name('detail height');f.add(c,'monumentScale',.3,3,.05).name('center scale');f.add(c,'monumentGlow',0,3,.05).name('center glow');f.add(c,'deliveryScale',.2,3,.05).name('delivery scale');f.add(c,'deliveryArc',0,4,.05).name('delivery arc');f.add(c,'fragmentScale',.1,3,.05).name('fragment scale');f.add(c,'fragmentGlow',0,3,.05).name('fragment glow');f.add(c,'contactScale',.2,3,.05).name('contact scale');f.addColor(c,'groundColor').name('ground');f.add(c,'groundGlow',0,3,.05).name('ground glow');f.add(c,'groundOpacity',0,1,.01).name('ground opacity');f.add(c,'resonanceScale',.2,3,.05).name('resonance scale');f.add(c,'resonanceMotion',0,2,.05).name('resonance motion');if('secondPulse' in c)f.add(c,'secondPulse',.2,.9,.01).name('second pulse');return f;}
export const cinderEditor=(gui,c)=>editor('Cinder Crown',gui,c);
export const glacierEditor=(gui,c)=>editor('Glacier Bell',gui,c);
export const DUAL_CANDIDATES=Object.freeze([
  {ID:CINDER_CONFIG.id,uid:'matrix-expansion/cinder-crown',config:CINDER_CONFIG,Ability:CinderCrownAbility,buildEditor:cinderEditor},
  {ID:GLACIER_CONFIG.id,uid:'matrix-expansion/glacier-bell',config:GLACIER_CONFIG,Ability:GlacierBellAbility,buildEditor:glacierEditor},
]);
