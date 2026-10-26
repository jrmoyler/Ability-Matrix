import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  DoubleSide,
  Mesh,
  Points,
  RingGeometry,
  ShaderMaterial,
  Vector3,
} from "three";
import { Ability } from "../../Ability.js";
import { LAYER } from "../../../core/Layers.js";
import { settings } from "../../../config/settings.js";
export const ID = "pressure-inversion",
  UID = "matrix-expansion/pressure-inversion";
export const CONFIG = Object.freeze({
  id: ID,
  meta: {
    label: "Pressure Inversion",
    accent: "#c7fff1",
    element: "wind",
    key: "",
    cast: "zone",
    hint: "A pressure well pulls bodies inward before reversing into a violent outward gust.",
    glyph:
      '<path d="M12 45Q25 18 49 24Q72 28 75 48M88 53Q70 80 48 76Q25 72 23 53"/><path d="M65 13L76 25L63 31M32 88L21 76L35 70"/>',
  },
  settings: {
    range: 18,
    minRange: 1,
    speed: 28,
    lifetime: 1.1,
    cooldown: 6,
    castAnim: "cast3",
    lightColor: "#c7fff1",
    lightIntensity: 3,
    lightRadius: 9,
    radius: 4,
    duration: 3.2,
    wellForce: 8,
    gustForce: 12,
    lift: 2,
    gustShake: 0.12,
    gustFlash: 0.05,
  },
});
const TAU = Math.PI * 2,
  SEG = 160;
function vortexGeo() {
  const g = new BufferGeometry(),
    pos = new Float32Array((SEG + 1) * 2 * 3),
    uv = new Float32Array((SEG + 1) * 2 * 2),
    idx = [];
  for (let i = 0; i <= SEG; i++) {
    uv.set([i / SEG, 0, i / SEG, 1], i * 4);
    if (i < SEG) {
      const n = i * 2;
      idx.push(n, n + 1, n + 2, n + 1, n + 3, n + 2);
    }
  }
  g.setAttribute("position", new BufferAttribute(pos, 3));
  g.setAttribute("uv", new BufferAttribute(uv, 2));
  g.setIndex(idx);
  return g;
}
function airMat() {
  return new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: DoubleSide,
    blending: AdditiveBlending,
    uniforms: {
      uTime: { value: 0 },
      uFade: { value: 1 },
      uPolarity: { value: 1 },
    },
    vertexShader:
      "varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}",
    fragmentShader: `varying vec2 vUv;uniform float uTime,uFade,uPolarity;void main(){float core=pow(max(0.,1.-abs(vUv.y-.5)*2.),1.8);float flow=pow(max(0.,sin(vUv.x*75.-uTime*9.*uPolarity)),9.);float a=(core*.28+flow*.42)*uFade;gl_FragColor=vec4(mix(vec3(.04,.4,.4),vec3(.7,1.,.95),core),a);}`,
  });
}
export class PressureInversionAbility extends Ability {
  constructor(ctx) {
    super(ID, ctx);
  }
  get handlesOwnHits() {
    return true;
  }
  get impactDuration() {
    return Math.max(0.2, this.config.duration);
  }
  get fadeDuration() {
    return Math.max(0.2, this.config.lifetime);
  }
  createShaders() {
    this.geo = vortexGeo();
    this.mat = airMat();
    this.ribbons = [];
    for (let i = 0; i < 4; i++) {
      const o = new Mesh(this.geo, this.mat);
      o.layers.set(LAYER.VFX);
      o.frustumCulled = false;
      o.rotation.y = (i * TAU) / 4;
      this.ribbons.push(o);
      this.group.add(o);
    }
    this.centre = new Vector3();
    this.found = [];
    this.held = new Set();
    this._field = (x, y, z, out) => {
      const dx = this.centre.x - x,
        dz = this.centre.z - z,
        r = Math.hypot(dx, dz) || 1,
        sign = this.reversed ? -1 : 1,
        force = this.reversed ? this.config.gustForce : this.config.wellForce;
      out.set(
        (dx / r) * force * sign,
        this.config.lift,
        (dz / r) * force * sign,
      );
    };
    this.floorGeometry = new RingGeometry(0.91, 1, 96);
    this.floorMaterial = new ShaderMaterial({
      transparent: true,
      depthWrite: false,
      side: DoubleSide,
      blending: AdditiveBlending,
      uniforms: {
        uTime: { value: 0 },
        uFade: { value: 1 },
        uPolarity: { value: 1 },
      },
      vertexShader:
        "varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}",
      fragmentShader:
        "varying vec2 vUv;uniform float uTime,uFade,uPolarity;void main(){vec2 p=vUv-.5;float a=atan(p.y,p.x);float sweep=pow(max(0.,sin(a*14.-uTime*5.*uPolarity)),7.);gl_FragColor=vec4(.32,.85,.78,(.16+sweep*.55)*uFade);}",
    });
    this.floor = new Mesh(this.floorGeometry, this.floorMaterial);
    this.floor.layers.set(LAYER.VFX);
    this.floor.rotation.x = -Math.PI / 2;
    this.group.add(this.floor);
  }
  createParticles() {
    const count = 128,
      p = new Float32Array(count * 3),
      phase = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      const angle = i * 2.399963,
        radius = Math.sqrt((i + 0.5) / count);
      p.set(
        [Math.cos(angle) * radius, (i % 11) / 11, Math.sin(angle) * radius],
        i * 3,
      );
      phase[i] = (i * 0.618034) % 1;
    }
    this.dustGeometry = new BufferGeometry();
    this.dustGeometry.setAttribute("position", new BufferAttribute(p, 3));
    this.dustGeometry.setAttribute("phase", new BufferAttribute(phase, 1));
    this.dustMaterial = new ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
      uniforms: {
        uTime: { value: 0 },
        uFade: { value: 1 },
        uRadius: { value: 1 },
        uPolarity: { value: 1 },
      },
      vertexShader:
        "attribute float phase;uniform float uTime,uRadius,uPolarity;varying float vA;void main(){float t=fract(phase+uTime*.22);float r=mix(1.,.1,t);if(uPolarity<0.)r=1.-r;float a=uTime*2.*uPolarity+t*5.;mat2 rot=mat2(cos(a),-sin(a),sin(a),cos(a));vec2 xz=rot*position.xz*uRadius*r;vec3 q=vec3(xz.x,.15+position.y*1.8+t,xz.y);vA=sin(t*3.14159);vec4 mv=modelViewMatrix*vec4(q,1.);gl_PointSize=clamp(17./-mv.z,1.,5.);gl_Position=projectionMatrix*mv;}",
      fragmentShader:
        "uniform float uFade;varying float vA;void main(){float r=length(gl_PointCoord-.5)*2.;gl_FragColor=vec4(.55,1.,.85,(1.-smoothstep(.15,1.,r))*vA*uFade);}",
    });
    this.dust = new Points(this.dustGeometry, this.dustMaterial);
    this.dust.layers.set(LAYER.VFX);
    this.dust.frustumCulled = false;
    this.group.add(this.dust);
  }
  onSpawn() {
    this.held.clear();
    this.reversed = false;
    this.centre.copy(this.origin).addScaledVector(this.direction, this.length);
    this.floor.position.copy(this.centre);
    this.floor.position.y = 0.035;
    this.floor.scale.setScalar(this.config.radius);
    this.dust.position.copy(this.centre);
    this.dustMaterial.uniforms.uRadius.value = this.config.radius;
    this.floorMaterial.uniforms.uFade.value = 1;
    this.dustMaterial.uniforms.uFade.value = 1;
    this._draw(0);
  }
  _draw(t) {
    const a = this.geo.attributes.position;
    for (let i = 0; i <= SEG; i++) {
      const u = i / SEG,
        angle = u * TAU * 3 + this.age * (this.reversed ? -2 : 2),
        r = this.config.radius * (0.18 + 0.82 * u),
        height = (1 - u) * 1.6 + 0.15;
      const x = Math.cos(angle) * r,
        z = Math.sin(angle) * r;
      for (let j = 0; j < 2; j++)
        a.setXYZ(i * 2 + j, x, height + (j ? 0.12 : -0.12), z);
    }
    a.needsUpdate = true;
    for (const ribbon of this.ribbons) ribbon.position.copy(this.centre);
    this.mat.uniforms.uTime.value = this.age;
    this.mat.uniforms.uPolarity.value = this.reversed ? -1 : 1;
    for (const material of [this.floorMaterial, this.dustMaterial]) {
      material.uniforms.uTime.value = this.age;
      material.uniforms.uPolarity.value = this.reversed ? -1 : 1;
    }
  }
  _apply(dt) {
    if (!this.ctx.dummies?.findTargets) return;
    // Slots are pooled. Once a body disappears or a slot is reused, it no
    // longer belongs to this current; release it before finding new targets.
    for (const d of this.held) {
      if (d.state === "gone" || d.alive === true) {
        d.release?.();
        this.held.delete(d);
      }
    }
    const found = this.ctx.dummies.findTargets(
      this.centre.x,
      this.centre.z,
      this.config.radius,
      this.found,
    );
    for (const d of found) {
      if (this.held.size >= 12 && !this.held.has(d)) break;
      if (!this.held.has(d)) {
        const dx = this.centre.x - d.position.x,
          dz = this.centre.z - d.position.z,
          r = Math.hypot(dx, dz) || 1;
        if (d.kill?.(dx / r, dz / r, { impulse: 1, lift: 1, spin: 0.4 }, false))
          this.held.add(d);
      }
    }
    for (const d of this.held)
      d.carry?.(this._field, Math.min(1, dt * 4), Math.min(1, dt * 3), 0.3);
  }
  onTravel() {
    this._draw(0);
  }
  onImpact() {
    this.position.copy(this.centre);
  }
  onFade(dt, t) {
    if (t <= 1) {
      const inverted = t >= 0.65;
      if (inverted && !this.reversed) {
        this.reversed = true;
        this.ctx.shake?.add?.(
          this.config.gustShake * settings.global.cameraShake,
          5,
          18,
        );
        this.ctx.flash?.trigger?.(
          this.lightColor.set(this.config.lightColor),
          this.config.gustFlash * settings.global.explosionIntensity,
        );
        for (const d of this.held) {
          const p = d.bodyPoint?.(new Vector3()) ?? d.position,
            dx = p.x - this.centre.x,
            dz = p.z - this.centre.z,
            r = Math.hypot(dx, dz) || 1;
          d.shove?.(
            (dx / r) * this.config.gustForce,
            this.config.lift,
            (dz / r) * this.config.gustForce,
          );
        }
      }
      this._apply(dt);
      this._draw(t);
    } else {
      // The gust has ended. Return gravity immediately instead of leaving
      // bodies buoyant for the separate visual fade-out.
      this._releaseHeld();
      this.mat.uniforms.uFade.value = 2 - t;
      this.floorMaterial.uniforms.uFade.value = 2 - t;
      this.dustMaterial.uniforms.uFade.value = 2 - t;
      this._draw(t);
    }
  }
  onDestroy() {
    this._releaseHeld();
    this.mat.uniforms.uFade.value = 1;
  }
  _releaseHeld() {
    for (const d of this.held) d.release?.();
    this.held.clear();
  }
  dispose() {
    this.onDestroy();
    this.geo.dispose();
    this.mat.dispose();
    this.floorGeometry.dispose();
    this.floorMaterial.dispose();
    this.dustGeometry.dispose();
    this.dustMaterial.dispose();
    super.dispose();
  }
}
export function buildEditor(gui, c, Editor) {
  const f = gui.addFolder("Pressure Inversion"),
    R = Editor.range;
  R(f, c, "radius", 1, 8, 0.1, "well radius");
  R(f, c, "duration", 1, 8, 0.1, "well duration");
  R(f, c, "wellForce", 0, 20, 0.2, "inward force");
  R(f, c, "gustForce", 0, 25, 0.2, "release force");
  R(f, c, "lift", 0, 8, 0.1, "current lift");
  R(f, c, "gustShake", 0, 1, 0.01, "gust shake");
  R(f, c, "gustFlash", 0, 0.5, 0.01, "gust flash");
  f.close();
  return f;
}
