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
  InstancedMesh,
  LineBasicMaterial,
  LineSegments,
  Mesh,
  MeshBasicMaterial,
  Object3D,
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
const shardTransform = new Object3D();
const SHARDS_PER_LANE = 8;
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
/** Delicate crown, cheek and mouth engraving shared by all three masks. */
function filigreeGeometry() {
  const paths = [
    [[-.4,.53],[-.25,.61],[0,.66],[.25,.61],[.4,.53]],
    [[-.4,.3],[-.34,.04],[-.22,-.25],[0,-.48],[.22,-.25],[.34,.04],[.4,.3]],
    [[-.2,-.24],[0,-.31],[.2,-.24]],
    [[-.25,.39],[0,.49],[.25,.39]],
  ];
  const positions = [];
  for (const path of paths) for (let i=1;i<path.length;i++)
    positions.push(path[i-1][0],path[i-1][1],.115,path[i][0],path[i][1],.115);
  const g = new BufferGeometry();
  g.setAttribute('position', new Float32BufferAttribute(positions, 3));
  return g;
}
/** Tapered glass facets that orbit each mask and peel outward at arrival. */
function shardGeometry() {
  const g = new BufferGeometry();
  g.setAttribute('position', new Float32BufferAttribute([
    0, .9, 0, -.34, 0, .16, 0, -.8, 0,
    0, .9, 0, 0, -.8, 0, .34, 0, .16,
    0, .9, 0, .34, 0, .16, -.34, 0, .16,
    0, -.8, 0, -.34, 0, .16, .34, 0, .16,
  ], 3));
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
    this.engravingMat = own(new LineBasicMaterial({
      color: 0xfff3ff, transparent: true, opacity: .75,
      depthWrite: false, blending: AdditiveBlending,
    }));
    const engraving = own(filigreeGeometry());
    const mask = own(maskGeometry()),
      plane = own(new PlaneGeometry(1, 1));
    this.masks = [];
    this.wakes = [];
    for (let i = 0; i < 3; i++) {
      const m = new Mesh(mask, this.maskMat);
      m.add(new LineSegments(engraving, this.engravingMat));
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
    this.shardMat = own(new MeshBasicMaterial({color:0xfff3ff, transparent:true,
      opacity:.7, depthWrite:false, side:DoubleSide, blending:AdditiveBlending}));
    this.shards = new InstancedMesh(own(shardGeometry()), this.shardMat, 3 * SHARDS_PER_LANE);
    this.shards.frustumCulled = false;
    this.root.add(this.shards);
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
    // Every mask dissolves with the same terminal flourish; impact feedback
    // cannot reveal the damaging lane.
    for (let lane = -1; lane <= 1; lane++) {
      this.pointAt(1, point);
      point.addScaledVector(this.side, lane * this.config.laneGap);
      point.y = 1.1;
      expansionBurst(this.fx, point, {
        count: 12, size: .16, life: .65, speed: 1.4, spread: .8, radius: .35,
      });
    }
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
    this.engravingMat.color.set(c.edgeColor);
    this.engravingMat.opacity = (.6 + .15 * Math.sin(this.age * 3)) * fade;
    this.wakeMat.uniforms.time.value = this.age;
    this.wakeMat.uniforms.fade.value = fade;
    this.wakeMat.uniforms.color.value.set(c.trailColor);
    this.shardMat.color.set(c.edgeColor);
    this.shardMat.opacity = .7 * fade;
    const departure = this.phase === 'travel' ? 0 : clamp(this.impactTime / this.impactDuration);
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
      m.scale.setScalar(1 - departure * .75);
      w.position.set(lane * c.laneGap, 0.04, this.front * 0.5);
      w.scale.set(c.hitWidth * 2, Math.max(0.01, this.front), 1);
      for (let j = 0; j < SHARDS_PER_LANE; j++) {
        const angle = j * Math.PI * 2 / SHARDS_PER_LANE + this.age * 1.8;
        const orbit = .55 + departure * (c.shardSpread ?? 1.2);
        shardTransform.position.set(lane * c.laneGap + Math.cos(angle) * orbit,
          m.position.y + Math.sin(angle) * orbit * .8,
          this.front + Math.sin(angle * 2) * .18 + departure * (j % 2 ? .45 : -.45));
        shardTransform.rotation.set(angle * .4, angle, this.age * 2 + j);
        shardTransform.scale.setScalar((c.shardSize ?? .12) * (1 - departure * .6) * fade);
        shardTransform.updateMatrix();
        this.shards.setMatrixAt(i * SHARDS_PER_LANE + j, shardTransform.matrix);
      }
    }
    this.shards.instanceMatrix.needsUpdate = true;
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
  f.add(c, 'shardSize', .03, .35, .01).name('mirror size');
  f.add(c, 'shardSpread', .2, 3, .1).name('departure spread');
  f.addColor(c, 'maskColor').name('mask');
  f.addColor(c, 'edgeColor').name('edge');
  f.addColor(c, 'trailColor').name('wake');
  f.add(c, 'impactShake', 0, 1, 0.01).name('impact shake');
  f.add(c, 'impactFlash', 0, 1, 0.01).name('impact flash');
  return f;
}
