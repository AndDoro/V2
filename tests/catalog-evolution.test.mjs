import test from 'node:test';
import assert from 'node:assert/strict';
import {STARS,STAR_BY_ID} from '../src/data/stars.js';
import '../src/data/named-stars.js';
import {searchStar,addHygRows} from '../src/data/catalog.js';
import {getTrack,getStage} from '../src/science/evolution.js';

test('local index includes a named-star source without invented physical parameters',()=>{
 assert.equal(STARS.length,590);
 assert.equal(STARS.filter(s=>s.track==='unknown').length,581);
 const named=STARS.find(s=>s.name==='Acamar');
 assert.equal(named.mass,null);assert.equal(named.luminosity,null);
 assert.equal(named.track,'unknown');
 assert.equal(getTrack(named).length,1);
 assert.match(getStage(named,50).stage,/невідомі/i);
});
test('all educational paths start at 0 and end at 100',()=>{
 for(const key of ['sun','proxima','betelgeuse','sirius-b']){
  const track=getTrack(STAR_BY_ID[key]);
  assert.equal(track[0].at,0);assert.equal(track.at(-1).at,100);
  assert.equal(getStage(STAR_BY_ID[key],0).stage,track[0].stage);
  assert.equal(getStage(STAR_BY_ID[key],100).stage,track.at(-1).stage);
  for(let i=1;i<track.length;i++)assert(track[i].at>track[i-1].at);
 }
});
test('catalog merges observed values into placeholder without pretending to know mass/radius',()=>{
 const before=STARS.length;const target=STARS.find(s=>s.name==='Acamar');
 const added=addHygRows([
  ['17','Acamar','Th1 Eri','13847','18622','','A1V','80','49','-1','2.9','0.1'],
  ['18','','','2345','3456','','M3V','0.02','8.5','10','9','1.2'],
  ['19','Vega','','91262','','','A0V','40','7.7','0.5','0','0']
 ]);
 assert.equal(added,1);assert.equal(STARS.length,before+1);
 assert.strictEqual(target,STAR_BY_ID[target.id]);assert.equal(target.track,'solar');
 assert.equal(target.temp,9000);assert.equal(target.temperatureEstimated,true);
 assert.equal(target.mass,null);assert.equal(target.radius,null);
 assert(STARS.some(s=>s.name==='HIP 2345'));
 assert.equal(searchStar(target,'HIP 13847'),true);
 assert.equal(searchStar(target,'неіснуюча'),false);
});
