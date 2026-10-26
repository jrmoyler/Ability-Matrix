/** Five elemental sovereignty forms. All timing is in seconds, distances in metres. */
const stance = (slug, name, element, data) => Object.freeze({
  uid: `mechanics/stance/${slug}`, family: 'stance', name, element,
  range: 18, cost: 14, cooldown: 18, anticipation: 0.5, recovery: 0.5,
  castAnim: 'cast3', life: 15, drain: 5, bankCap: 2,
  ...data
});
export const STANCE_VARIANTS = Object.freeze([
  stance('crown-of-the-first-ember', 'Crown of the First Ember', 'fire', {
    speed: 1.05, reduction: 0.20, finisherRadius: 4.3, damage: 1.3,
    passive: 'ember', detail: 'Every third cast ignites a close fire burst.'
  }),
  stance('the-pale-monarch', 'The Pale Monarch', 'frost', {
    speed: 0.88, reduction: 0.50, finisherRadius: 4.5, damage: 0.8,
    passive: 'retaliate', detail: 'Blocking a nearby attacker returns a chilling shard.'
  }),
  stance('thundergod-conduction', 'Thundergod Conduction', 'storm', {
    speed: 1.20, reduction: 0.15, finisherRadius: 3.8, damage: 1,
    passive: 'chain', detail: 'Every second standard cast knockdown or freeze arcs to a nearby enemy.'
  }),
  stance('leviathans-mantle', "Leviathan's Mantle", 'water', {
    speed: 1.00, reduction: 0.35, finisherRadius: 5.4, damage: 0.9,
    passive: 'tide', detail: 'Every second cast sends a wet pulse around the caster.'
  }),
  stance('titan-of-the-deep-strata', 'Titan of the Deep Strata', 'earth', {
    speed: 0.62, reduction: 0.70, finisherRadius: 5.8, damage: 1.15,
    drain: 6, bankCap: 3, passive: 'quakes', detail: 'Absorbing impact periodically releases a close tremor.'
  })
]);
