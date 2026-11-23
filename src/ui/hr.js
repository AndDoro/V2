import {STARS} from '../data/stars.js';
export class HRDiagram{
 constructor(canvas,onSelect){this.canvas=canvas;this.onSelect=onSelect;this.selected='sun';this.preview=null;this.ctx=canvas.getContext('2d');
  this.resizeObserver=new ResizeObserver(()=>this.draw());this.resizeObserver.observe(canvas.parentElement);
  canvas.addEventListener('click',e=>{const r=canvas.getBoundingClientRect(),x=e.clientX-r.left,y=e.clientY-r.top;
   const nearest=STARS.map(s=>({s,p:this.point(s.temp,s.luminosity,r.width,r.height)})).sort((a,b)=>Math.hypot(a.p.x-x,a.p.y-y)-Math.hypot(b.p.x-x,b.p.y-y))[0];
   if(nearest&&Math.hypot(nearest.p.x-x,nearest.p.y-y)<17)this.onSelect(nearest.s.id);
  });
  this.draw();
 }
 point(T,L,w,h){const left=39,right=w-12,top=19,bottom=h-32;
  const x=(Math.log10(50000)-Math.log10(Math.max(2500,Math.min(50000,T))))/(Math.log10(50000)-Math.log10(2500));
  const y=(6-Math.log10(Math.max(1e-6,Math.min(1e6,L))))/12;
  return {x:left+(right-left)*x,y:top+(bottom-top)*y};
 }
 setState(id,preview){this.selected=id;this.preview=preview;this.draw();}
 draw(){
  const canvas=this.canvas,box=canvas.getBoundingClientRect(),w=Math.max(240,box.width||280),h=Math.max(190,box.height||220),dpr=Math.min(window.devicePixelRatio||1,2);
  canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);
  const c=this.ctx;c.setTransform(dpr,0,0,dpr,0,0);c.clearRect(0,0,w,h);
  const l=39,r=w-12,t=19,b=h-32;
  c.fillStyle='#0a1426';c.fillRect(l,t,r-l,b-t);
  const gradient=c.createLinearGradient(l,0,r,0);gradient.addColorStop(0,'rgba(112,151,255,.09)');gradient.addColorStop(.5,'rgba(243,235,176,.03)');gradient.addColorStop(1,'rgba(255,103,76,.1)');c.fillStyle=gradient;c.fillRect(l,t,r-l,b-t);
  c.font='10px Inter,Segoe UI,Arial,sans-serif';c.textBaseline='middle';
  for(const lum of [1e-5,.001,.1,10,1000,100000]){
   const p=this.point(5800,lum,w,h);c.strokeStyle='rgba(140,163,207,.12)';c.beginPath();c.moveTo(l,p.y);c.lineTo(r,p.y);c.stroke();
   c.textAlign='right';c.fillStyle='#8c9db6';c.fillText(lum<1?lum.toString():lum.toLocaleString('en'),l-6,p.y);
  }
  for(const temp of [3000,6000,10000,30000]){
   const p=this.point(temp,1,w,h);c.strokeStyle='rgba(140,163,207,.1)';c.beginPath();c.moveTo(p.x,t);c.lineTo(p.x,b);c.stroke();
   c.textAlign='center';c.fillStyle='#9aaccc';c.fillText((temp/1000)+'k',p.x,b+12);
  }
  // Бліда смуга головної послідовності (схематично).
  c.save();c.beginPath();for(let i=0;i<=80;i++){
   const s=i/80,T=35000*Math.pow(3000/35000,s),lum=130000*Math.pow(.00008/130000,s);
   const p=this.point(T,lum,w,h);if(i===0)c.moveTo(p.x,p.y);else c.lineTo(p.x,p.y);
  }c.strokeStyle='rgba(111,155,240,.20)';c.lineWidth=16;c.stroke();c.restore();
  c.fillStyle='#667fa4';c.textAlign='left';c.font='9px Inter,Arial';c.fillText('НАДГІГАНТИ',l+8,t+13);c.fillText('БІЛІ КАРЛИКИ',l+8,b-9);
  for(const s of STARS){const p=this.point(s.temp,s.luminosity,w,h),active=s.id===this.selected;
   c.beginPath();c.arc(p.x,p.y,active?5.3:3,0,Math.PI*2);c.fillStyle=s.color;c.fill();
   if(active){c.beginPath();c.arc(p.x,p.y,9.3,0,Math.PI*2);c.strokeStyle='#ffffff';c.lineWidth=1.4;c.stroke();}
  }
  if(this.preview){const p=this.point(this.preview.temp,this.preview.luminosity,w,h);
   c.beginPath();c.arc(p.x,p.y,7,0,Math.PI*2);c.strokeStyle='#66e1f6';c.lineWidth=2;c.stroke();
  }
  c.font='10px Inter,Arial';c.fillStyle='#aec0d8';c.textAlign='center';c.fillText('Температура поверхні, K → нижча',l+(r-l)/2,h-5);
  c.save();c.translate(11,(t+b)/2);c.rotate(-Math.PI/2);c.fillText('Світність L☉ (лог.)',0,0);c.restore();
 }
}
