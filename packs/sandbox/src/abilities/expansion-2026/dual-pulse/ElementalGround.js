import { AdditiveBlending, Color, DoubleSide, Mesh, PlaneGeometry, ShaderMaterial } from 'three';
import { LAYER } from '../../../core/Layers.js';

/** A scorch seal and branching frost rime, each keyed to its own gameplay timing. */
export function createElementalGround(root,resources,fire){
 const uniforms={clock:{value:0},progress:{value:0},pulse:{value:0},fade:{value:1},glow:{value:1},opacity:{value:1},tint:{value:new Color(fire?'#ff6030':'#8edcff')}};
 const vertexShader='varying vec2 p;void main(){p=uv*2.-1.;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}';
 const fragmentShader=fire?`
 varying vec2 p;uniform float clock,progress,pulse,fade,glow,opacity;uniform vec3 tint;
 void main(){float r=length(p),a=atan(p.y,p.x);float mask=1.-smoothstep(.97,1.,r);
 float cracks=pow(max(0.,sin(a*13.+sin(r*18.)*2.)),20.)*smoothstep(.16,.4,r);
 float rings=pow(max(0.,sin(r*46.-clock*2.)),22.);
 float first=exp(-abs(r-clamp(progress*4.,0.,1.))*40.)*max(0.,1.-progress*4.);
 float second=exp(-abs(r-clamp((progress-pulse)*4.,0.,1.))*40.)*max(0.,1.-abs(progress-pulse)*4.);
 float v=(cracks*.3+rings*.12+first*.75+second*.75)*mask;
 gl_FragColor=vec4(tint*(1.+glow),v*fade*opacity);}`:`
 varying vec2 p;uniform float clock,progress,fade,glow,opacity;uniform vec3 tint;
 void main(){float r=length(p),a=atan(p.y,p.x);float mask=1.-smoothstep(.98,1.,r);
 float covered=1.-smoothstep(progress-.03,progress+.03,r);
 float arm=pow(max(0.,cos(a*6.)),18.);float veins=pow(max(0.,cos(a*24.+r*25.)),32.);
 float front=exp(-abs(r-progress)*55.);float glint=pow(max(0.,sin(r*52.+a*9.-clock)),24.);
 float v=(covered*(.08+arm*.25+veins*.16+glint*.08)+front*.7)*mask;
 gl_FragColor=vec4(tint*(1.+glow),v*fade*opacity);}`;
 const geometry=new PlaneGeometry(2,2),material=new ShaderMaterial({uniforms,vertexShader,fragmentShader,transparent:true,depthWrite:false,side:DoubleSide,blending:AdditiveBlending});resources.push(geometry,material);
 const mesh=new Mesh(geometry,material);mesh.rotation.x=-Math.PI/2;mesh.position.y=.025;mesh.layers.set(LAYER.VFX);root.add(mesh);return mesh;
}
export function updateElementalGround(mesh,{phase,q,pulse,radius,fade,clock,tint,glow,opacity}){
 mesh.visible=phase==='impact'||phase==='fade';mesh.scale.set(radius,radius,1);
 const u=mesh.material.uniforms;u.clock.value=clock;u.progress.value=q;u.pulse.value=pulse;u.fade.value=fade;u.tint.value.set(tint);u.glow.value=glow;u.opacity.value=opacity;
}
