import {
  BufferAttribute,
  BufferGeometry,
  Color,
  InstancedMesh,
  Matrix4,
  Mesh,
  PlaneGeometry,
  Points,
  DoubleSide,
  ShaderMaterial,
  Vector3,
} from "three";
import { Ability } from "../../Ability.js";
import { LAYER } from "../../../core/Layers.js";
import { settings } from "../../../config/settings.js";
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
    dustOpacity: 0.7,
    crackWidth: 1.2,
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
function crackMaterial() {
  return new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: DoubleSide,
    uniforms: {
      uTime: { value: 0 },
      uFront: { value: 0 },
      uFade: { value: 1 },
    },
    vertexShader:
      "varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}",
    fragmentShader: `varying vec2 vUv; uniform float uTime,uFront,uFade;
      void main(){float x=vUv.y-.5;float wander=.06*sin(vUv.x*19.)+.025*sin(vUv.x*57.);
      float core=1.-smoothstep(.008,.035,abs(x-wander));
      float branch=pow(max(0.,1.-abs(sin(vUv.x*92.+x*43.))*16.),3.)*(1.-smoothstep(.05,.45,abs(x)));
      float reached=1.-smoothstep(uFront,uFront+.02,vUv.x);float glow=(core+branch*.35)*reached*uFade;
      gl_FragColor=vec4(vec3(.85,.20,.025)*glow,glow*.85);}`,
  });
}
function debrisMaterial() {
  return new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: {
      uTime: { value: 0 },
      uFront: { value: 0 },
      uLength: { value: 1 },
      uSpeed: { value: 1 },
      uFade: { value: 1 },
      uOrigin: { value: new Vector3() },
      uDir: { value: new Vector3() },
      uSide: { value: new Vector3() },
    },
    vertexShader: `attribute float aSeed;uniform float uTime,uFront,uLength,uSpeed;uniform vec3 uOrigin,uDir,uSide;varying float vA;
      void main(){float along=position.x*uLength;float age=max(0.,uTime-along/max(.1,uSpeed));
      vec3 p=uOrigin+uDir*along+uSide*(position.z+sin(aSeed*41.)*age*1.6);p.y=.12+age*(3.2+aSeed*2.)-age*age*4.;
      vA=step(along,uFront)*step(0.,p.y)*(1.-smoothstep(.3,1.2,age));vec4 mv=modelViewMatrix*vec4(p,1.);gl_PointSize=clamp((8.+aSeed*12.)/max(1.,-mv.z),1.,7.);gl_Position=projectionMatrix*mv;}`,
    fragmentShader: `uniform float uFade;varying float vA;void main(){float edge=1.-smoothstep(.25,.5,length(gl_PointCoord-.5));gl_FragColor=vec4(vec3(.55,.32,.18),edge*vA*uFade);}`,
  });
}
function rockMaterial() {
  return new ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uFade: { value: 1 } },
    vertexShader:
      "varying vec3 vP;varying vec3 vN;void main(){vP=position;vN=normalize(normalMatrix*normal);gl_Position=projectionMatrix*modelViewMatrix*instanceMatrix*vec4(position,1.);}",
    fragmentShader: `varying vec3 vP,vN;uniform float uTime,uFade;float h(vec3 p){return fract(sin(dot(p,vec3(23.1,67.9,11.5)))*43758.5);}void main(){float grit=h(floor(vP*22.));float strata=.5+.5*sin(vP.y*34.+sin(vP.x*6.)*1.4);float crack=pow(max(0.,1.-abs(sin(vP.x*17.+vP.z*13.+vP.y*8.))*9.),3.);float light=.35+.65*max(0.,dot(normalize(vN),normalize(vec3(.4,.8,.3))));vec3 c=mix(vec3(.17,.085,.045),vec3(.5,.29,.15),grit*.36+strata*.3)*light+vec3(.5,.12,.015)*crack;gl_FragColor=vec4(c,uFade);}`,
    transparent: true,
    depthWrite: false,
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
    this.crackGeometry = new PlaneGeometry(1, 1);
    this.crackMaterial = crackMaterial();
    this.crack = new Mesh(this.crackGeometry, this.crackMaterial);
    this.crack.layers.set(LAYER.VFX);
    this.group.add(this.crack);
    const particles = new Float32Array(96 * 3),
      seeds = new Float32Array(96);
    for (let i = 0; i < 96; i++) {
      particles[i * 3] = (i % 32) / 31;
      particles[i * 3 + 2] = Math.sin(i * 9.37) * 0.6;
      seeds[i] = ((i * 37) % 97) / 97;
    }
    this.debrisGeometry = new BufferGeometry();
    this.debrisGeometry.setAttribute(
      "position",
      new BufferAttribute(particles, 3),
    );
    this.debrisGeometry.setAttribute("aSeed", new BufferAttribute(seeds, 1));
    this.debrisMaterial = debrisMaterial();
    this.debris = new Points(this.debrisGeometry, this.debrisMaterial);
    this.debris.layers.set(LAYER.VFX);
    this.debris.frustumCulled = false;
    this.group.add(this.debris);
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
    this.crack.visible = true;
    this.debris.visible = true;
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
        sy =
          this.config.height * 0.5 * (0.7 + 0.3 * Math.cos(i * 8.3)) * emerge;
      this.m.makeScale(sx, sy, sx);
      this.m.setPosition(this.p.x, 0, this.p.z);
      this.columns.setMatrixAt(i, this.m);
    }
    this.columns.instanceMatrix.needsUpdate = true;
    this.mat.uniforms.uTime.value = this.age;
    this.mat.uniforms.uFade.value = fade;
    this.crack.position
      .copy(this.origin)
      .addScaledVector(this.direction, this.length / 2);
    this.crack.position.y = 0.045;
    this.crack.rotation.set(
      -Math.PI / 2,
      0,
      -Math.atan2(this.direction.z, this.direction.x),
    );
    this.crack.scale.set(this.length, this.config.crackWidth * 2, 1);
    this.crackMaterial.uniforms.uTime.value = this.age;
    this.crackMaterial.uniforms.uFront.value = Math.min(1, front / this.length);
    this.crackMaterial.uniforms.uFade.value = fade;
    const du = this.debrisMaterial.uniforms;
    du.uOrigin.value.copy(this.origin);
    du.uDir.value.copy(this.direction);
    du.uSide.value.copy(this.side);
    du.uTime.value = this.age;
    du.uLength.value = this.length;
    du.uSpeed.value = this.config.speed * settings.global.speed;
    du.uFront.value = front;
    du.uFade.value = fade * this.config.dustOpacity;
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
    const front = Math.min(this.length, this.front);
    this._hit(this.prev, front);
    this.prev = front;
    this._draw(front, 1);
  }
  onImpact() {
    this.ctx.shake?.add?.(0.18, 5, 18);
  }
  onFade(_dt, t) {
    this._draw(this.length, t > 1 ? 2 - t : 1);
  }
  onDestroy() {
    this.hit.clear();
    this.columns.count = 0;
    this.crack.visible = false;
    this.debris.visible = false;
  }
  dispose() {
    this.geo.dispose();
    this.mat.dispose();
    this.crackGeometry.dispose();
    this.crackMaterial.dispose();
    this.debrisGeometry.dispose();
    this.debrisMaterial.dispose();
    super.dispose();
  }
}
export function buildEditor(gui, c, Editor) {
  const f = gui.addFolder("Faultwake Bastion"),
    R = Editor.range;
  R(f, c, "columns", 3, 16, 1, "column count");
  R(f, c, "columnWidth", 0.1, 2, 0.05, "column width");
  R(f, c, "height", 0.5, 4, 0.1, "height");
  R(f, c, "reach", 0.3, 3, 0.05, "hit reach");
  R(f, c, "impulse", 0, 15, 0.1, "eruption force");
  R(f, c, "lift", 0, 8, 0.1, "eruption lift");
  R(f, c, "dustOpacity", 0, 1, 0.01, "dust opacity");
  R(f, c, "crackWidth", 0.1, 3, 0.05, "fissure width");
  f.close();
  return f;
}
