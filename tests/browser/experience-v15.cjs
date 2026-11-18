const {chromium}=require(process.env.QA_PLAYWRIGHT_MODULE||'playwright');
const assert=require('node:assert/strict');
(async()=>{
 const b=await chromium.launch({executablePath:process.env.QA_BROWSER||undefined,headless:true,args:['--enable-webgl','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 try{
  const p=await b.newPage({viewport:{width:1440,height:1050},reducedMotion:'reduce'}),errors=[];
  p.on('pageerror',e=>errors.push(e.message));
  await p.route('**/photo-space.js',async r=>{await new Promise(resolve=>setTimeout(resolve,1200));await r.continue();});
  await p.goto(process.env.QA_URL||'http://127.0.0.1:4193',{waitUntil:'commit'});await p.waitForSelector('#app-loading');await p.waitForSelector('#app-loading',{state:'detached'});
  const samples=await p.locator('.pg-marquee > .pg-strip:first-child .current-work').evaluateAll(nodes=>nodes.map(n=>n.dataset.sample));
  assert.ok(samples.length>=20);assert.equal(new Set(samples).size,samples.length);
  const loaded=await p.locator('.pg-marquee > .pg-strip:first-child img').evaluateAll(async images=>Promise.all(images.map(async image=>{await image.decode();return image.naturalWidth>0;})));
  assert.ok(loaded.every(Boolean),'every showcase image must load');
  await p.locator('.pg-header-trial').click();await p.locator('.envelope-skip').click();
  assert.deepEqual(await p.locator('.tile-heading h2').allTextContents().then(x=>x.slice(0,6)),['信封贺卡','3D 照片树','3D 照片长廊','送你一片叶子','3D 照片空间','3D 文字空间']);
  await p.getByRole('button',{name:'选择3D 照片树',exact:true}).click();await p.waitForSelector('.gift-webgl-canvas[data-webgl=ready]');await p.waitForSelector('.scene-loading',{state:'detached'});
  await p.locator('[data-design=snow]').uncheck();assert.equal(await p.locator('.gift-snow').count(),0);await p.locator('[data-design=snow]').check();assert.equal(await p.locator('.gift-snow i').count(),36);
  for(const style of ['baubles','crystals','mixed']){await p.locator('[data-design=ornamentStyle]').selectOption(style);await p.waitForSelector('.scene-loading',{state:'detached'});assert.equal(await p.evaluate(()=>window.PagetoyouStudio.current().design.ornamentStyle),style);}
  await p.locator('[data-design=treeGifts]').uncheck();await p.waitForSelector('.scene-loading',{state:'detached'});await p.locator('[data-design=treeGifts]').check();await p.waitForSelector('.scene-loading',{state:'detached'});
  await p.getByRole('button',{name:'散开 · 照片星云',exact:true}).click();await p.waitForTimeout(700);assert.ok(await p.evaluate(()=>window.PagetoyouTree3D.metrics().distance)<5);assert.ok(await p.locator('.preview-wrap.full').count());
  await p.getByRole('button',{name:'聚合 · 圣诞树',exact:true}).click();await p.waitForTimeout(700);assert.ok(await p.evaluate(()=>window.PagetoyouTree3D.metrics().distance)>10);
  for(const tree of ['sakura','willow']){await p.locator('[data-design=tree]').selectOption(tree);await p.waitForSelector('.scene-loading',{state:'detached'});assert.equal(await p.locator('.gift-webgl-canvas').getAttribute('data-tree'),tree);assert.equal(await p.locator('[data-design=ornamentStyle]').isVisible(),false);assert.ok(await p.evaluate(()=>window.PagetoyouTree3D.metrics().calls)<120);}
  // Exiting immersive mode manually must not make aggregation reopen fullscreen.
  await p.getByRole('button',{name:'散开 · 照片星云',exact:true}).click();await p.waitForTimeout(700);
  await p.locator('#gift-full').click();await p.getByRole('button',{name:'聚合 · 垂柳光树',exact:true}).click();await p.waitForTimeout(700);assert.equal(await p.locator('.preview-wrap.full').count(),0);
  // A new tree species starts with its complete silhouette, even after exploring inside a cloud.
  await p.getByRole('button',{name:'散开 · 照片星云',exact:true}).click();await p.waitForTimeout(700);
  await p.locator('[data-design=tree]').selectOption('christmas');await p.waitForSelector('.scene-loading',{state:'detached'});
  assert.ok(await p.evaluate(()=>window.PagetoyouTree3D.metrics().distance)>10);assert.equal(await p.locator('.gift-webgl-canvas').getAttribute('data-mode'),'tree');
  for(const kind of ['gallery','photo3d','words','cake']){
   await p.evaluate(kind=>{const g=window.PagetoyouStudio.current();window.PagetoyouStudio.load({...g,kind,design:{...g.design,snow:true,photoIntro:'explore'}});},kind);
   assert.equal(await p.locator('.gift-snow').count(),1);await p.locator('[data-design=snow]').uncheck();assert.equal(await p.locator('.gift-snow').count(),0);
  }
  await p.route('**/memory-samples-v1.png?loading-probe',async r=>{await new Promise(resolve=>setTimeout(resolve,1200));await r.continue();});
  await p.evaluate(()=>{const g=window.PagetoyouStudio.current();window.PagetoyouStudio.load({...g,kind:'photo3d',photos:[{src:'/assets/stationery/memory-samples-v1.png?loading-probe',name:'加载验收',caption:''}],design:{...g.design,photoIntro:'explore'}});});
  await p.waitForSelector('.scene-loading');await p.waitForSelector('.scene-loading',{state:'detached'});
  for(const width of [390,768,1440]){await p.setViewportSize({width,height:1000});await p.evaluate(()=>window.PagetoyouStudio.catalog(true));assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);}
  assert.deepEqual(errors,[]);console.log('Unique showcases, template order, loading states, snow, ornaments, immersion, botanical trees and layouts: passed');
 }finally{await b.close();}
})().catch(e=>{console.error(e.message);process.exitCode=1;});
