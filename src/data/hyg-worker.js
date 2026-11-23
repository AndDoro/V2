/* Parsing HYG 4.0, Astronexus (CC BY-SA 4.0). Large download happens only on demand. */
const URLS=[
 'https://raw.githubusercontent.com/astronexus/HYG-Database/main/hyg/CURRENT/hygdata_v40.csv.gz',
 'https://cdn.jsdelivr.net/gh/astronexus/HYG-Database@main/hyg/CURRENT/hygdata_v40.csv.gz'
];
function csvRow(line){
 const result=[];let value='',quotes=false;
 for(let i=0;i<line.length;i++){
  const c=line[i];
  if(c==='"'){
   if(quotes&&line[i+1]==='"'){value+='"';i++;}else quotes=!quotes;
  }else if(c===','&&!quotes){result.push(value);value='';}
  else value+=c;
 }
 result.push(value);return result;
}
async function getText(){
 let last;
 for(const url of URLS){
  try{
   const response=await fetch(url,{cache:'force-cache'});
   if(!response.ok)throw Error(`HTTP ${response.status}`);
   postMessage({type:'status',message:'Архів отримано. Розпаковуємо 120 тисяч записів…'});
   if(!('DecompressionStream' in self))throw Error('Цей браузер не підтримує DecompressionStream (gzip). Оновіть Chrome або Edge.');
   const stream=response.body.pipeThrough(new DecompressionStream('gzip'));
   return await new Response(stream).text();
  }catch(e){last=e;}
 }
 throw new Error(`Не вдалося завантажити HYG. ${last?.message||'Помилка мережі'}`);
}
self.onmessage=async()=>{
 try{
  postMessage({type:'status',message:'Завантаження HYG 4.0 · приблизно 13 МБ…'});
  const text=await getText();
  postMessage({type:'status',message:'Індексуємо назви, класи й каталожні ідентифікатори…'});
  const lines=text.split(/\r?\n/);const heads=csvRow(lines[0]||'').map(s=>s.toLowerCase().trim());
  const idx=['id','proper','bf','hip','hd','gl','spect','lum','dist','absmag','mag','ci'].map(s=>heads.indexOf(s));
  if(idx[0]<0||idx[6]<0)throw Error('Формат даних HYG не відповідає очікуваному.');
  const rows=[];
  for(let i=1;i<lines.length;i++){
   const line=lines[i];if(!line)continue;
   const raw=csvRow(line);
   rows.push(idx.map(j=>j>=0?raw[j]||'':''));
  }
  postMessage({type:'data',rows});
 }catch(e){postMessage({type:'error',message:e.message||'Невідома помилка каталогу'});}
};
