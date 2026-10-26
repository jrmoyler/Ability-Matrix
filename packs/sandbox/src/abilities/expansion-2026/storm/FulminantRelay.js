import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  DoubleSide,
  IcosahedronGeometry,
  Mesh,
  Points,
  ShaderMaterial,
  SphereGeometry,
  TorusGeometry,
  Vector3,
} from "three";
import { Ability } from "../../Ability.js";
import { LAYER } from "../../../core/Layers.js";
import { settings } from "../../../config/settings.js";

export const ID = "fulminant-relay";
export const UID = "matrix-expansion/fulminant-relay";
export const CONFIG = Object.freeze({
  id: ID,
  meta: {
    label: "Fulminant Relay",
    accent: "#9ac8ff",
    element: "storm",
    key: "",
    cast: "line",
    hint: "Launch a charged seed that jumps between nearby targets in a staggered chain.",
    glyph:
      '<path d="M55 5L25 52H48L38 95L75 42H52Z"/><circle cx="76" cy="72" r="8"/>',
  },
  settings: {
    range: 20,
    minRange: 2,
    speed: 18,
    lifetime: 0.8,
    cooldown: 4,
    castAnim: "cast1",
    lightColor: "#a6caff",
    lightIntensity: 7,
    lightRadius: 9,
    size: 0.7,
    chainRadius: 5,
    maxJumps: 4,
    jumpInterval: 0.22,
    impulse: 5,
    lift: 2.2,
    impactFlash: 0.1,
    impactShake: 0.1,
    arcLifetime: 0.55,
    branchLength: 0.8,
  },
});
const SECTIONS = 24,
  MAX_JUMPS = 8;
function arcGeometry() {
  const geo = new BufferGeometry(),
    vertices = new Float32Array((SECTIONS + 1) * 2 * 3),
    uvs = new Float32Array((SECTIONS + 1) * 2 * 2),
    indices = [];
  for (let i = 0; i <= SECTIONS; i++) {
    uvs.set([i / SECTIONS, 0, i / SECTIONS, 1], i * 4);
    if (i < SECTIONS) {
      const j = i * 2;
      indices.push(j, j + 1, j + 2, j + 1, j + 3, j + 2);
    }
  }
  geo.setAttribute("position", new BufferAttribute(vertices, 3));
  geo.setAttribute("uv", new BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  return geo;
}
function glowMaterial(color, intensity = 1) {
  return new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
    side: DoubleSide,
    uniforms: {
      uTime: { value: 0 },
      uFade: { value: 1 },
      uColor: { value: color },
      uIntensity: { value: intensity },
    },
    vertexShader:
      "varying vec3 vN,vP;void main(){vN=normalize(normalMatrix*normal);vP=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}",
    fragmentShader:
      "varying vec3 vN,vP;uniform float uTime,uFade,uIntensity;uniform vec3 uColor;void main(){float rim=pow(1.-abs(vN.z),2.);float bands=pow(max(0.,sin(vP.y*18.+vP.x*11.-uTime*9.)),8.);vec3 c=uColor*(.55+rim*1.8+bands*.7)*uIntensity;gl_FragColor=vec4(c,uFade*(.25+rim*.55+bands*.2));}",
  });
}
function boltMaterial() {
  return new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
    side: DoubleSide,
    uniforms: { uFade: { value: 1 } },
    vertexShader:
      "varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}",
    fragmentShader:
      "varying vec2 vUv;uniform float uFade;void main(){float core=pow(max(0.,1.-abs(vUv.y-.5)*2.),2.);float ends=sin(vUv.x*3.14159265);gl_FragColor=vec4(mix(vec3(.12,.4,1.),vec3(.9,.98,1.),core),uFade*core*ends);}",
  });
}
export class FulminantRelayAbility extends Ability {
  constructor(ctx) {
    super(ID, ctx);
  }
  get handlesOwnHits() {
    return true;
  }
  get impactDuration() {
    return Math.max(
      0.3,
      Math.min(MAX_JUMPS, this.config.maxJumps) * this.config.jumpInterval +
        0.3,
    );
  }
  get fadeDuration() {
    return Math.max(0.2, this.config.lifetime);
  }
  createShaders() {
    this.coreGeometry = new IcosahedronGeometry(1, 2);
    this.coreMaterial = glowMaterial(new Vector3(0.23, 0.55, 1), 1.3);
    this.core = new Mesh(this.coreGeometry, this.coreMaterial);
    this.core.layers.set(LAYER.VFX);
    this.group.add(this.core);
    this.shellGeometry = new SphereGeometry(1.45, 28, 16);
    this.shellMaterial = glowMaterial(new Vector3(0.14, 0.38, 1), 0.6);
    this.shell = new Mesh(this.shellGeometry, this.shellMaterial);
    this.shell.layers.set(LAYER.VFX);
    this.group.add(this.shell);
    this.ringGeometry = new TorusGeometry(1.1, 0.025, 6, 48);
    this.ringMaterial = glowMaterial(new Vector3(0.35, 0.7, 1));
    this.rings = Array.from({ length: 3 }, (_, i) => {
      const ring = new Mesh(this.ringGeometry, this.ringMaterial);
      ring.layers.set(LAYER.VFX);
      ring.rotation.set(i * 1.1, i * 0.8, i * 0.5);
      this.group.add(ring);
      return ring;
    });
    this.arcs = Array.from({ length: MAX_JUMPS }, () => {
      const arc = new Mesh(arcGeometry(), boltMaterial());
      arc.layers.set(LAYER.VFX);
      arc.frustumCulled = false;
      arc.visible = false;
      this.group.add(arc);
      return arc;
    });
    this.branches = this.arcs.map((arc) => {
      const branch = new Mesh(arcGeometry(), arc.material);
      branch.layers.set(LAYER.VFX);
      branch.frustumCulled = false;
      branch.visible = false;
      this.group.add(branch);
      return branch;
    });
    this.branchStart = new Vector3();
    this.branchEnd = new Vector3();
    this.hit = new Set();
    this.found = [];
    this.hops = [];
    this.anchor = new Vector3();
    this.targetPoint = new Vector3();
    this.tmp = new Vector3();
    this.nextJump = 0;
  }
  createParticles() {
    const positions = new Float32Array(72 * 3),
      seeds = new Float32Array(72);
    for (let i = 0; i < 72; i++) {
      const a = i * 2.399963,
        y = 1 - (2 * (i + 0.5)) / 72,
        r = Math.sqrt(1 - y * y);
      positions.set([Math.cos(a) * r, y, Math.sin(a) * r], i * 3);
      seeds[i] = (i * 0.6180339) % 1;
    }
    this.sparkGeometry = new BufferGeometry();
    this.sparkGeometry.setAttribute(
      "position",
      new BufferAttribute(positions, 3),
    );
    this.sparkGeometry.setAttribute("seed", new BufferAttribute(seeds, 1));
    this.sparkMaterial = new ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
      uniforms: { uTime: { value: 0 }, uFade: { value: 1 } },
      vertexShader:
        "attribute float seed;uniform float uTime;varying float vA;void main(){float p=fract(seed+uTime*.6);vec3 q=position*(1.+p*2.);vA=1.-p;vec4 mv=modelViewMatrix*vec4(q,1.);gl_PointSize=clamp(20./-mv.z,1.,6.);gl_Position=projectionMatrix*mv;}",
      fragmentShader:
        "varying float vA;uniform float uFade;void main(){float d=length(gl_PointCoord-.5)*2.;gl_FragColor=vec4(.55,.8,1.,(1.-smoothstep(.2,1.,d))*vA*uFade);}",
    });
    this.sparks = new Points(this.sparkGeometry, this.sparkMaterial);
    this.sparks.layers.set(LAYER.VFX);
    this.sparks.frustumCulled = false;
    this.group.add(this.sparks);
  }
  onSpawn() {
    this.hit.clear();
    this.hops.length = 0;
    this.nextJump = 0;
    this.anchor.copy(this.origin);
    for (const a of this.arcs) a.visible = false;
    for (const b of this.branches) b.visible = false;
    for (const m of [
      this.coreMaterial,
      this.shellMaterial,
      this.ringMaterial,
      this.sparkMaterial,
    ])
      m.uniforms.uFade.value = 1;
    this._draw();
  }
  _draw() {
    this.core.position.copy(this.anchor);
    this.core.position.y = 1.1;
    this.core.scale.setScalar(this.config.size);
    this.core.rotation.set(this.age * 0.9, this.age * 1.4, this.age * 0.6);
    this.shell.position.copy(this.core.position);
    this.shell.scale.setScalar(this.config.size);
    this.shell.rotation.y = -this.age * 0.5;
    for (let i = 0; i < this.rings.length; i++) {
      const ring = this.rings[i];
      ring.position.copy(this.core.position);
      ring.scale.setScalar(this.config.size);
      ring.rotation.x = this.age * (0.8 + i * 0.2) + i;
      ring.rotation.y = this.age * (0.5 + i * 0.2) + i;
    }
    this.sparks.position.copy(this.core.position);
    this.sparks.scale.setScalar(this.config.size);
    for (const m of [this.coreMaterial, this.shellMaterial, this.ringMaterial])
      m.uniforms.uTime.value = this.age;
    this.sparkMaterial.uniforms.uTime.value = this.age;
    for (let i = 0; i < this.hops.length; i++) {
      const hop = this.hops[i],
        arc = this.arcs[i];
      const opacity = Math.max(
        0,
        1 - (this.age - hop.time) / Math.max(0.1, this.config.arcLifetime),
      );
      arc.visible = opacity > 0;
      arc.material.uniforms.uFade.value = opacity;
      const branch = this.branches[i];
      branch.visible = arc.visible && this.config.branchLength > 0;
      if (arc.visible) {
        this._writeArc(arc, hop.from, hop.to, i);
        if (branch.visible) this._writeBranch(i, hop, arc, branch);
      }
    }
    this.position.copy(this.anchor);
  }
  onTravel() {
    this.pointAt(this.u, this.anchor);
    this._draw();
  }
  onImpact() {
    this.nextJump = 0;
    this.ctx.shake?.add?.(
      this.config.impactShake * settings.global.cameraShake,
      7,
      22,
    );
    this.ctx.flash?.trigger?.(
      this.lightColor.set(this.config.lightColor),
      this.config.impactFlash * settings.global.explosionIntensity,
    );
  }
  _jump() {
    const found =
      this.ctx.dummies?.findTargets?.(
        this.anchor.x,
        this.anchor.z,
        this.config.chainRadius,
        this.found,
      ) ?? [];
    let best = null,
      bestD = Infinity;
    for (const d of found) {
      if (this.hit.has(d) || d.alive === false) continue;
      const dx = d.position.x - this.anchor.x,
        dz = d.position.z - this.anchor.z,
        dist = dx * dx + dz * dz;
      if (dist <= this.config.chainRadius ** 2 && dist < bestD) {
        best = d;
        bestD = dist;
      }
    }
    if (!best) return false;
    this.hit.add(best);
    this.targetPoint.copy(best.position);
    const dx = this.targetPoint.x - this.anchor.x,
      dz = this.targetPoint.z - this.anchor.z,
      len = Math.hypot(dx, dz);
    const dirX = len > 1e-5 ? dx / len : this.direction.x,
      dirZ = len > 1e-5 ? dz / len : this.direction.z;
    const arc = this.arcs[this.hops.length];
    this._writeArc(arc, this.anchor, this.targetPoint, this.hops.length);
    arc.visible = true;
    this.hops.push({
      from: this.anchor.clone(),
      to: this.targetPoint.clone(),
      time: this.age,
    });
    best.kill?.(
      dirX,
      dirZ,
      { impulse: this.config.impulse, lift: this.config.lift, spin: 0.8 },
      false,
    );
    this.anchor.copy(this.targetPoint);
    return true;
  }
  _writeBranch(index, hop, arc, branch) {
    const position = arc.geometry.attributes.position,
      middle = SECTIONS;
    this.branchStart.set(
      (position.getX(middle) + position.getX(middle + 1)) * 0.5,
      (position.getY(middle) + position.getY(middle + 1)) * 0.5 - 1.05,
      (position.getZ(middle) + position.getZ(middle + 1)) * 0.5,
    );
    let dx = hop.to.x - hop.from.x,
      dz = hop.to.z - hop.from.z;
    let len = Math.hypot(dx, dz);
    if (len < 1e-5) {
      dx = this.direction.x;
      dz = this.direction.z;
      len = 1;
    }
    const sign = index % 2 ? 1 : -1;
    this.branchEnd.set(
      this.branchStart.x + sign * (-dz / len) * this.config.branchLength,
      this.branchStart.y - 0.2,
      this.branchStart.z + sign * (dx / len) * this.config.branchLength,
    );
    this._writeArc(branch, this.branchStart, this.branchEnd, index + 11, 0.04);
  }
  _writeArc(mesh, from, to, index, width = 0.08) {
    const p = mesh.geometry.attributes.position,
      dx = to.x - from.x,
      dz = to.z - from.z,
      len = Math.hypot(dx, dz),
      sx = len > 1e-5 ? -dz / len : 1,
      sz = len > 1e-5 ? dx / len : 0;
    const flicker = Math.floor(this.age * 14);
    for (let i = 0; i <= SECTIONS; i++) {
      const t = i / SECTIONS,
        wave = Math.sin(Math.PI * t),
        jag =
          (Math.sin(i * 7.13 + index * 3.7 + flicker) +
            Math.sin(i * 3.31 + index - flicker * 1.7)) *
          wave *
          0.16,
        x = from.x + dx * t + sx * jag,
        z = from.z + dz * t + sz * jag,
        y =
          1.05 +
          from.y * (1 - t) +
          to.y * t +
          Math.sin(t * Math.PI) * 0.5 +
          Math.sin(i * 4.2 + index) * wave * 0.12;
      p.setXYZ(i * 2, x - sx * width, y, z - sz * width);
      p.setXYZ(i * 2 + 1, x + sx * width, y, z + sz * width);
    }
    p.needsUpdate = true;
  }
  onFade(_dt, t) {
    if (t <= 1) {
      const elapsed = t * this.impactDuration,
        limit = Math.min(
          MAX_JUMPS,
          Math.max(1, Math.floor(this.config.maxJumps)),
        );
      while (this.hops.length < limit && elapsed >= this.nextJump) {
        if (!this._jump()) {
          this.nextJump = Infinity;
          break;
        }
        this.nextJump += Math.max(0.05, this.config.jumpInterval);
      }
    } else {
      const fade = Math.max(0, 2 - t);
      for (const m of [
        this.coreMaterial,
        this.shellMaterial,
        this.ringMaterial,
        this.sparkMaterial,
      ])
        m.uniforms.uFade.value = fade;
    }
    this._draw();
  }
  onDestroy() {
    this.hit.clear();
    this.hops.length = 0;
    for (const a of this.arcs) a.visible = false;
    for (const b of this.branches) b.visible = false;
  }
  dispose() {
    for (const a of this.arcs) {
      a.geometry.dispose();
      a.material.dispose();
    }
    for (const b of this.branches) b.geometry.dispose();
    for (const r of [
      this.coreGeometry,
      this.coreMaterial,
      this.shellGeometry,
      this.shellMaterial,
      this.ringGeometry,
      this.ringMaterial,
      this.sparkGeometry,
      this.sparkMaterial,
    ])
      r.dispose();
    super.dispose();
  }
}
export function buildEditor(gui, c, Editor) {
  const f = gui.addFolder("Fulminant Relay"),
    R = Editor.range;
  R(f, c, "size", 0.2, 2, 0.05, "seed size");
  R(f, c, "chainRadius", 1, 10, 0.1, "jump radius");
  R(f, c, "maxJumps", 1, 8, 1, "maximum jumps");
  R(f, c, "jumpInterval", 0.1, 1, 0.05, "jump interval");
  R(f, c, "arcLifetime", 0.1, 2, 0.05, "arc lifetime");
  R(f, c, "branchLength", 0, 3, 0.05, "branch length");
  R(f, c, "impulse", 0, 15, 0.1, "impact force");
  R(f, c, "lift", 0, 8, 0.1, "impact lift");
  R(f, c, "impactShake", 0, 1, 0.01, "impact shake");
  R(f, c, "impactFlash", 0, 0.5, 0.01, "impact flash");
  f.close();
  return f;
}
