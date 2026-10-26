import { BufferGeometry, Float32BufferAttribute } from 'three';

/** One recognisable authored silhouette for each counter. Built once per
 * presentation and shared by its guards and returns. The geometry uses the
 * same bounded WebGL mesh path as the combat presentation. */
export function createCounterHeroGeometry(slug) {
  const vertices = [], uv = [], indices = [];
  const ribbon = (points, width) => {
    const start = vertices.length / 3;
    for (let i = 0; i < points.length; i++) {
      const [x,y,z] = points[i];
      const prev = points[Math.max(0,i-1)], next = points[Math.min(points.length-1,i+1)];
      const dx=next[0]-prev[0], dy=next[1]-prev[1], length=Math.hypot(dx,dy)||1;
      const w=width*(0.25+0.75*Math.sin(Math.PI*(i+0.5)/points.length));
      vertices.push(x-dy/length*w,y+dx/length*w,z, x+dy/length*w,y-dx/length*w,z);
      uv.push(i/(points.length-1),0,i/(points.length-1),1);
      if (i) { const a=start+(i-1)*2,b=start+i*2; indices.push(a,a+1,b,b,a+1,b+1); }
    }
  };
  const crystal = (x,y,z,w,h,d, tilt=0) => {
    const n=vertices.length/3;
    const p=[[x-w,y,z],[x,y-h,z],[x+w,y,z],[x,y+h,z+tilt],[x,y,z+d],[x,y,z-d]];
    for(const v of p) {vertices.push(...v);uv.push(Math.max(0,Math.min(1,(v[0]-x)/(2*w)+.5)),Math.max(0,Math.min(1,(v[1]-y)/(2*h)+.5)));}
    for(const face of [[0,1,4],[1,2,4],[2,3,4],[3,0,4],[1,0,5],[2,1,5],[3,2,5],[0,3,5]]) indices.push(...face.map(i=>n+i));
  };
  if (slug === 'backdraft-reprisal') {
    for(let k=-3;k<=3;k++) {
      const points=[]; for(let i=0;i<=16;i++) {const t=i/16;points.push([k*.25+Math.sin(t*5+k)*.13*t, .1+t*(1.35+(3-Math.abs(k))*.14), .06*Math.sin(t*7+k)]);}
      ribbon(points,.1+(3-Math.abs(k))*.02);
    }
  } else if (slug === 'feedback-execution') {
    for(let k=-2;k<=2;k++) {
      const points=[];for(let i=0;i<=12;i++){const t=i/12;points.push([k*.35+(i%2? .13:-.13)*(1-t), .15+t*1.65, .03*k]);}ribbon(points,.045);
      for(let j=0;j<2;j++){const t=.3+j*.25,x=k*.35+.1,y=.15+t*1.65;ribbon([[x,y,0],[x+(k<0?-.25:.25),y+.2,0],[x+(k<0?-.34:.34),y+.4,0]],.025);}
    }
  } else if (slug === 'undertow-reversal') {
    for(let k=0;k<5;k++){const points=[];for(let i=0;i<=24;i++){const t=i/24;points.push([(t-.5)*2.2,.3+k*.24+.2*Math.sin(t*6+k*.8),.04*k]);}ribbon(points,.055);}
  } else if (slug === 'faultline-retort') {
    for(let k=-3;k<=3;k++){const x=k*.27;crystal(x,.7+(Math.abs(k)%2)*.16,0,.16,.5+(3-Math.abs(k))*.07,.16,k*.04);}
  } else if (slug === 'facet-reprisal') {
    for(let k=0;k<8;k++){const a=k*Math.PI*2/8;crystal(Math.sin(a)*.8,.9+Math.cos(a)*.62,0,.15,.31,.17,Math.sin(a)*.1);}
    crystal(0,.9,.04,.27,.55,.22);
  } else if (slug === 'shatterpoint-reversal') {
    for(let k=-4;k<=4;k++){const x=k*.22;crystal(x,.75+(.4-Math.abs(k)*.08),0,.095,.6-Math.abs(k)*.07,.11,-x*.07);}
  } else throw new Error(`Unknown counter hero: ${slug}`);
  const geometry=new BufferGeometry();
  geometry.setAttribute('position',new Float32BufferAttribute(vertices,3));
  geometry.setAttribute('uv',new Float32BufferAttribute(uv,2));
  geometry.setIndex(indices); geometry.computeVertexNormals(); geometry.computeBoundingSphere();
  geometry.name=`counter-hero:${slug}`;
  return geometry;
}

export const COUNTER_HERO_SLUGS = Object.freeze(['backdraft-reprisal','feedback-execution','undertow-reversal','faultline-retort','facet-reprisal','shatterpoint-reversal']);
