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
  MeshStandardMaterial,
  Object3D,
  PlaneGeometry,
  RingGeometry,
  ShaderMaterial,
  TorusGeometry,
  Vector3,
} from 'three';
import { Ability as BaseAbility } from '../../Ability.js';
import { settings } from '../../../config/settings.js';
import { LAYER } from '../../../core/Layers.js';
import config from './config.js';

export { config };
export const ID = config.id;
const TAU = Math.PI * 2;
const clamp = (x) => Math.max(0, Math.min(1, x));
const smooth = (x) => {
  const t = clamp(x);
  return t * t * (3 - 2 * t);
};
const scratch = new Object3D();
const delta = new Vector3();
const MAX_SHARDS = 48;
const MAX_TARGETS = 16;

/** Sculpted tapered glass hand. A genuine pointer, not a stock box or recoloured shard. */
function pointerGeometry() {
  const g = new BufferGeometry();
  // Crowned, bevelled shape, extruded symmetrically in depth.
  const outline = [
    [0, 0],
    [-0.11, 0.18],
    [-0.08, 0.75],
    [0, 1],
    [0.08, 0.75],
    [0.11, 0.18],
  ];
  const v = [];
  const face = (a, b, c) => v.push(...a, ...b, ...c);
  for (let i = 1; i < outline.length - 1; i++) {
    face(
      [outline[0][0], outline[0][1], 0.045],
      [outline[i][0], outline[i][1], 0.045],
      [outline[i + 1][0], outline[i + 1][1], 0.045],
    );
    face(
      [outline[0][0], outline[0][1], -0.045],
      [outline[i + 1][0], outline[i + 1][1], -0.045],
      [outline[i][0], outline[i][1], -0.045],
    );
  }
  for (let i = 0; i < outline.length; i++) {
    const a = outline[i],
      b = outline[(i + 1) % outline.length];
    face([a[0], a[1], -0.045], [b[0], b[1], -0.045], [a[0], a[1], 0.045]);
    face([a[0], a[1], 0.045], [b[0], b[1], -0.045], [b[0], b[1], 0.045]);
  }
  g.setAttribute('position', new Float32BufferAttribute(v, 3));
  g.computeVertexNormals();
  return g;
}

/** Angular cut-glass fragments; deterministic and allocated once per pool member. */
function fragmentGeometry() {
  const g = new BufferGeometry();
  const vertices = [
    0, 0.22, 0, -0.06, 0, 0.04, 0.06, 0, 0.04, 0, 0.22, 0, 0.06, 0, 0.04, 0, 0,
    -0.07, 0, 0.22, 0, 0, 0, -0.07, -0.06, 0, 0.04, -0.06, 0, 0.04, 0, 0, -0.07,
    0.06, 0, 0.04,
  ];
  g.setAttribute('position', new Float32BufferAttribute(vertices, 3));
  g.computeVertexNormals();
  return g;
}

function fieldMaterial() {
  return new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: DoubleSide,
    blending: AdditiveBlending,
    uniforms: {
      uTime: { value: 0 },
      uRadius: { value: 3.6 },
      uEnergy: { value: 0 },
      uFade: { value: 1 },
      uGold: { value: new Color('#ffd38a') },
      uViolet: { value: new Color('#6f4e9c') },
    },
    vertexShader: `varying vec2 uvLocal; void main(){uvLocal=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
    fragmentShader: `varying vec2 uvLocal; uniform float uTime,uRadius,uEnergy,uFade; uniform vec3 uGold,uViolet;
    void main(){vec2 p=(uvLocal-.5)*2.; float r=length(p); float a=atan(p.y,p.x);
    float perimeter=exp(-abs(r-.94)*75.); float rings=pow(max(0.,cos(r*55.-uTime*3.)),16.)*(1.-smoothstep(.16,.92,r));
    float rays=pow(abs(sin(a*12.)),38.)*smoothstep(.3,.62,r)*(1.-smoothstep(.75,.98,r));
    float wedge=pow(max(0.,cos(a-uTime*.8)),45.)*(1.-smoothstep(.2,.9,r));
    float inside=(1.-smoothstep(.94,1.,r)); float alpha=inside*(perimeter*.8+rings*.2+rays*.24+wedge*.22)*uEnergy*uFade;
    gl_FragColor=vec4(mix(uViolet,uGold,clamp(perimeter+rings*.6+wedge,0.,1.))*2., alpha);}`,
  });
}

/** Borrowed Tomorrow: lock a target, suspend it for a visible debt, then release one bounded strike. */
export class Ability extends BaseAbility {
  constructor(ctx) {
    super(ID, ctx);
  }
  get handlesOwnHits() {
    return true;
  }
  get impactDuration() {
    return Math.max(this.config.delay + 0.55, 0.7);
  }
  get fadeDuration() {
    return 0.85;
  }
  createShaders() {
    this.resources = [];
    const own = (x) => {
      this.resources.push(x);
      return x;
    };
    this.root = new Group();
    this.group.add(this.root);
    this.fieldMaterial = own(fieldMaterial());
    this.field = new Mesh(own(new PlaneGeometry(1, 1)), this.fieldMaterial);
    this.field.rotation.x = -Math.PI / 2;
    this.field.position.y = 0.035;
    this.field.layers.set(LAYER.VFX);
    this.root.add(this.field);
    this.gold = own(
      new MeshStandardMaterial({
        color: 0x8d6032,
        metalness: 0.86,
        roughness: 0.24,
        emissive: 0x472000,
        emissiveIntensity: 0.8,
      }),
    );
    this.lit = own(
      new MeshBasicMaterial({
        color: 0xffdfa0,
        transparent: true,
        opacity: 0.9,
        blending: AdditiveBlending,
        depthWrite: false,
      }),
    );
    this.glass = own(
      new MeshStandardMaterial({
        color: 0x493a6d,
        emissive: 0x29184f,
        metalness: 0.68,
        roughness: 0.25,
        transparent: true,
        opacity: 0.8,
      }),
    );
    const torus = own(new TorusGeometry(1, 0.025, 8, 120));
    this.rings = [];
    for (let i = 0; i < 3; i++) {
      const ring = new Mesh(torus, i === 1 ? this.lit : this.gold);
      ring.rotation.x = Math.PI / 2;
      ring.position.y = 0.09 + i * 0.03;
      this.root.add(ring);
      this.rings.push(ring);
    }
    const faceGeo = own(new RingGeometry(0.59, 0.65, 96));
    const face = new Mesh(faceGeo, this.gold);
    face.rotation.x = -Math.PI / 2;
    face.position.y = 0.15;
    this.root.add(face);
    // Twelve independently articulated hour indices make the spinning face
    // readable even before the animated hands reach full size.
    this.indices = new InstancedMesh(own(pointerGeometry()), this.gold, 12);
    this.indices.frustumCulled = false;
    this.root.add(this.indices);
    this.releaseMaterial = own(new MeshBasicMaterial({
      color: 0xffedc3, transparent: true, opacity: 0,
      blending: AdditiveBlending, depthWrite: false, side: DoubleSide,
    }));
    this.releaseRing = new Mesh(own(new RingGeometry(0.91, 1, 96)), this.releaseMaterial);
    this.releaseRing.rotation.x = -Math.PI / 2;
    this.releaseRing.position.y = 0.2;
    this.root.add(this.releaseRing);
    const handGeo = own(pointerGeometry());
    this.hands = [];
    for (let i = 0; i < 2; i++) {
      const pivot = new Group();
      pivot.position.y = 0.18 + i * 0.01;
      pivot.rotation.x = -Math.PI / 2;
      const hand = new Mesh(handGeo, i ? this.lit : this.gold);
      hand.scale.setScalar(i ? 0.42 : 0.62);
      pivot.add(hand);
      this.root.add(pivot);
      this.hands.push(pivot);
    }
    const frag = own(fragmentGeometry());
    this.shards = new InstancedMesh(frag, this.glass, MAX_SHARDS);
    this.shards.frustumCulled = false;
    this.root.add(this.shards);
    this._force = { impulse: 0, lift: 0, spin: 0 };
    this._found = [];
    routeExpansionTransparency(this.group);
    this._disposed = false;
  }
  createParticles() {
    this.fx = createExpansionFX(this.ctx, 'time', {
      shape: ParticleShape.CHIP,
      colors: ['#fff2cf', '#edbd73', '#a073bd', '#302451'],
    });
  }
  onSpawn() {
    this._released = false;
    this._releaseCount = 0;
    this.root.visible = true;
    this.root.scale.setScalar(0.01);
    this.fieldMaterial.uniforms.uEnergy.value = 0;
    this._sync();
  }
  onTravel() {
    this._sync();
  }
  onImpact() {
    this.position.y = 0;
    this._sync();
  }
  onFade() {
    const c = this.config;
    if (!this._released && this.impactTime >= c.delay) {
      this._released = true;
      this._releaseCount++;
      this._strike();
      this.lightBoost = 5;
      expansionImpact(
        this.ctx,
        this.config.coreColor,
        this.config.impactShake,
        this.config.impactFlash,
      );
    }
    this._sync();
  }
  _strike() {
    expansionBurst(this.fx, this.position, {
      count: 64,
      size: 0.12,
      life: 0.9,
      speed: 3.5,
      radius: this.config.zoneRadius * 0.5,
    });
    const c = this.config;
    const field = this.ctx.dummies;
    if (!field?.findTargets) return;
    const found = field.findTargets(
      this.position.x,
      this.position.z,
      c.zoneRadius,
      this._found,
    );
    const power = settings.global.explosionIntensity;
    this._force.impulse = c.hitImpulse * power;
    this._force.lift = c.hitLift * power;
    this._force.spin = c.hitSpin;
    let struck = 0;
    for (const dummy of found) {
      delta.set(
        dummy.position.x - this.position.x,
        0,
        dummy.position.z - this.position.z,
      );
      if (delta.lengthSq() > c.zoneRadius * c.zoneRadius) continue;
      if (delta.lengthSq() < 1e-8) delta.copy(this.direction);
      else delta.normalize();
      if (dummy.kill(delta.x, delta.z, this._force) && ++struck >= MAX_TARGETS)
        break;
    }
  }
  _sync() {
    const c = this.config,
      r = c.zoneRadius,
      anticipation = clamp(this.impactTime / Math.max(0.01, c.delay));
    const arrival = smooth(this.u * 4),
      fade =
        this.phase === 'fade'
          ? 1 - clamp(this.fadeTime / this.fadeDuration)
          : 1;
    this.root.position.copy(this.position);
    this.root.scale.setScalar(arrival);
    this.field.scale.set(r * 2, r * 2, 1);
    const u = this.fieldMaterial.uniforms;
    u.uTime.value = this.age * c.pulseSpeed;
    u.uRadius.value = r;
    u.uEnergy.value = 0.45 + 0.55 * anticipation;
    u.uFade.value = fade;
    u.uGold.value.set(c.coreColor);
    u.uViolet.value.set(c.shadowColor);
    this.gold.color.set(c.ringColor);
    this.rings[0].scale.setScalar(r * 0.9);
    this.rings[1].scale.setScalar(r * 0.74);
    this.rings[2].scale.setScalar(r * 0.56);
    this.rings[0].rotation.z = this.age * c.rotationSpeed;
    this.rings[1].rotation.z = -this.age * c.rotationSpeed * 1.4;
    this.hands[0].rotation.z = -(
      this.age * c.rotationSpeed +
      anticipation * TAU
    );
    this.hands[1].rotation.z = this.age * c.rotationSpeed * 0.6;
    for (let i = 0; i < 12; i++) {
      const angle = i * TAU / 12;
      scratch.position.set(Math.sin(angle) * r * .81, .17, Math.cos(angle) * r * .81);
      scratch.rotation.set(-Math.PI / 2, 0, -angle);
      scratch.scale.set(r * .16, r * (i % 3 === 0 ? .24 : .14), 1);
      scratch.updateMatrix();
      this.indices.setMatrixAt(i, scratch.matrix);
    }
    this.indices.instanceMatrix.needsUpdate = true;
    const release = this._released ? clamp((this.impactTime - c.delay) / .55) : 0;
    this.releaseRing.scale.setScalar(r * (.18 + .82 * smooth(release)));
    this.releaseMaterial.opacity = this._released ? (1 - release) * .8 * fade : 0;
    this.releaseMaterial.color.set(c.coreColor);
    const shatter = this._released
      ? clamp((this.impactTime - c.delay + (this.phase === 'fade' ? this.fadeTime : 0)) / .8)
      : 0;
    for (let i = 0; i < MAX_SHARDS; i++) {
      const a = i * 2.399963 + this.age * 0.23,
        band = 0.36 + (i % 5) * 0.11;
      const orbit = r * (band + shatter * (.25 + (i % 4) * .08));
      const lift = 0.22 + (i % 7) * 0.13 + Math.sin(this.age * 2 + i) * 0.08
        + shatter * (1.1 + (i % 5) * .18);
      scratch.position.set(Math.cos(a) * orbit, lift, Math.sin(a) * orbit);
      scratch.rotation.set(a * 0.5 + shatter * 2, a + shatter, this.age * 0.8 + i);
      const size = (0.65 + (i % 3) * 0.22) * fade * (1 - shatter * .75);
      scratch.scale.setScalar(size);
      scratch.updateMatrix();
      this.shards.setMatrixAt(i, scratch.matrix);
    }
    this.shards.instanceMatrix.needsUpdate = true;
  }
  onDestroy() {
    this.root.visible = false;
    this._released = false;
  }
  dispose() {
    if (this._disposed) return;
    this._disposed = true;
    for (const r of this.resources) r.dispose();
    super.dispose();
  }
}

export function buildEditor(gui, c) {
  const f = gui.addFolder('Borrowed Tomorrow');
  f.add(c, 'delay', 0.25, 3, 0.05).name('defer (s)');
  f.add(c, 'zoneRadius', 1, 8, 0.1).name('strike radius');
  f.add(c, 'rotationSpeed', 0, 4, 0.05).name('clock speed');
  f.add(c, 'pulseSpeed', 0, 8, 0.1).name('clock pulse');
  f.add(c, 'hitImpulse', 0, 30, 0.5).name('impact impulse');
  f.addColor(c, 'coreColor').name('clock light');
  f.addColor(c, 'ringColor').name('brass');
  f.addColor(c, 'shadowColor').name('future shadow');
  f.add(c, 'impactShake', 0, 1, 0.01).name('impact shake');
  f.add(c, 'impactFlash', 0, 1, 0.01).name('impact flash');
  return f;
}
