/** Bounded physical response for expansion-only committed hits. */
export function validImpactForce(force){
  return !!force&&typeof force==='object'&&!Array.isArray(force)&&
    Number.isFinite(force.impulse)&&force.impulse>=0&&force.impulse<=24&&
    Number.isFinite(force.lift)&&force.lift>=0&&force.lift<=20&&
    Number.isFinite(force.spin)&&force.spin>=0&&force.spin<=8;
}
export function impactForce(config){return {impulse:config.hitImpulse??6,lift:config.hitLift??3.4,spin:config.hitSpin??1.4};}
