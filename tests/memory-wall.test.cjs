const {test}=require('node:test'),assert=require('node:assert/strict');
const {parseChunk,inside,convert}=require('../scripts/import-memory-wall.cjs');
const {createServer}=require('../scripts/serve-memory-wall.cjs');
test('Moect parser reads JSON without executing exported scripts',()=>{
  assert.deepEqual(parseChunk('window.__wxChunk = [{"text":"你好\\n世界"}];'),[{text:'你好\n世界'}]);
  assert.throws(()=>parseChunk('window.__wxChunk=[];globalThis.pwned=true;'));
  assert.throws(()=>parseChunk('window.__wxChunk={};'));
  assert.equal(globalThis.pwned,undefined);
});
test('asset paths cannot escape the chosen export directory',()=>{
  assert.equal(inside('C:/exports/chat','../secret.txt'),null);
  assert.ok(inside('C:/exports/chat','resources/image/1.png'));
});
test('conversion preserves all messages, order, and literal untrusted text',()=>{
  const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'pgy-memory-'));
  try{
    const msg=(id,t,text)=>({local_id:id,create_time:t,time_str:'2026-11-12 00:00:00',sender:'示例',is_sender:true,text,kind:'text',resources:[]});
    fs.writeFileSync(path.join(dir,'c000001.js'),'window.__wxChunk='+JSON.stringify([msg(2,1001,'<script>alert(1)</script>'),msg(1,1000,'第一句')]));
    const {data,assets}=convert(dir);
    assert.equal(data.stats.messages,2);assert.equal(data.sessions[0].messages[0].text,'第一句');
    assert.equal(data.sessions[0].messages[1].text,'<script>alert(1)</script>');assert.deepEqual(assets,{});
  }finally{
    // Only remove the fixture files created by this test; no recursive deletion.
    fs.unlinkSync(path.join(dir,'c000001.js'));fs.rmdirSync(dir);
  }
});
test('local server serves only the viewer and explicit private-data endpoints',async()=>{
  const server=createServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));
  const base='http://127.0.0.1:'+server.address().port;
  try{
    assert.equal((await fetch(base+'/')).status,200);
    assert.equal((await fetch(base+'/.data/memory-wall/assets.json')).status,404);
    assert.equal((await fetch(base+'/../package.json')).status,404);
    assert.equal((await fetch(base+'/memory.json',{method:'POST'})).status,405);
    assert.match((await fetch(base+'/')).headers.get('Content-Security-Policy'),/connect-src 'self'/);
  }finally{await new Promise(r=>server.close(r));}
});
