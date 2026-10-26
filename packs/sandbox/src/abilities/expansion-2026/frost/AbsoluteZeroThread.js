import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Color,
  DoubleSide,
  Mesh,
  MeshStandardMaterial,
  Points,
  ShaderMaterial,
  Vector3,
} from "three";
import { clone as cloneSkeleton } from "three/addons/utils/SkeletonUtils.js";
import { Ability } from "../../Ability.js";
import { LAYER } from "../../../core/Layers.js";
export const ID = "absolute-zero-thread";
export const UID = "matrix-expansion/absolute-zero-thread";
export const CONFIG = Object.freeze({
  id: ID,
  meta: {
    label: "Absolute Zero Thread",
    accent: "#9be9ff",
    element: "frost",
    key: "",
    cast: "line",
    hint: "A freezing filament sweeps forward and locks struck bodies in ice.",
    glyph:
      '<path d="M10 80Q30 25 50 50T90 20"/><path d="M50 30V70M32 40L68 60M32 60L68 40"/>',
  },
  settings: {
    range: 20,
    minRange: 1,
    speed: 20,
    lifetime: 2.4,
    cooldown: 4,
    castAnim: "cast1",
    lightColor: "#9be9ff",
    lightIntensity: 5,
    lightRadius: 6,
    width: 0.15,
    reach: 0.8,
    freezeDelay: 0.25,
    freezeDuration: 1.5,
  },
});
const N = 96,
  UP = new Vector3(0, 1, 0);
function ribbon() {
  const g = new BufferGeometry(),
    p = new Float32Array((N + 1) * 2 * 3),
    uv = new Float32Array((N + 1) * 2 * 2),
    idx = [];
  for (let i = 0; i <= N; i++) {
    uv.set([i / N, 0, i / N, 1], i * 4);
    if (i < N) {
      const j = i * 2;
      idx.push(j, j + 1, j + 2, j + 1, j + 3, j + 2);
    }
  }
  g.setAttribute("position", new BufferAttribute(p, 3));
  g.setAttribute("uv", new BufferAttribute(uv, 2));
  g.setIndex(idx);
  return g;
}
function iceMaterial() {
  return new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: DoubleSide,
    blending: AdditiveBlending,
    uniforms: { uTime: { value: 0 }, uFade: { value: 1 } },
    vertexShader:
      "varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}",
    fragmentShader: `varying vec2 vUv;uniform float uTime,uFade;float hash(float x){return fract(sin(x*141.7)*43758.5);}void main(){float edge=pow(max(0.,1.-abs(vUv.y-.5)*2.),.45);float strand=pow(max(0.,sin(vUv.x*92.-uTime*5.+sin(vUv.x*31.)*1.6)),14.);float crystal=step(.91,hash(floor(vUv.x*66.)));float a=(edge*.55+strand*.45+crystal*.3)*uFade;gl_FragColor=vec4(mix(vec3(.06,.45,.8),vec3(.87,1.,1.),edge+crystal*.2),a);}`,
  });
}
function frostDust() {
  const p = new Float32Array(72 * 3);
  for (let i = 0; i < 72; i++) {
    p[i * 3] = i / 72;
    p[i * 3 + 1] = ((i * 31) % 19) / 19;
    p[i * 3 + 2] = ((i * 17) % 23) / 23 - 0.5;
  }
  const g = new BufferGeometry();
  g.setAttribute("position", new BufferAttribute(p, 3));
  return g;
}
export class AbsoluteZeroThreadAbility extends Ability {
  constructor(ctx) {
    super(ID, ctx);
  }
  get handlesOwnHits() {
    return true;
  }
  get impactDuration() {
    return 0.25;
  }
  get fadeDuration() {
    return Math.max(0.2, this.config.lifetime);
  }
  createShaders() {
    this.geometry = ribbon();
    this.material = iceMaterial();
    this.thread = new Mesh(this.geometry, this.material);
    this.thread.frustumCulled = false;
    this.thread.layers.set(LAYER.VFX);
    this.group.add(this.thread);
    this.motesGeo = frostDust();
    this.motesMat = new ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
      uniforms: {
        uLength: { value: 1 },
        uTime: { value: 0 },
        uFade: { value: 1 },
      },
      vertexShader: `uniform float uLength,uTime;varying float vA;void main(){vec3 p=position;p.z=p.x*uLength;p.x=p.z*0.0+position.z*.8+sin(uTime*2.+position.y*20.)*.12;p.y=.3+mod(position.y*2.+uTime*.35,2.);vA=1.-position.x;vec4 mv=modelViewMatrix*vec4(p,1.);gl_PointSize=clamp(14./max(1.,-mv.z),1.,5.);gl_Position=projectionMatrix*mv;}`,
      fragmentShader: `varying float vA;uniform float uFade;void main(){float a=(1.-smoothstep(0.,.5,length(gl_PointCoord-.5)))*uFade;gl_FragColor=vec4(.45,.85,1.,a*vA);}`,
    });
    this.motes = new Points(this.motesGeo, this.motesMat);
    this.motes.layers.set(LAYER.VFX);
    this.group.add(this.motes);
    this.statueMaterial = new MeshStandardMaterial({
      color: 0x84d9ff,
      emissive: 0x12517a,
      emissiveIntensity: 0.8,
      roughness: 0.22,
      metalness: 0.1,
      transparent: true,
      opacity: 0.78,
    });
    this.hit = new Set();
    this.pending = [];
    this.frozen = [];
    this.found = [];
    this._position = new Vector3();
  }
  createParticles() {}
  onSpawn() {
    this.prevFront = 0;
    this.hit.clear();
    this.pending.length = 0;
    this.frozen.length = 0;
    this._redraw(0);
    this.motes.position.copy(this.origin);
    this.motes.rotation.y = Math.atan2(this.direction.x, this.direction.z);
    this.motesMat.uniforms.uLength.value = this.length;
  }
  _redraw(front) {
    const arr = this.geometry.attributes.position;
    for (let i = 0; i <= N; i++) {
      const u = i / N,
        d = Math.min(front, u * this.length),
        wave = Math.sin(u * 31 - this.age * 5) * 0.08,
        height = 0.32 + Math.sin(u * Math.PI) * 0.45;
      const x = this.origin.x + this.direction.x * d + this.side.x * wave,
        z = this.origin.z + this.direction.z * d + this.side.z * wave,
        w = this.config.width * (0.4 + 0.6 * Math.sin(u * Math.PI));
      arr.setXYZ(i * 2, x - this.side.x * w, height, z - this.side.z * w);
      arr.setXYZ(i * 2 + 1, x + this.side.x * w, height, z + this.side.z * w);
    }
    arr.needsUpdate = true;
    this.material.uniforms.uTime.value = this.age;
    this.motesMat.uniforms.uTime.value = this.age;
  }
  _scan(from, to) {
    if (!this.ctx.dummies?.findTargets) return;
    const midpoint = (from + to) / 2;
    this.pointAt(midpoint / this.length, this._position);
    const found = this.ctx.dummies.findTargets(
      this._position.x,
      this._position.z,
      Math.hypot((to - from) / 2, this.config.reach),
      this.found,
    );
    for (const d of found) {
      if (this.hit.has(d)) continue;
      const x = d.position.x - this.origin.x,
        z = d.position.z - this.origin.z,
        along = x * this.direction.x + z * this.direction.z,
        side = Math.abs(x * this.side.x + z * this.side.z);
      if (along >= from && along <= to && side <= this.config.reach) {
        this.hit.add(d);
        this.pending.push({
          dummy: d,
          time: this.age + this.config.freezeDelay,
        });
      }
    }
  }
  _flush() {
    for (let i = this.frozen.length - 1; i >= 0; i--) {
      const f = this.frozen[i];
      if (f.until <= this.age) {
        f.dummy.vanish?.();
        this.group.remove(f.figure);
        this.frozen.splice(i, 1);
      }
    }
    for (let i = this.pending.length - 1; i >= 0; i--) {
      if (this.pending[i].time <= this.age) {
        const d = this.pending[i].dummy;
        if (d.root && this.frozen.length < 8 && d.freeze?.()) {
          const figure = cloneSkeleton(d.root);
          figure.visible = true;
          figure.traverse((n) => {
            if (n.isMesh) {
              n.material = this.statueMaterial;
              n.castShadow = false;
              n.layers.set(LAYER.VFX);
            }
          });
          this.group.add(figure);
          this.frozen.push({
            dummy: d,
            figure,
            until: this.age + this.config.freezeDuration,
          });
        }
        this.pending.splice(i, 1);
      }
    }
  }
  onTravel() {
    const before = this.prevFront ?? 0;
    this._scan(before, this.front);
    this.prevFront = this.front;
    this._redraw(this.front);
    this._flush();
  }
  onImpact() {
    this._flush();
  }
  onFade(_dt, t) {
    this._flush();
    this._redraw(this.length);
    const f = t > 1 ? Math.max(0, 2 - t) : 1;
    this.material.uniforms.uFade.value = f;
    this.motesMat.uniforms.uFade.value = f;
  }
  onDestroy() {
    for (const f of this.frozen) {
      f.dummy.vanish?.();
      this.group.remove(f.figure);
    }
    this.frozen.length = 0;
    this.hit.clear();
    this.pending.length = 0;
    this.prevFront = 0;
    this.material.uniforms.uFade.value = 1;
    this.motesMat.uniforms.uFade.value = 1;
  }
  dispose() {
    this.onDestroy();
    this.geometry.dispose();
    this.material.dispose();
    this.motesGeo.dispose();
    this.motesMat.dispose();
    this.statueMaterial.dispose();
    super.dispose();
  }
}
export function buildEditor(gui, c, Editor) {
  const f = gui.addFolder("Absolute Zero Thread");
  const R = Editor.range;
  R(f, c, "width", 0.02, 0.5, 0.01, "filament width");
  R(f, c, "reach", 0.1, 3, 0.05, "freeze reach");
  R(f, c, "freezeDelay", 0, 2, 0.05, "freeze delay");
  f.close();
  return f;
}
