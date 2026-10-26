import { Group, Vector3 } from 'three';
import { createCounterHeroGeometry, COUNTER_HERO_SLUGS } from './CounterHeroGeometry.js';

const TAU = Math.PI * 2;
const UP = new Vector3(0, 1, 0);
function heroGeometry(v, uid) {
  const slug = uid?.split('/').at(-1);
  if (!COUNTER_HERO_SLUGS.includes(slug)) return null;
  const name = `counterHero:${slug}`;
  if (!v.geo[name]) {
    const geometry = createCounterHeroGeometry(slug);
    v.geo[name] = geometry;
    v.resources.push(geometry);
  }
  return name;
}
const materialOf = (uid) => ({
  'backdraft-reprisal': 'fire', 'feedback-execution': 'storm',
  'undertow-reversal': 'water', 'faultline-retort': 'strata', 'facet-reprisal': 'ice',
  'shatterpoint-reversal': 'ice'
})[uid?.split('/').at(-1)];
const mark = (node, type, phase = 0) => {
  node.userData.counterMotion = { type, phase, scale: node.scale.clone(), rotation: node.rotation.clone(), position: node.position.clone() };
  return node;
};

/** Art stays separate from gameplay. Every piece uses the presentation's shared resources. */
export function buildCounterGuard(v, g, uid) {
  const slug = uid?.split('/').at(-1), mat = materialOf(uid);
  if (!mat) return false;
  // An element-specific sculpted surface gives the guard a recognisable read
  // in silhouette, before the smaller orbiting pieces are visible.
  const hero = mark(v.mesh(heroGeometry(v, uid), mat, g, 0, .08, 1.14, .82, .82, .82), 'hero');
  hero.name = `counter-hero:${slug}`;
  const orbit = new Group(); g.add(orbit); mark(orbit, 'orbit', slug === 'undertow-reversal' ? 1 : 0);
  if (slug === 'backdraft-reprisal') {
    for (let i = 0; i < 11; i++) {
      const a = (i / 10 - .5) * Math.PI;
      const flame = v.mesh('shard', i % 2 ? 'gold' : 'fire', orbit, Math.sin(a) * 1.05, .85 + .45 * Math.cos(a), Math.cos(a) * 1.05, .14, .55 + (i % 3) * .1, .14);
      flame.rotation.z = -a * .5; mark(flame, 'flame', i);
    }
    mark(v.ring(g, 'fire', 1.05, .12), 'ring', 0);
  } else if (slug === 'feedback-execution') {
    for (let i = 0; i < 7; i++) {
      const a = (i / 6 - .5) * Math.PI * .9;
      const bolt = v.mesh('box', 'storm', orbit, Math.sin(a) * 1.05, 1.1, Math.cos(a) * 1.05, .1, 1.1, .1);
      bolt.rotation.z = (i % 2 ? 1 : -1) * .45; mark(bolt, 'bolt', i);
      mark(v.mesh('shard', 'storm', orbit, Math.sin(a) * 1.05, 1.75, Math.cos(a) * 1.05, .1, .22, .1), 'bolt', i + .5);
    }
    mark(v.ring(g, 'storm', .8, .12), 'ring', 0);
  } else if (slug === 'undertow-reversal') {
    for (let i = 0; i < 4; i++) {
      const ring = v.ring(orbit, 'water', .55 + i * .2, .45 + i * .35); ring.rotation.y = i * .36; mark(ring, 'ring', i);
    }
    for (let i = 0; i < 8; i++) {
      const a = i * TAU / 8;
      mark(v.mesh('sphere', 'water', orbit, Math.sin(a) * .9, .8 + (i % 3) * .4, Math.cos(a) * .9, .13), 'droplet', i);
    }
  } else if (slug === 'faultline-retort') {
    for (let i = 0; i < 7; i++) {
      const a = (i / 6 - .5) * Math.PI;
      const rock = v.mesh('ridge', i % 2 ? 'strata' : 'rock', orbit, Math.sin(a) * 1.1, .5, Math.cos(a) * 1.1, .35, .42, .35);
      rock.rotation.y = i * .65; mark(rock, 'rock', i);
      mark(v.mesh('shard', 'gold', orbit, Math.sin(a) * 1.05, .8, Math.cos(a) * 1.05, .06, .35, .06), 'spark', i);
    }
  } else if (slug === 'shatterpoint-reversal') {
    for (let i = 0; i < 9; i++) {
      const a = (i / 8 - .5) * Math.PI * .9;
      const shard = v.mesh('shard', 'ice', orbit, Math.sin(a) * 1.15, 1.25 + Math.cos(a) * .35, Math.cos(a) * 1.15, .1, .45, .1);
      shard.rotation.z = -a; mark(shard, 'facet', i);
    }
    mark(v.mesh('shield', 'steel', g, 0, 1.3, 1.1, .65, .7, .5), 'facet', 0);
  } else {
    for (let i = 0; i < 9; i++) {
      const a = (i / 8 - .5) * Math.PI;
      const facet = v.mesh('shard', i % 2 ? 'ice' : 'steel', orbit, Math.sin(a) * 1.05, 1.2, Math.cos(a) * 1.05, .23, .6, .12);
      facet.rotation.y = a; mark(facet, 'facet', i);
    }
    mark(v.ring(g, 'ice', .7, .2), 'ring', 0);
    mark(v.ring(g, 'steel', 1.1, .15), 'ring', 1);
  }
  return true;
}

/** Coordinates are relative to the attacker (the cue's impact position). */
export function buildCounterReversal(v, g, data, profile) {
  const mat = materialOf(data.uid);
  if (!mat || !Array.isArray(data.from) || !Array.isArray(data.position)) return false;
  const start = new Vector3(data.from[0] - data.position[0], 1.15, data.from[2] - data.position[2]);
  const end = new Vector3(0, 1.15, 0), travel = end.clone().sub(start);
  const distance = travel.length();
  if (!Number.isFinite(distance) || distance > 30) return false;
  g.userData.counterReversal = true;
  // A fixed upper bound makes the effect predictable even for long-range returns.
  const segments = 8;
  for (let i = 0; i < segments; i++) {
    const a = start.clone().lerp(end, i / segments), b = start.clone().lerp(end, (i + 1) / segments);
    const mid = a.clone().add(b).multiplyScalar(.5);
    const strand = v.mesh('shaft', mat, g, mid.x, mid.y, mid.z, .21, Math.max(.01, a.distanceTo(b)), .21);
    strand.quaternion.setFromUnitVectors(UP, b.clone().sub(a).normalize());
    strand.userData.counterTrail = i;
  }
  const orb = v.mesh(heroGeometry(v, data.uid), mat, g, start.x, start.y, start.z, .26, .26, .26);
  orb.userData.counterProjectile = { start, end };
  const impact = new Group(); g.add(impact); impact.userData.counterImpact = true;
  const radius = profile?.footprint ?? profile?.splash ?? 1.2;
  v.ring(impact, mat, radius, .12);
  v.ring(impact, mat, radius * .62, .18);
  for (let i = 0; i < 10; i++) {
    const a = i * TAU / 10;
    const shard = v.mesh(slugGeometry(data.uid), mat, impact, Math.sin(a) * radius * .65, .2, Math.cos(a) * radius * .65, .1, .35 + (i % 3) * .1, .1);
    shard.rotation.z = Math.sin(a) * .7; shard.rotation.x = Math.cos(a) * .7;
  }
  return true;
}
function slugGeometry(uid) { return uid.endsWith('undertow-reversal') ? 'sphere' : uid.endsWith('feedback-execution') ? 'box' : 'shard'; }

export function animateCounterVisual(root, age, reducedMotion = false) {
  const progress = reducedMotion ? 1 : Math.min(1, Math.max(0, age / .24));
  root.traverse((node) => {
    const m = node.userData.counterMotion;
    if (m && !reducedMotion) {
      const w = Math.sin(age * (m.type === 'bolt' ? 22 : 7) + m.phase * 1.7);
      if (m.type === 'orbit') node.rotation.y = m.rotation.y + Math.sin(age * 3) * .12;
      else if (m.type === 'ring') node.rotation.z = m.rotation.z + age * (m.phase % 2 ? -1 : 1) * .6;
      else if (m.type === 'droplet') node.position.y = m.position.y + w * .14;
      else if (m.type === 'rock') node.position.y = m.position.y + w * .045;
      else if (m.type === 'facet') node.rotation.z = m.rotation.z + w * .09;
      else node.scale.y = m.scale.y * (.82 + .18 * (w + 1) / 2);
    }
    if (node.userData.counterTrail !== undefined) node.visible = progress >= node.userData.counterTrail / 8;
    if (node.userData.counterProjectile) {
      const { start, end } = node.userData.counterProjectile;
      node.position.copy(start).lerp(end, progress);
      node.visible = progress < 1;
    }
    if (node.userData.counterImpact) {
      node.visible = progress >= 1;
      node.scale.setScalar(reducedMotion ? 1 : Math.min(1, Math.max(.01, (age - .24) / .16)));
    }
  });
}
