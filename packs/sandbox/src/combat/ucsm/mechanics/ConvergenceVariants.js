/** Five authored convergence moves. Their secondary strike patterns are independent
 * of the reaction footprint: UCSM owns ingredient consumption and attribution. */
const preset = (slug, name, element, pattern, opts = {}) => Object.freeze({
  uid: `mechanics/convergence/${slug}`, family: 'convergence', name, element, pattern,
  range: 18, cost: 20, cooldown: 6, anticipation: 0.5, recovery: 0.5,
  castAnim: 'cast2', life: 1.8, radius: 4, maxIngredients: 3, ...opts
});
export const CONVERGENCE_VARIANTS = Object.freeze([
  preset('promethean-ignition', 'Promethean Ignition', 'fire', 'nova', { damage: 1.1, radius: 3.6, ingredientExample: 'water' }),
  preset('absolute-crystallization', 'Absolute Crystallization', 'frost', 'crown', { damage: 0.7, radius: 4.1, cooldown: 7, ingredientExample: 'water' }),
  preset('hydrodynamic-synthesis', 'Hydrodynamic Synthesis', 'water', 'wave', { damage: 0.8, radius: 4, cooldown: 5.5, ingredientExample: 'fire' }),
  preset('elemental-lithification', 'Elemental Lithification', 'earth', 'eruption', { damage: 1, radius: 3.4, anticipation: 0.65, ingredientExample: 'frost' }),
  preset('prismatic-multiplication', 'Prismatic Multiplication', 'crystal', 'fan', { damage: 0.75, radius: 3.8, cooldown: 5.5, ingredientExample: 'storm' })
]);
const disk = (x,z,r) => ({ kind: 'disc', x, z, r });
const line = (x,z,dx,dz,n,r) => ({kind:'capsule', ax:x, az:z, bx:x+dx*n, bz:z+dz*n, r});
/** Shapes are bounded and deterministic. A target intersecting several shapes is hit once. */
export function convergenceStrikeShapes(p, c) {
  const [x,,z] = c.position, [dx,,dz] = c.direction;
  switch (p.pattern) {
    case 'nova': return [disk(x,z,3.6)];
    case 'crown': return [disk(x,z,2.2), ...Array.from({length:6}, (_,i) => {
      const a = i * Math.PI / 3;
      return disk(x + (dx * Math.cos(a) + dz * Math.sin(a)) * 3,
        z + (dz * Math.cos(a) - dx * Math.sin(a)) * 3, 0.85);
    })];
    case 'wave': return [line(x-dx*2,z-dz*2,dx,dz,8,1.25)];
    case 'eruption': return [-2.5, 0, 2.5].map(n=>disk(x+dx*n,z+dz*n,1.2));
    case 'fan': return [-0.48,0,0.48].map(a => {
      const vx=dx*Math.cos(a)+dz*Math.sin(a), vz=dz*Math.cos(a)-dx*Math.sin(a);
      return line(x,z,vx,vz,6,0.42);
    });
    default: return [];
  }
}
