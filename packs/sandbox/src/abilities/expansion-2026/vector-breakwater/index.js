import { bindExpansionCombat } from '../StandaloneCombat.js';
import { impactForce } from '../ImpactForce.js';
import {
  createExpansionFX,
  routeExpansionTransparency,
  expansionBurst,
  expansionImpact,
  ParticleShape,
} from '../ExpansionFX.js';
import {
  AdditiveBlending,
  BufferGeometry,
  Color,
  DoubleSide,
  Float32BufferAttribute,
  Group,
  InstancedMesh,
  Mesh,
  MeshBasicMaterial,
  Object3D,
  PlaneGeometry,
  RingGeometry,
  ShaderMaterial,
  Vector3,
} from 'three';
import { Ability as BaseAbility } from '../../Ability.js';
import { settings } from '../../../config/settings.js';
import { LAYER } from '../../../core/Layers.js';
import config from './config.js';
export { config };
export const ID = config.id;
const TAU = Math.PI * 2,
  clamp = (x) => Math.max(0, Math.min(1, x));
const loc = new Vector3();
const finTransform = new Object3D();
const FINS_PER_FRONT = 6;
const MAX_TARGETS = 16;
/** Parameterized curved shield front, with tapered tips and camber; not a stock quad. */
function frontGeometry() {
  const positions = [],
    uv = [],
    indices = [];
  const nx = 56,
    ny = 12;
  for (let j = 0; j <= ny; j++) {
    const y = j / ny;
    for (let i = 0; i <= nx; i++) {
      const x = (i / nx) * 2 - 1;
      const taper = Math.sqrt(Math.max(0, 1 - x * x));
      positions.push(x * 0.5, y * taper, 0.12 * (1 - x * x) * (1 - y));
      uv.push(i / nx, y);
      if (i < nx && j < ny) {
        const a = j * (nx + 1) + i,
          b = a + nx + 1;
        indices.push(a, b, a + 1, a + 1, b, b + 1);
      }
    }
  }
  const g = new BufferGeometry();
  g.setAttribute('position', new Float32BufferAttribute(positions, 3));
  g.setAttribute('uv', new Float32BufferAttribute(uv, 2));
  g.setIndex(indices);
  g.computeVertexNormals();
  return g;
}
/** Curved internal splines reinforce each travelling shield, independent of its shader. */
function ribGeometry() {
  const vertices = [];
  for (let rib = -2; rib <= 2; rib++) {
    for (let segment = 0; segment < 20; segment++) {
      const sample = (t, side) => {
        const y = .08 + t * .78;
        const x = rib * .105 * (1 - t * .38) + side * .006;
        return [x, y, .12 * (1 - 4 * x * x) * (1 - y) + .012];
      };
      const a = segment / 20, b = (segment + 1) / 20;
      vertices.push(...sample(a, -1), ...sample(b, -1), ...sample(a, 1));
      vertices.push(...sample(a, 1), ...sample(b, -1), ...sample(b, 1));
    }
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new Float32BufferAttribute(vertices, 3));
  geometry.computeVertexNormals();
  return geometry;
}
/** Raised, asymmetric pressure fins used behind each travelling shield. */
function finGeometry() {
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new Float32BufferAttribute([
    0,.7,0, -.3,0,-.3, .3,0,-.3,
    0,.7,0, .3,0,-.3, 0,0,.45,
    0,.7,0, 0,0,.45, -.3,0,-.3,
    -.3,0,-.3, 0,0,.45, .3,0,-.3,
  ], 3));
  geometry.computeVertexNormals();
  return geometry;
}
/** Broken, directional pressure petals arranged around a real contact. */
function contactGeometry() {
  const positions = [], uv = [];
  for (let i = 0; i < 10; i++) {
    const angle = i * TAU / 10, length = .6 + (i % 3) * .16;
    const a = angle - .1, b = angle + .1;
    positions.push(Math.cos(a)*.16,0,Math.sin(a)*.16,
      Math.cos(angle)*length,0,Math.sin(angle)*length,
      Math.cos(b)*.16,0,Math.sin(b)*.16);
    uv.push(0,0, 1,.5, 0,1);
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new Float32BufferAttribute(uv, 2));
  geometry.computeVertexNormals();
  return geometry;
}
function contactMaterial() {
  return new ShaderMaterial({transparent:true,depthWrite:false,side:DoubleSide,blending:AdditiveBlending,
    uniforms:{color:{value:new Color('#fff0dd')},fade:{value:0}},
    vertexShader:`varying vec2 q;void main(){q=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    fragmentShader:`varying vec2 q;uniform vec3 color;uniform float fade;void main(){float tip=1.-q.x;gl_FragColor=vec4(color,(.25+.75*tip)*fade);
#include <tonemapping_fragment>
#include <colorspace_fragment>
}`});
}
function frontMaterial() {
  return new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: DoubleSide,
    blending: AdditiveBlending,
    uniforms: {
      time: { value: 0 },
      fade: { value: 1 },
      edge: { value: new Color('#fff0dd') },
      body: { value: new Color('#d16f56') },
    },
    vertexShader: `varying vec2 q;uniform float time;void main(){q=uv;vec3 p=position;p.z+=sin(uv.x*19.+time*7.)*.008*uv.y;gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);}`,
    fragmentShader: `varying vec2 q;uniform float time,fade;uniform vec3 edge,body;void main(){float side=pow(abs(q.x*2.-1.),6.);float rim=exp(-abs(q.y-.93)*35.);float slash=pow(max(0.,cos(q.x*33.-q.y*17.-time*8.)),16.);float end=smoothstep(0.,.08,q.y)*(1.-smoothstep(.93,1.,q.y));float alpha=(rim*.8+side*.45+slash*.28+.12)*end*fade;gl_FragColor=vec4(mix(body,edge,clamp(rim+side,0.,1.))*2.,alpha);}`,
  });
}
function trailMaterial() {
  return new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: DoubleSide,
    blending: AdditiveBlending,
    uniforms: {
      time: { value: 0 },
      fade: { value: 1 },
      color: { value: new Color('#ff9e76') },
    },
    vertexShader: `varying vec2 q;void main(){q=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    fragmentShader: `varying vec2 q;uniform float time,fade;uniform vec3 color;void main(){float edge=exp(-abs(abs(q.x-.5)-.45)*40.);float bands=pow(max(0.,cos(q.y*60.-time*7.)),20.);float alpha=(edge*.3+bands*.18)*(1.-smoothstep(.95,1.,q.y))*fade;gl_FragColor=vec4(color*1.5,alpha);}`,
  });
}
/** Three independent fronts sweep true line volumes at their own simulation times. */
export class Ability extends BaseAbility {
  constructor(ctx) {
    super(ID, ctx);
  }
  get handlesOwnHits() {
    return true;
  }
  get impactDuration() {
    return Math.max(1.1, this.config.spacing * 3 + 0.5);
  }
  get fadeDuration() {
    return 0.6;
  }
  createShaders() {
    this.resources = [];
    const own = (x) => (this.resources.push(x), x);
    this.root = new Group();
    this.group.add(this.root);
    this.frontMat = own(frontMaterial());
    this.trailMat = own(trailMaterial());
    const geo = own(frontGeometry());
    const ribs = own(ribGeometry());
    this.ribMat = own(new MeshBasicMaterial({ color: 0xffe8cf, transparent: true,
      opacity: .7, depthWrite: false, side: DoubleSide, blending: AdditiveBlending }));
    this.fronts = [];
    this.wakeRings = [];
    this.contacts = [];
    this.contactTimes = [-1,-1,-1];
    const contactGeo = own(contactGeometry());
    this.fins = new InstancedMesh(own(finGeometry()), this.ribMat, 3 * FINS_PER_FRONT);
    this.fins.frustumCulled = false;
    this.root.add(this.fins);
    const wakeGeo = own(new RingGeometry(.88, 1, 64));
    for (let i = 0; i < 3; i++) {
      const mesh = new Mesh(geo, this.frontMat);
      mesh.add(new Mesh(ribs, this.ribMat));
      mesh.layers.set(LAYER.VFX);
      mesh.frustumCulled = false;
      this.root.add(mesh);
      this.fronts.push(mesh);
      const material = own(new MeshBasicMaterial({ color: 0xffe8cf, transparent: true,
        opacity: 0, depthWrite: false, side: DoubleSide, blending: AdditiveBlending }));
      const wake = new Mesh(wakeGeo, material);
      wake.rotation.x = -Math.PI / 2;
      wake.position.y = .06 + i * .005;
      this.root.add(wake);
      this.wakeRings.push(wake);
      const contact = new Mesh(contactGeo, own(contactMaterial()));
      contact.visible = false;
      this.root.add(contact);
      this.contacts.push(contact);
    }
    this.trail = new Mesh(own(new PlaneGeometry(1, 1)), this.trailMat);
    this.trail.rotation.x = -Math.PI / 2;
    this.trail.position.y = 0.03;
    this.trail.layers.set(LAYER.VFX);
    this.root.add(this.trail);
    this._previous = [0, 0, 0];
    this._nextTrail = [0, 0, 0];
    this._found = [];
    this._hitSets = [new Set(), new Set(), new Set()];
    this._force = { impulse: 0, lift: 0, spin: 0 };
    routeExpansionTransparency(this.group);
    this._disposed = false;
  }
  createParticles() {
    this.fx = createExpansionFX(this.ctx, 'force', {
      shape: ParticleShape.STREAK,
      colors: ['#fff6e4', '#ffd1a3', '#e9876f', '#68394b'],
    });
  }
  onSpawn() {
    this._scope = bindExpansionCombat(this.ctx, 'matrix-expansion/vector-breakwater');
    this.failure = null;
    this._pendingContacts = new Map();
    this._hitSubscription = null;
    if (this._scope && !this._scope.standalone) {
      const sub=this._scope.on('hit', event=>{
        const cue=this._pendingContacts.get(event.eventId);
        if (!cue) return;
        this._pendingContacts.delete(event.eventId);
        this._showContact(cue.i,cue.lat,cue.along,cue.position);
      });
      if (sub.ok) this._hitSubscription=sub; else this.failure=sub.reason;
    }
    this._previous.fill(0);
    this._nextTrail.fill(0);
    this.contactTimes.fill(-1);
    for (const contact of this.contacts) contact.visible = false;
    for (const s of this._hitSets) s.clear();
    this.root.visible = true;
    this._updateWaves();
  }
  onTravel() {
    this._updateWaves();
  }
  onImpact() {
    this._updateWaves();
    expansionImpact(
      this.ctx,
      this.config.edgeColor,
      this.config.impactShake,
      this.config.impactFlash,
    );
  }
  onFade() {
    this._updateWaves();
  }
  _updateWaves() {
    const c = this.config,
      speed = c.speed * settings.global.speed,
      fade =
        this.phase === 'fade'
          ? 1 - clamp(this.fadeTime / this.fadeDuration)
          : 1;
    this.root.position.copy(this.origin);
    this.root.rotation.y = Math.atan2(this.direction.x, this.direction.z);
    this.trail.position.z = this.length * 0.5;
    this.trail.scale.set(c.width * 2, this.length, 1);
    this.trailMat.uniforms.time.value = this.age;
    this.trailMat.uniforms.fade.value = fade;
    this.trailMat.uniforms.color.value.set(c.groundColor);
    this.frontMat.uniforms.time.value = this.age;
    this.frontMat.uniforms.fade.value = fade;
    this.frontMat.uniforms.edge.value.set(c.edgeColor);
    this.frontMat.uniforms.body.value.set(c.bodyColor);
    this.ribMat.color.set(c.edgeColor);
    this.ribMat.opacity = .7 * fade;
    for (let i = 0; i < 3; i++) {
      const elapsed = this.age - i * c.spacing,
        front = clamp((elapsed * speed) / this.length) * this.length,
        mesh = this.fronts[i];
      mesh.visible = elapsed >= 0 && front < this.length;
      mesh.position.set(0, 0.04, front);
      mesh.scale.set(c.width * 2, 1.8, 1);
      const arrival = elapsed - this.length / Math.max(.001, speed);
      const wake = this.wakeRings[i];
      wake.visible = arrival >= 0 && arrival < .55;
      if (wake.visible) {
        const t = clamp(arrival / .55);
        wake.position.z = this.length;
        wake.scale.setScalar(c.width * (.15 + t * 1.15));
        wake.material.opacity = .65 * (1 - t) * fade;
        wake.material.color.set(c.edgeColor);
      }
      const contact = this.contacts[i], contactAge = this.contactTimes[i] < 0 ? -1 : this.age - this.contactTimes[i];
      const contactLife = Math.max(.05, c.contactLife ?? .4);
      contact.visible = contactAge >= 0 && contactAge < contactLife;
      if (contact.visible) {
        const t = clamp(contactAge / contactLife);
        contact.scale.setScalar((c.contactSize ?? 1) * (.25 + .75 * t));
        contact.rotation.y = this.age * (i % 2 ? -1 : 1);
        contact.material.uniforms.color.value.set(c.edgeColor);
        contact.material.uniforms.fade.value = (1 - t) * fade;
      }
      const peel = clamp(arrival / .55);
      const active = elapsed >= 0 && arrival < .55;
      for (let j = 0; j < FINS_PER_FRONT; j++) {
        const side = (j / (FINS_PER_FRONT - 1)) * 2 - 1;
        finTransform.position.set(side * (c.width * .82 + peel * (c.finSpread ?? .9)),
          .12 + (j % 3) * .16 + peel * .6,
          front - .25 - (j % 2) * .15 + peel * .45);
        finTransform.rotation.set(peel * 1.5, side * .3, side * (.3 + peel));
        finTransform.scale.setScalar(active ? (c.finSize ?? .22) * (1 - peel) * fade : .001);
        finTransform.updateMatrix();
        this.fins.setMatrixAt(i * FINS_PER_FRONT + j, finTransform.matrix);
      }
      if (elapsed >= 0 && front > this._previous[i])
        this._sweep(i, this._previous[i], front);
      this._previous[i] = front;
    }
    this.fins.instanceMatrix.needsUpdate = true;
  }
  _sweep(i, from, to) {
    const c = this.config,
      field = this.ctx.dummies;
    if (!this._scope && !field?.findTargets) return;
    const mid = (from + to) / 2;
    this.pointAt(mid / this.length, loc);
    if (to >= this._nextTrail[i]) {
      expansionBurst(this.fx, loc, {
        count: 20,
        size: 0.07,
        life: 0.5,
        speed: 4,
        radius: this.config.width * 0.25,
      });
      this._nextTrail[i] = to + 2;
    }
    if (this._scope) {
      const query = this._scope.queryActors({position:[loc.x,0,loc.z], radius:Math.hypot((to-from)/2,c.width), relation:'enemy'});
      if (!query.ok) { this.failure=query.reason; return; }
      const force=impactForce({hitImpulse:c.impulse,hitLift:c.lift,hitSpin:c.spin},settings.global.explosionIntensity);
      let n=0;
      for (const actor of query.actors) {
        const x=actor.position[0]-this.origin.x,z=actor.position[2]-this.origin.z;
        const along=x*this.direction.x+z*this.direction.z, lat=x*this.side.x+z*this.side.z;
        if(along<from || along>to || Math.abs(lat)>c.width || this._hitSets[i].has(actor.id)) continue;
        if(this._hitSets[i].size>=64) break;
        const sent=this._scope.emit({type:'hit',element:'force',targetIds:[actor.id],position:actor.position,
          sourcePosition:[this.origin.x,0,this.origin.z],damage:1,hitForce:force,tags:['vector-breakwater']});
        if(!sent.ok){this.failure=sent.reason;continue;}
        this._hitSets[i].add(actor.id);
        if(n===0){
          if (sent.standalone) this._showContact(i,lat,along,actor.position);
          else if (this._hitSubscription && sent.eventId) this._pendingContacts.set(sent.eventId,{i,lat,along,position:[...actor.position]});
        }
        if(++n>=MAX_TARGETS) break;
      }
      return;
    }
    const found = field.findTargets(
        loc.x,
        loc.z,
        Math.hypot((to - from) / 2, c.width),
        this._found,
      ),
      power = settings.global.explosionIntensity;
    this._force.impulse = c.impulse * power;
    this._force.lift = c.lift * power;
    this._force.spin = c.spin;
    let n = 0;
    for (const d of found) {
      const x = d.position.x - this.origin.x,
        z = d.position.z - this.origin.z,
        along = x * this.direction.x + z * this.direction.z,
        lat = x * this.side.x + z * this.side.z;
      if (
        along < from ||
        along > to ||
        Math.abs(lat) > c.width ||
        this._hitSets[i].has(d)
      )
        continue;
      if (this._hitSets[i].size >= 64) break;
      this._hitSets[i].add(d);
      if (d.kill(this.direction.x, this.direction.z, this._force)) {
        if (n === 0) {
          // The rig's local X is opposite the gameplay side vector.
          this.contacts[i].position.set(-lat, .08 + i * .01, along);
          this.contactTimes[i] = this.age;
          expansionBurst(this.fx, d.position, {count:12,size:.09,life:.38,speed:3,radius:.15});
        }
        if (++n >= MAX_TARGETS) break;
      }
    }
  }
  _showContact(i,lat,along,position) {
    this.contacts[i].position.set(-lat,.08+i*.01,along);
    this.contactTimes[i]=this.age;
    loc.fromArray(position);
    expansionBurst(this.fx,loc,{count:12,size:.09,life:.38,speed:3,radius:.15});
  }
  onDestroy() {
    this._hitSubscription?.unsubscribe(); this._hitSubscription=null;
    this._pendingContacts?.clear();
    this._scope = null;
    this.root.visible = false;
    for (const s of this._hitSets) s.clear();
  }
  dispose() {
    if (this._disposed) return;
    this._disposed = true;
    for (const r of this.resources) r.dispose();
    super.dispose();
  }
}
export function buildEditor(gui, c) {
  const f = gui.addFolder('Vector Breakwater');
  f.add(c, 'width', 0.5, 5, 0.1).name('front width');
  f.add(c, 'spacing', 0.05, 0.6, 0.01).name('front spacing');
  f.add(c, 'speed', 3, 40, 0.5).name('speed');
  f.add(c, 'impulse', 0, 30, 0.5).name('impulse');
  f.add(c, 'finSize', .04, .5, .01).name('pressure fin size');
  f.add(c, 'finSpread', 0, 3, .1).name('arrival spread');
  f.add(c, 'contactSize', .2, 3, .1).name('contact visual size');
  f.add(c, 'contactLife', .1, 1, .05).name('contact visual time');
  f.addColor(c, 'edgeColor').name('edge');
  f.addColor(c, 'bodyColor').name('pressure');
  f.addColor(c, 'groundColor').name('wake');
  f.add(c, 'impactShake', 0, 1, 0.01).name('impact shake');
  f.add(c, 'impactFlash', 0, 1, 0.01).name('impact flash');
  return f;
}
