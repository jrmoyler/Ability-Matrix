import { Mesh, PlaneGeometry, SphereGeometry, CylinderGeometry, Vector3 } from 'three';
import { Ability } from '../Ability.js';
import { ParticleShape } from '../../particles/ParticleSystem.js';
import { DecalType } from '../../effects/GroundDecals.js';
import { BurstMode } from '../../effects/BurstSphere.js';
import { frame } from '../../core/FrameUniforms.js';
import { settings } from '../../config/settings.js';
import { getColor } from '../../utils/color.js';

const _pos = new Vector3();
const _up = new Vector3(0, 1, 0);

export const ID = 'gale';

/**
 * Gale Sever — Refractive air blade + spiral dust wake
 * Type: line
 * Phase machine: travel → impact → fade → done
 */
export class GaleSeverAbility extends Ability {
  constructor(context) {
    super(ID, context);
    this.visual = null;
  }

  createParticles() {
    this.sparks = this.ctx.particles.get(`${ID}.fx`, { capacity: 600, shape: ParticleShape.SOFT, additive: true });
  }

  onTravel(dt, front) {
    this.pointAt(front, _pos);
    this.sparks.emit(8, { position: _pos.setY(0.4), radius: 0.3, direction: _up, speed: 4, spread: 1, size: 0.1, life: 1.0, time: frame.uTime.value });
  }

  onImpact() {
    this.pointAt(1, _pos);
    const c = settings[ID];
    this.ctx.decals.spawn(DecalType.SHOCKWAVE, _pos, { radius: c.zoneRadius ?? 3, life: 0.7, colorA: getColor(c.colorA), colorB: getColor(c.colorB) });
    this.ctx.bursts.spawn(BurstMode.AIR, _pos.clone().setY(0.6), { endRadius: 2.5, colorA: getColor(c.colorA), colorB: getColor(c.colorB) });
    this.ctx.shake.add(0.3);
  }

  onFade(t) {
    // envelope
  }

  onDestroy() {
    if (this.visual) {
      this.group.remove(this.visual);
      this.visual.geometry?.dispose();
      this.visual = null;
    }
  }
}

export function buildEditor(gui, c, Editor) {
  const folder = gui.addFolder('◇  Gale Sever');
  Editor.range(folder, c, 'range', 2, 40, 0.1, 'max range');
  Editor.castAnimation(folder, c);
}
