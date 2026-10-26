import { Color, Vector3 } from 'three';
import { ParticleShape } from '../../particles/ParticleSystem.js';
import { RateEmitter } from '../../particles/ParticleEngine.js';
import { frame } from '../../core/FrameUniforms.js';

// Shared bounded particle transport, not a shared spell design. Each cast
// provides its own geometry, shader, cadence, shape and palette. The sandbox's
// ParticleEngine owns these pooled systems and disposes them with the app.
export class ExpansionAtmosphere {
  constructor(ctx, key, {shape='SOFT', colors, rate=18, speed=.5, size=.1, life=1.2, spread=.6, radius=1, direction=[0,1,0], additive=true}) {
    this.rate=rate;this.speed=speed;this.size=size;this.life=life;this.spread=spread;this.radius=radius;
    this.direction=new Vector3(...direction).normalize();this.emitter=new RateEmitter();
    this.system=ctx.particles?.get(`expansion.${key}`,{capacity:480,shape:ParticleShape[shape]??ParticleShape.SOFT,additive,lit:!additive,curl:true,softFade:.3})??null;
    if(this.system && colors?.length) {
      const c=colors.map(x=>new Color(x));while(c.length<4)c.push(c.at(-1));
      this.system.setGradient(c[0],c[1],c[2],c[3]);
    }
  }
  reset(){this.emitter.reset();}
  update(dt, position, rateScale=1) {
    if(!this.system || !position || !Number.isFinite(dt) || dt<=0)return;
    const n=this.emitter.tick(dt,Math.max(0,Math.min(100,this.rate*rateScale)));
    if(n)this.system.emit(n,{position,radius:this.radius,direction:this.direction,speed:this.speed,spread:this.spread,size:this.size,life:this.life,spin:2,time:frame.uTime.value});
  }
}
