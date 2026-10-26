import {
  BufferAttribute,
  BufferGeometry,
  Color,
  InstancedMesh,
  Matrix4,
  ShaderMaterial,
  Vector3,
} from "three";
import { Ability } from "../../Ability.js";
import { LAYER } from "../../../core/Layers.js";
export const ID = "faultwake-bastion",
  UID = "matrix-expansion/faultwake-bastion";
export const CONFIG = Object.freeze({
  id: ID,
  meta: {
    label: "Faultwake Bastion",
    accent: "#d5a077",
    element: "earth",
    key: "",
    cast: "line",
    hint: "An advancing chain of fractured rock columns erupts and scatters enemies.",
    glyph: '<path d="M8 80L18 40L30 70L43 17L56 71L72 35L91 80Z"/>',
  },
  settings: {
    range: 18,
    minRange: 2,
    speed: 14,
    lifetime: 2.3,
    cooldown: 4,
    castAnim: "cast3",
    lightColor: "#ca8753",
    lightIntensity: 4,
    lightRadius: 8,
    columns: 10,
    columnWidth: 0.65,
    height: 2.2,
    reach: 1.3,
    impulse: 5,
    lift: 2.2,
  },
});
function rockGeometry() {
  const pos = [],
    idx = [];
  const seg = 12,
    rows = 8;
  for (let y = 0; y <= rows; y++)
    for (let i = 0; i <= seg; i++) {
      const t = y / rows,
        a = (i / seg) * Math.PI * 2,
        rad =
          (1 - 0.52 * t) *
          (1 +
            0.13 * Math.sin(i * 7.1 + y * 2.2) +
            0.07 * Math.cos(i * 4.3 - y * 1.7));
      pos.push(Math.cos(a) * rad, t * 2, Math.sin(a) * rad);
      if (y < rows && i < seg) {
        const n = y * (seg + 1) + i;
        idx.push(n, n + 1, n + seg + 1, n + 1, n + seg + 2, n + seg + 1);
      }
    }
  const g = new BufferGeometry();
  g.setAttribute("position", new BufferAttribute(new Float32Array(pos), 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}
function rockMaterial() {
  return new ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uFade: { value: 1 } },
    vertexShader:
      "varying vec3 vP;varying vec3 vN;void main(){vP=position;vN=normalize(normalMatrix*normal);gl_Position=projectionMatrix*modelViewMatrix*instanceMatrix*vec4(position,1.);}",
    fragmentShader: `varying vec3 vP,vN;uniform float uTime,uFade;float h(vec3 p){return fract(sin(dot(p,vec3(23.1,67.9,11.5)))*43758.5);}void main(){float grit=h(floor(vP*22.));float strata=.5+.5*sin(vP.y*34.+sin(vP.x*6.)*1.4);float crack=pow(max(0.,1.-abs(sin(vP.x*17.+vP.z*13.+vP.y*8.))*9.),3.);float light=.35+.65*max(0.,dot(normalize(vN),normalize(vec3(.4,.8,.3))));vec3 c=mix(vec3(.17,.085,.045),vec3(.5,.29,.15),grit*.36+strata*.3)*light+vec3(.5,.12,.015)*crack;gl_FragColor=vec4(c,uFade);}`,
    transparent: true,
  });
}
export class FaultwakeBastionAbility extends Ability {
  constructor(ctx) {
    super(ID, ctx);
  }
  get handlesOwnHits() {
    return true;
  }
  get impactDuration() {
    return 0.45;
  }
  get fadeDuration() {
    return Math.max(0.2, this.config.lifetime);
  }
  createShaders() {
    this.geo = rockGeometry();
    this.mat = rockMaterial();
    this.columns = new InstancedMesh(this.geo, this.mat, 16);
    this.columns.layers.set(LAYER.VFX);
    this.columns.frustumCulled = false;
    this.group.add(this.columns);
    this.m = new Matrix4();
    this.p = new Vector3();
    this.found = [];
    this.hit = new Set();
    this.prev = 0;
  }
  createParticles() {}
  onSpawn() {
    this.prev = 0;
    this.hit.clear();
    this.mat.uniforms.uFade.value = 1;
    this._draw(0, 1);
  }
  _draw(front, fade) {
    const n = Math.max(1, Math.min(16, Math.round(this.config.columns)));
    this.columns.count = n;
    for (let i = 0; i < n; i++) {
      const d = (this.length * (i + 1)) / n,
        emerge = Math.max(0.001, Math.min(1, (front - d + 1) / 1)),
        jitter = Math.sin(i * 12.9) * 0.24;
      this.p
        .copy(this.origin)
        .addScaledVector(this.direction, d)
        .addScaledVector(this.side, jitter);
      const sx = this.config.columnWidth * (0.8 + 0.2 * Math.sin(i * 5.1)),
        sy = this.config.height * (0.7 + 0.3 * Math.cos(i * 8.3)) * emerge;
      this.m.makeScale(sx, sy, sx);
      this.m.setPosition(this.p.x, 0, this.p.z);
      this.columns.setMatrixAt(i, this.m);
    }
    this.columns.instanceMatrix.needsUpdate = true;
    this.mat.uniforms.uTime.value = this.age;
    this.mat.uniforms.uFade.value = fade;
  }
  _hit(from, to) {
    if (!this.ctx.dummies?.findTargets) return;
    this.pointAt((from + to) / (2 * this.length), this.p);
    const targets = this.ctx.dummies.findTargets(
      this.p.x,
      this.p.z,
      Math.hypot((to - from) / 2, this.config.reach),
      this.found,
    );
    for (const d of targets) {
      if (this.hit.has(d)) continue;
      const x = d.position.x - this.origin.x,
        z = d.position.z - this.origin.z,
        along = x * this.direction.x + z * this.direction.z,
        lat = Math.abs(x * this.side.x + z * this.side.z);
      if (along < from - 0.3 || along > to + 0.3 || lat > this.config.reach)
        continue;
      this.hit.add(d);
      d.kill?.(
        this.direction.x,
        this.direction.z,
        { impulse: this.config.impulse, lift: this.config.lift, spin: 0.6 },
        false,
      );
    }
  }
  onTravel() {
    this._hit(this.prev, this.front);
    this.prev = this.front;
    this._draw(this.front, 1);
  }
  onImpact() {}
  onFade(_dt, t) {
    this._draw(this.length, t > 1 ? 2 - t : 1);
  }
  onDestroy() {
    this.hit.clear();
    this.columns.count = 0;
  }
  dispose() {
    this.geo.dispose();
    this.mat.dispose();
    super.dispose();
  }
}
export function buildEditor(gui, c, Editor) {
  const f = gui.addFolder("Faultwake Bastion"),
    R = Editor.range;
  R(f, c, "columns", 3, 16, 1, "column count");
  R(f, c, "height", 0.5, 4, 0.1, "height");
  R(f, c, "reach", 0.3, 3, 0.05, "hit reach");
  f.close();
  return f;
}
