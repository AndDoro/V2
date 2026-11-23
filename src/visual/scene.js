import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.186.1/build/three.module.js';
import { PLANETS } from '../data/planets.js';

const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function rng(seed){return ()=>((seed=(Math.imul(seed,1664525)+1013904223)|0)>>>0)/4294967296;}
function valueNoise(x,y,seed){
 const ix=Math.floor(x),iy=Math.floor(y), fx=x-ix,fy=y-iy;
 const h=(a,b)=>{let v=Math.imul(a+seed,374761393)+Math.imul(b,668265263);v=Math.imul(v^(v>>>13),1274126177);return ((v^(v>>>16))>>>0)/4294967295;};
 const u=fx*fx*(3-2*fx),v=fy*fy*(3-2*fy);
 return (h(ix,iy)*(1-u)+h(ix+1,iy)*u)*(1-v)+(h(ix,iy+1)*(1-u)+h(ix+1,iy+1)*u)*v;
}
function fractal(x,y,seed){let out=0,amp=.55,freq=1;for(let i=0;i<4;i++){out+=amp*valueNoise(x*freq,y*freq,seed+i*13);freq*=2;amp*=.52;}return out;}
function makePlanetTexture(p){
 const w=640,h=320, canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;
 const ctx=canvas.getContext('2d',{willReadFrequently:true}), img=ctx.createImageData(w,h);const seed=1357+p.id.length*73;
 const rgb=(a,b,t)=>a.map((n,i)=>Math.round(n+(b[i]-n)*t));
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
  const u=x/w, v=y/h, lat=Math.abs(v-.5)*2, n=fractal(u*7,v*5,seed),fine=fractal(u*35,v*22,seed+36), stripe=Math.sin(v*83+5*n+2*fine), j=(y*w+x)*4;
  let c=[130,135,142];
  if(p.type==='earth'){
   const land=n+.15*Math.sin(u*15+v*9)>.52;
   if(land){c=rgb([40,85,52],[173,157,108],clamp((fine-.31)*1.8,0,1));}
   else{c=rgb([9,35,85],[17,109,156],clamp(fine,0,1));}
   if(lat>.84&&fine>.2)c=rgb(c,[237,247,253],clamp((lat-.84)*5,0,1));
   if(!land && fine>.69)c=rgb(c,[121,179,200],.16);
  }else if(p.type==='venus'){c=rgb([176,126,77],[240,224,176],clamp(n*.65+stripe*.15+.18,0,1));}
  else if(p.type==='mars'){c=rgb([103,49,35],[219,120,77],clamp(n*.95+fine*.15,0,1));if(lat>.90)c=[236,217,190];}
  else if(p.type==='rock'){c=rgb([66,67,71],[171,158,138],clamp(n*.75+fine*.3,0,1));}
  else if(p.type==='jupiter'){
   const band=Math.sin(v*94+12*n)+.42*Math.sin(v*170+u*15);
   c=rgb([151,92,63],[242,221,178],clamp(.5+band*.3+n*.1,0,1));
   const dx=(u-.66)/.125,dy=(v-.58)/.064;if(dx*dx+dy*dy<1)c=rgb(c,[197,91,63],.75);
  }else if(p.type==='saturn'){c=rgb([165,145,113],[238,226,189],clamp(.5+stripe*.13+n*.35,0,1));}
  else if(p.type==='uranus'){c=rgb([109,171,185],[192,235,230],clamp(.45+n*.32+stripe*.025,0,1));}
  else if(p.type==='neptune'){c=rgb([31,58,149],[83,137,229],clamp(n*.4+.23+stripe*.14,0,1));}
  img.data[j]=c[0];img.data[j+1]=c[1];img.data[j+2]=c[2];img.data[j+3]=255;
 }
 ctx.putImageData(img,0,0);
 const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
 texture.anisotropy=4;texture.wrapS=THREE.RepeatWrapping;return texture;
}
function makeGlowTexture(){
 const c=document.createElement('canvas');c.width=c.height=256;const ctx=c.getContext('2d'),g=ctx.createRadialGradient(128,128,10,128,128,128);
 g.addColorStop(0,'rgba(255,255,255,.92)');g.addColorStop(.18,'rgba(255,207,110,.6)');g.addColorStop(.47,'rgba(255,118,63,.14)');g.addColorStop(1,'rgba(255,110,20,0)');
 ctx.fillStyle=g;ctx.fillRect(0,0,256,256);return new THREE.CanvasTexture(c);
}
function makeCloudTexture(){
 const w=512,h=256,c=document.createElement('canvas');c.width=w;c.height=h;
 const ctx=c.getContext('2d'),img=ctx.createImageData(w,h);
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
  const n=fractal(x/w*11,y/h*7,8177),i=(y*w+x)*4;
  img.data[i]=img.data[i+1]=img.data[i+2]=255;img.data[i+3]=Math.round(clamp((n-.48)*760,0,176));
 }
 ctx.putImageData(img,0,0);let t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;
}
function makeSunMaterial(){
 return new THREE.ShaderMaterial({
  uniforms:{uTime:{value:0},uTint:{value:new THREE.Color('#ffc977')},uBrightness:{value:1}},
  vertexShader:`varying vec3 vNormalLocal;varying vec3 vPos;varying vec3 vViewNormal;
    void main(){vNormalLocal=normal;vPos=position;vViewNormal=normalize(normalMatrix*normal);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
  fragmentShader:`uniform float uTime;uniform vec3 uTint;uniform float uBrightness;varying vec3 vNormalLocal;varying vec3 vPos;varying vec3 vViewNormal;
    float hash(vec3 p){return fract(sin(dot(p,vec3(127.1,311.7,74.7)))*43758.5453123);}
    float noise(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(mix(hash(i),hash(i+vec3(1,0,0)),f.x),mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z);}
    float fbm(vec3 p){float v=0.,a=.52;for(int i=0;i<5;i++){v+=noise(p)*a;p=p*2.06+4.7;a*=.52;}return v;}
    void main(){vec3 p=normalize(vPos);float q=fbm(p*5.+vec3(uTime*.09,uTime*.025,0.));float f=fbm(p*16.-vec3(.0,uTime*.19,0.));float veins=smoothstep(.38,.78,q*.82+f*.35);
    float rim=pow(1.-abs(dot(normalize(vViewNormal),vec3(0.,0.,1.))),2.2);
    vec3 color=mix(uTint*.52,uTint*1.36,veins);color=mix(color,vec3(1.,.93,.71),smoothstep(.66,.99,q));color+=uTint*rim*.55;
    gl_FragColor=vec4(color*uBrightness,1.);}`
 });
}
function makeCoronaMaterial(){return new THREE.ShaderMaterial({
 uniforms:{uTint:{value:new THREE.Color('#ffbb68')},uTime:{value:0}},transparent:true,depthWrite:false,side:THREE.BackSide,blending:THREE.AdditiveBlending,
 vertexShader:`varying vec3 vNormal;void main(){vNormal=normalize(normalMatrix*normal);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
 fragmentShader:`uniform vec3 uTint;uniform float uTime;varying vec3 vNormal;void main(){float f=pow(1.-abs(vNormal.z),3.5);float w=.7+.3*sin(uTime*1.4+vNormal.y*25.);gl_FragColor=vec4(uTint,f*w*.27);}`
});}
function ringMaterial(){return new THREE.ShaderMaterial({transparent:true,depthWrite:false,side:THREE.DoubleSide,
 vertexShader:`varying float r;void main(){r=length(position.xy);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
 fragmentShader:`varying float r;void main(){float b=sin(r*65.)*.14+sin(r*143.)*.09;float gap=smoothstep(.03,.065,abs(r-1.70));float a=(.38+b)*gap*smoothstep(1.22,1.30,r)*(1.-smoothstep(2.04,2.14,r));vec3 col=mix(vec3(.53,.41,.28),vec3(.94,.86,.68),clamp(.45+b*2.,0.,1.));gl_FragColor=vec4(col,a);}`});}
function orbitLine(radius,color='#597a9d',opacity=.29){
 const pts=[];for(let i=0;i<=256;i++){const a=i*Math.PI*2/256;pts.push(new THREE.Vector3(Math.cos(a)*radius,0,Math.sin(a)*radius));}
 const g=new THREE.BufferGeometry().setFromPoints(pts);return new THREE.Line(g,new THREE.LineBasicMaterial({color,transparent:true,opacity}));
}
export class StarScene{
 constructor(container, onPlanet){
  this.container=container;this.onPlanet=onPlanet;this.mode='solar';this.speed=1;this.elapsed=0;this.focusPlanet=null;this.labels=[];
  this.scene=new THREE.Scene();this.scene.background=new THREE.Color('#020611');
  this.scene.fog=new THREE.FogExp2('#020611',.0014);
  this.renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'high-performance'});
  this.renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.8));this.renderer.outputColorSpace=THREE.SRGBColorSpace;
  this.renderer.toneMapping=THREE.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.45;
  this.renderer.domElement.style.cssText='display:block;width:100%;height:100%;touch-action:none;';
  this.container.appendChild(this.renderer.domElement);
  this.camera=new THREE.PerspectiveCamera(49,1,.1,500);
  this.azimuth=.45;this.polar=1.06;this.distance=44;this.target=new THREE.Vector3();
  this.desiredTarget=new THREE.Vector3();this.desiredDistance=44;this.camera.position.set(13,20,40);
  this.scene.add(new THREE.AmbientLight('#8eacdd',.52));
  this.sunLight=new THREE.PointLight('#ffe2a1',115,190,1.25);this.scene.add(this.sunLight);
  this.buildSky();this.createSun();this.createEvolutionEffects();this.createSystem();this.setupLabels();this.bindInput();this.resize();
  this.resizeObserver=new ResizeObserver(()=>this.resize());this.resizeObserver.observe(container);
  this.lastTime=performance.now();this.raf=requestAnimationFrame(t=>this.animate(t));
 }
 buildSky(){
  const random=rng(433), count=2800, pos=new Float32Array(count*3), col=new Float32Array(count*3);
  for(let i=0;i<count;i++){
   let theta=random()*Math.PI*2, phi=Math.acos(random()*2-1), rad=110+random()*95;
   pos[i*3]=Math.sin(phi)*Math.cos(theta)*rad;pos[i*3+1]=Math.cos(phi)*rad;pos[i*3+2]=Math.sin(phi)*Math.sin(theta)*rad;
   const c=new THREE.Color().setHSL(.54+random()*.14,.14+random()*.3,.58+random()*.35);
   col[i*3]=c.r;col[i*3+1]=c.g;col[i*3+2]=c.b;
  }
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(pos,3));g.setAttribute('color',new THREE.BufferAttribute(col,3));
  this.starfield=new THREE.Points(g,new THREE.PointsMaterial({size:.30,vertexColors:true,transparent:true,opacity:.88,sizeAttenuation:true,depthWrite:false}));
  this.scene.add(this.starfield);
  // Два напівпрозорі туманні світлові шари на далекому тлі
  const glow=makeGlowTexture();
  for(const [x,y,z,color,size,alpha] of [[-65,30,-110,'#214ba8',120,.15],[90,-25,-130,'#5f2774',130,.13]]){
   const m=new THREE.SpriteMaterial({map:glow,color,transparent:true,opacity:alpha,depthWrite:false,blending:THREE.AdditiveBlending});
   const s=new THREE.Sprite(m);s.position.set(x,y,z);s.scale.set(size,size,1);this.scene.add(s);
  }
 }
 createSun(){
  this.coreMaterial=makeSunMaterial();this.coronaMaterial=makeCoronaMaterial();
  this.starGroup=new THREE.Group();this.scene.add(this.starGroup);
  this.core=new THREE.Mesh(new THREE.SphereGeometry(1,80,64),this.coreMaterial);this.starGroup.add(this.core);
  this.corona=new THREE.Mesh(new THREE.SphereGeometry(1.18,64,48),this.coronaMaterial);this.starGroup.add(this.corona);
  this.halo=new THREE.Sprite(new THREE.SpriteMaterial({map:makeGlowTexture(),color:'#ffbc70',transparent:true,opacity:.72,blending:THREE.AdditiveBlending,depthWrite:false}));this.starGroup.add(this.halo);
  this.setStarVisual({color:'#ffc977',radius:1,kind:'main',luminosity:1});
 }
 createEvolutionEffects(){
  // Дві окремі системи частинок для протозоряного диска й розсіяної туманності.
  const rand=rng(7234);
  const nebCount=1700,nebPos=new Float32Array(nebCount*3),nebCol=new Float32Array(nebCount*3);
  for(let i=0;i<nebCount;i++){
   const theta=rand()*Math.PI*2,phi=Math.acos(2*rand()-1),r=2.0+Math.pow(rand(),.65)*5.2;
   nebPos[3*i]=Math.sin(phi)*Math.cos(theta)*r;
   nebPos[3*i+1]=Math.cos(phi)*r*.72;
   nebPos[3*i+2]=Math.sin(phi)*Math.sin(theta)*r;
   const co=new THREE.Color(i%3===0?'#6cc4f7':(i%3===1?'#b663d8':'#ff987a'));
   nebCol[3*i]=co.r;nebCol[3*i+1]=co.g;nebCol[3*i+2]=co.b;
  }
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.BufferAttribute(nebPos,3));geometry.setAttribute('color',new THREE.BufferAttribute(nebCol,3));
  this.nebula=new THREE.Points(geometry,new THREE.PointsMaterial({size:.18,vertexColors:true,transparent:true,opacity:.75,depthWrite:false,blending:THREE.AdditiveBlending}));
  this.scene.add(this.nebula);this.nebula.visible=false;
  const diskCount=1100,diskPos=new Float32Array(diskCount*3),diskCol=new Float32Array(diskCount*3);
  for(let i=0;i<diskCount;i++){
   const a=rand()*Math.PI*2,r=1.3+rand()*5.4;
   diskPos[3*i]=Math.cos(a)*r;diskPos[3*i+1]=(rand()-.5)*.3;diskPos[3*i+2]=Math.sin(a)*r;
   const c=new THREE.Color(rand()>.5?'#fa8f5f':'#9b72ed');diskCol[3*i]=c.r;diskCol[3*i+1]=c.g;diskCol[3*i+2]=c.b;
  }
  const dg=new THREE.BufferGeometry();dg.setAttribute('position',new THREE.BufferAttribute(diskPos,3));dg.setAttribute('color',new THREE.BufferAttribute(diskCol,3));
  this.disk=new THREE.Points(dg,new THREE.PointsMaterial({size:.12,vertexColors:true,transparent:true,opacity:.65,depthWrite:false,blending:THREE.AdditiveBlending}));
  this.scene.add(this.disk);this.disk.visible=false;
 }
 createSystem(){
  this.system=new THREE.Group();this.scene.add(this.system);this.planets=[];this.pickMeshes=[];
  const geo=new THREE.SphereGeometry(1,64,42);const cloudTex=makeCloudTexture();
  for(const [i,p] of PLANETS.entries()){
   const orbit=orbitLine(p.visualDistance,'#627eae',i<4?.31:.23);this.system.add(orbit);
   const pivot=new THREE.Group();pivot.rotation.y=i*.68+.4;this.system.add(pivot);
   const holder=new THREE.Group();holder.position.x=p.visualDistance;holder.position.y=.02;holder.rotation.z=p.orbitTilt;pivot.add(holder);
   const texture=makePlanetTexture(p);
   const mat=new THREE.MeshStandardMaterial({map:texture,roughness:p.type==='earth'?.76:.95,metalness:0});
   const mesh=new THREE.Mesh(geo,mat);mesh.scale.setScalar(p.visualRadius);mesh.rotation.z=(p.id==='uranus')?Math.PI*.48:(p.id==='earth'?.409:0);
   mesh.userData.planetId=p.id;holder.add(mesh);this.pickMeshes.push(mesh);
   if(p.type==='earth'){
    const cloud=new THREE.Mesh(geo,new THREE.MeshStandardMaterial({map:cloudTex,transparent:true,opacity:.56,depthWrite:false}));cloud.scale.setScalar(p.visualRadius*1.016);cloud.rotation.z=.409;holder.add(cloud);holder.userData.cloud=cloud;
   }
   if(p.id==='saturn'){
    const rings=new THREE.Mesh(new THREE.RingGeometry(1.22,2.14,160),ringMaterial());rings.rotation.x=-Math.PI*.40;
    rings.scale.setScalar(p.visualRadius);holder.add(rings);
   }
   if(p.id==='earth'){
    const moon=new THREE.Mesh(new THREE.SphereGeometry(.12,24,16),new THREE.MeshStandardMaterial({color:'#aeb0af',roughness:1}));
    const moonPivot=new THREE.Group();moon.position.x=.73;moonPivot.add(moon);holder.add(moonPivot);holder.userData.moonPivot=moonPivot;
   }
   this.planets.push({data:p,pivot,mesh,holder,angle:i*.68+.4});
  }
  // Пояс астероїдів: один InstancedMesh замість сотень draw calls.
  const rand=rng(57291), n=1250;
  const astMat=new THREE.MeshStandardMaterial({color:'#74716d',roughness:1,transparent:true,opacity:.68});
  const ast=new THREE.InstancedMesh(new THREE.IcosahedronGeometry(.075,0),astMat,n);
  const dummy=new THREE.Object3D();
  for(let i=0;i<n;i++){
   const a=rand()*Math.PI*2,r=12.4+rand()*2.35;dummy.position.set(Math.cos(a)*r,(rand()-.5)*.42,Math.sin(a)*r);
   dummy.scale.setScalar(.22+rand()*.7);dummy.rotation.set(rand(),rand(),rand());dummy.updateMatrix();ast.setMatrixAt(i,dummy.matrix);
  }
  ast.instanceMatrix.needsUpdate=true;this.system.add(ast);
 }
 setupLabels(){
  this.labelLayer=document.createElement('div');this.labelLayer.className='scene-labels';this.container.appendChild(this.labelLayer);
  const mk=(name,id)=>{
   const el=document.createElement('button');el.className='scene-label';el.textContent=name;el.type='button';
   el.addEventListener('click',()=>this.onPlanet(id));this.labelLayer.appendChild(el);return el;
  };
  this.labels=this.planets.map(x=>({...x,el:mk(x.data.name,x.data.id)}));
  this.sunLabel=mk('Сонце','sun');this.sunLabel.classList.add('sun-label');
 }
 bindInput(){
  const el=this.renderer.domElement;let start=null;
  el.addEventListener('pointerdown',e=>{if(e.button!==0&&e.pointerType==='mouse')return;start={x:e.clientX,y:e.clientY,az:this.azimuth,polar:this.polar,moved:false};el.setPointerCapture(e.pointerId);});
  el.addEventListener('pointermove',e=>{
   if(!start)return;const dx=e.clientX-start.x,dy=e.clientY-start.y;
   if(Math.abs(dx)+Math.abs(dy)>5)start.moved=true;
   this.azimuth=start.az-dx*.004;this.polar=clamp(start.polar+dy*.004,.14,Math.PI-.14);
  });
  el.addEventListener('pointerup',e=>{
   if(start&&!start.moved){const box=el.getBoundingClientRect();
    const p=new THREE.Vector2(((e.clientX-box.left)/box.width)*2-1,-((e.clientY-box.top)/box.height)*2+1);
    const ray=new THREE.Raycaster();ray.setFromCamera(p,this.camera);const hits=ray.intersectObjects(this.pickMeshes,false);
    if(hits.length)this.onPlanet(hits[0].object.userData.planetId);
   }start=null;
  });
  el.addEventListener('pointercancel',()=>start=null);
  el.addEventListener('wheel',e=>{e.preventDefault();this.desiredDistance=clamp(this.desiredDistance*Math.exp(e.deltaY*.001),3.4,140);},{passive:false});
 }
 resize(){const w=this.container.clientWidth||500,h=this.container.clientHeight||500;
  this.camera.aspect=w/h;this.camera.updateProjectionMatrix();this.renderer.setSize(w,h,false);
 }
 setStarVisual(s,preview=null){
  const radius=preview?.radius??s.radius;
  const color=preview?.visual==='nebula'?'#b5f7ff':preview?.visual==='supernova'?'#fff2bd':s.color;
  let visualRadius= s.id==='sun'&&!preview?1.85:clamp(1.05+Math.log10(Math.max(.004,radius))*.72,.52,4.5);
  if(preview?.visual==='supernova')visualRadius=4.3;
  if(preview?.visual==='cloud')visualRadius=.32;
  if(preview?.visual==='nebula')visualRadius=.58;
  if(this.nebula){
   this.nebula.visible=this.mode==='evolution'&&['cloud','nebula','supernova'].includes(preview?.visual);
   this.nebula.scale.setScalar(preview?.visual==='supernova'?1.6:(preview?.visual==='nebula'?1.15:1));
   this.nebula.material.opacity=preview?.visual==='supernova'?.96:.67;
   this.disk.visible=this.mode==='evolution'&&preview?.visual==='proto';
  }
  this.core.scale.setScalar(visualRadius);this.corona.scale.setScalar(visualRadius);
  this.halo.scale.set(visualRadius*4.9,visualRadius*4.9,1);
  this.coreMaterial.uniforms.uTint.value.set(color);
  this.coreMaterial.uniforms.uBrightness.value=preview?.visual==='remnant'?1.8:1.2;
  this.coronaMaterial.uniforms.uTint.value.set(color);
  this.halo.material.color.set(color);
  this.sunLight.color.set(color);
  this.sunLight.intensity=this.mode==='solar'?110:75;
  this.currentVisualRadius=visualRadius;
 }
 setMode(mode){
  this.mode=mode;this.system.visible=mode==='solar';
  this.labelLayer.style.display=mode==='solar'?'block':'none';
  this.setViewHome();
 }
 setViewHome(){this.focusPlanet=null;this.desiredTarget.set(0,0,0);this.desiredDistance=this.mode==='solar'?45:12;this.azimuth=.48;this.polar=1.08;}
 focus(id){
  if(this.mode!=='solar'){this.setViewHome();return;}
  if(id==='sun'){this.focusPlanet='sun';this.desiredTarget.set(0,0,0);this.desiredDistance=9;return;}
  const p=this.planets.find(x=>x.data.id===id);if(!p)return;
  p.mesh.getWorldPosition(this.desiredTarget);this.focusPlanet=id;
  this.desiredDistance=clamp(p.data.visualRadius*9,4.3,11);
 }
 setOrbitSpeed(v){this.speed=v;}
 updateLabels(){
  if(this.mode!=='solar')return;
  const w=this.container.clientWidth,h=this.container.clientHeight;
  for(const entry of this.labels){this.placeLabel(entry.el,entry.mesh.getWorldPosition(new THREE.Vector3()),w,h);}
  this.placeLabel(this.sunLabel,new THREE.Vector3(0,2.25,0),w,h);
 }
 placeLabel(el,pos,w,h){
  const p=pos.clone().project(this.camera);
  const show=p.z>-1&&p.z<1&&Math.abs(p.x)<1.12&&Math.abs(p.y)<1.12;
  el.style.display=show?'block':'none';if(!show)return;
  el.style.transform=`translate(-50%,-50%) translate(${Math.round((p.x*.5+.5)*w)}px,${Math.round((-.5*p.y+.5)*h)}px)`;
 }
 animate(now){
  const dt=Math.min((now-this.lastTime)/1000,.06);this.lastTime=now;this.elapsed+=dt;
  this.coreMaterial.uniforms.uTime.value=this.elapsed;this.coronaMaterial.uniforms.uTime.value=this.elapsed;
  this.core.rotation.y+=dt*.065;this.starfield.rotation.y+=dt*.00027;
  if(this.nebula?.visible){this.nebula.rotation.y+=dt*.011;this.nebula.rotation.z+=dt*.003;}
  if(this.disk?.visible)this.disk.rotation.y+=dt*.065;
  if(this.mode==='solar'){
   for(const p of this.planets){
    p.angle+=dt*.23*this.speed/Math.pow(p.data.period,.42);
    p.pivot.rotation.y=p.angle;p.mesh.rotation.y+=dt*(p.data.id==='venus'?-.09:.2);
    if(p.holder.userData.cloud)p.holder.userData.cloud.rotation.y+=dt*.1;
    if(p.holder.userData.moonPivot)p.holder.userData.moonPivot.rotation.y+=dt*.43*this.speed;
   }
   if(this.focusPlanet&&this.focusPlanet!=='sun'){
    const p=this.planets.find(x=>x.data.id===this.focusPlanet);
    if(p)p.mesh.getWorldPosition(this.desiredTarget);
   }
  }
  this.target.lerp(this.desiredTarget,1-Math.exp(-dt*3.2));
  this.distance+=(this.desiredDistance-this.distance)*(1-Math.exp(-dt*4));
  this.camera.position.set(this.target.x+this.distance*Math.sin(this.polar)*Math.sin(this.azimuth),this.target.y+this.distance*Math.cos(this.polar),this.target.z+this.distance*Math.sin(this.polar)*Math.cos(this.azimuth));
  this.camera.lookAt(this.target);this.updateLabels();this.renderer.render(this.scene,this.camera);
  this.raf=requestAnimationFrame(t=>this.animate(t));
 }
}
