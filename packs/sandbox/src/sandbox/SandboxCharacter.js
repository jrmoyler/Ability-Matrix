/**
 * The sandbox's one caster.
 *
 * It is the Linear Ext pack's CharacterController, unchanged, because that
 * version is a superset of the others: it dresses the rig from the authored
 * material library, measures the skeleton into bone segments, and carries the
 * fresnel aura its three self buffs write into — and the aura's uniforms live
 * in that module, so the buffs and the body have to share it.
 *
 * The one addition is `handsPoint`, from the Ability Casting pack's version,
 * which its lance reads to leave from between the caster's hands.
 */
import { Vector3 } from 'three';
import { CharacterController } from '../vendor/linear-ext/animation/CharacterController.js';

const _other = new Vector3();

export class SandboxCharacter extends CharacterController {
  /** Midpoint of the two hands in world space, or null before the rig loads. */
  handsPoint(out) {
    if (!this._hands) {
      let left = null;
      let right = null;
      this.root.traverse((node) => {
        if (/LeftHand$/.test(node.name)) left = node;
        else if (/RightHand$/.test(node.name)) right = node;
      });
      if (!left || !right) return null;
      this._hands = [left, right];
    }
    this._hands[0].getWorldPosition(out);
    this._hands[1].getWorldPosition(_other);
    return out.add(_other).multiplyScalar(0.5);
  }
}
