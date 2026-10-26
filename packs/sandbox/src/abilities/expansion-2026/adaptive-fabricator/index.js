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
  CylinderGeometry,
  DoubleSide,
  Float32BufferAttribute,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PlaneGeometry,
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
const UID = 'matrix-expansion/adaptive-fabricator',
  TAU = Math.PI * 2;
const up = new Vector3(0, 1, 0),
  aim = new Vector3();
const counterColors = Object.freeze({ storm: '#c4b7ff', frost: '#b9f2ff', fire: '#ffb05c' });
const clamp = (x) => Math.max(0, Math.min(1, x));
/** An asymmetrical slotted arm with a projecting emitter and an inner brace. */
function wing() {
  const g = new BufferGeometry();
  const p = [
    [-0.14, 0, 0],
    [0.14, 0, 0],
    [0.2, 0.72, 0.08],
    [0.07, 0.96, 0.04],
    [-0.2, 0.66, 0.08],
  ];
  const v = [];
  for (let i = 1; i < p.length - 1; i++) v.push(...p[0], ...p[i], ...p[i + 1]);
  g.setAttribute('position', new Float32BufferAttribute(v, 3));
  g.computeVertexNormals();
  return g;
}
function floor() {
  return new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: DoubleSide,
    blending: AdditiveBlending,
    uniforms: {
      time: { value: 0 },
      fade: { value: 1 },
      color: { value: new Color('#7ff0ff') },
    },
    vertexShader: `varying vec2 q;void main(){q=uv*2.-1.;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    fragmentShader: `varying vec2 q;uniform float time,fade;uniform vec3 color;void main(){float r=length(q),a=atan(q.y,q.x);float edge=exp(-abs(r-.96)*65.);float spokes=pow(abs(cos(a*6.)),32.)*smoothstep(.25,.7,r);float sweep=pow(max(0.,cos(a-time*1.8)),28.)*(1.-smoothstep(.85,.95,r));float ring=pow(max(0.,cos(r*44.-time*3.)),18.)*.2;float mask=1.-smoothstep(.94,1.,r);gl_FragColor=vec4(color*2.,(edge*.6+spokes*.25+sweep*.3+ring)*mask*fade);}`,
  });
}
function choose(tags) {
  if (tags.includes('wet')) return 'storm';
  if (tags.includes('burning')) return 'frost';
  if (tags.includes('chilled') || tags.includes('frozen')) return 'fire';
  return 'tech';
}
/** A bounded deployable samples nearby state and adapts each attributed UCSM hit. */
export class Ability extends BaseAbility {
  constructor(ctx) {
    super(ID, ctx);
  }
  get handlesOwnHits() {
    return true;
  }
  get impactDuration() {
    return this.config.life;
  }
  get fadeDuration() {
    return 0.7;
  }
  createShaders() {
    this.resources = [];
    const own = (x) => (this.resources.push(x), x);
    this.root = new Group();
    this.group.add(this.root);
    this.floorMat = own(floor());
    this.floor = new Mesh(own(new PlaneGeometry(1, 1)), this.floorMat);
    this.floor.rotation.x = -Math.PI / 2;
    this.floor.position.y = 0.04;
    this.floor.layers.set(LAYER.VFX);
    this.root.add(this.floor);
    this.metal = own(
      new MeshStandardMaterial({
        color: 0x284258,
        metalness: 0.8,
        roughness: 0.27,
        side: DoubleSide,
      }),
    );
    this.core = own(
      new MeshStandardMaterial({
        color: 0x7ff0ff,
        emissive: 0x2182a5,
        emissiveIntensity: 1.4,
        metalness: 0.5,
        roughness: 0.25,
      }),
    );
    this.beamMat = own(
      new MeshBasicMaterial({
        color: 0xd6ffff,
        transparent: true,
        opacity: 0.8,
        depthWrite: false,
        blending: AdditiveBlending,
      }),
    );
    const base = new Mesh(
      own(new CylinderGeometry(0.65, 0.88, 0.22, 6)),
      this.metal,
    );
    base.position.y = 0.12;
    this.root.add(base);
    const pole = new Mesh(
      own(new CylinderGeometry(0.15, 0.21, 1.2, 6)),
      this.metal,
    );
    pole.position.y = 0.8;
    this.root.add(pole);
    this.head = new Group();
    this.head.position.y = 1.52;
    this.root.add(this.head);
    const coreGeo = own(new CylinderGeometry(0.28, 0.34, 0.5, 6));
    const core = new Mesh(coreGeo, this.core);
    this.head.add(core);
    const wings = own(wing());
    const emitterGeo = own(new CylinderGeometry(.028, .06, .24, 6));
    this.arms = [];
    for (let i = 0; i < 6; i++) {
      const mount = new Group();
      mount.rotation.y = (i * TAU) / 6;
      const arm = new Mesh(wings, this.metal);
      arm.position.set(0.35, -0.2, 0);
      arm.rotation.z = -0.35;
      const emitter = new Mesh(emitterGeo, this.core);
      emitter.position.set(0, .75, .08);
      arm.add(emitter);
      mount.add(arm);
      this.head.add(mount);
      this.arms.push(arm);
    }
    const torus = own(new TorusGeometry(0.6, 0.035, 8, 48));
    this.halo = new Mesh(torus, this.beamMat);
    this.halo.rotation.x = Math.PI / 2;
    this.head.add(this.halo);
    this.beam = new Mesh(
      own(new CylinderGeometry(0.025, 0.055, 1, 8)),
      this.beamMat,
    );
    this.beam.visible = false;
    this.root.add(this.beam);
    this.impactMaterial = own(new MeshBasicMaterial({color:0xd6ffff, transparent:true,
      opacity:0, depthWrite:false, blending:AdditiveBlending}));
    this.impactGroup = new Group();
    this.impactGroup.visible = false;
    this.impactRings = [];
    for (let i = 0; i < 2; i++) {
      const ring = new Mesh(torus, this.impactMaterial);
      ring.rotation.x = Math.PI / 2;
      ring.position.y = .04 + i * .04;
      this.impactGroup.add(ring);
      this.impactRings.push(ring);
    }
    this.root.add(this.impactGroup);
    this._point = new Vector3();
    this._lastTarget = null;
    this._lastElement = null;
    this._shots = 0;
    this._beamAge = 999;
    this._timer = 0;
    this._scope = null;
    routeExpansionTransparency(this.group);
    this._disposed = false;
  }
  createParticles() {
    this.fx = createExpansionFX(this.ctx, 'tech', {
      shape: ParticleShape.STREAK,
      colors: ['#ffffff', '#a5efff', '#3ab5ec', '#164673'],
    });
  }
  onSpawn() {
    this._point.copy(this.origin).addScaledVector(this.direction, this.length);
    this._shots = 0;
    this._timer = 0;
    this._beamAge = 999;
    this._lastTarget = null;
    this._lastElement = null;
    this._scope = this.ctx.expansionCombat?.bind(UID, 'caster') ?? null;
    this.root.visible = true;
    this._sync();
  }
  onTravel(dt) {
    this._beamAge += dt;
    this._sync();
  }
  onImpact() {
    this._timer = 0;
    this._sync();
  }
  onFade(dt) {
    this._beamAge += dt;
    if (this.phase === 'impact') {
      this._timer += dt;
      let n = 0;
      while (this._timer >= this.config.shotInterval && n++ < 4) {
        this._timer -= this.config.shotInterval;
        this._fire();
      }
    }
    this._sync();
  }
  _fire() {
    const c = this.config,
      s = this._scope;
    if (!s) return;
    const at = [this._point.x, 0, this._point.z],
      near = s.queryActors({
        position: at,
        radius: c.zoneRadius,
        relation: 'enemy',
      });
    if (!near?.ok) return;
    // Query order is stable by actor ID, not proximity. Keep that order only
    // as the tie-breaker while selecting the nearest unobstructed live actor.
    let target = null, bestDistance = Infinity;
    for (const actor of near.actors) {
      if (!actor.alive) continue;
      const dx = actor.position[0] - at[0], dz = actor.position[2] - at[2];
      const distance = dx * dx + dz * dz;
      if (distance >= bestDistance) continue;
      const check = s.isBlocked(at, actor.position);
      if (!check?.ok || check.blocked) continue;
      target = actor;
      bestDistance = distance;
    }
    if (!target) return;
    const detail = s.getActor(target.id);
    if (!detail?.ok) return;
    const element = choose((detail.actor.statuses ?? []).map((x) => x.tag));
    const sent = s.emit({
      type: 'hit',
      element,
      targetIds: [target.id],
      // Combat hit positions describe contact, so reactions and hit-centered
      // effects resolve at the struck actor rather than at the deployable.
      position: target.position,
      sourcePosition: at,
      damage: c.damage,
      tags: ['adaptive-fabricator'],
    });
    if (!sent?.ok) return;
    this._shots++;
    this._lastTarget = [...target.position];
    this._lastElement = element;
    this._fxPoint ??= new Vector3();
    this._fxPoint.fromArray(target.position);
    expansionBurst(this.fx, this._fxPoint, {
      count: 24,
      size: 0.06,
      life: 0.35,
      speed: 5,
      radius: 0.2,
    });
    this._beamAge = 0;
    this.lightBoost = 1.5;
    expansionImpact(
      this.ctx,
      this.config.coreColor,
      this.config.impactShake,
      this.config.impactFlash,
    );
  }
  _sync() {
    const c = this.config,
      fade =
        this.phase === 'fade'
          ? 1 - clamp(this.fadeTime / this.fadeDuration)
          : 1;
    this.root.position.copy(this._point);
    this.root.scale.setScalar(Math.max(.001, fade));
    this.position.copy(this._point);
    this.metal.color.set(c.metalColor);
    this.core.color.set(c.coreColor);
    this.beamMat.color.set(counterColors[this._lastElement] ?? c.beamColor);
    this.floor.scale.set(c.zoneRadius * 2, c.zoneRadius * 2, 1);
    this.floorMat.uniforms.time.value = this.age;
    this.floorMat.uniforms.fade.value = fade;
    this.floorMat.uniforms.color.value.set(c.coreColor);
    this.halo.rotation.z = this.age * 1.4;
    // The deployable opens its emitter vanes as it scans, then kicks back on
    // each attributed shot before settling into the scanning pose again.
    const recoil = this._beamAge < .18 ? 1 - this._beamAge / .18 : 0;
    this.head.position.y = 1.52 - recoil * .1;
    this.core.emissiveIntensity = 1.1 + recoil * 1.5;
    for (let i = 0; i < this.arms.length; i++) {
      this.arms[i].rotation.z = -.35 - .12 * Math.sin(this.age * 1.8 + i * TAU / 6) - recoil * .2;
    }
    this.head.rotation.y = this.age * 0.6;
    const impactTime = Math.max(.05, c.impactDuration ?? .45);
    this.impactGroup.visible = !!this._lastTarget && this._beamAge < impactTime;
    if (this.impactGroup.visible) {
      const progress = clamp(this._beamAge / impactTime);
      this.impactGroup.position.set(this._lastTarget[0] - this._point.x, 0,
        this._lastTarget[2] - this._point.z);
      this.impactMaterial.color.set(counterColors[this._lastElement] ?? c.beamColor);
      this.impactMaterial.opacity = .7 * (1 - progress) * fade;
      for (let i = 0; i < this.impactRings.length; i++) {
        this.impactRings[i].scale.setScalar((c.impactRadius ?? .8) * (.2 + progress * (i ? 1 : 1.5)));
        this.impactRings[i].rotation.z = this.age * (i ? -2 : 2);
      }
    }
    this.beam.visible = !!this._lastTarget && this._beamAge < 0.18;
    if (this.beam.visible) {
      aim.fromArray(this._lastTarget).sub(this._point).setY(-1.1);
      const length = aim.length();
      if (length > 1e-5) {
        this.beam.position.copy(aim).multiplyScalar(0.5);
        this.beam.position.y += 1.52;
        this.beam.quaternion.setFromUnitVectors(up, aim.normalize());
        this.beam.scale.set(1, length, 1);
        this.head.rotation.y = Math.atan2(aim.x, aim.z);
      }
    }
  }
  onDestroy() {
    this.root.visible = false;
    this.beam.visible = false;
    this.impactGroup.visible = false;
    this._scope = null;
    this._lastTarget = null;
    this._lastElement = null;
  }
  dispose() {
    if (this._disposed) return;
    this._disposed = true;
    this.onDestroy();
    for (const r of this.resources) r.dispose();
    super.dispose();
  }
}
export function buildEditor(gui, c) {
  const f = gui.addFolder('Adaptive Fabricator');
  f.add(c, 'life', 1, 20, 0.5).name('deploy duration');
  f.add(c, 'zoneRadius', 2, 12, 0.1).name('scan radius');
  f.add(c, 'shotInterval', 0.2, 2, 0.05).name('shot interval');
  f.add(c, 'damage', 0, 2, 0.05).name('damage');
  f.add(c, 'impactRadius', .2, 3, .05).name('impact visual size');
  f.add(c, 'impactDuration', .1, 1, .05).name('impact visual time');
  f.addColor(c, 'metalColor').name('housing');
  f.addColor(c, 'coreColor').name('core');
  f.addColor(c, 'beamColor').name('beam');
  f.add(c, 'impactShake', 0, 1, 0.01).name('impact shake');
  f.add(c, 'impactFlash', 0, 1, 0.01).name('impact flash');
  return f;
}
