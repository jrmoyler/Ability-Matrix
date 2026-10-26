import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  BoxGeometry,
  CylinderGeometry,
  DoubleSide,
  Mesh,
  Points,
  ShaderMaterial,
  Vector3,
} from "three";
import { Ability } from "../../Ability.js";
import { LAYER } from "../../../core/Layers.js";
export const ID = "overtone-spiral",
  UID = "matrix-expansion/overtone-spiral";
export const CONFIG = Object.freeze({
  id: ID,
  meta: {
    label: "Overtone Spiral",
    accent: "#ecffd5",
    element: "sound",
    key: "",
    cast: "zone",
    hint: "Three expanding harmonic fronts knock enemies away in sequence.",
    glyph:
      '<circle cx="50" cy="50" r="8"/><circle cx="50" cy="50" r="22"/><circle cx="50" cy="50" r="38"/>',
  },
  settings: {
    range: 18,
    minRange: 1,
    speed: 30,
    lifetime: 1,
    cooldown: 5,
    castAnim: "cast3",
    lightColor: "#e9ffc4",
    lightIntensity: 4,
    lightRadius: 8,
    radius: 5,
    pulseInterval: 0.45,
    waveSpeed: 8,
    impulse: 3,
    lift: 1.4,
  },
});
const SEG = 128,
  TAU = Math.PI * 2;
function harmonicGeometry() {
  const g = new BufferGeometry(),
    p = new Float32Array((SEG + 1) * 2 * 3),
    uv = new Float32Array((SEG + 1) * 2 * 2),
    idx = [];
  for (let i = 0; i <= SEG; i++) {
    uv.set([i / SEG, 0, i / SEG, 1], i * 4);
    if (i < SEG) {
      let n = i * 2;
      idx.push(n, n + 1, n + 2, n + 1, n + 3, n + 2);
    }
  }
  g.setAttribute("position", new BufferAttribute(p, 3));
  g.setAttribute("uv", new BufferAttribute(uv, 2));
  g.setIndex(idx);
  return g;
}
function harmonicMaterial() {
  return new ShaderMaterial({
    transparent: true,
    side: DoubleSide,
    depthWrite: false,
    blending: AdditiveBlending,
    uniforms: { uFade: { value: 1 }, uTime: { value: 0 } },
    vertexShader:
      "varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}",
    fragmentShader: `varying vec2 vUv;uniform float uFade,uTime;void main(){float centre=pow(max(0.,1.-abs(vUv.y-.5)*2.),1.4);float node=pow(abs(sin(vUv.x*37.699-uTime*2.)),8.);float a=(centre*.5+node*.4)*uFade;gl_FragColor=vec4(vec3(.65,1.,.52)*(1.+node*.8),a);}`,
  });
}
export class OvertoneSpiralAbility extends Ability {
  constructor(ctx) {
    super(ID, ctx);
  }
  get handlesOwnHits() {
    return true;
  }
  get impactDuration() {
    return (
      this.config.radius / this.config.waveSpeed +
      2 * this.config.pulseInterval +
      0.2
    );
  }
  get fadeDuration() {
    return Math.max(0.1, this.config.lifetime);
  }
  createShaders() {
    this.mat = harmonicMaterial();
    this.rings = [];
    for (let i = 0; i < 3; i++) {
      const ring = new Mesh(harmonicGeometry(), this.mat);
      ring.layers.set(LAYER.VFX);
      ring.frustumCulled = false;
      this.group.add(ring);
      this.rings.push(ring);
    }
    this.centre = new Vector3();
    this.found = [];
    this.hit = [new Set(), new Set(), new Set()];
    this.previous = [0, 0, 0];
    // The standing resonator gives the travelling fronts a physical source.
    this.forkGeometry = new BoxGeometry(0.12, 1, 0.12);
    this.stemGeometry = new CylinderGeometry(0.06, 0.1, 0.65, 8);
    this.forks = [];
    for (let i = 0; i < 3; i++) {
      const fork = new Mesh(this.forkGeometry, this.mat);
      fork.layers.set(LAYER.VFX);
      this.group.add(fork);
      this.forks.push(fork);
    }
    this.stem = new Mesh(this.stemGeometry, this.mat);
    this.stem.layers.set(LAYER.VFX);
    this.group.add(this.stem);
  }
  createParticles() {
    const count = 96,
      p = new Float32Array(count * 3),
      phase = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      const a = i * 2.399963,
        r = Math.sqrt((i + 0.5) / count);
      p.set([Math.cos(a) * r, (i % 7) / 7, Math.sin(a) * r], i * 3);
      phase[i] = (i * 0.618034) % 1;
    }
    this.noteGeometry = new BufferGeometry();
    this.noteGeometry.setAttribute("position", new BufferAttribute(p, 3));
    this.noteGeometry.setAttribute("phase", new BufferAttribute(phase, 1));
    this.noteMaterial = new ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
      uniforms: {
        uTime: { value: 0 },
        uFade: { value: 1 },
        uRadius: { value: 1 },
      },
      vertexShader:
        "attribute float phase;uniform float uTime,uRadius;varying float vA;void main(){float p=fract(phase+uTime*.4);vec3 q=vec3(position.x*uRadius*(.2+p),position.y+p*1.5,position.z*uRadius*(.2+p));vA=1.-p;vec4 mv=modelViewMatrix*vec4(q,1.);gl_PointSize=clamp(18./-mv.z,1.,5.);gl_Position=projectionMatrix*mv;}",
      fragmentShader:
        "varying float vA;uniform float uFade;void main(){float d=length(gl_PointCoord-.5)*2.;gl_FragColor=vec4(.7,1.,.5,(1.-smoothstep(.1,1.,d))*vA*uFade);}",
    });
    this.notes = new Points(this.noteGeometry, this.noteMaterial);
    this.notes.layers.set(LAYER.VFX);
    this.notes.frustumCulled = false;
    this.group.add(this.notes);
  }
  onSpawn() {
    this.centre.copy(this.origin).addScaledVector(this.direction, this.length);
    for (const s of this.hit) s.clear();
    this.previous.fill(0);
    this.mat.uniforms.uFade.value = 1;
    this.noteMaterial.uniforms.uFade.value = 1;
    this.notes.position.copy(this.centre);
    this.noteMaterial.uniforms.uRadius.value = this.config.radius;
    this.notes.visible = false;
    this.stem.visible = false;
    for (const fork of this.forks) fork.visible = false;
    for (const r of this.rings) {
      r.visible = false;
      r.position.copy(this.centre);
    }
  }
  onTravel() {}
  onImpact() {
    this.position.copy(this.centre);
    this.notes.visible = true;
    this.stem.visible = true;
    for (const fork of this.forks) fork.visible = true;
  }
  _resonator(t) {
    const envelope = Math.min(1, t * 8),
      shimmer = Math.sin(this.age * 35) * 0.04;
    this.stem.position.set(this.centre.x, 0.32, this.centre.z);
    this.stem.scale.setScalar(envelope);
    for (let i = 0; i < this.forks.length; i++) {
      const fork = this.forks[i],
        a = this.age * 0.25 + (i * TAU) / 3;
      fork.position.set(
        this.centre.x + Math.cos(a) * 0.25,
        1 + shimmer,
        this.centre.z + Math.sin(a) * 0.25,
      );
      fork.rotation.set(shimmer * (i + 1), a, shimmer);
      fork.scale.set(envelope, envelope * (1 + i * 0.16), envelope);
    }
    this.noteMaterial.uniforms.uTime.value = this.age;
  }
  _scan(index, lo, hi) {
    if (!this.ctx.dummies?.findTargets) return;
    const f = this.ctx.dummies,
      query = f.findBodies ?? f.findTargets,
      found = query.call(f, this.centre.x, this.centre.z, hi, this.found);
    for (const d of found) {
      if (this.hit[index].has(d)) continue;
      const p =
          d.alive === false
            ? (d.bodyPoint?.(this.position) ?? d.position)
            : d.position,
        dx = p.x - this.centre.x,
        dz = p.z - this.centre.z,
        r = Math.hypot(dx, dz);
      if (r > hi || r < lo - 0.25) continue;
      this.hit[index].add(d);
      const div = r || 1;
      if (d.alive === false)
        d.shove?.(
          (dx / div) * this.config.impulse,
          this.config.lift,
          (dz / div) * this.config.impulse,
        );
      else
        d.kill?.(
          dx / div,
          dz / div,
          { impulse: this.config.impulse, lift: this.config.lift, spin: 0.3 },
          false,
        );
    }
  }
  _ringMesh(mesh, radius, index) {
    const attr = mesh.geometry.attributes.position;
    for (let i = 0; i <= SEG; i++) {
      const a = (i / SEG) * TAU,
        wave = Math.sin(a * (6 + index * 2) + this.age * 8) * 0.08;
      for (let j = 0; j < 2; j++) {
        const r = 1 + (j ? 0.022 : -0.022);
        attr.setXYZ(i * 2 + j, Math.cos(a) * r, wave, Math.sin(a) * r);
      }
    }
    attr.needsUpdate = true;
    mesh.scale.set(radius, 1, radius);
    mesh.position.copy(this.centre);
    mesh.position.y = 0.12 + index * 0.07;
  }
  onFade(_dt, t) {
    if (t <= 1) {
      const elapsed = t * this.impactDuration;
      for (let i = 0; i < 3; i++) {
        const age = elapsed - i * this.config.pulseInterval;
        if (age < 0) continue;
        const radius = Math.min(
          this.config.radius,
          age * this.config.waveSpeed,
        );
        this.rings[i].visible = true;
        this._scan(i, this.previous[i], radius);
        this.previous[i] = radius;
        this._ringMesh(this.rings[i], radius, i);
      }
      this.mat.uniforms.uTime.value = this.age;
      this._resonator(t);
      this.position.copy(this.centre);
    } else {
      this.mat.uniforms.uFade.value = 2 - t;
      this.noteMaterial.uniforms.uFade.value = 2 - t;
      this._resonator(1);
    }
  }
  onDestroy() {
    for (const r of this.rings) r.visible = false;
    for (const s of this.hit) s.clear();
  }
  dispose() {
    for (const ring of this.rings) ring.geometry.dispose();
    this.forkGeometry.dispose();
    this.stemGeometry.dispose();
    this.noteGeometry.dispose();
    this.noteMaterial.dispose();
    this.mat.dispose();
    super.dispose();
  }
}
export function buildEditor(gui, c, Editor) {
  const f = gui.addFolder("Overtone Spiral"),
    R = Editor.range;
  R(f, c, "radius", 1, 10, 0.1, "maximum radius");
  R(f, c, "pulseInterval", 0.1, 1, 0.05, "pulse spacing");
  R(f, c, "waveSpeed", 1, 20, 0.5, "wave speed");
  R(f, c, "impulse", 0, 15, 0.1, "wave force");
  R(f, c, "lift", 0, 8, 0.1, "wave lift");
  f.close();
  return f;
}
