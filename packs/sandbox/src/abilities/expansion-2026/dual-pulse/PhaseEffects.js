import { AdditiveBlending, BufferGeometry, Color, DoubleSide, Float32BufferAttribute, Mesh, Points, ShaderMaterial } from 'three';
import { LAYER } from '../../../core/Layers.js';

// A faceted ember spear, or a six-winged ice needle. Each is built in field space.
export function phaseGeometry(fire) {
  const verts=[], uv=[], count=fire?12:18;
  function triangle(a,b,c){verts.push(...a,...b,...c);uv.push(0,0,1,0,.5,1);}
  for(let i=0;i<count;i++){
    const angle=i*Math.PI*2/count, x=Math.sin(angle),z=Math.cos(angle);
    const tangent=[Math.cos(angle),-Math.sin(angle)], r=fire?.53:.62, w=fire?.055:.035;
    const p=[x*r,.1,z*r], left=[p[0]+tangent[0]*w,.1,p[2]+tangent[1]*w],right=[p[0]-tangent[0]*w,.1,p[2]-tangent[1]*w];
    const tip=[x*(fire?.68:.94),fire?.7+(i%3)*.11:.24+(i%4)*.07,z*(fire?.68:.94)];
    triangle(left,right,tip);triangle(right,[x*r,.1,z*r],tip);
    if(!fire){const wing=[x*.72+tangent[0]*.12,.2,z*.72+tangent[1]*.12];triangle(p,wing,tip);}
  }
  const g=new BufferGeometry();g.setAttribute('position',new Float32BufferAttribute(verts,3));g.setAttribute('uv',new Float32BufferAttribute(uv,2));g.computeVertexNormals();return g;
}
export function createPhaseEffects(root, resources, fire){
  const own=x=>(resources.push(x),x), uniforms={clock:{value:0},fade:{value:1},beat:{value:0},tint:{value:new Color(fire?'#ff9b40':'#a8efff')}};
  const surface=new Mesh(own(phaseGeometry(fire)),own(new ShaderMaterial({uniforms,transparent:true,depthWrite:false,side:DoubleSide,blending:AdditiveBlending,
    vertexShader:'varying vec2 vUv;uniform float clock,beat;void main(){vUv=uv;vec3 p=position;p.y*=.7+beat*.3;p.y+=sin(clock*2.8+position.x*4.)*.03*uv.y;gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);}',
    fragmentShader:fire?'varying vec2 vUv;uniform float clock,fade,beat;uniform vec3 tint;void main(){float flame=pow(max(0.,sin(vUv.y*17.-clock*5.+vUv.x*3.)),4.);float edge=(1.-vUv.y)*(.4+flame*.6);gl_FragColor=vec4(tint*(1.+beat+flame),fade*edge*.7);}':'varying vec2 vUv;uniform float clock,fade,beat;uniform vec3 tint;void main(){float facet=pow(max(0.,sin(vUv.y*28.+vUv.x*8.+clock)),18.);float edge=1.-abs(vUv.x-.5);gl_FragColor=vec4(tint*(.8+facet+beat),fade*edge*.6);}'
  })));
  surface.layers.set(LAYER.VFX);root.add(surface);
  const values=[],seed=[];for(let i=0;i<64;i++){let a=i*2.399963,r=Math.sqrt((i+.5)/64)*.9;values.push(Math.sin(a)*r,0,Math.cos(a)*r);seed.push((i*.618034)%1);}
  const particles=own(new BufferGeometry());particles.setAttribute('position',new Float32BufferAttribute(values,3));particles.setAttribute('seed',new Float32BufferAttribute(seed,1));
  const points=new Points(particles,own(new ShaderMaterial({uniforms,transparent:true,depthWrite:false,blending:AdditiveBlending,
    vertexShader:'attribute float seed;uniform float clock,beat;varying float alpha;void main(){float t=fract(seed+clock*.26);vec3 p=position;p.y=.1+t*(.7+beat*.5);alpha=sin(t*3.14159265);vec4 v=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*v;gl_PointSize=clamp(24./max(1.,-v.z),1.5,5.);}',
    fragmentShader:'varying float alpha;uniform float fade;uniform vec3 tint;void main(){float d=length(gl_PointCoord-.5);gl_FragColor=vec4(tint*1.5,(1.-smoothstep(.1,.5,d))*alpha*fade*.7);}'
  })));
  points.layers.set(LAYER.VFX);points.frustumCulled=false;root.add(points);
  return {surface,points,uniforms};
}
