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
  CircleGeometry,
  Color,
  DoubleSide,
  Float32BufferAttribute,
  Group,
  IcosahedronGeometry,
  InstancedMesh,
  LineBasicMaterial,
  LineSegments,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  Object3D,
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
const TAU = Math.PI * 2,
  clamp = (x) => Math.max(0, Math.min(1, x));
const offset = new Vector3();
const bladeTransform = new Object3D();
const MAX_TARGETS = 16;
/** Custom intersecting polygon runes, with linework authored in polar coordinates. */
function runeGeometry() {
  const v = [];
  function line(a, b) {
    v.push(...a, ...b);
  }
  for (let j = 0; j < 3; j++) {
    const n = 5 + j * 2,
      step = 2 + (j % 2);
    for (let i = 0; i < n; i++) {
      const a = (i * TAU) / n,
        b = ((i + step) * TAU) / n,
        r = 0.35 + j * 0.23;
      line(
        [Math.cos(a) * r, 0.02, Math.sin(a) * r],
        [Math.cos(b) * r, 0.02, Math.sin(b) * r],
      );
    }
  }
  for (let i = 0; i < 24; i++) {
    const a = (i * TAU) / 24;
    line(
      [Math.cos(a) * 0.9, 0.02, Math.sin(a) * 0.9],
      [
        Math.cos(a) * (i % 3 === 0 ? 1 : 0.96),
        0.02,
        Math.sin(a) * (i % 3 === 0 ? 1 : 0.96),
      ],
    );
  }
  const g = new BufferGeometry();
  g.setAttribute('position', new Float32BufferAttribute(v, 3));
  return g;
}
function ink() {
  return new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: DoubleSide,
    blending: AdditiveBlending,
    uniforms: {
      time: { value: 0 },
      phase: { value: 0 },
      fade: { value: 1 },
      ink: { value: new Color('#646cff') },
      edge: { value: new Color('#eef0ff') },
    },
    vertexShader: `varying vec2 q;void main(){q=uv*2.-1.;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    fragmentShader: `varying vec2 q;uniform float time,phase,fade;uniform vec3 ink,edge;void main(){float r=length(q),a=atan(q.y,q.x);float boundary=exp(-abs(r-.94)*85.);float marks=pow(abs(cos(a*12.)),32.)*smoothstep(.58,.88,r);float circles=pow(max(0.,cos(r*40.-time*1.5)),16.);float scan=exp(-abs(a-mod(time*.8,6.283)+3.14159)*12.);float mask=1.-smoothstep(.94,1.,r);float x=(boundary*.8+marks*.3+circles*.16+scan*.12)*mask*(.55+.45*phase)*fade;gl_FragColor=vec4(mix(ink,edge,clamp(boundary+circles*.5,0.,1.))*2.,x);}`,
  });
}
/** Draw the same disc-clipped stripe or annular band used by the hit test. */
function footprint(kind) {
  return new ShaderMaterial({
    transparent: true, depthWrite: false, side: DoubleSide, blending: AdditiveBlending,
    uniforms: { color: { value: new Color('#b6a4ff') }, fade: { value: 1 }, width: { value: .2 } },
    vertexShader: `varying vec2 p;void main(){p=uv*2.-1.;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    fragmentShader: kind === 'line'
      ? `varying vec2 p;uniform vec3 color;uniform float fade,width;void main(){float disc=1.-smoothstep(.985,1.,length(p));float stripe=1.-smoothstep(width-.01,width+.01,abs(p.x));gl_FragColor=vec4(color*1.6,disc*stripe*fade*.35);}`
      : `varying vec2 p;uniform vec3 color;uniform float fade,width;void main(){float r=length(p);float band=smoothstep(1.-width-.01,1.-width+.01,r)*(1.-smoothstep(.985,1.,r));gl_FragColor=vec4(color*1.6,band*fade*.35);}`,
  });
}
/** Raised bevel-like runic blades orbit the armillary core. */
function bladeGeometry() {
  const g = new BufferGeometry();
  g.setAttribute('position', new Float32BufferAttribute([
    0,.3,0, -.09,-.18,.05, 0,-.3,0,
    0,.3,0, 0,-.3,0, .09,-.18,.05,
    0,.3,0, .09,-.18,.05, -.09,-.18,.05,
    0,-.3,0, -.09,-.18,.05, .09,-.18,.05,
  ], 3));
  g.computeVertexNormals();
  return g;
}
/** Two independently selected attack shapes share a target but execute as separate beats. */
export class Ability extends BaseAbility {
  constructor(ctx) {
    super(ID, ctx);
  }
  get handlesOwnHits() {
    return true;
  }
  get impactDuration() {
    return Math.max(1.5, this.config.beatInterval * 2 + 0.5);
  }
  get fadeDuration() {
    return 0.7;
  }
  createShaders() {
    this.resources = [];
    const own = (x) => (this.resources.push(x), x);
    this.root = new Group();
    this.group.add(this.root);
    this.ink = own(ink());
    this.field = new Mesh(own(new PlaneGeometry(1, 1)), this.ink);
    this.field.rotation.x = -Math.PI / 2;
    this.field.position.y = 0.035;
    this.field.layers.set(LAYER.VFX);
    this.root.add(this.field);
    this.runeMat = own(
      new LineBasicMaterial({
        color: 0xd8d9ff,
        transparent: true,
        opacity: 0.85,
        depthWrite: false,
        blending: AdditiveBlending,
      }),
    );
    this.runes = new LineSegments(own(runeGeometry()), this.runeMat);
    this.root.add(this.runes);
    this.glow = own(
      new MeshBasicMaterial({
        color: 0xb6a4ff,
        transparent: true,
        opacity: 0.8,
        depthWrite: false,
        blending: AdditiveBlending,
      }),
    );
    const torus = own(new TorusGeometry(1, 0.04, 8, 96));
    this.rings = [];
    for (let i = 0; i < 2; i++) {
      const r = new Mesh(torus, this.glow);
      r.rotation.x = Math.PI / 2;
      r.position.y = 0.08 + i * 0.03;
      this.root.add(r);
      this.rings.push(r);
    }
    this.lineFootprint = own(footprint('line'));
    this.ringFootprint = own(footprint('ring'));
    this.shapeLine = new Mesh(own(new PlaneGeometry(1, 1)), this.lineFootprint);
    this.shapeLine.rotation.x = -Math.PI / 2;
    this.shapeLine.position.y = 0.06;
    this.root.add(this.shapeLine);
    this.shapeBurst = new Mesh(
      own(new CircleGeometry(1, 64)),
      own(
        new MeshBasicMaterial({
          color: 0x786cff,
          transparent: true,
          opacity: 0.15,
          depthWrite: false,
          side: DoubleSide,
        }),
      ),
    );
    this.shapeBurst.rotation.x = -Math.PI / 2;
    this.shapeBurst.position.y = 0.045;
    this.root.add(this.shapeBurst);
    this.shapeRing = new Mesh(own(new PlaneGeometry(1, 1)), this.ringFootprint);
    this.shapeRing.rotation.x = -Math.PI / 2;
    this.shapeRing.position.y = 0.12;
    this.root.add(this.shapeRing);
    this.coreMat = own(new MeshStandardMaterial({color:0xc2bbff, emissive:0x5743ab,
      emissiveIntensity:1.1, metalness:.65, roughness:.28}));
    this.hero = new Group();
    this.hero.position.y = 1.15;
    this.core = new Mesh(own(new IcosahedronGeometry(.26, 1)), this.coreMat);
    this.hero.add(this.core);
    this.heroRings = [];
    const heroRing = own(new TorusGeometry(.52, .018, 6, 64));
    for (let i = 0; i < 3; i++) {
      const ring = new Mesh(heroRing, this.glow);
      this.hero.add(ring);
      this.heroRings.push(ring);
    }
    this.blades = new InstancedMesh(own(bladeGeometry()), this.coreMat, 8);
    this.blades.frustumCulled = false;
    this.hero.add(this.blades);
    this.root.add(this.hero);
    // Each beat owns its own fading footprint so overlapping releases remain
    // legible even when the editor changes the next shape during a cast.
    this.releases = [];
    for (let i = 0; i < 2; i++) {
      const material = own(new MeshBasicMaterial({ color: 0xffffff, transparent: true,
        opacity: 0, depthWrite: false, side: DoubleSide, blending: AdditiveBlending }));
      const group = new Group();
      const ring = new Mesh(torus, material);
      ring.rotation.x = Math.PI / 2;
      const line = new Mesh(this.shapeLine.geometry, material);
      line.rotation.x = -Math.PI / 2;
      const burst = new Mesh(this.shapeBurst.geometry, material);
      burst.rotation.x = -Math.PI / 2;
      group.position.y = .15 + i * .01;
      group.add(ring, line, burst);
      this.root.add(group);
      this.releases.push({ group, ring, line, burst, material, kind: null, at: 0 });
    }
    this._found = [];
    this._force = { impulse: 0, lift: 0, spin: 0 };
    this._beats = 0;
    this._target = new Vector3();
    routeExpansionTransparency(this.group);
    this._disposed = false;
  }
  createParticles() {
    this.fx = createExpansionFX(this.ctx, 'arcane', {
      shape: ParticleShape.STREAK,
      colors: ['#ffffff', '#c9cbff', '#7c8cff', '#372275'],
    });
  }
  onSpawn() {
    this._target.copy(this.origin).addScaledVector(this.direction, this.length);
    this._beats = 0;
    for (const release of this.releases) { release.kind = null; release.group.visible = false; }
    this.root.visible = true;
    this._sync();
  }
  onTravel() {
    this._sync();
  }
  onImpact() {
    this._sync();
  }
  onFade() {
    if (this.phase === 'impact') {
      const interval = Math.max(0.1, this.config.beatInterval);
      while (
        this._beats < 2 &&
        this.impactTime >= interval * (this._beats + 1)
      ) {
        const kind = this._beats === 0 ? this.config.firstShape : this.config.secondShape;
        this._strike(kind);
        this.releases[this._beats].kind = kind;
        this.releases[this._beats].at = this.impactTime;
        this._beats++;
        this.lightBoost = 2;
        expansionImpact(
          this.ctx,
          this.config.edgeColor,
          this.config.impactShake,
          this.config.impactFlash,
        );
      }
    }
    this._sync();
  }
  _strike(kind) {
    expansionBurst(this.fx, this._target, {
      count: 42,
      size: 0.075,
      life: 0.7,
      speed: 3,
      radius: this.config.zoneRadius * 0.4,
    });
    const c = this.config,
      field = this.ctx.dummies;
    if (!field?.findTargets || !['ring', 'line', 'burst'].includes(kind))
      return;
    const r = c.zoneRadius,
      found = field.findTargets(this._target.x, this._target.z, r, this._found),
      power = settings.global.explosionIntensity;
    this._force.impulse = c.impulse * power;
    this._force.lift = c.lift * power;
    this._force.spin = c.spin;
    let count = 0;
    for (const d of found) {
      offset.set(
        d.position.x - this._target.x,
        0,
        d.position.z - this._target.z,
      );
      const distance = offset.length();
      if (distance > r) continue;
      const along = offset.dot(this.direction),
        lateral = offset.dot(this.side);
      if (kind === 'ring' && distance < Math.max(0, r - c.ringWidth)) continue;
      if (kind === 'line' && Math.abs(lateral) > c.lineWidth) continue;
      if (distance < 1e-5) offset.copy(this.direction);
      else offset.multiplyScalar(1 / distance);
      if (d.kill(offset.x, offset.z, this._force) && ++count >= MAX_TARGETS)
        break;
    }
  }
  _sync() {
    const c = this.config,
      r = c.zoneRadius,
      fade =
        this.phase === 'fade'
          ? 1 - clamp(this.fadeTime / this.fadeDuration)
          : 1;
    this.root.position.copy(this._target);
    this.position.copy(this._target);
    this.field.scale.set(r * 2, r * 2, 1);
    this.ink.uniforms.time.value = this.age;
    this.ink.uniforms.phase.value = this._beats / 2;
    this.ink.uniforms.fade.value = fade;
    this.ink.uniforms.ink.value.set(c.inkColor);
    this.ink.uniforms.edge.value.set(c.edgeColor);
    this.runeMat.color.set(c.etchColor);
    this.runeMat.opacity = 0.8 * fade;
    this.runes.scale.setScalar(r);
    this.runes.rotation.y = this.age * 0.25;
    const speed = c.orbitSpeed ?? 1, heroScale = (c.coreSize ?? 1) * clamp(this.u * 4) * fade;
    this.hero.scale.setScalar(Math.max(.001, heroScale));
    this.coreMat.color.set(c.coreColor ?? '#c2bbff');
    const lastRelease = this._beats ? this.releases[this._beats - 1] : null;
    const flare = lastRelease?.kind ? Math.exp(-Math.max(0, this.impactTime - lastRelease.at) * 7) : 0;
    this.coreMat.emissiveIntensity = 1.1 + flare * 1.6;
    this.core.rotation.set(this.age * speed * .4, this.age * speed, this.age * speed * .2);
    for (let i = 0; i < this.heroRings.length; i++) {
      const ring = this.heroRings[i];
      ring.rotation.set(i * Math.PI / 3 + this.age * speed * .3,
        this.age * speed * (i % 2 ? -.7 : .7), i * Math.PI / 4);
      ring.scale.setScalar(1 + this._beats * .12);
    }
    for (let i = 0; i < 8; i++) {
      const angle = i * TAU / 8 + this.age * speed;
      const radius = .65 + this._beats * .1;
      bladeTransform.position.set(Math.cos(angle) * radius, Math.sin(angle * 2) * .14, Math.sin(angle) * radius);
      bladeTransform.rotation.set(Math.sin(angle) * .3, angle, this.age * speed + i);
      bladeTransform.scale.setScalar(.6);
      bladeTransform.updateMatrix();
      this.blades.setMatrixAt(i, bladeTransform.matrix);
    }
    this.blades.instanceMatrix.needsUpdate = true;
    for (let i = 0; i < 2; i++) {
      this.rings[i].scale.setScalar(r * (i ? 0.7 : 0.92));
      this.rings[i].rotation.z = this.age * (i ? -0.8 : 0.4);
    }
    this.glow.opacity = 0.8 * fade;
    const next = this._beats === 0 ? c.firstShape : c.secondShape;
    this.shapeRing.visible = this._beats < 2 && next === 'ring';
    this.shapeLine.visible = this._beats < 2 && next === 'line';
    this.shapeBurst.visible = this._beats < 2 && next === 'burst';
    this.shapeRing.scale.set(r * 2, r * 2, 1);
    this.shapeLine.scale.set(r * 2, r * 2, 1);
    this.shapeLine.rotation.z = -Math.atan2(this.direction.x, this.direction.z);
    this.lineFootprint.uniforms.width.value = clamp(c.lineWidth / Math.max(.01, r));
    this.ringFootprint.uniforms.width.value = clamp(c.ringWidth / Math.max(.01, r));
    this.lineFootprint.uniforms.color.value.set(c.edgeColor);
    this.ringFootprint.uniforms.color.value.set(c.edgeColor);
    this.lineFootprint.uniforms.fade.value = fade;
    this.ringFootprint.uniforms.fade.value = fade;
    this.shapeBurst.scale.setScalar(r);
    this.shapeBurst.material.opacity = 0.15 * fade;
    for (const release of this.releases) {
      const progress = (this.impactTime - release.at) / .5;
      release.group.visible = !!release.kind && progress >= 0 && progress < 1;
      if (!release.group.visible) continue;
      const t = clamp(progress);
      release.ring.visible = release.kind === 'ring';
      release.line.visible = release.kind === 'line';
      release.burst.visible = release.kind === 'burst';
      release.ring.scale.setScalar(r * (1 + t * .2));
      release.line.scale.set(c.lineWidth * 2 * (1 + t * .35), r * 2, 1);
      release.line.rotation.z = -Math.atan2(this.direction.x, this.direction.z);
      release.burst.scale.setScalar(r * (.25 + .75 * t));
      release.material.color.set(c.edgeColor);
      release.material.opacity = .65 * (1 - t) * fade;
    }
  }
  onDestroy() {
    this.root.visible = false;
    this._beats = 0;
  }
  dispose() {
    if (this._disposed) return;
    this._disposed = true;
    for (const r of this.resources) r.dispose();
    super.dispose();
  }
}
export function buildEditor(gui, c) {
  const f = gui.addFolder("Spellwright's Gambit");
  f.add(c, 'firstShape', ['ring', 'line', 'burst']).name('first shape');
  f.add(c, 'secondShape', ['ring', 'line', 'burst']).name('second shape');
  f.add(c, 'beatInterval', 0.2, 1.5, 0.05).name('between shapes');
  f.add(c, 'zoneRadius', 1, 8, 0.1).name('reach');
  f.add(c, 'lineWidth', 0.1, 3, 0.05).name('line width');
  f.add(c, 'ringWidth', 0.1, 3, 0.05).name('ring width');
  f.addColor(c, 'inkColor').name('ink');
  f.addColor(c, 'edgeColor').name('light');
  f.addColor(c, 'etchColor').name('etching');
  f.addColor(c, 'coreColor').name('armillary core');
  f.add(c, 'coreSize', .3, 2, .05).name('armillary size');
  f.add(c, 'orbitSpeed', 0, 4, .05).name('orbit speed');
  f.add(c, 'impactShake', 0, 1, 0.01).name('impact shake');
  f.add(c, 'impactFlash', 0, 1, 0.01).name('impact flash');
  return f;
}
