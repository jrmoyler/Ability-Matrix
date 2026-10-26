import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  BoxGeometry,
  CylinderGeometry,
  Color,
  DoubleSide,
  Mesh,
  Points,
  RingGeometry,
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
    toneA: "#a6ff85",
    toneB: "#54ebe6",
    toneC: "#e6d1ff",
    resonance: 1,
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
function harmonicMaterial(color = new Color(0xa6ff85), frequency = 1) {
  return new ShaderMaterial({
    transparent: true,
    side: DoubleSide,
    depthWrite: false,
    blending: AdditiveBlending,
    uniforms: {
      uFade: { value: 1 },
      uTime: { value: 0 },
      uColor: { value: color },
      uHarmonic: { value: frequency },
    },
    vertexShader:
      "varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}",
    fragmentShader: `varying vec2 vUv;uniform float uFade,uTime,uHarmonic;uniform vec3 uColor;void main(){float centre=pow(max(0.,1.-abs(vUv.y-.5)*2.),1.4);float node=pow(abs(sin(vUv.x*37.699*uHarmonic-uTime*2.)),8.);float a=(centre*.5+node*.4)*uFade;gl_FragColor=vec4(uColor*(1.+node*.8),a);}`,
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
    this.ringMaterials = [];
    const colors = [
      new Color(0xa6ff85),
      new Color(0x54ebe6),
      new Color(0xe6d1ff),
    ];
    for (let i = 0; i < 3; i++) {
      const material = harmonicMaterial(colors[i], 1 + i * 0.5);
      this.ringMaterials.push(material);
      const ring = new Mesh(harmonicGeometry(), material);
      ring.layers.set(LAYER.VFX);
      ring.frustumCulled = false;
      this.group.add(ring);
      this.rings.push(ring);
    }
    this.centre = new Vector3();
    this.found = [];
    this.hit = [new Set(), new Set(), new Set()];
    this.previous = [0, 0, 0];
    // A travelling carrier makes the delivery of the zone visible before the
    // resonator forms and releases its three independent fronts.
    this.carrierGeometry = new RingGeometry(0.6, 1, 64);
    this.carrierMaterial = harmonicMaterial(new Color(0x7af5bd), 2);
    this.carrier = new Mesh(this.carrierGeometry, this.carrierMaterial);
    this.carrier.layers.set(LAYER.VFX);
    this.carrier.rotation.x = -Math.PI / 2;
    this.group.add(this.carrier);
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
    for (const material of this.ringMaterials)
      material.uniforms.uFade.value = 1;
    this._syncColors();
    this.noteMaterial.uniforms.uFade.value = 1;
    this.carrier.visible = true;
    this.carrierMaterial.uniforms.uFade.value = 1;
    this._drawCarrier();
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
  _drawCarrier() {
    this._syncColors();
    this.pointAt(this.u, this.carrier.position);
    this.carrier.position.y = 0.28;
    const size = 0.35 + 0.1 * Math.sin(this.age * 12);
    this.carrier.scale.setScalar(size);
    this.carrier.rotation.z = this.age * 2;
    this.carrierMaterial.uniforms.uTime.value = this.age;
  }
  _syncColors() {
    this.ringMaterials[0].uniforms.uColor.value.set(this.config.toneA);
    this.ringMaterials[1].uniforms.uColor.value.set(this.config.toneB);
    this.ringMaterials[2].uniforms.uColor.value.set(this.config.toneC);
    this.mat.uniforms.uColor.value.set(this.config.toneA);
    this.carrierMaterial.uniforms.uColor.value.set(this.config.toneA);
  }
  onTravel() {
    this._drawCarrier();
  }
  onImpact() {
    this.position.copy(this.centre);
    this.carrier.visible = false;
    this.notes.visible = true;
    this.stem.visible = true;
    for (const fork of this.forks) fork.visible = true;
  }
  _resonator(t) {
    const envelope = Math.min(1, t * 8),
      shimmer = Math.sin(this.age * 35) * 0.04;
    const elapsed = t * this.impactDuration;
    let beat = 0;
    for (let i = 0; i < 3; i++) {
      const since = elapsed - i * this.config.pulseInterval;
      if (since >= 0) beat = Math.max(beat, Math.max(0, 1 - since / 0.18));
    }
    beat *= this.config.resonance;
    this.stem.position.set(this.centre.x, 0.32, this.centre.z);
    this.stem.scale.set(
      envelope * (1 + beat * 0.12),
      envelope,
      envelope * (1 + beat * 0.12),
    );
    for (let i = 0; i < this.forks.length; i++) {
      const fork = this.forks[i],
        a = this.age * 0.25 + (i * TAU) / 3;
      fork.position.set(
        this.centre.x + Math.cos(a) * 0.25,
        1 + shimmer + beat * 0.15,
        this.centre.z + Math.sin(a) * 0.25,
      );
      fork.rotation.set(shimmer * (i + 1), a, shimmer + beat * 0.12);
      fork.scale.set(
        envelope,
        envelope * (1 + i * 0.16) * (1 + beat * 0.2),
        envelope,
      );
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
    this._syncColors();
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
        this.ringMaterials[i].uniforms.uTime.value = this.age;
        this.ringMaterials[i].uniforms.uFade.value =
          1 - (0.65 * radius) / this.config.radius;
        this._scan(i, this.previous[i], radius);
        this.previous[i] = radius;
        this._ringMesh(this.rings[i], radius, i);
      }
      this.mat.uniforms.uTime.value = this.age;
      this._resonator(t);
      this.position.copy(this.centre);
    } else {
      this.mat.uniforms.uFade.value = 2 - t;
      for (const material of this.ringMaterials)
        material.uniforms.uFade.value = 0.35 * (2 - t);
      this.noteMaterial.uniforms.uFade.value = 2 - t;
      this._resonator(1);
    }
  }
  onDestroy() {
    this.carrier.visible = false;
    for (const r of this.rings) r.visible = false;
    for (const s of this.hit) s.clear();
  }
  dispose() {
    for (const ring of this.rings) ring.geometry.dispose();
    for (const material of this.ringMaterials) material.dispose();
    this.forkGeometry.dispose();
    this.stemGeometry.dispose();
    this.noteGeometry.dispose();
    this.noteMaterial.dispose();
    this.carrierGeometry.dispose();
    this.carrierMaterial.dispose();
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
  R(f, c, "resonance", 0, 2, 0.05, "strike motion");
  R(f, c, "impulse", 0, 15, 0.1, "wave force");
  R(f, c, "lift", 0, 8, 0.1, "wave lift");
  f.addColor(c, "toneA").name("first tone");
  f.addColor(c, "toneB").name("second tone");
  f.addColor(c, "toneC").name("third tone");
  f.close();
  return f;
}
