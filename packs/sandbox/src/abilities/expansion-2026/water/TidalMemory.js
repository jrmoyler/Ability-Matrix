import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
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
import { settings } from "../../../config/settings.js";
export const ID = "tidal-memory";
export const UID = "matrix-expansion/tidal-memory";
export const CONFIG = Object.freeze({
  id: ID,
  meta: {
    label: "Tidal Memory",
    accent: "#53c6ff",
    element: "water",
    key: "",
    cast: "line",
    hint: "A wave records its course, then retraces it back to the caster.",
    glyph:
      '<path d="M8 50Q25 20 40 50T72 50T92 50"/><path d="M70 65L54 80L70 90"/>',
  },
  settings: {
    range: 20,
    minRange: 2,
    speed: 12,
    lifetime: 1.2,
    cooldown: 4,
    castAnim: "cast2",
    lightColor: "#64caff",
    lightIntensity: 5,
    lightRadius: 8,
    width: 1.6,
    height: 1.3,
    returnDuration: 1.2,
    impulse: 4,
    lift: 2,
    turnRadius: 2.4,
    turnDuration: 0.45,
    turnFlash: 0.06,
    turnShake: 0.06,
    crestColor: "#a6f3ff",
    crestWidth: 0.14,
    crestOpacity: 0.75,
  },
});
const N = 80;
function waveGeometry() {
  const g = new BufferGeometry(),
    pos = new Float32Array((N + 1) * 2 * 3),
    uv = new Float32Array((N + 1) * 2 * 2),
    idx = [];
  for (let i = 0; i <= N; i++) {
    uv.set([i / N, 0, i / N, 1], i * 4);
    if (i < N) {
      const n = i * 2;
      idx.push(n, n + 1, n + 2, n + 1, n + 3, n + 2);
    }
  }
  g.setAttribute("position", new BufferAttribute(pos, 3));
  g.setAttribute("uv", new BufferAttribute(uv, 2));
  g.setIndex(idx);
  return g;
}
function waveMaterial() {
  return new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: DoubleSide,
    uniforms: { uTime: { value: 0 }, uFade: { value: 1 } },
    vertexShader:
      "varying vec2 vUv;varying vec3 vPos;void main(){vUv=uv;vPos=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}",
    fragmentShader: `varying vec2 vUv;varying vec3 vPos;uniform float uTime,uFade;float h(vec2 p){return fract(sin(dot(p,vec2(31.7,83.1)))*43758.54);}void main(){float froth=pow(max(0.,sin(vUv.x*59.+sin(vUv.x*18.+uTime)*2.-uTime*5.)),8.);float crest=smoothstep(.48,.95,vUv.y);float edge=pow(max(0.,1.-abs(vUv.x-.5)*2.),.3);vec3 c=mix(vec3(.015,.17,.34),vec3(.18,.8,1.),crest*.65+froth*.25);c+=vec3(.55,.85,1.)*froth*crest*.8;float a=edge*(.38+crest*.35+froth*.12)*uFade;gl_FragColor=vec4(c,a);}`,
  });
}
function wakeMaterial() {
  return new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: DoubleSide,
    blending: AdditiveBlending,
    uniforms: {
      uTime: { value: 0 },
      uFade: { value: 1 },
      uCoverage: { value: 0 },
      uDirection: { value: 1 },
    },
    vertexShader:
      "varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}",
    fragmentShader: `varying vec2 vUv;uniform float uTime,uFade,uCoverage,uDirection;void main(){float x=abs(vUv.y-.5)*2.;float ripple=pow(max(0.,sin(vUv.x*60.-uTime*7.*uDirection+x*6.)),12.);float a=(1.-smoothstep(.4,1.,x))*ripple*.35*uFade*(1.-smoothstep(uCoverage,uCoverage+.025,vUv.x));gl_FragColor=vec4(.08,.55,.85,a);}`,
  });
}
export class TidalMemoryAbility extends Ability {
  constructor(ctx) {
    super(ID, ctx);
  }
  get handlesOwnHits() {
    return true;
  }
  get impactDuration() {
    return Math.max(0.1, this.config.returnDuration);
  }
  get fadeDuration() {
    return Math.max(0.1, this.config.lifetime);
  }
  createShaders() {
    this.geo = waveGeometry();
    this.mat = waveMaterial();
    this.wave = new Mesh(this.geo, this.mat);
    this.wave.frustumCulled = false;
    this.wave.layers.set(LAYER.VFX);
    this.group.add(this.wave);
    this.wakeGeo = waveGeometry();
    this.wakeMat = wakeMaterial();
    this.wake = new Mesh(this.wakeGeo, this.wakeMat);
    this.wake.frustumCulled = false;
    this.wake.layers.set(LAYER.VFX);
    this.group.add(this.wake);
    // Two independently shaped foam bands ride the wave's crest and lag
    // behind it. Their direction reverses when the recorded wave returns.
    this.crestMaterial = new ShaderMaterial({
      transparent: true,
      depthWrite: false,
      side: DoubleSide,
      blending: AdditiveBlending,
      uniforms: {
        uTime: { value: 0 },
        uFade: { value: 1 },
        uColor: { value: new Color(0xa6f3ff) },
        uOpacity: { value: 1 },
      },
      vertexShader:
        "varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}",
      fragmentShader:
        "varying vec2 vUv;uniform float uTime,uFade,uOpacity;uniform vec3 uColor;void main(){float edge=pow(max(0.,1.-abs(vUv.x-.5)*2.),.7);float stripe=pow(max(0.,sin(vUv.x*63.-uTime*8.)),7.);float across=1.-abs(vUv.y-.5)*2.;gl_FragColor=vec4(uColor*(.65+stripe),edge*across*(.4+stripe*.6)*uFade*uOpacity);}",
    });
    this.crestBands = [];
    for (let i = 0; i < 2; i++) {
      const band = new Mesh(waveGeometry(), this.crestMaterial);
      band.layers.set(LAYER.VFX);
      band.frustumCulled = false;
      this.group.add(band);
      this.crestBands.push(band);
    }
    this.turnGeometry = new RingGeometry(0.82, 1, 72);
    this.turnMaterial = new ShaderMaterial({
      transparent: true,
      depthWrite: false,
      side: DoubleSide,
      blending: AdditiveBlending,
      uniforms: { uFade: { value: 1 }, uTime: { value: 0 } },
      vertexShader:
        "varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}",
      fragmentShader:
        "varying vec2 vUv;uniform float uFade,uTime;void main(){vec2 p=vUv-.5;float angle=atan(p.y,p.x);float bead=pow(max(0.,sin(angle*13.-uTime*7.)),6.);gl_FragColor=vec4(.2,.8,1.,uFade*(.2+.65*bead));}",
    });
    this.turnRing = new Mesh(this.turnGeometry, this.turnMaterial);
    this.turnRing.layers.set(LAYER.VFX);
    this.turnRing.rotation.x = -Math.PI / 2;
    this.turnRing.visible = false;
    this.group.add(this.turnRing);
    this.samples = new Float32Array((N + 1) * 2);
    this.hitOut = new Set();
    this.hitBack = new Set();
    this.found = [];
    this.tmp = new Vector3();
    this.frontPoint = new Vector3();
    this.wakePoint = new Vector3();
    this.bodyPoint = new Vector3();
    this.backDistance = 0;
  }
  createParticles() {
    const count = 112,
      p = new Float32Array(count * 3),
      phase = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      p.set(
        [
          ((i * 0.618034) % 1) * 2 - 1,
          (i * 0.414214) % 1,
          ((i * 0.73205) % 1) * 2 - 1,
        ],
        i * 3,
      );
      phase[i] = (i * 0.754877) % 1;
    }
    this.sprayGeometry = new BufferGeometry();
    this.sprayGeometry.setAttribute("position", new BufferAttribute(p, 3));
    this.sprayGeometry.setAttribute("phase", new BufferAttribute(phase, 1));
    this.sprayMaterial = new ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
      uniforms: {
        uTime: { value: 0 },
        uFade: { value: 1 },
        uWidth: { value: 1 },
        uHeight: { value: 1 },
      },
      vertexShader:
        "attribute float phase;uniform float uTime,uWidth,uHeight;varying float vA;void main(){float t=fract(phase+uTime*.7);vec3 q=vec3(position.x*uWidth,position.y*uHeight+t*(1.-t)*2.,position.z*(.2+t*.7));vA=sin(t*3.14159);vec4 mv=modelViewMatrix*vec4(q,1.);gl_PointSize=clamp(22./-mv.z,1.,5.);gl_Position=projectionMatrix*mv;}",
      fragmentShader:
        "uniform float uFade;varying float vA;void main(){float d=length(gl_PointCoord-.5)*2.;gl_FragColor=vec4(.55,.9,1.,(1.-smoothstep(.2,1.,d))*vA*uFade);}",
    });
    this.spray = new Points(this.sprayGeometry, this.sprayMaterial);
    this.spray.layers.set(LAYER.VFX);
    this.spray.frustumCulled = false;
    this.group.add(this.spray);
  }
  onSpawn() {
    this.hitOut.clear();
    this.hitBack.clear();
    this.turnRing.visible = false;
    this.prev = 0;
    this.backDistance = this.length;
    this.coverage = 0;
    this.returning = false;
    this.wakeMat.uniforms.uDirection.value = 1;
    this.wakeMat.uniforms.uCoverage.value = 0;
    this.sprayMaterial.uniforms.uFade.value = 1;
    this.sprayMaterial.uniforms.uWidth.value = this.config.width;
    this.sprayMaterial.uniforms.uHeight.value = this.config.height;
    this.crestMaterial.uniforms.uFade.value = 1;
    for (let i = 0; i <= N; i++) {
      const u = i / N;
      this.samples[i * 2] =
        Math.sin(u * 8.1) * 0.24 + Math.sin(u * 19.7) * 0.07;
      this.samples[i * 2 + 1] = 0.14 * Math.sin(u * 12.3);
    }
    this._draw(0);
  }
  _path(d) {
    const u = Math.max(0, Math.min(1, d / this.length)) * N,
      i = Math.min(N - 1, Math.floor(u)),
      f = u - i;
    return this.samples[i * 2] * (1 - f) + this.samples[(i + 1) * 2] * f;
  }
  _point(d, out) {
    return out
      .copy(this.origin)
      .addScaledVector(this.direction, d)
      .addScaledVector(this.side, this._path(d));
  }
  _draw(d) {
    this._point(d, this.frontPoint);
    this.tmp.copy(this.frontPoint);
    const attr = this.geo.attributes.position;
    for (let i = 0; i <= N; i++) {
      const u = (i / N) * 2 - 1,
        x = u * this.config.width,
        crest = this.config.height * Math.max(0, 1 - u * u),
        roll = Math.sin(u * 7 + this.age * 4) * 0.1;
      attr.setXYZ(
        i * 2,
        this.tmp.x + this.side.x * x,
        0.05,
        this.tmp.z + this.side.z * x,
      );
      attr.setXYZ(
        i * 2 + 1,
        this.tmp.x + this.side.x * x + this.direction.x * roll,
        crest,
        this.tmp.z + this.side.z * x + this.direction.z * roll,
      );
    }
    attr.needsUpdate = true;
    const sign = this.returning ? -1 : 1;
    for (let band = 0; band < this.crestBands.length; band++) {
      const p = this.crestBands[band].geometry.attributes.position;
      for (let i = 0; i <= N; i++) {
        const u = (i / N) * 2 - 1,
          x = u * this.config.width,
          h = this.config.height * Math.max(0, 1 - u * u),
          roll = Math.sin(u * 7 + this.age * 4) * 0.1,
          lag = sign * (0.12 + band * 0.24),
          width = this.config.crestWidth * (1 - band * 0.25);
        for (let j = 0; j < 2; j++)
          p.setXYZ(
            i * 2 + j,
            this.tmp.x + this.side.x * x + this.direction.x * (roll - lag),
            h + (j ? width : 0),
            this.tmp.z + this.side.z * x + this.direction.z * (roll - lag),
          );
      }
      p.needsUpdate = true;
    }
    const wa = this.wakeGeo.attributes.position;
    for (let i = 0; i <= N; i++) {
      const dist = (this.length * i) / N,
        p = this._point(dist, this.wakePoint),
        w = 0.35 + 0.15 * Math.sin(i * 1.7);
      wa.setXYZ(i * 2, p.x - this.side.x * w, 0.04, p.z - this.side.z * w);
      wa.setXYZ(i * 2 + 1, p.x + this.side.x * w, 0.04, p.z + this.side.z * w);
    }
    wa.needsUpdate = true;
    this.mat.uniforms.uTime.value = this.age;
    this.wakeMat.uniforms.uTime.value = this.age;
    this.wakeMat.uniforms.uCoverage.value = this.coverage;
    this.spray.position.copy(this.frontPoint);
    this.spray.rotation.y =
      Math.atan2(this.direction.x, this.direction.z) +
      (this.returning ? Math.PI : 0);
    this.sprayMaterial.uniforms.uTime.value = this.age;
    this.crestMaterial.uniforms.uTime.value = this.age;
    this.crestMaterial.uniforms.uColor.value.set(this.config.crestColor);
    this.crestMaterial.uniforms.uOpacity.value = this.config.crestOpacity;
    this.position.copy(this.frontPoint);
  }
  _sweep(a, b, seen) {
    if (!this.ctx.dummies?.findTargets) return;
    const lo = Math.min(a, b),
      hi = Math.max(a, b);
    this._point((lo + hi) / 2, this.tmp);
    const field = this.ctx.dummies,
      query = b < a && field.findBodies ? field.findBodies : field.findTargets;
    const found = query.call(
      field,
      this.tmp.x,
      this.tmp.z,
      Math.hypot((hi - lo) / 2, this.config.width + 1),
      this.found,
    );
    for (const d of found) {
      if (seen.has(d)) continue;
      const at =
        d.alive === false
          ? (d.bodyPoint?.(this.bodyPoint) ?? d.position)
          : d.position;
      const x = at.x - this.origin.x,
        z = at.z - this.origin.z,
        along = x * this.direction.x + z * this.direction.z,
        side = x * this.side.x + z * this.side.z - this._path(along);
      if (
        along < lo - 0.3 ||
        along > hi + 0.3 ||
        Math.abs(side) > this.config.width
      )
        continue;
      seen.add(d);
      const sign = b >= a ? 1 : -1;
      if (d.alive === false)
        d.shove?.(
          this.direction.x * sign * this.config.impulse,
          this.config.lift,
          this.direction.z * sign * this.config.impulse,
        );
      else
        d.kill?.(
          this.direction.x * sign,
          this.direction.z * sign,
          { impulse: this.config.impulse, lift: this.config.lift, spin: 0.5 },
          false,
        );
    }
  }
  onTravel() {
    const front = Math.min(this.length, this.front);
    this.coverage = front / this.length;
    this._sweep(this.prev, front, this.hitOut);
    this.prev = front;
    this._draw(front);
  }
  onImpact() {
    this.backDistance = this.length;
    this.returning = true;
    this.wakeMat.uniforms.uDirection.value = -1;
    this.turnRing.position.copy(this.frontPoint);
    this.turnRing.position.y = 0.06;
    this.turnRing.scale.setScalar(0.2);
    this.turnRing.visible = true;
    this.turnMaterial.uniforms.uFade.value = 1;
    this.ctx.shake?.add?.(
      this.config.turnShake * settings.global.cameraShake,
      5,
      18,
    );
    this.ctx.flash?.trigger?.(
      this.lightColor.set(this.config.lightColor),
      this.config.turnFlash * settings.global.explosionIntensity,
    );
  }
  onFade(_dt, t) {
    if (t <= 1) {
      const turn = Math.min(
        1,
        (t * this.impactDuration) / Math.max(0.05, this.config.turnDuration),
      );
      this.turnRing.scale.setScalar(0.2 + turn * this.config.turnRadius);
      this.turnMaterial.uniforms.uFade.value = (1 - turn) * (1 - turn);
      this.turnMaterial.uniforms.uTime.value = this.age;
      this.turnRing.visible = turn < 1;
      const next = this.length * (1 - t);
      this._sweep(this.backDistance, next, this.hitBack);
      this.backDistance = next;
      this._draw(next);
    } else {
      this.turnRing.visible = false;
      const f = 2 - t;
      this.mat.uniforms.uFade.value = f;
      this.wakeMat.uniforms.uFade.value = f;
      this.sprayMaterial.uniforms.uFade.value = f;
      this.crestMaterial.uniforms.uFade.value = f;
    }
  }
  onDestroy() {
    this.hitOut.clear();
    this.hitBack.clear();
    this.turnRing.visible = false;
    this.mat.uniforms.uFade.value = 1;
    this.wakeMat.uniforms.uFade.value = 1;
  }
  dispose() {
    this.geo.dispose();
    this.mat.dispose();
    this.wakeGeo.dispose();
    this.wakeMat.dispose();
    this.sprayGeometry.dispose();
    this.sprayMaterial.dispose();
    for (const band of this.crestBands) band.geometry.dispose();
    this.crestMaterial.dispose();
    this.turnGeometry.dispose();
    this.turnMaterial.dispose();
    super.dispose();
  }
}
export function buildEditor(gui, c, Editor) {
  const f = gui.addFolder("Tidal Memory"),
    R = Editor.range;
  R(f, c, "width", 0.4, 4, 0.05, "wave width");
  R(f, c, "height", 0.2, 4, 0.05, "crest height");
  R(f, c, "crestWidth", 0.02, 0.6, 0.01, "foam width");
  R(f, c, "crestOpacity", 0, 1, 0.01, "foam opacity");
  f.addColor(c, "crestColor").name("foam color");
  R(f, c, "returnDuration", 0.2, 4, 0.05, "return time");
  R(f, c, "turnRadius", 0.2, 6, 0.1, "turn ripple radius");
  R(f, c, "turnDuration", 0.1, 2, 0.05, "turn ripple time");
  R(f, c, "turnFlash", 0, 0.5, 0.01, "turn flash");
  R(f, c, "turnShake", 0, 1, 0.01, "turn shake");
  R(f, c, "impulse", 0, 15, 0.1, "wave force");
  R(f, c, "lift", 0, 8, 0.1, "wave lift");
  f.close();
  return f;
}
