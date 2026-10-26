import { prefersReducedMotion, addCommonEditorControls } from '../ExpansionAtmosphere.js';
import {
  AdditiveBlending, BufferAttribute, BufferGeometry, CatmullRomCurve3, Color,
  DoubleSide, Group, Mesh, MeshStandardMaterial, PlaneGeometry, ShaderMaterial,
  TorusGeometry, TubeGeometry, Vector3
} from 'three';
import { Ability, AbilityPhase } from '../../Ability.js';
import { LAYER } from '../../../core/Layers.js';
import { settings } from '../../../config/settings.js';
import { ParticleShape } from '../../../particles/ParticleSystem.js';
import { RateEmitter } from '../../../particles/ParticleEngine.js';
import { frame } from '../../../core/FrameUniforms.js';
import { BurstMode } from '../../../effects/BurstSphere.js';
import { DecalType } from '../../../effects/GroundDecals.js';

export const ID = 'exp-predatory-canopy';
const TAU = Math.PI * 2;
const clamp01 = (x) => Math.max(0, Math.min(1, x));
const ease = (x) => 1 - Math.pow(1 - clamp01(x), 3);
const temp = new Vector3();

// Leaves are not cards: their curved, tapered surface has independent midrib
// and serrated silhouette. A vertex shader bends each leaf from its stem.
export function canopyLeafGeometry() {
  const cols = 7, rows = 17, vertices = [], uv = [], indices = [];
  for (let j = 0; j < rows; j++) {
    const t = j / (rows - 1);
    const width = Math.sin(Math.PI * t) ** 0.8 * (1 - 0.12 * t);
    for (let i = 0; i < cols; i++) {
      const x = i / (cols - 1) * 2 - 1;
      const serration = 1 + 0.11 * Math.sin(t * Math.PI * 12) * Math.abs(x) ** 5;
      vertices.push(x * width * 0.42 * serration, t * 1.65, Math.sin(Math.PI * t) * (1 - x*x) * 0.18);
      uv.push(i / (cols - 1), t);
      if (j < rows - 1 && i < cols - 1) {
        const n = j * cols + i;
        indices.push(n, n + cols, n + 1, n + 1, n + cols, n + cols + 1);
      }
    }
  }
  const g = new BufferGeometry();
  g.setAttribute('position', new BufferAttribute(new Float32Array(vertices), 3));
  g.setAttribute('uv', new BufferAttribute(new Float32Array(uv), 2));
  g.setIndex(indices); g.computeVertexNormals();
  return g;
}

/** A curved, tapering trap thorn; a bent spine gives the lunge its silhouette. */
export function canopyThornGeometry() {
  const p=[],uv=[],indices=[],rows=25,cols=13;
  for(let j=0;j<rows;j++)for(let i=0;i<cols;i++){
    const t=j/(rows-1),a=i*TAU/(cols-1),r=.13*(1-t)**1.15;
    p.push(Math.cos(a)*r+.25*t*t,t,Math.sin(a)*r);uv.push(i/(cols-1),t);
    if(j<rows-1&&i<cols-1){const n=j*cols+i;indices.push(n,n+cols,n+1,n+1,n+cols,n+cols+1);}
  }
  const g=new BufferGeometry();g.setAttribute('position',new BufferAttribute(new Float32Array(p),3));g.setAttribute('uv',new BufferAttribute(new Float32Array(uv),2));g.setIndex(indices);g.computeVertexNormals();return g;
}

/** Normalized ribbon surface for a target-seeking strike vine. */
export function canopyStrikeGeometry() {
  const p=[],uv=[],idx=[],rows=49;
  for(let j=0;j<rows;j++){const t=j/(rows-1);for(let side=0;side<2;side++){p.push(side?1:-1,t,0);uv.push(side,t);}if(j<rows-1){const n=j*2;idx.push(n,n+2,n+1,n+1,n+2,n+3);}}
  const g=new BufferGeometry();g.setAttribute('position',new BufferAttribute(new Float32Array(p),3));g.setAttribute('uv',new BufferAttribute(new Float32Array(uv),2));g.setIndex(idx);g.computeVertexNormals();return g;
}
function canopyStrikeMaterial(){return new ShaderMaterial({transparent:true,depthWrite:false,side:DoubleSide,uniforms:{uTime:{value:0},uAnchor:{value:new Vector3()},uTarget:{value:new Vector3()},uProgress:{value:0},uWidth:{value:.12},uFade:{value:0},uColor:{value:new Color('#365423')},uVein:{value:new Color('#a9eb6a')}},vertexShader:`varying vec2 vUv;uniform vec3 uAnchor,uTarget;uniform float uTime,uProgress,uWidth;void main(){vUv=uv;float t=uv.y*uProgress;vec3 mid=(uAnchor+uTarget)*.5+vec3(0.,.8,0.);vec3 p=(1.-t)*(1.-t)*uAnchor+2.*(1.-t)*t*mid+t*t*uTarget;vec2 d=uTarget.xz-uAnchor.xz;vec2 side=vec2(-d.y,d.x)/max(.001,length(d));float w=uWidth*sin(t*3.14159)*(uv.x*2.-1.);p.xz+=side*w;p.y+=sin(t*12.-uTime*4.)*.04*sin(t*3.14159);gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);}`,fragmentShader:`varying vec2 vUv;uniform float uTime,uFade;uniform vec3 uColor,uVein;void main(){float mid=exp(-abs(vUv.x-.5)*22.);float vein=pow(max(0.,cos(vUv.y*38.-uTime*2.)),14.);gl_FragColor=vec4(mix(uColor,uVein,mid*.35+vein*.2),uFade);
#include <tonemapping_fragment>
#include <colorspace_fragment>
}`});}

function canopyLeafMaterial() {
  return new ShaderMaterial({
    side: DoubleSide, transparent: true, depthWrite: false,
    uniforms: { uTime: { value: 0 }, uFade: { value: 1 }, uColor: { value: new Color('#55a837') }, uRim: { value: new Color('#d1ff82') } },
    vertexShader: `varying vec2 vUv; varying vec3 vN; uniform float uTime;
      void main(){ vUv=uv; vN=normalize(normalMatrix*normal); vec3 p=position;
      p.z += sin(uTime*2.3 + position.y*3.8 + position.x*7.0)*0.045*uv.y;
      gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.0); }`,
    fragmentShader: `varying vec2 vUv; varying vec3 vN; uniform vec3 uColor,uRim; uniform float uFade;
      void main(){float mid=1.0-smoothstep(0.0,0.035,abs(vUv.x-0.5));
      float veins=pow(max(0.0,cos((vUv.y+abs(vUv.x-.5)*0.65)*55.0)),18.0)*0.25;
      float rim=pow(1.0-abs(dot(normalize(vN),vec3(0.,0.,1.))),2.0);
      vec3 col=uColor*(0.55+0.35*vUv.y)+uRim*(0.22*mid+veins+0.2*rim);
      gl_FragColor=vec4(col,uFade);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
      }`
  });
}

function rootMaterial() {
  return new ShaderMaterial({
    transparent: true, depthWrite: false, side: DoubleSide, blending: AdditiveBlending,
    uniforms: { uTime: {value:0}, uFade:{value:1}, uColor:{value:new Color('#a9eb6a')}, uTrigger:{value:0} },
    vertexShader: `varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    fragmentShader: `varying vec2 vUv; uniform float uTime,uFade,uTrigger; uniform vec3 uColor;
      void main(){vec2 p=vUv*2.-1.;float r=length(p);float a=atan(p.y,p.x);
      float ring=exp(-abs(r-.9)*100.)+0.55*exp(-abs(r-.67)*85.);
      float roots=pow(max(0.,cos(a*12.+sin(r*18.-uTime*1.5))),18.)*smoothstep(.15,.7,r)*(1.-smoothstep(.92,1.,r));
      float pulse=.65+.35*sin(uTime*3.+r*14.);float alpha=(ring+roots*.5)*uFade*(.32+.3*uTrigger)*pulse;
      gl_FragColor=vec4(uColor,alpha);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
      }`
  });
}

function twig(angle, radius, height, seed) {
  const points = [];
  for (let i=0; i<=12; i++) {
    const t=i/12, r=radius*t, bend=Math.sin(t*Math.PI)*(.25 + seed*.14);
    points.push(new Vector3(Math.cos(angle)*r - Math.sin(angle)*bend, height - t*t*.85, Math.sin(angle)*r + Math.cos(angle)*bend));
  }
  return new TubeGeometry(new CatmullRomCurve3(points), 32, 0.075, 7, false);
}

/** A real overhead trap: it arms after arrival, waits for a living target, then lashes once. */
export class PredatoryCanopyAbility extends Ability {
  constructor(ctx) { super(ID, ctx); }
  get handlesOwnHits() { return true; }
  get impactDuration() { return this.config.lifetime; }
  get fadeDuration() { return this.config.fade; }
  get instanceCount() { return this.leaves.length + this.branches.length + this.tendrils.length; }
  createShaders() {
    this.root = new Group(); this.root.name = 'predatory-canopy'; this.group.add(this.root);
    this.root.visible = false;
    this.geometries=[]; this.materials=[];
    const ownG=(g)=>{this.geometries.push(g);return g;};
    const ownM=(m)=>{this.materials.push(m);return m;};
    this.leafGeo=ownG(canopyLeafGeometry()); this.leafMat=ownM(canopyLeafMaterial());
    this.bark=ownM(new MeshStandardMaterial({color:0x365423,roughness:.82,metalness:.04,transparent:true}));
    this.roots=ownM(rootMaterial());
    this.ground=new Mesh(ownG(new PlaneGeometry(2,2)),this.roots);this.ground.rotation.x=-Math.PI/2;this.ground.position.y=.035;this.root.add(this.ground);
    this.strikeRig=new Group();this.group.add(this.strikeRig);this.strikeRig.visible=false;const strikeGeometry=ownG(canopyStrikeGeometry());this.strikeMaterials=[];for(let i=0;i<3;i++){const material=ownM(canopyStrikeMaterial()),vine=new Mesh(strikeGeometry,material);vine.layers.set(LAYER.VFX);vine.frustumCulled=false;this.strikeRig.add(vine);this.strikeMaterials.push(material);}
    this.leaves=[];this.branches=[];this.tendrils=[];
    for(let i=0;i<12;i++) {
      const a=i*TAU/12, branch=new Mesh(ownG(twig(a, 3.7, 0, i%3)),this.bark);
      branch.position.y=4.8;this.root.add(branch);this.branches.push(branch);
      for(let k=0;k<3;k++) {
        const leaf=new Mesh(this.leafGeo,this.leafMat),r=1.1+k*.86;
        leaf.position.set(Math.cos(a)*r,4.8-.12*k,Math.sin(a)*r);leaf.userData.canopyX=leaf.position.x;leaf.userData.canopyZ=leaf.position.z;leaf.userData.canopyYOffset=-.12*k;
        leaf.rotation.set(-.35, -a+Math.PI/2, (k%2?1:-1)*.46);
        leaf.scale.setScalar(.72+(i%3)*.09); this.root.add(leaf);this.leaves.push(leaf);
      }
      const tendon=new Mesh(ownG(new TubeGeometry(new CatmullRomCurve3([
        new Vector3(0,0,0),new Vector3(.4,-1.0,.3),new Vector3(-.3,-2.6,.2),new Vector3(0,-4.1,0)
      ]),32,.045,6,false)),this.bark);
      tendon.position.set(Math.cos(a)*2,4.8,Math.sin(a)*2);tendon.userData.canopyX=tendon.position.x;tendon.userData.canopyZ=tendon.position.z; tendon.rotation.y=a;
      this.root.add(tendon); this.tendrils.push(tendon);
    }
    const thorn=ownG(canopyThornGeometry());this.thorns=[];for(let i=0;i<12;i++){const a=i*TAU/12,spike=new Mesh(thorn,this.bark);spike.position.set(Math.cos(a)*1.2,.03,Math.sin(a)*1.2);spike.rotation.set(.3*Math.sin(a),-a,-.3*Math.cos(a));this.root.add(spike);this.thorns.push(spike);}
    this.seed=new Group();this.group.add(this.seed);this.seed.visible=false;this.seedLeaves=[];for(let i=0;i<4;i++){const leaf=new Mesh(this.leafGeo,this.leafMat);leaf.rotation.set(.7,i*TAU/4,0);leaf.scale.setScalar(.3);this.seed.add(leaf);this.seedLeaves.push(leaf);}this.seed.traverse(n=>{if(n.isMesh){n.layers.set(LAYER.VFX);n.frustumCulled=false;}});
    this.crown=new Mesh(ownG(new TorusGeometry(.46,.075,8,48)),this.bark);
    this.crown.rotation.x=Math.PI/2;this.crown.position.y=4.8;this.root.add(this.crown);
    this.root.traverse((n)=>{if(n.isMesh){n.layers.set(LAYER.VFX);n.frustumCulled=false;}});
    this._found=[];this._target=null;this._triggerAt=-1;this._struck=false;
  }
  createParticles() {
    this.leafParticles = this.ctx.particles?.get('exp.canopy.leaves', { capacity: 600, shape: ParticleShape.LEAF, additive: false, lit: true, curl: true, softFade: .3 });
    this.moteParticles = this.ctx.particles?.get('exp.canopy.motes', { capacity: 480, shape: ParticleShape.SOFT, additive: true, curl: true, softFade: .3 });
    this.leafEmitter = new RateEmitter(); this.moteEmitter = new RateEmitter();
    this._emitPosition = new Vector3(); this._emitDown = new Vector3(0,-1,0);
    this._cueA=new Color();this._cueB=new Color();this._cueDark=new Color();
  }
  onSpawn() {this.reduceMotion=prefersReducedMotion();
    this.root.visible=false;this.seed.visible=true;this.seed.position.copy(this.origin);this._target=null;this._triggerAt=-1;this._strikeAt=-1;this._struck=false;this.strikeRig.visible=false;
    this.leafEmitter.reset(); this.moteEmitter.reset();
    const c=this.config, leaf=this._cueB.set(c.leafColor), rim=this._cueA.set(c.leafRim), bark=this._cueDark.set(c.barkColor);
    this.leafParticles?.setGradient(leaf,rim,leaf,bark);
    this.moteParticles?.setGradient(rim,leaf,bark,bark);this.lastLeafPalette=[c.leafColor,c.leafRim,c.barkColor].join('|');
    this.root.scale.setScalar(1);this.leafMat.uniforms.uFade.value=1;this.roots.uniforms.uFade.value=1;
  }
  onTravel() {const c=this.config,visualTime=this.reduceMotion?0:this.age;this.seed.position.copy(this.position);this.seed.position.y=.8;this.seed.rotation.y=visualTime*3;this.seed.scale.setScalar(c.seedScale??1);this.leafMat.uniforms.uTime.value=visualTime;this.leafMat.uniforms.uFade.value=1;this.leafMat.uniforms.uColor.value.set(c.leafColor);this.leafMat.uniforms.uRim.value.set(c.leafRim);}
  onImpact() {
    this.seed.visible=false;this.strikeRig.position.copy(this.position);this.root.position.copy(this.position);this.root.position.y=0;this.root.visible=true;
    this.root.updateMatrix();
  }
  onFade(dt, t) {const visualTime=this.reduceMotion?0:this.age;
    const c=this.config, elapsed=this.impactTime;
    const palette=[c.leafColor,c.leafRim,c.barkColor].join('|');if(palette!==this.lastLeafPalette){const leaf=this._cueB.set(c.leafColor),rim=this._cueA.set(c.leafRim),bark=this._cueDark.set(c.barkColor);this.leafParticles?.setGradient(leaf,rim,leaf,bark);this.moteParticles?.setGradient(rim,leaf,bark,bark);this.lastLeafPalette=palette;}
    const fade=t <= 1 ? 1 : 1-clamp01(t-1);
    const opening=ease(elapsed / Math.max(.01,c.armDelay)),closing=t<=1?0:clamp01(t-1),width=opening*(1-closing*clamp01(c.retreatStrength??.8));
    this.root.scale.set(Math.max(.01,width),1,Math.max(.01,width));
    this.ground.scale.set(c.zoneRadius,c.zoneRadius,1);
    const h=Math.max(1,c.canopyHeight-closing*(c.dropDistance??1.5)), spread=Math.max(.5,c.canopySpread)/4;
    for(const branch of this.branches){branch.position.y=h;branch.scale.set(spread,1,spread);}
    for(const leaf of this.leaves){leaf.position.set(leaf.userData.canopyX*spread,h+leaf.userData.canopyYOffset,leaf.userData.canopyZ*spread);}
    for(const vine of this.tendrils){vine.position.set(vine.userData.canopyX*spread,h,vine.userData.canopyZ*spread);vine.scale.y=h/4.8;}
    this.crown.position.y=h;
    this.leafMat.uniforms.uTime.value=visualTime;this.leafMat.uniforms.uFade.value=fade;
    this.leafMat.uniforms.uColor.value.set(c.leafColor);this.leafMat.uniforms.uRim.value.set(c.leafRim);
    this.bark.color.set(c.barkColor);this.bark.opacity=fade;this.roots.uniforms.uTime.value=visualTime;this.roots.uniforms.uFade.value=fade;this.roots.uniforms.uColor.value.set(c.rootColor);
    if(dt>0 && this.phase===AbilityPhase.IMPACT && elapsed>=c.armDelay && this._triggerAt<0) {
      const field=this.ctx.dummies;
      if(field?.findTargets){
        const found=field.findTargets(this.position.x,this.position.z,c.zoneRadius,this._found);
        this._target=found.find(d=>d.alive) ?? null;
        if(this._target) this._triggerAt=elapsed;
        this._found.length=0;
      }
    }
    const wind=this._triggerAt<0?0:clamp01((elapsed-this._triggerAt)/Math.max(.01,c.triggerWindup));
    this.roots.uniforms.uTrigger.value=wind;
    const target=this._target,dist=target?Math.hypot(target.position.x-this.position.x,target.position.z-this.position.z):Infinity,release=this._strikeAt<0?1:1-clamp01((elapsed-this._strikeAt)/Math.max(.1,c.strikeDuration??.6));
    this.strikeRig.visible=!!target&&wind>0&&release>0&&dist<=c.zoneRadius;
    if(this.strikeRig.visible){for(let i=0;i<this.strikeMaterials.length;i++){const a=i*TAU/3,mat=this.strikeMaterials[i];mat.uniforms.uAnchor.value.set(Math.cos(a)*c.canopySpread*.28,h,Math.sin(a)*c.canopySpread*.28);mat.uniforms.uTarget.value.set(target.position.x-this.position.x,.35,target.position.z-this.position.z);mat.uniforms.uProgress.value=wind;mat.uniforms.uWidth.value=c.strikeWidth??.12;mat.uniforms.uTime.value=visualTime;mat.uniforms.uFade.value=fade*release;mat.uniforms.uColor.value.set(c.barkColor);mat.uniforms.uVein.value.set(c.rootColor);}}

    if (!this.reduceMotion && this.leafParticles && this.moteParticles && this.phase===AbilityPhase.IMPACT) {
      this._emitPosition.copy(this.position).setY(h*.85);
      const leafCount=this.leafEmitter.tick(dt,Math.max(0,c.leafRate)*(wind>0?3.5:1)), moteCount=this.moteEmitter.tick(dt,Math.max(0,c.moteRate));
      const params={position:this._emitPosition, radius:c.zoneRadius*.7, direction:this._emitDown, speed:.55, spread:.7, size:c.leafSize, life:1.7, spin:3, time:frame.uTime.value};
      if(leafCount)this.leafParticles.emit(leafCount,params);
      if(moteCount)this.moteParticles.emit(moteCount,{...params,speed:.2,size:.07,life:1.2});
    }
    for(const thorn of this.thorns){thorn.visible=wind>0;thorn.scale.set(1,Math.max(.001,wind*(c.thornLength??1.5)),1);}
    for(let i=0;i<this.tendrils.length;i++) {
      const v=this.tendrils[i];v.rotation.z=Math.sin(i*TAU/12)*wind*.42;v.rotation.x=Math.cos(i*TAU/12)*wind*.42;
    }
    if(dt>0 && this._target && !this._struck && wind>=1){
      this._struck=true;this._strikeAt=elapsed;
      const d=this._target;
      if(d.alive && Math.hypot(d.position.x-this.position.x,d.position.z-this.position.z)<=c.zoneRadius){
        temp.set(this.position.x-d.position.x,0,this.position.z-d.position.z);
        if(temp.lengthSq()<1e-6) temp.copy(this.direction);temp.normalize();
        const hit=d.kill(temp.x,temp.z,{impulse:c.hitImpulse,lift:c.hitLift,spin:c.hitSpin});
        if(hit && !this.reduceMotion) {
          const a=this._cueA.set(c.leafRim), b=this._cueB.set(c.leafColor), dark=this._cueDark.set(c.barkColor);
          this.ctx.bursts?.spawn(BurstMode.AIR,d.position,{radius:.15,endRadius:Math.min(3,c.zoneRadius*.6),life:.55,intensity:.5,colorA:a,colorB:b,colorC:dark});
          this.ctx.decals?.spawn(DecalType.DUSTRING,d.position,{radius:Math.min(4,c.zoneRadius),life:.9,intensity:.55,colorA:b,colorB:dark});
        }
      }
    }
  }
  onDestroy(){this.root.visible=false;this.seed.visible=false;this.strikeRig.visible=false;this._target=null;this._found.length=0;}
  dispose(){for(const g of this.geometries)g.dispose();for(const m of this.materials)m.dispose();super.dispose();}
}
export const AbilityType = PredatoryCanopyAbility;
export function buildEditor(gui, c, Editor) {
  const f=gui.addFolder('Predatory Canopy');
  for(const [key,min,max,step] of [['zoneRadius',1,8,.1],['canopyHeight',2,9,.1],['canopySpread',1,7,.1],['seedScale',.25,2,.05],['armDelay',.1,3,.05],['triggerWindup',.1,1,.05],['thornLength',.25,3,.05],['strikeWidth',.03,.5,.01],['strikeDuration',.1,2,.05],['retreatStrength',0,1,.05],['dropDistance',0,4,.1],['leafRate',0,80,1],['moteRate',0,80,1],['leafSize',.02,.5,.01],['lifetime',2,12,.1]]) f.add(c,key,min,max,step);
  addCommonEditorControls(f,c,Editor);return f;
}
