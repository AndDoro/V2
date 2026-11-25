import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {dirname,resolve} from 'node:path';
import {runInNewContext} from 'node:vm';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const html=readFileSync(resolve(root,'index.html'),'utf8');
const css=readFileSync(resolve(root,'assets/styles.css'),'utf8');
const app=readFileSync(resolve(root,'src/app.js'),'utf8');

test('dock toggle is accessible and preserves the ability to reopen',()=>{
 assert.match(html,/id="toggleDock"[^>]*aria-expanded="true"[^>]*aria-controls="dockContent"/);
 assert.match(html,/class="dock-content" id="dockContent"/);
 assert.match(css,/\.bottom-dock\.is-collapsed \.dock-content[^\{]*\{display:none\}/);
 assert.match(css,/\.bottom-dock\.is-collapsed \.dock-actions[^\{]*\{display:none\}/);
 const match=app.match(/\$\('toggleDock'\)\.addEventListener\('click',\(\)=>\{([\s\S]*?)\n\}\);/);
 assert.ok(match,'the toggle must have an actual click handler');
 const classes=new Set(),attributes=new Map();
 const dock={classList:{toggle(className){if(classes.has(className)){classes.delete(className);return false;}classes.add(className);return true;}}};
 const button={setAttribute(name,value){attributes.set(name,value);},title:''};
 const handler=runInNewContext(`($)=>()=>{${match[1]}}`) (id=>id==='toggleDock'?button:dock);
 handler();
 assert.ok(classes.has('is-collapsed'));
 assert.equal(attributes.get('aria-expanded'),'false');
 assert.equal(attributes.get('aria-label'),'Розгорнути панель керування');
 handler();
 assert.ok(!classes.has('is-collapsed'));
 assert.equal(attributes.get('aria-expanded'),'true');
 assert.equal(attributes.get('aria-label'),'Згорнути панель керування');
});
