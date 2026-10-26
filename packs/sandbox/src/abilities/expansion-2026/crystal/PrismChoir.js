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
export const ID = "prism-choir",
  UID = "matrix-expansion/prism-choir";
export const CONFIG = Object.freeze({
  id: ID,
  meta: {
    label: "Prism Choir",
    accent: "#e2d2ff",
    element: "crystal",
    key: "",
    cast: "line",
    hint: "A crystalline lance splits into three diverging shards at the end of its course.",
    glyph: '<path d="M50 5L25 50L50 95L75 50Z"/><path d="M50 5V95M25 50H75"/>',
  },
  settings: {
    range: 20,
    minRange: 2,
    speed: 20,
    lifetime: 1.2,
    cooldown: 4,
    castAnim: "cast1",
    lightColor: "#d2b6ff",
    lightIntensity: 6,
    lightRadius: 8,
    size: 0.65,
    splitDistance: 5,
    splitDuration: 0.9,
    reach: 0.8,
    impulse: 4,
    lift: 1.5,
  },
});
function crystalGeo() {
  const coords = [
      0, 1.3, 0, -0.6, 0, 0.36, 0, 0, 0.65, 0.6, 0, 0.36, 0.6, 0, -0.36, 0, 0,
      -0.65, -0.6, 0, -0.36, 0, -1.1, 0,
    ],
    faces = [];
  for (let i = 1; i <= 6; i++) {
    const next = i === 6 ? 1 : i + 1;
    faces.push(0, i, next, 7, next, i);
  }
  const g = new BufferGeometry();
  g.setAttribute("position", new BufferAttribute(new Float32Array(coords), 3));
  g.setIndex(faces);
  g.computeVertexNormals();
  return g;
}
function prismMat() {
  return new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: DoubleSide,
    uniforms: { uTime: { value: 0 }, uFade: { value: 1 } },
    vertexShader:
      "varying vec3 vN,vP;void main(){vP=position;vN=normalize(normalMatrix*normal);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}",
    fragmentShader: `varying vec3 vN,vP;uniform float uTime,uFade;void main(){float rim=pow(1.-abs(vN.z),2.);float stripe=pow(max(0.,sin(vP.y*16.+uTime*4.+vP.x*9.)),8.);vec3 a=vec3(.15,.17,.55),b=vec3(.9,.5,1.),c=vec3(.5,.95,1.);vec3 col=mix(a,b,.5+.5*sin(vP.y*4.+uTime));col=mix(col,c,clamp(rim+stripe*.4,0.,1.));gl_FragColor=vec4(col*(1.+rim),uFade*(.35+rim*.5));}`,
  });
}
function trailGeo() {
  const g = new BufferGeometry(),
    p = new Float32Array(4 * 3);
  g.setAttribute("position", new BufferAttribute(p, 3));
  g.setAttribute(
    "uv",
    new BufferAttribute(new Float32Array([0, 0, 0, 1, 1, 0, 1, 1]), 2),
  );
  g.setIndex([0, 1, 2, 1, 3, 2]);
  return g;
}
function trailMat() {
  return new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: DoubleSide,
    blending: AdditiveBlending,
    uniforms: { uFade: { value: 1 } },
    vertexShader:
      "varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}",
    fragmentShader:
      "varying vec2 vUv;uniform float uFade;void main(){float a=pow(max(0.,1.-abs(vUv.y-.5)*2.),2.)*(1.-vUv.x)*uFade;gl_FragColor=vec4(.48,.7,1.,a);}",
  });
}
export class PrismChoirAbility extends Ability {
  constructor(ctx) {
    super(ID, ctx);
  }
  get handlesOwnHits() {
    return true;
  }
  get impactDuration() {
    return Math.max(0.1, this.config.splitDuration);
  }
  get fadeDuration() {
    return Math.max(0.2, this.config.lifetime);
  }
  createShaders() {
    this.geo = crystalGeo();
    this.mat = prismMat();
    this.trailGeo = trailGeo();
    this.trailMat = trailMat();
    this.primary = new Mesh(this.geo, this.mat);
    this.primary.layers.set(LAYER.VFX);
    this.group.add(this.primary);
    this.shards = [];
    this.trails = [];
    for (let i = 0; i < 3; i++) {
      const shard = new Mesh(this.geo, this.mat),
        trail = new Mesh(this.trailGeo, this.trailMat);
      shard.layers.set(LAYER.VFX);
      trail.layers.set(LAYER.VFX);
      this.group.add(shard, trail);
      this.shards.push(shard);
      this.trails.push(trail);
    }
    this.hit = new Set();
    this.found = [];
    this.tmp = new Vector3();
    this.splitOrigin = new Vector3();
    this.splitStart = new Vector3();
    this.splitEnd = new Vector3();
    this.splitPrevious = 0;
  }
  createParticles() {}
  onSpawn() {
    this.hit.clear();
    this.prev = 0;
    this.primary.visible = true;
    for (const s of this.shards) s.visible = false;
    for (const t of this.trails) t.visible = false;
    this.mat.uniforms.uFade.value = 1;
    this.trailMat.uniforms.uFade.value = 1;
    this._drawPrimary(0);
  }
  _drawPrimary(d) {
    this.pointAt(Math.min(1, d / this.length), this.tmp);
    this.primary.position.copy(this.tmp);
    this.primary.position.y = 1.0;
    this.primary.rotation.set(
      Math.PI / 2,
      this.age * 2,
      Math.atan2(this.direction.x, this.direction.z),
    );
    this.primary.scale.setScalar(this.config.size);
    this.mat.uniforms.uTime.value = this.age;
    this.position.copy(this.tmp);
  }
  _hitShape(position, r) {
    const found =
      this.ctx.dummies?.findTargets?.(position.x, position.z, r, this.found) ??
      [];
    for (const d of found) {
      if (this.hit.has(d)) continue;
      const dx = d.position.x - position.x,
        dz = d.position.z - position.z;
      if (dx * dx + dz * dz > r * r) continue;
      this.hit.add(d);
      d.kill?.(
        this.direction.x,
        this.direction.z,
        { impulse: this.config.impulse, lift: this.config.lift, spin: 0.5 },
        false,
      );
    }
  }
  onTravel() {
    const begin = this.prev,
      end = Math.min(this.length, this.front),
      step = Math.max(0.15, this.config.reach * 0.6);
    for (let d = begin; d <= end; d += step) {
      this.pointAt(Math.min(1, d / this.length), this.tmp);
      this._hitShape(this.tmp, this.config.reach);
    }
    this.prev = end;
    this._drawPrimary(end);
  }
  onImpact() {
    this.splitPrevious = 0;
    this.pointAt(1, this.splitOrigin);
    this.primary.visible = false;
    for (const s of this.shards) s.visible = true;
    for (const t of this.trails) t.visible = true;
  }
  _hitSegment(a, b) {
    const cx = (a.x + b.x) / 2,
      cz = (a.z + b.z) / 2,
      dx = b.x - a.x,
      dz = b.z - a.z,
      len = dx * dx + dz * dz,
      r = this.config.reach;
    const found =
      this.ctx.dummies?.findTargets?.(
        cx,
        cz,
        Math.sqrt(len) / 2 + r,
        this.found,
      ) ?? [];
    for (const target of found) {
      if (this.hit.has(target)) continue;
      const px = target.position.x - a.x,
        pz = target.position.z - a.z,
        u =
          len > 1e-9 ? Math.max(0, Math.min(1, (px * dx + pz * dz) / len)) : 0,
        ex = px - u * dx,
        ez = pz - u * dz;
      if (ex * ex + ez * ez > r * r) continue;
      this.hit.add(target);
      target.kill?.(
        this.direction.x,
        this.direction.z,
        { impulse: this.config.impulse, lift: this.config.lift, spin: 0.5 },
        false,
      );
    }
  }
  onFade(_dt, t) {
    if (t <= 1) {
      for (let i = 0; i < 3; i++) {
        const angle = (i - 1) * 0.52,
          dx =
            this.direction.x * Math.cos(angle) + this.side.x * Math.sin(angle),
          dz =
            this.direction.z * Math.cos(angle) + this.side.z * Math.sin(angle),
          d = this.config.splitDistance * t;
        this.tmp.set(
          this.splitOrigin.x + dx * d,
          0,
          this.splitOrigin.z + dz * d,
        );
        const s = this.shards[i];
        s.position.set(this.tmp.x, 1, this.tmp.z);
        s.scale.setScalar(this.config.size * 0.7);
        s.rotation.set(Math.PI / 2, this.age * 3 + i, angle);
        this.splitStart.set(
          this.splitOrigin.x + dx * this.splitPrevious,
          0,
          this.splitOrigin.z + dz * this.splitPrevious,
        );
        this.splitEnd.copy(this.tmp);
        this._hitSegment(this.splitStart, this.splitEnd);
        const a = this.trailGeo.attributes.position;
        a.setXYZ(0, -0.08, 0, 0);
        a.setXYZ(1, 0.08, 0, 0);
        a.setXYZ(2, -0.08, 0, 1);
        a.setXYZ(3, 0.08, 0, 1);
        a.needsUpdate = true;
        const trail = this.trails[i];
        trail.position.copy(this.splitOrigin);
        trail.position.y = 0.9;
        trail.rotation.y = Math.atan2(dx, dz);
        trail.scale.set(1, 1, Math.max(0.001, d));
      }
      this.splitPrevious = this.config.splitDistance * t;
    } else {
      this.mat.uniforms.uFade.value = 2 - t;
      this.trailMat.uniforms.uFade.value = 2 - t;
    }
    this.mat.uniforms.uTime.value = this.age;
  }
  onDestroy() {
    this.hit.clear();
    this.primary.visible = false;
    for (const s of this.shards) s.visible = false;
    for (const t of this.trails) t.visible = false;
  }
  dispose() {
    this.geo.dispose();
    this.mat.dispose();
    this.trailGeo.dispose();
    this.trailMat.dispose();
    super.dispose();
  }
}
export function buildEditor(gui, c, Editor) {
  const f = gui.addFolder("Prism Choir"),
    R = Editor.range;
  R(f, c, "size", 0.2, 2, 0.05, "crystal size");
  R(f, c, "splitDistance", 1, 12, 0.1, "split reach");
  R(f, c, "splitDuration", 0.2, 3, 0.05, "split time");
  f.close();
  return f;
}
