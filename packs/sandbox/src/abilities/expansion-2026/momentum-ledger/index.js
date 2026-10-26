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
  CatmullRomCurve3,
  Color,
  DoubleSide,
  DynamicDrawUsage,
  Float32BufferAttribute,
  Group,
  InstancedMesh,
  Line,
  LineBasicMaterial,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  Object3D,
  PlaneGeometry,
  ShaderMaterial,
  TorusGeometry,
  TubeGeometry,
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
const delta = new Vector3(),
  scratch = new Object3D();
const MAX_VECTORS = 32,
  MAX_TARGETS = 16;
/** A tapered helical spring which compresses with the actually banked distance. */
function coilGeometry() {
  const points = [];
  for (let i = 0; i <= 96; i++) {
    const t = i / 96, angle = t * TAU * 4;
    const radius = .11 * (.5 + .5 * Math.sin(Math.PI * t));
    points.push(new Vector3(Math.cos(angle) * radius, Math.sin(angle) * radius, t * 1.5));
  }
  return new TubeGeometry(new CatmullRomCurve3(points), 128, .025, 6, false);
}
/** A cut arrowhead with a raised spine; an oriented velocity glyph, not a flat decal. */
function vectorGeometry() {
  const g = new BufferGeometry(),
    v = [];
  const face = (a, b, c) => v.push(...a, ...b, ...c);
  const p = [
    [0, 0, 0.46],
    [-0.17, 0, 0.03],
    [-0.065, 0, 0.08],
    [-0.065, 0, -0.4],
    [0.065, 0, -0.4],
    [0.065, 0, 0.08],
    [0.17, 0, 0.03],
  ];
  for (let i = 0; i < p.length; i++) {
    const a = p[i],
      b = p[(i + 1) % p.length];
    face([0, 0.08, 0], a, b);
    face([0, -0.025, 0], b, a);
  }
  g.setAttribute('position', new Float32BufferAttribute(v, 3));
  g.computeVertexNormals();
  return g;
}
function field() {
  return new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: DoubleSide,
    blending: AdditiveBlending,
    uniforms: {
      time: { value: 0 },
      charge: { value: 0 },
      fade: { value: 1 },
      a: { value: new Color('#ff9a50') },
      b: { value: new Color('#a8383d') },
    },
    vertexShader: `varying vec2 q;void main(){q=uv*2.-1.;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    fragmentShader: `varying vec2 q;uniform float time,charge,fade;uniform vec3 a,b;void main(){float r=length(q);float phi=atan(q.y,q.x);float edge=exp(-abs(r-.94)*65.);float travel=pow(max(0.,sin(phi*10.-time*6.-r*12.)),14.);float wave=exp(-abs(r-mod(time*.65,1.))*45.)*charge;float mask=1.-smoothstep(.92,1.,r);float alpha=(edge*.7+travel*.23+wave*.6)*mask*fade;gl_FragColor=vec4(mix(b,a,clamp(edge+wave+charge*.5,0.,1.))*2.,alpha);}`,
  });
}
/** Ledger stores movement, not the aim distance: teleports are rejected as velocity spikes. */
export class Ability extends BaseAbility {
  constructor(ctx) {
    super(ID, ctx);
  }
  get handlesOwnHits() {
    return true;
  }
  get impactDuration() {
    return this.config.chargeDuration + 0.5;
  }
  get fadeDuration() {
    return 0.75;
  }
  createShaders() {
    this.resources = [];
    const own = (x) => (this.resources.push(x), x);
    this.root = new Group();
    this.group.add(this.root);
    this.fieldMat = own(field());
    this.field = new Mesh(own(new PlaneGeometry(1, 1)), this.fieldMat);
    this.field.rotation.x = -Math.PI / 2;
    this.field.position.y = 0.035;
    this.field.layers.set(LAYER.VFX);
    this.root.add(this.field);
    this.metal = own(
      new MeshStandardMaterial({
        color: 0x8c4945,
        metalness: 0.78,
        roughness: 0.24,
        emissive: 0x4b1b0d,
      }),
    );
    this.glow = own(
      new MeshBasicMaterial({
        color: 0xffbb75,
        transparent: true,
        opacity: 0.9,
        depthWrite: false,
        blending: AdditiveBlending,
      }),
    );
    const ring = own(new TorusGeometry(1, 0.028, 8, 96));
    this.rings = [];
    for (let i = 0; i < 3; i++) {
      const o = new Mesh(ring, i === 1 ? this.glow : this.metal);
      o.rotation.x = Math.PI / 2;
      o.position.y = 0.1 + i * 0.025;
      this.root.add(o);
      this.rings.push(o);
    }
    this.coilMat = own(new MeshStandardMaterial({color:0xd98966, emissive:0x5b2418,
      emissiveIntensity:.7, metalness:.75, roughness:.3}));
    const coil = own(coilGeometry());
    this.coils = [];
    for (let i = 0; i < 4; i++) {
      const mesh = new Mesh(coil, this.coilMat);
      mesh.position.y = .4;
      this.root.add(mesh);
      this.coils.push(mesh);
    }
    this.releaseGlow = own(new MeshBasicMaterial({color:0xfff1d3, transparent:true,
      opacity:0, depthWrite:false, blending:AdditiveBlending}));
    this.releaseRings = [];
    for (let i = 0; i < 2; i++) {
      const o = new Mesh(ring, this.releaseGlow);
      o.rotation.x = Math.PI / 2;
      o.position.y = .19 + i * .025;
      o.visible = false;
      this.root.add(o);
      this.releaseRings.push(o);
    }
    const wakeGeometry = own(new BufferGeometry());
    const wakePositions = new Float32BufferAttribute(
      new Float32Array(64 * 3),
      3,
    );
    wakePositions.setUsage(DynamicDrawUsage);
    wakeGeometry.setAttribute('position', wakePositions);
    wakeGeometry.setDrawRange(0, 0);
    this.wake = new Line(
      wakeGeometry,
      own(
        new LineBasicMaterial({
          color: 0xffb088,
          transparent: true,
          opacity: 0.8,
          depthWrite: false,
          blending: AdditiveBlending,
        }),
      ),
    );
    this.root.add(this.wake);
    this._wakePoints = Array.from({ length: 64 }, () => new Vector3());
    this._wakeHead = 0;
    this._wakeCount = 0;
    const arrow = own(vectorGeometry());
    this.vectors = new InstancedMesh(arrow, this.glow, MAX_VECTORS);
    this.vectors.frustumCulled = false;
    this.root.add(this.vectors);
    // A separate graduated dial shows the real measured distance banked;
    // it is filled from q rather than from elapsed time.
    this.gauge = new InstancedMesh(arrow, this.glow, 24);
    this.gauge.frustumCulled = false;
    this.gauge.count = 0;
    this.root.add(this.gauge);
    this._prev = new Vector3();
    this._last = new Vector3();
    this._target = new Vector3();
    this._force = { impulse: 0, lift: 0, spin: 0 };
    this._found = [];
    routeExpansionTransparency(this.group);
    this._disposed = false;
  }
  createParticles() {
    this.fx = createExpansionFX(this.ctx, 'motion', {
      shape: ParticleShape.STREAK,
      colors: ['#fff4df', '#ffb088', '#d65d52', '#4e203b'],
    });
  }
  onSpawn() {
    const p = this.ctx.character?.position ?? this.origin;
    this._prev.copy(p);
    this._last.copy(p);
    this._target.copy(this.origin).addScaledVector(this.direction, this.length);
    this._distance = 0;
    this._trailElapsed = 0;
    this._released = false;
    this._wakeHead = 0;
    this._wakeCount = 0;
    this._recordWake(p);
    this.root.visible = true;
    this._sync();
  }
  onTravel(dt) {
    this._capture(dt);
    this._sync();
  }
  onImpact() {
    this._sync();
  }
  onFade(dt) {
    this._capture(dt);
    if (!this._released && this.impactTime >= this.config.chargeDuration) {
      this._released = true;
      this._strike();
      this.lightBoost = 4;
      expansionImpact(
        this.ctx,
        this.config.accentColor,
        this.config.impactShake,
        this.config.impactFlash,
      );
    }
    this._sync();
  }
  _capture(dt) {
    if (this._released || dt <= 0) return;
    const p = this.ctx.character?.position ?? this._last;
    delta.copy(p).sub(this._prev).setY(0);
    const n = delta.length();
    if (n <= this.config.maxSpeed * dt + 0.02) {
      this._distance = Math.min(this.config.maxDistance, this._distance + n);
      this._trailElapsed += dt;
      if (n > .001 && this._trailElapsed >= .14) {
        this._trailElapsed %= .14;
        expansionBurst(this.fx, p, {
          count: 3, size: .055, life: .45, speed: 1.2, spread: .3,
          radius: .12, direction: delta.normalize(),
        });
      }
      const last =
        this._wakePoints[
          (this._wakeHead + this._wakeCount - 1) % this._wakePoints.length
        ];
      if (n > 0 && (!last || last.distanceToSquared(p) >= 0.05 * 0.05))
        this._recordWake(p);
    } else {
      this._wakeHead = 0;
      this._wakeCount = 0;
      this._recordWake(p);
    }
    this._prev.copy(p);
    this._last.copy(p);
  }
  _recordWake(p) {
    const cap = this._wakePoints.length;
    let index = (this._wakeHead + this._wakeCount) % cap;
    if (this._wakeCount === cap) {
      index = this._wakeHead;
      this._wakeHead = (this._wakeHead + 1) % cap;
    } else this._wakeCount++;
    this._wakePoints[index].copy(p);
  }
  _strike() {
    expansionBurst(this.fx, this._target, {
      count: 56,
      size: 0.08,
      life: 0.65,
      speed: 6,
      radius: this.config.zoneRadius * 0.35,
    });
    const c = this.config,
      field = this.ctx.dummies;
    if (!field?.findTargets) return;
    const q = clamp(this._distance / Math.max(0.01, c.maxDistance)),
      power = settings.global.explosionIntensity;
    this._force.impulse = (c.baseImpulse + c.bonusImpulse * q) * power;
    this._force.lift = c.lift * (0.6 + 0.4 * q) * power;
    this._force.spin = c.spin;
    const found = field.findTargets(
      this._target.x,
      this._target.z,
      c.zoneRadius,
      this._found,
    );
    let hits = 0;
    for (const d of found) {
      delta.set(
        d.position.x - this._target.x,
        0,
        d.position.z - this._target.z,
      );
      if (delta.lengthSq() > c.zoneRadius * c.zoneRadius) continue;
      if (delta.lengthSq() < 1e-9) delta.copy(this.direction);
      else delta.normalize();
      if (d.kill(delta.x, delta.z, this._force) && ++hits >= MAX_TARGETS) break;
    }
  }
  _sync() {
    const c = this.config,
      r = c.zoneRadius,
      q = clamp(this._distance / Math.max(0.01, c.maxDistance));
    const fade =
      this.phase === 'fade' ? 1 - clamp(this.fadeTime / this.fadeDuration) : 1;
    this.root.position.copy(this._target);
    this.position.copy(this._target);
    const attr = this.wake.geometry.attributes.position;
    for (let i = 0; i < this._wakeCount; i++) {
      const p =
        this._wakePoints[(this._wakeHead + i) % this._wakePoints.length];
      attr.setXYZ(i, p.x - this._target.x, p.y + 0.06, p.z - this._target.z);
    }
    attr.needsUpdate = true;
    this.wake.geometry.setDrawRange(0, this._wakeCount);
    this.wake.material.opacity = 0.8 * fade;
    this.wake.material.color.set(c.trailColor);
    this.glow.color.set(c.coreColor);
    this.field.scale.set(r * 2, r * 2, 1);
    const u = this.fieldMat.uniforms;
    u.time.value = this.age;
    u.charge.value = q;
    u.fade.value = fade;
    u.a.value.set(c.accentColor);
    u.b.value.set(c.trailColor);
    for (let i = 0; i < 3; i++) {
      this.rings[i].scale.setScalar(r * (0.55 + i * 0.17));
      this.rings[i].rotation.z = this.age * (i % 2 ? -0.9 : 0.65);
    }
    const releaseAge = this.impactTime - c.chargeDuration + (this.phase === 'fade' ? this.fadeTime : 0);
    const waveProgress = clamp(releaseAge / Math.max(.05, c.releaseWaveLife ?? .6));
    const coilScale = Math.max(.001, (c.springSize ?? 1) * fade * (this._released ? 1 - .8 * waveProgress : 1));
    const compressed = 1 - .5 * q;
    const axialScale = this._released ? compressed + (1 - compressed) * waveProgress : compressed;
    this.coilMat.color.set(c.springColor ?? '#d98966');
    this.coilMat.emissiveIntensity = .5 + q * .8;
    for (let i = 0; i < this.coils.length; i++) {
      this.coils[i].rotation.y = i * TAU / 4 + Math.atan2(this.direction.x, this.direction.z);
      this.coils[i].scale.set(coilScale, coilScale, coilScale * axialScale);
    }
    this.releaseGlow.color.set(c.coreColor);
    this.releaseGlow.opacity = (.35 + q * .45) * (1 - waveProgress) * fade;
    for (let i = 0; i < this.releaseRings.length; i++) {
      const wave = this.releaseRings[i];
      wave.visible = this._released && waveProgress < 1;
      wave.scale.setScalar(r * (i ? .12 + waveProgress * .88 : 1));
      wave.rotation.z = this.age * (i ? 2 : -2);
    }
    for (let i = 0; i < MAX_VECTORS; i++) {
      let a = (i * TAU) / MAX_VECTORS + this.age * (0.4 + q),
        radius = r * (0.42 + (i % 3) * 0.16);
      scratch.position.set(
        Math.sin(a) * radius,
        0.14 + (i % 4) * 0.1,
        Math.cos(a) * radius,
      );
      scratch.rotation.set(0, a + Math.PI / 2, 0);
      scratch.scale.setScalar((0.5 + q * 0.5) * fade);
      scratch.updateMatrix();
      this.vectors.setMatrixAt(i, scratch.matrix);
    }
    this.vectors.instanceMatrix.needsUpdate = true;
    this.gauge.count = Math.min(24, Math.floor(q * 24));
    for (let i = 0; i < this.gauge.count; i++) {
      const a = i * TAU / 24;
      scratch.position.set(Math.sin(a) * r * .92, .12, Math.cos(a) * r * .92);
      scratch.rotation.set(0, a, 0);
      scratch.scale.setScalar(.16 * fade);
      scratch.updateMatrix();
      this.gauge.setMatrixAt(i, scratch.matrix);
    }
    this.gauge.instanceMatrix.needsUpdate = true;
  }
  onDestroy() {
    this.root.visible = false;
    this._distance = 0;
    this._released = false;
    this._wakeCount = 0;
    this.gauge.count = 0;
    this.wake.geometry.setDrawRange(0, 0);
  }
  dispose() {
    if (this._disposed) return;
    this._disposed = true;
    for (const r of this.resources) r.dispose();
    super.dispose();
  }
}
export function buildEditor(gui, c) {
  const f = gui.addFolder('Momentum Ledger');
  f.add(c, 'chargeDuration', 0.4, 5, 0.05).name('bank time');
  f.add(c, 'maxDistance', 1, 30, 0.1).name('distance cap');
  f.add(c, 'maxSpeed', 1, 30, 0.5).name('maximum valid speed');
  f.add(c, 'zoneRadius', 1, 8, 0.1).name('release radius');
  f.add(c, 'bonusImpulse', 0, 30, 0.5).name('stored impulse');
  f.add(c, 'baseImpulse', 0, 30, 0.5).name('base impulse');
  f.add(c, 'releaseWaveLife', .1, 1.2, .05).name('release visual time');
  f.addColor(c, 'accentColor').name('velocity');
  f.addColor(c, 'coreColor').name('core');
  f.addColor(c, 'trailColor').name('trail');
  f.addColor(c, 'springColor').name('charge coils');
  f.add(c, 'springSize', .3, 2, .05).name('coil size');
  f.add(c, 'impactShake', 0, 1, 0.01).name('impact shake');
  f.add(c, 'impactFlash', 0, 1, 0.01).name('impact flash');
  return f;
}
