import test from 'node:test';
import assert from 'node:assert/strict';
import {STAR_BY_ID, STARS} from '../src/data/stars.js';
import '../src/data/named-stars.js';
import {sampleEvolutionPath,getStage,getTrack} from '../src/science/evolution.js';

test('only the selected star produces a sample path, with a moving endpoint',()=>{
 const star=STAR_BY_ID.sun;
 const earlier=sampleEvolutionPath(star,30);
 const later=sampleEvolutionPath(star,90);
 assert(earlier.length>2);assert(later.length>earlier.length);
 assert(earlier.every(p=>p.at>=14&&p.at<=30));
 assert(later.every(p=>p.at>=14&&p.at<=90));
 assert.equal(earlier.at(-1).at,30);assert.equal(later.at(-1).at,90);
 assert.notEqual(earlier.at(-1).temp,later.at(-1).temp);
 assert.notEqual(earlier.at(-1).luminosity,later.at(-1).luminosity);
 assert.equal(later.at(-1).temp,getStage(star,90).temp);
});
test('cloud and unclassified objects do not get fictitious HR coordinates',()=>{
 assert.deepEqual(sampleEvolutionPath(STAR_BY_ID.sun,0),[]);
 assert.deepEqual(sampleEvolutionPath(STAR_BY_ID.sun,13.99),[]);
 const unknown=STARS.find(s=>s.track==='unknown');
 assert(unknown);assert.deepEqual(sampleEvolutionPath(unknown,100),[]);
});
test('massive and white-dwarf tracks extend through their modelled endpoints',()=>{
 for(const id of ['betelgeuse','sirius-b','proxima']){
  const star=STAR_BY_ID[id];const points=sampleEvolutionPath(star,100);
  assert(points.length>3);
  const expected=getTrack(star).at(-1);
  assert.equal(points.at(-1).temp,expected.temp);
  assert.equal(points.at(-1).luminosity,expected.luminosity);
 }
});
