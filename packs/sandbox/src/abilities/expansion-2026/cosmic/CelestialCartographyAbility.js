import { ExpansionAtmosphere, prefersReducedMotion, addCommonEditorControls } from '../ExpansionAtmosphere.js';
import {AdditiveBlending, BufferAttribute, BufferGeometry, Color, DoubleSide, Group, Mesh, PlaneGeometry, ShaderMaterial, SphereGeometry, TorusGeometry, Vector3} from 'three';
import { Ability, AbilityPhase } from '../../Ability.js';
import { LAYER } from '../../../core/Layers.js';
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
function starlight(){return new ShaderMaterial({transparent:true,depthWrite:false,side:DoubleSide,blending:AdditiveBlending,
 uniforms:{uTime:{value:0},uFade:{value:1},uColor:{value:new Color('#d5bbff')}},
 vertexShader:`varying vec2 vUv;varying vec3 vNormal;void main(){vUv=uv;vNormal=normalize(normalMatrix*normal);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
 fragmentShader:`varying vec2 vUv;varying vec3 vNormal;uniform float uTime,uFade;uniform vec3 uColor;
 void main(){float t=.75+.25*sin(uTime*5.+vUv.x*19.);float rim=pow(1.-abs(vNormal.z),2.);vec3 c=uColor*(t+rim*.4);gl_FragColor=vec4(c,uFade*(.55+.3*t));
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
  this.starGeo=geom(starGeometry());this.beamGeo=geom(beamGeometry());this.starMat=mat(starlight());this.floorMat=mat(chart());this.flareMat=mat(starlight());
  this.floor=new Mesh(geom(new PlaneGeometry(2,2)),this.floorMat);this.floor.rotation.x=-Math.PI/2;this.floor.position.y=.04;this.chartGroup.add(this.floor);
  this.frame=new Mesh(geom(new TorusGeometry(1,.018,6,96)),this.starMat);this.frame.rotation.x=Math.PI/2;this.chartGroup.add(this.frame);
  this.travelStar=new Group();this.group.add(this.travelStar);this.travelStar.visible=false;this.travelStars=[];for(let i=0;i<3;i++){const star=new Mesh(this.starGeo,this.starMat);star.rotation.set(i*TAU/3,0,i*TAU/6);star.scale.setScalar(.45);this.travelStar.add(star);this.travelStars.push(star);}const orbit=new Mesh(this.frame.geometry,this.starMat);orbit.rotation.x=Math.PI/2;orbit.scale.setScalar(.65);this.travelStar.add(orbit);this.travelStar.traverse(n=>{if(n.isMesh){n.layers.set(LAYER.VFX);n.frustumCulled=false;}});
  this.stars=[];this.lines=[];this.nodes=layout.map(([x,z])=>new Vector3(x,0,z));
  for(const node of this.nodes){const star=new Mesh(this.starGeo,this.starMat);star.position.copy(node);star.rotation.x=-Math.PI/2;star.scale.setScalar(.22);this.chartGroup.add(star);this.stars.push(star);}
  for(let i=0;i<this.nodes.length;i++){const line=new Mesh(geom(band(this.nodes[i],this.nodes[(i+1)%this.nodes.length])),this.starMat);this.chartGroup.add(line);this.lines.push(line);}
  this.beam=new Mesh(this.beamGeo,this.starMat);this.chartGroup.add(this.beam);this.beam.visible=false;
  this.flare=new Group();this.chartGroup.add(this.flare);this.flare.visible=false;const flareRing=geom(new TorusGeometry(.5,.018,6,64));this.flareRings=[];for(let i=0;i<3;i++){const ring=new Mesh(flareRing,this.flareMat);this.flare.add(ring);this.flareRings.push(ring);}const flareStar=new Mesh(this.starGeo,this.flareMat);this.flare.add(flareStar);this.flareStar=flareStar;
  const orb=geom(new SphereGeometry(.025,8,6));this.dust=[];
  for(let i=0;i<40;i++){const dot=new Mesh(orb,this.starMat),a=i*2.399963,r=.18+.78*((i*37%41)/40);dot.position.set(Math.cos(a)*r,(i%7)*.03,Math.sin(a)*r);this.chartGroup.add(dot);this.dust.push(dot);}
  this.chartGroup.traverse(n=>{if(n.isMesh){n.layers.set(LAYER.VFX);n.frustumCulled=false;}});
  this._found=[];this._target=null;this._markedAt=-1;this._struck=false;this._strikeAt=-1;this._targetPos=new Vector3();
 }
 createParticles(){this.atmosphere=new ExpansionAtmosphere(this.ctx,'cosmic',{shape:'SOFT',colors:['#f7eaff','#bd9eff','#8067dc','#372356'],rate:26});}
 onSpawn(){this.reduceMotion=prefersReducedMotion();this.atmosphere.reset();this.chartGroup.visible=false;this.travelStar.visible=true;this.travelStar.position.copy(this.origin);this._target=null;this._markedAt=-1;this._struck=false;this._strikeAt=-1;this.flare.visible=false;}
 onTravel(){const c=this.config,visualTime=this.reduceMotion?0:this.age;this.travelStar.position.copy(this.position);this.travelStar.position.y=1.1;this.travelStar.rotation.set(visualTime*.6,visualTime*1.5,visualTime*.9);this.travelStar.scale.setScalar(c.starScale??1);this.starMat.uniforms.uTime.value=visualTime;this.starMat.uniforms.uFade.value=1;this.starMat.uniforms.uColor.value.set(c.chartColor);}
 onImpact(){this.travelStar.visible=false;this.chartGroup.position.copy(this.position);this.chartGroup.visible=true;}
 onFade(dt,t){const visualTime=this.reduceMotion?0:this.age;this.atmosphere.rate=this.config.particleRate??this.atmosphere.rate;this.atmosphere.size=this.config.particleSize??this.atmosphere.size;if(!this.reduceMotion && this.phase===AbilityPhase.IMPACT)this.atmosphere.update(dt,this.position);
  const c=this.config,elapsed=this.impactTime,fade=t<=1?1:1-bound(t-1),rise=smoother(elapsed/Math.max(.01,c.armDelay)),radius=c.zoneRadius;
  this.atmosphere.syncPalette(c.chartColor,c.coreColor);
  this.floor.scale.set(radius,radius,1);this.frame.position.y=c.chartHeight;this.frame.scale.setScalar(radius);
  for(let i=0;i<this.stars.length;i++){const s=this.stars[i];s.position.set(this.nodes[i].x*radius,c.chartHeight,this.nodes[i].z*radius);s.scale.setScalar(.22*(.8+.2*Math.sin(visualTime*3+i)));}
  for(const line of this.lines){line.position.y=c.chartHeight;line.scale.set(radius,1,radius);}
  for(let i=0;i<this.dust.length;i++){const a=i*2.399963,r=radius*(.18+.78*((i*37%41)/40));this.dust[i].position.set(Math.cos(a)*r,c.chartHeight+(i%7)*.03+.08*Math.sin(visualTime*2+i),Math.sin(a)*r);}
  this.starMat.uniforms.uTime.value=visualTime;this.starMat.uniforms.uFade.value=fade*rise;this.starMat.uniforms.uColor.value.set(c.chartColor);
  this.floorMat.uniforms.uTime.value=visualTime;this.floorMat.uniforms.uFade.value=fade*rise;this.floorMat.uniforms.uColor.value.set(c.rayColor);
  if(dt>0 && this.phase===AbilityPhase.IMPACT && elapsed>=c.armDelay && this._markedAt<0){
   const field=this.ctx.dummies;if(field?.findTargets){const found=field.findTargets(this.position.x,this.position.z,radius,this._found);this._target=found.find(d=>d.alive)??null;if(this._target){this._markedAt=elapsed;this._targetPos.copy(this._target.position);}this._found.length=0;}
  }
  const charge=this._markedAt<0?0:bound((elapsed-this._markedAt)/Math.max(.01,c.strikeDelay));this.floorMat.uniforms.uCharge.value=charge;
  this.beam.visible=this._markedAt>=0 && !this._struck;
  if(this.beam.visible){this.beam.position.set(this._targetPos.x-this.position.x,0,this._targetPos.z-this.position.z);this.beam.scale.set(1,c.chartHeight*charge,1);}
  if(dt>0 && this._target && !this._struck && charge>=1){this._struck=true;this._strikeAt=elapsed;const d=this._target;
   if(d.alive && Math.hypot(d.position.x-this._targetPos.x,d.position.z-this._targetPos.z)<=1){V.copy(this.direction);if(d.kill(V.x,V.z,{impulse:c.hitImpulse,lift:c.hitLift,spin:c.hitSpin})&&!this.reduceMotion){this.atmosphere.cue(this._targetPos,c.zoneRadius*.5);this.atmosphere.burst(this._targetPos,22,{radius:.4,speed:1.4,size:.08,life:.9,spread:.8});}}
  }
  const flareAge=this._strikeAt<0?-1:elapsed-this._strikeAt;this.flare.visible=flareAge>=0&&flareAge<.5;this.flare.position.set(this._targetPos.x-this.position.x,.6,this._targetPos.z-this.position.z);this.flare.scale.setScalar((c.flareScale??1)*(1+bound(flareAge/.5)*1.5));this.flareMat.uniforms.uTime.value=visualTime;this.flareMat.uniforms.uFade.value=fade*(1-bound(flareAge/.5));this.flareMat.uniforms.uColor.value.set(c.coreColor);for(let i=0;i<this.flareRings.length;i++)this.flareRings[i].rotation.set(i*TAU/3,visualTime*(i%2?-1:1),i*TAU/6);this.flareStar.rotation.y=visualTime;
 }
 onDestroy(){this.chartGroup.visible=false;this.travelStar.visible=false;this.beam.visible=false;this._target=null;this._found.length=0;}
 dispose(){for(const g of this.gs)g.dispose();for(const m of this.ms)m.dispose();super.dispose();}
}
export function buildEditor(gui,c,Editor){const f=gui.addFolder('Celestial Cartography');for(const [k,a,b,s] of [['zoneRadius',1,8,.1],['chartHeight',2,9,.1],['starScale',.25,2,.05],['armDelay',.1,3,.05],['strikeDelay',.1,1,.05],['flareScale',.25,2,.05],['lifetime',2,12,.1]])f.add(c,k,a,b,s);addCommonEditorControls(f,c,Editor);return f;}
