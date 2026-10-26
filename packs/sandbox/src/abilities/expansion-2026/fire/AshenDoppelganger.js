import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Color,
  DoubleSide,
  Group,
  LatheGeometry,
  Mesh,
  MeshStandardMaterial,
  PlaneGeometry,
  ShaderMaterial,
  Vector2,
  Vector3,
} from "three";
import { clone as cloneSkeleton } from "three/addons/utils/SkeletonUtils.js";
import { Ability } from "../../Ability.js";
import { LAYER } from "../../../core/Layers.js";

export const ID = "ashen-doppelganger";
export const UID = "matrix-expansion/ashen-doppelganger";
export const CONFIG = Object.freeze({
  id: ID,
  meta: {
    label: "Ashen Doppelganger",
    accent: "#ff7439",
    element: "fire",
    key: "",
    cast: "zone",
    hint: "An ash echo follows your recent path and periodically scorches nearby foes.",
    glyph:
      '<circle cx="50" cy="25" r="12"/><path d="M32 78L38 43L62 43L68 78M22 52L37 47M63 47L78 52"/>',
  },
  settings: {
    range: 18,
    minRange: 0,
    speed: 45,
    lifetime: 5,
    cooldown: 9,
    castAnim: "cast2",
    lightColor: "#ff7439",
    lightIntensity: 5,
    lightRadius: 7,
    delay: 0.8,
    duration: 5,
    pulseInterval: 0.8,
    pulseRadius: 2.4,
    pulseForce: 2,
    echoOpacity: 0.84,
    emberRate: 2.4,
  },
});

// A fallback silhouette is used only until the host has supplied the caster rig.
function emberMaterial() {
  const uniforms = {
    uTime: { value: 0 },
    uOpacity: { value: 0 },
    uHeat: { value: 0 },
  };
  return new ShaderMaterial({
    uniforms,
    transparent: true,
    depthWrite: false,
    side: DoubleSide,
    vertexShader: `varying vec3 vPos; varying vec3 vNormal; uniform float uTime; void main(){ vPos=position; vNormal=normalize(normalMatrix*normal); vec3 p=position; p.x+=sin(position.y*8.0+uTime*3.0)*0.025; gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.0); }`,
    fragmentShader: `varying vec3 vPos; varying vec3 vNormal; uniform float uTime,uOpacity,uHeat; float hash(vec3 p){return fract(sin(dot(p,vec3(17.1,91.7,37.9)))*43758.5453);} void main(){ float grain=hash(floor(vPos*18.0+vec3(0.0,uTime*1.5,0.0))); float fissure=pow(max(0.0,1.0-abs(sin(vPos.y*21.0+sin(vPos.x*18.0)*2.0+uTime*2.0))*5.0),2.0); float rim=pow(1.0-abs(vNormal.z),2.0); vec3 charred=mix(vec3(.025,.009,.006),vec3(.2,.035,.006),grain); vec3 glow=vec3(1.0,.19,.018)*(fissure*(1.3+uHeat)+rim*.42); gl_FragColor=vec4(charred+glow, uOpacity*(.68+rim*.25)); }`,
  });
}
function glowMaterial() {
  return new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
    uniforms: { uTime: { value: 0 }, uOpacity: { value: 0 } },
    vertexShader: `varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
    fragmentShader: `varying vec2 vUv; uniform float uTime,uOpacity; void main(){vec2 p=vUv*2.0-1.0;float r=length(p);float ring=exp(-pow((r-.74)*18.0,2.0));float cracks=pow(max(0.0,sin(atan(p.y,p.x)*12.0+r*25.0-uTime*3.0)),12.0)*(1.0-r);float a=(ring+cracks*.35)*(1.0-smoothstep(.84,1.0,r))*uOpacity;gl_FragColor=vec4(vec3(1.0,.18,.015)*a,a);}`,
  });
}
function limbGeometry() {
  return new LatheGeometry(
    [
      new Vector2(0.09, 0),
      new Vector2(0.16, 0.12),
      new Vector2(0.13, 0.38),
      new Vector2(0.09, 0.7),
      new Vector2(0.045, 0.82),
    ],
    12,
  );
}
function sparkGeometry(count = 72) {
  const g = new BufferGeometry(),
    pos = new Float32Array(count * 3),
    seed = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    const a = i * 2.399963,
      r = 0.18 + (i % 9) * 0.1;
    pos[i * 3] = Math.sin(a) * r;
    pos[i * 3 + 1] = ((i % 17) / 17) * 2.1;
    pos[i * 3 + 2] = Math.cos(a) * r;
    seed[i] = i / count;
  }
  g.setAttribute("position", new BufferAttribute(pos, 3));
  g.setAttribute("aSeed", new BufferAttribute(seed, 1));
  return g;
}

export class AshenDoppelgangerAbility extends Ability {
  constructor(ctx) {
    super(ID, ctx);
  }
  get handlesOwnHits() {
    return true;
  }
  get impactDuration() {
    return 0.05;
  }
  get fadeDuration() {
    return Math.max(0.1, this.config.duration);
  }
  createShaders() {
    this.skin = emberMaterial();
    this.groundMat = glowMaterial();
    this.bodyGeo = new LatheGeometry(
      [
        new Vector2(0.1, 0),
        new Vector2(0.27, 0.2),
        new Vector2(0.25, 0.65),
        new Vector2(0.37, 1),
        new Vector2(0.2, 1.22),
        new Vector2(0.08, 1.3),
      ],
      20,
    );
    this.limbGeo = limbGeometry();
    this.headGeo = new LatheGeometry(
      [
        new Vector2(0.04, 0),
        new Vector2(0.16, 0.04),
        new Vector2(0.2, 0.22),
        new Vector2(0.16, 0.4),
        new Vector2(0.02, 0.46),
      ],
      16,
    );
    this.echo = new Group();
    this.echo.name = "AshEcho";
    this.group.add(this.echo);
    this.body = new Mesh(this.bodyGeo, this.skin);
    this.echo.add(this.body);
    this.head = new Mesh(this.headGeo, this.skin);
    this.head.position.y = 1.26;
    this.echo.add(this.head);
    this.limbs = [];
    for (const [x, y] of [
      [-0.3, 0.85],
      [0.3, 0.85],
      [-0.15, 0.08],
      [0.15, 0.08],
    ]) {
      const pivot = new Group();
      pivot.position.set(x, y, 0);
      const part = new Mesh(this.limbGeo, this.skin);
      part.rotation.z = Math.PI;
      pivot.add(part);
      this.echo.add(pivot);
      this.limbs.push(pivot);
    }
    this.groundGeo = new PlaneGeometry(1, 1);
    this.ground = new Mesh(this.groundGeo, this.groundMat);
    this.ground.rotation.x = -Math.PI / 2;
    this.ground.position.y = 0.035;
    this.group.add(this.ground);
    this.sparkGeo = sparkGeometry();
    // Instanced points are bounded and reused; no per-frame allocation.
    this.sparkMat = new ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
      uniforms: { uTime: { value: 0 }, uOpacity: { value: 0 } },
      vertexShader: `attribute float aSeed; uniform float uTime; varying float vSeed; void main(){vSeed=aSeed;vec3 p=position;p.y=mod(p.y+uTime*(.25+aSeed*.6),2.2);p.xz*=.8+.2*sin(uTime*2.0+aSeed*15.0);vec4 mv=modelViewMatrix*vec4(p,1.0);gl_PointSize=clamp(18.0/max(1.0,-mv.z),1.0,7.0);gl_Position=projectionMatrix*mv;}`,
      fragmentShader: `uniform float uOpacity;varying float vSeed;void main(){float a=(1.0-smoothstep(.0,.5,length(gl_PointCoord-.5)))*uOpacity;gl_FragColor=vec4(mix(vec3(1.,.12,.01),vec3(1.,.7,.16),vSeed),a);}`,
    });
    // THREE.Points is obtained through the mesh constructor imported below.
    this.spark = makePoints(this.sparkGeo, this.sparkMat);
    this.echo.add(this.spark);
    this.samples = Array.from({ length: 96 }, () => new Vector3());
    this.sampleTimes = new Float64Array(96);
    this.writeIndex = 0;
    this.count = 0;
    this.sampleClock = 0;
    this.nextPulse = 0;
    this.found = [];
    this.tmp = new Vector3();
    this.last = new Vector3();
    this.echoRig = null;
    this.poseSources = [];
    this.poseCopies = [];
    this.poseHistory = null;
    this.yawHistory = new Float32Array(96);
    this.rigMaterial = null;
    this.echo.traverse((o) => o.layers?.set(LAYER.VFX));
    this.ground.layers.set(LAYER.VFX);
  }
  createParticles() {}
  onSpawn() {
    this._ensureRig();
    this.count = 0;
    this.writeIndex = 0;
    this.sampleClock = 0;
    this.nextPulse = this.config.delay;
    this.last.copy(this.origin);
    this.echo.position.copy(this.origin);
    this._sample();
  }
  _ensureRig() {
    if (this.echoRig || !this.ctx.character?.model) return;
    const source = this.ctx.character.model;
    const copy = cloneSkeleton(source);
    const originals = [],
      clones = [];
    source.traverse((node) => {
      if (node.isBone) originals.push(node);
    });
    copy.traverse((node) => {
      if (node.isBone) clones.push(node);
    });
    if (
      !originals.length ||
      originals.length !== clones.length ||
      originals.length > 128
    )
      return;
    this.rigMaterial = new MeshStandardMaterial({
      color: 0x24100a,
      emissive: 0xb52805,
      emissiveIntensity: 1.4,
      roughness: 0.72,
      metalness: 0.08,
      transparent: true,
      opacity: this.config.echoOpacity,
      depthWrite: false,
    });
    const uniforms = { time: { value: 0 }, heat: { value: 0 } };
    this.rigMaterial.userData.ash = uniforms;
    this.rigMaterial.onBeforeCompile = (shader) => {
      shader.uniforms.uAshTime = uniforms.time;
      shader.uniforms.uAshHeat = uniforms.heat;
      shader.vertexShader = shader.vertexShader
        .replace(
          "#include <common>",
          "#include <common>\nvarying vec3 vAshPosition;",
        )
        .replace(
          "#include <begin_vertex>",
          "#include <begin_vertex>\nvAshPosition = position;",
        );
      shader.fragmentShader = shader.fragmentShader
        .replace(
          "#include <common>",
          "#include <common>\nvarying vec3 vAshPosition; uniform float uAshTime; uniform float uAshHeat;",
        )
        .replace(
          "#include <emissivemap_fragment>",
          `#include <emissivemap_fragment>
          float seam = pow(max(0.0, 1.0 - abs(sin(vAshPosition.y * 23.0 + sin(vAshPosition.x * 17.0) * 1.8 + uAshTime * 2.0)) * 7.0), 2.0);
          totalEmissiveRadiance += vec3(1.0, 0.13, 0.015) * seam * (1.2 + uAshHeat);`,
        );
    };
    this.rigMaterial.customProgramCacheKey = () => "ashen-doppelganger-rig-v1";
    copy.traverse((node) => {
      if (node.isMesh) {
        node.material = this.rigMaterial;
        node.castShadow = false;
      }
      node.layers?.set(LAYER.VFX);
    });
    this.echo.add(copy);
    this.echoRig = copy;
    this.poseSources = originals;
    this.poseCopies = clones;
    this.poseHistory = new Float32Array(96 * originals.length * 7);
    this.body.visible = false;
    this.head.visible = false;
    for (const limb of this.limbs) limb.visible = false;
  }
  _sample() {
    const point = this.ctx.character?.position ?? this.origin;
    this.samples[this.writeIndex].copy(point);
    this.sampleTimes[this.writeIndex] = this.age;
    this.yawHistory[this.writeIndex] =
      this.ctx.character?.root?.rotation.y ?? 0;
    if (this.poseHistory) {
      const base = this.writeIndex * this.poseSources.length * 7;
      this.poseSources.forEach((bone, i) => {
        bone.quaternion.toArray(this.poseHistory, base + i * 7);
        bone.position.toArray(this.poseHistory, base + i * 7 + 4);
      });
    }
    this.writeIndex = (this.writeIndex + 1) % this.samples.length;
    this.count = Math.min(this.count + 1, this.samples.length);
  }
  _updateEcho(dt) {
    this.sampleClock += dt;
    if (this.sampleClock >= 0.05) {
      this._sample();
      this.sampleClock %= 0.05;
    }
    const targetTime = Math.max(0, this.age - this.config.delay);
    let idx =
      (this.writeIndex - this.count + this.samples.length) %
      this.samples.length;
    for (let n = 0; n < this.count; n++) {
      const i =
        (this.writeIndex - 1 - n + this.samples.length) % this.samples.length;
      if (this.sampleTimes[i] <= targetTime) {
        idx = i;
        break;
      }
    }
    this.last.copy(this.echo.position);
    this.echo.position.copy(this.samples[idx]);
    this.echo.position.y = 0;
    const dx = this.echo.position.x - this.last.x,
      dz = this.echo.position.z - this.last.z;
    if (this.echoRig) {
      this.echo.rotation.y = this.yawHistory[idx];
      const base = idx * this.poseCopies.length * 7;
      this.poseCopies.forEach((bone, i) => {
        bone.quaternion.fromArray(this.poseHistory, base + i * 7);
        bone.position.fromArray(this.poseHistory, base + i * 7 + 4);
      });
    } else if (dx * dx + dz * dz > 1e-6)
      this.echo.rotation.y = Math.atan2(dx, dz);
    const stride = Math.min(
      1,
      (Math.hypot(dx, dz) / Math.max(dt, 0.001)) * 0.2,
    );
    for (let i = 0; i < 4; i++)
      this.limbs[i].rotation.x =
        Math.sin(this.age * 8 + i * Math.PI) * stride * 0.5;
    this.ground.position.set(this.echo.position.x, 0.035, this.echo.position.z);
    this.ground.scale.setScalar(this.config.pulseRadius * 2);
    this.skin.uniforms.uTime.value = this.age;
    this.skin.uniforms.uOpacity.value = this.config.echoOpacity;
    this.skin.uniforms.uHeat.value = Math.max(
      0,
      1 - (this.nextPulse - this.age) / 0.25,
    );
    if (this.rigMaterial) {
      this.rigMaterial.opacity = this.config.echoOpacity;
      this.rigMaterial.userData.ash.time.value = this.age;
      this.rigMaterial.userData.ash.heat.value = this.skin.uniforms.uHeat.value;
    }
    this.groundMat.uniforms.uTime.value = this.age;
    this.groundMat.uniforms.uOpacity.value = 0.32;
    this.sparkMat.uniforms.uTime.value = this.age;
    this.sparkMat.uniforms.uOpacity.value = 0.8;
    this.position.copy(this.echo.position);
    let pulses = 0;
    while (this.age >= this.nextPulse && pulses++ < 4) {
      this.nextPulse += Math.max(0.05, this.config.pulseInterval);
      const found =
        this.ctx.dummies?.findTargets?.(
          this.echo.position.x,
          this.echo.position.z,
          this.config.pulseRadius,
          this.found,
        ) ?? [];
      for (const d of found) {
        const x = d.position.x - this.echo.position.x,
          z = d.position.z - this.echo.position.z,
          r = Math.hypot(x, z) || 1;
        d.kill?.(
          x / r,
          z / r,
          { impulse: this.config.pulseForce, lift: 1.2, spin: 0.4 },
          false,
        );
      }
    }
  }
  onTravel(dt) {
    this._updateEcho(dt);
  }
  onImpact() {}
  onFade(dt, t) {
    this._updateEcho(dt);
    if (t > 1) {
      const fade = Math.max(0, Math.min(1, (2 - t) * 4));
      this.skin.uniforms.uOpacity.value = this.config.echoOpacity * fade;
      if (this.rigMaterial)
        this.rigMaterial.opacity = this.config.echoOpacity * fade;
      this.sparkMat.uniforms.uOpacity.value = 0.8 * fade;
      this.groundMat.uniforms.uOpacity.value = 0.32 * fade;
    }
  }
  onDestroy() {
    this.count = 0;
    this.echo.visible = false;
  }
  spawn(...args) {
    this.echo.visible = true;
    super.spawn(...args);
  }
  dispose() {
    for (const g of [
      this.bodyGeo,
      this.limbGeo,
      this.headGeo,
      this.groundGeo,
      this.sparkGeo,
    ])
      g.dispose();
    for (const m of [this.skin, this.groundMat, this.sparkMat]) m.dispose();
    this.rigMaterial?.dispose();
    super.dispose();
  }
}
import { Points } from "three";
const makePoints = (geometry, material) => new Points(geometry, material);
export function buildEditor(gui, c, Editor) {
  const f = gui.addFolder("Ashen Doppelganger");
  const R = Editor.range;
  R(f, c, "delay", 0.1, 2, 0.05, "echo delay");
  R(f, c, "duration", 1, 8, 0.1, "duration");
  R(f, c, "pulseRadius", 0.5, 5, 0.1, "pulse radius");
  R(f, c, "pulseInterval", 0.2, 2, 0.05, "pulse interval");
  R(f, c, "echoOpacity", 0, 1, 0.01, "echo opacity");
  f.close();
  return f;
}
