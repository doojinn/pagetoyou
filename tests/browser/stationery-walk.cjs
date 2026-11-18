const {chromium}=require(process.env.QA_PLAYWRIGHT_MODULE||'playwright');
const {createApp}=require('../../backend.cjs');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');

(async()=>{
 const external=process.env.QA_URL,app=external?null:createApp({dataDir:fs.mkdtempSync(path.join(os.tmpdir(),'pgy-stationery-'))});
 if(app)await new Promise(r=>app.listen(0,'127.0.0.1',r));
 const base=external||`http://127.0.0.1:${app.address().port}`;
 const browser=await chromium.launch({executablePath:process.env.QA_BROWSER||undefined,headless:true});
 try{
  const p=await browser.newPage({viewport:{width:1440,height:1000}}),guest=await browser.newPage({viewport:{width:390,height:844},reducedMotion:'reduce'}),errors=[];
  p.on('pageerror',e=>errors.push(e.message));guest.on('pageerror',e=>errors.push(e.message));
  if(external){p.setDefaultTimeout(90000);guest.setDefaultTimeout(90000);}
  await p.goto(base,{waitUntil:'domcontentloaded'});
  await p.locator('.pg-header-trial').click();
  assert.equal(await p.locator('.collection-card').count(),12);
  await p.getByRole('button',{name:'花卉',exact:true}).click();assert.equal(await p.locator('.collection-card').count(),5);
  await p.getByRole('button',{name:'全部',exact:true}).click();
  const collection=[['橄榄来信','olive'],['玫瑰花园','rose-garden'],['蓝瓷花笺','blue-porcelain'],['奶油丝带','ribbon-stripe'],['远方的手稿','midnight-gold'],['花落在纸上','pressed-flower']];
  for(const [name,id]of collection){
   await p.getByRole('button',{name:'选择信笺套系：'+name,exact:true}).click();
   const source=await p.locator('.suite-preview-paper').evaluate(n=>getComputedStyle(n).backgroundImage.match(/url\("?(.*?)"?\)/)[1]);
   assert.equal(await p.evaluate(async url=>{const r=await fetch(url);if(r.status!==200)return r.status;const blob=await r.blob(),image=await createImageBitmap(blob);const valid=image.width>0&&image.height>0;image.close();return valid?200:0;},source),200,'missing or undecodable artwork '+id);
   assert.equal(await p.locator('.suite-preview-paper').getAttribute('data-suite'),id);
  }
  // A timed, interactive preview must open the actual liner and extract the letter.
  await p.getByRole('button',{name:'选择信笺套系：蓝瓷花笺',exact:true}).click();
  await p.locator('[aria-label="信封内衬"]').selectOption('stripe');await p.locator('[aria-label="邮局印记"]').selectOption('postmark');
  await p.locator('[aria-label="收信人名字"]').fill('小林');await p.locator('.seal-toggle input').check();await p.locator('[data-wax=pearl]').click();await p.locator('.closure-choice select').selectOption('cord');
  await p.locator('.preview-envelope').click();await p.locator('.atelier-preview-dialog .unwrap-action').click();await p.waitForSelector('.atelier-preview-dialog .is-untied');
  await p.locator('.atelier-preview-dialog .unwrap-action').click();await p.waitForSelector('.atelier-preview-dialog .is-unfolding');await p.waitForSelector('.atelier-preview-opened');
  assert.equal(await p.locator('.atelier-preview-opened .atelier-paper').getAttribute('data-suite'),'blue-porcelain');
  await p.locator('.atelier-preview-close').click();
  for(const width of [390,768,1440]){await p.setViewportSize({width,height:1000});assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'picker overflow at '+width);}
  await p.locator('.envelope-choose').click();await p.getByRole('button',{name:'选择信封贺卡',exact:true}).click();
  const design=await p.evaluate(()=>window.PagetoyouCard.current().design);
  for(const [k,v]of Object.entries({suite:'blue-porcelain',liner:'stripe',stamp:'postmark',recipient:'小林',sealStyle:'pearl',opening:'cord'}))assert.equal(design[k],v);
  // Normal editing must retain artwork, while a custom photo backdrop takes precedence.
  await p.locator('#pg-canvas .pg-element').first().click();
  await p.locator('#pg-content').fill('A LETTER FOR YOU');await p.locator('#pg-content').dispatchEvent('change');
  assert.equal(await p.locator('#pg-canvas').getAttribute('data-suite'),'blue-porcelain');
  for(const [name,id]of [['玫瑰花园','rose-garden'],['蓝瓷花笺','blue-porcelain']]){
   await p.locator('#pgy-prototype .change-envelope').click();await p.getByRole('button',{name:'选择信笺套系：'+name,exact:true}).click();
   await p.locator('.envelope-choose').click();assert.equal(await p.locator('#pg-canvas').getAttribute('data-suite'),id);
   assert.match(await p.locator('#pg-canvas').textContent(),/A LETTER FOR YOU/);
  }
  // Re-selecting a collection uses its coordinated default closure; restore this test's custom seal and cord.
  await p.locator('#pgy-prototype .change-envelope').click();await p.locator('.seal-toggle input').check();await p.locator('[data-wax=pearl]').click();await p.locator('.closure-choice select').selectOption('cord');await p.locator('.envelope-choose').click();
  await p.evaluate(()=>window.PagetoyouCard.load({...window.PagetoyouCard.current(),design:{...window.PagetoyouCard.current().design,backgroundImage:'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl6kYAAAAAASUVORK5CYII='}},false));
  assert.equal(await p.locator('.pg-stage').getAttribute('data-suite'),null);
  await p.evaluate(()=>{const g=window.PagetoyouCard.current();delete g.design.backgroundImage;window.PagetoyouCard.load(g,false);});
  const api=async(url,method='GET',data)=>p.evaluate(async({url,method,data})=>{const r=await fetch(url,{method,headers:{'Content-Type':'application/json','X-Pgy-Request':'1'},body:data?JSON.stringify(data):undefined});return{status:r.status,json:await r.json()};},{url,method,data});
  const password=crypto.randomBytes(24).toString('hex');const registration=await api('/api/auth/register','POST',{username:'qa_'+crypto.randomBytes(8).toString('hex'),password,displayName:'信笺验收'});assert.equal(registration.status,201);
  const gift=await p.evaluate(()=>window.PagetoyouCard.current()),saved=await api('/api/gifts','POST',{gift});assert.equal(saved.status,201);
  const published=await api('/api/gifts/'+saved.json.gift.id+'/publish','POST',{revision:1});assert.equal(published.status,200);
  await guest.goto(base+'/g/'+published.json.gift.token,{waitUntil:'domcontentloaded'});await guest.waitForSelector('.stationery-ritual');
  const envelope=guest.locator('.stationery-ritual .tactile-envelope');
  for(const [k,v]of Object.entries({'data-suite':'blue-porcelain','data-liner':'stripe','data-stamp':'postmark','data-seal-style':'pearl'}))assert.equal(await envelope.getAttribute(k),v);
  assert.match(await guest.locator('.stationery-ritual h2').textContent(),/小林/);
  await guest.locator('.unwrap-action').click();await guest.waitForSelector('.is-untied');await guest.locator('.unwrap-action').click();await guest.waitForSelector('.gift-ritual',{state:'detached'});
  assert.equal(await guest.locator('#pg-gift').getAttribute('data-suite'),'blue-porcelain');assert.match(await guest.locator('#pg-gift').textContent(),/A LETTER FOR YOU/);
  assert.equal(await guest.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  assert.equal((await api('/api/gifts/'+saved.json.gift.id,'DELETE')).status,200);await api('/api/auth/logout','POST',{});
  assert.deepEqual(errors,[]);console.log('Six collections, artwork, responsive picker, timed unwrapping, editing and anonymous published stationery: passed');
 }finally{await browser.close();if(app)await new Promise(r=>app.close(r));}
})().catch(e=>{console.error(e.message);process.exitCode=1;});
