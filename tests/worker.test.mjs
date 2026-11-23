import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import zlib from 'node:zlib';

test('worker decompresses gzip and parses quoted CSV safely',async()=>{
 const script=fs.readFileSync(new URL('../src/data/hyg-worker.js',import.meta.url),'utf8');
 const csv='id,proper,bf,hip,hd,gl,spect,lum,dist,absmag,mag,ci\n1,"Star, named",,101,,,G2V,1,4.3,4.83,1.0,0.65\n2,"Test ""B""",,102,,,M3V,0.01,7.2,12,8,1.5\n';
 const payload=zlib.gzipSync(Buffer.from(csv));
 const messages=[];
 const ctx={DecompressionStream,Response,fetch:async()=>new Response(payload,{status:200}),postMessage:msg=>messages.push(msg)};
 ctx.self=ctx;
 vm.runInNewContext(script,ctx,{filename:'hyg-worker.js'});
 await ctx.self.onmessage({data:{type:'load'}});
 const data=messages.find(m=>m.type==='data');
 assert(data,'expected data');assert.equal(data.rows.length,2);
 assert.equal(data.rows[0][1],'Star, named');assert.equal(data.rows[1][1],'Test "B"');
 assert.equal(data.rows[0][6],'G2V');
});
