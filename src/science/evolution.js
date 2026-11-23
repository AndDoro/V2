/* НАВЧАЛЬНІ СХЕМИ, не чисельне розв'язання рівнянь еволюції.
   Положення на шкалі умовне і не пропорційне фізичній тривалості стадій. */
const solar = [
 {at:0, stage:'Молекулярна хмара', text:'Гравітація стискає фрагмент газопилової хмари. Майбутня зоря ще не має стабільного ядра.', temp:2500, luminosity:.1, radius:8, visual:'cloud'},
 {at:14, stage:'Протозоря', text:'Речовина ущільнюється, температура зростає; енергія випромінювання походить переважно від гравітаційного стискання.',temp:3900,luminosity:12,radius:5,visual:'proto'},
 {at:26, stage:'Головна послідовність',text:'У ядрі відбувається стабільний синтез гідрогену в гелій. Найдовша стадія для зорі сонячного типу.',temp:5800,luminosity:1,radius:1,visual:'main'},
 {at:68, stage:'Субгігант',text:'Гідроген у центрі вичерпується; оболонки розширюються, світність поступово зростає.',temp:5100,luminosity:5,radius:3,visual:'main'},
 {at:79, stage:'Червоний гігант',text:'Зовнішні шари сильно розширюються й охолоджуються. Синтез триває в шарах навколо ядра.',temp:3500,luminosity:1500,radius:105,visual:'giant'},
 {at:90, stage:'Скидання оболонки',text:'На пізніх стадіях зоря втрачає зовнішні шари. Газ може утворити планетарну туманність.',temp:13000,luminosity:500,radius:10,visual:'nebula'},
 {at:100, stage:'Білий карлик',text:'Залишається гаряче, компактне ядро. Термоядерне вироблення енергії припиняється, об’єкт остигає.',temp:25000,luminosity:.03,radius:.012,visual:'remnant'}
];
const dwarf = [
 {at:0,stage:'Газопилова хмара',text:'У ділянці молекулярної хмари формується майбутній червоний карлик.',temp:1800,luminosity:.03,radius:2,visual:'cloud'},
 {at:19,stage:'Протозоря',text:'Гравітаційне стискання підвищує температуру центральної частини.',temp:2700,luminosity:.015,radius:.6,visual:'proto'},
 {at:35,stage:'Червоний карлик',text:'Повільне й довготривале перетворення гідрогену на гелій у надрах.',temp:3050,luminosity:.0017,radius:.15,visual:'main'},
 {at:83,stage:'Дуже пізня стадія',text:'Теоретичний розвиток через надзвичайно великі проміжки часу. Жодна така зоря ще не встигла завершити життя.',temp:4000,luminosity:.005,radius:.2,visual:'main'},
 {at:100,stage:'Можливий білий карлик',text:'Схематичний далекий фінал низькомасивної зорі; деталі залежать від її маси та моделі.',temp:10000,luminosity:.0003,radius:.02,visual:'remnant'}
];
const massive = [
 {at:0,stage:'Масивна протозоря',text:'Дуже велика маса швидко набирається з навколишнього газу.',temp:6500,luminosity:2000,radius:18,visual:'proto'},
 {at:22,stage:'Гаряча головна послідовність',text:'В ядрі швидко витрачається гідроген. Життя масивних зір набагато коротше за сонячне.',temp:28000,luminosity:70000,radius:10,visual:'main'},
 {at:58,stage:'Надгігант',text:'Після головної послідовності склад і структура зорі змінюються. Колір надгіганта залежить від його шляху.',temp:4800,luminosity:100000,radius:400,visual:'giant'},
 {at:82,stage:'Пізні ядерні реакції',text:'В центральних областях можуть відбуватися реакції за участю дедалі важчих ядер.',temp:4300,luminosity:130000,radius:600,visual:'giant'},
 {at:94,stage:'Колапс ядра / наднова',text:'За відповідних умов ядро колапсує, можливий вибух наднової. Не всі масивні зорі вибухають однаково.',temp:18000,luminosity:1000000,radius:150,visual:'supernova'},
 {at:100,stage:'Компактний залишок',text:'Можливе утворення нейтронної зорі чи чорної діри; результат визначає, зокрема, маса ядра.',temp:500000,luminosity:.001,radius:.001,visual:'remnant'}
];
const remnant = [
 {at:0,stage:'Гарячий білий карлик',text:'У компактному зоряному залишку звичайні термоядерні реакції вже не тривають.',temp:65000,luminosity:1,radius:.008,visual:'remnant'},
 {at:45,stage:'Охолодження',text:'Білий карлик поступово випромінює накопичене тепло і стає тьмянішим.',temp:25000,luminosity:.05,radius:.008,visual:'remnant'},
 {at:100,stage:'Дуже холодний залишок',text:'Умовний дуже віддалений фінал: чорні карлики поки не могли сформуватися за час існування Всесвіту.',temp:3000,luminosity:.000001,radius:.008,visual:'remnant'}
];
const PATHS={solar,dwarf,massive,remnant};
export function getTrack(star){ return PATHS[star.track] || solar; }
export function getStage(star, progress) {
 const track=getTrack(star), p=Math.max(0,Math.min(100,progress));
 let i=track.length-1;
 for (let j=0;j<track.length;j++){if(track[j].at>p){i=Math.max(0,j-1);break;}}
 const s=track[i], next=track[Math.min(i+1,track.length-1)];
 const fraction=next===s?0:(p-s.at)/(next.at-s.at);
 const lerpLog=(a,b)=>a*Math.pow(b/a,Math.max(0,Math.min(1,fraction)));
 return {...s, fraction, temp:lerpLog(s.temp,next.temp),luminosity:lerpLog(s.luminosity,next.luminosity),radius:lerpLog(s.radius,next.radius)};
}
