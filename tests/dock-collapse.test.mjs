import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {dirname,join,resolve,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const require=createRequire(import.meta.url);
let chromium;
try{({chromium}=require('playwright'));}catch{}
const sceneStub=`export class StarScene {
 constructor(){} setOrbitSpeed(){} setStarVisual(){} setMode(){}
 focus(){} setViewHome(){} rotate(){} zoom(){}
}`;

test('The life-cycle panel collapses and expands on desktop and phone',async t=>{
 if(!chromium)return t.skip('Install Playwright and Chromium to run the optional browser test');
 const server=createServer(async(request,response)=>{
  try{
   const name=decodeURIComponent(new URL(request.url,'http://localhost').pathname);
   const path=resolve(root,'.'+(name==='/'?'/index.html':name));
   if(path!==root&&!path.startsWith(root+sep)){response.writeHead(403).end();return;}
   const body=await readFile(path);
   const ext=path.split('.').at(-1);
   const contentType=ext==='html'?'text/html':ext==='js'?'text/javascript':ext==='css'?'text/css':'text/plain';
   response.writeHead(200,{'Content-Type':contentType+'; charset=utf-8'}).end(body);
  }catch{response.writeHead(404).end();}
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 let browser;
 try{
  try{browser=await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});}
  catch(error){
   if(/Executable doesn't exist|not found|ENOENT/i.test(error.message))return t.skip('Chromium is not installed in this environment');
   throw error;
  }
  const page=await browser.newPage({viewport:{width:1440,height:900}});
  // The interaction test isolates the interface from external Three.js and GPU support.
  await page.route('**/src/visual/scene.js',route=>route.fulfill({contentType:'text/javascript',body:sceneStub}));
  await page.goto(`http://127.0.0.1:${server.address().port}/`,{waitUntil:'networkidle'});
  await page.locator('#evolutionBtn').click();
  const toggle=page.locator('#toggleDock'),content=page.locator('#dockContent');
  assert.equal(await toggle.getAttribute('aria-expanded'),'true');
  assert.equal(await content.isVisible(),true);
  const progress=await page.locator('#mainSlider').inputValue();

  await toggle.click();
  assert.equal(await toggle.getAttribute('aria-expanded'),'false');
  assert.equal(await content.isVisible(),false);
  assert.equal(await page.locator('.dock-actions').isVisible(),false);
  assert.equal(await toggle.isVisible(),true);

  // Pressing Space must click the focused button, not trigger playback.
  await toggle.press('Space');
  assert.equal(await toggle.getAttribute('aria-expanded'),'true');
  assert.equal(await content.isVisible(),true);
  assert.equal(await page.locator('#mainSlider').inputValue(),progress);

  await page.setViewportSize({width:390,height:844});
  await toggle.click();
  assert.equal(await content.isVisible(),false);
  assert.equal(await toggle.isVisible(),true);
  await toggle.click();
  assert.equal(await content.isVisible(),true);

  await page.locator('#solarBtn').click();
  await toggle.click();
  assert.equal(await content.isVisible(),false);
  await toggle.click();
  assert.equal(await content.isVisible(),true);
 }finally{
  if(browser)await browser.close();
  await new Promise(resolve=>server.close(resolve));
 }
});
