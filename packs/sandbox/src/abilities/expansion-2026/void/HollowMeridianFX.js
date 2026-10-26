import { AdditiveBlending, BufferGeometry, Color, DoubleSide, Float32BufferAttribute, Mesh, ShaderMaterial, Vector3 } from 'three';
import { ParticleShape } from '../../../particles/ParticleSystem.js';
import { RateEmitter } from '../../../particles/ParticleEngine.js';
import { frame } from '../../../core/FrameUniforms.js';
import { settings } from '../../../config/settings.js';
import { LAYER } from '../../../core/Layers.js';

const clamp = x => Math.max(0, Math.min(1, x));

/** Jagged tapered ground cuts, growing outward from the accepted breach. */
export function fractureGeometry() {
  const p = [], uv = [], indices = [];
  for (let branch = 0; branch < 9; branch++) {
    const angle = branch * Math.PI * 2 / 9;
    const steps = 7;
    for (let j = 0; j <= steps; j++) {
      const t = j / steps, jitter = Math.sin(branch * 7 + j * 4.1) * .065 * t;
      const x = Math.sin(angle) * t + Math.cos(angle) * jitter;
      const z = Math.cos(angle) * t - Math.sin(angle) * jitter;
      const width = .028 * (1 - .75 * t);
      for (const side of [-1, 1]) {
        p.push(x + Math.cos(angle) * width * side, 0, z - Math.sin(angle) * width * side);
        uv.push(t, (side + 1) / 2);
      }
      if (j < steps) {
        const n = branch * (steps + 1) * 2 + j * 2;
        indices.push(n, n + 2, n + 1, n + 1, n + 2, n + 3);
      }
    }
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new Float32BufferAttribute(p, 3));
  geometry.setAttribute('uv', new Float32BufferAttribute(uv, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function fractureMaterial() {
  return new ShaderMaterial({
    transparent:true, depthWrite:false, side:DoubleSide, blending:AdditiveBlending,
    uniforms:{color:{value:new Color('#b8a8ff')}, progress:{value:0}, opacity:{value:0}},
    vertexShader:`varying vec2 q;void main(){q=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    fragmentShader:`varying vec2 q;uniform vec3 color;uniform float progress,opacity;
      void main(){float head=1.-smoothstep(progress-.08,progress+.01,q.x);float edge=1.-abs(q.y*2.-1.);
      gl_FragColor=vec4(color,(.25+.75*edge)*head*opacity);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
    }`,
  });
}

/** Three independent pooled surfaces follow the same accepted cut times as damage. */
export class MeridianFractures {
  constructor(rig) {
    this.geometry = fractureGeometry();
    this.disposed = false;
    this.surfaces = Array.from({length:3}, () => {
      const material = fractureMaterial(), mesh = new Mesh(this.geometry, material);
      mesh.layers.set(LAYER.VFX); mesh.frustumCulled = false; mesh.visible = false;
      rig.add(mesh);
      return {mesh, material};
    });
  }
  reset() { for (const {mesh} of this.surfaces) mesh.visible = false; }
  update(index, age, fade, c, length, reduced) {
    const {mesh, material} = this.surfaces[index];
    const cutFade = age < 0 ? 0 : 1 - clamp((age - (c.seamHold ?? 1.4)) / Math.max(.1, c.seamClose ?? .6));
    mesh.visible = age >= 0 && cutFade > 0 && fade > 0;
    if (!mesh.visible) return;
    mesh.position.set(0, .045 + index * .004, length * (index + 1) / 4);
    mesh.scale.setScalar(c.zoneRadius * (c.fractureReach ?? 1));
    material.uniforms.color.value.set(c.edgeColor);
    material.uniforms.progress.value = reduced ? 1 : clamp(age / .24);
    material.uniforms.opacity.value = fade * cutFade * (c.fractureIntensity ?? .65);
  }
  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    for (const {mesh, material} of this.surfaces) { mesh.removeFromParent(); material.dispose(); }
    this.geometry.dispose();
  }
}

/** Travel leaves a swept wake; each accepted cut emits two opposed directional jets. */
export class MeridianParticles {
  constructor(ctx) {
    this.point = new Vector3(); this.side = new Vector3(); this.back = new Vector3();
    this.emitter = new RateEmitter(); this.primary = null; this.secondary = null;
    this.colors = [new Color(), new Color(), new Color(), new Color()];
    this.system = ctx.particles?.get('expansion.hollow-meridian-cut', {
      capacity:360, shape:ParticleShape.STREAK, additive:true, stretch:true, softFade:.3,
    }) ?? null;
  }
  reset() { this.emitter.reset(); }
  palette(c) {
    if (this.primary === c.voidColor && this.secondary === c.edgeColor) return;
    this.primary = c.voidColor; this.secondary = c.edgeColor;
    this.colors[0].set(c.edgeColor); this.colors[1].set(c.edgeColor).multiplyScalar(.7);
    this.colors[2].set(c.voidColor); this.colors[3].set(c.voidColor).multiplyScalar(.35);
    this.system?.setGradient(...this.colors);
  }
  travel(dt, position, direction, c, reduced) {
    if (reduced || !this.system || dt <= 0) return;
    this.palette(c);
    const global = settings.global;
    const count = this.emitter.tick(dt, Math.min(60, Math.max(0, (c.particleRate ?? 22) * global.particleCount)));
    if (!count) return;
    this.back.copy(direction).multiplyScalar(-1);
    this.system.emit(Math.min(24, count), {position, direction:this.back, radius:.1, spread:.24,
      speed:1.5 * global.particleSpeed, size:(c.particleSize ?? .1) * global.particleSize,
      life:.42 * global.particleLifetime, spin:3, time:frame.uTime.value});
  }
  cut(position, direction, c, reduced) {
    if (reduced || !this.system) return;
    this.palette(c); this.point.fromArray(position); this.point.y = .22;
    this.side.set(direction.z, 0, -direction.x);
    const global = settings.global, count = Math.min(24, Math.max(0, Math.round(10 * global.particleCount)));
    for (const sign of [1, -1]) {
      this.side.multiplyScalar(sign);
      this.system.emit(count, {position:this.point, direction:this.side, radius:.12, spread:.3,
        speed:2.1 * global.particleSpeed, size:(c.particleSize ?? .1) * global.particleSize,
        life:.65 * global.particleLifetime, spin:4, time:frame.uTime.value});
      this.side.multiplyScalar(sign);
    }
  }
}
