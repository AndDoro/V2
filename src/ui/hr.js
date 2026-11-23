import {sampleEvolutionPath, getTrack} from '../science/evolution.js';

// Astronomical convention: surface temperature decreases to the right.
// Every mark in this chart belongs to ONE selected object's illustrative track.
const AXES = {
 solar:   {loT:2400,hiT:70000,loL:1e-5,hiL:1e6},
 dwarf:   {loT:2300,hiT:30000,loL:1e-6,hiL:1e1},
 massive: {loT:2900,hiT:650000,loL:1e-5,hiL:1e7},
 remnant: {loT:2500,hiT:100000,loL:1e-7,hiL:1e2},
 unknown: {loT:2500,hiT:60000,loL:1e-7,hiL:1e6}
};
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const formatValue=n=>n>=1000?Math.round(n).toLocaleString('uk-UA'):n>=1?Number(n.toPrecision(3)).toLocaleString('uk-UA'):n.toExponential(1).replace('e','×10^');

export class HRDiagram {
 constructor(canvas) {
  this.canvas=canvas;
  this.ctx=canvas.getContext('2d');
  this.star=null;
  this.progress=0;
  this.mode='solar';
  this.frame=0;
  this.details=canvas.closest('details');
  this.resizeObserver=new ResizeObserver(()=>this.requestDraw());
  this.resizeObserver.observe(canvas.parentElement);
  this.details?.addEventListener('toggle',()=>this.requestDraw());
  this.requestDraw();
 }
 setState(star, progress, mode='evolution') {
  this.star=star;this.progress=clamp(Number(progress)||0,0,100);this.mode=mode;
  this.updateLabels();this.requestDraw();
 }
 requestDraw() {
  if (!this.details?.open || this.frame) return;
  this.frame=requestAnimationFrame(()=>{this.frame=0;this.draw();});
 }
 updateLabels(){
  const s=this.star,progress=this.progress,mode=this.mode;
  const name=document.getElementById('hrStarName');
  const stage=document.getElementById('hrStage');
  const readout=document.getElementById('hrReading');
  const hint=document.getElementById('hrHint');
  if (!name||!stage||!readout||!hint) return;
  name.textContent=s?.name||'Оберіть зорю';
  if (!s) return;
  if(mode==='solar'){
   stage.textContent='Спостережувані параметри';
   readout.textContent=s.temp>0&&s.luminosity>0?`T ≈ ${Math.round(s.temp).toLocaleString('uk-UA')} K · L ≈ ${formatValue(s.luminosity)} L☉`:'Немає достатніх даних';
   hint.textContent='Одна зоря. Перейдіть до режиму «Еволюція зорі», щоб побачити її умовну траєкторію.';
  }else if(s.track==='unknown'){
   stage.textContent='Еволюційна схема недоступна';readout.textContent='Немає достовірних параметрів для моделювання';
   hint.textContent='Без визначеного типу зорі траєкторія не будується. Не підмінюємо відсутні дані вигаданими.';
  }else{
   const track=getTrack(s),point=track.findLast(p=>p.at<=progress)??track[0];
   const seq=sampleEvolutionPath(s,progress,2);
   stage.textContent=`${point.stage} · ${progress.toFixed(1).replace('.',',')}%`;
   if(seq.length){const p=seq.at(-1);readout.textContent=`T ≈ ${Math.round(p.temp).toLocaleString('uk-UA')} K · L ≈ ${formatValue(p.luminosity)} L☉`;
    hint.textContent='Суцільна лінія — пройдений шлях; пунктир — можливе продовження. Усі точки належать обраній зорі.';
   }else{readout.textContent='До формування зорі: H–R координати ще не визначені';hint.textContent='Газопилова хмара ще не є сформованою зорею. Траєкторія почнеться зі стадії протозорі.';}
  }
 }
 axes(){return AXES[this.star?.track]||AXES.solar;}
 point(T,L,w,h){
  const {loT,hiT,loL,hiL}=this.axes(),l=46,r=w-14,t=13,b=h-33;
  const x=(Math.log10(hiT)-Math.log10(clamp(T,loT,hiT)))/(Math.log10(hiT)-Math.log10(loT));
  const y=(Math.log10(hiL)-Math.log10(clamp(L,loL,hiL)))/(Math.log10(hiL)-Math.log10(loL));
  return {x:l+x*(r-l),y:t+y*(b-t)};
 }
 draw(){
  if(!this.details?.open||!this.star)return;
  const canvas=this.canvas,box=canvas.getBoundingClientRect();
  const w=Math.max(200,box.width||280),h=Math.max(180,box.height||240),dpr=Math.min(window.devicePixelRatio||1,2);
  canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);
  const c=this.ctx;c.setTransform(dpr,0,0,dpr,0,0);c.clearRect(0,0,w,h);
  const l=46,r=w-14,t=13,b=h-33;const a=this.axes();
  c.fillStyle='#08152b';c.fillRect(l,t,r-l,b-t);
  const bg=c.createLinearGradient(l,0,r,0);bg.addColorStop(0,'rgba(86,136,255,.12)');bg.addColorStop(.55,'rgba(180,196,245,.025)');bg.addColorStop(1,'rgba(249,119,76,.10)');c.fillStyle=bg;c.fillRect(l,t,r-l,b-t);
  const logTicks=(lo,hi)=>{const ticks=[];for(let exp=Math.ceil(Math.log10(lo));exp<=Math.floor(Math.log10(hi));exp++)ticks.push(10**exp);return ticks;};
  c.font='10px Segoe UI,Arial,sans-serif';c.textBaseline='middle';
  for(const lum of logTicks(a.loL,a.hiL)){
   const p=this.point(a.loT,lum,w,h);c.strokeStyle='rgba(144,179,220,.15)';c.lineWidth=.8;c.beginPath();c.moveTo(l,p.y);c.lineTo(r,p.y);c.stroke();
   c.textAlign='right';c.fillStyle='#a9c5e1';
   c.fillText(lum>=1000?`${(lum/1000).toLocaleString('uk-UA')}k`:lum>=1?`${lum}`:lum.toExponential(0).replace('e','·10^'),l-5,p.y);
  }
  const logLo=Math.log10(a.loT),logHi=Math.log10(a.hiT);
  const xticks=[3000,5000,10000,30000,100000,300000].filter(T=>T>=a.loT&&T<=a.hiT);
  for(const temp of xticks){const p=this.point(temp,1,w,h);
   c.strokeStyle='rgba(144,179,220,.12)';c.beginPath();c.moveTo(p.x,t);c.lineTo(p.x,b);c.stroke();
   c.fillStyle='#acc5e7';c.textAlign='center';c.fillText(temp>=1000?`${temp/1000}k`:`${temp}`,p.x,b+13);
  }
  c.save();c.textAlign='center';c.fillStyle='#bdd4ec';c.font='10px Segoe UI,Arial';
  c.fillText('Температура, K  ← зростає', (l+r)/2,h-7);
  c.translate(12,(t+b)/2);c.rotate(-Math.PI/2);c.fillText('Світність, L☉ (лог.)',0,0);c.restore();
  // Only selected star. On the Solar System tab show its current measured/estimated catalogue point.
  if(this.mode==='solar'){
   if(this.star.temp>0&&this.star.luminosity>0){this.paintCurrent(c,this.point(this.star.temp,this.star.luminosity,w,h),this.star.color||'#ffda90');}
   else this.paintNoPath(c,w,h,'Для цієї зорі немає температури / світності');
   return;
  }
  if(this.star.track==='unknown') {this.paintNoPath(c,w,h,'Еволюційні дані відсутні');return;}
  const all=sampleEvolutionPath(this.star,100,200),past=sampleEvolutionPath(this.star,this.progress,200);
  if(!past.length){this.paintNoPath(c,w,h,'Формування зорі: початок треку попереду');return;}
  const stroke=(points,color,width,dash=[])=>{
   if(points.length<2)return;
   c.save();c.beginPath();points.forEach((p,i)=>{const s=this.point(p.temp,p.luminosity,w,h);i?c.lineTo(s.x,s.y):c.moveTo(s.x,s.y);});
   c.strokeStyle=color;c.lineWidth=width;c.lineCap='round';c.lineJoin='round';c.setLineDash(dash);c.stroke();c.restore();
  };
  // Future is deliberately dashed and subdued, because it is a hypothetical pedagogical branch.
  stroke(all,'rgba(135,178,235,.26)',2,[4,5]);
  stroke(past,'rgba(50,160,246,.20)',9);
  const grad=c.createLinearGradient(l,t,r,b);grad.addColorStop(0,'#8fd0ff');grad.addColorStop(.52,'#5aa9ff');grad.addColorStop(1,'#ffb983');
  stroke(past,grad,3.2);
  for(const point of getTrack(this.star).filter(s=>s.visual!=='cloud'&&s.at<=this.progress+1e-8)){
   const p=this.point(point.temp,point.luminosity,w,h);c.beginPath();c.arc(p.x,p.y,2.4,0,Math.PI*2);c.fillStyle='#e1f4ff';c.fill();
  }
  const curr=past.at(-1);this.paintCurrent(c,this.point(curr.temp,curr.luminosity,w,h),this.star.color||'#8fd9ff');
 }
 paintNoPath(c,w,h,label){c.font='11px Segoe UI,Arial';c.fillStyle='#b5cbe3';c.textAlign='center';c.fillText(label,Math.round((46+w-14)/2),Math.round((13+h-33)/2));}
 paintCurrent(c,p,color){
  c.save();const halo=c.createRadialGradient(p.x,p.y,2,p.x,p.y,18);halo.addColorStop(0,'rgba(255,255,255,.5)');halo.addColorStop(1,'rgba(70,181,255,0)');c.fillStyle=halo;c.beginPath();c.arc(p.x,p.y,18,0,Math.PI*2);c.fill();
  c.beginPath();c.arc(p.x,p.y,6.1,0,Math.PI*2);c.fillStyle=color;c.fill();c.lineWidth=2;c.strokeStyle='#fff';c.stroke();
  c.beginPath();c.arc(p.x,p.y,11,0,Math.PI*2);c.strokeStyle='rgba(115,225,255,.6)';c.lineWidth=1.2;c.stroke();c.restore();
 }
}
