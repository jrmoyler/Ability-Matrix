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
  ExtrudeGeometry,
  Float32BufferAttribute,
  Group,
  Mesh,
  PlaneGeometry,
  ShaderMaterial,
  Shape,
  Path,
  Vector3,
} from 'three';
import { Ability as BaseAbility } from '../../Ability.js';
import { settings } from '../../../config/settings.js';
import { LAYER } from '../../../core/Layers.js';
import config from './config.js';
export { config };
export const ID = config.id;
const clamp = (x) => Math.max(0, Math.min(1, x));
const point = new Vector3();
const MAX_TARGETS = 16;
/** A faceted theatrical mask with two cut eye apertures. */
function maskGeometry() {
  const s = new Shape();
  s.moveTo(-0.5, 0.58);
  s.quadraticCurveTo(0, 0.84, 0.5, 0.58);
  s.lineTo(0.4, -0.25);
  s.quadraticCurveTo(0, -0.8, -0.4, -0.25);
  s.closePath();
  for (const sign of [-1, 1]) {
    const hole = new Path();
    hole.moveTo(sign * 0.11, 0.21);
    hole.lineTo(sign * 0.34, 0.24);
    hole.lineTo(sign * 0.25, 0.1);
    hole.closePath();
    s.holes.push(hole);
  }
  const g = new ExtrudeGeometry(s, {
    depth: 0.07,
    bevelEnabled: true,
    bevelSegments: 3,
    bevelThickness: 0.035,
    bevelSize: 0.035,
    curveSegments: 24,
  });
  g.computeVertexNormals();
  return g;
}
function maskMaterial() {
  return new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: DoubleSide,
    blending: AdditiveBlending,
    uniforms: {
      time: { value: 0 },
      fade: { value: 1 },
      color: { value: new Color('#f3a5ed') },
      edge: { value: new Color('#fff3ff') },
    },
    vertexShader: `varying vec3 n;varying vec3 p;uniform float time;void main(){n=normalize(normalMatrix*normal);p=position;vec3 q=position;q.x+=sin(time*4.+position.y*9.)*.02;gl_Position=projectionMatrix*modelViewMatrix*vec4(q,1.);}`,
    fragmentShader: `varying vec3 n,p;uniform float time,fade;uniform vec3 color,edge;void main(){float rim=pow(1.-abs(n.z),2.);float bands=pow(max(0.,cos(p.y*35.-time*7.)),14.);float alpha=(.23+rim*.4+bands*.2)*fade;gl_FragColor=vec4(mix(color,edge,clamp(rim+bands*.5,0.,1.))*2.,alpha);}`,
  });
}
function wakeMaterial() {
  return new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: DoubleSide,
    blending: AdditiveBlending,
    uniforms: {
      time: { value: 0 },
      fade: { value: 1 },
      color: { value: new Color('#9654d9') },
    },
    vertexShader: `varying vec2 q;void main(){q=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    fragmentShader: `varying vec2 q;uniform float time,fade;uniform vec3 color;void main(){float bands=pow(max(0.,cos(q.y*33.-time*5.+sin(q.x*9.)*2.)),14.);float side=1.-smoothstep(.35,.5,abs(q.x-.5));gl_FragColor=vec4(color*1.7,bands*side*fade*.3);}`,
  });
}
/** The same masks and wakes appear in all lanes; only one selected lane performs real contacts. */
export class Ability extends BaseAbility {
  constructor(ctx) {
    super(ID, ctx);
  }
  get handlesOwnHits() {
    return true;
  }
  get impactDuration() {
    return 0.7;
  }
  get fadeDuration() {
    return 0.8;
  }
  createShaders() {
    this.resources = [];
    const own = (x) => (this.resources.push(x), x);
    this.root = new Group();
    this.group.add(this.root);
    this.maskMat = own(maskMaterial());
    this.wakeMat = own(wakeMaterial());
    const mask = own(maskGeometry()),
      plane = own(new PlaneGeometry(1, 1));
    this.masks = [];
    this.wakes = [];
    for (let i = 0; i < 3; i++) {
      const m = new Mesh(mask, this.maskMat);
      m.position.y = 1.2;
      m.layers.set(LAYER.VFX);
      this.root.add(m);
      this.masks.push(m);
      const w = new Mesh(plane, this.wakeMat);
      w.rotation.x = -Math.PI / 2;
      w.position.y = 0.04;
      w.layers.set(LAYER.VFX);
      this.root.add(w);
      this.wakes.push(w);
    }
    this._previous = 0;
    this._hits = new Set();
    this._found = [];
    this._force = { impulse: 0, lift: 0, spin: 0 };
    routeExpansionTransparency(this.group);
    this._disposed = false;
  }
  createParticles() {
    this.fx = createExpansionFX(this.ctx, 'illusion', {
      shape: ParticleShape.SOFT,
      colors: ['#ffffff', '#ffcefa', '#b87de9', '#392459'],
    });
  }
  onSpawn() {
    this._previous = 0;
    this._trailElapsed = 0;
    this._hits.clear();
    this.root.visible = true;
    this._lane = Math.max(-1, Math.min(1, Math.round(this.config.trueLane)));
    this._sync();
  }
  onTravel(dt) {
    this._sweep(this._previous, this.front);
    this._previous = this.front;
    this._trailElapsed += dt;
    if (this._trailElapsed >= .12) {
      this._trailElapsed %= .12;
      // All three masks shed the same particles so their visual cues do not
      // disclose which lane carries the hit volume.
      for (let lane = -1; lane <= 1; lane++) {
        this.pointAt(this.u, point);
        point.addScaledVector(this.side, lane * this.config.laneGap);
        point.y = 1.1;
        expansionBurst(this.fx, point, {
          count: 4, size: .11, life: .48, speed: .6, spread: .5, radius: .25,
        });
      }
    }
    this._sync();
  }
  onImpact() {
    this._sync();
    expansionImpact(
      this.ctx,
      this.config.edgeColor,
      this.config.impactShake,
      this.config.impactFlash,
    );
  }
  onFade() {
    this._sync();
  }
  _sweep(from, to) {
    const c = this.config,
      field = this.ctx.dummies;
    if (!field?.findTargets || to <= from) return;
    const mid = (from + to) / 2;
    this.pointAt(mid / this.length, point);
    point.addScaledVector(this.side, this._lane * c.laneGap);
    const found = field.findTargets(
        point.x,
        point.z,
        Math.hypot((to - from) / 2, c.hitWidth),
        this._found,
      ),
      power = settings.global.explosionIntensity;
    this._force.impulse = c.impulse * power;
    this._force.lift = c.lift * power;
    this._force.spin = c.spin;
    let hits = 0;
    for (const d of found) {
      const dx = d.position.x - this.origin.x,
        dz = d.position.z - this.origin.z,
        along = dx * this.direction.x + dz * this.direction.z,
        lat = dx * this.side.x + dz * this.side.z - this._lane * c.laneGap;
      if (
        along < from ||
        along > to ||
        Math.abs(lat) > c.hitWidth ||
        this._hits.has(d)
      )
        continue;
      if (this._hits.size >= 64) break;
      this._hits.add(d);
      expansionBurst(this.fx, d.position, {
        count: 24,
        size: 0.14,
        life: 0.6,
        speed: 2,
        radius: 0.3,
      });
      if (
        d.kill(this.direction.x, this.direction.z, this._force) &&
        ++hits >= MAX_TARGETS
      )
        break;
    }
  }
  _sync() {
    const c = this.config,
      fade =
        this.phase === 'fade'
          ? 1 - clamp(this.fadeTime / this.fadeDuration)
          : 1;
    this.root.position.copy(this.origin);
    this.root.rotation.y = Math.atan2(this.direction.x, this.direction.z);
    this.maskMat.uniforms.time.value = this.age;
    this.maskMat.uniforms.fade.value = fade;
    this.maskMat.uniforms.color.value.set(c.maskColor);
    this.maskMat.uniforms.edge.value.set(c.edgeColor);
    this.wakeMat.uniforms.time.value = this.age;
    this.wakeMat.uniforms.fade.value = fade;
    this.wakeMat.uniforms.color.value.set(c.trailColor);
    for (let i = 0; i < 3; i++) {
      const lane = i - 1,
        m = this.masks[i],
        w = this.wakes[i];
      m.position.set(
        lane * c.laneGap,
        1.15 + Math.sin(this.age * 3 + i) * 0.14,
        this.front,
      );
      m.rotation.y = Math.sin(this.age * 2 + i) * 0.16;
      w.position.set(lane * c.laneGap, 0.04, this.front * 0.5);
      w.scale.set(c.hitWidth * 2, Math.max(0.01, this.front), 1);
    }
  }
  onDestroy() {
    this.root.visible = false;
    this._hits.clear();
  }
  dispose() {
    if (this._disposed) return;
    this._disposed = true;
    for (const r of this.resources) r.dispose();
    super.dispose();
  }
}
export function buildEditor(gui, c) {
  const f = gui.addFolder('Mirage Procession');
  f.add(c, 'trueLane', { left: -1, center: 0, right: 1 }).name('real lane');
  f.add(c, 'laneGap', 0.8, 4, 0.1).name('lane spacing');
  f.add(c, 'hitWidth', 0.1, 2, 0.05).name('real width');
  f.add(c, 'speed', 3, 40, 0.5).name('speed');
  f.addColor(c, 'maskColor').name('mask');
  f.addColor(c, 'edgeColor').name('edge');
  f.addColor(c, 'trailColor').name('wake');
  f.add(c, 'impactShake', 0, 1, 0.01).name('impact shake');
  f.add(c, 'impactFlash', 0, 1, 0.01).name('impact flash');
  return f;
}
