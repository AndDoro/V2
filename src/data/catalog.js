/* Public HYG 4.0 catalogue, Astronexus / David Nash, CC BY-SA 4.0.
 * No fields are silently presented as precise measured temperatures or masses.
 * Archive is loaded on explicit user action, not on initial page load. */
import {STARS,STAR_BY_ID} from './stars.js';
const colorByType={O:'#93b9ff',B:'#a9ceff',A:'#e0ecff',F:'#fff1d3',G:'#ffe0a0',K:'#ffb477',M:'#ff7657',D:'#d5f4ff'};
const temperatures={O:35000,B:18000,A:9000,F:7200,G:5750,K:4500,M:3300,D:12000};
const numeric=(value)=>{const n=Number(value);return value!==null&&value!==''&&Number.isFinite(n)?n:null;};
function guessType(spect,lum){
 const sp=(spect||'').toUpperCase();
 if(/^D[ABOQZXC]/.test(sp)||/^WD/.test(sp))return {kind:'remnant',track:'remnant',phase:'Білий карлик (за спектром)',className:'Зоряний залишок'};
 if(/\b(IAB|IA|IB|II|III)\b/.test(sp)||/[OBAFGKM]\d?(?:III|II|IA|IB)/.test(sp)||lum>5000)return {kind:'giant',track:lum>10000?'massive':'solar',phase:'Зоря-гігант / надгігант (оцінка)',className:'Гігант або надгігант'};
 if(sp.startsWith('M')&&lum!=null&&lum<.12)return {kind:'main',track:'dwarf',phase:'Ймовірна головна послідовність',className:'Червоний карлик'};
 return {kind:'main',track:sp.startsWith('O')||sp.startsWith('B')?'massive':'solar',phase:'Еволюційна стадія не встановлена',className:'Каталожна зоря'};
}
const norm=s=>(s||'').toLocaleLowerCase('uk-UA').normalize('NFKD');
let loaded=false;
export function isLargeCatalogLoaded(){return loaded;}
export function addHygRows(rows){
 if(loaded)return 0;
 const start=STARS.length;
 const byName=new Map(STARS.filter(s=>s.track==='unknown').map(s=>[norm(s.name),s]));
 const curatedNames=new Set(STARS.filter(s=>s.track!=='unknown').flatMap(s=>[norm(s.other),norm(s.name)]));
 for(const [id,proper,bf,hip,hd,gl,spectral,lum,dist,absMag,mag,ci] of rows){
  const actualName=proper?.trim()||'';
  // Retain the pedagogical hand-curated entries as first results.
  if(actualName&&curatedNames.has(norm(actualName)))continue;
  const label=actualName||bf||(hip?`HIP ${hip}`:hd?`HD ${hd}`:`HYG ${id}`);
  const sp=spectral?.trim()||'—',key=sp[0]?.toUpperCase()||'?',m=numeric(mag),a=numeric(absMag),l=numeric(lum);
  const lValid=l!==null&&l>0&&l<1e10?l:null;
  const distancePc=numeric(dist);const distanceLy=distancePc&&distancePc>0&&distancePc<100000?distancePc*3.26156:null;
  const type=guessType(sp,lValid);const t=temperatures[key]??null;
  const sourceId=`hyg-${id}`;
  const aliases=[bf,hip?`HIP ${hip}`:null,hd?`HD ${hd}`:null,gl?`Gl ${gl}`:null,`HYG ${id}`].filter(Boolean);
  const s={id:sourceId,name:label,other:aliases.join(' · '),spectral:sp, ...type,
   temp:t,temperatureEstimated:t!==null,luminosity:lValid,luminosityEstimated:true,mass:null,radius:null,
   distance:distanceLy!==null?`≈ ${distanceLy.toLocaleString('uk-UA',{maximumFractionDigits:1})} св. року`:'Немає надійного значення',
   distanceLy,absoluteMagnitude:a,apparentMagnitude:m,color:colorByType[key]||'#cad7e7',accent:colorByType[key]||'#cad7e7',
   named:!!actualName,source:'HYG v4.0',
   blurb:'Запис зі зоряного каталогу HYG. Не для кожного об’єкта встановлено масу, радіус і точну еволюційну стадію.',
   fact:`Позначення: ${aliases.join(', ')||'HYG '+id}. Температура, якщо показана, є орієнтиром за спектральною літерою. Світність у HYG — наближена каталожна оцінка; це не виміряний еволюційний трек.`
  };
  const named=actualName?byName.get(norm(actualName)):null;
  if(named){
   const keepId=named.id;
   Object.assign(named,s,{id:keepId});
   byName.delete(norm(actualName));
  }else{STARS.push(s);STAR_BY_ID[sourceId]=s;}
 }
 loaded=true;return STARS.length-start;
}
export function loadHYG(onStatus=()=>{}){
 return new Promise((resolve,reject)=>{
  if(loaded){resolve({added:0,total:STARS.length});return;}
  const worker=new Worker(new URL('./hyg-worker.js',import.meta.url),{type:'module'});
  const timeout=setTimeout(()=>{worker.terminate();reject(new Error('Перевищено час завантаження великого каталогу. Перевірте підключення та спробуйте пізніше.'));},120000);
  worker.onmessage=({data})=>{
   if(data.type==='status'){onStatus(data.message);return;}
   clearTimeout(timeout);worker.terminate();
   if(data.type==='error'){reject(new Error(data.message));return;}
   try{const added=addHygRows(data.rows);resolve({added,total:STARS.length,sourceCount:data.rows.length});}
   catch(err){reject(err);}
  };
  worker.onerror=e=>{clearTimeout(timeout);worker.terminate();reject(new Error('Не вдалося опрацювати архів каталогу.'));};
  worker.postMessage({type:'load'});
 });
}
export function searchStar(star,query){
 if(!query)return true;
 return norm(`${star.name} ${star.other} ${star.spectral} ${star.id}`).includes(norm(query));
}
