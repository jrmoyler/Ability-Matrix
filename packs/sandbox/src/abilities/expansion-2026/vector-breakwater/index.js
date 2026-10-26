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
  Mesh,
  MeshBasicMaterial,
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
    this._previous.fill(0);
    this._nextTrail.fill(0);
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
      if (elapsed >= 0 && front > this._previous[i])
        this._sweep(i, this._previous[i], front);
      this._previous[i] = front;
    }
  }
  _sweep(i, from, to) {
    const c = this.config,
      field = this.ctx.dummies;
    if (!field?.findTargets) return;
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
      if (
        d.kill(this.direction.x, this.direction.z, this._force) &&
        ++n >= MAX_TARGETS
      )
        break;
    }
  }
  onDestroy() {
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
  f.addColor(c, 'edgeColor').name('edge');
  f.addColor(c, 'bodyColor').name('pressure');
  f.addColor(c, 'groundColor').name('wake');
  f.add(c, 'impactShake', 0, 1, 0.01).name('impact shake');
  f.add(c, 'impactFlash', 0, 1, 0.01).name('impact flash');
  return f;
}
