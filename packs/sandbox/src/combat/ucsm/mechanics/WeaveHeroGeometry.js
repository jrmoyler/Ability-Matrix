import { AdditiveBlending, BufferGeometry, Color, DoubleSide, Float32BufferAttribute, ShaderMaterial } from 'three';

/** Bounded authored hero surfaces for the seven implemented weave identities.
 * Geometry and shader resources are owned by the presentation, not a cast. */
export const WEAVE_HERO_STYLES = Object.freeze(['fire','frost','storm','water','earth','crystal','wind']);
export function weaveStyle(uid = '') {
  if (uid.includes('cryostasis')) return 'frost';
  if (uid.includes('thunder')) return 'storm';
  if (uid.includes('hydrostatic')) return 'water';
  if (uid.includes('tectonic')) return 'earth';
  if (uid.includes('prismatic')) return 'crystal';
  if (uid.includes('jetstream')) return 'wind';
  return 'fire';
}

export function createWeaveSurface(style, role) {
  const index = WEAVE_HERO_STYLES.indexOf(style);
  if(index < 0 || !['anchor','link'].includes(role)) throw new Error('Unknown weave surface');
  const positions=[],uvs=[],indices=[];
  const strips=role==='link' ? (style==='storm'?3:2) : 5;
  const steps=role==='link' ? 32 : 24;
  const width=role==='link' ? .06 : .075;
  for(let n=0;n<strips;n++) {
    const start=positions.length/3;
    for(let i=0;i<=steps;i++) {
      const t=i/steps;
      let x,y,z;
      if(role==='link') {
        // Entire ribbon remains within the authoritative capsule before and
        // after the shader's bounded 0.04-unit lateral displacement.
        const phase=n*2.1+index*.31;
        const wave=style==='storm'?((i%2?1:-1)*.1):style==='earth'?((i%3-1)*.055):Math.sin(t*Math.PI*2*(1+index%3)+phase)*.09;
        x=wave+(n-(strips-1)/2)*.07;y=.02*Math.sin(t*Math.PI*4+phase);z=t-.5;
      } else {
        const a=n*Math.PI*2/strips + t*Math.PI*(style==='wind'?2.5:style==='water'?1.4:style==='storm'?0.8:0.4);
        const radius=.22 + .28*Math.sin(Math.PI*t)*(style==='earth'?.55:1);
        x=Math.sin(a)*radius;y=.15+t*1.55;z=Math.cos(a)*radius;
        if(style==='frost'||style==='crystal') { const facets=style==='crystal'?4:3; x*=.5+Math.abs(Math.sin(t*Math.PI*facets)); z*=.5+Math.abs(Math.cos(t*Math.PI*facets)); }
        if(style==='fire') x+=Math.sin(t*12+n)*.12*t;
        if(style==='storm') x+=(i%2?1:-1)*.11;
      }
      const w=width*(.3+.7*Math.sin(Math.PI*(i+.5)/(steps+1)));
      positions.push(x-w,y,z,x+w,y,z);uvs.push(t,0,t,1);
      if(i){const a=start+(i-1)*2,b=start+i*2;indices.push(a,a+1,b,b,a+1,b+1);}
    }
  }
  const g=new BufferGeometry();g.name=`weave-${role}:${style}`;
  g.setAttribute('position',new Float32BufferAttribute(positions,3));
  g.setAttribute('uv',new Float32BufferAttribute(uvs,2));g.setIndex(indices);
  g.computeVertexNormals();g.computeBoundingSphere();return g;
}

const COLORS = { fire:'#ff6625', frost:'#a5e8ff', storm:'#b3a8ff', water:'#2cc5ff', earth:'#d3a161', crystal:'#d3b7ff', wind:'#baf5df' };
const VERTEX = `
  varying vec2 vUv;
  uniform float clock;
  void main() {
    vUv=uv;
    vec3 p=position;
    p.x += 0.04 * sin(uv.x*22.0-clock*4.0) * sin(uv.x*3.14159265);
    gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.0);
  }
`;
const FRAGMENT = `
  varying vec2 vUv;
  uniform float clock;
  uniform vec3 tint;
  uniform float character;
  void main() {
    float edge=1.0-abs(vUv.y*2.0-1.0);
    float filament=pow(max(0.0,sin(vUv.x*(18.0+character*2.0)-clock*(2.0+character*0.3))),4.0);
    float intensity=(0.35+0.65*edge)*(0.65+0.35*filament);
    gl_FragColor=vec4(tint*(1.1+filament*0.9),intensity*0.72);
  }
`;
export function ensureWeaveSurface(v, style, role) {
  const key=`weaveHero:${role}:${style}`;
  if(!v.geo[key]) { const g=createWeaveSurface(style,role);v.geo[key]=g;v.resources.push(g); }
  const material=`weaveGlow:${style}`;
  if(!v.mat[material]) {
    const m=new ShaderMaterial({uniforms:{clock:v.terrainTime,tint:{value:new Color(COLORS[style])},character:{value:WEAVE_HERO_STYLES.indexOf(style)}},vertexShader:VERTEX,fragmentShader:FRAGMENT,transparent:true,depthWrite:false,side:DoubleSide,blending:AdditiveBlending});
    m.name=material;v.mat[material]=m;v.resources.push(m);
  }
  return { geometry:key, material };
}

/** Twenty GPU points per link. Their geometry and material are shared across
 * casts; shader motion wraps only along the real link and obeys reduced motion
 * through the same combat clock as the hero ribbons. */
export function ensureWeaveMotes(v, style) {
  const geometry='weaveMotes:geometry';
  if(!v.geo[geometry]) {
    const p=[];
    for(let i=0;i<20;i++) p.push(Math.sin(i*2.399)*.13, .04+((i*7)%9)*.012, (i+.5)/20-.5);
    const g=new BufferGeometry();g.setAttribute('position',new Float32BufferAttribute(p,3));
    g.name=geometry;g.computeBoundingSphere();v.geo[geometry]=g;v.resources.push(g);
  }
  const material=`weaveMotes:${style}`;
  if(!v.mat[material]) {
    const m=new ShaderMaterial({
      uniforms:{clock:v.terrainTime,tint:{value:new Color(COLORS[style])}},
      vertexShader:`uniform float clock;
        void main(){vec3 p=position;p.z=fract(p.z+0.5+clock*0.3)-0.5;
        p.x+=0.025*sin(clock*4.0+position.z*31.0);
        vec4 mv=modelViewMatrix*vec4(p,1.0);gl_Position=projectionMatrix*mv;
        gl_PointSize=clamp(20.0/max(1.0,-mv.z),1.5,5.0);}`,
      fragmentShader:`uniform vec3 tint;
        void main(){float r=length(gl_PointCoord-vec2(0.5));
        float a=1.0-smoothstep(0.1,0.5,r);gl_FragColor=vec4(tint*1.5,a*0.7);}`,
      transparent:true,depthWrite:false,blending:AdditiveBlending
    });
    m.name=material;v.mat[material]=m;v.resources.push(m);
  }
  return {geometry,material};
}
