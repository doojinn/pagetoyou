const {chromium}=require(process.env.QA_PLAYWRIGHT_MODULE||'playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.QA_BROWSER||undefined,headless:true,args:['--enable-webgl','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:1050},reducedMotion:'reduce'}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));await page.goto(process.env.QA_URL||'http://127.0.0.1:4193',{waitUntil:'domcontentloaded',timeout:process.env.QA_URL?90000:30000});
  await page.waitForFunction(()=>window.PagetoyouPhotoSamples&&window.PagetoyouTree3D);
  await page.evaluate(()=>window.PagetoyouStudio.load({kind:'tree',title:'回忆的树',author:'朋友',words:'见字如面',photos:window.PagetoyouPhotoSamples.photos(18),theme:'forest',zoom:85,transition:'fade',design:window.PagetoyouStationery.decorate({background:'midnight',packaging:false})}));
  await page.waitForSelector('.gift-webgl-canvas[data-webgl=ready]');
  const desktop=await page.evaluate(()=>window.PagetoyouTree3D.metrics());
  assert.equal(desktop.photos.length,18);assert.ok(desktop.calls<120,'ornaments must remain batched');
  await page.getByRole('button',{name:'散开 · 照片星云',exact:true}).click();await page.waitForSelector('.gift-webgl-canvas[data-mode=cloud]');await page.waitForTimeout(2600);
  const points=await page.evaluate(()=>window.PagetoyouTree3D.metrics().photos),rect=await page.locator('.gift-webgl-canvas').boundingBox();let opened=false;
  for(const point of points){if(point.x<.08||point.x>.92||point.y<.15||point.y>.73)continue;await page.mouse.click(rect.x+point.x*rect.width,rect.y+point.y*rect.height);if(await page.locator('.cosmos-photo-dialog[open]').count()){opened=true;break;}}
  assert.ok(opened,'a visible photograph must open from the 3D cloud');await page.getByRole('button',{name:'关闭照片',exact:true}).click();
  await page.getByRole('button',{name:'聚合 · 圣诞树',exact:true}).click();await page.waitForSelector('.gift-webgl-canvas[data-mode=tree]');
  await page.getByRole('tab',{name:'风格氛围',exact:true}).click();await page.locator('#gift-studio [data-design=background]').selectOption('sunroom');await page.waitForSelector('.gift-webgl-canvas[data-background=sunroom]');
  await page.locator('[aria-label="照片树画质"]').selectOption('low');
  await page.setViewportSize({width:390,height:844});await page.waitForTimeout(1000);
  const mobile=await page.evaluate(()=>window.PagetoyouTree3D.metrics());assert.ok(mobile.ornaments<desktop.ornaments);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  await page.locator('#workspace-style .workspace-options').filter({has:page.locator('[data-design=tree]')}).locator(':scope > summary').click();await page.locator('#gift-studio [data-design=tree]').selectOption('sakura');assert.equal(await page.locator('.gift-webgl-canvas').count(),1);
  await page.evaluate(()=>window.PagetoyouStudio.catalog(true));assert.equal(await page.locator('.gift-webgl-canvas').count(),0);
  assert.deepEqual(errors,[]);console.log('Tree batching, scatter/reassemble, photo picking, background, mobile quality and teardown: passed');
 }finally{await browser.close();}
})().catch(e=>{console.error(e.message);process.exitCode=1;});
