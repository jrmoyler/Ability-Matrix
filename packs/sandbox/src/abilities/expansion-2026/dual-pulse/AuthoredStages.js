import { AdditiveBlending, BufferGeometry, Color, DoubleSide, Float32BufferAttribute, Group, Mesh, RingGeometry, ShaderMaterial } from 'three';
import { LAYER } from '../../../core/Layers.js';

function bladeGeometry(ice) {
  const vertices=[],uv=[];
  const tri=(a,b,c)=>{vertices.push(...a,...b,...c);uv.push(0,0,1,0,.5,1);};
  // Fire uses eight split crown plates; frost uses six asymmetric branching arms.
  const arms=ice?6:8;
  for(let i=0;i<arms;i++){
    const angle=i*Math.PI*2/arms,s=Math.sin(angle),c=Math.cos(angle),tx=c,tz=-s;
    const point=(r,w,y)=>[s*r+tx*w,y,c*r+tz*w];
    if(ice){
      tri(point(.12,-.025,.06),point(.12,.025,.06),point(.97,0,.08));
      for(const sign of [-1,1]){
        tri(point(.52,0,.08),point(.69,.022*sign,.08),point(.76,.19*sign,.08));
        tri(point(.72,0,.08),point(.82,.018*sign,.08),point(.88,.11*sign,.08));
      }
    }else{
      tri(point(.34,-.075,.05),point(.34,.075,.05),point(.76,0,.74+(i%2)*.16));
      tri(point(.48,-.035,.06),point(.48,.035,.06),point(.82,0,.52));
    }
  }
  const g=new BufferGeometry();g.setAttribute('position',new Float32BufferAttribute(vertices,3));g.setAttribute('uv',new Float32BufferAttribute(uv,2));g.computeVertexNormals();return g;
}
function shader(ice){return new ShaderMaterial({transparent:true,depthWrite:false,side:DoubleSide,blending:AdditiveBlending,
  uniforms:{clock:{value:0},fade:{value:1},energy:{value:0},tint:{value:new Color(ice?'#cdf6ff':'#ffd06b')}},
  vertexShader:'varying vec2 vUv;uniform float energy;void main(){vUv=uv;vec3 p=position;p.y*=.45+.55*energy;gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);}',
  fragmentShader:ice?'varying vec2 vUv;uniform float clock,fade,energy;uniform vec3 tint;void main(){float glint=pow(max(0.,sin(vUv.y*32.+vUv.x*12.-clock)),12.);gl_FragColor=vec4(tint*(.9+glint+energy*.5),fade*(1.-vUv.y*.5)*.65);}':'varying vec2 vUv;uniform float clock,fade,energy;uniform vec3 tint;void main(){float ember=pow(max(0.,sin(vUv.y*14.-clock*4.)),5.);gl_FragColor=vec4(tint*(1.+ember+energy),fade*(1.-vUv.y)*(.4+.6*energy));}'
});}
export function createAuthoredStages(root,resources,ice){
  const own=x=>(resources.push(x),x),stage=new Group();root.add(stage);
  const mesh=new Mesh(own(bladeGeometry(ice)),own(shader(ice)));mesh.layers.set(LAYER.VFX);stage.add(mesh);
  const line=new Mesh(own(new RingGeometry(.975,1,96)),own(shader(ice)));line.rotation.x=-Math.PI/2;line.position.y=.09;line.layers.set(LAYER.VFX);stage.add(line);
  return {stage,mesh,line,ice};
}
/** pulse represents the real second-hit threshold; q is the actual ring progress. */
export function updateAuthoredStages(stage,{radius,q,phase,pulse,fade,clock,tint,detailHeight}){
  const active=phase==='impact'||phase==='fade';
  const energy=stage.ice?(active?q:0):active?Math.max(0,1-Math.abs(q-pulse)/.16,1-q/.16):.16;
  const scale=stage.ice?(active?Math.max(.01,q):.01):1;
  stage.stage.scale.set(radius*scale,detailHeight,radius*scale);
  stage.line.visible=stage.ice?active:true;
  for(const object of [stage.mesh,stage.line]){
    object.material.uniforms.clock.value=clock;object.material.uniforms.fade.value=fade;
    object.material.uniforms.energy.value=energy;object.material.uniforms.tint.value.set(tint);
  }
}
