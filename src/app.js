import {STARS,STAR_BY_ID,fmtNumber} from './data/stars.js';
import {PLANETS,PLANET_BY_ID} from './data/planets.js';
import {getTrack,getStage} from './science/evolution.js';
import {HRDiagram} from './ui/hr.js';
import {StarScene} from './visual/scene.js';

const $=id=>document.getElementById(id);
const state={mode:'solar',star:STAR_BY_ID.sun,selectedPlanet:null,progress:46,orbitSpeed:1,playing:true,evolutionSpeed:1,filter:'all',search:''};
const fmt=x=>fmtNumber(x);
const stagePositions={sun:46,proxima:47,alpha:46,sirius:45,vega:46,arcturus:81,betelgeuse:76,rigel:70,'sirius-b':40};
const starList=$('starList'),planetStrip=$('planetStrip');
let scene;
function renderStars(){
 starList.replaceChildren();const f=state.filter,term=state.search.trim().toLocaleLowerCase('uk');
 const stars=STARS.filter(s=>(f==='all'||s.kind===f)&&(!term||`${s.name} ${s.other} ${s.spectral}`.toLocaleLowerCase('uk').includes(term)));
 $('starCount').textContent=`${stars.length} З ${STARS.length}`;
 if(!stars.length){const msg=document.createElement('p');msg.className='empty-search';msg.textContent='Зір не знайдено. Спробуйте змінити пошук.';starList.appendChild(msg);return;}
 for(const s of stars){
  const item=document.createElement('button');item.className='star-item'+(s.id===state.star.id?' selected':'');item.type='button';item.dataset.star=s.id;
  const symbol=document.createElement('span');symbol.className='star-symbol';symbol.style.setProperty('--star-color',s.color);symbol.textContent='✦';
  const mid=document.createElement('span');mid.className='star-labels';
  const name=document.createElement('strong');name.textContent=s.name;
  const cls=document.createElement('small');cls.textContent=s.className;
  mid.append(name,cls);
  const type=document.createElement('span');type.className='spectral-tag';type.textContent=s.spectral;
  item.append(symbol,mid,type);item.addEventListener('click',()=>selectStar(s.id));starList.appendChild(item);
 }
}
function buildPlanetStrip(){
 planetStrip.replaceChildren();
 for(const p of PLANETS){const btn=document.createElement('button');btn.className='planet-chip';btn.dataset.planet=p.id;
  const dot=document.createElement('span');dot.className='planet-dot';dot.style.background=p.color;
  const name=document.createElement('span');name.textContent=p.name;btn.append(dot,name);
  btn.addEventListener('click',()=>selectPlanet(p.id));planetStrip.appendChild(btn);
 }
}
function statTile(label,value){return `<div class="stat-cell"><span>${label}</span><strong>${value}</strong></div>`;}
function showInspector(){
 const p=state.selectedPlanet?PLANET_BY_ID[state.selectedPlanet]:null;
 const s=state.star;
 $('inspectorEyebrow').textContent=p?'ПЛАНЕТА СОНЯЧНОЇ СИСТЕМИ':'ОБРАНА ЗОРЯ';
 $('inspectorIcon').textContent=p?'●':(s.id==='sun'?'☀':'✦');
 $('inspectorIcon').style.color=p?p.color:s.accent;
 $('inspectorName').textContent=p?p.name:s.name;
 $('inspectorType').textContent=p?'Планета · Сонячна система':`${s.className} · ${s.spectral}`;
 if(p){
  $('statsGrid').innerHTML=statTile('ВІДСТАНЬ ВІД СОНЦЯ',`${fmt(p.au)} а.о.`)+statTile('ДІАМЕТР',`${fmt(p.diameter)} км`)+statTile('РІК',`${fmt(p.period)} земних`)+statTile('ТИП ПОВЕРХНІ',p.type==='rock'||p.type==='mars'||p.type==='earth'||p.type==='venus'?'Кам’яниста':'Гігант');
  $('inspectorDescription').textContent=p.description;
  $('inspectorExtra').textContent='Дані округлено. Масштаб візуальних радіусів і орбіт змінено, щоб можна було одночасно роздивитися всі планети.';
 }else{
  $('statsGrid').innerHTML=statTile('ТЕМПЕРАТУРА',`${fmt(s.temp)} K`)+statTile('СВІТНІСТЬ',`${fmt(s.luminosity)} L☉`)+statTile('РАДІУС',`${fmt(s.radius)} R☉`)+statTile('МАСА',`${fmt(s.mass)} M☉`);
  $('inspectorDescription').textContent=s.blurb;
  $('inspectorExtra').textContent=`${s.fact} Відстань: ${s.distance}. Числові параметри орієнтовні; для надгігантів похибка особливо велика. Параметри цього блоку є поточною спостережуваною оцінкою і не змінюються під час анімації умовного сценарію.`;
 }
 for(const b of planetStrip.querySelectorAll('.planet-chip'))b.classList.toggle('active',!!p&&b.dataset.planet===p.id);
}
function selectPlanet(id){
 if(state.mode!=='solar')setMode('solar');
 state.selectedPlanet=id==='sun'?null:id;showInspector();scene.focus(id);
 if(window.innerWidth<730)closeMobileMenu();
}
function selectStar(id){
 state.star=STAR_BY_ID[id]||STAR_BY_ID.sun;state.selectedPlanet=null;
 state.progress=stagePositions[state.star.id]??45;
 state.playing=false;
 setMode('evolution');renderStars();showInspector();closeMobileMenu();
}
function setMode(mode){
 state.mode=mode;
 if(mode==='solar'){
  state.star=STAR_BY_ID.sun;state.selectedPlanet=null;
  $('sceneEyebrow').textContent='ДОСЛІДЖУЙ КОСМОС';
  $('sceneTitle').innerHTML='Наша Сонячна система<span class="headline-point">.</span>';
  $('sceneSubtitle').textContent='Сонце, вісім планет та їхні орбіти в інтерактивному 3D-просторі.';
  $('currentModeText').textContent='Сонячна система';$('dockOverline').textContent='ОРБІТАЛЬНА СИМУЛЯЦІЯ';$('dockTitle').textContent='Рух планет';
  $('sliderLabel').textContent='ШВИДКІСТЬ ОБЕРТАННЯ';$('mainSlider').min=0;$('mainSlider').max=5;$('mainSlider').step=.1;$('mainSlider').value=state.orbitSpeed;
  $('sliderEndpoints').innerHTML='<span>Пауза</span><span>Прискорення ×5</span>';
  $('sliderValue').textContent='×'+state.orbitSpeed.toFixed(1);
  $('planetStrip').classList.remove('hidden');$('evolutionDisplay').classList.add('hidden');$('evolutionNote').classList.add('hidden');$('evolutionSpeed').classList.add('hidden');
  $('scaleNote').textContent='Відстані, розміри та швидкості в 3D-сцені не збережені в одному масштабі.';
  scene.setMode('solar');scene.setStarVisual(state.star);state.playing=true;scene.setOrbitSpeed(state.orbitSpeed);
 }else{
  const s=state.star;
  $('sceneEyebrow').textContent='АТЛАС ЗОРЯНОЇ ЕВОЛЮЦІЇ';
  $('sceneTitle').textContent=s.name+'.';
  $('sceneSubtitle').textContent=`${s.spectral} · ${s.phase} · ${s.distance}`;
  $('currentModeText').textContent='Еволюція зорі';$('dockOverline').textContent='НАВЧАЛЬНИЙ СЦЕНАРІЙ';$('dockTitle').textContent='Життєвий шлях зорі';
  $('sliderLabel').textContent='УМОВНА ШКАЛА ЕВОЛЮЦІЇ';$('mainSlider').min=0;$('mainSlider').max=100;$('mainSlider').step=.25;$('mainSlider').value=state.progress;
  $('sliderEndpoints').innerHTML='<span>Формування</span><span>Далекий фінал</span>';
  $('planetStrip').classList.add('hidden');$('evolutionDisplay').classList.remove('hidden');$('evolutionNote').classList.remove('hidden');$('evolutionSpeed').classList.remove('hidden');
  $('scaleNote').textContent='Еволюційний сценарій умовний; анімація не відображає реальних часових інтервалів.';
  scene.setMode('evolution');updateEvolution();
 }
 for(const b of document.querySelectorAll('.mode-tab')){const on=b.dataset.mode===mode;b.classList.toggle('active',on);b.setAttribute('aria-pressed',on?'true':'false');}
 $('playButton').textContent=state.playing?'Ⅱ':'▶';$('playButton').setAttribute('aria-label',state.playing?'Призупинити':'Відтворити');
 showInspector();renderStars();
}
function updateEvolution(){
 const s=state.star,stage=getStage(s,state.progress),track=getTrack(s);
 const idx=track.findIndex(st=>st.stage===stage.stage)+1;
 $('stageNumber').textContent=`ЕТАП ${idx} / ${track.length}`;
 $('stageName').textContent=stage.stage;
 $('stageDescription').textContent=stage.text;
 $('sliderValue').textContent=state.progress.toFixed(1).replace('.',',')+'%';
 $('mainSlider').value=state.progress;
 scene.setStarVisual(s,stage);
 hr.setState(s.id,stage);
}
function reset(){
 if(state.mode==='solar'){scene.setViewHome();state.orbitSpeed=1;state.playing=true;setMode('solar');}
 else{state.progress=0;state.playing=false;updateEvolution();$('playButton').textContent='▶';$('playButton').setAttribute('aria-label','Відтворити');}
}
function togglePlay(){
 state.playing=!state.playing;$('playButton').textContent=state.playing?'Ⅱ':'▶';$('playButton').setAttribute('aria-label',state.playing?'Призупинити':'Відтворити');
 if(state.mode==='solar')scene.setOrbitSpeed(state.playing?state.orbitSpeed:0);
}
function openMobileMenu(){document.body.classList.add('mobile-nav-open');$('mobileOverlay').hidden=false;}
function closeMobileMenu(){document.body.classList.remove('mobile-nav-open');$('mobileOverlay').hidden=true;}
const hr=new HRDiagram($('hrCanvas'),selectStar);
try{
 scene=new StarScene($('viewport'),selectPlanet);
 $('sceneLoading').classList.add('hidden');
}catch(e){$('sceneLoading').innerHTML='<strong>Не вдалося запустити 3D-візуалізацію</strong><span>Перевірте підтримку WebGL і роботу інтернету. У браузері має бути ввімкнене апаратне прискорення.</span>';throw e;}

buildPlanetStrip();setMode('solar');hr.setState('sun',null);
$('searchStars').addEventListener('input',e=>{state.search=e.target.value;renderStars();});
for(const b of $('starFilters').querySelectorAll('button'))b.addEventListener('click',()=>{state.filter=b.dataset.filter;for(const x of $('starFilters').querySelectorAll('button'))x.classList.toggle('active',x===b);renderStars();});
$('solarBtn').addEventListener('click',()=>setMode('solar'));
$('evolutionBtn').addEventListener('click',()=>{if(state.mode!=='evolution'){state.progress=stagePositions[state.star.id]??46;state.playing=false;setMode('evolution');}});
$('mainSlider').addEventListener('input',e=>{
 if(state.mode==='solar'){state.orbitSpeed=+e.target.value;$('sliderValue').textContent='×'+state.orbitSpeed.toFixed(1);scene.setOrbitSpeed(state.playing?state.orbitSpeed:0);}
 else{state.progress=+e.target.value;state.playing=false;$('playButton').textContent='▶';updateEvolution();}
});
$('playButton').addEventListener('click',togglePlay);
$('resetButton').addEventListener('click',reset);
$('evolutionSpeed').addEventListener('change',e=>state.evolutionSpeed=+e.target.value);
$('resetCamera').addEventListener('click',()=>scene.setViewHome());
$('fullScreen').addEventListener('click',()=>{if(document.fullscreenElement)document.exitFullscreen();else document.documentElement.requestFullscreen?.();});
$('menuBtn').addEventListener('click',openMobileMenu);$('mobileOverlay').addEventListener('click',closeMobileMenu);
$('toggleInspector').addEventListener('click',()=>{
 const col=$('inspector').classList.toggle('collapsed');$('toggleInspector').textContent=col?'+':'−';$('toggleInspector').setAttribute('aria-expanded',String(!col));
});
document.addEventListener('keydown',e=>{
 if(e.target.matches('input,textarea,select')){if(e.key==='Escape')e.target.blur();return;}
 if(e.key==='/'){e.preventDefault();$('searchStars').focus();if(window.innerWidth<730)openMobileMenu();}
 if(e.code==='Space'){e.preventDefault();togglePlay();}
 if(e.key==='Escape')closeMobileMenu();
});
let last=performance.now();function tick(now){const dt=Math.min((now-last)/1000,.08);last=now;
 if(state.mode==='evolution'&&state.playing){state.progress=Math.min(100,state.progress+dt*state.evolutionSpeed*2.2);updateEvolution();if(state.progress>=100)togglePlay();}
 requestAnimationFrame(tick);
}requestAnimationFrame(tick);
