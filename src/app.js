import {STARS,STAR_BY_ID,fmtNumber} from './data/stars.js';
import './data/named-stars.js';
import {loadHYG,searchStar} from './data/catalog.js';
import {PLANETS,PLANET_BY_ID} from './data/planets.js';
import {getTrack,getStage} from './science/evolution.js';
import {HRDiagram} from './ui/hr.js';
import {StarScene} from './visual/scene.js';

const $=id=>document.getElementById(id);
const state={mode:'solar',star:STAR_BY_ID.sun,selectedPlanet:null,progress:46,orbitSpeed:1,playing:true,evolutionSpeed:1,filter:'all',search:'',listLimit:60,loading:false};
const fmt=x=>x==null?'—':fmtNumber(x);
const starList=$('starList'),planetStrip=$('planetStrip');
const hr=new HRDiagram($('hrCanvas'),selectStar);
let scene;
function setPlayState(value){
 state.playing=!!value;
 const play=$('playButton');play.textContent=state.playing?'❚❚':'▶';play.title=state.playing?'Призупинити':'Відтворити';play.setAttribute('aria-label',play.title);
 if(scene&&state.mode==='solar')scene.setOrbitSpeed(state.playing?state.orbitSpeed:0);
}
function paintSlider(){
 const el=$('mainSlider'),min=Number(el.min),max=Number(el.max),percent=(Number(el.value)-min)/(max-min)*100;
 el.style.setProperty('--progress',`${Math.min(100,Math.max(0,percent))}%`);
}
function filteredStars(){
 const q=state.search.trim().toLocaleLowerCase('uk-UA').normalize('NFKD');
 return STARS.filter(s=>(state.filter==='all'||(state.filter==='named'?s.named!==false:s.kind===state.filter))&&searchStar(s,q));
}
function renderStars(){
 const items=filteredStars();const show=items.slice(0,state.listLimit);
 $('starCount').textContent=`${items.length.toLocaleString('uk-UA')} / ${STARS.length.toLocaleString('uk-UA')}`;
 starList.replaceChildren();
 if(!show.length){const msg=document.createElement('p');msg.className='empty-search';msg.textContent='За таким запитом зір не знайдено. Спробуйте іншу назву, HIP, HD або HYG.';starList.appendChild(msg);return;}
 const fragment=document.createDocumentFragment();
 for(const s of show){
  const item=document.createElement('button');item.className='star-item'+(s.id===state.star.id?' selected':'');item.type='button';item.dataset.star=s.id;
  const symbol=document.createElement('span');symbol.className='star-symbol';symbol.style.setProperty('--star-color',s.color);symbol.textContent='✦';
  const mid=document.createElement('span');mid.className='star-labels';
  const name=document.createElement('strong');name.textContent=s.name;
  const cls=document.createElement('small');cls.textContent=s.source==='HYG v4.0'?(s.other||s.className):s.className;
  mid.append(name,cls);
  const type=document.createElement('span');type.className='spectral-tag';type.textContent=s.spectral;
  item.append(symbol,mid,type);item.addEventListener('click',()=>selectStar(s.id));fragment.appendChild(item);
 }
 if(items.length>show.length){
  const more=document.createElement('button');more.type='button';more.className='more-stars';more.textContent=`Показати ще · залишилося ${(items.length-show.length).toLocaleString('uk-UA')}`;
  more.addEventListener('click',()=>{state.listLimit+=60;renderStars();});fragment.appendChild(more);
 }
 starList.appendChild(fragment);
}
function buildPlanetStrip(){
 planetStrip.replaceChildren();for(const p of PLANETS){
  const btn=document.createElement('button');btn.className='planet-chip';btn.dataset.planet=p.id;btn.type='button';
  const dot=document.createElement('span');dot.className='planet-dot';dot.style.background=p.color;
  const name=document.createElement('span');name.textContent=p.name;btn.append(dot,name);
  btn.addEventListener('click',()=>selectPlanet(p.id));planetStrip.appendChild(btn);
 }
}
function statTile(label,value){
 const c=document.createElement('div');c.className='stat-cell';const l=document.createElement('span');l.textContent=label;
 const v=document.createElement('strong');v.textContent=value;c.append(l,v);return c;
}
function showInspector(){
 const p=state.mode==='solar'&&state.selectedPlanet?PLANET_BY_ID[state.selectedPlanet]:null,s=state.star;
 $('inspectorEyebrow').textContent=p?'ПЛАНЕТА СОНЯЧНОЇ СИСТЕМИ':'ДАНІ ПРО ЗОРЮ';
 $('inspectorIcon').textContent=p?'●':(s.id==='sun'?'☀':'✦');$('inspectorIcon').style.color=p?p.color:s.accent;
 $('inspectorName').textContent=p?p.name:s.name;
 $('inspectorType').textContent=p?'Планета · Сонячна система':`${s.className} · ${s.spectral}`;
 const grid=$('statsGrid');grid.replaceChildren();
 if(p){
  grid.append(statTile('ВІДСТАНЬ ВІД СОНЦЯ',`${fmt(p.au)} а.о.`),statTile('ДІАМЕТР',`${fmt(p.diameter)} км`),statTile('РІК',`${fmt(p.period)} земних`),statTile('ТИП',p.type==='rock'||['mars','earth','venus'].includes(p.type)?'Кам’яниста':'Гігант'));
  $('inspectorDescription').textContent=p.description;
  $('inspectorExtra').textContent='Орбіти, відносні розміри й швидкості анімації змінені для наочності; це не фізично точна модель масштабу.';
 }else{
  grid.append(statTile(s.temperatureEstimated?'ТЕМП. ЗА СПЕКТРОМ (≈)':'ТЕМПЕРАТУРА',s.temp?`${fmt(s.temp)} K`:'Не визначено'),statTile(s.luminosityEstimated?'СВІТНІСТЬ HYG (≈)':'СВІТНІСТЬ',s.luminosity!=null?`${fmt(s.luminosity)} L☉`:'Немає даних'),statTile('РАДІУС',s.radius!=null?`${fmt(s.radius)} R☉`:'Немає даних'),statTile('МАСА',s.mass!=null?`${fmt(s.mass)} M☉`:'Немає даних'));
  $('inspectorDescription').textContent=s.blurb;
  $('inspectorExtra').textContent=`${s.fact} Відстань: ${s.distance}. Джерело: ${s.source||'Довідкові астрономічні оцінки'}. Під час анімації тут зберігаються каталожні дані, а в центрі показано умовний етап.`;
 }
 for(const b of planetStrip.querySelectorAll('.planet-chip'))b.classList.toggle('active',!!p&&b.dataset.planet===p.id);
}
function selectPlanet(id){
 if(state.mode!=='solar')setMode('solar');state.selectedPlanet=id==='sun'?null:id;
 showInspector();scene.focus(id);closeMobileMenu();
}
function preferredProgress(s){
 if(s.kind==='remnant')return 25;if(s.kind==='giant')return s.track==='massive'?66:80;
 return s.track==='massive'?35:s.track==='dwarf'?43:46;
}
function selectStar(id){
 const star=STAR_BY_ID[id];if(!star)return;
 state.star=star;state.selectedPlanet=null;state.progress=preferredProgress(star);
 setMode('evolution');setPlayState(false);renderStars();showInspector();closeMobileMenu();
}
function buildStagePips(){
 const holder=$('stagePips');holder.replaceChildren();const track=getTrack(state.star);
 track.forEach((part,i)=>{
  const b=document.createElement('button');b.type='button';b.className='stage-pip';
  b.title=`${i+1}. ${part.stage}`;b.setAttribute('aria-label',`${i+1}. ${part.stage}`);b.dataset.at=String(part.at);
  b.addEventListener('click',()=>seekStage(i));holder.appendChild(b);
 });
}
function updateEvolution(){
 const stage=getStage(state.star,state.progress),track=getTrack(state.star);
 const idx=Math.max(0,track.indexOf(track.find(p=>p.stage===stage.stage)));
 $('stageNumber').textContent=`ЕТАП ${idx+1} / ${track.length}`;
 $('stageName').textContent=stage.stage;
 $('stageDescription').textContent=stage.text;
 $('sliderValue').textContent=state.progress.toFixed(1).replace('.',',')+'%';
 $('mainSlider').value=state.progress;paintSlider();
 for(const b of $('stagePips').children){
  const at=Number(b.dataset.at),active=at<=state.progress&&(!b.nextElementSibling||state.progress<Number(b.nextElementSibling.dataset.at));
  b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));
 }
 $('prevStage').disabled=idx===0&&state.progress===0;
 $('nextStage').disabled=idx===track.length-1;
 scene.setStarVisual(state.star,stage);hr.setState(state.star.id,stage);
}
function seekStage(i){
 const track=getTrack(state.star),target=track[Math.max(0,Math.min(i,track.length-1))];
 state.progress=target.at;setPlayState(false);updateEvolution();
}
function stepStage(dir){
 const track=getTrack(state.star),p=state.progress;
 if(dir>0){const next=track.find(st=>st.at>p+0.05);seekStage(next?track.indexOf(next):track.length-1);}
 else{const currentIdx=track.findLastIndex(st=>st.at<=p+.05);
  const atCurrent=Math.abs((track[currentIdx]?.at??0)-p)<.05;
  seekStage(atCurrent?Math.max(0,currentIdx-1):Math.max(0,currentIdx));
 }
}
function setMode(mode){
 state.mode=mode;
 if(mode==='solar'){
  state.star=STAR_BY_ID.sun;state.selectedPlanet=null;
  $('sceneEyebrow').textContent='ВІДКРИВАЙ НАШ КОСМОС';
  $('sceneTitle').innerHTML='Наша Сонячна система<span class="headline-point">.</span>';
  $('sceneSubtitle').textContent='Сонце, вісім планет, орбіти та анімований космічний простір.';
  $('currentModeText').textContent='Сонячна система';$('dockOverline').textContent='РУХ ПЛАНЕТ';$('dockTitle').textContent='Орбітальна симуляція';
  $('sliderLabel').textContent='КОЕФІЦІЄНТ ШВИДКОСТІ';
  Object.assign($('mainSlider'),{min:'0',max:'5',step:'0.1',value:String(state.orbitSpeed)});
  $('sliderEndpoints').innerHTML='<span>Зупинено ×0</span><span>Прискорено ×5</span>';
  $('sliderValue').textContent='×'+state.orbitSpeed.toFixed(1).replace('.',',');
  $('planetStrip').classList.remove('hidden');$('evolutionDisplay').classList.add('hidden');$('evolutionNote').classList.add('hidden');$('evolutionSpeed').classList.add('hidden');$('stageNavigation').classList.add('hidden');
  $('scaleNote').textContent='Розміри, відстані та тривалість обертів показані не в одному масштабі.';
  scene.setMode('solar');scene.setStarVisual(state.star);setPlayState(true);
  hr.setState(state.star.id,null);
 }else{
  const s=state.star;
  $('sceneEyebrow').textContent='НАВЧАЛЬНА МОДЕЛЬ ЕВОЛЮЦІЇ';
  $('sceneTitle').textContent=s.name+'.';
  $('sceneSubtitle').textContent=`${s.spectral} · ${s.phase} · ${s.distance}`;
  $('currentModeText').textContent='Еволюція зорі';$('dockOverline').textContent='ЖИТТЄВИЙ ЦИКЛ';$('dockTitle').textContent='Навчальний сценарій';
  $('sliderLabel').textContent='УМОВНИЙ ПРОГРЕС';
  Object.assign($('mainSlider'),{min:'0',max:'100',step:'0.25',value:String(state.progress)});
  $('sliderEndpoints').innerHTML='<span>Початок формування</span><span>Умовний фінал</span>';
  $('planetStrip').classList.add('hidden');$('evolutionDisplay').classList.remove('hidden');$('evolutionNote').classList.remove('hidden');$('evolutionSpeed').classList.remove('hidden');$('stageNavigation').classList.remove('hidden');
  $('scaleNote').textContent='Навчальний трек не є фізично точним прогнозом для цієї зорі.';
  scene.setMode('evolution');buildStagePips();setPlayState(false);updateEvolution();
 }
 paintSlider();
 const unknown=mode==='evolution'&&state.star.track==='unknown';
 $('mainSlider').disabled=unknown;$('playButton').disabled=unknown;$('evolutionSpeed').disabled=unknown;
 if(unknown)$('evolutionNoteText').textContent='ⓘ Для цієї зорі ще немає надійних фізичних характеристик. Завантажте каталог HYG. Нейтральне зображення — умовний символ, а не модель реальної зорі.';
 else $('evolutionNoteText').textContent='ⓘ Етапи умовні, нерівні за реальною тривалістю. Еволюція моделюється за типом зорі, а не прогнозується для конкретного об’єкта.';
 for(const b of document.querySelectorAll('.mode-tab')){const on=b.dataset.mode===mode;b.classList.toggle('active',on);b.setAttribute('aria-pressed',String(on));}
 showInspector();renderStars();
}
function reset(){
 if(state.mode==='solar'){
  state.orbitSpeed=1;state.selectedPlanet=null;scene.setViewHome();setMode('solar');
 }else{state.progress=0;setPlayState(false);updateEvolution();}
}
function togglePlay(){
 if(state.mode==='evolution'&&state.star.track==='unknown')return;
 if(state.mode==='evolution'&&state.progress>=100){state.progress=0;updateEvolution();}
 if(state.mode==='solar'&&!state.playing&&state.orbitSpeed===0){state.orbitSpeed=1;$('mainSlider').value=1;$('sliderValue').textContent='×1,0';paintSlider();}
 setPlayState(!state.playing);
}
function openMobileMenu(){document.body.classList.add('mobile-nav-open');$('mobileOverlay').hidden=false;}
function closeMobileMenu(){document.body.classList.remove('mobile-nav-open');$('mobileOverlay').hidden=true;}
try{
 scene=new StarScene($('viewport'),selectPlanet);
 $('sceneLoading').classList.add('hidden');
}catch(e){$('sceneLoading').innerHTML='<strong>Не вдалося запустити 3D-сцену</strong><span>Потрібні WebGL і доступ до Three.js. Перевірте інтернет та апаратне прискорення Chrome/Edge.</span>';throw e;}

buildPlanetStrip();$('catalogStatus').textContent=`${STARS.length.toLocaleString('uk-UA')} локальних записів, із них 9 докладних навчальних карток. Розширення HYG — ≈120 тис. зір.`;setMode('solar');
let searchTimer;
$('searchStars').addEventListener('input',e=>{state.search=e.target.value;state.listLimit=60;clearTimeout(searchTimer);searchTimer=setTimeout(renderStars,140);});
for(const b of $('starFilters').querySelectorAll('button'))b.addEventListener('click',()=>{
 state.filter=b.dataset.filter;state.listLimit=60;
 for(const x of $('starFilters').querySelectorAll('button'))x.classList.toggle('active',x===b);
 renderStars();
});
$('loadCatalog').addEventListener('click',async()=>{
 if(state.loading)return;state.loading=true;const button=$('loadCatalog'),status=$('catalogStatus');
 button.disabled=true;button.textContent='◌ Завантаження…';
 try{
  const result=await loadHYG(msg=>status.textContent=msg);
  status.textContent=`Готово: ${result.added.toLocaleString('uk-UA')} нових записів. Пошук: HIP, HD, назва або HYG ID.`;
  button.textContent=`✓ HYG завантажено · ${result.added.toLocaleString('uk-UA')}`;
  renderStars();hr.draw();if(state.mode==='evolution'){buildStagePips();updateEvolution();const unknown=state.star.track==='unknown';$('mainSlider').disabled=unknown;$('playButton').disabled=unknown;$('evolutionSpeed').disabled=unknown;$('evolutionNoteText').textContent=unknown?'ⓘ Для цієї зорі поки немає підтверджених фізичних параметрів.':'ⓘ Шкала є умовною навчальною моделлю, не індивідуальним прогнозом.';}showInspector();
 }catch(e){button.disabled=false;button.textContent='↻ Повторити завантаження HYG';status.textContent=e.message;}
 finally{state.loading=false;}
});
$('solarBtn').addEventListener('click',()=>setMode('solar'));
$('evolutionBtn').addEventListener('click',()=>{if(state.mode!=='evolution'){state.progress=preferredProgress(state.star);setMode('evolution');}});
$('mainSlider').addEventListener('input',e=>{
 if(state.mode==='solar'){
  state.orbitSpeed=Number(e.target.value);$('sliderValue').textContent='×'+state.orbitSpeed.toFixed(1).replace('.',',');
  scene.setOrbitSpeed(state.playing?state.orbitSpeed:0);
 }else{state.progress=Number(e.target.value);setPlayState(false);updateEvolution();}
 paintSlider();
});
$('playButton').addEventListener('click',togglePlay);
$('resetButton').addEventListener('click',reset);
$('prevStage').addEventListener('click',()=>stepStage(-1));
$('nextStage').addEventListener('click',()=>stepStage(1));
$('evolutionSpeed').addEventListener('change',e=>state.evolutionSpeed=Number(e.target.value));
$('resetCamera').addEventListener('click',()=>scene.setViewHome());
$('cameraHome').addEventListener('click',()=>scene.setViewHome());
$('rotateLeft').addEventListener('click',()=>scene.rotate(-.3));
$('rotateRight').addEventListener('click',()=>scene.rotate(.3));
$('zoomIn').addEventListener('click',()=>scene.zoom(.76));
$('zoomOut').addEventListener('click',()=>scene.zoom(1.3));
$('fullScreen').addEventListener('click',()=>{if(document.fullscreenElement)document.exitFullscreen?.();else document.documentElement.requestFullscreen?.().catch(()=>{});});
$('menuBtn').addEventListener('click',openMobileMenu);$('mobileOverlay').addEventListener('click',closeMobileMenu);
$('toggleInspector').addEventListener('click',()=>{
 const col=$('inspector').classList.toggle('collapsed');$('toggleInspector').textContent=col?'+':'−';$('toggleInspector').setAttribute('aria-expanded',String(!col));
});
$('hrDetails').addEventListener('toggle',()=>hr.draw());
document.addEventListener('keydown',e=>{
 if(e.target.matches('input,textarea,select')){if(e.key==='Escape')e.target.blur();return;}
 if(e.key==='/'){e.preventDefault();$('searchStars').focus();if(window.innerWidth<730)openMobileMenu();}
 if(e.code==='Space'){e.preventDefault();togglePlay();}
 if(e.key==='ArrowLeft'&&state.mode==='evolution'){e.preventDefault();stepStage(-1);}
 if(e.key==='ArrowRight'&&state.mode==='evolution'){e.preventDefault();stepStage(1);}
 if(e.key==='Escape')closeMobileMenu();
});
let last=performance.now();function tick(now){
 const dt=Math.min((now-last)/1000,.08);last=now;
 if(state.mode==='evolution'&&state.playing){
  state.progress=Math.min(100,state.progress+dt*state.evolutionSpeed*2.2);updateEvolution();
  if(state.progress>=100)setPlayState(false);
 }
 requestAnimationFrame(tick);
}requestAnimationFrame(tick);
