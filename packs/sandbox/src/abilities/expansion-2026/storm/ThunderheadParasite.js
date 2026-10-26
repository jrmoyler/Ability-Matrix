import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  DoubleSide,
  IcosahedronGeometry,
  Mesh,
  ShaderMaterial,
  Vector3,
} from "three";
import { Ability } from "../../Ability.js";
import { LAYER } from "../../../core/Layers.js";
export const ID = "thunderhead-parasite",
  UID = "matrix-expansion/thunderhead-parasite";
export const CONFIG = Object.freeze({
  id: ID,
  meta: {
    label: "Thunderhead Parasite",
    accent: "#a9baff",
    element: "storm",
    key: "",
    cast: "zone",
    hint: "A storm attaches to a target and shocks it when it attacks.",
    glyph:
      '<path d="M20 50Q10 35 30 30Q38 8 55 25Q75 15 80 40Q95 44 85 55H18"/><path d="M56 48L43 68L55 68L43 90"/>',
  },
  settings: {
    range: 18,
    minRange: 0,
    speed: 30,
    lifetime: 0.6,
    cooldown: 7,
    castAnim: "cast2",
    lightColor: "#afa4ff",
    lightIntensity: 5,
    lightRadius: 8,
    attachRadius: 2.5,
    duration: 6,
    retaliation: 0.55,
    reactionCooldown: 0.3,
  },
});
const TAU = Math.PI * 2;
function cloudGeo() {
  const g = new IcosahedronGeometry(1, 3),
    p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i),
      y = p.getY(i),
      z = p.getZ(i),
      n =
        1 +
        0.09 * Math.sin(x * 13 + y * 21 + z * 19) +
        0.05 * Math.sin(x * 37 - z * 23);
    p.setXYZ(i, x * n, y * n * 0.48, z * n);
  }
  g.computeVertexNormals();
  return g;
}
function cloudMat() {
  return new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: DoubleSide,
    uniforms: { uTime: { value: 0 }, uGlow: { value: 0 }, uFade: { value: 1 } },
    vertexShader:
      "varying vec3 vP;varying vec3 vN;void main(){vP=position;vN=normalize(normalMatrix*normal);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}",
    fragmentShader: `varying vec3 vP,vN;uniform float uTime,uGlow,uFade;float h(vec3 p){return fract(sin(dot(p,vec3(13.7,71.3,37.9)))*43758.5);}void main(){float n=h(floor(vP*12.+uTime));float rim=pow(1.-abs(vN.z),2.);float flash=uGlow*(.5+.5*sin(vP.x*43.+vP.z*27.));vec3 c=mix(vec3(.025,.025,.065),vec3(.22,.24,.48),n*.6+rim*.3)+flash*vec3(.5,.6,1.);gl_FragColor=vec4(c,uFade*(.7+rim*.2));}`,
  });
}
function boltGeo() {
  const g = new BufferGeometry(),
    p = new Float32Array(12 * 2 * 3),
    uv = new Float32Array(12 * 2 * 2),
    idx = [];
  for (let i = 0; i < 12; i++) {
    uv.set([i / 11, 0, i / 11, 1], i * 4);
    if (i < 11) {
      const j = i * 2;
      idx.push(j, j + 1, j + 2, j + 1, j + 3, j + 2);
    }
  }
  g.setAttribute("position", new BufferAttribute(p, 3));
  g.setAttribute("uv", new BufferAttribute(uv, 2));
  g.setIndex(idx);
  return g;
}
function boltMat() {
  return new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: DoubleSide,
    blending: AdditiveBlending,
    uniforms: { uFade: { value: 0 } },
    vertexShader:
      "varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}",
    fragmentShader:
      "varying vec2 vUv;uniform float uFade;void main(){float a=pow(max(0.,1.-abs(vUv.y-.5)*2.),.5)*uFade;gl_FragColor=vec4(vec3(.55,.68,1.)*2.,a);}",
  });
}
export class ThunderheadParasiteAbility extends Ability {
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
    return 0.6;
  }
  createShaders() {
    this.cloudGeometry = cloudGeo();
    this.cloudMaterial = cloudMat();
    this.cloud = new Mesh(this.cloudGeometry, this.cloudMaterial);
    this.cloud.layers.set(LAYER.VFX);
    this.group.add(this.cloud);
    this.boltGeometry = boltGeo();
    this.boltMaterial = boltMat();
    this.bolts = [];
    for (let i = 0; i < 5; i++) {
      const mesh = new Mesh(this.boltGeometry, this.boltMaterial);
      mesh.rotation.y = (i * TAU) / 5;
      mesh.layers.set(LAYER.VFX);
      mesh.frustumCulled = false;
      this.bolts.push(mesh);
      this.group.add(mesh);
    }
    this.targetId = null;
    this.bridge = null;
    this.unsub = [];
    this.seen = new Set();
    this.nextPulse = 0;
    this.lastFlash = -10;
    this.attachPosition = new Vector3();
    this.lastEventCount = 0;
  }
  createParticles() {}
  onSpawn() {
    this.targetId = null;
    this.seen.clear();
    this.lastFlash = -10;
    this.nextPulse = 0;
    this.lastEventCount = 0;
    this._clearSubscriptions();
    this.bridge = this.ctx.expansionCombat?.bind?.(UID, "caster") ?? null;
    this.attachPosition
      .copy(this.origin)
      .addScaledVector(this.direction, this.length);
    this._draw();
  }
  onTravel() {
    this._draw();
  }
  onImpact() {
    if (!this.bridge) return;
    const result = this.bridge.queryActors({
      position: [this.attachPosition.x, 0, this.attachPosition.z],
      radius: this.config.attachRadius,
      relation: "enemy",
    });
    const candidates = (result?.actors ?? [])
      .filter((a) => a.alive)
      .sort((a, b) => {
        const da =
            (a.position[0] - this.attachPosition.x) ** 2 +
            (a.position[2] - this.attachPosition.z) ** 2,
          db =
            (b.position[0] - this.attachPosition.x) ** 2 +
            (b.position[2] - this.attachPosition.z) ** 2;
        return da - db || a.id.localeCompare(b.id);
      });
    if (!result?.ok || !candidates.length) return;
    this.targetId = candidates[0].id;
    for (const type of ["hit", "cast-start"]) {
      const sub = this.bridge.on(type, (event) => this._react(event));
      if (sub?.ok) this.unsub.push(sub.unsubscribe);
      else {
        this._clearSubscriptions();
        this.targetId = null;
        break;
      }
    }
  }
  _react(event) {
    if (
      !this.targetId ||
      event.ownerId !== this.targetId ||
      this.seen.has(event.eventId) ||
      this.age < this.nextPulse
    )
      return;
    this.seen.add(event.eventId);
    if (this.seen.size > 64) this.seen.delete(this.seen.values().next().value);
    const target = this.bridge.getActor(this.targetId);
    if (!target?.ok || !target.actor?.alive) return;
    const result = this.bridge.emit({
      type: "hit",
      element: "storm",
      targetIds: [this.targetId],
      position: target.actor.position,
      damage: this.config.retaliation,
      tags: ["parasite-retaliation"],
    });
    if (result?.ok) {
      this.nextPulse = this.age + this.config.reactionCooldown;
      this.lastFlash = this.age;
      this.lastEventCount++;
    }
  }
  _draw() {
    this.cloud.position.copy(this.attachPosition);
    this.cloud.position.y += 2.2;
    this.cloud.scale.set(1.1, 0.8, 1.1);
    const p = this.boltGeometry.attributes.position;
    for (let i = 0; i < 12; i++) {
      const t = i / 11,
        wiggle = Math.sin(i * 4.8 + Math.floor(this.age * 18) * 1.1) * 0.14 * t;
      for (let j = 0; j < 2; j++)
        p.setXYZ(i * 2 + j, wiggle + (j ? 0.025 : -0.025), 2.1 - t * 1.8, 0);
    }
    p.needsUpdate = true;
    for (const b of this.bolts) b.position.copy(this.attachPosition);
    const flash = Math.max(0, 1 - (this.age - this.lastFlash) / 0.2);
    this.cloudMaterial.uniforms.uGlow.value = flash;
    this.cloudMaterial.uniforms.uTime.value = this.age;
    this.boltMaterial.uniforms.uFade.value = flash;
    this.position.copy(this.attachPosition);
  }
  onFade(_dt, t) {
    if (this.targetId) {
      const result = this.bridge.getActor(this.targetId);
      if (result?.ok && result.actor?.alive)
        this.attachPosition.fromArray(result.actor.position);
      else {
        this.targetId = null;
        this._clearSubscriptions();
      }
    }
    this._draw();
    if (t > 1) {
      const f = 2 - t;
      this.cloudMaterial.uniforms.uFade.value = f;
      this.boltMaterial.uniforms.uFade.value *= f;
    }
  }
  _clearSubscriptions() {
    for (const off of this.unsub) off();
    this.unsub.length = 0;
  }
  onDestroy() {
    this._clearSubscriptions();
    this.targetId = null;
    this.bridge = null;
    this.seen.clear();
    this.cloudMaterial.uniforms.uFade.value = 1;
    this.boltMaterial.uniforms.uFade.value = 0;
  }
  dispose() {
    this.onDestroy();
    this.cloudGeometry.dispose();
    this.cloudMaterial.dispose();
    this.boltGeometry.dispose();
    this.boltMaterial.dispose();
    super.dispose();
  }
}
export function buildEditor(gui, c, Editor) {
  const f = gui.addFolder("Thunderhead Parasite"),
    R = Editor.range;
  R(f, c, "attachRadius", 0.5, 5, 0.1, "attachment radius");
  R(f, c, "duration", 1, 12, 0.1, "duration");
  R(f, c, "reactionCooldown", 0.1, 2, 0.05, "reaction cooldown");
  R(f, c, "retaliation", 0, 3, 0.05, "retaliation");
  f.close();
  return f;
}
