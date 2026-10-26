import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  DoubleSide,
  Mesh,
  ShaderMaterial,
  Vector3,
} from "three";
import { Ability } from "../../Ability.js";
import { LAYER } from "../../../core/Layers.js";
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
  }
  createParticles() {}
  onSpawn() {
    this.held.clear();
    this.reversed = false;
    this.centre.copy(this.origin).addScaledVector(this.direction, this.length);
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
  }
  _apply(dt) {
    if (!this.ctx.dummies?.findTargets) return;
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
    } else this.mat.uniforms.uFade.value = 2 - t;
  }
  onDestroy() {
    for (const d of this.held) d.release?.();
    this.held.clear();
    this.mat.uniforms.uFade.value = 1;
  }
  dispose() {
    this.onDestroy();
    this.geo.dispose();
    this.mat.dispose();
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
  f.close();
  return f;
}
